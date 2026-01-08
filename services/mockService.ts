
import { Coupon, ProductTier, Order, User, MagnetItem, Review, PageContent, FAQ, FAQCategory, LoginTestimonial, LoginTestimonialSettings } from '../types';

// --- INDEXED DB HELPERS (For Infinite Storage) ---
const DB_NAME = 'MagnetoDB';
const STORE_NAME = 'images';

const openDB = (): Promise<IDBDatabase> => {
  if (typeof window === 'undefined' || !window.indexedDB) {
      return Promise.reject("IndexedDB not supported");
  }
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const saveImageToDB = async (id: string, data: string | Blob) => {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(data, id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getImageFromDB = async (id: string): Promise<string | Blob | null> => {
  try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.get(id);
        request.onsuccess = () => {
            resolve(request.result !== undefined ? request.result : null);
        };
        request.onerror = () => reject(request.error);
      });
  } catch (e) {
      console.error("Failed to get from IDB", e);
      return null;
  }
};

export const deleteImageFromDB = async (id: string) => {
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).delete(id);
    } catch (e) { console.error(e); }
};

// --- LOCAL STORAGE PERSISTENCE ---
const persist = (key: string, data: any) => {
    try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) { console.error("LS Error", e); }
};
const retrieve = (key: string, initial: any) => {
    try {
        const s = localStorage.getItem(key);
        return s ? JSON.parse(s) : initial;
    } catch (e) { return initial; }
};

// --- MOCK DATA & SERVICES ---

// Novas Regras de Preço baseadas em Kits (Tiered Pricing)
const INITIAL_TIERS: ProductTier[] = [
  { 
      id: 'tier-1', 
      name: 'Start', 
      photoCount: 9, 
      price: 39.90, 
      isRecommended: false,
      features: ['Impressão Fine Art', 'Laminação Fosca', 'Caixa Standard']
  },
  { 
      id: 'tier-2', 
      name: 'Memories', 
      photoCount: 18, 
      price: 69.90, 
      isRecommended: true,
      features: ['Melhor Custo-Benefício', 'Frete Grátis Sul/Sudeste', 'Embalagem Gift']
  },
  { 
      id: 'tier-3', 
      name: 'Gallery', 
      photoCount: 27, 
      price: 99.90, 
      isRecommended: false,
      features: ['Frete Grátis Brasil', 'Prioridade na Produção', 'Brinde Exclusivo']
  }
];

let CURRENT_TIERS: ProductTier[] = retrieve('magneto_tiers', INITIAL_TIERS);

// Função auxiliar para compatibilidade com o Cart atual (retorna preço unitário equivalente)
export const calculateUnitPrice = (quantity: number): number => {
  // Tenta encontrar o tier exato
  const exactTier = CURRENT_TIERS.find(t => t.photoCount === quantity);
  if (exactTier) {
      return exactTier.price / exactTier.photoCount;
  }
  
  // Se não achar exato (ex: usuário deletou fotos no carrinho), usa o Tier mais próximo abaixo
  // ou um valor base padrão se for muito baixo.
  const sortedTiers = [...CURRENT_TIERS].sort((a, b) => b.photoCount - a.photoCount);
  const closestTier = sortedTiers.find(t => quantity >= t.photoCount);
  
  if (closestTier) {
      return closestTier.price / closestTier.photoCount;
  }
  
  // Fallback: preço do menor tier unitário
  const smallestTier = sortedTiers[sortedTiers.length - 1];
  return smallestTier ? (smallestTier.price / smallestTier.photoCount) * 1.2 : 4.50;
};

// Métodos para gestão de Tiers (Kits)
export const getPricingRules = (): ProductTier[] => { // Mantendo nome 'getPricingRules' para compatibilidade mas retorna Tiers
    return [...CURRENT_TIERS].sort((a, b) => a.photoCount - b.photoCount);
};

export const updatePricingRules = (newTiers: ProductTier[]) => {
    CURRENT_TIERS = newTiers;
    persist('magneto_tiers', CURRENT_TIERS);
};

