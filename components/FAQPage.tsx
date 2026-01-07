
import React, { useState, useEffect } from 'react';
import { ChevronDown, HelpCircle, Package, Truck, CreditCard, Camera, Info } from 'lucide-react';
import { getFAQs } from '../services/mockService';
import { FAQ } from '../types';

const FAQItem = ({ question, answer }: { question: string, answer: string }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border-b border-gray-100 last:border-0">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center py-6 text-left group transition-colors"
            >
                <span className={`font-serif text-lg ${isOpen ? 'text-[#B8860B]' : 'text-[#1d1d1f] group-hover:text-[#B8860B]'}`}>
                    {question}
                </span>
                <div className={`p-2 rounded-full transition-all duration-300 ${isOpen ? 'bg-[#B8860B] text-white rotate-180' : 'bg-gray-50 text-gray-400 group-hover:bg-[#1d1d1f] group-hover:text-white'}`}>
                    <ChevronDown size={16} />
                </div>
            </button>
            <div 
                className={`overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? 'max-h-96 opacity-100 mb-6' : 'max-h-0 opacity-0'}`}
            >
                <p className="text-[#86868b] font-light leading-relaxed text-sm md:text-base pr-8">
                    {answer}
                </p>
            </div>
        </div>
    );
};

const FAQCategory = ({ title, icon: Icon, questions }: { title: string, icon: any, questions: FAQ[] }) => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
        <div className="flex items-center gap-3 mb-8 border-b border-gray-50 pb-4">
            <div className="w-10 h-10 rounded-lg bg-[#F5F5F7] flex items-center justify-center text-[#B8860B]">
                <Icon size={20} />
            </div>
            <h2 className="text-xl font-bold text-[#1d1d1f] uppercase tracking-widest text-[12px]">{title}</h2>
        </div>
        <div>
            {questions.map((item) => (
                <FAQItem key={item.id} question={item.question} answer={item.answer} />
            ))}
        </div>
    </div>
);

const FAQPage = () => {
    const [faqs, setFaqs] = useState<FAQ[]>([]);

    useEffect(() => { 
        window.scrollTo(0, 0); 
        setFaqs(getFAQs().filter(f => f.isActive));
    }, []);

    // Helper to map category name to icon
    const getIconForCategory = (category: string) => {
        if (category.includes('Pedidos') || category.includes('Criação')) return Camera;
        if (category.includes('Produção') || category.includes('Qualidade')) return Package;
        if (category.includes('Envio') || category.includes('Entrega')) return Truck;
        if (category.includes('Pagamento')) return CreditCard;
        return Info; // Default
    };

    // Group FAQs by category
    const groupedFaqs = faqs.reduce((groups, faq) => {
        const category = faq.category;
        if (!groups[category]) {
            groups[category] = [];
        }
        groups[category].push(faq);
        return groups;
    }, {} as Record<string, FAQ[]>);

    return (
        <div className="bg-[#F5F5F7] min-h-screen">
            {/* Header */}
            <div className="relative h-[50vh] flex items-center justify-center overflow-hidden bg-[#1d1d1f]">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1555421689-491a97ff2040?q=80&w=1600&auto=format&fit=crop')] bg-cover bg-center opacity-40"></div>
                <div className="relative z-10 text-center px-6 animate-fade-in">
                    <span className="text-[#B8860B] font-bold text-xs uppercase tracking-[0.4em] block mb-4">Central de Ajuda</span>
                    <h1 className="text-4xl md:text-6xl font-serif text-white font-medium mb-6">Perguntas Frequentes</h1>
                    <p className="text-white/60 font-light max-w-xl mx-auto text-lg">Tire suas dúvidas sobre nossos produtos, prazos e processos.</p>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-6 py-24 -mt-20 relative z-20">
                {Object.keys(groupedFaqs).map((category, idx) => (
                    <div key={idx} className="animate-fade-in" style={{ animationDelay: `${idx * 100}ms` }}>
                        <FAQCategory 
                            title={category} 
                            icon={getIconForCategory(category)} 
                            questions={groupedFaqs[category]} 
                        />
                    </div>
                ))}

                <div className="bg-[#1d1d1f] rounded-2xl p-12 text-center text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#B8860B]/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    <div className="relative z-10">
                        <HelpCircle size={48} className="mx-auto mb-6 text-[#B8860B]" />
                        <h3 className="text-2xl font-serif font-bold mb-4">Ainda tem dúvidas?</h3>
                        <p className="text-white/60 mb-8 font-light">Nossa equipe de suporte está pronta para te atender.</p>
                        <a href="/contact" className="inline-block bg-white text-[#1d1d1f] px-8 py-3 rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-[#B8860B] hover:text-white transition-all shadow-lg">
                            Fale Conosco
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FAQPage;
