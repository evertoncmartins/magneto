
import React, { useState, useEffect } from 'react';
import { X, User as UserIcon, MapPin, Loader2, Home, Edit3, Trash2, Plus, CheckCircle, Search, Tag, Building, Hash, Map, Navigation, AlertCircle } from 'lucide-react';
import { User, Address } from '../types';

const STATE_MAP: Record<string, string> = {
    'AC': 'Acre', 'AL': 'Alagoas', 'AP': 'Amapá', 'AM': 'Amazonas', 'BA': 'Bahia', 'CE': 'Ceará',
    'DF': 'Distrito Federal', 'ES': 'Espírito Santo', 'GO': 'Goiás', 'MA': 'Maranhão', 'MT': 'Mato Grosso',
    'MS': 'Mato Grosso do Sul', 'MG': 'Minas Gerais', 'PA': 'Pará', 'PB': 'Paraíba', 'PR': 'Paraná',
    'PE': 'Pernambuco', 'PI': 'Piauí', 'RJ': 'Rio de Janeiro', 'RN': 'Rio Grande do Norte',
    'RS': 'Rio Grande do Sul', 'RO': 'Rondônia', 'RR': 'Roraima', 'SC': 'Santa Catarina',
    'SP': 'São Paulo', 'SE': 'Sergipe', 'TO': 'Tocantins'
};

