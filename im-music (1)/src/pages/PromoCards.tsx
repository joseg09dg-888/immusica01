import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  Image as ImageIcon, Download, Share2, 
  Layers, Palette, Type, Sparkles,
  RefreshCw, Music, Zap
} from 'lucide-react';
import { getTracks } from '../services/api';
import { toast } from 'sonner';

const PromoCards: React.FC = () => {
  const [tracks, setTracks] = useState<any[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [options, setOptions] = useState({
    theme: 'dark',
    showTitle: true,
    showArtist: true,
    accentColor: '#00F0FF',
    fontSize: 48
  });

  useEffect(() => {
    fetchTracks();
  }, []);

  useEffect(() => {
    if (selectedTrack) {
      generatePreview();
    }
  }, [selectedTrack, options]);

  const fetchTracks = async () => {
    try {
      const res = await getTracks();
      setTracks(res.data);
      if (res.data.length > 0) setSelectedTrack(res.data[0]);
    } catch (err) {
      toast.error('Error al cargar tracks');
    } finally {
      setLoading(false);
    }
  };

  const generatePreview = () => {
    const canvas = canvasRef.current;
    if (!canvas || !selectedTrack) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear and set background
    ctx.fillStyle = options.theme === 'dark' ? '#050505' : '#F5F5F5';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add some artistic elements (gradients/glows)
    const gradient = ctx.createRadialGradient(
      canvas.width / 2, canvas.height / 2, 0,
      canvas.width / 2, canvas.height / 2, canvas.width
    );
    gradient.addColorStop(0, `${options.accentColor}22`);
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Track Art Placeholder or Image
    const drawContent = () => {
      ctx.save();
      
      // Text Styling
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      if (options.showTitle) {
        ctx.font = `900 ${options.fontSize}px "Inter"`;
        ctx.fillStyle = options.theme === 'dark' ? '#FFFFFF' : '#050505';
        ctx.fillText(selectedTrack.title.toUpperCase(), canvas.width / 2, canvas.height / 2 - 20);
      }

      if (options.showArtist) {
        ctx.font = `700 ${options.fontSize / 2}px "Inter"`;
        ctx.fillStyle = options.accentColor;
        ctx.fillText(selectedTrack.artist_name?.toUpperCase() || 'ARTIST', canvas.width / 2, canvas.height / 2 + 40);
      }

      // Branding
      ctx.font = '900 12px "Inter"';
      ctx.fillStyle = options.theme === 'dark' ? '#FFFFFF22' : '#00000022';
      ctx.fillText('IM MUSIC NEURAL NETWORK', canvas.width / 2, canvas.height - 40);

      ctx.restore();
    };

    if (selectedTrack.cover_url) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = selectedTrack.cover_url;
      img.onload = () => {
        // Draw blurred background
        ctx.globalAlpha = 0.2;
        ctx.drawImage(img, -100, -100, canvas.width + 200, canvas.height + 200);
        ctx.globalAlpha = 1.0;
        
        // Draw centered cover
        const size = 400;
        ctx.drawImage(img, (canvas.width - size) / 2, (canvas.height - size) / 2 - 100, size, size);
        drawContent();
      };
    } else {
      drawContent();
    }
  };

  const downloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `promo-${selectedTrack?.title || 'card'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    toast.success('Imagen descargada');
  };

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 bg-ink relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-cyber-cyan/5 blur-[150px] rounded-full -mr-64 -mt-64 animate-pulse-glow" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-neon-pink/5 blur-[150px] rounded-full -ml-64 -mb-64 animate-pulse-glow" />

      <div className="max-w-7xl mx-auto space-y-16 relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12">
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyber-cyan/10 border border-cyber-cyan/20 text-cyber-cyan text-[10px] font-black uppercase tracking-widest"
            >
              <Layers size={12} className="animate-pulse" />
              <span>Visual Asset Generator</span>
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-6xl lg:text-9xl font-display font-black tracking-tighter uppercase leading-[0.85] italic"
            >
              Promo <br />
              <span className="text-cyber-cyan">Cards</span>
            </motion.h1>
            <p className="text-white/40 text-lg max-w-xl font-medium leading-relaxed">
              Genera activos visuales profesionales para tus redes sociales. Personaliza colores, tipografía y contenido en segundos.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Controls */}
          <div className="lg:col-span-4 space-y-8">
            <div className="glass-card p-8 border-white/5 bg-white/[0.02] space-y-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
                  <Music size={12} /> Seleccionar Track
                </label>
                <select 
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-cyber-cyan transition-all"
                  value={selectedTrack?.id || ''}
                  onChange={e => setSelectedTrack(tracks.find(t => t.id === parseInt(e.target.value)))}
                >
                  {tracks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                </select>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
                  <Palette size={12} /> Personalización
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setOptions({...options, theme: 'dark'})}
                    className={`p-4 rounded-2xl border transition-all text-[10px] font-black uppercase tracking-widest ${
                      options.theme === 'dark' ? 'bg-white/10 border-cyber-cyan text-cyber-cyan' : 'bg-white/5 border-white/5 text-white/40'
                    }`}
                  >
                    Dark
                  </button>
                  <button 
                    onClick={() => setOptions({...options, theme: 'light'})}
                    className={`p-4 rounded-2xl border transition-all text-[10px] font-black uppercase tracking-widest ${
                      options.theme === 'light' ? 'bg-white/10 border-cyber-cyan text-cyber-cyan' : 'bg-white/5 border-white/5 text-white/40'
                    }`}
                  >
                    Light
                  </button>
                </div>
                <input 
                  type="color"
                  className="w-full h-12 bg-transparent border-none cursor-pointer"
                  value={options.accentColor}
                  onChange={e => setOptions({...options, accentColor: e.target.value})}
                />
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
                  <Type size={12} /> Tipografía
                </label>
                <input 
                  type="range"
                  min="24"
                  max="120"
                  className="w-full accent-cyber-cyan"
                  value={options.fontSize}
                  onChange={e => setOptions({...options, fontSize: parseInt(e.target.value)})}
                />
              </div>

              <button 
                onClick={downloadImage}
                className="w-full py-5 bg-cyber-cyan text-ink rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-3 shadow-lg shadow-cyber-cyan/20"
              >
                <Download size={18} />
                Descargar PNG
              </button>
            </div>
          </div>

          {/* Preview */}
          <div className="lg:col-span-8 flex items-center justify-center bg-black/40 rounded-[40px] border border-white/5 p-12 relative overflow-hidden group">
            <div className="absolute inset-0 bg-cyber-cyan/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <canvas 
              ref={canvasRef}
              width={1080}
              height={1080}
              className="max-w-full h-auto rounded-2xl shadow-2xl shadow-black/50 border border-white/10"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromoCards;
