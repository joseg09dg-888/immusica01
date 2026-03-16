import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { 
  LayoutDashboard, Zap, BarChart3, Users, LogOut, LogIn, 
  ShieldCheck, DollarSign, Database, Menu, X, ChevronDown, Radio,
  Palette, ShoppingBag, Rocket, Scale, Globe, Music, Facebook, Wallet,
  Languages, Shield, MessageSquare, Image, Target, Share2, Sparkles, ArrowRight
} from 'lucide-react';

const Navbar: React.FC = () => {
  const { isAuthenticated, login, logout, user } = useAuth();
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const languages = [
    { code: 'es', label: 'Español' },
    { code: 'en', label: 'English' },
    { code: 'fr', label: 'Français' },
    { code: 'pt', label: 'Português' },
    { code: 'hi', label: 'हिन्दी' },
    { code: 'zh', label: '中文' }
  ];

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setActiveDropdown(null);
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navGroups = [
    {
      label: 'Core',
      items: [
        { label: t('nav.dashboard'), path: '/dashboard', icon: LayoutDashboard },
        { label: t('nav.catalog'), path: '/catalog', icon: Music, protected: true },
        { label: t('nav.stats'), path: '/stats', icon: BarChart3, protected: true },
        { label: t('nav.artists'), path: '/artists', icon: Users, protected: true },
        { label: t('nav.ai_chat'), path: '/ai-chat', icon: Sparkles, protected: true },
        { label: t('nav.community'), path: '/chat', icon: MessageSquare, protected: true },
        { label: t('nav.feedback'), path: '/feedback', icon: MessageSquare, protected: true },
        { 
          label: 'Admin', 
          path: '/admin', 
          icon: ShieldCheck, 
          protected: true,
          visible: isAuthenticated && (user?.role === 'ai_operator' || user?.role === 'admin' || user?.email?.toLowerCase() === 'joseg09.dg@gmail.com')
        },
      ]
    },
    {
      label: t('nav.services'),
      categories: [
        {
          title: 'Neural Suite',
          items: [
            { label: 'Neural Vault', path: '/vault', icon: Database, protected: true, desc: 'Secure Asset Backup' },
            { label: 'Spotify Verify', path: '/spotify-verify', icon: Music, protected: true, desc: 'Artist Verification' },
            { label: 'YouTube CID', path: '/youtube-cid', icon: Radio, protected: true, desc: 'Content ID Monetization' },
            { label: 'RIAA Certs', path: '/riaa', icon: Shield, protected: true, desc: 'Certification Tracking' },
          ]
        },
        {
          title: 'Distribution',
          items: [
            { label: 'Releases', path: '/releases', icon: Rocket, protected: true, desc: 'Neural Release Scheduling' },
            { label: 'Videos', path: '/videos', icon: Image, protected: true, desc: 'Global Video Distribution' },
            { label: 'Publishing', path: '/publishing', icon: Shield, protected: true, desc: 'Editorial & Royalties' },
            { label: 'Playlists', path: '/playlists', icon: Database, protected: true, desc: 'Database Management' },
          ]
        },
        {
          title: 'Growth & Business',
          items: [
            { label: 'Marketing', path: '/marketing', icon: Zap, protected: true, desc: 'AI Branding & Strategy' },
            { label: 'Marketplace', path: '/marketplace', icon: ShoppingBag, protected: true, desc: 'Beats & Licenses' },
            { label: 'Financing', path: '/financing', icon: DollarSign, protected: true, desc: 'Royalty Advances' },
            { label: 'Legal', path: '/legal', icon: ShieldCheck, protected: true, desc: 'AI Contract Agent' },
          ]
        }
      ]
    }
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      scrolled ? 'py-4' : 'py-6'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className={`relative glass-card px-4 sm:px-8 py-3 sm:py-4 flex items-center justify-between border-white/10 transition-all duration-500 ${
          scrolled ? 'rounded-2xl shadow-2xl shadow-black/50' : 'rounded-[2rem]'
        }`}>
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg shadow-white/5 group-hover:scale-110 transition-transform overflow-hidden relative">
              {/* Fallback CSS Logo */}
              <div className="absolute inset-0 flex flex-col items-center justify-center leading-none bg-white">
                <span className="text-ink font-black text-xl tracking-tighter">IM</span>
                <span className="text-ink font-bold text-[6px] tracking-[0.2em] uppercase">Music</span>
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
            <div className="flex flex-col">
              <span className="text-base sm:text-lg font-display font-black tracking-tighter leading-none uppercase">IM MUSIC</span>
              <span className="text-[8px] sm:text-[10px] font-black tracking-[0.2em] sm:tracking-[0.3em] text-electric-purple uppercase leading-none">Neural Network</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-2">
            {navGroups[0].items?.map((item) => {
              if (item.protected && !isAuthenticated) return null;
              if (item.visible === false) return null;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                    isActive(item.path) 
                      ? 'bg-white text-ink' 
                      : 'text-white/40 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <item.icon size={14} />
                  {item.label}
                </Link>
              );
            })}

            {/* Services Mega Menu */}
            {isAuthenticated && (
              <div className="relative group/mega" onMouseEnter={() => setActiveDropdown('services')} onMouseLeave={() => setActiveDropdown(null)}>
                <button
                  className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                    navGroups[1].categories?.some(cat => cat.items.some(i => isActive(i.path)))
                      ? 'text-cyber-cyan'
                      : 'text-white/40 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {t('nav.services')}
                  <ChevronDown size={12} className={`transition-transform duration-300 ${activeDropdown === 'services' ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {activeDropdown === 'services' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute top-full -right-64 mt-4 w-[800px] glass-card p-10 border-white/10 shadow-2xl overflow-hidden"
                    >
                      {/* Decorative Background */}
                      <div className="absolute top-0 right-0 w-96 h-96 bg-cyber-cyan/5 blur-[100px] rounded-full -mr-48 -mt-48" />
                      
                      <div className="relative z-10 grid grid-cols-3 gap-8">
                        {navGroups[1].categories?.map((category) => (
                          <div key={category.title} className="space-y-6">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 px-2">{category.title}</h4>
                            <div className="space-y-2">
                              {category.items.map((item) => (
                                <Link
                                  key={item.path}
                                  to={item.path}
                                  onClick={() => setActiveDropdown(null)}
                                  className={`group/item p-4 rounded-xl flex items-center gap-4 transition-all border border-transparent ${
                                    isActive(item.path)
                                      ? 'bg-cyber-cyan/10 border-cyber-cyan/20 text-cyber-cyan'
                                      : 'hover:bg-white/5 hover:border-white/10 text-white/60 hover:text-white'
                                  }`}
                                >
                                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                                    isActive(item.path) 
                                      ? 'bg-cyber-cyan text-ink shadow-lg shadow-cyber-cyan/20' 
                                      : 'bg-white/5 group-hover/item:bg-white/10'
                                  }`}>
                                    <item.icon size={18} className="group-hover/item:scale-110 transition-transform" />
                                  </div>
                                  <div className="space-y-0.5">
                                    <span className="text-[10px] font-black uppercase tracking-widest block">{item.label}</span>
                                    <p className="text-[9px] text-white/20 font-medium leading-tight">
                                      {item.desc}
                                    </p>
                                  </div>
                                </Link>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-10 pt-6 border-t border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-white/20">{t('all_systems_operational')}</p>
                          </div>
                          <span className="h-4 w-px bg-white/5" />
                          <p className="text-[10px] font-black uppercase tracking-widest text-white/20">v2.4.0-neural</p>
                        </div>
                        <Link to="/dashboard" className="text-[10px] font-black uppercase tracking-widest text-cyber-cyan hover:text-white transition-colors flex items-center gap-2 group">
                          {t('view_dashboard')} <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
            
            <Link
              to="/plans"
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                isActive('/plans') 
                  ? 'bg-white text-ink' 
                  : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}
            >
              <Zap size={14} />
              {t('nav.plans')}
            </Link>
          </div>

          {/* Right Section: Language + Auth */}
          <div className="hidden lg:flex items-center gap-6">
            {/* Language Switcher */}
            <div className="relative" onMouseEnter={() => setActiveDropdown('lang')} onMouseLeave={() => setActiveDropdown(null)}>
              <button className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all text-white/40 hover:text-white">
                <Languages size={18} />
              </button>
              
              <AnimatePresence>
                {activeDropdown === 'lang' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full right-0 mt-4 w-48 glass-card p-2 border-white/10 shadow-2xl"
                  >
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => changeLanguage(lang.code)}
                        className={`w-full px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-left transition-all ${
                          i18n.language === lang.code 
                            ? 'bg-cyber-cyan text-ink' 
                            : 'text-white/40 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Artist</p>
                  <p className="text-xs font-bold">{user?.name}</p>
                </div>
                <button
                  onClick={logout}
                  className="w-10 h-10 rounded-xl bg-white/5 hover:bg-neon-pink/10 hover:text-neon-pink flex items-center justify-center transition-all"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <button
                onClick={login}
                className="px-8 py-3 bg-white text-ink rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-white/10"
              >
                {t('nav.connect')}
              </button>
            )}
          </div>

          {/* Mobile Toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white"
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            className="fixed inset-0 z-[60] lg:hidden"
          >
            <div className="absolute inset-0 bg-black/90 backdrop-blur-2xl" />
            <div className="relative h-full flex flex-col p-8">
              <div className="flex justify-between items-center mb-12">
                <Link to="/" onClick={() => setIsOpen(false)} className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center relative overflow-hidden">
                    {/* Fallback CSS Logo */}
                    <div className="absolute inset-0 flex items-center justify-center bg-white">
                      <span className="text-ink font-black text-lg">IM</span>
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
                  <div className="flex flex-col">
                    <span className="text-lg font-display font-black tracking-tighter uppercase leading-none">IM MUSIC</span>
                    <span className="text-[8px] font-black tracking-[0.2em] text-electric-purple uppercase leading-none">Neural Network</span>
                  </div>
                </Link>
                <button onClick={() => setIsOpen(false)} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 space-y-8 overflow-y-auto">
                {/* Language Switcher Mobile */}
                <div className="flex gap-2 p-2 bg-white/5 rounded-2xl border border-white/10">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => changeLanguage(lang.code)}
                      className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        i18n.language === lang.code 
                          ? 'bg-cyber-cyan text-ink' 
                          : 'text-white/40'
                      }`}
                    >
                      {lang.code.toUpperCase()}
                    </button>
                  ))}
                </div>

                {navGroups.map((group) => (
                  <div key={group.label} className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 px-4">{group.label}</h3>
                    <div className="grid gap-2">
                      {group.items?.map((item) => {
                        if (item.protected && !isAuthenticated) return null;
                        if (item.visible === false) return null;
                        return (
                          <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setIsOpen(false)}
                            className={`p-6 rounded-2xl flex items-center gap-6 transition-all ${
                              isActive(item.path)
                                ? 'bg-electric-purple text-white'
                                : 'bg-white/5 text-white/60'
                            }`}
                          >
                            <item.icon size={24} />
                            <span className="text-xl font-display font-black uppercase tracking-tight">{item.label}</span>
                          </Link>
                        );
                      })}
                      {group.categories?.map((category) => (
                        <div key={category.title} className="space-y-2 mt-4">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-white/10 px-4">{category.title}</h4>
                          {category.items.map((item) => (
                            <Link
                              key={item.path}
                              to={item.path}
                              onClick={() => setIsOpen(false)}
                              className={`p-6 rounded-2xl flex items-center gap-6 transition-all ${
                                isActive(item.path)
                                  ? 'bg-cyber-cyan text-ink'
                                  : 'bg-white/5 text-white/60'
                              }`}
                            >
                              <item.icon size={24} />
                              <span className="text-xl font-display font-black uppercase tracking-tight">{item.label}</span>
                            </Link>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 px-4">Pricing</h3>
                  <Link
                    to="/plans"
                    onClick={() => setIsOpen(false)}
                    className={`p-6 rounded-2xl flex items-center gap-6 transition-all ${
                      isActive('/plans')
                        ? 'bg-cyber-cyan text-ink'
                        : 'bg-white/5 text-white/60'
                    }`}
                  >
                    <Zap size={24} />
                    <span className="text-xl font-display font-black uppercase tracking-tight">{t('nav.plans')}</span>
                  </Link>
                </div>
              </div>

              <div className="pt-8 border-t border-white/10">
                {isAuthenticated ? (
                  <button
                    onClick={() => { logout(); setIsOpen(false); }}
                    className="w-full p-6 bg-neon-pink/10 text-neon-pink rounded-2xl flex items-center justify-center gap-4 font-black uppercase tracking-widest text-xs"
                  >
                    <LogOut size={20} />
                    {t('nav.disconnect')}
                  </button>
                ) : (
                  <button
                    onClick={() => { login(); setIsOpen(false); }}
                    className="w-full p-6 bg-white text-ink rounded-2xl font-black uppercase tracking-widest text-xs"
                  >
                    {t('nav.connect')}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
