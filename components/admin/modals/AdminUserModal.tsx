
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, User as UserIcon, MapPin, Plus, Edit3, Trash2, CheckCircle, Search, Tag, Building, Hash, Map, Navigation, Check, AlertCircle, Shield, Ban, FileText, AlertTriangle, Lock } from 'lucide-react';
import { User, Address } from '../../../types';
import { addUser, updateUser, deleteUser, getAdminOrders } from '../../../services/mockService';

interface AdminUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    editingUser: User | null;
    refreshData: () => void;
}

const STATE_MAP: Record<string, string> = {
    'AC': 'Acre', 'AL': 'Alagoas', 'AP': 'Amapá', 'AM': 'Amazonas', 'BA': 'Bahia', 'CE': 'Ceará',
    'DF': 'Distrito Federal', 'ES': 'Espírito Santo', 'GO': 'Goiás', 'MA': 'Maranhão', 'MT': 'Mato Grosso',
    'MS': 'Mato Grosso do Sul', 'MG': 'Minas Gerais', 'PA': 'Paraíba', 'PR': 'Paraná',
    'PE': 'Pernambuco', 'PI': 'Piauí', 'RJ': 'Rio de Janeiro', 'RN': 'Rio Grande do Norte',
    'RS': 'Rio Grande do Sul', 'RO': 'Rondônia', 'RR': 'Roraima', 'SC': 'Santa Catarina',
    'SP': 'São Paulo', 'SE': 'Sergipe', 'TO': 'Tocantins'
};