const INITIAL_COUPONS: Coupon[] = [
  { code: 'MAGNETO10', discountType: 'percent', value: 10, isActive: true, expirationDate: '2025-12-31', onlyFirstPurchase: false },
  { code: 'BEMVINDO', discountType: 'fixed', value: 5.00, isActive: true, expirationDate: null, onlyFirstPurchase: false },
  { code: 'PRIMEIRACOMPRA', discountType: 'percent', value: 10, isActive: true, expirationDate: null, onlyFirstPurchase: true },
  { code: 'EXPIRADO', discountType: 'fixed', value: 20, isActive: true, expirationDate: '2022-01-01', onlyFirstPurchase: false },
];
let VALID_COUPONS: Coupon[] = retrieve('magneto_coupons', INITIAL_COUPONS);

export const validateCoupon = (code: string, userId?: string): Promise<Coupon> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const coupon = VALID_COUPONS.find(c => c.code.toUpperCase() === code.toUpperCase());
      
      if (!coupon) {
        reject(new Error('Cupom inválido'));
        return;
      }

      if (!coupon.isActive) {
        reject(new Error('Este cupom está inativo'));
        return;
      }

      if (coupon.expirationDate) {
        const today = new Date();
        const expDate = new Date(coupon.expirationDate);
        expDate.setHours(23, 59, 59, 999);
        if (today > expDate) {
           reject(new Error('Este cupom expirou'));
           return;
        }
      }

      if (coupon.onlyFirstPurchase) {
          if (!userId) {
              reject(new Error('Faça login para usar este cupom'));
              return;
          }
          const userOrders = ALL_ORDERS.filter(o => o.userId === userId);
          if (userOrders.length > 0) {
              reject(new Error('Cupom válido apenas para a primeira compra'));
              return;
          }
      }

      resolve(coupon);
    }, 600);
  });
};

export const getCoupons = (): Coupon[] => VALID_COUPONS;

export const addCoupon = (coupon: Coupon) => {
  VALID_COUPONS.push(coupon);
  persist('magneto_coupons', VALID_COUPONS);
};

export const updateCoupon = (code: string, updates: Partial<Coupon>) => {
    VALID_COUPONS = VALID_COUPONS.map(c => c.code === code ? { ...c, ...updates } : c);
    persist('magneto_coupons', VALID_COUPONS);
};

export const removeCoupon = (code: string) => {
  VALID_COUPONS = VALID_COUPONS.filter(c => c.code !== code);
  persist('magneto_coupons', VALID_COUPONS);
};

// --- FAQ DATA ---

// FAQ CATEGORIES
const INITIAL_FAQ_CATEGORIES: FAQCategory[] = [
    { id: 'cat-1', name: 'Pedidos & Criação', isActive: true },
    { id: 'cat-2', name: 'Produção & Qualidade', isActive: true },
    { id: 'cat-3', name: 'Envio & Entrega', isActive: true },
    { id: 'cat-4', name: 'Pagamento', isActive: true },
    { id: 'cat-5', name: 'Geral', isActive: true }
];

let SITE_FAQ_CATEGORIES: FAQCategory[] = retrieve('magneto_faq_categories', INITIAL_FAQ_CATEGORIES);

export const getFAQCategories = (): FAQCategory[] => SITE_FAQ_CATEGORIES;

export const addFAQCategory = (category: Omit<FAQCategory, 'id'>) => {
    const newCategory = { ...category, id: `cat-${Date.now()}` };
    SITE_FAQ_CATEGORIES.push(newCategory);
    persist('magneto_faq_categories', SITE_FAQ_CATEGORIES);
};

export const updateFAQCategory = (id: string, updates: Partial<FAQCategory>) => {
    SITE_FAQ_CATEGORIES = SITE_FAQ_CATEGORIES.map(c => c.id === id ? { ...c, ...updates } : c);
    persist('magneto_faq_categories', SITE_FAQ_CATEGORIES);
};

export const removeFAQCategory = (id: string) => {
    SITE_FAQ_CATEGORIES = SITE_FAQ_CATEGORIES.filter(c => c.id !== id);
    persist('magneto_faq_categories', SITE_FAQ_CATEGORIES);
};

