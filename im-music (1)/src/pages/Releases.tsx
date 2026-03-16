import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Calendar as CalendarIcon, Clock, Plus, Trash2, CheckCircle2, AlertCircle, Music, Zap } from 'lucide-react';
import { getScheduledReleases, scheduleRelease, cancelScheduledRelease, getTracks } from '../services/api';
import { toast } from 'sonner';

const Releases: React.FC = () => {
  const [releases, setReleases] = useState<any[]>([]);
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSchedule, setShowSchedule] = useState(false);
  const [formData, setFormData] = useState({
    track_id: '',
    release_date: '',
    release_time: '00:00',
    platforms: ['spotify', 'apple_music', 'deezer', 'tidal']
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [rRes, tRes] = await Promise.all([
        getScheduledReleases(),
        getTracks()
      ]);
      setReleases(Array.isArray(rRes.data) ? rRes.data : []);
      setTracks(Array.isArray(tRes.data) ? tRes.data : []);
    } catch (err) {
      toast.error('Error al cargar lanzamientos');
    } finally {
      setLoading(false);
    }
  };

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await scheduleRelease(formData);
      toast.success('Lanzamiento programado con éxito');
      setShowSchedule(false);
      fetchData();
    } catch (err) {
      toast.error('Error al programar lanzamiento');
    }
  };

  const handleCancel = async (id: number) => {
    if (!confirm('¿Estás seguro de cancelar este lanzamiento programado?')) return;
    try {
      await cancelScheduledRelease(id);
      toast.success('Lanzamiento cancelado');
      fetchData();
    } catch (err) {
      toast.error('Error al cancelar');
    }
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
              <CalendarIcon size={12} className="animate-pulse" />
              <span>Release Protocol</span>
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-6xl lg:text-9xl font-display font-black tracking-tighter uppercase leading-[0.85] italic"
            >
              Release <br />
              <span className="text-cyber-cyan">Scheduler</span>
            </motion.h1>
            <p className="text-white/40 text-lg max-w-xl font-medium leading-relaxed">
              Programa tus lanzamientos con precisión quirúrgica. Nuestra IA optimiza el momento exacto para maximizar el impacto.
            </p>
          </div>

          <button 
            onClick={() => setShowSchedule(true)}
            className="px-10 py-5 bg-cyber-cyan text-ink rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-3 hover:scale-105 transition-all shadow-xl shadow-cyber-cyan/20"
          >
            <Plus size={16} />
            Programar Lanzamiento
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-cyber-cyan/20 border-t-cyber-cyan rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {releases.map((release, i) => (
              <motion.div
                key={release.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass-card p-8 space-y-6 border-white/5 bg-white/[0.02] group hover:bg-white/[0.05] transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-cyber-cyan/10 flex items-center justify-center text-cyber-cyan">
                    <Clock size={24} />
                  </div>
                  <button 
                    onClick={() => handleCancel(release.id)}
                    className="p-3 text-white/20 hover:text-neon-pink hover:bg-neon-pink/10 rounded-xl transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl font-display font-black uppercase tracking-tight italic">{release.track_title}</h3>
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-cyber-cyan">
                    <CalendarIcon size={12} />
                    <span>{new Date(release.release_date).toLocaleDateString()} - {release.release_time}</span>
                  </div>
                </div>

                <div className="p-4 bg-black/40 rounded-2xl border border-white/5 space-y-3">
                  <p className="text-[8px] font-black uppercase tracking-widest text-white/20">Target Platforms</p>
                  <div className="flex flex-wrap gap-2">
                    {release.platforms?.map((p: string) => (
                      <span key={p} className="px-2 py-1 bg-white/5 rounded-md text-[8px] font-black uppercase tracking-widest text-white/40 border border-white/5">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full animate-pulse ${release.status === 'scheduled' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/40">{release.status}</span>
                </div>
              </motion.div>
            ))}

            {releases.length === 0 && (
              <div className="col-span-full py-20 text-center space-y-4">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto text-white/10">
                  <CalendarIcon size={40} />
                </div>
                <p className="text-white/20 font-black uppercase tracking-[0.3em] italic">No hay lanzamientos programados</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Schedule Modal */}
      {showSchedule && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setShowSchedule(false)} />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-2xl glass-card p-12 border-white/10 bg-ink space-y-8"
          >
            <div className="space-y-2">
              <h2 className="text-4xl font-display font-black uppercase tracking-tighter italic">Programar Lanzamiento</h2>
              <p className="text-white/40 text-sm font-medium">Configura la fecha y hora de publicación global.</p>
            </div>

            <form onSubmit={handleSchedule} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4">Seleccionar Track</label>
                <select 
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-cyber-cyan transition-all"
                  value={formData.track_id}
                  onChange={e => setFormData({...formData, track_id: e.target.value})}
                >
                  <option value="">Selecciona un track...</option>
                  {tracks.map(t => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4">Fecha</label>
                  <input 
                    type="date"
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-cyber-cyan transition-all"
                    value={formData.release_date}
                    onChange={e => setFormData({...formData, release_date: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4">Hora (Local)</label>
                  <input 
                    type="time"
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-cyber-cyan transition-all"
                    value={formData.release_time}
                    onChange={e => setFormData({...formData, release_time: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowSchedule(false)}
                  className="flex-1 py-5 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-5 bg-cyber-cyan text-ink rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-lg shadow-cyber-cyan/20"
                >
                  Confirmar Programación
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Releases;
