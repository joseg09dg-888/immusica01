import React, { useState, useEffect } from 'react';
import { createSplit, getTracks } from '../services/api';
import { motion } from 'motion/react';
import { Users, Mail, Percent, Music, UserPlus, Loader2, CheckCircle2, Sparkles, Zap, ArrowRight, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

interface Track {
  id: number;
  title: string;
}

const SplitForm: React.FC = () => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [trackId, setTrackId] = useState<number | ''>('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [percentage, setPercentage] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getTracks()
      .then(res => setTracks(res.data))
      .catch(err => console.error('Error loading tracks:', err));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackId || !name || !email || !percentage) return;

    setLoading(true);
    try {
      const res = await createSplit(Number(trackId), { name, email, percentage: Number(percentage), role });
      toast.success('Split invitation sent successfully!');
      // Reset form
      setName('');
      setEmail('');
      setPercentage('');
      setRole('');
    } catch (err: any) {
      toast.error('Error: ' + (err.response?.data?.error || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="glass-card p-12 lg:p-20 border-white/5 bg-white/[0.02] relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-64 h-64 bg-electric-purple/5 blur-[60px] rounded-full -mr-32 -mt-32" />
      
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-16 relative z-10">
            <div className="space-y-10 lg:col-span-2">
              <div className="flex items-center gap-4 text-cyber-cyan">
                <div className="w-10 h-10 rounded-xl bg-cyber-cyan/10 flex items-center justify-center">
                  <Music size={20} />
                </div>
                <h3 className="text-sm font-black uppercase tracking-[0.2em]">Track Architecture</h3>
              </div>
              <div className="relative group">
                <select 
                  value={trackId} 
                  onChange={e => setTrackId(Number(e.target.value))} 
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-8 py-6 focus:outline-none focus:border-cyber-cyan/40 focus:bg-white/10 transition-all appearance-none text-sm font-black uppercase tracking-tight italic"
                >
                  <option value="" className="bg-ink">Select Neural Track</option>
                  {tracks.map(t => (
                    <option key={t.id} value={t.id} className="bg-ink">{t.title}</option>
                  ))}
                </select>
                <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none text-white/20 group-hover:text-cyber-cyan transition-colors">
                  <Music size={20} />
                </div>
              </div>
            </div>

            <div className="space-y-10">
              <div className="flex items-center gap-4 text-electric-purple">
                <div className="w-10 h-10 rounded-xl bg-electric-purple/10 flex items-center justify-center">
                  <UserPlus size={20} />
                </div>
                <h3 className="text-sm font-black uppercase tracking-[0.2em]">Collaborator Identity</h3>
              </div>
              <div className="space-y-6">
                <div className="relative group">
                  <input 
                    type="text" 
                    placeholder="Collaborator Name"
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    required 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-14 pr-8 py-6 focus:outline-none focus:border-electric-purple/40 focus:bg-white/10 transition-all text-sm font-bold placeholder:text-white/20"
                  />
                  <Users className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-hover:text-electric-purple transition-colors" size={20} />
                </div>
                <div className="relative group">
                  <input 
                    type="email" 
                    placeholder="Neural Email Address"
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    required 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-14 pr-8 py-6 focus:outline-none focus:border-electric-purple/40 focus:bg-white/10 transition-all text-sm font-bold placeholder:text-white/20"
                  />
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-hover:text-electric-purple transition-colors" size={20} />
                </div>
              </div>
            </div>

            <div className="space-y-10">
              <div className="flex items-center gap-4 text-neon-pink">
                <div className="w-10 h-10 rounded-xl bg-neon-pink/10 flex items-center justify-center">
                  <Percent size={20} />
                </div>
                <h3 className="text-sm font-black uppercase tracking-[0.2em]">Split Configuration</h3>
              </div>
              <div className="space-y-6">
                <div className="relative group">
                  <input 
                    type="number" 
                    step="0.1" 
                    min="0.1" 
                    max="100" 
                    placeholder="Percentage Share (%)"
                    value={percentage} 
                    onChange={e => setPercentage(e.target.value)} 
                    required 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-14 pr-8 py-6 focus:outline-none focus:border-neon-pink/40 focus:bg-white/10 transition-all text-sm font-bold placeholder:text-white/20"
                  />
                  <Percent className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-hover:text-neon-pink transition-colors" size={20} />
                </div>
                <div className="relative group">
                  <input 
                    type="text" 
                    placeholder="Role (e.g. Lead Producer, Vocalist)"
                    value={role} 
                    onChange={e => setRole(e.target.value)} 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-14 pr-8 py-6 focus:outline-none focus:border-neon-pink/40 focus:bg-white/10 transition-all text-sm font-bold placeholder:text-white/20"
                  />
                  <Users className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-hover:text-neon-pink transition-colors" size={20} />
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 pt-12">
              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-8 bg-electric-purple text-white rounded-[2rem] font-black uppercase tracking-[0.4em] text-[10px] shadow-2xl shadow-electric-purple/20 hover:shadow-electric-purple/40 hover:scale-[1.02] transition-all flex items-center justify-center gap-4 relative overflow-hidden group/btn"
              >
                <div className="absolute inset-0 bg-white translate-y-full group-hover/btn:translate-y-0 transition-transform duration-500 ease-out" />
                <span className="relative z-10 flex items-center gap-4">
                  {loading ? <Loader2 className="animate-spin" size={20} /> : <Zap size={20} />}
                  <span>{loading ? 'Processing Neural Split...' : 'Initialize Royalty Split'}</span>
                </span>
              </button>
              
              <div className="mt-10 p-8 bg-white/[0.02] rounded-[32px] border border-white/5 flex items-center gap-6">
                <div className="w-12 h-12 bg-cyber-cyan/10 rounded-full flex items-center justify-center text-cyber-cyan shrink-0">
                  <ShieldCheck size={24} />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-black uppercase tracking-tight italic">Security Protocol</p>
                  <p className="text-xs text-white/40 leading-relaxed">
                    Funds will be withheld in the <span className="text-white font-bold">Neural Escrow</span> until the collaborator accepts the invitation.
                  </p>
                </div>
              </div>
            </div>
          </form>
        </motion.div>
  );
};

export default SplitForm;
