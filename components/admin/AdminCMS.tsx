
import React, { useState, useEffect } from 'react';
import { 
    Save, Image as ImageIcon, GripVertical, ChevronDown, Check, LayoutGrid, Upload, Loader2,
    // Ícones Disponíveis para o CMS
    Leaf, Heart, Truck, Layers, Info, Star, Shield, Gift, Camera, Zap, Globe, MapPin, 
    Phone, Mail, Instagram, Facebook, Twitter, Award, Clock, Calendar, Search, 
    User, Users, Sun, Moon, Droplet, Smile, ThumbsUp, Send, Package, Tag, AlertCircle
} from 'lucide-react';
import { PageContent } from '../../types';
import { updateSiteContent } from '../../services/mockService';
// @ts-ignore
import heic2any from 'heic2any';

interface AdminCMSProps {
    cmsContent: PageContent[];
    setCmsContent: (content: PageContent[]) => void;
    initialPageId: string;
}

// Lista Expandida de Ícones
const AVAILABLE_ICONS = [
    { id: 'LayoutGrid', icon: LayoutGrid },
    { id: 'Layers', icon: Layers },
    { id: 'Leaf', icon: Leaf },
    { id: 'Heart', icon: Heart },
    { id: 'Truck', icon: Truck },
    { id: 'Package', icon: Package },
    { id: 'Info', icon: Info },
    { id: 'Check', icon: Check },
    { id: 'Star', icon: Star },
    { id: 'Shield', icon: Shield },
    { id: 'Gift', icon: Gift },
    { id: 'Camera', icon: Camera },
    { id: 'Zap', icon: Zap },
    { id: 'Globe', icon: Globe },
    { id: 'MapPin', icon: MapPin },
    { id: 'Phone', icon: Phone },
    { id: 'Mail', icon: Mail },
    { id: 'Instagram', icon: Instagram },
    { id: 'Facebook', icon: Facebook },
    { id: 'Twitter', icon: Twitter },
    { id: 'Award', icon: Award },
    { id: 'Clock', icon: Clock },
    { id: 'Calendar', icon: Calendar },
    { id: 'Search', icon: Search },
    { id: 'User', icon: User },
    { id: 'Users', icon: Users },
    { id: 'Sun', icon: Sun },
    { id: 'Moon', icon: Moon },
    { id: 'Droplet', icon: Droplet },
    { id: 'Smile', icon: Smile },
    { id: 'ThumbsUp', icon: ThumbsUp },
    { id: 'Send', icon: Send },
    { id: 'Tag', icon: Tag },
    { id: 'AlertCircle', icon: AlertCircle },
];

// Helper de Compressão de Imagem
const compressImage = async (file: File): Promise<string> => {
    let sourceFile = file;
    
    // Tratamento básico para HEIC (iPhone)
    if (file.name.toLowerCase().match(/\.(heic|heif)$/) || file.type.includes('heic')) {
        try {
            const convertedBlob = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.8 });
            const finalBlob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
            sourceFile = new File([finalBlob as Blob], file.name.replace(/\.(heic|heif)$/i, '.jpg'), { type: 'image/jpeg' });
        } catch (e) {
            console.warn("Falha na conversão HEIC, tentando fluxo padrão", e);
        }
    }

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(sourceFile);
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                // Redimensiona para um tamanho seguro para web/mobile e storage
                const MAX_DIM = 1000; 
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_DIM) {
                        height *= MAX_DIM / width;
                        width = MAX_DIM;
                    }
                } else {
                    if (height > MAX_DIM) {
                        width *= MAX_DIM / height;
                        height = MAX_DIM;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0, width, height);
                    // Comprime para JPEG com qualidade 70% (reduz drasticamente o tamanho do base64)
                    resolve(canvas.toDataURL('image/jpeg', 0.7));
                } else {
                    reject(new Error("Erro ao criar contexto do canvas"));
                }
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
};

// Componente Toggle Delicado
const ToggleSwitch: React.FC<{ checked: boolean; onChange: () => void }> = ({ checked, onChange }) => (
    <div 
        onClick={onChange} 
        className={`w-10 h-5 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 shrink-0 ${checked ? 'bg-[#B8860B]' : 'bg-gray-300'}`}
    >
        <div 
            className={`bg-white w-3 h-3 rounded-full shadow-md transform duration-300 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'}`}
        />
    </div>
);

