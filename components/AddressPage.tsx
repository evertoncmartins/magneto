
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Plus, CheckCircle, Trash2, Home, Loader2, Search, Navigation, Building, Map, ArrowLeft, CornerUpLeft } from 'lucide-react';
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
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [isFetchingCep, setIsFetchingCep] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    // Form State
    const [addressForm, setAddressForm] = useState<Address>({
        street: '', number: '', complement: '', neighborhood: '', city: '', state: '', zipCode: ''
    });

    useEffect(() => {
        if (!user) {
            navigate('/login', { state: { from: '/address' } });
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
                    setAddressForm(prev => ({
                        ...prev,
                        street: data.logradouro || prev.street,
                        neighborhood: data.bairro || prev.neighborhood,
                        city: data.localidade || prev.city,
                        state: data.uf || prev.state
                    }));
                }
            } catch (error) {
                console.error("CEP Error", error);
            } finally {
                setIsFetchingCep(false);
            }
        }
    };

    const handleSaveAddress = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        
        setIsSaving(true);
        try {
            const newAddress = { ...addressForm, id: `addr-${Date.now()}` };
            const updatedAddresses = [...(user.savedAddresses || []), newAddress];
            
            // Salva a lista de endereços E define o novo como o atual selecionado
            await updateUser(user.id, { 
                savedAddresses: updatedAddresses,
                address: newAddress // Auto-select newly created address
            });
            
            onUpdateUser({ 
                savedAddresses: updatedAddresses,
                address: newAddress 
            });
            
            setIsAddingNew(false);
            setAddressForm({ street: '', number: '', complement: '', neighborhood: '', city: '', state: '', zipCode: '' });
            navigate('/cart', { state: { addressConfirmed: true } }); // Volta para o checkout confirmado
        } catch (error) {
            console.error(error);
            alert("Erro ao salvar endereço.");
        } finally {
            setIsSaving(false);
        }
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

    // Estilos de Input
    const inputWrapperClass = "relative w-full group";
    const inputIconClass = "absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#B8860B] transition-colors pointer-events-none";
    const inputFieldClass = "w-full h-14 pl-14 pr-4 bg-[#F5F5F7] border-2 border-transparent rounded-xl text-base text-[#1d1d1f] outline-none focus:bg-white focus:border-[#B8860B] focus:ring-4 focus:ring-[#B8860B]/10 transition-all placeholder:text-gray-400 shadow-sm";
    const smallInputFieldClass = "w-full h-14 px-4 bg-[#F5F5F7] border-2 border-transparent rounded-xl text-base text-[#1d1d1f] outline-none focus:bg-white focus:border-[#B8860B] focus:ring-4 focus:ring-[#B8860B]/10 transition-all placeholder:text-gray-400 shadow-sm";

    if (!user) return null;

    return (
        <div className="min-h-screen bg-[#F5F5F7] pt-28 pb-24 px-4 md:px-6 font-sans">
            <div className="max-w-3xl mx-auto">
                
                <CheckoutSteps currentStep={2} />

                <div className="flex items-center gap-4 mb-8">
                    <button onClick={() => navigate('/cart')} className="p-2 hover:bg-white rounded-full transition-colors text-gray-500 hover:text-[#1d1d1f]">
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-serif font-bold text-[#1d1d1f]">
                            {isAddingNew ? 'Cadastrar Endereço' : 'Endereço de Entrega'}
                        </h1>
                        <p className="text-sm text-gray-500">
                            {isAddingNew ? 'Preencha os dados abaixo.' : 'Selecione onde você quer receber seus ímãs.'}
                        </p>
                    </div>
                </div>

                <div className="flex flex-col gap-8">
                    
                    {/* Lista de Endereços Existentes (Só aparece se NÃO estiver adicionando um novo) */}
                    {!isAddingNew && (
                        <div className="space-y-4 animate-fade-in">
                            {user.savedAddresses && user.savedAddresses.length > 0 ? (
                                user.savedAddresses.map((addr, idx) => {
                                    const isSelected = user.address?.zipCode === addr.zipCode && user.address?.number === addr.number; 
                                    
                                    return (
                                        <div 
                                            key={addr.id || idx} 
                                            className={`p-8 rounded-2xl border-2 transition-all duration-300 relative group cursor-pointer ${isSelected ? 'bg-white border-[#B8860B] shadow-xl ring-2 ring-[#B8860B]/20 scale-[1.01]' : 'bg-white border-gray-100 shadow-md hover:border-gray-300 hover:shadow-lg'}`}
                                            onClick={() => handleSelectAddress(addr)}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-start gap-6">
                                                    <div className={`mt-1 p-3 rounded-full flex items-center justify-center transition-colors ${isSelected ? 'bg-[#1d1d1f] text-[#B8860B]' : 'bg-[#F5F5F7] text-gray-400'}`}>
                                                        <MapPin size={24} />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-[#1d1d1f] text-xl mb-1">{addr.street}, {addr.number}</h4>
                                                        <p className="text-base text-gray-500">{addr.neighborhood} - {addr.city}/{addr.state}</p>
                                                        <p className="text-sm text-gray-400 mt-2 font-medium bg-gray-50 inline-block px-2 py-1 rounded">CEP: {formatCep(addr.zipCode)}</p>
                                                        {addr.complement && <p className="text-sm text-gray-400 italic mt-1">Comp: {addr.complement}</p>}
                                                    </div>
                                                </div>
                                                {isSelected && (
                                                    <div className="bg-[#B8860B] text-white p-2 rounded-full shadow-sm">
                                                        <CheckCircle size={20} />
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); if(addr.id) handleDeleteAddress(addr.id); }}
                                                className="absolute bottom-6 right-6 p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors opacity-0 group-hover:opacity-100"
                                                title="Remover endereço"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="p-12 bg-white rounded-3xl border-2 border-dashed border-gray-200 text-center text-gray-400 flex flex-col items-center gap-4">
                                    <Home size={48} className="opacity-30" />
                                    <p className="text-lg font-medium">Nenhum endereço salvo.</p>
                                </div>
                            )}

                            <button 
                                onClick={() => setIsAddingNew(true)}
                                className="w-full py-6 bg-white border-2 border-dashed border-gray-300 rounded-3xl font-bold text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all hover:border-[#B8860B] hover:text-[#B8860B] hover:shadow-lg hover:scale-[1.01] active:scale-95 text-gray-400"
                            >
                                <Plus size={20} /> Cadastrar Novo Endereço
                            </button>
                        </div>
                    )}

                    {/* Formulário de Novo Endereço (Ocupa espaço total, substitui lista) */}
                    {isAddingNew && (
                        <div className="bg-white p-8 md:p-12 rounded-3xl shadow-2xl border border-gray-100 animate-fade-in relative">
                            <button 
                                onClick={() => setIsAddingNew(false)} 
                                className="absolute top-8 right-8 p-3 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-[#1d1d1f] flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
                            >
                                <CornerUpLeft size={16} /> Voltar para Lista
                            </button>
                            
                            <form onSubmit={handleSaveAddress} className="space-y-6 mt-6">
                                <div className={inputWrapperClass}>
                                    <Search className={inputIconClass} size={20}/>
                                    <input 
                                        type="tel" 
                                        inputMode="numeric"
                                        placeholder="CEP" 
                                        maxLength={9}
                                        value={addressForm.zipCode}
                                        onChange={e => handleCepChange(e.target.value)}
                                        className={inputFieldClass}
                                        required
                                        autoFocus
                                    />
                                    {isFetchingCep && <div className="absolute right-6 top-1/2 -translate-y-1/2"><Loader2 size={20} className="animate-spin text-[#B8860B]"/></div>}
                                </div>
                                
                                <div className="flex flex-col md:flex-row gap-6">
                                    <div className={`${inputWrapperClass} flex-[3]`}>
                                        <Map className={inputIconClass} size={20}/>
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
                                        <input 
                                            type="text" 
                                            placeholder="Número" 
                                            value={addressForm.number}
                                            onChange={e => setAddressForm({...addressForm, number: e.target.value})}
                                            className={`${smallInputFieldClass} text-center font-bold`} 
                                            required
                                        />
                                    </div>
                                </div>

                                <div className={inputWrapperClass}>
                                    <Building className={inputIconClass} size={20}/>
                                    <input 
                                        type="text" 
                                        placeholder="Complemento (Apto, Bloco, etc) - Opcional" 
                                        value={addressForm.complement}
                                        onChange={e => setAddressForm({...addressForm, complement: e.target.value})}
                                        className={inputFieldClass}
                                    />
                                </div>

                                <div className={inputWrapperClass}>
                                    <Navigation className={inputIconClass} size={20}/>
                                    <input 
                                        type="text" 
                                        placeholder="Bairro" 
                                        value={addressForm.neighborhood}
                                        onChange={e => setAddressForm({...addressForm, neighborhood: e.target.value})}
                                        className={inputFieldClass}
                                        required
                                    />
                                </div>

                                <div className="flex flex-col md:flex-row gap-6">
                                    <div className={`${inputWrapperClass} flex-[3]`}>
                                        <MapPin className={inputIconClass} size={20}/>
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
                                        <input 
                                            type="text" 
                                            placeholder="UF" 
                                            maxLength={2}
                                            value={addressForm.state}
                                            onChange={e => setAddressForm({...addressForm, state: e.target.value})}
                                            className={`${smallInputFieldClass} text-center uppercase font-bold`}
                                            required
                                        />
                                    </div>
                                </div>

                                <button 
                                    type="submit"
                                    disabled={!addressForm.street || isSaving}
                                    className="w-full h-16 mt-8 bg-[#1d1d1f] text-white text-sm font-bold uppercase tracking-[0.2em] rounded-2xl hover:bg-black transition-all shadow-xl flex items-center justify-center gap-3 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed hover:shadow-2xl"
                                >
                                    {isSaving ? <Loader2 size={24} className="animate-spin"/> : "Salvar e Continuar"}
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
