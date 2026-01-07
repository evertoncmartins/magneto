
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPricingRules } from '../services/mockService';
import { ProductTier } from '../types';
import { Check, Star, ArrowRight, Sparkles, Box, Crown, Image as ImageIcon } from 'lucide-react';

const PricingSelection: React.FC = () => {
    const navigate = useNavigate();
    const [tiers, setTiers] = useState<ProductTier[]>([]);

    useEffect(() => {
        const rules = getPricingRules();
        setTiers(rules);
        
        // Se houver apenas 1 opção, pular seleção e ir direto pro Studio
        if (rules.length === 1) {
            navigate('/studio/upload', { state: { tier: rules[0] } });
        }
    }, [navigate]);

    const handleSelectTier = (tier: ProductTier) => {
        navigate('/studio/upload', { state: { tier } });
    };

    if (tiers.length === 0) return null;

    return (
        <div className="min-h-screen bg-[#F5F5F7] pt-32 pb-24 px-6 flex flex-col items-center">
            <div className="text-center max-w-3xl mb-16 animate-fade-in">
                <span className="text-[#B8860B] font-bold text-[10px] uppercase tracking-[0.3em] mb-4 block">Coleções Exclusivas</span>
                <h1 className="text-4xl md:text-5xl font-serif text-[#1d1d1f] mb-6">Escolha o tamanho da sua história.</h1>
                <p className="text-[#86868b] font-light text-lg">Kits de ímãs Fine Art prontos para transformar seu ambiente.</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 items-center justify-center w-full max-w-7xl animate-fade-in px-4">
                {tiers.map((tier, index) => {
                    const isRecommended = tier.isRecommended;
                    // Se for recomendado, usa estilo Gold/Premium. Se não, estilo Clean/White.
                    const containerClasses = isRecommended 
                        ? 'relative bg-white rounded-2xl w-full lg:w-96 shadow-2xl scale-105 z-10 border-2 border-[#B8860B] flex flex-col overflow-hidden'
                        : 'relative bg-white rounded-2xl w-full lg:w-80 shadow-md border border-gray-100 hover:shadow-xl hover:-translate-y-2 opacity-90 hover:opacity-100 flex flex-col transition-all duration-300';

                    return (
                        <div key={tier.id} className={containerClasses}>
                            {/* Badge de Recomendado */}
                            {isRecommended && (
                                <div className="absolute top-0 inset-x-0 bg-[#B8860B] text-white text-center py-2">
                                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2">
                                        <Sparkles size={12} fill="currentColor" /> Mais Vendido
                                    </span>
                                </div>
                            )}

                            <div className={`p-8 md:p-10 flex-1 flex flex-col ${isRecommended ? 'pt-12' : ''}`}>
                                {/* Header do Card */}
                                <div className="text-center mb-8">
                                    <h3 className="text-xl font-bold text-[#1d1d1f] uppercase tracking-widest mb-4 flex items-center justify-center gap-2">
                                        {isRecommended && <Crown size={18} className="text-[#B8860B]" />}
                                        {tier.name}
                                    </h3>
                                    
                                    <div className="flex items-center justify-center gap-4 mb-6">
                                        <div className="w-16 h-16 rounded-2xl bg-[#F5F5F7] flex items-center justify-center text-[#1d1d1f] shadow-inner">
                                            <span className="font-serif font-bold text-2xl">{tier.photoCount}</span>
                                        </div>
                                        <div className="text-left">
                                            <p className="text-xs font-bold text-[#1d1d1f] uppercase tracking-wide">Ímãs</p>
                                            <p className="text-[10px] text-[#86868b] uppercase tracking-widest">Formato 5x5cm</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-center gap-1 mb-2">
                                        <span className="text-sm font-bold text-gray-400 self-start mt-2">R$</span>
                                        <span className="text-6xl font-serif font-bold text-[#1d1d1f]">{Math.floor(tier.price)}</span>
                                        <div className="flex flex-col items-start justify-end h-14 pb-2">
                                            <span className="text-lg font-bold text-[#1d1d1f] leading-none">,{tier.price.toFixed(2).split('.')[1]}</span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-[#86868b] font-medium bg-gray-50 py-1 px-3 rounded-full inline-block">
                                        Apenas R$ {(tier.price / tier.photoCount).toFixed(2)} por ímã
                                    </p>
                                </div>

                                {/* Divider */}
                                <div className="w-full h-px bg-gray-100 mb-8 relative">
                                    <div className="absolute left-1/2 -translate-x-1/2 -top-2 bg-white px-2 text-gray-300">
                                        <ImageIcon size={14} />
                                    </div>
                                </div>

                                {/* Features List */}
                                <ul className="space-y-4 flex-1 mb-8">
                                    {tier.features?.map((feature, i) => (
                                        <li key={i} className="flex items-start gap-3 text-sm text-[#1d1d1f]">
                                            <div className={`mt-0.5 rounded-full p-0.5 ${isRecommended ? 'bg-[#B8860B] text-white' : 'bg-gray-200 text-gray-500'}`}>
                                                <Check size={10} strokeWidth={3} />
                                            </div>
                                            <span className="font-light">{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                {/* CTA Button */}
                                <button 
                                    onClick={() => handleSelectTier(tier)}
                                    className={`w-full py-5 rounded-lg font-bold text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-lg active:scale-95
                                        ${isRecommended 
                                            ? 'bg-[#1d1d1f] text-white hover:bg-black hover:shadow-2xl' 
                                            : 'bg-white border-2 border-[#1d1d1f] text-[#1d1d1f] hover:bg-[#1d1d1f] hover:text-white'
                                        }
                                    `}
                                >
                                    Selecionar Kit <ArrowRight size={14} />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
            
            <div className="mt-16 flex items-center gap-2 text-[#86868b] text-[10px] uppercase tracking-widest font-bold opacity-60">
                <Box size={14} />
                Envio seguro para todo o Brasil
            </div>
        </div>
    );
};

export default PricingSelection;