// Componente Seletor de Ícones (Grid Aberto Minimalista)
const IconSelector: React.FC<{ value: string, onChange: (val: string) => void }> = ({ value, onChange }) => {
    return (
        <div className="w-full bg-[#F9F9FA] rounded-xl p-4 border border-gray-100">
            <div className="flex flex-wrap gap-3">
                {AVAILABLE_ICONS.map(item => {
                    const isSelected = value === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => onChange(item.id)}
                            className={`
                                w-9 h-9 flex items-center justify-center rounded-lg transition-all duration-200
                                ${isSelected 
                                    ? 'bg-white text-[#B8860B] shadow-md ring-1 ring-[#B8860B] scale-110' 
                                    : 'text-gray-300 hover:text-gray-500 hover:bg-white hover:shadow-sm'
                                }
                            `}
                            title={item.id}
                            type="button"
                        >
                            <item.icon size={18} strokeWidth={isSelected ? 2 : 1.5} />
                        </button>
                    );
                })}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center px-1">
                <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">Selecione um ícone</span>
                {value && (
                    <span className="text-[9px] font-bold text-[#B8860B] uppercase tracking-widest bg-[#B8860B]/5 px-2 py-0.5 rounded">
                        {value}
                    </span>
                )}
            </div>
        </div>
    );
};

