import React, { useState } from 'react';
import { GitBranch, Globe, Zap, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { createGitHubBranch, testNgrok } from '../../services/api';
import { toast } from 'sonner';

const AdminInfrastructure: React.FC = () => {
  const [branchName, setBranchName] = useState('');
  const [ngrokPort, setNgrokPort] = useState(3000);
  const [loading, setLoading] = useState<string | null>(null);

  const handleCreateBranch = async () => {
    if (!branchName) return;
    setLoading('github');
    try {
      await createGitHubBranch(branchName);
      toast.success('GitHub branch created successfully (Simulated)');
      setBranchName('');
    } catch (err: any) {
      toast.error('GitHub error: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(null);
    }
  };

  const handleTestNgrok = async () => {
    setLoading('ngrok');
    try {
      await testNgrok(ngrokPort);
      toast.success('Ngrok tunnel established successfully (Simulated)');
    } catch (err: any) {
      toast.error('Ngrok error: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-4xl font-display font-black uppercase tracking-tighter italic">Infrastructure</h2>
        <p className="text-white/40 text-sm font-medium">Manage deployment tunnels and version control links.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* GitHub Section */}
        <div className="glass-card p-8 space-y-6 border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-4 text-electric-purple">
            <div className="w-10 h-10 rounded-xl bg-electric-purple/10 flex items-center justify-center">
              <GitBranch size={20} />
            </div>
            <h3 className="text-sm font-black uppercase tracking-[0.2em]">GitHub Integration</h3>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/20">New Branch Name</label>
              <input
                type="text"
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                placeholder="feature/ai-optimization"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-electric-purple/50 outline-none transition-all"
              />
            </div>
            <button
              onClick={handleCreateBranch}
              disabled={loading === 'github' || !branchName}
              className="w-full py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2"
            >
              {loading === 'github' ? <Loader2 className="animate-spin" size={14} /> : <GitBranch size={14} />}
              <span>Create Branch</span>
            </button>
          </div>
        </div>

        {/* Ngrok Section */}
        <div className="glass-card p-8 space-y-6 border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-4 text-neon-pink">
            <div className="w-10 h-10 rounded-xl bg-neon-pink/10 flex items-center justify-center">
              <Globe size={20} />
            </div>
            <h3 className="text-sm font-black uppercase tracking-[0.2em]">Ngrok Tunnel</h3>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/20">Local Port</label>
              <input
                type="number"
                value={ngrokPort}
                onChange={(e) => setNgrokPort(parseInt(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-neon-pink/50 outline-none transition-all"
              />
            </div>
            <button
              onClick={handleTestNgrok}
              disabled={loading === 'ngrok'}
              className="w-full py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2"
            >
              {loading === 'ngrok' ? <Loader2 className="animate-spin" size={14} /> : <Zap size={14} />}
              <span>Start Tunnel</span>
            </button>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="glass-card p-8 border-white/5 bg-white/[0.02] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-400/10 flex items-center justify-center text-emerald-400">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-sm font-black uppercase tracking-tight">Deployment Pipeline</p>
            <p className="text-[10px] text-white/40 uppercase tracking-widest">All systems operational</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
          <AlertCircle size={14} className="text-electric-purple" />
          <span className="text-[10px] font-black uppercase tracking-widest text-white/40">v2.4.0-stable</span>
        </div>
      </div>
    </div>
  );
};

export default AdminInfrastructure;
