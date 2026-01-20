
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { 
    Package, Clock, Box, Truck, CheckCircle, ChevronDown, 
    Loader2, Download, MapPin, Receipt, Search, X, ChevronLeft, ChevronRight, ZoomIn, Calendar, Layers,
    Camera, Shield, Trash2, Edit3, UserCheck, RefreshCw, Wand2, ToggleRight, ToggleLeft, List, Home, Plus, ShieldCheck,
    ChevronsLeft, ChevronsRight, Ban, AlertOctagon, XCircle, RotateCcw
} from 'lucide-react';
import { Order, MagnetItem, User, Address } from '../../types';
import { updateOrderStatus, softDeleteOrder, restoreOrder, updateOrderDetails, getUsers } from '../../services/mockService';
import { useNavigate } from 'react-router-dom';

const STATUS_STEPS = ['pending', 'production', 'shipped', 'delivered'];

// CORES PASTÉIS / SUAVES
const getStatusConfig = (status: string) => {
    const config: any = {
      'pending': { 
          label: 'Pendente', 
          color: 'bg-[#FFF9E6] text-[#B8860B] border-[#B8860B]/20', 
          icon: Clock 
      },
      'production': { 
          label: 'Produção', 
          color: 'bg-[#E3F2FD] text-[#4FA3D1] border-[#BBDEFB]', 
          icon: Box 
      },
      'shipped': { 
          label: 'Enviado', 
          color: 'bg-[#F3E5F5] text-[#9C27B0] border-[#E1BEE7]', 
          icon: Truck 
      },
      'delivered': { 
          label: 'Entregue', 
          color: 'bg-[#E8F5E9] text-[#4CAF50] border-[#C8E6C9]', 
          icon: CheckCircle 
      },
      'cancelled': {
          label: 'Cancelado',
          color: 'bg-red-50 text-red-600 border-red-200',
          icon: Ban
      }
    };
    return config[status] || { label: status, color: 'bg-gray-50 text-gray-600 border-gray-200', icon: Package };
};

// Estilos específicos para quando o step está ATIVO na Timeline
const STEP_ACTIVE_STYLES: Record<string, string> = {
    'pending': 'bg-[#B8860B] border-[#B8860B] text-white shadow-md shadow-[#B8860B]/20',
    'production': 'bg-[#90CAF9] border-[#90CAF9] text-white shadow-md shadow-blue-200',
    'shipped': 'bg-[#CE93D8] border-[#CE93D8] text-white shadow-md shadow-purple-200',
    'delivered': 'bg-[#A5D6A7] border-[#A5D6A7] text-white shadow-md shadow-green-200',
};

// Estilos de Hover na Timeline
const STEP_HOVER_STYLES: Record<string, string> = {
    'pending': 'hover:border-[#B8860B] hover:text-[#B8860B] hover:bg-[#FFF9E6]',
    'production': 'hover:border-[#90CAF9] hover:text-[#64B5F6] hover:bg-[#E3F2FD]',
    'shipped': 'hover:border-[#CE93D8] hover:text-[#BA68C8] hover:bg-[#F3E5F5]',
    'delivered': 'hover:border-[#A5D6A7] hover:text-[#81C784] hover:bg-[#E8F5E9]',
};

interface AdminOrdersProps {
    orders: Order[];
    globalSearch: string;
    setGlobalSearch: (val: string) => void;
    refreshData: () => void;
    orderStatusFilter: 'all' | Order['status'] | 'deleted';
    setOrderStatusFilter: (val: 'all' | Order['status'] | 'deleted') => void;
}

