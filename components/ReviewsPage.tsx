
import React, { useEffect, useState, useCallback } from 'react';
import { Star, Image as ImageIcon, Filter, MessageSquare, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { getReviews } from '../services/mockService';
import { Review } from '../types';

const ReviewsPage: React.FC = () => {
    const [allReviews, setAllReviews] = useState<Review[]>([]);
    const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
    
    // Filters
    const [ratingFilter, setRatingFilter] = useState<number | 'all'>('all');
    const [photoFilter, setPhotoFilter] = useState(false);

    // Lightbox State
    const [selectedReview, setSelectedReview] = useState<Review | null>(null);
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

    useEffect(() => {
        window.scrollTo(0, 0);
        const data = getReviews('approved');
        setAllReviews(data);
        setFilteredReviews(data);
    }, []);

    useEffect(() => {
        let result = [...allReviews];

        if (ratingFilter !== 'all') {
            result = result.filter(r => r.rating === ratingFilter);
        }

        if (photoFilter) {
            result = result.filter(r => r.photos && r.photos.length > 0);
        }

        setFilteredReviews(result);
    }, [ratingFilter, photoFilter, allReviews]);

    // Lightbox Handlers
    const openLightbox = (review: Review, index: number) => {
        setSelectedReview(review);
        setCurrentPhotoIndex(index);
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    };

    const closeLightbox = useCallback(() => {
        setSelectedReview(null);
        setCurrentPhotoIndex(0);
        document.body.style.overflow = 'auto';
    }, []);

    const nextPhoto = useCallback((e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (selectedReview) {
            setCurrentPhotoIndex((prev) => (prev + 1) % selectedReview.photos.length);
        }
    }, [selectedReview]);

    const prevPhoto = useCallback((e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (selectedReview) {
            setCurrentPhotoIndex((prev) => (prev - 1 + selectedReview.photos.length) % selectedReview.photos.length);
        }
    }, [selectedReview]);

    // Keyboard Navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!selectedReview) return;
            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowRight') nextPhoto();
            if (e.key === 'ArrowLeft') prevPhoto();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedReview, closeLightbox, nextPhoto, prevPhoto]);

    return (
        <div className="min-h-screen bg-[#F5F5F7] pt-32 pb-24 px-6">
            <div className="max-w-[1200px] mx-auto">
                
                {/* Header */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full mb-6 text-[#B8860B] shadow-sm">
                        <MessageSquare size={32} />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-serif text-[#1d1d1f] mb-4">Mural de Clientes</h1>
                    <p className="text-[#86868b] max-w-2xl mx-auto text-lg font-light leading-relaxed">
                        Veja o que dizem as pessoas que já transformaram suas memórias em arte.
                    </p>
                </div>

                {/* Filter Bar */}
                <div className="bg-white p-6 rounded-md shadow-sm border border-gray-100 mb-12 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-2 text-[#1d1d1f] font-bold text-xs uppercase tracking-widest">
                        <Filter size={16} className="text-[#B8860B]" />
                        Filtrar por:
                    </div>

                    <div className="flex flex-wrap gap-3 items-center justify-center">
                        <button 
                            onClick={() => setRatingFilter('all')}
                            className={`px-4 py-2 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${ratingFilter === 'all' ? 'bg-[#1d1d1f] text-white' : 'bg-[#F5F5F7] text-[#86868b] hover:bg-gray-200'}`}
                        >
                            Todas
                        </button>
                        {[5, 4, 3].map(star => (
                            <button 
                                key={star}
                                onClick={() => setRatingFilter(star)}
                                className={`px-4 py-2 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-1 ${ratingFilter === star ? 'bg-[#1d1d1f] text-white' : 'bg-[#F5F5F7] text-[#86868b] hover:bg-gray-200'}`}
                            >
                                {star} <Star size={10} fill="currentColor" />
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center">
                        <button 
                            onClick={() => setPhotoFilter(!photoFilter)}
                            className={`px-5 py-2 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all border flex items-center gap-2 ${photoFilter ? 'bg-[#B8860B] text-white border-[#B8860B]' : 'bg-white text-[#1d1d1f] border-gray-200 hover:border-[#1d1d1f]'}`}
                        >
                            <ImageIcon size={14} /> Somente com Fotos
                        </button>
                    </div>
                </div>

                {/* Reviews Grid */}
                {filteredReviews.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredReviews.map((r) => (
                            <div key={r.id} className="bg-white p-10 rounded-md border border-gray-100 flex flex-col h-full shadow-sm hover:shadow-lg transition-all duration-300">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex text-[#B8860B] gap-1">
                                        {[...Array(5)].map((_, k) => (
                                            <Star key={k} size={14} fill={k < r.rating ? "currentColor" : "none"} strokeWidth={k < r.rating ? 0 : 2} />
                                        ))}
                                    </div>
                                    <span className="text-[9px] text-[#86868b] font-bold uppercase tracking-widest">{r.createdAt}</span>
                                </div>
                                
                                <p className="text-[#1d1d1f] text-sm leading-relaxed flex-1 font-light italic mb-8">"{r.text}"</p>
                                
                                {r.photos && r.photos.length > 0 && (
                                    <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
                                        {r.photos.map((p, i) => (
                                            <div 
                                                key={i} 
                                                onClick={() => openLightbox(r, i)}
                                                className="w-16 h-16 rounded-md overflow-hidden border border-gray-100 shrink-0 cursor-pointer hover:opacity-80 transition-opacity hover:border-[#B8860B]"
                                            >
                                                <img src={p} alt="Foto do cliente" className="w-full h-full object-cover" />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="mt-auto flex items-center gap-4 border-t border-gray-50 pt-6">
                                    <div className="w-10 h-10 bg-[#1d1d1f] text-white rounded-md flex items-center justify-center font-bold text-xs uppercase shadow-md">
                                        {r.userName.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-bold text-[#1d1d1f] text-xs uppercase tracking-widest">{r.userName}</p>
                                        {r.userLocation && (
                                            <p className="text-[9px] text-[#B8860B] font-bold uppercase tracking-widest flex items-center gap-1 mt-0.5">
                                                {r.userLocation}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-md border border-gray-100 border-dashed">
                        <p className="text-[#86868b] font-light">Nenhuma avaliação encontrada com os filtros selecionados.</p>
                        <button 
                            onClick={() => { setRatingFilter('all'); setPhotoFilter(false); }}
                            className="mt-4 text-[#B8860B] text-xs font-bold uppercase tracking-widest hover:underline"
                        >
                            Limpar Filtros
                        </button>
                    </div>
                )}
            </div>

            {/* Lightbox / Modal */}
            {selectedReview && (
                <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center animate-fade-in" onClick={closeLightbox}>
                    
                    {/* Botão Fechar */}
                    <button 
                        onClick={closeLightbox}
                        className="absolute top-6 right-6 p-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition-all z-10"
                    >
                        <X size={24} />
                    </button>

                    {/* Container Principal */}
                    <div 
                        className="relative w-full h-full max-w-5xl max-h-screen flex flex-col md:flex-row items-center justify-center p-4 md:p-10 gap-8" 
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Botão Anterior (Só aparece se tiver mais de 1 foto) */}
                        {selectedReview.photos.length > 1 && (
                            <button 
                                onClick={prevPhoto}
                                className="absolute left-4 md:left-8 p-3 bg-white/10 text-white rounded-full hover:bg-white/20 transition-all hover:scale-110 z-20"
                            >
                                <ChevronLeft size={32} />
                            </button>
                        )}

                        {/* Imagem */}
                        <div className="relative flex-1 flex items-center justify-center w-full h-full">
                            <img 
                                src={selectedReview.photos[currentPhotoIndex]} 
                                alt={`Foto de ${selectedReview.userName}`}
                                className="max-w-full max-h-[85vh] object-contain rounded-md shadow-2xl"
                            />
                        </div>

                         {/* Botão Próximo (Só aparece se tiver mais de 1 foto) */}
                         {selectedReview.photos.length > 1 && (
                            <button 
                                onClick={nextPhoto}
                                className="absolute right-4 md:right-8 p-3 bg-white/10 text-white rounded-full hover:bg-white/20 transition-all hover:scale-110 z-20"
                            >
                                <ChevronRight size={32} />
                            </button>
                        )}

                        {/* Indicadores de Paginação */}
                        {selectedReview.photos.length > 1 && (
                             <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                                 {selectedReview.photos.map((_, idx) => (
                                     <button
                                         key={idx}
                                         onClick={() => setCurrentPhotoIndex(idx)}
                                         className={`w-2 h-2 rounded-full transition-all ${idx === currentPhotoIndex ? 'bg-white scale-125' : 'bg-white/40 hover:bg-white/60'}`}
                                     />
                                 ))}
                             </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReviewsPage;
