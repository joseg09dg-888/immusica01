import React, { useEffect, useState } from 'react';
import { getSplits, getPendingSplits, acceptSplit, rejectSplit, deleteSplit } from '../services/api';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  Loader2, 
  Clock, 
  ShieldCheck, 
  Zap,
  ArrowRight,
  Mail,
  Percent
} from 'lucide-react';
import { toast } from 'sonner';

const SplitsList: React.FC = () => {
  const [splits, setSplits] = useState<any[]>([]);
  const [pendingSplits, setPendingSplits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [splitsRes, pendingRes] = await Promise.all([
        getSplits(),
        getPendingSplits()
      ]);
      setSplits(Array.isArray(splitsRes.data) ? splitsRes.data : []);
      setPendingSplits(Array.isArray(pendingRes.data) ? pendingRes.data : []);
    } catch (err) {
      console.error(err);
      setSplits([]);
      setPendingSplits([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAccept = async (token: string) => {
    try {
      await acceptSplit(token);
      toast.success('Split invitation accepted');
      fetchData();
    } catch (err) {
      toast.error('Error accepting split');
    }
  };

  const handleReject = async (token: string) => {
    try {
      await rejectSplit(token);
      toast.success('Split invitation rejected');
      fetchData();
    } catch (err) {
      toast.error('Error rejecting split');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this split?')) return;
    try {
      await deleteSplit(id);
      toast.success('Split deleted');
      fetchData();
    } catch (err) {
      toast.error('Error deleting split');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="animate-spin text-electric-purple" size={32} />
    </div>
  );

  return (
    <div className="space-y-16">
      {/* Pending Invitations */}
      {Array.isArray(pendingSplits) && pendingSplits.length > 0 && (
        <div className="space-y-8">
          <div className="flex items-center gap-4 text-amber-400">
            <div className="w-10 h-10 rounded-xl bg-amber-400/10 flex items-center justify-center">
              <Clock size={20} />
            </div>
            <h3 className="text-sm font-black uppercase tracking-[0.2em]">Pending Invitations</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.isArray(pendingSplits) && pendingSplits.map((split, i) => (
              <motion.div
                key={split.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass-card p-8 border-amber-400/20 bg-amber-400/[0.02] space-y-6 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-400/10 text-amber-400 flex items-center justify-center">
                      <Mail size={20} />
                    </div>
                    <div>
                      <h4 className="text-lg font-display font-black uppercase tracking-tight italic">{split.track_title}</h4>
                      <p className="text-[10px] text-white/20 font-black uppercase tracking-widest">Invited by: {split.owner_name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-display font-black text-amber-400 italic">{split.percentage}%</p>
                    <p className="text-[10px] text-white/20 font-black uppercase tracking-widest">Share</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 pt-4">
                  <button 
                    onClick={() => handleAccept(split.token)}
                    className="flex-1 py-4 bg-emerald-400 text-ink rounded-xl font-black uppercase tracking-widest text-[10px] hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 size={14} />
                    Accept
                  </button>
                  <button 
                    onClick={() => handleReject(split.token)}
                    className="flex-1 py-4 bg-white/5 border border-white/10 text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-neon-pink/10 hover:text-neon-pink hover:border-neon-pink/20 transition-all flex items-center justify-center gap-2"
                  >
                    <XCircle size={14} />
                    Reject
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Active Splits */}
      <div className="space-y-8">
        <div className="flex items-center gap-4 text-cyber-cyan">
          <div className="w-10 h-10 rounded-xl bg-cyber-cyan/10 flex items-center justify-center">
            <ShieldCheck size={20} />
          </div>
          <h3 className="text-sm font-black uppercase tracking-[0.2em]">Active Neural Splits</h3>
        </div>

        <div className="glass-card overflow-hidden border-white/5 bg-white/[0.02]">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/[0.02] text-[10px] font-black uppercase tracking-[0.3em] text-white/20">
                  <th className="px-10 py-8">Track / Collaborator</th>
                  <th className="px-10 py-8">Role</th>
                  <th className="px-10 py-8">Share</th>
                  <th className="px-10 py-8 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {!Array.isArray(splits) || splits.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-10 py-20 text-center text-[10px] font-black uppercase tracking-[0.4em] text-white/10 italic">
                      No active neural splits found
                    </td>
                  </tr>
                ) : splits.map((split, i) => (
                  <tr key={split.id} className="group hover:bg-white/[0.04] transition-all">
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-6">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/20 group-hover:text-cyber-cyan group-hover:bg-cyber-cyan/10 transition-all shadow-lg">
                          <Users size={18} />
                        </div>
                        <div>
                          <p className="font-black text-sm uppercase tracking-tight italic">{split.track_title}</p>
                          <p className="text-[10px] text-white/20 font-black uppercase tracking-widest">{split.collaborator_name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <span className="px-4 py-1.5 bg-white/5 rounded-full text-[10px] font-black uppercase tracking-widest text-white/40 border border-white/10">
                        {split.role || 'Collaborator'}
                      </span>
                    </td>
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-2">
                        <span className="font-display font-black text-cyber-cyan text-xl italic">{split.percentage}%</span>
                        <Percent size={12} className="text-white/20" />
                      </div>
                    </td>
                    <td className="px-10 py-8 text-right">
                      <button 
                        onClick={() => handleDelete(split.id)}
                        className="w-10 h-10 bg-white/5 hover:bg-neon-pink/10 hover:text-neon-pink rounded-xl transition-all flex items-center justify-center group/btn"
                      >
                        <Trash2 size={16} className="group-hover:scale-110 transition-transform" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SplitsList;