const AdminOrders: React.FC<AdminOrdersProps> = ({ orders, globalSearch, setGlobalSearch, refreshData, orderStatusFilter, setOrderStatusFilter }) => {
    const navigate = useNavigate();
    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
    const [downloadingOrderId, setDownloadingOrderId] = useState<string | null>(null);
    
    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Edit Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingOrder, setEditingOrder] = useState<Order | null>(null);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    
    // Cancel Modal State
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
    const [cancellationReason, setCancellationReason] = useState('');

    // Revert Modal State
    const [isRevertModalOpen, setIsRevertModalOpen] = useState(false);
    const [orderToRevert, setOrderToRevert] = useState<Order | null>(null);

    // User Search inside Modal
    const [userSearchTerm, setUserSearchTerm] = useState('');
    const [showUserDropdown, setShowUserDropdown] = useState(false);
    const userSearchInputRef = useRef<HTMLInputElement>(null);

    // Address Edit State
    const [editAddressForm, setEditAddressForm] = useState<Address>({
        street: '', number: '', complement: '', neighborhood: '', city: '', state: '', zipCode: ''
    });
    const [activeAddressCardId, setActiveAddressCardId] = useState<string | null>(null); // Novo estado para controle visual dos cards
    const [isFetchingCep, setIsFetchingCep] = useState(false);
    
    // Date Filters
    const [dateStart, setDateStart] = useState('');
    const [dateEnd, setDateEnd] = useState('');

    // Lightbox State
    const [lightboxImages, setLightboxImages] = useState<string[]>([]);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);

    useEffect(() => {
        setAllUsers(getUsers());
    }, []);

    // Sync Search Term and Address when editing order changes
    useEffect(() => {
        if (editingOrder && isEditModalOpen) {
            const currentUser = allUsers.find(u => u.id === editingOrder.userId);
            if (currentUser) {
                setUserSearchTerm(currentUser.name);
            } else {
                setUserSearchTerm('');
            }

            // Populate Address Form
            if (editingOrder.shippingAddress) {
                setEditAddressForm(editingOrder.shippingAddress);
                setActiveAddressCardId(null); // Reset selection on open
            } else {
                setEditAddressForm({ street: '', number: '', complement: '', neighborhood: '', city: '', state: '', zipCode: '' });
                setActiveAddressCardId('new');
            }
        }
    }, [editingOrder, isEditModalOpen, allUsers]);

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [globalSearch, orderStatusFilter, dateStart, dateEnd, itemsPerPage]);

    // Counts Calculation
    const counts = useMemo(() => {
        return {
            all: orders.filter(o => !o.deleted).length,
            pending: orders.filter(o => o.status === 'pending' && !o.deleted).length,
            production: orders.filter(o => o.status === 'production' && !o.deleted).length,
            shipped: orders.filter(o => o.status === 'shipped' && !o.deleted).length,
            delivered: orders.filter(o => o.status === 'delivered' && !o.deleted).length,
            cancelled: orders.filter(o => o.status === 'cancelled' && !o.deleted).length,
            deleted: orders.filter(o => o.deleted).length
        };
    }, [orders]);

    // Helper to parse "DD/MM/YYYY" to Date object
    const parseDate = (dateStr: string) => {
        const parts = dateStr.split('/');
        return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
    };

    const formatCep = (cep: string) => {
        const clean = cep.replace(/\D/g, '');
        if (clean.length === 8) {
            return `${clean.slice(0, 5)}-${clean.slice(5)}`;
        }
        return clean;
    };

    const filteredOrders = useMemo(() => {
        return orders.filter(o => {
            // 1. Filter Deleted vs Active
            if (orderStatusFilter === 'deleted') {
                if (!o.deleted) return false;
            } else {
                if (o.deleted) return false;
                if (orderStatusFilter !== 'all' && o.status !== orderStatusFilter) return false;
            }

            // 2. Text Search
            const searchLower = globalSearch.toLowerCase();
            const matchesSearch = 
              o.customerName.toLowerCase().includes(searchLower) || 
              o.id.toLowerCase().includes(searchLower);
            
            if (!matchesSearch) return false;

            // 3. Date Range Filter
            if (dateStart || dateEnd) {
                const orderDate = parseDate(o.date);
                orderDate.setHours(0,0,0,0);

                if (dateStart) {
                    const start = new Date(dateStart);
                    start.setHours(0,0,0,0);
                    if (orderDate < start) return false;
                }
                
                if (dateEnd) {
                    const end = new Date(dateEnd);
                    end.setHours(0,0,0,0);
                    if (orderDate > end) return false;
                }
            }

            return true;
        });
    }, [orders, globalSearch, orderStatusFilter, dateStart, dateEnd]);

    // --- PAGINATION LOGIC ---
    const indexOfLastOrder = currentPage * itemsPerPage;
    const indexOfFirstOrder = indexOfLastOrder - itemsPerPage;
    const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

    const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

    // Filter Users for Modal
    const filteredUsersForModal = useMemo(() => {
        const term = userSearchTerm.toLowerCase();
        return allUsers.filter(u => 
            u.name.toLowerCase().includes(term) || 
            u.email.toLowerCase().includes(term)
        ).slice(0, 50); // Limit to 50 results for performance
    }, [allUsers, userSearchTerm]);

    // Get current editing user object to access saved addresses
    const editingUserObject = useMemo(() => {
        if (!editingOrder) return null;
        return allUsers.find(u => u.id === editingOrder.userId);
    }, [editingOrder, allUsers]);

    const handleFillAddress = (addressId: string) => {
        setActiveAddressCardId(addressId);
        
        if (addressId === 'new') {
            setEditAddressForm({ street: '', number: '', complement: '', neighborhood: '', city: '', state: '', zipCode: '' });
            return;
        }
        const addr = editingUserObject?.savedAddresses?.find(a => a.id === addressId);
        if (addr) {
            setEditAddressForm({ ...addr });
        }
    };

    const handleStatusClick = (e: React.MouseEvent, order: Order, step: string) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (order.status === 'cancelled') {
            alert('Não é possível alterar o status de um pedido cancelado. Restaure-o primeiro ou crie um novo.');
            return;
        }
        
        if (order.status === step) return;
        updateOrderStatus(order.id, step as Order['status']);
        refreshData();
    };

    const handleDownloadPhotos = async (order: Order) => {
        if (!order.items || order.items.length === 0) return alert("Sem fotos disponíveis.");
        setDownloadingOrderId(order.id);
        
        setTimeout(() => {
            order.items?.forEach((item, i) => {
                const link = document.createElement('a');
                link.href = item.highResUrl || item.croppedUrl;
                link.download = `Pedido-${order.id}-Foto-${i+1}.jpg`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            });
            setDownloadingOrderId(null);
        }, 1500);
    };

    // --- ADMIN ACTIONS ---
    const handleSoftDelete = (e: React.MouseEvent, order: Order) => {
        e.stopPropagation();
        if (window.confirm("Deseja mover este pedido para a lixeira? O cliente deixará de vê-lo.")) {
            softDeleteOrder(order.id);
            refreshData();
        }
    };

    const handleRestore = (e: React.MouseEvent, order: Order) => {
        e.stopPropagation();
        restoreOrder(order.id);
        refreshData();
    };

    const openEditModal = (e: React.MouseEvent, order: Order) => {
        e.stopPropagation();
        setEditingOrder(order);
        setIsEditModalOpen(true);
        // Reset Dropdown state
        setShowUserDropdown(false);
    };

    const openCancelModal = (e: React.MouseEvent, order: Order) => {
        e.stopPropagation();
        setOrderToCancel(order);
        setCancellationReason('');
        setIsCancelModalOpen(true);
    };

    const confirmCancellation = () => {
        if (!orderToCancel) return;
        if (!cancellationReason.trim()) {
            alert("A justificativa é obrigatória para cancelar o pedido.");
            return;
        }

        updateOrderDetails(orderToCancel.id, {
            status: 'cancelled',
            cancellationReason: cancellationReason
        });
        
        refreshData();
        setIsCancelModalOpen(false);
        setOrderToCancel(null);
        setCancellationReason('');
    };

    const openRevertModal = (e: React.MouseEvent, order: Order) => {
        e.stopPropagation();
        setOrderToRevert(order);
        setIsRevertModalOpen(true);
    };

    const confirmRevert = () => {
        if (!orderToRevert) return;
        updateOrderDetails(orderToRevert.id, {
            status: 'pending',
            cancellationReason: undefined
        });
        refreshData();
        setIsRevertModalOpen(false);
        setOrderToRevert(null);
    };

    const handleSelectUser = (user: User) => {
        if (editingOrder) {
            setEditingOrder({ ...editingOrder, userId: user.id });
            setUserSearchTerm(user.name);
            setShowUserDropdown(false);
        }
    };

    const handleClearUserSearch = () => {
        setUserSearchTerm('');
        userSearchInputRef.current?.focus();
        setShowUserDropdown(true);
    };

    const handleCepLookup = async (cep: string) => {
        const cleanCep = cep.replace(/\D/g, '');
        setEditAddressForm(prev => ({ ...prev, zipCode: cleanCep }));
  
        if (cleanCep.length === 8) {
            setIsFetchingCep(true);
            try {
                const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
                const data = await response.json();
                if (!data.erro) {
                    setEditAddressForm(prev => ({
                        ...prev,
                        street: data.logradouro || prev.street,
                        neighborhood: data.bairro || prev.neighborhood,
                        city: data.localidade || prev.city,
                        state: data.uf || prev.state
                    }));
                }
            } catch (e) { console.error("Erro CEP", e); }
            finally { setIsFetchingCep(false); }
        }
    };

    const saveEditOrder = () => {
        if (editingOrder) {
            // Se o usuário mudou, atualiza nome do cliente também
            const selectedUser = allUsers.find(u => u.id === editingOrder.userId);
            const updates = {
                ...editingOrder,
                customerName: selectedUser ? selectedUser.name : editingOrder.customerName,
                shippingAddress: editAddressForm // Save the updated address
            };
            updateOrderDetails(editingOrder.id, updates);
            refreshData();
            setIsEditModalOpen(false);
        }
    };

    const handleOpenAdminStudio = (orderId: string, kitId: string) => {
        // Passa o ID do pedido e também o ID do Kit específico para edição
        navigate(`/admin/studio/${orderId}`, { state: { kitIdToEdit: kitId } });
    };

    // --- GROUPING LOGIC ---
    const groupItemsByKit = (items: MagnetItem[]) => {
        const groups: Record<string, MagnetItem[]> = {};
        items.forEach(item => {
            const key = item.kitId || 'avulso';
            if (!groups[key]) groups[key] = [];
            groups[key].push(item);
        });
        return groups;
    };

    const getKitName = (count: number) => {
        if (count <= 9) return 'Kit Start';
        if (count <= 18) return 'Kit Memories';
        return 'Kit Gallery';
    };

    // --- LIGHTBOX HANDLERS ---
    const openLightbox = (items: MagnetItem[], initialIndex: number) => {
        // PRIORITIZE ORIGINAL OR HIGH RES URL
        const images = items.map(item => item.originalUrl || item.highResUrl || item.croppedUrl);
        setLightboxImages(images);
        setLightboxIndex(initialIndex);
        setIsLightboxOpen(true);
        document.body.style.overflow = 'hidden';
    };

    const closeLightbox = useCallback(() => {
        setIsLightboxOpen(false);
        setLightboxImages([]);
        document.body.style.overflow = 'auto';
    }, []);

    const nextPhoto = useCallback((e?: React.MouseEvent) => {
        e?.stopPropagation();
        setLightboxIndex(prev => (prev + 1) % lightboxImages.length);
    }, [lightboxImages]);

    const prevPhoto = useCallback((e?: React.MouseEvent) => {
        e?.stopPropagation();
        setLightboxIndex(prev => (prev - 1 + lightboxImages.length) % lightboxImages.length);
    }, [lightboxImages]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isLightboxOpen) return;
            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowRight') nextPhoto();
            if (e.key === 'ArrowLeft') prevPhoto();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isLightboxOpen, nextPhoto, prevPhoto, closeLightbox]);

    // --- CONSENT TOGGLE HELPER FOR MODAL ---
    const toggleKitConsent = (kitId: string, currentConsent: boolean) => {
        if (!editingOrder || !editingOrder.items) return;

        const updatedItems = editingOrder.items.map(item => {
            // Check if item belongs to this kit (handling 'avulso' fallback)
            const itemKitId = item.kitId || 'avulso';
            if (itemKitId === kitId) {
                return { ...item, socialConsent: !currentConsent };
            }
            return item;
        });

        setEditingOrder({ ...editingOrder, items: updatedItems });
    };

    const inputClasses = "w-full h-10 px-3 bg-[#F5F5F7] rounded-lg text-sm text-[#1d1d1f] outline-none focus:bg-white focus:ring-1 focus:ring-[#B8860B] border border-transparent transition-all placeholder:text-gray-400";

    return (
        <>
            <div className="animate-fade-in space-y-6">
                
                {/* CONTROLS BAR: Search & Date */}
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
                    {/* Search */}
                    <div className="relative w-full md:flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#B8860B] transition-colors" size={18} />
                        <input 
                            type="text"
                            placeholder="Buscar por ID ou Nome..."
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

                    {/* Date Filter */}
                    <div className="flex items-center gap-2 w-full md:w-auto bg-[#F5F5F7] p-1.5 rounded-xl border border-transparent">
                        <div className="flex items-center gap-2 px-3">
                            <Calendar size={16} className="text-gray-400"/>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide hidden sm:inline">Período:</span>
                        </div>
                        <input 
                            type="date" 
                            value={dateStart}
                            onChange={(e) => setDateStart(e.target.value)}
                            className="bg-white border border-gray-200 text-gray-600 text-xs rounded-lg px-2 py-2 outline-none focus:border-[#B8860B] h-9"
                        />
                        <span className="text-gray-300">-</span>
                        <input 
                            type="date" 
                            value={dateEnd}
                            onChange={(e) => setDateEnd(e.target.value)}
                            className="bg-white border border-gray-200 text-gray-600 text-xs rounded-lg px-2 py-2 outline-none focus:border-[#B8860B] h-9"
                        />
                        {(dateStart || dateEnd) && (
                            <button onClick={() => { setDateStart(''); setDateEnd(''); }} className="p-2 hover:bg-white rounded-lg text-gray-400 hover:text-red-500 transition-colors">
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </div>

                {/* FILTER TABS */}
                <div className="flex flex-wrap md:flex-nowrap gap-2 w-full md:w-fit bg-transparent md:bg-white md:p-1.5 md:rounded-xl md:shadow-sm md:border md:border-gray-100">
                    {[{id: 'all', label: 'Todos'}, ...STATUS_STEPS.map(s => ({ id: s, label: getStatusConfig(s).label })), {id: 'cancelled', label: 'Cancelados'}].map(status => {
                        const count = counts[status.id as keyof typeof counts] || 0;
                        const isActive = orderStatusFilter === status.id;
                        
                        const isPendingAlert = status.id === 'pending' && count > 0;
                        const isCancelled = status.id === 'cancelled';

                        return (
                            <button
                                key={status.id}
                                onClick={() => setOrderStatusFilter(status.id as any)}
                                className={`
                                    flex-1 md:flex-none
                                    min-w-[calc(50%-0.5rem)] md:min-w-fit
                                    px-4 md:px-6 py-3 
                                    rounded-xl 
                                    text-[10px] font-bold uppercase tracking-widest 
                                    transition-all whitespace-nowrap 
                                    border flex items-center justify-center gap-2
                                    ${isActive 
                                        ? 'bg-[#1d1d1f] text-white border-[#1d1d1f] shadow-md' 
                                        : 'bg-white md:bg-transparent text-gray-400 border-gray-100 hover:text-gray-600 hover:bg-gray-50'
                                    }
                                `}
                            >
                                {status.label}
                                <span className={`
                                    px-1.5 py-0.5 rounded-full text-[8px] font-bold transition-colors
                                    ${isPendingAlert 
                                        ? 'bg-[#B8860B] text-white shadow-sm' 
                                        : isCancelled && isActive
                                            ? 'bg-red-500 text-white'
                                            : isActive 
                                                ? 'bg-white/20 text-white' 
                                                : isCancelled
                                                    ? 'bg-red-50 text-red-500'
                                                    : 'bg-gray-100 text-gray-400'
                                    }
                                `}>
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                    
                    {/* Trash Tab */}
                    <button
                        onClick={() => setOrderStatusFilter('deleted')}
                        className={`
                            flex-1 md:flex-none
                            min-w-[calc(50%-0.5rem)] md:min-w-fit
                            px-4 md:px-6 py-3 
                            rounded-xl 
                            text-[10px] font-bold uppercase tracking-widest 
                            transition-all whitespace-nowrap 
                            border flex items-center justify-center gap-2
                            ${orderStatusFilter === 'deleted'
                                ? 'bg-red-50 text-red-600 border-red-100 shadow-md' 
                                : 'bg-white md:bg-transparent text-gray-400 border-gray-100 hover:text-gray-600 hover:bg-gray-50'
                            }
                        `}
                    >
                        Lixeira
                        <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-bold transition-colors ${orderStatusFilter === 'deleted' ? 'bg-red-200 text-red-700' : 'bg-gray-100 text-gray-400'}`}>
                            {counts.deleted}
                        </span>
                    </button>
                </div>

                <div className="space-y-4">
                    {currentOrders.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                            <p className="text-gray-400 text-sm font-medium">Nenhum pedido encontrado com estes filtros.</p>
                            <button onClick={() => { setGlobalSearch(''); setDateStart(''); setDateEnd(''); setOrderStatusFilter('all'); }} className="mt-3 text-[#B8860B] text-xs font-bold uppercase tracking-widest hover:underline">
                                Limpar filtros
                            </button>
                        </div>
                    ) : (
                        currentOrders.map(order => {
                            const statusConfig = getStatusConfig(order.status);
                            const isExpanded = expandedOrderId === order.id;
                            const currentGlobalStepIdx = STATUS_STEPS.indexOf(order.status);
                            const progressPercent = (currentGlobalStepIdx / (STATUS_STEPS.length - 1)) * 100;
                            const groupedItems = groupItemsByKit(order.items || []);
                            const isCancelled = order.status === 'cancelled';

                            return (
                                <div key={order.id} className={`bg-white rounded-xl border transition-all duration-300 relative overflow-hidden ${isExpanded ? 'shadow-xl border-[#B8860B]/30' : 'border-gray-100 shadow-sm hover:shadow-md'} ${order.deleted ? 'opacity-70 grayscale' : ''}`}>
                                    
                                    {/* Card Header (Clickable) */}
                                    <div onClick={() => setExpandedOrderId(isExpanded ? null : order.id)} className="p-6 flex flex-col md:flex-row justify-between items-center gap-6 cursor-pointer select-none relative group">
                                        
                                        {/* Mobile Arrow - Top Right Absolute */}
                                        <div className="absolute top-6 right-6 md:hidden">
                                            <div className={`p-2 rounded-full bg-[#F5F5F7] text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180 bg-[#1d1d1f] text-white' : ''}`}>
                                                <ChevronDown size={16} />
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-5 w-full md:w-auto pr-10 md:pr-0">
                                            <div className="w-12 h-12 rounded-lg bg-[#F5F5F7] flex items-center justify-center font-bold text-lg text-[#1d1d1f] shrink-0">
                                                {order.customerName.charAt(0)}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-3">
                                                    <h3 className="font-bold text-[#1d1d1f] text-base truncate">{order.customerName}</h3>
                                                    {order.userId?.includes('admin') && <span className="bg-gray-100 text-gray-500 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase shrink-0">Admin User</span>}
                                                    {order.deleted && <span className="bg-red-100 text-red-600 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase flex items-center gap-1 shrink-0"><Trash2 size={10}/> Excluído</span>}
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest truncate">
                                                        #{order.id} • {order.itemsCount} Itens
                                                    </p>
                                                    {/* Badge via Admin moved here */}
                                                    {order.createdByAdmin && (
                                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 text-[8px] font-bold uppercase tracking-widest border border-indigo-100 shrink-0" title="Criado manualmente pelo painel">
                                                            <Shield size={10} /> Via Admin
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Reduced gap and adjusted spacing for mobile */}
                                        <div className="flex items-center justify-between w-full md:w-auto gap-2 md:gap-4 border-t md:border-t-0 border-gray-50 pt-4 md:pt-0">
                                            {!order.deleted && !isCancelled && (
                                                <div className="flex items-center gap-1">
                                                    <button onClick={(e) => openEditModal(e, order)} className="p-2 text-gray-400 hover:text-[#B8860B] hover:bg-gray-50 rounded-full transition-colors" title="Editar Pedido">
                                                        <Edit3 size={16} />
                                                    </button>
                                                    <button onClick={(e) => openCancelModal(e, order)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors" title="Cancelar Pedido">
                                                        <Ban size={16} />
                                                    </button>
                                                    <button onClick={(e) => handleSoftDelete(e, order)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-50 rounded-full transition-colors" title="Mover para Lixeira">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            )}
                                            {isCancelled && !order.deleted && (
                                                <div className="flex items-center gap-1">
                                                    <button onClick={(e) => openRevertModal(e, order)} className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors" title="Reverter Cancelamento">
                                                        <RotateCcw size={16} />
                                                    </button>
                                                    <button onClick={(e) => handleSoftDelete(e, order)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-50 rounded-full transition-colors" title="Mover para Lixeira">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            )}
                                            {order.deleted && (
                                                <div className="flex items-center gap-1">
                                                    <button onClick={(e) => handleRestore(e, order)} className="p-2 text-gray-400 hover:text-emerald-500 hover:bg-gray-50 rounded-full transition-colors" title="Restaurar Pedido">
                                                        <RefreshCw size={16} />
                                                    </button>
                                                </div>
                                            )}
                                            <span className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest border whitespace-nowrap ${statusConfig.color}`}>
                                                {statusConfig.label}
                                            </span>
                                            <span className="font-serif font-bold text-xl text-[#1d1d1f] whitespace-nowrap">
                                                R$ {order.total.toFixed(2)}
                                            </span>
                                            
                                            {/* Desktop Arrow */}
                                            <div className={`hidden md:block p-2 rounded-full bg-[#F5F5F7] text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180 bg-[#1d1d1f] text-white' : ''}`}>
                                                <ChevronDown size={16} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expanded Content (Same as before) */}
                                    {isExpanded && (
                                        <div className="border-t border-gray-100 bg-[#FAFAFA] p-4 md:p-8 animate-fade-in rounded-b-xl cursor-default">
                                            
                                            {/* STATUS VISUALIZATION: TIMELINE OR CANCEL BANNER */}
                                            {isCancelled ? (
                                                <div className="mb-8 p-6 bg-red-50 border border-red-100 rounded-xl flex items-start gap-4">
                                                    <div className="p-2 bg-red-100 rounded-full text-red-600 shrink-0">
                                                        <AlertOctagon size={24} />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-red-800 font-bold text-sm uppercase tracking-widest mb-2">Pedido Cancelado</h4>
                                                        <p className="text-red-700 text-sm leading-relaxed font-light">
                                                            <strong>Motivo:</strong> {order.cancellationReason || "Nenhuma justificativa informada."}
                                                        </p>
                                                    </div>
                                                </div>
                                            ) : (
                                                // ... Timeline ...
                                                <div className="mb-8 relative px-0 md:px-10 py-6 select-none">
                                                    <div className="absolute top-1/2 left-[12.5%] right-[12.5%] h-1 -translate-y-1/2 z-0 rounded-full overflow-hidden bg-gray-200">
                                                        <div className="h-full transition-all duration-500 ease-out bg-[#1d1d1f]" style={{ width: `${progressPercent}%` }}></div>
                                                    </div>
                                                    <div className="relative z-10 flex justify-between w-full">
                                                        {STATUS_STEPS.map((step, idx) => {
                                                            const stepConf = getStatusConfig(step);
                                                            const currentStepIdx = STATUS_STEPS.indexOf(order.status);
                                                            const isActive = idx <= currentStepIdx;
                                                            const activeStyle = STEP_ACTIVE_STYLES[step];
                                                            const inactiveStyle = `bg-white border-4 border-gray-100 text-gray-300 ${STEP_HOVER_STYLES[step]}`;
                                                            let alignClass = "items-center";
                                                            if (idx === 0) alignClass = "items-start";
                                                            if (idx === STATUS_STEPS.length - 1) alignClass = "items-end";

                                                            return (
                                                                <div key={step} className={`flex flex-col group cursor-pointer relative w-1/4 ${alignClass}`} onClick={(e) => handleStatusClick(e, order, step)}>
                                                                    <div className="hidden md:block absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-[#1d1d1f] text-white text-[9px] font-bold py-1.5 px-3 rounded shadow-lg mb-2 whitespace-nowrap pointer-events-none z-30 left-1/2 -translate-x-1/2">
                                                                        Mudar para {stepConf.label}
                                                                    </div>
                                                                    <div className="flex justify-center w-full">
                                                                        <button className={`w-10 h-10 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all duration-500 transform shadow-sm z-20 ${isActive ? activeStyle : inactiveStyle}`} type="button">
                                                                            <stepConf.icon size={16} strokeWidth={2.5} className="md:w-5 md:h-5" />
                                                                        </button>
                                                                    </div>
                                                                    <span className={`text-[9px] md:text-[10px] font-bold uppercase tracking-widest mt-2 md:mt-4 px-0 transition-colors z-20 whitespace-nowrap ${isActive ? 'text-[#1d1d1f]' : 'text-gray-300'} text-center w-full`}>
                                                                        {stepConf.label}
                                                                    </span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            {/* ... Addresses and Summary ... */}
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                                                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                                                    <h4 className="text-[10px] font-bold text-[#B8860B] uppercase tracking-widest mb-4 flex items-center gap-2"><MapPin size={14} /> Entrega</h4>
                                                    {order.shippingAddress ? (
                                                        <div className="text-sm text-gray-600 space-y-1">
                                                            <p className="font-bold text-[#1d1d1f] text-base">{order.shippingAddress.street}, {order.shippingAddress.number}</p>
                                                            <p className="text-[#86868b]">{order.shippingAddress.neighborhood}</p>
                                                            <p className="text-[#86868b]">{order.shippingAddress.city} - {order.shippingAddress.state.split(' - ').pop()}</p>
                                                            
                                                            <div className="inline-flex items-center px-3 py-1.5 bg-white border border-gray-200 rounded-md shadow-sm mt-2">
                                                                <span className="text-[10px] font-bold text-[#1d1d1f] uppercase tracking-widest">
                                                                    CEP: {formatCep(order.shippingAddress.zipCode)}
                                                                </span>
                                                            </div>

                                                            {order.shippingAddress.complement && <p className="text-gray-400 italic text-xs pt-1">Comp: {order.shippingAddress.complement}</p>}
                                                        </div>
                                                    ) : (<p className="text-sm text-gray-400 italic">Endereço não informado.</p>)}
                                                </div>
                                                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                                                    <h4 className="text-[10px] font-bold text-[#B8860B] uppercase tracking-widest mb-4 flex items-center gap-2"><Receipt size={14} /> Resumo</h4>
                                                    <div className="space-y-3 text-sm">
                                                        <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>R$ {order.subtotal?.toFixed(2)}</span></div>
                                                        <div className="flex justify-between text-gray-500"><span>Frete</span><span>R$ {order.shippingCost?.toFixed(2)}</span></div>
                                                        {order.discount ? (<div className="flex justify-between text-emerald-600 font-bold"><span>Desconto</span><span>- R$ {order.discount.toFixed(2)}</span></div>) : null}
                                                        <div className="pt-3 border-t border-gray-100 flex justify-between font-bold text-[#1d1d1f] text-lg"><span>Total</span><span>R$ {order.total.toFixed(2)}</span></div>
                                                    </div>
                                                </div>
                                            </div>

                                            <button onClick={() => handleDownloadPhotos(order)} disabled={!!downloadingOrderId} className="w-full py-4 bg-[#1d1d1f] text-white rounded-lg font-bold text-[10px] uppercase tracking-[0.2em] hover:bg-black transition-all shadow-lg flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed mb-10">
                                                {downloadingOrderId === order.id ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} Baixar Arquivos
                                            </button>

                                            {/* ... Grouped Items ... */}
                                            {order.items && order.items.length > 0 && (
                                                <div className="space-y-8">
                                                    <h4 className="text-[10px] font-bold text-[#B8860B] uppercase tracking-widest border-b border-gray-100 pb-2">Itens Separados por Kit</h4>
                                                    {Object.entries(groupedItems).map(([kitId, kitItems]) => {
                                                        const consent = kitItems[0].socialConsent !== undefined ? kitItems[0].socialConsent : order.socialSharingConsent;
                                                        return (
                                                            <div key={kitId} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                                                                <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="p-1.5 bg-[#F5F5F7] rounded-md text-[#B8860B]"><Layers size={14} /></div>
                                                                        <div>
                                                                            <h5 className="text-[11px] font-bold text-[#1d1d1f] uppercase tracking-wider">{getKitName(kitItems.length)}</h5>
                                                                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{kitItems.length} fotos</p>
                                                                        </div>
                                                                    </div>
                                                                    <div>
                                                                        {consent ? (
                                                                            <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-100 shadow-sm text-[9px] font-bold uppercase tracking-widest"><Camera size={12} /> Uso Autorizado</span>
                                                                        ) : (
                                                                            <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-500 px-3 py-1.5 rounded-lg border border-gray-200 text-[9px] font-bold uppercase tracking-widest"><Shield size={12} /> Privado</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="flex gap-3 overflow-x-auto pb-2 md:flex-wrap md:overflow-visible md:pb-0 scrollbar-hide">
                                                                    {kitItems.map((item, kitIdx) => (
                                                                        <div key={item.id} className="w-20 h-20 rounded-lg border border-gray-200 p-1 bg-white shadow-sm shrink-0 cursor-zoom-in hover:border-[#B8860B] transition-colors relative group" onClick={() => openLightbox(kitItems, kitIdx)}>
                                                                            {/* Prioritize High Quality in Thumbnail */}
                                                                            <img src={item.originalUrl || item.highResUrl || item.croppedUrl} className="w-full h-full object-cover rounded" alt={`Item ${kitIdx}`} />
                                                                            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded"><ZoomIn size={16} className="text-white drop-shadow-md"/></div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                {/* PAGINATION FOOTER */}
                {filteredOrders.length > 0 && (
                    <div className="flex flex-col sm:flex-row justify-end items-center gap-4 sm:gap-6 pt-6 text-[11px] text-gray-500 font-medium select-none animate-fade-in border-t border-gray-100/50">
                        {/* ... Existing Pagination JSX ... */}
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
                                        <option value={10}>10</option>
                                        <option value={30}>30</option>
                                        <option value={50}>50</option>
                                    </select>
                                    <ChevronDown size={10} className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none opacity-50 group-hover:opacity-100" />
                                </div>
                            </div>

                            {/* Range Info */}
                            <span className="text-[#1d1d1f]">
                                {indexOfFirstOrder + 1}-{Math.min(indexOfLastOrder, filteredOrders.length)} de {filteredOrders.length}
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
            </div>

            {/* CANCEL CONFIRMATION MODAL */}
            {isCancelModalOpen && orderToCancel && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#1d1d1f]/60 backdrop-blur-md" onClick={() => setIsCancelModalOpen(false)}></div>
                    <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl relative overflow-hidden flex flex-col animate-fade-in border border-gray-100 p-8 text-center z-10">
                        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Ban size={32} />
                        </div>
                        <h3 className="font-serif font-bold text-2xl text-[#1d1d1f] mb-2">Cancelar Pedido #{orderToCancel.id}?</h3>
                        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                            Esta ação interromperá o fluxo do pedido. <br/>É <strong>obrigatório</strong> fornecer uma justificativa para registro.
                        </p>
                        
                        <textarea 
                            value={cancellationReason}
                            onChange={(e) => setCancellationReason(e.target.value)}
                            placeholder="Ex: Cancelado a pedido do cliente; Falta de estoque; Erro no pagamento..."
                            className="w-full h-32 p-4 bg-[#F5F5F7] border border-transparent rounded-xl text-sm outline-none focus:bg-white focus:border-red-300 focus:ring-2 focus:ring-red-100 transition-all resize-none mb-6"
                        />

                        <div className="flex gap-3">
                            <button 
                                onClick={() => setIsCancelModalOpen(false)}
                                className="flex-1 py-4 bg-gray-100 text-[#1d1d1f] font-bold text-[10px] uppercase tracking-widest rounded-xl hover:bg-gray-200 transition-all"
                            >
                                Voltar
                            </button>
                            <button 
                                onClick={confirmCancellation}
                                className="flex-1 py-4 bg-red-500 text-white font-bold text-[10px] uppercase tracking-widest rounded-xl hover:bg-red-600 transition-all shadow-lg shadow-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={!cancellationReason.trim()}
                            >
                                Confirmar Cancelamento
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* REVERT CONFIRMATION MODAL */}
            {isRevertModalOpen && orderToRevert && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#1d1d1f]/60 backdrop-blur-md" onClick={() => setIsRevertModalOpen(false)}></div>
                    <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl relative overflow-hidden flex flex-col animate-fade-in border border-gray-100 p-8 text-center z-10">
                        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <RotateCcw size={32} />
                        </div>
                        <h3 className="font-serif font-bold text-2xl text-[#1d1d1f] mb-2">Restaurar Pedido #{orderToRevert.id}?</h3>
                        <p className="text-sm text-gray-500 mb-8 leading-relaxed">
                            O pedido voltará para o status <strong>'Pendente'</strong> e o motivo do cancelamento será removido.
                        </p>
                        
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setIsRevertModalOpen(false)}
                                className="flex-1 py-4 bg-gray-100 text-[#1d1d1f] font-bold text-[10px] uppercase tracking-widest rounded-xl hover:bg-gray-200 transition-all"
                            >
                                Voltar
                            </button>
                            <button 
                                onClick={confirmRevert}
                                className="flex-1 py-4 bg-emerald-600 text-white font-bold text-[10px] uppercase tracking-widest rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
                            >
                                Confirmar Restauração
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* LIGHTBOX OVERLAY (Same as before) */}
            {isLightboxOpen && (
                <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-sm flex items-center justify-center animate-fade-in p-4" onClick={closeLightbox}>
                    <button onClick={closeLightbox} className="absolute top-4 right-4 md:top-8 md:right-8 p-3 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all z-50"><X size={24} /></button>
                    <div className="relative w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                        {lightboxImages.length > 1 && (<button onClick={prevPhoto} className="absolute left-0 md:left-4 p-4 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all z-50"><ChevronLeft size={36} strokeWidth={1.5} /></button>)}
                        <img src={lightboxImages[lightboxIndex]} className="max-w-full max-h-[85vh] object-contain rounded shadow-2xl select-none" alt="Visualização" />
                        {lightboxImages.length > 1 && (<button onClick={nextPhoto} className="absolute right-0 md:right-4 p-4 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all z-50"><ChevronRight size={36} strokeWidth={1.5} /></button>)}
                    </div>
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-black/50 rounded-full border border-white/10 pointer-events-none"><span className="text-[10px] font-bold text-white/80 tracking-[0.2em]">{lightboxIndex + 1} / {lightboxImages.length}</span></div>
                </div>
            )}

            {/* EDIT ORDER MODAL (Same as before) */}
            {isEditModalOpen && editingOrder && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#1d1d1f]/60 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)}></div>
                    <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl relative overflow-hidden flex flex-col animate-fade-in border border-gray-100 max-h-[90vh]">
                        <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center bg-white sticky top-0 z-10">
                            <div>
                                <h3 className="font-serif font-bold text-2xl text-[#1d1d1f]">Editar Pedido</h3>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Controle Total Admin</p>
                            </div>
                            <button onClick={() => setIsEditModalOpen(false)}><X size={24} className="text-gray-400 hover:text-[#1d1d1f]"/></button>
                        </div>

                        <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar">
                            {/* 1. Change User (Autocomplete Search) */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold text-[#86868b] uppercase tracking-widest flex items-center gap-2"><UserCheck size={14}/> Cliente Vinculado</label>
                                
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16}/>
                                    <input 
                                        type="text"
                                        placeholder="Buscar por nome ou e-mail..."
                                        className="w-full h-12 pl-12 pr-10 bg-[#F5F5F7] rounded-lg text-sm border border-transparent focus:bg-white focus:border-[#B8860B] outline-none transition-all placeholder:text-gray-400"
                                        value={userSearchTerm}
                                        onChange={(e) => {
                                            setUserSearchTerm(e.target.value);
                                            setShowUserDropdown(true);
                                        }}
                                        onFocus={() => setShowUserDropdown(true)}
                                        ref={userSearchInputRef}
                                    />
                                    {userSearchTerm && (
                                        <button 
                                            onClick={handleClearUserSearch}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#B8860B] bg-[#F5F5F7] hover:bg-gray-100 rounded-full p-1 transition-all"
                                            title="Limpar busca"
                                        >
                                            <X size={14} />
                                        </button>
                                    )}
                                    
                                    {/* Dropdown Results */}
                                    {showUserDropdown && userSearchTerm && (
                                        <div className="absolute z-20 top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-100 max-h-48 overflow-y-auto custom-scrollbar">
                                            {filteredUsersForModal.length > 0 ? (
                                                filteredUsersForModal.map(u => (
                                                    <div 
                                                        key={u.id}
                                                        onClick={() => handleSelectUser(u)}
                                                        className={`px-4 py-3 cursor-pointer hover:bg-[#F5F5F7] flex flex-col ${editingOrder.userId === u.id ? 'bg-[#F5F5F7] border-l-4 border-[#B8860B]' : 'border-l-4 border-transparent'}`}
                                                    >
                                                        <span className="text-sm font-bold text-[#1d1d1f]">{u.name}</span>
                                                        <span className="text-[10px] text-gray-400">{u.email}</span>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="px-4 py-3 text-center text-xs text-gray-400">Nenhum cliente encontrado.</div>
                                            )}
                                        </div>
                                    )}
                                    
                                    {/* Overlay to close dropdown on click outside - Simple transparent fixed div */}
                                    {showUserDropdown && (
                                        <div className="fixed inset-0 z-10" onClick={() => setShowUserDropdown(false)}></div>
                                    )}
                                </div>
                            </div>

                            {/* 1.5 Address Editing */}
                            <div className="space-y-3 pt-4 border-t border-gray-50">
                                <label className="text-[10px] font-bold text-[#86868b] uppercase tracking-widest flex items-center gap-2"><MapPin size={14}/> Endereço de Entrega</label>
                                
                                {/* CARD SELECTION GRID */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                                    {editingUserObject?.savedAddresses?.map((addr, i) => {
                                        const isSelected = activeAddressCardId === addr.id;
                                        return (
                                            <button
                                                key={addr.id || i}
                                                type="button"
                                                onClick={() => handleFillAddress(addr.id || '')}
                                                className={`p-3 rounded-xl border text-left transition-all relative group ${isSelected ? 'bg-[#B8860B]/5 border-[#B8860B] ring-1 ring-[#B8860B]/20' : 'bg-white border-gray-200 hover:border-gray-300'}`}
                                            >
                                                {addr.nickname && <span className="text-[9px] font-bold uppercase tracking-widest block mb-1 text-[#B8860B]">{addr.nickname}</span>}
                                                <p className="text-xs font-bold text-[#1d1d1f] truncate">{addr.street}, {addr.number}</p>
                                                <p className="text-[10px] text-gray-500">{addr.zipCode}</p>
                                                {isSelected && <div className="absolute top-2 right-2 text-[#B8860B]"><CheckCircle size={14} /></div>}
                                            </button>
                                        );
                                    })}
                                    
                                    <button 
                                        type="button"
                                        onClick={() => handleFillAddress('new')}
                                        className={`p-3 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-[#B8860B] hover:border-[#B8860B] transition-all bg-gray-50/50 hover:bg-white ${activeAddressCardId === 'new' ? 'border-[#B8860B] text-[#B8860B] bg-[#B8860B]/5' : 'border-gray-200'}`}
                                    >
                                        <Plus size={18} />
                                        <span className="text-[10px] font-bold uppercase tracking-widest">Novo / Manual</span>
                                    </button>
                                </div>

                                <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <div className="relative">
                                        <input 
                                            value={editAddressForm.zipCode} 
                                            onChange={e => handleCepLookup(e.target.value)} 
                                            placeholder="CEP" 
                                            className={inputClasses}
                                            maxLength={9}
                                        />
                                        {isFetchingCep && <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-[#B8860B]"/>}
                                    </div>
                                    <div className="grid grid-cols-3 gap-3">
                                        <input value={editAddressForm.street} onChange={e => setEditAddressForm(prev => ({...prev, street: e.target.value}))} placeholder="Rua" className={`${inputClasses} col-span-2`} />
                                        <input value={editAddressForm.number} onChange={e => setEditAddressForm(prev => ({...prev, number: e.target.value}))} placeholder="Nº" className={inputClasses} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <input value={editAddressForm.complement} onChange={e => setEditAddressForm(prev => ({...prev, complement: e.target.value}))} placeholder="Comp." className={inputClasses} />
                                        <input value={editAddressForm.neighborhood} onChange={e => setEditAddressForm(prev => ({...prev, neighborhood: e.target.value}))} placeholder="Bairro" className={inputClasses} />
                                    </div>
                                    <div className="grid grid-cols-3 gap-3">
                                        <input value={editAddressForm.city} onChange={e => setEditAddressForm(prev => ({...prev, city: e.target.value}))} placeholder="Cidade" className={`${inputClasses} col-span-2`} />
                                        <input value={editAddressForm.state} onChange={e => setEditAddressForm(prev => ({...prev, state: e.target.value}))} placeholder="UF" maxLength={2} className={`${inputClasses} text-center uppercase`} />
                                    </div>
                                </div>
                            </div>

                            {/* 2. Consent Management Per Kit */}
                            <div className="space-y-4 pt-4 border-t border-gray-100">
                                <label className="text-[10px] font-bold text-[#86868b] uppercase tracking-widest flex items-center gap-2"><Camera size={14}/> Consentimento por Kit</label>
                                {Object.entries(groupItemsByKit(editingOrder.items || [])).map(([kitId, items]) => {
                                    const kitConsent = items[0]?.socialConsent !== undefined ? items[0].socialConsent : !!editingOrder.socialSharingConsent;
                                    return (
                                        <div key={kitId} onClick={() => toggleKitConsent(kitId, kitConsent)} className={`p-4 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${kitConsent ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                                            <div className="flex items-center gap-3">
                                                {kitConsent ? <CheckCircle size={20} className="text-emerald-500"/> : <Shield size={20} className="text-gray-400"/>}
                                                <div>
                                                    <span className={`text-xs font-bold uppercase tracking-widest block ${kitConsent ? 'text-emerald-600' : 'text-gray-500'}`}>{getKitName(items.length)}</span>
                                                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wide">{kitConsent ? 'Permitido Publicar' : 'Uso Privado'} • {items.length} fotos</span>
                                                </div>
                                            </div>
                                            {kitConsent ? <ToggleRight size={24} className="text-emerald-500"/> : <ToggleLeft size={24} className="text-gray-300"/>}
                                        </div>
                                    );
                                })}
                                {(!editingOrder.items || editingOrder.items.length === 0) && (<div className="p-4 rounded-lg bg-gray-50 border border-gray-200 text-center text-xs text-gray-400">Nenhum kit encontrado neste pedido.</div>)}
                            </div>

                            {/* 3. Studio Links Per Kit */}
                            <div className="space-y-4 pt-4 border-t border-gray-100">
                                <label className="text-[10px] font-bold text-[#86868b] uppercase tracking-widest flex items-center gap-2"><Wand2 size={14}/> Edição de Fotos (Por Kit)</label>
                                {Object.entries(groupItemsByKit(editingOrder.items || [])).map(([kitId, items]) => (
                                    <button 
                                        key={kitId}
                                        onClick={() => handleOpenAdminStudio(editingOrder.id, kitId)}
                                        className="w-full py-4 bg-[#1d1d1f] text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-black shadow-lg transition-all flex items-center justify-center gap-3"
                                    >
                                        <Wand2 size={16} /> Editar {getKitName(items.length)} ({items.length} fotos)
                                    </button>
                                ))}
                                <p className="text-[10px] text-center text-gray-400">Clique para abrir o editor exclusivo para o kit selecionado.</p>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-50 bg-white flex gap-4">
                            <button onClick={() => setIsEditModalOpen(false)} className="flex-1 py-3 bg-gray-100 text-[#1d1d1f] font-bold text-[10px] uppercase tracking-widest rounded-lg hover:bg-gray-200 transition-all">Cancelar</button>
                            <button onClick={saveEditOrder} className="flex-1 py-3 bg-[#B8860B] text-white font-bold text-[10px] uppercase tracking-widest rounded-lg hover:bg-[#966d09] shadow-md transition-all">Salvar Alterações</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default AdminOrders;
