
import React, { useState, useEffect, useMemo } from 'react';
import { 
    Quote, Plus, Trash2, Edit3, ToggleLeft, ToggleRight, 
    Settings, Import, Save, X, Star, Upload, Search, CheckCircle, RotateCw, GripVertical, Calendar, Check
} from 'lucide-react';
import { LoginTestimonial, Review, LoginTestimonialSettings } from '../../types';
import { 
    getLoginTestimonials, 
    addLoginTestimonial, 
    updateLoginTestimonial, 
    deleteLoginTestimonial, 
    getReviews, 
    getLoginTestimonialConfig, 
    updateLoginTestimonialSettings,
    reorderLoginTestimonials
} from '../../services/mockService';

const AdminLoginTestimonials: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'manage' | 'import' | 'settings'>('manage');
    const [testimonials, setTestimonials] = useState<LoginTestimonial[]>([]);
    const [siteReviews, setSiteReviews] = useState<Review[]>([]);
    const [settings, setSettings] = useState<LoginTestimonialSettings>({ displayMode: 'random', maxItems: 5 });
    
    // UI Feedback State
    const [isSaved, setIsSaved] = useState(false);

    // Filters State
    const [reviewSearch, setReviewSearch] = useState('');
    const [dateStart, setDateStart] = useState('');
    const [dateEnd, setDateEnd] = useState('');

    // Drag & Drop State
    const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        quote: '', author: '', role: '', avatar: '', bgImage: '', rating: 5, isActive: true
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        setTestimonials(getLoginTestimonials());
        setSiteReviews(getReviews('approved'));
        setSettings(getLoginTestimonialConfig());
    };

    const handleOpenModal = (testimonial?: LoginTestimonial) => {
        if (testimonial) {
            setEditingId(testimonial.id);
            setFormData({
                quote: testimonial.quote,
                author: testimonial.author,
                role: testimonial.role,
                avatar: testimonial.avatar,
                bgImage: testimonial.bgImage,
                rating: testimonial.rating,
                isActive: testimonial.isActive
            });
        } else {
            setEditingId(null);
            setFormData({
                quote: '', author: '', role: '', avatar: '', bgImage: 'https://images.unsplash.com/photo-1493863641943-9b68992a8d07?q=80&w=1200', rating: 5, isActive: true
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingId) {
            const original = testimonials.find(t => t.id === editingId);
            const isImported = original?.source === 'review';
            // Se for importado e estiver sendo salvo, marca como editado
            updateLoginTestimonial(editingId, { ...formData, isEdited: isImported ? true : undefined });
        } else {
            addLoginTestimonial({ ...formData, source: 'manual' });
        }
        setIsModalOpen(false);
        loadData();
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Tem certeza que deseja remover este depoimento?')) {
            deleteLoginTestimonial(id);
            loadData();
        }
    };

    const handleToggleActive = (item: LoginTestimonial) => {
        updateLoginTestimonial(item.id, { isActive: !item.isActive });
        loadData();
    };

    const handlePromoteReview = (review: Review) => {
        // Importação direta sem abrir modal
        const newTestimonial = {
            quote: review.text,
            author: review.userName,
            role: review.userLocation || 'Cliente Verificado',
            avatar: review.userAvatar || `https://ui-avatars.com/api/?name=${review.userName}&background=random`,
            bgImage: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?q=80&w=1200', // Default fancy bg
            rating: review.rating,
            isActive: true,
            source: 'review' as const,
            originalReviewId: review.id
        };

        addLoginTestimonial(newTestimonial);
        loadData();
        // Não abre modal, fluxo direto.
    };

    const handleSaveSettings = () => {
        updateLoginTestimonialSettings(settings);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2500);
    };

    // Drag and Drop Handlers
    const handleDragStart = (index: number) => {
        setDraggedItemIndex(index);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault(); // Necessary to allow dropping
    };

    const handleDrop = (dropIndex: number) => {
        if (draggedItemIndex === null || draggedItemIndex === dropIndex) return;

        const updatedTestimonials = [...testimonials];
        const [movedItem] = updatedTestimonials.splice(draggedItemIndex, 1);
        updatedTestimonials.splice(dropIndex, 0, movedItem);

        setTestimonials(updatedTestimonials);
        reorderLoginTestimonials(updatedTestimonials);
        setDraggedItemIndex(null);
    };

    // Filter Site Reviews for Import Tab
    const filteredReviews = useMemo(() => {
        // IDs já importados para excluir da lista
        const alreadyImportedIds = new Set(testimonials.map(t => t.originalReviewId).filter(Boolean));

        return siteReviews.filter(r => {
            // 1. Excluir se já importado
            if (alreadyImportedIds.has(r.id)) return false;

            // 2. Filtro de Texto
            const matchesSearch = r.text.toLowerCase().includes(reviewSearch.toLowerCase()) || 
                                  r.userName.toLowerCase().includes(reviewSearch.toLowerCase());
            
            if (!matchesSearch) return false;

            // 3. Filtro de Data
            if (dateStart || dateEnd) {
                const parts = r.createdAt.split('/'); // Formato DD/MM/YYYY
                const reviewDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
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
    }, [siteReviews, testimonials, reviewSearch, dateStart, dateEnd]);

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Tabs */}
            <div className="flex justify-center">
                <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-100 flex gap-1">
                    <button 
                        onClick={() => setActiveTab('manage')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'manage' ? 'bg-[#1d1d1f] text-white shadow-md' : 'text-gray-400 hover:text-[#1d1d1f] hover:bg-gray-50'}`}
                    >
                        <Quote size={14} /> Gerenciar
                    </button>
                    <button 
                        onClick={() => setActiveTab('import')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'import' ? 'bg-[#1d1d1f] text-white shadow-md' : 'text-gray-400 hover:text-[#1d1d1f] hover:bg-gray-50'}`}
                    >
                        <Import size={14} /> Importar do Site
                    </button>
                    <button 
                        onClick={() => setActiveTab('settings')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'settings' ? 'bg-[#1d1d1f] text-white shadow-md' : 'text-gray-400 hover:text-[#1d1d1f] hover:bg-gray-50'}`}
                    >
                        <Settings size={14} /> Configurações
                    </button>
                </div>
            </div>

            {/* TAB: MANAGE */}
            {activeTab === 'manage' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-xl font-serif font-bold text-[#1d1d1f]">Depoimentos Ativos</h3>
                            <p className="text-xs text-gray-400 mt-1">
                                {settings.displayMode === 'sequential' 
                                    ? 'Modo Sequencial: Arraste os cards para definir a ordem de exibição.' 
                                    : 'Modo Aleatório: A ordem abaixo é apenas para organização.'}
                            </p>
                        </div>
                        <button onClick={() => handleOpenModal()} className="bg-[#1d1d1f] text-white px-6 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-lg flex items-center gap-2 active:scale-95">
                            <Plus size={16} /> Adicionar Manualmente
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {testimonials.map((item, index) => (
                            <div 
                                key={item.id} 
                                draggable
                                onDragStart={() => handleDragStart(index)}
                                onDragOver={handleDragOver}
                                onDrop={() => handleDrop(index)}
                                className={`bg-white rounded-xl border transition-all relative group overflow-hidden cursor-move hover:shadow-md ${item.isActive ? 'border-gray-200 shadow-sm' : 'border-gray-100 opacity-60 grayscale'}`}
                            >
                                {/* Drag Handle Hint */}
                                <div className="absolute top-2 right-2 z-20 text-white/50 bg-black/20 p-1 rounded hover:bg-black/40 transition-colors opacity-0 group-hover:opacity-100">
                                    <GripVertical size={16} />
                                </div>

                                {/* Image Preview */}
                                <div className="h-32 w-full relative">
                                    <img src={item.bgImage} className="w-full h-full object-cover" alt="Background" />
                                    <div className="absolute inset-0 bg-black/40"></div>
                                    <div className="absolute bottom-4 left-4 flex items-center gap-3">
                                        <img src={item.avatar} className="w-10 h-10 rounded-full border-2 border-white object-cover" alt={item.author} />
                                        <div className="text-white">
                                            <p className="text-xs font-bold">{item.author}</p>
                                            <p className="text-[9px] uppercase tracking-wide opacity-80">{item.role}</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="p-5">
                                    <div className="flex text-[#B8860B] mb-2 gap-0.5">
                                        {[...Array(5)].map((_, i) => <Star key={i} size={12} fill={i < item.rating ? "currentColor" : "none"} />)}
                                    </div>
                                    <p className="text-sm text-gray-600 italic line-clamp-3 mb-4">"{item.quote}"</p>
                                    
                                    <div className="flex justify-between items-center border-t border-gray-50 pt-4">
                                        <div className="flex gap-1.5">
                                            {item.source === 'manual' ? (
                                                <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded bg-gray-100 text-gray-500">
                                                    Manual
                                                </span>
                                            ) : (
                                                <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded bg-blue-50 text-blue-600">
                                                    Importada
                                                </span>
                                            )}
                                            {item.isEdited && (
                                                <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded bg-amber-50 text-amber-600">
                                                    Editada
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleToggleActive(item)} className="p-2 text-gray-400 hover:text-emerald-500 transition-colors" title={item.isActive ? "Desativar" : "Ativar"}>
                                                {item.isActive ? <ToggleRight size={20} className="text-emerald-500"/> : <ToggleLeft size={20}/>}
                                            </button>
                                            <button onClick={() => handleOpenModal(item)} className="p-2 text-gray-400 hover:text-[#B8860B] transition-colors"><Edit3 size={16}/></button>
                                            <button onClick={() => handleDelete(item.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* TAB: IMPORT */}
            {activeTab === 'import' && (
                <div className="space-y-6">
                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
                        {/* Search */}
                        <div className="relative w-full md:flex-1 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#B8860B] transition-colors" size={18} />
                            <input 
                                type="text"
                                placeholder="Buscar por nome do cliente..."
                                value={reviewSearch}
                                onChange={(e) => setReviewSearch(e.target.value)}
                                className="w-full h-12 pl-12 pr-12 bg-[#F5F5F7] border border-transparent rounded-xl text-sm outline-none focus:bg-white focus:border-[#B8860B] focus:ring-1 focus:ring-[#B8860B]/20 transition-all shadow-inner placeholder:text-gray-400"
                            />
                            {reviewSearch && (
                                <button 
                                    onClick={() => setReviewSearch('')}
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

                    <div className="grid grid-cols-1 gap-4">
                        {filteredReviews.length === 0 ? (
                            <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">
                                <p className="font-medium text-sm">Nenhuma avaliação disponível para importação.</p>
                                <button onClick={() => { setReviewSearch(''); setDateStart(''); setDateEnd(''); }} className="text-[#B8860B] text-[10px] font-bold uppercase tracking-widest mt-2 hover:underline">
                                    Limpar filtros
                                </button>
                            </div>
                        ) : (
                            filteredReviews.map(review => (
                                <div key={review.id} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-6 items-start md:items-center">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="flex text-[#B8860B] gap-0.5">
                                                {[...Array(5)].map((_, i) => <Star key={i} size={12} fill={i < review.rating ? "currentColor" : "none"} />)}
                                            </div>
                                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{review.createdAt}</span>
                                        </div>
                                        <p className="text-sm text-gray-600 italic mb-2">"{review.text}"</p>
                                        <p className="text-xs font-bold text-[#1d1d1f] flex items-center gap-2">
                                            {review.userName} 
                                            {review.userLocation && <span className="font-normal text-gray-400">• {review.userLocation}</span>}
                                        </p>
                                    </div>
                                    <button 
                                        onClick={() => handlePromoteReview(review)}
                                        className="bg-[#F5F5F7] text-[#1d1d1f] hover:bg-[#1d1d1f] hover:text-white px-6 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 shrink-0 border border-gray-200 hover:border-transparent"
                                    >
                                        <Upload size={14} /> Importar
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* TAB: SETTINGS */}
            {activeTab === 'settings' && (
                <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className="text-xl font-serif font-bold text-[#1d1d1f] mb-6 flex items-center gap-2">
                        <Settings size={20} className="text-[#B8860B]" /> Configurações de Exibição
                    </h3>
                    
                    <div className="space-y-8">
                        <div>
                            <label className="text-[10px] font-bold text-[#86868b] uppercase tracking-widest mb-3 block">Modo de Rotação</label>
                            <div className="grid grid-cols-2 gap-4">
                                <button 
                                    onClick={() => setSettings({...settings, displayMode: 'random'})}
                                    className={`p-6 rounded-xl border text-center transition-all ${settings.displayMode === 'random' ? 'bg-[#1d1d1f] text-white border-[#1d1d1f] shadow-lg' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                                >
                                    <div className="flex justify-center mb-3"><RotateCw size={24} /></div>
                                    <span className="text-xs font-bold uppercase tracking-widest">Aleatório</span>
                                    <p className="text-[10px] mt-2 opacity-70">Exibe um depoimento diferente a cada atualização da página.</p>
                                </button>
                                <button 
                                    onClick={() => setSettings({...settings, displayMode: 'sequential'})}
                                    className={`p-6 rounded-xl border text-center transition-all ${settings.displayMode === 'sequential' ? 'bg-[#1d1d1f] text-white border-[#1d1d1f] shadow-lg' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                                >
                                    <div className="flex justify-center mb-3"><CheckCircle size={24} /></div>
                                    <span className="text-xs font-bold uppercase tracking-widest">Sequencial</span>
                                    <p className="text-[10px] mt-2 opacity-70">Segue a ordem manual definida na aba Gerenciar.</p>
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-[#86868b] uppercase tracking-widest mb-3 block">Limite de Rotação</label>
                            <div className="flex items-center gap-4 bg-[#F5F5F7] p-4 rounded-xl">
                                <input 
                                    type="range" 
                                    min="1" 
                                    max="20" 
                                    value={settings.maxItems} 
                                    onChange={(e) => setSettings({...settings, maxItems: parseInt(e.target.value)})}
                                    className="flex-1 h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-[#1d1d1f]"
                                />
                                <span className="bg-white px-4 py-2 rounded-lg font-bold text-[#1d1d1f] shadow-sm w-16 text-center">{settings.maxItems}</span>
                            </div>
                            <p className="text-[10px] text-gray-400 mt-2">Define quantos depoimentos ativos serão considerados no ciclo de rotação (respeitando a ordem).</p>
                        </div>

                        <div className="pt-6 border-t border-gray-100 flex justify-end">
                            <button 
                                onClick={handleSaveSettings}
                                disabled={isSaved} 
                                className={`px-8 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all shadow-lg flex items-center gap-2 ${
                                    isSaved 
                                    ? 'bg-emerald-500 text-white cursor-default' 
                                    : 'bg-[#B8860B] text-white hover:bg-[#966d09]'
                                }`}
                            >
                                {isSaved ? (
                                    <>
                                        <Check size={16} /> Salvo
                                    </>
                                ) : (
                                    <>
                                        <Save size={16} /> Salvar Configurações
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL EDIT/CREATE */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#011F4B]/30 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
                    <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl relative overflow-hidden animate-fade-in border border-gray-100 flex flex-col max-h-[90vh]">
                        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-white">
                            <h3 className="font-serif font-bold text-xl text-[#1d1d1f]">{editingId ? 'Editar Depoimento' : 'Novo Depoimento'}</h3>
                            <button onClick={() => setIsModalOpen(false)}><X size={20} className="text-gray-400 hover:text-red-500"/></button>
                        </div>
                        
                        <div className="p-8 overflow-y-auto">
                            <form id="testimonialForm" onSubmit={handleSave} className="space-y-5">
                                <div>
                                    <label className="text-[10px] font-bold text-[#86868b] uppercase px-1 mb-1 block">Depoimento</label>
                                    <textarea 
                                        required
                                        rows={3}
                                        className="w-full p-3 bg-[#F5F5F7] border border-transparent rounded-xl text-sm outline-none focus:bg-white focus:border-[#B8860B] resize-none"
                                        placeholder="O texto do depoimento..."
                                        value={formData.quote}
                                        onChange={e => setFormData({...formData, quote: e.target.value})}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-[#86868b] uppercase px-1 mb-1 block">Autor</label>
                                        <input 
                                            required
                                            className="w-full h-10 px-3 bg-[#F5F5F7] border border-transparent rounded-lg text-sm outline-none focus:bg-white focus:border-[#B8860B]"
                                            value={formData.author}
                                            onChange={e => setFormData({...formData, author: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-[#86868b] uppercase px-1 mb-1 block">Cargo / Local</label>
                                        <input 
                                            required
                                            className="w-full h-10 px-3 bg-[#F5F5F7] border border-transparent rounded-lg text-sm outline-none focus:bg-white focus:border-[#B8860B]"
                                            placeholder="Ex: Designer • SP"
                                            value={formData.role}
                                            onChange={e => setFormData({...formData, role: e.target.value})}
                                        />
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="text-[10px] font-bold text-[#86868b] uppercase px-1 mb-1 block">Imagem de Fundo (URL)</label>
                                    <input 
                                        required
                                        className="w-full h-10 px-3 bg-[#F5F5F7] border border-transparent rounded-lg text-sm outline-none focus:bg-white focus:border-[#B8860B]"
                                        placeholder="https://..."
                                        value={formData.bgImage}
                                        onChange={e => setFormData({...formData, bgImage: e.target.value})}
                                    />
                                    <p className="text-[9px] text-gray-400 mt-1">Recomendado: Imagens escuras ou com filtro para contraste.</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-[#86868b] uppercase px-1 mb-1 block">Foto do Autor (URL)</label>
                                        <input 
                                            className="w-full h-10 px-3 bg-[#F5F5F7] border border-transparent rounded-lg text-sm outline-none focus:bg-white focus:border-[#B8860B]"
                                            placeholder="https://..."
                                            value={formData.avatar}
                                            onChange={e => setFormData({...formData, avatar: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-[#86868b] uppercase px-1 mb-1 block">Avaliação (1-5)</label>
                                        <input 
                                            type="number"
                                            min="1"
                                            max="5"
                                            className="w-full h-10 px-3 bg-[#F5F5F7] border border-transparent rounded-lg text-sm outline-none focus:bg-white focus:border-[#B8860B]"
                                            value={formData.rating}
                                            onChange={e => setFormData({...formData, rating: parseInt(e.target.value)})}
                                        />
                                    </div>
                                </div>

                                <div onClick={() => setFormData({...formData, isActive: !formData.isActive})} className={`cursor-pointer p-4 rounded-lg border transition-all flex items-center justify-between ${formData.isActive ? 'bg-[#1d1d1f] text-white border-[#1d1d1f]' : 'bg-white border-gray-200'}`}>
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Status Ativo</span>
                                    {formData.isActive ? <ToggleRight size={22} className="text-[#B8860B]"/> : <ToggleLeft size={22} className="text-gray-300"/>}
                                </div>
                            </form>
                        </div>

                        <div className="p-6 border-t border-gray-100 bg-white flex gap-4">
                            <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-gray-100 text-[#1d1d1f] font-bold text-[10px] uppercase tracking-widest rounded-lg hover:bg-gray-200 transition-all">Cancelar</button>
                            <button type="submit" form="testimonialForm" className="flex-1 py-3 bg-[#1d1d1f] text-white font-bold text-[10px] uppercase tracking-widest rounded-lg hover:bg-black transition-all shadow-lg">Salvar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminLoginTestimonials;
