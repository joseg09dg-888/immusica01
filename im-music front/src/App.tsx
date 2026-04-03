import React, {
  useState, useEffect, useRef, useCallback,
} from 'react';
import {
  motion, AnimatePresence,
  useScroll, useTransform,
  useMotionValue, useSpring,
} from 'motion/react';
import confetti from 'canvas-confetti';

/* ============================================================
   TYPES
============================================================ */
interface User    { id: number; name: string; email: string; role: string; }
interface Track   { id: number; title: string; release_date: string; status: string; isrc?: string; }
interface RoySum  { total: number; byPlatform: { platform: string; total: number }[]; }
interface ChatMsg { role: 'user' | 'ai'; content: string; }

/* ============================================================
   API
============================================================ */
const api = {
  get: (path: string) => {
    const t = localStorage.getItem('im_token');
    return fetch(`/api${path}`, { headers: t ? { Authorization: `Bearer ${t}` } : {} })
      .then(r => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); });
  },
  post: (path: string, body: Record<string, unknown>) => {
    const t = localStorage.getItem('im_token');
    return fetch(`/api${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) },
      body: JSON.stringify(body),
    }).then(r => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); });
  },
};

/* ============================================================
   CONFETTI
============================================================ */
const burst = (origin = { y: 0.65 }) =>
  confetti({ particleCount: 180, spread: 100, origin, colors: ['#5E17EB', '#7B3FFF', '#F2EDE5', '#9B6EFF', '#fff', '#2D0B6B'] });

/* ============================================================
   HOOKS
============================================================ */
// Animated counter that triggers on first mount
const useCounter = (target: number, duration = 2200) => {
  const [v, setV] = useState(0);
  useEffect(() => {
    const s = Date.now();
    const tick = () => {
      const p = Math.min((Date.now() - s) / duration, 1);
      const e = 1 - Math.pow(1 - p, 4); // quartic ease-out
      setV(Math.floor(target * e));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return v;
};

// 3D card tilt
const useTilt = () => {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width  - 0.5) * 18;
    const y = ((e.clientY - r.top)  / r.height - 0.5) * -18;
    el.style.transform = `perspective(1000px) rotateX(${y}deg) rotateY(${x}deg) translateY(-12px) scale(1.02)`;
    el.style.boxShadow = '0 32px 72px rgba(94,23,235,0.38)';
    el.style.borderColor = 'rgba(94,23,235,0.45)';
  };
  const onLeave = () => {
    const el = ref.current; if (!el) return;
    el.style.transform = el.style.boxShadow = el.style.borderColor = '';
  };
  return { ref, onMove, onLeave };
};

// Text scramble
const CHARS = '!<>-_\\/[]{}—=+*^?#@$%';
const useScramble = (text: string, delay = 400) => {
  const [out, setOut] = useState(text);
  useEffect(() => {
    let frame = 0;
    const total = 18;
    const id = setTimeout(() => {
      const tick = () => {
        frame++;
        const p = frame / total;
        setOut(text.split('').map((ch, i) => {
          if (ch === ' ') return ' ';
          if (i / text.length < p) return ch;
          return CHARS[Math.floor(Math.random() * CHARS.length)];
        }).join(''));
        if (frame < total) requestAnimationFrame(tick);
        else setOut(text);
      };
      requestAnimationFrame(tick);
    }, delay);
    return () => clearTimeout(id);
  }, [text, delay]);
  return out;
};

/* ============================================================
   LOGO
============================================================ */
const IMLogo = ({ size = 44 }: { size?: number }) => (
  <svg width={size} height={size * 0.75} viewBox="0 0 120 90" fill="none">
    <path d="M8 10C8 10 18 8 22 45C26 82 36 80 36 80C36 80 26 78 22 45C18 12 8 10 8 10Z" fill="#5E17EB"/>
    <path d="M36 80C36 80 46 82 50 45C54 8 60 10 60 10C60 10 66 8 70 45C74 82 84 80 84 80Z" fill="#5E17EB"/>
    <path d="M84 80C84 80 94 78 98 45C102 12 112 10 112 10C112 10 102 8 98 45C94 82 84 80 84 80Z" fill="#5E17EB"/>
    <path d="M8 10L36 10L36 24L22 24Z" fill="#5E17EB" opacity="0.35"/>
    <path d="M84 10L112 10L98 24L84 24Z" fill="#5E17EB" opacity="0.35"/>
  </svg>
);

/* ============================================================
   INLINE SVG ICONS
============================================================ */
const IconDist = () => (
  <svg width="44" height="44" viewBox="0 0 44 44" fill="none" stroke="#5E17EB" strokeWidth="1.5" strokeLinecap="round">
    <circle cx="22" cy="22" r="17" strokeOpacity="0.18"/>
    <path d="M22 8v24M14 18l8-8 8 8"/>
    <path d="M10 31c3 3 7 5 12 5s9-2 12-5" strokeOpacity="0.5"/>
    <path d="M7 25c3 5 9 9 15 9s12-4 15-9" strokeOpacity="0.28"/>
  </svg>
);
const IconMarketing = () => (
  <svg width="44" height="44" viewBox="0 0 44 44" fill="none" stroke="#5E17EB" strokeWidth="1.5" strokeLinecap="round">
    <path d="M22 7c-8.3 0-15 6.7-15 15 0 4.2 1.7 8 4.4 10.7L10 37l4.5-1.6A15 15 0 1 0 22 7z"/>
    <path d="M15 22h14M22 15v14"/>
    <circle cx="22" cy="22" r="2.5" fill="#5E17EB" fillOpacity="0.28" stroke="none"/>
  </svg>
);
const IconAI = () => (
  <svg width="44" height="44" viewBox="0 0 44 44" fill="none" stroke="#5E17EB" strokeWidth="1.5" strokeLinecap="round">
    <rect x="10" y="12" width="24" height="20" rx="4"/>
    <circle cx="17" cy="20" r="2.5"/><circle cx="27" cy="20" r="2.5"/>
    <path d="M17 27s1.5 2 5 2 5-2 5-2"/>
    <path d="M16 12V8M28 12V8M8 22H4M40 22h-4"/>
  </svg>
);
const IconRoy = () => (
  <svg width="44" height="44" viewBox="0 0 44 44" fill="none" stroke="#5E17EB" strokeWidth="1.5" strokeLinecap="round">
    <circle cx="22" cy="22" r="15"/>
    <path d="M22 13v18M18 17h6a4 4 0 0 1 0 8h-6a4 4 0 0 0 0 8h8"/>
  </svg>
);
const IconVideo = () => (
  <svg width="44" height="44" viewBox="0 0 44 44" fill="none" stroke="#5E17EB" strokeWidth="1.5" strokeLinecap="round">
    <rect x="4" y="12" width="24" height="20" rx="3"/>
    <path d="M28 17l12-6v22l-12-6V17z"/>
  </svg>
);
const IconFin = () => (
  <svg width="44" height="44" viewBox="0 0 44 44" fill="none" stroke="#5E17EB" strokeWidth="1.5" strokeLinecap="round">
    <polyline points="4,34 14,22 22,28 34,10 40,10"/>
    <polyline points="34,10 40,10 40,16"/>
    <circle cx="14" cy="22" r="2.5" fill="#5E17EB" fillOpacity="0.28" stroke="none"/>
    <circle cx="22" cy="28" r="2.5" fill="#5E17EB" fillOpacity="0.28" stroke="none"/>
  </svg>
);

/* ============================================================
   PARTICLE FIELD — mouse repulsion (Lusion-inspired)
============================================================ */
const ParticleField = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current; if (!cv) return;
    const ctx = cv.getContext('2d'); if (!ctx) return;
    let W = cv.width = window.innerWidth;
    let H = cv.height = window.innerHeight;
    const cols = ['#5E17EB','#7B3FFF','#9B6EFF','#F2EDE5','#2D0B6B'];
    const pts = Array.from({ length: 95 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.55, vy: (Math.random() - 0.5) * 0.55,
      r: Math.random() * 2.2 + 0.6,
      op: Math.random() * 0.55 + 0.1,
      col: cols[Math.floor(Math.random() * cols.length)],
    }));
    let mx = -9999, my = -9999;
    const onMM = (e: MouseEvent) => { mx = e.clientX; my = e.clientY; };
    const onR  = () => { W = cv.width = window.innerWidth; H = cv.height = window.innerHeight; };
    window.addEventListener('mousemove', onMM);
    window.addEventListener('resize', onR);
    let raf: number;
    const tick = () => {
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        const dx = p.x - mx, dy = p.y - my;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 150) {
          const f = ((150 - d) / 150) * 0.4;
          p.vx += (dx / d) * f; p.vy += (dy / d) * f;
        }
        const spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (spd > 2.8) { p.vx = (p.vx / spd) * 2.8; p.vy = (p.vy / spd) * 2.8; }
        p.vx *= 0.98; p.vy *= 0.98;
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) { p.x = 0; p.vx *= -1; }
        if (p.x > W) { p.x = W; p.vx *= -1; }
        if (p.y < 0) { p.y = 0; p.vy *= -1; }
        if (p.y > H) { p.y = H; p.vy *= -1; }
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.col; ctx.globalAlpha = p.op; ctx.fill();
        for (let j = i + 1; j < pts.length; j++) {
          const q = pts[j];
          const dx2 = p.x - q.x, dy2 = p.y - q.y;
          const d2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
          if (d2 < 140) {
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = '#5E17EB';
            ctx.globalAlpha = (1 - d2 / 140) * 0.1;
            ctx.lineWidth = 0.5; ctx.stroke();
          }
        }
        ctx.globalAlpha = 1;
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('mousemove', onMM); window.removeEventListener('resize', onR); };
  }, []);
  return <canvas ref={ref} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }} />;
};

/* ============================================================
   CURSOR SPOTLIGHT — Lusion technique
============================================================ */
const Spotlight = () => {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const fn = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', fn);
    return () => window.removeEventListener('mousemove', fn);
  }, []);
  return (
    <div style={{
      position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 2,
      background: `radial-gradient(700px circle at ${pos.x}px ${pos.y}px, rgba(94,23,235,0.07) 0%, transparent 65%)`,
      transition: 'background 0.12s ease',
    }} />
  );
};

/* ============================================================
   FLOATING ORBS — CSS only, zero JS
============================================================ */
const Orbs = () => (
  <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1, overflow: 'hidden' }}>
    {[
      { l:'4%',   t:'12%',  s:420, c:'rgba(94,23,235,0.17)',  anim:'floatA 13s ease-in-out infinite' },
      { l:'68%',  t:'6%',   s:280, c:'rgba(123,63,255,0.13)', anim:'floatB 18s ease-in-out infinite' },
      { l:'75%',  t:'55%',  s:340, c:'rgba(94,23,235,0.11)',  anim:'floatC 10s ease-in-out infinite' },
      { l:'28%',  t:'72%',  s:210, c:'rgba(45,11,107,0.22)',  anim:'floatA 20s ease-in-out infinite 4s' },
    ].map((o, i) => (
      <div key={i} style={{
        position: 'absolute', left: o.l, top: o.t, width: o.s, height: o.s, borderRadius: '50%',
        background: `radial-gradient(circle, ${o.c} 0%, transparent 70%)`,
        filter: 'blur(55px)', animation: o.anim,
      }} />
    ))}
  </div>
);

/* ============================================================
   SOUND WAVE — music platform signature
============================================================ */
const SoundWave = ({ color = '#5E17EB' }: { color?: string }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 3, height: 50 }}>
    {[1,2,3,4,5,6,7].map(i => (
      <div key={i} className="eq-bar" style={{ background: color }} />
    ))}
  </div>
);

/* ============================================================
   MAGNETIC BUTTON WRAPPER — dopamine magnetic pull
============================================================ */
const Magnetic = ({ children }: { children: React.ReactNode }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 180, damping: 18 });
  const sy = useSpring(y, { stiffness: 180, damping: 18 });
  const ref = useRef<HTMLDivElement>(null);
  const onMM = (e: React.MouseEvent) => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width  / 2)) * 0.38);
    y.set((e.clientY - (r.top  + r.height / 2)) * 0.38);
  };
  const onML = () => { x.set(0); y.set(0); };
  return (
    <motion.div ref={ref} style={{ x: sx, y: sy, display: 'inline-block' }} onMouseMove={onMM} onMouseLeave={onML}>
      {children}
    </motion.div>
  );
};

/* ============================================================
   3D PUSH BUTTON (Josh W. Comeau technique)
============================================================ */
const Btn3D = ({
  children, onClick, size = 'md',
}: { children: React.ReactNode; onClick?: () => void; size?: 'sm' | 'md' | 'lg'; }) => {
  const [down, setDown] = useState(false);
  const pad = { sm: '14px 32px', md: '20px 52px', lg: '22px 64px' }[size];
  const fs  = { sm: '13px', md: '15px', lg: '16px' }[size];
  return (
    <button className={`btn-3d${size === 'sm' ? ' btn-3d-sm' : ''}`}
      onClick={onClick}
      onMouseDown={() => setDown(true)}
      onMouseUp={() => setDown(false)}
      onMouseLeave={() => setDown(false)}
      onTouchStart={() => setDown(true)}
      onTouchEnd={() => setDown(false)}
    >
      <span className="btn-3d-edge" style={{ transform: down ? 'translateY(1px)' : 'translateY(4px)' }} />
      <span className="btn-3d-front" style={{
        padding: pad, fontSize: fs,
        transform: down ? 'translateY(-1px)' : 'translateY(-4px)',
        background: down ? '#4A0FBF' : '#5E17EB',
        boxShadow: down ? '0 0 18px rgba(94,23,235,0.25)' : '0 0 40px rgba(94,23,235,0.38), inset 0 1px 0 rgba(255,255,255,0.2)',
        transition: down ? 'transform 0.06s ease, background 0.06s' : 'transform 0.22s cubic-bezier(0.3,0.7,0.4,1.5), background 0.15s, box-shadow 0.15s',
      }}>
        {children}
      </span>
    </button>
  );
};

/* ============================================================
   SPOTLIGHT SERVICE CARD
============================================================ */
const SpotCard = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 50, y: 50, on: false });
  return (
    <div ref={ref}
      className="service-card"
      onMouseMove={e => {
        const r = ref.current!.getBoundingClientRect();
        setPos({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100, on: true });
      }}
      onMouseLeave={() => setPos(p => ({ ...p, on: false }))}
      style={{
        ...style,
        background: pos.on
          ? `radial-gradient(circle at ${pos.x}% ${pos.y}%, rgba(94,23,235,0.22) 0%, rgba(255,255,255,0.03) 55%)`
          : 'rgba(255,255,255,0.03)',
      }}
    >
      {children}
    </div>
  );
};

/* ============================================================
   NAVBAR
============================================================ */
const Navbar = ({ onNav, page, user, onLogout }: {
  onNav: (p: string) => void; page: string; user: User | null; onLogout: () => void;
}) => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);
  const pubLinks  = [{ id: 'home', l: 'Inicio' }, { id: 'servicios', l: 'Servicios' }, { id: 'planes', l: 'Planes' }];
  const dashLinks = [{ id: 'dashboard', l: 'Dashboard' }, { id: 'catalog', l: 'Catálogo' }, { id: 'royalties', l: 'Regalías' }, { id: 'marketing', l: 'IA' }];
  const links = user ? dashLinks : pubLinks;
  return (
    <nav className={`navbar${scrolled ? ' navbar-scrolled' : ''}`}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', height: 70, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <motion.button onClick={() => onNav('home')} whileHover={{ scale: 1.04 }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
          <IMLogo size={38} />
          <div>
            <div className="font-display" style={{ fontSize: 20, color: '#F2EDE5', letterSpacing: '0.35em', lineHeight: 1 }}>IM</div>
            <div style={{ fontSize: 9, color: '#5E17EB', letterSpacing: '0.55em', textTransform: 'uppercase', fontWeight: 700 }}>MUSIC</div>
          </div>
        </motion.button>

        <div className="hidden md:flex items-center gap-8">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: 0.75 }}>
            <div className="live-dot" />
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#4ade80' }}>LIVE</span>
          </div>
          {links.map(l => (
            <button key={l.id} onClick={() => onNav(l.id)} className={`nav-link${page === l.id ? ' active' : ''}`}>{l.l}</button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
              <button onClick={() => onNav('login')} className="nav-link hidden md:block" style={{ paddingLeft: 4, paddingRight: 4 }}>Entrar</button>
              <Magnetic>
                <button onClick={() => onNav('login')} className="btn-primary" style={{ padding: '10px 22px', fontSize: 11 }}>Empezar</button>
              </Magnetic>
            </>
          )}
          <button onClick={() => setOpen(!open)} className="md:hidden"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, display: 'flex', flexDirection: 'column', gap: 5 }}>
            <span style={{ width: 22, height: 2, background: '#fff', borderRadius: 2, display: 'block', transition: 'all 0.3s', transform: open ? 'rotate(45deg) translateY(7px)' : 'none' }} />
            <span style={{ width: 22, height: 2, background: '#fff', borderRadius: 2, display: 'block', transition: 'all 0.3s', opacity: open ? 0 : 1 }} />
            <span style={{ width: 22, height: 2, background: '#fff', borderRadius: 2, display: 'block', transition: 'all 0.3s', transform: open ? 'rotate(-45deg) translateY(-7px)' : 'none' }} />
          </button>
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            style={{ background: 'rgba(0,0,0,0.97)', backdropFilter: 'blur(28px)', borderBottom: '1px solid rgba(94,23,235,0.2)', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {links.map(l => (
              <button key={l.id} onClick={() => { onNav(l.id); setOpen(false); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'Anton', fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.2em', color: page === l.id ? '#5E17EB' : 'rgba(255,255,255,0.55)', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                {l.l}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

/* ============================================================
   LANDING PAGE
============================================================ */
const LandingPage = ({ onNav }: { onNav: (p: string) => void }) => {
  const { scrollY } = useScroll();
  const hy  = useTransform(scrollY, [0, 500], [0, -130]);
  const hop = useTransform(scrollY, [0, 420], [1, 0]);

  const a247 = useCounter(247);
  const a850 = useCounter(850);
  const a32  = useCounter(32);

  const [showSticky, setShowSticky] = useState(false);
  useEffect(() => {
    const fn = () => setShowSticky(window.scrollY > window.innerHeight * 0.85);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const label = useScramble('PLATAFORMA ELITE — ARTISTAS REALES');

  const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.12, delayChildren: 0.25 } } };
  const wrd     = { hidden: { y: 90, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { duration: 0.8, ease: [0.23, 1, 0.32, 1] as number[] } } };

  const SVCS = [
    { Icon: IconDist,      title: 'Distribución Digital',   desc: 'Tu música en Spotify, Apple Music, Tidal, Amazon y 150+ plataformas globales. ISRC y UPC sin costo adicional.' },
    { Icon: IconMarketing, title: 'Marketing con IA',        desc: 'Estrategias hiperpersonalizadas basadas en neurociencia y datos reales de comportamiento de tu audiencia.' },
    { Icon: IconAI,        title: 'Agentes Inteligentes',    desc: 'Gemini AI trabajando 24/7 en tu branding, pitch decks, análisis de tendencias y plan de crecimiento.' },
    { Icon: IconRoy,       title: 'Gestión de Regalías',     desc: 'Master y publishing administrados. Splits automáticos, reportes en tiempo real y pagos puntuales.' },
    { Icon: IconVideo,     title: 'Producción Visual',       desc: 'Videos musicales, reels y contenido de talla mundial. Postproducción y colorización profesional.' },
    { Icon: IconFin,       title: 'Financiamiento',          desc: 'Adelantos sobre regalías futuras sin ceder tus masters. Crece sin sacrificar tu independencia.' },
  ];

  const PLANS = [
    {
      name: 'BÁSICO', price: '$79.000', unit: 'COP / mes', feat: false,
      desc: 'El punto de partida para artistas que quieren ser escuchados.',
      items: ['Distribución 50+ plataformas', 'ISRC y UPC incluidos', '1 artista registrado', '5 tracks activos', 'Dashboard básico', 'Soporte email'],
    },
    {
      name: 'PRO', price: '$590.000', unit: 'COP / mes', feat: true,
      desc: 'Para artistas que van en serio con su carrera musical.',
      items: ['Distribución 150+ plataformas', '3 artistas registrados', 'Tracks ilimitados', 'Agente Marketing IA', 'Branding + Arquetipo', 'Plan 30 días contenido', 'Pitch playlists', 'Reporting avanzado', 'Soporte 24/7'],
    },
    {
      name: 'ELITE 360', price: '$11.900.000', unit: 'COP / mes', feat: false,
      desc: 'El arsenal completo para dominar la industria musical.',
      items: ['Todo en Pro', 'Artistas ilimitados', 'Investigación cultural', 'Marketing 360° gestionado', 'FB Ads con presupuesto', 'Asesoría legal IA', 'Financiamiento disponible', 'Manager virtual IA dedicado'],
    },
  ];

  const ARTISTS = [
    { n: 'Luna Rivera',  g: 'Urbano Latino',     s: '12M', c: '#5E17EB' },
    { n: 'El Profeta',   g: 'Reggaeton',          s: '45M', c: '#7B3FFF' },
    { n: 'Kíara Sol',    g: 'Pop Alternativo',    s: '8M',  c: '#2D0B6B' },
    { n: 'DJ Cipher',    g: 'Electronic',         s: '22M', c: '#5E17EB' },
    { n: 'Valeria M.',   g: 'R&B Soul',           s: '6M',  c: '#7B3FFF' },
    { n: 'Trío Norte',   g: 'Cumbia Fusión',      s: '31M', c: '#2D0B6B' },
    { n: 'Axel Dark',    g: 'Metal Alternativo',  s: '9M',  c: '#5E17EB' },
    { n: 'Sandra Vibe',  g: 'Afrobeats',          s: '17M', c: '#7B3FFF' },
  ];

  // tilt hooks for each service card
  const tilts = [useTilt(), useTilt(), useTilt(), useTilt(), useTilt(), useTilt()];

  return (
    <div style={{ background: '#000' }}>
      <Spotlight />

      {/* ════ HERO ════ */}
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
        <ParticleField />
        <Orbs />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 85% 65% at 50% -10%, rgba(94,23,235,0.22) 0%, transparent 65%)', zIndex: 2, pointerEvents: 'none' }} />

        <motion.div style={{ y: hy, opacity: hop, position: 'relative', zIndex: 10, textAlign: 'center', padding: '0 24px', maxWidth: 1080, margin: '0 auto' }}>

          {/* Sound wave + badge */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 36 }}>
            <SoundWave />
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'rgba(94,23,235,0.1)', border: '1px solid rgba(94,23,235,0.3)', borderRadius: 100, padding: '9px 20px' }}>
              <div className="live-dot" />
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#5E17EB' }}>{label}</span>
            </div>
            <SoundWave color="#7B3FFF" />
          </motion.div>

          {/* Headline — staggered word reveal */}
          <motion.div variants={stagger} initial="hidden" animate="visible"
            className="font-display text-hero"
            style={{ lineHeight: 0.88, letterSpacing: '-0.02em', marginBottom: 38 }}>
            <div style={{ overflow: 'hidden' }}>
              <motion.span variants={wrd} style={{ display: 'inline-block', color: '#F2EDE5', marginRight: '0.2em' }}>SOMOS</motion.span>
              <motion.span variants={wrd} style={{ display: 'inline-block', color: '#F2EDE5' }}>TU</motion.span>
            </div>
            <div style={{ overflow: 'hidden' }}>
              <motion.span variants={wrd} style={{ display: 'inline-block', color: '#5E17EB', marginRight: '0.2em',
                textShadow: '0 0 40px rgba(94,23,235,0.7), 0 0 80px rgba(94,23,235,0.35)' }}>SOCIO</motion.span>
              <motion.span variants={wrd} style={{ display: 'inline-block', color: '#5E17EB',
                textShadow: '0 0 40px rgba(94,23,235,0.7), 0 0 80px rgba(94,23,235,0.35)' }}>DE</motion.span>
            </div>
            <div style={{ overflow: 'hidden' }}>
              <motion.span variants={wrd} style={{ display: 'inline-block', color: '#F2EDE5' }}>CRECIMIENTO.</motion.span>
            </div>
          </motion.div>

          <motion.p initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.95 }}
            style={{ fontSize: 18, color: 'rgba(255,255,255,0.4)', maxWidth: 540, margin: '0 auto 56px', fontWeight: 400, lineHeight: 1.7 }}>
            Distribución global + Neurociencia + IA aplicada a tu carrera musical.
          </motion.p>

          {/* CTAs — 3D push button + magnetic ghost */}
          <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }}
            style={{ display: 'flex', flexWrap: 'wrap', gap: 18, justifyContent: 'center', alignItems: 'center' }}>
            <Magnetic>
              <Btn3D size="lg" onClick={() => { burst({ y: 0.78 }); setTimeout(() => onNav('login'), 320); }}>
                COMIENZA TU REBELIÓN
              </Btn3D>
            </Magnetic>
            <Magnetic>
              <button className="btn-ghost" style={{ padding: '22px 44px', fontSize: 14 }}
                onClick={() => document.getElementById('servicios')?.scrollIntoView({ behavior: 'smooth' })}>
                VER CÓMO FUNCIONA
              </button>
            </Magnetic>
          </motion.div>

          {/* Animated stat counters */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 32, maxWidth: 500, margin: '72px auto 0' }}>
            {[{ v: `${a247}+`, l: 'Artistas Activos' }, { v: `${a850}M+`, l: 'Streams Generados' }, { v: `${a32}`, l: 'Países Alcanzados' }].map((s, i) => (
              <motion.div key={i} whileHover={{ scale: 1.1 }} style={{ textAlign: 'center', cursor: 'default' }}>
                <div className="font-display" style={{ fontSize: 40, color: '#5E17EB', lineHeight: 1, textShadow: '0 0 30px rgba(94,23,235,0.5)' }}>{s.v}</div>
                <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.25)', marginTop: 8, fontWeight: 700 }}>{s.l}</div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        <motion.div animate={{ y: [0, 11, 0] }} transition={{ duration: 1.9, repeat: Infinity }}
          style={{ position: 'absolute', bottom: 44, left: '50%', transform: 'translateX(-50%)', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.35em', color: 'rgba(255,255,255,0.15)', fontWeight: 700 }}>Scroll</span>
          <div className="scroll-line" />
        </motion.div>
      </section>

      {/* ════ MARQUEE ════ */}
      <div style={{ background: '#5E17EB', height: 58, overflow: 'hidden', display: 'flex', alignItems: 'center', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'flex', whiteSpace: 'nowrap', animation: 'marquee 22s linear infinite' }}>
          {Array(8).fill(null).map((_, i) => (
            <span key={i} className="font-display" style={{ fontSize: 21, fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#000', padding: '0 44px', flexShrink: 0 }}>
              IM MUSIC ★ 247 ARTISTAS ACTIVOS ★ 850M STREAMS ★ REBELIÓN MUSICAL ★ NEUROCIENCIA APLICADA ★
            </span>
          ))}
        </div>
      </div>

      {/* ════ SERVICIOS ════ */}
      <section id="servicios" style={{ padding: '128px 24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 65% 55% at 50% 50%, rgba(94,23,235,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: 84 }}>
            <span className="label-tag">Lo que hacemos</span>
            <h2 className="font-display text-section" style={{ lineHeight: 0.9, letterSpacing: '-0.02em', marginTop: 22 }}>
              <span style={{ display: 'block', color: '#F2EDE5' }}>SERVICIOS</span>
              <span style={{ display: 'block', color: '#5E17EB', textShadow: '0 0 50px rgba(94,23,235,0.5)' }}>DE ÉLITE</span>
            </h2>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
            {SVCS.map((s, i) => {
              const t = tilts[i];
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}>
                  <div ref={t.ref} onMouseMove={t.onMove} onMouseLeave={t.onLeave}
                    style={{ transition: 'transform 0.35s cubic-bezier(0.23,1,0.32,1), box-shadow 0.35s ease, border-color 0.35s ease', height: '100%' }}>
                    <SpotCard style={{ height: '100%' }}>
                      <div style={{ marginBottom: 24 }}><s.Icon /></div>
                      <h3 className="font-display" style={{ fontSize: 22, color: '#F2EDE5', marginBottom: 14 }}>{s.title}</h3>
                      <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.38)', lineHeight: 1.72 }}>{s.desc}</p>
                    </SpotCard>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ════ STATS BAR ════ */}
      <section style={{ background: 'rgba(94,23,235,0.05)', borderTop: '1px solid rgba(94,23,235,0.14)', borderBottom: '1px solid rgba(94,23,235,0.14)', padding: '64px 24px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 48, textAlign: 'center' }}>
          {[{ v:'850M+', l:'Streams totales' }, { v:'247+', l:'Artistas activos' }, { v:'150+', l:'Plataformas' }, { v:'32', l:'Países' }].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
              <div className="font-display" style={{ fontSize: 'clamp(2.5rem,5vw,4rem)', color: '#5E17EB', lineHeight: 1, marginBottom: 10, textShadow: '0 0 30px rgba(94,23,235,0.45)' }}>{s.v}</div>
              <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.25em', color: 'rgba(255,255,255,0.28)', fontWeight: 700 }}>{s.l}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ════ PLANES ════ */}
      <section id="planes" style={{ padding: '128px 24px', position: 'relative' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: 84 }}>
            <span className="label-tag">Precios</span>
            <h2 className="font-display text-section" style={{ lineHeight: 0.9, letterSpacing: '-0.02em', marginTop: 22 }}>
              <span style={{ display: 'block', color: '#F2EDE5' }}>ELIGE TU</span>
              <span style={{ display: 'block', color: '#5E17EB', textShadow: '0 0 50px rgba(94,23,235,0.5)' }}>NIVEL</span>
            </h2>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.32)', marginTop: 22, maxWidth: 440, margin: '22px auto 0' }}>Sin contratos. Sin letra pequeña. Cancela cuando quieras.</p>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 24 }}>
            {PLANS.map((plan, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 44 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                style={{ position: 'relative', isolation: 'isolate' }}>
                <div className={`plan-card${plan.feat ? ' plan-card-featured' : ''}`}>
                  {plan.feat && (
                    <div style={{ position: 'absolute', top: -1, left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}>
                      <span className="font-display" style={{ display: 'block', background: '#5E17EB', color: '#fff', fontSize: 10, letterSpacing: '0.25em', padding: '7px 22px', borderRadius: '0 0 12px 12px', whiteSpace: 'nowrap' }}>★ MÁS POPULAR</span>
                    </div>
                  )}
                  <div style={{ marginBottom: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.32em', textTransform: 'uppercase', color: plan.feat ? '#5E17EB' : 'rgba(255,255,255,0.28)' }}>{plan.name}</span>
                  </div>
                  <div style={{ marginBottom: 6 }}>
                    <span className="font-display" style={{ fontSize: 30, color: '#F2EDE5', lineHeight: 1 }}>{plan.price}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 28 }}>{plan.unit}</div>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.38)', marginBottom: 32, lineHeight: 1.58 }}>{plan.desc}</p>
                  <div style={{ flex: 1, marginBottom: 36 }}>
                    {plan.items.map((f, j) => (
                      <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
                        <span style={{ width: 18, height: 18, borderRadius: '50%', background: plan.feat ? 'rgba(94,23,235,0.22)' : 'rgba(255,255,255,0.05)', border: `1px solid ${plan.feat ? 'rgba(94,23,235,0.5)' : 'rgba(255,255,255,0.1)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: plan.feat ? '#7B3FFF' : 'rgba(255,255,255,0.4)', flexShrink: 0, marginTop: 2 }}>✓</span>
                        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.62)', lineHeight: 1.5 }}>{f}</span>
                      </div>
                    ))}
                  </div>
                  {plan.feat ? (
                    /* Rotating conic gradient CTA button */
                    <div className="btn-conic-wrap" onClick={() => { burst({ y: 0.68 }); setTimeout(() => onNav('login'), 340); }}>
                      <button className="btn-conic-inner" style={{ width: '100%', justifyContent: 'center' }}>ELEGIR PRO ★</button>
                    </div>
                  ) : (
                    <button className={i === 0 ? 'btn-plan-ghost' : 'btn-plan-primary'}
                      onClick={() => { burst({ y: 0.68 }); setTimeout(() => onNav('login'), 340); }}>
                      {i === 0 ? 'COMENZAR' : 'HABLAR CON UN EXPERTO'}
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════ ARTISTS STRIP ════ */}
      <section style={{ padding: '80px 0', overflow: 'hidden', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: 52, padding: '0 24px' }}>
          <h2 className="font-display" style={{ fontSize: 'clamp(1rem,2.5vw,1.6rem)', color: 'rgba(255,255,255,0.22)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            Artistas que han confiado en nosotros
          </h2>
        </motion.div>
        <div style={{ overflow: 'hidden', maskImage: 'linear-gradient(to right,transparent 0%,black 8%,black 92%,transparent 100%)' }}>
          <div style={{ display: 'flex', gap: 16, animation: 'marquee 30s linear infinite', flexShrink: 0 }}>
            {[...ARTISTS, ...ARTISTS].map((a, i) => (
              <div key={i} className="artist-card">
                <div className="artist-avatar" style={{ background: `linear-gradient(135deg, ${a.c}33, ${a.c}11)`, border: `2px solid ${a.c}55` }}>
                  <span style={{ color: a.c }}>{a.n[0]}</span>
                </div>
                <div style={{ fontFamily: 'Anton', fontSize: 14, color: '#F2EDE5', marginBottom: 4 }}>{a.n}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.32)', marginBottom: 8 }}>{a.g}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#5E17EB' }}>{a.s} streams</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════ FINAL CTA ════ */}
      <section style={{ padding: '128px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 65% 80% at 50% 50%, rgba(94,23,235,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <motion.div initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ position: 'relative', zIndex: 1 }}>
          <h2 className="font-display text-section" style={{ lineHeight: 0.9, letterSpacing: '-0.02em', marginBottom: 28 }}>
            <span style={{ display: 'block', color: '#F2EDE5' }}>ÚNETE A LA</span>
            <span style={{ display: 'block', color: '#5E17EB', textShadow: '0 0 60px rgba(94,23,235,0.65)' }}>REBELIÓN.</span>
          </h2>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.36)', maxWidth: 460, margin: '0 auto 56px', lineHeight: 1.68 }}>
            Más de 247 artistas ya están usando IM Music para llevar su carrera al siguiente nivel.
          </p>
          <Magnetic>
            <Btn3D size="lg" onClick={() => { burst({ y: 0.62 }); setTimeout(() => onNav('login'), 340); }}>
              EMPEZAR AHORA — ES GRATIS
            </Btn3D>
          </Magnetic>
        </motion.div>
      </section>

      {/* ════ FOOTER ════ */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '64px 24px 40px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 48, marginBottom: 52 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
              <IMLogo size={32} /><span className="font-display" style={{ fontSize: 18, color: '#F2EDE5', letterSpacing: '0.3em' }}>IM MUSIC</span>
            </div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.28)', lineHeight: 1.75 }}>Somos tu socio de crecimiento a largo plazo.<br />Neurociencia + IA + Estrategia.</p>
          </div>
          {[
            { title: 'Plataforma', links: ['Dashboard', 'Catálogo', 'Regalías', 'Marketing IA'] },
            { title: 'Empresa',   links: ['Nosotros', 'Servicios', 'Planes', 'Contacto'] },
            { title: 'Legal',     links: ['Términos', 'Privacidad', 'Cookies'] },
          ].map((col, i) => (
            <div key={i}>
              <div className="font-display" style={{ fontSize: 12, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.22)', marginBottom: 22 }}>{col.title}</div>
              {col.links.map(l => <button key={l} className="footer-link">{l}</button>)}
            </div>
          ))}
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.16)', letterSpacing: '0.08em' }}>© {new Date().getFullYear()} IM Music — Intelligent Markets. Todos los derechos reservados.</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="live-dot" />
            <span style={{ fontSize: 10, color: '#4ade80', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase' }}>Sistema Activo</span>
          </div>
        </div>
      </footer>

      {/* ════ STICKY BOTTOM CTA (FOMO trigger) ════ */}
      <AnimatePresence>
        {showSticky && (
          <motion.div
            initial={{ y: 90, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 90, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 90, background: 'rgba(0,0,0,0.96)', backdropFilter: 'blur(24px)', borderTop: '1px solid rgba(94,23,235,0.25)', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div className="font-display" style={{ fontSize: 14, color: '#F2EDE5', letterSpacing: '0.1em' }}>¿LISTO PARA CRECER?</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)' }}>Únete a 247+ artistas en IM Music</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div className="live-dot" />
                <span style={{ fontSize: 10, color: '#4ade80', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' }}>247 artistas activos ahora</span>
              </div>
              <button className="btn-primary" style={{ padding: '10px 24px', fontSize: 12 }}
                onClick={() => { burst({ y: 1 }); setTimeout(() => onNav('login'), 300); }}>
                EMPEZAR GRATIS →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ============================================================
   LOGIN PAGE
============================================================ */
const LoginPage = ({ onLogin }: { onLogin: (u: User, t: string) => void }) => {
  const [email, setEmail]     = useState('');
  const [pass,  setPass]      = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

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
      <Spotlight />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 75% 75% at 50% 50%, rgba(94,23,235,0.13) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 1 }} />
      <motion.div initial={{ opacity: 0, y: 44, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.5 }}
        style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: 440 }}>
        <div style={{ textAlign: 'center', marginBottom: 44 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 20 }}>
            <IMLogo size={48} />
            <div>
              <div className="font-display" style={{ fontSize: 27, color: '#F2EDE5', letterSpacing: '0.3em', lineHeight: 1 }}>IM</div>
              <div style={{ fontSize: 9, color: '#5E17EB', letterSpacing: '0.55em', textTransform: 'uppercase', fontWeight: 700 }}>MUSIC</div>
            </div>
          </div>
          <h1 className="font-display" style={{ fontSize: 34, color: '#F2EDE5', letterSpacing: '-0.01em', marginBottom: 8 }}>BIENVENIDO DE VUELTA</h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)' }}>Accede a tu plataforma de crecimiento</p>
        </div>

        <form onSubmit={submit} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: 44, backdropFilter: 'blur(20px)' }}>
          {[{ label: 'Email', val: email, set: setEmail, type: 'email', ph: 'tu@email.com' },
            { label: 'Contraseña', val: pass, set: setPass, type: 'password', ph: '••••••••' }].map(f => (
            <div key={f.label} style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 10 }}>{f.label}</label>
              <input type={f.type} value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph} className="input-field" />
            </div>
          ))}
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#f87171', marginBottom: 22, marginTop: 4 }}>
                {error}
              </motion.div>
            )}
          </AnimatePresence>
          <div style={{ marginTop: 14 }}>
            <Btn3D size="md" onClick={loading ? undefined : () => { const form = document.querySelector('form'); form?.requestSubmit?.(); }}>
              {loading ? <><span className="spinner spinner-sm" /> ENTRANDO...</> : 'ENTRAR A MI PLATAFORMA'}
            </Btn3D>
          </div>
          {/* Hidden real submit */}
          <button type="submit" style={{ display: 'none' }} />
        </form>
      </motion.div>
    </div>
  );
};

