
import React, { useState, useEffect } from 'react';
import { ChevronDown, Mail, ArrowRight, Camera, Package, Truck, CreditCard, Info } from 'lucide-react';
import { getFAQs, getSiteContent } from '../services/mockService';
import { FAQ } from '../types';
import { Link } from 'react-router-dom';

// Cabeçalho institucional padronizado
const InstitutionalHeader: React.FC<{ title: string; subtitle: string; bgImage: string }> = ({ title, subtitle, bgImage }) => (
    <div className="relative h-[50vh] md:h-[60vh] flex items-center justify-center overflow-hidden">
        <img src={bgImage} className="absolute inset-0 w-full h-full object-cover" alt={title} />
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"></div>
        <div className="relative z-10 text-center px-6 animate-fade-in">
            <span className="text-[#B8860B] font-bold text-xs uppercase tracking-[0.4em] block mb-4">{subtitle}</span>
            <h1 className="text-4xl md:text-7xl font-serif text-white font-medium mb-6">{title}</h1>
            <div className="w-24 h-1 bg-[#B8860B] mx-auto"></div>
        </div>
    </div>
);

const FAQItem = ({ question, answer }: { question: string, answer: string }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border-b border-gray-100 last:border-0 group">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center py-6 text-left focus:outline-none"
            >
                <span className={`font-medium text-lg transition-colors pr-8 ${isOpen ? 'text-[#B8860B]' : 'text-[#1d1d1f] group-hover:text-[#4a4a4a]'}`}>
                    {question}
                </span>
                <div className={`transition-transform duration-300 flex-shrink-0 ${isOpen ? 'rotate-180 text-[#B8860B]' : 'text-gray-300'}`}>
                    <ChevronDown size={20} strokeWidth={2} />
                </div>
            </button>
            <div 
                className={`overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? 'max-h-96 opacity-100 pb-8' : 'max-h-0 opacity-0'}`}
            >
                <p className="text-[#86868b] leading-relaxed font-light text-base max-w-4xl">
                    {answer}
                </p>
            </div>
        </div>
    );
};

const FAQPage = () => {
    const [faqs, setFaqs] = useState<FAQ[]>([]);
    const [activeCategory, setActiveCategory] = useState<string>('Todos');
    const [cmsData, setCmsData] = useState<any>({ title: '', subtitle: '', bg: '' });

    useEffect(() => { 
        window.scrollTo(0, 0); 
        const loadedFaqs = getFAQs().filter(f => f.isActive);
        setFaqs(loadedFaqs);

        // Load CMS Data
        const content = getSiteContent();
        const faqPage = content.find(p => p.id === 'faq-page');
        const header = faqPage?.sections.find(s => s.id === 'header');
        
        setCmsData({
            title: header?.fields.find(f => f.key === 'title')?.value || 'Perguntas Frequentes',
            subtitle: header?.fields.find(f => f.key === 'subtitle')?.value || 'Suporte',
            bg: header?.fields.find(f => f.key === 'bg_image')?.value || ''
        });
    }, []);

    // Helper para ícones
    const getCategoryIcon = (categoryName: string) => {
        if (categoryName.includes('Pedidos') || categoryName.includes('Criação')) return Camera;
        if (categoryName.includes('Produção') || categoryName.includes('Qualidade')) return Package;
        if (categoryName.includes('Envio') || categoryName.includes('Entrega')) return Truck;
        if (categoryName.includes('Pagamento')) return CreditCard;
        return Info;
    };

    // Extrai categorias únicas dinamicamente (para as abas)
    // Usamos Set para garantir unicidade, mas mantemos a ordem de aparição ou alfabética se preferir
    const uniqueCategories = Array.from(new Set(faqs.map(f => f.category)));
    const categoriesForTabs = ['Todos', ...uniqueCategories];

    return (
        <div className="bg-white min-h-screen">
            <InstitutionalHeader 
                title={cmsData.title} 
                subtitle={cmsData.subtitle}
                bgImage={cmsData.bg}
            />

            {/* Navegação Horizontal Sticky (Abas) */}
            <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm transition-all">
                <div className="max-w-[1200px] mx-auto px-6">
                    <div className="flex overflow-x-auto scrollbar-hide gap-8 md:gap-12">
                        {categoriesForTabs.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => {
                                    setActiveCategory(cat);
                                    window.scrollTo({ top: window.innerHeight * 0.5, behavior: 'smooth' });
                                }}
                                className={`text-xs font-bold uppercase tracking-[0.2em] whitespace-nowrap transition-all py-6 border-b-2 ${
                                    activeCategory === cat 
                                    ? 'text-[#B8860B] border-[#B8860B]' 
                                    : 'text-gray-400 border-transparent hover:text-[#1d1d1f]'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Conteúdo das Perguntas */}
            <div className="max-w-[1000px] mx-auto px-6 py-16 md:py-24 min-h-[50vh]">
                <div className="animate-fade-in space-y-16">
                    
                    {/* LÓGICA DE EXIBIÇÃO: SE 'TODOS', AGRUPA. SE ESPECÍFICO, LISTA. */}
                    {activeCategory === 'Todos' ? (
                        uniqueCategories.map((catName) => {
                            const catFaqs = faqs.filter(f => f.category === catName);
                            if (catFaqs.length === 0) return null;
                            const Icon = getCategoryIcon(catName);

                            return (
                                <div key={catName} className="scroll-mt-32">
                                    {/* Cabeçalho da Seção (Apenas visual, sem separadores pesados) */}
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-12 h-12 rounded-full bg-[#F5F5F7] flex items-center justify-center text-[#B8860B] shrink-0">
                                            <Icon size={20} strokeWidth={2} />
                                        </div>
                                        <h3 className="text-xl font-bold text-[#1d1d1f] uppercase tracking-widest">{catName}</h3>
                                    </div>
                                    
                                    <div className="pl-0 md:pl-4">
                                        {catFaqs.map((faq) => (
                                            <FAQItem key={faq.id} question={faq.question} answer={faq.answer} />
                                        ))}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        // Visualização de Categoria Única
                        <div>
                            {faqs.filter(f => f.category === activeCategory).length > 0 ? (
                                faqs
                                    .filter(f => f.category === activeCategory)
                                    .map((faq) => (
                                        <FAQItem key={faq.id} question={faq.question} answer={faq.answer} />
                                    ))
                            ) : (
                                <div className="text-center py-20">
                                    <p className="text-gray-400 font-light text-lg">Nenhuma pergunta encontrada nesta categoria.</p>
                                </div>
                            )}
                        </div>
                    )}

                </div>
            </div>

            {/* CTA Final (Fundo Preto / Botão Branco) */}
            <div className="bg-[#1d1d1f] py-24 px-6 border-t border-gray-800">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/10 text-[#B8860B] mb-8 shadow-sm border border-white/10">
                        <Mail size={32} strokeWidth={1.5} />
                    </div>
                    <h2 className="text-3xl md:text-4xl font-serif text-white mb-6">Ainda tem dúvidas?</h2>
                    <p className="text-white/60 font-light text-lg mb-12 max-w-xl mx-auto leading-relaxed">
                        Nossa equipe de especialistas está pronta para ajudar você a criar a galeria perfeita.
                    </p>
                    <Link 
                        to="/contact" 
                        className="inline-flex items-center gap-4 px-12 py-5 bg-white text-[#1d1d1f] rounded-md font-bold text-xs uppercase tracking-[0.2em] hover:bg-gray-100 transition-all shadow-xl hover:-translate-y-1"
                    >
                        Fale Conosco <ArrowRight size={16} />
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default FAQPage;
