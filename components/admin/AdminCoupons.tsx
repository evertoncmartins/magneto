
import React, { useState, useMemo } from 'react';
import { Ticket, ToggleRight, ToggleLeft, Trash2, Plus, Calendar, Zap, Search, X, Edit3 } from 'lucide-react';
import { Coupon } from '../../types';
import { updateCoupon, removeCoupon } from '../../services/mockService';
import AdminCouponModal from './modals/AdminCouponModal';

interface AdminCouponsProps {
    coupons: Coupon[];
    refreshData: () => void;
    setIsCouponModalOpen: (isOpen: boolean) => void;
}

const AdminCoupons: React.FC<AdminCouponsProps> = ({ coupons, refreshData, setIsCouponModalOpen }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
    const [isInternalModalOpen, setIsInternalModalOpen] = useState(false);
    
    // Counts Calculation
    const counts = useMemo(() => ({
        all: coupons.length,
        active: coupons.filter(c => c.isActive).length,
        inactive: coupons.filter(c => !c.isActive).length
    }), [coupons]);

    // Wrapper para abrir o modal
    const openModal = (coupon?: Coupon) => {
        setEditingCoupon(coupon || null);
        setIsInternalModalOpen(true);
    };

    const closeModal = () => {
        setEditingCoupon(null);
        setIsInternalModalOpen(false);
    };

    const handleToggleActive = (coupon: Coupon) => {
        updateCoupon(coupon.code, { isActive: !coupon.isActive });
        refreshData();
    };

    const handleRemove = (code: string) => {
        if(window.confirm(`Tem certeza que deseja apagar o cupom "${code}" permanentemente?`)) {
            removeCoupon(code);
            refreshData();
        }
    };

    // Filtragem e Ordenação de cupons
    const filteredCoupons = coupons
        .filter(c => {
            const matchesSearch = c.code.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'all' 
                ? true 
                : statusFilter === 'active' ? c.isActive 
                : !c.isActive;
            
            return matchesSearch && matchesStatus;
        })
        .sort((a, b) => {
            if (a.isActive === b.isActive) return 0;
            return a.isActive ? -1 : 1;
        });

    return (
        <div className="space-y-6 animate-fade-in">
            
            <div className="flex flex-col gap-4">
                {/* Search Bar */}
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                     <div className="relative w-full group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#B8860B] transition-colors" size={18} />
                        <input 
                            type="text"
                            placeholder="Buscar cupom por código..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-12 pl-12 pr-12 bg-[#F5F5F7] border border-transparent rounded-xl text-sm outline-none focus:bg-white focus:border-[#B8860B] focus:ring-1 focus:ring-[#B8860B]/20 transition-all shadow-inner placeholder:text-gray-400 font-bold uppercase tracking-wider"
                        />
                        {searchTerm && (
                            <button 
                                onClick={() => setSearchTerm('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center text-gray-400 hover:text-[#B8860B] hover:bg-gray-100 rounded-full transition-all"
                                title="Limpar busca"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex flex-wrap md:flex-nowrap gap-2 w-full md:w-fit bg-transparent md:bg-white md:p-1.5 md:rounded-xl md:shadow-sm md:border md:border-gray-100">
                    {[
                        { id: 'all', label: 'Todos' },
                        { id: 'active', label: 'Ativos' },
                        { id: 'inactive', label: 'Inativos' }
                    ].map(filter => {
                        const count = counts[filter.id as keyof typeof counts];
                        const isActive = statusFilter === filter.id;

                        return (
                            <button
                                key={filter.id}
                                onClick={() => setStatusFilter(filter.id as any)}
                                className={`
                                    flex-1 md:flex-none
                                    px-6 py-3 rounded-xl 
                                    text-[10px] font-bold uppercase tracking-widest 
                                    transition-all whitespace-nowrap 
                                    border flex items-center justify-center gap-2
                                    ${isActive 
                                        ? 'bg-[#1d1d1f] text-white border-[#1d1d1f] shadow-md' 
                                        : 'bg-white md:bg-transparent text-gray-400 border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                                    }
                                `}
                            >
                                {filter.label}
                                <span className={`
                                    px-1.5 py-0.5 rounded-full text-[8px] font-bold transition-colors
                                    ${isActive 
                                        ? 'bg-white/20 text-white' 
                                        : 'bg-gray-100 text-gray-400'
                                    }
                                `}>
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {filteredCoupons.map(coupon => (
                    <div 
                        key={coupon.code} 
                        className={`relative flex h-32 rounded-xl border transition-all duration-300 group overflow-hidden ${
                            coupon.isActive 
                            ? 'bg-white border-gray-200 shadow-sm hover:shadow-md hover:border-[#B8860B]/30' 
                            : 'bg-gray-50 border-gray-200 opacity-60 grayscale hover:opacity-100'
                        }`}
                    >
                        {/* Left Section: Info */}
                        <div className="flex-1 p-5 flex flex-col justify-center relative">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg transition-colors ${coupon.isActive ? 'bg-[#1d1d1f] text-white' : 'bg-gray-200 text-gray-400'}`}>
                                        <Ticket size={18} />
                                    </div>
                                    <div>
                                        <h3 className={`text-lg font-bold font-mono tracking-wider ${coupon.isActive ? 'text-[#1d1d1f]' : 'text-gray-500'}`}>
                                            {coupon.code}
                                        </h3>
                                        <p className={`text-[10px] font-bold uppercase tracking-widest ${coupon.isActive ? 'text-[#B8860B]' : 'text-gray-400'}`}>
                                            {coupon.discountType === 'percent' ? 'Desconto em %' : 'Desconto Fixo'}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className={`text-2xl font-serif font-bold ${coupon.isActive ? 'text-[#1d1d1f]' : 'text-gray-400'}`}>
                                        {coupon.discountType === 'percent' ? `${coupon.value}%` : `R$ ${coupon.value}`}
                                    </span>
                                    <p className="text-[9px] text-gray-400 uppercase tracking-wide text-right">OFF</p>
                                </div>
                            </div>
                            
                            <div className="mt-auto flex items-center gap-4 text-[9px] font-bold uppercase tracking-widest text-gray-400">
                                <span className="flex items-center gap-1"><Zap size={10}/> {coupon.onlyFirstPurchase ? '1ª Compra' : 'Geral'}</span>
                                <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                <span className="flex items-center gap-1"><Calendar size={10}/> {coupon.expirationDate ? coupon.expirationDate : 'Eterno'}</span>
                            </div>
                        </div>

                        {/* Divider Line & Holes */}
                        <div className="relative w-0 border-l-2 border-dashed border-gray-200 my-3 flex flex-col justify-between items-center z-10">
                            <div className={`absolute -top-5 -left-2 w-4 h-4 rounded-full ${coupon.isActive ? 'bg-[#F5F5F7]' : 'bg-[#F5F5F7]'}`}></div>
                            <div className={`absolute -bottom-5 -left-2 w-4 h-4 rounded-full ${coupon.isActive ? 'bg-[#F5F5F7]' : 'bg-[#F5F5F7]'}`}></div>
                        </div>

                        {/* Right Section: Actions */}
                        <div className={`w-24 p-2 flex flex-col items-center justify-center gap-1 relative z-20 ${coupon.isActive ? 'bg-gray-50/50' : 'bg-gray-100/50'}`}>
                             <button 
                                onClick={() => handleToggleActive(coupon)} 
                                className={`p-2 rounded-lg transition-colors ${coupon.isActive ? 'text-emerald-500 hover:bg-white shadow-sm' : 'text-gray-400 hover:text-emerald-500'}`}
                                title={coupon.isActive ? "Desativar" : "Ativar"}
                            >
                                {coupon.isActive ? <ToggleRight size={20}/> : <ToggleLeft size={20}/>}
                            </button>
                            
                            <button 
                                onClick={() => openModal(coupon)} 
                                className="p-2 rounded-lg text-gray-400 hover:text-[#B8860B] hover:bg-white hover:shadow-sm transition-colors"
                                title="Editar Cupom"
                            >
                                <Edit3 size={16} />
                            </button>
                           
                            <button 
                                onClick={() => handleRemove(coupon.code)} 
                                className="p-2 rounded-lg text-gray-300 hover:text-red-500 hover:bg-white hover:shadow-sm transition-colors"
                                title="Excluir Definitivamente"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
                
                {/* Add New Coupon Card */}
                <button 
                    onClick={() => openModal()} 
                    className="h-32 rounded-xl border-2 border-dashed border-gray-200 hover:border-[#B8860B] hover:text-[#B8860B] text-gray-400 transition-all bg-gray-50/50 hover:bg-white flex flex-row items-center justify-center gap-4 group"
                >
                    <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Plus size={24}/>
                    </div>
                    <div className="text-left">
                        <span className="block text-xs font-bold uppercase tracking-widest text-[#1d1d1f] group-hover:text-[#B8860B]">Criar Campanha</span>
                        <span className="block text-[9px] font-bold uppercase tracking-widest text-gray-400">Novo Cupom</span>
                    </div>
                </button>
            </div>

            {filteredCoupons.length === 0 && (
                 <div className="text-center py-20 text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">
                    <p className="font-medium">Nenhum cupom encontrado.</p>
                    <div className="flex gap-2 justify-center mt-2">
                        {searchTerm && (
                            <button onClick={() => setSearchTerm('')} className="text-[#B8860B] text-[10px] font-bold uppercase tracking-widest hover:underline">
                                Limpar busca
                            </button>
                        )}
                        {statusFilter !== 'all' && (
                            <button onClick={() => setStatusFilter('all')} className="text-[#B8860B] text-[10px] font-bold uppercase tracking-widest hover:underline">
                                Limpar filtros
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Modal Interno para Edição/Criação */}
            <AdminCouponModal 
                isOpen={isInternalModalOpen}
                onClose={closeModal}
                refreshData={refreshData}
                editingCoupon={editingCoupon}
            />
        </div>
    );
};

export default AdminCoupons;