// FAQs
const INITIAL_FAQS: FAQ[] = [
    {
        id: 'faq-1',
        category: 'Pedidos & Criação',
        question: 'Como faço para personalizar meus ímãs?',
        answer: "É muito simples! Acesse o nosso Studio clicando em 'Criar ímãs', faça o upload das suas fotos favoritas (do celular ou computador), ajuste o corte e aplique filtros se desejar. Ao finalizar, basta adicionar ao carrinho.",
        isActive: true
    },
    {
        id: 'faq-2',
        category: 'Pedidos & Criação',
        question: 'Posso editar as fotos depois de enviar?',
        answer: "Sim. Dentro do Studio, você pode ajustar o enquadramento (zoom e rotação), brilho, contraste e aplicar filtros exclusivos antes de finalizar a compra.",
        isActive: true
    },
    {
        id: 'faq-3',
        category: 'Pedidos & Criação',
        question: 'Qual o tamanho dos ímãs?',
        answer: "Nossos ímãs padrão possuem o formato quadrado de 50x50mm (5x5cm), ideais para criar mosaicos e galerias.",
        isActive: true
    },
    {
        id: 'faq-4',
        category: 'Produção & Qualidade',
        question: 'Qual o material utilizado?',
        answer: "Utilizamos papel fotográfico Fine Art de alta gramatura, acoplado a uma manta magnética de 0.8mm (alta aderência). O acabamento conta com laminação UV fosca ou brilhante para proteção contra desbotamento.",
        isActive: true
    },
    {
        id: 'faq-5',
        category: 'Produção & Qualidade',
        question: 'As fotos desbotam com o tempo?',
        answer: "Não. Graças à nossa tecnologia de impressão com pigmentos minerais e a camada de proteção UV, garantimos a fidelidade das cores por décadas em ambientes internos.",
        isActive: true
    },
    {
        id: 'faq-6',
        category: 'Produção & Qualidade',
        question: 'Qual o prazo de produção?',
        answer: "Por ser um processo artesanal com acabamento manual, pedimos de 2 a 4 dias úteis para a produção após a confirmação do pagamento.",
        isActive: true
    },
    {
        id: 'faq-7',
        category: 'Envio & Entrega',
        question: 'Vocês entregam em todo o Brasil?',
        answer: "Sim! Enviamos para todo o território nacional via Correios (PAC e Sedex) ou Transportadoras parceiras.",
        isActive: true
    },
    {
        id: 'faq-8',
        category: 'Envio & Entrega',
        question: 'Como rastreio meu pedido?',
        answer: "Assim que seu pedido for despachado, você receberá um código de rastreio por e-mail. Você também pode acompanhar o status em tempo real na área 'Meus Pedidos'.",
        isActive: true
    },
    {
        id: 'faq-9',
        category: 'Envio & Entrega',
        question: 'O que acontece se meu pedido chegar danificado?',
        answer: "Embora nossa embalagem seja reforçada, imprevistos podem ocorrer. Caso receba o produto com avaria, entre em contato conosco em até 7 dias corridos e faremos a reposição sem custo.",
        isActive: true
    },
    {
        id: 'faq-10',
        category: 'Pagamento',
        question: 'Quais são as formas de pagamento?',
        answer: "Aceitamos Cartão de Crédito (em até 3x sem juros), PIX (com aprovação imediata) e Boleto Bancário.",
        isActive: true
    },
    {
        id: 'faq-11',
        category: 'Pagamento',
        question: 'É seguro comprar no site?',
        answer: "Totalmente. Utilizamos criptografia SSL de ponta a ponta e processamos pagamentos através de gateways certificados, garantindo que seus dados nunca sejam expostos.",
        isActive: true
    }
];

let SITE_FAQS: FAQ[] = retrieve('magneto_faqs', INITIAL_FAQS);

export const getFAQs = (): FAQ[] => SITE_FAQS;

export const addFAQ = (faq: Omit<FAQ, 'id'>) => {
    const newFAQ = { ...faq, id: `faq-${Date.now()}` };
    SITE_FAQS.push(newFAQ);
    persist('magneto_faqs', SITE_FAQS);
};

export const updateFAQ = (id: string, updates: Partial<FAQ>) => {
    SITE_FAQS = SITE_FAQS.map(f => f.id === id ? { ...f, ...updates } : f);
    persist('magneto_faqs', SITE_FAQS);
};

export const removeFAQ = (id: string) => {
    SITE_FAQS = SITE_FAQS.filter(f => f.id !== id);
    persist('magneto_faqs', SITE_FAQS);
};

