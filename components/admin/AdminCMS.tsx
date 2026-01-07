
import React, { useState } from 'react';
import { Save, Image as ImageIcon } from 'lucide-react';
import { PageContent } from '../../types';
import { updateSiteContent } from '../../services/mockService';

interface AdminCMSProps {
    cmsContent: PageContent[];
    setCmsContent: (content: PageContent[]) => void;
}

const AdminCMS: React.FC<AdminCMSProps> = ({ cmsContent, setCmsContent }) => {
    const [selectedPageId, setSelectedPageId] = useState<string>(cmsContent[0]?.id || 'home');

    const handleCmsUpdate = (pageId: string, sectionId: string, fieldKey: string, value: string) => {
        const newContent = cmsContent.map(page => {
            if (page.id === pageId) {
                return {
                    ...page,
                    sections: page.sections.map(section => {
                        if (section.id === sectionId) {
                            return {
                                ...section,
                                fields: section.fields.map(field => {
                                    if (field.key === fieldKey) {
                                        return { ...field, value };
                                    }
                                    return field;
                                })
                            };
                        }
                        return section;
                    })
                };
            }
            return page;
        });
        setCmsContent(newContent);
    };
  
    const handleSaveCms = () => {
        updateSiteContent(cmsContent);
        alert('Conteúdo do site atualizado com sucesso!');
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-serif font-bold text-[#1d1d1f]">Conteúdo do Site</h2>
                    <p className="text-xs text-[#86868b] font-bold uppercase tracking-widest mt-1">Edite textos e imagens das páginas sem mexer no código.</p>
                </div>
                <button onClick={handleSaveCms} className="px-6 py-3 bg-[#B8860B] text-white rounded-md text-[10px] font-bold uppercase tracking-widest hover:bg-[#966d09] transition-colors flex items-center gap-2 shadow-lg">
                    <Save size={14}/> Salvar Alterações
                </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 items-start">
                
                {/* Sidebar: Page Selection */}
                <div className="w-full lg:w-64 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden shrink-0">
                    <div className="p-4 bg-gray-50 border-b border-gray-100">
                        <h4 className="font-bold text-[10px] text-[#86868b] uppercase tracking-widest">Páginas</h4>
                    </div>
                    <div className="flex flex-col p-2">
                        {cmsContent.map(page => (
                            <button 
                                key={page.id}
                                onClick={() => setSelectedPageId(page.id)}
                                className={`text-left px-4 py-3 rounded-lg text-xs font-bold transition-all ${selectedPageId === page.id ? 'bg-[#1d1d1f] text-white' : 'text-gray-500 hover:bg-gray-50 hover:text-[#1d1d1f]'}`}
                            >
                                {page.title}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content Editor Area */}
                <div className="flex-1 w-full space-y-8">
                    {cmsContent.find(p => p.id === selectedPageId)?.sections.map(section => (
                        <div key={section.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                                <h3 className="font-serif font-bold text-lg text-[#1d1d1f]">{section.title}</h3>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-100 px-2 py-1 rounded">Seção: {section.id}</span>
                            </div>
                            
                            <div className="p-6 space-y-6">
                                {section.fields.map(field => (
                                    <div key={field.key} className="space-y-2">
                                        <div className="flex justify-between">
                                            <label className="text-[10px] font-bold text-[#1d1d1f] uppercase tracking-widest">{field.label}</label>
                                            {field.type === 'image' && (
                                                <span className="text-[9px] text-[#B8860B] font-bold uppercase cursor-pointer hover:underline" onClick={() => window.open(field.value, '_blank')}>Ver Imagem</span>
                                            )}
                                        </div>
                                        
                                        {field.type === 'textarea' ? (
                                            <textarea 
                                                value={field.value}
                                                onChange={(e) => handleCmsUpdate(selectedPageId, section.id, field.key, e.target.value)}
                                                className="w-full p-4 bg-[#F5F5F7] border border-transparent rounded-xl text-sm outline-none focus:bg-white focus:border-[#B8860B] transition-all resize-y min-h-[100px]"
                                            />
                                        ) : field.type === 'image' ? (
                                            <div className="flex gap-4 items-center">
                                                <div className="flex-1 relative">
                                                    <ImageIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                                    <input 
                                                        type="text"
                                                        value={field.value}
                                                        onChange={(e) => handleCmsUpdate(selectedPageId, section.id, field.key, e.target.value)}
                                                        className="w-full pl-12 pr-4 py-3 bg-[#F5F5F7] border border-transparent rounded-xl text-sm outline-none focus:bg-white focus:border-[#B8860B] transition-all"
                                                        placeholder="https://..."
                                                    />
                                                </div>
                                                <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden shrink-0">
                                                    <img src={field.value} className="w-full h-full object-cover" onError={(e) => e.currentTarget.style.display = 'none'} />
                                                </div>
                                            </div>
                                        ) : (
                                            <input 
                                                type="text"
                                                value={field.value}
                                                onChange={(e) => handleCmsUpdate(selectedPageId, section.id, field.key, e.target.value)}
                                                className="w-full px-4 py-3 bg-[#F5F5F7] border border-transparent rounded-xl text-sm outline-none focus:bg-white focus:border-[#B8860B] transition-all"
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AdminCMS;