const AdminCMS: React.FC<AdminCMSProps> = ({ cmsContent, setCmsContent, initialPageId }) => {
    const [selectedPageId, setSelectedPageId] = useState<string>(initialPageId);
    const [isDirty, setIsDirty] = useState(false);
    const [isProcessingImage, setIsProcessingImage] = useState(false);
    
    // Estado local para DnD da seção de Stats
    const [statsOrder, setStatsOrder] = useState<string[]>([]);
    const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);

    // Sync selectedPageId with prop change (when sidebar clicked)
    useEffect(() => {
        setSelectedPageId(initialPageId);
    }, [initialPageId]);

    // Reset isDirty ONLY when changing pages, NOT when content changes
    useEffect(() => {
        setIsDirty(false);
    }, [selectedPageId]);

    // Efeito para sincronizar a ordem local quando a página muda ou carrega (apenas para stats)
    useEffect(() => {
        if (selectedPageId === 'stats') {
            const statsPage = cmsContent.find(p => p.id === 'stats');
            const configSection = statsPage?.sections.find(s => s.id === 'config');
            const orderField = configSection?.fields.find(f => f.key === 'stats_order');
            
            if (orderField) {
                setStatsOrder(orderField.value.split(',').filter(Boolean));
            } else {
                setStatsOrder(['orders', 'magnets', 'reviews']);
            }
        }
    }, [selectedPageId, cmsContent]); 

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
        setIsDirty(true);
    };

    // Manipulador para Upload de Arquivos Locais
    const handleFileChange = async (pageId: string, sectionId: string, fieldKey: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsProcessingImage(true);
            try {
                // Comprime a imagem antes de salvar no estado
                const compressedBase64 = await compressImage(file);
                handleCmsUpdate(pageId, sectionId, fieldKey, compressedBase64);
            } catch (error) {
                console.error("Erro ao processar imagem:", error);
                alert("Erro ao processar a imagem. Tente um arquivo diferente.");
            } finally {
                setIsProcessingImage(false);
            }
        }
        // Limpa o input para permitir selecionar o mesmo arquivo novamente se necessário
        e.target.value = '';
    };

    // Helper específico para atualizar a ordem no CMS (Stats)
    const updateStatsOrderInCMS = (newOrder: string[]) => {
        const orderString = newOrder.join(',');
        handleCmsUpdate('stats', 'config', 'stats_order', orderString);
    };

    // Drag & Drop Handlers
    const handleDragStart = (index: number) => {
        setDraggedItemIndex(index);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (dropIndex: number) => {
        if (draggedItemIndex === null || draggedItemIndex === dropIndex) return;

        const updatedOrder = [...statsOrder];
        const [movedItem] = updatedOrder.splice(draggedItemIndex, 1);
        updatedOrder.splice(dropIndex, 0, movedItem);

        setStatsOrder(updatedOrder);
        updateStatsOrderInCMS(updatedOrder);
        setDraggedItemIndex(null);
    };
  
    const handleSaveCms = () => {
        updateSiteContent(cmsContent);
        setIsDirty(false);
    };

    // Função auxiliar para pegar o valor de um campo na página atual
    const getFieldValue = (key: string) => {
        const page = cmsContent.find(p => p.id === selectedPageId);
        const section = page?.sections[0]; // Assumindo 1 seção por enquanto para simplificar o helper
        return section?.fields.find(f => f.key === key)?.value || '';
    };

    // Renderização Personalizada para a Página de Estatísticas
    const renderStatsPage = () => {
        const sectionId = 'config';
        
        // Mapeamento visual dos itens ordenáveis
        const itemsMap: Record<string, { label: string, toggleKey: string, inputKey: string }> = {
            'orders': { label: 'Pedidos Enviados', toggleKey: 'show_orders', inputKey: 'manual_orders' },
            'magnets': { label: 'Ímãs Produzidos', toggleKey: 'show_magnets', inputKey: 'manual_magnets' },
            'reviews': { label: 'Avaliações 5 Estrelas', toggleKey: 'show_reviews', inputKey: 'manual_reviews' }
        };

        return (
            <div className="space-y-8 animate-fade-in">
                {/* 1. Configuração Global */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h4 className="text-sm font-bold text-[#1d1d1f] uppercase tracking-widest mb-6 border-b border-gray-50 pb-2">Configuração Global</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Master Switch */}
                        <div className="flex items-center justify-between p-4 bg-[#F9F9FA] rounded-xl border border-gray-50">
                            <span className="text-xs font-bold text-[#1d1d1f]">Exibir Seção no Site</span>
                            <ToggleSwitch 
                                checked={getFieldValue('section_visible') === 'true'} 
                                onChange={() => handleCmsUpdate('stats', sectionId, 'section_visible', getFieldValue('section_visible') === 'true' ? 'false' : 'true')}
                            />
                        </div>

                        {/* Real Data Switch */}
                        <div className="flex items-center justify-between p-4 bg-[#F9F9FA] rounded-xl border border-gray-50">
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-[#1d1d1f]">Somar Dados Reais</span>
                                <span className="text-[9px] text-gray-400">Soma contagem automática do banco</span>
                            </div>
                            <ToggleSwitch 
                                checked={getFieldValue('use_real_data') === 'true'} 
                                onChange={() => handleCmsUpdate('stats', sectionId, 'use_real_data', getFieldValue('use_real_data') === 'true' ? 'false' : 'true')}
                            />
                        </div>

                        {/* Years of Experience */}
                        <div className="md:col-span-2 flex flex-col sm:flex-row items-center gap-4 p-4 bg-[#F9F9FA] rounded-xl border border-gray-50">
                            <div className="w-full sm:flex-1 flex items-center justify-between sm:mr-4 sm:border-r border-gray-200 sm:pr-4 border-b sm:border-b-0 pb-4 sm:pb-0">
                                <span className="text-xs font-bold text-[#1d1d1f]">Exibir Anos de Experiência</span>
                                <ToggleSwitch 
                                    checked={getFieldValue('show_years') === 'true'} 
                                    onChange={() => handleCmsUpdate('stats', sectionId, 'show_years', getFieldValue('show_years') === 'true' ? 'false' : 'true')}
                                />
                            </div>
                            <div className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-2">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Anos:</span>
                                <input 
                                    type="number"
                                    value={getFieldValue('years_count')}
                                    onChange={(e) => handleCmsUpdate('stats', sectionId, 'years_count', e.target.value)}
                                    className="w-20 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-center outline-none focus:border-[#B8860B]"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Ordenação e Exibição dos Cards */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <div className="flex justify-between items-center mb-6 border-b border-gray-50 pb-2">
                        <h4 className="text-sm font-bold text-[#1d1d1f] uppercase tracking-widest">Cards de Estatísticas</h4>
                        <span className="text-[9px] text-gray-400 italic">Arraste para reordenar</span>
                    </div>

                    <div className="space-y-3">
                        {statsOrder.map((itemKey, index) => {
                            const config = itemsMap[itemKey];
                            if (!config) return null;

                            return (
                                <div 
                                    key={itemKey}
                                    draggable
                                    onDragStart={() => handleDragStart(index)}
                                    onDragOver={handleDragOver}
                                    onDrop={() => handleDrop(index)}
                                    className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-all cursor-move group"
                                >
                                    <div className="flex items-center gap-3 w-full sm:w-auto">
                                        <div className="text-gray-300 group-hover:text-[#1d1d1f] transition-colors cursor-grab shrink-0">
                                            <GripVertical size={20} />
                                        </div>
                                        
                                        <div className="flex-1 sm:flex-none">
                                            <p className="text-xs font-bold text-[#1d1d1f] uppercase tracking-wide">{config.label}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between gap-4 w-full sm:w-auto sm:ml-auto">
                                        <div className="flex items-center gap-2 bg-[#F9F9FA] px-3 py-1.5 rounded-lg border border-gray-100 flex-1 sm:flex-none justify-between sm:justify-start">
                                            <span className="text-[9px] font-bold text-gray-400 uppercase whitespace-nowrap">Base Manual:</span>
                                            <input 
                                                type="number"
                                                value={getFieldValue(config.inputKey)}
                                                onChange={(e) => handleCmsUpdate('stats', sectionId, config.inputKey, e.target.value)}
                                                className="w-20 bg-transparent text-sm font-medium text-right outline-none text-[#1d1d1f]"
                                            />
                                        </div>

                                        <div className="pl-4 border-l border-gray-100 shrink-0">
                                            <ToggleSwitch 
                                                checked={getFieldValue(config.toggleKey) === 'true'} 
                                                onChange={() => handleCmsUpdate('stats', sectionId, config.toggleKey, getFieldValue(config.toggleKey) === 'true' ? 'false' : 'true')}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6 animate-fade-in pb-32 md:pb-20"> {/* Aumentado padding-bottom para mobile footer */}
            
            {/* Header / Save Action */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                <div className="md:hidden"> {/* Oculto no Desktop para evitar duplicação com o título do Dashboard */}
                    <h3 className="text-xl font-serif font-bold text-[#1d1d1f]">Gerenciamento de Conteúdo</h3>
                    <p className="text-xs text-gray-400 mt-1">Edite textos, imagens e configurações das páginas.</p>
                </div>
                
                {/* DESKTOP BUTTON */}
                <button 
                    onClick={handleSaveCms} 
                    disabled={!isDirty || isProcessingImage}
                    className={`hidden md:flex px-6 py-3 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all items-center gap-2 shadow-lg ml-auto ${
                        isDirty 
                        ? 'bg-[#B8860B] text-white hover:bg-[#966d09] cursor-pointer' 
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                    }`}
                >
                    {isProcessingImage ? <Loader2 size={14} className="animate-spin"/> : <Save size={14}/>} 
                    {isProcessingImage ? 'Processando Imagem...' : isDirty ? 'Salvar Alterações' : 'Salvo'}
                </button>
            </div>

            {/* Content Editor Area */}
            <div className="w-full">
                {selectedPageId === 'stats' ? (
                    renderStatsPage()
                ) : (
                    // Generic Renderer for other pages (Institutional, Home, Contact, etc)
                    <div className="space-y-8 animate-fade-in">
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
                                                    <div className="flex-1 relative flex gap-2">
                                                        <div className="relative flex-1">
                                                            <ImageIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                                            <input 
                                                                type="text"
                                                                value={field.value}
                                                                onChange={(e) => handleCmsUpdate(selectedPageId, section.id, field.key, e.target.value)}
                                                                className="w-full pl-12 pr-4 py-3 bg-[#F5F5F7] border border-transparent rounded-xl text-sm outline-none focus:bg-white focus:border-[#B8860B] transition-all"
                                                                placeholder="https://..."
                                                            />
                                                        </div>
                                                        <label 
                                                            htmlFor={`upload-${section.id}-${field.key}`} 
                                                            className={`cursor-pointer bg-white border border-gray-200 text-gray-400 w-12 rounded-xl hover:border-[#B8860B] hover:text-[#B8860B] transition-all shadow-sm flex items-center justify-center shrink-0 group ${isProcessingImage ? 'opacity-50 cursor-wait' : ''}`}
                                                            title="Upload do Dispositivo"
                                                        >
                                                            {isProcessingImage ? (
                                                                <Loader2 size={18} className="animate-spin text-[#B8860B]" />
                                                            ) : (
                                                                <Upload size={18} strokeWidth={1.5} className="group-hover:scale-110 transition-transform" />
                                                            )}
                                                            <input 
                                                                id={`upload-${section.id}-${field.key}`}
                                                                type="file" 
                                                                className="hidden" 
                                                                accept="image/*,.heic,.heif"
                                                                onChange={(e) => handleFileChange(selectedPageId, section.id, field.key, e)}
                                                                disabled={isProcessingImage}
                                                            />
                                                        </label>
                                                    </div>
                                                    <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden shrink-0 shadow-sm relative group">
                                                        <img src={field.value} className="w-full h-full object-cover" onError={(e) => e.currentTarget.style.display = 'none'} />
                                                        <div className="absolute inset-0 border border-black/5 rounded-lg pointer-events-none"></div>
                                                    </div>
                                                </div>
                                            ) : field.type === 'boolean' ? (
                                                <div className="flex items-center justify-between p-3 bg-[#F9F9FA] rounded-xl border border-gray-50">
                                                    <span className="text-xs text-gray-600">{field.label}</span>
                                                    <ToggleSwitch 
                                                        checked={field.value === 'true'} 
                                                        onChange={() => handleCmsUpdate(selectedPageId, section.id, field.key, field.value === 'true' ? 'false' : 'true')}
                                                    />
                                                </div>
                                            ) : field.type === 'number' ? (
                                                <input 
                                                    type="number"
                                                    value={field.value}
                                                    onChange={(e) => handleCmsUpdate(selectedPageId, section.id, field.key, e.target.value)}
                                                    className="w-full px-4 py-3 bg-[#F5F5F7] border border-transparent rounded-xl text-sm outline-none focus:bg-white focus:border-[#B8860B] transition-all"
                                                />
                                            ) : (
                                                // Default Text Input (and specific logic for Icon, Phone, Email)
                                                field.key.includes('icon') ? (
                                                    <IconSelector 
                                                        value={field.value} 
                                                        onChange={(val) => handleCmsUpdate(selectedPageId, section.id, field.key, val)} 
                                                    />
                                                ) : field.key === 'phone' ? (
                                                    <div>
                                                        <input 
                                                            type="text"
                                                            value={field.value}
                                                            onChange={(e) => {
                                                                const formatted = e.target.value
                                                                    .replace(/\D/g, '')
                                                                    .replace(/^(\d{2})(\d)/g, '($1) $2')
                                                                    .replace(/(\d)(\d{4})$/, '$1-$2')
                                                                    .slice(0, 15);
                                                                handleCmsUpdate(selectedPageId, section.id, field.key, formatted);
                                                            }}
                                                            className={`w-full px-4 py-3 bg-[#F5F5F7] border rounded-xl text-sm outline-none transition-all ${
                                                                field.value && (
                                                                    field.value.replace(/\D/g, '').length < 10 || 
                                                                    (field.value.replace(/\D/g, '').length === 10 && field.value.replace(/\D/g, '')[2] === '9')
                                                                )
                                                                ? 'border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-200 text-red-600' 
                                                                : 'border-transparent focus:bg-white focus:border-[#B8860B]'
                                                            }`}
                                                            placeholder="(00) 00000-0000"
                                                            maxLength={15}
                                                        />
                                                        {field.value && (
                                                            field.value.replace(/\D/g, '').length < 10 || 
                                                            (field.value.replace(/\D/g, '').length === 10 && field.value.replace(/\D/g, '')[2] === '9')
                                                        ) && (
                                                            <p className="text-red-500 text-[10px] mt-1 font-bold uppercase tracking-wide flex items-center gap-1">
                                                                <AlertCircle size={10} /> Telefone incompleto
                                                            </p>
                                                        )}
                                                    </div>
                                                ) : field.key === 'email' ? (
                                                    <div>
                                                        <input 
                                                            type="email"
                                                            value={field.value}
                                                            onChange={(e) => handleCmsUpdate(selectedPageId, section.id, field.key, e.target.value)}
                                                            className={`w-full px-4 py-3 bg-[#F5F5F7] border rounded-xl text-sm outline-none focus:bg-white focus:border-[#B8860B] transition-all ${
                                                                field.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value) 
                                                                ? 'border-red-300 text-red-600 focus:ring-red-200' 
                                                                : 'border-transparent'
                                                            }`}
                                                            placeholder="email@exemplo.com"
                                                        />
                                                        {field.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value) && (
                                                            <p className="text-red-500 text-[10px] mt-1 font-bold uppercase tracking-wide flex items-center gap-1">
                                                                <AlertCircle size={10} /> Formato inválido
                                                            </p>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <input 
                                                        type="text"
                                                        value={field.value}
                                                        onChange={(e) => handleCmsUpdate(selectedPageId, section.id, field.key, e.target.value)}
                                                        className="w-full px-4 py-3 bg-[#F5F5F7] border border-transparent rounded-xl text-sm outline-none focus:bg-white focus:border-[#B8860B] transition-all"
                                                    />
                                                )
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* MOBILE STICKY SAVE BUTTON */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-40">
                <button 
                    onClick={handleSaveCms} 
                    disabled={!isDirty || isProcessingImage}
                    className={`w-full py-4 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg ${
                        isDirty 
                        ? 'bg-[#B8860B] text-white active:bg-[#966d09]' 
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                    }`}
                >
                    {isProcessingImage ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>} 
                    {isProcessingImage ? 'Processando...' : isDirty ? 'Salvar Alterações' : 'Salvo'}
                </button>
            </div>
        </div>
    );
};

export default AdminCMS;
