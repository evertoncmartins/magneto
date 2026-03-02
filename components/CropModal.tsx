import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Check, ZoomIn, ZoomOut } from 'lucide-react';

interface CropModalProps {
  imageUrl: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (croppedBase64: string) => void;
}

const CropModal: React.FC<CropModalProps> = ({ imageUrl, isOpen, onClose, onSave }) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
    }
  }, [isOpen, imageUrl]);

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    setDragStart({ x: clientX - pan.x, y: clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    setPan({ x: clientX - dragStart.x, y: clientY - dragStart.y });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const generateCrop = useCallback(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const outputSize = 500;
    canvas.width = outputSize;
    canvas.height = outputSize;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, outputSize, outputSize);

    const centerX = outputSize / 2;
    const centerY = outputSize / 2;
    
    // Assuming visual preview box is 256x256.
    const previewSize = 256;
    const scaleFactor = outputSize / previewSize;
    
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.translate(pan.x * scaleFactor, pan.y * scaleFactor);
    ctx.scale(zoom, zoom);
    
    const renderWidth = image.naturalWidth;
    const renderHeight = image.naturalHeight;
    const aspect = renderWidth / renderHeight;
    let initialDrawWidth, initialDrawHeight;
    
    if (aspect > 1) {
        initialDrawHeight = outputSize;
        initialDrawWidth = outputSize * aspect;
    } else {
        initialDrawWidth = outputSize;
        initialDrawHeight = outputSize / aspect;
    }

    ctx.drawImage(
      image, 
      -initialDrawWidth / 2, 
      -initialDrawHeight / 2, 
      initialDrawWidth, 
      initialDrawHeight
    );
    
    ctx.restore();

    const base64 = canvas.toDataURL('image/jpeg', 0.9);
    onSave(base64);
  }, [pan, zoom, onSave]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-md p-4">
      <div className="bg-white border border-gray-200 shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-black text-sm uppercase tracking-wide">Ajustar Corte</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 p-8 flex flex-col items-center justify-center bg-gray-50 relative">
          <div 
            ref={containerRef}
            className="relative w-64 h-64 bg-gray-200 overflow-hidden shadow-sm border border-black cursor-move"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleMouseDown}
            onTouchMove={handleMouseMove}
            onTouchEnd={handleMouseUp}
          >
            {/* Minimal Grid */}
            <div className="absolute inset-0 z-10 pointer-events-none opacity-20 grid grid-cols-3 grid-rows-3">
                <div className="border-r border-b border-black"></div>
                <div className="border-r border-b border-black"></div>
                <div className="border-b border-black"></div>
                <div className="border-r border-b border-black"></div>
                <div className="border-r border-b border-black"></div>
                <div className="border-b border-black"></div>
                <div className="border-r border-black"></div>
                <div className="border-r border-black"></div>
                <div></div>
            </div>

            <img
              ref={imageRef}
              src={imageUrl}
              alt="Crop target"
              className="absolute max-w-none select-none pointer-events-none grayscale"
              style={{
                top: '50%',
                left: '50%',
                height: '100%', 
                width: 'auto',
                transform: `translate(-50%, -50%) translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              }}
              onLoad={(e) => {
                 const img = e.currentTarget;
                 if (img.naturalWidth < img.naturalHeight) {
                     img.style.width = '100%';
                     img.style.height = 'auto';
                 } else {
                     img.style.height = '100%';
                     img.style.width = 'auto';
                 }
              }}
            />
          </div>

          <div className="mt-8 w-full px-4 flex items-center gap-4">
            <ZoomOut size={16} className="text-gray-400" />
            <input
              type="range"
              min="1"
              max="3"
              step="0.1"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-full h-1 bg-gray-300 appearance-none cursor-pointer accent-black"
            />
            <ZoomIn size={16} className="text-gray-400" />
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 bg-white flex justify-end gap-4">
          <button 
            onClick={onClose}
            className="px-6 py-2 text-gray-500 font-medium hover:text-black transition-colors text-sm"
          >
            CANCELAR
          </button>
          <button 
            onClick={generateCrop}
            className="px-6 py-2 bg-black text-white font-medium hover:bg-gray-800 transition-all text-sm flex items-center gap-2"
          >
            <Check size={16} />
            CONFIRMAR
          </button>
        </div>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default CropModal;