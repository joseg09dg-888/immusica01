import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, FileText, Scale, Gavel, Loader2, Send, Bot, Sparkles, Zap, Shield, AlertCircle, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { queryLegalAgent } from '../services/api';

const Legal: React.FC = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;

    setLoading(true);
    try {
      const res = await queryLegalAgent(query);
      setResponse(res.data.answer);
      toast.success('Neural legal analysis complete');
    } catch (err: any) {
      toast.error('Error consulting neural legal agent');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-cyber-cyan/5 blur-[150px] rounded-full -mr-64 -mt-64" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-neon-pink/5 blur-[150px] rounded-full -ml-64 -mb-64" />

      <div className="max-w-7xl mx-auto space-y-16 relative z-10">
        <div className="text-center space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyber-cyan/10 border border-cyber-cyan/20 text-cyber-cyan text-[10px] font-black uppercase tracking-widest"
          >
            <Shield size={12} className="animate-pulse" />
            <span>Neural Compliance Protocol</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl lg:text-9xl font-display font-black tracking-tighter uppercase leading-[0.85] italic"
          >
            Legal <br />
            <span className="text-cyber-cyan">Agent</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-white/40 font-medium tracking-wide max-w-xl mx-auto text-lg"
          >
            AI-powered neural assistance for contracts, copyright, and royalty disputes.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Legal Tools */}
          <div className="space-y-8">
            {[
              { icon: FileText, title: 'Contract Review', desc: 'Neural analysis of complex agreements.', color: 'text-cyber-cyan', bg: 'bg-cyber-cyan/10' },
              { icon: Scale, title: 'Copyright Check', desc: 'Verify ownership and protection status.', color: 'text-neon-pink', bg: 'bg-neon-pink/10' },
              { icon: Gavel, title: 'Dispute Resolution', desc: 'Guidance on royalty and split conflicts.', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
            ].map((tool, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                whileHover={{ x: 10, scale: 1.02 }}
                className="glass-card p-10 flex items-start gap-8 group cursor-pointer border-white/5 bg-white/[0.02]"
              >
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${tool.bg} ${tool.color} group-hover:scale-110 shadow-lg`}>
                  <tool.icon size={28} />
                </div>
                <div className="space-y-3">
                  <h3 className="text-xl font-display font-black uppercase tracking-tight italic">{tool.title}</h3>
                  <p className="text-white/40 text-xs font-medium leading-relaxed">{tool.desc}</p>
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className={tool.color}>Initialize</span>
                    <ArrowRight size={12} className={tool.color} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* AI Chat Agent */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="lg:col-span-2 space-y-8"
          >
            <div className="glass-card p-12 flex flex-col h-[700px] border-white/5 bg-white/[0.02] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-cyber-cyan/5 blur-[80px] rounded-full -mr-32 -mt-32" />
              
              <div className="flex items-center justify-between mb-12 relative z-10">
                <div className="flex items-center gap-4 text-cyber-cyan">
                  <div className="w-10 h-10 rounded-xl bg-cyber-cyan/10 flex items-center justify-center">
                    <Bot size={20} />
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-[0.3em]">Neural Legal Assistant</h3>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                  <div className="w-2 h-2 rounded-full bg-cyber-cyan animate-pulse" />
                  <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Active Link</span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-8 pr-4 custom-scrollbar relative z-10">
                <AnimatePresence mode="wait">
                  {response ? (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-6"
                    >
                      <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-10 space-y-6 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-cyber-cyan/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="flex items-center gap-3 text-cyber-cyan relative z-10">
                          <ShieldCheck size={20} />
                          <span className="text-[10px] font-black uppercase tracking-[0.3em]">Neural Legal Opinion</span>
                        </div>
                        <p className="text-lg leading-relaxed text-white/80 whitespace-pre-wrap font-medium relative z-10">{response}</p>
                        <div className="pt-6 border-t border-white/5 flex items-center justify-between relative z-10">
                          <div className="flex items-center gap-2 text-[10px] font-black text-white/20 uppercase tracking-widest">
                            <AlertCircle size={12} />
                            <span>AI Generated Content</span>
                          </div>
                          <button 
                            onClick={() => setResponse(null)}
                            className="text-[10px] font-black text-cyber-cyan uppercase tracking-widest hover:text-white transition-colors"
                          >
                            New Consultation
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-8 opacity-20">
                      <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center">
                        <ShieldCheck size={48} className="text-cyber-cyan" />
                      </div>
                      <div className="space-y-3">
                        <p className="text-2xl font-display font-black uppercase tracking-tight">Neural Link Ready</p>
                        <p className="text-sm max-w-xs mx-auto leading-relaxed">Consult your AI Legal Agent for instant analysis and guidance.</p>
                      </div>
                    </div>
                  )}
                </AnimatePresence>
              </div>

              <form onSubmit={handleSubmit} className="mt-12 relative z-10">
                <div className="relative group">
                  <input 
                    type="text" 
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Ask about contracts, splits, or copyright..."
                    className="w-full bg-white/5 border border-white/10 rounded-[2rem] px-10 py-8 focus:outline-none focus:border-cyber-cyan transition-all text-sm font-bold placeholder:text-white/20 pr-24 group-hover:bg-white/[0.08]"
                  />
                  <button 
                    type="submit"
                    disabled={loading || !query}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-16 h-16 bg-cyber-cyan text-ink rounded-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 shadow-xl shadow-cyber-cyan/20 group-hover:shadow-cyber-cyan/40"
                  >
                    {loading ? <Loader2 className="animate-spin" size={24} /> : <Send size={24} />}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Legal;
