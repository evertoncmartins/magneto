
import React, { useState, useMemo, useEffect } from 'react';
import { 
    DollarSign, ShoppingBag, Users, Activity, 
    Search, Filter, ArrowUpRight, ArrowDownRight,
    Layers, Wallet, Calendar, X, MousePointerClick, ChevronRight, BarChart3
} from 'lucide-react';
import { Order } from '../../types';
import { getUsers } from '../../services/mockService';

interface AdminFinanceProps {
    finance: any;
    orders: Order[];
    setActiveTab: (tab: any) => void;
}

// --- HELPERS DE DATA ROBUSTOS (Fuso Horário Safe) ---

// Converte string "DD/MM/YYYY" (formato do pedido) para Date Local (meia-noite)
const parseOrderDate = (dateStr: string): Date => {
    const [day, month, year] = dateStr.split('/').map(Number);
    return new Date(year, month - 1, day);
};

// Converte string "YYYY-MM-DD" (formato do input) para Date Local (meia-noite)
const parseInputDate = (dateStr: string): Date => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
};

// Formata Date para "YYYY-MM-DD" (para value do input)
const formatDateForInput = (date: Date): string => {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
};

const AdminFinance: React.FC<AdminFinanceProps> = ({ finance, orders, setActiveTab }) => {
    // Inicializa com os últimos 30 dias
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return formatDateForInput(d);
    });
    const [endDate, setEndDate] = useState(() => formatDateForInput(new Date()));
    
    const [activePreset, setActivePreset] = useState<'Weekly' | 'Monthly' | 'Yearly' | 'Custom'>('Monthly');
    const [orderSearch, setOrderSearch] = useState('');
    const [selectedDateFilter, setSelectedDateFilter] = useState<string | null>(null); // Armazena um ID ou Label único do período
    const [selectedStatusFilter, setSelectedStatusFilter] = useState<string | null>(null);
    
    // Handler para Presets
    const applyPreset = (type: 'Weekly' | 'Monthly' | 'Yearly') => {
        const end = new Date();
        const start = new Date();
        if (type === 'Weekly') start.setDate(end.getDate() - 6);
        else if (type === 'Monthly') start.setDate(end.getDate() - 29);
        else if (type === 'Yearly') start.setFullYear(end.getFullYear() - 1);

        setStartDate(formatDateForInput(start));
        setEndDate(formatDateForInput(end));
        setActivePreset(type);
        setSelectedDateFilter(null);
    };

    const handleDateChange = (type: 'start' | 'end', value: string) => {
        if (type === 'start') setStartDate(value);
        else setEndDate(value);
        setActivePreset('Custom');
        setSelectedDateFilter(null);
    };

    // --- 1. FILTRAGEM DE PEDIDOS POR DATA (BASE) ---
    const filteredOrdersByDate = useMemo(() => {
        const start = parseInputDate(startDate);
        const end = parseInputDate(endDate);
        end.setHours(23, 59, 59, 999);

        return orders.filter(o => {
            if (o.deleted) return false;
            const orderDate = parseOrderDate(o.date);
            return orderDate >= start && orderDate <= end;
        });
    }, [orders, startDate, endDate]);

    const usersCount = getUsers().length;
    
    // Ticket Médio no Período
    const periodAvgTicket = filteredOrdersByDate.length > 0 
        ? filteredOrdersByDate.reduce((acc, o) => acc + o.total, 0) / filteredOrdersByDate.length 
        : 0;

    // --- 2. DADOS DO GRÁFICO (GRANULARIDADE DINÂMICA) ---
    const chartData = useMemo(() => {
        const data = [];
        const start = parseInputDate(startDate);
        const end = parseInputDate(endDate);
        
        // Calcular diferença em dias
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 inclusivo

        // Determinar Granularidade
        let granularity: 'day' | 'week' | 'month' | 'year' = 'day';
        
        if (diffDays > 366) granularity = 'year';     // Mais de 1 ano -> Agrupa por Ano
        else if (diffDays > 60) granularity = 'month'; // Mais de 2 meses -> Agrupa por Mês
        else if (diffDays > 30) granularity = 'week';  // Mais de 30 dias -> Agrupa por Semana

        const current = new Date(start);
        
        // Loop principal
        while (current <= end) {
            let bucketEnd = new Date(current);
            let label = '';
            let fullDateId = ''; // ID único para o filtro
            let tooltipLabel = '';

            if (granularity === 'day') {
                // Fim do bucket é o próprio dia
                label = current.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                fullDateId = current.toISOString().split('T')[0]; // YYYY-MM-DD
                tooltipLabel = current.toLocaleDateString('pt-BR');
                bucketEnd = new Date(current); 
                current.setDate(current.getDate() + 1);

            } else if (granularity === 'week') {
                // Semana: Início + 6 dias
                bucketEnd.setDate(current.getDate() + 6);
                if (bucketEnd > end) bucketEnd = new Date(end);

                const day = current.getDate().toString().padStart(2, '0');
                const monthStr = current.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
                const capitalizedMonth = monthStr.charAt(0).toUpperCase() + monthStr.slice(1);
                
                label = `${day}/${capitalizedMonth}`;
                fullDateId = `W-${current.toISOString().split('T')[0]}`;
                tooltipLabel = `Semana de ${current.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`;
                current.setDate(current.getDate() + 7);

            } else if (granularity === 'month') {
                // Mês: Do dia atual até o fim do mês
                const monthStr = current.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
                const yearStr = current.toLocaleDateString('pt-BR', { year: '2-digit' });
                const capitalizedMonth = monthStr.charAt(0).toUpperCase() + monthStr.slice(1);
                
                label = `${capitalizedMonth}/${yearStr}`;
                fullDateId = `M-${current.getMonth()}-${current.getFullYear()}`;
                tooltipLabel = current.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

                bucketEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
                if (bucketEnd > end) bucketEnd = new Date(end);

                current.setMonth(current.getMonth() + 1);
                current.setDate(1); 

            } else if (granularity === 'year') {
                // Ano: Do dia atual até o fim do ano
                label = current.getFullYear().toString();
                fullDateId = `Y-${current.getFullYear()}`;
                tooltipLabel = `Ano de ${current.getFullYear()}`;

                // Fim do bucket é 31 de Dezembro deste ano
                bucketEnd = new Date(current.getFullYear(), 11, 31);
                if (bucketEnd > end) bucketEnd = new Date(end);

                // Avança para o próximo ano
                current.setFullYear(current.getFullYear() + 1);
                current.setMonth(0);
                current.setDate(1);
            }

            // Filtra pedidos dentro do Bucket (Intervalo fechado [start, end])
            let filterStart: Date;
            let filterEnd: Date;

            if (granularity === 'day') {
                filterStart = parseInputDate(fullDateId); 
                filterEnd = new Date(filterStart);
            } else if (granularity === 'week') {
                const parts = fullDateId.split('W-')[1];
                filterStart = parseInputDate(parts);
                filterEnd = new Date(filterStart);
                filterEnd.setDate(filterEnd.getDate() + 6);
            } else if (granularity === 'month') {
                const [_, m, y] = fullDateId.split('-');
                filterStart = new Date(parseInt(y), parseInt(m), 1);
                filterEnd = new Date(parseInt(y), parseInt(m) + 1, 0);
            } else {
                // Year
                const [_, y] = fullDateId.split('-');
                filterStart = new Date(parseInt(y), 0, 1); // 1 Jan
                filterEnd = new Date(parseInt(y), 11, 31); // 31 Dec
            }
            
            if (filterStart < start) filterStart = start;
            if (filterEnd > end) filterEnd = end;
            
            filterEnd.setHours(23, 59, 59, 999);

            const bucketOrders = filteredOrdersByDate.filter(o => {
                const oDate = parseOrderDate(o.date);
                return oDate >= filterStart && oDate <= filterEnd && o.status !== 'cancelled';
            });

            const bucketTotal = bucketOrders.reduce((acc, o) => acc + o.total, 0);

            data.push({
                fullDate: fullDateId,
                label,
                tooltipLabel,
                value: bucketTotal,
                orderCount: bucketOrders.length,
                filterRange: { start: filterStart, end: filterEnd }
            });
        }

        return { data, granularity };
    }, [startDate, endDate, filteredOrdersByDate]);

    // Totais do Período Selecionado
    const periodRevenue = filteredOrdersByDate.filter(o => o.status !== 'cancelled').reduce((acc, o) => acc + o.total, 0);
    const maxChartValue = Math.max(...chartData.data.map(d => d.value), 10);

    // --- 3. DADOS DO GRÁFICO DE ROSCA (STATUS) ---
    const statusData = useMemo(() => {
        const total = filteredOrdersByDate.length || 1;
        const counts = {
            delivered: filteredOrdersByDate.filter(o => o.status === 'delivered').length,
            shipped: filteredOrdersByDate.filter(o => o.status === 'shipped').length,
            pending: filteredOrdersByDate.filter(o => o.status === 'pending').length,
            production: filteredOrdersByDate.filter(o => o.status === 'production').length,
        };
        
        return [
            { id: 'delivered', label: 'Entregue', value: counts.delivered, color: '#10B981', percent: (counts.delivered/total)*100 },
            { id: 'shipped', label: 'Enviado', value: counts.shipped, color: '#8B5CF6', percent: (counts.shipped/total)*100 },
            { id: 'production', label: 'Produção', value: counts.production, color: '#3B82F6', percent: (counts.production/total)*100 },
            { id: 'pending', label: 'Pendente', value: counts.pending, color: '#F59E0B', percent: (counts.pending/total)*100 },
        ].filter(d => d.value > 0);
    }, [filteredOrdersByDate]);

    // --- 4. TOP PRODUTOS (NO PERÍODO) ---
    const topProducts = useMemo(() => {
        const stats = {
            'Kit Start (3 Ímãs)': { sold: 0, revenue: 0, color: '#1d1d1f' },
            'Kit Memories (6 Ímãs)': { sold: 0, revenue: 0, color: '#B8860B' },
            'Kit Gallery (9+ Ímãs)': { sold: 0, revenue: 0, color: '#52525B' },
        };

        filteredOrdersByDate.forEach(o => {
            if (o.status === 'cancelled') return;
            if (o.itemsCount <= 3) {
                stats['Kit Start (3 Ímãs)'].sold++;
                stats['Kit Start (3 Ímãs)'].revenue += o.total;
            } else if (o.itemsCount <= 6) {
                stats['Kit Memories (6 Ímãs)'].sold++;
                stats['Kit Memories (6 Ímãs)'].revenue += o.total;
            } else {
                stats['Kit Gallery (9+ Ímãs)'].sold++;
                stats['Kit Gallery (9+ Ímãs)'].revenue += o.total;
            }
        });

        const sorted = Object.entries(stats)
            .map(([name, data]) => ({ name, ...data }))
            .sort((a, b) => b.sold - a.sold);

        const maxSold = Math.max(...sorted.map(s => s.sold), 1);

        return sorted.map(item => ({
            ...item,
            percent: (item.sold / maxSold) * 100
        }));
    }, [filteredOrdersByDate]);

    // --- 5. LISTA FINAL (FILTRADA POR TEXTO E CLIQUES) ---
    const finalOrdersList = useMemo(() => {
        return filteredOrdersByDate.filter(o => {
            // Filtro de Texto
            const matchesText = o.id.toLowerCase().includes(orderSearch.toLowerCase()) || 
                                o.customerName.toLowerCase().includes(orderSearch.toLowerCase());
            
            // Filtro por Data (Clique no Gráfico - Granularidade Dinâmica)
            let matchesDate = true;
            if (selectedDateFilter) {
                const selectedBucket = chartData.data.find(d => d.fullDate === selectedDateFilter);
                if (selectedBucket) {
                    const orderDate = parseOrderDate(o.date);
                    // Comparação inclusiva com o range do bucket clicado
                    matchesDate = orderDate >= selectedBucket.filterRange.start && orderDate <= selectedBucket.filterRange.end;
                }
            }

            // Filtro por Status (Clique no Donut)
            const matchesStatus = selectedStatusFilter ? o.status === selectedStatusFilter : true;

            return matchesText && matchesDate && matchesStatus;
        }).slice(0, 10);
    }, [filteredOrdersByDate, orderSearch, selectedDateFilter, selectedStatusFilter, chartData]);

    // --- HELPERS VISUAIS ---
    const renderDonutSegments = () => {
        let cumulativePercent = 0;
        const radius = 15.9155; 
        
        if (statusData.length === 0) {
            return <circle r={radius} cx="50%" cy="50%" fill="transparent" stroke="#E5E7EB" strokeWidth="5" />;
        }

        return statusData.map((slice, i) => {
            const dashArray = `${slice.percent} ${100 - slice.percent}`;
            const offset = 25 - cumulativePercent;
            cumulativePercent += slice.percent;
            const isSelected = selectedStatusFilter === slice.id;

            return (
                <circle
                    key={i}
                    r={radius}
                    cx="50%"
                    cy="50%"
                    fill="transparent"
                    stroke={slice.color}
                    strokeWidth={isSelected ? 7 : 5}
                    strokeDasharray={dashArray}
                    strokeDashoffset={offset}
                    className="transition-all duration-300 ease-out hover:opacity-80 cursor-pointer"
                    onClick={() => setSelectedStatusFilter(isSelected ? null : slice.id)}
                    style={{ opacity: selectedStatusFilter && !isSelected ? 0.3 : 1 }}
                />
            );
        });
    };

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            
            {/* KPI CARDS (DADOS FILTRADOS) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Receita no Período', value: `R$ ${periodRevenue.toLocaleString()}`, icon: DollarSign, bg: 'bg-emerald-50', text: 'text-emerald-600' },
                    { label: 'Pedidos no Período', value: filteredOrdersByDate.length, icon: ShoppingBag, bg: 'bg-blue-50', text: 'text-blue-600' },
                    { label: 'Clientes Totais', value: usersCount, icon: Users, bg: 'bg-purple-50', text: 'text-purple-600' },
                    { label: 'Ticket Médio (Período)', value: `R$ ${periodAvgTicket.toFixed(0)}`, icon: Wallet, bg: 'bg-amber-50', text: 'text-amber-600' },
                ].map((kpi, i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{kpi.label}</p>
                                <h3 className="text-2xl font-serif font-bold text-[#1d1d1f] group-hover:scale-105 transition-transform origin-left">{kpi.value}</h3>
                            </div>
                            <div className={`p-3 rounded-xl ${kpi.bg} ${kpi.text}`}>
                                <kpi.icon size={20} strokeWidth={2} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* MAIN CHARTS SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 1. Bar Chart - Sales Performance */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
                    
                    {/* Header com Date Picker Integrado */}
                    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-8">
                        <div>
                            <h3 className="font-serif font-bold text-lg text-[#1d1d1f] flex items-center gap-2">
                                <BarChart3 size={18} className="text-[#B8860B]" /> Desempenho de Vendas
                            </h3>
                            <p className="text-xs text-gray-400 mt-1 flex flex-wrap items-center gap-2">
                                {selectedDateFilter 
                                    ? <span className="text-[#B8860B] font-bold flex items-center gap-1">Filtrado por: {chartData.data.find(d => d.fullDate === selectedDateFilter)?.tooltipLabel} <button onClick={() => setSelectedDateFilter(null)}><X size={12}/></button></span> 
                                    : 'Receita no intervalo selecionado'
                                }
                                <span className="bg-gray-100 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border border-gray-200">
                                    AGRUPADO POR: {chartData.granularity === 'day' ? 'DIA' : chartData.granularity === 'week' ? 'SEMANA' : chartData.granularity === 'month' ? 'MÊS' : 'ANO'}
                                </span>
                            </p>
                        </div>
                        
                        {/* Improved Date Range Selector (UX Fixed) */}
                        <div className="flex flex-wrap xl:flex-nowrap items-center gap-3 w-full xl:w-auto justify-end">
                            {/* Presets */}
                            <div className="flex bg-white rounded-xl shadow-sm border border-gray-100 p-1 w-full sm:w-auto overflow-x-auto scrollbar-hide">
                                {['Weekly', 'Monthly', 'Yearly'].map((preset) => (
                                    <button 
                                        key={preset}
                                        onClick={() => applyPreset(preset as any)} 
                                        className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap ${
                                            activePreset === preset 
                                            ? 'bg-[#1d1d1f] text-white shadow-md' 
                                            : 'text-gray-400 hover:text-[#1d1d1f] hover:bg-gray-50'
                                        }`}
                                    >
                                        {preset === 'Weekly' ? '7 Dias' : preset === 'Monthly' ? '30 Dias' : '1 Ano'}
                                    </button>
                                ))}
                            </div>
                            
                            {/* Divider line for desktop (hidden on mobile/wrap) */}
                            <div className="hidden xl:block h-8 w-px bg-gray-200"></div>
                            
                            {/* Custom Date Inputs */}
                            <div className="flex items-center gap-2 w-full sm:w-auto bg-[#F5F5F7] p-1.5 rounded-xl border border-gray-100 justify-between sm:justify-start">
                                <div className="relative group flex-1 sm:flex-none">
                                    <input 
                                        type="date" 
                                        value={startDate}
                                        onChange={(e) => handleDateChange('start', e.target.value)}
                                        className={`w-full sm:w-28 bg-transparent px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-[#1d1d1f] outline-none border-b border-transparent hover:border-gray-300 focus:border-[#B8860B] transition-colors cursor-pointer ${activePreset === 'Custom' ? 'text-[#B8860B]' : ''}`}
                                    />
                                </div>
                                <span className="text-gray-300"><ChevronRight size={12}/></span>
                                <div className="relative group flex-1 sm:flex-none">
                                    <input 
                                        type="date" 
                                        value={endDate}
                                        onChange={(e) => handleDateChange('end', e.target.value)}
                                        className={`w-full sm:w-28 bg-transparent px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-[#1d1d1f] outline-none border-b border-transparent hover:border-gray-300 focus:border-[#B8860B] transition-colors cursor-pointer ${activePreset === 'Custom' ? 'text-[#B8860B]' : ''}`}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Chart Bars - FIX: h-full on wrappers to ensure bar display */}
                    <div className="h-64 w-full flex items-end gap-px relative">
                        {chartData.data.length > 0 ? chartData.data.map((d, i) => {
                            const heightPercent = (d.value / maxChartValue) * 100;
                            const isSelected = selectedDateFilter === d.fullDate;
                            // Labels dinâmicos para evitar sobreposição
                            const showLabel = chartData.data.length <= 15 || i % Math.ceil(chartData.data.length / 15) === 0;
                            
                            return (
                                <div 
                                    key={i} 
                                    onClick={() => setSelectedDateFilter(isSelected ? null : d.fullDate)}
                                    className="h-full flex-1 flex flex-col justify-end group relative cursor-pointer min-w-[2px]"
                                >
                                    {/* Tooltip Hover */}
                                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-[#1d1d1f] text-white text-[10px] font-bold py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-20 whitespace-nowrap shadow-xl z-50">
                                        {d.tooltipLabel}<br/>
                                        R$ {d.value.toFixed(2)}
                                        <br/>
                                        <span className="text-[8px] font-normal opacity-80">{d.orderCount} pedidos</span>
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1d1d1f]"></div>
                                    </div>

                                    {/* Bar Container - Track & Fill */}
                                    <div className="w-full bg-[#F5F5F7] rounded-t-sm relative flex items-end overflow-hidden hover:bg-gray-100 transition-colors h-full">
                                        <div 
                                            className={`w-full transition-all duration-700 ease-out rounded-t-sm ${isSelected ? 'bg-[#1d1d1f]' : 'bg-[#B8860B] group-hover:bg-[#966d09]'} ${selectedDateFilter && !isSelected ? 'opacity-30' : 'opacity-100'}`}
                                            style={{ height: `${heightPercent}%` }}
                                        ></div>
                                    </div>
                                    
                                    {/* Label */}
                                    <span className={`absolute -bottom-6 left-1/2 -translate-x-1/2 text-[8px] font-bold uppercase tracking-wider whitespace-nowrap text-center transition-colors ${isSelected ? 'text-[#1d1d1f]' : 'text-gray-400'}`}>
                                        {showLabel ? d.label : ''}
                                    </span>
                                </div>
                            );
                        }) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs italic">
                                Sem dados no período selecionado.
                            </div>
                        )}
                    </div>
                    
                    {/* Summary Footer */}
                    <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-50">
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total no Período</p>
                            <p className="text-xl font-serif font-bold text-[#1d1d1f]">R$ {periodRevenue.toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                            {/* Média baseada no total de dias físicos, independente do agrupamento */}
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Média Diária</p>
                            <p className="text-xl font-serif font-bold text-[#B8860B]">
                                R$ {(periodRevenue / Math.max(1, (parseInputDate(endDate).getTime() - parseInputDate(startDate).getTime()) / (1000 * 60 * 60 * 24))).toFixed(2)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* 2. Donut Chart - Status */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <h3 className="font-serif font-bold text-lg text-[#1d1d1f]">Status no Período</h3>
                            <p className="text-xs text-gray-400 mt-1">
                                {selectedStatusFilter 
                                    ? <span className="text-[#B8860B] font-bold flex items-center gap-1">Filtro: {statusData.find(s=>s.id === selectedStatusFilter)?.label} <button onClick={() => setSelectedStatusFilter(null)}><X size={12}/></button></span> 
                                    : 'Distribuição dos pedidos visíveis'
                                }
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex-1 flex items-center justify-center relative my-4">
                        <svg viewBox="0 0 40 40" className="w-64 h-64 transform -rotate-90">
                            {renderDonutSegments()}
                        </svg>
                        
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-4xl font-serif font-bold text-[#1d1d1f]">
                                {selectedStatusFilter 
                                    ? statusData.find(s => s.id === selectedStatusFilter)?.value 
                                    : filteredOrdersByDate.length}
                            </span>
                            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                                {selectedStatusFilter ? 'Pedidos' : 'Total'}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4">
                        {statusData.map((item, i) => {
                            const isSelected = selectedStatusFilter === item.id;
                            return (
                                <div 
                                    key={i} 
                                    onClick={() => setSelectedStatusFilter(isSelected ? null : item.id)}
                                    className={`flex items-center gap-2 cursor-pointer transition-opacity ${selectedStatusFilter && !isSelected ? 'opacity-30' : 'opacity-100'}`}
                                >
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                                    <div className="flex flex-col">
                                        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wide">{item.label}</span>
                                        <span className="text-sm font-bold text-[#1d1d1f]">{item.value} ({Math.round(item.percent)}%)</span>
                                    </div>
                                </div>
                            );
                        })}
                        {statusData.length === 0 && <p className="col-span-2 text-center text-xs text-gray-400 italic">Sem dados.</p>}
                    </div>
                </div>
            </div>

            {/* 3. BOTTOM SECTION: LISTS & TABLES */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Top Products */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-full flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-serif font-bold text-lg text-[#1d1d1f]">Top Kits</h3>
                        <div className="text-[10px] font-bold text-[#B8860B] uppercase tracking-widest cursor-default">No Período</div>
                    </div>
                    
                    <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        {topProducts.map((prod, i) => (
                            <div key={i} className="group cursor-default">
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-[#F5F5F7] flex items-center justify-center text-[#1d1d1f] group-hover:bg-[#1d1d1f] group-hover:text-[#B8860B] transition-colors shadow-sm">
                                            <Layers size={18} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-[#1d1d1f]">{prod.name}</p>
                                            <p className="text-[9px] text-gray-400 uppercase tracking-widest">{prod.sold} Vendidos • R$ {prod.revenue.toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold text-[#1d1d1f] bg-gray-50 px-2 py-1 rounded">{Math.round(prod.percent)}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full rounded-full transition-all duration-1000 ease-out" 
                                        style={{ width: `${prod.percent}%`, backgroundColor: prod.color }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                        {topProducts.length === 0 && <p className="text-gray-400 text-xs text-center py-4">Sem vendas no período.</p>}
                    </div>
                </div>

                {/* Filtered Orders Table */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-full flex flex-col">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                        <div>
                            <h3 className="font-serif font-bold text-lg text-[#1d1d1f]">Pedidos Detalhados</h3>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                                {selectedDateFilter || selectedStatusFilter ? 'Filtros Ativos' : 'Visão do Intervalo'}
                            </p>
                        </div>
                        
                        <div className="flex gap-2 w-full sm:w-auto">
                            <div className="relative flex-1 sm:flex-none">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input 
                                    type="text" 
                                    placeholder="Buscar pedido..." 
                                    value={orderSearch}
                                    onChange={(e) => setOrderSearch(e.target.value)}
                                    className="w-full sm:w-48 pl-9 pr-4 py-2 bg-[#F5F5F7] rounded-lg text-xs font-bold text-[#1d1d1f] outline-none focus:ring-1 focus:ring-[#B8860B] transition-all"
                                />
                            </div>
                            {(selectedDateFilter || selectedStatusFilter) && (
                                <button 
                                    onClick={() => { setSelectedDateFilter(null); setSelectedStatusFilter(null); }}
                                    className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-red-100 transition-colors"
                                >
                                    <X size={12} /> Limpar
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="overflow-x-auto flex-1 scrollbar-hide">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="py-3 px-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">ID</th>
                                    <th className="py-3 px-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Cliente</th>
                                    <th className="py-3 px-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Data</th>
                                    <th className="py-3 px-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Valor</th>
                                    <th className="py-3 px-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {finalOrdersList.map(order => (
                                    <tr key={order.id} className="border-b border-gray-50 last:border-0 hover:bg-[#F9F9FA] transition-colors group cursor-pointer" onClick={() => setActiveTab('orders')}>
                                        <td className="py-4 px-2 font-bold text-xs text-[#1d1d1f] group-hover:text-[#B8860B] transition-colors">#{order.id}</td>
                                        <td className="py-4 px-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-[#1d1d1f] text-white flex items-center justify-center text-[9px] font-bold shadow-sm">
                                                    {order.customerName.charAt(0)}
                                                </div>
                                                <span className="text-xs text-[#1d1d1f] font-medium truncate max-w-[120px]">{order.customerName}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-2 text-xs text-gray-500 font-medium">
                                            {order.date}
                                            {selectedDateFilter && chartData.data.find(d => d.fullDate === selectedDateFilter && parseOrderDate(order.date) >= d.filterRange.start && parseOrderDate(order.date) <= d.filterRange.end) && <span className="ml-2 text-[#B8860B] font-bold">●</span>}
                                        </td>
                                        <td className="py-4 px-2 text-xs font-bold text-[#1d1d1f] text-right">R$ {order.total.toFixed(2)}</td>
                                        <td className="py-4 px-2 text-center">
                                            {order.status === 'pending' && <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-100">Pendente</span>}
                                            {order.status === 'production' && <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100">Produção</span>}
                                            {order.status === 'shipped' && <span className="text-[9px] font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded border border-purple-100">Enviado</span>}
                                            {order.status === 'delivered' && <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100">Entregue</span>}
                                            {order.status === 'cancelled' && <span className="text-[9px] font-bold text-red-600 bg-red-50 px-2 py-1 rounded border border-red-100">Cancelado</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {finalOrdersList.length === 0 && (
                            <div className="text-center py-10 text-gray-400 text-xs italic bg-[#F9F9FA] rounded-lg mt-2">
                                <Search className="mx-auto mb-2 opacity-50" size={24}/>
                                Nenhum pedido encontrado com os filtros atuais.
                            </div>
                        )}
                        {finalOrdersList.length > 0 && (
                            <div className="text-right mt-4 text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center justify-end gap-1">
                                <MousePointerClick size={12}/> Clique para ver detalhes
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminFinance;
