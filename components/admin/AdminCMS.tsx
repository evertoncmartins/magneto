
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Reorder, useDragControls } from 'framer-motion';
import { 
    Save, Image as ImageIcon, GripVertical, ChevronDown, Check, LayoutGrid, Upload, Loader2, Plus, Trash2, X,
    // Ícones Disponíveis para o CMS
    Leaf, Heart, Truck, Layers, Info, Star, Shield, Gift, Camera, Zap, Globe, MapPin, 
    Phone, Mail, Instagram, Facebook, Twitter, Award, Clock, Calendar, Search, 
    User, Users, Sun, Moon, Droplet, Smile, ThumbsUp, Send, Package, Tag, AlertCircle,
    Settings, ListOrdered, FileText, Recycle, Share2, RefreshCw, CheckCircle,
    Linkedin, Youtube, Github, Twitch, MessageCircle, Music, Video, Smartphone
} from 'lucide-react';
import { PageContent, PageField, PageSection } from '../../types';
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
    { id: 'CheckCircle', icon: CheckCircle },
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
    { id: 'Recycle', icon: Recycle },
    { id: 'Linkedin', icon: Linkedin },
    { id: 'Youtube', icon: Youtube },
    { id: 'Github', icon: Github },
    { id: 'Twitch', icon: Twitch },
    { id: 'MessageCircle', icon: MessageCircle },
    { id: 'Music', icon: Music },
    { id: 'Video', icon: Video },
    { id: 'Smartphone', icon: Smartphone },
];

const compressImage = async (file: File): Promise<string> => {
    let sourceFile = file;
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

const ToggleSwitch: React.FC<{ checked: boolean; onChange: () => void }> = ({ checked, onChange }) => (
    <div 
        onClick={onChange} 
        className={`w-10 h-5 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 shrink-0 ${checked ? 'bg-[#B8860B]' : 'bg-gray-300'}`}
    >
        <div className={`bg-white w-3 h-3 rounded-full shadow-md transform duration-300 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </div>
);

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
                            className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all duration-200 ${isSelected ? 'bg-white text-[#B8860B] shadow-md ring-1 ring-[#B8860B] scale-110' : 'text-gray-300 hover:text-gray-500 hover:bg-white hover:shadow-sm'}`}
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
                    <span className="text-[9px] font-bold text-[#B8860B] uppercase tracking-widest bg-[#B8860B]/5 px-2 py-0.5 rounded">{value}</span>
                )}
            </div>
        </div>
    );
};

const InlineIconPicker = ({ 
    onSelect, 
    currentIcon 
}: { 
    onSelect: (icon: string) => void; 
    currentIcon: string; 
}) => {
    return (
        <div className="cursor-default" onClick={e => e.stopPropagation()}>
            <div className="grid grid-cols-8 sm:grid-cols-12 gap-2 max-h-[140px] overflow-y-auto custom-scrollbar p-1">
                {AVAILABLE_ICONS.map(item => (
                    <button 
                        key={item.id}
                        onClick={() => onSelect(item.id)}
                        className={`aspect-square flex items-center justify-center rounded-md ${currentIcon === item.id ? 'bg-[#1d1d1f] text-white shadow-sm' : 'text-gray-400 hover:bg-white hover:text-[#B8860B] hover:shadow-sm'}`}
                        title={item.id}
                        type="button"
                    >
                        <item.icon size={16} strokeWidth={1.5} />
                    </button>
                ))}
            </div>
        </div>
    );
};

interface SocialSortableItemProps {
    itemKey: string;
    config: any;
    isCustom: boolean;
    section: PageSection;
    pageId: string;
    handleCmsUpdate: (pageId: string, sectionId: string, fieldKey: string, value: string) => void;
    handleDeleteSocial: (key: string) => void;
    editingIconKey: string | null;
    setEditingIconKey: (key: string | null) => void;
    handleIconUpdate: (key: string, icon: string) => void;
    handleLabelUpdate: (key: string, label: string) => void;
    getVal: (key: string) => string;
}

const SocialSortableItem = ({
    itemKey, config, isCustom, section, pageId,
    handleCmsUpdate, handleDeleteSocial, editingIconKey,
    setEditingIconKey, handleIconUpdate, handleLabelUpdate, getVal
}: SocialSortableItemProps) => {
    const controls = useDragControls();
    const isEditing = editingIconKey === itemKey;

    const iconOverrideField = section.fields.find(f => f.key === `${itemKey}_icon`);
    const IconComp = iconOverrideField ? (AVAILABLE_ICONS.find(i => i.id === iconOverrideField.value)?.icon || Globe) : config.icon;
    const currentIconId = iconOverrideField ? iconOverrideField.value : (AVAILABLE_ICONS.find(i => i.icon === config.icon)?.id || 'Globe');

    const labelField = section.fields.find(f => f.key === `${itemKey}_label`);
    const currentLabel = labelField ? labelField.value : config.label;

    return (
        <Reorder.Item
            value={itemKey}
            layout="position"
            dragListener={false}
            dragControls={controls}
            className={`bg-white border border-gray-200 rounded-xl transition-all group relative overflow-hidden mb-3 ${isEditing ? 'ring-1 ring-[#B8860B] shadow-md' : 'hover:shadow-md'}`}
        >
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4">
                <div className="flex items-center gap-3 w-full sm:w-auto flex-1 sm:flex-none">
                    <div 
                        onPointerDown={(e) => !isEditing && controls.start(e)}
                        className={`text-gray-300 transition-colors shrink-0 touch-none ${isEditing ? 'opacity-30 cursor-not-allowed' : 'group-hover:text-[#1d1d1f] cursor-grab'}`}
                    >
                        <GripVertical size={20} />
                    </div>
                    
                    <div className="relative shrink-0">
                        <div 
                            onClick={() => setEditingIconKey(isEditing ? null : itemKey)}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${isEditing ? 'bg-[#1d1d1f] text-white' : 'bg-gray-100 text-[#1d1d1f] hover:bg-[#B8860B] hover:text-white'}`}
                            title="Clique para alterar o ícone"
                        >
                            <IconComp size={16} />
                        </div>
                    </div>

                    <div className="flex-1 min-w-[120px]">
                        <input 
                            type="text" 
                            value={currentLabel} 
                            onChange={(e) => handleLabelUpdate(itemKey, e.target.value)}
                            className="text-xs font-bold text-[#1d1d1f] uppercase tracking-wide bg-transparent border-b border-transparent hover:border-gray-200 focus:border-[#B8860B] outline-none w-full py-1"
                            placeholder="Nome da Rede"
                        />
                    </div>
                </div>
                <div className="flex items-center justify-between gap-4 w-full sm:w-auto sm:ml-auto">
                    <div className="flex items-center gap-2 bg-[#F9F9FA] px-3 py-1.5 rounded-lg border border-gray-100 flex-1 sm:flex-none w-full sm:w-64">
                        <span className="text-[9px] font-bold text-gray-400 uppercase whitespace-nowrap">URL:</span>
                        <input type="text" value={getVal(config.urlKey)} onChange={(e) => handleCmsUpdate(pageId, section.id, config.urlKey, e.target.value)} className="w-full bg-transparent text-sm outline-none text-[#1d1d1f]" placeholder="https://..." />
                    </div>
                    <div className="pl-4 border-l border-gray-100 shrink-0 flex items-center gap-3">
                        <ToggleSwitch checked={getVal(config.toggleKey) === 'true'} onChange={() => handleCmsUpdate(pageId, section.id, config.toggleKey, getVal(config.toggleKey) === 'true' ? 'false' : 'true')} />
                        {isCustom && (
                            <button onClick={() => handleDeleteSocial(itemKey)} className="text-gray-300 hover:text-red-500 transition-colors" title="Remover">
                                <Trash2 size={16} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {isEditing && (
                <div className="bg-gray-50/80 border-t border-gray-100 p-4">
                    <InlineIconPicker 
                        onSelect={(val) => handleIconUpdate(itemKey, val)}
                        currentIcon={currentIconId}
                    />
                </div>
            )}
        </Reorder.Item>
    );
};

interface ContactSortableItemProps {
    itemKey: string;
    config: any;
    section: PageSection;
    pageId: string;
    handleCmsUpdate: (pageId: string, sectionId: string, fieldKey: string, value: string) => void;
    editingIconKey: string | null;
    setEditingIconKey: (key: string | null) => void;
    handleIconUpdate: (key: string, icon: string) => void;
    getVal: (key: string) => string;
}

const ContactSortableItem = ({
    itemKey, config, section, pageId,
    handleCmsUpdate, editingIconKey,
    setEditingIconKey, handleIconUpdate, getVal
}: ContactSortableItemProps) => {
    const controls = useDragControls();
    const isEditing = editingIconKey === itemKey;

    const iconOverrideField = section.fields.find(f => f.key === `${itemKey}_icon`);
    const IconComp = iconOverrideField ? (AVAILABLE_ICONS.find(i => i.id === iconOverrideField.value)?.icon || Globe) : config.icon;
    const currentIconId = iconOverrideField ? iconOverrideField.value : (AVAILABLE_ICONS.find(i => i.icon === config.icon)?.id || 'Globe');
    
    // Default to true if field doesn't exist yet
    const isVisible = getVal(config.toggleKey) !== 'false';

    return (
        <Reorder.Item
            value={itemKey}
            layout="position"
            dragListener={false}
            dragControls={controls}
            className={`bg-white border border-gray-200 rounded-xl transition-all group relative overflow-hidden mb-3 ${isEditing ? 'ring-1 ring-[#B8860B] shadow-md' : 'hover:shadow-md'}`}
        >
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div 
                        onPointerDown={(e) => !isEditing && controls.start(e)}
                        className={`text-gray-300 transition-colors shrink-0 touch-none ${isEditing ? 'opacity-30 cursor-not-allowed' : 'group-hover:text-[#1d1d1f] cursor-grab'}`}
                    >
                        <GripVertical size={20} />
                    </div>
                    
                    <div className="relative">
                        <div 
                            onClick={() => setEditingIconKey(isEditing ? null : itemKey)}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${isEditing ? 'bg-[#1d1d1f] text-white' : 'bg-gray-100 text-[#1d1d1f] hover:bg-[#B8860B] hover:text-white'}`}
                            title="Clique para alterar o ícone"
                        >
                            <IconComp size={16} />
                        </div>
                    </div>

                    <div className="flex-1 sm:flex-none"><p className="text-xs font-bold text-[#1d1d1f] uppercase tracking-wide">{config.label}</p></div>
                </div>
                <div className="flex items-center justify-between gap-4 w-full sm:w-auto sm:ml-auto">
                    <div className="flex-1 sm:flex-none w-full sm:w-96">
                        {itemKey === 'company_info' ? (
                             <textarea 
                                value={getVal(config.valueKey)} 
                                onChange={(e) => handleCmsUpdate(pageId, section.id, config.valueKey, e.target.value)} 
                                className="w-full p-3 bg-[#F9F9FA] border border-gray-100 rounded-lg text-sm outline-none focus:border-[#B8860B] min-h-[80px] resize-y"
                                placeholder="Conteúdo..."
                            />
                        ) : (
                            <input 
                                type="text" 
                                value={getVal(config.valueKey)} 
                                onChange={(e) => handleCmsUpdate(pageId, section.id, config.valueKey, e.target.value)} 
                                className="w-full px-3 py-2 bg-[#F9F9FA] border border-gray-100 rounded-lg text-sm outline-none focus:border-[#B8860B]" 
                                placeholder="Conteúdo..." 
                            />
                        )}
                    </div>
                    <div className="pl-4 border-l border-gray-100 shrink-0 flex items-center gap-3">
                         <ToggleSwitch checked={isVisible} onChange={() => handleCmsUpdate(pageId, section.id, config.toggleKey, isVisible ? 'false' : 'true')} />
                    </div>
                </div>
            </div>

            {isEditing && (
                <div className="bg-gray-50/80 border-t border-gray-100 p-4">
                    <InlineIconPicker 
                        onSelect={(val) => handleIconUpdate(itemKey, val)}
                        currentIcon={currentIconId}
                    />
                </div>
            )}
        </Reorder.Item>
    );
};

