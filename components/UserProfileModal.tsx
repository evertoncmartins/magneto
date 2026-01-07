
import React, { useState, useEffect } from 'react';
import { X, User as UserIcon, MapPin, Loader2 } from 'lucide-react';
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
    const [isFetchingCep, setIsFetchingCep] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: '',
        zipCode: ''
    });

    useEffect(() => {
        if (isOpen && user) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || '',
                password: '', 
                street: user.address?.street || '',
                number: user.address?.number || '',
                complement: user.address?.complement || '',
                neighborhood: user.address?.neighborhood || '',
                city: user.address?.city || '',
                state: user.address?.state || '',
                zipCode: user.address?.zipCode || ''
            });
        }
    }, [isOpen, user]);

    const getStateDisplay = (uf: string) => {
        const cleanUf = uf.split(' - ').pop() || uf;
        const name = STATE_MAP[cleanUf.toUpperCase()];
        return name ? `${name} - ${cleanUf.toUpperCase()}` : uf.toUpperCase();
    };

    const handleCepChange = async (cep: string) => {
        const cleanCep = cep.replace(/\D/g, '');
        setFormData(prev => ({ ...prev, zipCode: cleanCep }));

        if (cleanCep.length === 8) {
            setIsFetchingCep(true);
            try {
                const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
                const data = await response.json();
                
                if (!data.erro) {
                    setFormData(prev => ({
                        ...prev,
                        street: data.logradouro || prev.street,
                        neighborhood: data.bairro || prev.neighborhood,
                        city: data.localidade || prev.city,
                        state: getStateDisplay(data.uf)
                    }));
                }
            } catch (error) {
                console.error("Erro ao buscar CEP", error);
            } finally {
                setIsFetchingCep(false);
            }
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const addressData: Address = {
            street: formData.street,
            number: formData.number,
            complement: formData.complement,
            neighborhood: formData.neighborhood,
            city: formData.city,
            state: formData.state,
            zipCode: formData.zipCode
        };

        const dataToUpdate: any = { 
            name: formData.name,
            phone: formData.phone,
            address: addressData
        };

        if (formData.password) {
            dataToUpdate.password = formData.password;
        }

        onSave(user.id, dataToUpdate);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#011F4B]/40 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
            <div className="bg-white w-full max-w-2xl rounded-md shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh] animate-fade-in border border-gray-100">
                
                {/* Header */}
                <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <div className="bg-[#F5F5F7] p-3 rounded-md text-[#011F4B]">
                            <UserIcon size={24} />
                        </div>
                        <div>
                            <h3 className="font-serif font-bold text-xl text-[#011F4B]">Perfil do Cliente</h3>
                            <p className="text-xs text-[#86868b] uppercase tracking-widest font-bold mt-1">Dados de Faturamento & Entrega</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-md transition-colors">
                        <X size={20} className="text-[#011F4B]" />
                    </button>
                </div>
                
                {/* Scrollable Form */}
                <div className="overflow-y-auto p-8">
                    <form id="profileForm" onSubmit={handleSubmit} className="space-y-8">
                        <section>
                            <h4 className="text-[10px] font-bold text-[#B8860B] uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                                Identificação
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-[#86868b] uppercase px-1">Nome Completo</label>
                                    <input 
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({...formData, name: e.target.value})}
                                        className="w-full px-4 py-3 bg-[#F5F5F7] border border-transparent focus:bg-white focus:border-[#B8860B] rounded-md text-base outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-[#86868b] uppercase px-1">Email</label>
                                    <input 
                                        type="email"
                                        disabled
                                        value={formData.email}
                                        className="w-full px-4 py-3 bg-gray-50 border border-transparent text-gray-400 rounded-md text-base outline-none cursor-not-allowed"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-[#86868b] uppercase px-1">Telefone</label>
                                    <input 
                                        value={formData.phone}
                                        onChange={e => setFormData({...formData, phone: e.target.value})}
                                        className="w-full px-4 py-3 bg-[#F5F5F7] border border-transparent focus:bg-white focus:border-[#B8860B] rounded-md text-base outline-none transition-all"
                                        placeholder="(00) 00000-0000"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-[#86868b] uppercase px-1">Nova Senha</label>
                                    <input 
                                        type="password"
                                        value={formData.password}
                                        onChange={e => setFormData({...formData, password: e.target.value})}
                                        className="w-full px-4 py-3 bg-[#F5F5F7] border border-transparent focus:bg-white focus:border-[#B8860B] rounded-md text-base outline-none transition-all"
                                        placeholder="Manter senha atual"
                                    />
                                </div>
                            </div>
                        </section>

                        <section>
                            <h4 className="text-[10px] font-bold text-[#B8860B] uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                                Endereço
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <div className="md:col-span-1 space-y-1.5">
                                    <label className="text-[10px] font-bold text-[#86868b] uppercase px-1">CEP</label>
                                    <div className="relative">
                                        <input 
                                            value={formData.zipCode}
                                            onChange={e => handleCepChange(e.target.value)}
                                            maxLength={8}
                                            className="w-full px-4 py-3 bg-[#F5F5F7] border border-transparent focus:bg-white focus:border-[#B8860B] rounded-md text-base outline-none transition-all"
                                            placeholder="00000000"
                                        />
                                        {isFetchingCep && <Loader2 size={16} className="absolute right-3 top-3.5 animate-spin text-[#B8860B]" />}
                                    </div>
                                </div>
                                <div className="md:col-span-3 space-y-1.5">
                                    <label className="text-[10px] font-bold text-[#86868b] uppercase px-1">Logradouro</label>
                                    <input 
                                        value={formData.street}
                                        onChange={e => setFormData({...formData, street: e.target.value})}
                                        className="w-full px-4 py-3 bg-[#F5F5F7] border border-transparent focus:bg-white focus:border-[#B8860B] rounded-md text-base outline-none transition-all"
                                    />
                                </div>
                                <div className="md:col-span-1 space-y-1.5">
                                    <label className="text-[10px] font-bold text-[#86868b] uppercase px-1">Número</label>
                                    <input 
                                        value={formData.number}
                                        onChange={e => setFormData({...formData, number: e.target.value})}
                                        className="w-full px-4 py-3 bg-[#F5F5F7] border border-transparent focus:bg-white focus:border-[#B8860B] rounded-md text-base outline-none transition-all"
                                    />
                                </div>
                                <div className="md:col-span-1 space-y-1.5">
                                    <label className="text-[10px] font-bold text-[#86868b] uppercase px-1">Comp.</label>
                                    <input 
                                        value={formData.complement}
                                        onChange={e => setFormData({...formData, complement: e.target.value})}
                                        className="w-full px-4 py-3 bg-[#F5F5F7] border border-transparent focus:bg-white focus:border-[#B8860B] rounded-md text-base outline-none transition-all"
                                    />
                                </div>
                                <div className="md:col-span-2 space-y-1.5">
                                    <label className="text-[10px] font-bold text-[#86868b] uppercase px-1">Bairro</label>
                                    <input 
                                        value={formData.neighborhood}
                                        onChange={e => setFormData({...formData, neighborhood: e.target.value})}
                                        className="w-full px-4 py-3 bg-[#F5F5F7] border border-transparent focus:bg-white focus:border-[#B8860B] rounded-md text-base outline-none transition-all"
                                    />
                                </div>
                                <div className="md:col-span-1 space-y-1.5">
                                    <label className="text-[10px] font-bold text-[#86868b] uppercase px-1">Cidade</label>
                                    <input 
                                        value={formData.city}
                                        onChange={e => setFormData({...formData, city: e.target.value})}
                                        className="w-full px-4 py-3 bg-[#F5F5F7] border border-transparent focus:bg-white focus:border-[#B8860B] rounded-md text-base outline-none transition-all"
                                    />
                                </div>
                                <div className="md:col-span-3 space-y-1.5">
                                    <label className="text-[10px] font-bold text-[#86868b] uppercase px-1">Estado - UF</label>
                                    <input 
                                        value={formData.state}
                                        onChange={e => setFormData({...formData, state: e.target.value})}
                                        className="w-full px-4 py-3 bg-[#F5F5F7] border border-transparent focus:bg-white focus:border-[#B8860B] rounded-md text-base outline-none transition-all"
                                        placeholder="Ex: São Paulo - SP"
                                    />
                                </div>
                            </div>
                        </section>
                    </form>
                </div>

                {/* Footer Actions */}
                <div className="p-8 border-t border-gray-100 bg-white flex gap-4">
                    <button 
                        type="button" 
                        onClick={onClose}
                        className="flex-1 py-4 bg-white border border-gray-200 text-[#011F4B] font-bold text-[10px] uppercase tracking-widest rounded-md hover:bg-gray-50 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                        type="submit" 
                        form="profileForm"
                        className="flex-1 py-4 bg-[#011F4B] text-white font-bold text-[10px] uppercase tracking-widest rounded-md hover:bg-[#022b66] transition-all shadow-xl"
                    >
                        Gravar Alterações
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserProfileModal;
