
import React, { useEffect } from 'react';
import { LayoutGrid, Layers, Leaf, Heart, ArrowRight, Truck, Info, Check, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getSiteContent } from '../services/mockService';

// Helper para renderizar ícone dinâmico
const CMSIcon = ({ name, size = 32 }: { name: string, size?: number }) => {
    const icons: any = { Layers, Leaf, Heart, Truck, LayoutGrid, Info, Check };
    const IconComponent = icons[name] || LayoutGrid;
    return <IconComponent size={size} strokeWidth={1.5} />;
};

// Helper para pegar conteúdo
const usePageContent = (pageId: string) => {
    const content = getSiteContent();
    const page = content.find(p => p.id === pageId);
    
    const getField = (sectionId: string, key: string) => {
        const section = page?.sections.find(s => s.id === sectionId);
        return section?.fields.find(f => f.key === key)?.value || '';
    };

    return { getField };
};

const InstitutionalHeader: React.FC<{ title: string; subtitle: string; bgImage: string }> = ({ title, subtitle, bgImage }) => (
    <div className="relative h-[60vh] flex items-center justify-center overflow-hidden">
        <img src={bgImage} className="absolute inset-0 w-full h-full object-cover animate-fade-in" alt={title} />
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>
        <div className="relative z-10 text-center px-6 animate-fade-in">
            <div className="inline-flex items-center gap-2 border border-white/30 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-white text-[10px] font-bold uppercase tracking-[0.2em] mb-6 shadow-sm">
                <Sparkles size={12} /> {subtitle}
            </div>
            <h1 className="text-5xl md:text-7xl font-serif text-white font-medium mb-6 tracking-tight">{title}</h1>
        </div>
    </div>
);

const Section: React.FC<{ title: string; children: React.ReactNode; reverse?: boolean; image?: string }> = ({ title, children, reverse, image }) => (
    <div className={`py-24 px-6 ${reverse ? 'bg-[#F5F5F7]' : 'bg-white'}`}>
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-center gap-16">
            <div className={`flex-1 space-y-8 ${reverse ? 'md:order-2' : ''}`}>
                <h2 className="text-4xl font-serif text-[#1d1d1f] relative inline-block">
                    {title}
                    <span className="absolute -bottom-2 left-0 w-12 h-1 bg-[#B8860B]"></span>
                </h2>
                <div className="text-[#86868b] leading-loose font-light text-lg space-y-6 whitespace-pre-wrap text-justify">
                    {children}
                </div>
            </div>
            {image && (
                <div className={`flex-1 w-full ${reverse ? 'md:order-1' : ''}`}>
                    <div className="relative p-4">
                        <div className="absolute inset-0 border-2 border-[#1d1d1f]/5 translate-x-4 translate-y-4 rounded-xl"></div>
                        <img src={image} alt={title} className="w-full h-auto rounded-xl shadow-2xl relative z-10 aspect-[4/3] object-cover" />
                    </div>
                </div>
            )}
        </div>
    </div>
);

export const OurHistory = () => {
    useEffect(() => { window.scrollTo(0, 0); }, []);
    const { getField } = usePageContent('history');

    return (
        <div className="bg-white">
            <InstitutionalHeader 
                title={getField('header', 'title')} 
                subtitle={getField('header', 'subtitle')}
                bgImage={getField('header', 'bg_image')}
            />
            <Section title={getField('section_1', 'title')} image={getField('section_1', 'image')}>
                {getField('section_1', 'content')}
            </Section>
            <Section title={getField('section_2', 'title')} reverse image={getField('section_2', 'image')}>
                {getField('section_2', 'content')}
            </Section>
            <div className="bg-[#1d1d1f] py-24 text-center">
                <h2 className="text-4xl font-serif text-white mb-8">Faça parte da nossa história</h2>
                <Link to="/studio" className="inline-flex items-center gap-3 px-10 py-4 bg-[#B8860B] text-white rounded-md font-bold uppercase tracking-widest hover:bg-[#966d09] transition-all shadow-lg hover:-translate-y-1">
                    Criar Memórias <ArrowRight size={16}/>
                </Link>
            </div>
        </div>
    );
};

