
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Star, RotateCcw, Edit3, AlertTriangle, X, ChevronLeft, ChevronRight, Search, Calendar, ChevronDown, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Review } from '../../types';
import { updateReview, moderateReview } from '../../services/mockService';

interface AdminReviewsProps {
    reviews: Review[];
    refreshData: () => void;
}

const AdminReviews: React.FC<AdminReviewsProps> = ({ reviews, refreshData }) => {
    const [reviewStatusFilter, setReviewStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
    const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
    const [reviewEditForm, setReviewEditForm] = useState({ text: '', rating: 0 });
    
    // Filters State
    const [searchTerm, setSearchTerm] = useState('');
    const [dateStart, setDateStart] = useState('');
    const [dateEnd, setDateEnd] = useState('');

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Rejection Modal State
    const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
    const [rejectingReviewId, setRejectingReviewId] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');

    // Lightbox State
    const [lightboxData, setLightboxData] = useState<{review: Review, index: number} | null>(null);

    // Counts Calculation
    const counts = useMemo(() => ({
        all: reviews.length,
        pending: reviews.filter(r => r.status === 'pending').length,
        approved: reviews.filter(r => r.status === 'approved').length,
        rejected: reviews.filter(r => r.status === 'rejected').length
    }), [reviews]);

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, reviewStatusFilter, dateStart, dateEnd, itemsPerPage]);

    // Helper to parse "DD/MM/YYYY" to Date object
    const parseDate = (dateStr: string) => {
        const parts = dateStr.split('/');
        // parts[0] = day, parts[1] = month, parts[2] = year
        return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
    };

    // Filtering Logic
    const filteredReviews = useMemo(() => {
        return reviews.filter(r => {
            // 1. Status Filter
            if (reviewStatusFilter !== 'all' && r.status !== reviewStatusFilter) return false;

            // 2. Search Filter (Name)
            if (searchTerm && !r.userName.toLowerCase().includes(searchTerm.toLowerCase())) return false;

            // 3. Date Range Filter
            if (dateStart || dateEnd) {
                const reviewDate = parseDate(r.createdAt);
                // Reset hours for accurate day comparison
                reviewDate.setHours(0,0,0,0);

                if (dateStart) {
                    const start = new Date(dateStart);
                    start.setHours(0,0,0,0);
                    if (reviewDate < start) return false;
                }
                
                if (dateEnd) {
                    const end = new Date(dateEnd);
                    end.setHours(0,0,0,0);
                    if (reviewDate > end) return false;
                }
            }

            return true;
        });
    }, [reviews, reviewStatusFilter, searchTerm, dateStart, dateEnd]);

    // --- PAGINATION LOGIC ---
    const indexOfLastReview = currentPage * itemsPerPage;
    const indexOfFirstReview = indexOfLastReview - itemsPerPage;
    const currentReviews = filteredReviews.slice(indexOfFirstReview, indexOfLastReview);
    const totalPages = Math.ceil(filteredReviews.length / itemsPerPage);

    const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

    const handleStartEditReview = (review: Review) => {
        setEditingReviewId(review.id);
        setReviewEditForm({ text: review.text, rating: review.rating });
    };
  
    const handleSaveReview = (id: string) => {
        updateReview(id, { text: reviewEditForm.text, rating: reviewEditForm.rating });
        setEditingReviewId(null);
        refreshData();
    };
  
    const handleOpenRejectModal = (id: string) => {
        setRejectingReviewId(id);
        setRejectionReason('');
        setRejectionModalOpen(true);
    };
  
    const confirmRejection = () => {
        if (rejectingReviewId) {
            moderateReview(rejectingReviewId, 'rejected', rejectionReason);
            setRejectionModalOpen(false);
            setRejectingReviewId(null);
            refreshData();
        }
    };

    // --- LIGHTBOX LOGIC ---
    const openLightbox = (review: Review, index: number) => {
        setLightboxData({ review, index });
    };

    const closeLightbox = useCallback(() => {
        setLightboxData(null);
    }, []);

    const nextPhoto = useCallback((e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (!lightboxData) return;
        const total = lightboxData.review.photos.length;
        setLightboxData({ ...lightboxData, index: (lightboxData.index + 1) % total });
    }, [lightboxData]);

    const prevPhoto = useCallback((e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (!lightboxData) return;
        const total = lightboxData.review.photos.length;
        setLightboxData({ ...lightboxData, index: (lightboxData.index - 1 + total) % total });
    }, [lightboxData]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!lightboxData) return;
            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowRight') nextPhoto();
            if (e.key === 'ArrowLeft') prevPhoto();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [lightboxData, nextPhoto, prevPhoto, closeLightbox]);

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
                            placeholder="Buscar por nome do cliente..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-12 pl-12 pr-12 bg-[#F5F5F7] border border-transparent rounded-xl text-sm outline-none focus:bg-white focus:border-[#B8860B] focus:ring-1 focus:ring-[#B8860B]/20 transition-all shadow-inner placeholder:text-gray-400"
                        />
                        {searchTerm && (
                            <button 
                                onClick={() => setSearchTerm('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center text-gray-400 hover:text-[#B8860B] hover:bg-gray-100 rounded-full transition-all"
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

                {/* FILTER TABS (Scrollable on Mobile) */}
                <div className="flex gap-2 overflow-x-auto scrollbar-hide w-full pb-2 md:pb-0">
                    {[
                        { id: 'all', label: 'Todas' }, 
                        { id: 'pending', label: 'Pendentes' }, 
                        { id: 'approved', label: 'Aprovadas' }, 
                        { id: 'rejected', label: 'Rejeitadas' }
                    ].map(status => {
                        const isActive = reviewStatusFilter === status.id;
                        const count = counts[status.id as keyof typeof counts] || 0;
                        const isPendingAlert = status.id === 'pending' && count > 0;

                        return (
                            <button 
                                key={status.id} 
                                onClick={() => setReviewStatusFilter(status.id as any)}
                                className={`
                                    flex-none whitespace-nowrap
                                    px-6 py-3 
                                    rounded-xl 
                                    text-[10px] font-bold uppercase tracking-widest 
                                    transition-all border flex items-center justify-center gap-2
                                    ${isActive 
                                        ? 'bg-[#1d1d1f] text-white border-[#1d1d1f] shadow-md' 
                                        : 'bg-white text-gray-400 border-gray-100 hover:text-gray-600 hover:bg-gray-50'
                                    }
                                `}
                            >
                                {status.label}
                                <span className={`
                                    px-1.5 py-0.5 rounded-full text-[8px] font-bold transition-colors
                                    ${isPendingAlert 
                                        ? 'bg-[#B8860B] text-white shadow-sm' 
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {currentReviews.map(review => (
                        <div key={review.id} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col hover:shadow-md transition-shadow">
                            {editingReviewId === review.id ? (
                                <div className="space-y-4 mb-4">
                                    <div className="flex gap-2">
                                        {[1,2,3,4,5].map(star => (
                                            <button key={star} onClick={() => setReviewEditForm({...reviewEditForm, rating: star})}>
                                                <Star size={20} fill={star <= reviewEditForm.rating ? "#B8860B" : "none"} className={star <= reviewEditForm.rating ? "text-[#B8860B]" : "text-gray-300"} />
                                            </button>
                                        ))}
                                    </div>
                                    <textarea 
                                        value={reviewEditForm.text}
                                        onChange={e => setReviewEditForm({...reviewEditForm, text: e.target.value})}
                                        className="w-full h-24 p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#B8860B] resize-none"
                                    />
                                    <div className="flex gap-2">
                                        <button onClick={() => setEditingReviewId(null)} className="flex-1 py-2 bg-gray-100 text-gray-600 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-gray-200">Cancelar</button>
                                        <button onClick={() => handleSaveReview(review.id)} className="flex-1 py-2 bg-[#1d1d1f] text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-black">Salvar</button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-[#F5F5F7] rounded-full flex items-center justify-center font-bold text-xs text-[#1d1d1f]">{review.userName.charAt(0)}</div>
                                            <div>
                                                <p className="font-bold text-xs text-[#1d1d1f]">{review.userName}</p>
                                                <p className="text-[9px] text-gray-400">{review.createdAt}</p>
                                            </div>
                                        </div>
                                        <div className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wide border ${
                                            review.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                            review.status === 'rejected' ? 'bg-red-50 text-red-600 border-red-100' :
                                            'bg-amber-50 text-amber-600 border-amber-100'
                                        }`}>
                                            {review.status === 'approved' ? 'Aprovada' : review.status === 'rejected' ? 'Rejeitada' : 'Aguardando'}
                                        </div>
                                    </div>

                                    <div className="flex text-[#B8860B] mb-3 gap-1">
                                        {[...Array(5)].map((_, i) => <Star key={i} size={12} fill={i < review.rating ? "currentColor" : "none"} strokeWidth={i < review.rating ? 0 : 2} />)}
                                    </div>

                                    <p className="text-sm text-gray-600 italic mb-4 flex-1">"{review.text}"</p>

                                    {review.photos && review.photos.length > 0 && (
                                        <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                                            {review.photos.map((photo, i) => (
                                                <div key={i} onClick={() => openLightbox(review, i)} className="w-12 h-12 rounded-lg border border-gray-200 overflow-hidden cursor-zoom-in shrink-0">
                                                    <img src={photo} className="w-full h-full object-cover" />
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="flex gap-2 pt-4 border-t border-gray-50">
                                        {review.status === 'pending' ? (
                                            <>
                                                <button onClick={() => { moderateReview(review.id, 'approved'); refreshData(); }} className="flex-1 py-2 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-100 transition-colors">Aprovar</button>
                                                <button onClick={() => handleOpenRejectModal(review.id)} className="flex-1 py-2 bg-red-50 text-red-600 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-red-100 transition-colors">Rejeitar</button>
                                            </>
                                        ) : (
                                            <button onClick={() => { moderateReview(review.id, 'pending'); refreshData(); }} className="flex-1 py-2 bg-gray-50 text-gray-500 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-gray-100 transition-colors flex items-center justify-center gap-2">
                                                <RotateCcw size={12}/> Reavaliar
                                            </button>
                                        )}
                                        <button onClick={() => handleStartEditReview(review)} className="p-2 bg-gray-50 text-[#1d1d1f] rounded-lg hover:bg-gray-100 transition-colors"><Edit3 size={16}/></button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                    {filteredReviews.length === 0 && (
                        <div className="col-span-full py-20 text-center bg-white rounded-2xl border border-dashed border-gray-200">
                            <p className="text-gray-400 text-sm font-medium">Nenhuma avaliação encontrada com estes filtros.</p>
                            <button onClick={() => { setSearchTerm(''); setDateStart(''); setDateEnd(''); setReviewStatusFilter('all'); }} className="mt-3 text-[#B8860B] text-xs font-bold uppercase tracking-widest hover:underline">
                                Limpar filtros
                            </button>
                        </div>
                    )}
                </div>

                {/* PAGINATION FOOTER - Minimalist Data Table Style */}
                {filteredReviews.length > 0 && (
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
                                        <option value={10}>10</option>
                                        <option value={30}>30</option>
                                        <option value={50}>50</option>
                                    </select>
                                    <ChevronDown size={10} className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none opacity-50 group-hover:opacity-100" />
                                </div>
                            </div>

                            {/* Range Info */}
                            <span className="text-[#1d1d1f]">
                                {indexOfFirstReview + 1}-{Math.min(indexOfLastReview, filteredReviews.length)} de {filteredReviews.length}
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

            {/* REJECTION MODAL */}
            {rejectionModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#011F4B]/30 backdrop-blur-sm" onClick={() => setRejectionModalOpen(false)}></div>
                    <div className="bg-white w-full max-w-md rounded-xl shadow-2xl relative overflow-hidden animate-fade-in border border-gray-100">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-serif font-bold text-lg text-red-600 flex items-center gap-2"><AlertTriangle size={20}/> Rejeitar Avaliação</h3>
                            <button onClick={() => setRejectionModalOpen(false)}><X size={20} className="text-gray-400 hover:text-red-600"/></button>
                        </div>
                        <div className="p-6">
                            <p className="text-sm text-gray-600 mb-4">Informe o motivo da rejeição (opcional). Isso ajuda a manter o histórico de moderação organizado.</p>
                            <textarea 
                                className="w-full h-32 p-3 bg-[#F5F5F7] border border-gray-200 rounded-lg text-sm outline-none focus:border-red-400 resize-none mb-2"
                                placeholder="Ex: Conteúdo ofensivo, spam, não relacionado ao produto..."
                                value={rejectionReason}
                                onChange={e => setRejectionReason(e.target.value)}
                            />
                            <div className="flex gap-3 mt-4">
                                <button onClick={() => setRejectionModalOpen(false)} className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold text-[10px] uppercase tracking-widest rounded-lg hover:bg-gray-200">Cancelar</button>
                                <button onClick={confirmRejection} className="flex-1 py-3 bg-red-600 text-white font-bold text-[10px] uppercase tracking-widest rounded-lg hover:bg-red-700 shadow-md">Confirmar Rejeição</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* LIGHTBOX OVERLAY */}
            {lightboxData && (
                <div 
                    className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-sm flex items-center justify-center animate-fade-in p-4"
                    onClick={closeLightbox}
                >
                    {/* Close Button */}
                    <button 
                        onClick={closeLightbox} 
                        className="absolute top-4 right-4 md:top-8 md:right-8 p-3 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all z-50"
                    >
                        <X size={24} />
                    </button>

                    {/* Image Area */}
                    <div className="relative w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                        {/* Prev Button */}
                        {lightboxData.review.photos.length > 1 && (
                            <button 
                                onClick={prevPhoto} 
                                className="absolute left-0 md:left-4 p-4 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all z-50"
                            >
                                <ChevronLeft size={36} strokeWidth={1.5} />
                            </button>
                        )}

                        <img 
                            src={lightboxData.review.photos[lightboxData.index]} 
                            className="max-w-full max-h-[85vh] object-contain rounded shadow-2xl select-none"
                            alt="Visualização"
                        />

                        {/* Next Button */}
                        {lightboxData.review.photos.length > 1 && (
                            <button 
                                onClick={nextPhoto} 
                                className="absolute right-0 md:right-4 p-4 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all z-50"
                            >
                                <ChevronRight size={36} strokeWidth={1.5} />
                            </button>
                        )}
                    </div>

                    {/* Footer: Counter */}
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-black/50 rounded-full border border-white/10 pointer-events-none">
                        <span className="text-[10px] font-bold text-white/80 tracking-[0.2em]">
                            {lightboxData.index + 1} / {lightboxData.review.photos.length}
                        </span>
                    </div>
                </div>
            )}
        </>
    );
};

export default AdminReviews;
