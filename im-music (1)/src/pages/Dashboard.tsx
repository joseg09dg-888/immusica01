import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { 
  LayoutDashboard, Zap, BarChart3, Users, 
  ShieldCheck, DollarSign, Database, ShoppingBag,
  Rocket, ArrowRight, Sparkles, Target, Facebook,
  Music, Globe, TrendingUp, Activity, Bell, Settings,
  CreditCard, Headphones, Mic2, Radio, Wallet, ArrowUpRight, Shield,
  Github, GitBranch, GitCommit, ExternalLink, Copy, Server, MessageSquare, Image
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getArtistSummary, getSystemInfo } from '../services/api';
import { toast } from 'sonner';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [stats, setStats] = useState<any>(null);
  const [systemInfo, setSystemInfo] = useState<any>(null);

  useEffect(() => {
    getArtistSummary()
      .then(res => setStats(res.data))
      .catch(console.error);

    getSystemInfo()
      .then(res => setSystemInfo(res.data))
      .catch(console.error);
  }, []);

  const services = [
    { 
      title: 'Neural Vault', 
      desc: 'Secure backup for masters & assets.', 
      path: '/vault', 
      icon: Database, 
      color: 'text-electric-purple',
      bg: 'bg-electric-purple/10',
      size: 'lg',
      accent: 'from-electric-purple/20 to-transparent'
    },
    { 
      title: 'Marketing & AI', 
      desc: 'Archetypes, Branding & 30-day Content Plans.', 
      path: '/marketing', 
      icon: Sparkles, 
      color: 'text-neon-pink',
      bg: 'bg-neon-pink/10',
      size: 'md',
      accent: 'from-neon-pink/20 to-transparent'
    },
    { 
      title: 'Spotify Verify', 
      desc: 'Connect & verify your profile.', 
      path: '/spotify-verify', 
      icon: Music, 
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10',
      size: 'md',
      accent: 'from-emerald-400/20 to-transparent'
    },
    { 
      title: 'YouTube CID', 
      desc: 'Monetize your music on YouTube.', 
      path: '/youtube-cid', 
      icon: Radio, 
      color: 'text-red-500',
      bg: 'bg-red-500/10',
      size: 'md',
      accent: 'from-red-500/20 to-transparent'
    },
    { 
      title: 'RIAA Certs', 
      desc: 'Track your gold & platinum status.', 
      path: '/riaa', 
      icon: Shield, 
      color: 'text-amber-400',
      bg: 'bg-amber-400/10',
      size: 'md',
      accent: 'from-amber-400/20 to-transparent'
    },
    { 
      title: 'Performance', 
      desc: 'Real-time streams & revenue analytics.', 
      path: '/stats', 
      icon: BarChart3, 
      color: 'text-electric-purple',
      bg: 'bg-electric-purple/10',
      size: 'md',
      accent: 'from-electric-purple/20 to-transparent'
    },
    { 
      title: 'Neural Wallet', 
      desc: 'Manage revenue and subscriptions.', 
      path: '/wallet', 
      icon: Wallet, 
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10',
      size: 'md',
      accent: 'from-emerald-400/20 to-transparent'
    },
    { 
      title: 'Financing', 
      desc: 'Royalty-backed advances.', 
      path: '/financing', 
      icon: DollarSign, 
      color: 'text-amber-400',
      bg: 'bg-amber-400/10',
      size: 'md',
      accent: 'from-amber-400/20 to-transparent'
    }
  ];

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 bg-ink relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-electric-purple/5 blur-[150px] rounded-full -mr-96 -mt-96 animate-pulse-glow" />
      <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-neon-pink/5 blur-[150px] rounded-full -ml-96 -mb-96 animate-pulse-glow" />

      <div className="max-w-7xl mx-auto space-y-16 relative z-10">
        {/* Welcome Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12">
          <div className="space-y-6">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-4"
            >
              <div className="px-4 py-1.5 bg-electric-purple/10 text-electric-purple text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-electric-purple/20 flex items-center gap-2">
                <Activity size={12} className="animate-pulse" />
                <span>{t('dashboard.core_online')}</span>
              </div>
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-6xl lg:text-9xl font-display font-black tracking-tighter uppercase leading-none italic"
            >
              {t('dashboard.welcome')} <br />
              <span className="text-white outline-text animate-glitch">{user?.name || 'Artist'}</span>
            </motion.h1>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-8 p-8 bg-white/[0.02] rounded-[40px] border border-white/5 backdrop-blur-xl group"
          >
            <div className="text-right space-y-1">
              <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-white/20">{t('dashboard.current_tier')}</p>
              <p className="text-base sm:text-xl font-display font-black text-electric-purple italic uppercase tracking-tight">IM MUSIC Neural Pro</p>
            </div>
            <Link to="/plans" className="w-16 h-16 rounded-[24px] bg-electric-purple text-white flex items-center justify-center hover:scale-110 transition-all shadow-xl shadow-electric-purple/20 group">
              <Zap size={24} className="group-hover:fill-current" />
            </Link>
          </motion.div>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((service, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -10, scale: 1.02 }}
              className={`group relative glass-card p-6 sm:p-10 flex flex-col justify-between overflow-hidden hover:bg-white/[0.05] transition-all border-white/5 ${
                service.size === 'lg' ? 'lg:col-span-2 lg:row-span-2' : ''
              }`}
            >
              {/* Hover Gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${service.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
              
              <div className="space-y-8 relative z-10">
                <div className={`w-16 h-16 ${service.bg} ${service.color} rounded-[24px] flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-xl shadow-black/20`}>
                  <service.icon size={service.size === 'lg' ? 32 : 24} />
                </div>
                <div className="space-y-3">
                  <h3 className={`${service.size === 'lg' ? 'text-4xl' : 'text-2xl'} font-display font-black uppercase tracking-tight italic leading-tight`}>
                    {service.title}
                  </h3>
                  <p className="text-white/40 text-sm font-medium leading-relaxed max-w-[240px]">
                    {service.desc}
                  </p>
                </div>
              </div>

              <div className="pt-10 relative z-10">
                <Link 
                  to={service.path} 
                  className="inline-flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-white/20 group-hover:text-white transition-all group/link"
                >
                  <span>Initialize Service</span>
                  <div className="w-8 h-px bg-white/10 group-hover/link:w-12 transition-all" />
                  <ArrowRight size={14} className="group-hover/link:translate-x-2 transition-transform" />
                </Link>
              </div>

              {/* Decorative Background Icon */}
              <div className="absolute -bottom-16 -right-16 opacity-[0.02] group-hover:opacity-[0.08] group-hover:scale-110 transition-all duration-1000">
                <service.icon size={300} />
              </div>
            </motion.div>
          ))}

          {/* Quick Stats Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2 glass-card p-6 sm:p-10 flex flex-col justify-between bg-gradient-to-br from-electric-purple/10 to-transparent border-electric-purple/20 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-electric-purple/10 blur-[60px] rounded-full -mr-32 -mt-32 group-hover:bg-electric-purple/20 transition-colors" />
            
            <div className="flex items-center justify-between mb-12 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-electric-purple/20 flex items-center justify-center text-electric-purple">
                  <Activity size={20} />
                </div>
                <h3 className="text-sm font-black uppercase tracking-[0.3em] text-electric-purple italic">{t('dashboard.performance')}</h3>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-emerald-400/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-400/20">
                <TrendingUp size={12} />
                <span>Live</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 relative z-10">
              <div className="space-y-2">
                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">{t('dashboard.streams')}</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl sm:text-5xl lg:text-6xl font-display font-black tracking-tighter italic">
                    {stats?.total_streams?.toLocaleString() || '0'}
                  </p>
                  <span className="text-xs font-black text-emerald-400">+12%</span>
                </div>
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mt-4">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '75%' }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="h-full bg-electric-purple shadow-[0_0_10px_rgba(168,85,247,0.5)]" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">{t('dashboard.revenue')}</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl sm:text-5xl lg:text-6xl font-display font-black tracking-tighter italic">
                    ${stats?.total_ingresos?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
                  </p>
                  <span className="text-xs font-black text-emerald-400">+5%</span>
                </div>
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mt-4">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '60%' }}
                    transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                    className="h-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]" 
                  />
                </div>
              </div>
            </div>

            <div className="mt-12 pt-10 border-t border-white/5 relative z-10">
              <Link to="/stats" className="w-full py-6 bg-white/5 hover:bg-white/10 text-white rounded-[24px] font-black uppercase tracking-[0.4em] text-[10px] transition-all flex items-center justify-center gap-4 border border-white/10 group/btn">
                <span>{t('dashboard.analytics')}</span>
                <ArrowRight size={16} className="group-hover/btn:translate-x-2 transition-transform" />
              </Link>
            </div>
          </motion.div>

          {/* Quick Actions */}
          <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-6">
            {[
              { icon: Headphones, label: 'Headphones', path: '/catalog' },
              { icon: Wallet, label: 'Wallet', path: '/wallet' },
              { icon: Radio, label: 'Ads', path: '/facebook-ads' },
              { icon: Settings, label: 'Settings', path: '/dashboard' },
            ].map((action, i) => (
              <Link 
                key={i}
                to={action.path}
                className="glass-card p-6 flex flex-col items-center justify-center gap-4 hover:bg-white/10 transition-all group border-white/5"
              >
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <action.icon size={20} className="text-white/40 group-hover:text-white transition-colors" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-white/20 group-hover:text-white transition-colors">{action.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
