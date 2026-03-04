
import React, { useEffect } from 'react';
import * as Icons from 'lucide-react';
import { Link } from 'react-router-dom';
import { getSiteContent, PageField } from '../services/mockService';
import ReactMarkdown from 'react-markdown';

// Helper para obter ícone dinamicamente
const getIcon = (name: string) => {
    // @ts-ignore
    const IconComponent = Icons[name];
    return IconComponent || Icons.Info;
};

const LegalLayout: React.FC<{ title: string; subtitle: string; icon: any; children: React.ReactNode }> = ({ title, subtitle, icon: Icon, children }) => {
    useEffect(() => { window.scrollTo(0, 0); }, []);
    
    return (
        <div className="min-h-screen bg-white">
            {/* Cabeçalho Preto Sólido */}
            <div className="bg-[#1d1d1f] w-full pt-36 pb-20 md:pt-48 md:pb-24 flex flex-col items-center justify-center text-center px-6">
                <div className="animate-fade-in max-w-4xl mx-auto">
                    <div className="inline-flex items-center justify-center p-3 mb-6 rounded-full border border-white/10 bg-white/5 text-[#B8860B]">
                        <Icon size={24} strokeWidth={1.5} />
                    </div>
                    <span className="block text-[#B8860B] font-bold text-xs uppercase tracking-[0.4em] mb-4">{subtitle}</span>
                    <h1 className="text-3xl md:text-5xl font-serif text-white font-medium leading-tight">{title}</h1>
                </div>
            </div>

            {/* Conteúdo - Direto na página */}
            <div className="max-w-[900px] mx-auto px-6 py-16">
                <div className="animate-fade-in">
                    <div className="prose prose-lg max-w-none text-[#1d1d1f] prose-headings:font-serif prose-headings:font-bold prose-headings:text-[#1d1d1f] prose-p:text-[#6e6e73] prose-p:font-light prose-p:leading-loose prose-li:text-[#6e6e73] prose-strong:text-[#1d1d1f] prose-strong:font-bold">
                        {children}
                    </div>
                </div>
            </div>

            {/* Seção de Fechamento / Dúvidas */}
            <div className="bg-[#1d1d1f] py-24 text-center border-t border-gray-800">
                <div className="max-w-4xl mx-auto px-6">
                    <h2 className="text-3xl md:text-4xl font-serif text-white mb-6">Restou alguma dúvida?</h2>
                    <p className="text-white/60 font-light text-lg mb-10 max-w-xl mx-auto leading-relaxed">
                        A transparência é a base da nossa relação. Se precisar de esclarecimentos sobre qualquer ponto, nossa equipe está à disposição.
                    </p>
                    <Link 
                        to="/contact"
                        className="inline-flex items-center gap-3 px-10 py-4 bg-[#B8860B] text-white rounded-md font-bold text-xs uppercase tracking-widest hover:bg-[#966d09] transition-all shadow-lg hover:-translate-y-1"
                    >
                        Fale Conosco <Icons.ArrowRight size={16} />
                    </Link>
                </div>
            </div>
        </div>
    );
};

// Box de Destaque com Ícone (Estilo Solicitado)
const HighlightBox = ({ icon: Icon, title, children }: { icon?: any, title?: string, children: React.ReactNode }) => (
    <div className="bg-[#FFF9E6] border-l-4 border-[#B8860B] p-6 my-10 rounded-r-lg flex flex-col md:flex-row gap-5 items-start shadow-sm">
        {Icon && (
            <div className="shrink-0 text-[#B8860B] bg-white/60 p-2 rounded-full mt-1">
                <Icon size={24} />
            </div>
        )}
        <div className="flex-1">
            {title && <h4 className="text-[#856404] font-bold text-xs uppercase tracking-widest mb-2">{title}</h4>}
            <div className="text-[#856404] text-sm font-medium m-0 leading-relaxed">
                {children}
            </div>
        </div>
    </div>
);