/* ============================================================
   DASHBOARD
============================================================ */
const DashboardPage = ({ user }: { user: User }) => {
  const [tracks,   setTracks]   = useState<Track[]>([]);
  const [royalties, setRoyalties] = useState<RoySum>({ total: 0, byPlatform: [] });
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(false);
  const [nt,       setNt]       = useState({ title: '', release_date: '', artist_id: 1 });
  const [saving,   setSaving]   = useState(false);

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
    try { await api.post('/tracks', nt); setModal(false); setNt({ title: '', release_date: '', artist_id: 1 }); load(); }
    catch { /* ignore */ } finally { setSaving(false); }
  };

  const badge = (s: string) => {
    const m: Record<string,string> = { distributed:'badge-green', pending:'badge-amber', draft:'badge-gray' };
    const l: Record<string,string> = { distributed:'Distribuido', pending:'Pendiente', draft:'Borrador' };
    return <span className={`badge ${m[s]||'badge-gray'}`}>{l[s]||s}</span>;
  };
  const maxP = Math.max(...(royalties.byPlatform?.map(p => Number(p.total)) || [1]));

  return (
    <div style={{ padding: '90px 24px 64px', maxWidth: 1100, margin: '0 auto' }}>
      <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 44 }}>
        <span className="label-tag" style={{ display: 'inline-block', marginBottom: 14 }}>Dashboard</span>
        <h1 className="font-display text-sub" style={{ color: '#F2EDE5', lineHeight: 1, letterSpacing: '-0.02em' }}>
          HOLA, {user.name.toUpperCase().split(' ')[0]} ⚡
        </h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.28)', marginTop: 8 }}>Resumen de tu actividad musical</p>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16, marginBottom: 40 }}>
        {[
          { l:'Streams',      v:'—',                                                                  icon:'🎵', col:'#5E17EB' },
          { l:'Regalías',     v:loading ? '—' : `$${Number(royalties.total).toFixed(2)}`,             icon:'💰', col:'#22c55e' },
          { l:'Tracks activos',v:loading ? '—' : tracks.length.toString(),                            icon:'🎶', col:'#f59e0b' },
          { l:'Plataformas',  v:loading ? '—' : (royalties.byPlatform?.length||0).toString(),        icon:'🌍', col:'#60a5fa' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.07 }} className="stat-card">
            <div style={{ fontSize: 28, marginBottom: 16 }}>{s.icon}</div>
            <div className="font-display" style={{ fontSize: 32, color: s.col, lineHeight: 1, marginBottom: 8 }}>
              {loading ? <span className="skeleton" style={{ display:'inline-block', width:60, height:36, borderRadius:8 }} /> : s.v}
            </div>
            <div style={{ fontSize: 10, textTransform:'uppercase', letterSpacing:'0.2em', color:'rgba(255,255,255,0.26)', fontWeight:700 }}>{s.l}</div>
          </motion.div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(440px,1fr))', gap: 20 }}>
        {/* Tracks */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }} className="glass-card" style={{ padding:28 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
            <h2 className="font-display" style={{ fontSize:18, color:'#F2EDE5', letterSpacing:'0.05em' }}>CATÁLOGO</h2>
            <button onClick={() => setModal(true)} className="btn-primary" style={{ padding:'8px 18px', fontSize:11 }}>+ NUEVO</button>
          </div>
          {loading ? (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {[1,2,3].map(k => <div key={k} className="skeleton" style={{ height:52, borderRadius:12 }} />)}
            </div>
          ) : tracks.length === 0 ? (
            <div style={{ textAlign:'center', padding:'48px 0', color:'rgba(255,255,255,0.22)', fontSize:13 }}>
              <div style={{ fontSize:32, marginBottom:12 }}>🎶</div>No hay tracks aún.
              <button onClick={() => setModal(true)} style={{ display:'block', margin:'8px auto 0', background:'none', border:'none', color:'#5E17EB', cursor:'pointer', fontSize:13, fontWeight:600 }}>+ Agrega tu primero</button>
            </div>
          ) : (
            <div>
              {tracks.slice(0,6).map((t, i) => (
                <div key={t.id} className="track-row">
                  <div style={{ width:34, height:34, borderRadius:8, background:`hsl(${250+i*30},60%,22%)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0 }}>🎵</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.title}</div>
                    <div style={{ fontSize:11, color:'rgba(255,255,255,0.28)' }}>{t.release_date||'—'}</div>
                  </div>
                  {badge(t.status)}
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Royalties */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.4 }} className="glass-card" style={{ padding:28 }}>
          <h2 className="font-display" style={{ fontSize:18, color:'#F2EDE5', letterSpacing:'0.05em', marginBottom:6 }}>REGALÍAS</h2>
          <p style={{ fontSize:12, color:'rgba(255,255,255,0.28)', marginBottom:28 }}>Por plataforma</p>
          {loading ? (
            <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
              {[1,2,3].map(k => <div key={k} className="skeleton" style={{ height:40, borderRadius:8 }} />)}
            </div>
          ) : royalties.byPlatform?.length > 0 ? (
            <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
              {royalties.byPlatform.map((p, i) => (
                <div key={i}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                    <span style={{ fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.7)' }}>{p.platform}</span>
                    <span className="font-display" style={{ fontSize:18, color:'#F2EDE5' }}>${Number(p.total).toFixed(2)}</span>
                  </div>
                  <div className="bar-track">
                    <motion.div className="bar-fill" initial={{ width:0 }} animate={{ width:`${(Number(p.total)/maxP)*100}%` }} transition={{ delay:0.6+i*0.1, duration:1.2, ease:[0.23,1,0.32,1] }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign:'center', padding:'48px 0', color:'rgba(255,255,255,0.22)', fontSize:13 }}>
              <div style={{ fontSize:32, marginBottom:12 }}>💰</div>Sin datos de regalías aún.
            </div>
          )}
        </motion.div>
      </div>

      {/* Add Track Modal */}
      <AnimatePresence>
        {modal && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} className="modal-overlay"
            onClick={e => { if (e.target===e.currentTarget) setModal(false); }}>
            <motion.div initial={{ opacity:0, scale:0.9, y:26 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.9 }}
              style={{ background:'#070707', border:'1px solid rgba(94,23,235,0.35)', borderRadius:24, padding:44, width:'100%', maxWidth:440 }}>
              <h3 className="font-display" style={{ fontSize:26, color:'#F2EDE5', marginBottom:36 }}>NUEVO TRACK</h3>
              <form onSubmit={addTrack}>
                {[{ l:'Título', v:nt.title, s:(val:string)=>setNt(n=>({...n,title:val})), type:'text', ph:'Nombre del track' },
                  { l:'Fecha de lanzamiento', v:nt.release_date, s:(val:string)=>setNt(n=>({...n,release_date:val})), type:'date', ph:'' }
                ].map(f => (
                  <div key={f.l} style={{ marginBottom:20 }}>
                    <label style={{ display:'block', fontSize:10, fontWeight:700, letterSpacing:'0.3em', textTransform:'uppercase', color:'rgba(255,255,255,0.35)', marginBottom:10 }}>{f.l}</label>
                    <input type={f.type} value={f.v} onChange={e=>f.s(e.target.value)} placeholder={f.ph} className="input-field" required />
                  </div>
                ))}
                <div style={{ display:'flex', gap:12, marginTop:12 }}>
                  <button type="button" onClick={() => setModal(false)} className="btn-ghost" style={{ flex:1, padding:16 }}>CANCELAR</button>
                  <button type="submit" disabled={saving} className="btn-primary" style={{ flex:1, padding:16 }}>
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

/* ============================================================
   CATALOG PAGE
============================================================ */
const CatalogPage = () => {
  const [tracks,  setTracks]  = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);
  const [nt,      setNt]      = useState({ title:'', release_date:'', artist_id:1 });
  const [saving,  setSaving]  = useState(false);
  const [search,  setSearch]  = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try { setTracks(await api.get('/tracks').then(d => Array.isArray(d) ? d : [])); }
    catch { setTracks([]); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try { await api.post('/tracks', nt); setModal(false); setNt({ title:'', release_date:'', artist_id:1 }); load(); }
    catch { /* ignore */ } finally { setSaving(false); }
  };

  const filtered = tracks.filter(t => t.title.toLowerCase().includes(search.toLowerCase()));
  const badge = (s: string) => {
    const m: Record<string,string> = { distributed:'badge-green', pending:'badge-amber', draft:'badge-gray' };
    const l: Record<string,string> = { distributed:'Distribuido', pending:'Pendiente', draft:'Borrador' };
    return <span className={`badge ${m[s]||'badge-gray'}`}>{l[s]||s}</span>;
  };

  return (
    <div style={{ padding:'90px 24px 64px', maxWidth:1100, margin:'0 auto' }}>
      <motion.div initial={{ opacity:0, y:22 }} animate={{ opacity:1, y:0 }} style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', flexWrap:'wrap', gap:16, marginBottom:36 }}>
        <div>
          <span className="label-tag" style={{ display:'inline-block', marginBottom:12 }}>Catálogo</span>
          <h1 className="font-display text-sub" style={{ color:'#F2EDE5', lineHeight:1, letterSpacing:'-0.02em' }}>TUS TRACKS</h1>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary" style={{ padding:'14px 28px', fontSize:12 }}>+ NUEVO TRACK</button>
      </motion.div>

      <div style={{ marginBottom:24 }}>
        <input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar tracks..." className="input-field" style={{ maxWidth:360 }} />
      </div>

      <motion.div initial={{ opacity:0, y:22 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }} className="glass-card" style={{ overflow:'hidden' }}>
        {loading ? (
          <div style={{ padding:28, display:'flex', flexDirection:'column', gap:12 }}>
            {[1,2,3,4].map(k => <div key={k} className="skeleton" style={{ height:52, borderRadius:10 }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'72px 24px', color:'rgba(255,255,255,0.22)' }}>
            <div style={{ fontSize:44, marginBottom:16 }}>🎶</div>
            <p style={{ fontSize:14 }}>{search ? 'Sin resultados.' : '¡Agrega tu primer track!'}</p>
          </div>
        ) : (
          <table className="data-table">
            <thead><tr><th>#</th><th>Título</th><th>Lanzamiento</th><th>Estado</th><th>ISRC</th></tr></thead>
            <tbody>
              {filtered.map((t, i) => (
                <motion.tr key={t.id} initial={{ opacity:0, x:-12 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*0.035 }}>
                  <td style={{ color:'rgba(255,255,255,0.18)', fontSize:12 }}>{i+1}</td>
                  <td style={{ fontWeight:600, color:'#fff' }}>{t.title}</td>
                  <td>{t.release_date||'—'}</td>
                  <td>{badge(t.status)}</td>
                  <td style={{ fontSize:12, color:'rgba(255,255,255,0.26)', fontFamily:'monospace' }}>{t.isrc||'—'}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </motion.div>

      <AnimatePresence>
        {modal && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} className="modal-overlay"
            onClick={e => { if (e.target===e.currentTarget) setModal(false); }}>
            <motion.div initial={{ opacity:0, scale:0.9, y:24 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.9 }}
              style={{ background:'#070707', border:'1px solid rgba(94,23,235,0.35)', borderRadius:24, padding:44, width:'100%', maxWidth:440 }}>
              <h3 className="font-display" style={{ fontSize:26, color:'#F2EDE5', marginBottom:36 }}>NUEVO TRACK</h3>
              <form onSubmit={save}>
                <div style={{ marginBottom:20 }}>
                  <label style={{ display:'block', fontSize:10, fontWeight:700, letterSpacing:'0.3em', textTransform:'uppercase', color:'rgba(255,255,255,0.35)', marginBottom:10 }}>Título</label>
                  <input type="text" value={nt.title} onChange={e=>setNt(n=>({...n,title:e.target.value}))} placeholder="Ej: Mi Canción" className="input-field" required />
                </div>
                <div style={{ marginBottom:36 }}>
                  <label style={{ display:'block', fontSize:10, fontWeight:700, letterSpacing:'0.3em', textTransform:'uppercase', color:'rgba(255,255,255,0.35)', marginBottom:10 }}>Fecha de lanzamiento</label>
                  <input type="date" value={nt.release_date} onChange={e=>setNt(n=>({...n,release_date:e.target.value}))} className="input-field" required />
                </div>
                <div style={{ display:'flex', gap:12 }}>
                  <button type="button" onClick={() => setModal(false)} className="btn-ghost" style={{ flex:1, padding:16 }}>CANCELAR</button>
                  <button type="submit" disabled={saving} className="btn-primary" style={{ flex:1, padding:16 }}>
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

/* ============================================================
   ROYALTIES PAGE
============================================================ */
const RoyaltiesPage = () => {
  const [data,    setData]    = useState<RoySum>({ total:0, byPlatform:[] });
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get('/royalties/summary').then(d => setData(d||{ total:0, byPlatform:[] })).catch(()=>{}).finally(()=>setLoading(false));
  }, []);
  const maxP = Math.max(...(data.byPlatform?.map(p=>Number(p.total))||[1]));

  return (
    <div style={{ padding:'90px 24px 64px', maxWidth:1100, margin:'0 auto' }}>
      <motion.div initial={{ opacity:0, y:22 }} animate={{ opacity:1, y:0 }} style={{ marginBottom:44 }}>
        <span className="label-tag" style={{ display:'inline-block', marginBottom:14 }}>Finanzas</span>
        <h1 className="font-display text-sub" style={{ color:'#F2EDE5', lineHeight:1, letterSpacing:'-0.02em' }}>REGALÍAS</h1>
        <p style={{ fontSize:14, color:'rgba(255,255,255,0.28)', marginTop:8 }}>Ingresos por plataforma de distribución</p>
      </motion.div>

      <motion.div initial={{ opacity:0, y:22 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}
        style={{ textAlign:'center', background:'rgba(94,23,235,0.06)', border:'1px solid rgba(94,23,235,0.2)', borderRadius:22, padding:'52px 32px', marginBottom:24, backdropFilter:'blur(20px)' }}>
        <p style={{ fontSize:11, fontWeight:700, letterSpacing:'0.35em', textTransform:'uppercase', color:'rgba(255,255,255,0.26)', marginBottom:18 }}>Total acumulado</p>
        {loading
          ? <div className="skeleton" style={{ width:200, height:88, margin:'0 auto', borderRadius:14 }} />
          : <div className="font-display" style={{ fontSize:'clamp(3rem,8vw,6.5rem)', lineHeight:1, color:'#5E17EB', textShadow:'0 0 50px rgba(94,23,235,0.6)' }}>${Number(data.total).toFixed(2)}</div>}
      </motion.div>

      <motion.div initial={{ opacity:0, y:22 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }} className="glass-card" style={{ padding:36 }}>
        <h2 className="font-display" style={{ fontSize:18, color:'#F2EDE5', letterSpacing:'0.05em', marginBottom:34 }}>POR PLATAFORMA</h2>
        {loading ? (
          <div style={{ display:'flex', flexDirection:'column', gap:22 }}>
            {[1,2,3].map(k=><div key={k} className="skeleton" style={{ height:48, borderRadius:10 }} />)}
          </div>
        ) : data.byPlatform?.length > 0 ? (
          <div style={{ display:'flex', flexDirection:'column', gap:26 }}>
            {data.byPlatform.map((p, i) => (
              <motion.div key={i} initial={{ opacity:0, x:-22 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.3+i*0.07 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
                  <span style={{ fontSize:14, fontWeight:600, color:'#fff' }}>{p.platform}</span>
                  <span className="font-display" style={{ fontSize:20, color:'#F2EDE5' }}>${Number(p.total).toFixed(2)}</span>
                </div>
                <div className="bar-track">
                  <motion.div className="bar-fill" initial={{ width:0 }} animate={{ width:`${(Number(p.total)/maxP)*100}%` }} transition={{ delay:0.5+i*0.1, duration:1.3, ease:[0.23,1,0.32,1] }} />
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign:'center', padding:'60px 0', color:'rgba(255,255,255,0.22)', fontSize:14 }}>
            <div style={{ fontSize:40, marginBottom:14 }}>💰</div>No hay datos de regalías disponibles aún.
          </div>
        )}
      </motion.div>
    </div>
  );
};

/* ============================================================
   MARKETING / AI CHAT
============================================================ */
const MarketingPage = () => {
  const [msgs,    setMsgs]    = useState<ChatMsg[]>([{ role:'ai', content:'¡Hola! Soy tu agente de marketing con IA. Puedo ayudarte a crear estrategias, analizar tu mercado, generar ideas de contenido y mucho más. ¿Por dónde empezamos?' }]);
  const [input,   setInput]   = useState('');
  const [thinking,setThinking]= useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }); }, [msgs]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim(); if (!text || thinking) return;
    setInput('');
    setMsgs(m => [...m, { role:'user', content:text }]);
    setThinking(true);
    try {
      const d = await api.post('/ai/chat', { message:text });
      setMsgs(m => [...m, { role:'ai', content: d.reply||d.response||d.message||'Respuesta recibida.' }]);
    } catch {
      setMsgs(m => [...m, { role:'ai', content:'Hubo un error al conectar con el agente. Verifica que el servidor esté activo.' }]);
    } finally { setThinking(false); }
  };

  const CHIPS = ['Analiza mi mercado', 'Estrategia de lanzamiento', 'Ideas para redes sociales', 'Tendencias en mi género'];

  return (
    <div style={{ height:'100vh', display:'flex', flexDirection:'column', paddingTop:70 }}>
      <div style={{ borderBottom:'1px solid rgba(255,255,255,0.06)', padding:'20px 28px', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <span className="label-tag" style={{ display:'inline-block', marginBottom:8 }}>IA</span>
          <h1 className="font-display" style={{ fontSize:'clamp(1.6rem,4vw,2.2rem)', color:'#F2EDE5', lineHeight:1, letterSpacing:'-0.02em' }}>AGENTE MARKETING</h1>
          <p style={{ fontSize:12, color:'rgba(255,255,255,0.26)', marginTop:5 }}>Powered by AI · Disponible 24/7</p>
        </div>
        <SoundWave />
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'24px 28px', display:'flex', flexDirection:'column', gap:16, maxWidth:860, width:'100%', margin:'0 auto', alignSelf:'center' }}>
        <AnimatePresence initial={false}>
          {msgs.map((m, i) => (
            <motion.div key={i} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
              style={{ display:'flex', justifyContent:m.role==='user'?'flex-end':'flex-start', gap:10, alignItems:'flex-end' }}>
              {m.role==='ai' && (
                <div style={{ width:30, height:30, borderRadius:'50%', background:'rgba(94,23,235,0.2)', border:'1px solid rgba(94,23,235,0.35)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0 }}>⚡</div>
              )}
              <div className={`chat-bubble ${m.role==='user'?'chat-bubble-user':'chat-bubble-ai'}`}>{m.content}</div>
            </motion.div>
          ))}
        </AnimatePresence>
        {thinking && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} style={{ display:'flex', gap:10, alignItems:'flex-end' }}>
            <div style={{ width:30, height:30, borderRadius:'50%', background:'rgba(94,23,235,0.2)', border:'1px solid rgba(94,23,235,0.35)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0 }}>⚡</div>
            <div className="chat-bubble chat-bubble-ai" style={{ display:'flex', gap:5, alignItems:'center', padding:'14px 18px' }}>
              {[0,1,2].map(j=><span key={j} style={{ width:7, height:7, borderRadius:'50%', background:'#5E17EB', display:'inline-block', animation:`bounce 1s ${j*0.2}s ease-in-out infinite` }} />)}
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ borderTop:'1px solid rgba(255,255,255,0.06)', padding:'16px 28px 28px', flexShrink:0, maxWidth:860, width:'100%', margin:'0 auto', alignSelf:'center' }}>
        {msgs.length <= 1 && (
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:16 }}>
            {CHIPS.map((c, i) => (
              <button key={i} onClick={() => setInput(c)}
                style={{ background:'rgba(94,23,235,0.08)', border:'1px solid rgba(94,23,235,0.2)', borderRadius:8, padding:'8px 14px', fontSize:12, color:'rgba(255,255,255,0.55)', cursor:'pointer', transition:'all 0.2s', fontWeight:500 }}
                onMouseEnter={e => { Object.assign((e.currentTarget as HTMLElement).style, { borderColor:'rgba(94,23,235,0.5)', color:'#fff' }); }}
                onMouseLeave={e => { Object.assign((e.currentTarget as HTMLElement).style, { borderColor:'rgba(94,23,235,0.2)', color:'rgba(255,255,255,0.55)' }); }}>
                {c}
              </button>
            ))}
          </div>
        )}
        <form onSubmit={send} style={{ display:'flex', gap:12 }}>
          <input type="text" value={input} onChange={e=>setInput(e.target.value)} placeholder="Pregunta algo sobre tu estrategia musical..." className="input-field" style={{ flex:1 }} disabled={thinking} />
          <motion.button type="submit" disabled={thinking||!input.trim()}
            whileHover={!thinking&&!!input.trim()?{scale:1.05}:{}}
            whileTap={!thinking&&!!input.trim()?{scale:0.95}:{}}
            className="btn-primary" style={{ padding:'14px 24px', flexShrink:0 }}>
            {thinking ? <span className="spinner spinner-sm" /> : '→'}
          </motion.button>
        </form>
      </div>
    </div>
  );
};

/* ============================================================
   APP ROOT
============================================================ */
type Page = 'home' | 'login' | 'dashboard' | 'catalog' | 'royalties' | 'marketing';
const PROTECTED: Page[] = ['dashboard', 'catalog', 'royalties', 'marketing'];

export default function App() {
  const [page,    setPage]    = useState<Page>('home');
  const [user,    setUser]    = useState<User | null>(null);
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
    setUser(u); setPage('dashboard');
    window.scrollTo({ top: 0 });
  };

  const onLogout = () => {
    localStorage.removeItem('im_token');
    setUser(null); setPage('home');
    window.scrollTo({ top: 0 });
  };

  if (booting) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#000' }}>
      <motion.div animate={{ opacity:[0.3,1,0.3] }} transition={{ duration:1.8, repeat:Infinity }}
        style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:24 }}>
        <IMLogo size={64} />
        <SoundWave />
        <div style={{ width:36, height:36, border:'2px solid rgba(94,23,235,0.2)', borderTopColor:'#5E17EB', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} />
      </motion.div>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:'#000', color:'#fff' }}>
      <Navbar onNav={go} page={page} user={user} onLogout={onLogout} />
      <AnimatePresence mode="wait">
        <motion.div key={page} initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }} transition={{ duration:0.22 }}>
          {page === 'home'      && <LandingPage onNav={go} />}
          {page === 'login'     && <LoginPage onLogin={onLogin} />}
          {page === 'dashboard' && user && <DashboardPage user={user} />}
          {page === 'catalog'   && user && <CatalogPage />}
          {page === 'royalties' && user && <RoyaltiesPage />}
          {page === 'marketing' && user && <MarketingPage />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
