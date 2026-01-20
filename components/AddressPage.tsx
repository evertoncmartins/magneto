
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Plus, CheckCircle, Trash2, Home, Loader2, Search, Navigation, Building, Map, ArrowLeft, Hash, Tag, Edit3, Save } from 'lucide-react';
import { User, Address } from '../types';
import { updateUser } from '../services/mockService';
import CheckoutSteps from './CheckoutSteps';

const STATE_MAP: Record<string, string> = {
    'AC': 'Acre', 'AL': 'Alagoas', 'AP': 'Amapá', 'AM': 'Amazonas', 'BA': 'Bahia', 'CE': 'Ceará',
    'DF': 'Distrito Federal', 'ES': 'Espírito Santo', 'GO': 'Goiás', 'MA': 'Maranhão', 'MT': 'Mato Grosso',
    'MS': 'Mato Grosso do Sul', 'MG': 'Minas Gerais', 'PA': 'Pará', 'PB': 'Paraíba', 'PR': 'Paraná',
    'PE': 'Pernambuco', 'PI': 'Piauí', 'RJ': 'Rio de Janeiro', 'RN': 'Rio Grande do Norte',
    'RS': 'Rio Grande do Sul', 'RO': 'Rondônia', 'RR': 'Roraima', 'SC': 'Santa Catarina',
    'SP': 'São Paulo', 'SE': 'Sergipe', 'TO': 'Tocantins'
};

interface AddressPageProps {
    user: User | null;
    onUpdateUser: (data: Partial<User>) => void;
}

