
import React, { useState } from 'react';
import { User } from '../types';
import { loginUser, registerUser, loginWithGoogle } from '../services/mockService';
import { ArrowRight, Loader2, LayoutGrid, Mail, Lock, User as UserIcon, Eye, EyeOff, Star, ChevronLeft } from 'lucide-react';
import { useLocation, useNavigate, Link } from 'react-router-dom';

interface AuthProps {
  onLogin: (user: User) => void;
  initialMode?: 'login' | 'register';
}

// Configuração dos Depoimentos e Imagens de Fundo
const TESTIMONIALS = [
    {
        quote: "A qualidade da impressão superou todas as minhas expectativas. É arte pura na minha geladeira.",
        author: "Sofia M.",
        role: "Arquiteta • SP",
        bgImage: "https://images.unsplash.com/photo-1493863641943-9b68992a8d07?q=80&w=1200&auto=format&fit=crop",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"
    },
    {
        quote: "Transformou as fotos da nossa viagem de lua de mel em uma galeria diária. O acabamento fosco é incrível.",
        author: "Lucas & Bia",
        role: "Recém-casados • RJ",
        bgImage: "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?q=80&w=1200&auto=format&fit=crop",
        avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=100&q=80"
    },
    {
        quote: "A melhor forma de ver meu filho crescer todos os dias enquanto preparo o café. Embalagem impecável.",
        author: "Mariana T.",
        role: "Mãe & Designer • MG",
        bgImage: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?q=80&w=1200&auto=format&fit=crop",
        avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80"
    },
    {
        quote: "Sempre tive dificuldade em revelar fotos, mas a Magneto tornou tudo simples. O kit de ímãs é o presente perfeito.",
        author: "Roberto C.",
        role: "Fotógrafo • RS",
        bgImage: "https://images.unsplash.com/photo-1552168324-d612d77725e3?q=80&w=1200&auto=format&fit=crop",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80"
    },
    {
        quote: "Meus gatos agora estão eternizados na cozinha. A aderência do ímã é muito forte, segura recados perfeitamente.",
        author: "Júlia V.",
        role: "Veterinária • PR",
        bgImage: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=1200&auto=format&fit=crop",
        avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&q=80"
    },
    {
        quote: "Uso para organizar meus projetos visuais no escritório. Estética minimalista que combina com qualquer ambiente.",
        author: "André L.",
        role: "Diretor de Arte • SP",
        bgImage: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?q=80&w=1200&auto=format&fit=crop",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80"
    },
    {
        quote: "A nitidez das cores me surpreendeu. Parece que estou olhando para a tela do celular, mas com textura.",
        author: "Carla D.",
        role: "Artista Plástica • BA",
        bgImage: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=1200&auto=format&fit=crop",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80"
    },
    {
        quote: "Fiz um pedido para dar de lembrança no aniversário da minha avó. Todos se emocionaram com a qualidade.",
        author: "Felipe S.",
        role: "Estudante • SC",
        bgImage: "https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=1200&auto=format&fit=crop",
        avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=100&q=80"
    },
    {
        quote: "Cada ímã conta uma história. É muito mais legal do que deixar as fotos perdidas na galeria do smartphone.",
        author: "Beatriz M.",
        role: "Jornalista • PE",
        bgImage: "https://images.unsplash.com/photo-1473186578169-21484721bc7b?q=80&w=1200&auto=format&fit=crop",
        avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=100&q=80"
    },
    {
        quote: "O processo de criação no site é viciante de tão fácil. Em 5 minutos montei meu kit 'Verão 2024'.",
        author: "Thiago R.",
        role: "Dev Frontend • DF",
        bgImage: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop",
        avatar: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=100&q=80"
    }
];

