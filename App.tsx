
import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { 
  Upload, Trash2, ShoppingBag, Plus, CreditCard, 
  MapPin, Check, AlertCircle, LayoutGrid, Image as ImageIcon,
  Menu, X, Star, ShieldCheck, Zap, Gift, Camera, 
  ArrowRight, Truck, User as UserIcon, LogOut, FileText, ChevronDown, Monitor, ChevronRight, Loader2,
  ChevronLeft, Filter, ArrowLeft, Instagram, Facebook, Twitter, Mail, Package, Info, UserRoundPen,
  Shield, Sparkles, Wand2, Heart, Award, ToggleRight, ToggleLeft
} from 'lucide-react';
import { Review, User, MagnetItem } from './types';
import { getReviews, updateUser } from './services/mockService';
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

const NavbarWrapper = ({ user, cartCount, onLogout, onOpenProfile }: { user: User | null, cartCount: number, onLogout: () => void, onOpenProfile: () => void }) => {
    const location = useLocation();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);
    
    if (location.pathname.startsWith('/admin') || location.pathname.startsWith('/studio/upload') || location.pathname === '/login') return null;

    return (
        <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${scrolled ? 'bg-white/95 border-b border-gray-100 shadow-sm py-3' : 'bg-transparent py-6'}`}>
            <div className="max-w-[1200px] mx-auto px-6 flex justify-between items-center">
                <Link to="/" className="flex items-center gap-3 text-2xl font-serif font-bold tracking-tight text-[#1d1d1f]">
                    <LayoutGrid size={24} className="text-[#B8860B]" /> Magneto
                </Link>
                <div className="flex items-center gap-4">
                    {user ? (
                        <div className="relative">
                            <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="w-9 h-9 border border-[#B8860B] rounded-md flex items-center justify-center text-xs font-bold text-[#1d1d1f]">
                                {user.name.charAt(0)}
                            </button>
                            {isDropdownOpen && (
                                <div className="absolute right-0 top-12 w-64 bg-white rounded-md shadow-2xl border border-gray-100 p-2 z-50">
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
                            className="px-5 py-2.5 border border-[#1d1d1f]/50 rounded-md text-[10px] font-bold uppercase tracking-widest text-[#1d1d1f]"
                        >
                            Entrar
                        </Link>
                    )}
                    <Link to="/cart" className="p-2.5 text-[#1d1d1f] relative">
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

    // Definição das rotas onde o Footer deve aparecer
    const showFooter = [
        '/', 
        '/history', '/process', '/sustainability', '/contact', '/faq',
        '/terms', '/privacy', '/exchanges', '/shipping'
    ].includes(location.pathname);

    return (
        <>
            <ScrollToTop />
            <NavbarWrapper user={user} cartCount={cart.length} onLogout={handleLogout} onOpenProfile={() => setIsProfileModalOpen(true)} />
            <Routes>
                <Route path="/" element={
                    <div className="bg-white">
                        <HeroSection />
                        <BenefitsSection />
                        <ProcessSection />
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
                <Route path="/studio/upload" element={<Studio addToCart={addToCart} initialImages={studioDraft} />} /> 
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
                        setIsProfileModalOpen(false);
                    }}
                />
            )}
        </>
    );
};

export default App;
