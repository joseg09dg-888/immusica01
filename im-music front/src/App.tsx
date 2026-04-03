import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import confetti from 'canvas-confetti';

// ============================================================
// TYPES
// ============================================================
interface User { id: number; name: string; email: string; role: string; }
interface Track { id: number; title: string; release_date: string; status: string; isrc?: string; }
interface RoyaltySummary { total: number; byPlatform: { platform: string; total: number }[]; }
interface ChatMsg { role: 'user' | 'ai'; content: string; }

// ============================================================
// API
// ============================================================
const api = {
  get: (path: string) => {
    const token = localStorage.getItem('im_token');
    return fetch(`/api${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(r => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); });
  },
  post: (path: string, body: Record<string, unknown>) => {
    const token = localStorage.getItem('im_token');
    return fetch(`/api${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body),
    }).then(r => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); });
  },
};

// ============================================================
// CONFETTI BURST
// ============================================================
const burst = (origin = { y: 0.6 }) =>
  confetti({ particleCount: 160, spread: 90, origin, colors: ['#5E17EB', '#7B3FFF', '#F2EDE5', '#9B6EFF', '#fff'] });

// ============================================================
// 3D TILT HOOK
// ============================================================
const useTilt = () => {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width - 0.5) * 16;
    const y = ((e.clientY - r.top) / r.height - 0.5) * -16;
    el.style.transform = `perspective(1000px) rotateX(${y}deg) rotateY(${x}deg) translateY(-12px) scale(1.02)`;
    el.style.boxShadow = '0 30px 70px rgba(94,23,235,0.35)';
    el.style.borderColor = 'rgba(94,23,235,0.4)';
  };
  const onLeave = () => {
    const el = ref.current; if (!el) return;
    el.style.transform = '';
    el.style.boxShadow = '';
    el.style.borderColor = '';
  };
  return { ref, onMove, onLeave };
};

// ============================================================
// LOGO
// ============================================================
const IMLogo = ({ size = 44 }: { size?: number }) => (
  <svg width={size} height={size * 0.75} viewBox="0 0 120 90" fill="none">
    <path d="M8 10 C8 10,18 8,22 45 C26 82,36 80,36 80 C36 80,26 78,22 45 C18 12,8 10,8 10Z" fill="#5E17EB"/>
    <path d="M36 80 C36 80,46 82,50 45 C54 8,60 10,60 10 C60 10,66 8,70 45 C74 82,84 80,84 80Z" fill="#5E17EB"/>
    <path d="M84 80 C84 80,94 78,98 45 C102 12,112 10,112 10 C112 10,102 8,98 45 C94 82,84 80,84 80Z" fill="#5E17EB"/>
    <path d="M8 10 L36 10 L36 24 L22 24Z" fill="#5E17EB" opacity="0.35"/>
    <path d="M84 10 L112 10 L98 24 L84 24Z" fill="#5E17EB" opacity="0.35"/>
  </svg>
);

// ============================================================
// SVG ICONS (inline, no emoji)
// ============================================================
const IconDistribution = () => (
  <svg width="44" height="44" viewBox="0 0 44 44" fill="none" stroke="#5E17EB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="22" cy="22" r="18" strokeOpacity="0.2"/>
    <path d="M22 8v28M14 18l8-8 8 8"/>
    <path d="M10 30c2 3 7 5 12 5s10-2 12-5" strokeOpacity="0.5"/>
    <path d="M7 24c2 5 8 9 15 9s13-4 15-9" strokeOpacity="0.3"/>
  </svg>
);
const IconMarketing = () => (
  <svg width="44" height="44" viewBox="0 0 44 44" fill="none" stroke="#5E17EB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 6c-8.8 0-16 7.2-16 16 0 4.4 1.8 8.4 4.7 11.3L9 38l4.7-1.7C15.7 37.4 18.8 38 22 38c8.8 0 16-7.2 16-16S30.8 6 22 6z"/>
    <path d="M15 22h14M22 15v14" strokeOpacity="0.6"/>
    <circle cx="22" cy="22" r="3" fill="#5E17EB" fillOpacity="0.3" stroke="none"/>
  </svg>
);
const IconAI = () => (
  <svg width="44" height="44" viewBox="0 0 44 44" fill="none" stroke="#5E17EB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="10" y="12" width="24" height="20" rx="4"/>
    <circle cx="17" cy="20" r="2.5"/>
    <circle cx="27" cy="20" r="2.5"/>
    <path d="M17 26s1.5 2 5 2 5-2 5-2"/>
    <path d="M16 12V8M28 12V8M8 22H4M40 22h-4"/>
  </svg>
);
const IconRoyalties = () => (
  <svg width="44" height="44" viewBox="0 0 44 44" fill="none" stroke="#5E17EB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="22" cy="22" r="16"/>
    <path d="M22 12v20M18 16h6a4 4 0 010 8h-6a4 4 0 000 8h8"/>
  </svg>
);
const IconVideo = () => (
  <svg width="44" height="44" viewBox="0 0 44 44" fill="none" stroke="#5E17EB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="12" width="24" height="20" rx="3"/>
    <path d="M28 17l12-6v22l-12-6V17z"/>
  </svg>
);
const IconFinancing = () => (
  <svg width="44" height="44" viewBox="0 0 44 44" fill="none" stroke="#5E17EB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="4,34 14,22 22,28 34,10 40,10"/>
    <polyline points="34,10 40,10 40,16"/>
    <circle cx="14" cy="22" r="3" fill="#5E17EB" fillOpacity="0.3" stroke="none"/>
    <circle cx="22" cy="28" r="3" fill="#5E17EB" fillOpacity="0.3" stroke="none"/>
  </svg>
);

