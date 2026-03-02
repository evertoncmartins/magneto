
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
    Upload, Image as ImageIcon, X, Trash2, Plus, 
    Crop as CropIcon, Sliders, Sun, Contrast, Droplet, Zap, Thermometer, 
    Aperture, Check, RotateCcw, ZoomIn, ZoomOut, ShoppingBag,
    Info, AlertCircle, LayoutGrid, Camera, Wand2, Sparkles, Monitor, Ruler,
    Copy, ChevronLeft, ChevronRight, ArrowRight, Loader2, CheckCircle, ToggleLeft, ToggleRight,
    Scissors, RefreshCw, Shield, Save
} from 'lucide-react';
import { MagnetItem, ImageAdjustments, ProductTier, Order, User } from '../types';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { saveImageToDB, getImageFromDB, getOrderById, updateOrderDetails } from '../services/mockService';
// @ts-ignore
import heic2any from 'heic2any';

const DEFAULT_ADJUSTMENTS: ImageAdjustments = {
    brightness: 100,
    contrast: 100,
    saturation: 100,
    warmth: 100,
    exposure: 100,
    vibrance: 100,
    gamma: 100,
    enhance: 0
};

const ADJUSTMENT_TOOLS = [
    { id: 'brightness', label: 'BRILHO', icon: Sun, min: 50, max: 150 },
    { id: 'exposure', label: 'EXPOSIÇÃO', icon: Zap, min: 50, max: 150 },
    { id: 'contrast', label: 'CONTRASTE', icon: Contrast, min: 50, max: 150 },
    { id: 'saturation', label: 'SATURAÇÃO', icon: Droplet, min: 0, max: 200 },
    { id: 'warmth', label: 'CALOR', icon: Thermometer, min: 50, max: 150 },
];

const FILTERS = [
  { name: 'Original', filter: 'none' },
  { name: 'P&B', filter: 'grayscale(1)' },
  { name: 'Vintage', filter: 'sepia(0.6) contrast(0.9) brightness(1.1)' },
  { name: 'Sépia', filter: 'sepia(1)' },
  { name: 'Solar', filter: 'brightness(1.2) saturate(1.4)' },
  { name: 'Noite', filter: 'brightness(0.8) hue-rotate(200deg) saturate(0.8)' },
  { name: 'Cinema', filter: 'contrast(1.3) saturate(0.7) sepia(0.2)' },
  { name: 'Dramático', filter: 'contrast(1.6) saturate(0.5)' },
  { name: 'Suave', filter: 'brightness(1.1) contrast(0.9) saturate(0.9)' },
  { name: 'Nostalgia', filter: 'sepia(0.4) brightness(0.9) hue-rotate(-10deg)' },
  { name: 'Nítido', filter: 'contrast(1.2) brightness(1.05)' },
];

// OTIMIZAÇÃO: Função de compressão aprimorada para performance e qualidade de impressão
const compressImageInput = async (file: File): Promise<{ url: string; blob: Blob }> => {
    let sourceFile = file;

    // Conversão de HEIC/HEIF para JPEG com alta qualidade
    if (file.name.toLowerCase().match(/\.(heic|heif)$/) || file.type === 'image/heic' || file.type === 'image/heif') {
        try {
            const convertedBlob = await heic2any({
                blob: file,
                toType: 'image/jpeg',
                quality: 0.95 // Aumentado para preservar detalhes na conversão inicial
            });
            const finalBlob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
            sourceFile = new File([finalBlob], file.name.replace(/\.(heic|heif)$/i, '.jpg'), { type: 'image/jpeg' });
        } catch (err) {
            console.error("Erro na conversão HEIC:", err);
            // Continua com o arquivo original como fallback (alguns navegadores podem suportar nativamente)
        }
    }

    return new Promise((resolve, reject) => {
        const img = new Image();
        const objectUrl = URL.createObjectURL(sourceFile);
        
        img.onload = () => {
            URL.revokeObjectURL(objectUrl);
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // CÁLCULO DE RESOLUÇÃO OTIMIZADA PARA IMPRESSÃO:
            // Aumentado de 1024 para 2400 para permitir crop/zoom sem pixelização.
            // 2400px é mais que suficiente para 50mm em 300dpi, permitindo margem de manobra.
            const MAX_DIM = 2400; 
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > MAX_DIM) {
                    height *= MAX_DIM / width;
                    width = MAX_DIM;
                }
            } else {
                if (height > MAX_DIM) {
                    width *= MAX_DIM / height;
                    height = MAX_DIM;
                }
            }

            canvas.width = width;
            canvas.height = height;
            
            if (ctx) {
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, width, height);
            }
            
            canvas.toBlob((blob) => {
                if (blob) {
                    const optimizedUrl = URL.createObjectURL(blob);
                    resolve({ url: optimizedUrl, blob: blob });
                } else {
                    reject(new Error("Falha na geração do blob da imagem"));
                }
            }, 'image/jpeg', 0.92); // Qualidade aumentada para 92% (padrão de alta qualidade)
        };
        
        img.onerror = (err) => {
            URL.revokeObjectURL(objectUrl);
            reject(err);
        };

        img.src = objectUrl;
    });
};

const normalizeItems = (items: MagnetItem[]): MagnetItem[] => {
    return items.map(item => {
        const hasValidOriginal = item.originalUrl && !item.originalUrl.startsWith('blob:');
        const safeOriginal = hasValidOriginal ? item.originalUrl : (item.croppedUrl || '');
        const safeCropped = item.croppedUrl || safeOriginal;

        return {
            ...item,
            originalUrl: safeOriginal,
            croppedUrl: safeCropped,
            backupSrc: item.backupSrc || safeCropped || safeOriginal
        };
    });
};