export const ProductionProcess = () => {
    useEffect(() => { window.scrollTo(0, 0); }, []);
    const { getField } = usePageContent('process');

    const steps = [1, 2, 3].map(num => ({
        id: num,
        title: getField('steps', `step_${num}_title`),
        desc: getField('steps', `step_${num}_desc`),
        icon: getField('steps', `step_${num}_icon`),
    }));

    return (
        <div className="bg-white">
            <InstitutionalHeader 
                title={getField('header', 'title')} 
                subtitle={getField('header', 'subtitle')}
                bgImage={getField('header', 'bg_image')}
            />
            
            {/* Timeline Section */}
            <div className="py-24 bg-white relative overflow-hidden">
                <div className="max-w-[1000px] mx-auto px-6 relative z-10">
                    
                    {/* Linha Central (Desktop) */}
                    <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-gray-200 -translate-x-1/2"></div>

                    <div className="space-y-16 md:space-y-0">
                        {steps.map((step, i) => {
                            const isEven = (i + 1) % 2 === 0;
                            return (
                                <div key={step.id} className={`flex flex-col md:flex-row items-center gap-8 md:gap-0 relative ${isEven ? 'md:flex-row-reverse' : ''}`}>
                                    
                                    {/* Texto */}
                                    <div className={`flex-1 w-full md:w-1/2 ${isEven ? 'md:pl-16 text-center md:text-left' : 'md:pr-16 text-center md:text-right'}`}>
                                        <div className="inline-block mb-4">
                                            <span className="text-6xl font-serif text-[#B8860B]/10 font-bold absolute -top-8 -z-10 select-none scale-150">0{step.id}</span>
                                            <h3 className="font-serif font-bold text-2xl text-[#1d1d1f] relative z-10">{step.title}</h3>
                                        </div>
                                        <p className="text-[#86868b] font-light leading-relaxed text-base">{step.desc}</p>
                                    </div>

                                    {/* Ícone Central */}
                                    <div className="relative shrink-0 z-20">
                                        <div className="w-16 h-16 bg-white rounded-full border border-gray-100 shadow-xl flex items-center justify-center text-[#B8860B] relative z-10">
                                            <CMSIcon name={step.icon} size={28} />
                                        </div>
                                        {/* Dot de conexão para Mobile */}
                                        <div className="md:hidden absolute top-16 left-1/2 -translate-x-1/2 w-px h-16 bg-gray-200 -z-10"></div>
                                    </div>

                                    {/* Espaço Vazio para equilíbrio */}
                                    <div className="flex-1 hidden md:block"></div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Quality Details - Layout Alternativo */}
            <div className="py-24 bg-[#F9F9FA] border-t border-gray-100">
                <div className="max-w-[1200px] mx-auto px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div className="relative group">
                            <div className="absolute -inset-4 bg-[#B8860B] rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>
                            <img 
                                src={getField('details', 'image')} 
                                alt="Detalhe de Qualidade" 
                                className="w-full h-[500px] object-cover rounded-xl shadow-2xl relative z-10 grayscale group-hover:grayscale-0 transition-all duration-700"
                            />
                            {/* Card Flutuante */}
                            <div className="absolute bottom-8 right-8 bg-white p-6 rounded-lg shadow-xl max-w-xs z-20 border border-gray-50 hidden md:block">
                                <p className="font-serif font-bold text-xl text-[#1d1d1f] mb-2">0.8mm</p>
                                <p className="text-xs text-gray-500 uppercase tracking-widest">Espessura Premium</p>
                            </div>
                        </div>
                        
                        <div>
                            <span className="text-[#B8860B] font-bold text-[10px] uppercase tracking-[0.3em] mb-4 block">Acabamento</span>
                            <h2 className="text-4xl font-serif text-[#1d1d1f] mb-8 leading-tight">{getField('details', 'title')}</h2>
                            <div className="text-[#86868b] leading-loose font-light text-lg space-y-6 text-justify whitespace-pre-wrap">
                                {getField('details', 'content')}
                            </div>
                            
                            <div className="mt-10 grid grid-cols-2 gap-6">
                                <div className="flex items-start gap-3">
                                    <Check className="text-[#B8860B] mt-1 shrink-0" size={18} />
                                    <div>
                                        <h4 className="font-bold text-[#1d1d1f] text-sm uppercase tracking-wide mb-1">Corte Preciso</h4>
                                        <p className="text-xs text-gray-500">Lâminas de alta performance</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Check className="text-[#B8860B] mt-1 shrink-0" size={18} />
                                    <div>
                                        <h4 className="font-bold text-[#1d1d1f] text-sm uppercase tracking-wide mb-1">Manta Total</h4>
                                        <p className="text-xs text-gray-500">Verso 100% imantado</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const Sustainability = () => {
    useEffect(() => { window.scrollTo(0, 0); }, []);
    const { getField } = usePageContent('sustainability');

    const points = [1, 2, 3, 4].map(num => ({
        title: getField('points', `p${num}_title`),
        desc: getField('points', `p${num}_desc`),
        icon: getField('points', `p${num}_icon`),
    }));

    return (
        <div className="bg-white">
            <InstitutionalHeader 
                title={getField('header', 'title')} 
                subtitle={getField('header', 'subtitle')}
                bgImage={getField('header', 'bg_image')}
            />
            <div className="max-w-4xl mx-auto px-6 py-24 text-center">
                <h2 className="text-3xl md:text-4xl font-serif text-[#1d1d1f] mb-8">{getField('intro', 'headline')}</h2>
                <p className="text-lg text-[#86868b] font-light leading-relaxed mb-16 whitespace-pre-wrap">
                    {getField('intro', 'text')}
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                    {points.map((p, i) => (
                        <div key={i} className="flex gap-6 group p-6 rounded-xl hover:bg-[#F9F9FA] transition-colors border border-transparent hover:border-gray-100">
                            <div className="shrink-0 text-[#B8860B] bg-white p-3 rounded-full shadow-sm border border-gray-50 h-fit group-hover:scale-110 transition-transform">
                                <CMSIcon name={p.icon} size={24}/>
                            </div>
                            <div>
                                <h3 className="font-bold text-[#1d1d1f] uppercase tracking-widest mb-2 text-sm">{p.title}</h3>
                                <p className="text-[#86868b] text-sm font-light leading-relaxed">{p.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
