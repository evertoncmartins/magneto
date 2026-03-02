
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, HelpCircle, ToggleRight, ToggleLeft, Check, Save } from 'lucide-react';
import { addFAQ, updateFAQ, getFAQCategories } from '../../../services/mockService';
import { FAQ, FAQCategory } from '../../../types';

interface AdminFAQModalProps {
    isOpen: boolean;
    onClose: () => void;
    refreshData: () => void;
    editingFAQ?: FAQ | null;
}

const AdminFAQModal: React.FC<AdminFAQModalProps> = ({ isOpen, onClose, refreshData, editingFAQ }) => {
    const [categories, setCategories] = useState<FAQCategory[]>([]);
    const [faqData, setFaqData] = useState<{
        question: string;
        answer: string;
        category: string;
        isActive: boolean;
    }>({
        question: '',
        answer: '',
        category: '',
        isActive: true
    });

    // Estado para rastrear dados iniciais e verificar alterações
    const [initialFaqData, setInitialFaqData] = useState<{
        question: string;
        answer: string;
        category: string;
        isActive: boolean;
    } | null>(null);

    useEffect(() => {
        if (isOpen) {
            const loadedCats = getFAQCategories();
            setCategories(loadedCats);
            
            if (editingFAQ) {
                const data = {
                    question: editingFAQ.question,
                    answer: editingFAQ.answer,
                    category: editingFAQ.category,
                    isActive: editingFAQ.isActive
                };
                setFaqData(data);
                setInitialFaqData(data);
            } else {
                const data = { 
                    question: '', 
                    answer: '', 
                    category: loadedCats.length > 0 ? loadedCats[0].name : '', 
                    isActive: true 
                };
                setFaqData(data);
                setInitialFaqData(data);
            }
        }
    }, [isOpen, editingFAQ]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (editingFAQ) {
            updateFAQ(editingFAQ.id, faqData);
        } else {
            addFAQ(faqData);
        }

        refreshData();
        onClose();
    };

    // Verifica se houve alterações
    const isDirty = JSON.stringify(faqData) !== JSON.stringify(initialFaqData);

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#1d1d1f]/60 backdrop-blur-md" onClick={onClose}></div>
            <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl relative overflow-hidden flex flex-col animate-fade-in border border-gray-100 max-h-[90vh] z-10">
                <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                    <div>
                        <h3 className="font-serif font-bold text-2xl">{editingFAQ ? 'Editar Pergunta' : 'Nova Pergunta'}</h3>
                        <p className="text-[10px] font-bold text-[#86868b] uppercase tracking-widest mt-1">Gerenciamento de FAQ</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={24} /></button>
                </div>
                <div className="p-8 overflow-y-auto">
                    <form id="faqForm" onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-[#86868b] uppercase px-1">Pergunta</label>
                            <div className="relative">
                                <HelpCircle size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"/>
                                <input 
                                  required 
                                  value={faqData.question} 
                                  onChange={e => setFaqData({...faqData, question: e.target.value})} 
                                  placeholder="Ex: Qual o prazo de entrega?" 
                                  className="w-full px-4 py-3 pl-12 bg-[#F5F5F7] rounded-lg text-sm outline-none focus:bg-white focus:border-[#B8860B] border border-transparent transition-all" 
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-[#86868b] uppercase px-1">Categoria</label>
                            <select 
                                value={faqData.category}
                                onChange={e => setFaqData({...faqData, category: e.target.value})}
                                className="w-full px-4 py-3 bg-[#F5F5F7] rounded-lg text-sm outline-none border border-transparent focus:bg-white focus:border-[#B8860B] transition-all"
                            >
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-[#86868b] uppercase px-1">Resposta</label>
                            <textarea
                                required
                                rows={5}
                                value={faqData.answer}
                                onChange={e => setFaqData({...faqData, answer: e.target.value})}
                                className="w-full px-4 py-3 bg-[#F5F5F7] rounded-lg text-sm outline-none border border-transparent focus:bg-white focus:border-[#B8860B] transition-all resize-none"
                                placeholder="Digite a resposta detalhada aqui..."
                            />
                        </div>

                        <div 
                            onClick={() => setFaqData({...faqData, isActive: !faqData.isActive})} 
                            className={`cursor-pointer p-4 rounded-xl border transition-all flex items-center justify-between ${faqData.isActive ? 'bg-[#1d1d1f] text-white border-[#1d1d1f] shadow-lg' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
                        >
                            <span className="text-[10px] font-bold uppercase tracking-widest">Exibir no Site</span>
                            {faqData.isActive ? <ToggleRight size={22} className="text-[#B8860B]"/> : <ToggleLeft size={22} className="text-gray-300"/>}
                        </div>
                    </form>
                </div>
                <div className="p-6 border-t border-gray-100 bg-white flex gap-4">
                    <button type="button" onClick={onClose} className="flex-1 py-4 bg-gray-50 text-[#1d1d1f] font-bold text-[10px] uppercase tracking-widest rounded-lg hover:bg-gray-100 transition-all">Cancelar</button>
                    <button 
                        type="submit" 
                        form="faqForm" 
                        disabled={!!editingFAQ && !isDirty}
                        className={`flex-1 py-4 font-bold text-[10px] uppercase tracking-widest rounded-lg transition-all shadow-xl flex items-center justify-center gap-2 ${
                            (!!editingFAQ && !isDirty)
                            ? 'bg-gray-100 text-gray-400 cursor-default shadow-none' 
                            : 'bg-[#1d1d1f] text-white hover:bg-black'
                        }`}
                    >
                        {(!!editingFAQ && !isDirty) ? (
                            <><Check size={16}/> Salvo</>
                        ) : (
                            <><Save size={16}/> {editingFAQ ? 'Salvar' : 'Criar FAQ'}</>
                        )}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default AdminFAQModal;
