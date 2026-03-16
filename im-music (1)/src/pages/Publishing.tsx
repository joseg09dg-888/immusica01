import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Book, Plus, Trash2, Globe, Shield, DollarSign, Users, FileText, Zap, Sparkles } from 'lucide-react';
import { getCompositions, createComposition, getPublishingRoyalties } from '../services/api';
import { toast } from 'sonner';

const Publishing: React.FC = () => {
  const [compositions, setCompositions] = useState<any[]>([]);
  const [royalties, setRoyalties] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    iswc: '',
    pro: '',
    composers: [{ name: '', share: 100 }]
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [cRes, rRes] = await Promise.all([
        getCompositions(),
        getPublishingRoyalties()
      ]);
      setCompositions(Array.isArray(cRes.data) ? cRes.data : []);
      setRoyalties(rRes.data);
    } catch (err) {
      toast.error('Error al cargar datos de publishing');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createComposition(formData);
      toast.success('Composición registrada con éxito');
      setShowCreate(false);
      fetchData();
    } catch (err) {
      toast.error('Error al registrar composición');
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 bg-ink relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-400/5 blur-[150px] rounded-full -mr-64 -mt-64 animate-pulse-glow" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-cyber-cyan/5 blur-[150px] rounded-full -ml-64 -mb-64 animate-pulse-glow" />

      <div className="max-w-7xl mx-auto space-y-16 relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12">
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-400/10 border border-emerald-400/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest"
            >
              <Shield size={12} className="animate-pulse" />
              <span>Publishing & Rights Core</span>
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-6xl lg:text-9xl font-display font-black tracking-tighter uppercase leading-[0.85] italic"
            >
              Editorial <br />
              <span className="text-emerald-400">Publishing</span>
            </motion.h1>
            <p className="text-white/40 text-lg max-w-xl font-medium leading-relaxed">
              Gestiona tus derechos de autor, composiciones y registros en PROs globales. Maximiza tus regalías editoriales.
            </p>
          </div>

          <button 
            onClick={() => setShowCreate(true)}
            className="px-10 py-5 bg-emerald-400 text-ink rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-3 hover:scale-105 transition-all shadow-xl shadow-emerald-400/20"
          >
            <Plus size={16} />
            Registrar Composición
          </button>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { label: 'Total Publishing Revenue', value: `$${royalties?.total?.toLocaleString() || '0.00'}`, sub: 'Editorial Earnings', icon: DollarSign, color: 'text-emerald-400' },
            { label: 'Registered Compositions', value: compositions.length, sub: 'Active Works', icon: Book, color: 'text-cyber-cyan' },
            { label: 'Global PRO Coverage', value: '100%', sub: 'Worldwide Rights', icon: Globe, color: 'text-neon-pink' }
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="glass-card p-10 space-y-4 border-white/5 bg-white/[0.02]"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">{stat.label}</span>
                <stat.icon size={16} className={stat.color} />
              </div>
              <h2 className="text-4xl font-display font-black italic">{stat.value}</h2>
              <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{stat.sub}</p>
            </motion.div>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-emerald-400/20 border-t-emerald-400 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="glass-card overflow-hidden border-white/5 bg-white/[0.02]">
            <div className="p-10 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-2xl font-display font-black uppercase tracking-tight italic">Composiciones Registradas</h3>
              <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Neural Rights Registry</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-white/[0.02] text-[10px] font-black uppercase tracking-[0.3em] text-white/20">
                    <th className="px-10 py-6">Título</th>
                    <th className="px-10 py-6">ISWC</th>
                    <th className="px-10 py-6">PRO</th>
                    <th className="px-10 py-6">Compositores</th>
                    <th className="px-10 py-6 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {compositions.map((comp) => (
                    <tr key={comp.id} className="group hover:bg-white/[0.04] transition-all">
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-emerald-400/10 rounded-xl flex items-center justify-center text-emerald-400">
                            <FileText size={18} />
                          </div>
                          <span className="font-black text-sm uppercase tracking-tight italic">{comp.title}</span>
                        </div>
                      </td>
                      <td className="px-10 py-6 font-mono text-[10px] text-white/40">{comp.iswc || 'PENDIENTE'}</td>
                      <td className="px-10 py-6">
                        <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-black uppercase tracking-widest text-white/40 border border-white/10">{comp.pro || 'GLOBAL'}</span>
                      </td>
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-2">
                          <Users size={14} className="text-white/20" />
                          <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{comp.composers?.length || 0} Autores</span>
                        </div>
                      </td>
                      <td className="px-10 py-6 text-right">
                        <button className="p-3 text-white/20 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-xl transition-all">
                          <Zap size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {compositions.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-10 py-20 text-center text-[10px] font-black uppercase tracking-[0.4em] text-white/10 italic">No hay composiciones registradas</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
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
              <h2 className="text-4xl font-display font-black uppercase tracking-tighter italic">Registrar Composición</h2>
              <p className="text-white/40 text-sm font-medium">Protege tus derechos de autor globales.</p>
            </div>

            <form onSubmit={handleCreate} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4">Título de la Obra</label>
                <input 
                  type="text"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-emerald-400 transition-all"
                  placeholder="Nombre de la canción"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4">ISWC (Opcional)</label>
                  <input 
                    type="text"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-emerald-400 transition-all"
                    placeholder="T-123.456.789-0"
                    value={formData.iswc}
                    onChange={e => setFormData({...formData, iswc: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4">PRO (SAYCO, BMI, ASCAP...)</label>
                  <input 
                    type="text"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-emerald-400 transition-all"
                    placeholder="SAYCO"
                    value={formData.pro}
                    onChange={e => setFormData({...formData, pro: e.target.value})}
                  />
                </div>
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
                  className="flex-1 py-5 bg-emerald-400 text-ink rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-lg shadow-emerald-400/20"
                >
                  Registrar Obra
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Publishing;
