import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Rocket, Globe, Link as LinkIcon, Trash2, Plus, 
  ExternalLink, Mail, Users, ArrowRight, Sparkles
} from 'lucide-react';
import { getHyperFollows, createHyperFollow, deleteHyperFollow } from '../services/api';
import { toast } from 'sonner';

const HyperFollow: React.FC = () => {
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    track_id: '',
    spotify_url: '',
    apple_music_url: '',
    youtube_url: '',
    custom_message: ''
  });

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      const res = await getHyperFollows();
      setPages(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      toast.error('Error al cargar páginas HyperFollow');
      setPages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createHyperFollow(formData);
      toast.success('Página HyperFollow creada con éxito');
      setShowCreate(false);
      fetchPages();
    } catch (err) {
      toast.error('Error al crear la página');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar esta página?')) return;
    try {
      await deleteHyperFollow(id);
      toast.success('Página eliminada');
      fetchPages();
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
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyber-cyan/10 border border-cyber-cyan/20 text-cyber-cyan text-[10px] font-black uppercase tracking-widest"
            >
              <Rocket size={12} className="animate-pulse" />
              <span>Viral Growth Engine</span>
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-6xl lg:text-9xl font-display font-black tracking-tighter uppercase leading-[0.85] italic"
            >
              Hyper <br />
              <span className="text-cyber-cyan">Follow</span>
            </motion.h1>
            <p className="text-white/40 text-lg max-w-xl font-medium leading-relaxed">
              Crea páginas de aterrizaje de alto impacto para tus lanzamientos. Captura leads y centraliza tus enlaces de streaming.
            </p>
          </div>

          <button 
            onClick={() => setShowCreate(true)}
            className="px-10 py-5 bg-cyber-cyan text-ink rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-3 hover:scale-105 transition-all shadow-xl shadow-cyber-cyan/20"
          >
            <Plus size={16} />
            Crear Nueva Página
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-cyber-cyan/20 border-t-cyber-cyan rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.isArray(pages) && pages.map((page, i) => (
              <motion.div
                key={page.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass-card p-8 space-y-6 border-white/5 bg-white/[0.02] group hover:bg-white/[0.05] transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-cyber-cyan/10 flex items-center justify-center text-cyber-cyan">
                    <Globe size={24} />
                  </div>
                  <button 
                    onClick={() => handleDelete(page.id)}
                    className="p-3 text-white/20 hover:text-neon-pink hover:bg-neon-pink/10 rounded-xl transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl font-display font-black uppercase tracking-tight italic">{page.title}</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/20">/{page.slug}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-2 text-white/40 mb-1">
                      <Users size={12} />
                      <span className="text-[8px] font-black uppercase tracking-widest">Leads</span>
                    </div>
                    <p className="text-xl font-display font-black italic">{page.leads_count || 0}</p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-2 text-white/40 mb-1">
                      <ExternalLink size={12} />
                      <span className="text-[8px] font-black uppercase tracking-widest">Visits</span>
                    </div>
                    <p className="text-xl font-display font-black italic">{page.visits || 0}</p>
                  </div>
                </div>

                <div className="pt-4 flex gap-4">
                  <a 
                    href={`/hf/${page.slug}`}
                    target="_blank"
                    className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white rounded-xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2 border border-white/5"
                  >
                    Ver Página <ExternalLink size={12} />
                  </a>
                </div>
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
              <h2 className="text-4xl font-display font-black uppercase tracking-tighter italic">Nueva Página HyperFollow</h2>
              <p className="text-white/40 text-sm font-medium">Configura tu página de aterrizaje viral.</p>
            </div>

            <form onSubmit={handleCreate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4">Título</label>
                  <input 
                    type="text"
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-cyber-cyan transition-all"
                    placeholder="Mi Nuevo Single"
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4">Slug (URL)</label>
                  <input 
                    type="text"
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-cyber-cyan transition-all"
                    placeholder="mi-nuevo-single"
                    value={formData.slug}
                    onChange={e => setFormData({...formData, slug: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4">Spotify URL</label>
                <input 
                  type="url"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-cyber-cyan transition-all"
                  placeholder="https://open.spotify.com/track/..."
                  value={formData.spotify_url}
                  onChange={e => setFormData({...formData, spotify_url: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4">Mensaje Personalizado</label>
                <textarea 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-cyber-cyan transition-all h-32 resize-none"
                  placeholder="¡Escucha mi nuevo lanzamiento!"
                  value={formData.custom_message}
                  onChange={e => setFormData({...formData, custom_message: e.target.value})}
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
                  className="flex-1 py-5 bg-cyber-cyan text-ink rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-lg shadow-cyber-cyan/20"
                >
                  Crear Página
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default HyperFollow;
