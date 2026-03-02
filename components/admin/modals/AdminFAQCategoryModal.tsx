
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Tag, ToggleRight, ToggleLeft } from 'lucide-react';
import { addFAQCategory, updateFAQCategory } from '../../../services/mockService';
import { FAQCategory } from '../../../types';

interface AdminFAQCategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    refreshData: () => void;
    editingCategory?: FAQCategory | null;
}

const AdminFAQCategoryModal: React.FC<AdminFAQCategoryModalProps> = ({ isOpen, onClose, refreshData, editingCategory }) => {
    const [categoryData, setCategoryData] = useState<{
        name: string;
        isActive: boolean;
    }>({
        name: '',
        isActive: true
    });

    useEffect(() => {
        if (isOpen) {
            if (editingCategory) {
                setCategoryData({
                    name: editingCategory.name,
                    isActive: editingCategory.isActive
                });
            } else {
                setCategoryData({ name: '', isActive: true });
            }
        }
    }, [isOpen, editingCategory]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (editingCategory) {
            updateFAQCategory(editingCategory.id, categoryData);
        } else {
            addFAQCategory(categoryData);
        }

        refreshData();
        onClose();
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#1d1d1f]/60 backdrop-blur-md" onClick={onClose}></div>
            <div className="bg-white w-full max-w-md rounded-xl shadow-2xl relative overflow-hidden flex flex-col animate-fade-in border border-gray-100 z-10">
                <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                    <div>
                        <h3 className="font-serif font-bold text-2xl">{editingCategory ? 'Editar Categoria' : 'Nova Categoria'}</h3>
                        <p className="text-[10px] font-bold text-[#86868b] uppercase tracking-widest mt-1">Gerenciamento de FAQ</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={24} /></button>
                </div>
                <div className="p-8">
                    <form id="faqCategoryForm" onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-[#86868b] uppercase px-1">Nome da Categoria</label>
                            <div className="relative">
                                <Tag size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"/>
                                <input 
                                  required 
                                  value={categoryData.name} 
                                  onChange={e => setCategoryData({...categoryData, name: e.target.value})} 
                                  placeholder="Ex: Política de Reembolso" 
                                  className="w-full px-4 py-3 pl-12 bg-[#F5F5F7] rounded-lg text-sm outline-none focus:bg-white focus:border-[#B8860B] border border-transparent transition-all" 
                                />
                            </div>
                        </div>

                        <div 
                            onClick={() => setCategoryData({...categoryData, isActive: !categoryData.isActive})} 
                            className={`cursor-pointer p-4 rounded-lg border transition-all flex items-center justify-between ${categoryData.isActive ? 'bg-[#1d1d1f] text-white border-[#1d1d1f] shadow-md' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
                        >
                            <span className="text-[10px] font-bold uppercase tracking-widest">Categoria Ativa</span>
                            {categoryData.isActive ? <ToggleRight size={22} className="text-[#B8860B]"/> : <ToggleLeft size={22} className="text-gray-300"/>}
                        </div>
                    </form>
                </div>
                <div className="p-6 border-t border-gray-100 bg-white flex gap-4">
                    <button type="button" onClick={onClose} className="flex-1 py-4 bg-gray-50 text-[#1d1d1f] font-bold text-[10px] uppercase tracking-widest rounded-lg hover:bg-gray-100 transition-all">Cancelar</button>
                    <button type="submit" form="faqCategoryForm" className="flex-1 py-4 bg-[#1d1d1f] text-white font-bold text-[10px] uppercase tracking-widest rounded-lg hover:bg-black transition-all shadow-xl">
                        {editingCategory ? 'Salvar' : 'Criar'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default AdminFAQCategoryModal;