const AdminCMS: React.FC<AdminCMSProps> = ({ cmsContent, setCmsContent, initialPageId }) => {
    const [selectedPageId, setSelectedPageId] = useState<string>(initialPageId);
    const [isDirty, setIsDirty] = useState(false);
    const [isProcessingImage, setIsProcessingImage] = useState(false);
    
    // Estado local para DnD da seção de Stats
    const [statsOrder, setStatsOrder] = useState<string[]>([]);
    const [socialOrder, setSocialOrder] = useState<string[]>([]);
    const [contactOrder, setContactOrder] = useState<string[]>([]);
    const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);

    // Estado para nova rede social
    const [isAddingSocial, setIsAddingSocial] = useState(false);
    const [newSocialName, setNewSocialName] = useState('');
    const [newSocialIcon, setNewSocialIcon] = useState('Globe');
    
    // Estado para edição de ícone de rede social existente
    const [editingIconKey, setEditingIconKey] = useState<string | null>(null);

    // Estado para exclusão de seção da Política de Privacidade
    const [privacySectionToDelete, setPrivacySectionToDelete] = useState<number | null>(null);

    // Estado para exclusão de seção dos Termos de Uso
    const [termsSectionToDelete, setTermsSectionToDelete] = useState<number | null>(null);

    // Estado para exclusão de seção da Política de Troca
    const [exchangeSectionToDelete, setExchangeSectionToDelete] = useState<number | null>(null);

    // Estado para exclusão de seção de Envios
    const [shippingSectionToDelete, setShippingSectionToDelete] = useState<number | null>(null);

    // Estado para exclusão de ponto sustentável
    const [sustainabilityPointToDelete, setSustainabilityPointToDelete] = useState<number | null>(null);

    useEffect(() => {
        setSelectedPageId(initialPageId);
    }, [initialPageId]);

    useEffect(() => {
        setIsDirty(false);
    }, [selectedPageId]);

    useEffect(() => {
        if (selectedPageId === 'stats') {
            const statsPage = cmsContent.find(p => p.id === 'stats');
            const configSection = statsPage?.sections.find(s => s.id === 'config');
            const orderField = configSection?.fields.find(f => f.key === 'stats_order');
            setStatsOrder(orderField ? orderField.value.split(',').filter(Boolean) : ['orders', 'magnets', 'reviews']);
        } else if (selectedPageId === 'footer') {
            const footerPage = cmsContent.find(p => p.id === 'footer');
            const socialSection = footerPage?.sections.find(s => s.id === 'social');
            const orderField = socialSection?.fields.find(f => f.key === 'social_order');
            setSocialOrder(orderField ? orderField.value.split(',').filter(Boolean) : ['instagram', 'facebook', 'twitter']);
        } else if (selectedPageId === 'contact') {
            const contactPage = cmsContent.find(p => p.id === 'contact');
            const infoSection = contactPage?.sections.find(s => s.id === 'info');
            const orderField = infoSection?.fields.find(f => f.key === 'contact_order');
            setContactOrder(orderField ? orderField.value.split(',').filter(Boolean) : ['hours', 'email', 'phone', 'address', 'company_info']);
        }
    }, [selectedPageId, cmsContent]); 

    const handleCmsUpdate = (pageId: string, sectionId: string, fieldKey: string, value: string) => {
        const newContent = cmsContent.map(page => {
            if (page.id === pageId) {
                return {
                    ...page,
                    sections: page.sections.map(section => {
                        if (section.id === sectionId) {
                            return { ...section, fields: section.fields.map(field => field.key === fieldKey ? { ...field, value } : field) };
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

    const handleFileChange = async (pageId: string, sectionId: string, fieldKey: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsProcessingImage(true);
            try {
                const compressedBase64 = await compressImage(file);
                handleCmsUpdate(pageId, sectionId, fieldKey, compressedBase64);
            } catch (error) {
                alert("Erro ao processar a imagem.");
            } finally {
                setIsProcessingImage(false);
            }
        }
        e.target.value = '';
    };

    const handleSaveCms = () => {
        updateSiteContent(cmsContent);
        setIsDirty(false);
    };

    const handleAddSocial = () => {
        if (!newSocialName) return;
        
        const key = newSocialName.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const pageId = 'footer';
        const sectionId = 'social';
        
        if (socialOrder.includes(key)) {
            alert('Essa rede social já existe.');
            return;
        }

        const newFields: PageField[] = [
            { key: `${key}_url`, label: `${newSocialName} URL`, type: 'text', value: '' },
            { key: `${key}_visible`, label: `${newSocialName} Visível`, type: 'boolean', value: 'true' },
            { key: `${key}_icon`, label: `${newSocialName} Ícone`, type: 'text', value: newSocialIcon },
            { key: `${key}_label`, label: `${newSocialName} Nome`, type: 'text', value: newSocialName }
        ];

        const newContent = cmsContent.map(page => {
            if (page.id === pageId) {
                return {
                    ...page,
                    sections: page.sections.map(section => {
                        if (section.id === sectionId) {
                            const updatedFields = [...section.fields, ...newFields];
                            const orderField = updatedFields.find(f => f.key === 'social_order');
                            const newOrder = [...socialOrder, key];
                            if (orderField) {
                                orderField.value = newOrder.join(',');
                            } else {
                                updatedFields.push({ key: 'social_order', label: 'Ordem', type: 'text', value: newOrder.join(',') });
                            }
                            return { ...section, fields: updatedFields };
                        }
                        return section;
                    })
                };
            }
            return page;
        });

        setCmsContent(newContent);
        setSocialOrder([...socialOrder, key]);
        setIsDirty(true);
        setIsAddingSocial(false);
        setNewSocialName('');
        setNewSocialIcon('Globe');
    };

    const handleDeleteSocial = (key: string) => {
        if (confirm('Tem certeza que deseja remover esta rede social?')) {
             const pageId = 'footer';
             const sectionId = 'social';
             
             const newContent = cmsContent.map(page => {
                if (page.id === pageId) {
                    return {
                        ...page,
                        sections: page.sections.map(section => {
                            if (section.id === sectionId) {
                                const updatedFields = section.fields.filter(f => !f.key.startsWith(`${key}_`));
                                const orderField = updatedFields.find(f => f.key === 'social_order');
                                const newOrder = socialOrder.filter(k => k !== key);
                                if (orderField) {
                                    orderField.value = newOrder.join(',');
                                }
                                return { ...section, fields: updatedFields };
                            }
                            return section;
                        })
                    };
                }
                return page;
            });
            
            setCmsContent(newContent);
            setSocialOrder(socialOrder.filter(k => k !== key));
            setIsDirty(true);
        }
    };

    // Helper para campos genéricos
    const renderField = (pageId: string, sectionId: string, field: PageField) => {
        return (
            <div key={field.key} className="space-y-2">
                <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-[#1d1d1f] uppercase tracking-widest flex items-center gap-1.5">
                        {field.type === 'image' && <ImageIcon size={10} className="text-[#B8860B]"/>}
                        {field.key.includes('icon') && <Settings size={10} className="text-[#B8860B]"/>}
                        {field.label}
                    </label>
                    {field.type === 'image' && (
                        <span className="text-[9px] text-[#B8860B] font-bold uppercase cursor-pointer hover:underline" onClick={() => window.open(field.value, '_blank')}>Abrir em nova aba</span>
                    )}
                </div>
                
                {field.type === 'textarea' ? (
                    <textarea 
                        value={field.value}
                        onChange={(e) => handleCmsUpdate(pageId, sectionId, field.key, e.target.value)}
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
                                    onChange={(e) => handleCmsUpdate(pageId, sectionId, field.key, e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-[#F5F5F7] border border-transparent rounded-xl text-sm outline-none focus:bg-white focus:border-[#B8860B] transition-all"
                                    placeholder="https://..."
                                />
                            </div>
                            <label 
                                htmlFor={`upload-${sectionId}-${field.key}`} 
                                className={`cursor-pointer bg-white border border-gray-200 text-gray-400 w-12 rounded-xl hover:border-[#B8860B] hover:text-[#B8860B] transition-all shadow-sm flex items-center justify-center shrink-0 group ${isProcessingImage ? 'opacity-50 cursor-wait' : ''}`}
                                title="Upload do Dispositivo"
                            >
                                {isProcessingImage ? <Loader2 size={18} className="animate-spin text-[#B8860B]" /> : <Upload size={18} strokeWidth={1.5} className="group-hover:scale-110 transition-transform" />}
                                <input id={`upload-${sectionId}-${field.key}`} type="file" className="hidden" accept="image/*,.heic,.heif" onChange={(e) => handleFileChange(pageId, sectionId, field.key, e)} disabled={isProcessingImage} />
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
                        <ToggleSwitch checked={field.value === 'true'} onChange={() => handleCmsUpdate(pageId, sectionId, field.key, field.value === 'true' ? 'false' : 'true')} />
                    </div>
                ) : field.key.includes('icon') ? (
                    <IconSelector value={field.value} onChange={(val) => handleCmsUpdate(pageId, sectionId, field.key, val)} />
                ) : (
                    <input 
                        type={field.type === 'number' ? 'number' : 'text'}
                        value={field.value}
                        onChange={(e) => handleCmsUpdate(pageId, sectionId, field.key, e.target.value)}
                        className="w-full px-4 py-3 bg-[#F5F5F7] border border-transparent rounded-xl text-sm outline-none focus:bg-white focus:border-[#B8860B] transition-all"
                    />
                )}
            </div>
        );
    };

    // Renderização Especial para Termos de Uso
    const renderTermsOfUse = (pageId: string, section: PageSection) => {
        const intro = section.fields.find(f => f.key === 'intro');
        const highlight = section.fields.find(f => f.key === 'highlight');
        
        // Agrupa campos por seção (section_1_, section_2_, etc.)
        const sectionsMap = new Map<number, PageField[]>();
        
        section.fields.forEach(field => {
            const match = field.key.match(/^section_(\d+)_/);
            if (match) {
                const sectionNum = parseInt(match[1]);
                const currentFields = sectionsMap.get(sectionNum) || [];
                currentFields.push(field);
                sectionsMap.set(sectionNum, currentFields);
            }
        });

        // Converte para array e ordena
        const sortedSections = Array.from(sectionsMap.entries())
            .sort((a, b) => a[0] - b[0])
            .map(([num, fields]) => ({ num, fields }));

        const handleAddSection = () => {
            const nextNum = sortedSections.length > 0 
                ? Math.max(...sortedSections.map(s => s.num)) + 1 
                : 1;
            
            const newFields: PageField[] = [
                { key: `section_${nextNum}_title`, label: `Seção ${nextNum}: Título`, type: 'text', value: `Nova Seção ${nextNum}` },
                { key: `section_${nextNum}_text`, label: `Seção ${nextNum}: Texto`, type: 'textarea', value: '' }
            ];

            const newContent = cmsContent.map(page => {
                if (page.id === pageId) {
                    return {
                        ...page,
                        sections: page.sections.map(sec => {
                            if (sec.id === section.id) {
                                return { ...sec, fields: [...sec.fields, ...newFields] };
                            }
                            return sec;
                        })
                    };
                }
                return page;
            });
            
            setCmsContent(newContent);
            setIsDirty(true);
        };

        const confirmRemoveSection = () => {
             if (termsSectionToDelete === null) return;

             const newContent = cmsContent.map(page => {
                if (page.id === pageId) {
                    return {
                        ...page,
                        sections: page.sections.map(sec => {
                            if (sec.id === section.id) {
                                return { 
                                    ...sec, 
                                    fields: sec.fields.filter(f => !f.key.startsWith(`section_${termsSectionToDelete}_`)) 
                                };
                            }
                            return sec;
                        })
                    };
                }
                return page;
            });
            
            setCmsContent(newContent);
            setIsDirty(true);
            setTermsSectionToDelete(null);
        }

        return (
            <div className="space-y-8">
                {/* Introdução */}
                {intro && (
                    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                        <div className="px-6 py-4 bg-[#F9F9FA] border-b border-gray-100 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#1d1d1f] text-[#B8860B] flex items-center justify-center font-bold text-xs shadow-sm">
                                <Info size={16} />
                            </div>
                            <h4 className="font-serif font-bold text-base text-[#1d1d1f]">Introdução</h4>
                        </div>
                        <div className="p-6">
                            {renderField(pageId, section.id, intro)}
                        </div>
                    </div>
                )}

                {/* Seções Dinâmicas */}
                {sortedSections.map(({ num, fields }) => (
                    <div key={num} className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden group relative">
                        <div className="px-6 py-4 bg-[#F9F9FA] border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-[#1d1d1f] text-[#B8860B] flex items-center justify-center font-bold text-xs shadow-sm">
                                    {num.toString().padStart(2, '0')}
                                </div>
                                <h4 className="font-serif font-bold text-base text-[#1d1d1f]">Seção {num}</h4>
                            </div>
                            <button 
                                onClick={() => setTermsSectionToDelete(num)}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                title="Remover Seção"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            {fields.map(field => renderField(pageId, section.id, field))}
                            
                            {/* Highlight (apenas na seção 2, se existir) */}
                            {num === 2 && highlight && (
                                <div className="mt-6 pt-6 border-t border-gray-100">
                                    <div className="mb-4 flex items-center gap-2 text-red-500">
                                        <AlertCircle size={16} />
                                        <span className="text-xs font-bold uppercase tracking-widest">Destaque (Proibido)</span>
                                    </div>
                                    {renderField(pageId, section.id, highlight)}
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {/* Botão Adicionar Seção */}
                <button 
                    onClick={handleAddSection}
                    className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center gap-2 text-gray-400 hover:border-[#B8860B] hover:text-[#B8860B] hover:bg-[#B8860B]/5 transition-all group"
                >
                    <div className="w-8 h-8 rounded-full bg-gray-100 group-hover:bg-[#B8860B] text-gray-400 group-hover:text-white flex items-center justify-center transition-colors">
                        <Plus size={16} />
                    </div>
                    <span className="text-sm font-bold uppercase tracking-widest">Adicionar Nova Seção</span>
                </button>

                {/* Modal de Confirmação de Exclusão */}
                {termsSectionToDelete !== null && createPortal(
                    <div className="fixed inset-0 z-[9999] bg-white animate-fade-in flex flex-col items-center justify-center">
                        <div className="absolute top-6 right-6">
                             <button 
                                onClick={() => setTermsSectionToDelete(null)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        
                        <div className="max-w-md w-full p-8 text-center">
                            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
                                <Trash2 size={32} />
                            </div>
                            <h3 className="text-2xl font-serif font-bold text-[#1d1d1f] mb-2">
                                Excluir Seção {termsSectionToDelete}?
                            </h3>
                            <p className="text-gray-500 mb-8">
                                Esta ação não pode ser desfeita. Todo o conteúdo desta seção será perdido permanentemente.
                            </p>
                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={() => setTermsSectionToDelete(null)}
                                    className="py-3 px-6 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors min-w-[120px]"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmRemoveSection}
                                    className="py-3 px-6 bg-red-500 text-white font-medium rounded-xl hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20 min-w-[120px]"
                                >
                                    Sim, Excluir
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}
            </div>
        );
    };

    // Renderização Especial para Política de Privacidade
    const renderPrivacyPolicy = (pageId: string, section: PageSection) => {
        const highlight = section.fields.find(f => f.key === 'highlight');
        
        // Agrupa campos por seção (section_1_, section_2_, etc.)
        const sectionsMap = new Map<number, PageField[]>();
        
        section.fields.forEach(field => {
            const match = field.key.match(/^section_(\d+)_/);
            if (match) {
                const sectionNum = parseInt(match[1]);
                const currentFields = sectionsMap.get(sectionNum) || [];
                currentFields.push(field);
                sectionsMap.set(sectionNum, currentFields);
            }
        });

        // Converte para array e ordena
        const sortedSections = Array.from(sectionsMap.entries())
            .sort((a, b) => a[0] - b[0])
            .map(([num, fields]) => ({ num, fields }));

        const handleAddSection = () => {
            const nextNum = sortedSections.length > 0 
                ? Math.max(...sortedSections.map(s => s.num)) + 1 
                : 1;
            
            const newFields: PageField[] = [
                { key: `section_${nextNum}_title`, label: `Seção ${nextNum}: Título`, type: 'text', value: `Nova Seção ${nextNum}` },
                { key: `section_${nextNum}_text`, label: `Seção ${nextNum}: Texto`, type: 'textarea', value: '' }
            ];

            const newContent = cmsContent.map(page => {
                if (page.id === pageId) {
                    return {
                        ...page,
                        sections: page.sections.map(sec => {
                            if (sec.id === section.id) {
                                return { ...sec, fields: [...sec.fields, ...newFields] };
                            }
                            return sec;
                        })
                    };
                }
                return page;
            });
            
            setCmsContent(newContent);
            setIsDirty(true);
        };

        const confirmRemoveSection = () => {
             if (privacySectionToDelete === null) return;

             const newContent = cmsContent.map(page => {
                if (page.id === pageId) {
                    return {
                        ...page,
                        sections: page.sections.map(sec => {
                            if (sec.id === section.id) {
                                return { 
                                    ...sec, 
                                    fields: sec.fields.filter(f => !f.key.startsWith(`section_${privacySectionToDelete}_`)) 
                                };
                            }
                            return sec;
                        })
                    };
                }
                return page;
            });
            
            setCmsContent(newContent);
            setIsDirty(true);
            setPrivacySectionToDelete(null);
        }

        return (
            <div className="space-y-8">
                {/* Destaque Inicial */}
                {highlight && (
                    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                        <div className="px-6 py-4 bg-[#F9F9FA] border-b border-gray-100 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#1d1d1f] text-[#B8860B] flex items-center justify-center font-bold text-xs shadow-sm">
                                <Shield size={16} />
                            </div>
                            <h4 className="font-serif font-bold text-base text-[#1d1d1f]">Destaque Inicial</h4>
                        </div>
                        <div className="p-6">
                            {renderField(pageId, section.id, highlight)}
                        </div>
                    </div>
                )}

                {/* Seções Dinâmicas */}
                {sortedSections.map(({ num, fields }) => (
                    <div key={num} className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden group relative">
                        <div className="px-6 py-4 bg-[#F9F9FA] border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-[#1d1d1f] text-[#B8860B] flex items-center justify-center font-bold text-xs shadow-sm">
                                    {num.toString().padStart(2, '0')}
                                </div>
                                <h4 className="font-serif font-bold text-base text-[#1d1d1f]">Seção {num}</h4>
                            </div>
                            <button 
                                onClick={() => setPrivacySectionToDelete(num)}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                title="Remover Seção"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            {fields.map(field => renderField(pageId, section.id, field))}
                        </div>
                    </div>
                ))}

                {/* Botão Adicionar Seção */}
                <button 
                    onClick={handleAddSection}
                    className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center gap-2 text-gray-400 hover:border-[#B8860B] hover:text-[#B8860B] hover:bg-[#B8860B]/5 transition-all group"
                >
                    <div className="w-8 h-8 rounded-full bg-gray-100 group-hover:bg-[#B8860B] text-gray-400 group-hover:text-white flex items-center justify-center transition-colors">
                        <Plus size={16} />
                    </div>
                    <span className="text-sm font-bold uppercase tracking-widest">Adicionar Nova Seção</span>
                </button>

                {/* Modal de Confirmação de Exclusão */}
                {privacySectionToDelete !== null && createPortal(
                    <div className="fixed inset-0 z-[9999] bg-white animate-fade-in flex flex-col items-center justify-center">
                        <div className="absolute top-6 right-6">
                             <button 
                                onClick={() => setPrivacySectionToDelete(null)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        
                        <div className="max-w-md w-full p-8 text-center">
                            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
                                <Trash2 size={32} />
                            </div>
                            <h3 className="text-2xl font-serif font-bold text-[#1d1d1f] mb-2">
                                Excluir Seção {privacySectionToDelete}?
                            </h3>
                            <p className="text-gray-500 mb-8">
                                Esta ação não pode ser desfeita. Todo o conteúdo desta seção será perdido permanentemente.
                            </p>
                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={() => setPrivacySectionToDelete(null)}
                                    className="py-3 px-6 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors min-w-[120px]"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmRemoveSection}
                                    className="py-3 px-6 bg-red-500 text-white font-medium rounded-xl hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20 min-w-[120px]"
                                >
                                    Sim, Excluir
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}
            </div>
        );
    };

    // Renderização Especial para Política de Troca
    const renderExchangePolicy = (pageId: string, section: PageSection) => {
        const highlight = section.fields.find(f => f.key === 'highlight');
        
        // Agrupa campos por seção (section_1_, section_2_, etc.)
        const sectionsMap = new Map<number, PageField[]>();
        
        section.fields.forEach(field => {
            const match = field.key.match(/^section_(\d+)_/);
            if (match) {
                const sectionNum = parseInt(match[1]);
                const currentFields = sectionsMap.get(sectionNum) || [];
                currentFields.push(field);
                sectionsMap.set(sectionNum, currentFields);
            }
        });

        // Converte para array e ordena
        const sortedSections = Array.from(sectionsMap.entries())
            .sort((a, b) => a[0] - b[0])
            .map(([num, fields]) => ({ num, fields }));

        // Campos Info (info_1_, info_2_)
        const infoFields = section.fields.filter(f => f.key.startsWith('info_'));

        const handleAddSection = () => {
            const nextNum = sortedSections.length > 0 
                ? Math.max(...sortedSections.map(s => s.num)) + 1 
                : 1;
            
            const newFields: PageField[] = [
                { key: `section_${nextNum}_title`, label: `Seção ${nextNum}: Título`, type: 'text', value: `Nova Seção ${nextNum}` },
                { key: `section_${nextNum}_text`, label: `Seção ${nextNum}: Texto`, type: 'textarea', value: '' }
            ];

            const newContent = cmsContent.map(page => {
                if (page.id === pageId) {
                    return {
                        ...page,
                        sections: page.sections.map(sec => {
                            if (sec.id === section.id) {
                                return { ...sec, fields: [...sec.fields, ...newFields] };
                            }
                            return sec;
                        })
                    };
                }
                return page;
            });
            
            setCmsContent(newContent);
            setIsDirty(true);
        };

        const confirmRemoveSection = () => {
             if (exchangeSectionToDelete === null) return;

             const newContent = cmsContent.map(page => {
                if (page.id === pageId) {
                    return {
                        ...page,
                        sections: page.sections.map(sec => {
                            if (sec.id === section.id) {
                                return { 
                                    ...sec, 
                                    fields: sec.fields.filter(f => !f.key.startsWith(`section_${exchangeSectionToDelete}_`)) 
                                };
                            }
                            return sec;
                        })
                    };
                }
                return page;
            });
            
            setCmsContent(newContent);
            setIsDirty(true);
            setExchangeSectionToDelete(null);
        }

        return (
            <div className="space-y-8">
                {/* Destaque Inicial */}
                {highlight && (
                    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                        <div className="px-6 py-4 bg-[#F9F9FA] border-b border-gray-100 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#1d1d1f] text-[#B8860B] flex items-center justify-center font-bold text-xs shadow-sm">
                                <Shield size={16} />
                            </div>
                            <h4 className="font-serif font-bold text-base text-[#1d1d1f]">Destaque Inicial</h4>
                        </div>
                        <div className="p-6">
                            {renderField(pageId, section.id, highlight)}
                        </div>
                    </div>
                )}

                {/* Seções Dinâmicas */}
                {sortedSections.map(({ num, fields }) => (
                    <div key={num} className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden group relative">
                        <div className="px-6 py-4 bg-[#F9F9FA] border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-[#1d1d1f] text-[#B8860B] flex items-center justify-center font-bold text-xs shadow-sm">
                                    {num.toString().padStart(2, '0')}
                                </div>
                                <h4 className="font-serif font-bold text-base text-[#1d1d1f]">Seção {num}</h4>
                            </div>
                            <button 
                                onClick={() => setExchangeSectionToDelete(num)}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                title="Remover Seção"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            {fields.map(field => renderField(pageId, section.id, field))}
                            
                            {/* Informações Adicionais (apenas na seção 2, se existir) */}
                            {num === 2 && (
                                <div className="mt-6 pt-6 border-t border-gray-100">
                                    <div className="mb-4 flex items-center gap-2 text-[#B8860B]">
                                        <Info size={16} />
                                        <span className="text-xs font-bold uppercase tracking-widest">Informações Adicionais (Box)</span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {[1, 2].map(boxNum => {
                                            const titleKey = `info_${boxNum}_title`;
                                            const descKey = `info_${boxNum}_desc`;
                                            const iconKey = `info_${boxNum}_icon`;

                                            const titleField = section.fields.find(f => f.key === titleKey);
                                            const descField = section.fields.find(f => f.key === descKey);
                                            const iconField = section.fields.find(f => f.key === iconKey);

                                            if (!titleField || !descField || !iconField) return null;

                                            const IconComp = AVAILABLE_ICONS.find(i => i.id === iconField.value)?.icon || Globe;
                                            const isEditing = editingIconKey === iconKey;

                                            return (
                                                <div key={boxNum} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm relative group">
                                                    <div className="flex flex-col gap-4">
                                                        <div className="flex items-center gap-4">
                                                            {/* Icon Picker Trigger */}
                                                            <div className="relative">
                                                                <div 
                                                                    onClick={() => setEditingIconKey(isEditing ? null : iconKey)}
                                                                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors cursor-pointer ${isEditing ? 'bg-[#1d1d1f] text-white' : 'bg-gray-100 text-[#1d1d1f] hover:bg-[#B8860B] hover:text-white'}`}
                                                                    title="Clique para alterar o ícone"
                                                                >
                                                                    <IconComp size={24} strokeWidth={1.5} />
                                                                </div>
                                                            </div>
                                                            
                                                            {/* Title Input */}
                                                            <div className="flex-1">
                                                                <label className="text-[10px] font-bold text-[#1d1d1f] uppercase tracking-widest mb-1 block">
                                                                    {titleField.label}
                                                                </label>
                                                                <input 
                                                                    type="text"
                                                                    value={titleField.value}
                                                                    onChange={(e) => handleCmsUpdate(pageId, section.id, titleKey, e.target.value)}
                                                                    className="w-full px-3 py-2 bg-[#F9F9FA] border border-gray-100 rounded-lg text-sm outline-none focus:border-[#B8860B]"
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Description Input */}
                                                        <div>
                                                            <label className="text-[10px] font-bold text-[#1d1d1f] uppercase tracking-widest mb-1 block">
                                                                {descField.label}
                                                            </label>
                                                            <textarea 
                                                                value={descField.value}
                                                                onChange={(e) => handleCmsUpdate(pageId, section.id, descKey, e.target.value)}
                                                                className="w-full p-3 bg-[#F9F9FA] border border-gray-100 rounded-lg text-sm outline-none focus:border-[#B8860B] min-h-[80px] resize-y"
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Inline Picker */}
                                                    {isEditing && (
                                                        <div className="mt-4 pt-4 border-t border-gray-100">
                                                            <InlineIconPicker 
                                                                onSelect={(val) => {
                                                                    handleCmsUpdate(pageId, section.id, iconKey, val);
                                                                    setEditingIconKey(null);
                                                                }}
                                                                currentIcon={iconField.value}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {/* Botão Adicionar Seção */}
                <button 
                    onClick={handleAddSection}
                    className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center gap-2 text-gray-400 hover:border-[#B8860B] hover:text-[#B8860B] hover:bg-[#B8860B]/5 transition-all group"
                >
                    <div className="w-8 h-8 rounded-full bg-gray-100 group-hover:bg-[#B8860B] text-gray-400 group-hover:text-white flex items-center justify-center transition-colors">
                        <Plus size={16} />
                    </div>
                    <span className="text-sm font-bold uppercase tracking-widest">Adicionar Nova Seção</span>
                </button>

                {/* Modal de Confirmação de Exclusão */}
                {exchangeSectionToDelete !== null && createPortal(
                    <div className="fixed inset-0 z-[9999] bg-white animate-fade-in flex flex-col items-center justify-center">
                        <div className="absolute top-6 right-6">
                             <button 
                                onClick={() => setExchangeSectionToDelete(null)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        
                        <div className="max-w-md w-full p-8 text-center">
                            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
                                <Trash2 size={32} />
                            </div>
                            <h3 className="text-2xl font-serif font-bold text-[#1d1d1f] mb-2">
                                Excluir Seção {exchangeSectionToDelete}?
                            </h3>
                            <p className="text-gray-500 mb-8">
                                Esta ação não pode ser desfeita. Todo o conteúdo desta seção será perdido permanentemente.
                            </p>
                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={() => setExchangeSectionToDelete(null)}
                                    className="py-3 px-6 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors min-w-[120px]"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmRemoveSection}
                                    className="py-3 px-6 bg-red-500 text-white font-medium rounded-xl hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20 min-w-[120px]"
                                >
                                    Sim, Excluir
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}
            </div>
        );
    };

    // Renderização Especial para Envios e Prazos
    const renderShippingPolicy = (pageId: string, section: PageSection) => {
        // Agrupa campos por seção (section_1_, section_2_, etc.)
        const sectionsMap = new Map<number, PageField[]>();
        
        section.fields.forEach(field => {
            const match = field.key.match(/^section_(\d+)_/);
            if (match) {
                const sectionNum = parseInt(match[1]);
                const currentFields = sectionsMap.get(sectionNum) || [];
                currentFields.push(field);
                sectionsMap.set(sectionNum, currentFields);
            }
        });

        // Converte para array e ordena
        const sortedSections = Array.from(sectionsMap.entries())
            .sort((a, b) => a[0] - b[0])
            .map(([num, fields]) => ({ num, fields }));

        const handleAddSection = () => {
            const nextNum = sortedSections.length > 0 
                ? Math.max(...sortedSections.map(s => s.num)) + 1 
                : 1;
            
            const newFields: PageField[] = [
                { key: `section_${nextNum}_title`, label: `Seção ${nextNum}: Título`, type: 'text', value: `Nova Seção ${nextNum}` },
                { key: `section_${nextNum}_text`, label: `Seção ${nextNum}: Texto`, type: 'textarea', value: '' }
            ];

            const newContent = cmsContent.map(page => {
                if (page.id === pageId) {
                    return {
                        ...page,
                        sections: page.sections.map(sec => {
                            if (sec.id === section.id) {
                                return { ...sec, fields: [...sec.fields, ...newFields] };
                            }
                            return sec;
                        })
                    };
                }
                return page;
            });
            
            setCmsContent(newContent);
            setIsDirty(true);
        };

        const confirmRemoveSection = () => {
             if (shippingSectionToDelete === null) return;

             const newContent = cmsContent.map(page => {
                if (page.id === pageId) {
                    return {
                        ...page,
                        sections: page.sections.map(sec => {
                            if (sec.id === section.id) {
                                return { 
                                    ...sec, 
                                    fields: sec.fields.filter(f => !f.key.startsWith(`section_${shippingSectionToDelete}_`)) 
                                };
                            }
                            return sec;
                        })
                    };
                }
                return page;
            });
            
            setCmsContent(newContent);
            setIsDirty(true);
            setShippingSectionToDelete(null);
        }

        return (
            <div className="space-y-8">
                {/* Seções Dinâmicas */}
                {sortedSections.map(({ num, fields }) => (
                    <div key={num} className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden group relative">
                        <div className="px-6 py-4 bg-[#F9F9FA] border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-[#1d1d1f] text-[#B8860B] flex items-center justify-center font-bold text-xs shadow-sm">
                                    {num.toString().padStart(2, '0')}
                                </div>
                                <h4 className="font-serif font-bold text-base text-[#1d1d1f]">Seção {num}</h4>
                            </div>
                            <button 
                                onClick={() => setShippingSectionToDelete(num)}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                title="Remover Seção"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            {fields.map(field => renderField(pageId, section.id, field))}
                            
                            {/* Modalidades de Entrega (apenas na seção 2, se existir) */}
                            {num === 2 && (
                                <div className="mt-6 pt-6 border-t border-gray-100">
                                    <div className="mb-4 flex items-center gap-2 text-[#B8860B]">
                                        <Truck size={16} />
                                        <span className="text-xs font-bold uppercase tracking-widest">Modalidades de Entrega (Box)</span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {[1, 2].map(boxNum => {
                                            const titleKey = `info_${boxNum}_title`;
                                            const descKey = `info_${boxNum}_desc`;
                                            const iconKey = `info_${boxNum}_icon`;

                                            const titleField = section.fields.find(f => f.key === titleKey);
                                            const descField = section.fields.find(f => f.key === descKey);
                                            const iconField = section.fields.find(f => f.key === iconKey);

                                            if (!titleField || !descField) return null;

                                            // Fallback icon if field doesn't exist yet (though we added it to mockService)
                                            const currentIconVal = iconField ? iconField.value : (boxNum === 1 ? 'Truck' : 'Package');
                                            const IconComp = AVAILABLE_ICONS.find(i => i.id === currentIconVal)?.icon || Globe;
                                            const isEditing = editingIconKey === iconKey;

                                            return (
                                                <div key={boxNum} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm relative group">
                                                    <div className="flex flex-col gap-4">
                                                        <div className="flex items-center gap-4">
                                                            {/* Icon Picker Trigger */}
                                                            <div className="relative">
                                                                <div 
                                                                    onClick={() => setEditingIconKey(isEditing ? null : iconKey)}
                                                                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors cursor-pointer ${isEditing ? 'bg-[#1d1d1f] text-white' : 'bg-gray-100 text-[#1d1d1f] hover:bg-[#B8860B] hover:text-white'}`}
                                                                    title="Clique para alterar o ícone"
                                                                >
                                                                    <IconComp size={24} strokeWidth={1.5} />
                                                                </div>
                                                            </div>
                                                            
                                                            {/* Title Input */}
                                                            <div className="flex-1">
                                                                <label className="text-[10px] font-bold text-[#1d1d1f] uppercase tracking-widest mb-1 block">
                                                                    {titleField.label}
                                                                </label>
                                                                <input 
                                                                    type="text"
                                                                    value={titleField.value}
                                                                    onChange={(e) => handleCmsUpdate(pageId, section.id, titleKey, e.target.value)}
                                                                    className="w-full px-3 py-2 bg-[#F9F9FA] border border-gray-100 rounded-lg text-sm outline-none focus:border-[#B8860B]"
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Description Input */}
                                                        <div>
                                                            <label className="text-[10px] font-bold text-[#1d1d1f] uppercase tracking-widest mb-1 block">
                                                                {descField.label}
                                                            </label>
                                                            <textarea 
                                                                value={descField.value}
                                                                onChange={(e) => handleCmsUpdate(pageId, section.id, descKey, e.target.value)}
                                                                className="w-full p-3 bg-[#F9F9FA] border border-gray-100 rounded-lg text-sm outline-none focus:border-[#B8860B] min-h-[80px] resize-y"
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Inline Picker */}
                                                    {isEditing && (
                                                        <div className="mt-4 pt-4 border-t border-gray-100">
                                                            <InlineIconPicker 
                                                                onSelect={(val) => {
                                                                    // If field doesn't exist, we need to add it implicitly via handleCmsUpdate logic or ensure it exists
                                                                    // Since handleCmsUpdate just updates existing fields, we might need to add it if missing.
                                                                    // However, we added it to mockService, so it should exist for new loads.
                                                                    // For existing data in localStorage, mergeCmsContent should have added it.
                                                                    handleCmsUpdate(pageId, section.id, iconKey, val);
                                                                    setEditingIconKey(null);
                                                                }}
                                                                currentIcon={currentIconVal}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {/* Botão Adicionar Seção */}
                <button 
                    onClick={handleAddSection}
                    className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center gap-2 text-gray-400 hover:border-[#B8860B] hover:text-[#B8860B] hover:bg-[#B8860B]/5 transition-all group"
                >
                    <div className="w-8 h-8 rounded-full bg-gray-100 group-hover:bg-[#B8860B] text-gray-400 group-hover:text-white flex items-center justify-center transition-colors">
                        <Plus size={16} />
                    </div>
                    <span className="text-sm font-bold uppercase tracking-widest">Adicionar Nova Seção</span>
                </button>

                {/* Modal de Confirmação de Exclusão */}
                {shippingSectionToDelete !== null && createPortal(
                    <div className="fixed inset-0 z-[9999] bg-white animate-fade-in flex flex-col items-center justify-center">
                        <div className="absolute top-6 right-6">
                             <button 
                                onClick={() => setShippingSectionToDelete(null)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        
                        <div className="max-w-md w-full p-8 text-center">
                            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
                                <Trash2 size={32} />
                            </div>
                            <h3 className="text-2xl font-serif font-bold text-[#1d1d1f] mb-2">
                                Excluir Seção {shippingSectionToDelete}?
                            </h3>
                            <p className="text-gray-500 mb-8">
                                Esta ação não pode ser desfeita. Todo o conteúdo desta seção será perdido permanentemente.
                            </p>
                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={() => setShippingSectionToDelete(null)}
                                    className="py-3 px-6 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors min-w-[120px]"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmRemoveSection}
                                    className="py-3 px-6 bg-red-500 text-white font-medium rounded-xl hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20 min-w-[120px]"
                                >
                                    Sim, Excluir
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}
            </div>
        );
    };

    // Renderização Especial para Processo de Produção (Etapas)
    const renderProductionSteps = (pageId: string, section: PageSection) => {
        // Agrupa campos por etapa (1, 2, 3)
        const step1 = section.fields.filter(f => f.key.startsWith('step_1_'));
        const step2 = section.fields.filter(f => f.key.startsWith('step_2_'));
        const step3 = section.fields.filter(f => f.key.startsWith('step_3_'));

        const handleIconUpdate = (stepNum: number, newIcon: string) => {
            const iconKey = `step_${stepNum}_icon`;
            const existingField = section.fields.find(f => f.key === iconKey);
            
            if (existingField) {
                handleCmsUpdate(pageId, section.id, iconKey, newIcon);
            } else {
                const newField: PageField = { key: iconKey, label: `Ícone Etapa ${stepNum}`, type: 'text', value: newIcon };
                const newContent = cmsContent.map(page => {
                    if (page.id === pageId) {
                        return {
                            ...page,
                            sections: page.sections.map(sec => {
                                if (sec.id === section.id) {
                                    return { ...sec, fields: [...sec.fields, newField] };
                                }
                                return sec;
                            })
                        };
                    }
                    return page;
                });
                setCmsContent(newContent);
                setIsDirty(true);
            }
            setEditingIconKey(null);
        };

        return (
            <div className="space-y-10">
                <div className="grid grid-cols-1 gap-8">
                    {[
                        { num: 1, fields: step1, label: 'Primeira Etapa' },
                        { num: 2, fields: step2, label: 'Segunda Etapa' },
                        { num: 3, fields: step3, label: 'Terceira Etapa' }
                    ].map(step => {
                        const iconKey = `step_${step.num}_icon`;
                        const iconField = section.fields.find(f => f.key === iconKey);
                        const currentIconId = iconField ? iconField.value : 'Globe';
                        const IconComp = AVAILABLE_ICONS.find(i => i.id === currentIconId)?.icon || Globe;
                        const isEditing = editingIconKey === iconKey;

                        return (
                            <div key={step.num} className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden relative">
                                {/* Header do Card da Etapa */}
                                <div className="px-6 py-4 bg-[#F9F9FA] border-b border-gray-100 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <div 
                                                onClick={() => setEditingIconKey(isEditing ? null : iconKey)}
                                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${isEditing ? 'bg-[#1d1d1f] text-white' : 'bg-gray-100 text-[#1d1d1f] hover:bg-[#B8860B] hover:text-white'}`}
                                                title="Clique para alterar o ícone"
                                            >
                                                <IconComp size={16} />
                                            </div>
                                        </div>
                                        <h4 className="font-serif font-bold text-base text-[#1d1d1f]">{step.label}</h4>
                                    </div>
                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Edição de Bloco</span>
                                </div>
                                
                                {isEditing && (
                                    <div className="bg-gray-50/80 border-t border-gray-100 p-4">
                                        <InlineIconPicker 
                                            onSelect={(val) => handleIconUpdate(step.num, val)}
                                            currentIcon={currentIconId}
                                        />
                                    </div>
                                )}

                                {/* Campos da Etapa */}
                                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {step.fields.map(field => {
                                        // Se for a descrição, ocupa as duas colunas no desktop
                                        const isDesc = field.key.includes('_desc');
                                        // Skip icon field if it appears here
                                        if (field.key === iconKey) return null;

                                        return (
                                            <div key={field.key} className={`${isDesc ? 'md:col-span-2' : ''}`}>
                                                {renderField(pageId, section.id, field)}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    // Renderização Especial para Pontos Sustentáveis
    const renderSustainabilityPoints = (pageId: string, section: PageSection) => {
        // Agrupa campos por ponto (p1, p2, p3, p4...)
        const pointsMap = new Map<number, PageField[]>();
        
        section.fields.forEach(field => {
            const match = field.key.match(/^p(\d+)_/);
            if (match) {
                const pointNum = parseInt(match[1]);
                const currentFields = pointsMap.get(pointNum) || [];
                currentFields.push(field);
                pointsMap.set(pointNum, currentFields);
            }
        });

        const points = Array.from(pointsMap.entries())
            .sort((a, b) => a[0] - b[0])
            .map(([id, fields]) => ({ id, fields }));

        const handleIconUpdate = (pointId: number, newIcon: string) => {
            const iconKey = `p${pointId}_icon`;
            const existingField = section.fields.find(f => f.key === iconKey);
            
            if (existingField) {
                handleCmsUpdate(pageId, section.id, iconKey, newIcon);
            } else {
                const newField: PageField = { key: iconKey, label: `Ícone Ponto ${pointId}`, type: 'text', value: newIcon };
                const newContent = cmsContent.map(page => {
                    if (page.id === pageId) {
                        return {
                            ...page,
                            sections: page.sections.map(sec => {
                                if (sec.id === section.id) {
                                    return { ...sec, fields: [...sec.fields, newField] };
                                }
                                return sec;
                            })
                        };
                    }
                    return page;
                });
                setCmsContent(newContent);
                setIsDirty(true);
            }
            setEditingIconKey(null);
        };

        const handleAddPoint = () => {
            const nextId = points.length > 0 
                ? Math.max(...points.map(p => p.id)) + 1 
                : 1;

            const newFields: PageField[] = [
                { key: `p${nextId}_title`, label: `Título Ponto ${nextId}`, type: 'text', value: `Novo Ponto ${nextId}` },
                { key: `p${nextId}_desc`, label: `Descrição Ponto ${nextId}`, type: 'textarea', value: '' },
                { key: `p${nextId}_icon`, label: `Ícone Ponto ${nextId}`, type: 'text', value: 'Globe' }
            ];

            const newContent = cmsContent.map(page => {
                if (page.id === pageId) {
                    return {
                        ...page,
                        sections: page.sections.map(sec => {
                            if (sec.id === section.id) {
                                return { ...sec, fields: [...sec.fields, ...newFields] };
                            }
                            return sec;
                        })
                    };
                }
                return page;
            });
            setCmsContent(newContent);
            setIsDirty(true);
        };

        const confirmRemovePoint = () => {
            if (sustainabilityPointToDelete === null) return;

            const newContent = cmsContent.map(page => {
                if (page.id === pageId) {
                    return {
                        ...page,
                        sections: page.sections.map(sec => {
                            if (sec.id === section.id) {
                                return { 
                                    ...sec, 
                                    fields: sec.fields.filter(f => !f.key.startsWith(`p${sustainabilityPointToDelete}_`)) 
                                };
                            }
                            return sec;
                        })
                    };
                }
                return page;
            });
            
            setCmsContent(newContent);
            setIsDirty(true);
            setSustainabilityPointToDelete(null);
        };

        return (
            <div className="space-y-8">
                {points.map(point => {
                    const iconKey = `p${point.id}_icon`;
                    const iconField = section.fields.find(f => f.key === iconKey);
                    const currentIconId = iconField ? iconField.value : 'Globe';
                    const IconComp = AVAILABLE_ICONS.find(i => i.id === currentIconId)?.icon || Globe;
                    const isEditing = editingIconKey === iconKey;

                    return (
                        <div key={point.id} className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden relative group">
                            <div className="px-6 py-4 bg-[#F9F9FA] border-b border-gray-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <div 
                                            onClick={() => setEditingIconKey(isEditing ? null : iconKey)}
                                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${isEditing ? 'bg-[#1d1d1f] text-white' : 'bg-gray-100 text-[#1d1d1f] hover:bg-[#B8860B] hover:text-white'}`}
                                            title="Clique para alterar o ícone"
                                        >
                                            <IconComp size={16} />
                                        </div>
                                    </div>
                                    <h4 className="font-serif font-bold text-base text-[#1d1d1f]">Ponto Sustentável {point.id}</h4>
                                </div>
                                <button 
                                    onClick={() => setSustainabilityPointToDelete(point.id)}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                    title="Remover Ponto"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            {isEditing && (
                                <div className="bg-gray-50/80 border-t border-gray-100 p-4">
                                    <InlineIconPicker 
                                        onSelect={(val) => handleIconUpdate(point.id, val)}
                                        currentIcon={currentIconId}
                                    />
                                </div>
                            )}

                            <div className="p-6 space-y-6">
                                {point.fields.map(field => {
                                    if (field.key === iconKey) return null;
                                    return renderField(pageId, section.id, field);
                                })}
                            </div>
                        </div>
                    );
                })}

                {/* Botão Adicionar Ponto */}
                <button 
                    onClick={handleAddPoint}
                    className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center gap-2 text-gray-400 hover:border-[#B8860B] hover:text-[#B8860B] hover:bg-[#B8860B]/5 transition-all group"
                >
                    <div className="w-8 h-8 rounded-full bg-gray-100 group-hover:bg-[#B8860B] text-gray-400 group-hover:text-white flex items-center justify-center transition-colors">
                        <Plus size={16} />
                    </div>
                    <span className="text-sm font-bold uppercase tracking-widest">Adicionar Novo Ponto</span>
                </button>

                {/* Modal de Confirmação de Exclusão */}
                {sustainabilityPointToDelete !== null && createPortal(
                    <div className="fixed inset-0 z-[9999] bg-white animate-fade-in flex flex-col items-center justify-center">
                        <div className="absolute top-6 right-6">
                             <button 
                                onClick={() => setSustainabilityPointToDelete(null)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        
                        <div className="max-w-md w-full p-8 text-center">
                            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
                                <Trash2 size={32} />
                            </div>
                            <h3 className="text-2xl font-serif font-bold text-[#1d1d1f] mb-2">
                                Excluir Ponto {sustainabilityPointToDelete}?
                            </h3>
                            <p className="text-gray-500 mb-8">
                                Esta ação não pode ser desfeita. Todo o conteúdo deste ponto será perdido permanentemente.
                            </p>
                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={() => setSustainabilityPointToDelete(null)}
                                    className="py-3 px-6 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors min-w-[120px]"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmRemovePoint}
                                    className="py-3 px-6 bg-red-500 text-white font-medium rounded-xl hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20 min-w-[120px]"
                                >
                                    Sim, Excluir
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}
            </div>
        );
    };

    // Renderização Especial para Redes Sociais (Footer)
    const renderSocialSection = (pageId: string, section: PageSection) => {
        const itemsMap: Record<string, { label: string, toggleKey: string, urlKey: string, icon: any }> = {
            'instagram': { label: 'Instagram', toggleKey: 'instagram_visible', urlKey: 'instagram_url', icon: Instagram },
            'facebook': { label: 'Facebook', toggleKey: 'facebook_visible', urlKey: 'facebook_url', icon: Facebook },
            'twitter': { label: 'Twitter/X', toggleKey: 'twitter_visible', urlKey: 'twitter_url', icon: Twitter }
        };

        const getVal = (k: string) => section.fields.find(f => f.key === k)?.value || '';
        
        const getIconComponent = (iconName: string) => {
            return AVAILABLE_ICONS.find(i => i.id === iconName)?.icon || Globe;
        };

        const handleIconUpdate = (itemKey: string, newIcon: string) => {
            // Se for customizado, atualiza o campo _icon
            // Se for padrão (instagram, facebook, twitter), precisamos criar/atualizar o campo _icon se ele não existir
            // Mas para os padrões, a lógica atual assume que o ícone é fixo no itemsMap se não tiver campo customizado.
            // Vamos permitir sobrescrever o ícone padrão criando um campo _icon para eles também.
            
            let iconFieldKey = `${itemKey}_icon`;
            // Verifica se o campo já existe
            const existingField = section.fields.find(f => f.key === iconFieldKey);
            
            if (existingField) {
                handleCmsUpdate(pageId, section.id, iconFieldKey, newIcon);
            } else {
                // Adiciona o campo de ícone se não existir
                const newField: PageField = { key: iconFieldKey, label: `${itemKey} Ícone`, type: 'text', value: newIcon };
                const newContent = cmsContent.map(page => {
                    if (page.id === pageId) {
                        return {
                            ...page,
                            sections: page.sections.map(sec => {
                                if (sec.id === section.id) {
                                    return { ...sec, fields: [...sec.fields, newField] };
                                }
                                return sec;
                            })
                        };
                    }
                    return page;
                });
                setCmsContent(newContent);
                setIsDirty(true);
            }
            setEditingIconKey(null);
        };

        const handleLabelUpdate = (itemKey: string, newLabel: string) => {
            let labelFieldKey = `${itemKey}_label`;
            const existingField = section.fields.find(f => f.key === labelFieldKey);
            
            if (existingField) {
                handleCmsUpdate(pageId, section.id, labelFieldKey, newLabel);
            } else {
                const newField: PageField = { key: labelFieldKey, label: `${itemKey} Nome`, type: 'text', value: newLabel };
                const newContent = cmsContent.map(page => {
                    if (page.id === pageId) {
                        return {
                            ...page,
                            sections: page.sections.map(sec => {
                                if (sec.id === section.id) {
                                    return { ...sec, fields: [...sec.fields, newField] };
                                }
                                return sec;
                            })
                        };
                    }
                    return page;
                });
                setCmsContent(newContent);
                setIsDirty(true);
            }
        };

        return (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-fade-in">
                 <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-white border border-gray-100 rounded-md text-[#1d1d1f] shadow-sm"><Share2 size={16}/></div>
                        <h3 className="font-serif font-bold text-lg text-[#1d1d1f]">{section.title}</h3>
                    </div>
                    <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest bg-white border border-gray-100 px-2 py-1 rounded">Seção: {section.id}</span>
                </div>
                
                <div className="p-6 space-y-6">
                     <div className="flex justify-between items-center mb-2">
                        <h4 className="text-xs font-bold text-[#1d1d1f] uppercase tracking-widest">Ordem e Visibilidade</h4>
                        <span className="text-[9px] text-gray-400 italic">Arraste para reordenar</span>
                    </div>

                    <Reorder.Group axis="y" values={socialOrder} onReorder={(newOrder) => {
                        setSocialOrder(newOrder);
                        handleCmsUpdate('footer', 'social', 'social_order', newOrder.join(','));
                    }} className="space-y-3">
                        {socialOrder.map((itemKey) => {
                            let config = itemsMap[itemKey];
                            let isCustom = false;

                            if (!config) {
                                const urlField = section.fields.find(f => f.key === `${itemKey}_url`);
                                const visibleField = section.fields.find(f => f.key === `${itemKey}_visible`);
                                const iconField = section.fields.find(f => f.key === `${itemKey}_icon`);
                                
                                if (urlField && visibleField) {
                                    config = {
                                        label: itemKey.charAt(0).toUpperCase() + itemKey.slice(1),
                                        toggleKey: visibleField.key,
                                        urlKey: urlField.key,
                                        icon: iconField ? getIconComponent(iconField.value) : Globe
                                    };
                                    isCustom = true;
                                }
                            }

                            if (!config) return null;

                            return (
                                <SocialSortableItem 
                                    key={itemKey}
                                    itemKey={itemKey}
                                    config={config}
                                    isCustom={isCustom}
                                    section={section}
                                    pageId={pageId}
                                    handleCmsUpdate={handleCmsUpdate}
                                    handleDeleteSocial={handleDeleteSocial}
                                    editingIconKey={editingIconKey}
                                    setEditingIconKey={setEditingIconKey}
                                    handleIconUpdate={handleIconUpdate}
                                    handleLabelUpdate={handleLabelUpdate}
                                    getVal={getVal}
                                />
                            );
                        })}
                    </Reorder.Group>

                    {!isAddingSocial ? (
                        <button 
                            onClick={() => setIsAddingSocial(true)}
                            className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-xs font-bold text-gray-400 uppercase tracking-widest hover:border-[#B8860B] hover:text-[#B8860B] transition-all flex items-center justify-center gap-2"
                        >
                            <Plus size={16} /> ADICIONAR REDE SOCIAL
                        </button>
                    ) : (
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 animate-fade-in">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h4 className="text-xs font-bold text-[#1d1d1f] uppercase tracking-widest">Nova Rede Social</h4>
                                    <button onClick={() => setIsAddingSocial(false)} className="text-gray-400 hover:text-[#1d1d1f]"><X size={16} /></button>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Nome da Rede</label>
                                    <input 
                                        type="text" 
                                        value={newSocialName}
                                        onChange={(e) => setNewSocialName(e.target.value)}
                                        className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-[#B8860B]"
                                        placeholder="Ex: LinkedIn"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Ícone</label>
                                    <IconSelector value={newSocialIcon} onChange={setNewSocialIcon} />
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <button 
                                        onClick={handleAddSocial}
                                        disabled={!newSocialName}
                                        className="flex-1 py-3 bg-[#1d1d1f] text-white rounded-xl text-xs font-bold uppercase tracking-widest disabled:opacity-50 hover:bg-black transition-all"
                                    >
                                        Confirmar
                                    </button>
                                    <button 
                                        onClick={() => { setIsAddingSocial(false); setNewSocialName(''); }}
                                        className="px-6 py-3 bg-white border border-gray-200 text-gray-500 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-gray-50 transition-all"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // Renderização Especial para Contato
    const renderContactSection = (pageId: string, section: PageSection) => {
        const itemsMap: Record<string, { label: string, toggleKey: string, valueKey: string, icon: any }> = {
            'hours': { label: 'Horário de Atendimento', toggleKey: 'hours_visible', valueKey: 'hours', icon: Clock },
            'email': { label: 'E-mail', toggleKey: 'email_visible', valueKey: 'email', icon: Mail },
            'phone': { label: 'Telefone / WhatsApp', toggleKey: 'phone_visible', valueKey: 'phone', icon: Phone },
            'address': { label: 'Endereço', toggleKey: 'address_visible', valueKey: 'address', icon: MapPin },
            'company_info': { label: 'Dados da Empresa (Rodapé)', toggleKey: 'company_info_visible', valueKey: 'company_info', icon: FileText }
        };

        const getVal = (k: string) => section.fields.find(f => f.key === k)?.value || '';

        const handleIconUpdate = (itemKey: string, newIcon: string) => {
            let iconFieldKey = `${itemKey}_icon`;
            const existingField = section.fields.find(f => f.key === iconFieldKey);
            
            if (existingField) {
                handleCmsUpdate(pageId, section.id, iconFieldKey, newIcon);
            } else {
                const newField: PageField = { key: iconFieldKey, label: `${itemKey} Ícone`, type: 'text', value: newIcon };
                const newContent = cmsContent.map(page => {
                    if (page.id === pageId) {
                        return {
                            ...page,
                            sections: page.sections.map(sec => {
                                if (sec.id === section.id) {
                                    return { ...sec, fields: [...sec.fields, newField] };
                                }
                                return sec;
                            })
                        };
                    }
                    return page;
                });
                setCmsContent(newContent);
                setIsDirty(true);
            }
            setEditingIconKey(null);
        };

        return (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-fade-in">
                 <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-white border border-gray-100 rounded-md text-[#1d1d1f] shadow-sm"><Info size={16}/></div>
                        <h3 className="font-serif font-bold text-lg text-[#1d1d1f]">{section.title}</h3>
                    </div>
                    <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest bg-white border border-gray-100 px-2 py-1 rounded">Seção: {section.id}</span>
                </div>
                
                <div className="p-6 space-y-6">
                     <div className="flex justify-between items-center mb-2">
                        <h4 className="text-xs font-bold text-[#1d1d1f] uppercase tracking-widest">Ordem e Visibilidade</h4>
                        <span className="text-[9px] text-gray-400 italic">Arraste para reordenar</span>
                    </div>

                    <Reorder.Group axis="y" values={contactOrder} onReorder={(newOrder) => {
                        setContactOrder(newOrder);
                        handleCmsUpdate('contact', 'info', 'contact_order', newOrder.join(','));
                    }} className="space-y-3">
                        {contactOrder.map((itemKey) => {
                            const config = itemsMap[itemKey];
                            if (!config) return null;

                            return (
                                <ContactSortableItem 
                                    key={itemKey}
                                    itemKey={itemKey}
                                    config={config}
                                    section={section}
                                    pageId={pageId}
                                    handleCmsUpdate={handleCmsUpdate}
                                    editingIconKey={editingIconKey}
                                    setEditingIconKey={setEditingIconKey}
                                    handleIconUpdate={handleIconUpdate}
                                    getVal={getVal}
                                />
                            );
                        })}
                    </Reorder.Group>
                </div>
            </div>
        );
    };

    const renderStatsPage = () => {
        const sectionId = 'config';
        const itemsMap: Record<string, { label: string, toggleKey: string, inputKey: string }> = {
            'orders': { label: 'Pedidos Enviados', toggleKey: 'show_orders', inputKey: 'manual_orders' },
            'magnets': { label: 'Ímãs Produzidos', toggleKey: 'show_magnets', inputKey: 'manual_magnets' },
            'reviews': { label: 'Avaliações 5 Estrelas', toggleKey: 'show_reviews', inputKey: 'manual_reviews' }
        };

        const page = cmsContent.find(p => p.id === 'stats');
        const section = page?.sections.find(s => s.id === 'config');
        const getVal = (k: string) => section?.fields.find(f => f.key === k)?.value || '';

        return (
            <div className="space-y-8 animate-fade-in">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h4 className="text-sm font-bold text-[#1d1d1f] uppercase tracking-widest mb-6 border-b border-gray-50 pb-2">Configuração Global</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="flex items-center justify-between p-4 bg-[#F9F9FA] rounded-xl border border-gray-50">
                            <span className="text-xs font-bold text-[#1d1d1f]">Exibir Seção no Site</span>
                            <ToggleSwitch checked={getVal('section_visible') === 'true'} onChange={() => handleCmsUpdate('stats', sectionId, 'section_visible', getVal('section_visible') === 'true' ? 'false' : 'true')} />
                        </div>
                        <div className="flex items-center justify-between p-4 bg-[#F9F9FA] rounded-xl border border-gray-50">
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-[#1d1d1f]">Somar Dados Reais</span>
                                <span className="text-[9px] text-gray-400">Soma contagem automática do banco</span>
                            </div>
                            <ToggleSwitch checked={getVal('use_real_data') === 'true'} onChange={() => handleCmsUpdate('stats', sectionId, 'use_real_data', getVal('use_real_data') === 'true' ? 'false' : 'true')} />
                        </div>
                        <div className="md:col-span-2 flex flex-col sm:flex-row items-center gap-4 p-4 bg-[#F9F9FA] rounded-xl border border-gray-50">
                            <div className="w-full sm:flex-1 flex items-center justify-between sm:mr-4 sm:border-r border-gray-200 sm:pr-4 border-b sm:border-b-0 pb-4 sm:pb-0">
                                <span className="text-xs font-bold text-[#1d1d1f]">Exibir Anos de Experiência</span>
                                <ToggleSwitch checked={getVal('show_years') === 'true'} onChange={() => handleCmsUpdate('stats', sectionId, 'show_years', getVal('show_years') === 'true' ? 'false' : 'true')} />
                            </div>
                            <div className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-2">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Anos:</span>
                                <input type="number" value={getVal('years_count')} onChange={(e) => handleCmsUpdate('stats', sectionId, 'years_count', e.target.value)} className="w-20 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-center outline-none focus:border-[#B8860B]" />
                            </div>
                        </div>
                    </div>
                </div>
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
                                <div key={itemKey} draggable onDragStart={() => handleDragStart(index)} onDragOver={handleDragOver} onDrop={() => handleDrop(index)} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-all cursor-move group">
                                    <div className="flex items-center gap-3 w-full sm:w-auto">
                                        <div className="text-gray-300 group-hover:text-[#1d1d1f] transition-colors cursor-grab shrink-0"><GripVertical size={20} /></div>
                                        <div className="flex-1 sm:flex-none"><p className="text-xs font-bold text-[#1d1d1f] uppercase tracking-wide">{config.label}</p></div>
                                    </div>
                                    <div className="flex items-center justify-between gap-4 w-full sm:w-auto sm:ml-auto">
                                        <div className="flex items-center gap-2 bg-[#F9F9FA] px-3 py-1.5 rounded-lg border border-gray-100 flex-1 sm:flex-none justify-between sm:justify-start">
                                            <span className="text-[9px] font-bold text-gray-400 uppercase whitespace-nowrap">Base Manual:</span>
                                            <input type="number" value={getVal(config.inputKey)} onChange={(e) => handleCmsUpdate('stats', sectionId, config.inputKey, e.target.value)} className="w-20 bg-transparent text-sm font-medium text-right outline-none text-[#1d1d1f]" />
                                        </div>
                                        <div className="pl-4 border-l border-gray-100 shrink-0">
                                            <ToggleSwitch checked={getVal(config.toggleKey) === 'true'} onChange={() => handleCmsUpdate('stats', sectionId, config.toggleKey, getVal(config.toggleKey) === 'true' ? 'false' : 'true')} />
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

    const handleDragStart = (index: number) => setDraggedItemIndex(index);
    const handleDragOver = (e: React.DragEvent) => e.preventDefault();
    const handleDrop = (dropIndex: number) => {
        if (draggedItemIndex === null || draggedItemIndex === dropIndex) return;
        
        if (selectedPageId === 'stats') {
            const updatedOrder = [...statsOrder];
            const [movedItem] = updatedOrder.splice(draggedItemIndex, 1);
            updatedOrder.splice(dropIndex, 0, movedItem);
            setStatsOrder(updatedOrder);
            handleCmsUpdate('stats', 'config', 'stats_order', updatedOrder.join(','));
        } else if (selectedPageId === 'footer') {
            const updatedOrder = [...socialOrder];
            const [movedItem] = updatedOrder.splice(draggedItemIndex, 1);
            updatedOrder.splice(dropIndex, 0, movedItem);
            setSocialOrder(updatedOrder);
            handleCmsUpdate('footer', 'social', 'social_order', updatedOrder.join(','));
        } else if (selectedPageId === 'contact') {
            const updatedOrder = [...contactOrder];
            const [movedItem] = updatedOrder.splice(draggedItemIndex, 1);
            updatedOrder.splice(dropIndex, 0, movedItem);
            setContactOrder(updatedOrder);
            handleCmsUpdate('contact', 'info', 'contact_order', updatedOrder.join(','));
        }
        setDraggedItemIndex(null);
    };

    const currentPageContent = cmsContent.find(p => p.id === selectedPageId);

    return (
        <div className="space-y-6 animate-fade-in pb-32 md:pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                <div className="md:hidden">
                    <h3 className="text-xl font-serif font-bold text-[#1d1d1f]">Gerenciamento de Conteúdo</h3>
                    <p className="text-xs text-gray-400 mt-1">Edite textos, imagens e configurações das páginas.</p>
                </div>
                <button 
                    onClick={handleSaveCms} 
                    disabled={!isDirty || isProcessingImage}
                    className={`hidden md:flex px-6 py-3 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all items-center gap-2 shadow-lg ml-auto ${isDirty ? 'bg-[#B8860B] text-white hover:bg-[#966d09] cursor-pointer' : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'}`}
                >
                    {isProcessingImage ? <Loader2 size={14} className="animate-spin"/> : <Save size={14}/>} 
                    {isProcessingImage ? 'Processando Imagem...' : isDirty ? 'Salvar Alterações' : 'Salvo'}
                </button>
            </div>

            <div className="w-full">
                {selectedPageId === 'stats' ? (
                    renderStatsPage()
                ) : (
                    <div className="space-y-12">
                        {currentPageContent?.sections.map(section => {
                            // Se for a seção de etapas da página de processo, usa o renderizador especial
                            if (selectedPageId === 'process' && section.id === 'steps') {
                                return (
                                    <div key={section.id} className="space-y-6">
                                        <div className="flex items-center gap-3 ml-2">
                                            <div className="p-2 bg-[#B8860B]/10 rounded-lg text-[#B8860B] shadow-sm"><ListOrdered size={20}/></div>
                                            <div>
                                                <h3 className="font-serif font-bold text-xl text-[#1d1d1f]">{section.title}</h3>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Organização de Fluxo em Bloco</p>
                                            </div>
                                        </div>
                                        {renderProductionSteps(selectedPageId, section)}
                                    </div>
                                );
                            }

                            // Se for a seção de pontos sustentáveis, usa renderizador especial
                            if (selectedPageId === 'sustainability' && section.id === 'points') {
                                return (
                                    <div key={section.id} className="space-y-6">
                                        <div className="flex items-center gap-3 ml-2">
                                            <div className="p-2 bg-[#B8860B]/10 rounded-lg text-[#B8860B] shadow-sm"><Recycle size={20}/></div>
                                            <div>
                                                <h3 className="font-serif font-bold text-xl text-[#1d1d1f]">{section.title}</h3>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Organização de Pilares</p>
                                            </div>
                                        </div>
                                        {renderSustainabilityPoints(selectedPageId, section)}
                                    </div>
                                );
                            }

                            // Se for a seção de redes sociais do rodapé, usa renderizador especial
                            if (selectedPageId === 'footer' && section.id === 'social') {
                                return (
                                    <div key={section.id} className="space-y-6">
                                        <div className="flex items-center gap-3 ml-2">
                                            <div className="p-2 bg-[#B8860B]/10 rounded-lg text-[#B8860B] shadow-sm"><Share2 size={20}/></div>
                                            <div>
                                                <h3 className="font-serif font-bold text-xl text-[#1d1d1f]">{section.title}</h3>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Links e Visibilidade</p>
                                            </div>
                                        </div>
                                        {renderSocialSection(selectedPageId, section)}
                                    </div>
                                );
                            }

                            // Se for a seção de informações de contato, usa renderizador especial
                            if (selectedPageId === 'contact' && section.id === 'info') {
                                return (
                                    <div key={section.id} className="space-y-6">
                                        <div className="flex items-center gap-3 ml-2">
                                            <div className="p-2 bg-[#B8860B]/10 rounded-lg text-[#B8860B] shadow-sm"><Info size={20}/></div>
                                            <div>
                                                <h3 className="font-serif font-bold text-xl text-[#1d1d1f]">{section.title}</h3>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Informações e Visibilidade</p>
                                            </div>
                                        </div>
                                        {renderContactSection(selectedPageId, section)}
                                    </div>
                                );
                            }

                            // Se for a seção de Termos de Uso, usa renderizador especial
                            if (selectedPageId === 'terms' && section.id === 'content') {
                                return (
                                    <div key={section.id} className="space-y-6">
                                        <div className="flex items-center gap-3 ml-2">
                                            <div className="p-2 bg-[#B8860B]/10 rounded-lg text-[#B8860B] shadow-sm"><FileText size={20}/></div>
                                            <div>
                                                <h3 className="font-serif font-bold text-xl text-[#1d1d1f]">{section.title}</h3>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Organização Legal</p>
                                            </div>
                                        </div>
                                        {renderTermsOfUse(selectedPageId, section)}
                                    </div>
                                );
                            }

                            // Se for a seção de Política de Privacidade, usa renderizador especial
                            if (selectedPageId === 'privacy' && section.id === 'content') {
                                return (
                                    <div key={section.id} className="space-y-6">
                                        <div className="flex items-center gap-3 ml-2">
                                            <div className="p-2 bg-[#B8860B]/10 rounded-lg text-[#B8860B] shadow-sm"><Shield size={20}/></div>
                                            <div>
                                                <h3 className="font-serif font-bold text-xl text-[#1d1d1f]">{section.title}</h3>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Organização Legal</p>
                                            </div>
                                        </div>
                                        {renderPrivacyPolicy(selectedPageId, section)}
                                    </div>
                                );
                            }

                            // Se for a seção de Política de Troca, usa renderizador especial
                            if (selectedPageId === 'exchanges' && section.id === 'content') {
                                return (
                                    <div key={section.id} className="space-y-6">
                                        <div className="flex items-center gap-3 ml-2">
                                            <div className="p-2 bg-[#B8860B]/10 rounded-lg text-[#B8860B] shadow-sm"><RefreshCw size={20}/></div>
                                            <div>
                                                <h3 className="font-serif font-bold text-xl text-[#1d1d1f]">{section.title}</h3>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Organização Legal</p>
                                            </div>
                                        </div>
                                        {renderExchangePolicy(selectedPageId, section)}
                                    </div>
                                );
                            }

                            // Se for a seção de Envios e Prazos, usa renderizador especial
                            if (selectedPageId === 'shipping' && section.id === 'content') {
                                return (
                                    <div key={section.id} className="space-y-6">
                                        <div className="flex items-center gap-3 ml-2">
                                            <div className="p-2 bg-[#B8860B]/10 rounded-lg text-[#B8860B] shadow-sm"><Truck size={20}/></div>
                                            <div>
                                                <h3 className="font-serif font-bold text-xl text-[#1d1d1f]">{section.title}</h3>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Organização Legal</p>
                                            </div>
                                        </div>
                                        {renderShippingPolicy(selectedPageId, section)}
                                    </div>
                                );
                            }

                            return (
                                <div key={section.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-fade-in">
                                    <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className="p-1.5 bg-white border border-gray-100 rounded-md text-[#1d1d1f] shadow-sm"><FileText size={16}/></div>
                                            <h3 className="font-serif font-bold text-lg text-[#1d1d1f]">{section.title}</h3>
                                        </div>
                                        <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest bg-white border border-gray-100 px-2 py-1 rounded">Seção: {section.id}</span>
                                    </div>
                                    <div className="p-6 space-y-8">
                                        {section.fields.map(field => renderField(selectedPageId, section.id, field))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-40">
                <button 
                    onClick={handleSaveCms} 
                    disabled={!isDirty || isProcessingImage}
                    className={`w-full py-4 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg ${isDirty ? 'bg-[#B8860B] text-white active:bg-[#966d09]' : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'}`}
                >
                    {isProcessingImage ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>} 
                    {isProcessingImage ? 'Processando...' : isDirty ? 'Salvar Alterações' : 'Salvo'}
                </button>
            </div>
        </div>
    );
};

export default AdminCMS;
