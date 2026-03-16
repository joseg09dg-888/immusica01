import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getTracks, createTrack, updateTrack, deleteTrack, getTrackStats } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Music, Plus, Trash2, Edit2, Loader2, Play, 
  Pause, Upload, X, CheckCircle2, BarChart3, 
  TrendingUp, DollarSign, Globe, ArrowUpRight,
  Activity, Sparkles, Clock, FileText, Languages, Video, Share2, Shield, Zap, Database
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  uploadLyrics, getLyrics, generatePromoReel, 
  toggleAutoDistribute, activateLeaveALegacy 
} from '../services/api';

const Catalog: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTrack, setEditingTrack] = useState<any>(null);
  const [formData, setFormData] = useState({ title: '', artist_id: '1', release_date: '' });
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [selectedTrack, setSelectedTrack] = useState<any>(null);
  const [trackStats, setTrackStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const [lyricsTrack, setLyricsTrack] = useState<any>(null);
  const [lyricsData, setLyricsData] = useState({ plain: '', synced: '' });
  const [lyricsLoading, setLyricsLoading] = useState(false);

  useEffect(() => {
    fetchTracks();
  }, []);

  const fetchTracks = async () => {
    try {
      const res = await getTracks();
      setTracks(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewLyrics = async (track: any) => {
    setLyricsTrack(track);
    setLyricsLoading(true);
    try {
      const res = await getLyrics(track.id);
      setLyricsData({
        plain: res.data.plain || '',
        synced: res.data.synced || ''
      });
    } catch (err) {
      setLyricsData({ plain: '', synced: '' });
    } finally {
      setLyricsLoading(false);
    }
  };

  const handleSaveLyrics = async () => {
    if (!lyricsTrack) return;
    setSubmitting(true);
    try {
      await uploadLyrics(lyricsTrack.id, { lyrics: lyricsData.plain, type: 'plain' });
      await uploadLyrics(lyricsTrack.id, { lyrics: lyricsData.synced, type: 'synced' });
      toast.success('Lyrics updated successfully');
      setLyricsTrack(null);
    } catch (err) {
      toast.error('Error saving lyrics');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewStats = async (track: any) => {
    setSelectedTrack(track);
    setStatsLoading(true);
    try {
      const res = await getTrackStats(track.id);
      setTrackStats(res.data);
    } catch (err) {
      toast.error('Error loading track stats');
    } finally {
      setStatsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('artist_id', formData.artist_id);
      if (formData.release_date) data.append('release_date', formData.release_date);
      if (file) data.append('audio', file);

      if (editingTrack) {
        await updateTrack(editingTrack.id, data);
        toast.success('Track updated successfully');
      } else {
        await createTrack(data);
        toast.success('Track created successfully');
      }
      setIsModalOpen(false);
      setEditingTrack(null);
      setFormData({ title: '', artist_id: '1', release_date: '' });
      setFile(null);
      fetchTracks();
    } catch (err: any) {
      toast.error('Error: ' + (err.response?.data?.error || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this track?')) return;
    try {
      await deleteTrack(id);
      toast.success('Track deleted');
      fetchTracks();
    } catch (err) {
      toast.error('Error deleting track');
    }
  };

  const handleGenerateReel = async (trackId: number) => {
    toast.promise(generatePromoReel(trackId, 'Check out my new track!'), {
      loading: 'Generando Reel Neural...',
      success: (res) => {
        window.open(res.data.video_url, '_blank');
        return 'Reel generado con éxito';
      },
      error: 'Error al generar Reel'
    });
  };

  const handleToggleAutoDistribute = async (trackId: number, current: boolean) => {
    try {
      await toggleAutoDistribute(trackId, !current);
      toast.success(`Store Maximizer ${!current ? 'activado' : 'desactivado'}`);
      fetchTracks();
    } catch (error) {
      toast.error('Error al actualizar Store Maximizer');
    }
  };

  const handleLeaveALegacy = async (trackId: number) => {
    if (!confirm('¿Activar Leave a Legacy? Esto asegura que tu música nunca sea eliminada.')) return;
    try {
      await activateLeaveALegacy(trackId);
      toast.success('Leave a Legacy activado');
      fetchTracks();
    } catch (error) {
      toast.error('Error al activar Leave a Legacy');
    }
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-ink">
      <Loader2 className="animate-spin text-cyber-cyan" size={48} />
    </div>
  );

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-cyber-cyan/5 blur-[150px] rounded-full -mr-64 -mt-64 animate-pulse-glow" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-400/5 blur-[150px] rounded-full -ml-64 -mb-64 animate-pulse-glow" />

      <div className="max-w-7xl mx-auto space-y-16 relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12">
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-electric-purple/10 border border-electric-purple/20 text-electric-purple text-[10px] font-black uppercase tracking-widest"
            >
              <Sparkles size={12} className="animate-pulse" />
              <span>IM MUSIC Neural Core</span>
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-6xl lg:text-9xl font-display font-black tracking-tighter uppercase leading-[0.85] italic"
            >
              IM MUSIC <br />
              <span className="text-electric-purple">Catalog</span>
            </motion.h1>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Link 
              to="/migration"
              className="px-10 py-5 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-3 transition-all border border-white/10"
            >
              <Database size={16} />
              Migrate Catalog
            </Link>
            <button 
              onClick={() => { setEditingTrack(null); setIsModalOpen(true); }}
              className="px-10 py-5 bg-cyber-cyan text-ink rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-3 hover:scale-105 transition-all shadow-xl shadow-cyber-cyan/20"
            >
              <Plus size={16} />
              Add New Track
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {tracks.length === 0 ? (
            <div className="glass-card p-20 text-center space-y-6">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto text-white/20">
                <Music size={32} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/20">No tracks found in your catalog.</p>
            </div>
          ) : (
            tracks.map((track, i) => (
              <motion.div 
                key={track.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card p-8 flex flex-col md:flex-row items-center gap-10 group hover:bg-white/[0.05] transition-all border-white/5"
              >
                <div className="w-24 h-24 bg-white/5 rounded-[2rem] flex items-center justify-center relative overflow-hidden flex-shrink-0 shadow-2xl">
                  <Music size={32} className="text-white/10" />
                  <button 
                    onClick={() => handleViewStats(track)}
                    className="absolute inset-0 bg-cyber-cyan/90 text-ink opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center translate-y-full group-hover:translate-y-0"
                  >
                    <BarChart3 size={28} />
                  </button>
                </div>
                
                <div className="flex-1 space-y-3 text-center md:text-left">
                  <h3 className="text-2xl font-display font-black uppercase tracking-tight italic group-hover:text-cyber-cyan transition-colors">{track.title}</h3>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-[10px] font-black uppercase tracking-widest text-white/20">
                    <span className="flex items-center gap-2">
                      <Activity size={12} />
                      ID: {track.id}
                    </span>
                    <span className="w-1 h-1 bg-white/10 rounded-full" />
                    <span className="flex items-center gap-2">
                      <Globe size={12} />
                      ISRC: {track.isrc || 'PENDING'}
                    </span>
                    {track.release_date && (
                      <>
                        <span className="w-1 h-1 bg-white/10 rounded-full" />
                        <span className="flex items-center gap-2 text-amber-400">
                          <Clock size={12} />
                          Scheduled: {new Date(track.release_date).toLocaleDateString()}
                        </span>
                      </>
                    )}
                    {track.auto_distribute === 1 && (
                      <>
                        <span className="w-1 h-1 bg-white/10 rounded-full" />
                        <span className="flex items-center gap-2 text-cyber-cyan">
                          <Zap size={12} />
                          Maximizer Active
                        </span>
                      </>
                    )}
                    {track.leave_a_legacy === 1 && (
                      <>
                        <span className="w-1 h-1 bg-white/10 rounded-full" />
                        <span className="flex items-center gap-2 text-emerald-400">
                          <Shield size={12} />
                          Legacy Protected
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => handleGenerateReel(track.id)}
                    className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-white/40 hover:bg-neon-pink/10 hover:text-neon-pink transition-all group/btn"
                    title="Generate Promo Reel"
                  >
                    <Video size={20} className="group-hover:scale-110 transition-transform" />
                  </button>
                  <button 
                    onClick={() => handleToggleAutoDistribute(track.id, track.auto_distribute === 1)}
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all group/btn ${track.auto_distribute === 1 ? 'bg-cyber-cyan/20 text-cyber-cyan' : 'bg-white/5 text-white/40 hover:bg-cyber-cyan/10 hover:text-cyber-cyan'}`}
                    title="Store Maximizer"
                  >
                    <Zap size={20} className="group-hover:scale-110 transition-transform" />
                  </button>
                  <button 
                    onClick={() => handleLeaveALegacy(track.id)}
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all group/btn ${track.leave_a_legacy === 1 ? 'bg-emerald-400/20 text-emerald-400' : 'bg-white/5 text-white/40 hover:bg-emerald-400/10 hover:text-emerald-400'}`}
                    title="Leave a Legacy"
                  >
                    <Shield size={20} className="group-hover:scale-110 transition-transform" />
                  </button>
                  <button 
                    onClick={() => handleViewLyrics(track)}
                    className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-white/40 hover:bg-cyber-cyan/10 hover:text-cyber-cyan transition-all group/btn"
                    title="Lyrics"
                  >
                    <FileText size={20} className="group-hover:scale-110 transition-transform" />
                  </button>
                  <button 
                    onClick={() => { 
                      setEditingTrack(track); 
                      setFormData({ 
                        title: track.title, 
                        artist_id: track.artist_id,
                        release_date: track.release_date ? track.release_date.split('T')[0] : ''
                      }); 
                      setIsModalOpen(true); 
                    }}
                    className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-white/40 hover:bg-white/10 hover:text-white transition-all group/btn"
                  >
                    <Edit2 size={20} className="group-hover:scale-110 transition-transform" />
                  </button>
                  <button 
                    onClick={() => handleDelete(track.id)}
                    className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-white/40 hover:bg-neon-pink/10 hover:text-neon-pink transition-all group/btn"
                  >
                    <Trash2 size={20} className="group-hover:scale-110 transition-transform" />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Track Stats Modal */}
      <AnimatePresence>
        {selectedTrack && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTrack(null)}
              className="absolute inset-0 bg-ink/95 backdrop-blur-2xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="glass-card w-full max-w-4xl max-h-[90vh] overflow-y-auto relative z-10 border-white/10 bg-white/[0.02] shadow-[0_0_100px_rgba(0,240,255,0.1)]"
            >
              <div className="sticky top-0 z-20 bg-ink/50 backdrop-blur-2xl p-10 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-8">
                  <div className="w-20 h-20 rounded-[2rem] bg-cyber-cyan/10 flex items-center justify-center text-cyber-cyan shadow-2xl">
                    <Music size={32} />
                  </div>
                  <div>
                    <h2 className="text-4xl font-display font-black uppercase tracking-tight italic">{selectedTrack.title}</h2>
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Neural Performance Insights</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedTrack(null)}
                  className="w-14 h-14 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center justify-center transition-all"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-12 space-y-16">
                {statsLoading ? (
                  <div className="py-20 flex items-center justify-center">
                    <Loader2 className="animate-spin text-cyber-cyan" size={48} />
                  </div>
                ) : trackStats ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      {[
                        { label: 'Neural Streams', value: trackStats.total_streams?.toLocaleString(), icon: TrendingUp, color: 'text-cyber-cyan', bg: 'bg-cyber-cyan/10' },
                        { label: 'Net Revenue', value: `$${trackStats.total_ingresos?.toFixed(2)}`, icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
                        { label: 'Active Markets', value: '12', icon: Globe, color: 'text-electric-purple', bg: 'bg-electric-purple/10' }
                      ].map((stat, i) => (
                        <motion.div 
                          key={i}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="p-10 bg-white/[0.02] border border-white/5 rounded-[2.5rem] space-y-6 group hover:bg-white/[0.04] transition-all"
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">{stat.label}</p>
                            <div className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                              <stat.icon size={18} />
                            </div>
                          </div>
                          <p className="text-5xl font-display font-black italic tracking-tighter">{stat.value}</p>
                        </motion.div>
                      ))}
                    </div>

                    <div className="space-y-10">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white/40">Neural Distribution</h3>
                        <ArrowUpRight size={20} className="text-cyber-cyan" />
                      </div>
                      <div className="space-y-8">
                        {trackStats.byPlatform?.map((p: any, i: number) => (
                          <div key={i} className="space-y-3 group">
                            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                              <span className="group-hover:text-white transition-colors">{p.plataforma}</span>
                              <span className="text-cyber-cyan">{p.streams.toLocaleString()} Plays</span>
                            </div>
                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${(p.streams / trackStats.total_streams) * 100}%` }}
                                transition={{ duration: 1.5, delay: i * 0.1, ease: "easeOut" }}
                                className="h-full bg-cyber-cyan shadow-[0_0_15px_rgba(0,240,255,0.4)]" 
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="py-20 text-center space-y-6 opacity-40">
                    <BarChart3 size={64} className="mx-auto text-white/10" />
                    <p className="text-[10px] font-black uppercase tracking-[0.4em]">No neural stats available for this track</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Lyrics Modal */}
      <AnimatePresence>
        {lyricsTrack && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setLyricsTrack(null)}
              className="absolute inset-0 bg-ink/95 backdrop-blur-2xl"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="relative w-full max-w-3xl glass-card p-12 space-y-10 border-white/10 bg-white/[0.02]"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-cyber-cyan/10 text-cyber-cyan rounded-xl flex items-center justify-center">
                    <Languages size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-display font-black uppercase tracking-tight italic">
                      Lyrics: {lyricsTrack.title}
                    </h2>
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Global Distribution Sync</p>
                  </div>
                </div>
                <button onClick={() => setLyricsTrack(null)} className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center transition-all">
                  <X size={20} />
                </button>
              </div>

              {lyricsLoading ? (
                <div className="py-20 flex items-center justify-center">
                  <Loader2 className="animate-spin text-cyber-cyan" size={48} />
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
                        <FileText size={12} />
                        Plain Lyrics
                      </label>
                      <textarea 
                        value={lyricsData.plain}
                        onChange={(e) => setLyricsData({ ...lyricsData, plain: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-medium focus:border-cyber-cyan transition-all outline-none h-64 resize-none"
                        placeholder="Paste plain lyrics here..."
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
                        <Clock size={12} />
                        Synced Lyrics (LRC)
                      </label>
                      <textarea 
                        value={lyricsData.synced}
                        onChange={(e) => setLyricsData({ ...lyricsData, synced: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-mono focus:border-cyber-cyan transition-all outline-none h-64 resize-none"
                        placeholder="[00:12.34] Lyric line..."
                      />
                    </div>
                  </div>

                  <button 
                    onClick={handleSaveLyrics}
                    disabled={submitting}
                    className="w-full py-6 bg-cyber-cyan text-ink rounded-2xl font-black uppercase tracking-[0.4em] text-xs shadow-2xl shadow-cyber-cyan/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-4"
                  >
                    {submitting ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                    <span>{submitting ? 'Syncing...' : 'Save & Distribute Lyrics'}</span>
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-ink/95 backdrop-blur-2xl"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="relative w-full max-w-xl glass-card p-12 space-y-10 border-white/10 bg-white/[0.02]"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-display font-black uppercase tracking-tight italic">
                  {editingTrack ? 'Edit Neural Asset' : 'New Neural Asset'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center transition-all">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Track Title</label>
                  <input 
                    type="text" 
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-8 py-5 text-sm font-bold focus:border-cyber-cyan transition-all outline-none"
                    placeholder="Enter track title"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Release Date (Scheduling)</label>
                  <input 
                    type="date" 
                    value={formData.release_date}
                    onChange={(e) => setFormData({ ...formData, release_date: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-8 py-5 text-sm font-bold focus:border-cyber-cyan transition-all outline-none text-white"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Neural Master File</label>
                  <div className="relative group">
                    <input 
                      type="file" 
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    />
                    <div className="w-full bg-white/5 border border-dashed border-white/10 rounded-2xl px-8 py-12 text-center space-y-4 group-hover:border-cyber-cyan/40 transition-all">
                      <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto text-white/20 group-hover:text-cyber-cyan transition-colors">
                        <Upload size={24} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold">{file ? file.name : 'Click to upload audio'}</p>
                        <p className="text-[10px] text-white/20 uppercase tracking-widest">WAV or MP3 (Max 50MB)</p>
                      </div>
                    </div>
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={submitting}
                  className="w-full py-6 bg-cyber-cyan text-ink rounded-2xl font-black uppercase tracking-[0.4em] text-xs shadow-2xl shadow-cyber-cyan/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-4"
                >
                  {submitting ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                  <span>{submitting ? 'Processing...' : (editingTrack ? 'Update Asset' : 'Initialize Asset')}</span>
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Catalog;
