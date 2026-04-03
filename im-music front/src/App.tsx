import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';

// ============================================================
// TYPES
// ============================================================
interface User { id: number; name: string; email: string; role: string; }
interface Track { id: number; title: string; release_date: string; status: string; isrc?: string; artist_id?: number; }
interface RoyaltySummary { total: number; byPlatform: { platform: string; total: number }[]; }
interface ChatMessage { role: 'user' | 'ai'; content: string; }

// ============================================================
// API HELPER
// ============================================================
const api = {
  get: async (path: string) => {
    const token = localStorage.getItem('im_token');
    const res = await fetch(`/api${path}`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
  post: async (path: string, body: Record<string, unknown>) => {
    const token = localStorage.getItem('im_token');
    const res = await fetch(`/api${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }
};

// ============================================================
// LOGO SVG
// ============================================================
const IMLogo = ({ size = 48, color = '#5E17EB' }: { size?: number; color?: string }) => (
  <svg width={size} height={size * 0.75} viewBox="0 0 120 90" fill="none">
    <path d="M8 10 C8 10, 18 8, 22 45 C26 82, 36 80, 36 80 L36 80 C36 80, 26 78, 22 45 C18 12, 8 10, 8 10Z" fill={color} />
    <path d="M36 80 C36 80, 46 82, 50 45 C54 8, 60 10, 60 10 C60 10, 66 8, 70 45 C74 82, 84 80, 84 80Z" fill={color} />
    <path d="M84 80 C84 80, 94 78, 98 45 C102 12, 112 10, 112 10 C112 10, 102 8, 98 45 C94 82, 84 80, 84 80Z" fill={color} />
    <path d="M8 10 L36 10 L36 25 L22 25 Z" fill={color} opacity="0.4" />
    <path d="M84 10 L112 10 L98 25 L84 25 Z" fill={color} opacity="0.4" />
  </svg>
);

// ============================================================
// PARTICLE FIELD
// ============================================================
const ParticleField = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    const colors = ['#5E17EB', '#7B3FFF', '#9B6EFF', '#F2EDE5'];
    const particles = Array.from({ length: 90 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      size: Math.random() * 2.5 + 0.5,
      opacity: Math.random() * 0.5 + 0.1,
      color: colors[Math.floor(Math.random() * colors.length)]
    }));
    let animId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p, i) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;
        ctx.fill();
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x, dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 130) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = '#5E17EB';
            ctx.globalAlpha = (1 - dist / 130) * 0.12;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
        ctx.globalAlpha = 1;
      });
      animId = requestAnimationFrame(animate);
    };
    animate();
    window.addEventListener('resize', resize);
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }} />;
};

// ============================================================
// FLOATING ORB
// ============================================================
const Orb = ({ x, y, size, delay, color }: { x: string; y: string; size: number; delay: number; color: string }) => (
  <motion.div
    style={{
      position: 'absolute', left: x, top: y, width: size, height: size,
      background: `radial-gradient(circle at 30% 30%, ${color}80, ${color}18 60%, transparent)`,
      borderRadius: '50%', filter: 'blur(2px)', pointerEvents: 'none'
    }}
    animate={{ y: [0, -25, 0], scale: [1, 1.08, 1] }}
    transition={{ duration: 7 + delay, repeat: Infinity, ease: 'easeInOut', delay }}
  />
);

// ============================================================
// NAVBAR
// ============================================================
const Navbar = ({ onNav, active, user, onLogout }: {
  onNav: (s: string) => void; active: string; user: User | null; onLogout: () => void;
}) => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);
  const publicLinks = [
    { id: 'home', label: 'Inicio' },
    { id: 'servicios', label: 'Servicios' },
    { id: 'planes', label: 'Planes' },
  ];
  const dashLinks = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'catalog', label: 'Catálogo' },
    { id: 'royalties', label: 'Regalías' },
    { id: 'marketing', label: 'IA' },
  ];
  const links = user ? dashLinks : publicLinks;
  return (
    <nav className={`navbar${scrolled ? ' navbar-scrolled' : ''}`}>
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <motion.button
          onClick={() => onNav('home')}
          className="flex items-center gap-3"
          whileHover={{ scale: 1.04 }}
          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <IMLogo size={38} />
          <div className="flex flex-col">
            <span className="font-display text-cream" style={{ fontSize: 20, letterSpacing: '0.3em', lineHeight: 1 }}>IM</span>
            <span style={{ fontSize: 9, letterSpacing: '0.5em', color: '#5E17EB', textTransform: 'uppercase', fontWeight: 700, lineHeight: 1 }}>MUSIC</span>
          </div>
        </motion.button>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {links.map(l => (
            <button
              key={l.id}
              onClick={() => onNav(l.id)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em',
                color: active === l.id ? '#5E17EB' : 'rgba(255,255,255,0.5)',
                transition: 'color 0.2s'
              }}
              onMouseEnter={e => { if (active !== l.id) (e.target as HTMLElement).style.color = '#fff'; }}
              onMouseLeave={e => { if (active !== l.id) (e.target as HTMLElement).style.color = 'rgba(255,255,255,0.5)'; }}
            >
              {l.label}
            </button>
          ))}
        </div>

        {/* Auth controls */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2"
                style={{ background: 'rgba(94,23,235,0.1)', border: '1px solid rgba(94,23,235,0.3)', borderRadius: 10, padding: '6px 12px' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#5E17EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: '#fff', flexShrink: 0 }}>
                  {user.name[0].toUpperCase()}
                </div>
                <span className="hidden md:block" style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>{user.name}</span>
              </div>
              <button onClick={onLogout} className="btn-ghost" style={{ padding: '8px 16px', fontSize: 11 }}>Salir</button>
            </div>
          ) : (
            <>
              <motion.button
                onClick={() => onNav('login')}
                whileHover={{ scale: 1.05 }}
                className="hidden md:block"
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', transition: 'color 0.2s' }}
                onMouseEnter={e => (e.target as HTMLElement).style.color = '#fff'}
                onMouseLeave={e => (e.target as HTMLElement).style.color = 'rgba(255,255,255,0.5)'}
              >
                Entrar
              </motion.button>
              <motion.button
                onClick={() => onNav('login')}
                whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(94,23,235,0.5)' }}
                className="btn-primary"
                style={{ padding: '10px 20px', fontSize: 11 }}
              >
                Empezar
              </motion.button>
            </>
          )}
          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
          >
            <div style={{ width: 22, display: 'flex', flexDirection: 'column', gap: 5 }}>
              <span style={{ height: 2, background: '#fff', borderRadius: 2, display: 'block', transition: 'all 0.3s', transform: menuOpen ? 'rotate(45deg) translateY(7px)' : 'none' }} />
              <span style={{ height: 2, background: '#fff', borderRadius: 2, display: 'block', transition: 'all 0.3s', opacity: menuOpen ? 0 : 1 }} />
              <span style={{ height: 2, background: '#fff', borderRadius: 2, display: 'block', transition: 'all 0.3s', transform: menuOpen ? 'rotate(-45deg) translateY(-7px)' : 'none' }} />
            </div>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{ background: 'rgba(0,0,0,0.97)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(94,23,235,0.2)', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 8 }}
          >
            {links.map(l => (
              <button
                key={l.id}
                onClick={() => { onNav(l.id); setMenuOpen(false); }}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                  fontSize: 13, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em',
                  color: active === l.id ? '#5E17EB' : 'rgba(255,255,255,0.6)',
                  padding: '10px 0'
                }}
              >
                {l.label}
              </button>
            ))}
            {!user && (
              <button onClick={() => { onNav('login'); setMenuOpen(false); }} className="btn-primary" style={{ marginTop: 8 }}>
                ENTRAR
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

// ============================================================
// LANDING PAGE
// ============================================================
const LandingPage = ({ onNav }: { onNav: (s: string) => void }) => {
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], [0, -100]);
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  const [counts, setCounts] = useState({ artistas: 0, streams: 0, paises: 0 });

  useEffect(() => {
    const targets = { artistas: 247, streams: 850, paises: 32 };
    const duration = 2000;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCounts({
        artistas: Math.floor(targets.artistas * ease),
        streams: Math.floor(targets.streams * ease),
        paises: Math.floor(targets.paises * ease),
      });
      if (progress < 1) requestAnimationFrame(tick);
    };
    const id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, []);

  const services = [
    { icon: '🎯', title: 'Distribución Digital', desc: 'Tu música en Spotify, Apple Music, Tidal, Amazon y 150+ plataformas globales. ISRC y UPC incluidos sin costo adicional.' },
    { icon: '🧠', title: 'Marketing con IA', desc: 'Estrategias hiperpersonalizadas basadas en neurociencia y datos reales de comportamiento de tu audiencia.' },
    { icon: '⚡', title: 'Agentes Inteligentes', desc: 'Gemini AI trabajando 24/7 en tu branding, pitch decks, análisis de tendencias y estrategia de crecimiento.' },
    { icon: '💰', title: 'Gestión de Regalías', desc: 'Master y publishing administrados con splits automáticos. Reportes en tiempo real y pagos puntuales.' },
    { icon: '🎬', title: 'Producción Visual', desc: 'Videos musicales, reels, liners y contenido visual de talla mundial. Postproducción y colorización pro.' },
    { icon: '🚀', title: 'Financiamiento', desc: 'Adelantos sobre regalías futuras sin ceder tus masters. Crece sin sacrificar tu independencia artística.' },
  ];

  const plans = [
    {
      name: 'STARTER', price: 0, period: '/mes', featured: false,
      desc: 'Para artistas que están comenzando su camino.',
      features: ['Distribución a 50+ plataformas', '1 artista registrado', '5 tracks activos', 'Dashboard básico', 'Soporte por email'],
      cta: 'COMENZAR GRATIS',
    },
    {
      name: 'PRO', price: 29, period: '/mes', featured: true,
      desc: 'Para artistas que van en serio con su carrera.',
      features: ['Distribución a 150+ plataformas', '3 artistas registrados', 'Tracks ilimitados', 'Marketing con IA', 'Análisis avanzado', 'Soporte prioritario 24/7'],
      cta: 'ELEGIR PRO',
    },
    {
      name: 'ELITE', price: 99, period: '/mes', featured: false,
      desc: 'Para artistas que quieren dominar la industria.',
      features: ['Todo en Pro', 'Artistas ilimitados', 'Manager dedicado', 'Financiamiento disponible', 'Producción visual incluida', 'Estrategia personalizada IA', 'Acceso anticipado a nuevas funciones'],
      cta: 'HABLAR CON UN EXPERTO',
    },
  ];

  return (
    <div style={{ position: 'relative', background: '#000' }}>
      {/* ——— HERO ——— */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <ParticleField />
        <Orb x="8%" y="15%" size={350} delay={0} color="#5E17EB" />
        <Orb x="72%" y="8%" size={200} delay={2} color="#7B3FFF" />
        <Orb x="78%" y="55%" size={260} delay={1} color="#5E17EB" />
        <Orb x="3%" y="65%" size={160} delay={3} color="#9B6EFF" />
        {/* Glow radial */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(94,23,235,0.18) 0%, transparent 70%)', zIndex: 1, pointerEvents: 'none' }} />

        <motion.div
          style={{ y: heroY, opacity: heroOpacity, position: 'relative', zIndex: 10, textAlign: 'center', padding: '0 24px', maxWidth: 1100, margin: '0 auto' }}
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="inline-flex items-center gap-2"
            style={{ background: 'rgba(94,23,235,0.1)', border: '1px solid rgba(94,23,235,0.3)', borderRadius: 100, padding: '8px 18px', marginBottom: 40 }}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#5E17EB', animation: 'pulse 2s ease-in-out infinite', flexShrink: 0 }} />
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#5E17EB' }}>
              Plataforma Elite — Artistas Reales
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="font-display text-hero"
            style={{ fontWeight: 900, lineHeight: 0.92, letterSpacing: '-0.02em', marginBottom: 32 }}
          >
            <span style={{ display: 'block', color: '#F2EDE5' }}>SOMOS TU</span>
            <span style={{ display: 'block', color: '#5E17EB', position: 'relative' }}>
              SOCIO DE
              <motion.span
                style={{ position: 'absolute', right: '-0.15em', top: '-0.2em', fontSize: '0.35em' }}
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 2.5, repeat: Infinity }}
              >⚡</motion.span>
            </span>
            <span style={{ display: 'block', color: '#F2EDE5' }}>CRECIMIENTO</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            style={{ fontSize: 18, color: 'rgba(255,255,255,0.45)', maxWidth: 580, margin: '0 auto 48px', fontWeight: 500, lineHeight: 1.65 }}
          >
            Distribución global, marketing estratégico e inteligencia artificial. Todo en una plataforma construida para artistas que van en serio.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <motion.button
              onClick={() => onNav('login')}
              whileHover={{ scale: 1.04, boxShadow: '0 0 50px rgba(94,23,235,0.6)' }}
              whileTap={{ scale: 0.97 }}
              className="btn-primary"
              style={{ padding: '18px 40px', fontSize: 14 }}
            >
              EMPIEZA AHORA
            </motion.button>
            <motion.button
              onClick={() => {
                document.getElementById('servicios')?.scrollIntoView({ behavior: 'smooth' });
              }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="btn-ghost"
              style={{ padding: '18px 40px', fontSize: 14 }}
            >
              VER SERVICIOS
            </motion.button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
            className="grid grid-cols-3 gap-8"
            style={{ maxWidth: 500, margin: '64px auto 0' }}
          >
            {[
              { value: `${counts.artistas}+`, label: 'Artistas activos' },
              { value: `${counts.streams}M+`, label: 'Streams generados' },
              { value: `${counts.paises}`, label: 'Países alcanzados' },
            ].map((s, i) => (
              <motion.div key={i} whileHover={{ scale: 1.08 }} style={{ textAlign: 'center', cursor: 'default' }}>
                <div className="font-display" style={{ fontSize: 36, color: '#5E17EB', lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.28)', marginTop: 6, fontWeight: 700 }}>{s.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-10 left-1\/2 -translate-x-1\/2"
          style={{ position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.8, repeat: Infinity }}
        >
          <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.3em', color: 'rgba(255,255,255,0.18)', fontWeight: 700 }}>Scroll</span>
          <div className="scroll-line" />
        </motion.div>
      </section>

      {/* ——— MARQUEE ——— */}
      <div style={{ background: '#5E17EB', padding: '18px 0', overflow: 'hidden' }}>
        <div style={{ display: 'flex', gap: 0, whiteSpace: 'nowrap', animation: 'marquee 22s linear infinite' }}>
          {Array(6).fill(null).map((_, i) => (
            <span key={i} className="font-display" style={{ fontSize: 22, fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#000', padding: '0 48px', flexShrink: 0 }}>
              IM MUSIC ★ SOMOS TU SOCIO ★ REBELIÓN MUSICAL ★ ARTISTAS REALES ★
            </span>
          ))}
        </div>
      </div>

      {/* ——— SERVICIOS ——— */}
      <section id="servicios" style={{ padding: '120px 24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(94,23,235,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            style={{ textAlign: 'center', marginBottom: 80 }}
          >
            <span className="label-tag">Lo que hacemos</span>
            <h2 className="font-display text-section" style={{ lineHeight: 0.95, letterSpacing: '-0.02em', marginTop: 20 }}>
              <span style={{ color: '#F2EDE5' }}>SERVICIOS<br /></span>
              <span style={{ color: '#5E17EB' }}>DE ÉLITE</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -8, boxShadow: '0 30px 60px rgba(94,23,235,0.28)', borderColor: 'rgba(94,23,235,0.3)' }}
                className="service-card group"
              >
                <div style={{ fontSize: 40, marginBottom: 20, display: 'inline-block', transition: 'transform 0.3s' }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.25) rotate(-5deg)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                >{s.icon}</div>
                <h3 className="font-display" style={{ fontSize: 20, letterSpacing: '-0.01em', color: '#F2EDE5', marginBottom: 12 }}>{s.title}</h3>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', lineHeight: 1.65 }}>{s.desc}</p>
                <div style={{ marginTop: 24, height: 1, background: 'linear-gradient(to right, transparent, #5E17EB80, transparent)', transform: 'scaleX(0)', transformOrigin: 'left', transition: 'transform 0.5s ease' }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'scaleX(1)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'scaleX(0)')}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ——— PLANES ——— */}
      <section id="planes" style={{ padding: '120px 24px', background: 'rgba(255,255,255,0.01)' }}>
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            style={{ textAlign: 'center', marginBottom: 80 }}
          >
            <span className="label-tag">Precios</span>
            <h2 className="font-display text-section" style={{ lineHeight: 0.95, letterSpacing: '-0.02em', marginTop: 20 }}>
              <span style={{ color: '#F2EDE5' }}>ELIGE TU<br /></span>
              <span style={{ color: '#5E17EB' }}>NIVEL</span>
            </h2>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)', marginTop: 20, maxWidth: 480, margin: '20px auto 0' }}>
              Sin contratos a largo plazo. Cancela cuando quieras.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -6 }}
                className={`plan-card${plan.featured ? ' plan-card-featured' : ''}`}
              >
                {plan.featured && (
                  <div style={{ position: 'absolute', top: -1, left: '50%', transform: 'translateX(-50%)' }}>
                    <span style={{ background: '#5E17EB', color: '#fff', fontFamily: 'Anton', fontSize: 10, letterSpacing: '0.2em', padding: '6px 20px', borderRadius: '0 0 12px 12px', display: 'block', whiteSpace: 'nowrap' }}>
                      MÁS POPULAR
                    </span>
                  </div>
                )}
                <div style={{ marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', color: plan.featured ? '#5E17EB' : 'rgba(255,255,255,0.3)' }}>
                    {plan.name}
                  </span>
                </div>
                <div className="flex items-end gap-1" style={{ marginBottom: 12 }}>
                  <span className="font-display" style={{ fontSize: 56, lineHeight: 1, color: '#F2EDE5' }}>
                    {plan.price === 0 ? 'FREE' : `$${plan.price}`}
                  </span>
                  {plan.price > 0 && <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>{plan.period}</span>}
                </div>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 32, lineHeight: 1.5 }}>{plan.desc}</p>
                <div style={{ flex: 1, marginBottom: 32 }}>
                  {plan.features.map((f, j) => (
                    <div key={j} className="flex items-center gap-3" style={{ marginBottom: 14 }}>
                      <span style={{ width: 18, height: 18, borderRadius: '50%', background: plan.featured ? 'rgba(94,23,235,0.2)' : 'rgba(255,255,255,0.06)', border: `1px solid ${plan.featured ? 'rgba(94,23,235,0.4)' : 'rgba(255,255,255,0.1)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 10, color: plan.featured ? '#5E17EB' : 'rgba(255,255,255,0.4)' }}>✓</span>
                      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.4 }}>{f}</span>
                    </div>
                  ))}
                </div>
                <motion.button
                  onClick={() => onNav('login')}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className={plan.featured ? 'btn-primary' : 'btn-ghost'}
                  style={{ width: '100%', padding: '16px', fontSize: 13 }}
                >
                  {plan.cta}
                </motion.button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ——— CTA FINAL ——— */}
      <section style={{ padding: '120px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 50% 60% at 50% 50%, rgba(94,23,235,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <motion.div
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          style={{ position: 'relative', zIndex: 1 }}
        >
          <h2 className="font-display text-section" style={{ lineHeight: 0.95, letterSpacing: '-0.02em', marginBottom: 28 }}>
            <span style={{ color: '#F2EDE5' }}>¿LISTO PARA<br /></span>
            <span style={{ color: '#5E17EB' }}>CRECER?</span>
          </h2>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.4)', maxWidth: 460, margin: '0 auto 48px', lineHeight: 1.65 }}>
            Únete a los artistas que ya están usando IM Music para llevar su carrera al siguiente nivel.
          </p>
          <motion.button
            onClick={() => onNav('login')}
            whileHover={{ scale: 1.05, boxShadow: '0 0 60px rgba(94,23,235,0.6)' }}
            whileTap={{ scale: 0.96 }}
            className="btn-primary"
            style={{ padding: '20px 56px', fontSize: 15 }}
          >
            EMPEZAR AHORA — ES GRATIS
          </motion.button>
        </motion.div>
      </section>

      {/* ——— FOOTER ——— */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '48px 24px', textAlign: 'center' }}>
        <div className="flex items-center justify-center gap-3" style={{ marginBottom: 20 }}>
          <IMLogo size={32} />
          <span className="font-display" style={{ fontSize: 18, letterSpacing: '0.3em', color: '#F2EDE5' }}>IM MUSIC</span>
        </div>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.1em' }}>
          © {new Date().getFullYear()} IM Music. Todos los derechos reservados.
        </p>
      </footer>
    </div>
  );
};

