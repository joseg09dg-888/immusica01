import React, { useState, useEffect } from 'react';
import { 
  getMiBranding, getBrandingQuestions, submitBrandingTest, 
  generateSensoryBranding, generateTargetMarket, generateContentPlan,
  generatePromotionalContent, getTracks
} from '../services/api';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Palette, Share2, Megaphone, Loader2, CheckCircle2, Globe, 
  Sparkles, Target, Calendar, ArrowRight, ChevronRight, 
  Brain, Heart, Zap, Eye, Music, Layers
} from 'lucide-react';
import { toast } from 'sonner';

const Marketing: React.FC = () => {
  const [branding, setBranding] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'test' | 'sensory' | 'market' | 'plan' | 'promo'>('overview');
  
  // Test State
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>(new Array(12).fill(''));
  const [submittingTest, setSubmittingTest] = useState(false);

  // Promo State
  const [tracks, setTracks] = useState<any[]>([]);
  const [selectedTrackId, setSelectedTrackId] = useState<number | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState('Instagram');
  const [promoContent, setPromoContent] = useState<any>(null);
  const [generatingPromo, setGeneratingPromo] = useState(false);

  useEffect(() => {
    fetchBranding();
    fetchTracks();
  }, []);

  const fetchTracks = async () => {
    try {
      const res = await getTracks();
      setTracks(res.data);
      if (res.data.length > 0) setSelectedTrackId(res.data[0].id);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBranding = async () => {
    setLoading(true);
    try {
      const res = await getMiBranding();
      setBranding(res.data);
      if (!res.data.arquetipo) {
        const qRes = await getBrandingQuestions();
        setQuestions(qRes.data);
        setActiveTab('test');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTestSubmit = async () => {
    if (answers.some(a => !a)) {
      toast.error('Por favor responde todas las preguntas');
      return;
    }
    setSubmittingTest(true);
    try {
      await submitBrandingTest(answers);
      toast.success('¡Arquetipo generado!');
      await fetchBranding();
      setActiveTab('overview');
    } catch (err) {
      toast.error('Error al procesar el test');
    } finally {
      setSubmittingTest(false);
    }
  };

  const runGeneration = async (type: 'sensory' | 'market' | 'plan') => {
    setLoading(true);
    try {
      if (type === 'sensory') await generateSensoryBranding();
      if (type === 'market') await generateTargetMarket();
      if (type === 'plan') await generateContentPlan();
      toast.success('¡Generación completada!');
      await fetchBranding();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error en la generación');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePromo = async () => {
    if (!selectedTrackId) return;
    setGeneratingPromo(true);
    try {
      const res = await generatePromotionalContent(selectedTrackId, selectedPlatform);
      setPromoContent(res.data);
      toast.success('Contenido promocional generado');
    } catch (err) {
      toast.error('Error al generar contenido');
    } finally {
      setGeneratingPromo(false);
    }
  };

  if (loading && !branding) return (
    <div className="h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-cyber-cyan" size={48} />
    </div>
  );

  return (
    <div className="min-h-screen pt-32 pb-20 px-6">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div className="space-y-4">
            <h1 className="text-5xl lg:text-7xl font-display font-black tracking-tighter uppercase leading-none">
              Artist <br />
              <span className="text-neon-pink">Branding</span>
            </h1>
            <p className="text-white/40 font-medium tracking-wide max-w-xl">
              Our neural engine builds your identity from the ground up.
            </p>
          </div>

          <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview', icon: Eye },
              { id: 'sensory', label: 'Sensory', icon: Palette },
              { id: 'market', label: 'Market', icon: Target },
              { id: 'plan', label: 'Content Plan', icon: Calendar },
              { id: 'promo', label: 'AI Promo', icon: Megaphone },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeTab === tab.id ? 'bg-white text-ink shadow-xl' : 'text-white/40 hover:text-white'
                }`}
              >
                <tab.icon size={14} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'test' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="glass-card p-12 space-y-12"
            >
              <div className="text-center space-y-4">
                <Brain className="mx-auto text-neon-pink" size={48} />
                <h2 className="text-3xl font-display font-black uppercase">Archetype Discovery</h2>
                <p className="text-white/40 text-sm max-w-lg mx-auto">Responde con honestidad. Tu arquetipo definirá toda tu estrategia de marca.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {questions.map((q, i) => (
                  <div key={i} className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30">{q}</label>
                    <textarea
                      value={answers[i]}
                      onChange={(e) => {
                        const newAnswers = [...answers];
                        newAnswers[i] = e.target.value;
                        setAnswers(newAnswers);
                      }}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-sm focus:border-neon-pink transition-colors outline-none min-h-[100px]"
                      placeholder="Tu respuesta..."
                    />
                  </div>
                ))}
              </div>

              <button
                onClick={handleTestSubmit}
                disabled={submittingTest}
                className="w-full py-6 bg-neon-pink text-white rounded-2xl font-black uppercase tracking-[0.3em] text-xs shadow-2xl shadow-neon-pink/20 hover:shadow-neon-pink/40 hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
              >
                {submittingTest ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
                <span>{submittingTest ? 'Analyzing Identity...' : 'Generate Archetype'}</span>
              </button>
            </motion.div>
          )}

          {activeTab === 'overview' && branding?.arquetipo && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              <div className="lg:col-span-2 space-y-8">
                <div className="glass-card p-12 space-y-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-12 opacity-5">
                    <Brain size={200} />
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-neon-pink uppercase tracking-[0.3em]">Core Archetype</p>
                    <h2 className="text-6xl lg:text-8xl font-display font-black uppercase tracking-tighter">{branding.arquetipo}</h2>
                  </div>
                  <div className="space-y-4 max-w-2xl">
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Brand Manifesto</p>
                    <p className="text-2xl font-medium leading-tight italic text-white/80">"{branding.manifiesto}"</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="glass-card p-10 space-y-6">
                    <div className="flex items-center gap-3 text-cyber-cyan">
                      <Layers size={20} />
                      <h3 className="text-xs font-black uppercase tracking-widest">Identity Status</h3>
                    </div>
                    <div className="space-y-4">
                      {[
                        { label: 'Sensory Branding', status: !!branding.colores },
                        { label: 'Market Analysis', status: !!branding.mercados_prioritarios },
                        { label: 'Content Strategy', status: !!branding.plan_contenidos },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                          <span className="text-xs font-bold">{item.label}</span>
                          {item.status ? (
                            <CheckCircle2 size={16} className="text-emerald-400" />
                          ) : (
                            <span className="text-[10px] font-black uppercase text-white/20">Pending</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="glass-card p-10 space-y-6 flex flex-col justify-between">
                    <div className="space-y-4">
                      <h3 className="text-xl font-display font-black uppercase">Next Steps</h3>
                      <p className="text-xs text-white/40 leading-relaxed">Complete your sensory branding to unlock visual assets and market targeting.</p>
                    </div>
                    <button 
                      onClick={() => setActiveTab('sensory')}
                      className="w-full py-4 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                    >
                      Continue Setup <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <div className="glass-card p-10 space-y-8">
                  <div className="flex items-center gap-3 text-neon-pink">
                    <Zap size={20} />
                    <h3 className="text-xs font-black uppercase tracking-widest">Quick Actions</h3>
                  </div>
                  <div className="grid gap-4">
                    <button onClick={() => runGeneration('sensory')} className="p-6 bg-white/5 hover:bg-white/10 rounded-2xl text-left transition-all group">
                      <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">Re-Generate</p>
                      <p className="text-sm font-bold group-hover:text-neon-pink transition-colors">Sensory Branding</p>
                    </button>
                    <button onClick={() => runGeneration('market')} className="p-6 bg-white/5 hover:bg-white/10 rounded-2xl text-left transition-all group">
                      <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">Update</p>
                      <p className="text-sm font-bold group-hover:text-cyber-cyan transition-colors">Market Analysis</p>
                    </button>
                    <button onClick={() => runGeneration('plan')} className="p-6 bg-white/5 hover:bg-white/10 rounded-2xl text-left transition-all group">
                      <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">Refresh</p>
                      <p className="text-sm font-bold group-hover:text-emerald-400 transition-colors">Content Plan</p>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'sensory' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {!branding?.colores ? (
                <div className="glass-card p-20 text-center space-y-8">
                  <Palette size={64} className="mx-auto text-white/10" />
                  <div className="space-y-4">
                    <h2 className="text-3xl font-display font-black uppercase">Sensory Identity</h2>
                    <p className="text-white/40 max-w-md mx-auto">Generate your visual and sensory profile based on your archetype.</p>
                  </div>
                  <button onClick={() => runGeneration('sensory')} className="btn-primary px-12">Generate Now</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <div className="glass-card p-10 space-y-6">
                    <h3 className="text-xs font-black uppercase tracking-widest text-white/20">Visual Palette</h3>
                    <p className="text-sm font-medium leading-relaxed">{branding.colores}</p>
                  </div>
                  <div className="glass-card p-10 space-y-6">
                    <h3 className="text-xs font-black uppercase tracking-widest text-white/20">Olfactory Profile</h3>
                    <p className="text-sm font-medium leading-relaxed">{branding.olores}</p>
                  </div>
                  <div className="glass-card p-10 space-y-6">
                    <h3 className="text-xs font-black uppercase tracking-widest text-white/20">Flavor Profile</h3>
                    <p className="text-sm font-medium leading-relaxed">{branding.sabores}</p>
                  </div>
                  <div className="glass-card p-10 space-y-6">
                    <h3 className="text-xs font-black uppercase tracking-widest text-white/20">Textural Essence</h3>
                    <p className="text-sm font-medium leading-relaxed">{branding.texturas}</p>
                  </div>
                  <div className="glass-card p-10 space-y-6">
                    <h3 className="text-xs font-black uppercase tracking-widest text-white/20">Tribe Language</h3>
                    <p className="text-sm font-medium leading-relaxed">{branding.lenguaje_tribu}</p>
                  </div>
                  <div className="glass-card p-10 space-y-6">
                    <h3 className="text-xs font-black uppercase tracking-widest text-white/20">Core Symbol</h3>
                    <p className="text-sm font-medium leading-relaxed">{branding.simbolo}</p>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'market' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {!branding?.mercados_prioritarios ? (
                <div className="glass-card p-20 text-center space-y-8">
                  <Target size={64} className="mx-auto text-white/10" />
                  <div className="space-y-4">
                    <h2 className="text-3xl font-display font-black uppercase">Market Analysis</h2>
                    <p className="text-white/40 max-w-md mx-auto">Discover where your music will resonate most and who your ideal listener is.</p>
                  </div>
                  <button onClick={() => runGeneration('market')} className="btn-primary px-12">Analyze Market</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="glass-card p-12 space-y-8">
                    <h3 className="text-2xl font-display font-black uppercase">Priority Markets</h3>
                    <div className="space-y-4">
                      {JSON.parse(branding.mercados_prioritarios).map((market: string, i: number) => (
                        <div key={i} className="flex items-center gap-6 p-6 bg-white/5 rounded-2xl border border-white/5">
                          <div className="w-10 h-10 bg-cyber-cyan/10 text-cyber-cyan rounded-xl flex items-center justify-center font-black">
                            0{i + 1}
                          </div>
                          <p className="text-sm font-bold">{market}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="glass-card p-12 space-y-8">
                    <h3 className="text-2xl font-display font-black uppercase">Listener Profile</h3>
                    <div className="p-8 bg-white/5 rounded-[2rem] border border-white/5">
                      <p className="text-lg font-medium leading-relaxed text-white/80 italic">
                        "{branding.perfil_oyente}"
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'plan' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {!branding?.plan_contenidos ? (
                <div className="glass-card p-20 text-center space-y-8">
                  <Calendar size={64} className="mx-auto text-white/10" />
                  <div className="space-y-4">
                    <h2 className="text-3xl font-display font-black uppercase">30-Day Content Plan</h2>
                    <p className="text-white/40 max-w-md mx-auto">Get a day-by-day strategy for Reels and TikTok based on neuro-marketing.</p>
                  </div>
                  <button onClick={() => runGeneration('plan')} className="btn-primary px-12">Generate Plan</button>
                </div>
              ) : (
                <div className="space-y-12">
                  <div className="flex items-center justify-between">
                    <h3 className="text-3xl font-display font-black uppercase">The 30-Day Rebellion</h3>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Generated on {new Date(branding.fecha_generacion_plan).toLocaleDateString()}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {JSON.parse(branding.plan_contenidos).map((day: any, i: number) => (
                      <div key={i} className="glass-card p-8 space-y-6 hover:border-neon-pink/40 transition-colors">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-neon-pink uppercase tracking-widest">Day {day.dia}</span>
                          <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">{day.duracion}</span>
                        </div>
                        <h4 className="text-xl font-display font-black uppercase leading-tight">{day.titulo}</h4>
                        <div className="space-y-4">
                          <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Script</p>
                          <div className="space-y-2">
                            {day.guion.map((step: any, j: number) => (
                              <div key={j} className="text-[10px] leading-relaxed">
                                <span className="text-cyber-cyan font-bold">{step.tiempo}:</span> {step.visual}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">{day.neurociencia}</span>
                          <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center text-white/20">
                            <ChevronRight size={14} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'promo' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              <div className="lg:col-span-1 space-y-8">
                <div className="glass-card p-8 space-y-8">
                  <h3 className="text-xl font-display font-black uppercase italic">Promo Config</h3>
                  
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Select Track</label>
                    <select 
                      value={selectedTrackId || ''}
                      onChange={(e) => setSelectedTrackId(Number(e.target.value))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm outline-none focus:border-neon-pink transition-all"
                    >
                      {tracks.map(t => (
                        <option key={t.id} value={t.id}>{t.title}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Platform</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['Instagram', 'TikTok', 'Twitter', 'Facebook'].map(p => (
                        <button
                          key={p}
                          onClick={() => setSelectedPlatform(p)}
                          className={`p-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                            selectedPlatform === p ? 'bg-neon-pink border-neon-pink text-white' : 'bg-white/5 border-white/10 text-white/40 hover:text-white'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button 
                    onClick={handleGeneratePromo}
                    disabled={generatingPromo || !selectedTrackId}
                    className="w-full py-4 bg-neon-pink text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-neon-pink/20 hover:scale-105 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {generatingPromo ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
                    <span>Generate Content</span>
                  </button>
                </div>
              </div>

              <div className="lg:col-span-2">
                {!promoContent ? (
                  <div className="glass-card p-20 text-center space-y-6 border-dashed border-white/10">
                    <Megaphone size={48} className="mx-auto text-white/10" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Select a track and platform to generate promo content</p>
                  </div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-card p-10 space-y-10"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-2xl font-display font-black uppercase italic text-neon-pink">{selectedPlatform} Strategy</h3>
                      <div className="px-3 py-1 bg-white/5 rounded-full border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/40">
                        Neural AI Output
                      </div>
                    </div>

                    <div className="space-y-8">
                      <div className="space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Copy / Caption</p>
                        <div className="p-6 bg-white/5 rounded-2xl border border-white/5 text-sm leading-relaxed text-white/80 italic">
                          "{promoContent.copy}"
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Hashtags</p>
                          <div className="flex flex-wrap gap-2">
                            {promoContent.hashtags.map((h: string, i: number) => (
                              <span key={i} className="px-3 py-1 bg-cyber-cyan/10 text-cyber-cyan rounded-lg text-[10px] font-bold">
                                {h}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-4">
                          <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Best Time to Post</p>
                          <div className="p-4 bg-white/5 rounded-xl border border-white/5 text-sm font-bold text-emerald-400">
                            {promoContent.best_time}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Visual Suggestion</p>
                        <p className="text-xs text-white/60 leading-relaxed">{promoContent.visual_suggestion}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Marketing;
