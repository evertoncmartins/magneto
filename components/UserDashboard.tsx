
import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { User, Order, Review, MagnetItem } from '../types';
import { getUserOrders, getReviewByOrderId, submitReview, updateReview, getPricingRules } from '../services/mockService';
import { Package, Clock, ChevronDown, Calendar, MapPin, CheckCircle, ShoppingBag, Truck, Loader2, X, Star, ImageIcon, Edit3, CornerUpLeft, Box, XCircle, AlertCircle, Layers, ZoomIn, Wallet, Receipt, MessageCircle, Camera, Shield, ChevronLeft, ChevronRight, Ban, AlertOctagon, Filter, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Link } from 'react-router-dom';
// @ts-ignore
import heic2any from 'heic2any';

const STATE_MAP: Record<string, string> = {
    'AC': 'Acre', 'AL': 'Alagoas', 'AP': 'Amapá', 'AM': 'Amazonas', 'BA': 'Bahia', 'CE': 'Ceará',
    'DF': 'Distrito Federal', 'ES': 'Espírito Santo', 'GO': 'Goiás', 'MA': 'Maranhão', 'MT': 'Mato Grosso',
    'MS': 'Mato Grosso do Sul', 'MG': 'Minas Gerais', 'PA': 'Paraíba', 'PR': 'Paraná',
    'PE': 'Pernambuco', 'PI': 'Piauí', 'RJ': 'Rio de Janeiro', 'RN': 'Rio Grande do Norte',
    'RS': 'Rio Grande do Sul', 'RO': 'Rondônia', 'RR': 'Roraima', 'SC': 'Santa Catarina',
    'SP': 'São Paulo', 'SE': 'Sergipe', 'TO': 'Tocantins'
};

