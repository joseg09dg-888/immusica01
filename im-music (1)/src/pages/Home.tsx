import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { Zap, ShieldCheck, BarChart3, Users, Rocket, ArrowRight, Play, Globe, Sparkles, ShoppingBag, Music, DollarSign } from 'lucide-react';

const Home: React.FC = () => {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-ink overflow-hidden">
      {/* Hero Section - Editorial Style */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-20 overflow-hidden">
        {/* Neural Grid Background */}
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-ink via-transparent to-ink pointer-events-none" />
        
        {/* Floating Particles/Nodes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ 
                x: Math.random() * 100 + '%', 
                y: Math.random() * 100 + '%',
                opacity: 0 
              }}
              animate={{ 
                y: [null, '-=100'],
                opacity: [0, 0.3, 0]
              }}
              transition={{ 
                duration: Math.random() * 10 + 10, 
                repeat: Infinity,
                delay: Math.random() * 5
              }}
              className="absolute w-1 h-1 bg-cyber-cyan rounded-full"
            />
          ))}
        </div>

        {/* Moving Scanline */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
          <div className="w-full h-1 bg-cyber-cyan/30 blur-sm animate-scanline" />
        </div>

        {/* Animated Background Elements */}
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
            rotate: [0, 90, 0]
          }}
          transition={{ duration: 15, repeat: Infinity }}
          className="absolute top-1/4 -left-20 w-[800px] h-[800px] bg-cyber-cyan/10 blur-[150px] rounded-full" 
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.1, 0.15, 0.1],
            rotate: [0, -90, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, delay: 1 }}
          className="absolute bottom-1/4 -right-20 w-[800px] h-[800px] bg-neon-pink/10 blur-[150px] rounded-full" 
        />
        
        <div className="max-w-7xl mx-auto text-center space-y-16 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-16"
          >
            <div className="flex items-center justify-center gap-3 sm:gap-6">
              <span className="hidden sm:block h-px w-24 bg-gradient-to-r from-transparent via-cyber-cyan/50 to-transparent" />
              <span className="text-[7px] sm:text-[10px] font-black uppercase tracking-[0.3em] sm:tracking-[1em] text-cyber-cyan animate-pulse text-glow-cyan text-center">Neural Infrastructure v2.0</span>
              <span className="hidden sm:block h-px w-24 bg-gradient-to-l from-transparent via-cyber-cyan/50 to-transparent" />
            </div>
            
            <div className="relative perspective-1000">
              <motion.h1 
                style={{ rotateX: 10 }}
                className="text-[12vw] sm:text-[10vw] lg:text-[12vw] font-display font-black tracking-tighter leading-[0.9] sm:leading-[0.85] uppercase italic mix-blend-difference"
              >
                {t('home.hero_title')} <br />
                <span className="text-electric-purple outline-text-thick animate-glitch">{t('home.hero_subtitle')}</span>
              </motion.h1>
              
              {/* Floating Badge */}
              <motion.div 
                animate={{ 
                  y: [0, -15, 0],
                  rotate: [-12, -8, -12],
                  scale: [1, 1.1, 1]
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-8 -right-2 sm:-top-12 sm:right-4 lg:right-20 px-3 py-1 lg:px-8 lg:py-3 bg-electric-purple text-white text-[6px] lg:text-[10px] font-black uppercase tracking-widest rounded-full shadow-[0_0_40px_rgba(125,60,255,0.5)] -rotate-12 z-20"
              >
                NEURAL CORE ONLINE
              </motion.div>
            </div>

            <div className="flex flex-col lg:flex-row items-center justify-center gap-10 lg:gap-24">
              <div className="space-y-6 text-center lg:text-left max-w-xl px-4">
                <p className="text-white/60 text-sm sm:text-lg lg:text-3xl font-medium leading-[1.4] sm:leading-[1.1]">
                  {t('home.hero_desc')}
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                  <div className="flex -space-x-3">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-ink bg-white/10 overflow-hidden">
                        <img src={`https://picsum.photos/seed/artist${i}/100/100`} alt="Artist" referrerPolicy="no-referrer" />
                      </div>
                    ))}
                  </div>
                  <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-white/20">Joined by 12k+ Rebels</p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center gap-8">
                {isAuthenticated && (user?.role === 'ai_operator' || user?.role === 'admin' || user?.email?.toLowerCase() === 'joseg09.dg@gmail.com') && (
                  <Link 
                    to="/admin" 
                    className="group relative px-12 py-6 bg-electric-purple text-white rounded-full font-black uppercase tracking-[0.2em] text-xs overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-electric-purple/20"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      <ShieldCheck size={16} />
                      Admin Console
                    </span>
                    <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
                  </Link>
                )}
                <Link to="/plans" className="group relative px-12 py-6 bg-white text-ink rounded-full font-black uppercase tracking-[0.2em] text-xs overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-white/10">
                  <span className="relative z-10">{t('home.get_started')}</span>
                  <div className="absolute inset-0 bg-cyber-cyan translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
                </Link>
                <Link to="/stats" className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest hover:text-cyber-cyan transition-all group">
                  <div className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center group-hover:border-cyber-cyan group-hover:bg-cyber-cyan/5 transition-all duration-500">
                    <Play size={20} fill="currentColor" className="group-hover:scale-110 transition-transform" />
                  </div>
                  Watch Manifesto
                </Link>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Floating Stats - Dopamine Hit */}
        <div className="absolute bottom-20 left-0 right-0 hidden lg:block">
          <div className="max-w-7xl mx-auto px-6 flex justify-between items-end">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Active Artists</p>
              <p className="text-4xl font-display font-black">12.4K+</p>
            </div>
            <div className="space-y-1 text-center">
              <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Global Streams</p>
              <p className="text-4xl font-display font-black text-cyber-cyan">1.2B+</p>
            </div>
            <div className="space-y-1 text-right">
              <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Payouts Sent</p>
              <p className="text-4xl font-display font-black">$45M+</p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section - Bento Grid */}
      <section className="py-32 px-6 bg-white/5">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div className="space-y-4">
              <h2 className="text-4xl sm:text-5xl lg:text-7xl font-display font-black uppercase leading-none tracking-tighter">
                Everything you <br />
                <span className="text-cyber-cyan">actually need.</span>
              </h2>
            </div>
            <p className="text-white/40 max-w-sm font-medium">
              We stripped away the corporate fluff and built the tools that actually move the needle for independent artists.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-6">
            {/* Distribution */}
            <motion.div 
              whileHover={{ y: -10, rotateX: 5, rotateY: 5 }}
              className="md:col-span-3 lg:col-span-4 glass-card p-6 sm:p-10 space-y-8 group hover:bg-white/10 transition-colors cursor-pointer perspective-1000"
            >
              <div className="w-16 h-16 bg-cyber-cyan/10 text-cyber-cyan rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform group-hover:bg-cyber-cyan group-hover:text-ink shadow-2xl shadow-cyber-cyan/0 group-hover:shadow-cyber-cyan/20">
                <Globe size={32} />
              </div>
              <div className="space-y-4">
                <h3 className="text-2xl font-display font-black uppercase">Global Reach</h3>
                <p className="text-white/40 text-sm leading-relaxed">Distribute to 150+ platforms including Spotify, Apple Music, and TikTok in 24 hours.</p>
              </div>
            </motion.div>

            {/* AI Insights */}
            <motion.div 
              whileHover={{ y: -10, rotateX: -5, rotateY: 5 }}
              className="md:col-span-3 lg:col-span-8 glass-card p-6 sm:p-10 flex flex-col lg:flex-row gap-12 group hover:bg-white/10 transition-colors cursor-pointer overflow-hidden relative perspective-1000"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-neon-pink/5 blur-[80px] rounded-full -mr-32 -mt-32" />
              <div className="flex-1 space-y-8 relative z-10">
                <div className="w-16 h-16 bg-neon-pink/10 text-neon-pink rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform group-hover:bg-neon-pink group-hover:text-ink shadow-2xl shadow-neon-pink/0 group-hover:shadow-neon-pink/20">
                  <Sparkles size={32} />
                </div>
                <div className="space-y-4">
                  <h3 className="text-2xl font-display font-black uppercase">AI Branding & Strategy</h3>
                  <p className="text-white/40 text-sm leading-relaxed">Our neural engine analyzes your sound to generate archetypes, visual identities, and 30-day content plans that actually convert.</p>
                </div>
              </div>
              <div className="lg:w-64 h-full bg-white/5 rounded-2xl border border-white/10 p-6 flex flex-col justify-between relative z-10">
                <div className="space-y-2">
                  <div className="h-2 w-full bg-cyber-cyan/20 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      whileInView={{ width: '75%' }}
                      transition={{ duration: 1.5, delay: 0.5 }}
                      className="h-full bg-cyber-cyan" 
                    />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Market Fit</p>
                </div>
                <div className="space-y-2">
                  <div className="h-2 w-full bg-neon-pink/20 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      whileInView={{ width: '50%' }}
                      transition={{ duration: 1.5, delay: 0.7 }}
                      className="h-full bg-neon-pink" 
                    />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Viral Potential</p>
                </div>
              </div>
            </motion.div>

            {/* Marketplace */}
            <motion.div 
              whileHover={{ y: -10, rotateX: 5, rotateY: -5 }}
              className="md:col-span-6 lg:col-span-7 glass-card p-6 sm:p-10 flex items-center justify-between group hover:bg-white/10 transition-colors cursor-pointer overflow-hidden relative perspective-1000"
            >
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-400/5 blur-[80px] rounded-full -ml-32 -mb-32" />
              <div className="space-y-8 max-w-md relative z-10">
                <div className="w-16 h-16 bg-emerald-400/10 text-emerald-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform group-hover:bg-emerald-400 group-hover:text-ink shadow-2xl shadow-emerald-400/0 group-hover:shadow-emerald-400/20">
                  <ShoppingBag size={32} />
                </div>
                <div className="space-y-4">
                  <h3 className="text-2xl font-display font-black uppercase">Producer Marketplace</h3>
                  <p className="text-white/40 text-sm leading-relaxed">Buy and sell exclusive licenses. High-quality beats, samples, and presets from the world's best sound designers.</p>
                </div>
              </div>
              <div className="hidden sm:block w-48 h-48 bg-white/5 rounded-full border border-white/10 relative overflow-hidden group-hover:border-emerald-400/20 transition-colors">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Music size={64} className="text-white/10 group-hover:text-emerald-400/20 transition-colors group-hover:scale-110 transition-transform" />
                </div>
              </div>
            </motion.div>

            {/* Financing */}
            <motion.div 
              whileHover={{ y: -10, rotateX: -5, rotateY: -5 }}
              className="md:col-span-6 lg:col-span-5 glass-card p-6 sm:p-10 space-y-8 group hover:bg-white/10 transition-colors cursor-pointer overflow-hidden relative perspective-1000"
            >
              <div className="absolute top-1/2 right-0 w-64 h-64 bg-amber-400/5 blur-[80px] rounded-full -mr-32 -mt-32" />
              <div className="w-16 h-16 bg-amber-400/10 text-amber-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform group-hover:bg-amber-400 group-hover:text-ink shadow-2xl shadow-amber-400/0 group-hover:shadow-amber-400/20">
                <DollarSign size={32} />
              </div>
              <div className="space-y-4 relative z-10">
                <h3 className="text-2xl font-display font-black uppercase">Royalty Advances</h3>
                <p className="text-white/40 text-sm leading-relaxed">Get paid today for what you'll earn tomorrow. No credit checks, just data-driven funding for your next project.</p>
              </div>
              <div className="pt-4 relative z-10">
                <Link to="/financing" className="text-[10px] font-black uppercase tracking-widest text-cyber-cyan flex items-center gap-2 group-hover:gap-4 transition-all">
                  Check Eligibility <ArrowRight size={14} />
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6">
        <div className="max-w-4xl mx-auto glass-card p-20 text-center space-y-12 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyber-cyan via-neon-pink to-electric-purple" />
          
          <h2 className="text-4xl sm:text-5xl lg:text-7xl font-display font-black uppercase tracking-tighter leading-none">
            Ready to <br />
            <span className="text-white outline-text">Rebel?</span>
          </h2>
          
          <p className="text-white/40 text-lg font-medium max-w-xl mx-auto">
            Join thousands of artists who have taken control of their masters and their future.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link to="/plans" className="btn-primary px-12 py-6 text-sm">
              Start Free Trial
            </Link>
            <Link to="/legal" className="text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors">
              Talk to Legal Agent
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
            <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center relative overflow-hidden">
              {/* Fallback CSS Logo */}
              <div className="absolute inset-0 flex flex-col items-center justify-center leading-none bg-white">
                <span className="text-ink font-black text-[10px]">IM</span>
              </div>
              {/* Uploaded Logo (if exists) */}
              <img 
                src="/logo.png" 
                alt="IM MUSIC" 
                className="absolute inset-0 w-full h-full object-contain z-10"
                onError={(e) => (e.currentTarget.style.display = 'none')}
                referrerPolicy="no-referrer"
              />
            </div>
            <span className="font-display font-black uppercase tracking-tighter">IM MUSIC</span>
          </div>
          
          <div className="flex gap-12">
            {['Instagram', 'Twitter', 'Discord', 'Spotify'].map((social) => (
              <a key={social} href="#" className="text-[10px] font-black uppercase tracking-widest text-white/20 hover:text-white transition-colors">
                {social}
              </a>
            ))}
          </div>

          <p className="text-[10px] font-black uppercase tracking-widest text-white/10">
            © 2026 IM MUSIC. All Rights Reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
