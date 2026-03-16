import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Radio, ShieldCheck, Youtube, DollarSign, Plus, CheckCircle2 } from 'lucide-react';
import { getYoutubeRegistrations, registerYoutubeContentId, getTracks } from '../services/api';
import { toast } from 'sonner';

const YoutubeCID: React.FC = () => {
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([getYoutubeRegistrations(), getTracks()])
      .then(([regRes, trackRes]) => {
        setRegistrations(regRes.data);
        setTracks(trackRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleRegister = async (trackId: number) => {
    setRegistering(trackId);
    try {
      await registerYoutubeContentId(trackId);
      toast.success('Track registrado en Content ID');
      const regRes = await getYoutubeRegistrations();
      setRegistrations(regRes.data);
    } catch (error) {
      toast.error('Error al registrar track');
    } finally {
      setRegistering(null);
    }
  };

  const isRegistered = (trackId: number) => {
    return registrations.some(r => r.track_id === trackId);
  };

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 bg-ink relative overflow-hidden">
      <div className="max-w-7xl mx-auto space-y-12 relative z-10">
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-red-500">
            <Youtube size={24} />
            <span className="text-xs font-black uppercase tracking-[0.3em]">Monetization Engine</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-display font-black tracking-tighter uppercase italic">
            YouTube <span className="text-white outline-text">Content ID</span>
          </h1>
          <p className="text-white/40 max-w-xl text-lg">
            Protege y monetiza tu música. Registra tus tracks en el sistema de Content ID para reclamar ingresos de cualquier video que use tu audio.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Stats Summary */}
          <div className="lg:col-span-1 space-y-6">
            <div className="glass-card p-8 border-red-500/20 bg-red-500/[0.02] space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Registrations</p>
                  <p className="text-3xl font-display font-black italic text-white">{registrations.length}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <DollarSign size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Estimated Revenue</p>
                  <p className="text-3xl font-display font-black italic text-white">$0.00</p>
                </div>
              </div>
            </div>

            <div className="glass-card p-8 border-white/5 bg-white/[0.01] space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-white/40">How it works</h4>
              <ul className="space-y-4">
                {[
                  'Escaneo global de YouTube.',
                  'Reclamación automática de ingresos.',
                  'Protección contra piratería.',
                  'Reportes detallados de uso.'
                ].map((text, i) => (
                  <li key={i} className="flex items-start gap-3 text-xs text-white/60">
                    <CheckCircle2 size={14} className="text-red-500 mt-0.5" />
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Tracks List */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-sm font-black uppercase tracking-[0.3em] flex items-center gap-3">
              <Radio size={18} className="text-cyber-cyan" />
              <span>Your Catalog</span>
            </h3>

            <div className="space-y-4">
              {loading ? (
                [1,2,3].map(i => (
                  <div key={i} className="glass-card p-6 h-24 animate-pulse bg-white/5" />
                ))
              ) : tracks.length === 0 ? (
                <div className="glass-card p-12 text-center border-dashed border-white/10">
                  <p className="text-white/20 font-black uppercase tracking-widest">No tracks found in your catalog</p>
                </div>
              ) : (
                tracks.map((track) => (
                  <div 
                    key={track.id}
                    className="glass-card p-6 flex items-center justify-between group hover:bg-white/5 transition-all border-white/5"
                  >
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 rounded-xl bg-white/5 overflow-hidden relative">
                        {track.cover_url ? (
                          <img src={track.cover_url} alt={track.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white/10">
                            <Youtube size={24} />
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-lg">{track.title}</h4>
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/20">{track.isrc || 'No ISRC'}</p>
                      </div>
                    </div>

                    {isRegistered(track.id) ? (
                      <div className="flex items-center gap-3 px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
                        <CheckCircle2 size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Active CID</span>
                      </div>
                    ) : (
                      <button 
                        onClick={() => handleRegister(track.id)}
                        disabled={registering === track.id}
                        className="flex items-center gap-3 px-6 py-3 bg-red-500 text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
                      >
                        {registering === track.id ? (
                          <span>Registering...</span>
                        ) : (
                          <>
                            <Plus size={14} />
                            <span>Register CID</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default YoutubeCID;