const UserDashboard: React.FC<{ user: User }> = ({ user }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<Record<string, Review>>({}); // Map orderId to Review
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [tiers, setTiers] = useState(getPricingRules());

  // Filter & Pagination State
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Lightbox State (Advanced)
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Review Form States
  const [editingReviewOrderId, setEditingReviewOrderId] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [reviewPhotos, setReviewPhotos] = useState<string[]>([]);
  const [isProcessingPhotos, setIsProcessingPhotos] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTiers(getPricingRules());
    getUserOrders(user.id).then(data => {
      // Ordenar por data decrescente (mais recente primeiro)
      const sorted = [...data].sort((a, b) => {
          const dateA = a.date.split('/').reverse().join('-');
          const dateB = b.date.split('/').reverse().join('-');
          return dateB.localeCompare(dateA);
      });
      setOrders(sorted);
      
      // Fetch reviews for orders
      const revs: Record<string, Review> = {};
      sorted.forEach(o => {
          const r = getReviewByOrderId(o.id);
          if (r) revs[o.id] = r;
      });
      setReviews(revs);
      setLoading(false);
    });
  }, [user.id]);

  // Reset pagination when filter changes
  useEffect(() => {
      setCurrentPage(1);
  }, [selectedYear, itemsPerPage]);

  // --- FILTER LOGIC ---
  const availableYears = useMemo(() => {
      const currentYear = new Date().getFullYear();
      const startYear = user.joinedAt ? parseInt(user.joinedAt.split('/')[2]) : currentYear;
      const years = [];
      for (let y = currentYear; y >= startYear; y--) {
          years.push(y);
      }
      return years;
  }, [user.joinedAt]);

  const filteredOrders = useMemo(() => {
      if (selectedYear === 'all') return orders;
      return orders.filter(order => {
          const orderYear = order.date.split('/')[2];
          return orderYear === selectedYear;
      });
  }, [orders, selectedYear]);

  // --- PAGINATION LOGIC ---
  const indexOfLastOrder = currentPage * itemsPerPage;
  const indexOfFirstOrder = indexOfLastOrder - itemsPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const toggleOrder = (id: string) => {
      setExpandedOrderId(expandedOrderId === id ? null : id);
      cancelEditing();
  };

  const cancelEditing = () => {
      setEditingReviewOrderId(null);
      setReviewRating(0);
      setReviewText('');
      setReviewPhotos([]);
  }

  const handleStartEdit = (orderId: string, review: Review) => {
      setEditingReviewOrderId(orderId);
      setReviewRating(review.rating);
      setReviewText(review.text);
      setReviewPhotos([...review.photos]);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
          const remainingSlots = 3 - reviewPhotos.length;
          
          if (remainingSlots <= 0) {
              alert("Limite de 3 fotos atingido.");
              return;
          }

          if (e.target.files.length > remainingSlots) {
              alert(`Você só pode adicionar mais ${remainingSlots} foto(s).`);
              // Não retornamos aqui, vamos pegar apenas o que cabe
          }

          setIsProcessingPhotos(true);
          
          // Pega apenas a quantidade que cabe, com cast explícito para File[]
          const files = Array.from(e.target.files).slice(0, remainingSlots) as File[];
          const newPhotos: string[] = [];

          try {
              for (const file of files) {
                  let sourceFile = file;

                  // Tratamento HEIC
                  if (file.name.toLowerCase().match(/\.(heic|heif)$/) || file.type.includes('heic')) {
                      try {
                          const convertedBlob = await heic2any({
                              blob: file,
                              toType: 'image/jpeg',
                              quality: 0.8
                          });
                          const finalBlob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
                          sourceFile = new File([finalBlob as Blob], file.name.replace(/\.(heic|heif)$/i, '.jpg'), { type: 'image/jpeg' });
                      } catch (err) {
                          console.error("Erro na conversão HEIC:", err);
                          continue; // Pula se der erro
                      }
                  }

                  // Leitura para Base64
                  await new Promise<void>((resolve) => {
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                          if (ev.target?.result) {
                              newPhotos.push(ev.target.result as string);
                          }
                          resolve();
                      };
                      reader.readAsDataURL(sourceFile);
                  });
              }
              setReviewPhotos(prev => [...prev, ...newPhotos]);
          } catch (error) {
              console.error("Erro ao processar fotos", error);
          } finally {
              setIsProcessingPhotos(false);
              if (fileInputRef.current) fileInputRef.current.value = '';
          }
      }
  };

  const handleSubmitReview = (orderId: string) => {
      if (reviewRating === 0) {
          alert("Selecione uma nota.");
          return;
      }
      
      if (editingReviewOrderId === orderId && reviews[orderId]) {
          const existingReview = reviews[orderId];
          updateReview(existingReview.id, {
              rating: reviewRating,
              text: reviewText,
              photos: reviewPhotos,
              status: 'pending' 
          });
          
          setReviews(prev => ({
              ...prev,
              [orderId]: { ...existingReview, rating: reviewRating, text: reviewText, photos: reviewPhotos, status: 'pending' }
          }));
          setEditingReviewOrderId(null);
      } else {
          const newReview = submitReview({
              orderId: orderId,
              userId: user.id,
              userName: user.name,
              rating: reviewRating,
              text: reviewText,
              photos: reviewPhotos
          });
          setReviews(prev => ({ ...prev, [orderId]: newReview }));
      }
      
      setReviewRating(0);
      setReviewText('');
      setReviewPhotos([]);
  };

  const getStatusConfig = (status: string) => {
    const config: any = {
      'pending': { label: 'Pagamento Pendente', color: 'bg-amber-50 text-amber-600 border-amber-100', icon: Clock },
      'production': { label: 'Em Produção', color: 'bg-blue-50 text-blue-600 border-blue-100', icon: Box },
      'shipped': { label: 'Enviado', color: 'bg-purple-50 text-purple-600 border-purple-100', icon: Truck },
      'delivered': { label: 'Entregue', color: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: CheckCircle },
      'cancelled': { label: 'Cancelado', color: 'bg-red-50 text-red-600 border-red-100', icon: Ban },
    };
    return config[status] || { label: status, color: 'bg-gray-50 text-gray-600 border-gray-200', icon: Package };
  };

  const formatCep = (cep: string) => {
    const clean = cep.replace(/\D/g, '');
    if (clean.length === 8) {
        return `${clean.slice(0, 5)}-${clean.slice(5)}`;
    }
    return clean;
  };

  // Helper para agrupar itens por kitId
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
      const tier = tiers.find(t => t.photoCount === count);
      if (tier) return `Kit ${tier.name}`;
      
      if (count <= 3) return 'Kit Start';
      if (count <= 6) return 'Kit Memories';
      if (count <= 9) return 'Kit Gallery';
      return 'Kit Personalizado';
  };

  // --- LIGHTBOX FUNCTIONS ---
  const openLightbox = (items: MagnetItem[], initialIndex: number) => {
      // Prioritize High Quality Images
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

  return (
    <div className="min-h-screen bg-[#F5F5F7] pt-32 pb-24 px-4 md:px-6">
      <div className="max-w-[1000px] mx-auto">
        
        {/* HEADER AREA */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
          <div>
             <span className="text-[#B8860B] font-bold text-[10px] uppercase tracking-[0.3em] mb-3 block">Central do Cliente</span>
             <h1 className="text-4xl font-serif font-bold text-[#1d1d1f] tracking-tight">Meus Pedidos</h1>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
              {/* Year Filter */}
              <div className="relative group">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-[#B8860B] transition-colors" size={16} />
                  <select 
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className="w-full sm:w-auto h-12 pl-10 pr-8 bg-white border border-gray-200 rounded-md text-xs font-bold uppercase tracking-widest text-[#1d1d1f] outline-none focus:border-[#B8860B] cursor-pointer appearance-none shadow-sm hover:bg-gray-50 transition-colors"
                  >
                      <option value="all">Todos os anos</option>
                      {availableYears.map(year => (
                          <option key={year} value={year}>{year}</option>
                      ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>

              <Link to="/studio" className="px-8 py-3 bg-[#1d1d1f] text-white text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-all rounded-md shadow-xl flex items-center justify-center gap-3 active:scale-95 whitespace-nowrap">
                  <ShoppingBag size={14} /> Novo Pedido
              </Link>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 animate-pulse">
              <Loader2 className="animate-spin text-[#B8860B] mb-4" size={32} />
              <p className="text-[10px] font-bold text-[#86868b] uppercase tracking-widest">Carregando histórico...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-md p-16 text-center shadow-sm border border-gray-100">
             <div className="w-16 h-16 bg-[#F5F5F7] rounded-md flex items-center justify-center mx-auto mb-8 text-[#86868b]">
                 <Package size={28} />
             </div>
             <h3 className="text-xl font-serif text-[#1d1d1f] mb-3">Nenhum pedido encontrado</h3>
             <p className="text-[#86868b] mb-10 max-w-sm mx-auto font-light">
                 {selectedYear !== 'all' ? `Você não tem pedidos registrados em ${selectedYear}.` : "Sua galeria de memórias está esperando. Transforme seus registros em presença física hoje mesmo."}
             </p>
             {selectedYear === 'all' && (
                 <Link to="/studio" className="text-[#B8860B] text-xs font-bold uppercase tracking-widest hover:underline transition-all">
                     Acessar Studio Magneto &rarr;
                 </Link>
             )}
          </div>
        ) : (
          <div className="space-y-6">
             {currentOrders.map((order) => {
               const status = getStatusConfig(order.status);
               const isExpanded = expandedOrderId === order.id;
               const review = reviews[order.id];
               const isEditing = editingReviewOrderId === order.id;
               const showPendingReviewTag = order.status === 'delivered' && (!review || review.status === 'pending');
               const groupedItems = groupItemsByKit(order.items || []);

               return (
                 <div 
                    key={order.id} 
                    className={`bg-white rounded-2xl border transition-all duration-500 overflow-hidden ${isExpanded ? 'shadow-2xl border-[#B8860B]/20' : 'border-gray-100 shadow-sm hover:shadow-md'} ${order.status === 'cancelled' ? 'opacity-80' : ''}`}
                 >
                   {/* Card Header (Clickable) */}
                   <div 
                        onClick={() => toggleOrder(order.id)}
                        className="p-6 md:p-8 cursor-pointer flex flex-col md:flex-row gap-6 justify-between md:items-center bg-white relative z-10"
                   >
                        <div className="flex items-start gap-6">
                            <div className={`p-4 rounded-xl hidden sm:flex items-center justify-center shadow-sm ${status.color.split(' ')[0]} ${status.color.split(' ')[1]}`}>
                                <status.icon size={24} strokeWidth={1.5} />
                            </div>
                            <div>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-2">
                                    <span className="font-serif font-bold text-[#1d1d1f] text-xl">Pedido #{order.id}</span>
                                    <span className={`inline-flex px-3 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest border ${status.color}`}>
                                        {status.label}
                                    </span>
                                    {showPendingReviewTag && (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-amber-50 text-amber-600 text-[9px] font-bold uppercase tracking-widest border border-amber-100 animate-pulse">
                                            <Star size={10} fill="currentColor" /> Avalie
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wide text-[#86868b]">
                                    <span className="flex items-center gap-2"><Calendar size={12} className="text-[#B8860B]"/> {order.date}</span>
                                    <span className="w-1 h-1 bg-gray-200 rounded-full"></span>
                                    <span>{order.itemsCount} Ímãs</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex items-center justify-between md:justify-end gap-10 border-t md:border-t-0 border-gray-50 pt-6 md:pt-0">
                             <div className="text-left md:text-right">
                                <p className="text-[9px] text-[#86868b] uppercase font-bold tracking-widest mb-1">Total</p>
                                <p className="text-xl font-serif font-bold text-[#1d1d1f]">R$ {order.total.toFixed(2)}</p>
                             </div>
                             <div className={`w-10 h-10 flex items-center justify-center rounded-full border transition-all duration-300 ${isExpanded ? 'bg-[#1d1d1f] text-white border-[#1d1d1f] rotate-180' : 'bg-white border-gray-200 text-gray-400'}`}>
                                <ChevronDown size={18} />
                             </div>
                        </div>
                   </div>

                   {/* Expanded Details */}
                   {isExpanded && (
                       <div className="border-t border-gray-50 bg-[#F5F5F7]/50 animate-fade-in">
                           
                           {/* CANCELLATION NOTICE */}
                           {order.status === 'cancelled' && (
                               <div className="p-6 md:p-8 pb-0">
                                   <div className="bg-red-50 border border-red-100 p-6 rounded-2xl flex items-start gap-4 shadow-sm">
                                       <div className="p-2 bg-white rounded-full text-red-500 shadow-sm shrink-0">
                                           <AlertOctagon size={24} />
                                       </div>
                                       <div>
                                           <h4 className="font-bold text-red-800 text-sm uppercase tracking-widest mb-2">Pedido Cancelado</h4>
                                           <p className="text-red-600 text-sm leading-relaxed">
                                               <span className="font-bold text-red-800/60 text-[10px] uppercase tracking-wide block mb-1">Motivo do Cancelamento:</span>
                                               {order.cancellationReason || "O pedido foi cancelado pela administração. Entre em contato para mais detalhes."}
                                           </p>
                                       </div>
                                   </div>
                               </div>
                           )}

                           <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                                
                                {/* Left Column: Photos & Reviews (7/12) */}
                                <div className="lg:col-span-7 space-y-10">
                                    
                                    {/* Kits List */}
                                    {Object.entries(groupedItems).map(([kitId, items], kitIdx) => {
                                        const consent = items[0].socialConsent !== undefined ? items[0].socialConsent : order.socialSharingConsent;
                                        
                                        return (
                                            <div key={kitId} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                                <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-[#1d1d1f] rounded-lg text-[#B8860B]">
                                                            <Layers size={16} />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-[#1d1d1f] text-sm uppercase tracking-wider">{getKitName(items.length)}</h4>
                                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{items.length} fotos • Fine Art</p>
                                                        </div>
                                                    </div>

                                                    {/* Per Kit Consent Badge */}
                                                    <div>
                                                        {consent ? (
                                                            <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-100 shadow-sm text-[9px] font-bold uppercase tracking-widest">
                                                                <Camera size={12} /> Autorizado
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-500 px-3 py-1.5 rounded-lg border border-gray-200 text-[9px] font-bold uppercase tracking-widest"><Shield size={12} /> Privado</span>
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
                                                    {items.map((item, idx) => (
                                                        <div 
                                                            key={idx} 
                                                            onClick={() => openLightbox(items, idx)}
                                                            className="aspect-square rounded-lg bg-gray-100 overflow-hidden border border-gray-200 shadow-sm cursor-zoom-in group relative"
                                                        >
                                                            {/* Prioritize High Quality in Thumbnail too */}
                                                            <img src={item.originalUrl || item.highResUrl || item.croppedUrl} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                                                <ZoomIn className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" size={16} />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* ... restante da seção de reviews inalterada ... */}
                                    {order.status === 'delivered' && (
                                        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#B8860B]/5 rounded-full blur-2xl pointer-events-none"></div>
                                            <h4 className="text-[10px] font-bold text-[#B8860B] uppercase tracking-[0.3em] mb-8 flex items-center gap-2 relative z-10">
                                                Avaliação do Produto
                                            </h4>
                                            
                                            {!review || isEditing ? (
                                                <div className="space-y-6 animate-fade-in relative z-10">
                                                    <div className="flex justify-center gap-3">
                                                        {[1, 2, 3, 4, 5].map((star) => (
                                                            <button 
                                                                key={star} 
                                                                onClick={() => setReviewRating(star)}
                                                                className="transition-transform hover:scale-110 active:scale-95"
                                                            >
                                                                <Star 
                                                                    size={24} 
                                                                    fill={star <= reviewRating ? "#B8860B" : "none"} 
                                                                    className={star <= reviewRating ? "text-[#B8860B]" : "text-gray-200"}
                                                                />
                                                            </button>
                                                        ))}
                                                    </div>
                                                    
                                                    <textarea 
                                                        className="w-full bg-[#F5F5F7] border border-transparent focus:bg-white focus:border-[#B8860B] rounded-xl p-4 text-sm outline-none transition-all resize-none font-light"
                                                        placeholder="Descreva sua experiência com a Magneto..."
                                                        rows={3}
                                                        value={reviewText}
                                                        onChange={(e) => setReviewText(e.target.value)}
                                                    />

                                                    <div>
                                                        <div className="flex justify-between items-center mb-2">
                                                            <label className="text-[10px] font-bold text-[#86868b] uppercase tracking-widest">Fotos (Opcional)</label>
                                                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                                                                {reviewPhotos.length}/3 fotos
                                                            </span>
                                                        </div>
                                                        <div className="flex gap-3 mb-4">
                                                            {reviewPhotos.map((photo, i) => (
                                                                <div key={i} className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200 relative group bg-gray-50">
                                                                    <img src={photo} className="w-full h-full object-cover" />
                                                                    <button 
                                                                        onClick={() => setReviewPhotos(prev => prev.filter((_, idx) => idx !== i))}
                                                                        className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                                                                    >
                                                                        <X size={16} />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                            
                                                            {reviewPhotos.length < 3 && (
                                                                <button 
                                                                    onClick={() => fileInputRef.current?.click()}
                                                                    disabled={isProcessingPhotos}
                                                                    className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-[#86868b] hover:border-[#B8860B] hover:text-[#B8860B] hover:bg-white transition-all bg-[#F5F5F7] hover:bg-white disabled:opacity-50 disabled:cursor-wait"
                                                                >
                                                                    {isProcessingPhotos ? <Loader2 size={20} className="animate-spin"/> : <ImageIcon size={20} />}
                                                                </button>
                                                            )}
                                                        </div>
                                                        <input 
                                                            type="file" 
                                                            ref={fileInputRef} 
                                                            className="hidden" 
                                                            accept="image/*,.heic,.heif" 
                                                            multiple 
                                                            onChange={handlePhotoUpload} 
                                                        />
                                                    </div>

                                                    <div className="flex gap-3">
                                                        {isEditing && (
                                                            <button 
                                                                onClick={cancelEditing}
                                                                className="flex-1 bg-white border border-gray-200 text-[#1d1d1f] py-4 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                                                            >
                                                                <CornerUpLeft size={14} /> Cancelar
                                                            </button>
                                                        )}
                                                        <button 
                                                            onClick={() => handleSubmitReview(order.id)}
                                                            className="flex-[2] bg-[#1d1d1f] text-white py-4 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-black transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-xl"
                                                            disabled={reviewRating === 0 || isProcessingPhotos}
                                                        >
                                                            {isEditing ? 'Atualizar Avaliação' : 'Enviar Minha Avaliação'}
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-6 animate-fade-in relative z-10">
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex items-center gap-4">
                                                            <div className={`p-3 rounded-xl border ${
                                                                review.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                                                                review.status === 'rejected' ? 'bg-red-50 text-red-600 border-red-100' :
                                                                'bg-amber-50 text-amber-600 border-amber-100'
                                                            }`}>
                                                                {review.status === 'approved' && <CheckCircle size={20} />}
                                                                {review.status === 'pending' && <Clock size={20} />}
                                                                {review.status === 'rejected' && <XCircle size={20} />}
                                                            </div>
                                                            <div>
                                                                <p className={`font-bold text-xs uppercase tracking-widest ${
                                                                    review.status === 'approved' ? 'text-emerald-700' : 
                                                                    review.status === 'rejected' ? 'text-red-700' :
                                                                    'text-[#1d1d1f]'
                                                                }`}>
                                                                    {review.status === 'pending' && 'Em Moderação'}
                                                                    {review.status === 'approved' && 'Avaliação Aprovada'}
                                                                    {review.status === 'rejected' && 'Avaliação Recusada'}
                                                                </p>
                                                                <p className="text-[10px] text-[#86868b] mt-1 font-light">
                                                                    {review.status === 'pending' && 'Recebemos seu relato.'}
                                                                    {review.status === 'approved' && 'Obrigado por compartilhar!'}
                                                                    {review.status === 'rejected' && 'Não pôde ser publicada.'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        {review.status === 'pending' && (
                                                            <button onClick={() => handleStartEdit(order.id, review)} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-[10px] font-bold uppercase tracking-widest text-[#1d1d1f] hover:bg-gray-50 transition-all shadow-sm">
                                                                <Edit3 size={14} /> Editar
                                                            </button>
                                                        )}
                                                    </div>
                                                    
                                                    <div className="bg-[#F5F5F7] p-5 rounded-xl text-sm border border-gray-100">
                                                        <div className="flex text-[#B8860B] mb-3 gap-1">
                                                            {[...Array(5)].map((_, i) => <Star key={i} size={10} fill={i < review.rating ? "currentColor" : "none"} strokeWidth={i < review.rating ? 0 : 2} />)}
                                                        </div>
                                                        <p className="italic text-[#1d1d1f] font-light leading-relaxed">"{review.text}"</p>
                                                        {review.photos && review.photos.length > 0 && (
                                                            <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200/50">
                                                                {review.photos.map((p, idx) => (
                                                                    <div key={idx} className="w-10 h-10 rounded-md border border-gray-200 overflow-hidden cursor-zoom-in" onClick={() => {
                                                                        setLightboxImages(review.photos);
                                                                        setLightboxIndex(idx);
                                                                        setIsLightboxOpen(true);
                                                                    }}>
                                                                        <img src={p} className="w-full h-full object-cover" />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Right Column ... inalterada ... */}
                                <div className="lg:col-span-5 space-y-6">
                                    
                                    <h4 className="text-[10px] font-bold text-[#B8860B] uppercase tracking-[0.3em] flex items-center gap-2">
                                        Detalhes do Envio
                                    </h4>

                                    {/* ADDRESS CARD ... */}
                                    {order.shippingAddress && (
                                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-5">
                                            <div className="w-12 h-12 rounded-xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-[#B8860B] shrink-0">
                                                <MapPin size={24} strokeWidth={1.5} />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-bold text-lg text-[#1d1d1f] leading-tight mb-1">
                                                    {order.shippingAddress.street}, {order.shippingAddress.number}
                                                </h4>
                                                <p className="text-sm text-[#86868b] font-light">
                                                    {order.shippingAddress.neighborhood}
                                                </p>
                                                <p className="text-sm text-[#86868b] font-light mb-3">
                                                    {order.shippingAddress.city} - {order.shippingAddress.state.split(' - ').pop()}</p>
                                                <div className="inline-flex items-center px-3 py-1.5 bg-white border border-gray-200 rounded-md shadow-sm">
                                                    <span className="text-[10px] font-bold text-[#1d1d1f] uppercase tracking-widest">
                                                        CEP: {formatCep(order.shippingAddress.zipCode)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <h4 className="text-[10px] font-bold text-[#B8860B] uppercase tracking-[0.3em] flex items-center gap-2 mt-6">
                                        Detalhes Financeiros
                                    </h4>

                                    {/* FINANCE CARD ... */}
                                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-5">
                                        <div className="w-12 h-12 rounded-xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-[#B8860B] shrink-0">
                                            <Receipt size={24} strokeWidth={1.5} />
                                        </div>
                                        <div className="flex-1 w-full flex flex-col justify-center">
                                            <div className="space-y-3 w-full">
                                                <div className="flex justify-between text-sm text-[#86868b]">
                                                    <span>Subtotal</span>
                                                    <span className="font-medium text-[#1d1d1f]">R$ {order.subtotal ? order.subtotal.toFixed(2) : order.total.toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between text-sm text-[#86868b]">
                                                    <span>Frete</span>
                                                    <span className="font-medium text-[#1d1d1f]">{order.shippingCost ? `R$ ${order.shippingCost.toFixed(2)}` : 'Grátis'}</span>
                                                </div>
                                                {order.discount && order.discount > 0 ? (
                                                    <div className="flex justify-between items-center text-sm text-emerald-600 font-bold">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span>Desconto</span>
                                                            {order.couponCode && (
                                                                <span className="bg-gray-100 text-gray-500 text-[9px] px-2 py-0.5 rounded border border-gray-200 uppercase tracking-wider font-bold">
                                                                    {order.couponCode}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="whitespace-nowrap ml-2">- R$ {order.discount.toFixed(2)}</span>
                                                    </div>
                                                ) : null}
                                                <div className="h-px bg-gray-100 my-2"></div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[10px] font-bold text-[#1d1d1f] uppercase tracking-widest">Total Pago</span>
                                                    <span className="text-xl font-serif font-bold text-[#B8860B]">R$ {order.total.toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                </div>
                           </div>
                           
                           {/* ORDER FOOTER ... */}
                           <div className="border-t border-gray-200/60 p-4 md:p-6 bg-[#F9F9FA] flex flex-col md:flex-row justify-center md:justify-end items-center gap-3">
                                <p className="text-[10px] text-[#86868b] font-medium uppercase tracking-wide flex items-center gap-2">
                                    <MessageCircle size={14}/> Teve algum problema com este pedido?
                                </p>
                                <Link to="/contact" className="text-[#B8860B] font-bold text-[10px] uppercase tracking-[0.2em] hover:text-[#966d09] hover:underline transition-colors flex items-center gap-1">
                                    Fale Conosco
                                </Link>
                           </div>
                       </div>
                   )}
                 </div>
               );
             })}
          </div>
        )}

        {/* PAGINATION FOOTER ... */}
        {filteredOrders.length > 0 && (
            <div className="flex flex-col sm:flex-row justify-end items-center gap-4 sm:gap-6 pt-10 text-[11px] text-gray-500 font-medium select-none animate-fade-in">
                
                <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto justify-between sm:justify-start">
                    {/* Items Per Page */}
                    <div className="flex items-center gap-2">
                        <span className="hidden sm:inline">Itens por página:</span>
                        <span className="sm:hidden">Exibir:</span>
                        <div className="relative group">
                            <select 
                                value={itemsPerPage}
                                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                                className="appearance-none bg-transparent hover:bg-white rounded px-2 py-1 pr-6 cursor-pointer focus:outline-none transition-colors text-[#1d1d1f]"
                            >
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                            </select>
                            <ChevronDown size={10} className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none opacity-50 group-hover:opacity-100" />
                        </div>
                    </div>

                    {/* Range Info */}
                    <span className="text-[#1d1d1f]">
                        {indexOfFirstOrder + 1}-{Math.min(indexOfLastOrder, filteredOrders.length)} de {filteredOrders.length}
                    </span>
                </div>

                {/* Navigation Icons ... */}
                <div className="flex items-center gap-2 w-full sm:w-auto justify-center bg-white p-1.5 sm:p-0 rounded-xl sm:rounded-none border sm:border-none border-gray-100 sm:bg-transparent">
                    <button 
                        onClick={() => paginate(1)}
                        disabled={currentPage === 1}
                        className="p-2 sm:p-1.5 rounded-lg hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all text-[#1d1d1f]"
                        title="Primeira Página"
                    >
                        <ChevronsLeft size={16} strokeWidth={1.5} />
                    </button>
                    <button 
                        onClick={() => paginate(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="p-2 sm:p-1.5 rounded-lg hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all text-[#1d1d1f]"
                        title="Página Anterior"
                    >
                        <ChevronLeft size={16} strokeWidth={1.5} />
                    </button>
                    <button 
                        onClick={() => paginate(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="p-2 sm:p-1.5 rounded-lg hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all text-[#1d1d1f]"
                        title="Próxima Página"
                    >
                        <ChevronRight size={16} strokeWidth={1.5} />
                    </button>
                    <button 
                        onClick={() => paginate(totalPages)}
                        disabled={currentPage === totalPages}
                        className="p-2 sm:p-1.5 rounded-lg hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all text-[#1d1d1f]"
                        title="Última Página"
                    >
                        <ChevronsRight size={16} strokeWidth={1.5} />
                    </button>
                </div>
            </div>
        )}

      </div>

      {/* LIGHTBOX OVERLAY ... */}
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
    </div>
  );
};

export default UserDashboard;
