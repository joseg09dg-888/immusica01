import React, { useEffect, useState } from 'react';
import { getArtistSummary, uploadStats, getMyWithholdings, releaseWithholding } from '../services/api';
import { motion } from 'motion/react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { TrendingUp, DollarSign, Play, Globe, Upload, Loader2, CheckCircle2, ShieldAlert, Lock, Unlock, Sparkles, Zap, Activity, ArrowUpRight } from 'lucide-react';
import { toast } from 'sonner';

interface Summary {
  total_streams: number;
  total_ingresos: number;
  byPlatform: Array<{ plataforma: string; streams: number; ingresos: number }>;
  byMonth: Array<{ month: string; streams: number; ingresos: number }>;
  recent: Array<{ fecha: string; plataforma: string; streams: number; ingresos: number; track_title: string }>;
}

const StatsDashboard: React.FC = () => {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [withholdings, setWithholdings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [summaryRes, withholdingsRes] = await Promise.all([
        getArtistSummary(),
        getMyWithholdings()
      ]);
      setSummary(summaryRes.data);
      setWithholdings(withholdingsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRelease = async (id: number) => {
    try {
      await releaseWithholding(id);
      toast.success('Withholding released successfully');
      fetchData();
    } catch (err) {
      toast.error('Error releasing withholding');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      await uploadStats(file);
      toast.success('Neural stats imported successfully!');
      fetchData();
    } catch (err: any) {
      toast.error('Error importing file: ' + (err.response?.data?.error || err.message));
    } finally {
      setUploading(false);
    }
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-ink">
      <div className="relative">
        <div className="absolute inset-0 bg-cyber-cyan/20 blur-2xl rounded-full animate-pulse" />
        <Loader2 className="animate-spin text-cyber-cyan relative z-10" size={64} />
      </div>
    </div>
  );

  if (!summary) return (
    <div className="h-screen flex items-center justify-center text-white/40 uppercase font-black tracking-[0.4em] bg-ink italic">
      Neural Data Unavailable
    </div>
  );

  const COLORS = ['#7D3CFF', '#00F0FF', '#FF00E5', '#FFD700', '#00FF00'];

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-cyber-cyan/5 blur-[150px] rounded-full -mr-64 -mt-64" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-neon-pink/5 blur-[150px] rounded-full -ml-64 -mb-64" />

      <div className="max-w-7xl mx-auto space-y-16 relative z-10">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12">
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyber-cyan/10 border border-cyber-cyan/20 text-cyber-cyan text-[10px] font-black uppercase tracking-widest"
            >
              <Activity size={12} className="animate-pulse" />
              <span>Neural Performance Core</span>
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-6xl lg:text-9xl font-display font-black tracking-tighter uppercase leading-[0.85] italic"
            >
              Artist <br />
              <span className="text-cyber-cyan">Performance</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-white/40 font-medium tracking-wide text-lg"
            >
              Real-time neural streaming data and revenue insights.
            </motion.p>
          </div>
          
          <motion.label 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="group relative cursor-pointer overflow-hidden rounded-[2rem] bg-white/5 border border-white/10 p-1"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-cyber-cyan/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative px-8 py-6 flex items-center gap-4">
              {uploading ? <Loader2 className="animate-spin text-cyber-cyan" size={20} /> : <Upload className="text-cyber-cyan" size={20} />}
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white">
                {uploading ? 'Processing Neural Data...' : 'Import Neural CSV'}
              </span>
              <input type="file" className="hidden" accept=".csv" onChange={handleFileUpload} disabled={uploading} />
            </div>
          </motion.label>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { label: 'Total Streams', value: summary.total_streams.toLocaleString(), sub: 'Lifetime Plays', icon: TrendingUp, color: 'text-cyber-cyan', bg: 'bg-cyber-cyan/10' },
            { label: 'Total Revenue', value: `$${summary.total_ingresos.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, sub: 'Net Earnings', icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
            { label: 'Active Platforms', value: summary.byPlatform.length, sub: 'Global Reach', icon: Globe, color: 'text-electric-purple', bg: 'bg-electric-purple/10' }
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              whileHover={{ y: -10, scale: 1.02 }} 
              className="glass-card p-12 space-y-6 relative overflow-hidden group border-white/5 bg-white/[0.02]"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.bg.replace('/10', '/5')} opacity-0 group-hover:opacity-100 transition-opacity`} />
              <div className="flex items-center justify-between relative z-10">
                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">{stat.label}</p>
                <div className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <stat.icon size={20} />
                </div>
              </div>
              <h2 className="text-5xl lg:text-6xl font-display font-black tracking-tighter italic relative z-10">{stat.value}</h2>
              <div className="flex items-center gap-2 relative z-10">
                <span className="text-[10px] text-white/20 font-bold uppercase tracking-widest">{stat.sub}</span>
                <div className="h-px flex-1 bg-white/5" />
                <ArrowUpRight size={14} className={`${stat.color} opacity-0 group-hover:opacity-100 transition-all`} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
            className="glass-card p-12 space-y-10 border-white/5 bg-white/[0.02]"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-display font-black uppercase tracking-tight italic">Streaming Growth</h3>
              <div className="flex items-center gap-2 px-3 py-1 bg-cyber-cyan/10 text-cyber-cyan text-[10px] font-black uppercase tracking-widest rounded-full border border-cyber-cyan/20">
                <Zap size={12} />
                <span>Neural Trend</span>
              </div>
            </div>
            <div className="h-96 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[...summary.byMonth].reverse()}>
                  <defs>
                    <linearGradient id="colorStreams" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00F0FF" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#00F0FF" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis 
                    dataKey="month" 
                    stroke="#ffffff20" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false}
                    tick={{ fontWeight: 'bold', letterSpacing: '0.1em' }}
                  />
                  <YAxis 
                    stroke="#ffffff20" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false}
                    tick={{ fontWeight: 'bold' }}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0A0A0A', border: '1px solid #ffffff10', borderRadius: '1.5rem', padding: '1.5rem' }}
                    itemStyle={{ color: '#00F0FF', fontWeight: '900', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.2em' }}
                    cursor={{ stroke: '#00F0FF', strokeWidth: 1, strokeDasharray: '5 5' }}
                  />
                  <Area type="monotone" dataKey="streams" stroke="#00F0FF" strokeWidth={4} fillOpacity={1} fill="url(#colorStreams)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* Withholdings & Platform Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="lg:col-span-2 glass-card overflow-hidden border-white/5 bg-white/[0.02]"
          >
            <div className="p-12 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-4 text-neon-pink">
                <div className="w-10 h-10 rounded-xl bg-neon-pink/10 flex items-center justify-center">
                  <ShieldAlert size={20} />
                </div>
                <h3 className="text-2xl font-display font-black uppercase tracking-tight italic">Neural Withholdings</h3>
              </div>
              <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Pending Splits Protocol</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-white/[0.02] text-[10px] font-black uppercase tracking-[0.3em] text-white/20">
                    <th className="px-12 py-8">Track / Collaborator</th>
                    <th className="px-12 py-8">Neural Amount</th>
                    <th className="px-12 py-8">Status</th>
                    <th className="px-12 py-8 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {withholdings.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-12 py-20 text-center text-[10px] font-black uppercase tracking-[0.4em] text-white/10 italic">No pending neural withholdings</td>
                    </tr>
                  ) : withholdings.map((w) => (
                    <tr key={w.id} className="group hover:bg-white/[0.04] transition-all">
                      <td className="px-12 py-8">
                        <div className="flex flex-col gap-1">
                          <span className="font-black text-sm uppercase tracking-tight italic">{w.track_title}</span>
                          <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{w.collaborator_name}</span>
                        </div>
                      </td>
                      <td className="px-12 py-8 font-display font-black text-emerald-400 text-lg italic">${w.cantidad.toFixed(4)}</td>
                      <td className="px-12 py-8">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                          w.estado === 'released' 
                            ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20' 
                            : 'bg-amber-400/10 text-amber-400 border-amber-400/20'
                        }`}>
                          {w.estado}
                        </span>
                      </td>
                      <td className="px-12 py-8 text-right">
                        {w.estado === 'pending' && (
                          <button 
                            onClick={() => handleRelease(w.id)}
                            className="w-10 h-10 bg-white/5 hover:bg-emerald-400/20 hover:text-emerald-400 rounded-xl transition-all flex items-center justify-center group/btn"
                          >
                            <Unlock size={16} className="group-hover:scale-110 transition-transform" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.9 }}
            className="glass-card p-12 space-y-10 border-white/5 bg-white/[0.02]"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-display font-black uppercase tracking-tight italic">Platforms</h3>
              <Globe size={20} className="text-electric-purple" />
            </div>
            <div className="h-96 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary.byPlatform}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis 
                    dataKey="plataforma" 
                    stroke="#ffffff20" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false}
                    tick={{ fontWeight: 'bold', letterSpacing: '0.1em' }}
                  />
                  <YAxis 
                    stroke="#ffffff20" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false}
                    tick={{ fontWeight: 'bold' }}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0A0A0A', border: '1px solid #ffffff10', borderRadius: '1.5rem', padding: '1.5rem' }}
                    cursor={{ fill: '#ffffff03' }}
                  />
                  <Bar dataKey="streams" radius={[12, 12, 0, 0]}>
                    {summary.byPlatform.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* Recent Activity */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="glass-card overflow-hidden border-white/5 bg-white/[0.02]"
        >
          <div className="p-12 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-cyber-cyan/10 flex items-center justify-center text-cyber-cyan">
                <Activity size={20} />
              </div>
              <h3 className="text-2xl font-display font-black uppercase tracking-tight italic">Neural Activity Log</h3>
            </div>
            <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Last 30 Neural Entries</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/[0.02] text-[10px] font-black uppercase tracking-[0.3em] text-white/20">
                  <th className="px-12 py-8">Track</th>
                  <th className="px-12 py-8">Neural Timestamp</th>
                  <th className="px-12 py-8">Platform</th>
                  <th className="px-12 py-8">Streams</th>
                  <th className="px-12 py-8 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {summary.recent.map((s, i) => (
                  <tr key={i} className="group hover:bg-white/[0.04] transition-all">
                    <td className="px-12 py-8">
                      <div className="flex items-center gap-6">
                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-white/20 group-hover:text-cyber-cyan group-hover:bg-cyber-cyan/10 transition-all shadow-lg">
                          <Play size={18} fill="currentColor" />
                        </div>
                        <span className="font-black text-sm uppercase tracking-tight italic">{s.track_title}</span>
                      </div>
                    </td>
                    <td className="px-12 py-8 text-[10px] font-tech font-black text-white/30 uppercase tracking-widest">{s.fecha}</td>
                    <td className="px-12 py-8">
                      <span className="px-4 py-1.5 bg-white/5 rounded-full text-[10px] font-black uppercase tracking-widest text-white/40 border border-white/10 group-hover:border-white/20 transition-all">{s.plataforma}</span>
                    </td>
                    <td className="px-12 py-8 font-display font-black text-cyber-cyan text-lg italic">{s.streams.toLocaleString()}</td>
                    <td className="px-12 py-8 text-right font-display font-black text-emerald-400 text-lg italic">${s.ingresos.toFixed(4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default StatsDashboard;
