import React, { useState, useEffect } from 'react';
import { getBeats, buyBeat } from '../services/api';
import { motion } from 'motion/react';
import { ShoppingBag, Music, Mic2, Headphones, Loader2, Play, DollarSign, Sparkles, Search, Filter } from 'lucide-react';
import { toast } from 'sonner';

const Marketplace: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBeats()
      .then(res => setItems(res.data))
      .catch(err => {
        console.error(err);
        toast.error('Error loading marketplace items');
      })
      .finally(() => setLoading(false));
  }, []);

  const handleBuy = async (beatId: number) => {
    try {
      await buyBeat(beatId);
      toast.success('Purchase successful');
    } catch (err: any) {
      toast.error('Error during purchase: ' + (err.response?.data?.error || err.message));
    }
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-cyber-cyan" size={48} />
    </div>
  );

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-cyber-cyan/5 blur-[120px] rounded-full -ml-64 -mt-64" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-neon-pink/5 blur-[120px] rounded-full -mr-64 -mb-64" />

      <div className="max-w-7xl mx-auto space-y-16 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-6 text-center md:text-left">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyber-cyan/10 border border-cyber-cyan/20 text-cyber-cyan text-[10px] font-black uppercase tracking-widest"
            >
              <Sparkles size={12} />
              <span>Neural Asset Marketplace</span>
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-6xl lg:text-9xl font-display font-black tracking-tighter uppercase leading-[0.85] italic"
            >
              Elite <br />
              <span className="text-cyber-cyan">Marketplace</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-white/40 font-medium tracking-wide max-w-xl text-lg"
            >
              Premium beats, samples, and professional services from the rebellion.
            </motion.p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-cyber-cyan transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Search assets..." 
                className="bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-sm font-medium focus:outline-none focus:border-cyber-cyan/40 focus:bg-white/10 transition-all w-64 md:w-80"
              />
            </div>
            <button className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-white/40 hover:bg-white/10 hover:text-white transition-all">
              <Filter size={20} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -10, scale: 1.02 }}
              className="glass-card overflow-hidden group border-white/5 bg-white/[0.02] relative"
            >
              <div className="aspect-square bg-white/5 relative flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10" />
                
                {/* Play Button Overlay */}
                <div className="absolute inset-0 flex items-center justify-center z-20 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
                  <button className="w-20 h-20 bg-cyber-cyan text-ink rounded-full flex items-center justify-center shadow-2xl shadow-cyber-cyan/40 hover:scale-110 transition-transform">
                    <Play size={32} fill="currentColor" className="ml-1" />
                  </button>
                </div>

                {/* Decorative Elements */}
                <div className="absolute top-4 right-4 z-20">
                  <div className="px-3 py-1 bg-ink/60 backdrop-blur-md rounded-full border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/60">
                    {item.type === 'beat' ? 'Exclusive' : 'Service'}
                  </div>
                </div>

                {item.type === 'beat' ? (
                  <Music size={80} className="text-white/5 group-hover:text-cyber-cyan/20 transition-colors duration-500" />
                ) : (
                  <Mic2 size={80} className="text-white/5 group-hover:text-neon-pink/20 transition-colors duration-500" />
                )}

                {/* Waveform Visualization (Static) */}
                <div className="absolute bottom-6 left-6 right-6 flex items-end gap-1 h-12 z-20 opacity-40 group-hover:opacity-100 transition-opacity">
                  {[...Array(20)].map((_, i) => (
                    <div 
                      key={i} 
                      className="flex-1 bg-white/20 rounded-full group-hover:bg-cyber-cyan/40 transition-all duration-500"
                      style={{ height: `${Math.random() * 100}%` }}
                    />
                  ))}
                </div>
              </div>

              <div className="p-10 space-y-6 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/20">{item.genero}</span>
                    <div className="w-1 h-1 rounded-full bg-white/10" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/20">{item.bpm} BPM</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-cyber-cyan font-display font-black text-2xl tracking-tighter">${item.precio / 100}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl font-display font-black uppercase tracking-tight italic group-hover:text-cyber-cyan transition-colors">{item.titulo}</h3>
                  <p className="text-white/40 text-xs font-medium">Produced by <span className="text-white/60">{item.productor}</span></p>
                </div>

                <button 
                  onClick={() => handleBuy(item.id)}
                  className="w-full py-5 bg-white/5 hover:bg-white hover:text-ink border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all shadow-xl hover:shadow-white/10"
                >
                  Purchase License
                </button>
              </div>

              {/* Hover Glow */}
              <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-cyber-cyan/5 blur-[60px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Marketplace;