// --- REVIEWS DATA ---
const INITIAL_REVIEWS: Review[] = [
    {
        id: 'rev-1',
        orderId: 'ORD-9824',
        userId: 'usr-2',
        userName: 'Fernanda O.',
        userLocation: 'Rio de Janeiro - RJ',
        userAvatar: '',
        rating: 5,
        text: 'A qualidade da impressão é surpreendente. O acabamento fosco dá um toque muito sofisticado. Chegou antes do prazo!',
        photos: ['https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&w=150&q=80'],
        status: 'approved',
        createdAt: '21/10/2023'
    },
    {
        id: 'rev-2',
        orderId: 'ORD-9112',
        userId: 'usr-5',
        userName: 'Carlos Mendes',
        userLocation: 'São Paulo - SP',
        userAvatar: '',
        rating: 5,
        text: 'Fiz um kit com fotos da minha viagem e ficou incrível na geladeira. A aderência do ímã é muito forte, segura várias folhas.',
        photos: [],
        status: 'approved',
        createdAt: '15/11/2023'
    },
    {
        id: 'rev-3',
        orderId: 'ORD-8821',
        userId: 'usr-6',
        userName: 'Mariana Costa',
        userLocation: 'Belo Horizonte - MG',
        userAvatar: '',
        rating: 4,
        text: 'O produto é lindo, a embalagem é um presente à parte. Só achei que demorou um pouquinho a produção, mas valeu a pena.',
        photos: [],
        status: 'approved',
        createdAt: '02/12/2023'
    },
    {
        id: 'rev-4',
        orderId: 'ORD-7742',
        userId: 'usr-7',
        userName: 'Rafael L.',
        userLocation: 'Curitiba - PR',
        userAvatar: '',
        rating: 5,
        text: 'Perfeito! As cores ficaram idênticas as da tela do celular. Vou encomendar mais para presentear no Natal.',
        photos: ['https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=150&q=80'],
        status: 'approved',
        createdAt: '10/12/2023'
    },
    {
        id: 'rev-5',
        orderId: 'ORD-6541',
        userId: 'usr-8',
        userName: 'Beatriz S.',
        userLocation: 'Porto Alegre - RS',
        userAvatar: '',
        rating: 5,
        text: 'Estou apaixonada! O corte é preciso e o material é bem grosso, não é aquele ímã mole de pizzaria.',
        photos: [],
        status: 'approved',
        createdAt: '05/01/2024'
    }
];
let MOCK_REVIEWS: Review[] = retrieve('magneto_reviews', INITIAL_REVIEWS);

export const getReviews = (status?: 'approved' | 'pending' | 'rejected'): Review[] => {
    if (status) return MOCK_REVIEWS.filter(r => r.status === status);
    return MOCK_REVIEWS;
};

export const submitReview = (review: Omit<Review, 'id' | 'status' | 'createdAt' | 'userLocation'>): Review => {
    const user = MOCK_USERS.find(u => u.id === review.userId);
    const location = user?.address ? `${user.address.city} - ${user.address.state}` : 'Brasil';

    const newReview: Review = {
        ...review,
        id: `rev-${Date.now()}`,
        status: 'pending',
        userLocation: location,
        createdAt: new Date().toLocaleDateString('pt-BR')
    };
    MOCK_REVIEWS.unshift(newReview);
    persist('magneto_reviews', MOCK_REVIEWS);
    
    const orderIndex = ALL_ORDERS.findIndex(o => o.id === review.orderId);
    if (orderIndex >= 0) {
        ALL_ORDERS[orderIndex].reviewId = newReview.id;
        persist('magneto_orders', ALL_ORDERS);
    }
    
    return newReview;
};

export const updateReview = (id: string, updates: Partial<Review>) => {
    MOCK_REVIEWS = MOCK_REVIEWS.map(r => r.id === id ? { ...r, ...updates } : r);
    persist('magneto_reviews', MOCK_REVIEWS);
};

export const deleteReview = (id: string) => {
    MOCK_REVIEWS = MOCK_REVIEWS.filter(r => r.id !== id);
    persist('magneto_reviews', MOCK_REVIEWS);
};

