
import React, { useState, useEffect } from 'react';
import { Check, X, Plus, Pencil, Trash2, CheckCircle, Sparkles } from 'lucide-react';
import { ProductTier } from '../../types';

interface AdminPricingProps {
    localRules: ProductTier[];
    setLocalRules: (rules: ProductTier[]) => void;
}

// Sub-componente para o Card Individual
const PricingCard: React.FC<{ 
    tier: ProductTier; 
    onUpdate: (tier: ProductTier) => void; 
    onDelete: () => void; 
    onToggleRec: () => void; 
}> = ({ tier, onUpdate, onDelete, onToggleRec }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [draft, setDraft] = useState<ProductTier>(tier);
    const [newFeature, setNewFeature] = useState('');

    // Sincroniza o rascunho se a prop mudar externamente e não estiver editando
    useEffect(() => {
        if (!isEditing) setDraft(tier);
    }, [tier, isEditing]);

    const handleSave = () => {
        onUpdate(draft);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setDraft(tier);
        setIsEditing(false);
    };

    const updateField = (field: keyof ProductTier, value: any) => {
        setDraft(prev => ({ ...prev, [field]: value }));
    };

    const addFeature = () => {
        if (newFeature.trim()) {
            setDraft(prev => ({ ...prev, features: [...(prev.features || []), newFeature] }));
            setNewFeature('');
        }
    };

    const removeFeature = (idx: number) => {
        setDraft(prev => ({ ...prev, features: prev.features?.filter((_, i) => i !== idx) }));
    };

    const updateFeature = (idx: number, val: string) => {
        const newFeatures = [...(draft.features || [])];
        newFeatures[idx] = val;
        setDraft(prev => ({...prev, features: newFeatures}));
    };

    const unitPrice = (draft.price / (draft.photoCount || 1)).toFixed(2);
    const priceParts = draft.price.toFixed(2).split('.');

    return (
        <div className={`relative bg-white rounded-[20px] transition-all duration-300 flex flex-col overflow-hidden ${tier.isRecommended ? 'border-2 border-[#B8860B] shadow-lg scale-[1.02] z-10' : 'border border-gray-100 shadow-sm hover:shadow-md'}`}>
            
            {/* Header / Recommended Toggle */}
            <div 
                onClick={onToggleRec}
                className="w-full py-2 md:py-3 text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] text-center cursor-pointer transition-colors bg-gray-50/50 hover:bg-gray-100 text-gray-300 select-none flex items-center justify-center gap-2"
            >
                {tier.isRecommended ? <span className="text-[#B8860B] flex items-center gap-2"><Sparkles size={12}/> Recomendado</span> : 'Definir como Recomendado'}
            </div>

            {/* Edit Controls - Top Right relative to content */}
            <div className="absolute top-10 md:top-12 right-4 z-20 flex gap-2">
                {isEditing ? (
                    <>
                        <button onClick={handleCancel} className="w-8 h-8 rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-colors flex items-center justify-center shadow-sm" title="Cancelar"><X size={14} /></button>
                        <button onClick={handleSave} className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-500 hover:bg-emerald-100 transition-colors flex items-center justify-center shadow-sm" title="Salvar"><Check size={14} /></button>
                    </>
                ) : (
                    <button onClick={() => setIsEditing(true)} className="w-8 h-8 rounded-full bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-[#B8860B] transition-colors flex items-center justify-center" title="Editar"><Pencil size={14} /></button>
                )}
            </div>

            <div className="p-5 md:p-6 flex-1 flex flex-col items-center text-center">
                
                {/* Title */}
                <div className="mb-4 md:mb-6 w-full">
                    {isEditing ? (
                        <input 
                            value={draft.name} 
                            onChange={e => updateField('name', e.target.value)}
                            className="text-xl md:text-2xl font-serif font-bold text-center w-full border-b border-gray-200 focus:border-[#B8860B] outline-none bg-transparent py-1 text-[#1d1d1f] placeholder:text-gray-300"
                            placeholder="NOME DO KIT"
                        />
                    ) : (
                        <h3 className="text-xl md:text-2xl font-serif font-bold text-[#1d1d1f]">{draft.name}</h3>
                    )}
                    <div className="w-full h-px bg-gray-100 mt-3 md:mt-4 mb-4 md:mb-6"></div>
                </div>

                {/* Price Box */}
                <div className="mb-4 md:mb-6 w-full bg-[#F9F9FA]/50 rounded-2xl py-4 md:py-6">
                    <p className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Preço (R$)</p>
                    <div className="flex items-start justify-center gap-1 text-[#1d1d1f] mb-4 md:mb-6">
                        <span className="text-base md:text-lg font-bold mt-1 text-gray-400">R$</span>
                        {isEditing ? (
                            <input 
                                type="number" 
                                value={draft.price} 
                                onChange={e => updateField('price', parseFloat(e.target.value))}
                                className="text-4xl md:text-5xl font-serif font-bold bg-transparent text-center w-36 border-b border-gray-200 focus:border-[#B8860B] outline-none p-0 leading-none"
                            />
                        ) : (
                            <div className="flex items-start leading-none">
                                <span className="text-5xl md:text-6xl font-serif font-bold tracking-tight">{priceParts[0]}</span>
                                <span className="text-2xl md:text-3xl font-serif font-bold mt-1 text-gray-400">,{priceParts[1]}</span>
                            </div>
                        )}
                    </div>
                    
                    <div className="flex flex-col items-center gap-1">
                        <p className="text-[8px] md:text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Qtd. Fotos</p>
                        {isEditing ? (
                            <div className="flex items-center gap-2 justify-center">
                                <input 
                                    type="number" 
                                    value={draft.photoCount} 
                                    onChange={e => updateField('photoCount', parseInt(e.target.value))}
                                    className="w-20 text-center bg-white border border-gray-200 rounded-md px-2 py-1.5 text-base font-bold outline-none focus:border-[#B8860B] text-[#1d1d1f]"
                                />
                                <span className="text-[10px] text-gray-500 font-bold uppercase">unids</span>
                            </div>
                        ) : (
                            <div className="inline-flex items-center gap-2">
                                <span className="px-3 py-0.5 bg-[#1d1d1f] text-white text-sm md:text-base font-bold rounded shadow-sm min-w-[2.5rem]">{draft.photoCount}</span>
                                <span className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest">unidades</span>
                            </div>
                        )}
                        <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest mt-2">
                            {unitPrice} / unidade
                        </p>
                    </div>
                </div>

                {/* Features */}
                <div className="w-full text-left">
                    <p className="text-[9px] md:text-[10px] font-bold text-[#B8860B] uppercase tracking-[0.2em] mb-3 md:mb-4 flex items-center gap-2">
                        <CheckCircle size={12} /> Benefícios
                    </p>
                    <ul className="space-y-2 mb-4">
                        {draft.features?.map((feat, i) => (
                            <li key={i} className="flex items-center gap-3 text-xs text-gray-600 group w-full">
                                {isEditing ? (
                                    <>
                                        <button onClick={() => removeFeature(i)} className="text-red-300 hover:text-red-500 transition-colors"><X size={12}/></button>
                                        <input 
                                            value={feat}
                                            onChange={e => updateFeature(i, e.target.value)}
                                            className="flex-1 bg-gray-50 border-b border-transparent focus:border-[#B8860B] outline-none px-2 py-1 text-xs rounded"
                                        />
                                    </>
                                ) : (
                                    <div className="flex items-center gap-2 w-full bg-gray-50/50 p-2 rounded-lg">
                                        <div className="w-1 h-1 rounded-full bg-gray-300 shrink-0"></div>
                                        <span className="font-light leading-relaxed truncate">{feat}</span>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                    
                    {isEditing && (
                        <div className="flex gap-2 animate-fade-in mt-2">
                            <input 
                                value={newFeature}
                                onChange={e => setNewFeature(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && addFeature()}
                                placeholder="Novo benefício..."
                                className="flex-1 text-[10px] border border-gray-200 bg-white rounded-lg px-3 py-2 outline-none focus:border-[#B8860B] transition-all shadow-sm"
                            />
                            <button onClick={addFeature} className="bg-[#1d1d1f] text-white w-9 h-9 flex items-center justify-center rounded-lg hover:bg-black transition-colors shadow-sm"><Plus size={14}/></button>
                        </div>
                    )}
                </div>

                {/* Footer Delete */}
                <div className="mt-4 md:mt-6 pt-3 md:pt-4 border-t border-gray-50 w-full text-center">
                    <button 
                        onClick={onDelete}
                        className="text-[9px] font-bold text-gray-300 hover:text-red-500 uppercase tracking-[0.2em] transition-colors flex items-center justify-center gap-2 mx-auto group"
                    >
                        <Trash2 size={12} className="group-hover:scale-110 transition-transform"/> Excluir Kit
                    </button>
                </div>
            </div>
        </div>
    );
};

const AdminPricing: React.FC<AdminPricingProps> = ({ localRules, setLocalRules }) => {
    const handleUpdateTier = (updatedTier: ProductTier) => {
        const newTiers = localRules.map(t => t.id === updatedTier.id ? updatedTier : t);
        setLocalRules(newTiers);
    };
  
    const handleToggleRecommended = (id: string) => {
        const newTiers = localRules.map(t => ({ ...t, isRecommended: t.id === id ? !t.isRecommended : false }));
        setLocalRules(newTiers);
    };
  
    const handleAddTier = () => {
        if (localRules.length >= 4) {
            alert("Máximo de 4 kits permitidos.");
            return;
        }
        const newTier: ProductTier = {
            id: `tier-${Date.now()}`,
            name: 'Novo Kit',
            photoCount: 12,
            price: 49.90,
            isRecommended: false,
            features: ['Impressão Fine Art', 'Acabamento Premium']
        };
        setLocalRules([...localRules, newTier]);
    };
  
    const handleRemoveTier = (id: string) => {
        if (localRules.length <= 1) {
            alert("É necessário ter pelo menos 1 kit ativo.");
            return;
        }
        if (window.confirm("Tem certeza que deseja remover este kit?")) {
            setLocalRules(localRules.filter(t => t.id !== id));
        }
    };

    return (
        <div className="animate-fade-in pb-20">
            {/* Header removido daqui pois agora é global no Dashboard */}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
                {localRules.map(tier => (
                    <PricingCard 
                        key={tier.id}
                        tier={tier}
                        onUpdate={handleUpdateTier}
                        onDelete={() => handleRemoveTier(tier.id)}
                        onToggleRec={() => handleToggleRecommended(tier.id)}
                    />
                ))}
                
                {localRules.length < 4 && (
                    <button 
                        onClick={handleAddTier} 
                        className="border-2 border-dashed border-gray-200 rounded-[20px] flex flex-col items-center justify-center text-gray-400 hover:border-[#B8860B] hover:text-[#B8860B] hover:bg-white transition-all bg-gray-50/50 min-h-[350px] md:min-h-[500px] group gap-4"
                    >
                        <div className="w-14 h-14 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform text-gray-300 group-hover:text-[#B8860B]">
                            <Plus size={28}/>
                        </div>
                        <span className="font-bold text-xs uppercase tracking-[0.2em]">Adicionar Novo Kit</span>
                    </button>
                )}
            </div>
        </div>
    );
};

export default AdminPricing;