const AdminUserModal: React.FC<AdminUserModalProps> = ({ isOpen, onClose, editingUser, refreshData }) => {
    const [activeTab, setActiveTab] = useState<'profile' | 'addresses'>('profile');
    
    // UI States
    const [isDirty, setIsDirty] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [emailError, setEmailError] = useState('');
    const [phoneError, setPhoneError] = useState('');
    
    // Modals State
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [showDuplicateAddressModal, setShowDuplicateAddressModal] = useState(false);
    
    // Block Delete Logic
    const [deleteBlockType, setDeleteBlockType] = useState<'admin' | 'history' | null>(null);

    // Profile State
    const [profileData, setProfileData] = useState({ 
        name: '', email: '', isAdmin: false, isActive: true, phone: '', password: ''
    });

    // Identifica se é o usuário raiz (Hardcoded ID ou Email do sistema)
    const isRootAdmin = editingUser?.id === 'admin-001';

    // Address Management State
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<string | undefined>(undefined);
    
    // Address Form State (Internal)
    const [isAddressFormOpen, setIsAddressFormOpen] = useState(false);
    const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
    const [isFetchingCep, setIsFetchingCep] = useState(false);
    const [addressFormData, setAddressFormData] = useState<Address>({
        nickname: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '', zipCode: ''
    });
    // Novo estado para erros de endereço
    const [addressErrors, setAddressErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (isOpen) {
            setActiveTab('profile');
            setIsAddressFormOpen(false);
            setEditingAddressId(null);
            setIsDirty(false); // Reset dirty state on open
            setShowDeleteConfirmation(false);
            setShowDuplicateAddressModal(false);
            setDeleteBlockType(null); // Reset delete error modal
            setEmailError('');
            setPhoneError('');
            setAddressErrors({}); // Limpa erros de endereço

            if (editingUser) {
                // Carrega dados do perfil
                setProfileData({ 
                    name: editingUser.name, 
                    email: editingUser.email, 
                    isAdmin: !!editingUser.isAdmin, 
                    isActive: editingUser.isActive ?? true, 
                    phone: editingUser.phone || '', 
                    password: ''
                });

                // Carrega endereços
                let userAddresses = editingUser.savedAddresses || [];
                // Se tiver um endereço ativo mas ele não estiver na lista de salvos (legado), adiciona
                if (editingUser.address && !userAddresses.find(a => a.id === editingUser.address?.id)) {
                    // Garante que tenha ID
                    const activeWithId = { ...editingUser.address, id: editingUser.address.id || `addr-${Date.now()}` };
                    userAddresses = [activeWithId, ...userAddresses];
                }
                setAddresses(userAddresses);
                setSelectedAddressId(editingUser.address?.id || (userAddresses.length > 0 ? userAddresses[0].id : undefined));

            } else {
                // Novo Usuário
                setProfileData({ name: '', email: '', isAdmin: false, isActive: true, phone: '', password: '' });
                setAddresses([]);
                setSelectedAddressId(undefined);
            }
        }
    }, [isOpen, editingUser]);

    // Helper para marcar como sujo ao editar perfil
    const updateProfile = (key: string, value: any) => {
        setProfileData(prev => ({ ...prev, [key]: value }));
        setIsDirty(true);
    };

    // --- MASK & VALIDATION HANDLERS ---

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const formatted = value
            .replace(/\D/g, '') // Remove não dígitos
            .replace(/^(\d{2})(\d)/g, '($1) $2') // Coloca parênteses
            .replace(/(\d)(\d{4})$/, '$1-$2') // Coloca hífen
            .slice(0, 15); // Limita tamanho
        
        updateProfile('phone', formatted);

        // Validação
        const cleanPhone = formatted.replace(/\D/g, '');
        let errorMsg = '';
        if (cleanPhone.length > 0) {
            if (cleanPhone.length < 10 || (cleanPhone.length === 10 && cleanPhone[2] === '9')) {
                errorMsg = 'Telefone incompleto';
            }
        }
        setPhoneError(errorMsg);
    };

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        updateProfile('email', val);
        
        // Validação simples de e-mail (regex padrão)
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (val && !emailRegex.test(val)) {
            setEmailError('Formato de e-mail inválido');
        } else {
            setEmailError('');
        }
    };

    // --- LOGIC: ADDRESS FORM ---

    const clearAddressError = (field: string) => {
        if (addressErrors[field]) {
            setAddressErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const handleAddressChange = (field: keyof Address, value: string) => {
        setAddressFormData(prev => ({ ...prev, [field]: value }));
        setIsDirty(true);
        clearAddressError(field);
    };

    const handleCepLookup = async (cep: string) => {
        const cleanCep = cep.replace(/\D/g, '');
        setAddressFormData(prev => ({ ...prev, zipCode: cleanCep }));
        clearAddressError('zipCode');
  
        if (cleanCep.length === 8) {
            setIsFetchingCep(true);
            try {
                const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
                const data = await response.json();
                if (!data.erro) {
                    const stateName = STATE_MAP[data.uf] || data.uf;
                    const formattedState = data.uf.length === 2 ? `${stateName} - ${data.uf}` : data.uf;

                    setAddressFormData(prev => ({
                        ...prev,
                        street: data.logradouro || prev.street,
                        neighborhood: data.bairro || prev.neighborhood,
                        city: data.localidade || prev.city,
                        state: formattedState
                    }));
                    
                    // Limpa erros dos campos preenchidos automaticamente
                    setAddressErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.street;
                        delete newErrors.neighborhood;
                        delete newErrors.city;
                        delete newErrors.state;
                        return newErrors;
                    });
                }
            } catch (e) { console.error("Erro CEP", e); }
            finally { setIsFetchingCep(false); }
        }
    };

    const handleEditAddressClick = (addr: Address) => {
        setAddressFormData(addr);
        setEditingAddressId(addr.id || null);
        setIsAddressFormOpen(true);
        setAddressErrors({}); // Limpa erros ao abrir edição
    };

    const handleDeleteAddressClick = (id: string) => {
        if (window.confirm("Remover este endereço?")) {
            const newList = addresses.filter(a => a.id !== id);
            setAddresses(newList);
            if (selectedAddressId === id) {
                setSelectedAddressId(newList.length > 0 ? newList[0].id : undefined);
            }
            setIsDirty(true);
        }
    };

    // --- LOGIC: GLOBAL SAVE ---

    const handleGlobalSave = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (emailError) {
            alert("Por favor, corrija o e-mail antes de salvar.");
            return;
        }
        if (phoneError) {
            alert("Por favor, corrija o telefone antes de salvar.");
            return;
        }

        let finalAddresses = [...addresses];
        let finalSelectedId = selectedAddressId;

        // Se o formulário de endereço estiver aberto, valida e inclui o endereço atual
        if (activeTab === 'addresses' && isAddressFormOpen) {
            // Validação visual inline
            const newErrors: Record<string, string> = {};
            
            if (!addressFormData.zipCode || addressFormData.zipCode.trim() === '') newErrors.zipCode = 'CEP OBRIGATÓRIO';
            if (!addressFormData.street || addressFormData.street.trim() === '') newErrors.street = 'LOGRADOURO OBRIGATÓRIO';
            if (!addressFormData.number || addressFormData.number.trim() === '') newErrors.number = 'NÚMERO OBRIGATÓRIO';
            if (!addressFormData.neighborhood || addressFormData.neighborhood.trim() === '') newErrors.neighborhood = 'BAIRRO OBRIGATÓRIO';
            if (!addressFormData.city || addressFormData.city.trim() === '') newErrors.city = 'CIDADE OBRIGATÓRIA';
            if (!addressFormData.state || addressFormData.state.trim() === '') newErrors.state = 'ESTADO OBRIGATÓRIO';

            if (Object.keys(newErrors).length > 0) {
                setAddressErrors(newErrors);
                return;
            }

            // --- VERIFICAÇÃO DE DUPLICIDADE ---
            const isDuplicate = finalAddresses.some(addr => {
                // Ignora o endereço que está sendo editado (comparação com ele mesmo)
                if (editingAddressId && addr.id === editingAddressId) return false;

                // Normalização para comparação
                const cleanZip = (z: string) => z.replace(/\D/g, '');
                const cleanStr = (s?: string) => (s || '').trim().toLowerCase();

                // Critério Rigoroso: CEP + Número + Complemento iguais
                // Se o logradouro muda, o CEP geralmente muda. Se for CEP único de cidade pequena, o logradouro + número diferenciam.
                // Mas a forma mais segura de duplicidade "exata" é CEP + Número + Complemento.
                return (
                    cleanZip(addr.zipCode) === cleanZip(addressFormData.zipCode) &&
                    cleanStr(addr.number) === cleanStr(addressFormData.number) &&
                    cleanStr(addr.complement) === cleanStr(addressFormData.complement)
                );
            });

            if (isDuplicate) {
                setShowDuplicateAddressModal(true);
                return;
            }
            // ----------------------------------

            let newId = editingAddressId;
            const addrPayload = { ...addressFormData };

            if (editingAddressId) {
                // Editando existente
                addrPayload.id = editingAddressId;
                finalAddresses = finalAddresses.map(addr => 
                    addr.id === editingAddressId ? addrPayload : addr
                );
            } else {
                // Criando novo
                newId = `addr-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
                addrPayload.id = newId;
                finalAddresses.push(addrPayload);
            }

            // Se for o primeiro endereço ou se não tinha nenhum selecionado, seleciona este
            if (!finalSelectedId || finalAddresses.length === 1) {
                finalSelectedId = newId || undefined;
            }
            
            // Atualiza estados locais para refletir a mudança do form
            setAddresses(finalAddresses);
            setSelectedAddressId(finalSelectedId);
            setIsAddressFormOpen(false);
        }

        setIsSaving(true);

        // Simulate network delay for UX
        await new Promise(resolve => setTimeout(resolve, 600));

        // Determina o endereço principal
        const mainAddress = finalAddresses.find(a => a.id === finalSelectedId) || (finalAddresses.length > 0 ? finalAddresses[0] : undefined);

        const payload: any = { 
            name: profileData.name, 
            email: profileData.email, 
            isAdmin: profileData.isAdmin, 
            isActive: profileData.isActive, 
            phone: profileData.phone,
            savedAddresses: finalAddresses,
            address: mainAddress
        };

        if (profileData.password) payload.password = profileData.password;
        
        if (editingUser) {
            updateUser(editingUser.id, payload);
        } else {
            addUser(payload);
        }
        
        refreshData();
        setIsSaving(false);
        setIsDirty(false); // Reset dirty flag
        // Não fecha o modal
    };

    const handleDeleteUser = () => {
        if (!editingUser) return;
        
        // --- 1. BLOQUEIO ADMIN RAIZ ---
        if (isRootAdmin) {
            setDeleteBlockType('admin');
            return;
        }

        // --- 2. BLOQUEIO HISTÓRICO DE PEDIDOS ---
        const allOrders = getAdminOrders();
        const userHasOrders = allOrders.some(order => order.userId === editingUser.id);

        if (userHasOrders) {
            setDeleteBlockType('history');
            return;
        }

        setShowDeleteConfirmation(true);
    };

    const confirmDelete = async () => {
        if (!editingUser) return;
        setIsSaving(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 800)); // Simula delay
            deleteUser(editingUser.id);
            refreshData();
            onClose(); // Fecha o modal principal
        } catch (error) {
            console.error("Erro ao excluir usuário", error);
            alert("Ocorreu um erro ao tentar excluir o usuário.");
        } finally {
            setIsSaving(false);
            setShowDeleteConfirmation(false);
        }
    };

    const toggleField = (field: 'isAdmin' | 'isActive') => {
        // Bloqueia remoção de privilégio ou inativação do Admin Root
        if ((field === 'isAdmin' || field === 'isActive') && isRootAdmin) return;

        setProfileData(prev => ({ ...prev, [field]: !prev[field] }));
        setIsDirty(true);
    };

    const handleSelectAddress = (id: string) => {
        if (selectedAddressId !== id) {
            setSelectedAddressId(id);
            setIsDirty(true);
        }
    };

    if (!isOpen) return null;

    const inputClasses = "w-full h-12 px-4 bg-[#F5F5F7] rounded-xl text-sm text-[#1d1d1f] outline-none focus:bg-white focus:ring-2 focus:ring-[#B8860B]/10 border border-transparent transition-all placeholder:text-gray-400";
    const labelClasses = "text-[10px] font-bold text-[#86868b] uppercase tracking-[0.15em] ml-1 mb-1.5 block";
    const errorTextClasses = "text-red-500 text-[10px] mt-1 flex items-center gap-1 font-bold uppercase tracking-wide";

    // Helper para renderizar mensagem de erro
    const ErrorMsg = ({ msg }: { msg: string }) => (
        <p className={errorTextClasses}><AlertCircle size={10}/> {msg}</p>
    );

    return (
        <>
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6">
                <div className="absolute inset-0 bg-[#1d1d1f]/40 backdrop-blur-md" onClick={onClose}></div>
                
                {/* Modal Container */}
                <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh] animate-fade-in border border-gray-100">
                    
                    {/* Header */}
                    <div className="px-8 pt-8 pb-6 flex justify-between items-start bg-white z-10 border-b border-gray-50 shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="bg-[#1d1d1f] p-3 rounded-xl text-white shadow-lg">
                                <UserIcon size={24} />
                            </div>
                            <div>
                                <h3 className="font-serif font-bold text-2xl text-[#1d1d1f] tracking-tight">{editingUser ? 'Gerenciar Cliente' : 'Novo Cliente'}</h3>
                                <p className="text-[10px] font-bold text-[#86868b] uppercase tracking-[0.2em] mt-1">
                                    {editingUser ? editingUser.name : 'Cadastro Inicial'}
                                </p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors -mr-2">
                            <X size={24} className="text-[#1d1d1f]" />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-gray-100 px-8 shrink-0 bg-white">
                        <button 
                            onClick={() => setActiveTab('profile')}
                            className={`py-4 text-xs font-bold uppercase tracking-widest mr-8 transition-all border-b-2 ${activeTab === 'profile' ? 'border-[#B8860B] text-[#B8860B]' : 'border-transparent text-gray-400 hover:text-[#1d1d1f]'}`}
                        >
                            Dados Pessoais
                        </button>
                        <button 
                            onClick={() => setActiveTab('addresses')}
                            className={`py-4 text-xs font-bold uppercase tracking-widest transition-all border-b-2 ${activeTab === 'addresses' ? 'border-[#B8860B] text-[#B8860B]' : 'border-transparent text-gray-400 hover:text-[#1d1d1f]'}`}
                        >
                            Endereços ({addresses.length})
                        </button>
                    </div>

                    {/* Body com Scroll */}
                    <div className="px-6 md:px-8 py-6 overflow-y-auto custom-scrollbar flex-1 bg-[#F9F9FA]">
                        
                        {/* TAB: DADOS PESSOAIS */}
                        {activeTab === 'profile' && (
                            <div className="space-y-6">
                                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="md:col-span-2">
                                            <label className={labelClasses}>Nome Completo</label>
                                            <input required value={profileData.name} onChange={e => updateProfile('name', e.target.value)} className={inputClasses} placeholder="Nome do Cliente" />
                                        </div>

                                        <div>
                                            <label className={labelClasses}>E-mail</label>
                                            <input 
                                                type="email" 
                                                required 
                                                value={profileData.email} 
                                                onChange={handleEmailChange} 
                                                className={`${inputClasses} ${emailError ? 'border-red-300 focus:ring-red-200 text-red-600' : ''}`} 
                                                placeholder="cliente@email.com" 
                                            />
                                            {emailError && <ErrorMsg msg={emailError} />}
                                        </div>

                                        <div>
                                            <label className={labelClasses}>Telefone</label>
                                            <input 
                                                type="tel" 
                                                value={profileData.phone} 
                                                onChange={handlePhoneChange} 
                                                maxLength={15}
                                                className={`${inputClasses} ${phoneError ? 'border-red-300 focus:ring-red-200 text-red-600' : ''}`}
                                                placeholder="(00) 00000-0000" 
                                            />
                                            {phoneError && <ErrorMsg msg={phoneError} />}
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className={labelClasses}>Senha (Opcional)</label>
                                            <input type="password" value={profileData.password} onChange={e => updateProfile('password', e.target.value)} placeholder="Preencha para alterar" className={inputClasses} />
                                        </div>
                                    </div>

                                    {/* Modern Toggles */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-50">
                                        
                                        {/* Status Switch */}
                                        <div 
                                            onClick={() => toggleField('isActive')}
                                            className={`
                                                p-4 rounded-xl border transition-all flex items-center justify-between group
                                                ${isRootAdmin ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}
                                                ${profileData.isActive ? 'bg-white border-emerald-200 shadow-sm' : 'bg-gray-50 border-gray-200'}
                                            `}
                                            title={isRootAdmin ? "O status do usuário raiz não pode ser alterado" : ""}
                                        >
                                            <div>
                                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Status da Conta</p>
                                                <p className={`text-xs font-bold flex items-center gap-1.5 ${profileData.isActive ? 'text-emerald-600' : 'text-gray-400'}`}>
                                                    {profileData.isActive ? <><CheckCircle size={14}/> Ativo</> : <><Ban size={14}/> Inativo</>}
                                                </p>
                                            </div>
                                            
                                            {isRootAdmin ? (
                                                <Lock size={16} className="text-emerald-500/50" />
                                            ) : (
                                                <div className={`w-10 h-6 rounded-full p-1 transition-colors duration-300 ${profileData.isActive ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                                                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-300 ${profileData.isActive ? 'translate-x-4' : 'translate-x-0'}`} />
                                                </div>
                                            )}
                                        </div>

                                        {/* Admin Switch */}
                                        <div 
                                            onClick={() => toggleField('isAdmin')}
                                            className={`
                                                p-4 rounded-xl border transition-all flex items-center justify-between group
                                                ${isRootAdmin ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}
                                                ${profileData.isAdmin ? 'bg-[#1d1d1f] border-[#1d1d1f] shadow-lg' : 'bg-white border-gray-200'}
                                            `}
                                            title={isRootAdmin ? "Privilégio fixo para o usuário raiz" : ""}
                                        >
                                            <div>
                                                <p className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${profileData.isAdmin ? 'text-gray-400' : 'text-gray-400'}`}>Privilégio</p>
                                                <p className={`text-xs font-bold flex items-center gap-1.5 ${profileData.isAdmin ? 'text-white' : 'text-[#1d1d1f]'}`}>
                                                    {profileData.isAdmin ? <><Shield size={14}/> {isRootAdmin ? 'Admin (Raiz)' : 'Administrador'}</> : 'Cliente'}
                                                </p>
                                            </div>
                                            
                                            {isRootAdmin ? (
                                                <Lock size={16} className="text-white/50" />
                                            ) : (
                                                <div className={`w-10 h-6 rounded-full p-1 transition-colors duration-300 ${profileData.isAdmin ? 'bg-[#B8860B]' : 'bg-gray-200'}`}>
                                                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-300 ${profileData.isAdmin ? 'translate-x-4' : 'translate-x-0'}`} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Danger Zone: Delete User */}
                                {editingUser && !isRootAdmin && (
                                    <div className="pt-2">
                                        <button 
                                            type="button"
                                            onClick={handleDeleteUser}
                                            className="w-full flex items-center justify-center gap-2 text-red-400 text-[10px] font-bold uppercase tracking-widest hover:text-red-600 hover:bg-red-50 p-4 rounded-xl transition-all border border-transparent hover:border-red-100"
                                        >
                                            <Trash2 size={14} /> Excluir Cliente Permanentemente
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TAB: ENDEREÇOS */}
                        {activeTab === 'addresses' && (
                            <div className="space-y-4">
                                {!isAddressFormOpen ? (
                                    <>
                                        {addresses.length > 0 ? (
                                            addresses.map((addr, idx) => {
                                                const isMain = addr.id === selectedAddressId;
                                                return (
                                                    <div key={addr.id || idx} onClick={() => addr.id && handleSelectAddress(addr.id)} className={`p-5 rounded-xl border transition-all bg-white cursor-pointer relative group ${isMain ? 'border-[#B8860B] ring-1 ring-[#B8860B]/20 shadow-md' : 'border-gray-200 hover:border-gray-300'}`}>
                                                        <div className="flex justify-between items-start">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`p-2 rounded-full ${isMain ? 'bg-[#1d1d1f] text-[#B8860B]' : 'bg-[#F5F5F7] text-gray-400'}`}>
                                                                    <MapPin size={18} />
                                                                </div>
                                                                <div>
                                                                    <div className="flex items-center gap-2">
                                                                        {addr.nickname && <span className="text-[9px] bg-[#F5F5F7] px-2 py-0.5 rounded font-bold uppercase tracking-widest text-[#1d1d1f]">{addr.nickname}</span>}
                                                                        {isMain && <span className="text-[9px] text-[#B8860B] font-bold uppercase tracking-widest flex items-center gap-1"><CheckCircle size={10}/> Principal</span>}
                                                                    </div>
                                                                    <p className="text-sm font-bold text-[#1d1d1f] mt-1">{addr.street}, {addr.number}</p>
                                                                    <p className="text-xs text-gray-500">{addr.neighborhood} - {addr.city}/{addr.state.split(' - ').pop()}</p>
                                                                    <p className="text-[10px] text-gray-400 mt-0.5">CEP: {addr.zipCode}</p>
                                                                    {addr.complement && (
                                                                        <p className="text-[10px] text-[#1d1d1f] mt-1.5 font-medium bg-[#F9F9FA] px-2 py-1 rounded inline-block border border-gray-100">
                                                                            <span className="text-gray-400 uppercase text-[9px] tracking-wide mr-1">Comp:</span>{addr.complement}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button onClick={(e) => { e.stopPropagation(); handleEditAddressClick(addr); }} className="p-2 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-[#1d1d1f]"><Edit3 size={14}/></button>
                                                                <button onClick={(e) => { e.stopPropagation(); if(addr.id) handleDeleteAddressClick(addr.id); }} className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500"><Trash2 size={14}/></button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="text-center py-10 text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">
                                                <MapPin size={32} className="mx-auto mb-2 opacity-30"/>
                                                <p className="text-xs font-bold uppercase tracking-widest">Sem endereços cadastrados</p>
                                            </div>
                                        )}
                                        <button 
                                            onClick={() => {
                                                setAddressFormData({ nickname: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '', zipCode: '' });
                                                setEditingAddressId(null);
                                                setIsAddressFormOpen(true);
                                                setIsDirty(true);
                                                setAddressErrors({}); // Clear errors on new form
                                            }}
                                            className="w-full py-4 bg-white border border-dashed border-gray-300 rounded-xl font-bold text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all hover:border-[#B8860B] hover:text-[#B8860B] text-gray-400"
                                        >
                                            <Plus size={16} /> Adicionar Endereço
                                        </button>
                                    </>
                                ) : (
                                    <div className="bg-white p-6 rounded-xl border border-gray-200 animate-fade-in shadow-sm">
                                        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-50">
                                            <h4 className="text-sm font-bold text-[#1d1d1f] uppercase tracking-widest flex items-center gap-2">
                                                {editingAddressId ? <Edit3 size={14}/> : <Plus size={14}/>} 
                                                {editingAddressId ? 'Editar Endereço' : 'Novo Endereço'}
                                            </h4>
                                            <button onClick={() => { setIsAddressFormOpen(false); setIsDirty(addresses.length > 0 && isDirty); }}><X size={18} className="text-gray-400 hover:text-red-500"/></button>
                                        </div>
                                        
                                        <div className="space-y-4">
                                            <div>
                                                <label className={labelClasses}>CEP</label>
                                                <div className="relative">
                                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                                                    <input 
                                                        value={addressFormData.zipCode} 
                                                        onChange={e => { handleCepLookup(e.target.value); setIsDirty(true); }}
                                                        className={`${inputClasses} pl-9 ${addressErrors.zipCode ? 'border-red-300 focus:ring-red-200 text-red-600' : ''}`} 
                                                        placeholder="00000-000"
                                                        maxLength={9}
                                                    />
                                                    {isFetchingCep && <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-[#B8860B]"/>}
                                                </div>
                                                {addressErrors.zipCode && <ErrorMsg msg={addressErrors.zipCode} />}
                                            </div>

                                            <div>
                                                <label className={labelClasses}>LOGRADOURO</label>
                                                <div className="relative">
                                                    <Map size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                                                    <input 
                                                        value={addressFormData.street} 
                                                        onChange={e => handleAddressChange('street', e.target.value)} 
                                                        className={`${inputClasses} pl-9 ${addressErrors.street ? 'border-red-300 focus:ring-red-200 text-red-600' : ''}`} 
                                                    />
                                                </div>
                                                {addressErrors.street && <ErrorMsg msg={addressErrors.street} />}
                                            </div>
                                            
                                            <div>
                                                <label className={labelClasses}>Número</label>
                                                <div className="relative">
                                                    <Hash size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                                                    <input 
                                                        value={addressFormData.number} 
                                                        onChange={e => handleAddressChange('number', e.target.value)} 
                                                        className={`${inputClasses} pl-9 ${addressErrors.number ? 'border-red-300 focus:ring-red-200 text-red-600' : ''}`} 
                                                    />
                                                </div>
                                                {addressErrors.number && <ErrorMsg msg={addressErrors.number} />}
                                            </div>

                                            <div>
                                                <label className={labelClasses}>Bairro</label>
                                                <div className="relative">
                                                    <Navigation size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                                                    <input 
                                                        value={addressFormData.neighborhood} 
                                                        onChange={e => handleAddressChange('neighborhood', e.target.value)} 
                                                        className={`${inputClasses} pl-9 ${addressErrors.neighborhood ? 'border-red-300 focus:ring-red-200 text-red-600' : ''}`} 
                                                    />
                                                </div>
                                                {addressErrors.neighborhood && <ErrorMsg msg={addressErrors.neighborhood} />}
                                            </div>
                                            
                                            <div>
                                                <label className={labelClasses}>Complemento</label>
                                                <div className="relative">
                                                    <Building size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                                                    <input 
                                                        value={addressFormData.complement} 
                                                        onChange={e => handleAddressChange('complement', e.target.value)} 
                                                        className={`${inputClasses} pl-9`} 
                                                        placeholder="Opcional" 
                                                    />
                                                </div>
                                            </div>

                                            {/* Cidade e Estado em linhas separadas */}
                                            <div>
                                                <label className={labelClasses}>Cidade</label>
                                                <div className="relative">
                                                    <Building size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                                                    <input 
                                                        value={addressFormData.city} 
                                                        onChange={e => handleAddressChange('city', e.target.value)} 
                                                        className={`${inputClasses} pl-9 ${addressErrors.city ? 'border-red-300 focus:ring-red-200 text-red-600' : ''}`} 
                                                    />
                                                </div>
                                                {addressErrors.city && <ErrorMsg msg={addressErrors.city} />}
                                            </div>
                                            <div>
                                                <label className={labelClasses}>Estado</label>
                                                <div className="relative">
                                                    <Map size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                                                    <input 
                                                        value={addressFormData.state} 
                                                        onChange={e => handleAddressChange('state', e.target.value)} 
                                                        className={`${inputClasses} pl-9 ${addressErrors.state ? 'border-red-300 focus:ring-red-200 text-red-600' : ''}`} 
                                                    />
                                                </div>
                                                {addressErrors.state && <ErrorMsg msg={addressErrors.state} />}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    
                    {/* Footer Buttons Fixos */}
                    <div className="p-6 md:p-8 border-t border-gray-100 bg-white flex flex-row gap-4 sticky bottom-0 z-20 shrink-0">
                        <button 
                            onClick={onClose} 
                            className="flex-1 h-14 bg-gray-100 text-[#1d1d1f] font-bold text-sm uppercase tracking-[0.2em] rounded-xl hover:bg-gray-200 transition-all active:scale-[0.98]"
                        >
                            Fechar
                        </button>
                        <button 
                            onClick={handleGlobalSave} 
                            disabled={!isDirty || isSaving || !!emailError || !!phoneError}
                            className={`flex-1 h-14 font-bold text-sm uppercase tracking-[0.2em] rounded-xl transition-all shadow-xl flex items-center justify-center gap-3 ${
                                !isDirty || isSaving || !!emailError || !!phoneError
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' 
                                : 'bg-[#B8860B] text-white hover:bg-[#966d09] active:scale-[0.98]'
                            }`}
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" /> Salvando...
                                </>
                            ) : (
                                'Salvar'
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* DUPLICATE ADDRESS WARNING MODAL */}
            {showDuplicateAddressModal && createPortal(
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#1d1d1f]/60 backdrop-blur-md" onClick={() => setShowDuplicateAddressModal(false)}></div>
                    <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl relative overflow-hidden flex flex-col animate-fade-in border border-gray-100 p-6 text-center z-10">
                        <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle size={32} />
                        </div>
                        <h3 className="font-serif font-bold text-xl text-[#1d1d1f] mb-2">Endereço Duplicado</h3>
                        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                            Já existe um endereço cadastrado com este <strong>CEP, Número e Complemento</strong> para este cliente. <br/><br/>
                            <span className="block text-xs bg-gray-50 p-2 rounded text-gray-400">
                                {addressFormData.street}, {addressFormData.number} {addressFormData.complement ? `(${addressFormData.complement})` : ''} - {addressFormData.zipCode}
                            </span>
                        </p>
                        <button 
                            onClick={() => setShowDuplicateAddressModal(false)}
                            className="w-full py-3 bg-[#1d1d1f] text-white font-bold text-[10px] uppercase tracking-widest rounded-xl hover:bg-black transition-all"
                        >
                            Entendido
                        </button>
                    </div>
                </div>,
                document.body
            )}

            {/* DELETE CONFIRMATION MODAL */}
            {showDeleteConfirmation && editingUser && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#1d1d1f]/60 backdrop-blur-md" onClick={() => setShowDeleteConfirmation(false)}></div>
                    <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl relative overflow-hidden flex flex-col animate-fade-in border border-gray-100 p-6 text-center z-10">
                        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Trash2 size={32} />
                        </div>
                        <h3 className="font-serif font-bold text-xl text-[#1d1d1f] mb-2">Excluir Cliente?</h3>
                        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                            Tem certeza que deseja excluir <strong>{editingUser.name}</strong>? <br/>
                            Esta ação é irreversível e removerá todo o histórico.
                        </p>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setShowDeleteConfirmation(false)}
                                className="flex-1 py-3 bg-gray-100 text-[#1d1d1f] font-bold text-[10px] uppercase tracking-widest rounded-xl hover:bg-gray-200 transition-all"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={confirmDelete}
                                className="flex-1 py-3 bg-red-500 text-white font-bold text-[10px] uppercase tracking-widest rounded-xl hover:bg-red-600 transition-all shadow-lg shadow-red-200"
                            >
                                Sim, Excluir
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* ERROR MODAL: CANNOT DELETE ADMIN OR USER WITH HISTORY */}
            {deleteBlockType && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#1d1d1f]/60 backdrop-blur-md" onClick={() => setDeleteBlockType(null)}></div>
                    <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl relative overflow-hidden flex flex-col animate-fade-in border border-gray-100 p-6 text-center z-10">
                        <div className="w-16 h-16 bg-amber-50 text-[#B8860B] rounded-full flex items-center justify-center mx-auto mb-4">
                            {deleteBlockType === 'admin' ? <Shield size={32} /> : <FileText size={32} />}
                        </div>
                        <h3 className="font-serif font-bold text-xl text-[#1d1d1f] mb-2">Ação Bloqueada</h3>
                        
                        {deleteBlockType === 'admin' ? (
                            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                                O usuário <strong>Administrador</strong> é o perfil raiz do sistema e não pode ser removido por questões de segurança.
                            </p>
                        ) : (
                            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                                Este usuário possui pedidos registrados. Para preservar o histórico fiscal e financeiro, ele <strong>não pode ser excluído</strong>. <br/><br/>
                                <span className="block text-xs font-bold uppercase tracking-widest text-[#B8860B]">Sugestão:</span>
                                Inative o acesso do usuário nas configurações.
                            </p>
                        )}

                        <button 
                            onClick={() => setDeleteBlockType(null)}
                            className="w-full py-3 bg-[#1d1d1f] text-white font-bold text-[10px] uppercase tracking-widest rounded-xl hover:bg-black transition-all"
                        >
                            Entendido
                        </button>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};

export default AdminUserModal;
