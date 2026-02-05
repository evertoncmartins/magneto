
import React, { useState, useRef, useEffect } from 'react';
import { 
    getAdminOrders, getFinancialStats, getUsers, getCoupons, 
    getPricingRules, updatePricingRules, getReviews, 
    getSiteContent, getFAQs
} from '../services/mockService';
import { 
    Package, Users, Ticket, Menu, TrendingUp, Tag, MessageSquare, 
    LogOut, Home, X, PenTool, LayoutGrid, Info, Search, 
    Activity, Server, Database, HelpCircle, ChevronLeft, ChevronRight, Quote, User, ChevronDown, Layers, FileText, Shield
} from 'lucide-react';
import { Order, User as UserType, Coupon, ProductTier, Review, PageContent, FAQ } from '../types';
import { useLocation, Link } from 'react-router-dom';

// Import Sub-components
import AdminOverview from './admin/AdminOverview';
import AdminOrders from './admin/AdminOrders';
import AdminUsers from './admin/AdminUsers';
import AdminFinance from './admin/AdminFinance';
import AdminCoupons from './admin/AdminCoupons';
import AdminPricing from './admin/AdminPricing';
import AdminReviews from './admin/AdminReviews';
import AdminCMS from './admin/AdminCMS';
import AdminFAQ from './admin/AdminFAQ';
import AdminLoginTestimonials from './admin/AdminLoginTestimonials';
import AdminUserModal from './admin/modals/AdminUserModal';
import AdminCouponModal from './admin/modals/AdminCouponModal';
import AdminUserHistoryModal from './admin/modals/AdminUserHistoryModal';

