
import React, { useEffect, useState } from 'react';
import * as LucideIcons from 'lucide-react';
import { Send, Loader2, AlertCircle } from 'lucide-react';
import { getSiteContent } from '../services/mockService';

const ContactPage = () => {
    useEffect(() => { window.scrollTo(0, 0); }, []);
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [cmsData, setCmsData] = useState<any>({
        title: '',
        subtitle: '',
        items: []
    });
    
    // Load CMS Data
    useEffect(() => {
        const content = getSiteContent();
        const contactPage = content.find(p => p.id === 'contact');
        const infoSection = contactPage?.sections.find(s => s.id === 'info');
        
        const getVal = (sec: string, key: string) => 
            contactPage?.sections.find(s => s.id === sec)?.fields.find(f => f.key === key)?.value || '';

        const getSectionVal = (key: string) => 
            infoSection?.fields.find(f => f.key === key)?.value || '';

        // Default order if not set
        const orderString = getSectionVal('contact_order') || 'hours,email,phone,address,company_info';
        const order = orderString.split(',').filter(Boolean);

        const itemsMap: Record<string, { label: string, defaultIcon: string }> = {
            'hours': { label: 'Horário de Atendimento', defaultIcon: 'Clock' },
            'email': { label: 'E-mail', defaultIcon: 'Mail' },
            'phone': { label: 'WhatsApp / Telefone', defaultIcon: 'Phone' },
            'address': { label: 'Endereço', defaultIcon: 'MapPin' },
            'company_info': { label: 'Dados da Empresa', defaultIcon: 'FileText' }
        };

        const items = order.map(key => {
            const config = itemsMap[key];
            if (!config) return null;

            const value = getSectionVal(key);
            const visible = getSectionVal(`${key}_visible`) !== 'false'; // Default true
            const iconName = getSectionVal(`${key}_icon`) || config.defaultIcon;

            return {
                key,
                label: config.label,
                value,
                visible,
                iconName
            };
        }).filter(item => item && item.visible);

        setCmsData({
            title: getVal('header', 'title'),
            subtitle: getVal('header', 'subtitle'),
            items
        });
    }, []);

    // Estado do formulário
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        subject: 'Dúvida sobre Pedido',
        message: ''
    });

    // Estado de erros
    const [errors, setErrors] = useState({
        email: '',
        phone: ''
    });

    // Validação de telefone em tempo real para UI
    const cleanPhone = formData.phone.replace(/\D/g, '');
    const isPhoneInvalid = formData.phone !== '' && (
        cleanPhone.length < 10 || 
        (cleanPhone.length === 10 && cleanPhone[2] === '9')
    );

    // Máscara para o telefone (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const formatted = value
            .replace(/\D/g, '') // Remove não dígitos
            .replace(/^(\d{2})(\d)/g, '($1) $2') // Coloca parênteses
            .replace(/(\d)(\d{4})$/, '$1-$2') // Coloca hífen dinâmico
            .slice(0, 15); // Limita tamanho
        
        setFormData({ ...formData, phone: formatted });
        if (errors.phone) setErrors({ ...errors, phone: '' });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        
        if (name === 'email') {
             if (errors.email) setErrors({ ...errors, email: '' });
        }
    };

    // Validação de Email no onBlur para feedback imediato
    const handleEmailBlur = () => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (formData.email && !emailRegex.test(formData.email)) {
            setErrors(prev => ({ ...prev, email: 'Formato de e-mail inválido.' }));
        }
    };

    const validateForm = () => {
        let isValid = true;
        const newErrors = { email: '', phone: '' };

        // Validação de Email Regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            newErrors.email = 'Por favor, insira um e-mail válido.';
            isValid = false;
        }

        // Validação de Telefone rigorosa
        // Regra:
        // 1. Menos de 10 dígitos: Inválido
        // 2. 10 dígitos: Se o terceiro dígito (primeiro do número) for 9, é celular incompleto
        const cleanP = formData.phone.replace(/\D/g, '');
        if (cleanP.length < 10 || (cleanP.length === 10 && cleanP[2] === '9')) {
            newErrors.phone = 'Telefone incompleto.';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        setSending(true);
        // Simulação de envio
        setTimeout(() => {
            setSending(false);
            setSent(true);
            setFormData({ name: '', email: '', phone: '', subject: 'Dúvida sobre Pedido', message: '' });
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-[#F5F5F7] pt-32 pb-24 px-6">
            <div className="max-w-[1200px] mx-auto">
                <div className="text-center mb-16">
                    <span className="text-[#B8860B] font-bold text-[10px] uppercase tracking-[0.3em] mb-4 block">Fale Conosco</span>
                    <h1 className="text-4xl md:text-6xl font-serif text-[#1d1d1f] mb-6">{cmsData.title}</h1>
                    <p className="text-[#86868b] max-w-xl mx-auto text-lg font-light whitespace-pre-wrap">
                        {cmsData.subtitle}
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 bg-white rounded-md shadow-xl overflow-hidden">
                    {/* Info Side */}
                    <div className="bg-[#1d1d1f] text-white p-12 flex flex-col relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[#B8860B]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                        
                        <div className="relative z-10">
                            <h3 className="font-serif text-2xl mb-10">Canais de Atendimento</h3>

                            <div className="space-y-8">
                                {cmsData.items.map((item: any) => {
                                    // @ts-ignore
                                    const Icon = LucideIcons[item.iconName] || LucideIcons.Globe;
                                    
                                    return (
                                        <div key={item.key} className="flex items-start gap-4">
                                            <div className="w-12 h-12 bg-white/10 rounded-md flex items-center justify-center text-[#B8860B] shrink-0">
                                                <Icon size={20} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1">{item.label}</p>
                                                <p className="font-medium whitespace-pre-line">{item.value}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Form Side */}
                    <div className="p-12">
                        {sent ? (
                            <div className="h-full flex flex-col items-center justify-center text-center animate-fade-in">
                                <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-6">
                                    <Send size={32} />
                                </div>
                                <h3 className="text-2xl font-serif text-[#1d1d1f] mb-2">Mensagem Enviada!</h3>
                                <p className="text-[#86868b]">Responderemos em até 24 horas úteis.</p>
                                <button onClick={() => setSent(false)} className="mt-8 text-[#B8860B] font-bold uppercase tracking-widest text-xs border-b border-[#B8860B]">Enviar nova mensagem</button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <h3 className="text-xl font-serif text-[#1d1d1f] mb-6">Envie uma mensagem</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-[#86868b] uppercase px-1">Nome</label>
                                        <input 
                                            name="name"
                                            required 
                                            className="w-full px-4 py-3 bg-[#F5F5F7] border border-transparent focus:bg-white focus:border-[#B8860B] rounded-md text-sm outline-none transition-all" 
                                            placeholder="Seu nome"
                                            value={formData.name}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-[#86868b] uppercase px-1">WhatsApp / Celular</label>
                                        <input 
                                            name="phone"
                                            required 
                                            type="tel"
                                            maxLength={15}
                                            className={`w-full px-4 py-3 bg-[#F5F5F7] border rounded-md text-sm outline-none transition-all ${
                                                errors.phone || isPhoneInvalid 
                                                ? 'border-red-300 focus:border-red-500 text-red-600 focus:ring-1 focus:ring-red-200' 
                                                : 'border-transparent focus:bg-white focus:border-[#B8860B]'
                                            }`} 
                                            placeholder="(11) 99999-9999"
                                            value={formData.phone}
                                            onChange={handlePhoneChange}
                                        />
                                        {(errors.phone || isPhoneInvalid) && (
                                            <p className="text-red-500 text-xs flex items-center gap-1 mt-1 font-bold">
                                                <AlertCircle size={12}/> {errors.phone || 'Telefone incompleto'}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-[#86868b] uppercase px-1">E-mail</label>
                                    <input 
                                        name="email"
                                        required 
                                        type="email" 
                                        className={`w-full px-4 py-3 bg-[#F5F5F7] border focus:bg-white rounded-md text-sm outline-none transition-all ${errors.email ? 'border-red-300 focus:border-red-500' : 'border-transparent focus:border-[#B8860B]'}`}
                                        placeholder="seu@email.com"
                                        value={formData.email}
                                        onChange={handleChange}
                                        onBlur={handleEmailBlur}
                                    />
                                    {errors.email && <p className="text-red-500 text-xs flex items-center gap-1 mt-1"><AlertCircle size={12}/> {errors.email}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-[#86868b] uppercase px-1">Assunto</label>
                                    <select 
                                        name="subject"
                                        className="w-full px-4 py-3 bg-[#F5F5F7] border border-transparent focus:bg-white focus:border-[#B8860B] rounded-md text-sm outline-none transition-all"
                                        value={formData.subject}
                                        onChange={handleChange}
                                    >
                                        <option>Dúvida sobre Pedido</option>
                                        <option>Informações sobre Produtos</option>
                                        <option>Parcerias / Imprensa</option>
                                        <option>Outros</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-[#86868b] uppercase px-1">Mensagem</label>
                                    <textarea 
                                        name="message"
                                        required 
                                        rows={5} 
                                        className="w-full px-4 py-3 bg-[#F5F5F7] border border-transparent focus:bg-white focus:border-[#B8860B] rounded-md text-sm outline-none transition-all resize-none" 
                                        placeholder="Como podemos ajudar?"
                                        value={formData.message}
                                        onChange={handleChange}
                                    ></textarea>
                                </div>
                                <button 
                                    type="submit" 
                                    disabled={sending}
                                    className="w-full py-4 bg-[#1d1d1f] text-white font-bold text-[10px] uppercase tracking-[0.2em] rounded-md hover:bg-black transition-all shadow-lg flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {sending ? <Loader2 className="animate-spin" size={16}/> : <>Enviar Mensagem <Send size={16}/></>}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContactPage;
