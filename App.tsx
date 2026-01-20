
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { 
  Upload, Trash2, ShoppingBag, Plus, CreditCard, 
  MapPin, Check, AlertCircle, LayoutGrid, Image as ImageIcon,
  Menu, X, Star, ShieldCheck, Zap, Gift, Camera, 
  ArrowRight, Truck, User as UserIcon, LogOut, FileText, ChevronDown, Monitor, ChevronRight, Loader2,
  ChevronLeft, Filter, ArrowLeft, Instagram, Facebook, Twitter, Mail, Package, Info, UserRoundPen,
  Shield, Sparkles, Wand2, Heart, Award, ToggleRight, ToggleLeft, Leaf, Globe, Recycle, Layers, Calendar
} from 'lucide-react';
import { Review, User, MagnetItem } from './types';
import { getReviews, updateUser, getPublicStats } from './services/mockService';
import Auth from './components/Auth';
import AdminDashboard from './components/AdminDashboard';
import UserDashboard from './components/UserDashboard';
import Studio from './components/Studio';
import PricingSelection from './components/PricingSelection'; 
import UserProfileModal from './components/UserProfileModal';
import Cart from './components/Cart';
import AddressPage from './components/AddressPage';

// Novas Páginas
import { PrivacyPolicy, TermsOfUse, ExchangePolicy, ShippingPolicy } from './components/LegalPages';
import { OurHistory, ProductionProcess, Sustainability } from './components/InstitutionalPages';
import ContactPage from './components/ContactPage';
import ReviewsPage from './components/ReviewsPage';
import FAQPage from './components/FAQPage';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

// --- Admin Mode Bar Component ---
const AdminModeBar = ({ clientName, onExit }: { clientName: string, onExit: () => void }) => (
    <div className="fixed top-0 left-0 right-0 h-12 bg-indigo-600 text-white z-[60] flex items-center justify-between px-4 md:px-6 shadow-md animate-fade-in">
        <div className="flex items-center gap-3">
            <div className="bg-white/20 p-1.5 rounded-md">
                <Shield size={16} className="text-white" />
            </div>
            <div className="flex flex-col md:flex-row md:items-center md:gap-2 leading-tight">
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">Modo Administrador</span>
                <span className="hidden md:inline opacity-50 text-[10px]">|</span>
                <span className="text-xs font-bold">Criando pedido para: <span className="text-yellow-300">{clientName}</span></span>
            </div>
        </div>
        <button 
            onClick={onExit}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors border border-white/10"
        >
            <LogOut size={14} /> Sair
        </button>
    </div>
);

// --- Landing Page Sections ---

const HeroSection = () => {
  const scrollToProcess = (e: React.MouseEvent) => {
    e.preventDefault();
    const section = document.getElementById('process');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative bg-white pt-32 pb-20 md:pt-52 md:pb-40 overflow-hidden border-b border-gray-100">
      <div className="max-w-[1200px] mx-auto px-6 flex flex-col items-center text-center relative z-10">
         <div className="inline-flex items-center gap-2 border border-[#B8860B]/30 px-4 py-2 rounded-md text-[10px] font-bold text-[#B8860B] mb-8 uppercase tracking-[0.3em] bg-[#F5F5F7]">
            Eternizando Momentos
         </div>
         <h1 className="text-5xl md:text-8xl font-serif font-light text-[#1d1d1f] tracking-tight Carol leading-[1.1] mb-8">
            Suas fotos em <br/>
            <span className="italic text-[#B8860B]">memórias táteis.</span>
         </h1>
         <p className="text-lg md:text-xl text-[#86868b] font-light leading-relaxed mb-12 max-w-2xl">
            A sofisticação dos ímãs premium com acabamento manual. Qualidade fotográfica que resiste ao tempo, direto na sua porta.
         </p>
         
         <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                to="/studio" 
                className="px-10 py-4 bg-[#1d1d1f] text-white rounded-md font-bold text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl flex items-center gap-3"
              >
                Criar meus ímãs <ArrowRight size={16} />
              </Link>
              <a 
                href="#process" 
                onClick={scrollToProcess}
                className="px-10 py-4 bg-white text-[#1d1d1f] border border-gray-200 rounded-md font-bold text-xs uppercase tracking-widest hover:bg-gray-50 transition-all"
              >
                Conheça o processo
              </a>
         </div>
         
         <div className="mt-24 w-full max-w-4xl relative">
             <div className="hidden md:block absolute -inset-4 bg-gray-100/50 blur-3xl rounded-full"></div>
             <img 
                src="https://images.unsplash.com/photo-1513201099705-a9746e1e201f?q=80&w=1200&auto=format&fit=crop" 
                alt="Display de Ímãs Premium" 
                className="relative w-full rounded-md shadow-2xl object-cover aspect-[16/8] border border-gray-100"
             />
         </div>
      </div>
    </section>
  );
};

