
import React, { useState, useMemo, useEffect } from 'react';
import { Search, Plus, X, Edit3, Trash2, ToggleRight, ToggleLeft, HelpCircle, Tag, List, Filter } from 'lucide-react';
import { FAQ, FAQCategory } from '../../types';
import { updateFAQ, removeFAQ, getFAQCategories, removeFAQCategory, updateFAQCategory } from '../../services/mockService';
import AdminFAQModal from './modals/AdminFAQModal';
import AdminFAQCategoryModal from './modals/AdminFAQCategoryModal';

interface AdminFAQProps {
    faqs: FAQ[];
    refreshData: () => void;
}

const AdminFAQ: React.FC<AdminFAQProps> = ({ faqs, refreshData }) => {
    // View State
    const [activeTab, setActiveTab] = useState<'questions' | 'categories'>('questions');

    // Questions State
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [selectedCategory, setSelectedCategory] = useState<string>('all'); // Novo estado para filtro de categoria
    const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Categories State
    const [categories, setCategories] = useState<FAQCategory[]>([]);
    const [catSearchTerm, setCatSearchTerm] = useState('');
    const [editingCategory, setEditingCategory] = useState<FAQCategory | null>(null);
    const [isCatModalOpen, setIsCatModalOpen] = useState(false);

    useEffect(() => {
        setCategories(getFAQCategories());
    }, [faqs]); // Refresh categories when parent refreshes or faqs change

    // --- LOGIC: QUESTIONS ---
    const counts = useMemo(() => ({
        all: faqs.length,
        active: faqs.filter(f => f.isActive).length,
        inactive: faqs.filter(f => !f.isActive).length
    }), [faqs]);

    const openModal = (faq?: FAQ) => {
        setEditingFAQ(faq || null);
        setIsModalOpen(true);
    };

    const handleToggleActive = (faq: FAQ) => {
        updateFAQ(faq.id, { isActive: !faq.isActive });
        refreshData();
    };

    const handleDelete = (id: string) => {
        if(window.confirm("Tem certeza que deseja excluir esta pergunta?")) {
            removeFAQ(id);
            refreshData();
        }
    };

    const filteredFAQs = faqs.filter(f => {
        const matchesSearch = f.question.toLowerCase().includes(searchTerm.toLowerCase()) || f.answer.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = statusFilter === 'all' 
            ? true 
            : statusFilter === 'active' ? f.isActive 
            : !f.isActive;

        const matchesCategory = selectedCategory === 'all' || f.category === selectedCategory;

        return matchesSearch && matchesStatus && matchesCategory;
    });

    // --- LOGIC: CATEGORIES ---
    const openCatModal = (cat?: FAQCategory) => {
        setEditingCategory(cat || null);
        setIsCatModalOpen(true);
    };

    const handleToggleCatActive = (cat: FAQCategory) => {
        updateFAQCategory(cat.id, { isActive: !cat.isActive });
        refreshData();
        setCategories(getFAQCategories());
    };

    const handleDeleteCat = (id: string) => {
        if(window.confirm("Tem certeza que deseja excluir esta categoria? Perguntas associadas podem perder a referência.")) {
            removeFAQCategory(id);
            refreshData();
            setCategories(getFAQCategories());
        }
    };

    const filteredCategories = categories.filter(c => 
        c.name.toLowerCase().includes(catSearchTerm.toLowerCase())
    );

    return (
        <>
            <div className="space-y-6 animate-fade-in">
                
                {/* Main Tabs */}
                <div className="flex justify-center mb-4">
                    <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-100 flex gap-1">
                        <button 
                            onClick={() => setActiveTab('questions')}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'questions' ? 'bg-[#1d1d1f] text-white shadow-md' : 'text-gray-400 hover:text-[#1d1d1f] hover:bg-gray-50'}`}
                        >
                            <HelpCircle size={14} /> Perguntas
                        </button>
                        <button 
                            onClick={() => setActiveTab('categories')}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'categories' ? 'bg-[#1d1d1f] text-white shadow-md' : 'text-gray-400 hover:text-[#1d1d1f] hover:bg-gray-50'}`}
                        >
                            <Tag size={14} /> Categorias
                        </button>
                    </div>
                </div>

                {activeTab === 'questions' && (
                    <div className="space-y-6 animate-fade-in">
                        {/* Header Controls */}
                        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
                            {/* Search */}
                            <div className="relative flex-1 w-full group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#B8860B] transition-colors" size={18} />
                                <input 
                                    type="text"
                                    placeholder="Buscar nas perguntas frequentes..."
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

                            {/* Category Filter Dropdown */}
                            <div className="relative w-full md:w-64 group">
                                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#B8860B] transition-colors pointer-events-none" size={18} />
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="w-full h-12 pl-12 pr-8 bg-[#F5F5F7] border border-transparent rounded-xl text-sm outline-none focus:bg-white focus:border-[#B8860B] focus:ring-1 focus:ring-[#B8860B]/20 transition-all shadow-inner text-[#1d1d1f] appearance-none cursor-pointer"
                                >
                                    <option value="all">Todas as Categorias</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                                    ))}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                    <List size={16} />
                                </div>
                            </div>
                            
                            <button 
                                onClick={() => openModal()} 
                                className="w-full md:w-auto bg-[#1d1d1f] text-white px-8 py-3.5 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95 shrink-0"
                            >
                                <Plus size={16} /> Nova Pergunta
                            </button>
                        </div>

                        {/* Filter Tabs */}
                        <div className="flex flex-wrap md:flex-nowrap gap-2 w-full md:w-fit bg-transparent md:bg-white md:p-1.5 md:rounded-xl md:shadow-sm md:border md:border-gray-100">
                            {[
                                { id: 'all', label: 'Todas' },
                                { id: 'active', label: 'Ativas' },
                                { id: 'inactive', label: 'Inativas' }
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

                        {/* List */}
                        <div className="grid grid-cols-1 gap-4">
                            {filteredFAQs.map(faq => (
                                <div key={faq.id} className={`bg-white p-6 rounded-xl border transition-all duration-300 flex flex-col md:flex-row gap-6 ${faq.isActive ? 'border-gray-100 shadow-sm hover:shadow-md' : 'border-gray-100 opacity-60 grayscale hover:opacity-100'}`}>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="px-2 py-1 rounded bg-[#F5F5F7] text-[9px] font-bold uppercase tracking-widest text-[#B8860B] border border-gray-200">
                                                {faq.category}
                                            </span>
                                            {!faq.isActive && <span className="text-[9px] font-bold uppercase tracking-widest text-red-400">Inativo</span>}
                                        </div>
                                        <h3 className="text-lg font-serif font-bold text-[#1d1d1f] mb-2">{faq.question}</h3>
                                        <p className="text-sm text-gray-500 font-light leading-relaxed line-clamp-2">{faq.answer}</p>
                                    </div>
                                    
                                    <div className="flex md:flex-col items-center justify-center gap-2 border-t md:border-t-0 md:border-l border-gray-50 pt-4 md:pt-0 md:pl-6 shrink-0">
                                        <button 
                                            onClick={() => handleToggleActive(faq)}
                                            className={`p-2 rounded-lg transition-colors ${faq.isActive ? 'text-emerald-500 hover:bg-emerald-50' : 'text-gray-400 hover:text-emerald-500 hover:bg-gray-50'}`}
                                            title={faq.isActive ? "Desativar" : "Ativar"}
                                        >
                                            {faq.isActive ? <ToggleRight size={20}/> : <ToggleLeft size={20}/>}
                                        </button>
                                        <button 
                                            onClick={() => openModal(faq)}
                                            className="p-2 rounded-lg text-gray-400 hover:text-[#B8860B] hover:bg-gray-50 transition-colors"
                                            title="Editar"
                                        >
                                            <Edit3 size={16}/>
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(faq.id)}
                                            className="p-2 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                                            title="Excluir"
                                        >
                                            <Trash2 size={16}/>
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {filteredFAQs.length === 0 && (
                                <div className="text-center py-20 text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">
                                    <HelpCircle size={32} className="mx-auto mb-4 text-gray-200"/>
                                    <p className="font-medium text-sm">Nenhuma pergunta encontrada.</p>
                                    <button onClick={() => { setSearchTerm(''); setStatusFilter('all'); setSelectedCategory('all'); }} className="text-[#B8860B] text-[10px] font-bold uppercase tracking-widest mt-2 hover:underline">
                                        Limpar filtros
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'categories' && (
                    <div className="space-y-6 animate-fade-in">
                        {/* Header Controls for Categories */}
                        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
                            <div className="relative flex-1 w-full group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#B8860B] transition-colors" size={18} />
                                <input 
                                    type="text"
                                    placeholder="Buscar categorias..."
                                    value={catSearchTerm}
                                    onChange={(e) => setCatSearchTerm(e.target.value)}
                                    className="w-full h-12 pl-12 pr-12 bg-[#F5F5F7] border border-transparent rounded-xl text-sm outline-none focus:bg-white focus:border-[#B8860B] focus:ring-1 focus:ring-[#B8860B]/20 transition-all shadow-inner placeholder:text-gray-400"
                                />
                                {catSearchTerm && (
                                    <button 
                                        onClick={() => setCatSearchTerm('')}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center text-gray-400 hover:text-[#B8860B] hover:bg-gray-100 rounded-full transition-all"
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>
                            
                            <button 
                                onClick={() => openCatModal()} 
                                className="w-full md:w-auto bg-[#1d1d1f] text-white px-8 py-3.5 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95 shrink-0"
                            >
                                <Plus size={16} /> Nova Categoria
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredCategories.map(cat => (
                                <div key={cat.id} className={`bg-white p-6 rounded-xl border transition-all duration-300 flex flex-col justify-between ${cat.isActive ? 'border-gray-100 shadow-sm hover:shadow-md' : 'border-gray-100 opacity-60 grayscale hover:opacity-100'}`}>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 rounded-lg bg-[#F5F5F7] flex items-center justify-center text-[#B8860B]">
                                            <Tag size={18} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-[#1d1d1f] text-sm">{cat.name}</h3>
                                            <span className={`text-[9px] font-bold uppercase tracking-widest ${cat.isActive ? 'text-emerald-500' : 'text-red-400'}`}>
                                                {cat.isActive ? 'Ativa' : 'Inativa'}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center justify-between border-t border-gray-50 pt-4">
                                        <div className="flex gap-2">
                                            <button onClick={() => openCatModal(cat)} className="p-2 text-gray-400 hover:text-[#1d1d1f] hover:bg-gray-50 rounded-lg transition-colors"><Edit3 size={16}/></button>
                                            <button onClick={() => handleDeleteCat(cat.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16}/></button>
                                        </div>
                                        <button onClick={() => handleToggleCatActive(cat)} className={`${cat.isActive ? 'text-emerald-500' : 'text-gray-300'} hover:scale-110 transition-transform`}>
                                            {cat.isActive ? <ToggleRight size={24}/> : <ToggleLeft size={24}/>}
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {filteredCategories.length === 0 && (
                                <div className="col-span-full py-20 text-center text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">
                                    <p className="font-medium text-sm">Nenhuma categoria encontrada.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <AdminFAQModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                refreshData={refreshData}
                editingFAQ={editingFAQ}
            />

            <AdminFAQCategoryModal 
                isOpen={isCatModalOpen}
                onClose={() => setIsCatModalOpen(false)}
                refreshData={() => setCategories(getFAQCategories())}
                editingCategory={editingCategory}
            />
        </>
    );
};

export default AdminFAQ;