export const moderateReview = (reviewId: string, status: 'approved' | 'rejected' | 'pending', rejectionReason?: string) => {
    const idx = MOCK_REVIEWS.findIndex(r => r.id === reviewId);
    if (idx >= 0) {
        MOCK_REVIEWS[idx].status = status;
        // Atualiza ou limpa o motivo da rejeição
        if (status === 'rejected' && rejectionReason) {
            MOCK_REVIEWS[idx].rejectionReason = rejectionReason;
        } else {
            MOCK_REVIEWS[idx].rejectionReason = undefined;
        }
        persist('magneto_reviews', MOCK_REVIEWS);

        // --- REGRA DE NEGÓCIO: Sincronização Automática ---
        // Se o review deixar de ser "approved", removemos ele da lista de depoimentos do login para manter a consistência
        if (status !== 'approved') {
            const testimonialIndex = LOGIN_TESTIMONIALS.findIndex(t => t.originalReviewId === reviewId);
            if (testimonialIndex >= 0) {
                LOGIN_TESTIMONIALS.splice(testimonialIndex, 1);
                persist('magneto_login_testimonials', LOGIN_TESTIMONIALS);
            }
        }
    }
};

export const getReviewByOrderId = (orderId: string): Review | undefined => {
    return MOCK_REVIEWS.find(r => r.orderId === orderId);
};


// --- AUTH & USER DATA ---

const MOCK_ADDRESS = {
    street: "Av. Paulista",
    number: "1000",
    neighborhood: "Bela Vista",
    city: "São Paulo",
    state: "SP",
    zipCode: "01310-100",
    complement: "Apto 42"
};

const INITIAL_USERS: User[] = [
  { 
      id: 'admin-001', 
      name: 'Administrador', 
      email: 'admin@magneto.com', 
      isAdmin: true, 
      isActive: true, 
      joinedAt: '2023-01-01', 
      phone: '11999999999',
      address: { ...MOCK_ADDRESS }
  },
  { 
      id: 'usr-1', 
      name: 'Cliente Demo', 
      email: 'demo@magneto.com', 
      isAdmin: false, 
      isActive: true, 
      joinedAt: '2023-10-15', 
      phone: '11988888888',
      address: { ...MOCK_ADDRESS, street: 'Rua Augusta', number: '500' }
  },
  { id: 'usr-2', name: 'Fernanda Oliveira', email: 'fernanda@email.com', isAdmin: false, isActive: true, joinedAt: '2023-11-02', phone: '21977777777', address: { ...MOCK_ADDRESS, city: "Rio de Janeiro", state: "RJ" } },
  { id: 'usr-3', name: 'Conta Inativa', email: 'inativo@email.com', isAdmin: false, isActive: false, joinedAt: '2023-05-10', phone: '31966666666' },
  { id: 'usr-5', name: 'Carlos Mendes', email: 'carlos@email.com', isAdmin: false, isActive: true, joinedAt: '2023-11-10', address: { ...MOCK_ADDRESS, city: "São Paulo", state: "SP" } },
  { id: 'usr-6', name: 'Mariana Costa', email: 'mariana@email.com', isAdmin: false, isActive: true, joinedAt: '2023-11-15', address: { ...MOCK_ADDRESS, city: "Belo Horizonte", state: "MG" } },
  { id: 'usr-7', name: 'Rafael L.', email: 'rafael@email.com', isAdmin: false, isActive: true, joinedAt: '2023-11-20', address: { ...MOCK_ADDRESS, city: "Curitiba", state: "PR" } },
  { id: 'usr-8', name: 'Beatriz S.', email: 'beatriz@email.com', isAdmin: false, isActive: true, joinedAt: '2023-12-05', address: { ...MOCK_ADDRESS, city: "Porto Alegre", state: "RS" } }
];
let MOCK_USERS: User[] = retrieve('magneto_users_db', INITIAL_USERS);

const INITIAL_ORDERS: Order[] = [
  { 
      id: 'ORD-9821', 
      userId: 'usr-1', 
      customerName: 'Cliente Demo', 
      status: 'pending', 
      total: 45.90, 
      subtotal: 30.00,
      shippingCost: 15.90,
      discount: 0,
      itemsCount: 12, 
      date: '25/10/2023', 
      items: [],
      shippingAddress: MOCK_ADDRESS,
      createdByAdmin: false
  },
  { 
      id: 'ORD-9824', 
      userId: 'usr-2', 
      customerName: 'Fernanda Oliveira', 
      status: 'delivered', 
      total: 85.00, 
      subtotal: 80.00,
      shippingCost: 15.90,
      discount: 10.90, 
      itemsCount: 25, 
      date: '20/10/2023', 
      items: [],
      shippingAddress: { ...MOCK_ADDRESS, city: "Rio de Janeiro", state: "RJ" },
      reviewId: 'rev-1',
      createdByAdmin: false
  },
];
let ALL_ORDERS: Order[] = retrieve('magneto_orders', INITIAL_ORDERS);

