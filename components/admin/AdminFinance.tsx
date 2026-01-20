
import React, { useState, useMemo } from 'react';
import { DollarSign, TrendingUp, Clock, ShoppingBag, History } from 'lucide-react';
import { Order } from '../../types';
import { getDashboardChartData } from '../../services/mockService';

interface AdminFinanceProps {
    finance: any;
    orders: Order[];
    setActiveTab: (tab: any) => void;
}

const AdminFinance: React.FC<AdminFinanceProps> = ({ finance, orders, setActiveTab }) => {
    const [chartPeriod, setChartPeriod] = useState<'7d' | '30d' | '12m'>('30d');
    const [chartMetric, setChartMetric] = useState<'revenue' | 'orders'>('revenue');
    const [hoveredPoint, setHoveredPoint] = useState<any | null>(null);

    const chartData = useMemo(() => {
        return getDashboardChartData(chartPeriod);
    }, [chartPeriod]);

    // --- CHART HELPERS ---
    const chartConfig = useMemo(() => {
        if (chartData.length === 0) return null;
        const values = chartData.map(d => chartMetric === 'revenue' ? d.value : d.count);
        const max = Math.max(...values, 1);
        const height = 200;
        const width = 800; // viewBox width
        const xStep = width / (chartData.length - 1 || 1);
        
        const points = chartData.map((d, i) => {
            const val = chartMetric === 'revenue' ? d.value : d.count;
            const x = i * xStep;
            const y = height - ((val / max) * height * 0.8) - 10; // 10px padding
            return { x, y, ...d, displayValue: val };
        });

        // Bezier curve path
        let d = `M ${points[0].x} ${points[0].y}`;
        for (let i = 1; i < points.length; i++) {
            const p0 = points[i - 1];
            const p1 = points[i];
            const cpX = (p0.x + p1.x) / 2;
            d += ` C ${cpX} ${p0.y}, ${cpX} ${p1.y}, ${p1.x} ${p1.y}`;
        }

        // Area path (closed loop)
        const areaPath = `${d} L ${points[points.length - 1].x} ${height} L 0 ${height} Z`;

        return { points, linePath: d, areaPath, max, height, width, xStep };
    }, [chartData, chartMetric]);

    return (
        <div className="space-y-8 animate-fade-in">
             {/* Top KPI Row */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="bg-[#1d1d1f] text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-[#B8860B]/10 rounded-full blur-2xl pointer-events-none"></div>
                     <p className="text-xs font-bold uppercase tracking-widest text-[#B8860B] mb-2 flex items-center gap-2"><DollarSign size={14}/> Receita Total (Histórico)</p>
                     <h3 className="text-3xl font-serif font-bold">R$ {finance.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
                     <p className="text-[10px] text-white/50 mt-1">Acumulado desde o início.</p>
                 </div>
                 <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                     <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-2"><TrendingUp size={14}/> Ticket Médio</p>
                     <h3 className="text-3xl font-serif font-bold text-[#1d1d1f]">R$ {finance.avgTicket.toFixed(2)}</h3>
                     <p className="text-[10px] text-gray-400 mt-1">Média por pedido realizado.</p>
                 </div>
                 <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                     <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-2"><Clock size={14}/> A Receber (Pendente)</p>
                     <h3 className="text-3xl font-serif font-bold text-[#1d1d1f]">
                         R$ {orders.filter(o => o.status === 'pending').reduce((acc, o) => acc + o.total, 0).toFixed(2)}
                     </h3>
                     <p className="text-[10px] text-gray-400 mt-1">Aguardando confirmação.</p>
                 </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                 {/* Main Chart Section */}
                 <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden flex flex-col">
                     {/* Controls Header */}
                     <div className="p-6 border-b border-gray-50 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/30">
                         <div className="flex bg-gray-100 p-1 rounded-lg">
                             <button onClick={() => setChartMetric('revenue')} className={`px-4 py-2 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${chartMetric === 'revenue' ? 'bg-white shadow-sm text-[#1d1d1f]' : 'text-gray-400 hover:text-gray-600'}`}>
                                 <DollarSign size={14}/> Receita
                             </button>
                             <button onClick={() => setChartMetric('orders')} className={`px-4 py-2 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${chartMetric === 'orders' ? 'bg-white shadow-sm text-[#1d1d1f]' : 'text-gray-400 hover:text-gray-600'}`}>
                                 <ShoppingBag size={14}/> Pedidos
                             </button>
                         </div>
                         <div className="flex gap-2">
                             {['7d', '30d', '12m'].map(period => (
                                 <button 
                                     key={period}
                                     onClick={() => setChartPeriod(period as any)}
                                     className={`px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase transition-all ${chartPeriod === period ? 'bg-[#1d1d1f] text-white border-[#1d1d1f]' : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'}`}
                                 >
                                     {period === '7d' ? '7 Dias' : period === '30d' ? '30 Dias' : '1 Ano'}
                                 </button>
                             ))}
                         </div>
                     </div>

                     {/* Interactive Chart */}
                     <div className="relative h-[300px] w-full p-6 group cursor-crosshair">
                         {chartConfig && (
                             <svg viewBox={`0 0 ${chartConfig.width} ${chartConfig.height}`} className="w-full h-full overflow-visible">
                                 {/* Gradients */}
                                 <defs>
                                     <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                         <stop offset="0%" stopColor={chartMetric === 'revenue' ? '#B8860B' : '#3b82f6'} stopOpacity="0.2" />
                                         <stop offset="100%" stopColor={chartMetric === 'revenue' ? '#B8860B' : '#3b82f6'} stopOpacity="0" />
                                     </linearGradient>
                                 </defs>

                                 {/* Grid Lines (Horizontal) */}
                                 {[0, 0.25, 0.5, 0.75, 1].map(t => (
                                     <line 
                                         key={t} 
                                         x1="0" y1={chartConfig.height * t} 
                                         x2={chartConfig.width} y2={chartConfig.height * t} 
                                         stroke="#f3f4f6" strokeWidth="1" 
                                         strokeDasharray="4 4"
                                     />
                                 ))}

                                 {/* Area & Line */}
                                 <path d={chartConfig.areaPath} fill="url(#chartGradient)" className="transition-all duration-500 ease-in-out" />
                                 <path 
                                     d={chartConfig.linePath} 
                                     fill="none" 
                                     stroke={chartMetric === 'revenue' ? '#B8860B' : '#3b82f6'} 
                                     strokeWidth="3" 
                                     strokeLinecap="round" 
                                     strokeLinejoin="round"
                                     className="transition-all duration-500 ease-in-out drop-shadow-md"
                                 />

                                 {/* Interactive Areas (Invisible bars) */}
                                 {chartConfig.points.map((p, i) => (
                                     <rect
                                         key={i}
                                         x={p.x - (chartConfig.xStep / 2)}
                                         y="0"
                                         width={chartConfig.xStep}
                                         height={chartConfig.height}
                                         fill="transparent"
                                         onMouseEnter={() => setHoveredPoint(p)}
                                         onMouseLeave={() => setHoveredPoint(null)}
                                     />
                                 ))}

                                 {/* Hover Indicator Point */}
                                 {hoveredPoint && (
                                     <circle 
                                         cx={hoveredPoint.x} 
                                         cy={hoveredPoint.y} 
                                         r="6" 
                                         fill="white" 
                                         stroke={chartMetric === 'revenue' ? '#B8860B' : '#3b82f6'} 
                                         strokeWidth="3" 
                                         className="animate-pulse shadow-lg"
                                     />
                                 )}
                             </svg>
                         )}

                         {/* Tooltip Overlay */}
                         {hoveredPoint && (
                             <div 
                                 className="absolute z-20 pointer-events-none bg-[#1d1d1f] text-white p-3 rounded-xl shadow-2xl flex flex-col items-center -translate-x-1/2 -translate-y-full border border-white/10 backdrop-blur-md"
                                 style={{ 
                                     left: `${(hoveredPoint.x / (chartConfig?.width || 1)) * 100}%`, 
                                     top: `${(hoveredPoint.y / (chartConfig?.height || 1)) * 100}%`,
                                     marginTop: '-15px'
                                 }}
                             >
                                 <span className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-1">{hoveredPoint.date}</span>
                                 <span className="text-xl font-serif font-bold">
                                     {chartMetric === 'revenue' ? `R$ ${hoveredPoint.value.toFixed(2)}` : `${hoveredPoint.count} Pedidos`}
                                 </span>
                                 {chartMetric === 'revenue' && (
                                     <span className="text-[9px] mt-1 bg-white/10 px-2 py-0.5 rounded-full">{hoveredPoint.count} transações</span>
                                 )}
                                 <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-[#1d1d1f] rotate-45 border-r border-b border-white/10"></div>
                             </div>
                         )}
                     </div>
                 </div>

                 {/* Recent Transactions Side List */}
                 <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col h-[400px] lg:h-auto">
                     <h4 className="text-[10px] font-bold text-[#86868b] uppercase tracking-widest mb-4 flex items-center gap-2">
                         <History size={14}/> Transações Recentes
                     </h4>
                     <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                         {orders.slice(0, 10).map((order) => (
                             <div key={order.id} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-100 group">
                                 <div className="flex items-center gap-3">
                                     <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[10px] ${order.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                                         {order.customerName.charAt(0)}
                                     </div>
                                     <div>
                                         <p className="text-xs font-bold text-[#1d1d1f]">{order.customerName}</p>
                                         <p className="text-[9px] text-gray-400">{order.date}</p>
                                     </div>
                                 </div>
                                 <div className="text-right">
                                     <p className="text-xs font-bold text-[#1d1d1f]">R$ {order.total.toFixed(0)}</p>
                                     <span className="text-[8px] uppercase tracking-wide text-[#B8860B] opacity-0 group-hover:opacity-100 transition-opacity">Ver</span>
                                 </div>
                             </div>
                         ))}
                     </div>
                     <button onClick={() => setActiveTab('orders')} className="mt-4 w-full py-3 bg-[#F5F5F7] text-[#1d1d1f] font-bold text-[9px] uppercase tracking-widest rounded-lg hover:bg-[#1d1d1f] hover:text-white transition-all">
                         Ver todos os pedidos
                     </button>
                 </div>
             </div>
        </div>
    );
};

export default AdminFinance;
