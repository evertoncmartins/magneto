
import React, { useState, useEffect, useMemo } from 'react';
import { User, LoginTestimonial } from '../types';
import { loginUser, registerUser, loginWithGoogle, getLoginTestimonials, getLoginTestimonialConfig } from '../services/mockService';
import { ArrowRight, Loader2, LayoutGrid, Mail, Lock, User as UserIcon, Eye, EyeOff, Star, ChevronLeft, Phone, AlertCircle } from 'lucide-react';
import { useLocation, useNavigate, Link } from 'react-router-dom';

interface AuthProps {
  onLogin: (user: User) => void;
  initialMode?: 'login' | 'register';
  user?: User | null;
}

const Auth: React.FC<AuthProps> = ({ onLogin, initialMode = 'login', user }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Testimonial State
  const [testimonial, setTestimonial] = useState<LoginTestimonial | null>(null);
  
  // Handle redirection if user is already logged in or logs in successfully
  useEffect(() => {
      if (user) {
          // Lógica de Prioridade de Redirecionamento
          if (user.isAdmin) {
              // Se for Admin, vai direto para o painel, ignorando o histórico 'from'
              navigate('/admin', { replace: true });
          } else {
              // Se for Usuário Comum, respeita o fluxo de origem (ex: carrinho) ou vai para home
              const from = (location.state as any)?.from;
              if (from) {
                  navigate(from, { replace: true });
              } else {
                  navigate('/', { replace: true });
              }
          }
      }
  }, [user, navigate, location.state]);

  // Load Logic for Dynamic Testimonials
  useEffect(() => {
      const allTestimonials = getLoginTestimonials().filter(t => t.isActive);
      const config = getLoginTestimonialConfig();
      
      if (allTestimonials.length === 0) return;

      // Limit items based on config
      const activePool = allTestimonials.slice(0, config.maxItems);
      
      let selectedItem: LoginTestimonial;

      if (config.displayMode === 'random') {
          selectedItem = activePool[Math.floor(Math.random() * activePool.length)];
      } else {
          // Sequential Logic
          const lastIndexStr = localStorage.getItem('magneto_login_sequence_index');
          let nextIndex = 0;
          
          if (lastIndexStr) {
              const lastIndex = parseInt(lastIndexStr);
              nextIndex = (lastIndex + 1) % activePool.length;
          }
          
          localStorage.setItem('magneto_login_sequence_index', nextIndex.toString());
          selectedItem = activePool[nextIndex];
      }

      setTestimonial(selectedItem);
  }, []);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: ''
  });

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formatted = value
        .replace(/\D/g, '') // Remove não dígitos
        .replace(/^(\d{2})(\d)/g, '($1) $2') // Coloca parênteses
        .replace(/(\d)(\d{4})$/, '$1-$2') // Coloca hífen
        .slice(0, 15); // Limita tamanho
    
    setFormData(prev => ({ ...prev, phone: formatted }));

    // Validação em tempo real
    const cleanPhone = formatted.replace(/\D/g, '');
    if (cleanPhone.length > 0) {
         // Regra: Menos de 10 dígitos OU (10 dígitos começando com 9 = celular sem o nono dígito)
         if (cleanPhone.length < 10 || (cleanPhone.length === 10 && cleanPhone[2] === '9')) {
            setPhoneError('Telefone incompleto');
         } else {
            setPhoneError('');
         }
    } else {
        setPhoneError('');
    }
  };

  const validateEmail = (email: string) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setFormData(prev => ({ ...prev, email: value }));
      
      if (emailError) {
          if (validateEmail(value)) {
              setEmailError('');
          }
      }
  };

  const handleEmailBlur = () => {
      if (formData.email && !validateEmail(formData.email)) {
          setEmailError('E-mail inválido');
      } else {
          setEmailError('');
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validação Final antes do envio
    if (mode === 'register') {
        const cleanPhone = formData.phone.replace(/\D/g, '');
        if (cleanPhone.length < 10 || (cleanPhone.length === 10 && cleanPhone[2] === '9')) {
            setPhoneError('Por favor, informe um telefone válido.');
            return;
        }
        
        if (!validateEmail(formData.email)) {
            setEmailError('Por favor, informe um e-mail válido.');
            return;
        }
    }

    setLoading(true);

    try {
      let loggedUser;
      if (mode === 'login') {
        loggedUser = await loginUser(formData.email, formData.password);
      } else {
        loggedUser = await registerUser(formData.name, formData.email, formData.password, formData.phone);
      }
      onLogin(loggedUser);
      // Redirection handled by useEffect
    } catch (err: any) {
      setError(err.message || 'Erro no processamento.');
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
      setGoogleLoading(true);
      setError('');
      try {
          const loggedUser = await loginWithGoogle();
          onLogin(loggedUser);
          // Redirection handled by useEffect
      } catch (err: any) {
          setError('Erro ao autenticar com Google.');
          setGoogleLoading(false);
      }
  };

  const switchMode = (newMode: 'login' | 'register') => {
      setMode(newMode);
      setError('');
      setPhoneError('');
      setEmailError('');
      setFormData({ name: '', email: '', password: '', phone: '' });
  };

  if (user) return null; // Or a loading spinner if desired while redirecting

  return (
    <div className="flex min-h-screen bg-white font-sans selection:bg-[#B8860B] selection:text-white">
      
      {/* --- LEFT SIDE: VISUAL (Desktop) --- */}
      <div className="hidden lg:flex w-[45%] relative bg-[#0a0a0a] flex-col justify-between overflow-hidden">
          {/* Background Image */}
          {testimonial && (
              <div className="absolute inset-0 z-0">
                 <div className="absolute inset-0 bg-black/40 z-10"></div>
                 {/* PERFORMANCE FIX: Reduced image resolution */}
                 <img 
                   src={testimonial.bgImage} 
                   className="w-full h-full object-cover opacity-80 transition-opacity duration-1000"
                   alt="Gallery Wall"
                 />
              </div>
          )}

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
          {testimonial && (
              <div className="relative z-20 p-12 max-w-lg animate-fade-in">
                  <div className="flex gap-1 mb-6 text-[#B8860B]">
                      {[...Array(5)].map((_,i) => <Star key={i} size={18} fill={i < testimonial.rating ? "currentColor" : "none"} strokeWidth={0} />)}
                  </div>
                  <blockquote className="text-3xl font-serif text-white leading-snug mb-6">
                      "{testimonial.quote}"
                  </blockquote>
                  <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 overflow-hidden">
                          <img src={testimonial.avatar} className="w-full h-full object-cover" alt="User" />
                      </div>
                      <div>
                          <p className="text-white font-bold text-sm">{testimonial.author}</p>
                          <p className="text-white/60 text-xs uppercase tracking-widest">{testimonial.role}</p>
                      </div>
                  </div>
              </div>
          )}
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
                              <Mail className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors ${emailError ? 'text-red-400' : 'text-gray-400 group-focus-within:text-[#1d1d1f]'}`} size={20} />
                              <input 
                                  type="email" 
                                  required
                                  placeholder="seu@email.com"
                                  className={`w-full h-16 pl-12 pr-4 bg-gray-50 rounded-xl text-lg text-[#1d1d1f] outline-none border transition-all placeholder:text-gray-400 ${emailError ? 'border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-100' : 'border-transparent focus:bg-white focus:border-[#B8860B] focus:shadow-lg'}`}
                                  value={formData.email}
                                  onChange={handleEmailChange}
                                  onBlur={handleEmailBlur}
                              />
                          </div>
                          {emailError && (
                            <p className="text-red-500 text-[10px] mt-1 font-bold uppercase tracking-wide flex items-center gap-1 pl-1 animate-pulse">
                                <AlertCircle size={10} /> {emailError}
                            </p>
                          )}
                      </div>

                      {mode === 'register' && (
                          <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-[#1d1d1f] uppercase tracking-widest ml-1">Telefone</label>
                              <div className="relative group">
                                  <Phone className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors ${phoneError ? 'text-red-400' : 'text-gray-400 group-focus-within:text-[#1d1d1f]'}`} size={20} />
                                  <input 
                                      type="tel" 
                                      placeholder="(00) 00000-0000"
                                      className={`w-full h-16 pl-12 pr-4 bg-gray-50 rounded-xl text-lg text-[#1d1d1f] outline-none border focus:bg-white focus:shadow-lg transition-all placeholder:text-gray-400 ${phoneError ? 'border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-100' : 'border-transparent focus:border-[#B8860B]'}`}
                                      value={formData.phone}
                                      onChange={handlePhoneChange}
                                      maxLength={15}
                                  />
                              </div>
                              {phoneError && (
                                <p className="text-red-500 text-[10px] mt-1 font-bold uppercase tracking-wide flex items-center gap-1 pl-1 animate-pulse">
                                    <AlertCircle size={10} /> {phoneError}
                                </p>
                              )}
                          </div>
                      )}

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
