import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Users, Plus, Trash2, Edit3, Shield, User, Star, Zap, Sparkles, ArrowRight, RefreshCw } from 'lucide-react';
import { getMyArtists, createArtist, switchArtist } from '../services/api';
import { toast } from 'sonner';

const Artists: React.FC = () => {
  const [artists, setArtists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    genre: '',
    bio: '',
    role: 'owner'
  });

  useEffect(() => {
    fetchArtists();
  }, []);

  const fetchArtists = async () => {
    try {
      const res = await getMyArtists();
      setArtists(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      toast.error('Error al cargar artistas');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createArtist(formData);
      toast.success('Artista agregado a tu red');
      setShowCreate(false);
      fetchArtists();
    } catch (err) {
      toast.error('Error al agregar artista (Verifica tu plan)');
    }
  };

  const handleSwitch = async (id: number) => {
    try {
      await switchArtist(id);
      toast.success('Cambiando perfil de artista...');
      window.location.href = '/dashboard';
    } catch (err) {
      toast.error('Error al cambiar de perfil');
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
              <Users size={12} className="animate-pulse" />
              <span>Label Management Core</span>
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-6xl lg:text-9xl font-display font-black tracking-tighter uppercase leading-[0.85] italic"
            >
              Artist <br />
              <span className="text-neon-pink">Network</span>
            </motion.h1>
            <p className="text-white/40 text-lg max-w-xl font-medium leading-relaxed">
              Gestiona múltiples perfiles de artistas desde una sola cuenta. Ideal para sellos discográficos y agencias de management.
            </p>
          </div>

          <button 
            onClick={() => setShowCreate(true)}
            className="px-10 py-5 bg-neon-pink text-ink rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-3 hover:scale-105 transition-all shadow-xl shadow-neon-pink/20"
          >
            <Plus size={16} />
            Agregar Nuevo Artista
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-neon-pink/20 border-t-neon-pink rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {artists.map((artist, i) => (
              <motion.div
                key={artist.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass-card p-10 space-y-8 border-white/5 bg-white/[0.02] group hover:bg-white/[0.05] transition-all relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-neon-pink/5 blur-[40px] rounded-full -mr-16 -mt-16 group-hover:bg-neon-pink/10 transition-colors" />
                
                <div className="flex items-center justify-between relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-neon-pink/10 flex items-center justify-center text-neon-pink">
                    <User size={32} />
                  </div>
                  <div className="flex gap-2">
                    <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                      artist.role === 'owner' 
                        ? 'bg-cyber-cyan/10 text-cyber-cyan border-cyber-cyan/20' 
                        : 'bg-white/5 text-white/40 border-white/10'
                    }`}>
                      {artist.role}
                    </span>
                  </div>
                </div>

                <div className="space-y-4 relative z-10">
                  <h3 className="text-3xl font-display font-black uppercase tracking-tight italic leading-tight">{artist.name}</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/20">{artist.genre || 'Género no especificado'}</p>
                </div>

                <div className="p-6 bg-black/40 rounded-3xl border border-white/5 space-y-4 relative z-10">
                  <p className="text-[10px] text-white/40 leading-relaxed italic line-clamp-2">
                    "{artist.bio || 'Sin biografía disponible.'}"
                  </p>
                </div>

                <button 
                  onClick={() => handleSwitch(artist.id)}
                  className="w-full py-5 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-3 border border-white/10 group/btn"
                >
                  <RefreshCw size={16} className="group-hover/btn:rotate-180 transition-transform duration-500" />
                  Gestionar Artista
                  <ArrowRight size={14} />
                </button>
              </motion.div>
            ))}

            {artists.length === 0 && (
              <div className="col-span-full py-20 text-center space-y-4">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto text-white/10">
                  <Users size={40} />
                </div>
                <p className="text-white/20 font-black uppercase tracking-[0.3em] italic">No hay artistas en tu red</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setShowCreate(false)} />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-2xl glass-card p-12 border-white/10 bg-ink space-y-8"
          >
            <div className="space-y-2">
              <h2 className="text-4xl font-display font-black uppercase tracking-tighter italic">Agregar Artista</h2>
              <p className="text-white/40 text-sm font-medium">Expande tu sello discográfico.</p>
            </div>

            <form onSubmit={handleCreate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4">Nombre Artístico</label>
                  <input 
                    type="text"
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-neon-pink transition-all"
                    placeholder="Nombre del artista"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4">Género Principal</label>
                  <input 
                    type="text"
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-neon-pink transition-all"
                    placeholder="Reggaeton, Trap, Pop..."
                    value={formData.genre}
                    onChange={e => setFormData({...formData, genre: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4">Biografía Corta</label>
                <textarea 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-neon-pink transition-all h-32 resize-none"
                  placeholder="Historia del artista..."
                  value={formData.bio}
                  onChange={e => setFormData({...formData, bio: e.target.value})}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 py-5 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-5 bg-neon-pink text-ink rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-lg shadow-neon-pink/20"
                >
                  Agregar Artista
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Artists;
