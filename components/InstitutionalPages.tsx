
import React, { useEffect } from 'react';
import { LayoutGrid, Layers, Leaf, Heart, ArrowRight, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';

const InstitutionalHeader: React.FC<{ title: string; subtitle: string; bgImage: string }> = ({ title, subtitle, bgImage }) => (
    <div className="relative h-[60vh] flex items-center justify-center overflow-hidden">
        <img src={bgImage} className="absolute inset-0 w-full h-full object-cover" alt={title} />
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"></div>
        <div className="relative z-10 text-center px-6 animate-fade-in">
            <span className="text-[#B8860B] font-bold text-xs uppercase tracking-[0.4em] block mb-4">{subtitle}</span>
            <h1 className="text-5xl md:text-7xl font-serif text-white font-medium mb-6">{title}</h1>
            <div className="w-24 h-1 bg-[#B8860B] mx-auto"></div>
        </div>
    </div>
);

const Section: React.FC<{ title: string; children: React.ReactNode; reverse?: boolean; image?: string }> = ({ title, children, reverse, image }) => (
    <div className={`py-24 px-6 ${reverse ? 'bg-[#F5F5F7]' : 'bg-white'}`}>
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-center gap-16">
            <div className={`flex-1 space-y-6 ${reverse ? 'md:order-2' : ''}`}>
                <h2 className="text-3xl font-serif text-[#1d1d1f]">{title}</h2>
                <div className="text-[#86868b] leading-relaxed font-light text-lg space-y-6">
                    {children}
                </div>
            </div>
            {image && (
                <div className={`flex-1 w-full ${reverse ? 'md:order-1' : ''}`}>
                    <img src={image} alt={title} className="w-full h-auto rounded-md shadow-2xl" />
                </div>
            )}
        </div>
    </div>
);

export const OurHistory = () => {
    useEffect(() => { window.scrollTo(0, 0); }, []);
    return (
        <div className="bg-white">
            <InstitutionalHeader 
                title="Nossa História" 
                subtitle="Desde 2023"
                bgImage="https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=1600&auto=format&fit=crop"
            />
            <Section title="O Começo de Tudo" image="https://images.unsplash.com/photo-1520333789090-1afc82db536a?q=80&w=1000&auto=format&fit=crop">
                <p>A Magneto nasceu de uma necessidade simples, porém profunda: a vontade de tirar as memórias das telas frias dos celulares e trazê-las de volta para o cotidiano tátil.</p>
                <p>Em um mundo onde tiramos milhares de fotos que raramente revemos, acreditamos que imprimir é o ato final de carinho com um momento vivido. Começamos em um pequeno estúdio, testando papéis, ímãs e acabamentos até chegar na fórmula perfeita que une durabilidade e estética.</p>
            </Section>
            <Section title="Nossa Missão" reverse image="https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=1000&auto=format&fit=crop">
                <p>Não vendemos apenas ímãs. Vendemos portais para o passado. Nossa missão é transformar a porta da sua geladeira ou o seu painel magnético em uma galeria de arte pessoal, com curadoria feita por você.</p>
                <p>Buscamos a excelência em cada corte, em cada ajuste de cor, para que aquele sorriso, aquela viagem ou aquele abraço durem por gerações.</p>
            </Section>
            <div className="bg-[#1d1d1f] py-24 text-center">
                <h2 className="text-4xl font-serif text-white mb-8">Faça parte da nossa história</h2>
                <Link to="/studio" className="inline-flex items-center gap-3 px-10 py-4 bg-[#B8860B] text-white rounded-md font-bold uppercase tracking-widest hover:bg-[#966d09] transition-all">
                    Criar Memórias <ArrowRight size={16}/>
                </Link>
            </div>
        </div>
    );
};

export const ProductionProcess = () => {
    useEffect(() => { window.scrollTo(0, 0); }, []);
    return (
        <div className="bg-white">
            <InstitutionalHeader 
                title="Processo de Produção" 
                subtitle="Artesanal & Tecnológico"
                bgImage="https://images.unsplash.com/photo-1531973576160-7125cd663d86?q=80&w=1600&auto=format&fit=crop"
            />
            
            <div className="max-w-[1200px] mx-auto px-6 py-24 grid grid-cols-1 md:grid-cols-3 gap-12">
                {[
                    { icon: Layers, title: "1. Impressão Fine Art", desc: "Utilizamos plotters de alta definição com 12 cores de pigmento mineral, garantindo fidelidade cromática e durabilidade superior a 100 anos." },
                    { icon: Leaf, title: "2. Laminação UV", desc: "Cada folha impressa recebe uma camada de laminação fosca ou brilhante, protegendo contra raios UV, umidade e marcas de dedos." },
                    { icon: Heart, title: "3. Corte e Acabamento", desc: "O corte é feito com precisão milimétrica, seguido de uma inspeção manual peça por peça para garantir que nenhum detalhe passe despercebido." }
                ].map((step, i) => (
                    <div key={i} className="bg-[#F5F5F7] p-10 rounded-md border border-gray-100 text-center group hover:-translate-y-2 transition-transform duration-500">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-8 text-[#B8860B] shadow-sm group-hover:scale-110 transition-transform">
                            <step.icon size={32} />
                        </div>
                        <h3 className="font-serif font-bold text-xl mb-4 text-[#1d1d1f]">{step.title}</h3>
                        <p className="text-[#86868b] font-light leading-relaxed">{step.desc}</p>
                    </div>
                ))}
            </div>

            <Section title="Qualidade que se Sente" image="https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=1000&auto=format&fit=crop">
                <p>Nossos ímãs possuem 0.8mm de espessura, conferindo robustez e aderência perfeita. Diferente de ímãs promocionais finos, o produto Magneto tem "corpo" e presença.</p>
                <p>O verso é totalmente imantado (manta magnética de alta energia), garantindo que suas fotos não escorreguem e fixem papéis com segurança.</p>
            </Section>
        </div>
    );
};

export const Sustainability = () => {
    useEffect(() => { window.scrollTo(0, 0); }, []);
    return (
        <div className="bg-white">
            <InstitutionalHeader 
                title="Sustentabilidade" 
                subtitle="Compromisso Eco-friendly"
                bgImage="https://images.unsplash.com/photo-1511497584788-876760111969?q=80&w=1600&auto=format&fit=crop"
            />
            <div className="max-w-4xl mx-auto px-6 py-24 text-center">
                <h2 className="text-3xl md:text-4xl font-serif text-[#1d1d1f] mb-8">Pegada Leve, Memórias Duradouras</h2>
                <p className="text-lg text-[#86868b] font-light leading-relaxed mb-16">
                    Sabemos que o consumo gera impacto. Por isso, na Magneto, trabalhamos ativamente para reduzir nossa pegada ecológica através de escolhas conscientes em cada etapa do processo.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                    <div className="flex gap-6">
                        <div className="shrink-0 text-[#B8860B]"><Leaf size={32}/></div>
                        <div>
                            <h3 className="font-bold text-[#1d1d1f] uppercase tracking-widest mb-2">Papel Certificado</h3>
                            <p className="text-[#86868b] text-sm">Todo papel utilizado provém de fontes de reflorestamento certificadas pelo FSC (Forest Stewardship Council).</p>
                        </div>
                    </div>
                    <div className="flex gap-6">
                        <div className="shrink-0 text-[#B8860B]"><Layers size={32}/></div>
                        <div>
                            <h3 className="font-bold text-[#1d1d1f] uppercase tracking-widest mb-2">Resíduos Mínimos</h3>
                            <p className="text-[#86868b] text-sm">Nossa tecnologia de corte otimizado aproveita 98% da área do material, gerando o mínimo de sobras.</p>
                        </div>
                    </div>
                    <div className="flex gap-6">
                        <div className="shrink-0 text-[#B8860B]"><Truck size={32}/></div>
                        <div>
                            <h3 className="font-bold text-[#1d1d1f] uppercase tracking-widest mb-2">Embalagem Sem Plástico</h3>
                            <p className="text-[#86868b] text-sm">Nossas caixas e envelopes são 100% recicláveis e biodegradáveis, eliminando o uso de plásticos descartáveis no envio.</p>
                        </div>
                    </div>
                    <div className="flex gap-6">
                        <div className="shrink-0 text-[#B8860B]"><Heart size={32}/></div>
                        <div>
                            <h3 className="font-bold text-[#1d1d1f] uppercase tracking-widest mb-2">Tinta Eco-Solvente</h3>
                            <p className="text-[#86868b] text-sm">Utilizamos tintas à base de água ou eco-solventes, livres de metais pesados e compostos voláteis nocivos.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
