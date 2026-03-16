import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Video, Upload, Trash2, Play, ExternalLink, Sparkles, Zap, Globe, Film } from 'lucide-react';
import { getVideos, uploadVideo, deleteVideo } from '../services/api';
import { toast } from 'sonner';

const Videos: React.FC = () => {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    video_file: null as File | null
  });

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const res = await getVideos();
      setVideos(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      toast.error('Error al cargar videos');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.video_file) return toast.error('Selecciona un archivo de video');

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('title', formData.title);
      fd.append('description', formData.description);
      fd.append('video', formData.video_file);

      await uploadVideo(fd);
      toast.success('Video subido con éxito');
      setShowUpload(false);
      fetchVideos();
    } catch (err) {
      toast.error('Error al subir video');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este video?')) return;
    try {
      await deleteVideo(id);
      toast.success('Video eliminado');
      fetchVideos();
    } catch (err) {
      toast.error('Error al eliminar');
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 bg-ink relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-electric-purple/5 blur-[150px] rounded-full -mr-64 -mt-64 animate-pulse-glow" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-cyber-cyan/5 blur-[150px] rounded-full -ml-64 -mb-64 animate-pulse-glow" />

      <div className="max-w-7xl mx-auto space-y-16 relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12">
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-electric-purple/10 border border-electric-purple/20 text-electric-purple text-[10px] font-black uppercase tracking-widest"
            >
              <Film size={12} className="animate-pulse" />
              <span>Visual Distribution Core</span>
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-6xl lg:text-9xl font-display font-black tracking-tighter uppercase leading-[0.85] italic"
            >
              Video <br />
              <span className="text-electric-purple">Distribution</span>
            </motion.h1>
            <p className="text-white/40 text-lg max-w-xl font-medium leading-relaxed">
              Distribuye tus videos musicales, visualizers y contenido vertical a plataformas globales con un solo click.
            </p>
          </div>

          <button 
            onClick={() => setShowUpload(true)}
            className="px-10 py-5 bg-electric-purple text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-3 hover:scale-105 transition-all shadow-xl shadow-electric-purple/20"
          >
            <Upload size={16} />
            Subir Video
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-electric-purple/20 border-t-electric-purple rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {videos.map((video, i) => (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass-card overflow-hidden border-white/5 bg-white/[0.02] group hover:bg-white/[0.05] transition-all"
              >
                <div className="aspect-video bg-black relative group/player">
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/player:opacity-100 transition-opacity z-20">
                    <div className="w-16 h-16 rounded-full bg-electric-purple flex items-center justify-center text-white shadow-2xl scale-90 group-hover/player:scale-100 transition-transform cursor-pointer">
                      <Play size={32} fill="currentColor" />
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover/player:opacity-100 transition-opacity z-10" />
                  {/* Placeholder for video thumbnail */}
                  <div className="w-full h-full flex items-center justify-center text-white/10">
                    <Video size={64} />
                  </div>
                </div>

                <div className="p-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h3 className="text-2xl font-display font-black uppercase tracking-tight italic">{video.title}</h3>
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Publicado el {new Date(video.created_at).toLocaleDateString()}</p>
                    </div>
                    <button 
                      onClick={() => handleDelete(video.id)}
                      className="p-3 text-white/20 hover:text-neon-pink hover:bg-neon-pink/10 rounded-xl transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <p className="text-white/40 text-sm line-clamp-2 italic">
                    {video.description || 'Sin descripción.'}
                  </p>

                  <div className="pt-4 flex gap-4">
                    <button className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white rounded-xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2 border border-white/5">
                      Gestionar Metadatos <Zap size={12} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}

            {videos.length === 0 && (
              <div className="col-span-full py-20 text-center space-y-4">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto text-white/10">
                  <Video size={40} />
                </div>
                <p className="text-white/20 font-black uppercase tracking-[0.3em] italic">No hay videos distribuidos</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setShowUpload(false)} />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-2xl glass-card p-12 border-white/10 bg-ink space-y-8"
          >
            <div className="space-y-2">
              <h2 className="text-4xl font-display font-black uppercase tracking-tighter italic">Subir Video</h2>
              <p className="text-white/40 text-sm font-medium">Prepara tu contenido visual para distribución global.</p>
            </div>

            <form onSubmit={handleUpload} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4">Título del Video</label>
                <input 
                  type="text"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-electric-purple transition-all"
                  placeholder="Official Music Video"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4">Descripción</label>
                <textarea 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-electric-purple transition-all h-32 resize-none"
                  placeholder="Detalles del video, créditos, etc."
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4">Archivo de Video</label>
                <div className="relative group">
                  <input 
                    type="file"
                    accept="video/*"
                    required
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    onChange={e => setFormData({...formData, video_file: e.target.files?.[0] || null})}
                  />
                  <div className="w-full bg-white/5 border border-dashed border-white/10 rounded-2xl px-6 py-12 flex flex-col items-center gap-4 group-hover:border-electric-purple/50 transition-all">
                    <Upload className="text-white/20 group-hover:text-electric-purple transition-colors" size={32} />
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40">
                      {formData.video_file ? formData.video_file.name : 'Arrastra o selecciona tu video'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowUpload(false)}
                  className="flex-1 py-5 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={uploading}
                  className="flex-1 py-5 bg-electric-purple text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-lg shadow-electric-purple/20 flex items-center justify-center gap-2"
                >
                  {uploading ? <><Loader2 className="animate-spin" size={16} /> Procesando...</> : 'Iniciar Distribución'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

const Loader2 = ({ className, size }: { className?: string, size?: number }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

export default Videos;