interface StudioProps {
  addToCart: (items: MagnetItem[]) => void;
  initialImages?: MagnetItem[];
  adminDraftUser?: User | null;
}

const Studio: React.FC<StudioProps> = ({ addToCart, initialImages = [], adminDraftUser }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { orderId } = useParams(); // Capture Admin Mode Order ID
    const fileInputRef = useRef<HTMLInputElement>(null);

    // States for Admin Mode - Initialize strictly based on URL path to prevent race conditions
    const [isAdminMode, setIsAdminMode] = useState(() => location.pathname.includes('/admin/studio/'));
    const [adminOrder, setAdminOrder] = useState<Order | null>(null);
    
    // Identifica qual kit está sendo editado (se passado pelo AdminOrders)
    const kitIdToEdit = location.state?.kitIdToEdit;

    const [images, setImages] = useState<MagnetItem[]>(() => {
        const isEditing = location.state?.isEditing;
        
        // RECUPERAÇÃO DE DADOS DE EDIÇÃO (Client Side)
        const transferKit = isEditing ? (window as any).magnetoEditKit as MagnetItem[] | undefined : undefined;
        const propsKit = (initialImages && initialImages.length > 0) ? initialImages : undefined;
        const locKit = location.state?.editingKit as MagnetItem[] | undefined;

        const sourceItems = transferKit || propsKit || locKit || [];
        
        if (sourceItems.length > 0) {
            return normalizeItems(sourceItems);
        }
        return [];
    });

    const [view, setView] = useState<'upload' | 'gallery' | 'editor' | 'success'>(() => {
        return images.length > 0 ? 'gallery' : 'upload';
    });

    // Check for Admin Edit Mode
    useEffect(() => {
        if (orderId && location.pathname.includes('/admin/studio/')) {
            setIsAdminMode(true);
            const order = getOrderById(orderId);
            if (order && order.items) {
                setAdminOrder(order);
                
                // Se existe um kitIdToEdit, carregamos APENAS as fotos desse kit
                // Se não existe, carrega tudo (fallback legado)
                let itemsToLoad = order.items;
                
                if (kitIdToEdit) {
                    itemsToLoad = order.items.filter(item => {
                        const itemKitId = item.kitId || 'avulso';
                        return itemKitId === kitIdToEdit;
                    });
                }

                setImages(normalizeItems(itemsToLoad));
                setView('gallery');
            } else {
                alert("Pedido não encontrado.");
                navigate('/admin');
            }
        }
    }, [orderId, location.pathname, navigate, kitIdToEdit]);

    // Determine target count: Admin (flexible/locked to existing) vs Client (Tier based)
    const selectedTier: ProductTier | undefined = location.state?.tier;
    
    // Se estiver editando um kit específico no admin, o alvo é o tamanho desse kit
    // Se estiver editando o pedido inteiro (legado), usa itemsCount ou length.
    const targetCount = isAdminMode 
        ? (kitIdToEdit ? images.length : (adminOrder?.itemsCount || images.length || 9))
        : (selectedTier?.photoCount || 9);

    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editTab, setEditTab] = useState<'crop' | 'adjust' | 'filters'>('crop');
    const [activeToolId, setActiveToolId] = useState<keyof ImageAdjustments>('brightness');
    
    // PROGRESS BAR STATE
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [processingMessage, setProcessingMessage] = useState('');
    
    const [isLoadingInitial, setIsLoadingInitial] = useState(false);
    const [socialConsent, setSocialConsent] = useState(true);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    // Temp state to hold items before cart confirmation
    const [tempCartItems, setTempCartItems] = useState<MagnetItem[]>([]);

    useEffect(() => {
        if (!isAdminMode && images.length === 0 && initialImages && initialImages.length > 0) {
            const normalized = normalizeItems(initialImages);
            setImages(normalized);
            setView('gallery');
        }
    }, [initialImages, images.length, isAdminMode]);

    // Safety check for lost edit state
    useEffect(() => {
        const isEditing = location.state?.isEditing;
        if (!isAdminMode && isEditing && images.length === 0 && (window as any).magnetoEditKit) {
             const recovered = normalizeItems((window as any).magnetoEditKit);
             if (recovered.length > 0) {
                 setImages(recovered);
                 setView('gallery');
             }
        }
    }, [location.state, images.length, isAdminMode]);

    useEffect(() => {
        // Redirection Safety Check: Only redirect if definitely NOT in admin mode
        const isPathAdmin = location.pathname.includes('/admin/studio/');
        if (!isPathAdmin && !isAdminMode && images.length === 0 && !selectedTier && !location.state?.isEditing) {
            navigate('/studio');
            return;
        }

        const rehydrateHighRes = async () => {
            if (images.length === 0) return;

            try {
                const upgradedItems = await Promise.all(images.map(async (item) => {
                    if (item.originalUrl.startsWith('data:')) {
                        try {
                            const rawData = await getImageFromDB(item.id);
                            if (rawData && rawData instanceof Blob) {
                                return { ...item, originalUrl: URL.createObjectURL(rawData) };
                            }
                            const printData = await getImageFromDB(item.id + '_print');
                            if (printData && printData instanceof Blob) {
                                return { ...item, originalUrl: URL.createObjectURL(printData) };
                            }
                        } catch (e) { /* Falha silenciosa */ }
                    }
                    return item;
                }));
                
                const hasChanges = upgradedItems.some((item, i) => item.originalUrl !== images[i].originalUrl);
                if (hasChanges) {
                    setImages(upgradedItems);
                }
            } catch (err) {
                console.error("Erro na reidratação", err);
            }
        };

        rehydrateHighRes();
    }, [isAdminMode, location.pathname]); // Depend on location pathname to re-verify on route change

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            
            // Verifica espaço restante estrito
            const remaining = Math.max(0, targetCount - images.length);
            
            if (remaining === 0) {
                alert(`O kit de ${targetCount} fotos já está completo!`);
                e.target.value = '';
                return;
            }

            setIsProcessing(true);
            
            // Pega apenas a quantidade necessária de arquivos para completar o kit
            const filesToProcess = Array.from(e.target.files).slice(0, remaining) as File[];
            
            // Inicializa progresso real
            setProgress({ current: 0, total: filesToProcess.length });
            setProcessingMessage('Otimizando fotos (Alta Qualidade)...');

            try {
                const newItems: MagnetItem[] = [];

                for (let i = 0; i < filesToProcess.length; i++) {
                    const file = filesToProcess[i];
                    
                    // Feedback visual do arquivo atual
                    setProcessingMessage(`Processando ${i + 1} de ${filesToProcess.length}...`);
                    
                    // Pequeno delay para garantir que a UI do React atualize a barra de progresso antes de bloquear a thread
                    await new Promise(resolve => setTimeout(resolve, 50));

                    const id = `img-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`;
                    
                    try {
                        // Processamento real (CPU Bound) com suporte a HEIC
                        const { url, blob } = await compressImageInput(file);
                        
                        // Salvamento assíncrono (IO Bound)
                        await saveImageToDB(id, blob); 

                        newItems.push({
                            id: id,
                            originalUrl: url,
                            croppedUrl: '', 
                            backupSrc: '', 
                            cropData: { x: 0, y: 0, zoom: 1, rotation: 0 },
                            adjustments: { ...DEFAULT_ADJUSTMENTS },
                            filter: 'Original'
                        });
                        
                        // Atualiza progresso apenas APÓS sucesso
                        setProgress(prev => ({ ...prev, current: i + 1 }));

                    } catch (compressErr) {
                        console.error("Erro ao processar imagem:", file.name, compressErr);
                    }
                }
                
                // Atualiza estado final
                setImages(prev => [...prev, ...newItems]);
                setView('gallery');
            } catch (error) {
                console.error("Erro geral no processamento", error);
                alert("Erro ao processar algumas imagens.");
            } finally {
                setIsProcessing(false);
                setProgress({ current: 0, total: 0 });
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        }
    };

    const deleteImage = (index: number) => {
        const newImages = images.filter((_, i) => i !== index);
        setImages(newImages);
        if (newImages.length === 0 && !isAdminMode) setView('upload'); 
        // Admin stays in gallery even if empty
    };

    const duplicateImage = (index: number) => {
        if (images.length >= targetCount) {
            alert("Limite do kit atingido.");
            return;
        }
        const item = images[index];
        const newItem = { 
            ...item, 
            id: `img-${Date.now()}-copy-${Math.random().toString(36).substr(2, 5)}` 
        };
        const newImages = [...images];
        newImages.splice(index + 1, 0, newItem);
        setImages(newImages);
    };

    const updateEditingItem = (updates: Partial<MagnetItem>) => {
        if (editingIndex === null) return;
        setImages(prev => prev.map((img, i) => i === editingIndex ? { ...img, ...updates } : img));
    };
    
    const updateAdjustment = (key: keyof ImageAdjustments, value: number) => {
        if (editingIndex === null) return;
        const currentItem = images[editingIndex];
        const newAdjustments = { ...currentItem.adjustments!, [key]: value };
        updateEditingItem({ adjustments: newAdjustments });
    };

    const getCombinedFilter = (item: MagnetItem) => {
        const preset = FILTERS.find(f => f.name === item.filter)?.filter || 'none';
        const adj = item.adjustments || DEFAULT_ADJUSTMENTS;
        const brightness = adj.brightness / 100;
        const contrast = adj.contrast / 100;
        const saturate = adj.saturation / 100;
        const exposure = adj.exposure / 100;
        const warmthVal = (adj.warmth - 100);
        const warmth = warmthVal > 0 
            ? `sepia(${warmthVal / 100})` 
            : `hue-rotate(${warmthVal * 0.5}deg) saturate(${1 + Math.abs(warmthVal)/200})`;
        const custom = `brightness(${brightness * exposure}) contrast(${contrast}) saturate(${saturate}) ${warmth}`;
        if (preset === 'none') return custom;
        return `${preset} ${custom}`;
    };

    const processFinalImage = (img: MagnetItem, outputSize: number, quality: number, asBlob: boolean = false): Promise<string | Blob> => {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            const imageElement = new Image();
            
            const sourceUrl = img.originalUrl || img.backupSrc || img.croppedUrl;
            if (!sourceUrl) return resolve('');
            
            imageElement.src = sourceUrl;
            imageElement.crossOrigin = "anonymous";
            
            imageElement.onload = () => {
                canvas.width = outputSize;
                canvas.height = outputSize;
                if (!context) return resolve('');
                
                context.imageSmoothingEnabled = true;
                context.imageSmoothingQuality = 'high';

                context.filter = getCombinedFilter(img);
                context.save();
                context.translate(outputSize / 2, outputSize / 2);
                context.rotate(((img.cropData?.rotation || 0) * Math.PI) / 180);
                context.scale(img.cropData?.zoom || 1, img.cropData?.zoom || 1);
                const aspect = imageElement.naturalWidth / imageElement.naturalHeight;
                let dw, dh;
                if (aspect > 1) { dh = outputSize; dw = outputSize * aspect; } else { dw = outputSize; dh = outputSize / aspect; }
                const offsetScale = outputSize / 384; 
                // Assumindo que 384 era a base do editor visual, precisamos ajustar se o editor mudou de tamanho
                // Melhor usar o tamanho do canvas de saída como base de proporção.
                // Mas o cropData.x e y são baseados nos pixels de movimento do mouse/touch.
                // A lógica abaixo tenta escalar o movimento relativo.
                
                const tx = (img.cropData?.x || 0) * offsetScale;
                const ty = (img.cropData?.y || 0) * offsetScale;
                context.drawImage(imageElement, -dw/2 + tx, -dh/2 + ty, dw, dh);
                context.restore();
                
                if (asBlob) {
                    canvas.toBlob((blob) => {
                        resolve(blob || '');
                    }, 'image/jpeg', quality);
                } else {
                    const dataUrl = canvas.toDataURL('image/jpeg', quality);
                    resolve(dataUrl);
                }
            };
            imageElement.onerror = () => resolve('');
        });
    };

    const handleFinalize = async () => {
        // --- VALIDAÇÃO ESTRITA DE QUANTIDADE ---
        if (images.length < targetCount) {
            fileInputRef.current?.click();
            return;
        }
        if (images.length > targetCount) {
             alert(`Por favor, remova ${images.length - targetCount} foto(s) para respeitar o tamanho do Kit.`);
             return;
        }
        
        setIsProcessing(true);
        setProcessingMessage(isAdminMode ? 'Salvando alterações em Alta Definição...' : 'Gerando kit final em Alta Definição...');
        setProgress({ current: 0, total: images.length });

        try {
            // ID de Kit padrão: se tiver editando um específico, usa ele. Se não, usa o primeiro ou cria um novo.
            // Para admin editando um kit especifico, o kitIdToEdit é crucial.
            const existingKitId = kitIdToEdit || images[0].kitId || `kit-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

            const processedItems: MagnetItem[] = [];
            
            for (let i = 0; i < images.length; i++) {
                const img = images[i];
                
                setProcessingMessage(`Renderizando ${i + 1} de ${images.length}...`);
                setProgress({ current: i + 1, total: images.length });
                await new Promise(resolve => setTimeout(resolve, 20));

                const fetchUrl = img.originalUrl || img.backupSrc || img.croppedUrl;
                if (!fetchUrl) {
                    // Se não tiver URL, mantém, mas garante o kitId correto (importante para merge)
                    processedItems.push({ ...img, kitId: existingKitId }); 
                    continue;
                }

                try {
                    // Display: 600px @ 85% (Melhor visualização em telas Retina)
                    const displayUrl = await processFinalImage(img, 600, 0.85, false) as string; 
                    
                    // Print: 1500px @ 95% (Excelente para 50mm @ ~700dpi, quase lossless)
                    const printBlob = await processFinalImage(img, 1500, 0.95, true) as Blob; 

                    try {
                        if (printBlob) {
                            await saveImageToDB(img.id + '_print', printBlob); 
                        }
                    } catch (dbErr) {
                        console.warn("Falha no DB", dbErr);
                    }

                    processedItems.push({ 
                        ...img,
                        kitId: existingKitId, 
                        originalUrl: '', 
                        backupSrc: '', 
                        croppedUrl: displayUrl, 
                        highResUrl: '',  
                    });
                } catch (err) {
                    console.error("Error processing item", err);
                    processedItems.push({ ...img, kitId: existingKitId, backupSrc: img.croppedUrl });
                }
            }

            if (isAdminMode && adminOrder) {
                // ADMIN SAVE
                // Se estamos editando um kit específico, precisamos fazer um MERGE inteligente:
                // Removemos os itens antigos desse kit e colocamos os novos no lugar.
                let finalItemsToSave = processedItems;

                if (kitIdToEdit) {
                    // Mantém os itens que NÃO são deste kit
                    const otherItems = adminOrder.items?.filter(item => {
                        const itemKitId = item.kitId || 'avulso';
                        return itemKitId !== kitIdToEdit;
                    }) || [];
                    
                    // Junta com os itens processados deste kit
                    finalItemsToSave = [...otherItems, ...processedItems];
                }

                updateOrderDetails(adminOrder.id, { items: finalItemsToSave });
                setIsProcessing(false);
                // REDIRECT TO ADMIN ORDERS DASHBOARD WITH PRE-FILLED SEARCH
                navigate('/admin', { state: { activeTab: 'orders', searchOrderId: adminOrder.id } });
            } else {
                // USER FLOW
                setTempCartItems(processedItems);
                setView('success');
                setIsProcessing(false);
            }
        } catch (err) {
            console.error(err);
            alert('Erro ao processar kit.');
            setIsProcessing(false);
        } finally {
            setProgress({ current: 0, total: 0 });
        }
    };

    // Função para confirmar e enviar ao carrinho com a permissão correta
    const commitToCart = (destination: string | null) => {
        const finalItems = tempCartItems.map(item => ({
            ...item,
            socialConsent: socialConsent // Aplica a escolha atual do toggle
        }));
        
        addToCart(finalItems);
        
        if (destination) {
            navigate(destination);
        } else {
            // Reinicia para novo kit
            setImages([]);
            setTempCartItems([]);
            setView('upload');
        }
    };

    // ... Mouse Handlers ...
    const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
        if (editTab !== 'crop' || editingIndex === null) return;
        setIsDragging(true);
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
        const currentItem = images[editingIndex];
        setDragStart({ x: clientX - (currentItem.cropData?.x || 0), y: clientY - (currentItem.cropData?.y || 0) });
    };

    const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDragging || editingIndex === null) return;
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
        updateEditingItem({ cropData: { ...images[editingIndex].cropData!, x: clientX - dragStart.x, y: clientY - dragStart.y } });
    };

    const handleMouseUp = () => setIsDragging(false);


    if (view === 'upload') {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center p-6">
                <div className="w-full max-w-xl text-center animate-fade-in">
                    {/* Admin Banner */}
                    {isAdminMode && (
                        <div className="bg-[#1d1d1f] text-white py-3 px-4 rounded-md mb-8 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest shadow-lg">
                            <Shield size={14} className="text-[#B8860B]" /> Modo Administrativo: Edição de Pedido
                        </div>
                    )}

                    <div className="w-16 h-16 bg-[#1d1d1f] text-[#B8860B] rounded-md flex items-center justify-center mx-auto mb-10 shadow-lg">
                        <Upload size={32} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#B8860B] mb-2 block">{isAdminMode ? `Pedido #${adminOrder?.id}` : (selectedTier?.name || 'Novo Kit')}</span>
                    <h1 className="text-4xl md:text-5xl font-serif text-[#1d1d1f] mb-6 tracking-tight">Primeiro, suas fotos.</h1>
                    <p className="text-lg text-[#86868b] mb-12 max-w-sm mx-auto leading-relaxed font-light">
                        {isAdminMode 
                            ? `Você está editando um kit existente de ${targetCount} fotos.`
                            : `Selecione suas memórias favoritas para criar um conjunto exclusivo de ${targetCount} ímãs Fine Art.`
                        }
                    </p>
                    
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isProcessing}
                        className="bg-[#1d1d1f] text-white px-12 py-5 rounded-md font-bold text-xs uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl active:scale-95 flex items-center gap-3 mx-auto disabled:opacity-70 disabled:cursor-wait"
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 size={16} className="animate-spin"/> Otimizando... {Math.round((progress.current / progress.total) * 100)}%
                            </>
                        ) : (
                            <>
                                <Plus size={16} /> Selecionar Arquivos
                            </>
                        )}
                    </button>
                    
                    {/* Real Progress Bar Display */}
                    {isProcessing && (
                        <div className="mt-8 max-w-xs mx-auto animate-fade-in">
                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-2 text-[#1d1d1f]">
                                <span>{processingMessage}</span>
                                <span>{progress.current}/{progress.total}</span>
                            </div>
                            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden border border-gray-100">
                                <div 
                                    className="h-full bg-[#B8860B] transition-all duration-300 ease-out shadow-[0_0_10px_#B8860B]" 
                                    style={{ width: `${(progress.current / progress.total) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    )}

                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        hidden 
                        multiple 
                        accept="image/*,.heic,.heif" 
                        onChange={handleFileUpload} 
                    />
                    
                    {!isProcessing && !isAdminMode && (
                        <button onClick={() => navigate('/studio')} className="mt-12 text-[#86868b] font-bold hover:text-[#1d1d1f] transition-colors uppercase tracking-[0.2em] text-[10px] border-b border-transparent hover:border-[#1d1d1f]">
                            Alterar Kit
                        </button>
                    )}
                    {isAdminMode && (
                        <button onClick={() => navigate('/admin')} className="mt-12 text-red-500 font-bold hover:text-red-700 transition-colors uppercase tracking-[0.2em] text-[10px] border-b border-transparent hover:border-red-700">
                            Cancelar Edição
                        </button>
                    )}
                </div>
            </div>
        );
    }

    if (view === 'gallery') {
        if (isLoadingInitial && images.length === 0) {
            return (
                <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 size={32} className="text-[#B8860B] animate-spin" />
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#86868b]">Restaurando sessão...</p>
                    </div>
                </div>
            );
        }

        const slots = Array.from({ length: targetCount });
        
        return (
            <div className="min-h-screen bg-[#F5F5F7] flex flex-col animate-fade-in">
                {/* Header */}
                <div className={`h-16 border-b border-gray-100 px-6 flex justify-between items-center sticky transition-all duration-300 z-40 shadow-sm ${adminDraftUser ? 'top-12' : 'top-0'} ${isAdminMode ? 'bg-[#1d1d1f] text-white' : 'bg-white/95 backdrop-blur-md'}`}>
                    <div className="flex items-center gap-4">
                        <span className={`font-serif font-bold text-xl tracking-tight flex items-center gap-2 ${isAdminMode ? 'text-white' : 'text-[#1d1d1f]'}`}>
                             <LayoutGrid size={20} className="text-[#B8860B]" /> {isAdminMode ? `Admin Studio #${adminOrder?.id}` : 'Studio Magneto'}
                        </span>
                        {!isAdminMode && (
                            <div className="hidden sm:flex items-center gap-2 bg-[#F5F5F7] px-3 py-1 rounded-md border border-gray-100">
                                 <Ruler size={14} className="text-[#B8860B]" />
                                 <span className="text-[10px] font-bold text-[#1d1d1f] uppercase tracking-wide">Tamanho: 50x50mm</span>
                            </div>
                        )}
                        {isAdminMode && (
                            <span className="bg-[#B8860B] text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest">
                                Modo Edição
                            </span>
                        )}
                    </div>
                    <button onClick={() => navigate(isAdminMode ? '/admin' : '/')} className={`p-2 rounded-md transition-colors ${isAdminMode ? 'hover:bg-white/10 text-white' : 'hover:bg-gray-100 text-[#1d1d1f]'}`}>
                        <X size={20} />
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto py-8 md:py-12 px-6 max-w-6xl mx-auto w-full">
                    <div className="text-center mb-10">
                        <span className="text-[#B8860B] font-bold text-[10px] uppercase tracking-[0.3em] mb-4 block">Personalização</span>
                        <h2 className="text-3xl font-serif text-[#1d1d1f] mb-6">Curadoria do Kit ({images.length}/{targetCount})</h2>
                        
                        <div className="flex justify-center">
                            <div className="inline-flex items-center gap-3 bg-amber-50 px-4 py-2 rounded-md border border-amber-100 text-amber-700">
                                <Scissors size={14} />
                                <span className="text-[10px] font-bold uppercase tracking-wide">Atenção: A área dentro do tracejado será impressa. As bordas serão dobradas.</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
                        {slots.map((_, idx) => {
                            const item = images[idx];
                            if (item) {
                                const imageSrc = item.originalUrl || item.backupSrc || item.croppedUrl;
                                const hasImage = !!imageSrc;

                                return (
                                    <div key={item.id} className="group bg-white p-6 rounded-lg shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-100 flex flex-col relative">
                                        <div className="flex justify-between items-center mb-4">
                                            <span className="text-[10px] font-bold text-[#B8860B] uppercase tracking-[0.3em]">Ímã {idx + 1}</span>
                                            <div className="flex items-center gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => duplicateImage(idx)} className="p-2 hover:bg-gray-50 rounded-md text-gray-400 hover:text-[#1d1d1f]" title="Duplicar"><Copy size={16}/></button>
                                                <button onClick={() => deleteImage(idx)} className="p-2 hover:bg-red-50 rounded-md text-gray-400 hover:text-red-600" title="Excluir"><Trash2 size={16}/></button>
                                            </div>
                                        </div>
                                        
                                        <div className="aspect-square bg-[#F5F5F7] rounded-sm overflow-hidden relative mb-6 shadow-md border-b-4 border-r border-gray-200">
                                            {hasImage ? (
                                                <img 
                                                    key={imageSrc} /* RESET DOM IF SRC CHANGES */
                                                    src={imageSrc} 
                                                    className="w-full h-full object-cover transition-all duration-300 group-hover:scale-105" 
                                                    style={{ 
                                                        filter: getCombinedFilter(item),
                                                        transform: `translate(${item.cropData?.x || 0}px, ${item.cropData?.y || 0}px) rotate(${item.cropData?.rotation || 0}deg) scale(${item.cropData?.zoom || 1})`
                                                    }}
                                                    onError={(e) => {
                                                        const target = e.currentTarget;
                                                        if (item.croppedUrl && !target.src.includes(item.croppedUrl)) {
                                                            target.src = item.croppedUrl;
                                                        } else {
                                                            target.style.display = 'none';
                                                            target.parentElement?.querySelector('.error-placeholder')?.classList.remove('hidden');
                                                        }
                                                    }}
                                                />
                                            ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center absolute inset-0 bg-gray-50 text-gray-400">
                                                    <AlertCircle size={24} className="mb-2 text-amber-500" />
                                                    <span className="text-[9px] font-bold uppercase tracking-widest">Falha no carregamento</span>
                                                    <button onClick={() => deleteImage(idx)} className="mt-2 text-[8px] text-red-500 underline uppercase tracking-widest">Remover</button>
                                                </div>
                                            )}
                                            
                                            <div className="error-placeholder hidden w-full h-full flex flex-col items-center justify-center absolute inset-0 bg-gray-50 text-gray-400">
                                                <AlertCircle size={24} className="mb-2 text-amber-500" />
                                                <span className="text-[9px] font-bold uppercase tracking-widest">Falha no carregamento</span>
                                                <button onClick={() => deleteImage(idx)} className="mt-2 text-[8px] text-red-500 underline uppercase tracking-widest">Remover</button>
                                            </div>

                                            <div className="absolute inset-0 pointer-events-none z-10">
                                                <div className="absolute inset-4 border border-dashed border-white/80 shadow-sm"></div>
                                                <div className="absolute inset-4 border border-dashed border-black/20"></div>
                                            </div>
                                        </div>

                                        {hasImage ? (
                                            <button 
                                                onClick={() => { setEditingIndex(idx); setView('editor'); }} 
                                                className="mt-auto w-full py-4 bg-white border border-[#1d1d1f] text-[#1d1d1f] rounded-md font-bold text-[10px] uppercase tracking-[0.2em] hover:bg-[#1d1d1f] hover:text-white transition-all flex items-center justify-center gap-2 active:scale-95"
                                            >
                                                <Wand2 size={14}/> Editar
                                            </button>
                                        ) : (
                                             <button 
                                                onClick={() => deleteImage(idx)} 
                                                className="mt-auto w-full py-4 bg-red-50 border border-red-100 text-red-500 rounded-md font-bold text-[10px] uppercase tracking-[0.2em] hover:bg-red-100 transition-all flex items-center justify-center gap-2 active:scale-95"
                                            >
                                                <Trash2 size={14}/> Remover
                                            </button>
                                        )}
                                    </div>
                                );
                            } else {
                                return (
                                    <button 
                                        key={idx}
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isProcessing}
                                        className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-[#B8860B] hover:text-[#B8860B] hover:bg-white transition-all group bg-gray-50/30 shadow-sm hover:shadow-md disabled:cursor-wait disabled:opacity-50"
                                    >
                                        <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                            {isProcessing ? <Loader2 size={24} className="animate-spin text-[#B8860B]"/> : <Plus size={24} />}
                                        </div>
                                        <span className="font-bold text-[10px] tracking-[0.2em] uppercase">
                                            {isProcessing ? 'Processando...' : 'Adicionar Foto'}
                                        </span>
                                        <span className="text-[8px] text-gray-300 mt-2 font-bold uppercase tracking-wide opacity-0 group-hover:opacity-100 transition-opacity">50x50mm</span>
                                    </button>
                                );
                            }
                        })}
                    </div>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        hidden 
                        multiple 
                        accept="image/*,.heic,.heif" 
                        onChange={handleFileUpload} 
                    />
                    <div className="h-24" />
                </div>

                <div className="p-6 bg-white border-t border-gray-100 sticky bottom-0 z-40 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
                    
                    {/* Finalize Progress Loader */}
                    {isProcessing && (
                        <div className="mb-4 animate-fade-in">
                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-2 text-[#1d1d1f]">
                                <span>{processingMessage}</span>
                                <span>{progress.current}/{progress.total}</span>
                            </div>
                            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden border border-gray-100">
                                <div 
                                    className="h-full bg-[#B8860B] transition-all duration-300 ease-out shadow-[0_0_10px_#B8860B]" 
                                    style={{ width: `${(progress.current / progress.total) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    )}

                    <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="w-full md:w-auto flex-1">
                             <div className="flex justify-between items-end mb-2">
                                <span className="text-[10px] font-bold text-[#86868b] uppercase tracking-[0.2em]">Progresso do Kit</span>
                                <span className="text-[10px] font-bold text-[#1d1d1f]">{images.length} de {targetCount} fotos</span>
                             </div>
                             <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-[#B8860B] transition-all duration-500 ease-out" style={{ width: `${(images.length / targetCount) * 100}%` }}></div>
                             </div>
                        </div>
                        <button 
                            onClick={handleFinalize}
                            disabled={isProcessing}
                            className={`w-full md:w-auto md:px-12 py-4 rounded-md font-bold text-xs uppercase tracking-[0.2em] shadow-xl transition-all flex items-center justify-center gap-3 active:scale-95 ${images.length === targetCount ? 'bg-[#1d1d1f] text-white hover:bg-black' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                        >
                            {isProcessing ? (
                                <div className="flex items-center gap-3"><Loader2 size={16} className="animate-spin" /> Processando...</div>
                            ) : isAdminMode ? (
                                <><Save size={16} /> Salvar Alterações (Admin)</>
                            ) : (
                                <><ShoppingBag size={16} /> {images.length < targetCount ? `Adicione +${targetCount - images.length} Fotos` : 'Finalizar Kit'}</>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (view === 'editor' && editingIndex !== null) {
        const item = images[editingIndex];
        const imageSrc = item.originalUrl || item.backupSrc || item.croppedUrl;
        const hasImage = !!imageSrc;
        const filterPreviewSrc = item.croppedUrl || imageSrc;

        return (
            <div className="min-h-screen bg-white flex flex-col animate-fade-in overflow-hidden select-none">
                <div className={`h-16 border-b border-gray-100 px-6 flex justify-between items-center shrink-0 ${adminDraftUser ? 'mt-12' : ''}`}>
                    <div className="flex items-center gap-4">
                         <button onClick={() => setView('gallery')} className="p-2 hover:bg-gray-100 rounded-md transition-colors"><ChevronLeft size={20} className="text-[#1d1d1f]" /></button>
                         <span className="font-serif font-bold text-[#1d1d1f] text-lg">Editor • 50x50mm</span>
                    </div>
                    <button onClick={() => setView('gallery')} className="px-8 py-2 bg-[#1d1d1f] text-white rounded-md font-bold text-[10px] uppercase tracking-widest hover:bg-black transition-all">Concluir</button>
                </div>

                <div className="flex-1 relative flex flex-col items-center justify-center bg-[#F5F5F7] p-4 md:p-8">
                    <div className="relative w-full max-w-sm md:max-w-md aspect-square bg-white shadow-2xl rounded-sm overflow-hidden cursor-move touch-none border-8 border-white"
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        onTouchStart={handleMouseDown}
                        onTouchMove={handleMouseMove}
                        onTouchEnd={handleMouseUp}
                    >
                        {hasImage ? (
                            <img 
                                key={imageSrc} /* RESET DOM IF SRC CHANGES */
                                src={imageSrc} 
                                draggable={false}
                                className="w-full h-full object-cover pointer-events-none transition-all duration-200" 
                                style={{ 
                                    filter: getCombinedFilter(item),
                                    transformOrigin: 'center',
                                    transform: `translate(${item.cropData?.x || 0}px, ${item.cropData?.y || 0}px) rotate(${item.cropData?.rotation || 0}deg) scale(${item.cropData?.zoom || 1})`,
                                    imageRendering: 'high-quality' as any 
                                }}
                                onError={(e) => {
                                    const target = e.currentTarget;
                                    if (item.croppedUrl && !target.src.includes(item.croppedUrl)) {
                                        target.src = item.croppedUrl;
                                    } else {
                                        target.style.display = 'none';
                                        target.parentElement?.querySelector('.fallback-icon')?.classList.remove('hidden');
                                    }
                                }}
                            />
                        ) : null}
                        
                        <div className={`fallback-icon w-full h-full flex items-center justify-center text-gray-300 absolute inset-0 bg-white z-0 ${hasImage ? 'hidden' : ''}`}>
                            <ImageIcon size={48} />
                        </div>

                        <div className="absolute inset-5 border-2 border-dashed border-white pointer-events-none rounded-sm shadow-sm z-10">
                             <div className="absolute -inset-[2px] border border-black/20 pointer-events-none"></div>
                        </div>
                    </div>
                    <p className="mt-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <Info size={12} /> Arraste para ajustar o enquadramento
                    </p>
                </div>

                <div className="bg-white border-t border-gray-100 p-6 md:p-10 shadow-2xl z-20">
                    <div className="max-w-3xl mx-auto">
                        <div className="flex justify-center gap-4 md:gap-10 mb-6 border-b border-gray-50 pb-4">
                            {[
                                { id: 'crop', label: 'Corte', icon: CropIcon },
                                { id: 'adjust', label: 'Ajustes', icon: Sliders },
                                { id: 'filters', label: 'Estilos', icon: Wand2 },
                            ].map(tab => (
                                <button key={tab.id} onClick={() => setEditTab(tab.id as any)} className={`flex flex-col items-center gap-2 px-6 py-2 transition-all relative ${editTab === tab.id ? 'text-[#B8860B]' : 'text-gray-400 hover:text-[#1d1d1f]'}`}>
                                    <tab.icon size={20} />
                                    <span className="text-[9px] font-bold uppercase tracking-[0.2em]">{tab.label}</span>
                                    {editTab === tab.id && <div className="absolute bottom-0 w-6 h-0.5 bg-[#B8860B] rounded-full"></div>}
                                </button>
                            ))}
                        </div>
                        <div className="h-40 flex flex-col justify-center">
                            {editTab === 'adjust' && (
                                <div className="animate-fade-in space-y-6">
                                    <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                                        {ADJUSTMENT_TOOLS.map(tool => (
                                            <button key={tool.id} onClick={() => setActiveToolId(tool.id as any)} className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-md border text-[10px] font-bold uppercase tracking-widest transition-all ${activeToolId === tool.id ? 'bg-[#1d1d1f] text-white border-[#1d1d1f]' : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200'}`}>
                                                <tool.icon size={12} /> {tool.label}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <input type="range" min={ADJUSTMENT_TOOLS.find(t => t.id === activeToolId)?.min} max={ADJUSTMENT_TOOLS.find(t => t.id === activeToolId)?.max} value={item.adjustments?.[activeToolId] || 100} onChange={e => updateAdjustment(activeToolId, parseInt(e.target.value))} className="flex-1 h-1.5 bg-gray-100 appearance-none rounded-full accent-[#B8860B] cursor-pointer" />
                                    </div>
                                </div>
                            )}
                            {editTab === 'filters' && (
                                <div className="animate-fade-in flex gap-5 overflow-x-auto scrollbar-hide py-2 px-2">
                                    {FILTERS.map(f => (
                                        <button key={f.name} onClick={() => updateEditingItem({ filter: f.name })} className={`shrink-0 flex flex-col items-center gap-3 group transition-all`}>
                                            <div className={`w-16 h-16 rounded-md overflow-hidden border-2 transition-all shadow-sm ${item.filter === f.name ? 'border-[#B8860B] scale-110 shadow-lg' : 'border-white group-hover:border-gray-200'}`}>
                                                {hasImage && (
                                                    <img 
                                                        src={filterPreviewSrc} 
                                                        className="w-full h-full object-cover" 
                                                        style={{ filter: f.filter }} 
                                                        onError={(e) => e.currentTarget.style.display = 'none'} 
                                                    />
                                                )}
                                            </div>
                                            <span className={`text-[8px] font-bold uppercase tracking-[0.2em] ${item.filter === f.name ? 'text-[#B8860B]' : 'text-gray-400 group-hover:text-[#1d1d1f]'}`}>{f.name}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                            {editTab === 'crop' && (
                                <div className="animate-fade-in flex items-center justify-between gap-10 px-4">
                                    <button onClick={() => updateEditingItem({ cropData: { ...item.cropData!, rotation: (item.cropData?.rotation || 0) - 90 } })} className="p-3 bg-gray-50 hover:bg-gray-100 rounded-md border border-gray-100"><RotateCcw size={18} /></button>
                                    <input type="range" min="0.5" max="4" step="0.01" value={item.cropData?.zoom || 1} onChange={e => updateEditingItem({ cropData: { ...item.cropData!, zoom: parseFloat(e.target.value) } })} className="flex-1 h-1.5 bg-gray-100 appearance-none rounded-full accent-[#1d1d1f] cursor-pointer" />
                                    <button onClick={() => updateEditingItem({ cropData: { ...item.cropData!, rotation: (item.cropData?.rotation || 0) + 90 } })} className="p-3 bg-gray-50 hover:bg-gray-100 rounded-md border border-gray-100"><RotateCcw size={18} className="scale-x-[-1]" /></button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (view === 'success') {
        return (
            <div className="min-h-screen bg-black/50 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in">
                <div className="bg-white w-full max-w-md rounded-md shadow-2xl p-10 md:p-16 flex flex-col items-center text-center">
                    <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mb-10 shadow-inner">
                        <CheckCircle size={44} />
                    </div>
                    <h2 className="text-4xl font-serif text-[#1d1d1f] mb-4">Kit Finalizado com Sucesso</h2>
                    <p className="text-base text-[#86868b] mb-12 font-light">Seu conjunto de memórias está pronto.</p>
                    
                    <div className="w-full bg-[#F5F5F7] p-4 rounded-md mb-8 flex items-center gap-4 text-left border border-gray-100 hover:border-[#B8860B]/30 transition-colors">
                        <button onClick={() => setSocialConsent(!socialConsent)} className="shrink-0 focus:outline-none">
                            {socialConsent ? <ToggleRight className="text-[#1d1d1f]" size={28} /> : <ToggleLeft className="text-gray-300" size={28} />}
                        </button>
                        <p className="text-[10px] text-[#1d1d1f] font-bold uppercase tracking-wide leading-relaxed">Permito que minhas fotos sejam usadas em conteúdos da Magneto.</p>
                    </div>

                    <div className="w-full space-y-4">
                        <button 
                            onClick={() => commitToCart(null)}
                            className="w-full py-5 bg-gray-50 text-[#1d1d1f] font-bold text-[10px] uppercase tracking-[0.2em] rounded-md hover:bg-gray-100 border border-gray-100 transition-all"
                        >
                            Montar Outro Kit
                        </button>
                        <button 
                            onClick={() => commitToCart('/cart')}
                            className="w-full py-5 bg-[#B8860B] text-white font-bold text-[10px] uppercase tracking-[0.2em] rounded-md shadow-xl hover:bg-[#966d09] flex items-center justify-center gap-3 transition-all"
                        >
                            Ir para o Carrinho <ArrowRight size={16}/>
                        </button>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};

export default Studio;
