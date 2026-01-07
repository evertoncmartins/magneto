
import React, { useState, useMemo } from 'react';
import { ShoppingBag, Edit3, Trash2, Plus, Search, MapPin, Phone, History, ShieldCheck, User as UserIcon, X } from 'lucide-react';
import { User } from '../../types';
import { deleteUser } from '../../services/mockService';

interface AdminUsersProps {
    users: User[];
    globalSearch: string;
    setGlobalSearch: (val: string) => void;
    refreshData: () => void;
    onStartOrder: (user: User) => void;
    handleOpenUserModal: (user?: User) => void;
    handleViewHistory: (user: User) => void;
}

const AdminUsers: React.FC<AdminUsersProps> = ({ users, globalSearch, setGlobalSearch, refreshData, onStartOrder, handleOpenUserModal, handleViewHistory }) => {
    
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

    const handleDelete = (id: string) => {
        if(window.confirm("Deseja realmente excluir este usuário?")) {
            deleteUser(id);
            refreshData();
        }
    };

    // Calculate counts
    const counts = useMemo(() => ({
        all: users.length,
        active: users.filter(u => u.isActive).length,
        inactive: users.filter(u => !u.isActive).length
    }), [users]);

    // Filtra usuários por texto e status
    const filteredUsers = users.filter(u => {
        const searchLower = globalSearch.toLowerCase();
        const matchesSearch = u.name.toLowerCase().includes(searchLower) || u.email.toLowerCase().includes(searchLower);
        
        let matchesStatus = true;
        if (statusFilter === 'active') matchesStatus = u.isActive;
        if (statusFilter === 'inactive') matchesStatus = !u.isActive;

        return matchesSearch && matchesStatus;
    });

    return (
        <div className="animate-fade-in space-y-6">
            
            {/* Header Actions & Search */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#B8860B] transition-colors" size={18} />
                    <input 
                        type="text"
                        placeholder="Buscar cliente pelo nome ou e-mail..."
                        value={globalSearch}
                        onChange={(e) => setGlobalSearch(e.target.value)}
                        className="w-full h-12 pl-12 pr-12 bg-[#F5F5F7] border border-transparent rounded-xl text-sm outline-none focus:bg-white focus:border-[#B8860B] focus:ring-1 focus:ring-[#B8860B]/20 transition-all shadow-inner placeholder:text-gray-400"
                    />
                    {globalSearch && (
                        <button 
                            onClick={() => setGlobalSearch('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center text-gray-400 hover:text-[#B8860B] hover:bg-gray-100 rounded-full transition-all"
                            title="Limpar busca"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
                
                <button 
                    onClick={() => handleOpenUserModal()}
                    className="w-full md:w-auto bg-[#1d1d1f] text-white px-8 py-3.5 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95 shrink-0"
                >
                    <Plus size={16} /> Novo Cliente
                </button>
            </div>

            {/* FILTER TABS */}
            <div className="flex flex-wrap md:flex-nowrap gap-2 w-full md:w-fit bg-transparent md:bg-white md:p-1.5 md:rounded-xl md:shadow-sm md:border md:border-gray-100">
                {[
                    { id: 'all', label: 'Todos' }, 
                    { id: 'active', label: 'Ativos' }, 
                    { id: 'inactive', label: 'Inativos' }
                ].map(status => {
                    const isActive = statusFilter === status.id;
                    const count = counts[status.id as keyof typeof counts] || 0;

                    return (
                        <button 
                            key={status.id} 
                            onClick={() => setStatusFilter(status.id as any)}
                            className={`
                                flex-1 md:flex-none
                                px-6 py-3 rounded-xl 
                                text-[10px] font-bold uppercase tracking-widest whitespace-nowrap 
                                transition-all border flex items-center justify-center gap-2
                                ${isActive 
                                    ? 'bg-[#1d1d1f] text-white border-[#1d1d1f] shadow-md' 
                                    : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                                }
                            `}
                        >
                            {status.label}
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

            {/* Grid de Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredUsers.map(user => (
                    <div 
                        key={user.id} 
                        className={`bg-white rounded-2xl p-6 border transition-all duration-300 relative group ${user.isAdmin ? 'border-[#B8860B]/30 shadow-md' : 'border-gray-100 shadow-sm hover:shadow-md'}`}
                    >
                        {/* Status Dot */}
                        <div className={`absolute top-6 right-6 w-3 h-3 rounded-full ${user.isActive ? 'bg-emerald-400' : 'bg-red-400'} shadow-sm`}></div>

                        {/* Profile Header */}
                        <div className="flex items-start gap-5 mb-6">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center font-serif text-2xl font-bold shadow-sm ${user.isAdmin ? 'bg-[#1d1d1f] text-[#B8860B]' : 'bg-[#F5F5F7] text-[#1d1d1f]'}`}>
                                {user.name.charAt(0)}
                            </div>
                            <div>
                                <h3 className="font-bold text-[#1d1d1f] text-lg leading-tight">{user.name}</h3>
                                <p className="text-xs text-gray-400 mb-2">{user.email}</p>
                                {user.isAdmin ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-[#B8860B] text-[9px] font-bold uppercase tracking-widest border border-amber-100">
                                        Admin
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-50 text-gray-400 text-[9px] font-bold uppercase tracking-widest border border-gray-100">
                                        Cliente
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Info Block */}
                        <div className="bg-[#F9F9FA] rounded-xl p-4 grid grid-cols-2 gap-4 mb-6 border border-gray-50">
                            <div>
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Telefone</p>
                                <p className="text-xs font-medium text-[#1d1d1f] truncate">
                                    {user.phone || '-'}
                                </p>
                            </div>
                            <div>
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Cidade</p>
                                <p className="text-xs font-medium text-[#1d1d1f] truncate">
                                    {user.address?.city ? `${user.address.city}/${user.address.state}` : '-'}
                                </p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button 
                                onClick={() => handleOpenUserModal(user)}
                                className="flex-1 bg-[#1d1d1f] text-white py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-colors flex items-center justify-center gap-2"
                            >
                                <Edit3 size={12} /> Editar
                            </button>
                            <button 
                                onClick={() => onStartOrder(user)}
                                className="flex-1 bg-white border border-emerald-500 text-emerald-600 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2"
                            >
                                <Plus size={12} /> Pedido
                            </button>
                            {!user.isAdmin && (
                                <button 
                                    onClick={() => handleViewHistory(user)}
                                    className="px-3 bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200 transition-colors"
                                    title="Histórico de Pedidos"
                                >
                                    <History size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {filteredUsers.length === 0 && (
                <div className="text-center py-20 text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">
                    <p className="font-medium">Nenhum cliente encontrado.</p>
                    <button onClick={() => { setGlobalSearch(''); setStatusFilter('all'); }} className="text-[#B8860B] text-[10px] font-bold uppercase tracking-widest mt-2 hover:underline">Limpar filtros</button>
                </div>
            )}
        </div>
    );
};

export default AdminUsers;
