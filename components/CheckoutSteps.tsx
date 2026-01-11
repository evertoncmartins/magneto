
import React from 'react';
import { ShoppingBag, MapPin, CreditCard, Check } from 'lucide-react';

interface CheckoutStepsProps {
    currentStep: 1 | 2 | 3; // 1: Sacola (Opcional, geralmente pulado direto para entrega se já tem itens), 2: Entrega, 3: Pagamento/Resumo
}

const CheckoutSteps: React.FC<CheckoutStepsProps> = ({ currentStep }) => {
    const steps = [
        { id: 1, label: 'Sacola', icon: ShoppingBag },
        { id: 2, label: 'Entrega', icon: MapPin },
        { id: 3, label: 'Pagamento', icon: CreditCard },
    ];

    return (
        <div className="w-full max-w-3xl mx-auto mb-10 px-4">
            <div className="relative flex justify-between items-center">
                {/* Linha de Conexão (Background) */}
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 -z-10 -translate-y-1/2 rounded-full"></div>
                
                {/* Linha de Progresso (Ativa) */}
                <div 
                    className="absolute top-1/2 left-0 h-0.5 bg-[#B8860B] -z-10 -translate-y-1/2 rounded-full transition-all duration-500 ease-in-out"
                    style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                ></div>

                {steps.map((step) => {
                    const isActive = currentStep >= step.id;
                    const isCompleted = currentStep > step.id;

                    return (
                        <div key={step.id} className="flex flex-col items-center gap-2 bg-[#F5F5F7] px-2">
                            <div 
                                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 z-10 
                                    ${isActive 
                                        ? 'bg-[#1d1d1f] border-[#1d1d1f] text-white shadow-lg scale-110' 
                                        : 'bg-white border-gray-300 text-gray-300'
                                    }
                                    ${isCompleted ? 'bg-[#B8860B] border-[#B8860B]' : ''}
                                `}
                            >
                                {isCompleted ? <Check size={18} /> : <step.icon size={18} />}
                            </div>
                            <span className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${isActive ? 'text-[#1d1d1f]' : 'text-gray-400'}`}>
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default CheckoutSteps;
