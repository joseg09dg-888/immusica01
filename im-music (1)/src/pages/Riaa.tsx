import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Shield, Award, TrendingUp, Star, Music } from 'lucide-react';
import { getRiaaCertifications } from '../services/api';

const Riaa: React.FC = () => {
  const [certs, setCerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRiaaCertifications()
      .then(res => setCerts(res.data.certifications || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const getCertColor = (type: string) => {
    switch (type) {
      case 'Gold': return 'text-amber-400 border-amber-400/20 bg-amber-400/5';
      case 'Platinum': return 'text-slate-300 border-slate-300/20 bg-slate-300/5';
      case 'Multi-Platinum': return 'text-cyber-cyan border-cyber-cyan/20 bg-cyber-cyan/5';
      case 'Diamond': return 'text-neon-pink border-neon-pink/20 bg-neon-pink/5';
      default: return 'text-white border-white/20 bg-white/5';
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 bg-ink relative overflow-hidden">
      <div className="max-w-7xl mx-auto space-y-12 relative z-10">
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-amber-400">
            <Shield size={24} />
            <span className="text-xs font-black uppercase tracking-[0.3em]">Certification Tracker</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-display font-black tracking-tighter uppercase italic">
            RIAA <span className="text-white outline-text">Certifications</span>
          </h1>
          <p className="text-white/40 max-w-xl text-lg">
            Seguimiento automático de tus logros. Calculamos tus streams y ventas para determinar tu estatus de Oro, Platino y Diamante.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading ? (
            [1,2,3].map(i => (
              <div key={i} className="glass-card p-10 h-64 animate-pulse bg-white/5" />
            ))
          ) : certs.length === 0 ? (
            <div className="col-span-full py-20 text-center glass-card border-dashed border-white/10">
              <Award size={48} className="mx-auto text-white/10 mb-4" />
              <p className="text-white/20 font-black uppercase tracking-widest">No hay certificaciones aún. ¡Sigue rompiéndola!</p>
            </div>
          ) : (
            certs.map((cert, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className={`glass-card p-10 border relative overflow-hidden group ${getCertColor(cert.type)}`}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-current opacity-5 blur-3xl rounded-full -mr-16 -mt-16" />
                
                <div className="space-y-8 relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
                      <Award size={32} />
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Status</p>
                      <p className="text-xl font-display font-black italic uppercase">{cert.type}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-2xl font-display font-black uppercase tracking-tight italic text-white leading-tight">
                      Artist Milestone
                    </h3>
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-40">
                      <Music size={12} />
                      <span>{cert.artist_name || 'Neural Rebel'}</span>
                    </div>
                  </div>

                  <div className="pt-8 border-t border-white/5 flex items-end justify-between">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Total Streams</p>
                      <p className="text-2xl font-display font-black italic text-white">
                        {(cert.threshold / 1000000).toFixed(1)}M
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-emerald-400">
                      <Star size={14} fill="currentColor" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Verified</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Requirements Table */}
        <div className="glass-card p-8 border-white/5 bg-white/[0.01]">
          <h3 className="text-sm font-black uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
            <TrendingUp size={18} className="text-cyber-cyan" />
            <span>Certification Requirements</span>
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: 'Gold', value: '500K Units' },
              { label: 'Platinum', value: '1M Units' },
              { label: 'Multi-Platinum', value: '2M+ Units' },
              { label: 'Diamond', value: '10M Units' },
            ].map((req, i) => (
              <div key={i} className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/20">{req.label}</p>
                <p className="text-xl font-display font-black italic text-white">{req.value}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-[10px] text-white/20 font-medium italic">
            * 1 Unit = 1 Sale or 150 On-Demand Streams.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Riaa;