export const loginUser = (email: string, password: string): Promise<User> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (email === 'admin@magneto.com') {
        if (password === 'admin@2023') {
           const admin = MOCK_USERS.find(u => u.email === email);
           if (admin) resolve(admin);
        } else {
            reject(new Error('Senha incorreta para administrador.'));
        }
        return;
      }
      const user = MOCK_USERS.find(u => u.email === email);
      if (!user) { reject(new Error('Este e-mail não está cadastrado.')); return; }
      if (!user.isActive) { reject(new Error('Esta conta foi desativada.')); return; }
      resolve(user);
    }, 800);
  });
};

export const registerUser = (name: string, email: string, password: string): Promise<User> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newUser: User = { 
        id: `usr-${Date.now()}`, 
        name, 
        email, 
        isAdmin: false,
        isActive: true,
        joinedAt: new Date().toLocaleDateString('pt-BR') 
      };
      MOCK_USERS.push(newUser);
      persist('magneto_users_db', MOCK_USERS);
      resolve(newUser);
    }, 800);
  });
};

export const loginWithGoogle = (): Promise<User> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const googleEmail = 'usuario.google@gmail.com';
      const existingUser = MOCK_USERS.find(u => u.email === googleEmail);
      if (existingUser) {
        resolve(existingUser);
      } else {
        const newUser: User = {
           id: `google-${Date.now()}`,
           name: 'Usuário Google',
           email: googleEmail,
           isAdmin: false,
           isActive: true,
           joinedAt: new Date().toLocaleDateString('pt-BR')
        };
        MOCK_USERS.push(newUser);
        persist('magneto_users_db', MOCK_USERS);
        resolve(newUser);
      }
    }, 1500);
  });
};

export const getUsers = (): User[] => MOCK_USERS;

export const addUser = (user: Omit<User, 'id' | 'joinedAt'>): User => {
    const newUser = {
        ...user,
        id: `usr-${Date.now()}`,
        joinedAt: new Date().toLocaleDateString('pt-BR')
    };
    MOCK_USERS.push(newUser);
    persist('magneto_users_db', MOCK_USERS);
    return newUser;
}

export const updateUser = (id: string, data: Partial<User> & { password?: string }) => {
    MOCK_USERS = MOCK_USERS.map(u => u.id === id ? { ...u, ...data } : u);
    persist('magneto_users_db', MOCK_USERS);
};

export const deleteUser = (id: string) => {
    MOCK_USERS = MOCK_USERS.filter(u => u.id !== id);
    persist('magneto_users_db', MOCK_USERS);
};

export const createOrder = (
    user: User, 
    items: MagnetItem[], 
    total: number, 
    shippingData: any, 
    socialSharingConsent?: boolean,
    createdByAdmin?: boolean
): Promise<Order> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const unitPrice = calculateUnitPrice(items.length);
      const subtotal = items.length * unitPrice;
      const shippingCost = (subtotal > 150 || createdByAdmin) ? 0 : 15.90;
      const discount = Math.max(0, (subtotal + shippingCost) - total);

      const newOrder: Order = {
        id: `ORD-${Math.floor(Math.random() * 10000)}`,
        userId: user.id,
        customerName: user.name,
        status: 'pending',
        total: total,
        subtotal: subtotal,
        shippingCost: shippingCost,
        discount: discount,
        itemsCount: items.length,
        date: new Date().toLocaleDateString('pt-BR'),
        items: [...items],
        shippingAddress: {
            street: shippingData.street,
            number: shippingData.number,
            complement: shippingData.complement,
            neighborhood: shippingData.neighborhood,
            city: shippingData.city,
            state: shippingData.state,
            zipCode: shippingData.zipCode
        },
        socialSharingConsent: socialSharingConsent,
        createdByAdmin: createdByAdmin
      };
      ALL_ORDERS.unshift(newOrder);
      persist('magneto_orders', ALL_ORDERS);
      resolve(newOrder);
    }, 1000);
  });
};

