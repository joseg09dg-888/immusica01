import React, { useEffect, useState } from 'react';
import { getTransactionHistory, getSubscriptions, getArtistSummary, cancelSubscription } from '../services/api';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wallet as WalletIcon, 
  CreditCard, 
  History, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Zap, 
  Clock, 
  CheckCircle2, 
  Loader2,
  Sparkles,
  ShieldCheck,
  Calendar,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

const Wallet: React.FC = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [txRes, subRes, sumRes] = await Promise.all([
        getTransactionHistory(),
        getSubscriptions(),
        getArtistSummary()
      ]);
      setTransactions(txRes.data);
      setSubscriptions(subRes.data);
      setSummary(sumRes.data);
    } catch (err) {
      console.error(err);
      toast.error('Error loading financial data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCancelSubscription = async (subId: string) => {
    if (!confirm('Are you sure you want to cancel this neural subscription?')) return;
    
    setCancellingId(subId);
    try {
      await cancelSubscription(subId);
      toast.success('Subscription cancelled successfully');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error cancelling subscription');
    } finally {
      setCancellingId(null);
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
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-electric-purple/5 blur-[150px] rounded-full -mr-64 -mt-64 animate-pulse-glow" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-cyber-cyan/5 blur-[150px] rounded-full -ml-64 -mb-64 animate-pulse-glow" />

      <div className="max-w-7xl mx-auto space-y-16 relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12">
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyber-cyan/10 border border-cyber-cyan/20 text-cyber-cyan text-[10px] font-black uppercase tracking-widest"
            >
              <ShieldCheck size={12} className="animate-pulse" />
              <span>Neural Financial Core</span>
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-6xl lg:text-9xl font-display font-black tracking-tighter uppercase leading-[0.85] italic"
            >
              Neural <br />
              <span className="text-cyber-cyan">Wallet</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-white/40 font-medium tracking-wide max-w-xl text-lg"
            >
              Manage your subscriptions, transaction history, and neural revenue streams.
            </motion.p>
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-10 bg-gradient-to-br from-cyber-cyan/10 to-transparent border-cyber-cyan/20 min-w-[320px] relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyber-cyan/10 blur-[40px] rounded-full -mr-16 -mt-16 group-hover:bg-cyber-cyan/20 transition-colors" />
            <div className="space-y-6 relative z-10">
              <div className="flex items-center justify-between">
                <WalletIcon className="text-cyber-cyan" size={24} />
                <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Available Balance</span>
              </div>
              <div className="space-y-1">
                <p className="text-5xl font-display font-black tracking-tighter italic">${summary?.balance?.toLocaleString() || '0.00'}</p>
                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">+12.5% this month</p>
              </div>
              <button className="w-full py-4 bg-cyber-cyan text-ink rounded-xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-cyber-cyan/20 hover:scale-[1.02] transition-all">
                Withdraw Funds
              </button>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Subscriptions */}
          <div className="space-y-8">
            <div className="flex items-center gap-4 text-electric-purple">
              <div className="w-10 h-10 rounded-xl bg-electric-purple/10 flex items-center justify-center">
                <Zap size={20} />
              </div>
              <h3 className="text-sm font-black uppercase tracking-[0.2em]">Active Subscriptions</h3>
            </div>
            
            <div className="space-y-6">
              {subscriptions.length === 0 ? (
                <div className="glass-card p-10 text-center space-y-4 opacity-40">
                  <Clock size={32} className="mx-auto" />
                  <p className="text-[10px] font-black uppercase tracking-widest">No active subscriptions</p>
                </div>
              ) : subscriptions.map((sub, i) => (
                <motion.div
                  key={sub.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="glass-card p-8 space-y-6 group hover:bg-white/[0.05] transition-all relative overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-electric-purple/10 text-electric-purple flex items-center justify-center">
                        <Sparkles size={20} />
                      </div>
                      <div>
                        <h4 className="text-lg font-display font-black uppercase tracking-tight italic">{sub.plan_name}</h4>
                        <p className="text-[10px] text-white/20 font-black uppercase tracking-widest">Neural Tier</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-display font-black text-cyber-cyan italic">${sub.amount}</p>
                      <p className="text-[10px] text-white/20 font-black uppercase tracking-widest">/ month</p>
                    </div>
                  </div>
                  <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                      <CheckCircle2 size={12} />
                      <span>{sub.status}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-[10px] text-white/20 font-black uppercase tracking-widest">Next: {new Date(sub.next_billing).toLocaleDateString()}</p>
                      {sub.status === 'ACTIVE' && (
                        <button 
                          onClick={() => handleCancelSubscription(sub.id)}
                          disabled={cancellingId === sub.id}
                          className="text-neon-pink hover:text-white transition-colors"
                        >
                          {cancellingId === sub.id ? <Loader2 className="animate-spin" size={14} /> : <XCircle size={14} />}
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Transaction History */}
          <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center gap-4 text-cyber-cyan">
              <div className="w-10 h-10 rounded-xl bg-cyber-cyan/10 flex items-center justify-center">
                <History size={20} />
              </div>
              <h3 className="text-sm font-black uppercase tracking-[0.2em]">Neural Transaction Log</h3>
            </div>

            <div className="glass-card overflow-hidden border-white/5 bg-white/[0.02]">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-white/[0.02] text-[10px] font-black uppercase tracking-[0.3em] text-white/20">
                      <th className="px-10 py-8">Transaction</th>
                      <th className="px-10 py-8">Date</th>
                      <th className="px-10 py-8">Status</th>
                      <th className="px-10 py-8 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-10 py-20 text-center text-[10px] font-black uppercase tracking-[0.4em] text-white/10 italic">
                          No neural transactions found
                        </td>
                      </tr>
                    ) : transactions.map((tx, i) => (
                      <tr key={tx.id} className="group hover:bg-white/[0.04] transition-all">
                        <td className="px-10 py-8">
                          <div className="flex items-center gap-6">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all ${
                              tx.type === 'credit' 
                                ? 'bg-emerald-400/10 text-emerald-400 group-hover:bg-emerald-400 group-hover:text-ink' 
                                : 'bg-neon-pink/10 text-neon-pink group-hover:bg-neon-pink group-hover:text-ink'
                            }`}>
                              {tx.type === 'credit' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                            </div>
                            <div>
                              <p className="font-black text-sm uppercase tracking-tight italic">{tx.description}</p>
                              <p className="text-[10px] text-white/20 font-black uppercase tracking-widest">{tx.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-10 py-8">
                          <div className="flex items-center gap-2 text-[10px] font-tech font-black text-white/30 uppercase tracking-widest">
                            <Calendar size={12} />
                            <span>{new Date(tx.date).toLocaleDateString()}</span>
                          </div>
                        </td>
                        <td className="px-10 py-8">
                          <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                            tx.status === 'completed' 
                              ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20' 
                              : 'bg-amber-400/10 text-amber-400 border-amber-400/20'
                          }`}>
                            {tx.status}
                          </span>
                        </td>
                        <td className={`px-10 py-8 text-right font-display font-black text-lg italic ${
                          tx.type === 'credit' ? 'text-emerald-400' : 'text-white'
                        }`}>
                          {tx.type === 'credit' ? '+' : '-'}${tx.amount.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Wallet;
