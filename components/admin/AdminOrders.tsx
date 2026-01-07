
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
    Package, Clock, Box, Truck, CheckCircle, ChevronDown, 
    Loader2, Download, MapPin, Receipt, Search, X, ChevronLeft, ChevronRight, ZoomIn, Calendar, Layers,
    Camera, Shield
} from 'lucide-react';
import { Order, MagnetItem } from '../../types';
import { updateOrderStatus } from '../../services/mockService';

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
    orderStatusFilter: 'all' | Order['status'];
    setOrderStatusFilter: (val: 'all' | Order['status']) => void;
}

const AdminOrders: React.FC<AdminOrdersProps> = ({ orders, globalSearch, setGlobalSearch, refreshData, orderStatusFilter, setOrderStatusFilter }) => {
    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
    const [downloadingOrderId, setDownloadingOrderId] = useState<string | null>(null);
    
    // Date Filters
    const [dateStart, setDateStart] = useState('');
    const [dateEnd, setDateEnd] = useState('');

    // Lightbox State
    const [lightboxImages, setLightboxImages] = useState<string[]>([]);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);

    // Counts Calculation
    const counts = useMemo(() => {
        return {
            all: orders.length,
            pending: orders.filter(o => o.status === 'pending').length,
            production: orders.filter(o => o.status === 'production').length,
            shipped: orders.filter(o => o.status === 'shipped').length,
            delivered: orders.filter(o => o.status === 'delivered').length,
        };
    }, [orders]);

    // Helper to parse "DD/MM/YYYY" to Date object
    const parseDate = (dateStr: string) => {
        const parts = dateStr.split('/');
        return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
    };

    const filteredOrders = useMemo(() => {
        return orders.filter(o => {
            // 1. Text Search
            const searchLower = globalSearch.toLowerCase();
            const matchesSearch = 
              o.customerName.toLowerCase().includes(searchLower) || 
              o.id.toLowerCase().includes(searchLower);
            
            if (!matchesSearch) return false;

            // 2. Status Filter
            const matchesStatus = orderStatusFilter === 'all' || o.status === orderStatusFilter;
            if (!matchesStatus) return false;

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

    const handleStatusClick = (e: React.MouseEvent, order: Order, step: string) => {
        e.preventDefault();
        e.stopPropagation();
        
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
        const images = items.map(item => item.croppedUrl || item.originalUrl);
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
                    {[{id: 'all', label: 'Todos'}, ...STATUS_STEPS.map(s => ({ id: s, label: getStatusConfig(s).label }))].map(status => {
                        const count = counts[status.id as keyof typeof counts] || 0;
                        const isActive = orderStatusFilter === status.id;
                        
                        // New Logic: Badge is Gold if Pending > 0, regardless of selection.
                        const isPendingAlert = status.id === 'pending' && count > 0;

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
                                        ? 'bg-[#B8860B] text-white shadow-sm' // Always gold if pending > 0
                                        : isActive 
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

                <div className="space-y-4">
                    {filteredOrders.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                            <p className="text-gray-400 text-sm font-medium">Nenhum pedido encontrado com estes filtros.</p>
                            <button onClick={() => { setGlobalSearch(''); setDateStart(''); setDateEnd(''); setOrderStatusFilter('all'); }} className="mt-3 text-[#B8860B] text-xs font-bold uppercase tracking-widest hover:underline">
                                Limpar filtros
                            </button>
                        </div>
                    ) : (
                        filteredOrders.map(order => {
                            const statusConfig = getStatusConfig(order.status);
                            const isExpanded = expandedOrderId === order.id;
                            
                            const currentGlobalStepIdx = STATUS_STEPS.indexOf(order.status);
                            const progressPercent = (currentGlobalStepIdx / (STATUS_STEPS.length - 1)) * 100;

                            const groupedItems = groupItemsByKit(order.items || []);

                            return (
                                <div key={order.id} className={`bg-white rounded-xl border transition-all duration-300 ${isExpanded ? 'shadow-xl border-[#B8860B]/30' : 'border-gray-100 shadow-sm hover:shadow-md'}`}>
                                    {/* Card Header */}
                                    <div onClick={() => setExpandedOrderId(isExpanded ? null : order.id)} className="p-6 flex flex-col md:flex-row justify-between items-center gap-6 cursor-pointer select-none">
                                        <div className="flex items-center gap-5 w-full md:w-auto">
                                            <div className="w-12 h-12 rounded-lg bg-[#F5F5F7] flex items-center justify-center font-bold text-lg text-[#1d1d1f]">
                                                {order.customerName.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3">
                                                    <h3 className="font-bold text-[#1d1d1f] text-base">{order.customerName}</h3>
                                                    {order.userId?.includes('admin') && <span className="bg-gray-100 text-gray-500 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">Admin</span>}
                                                </div>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                                                    #{order.id} • {order.itemsCount} Itens
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between w-full md:w-auto gap-8 border-t md:border-t-0 border-gray-50 pt-4 md:pt-0">
                                            <span className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest border ${statusConfig.color}`}>
                                                {statusConfig.label}
                                            </span>
                                            <span className="font-serif font-bold text-xl text-[#1d1d1f]">
                                                R$ {order.total.toFixed(2)}
                                            </span>
                                            <div className={`p-2 rounded-full bg-[#F5F5F7] text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180 bg-[#1d1d1f] text-white' : ''}`}>
                                                <ChevronDown size={16} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expanded Content */}
                                    {isExpanded && (
                                        <div className="border-t border-gray-100 bg-[#FAFAFA] p-4 md:p-8 animate-fade-in rounded-b-xl cursor-default">
                                            
                                            {/* Status Timeline */}
                                            <div className="mb-8 relative px-0 md:px-10 py-6 select-none">
                                                <div className="absolute top-1/2 left-[12.5%] right-[12.5%] h-1 -translate-y-1/2 z-0 rounded-full overflow-hidden bg-gray-200">
                                                    <div 
                                                        className="h-full transition-all duration-500 ease-out bg-[#1d1d1f]"
                                                        style={{ width: `${progressPercent}%` }}
                                                    ></div>
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
                                                            <div 
                                                                key={step} 
                                                                className={`flex flex-col group cursor-pointer relative w-1/4 ${alignClass}`}
                                                                onClick={(e) => handleStatusClick(e, order, step)}
                                                            >
                                                                <div className="hidden md:block absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-[#1d1d1f] text-white text-[9px] font-bold py-1.5 px-3 rounded shadow-lg mb-2 whitespace-nowrap pointer-events-none z-30 left-1/2 -translate-x-1/2">
                                                                    Mudar para {stepConf.label}
                                                                </div>
                                                                <div className="flex justify-center w-full">
                                                                    <button 
                                                                        className={`w-10 h-10 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all duration-500 transform shadow-sm z-20 ${isActive ? activeStyle : inactiveStyle}`}
                                                                        type="button"
                                                                    >
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

                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                                                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                                                    <h4 className="text-[10px] font-bold text-[#B8860B] uppercase tracking-widest mb-4 flex items-center gap-2">
                                                        <MapPin size={14} /> Entrega
                                                    </h4>
                                                    {order.shippingAddress ? (
                                                        <div className="text-sm text-gray-600 space-y-1">
                                                            <p className="font-bold text-[#1d1d1f] text-base">{order.shippingAddress.street}, {order.shippingAddress.number}</p>
                                                            <p>{order.shippingAddress.neighborhood} - {order.shippingAddress.city}/{order.shippingAddress.state}</p>
                                                            <p className="text-gray-400">CEP: {order.shippingAddress.zipCode}</p>
                                                            {order.shippingAddress.complement && <p className="text-gray-400 italic text-xs">Comp: {order.shippingAddress.complement}</p>}
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm text-gray-400 italic">Endereço não informado.</p>
                                                    )}
                                                </div>

                                                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                                                    <h4 className="text-[10px] font-bold text-[#B8860B] uppercase tracking-widest mb-4 flex items-center gap-2">
                                                        <Receipt size={14} /> Resumo
                                                    </h4>
                                                    <div className="space-y-3 text-sm">
                                                        <div className="flex justify-between text-gray-500">
                                                            <span>Subtotal</span>
                                                            <span>R$ {order.subtotal?.toFixed(2)}</span>
                                                        </div>
                                                        <div className="flex justify-between text-gray-500">
                                                            <span>Frete</span>
                                                            <span>R$ {order.shippingCost?.toFixed(2)}</span>
                                                        </div>
                                                        {order.discount ? (
                                                            <div className="flex justify-between text-emerald-600 font-bold">
                                                                <span>Desconto</span>
                                                                <span>- R$ {order.discount.toFixed(2)}</span>
                                                            </div>
                                                        ) : null}
                                                        <div className="pt-3 border-t border-gray-100 flex justify-between font-bold text-[#1d1d1f] text-lg">
                                                            <span>Total</span>
                                                            <span>R$ {order.total.toFixed(2)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <button 
                                                onClick={() => handleDownloadPhotos(order)}
                                                disabled={!!downloadingOrderId}
                                                className="w-full py-4 bg-[#1d1d1f] text-white rounded-lg font-bold text-[10px] uppercase tracking-[0.2em] hover:bg-black transition-all shadow-lg flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed mb-10"
                                            >
                                                {downloadingOrderId === order.id ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                                                Baixar Arquivos
                                            </button>

                                            {/* Grouped Items Preview with PER KIT consent badge */}
                                            {order.items && order.items.length > 0 && (
                                                <div className="space-y-8">
                                                    <h4 className="text-[10px] font-bold text-[#B8860B] uppercase tracking-widest border-b border-gray-100 pb-2">Itens Separados por Kit</h4>
                                                    
                                                    {Object.entries(groupedItems).map(([kitId, kitItems]) => {
                                                        const consent = kitItems[0].socialConsent !== undefined ? kitItems[0].socialConsent : order.socialSharingConsent;
                                                        
                                                        return (
                                                            <div key={kitId} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                                                                <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="p-1.5 bg-[#F5F5F7] rounded-md text-[#B8860B]">
                                                                            <Layers size={14} />
                                                                        </div>
                                                                        <div>
                                                                            <h5 className="text-[11px] font-bold text-[#1d1d1f] uppercase tracking-wider">{getKitName(kitItems.length)}</h5>
                                                                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{kitItems.length} fotos</p>
                                                                        </div>
                                                                    </div>

                                                                    {/* Per Kit Consent Badge */}
                                                                    <div>
                                                                        {consent ? (
                                                                            <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-100 shadow-sm text-[9px] font-bold uppercase tracking-widest">
                                                                                <Camera size={12} /> Uso Autorizado
                                                                            </span>
                                                                        ) : (
                                                                            <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-500 px-3 py-1.5 rounded-lg border border-gray-200 text-[9px] font-bold uppercase tracking-widest">
                                                                                <Shield size={12} /> Privado
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                
                                                                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                                                                    {kitItems.map((item, kitIdx) => (
                                                                        <div 
                                                                            key={item.id} 
                                                                            className="w-20 h-20 rounded-lg border border-gray-200 p-1 bg-white shadow-sm shrink-0 cursor-zoom-in hover:border-[#B8860B] transition-colors relative group"
                                                                            onClick={() => openLightbox(kitItems, kitIdx)}
                                                                        >
                                                                            <img 
                                                                                src={item.croppedUrl || item.originalUrl} 
                                                                                className="w-full h-full object-cover rounded"
                                                                                alt={`Item ${kitIdx}`}
                                                                            />
                                                                            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded">
                                                                                <ZoomIn size={16} className="text-white drop-shadow-md"/>
                                                                            </div>
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
            </div>

            {/* LIGHTBOX OVERLAY */}
            {isLightboxOpen && (
                <div 
                    className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-sm flex items-center justify-center animate-fade-in p-4"
                    onClick={closeLightbox}
                >
                    <button 
                        onClick={closeLightbox} 
                        className="absolute top-4 right-4 md:top-8 md:right-8 p-3 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all z-50"
                    >
                        <X size={24} />
                    </button>

                    <div className="relative w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                        {lightboxImages.length > 1 && (
                            <button 
                                onClick={prevPhoto} 
                                className="absolute left-0 md:left-4 p-4 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all z-50"
                            >
                                <ChevronLeft size={36} strokeWidth={1.5} />
                            </button>
                        )}

                        <img 
                            src={lightboxImages[lightboxIndex]} 
                            className="max-w-full max-h-[85vh] object-contain rounded shadow-2xl select-none"
                            alt="Visualização"
                        />

                        {lightboxImages.length > 1 && (
                            <button 
                                onClick={nextPhoto} 
                                className="absolute right-0 md:right-4 p-4 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all z-50"
                            >
                                <ChevronRight size={36} strokeWidth={1.5} />
                            </button>
                        )}
                    </div>

                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-black/50 rounded-full border border-white/10 pointer-events-none">
                        <span className="text-[10px] font-bold text-white/80 tracking-[0.2em]">
                            {lightboxIndex + 1} / {lightboxImages.length}
                        </span>
                    </div>
                </div>
            )}
        </>
    );
};

export default AdminOrders;
