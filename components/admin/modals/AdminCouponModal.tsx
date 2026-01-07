
import React, { useState, useEffect } from 'react';
import { X, Ticket, ToggleLeft, ToggleRight } from 'lucide-react';
import { addCoupon, updateCoupon, removeCoupon } from '../../../services/mockService';
import { Coupon } from '../../../types';

interface AdminCouponModalProps {
    isOpen: boolean;
    onClose: () => void;
    refreshData: () => void;
    editingCoupon?: Coupon | null;
}

const AdminCouponModal: React.FC<AdminCouponModalProps> = ({ isOpen, onClose, refreshData, editingCoupon }) => {
    const [couponFormData, setCouponFormData] = useState({
        code: '', 
        value: '', 
        type: 'percent' as 'percent' | 'fixed', 
        date: '', 
        isActive: true, 
        firstOnly: false, 
        isEternal: true
    });

    // Popula o formulário quando o editingCoupon muda ou o modal abre
    useEffect(() => {
        if (isOpen) {
            if (editingCoupon) {
                setCouponFormData({
                    code: editingCoupon.code,
                    value: editingCoupon.value.toString(),
                    type: editingCoupon.discountType,
                    date: editingCoupon.expirationDate || '',
                    isActive: editingCoupon.isActive,
                    firstOnly: !!editingCoupon.onlyFirstPurchase,
                    isEternal: !editingCoupon.expirationDate
                });
            } else {
                // Reset para criação
                setCouponFormData({
                    code: '', 
                    value: '', 
                    type: 'percent', 
                    date: '', 
                    isActive: true, 
                    firstOnly: false, 
                    isEternal: true
                });
            }
        }
    }, [isOpen, editingCoupon]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const newCouponData: Coupon = { 
            code: couponFormData.code.toUpperCase(), 
            discountType: couponFormData.type, 
            value: parseFloat(couponFormData.value), 
            isActive: couponFormData.isActive, 
            expirationDate: couponFormData.isEternal ? null : couponFormData.date, 
            onlyFirstPurchase: couponFormData.firstOnly 
        };

        if (editingCoupon) {
            // Se o código mudou, precisamos remover o antigo e adicionar o novo (simulando update de PK)
            if (editingCoupon.code !== newCouponData.code) {
                removeCoupon(editingCoupon.code);
                addCoupon(newCouponData);
            } else {
                updateCoupon(editingCoupon.code, newCouponData);
            }
        } else {
            addCoupon(newCouponData);
        }

        refreshData(); 
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#011F4B]/30 backdrop-blur-sm" onClick={onClose}></div>
            <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl relative overflow-hidden flex flex-col animate-fade-in border border-gray-100">
                <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                    <div>
                        <h3 className="font-serif font-bold text-2xl">{editingCoupon ? 'Editar Campanha' : 'Lançar Campanha'}</h3>
                        <p className="text-[10px] font-bold text-[#86868b] uppercase tracking-widest mt-1">Configuração de Desconto</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={24} /></button>
                </div>
                <div className="p-8 overflow-y-auto">
                    <form id="couponForm" onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-[#86868b] uppercase px-1">Código Promocional</label>
                            <div className="relative">
                                <Ticket size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"/>
                                <input 
                                  required 
                                  value={couponFormData.code} 
                                  onChange={e => setCouponFormData({...couponFormData, code: e.target.value.toUpperCase()})} 
                                  placeholder="EX: VERAO2025" 
                                  className="w-full px-4 py-3 pl-12 bg-[#F5F5F7] rounded-lg text-sm font-serif font-bold tracking-widest outline-none focus:bg-white focus:border-[#B8860B] border border-transparent transition-all uppercase" 
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-[#86868b] uppercase px-1">Valor do Desconto</label>
                                <input required type="number" value={couponFormData.value} onChange={e => setCouponFormData({...couponFormData, value: e.target.value})} className="w-full px-4 py-3 bg-[#F5F5F7] rounded-lg text-sm outline-none border border-transparent focus:bg-white focus:border-[#B8860B] transition-all" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-[#86868b] uppercase px-1">Tipo</label>
                                <select value={couponFormData.type} onChange={e => setCouponFormData({...couponFormData, type: e.target.value as any})} className="w-full px-4 py-3 bg-[#F5F5F7] rounded-lg text-sm outline-none border border-transparent focus:bg-white focus:border-[#B8860B] transition-all">
                                    <option value="percent">PORCENTAGEM (%)</option>
                                    <option value="fixed">VALOR FIXO (R$)</option>
                                </select>
                            </div>
                        </div>
                        <div className="space-y-4 pt-4">
                              <div onClick={() => setCouponFormData({...couponFormData, isEternal: !couponFormData.isEternal})} className={`cursor-pointer p-4 rounded-lg border transition-all flex items-center justify-between ${couponFormData.isEternal ? 'bg-[#1d1d1f] text-white border-[#1d1d1f] shadow-md' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                                  <span className="text-[10px] font-bold uppercase tracking-widest">Cupom Eterno (Sem Validade)</span>
                                  {couponFormData.isEternal ? <ToggleRight size={22} className="text-[#B8860B]"/> : <ToggleLeft size={22} className="text-gray-300"/>}
                              </div>
                              {!couponFormData.isEternal && (
                                  <div className="space-y-1.5 animate-fade-in pl-2 border-l-2 border-[#B8860B]">
                                      <label className="text-[10px] font-bold text-[#86868b] uppercase px-1">Data de Expiração</label>
                                      <input type="date" value={couponFormData.date} onChange={e => setCouponFormData({...couponFormData, date: e.target.value})} className="w-full px-4 py-3 bg-[#F5F5F7] rounded-lg text-sm outline-none border border-transparent" />
                                  </div>
                              )}
                              <div onClick={() => setCouponFormData({...couponFormData, firstOnly: !couponFormData.firstOnly})} className={`cursor-pointer p-4 rounded-lg border transition-all flex items-center justify-between ${couponFormData.firstOnly ? 'bg-purple-600 text-white border-purple-600 shadow-md' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                                  <span className="text-[10px] font-bold uppercase tracking-widest">Apenas 1ª Compra</span>
                                  {couponFormData.firstOnly ? <ToggleRight size={22}/> : <ToggleLeft size={22} className="text-gray-300"/>}
                              </div>
                        </div>
                    </form>
                </div>
                <div className="p-6 border-t border-gray-100 bg-white flex gap-4">
                    <button onClick={onClose} className="flex-1 py-4 bg-gray-50 text-[#1d1d1f] font-bold text-[10px] uppercase tracking-widest rounded-lg hover:bg-gray-100 transition-all">Cancelar</button>
                    <button type="submit" form="couponForm" className="flex-1 py-4 bg-[#1d1d1f] text-white font-bold text-[10px] uppercase tracking-widest rounded-lg hover:bg-black transition-all shadow-xl">
                        {editingCoupon ? 'Atualizar Cupom' : 'Criar Cupom'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminCouponModal;
