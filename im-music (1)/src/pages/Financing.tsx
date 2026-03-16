import React, { useState, useEffect } from 'react';
import { checkEligibility, requestAdvance, getAdvances } from '../services/api';
import { motion, AnimatePresence } from 'motion/react';
import { 
  DollarSign, TrendingUp, ShieldCheck, Zap, 
  Loader2, CheckCircle2, ArrowRight, Sparkles, 
  Wallet, Activity, Clock, AlertCircle, Calendar
} from 'lucide-react';
import { toast } from 'sonner';

const Financing: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'offers' | 'my-advances'>('offers');
  const [eligibility, setEligibility] = useState<any>(null);
  const [advances, setAdvances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [advancesLoading, setAdvancesLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [eligRes, advRes] = await Promise.all([
        checkEligibility(),
        getAdvances()
      ]);
      setEligibility(eligRes.data);
      setAdvances(advRes.data);
    } catch (err) {
      console.error(err);
      toast.error('Error loading financing data');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (amount: number) => {
    const reason = prompt('What is the purpose of this advance?', 'New album production');
    if (!reason) return;

    try {
      await requestAdvance(amount, reason);
      toast.success('Application submitted successfully');
      fetchData();
      setActiveTab('my-advances');
    } catch (err: any) {
      toast.error('Error submitting application: ' + (err.response?.data?.error || err.message));
    }
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-ink">
      <Loader2 className="animate-spin text-emerald-400" size={48} />
    </div>
  );

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-400/5 blur-[120px] rounded-full -mr-64 -mt-64 animate-pulse-glow" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cyber-cyan/5 blur-[120px] rounded-full -ml-64 -mb-64 animate-pulse-glow" />

      <div className="max-w-7xl mx-auto space-y-16 relative z-10">
        <div className="text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-400/10 border border-emerald-400/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest"
          >
            <Sparkles size={12} className="animate-pulse" />
            <span>Neural Capital Infrastructure</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl lg:text-9xl font-display font-black tracking-tighter uppercase leading-[0.85] italic"
          >
            Artist <br />
            <span className="text-emerald-400">Financing</span>
          </motion.h1>
          
          {/* Tabs */}
          <div className="flex items-center justify-center gap-4 pt-8">
            {[
              { id: 'offers', label: 'Available Offers', icon: Zap },
              { id: 'my-advances', label: 'My Advances', icon: Activity },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-3 transition-all ${
                  activeTab === tab.id 
                    ? 'bg-emerald-400 text-ink shadow-xl shadow-emerald-400/20' 
                    : 'bg-white/5 text-white/40 hover:bg-white/10'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'offers' ? (
            <motion.div 
              key="offers"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Financing Offers */}
              <div className="lg:col-span-2 space-y-8">
                <div className="glass-card p-12 space-y-10 border-white/5 bg-white/[0.02]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-emerald-400">
                      <div className="w-10 h-10 rounded-xl bg-emerald-400/10 flex items-center justify-center">
                        <TrendingUp size={20} />
                      </div>
                      <h3 className="text-sm font-black uppercase tracking-[0.2em]">Available Capital</h3>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Real-time Analysis</span>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {eligibility?.elegible ? (
                      <motion.div
                        whileHover={{ y: -5, scale: 1.01 }}
                        className="p-10 bg-emerald-400/5 border border-emerald-400/20 rounded-[40px] flex flex-col md:flex-row items-center justify-between gap-10 group cursor-pointer relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="space-y-3 text-center md:text-left relative z-10">
                          <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                            <Wallet size={12} />
                            Royalty Advance Offer
                          </p>
                          <h4 className="text-5xl lg:text-7xl font-display font-black tracking-tighter uppercase italic">${eligibility.ofertaMax.toLocaleString()}</h4>
                          <div className="flex items-center gap-4">
                            <p className="text-xs font-medium text-white/40">Repayment: 15% of royalties</p>
                            <div className="w-1 h-1 rounded-full bg-white/20" />
                            <p className="text-xs font-medium text-white/40">Term: Performance-based</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-10 relative z-10">
                          <div className="text-right hidden md:block">
                            <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">Neural Score</p>
                            <div className="flex items-baseline gap-1">
                              <p className="text-3xl font-display font-black text-emerald-400">{eligibility.puntuacion}</p>
                              <p className="text-xs font-bold text-white/20">/100</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => handleApply(eligibility.ofertaMax)}
                            className="w-20 h-20 rounded-full bg-emerald-400 text-ink flex items-center justify-center hover:scale-110 transition-all shadow-2xl shadow-emerald-400/20 group/btn"
                          >
                            <ArrowRight size={32} className="group-hover:translate-x-1 transition-transform" />
                          </button>
                        </div>
                      </motion.div>
                    ) : (
                      <div className="p-16 text-center space-y-6 bg-white/[0.02] rounded-[40px] border border-white/5 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent" />
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto text-white/20 relative z-10">
                          <ShieldCheck size={40} />
                        </div>
                        <div className="space-y-2 relative z-10">
                          <h4 className="text-2xl font-display font-black uppercase tracking-tight">Analysis Incomplete</h4>
                          <p className="text-sm text-white/40 max-w-md mx-auto leading-relaxed">{eligibility?.razon || 'Neural systems are currently analyzing your streaming data.'}</p>
                        </div>
                        <button className="px-8 py-4 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all relative z-10">
                          Boost Your Stats
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Benefits Card */}
              <div className="space-y-8">
                <motion.div 
                  whileHover={{ y: -5 }} 
                  className="glass-card p-12 space-y-10 bg-emerald-400/[0.03] border-emerald-400/10 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400/10 blur-[40px] rounded-full -mr-16 -mt-16" />
                  
                  <div className="flex items-center gap-4 text-emerald-400 relative z-10">
                    <div className="w-10 h-10 rounded-xl bg-emerald-400/10 flex items-center justify-center">
                      <Zap size={20} />
                    </div>
                    <h3 className="text-sm font-black uppercase tracking-[0.2em]">The Rebellion Advantage</h3>
                  </div>
                  
                  <div className="space-y-10 relative z-10">
                    {[
                      { title: 'No Credit Score', desc: 'We invest based on your music performance, not your credit history.' },
                      { title: 'Keep Your Rights', desc: 'You maintain 100% ownership of your masters and publishing.' },
                      { title: 'Flexible Repayment', desc: 'Payments adjust automatically based on your monthly earnings.' },
                    ].map((benefit, i) => (
                      <div key={i} className="space-y-3 group">
                        <div className="flex items-center gap-3 text-emerald-400">
                          <div className="w-6 h-6 rounded-full bg-emerald-400/10 flex items-center justify-center group-hover:bg-emerald-400 group-hover:text-ink transition-all">
                            <CheckCircle2 size={14} />
                          </div>
                          <span className="text-sm font-black uppercase tracking-tight italic">{benefit.title}</span>
                        </div>
                        <p className="text-xs text-white/40 leading-relaxed pl-9">{benefit.desc}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="my-advances"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {advances.length === 0 ? (
                <div className="glass-card p-20 text-center space-y-6">
                  <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto text-white/20">
                    <Clock size={32} />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/20">No neural advances found.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {advances.map((advance, i) => (
                    <motion.div
                      key={advance.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="glass-card p-8 flex flex-col md:flex-row items-center gap-10 group hover:bg-white/[0.05] transition-all border-white/5"
                    >
                      <div className="w-20 h-20 bg-emerald-400/10 rounded-[1.5rem] flex items-center justify-center text-emerald-400 flex-shrink-0">
                        <DollarSign size={32} />
                      </div>
                      
                      <div className="flex-1 space-y-2 text-center md:text-left">
                        <h3 className="text-2xl font-display font-black uppercase tracking-tight italic">${advance.monto.toLocaleString()} Advance</h3>
                        <div className="flex items-center justify-center md:justify-start gap-6 text-[10px] font-black uppercase tracking-widest text-white/20">
                          <span className="flex items-center gap-2">
                            <Calendar size={12} />
                            {new Date(advance.fecha_solicitud).toLocaleDateString()}
                          </span>
                          <span className="w-1 h-1 bg-white/10 rounded-full" />
                          <span className="flex items-center gap-2">
                            <AlertCircle size={12} />
                            {advance.motivo}
                          </span>
                          <span className="w-1 h-1 bg-white/10 rounded-full" />
                          <span className={`px-3 py-1 rounded-full border ${
                            advance.estado === 'APROBADO' ? 'bg-emerald-400/10 border-emerald-400/20 text-emerald-400' : 
                            advance.estado === 'PENDIENTE' ? 'bg-amber-400/10 border-amber-400/20 text-amber-400' :
                            'bg-white/5 border-white/10 text-white/40'
                          }`}>
                            {advance.estado}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">Repayment Status</p>
                        <p className="text-xl font-display font-black text-white italic">0% Recovered</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Financing;