export const updateOrderStatus = (orderId: string, newStatus: Order['status']) => {
    const order = ALL_ORDERS.find(o => o.id === orderId);
    if (order) {
        order.status = newStatus;
        persist('magneto_orders', ALL_ORDERS);
    }
};

export const updateOrderDetails = (orderId: string, updates: Partial<Order>) => {
    ALL_ORDERS = ALL_ORDERS.map(o => o.id === orderId ? { ...o, ...updates } : o);
    persist('magneto_orders', ALL_ORDERS);
};

export const softDeleteOrder = (orderId: string) => {
    const order = ALL_ORDERS.find(o => o.id === orderId);
    if (order) {
        order.deleted = true;
        persist('magneto_orders', ALL_ORDERS);
    }
};

export const restoreOrder = (orderId: string) => {
    const order = ALL_ORDERS.find(o => o.id === orderId);
    if (order) {
        order.deleted = false;
        persist('magneto_orders', ALL_ORDERS);
    }
};

export const getUserOrders = (userId: string): Promise<Order[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Retorna apenas pedidos não deletados para o usuário
      resolve(ALL_ORDERS.filter(o => o.userId === userId && !o.deleted));
    }, 500);
  });
};

export const getOrderById = (orderId: string): Order | undefined => {
    return ALL_ORDERS.find(o => o.id === orderId);
}

export const getAdminOrders = (): Order[] => ALL_ORDERS; // Admin vê tudo, filtragem no componente

export const getFinancialStats = () => {
    // Statística ignora pedidos deletados? Geralmente sim para receita
    const activeOrders = ALL_ORDERS.filter(o => !o.deleted);
    const totalRevenue = activeOrders.reduce((acc, curr) => acc + curr.total, 0);
    const totalOrders = activeOrders.length;
    const avgTicket = totalRevenue / totalOrders || 0;
    
    const monthlyRevenue = activeOrders.reduce((acc: any, order) => {
        const month = order.date.split('/')[1];
        const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
        const key = monthNames[parseInt(month) - 1];
        
        if (!acc[key]) acc[key] = 0;
        acc[key] += order.total;
        return acc;
    }, {});

    const monthlyData = Object.entries(monthlyRevenue).map(([month, value]) => ({ month, value: value as number }));
    const sortedMonthly = monthlyData.sort((a,b) => {
         const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
         return monthNames.indexOf(a.month) - monthNames.indexOf(b.month);
    });

    return { totalRevenue, totalOrders, avgTicket, monthlyData: sortedMonthly };
};