// Bloco Informativo Diagramado (Estilo imagem FSC)
const InfoBlock = ({ icon: Icon, title, children }: { icon: any, title: string, children: React.ReactNode }) => (
    <div className="flex gap-5 items-start p-4 not-prose">
        <div className="text-[#B8860B] shrink-0 mt-1">
            <Icon size={28} strokeWidth={1.5} />
        </div>
        <div>
            <h4 className="font-bold text-[#1d1d1f] text-xs uppercase tracking-widest mb-2">{title}</h4>
            <div className="text-sm text-[#6e6e73] leading-relaxed font-light m-0">{children}</div>
        </div>
    </div>
);

// Helper para processar seções dinâmicas
const getDynamicSections = (fields: PageField[]) => {
    const sectionsMap = new Map<number, { title: string, text: string }>();
    
    fields.forEach(field => {
        const match = field.key.match(/^section_(\d+)_/);
        if (match) {
            const sectionNum = parseInt(match[1]);
            const current = sectionsMap.get(sectionNum) || { title: '', text: '' };
            
            if (field.key.endsWith('_title')) current.title = field.value;
            if (field.key.endsWith('_text')) current.text = field.value;
            
            sectionsMap.set(sectionNum, current);
        }
    });

    return Array.from(sectionsMap.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([num, content]) => ({ num, ...content }));
};

export const PrivacyPolicy = () => {
    const content = getSiteContent();
    const privacyPage = content.find(p => p.id === 'privacy');
    const section = privacyPage?.sections.find(s => s.id === 'content');
    
    const highlight = section?.fields.find(f => f.key === 'highlight')?.value;
    const dynamicSections = section ? getDynamicSections(section.fields) : [];

    return (
        <LegalLayout title="Política de Privacidade" subtitle="Lei Geral de Proteção de Dados (LGPD)" icon={Icons.Lock}>
            
            {highlight && (
                <HighlightBox icon={Icons.Shield}>
                    <ReactMarkdown>{highlight}</ReactMarkdown>
                </HighlightBox>
            )}
            
            {dynamicSections.map(sec => (
                <div key={sec.num}>
                    <h3 className="text-2xl mt-12 mb-6">{sec.title}</h3>
                    <ReactMarkdown>{sec.text}</ReactMarkdown>
                </div>
            ))}
        </LegalLayout>
    );
};

export const TermsOfUse = () => {
    const content = getSiteContent();
    const termsPage = content.find(p => p.id === 'terms');
    const section = termsPage?.sections.find(s => s.id === 'content');

    const intro = section?.fields.find(f => f.key === 'intro')?.value;
    const highlight = section?.fields.find(f => f.key === 'highlight')?.value;
    const dynamicSections = section ? getDynamicSections(section.fields) : [];

    return (
        <LegalLayout title="Termos de Uso" subtitle="Regras de Utilização" icon={Icons.FileText}>
            {intro && (
                <div className="lead text-lg mb-12 text-[#1d1d1f] font-medium">
                    <ReactMarkdown>{intro}</ReactMarkdown>
                </div>
            )}

            {dynamicSections.map(sec => {
                const isAfterSec2 = sec.num === 2;
                
                return (
                    <div key={sec.num}>
                        <h3 className="text-2xl mt-12 mb-6">{sec.title}</h3>
                        <ReactMarkdown>{sec.text}</ReactMarkdown>
                        
                        {isAfterSec2 && highlight && (
                            <HighlightBox icon={Icons.AlertCircle} title="Conteúdo Proibido">
                                <ReactMarkdown>{highlight}</ReactMarkdown>
                            </HighlightBox>
                        )}
                    </div>
                );
            })}
        </LegalLayout>
    );
};

