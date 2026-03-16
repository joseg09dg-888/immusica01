import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Music, CheckCircle2, ExternalLink, AlertCircle, Zap } from 'lucide-react';
import { getSpotifyAuthUrl, checkSpotifyStatus } from '../services/api';
import { toast } from 'sonner';

const SpotifyVerify: React.FC = () => {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await checkSpotifyStatus();
      setStatus(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      const res = await getSpotifyAuthUrl();
      if (res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (error) {
      toast.error('Error al iniciar autenticación con Spotify');
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 bg-ink relative overflow-hidden">
      <div className="max-w-4xl mx-auto space-y-12 relative z-10">
        <div className="text-center space-y-6">
          <div className="w-24 h-24 bg-emerald-500/10 rounded-[40px] flex items-center justify-center text-emerald-500 mx-auto border border-emerald-500/20 shadow-2xl shadow-emerald-500/10">
            <Music size={48} />
          </div>
          <div className="space-y-2">
            <h1 className="text-5xl md:text-7xl font-display font-black tracking-tighter uppercase italic">
              Spotify <span className="text-white outline-text">Verification</span>
            </h1>
            <p className="text-white/40 text-lg max-w-2xl mx-auto">
              Vincula tu perfil de artista oficial y desbloquea el estatus de verificación neural.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="glass-card p-12 animate-pulse bg-white/5" />
        ) : status?.spotify_verified ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-12 border-emerald-500/20 bg-emerald-500/[0.02] text-center space-y-8"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center text-ink shadow-xl shadow-emerald-500/20">
                <CheckCircle2 size={40} />
              </div>
              <h2 className="text-3xl font-display font-black uppercase tracking-tight italic text-emerald-500">
                Verified Artist
              </h2>
            </div>
            
            <div className="p-6 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-between max-w-md mx-auto">
              <div className="text-left">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Spotify ID</p>
                <p className="font-mono text-sm text-white">{status.spotify_id}</p>
              </div>
              <a 
                href={`https://open.spotify.com/artist/${status.spotify_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-white/40 hover:text-white"
              >
                <ExternalLink size={18} />
              </a>
            </div>

            <p className="text-white/40 text-sm">
              Tu cuenta está vinculada correctamente. Ahora puedes acceder a analíticas avanzadas y herramientas de promoción directa.
            </p>
          </motion.div>
        ) : (
          <div className="glass-card p-12 border-white/5 bg-white/[0.02] space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { icon: Zap, title: 'Instant Sync', desc: 'Sincroniza tus lanzamientos automáticamente.' },
                { icon: CheckCircle2, title: 'Elite Status', desc: 'Obtén el check azul en nuestro ecosistema.' },
                { icon: ExternalLink, title: 'Direct Access', desc: 'Gestiona tu perfil de Spotify for Artists.' },
              ].map((item, i) => (
                <div key={i} className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-cyber-cyan">
                    <item.icon size={24} />
                  </div>
                  <h3 className="font-display font-black uppercase tracking-tight italic text-white">{item.title}</h3>
                  <p className="text-xs text-white/40 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="pt-12 border-t border-white/5 flex flex-col items-center gap-6">
              <button 
                onClick={handleConnect}
                className="w-full max-w-md py-6 bg-emerald-500 text-ink rounded-[24px] font-black uppercase tracking-[0.4em] text-xs hover:scale-105 transition-all shadow-2xl shadow-emerald-500/20 flex items-center justify-center gap-4"
              >
                <Music size={20} />
                <span>Connect with Spotify</span>
              </button>
              <div className="flex items-center gap-2 text-white/20">
                <AlertCircle size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">Secure OAuth2 Connection</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpotifyVerify;