const Auth: React.FC<AuthProps> = ({ onLogin, initialMode = 'login' }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Seleciona um depoimento aleatório na inicialização do componente
  const [currentVariant] = useState(() => TESTIMONIALS[Math.floor(Math.random() * TESTIMONIALS.length)]);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const handleLoginSuccess = (user: User) => {
    onLogin(user);
    const from = (location.state as any)?.from;
    
    if (from) {
      navigate(from, { replace: true });
    } else if (user.isAdmin) {
      navigate('/admin', { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let user;
      if (mode === 'login') {
        user = await loginUser(formData.email, formData.password);
      } else {
        user = await registerUser(formData.name, formData.email, formData.password);
      }
      handleLoginSuccess(user);
    } catch (err: any) {
      setError(err.message || 'Erro no processamento.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
      setGoogleLoading(true);
      setError('');
      try {
          const user = await loginWithGoogle();
          handleLoginSuccess(user);
      } catch (err: any) {
          setError('Erro ao autenticar com Google.');
      } finally {
          setGoogleLoading(false);
      }
  };

  const switchMode = (newMode: 'login' | 'register') => {
      setMode(newMode);
      setError('');
      setFormData({ name: '', email: '', password: '' });
  };

  return (
    <div className="flex min-h-screen bg-white font-sans selection:bg-[#B8860B] selection:text-white">
      
      {/* --- LEFT SIDE: VISUAL (Desktop) --- */}
      <div className="hidden lg:flex w-[45%] relative bg-[#0a0a0a] flex-col justify-between overflow-hidden">
          {/* Background Image */}
          <div className="absolute inset-0 z-0">
             <div className="absolute inset-0 bg-black/40 z-10"></div>
             {/* PERFORMANCE FIX: Reduced image resolution from w=2000 to w=1200 */}
             <img 
               src={currentVariant.bgImage} 
               className="w-full h-full object-cover opacity-80 transition-opacity duration-1000"
               alt="Gallery Wall"
             />
          </div>

          {/* Logo on Image */}
          <div className="relative z-20 p-12">
              <Link to="/" className="flex items-center gap-3 text-white hover:opacity-90 transition-opacity w-fit group">
                  <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-lg flex items-center justify-center border border-white/20 group-hover:bg-white/20 transition-all">
                    <LayoutGrid size={20} className="text-white" />
                  </div>
                  <span className="font-serif font-bold text-2xl tracking-tight">Magneto</span>
              </Link>
          </div>

          {/* Testimonial */}
          <div className="relative z-20 p-12 max-w-lg animate-fade-in">
              <div className="flex gap-1 mb-6 text-[#B8860B]">
                  {[...Array(5)].map((_,i) => <Star key={i} size={18} fill="currentColor" strokeWidth={0} />)}
              </div>
              <blockquote className="text-3xl font-serif text-white leading-snug mb-6">
                  "{currentVariant.quote}"
              </blockquote>
              <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 overflow-hidden">
                      <img src={currentVariant.avatar} className="w-full h-full object-cover" alt="User" />
                  </div>
                  <div>
                      <p className="text-white font-bold text-sm">{currentVariant.author}</p>
                      <p className="text-white/60 text-xs uppercase tracking-widest">{currentVariant.role}</p>
                  </div>
              </div>
          </div>
      </div>

      {/* --- RIGHT SIDE: FORM --- */}
      <div className="w-full lg:w-[55%] flex flex-col relative bg-white">
          
          {/* Mobile Top Bar */}
          {/* PERFORMANCE FIX: Removed backdrop-blur-md for better mobile stability */}
          <div className="lg:hidden p-6 flex justify-between items-center absolute top-0 w-full z-10 bg-white border-b border-gray-100 shadow-sm">
              <Link to="/" className="text-[#1d1d1f] flex items-center gap-2">
                  <ChevronLeft size={20}/> <span className="text-xs font-bold uppercase tracking-widest">Voltar</span>
              </Link>
          </div>

          <div className="flex-1 flex flex-col justify-center px-6 sm:px-16 md:px-24 lg:px-32 xl:px-40 py-20 overflow-y-auto">
              
              <div className="w-full max-w-md mx-auto animate-fade-in">

                  {/* --- TOGGLE SWITCH (Top) --- */}
                  <div className="flex justify-center mb-10">
                      <div className="flex bg-gray-100 p-1 rounded-full w-fit">
                          <button
                              onClick={() => switchMode('login')}
                              className={`px-8 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${mode === 'login' ? 'bg-white text-[#1d1d1f] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                          >
                              Entrar
                          </button>
                          <button
                              onClick={() => switchMode('register')}
                              className={`px-8 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${mode === 'register' ? 'bg-[#1d1d1f] text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                          >
                              Criar Conta
                          </button>
                      </div>
                  </div>
                  
                  {/* --- LOGO ON FORM (Main Identity) --- */}
                  <div className="mb-8 flex flex-col items-center justify-center text-center">
                      <Link to="/" className="inline-flex items-center gap-4 mb-2 group">
                          <div className="w-12 h-12 bg-[#1d1d1f] text-white rounded-xl flex items-center justify-center shadow-lg group-hover:bg-[#B8860B] transition-colors duration-300">
                             <LayoutGrid size={24} strokeWidth={2} />
                          </div>
                          <span className="font-serif font-bold text-3xl text-[#1d1d1f] tracking-tight">Magneto</span>
                      </Link>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-5">
                      
                      {mode === 'register' && (
                          <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-[#1d1d1f] uppercase tracking-widest ml-1">Nome Completo</label>
                              <div className="relative group">
                                  <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#1d1d1f] transition-colors" size={20} />
                                  <input 
                                      type="text" 
                                      required
                                      placeholder="Seu nome"
                                      className="w-full h-16 pl-12 pr-4 bg-gray-50 rounded-xl text-lg text-[#1d1d1f] outline-none border border-transparent focus:bg-white focus:border-[#B8860B] focus:shadow-lg transition-all placeholder:text-gray-400"
                                      value={formData.name}
                                      onChange={e => setFormData({...formData, name: e.target.value})}
                                  />
                              </div>
                          </div>
                      )}

                      <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-[#1d1d1f] uppercase tracking-widest ml-1">E-mail</label>
                          <div className="relative group">
                              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#1d1d1f] transition-colors" size={20} />
                              <input 
                                  type="email" 
                                  required
                                  placeholder="seu@email.com"
                                  className="w-full h-16 pl-12 pr-4 bg-gray-50 rounded-xl text-lg text-[#1d1d1f] outline-none border border-transparent focus:bg-white focus:border-[#B8860B] focus:shadow-lg transition-all placeholder:text-gray-400"
                                  value={formData.email}
                                  onChange={e => setFormData({...formData, email: e.target.value})}
                              />
                          </div>
                      </div>

                      <div className="space-y-1.5">
                          <div className="flex justify-between items-center ml-1">
                              <label className="text-[10px] font-bold text-[#1d1d1f] uppercase tracking-widest">Senha</label>
                              {mode === 'login' && (
                                  <button type="button" className="text-[10px] font-bold text-[#86868b] hover:text-[#B8860B] uppercase tracking-widest transition-colors">
                                      Esqueceu a senha?
                                  </button>
                              )}
                          </div>
                          <div className="relative group">
                              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#1d1d1f] transition-colors" size={20} />
                              <input 
                                  type={showPassword ? "text" : "password"} 
                                  required
                                  placeholder="••••••••"
                                  className="w-full h-16 pl-12 pr-12 bg-gray-50 rounded-xl text-lg text-[#1d1d1f] outline-none border border-transparent focus:bg-white focus:border-[#B8860B] focus:shadow-lg transition-all placeholder:text-gray-400 tracking-widest"
                                  value={formData.password}
                                  onChange={e => setFormData({...formData, password: e.target.value})}
                              />
                              <button 
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#1d1d1f] p-2 hover:bg-gray-100 rounded-full transition-all"
                              >
                                  {showPassword ? <EyeOff size={20}/> : <Eye size={20}/>}
                              </button>
                          </div>
                      </div>

                      {error && (
                          <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 animate-pulse">
                              <div className="w-1.5 h-1.5 bg-red-500 rounded-full shrink-0"></div>
                              <p className="text-xs font-bold uppercase tracking-wide">{error}</p>
                          </div>
                      )}

                      <button 
                          type="submit" 
                          disabled={loading || googleLoading}
                          className="w-full h-16 mt-2 bg-[#1d1d1f] text-white rounded-xl font-bold text-sm uppercase tracking-[0.25em] hover:bg-black hover:shadow-2xl hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-4 disabled:opacity-70 disabled:cursor-not-allowed group"
                      >
                          {loading ? <Loader2 className="animate-spin" /> : (
                              <>{mode === 'login' ? 'Acessar Conta' : 'Criar Cadastro'} <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform"/></>
                          )}
                      </button>
                  </form>

                  {/* Divider */}
                  <div className="my-8 relative flex justify-center text-xs">
                      <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
                      <span className="relative bg-white px-4 text-gray-300 font-bold uppercase tracking-widest">OU</span>
                  </div>

                  <button 
                      onClick={handleGoogleLogin}
                      disabled={loading || googleLoading}
                      className="w-full h-16 bg-white border border-gray-200 text-[#1d1d1f] rounded-xl font-bold text-xs uppercase tracking-[0.2em] hover:border-[#B8860B] hover:text-[#B8860B] hover:shadow-md transition-all flex items-center justify-center gap-4 disabled:opacity-50 group"
                  >
                      {googleLoading ? <Loader2 className="animate-spin text-gray-400" size={20} /> : (
                          <>
                            <svg className="w-5 h-5 transition-all" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" fill="#FBBC05"/>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                            </svg>
                            Google
                          </>
                      )}
                  </button>
              </div>
          </div>
      </div>
    </div>
  );
};

export default Auth;