// --- CMS SERVICE ---
const INITIAL_CMS_CONTENT: PageContent[] = [
    {
        id: 'home',
        title: 'Home Page',
        sections: [
            {
                id: 'hero',
                title: 'Hero Section',
                fields: [
                    { key: 'headline', label: 'Título Principal', type: 'text', value: 'Suas fotos em memórias táteis.' },
                    { key: 'subheadline', label: 'Subtítulo', type: 'textarea', value: 'A sofisticação dos ímãs premium com acabamento manual.' },
                    { key: 'hero_image', label: 'Imagem de Fundo', type: 'image', value: 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?q=80&w=1200' }
                ]
            }
        ]
    }
];
let SITE_CONTENT = retrieve('magneto_cms', INITIAL_CMS_CONTENT);

export const getSiteContent = (): PageContent[] => SITE_CONTENT;

export const updateSiteContent = (content: PageContent[]) => {
    SITE_CONTENT = content;
    persist('magneto_cms', SITE_CONTENT);
};

// --- LOGIN TESTIMONIALS SERVICE ---

// Dados iniciais para não quebrar o layout (antigo hardcoded no Auth.tsx)
const INITIAL_LOGIN_TESTIMONIALS: LoginTestimonial[] = [
    {
        id: 'lt-1',
        quote: "A qualidade da impressão superou todas as minhas expectativas. É arte pura na minha geladeira.",
        author: "Sofia M.",
        role: "Arquiteta • SP",
        bgImage: "https://images.unsplash.com/photo-1493863641943-9b68992a8d07?q=80&w=1200&auto=format&fit=crop",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80",
        rating: 5,
        isActive: true,
        source: 'manual',
        createdAt: '2023-10-01'
    },
    {
        id: 'lt-2',
        quote: "Transformou as fotos da nossa viagem de lua de mel em uma galeria diária. O acabamento fosco é incrível.",
        author: "Lucas & Bia",
        role: "Recém-casados • RJ",
        bgImage: "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?q=80&w=1200&auto=format&fit=crop",
        avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=100&q=80",
        rating: 5,
        isActive: true,
        source: 'manual',
        createdAt: '2023-10-05'
    },
    {
        id: 'lt-3',
        quote: "A melhor forma de ver meu filho crescer todos os dias enquanto preparo o café. Embalagem impecável.",
        author: "Mariana T.",
        role: "Mãe & Designer • MG",
        bgImage: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?q=80&w=1200&auto=format&fit=crop",
        avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80",
        rating: 5,
        isActive: true,
        source: 'manual',
        createdAt: '2023-10-10'
    }
];

const INITIAL_LOGIN_SETTINGS: LoginTestimonialSettings = {
    displayMode: 'random',
    maxItems: 5
};

let LOGIN_TESTIMONIALS: LoginTestimonial[] = retrieve('magneto_login_testimonials', INITIAL_LOGIN_TESTIMONIALS);
let LOGIN_SETTINGS: LoginTestimonialSettings = retrieve('magneto_login_settings', INITIAL_LOGIN_SETTINGS);

export const getLoginTestimonials = (): LoginTestimonial[] => LOGIN_TESTIMONIALS;

export const getLoginTestimonialConfig = (): LoginTestimonialSettings => LOGIN_SETTINGS;

export const addLoginTestimonial = (testimonial: Omit<LoginTestimonial, 'id' | 'createdAt'>) => {
    // --- REGRA DE NEGÓCIO: Integridade de Importação ---
    // Apenas reviews com status 'approved' podem ser importados.
    if (testimonial.source === 'review' && testimonial.originalReviewId) {
        const originalReview = MOCK_REVIEWS.find(r => r.id === testimonial.originalReviewId);
        if (!originalReview || originalReview.status !== 'approved') {
            console.error("Tentativa de importar review não aprovado bloqueada.");
            return; // Bloqueia a criação silenciosamente
        }
    }

    const newItem: LoginTestimonial = {
        ...testimonial,
        id: `lt-${Date.now()}`,
        createdAt: new Date().toLocaleDateString('pt-BR')
    };
    LOGIN_TESTIMONIALS.unshift(newItem);
    persist('magneto_login_testimonials', LOGIN_TESTIMONIALS);
};

export const updateLoginTestimonial = (id: string, updates: Partial<LoginTestimonial>) => {
    LOGIN_TESTIMONIALS = LOGIN_TESTIMONIALS.map(t => t.id === id ? { ...t, ...updates } : t);
    persist('magneto_login_testimonials', LOGIN_TESTIMONIALS);
};

// Reordena e persiste a nova ordem
export const reorderLoginTestimonials = (newOrder: LoginTestimonial[]) => {
    LOGIN_TESTIMONIALS = newOrder;
    persist('magneto_login_testimonials', LOGIN_TESTIMONIALS);
};

export const deleteLoginTestimonial = (id: string) => {
    LOGIN_TESTIMONIALS = LOGIN_TESTIMONIALS.filter(t => t.id !== id);
    persist('magneto_login_testimonials', LOGIN_TESTIMONIALS);
};

export const updateLoginTestimonialSettings = (settings: Partial<LoginTestimonialSettings>) => {
    LOGIN_SETTINGS = { ...LOGIN_SETTINGS, ...settings };
    persist('magneto_login_settings', LOGIN_SETTINGS);
};

// --- DASHBOARD CHARTS ---
export const getDashboardChartData = (period: '7d' | '30d' | '12m') => {
    const data = [];
    const now = new Date();
    const count = period === '7d' ? 7 : period === '30d' ? 30 : 12;
    
    for (let i = 0; i < count; i++) {
        const date = new Date();
        if (period === '12m') {
            date.setMonth(now.getMonth() - (count - 1 - i));
            data.push({
                date: date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
                value: Math.random() * 5000 + 1000,
                count: Math.floor(Math.random() * 50) + 10
            });
        } else {
            date.setDate(now.getDate() - (count - 1 - i));
            data.push({
                date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                value: Math.random() * 1000 + 100,
                count: Math.floor(Math.random() * 10) + 1
            });
        }
    }
    return data;
};
