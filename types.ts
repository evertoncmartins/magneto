
export interface ImageAdjustments {
  brightness: number; // 0-200, default 100
  contrast: number;   // 0-200, default 100
  saturation: number; // 0-200, default 100
  warmth: number;     // 0-200, default 100
  exposure: number;   // 0-200, default 100
  vibrance: number;   // 0-200, default 100
  gamma: number;      // 0-200, default 100
  enhance: number;    // 0-100, default 0
}

export interface MagnetItem {
  id: string;
  kitId?: string; // Novo campo para agrupar itens do mesmo kit
  originalUrl: string;
  backupSrc?: string; // Backup Base64 caso o blob original seja perdido (Mobile fix)
  croppedUrl: string; // Versão otimizada para display (leve)
  highResUrl?: string; // Versão alta resolução para impressão (300dpi)
  filter?: string; // Nome do filtro aplicado
  cropData?: {
    x: number;
    y: number;
    zoom: number;
    rotation?: number;
  };
  adjustments?: ImageAdjustments;
  socialConsent?: boolean;
}

export interface Coupon {
  code: string;
  discountType: 'percent' | 'fixed';
  value: number;
  isActive: boolean;
  expirationDate?: string | null; 
  onlyFirstPurchase?: boolean;
}

export interface FAQCategory {
  id: string;
  name: string;
  isActive: boolean;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string; // Alterado de union type estrito para string para permitir dinamismo
  isActive: boolean;
}

export interface Address {
  id?: string; // ID opcional para gerenciar múltiplos endereços
  nickname?: string; // Ex: Casa, Trabalho, Praia
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  isDefault?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  isAdmin?: boolean;
  isActive: boolean;
  joinedAt?: string;
  phone?: string;
  address?: Address; // Endereço ativo/selecionado
  savedAddresses?: Address[]; // Lista de endereços salvos
}

export interface Review {
  id: string;
  orderId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  userLocation?: string;
  rating: number;
  text: string;
  photos: string[];
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  createdAt: string;
}

export interface Order {
  id: string;
  userId?: string;
  customerName: string;
  status: 'pending' | 'production' | 'shipped' | 'delivered' | 'cancelled';
  total: number;
  subtotal?: number;
  shippingCost?: number;
  discount?: number;
  itemsCount: number;
  date: string;
  items?: MagnetItem[];
  shippingAddress?: Address;
  reviewId?: string;
  socialSharingConsent?: boolean;
  createdByAdmin?: boolean;
  deleted?: boolean; // Flag para exclusão lógica
  cancellationReason?: string; // Motivo do cancelamento
}

// Substituindo PricingRule por ProductTier para estratégia de Kits
export interface ProductTier {
  id: string;
  name: string; // ex: "Kit Essencial", "Kit Pro"
  photoCount: number; // Quantidade de fotos (ex: 9, 12, 18)
  price: number; // Preço total do kit
  isRecommended?: boolean; // Flag para destaque visual
  features?: string[]; // Benefícios (ex: "Frete Grátis", "Embalagem Gift")
  description?: string;
}

export type PageView = 'home' | 'cart' | 'admin' | 'checkout-success' | 'login' | 'register' | 'my-orders';

// CMS Types
export interface PageField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'image' | 'boolean' | 'number';
  value: string;
}

export interface PageSection {
  id: string;
  title: string;
  fields: PageField[];
}

export interface PageContent {
  id: string;
  title: string;
  sections: PageSection[];
}

// --- LOGIN TESTIMONIALS ---
export interface LoginTestimonial {
  id: string;
  quote: string;
  author: string;
  role: string; // Ex: "Arquiteta • SP"
  avatar: string;
  bgImage: string;
  rating: number; // 1-5
  isActive: boolean;
  source: 'manual' | 'review'; // Se veio de input manual ou importado de review
  originalReviewId?: string; // Link se veio de review
  isEdited?: boolean; // Flag para indicar se uma importação foi alterada
  createdAt: string;
}

export interface LoginTestimonialSettings {
  displayMode: 'random' | 'sequential';
  maxItems: number;
}
