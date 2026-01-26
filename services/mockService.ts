
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
    try { 
        localStorage.setItem(key, JSON.stringify(data)); 
    } catch (e: any) { 
        console.error("LS Error", e);
        if (e.name === 'QuotaExceededError' || e.code === 22) {
            alert("AVISO: O armazenamento local está cheio. Suas últimas alterações não puderam ser salvas. Tente usar imagens menores ou limpe dados antigos.");
        }
    }
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
      photoCount: 3, 
      price: 49.99, 
      isRecommended: false,
      features: ['Impressão Fine Art', 'Laminação Fosca', 'Caixa Standard']
  },
  { 
      id: 'tier-2', 
      name: 'Memories', 
      photoCount: 6, 
      price: 69.99, 
      isRecommended: true,
      features: ['Melhor Custo-Benefício', 'Frete Grátis Sul/Sudeste', 'Embalagem Gift']
  },
  { 
      id: 'tier-3', 
      name: 'Gallery', 
      photoCount: 9, 
      price: 89.99, 
      isRecommended: false,
      features: ['Frete Grátis Brasil', 'Prioridade na Produção', 'Brinde Exclusivo']
  }
];

// Atualizado para v2 para forçar reset dos dados antigos no localStorage do usuário
let CURRENT_TIERS: ProductTier[] = retrieve('magneto_tiers_v2', INITIAL_TIERS);

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
  return smallestTier ? (smallestTier.price / smallestTier.photoCount) * 1.2 : 15.00;
};

// Métodos para gestão de Tiers (Kits)
export const getPricingRules = (): ProductTier[] => { // Mantendo nome 'getPricingRules' para compatibilidade mas retorna Tiers
    return [...CURRENT_TIERS].sort((a, b) => a.photoCount - b.photoCount);
};

