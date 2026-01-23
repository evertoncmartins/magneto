
import React, { useState, useEffect, useRef } from 'react';
import { MagnetItem, User, Coupon, Address, ProductTier } from '../types';
import { 
    ShoppingBag, Trash2, ArrowRight, Package, Tag, MapPin, 
    CheckCircle, Loader2, Edit3, Plus, X, Ticket, 
    ImageIcon, Truck, CreditCard, ChevronDown, Shield, UserCheck, Search, Crown, Layers,
    Lock, Wallet, Home, Sparkles, Camera, Save, Map
} from 'lucide-react';
import { calculateUnitPrice, validateCoupon, createOrder, updateUser, getUsers, getPricingRules } from '../services/mockService';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import CheckoutSteps from './CheckoutSteps';

interface CartProps {
    items: MagnetItem[];
    onRemove: (id: string) => void;
    onRemoveBatch: (ids: string[]) => void;
    onClear: () => void;
    user: User | null;
    resumeKit: (items: MagnetItem[]) => void;
    onUpdateUser: (data: Partial<User>) => void;
    adminDraftUser?: User | null;
    onClearAdminMode?: () => void;
}

const STATE_MAP: Record<string, string> = {
    'AC': 'Acre', 'AL': 'Alagoas', 'AP': 'Amapá', 'AM': 'Amazonas', 'BA': 'Bahia', 'CE': 'Ceará',
    'DF': 'Distrito Federal', 'ES': 'Espírito Santo', 'GO': 'Goiás', 'MA': 'Maranhão', 'MT': 'Mato Grosso',
    'MS': 'Mato Grosso do Sul', 'MG': 'Minas Gerais', 'PA': 'Paraíba', 'PR': 'Paraná',
    'PE': 'Pernambuco', 'PI': 'Piauí', 'RJ': 'Rio de Janeiro', 'RN': 'Rio Grande do Norte',
    'RS': 'Rio Grande do Sul', 'RO': 'Rondônia', 'RR': 'Roraima', 'SC': 'Santa Catarina',
    'SP': 'São Paulo', 'SE': 'Sergipe', 'TO': 'Tocantins'
};