interface UserProfileModalProps {
    user: User;
    isOpen: boolean;
    onClose: () => void;
    onSave: (id: string, data: Partial<User> & { password?: string }) => void;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ user, isOpen, onClose, onSave }) => {
    const [activeTab, setActiveTab] = useState<'profile' | 'addresses'>('profile');
    
    // UI States
    const [isDirty, setIsDirty] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Estados do Formulário de Perfil
    const [formData, setFormData] = useState({
        name: '', email: '', phone: '', password: ''
    });

    // Estados de Erro
    const [errors, setErrors] = useState({
        email: '',
        phone: ''
    });

    // Estados para Gestão de Endereço (LOCAL)
    const [localAddresses, setLocalAddresses] = useState<Address[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<string | undefined>(undefined);

    // Estados para Formulário de Endereço (Interno)
    const [isAddressFormOpen, setIsAddressFormOpen] = useState(false);
    const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
    const [isFetchingCep, setIsFetchingCep] = useState(false);
    const [addressFormData, setAddressFormData] = useState<Address>({
        nickname: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '', zipCode: ''
    });

    useEffect(() => {
        if (isOpen && user) {
            // Profile Data
            setFormData({
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || '',
                password: '', 
            });
            setErrors({ email: '', phone: '' });

            // Address Data - Carrega dados do usuário para o estado local
            const addresses = user.savedAddresses || [];
            // Garante que o endereço atual esteja na lista se tiver ID
            let initialList = [...addresses];
            if (user.address?.id && !initialList.find(a => a.id === user.address?.id)) {
                initialList.unshift(user.address);
            }

            setLocalAddresses(initialList);
            setSelectedAddressId(user.address?.id || (initialList.length > 0 ? initialList[0].id : undefined));

            // Reset states
            setIsAddressFormOpen(false);
            setEditingAddressId(null);
            setAddressFormData({ nickname: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '', zipCode: '' });
            setIsDirty(false); // Clean state on open
        }
    }, [isOpen, user]);

    // --- VALIDAÇÕES DE PERFIL ---

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const formatted = value
            .replace(/\D/g, '') // Remove não dígitos
            .replace(/^(\d{2})(\d)/g, '($1) $2') // Coloca parênteses
            .replace(/(\d)(\d{4})$/, '$1-$2') // Coloca hífen
            .slice(0, 15); // Limita tamanho
        
        setFormData(prev => ({ ...prev, phone: formatted }));
        setIsDirty(true);

        // Validação rigorosa igual ao ContactPage
        const cleanPhone = formatted.replace(/\D/g, '');
        let errorMsg = '';
        if (cleanPhone.length > 0) {
            if (cleanPhone.length < 10 || (cleanPhone.length === 10 && cleanPhone[2] === '9')) {
                errorMsg = 'Telefone incompleto';
            }
        }
        setErrors(prev => ({ ...prev, phone: errorMsg }));
    };

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setFormData(prev => ({ ...prev, email: value }));
        
        // Validação de e-mail apenas visual se o campo for editável (atualmente disabled neste modal, mas preparado para futuro)
        // Como o email é disabled neste modal específico segundo o código anterior, a validação é preventiva.
    };

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (errors.phone || errors.email) {
            return;
        }

        setIsSaving(true);
        
        await new Promise(resolve => setTimeout(resolve, 600)); // Delay simulado

        const dataToUpdate: any = { 
            name: formData.name,
            phone: formData.phone,
        };
        if (formData.password) dataToUpdate.password = formData.password;
        
        onSave(user.id, dataToUpdate);
        setIsSaving(false);
        setIsDirty(false);
        // Modal stays open
    };

    // --- Address Logic (Local State Manipulation) ---

    const handleCepChange = async (cep: string) => {
        const cleanCep = cep.replace(/\D/g, '');
        setAddressFormData(prev => ({ ...prev, zipCode: cleanCep }));

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
                }
            } catch (error) {
                console.error("Erro ao buscar CEP", error);
            } finally {
                setIsFetchingCep(false);
            }
        }
    };

    const handleDeleteAddress = (addrId: string) => {
        if (confirm('Remover este endereço?')) {
            const updatedAddresses = localAddresses.filter(a => a.id !== addrId);
            setLocalAddresses(updatedAddresses);
            
            // Se deletou o selecionado, seleciona outro se possível
            if (selectedAddressId === addrId) {
                setSelectedAddressId(updatedAddresses.length > 0 ? updatedAddresses[0].id : undefined);
            }
            setIsDirty(true);
        }
    };

    const handleSelectAddress = (id: string) => {
        if (selectedAddressId !== id) {
            setSelectedAddressId(id);
            setIsDirty(true);
        }
    };

    const startEditAddress = (addr: Address) => {
        setAddressFormData(addr);
        setEditingAddressId(addr.id || null);
        setIsAddressFormOpen(true);
    };

    // Salva todas as alterações de endereço no "banco" e unifica lógica de formulário aberto
    const handleSaveAllAddresses = async () => {
        let finalAddresses = [...localAddresses];
        let finalSelectedId = selectedAddressId;

        // Se o formulário estiver aberto, valida e adiciona à lista antes de salvar
        if (isAddressFormOpen) {
            if (!addressFormData.street || !addressFormData.zipCode) {
                alert("Preencha o endereço corretamente para salvar.");
                return;
            }

            let newId = editingAddressId;
            const addrPayload = { ...addressFormData };

            if (editingAddressId) {
                addrPayload.id = editingAddressId;
                finalAddresses = finalAddresses.map(addr => 
                    addr.id === editingAddressId ? addrPayload : addr
                );
            } else {
                newId = `addr-${Date.now()}`;
                addrPayload.id = newId;
                finalAddresses.push(addrPayload);
            }

            // Se for o único ou nenhum selecionado, seleciona este
            if (!finalSelectedId || finalAddresses.length === 1) {
                finalSelectedId = newId || undefined;
            }
            
            // Atualiza estados locais para refletir a submissão do form
            setLocalAddresses(finalAddresses);
            setSelectedAddressId(finalSelectedId);
            setIsAddressFormOpen(false);
        }

        setIsSaving(true);
        await new Promise(resolve => setTimeout(resolve, 600)); // Delay simulado

        const selectedAddr = finalAddresses.find(a => a.id === finalSelectedId);
        
        onSave(user.id, { 
            savedAddresses: finalAddresses, 
            address: selectedAddr 
        });
        
        setIsSaving(false);
        setIsDirty(false); // Reset dirty flag
    };

    const inputClasses = "w-full h-10 px-3 bg-[#F5F5F7] rounded-lg text-sm text-[#1d1d1f] outline-none focus:bg-white focus:ring-1 focus:ring-[#B8860B] border border-transparent transition-all placeholder:text-gray-400";
    const labelClasses = "text-[10px] font-bold text-[#86868b] uppercase tracking-widest ml-1 mb-1 block";

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#011F4B]/40 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh] animate-fade-in border border-gray-100">
                
                {/* Header */}
                <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <div className="bg-[#1d1d1f] p-3 rounded-lg text-white">
                            <UserIcon size={24} />
                        </div>
                        <div>
                            <h3 className="font-serif font-bold text-xl text-[#1d1d1f]">Minha Conta</h3>
                            <p className="text-[10px] text-[#86868b] uppercase tracking-widest font-bold mt-1">Gerenciamento de Perfil</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-md transition-colors">
                        <X size={20} className="text-[#1d1d1f]" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-100 px-8">
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
                        Meus Endereços
                    </button>
                </div>
                
                {/* Content */}
                <div className="overflow-y-auto p-8 bg-[#F9F9FA] flex-1 custom-scrollbar">
                    
                    {/* TAB: PROFILE */}
                    {activeTab === 'profile' && (
                        <form id="profileForm" onSubmit={handleProfileSubmit} className="space-y-6">
                            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <label className={labelClasses}>Nome Completo</label>
                                        <input 
                                            required
                                            value={formData.name}
                                            onChange={e => { setFormData({...formData, name: e.target.value}); setIsDirty(true); }}
                                            className={inputClasses}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className={labelClasses}>Email</label>
                                        <input 
                                            type="email"
                                            disabled
                                            value={formData.email}
                                            onChange={handleEmailChange}
                                            className={`${inputClasses} bg-gray-50 text-gray-400 cursor-not-allowed`}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className={labelClasses}>Telefone</label>
                                        <input 
                                            type="tel"
                                            value={formData.phone}
                                            onChange={handlePhoneChange}
                                            className={`${inputClasses} ${errors.phone ? 'border-red-300 focus:ring-red-200' : ''}`}
                                            placeholder="(00) 00000-0000"
                                            maxLength={15}
                                        />
                                        {errors.phone && (
                                            <p className="text-red-500 text-[10px] mt-1 flex items-center gap-1 font-bold uppercase tracking-wide">
                                                <AlertCircle size={10}/> {errors.phone}
                                            </p>
                                        )}
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className={labelClasses}>Alterar Senha</label>
                                        <input 
                                            type="password"
                                            value={formData.password}
                                            onChange={e => { setFormData({...formData, password: e.target.value}); setIsDirty(true); }}
                                            className={inputClasses}
                                            placeholder="Deixe em branco para manter"
                                        />
                                    </div>
                                </div>
                            </div>
                        </form>
                    )}

                    {/* TAB: ADDRESSES */}
                    {activeTab === 'addresses' && (
                        <div className="space-y-4">
                            {!isAddressFormOpen ? (
                                <>
                                    {localAddresses.length > 0 ? (
                                        localAddresses.map((addr, idx) => {
                                            const isSelected = selectedAddressId === addr.id;
                                            return (
                                                <div 
                                                    key={addr.id || idx} 
                                                    onClick={() => addr.id && handleSelectAddress(addr.id)}
                                                    className={`p-5 rounded-xl border transition-all relative group cursor-pointer ${isSelected ? 'bg-white border-[#B8860B] shadow-lg ring-1 ring-[#B8860B]/20' : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md'}`}
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex items-start gap-4">
                                                            <div className={`mt-1 p-2 rounded-full flex items-center justify-center transition-colors ${isSelected ? 'bg-[#1d1d1f] text-[#B8860B]' : 'bg-[#F5F5F7] text-gray-400'}`}>
                                                                <MapPin size={18} />
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    {addr.nickname && <span className="text-[9px] font-bold uppercase tracking-widest bg-[#F5F5F7] px-2 py-0.5 rounded text-[#1d1d1f]">{addr.nickname}</span>}
                                                                    {isSelected && <span className="text-[9px] font-bold uppercase tracking-widest text-[#B8860B] flex items-center gap-1"><CheckCircle size={10}/> Principal</span>}
                                                                </div>
                                                                
                                                                <h4 className="font-bold text-[#1d1d1f] text-sm mb-1">{addr.street}, {addr.number}</h4>
                                                                <p className="text-xs text-gray-500">{addr.neighborhood}</p>
                                                                <p className="text-xs text-gray-500 mb-2">{addr.city} - {addr.state.split(' - ').pop()}</p>
                                                                
                                                                {addr.complement && <p className="text-xs text-gray-400 italic mb-2">Comp: {addr.complement}</p>}
                                                                
                                                                <p className="text-[10px] text-[#1d1d1f] font-bold uppercase tracking-widest bg-gray-50 inline-block px-2 py-1 rounded border border-gray-100">
                                                                    CEP: {addr.zipCode}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        
                                                        {/* Actions floating */}
                                                        <div className="flex flex-col gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); startEditAddress(addr); }}
                                                                className="p-2 text-gray-400 hover:text-[#B8860B] hover:bg-gray-50 rounded-lg transition-colors"
                                                                title="Editar"
                                                            >
                                                                <Edit3 size={16} />
                                                            </button>
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); if(addr.id) handleDeleteAddress(addr.id); }}
                                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                                title="Remover"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="text-center py-10 text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">
                                            <MapPin size={32} className="mx-auto mb-2 opacity-30"/>
                                            <p className="text-xs">Nenhum endereço cadastrado.</p>
                                        </div>
                                    )}
                                    <button 
                                        onClick={() => {
                                            setAddressFormData({ nickname: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '', zipCode: '' });
                                            setEditingAddressId(null);
                                            setIsAddressFormOpen(true);
                                            setIsDirty(true);
                                        }}
                                        className="w-full py-4 bg-white border border-dashed border-gray-300 rounded-xl font-bold text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all hover:border-[#B8860B] hover:text-[#B8860B] text-gray-400"
                                    >
                                        <Plus size={16} /> Adicionar Novo Endereço
                                    </button>
                                </>
                            ) : (
                                <div className="bg-white p-6 rounded-xl border border-gray-200 animate-fade-in shadow-sm">
                                    <div className="flex justify-between items-center mb-6 border-b border-gray-50 pb-4">
                                        <h4 className="text-sm font-bold text-[#1d1d1f] uppercase tracking-widest flex items-center gap-2">
                                            {editingAddressId ? <Edit3 size={14}/> : <Plus size={14}/>}
                                            {editingAddressId ? 'Editar Endereço' : 'Novo Endereço'}
                                        </h4>
                                        <button onClick={() => { setIsAddressFormOpen(false); }} className="text-gray-400 hover:text-red-500"><X size={18}/></button>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className={labelClasses}>Apelido</label>
                                                <div className="relative">
                                                    <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                                                    <input 
                                                        value={addressFormData.nickname} 
                                                        onChange={e => { setAddressFormData({...addressFormData, nickname: e.target.value}); setIsDirty(true); }}
                                                        className={`${inputClasses} pl-9`}
                                                        placeholder="Ex: Casa"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className={labelClasses}>CEP</label>
                                                <div className="relative">
                                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                                                    <input 
                                                        value={addressFormData.zipCode} 
                                                        onChange={e => { handleCepChange(e.target.value); setIsDirty(true); }}
                                                        className={`${inputClasses} pl-9`}
                                                        placeholder="00000-000"
                                                        maxLength={9}
                                                    />
                                                    {isFetchingCep && <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-[#B8860B]"/>}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="col-span-2">
                                                <label className={labelClasses}>Rua</label>
                                                <div className="relative">
                                                    <Map size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                                                    <input value={addressFormData.street} onChange={e => { setAddressFormData({...addressFormData, street: e.target.value}); setIsDirty(true); }} className={`${inputClasses} pl-9`} />
                                                </div>
                                            </div>
                                            <div>
                                                <label className={labelClasses}>Número</label>
                                                <div className="relative">
                                                    <Hash size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                                                    <input value={addressFormData.number} onChange={e => { setAddressFormData({...addressFormData, number: e.target.value}); setIsDirty(true); }} className={`${inputClasses} pl-9`} />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className={labelClasses}>Bairro</label>
                                                <div className="relative">
                                                    <Navigation size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                                                    <input value={addressFormData.neighborhood} onChange={e => { setAddressFormData({...addressFormData, neighborhood: e.target.value}); setIsDirty(true); }} className={`${inputClasses} pl-9`} />
                                                </div>
                                            </div>
                                            <div>
                                                <label className={labelClasses}>Complemento</label>
                                                <div className="relative">
                                                    <Building size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                                                    <input value={addressFormData.complement} onChange={e => { setAddressFormData({...addressFormData, complement: e.target.value}); setIsDirty(true); }} className={`${inputClasses} pl-9`} />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="col-span-2">
                                                <label className={labelClasses}>Cidade</label>
                                                <input value={addressFormData.city} onChange={e => { setAddressFormData({...addressFormData, city: e.target.value}); setIsDirty(true); }} className={inputClasses} />
                                            </div>
                                            <div>
                                                <label className={labelClasses}>Estado</label>
                                                <input value={addressFormData.state} onChange={e => { setAddressFormData({...addressFormData, state: e.target.value}); setIsDirty(true); }} className={inputClasses} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-8 border-t border-gray-100 bg-white flex gap-4 sticky bottom-0 z-20">
                    <button 
                        type="button" 
                        onClick={onClose}
                        className="flex-1 py-4 bg-white border border-gray-200 text-[#1d1d1f] font-bold text-[10px] uppercase tracking-widest rounded-xl hover:bg-gray-50 transition-colors"
                    >
                        Fechar
                    </button>
                    
                    {activeTab === 'profile' && (
                        <button 
                            type="submit" 
                            form="profileForm"
                            disabled={!isDirty || isSaving || !!errors.email || !!errors.phone}
                            className={`flex-1 py-4 font-bold text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-xl flex items-center justify-center gap-2 ${
                                !isDirty || isSaving || errors.email || errors.phone
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' 
                                : 'bg-[#1d1d1f] text-white hover:bg-black'
                            }`}
                        >
                            {isSaving ? <><Loader2 size={16} className="animate-spin"/> Salvando...</> : 'Salvar Dados'}
                        </button>
                    )}

                    {activeTab === 'addresses' && (
                        <button 
                            type="button"
                            onClick={handleSaveAllAddresses}
                            disabled={(!isDirty && !isAddressFormOpen) || isSaving} // Allows saving if dirty OR if form is open (to commit the form)
                            className={`flex-1 py-4 font-bold text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-xl flex items-center justify-center gap-2 ${
                                (!isDirty && !isAddressFormOpen) || isSaving 
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' 
                                : 'bg-[#B8860B] text-white hover:bg-[#966d09]'
                            }`}
                        >
                            {isSaving ? <><Loader2 size={16} className="animate-spin"/> Salvando...</> : 'Salvar'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserProfileModal;
