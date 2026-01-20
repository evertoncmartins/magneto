
import React, { useEffect, useState } from 'react';
import { X, Package, Calendar, Clock, CheckCircle, Truck, Box, Shield } from 'lucide-react';
import { User, Order } from '../../../types';
import { getUserOrders } from '../../../services/mockService';

interface AdminUserHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
    onSelectOrder: (orderId: string) => void;
}

const AdminUserHistoryModal: React.FC<AdminUserHistoryModalProps> = ({ isOpen, onClose, user, onSelectOrder }) => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && user) {
            setLoading(true);
            getUserOrders(user.id).then(data => {
                setOrders([...data].reverse());
                setLoading(false);
            });
        }
    }, [isOpen, user]);

    if (!isOpen || !user) return null;

    const getStatusInfo = (status: string) => {
        switch(status) {
            case 'pending': return { label: 'Pendente', bg: 'bg-[#FEF9E7]', text: 'text-[#B8860B]', icon: Clock };
            case 'production': return { label: 'Produção', bg: 'bg-blue-50', text: 'text-blue-600', icon: Box };
            case 'shipped': return { label: 'Enviado', bg: 'bg-purple-50', text: 'text-purple-600', icon: Truck };
            case 'delivered': return { label: 'Entregue', bg: 'bg-emerald-50', text: 'text-emerald-600', icon: CheckCircle };
            default: return { label: status, bg: 'bg-gray-50', text: 'text-gray-600', icon: Package };
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#011F4B]/30 backdrop-blur-sm" onClick={onClose}></div>
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl relative overflow-hidden flex flex-col max-h-[85vh] animate-fade-in border border-gray-100">
                {/* Header conforme imagem */}
                <div className="px-8 py-7 border-b border-gray-50 flex justify-between items-start bg-white sticky top-0 z-10">
                    <div>
                        <h3 className="font-serif font-bold text-2xl text-[#1d1d1f] tracking-tight">Histórico de Pedidos</h3>
                        <p className="text-[11px] font-bold text-[#86868b] uppercase tracking-[0.2em] mt-1.5">{user.name}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors -mt-1"><X size={26} className="text-gray-400" /></button>
                </div>

                <div className="p-8 overflow-y-auto bg-[#F9F9FA] flex-1 custom-scrollbar">
                    {loading ? (
                        <div className="text-center py-12 text-gray-400 text-[10px] uppercase tracking-widest font-bold">Carregando dados...</div>
                    ) : orders.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-200 shadow-sm">
                                <Package size={28} />
                            </div>
                            <p className="text-gray-400 text-sm font-light">Nenhum pedido encontrado para este cliente.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {orders.map(order => {
                                const status = getStatusInfo(order.status);
                                return (
                                    <button 
                                        key={order.id} 
                                        onClick={() => onSelectOrder(order.id)}
                                        className="w-full text-left bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-5 hover:shadow-xl hover:-translate-y-0.5 transition-all group active:scale-[0.98]"
                                    >
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${status.bg} ${status.text} shadow-inner shrink-0`}>
                                                    <status.icon size={20} strokeWidth={2.5} />
                                                </div>
                                                <div>
                                                    <span className="block text-sm font-bold text-[#1d1d1f] group-hover:text-[#B8860B] transition-colors mb-1">
                                                        Pedido #{order.id}
                                                    </span>
                                                    
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                                                            <Calendar size={12} className="text-gray-300"/> {order.date}
                                                        </span>
                                                        {order.createdByAdmin && (
                                                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 text-[8px] font-bold uppercase tracking-widest border border-indigo-100">
                                                                <Shield size={9} /> Via Admin
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <span className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-[0.15em] ${status.bg} ${status.text} border border-transparent group-hover:border-current transition-all shrink-0 ml-2`}>
                                                {status.label}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-end pt-5 border-t border-gray-50">
                                            <span className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">{order.itemsCount} itens</span>
                                            <span className="text-lg font-serif font-bold text-[#B8860B]">R$ {order.total.toFixed(2)}</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminUserHistoryModal;