// ============================================================
// LOGIN PAGE
// ============================================================
const LoginPage = ({ onLogin }: { onLogin: (user: User, token: string) => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Completa todos los campos.'); return; }
    setLoading(true);
    setError('');
    try {
      const data = await api.post('/auth/login', { email, password });
      if (data.token && data.user) {
        localStorage.setItem('im_token', data.token);
        onLogin(data.user, data.token);
      } else {
        setError(data.error || 'Credenciales inválidas.');
      }
    } catch {
      setError('No se pudo conectar al servidor. Verifica tus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative', overflow: 'hidden' }}>
      <ParticleField />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(94,23,235,0.12) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 1 }} />
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: 420 }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div className="flex items-center justify-center gap-3" style={{ marginBottom: 12 }}>
            <IMLogo size={44} />
            <div>
              <div className="font-display" style={{ fontSize: 24, letterSpacing: '0.3em', color: '#F2EDE5', lineHeight: 1 }}>IM</div>
              <div style={{ fontSize: 9, letterSpacing: '0.5em', color: '#5E17EB', textTransform: 'uppercase', fontWeight: 700 }}>MUSIC</div>
            </div>
          </div>
          <h1 className="font-display" style={{ fontSize: 32, color: '#F2EDE5', letterSpacing: '-0.01em' }}>BIENVENIDO</h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)', marginTop: 8 }}>Accede a tu plataforma de crecimiento</p>
        </div>

        <form onSubmit={handleSubmit} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: 40 }}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="input-field"
              autoComplete="email"
            />
          </div>
          <div style={{ marginBottom: 32 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input-field"
              autoComplete="current-password"
            />
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#f87171', marginBottom: 24 }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={!loading ? { scale: 1.02, boxShadow: '0 0 40px rgba(94,23,235,0.5)' } : {}}
            whileTap={!loading ? { scale: 0.98 } : {}}
            className="btn-primary"
            style={{ width: '100%', padding: '16px', fontSize: 14 }}
          >
            {loading ? (
              <span className="flex items-center gap-3">
                <span className="spinner" style={{ width: 16, height: 16 }} />
                ENTRANDO...
              </span>
            ) : 'ENTRAR'}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};

// ============================================================
// DASHBOARD
// ============================================================
const DashboardPage = ({ user }: { user: User }) => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [royalties, setRoyalties] = useState<RoyaltySummary>({ total: 0, byPlatform: [] });
  const [loading, setLoading] = useState(true);
  const [showAddTrack, setShowAddTrack] = useState(false);
  const [newTrack, setNewTrack] = useState({ title: '', release_date: '', artist_id: 1 });
  const [addLoading, setAddLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [tracksData, royData] = await Promise.all([
        api.get('/tracks'),
        api.get('/royalties/summary'),
      ]);
      setTracks(Array.isArray(tracksData) ? tracksData : []);
      setRoyalties(royData || { total: 0, byPlatform: [] });
    } catch {
      // Keep defaults
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const addTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrack.title || !newTrack.release_date) return;
    setAddLoading(true);
    try {
      await api.post('/tracks', newTrack);
      setShowAddTrack(false);
      setNewTrack({ title: '', release_date: '', artist_id: 1 });
      load();
    } catch {
      // ignore
    } finally {
      setAddLoading(false);
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = { distributed: 'badge-green', pending: 'badge-amber', draft: 'badge-gray' };
    const labels: Record<string, string> = { distributed: 'Distribuido', pending: 'Pendiente', draft: 'Borrador' };
    return <span className={`badge ${map[status] || 'badge-gray'}`}>{labels[status] || status}</span>;
  };

  const statCards = [
    { label: 'Streams Totales', value: '—', icon: '🎵', color: '#5E17EB' },
    { label: 'Regalías', value: `$${Number(royalties.total || 0).toFixed(2)}`, icon: '💰', color: '#22c55e' },
    { label: 'Tracks Activos', value: tracks.length.toString(), icon: '🎶', color: '#f59e0b' },
    { label: 'Plataformas', value: (royalties.byPlatform?.length || 0).toString(), icon: '🌍', color: '#60a5fa' },
  ];

  const maxPlatform = Math.max(...(royalties.byPlatform?.map(p => Number(p.total)) || [1]));

  return (
    <div style={{ padding: '100px 24px 60px', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 48 }}>
        <span className="label-tag" style={{ marginBottom: 16, display: 'inline-block' }}>Dashboard</span>
        <h1 className="font-display" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', lineHeight: 1, letterSpacing: '-0.02em', color: '#F2EDE5' }}>
          HOLA, {user.name.toUpperCase().split(' ')[0]}
        </h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)', marginTop: 8 }}>Resumen de tu actividad musical</p>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4" style={{ marginBottom: 48 }}>
        {statCards.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="stat-card"
          >
            <div style={{ fontSize: 28, marginBottom: 12 }}>{s.icon}</div>
            <div style={{ fontSize: 28, fontFamily: 'Anton', color: s.color, lineHeight: 1, marginBottom: 6 }}>{loading ? '—' : s.value}</div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>{s.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tracks recientes */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card" style={{ padding: 28 }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 24 }}>
            <h2 style={{ fontFamily: 'Anton', fontSize: 18, letterSpacing: '0.05em', color: '#F2EDE5' }}>CATÁLOGO</h2>
            <button
              onClick={() => setShowAddTrack(true)}
              className="btn-primary"
              style={{ padding: '8px 16px', fontSize: 11 }}
            >
              + NUEVO
            </button>
          </div>
          {loading ? (
            <div className="flex items-center justify-center" style={{ height: 160 }}>
              <div className="spinner-purple" style={{ width: 32, height: 32, border: '2px solid rgba(94,23,235,0.2)', borderTopColor: '#5E17EB', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            </div>
          ) : tracks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>
              No hay tracks aún.<br />
              <button onClick={() => setShowAddTrack(true)} style={{ color: '#5E17EB', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, marginTop: 8, fontWeight: 600 }}>+ Agrega tu primer track</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {tracks.slice(0, 6).map((t, i) => (
                <div key={t.id} className="track-row">
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: `hsl(${(i * 60 + 260) % 360}, 70%, 35%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>🎵</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{t.release_date}</div>
                  </div>
                  {statusBadge(t.status)}
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Regalías por plataforma */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card" style={{ padding: 28 }}>
          <h2 style={{ fontFamily: 'Anton', fontSize: 18, letterSpacing: '0.05em', color: '#F2EDE5', marginBottom: 8 }}>REGALÍAS</h2>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 28 }}>Por plataforma</p>
          {loading ? (
            <div className="flex items-center justify-center" style={{ height: 160 }}>
              <div style={{ width: 32, height: 32, border: '2px solid rgba(94,23,235,0.2)', borderTopColor: '#5E17EB', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            </div>
          ) : royalties.byPlatform?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {royalties.byPlatform.map((p, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>{p.platform}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#F2EDE5' }}>${Number(p.total).toFixed(2)}</span>
                  </div>
                  <div className="platform-bar-track">
                    <motion.div
                      className="platform-bar-fill"
                      initial={{ width: 0 }}
                      animate={{ width: `${(Number(p.total) / maxPlatform) * 100}%` }}
                      transition={{ delay: 0.5 + i * 0.1, duration: 1 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>
              Aún no hay datos de regalías.
            </div>
          )}
        </motion.div>
      </div>

      {/* Add Track Modal */}
      <AnimatePresence>
        {showAddTrack && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={e => { if (e.target === e.currentTarget) setShowAddTrack(false); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              style={{ background: '#0a0a0a', border: '1px solid rgba(94,23,235,0.3)', borderRadius: 24, padding: 40, width: '100%', maxWidth: 440 }}
            >
              <h3 className="font-display" style={{ fontSize: 24, color: '#F2EDE5', marginBottom: 32, letterSpacing: '-0.01em' }}>NUEVO TRACK</h3>
              <form onSubmit={addTrack}>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>Título</label>
                  <input
                    type="text"
                    value={newTrack.title}
                    onChange={e => setNewTrack(n => ({ ...n, title: e.target.value }))}
                    placeholder="Nombre del track"
                    className="input-field"
                    required
                  />
                </div>
                <div style={{ marginBottom: 32 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>Fecha de lanzamiento</label>
                  <input
                    type="date"
                    value={newTrack.release_date}
                    onChange={e => setNewTrack(n => ({ ...n, release_date: e.target.value }))}
                    className="input-field"
                    required
                  />
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowAddTrack(false)} className="btn-ghost" style={{ flex: 1, padding: 14 }}>CANCELAR</button>
                  <button type="submit" disabled={addLoading} className="btn-primary" style={{ flex: 1, padding: 14 }}>
                    {addLoading ? <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} /> : 'GUARDAR'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ============================================================
// CATALOG PAGE
// ============================================================
const CatalogPage = () => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newTrack, setNewTrack] = useState({ title: '', release_date: '', artist_id: 1 });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get('/tracks');
      setTracks(Array.isArray(data) ? data : []);
    } catch {
      setTracks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/tracks', newTrack);
      setShowModal(false);
      setNewTrack({ title: '', release_date: '', artist_id: 1 });
      load();
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const filtered = tracks.filter(t => t.title.toLowerCase().includes(search.toLowerCase()));

  const statusBadge = (status: string) => {
    const map: Record<string, string> = { distributed: 'badge-green', pending: 'badge-amber', draft: 'badge-gray' };
    const labels: Record<string, string> = { distributed: 'Distribuido', pending: 'Pendiente', draft: 'Borrador' };
    return <span className={`badge ${map[status] || 'badge-gray'}`}>{labels[status] || status}</span>;
  };

  return (
    <div style={{ padding: '100px 24px 60px', maxWidth: 1100, margin: '0 auto' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 40 }}>
        <span className="label-tag" style={{ marginBottom: 16, display: 'inline-block' }}>Catálogo</span>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h1 className="font-display" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', lineHeight: 1, letterSpacing: '-0.02em', color: '#F2EDE5' }}>
            TUS TRACKS
          </h1>
          <button onClick={() => setShowModal(true)} className="btn-primary" style={{ padding: '12px 24px', fontSize: 12 }}>
            + NUEVO TRACK
          </button>
        </div>
      </motion.div>

      {/* Search */}
      <div style={{ marginBottom: 28 }}>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar tracks..."
          className="input-field"
          style={{ maxWidth: 360 }}
        />
      </div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div className="flex items-center justify-center" style={{ height: 200 }}>
            <div style={{ width: 36, height: 36, border: '2px solid rgba(94,23,235,0.2)', borderTopColor: '#5E17EB', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 24px', color: 'rgba(255,255,255,0.25)' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🎶</div>
            <p style={{ fontSize: 14 }}>{search ? 'Sin resultados.' : 'Aún no tienes tracks. ¡Agrega tu primero!'}</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Título</th>
                <th>Lanzamiento</th>
                <th>Estado</th>
                <th>ISRC</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t, i) => (
                <motion.tr key={t.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                  <td style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>{i + 1}</td>
                  <td style={{ fontWeight: 600, color: '#fff' }}>{t.title}</td>
                  <td>{t.release_date || '—'}</td>
                  <td>{statusBadge(t.status)}</td>
                  <td style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>{t.isrc || '—'}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </motion.div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              style={{ background: '#0a0a0a', border: '1px solid rgba(94,23,235,0.3)', borderRadius: 24, padding: 40, width: '100%', maxWidth: 440 }}
            >
              <h3 className="font-display" style={{ fontSize: 24, color: '#F2EDE5', marginBottom: 32 }}>NUEVO TRACK</h3>
              <form onSubmit={save}>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>Título del track</label>
                  <input type="text" value={newTrack.title} onChange={e => setNewTrack(n => ({ ...n, title: e.target.value }))} placeholder="Ej: Mi Canción" className="input-field" required />
                </div>
                <div style={{ marginBottom: 32 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>Fecha de lanzamiento</label>
                  <input type="date" value={newTrack.release_date} onChange={e => setNewTrack(n => ({ ...n, release_date: e.target.value }))} className="input-field" required />
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-ghost" style={{ flex: 1, padding: 14 }}>CANCELAR</button>
                  <button type="submit" disabled={saving} className="btn-primary" style={{ flex: 1, padding: 14 }}>
                    {saving ? <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} /> : 'GUARDAR'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ============================================================
// ROYALTIES PAGE
// ============================================================
const RoyaltiesPage = () => {
  const [data, setData] = useState<RoyaltySummary>({ total: 0, byPlatform: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/royalties/summary')
      .then(d => setData(d || { total: 0, byPlatform: [] }))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const maxVal = Math.max(...(data.byPlatform?.map(p => Number(p.total)) || [1]));

  return (
    <div style={{ padding: '100px 24px 60px', maxWidth: 1100, margin: '0 auto' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 48 }}>
        <span className="label-tag" style={{ marginBottom: 16, display: 'inline-block' }}>Finanzas</span>
        <h1 className="font-display" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', lineHeight: 1, letterSpacing: '-0.02em', color: '#F2EDE5' }}>REGALÍAS</h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)', marginTop: 8 }}>Ingresos por plataforma de distribución</p>
      </motion.div>

      {/* Total */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="glass-card"
        style={{ padding: 40, marginBottom: 24, textAlign: 'center', background: 'rgba(94,23,235,0.06)', borderColor: 'rgba(94,23,235,0.2)' }}>
        <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 12 }}>Total acumulado</p>
        {loading ? (
          <div style={{ width: 40, height: 40, border: '2px solid rgba(94,23,235,0.2)', borderTopColor: '#5E17EB', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto' }} />
        ) : (
          <div className="font-display" style={{ fontSize: 'clamp(3rem, 8vw, 6rem)', lineHeight: 1, color: '#5E17EB' }}>
            ${Number(data.total).toFixed(2)}
          </div>
        )}
      </motion.div>

      {/* Por plataforma */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card" style={{ padding: 32 }}>
        <h2 style={{ fontFamily: 'Anton', fontSize: 18, letterSpacing: '0.05em', color: '#F2EDE5', marginBottom: 28 }}>POR PLATAFORMA</h2>
        {loading ? (
          <div className="flex items-center justify-center" style={{ height: 160 }}>
            <div style={{ width: 36, height: 36, border: '2px solid rgba(94,23,235,0.2)', borderTopColor: '#5E17EB', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          </div>
        ) : data.byPlatform?.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {data.byPlatform.map((p, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.07 }}>
                <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{p.platform}</span>
                  <span style={{ fontFamily: 'Anton', fontSize: 20, color: '#F2EDE5' }}>${Number(p.total).toFixed(2)}</span>
                </div>
                <div className="platform-bar-track">
                  <motion.div
                    className="platform-bar-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${(Number(p.total) / maxVal) * 100}%` }}
                    transition={{ delay: 0.5 + i * 0.1, duration: 1.2, ease: [0.23, 1, 0.32, 1] }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'rgba(255,255,255,0.25)', fontSize: 14 }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>💰</div>
            No hay datos de regalías disponibles aún.
          </div>
        )}
      </motion.div>
    </div>
  );
};

// ============================================================
// MARKETING / AI CHAT PAGE
// ============================================================
const MarketingPage = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'ai', content: '¡Hola! Soy tu agente de marketing con IA. Puedo ayudarte a crear estrategias, analizar tu mercado, generar ideas de contenido y mucho más. ¿Por dónde empezamos?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    setMessages(m => [...m, { role: 'user', content: text }]);
    setLoading(true);
    try {
      const data = await api.post('/ai/chat', { message: text });
      setMessages(m => [...m, { role: 'ai', content: data.reply || data.response || data.message || 'Respuesta recibida.' }]);
    } catch {
      setMessages(m => [...m, { role: 'ai', content: 'Hubo un error al conectar con el agente. Verifica que el servidor esté activo.' }]);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    'Analiza mi mercado objetivo',
    'Crea una estrategia de lanzamiento',
    'Ideas de contenido para redes',
    'Tendencias en mi género musical',
  ];

  return (
    <div style={{ padding: '90px 0 0', height: '100vh', display: 'flex', flexDirection: 'column', maxWidth: 800, margin: '0 auto', paddingLeft: 24, paddingRight: 24 }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ paddingBottom: 24, borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 0 }}>
        <span className="label-tag" style={{ marginBottom: 12, display: 'inline-block' }}>IA</span>
        <h1 className="font-display" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', lineHeight: 1, letterSpacing: '-0.02em', color: '#F2EDE5' }}>MARKETING IA</h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginTop: 6 }}>Agente de estrategia musical powered by AI</p>
      </motion.div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}
            >
              {msg.role === 'ai' && (
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(94,23,235,0.2)', border: '1px solid rgba(94,23,235,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0, marginRight: 10, marginTop: 2 }}>
                  ⚡
                </div>
              )}
              <div className={`chat-bubble ${msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}`}>
                {msg.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(94,23,235,0.2)', border: '1px solid rgba(94,23,235,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>⚡</div>
            <div className="chat-bubble chat-bubble-ai" style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              {[0, 1, 2].map(i => (
                <span key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: '#5E17EB', animation: `bounce 1s ${i * 0.2}s ease-in-out infinite`, display: 'inline-block' }} />
              ))}
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {messages.length === 1 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => { setInput(s); }}
              style={{ background: 'rgba(94,23,235,0.08)', border: '1px solid rgba(94,23,235,0.2)', borderRadius: 8, padding: '8px 14px', fontSize: 12, color: 'rgba(255,255,255,0.6)', cursor: 'pointer', transition: 'all 0.2s', fontWeight: 500 }}
              onMouseEnter={e => { (e.currentTarget).style.borderColor = 'rgba(94,23,235,0.5)'; (e.currentTarget).style.color = '#fff'; }}
              onMouseLeave={e => { (e.currentTarget).style.borderColor = 'rgba(94,23,235,0.2)'; (e.currentTarget).style.color = 'rgba(255,255,255,0.6)'; }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form onSubmit={send} style={{ display: 'flex', gap: 12, paddingBottom: 28, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Pregunta algo sobre tu estrategia musical..."
          className="input-field"
          style={{ flex: 1 }}
          disabled={loading}
        />
        <motion.button
          type="submit"
          disabled={loading || !input.trim()}
          whileHover={!loading && input.trim() ? { scale: 1.05 } : {}}
          whileTap={!loading && input.trim() ? { scale: 0.95 } : {}}
          className="btn-primary"
          style={{ padding: '14px 24px', flexShrink: 0 }}
        >
          →
        </motion.button>
      </form>
    </div>
  );
};

// ============================================================
// APP PRINCIPAL
// ============================================================
type Page = 'home' | 'login' | 'dashboard' | 'catalog' | 'royalties' | 'marketing';

export default function App() {
  const [page, setPage] = useState<Page>('home');
  const [user, setUser] = useState<User | null>(null);
  const [booting, setBooting] = useState(true);

  // Check existing session
  useEffect(() => {
    const token = localStorage.getItem('im_token');
    if (!token) { setBooting(false); return; }
    api.get('/auth/me')
      .then(u => { if (u?.id) setUser(u); })
      .catch(() => localStorage.removeItem('im_token'))
      .finally(() => setBooting(false));
  }, []);

  const navigate = (target: string) => {
    const protectedPages: Page[] = ['dashboard', 'catalog', 'royalties', 'marketing'];
    if (protectedPages.includes(target as Page) && !user) {
      setPage('login');
      return;
    }
    if (target === 'servicios' || target === 'planes') {
      setPage('home');
      setTimeout(() => {
        document.getElementById(target)?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      return;
    }
    setPage(target as Page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogin = (u: User, token: string) => {
    localStorage.setItem('im_token', token);
    setUser(u);
    setPage('dashboard');
    window.scrollTo({ top: 0 });
  };

  const handleLogout = () => {
    localStorage.removeItem('im_token');
    setUser(null);
    setPage('home');
    window.scrollTo({ top: 0 });
  };

  if (booting) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="flex flex-col items-center gap-4"
        >
          <IMLogo size={56} />
          <div style={{ width: 32, height: 32, border: '2px solid rgba(94,23,235,0.2)', borderTopColor: '#5E17EB', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#000', color: '#fff' }}>
      <Navbar onNav={navigate} active={page} user={user} onLogout={handleLogout} />

      <AnimatePresence mode="wait">
        <motion.div
          key={page}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
        >
          {page === 'home' && <LandingPage onNav={navigate} />}
          {page === 'login' && <LoginPage onLogin={handleLogin} />}
          {page === 'dashboard' && user && <DashboardPage user={user} />}
          {page === 'catalog' && user && <CatalogPage />}
          {page === 'royalties' && user && <RoyaltiesPage />}
          {page === 'marketing' && user && <MarketingPage />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