const Cart: React.FC<CartProps> = ({ items, onRemove, onRemoveBatch, onClear, user, resumeKit, onUpdateUser, adminDraftUser, onClearAdminMode }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [tiers, setTiers] = useState<ProductTier[]>(getPricingRules());
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
    const [couponError, setCouponError] = useState('');
    const [isFinishing, setIsFinishing] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [showPolicyModal, setShowPolicyModal] = useState(false);
    
    // Confirmação de Limpeza
    const [isClearCartModalOpen, setIsClearCartModalOpen] = useState(false);
    
    // Verifica se o endereço foi confirmado nesta sessão através do state da navegação
    const isAddressConfirmed = location.state?.addressConfirmed;
    
    // Admin Mode State
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [selectedClient, setSelectedClient] = useState<User | null>(adminDraftUser || user);
    
    // Admin Search State
    const [searchTerm, setSearchTerm] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Admin Address Selector State
    const [isAddressSelectorOpen, setIsAddressSelectorOpen] = useState(false);

    // Admin Address Creation State
    const [isAdminAddressFormOpen, setIsAdminAddressFormOpen] = useState(false);
    const [adminAddressForm, setAdminAddressForm] = useState<Address>({
        nickname: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '', zipCode: ''
    });
    const [isFetchingCep, setIsFetchingCep] = useState(false);

    useEffect(() => {
        setTiers(getPricingRules());
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Load users if admin
    useEffect(() => {
        if (user?.isAdmin) {
            setAllUsers(getUsers());
        }
    }, [user]);

    // Handle initial client selection
    useEffect(() => {
        if (user?.isAdmin && adminDraftUser) {
            handleSelectClient(adminDraftUser);
        } else if (!user?.isAdmin) {
            setSelectedClient(user);
        }
    }, [user, adminDraftUser]);

    const formatCep = (cep: string) => {
        const clean = cep.replace(/\D/g, '');
        if (clean.length === 8) {
            return `${clean.slice(0, 5)}-${clean.slice(5)}`;
        }
        return clean;
    };

    const handleApplyCoupon = async () => {
        if (!couponCode) return;
        setCouponError('');
        try {
            const coupon = await validateCoupon(couponCode, selectedClient?.id);
            setAppliedCoupon(coupon);
        } catch (err: any) {
            setCouponError(err.message);
            setAppliedCoupon(null);
        }
    };

    const handleEditKit = (kit: MagnetItem[]) => {
        resumeKit(kit);
        (window as any).magnetoEditKit = kit;
        const kitSize = kit.length;
        const matchingTier = tiers.find(t => t.photoCount === kitSize) || 
                             tiers.find(t => t.photoCount > kitSize) || 
                             tiers[0];

        navigate('/studio/upload', { 
            state: { 
                tier: matchingTier,
                isEditing: true,
                ts: Date.now() 
            } 
        });
    };

    const handleRemoveKit = (kit: MagnetItem[]) => {
        if (window.confirm('Deseja remover este kit completo do carrinho?')) {
            onRemoveBatch(kit.map(i => i.id));
        }
    };

    const handleConfirmClearCart = () => {
        onClear();
        setIsClearCartModalOpen(false);
    };

    // Helper centralizado para selecionar cliente e auto-definir endereço
    const handleSelectClient = (u: User) => {
        let clientToSet = { ...u };
        
        // Se o cliente não tem endereço ativo, mas tem salvos, seleciona o primeiro (ou o último usado)
        if (!clientToSet.address && clientToSet.savedAddresses && clientToSet.savedAddresses.length > 0) {
            clientToSet.address = clientToSet.savedAddresses[0];
        }

        setSelectedClient(clientToSet);
        setSearchTerm(u.name);
        setIsDropdownOpen(false);
        setIsAddressSelectorOpen(false); // Fecha o seletor se estava aberto
    };

    // Handler para Admin selecionar endereço da lista existente
    const handleAdminSelectAddress = (addr: Address) => {
        if (!selectedClient) return;
        
        // Atualiza localmente
        const updatedClient = { ...selectedClient, address: addr };
        setSelectedClient(updatedClient);
        
        // Persiste no "banco" para que fique salvo como o último selecionado
        updateUser(selectedClient.id, { address: addr }); 
        
        setIsAddressSelectorOpen(false);
    };

    // Handler para Admin buscar CEP no modal
    const handleAdminCepLookup = async (cep: string) => {
        const cleanCep = cep.replace(/\D/g, '');
        setAdminAddressForm(prev => ({ ...prev, zipCode: cleanCep }));
        
        if (cleanCep.length === 8) {
            setIsFetchingCep(true);
            try {
                const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
                const data = await response.json();
                if (!data.erro) {
                    const stateName = STATE_MAP[data.uf] || data.uf;
                    const formattedState = data.uf.length === 2 ? `${stateName} - ${data.uf}` : data.uf;

                    setAdminAddressForm(prev => ({
                        ...prev,
                        street: data.logradouro || prev.street,
                        neighborhood: data.bairro || prev.neighborhood,
                        city: data.localidade || prev.city,
                        state: formattedState
                    }));
                }
            } catch (e) { console.error("Erro CEP", e); }
            finally { setIsFetchingCep(false); }
        }
    };

    // Handler para Admin salvar novo endereço (mantendo os antigos)
    const handleAdminSaveAddress = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedClient) {
            alert("Selecione um cliente primeiro.");
            return;
        }
        if (!adminAddressForm.street || !adminAddressForm.number || !adminAddressForm.zipCode) {
            alert("Preencha os campos obrigatórios do endereço.");
            return;
        }

        const newAddress: Address = {
            ...adminAddressForm,
            id: `addr-${Date.now()}`
        };

        // Mantém a lista existente e adiciona o novo no final (ou início)
        const currentSaved = selectedClient.savedAddresses || [];
        const updatedAddresses = [...currentSaved, newAddress];
        
        // Atualiza no banco
        updateUser(selectedClient.id, { 
            savedAddresses: updatedAddresses,
            address: newAddress // Seleciona automaticamente o novo
        });

        // Atualiza estado local
        setSelectedClient({
            ...selectedClient,
            savedAddresses: updatedAddresses,
            address: newAddress
        });

        // Limpa e fecha
        setAdminAddressForm({ nickname: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '', zipCode: '' });
        setIsAdminAddressFormOpen(false);
        setIsAddressSelectorOpen(false);
    };

    const handleFinishPurchase = async () => {
        // Redireciona para /address para que o fluxo de login leve o usuário para lá
        if (!user) { navigate('/login', { state: { from: '/address' } }); return; }
        
        if (user.isAdmin && !selectedClient) {
            alert("Selecione um cliente para criar o pedido.");
            return;
        }

        // FLUXO OBRIGATÓRIO DE ENDEREÇO
        // Se não for admin e o endereço não tiver sido confirmado nesta sessão, redireciona
        if (!user.isAdmin && !isAddressConfirmed) {
            navigate('/address');
            return;
        }

        const addressToUse = selectedClient?.address;

        if (!addressToUse || !addressToUse.street || !addressToUse.zipCode) {
            alert(user.isAdmin ? "Selecione um endereço para o cliente." : "Por favor, selecione um endereço de entrega.");
            if (!user.isAdmin) navigate('/address');
            return;
        }

        if (!termsAccepted) { alert("É necessário aceitar os termos de uso."); return; }
        
        setIsFinishing(true);
        try {
            const targetUser = selectedClient || user;
            const derivedConsent = items.length > 0 ? !!items[0].socialConsent : true;

            await createOrder(targetUser, items, total, addressToUse, derivedConsent, !!user.isAdmin);
            onClear();
            if (user.isAdmin) {
                if (onClearAdminMode) onClearAdminMode();
                navigate('/admin');
            } else {
                navigate('/my-orders');
            }
        } catch (err) {
            console.error(err);
            alert("Erro ao processar pedido.");
        } finally {
            setIsFinishing(false);
        }
    };

    const unitPrice = calculateUnitPrice(items.length);
    const subtotal = items.length * unitPrice;
    const shipping = (subtotal > 150 || appliedCoupon?.discountType === 'fixed' || user?.isAdmin) ? 0 : 15.90; 
    
    let discount = 0;
    if (appliedCoupon) {
        if (appliedCoupon.discountType === 'percent') {
            discount = (subtotal * appliedCoupon.value) / 100;
        } else {
            discount = appliedCoupon.value;
        }
    }
    
    const total = Math.max(0, subtotal + shipping - discount);

    // --- LÓGICA DE AGRUPAMENTO (KITS) ---
    const kits: MagnetItem[][] = [];
    const groupedItems: Record<string, MagnetItem[]> = {};
    const unassignedItems: MagnetItem[] = [];

    items.forEach(item => {
        if (item.kitId) {
            if (!groupedItems[item.kitId]) {
                groupedItems[item.kitId] = [];
            }
            groupedItems[item.kitId].push(item);
        } else {
            unassignedItems.push(item);
        }
    });

    Object.values(groupedItems).forEach(group => {
        kits.push(group);
    });

    if (unassignedItems.length > 0) {
        for (let i = 0; i < unassignedItems.length; i += 9) {
            kits.push(unassignedItems.slice(i, i + 9));
        }
    }

    const getKitInfo = (count: number) => {
        const exact = tiers.find(t => t.photoCount === count);
        if (exact) return { name: exact.name, isRecommended: exact.isRecommended };
        if (count === 9) return { name: 'Start', isRecommended: false };
        if (count === 18) return { name: 'Memories', isRecommended: true };
        if (count === 27) return { name: 'Gallery', isRecommended: false };
        return { name: 'Personalizado', isRecommended: false };
    };

    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-[#F5F5F7] pt-32 pb-20 px-6 flex flex-col items-center justify-center text-center">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-gray-100 text-gray-300 animate-fade-in">
                    <ShoppingBag size={32} />
                </div>
                <h2 className="text-3xl font-serif text-[#1d1d1f] mb-4 animate-fade-in delay-100">Sua sacola está vazia</h2>
                <p className="text-[#86868b] mb-10 max-w-md font-light animate-fade-in delay-200">
                    Suas memórias estão esperando para ganhar vida. Que tal começar a selecionar suas fotos favoritas?
                </p>
                <Link to="/studio" className="px-12 py-5 bg-[#1d1d1f] text-white rounded-xl font-bold text-xs uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl animate-fade-in delay-300 active:scale-95">
                    Criar meu primeiro kit
                </Link>
            </div>
        );
    }

    const inputWrapperClass = "relative w-full group";
    const inputIconClass = "absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#B8860B] transition-colors pointer-events-none";
    const inputFieldClass = "w-full h-14 pl-14 pr-4 bg-[#F5F5F7] border border-transparent rounded-xl text-base text-[#1d1d1f] outline-none focus:bg-white focus:border-[#B8860B] focus:ring-1 focus:ring-[#B8860B]/20 transition-all placeholder:text-gray-400 shadow-sm";
    
    // Address Form Classes
    const modalInputClass = "w-full h-11 pl-4 pr-4 bg-[#F5F5F7] border border-transparent rounded-lg text-sm text-[#1d1d1f] outline-none focus:bg-white focus:border-[#B8860B] focus:ring-2 focus:ring-[#B8860B]/10 transition-all placeholder:text-gray-400 shadow-sm";

    // Endereço a ser exibido (do cliente selecionado no admin ou do usuário logado)
    const currentAddress = selectedClient?.address;

    return (
        <div className="min-h-screen bg-[#F5F5F7] pt-28 pb-24 px-4 md:px-6 font-sans">
            
            {/* Stepper no topo */}
            <CheckoutSteps currentStep={3} />

            <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">
                
                {/* Left Column: Items */}
                <div className="lg:col-span-8 space-y-8">
                    <div className="flex justify-between items-end border-b border-gray-200 pb-4 mb-6">
                        <div>
                            <span className="text-[#B8860B] font-bold text-[10px] uppercase tracking-[0.3em] mb-1 block">Checkout</span>
                            <h1 className="text-3xl font-serif font-bold text-[#1d1d1f]">Seu Pedido</h1>
                        </div>
                        <button 
                            onClick={() => setIsClearCartModalOpen(true)}
                            className="px-4 py-2 text-[10px] font-bold text-red-400 uppercase tracking-widest hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
                        >
                            <Trash2 size={14}/> Limpar
                        </button>
                    </div>

                    {/* Kits List */}
                    <div className="space-y-8">
                        {kits.map((kit, idx) => {
                            const kitSize = kit.length;
                            const { name: kitName, isRecommended } = getKitInfo(kitSize);
                            const tierMatch = tiers.find(t => t.photoCount === kitSize);
                            const price = tierMatch ? tierMatch.price : (kitSize * 4.90);
                            const consent = kit[0]?.socialConsent;
                            
                            return (
                                <div key={idx} className="group relative bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                                    <div className="bg-[#1d1d1f] px-6 py-4 flex justify-between items-center relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#B8860B]/10 blur-2xl rounded-full"></div>
                                        <div className="relative z-10 flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-[#B8860B] flex items-center justify-center text-white shadow-lg border border-white/10">
                                                <Layers size={18} />
                                            </div>
                                            <div>
                                                <h3 className="font-serif font-bold text-xl text-[#B8860B] tracking-wide flex items-center gap-2">
                                                    Kit {kitName}
                                                    {isRecommended && <Crown size={14} className="text-[#B8860B]" fill="currentColor" />}
                                                </h3>
                                                <p className="text-[9px] font-bold text-white/60 uppercase tracking-[0.2em]">{kitSize} Ímãs • Fine Art</p>
                                            </div>
                                        </div>
                                        <div className="relative z-10">
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 text-white rounded-full text-[9px] font-bold uppercase tracking-widest backdrop-blur-sm border border-white/10">
                                                <Sparkles size={10} className="text-[#B8860B]" /> Premium
                                            </span>
                                        </div>
                                    </div>

                                    <div className="p-6">
                                        <div className="mb-6">
                                            <div className="flex justify-between items-center mb-3">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                                    <ImageIcon size={12}/> Prévia do Kit
                                                </p>
                                                
                                                {/* Visual Singelo de Consentimento */}
                                                {consent ? (
                                                    <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100 cursor-help" title="Você permitiu o uso em conteúdos da Magneto">
                                                        <Camera size={10} /> Uso Autorizado
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-gray-400 bg-gray-50 px-2 py-1 rounded border border-gray-100 cursor-help" title="Uso restrito apenas para produção">
                                                        <Shield size={10} /> Privado
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mask-linear-fade">
                                                {kit.slice(0, 8).map((item, i) => (
                                                    <div key={i} className="w-16 h-16 shrink-0 rounded-lg overflow-hidden border border-gray-100 shadow-sm relative group/img">
                                                        <img 
                                                            src={item.croppedUrl || item.originalUrl} 
                                                            className="w-full h-full object-cover grayscale group-hover/img:grayscale-0 transition-all duration-500" 
                                                            alt={`Foto ${i}`}
                                                        />
                                                    </div>
                                                ))}
                                                {kit.length > 8 && (
                                                    <div className="w-16 h-16 shrink-0 rounded-lg bg-gray-50 border border-gray-100 flex flex-col items-center justify-center text-gray-400">
                                                        <span className="font-bold text-xs">+{kit.length - 8}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-gray-50">
                                            <div className="flex gap-3 w-full sm:w-auto">
                                                <button 
                                                    onClick={() => handleEditKit(kit)}
                                                    className="flex-1 sm:flex-none px-6 py-2.5 bg-white border border-[#1d1d1f] text-[#1d1d1f] rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-[#1d1d1f] hover:text-white transition-all shadow-sm flex items-center justify-center gap-2 group/btn"
                                                >
                                                    <Edit3 size={12} /> Editar
                                                </button>
                                                <button 
                                                    onClick={() => handleRemoveKit(kit)}
                                                    className="px-4 py-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Remover Kit"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                            
                                            <div className="text-right w-full sm:w-auto flex justify-between sm:block items-center">
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide sm:hidden">Valor do Kit</p>
                                                <p className="font-serif font-bold text-2xl text-[#B8860B]">R$ {price.toFixed(2)}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        <button 
                            onClick={() => { resumeKit([]); navigate('/studio'); }}
                            className="w-full py-8 border-2 border-dashed border-gray-300 rounded-2xl text-gray-400 font-bold text-[10px] uppercase tracking-[0.2em] flex flex-col items-center justify-center gap-3 hover:border-[#B8860B] hover:text-[#B8860B] hover:bg-white transition-all group bg-gray-50/50 hover:shadow-lg active:scale-[0.99]"
                        >
                            <div className="w-12 h-12 rounded-full bg-white group-hover:bg-[#B8860B] group-hover:text-white flex items-center justify-center transition-colors shadow-sm text-gray-300 border border-gray-200 group-hover:border-[#B8860B]">
                                <Plus size={24} />
                            </div>
                            <span>Adicionar Novo Kit</span>
                        </button>
                    </div>
                </div>

                {/* Right Column: Summary & Checkout */}
                <div className="lg:col-span-4 space-y-6">
                    
                    {/* ADMIN: Client Search */}
                    {user?.isAdmin && (
                        <div className="bg-white p-6 rounded-2xl border border-[#B8860B] mb-2 shadow-sm relative">
                            <h3 className="text-xs font-bold text-[#B8860B] uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Shield size={14}/> Cliente (Admin)
                            </h3>
                            <div className="relative group" ref={dropdownRef}>
                                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                                 <input 
                                     type="text" 
                                     placeholder="Buscar cliente..." 
                                     value={searchTerm}
                                     onChange={(e) => { setSearchTerm(e.target.value); setIsDropdownOpen(true); }}
                                     onFocus={() => setIsDropdownOpen(true)}
                                     className="w-full pl-10 pr-4 py-3 bg-[#F5F5F7] border border-transparent focus:bg-white focus:border-[#B8860B] rounded-xl text-sm outline-none transition-all"
                                 />
                                 {isDropdownOpen && searchTerm && (
                                     <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto custom-scrollbar">
                                         {allUsers.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase())).map(u => (
                                             <button key={u.id} onClick={() => handleSelectClient(u)} className="w-full text-left px-4 py-3 hover:bg-[#F5F5F7] text-sm text-[#1d1d1f] border-b border-gray-50 last:border-0">
                                                 <span className="font-bold">{u.name}</span> <span className="text-gray-400 text-xs">({u.email})</span>
                                             </button>
                                         ))}
                                     </div>
                                 )}
                            </div>
                            {selectedClient && (
                                 <div className="mt-4 p-3 bg-[#F5F5F7] rounded-lg border border-gray-100 flex items-center gap-3">
                                     <div className="w-8 h-8 bg-[#1d1d1f] text-white rounded-full flex items-center justify-center font-bold text-xs">{selectedClient.name.charAt(0)}</div>
                                     <div className="overflow-hidden">
                                         <p className="text-sm font-bold text-[#1d1d1f] truncate">{selectedClient.name}</p>
                                         <p className="text-[10px] text-gray-500 truncate">{selectedClient.email}</p>
                                     </div>
                                 </div>
                            )}
                        </div>
                    )}

                    {/* Address Section (Read-Only with Change Button) */}
                    <div id="address-section" className="bg-white rounded-2xl p-6 md:p-8 border border-gray-100 shadow-xl relative overflow-hidden">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-[10px] font-bold text-[#1d1d1f] uppercase tracking-[0.3em] flex items-center gap-2">
                                <Truck size={16} className="text-[#B8860B]"/> Entrega
                            </h3>
                            {user?.isAdmin ? (
                                <button onClick={() => setIsAddressSelectorOpen(!isAddressSelectorOpen)} className="text-[9px] font-bold text-[#B8860B] hover:text-[#966d09] uppercase tracking-widest underline decoration-dotted">
                                    {isAddressSelectorOpen ? "Fechar" : "Trocar"}
                                </button>
                            ) : (
                                <Link to="/address" className="text-[9px] font-bold text-[#B8860B] hover:text-[#966d09] uppercase tracking-widest underline decoration-dotted">
                                    {currentAddress && currentAddress.street && isAddressConfirmed ? "Alterar" : "Selecionar"}
                                </Link>
                            )}
                        </div>

                        {currentAddress && currentAddress.street && (isAddressConfirmed || user?.isAdmin) ? (
                            <div className="bg-[#F5F5F7] p-5 rounded-xl border border-gray-100 flex items-start gap-4 animate-fade-in">
                                <div className="mt-1 bg-white p-2 rounded-lg border border-gray-200 text-[#B8860B] shadow-sm"><MapPin size={20} /></div>
                                <div>
                                    {currentAddress.nickname && <span className="text-[9px] font-bold uppercase tracking-widest bg-white px-2 py-0.5 rounded border border-gray-200 text-[#1d1d1f] mb-1 inline-block">{currentAddress.nickname}</span>}
                                    <p className="font-bold text-base text-[#1d1d1f]">{currentAddress.street}, {currentAddress.number}</p>
                                    <p className="text-[#86868b] text-xs mt-1">{currentAddress.neighborhood}</p>
                                    <p className="text-[#86868b] text-xs">{currentAddress.city} - {currentAddress.state.split(' - ').pop()}</p>
                                    
                                    {currentAddress.complement && <p className="text-[#86868b] text-xs mt-1">Comp: {currentAddress.complement}</p>}
                                    <p className="text-[10px] text-[#1d1d1f] font-bold uppercase tracking-widest mt-3 inline-block bg-white px-2 py-1 rounded border border-gray-200">CEP: {formatCep(currentAddress.zipCode)}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center w-full py-8 bg-[#F5F5F7] rounded-xl border border-dashed border-gray-200">
                                <Home className="mx-auto text-gray-300 mb-2" size={24}/>
                                <p className="text-[#86868b] text-xs mb-4">
                                    {user?.isAdmin ? 'Nenhum endereço selecionado.' : 'Confirme seu endereço de entrega.'}
                                </p>
                                {!user?.isAdmin && (
                                    <Link to="/address" className="px-6 py-3 bg-white border border-gray-200 text-[#1d1d1f] rounded-xl text-[10px] font-bold uppercase tracking-widest hover:border-[#B8860B] hover:text-[#B8860B] transition-all shadow-sm active:scale-95 inline-block">
                                        Escolher Endereço
                                    </Link>
                                )}
                            </div>
                        )}

                        {/* Admin Inline Address Selector with Visual List */}
                        {user?.isAdmin && isAddressSelectorOpen && selectedClient && (
                            <div className="mt-4 pt-4 border-t border-gray-100 grid gap-2 animate-fade-in max-h-60 overflow-y-auto custom-scrollbar">
                                {selectedClient.savedAddresses?.map(addr => {
                                     const isActive = currentAddress?.id === addr.id;
                                     return (
                                         <button 
                                            key={addr.id} 
                                            onClick={() => handleAdminSelectAddress(addr)} 
                                            className={`text-left p-3 rounded-lg border transition-all text-xs group flex justify-between items-center ${isActive ? 'bg-[#FFF9E6] border-[#B8860B]' : 'bg-gray-50 border-transparent hover:border-gray-200 hover:bg-white'}`}
                                         >
                                             <div>
                                                 <span className={`font-bold block ${isActive ? 'text-[#B8860B]' : 'text-[#1d1d1f]'}`}>{addr.nickname || 'Endereço'}</span>
                                                 <span className="text-gray-500">{addr.street}, {addr.number}</span>
                                                 <span className="block text-[10px] text-gray-400 mt-0.5">{addr.city}/{addr.state}</span>
                                             </div>
                                             {isActive && <CheckCircle size={16} className="text-[#B8860B]" />}
                                         </button>
                                     );
                                })}
                                <button 
                                    onClick={() => {
                                        setAdminAddressForm({ nickname: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '', zipCode: '' });
                                        setIsAdminAddressFormOpen(true);
                                    }}
                                    className="text-center p-3 rounded-lg border-2 border-dashed border-gray-200 hover:border-[#B8860B] hover:text-[#B8860B] text-gray-400 transition-all text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 bg-white sticky bottom-0"
                                >
                                    <Plus size={14} /> Novo Endereço
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Summary Section */}
                    <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-xl sticky top-24">
                        <h3 className="text-xl font-serif font-bold text-[#1d1d1f] mb-8 flex items-center gap-2">
                            <Wallet size={24} className="text-[#B8860B]" /> Resumo
                        </h3>
                        
                        {!user?.isAdmin && (
                            <div className="mb-8">
                                <label className="text-[9px] font-bold text-[#86868b] uppercase tracking-widest mb-2 block">Cupom Promocional</label>
                                <div className="flex gap-2">
                                    <div className={inputWrapperClass}>
                                        <Ticket className={inputIconClass} size={18} />
                                        <input 
                                            type="text" 
                                            value={couponCode}
                                            onChange={e => setCouponCode(e.target.value.toUpperCase())}
                                            placeholder="CÓDIGO"
                                            disabled={!!appliedCoupon}
                                            className={`${inputFieldClass} font-bold uppercase tracking-wider`}
                                        />
                                    </div>
                                    {appliedCoupon ? (
                                        <button onClick={() => { setAppliedCoupon(null); setCouponCode(''); }} className="h-14 w-14 shrink-0 flex items-center justify-center bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors border border-red-100"><X size={20}/></button>
                                    ) : (
                                        <button onClick={handleApplyCoupon} className="h-14 px-6 shrink-0 bg-[#1d1d1f] text-white rounded-xl text-[9px] font-bold uppercase tracking-widest hover:bg-black transition-colors active:scale-95">Aplicar</button>
                                    )}
                                </div>
                                {couponError && <p className="text-red-500 text-[9px] font-bold uppercase tracking-wide mt-2 pl-1 animate-pulse">{couponError}</p>}
                                {appliedCoupon && <p className="text-emerald-600 text-[9px] font-bold uppercase tracking-wide mt-2 pl-1 flex items-center gap-1 animate-fade-in"><CheckCircle size={10}/> Cupom aplicado com sucesso!</p>}
                            </div>
                        )}

                        <div className="space-y-4 mb-8 bg-gray-50 p-6 rounded-xl border border-gray-100">
                            <div className="flex justify-between text-xs text-[#86868b] font-medium">
                                <span>Subtotal ({items.length} itens)</span>
                                <span className="font-bold text-[#1d1d1f]">R$ {subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-xs text-[#86868b] font-medium">
                                <span>Envio e Manuseio</span>
                                <span className="font-bold text-[#1d1d1f]">{shipping === 0 ? 'Cortesia' : `R$ ${shipping.toFixed(2)}`}</span>
                            </div>
                            {appliedCoupon && (
                                <div className="flex justify-between text-xs text-emerald-600 font-bold uppercase tracking-widest">
                                    <span>Desconto</span>
                                    <span>- R$ {discount.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="h-px bg-gray-200 my-2"></div>
                            <div className="flex justify-between items-end">
                                <span className="text-sm font-bold text-[#1d1d1f] uppercase tracking-widest">Total</span>
                                <span className="text-4xl font-serif font-bold text-[#B8860B]">R$ {total.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Terms */}
                        <label className="flex items-start gap-3 cursor-pointer mb-8 group select-none bg-white p-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                            <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors shrink-0 ${termsAccepted ? 'bg-[#1d1d1f] border-[#1d1d1f]' : 'border-gray-300 bg-white'}`}>
                                {termsAccepted && <CheckCircle size={12} className="text-white" />}
                            </div>
                            <input type="checkbox" checked={termsAccepted} onChange={e => setTermsAccepted(e.target.checked)} className="hidden" />
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed group-hover:text-[#1d1d1f] transition-colors">
                                Li e concordo com a <button type="button" onClick={(e) => {e.stopPropagation(); setShowPolicyModal(true);}} className="underline hover:text-[#B8860B]">política de produção</button>.
                            </span>
                        </label>

                        {/* Checkout CTA */}
                        <button 
                            onClick={handleFinishPurchase}
                            disabled={isFinishing || !termsAccepted || items.length === 0}
                            className={`w-full py-5 rounded-xl font-bold text-xs uppercase tracking-[0.2em] shadow-xl flex items-center justify-center gap-3 transition-all transform hover:-translate-y-1 active:translate-y-0 active:shadow-sm ${termsAccepted ? 'bg-[#1d1d1f] text-white hover:bg-black hover:shadow-2xl' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                        >
                            {isFinishing ? <Loader2 className="animate-spin" size={20} /> : (
                                // Muda o texto e ícone baseado se o endereço já foi confirmado
                                !isAddressConfirmed && !user?.isAdmin ? (
                                    <><Truck size={16}/> Continuar para Endereço</>
                                ) : (
                                    user?.isAdmin ? <><Shield size={18}/> Gerar Pedido (Admin)</> : <><Lock size={16}/> Finalizar Compra Segura</>
                                )
                            )}
                        </button>
                        
                        {!user?.isAdmin && (
                            <div className="mt-6 flex flex-col items-center gap-3">
                                <div className="flex justify-center gap-4 opacity-30 grayscale hover:opacity-50 transition-opacity">
                                    <img src="https://cdn-icons-png.flaticon.com/512/196/196561.png" className="h-5" alt="Visa" />
                                    <img src="https://cdn-icons-png.flaticon.com/512/196/196565.png" className="h-5" alt="Mastercard" />
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Logo_Pix.png/1200px-Logo_Pix.png" className="h-5" alt="Pix" />
                                </div>
                                <p className="text-[9px] text-gray-400 uppercase tracking-widest font-bold flex items-center gap-1.5 bg-gray-50 px-3 py-1 rounded-full"><Lock size={10}/> Ambiente Criptografado</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Admin Address Modal */}
            {isAdminAddressFormOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#011F4B]/40 backdrop-blur-sm" onClick={() => setIsAdminAddressFormOpen(false)}></div>
                    <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl relative overflow-hidden flex flex-col animate-fade-in border border-gray-100 p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="font-serif font-bold text-xl text-[#1d1d1f]">Novo Endereço</h3>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Cadastro Rápido (Admin)</p>
                            </div>
                            <button onClick={() => setIsAdminAddressFormOpen(false)} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} className="text-gray-400 hover:text-red-500"/></button>
                        </div>
                        
                        <form onSubmit={handleAdminSaveAddress} className="space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-[#86868b] uppercase tracking-widest mb-1.5 block">Apelido (Opcional)</label>
                                <input 
                                    value={adminAddressForm.nickname}
                                    onChange={e => setAdminAddressForm({...adminAddressForm, nickname: e.target.value})}
                                    placeholder="Ex: Trabalho" 
                                    className={modalInputClass}
                                />
                            </div>

                            <div className="relative">
                                <label className="text-[10px] font-bold text-[#86868b] uppercase tracking-widest mb-1.5 block">CEP</label>
                                <div className="relative">
                                    <input 
                                        value={adminAddressForm.zipCode} 
                                        onChange={e => handleAdminCepLookup(e.target.value)} 
                                        placeholder="00000-000" 
                                        className={modalInputClass}
                                        maxLength={9}
                                        required
                                    />
                                    {isFetchingCep && <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-[#B8860B]"/>}
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-2">
                                    <label className="text-[10px] font-bold text-[#86868b] uppercase tracking-widest mb-1.5 block">Rua</label>
                                    <input value={adminAddressForm.street} onChange={e => setAdminAddressForm({...adminAddressForm, street: e.target.value})} className={modalInputClass} required />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-[#86868b] uppercase tracking-widest mb-1.5 block">Número</label>
                                    <input value={adminAddressForm.number} onChange={e => setAdminAddressForm({...adminAddressForm, number: e.target.value})} className={modalInputClass} required />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-[#86868b] uppercase tracking-widest mb-1.5 block">Bairro</label>
                                    <input value={adminAddressForm.neighborhood} onChange={e => setAdminAddressForm({...adminAddressForm, neighborhood: e.target.value})} className={modalInputClass} required />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-[#86868b] uppercase tracking-widest mb-1.5 block">Complemento</label>
                                    <input value={adminAddressForm.complement} onChange={e => setAdminAddressForm({...adminAddressForm, complement: e.target.value})} className={modalInputClass} />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-2">
                                    <label className="text-[10px] font-bold text-[#86868b] uppercase tracking-widest mb-1.5 block">Cidade</label>
                                    <input value={adminAddressForm.city} onChange={e => setAdminAddressForm({...adminAddressForm, city: e.target.value})} className={modalInputClass} required />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-[#86868b] uppercase tracking-widest mb-1.5 block">Estado</label>
                                    <input value={adminAddressForm.state} onChange={e => setAdminAddressForm({...adminAddressForm, state: e.target.value})} className={modalInputClass} required />
                                </div>
                            </div>

                            <button 
                                type="submit"
                                className="w-full h-12 mt-4 bg-[#1d1d1f] text-white text-xs font-bold uppercase tracking-[0.2em] rounded-xl hover:bg-black transition-all shadow-lg flex items-center justify-center gap-2"
                            >
                                <Save size={16}/> Salvar Endereço
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Clear Cart Confirmation Modal */}
            {isClearCartModalOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#1d1d1f]/60 backdrop-blur-md" onClick={() => setIsClearCartModalOpen(false)}></div>
                    <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl relative overflow-hidden flex flex-col animate-fade-in border border-gray-100 p-8 text-center z-10">
                        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Trash2 size={32} />
                        </div>
                        <h3 className="font-serif font-bold text-2xl text-[#1d1d1f] mb-2">Esvaziar Sacola?</h3>
                        <p className="text-sm text-gray-500 mb-8 leading-relaxed">
                            Tem certeza? Isso removerá <strong>todos os kits</strong> e itens selecionados. Esta ação não pode ser desfeita.
                        </p>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setIsClearCartModalOpen(false)}
                                className="flex-1 py-4 bg-gray-100 text-[#1d1d1f] font-bold text-[10px] uppercase tracking-widest rounded-xl hover:bg-gray-200 transition-all"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleConfirmClearCart}
                                className="flex-1 py-4 bg-red-500 text-white font-bold text-[10px] uppercase tracking-widest rounded-xl hover:bg-red-600 transition-all shadow-lg shadow-red-200"
                            >
                                Sim, Esvaziar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Policy Modal */}
            {showPolicyModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#011F4B]/40 backdrop-blur-sm" onClick={() => setShowPolicyModal(false)}></div>
                    <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl relative overflow-hidden flex flex-col animate-fade-in border border-gray-100 max-h-[80vh]">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                            <h3 className="font-serif font-bold text-xl text-[#1d1d1f]">Termos de Produção</h3>
                            <button onClick={() => setShowPolicyModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={20}/></button>
                        </div>
                        <div className="p-8 overflow-y-auto text-sm text-[#86868b] leading-relaxed space-y-4 font-light text-justify">
                            <p>
                                Por se tratar de um produto <strong>personalizado e feito sob encomenda</strong> exclusivamente para você, com suas imagens pessoais, <strong className="text-[#1d1d1f] font-bold">não aceitamos devoluções por arrependimento</strong>, conforme exceção prevista no Código de Defesa do Consumidor para itens personalizados que não podem ser revendidos.
                            </p>
                            <p>
                                Garantimos a troca ou reembolso apenas nos seguintes casos:
                            </p>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Defeito comprovado de fabricação ou impressão.</li>
                                <li>Danos causados durante o transporte (necessário envio de fotos da embalagem no ato).</li>
                                <li>Erro operacional no pedido (tamanho ou quantidade incorreta).</li>
                            </ul>
                            <p className="bg-amber-50 p-4 rounded-xl text-amber-800 text-xs border border-amber-100">
                                <strong>Nota sobre cores:</strong> Ao finalizar este pedido, você declara estar ciente de que as cores da impressão (CMYK) podem sofrer pequenas variações de tonalidade em relação ao que é visto na tela do seu dispositivo (RGB).
                            </p>
                        </div>
                        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end">
                            <button onClick={() => { setTermsAccepted(true); setShowPolicyModal(false); }} className="px-8 py-3 bg-[#1d1d1f] text-white font-bold text-[10px] uppercase tracking-widest rounded-xl hover:bg-black transition-all shadow-lg active:scale-95">Li e concordo</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Cart;