// ============================================================
// PARTICLE FIELD — mouse repulsion
// ============================================================
const ParticleField = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let W = canvas.width = window.innerWidth;
    let H = canvas.height = window.innerHeight;
    const colors = ['#5E17EB', '#7B3FFF', '#9B6EFF', '#F2EDE5'];
    const pts = Array.from({ length: 90 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5,
      r: Math.random() * 2 + 0.8,
      op: Math.random() * 0.5 + 0.1,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
    let mx = -9999, my = -9999;
    const onMM = (e: MouseEvent) => { mx = e.clientX; my = e.clientY; };
    window.addEventListener('mousemove', onMM);
    const onResize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
    window.addEventListener('resize', onResize);
    let raf: number;
    const tick = () => {
      ctx.clearRect(0, 0, W, H);
      pts.forEach((p, i) => {
        const dx = p.x - mx, dy = p.y - my;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 140) { const f = ((140 - d) / 140) * 0.35; p.vx += (dx / d) * f; p.vy += (dy / d) * f; }
        const spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (spd > 2.5) { p.vx = (p.vx / spd) * 2.5; p.vy = (p.vy / spd) * 2.5; }
        p.vx *= 0.98; p.vy *= 0.98;
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) { p.x = 0; p.vx *= -1; }
        if (p.x > W) { p.x = W; p.vx *= -1; }
        if (p.y < 0) { p.y = 0; p.vy *= -1; }
        if (p.y > H) { p.y = H; p.vy *= -1; }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.op;
        ctx.fill();
        for (let j = i + 1; j < pts.length; j++) {
          const q = pts[j];
          const dx2 = p.x - q.x, dy2 = p.y - q.y;
          const d2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
          if (d2 < 130) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = '#5E17EB';
            ctx.globalAlpha = (1 - d2 / 130) * 0.11;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
        ctx.globalAlpha = 1;
      });
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('mousemove', onMM); window.removeEventListener('resize', onResize); };
  }, []);
  return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }} />;
};