const AddressPage: React.FC<AddressPageProps> = ({ user, onUpdateUser }) => {
    const navigate = useNavigate();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isFetchingCep, setIsFetchingCep] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    
    // Form State
    const [addressForm, setAddressForm] = useState<Address>({
        nickname: '',
        street: '', 
        number: '', 
        complement: '', 
        neighborhood: '', 
        city: '', 
        state: '', 
        zipCode: ''
    });

    useEffect(() => {
        if (!user) {
            navigate('/login', { state: { from: '/address' } });
        }
        // Se não tiver endereços, abre o form automaticamente
        if (user && (!user.savedAddresses || user.savedAddresses.length === 0)) {
            setIsFormOpen(true);
        }
    }, [user, navigate]);

    // Handlers
    const handleCepChange = async (cep: string) => {
        const cleanCep = cep.replace(/\D/g, '');
        setAddressForm(prev => ({ ...prev, zipCode: cleanCep }));

        if (cleanCep.length === 8) {
            setIsFetchingCep(true);
            try {
                const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
                const data = await response.json();
                if (!data.erro) {
                    // Formata Estado como "Nome - Sigla" (lógica solicitada)
                    const stateName = STATE_MAP[data.uf] || data.uf;
                    const formattedState = data.uf.length === 2 ? `${stateName} - ${data.uf}` : data.uf;

                    setAddressForm(prev => ({
                        ...prev,
                        street: data.logradouro || prev.street,
                        neighborhood: data.bairro || prev.neighborhood,
                        city: data.localidade || prev.city,
                        state: formattedState
                    }));
                }
            } catch (error) {
                console.error("CEP Error", error);
            } finally {
                setIsFetchingCep(false);
            }
        }
    };

    const handleEditAddress = (addr: Address) => {
        setAddressForm(addr);
        setEditingId(addr.id || null);
        setIsFormOpen(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSaveAddress = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        
        setIsSaving(true);
        try {
            let updatedAddresses = [...(user.savedAddresses || [])];
            let newAddress: Address;

            if (editingId) {
                // Modo Edição
                updatedAddresses = updatedAddresses.map(addr => 
                    addr.id === editingId ? { ...addressForm, id: editingId } : addr
                );
                newAddress = { ...addressForm, id: editingId };
            } else {
                // Modo Criação
                newAddress = { ...addressForm, id: `addr-${Date.now()}` };
                updatedAddresses.push(newAddress);
            }
            
            // Salva a lista de endereços E define o novo/editado como o atual selecionado
            await updateUser(user.id, { 
                savedAddresses: updatedAddresses,
                address: newAddress 
            });
            
            onUpdateUser({ 
                savedAddresses: updatedAddresses,
                address: newAddress 
            });
            
            resetForm();
            // Se foi uma edição, não navega, só fecha o form. Se foi criação, também.
            // O usuário escolhe quando avançar.
        } catch (error) {
            console.error(error);
            alert("Erro ao salvar endereço.");
        } finally {
            setIsSaving(false);
        }
    };

    const resetForm = () => {
        setIsFormOpen(false);
        setEditingId(null);
        setAddressForm({ nickname: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '', zipCode: '' });
    };

    const handleSelectAddress = async (addr: Address) => {
        if (!user) return;
        // Atualiza apenas o endereço selecionado (shipping address)
        await updateUser(user.id, { address: addr });
        onUpdateUser({ address: addr });
        navigate('/cart', { state: { addressConfirmed: true } });
    };

    const handleDeleteAddress = async (addrId: string) => {
        if (!user || !user.savedAddresses) return;
        if (!window.confirm("Deseja remover este endereço?")) return;

        const updatedAddresses = user.savedAddresses.filter(a => a.id !== addrId);
        
        // Se deletou o endereço selecionado, limpa a seleção
        const currentSelected = user.address?.id === addrId ? undefined : user.address;

        await updateUser(user.id, { 
            savedAddresses: updatedAddresses,
            address: currentSelected
        });
        
        onUpdateUser({ 
            savedAddresses: updatedAddresses,
            address: currentSelected
        });
    };

    const formatCep = (cep: string) => {
        const clean = cep.replace(/\D/g, '');
        if (clean.length === 8) {
            return `${clean.slice(0, 5)}-${clean.slice(5)}`;
        }
        return clean;
    };

    // Estilos de Input (Reduzidos e Padronizados - h-11 e text-sm)
    const inputWrapperClass = "relative w-full group";
    const inputIconClass = "absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#B8860B] transition-colors pointer-events-none";
    const inputFieldClass = "w-full h-11 pl-10 pr-4 bg-[#F5F5F7] border border-transparent rounded-lg text-sm text-[#1d1d1f] outline-none focus:bg-white focus:border-[#B8860B] focus:ring-2 focus:ring-[#B8860B]/10 transition-all placeholder:text-gray-400 shadow-sm";

    if (!user) return null;

    return (
        <div className="min-h-screen bg-[#F5F5F7] pt-28 pb-24 px-4 md:px-6 font-sans">
            <div className="max-w-5xl mx-auto">
                
                <CheckoutSteps currentStep={2} />

                <div className="flex items-center gap-4 mb-8">
                    <button onClick={() => navigate('/cart')} className="p-2 hover:bg-white rounded-full transition-colors text-gray-500 hover:text-[#1d1d1f]">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-serif font-bold text-[#1d1d1f]">
                            Endereço de Entrega
                        </h1>
                        <p className="text-xs text-gray-500">
                            Gerencie seus endereços para envio.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                    
                    {/* COLUNA 1: Lista de Endereços */}
                    <div className="space-y-4 animate-fade-in">
                        {user.savedAddresses && user.savedAddresses.length > 0 ? (
                            user.savedAddresses.map((addr, idx) => {
                                const isSelected = user.address?.id === addr.id; 
                                
                                return (
                                    <div 
                                        key={addr.id || idx} 
                                        className={`p-5 rounded-xl border transition-all duration-300 relative group cursor-pointer ${isSelected ? 'bg-white border-[#B8860B] shadow-lg ring-1 ring-[#B8860B]/20' : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md'}`}
                                        onClick={() => handleSelectAddress(addr)}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-start gap-4">
                                                <div className={`mt-1 p-2 rounded-full flex items-center justify-center transition-colors ${isSelected ? 'bg-[#1d1d1f] text-[#B8860B]' : 'bg-[#F5F5F7] text-gray-400'}`}>
                                                    <MapPin size={18} />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        {addr.nickname && <span className="text-[10px] font-bold uppercase tracking-widest bg-[#F5F5F7] px-2 py-0.5 rounded text-[#1d1d1f]">{addr.nickname}</span>}
                                                        {isSelected && <span className="text-[10px] font-bold uppercase tracking-widest text-[#B8860B] flex items-center gap-1"><CheckCircle size={10}/> Selecionado</span>}
                                                    </div>
                                                    
                                                    <h4 className="font-bold text-[#1d1d1f] text-sm mb-1">{addr.street}, {addr.number}</h4>
                                                    <p className="text-xs text-gray-500">{addr.neighborhood}</p>
                                                    <p className="text-xs text-gray-500 mb-2">{addr.city} - {addr.state.split(' - ').pop()}</p>
                                                    
                                                    {addr.complement && <p className="text-xs text-gray-400 italic mb-2">Comp: {addr.complement}</p>}
                                                    
                                                    <p className="text-[10px] text-[#1d1d1f] font-bold uppercase tracking-widest bg-gray-50 inline-block px-2 py-1 rounded border border-gray-100">
                                                        CEP: {formatCep(addr.zipCode)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleEditAddress(addr); }}
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
                                );
                            })
                        ) : (
                            <div className="p-8 bg-white rounded-xl border border-dashed border-gray-300 text-center text-gray-400 flex flex-col items-center gap-3">
                                <Home size={32} className="opacity-30" />
                                <p className="text-sm font-medium">Nenhum endereço salvo.</p>
                            </div>
                        )}

                        {!isFormOpen && (
                            <button 
                                onClick={() => { resetForm(); setIsFormOpen(true); }}
                                className="w-full py-4 bg-white border border-dashed border-gray-300 rounded-xl font-bold text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all hover:border-[#B8860B] hover:text-[#B8860B] hover:shadow-md active:scale-95 text-gray-400"
                            >
                                <Plus size={16} /> Cadastrar Novo Endereço
                            </button>
                        )}
                    </div>

                    {/* COLUNA 2: Formulário (Visível se isFormOpen) */}
                    {isFormOpen && (
                        <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 animate-fade-in relative lg:sticky lg:top-24">
                            <div className="flex justify-between items-center mb-6 border-b border-gray-50 pb-4">
                                <h3 className="text-sm font-bold text-[#1d1d1f] uppercase tracking-widest flex items-center gap-2">
                                    {editingId ? <><Edit3 size={16}/> Editar Endereço</> : <><Plus size={16}/> Novo Endereço</>}
                                </h3>
                                <button onClick={resetForm} className="text-gray-400 hover:text-[#1d1d1f] transition-colors p-1 rounded-full hover:bg-gray-50">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                            
                            <form onSubmit={handleSaveAddress} className="space-y-4">
                                <div className={inputWrapperClass}>
                                    <Tag className={inputIconClass} size={16}/>
                                    <input 
                                        type="text" 
                                        placeholder="Apelido (Ex: Casa, Trabalho, Mãe)" 
                                        value={addressForm.nickname || ''}
                                        onChange={e => setAddressForm({...addressForm, nickname: e.target.value})}
                                        className={inputFieldClass}
                                    />
                                </div>

                                <div className={inputWrapperClass}>
                                    <Search className={inputIconClass} size={16}/>
                                    <input 
                                        type="tel" 
                                        inputMode="numeric"
                                        placeholder="CEP" 
                                        maxLength={9}
                                        value={addressForm.zipCode}
                                        onChange={e => handleCepChange(e.target.value)}
                                        className={inputFieldClass}
                                        required
                                    />
                                    {isFetchingCep && <div className="absolute right-4 top-1/2 -translate-y-1/2"><Loader2 size={16} className="animate-spin text-[#B8860B]"/></div>}
                                </div>
                                
                                <div className="flex flex-col md:flex-row gap-4">
                                    <div className={`${inputWrapperClass} flex-[3]`}>
                                        <Map className={inputIconClass} size={16}/>
                                        <input 
                                            type="text" 
                                            placeholder="Rua / Logradouro" 
                                            value={addressForm.street}
                                            onChange={e => setAddressForm({...addressForm, street: e.target.value})}
                                            className={inputFieldClass}
                                            required
                                        />
                                    </div>
                                    <div className={`${inputWrapperClass} flex-1`}>
                                        <Hash className={inputIconClass} size={16}/>
                                        <input 
                                            type="text" 
                                            placeholder="Nº" 
                                            value={addressForm.number}
                                            onChange={e => setAddressForm({...addressForm, number: e.target.value})}
                                            className={inputFieldClass}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className={inputWrapperClass}>
                                    <Building className={inputIconClass} size={16}/>
                                    <input 
                                        type="text" 
                                        placeholder="Complemento (Apto, Bloco, etc) - Opcional" 
                                        value={addressForm.complement}
                                        onChange={e => setAddressForm({...addressForm, complement: e.target.value})}
                                        className={inputFieldClass}
                                    />
                                </div>

                                <div className={inputWrapperClass}>
                                    <Navigation className={inputIconClass} size={16}/>
                                    <input 
                                        type="text" 
                                        placeholder="Bairro" 
                                        value={addressForm.neighborhood}
                                        onChange={e => setAddressForm({...addressForm, neighborhood: e.target.value})}
                                        className={inputFieldClass}
                                        required
                                    />
                                </div>

                                <div className="flex flex-col md:flex-row gap-4">
                                    <div className={`${inputWrapperClass} flex-[3]`}>
                                        <MapPin className={inputIconClass} size={16}/>
                                        <input 
                                            type="text" 
                                            placeholder="Cidade" 
                                            value={addressForm.city}
                                            onChange={e => setAddressForm({...addressForm, city: e.target.value})}
                                            className={inputFieldClass}
                                            required
                                        />
                                    </div>
                                    <div className={`${inputWrapperClass} flex-1`}>
                                        <Map className={inputIconClass} size={16}/>
                                        <input 
                                            type="text" 
                                            placeholder="UF" 
                                            value={addressForm.state}
                                            onChange={e => setAddressForm({...addressForm, state: e.target.value})}
                                            className={inputFieldClass}
                                            required
                                        />
                                    </div>
                                </div>

                                <button 
                                    type="submit"
                                    disabled={!addressForm.street || isSaving}
                                    className="w-full h-12 mt-4 bg-[#1d1d1f] text-white text-xs font-bold uppercase tracking-[0.2em] rounded-xl hover:bg-black transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed hover:shadow-xl"
                                >
                                    {isSaving ? <Loader2 size={16} className="animate-spin"/> : <><Save size={16}/> {editingId ? 'Atualizar Endereço' : 'Salvar Endereço'}</>}
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AddressPage;
