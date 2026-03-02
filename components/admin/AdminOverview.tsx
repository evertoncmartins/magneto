
import React from 'react';
import { DollarSign, Package, Users, TrendingUp, Zap, UserCheck, ShoppingBag, Ticket, PenTool } from 'lucide-react';
import { Order, User } from '../../types';

interface AdminOverviewProps {
    finance: any;
    orders: Order[];
    users: User[];
    setActiveTab: (tab: any) => void;
    handleOpenUserModal: () => void;
    setIsCouponModalOpen: (isOpen: boolean) => void;
    setGlobalSearch: (term: string) => void;
    setOrderStatusFilter: (status: 'all' | Order['status']) => void;
}

const AdminOverview: React.FC<AdminOverviewProps> = ({ 
    finance, orders, users, setActiveTab, handleOpenUserModal, setIsCouponModalOpen, setGlobalSearch, setOrderStatusFilter 
}) => {
    return (
        <div className="space-y-8 animate-fade-in">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Receita Total', val: `R$ ${finance.totalRevenue.toLocaleString()}`, sub: '+12% vs mês anterior', icon: DollarSign, color: 'from-[#1d1d1f] to-[#3a3a3a]', text: 'text-white', action: () => setActiveTab('finance') },
                    { label: 'Pedidos Ativos', val: orders.filter(o => o.status !== 'delivered' && !o.deleted).length, sub: 'Necessitam atenção', icon: Package, color: 'from-white to-gray-50', text: 'text-[#1d1d1f]', action: () => setActiveTab('orders') },
                    { label: 'Clientes', val: users.length, sub: 'Novos esta semana: 4', icon: Users, color: 'from-white to-gray-50', text: 'text-[#1d1d1f]', action: () => setActiveTab('users') },
                    { label: 'Ticket Médio', val: `R$ ${finance.avgTicket.toFixed(0)}`, sub: 'Meta: R$ 120', icon: TrendingUp, color: 'from-[#B8860B] to-[#D4AF37]', text: 'text-white', action: () => setActiveTab('finance') },
                ].map((stat, i) => (
                    <div 
                        key={i} 
                        onClick={stat.action}
                        className={`p-6 rounded-2xl shadow-sm border border-gray-100 bg-gradient-to-br ${stat.color} ${stat.text === 'text-white' ? 'shadow-xl' : ''} flex flex-col justify-between h-40 group hover:scale-[1.02] transition-transform cursor-pointer select-none`}
                    >
                        <div className="flex justify-between items-start">
                            <div className={`p-2 rounded-lg ${stat.text === 'text-white' ? 'bg-white/20' : 'bg-gray-100'}`}>
                                <stat.icon size={20} className={stat.text === 'text-white' ? 'text-white' : 'text-[#1d1d1f]'} />
                            </div>
                            {i === 0 && <span className="bg-emerald-400 text-emerald-900 text-[10px] font-bold px-2 py-1 rounded-full">+12%</span>}
                        </div>
                        <div>
                            <h3 className={`text-3xl font-serif font-bold ${stat.text}`}>{stat.val}</h3>
                            <div className="flex justify-between items-end">
                                <p className={`text-[10px] font-bold uppercase tracking-widest opacity-60 ${stat.text}`}>{stat.label}</p>
                                <p className={`text-[9px] ${stat.text} opacity-50`}>{stat.sub}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                    <h3 className="font-serif font-bold text-xl mb-6 flex items-center gap-2">
                        <Zap className="text-[#B8860B]" size={20} /> Ações Rápidas
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <button onClick={() => { setActiveTab('users'); handleOpenUserModal(); }} className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl bg-[#F5F5F7] hover:bg-[#1d1d1f] hover:text-white transition-all group border border-transparent hover:border-[#1d1d1f] active:scale-95">
                            <UserCheck size={24} className="text-[#B8860B]" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-center">Novo Cliente</span>
                        </button>
                        <button onClick={() => { setActiveTab('users'); alert("Selecione um cliente para criar pedido"); }} className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl bg-[#F5F5F7] hover:bg-[#1d1d1f] hover:text-white transition-all group border border-transparent hover:border-[#1d1d1f] active:scale-95">
                            <ShoppingBag size={24} className="text-[#B8860B]" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-center">Criar Pedido</span>
                        </button>
                        <button onClick={() => { setActiveTab('coupons'); setIsCouponModalOpen(true); }} className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl bg-[#F5F5F7] hover:bg-[#1d1d1f] hover:text-white transition-all group border border-transparent hover:border-[#1d1d1f] active:scale-95">
                            <Ticket size={24} className="text-[#B8860B]" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-center">Criar Cupom</span>
                        </button>
                        <button onClick={() => { setActiveTab('cms'); }} className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl bg-[#F5F5F7] hover:bg-[#1d1d1f] hover:text-white transition-all group border border-transparent hover:border-[#1d1d1f] active:scale-95">
                            <PenTool size={24} className="text-[#B8860B]" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-center">Editar Site</span>
                        </button>
                    </div>
                </div>

                <div className="bg-[#1d1d1f] text-white rounded-2xl p-8 shadow-xl flex flex-col justify-between relative overflow-hidden h-[450px]">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#B8860B] rounded-full blur-[60px] opacity-20 pointer-events-none"></div>
                    <div className="shrink-0 mb-4">
                        <h3 className="font-serif font-bold text-xl mb-2">Pedidos Pendentes</h3>
                        <p className="text-white/60 text-xs font-light">Aguardando aprovação ou pagamento.</p>
                    </div>
                    
                    {/* List Container with Scroll */}
                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                        {orders.filter(o => o.status === 'pending' && !o.deleted).slice(0, 10).map(o => (
                            <div 
                                key={o.id} 
                                onClick={() => { setGlobalSearch(o.id); setActiveTab('orders'); }}
                                className="flex justify-between items-center bg-white/10 p-3 rounded-lg backdrop-blur-sm hover:bg-white/20 transition-colors cursor-pointer group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-[#B8860B] flex items-center justify-center font-bold text-xs shadow-md">{o.customerName.charAt(0)}</div>
                                    <div>
                                        <p className="font-bold text-xs truncate max-w-[100px]">{o.customerName}</p>
                                        <p className="text-[9px] text-white/50 group-hover:text-white transition-colors">#{o.id}</p>
                                    </div>
                                </div>
                                <span className="text-[10px] font-bold text-[#B8860B]">R$ {o.total.toFixed(0)}</span>
                            </div>
                        ))}
                        {orders.filter(o => o.status === 'pending' && !o.deleted).length === 0 && (
                            <div className="text-center py-10 text-white/30 text-xs italic">Tudo em dia!</div>
                        )}
                    </div>

                    <button 
                        onClick={() => { setOrderStatusFilter('pending'); setActiveTab('orders'); }}
                        className="mt-6 w-full py-3 bg-white text-[#1d1d1f] font-bold text-[10px] uppercase tracking-widest rounded-lg hover:bg-gray-100 transition-colors shrink-0 shadow-lg"
                    >
                        Ver Fila Completa
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminOverview;