export const updatePricingRules = (newTiers: ProductTier[]) => {
    CURRENT_TIERS = newTiers;
    persist('magneto_tiers_v2', CURRENT_TIERS);
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
      couponCode: 'MAGNETO10',
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
    createdByAdmin?: boolean,
    couponCode?: string // Novo parâmetro
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
        couponCode: couponCode, // Salva o cupom
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
    },
    {
        id: 'stats',
        title: 'Estatísticas (Home)',
        sections: [
            {
                id: 'config',
                title: 'Configuração Geral',
                fields: [
                    // Master Switch
                    { key: 'section_visible', label: 'Exibir Seção no Site', type: 'boolean', value: 'true' },
                    
                    // General Config
                    { key: 'use_real_data', label: 'Somar Dados Reais?', type: 'boolean', value: 'true' },
                    
                    // Years of Experience
                    { key: 'show_years', label: 'Exibir Anos de Experiência', type: 'boolean', value: 'true' },
                    { key: 'years_count', label: 'Anos de Experiência', type: 'number', value: '13' },

                    // Orders
                    { key: 'show_orders', label: 'Exibir Pedidos', type: 'boolean', value: 'true' },
                    { key: 'manual_orders', label: 'Pedidos (Base Manual)', type: 'number', value: '70000' },

                    // Magnets
                    { key: 'show_magnets', label: 'Exibir Ímãs', type: 'boolean', value: 'true' },
                    { key: 'manual_magnets', label: 'Ímãs (Base Manual)', type: 'number', value: '800000' },

                    // Reviews
                    { key: 'show_reviews', label: 'Exibir Reviews', type: 'boolean', value: 'true' },
                    { key: 'manual_reviews', label: 'Reviews 5 Estrelas (Base Manual)', type: 'number', value: '5000' },

                    // Reordering Config
                    { key: 'stats_order', label: 'Ordem de Exibição', type: 'text', value: 'orders,magnets,reviews' } 
                ]
            }
        ]
    },
    {
        id: 'history',
        title: 'Nossa História',
        sections: [
            {
                id: 'header',
                title: 'Cabeçalho',
                fields: [
                    { key: 'title', label: 'Título Principal', type: 'text', value: 'Nossa História' },
                    { key: 'subtitle', label: 'Subtítulo', type: 'text', value: 'Desde 2023' },
                    { key: 'bg_image', label: 'Imagem de Fundo', type: 'image', value: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=1600&auto=format&fit=crop' }
                ]
            },
            {
                id: 'section_1',
                title: 'Seção: O Começo',
                fields: [
                    { key: 'title', label: 'Título', type: 'text', value: 'O Começo de Tudo' },
                    { key: 'content', label: 'Conteúdo', type: 'textarea', value: 'A Magneto nasceu de uma necessidade simples, porém profunda: a vontade de tirar as memórias das telas frias dos celulares e trazê-las de volta para o cotidiano tátil.\n\nEm um mundo onde tiramos milhares de fotos que raramente revemos, acreditamos que imprimir é o ato final de carinho com um momento vivido. Começamos em um pequeno estúdio, testando papéis, ímãs e acabamentos até chegar na fórmula perfeita que une durabilidade e estética.' },
                    { key: 'image', label: 'Imagem Lateral', type: 'image', value: 'https://images.unsplash.com/photo-1520333789090-1afc82db536a?q=80&w=1000&auto=format&fit=crop' }
                ]
            },
            {
                id: 'section_2',
                title: 'Seção: Nossa Missão',
                fields: [
                    { key: 'title', label: 'Título', type: 'text', value: 'Nossa Missão' },
                    { key: 'content', label: 'Conteúdo', type: 'textarea', value: 'Não vendemos apenas ímãs. Vendemos portais para o passado. Nossa missão é transformar a porta da sua geladeira ou o seu painel magnético em uma galeria de arte pessoal, com curadoria feita por você.\n\nBuscamos a excelência em cada corte, em cada ajuste de cor, para que aquele sorriso, aquela viagem ou aquele abraço durem por gerações.' },
                    { key: 'image', label: 'Imagem Lateral', type: 'image', value: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=1000&auto=format&fit=crop' }
                ]
            }
        ]
    },
    {
        id: 'process',
        title: 'Processo de Produção',
        sections: [
            {
                id: 'header',
                title: 'Cabeçalho',
                fields: [
                    { key: 'title', label: 'Título Principal', type: 'text', value: 'Processo de Produção' },
                    { key: 'subtitle', label: 'Subtítulo', type: 'text', value: 'Artesanal & Tecnológico' },
                    { key: 'bg_image', label: 'Imagem de Fundo', type: 'image', value: 'https://images.unsplash.com/photo-1531973576160-7125cd663d86?q=80&w=1600&auto=format&fit=crop' }
                ]
            },
            {
                id: 'steps',
                title: 'Etapas de Produção',
                fields: [
                    { key: 'step_1_title', label: 'Passo 1: Título', type: 'text', value: '1. Impressão Fine Art' },
                    { key: 'step_1_desc', label: 'Passo 1: Descrição', type: 'textarea', value: 'Utilizamos plotters de alta definição com 12 cores de pigmento mineral, garantindo fidelidade cromática e durabilidade superior a 100 anos.' },
                    { key: 'step_1_icon', label: 'Passo 1: Ícone (Lucide)', type: 'text', value: 'Layers' },
                    
                    { key: 'step_2_title', label: 'Passo 2: Título', type: 'text', value: '2. Laminação UV' },
                    { key: 'step_2_desc', label: 'Passo 2: Descrição', type: 'textarea', value: 'Cada folha impressa recebe uma camada de laminação fosca ou brilhante, protegendo contra raios UV, umidade e marcas de dedos.' },
                    { key: 'step_2_icon', label: 'Passo 2: Ícone (Lucide)', type: 'text', value: 'Leaf' },

                    { key: 'step_3_title', label: 'Passo 3: Título', type: 'text', value: '3. Corte e Acabamento' },
                    { key: 'step_3_desc', label: 'Passo 3: Descrição', type: 'textarea', value: 'O corte é feito com precisão milimétrica, seguido de uma inspeção manual peça por peça para garantir que nenhum detalhe passe despercebido.' },
                    { key: 'step_3_icon', label: 'Passo 3: Ícone (Lucide)', type: 'text', value: 'Heart' },
                ]
            },
            {
                id: 'details',
                title: 'Detalhes de Qualidade',
                fields: [
                    { key: 'title', label: 'Título', type: 'text', value: 'Qualidade que se Sente' },
                    { key: 'content', label: 'Conteúdo', type: 'textarea', value: 'Nossos ímãs possuem 0.8mm de espessura, conferindo robustez e aderência perfeita. Diferente de ímãs promocionais finos, o produto Magneto tem "corpo" e presença.\n\nO verso é totalmente imantado (manta magnética de alta energia), garantindo que suas fotos não escorreguem e fixem papéis com segurança.' },
                    { key: 'image', label: 'Imagem', type: 'image', value: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=1000&auto=format&fit=crop' }
                ]
            }
        ]
    },
    {
        id: 'sustainability',
        title: 'Sustentabilidade',
        sections: [
            {
                id: 'header',
                title: 'Cabeçalho',
                fields: [
                    { key: 'title', label: 'Título Principal', type: 'text', value: 'Sustentabilidade' },
                    { key: 'subtitle', label: 'Subtítulo', type: 'text', value: 'Compromisso Eco-friendly' },
                    { key: 'bg_image', label: 'Imagem de Fundo', type: 'image', value: 'https://images.unsplash.com/photo-1511497584788-876760111969?q=80&w=1600&auto=format&fit=crop' }
                ]
            },
            {
                id: 'intro',
                title: 'Introdução',
                fields: [
                    { key: 'headline', label: 'Título', type: 'text', value: 'Pegada Leve, Memórias Duradouras' },
                    { key: 'text', label: 'Texto', type: 'textarea', value: 'Sabemos que o consumo gera impacto. Por isso, na Magneto, trabalhamos ativamente para reduzir nossa pegada ecológica através de escolhas conscientes em cada etapa do processo.' }
                ]
            },
            {
                id: 'points',
                title: 'Pontos Sustentáveis',
                fields: [
                    { key: 'p1_title', label: 'Ponto 1: Título', type: 'text', value: 'Papel Certificado' },
                    { key: 'p1_desc', label: 'Ponto 1: Descrição', type: 'text', value: 'Todo papel utilizado provém de fontes de reflorestamento certificadas pelo FSC (Forest Stewardship Council).' },
                    { key: 'p1_icon', label: 'Ponto 1: Ícone (Lucide)', type: 'text', value: 'Leaf' },

                    { key: 'p2_title', label: 'Ponto 2: Título', type: 'text', value: 'Resíduos Mínimos' },
                    { key: 'p2_desc', label: 'Ponto 2: Descrição', type: 'text', value: 'Nossa tecnologia de corte otimizado aproveita 98% da área do material, gerando o mínimo de sobras.' },
                    { key: 'p2_icon', label: 'Ponto 2: Ícone (Lucide)', type: 'text', value: 'Layers' },

                    { key: 'p3_title', label: 'Ponto 3: Título', type: 'text', value: 'Embalagem Sem Plástico' },
                    { key: 'p3_desc', label: 'Ponto 3: Descrição', type: 'text', value: 'Nossas caixas e envelopes são 100% recicláveis e biodegradáveis, eliminando o uso de plásticos descartáveis no envio.' },
                    { key: 'p3_icon', label: 'Ponto 3: Ícone (Lucide)', type: 'text', value: 'Truck' },

                    { key: 'p4_title', label: 'Ponto 4: Título', type: 'text', value: 'Tinta Eco-Solvente' },
                    { key: 'p4_desc', label: 'Ponto 4: Descrição', type: 'text', value: 'Utilizamos tintas à base de água ou eco-solventes, livres de metais pesados e compostos voláteis nocivos.' },
                    { key: 'p4_icon', label: 'Ponto 4: Ícone (Lucide)', type: 'text', value: 'Heart' },
                ]
            }
        ]
    },
    {
        id: 'faq-page',
        title: 'Página FAQ (Cabeçalho)',
        sections: [
            {
                id: 'header',
                title: 'Cabeçalho da Página',
                fields: [
                    { key: 'title', label: 'Título Principal', type: 'text', value: 'Perguntas Frequentes' },
                    { key: 'subtitle', label: 'Subtítulo', type: 'text', value: 'Suporte Magneto' },
                    { key: 'bg_image', label: 'Imagem de Fundo', type: 'image', value: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?q=80&w=1600&auto=format&fit=crop' }
                ]
            }
        ]
    },
    {
        id: 'contact',
        title: 'Página de Contato',
        sections: [
            {
                id: 'header',
                title: 'Cabeçalho e Intro',
                fields: [
                    { key: 'title', label: 'Título Principal', type: 'text', value: 'Estamos aqui por você.' },
                    { key: 'subtitle', label: 'Texto de Apoio', type: 'textarea', value: 'Dúvidas sobre seu pedido, parcerias ou apenas um oi? Nossa equipe de atendimento está pronta para ajudar.' }
                ]
            },
            {
                id: 'info',
                title: 'Informações de Contato',
                fields: [
                    { key: 'hours', label: 'Horário de Atendimento', type: 'text', value: 'Segunda à Sexta, das 09h às 18h.' },
                    { key: 'email', label: 'E-mail', type: 'text', value: 'contato@magneto.com' },
                    { key: 'phone', label: 'Telefone / WhatsApp', type: 'text', value: '(11) 99999-9999' },
                    { key: 'address', label: 'Endereço', type: 'text', value: 'Av. Paulista, 1000 - SP' },
                    { key: 'company_info', label: 'Dados da Empresa (Rodapé do Card)', type: 'textarea', value: 'Magneto Comércio de Artigos Fotográficos LTDA.\nCNPJ: 00.000.000/0001-00' }
                ]
            }
        ]
    },
    // --- NOVAS PÁGINAS LEGAIS ---
    {
        id: 'privacy',
        title: 'Política de Privacidade',
        sections: [
            {
                id: 'content',
                title: 'Conteúdo da Política',
                fields: [
                    { key: 'highlight', label: 'Destaque Inicial (Box)', type: 'textarea', value: 'A Magneto valoriza a sua privacidade. Esta política descreve como coletamos, usamos e protegemos suas informações, em total conformidade com a Lei nº 13.709/2018.' },
                    { key: 'section_1_title', label: 'Seção 1: Título', type: 'text', value: '1. Coleta de Dados' },
                    { key: 'section_1_text', label: 'Seção 1: Texto', type: 'textarea', value: 'Coletamos apenas os dados estritamente necessários para a prestação dos nossos serviços de personalização e entrega de produtos, incluindo: Nome completo, CPF (para emissão de Nota Fiscal), endereço de entrega, e-mail, telefone e as imagens enviadas para personalização.' },
                    { key: 'section_2_title', label: 'Seção 2: Título', type: 'text', value: '2. Uso das Imagens' },
                    { key: 'section_2_text', label: 'Seção 2: Texto', type: 'textarea', value: 'As imagens enviadas para a produção dos ímãs são tratadas com sigilo absoluto. Elas são armazenadas em nossos servidores criptografados apenas pelo tempo necessário para a produção e garantia de qualidade (até 90 dias após a entrega).\n\nApós este período, os arquivos originais são excluídos permanentemente de nossa base de dados. Não utilizamos suas fotos para fins publicitários sem o seu consentimento expresso e por escrito.' },
                    { key: 'section_3_title', label: 'Seção 3: Título', type: 'text', value: '3. Compartilhamento de Dados' },
                    { key: 'section_3_text', label: 'Seção 3: Texto', type: 'textarea', value: 'Não vendemos seus dados. O compartilhamento ocorre apenas com parceiros essenciais para a operação:\n- Transportadoras (para entrega);\n- Gateways de pagamento (para processamento financeiro seguro);\n- Órgãos fiscais (para emissão de NF-e).' },
                    { key: 'section_4_title', label: 'Seção 4: Título', type: 'text', value: '4. Seus Direitos (LGPD)' },
                    { key: 'section_4_text', label: 'Seção 4: Texto', type: 'textarea', value: 'Você tem direito a confirmar a existência de tratamento, acessar seus dados, corrigir dados incompletos ou desatualizados e solicitar a eliminação de dados pessoais, exceto aqueles que precisamos manter por obrigação legal.' }
                ]
            }
        ]
    },
    {
        id: 'terms',
        title: 'Termos de Uso',
        sections: [
            {
                id: 'content',
                title: 'Conteúdo dos Termos',
                fields: [
                    { key: 'intro', label: 'Introdução', type: 'textarea', value: 'Bem-vindo à Magneto. Ao utilizar nosso site e serviços, você concorda com os termos descritos abaixo, que regem a relação entre a plataforma e o usuário.' },
                    { key: 'section_1_title', label: 'Seção 1: Título', type: 'text', value: '1. Objeto' },
                    { key: 'section_1_text', label: 'Seção 1: Texto', type: 'textarea', value: 'A Magneto é uma plataforma de e-commerce especializada na personalização e venda de ímãs fotográficos de alta qualidade ("Fine Art"), produzidos sob demanda.' },
                    { key: 'section_2_title', label: 'Seção 2: Título', type: 'text', value: '2. Responsabilidade pelo Conteúdo' },
                    { key: 'section_2_text', label: 'Seção 2: Texto', type: 'textarea', value: 'O usuário declara ser o titular dos direitos autorais ou ter autorização para uso das imagens enviadas. A Magneto não se responsabiliza por violações de direitos autorais ou de imagem de terceiros contidos nas fotos submetidas pelo cliente.' },
                    { key: 'highlight', label: 'Destaque (Proibido)', type: 'textarea', value: 'Reservamo-nos o direito de recusar pedidos com conteúdo ilícito, pornográfico, que incite ao ódio ou viole a legislação brasileira vigente.' },
                    { key: 'section_3_title', label: 'Seção 3: Título', type: 'text', value: '3. Variação de Cor e Impressão' },
                    { key: 'section_3_text', label: 'Seção 3: Texto', type: 'textarea', value: 'Pode haver variação na tonalidade das cores entre a imagem visualizada em telas (padrão RGB, com luz própria) e o produto impresso (padrão CMYK, pigmento mineral). Variações sutis de calibração não são consideradas defeito de fabricação.' }
                ]
            }
        ]
    },
    {
        id: 'exchanges',
        title: 'Política de Troca',
        sections: [
            {
                id: 'content',
                title: 'Conteúdo da Política',
                fields: [
                    { key: 'highlight', label: 'Destaque Inicial', type: 'textarea', value: 'Produtos personalizados possuem regras específicas de troca e devolução, conforme entendimento do Código de Defesa do Consumidor (CDC).' },
                    { key: 'section_1_title', label: 'Seção 1: Título', type: 'text', value: '1. Produtos Personalizados' },
                    { key: 'section_1_text', label: 'Seção 1: Texto', type: 'textarea', value: 'Nossos produtos são feitos sob encomenda exclusivamente para você. Devido à natureza personalíssima, não aceitamos devoluções por arrependimento ou gosto pessoal (ex: "não gostei da foto que eu escolhi"), uma vez que o produto não pode ser revendido a terceiros.\nEsta exceção é amplamente reconhecida na jurisprudência brasileira para evitar prejuízos desproporcionais ao fornecedor de bens feitos sob medida.' },
                    { key: 'section_2_title', label: 'Seção 2: Título', type: 'text', value: '2. Defeitos de Fabricação' },
                    { key: 'section_2_text', label: 'Seção 2: Texto', type: 'textarea', value: 'Caso o produto apresente defeito de impressão, corte incorreto ou avaria no transporte, garantimos a troca imediata ou reembolso integral, conforme Art. 18 do CDC.' },
                    { key: 'info_1_title', label: 'Info Box 1: Título', type: 'text', value: 'Prazo Legal' },
                    { key: 'info_1_desc', label: 'Info Box 1: Texto', type: 'textarea', value: 'O cliente tem até 90 dias corridos para reclamar de vícios aparentes ou de fácil constatação no produto recebido.' },
                    { key: 'info_2_title', label: 'Info Box 2: Título', type: 'text', value: 'Procedimento' },
                    { key: 'info_2_desc', label: 'Info Box 2: Texto', type: 'textarea', value: 'Envie fotos do defeito para contato@magneto.com. Faremos uma análise técnica em até 48 horas úteis.' },
                    { key: 'section_3_title', label: 'Seção 3: Título', type: 'text', value: '3. Erro no Endereço' },
                    { key: 'section_3_text', label: 'Seção 3: Texto', type: 'textarea', value: 'Caso o pedido retorne devido a endereço incorreto fornecido pelo cliente no momento da compra, será cobrado um novo frete para o reenvio da mercadoria.' }
                ]
            }
        ]
    },
    {
        id: 'shipping',
        title: 'Envios & Prazos',
        sections: [
            {
                id: 'content',
                title: 'Conteúdo de Envios',
                fields: [
                    { key: 'section_1_title', label: 'Seção 1: Título', type: 'text', value: '1. Prazo de Produção' },
                    { key: 'section_1_text', label: 'Seção 1: Texto', type: 'textarea', value: 'Por ser um produto artesanal com acabamento manual rigoroso, nosso prazo de produção é de 2 a 4 dias úteis após a confirmação do pagamento. Este tempo é necessário para a cura da impressão e secagem da laminação UV.' },
                    { key: 'section_2_title', label: 'Seção 2: Título', type: 'text', value: '2. Modalidades de Entrega' },
                    { key: 'section_2_text', label: 'Seção 2: Texto', type: 'textarea', value: 'O prazo de entrega varia conforme a região e a modalidade escolhida. O prazo total informado no carrinho já soma o tempo de produção + tempo de transporte.' },
                    { key: 'info_1_title', label: 'Info Box 1: Título', type: 'text', value: 'Correios SEDEX' },
                    { key: 'info_1_desc', label: 'Info Box 1: Texto', type: 'textarea', value: 'Modalidade expressa recomendada para quem tem pressa. Entrega em capitais geralmente ocorre entre 1 a 3 dias úteis após a postagem.' },
                    { key: 'info_2_title', label: 'Info Box 2: Título', type: 'text', value: 'Correios PAC' },
                    { key: 'info_2_desc', label: 'Info Box 2: Texto', type: 'textarea', value: 'Modalidade econômica para envios não urgentes. O prazo é maior, porém o custo do frete é reduzido.' },
                    { key: 'section_3_title', label: 'Seção 3: Título', type: 'text', value: '3. Atrasos e Extravios' },
                    { key: 'section_3_text', label: 'Seção 3: Texto', type: 'textarea', value: 'A Magneto monitora todos os envios. Em caso de extravio confirmado pela transportadora, faremos a reprodução e reenvio do pedido sem custo adicional e com prioridade na produção, ou o reembolso integral, conforme preferência do cliente.' }
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

// --- HELPER PARA ESTATÍSTICAS PÚBLICAS ---
export const getPublicStats = () => {
    // 1. Encontra a configuração no CMS
    const statsPage = SITE_CONTENT.find(p => p.id === 'stats');
    const configSection = statsPage?.sections.find(s => s.id === 'config');
    
    // Helpers para ler valores do CMS
    const getValue = (key: string) => configSection?.fields.find(f => f.key === key)?.value;
    const getBool = (key: string) => getValue(key) === 'true';
    const getInt = (key: string, fallback: string) => parseInt(getValue(key) || fallback, 10);

    const useRealData = getBool('use_real_data');

    // Base values (Manual)
    let totalOrders = getInt('manual_orders', '70000');
    let totalMagnets = getInt('manual_magnets', '800000');
    let totalReviews = getInt('manual_reviews', '5000');

    if (useRealData) {
        // CÁLCULO REAL
        const validOrders = ALL_ORDERS.filter(o => 
            !o.deleted && ['production', 'shipped', 'delivered'].includes(o.status)
        );

        const ordersCount = validOrders.length;
        const magnetsCount = validOrders.reduce((acc, order) => acc + (order.itemsCount || 0), 0);
        const reviewsCount = MOCK_REVIEWS.filter(r => r.status === 'approved' && r.rating === 5).length;

        totalOrders += ordersCount;
        totalMagnets += magnetsCount;
        totalReviews += reviewsCount;
    }

    // Get order array
    const orderString = getValue('stats_order') || 'orders,magnets,reviews';
    const orderArray = orderString.split(',').filter(Boolean);

    return {
        visible: getBool('section_visible'),
        order: orderArray,
        years: {
            visible: getBool('show_years'),
            value: getInt('years_count', '13')
        },
        orders: {
            visible: getBool('show_orders'),
            value: totalOrders
        },
        magnets: {
            visible: getBool('show_magnets'),
            value: totalMagnets
        },
        reviews: {
            visible: getBool('show_reviews'),
            value: totalReviews
        }
    };
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