// ============================================================
// FLOATING ORBS (CSS only)
// ============================================================
const Orbs = () => (
  <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1, overflow: 'hidden' }}>
    <div style={{ position: 'absolute', left: '5%', top: '15%', width: 380, height: 380, borderRadius: '50%', background: 'radial-gradient(circle, rgba(94,23,235,0.18) 0%, transparent 70%)', filter: 'blur(60px)', animation: 'float 12s ease-in-out infinite' }} />
    <div style={{ position: 'absolute', right: '8%', top: '8%', width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(123,63,255,0.14) 0%, transparent 70%)', filter: 'blur(50px)', animation: 'float2 16s ease-in-out infinite' }} />
    <div style={{ position: 'absolute', right: '15%', bottom: '20%', width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(94,23,235,0.12) 0%, transparent 70%)', filter: 'blur(70px)', animation: 'float3 10s ease-in-out infinite' }} />
    <div style={{ position: 'absolute', left: '30%', bottom: '10%', width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(45,11,107,0.25) 0%, transparent 70%)', filter: 'blur(40px)', animation: 'float 18s ease-in-out infinite 3s' }} />
  </div>
);

// ============================================================
// NAVBAR
// ============================================================
const Navbar = ({ onNav, page, user, onLogout }: { onNav: (p: string) => void; page: string; user: User | null; onLogout: () => void; }) => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);
  const pubLinks = [{ id: 'home', label: 'Inicio' }, { id: 'servicios', label: 'Servicios' }, { id: 'planes', label: 'Planes' }];
  const dashLinks = [{ id: 'dashboard', label: 'Dashboard' }, { id: 'catalog', label: 'Catálogo' }, { id: 'royalties', label: 'Regalías' }, { id: 'marketing', label: 'IA' }];
  const links = user ? dashLinks : pubLinks;
  return (
    <nav className={`navbar${scrolled ? ' navbar-scrolled' : ''}`}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Logo */}
        <motion.button onClick={() => onNav('home')} whileHover={{ scale: 1.04 }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
          <IMLogo size={38} />
          <div>
            <div className="font-display" style={{ fontSize: 19, color: '#F2EDE5', letterSpacing: '0.35em', lineHeight: 1 }}>IM</div>
            <div style={{ fontSize: 9, color: '#5E17EB', letterSpacing: '0.5em', textTransform: 'uppercase', fontWeight: 700, lineHeight: 1 }}>MUSIC</div>
          </div>
        </motion.button>

        {/* Desktop links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 36 }} className="hidden md:flex">
          {/* LIVE indicator */}
          <div className="flex items-center gap-2" style={{ opacity: 0.7 }}>
            <div className="live-dot" />
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#4ade80' }}>LIVE</span>
          </div>
          {links.map(l => (
            <button key={l.id} onClick={() => onNav(l.id)}
              className={`nav-link${page === l.id ? ' active' : ''}`}>{l.label}</button>
          ))}
        </div>

        {/* Auth */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(94,23,235,0.1)', border: '1px solid rgba(94,23,235,0.25)', borderRadius: 10, padding: '6px 14px' }}>
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#5E17EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Anton', fontSize: 13, color: '#fff' }}>
                  {user.name[0]?.toUpperCase()}
                </div>
                <span className="hidden md:block" style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.65)' }}>{user.name}</span>
              </div>
              <button onClick={onLogout} className="btn-ghost" style={{ padding: '8px 18px', fontSize: 11 }}>Salir</button>
            </>
          ) : (
            <>
              <button onClick={() => onNav('login')} className="nav-link hidden md:block" style={{ marginRight: 8 }}>Entrar</button>
              <motion.button onClick={() => onNav('login')} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                className="btn-primary" style={{ padding: '10px 22px', fontSize: 11 }}>Empezar</motion.button>
            </>
          )}
          {/* Hamburger */}
          <button onClick={() => setOpen(!open)} className="md:hidden"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, display: 'flex', flexDirection: 'column', gap: 5, width: 32 }}>
            <span style={{ height: 2, background: '#fff', borderRadius: 2, transition: 'all 0.3s', transform: open ? 'rotate(45deg) translateY(7px)' : 'none', display: 'block' }} />
            <span style={{ height: 2, background: '#fff', borderRadius: 2, transition: 'all 0.3s', opacity: open ? 0 : 1, display: 'block' }} />
            <span style={{ height: 2, background: '#fff', borderRadius: 2, transition: 'all 0.3s', transform: open ? 'rotate(-45deg) translateY(-7px)' : 'none', display: 'block' }} />
          </button>
        </div>
      </div>
      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            style={{ background: 'rgba(0,0,0,0.97)', backdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(94,23,235,0.2)', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {links.map(l => (
              <button key={l.id} onClick={() => { onNav(l.id); setOpen(false); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'Anton', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.2em', color: page === l.id ? '#5E17EB' : 'rgba(255,255,255,0.55)', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                {l.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

// ============================================================
// COUNTER ANIMATION HOOK
// ============================================================
const useCounter = (target: number, duration = 2000) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const tick = () => {
      const p = Math.min((Date.now() - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(Math.floor(target * ease));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return val;
};

// ============================================================
// LANDING PAGE
// ============================================================
const LandingPage = ({ onNav }: { onNav: (p: string) => void }) => {
  const { scrollY } = useScroll();
  const hy = useTransform(scrollY, [0, 500], [0, -120]);
  const hop = useTransform(scrollY, [0, 400], [1, 0]);

  const a247 = useCounter(247);
  const a850 = useCounter(850);
  const a32 = useCounter(32);

  // hero word animation
  const container = { hidden: {}, visible: { transition: { staggerChildren: 0.13, delayChildren: 0.2 } } };
  const word = { hidden: { y: 80, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { duration: 0.75, ease: [0.23, 1, 0.32, 1] as number[] } } };

  const SERVICES = [
    { Icon: IconDistribution, title: 'Distribución Digital', desc: 'Tu música en Spotify, Apple Music, Tidal, Amazon y 150+ plataformas globales. ISRC y UPC incluidos sin costo.' },
    { Icon: IconMarketing, title: 'Marketing con IA', desc: 'Estrategias hiperpersonalizadas basadas en neurociencia, datos de comportamiento real y tendencias de tu audiencia.' },
    { Icon: IconAI, title: 'Agentes Inteligentes', desc: 'Gemini AI trabajando 24/7 en tu branding, pitch decks, análisis de tendencias y estrategia de crecimiento.' },
    { Icon: IconRoyalties, title: 'Gestión de Regalías', desc: 'Master y publishing administrados con splits automáticos. Reportes en tiempo real y pagos puntuales garantizados.' },
    { Icon: IconVideo, title: 'Producción Visual', desc: 'Videos musicales, reels y contenido visual de talla mundial. Postproducción y colorización profesional.' },
    { Icon: IconFinancing, title: 'Financiamiento', desc: 'Adelantos sobre regalías futuras sin ceder tus masters. Crece sin sacrificar tu independencia artística.' },
  ];

  const PLANS = [
    {
      name: 'BÁSICO', price: '$79.000 COP', period: '/mes', featured: false,
      desc: 'El punto de partida para artistas que quieren ser escuchados.',
      features: ['Distribución a 50+ plataformas', 'ISRC y UPC incluidos', '1 artista registrado', '5 tracks activos', 'Dashboard básico', 'Soporte por email'],
      cta: 'COMENZAR',
    },
    {
      name: 'PRO', price: '$590.000 COP', period: '/mes', featured: true,
      desc: 'Para artistas que van en serio con su carrera musical.',
      features: ['Distribución a 150+ plataformas', '3 artistas registrados', 'Tracks ilimitados', 'Agente Marketing IA', 'Branding + Arquetipo', 'Plan 30 días de contenido', 'Pitch playlists', 'Reporting avanzado', 'Soporte prioritario 24/7'],
      cta: 'ELEGIR PRO',
    },
    {
      name: 'ELITE 360', price: '$11.900.000 COP', period: '/mes', featured: false,
      desc: 'El arsenal completo para dominar la industria musical.',
      features: ['Todo en Pro', 'Artistas ilimitados', 'Investigación cultural', 'Marketing 360° gestionado', 'FB Ads con presupuesto', 'Asesoría legal con IA', 'Financiamiento disponible', 'Manager virtual IA dedicado'],
      cta: 'HABLAR CON UN EXPERTO',
    },
  ];

  const ARTISTS = [
    { name: 'Luna Rivera', genre: 'Urbano Latino', streams: '12M', color: '#5E17EB' },
    { name: 'El Profeta', genre: 'Reggaeton', streams: '45M', color: '#7B3FFF' },
    { name: 'Kíara Sol', genre: 'Pop Alternativo', streams: '8M', color: '#2D0B6B' },
    { name: 'DJ Cipher', genre: 'Electronic', streams: '22M', color: '#5E17EB' },
    { name: 'Valeria M.', genre: 'R&B Soul', streams: '6M', color: '#7B3FFF' },
    { name: 'Trío Norte', genre: 'Cumbia Fusión', streams: '31M', color: '#2D0B6B' },
    { name: 'Axel Dark', genre: 'Metal Alternativo', streams: '9M', color: '#5E17EB' },
    { name: 'Sandra Vibe', genre: 'Afrobeats', streams: '17M', color: '#7B3FFF' },
  ];

  const t1 = useTilt(); const t2 = useTilt(); const t3 = useTilt();
  const t4 = useTilt(); const t5 = useTilt(); const t6 = useTilt();
  const tilts = [t1, t2, t3, t4, t5, t6];

  return (
    <div style={{ background: '#000' }}>
      {/* ════ HERO ════ */}
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
        <ParticleField />
        <Orbs />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 50% -5%, rgba(94,23,235,0.2) 0%, transparent 65%)', zIndex: 2, pointerEvents: 'none' }} />

        <motion.div style={{ y: hy, opacity: hop, position: 'relative', zIndex: 10, textAlign: 'center', padding: '0 24px', maxWidth: 1060, margin: '0 auto' }}>
          {/* Badge */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'rgba(94,23,235,0.1)', border: '1px solid rgba(94,23,235,0.3)', borderRadius: 100, padding: '9px 20px', marginBottom: 44 }}>
            <div className="live-dot" />
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.35em', textTransform: 'uppercase', color: '#5E17EB' }}>Plataforma Elite — Artistas Reales</span>
          </motion.div>

          {/* Hero headline — staggered word reveal */}
          <motion.div variants={container} initial="hidden" animate="visible"
            className="font-display text-hero"
            style={{ lineHeight: 0.9, letterSpacing: '-0.02em', marginBottom: 36 }}>
            <div style={{ overflow: 'hidden' }}>
              <motion.span variants={word} style={{ display: 'inline-block', color: '#F2EDE5', marginRight: '0.2em' }}>SOMOS</motion.span>
              <motion.span variants={word} style={{ display: 'inline-block', color: '#F2EDE5' }}>TU</motion.span>
            </div>
            <div style={{ overflow: 'hidden' }}>
              <motion.span variants={word} style={{ display: 'inline-block', color: '#5E17EB', marginRight: '0.2em' }}>SOCIO</motion.span>
              <motion.span variants={word} style={{ display: 'inline-block', color: '#5E17EB' }}>DE</motion.span>
            </div>
            <div style={{ overflow: 'hidden' }}>
              <motion.span variants={word} style={{ display: 'inline-block', color: '#F2EDE5' }}>CRECIMIENTO.</motion.span>
            </div>
          </motion.div>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}
            style={{ fontSize: 18, color: 'rgba(255,255,255,0.42)', maxWidth: 540, margin: '0 auto 52px', fontWeight: 400, lineHeight: 1.65 }}>
            Distribución global + Neurociencia + IA aplicada a tu carrera musical.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }}
            style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center' }}>
            <motion.button
              onClick={() => { burst({ y: 0.8 }); setTimeout(() => onNav('login'), 300); }}
              whileHover={{ scale: 1.04, boxShadow: '0 0 60px rgba(94,23,235,0.65)' }}
              whileTap={{ scale: 0.96 }}
              className="btn-primary" style={{ padding: '20px 44px', fontSize: 14 }}>
              COMIENZA TU REBELIÓN
            </motion.button>
            <motion.button
              onClick={() => document.getElementById('servicios')?.scrollIntoView({ behavior: 'smooth' })}
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              className="btn-ghost" style={{ padding: '20px 44px', fontSize: 14 }}>
              VER CÓMO FUNCIONA
            </motion.button>
          </motion.div>

          {/* Animated counters */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 32, maxWidth: 480, margin: '72px auto 0' }}>
            {[{ v: `${a247}+`, l: 'Artistas Activos' }, { v: `${a850}M+`, l: 'Streams Generados' }, { v: `${a32}`, l: 'Países Alcanzados' }].map((s, i) => (
              <motion.div key={i} whileHover={{ scale: 1.1 }} style={{ textAlign: 'center', cursor: 'default' }}>
                <div className="font-display" style={{ fontSize: 38, color: '#5E17EB', lineHeight: 1 }}>{s.v}</div>
                <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.25)', marginTop: 8, fontWeight: 700 }}>{s.l}</div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 1.8, repeat: Infinity }}
          style={{ position: 'absolute', bottom: 44, left: '50%', transform: 'translateX(-50%)', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.35em', color: 'rgba(255,255,255,0.15)', fontWeight: 700 }}>Scroll</span>
          <div className="scroll-line" />
        </motion.div>
      </section>

      {/* ════ MARQUEE ════ */}
      <div style={{ background: '#5E17EB', height: 56, overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
        <div style={{ display: 'flex', whiteSpace: 'nowrap', animation: 'marquee 22s linear infinite' }}>
          {Array(8).fill(null).map((_, i) => (
            <span key={i} className="font-display" style={{ fontSize: 20, fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#000', padding: '0 40px', flexShrink: 0 }}>
              IM MUSIC ★ 247 ARTISTAS ACTIVOS ★ 850M STREAMS ★ REBELIÓN MUSICAL ★ NEUROCIENCIA APLICADA ★
            </span>
          ))}
        </div>
      </div>

      {/* ════ SERVICIOS ════ */}
      <section id="servicios" style={{ padding: '128px 24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(94,23,235,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: 80 }}>
            <span className="label-tag">Lo que hacemos</span>
            <h2 className="font-display text-section" style={{ lineHeight: 0.92, letterSpacing: '-0.02em', marginTop: 20 }}>
              <span style={{ color: '#F2EDE5', display: 'block' }}>SERVICIOS</span>
              <span style={{ color: '#5E17EB', display: 'block' }}>DE ÉLITE</span>
            </h2>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
            {SERVICES.map((s, i) => {
              const tilt = tilts[i];
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}>
                  <div ref={tilt.ref} onMouseMove={tilt.onMove} onMouseLeave={tilt.onLeave} className="service-card"
                    style={{ height: '100%', transition: 'transform 0.35s cubic-bezier(0.23,1,0.32,1), box-shadow 0.35s ease, border-color 0.35s ease' }}>
                    <div style={{ marginBottom: 22 }}><s.Icon /></div>
                    <h3 className="font-display" style={{ fontSize: 22, letterSpacing: '-0.01em', color: '#F2EDE5', marginBottom: 14 }}>{s.title}</h3>
                    <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.38)', lineHeight: 1.7 }}>{s.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ════ STATS BAR ════ */}
      <section style={{ background: 'rgba(94,23,235,0.05)', borderTop: '1px solid rgba(94,23,235,0.15)', borderBottom: '1px solid rgba(94,23,235,0.15)', padding: '60px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 48, textAlign: 'center' }}>
          {[
            { v: '850M+', l: 'Streams totales' }, { v: '247+', l: 'Artistas activos' },
            { v: '150+', l: 'Plataformas' }, { v: '32', l: 'Países' }
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
              <div className="font-display" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', color: '#5E17EB', lineHeight: 1, marginBottom: 8 }}>{s.v}</div>
              <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.25em', color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>{s.l}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ════ PLANES ════ */}
      <section id="planes" style={{ padding: '128px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: 80 }}>
            <span className="label-tag">Precios</span>
            <h2 className="font-display text-section" style={{ lineHeight: 0.92, letterSpacing: '-0.02em', marginTop: 20 }}>
              <span style={{ color: '#F2EDE5', display: 'block' }}>ELIGE TU</span>
              <span style={{ color: '#5E17EB', display: 'block' }}>NIVEL</span>
            </h2>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.35)', marginTop: 20, maxWidth: 440, margin: '20px auto 0' }}>Sin contratos. Sin letra pequeña. Cancela cuando quieras.</p>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            {PLANS.map((plan, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <div className={`plan-card${plan.featured ? ' plan-card-featured' : ''}`}>
                  {plan.featured && (
                    <div style={{ position: 'absolute', top: -1, left: '50%', transform: 'translateX(-50%)' }}>
                      <span className="font-display" style={{ display: 'block', background: '#5E17EB', color: '#fff', fontSize: 10, letterSpacing: '0.25em', padding: '7px 22px', borderRadius: '0 0 12px 12px', whiteSpace: 'nowrap' }}>
                        ★ MÁS POPULAR
                      </span>
                    </div>
                  )}
                  <div style={{ marginBottom: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', color: plan.featured ? '#5E17EB' : 'rgba(255,255,255,0.3)' }}>{plan.name}</span>
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <span className="font-display" style={{ fontSize: 32, color: '#F2EDE5', lineHeight: 1 }}>{plan.price}</span>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginLeft: 4 }}>{plan.period}</span>
                  </div>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.38)', marginBottom: 32, lineHeight: 1.55 }}>{plan.desc}</p>
                  <div style={{ flex: 1, marginBottom: 36 }}>
                    {plan.features.map((f, j) => (
                      <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
                        <span style={{ width: 18, height: 18, borderRadius: '50%', background: plan.featured ? 'rgba(94,23,235,0.2)' : 'rgba(255,255,255,0.05)', border: `1px solid ${plan.featured ? 'rgba(94,23,235,0.45)' : 'rgba(255,255,255,0.1)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: plan.featured ? '#7B3FFF' : 'rgba(255,255,255,0.4)', flexShrink: 0, marginTop: 2 }}>✓</span>
                        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.45 }}>{f}</span>
                      </div>
                    ))}
                  </div>
                  <motion.button
                    onClick={() => { burst({ y: 0.7 }); setTimeout(() => onNav('login'), 350); }}
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    className={plan.featured ? 'btn-primary' : 'btn-ghost'}
                    style={{ width: '100%', padding: '16px' }}>
                    {plan.cta}
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════ ARTISTS STRIP ════ */}
      <section style={{ padding: '80px 0', overflow: 'hidden', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ textAlign: 'center', marginBottom: 56, padding: '0 24px' }}>
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="font-display" style={{ fontSize: 'clamp(1.2rem, 3vw, 2rem)', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Artistas que han confiado en nosotros
          </motion.h2>
        </div>
        <div style={{ display: 'flex', gap: 16, overflow: 'hidden', maskImage: 'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)' }}>
          <div style={{ display: 'flex', gap: 16, animation: 'marquee 30s linear infinite', flexShrink: 0 }}>
            {[...ARTISTS, ...ARTISTS].map((a, i) => (
              <div key={i} className="artist-card">
                <div className="artist-avatar" style={{ background: `linear-gradient(135deg, ${a.color}33, ${a.color}11)`, borderColor: `${a.color}55` }}>
                  <span style={{ color: a.color }}>{a.name[0]}</span>
                </div>
                <div style={{ fontFamily: 'Anton', fontSize: 14, color: '#F2EDE5', marginBottom: 4 }}>{a.name}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>{a.genre}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#5E17EB' }}>{a.streams} streams</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════ FINAL CTA ════ */}
      <section style={{ padding: '128px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 70% at 50% 50%, rgba(94,23,235,0.14) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ position: 'relative', zIndex: 1 }}>
          <h2 className="font-display text-section" style={{ lineHeight: 0.92, letterSpacing: '-0.02em', marginBottom: 28 }}>
            <span style={{ color: '#F2EDE5', display: 'block' }}>ÚNETE A LA</span>
            <span style={{ color: '#5E17EB', display: 'block' }}>REBELIÓN.</span>
          </h2>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.38)', maxWidth: 460, margin: '0 auto 52px', lineHeight: 1.65 }}>
            Más de 247 artistas ya están usando IM Music para llevar su carrera al siguiente nivel.
          </p>
          <motion.button
            onClick={() => { burst({ y: 0.65 }); setTimeout(() => onNav('login'), 350); }}
            whileHover={{ scale: 1.05, boxShadow: '0 0 80px rgba(94,23,235,0.7)' }}
            whileTap={{ scale: 0.95 }}
            className="btn-primary" style={{ padding: '22px 60px', fontSize: 15 }}>
            EMPEZAR AHORA — ES GRATIS
          </motion.button>
        </motion.div>
      </section>

      {/* ════ FOOTER ════ */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '64px 24px 40px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 48, marginBottom: 56 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <IMLogo size={32} />
              <span className="font-display" style={{ fontSize: 18, color: '#F2EDE5', letterSpacing: '0.3em' }}>IM MUSIC</span>
            </div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', lineHeight: 1.7 }}>Somos tu socio de crecimiento a largo plazo. Neurociencia + IA + Estrategia.</p>
          </div>
          {[
            { title: 'Plataforma', links: ['Dashboard', 'Catálogo', 'Regalías', 'Marketing IA'] },
            { title: 'Empresa', links: ['Nosotros', 'Servicios', 'Planes', 'Contacto'] },
            { title: 'Legal', links: ['Términos', 'Privacidad', 'Cookies'] },
          ].map((col, i) => (
            <div key={i}>
              <div className="font-display" style={{ fontSize: 12, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginBottom: 20 }}>{col.title}</div>
              {col.links.map(l => <button key={l} className="footer-link">{l}</button>)}
            </div>
          ))}
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.18)', letterSpacing: '0.08em' }}>© {new Date().getFullYear()} IM Music — Intelligent Markets. Todos los derechos reservados.</p>
          <div className="flex items-center gap-2">
            <div className="live-dot" />
            <span style={{ fontSize: 10, color: '#4ade80', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Sistema Activo</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

// ============================================================
// LOGIN PAGE
// ============================================================
const LoginPage = ({ onLogin }: { onLogin: (u: User, t: string) => void }) => {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !pass) { setError('Completa todos los campos.'); return; }
    setLoading(true); setError('');
    try {
      const d = await api.post('/auth/login', { email, password: pass });
      if (d.token && d.user) { localStorage.setItem('im_token', d.token); onLogin(d.user, d.token); }
      else setError(d.error || 'Credenciales inválidas.');
    } catch { setError('No se pudo conectar. Verifica tus credenciales.'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative', overflow: 'hidden' }}>
      <ParticleField />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 70% at 50% 50%, rgba(94,23,235,0.13) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 1 }} />
      <motion.div initial={{ opacity: 0, y: 40, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.5 }}
        style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: 440 }}>
        <div style={{ textAlign: 'center', marginBottom: 44 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 16 }}>
            <IMLogo size={46} />
            <div>
              <div className="font-display" style={{ fontSize: 26, color: '#F2EDE5', letterSpacing: '0.3em', lineHeight: 1 }}>IM</div>
              <div style={{ fontSize: 9, color: '#5E17EB', letterSpacing: '0.5em', textTransform: 'uppercase', fontWeight: 700 }}>MUSIC</div>
            </div>
          </div>
          <h1 className="font-display" style={{ fontSize: 34, color: '#F2EDE5', letterSpacing: '-0.01em', marginBottom: 8 }}>BIENVENIDO DE VUELTA</h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.32)' }}>Accede a tu plataforma de crecimiento</p>
        </div>

        <form onSubmit={submit} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: 44, backdropFilter: 'blur(20px)' }}>
          {[{ label: 'Email', val: email, set: setEmail, type: 'email', ph: 'tu@email.com' },
            { label: 'Contraseña', val: pass, set: setPass, type: 'password', ph: '••••••••' }
          ].map(f => (
            <div key={f.label} style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 10 }}>{f.label}</label>
              <input type={f.type} value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph} className="input-field" />
            </div>
          ))}

          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#f87171', marginBottom: 24, marginTop: 4 }}>
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button type="submit" disabled={loading}
            whileHover={!loading ? { scale: 1.02, boxShadow: '0 0 50px rgba(94,23,235,0.55)' } : {}}
            whileTap={!loading ? { scale: 0.97 } : {}}
            className="btn-primary" style={{ width: '100%', padding: '18px', fontSize: 14, marginTop: 12 }}>
            {loading ? <span className="flex items-center gap-3"><span className="spinner spinner-sm" />ENTRANDO...</span> : 'ENTRAR A MI PLATAFORMA'}
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
  const [showModal, setShowModal] = useState(false);
  const [nt, setNt] = useState({ title: '', release_date: '', artist_id: 1 });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [t, r] = await Promise.all([api.get('/tracks'), api.get('/royalties/summary')]);
      setTracks(Array.isArray(t) ? t : []);
      setRoyalties(r || { total: 0, byPlatform: [] });
    } catch { /* keep defaults */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const addTrack = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try { await api.post('/tracks', nt); setShowModal(false); setNt({ title: '', release_date: '', artist_id: 1 }); load(); }
    catch { /* ignore */ } finally { setSaving(false); }
  };

  const statusBadge = (s: string) => {
    const m: Record<string, string> = { distributed: 'badge-green', pending: 'badge-amber', draft: 'badge-gray' };
    const l: Record<string, string> = { distributed: 'Distribuido', pending: 'Pendiente', draft: 'Borrador' };
    return <span className={`badge ${m[s] || 'badge-gray'}`}>{l[s] || s}</span>;
  };

  const maxP = Math.max(...(royalties.byPlatform?.map(p => Number(p.total)) || [1]));

  return (
    <div style={{ padding: '88px 24px 60px', maxWidth: 1100, margin: '0 auto' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 44 }}>
        <span className="label-tag" style={{ marginBottom: 14, display: 'inline-block' }}>Dashboard</span>
        <h1 className="font-display text-subsection" style={{ color: '#F2EDE5', lineHeight: 1, letterSpacing: '-0.02em' }}>
          HOLA, {user.name.toUpperCase().split(' ')[0]} ⚡
        </h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)', marginTop: 8 }}>Resumen de tu actividad musical</p>
      </motion.div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 40 }}>
        {[
          { label: 'Streams', value: '—', icon: '🎵', color: '#5E17EB' },
          { label: 'Regalías', value: loading ? '—' : `$${Number(royalties.total).toFixed(2)}`, icon: '💰', color: '#22c55e' },
          { label: 'Tracks activos', value: loading ? '—' : tracks.length.toString(), icon: '🎶', color: '#f59e0b' },
          { label: 'Plataformas', value: loading ? '—' : (royalties.byPlatform?.length || 0).toString(), icon: '🌍', color: '#60a5fa' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} className="stat-card">
            <div style={{ fontSize: 28, marginBottom: 16 }}>{s.icon}</div>
            <div className="font-display" style={{ fontSize: 32, color: s.color, lineHeight: 1, marginBottom: 8 }}>
              {loading ? <span className="skeleton" style={{ display: 'inline-block', width: 60, height: 36, borderRadius: 8 }} /> : s.value}
            </div>
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.28)', fontWeight: 700 }}>{s.label}</div>
          </motion.div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: 20 }}>
        {/* Tracks */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card" style={{ padding: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <h2 className="font-display" style={{ fontSize: 18, color: '#F2EDE5', letterSpacing: '0.05em' }}>CATÁLOGO</h2>
            <button onClick={() => setShowModal(true)} className="btn-primary" style={{ padding: '8px 18px', fontSize: 11 }}>+ NUEVO</button>
          </div>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[1, 2, 3].map(k => <div key={k} className="skeleton" style={{ height: 52, borderRadius: 12 }} />)}
            </div>
          ) : tracks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'rgba(255,255,255,0.22)', fontSize: 13 }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🎶</div>
              No hay tracks aún.
              <button onClick={() => setShowModal(true)} style={{ display: 'block', margin: '8px auto 0', background: 'none', border: 'none', color: '#5E17EB', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>+ Agrega tu primero</button>
            </div>
          ) : (
            <div>
              {tracks.slice(0, 6).map((t, i) => (
                <div key={t.id} className="track-row">
                  <div style={{ width: 34, height: 34, borderRadius: 8, background: `hsl(${250 + i * 25}, 60%, 25%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>🎵</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)' }}>{t.release_date || '—'}</div>
                  </div>
                  {statusBadge(t.status)}
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Royalties */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card" style={{ padding: 28 }}>
          <h2 className="font-display" style={{ fontSize: 18, color: '#F2EDE5', letterSpacing: '0.05em', marginBottom: 6 }}>REGALÍAS</h2>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.28)', marginBottom: 28 }}>Por plataforma</p>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {[1, 2, 3].map(k => <div key={k} className="skeleton" style={{ height: 40, borderRadius: 8 }} />)}
            </div>
          ) : royalties.byPlatform?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {royalties.byPlatform.map((p, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>{p.platform}</span>
                    <span className="font-display" style={{ fontSize: 16, color: '#F2EDE5' }}>${Number(p.total).toFixed(2)}</span>
                  </div>
                  <div className="bar-track">
                    <motion.div className="bar-fill" initial={{ width: 0 }} animate={{ width: `${(Number(p.total) / maxP) * 100}%` }} transition={{ delay: 0.6 + i * 0.1, duration: 1.2, ease: [0.23, 1, 0.32, 1] }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'rgba(255,255,255,0.22)', fontSize: 13 }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>💰</div>
              Sin datos de regalías aún.
            </div>
          )}
        </motion.div>
      </div>

      {/* Add Track Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay"
            onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 24 }}
              style={{ background: '#080808', border: '1px solid rgba(94,23,235,0.35)', borderRadius: 24, padding: 44, width: '100%', maxWidth: 440 }}>
              <h3 className="font-display" style={{ fontSize: 26, color: '#F2EDE5', marginBottom: 36, letterSpacing: '-0.01em' }}>NUEVO TRACK</h3>
              <form onSubmit={addTrack}>
                {[{ label: 'Título', val: nt.title, set: (v: string) => setNt(n => ({ ...n, title: v })), type: 'text', ph: 'Nombre del track' },
                  { label: 'Fecha de lanzamiento', val: nt.release_date, set: (v: string) => setNt(n => ({ ...n, release_date: v })), type: 'date', ph: '' }
                ].map(f => (
                  <div key={f.label} style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 10 }}>{f.label}</label>
                    <input type={f.type} value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph} className="input-field" required />
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                  <button type="button" onClick={() => setShowModal(false)} className="btn-ghost" style={{ flex: 1, padding: 16 }}>CANCELAR</button>
                  <button type="submit" disabled={saving} className="btn-primary" style={{ flex: 1, padding: 16 }}>
                    {saving ? <span className="spinner spinner-sm" /> : 'GUARDAR'}
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
  const [modal, setModal] = useState(false);
  const [nt, setNt] = useState({ title: '', release_date: '', artist_id: 1 });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try { setTracks(await api.get('/tracks').then(d => Array.isArray(d) ? d : [])); }
    catch { setTracks([]); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try { await api.post('/tracks', nt); setModal(false); setNt({ title: '', release_date: '', artist_id: 1 }); load(); }
    catch { /* ignore */ } finally { setSaving(false); }
  };

  const filtered = tracks.filter(t => t.title.toLowerCase().includes(search.toLowerCase()));
  const statusBadge = (s: string) => {
    const m: Record<string, string> = { distributed: 'badge-green', pending: 'badge-amber', draft: 'badge-gray' };
    const l: Record<string, string> = { distributed: 'Distribuido', pending: 'Pendiente', draft: 'Borrador' };
    return <span className={`badge ${m[s] || 'badge-gray'}`}>{l[s] || s}</span>;
  };

  return (
    <div style={{ padding: '88px 24px 60px', maxWidth: 1100, margin: '0 auto' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 36 }}>
        <div>
          <span className="label-tag" style={{ marginBottom: 12, display: 'inline-block' }}>Catálogo</span>
          <h1 className="font-display text-subsection" style={{ color: '#F2EDE5', lineHeight: 1, letterSpacing: '-0.02em' }}>TUS TRACKS</h1>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary" style={{ padding: '14px 28px', fontSize: 12 }}>+ NUEVO TRACK</button>
      </motion.div>

      <div style={{ marginBottom: 24 }}>
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar tracks..." className="input-field" style={{ maxWidth: 360 }} />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3, 4].map(k => <div key={k} className="skeleton" style={{ height: 52, borderRadius: 10 }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '72px 24px', color: 'rgba(255,255,255,0.22)' }}>
            <div style={{ fontSize: 44, marginBottom: 16 }}>🎶</div>
            <p style={{ fontSize: 14 }}>{search ? 'Sin resultados.' : '¡Agrega tu primer track!'}</p>
          </div>
        ) : (
          <table className="data-table">
            <thead><tr><th>#</th><th>Título</th><th>Lanzamiento</th><th>Estado</th><th>ISRC</th></tr></thead>
            <tbody>
              {filtered.map((t, i) => (
                <motion.tr key={t.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.035 }}>
                  <td style={{ color: 'rgba(255,255,255,0.18)', fontSize: 12 }}>{i + 1}</td>
                  <td style={{ fontWeight: 600, color: '#fff' }}>{t.title}</td>
                  <td>{t.release_date || '—'}</td>
                  <td>{statusBadge(t.status)}</td>
                  <td style={{ fontSize: 12, color: 'rgba(255,255,255,0.28)', fontFamily: 'monospace' }}>{t.isrc || '—'}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </motion.div>

      <AnimatePresence>
        {modal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay"
            onClick={e => { if (e.target === e.currentTarget) setModal(false); }}>
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 24 }}
              style={{ background: '#080808', border: '1px solid rgba(94,23,235,0.35)', borderRadius: 24, padding: 44, width: '100%', maxWidth: 440 }}>
              <h3 className="font-display" style={{ fontSize: 26, color: '#F2EDE5', marginBottom: 36 }}>NUEVO TRACK</h3>
              <form onSubmit={save}>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 10 }}>Título</label>
                  <input type="text" value={nt.title} onChange={e => setNt(n => ({ ...n, title: e.target.value }))} placeholder="Ej: Mi Canción" className="input-field" required />
                </div>
                <div style={{ marginBottom: 36 }}>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 10 }}>Fecha de lanzamiento</label>
                  <input type="date" value={nt.release_date} onChange={e => setNt(n => ({ ...n, release_date: e.target.value }))} className="input-field" required />
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button type="button" onClick={() => setModal(false)} className="btn-ghost" style={{ flex: 1, padding: 16 }}>CANCELAR</button>
                  <button type="submit" disabled={saving} className="btn-primary" style={{ flex: 1, padding: 16 }}>
                    {saving ? <span className="spinner spinner-sm" /> : 'GUARDAR'}
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
    api.get('/royalties/summary').then(d => setData(d || { total: 0, byPlatform: [] })).catch(() => {}).finally(() => setLoading(false));
  }, []);
  const maxP = Math.max(...(data.byPlatform?.map(p => Number(p.total)) || [1]));

  return (
    <div style={{ padding: '88px 24px 60px', maxWidth: 1100, margin: '0 auto' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 44 }}>
        <span className="label-tag" style={{ marginBottom: 14, display: 'inline-block' }}>Finanzas</span>
        <h1 className="font-display text-subsection" style={{ color: '#F2EDE5', lineHeight: 1, letterSpacing: '-0.02em' }}>REGALÍAS</h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)', marginTop: 8 }}>Ingresos por plataforma de distribución</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        style={{ textAlign: 'center', background: 'rgba(94,23,235,0.06)', border: '1px solid rgba(94,23,235,0.2)', borderRadius: 20, padding: '48px 32px', marginBottom: 24, backdropFilter: 'blur(20px)' }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.35em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)', marginBottom: 16 }}>Total acumulado</p>
        {loading
          ? <div className="skeleton" style={{ width: 180, height: 80, margin: '0 auto', borderRadius: 12 }} />
          : <div className="font-display" style={{ fontSize: 'clamp(3rem, 8vw, 6.5rem)', lineHeight: 1, color: '#5E17EB' }}>${Number(data.total).toFixed(2)}</div>}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card" style={{ padding: 32 }}>
        <h2 className="font-display" style={{ fontSize: 18, color: '#F2EDE5', letterSpacing: '0.05em', marginBottom: 32 }}>POR PLATAFORMA</h2>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {[1, 2, 3].map(k => <div key={k} className="skeleton" style={{ height: 48, borderRadius: 10 }} />)}
          </div>
        ) : data.byPlatform?.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {data.byPlatform.map((p, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.07 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{p.platform}</span>
                  <span className="font-display" style={{ fontSize: 20, color: '#F2EDE5' }}>${Number(p.total).toFixed(2)}</span>
                </div>
                <div className="bar-track">
                  <motion.div className="bar-fill" initial={{ width: 0 }} animate={{ width: `${(Number(p.total) / maxP) * 100}%` }} transition={{ delay: 0.5 + i * 0.1, duration: 1.3, ease: [0.23, 1, 0.32, 1] }} />
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '56px 0', color: 'rgba(255,255,255,0.22)', fontSize: 14 }}>
            <div style={{ fontSize: 40, marginBottom: 14 }}>💰</div>
            No hay datos de regalías disponibles aún.
          </div>
        )}
      </motion.div>
    </div>
  );
};

// ============================================================
// MARKETING / AI CHAT
// ============================================================
const MarketingPage = () => {
  const [msgs, setMsgs] = useState<ChatMsg[]>([
    { role: 'ai', content: '¡Hola! Soy tu agente de marketing con IA. Puedo ayudarte a crear estrategias, analizar tu mercado, generar ideas de contenido y mucho más. ¿Por dónde empezamos?' }
  ]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim(); if (!text || thinking) return;
    setInput('');
    setMsgs(m => [...m, { role: 'user', content: text }]);
    setThinking(true);
    try {
      const d = await api.post('/ai/chat', { message: text });
      setMsgs(m => [...m, { role: 'ai', content: d.reply || d.response || d.message || 'Respuesta recibida.' }]);
    } catch {
      setMsgs(m => [...m, { role: 'ai', content: 'Hubo un error. Verifica que el servidor esté activo e intenta de nuevo.' }]);
    } finally { setThinking(false); }
  };

  const CHIPS = ['Analiza mi mercado', 'Estrategia de lanzamiento', 'Ideas para redes sociales', 'Tendencias en mi género'];

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', paddingTop: 68 }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '20px 28px', flexShrink: 0 }}>
        <span className="label-tag" style={{ marginBottom: 8, display: 'inline-block' }}>IA</span>
        <h1 className="font-display" style={{ fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', color: '#F2EDE5', lineHeight: 1, letterSpacing: '-0.02em' }}>AGENTE MARKETING</h1>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.28)', marginTop: 5 }}>Powered by AI · Disponible 24/7</p>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 860, width: '100%', margin: '0 auto', alignSelf: 'center' }}>
        <AnimatePresence initial={false}>
          {msgs.map((m, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', gap: 10, alignItems: 'flex-end' }}>
              {m.role === 'ai' && (
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(94,23,235,0.2)', border: '1px solid rgba(94,23,235,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>⚡</div>
              )}
              <div className={`chat-bubble ${m.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}`}>{m.content}</div>
            </motion.div>
          ))}
        </AnimatePresence>

        {thinking && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(94,23,235,0.2)', border: '1px solid rgba(94,23,235,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>⚡</div>
            <div className="chat-bubble chat-bubble-ai" style={{ display: 'flex', gap: 5, alignItems: 'center', padding: '14px 18px' }}>
              {[0, 1, 2].map(j => <span key={j} style={{ width: 7, height: 7, borderRadius: '50%', background: '#5E17EB', display: 'inline-block', animation: `bounce 1s ${j * 0.2}s ease-in-out infinite` }} />)}
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Bottom area */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '16px 28px 24px', flexShrink: 0, maxWidth: 860, width: '100%', margin: '0 auto', alignSelf: 'center' }}>
        {msgs.length <= 1 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            {CHIPS.map((c, i) => (
              <button key={i} onClick={() => setInput(c)}
                style={{ background: 'rgba(94,23,235,0.08)', border: '1px solid rgba(94,23,235,0.2)', borderRadius: 8, padding: '8px 14px', fontSize: 12, color: 'rgba(255,255,255,0.55)', cursor: 'pointer', transition: 'all 0.2s', fontWeight: 500 }}
                onMouseEnter={e => { Object.assign((e.currentTarget as HTMLElement).style, { borderColor: 'rgba(94,23,235,0.5)', color: '#fff' }); }}
                onMouseLeave={e => { Object.assign((e.currentTarget as HTMLElement).style, { borderColor: 'rgba(94,23,235,0.2)', color: 'rgba(255,255,255,0.55)' }); }}>
                {c}
              </button>
            ))}
          </div>
        )}
        <form onSubmit={send} style={{ display: 'flex', gap: 12 }}>
          <input type="text" value={input} onChange={e => setInput(e.target.value)} placeholder="Pregunta algo sobre tu estrategia musical..." className="input-field" style={{ flex: 1 }} disabled={thinking} />
          <motion.button type="submit" disabled={thinking || !input.trim()} whileHover={!thinking && input.trim() ? { scale: 1.05 } : {}} whileTap={!thinking && input.trim() ? { scale: 0.95 } : {}} className="btn-primary" style={{ padding: '14px 24px', flexShrink: 0 }}>
            {thinking ? <span className="spinner spinner-sm" /> : '→'}
          </motion.button>
        </form>
      </div>
    </div>
  );
};

// ============================================================
// APP ROOT
// ============================================================
type Page = 'home' | 'login' | 'dashboard' | 'catalog' | 'royalties' | 'marketing';
const PROTECTED: Page[] = ['dashboard', 'catalog', 'royalties', 'marketing'];

export default function App() {
  const [page, setPage] = useState<Page>('home');
  const [user, setUser] = useState<User | null>(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('im_token');
    if (!token) { setBooting(false); return; }
    api.get('/auth/me')
      .then(u => { if (u?.id) setUser(u); else localStorage.removeItem('im_token'); })
      .catch(() => localStorage.removeItem('im_token'))
      .finally(() => setBooting(false));
  }, []);

  const go = useCallback((target: string) => {
    if (PROTECTED.includes(target as Page) && !user) { setPage('login'); return; }
    if (target === 'servicios' || target === 'planes') {
      setPage('home');
      setTimeout(() => document.getElementById(target)?.scrollIntoView({ behavior: 'smooth' }), 80);
      return;
    }
    setPage(target as Page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [user]);

  const onLogin = (u: User, t: string) => {
    localStorage.setItem('im_token', t);
    setUser(u);
    setPage('dashboard');
    window.scrollTo({ top: 0 });
  };

  const onLogout = () => {
    localStorage.removeItem('im_token');
    setUser(null);
    setPage('home');
    window.scrollTo({ top: 0 });
  };

  if (booting) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.8, repeat: Infinity }}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
        <IMLogo size={60} />
        <div style={{ width: 36, height: 36, border: '2px solid rgba(94,23,235,0.2)', borderTopColor: '#5E17EB', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      </motion.div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#000', color: '#fff' }}>
      <Navbar onNav={go} page={page} user={user} onLogout={onLogout} />
      <AnimatePresence mode="wait">
        <motion.div key={page} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.22 }}>
          {page === 'home' && <LandingPage onNav={go} />}
          {page === 'login' && <LoginPage onLogin={onLogin} />}
          {page === 'dashboard' && user && <DashboardPage user={user} />}
          {page === 'catalog' && user && <CatalogPage />}
          {page === 'royalties' && user && <RoyaltiesPage />}
          {page === 'marketing' && user && <MarketingPage />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