export const ExchangePolicy = () => {
    const content = getSiteContent();
    const exchangePage = content.find(p => p.id === 'exchanges');
    const section = exchangePage?.sections.find(s => s.id === 'content');

    const highlight = section?.fields.find(f => f.key === 'highlight')?.value;
    const dynamicSections = section ? getDynamicSections(section.fields) : [];

    // Info Blocks
    const info1Title = section?.fields.find(f => f.key === 'info_1_title')?.value;
    const info1Desc = section?.fields.find(f => f.key === 'info_1_desc')?.value;
    const info1IconName = section?.fields.find(f => f.key === 'info_1_icon')?.value || 'Clock';

    const info2Title = section?.fields.find(f => f.key === 'info_2_title')?.value;
    const info2Desc = section?.fields.find(f => f.key === 'info_2_desc')?.value;
    const info2IconName = section?.fields.find(f => f.key === 'info_2_icon')?.value || 'CheckCircle';

    return (
        <LegalLayout title="Política de Troca" subtitle="Código de Defesa do Consumidor" icon={Icons.RefreshCw}>
            
            {highlight && (
                <HighlightBox icon={Icons.Info} title="Atenção ao Consumidor">
                    <ReactMarkdown>{highlight}</ReactMarkdown>
                </HighlightBox>
            )}

            {dynamicSections.map(sec => {
                // Renderiza InfoBlocks após a seção 2
                const isAfterSec2 = sec.num === 2;

                return (
                    <div key={sec.num}>
                        <h3 className="text-2xl mt-12 mb-6">{sec.title}</h3>
                        <ReactMarkdown>{sec.text}</ReactMarkdown>

                        {isAfterSec2 && (info1Title || info2Title) && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-10 border-t border-b border-gray-100 py-8">
                                {info1Title && (
                                    <InfoBlock icon={getIcon(info1IconName)} title={info1Title}>
                                        <ReactMarkdown>{info1Desc || ''}</ReactMarkdown>
                                    </InfoBlock>
                                )}
                                {info2Title && (
                                    <InfoBlock icon={getIcon(info2IconName)} title={info2Title}>
                                        <ReactMarkdown>{info2Desc || ''}</ReactMarkdown>
                                    </InfoBlock>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </LegalLayout>
    );
};

export const ShippingPolicy = () => {
    const content = getSiteContent();
    const shippingPage = content.find(p => p.id === 'shipping');
    const section = shippingPage?.sections.find(s => s.id === 'content');
    
    // Process dynamic sections
    const dynamicSections = section ? getDynamicSections(section.fields) : [];

    // Info Blocks (Correios)
    const info1Title = section?.fields.find(f => f.key === 'info_1_title')?.value;
    const info1Desc = section?.fields.find(f => f.key === 'info_1_desc')?.value;
    const info1IconName = section?.fields.find(f => f.key === 'info_1_icon')?.value || 'Truck';

    const info2Title = section?.fields.find(f => f.key === 'info_2_title')?.value;
    const info2Desc = section?.fields.find(f => f.key === 'info_2_desc')?.value;
    const info2IconName = section?.fields.find(f => f.key === 'info_2_icon')?.value || 'Package';

    return (
        <LegalLayout title="Envios & Prazos" subtitle="Logística e Entrega" icon={Icons.Truck}>
            {dynamicSections.map(sec => {
                const isAfterSec2 = sec.num === 2;

                return (
                    <div key={sec.num}>
                        <h3 className="text-2xl mt-12 mb-6">{sec.title}</h3>
                        <ReactMarkdown>{sec.text}</ReactMarkdown>
                        
                        {isAfterSec2 && (info1Title || info2Title) && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-10 border-t border-b border-gray-100 py-8">
                                {info1Title && (
                                    <InfoBlock icon={getIcon(info1IconName)} title={info1Title}>
                                        <ReactMarkdown>{info1Desc || ''}</ReactMarkdown>
                                    </InfoBlock>
                                )}
                                {info2Title && (
                                    <InfoBlock icon={getIcon(info2IconName)} title={info2Title}>
                                        <ReactMarkdown>{info2Desc || ''}</ReactMarkdown>
                                    </InfoBlock>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </LegalLayout>
    );
};
