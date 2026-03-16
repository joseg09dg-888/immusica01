import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Target, Music, Send, CheckCircle2, Clock, X, Loader2, Sparkles, Zap, ArrowUpRight, MessageSquare, ArrowRight } from 'lucide-react';
import { getMyPitches, getTracks, getPlaylists, pitchToPlaylist } from '../services/api';
import { toast } from 'sonner';

const Spotlight: React.FC = () => {
  const [pitches, setPitches] = useState<any[]>([]);
  const [tracks, setTracks] = useState<any[]>([]);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPitchModal, setShowPitchModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    trackId: '',
    playlistId: '',
    message: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [pitchesRes, tracksRes, playlistsRes] = await Promise.all([
        getMyPitches(),
        getTracks(),
        getPlaylists()
      ]);
      setPitches(Array.isArray(pitchesRes.data) ? pitchesRes.data : []);
      setTracks(Array.isArray(tracksRes.data) ? tracksRes.data : []);
      setPlaylists(Array.isArray(playlistsRes.data) ? playlistsRes.data : []);
    } catch (err) {
      toast.error('Error al cargar datos de Spotlight');
    } finally {
      setLoading(false);
    }
  };

  const handlePitch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await pitchToPlaylist(Number(formData.trackId), Number(formData.playlistId), formData.message);
      toast.success('¡Pitch enviado con éxito!');
      setShowPitchModal(false);
      fetchData();
    } catch (err) {
      toast.error('Error al enviar el pitch');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 bg-ink relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-neon-pink/5 blur-[150px] rounded-full -mr-64 -mt-64 animate-pulse-glow" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-cyber-cyan/5 blur-[150px] rounded-full -ml-64 -mb-64 animate-pulse-glow" />

      <div className="max-w-7xl mx-auto space-y-16 relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12">
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neon-pink/10 border border-neon-pink/20 text-neon-pink text-[10px] font-black uppercase tracking-widest"
            >
              <Target size={12} className="animate-pulse" />
              <span>Playlist Pitching Engine</span>
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-6xl lg:text-9xl font-display font-black tracking-tighter uppercase leading-[0.85] italic"
            >
              Spotlight <br />
              <span className="text-neon-pink">Pitches</span>
            </motion.h1>
            <p className="text-white/40 text-lg max-w-xl font-medium leading-relaxed">
              Presenta tu música a curadores de playlists. Aumenta tus streams y llega a nuevas audiencias de forma orgánica.
            </p>
          </div>

          <button 
            onClick={() => setShowPitchModal(true)}
            className="px-10 py-5 bg-neon-pink text-ink rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-3 hover:scale-105 transition-all shadow-xl shadow-neon-pink/20"
          >
            <Send size={16} />
            Nuevo Pitch
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-neon-pink" size={48} />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {pitches.length === 0 ? (
              <div className="glass-card p-20 text-center space-y-6 border-white/5 bg-white/[0.02]">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto text-white/20">
                  <Target size={32} />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-white/20">No has enviado ningún pitch todavía.</p>
              </div>
            ) : (
              pitches.map((pitch, i) => (
                <motion.div
                  key={pitch.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-card p-8 flex flex-col md:flex-row items-center gap-10 group hover:bg-white/[0.05] transition-all border-white/5 bg-white/[0.02]"
                >
                  <div className="w-20 h-20 bg-neon-pink/10 rounded-2xl flex items-center justify-center text-neon-pink shadow-xl">
                    <Music size={32} />
                  </div>

                  <div className="flex-1 space-y-4 text-center md:text-left">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <h3 className="text-2xl font-display font-black uppercase tracking-tight italic">{pitch.track_title}</h3>
                      <ArrowRight size={16} className="text-white/20 hidden md:block" />
                      <h4 className="text-lg font-display font-black uppercase tracking-tight italic text-white/60">{pitch.playlist_name}</h4>
                    </div>
                    
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-[10px] font-black uppercase tracking-widest text-white/20">
                      <span className="flex items-center gap-2">
                        <Clock size={12} />
                        Enviado: {new Date(pitch.created_at).toLocaleDateString()}
                      </span>
                      <span className="w-1 h-1 bg-white/10 rounded-full" />
                      <span className={`flex items-center gap-2 ${
                        pitch.status === 'accepted' ? 'text-emerald-400' : 
                        pitch.status === 'rejected' ? 'text-neon-pink' : 'text-amber-400'
                      }`}>
                        {pitch.status === 'accepted' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                        Status: {pitch.status.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 bg-black/40 rounded-2xl border border-white/5 max-w-xs w-full">
                    <div className="flex items-center gap-2 mb-2 text-[8px] font-black uppercase tracking-widest text-white/20">
                      <MessageSquare size={10} />
                      Mensaje al curador
                    </div>
                    <p className="text-[10px] text-white/40 italic line-clamp-2">"{pitch.message}"</p>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Pitch Modal */}
      <AnimatePresence>
        {showPitchModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPitchModal(false)}
              className="absolute inset-0 bg-ink/95 backdrop-blur-2xl"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="relative w-full max-w-xl glass-card p-12 space-y-10 border-white/10 bg-white/[0.02]"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-display font-black uppercase tracking-tight italic">Pitch a Playlist</h2>
                <button onClick={() => setShowPitchModal(false)} className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center transition-all">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handlePitch} className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Seleccionar Track</label>
                  <select 
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-neon-pink transition-all text-sm font-bold appearance-none"
                    value={formData.trackId}
                    onChange={e => setFormData({...formData, trackId: e.target.value})}
                  >
                    <option value="">Elegir track...</option>
                    {tracks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Seleccionar Playlist</label>
                  <select 
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-neon-pink transition-all text-sm font-bold appearance-none"
                    value={formData.playlistId}
                    onChange={e => setFormData({...formData, playlistId: e.target.value})}
                  >
                    <option value="">Elegir playlist...</option>
                    {playlists.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Mensaje para el Curador</label>
                  <textarea 
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-neon-pink transition-all h-32 resize-none text-sm font-medium"
                    placeholder="Cuéntale al curador por qué tu track encaja en su playlist..."
                    value={formData.message}
                    onChange={e => setFormData({...formData, message: e.target.value})}
                  />
                </div>

                <button 
                  type="submit"
                  disabled={submitting}
                  className="w-full py-6 bg-neon-pink text-ink rounded-2xl font-black uppercase tracking-[0.4em] text-xs shadow-2xl shadow-neon-pink/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-4"
                >
                  {submitting ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                  <span>{submitting ? 'Enviando...' : 'Enviar Pitch'}</span>
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Spotlight;
