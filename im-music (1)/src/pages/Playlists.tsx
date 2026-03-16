import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Music, Search, Filter, Plus, Globe, 
  Tag, Mail, ExternalLink, Trash2, Edit3,
  Sparkles, Target, Zap
} from 'lucide-react';
import { getPlaylists, getPlaylistMoods, createPlaylist, deletePlaylist } from '../services/api';
import { toast } from 'sonner';
import MoodDiscovery from '../components/MoodDiscovery';

const Playlists: React.FC = () => {
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [moods, setMoods] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ genre: '', mood: '', search: '' });
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    genre: '',
    mood_tags: '',
    contact_info: '',
    description: ''
  });

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    try {
      const [pRes, mRes] = await Promise.all([
        getPlaylists(filters),
        getPlaylistMoods()
      ]);
      setPlaylists(Array.isArray(pRes.data) ? pRes.data : []);
      setMoods(Array.isArray(mRes.data) ? mRes.data : []);
    } catch (err) {
      toast.error('Error al cargar playlists');
      setPlaylists([]);
      setMoods([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createPlaylist(formData);
      toast.success('Playlist agregada a la base de datos');
      setShowCreate(false);
      fetchData();
    } catch (err) {
      toast.error('Error al agregar playlist');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar esta playlist?')) return;
    try {
      await deletePlaylist(id);
      toast.success('Playlist eliminada');
      fetchData();
    } catch (err) {
      toast.error('Error al eliminar');
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
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neon-pink/10 border border-neon-pink/20 text-neon-pink text-[10px] font-black uppercase tracking-widest"
            >
              <Target size={12} className="animate-pulse" />
              <span>Curator Network</span>
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-6xl lg:text-9xl font-display font-black tracking-tighter uppercase leading-[0.85] italic"
            >
              Playlist <br />
              <span className="text-neon-pink">Database</span>
            </motion.h1>
            <p className="text-white/40 text-lg max-w-xl font-medium leading-relaxed">
              Encuentra y contacta a los curadores más influyentes. Filtra por género y mood para optimizar tu alcance.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={() => setShowCreate(true)}
              className="px-10 py-5 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-3 transition-all border border-white/10"
            >
              <Plus size={16} />
              Sugerir Playlist
            </button>
          </div>
        </div>

        <MoodDiscovery />

        {/* Filters */}
        <div className="glass-card p-6 border-white/5 bg-white/[0.02] flex flex-wrap gap-6 items-center">
          <div className="flex-1 min-w-[300px] relative">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20" size={18} />
            <input 
              type="text"
              placeholder="Buscar por nombre o género..."
              className="w-full bg-black/40 border border-white/10 rounded-2xl pl-14 pr-6 py-4 text-white focus:outline-none focus:border-neon-pink transition-all"
              value={filters.search}
              onChange={e => setFilters({...filters, search: e.target.value})}
            />
          </div>
          <div className="flex gap-4">
            <select 
              className="bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-neon-pink transition-all text-[10px] font-black uppercase tracking-widest"
              value={filters.mood}
              onChange={e => setFilters({...filters, mood: e.target.value})}
            >
              <option value="">Todos los Moods</option>
              {Array.isArray(moods) && moods.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-neon-pink/20 border-t-neon-pink rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {playlists.map((playlist, i) => (
              <motion.div
                key={playlist.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card p-10 space-y-8 border-white/5 bg-white/[0.02] group hover:bg-white/[0.05] transition-all relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-neon-pink/5 blur-[40px] rounded-full -mr-16 -mt-16 group-hover:bg-neon-pink/10 transition-colors" />
                
                <div className="flex items-center justify-between relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-neon-pink/10 flex items-center justify-center text-neon-pink">
                    <Music size={28} />
                  </div>
                  <div className="flex gap-2">
                    <button className="p-3 text-white/20 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                      <Edit3 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(playlist.id)}
                      className="p-3 text-white/20 hover:text-neon-pink hover:bg-neon-pink/10 rounded-xl transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="space-y-4 relative z-10">
                  <h3 className="text-3xl font-display font-black uppercase tracking-tight italic leading-tight">{playlist.name}</h3>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-neon-pink/10 text-neon-pink text-[8px] font-black uppercase tracking-widest rounded-full border border-neon-pink/20">
                      {playlist.genre}
                    </span>
                    {playlist.mood_tags?.split(',').map((tag: string) => (
                      <span key={tag} className="px-3 py-1 bg-white/5 text-white/40 text-[8px] font-black uppercase tracking-widest rounded-full border border-white/10">
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-6 bg-black/40 rounded-3xl border border-white/5 space-y-4 relative z-10">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                    <span className="text-white/20">Contacto</span>
                    <span className="text-white">{playlist.contact_info || 'Privado'}</span>
                  </div>
                  <p className="text-[10px] text-white/40 leading-relaxed italic">
                    "{playlist.description || 'Sin descripción disponible.'}"
                  </p>
                </div>

                <a 
                  href={playlist.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-5 bg-neon-pink text-ink rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-3 shadow-lg shadow-neon-pink/20 relative z-10"
                >
                  <Globe size={16} />
                  Abrir en Spotify
                  <ExternalLink size={14} />
                </a>
              </motion.div>
            ))}
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
              <h2 className="text-4xl font-display font-black uppercase tracking-tighter italic">Sugerir Playlist</h2>
              <p className="text-white/40 text-sm font-medium">Ayúdanos a expandir la red de curadores.</p>
            </div>

            <form onSubmit={handleCreate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4">Nombre</label>
                  <input 
                    type="text"
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-neon-pink transition-all"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4">Género</label>
                  <input 
                    type="text"
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-neon-pink transition-all"
                    value={formData.genre}
                    onChange={e => setFormData({...formData, genre: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4">URL de la Playlist</label>
                <input 
                  type="url"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-neon-pink transition-all"
                  value={formData.url}
                  onChange={e => setFormData({...formData, url: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4">Mood Tags (separados por coma)</label>
                <input 
                  type="text"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-neon-pink transition-all"
                  placeholder="chill, energetic, dark..."
                  value={formData.mood_tags}
                  onChange={e => setFormData({...formData, mood_tags: e.target.value})}
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
                  Agregar Playlist
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Playlists;