interface AdminDashboardProps {
    onLogout: () => void;
    onStartOrder: (targetUser: UserType) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout, onStartOrder }) => {
  // Navigation & UI State
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); // Desktop
  
  // CMS Submenu State - Inicializado como false (recolhido)
  const [isCmsSubmenuOpen, setIsCmsSubmenuOpen] = useState(false);
  const [isHomeSubmenuOpen, setIsHomeSubmenuOpen] = useState(false); // Novo estado para Home
  const [isInstitutionalSubmenuOpen, setIsInstitutionalSubmenuOpen] = useState(false);
  const [isPrivacySubmenuOpen, setIsPrivacySubmenuOpen] = useState(false); // Novo estado para Privacidade

  // Info Dropdown State
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const infoRef = useRef<HTMLDivElement>(null);

  // Mobile Profile Dropdown State
  const [isMobileProfileOpen, setIsMobileProfileOpen] = useState(false);
  const mobileProfileRef = useRef<HTMLDivElement>(null);
  
  // Data States
  const [orders, setOrders] = useState<Order[]>(getAdminOrders());
  const [users, setUsers] = useState<UserType[]>(getUsers());
  const [coupons, setCoupons] = useState<Coupon[]>(getCoupons());
  const [reviews, setReviews] = useState<Review[]>(getReviews());
  const [finance, setFinance] = useState(getFinancialStats());
  const [localRules, setLocalRules] = useState<ProductTier[]>(getPricingRules());
  const [cmsContent, setCmsContent] = useState<PageContent[]>(getSiteContent());
  const [faqs, setFaqs] = useState<FAQ[]>(getFAQs());
  
  // Filters
  const [globalSearch, setGlobalSearch] = useState('');
  // Lifted State for Orders Status Filter
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | Order['status'] | 'deleted'>('all');
  
  // Modals
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  
  // History Modal State
  const [historyUser, setHistoryUser] = useState<UserType | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const location = useLocation();

  // Close dropdowns when clicking outside
  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (infoRef.current && !infoRef.current.contains(event.target as Node)) {
              setIsInfoOpen(false);
          }
          if (mobileProfileRef.current && !mobileProfileRef.current.contains(event.target as Node)) {
              setIsMobileProfileOpen(false);
          }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle Redirect from Studio with Search Param
  useEffect(() => {
      if (location.state?.searchOrderId) {
          setGlobalSearch(location.state.searchOrderId);
          setActiveTab('orders');
          // Reset status filter to show the searched order regardless of status
          setOrderStatusFilter('all');
          // Scroll to top
          window.scrollTo(0, 0);
      }
  }, [location.state]);

  // --- ACTIONS ---

  const refreshData = () => {
      setUsers([...getUsers()]);
      setOrders([...getAdminOrders()]);
      setCoupons([...getCoupons()]);
      setReviews([...getReviews()]);
      setFinance(getFinancialStats());
      setLocalRules(getPricingRules());
      setCmsContent(getSiteContent());
      setFaqs(getFAQs());
  };

  const handleOpenUserModal = (user: UserType | null = null) => {
      setEditingUser(user);
      setIsUserModalOpen(true);
  };
  
  const handleOpenHistoryModal = (user: UserType) => {
      setHistoryUser(user);
      setIsHistoryModalOpen(true);
  };

  // Função para quando clica em um pedido dentro do histórico
  const handleSelectOrderFromHistory = (orderId: string) => {
      setIsHistoryModalOpen(false); // Fecha o modal
      setGlobalSearch(orderId); // Define a busca pelo ID do pedido
      setActiveTab('orders'); // Muda para a aba de pedidos
      
      // Scroll suave para o topo do conteúdo para garantir visibilidade
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- PRICING SYNC ---
  const handleUpdatePricing = (newRules: ProductTier[]) => {
      updatePricingRules(newRules);
      setLocalRules(newRules);
  };

  // Find Current Admin User for Profile Edit
  const currentAdminUser = users.find(u => u.isAdmin) || users[0];

  const SidebarItem = ({ id, icon: Icon, label, count, onClick }: any) => (
      <button 
        onClick={() => { 
            if (onClick) onClick();
            else {
                setActiveTab(id); 
                setIsSidebarOpen(false); 
                window.scrollTo(0,0); 
                if(id !== 'orders') setGlobalSearch(''); 
            }
        }}
        className={`w-full flex items-center px-4 py-3.5 rounded-xl transition-all duration-300 group relative ${
            activeTab === id 
            ? 'bg-[#1d1d1f] text-white shadow-lg' 
            : 'text-gray-500 hover:bg-gray-100 hover:text-[#1d1d1f]'
        } ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}
        title={isSidebarCollapsed ? label : ''}
      >
          <div className={`flex items-center gap-3 ${isSidebarCollapsed ? 'justify-center w-full' : ''}`}>
              <Icon size={18} className={`shrink-0 ${activeTab === id ? 'text-[#B8860B]' : 'text-gray-400 group-hover:text-[#1d1d1f]'}`} />
              {!isSidebarCollapsed && <span className="font-bold text-xs uppercase tracking-widest truncate">{label}</span>}
          </div>
          
          {/* Badge Expandido */}
          {!isSidebarCollapsed && count !== undefined && (
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${activeTab === id ? 'bg-[#B8860B] text-white' : 'bg-gray-200 text-gray-500'}`}>
                  {count}
              </span>
          )}

          {/* Badge Recolhido (Nova implementação com número) */}
          {isSidebarCollapsed && count !== undefined && (
              <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] bg-[#B8860B] text-white text-[9px] flex items-center justify-center rounded-full font-bold shadow-sm border-2 border-white z-10 px-0.5 animate-fade-in">
                  {count > 99 ? '99+' : count}
              </span>
          )}
      </button>
  );

  return (
    <div className="min-h-screen bg-[#F5F5F7] font-sans text-[#1d1d1f] flex flex-col md:flex-row">
      
      {/* MOBILE HEADER */}
      <div className="md:hidden fixed top-0 w-full z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 h-16 flex items-center justify-between px-4 shadow-sm">
          <div className="flex items-center gap-3">
              <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-gray-100 rounded-md active:bg-gray-200"><Menu size={20}/></button>
              <span className="font-serif font-bold text-lg flex items-center gap-2">
                  <LayoutGrid size={20} className="text-[#B8860B]" /> Magneto
              </span>
          </div>
          
          {/* Mobile Admin Profile Dropdown */}
          <div className="relative" ref={mobileProfileRef}>
              <button 
                  onClick={() => setIsMobileProfileOpen(!isMobileProfileOpen)} 
                  className="w-8 h-8 bg-[#1d1d1f] rounded-full flex items-center justify-center text-[#B8860B] text-xs font-bold shadow-sm"
              >
                  AD
              </button>
              {isMobileProfileOpen && (
                  <div className="absolute right-0 top-12 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 p-2 z-[60] animate-fade-in origin-top-right">
                      <div className="px-4 py-3 border-b border-gray-50 mb-1">
                          <p className="font-bold text-[#1d1d1f] text-[10px] uppercase tracking-widest truncate">Administrador</p>
                          <p className="text-[9px] text-gray-400 truncate">{currentAdminUser.email}</p>
                      </div>
                      <button onClick={() => { setIsMobileProfileOpen(false); handleOpenUserModal(currentAdminUser); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 text-[#1d1d1f] text-xs font-bold transition-colors text-left">
                          <User size={14} /> Meu Perfil
                      </button>
                      <Link to="/my-orders" className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 text-[#1d1d1f] text-xs font-bold transition-colors text-left">
                          <Package size={14} /> Meus Pedidos
                      </Link>
                      <button onClick={() => { setIsMobileProfileOpen(false); onLogout(); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-50 text-red-600 text-xs font-bold transition-colors text-left">
                          <LogOut size={14} /> Sair
                      </button>
                  </div>
              )}
          </div>
      </div>

      {/* SIDEBAR */}
      <aside className={`
          fixed inset-y-0 left-0 z-50 bg-white border-r border-gray-100 shadow-2xl md:shadow-none transform transition-all duration-300 ease-in-out md:relative flex flex-col h-auto
          ${isSidebarOpen ? 'translate-x-0 w-72' : '-translate-x-full md:translate-x-0'}
          ${isSidebarCollapsed ? 'md:w-20' : 'md:w-72'}
      `}>
          <div className="flex flex-col h-full p-4 sticky top-0 max-h-screen">
              {/* Sidebar Header */}
              <div className={`flex items-center mb-8 pt-2 md:pt-0 ${isSidebarCollapsed ? 'justify-center' : 'justify-between px-2'}`}>
                  {!isSidebarCollapsed ? (
                      <div className="flex items-center gap-3 text-2xl font-serif font-bold text-[#1d1d1f]">
                          <div className="w-10 h-10 bg-[#1d1d1f] text-[#B8860B] rounded-lg flex items-center justify-center shadow-lg shrink-0">
                             <LayoutGrid size={20} />
                          </div>
                          <span className="truncate">Magneto</span>
                      </div>
                  ) : (
                      <div className="w-10 h-10 bg-[#1d1d1f] text-[#B8860B] rounded-lg flex items-center justify-center shadow-lg shrink-0">
                         <LayoutGrid size={20} />
                      </div>
                  )}
                  
                  {/* Desktop Collapse Toggle */}
                  <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="hidden md:flex p-1.5 hover:bg-gray-100 rounded-md text-gray-400 hover:text-[#1d1d1f] transition-colors">
                      {isSidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                  </button>

                  {/* Mobile Close */}
                  <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2 hover:bg-gray-100 rounded-md"><X size={20}/></button>
              </div>

              <nav className="flex-1 space-y-1 overflow-y-auto scrollbar-hide overflow-x-hidden">
                  
                  <SidebarItem id="overview" icon={Home} label="Visão Geral" />
                  <SidebarItem id="finance" icon={TrendingUp} label="Financeiro" />
                  
                  <SidebarItem id="orders" icon={Package} label="Pedidos" count={orders.filter(o => o.status === 'pending').length || undefined} />
                  <SidebarItem id="users" icon={Users} label="Clientes" />
                  <SidebarItem id="coupons" icon={Ticket} label="Cupons" />
                  <SidebarItem id="pricing" icon={Tag} label="Preços" />
                  <SidebarItem id="reviews" icon={MessageSquare} label="Avaliações" count={reviews.filter(r => r.status === 'pending').length || undefined} />
                  <SidebarItem id="login-testimonials" icon={Quote} label="Depoimentos Login" />
                  <SidebarItem id="faq" icon={HelpCircle} label="Gerenciar FAQs" />

                  {/* CMS ROOT: Menu Principal */}
                  <button 
                      onClick={() => setIsCmsSubmenuOpen(!isCmsSubmenuOpen)}
                      className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all text-gray-500 hover:bg-gray-50 hover:text-[#1d1d1f] ${isSidebarCollapsed ? 'justify-center' : ''}`}
                  >
                      <div className="flex items-center gap-3">
                          <PenTool size={18} />
                          {!isSidebarCollapsed && <span className="font-bold text-xs uppercase tracking-widest truncate">Conteúdo do Site</span>}
                      </div>
                      {!isSidebarCollapsed && <ChevronDown size={14} className={`transition-transform ${isCmsSubmenuOpen ? 'rotate-180' : ''}`}/>}
                  </button>

                  {/* CMS SUBMENUS */}
                  {isCmsSubmenuOpen && !isSidebarCollapsed && (
                      <div className="ml-4 pl-4 border-l border-gray-100 space-y-1 mt-1">
                          
                          {/* 1. CMS: Home Page (Parent) */}
                          <button 
                              onClick={() => setIsHomeSubmenuOpen(!isHomeSubmenuOpen)}
                              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all text-gray-400 hover:text-[#1d1d1f] hover:bg-gray-50`}
                          >
                              <div className="flex items-center gap-3">
                                  <Home size={14} /> Home Page
                              </div>
                              <ChevronDown size={12} className={`transition-transform ${isHomeSubmenuOpen ? 'rotate-180' : ''}`}/>
                          </button>

                          {/* 1.1 Home Children */}
                          {isHomeSubmenuOpen && (
                              <div className="ml-4 pl-4 border-l border-gray-100 space-y-1 mt-1">
                                  <button onClick={() => { setActiveTab('cms-home'); setIsSidebarOpen(false); }} className={`w-full text-left px-4 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${activeTab === 'cms-home' ? 'text-[#B8860B] bg-[#FFF9E6]' : 'text-gray-400 hover:text-[#1d1d1f]'}`}>
                                      Conteúdo Principal
                                  </button>
                                  <button onClick={() => { setActiveTab('cms-stats'); setIsSidebarOpen(false); }} className={`w-full text-left px-4 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${activeTab === 'cms-stats' ? 'text-[#B8860B] bg-[#FFF9E6]' : 'text-gray-400 hover:text-[#1d1d1f]'}`}>
                                      Estatísticas
                                  </button>
                              </div>
                          )}

                          {/* 3. CMS: Submenu Institucional */}
                          <button 
                              onClick={() => setIsInstitutionalSubmenuOpen(!isInstitutionalSubmenuOpen)}
                              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all text-gray-400 hover:text-[#1d1d1f] hover:bg-gray-50`}
                          >
                              <div className="flex items-center gap-3">
                                  <Layers size={14} /> Institucional
                              </div>
                              <ChevronDown size={12} className={`transition-transform ${isInstitutionalSubmenuOpen ? 'rotate-180' : ''}`}/>
                          </button>

                          {/* 3.1 CMS: Páginas Institucionais */}
                          {isInstitutionalSubmenuOpen && (
                              <div className="ml-4 pl-4 border-l border-gray-100 space-y-1 mt-1">
                                  <button onClick={() => { setActiveTab('cms-history'); setIsSidebarOpen(false); }} className={`w-full text-left px-4 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${activeTab === 'cms-history' ? 'text-[#B8860B] bg-[#FFF9E6]' : 'text-gray-400 hover:text-[#1d1d1f]'}`}>
                                      Nossa História
                                  </button>
                                  <button onClick={() => { setActiveTab('cms-process'); setIsSidebarOpen(false); }} className={`w-full text-left px-4 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${activeTab === 'cms-process' ? 'text-[#B8860B] bg-[#FFF9E6]' : 'text-gray-400 hover:text-[#1d1d1f]'}`}>
                                      Proc. Produção
                                  </button>
                                  <button onClick={() => { setActiveTab('cms-sustainability'); setIsSidebarOpen(false); }} className={`w-full text-left px-4 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${activeTab === 'cms-sustainability' ? 'text-[#B8860B] bg-[#FFF9E6]' : 'text-gray-400 hover:text-[#1d1d1f]'}`}>
                                      Sustentabilidade
                                  </button>
                                  <button onClick={() => { setActiveTab('cms-faq-page'); setIsSidebarOpen(false); }} className={`w-full text-left px-4 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${activeTab === 'cms-faq-page' ? 'text-[#B8860B] bg-[#FFF9E6]' : 'text-gray-400 hover:text-[#1d1d1f]'}`}>
                                      Página FAQ
                                  </button>
                                  <button onClick={() => { setActiveTab('cms-contact'); setIsSidebarOpen(false); }} className={`w-full text-left px-4 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${activeTab === 'cms-contact' ? 'text-[#B8860B] bg-[#FFF9E6]' : 'text-gray-400 hover:text-[#1d1d1f]'}`}>
                                      Contato
                                  </button>
                              </div>
                          )}

                          {/* 4. CMS: Submenu Privacidade (NOVO) */}
                          <button 
                              onClick={() => setIsPrivacySubmenuOpen(!isPrivacySubmenuOpen)}
                              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all text-gray-400 hover:text-[#1d1d1f] hover:bg-gray-50`}
                          >
                              <div className="flex items-center gap-3">
                                  <Shield size={14} /> Privacidade
                              </div>
                              <ChevronDown size={12} className={`transition-transform ${isPrivacySubmenuOpen ? 'rotate-180' : ''}`}/>
                          </button>

                          {/* 4.1 CMS: Páginas de Privacidade */}
                          {isPrivacySubmenuOpen && (
                              <div className="ml-4 pl-4 border-l border-gray-100 space-y-1 mt-1">
                                  <button onClick={() => { setActiveTab('cms-terms'); setIsSidebarOpen(false); }} className={`w-full text-left px-4 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${activeTab === 'cms-terms' ? 'text-[#B8860B] bg-[#FFF9E6]' : 'text-gray-400 hover:text-[#1d1d1f]'}`}>
                                      Termos de Uso
                                  </button>
                                  <button onClick={() => { setActiveTab('cms-privacy'); setIsSidebarOpen(false); }} className={`w-full text-left px-4 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${activeTab === 'cms-privacy' ? 'text-[#B8860B] bg-[#FFF9E6]' : 'text-gray-400 hover:text-[#1d1d1f]'}`}>
                                      Política Priv.
                                  </button>
                                  <button onClick={() => { setActiveTab('cms-exchanges'); setIsSidebarOpen(false); }} className={`w-full text-left px-4 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${activeTab === 'cms-exchanges' ? 'text-[#B8860B] bg-[#FFF9E6]' : 'text-gray-400 hover:text-[#1d1d1f]'}`}>
                                      Política Troca
                                  </button>
                                  <button onClick={() => { setActiveTab('cms-shipping'); setIsSidebarOpen(false); }} className={`w-full text-left px-4 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${activeTab === 'cms-shipping' ? 'text-[#B8860B] bg-[#FFF9E6]' : 'text-gray-400 hover:text-[#1d1d1f]'}`}>
                                      Envios & Prazos
                                  </button>
                              </div>
                          )}
                          
                      </div>
                  )}

                  {/* Visual indication for collapsed state CMS */}
                  {isSidebarCollapsed && (
                      <button 
                        onClick={() => { setIsSidebarCollapsed(false); setIsCmsSubmenuOpen(true); }}
                        className={`w-full flex items-center justify-center px-4 py-3.5 rounded-xl transition-all group relative text-gray-500 hover:bg-gray-100 hover:text-[#1d1d1f]`}
                      >
                          <PenTool size={18} />
                      </button>
                  )}

              </nav>

              <div className="mt-auto border-t border-gray-100 pt-4">
                  <button 
                    onClick={() => handleOpenUserModal(currentAdminUser)}
                    className={`w-full flex items-center gap-3 p-2 rounded-xl bg-gray-50 mb-3 hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200 group ${isSidebarCollapsed ? 'justify-center' : ''}`}
                    title="Editar Perfil"
                  >
                      <div className="w-10 h-10 rounded-full bg-[#1d1d1f] flex items-center justify-center text-white font-bold text-xs shadow-md shrink-0 group-hover:scale-105 transition-transform">AD</div>
                      {!isSidebarCollapsed && (
                          <div className="flex-1 min-w-0 text-left">
                              <p className="text-sm font-bold text-[#1d1d1f] truncate">Admin</p>
                              <p className="text-[10px] text-gray-500 truncate">admin@magneto.com</p>
                          </div>
                      )}
                  </button>
                  <button onClick={onLogout} className={`w-full flex items-center gap-2 py-3 text-red-500 hover:bg-red-50 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors ${isSidebarCollapsed ? 'justify-center' : 'justify-center'}`}>
                      <LogOut size={14} /> {!isSidebarCollapsed && "Sair do Painel"}
                  </button>
              </div>
          </div>
      </aside>
      
      {isSidebarOpen && <div className="fixed inset-0 bg-black/20 z-40 md:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />}

      {/* MAIN CONTENT */}
      <main className="flex-1 min-h-screen pt-16 md:pt-0 scroll-smooth">
          <div className="max-w-7xl mx-auto p-6 md:p-10 space-y-8">
              
              {/* TOP BAR */}
              <div className="hidden md:flex justify-between items-center mb-8">
                  <div>
                      <h2 className="text-2xl font-serif font-bold text-[#1d1d1f]">
                          {activeTab === 'overview' && 'Dashboard Geral'}
                          {activeTab === 'orders' && 'Gestão de Pedidos'}
                          {activeTab === 'users' && 'Base de Clientes'}
                          {activeTab === 'finance' && 'Fluxo Financeiro'}
                          {activeTab === 'coupons' && 'Campanhas & Cupons'}
                          {activeTab === 'reviews' && 'Moderação de Reviews'}
                          {activeTab === 'pricing' && 'Planos & Preços'}
                          {activeTab === 'faq' && 'Gerenciamento de Perguntas'}
                          {activeTab === 'login-testimonials' && 'Depoimentos da Tela de Login'}
                          {activeTab.startsWith('cms-') && 'Gerenciamento de Conteúdo (CMS)'}
                      </h2>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Bem-vindo de volta, Admin.</p>
                  </div>
                  <div className="flex items-center gap-4" ref={infoRef}>
                      
                      <div className="relative">
                          <button 
                            onClick={() => setIsInfoOpen(!isInfoOpen)}
                            className={`p-2.5 rounded-full border shadow-sm relative transition-all duration-300 ${isInfoOpen ? 'bg-[#1d1d1f] text-white border-[#1d1d1f]' : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-500'}`}
                          >
                               <Info size={18} />
                          </button>

                          {isInfoOpen && (
                              <div className="absolute right-0 top-14 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 z-50 animate-fade-in origin-top-right">
                                  <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-50">
                                      <span className="text-[10px] font-bold text-[#1d1d1f] uppercase tracking-[0.2em] flex items-center gap-2">
                                          <Activity size={14} className="text-[#B8860B]" /> Status do Sistema
                                      </span>
                                      <span className="relative flex h-2.5 w-2.5">
                                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                                      </span>
                                  </div>
                                  
                                  <div className="space-y-4 mb-6">
                                      <div className="flex justify-between items-center text-xs">
                                          <span className="text-gray-500 flex items-center gap-2"><Server size={14}/> Servidor</span>
                                          <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wide">Online</span>
                                      </div>
                                      <div className="flex justify-between items-center text-xs">
                                          <span className="text-gray-500 flex items-center gap-2"><Database size={14}/> Banco de Dados</span>
                                          <span className="font-bold text-[#1d1d1f]">Conectado (4ms)</span>
                                      </div>
                                      <div className="flex justify-between items-center text-xs">
                                          <span className="text-gray-500 flex items-center gap-2"><Package size={14}/> Versão</span>
                                          <span className="font-bold text-[#1d1d1f]">v1.2.0 (Stable)</span>
                                      </div>
                                  </div>

                                  <button className="w-full py-3 bg-[#F5F5F7] hover:bg-[#1d1d1f] hover:text-white text-[#1d1d1f] rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 group">
                                      <HelpCircle size={14} className="text-gray-400 group-hover:text-white"/> Central de Ajuda
                                  </button>
                              </div>
                          )}
                      </div>
                  </div>
              </div>

              {/* CONTENT TABS */}
              {activeTab === 'overview' && (
                  <AdminOverview 
                      finance={finance} 
                      orders={orders} 
                      users={users} 
                      setActiveTab={setActiveTab} 
                      handleOpenUserModal={() => handleOpenUserModal(null)}
                      setIsCouponModalOpen={setIsCouponModalOpen}
                      setGlobalSearch={setGlobalSearch}
                      setOrderStatusFilter={setOrderStatusFilter}
                  />
              )}

              {activeTab === 'orders' && (
                  <AdminOrders 
                      orders={orders} 
                      globalSearch={globalSearch} 
                      setGlobalSearch={setGlobalSearch}
                      refreshData={refreshData}
                      orderStatusFilter={orderStatusFilter}
                      setOrderStatusFilter={setOrderStatusFilter}
                  />
              )}

              {activeTab === 'users' && (
                  <AdminUsers 
                      users={users}
                      globalSearch={globalSearch} 
                      setGlobalSearch={setGlobalSearch}
                      refreshData={refreshData}
                      onStartOrder={onStartOrder}
                      handleOpenUserModal={handleOpenUserModal}
                      handleViewHistory={handleOpenHistoryModal}
                  />
              )}

              {activeTab === 'finance' && (
                  <AdminFinance 
                      finance={finance}
                      orders={orders}
                      setActiveTab={setActiveTab}
                  />
              )}

              {activeTab === 'coupons' && (
                  <AdminCoupons 
                      coupons={coupons}
                      refreshData={refreshData}
                      setIsCouponModalOpen={setIsCouponModalOpen}
                  />
              )}

              {activeTab === 'pricing' && (
                  <AdminPricing 
                      localRules={localRules}
                      setLocalRules={handleUpdatePricing}
                  />
              )}

              {activeTab === 'reviews' && (
                  <AdminReviews 
                      reviews={reviews}
                      refreshData={refreshData}
                  />
              )}

              {/* RENDER CMS BASED ON SUB-TAB ID */}
              {activeTab.startsWith('cms-') && (
                  <AdminCMS 
                      cmsContent={cmsContent}
                      setCmsContent={setCmsContent}
                      initialPageId={activeTab.replace('cms-', '')}
                  />
              )}

              {activeTab === 'faq' && (
                  <AdminFAQ 
                      faqs={faqs}
                      refreshData={refreshData}
                  />
              )}

              {activeTab === 'login-testimonials' && (
                  <AdminLoginTestimonials />
              )}
          </div>
      </main>

      <AdminUserModal 
          isOpen={isUserModalOpen} 
          onClose={() => setIsUserModalOpen(false)} 
          editingUser={editingUser}
          refreshData={refreshData}
      />

      <AdminCouponModal 
          isOpen={isCouponModalOpen}
          onClose={() => setIsCouponModalOpen(false)}
          refreshData={refreshData}
      />
      
      <AdminUserHistoryModal
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
          user={historyUser}
          onSelectOrder={handleSelectOrderFromHistory}
      />

    </div>
  );
};

export default AdminDashboard;
