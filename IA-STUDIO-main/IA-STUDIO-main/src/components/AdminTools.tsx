import React, { useState, useRef } from 'react';
import { Upload, Copy, Check, Image as ImageIcon, Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const AdminTools: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ImgBB API Key (Natalia can get her own for free at api.imgbb.com)
  // For now, I'll use a placeholder logic. 
  // IMPORTANT: She should get her own API key and put it in Vercel as VITE_IMGBB_API_KEY
  const IMGBB_API_KEY = (import.meta as any).env?.VITE_IMGBB_API_KEY || '';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setResultUrl(null);
      setError(null);
    }
  };

  const convertToWebP = async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0);
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Error al convertir a WebP'));
          }, 'image/webp', 0.8);
        };
      };
    });
  };

  const handleUpload = async () => {
    if (!file) return;
    if (!IMGBB_API_KEY) {
      setError('Configura la API Key de ImgBB en Vercel para subir fotos.');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // 1. Convert to WebP
      const webpBlob = await convertToWebP(file);
      
      // 2. Prepare for Upload
      const formData = new FormData();
      formData.append('image', webpBlob, 'imagen.webp');

      // 3. Upload to ImgBB
      const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        setResultUrl(data.data.url);
      } else {
        throw new Error(data.error.message || 'Error al subir');
      }
    } catch (err) {
      setError('Error al procesar la imagen. Intenta de nuevo.');
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const copyToClipboard = () => {
    if (resultUrl) {
      navigator.clipboard.writeText(resultUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60]"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl p-8 z-[70] shadow-2xl"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-violet-500" />
                Herramientas de Nath
              </h2>
              <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${
                  preview ? 'border-violet-500/50 bg-violet-500/5' : 'border-zinc-800 hover:border-zinc-700 bg-zinc-950/50'
                }`}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/*" 
                  className="hidden" 
                />
                
                {preview ? (
                  <div className="relative w-full aspect-video rounded-lg overflow-hidden">
                    <img src={preview} alt="Preview" className="w-full h-full object-contain" />
                  </div>
                ) : (
                  <>
                    <Upload className="w-10 h-10 text-zinc-600 mb-4" />
                    <p className="text-zinc-400 font-medium">Toca para elegir una foto</p>
                    <p className="text-zinc-600 text-xs mt-2">Se convertirá a WebP automáticamente</p>
                  </>
                )}
              </div>

              {file && !resultUrl && (
                <button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="w-full bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-800 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      PROCESANDO...
                    </>
                  ) : (
                    'SUBIR Y OBTENER LINK'
                  )}
                </button>
              )}

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
                  {error}
                </div>
              )}

              {resultUrl && (
                <div className="space-y-4">
                  <div className="p-4 bg-zinc-950 rounded-xl border border-violet-500/30">
                    <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold mb-2">Enlace para el Excel:</p>
                    <div className="flex items-center gap-3">
                      <code className="flex-1 text-violet-400 text-xs truncate">{resultUrl}</code>
                      <button 
                        onClick={copyToClipboard}
                        className="p-2 bg-violet-600 rounded-lg hover:bg-violet-500 transition-all"
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <p className="text-center text-zinc-500 text-xs">
                    ¡Copiado! Ahora pégalo en la Columna D de tu Excel.
                  </p>
                </div>
              )}
            </div>

            {!IMGBB_API_KEY && (
              <p className="mt-6 text-[10px] text-zinc-600 text-center uppercase tracking-widest">
                Nota: Debes configurar VITE_IMGBB_API_KEY en Vercel
              </p>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
