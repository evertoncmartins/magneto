
import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
    Edit3, Plus, Search, MapPin, Phone, History, 
    X, ChevronLeft, ChevronRight, ChevronDown, 
    Mail, Calendar, ShieldCheck, ChevronsLeft, ChevronsRight, Trash2, Ban, Hash, Home, Shield, FileText, CheckCircle
} from 'lucide-react';
import { User } from '../../types';
import { deleteUser, getAdminOrders } from '../../services/mockService';

interface AdminUsersProps {
    users: User[];
    globalSearch: string;
    setGlobalSearch: (val: string) => void;
    refreshData: () => void;
    onStartOrder: (user: User) => void;
    handleOpenUserModal: (user?: User) => void;
    handleViewHistory: (user: User) => void;
}

const formatPhone = (phone: string) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
        return cleaned.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
    }
    if (cleaned.length === 10) {
        return cleaned.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
    }
    return phone;
};

const AdminUsers: React.FC<AdminUsersProps> = ({ users, globalSearch, setGlobalSearch, refreshData, onStartOrder, handleOpenUserModal, handleViewHistory }) => {
    
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
    
    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(9);

    // Expansion State
    const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

    // Delete Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    
    // Block Delete Modal State
    const [deleteBlockType, setDeleteBlockType] = useState<'admin' | 'history' | null>(null);

    const toggleUserExpansion = (userId: string) => {
        setExpandedUserId(prev => prev === userId ? null : userId);
    };

    const requestDelete = (user: User) => {
        // --- 1. BLOQUEIO DE EXCLUSÃO DO ADMIN RAIZ ---
        if (user.id === 'admin-001' || user.email === 'admin@magneto.com') {
            setDeleteBlockType('admin');
            return;
        }

        // --- 2. BLOQUEIO HISTÓRICO DE PEDIDOS ---
        const allOrders = getAdminOrders();
        const userHasOrders = allOrders.some(order => order.userId === user.id);

        if (userHasOrders) {
            setDeleteBlockType('history');
            return;
        }

        setUserToDelete(user);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (userToDelete) {
            deleteUser(userToDelete.id);
            refreshData();
            setIsDeleteModalOpen(false);
            setUserToDelete(null);
        }
    };

    // Calculate counts
    const counts = useMemo(() => ({
        all: users.length,
        active: users.filter(u => u.isActive).length,
        inactive: users.filter(u => !u.isActive).length
    }), [users]);

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [globalSearch, statusFilter, itemsPerPage]);

    const filteredUsers = users.filter(u => {
        const searchLower = globalSearch.toLowerCase();
        const matchesSearch = u.name.toLowerCase().includes(searchLower) || u.email.toLowerCase().includes(searchLower);
        
        let matchesStatus = true;
        if (statusFilter === 'active') matchesStatus = u.isActive;
        if (statusFilter === 'inactive') matchesStatus = !u.isActive;

        return matchesSearch && matchesStatus;
    });

    // --- PAGINATION LOGIC ---
    const indexOfLastUser = currentPage * itemsPerPage;
    const indexOfFirstUser = indexOfLastUser - itemsPerPage;
    const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

    const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

    // --- ACTION BUTTON COMPONENT ---
    const ActionButton = ({ icon: Icon, tooltip, onClick, variant = 'default' }: { icon: any, tooltip: string, onClick: () => void, variant?: 'default' | 'primary' | 'danger' }) => {
        let baseColor = "text-gray-400 hover:text-[#1d1d1f] hover:bg-gray-100";
        if (variant === 'primary') baseColor = "text-[#B8860B] hover:text-[#966d09] hover:bg-[#B8860B]/10";
        if (variant === 'danger') baseColor = "text-gray-300 hover:text-red-500 hover:bg-red-50";

        return (
            <button 
                onClick={(e) => { e.stopPropagation(); onClick(); }}
                className={`group/btn relative p-2.5 rounded-xl transition-all ${baseColor}`}
            >
                <Icon size={18} strokeWidth={1.5} />
                
                {/* Tooltip Individual */}
                <div className="absolute right-full top-1/2 -translate-y-1/2 mr-3 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                    <div className="bg-[#1d1d1f] text-white text-[10px] font-bold uppercase tracking-wide px-3 py-2 rounded-lg shadow-xl whitespace-nowrap relative">
                        {tooltip}
                        {/* Seta do Tooltip */}
                        <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-2 bg-[#1d1d1f] rotate-45"></div>
                    </div>
                </div>
            </button>
        );
    };

    return (
        <>
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

                {/* FILTER TABS (Scrollable on Mobile) */}
                <div className="flex gap-2 overflow-x-auto scrollbar-hide w-full pb-2 md:pb-0">
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
                                    flex-none whitespace-nowrap
                                    px-6 py-3 rounded-xl 
                                    text-[10px] font-bold uppercase tracking-widest 
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {currentUsers.map(user => {
                        const isExpanded = expandedUserId === user.id;
                        const allAddresses = user.savedAddresses || (user.address ? [user.address] : []);

                        return (
                            <div 
                                key={user.id} 
                                className={`bg-white rounded-2xl border transition-all duration-300 flex flex-col overflow-hidden ${isExpanded ? 'shadow-xl border-[#B8860B]/30' : (user.isAdmin ? 'border-[#B8860B]/30 shadow-md' : 'border-gray-100 shadow-sm hover:shadow-lg')}`}
                            >
                                <div className="flex flex-row">
                                    {/* Seção Principal (Infos) */}
                                    <div className="flex-1 p-5 flex flex-col justify-between min-w-0">
                                        
                                        {/* Header: Avatar + Identificação */}
                                        <div className="flex items-start gap-4 mb-4">
                                            <div className="relative shrink-0">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-serif text-lg font-bold shadow-sm ${user.isAdmin ? 'bg-[#1d1d1f] text-[#B8860B]' : 'bg-[#F5F5F7] text-[#1d1d1f]'}`}>
                                                    {user.name.charAt(0)}
                                                </div>
                                                <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 border-2 border-white rounded-full ${user.isActive ? 'bg-emerald-400' : 'bg-red-400'}`}></div>
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="font-bold text-[#1d1d1f] text-sm leading-tight truncate font-serif mb-1">{user.name}</h3>
                                                <p className="text-[10px] text-gray-400 truncate flex items-center gap-1">
                                                    <Mail size={10} /> {user.email}
                                                </p>
                                                <div className="flex items-center gap-2 mt-2">
                                                    {user.isAdmin ? (
                                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-50 text-[#B8860B] text-[8px] font-bold uppercase tracking-widest border border-amber-100">
                                                            <ShieldCheck size={9} /> Admin
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-gray-50 text-gray-400 text-[8px] font-bold uppercase tracking-widest border border-gray-100">
                                                            Cliente
                                                        </span>
                                                    )}
                                                    {!user.isActive && (
                                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-red-50 text-red-500 text-[8px] font-bold uppercase tracking-widest border border-red-100">
                                                            <Ban size={9} /> Inativo
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Informações Secundárias */}
                                        <div className="space-y-2 pt-4 border-t border-gray-50">
                                            <div className="flex items-center gap-2 text-[10px] text-gray-500">
                                                <Phone size={12} className="text-gray-300 shrink-0"/>
                                                <span className="truncate">{user.phone ? formatPhone(user.phone) : <span className="italic text-gray-300">Sem telefone</span>}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] text-gray-500">
                                                <MapPin size={12} className="text-gray-300 shrink-0"/>
                                                <span className="truncate">{user.address?.city ? `${user.address.city}, ${user.address.state.split(' - ').pop()}` : <span className="italic text-gray-300">Sem endereço</span>}</span>
                                            </div>
                                        </div>

                                        {/* Botão de Expansão */}
                                        <button 
                                            onClick={() => toggleUserExpansion(user.id)}
                                            className="w-full mt-4 flex items-center justify-center p-1.5 rounded-lg hover:bg-gray-50 text-gray-300 hover:text-[#1d1d1f] transition-colors"
                                        >
                                            <ChevronDown size={16} className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                                        </button>
                                    </div>

                                    {/* Barra de Ações Vertical */}
                                    <div className="w-14 bg-gray-50/50 border-l border-gray-100 flex flex-col items-center py-4 gap-2 shrink-0 rounded-tr-2xl">
                                        <ActionButton 
                                            icon={Plus} 
                                            tooltip="Novo Pedido" 
                                            onClick={() => onStartOrder(user)}
                                            variant="primary"
                                        />
                                        
                                        {!user.isAdmin && (
                                            <ActionButton 
                                                icon={History} 
                                                tooltip="Histórico" 
                                                onClick={() => handleViewHistory(user)} 
                                            />
                                        )}

                                        <div className="w-4 h-px bg-gray-200 my-1"></div>

                                        <ActionButton 
                                            icon={Edit3} 
                                            tooltip="Editar Dados" 
                                            onClick={() => handleOpenUserModal(user)} 
                                        />
                                        
                                        <ActionButton 
                                            icon={Trash2} 
                                            tooltip="Excluir" 
                                            onClick={() => requestDelete(user)}
                                            variant="danger"
                                        />
                                    </div>
                                </div>

                                {/* Área Expandida */}
                                {isExpanded && (
                                    <div className="bg-[#F9F9FA] border-t border-gray-100 p-5 animate-fade-in">
                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <div>
                                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1"><Calendar size={10}/> Cadastro</p>
                                                <p className="text-xs text-[#1d1d1f]">{user.joinedAt}</p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1"><Hash size={10}/> ID</p>
                                                <p className="text-[10px] text-[#1d1d1f] font-mono bg-gray-100 px-1.5 rounded inline-block truncate max-w-full" title={user.id}>{user.id}</p>
                                            </div>
                                        </div>

                                        <div>
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1"><Home size={10}/> Endereços Cadastrados</p>
                                            {allAddresses.length > 0 ? (
                                                <div className="space-y-3">
                                                    {allAddresses.map((addr, idx) => {
                                                        const isMain = user.address?.id === addr.id;
                                                        return (
                                                            <div 
                                                                key={addr.id || idx} 
                                                                className={`p-3 rounded-xl border transition-all bg-white relative ${isMain ? 'border-[#B8860B] ring-1 ring-[#B8860B]/20 shadow-sm' : 'border-gray-200'}`}
                                                            >
                                                                <div className="flex-1 min-w-0">
                                                                    {addr.nickname && (
                                                                        <div className="mb-1">
                                                                            <span className="text-[8px] bg-[#F5F5F7] px-2 py-0.5 rounded font-bold uppercase tracking-widest text-[#1d1d1f]">{addr.nickname}</span>
                                                                        </div>
                                                                    )}
                                                                    
                                                                    <h4 className="font-bold text-[#1d1d1f] text-xs mb-0.5 leading-tight">{addr.street}, {addr.number}</h4>
                                                                    <p className="text-[10px] text-gray-500 mb-0.5">{addr.neighborhood} - {addr.city}/{addr.state.length === 2 ? addr.state : addr.state.split(' - ').pop()}</p>
                                                                    
                                                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                                                        <p className="text-[9px] text-gray-400">CEP: {addr.zipCode}</p>
                                                                        {addr.complement && (
                                                                            <span className="text-[9px] text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100 font-medium uppercase tracking-wide">
                                                                                {addr.complement}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <p className="text-[10px] text-gray-400 italic">Nenhum endereço cadastrado.</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* PAGINATION FOOTER */}
                {filteredUsers.length > 0 && (
                    <div className="flex flex-col sm:flex-row justify-end items-center gap-4 sm:gap-6 pt-6 text-[11px] text-gray-500 font-medium select-none animate-fade-in border-t border-gray-100/50">
                        
                        <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto justify-between sm:justify-start">
                            {/* Items Per Page */}
                            <div className="flex items-center gap-2">
                                <span className="hidden sm:inline">Itens por página:</span>
                                <span className="sm:hidden">Exibir:</span>
                                <div className="relative group">
                                    <select 
                                        value={itemsPerPage}
                                        onChange={(e) => setItemsPerPage(Number(e.target.value))}
                                        className="appearance-none bg-transparent hover:bg-gray-100 rounded px-2 py-1 pr-6 cursor-pointer focus:outline-none transition-colors text-[#1d1d1f]"
                                    >
                                        <option value={9}>9</option>
                                        <option value={12}>12</option>
                                        <option value={24}>24</option>
                                        <option value={48}>48</option>
                                    </select>
                                    <ChevronDown size={10} className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none opacity-50 group-hover:opacity-100" />
                                </div>
                            </div>

                            {/* Range Info */}
                            <span className="text-[#1d1d1f]">
                                {indexOfFirstUser + 1}-{Math.min(indexOfLastUser, filteredUsers.length)} de {filteredUsers.length}
                            </span>
                        </div>

                        {/* Navigation Icons */}
                        <div className="flex items-center gap-2 w-full sm:w-auto justify-center bg-gray-50 sm:bg-transparent p-1.5 sm:p-0 rounded-xl sm:rounded-none border sm:border-none border-gray-100">
                            <button 
                                onClick={() => paginate(1)}
                                disabled={currentPage === 1}
                                className="p-2 sm:p-1.5 rounded-lg hover:bg-white sm:hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-[#1d1d1f] shadow-sm sm:shadow-none"
                                title="Primeira Página"
                            >
                                <ChevronsLeft size={16} strokeWidth={1.5} />
                            </button>
                            <button 
                                onClick={() => paginate(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="p-2 sm:p-1.5 rounded-lg hover:bg-white sm:hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-[#1d1d1f] shadow-sm sm:shadow-none"
                                title="Página Anterior"
                            >
                                <ChevronLeft size={16} strokeWidth={1.5} />
                            </button>
                            <button 
                                onClick={() => paginate(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="p-2 sm:p-1.5 rounded-lg hover:bg-white sm:hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-[#1d1d1f] shadow-sm sm:shadow-none"
                                title="Próxima Página"
                            >
                                <ChevronRight size={16} strokeWidth={1.5} />
                            </button>
                            <button 
                                onClick={() => paginate(totalPages)}
                                disabled={currentPage === totalPages}
                                className="p-2 sm:p-1.5 rounded-lg hover:bg-white sm:hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-[#1d1d1f] shadow-sm sm:shadow-none"
                                title="Última Página"
                            >
                                <ChevronsRight size={16} strokeWidth={1.5} />
                            </button>
                        </div>
                    </div>
                )}

                {filteredUsers.length === 0 && (
                    <div className="text-center py-20 text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">
                        <p className="font-medium">Nenhum cliente encontrado.</p>
                        <button onClick={() => { setGlobalSearch(''); setStatusFilter('all'); }} className="text-[#B8860B] text-[10px] font-bold uppercase tracking-widest mt-2 hover:underline">Limpar filtros</button>
                    </div>
                )}
            </div>

            {/* DELETE CONFIRMATION MODAL */}
            {isDeleteModalOpen && userToDelete && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#1d1d1f]/60 backdrop-blur-md" onClick={() => setIsDeleteModalOpen(false)}></div>
                    <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl relative overflow-hidden flex flex-col animate-fade-in border border-gray-100 p-6 text-center z-10">
                        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Trash2 size={32} />
                        </div>
                        <h3 className="font-serif font-bold text-xl text-[#1d1d1f] mb-2">Excluir Cliente?</h3>
                        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                            Tem certeza que deseja excluir <strong>{userToDelete.name}</strong>? <br/>
                            Esta ação é irreversível e removerá todo o histórico.
                        </p>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="flex-1 py-3 bg-gray-100 text-[#1d1d1f] font-bold text-[10px] uppercase tracking-widest rounded-xl hover:bg-gray-200 transition-all"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={confirmDelete}
                                className="flex-1 py-3 bg-red-500 text-white font-bold text-[10px] uppercase tracking-widest rounded-xl hover:bg-red-600 transition-all shadow-lg shadow-red-200"
                            >
                                Sim, Excluir
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* ERROR MODAL: CANNOT DELETE ADMIN OR USER WITH HISTORY */}
            {deleteBlockType && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#1d1d1f]/60 backdrop-blur-md" onClick={() => setDeleteBlockType(null)}></div>
                    <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl relative overflow-hidden flex flex-col animate-fade-in border border-gray-100 p-6 text-center z-10">
                        <div className="w-16 h-16 bg-amber-50 text-[#B8860B] rounded-full flex items-center justify-center mx-auto mb-4">
                            {deleteBlockType === 'admin' ? <Shield size={32} /> : <FileText size={32} />}
                        </div>
                        <h3 className="font-serif font-bold text-xl text-[#1d1d1f] mb-2">Ação Bloqueada</h3>
                        
                        {deleteBlockType === 'admin' ? (
                            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                                O usuário <strong>Administrador</strong> é o perfil raiz do sistema e não pode ser removido por questões de segurança.
                            </p>
                        ) : (
                            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                                Este usuário possui pedidos registrados. Para preservar o histórico fiscal e financeiro, ele <strong>não pode ser excluído</strong>. <br/><br/>
                                <span className="block text-xs font-bold uppercase tracking-widest text-[#B8860B]">Sugestão:</span>
                                Inative o acesso do usuário nas configurações.
                            </p>
                        )}

                        <button 
                            onClick={() => setDeleteBlockType(null)}
                            className="w-full py-3 bg-[#1d1d1f] text-white font-bold text-[10px] uppercase tracking-widest rounded-xl hover:bg-black transition-all"
                        >
                            Entendido
                        </button>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};

export default AdminUsers;