const BenefitsSection = () => {
    const benefits = [
        { icon: Award, title: 'Papel Fine Art', desc: 'Impressão em papel de alta gramatura com fidelidade de cores impecável.' },
        { icon: ShieldCheck, title: 'Laminado UV', desc: 'Uma camada extra de proteção que garante durabilidade de décadas.' },
        { icon: Truck, title: 'Entrega Segura', desc: 'Produção artesanal em até 48h com embalagem premium anti-impacto.' },
    ];

    return (
        <section id="benefits" className="py-24 bg-white">
            <div className="max-w-[1200px] mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
                    {benefits.map((b, i) => (
                        <div key={i} className="flex flex-col items-center text-center group">
                            <div className="w-16 h-16 bg-[#F5F5F7] rounded-md flex items-center justify-center text-[#1d1d1f] mb-8 transition-all group-hover:bg-[#1d1d1f] group-hover:text-white">
                                <b.icon size={28} />
                            </div>
                            <h3 className="text-xs font-bold text-[#1d1d1f] mb-4 uppercase tracking-[0.2em]">{b.title}</h3>
                            <p className="text-[#86868b] text-sm leading-relaxed max-w-[250px]">{b.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const GalleryFeatureSection = () => {
    return (
        <section className="py-24 bg-white overflow-hidden border-t border-gray-100">
            <div className="max-w-[1200px] mx-auto px-6">
                <div className="flex flex-col lg:flex-row items-center gap-20">
                    
                    {/* Imagem Lifestyle */}
                    <div className="flex-1 relative w-full">
                        <div className="absolute top-10 -left-10 w-40 h-40 bg-[#B8860B]/10 rounded-full blur-3xl"></div>
                        <div className="relative group">
                            <img 
                                src="https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?q=80&w=1000&auto=format&fit=crop" 
                                alt="Decoração com Ímãs" 
                                className="w-full rounded-2xl shadow-2xl object-cover aspect-square md:aspect-[4/3] z-10 relative"
                            />
                            {/* Card Flutuante Decorativo */}
                            <div className="absolute -bottom-6 -right-6 bg-white p-6 rounded-xl shadow-xl border border-gray-100 hidden md:block z-20 animate-fade-in">
                                <div className="flex items-center gap-3 mb-2">
                                    <Heart size={20} className="text-[#B8860B]" fill="currentColor" />
                                    <span className="font-bold text-[#1d1d1f] text-sm">Favorito dos Clientes</span>
                                </div>
                                <p className="text-xs text-gray-500">"Transformou minha cozinha!"</p>
                            </div>
                        </div>
                    </div>

                    {/* Texto e Pontos */}
                    <div className="flex-1">
                        <span className="text-[#B8860B] font-bold text-[10px] uppercase tracking-[0.3em] mb-4 block">Decoração Viva</span>
                        <h2 className="text-4xl md:text-5xl font-serif text-[#1d1d1f] mb-8 leading-tight">
                            Transforme qualquer espaço em uma galeria.
                        </h2>
                        <p className="text-[#86868b] text-lg font-light leading-relaxed mb-10">
                            Sua geladeira, armário ou painel magnético se transformam em uma bela vitrine para seus momentos favoritos. Reorganize quando quiser para manter seu espaço sempre renovado.
                        </p>

                        <ul className="space-y-5">
                            {[
                                "Perfeito para cozinhas, escritórios e quartos.",
                                "Crie coleções temáticas ou conte uma história.",
                                "Uma opção de presente inesquecível.",
                                "Fácil de atualizar com novas fotos a qualquer momento."
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-4 text-[#1d1d1f] font-medium text-sm group">
                                    <div className="w-6 h-6 rounded-full bg-[#F5F5F7] flex items-center justify-center text-[#B8860B] group-hover:bg-[#B8860B] group-hover:text-white transition-colors">
                                        <Check size={12} strokeWidth={3} />
                                    </div>
                                    {item}
                                </li>
                            ))}
                        </ul>

                        <div className="mt-12">
                            <Link 
                                to="/studio" 
                                className="inline-flex items-center gap-3 px-8 py-3 bg-[#1d1d1f] text-white rounded-md font-bold text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-lg"
                            >
                                Começar a criar <Wand2 size={14} />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

const ProcessSection = () => {
    return (
        <section id="process" className="py-24 bg-[#F5F5F7] border-y border-gray-100 scroll-mt-20">
            <div className="max-w-[1200px] mx-auto px-6">
                <div className="flex flex-col lg:flex-row gap-20 items-center">
                    <div className="flex-1 text-left">
                        <span className="text-[#B8860B] font-bold text-[10px] uppercase tracking-[0.3em] mb-4 block">Simplicidade & Elegância</span>
                        <h2 className="text-4xl md:text-5xl font-serif text-[#1d1d1f] mb-10 leading-tight">
                            Personalize seu espaço em poucos minutos.
                        </h2>
                        <div className="space-y-12">
                            {[
                                { step: 'I', title: 'Curadoria de Fotos', desc: 'Selecione suas memórias mais valiosas direto do seu dispositivo.' },
                                { step: 'II', title: 'Edição Studio', desc: 'Ajuste brilho, contraste e aplique filtros profissionais em nosso editor.' },
                                { step: 'III', title: 'Acabamento Manual', desc: 'Seus ímãs são montados um a um, conferindo o toque artesanal que você merece.' },
                            ].map((s, i) => (
                                <div key={i} className="flex gap-8 group">
                                    <span className="text-xl font-serif italic text-[#B8860B] border-b border-[#B8860B]/30 pb-1 h-fit">{s.step}</span>
                                    <div>
                                        <h4 className="font-bold text-[#1d1d1f] text-sm uppercase tracking-widest mb-2">{s.title}</h4>
                                        <p className="text-[#86868b] text-sm leading-relaxed">{s.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex-1 relative">
                        <div className="hidden md:block absolute -top-10 -right-10 w-40 h-40 bg-[#B8860B]/5 rounded-full blur-2xl"></div>
                        <div className="bg-white p-4 rounded-md shadow-2xl border border-gray-200">
                             <img 
                                src="https://images.unsplash.com/photo-1544144433-d50aff500b91?q=80&w=1000&auto=format&fit=crop" 
                                alt="Uso do Studio" 
                                className="rounded-md w-full"
                             />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

const StatsSection = () => {
    const [statsConfig, setStatsConfig] = useState<any>(null);

    useEffect(() => {
        const publicData = getPublicStats();
        setStatsConfig(publicData);
    }, []);

    if (!statsConfig || !statsConfig.visible) return null;

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('pt-BR').format(num);
    };

    // Mapeamento dos cards disponíveis
    const cardsMap: any = {
        'orders': { 
            id: 'orders', 
            visible: statsConfig.orders.visible, 
            icon: Package, 
            value: `+${formatNumber(statsConfig.orders.value)}`, 
            label: 'Pedidos Enviados' 
        },
        'magnets': { 
            id: 'magnets', 
            visible: statsConfig.magnets.visible, 
            icon: Layers, 
            value: `+${formatNumber(statsConfig.magnets.value)}`, 
            label: 'Ímãs Produzidos' 
        },
        'reviews': { 
            id: 'reviews', 
            visible: statsConfig.reviews.visible, 
            icon: Star, 
            value: '5 Estrelas', 
            label: `+${formatNumber(statsConfig.reviews.value)} Avaliações` 
        }
    };

    // Filtra e Ordena com base na configuração do CMS
    const visibleCards = (statsConfig.order || ['orders', 'magnets', 'reviews'])
        .map((key: string) => cardsMap[key])
        .filter((item: any) => item && item.visible);

    // Ajuste dinâmico do Grid
    let gridClass = 'grid-cols-1';
    if (visibleCards.length === 2) gridClass = 'md:grid-cols-2 max-w-2xl';
    if (visibleCards.length === 3) gridClass = 'md:grid-cols-3';
    // Se for 1, mantém centralizado no default

    return (
        <section className="relative py-28 bg-[#1d1d1f] overflow-hidden text-white">
            {/* Background Image with Overlay */}
            <div className="absolute inset-0 opacity-20 pointer-events-none select-none">
                <img 
                    src="https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?q=80&w=1600&auto=format&fit=crop" 
                    className="w-full h-full object-cover filter grayscale contrast-150" 
                    alt="Background Pattern"
                />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#1d1d1f] via-transparent to-[#1d1d1f] opacity-80"></div>

            <div className="relative z-10 max-w-[1200px] mx-auto px-6 text-center">
                
                {statsConfig.years.visible && (
                    <h2 className="text-4xl md:text-5xl font-serif font-bold mb-16 leading-tight animate-fade-in">
                        {statsConfig.years.value} Anos,<br/>
                        <span className="text-[#B8860B] italic">histórias reais.</span>
                    </h2>
                )}

                {visibleCards.length > 0 && (
                    <div className={`grid ${gridClass} gap-12 md:gap-8 mx-auto animate-fade-in`}>
                        {visibleCards.map((card: any, idx: number) => (
                            <div key={card.id} className="flex flex-col items-center group">
                                <div className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center mb-6 bg-white/5 backdrop-blur-sm group-hover:border-[#B8860B] transition-colors">
                                    <card.icon size={28} className="text-[#B8860B]" strokeWidth={1.5} fill={card.id === 'reviews' ? "currentColor" : "none"} />
                                </div>
                                <h3 className="text-4xl font-serif font-bold mb-2">{card.value}</h3>
                                <p className="text-sm font-bold uppercase tracking-widest text-white/50">{card.label}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};

const SustainabilityTeaserSection = () => {
    return (
        <section className="py-24 bg-white text-[#1d1d1f] relative overflow-hidden">
            <div className="max-w-[1200px] mx-auto px-6 relative z-10">
                
                <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-20">
                    <div className="max-w-2xl">
                        <span className="text-[#B8860B] font-bold text-[10px] uppercase tracking-[0.3em] mb-4 block flex items-center gap-2">
                            <Globe size={14} /> Consciência
                        </span>
                        <h2 className="text-4xl md:text-5xl font-serif mb-6 leading-tight">Beleza que respeita o mundo.</h2>
                        <p className="text-[#86868b] font-light text-lg leading-relaxed">
                            Acreditamos que memórias devem durar para sempre, mas nosso impacto no planeta não. Cada etapa da nossa produção é pensada para reduzir a pegada ecológica.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-12 gap-y-16">
                    {[
                        { icon: Leaf, title: "Papel Certificado", desc: "Todo papel utilizado provém de fontes de reflorestamento certificadas pelo FSC (Forest Stewardship Council)." },
                        { icon: Package, title: "Embalagem Sem Plástico", desc: "Nossas caixas e envelopes são 100% recicláveis e biodegradáveis, eliminando o uso de plásticos descartáveis no envio." },
                        { icon: Recycle, title: "Resíduos Mínimos", desc: "Nossa tecnologia de corte otimizado aproveita 98% da área do material, gerando o mínimo de sobras na produção." },
                        { icon: Heart, title: "Tinta Eco-Solvente", desc: "Utilizamos tintas à base de água ou eco-solventes, livres de metais pesados e compostos voláteis nocivos." }
                    ].slice(0, 3).map((item, i) => (
                        <div key={i} className="flex flex-col gap-4 group">
                            <div className="text-[#B8860B] mb-2 group-hover:scale-110 transition-transform origin-left duration-300">
                                <item.icon size={32} strokeWidth={1.5} />
                            </div>
                            <div>
                                <h3 className="font-bold text-[#1d1d1f] text-sm uppercase tracking-widest mb-3">{item.title}</h3>
                                <p className="text-[#86868b] text-sm font-light leading-relaxed">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-16 pt-10 border-t border-gray-100 flex justify-center md:justify-start">
                    <Link to="/sustainability" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#1d1d1f] hover:text-[#B8860B] transition-colors group">
                        Ler manifesto de sustentabilidade <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform"/>
                    </Link>
                </div>
            </div>
        </section>
    );
};

const ReviewsSection = () => {
    const allReviews = getReviews('approved').slice(0, 3);
    return (
        <section id="reviews" className="py-24 bg-white">
            <div className="max-w-[1200px] mx-auto px-6">
                <div className="text-center mb-16">
                    <span className="text-[#B8860B] font-bold text-[10px] uppercase tracking-[0.3em] mb-4 block">Depoimentos</span>
                    <h2 className="text-4xl font-serif text-[#1d1d1f] mb-4">Relatos de quem confiou.</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-16">
                    {allReviews.map((r, i) => (
                        <div key={i} className="bg-white p-12 rounded-md border border-gray-100 flex flex-col h-full shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex text-[#B8860B] mb-8 gap-1">
                                {[...Array(5)].map((_, k) => (
                                    <Star key={k} size={12} fill={k < r.rating ? "currentColor" : "none"} strokeWidth={k < r.rating ? 0 : 2} />
                                ))}
                            </div>
                            <p className="text-[#1d1d1f] text-base leading-relaxed flex-1 font-light italic">"{r.text}"</p>
                            <div className="mt-10 flex items-center gap-4 border-t border-gray-50 pt-8">
                                <div className="w-10 h-10 bg-[#1d1d1f] text-white rounded-md flex items-center justify-center font-bold text-xs uppercase shadow-lg">
                                    {r.userName.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-bold text-[#1d1d1f] text-xs uppercase tracking-widest">{r.userName}</p>
                                    <div className="flex flex-col">
                                        {r.userLocation && (
                                            <p className="text-[9px] text-[#B8860B] font-bold uppercase tracking-widest mt-0.5">
                                                {r.userLocation}
                                            </p>
                                        )}
                                        <p className="text-[9px] text-[#86868b] uppercase tracking-wide mt-0.5">{r.createdAt}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                
                <div className="text-center">
                    <Link 
                        to="/reviews" 
                        className="inline-flex items-center gap-2 px-10 py-4 border border-[#1d1d1f] text-[#1d1d1f] rounded-md font-bold text-[10px] uppercase tracking-[0.2em] hover:bg-[#1d1d1f] hover:text-white transition-all group"
                    >
                        Ver todas as avaliações <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform"/>
                    </Link>
                </div>
            </div>
        </section>
    );
};

const FinalCTA = () => {
    return (
        <section className="py-24 bg-[#1d1d1f] relative overflow-hidden">
            <div className="max-w-[800px] mx-auto px-6 text-center relative z-10">
                <h2 className="text-4xl md:text-5xl font-serif text-white mb-8">Dê o primeiro passo para o seu mural de memórias.</h2>
                <p className="text-lg text-white/60 font-light mb-12">Kits exclusivos com curadoria profissional.</p>
                <Link 
                    to="/studio"
                    className="inline-flex items-center gap-3 px-12 py-5 bg-[#B8860B] text-white rounded-md font-bold text-xs uppercase tracking-[0.2em] hover:bg-[#966d09] transition-all shadow-2xl"
                >
                    Montar meu kit <Wand2 size={16} />
                </Link>
            </div>
        </section>
    );
};

const Footer = () => (
    <footer className="bg-white text-[#1d1d1f] pt-24 pb-12 border-t border-gray-100">
        <div className="max-w-[1200px] mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-20">
                <div className="col-span-1 md:col-span-1">
                    <Link to="/" className="flex items-center gap-3 text-2xl font-serif font-bold tracking-tight mb-8">
                        <LayoutGrid size={24} className="text-[#B8860B]" /> Magneto
                    </Link>
                    <p className="text-[#86868b] text-sm leading-relaxed mb-10 font-light">
                        Dedicados a transformar registros digitais em presença física, com a qualidade e o respeito que cada memória merece.
                    </p>
                    <div className="flex gap-4">
                        <a href="#" className="w-9 h-9 border border-gray-100 rounded-md flex items-center justify-center hover:bg-[#1d1d1f] hover:text-white transition-all"><Instagram size={16}/></a>
                        <a href="#" className="w-9 h-9 border border-gray-100 rounded-md flex items-center justify-center hover:bg-[#1d1d1f] hover:text-white transition-all"><Facebook size={16}/></a>
                        <a href="#" className="w-9 h-9 border border-gray-100 rounded-md flex items-center justify-center hover:bg-[#1d1d1f] hover:text-white transition-all"><Twitter size={16}/></a>
                    </div>
                </div>
                
                <div>
                    <h4 className="font-bold text-[10px] uppercase tracking-[0.3em] text-[#B8860B] mb-8">Coleções</h4>
                    <ul className="space-y-4 text-xs font-bold uppercase tracking-widest text-[#1d1d1f]">
                        <li><Link to="/studio" className="hover:text-[#B8860B] transition-colors">Premium 5x5</Link></li>
                        <li><Link to="/studio" className="hover:text-[#B8860B] transition-colors">Polaroid Style</Link></li>
                        <li><Link to="/studio" className="hover:text-[#B8860B] transition-colors">Kits Presente</Link></li>
                    </ul>
                </div>

                <div>
                    <h4 className="font-bold text-[10px] uppercase tracking-[0.3em] text-[#B8860B] mb-8">Institucional</h4>
                    <ul className="space-y-4 text-xs font-bold uppercase tracking-widest text-[#1d1d1f]">
                        <li><Link to="/history" className="hover:text-[#B8860B] transition-colors">Nossa História</Link></li>
                        <li><Link to="/process" className="hover:text-[#B8860B] transition-colors">Processo de Produção</Link></li>
                        <li><Link to="/sustainability" className="hover:text-[#B8860B] transition-colors">Sustentabilidade</Link></li>
                        <li><Link to="/faq" className="hover:text-[#B8860B] transition-colors">Perguntas Frequentes</Link></li>
                        <li><Link to="/contact" className="hover:text-[#B8860B] transition-colors">Contato</Link></li>
                    </ul>
                </div>

                <div>
                    <h4 className="font-bold text-[10px] uppercase tracking-[0.3em] text-[#B8860B] mb-8">Privacidade</h4>
                    <ul className="space-y-4 text-xs font-bold uppercase tracking-widest text-[#1d1d1f]">
                        <li><Link to="/terms" className="hover:text-[#B8860B] transition-colors">Termos de Uso</Link></li>
                        <li><Link to="/privacy" className="hover:text-[#B8860B] transition-colors">Política de Privacidade</Link></li>
                        <li><Link to="/exchanges" className="hover:text-[#B8860B] transition-colors">Política de Troca</Link></li>
                        <li><Link to="/shipping" className="hover:text-[#B8860B] transition-colors">Envios & Prazos</Link></li>
                    </ul>
                </div>
            </div>
            
            <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-8">
                <p className="text-[10px] text-[#86868b] font-bold uppercase tracking-widest">© 2024 Magneto Memories • Todos os direitos reservados</p>
                <div className="flex items-center gap-6 opacity-30 grayscale">
                    <img src="https://cdn-icons-png.flaticon.com/512/196/196561.png" className="h-4" alt="Visa" />
                    <img src="https://cdn-icons-png.flaticon.com/512/196/196565.png" className="h-4" alt="Mastercard" />
                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Logo_Pix.png/1200px-Logo_Pix.png" className="h-4" alt="Pix" />
                </div>
            </div>
        </div>
    </footer>
);

const NavbarWrapper = ({ user, cartCount, onLogout, onOpenProfile, isAdminMode }: { user: User | null, cartCount: number, onLogout: () => void, onOpenProfile: () => void, isAdminMode: boolean }) => {
    const location = useLocation();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Páginas que possuem cabeçalho escuro onde a navbar precisa ser branca se não estiver scrollada
    const isDarkHeader = [
        '/privacy', '/terms', '/exchanges', '/shipping',
        '/history', '/process', '/sustainability',
        '/faq'
    ].includes(location.pathname);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Fecha o dropdown se clicar fora dele
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    
    if (location.pathname.startsWith('/admin') || location.pathname.startsWith('/studio/upload') || location.pathname === '/login') return null;

    // Definição de cores baseada no estado
    const useLightText = !scrolled && isDarkHeader;
    const textColor = useLightText ? 'text-white' : 'text-[#1d1d1f]';
    const borderColor = useLightText ? 'border-white/50' : 'border-[#1d1d1f]/50';
    const logoColor = useLightText ? 'text-white' : 'text-[#1d1d1f]';

    return (
        <nav className={`fixed w-full z-50 transition-all duration-500 ${isAdminMode ? 'top-12' : 'top-0'} ${scrolled ? 'bg-white/95 border-b border-gray-100 shadow-sm py-3' : 'bg-transparent py-6'}`}>
            <div className="max-w-[1200px] mx-auto px-6 flex justify-between items-center">
                <Link to="/" className={`flex items-center gap-3 text-2xl font-serif font-bold tracking-tight ${logoColor}`}>
                    <LayoutGrid size={24} className="text-[#B8860B]" /> Magneto
                </Link>
                <div className="flex items-center gap-4">
                    {user ? (
                        <div className="relative" ref={dropdownRef}>
                            <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className={`w-9 h-9 border rounded-md flex items-center justify-center text-xs font-bold ${useLightText ? 'border-white text-white' : 'border-[#B8860B] text-[#1d1d1f]'}`}>
                                {user.name.charAt(0)}
                            </button>
                            {isDropdownOpen && (
                                <div className="absolute right-0 top-12 w-64 bg-white rounded-md shadow-2xl border border-gray-100 p-2 z-50 animate-fade-in">
                                    <div className="px-4 py-4 border-b border-gray-50 mb-1">
                                        <p className="font-bold text-[#1d1d1f] text-[10px] uppercase tracking-widest truncate">{user.name}</p>
                                    </div>
                                    <Link to="/my-orders" onClick={() => setIsDropdownOpen(false)} className="w-full flex items-center gap-3 px-4 py-3 rounded-md hover:bg-gray-50 text-[#1d1d1f] text-xs font-bold transition-colors"><Package size={14} /> Meus Pedidos</Link>
                                    {user.isAdmin && (
                                        <Link to="/admin" onClick={() => setIsDropdownOpen(false)} className="w-full flex items-center gap-3 px-4 py-3 rounded-md hover:bg-gray-50 text-[#1d1d1f] text-xs font-bold transition-colors"><LayoutGrid size={14} /> Painel Admin</Link>
                                    )}
                                    <button onClick={() => { setIsDropdownOpen(false); onOpenProfile(); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-md hover:bg-gray-50 text-[#1d1d1f] text-xs font-bold transition-colors text-left"><UserRoundPen size={14} /> Perfil</button>
                                    <button onClick={() => { setIsDropdownOpen(false); onLogout(); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-md hover:bg-red-50 text-red-600 text-xs font-bold transition-colors text-left"><LogOut size={14} /> Sair</button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Link 
                            to="/login" 
                            state={{ from: location.pathname }}
                            className={`px-5 py-2.5 border rounded-md text-[10px] font-bold uppercase tracking-widest ${textColor} ${borderColor}`}
                        >
                            Entrar
                        </Link>
                    )}
                    <Link to="/cart" className={`p-2.5 relative ${textColor}`}>
                        <ShoppingBag size={22} />
                        {cartCount > 0 && <span className="absolute top-1 right-1 w-5 h-5 bg-[#B8860B] text-white text-[9px] flex items-center justify-center rounded-full font-bold shadow-md border border-white">{cartCount}</span>}
                    </Link>
                </div>
            </div>
        </nav>
    );
};

const App: React.FC = () => {
    const [user, setUser] = useState<User | null>(() => {
        try {
            const saved = localStorage.getItem('magneto_user');
            return saved ? JSON.parse(saved) : null;
        } catch (e) { return null; }
    });
    const [cart, setCart] = useState<MagnetItem[]>(() => {
        try {
            const saved = localStorage.getItem('magneto_cart');
            return saved ? JSON.parse(saved) : [];
        } catch (e) { return []; }
    });
    
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [studioDraft, setStudioDraft] = useState<MagnetItem[]>([]);
    const [draftItemIds, setDraftItemIds] = useState<string[]>([]);
    const [adminDraftUser, setAdminDraftUser] = useState<User | null>(null);

    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (user) {
            try {
                localStorage.setItem('magneto_user', JSON.stringify(user));
            } catch (e) { console.error("Erro ao salvar usuário", e); }
        } else {
            localStorage.removeItem('magneto_user');
        }
    }, [user]);

    useEffect(() => {
        try {
            const safeCart = cart.map(item => ({
                ...item,
                originalUrl: '',
            }));
            localStorage.setItem('magneto_cart', JSON.stringify(safeCart));
        } catch (e) {
            console.error("Falha crítica ao salvar carrinho", e);
        }
    }, [cart]);

    const handleLogin = (u: User) => setUser(u);
    const handleLogout = () => {
        setUser(null);
        setAdminDraftUser(null);
        localStorage.removeItem('magneto_user');
    };

    const addToCart = useCallback((newItems: MagnetItem[]) => {
        setCart(prev => {
            if (draftItemIds.length > 0) {
                const filteredCart = prev.filter(item => !draftItemIds.includes(item.id));
                return [...filteredCart, ...newItems];
            }
            return [...prev, ...newItems];
        });
        setStudioDraft([]);
        setDraftItemIds([]);
    }, [draftItemIds]);

    const resumeKitFromCart = useCallback((items: MagnetItem[]) => {
        setStudioDraft(items);
        setDraftItemIds(items.map(i => i.id));
    }, []);

    const removeFromCart = useCallback((id: string) => {
        setCart(prev => prev.filter(item => item.id !== id));
    }, []);

    const removeItemsFromCart = useCallback((ids: string[]) => {
        setCart(prev => prev.filter(item => !ids.includes(item.id)));
    }, []);

    const clearCart = useCallback(() => {
        setCart([]);
        localStorage.removeItem('magneto_cart');
    }, []);

    const handleAdminStartOrder = (targetUser: User) => {
        setAdminDraftUser(targetUser);
        navigate('/studio');
    };

    const handleExitAdminMode = () => {
        setAdminDraftUser(null);
        navigate('/admin');
    };

    // Definição das rotas onde o Footer deve aparecer
    const showFooter = [
        '/', 
        '/history', '/process', '/sustainability', '/contact', '/faq',
        '/terms', '/privacy', '/exchanges', '/shipping'
    ].includes(location.pathname);

    return (
        <>
            <ScrollToTop />
            
            {/* Barra de Modo Administrador */}
            {user?.isAdmin && adminDraftUser && (
                <>
                    <AdminModeBar clientName={adminDraftUser.name} onExit={handleExitAdminMode} />
                    <div className="h-12 w-full"></div> {/* Spacer para empurrar o conteúdo */}
                </>
            )}

            <NavbarWrapper 
                user={user} 
                cartCount={cart.length} 
                onLogout={handleLogout} 
                onOpenProfile={() => setIsProfileModalOpen(true)}
                isAdminMode={!!(user?.isAdmin && adminDraftUser)}
            />
            
            <Routes>
                <Route path="/" element={
                    <div className="bg-white">
                        <HeroSection />
                        <BenefitsSection />
                        <GalleryFeatureSection />
                        <ProcessSection />
                        <SustainabilityTeaserSection />
                        <StatsSection />
                        <ReviewsSection />
                        <FinalCTA />
                    </div>
                } />
                
                {/* Institutional Routes */}
                <Route path="/history" element={<OurHistory />} />
                <Route path="/process" element={<ProductionProcess />} />
                <Route path="/sustainability" element={<Sustainability />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/faq" element={<FAQPage />} />

                {/* Legal Routes */}
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsOfUse />} />
                <Route path="/exchanges" element={<ExchangePolicy />} />
                <Route path="/shipping" element={<ShippingPolicy />} />

                {/* App Routes */}
                <Route path="/studio" element={<PricingSelection />} /> 
                <Route path="/studio/upload" element={<Studio addToCart={addToCart} initialImages={studioDraft} adminDraftUser={adminDraftUser} />} /> 
                <Route path="/admin/studio/:orderId" element={
                    user?.isAdmin ? <Studio addToCart={() => {}} /> : <Navigate to="/login" />
                } />
                <Route path="/reviews" element={<ReviewsPage />} />
                <Route path="/cart" element={
                    <Cart 
                        items={cart} 
                        onRemove={removeFromCart} 
                        onRemoveBatch={removeItemsFromCart} 
                        onClear={clearCart} 
                        user={user} 
                        resumeKit={resumeKitFromCart} 
                        onUpdateUser={(d) => setUser(p => p ? {...p, ...d} : p)}
                        adminDraftUser={adminDraftUser} 
                        onClearAdminMode={() => setAdminDraftUser(null)}
                    />
                } />
                <Route path="/address" element={
                    <AddressPage 
                        user={user} 
                        onUpdateUser={(d) => setUser(p => p ? {...p, ...d} : p)}
                    />
                } />
                <Route path="/login" element={<Auth onLogin={handleLogin} user={user} />} />
                <Route path="/admin" element={user?.isAdmin ? <AdminDashboard onLogout={handleLogout} onStartOrder={handleAdminStartOrder} /> : <Navigate to="/login" />} />
                <Route path="/my-orders" element={user ? <UserDashboard user={user} /> : <Navigate to="/login" />} />
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
            
            {showFooter && <Footer />}
            
            {user && (
                <UserProfileModal 
                    user={user}
                    isOpen={isProfileModalOpen}
                    onClose={() => setIsProfileModalOpen(false)}
                    onSave={(id, data) => {
                        updateUser(id, data);
                        setUser(prev => prev ? { ...prev, ...data } : prev);
                        // Não fecha mais automaticamente ao salvar, o modal controla seu estado interno
                    }}
                />
            )}
        </>
    );
};

export default App;
