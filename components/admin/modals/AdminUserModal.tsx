
import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { User, Address } from '../../../types';
import { addUser, updateUser } from '../../../services/mockService';

interface AdminUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    editingUser: User | null;
    refreshData: () => void;
}

const AdminUserModal: React.FC<AdminUserModalProps> = ({ isOpen, onClose, editingUser, refreshData }) => {
    const [isFetchingCep, setIsFetchingCep] = useState(false);
    const [userFormData, setUserFormData] = useState({ 
        name: '', email: '', isAdmin: false, isActive: true, phone: '', password: '',
        street: '', number: '', complement: '', neighborhood: '', city: '', state: '', zipCode: ''
    });

    useEffect(() => {
        if (isOpen) {
            if (editingUser) {
                setUserFormData({ 
                    name: editingUser.name, 
                    email: editingUser.email, 
                    isAdmin: !!editingUser.isAdmin, 
                    isActive: editingUser.isActive ?? true, 
                    phone: editingUser.phone || '', 
                    password: '', 
                    street: editingUser.address?.street || '', 
                    number: editingUser.address?.number || '', 
                    complement: editingUser.address?.complement || '', 
                    neighborhood: editingUser.address?.neighborhood || '', 
                    city: editingUser.address?.city || '', 
                    state: editingUser.address?.state || '', 
                    zipCode: editingUser.address?.zipCode || ''
                });
            } else {
                setUserFormData({ name: '', email: '', isAdmin: false, isActive: true, phone: '', password: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '', zipCode: '' });
            }
        }
    }, [isOpen, editingUser]);

    const handleCepLookup = async (cep: string) => {
        const cleanCep = cep.replace(/\D/g, '');
        setUserFormData(prev => ({ ...prev, zipCode: cleanCep }));
  
        if (cleanCep.length === 8) {
            setIsFetchingCep(true);
            try {
                const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
                const data = await response.json();
                if (!data.erro) {
                    setUserFormData(prev => ({
                        ...prev,
                        street: data.logradouro || prev.street,
                        neighborhood: data.bairro || prev.neighborhood,
                        city: data.localidade || prev.city,
                        state: data.uf || prev.state
                    }));
                }
            } catch (e) { console.error("Erro CEP", e); }
            finally { setIsFetchingCep(false); }
        }
    };

    const handleSaveUser = (e: React.FormEvent) => {
        e.preventDefault();
        const address: Address = { street: userFormData.street, number: userFormData.number, complement: userFormData.complement, neighborhood: userFormData.neighborhood, city: userFormData.city, state: userFormData.state, zipCode: userFormData.zipCode };
        const payload: any = { name: userFormData.name, email: userFormData.email, isAdmin: userFormData.isAdmin, isActive: userFormData.isActive, phone: userFormData.phone, address };
        if (userFormData.password) payload.password = userFormData.password;
        
        if (editingUser) updateUser(editingUser.id, payload); else addUser(payload);
        refreshData();
        onClose();
    };

    const toggleField = (field: 'isAdmin' | 'isActive') => {
        setUserFormData(prev => ({ ...prev, [field]: !prev[field] }));
    };

    if (!isOpen) return null;

    // Inputs com 16px para evitar zoom no iOS, altura 56px (h-14) para touch
    const inputClasses = "w-full h-14 px-5 bg-[#F5F5F7] rounded-xl text-base text-[#1d1d1f] outline-none focus:bg-white focus:ring-2 focus:ring-[#B8860B]/10 border border-transparent transition-all placeholder:text-gray-400";
    const labelClasses = "text-[10px] font-bold text-[#86868b] uppercase tracking-[0.15em] ml-1 mb-2 block";

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-[#1d1d1f]/40 backdrop-blur-md" onClick={onClose}></div>
            
            {/* Modal Container - Max Height ajustado para mobile */}
            <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh] animate-fade-in border border-gray-100">
                
                {/* Header Fixo */}
                <div className="px-8 pt-8 pb-6 flex justify-between items-start bg-white z-10 border-b border-gray-50">
                    <div>
                        <h3 className="font-serif font-bold text-2xl md:text-3xl text-[#1d1d1f] tracking-tight">{editingUser ? 'Editar Cliente' : 'Novo Cliente'}</h3>
                        <p className="text-[10px] font-bold text-[#86868b] uppercase tracking-[0.2em] mt-2">Dados & Acesso</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors -mr-2">
                        <X size={24} className="text-[#1d1d1f]" />
                    </button>
                </div>

                {/* Body com Scroll */}
                <div className="px-6 md:px-8 pb-4 overflow-y-auto custom-scrollbar flex-1 bg-white">
                    <form id="userForm" onSubmit={handleSaveUser} className="space-y-6 pt-6 pb-2">
                        
                        <div className="space-y-2">
                            <label className={labelClasses}>Nome</label>
                            <input required value={userFormData.name} onChange={e => setUserFormData(prev => ({...prev, name: e.target.value}))} className={inputClasses} placeholder="Nome Completo" />
                        </div>

                        <div className="space-y-2">
                            <label className={labelClasses}>E-mail</label>
                            <input type="email" required value={userFormData.email} onChange={e => setUserFormData(prev => ({...prev, email: e.target.value}))} className={inputClasses} placeholder="admin@magneto.com" />
                        </div>

                        <div className="space-y-2">
                            <label className={labelClasses}>Telefone</label>
                            <input type="tel" value={userFormData.phone} onChange={e => setUserFormData(prev => ({...prev, phone: e.target.value}))} className={inputClasses} placeholder="11999999999" />
                        </div>

                        <div className="space-y-2">
                            <label className={labelClasses}>Senha</label>
                            <input type="password" value={userFormData.password} onChange={e => setUserFormData(prev => ({...prev, password: e.target.value}))} placeholder="••••••••" className={inputClasses} />
                        </div>
                        
                        {/* Seção de Endereço */}
                        <div className="pt-4 border-t border-gray-50">
                            <h4 className="text-[11px] font-bold text-[#B8860B] uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                                Endereço
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="relative">
                                    <input value={userFormData.zipCode} onChange={e => handleCepLookup(e.target.value)} placeholder="01310-100" className={inputClasses} maxLength={9} />
                                    {isFetchingCep && <Loader2 size={18} className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-[#B8860B]" />}
                                </div>
                                <input value={userFormData.street} onChange={e => setUserFormData(prev => ({...prev, street: e.target.value}))} placeholder="Av. Paulista" className={inputClasses} />
                                
                                <input value={userFormData.number} onChange={e => setUserFormData(prev => ({...prev, number: e.target.value}))} placeholder="Número" className={inputClasses} />
                                <input value={userFormData.neighborhood} onChange={e => setUserFormData(prev => ({...prev, neighborhood: e.target.value}))} placeholder="Bairro" className={inputClasses} />
                                
                                <input value={userFormData.city} onChange={e => setUserFormData(prev => ({...prev, city: e.target.value}))} placeholder="Cidade" className={inputClasses} />
                                <input value={userFormData.state} onChange={e => setUserFormData(prev => ({...prev, state: e.target.value}))} placeholder="UF" maxLength={2} className={`${inputClasses} text-center uppercase`} />
                            </div>
                        </div>

                        {/* Status / Admin Toggles */}
                        <div className="flex gap-4 pt-2">
                             <button 
                                type="button" 
                                onClick={() => toggleField('isActive')}
                                className={`flex-1 h-14 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${userFormData.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}
                             >
                                  Status: {userFormData.isActive ? 'Ativo' : 'Inativo'}
                             </button>
                             <button 
                                type="button" 
                                onClick={() => toggleField('isAdmin')}
                                className={`flex-1 h-14 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${userFormData.isAdmin ? 'bg-[#1d1d1f] text-white border-[#1d1d1f]' : 'bg-white text-gray-400 border-gray-100'}`}
                             >
                                  Admin: {userFormData.isAdmin ? 'Sim' : 'Não'}
                             </button>
                        </div>
                    </form>
                </div>
                
                {/* Footer Buttons Fixos - Padding reduzido e layout lado a lado */}
                <div className="p-6 md:p-8 border-t border-gray-100 bg-white flex flex-row gap-4 sticky bottom-0 z-20">
                    <button 
                        onClick={onClose} 
                        className="flex-1 h-14 bg-gray-100 text-[#1d1d1f] font-bold text-sm uppercase tracking-[0.2em] rounded-xl hover:bg-gray-200 transition-all active:scale-[0.98]"
                    >
                        Cancelar
                    </button>
                    <button 
                        type="submit" 
                        form="userForm" 
                        className="flex-1 h-14 bg-[#1d1d1f] text-white font-bold text-sm uppercase tracking-[0.2em] rounded-xl hover:bg-black transition-all shadow-xl active:scale-[0.98]"
                    >
                        Salvar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminUserModal;
