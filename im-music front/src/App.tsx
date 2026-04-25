import React, { useState, useEffect, useRef, useCallback, memo, createContext, useContext } from 'react';
import { useTranslation, type Lang } from './i18n';
import Magnet from './components/Magnet';
import SpotlightCard from './components/SpotlightCard';
import RotatingText from './components/RotatingText';
import ShinyText from './components/ShinyText';
import CountUp from './components/CountUp';
const LightPillarLazy = React.lazy(() =>
  import('./components/LightPillar').catch(() => ({ default: () => null as any }))
);
import {
  LayoutDashboard, Music, TrendingUp, DollarSign, Settings,
  Plus, Bell, BarChart3, Globe,
  Zap, CreditCard, Sparkles, Play, ShoppingBag,
  MessageCircle, Lock, Video, Mic, Award, Link2, Store,
  Upload, Image, Scale, ChevronDown, Send, Trash2,
  LogOut, BookOpen, Package, Users, Radio, Star, Check,
  ArrowRight, Disc, Headphones, Shield,
  Download, FileText, Copy,
  Calendar, Clock, X, ToggleLeft, ToggleRight,
  FileAudio, FileVideo, FileImage, Percent, User
} from 'lucide-react';

// ─── Constants ───────────────────────────────────────────────────────────────
const P = '#5E17EB';
const PL = '#7B3FFF';
const SIDEBAR_W = 280;
const API = '/api';
const token = () => localStorage.getItem('im_token') || '';

const COLORS = {
  bg: '#000000', bgSecondary: '#0A0A0F',
  bgCard: 'rgba(255,255,255,0.05)', bgCardHover: 'rgba(255,255,255,0.08)',
  border: 'rgba(255,255,255,0.08)', borderHover: 'rgba(255,255,255,0.15)',
  purple: '#5E17EB', purpleLight: '#7B3FFF', purpleSoft: 'rgba(94,23,235,0.15)',
  text: '#F5F5F7', textSecondary: 'rgba(255,255,255,0.5)', textTertiary: 'rgba(255,255,255,0.25)',
  green: '#30D158', blue: '#0A84FF', red: '#FF453A', yellow: '#FFD60A',
  glass: 'rgba(255,255,255,0.06)', glassBorder: 'rgba(255,255,255,0.1)',
};

// ─── Language Context ─────────────────────────────────────────────────────────
const LangContext = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({ lang: 'es', setLang: () => {} });
const useLang = () => useContext(LangContext);

function LangToggleButton() {
  const { lang, setLang } = useLang();
  return (
    <button
      onClick={() => { const next: Lang = lang === 'es' ? 'en' : 'es'; setLang(next); localStorage.setItem('im_lang', next); }}
      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '5px 12px', color: 'rgba(255,255,255,0.7)', fontFamily: "'Space Grotesk',sans-serif", fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' }}
      onMouseEnter={e => { (e.currentTarget).style.background = 'rgba(94,23,235,0.15)'; (e.currentTarget).style.borderColor = 'rgba(94,23,235,0.4)'; }}
      onMouseLeave={e => { (e.currentTarget).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget).style.borderColor = 'rgba(255,255,255,0.12)'; }}>
      {lang === 'es' ? '🇺🇸 EN' : '🇨🇴 ES'}
    </button>
  );
}

async function apiFetch(path: string, opts: RequestInit = {}) {
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}`, ...(opts.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'Error') as Error & { status?: number; requiredPlan?: string };
    err.status = res.status;
    err.requiredPlan = data.requiredPlan;
    throw err;
  }
  return data;
}

// ─── Animated Counter ────────────────────────────────────────────────────────
function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const duration = 1800;
        const startTime = performance.now();
        const tick = (now: number) => {
          const progress = Math.min((now - startTime) / duration, 1);
          const ease = 1 - Math.pow(1 - progress, 3);
          setCount(Math.round(ease * target));
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        observer.disconnect();
      }
    }, { threshold: 0.3 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [target]);
  return <span ref={ref}>{count}{suffix}</span>;
}

// ─── useTilt hook — RAF throttled, zero re-renders ───────────────────────────
function useTilt() {
  const ref = useRef<HTMLDivElement>(null);
  const rafId = useRef<number>(0);
  const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    cancelAnimationFrame(rafId.current);
    const cx = e.clientX; const cy = e.clientY;
    rafId.current = requestAnimationFrame(() => {
      if (!ref.current) return;
      const r = ref.current.getBoundingClientRect();
      const x = (cx - r.left) / r.width - 0.5;
      const y = (cy - r.top) / r.height - 0.5;
      ref.current.style.transform = `perspective(900px) rotateX(${-y * 10}deg) rotateY(${x * 10}deg) translateZ(12px)`;
      ref.current.style.boxShadow = `${-x * 25}px ${-y * 25}px 60px rgba(94,23,235,0.25), 0 25px 50px rgba(0,0,0,0.5)`;
      ref.current.style.borderColor = 'rgba(94,23,235,0.45)';
    });
  }, []);
  const onMouseLeave = useCallback(() => {
    cancelAnimationFrame(rafId.current);
    if (!ref.current) return;
    ref.current.style.transform = '';
    ref.current.style.boxShadow = '';
    ref.current.style.borderColor = '';
    ref.current.style.transition = 'transform 0.6s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.6s ease, border-color 0.4s ease';
    setTimeout(() => { if (ref.current) ref.current.style.transition = ''; }, 600);
  }, []);
  return { ref, onMouseMove, onMouseLeave };
}

// ─── Cursor Trail — pure DOM, zero React re-renders ──────────────────────────
function CursorTrail() {
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = containerRef.current; if (!container) return;
    const MAX = 7;
    const dots: HTMLDivElement[] = [];
    // Pre-create fixed pool of dots
    for (let i = 0; i < MAX; i++) {
      const d = document.createElement('div');
      d.style.cssText = `position:absolute;border-radius:50%;pointer-events:none;transform:translate(-50%,-50%);transition:opacity 0.5s ease;opacity:0;`;
      container.appendChild(d);
      dots.push(d);
    }
    let idx = 0;
    const handler = (e: MouseEvent) => {
      const d = dots[idx % MAX];
      const sz = 4 + (idx % MAX) * 1.2;
      const alpha = 0.08 + (idx % MAX) * 0.06;
      d.style.left = e.clientX + 'px';
      d.style.top = e.clientY + 'px';
      d.style.width = sz + 'px';
      d.style.height = sz + 'px';
      d.style.background = `rgba(94,23,235,${alpha})`;
      d.style.opacity = '1';
      setTimeout(() => { d.style.opacity = '0'; }, 500);
      idx++;
    };
    window.addEventListener('mousemove', handler, { passive: true });
    return () => window.removeEventListener('mousemove', handler);
  }, []);
  return <div ref={containerRef} style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:9999 }} />;
}


// ─── Page Background ──────────────────────────────────────────────────────────
function PageBackground({ color = '#5E17EB' }: { color?: string }) {
  return (
    <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0, overflow:'hidden' }}>
      <div style={{ position:'absolute', width:700, height:700, top:'-20%', right:'-10%', borderRadius:'50%', background:`radial-gradient(circle, ${color}12 0%, transparent 70%)`, animation:'orbFloat0 18s ease-in-out infinite', filter:'blur(60px)' }} />
      <div style={{ position:'absolute', width:500, height:500, bottom:'-10%', left:'-5%', borderRadius:'50%', background:`radial-gradient(circle, ${color}08 0%, transparent 70%)`, animation:'orbFloat1 22s ease-in-out infinite', filter:'blur(40px)' }} />
      <div style={{ position:'absolute', width:350, height:350, top:'40%', left:'40%', borderRadius:'50%', background:`radial-gradient(circle, ${color}07 0%, transparent 70%)`, animation:'orbFloat2 26s ease-in-out infinite', filter:'blur(30px)' }} />
      <div style={{ position:'absolute', inset:0, backgroundImage:`linear-gradient(${color}12 1px, transparent 1px), linear-gradient(90deg, ${color}12 1px, transparent 1px)`, backgroundSize:'60px 60px', opacity:0.4 }} />
      <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 40%, rgba(0,0,0,0.45) 100%)' }} />
    </div>
  );
}

// ─── AppleIcon / Icon3D ───────────────────────────────────────────────────────
function AppleIcon({ icon: Icon, color = '#5E17EB', size = 44, label }: any) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0 }}>
      <div style={{
        width: size, height: size, borderRadius: size * 0.25,
        background: `linear-gradient(145deg, ${color}25, ${color}10)`,
        border: `1px solid ${color}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={size * 0.45} color={color} strokeWidth={1.5} />
      </div>
      {label && <span style={{ fontFamily: "'-apple-system','Space Grotesk',sans-serif", fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em', textTransform: 'uppercase', textAlign: 'center' }}>{label}</span>}
    </div>
  );
}
const Icon3D = AppleIcon;
const GlassIcon = AppleIcon;

// Group → color map for icons
const GROUP_COLORS: Record<string, string> = {
  'Principal': '#5E17EB', 'Música': '#C084FC', 'Finanzas': '#22c55e',
  'Marketing': '#f59e0b', 'Distribución': '#3b82f6', 'Archivos': '#06b6d4',
  'Gestión': '#94a3b8', 'IA': '#22d3ee', 'Social': '#f43f5e', 'General': '#5E17EB',
};

// ─── FloatingOrbs ─────────────────────────────────────────────────────────────
function FloatingOrbs({ colors = ['#5E17EB', '#7B3FFF', '#C084FC'] }: { colors?: string[] }) {
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
      {colors.map((color, i) => (
        <div key={i} style={{
          position: 'absolute',
          width: `${300 + i * 100}px`, height: `${300 + i * 100}px`,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${color}12 0%, transparent 70%)`,
          top: ['−10%', '40%', '70%'][i], left: ['60%', '−5%', '70%'][i],
          animation: `orbFloat${i} ${15 + i * 5}s ease-in-out infinite`,
          filter: 'blur(40px)',
        }} />
      ))}
    </div>
  );
}

// ─── Particle Burst ───────────────────────────────────────────────────────────
function particleBurst(e: React.MouseEvent) {
  const colors = ['#5E17EB', '#7B3FFF', '#C084FC', '#F2EDE5'];
  for (let i = 0; i < 10; i++) {
    const particle = document.createElement('div');
    const angle = (i / 10) * 360;
    const distance = 40 + Math.random() * 60;
    const size = 4 + Math.random() * 4;
    const color = colors[Math.floor(Math.random() * colors.length)];
    const tx = Math.cos((angle * Math.PI) / 180) * distance;
    const ty = Math.sin((angle * Math.PI) / 180) * distance - 40;
    const kfName = `pb_${Date.now()}_${i}`;
    const style = document.createElement('style');
    style.textContent = `@keyframes ${kfName}{0%{transform:translate(0,0) scale(1);opacity:1}100%{transform:translate(${tx}px,${ty}px) scale(0);opacity:0}}`;
    particle.style.cssText = `position:fixed;left:${e.clientX}px;top:${e.clientY}px;width:${size}px;height:${size}px;background:${color};border-radius:50%;pointer-events:none;z-index:99999;transform:translate(-50%,-50%);animation:${kfName} 0.8s ease-out forwards;`;
    document.head.appendChild(style);
    document.body.appendChild(particle);
    setTimeout(() => { particle.remove(); style.remove(); }, 800);
  }
}

// ─── AppleBtn / Btn3D ─────────────────────────────────────────────────────────
function AppleBtn({ children, onClick, disabled = false, type = 'button', variant = 'primary', small = false, fullWidth = false }: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean;
  type?: 'button' | 'submit'; variant?: 'primary' | 'ghost' | 'danger'; small?: boolean; fullWidth?: boolean;
}) {
  const [pressed, setPressed] = useState(false);
  const isDanger = variant === 'danger';
  const bg = isDanger ? '#FF453A' : variant === 'primary' ? (pressed ? '#4A12C0' : '#5E17EB') : (pressed ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.06)');
  return (
    <button type={type} disabled={disabled} onClick={onClick}
      onMouseDown={() => setPressed(true)} onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      style={{
        background: bg,
        border: variant === 'primary' || isDanger ? 'none' : '1px solid rgba(255,255,255,0.12)',
        borderRadius: small ? 10 : 14, padding: small ? '8px 18px' : '13px 28px',
        color: '#fff', fontFamily: "'-apple-system','SF Pro Display','BlinkMacSystemFont','Space Grotesk',sans-serif",
        fontSize: small ? 12 : 14, fontWeight: 600, letterSpacing: '-0.01em',
        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.4 : 1,
        transform: pressed ? 'scale(0.97)' : 'scale(1)',
        transition: 'all 0.15s cubic-bezier(0.25,0.46,0.45,0.94)',
        display: 'inline-flex', alignItems: 'center', gap: 6,
        width: fullWidth ? '100%' : undefined, justifyContent: fullWidth ? 'center' : undefined,
        boxShadow: variant === 'primary' && !pressed ? '0 4px 14px rgba(94,23,235,0.35)' : 'none',
        whiteSpace: 'nowrap',
      }}>
      {children}
    </button>
  );
}
const Btn3D = AppleBtn;

// ─── ══════════════════════════════════════════════════════════════
//      LANDING PAGE
// ═════════════════════════════════════════════════════════════════
const MARQUEE_WORDS = ['DISTRIBUCIÓN GLOBAL', 'REGALÍAS EN TIEMPO REAL', 'IA MUSICAL', 'MARKETING INTELIGENTE', 'SPLITS AUTOMÁTICOS', 'STORE MAXIMIZER', 'PUBLISHING', 'VAULT SEGURO'];

function Marquee({ reverse = false }: { reverse?: boolean }) {
  const items = [...MARQUEE_WORDS, ...MARQUEE_WORDS];
  return (
    <div style={{ overflow: 'hidden', borderTop: '1px solid rgba(94,23,235,0.25)', borderBottom: '1px solid rgba(94,23,235,0.25)', background: 'linear-gradient(90deg,#5E17EB,#7B3FFF,#5E17EB)', backgroundSize: '200% 100%', animation: 'gradientShift 4s linear infinite', padding: '12px 0' }}>
      <div style={{ display: 'flex', width: 'max-content', animation: `marquee${reverse ? 'Rev' : ''} 28s linear infinite` }}>
        {items.map((w, i) => (
          <span key={i} style={{ fontFamily: "'Anton', sans-serif", fontSize: '11px', letterSpacing: '0.25em', color: 'rgba(255,255,255,0.9)', padding: '0 28px', whiteSpace: 'nowrap' }}>
            {w} <span style={{ color: 'rgba(255,255,255,0.5)' }}>✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// CSS 3D rotating cube
function RotatingCube() {
  return (
    <div style={{ perspective: '800px', width: '260px', height: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '160px', height: '160px', position: 'relative', transformStyle: 'preserve-3d', animation: 'rotateCube 8s linear infinite' }}>
        {[
          { transform: 'translateZ(80px)', bg: `rgba(94,23,235,0.18)`, border: `1px solid rgba(94,23,235,0.5)`, label: 'DIST' },
          { transform: 'rotateY(180deg) translateZ(80px)', bg: `rgba(123,63,255,0.15)`, border: `1px solid rgba(123,63,255,0.4)`, label: 'IA' },
          { transform: 'rotateY(90deg) translateZ(80px)', bg: `rgba(94,23,235,0.12)`, border: `1px solid rgba(94,23,235,0.35)`, label: 'MKT' },
          { transform: 'rotateY(-90deg) translateZ(80px)', bg: `rgba(123,63,255,0.12)`, border: `1px solid rgba(123,63,255,0.35)`, label: 'PAY' },
          { transform: 'rotateX(90deg) translateZ(80px)', bg: `rgba(94,23,235,0.08)`, border: `1px solid rgba(94,23,235,0.25)`, label: null },
          { transform: 'rotateX(-90deg) translateZ(80px)', bg: `rgba(94,23,235,0.08)`, border: `1px solid rgba(94,23,235,0.25)`, label: null },
        ].map((face, i) => (
          <div key={i} style={{
            position: 'absolute', width: '160px', height: '160px',
            transform: face.transform, background: face.bg, border: face.border,
            borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(8px)',
          }}>
            {face.label && <span style={{ fontFamily: "'Anton', sans-serif", fontSize: '22px', color: PL, letterSpacing: '0.1em', opacity: 0.9 }}>{face.label}</span>}
          </div>
        ))}
      </div>
      {/* Glow under cube */}
      <div style={{ position: 'absolute', width: '200px', height: '40px', background: `radial-gradient(ellipse, rgba(94,23,235,0.4) 0%, transparent 70%)`, bottom: '-20px', filter: 'blur(12px)' }} />
    </div>
  );
}

const SERVICES = [
  { icon: Disc, color: '#5E17EB', title: 'Distribución Global', desc: 'Tu música en +150 plataformas: Spotify, Apple Music, YouTube, TikTok y más. ISRC y UPC incluidos.' },
  { icon: DollarSign, color: '#22c55e', title: 'Regalías en Tiempo Real', desc: 'Dashboard con ingresos actualizados diariamente. Histórico completo y proyecciones inteligentes.' },
  { icon: Sparkles, color: '#f59e0b', title: 'Marketing con IA', desc: 'Identifica tu arquetipo artístico, genera estrategias y automatiza campañas con inteligencia artificial.' },
  { icon: Users, color: '#C084FC', title: 'Splits y Colaboraciones', desc: 'Divide regalías automáticamente entre colaboradores. Contratos digitales, pagos en tiempo real.' },
  { icon: BookOpen, color: '#3b82f6', title: 'Publishing y Registro', desc: 'Registra tus composiciones, gestiona derechos de autor y cobra royalties de sincronización.' },
  { icon: Radio, color: '#7B3FFF', title: 'Spotlight Playlists', desc: 'Envía tu música a curadores verificados. Acceso directo a playlists editoriales de alto alcance.' },
];

const PLANS = [
  {
    name: 'INDIE',
    price: '$79.000' as string | null,
    cop: 'COP/mes' as string | null,
    period: '/mes' as string | null,
    featured: false,
    cta: 'EMPEZAR AHORA',
    badge: null as string | null,
    features: [
      'Distribución ilimitada 150+ plataformas',
      '100% de tus regalías',
      'Splits automáticos',
      'Analytics en tiempo real',
      'ISRC y UPC incluidos',
      'IA Chat (50 consultas/mes)',
      'Soporte por email',
    ],
  },
  {
    name: 'PRO',
    price: '$490.000' as string | null,
    cop: 'COP/mes' as string | null,
    period: '/mes' as string | null,
    featured: true,
    cta: 'IR AL PRO',
    badge: '★ MÁS POPULAR' as string | null,
    features: [
      'Todo lo de INDIE',
      'Marketing con IA ilimitado',
      'Meta Ads integrado',
      'Plan de contenidos mensual IA',
      'Publishing y registro',
      'Store Maximizer',
      'Financiamiento',
      'HyperFollow + Spotlight',
      'Soporte prioritario 24/7',
    ],
  },
  {
    name: 'ÉLITE 360',
    price: null as string | null,
    cop: null as string | null,
    period: null as string | null,
    featured: false,
    cta: 'AGENDAR REUNIÓN',
    badge: '👑 SERVICIO COMPLETO' as string | null,
    features: [
      'Todo lo de PRO',
      'Project Manager dedicado',
      'Manager musical y desarrollo artístico',
      'Producción de videos musicales',
      'Branding y diseño gráfico profesional',
      'Contenidos ejecutados (no solo generados)',
      'Meta Ads gestionado por expertos',
      'Producción y edición para redes sociales',
      'Campamentos musicales',
      'Acceso a red de industria',
    ],
  },
];

const STATS = [
  { value: '150+', label: 'Plataformas', num: 150, suffix: '+' },
  { value: '50K+', label: 'Artistas activos', num: 50, suffix: 'K+' },
  { value: '$2M+', label: 'En regalías pagadas', num: 2, suffix: 'M+', prefix: '$' },
  { value: '98%', label: 'Satisfacción', num: 98, suffix: '%' },
];

const ARTISTS = [
  { name: 'Luna Vera', genre: 'R&B / Soul', streams: '4.2M', img: '🎤', color: '#7B3FFF' },
  { name: 'Niko Beats', genre: 'Trap / Hip-Hop', streams: '11.8M', img: '🎧', color: '#5E17EB' },
  { name: 'Mía Solar', genre: 'Pop Urbano', streams: '6.5M', img: '🌟', color: '#C084FC' },
  { name: 'El Productor', genre: 'Reggaeton', streams: '22.1M', img: '🎹', color: '#7B3FFF' },
  { name: 'Seren Flow', genre: 'Indie / Alt', streams: '3.9M', img: '🎸', color: '#5E17EB' },
  { name: 'Dara K', genre: 'Electrónica', streams: '8.7M', img: '🎵', color: '#C084FC' },
];

// ─── Confetti burst ──────────────────────────────────────────────────────────
function fireConfetti(originEl?: HTMLElement) {
  const colors = ['#5E17EB', '#7B3FFF', '#C084FC', '#F2EDE5', '#22c55e', '#fbbf24'];
  const count = 60;
  const rect = originEl?.getBoundingClientRect();
  const cx = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
  const cy = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'confetti-particle';
    const color = colors[Math.floor(Math.random() * colors.length)];
    const size = 6 + Math.random() * 8;
    const angle = (Math.random() * 360) * Math.PI / 180;
    const distance = 80 + Math.random() * 200;
    el.style.cssText = `
      left:${cx + Math.cos(angle) * distance * 0.3}px;
      top:${cy}px;
      width:${size}px; height:${size}px;
      background:${color};
      border-radius:${Math.random() > 0.5 ? '50%' : '2px'};
      animation-duration:${1.2 + Math.random() * 1.5}s;
      animation-delay:${Math.random() * 0.3}s;
      transform:translateX(${(Math.random() - 0.5) * 400}px);
    `;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }
}

class LightPillarBoundary extends React.Component<{children:React.ReactNode},{error:boolean}> {
  state = {error:false};
  componentDidCatch() { this.setState({error:true}); }
  render() { return this.state.error ? null : this.props.children; }
}

function LandingPage({ onEnter, onNav }: { onEnter: () => void; onNav?: (s: Screen) => void }) {
  const { lang } = useLang();
  const t = useTranslation(lang);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showBg, setShowBg] = useState(false);
  const progressBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setShowBg(true), 800);
    return () => clearTimeout(t);
  }, []);

  // Scroll: only trigger React re-render when threshold crosses, progress via direct DOM
  useEffect(() => {
    let lastScrolled = false;
    const onScroll = () => {
      const isScrolled = window.scrollY > 50;
      if (isScrolled !== lastScrolled) { setScrolled(isScrolled); lastScrolled = isScrolled; }
      if (progressBarRef.current) {
        const doc = document.documentElement;
        const prog = Math.min(window.scrollY / (doc.scrollHeight - doc.clientHeight), 1);
        progressBarRef.current.style.width = `${prog * 100}%`;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);


  // Scroll reveal observer
  useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); } });
    }, { threshold: 0.12 });
    els.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#020202', color: '#fff', overflowX: 'hidden' }}>
      {/* Global styles */}
      <style>{`
        @keyframes marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        @keyframes marqueeRev { from{transform:translateX(-50%)} to{transform:translateX(0)} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes waveBar { 0%,100%{height:20px} 50%{height:var(--h)} }
        @keyframes dashFloat { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-12px)} }
        @keyframes rotateCube { from{transform:rotateX(12deg) rotateY(0deg)} to{transform:rotateX(12deg) rotateY(360deg)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes orbFloat { 0%,100%{transform:translateZ(0) translate(0,0)} 33%{transform:translateZ(0) translate(20px,-30px)} 66%{transform:translateZ(0) translate(-15px,20px)} }

        /* Hero headline staggered fade-up */
        @keyframes heroWord { from{opacity:0;transform:translateY(40px)} to{opacity:1;transform:translateY(0)} }
        .hero-line-1{animation:heroWord 0.7s cubic-bezier(0.22,1,0.36,1) 0.1s both}
        .hero-line-2{animation:heroWord 0.7s cubic-bezier(0.22,1,0.36,1) 0.25s both}
        .hero-line-3{animation:heroWord 0.7s cubic-bezier(0.22,1,0.36,1) 0.4s both}
        .hero-badge{animation:heroWord 0.6s cubic-bezier(0.22,1,0.36,1) 0.0s both}
        .hero-body{animation:heroWord 0.7s cubic-bezier(0.22,1,0.36,1) 0.55s both}
        .hero-cta{animation:heroWord 0.7s cubic-bezier(0.22,1,0.36,1) 0.7s both}
        .hero-stats{animation:heroWord 0.7s cubic-bezier(0.22,1,0.36,1) 0.85s both}
        .hero-card{animation:heroWord 0.8s cubic-bezier(0.22,1,0.36,1) 0.3s both}

        /* Scroll reveal */
        .reveal{opacity:0;transform:translateY(36px);transition:opacity 0.7s cubic-bezier(0.22,1,0.36,1),transform 0.7s cubic-bezier(0.22,1,0.36,1)}
        .reveal.visible{opacity:1;transform:translateY(0)}
        .reveal-delay-1{transition-delay:0.1s}
        .reveal-delay-2{transition-delay:0.2s}
        .reveal-delay-3{transition-delay:0.3s}
        .reveal-delay-4{transition-delay:0.4s}
        .reveal-delay-5{transition-delay:0.5s}
        .reveal-delay-6{transition-delay:0.6s}

        /* Pulsing border for featured plan card */
        @keyframes borderPulse {
          0%,100%{box-shadow:0 0 0 0 rgba(94,23,235,0.4),0 0 60px rgba(94,23,235,0.25),0 20px 60px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.08)}
          50%{box-shadow:0 0 0 6px rgba(94,23,235,0.15),0 0 80px rgba(94,23,235,0.4),0 20px 60px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.08)}
        }
        .featured-plan{animation:borderPulse 2.5s ease-in-out infinite}

        /* Confetti particle */
        @keyframes confettiFall {
          0%{transform:translateY(-20px) rotate(0deg);opacity:1}
          100%{transform:translateY(120vh) rotate(720deg);opacity:0}
        }
        .confetti-particle{position:fixed;width:8px;height:8px;border-radius:2px;pointer-events:none;z-index:99999;animation:confettiFall linear forwards}

        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        ::-webkit-scrollbar{width:3px} ::-webkit-scrollbar-track{background:#000} ::-webkit-scrollbar-thumb{background:${P};border-radius:3px}

        /* Responsive */
        @media(max-width:1024px){
          .landing-hero-grid{grid-template-columns:1fr!important}
          .landing-hero-card{display:none!important}
          .landing-why-grid{grid-template-columns:repeat(2,1fr)!important}
          .landing-pricing-grid{grid-template-columns:1fr!important;max-width:480px;margin:0 auto}
          .landing-footer-grid{grid-template-columns:1fr 1fr!important}
          .landing-stats-grid{grid-template-columns:repeat(2,1fr)!important;gap:24px!important}
          .landing-testimonials-grid{grid-template-columns:1fr!important}
        }
        @media(max-width:768px){
          .landing-nav-links{display:none!important}
          .landing-hamburger{display:flex!important}
          .landing-hero-section{padding:90px 24px 60px!important}
          .landing-hero-grid{gap:40px!important}
          .landing-why-grid{grid-template-columns:1fr!important}
          .landing-stats-grid{grid-template-columns:repeat(2,1fr)!important;gap:0!important}
          .landing-pricing-grid{grid-template-columns:1fr!important;max-width:360px}
          .landing-footer-grid{grid-template-columns:1fr!important}
          .landing-services-title{font-size:clamp(28px,8vw,44px)!important}
          .landing-section-padding{padding:80px 24px!important}
          .landing-stats-section{padding:48px 24px!important}
          .artist-carousel{padding:16px 20px 24px!important}
          .hero-stats{gap:20px!important;flex-wrap:wrap!important}
          .hero-stats>div{min-width:calc(50% - 10px)}
        }
        @media(max-width:480px){
          .landing-stats-grid{grid-template-columns:repeat(2,1fr)!important}
          .landing-hero-cta{flex-direction:column!important;align-items:flex-start!important}
          .landing-hero-h1{font-size:clamp(44px,13vw,68px)!important}
        }

        /* Mobile menu */
        .mobile-nav{position:fixed;top:64px;left:0;right:0;background:rgba(5,5,10,0.98);backdrop-filter:blur(24px);border-bottom:1px solid rgba(94,23,235,0.2);padding:20px 24px;z-index:49;display:flex;flex-direction:column;gap:4px}
        .mobile-nav a{color:rgba(255,255,255,0.7);font-family:'Space Grotesk',sans-serif;font-size:15px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;padding:14px 0;border-bottom:1px solid rgba(255,255,255,0.06);cursor:pointer;transition:color 0.2s}
        .mobile-nav a:hover{color:#fff}
      `}</style>

      {/* ── SCROLL PROGRESS BAR — ref only, no React state ── */}
      <div ref={progressBarRef} style={{ position: 'fixed', top: 0, left: 0, height: '3px', background: `linear-gradient(90deg, ${P}, ${PL}, #C084FC)`, width: '0%', zIndex: 9999, boxShadow: `0 0 8px rgba(94,23,235,0.8)` }} />

      {/* Purple grid */}
      <div style={{ position: 'fixed', inset: 0, backgroundImage: `linear-gradient(rgba(94,23,235,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(94,23,235,0.03) 1px, transparent 1px)`, backgroundSize: '56px 56px', pointerEvents: 'none', zIndex: 0 }} />

      {/* ── NAVBAR ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        padding: '0 48px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: scrolled ? 'rgba(2,2,2,0.95)' : 'transparent',
        backdropFilter: scrolled ? 'blur(24px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(94,23,235,0.18)' : '1px solid transparent',
        transition: 'all 0.35s ease',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '34px', height: '34px', background: `linear-gradient(135deg, ${P}, ${PL})`, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 20px rgba(94,23,235,0.5)` }}>
            <Music size={16} color="#fff" />
          </div>
          <span style={{ fontFamily: "'Anton', sans-serif", fontSize: '20px', letterSpacing: '0.08em', color: '#F2EDE5' }}>IM MUSIC</span>
        </div>
        {/* Desktop links */}
        <div className="landing-nav-links" style={{ display: 'flex', alignItems: 'center', gap: '36px' }}>
          {[[t.nav.services,'#servicios'], [t.nav.pricing,'#precios'], [t.nav.artists,'#artistas']].map(([l, href]) => (
            <a key={l} href={href} style={{ color: 'rgba(255,255,255,0.45)', fontSize: '11px', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', cursor: 'pointer', transition: 'color 0.2s', textDecoration: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#F2EDE5')} onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}>
              {l}
            </a>
          ))}
          <LangToggleButton />
          <Magnet padding={40} magnetStrength={3}>
            <Btn3D small onClick={onEnter}>Entrar</Btn3D>
          </Magnet>
        </div>
        {/* Hamburger - mobile only */}
        <button className="landing-hamburger" onClick={() => setMobileMenuOpen(o => !o)}
          style={{ display: 'none', flexDirection: 'column', gap: '5px', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
          {[0,1,2].map(i => (
            <div key={i} style={{ width: '22px', height: '2px', background: mobileMenuOpen && i === 1 ? 'transparent' : '#F2EDE5', borderRadius: '2px', transition: 'all 0.25s ease',
              transform: mobileMenuOpen ? (i===0 ? 'rotate(45deg) translate(5px,5px)' : i===2 ? 'rotate(-45deg) translate(5px,-5px)' : 'none') : 'none' }} />
          ))}
        </button>
      </nav>
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="mobile-nav">
          {[['Servicios','#servicios'], ['Precios','#precios'], ['Artistas','#artistas']].map(([l, href]) => (
            <a key={l} href={href} onClick={() => setMobileMenuOpen(false)}>{l}</a>
          ))}
          <div style={{ paddingTop: '12px' }}>
            <Btn3D onClick={() => { setMobileMenuOpen(false); onEnter(); }} fullWidth>ENTRAR A LA PLATAFORMA</Btn3D>
          </div>
        </div>
      )}

      {/* ── HERO ── */}
      <section className="landing-hero-section" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', padding: '100px 72px 80px', position: 'relative', zIndex: 1, overflow: 'hidden', background: '#000', contain: 'layout style paint', transform: 'translateZ(0)' }}>
        {/* CSS gradient fallback — always visible */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 30% 50%, rgba(94,23,235,0.3) 0%, transparent 60%), radial-gradient(ellipse 60% 80% at 80% 20%, rgba(123,63,255,0.2) 0%, transparent 60%), #000', pointerEvents: 'none', zIndex: 0 }} />
        {/* LightPillar WebGL — loads after 1000ms, sits on top via mixBlendMode screen */}
        {showBg && (
          <LightPillarBoundary>
            <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
              <React.Suspense fallback={null}>
                <LightPillarLazy
                  topColor="#5E17EB"
                  bottomColor="#7B3FFF"
                  intensity={1.5}
                  rotationSpeed={0.5}
                  glowAmount={0.002}
                  pillarWidth={3}
                  pillarHeight={0.4}
                  noiseIntensity={0.5}
                  pillarRotation={25}
                  interactive={false}
                  mixBlendMode="screen"
                  quality="medium"
                />
              </React.Suspense>
            </div>
          </LightPillarBoundary>
        )}

        <div className="landing-hero-grid" style={{ maxWidth: '1340px', margin: '0 auto', width: '100%', display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '80px', alignItems: 'center', position: 'relative', zIndex: 2 }}>
          {/* Left: text */}
          <div>
            {/* Badge */}
            <div className="hero-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(94,23,235,0.14)', border: '1px solid rgba(94,23,235,0.4)', borderRadius: '100px', padding: '8px 20px', marginBottom: '36px' }}>
              <div style={{ width: '7px', height: '7px', background: '#22c55e', borderRadius: '50%', animation: 'pulse 1.5s ease-in-out infinite', flexShrink: 0 }} />
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '11px', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: PL }}>Plataforma activa — 50K+ artistas</span>
            </div>

            {/* Headline — staggered animation */}
            <h1 className="landing-hero-h1" style={{ fontFamily: "'Anton', sans-serif", fontSize: 'clamp(3.5rem, 7vw, 6rem)', lineHeight: 0.92, margin: '0 0 28px', letterSpacing: '-0.01em' }}>
              <span className="hero-line-1" style={{ display: 'block', color: '#F2EDE5' }}>{t.hero.title1}</span>
              <span className="hero-line-2" style={{ display: 'block', background: `linear-gradient(130deg, ${P} 0%, ${PL} 50%, #C084FC 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{t.hero.title2}</span>
              <span className="hero-line-3" style={{ display: 'block', color: '#F2EDE5' }}>{t.hero.title3}</span>
            </h1>

            {/* Rotating tagline */}
            <div className="hero-body" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', fontFamily: "'Space Grotesk', sans-serif", fontSize: '14px', fontWeight: 600, letterSpacing: '0.06em' }}>
              <span style={{ color: PL, fontSize: '12px' }}>▸</span>
              <RotatingText
                texts={t.hero.rotatingWords}
                rotationInterval={2500} splitBy="words" staggerDuration={0.04} staggerFrom="first"
                style={{ color: 'rgba(242,237,229,0.55)', fontFamily: "'Space Grotesk', sans-serif", fontSize: '13px', letterSpacing: '0.06em' }}
              />
            </div>

            <p className="hero-body" style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '17px', color: 'rgba(242,237,229,0.5)', lineHeight: 1.75, margin: '0 0 44px', maxWidth: '480px' }}>
              {t.hero.subtitle}
            </p>

            <div className="hero-cta landing-hero-cta" style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '52px', flexWrap: 'wrap' }}>
              <Magnet padding={60} magnetStrength={3}>
                <Btn3D onClick={onEnter}>{t.hero.cta} <ArrowRight size={16} /></Btn3D>
              </Magnet>
              <Magnet padding={60} magnetStrength={4}>
                <Btn3D variant="ghost" onClick={onEnter}><Play size={14} /> VER DEMO</Btn3D>
              </Magnet>
            </div>

            {/* Mini stats */}
            <div className="hero-stats" style={{ display: 'flex', gap: '36px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '32px', flexWrap: 'wrap' }}>
              {STATS.map(s => (
                <div key={s.label}>
                  <p style={{ fontFamily: "'Anton', sans-serif", fontSize: '30px', color: '#F2EDE5', margin: 0, letterSpacing: '0.02em' }}>
                    {s.prefix || ''}<AnimatedCounter target={s.num} suffix={s.suffix} />
                  </p>
                  <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '10px', color: 'rgba(242,237,229,0.3)', margin: '3px 0 0', textTransform: 'uppercase', letterSpacing: '0.12em' }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: CSS animated music dashboard — no WebGL */}
          <div className="landing-hero-card hero-card" style={{ position: 'relative', display: 'flex', justifyContent: 'center', animation: 'dashFloat 6s ease-in-out infinite' }}>
            {/* Main dashboard card */}
            <div style={{ width: '100%', maxWidth: '460px', background: 'rgba(10,5,20,0.85)', border: '1px solid rgba(94,23,235,0.3)', borderRadius: '28px', padding: '32px', backdropFilter: 'blur(24px)', boxShadow: '0 0 80px rgba(94,23,235,0.18), 0 40px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)' }}>
              {/* Card header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
                <div>
                  <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '11px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 4px' }}>STREAMS HOY</p>
                  <p style={{ fontFamily: "'Anton', sans-serif", fontSize: '36px', color: '#F2EDE5', margin: 0, letterSpacing: '-0.01em' }}>2,847</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: '100px', padding: '6px 12px' }}>
                  <TrendingUp size={13} color="#22c55e" />
                  <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '12px', fontWeight: 700, color: '#22c55e' }}>+18.4%</span>
                </div>
              </div>

              {/* Waveform bars — pure CSS animation */}
              <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', height: '72px', marginBottom: '28px' }}>
                {[45, 65, 38, 80, 55, 92, 40, 75, 60, 85, 50, 70, 42, 88, 58, 78, 44, 68, 90, 52].map((h, i) => (
                  <div key={i} style={{
                    flex: 1, borderRadius: '3px 3px 0 0',
                    background: i % 3 === 0 ? P : i % 3 === 1 ? PL : 'rgba(94,23,235,0.35)',
                    '--h': `${h}px`,
                    height: '20px',
                    animation: `waveBar ${1.2 + (i % 5) * 0.3}s ease-in-out infinite`,
                    animationDelay: `${i * 0.08}s`,
                  } as React.CSSProperties} />
                ))}
              </div>

              {/* Platform pills */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
                {[
                  { name: 'Spotify', color: '#1DB954', streams: '1.2K' },
                  { name: 'Apple', color: '#FC3C44', streams: '843' },
                  { name: 'YouTube', color: '#FF0000', streams: '612' },
                  { name: 'TikTok', color: '#69C9D0', streams: '190' },
                ].map(p => (
                  <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '6px 10px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: p.color, flexShrink: 0 }} />
                    <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>{p.name}</span>
                    <span style={{ fontFamily: "'Anton', sans-serif", fontSize: '12px', color: '#F2EDE5' }}>{p.streams}</span>
                  </div>
                ))}
              </div>

              {/* Royalties row */}
              <div style={{ background: 'rgba(94,23,235,0.1)', border: '1px solid rgba(94,23,235,0.2)', borderRadius: '14px', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '10px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 4px' }}>REGALÍAS PENDIENTES</p>
                  <p style={{ fontFamily: "'Anton', sans-serif", fontSize: '24px', color: '#F2EDE5', margin: 0 }}>$342.80</p>
                </div>
                <div style={{ width: '40px', height: '40px', background: `linear-gradient(135deg, ${P}, ${PL})`, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 20px rgba(94,23,235,0.4)` }}>
                  <DollarSign size={18} color="#fff" />
                </div>
              </div>
            </div>

            {/* Floating badge top-right */}
            <div style={{ position: 'absolute', top: '-16px', right: '-16px', background: 'rgba(5,5,15,0.9)', border: '1px solid rgba(94,23,235,0.4)', borderRadius: '12px', padding: '10px 14px', backdropFilter: 'blur(16px)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', gap: '8px', animation: 'dashFloat 5s ease-in-out infinite', animationDelay: '1s' }}>
              <Globe size={14} color={PL} />
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.85)', letterSpacing: '0.05em' }}>150+ Plataformas</span>
            </div>

            {/* Floating badge bottom-left */}
            <div style={{ position: 'absolute', bottom: '-16px', left: '-16px', background: 'rgba(5,5,15,0.9)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '12px', padding: '10px 14px', backdropFilter: 'blur(16px)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', gap: '8px', animation: 'dashFloat 7s ease-in-out infinite', animationDelay: '2s' }}>
              <Zap size={14} color="#22c55e" />
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.85)', letterSpacing: '0.05em' }}>IA Integrada</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── MARQUEE ── */}
      <div style={{ marginTop: '80px', position: 'relative', zIndex: 1 }}>
        <Marquee />
        <div style={{ marginTop: '2px' }}><Marquee reverse /></div>
      </div>

      {/* ── STATS BAR ── */}
      <section className="landing-stats-section" style={{ background: `linear-gradient(135deg, rgba(94,23,235,0.15) 0%, rgba(45,11,107,0.25) 100%)`, borderTop: '1px solid rgba(94,23,235,0.2)', borderBottom: '1px solid rgba(94,23,235,0.2)', padding: '64px 48px', position: 'relative', zIndex: 1, overflow: 'hidden', backdropFilter: 'blur(10px)' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '600px', height: '300px', background: `radial-gradient(ellipse, rgba(94,23,235,0.12) 0%, transparent 70%)`, pointerEvents: 'none' }} />
        <div className="landing-stats-grid" style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0', position: 'relative' }}>
          {[
            { end: 150, suffix: '+', label: 'Plataformas globales', icon: Globe, color: '#5E17EB' },
            { end: 50, suffix: 'K+', label: 'Artistas activos', icon: Users, color: '#C084FC' },
            { end: 2, suffix: 'M+', prefix: '$', label: 'En regalías pagadas', icon: DollarSign, color: '#22c55e' },
            { end: 98, suffix: '%', label: 'Tasa de satisfacción', icon: Star, color: '#f59e0b' },
          ].map((stat, i) => (
            <div key={i} className={`reveal reveal-delay-${i + 1}`} style={{ textAlign: 'center', padding: '0 24px', borderRight: i < 3 ? '1px solid rgba(94,23,235,0.2)' : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}><Icon3D icon={stat.icon} color={stat.color} size={40} /></div>
              <div style={{ fontFamily: "'Anton', sans-serif", fontSize: 'clamp(2.5rem, 4vw, 3.75rem)', color: '#F2EDE5', letterSpacing: '-0.02em', lineHeight: 1, marginBottom: '10px' }}>
                {stat.prefix || ''}<CountUp end={stat.end} suffix={stat.suffix} duration={2000} />
              </div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── SERVICES ── */}
      <section id="servicios" className="landing-section-padding" style={{ padding: '120px 48px', position: 'relative', zIndex: 1, background: '#000' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(94,23,235,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(94,23,235,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(94,23,235,0.03) 1px, transparent 1px)', backgroundSize: '60px 60px', pointerEvents: 'none' }} />
        <div style={{ textAlign: 'center', marginBottom: '72px' }}>
          <span className="reveal" style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '11px', fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', color: PL, display: 'block', marginBottom: '16px' }}>LO QUE OFRECEMOS</span>
          <h2 className="reveal reveal-delay-1 landing-services-title" style={{ fontFamily: "'Anton', sans-serif", fontSize: 'clamp(2.5rem, 5vw, 3.75rem)', color: '#F2EDE5', margin: '0 0 8px', letterSpacing: '0.01em' }}>
            TODO LO QUE NECESITAS
          </h2>
          <h2 className="reveal reveal-delay-2" style={{ fontFamily: "'Anton', sans-serif", fontSize: 'clamp(2.5rem, 5vw, 3.75rem)', margin: '0', letterSpacing: '0.01em' }}>
            <span style={{ background: `linear-gradient(135deg, ${P}, ${PL})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>EN UNA PLATAFORMA</span>
          </h2>
        </div>
        {/* Service cards grid */}
        <div className="reveal reveal-delay-2" style={{ maxWidth: '1200px', margin: '0 auto 60px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {SERVICES.map((s, i) => (
            <ServiceCard key={i} icon={s.icon} color={s.color} title={s.title} desc={s.desc} />
          ))}
        </div>
        {/* Pure CSS scroll-snap feature carousel — zero WebGL */}
        <div className="reveal reveal-delay-3" style={{ width: '100%', background: '#050505', borderRadius: '24px', border: '1px solid rgba(94,23,235,0.12)', padding: '40px 0 32px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', gap: '20px', overflowX: 'auto', scrollSnapType: 'x mandatory', padding: '0 40px 16px', scrollbarWidth: 'none' }}>
            {[
              { icon: Disc, label: 'Distribución Digital', sub: '150+ plataformas globales', color: '#5E17EB' },
              { icon: Sparkles, label: 'Marketing con IA', sub: 'Estrategias automatizadas', color: '#7B3FFF' },
              { icon: Users, label: 'Agentes IA 24/7', sub: 'Soporte inteligente siempre', color: '#C084FC' },
              { icon: DollarSign, label: 'Gestión de Regalías', sub: 'Cobros en tiempo real', color: '#5E17EB' },
              { icon: Video, label: 'Videos Musicales', sub: 'Producción y distribución', color: '#7B3FFF' },
              { icon: CreditCard, label: 'Financiamiento', sub: 'Adelanto de regalías', color: '#C084FC' },
            ].map((item, i) => (
              <div key={i} style={{ flexShrink: 0, width: '220px', scrollSnapAlign: 'center', background: `linear-gradient(135deg, ${item.color}10 0%, transparent 100%)`, border: `1px solid ${item.color}30`, borderRadius: '20px', padding: '36px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', transition: 'border-color 0.25s, box-shadow 0.25s' }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = item.color + '70'; el.style.boxShadow = `0 0 30px ${item.color}20`; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = item.color + '30'; el.style.boxShadow = 'none'; }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '18px', background: `${item.color}20`, border: `1px solid ${item.color}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 20px ${item.color}20` }}>
                  <item.icon size={26} color={item.color} />
                </div>
                <span style={{ fontFamily: "'Anton', sans-serif", fontSize: '15px', color: '#F2EDE5', letterSpacing: '0.04em' }}>{item.label}</span>
                <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.38)', lineHeight: 1.5 }}>{item.sub}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── POR QUÉ NOSOTROS ── */}
      <section className="landing-section-padding" style={{ padding: '80px 48px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <span className="reveal" style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '11px', fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', color: PL, display: 'block', marginBottom: '16px' }}>NUESTRA VENTAJA</span>
            <h2 className="reveal reveal-delay-1" style={{ fontFamily: "'Anton', sans-serif", fontSize: 'clamp(2.2rem, 4vw, 3.5rem)', color: '#F2EDE5', margin: 0, letterSpacing: '0.01em' }}>
              POR QUÉ <span style={{ color: P }}>IM MUSIC</span>
            </h2>
          </div>
          <div className="landing-why-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
            {[
              { icon: Zap, title: 'Velocidad', desc: 'Lanza en menos de 24h. Sin burocracia, sin esperas. Tu música llega rápido.' },
              { icon: DollarSign, title: 'Más ingresos', desc: '0% comisión en todas las regalías. 100% de tus ganancias, siempre.' },
              { icon: Sparkles, title: 'IA de primera', desc: 'Herramientas de IA entrenadas específicamente para la industria musical.' },
              { icon: Shield, title: 'Seguridad total', desc: 'Contratos digitales, splits automatizados, pagos verificados y seguros.' },
            ].map((d, i) => (
              <div key={i} className={`reveal reveal-delay-${i + 1}`}
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '32px 24px', transition: 'all 0.3s ease' }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.background = 'rgba(94,23,235,0.1)'; el.style.borderColor = 'rgba(94,23,235,0.35)'; el.style.boxShadow = '0 0 30px rgba(94,23,235,0.12)'; el.style.transform = 'translateY(-4px)'; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.background = 'rgba(255,255,255,0.02)'; el.style.borderColor = 'rgba(255,255,255,0.06)'; el.style.boxShadow = 'none'; el.style.transform = 'none'; }}
              >
                <div style={{ width: '48px', height: '48px', background: `rgba(94,23,235,0.15)`, borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', border: '1px solid rgba(94,23,235,0.3)' }}>
                  <d.icon size={22} color={PL} />
                </div>
                <h3 style={{ fontFamily: "'Anton', sans-serif", fontSize: '22px', color: '#F2EDE5', margin: '0 0 10px', letterSpacing: '0.03em' }}>{d.title}</h3>
                <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '15px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, margin: 0 }}>{d.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ARTISTS CAROUSEL ── */}
      <section id="artistas" style={{ padding: '100px 0', position: 'relative', zIndex: 1, overflow: 'hidden' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 48px', marginBottom: '48px' }}>
          <div style={{ textAlign: 'center' }}>
            <span className="reveal" style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '11px', fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', color: PL, display: 'block', marginBottom: '16px' }}>ARTISTAS QUE CONFÍAN</span>
            <h2 className="reveal reveal-delay-1" style={{ fontFamily: "'Anton', sans-serif", fontSize: 'clamp(2.2rem, 4vw, 3.5rem)', color: '#F2EDE5', margin: 0, letterSpacing: '0.01em' }}>
              HISTORIAS DE <span style={{ color: P }}>ÉXITO</span>
            </h2>
          </div>
        </div>
        <div className="artist-carousel" style={{ display: 'flex', gap: '20px', padding: '16px 48px 32px', overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' as any }}>
          {ARTISTS.map((artist, i) => (
            <div key={i} style={{ flexShrink: 0, width: '220px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '28px 20px', textAlign: 'center', transition: 'all 0.3s ease', cursor: 'default' }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = 'translateY(-8px)'; el.style.borderColor = artist.color + '60'; el.style.boxShadow = `0 20px 40px rgba(0,0,0,0.4), 0 0 30px ${artist.color}25`; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = 'translateY(0)'; el.style.borderColor = 'rgba(255,255,255,0.08)'; el.style.boxShadow = 'none'; }}
            >
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: `linear-gradient(135deg, ${artist.color}, ${artist.color}80)`, border: `2px solid ${artist.color}60`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', flexShrink: 0 }}>
                <span style={{ fontFamily: "'Anton', sans-serif", fontSize: '26px', color: '#fff', letterSpacing: 0 }}>{artist.name[0]}</span>
              </div>
              <h4 style={{ fontFamily: "'Anton', sans-serif", fontSize: '16px', color: '#fff', margin: '0 0 4px', letterSpacing: '0.03em' }}>{artist.name}</h4>
              <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '11px', color: 'rgba(255,255,255,0.35)', margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{artist.genre}</p>
              <div style={{ background: `${artist.color}15`, border: `1px solid ${artist.color}30`, borderRadius: '100px', padding: '4px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Headphones size={11} color={artist.color} />
                <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '12px', fontWeight: 700, color: artist.color }}>{artist.streams} streams</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="landing-section-padding" style={{ padding: '80px 48px', position: 'relative', zIndex: 1, background: 'rgba(5,5,15,0.6)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <span className="reveal" style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '11px', fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', color: PL, display: 'block', marginBottom: '16px' }}>TESTIMONIOS</span>
            <h2 className="reveal reveal-delay-1" style={{ fontFamily: "'Anton', sans-serif", fontSize: 'clamp(2.2rem, 3.5vw, 3.5rem)', color: '#F2EDE5', margin: 0 }}>LO QUE DICEN LOS ARTISTAS</h2>
          </div>
          <div className="landing-testimonials-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            {[
              { quote: '"IM Music cambió todo para mí. Mis regalías llegaron a tiempo por primera vez en mi carrera."', name: 'Luna Vera', role: 'R&B Artist', stars: 5 },
              { quote: '"El split automático con mi productor funciona perfecto. Cero drama, cero confusion, puro dinero."', name: 'Niko Beats', role: 'Trap Producer', stars: 5 },
              { quote: '"El marketing con IA me generó una estrategia que triplicó mis seguidores en 3 meses."', name: 'Mía Solar', role: 'Pop Artist', stars: 5 },
            ].map((t, i) => (
              <div key={i} className={`reveal reveal-delay-${i + 1}`} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '32px', position: 'relative', transition: 'all 0.3s ease' }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = 'rgba(94,23,235,0.35)'; el.style.boxShadow = '0 0 30px rgba(94,23,235,0.1)'; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = 'rgba(255,255,255,0.07)'; el.style.boxShadow = 'none'; }}>
                <div style={{ position: 'absolute', top: '20px', right: '24px', display: 'flex', gap: '3px' }}>
                  {Array.from({ length: t.stars }).map((_, si) => <Star key={si} size={12} color="#fbbf24" fill="#fbbf24" />)}
                </div>
                <div style={{ fontSize: '40px', color: P, lineHeight: 1, marginBottom: '16px', fontFamily: 'Georgia, serif' }}>"</div>
                <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '15px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, margin: '0 0 24px', fontStyle: 'italic' }}>{t.quote.slice(1, -1)}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: `linear-gradient(135deg, ${P}, ${PL})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <User size={16} color="#fff" />
                  </div>
                  <div>
                    <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '14px', fontWeight: 700, color: '#fff', margin: 0 }}>{t.name}</p>
                    <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '11px', color: 'rgba(255,255,255,0.35)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="precios" className="landing-section-padding" style={{ padding: '120px 48px', position: 'relative', zIndex: 1, background: '#000', overflow: 'hidden' }}>
        {/* Large purple glow orb */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '800px', height: '800px', background: 'radial-gradient(circle, rgba(94,23,235,0.08) 0%, transparent 65%)', pointerEvents: 'none', filter: 'blur(60px)' }} />
        <div style={{ maxWidth: '1100px', margin: '0 auto', position: 'relative' }}>
          <div style={{ textAlign: 'center', marginBottom: '72px' }}>
            <span className="reveal" style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '11px', fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', color: PL, display: 'block', marginBottom: '16px' }}>PLANES Y PRECIOS</span>
            <h2 className="reveal reveal-delay-1" style={{ fontFamily: "'Anton', sans-serif", fontSize: 'clamp(2.5rem, 4.5vw, 3.75rem)', color: '#F2EDE5', margin: '0 0 12px', letterSpacing: '0.01em' }}>ELIGE TU PLAN</h2>
            <p className="reveal reveal-delay-2" style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '16px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, margin: 0 }}>Sin compromisos. Precios en pesos colombianos. Cambia cuando quieras.</p>
          </div>
          <div className="landing-pricing-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', alignItems: 'center' }}>
            {PLANS.map((plan, i) => (
              <PlanCard key={i} plan={plan} onSelect={(el) => { fireConfetti(el); onEnter(); }} />
            ))}
          </div>
        </div>
      </section>

      {/* ── LABEL PLANS ── */}
      <section style={{ padding: '80px 48px', position: 'relative', zIndex: 1, background: '#000' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase' as any, color: '#f59e0b', display: 'block', marginBottom: 16 }}>PARA SELLOS Y ESTUDIOS</span>
            <h2 style={{ fontFamily: "'Anton',sans-serif", fontSize: 'clamp(2.5rem,4.5vw,3.75rem)', color: '#F2EDE5', margin: '0 0 12px' }}>GESTIONA TODO TU ROSTER</h2>
            <p style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 16, color: 'rgba(255,255,255,0.4)' }}>Un panel para controlar múltiples artistas, regalías y distribución.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24, alignItems: 'center' }}>
            {[
              {
                name: 'LABEL STARTER', price: '$890.000', cop: 'COP/mes', featured: false, maxArtists: 5,
                features: ['Hasta 5 artistas en tu roster', 'Panel de sello unificado', 'Dashboard consolidado de regalías', 'Splits automáticos sello/artista', 'Distribución ilimitada por artista', '0% comisión plataforma'],
                cta: 'EMPEZAR SELLO',
              },
              {
                name: 'LABEL PRO', price: '$1.900.000', cop: 'COP/mes', featured: true, maxArtists: 15,
                features: ['Hasta 15 artistas en tu roster', 'Todo lo de Label Starter', 'IA marketing para cada artista', 'Mercado objetivo por artista', 'Meta Ads para el roster', 'Reportes avanzados del sello', 'Soporte prioritario 24/7'],
                cta: 'EMPEZAR LABEL PRO',
              },
              {
                name: 'ENTERPRISE', price: null as string | null, cop: null as string | null, featured: false, maxArtists: null as number | null,
                features: ['Artistas ilimitados', 'Todo lo de Label Pro', 'Integración API personalizada', 'Servicio dedicado', 'Precio según tamaño del roster'],
                cta: 'AGENDAR REUNIÓN',
              },
            ].map((plan, i) => (
              <div key={i} style={{ background: plan.featured ? 'linear-gradient(160deg, rgba(94,23,235,0.25), rgba(123,63,255,0.15))' : 'rgba(255,255,255,0.03)', border: `1px solid ${plan.featured ? 'rgba(94,23,235,0.7)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 24, padding: '32px 28px', transform: plan.featured ? 'scale(1.05)' : 'none', position: 'relative' as any }}>
                {plan.featured && <div style={{ position: 'absolute', top: 16, right: 16, background: `linear-gradient(135deg, ${P}, ${PL})`, padding: '5px 14px', borderRadius: 100, fontFamily: "'Anton',sans-serif", fontSize: 10, letterSpacing: '0.2em', color: '#fff', zIndex: 1 }}>MÁS POPULAR</div>}
                <p style={{ fontFamily: "'Anton',sans-serif", fontSize: 13, color: plan.featured ? '#C084FC' : '#f59e0b', letterSpacing: '0.25em', margin: '0 0 12px' }}>{plan.name}</p>
                {plan.price ? (
                  <>
                    <span style={{ fontFamily: "'Anton',sans-serif", fontSize: 36, color: '#F2EDE5', letterSpacing: '-0.02em' }}>{plan.price}</span>
                    <p style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.35)', margin: '4px 0 20px' }}>{plan.cop}</p>
                  </>
                ) : (
                  <div style={{ marginBottom: 20 }}>
                    <p style={{ fontFamily: "'Anton',sans-serif", fontSize: 22, color: '#F2EDE5', margin: '0 0 8px' }}>PRECIO A MEDIDA</p>
                    <p style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: 0 }}>Según tamaño del roster</p>
                  </div>
                )}
                <div style={{ height: 1, background: plan.featured ? `linear-gradient(90deg,transparent,rgba(94,23,235,0.5),transparent)` : 'rgba(255,255,255,0.06)', margin: '0 0 20px' }} />
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px' }}>
                  {plan.features.map((f, fi) => (
                    <li key={fi} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', fontFamily: "'Space Grotesk',sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
                      <Check size={14} color={plan.featured ? '#C084FC' : '#f59e0b'} style={{ flexShrink: 0 }} />{f}
                    </li>
                  ))}
                </ul>
                {plan.price ? (
                  <Btn3D fullWidth variant={plan.featured ? 'primary' : 'ghost'} onClick={onEnter}>{plan.cta}</Btn3D>
                ) : (
                  <a href="https://wa.me/573XXXXXXXXX?text=Hola%2C%20quiero%20información%20sobre%20el%20plan%20Enterprise%20de%20IM%20Music" target="_blank" rel="noopener noreferrer"
                    style={{ display: 'block', width: '100%', background: 'linear-gradient(135deg, #F2EDE5, #fff)', color: '#000', borderRadius: 14, padding: '15px', fontFamily: "'Anton',sans-serif", fontSize: 12, letterSpacing: '0.15em', textTransform: 'uppercase' as any, textAlign: 'center' as any, textDecoration: 'none', boxShadow: '0 6px 0 rgba(0,0,0,0.3)' }}>
                    AGENDAR REUNIÓN →
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="landing-section-padding" style={{ padding: '120px 48px', position: 'relative', zIndex: 1, textAlign: 'center', background: '#000', overflow: 'hidden' }}>
        {/* Massive orb */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '1000px', height: '1000px', background: `radial-gradient(circle, rgba(94,23,235,0.12) 0%, transparent 65%)`, pointerEvents: 'none', filter: 'blur(40px)' }} />
        {/* Rotating ring */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', width: '600px', height: '600px', border: '1px solid rgba(94,23,235,0.08)', borderRadius: '50%', pointerEvents: 'none', animation: 'ctaSpin 30s linear infinite' }} />
        <div style={{ maxWidth: '700px', margin: '0 auto', position: 'relative' }}>
          <div className="reveal" style={{ width: '88px', height: '88px', background: `linear-gradient(135deg, ${P}, ${PL})`, borderRadius: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px', boxShadow: `0 0 80px rgba(94,23,235,0.6), 0 20px 40px rgba(94,23,235,0.3)` }}>
            <Music size={40} color="#fff" />
          </div>
          <h2 className="reveal reveal-delay-1" style={{ fontFamily: "'Anton', sans-serif", fontSize: 'clamp(2.8rem, 5.5vw, 4.5rem)', color: '#F2EDE5', margin: '0 0 20px', letterSpacing: '0.01em', lineHeight: 1.05 }}>
            EMPIEZA HOY.<br />
            <ShinyText text="ES GRATIS." color={`rgba(255,255,255,0.5)`} shineColor="#fff" speed={1.5} spread={100}
              style={{ fontFamily: "'Anton', sans-serif", fontSize: 'inherit', letterSpacing: '0.01em' }} />
          </h2>
          <p className="reveal reveal-delay-2" style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '17px', color: 'rgba(255,255,255,0.5)', margin: '0 0 48px', lineHeight: 1.7 }}>Sin tarjeta de crédito. Sin contratos. Cancela cuando quieras.</p>
          <div className="reveal reveal-delay-3" style={{ display: 'flex', gap: '16px', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
            <Magnet padding={60} magnetStrength={2}>
              <Btn3D onClick={onEnter}>CREAR CUENTA GRATIS <ArrowRight size={16} /></Btn3D>
            </Magnet>
            <Magnet padding={60} magnetStrength={3}>
              <Btn3D variant="ghost" onClick={onEnter}>VER DEMO <Play size={14} /></Btn3D>
            </Magnet>
          </div>
          <p className="reveal reveal-delay-4" style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.2)', marginTop: '24px', letterSpacing: '0.05em' }}>
            50,000+ artistas ya confían en IM Music · Distribución activa en 150+ plataformas
          </p>
        </div>
      </section>

      {/* ── FOOTER (4 columns) ── */}
      <footer style={{ borderTop: '1px solid rgba(94,23,235,0.15)', padding: '64px 48px 32px', position: 'relative', zIndex: 1, background: 'rgba(5,3,12,1)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div className="landing-footer-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '48px', marginBottom: '48px' }}>
            {/* Brand */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div style={{ width: '32px', height: '32px', background: `linear-gradient(135deg, ${P}, ${PL})`, borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 16px rgba(94,23,235,0.4)` }}>
                  <Music size={15} color="#fff" />
                </div>
                <span style={{ fontFamily: "'Anton', sans-serif", fontSize: '20px', letterSpacing: '0.05em' }}>IM MUSIC</span>
              </div>
              <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.35)', lineHeight: 1.7, maxWidth: '280px', margin: '0 0 20px' }}>
                La plataforma todo-en-uno para artistas independientes que quieren controlar su carrera musical.
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['SP', 'AP', 'YT', 'TK'].map(p => (
                  <div key={p} style={{ width: '32px', height: '32px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontFamily: "'Anton', sans-serif", fontSize: '9px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.05em' }}>{p}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Producto */}
            <div>
              <h4 style={{ fontFamily: "'Anton', sans-serif", fontSize: '13px', color: '#fff', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '20px' }}>Producto</h4>
              {['Distribución', 'Regalías', 'Marketing IA', 'Publishing', 'Analytics'].map(l => (
                <div key={l} style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.35)', marginBottom: '10px', cursor: 'pointer', transition: 'color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}>{l}</div>
              ))}
            </div>
            {/* Soporte */}
            <div>
              <h4 style={{ fontFamily: "'Anton', sans-serif", fontSize: '13px', color: '#fff', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '20px' }}>Soporte</h4>
              {['Centro de ayuda', 'Contacto', 'Status', 'Blog', 'Tutoriales'].map(l => (
                <div key={l} style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.35)', marginBottom: '10px', cursor: 'pointer', transition: 'color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}>{l}</div>
              ))}
            </div>
            {/* Legal */}
            <div>
              <h4 style={{ fontFamily: "'Anton', sans-serif", fontSize: '13px', color: '#fff', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '20px' }}>Legal</h4>
              {[
                { label: 'Privacidad', screen: 'privacy' as Screen },
                { label: 'Términos de uso', screen: 'terms' as Screen },
                { label: 'Cookies', screen: null },
                { label: 'DMCA', screen: null },
                { label: 'Licencias', screen: null },
              ].map(({ label, screen }) => (
                <div key={label} style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.35)', marginBottom: '10px', cursor: 'pointer', transition: 'color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}
                  onClick={() => screen && onNav?.(screen)}>{label}</div>
              ))}
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.05em' }}>© 2026 IM Music. Todos los derechos reservados.</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '6px', height: '6px', background: '#22c55e', borderRadius: '50%', animation: 'pulse 2s ease-in-out infinite' }} />
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '11px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.08em' }}>Todos los sistemas operativos</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function ServiceCard({ icon: Icon, color = P, title, desc }: { key?: React.Key; icon: any; color?: string; title: string; desc: string }) {
  return (
    <SpotlightCard
      spotlightColor={`${color}50`}
      style={{ padding: '32px', borderRadius: '20px' }}
    >
      <div>
        <div style={{ marginBottom: '20px' }}>
          <Icon3D icon={Icon} color={color} size={56} />
        </div>
        <h3 style={{ fontFamily: "'Anton', sans-serif", fontSize: '18px', color: '#fff', margin: '0 0 10px', letterSpacing: '0.03em' }}>{title}</h3>
        <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, margin: 0 }}>{desc}</p>
      </div>
    </SpotlightCard>
  );
}

function PlanCard({ plan, onSelect }: { key?: React.Key; plan: typeof PLANS[0]; onSelect: (el?: HTMLElement) => void }) {
  const [hover, setHover] = useState(false);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const cardRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLDivElement>(null);
  const isElite = plan.name === 'ÉLITE 360';

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ rx: -y * 10, ry: x * 10 });
  };

  return (
    <div className={`reveal reveal-delay-${plan.name === 'INDIE' ? 1 : plan.name === 'PRO' ? 2 : 3}`} style={{ perspective: '800px' }}>
      <div
        ref={cardRef}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => { setHover(false); setTilt({ rx: 0, ry: 0 }); }}
        onMouseMove={handleMouseMove}
        className={plan.featured ? 'featured-plan' : ''}
        style={{
          background: plan.featured
            ? `linear-gradient(160deg, rgba(94,23,235,0.25) 0%, rgba(123,63,255,0.15) 50%, rgba(94,23,235,0.1) 100%)`
            : isElite
              ? 'linear-gradient(160deg, rgba(212,175,55,0.12) 0%, rgba(255,215,0,0.06) 100%)'
              : 'rgba(255,255,255,0.03)',
          border: `1px solid ${plan.featured ? 'rgba(94,23,235,0.7)' : isElite ? 'rgba(212,175,55,0.45)' : hover ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.07)'}`,
          borderRadius: '24px', padding: '36px 28px',
          transform: plan.featured
            ? `scale(1.05) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`
            : `translateY(${hover ? '-6px' : '0'}) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
          transition: hover ? 'transform 0.12s ease, border-color 0.3s' : 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1), border-color 0.3s',
          position: 'relative', overflow: 'hidden',
          transformStyle: 'preserve-3d',
          cursor: 'pointer',
        }}
      >
        {plan.badge && (
          <div style={{ position: 'absolute', top: '16px', right: '16px', background: plan.featured ? `linear-gradient(135deg, ${P}, ${PL})` : 'linear-gradient(135deg, #d4af37, #ffd700)', padding: '5px 14px', borderRadius: '100px', fontFamily: "'Anton', sans-serif", fontSize: '10px', letterSpacing: '0.2em', color: plan.featured ? '#fff' : '#000', boxShadow: plan.featured ? `0 0 20px rgba(94,23,235,0.6)` : '0 0 20px rgba(212,175,55,0.5)', zIndex: 1 }}>
            {plan.badge}
          </div>
        )}
        {plan.featured && (
          <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 50% 0%, rgba(94,23,235,0.2) 0%, transparent 65%)`, pointerEvents: 'none' }} />
        )}
        <p style={{ fontFamily: "'Anton', sans-serif", fontSize: '13px', color: plan.featured ? '#C084FC' : isElite ? '#d4af37' : PL, letterSpacing: '0.25em', margin: '0 0 16px' }}>{plan.name}</p>

        {plan.price ? (
          <div style={{ marginBottom: 4 }}>
            <span style={{ fontFamily: "'Anton', sans-serif", fontSize: 40, color: '#F2EDE5', letterSpacing: '-0.02em', textShadow: plan.featured ? `0 0 40px rgba(94,23,235,0.6)` : 'none' }}>{plan.price}</span>
          </div>
        ) : (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: "'Anton', sans-serif", fontSize: 22, color: '#F2EDE5', lineHeight: 1.2, marginBottom: 8 }}>PRECIO A MEDIDA</div>
            <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: 0, lineHeight: 1.6 }}>
              Servicio completo con equipo humano dedicado. Agenda una reunión y diseñamos tu plan.
            </p>
          </div>
        )}

        {plan.cop && (
          <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.35)', margin: '0 0 20px', letterSpacing: '0.05em' }}>{plan.cop}</p>
        )}

        <div style={{ height: '1px', background: plan.featured ? `linear-gradient(90deg, transparent, rgba(94,23,235,0.5), transparent)` : isElite ? 'linear-gradient(90deg,transparent,rgba(212,175,55,0.3),transparent)' : 'rgba(255,255,255,0.06)', margin: '0 0 20px' }} />
        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px' }}>
          {plan.features.map((f, i) => (
            <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 0', fontFamily: "'Space Grotesk', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
              <Check size={15} color={plan.featured ? '#C084FC' : isElite ? '#d4af37' : PL} style={{ flexShrink: 0 }} />{f}
            </li>
          ))}
        </ul>
        <div ref={btnRef}>
          {isElite ? (
            <a
              href="https://wa.me/573XXXXXXXXX?text=Hola%2C%20quiero%20información%20sobre%20el%20plan%20Élite%20360%20de%20IM%20Music"
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'block', width: '100%', background: 'linear-gradient(135deg, #F2EDE5, #fff)', color: '#000', borderRadius: 14, padding: '15px 36px', minHeight: 52, fontFamily: "'Anton', sans-serif", fontSize: 13, letterSpacing: '0.15em', textTransform: 'uppercase', textAlign: 'center', textDecoration: 'none', boxShadow: '0 6px 0 rgba(0,0,0,0.3), 0 0 30px rgba(242,237,229,0.2)', transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)', boxSizing: 'border-box' as const }}
              onMouseEnter={e => { const el = e.currentTarget; el.style.transform = 'translateY(-4px)'; el.style.boxShadow = '0 10px 0 rgba(0,0,0,0.3), 0 0 40px rgba(242,237,229,0.3)'; }}
              onMouseLeave={e => { const el = e.currentTarget; el.style.transform = ''; el.style.boxShadow = '0 6px 0 rgba(0,0,0,0.3), 0 0 30px rgba(242,237,229,0.2)'; }}>
              {plan.cta}
            </a>
          ) : (
            <Btn3D fullWidth variant={plan.featured ? 'primary' : 'ghost'} onClick={() => onSelect(btnRef.current ?? undefined)}>{plan.cta}</Btn3D>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── LOGIN PAGE ───────────────────────────────────────────────────────────────
function LoginPage({ onLogin, onBack }: { onLogin: (u: any) => void; onBack: () => void }) {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const body = tab === 'login' ? { email, password } : { email, password, name };
      const endpoint = tab === 'login' ? '/auth/login' : '/auth/register';
      const data = await apiFetch(endpoint, { method: 'POST', body: JSON.stringify(body) });
      localStorage.setItem('im_token', data.token);
      onLogin(data.user);
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  const inputStyle: React.CSSProperties = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '14px 16px', color: '#fff', fontFamily: "'Space Grotesk', sans-serif", fontSize: '14px', outline: 'none', width: '100%', boxSizing: 'border-box', transition: 'border-color 0.2s' };

  return (
    <div style={{ minHeight: '100vh', background: '#020202', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', position: 'relative', overflow: 'hidden' }}>
      {/* Pure CSS background — no WebGL */}
      <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse 100% 80% at 50% 0%, rgba(94,23,235,0.22) 0%, transparent 60%), #020202', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', inset: 0, backgroundImage: `linear-gradient(rgba(94,23,235,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(94,23,235,0.04) 1px, transparent 1px)`, backgroundSize: '56px 56px', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', top: '-200px', left: '50%', transform: 'translateX(-50%)', width: '800px', height: '600px', background: `radial-gradient(ellipse, rgba(94,23,235,0.15) 0%, transparent 65%)`, pointerEvents: 'none' }} />

      <div className="page-in" style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 1 }}>
        {/* Back to landing */}
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', fontFamily: "'Space Grotesk', sans-serif", fontSize: '12px', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '32px', padding: 0, transition: 'color 0.2s' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#fff')} onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}>
          ← Volver al inicio
        </button>

        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ width: '60px', height: '60px', background: `linear-gradient(135deg, ${P}, ${PL})`, borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: `0 0 40px rgba(94,23,235,0.4)` }}>
            <Music size={26} color="#fff" />
          </div>
          <h1 style={{ fontFamily: "'Anton', sans-serif", fontSize: '32px', letterSpacing: '0.03em', color: '#fff', margin: '0 0 4px' }}>IM MUSIC</h1>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px', fontFamily: "'Space Grotesk', sans-serif" }}>
            {tab === 'login' ? 'Accede a tu cuenta' : 'Crea tu cuenta gratuita'}
          </p>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '24px', padding: '32px', backdropFilter: 'blur(24px)' }}>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '24px', background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '4px' }}>
            {(['login', 'register'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: '10px', borderRadius: '10px', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: '13px', border: 'none', cursor: 'pointer', transition: 'all 0.2s', background: tab === t ? P : 'transparent', color: tab === t ? '#fff' : 'rgba(255,255,255,0.35)', boxShadow: tab === t ? `0 0 20px rgba(94,23,235,0.3)` : 'none' }}>
                {t === 'login' ? 'Iniciar sesión' : 'Registrarse'}
              </button>
            ))}
          </div>
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {tab === 'register' && <input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre artístico" style={inputStyle} />}
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required style={inputStyle} />
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Contraseña" required style={inputStyle} />
            {error && <p style={{ color: '#f87171', fontSize: '13px', margin: 0, fontFamily: "'Space Grotesk', sans-serif" }}>{error}</p>}
            <Btn3D type="submit" disabled={loading} fullWidth>
              {loading ? 'Cargando...' : tab === 'login' ? 'ENTRAR' : 'CREAR CUENTA'}
            </Btn3D>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── SIDEBAR ─────────────────────────────────────────────────────────────────
const MODULES = [
  { id: 'dashboard',       label: 'Dashboard',        icon: LayoutDashboard, group: 'General' },
  // MÚSICA
  { id: 'catalog',         label: 'Catálogo & Distribución', icon: Music,      group: 'Música' },
  { id: 'royalties',       label: 'Regalías',          icon: DollarSign,      group: 'Música' },
  { id: 'releases',        label: 'Releases',          icon: Package,         group: 'Música' },
  { id: 'videos',          label: 'Videos & YouTube',  icon: Video,           group: 'Música' },
  // MARKETING
  { id: 'marketing-suite', label: 'Marketing Suite',   icon: Sparkles,        group: 'Marketing' },
  { id: 'community',       label: 'Comunidad',         icon: MessageCircle,   group: 'Marketing' },
  // SOCIAL
  { id: 'marketplace',     label: 'Marketplace Beats', icon: ShoppingBag,     group: 'Social' },
  { id: 'playlists',       label: 'Playlists',         icon: Play,            group: 'Social' },
  // IA
  { id: 'ai-chat',         label: 'IA Chat',           icon: Zap,             group: 'IA' },
  { id: 'legal',           label: 'Legal IA',          icon: Scale,           group: 'IA' },
  // FINANZAS
  { id: 'financing',       label: 'Financiamiento',    icon: CreditCard,      group: 'Finanzas' },
  // DISTRIBUCIÓN
  { id: 'store-maximizer', label: 'Store Maximizer',   icon: Store,           group: 'Distribución' },
  // GESTIÓN
  { id: 'label',           label: 'Mi Sello',          icon: Award,           group: 'Gestión' },
  { id: 'team',            label: 'Equipo',            icon: Users,           group: 'Gestión' },
  { id: 'stats',           label: 'Estadísticas',      icon: BarChart3,       group: 'Gestión' },
  { id: 'feedback',        label: 'Feedback & Bugs',   icon: Star,            group: 'Gestión' },
  { id: 'settings',        label: 'Ajustes',           icon: Settings,        group: 'Gestión' },
];

function SidebarItem({ m, isActive, onNav, onClose, locked, onLocked }: { m: typeof MODULES[0]; isActive: boolean; onNav: (id:string)=>void; onClose: ()=>void; locked?: boolean; onLocked?: ()=>void }) {
  const [hov, setHov] = useState(false);
  const iconColor = GROUP_COLORS[m.group] || P;
  const handleClick = () => {
    if (locked) { onLocked?.(); return; }
    onNav(m.id); onClose();
  };
  return (
    <button key={m.id} onClick={handleClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
        padding: '7px 12px', margin: '1px 0', borderRadius: '10px', cursor: 'pointer',
        border: 'none',
        background: isActive ? 'rgba(94,23,235,0.2)' : hov ? 'rgba(255,255,255,0.05)' : 'transparent',
        color: isActive ? '#fff' : hov ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.4)',
        fontSize: '12.5px', fontFamily: "'-apple-system','Space Grotesk',sans-serif",
        fontWeight: isActive ? 600 : 400,
        transition: 'all 0.15s ease',
        textAlign: 'left',
        opacity: locked ? 0.5 : 1,
      }}>
      <m.icon size={16} color={isActive ? '#fff' : iconColor} strokeWidth={1.5} style={{ flexShrink: 0 }} />
      <span style={{ flex: 1 }}>{m.label}</span>
      {locked && <Lock size={11} color="rgba(255,255,255,0.3)" />}
    </button>
  );
}

const Sidebar = memo(function Sidebar({ active, onNav, user, onLogout, open, onClose }: {
  active: string; onNav: (id: string) => void; user: any; onLogout: () => void; open: boolean; onClose: () => void;
}) {
  const groups = [...new Set(MODULES.map(m => m.group))];
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [showFinancingModal, setShowFinancingModal] = useState(false);
  const toggle = (g: string) => setCollapsed(prev => { const n = new Set(prev); n.has(g) ? n.delete(g) : n.add(g); return n; });

  const canAccessFinancing = user?.plan === 'pro' ||
    (user?.plan === 'indie' &&
      new Date().getTime() - new Date(user?.created_at || Date.now()).getTime() > 90 * 24 * 60 * 60 * 1000);

  return (
    <>
      {open && <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 20 }} />}
      {showFinancingModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={() => setShowFinancingModal(false)}>
          <div style={{ background: 'rgba(15,10,25,0.98)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 36, maxWidth: 420, textAlign: 'center' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
            <h3 style={{ fontFamily: "'-apple-system','Space Grotesk',sans-serif", fontSize: 20, fontWeight: 700, color: '#F5F5F7', margin: '0 0 12px' }}>Financiamiento bloqueado</h3>
            <p style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 14, color: 'rgba(255,255,255,0.5)', margin: '0 0 24px', lineHeight: 1.6 }}>El financiamiento está disponible para artistas con 90+ días en plataforma y plan INDIE o PRO.</p>
            <AppleBtn onClick={() => setShowFinancingModal(false)}>Entendido</AppleBtn>
          </div>
        </div>
      )}
      <aside className={`dashboard-sidebar${open ? ' sidebar-open' : ''}`} style={{ position: 'fixed', top: 0, left: 0, height: '100%', width: `${SIDEBAR_W}px`, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(40px)', borderRight: '1px solid rgba(255,255,255,0.06)', zIndex: 30, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Logo header */}
        <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '34px', height: '34px', background: `linear-gradient(135deg, ${P}, ${PL})`, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 16px rgba(94,23,235,0.4)`, flexShrink: 0 }}>
            <Music size={16} color="#fff" />
          </div>
          <div>
            <span style={{ fontFamily: "'Anton', sans-serif", fontSize: '17px', letterSpacing: '0.06em', color: '#F5F5F7', display: 'block', lineHeight: 1 }}>IM MUSIC</span>
            <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '9px', color: 'rgba(94,23,235,0.6)', letterSpacing: '0.3em', textTransform: 'uppercase' }}>PLATFORM</span>
          </div>
        </div>

        <div className="sidebar-scroll" style={{ flex: 1, overflowY: 'scroll', overflowX: 'hidden', padding: '8px 8px', scrollbarWidth: 'none', height: 0, minHeight: 0 }}>
          {groups.map((group, gi) => {
            const items = MODULES.filter(m => m.group === group);
            const isCollapsed = collapsed.has(group);
            return (
              <div key={group} style={{ marginBottom: '4px' }}>
                {gi > 0 && <div style={{ height: '1px', background: 'rgba(255,255,255,0.04)', margin: '6px 4px 8px' }} />}
                <button onClick={() => toggle(group)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '3px 12px 5px', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.2)', fontSize: '9px', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                  <span>{group}</span>
                  <ChevronDown size={9} style={{ transform: isCollapsed ? 'rotate(-90deg)' : 'none', transition: 'transform 0.2s', opacity: 0.5 }} />
                </button>
                {!isCollapsed && items.map(m => {
                  const isLocked = m.id === 'financing' && !canAccessFinancing;
                  return (
                    <SidebarItem key={m.id} m={m} isActive={active === m.id} onNav={onNav} onClose={onClose}
                      locked={isLocked} onLocked={() => setShowFinancingModal(true)} />
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* User footer */}
        <div style={{ padding: '10px 12px 14px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '8px 10px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '6px' }}>
            <div style={{ width: '30px', height: '30px', background: `linear-gradient(135deg,${P},${PL})`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '12px', fontFamily: "'Anton',sans-serif", color: '#fff' }}>
              {(user?.name || user?.email || 'U')[0].toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ color: '#F5F5F7', fontSize: '12px', fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name || user?.email}</p>
              <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: '10px', margin: 0, textTransform: 'capitalize' }}>{user?.role || 'artist'}</p>
            </div>
          </div>
          <button onClick={onLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '7px', padding: '7px 10px', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.22)', fontSize: '11px', fontFamily: "'Space Grotesk', sans-serif", borderRadius: '8px', transition: 'all 0.15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#FF453A'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,69,58,0.06)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.22)'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
            <LogOut size={12} /> Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  );
});

// ─── TOAST NOTIFICATION SYSTEM ────────────────────────────────────────────────
type ToastType = 'success' | 'error' | 'info';
interface Toast { id: number; msg: string; type: ToastType; }
let _toastSetter: React.Dispatch<React.SetStateAction<Toast[]>> | null = null;
const TOAST_DURATION = 3500;
function toast(msg: string, type: ToastType = 'success') {
  if (!_toastSetter) return;
  const id = Date.now();
  _toastSetter(t => [...t, { id, msg, type }]);
  setTimeout(() => _toastSetter!(t => t.filter(x => x.id !== id)), TOAST_DURATION);
}
function ToastItem({ t, color, icon }: { t: Toast; color: string; icon: string }) {
  const [progress, setProgress] = useState(100);
  useEffect(() => {
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const pct = Math.max(0, 100 - (elapsed / TOAST_DURATION) * 100);
      setProgress(pct);
      if (pct > 0) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, []);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0', background: 'rgba(8,6,18,0.97)', border: `1px solid ${color}33`, borderRadius: '14px', overflow: 'hidden', boxShadow: `0 0 40px ${color}18, 0 12px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)`, backdropFilter: 'blur(24px)', animation: 'toastIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both', minWidth: '260px', maxWidth: '340px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '13px 16px' }}>
        <div style={{ width: '28px', height: '28px', background: `${color}1a`, border: `1px solid ${color}44`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 0 12px ${color}33` }}>
          <span style={{ color, fontSize: '13px', fontWeight: 700 }}>{icon}</span>
        </div>
        <span style={{ color: '#fff', fontSize: '13px', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 500, lineHeight: 1.4 }}>{t.msg}</span>
      </div>
      <div style={{ height: '2px', background: `rgba(255,255,255,0.04)` }}>
        <div style={{ height: '100%', width: `${progress}%`, background: `linear-gradient(90deg, ${color}88, ${color})`, transition: 'width 0.1s linear', boxShadow: `0 0 8px ${color}` }} />
      </div>
    </div>
  );
}
function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  useEffect(() => { _toastSetter = setToasts; return () => { _toastSetter = null; }; }, []);
  const colors = { success: '#22c55e', error: '#ef4444', info: PL };
  const icons = { success: '✓', error: '✕', info: '◆' };
  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '10px', pointerEvents: 'none' }}>
      {toasts.map(t => <ToastItem key={t.id} t={t} color={colors[t.type]} icon={icons[t.type]} />)}
    </div>
  );
}

// ─── SKELETON LOADER ──────────────────────────────────────────────────────────
function Skeleton({ w = '100%', h = '16px', radius = '8px' }: { w?: string; h?: string; radius?: string }) {
  return <div className="skeleton-shimmer" style={{ width: w, height: h, borderRadius: radius, flexShrink: 0 }} />;
}
function SkeletonCard({ rows = 3 }: { rows?: number }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <Skeleton h="20px" w="40%" />
      {Array.from({ length: rows }).map((_, i) => <Skeleton key={i} h="14px" w={`${70 + (i % 3) * 10}%`} />)}
    </div>
  );
}

// ─── APP SHELL PAGES ──────────────────────────────────────────────────────────
function PageShell({ title, children, action, helpText }: { title: string; children: React.ReactNode; action?: React.ReactNode; helpText?: string }) {
  const [showHelp, setShowHelp] = useState(false);
  return (
    <div style={{ padding: '32px', maxWidth: '1100px', margin: '0 auto', position: 'relative' }}>
      {title && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h1 style={{ fontFamily: "'-apple-system','SF Pro Display','Space Grotesk',sans-serif", fontSize: 26, fontWeight: 700, color: '#F5F5F7', letterSpacing: '-0.02em', margin: 0 }}>{title}</h1>
            {helpText && (
              <button onClick={() => setShowHelp(!showHelp)}
                style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                ?
              </button>
            )}
          </div>
          {action}
        </div>
      )}
      {!title && action && <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:'32px' }}>{action}</div>}
      {showHelp && helpText && (
        <div style={{ background: 'rgba(94,23,235,0.08)', border: '1px solid rgba(94,23,235,0.2)', borderRadius: 14, padding: 16, marginBottom: 24 }}>
          <p style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 14, color: 'rgba(255,255,255,0.6)', margin: 0, lineHeight: 1.7 }}>{helpText}</p>
        </div>
      )}
      {children}
    </div>
  );
}

// ─── AppleCard / HoloCard ─────────────────────────────────────────────────────
function AppleCard({ children, style = {}, glow = false }: { children: React.ReactNode; style?: React.CSSProperties; glow?: boolean; color?: string; intense?: boolean }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${hovered ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.07)'}`,
        borderRadius: 20,
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        boxShadow: hovered
          ? '0 20px 60px rgba(0,0,0,0.4), 0 0 0 0.5px rgba(255,255,255,0.1)'
          : glow ? '0 8px 32px rgba(94,23,235,0.15)' : '0 8px 32px rgba(0,0,0,0.2)',
        transition: 'all 0.3s cubic-bezier(0.25,0.46,0.45,0.94)',
        transform: hovered ? 'translateY(-2px)' : 'none',
        padding: '24px',
        ...style,
      }}>
      {children}
    </div>
  );
}
const HoloCard = AppleCard;

const Card = AppleCard;

// Icon circle — premium 52x52 with glow
function IconCircle({ icon: Icon, color = PL, size = 52, iconSize = 20 }: { icon: any; color?: string; size?: number; iconSize?: number }) {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ width: `${size}px`, height: `${size}px`, background: hov ? `${color}30` : `${color}15`, border: `1px solid ${color}${hov?'55':'28'}`, borderRadius: `${size*0.3}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.22s ease', boxShadow: hov ? `0 0 32px ${color}55` : `0 0 12px ${color}20`, transform: hov ? 'scale(1.12)' : 'scale(1)' }}>
      <Icon size={iconSize} color={hov ? '#fff' : color} />
    </div>
  );
}

const StatCard = memo(function StatCard({ label, value, icon: Icon, trend, sparkline, glowColor = PL }: { label: string; value: string | number; icon: any; key?: React.Key; trend?: 'up' | 'down'; sparkline?: number[]; glowColor?: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const shimRef = useRef<HTMLDivElement>(null);
  const barsContRef = useRef<HTMLDivElement>(null);
  const rafId = useRef<number>(0);
  const bars = sparkline || [40, 55, 35, 70, 50, 80, 65, 90];
  const maxBar = Math.max(...bars, 1);

  // Reveal bars on first viewport entry (once only)
  useEffect(() => {
    const el = barsContRef.current; if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      obs.disconnect();
      Array.from(el.children).forEach((bar, i) => {
        const b = bars[i];
        setTimeout(() => { (bar as HTMLDivElement).style.height = `${(b / maxBar) * 28}px`; }, i * 60);
      });
    }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []); // eslint-disable-line

  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(() => {
      const el = wrapRef.current; if (!el) return;
      const r = el.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 100;
      const y = ((e.clientY - r.top) / r.height) * 100;
      const rx = ((e.clientY - r.top - r.height / 2) / r.height) * -8;
      const ry = ((e.clientX - r.left - r.width / 2) / r.width) * 8;
      el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(10px)`;
      el.style.boxShadow = `${-ry * 2}px ${rx * 2}px 40px rgba(0,0,0,0.5), 0 0 30px ${glowColor}22`;
      if (glowRef.current) glowRef.current.style.background = `radial-gradient(circle 150px at ${x}% ${y}%, ${glowColor}18, transparent)`;
      if (shimRef.current) shimRef.current.style.opacity = '1';
    });
  }, [glowColor]);

  const onLeave = useCallback(() => {
    cancelAnimationFrame(rafId.current);
    const el = wrapRef.current; if (!el) return;
    el.style.transform = '';
    el.style.boxShadow = '';
    el.style.transition = 'transform 0.55s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.4s ease';
    setTimeout(() => { if (el) el.style.transition = ''; }, 550);
    if (glowRef.current) glowRef.current.style.background = 'none';
    if (shimRef.current) shimRef.current.style.opacity = '0';
  }, []);

  return (
    <div ref={wrapRef} onMouseMove={onMove} onMouseLeave={onLeave}
      style={{ background: 'rgba(10,6,18,0.88)', backdropFilter: 'blur(40px) saturate(200%)', border: `1px solid ${glowColor}30`, borderRadius: '24px', padding: '22px', position: 'relative', overflow: 'hidden', minHeight: '160px', display:'flex', flexDirection:'column', justifyContent:'space-between', willChange:'transform' }}>
      {/* Watermark icon */}
      <div style={{ position: 'absolute', right: '-16px', bottom: '-16px', opacity: 0.04, pointerEvents: 'none' }}>
        <Icon size={120} color={glowColor} />
      </div>
      {/* Holographic shimmer — opacity toggled via ref */}
      <div ref={shimRef} style={{ position:'absolute', inset:0, background:'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.07) 50%, transparent 60%)', backgroundSize:'200% 200%', animation:'holographic 3s linear infinite', pointerEvents:'none', borderRadius:'24px', opacity:0, transition:'opacity 0.3s ease' }} />
      {/* Mouse-follow inner glow — mutated directly */}
      <div ref={glowRef} style={{ position:'absolute', inset:0, borderRadius:'24px', pointerEvents:'none' }} />
      {/* Static ambient glow */}
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 80% 20%, ${glowColor}0e 0%, transparent 55%)`, pointerEvents: 'none' }} />

      <div style={{ position:'relative', zIndex:1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <GlassIcon icon={Icon} color={glowColor} size={46} />
          {trend && (
            <span style={{ display:'flex', alignItems:'center', gap:'3px', fontSize: '10px', color: '#22c55e', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: '100px', padding: '4px 10px', letterSpacing:'0.04em' }}>
              <TrendingUp size={10} /> +12%
            </span>
          )}
        </div>
        <p style={{ fontFamily: "'Anton', sans-serif", fontSize: '44px', color: glowColor, margin: '0 0 2px', letterSpacing: '-0.01em', textShadow: `0 0 30px ${glowColor}99, 0 0 60px ${glowColor}44`, lineHeight: 1 }}>
          {(()=>{
            if (typeof value === 'number') return <AnimatedCounter target={value} />;
            if (typeof value === 'string' && value.startsWith('$')) {
              const num = parseFloat(value.replace(/[$,]/g, ''));
              return <><span>$</span><AnimatedCounter target={isNaN(num) ? 0 : num} /></>;
            }
            return value;
          })()}
        </p>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', margin: '0', fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</p>
      </div>

      {/* Sparkline — heights animated via IntersectionObserver */}
      <div ref={barsContRef} style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '28px', position: 'relative', zIndex: 1 }}>
        {bars.map((b, i) => (
          <div key={i} style={{ flex: 1, height: '2px', background: i === bars.length - 1 ? glowColor : `${glowColor}40`, borderRadius: '2px 2px 0 0', transition: `height 0.7s cubic-bezier(0.34,1.56,0.64,1)`, minWidth: '4px', boxShadow: i === bars.length - 1 ? `0 0 12px ${glowColor}88` : 'none' }} />
        ))}
      </div>
    </div>
  );
});

function AppMarqueeStrip() {
  const items = [...MARQUEE_WORDS, ...MARQUEE_WORDS];
  return (
    <div style={{ background: P, padding: '10px 0', overflow: 'hidden', borderTop: '1px solid rgba(255,255,255,0.1)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
      <div style={{ display: 'flex', width: 'max-content', animation: 'marqueeScroll 22s linear infinite' }}>
        {items.map((item, i) => (
          <span key={i} style={{ fontFamily: "'Anton', sans-serif", fontSize: '11px', letterSpacing: '0.22em', color: '#fff', padding: '0 28px', whiteSpace: 'nowrap' }}>
            {item} <span style={{ color: 'rgba(255,255,255,0.35)' }}>✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── DASHBOARD ───────────────────────────────────────────────────────────────
function DashboardPage({ onNav }: { onNav?: (id: string) => void }) {
  const [stats, setStats] = useState<any>(null);
  const [tracks, setTracks] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [vaultCount, setVaultCount] = useState<number|null>(null);

  const hour = new Date().getHours();
  const greeting = hour < 6 ? '🌙 Buenas noches' : hour < 12 ? '☀️ Buenos días' : hour < 18 ? '🌤️ Buenas tardes' : '🌙 Buenas noches';
  const motivational = ['Tu música merece el mundo.', 'Hoy es un buen día para lanzar.', 'Los streams no paran.', 'Tu carrera está creciendo.'][new Date().getDay() % 4];

  useEffect(() => {
    Promise.all([
      apiFetch('/royalties/summary').then(setStats).catch(() => {}),
      apiFetch('/tracks').then(d => setTracks(Array.isArray(d) ? d.slice(0, 5) : [])).catch(() => {}),
      apiFetch('/vault/files').then(d => setVaultCount(Array.isArray(d)?d.length:0)).catch(()=>{}),
    ]).finally(() => setLoadingData(false));
  }, []);

  const cards = [
    { label: 'Ingresos totales', value: stats ? `$${Number(stats.totalRevenue || 0).toFixed(2)}` : '—', icon: DollarSign, trend: 'up' as const, sparkline: [30,45,38,60,52,74,68,85], glowColor: '#22c55e' },
    { label: 'Tracks', value: tracks.length || 0, icon: Music, trend: 'up' as const, sparkline: [10,10,12,15,14,18,17,20], glowColor: PL },
    { label: 'Plataformas', value: stats ? Object.keys(stats.byPlatform || {}).length : 0, icon: Globe, sparkline: [4,4,5,5,5,6,6,6], glowColor: '#3b82f6' },
    { label: 'Streams totales', value: stats ? Number(stats.totalStreams || 0).toLocaleString() : '—', icon: TrendingUp, trend: 'up' as const, sparkline: [55,62,58,75,80,72,90,95], glowColor: '#f59e0b' },
  ];

  const quickActions = [
    { label: 'Subir Track', icon: Upload, page: 'catalog',   color: '#5E17EB' },
    { label: 'Nuevo Split', icon: Users,  page: 'splits',    color: '#22c55e' },
    { label: 'Ver Regalías',icon: DollarSign, page: 'royalties', color: '#f59e0b' },
    { label: 'Preguntar IA',icon: Zap,    page: 'ai-chat',  color: '#3b82f6' },
  ];

  return (
    <>
      <PageBackground color="#5E17EB" />
      <AppMarqueeStrip />
      <div style={{ position: 'relative', overflow: 'hidden' }}>

        <PageShell title="">
          {/* Greeting hero */}
          <div style={{ marginBottom: '40px' }}>
            <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:12, fontWeight:700, color:'rgba(94,23,235,0.8)', letterSpacing:'0.2em', textTransform:'uppercase', marginBottom:8, display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:24, height:1, background:'rgba(94,23,235,0.5)' }} />
              {new Date().toLocaleDateString('es-CO', { weekday:'long', day:'numeric', month:'long' })}
            </div>
            <h1 style={{ fontFamily:"'Anton',sans-serif", fontSize:'clamp(2rem,4vw,3rem)', color:'#F2EDE5', margin:'0 0 8px', lineHeight:1.1 }}>
              {greeting}, <span style={{ background:`linear-gradient(135deg, ${P}, #C084FC)`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>Artista</span>
            </h1>
            <p style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:15, color:'rgba(255,255,255,0.4)', margin:0 }}>{motivational}</p>
          </div>

          {/* Quick Actions — glass tiles */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 32 }}>
            {quickActions.map((a, i) => (
              <div key={i} onClick={() => onNav?.(a.page)} data-magnetic
                style={{ height:108, borderRadius:20, cursor:'pointer', background:`linear-gradient(135deg, ${a.color}18, ${a.color}06)`, border:`1px solid ${a.color}22`, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:10, transition:'all 0.4s cubic-bezier(0.34,1.56,0.64,1)', position:'relative', overflow:'hidden' }}
                onMouseEnter={e => { const el=e.currentTarget as HTMLElement; el.style.transform='translateY(-8px) scale(1.03)'; el.style.background=`linear-gradient(135deg, ${a.color}28, ${a.color}10)`; el.style.borderColor=`${a.color}50`; el.style.boxShadow=`0 20px 40px rgba(0,0,0,0.3), 0 0 40px ${a.color}22`; }}
                onMouseLeave={e => { const el=e.currentTarget as HTMLElement; el.style.transform=''; el.style.background=`linear-gradient(135deg, ${a.color}18, ${a.color}06)`; el.style.borderColor=`${a.color}22`; el.style.boxShadow=''; }}
                onMouseDown={e => { (e.currentTarget as HTMLElement).style.transform='translateY(2px) scale(0.97)'; }}
                onMouseUp={e => { (e.currentTarget as HTMLElement).style.transform='translateY(-8px) scale(1.03)'; }}>
                <Icon3D icon={a.icon} color={a.color} size={42} />
                <span style={{ fontFamily:"'Anton',sans-serif", fontSize:10, color:'rgba(255,255,255,0.55)', letterSpacing:'0.18em', textTransform:'uppercase' }}>{a.label}</span>
                <div style={{ position:'absolute', top:-24, right:-24, width:90, height:90, borderRadius:'50%', background:`radial-gradient(circle, ${a.color}22, transparent 70%)`, pointerEvents:'none' }} />
              </div>
            ))}
          </div>

          {/* Stat Cards */}
          {loadingData ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
              {[0,1,2,3].map(i => <SkeletonCard key={i} rows={2} />)}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
              {cards.map(c => <StatCard key={c.label} label={c.label} value={c.value} icon={c.icon} trend={c.trend} sparkline={c.sparkline} glowColor={c.glowColor} />)}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <Card>
              <h3 style={{ fontFamily: "'Anton', sans-serif", fontSize: '13px', background: `linear-gradient(90deg,#fff,${PL})`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', letterSpacing: '0.1em', margin: '0 0 18px' }}>ÚLTIMOS TRACKS</h3>
              {loadingData && [0,1,2].map(i => <div key={i} style={{ marginBottom: '10px' }}><Skeleton h="40px" radius="12px" /></div>)}
              {!loadingData && tracks.length === 0 && (
                <div style={{ textAlign:'center', padding:'32px 0' }}>
                  <div style={{ fontSize:'36px', marginBottom:'10px', display:'inline-block', animation:'dashFloat 3s ease-in-out infinite', filter:'drop-shadow(0 0 12px rgba(94,23,235,0.35))' }}>🎵</div>
                  <p style={{ color:'rgba(255,255,255,0.2)', fontSize:'12px', fontFamily:"'Space Grotesk',sans-serif", margin:0 }}>Sin tracks aún</p>
                </div>
              )}
              {tracks.map(t => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ width: '38px', height: '38px', background: COVER_GRADIENTS[t.id % COVER_GRADIENTS.length], borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 4px 16px rgba(94,23,235,0.25)` }}>
                    <Music size={14} color="rgba(255,255,255,0.8)" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: '#fff', fontSize: '13px', fontWeight: 600, margin: 0, fontFamily: "'Space Grotesk', sans-serif", overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.title}</p>
                    <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: '11px', margin: 0, fontFamily: "'Space Grotesk', sans-serif", letterSpacing:'0.04em' }}>{t.status || 'draft'}</p>
                  </div>
                  {/* Mini waveform */}
                  <div style={{ display:'flex', alignItems:'center', gap:'2px', height:'18px' }}>
                    {[3,5,8,6,4,7,5,3].map((h,i) => (
                      <div key={i} style={{ width:'2px', height:`${h*2}px`, background:PL, borderRadius:'1px', opacity:0.5, animation:`waveBar 1.2s ease-in-out ${i*0.1}s infinite`, '--h':`${h*2}px` } as React.CSSProperties} />
                    ))}
                  </div>
                </div>
              ))}
            </Card>

            <Card>
              <h3 style={{ fontFamily: "'Anton', sans-serif", fontSize: '13px', background: `linear-gradient(90deg,#fff,${PL})`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', letterSpacing: '0.1em', margin: '0 0 18px' }}>INGRESOS POR PLATAFORMA</h3>
              {loadingData && [0,1,2,3].map(i => <div key={i} style={{ marginBottom: '14px' }}><Skeleton h="32px" radius="8px" /></div>)}
              {!loadingData && stats?.byPlatform && Object.entries(stats.byPlatform).slice(0, 5).map(([plat, v]: any, i) => {
                const pct = Math.min(100, (v / Math.max(stats.totalRevenue, 1)) * 100);
                const colors = [P, PL, '#3b82f6', '#22c55e', '#f59e0b'];
                const c = colors[i % colors.length];
                return (
                  <div key={plat} style={{ marginBottom: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: '12px', textTransform: 'capitalize', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 500 }}>{plat}</span>
                      <span style={{ color: '#fff', fontSize: '12px', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 }}>${Number(v).toFixed(2)}</span>
                    </div>
                    <div style={{ height: '5px', background: 'rgba(255,255,255,0.04)', borderRadius: '100px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: `linear-gradient(90deg, ${c}88, ${c})`, borderRadius: '100px', width: `${pct}%`, transition: `width 1.2s cubic-bezier(0.22,1,0.36,1) ${i * 0.1}s`, boxShadow: `0 0 8px ${c}60` }} />
                    </div>
                  </div>
                );
              })}
              {!loadingData && !stats?.byPlatform && (
                <EmptyState icon={Globe} text="Sin datos de plataformas" emoji="🌍" />
              )}
            </Card>
          </div>

          {/* Vault summary widget */}
          {vaultCount !== null && (
            <div style={{marginTop:20,background:'rgba(94,23,235,0.06)',border:'1px solid rgba(94,23,235,0.15)',borderRadius:16,padding:'14px 20px',display:'flex',alignItems:'center',gap:14,cursor:'pointer'}}
              onClick={()=>onNav?.('catalog')}>
              <div style={{width:36,height:36,background:'rgba(94,23,235,0.15)',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                <Lock size={16} color={PL}/>
              </div>
              <div style={{flex:1}}>
                <p style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:12,fontWeight:600,color:'rgba(255,255,255,0.6)',margin:0}}>Vault automático activo</p>
                <p style={{fontFamily:"'Anton',sans-serif",fontSize:14,color:'#F2EDE5',margin:0}}>{vaultCount} archivos protegidos · última actualización hoy</p>
              </div>
              <span style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:11,color:PL,fontWeight:700}}>VER →</span>
            </div>
          )}
        </PageShell>
      </div>
    </>
  );
}

// ─── CATALOG ─────────────────────────────────────────────────────────────────
const COVER_GRADIENTS = [
  'linear-gradient(135deg,#5E17EB,#C084FC)',
  'linear-gradient(135deg,#1a1a4e,#5E17EB)',
  'linear-gradient(135deg,#7B3FFF,#E879F9)',
  'linear-gradient(135deg,#2D0B6B,#7B3FFF)',
  'linear-gradient(135deg,#4A12D0,#C084FC)',
  'linear-gradient(135deg,#5E17EB,#22c55e)',
];

const WAVE_BARS_CONST = [4,8,5,12,6,14,4,10,7,13,5,11,8,15,6,9];
function TrackGridCard({ track: t, onDel }: { track: any; onDel: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [hov, setHov] = useState(false);
  const rafId = useRef<number>(0);
  const statusColors: Record<string,string> = { draft:'#71717a', published:'#22c55e', scheduled:'#3b82f6' };
  const sc = statusColors[t.status] || '#71717a';

  const onMouseMove = (e: React.MouseEvent) => {
    const cx = e.clientX; const cy = e.clientY;
    cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(() => {
      const el = ref.current; if (!el) return;
      const r = el.getBoundingClientRect();
      const nx = (cx - r.left) / r.width;
      const ny = (cy - r.top) / r.height;
      el.style.transform = `perspective(900px) rotateX(${(ny-0.5)*-8}deg) rotateY(${(nx-0.5)*8}deg) translateY(-6px)`;
      el.style.boxShadow = `0 20px 60px rgba(94,23,235,0.25), 0 0 0 1px rgba(94,23,235,0.35)`;
    });
  };
  const onMouseLeave = () => {
    setHov(false);
    if (ref.current) {
      ref.current.style.transform = '';
      ref.current.style.boxShadow = '';
      ref.current.style.transition = 'all 0.55s cubic-bezier(0.34,1.56,0.64,1)';
      setTimeout(() => { if (ref.current) ref.current.style.transition = ''; }, 550);
    }
  };

  return (
    <div ref={ref} onMouseMove={onMouseMove} onMouseEnter={() => setHov(true)} onMouseLeave={onMouseLeave}
      style={{ background:'rgba(8,5,16,0.9)', backdropFilter:'blur(24px)', border:`1px solid ${hov ? 'rgba(94,23,235,0.4)' : 'rgba(255,255,255,0.07)'}`, borderRadius:'22px', overflow:'hidden', height:'240px', display:'flex', flexDirection:'column', transition:'border-color 0.2s ease' }}>
      {/* Cover art — 150px */}
      <div style={{ height:'150px', background:COVER_GRADIENTS[t.id % COVER_GRADIENTS.length], position:'relative', overflow:'hidden', flexShrink:0 }}>
        {/* Noise texture */}
        <div style={{ position:'absolute', inset:0, backgroundImage:'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.75\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.08\'/%3E%3C/svg%3E")', backgroundSize:'200px 200px', mixBlendMode:'overlay', pointerEvents:'none', opacity:0.4 }} />
        {/* Music note */}
        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', transform:hov?'scale(1.1)':'scale(1)', transition:'transform 0.4s ease' }}>
          <Music size={48} color="rgba(255,255,255,0.18)" />
        </div>
        {/* Play button overlay */}
        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', background:hov?'rgba(0,0,0,0.28)':'transparent', transition:'background 0.3s ease' }}>
          <div style={{ width:62, height:62, borderRadius:'50%', background:'rgba(255,255,255,0.14)', backdropFilter:'blur(10px)', border:'1px solid rgba(255,255,255,0.28)', display:'flex', alignItems:'center', justifyContent:'center', transform:hov?'scale(1)':'scale(0)', transition:'transform 0.35s cubic-bezier(0.34,1.56,0.64,1)', boxShadow:'0 8px 32px rgba(0,0,0,0.4)' }}>
            <Play size={22} color="#fff" fill="#fff" />
          </div>
        </div>
        {/* Status badge top-right */}
        <div style={{ position:'absolute', top:10, right:10, background:`${sc}22`, border:`1px solid ${sc}60`, borderRadius:100, padding:'3px 9px', display:'flex', alignItems:'center', gap:4 }}>
          <div style={{ width:5, height:5, borderRadius:'50%', background:sc, boxShadow:`0 0 6px ${sc}` }} />
          <span style={{ color:sc, fontSize:'9px', fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em' }}>{t.status||'draft'}</span>
        </div>
        {/* Bottom gradient */}
        <div style={{ position:'absolute', bottom:0, left:0, right:0, height:56, background:'linear-gradient(to top, rgba(8,5,16,1), transparent)' }} />
        {/* 16-bar waveform */}
        <div style={{ position:'absolute', bottom:8, left:'50%', transform:'translateX(-50%)', display:'flex', alignItems:'flex-end', gap:2, height:24 }}>
          {WAVE_BARS_CONST.map((h,i) => (
            <div key={i} style={{ width:3, background:'rgba(255,255,255,0.3)', borderRadius:2, height:`${h}px`, animation:`waveformPulse 1.4s ease-in-out ${i*0.09}s infinite`, '--wh':`${h}px` } as React.CSSProperties} />
          ))}
        </div>
      </div>
      {/* Track info — 90px */}
      <div style={{ padding:'12px 14px', flex:1, display:'flex', flexDirection:'column', justifyContent:'space-between' }}>
        <p style={{ color:'#F2EDE5', fontSize:'14px', fontWeight:700, margin:0, fontFamily:"'Space Grotesk',sans-serif", overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.title}</p>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ background:`rgba(94,23,235,0.14)`, border:'1px solid rgba(94,23,235,0.25)', borderRadius:100, padding:'2px 8px', fontSize:'10px', color:'rgba(192,132,252,0.9)', fontFamily:"'Space Grotesk',sans-serif", fontWeight:600 }}>{t.genre||'Sin género'}</span>
          <button onClick={e => { e.stopPropagation(); onDel(); }} style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.18)', padding:2, borderRadius:6, transition:'all 0.15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color='#ef4444'; (e.currentTarget as HTMLElement).style.background='rgba(239,68,68,0.1)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.18)'; (e.currentTarget as HTMLElement).style.background='transparent'; }}>
            <Trash2 size={13}/>
          </button>
        </div>
      </div>
    </div>
  );
}

function CatalogPage({ initialTab = 'tracks' }: { initialTab?: string }) {
  const [tab, setTab] = useState<'tracks'|'upload'|'splits'|'publishing'|'bulk'>(initialTab as any);
  const [tracks, setTracks] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState(''); const [genre, setGenre] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  // Smart upload state
  const [dragOver, setDragOver] = useState(false);
  const [uploadFile, setUploadFile] = useState<File|null>(null);
  const [showMetaModal, setShowMetaModal] = useState(false);
  const [aiMetadata, setAiMetadata] = useState<any>({});
  const [extracting, setExtracting] = useState(false);
  const [uploadStep, setUploadStep] = useState<'metadata'|'splits'|'platforms'|'done'>('metadata');
  const [uploadSplits, setUploadSplits] = useState<any[]>([]);
  const [splitForm, setSplitForm] = useState({ name:'', email:'', percentage:'', role:'productor' });
  const [uploadPlatforms, setUploadPlatforms] = useState(['Spotify','Apple Music','YouTube Music','TikTok','Amazon Music','Deezer']);
  const [publishing, setPublishing] = useState(false);
  // Bulk upload state
  const [bulkFiles, setBulkFiles] = useState<File[]>([]);
  const [bulkResults, setBulkResults] = useState<{name:string;status:'ok'|'error'|'uploading'}[]>([]);
  const [bulkDragging, setBulkDragging] = useState(false);
  const [bulkUploading, setBulkUploading] = useState(false);
  // Lyrics state
  const [lyricsSelected, setLyricsSelected] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [lyricsSaved, setLyricsSaved] = useState(false);

  const load = () => apiFetch('/tracks').then(d => { setTracks(Array.isArray(d) ? d : []); setLoadingData(false); }).catch(() => setLoadingData(false));
  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (!lyricsSelected) return;
    apiFetch(`/lyrics/${lyricsSelected}`).then(d => setLyrics(d.lyrics||'')).catch(()=>{});
  }, [lyricsSelected]);

  const create = async () => {
    if (!title.trim()) { toast('Escribe el título', 'error'); return; }
    setLoading(true);
    try {
      const data = await apiFetch('/tracks', {
        method: 'POST',
        body: JSON.stringify({ title: title.trim(), genre: genre.trim() || 'Sin género' })
      });
      toast('✅ Track "' + (data.title || title.trim()) + '" creado', 'success');
      setTitle('');
      setGenre('');
      setShowForm(false);
      load();
    } catch(e: any) {
      console.log('CREATE ERROR:', e.message, e);
      toast('Error: ' + e.message, 'error');
    }
    setLoading(false);
  };
  const del = async (id: number, name: string) => {
    if (!confirm(`¿Eliminar "${name}"?`)) return;
    await apiFetch(`/tracks/${id}`, { method: 'DELETE' }).catch(() => {});
    load(); toast('Track eliminado', 'info');
  };
  const saveLyrics = async () => {
    if (!lyricsSelected) return;
    await apiFetch('/lyrics', { method:'POST', body: JSON.stringify({ track_id: lyricsSelected, lyrics }) }).catch(()=>{});
    // Auto-register in publishing
    const t = tracks.find(t=>String(t.id)===lyricsSelected);
    if (t) apiFetch('/publishing', { method:'POST', body: JSON.stringify({ title: t.title, lyrics, track_id: lyricsSelected }) }).catch(()=>{});
    // Auto-vault lyrics
    apiFetch('/vault/files', { method:'POST', body: JSON.stringify({ name: `Letra - ${t?.title||lyricsSelected}`, type: 'text', metadata: { track_id: lyricsSelected } }) }).catch(()=>{});
    setLyricsSaved(true); setTimeout(()=>setLyricsSaved(false),2000);
    toast('Letra guardada y registrada en Publishing');
  };
  const bulkUpload = async () => {
    if(!bulkFiles.length) return; setBulkUploading(true);
    const newResults = bulkFiles.map(f=>({name:f.name,status:'uploading' as const})); setBulkResults(newResults);
    for (let i=0; i<bulkFiles.length; i++) {
      const fd = new FormData(); fd.append('audio', bulkFiles[i]);
      try {
        const res = await fetch(`${API}/upload/audio`, { method:'POST', headers:{ Authorization:`Bearer ${token()}` }, body: fd });
        setBulkResults(r => r.map((x,idx)=>idx===i?{...x,status:res.ok?'ok':'error'}:x));
      } catch { setBulkResults(r=>r.map((x,idx)=>idx===i?{...x,status:'error'}:x)); }
    }
    setBulkUploading(false); setBulkFiles([]); load();
  };

  const statusColors: Record<string, string> = { draft: '#52525b', published: '#16a34a', scheduled: '#1d4ed8' };

  const handleFileSelect = async (file: File) => {
    setUploadFile(file);
    setExtracting(true);
    setShowMetaModal(true);
    setUploadStep('metadata');
    setUploadSplits([]);
    setSplitForm({ name:'', email:'', percentage:'', role:'productor' });
    setUploadPlatforms(['Spotify','Apple Music','YouTube Music','TikTok','Amazon Music','Deezer']);
    try {
      const data = await apiFetch('/ai/extract-metadata', { method: 'POST', body: JSON.stringify({ filename: file.name, size: file.size, type: file.type, duration: 0 }) });
      setAiMetadata(data);
    } catch {
      setAiMetadata({ title: file.name.replace(/\.[^/.]+$/, ''), artist: '', genre: '', type: 'single', bpm: '', key: '' });
    }
    setExtracting(false);
  };

  const closeUploadModal = () => { setShowMetaModal(false); setUploadFile(null); setAiMetadata({}); setUploadStep('metadata'); setUploadSplits([]); };

  const totalSplitPct = uploadSplits.reduce((sum, s) => sum + Number(s.percentage||0), 0);

  return (
    <>
    <PageBackground color="#7B3FFF" />
    {showMetaModal && (
      <div style={{position:'fixed',inset:0,zIndex:9999,background:'rgba(0,0,0,0.8)',backdropFilter:'blur(20px)',display:'flex',alignItems:'center',justifyContent:'center',padding:24}}>
        <div style={{background:'rgba(15,10,25,0.98)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:24,padding:36,maxWidth:600,width:'100%',maxHeight:'90vh',overflowY:'auto'}}>

          {/* Step progress bar */}
          <div style={{display:'flex',gap:8,marginBottom:24}}>
            {(['metadata','splits','platforms'] as const).map((s,i) => {
              const stepIdx = ['metadata','splits','platforms'].indexOf(uploadStep);
              return <div key={s} style={{flex:1,height:3,borderRadius:2,background:i<stepIdx?'#5E17EB':i===stepIdx?'#7B3FFF':'rgba(255,255,255,0.1)',transition:'all 0.3s'}}/>;
            })}
          </div>

          {/* Header */}
          <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:24}}>
            <div style={{fontSize:32}}>{uploadStep==='metadata'?'🎵':uploadStep==='splits'?'💰':'🚀'}</div>
            <div>
              <h3 style={{fontFamily:"'-apple-system','Space Grotesk',sans-serif",fontSize:20,fontWeight:700,color:'#F5F5F7',margin:0}}>
                {extracting ? 'Analizando con IA...' : uploadStep==='metadata' ? 'Paso 1 de 3: Metadatos' : uploadStep==='splits' ? 'Paso 2 de 3: ¿Quién colaboró?' : 'Paso 3 de 3: ¿Dónde distribuir?'}
              </h3>
              <p style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:12,color:'rgba(255,255,255,0.35)',margin:0}}>{uploadFile?.name}</p>
            </div>
          </div>

          {extracting ? (
            <div style={{textAlign:'center',padding:'32px 0'}}>
              <div style={{width:40,height:40,border:'3px solid rgba(94,23,235,0.3)',borderTop:'3px solid #5E17EB',borderRadius:'50%',animation:'spin 0.8s linear infinite',margin:'0 auto 16px'}}/>
              <p style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:14,color:'rgba(255,255,255,0.4)'}}>La IA está extrayendo los metadatos...</p>
            </div>

          ) : uploadStep === 'metadata' ? (
            <>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
                {([
                  {key:'title',label:'Título *',placeholder:'Nombre de la canción'},
                  {key:'artist',label:'Artista principal',placeholder:'Tu nombre artístico'},
                  {key:'genre',label:'Género',placeholder:'Trap, Reggaeton, Pop...'},
                  {key:'type',label:'Tipo de lanzamiento',type:'select',options:['single','ep','album']},
                  {key:'bpm',label:'BPM',placeholder:'120'},
                  {key:'key',label:'Tonalidad',placeholder:'Am, C#, Dm...'},
                ] as any[]).map((f:any) => (
                  <div key={f.key}>
                    <label style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:11,color:'rgba(255,255,255,0.35)',letterSpacing:'0.12em',textTransform:'uppercase',display:'block',marginBottom:6}}>{f.label}</label>
                    {f.type === 'select' ? (
                      <select value={aiMetadata[f.key]||''} onChange={e=>setAiMetadata((p:any)=>({...p,[f.key]:e.target.value}))}
                        style={{width:'100%',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,padding:'10px 12px',color:'#fff',fontFamily:"'Space Grotesk',sans-serif",fontSize:13,outline:'none'}}>
                        {f.options.map((o:string)=><option key={o} value={o}>{o.toUpperCase()}</option>)}
                      </select>
                    ) : (
                      <input value={aiMetadata[f.key]||''} onChange={e=>setAiMetadata((p:any)=>({...p,[f.key]:e.target.value}))} placeholder={f.placeholder}
                        style={{width:'100%',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,padding:'10px 12px',color:'#fff',fontFamily:"'Space Grotesk',sans-serif",fontSize:13,outline:'none',boxSizing:'border-box'}}
                      />
                    )}
                  </div>
                ))}
              </div>
              <div style={{background:'rgba(94,23,235,0.08)',border:'1px solid rgba(94,23,235,0.2)',borderRadius:12,padding:14,marginBottom:20}}>
                <p style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:12,fontWeight:700,color:'rgba(94,23,235,0.8)',textTransform:'uppercase',letterSpacing:'0.1em',margin:'0 0 4px'}}>✨ IA detectó estos campos automáticamente</p>
                <p style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:12,color:'rgba(255,255,255,0.4)',margin:0}}>Revisa y ajusta antes de continuar.</p>
              </div>
              <div style={{display:'flex',gap:12}}>
                <AppleBtn fullWidth onClick={() => { if (!aiMetadata.title) { toast('El título es obligatorio','error'); return; } setUploadStep('splits'); }}>SIGUIENTE: SPLITS →</AppleBtn>
                <AppleBtn variant="ghost" onClick={closeUploadModal}>Cancelar</AppleBtn>
              </div>
            </>

          ) : uploadStep === 'splits' ? (
            <>
              {/* Add collaborator form */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:14}}>
                {[{k:'name',p:'Nombre',lbl:'Nombre'},{k:'email',p:'email@ejemplo.com',lbl:'Email'},{k:'percentage',p:'%',lbl:'Porcentaje %'},{k:'role',p:'',lbl:'Rol',select:['artista','productor','co-autor','letrista','mánager']}].map((f:any)=>(
                  <div key={f.k}>
                    <label style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:11,color:'rgba(255,255,255,0.35)',letterSpacing:'0.1em',textTransform:'uppercase',display:'block',marginBottom:5}}>{f.lbl}</label>
                    {f.select ? (
                      <select value={splitForm[f.k as keyof typeof splitForm]} onChange={e=>setSplitForm(s=>({...s,[f.k]:e.target.value}))}
                        style={{width:'100%',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,padding:'9px 12px',color:'#fff',fontFamily:"'Space Grotesk',sans-serif",fontSize:13,outline:'none'}}>
                        {f.select.map((o:string)=><option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : (
                      <input value={splitForm[f.k as keyof typeof splitForm]} onChange={e=>setSplitForm(s=>({...s,[f.k]:e.target.value}))} placeholder={f.p} type={f.k==='percentage'?'number':'text'}
                        style={{width:'100%',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,padding:'9px 12px',color:'#fff',fontFamily:"'Space Grotesk',sans-serif",fontSize:13,outline:'none',boxSizing:'border-box'}}/>
                    )}
                  </div>
                ))}
              </div>
              <AppleBtn small variant="ghost" onClick={() => {
                if (!splitForm.name||!splitForm.percentage) { toast('Nombre y porcentaje requeridos','error'); return; }
                setUploadSplits(s=>[...s,{...splitForm}]);
                setSplitForm({name:'',email:'',percentage:'',role:'productor'});
              }}>+ Agregar colaborador</AppleBtn>

              {/* Splits list */}
              {uploadSplits.length > 0 && (
                <div style={{marginTop:14,marginBottom:14}}>
                  {uploadSplits.map((s,i)=>(
                    <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 12px',background:'rgba(255,255,255,0.04)',borderRadius:10,marginBottom:6}}>
                      <span style={{flex:1,fontFamily:"'Space Grotesk',sans-serif",fontSize:13,color:'#fff'}}>{s.name} <span style={{color:'rgba(255,255,255,0.4)',fontSize:11}}>({s.role})</span></span>
                      <span style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:14,fontWeight:700,color:'#5E17EB'}}>{s.percentage}%</span>
                      <button onClick={()=>setUploadSplits(sp=>sp.filter((_,j)=>j!==i))} style={{background:'none',border:'none',cursor:'pointer',color:'rgba(255,255,255,0.3)',fontSize:16}}>×</button>
                    </div>
                  ))}
                  <div style={{display:'flex',justifyContent:'space-between',padding:'8px 12px',borderTop:'1px solid rgba(255,255,255,0.06)',marginTop:4}}>
                    <span style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:12,color:'rgba(255,255,255,0.4)'}}>Total asignado</span>
                    <span style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:13,fontWeight:700,color:totalSplitPct>100?'#FF453A':totalSplitPct===100?'#30D158':'#fff'}}>{totalSplitPct}%{totalSplitPct>100?' ⚠️ Supera 100%':''}</span>
                  </div>
                </div>
              )}
              {uploadSplits.length === 0 && <p style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:13,color:'rgba(255,255,255,0.25)',margin:'14px 0',textAlign:'center'}}>Sin colaboradores — toda la regalía es tuya</p>}

              <div style={{display:'flex',gap:12,marginTop:16}}>
                <AppleBtn fullWidth onClick={() => { if(totalSplitPct>100){toast('El total de splits supera 100%','error');return;} setUploadStep('platforms'); }}>SIGUIENTE: PLATAFORMAS →</AppleBtn>
                <AppleBtn variant="ghost" onClick={() => setUploadStep('metadata')}>← Atrás</AppleBtn>
              </div>
            </>

          ) : (
            <>
              <p style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:13,color:'rgba(255,255,255,0.5)',marginBottom:16}}>Selecciona dónde quieres distribuir tu música:</p>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:20}}>
                {['Spotify','Apple Music','YouTube Music','TikTok','Amazon Music','Deezer','Tidal','Napster'].map(pl=>(
                  <label key={pl} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',background:'rgba(255,255,255,0.04)',borderRadius:10,cursor:'pointer',border:`1px solid ${uploadPlatforms.includes(pl)?'rgba(94,23,235,0.4)':'rgba(255,255,255,0.07)'}`}}>
                    <input type="checkbox" checked={uploadPlatforms.includes(pl)} onChange={e=>setUploadPlatforms(p=>e.target.checked?[...p,pl]:p.filter(x=>x!==pl))} style={{accentColor:'#5E17EB'}}/>
                    <span style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:13,color:'#fff'}}>{pl}</span>
                  </label>
                ))}
              </div>
              <div style={{display:'flex',gap:12}}>
                <AppleBtn fullWidth disabled={publishing} onClick={async () => {
                  if (!aiMetadata.title) { toast('El título es obligatorio','error'); return; }
                  setPublishing(true);
                  try {
                    const track = await apiFetch('/tracks', { method:'POST', body: JSON.stringify({ title: aiMetadata.title, genre: aiMetadata.genre||'Sin género', bpm: aiMetadata.bpm?parseInt(aiMetadata.bpm):null, key: aiMetadata.key||null, release_type: aiMetadata.type||'single' }) });
                    for (const s of uploadSplits) {
                      await apiFetch('/splits', { method:'POST', body: JSON.stringify({ track_id: String(track.id), name: s.name, email: s.email, percentage: s.percentage, role: s.role, type:'master' }) }).catch(()=>{});
                    }
                    await apiFetch('/releases', { method:'POST', body: JSON.stringify({ title: aiMetadata.title, type: aiMetadata.type||'single', platforms: uploadPlatforms, track_id: track.id }) }).catch(()=>{});
                    toast('✅ Tu canción está lista para distribución', 'success');
                    closeUploadModal();
                    load();
                  } catch(e:any) { toast(e.message,'error'); }
                  setPublishing(false);
                }}>
                  {publishing ? 'Publicando...' : '🚀 PUBLICAR EN '+uploadPlatforms.length+' PLATAFORMAS'}
                </AppleBtn>
                <AppleBtn variant="ghost" onClick={() => setUploadStep('splits')}>← Atrás</AppleBtn>
              </div>
            </>
          )}
        </div>
      </div>
    )}
    <PageShell title="Catálogo & Distribución" helpText="Sube tus canciones en .wav o .flac. La IA extrae los metadatos automáticamente. Configura splits y distribución desde aquí.">
      {/* Tabs */}
      <div style={{display:'flex',gap:4,marginBottom:24,background:'rgba(255,255,255,0.03)',borderRadius:14,padding:4}}>
        {[
          {id:'tracks', label:'🎵 Mis Tracks'},
          {id:'upload', label:'⬆️ Subir Canción'},
          {id:'splits', label:'💰 Splits'},
          {id:'publishing', label:'📝 Publishing'},
          {id:'bulk', label:'📦 Subida Masiva'},
        ].map(t => (
          <button key={t.id} onClick={()=>setTab(t.id as any)}
            style={{flex:1,padding:'10px 8px',borderRadius:10,border:'none',cursor:'pointer',
              background:tab===t.id?'rgba(94,23,235,0.25)':'transparent',
              color:tab===t.id?'#C084FC':'rgba(255,255,255,0.35)',
              fontFamily:"'Space Grotesk',sans-serif",fontSize:11,fontWeight:700,transition:'all 0.2s'}}>
            {t.label}
          </button>
        ))}
      </div>

      {/* TRACKS tab — grid only */}
      {tab === 'tracks' && <>
        <div style={{display:'flex',gap:'4px',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'10px',padding:'4px',marginBottom:16,width:'fit-content'}}>
          {(['list','grid'] as const).map(mode => (
            <button key={mode} onClick={() => setViewMode(mode)} style={{ background: viewMode===mode ? 'rgba(94,23,235,0.4)' : 'transparent', border:'none', borderRadius:'7px', padding:'6px 12px', color: viewMode===mode ? '#fff' : 'rgba(255,255,255,0.3)', cursor:'pointer', fontSize:'11px', fontFamily:"'Space Grotesk',sans-serif", transition:'all 0.15s' }}>
              {mode === 'list' ? '☰ Lista' : '⊞ Grid'}
            </button>
          ))}
        </div>
        {loadingData ? (
          <div style={{ display:'grid', gridTemplateColumns: viewMode==='grid' ? 'repeat(auto-fill,minmax(180px,1fr))' : '1fr', gap:'14px' }}>
            {[0,1,2,3,4].map(i => <SkeletonCard key={i} rows={2} />)}
          </div>
        ) : tracks.length === 0 ? (
          <Card><div style={{ textAlign:'center', padding:'56px 24px' }}>
            <div style={{ fontSize:'56px', marginBottom:'20px' }}>🎵</div>
            <p style={{ color:'#F2EDE5', fontFamily:"'Anton',sans-serif", fontSize:'20px', letterSpacing:'0.06em', margin:'0 0 8px' }}>TU CATÁLOGO ESTÁ VACÍO</p>
            <p style={{ color:'rgba(255,255,255,0.3)', fontFamily:"'Space Grotesk',sans-serif", fontSize:'13px', margin:'0 0 24px' }}>Sube tu primer tema en la pestaña "Subir Canción"</p>
            <Btn3D small onClick={() => setTab('upload')}><Plus size={13}/> Subir primera canción</Btn3D>
          </div></Card>
        ) : viewMode === 'list' ? (
          <Card>{tracks.map(t => (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ width: '42px', height: '42px', background: COVER_GRADIENTS[t.id % COVER_GRADIENTS.length], borderRadius: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Music size={15} color="rgba(255,255,255,0.8)" /></div>
              <div style={{ flex: 1 }}><p style={{ color: '#fff', fontSize: '13px', fontWeight: 600, margin: 0, fontFamily: "'Space Grotesk',sans-serif" }}>{t.title}</p><p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', margin: 0, fontFamily: "'Space Grotesk',sans-serif" }}>{t.genre || 'Sin género'}</p></div>
              <span style={{ background: statusColors[t.status] || '#52525b', color: '#fff', fontSize: '10px', fontWeight: 700, padding: '3px 7px', borderRadius: '5px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{t.status}</span>
              <button onClick={() => del(t.id, t.title)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.2)', padding: '4px', borderRadius: '5px' }}><Trash2 size={14} /></button>
            </div>
          ))}</Card>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'16px' }}>
            {tracks.map(t => <TrackGridCard key={t.id} track={t} onDel={() => del(t.id, t.title)} />)}
          </div>
        )}
      </>}

      {/* UPLOAD tab — drag & drop + AI wizard */}
      {tab === 'upload' && <>
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={async e => { e.preventDefault(); setDragOver(false); const file = e.dataTransfer.files[0]; if (file) handleFileSelect(file); }}
          onClick={() => document.getElementById('catalog-file-input')?.click()}
          style={{ border: `2px dashed ${dragOver ? '#5E17EB' : 'rgba(255,255,255,0.1)'}`, borderRadius: 20, padding: '60px 24px', textAlign: 'center', cursor: 'pointer', background: dragOver ? 'rgba(94,23,235,0.08)' : 'rgba(255,255,255,0.02)', transition: 'all 0.3s ease', marginBottom: 20 }}>
          <input id="catalog-file-input" type="file" accept=".wav,.flac,.mp3,.aiff" style={{display:'none'}}
            onChange={e => { const file = e.target.files?.[0]; if (file) handleFileSelect(file); }} />
          <div style={{fontSize:48,marginBottom:16}}>🎵</div>
          <p style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:16,fontWeight:600,color:'#F5F5F7',margin:'0 0 8px'}}>Arrastra tu canción aquí</p>
          <p style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:13,color:'rgba(255,255,255,0.35)',margin:'0 0 16px'}}>.wav, .flac, .mp3, .aiff · Máx 1GB</p>
          <p style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:12,color:'rgba(94,23,235,0.7)',margin:0}}>✨ La IA extrae metadatos automáticamente</p>
        </div>
        <div style={{background:'rgba(94,23,235,0.06)',border:'1px solid rgba(94,23,235,0.15)',borderRadius:14,padding:16,textAlign:'center'}}>
          <p style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:13,color:'rgba(255,255,255,0.5)',margin:'0 0 4px'}}>El flujo de subida incluye: metadatos → splits → plataformas de distribución</p>
          <p style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:11,color:'rgba(255,255,255,0.25)',margin:0}}>Una vez publicado, aparecerá en "Mis Tracks"</p>
        </div>
      </>}

      {/* SPLITS tab */}
      {tab === 'splits' && <SplitsTab />}

      {/* BULK UPLOAD tab */}
      {tab === 'bulk' && (
        <div>
          <div onDragOver={e=>{e.preventDefault();setBulkDragging(true)}} onDragLeave={()=>setBulkDragging(false)} onDrop={e=>{e.preventDefault();setBulkDragging(false);setBulkFiles(f=>[...f,...Array.from(e.dataTransfer.files)])}}
            style={{border:`2px dashed ${bulkDragging?P:'rgba(255,255,255,0.15)'}`,borderRadius:16,padding:'48px 24px',textAlign:'center',cursor:'pointer',background:bulkDragging?`rgba(94,23,235,0.08)`:'rgba(255,255,255,0.02)',transition:'all 0.2s',marginBottom:20}}>
            <Upload size={32} color={bulkDragging?P:'rgba(255,255,255,0.2)'} style={{marginBottom:12}}/>
            <p style={{fontFamily:"'Anton',sans-serif",fontSize:16,color:'#F2EDE5',margin:'0 0 8px'}}>ARRASTRA ARCHIVOS AQUÍ</p>
            <p style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:13,color:'rgba(255,255,255,0.35)',margin:'0 0 16px'}}>MP3, WAV, FLAC — múltiples archivos a la vez</p>
            <label style={{cursor:'pointer'}}>
              <input type="file" multiple accept="audio/*" style={{display:'none'}} onChange={e=>{if(e.target.files)setBulkFiles(f=>[...f,...Array.from(e.target.files!)])}}/>
              <span style={{background:'rgba(94,23,235,0.2)',border:'1px solid rgba(94,23,235,0.4)',color:PL,padding:'8px 20px',borderRadius:8,fontFamily:"'Space Grotesk',sans-serif",fontSize:13,fontWeight:600}}>Seleccionar archivos</span>
            </label>
          </div>
          {bulkFiles.length > 0 && (
            <Card style={{marginBottom:16}}>
              <h3 style={{fontFamily:"'Anton',sans-serif",fontSize:14,color:'#F2EDE5',margin:'0 0 14px'}}>ARCHIVOS SELECCIONADOS ({bulkFiles.length})</h3>
              {bulkFiles.map((f,i)=>(
                <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
                  <span style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:13,color:'rgba(255,255,255,0.7)'}}>{f.name}</span>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <span style={{fontSize:11,color:'rgba(255,255,255,0.3)'}}>{(f.size/1048576).toFixed(1)}MB</span>
                    {bulkResults[i] && <span style={{fontSize:11,color:bulkResults[i].status==='ok'?'#22c55e':bulkResults[i].status==='error'?'#ef4444':'#f59e0b'}}>{bulkResults[i].status==='ok'?'✓ Listo':bulkResults[i].status==='error'?'✗ Error':'↑ Subiendo'}</span>}
                  </div>
                </div>
              ))}
              <div style={{display:'flex',gap:10,marginTop:14}}>
                <Btn3D small onClick={bulkUpload} disabled={bulkUploading}>{bulkUploading?'Subiendo...':'Subir todo'}</Btn3D>
                <Btn3D small variant="ghost" onClick={()=>{setBulkFiles([]);setBulkResults([])}}>Limpiar</Btn3D>
              </div>
            </Card>
          )}
          {bulkResults.length>0 && bulkResults.every(r=>r.status!=='uploading') && (
            <div style={{background:'rgba(34,197,94,0.08)',border:'1px solid rgba(34,197,94,0.2)',borderRadius:12,padding:16,textAlign:'center'}}>
              <p style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:13,color:'#22c55e',margin:0}}>
                ✓ {bulkResults.filter(r=>r.status==='ok').length} archivos subidos · {bulkResults.filter(r=>r.status==='error').length} errores
              </p>
            </div>
          )}
        </div>
      )}

      {/* PUBLISHING tab — registered works + lyrics sync */}
      {tab === 'publishing' && (
        <div style={{ display:'grid', gridTemplateColumns:'220px 1fr', gap:'20px' }}>
          <Card style={{ height:'fit-content' }}>
            <h3 style={{ fontFamily:"'Anton',sans-serif", fontSize:'13px', color:'#fff', letterSpacing:'0.06em', margin:'0 0 12px' }}>TRACKS</h3>
            {tracks.length===0 && <p style={{ color:'rgba(255,255,255,0.25)', fontSize:'12px', fontFamily:"'Space Grotesk',sans-serif" }}>Sin tracks</p>}
            {tracks.map(t=>(
              <button key={t.id} onClick={() => setLyricsSelected(String(t.id))} style={{ width:'100%', textAlign:'left', background: lyricsSelected===String(t.id)?'rgba(94,23,235,0.18)':'transparent', border:'none', borderRadius:'8px', padding:'8px 10px', color: lyricsSelected===String(t.id)?PL:'rgba(255,255,255,0.5)', fontSize:'12px', fontFamily:"'Space Grotesk',sans-serif", cursor:'pointer', marginBottom:'2px' }}>
                {t.title}
              </button>
            ))}
          </Card>
          <Card>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'14px' }}>
              <h3 style={{ fontFamily:"'Anton',sans-serif", fontSize:'13px', color:'#fff', letterSpacing:'0.06em', margin:0 }}>EDITOR DE LETRAS</h3>
              <div style={{ display:'flex', gap:'8px' }}>
                <Btn3D small variant="ghost" onClick={()=>{const blob=new Blob([lyrics],{type:'text/plain'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`lyrics_${lyricsSelected}.lrc`;a.click();URL.revokeObjectURL(url)}} disabled={!lyricsSelected}><Download size={13}/> LRC</Btn3D>
                <Btn3D small onClick={saveLyrics} disabled={!lyricsSelected}>{lyricsSaved?<><Check size={13}/> Guardado</>:<><Send size={13}/> Guardar + Publishing</>}</Btn3D>
              </div>
            </div>
            <p style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:11,color:'rgba(255,255,255,0.3)',margin:'0 0 10px'}}>💡 Al guardar, las letras se registran automáticamente en Publishing y en el Vault.</p>
            <textarea value={lyrics} onChange={e => setLyrics(e.target.value)} placeholder={lyricsSelected ? "[00:00.00] Escribe las letras en formato LRC...\n[00:05.00] Cada línea con timestamp" : "Selecciona un track para editar sus letras"} style={{ ...IS, resize:'vertical', minHeight:'340px', fontFamily:'monospace', fontSize:'13px', lineHeight:1.7 }} />
          </Card>
        </div>
      )}
    </PageShell>
    </>
  );
}

// ─── ROYALTIES ───────────────────────────────────────────────────────────────
function RoyaltiesPage() {
  const [tab, setTab] = useState<'overview'|'master'|'publishing'|'history'>('overview');
  const [summary, setSummary] = useState<any>(null);
  const [monthly, setMonthly] = useState<any[]>([]);
  const [publishing, setPublishing] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  useEffect(() => {
    Promise.all([
      apiFetch('/royalties/summary').then(setSummary).catch(()=>{}),
      apiFetch('/royalties/monthly').then(setMonthly).catch(()=>{}),
      apiFetch('/publishing').then(d => setPublishing(Array.isArray(d)?d:[])).catch(()=>{}),
    ]).finally(()=>setLoadingData(false));
  }, []);

  const TABS = [
    { id: 'overview',   label: 'Resumen General',        icon: BarChart3 },
    { id: 'master',     label: 'Master (Grabación)',      icon: Music },
    { id: 'publishing', label: 'Publishing (Composición)',icon: BookOpen },
    { id: 'history',    label: 'Historial',               icon: TrendingUp },
  ] as const;

  const totalRevenue = summary ? Number(summary.totalRevenue||0) : 0;
  const platforms = summary?.byPlatform ? Object.entries(summary.byPlatform) : [];
  const maxPlatform = platforms.length > 0 ? Math.max(...platforms.map(([,v]:any)=>Number(v)), 1) : 1;

  return (
    <>
    <PageBackground color="#22c55e" />
    <PageShell title="Regalías" helpText="Aquí ves todas tus regalías: Master (por reproducciones) y Publishing (por composición). Los pagos llegan 30-60 días después de cada mes.">
      {/* Tabs */}
      <div style={{display:'flex',gap:4,marginBottom:24,background:'rgba(255,255,255,0.03)',borderRadius:14,padding:4}}>
        {TABS.map(t => (
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:6,padding:'10px 8px',borderRadius:10,border:'none',cursor:'pointer',background:tab===t.id?'rgba(94,23,235,0.25)':'transparent',color:tab===t.id?'#C084FC':'rgba(255,255,255,0.35)',fontFamily:"'Space Grotesk',sans-serif",fontSize:11,fontWeight:700,transition:'all 0.2s',boxShadow:tab===t.id?'0 0 20px rgba(94,23,235,0.2)':'none',whiteSpace:'nowrap'}}>
            <t.icon size={13}/>{t.label}
          </button>
        ))}
      </div>
      {/* Hero balance card */}
      <div style={{position:'relative',background:'linear-gradient(135deg,#000d08,#001a10,#000d08)',border:'1px solid rgba(34,197,94,0.15)',borderRadius:'24px',padding:'36px 48px',marginBottom:'24px',overflow:'hidden',minHeight:180,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{position:'absolute',right:40,top:'50%',transform:'translateY(-50%)',fontFamily:"'Anton',sans-serif",fontSize:280,color:'rgba(34,197,94,0.03)',lineHeight:1,pointerEvents:'none'}}>$</div>
        <div style={{position:'relative',zIndex:1}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
            <div style={{width:7,height:7,borderRadius:'50%',background:'#22c55e',animation:'pulse 1.5s infinite'}}/>
            <span style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:11,fontWeight:700,letterSpacing:'0.25em',textTransform:'uppercase',color:'rgba(34,197,94,0.7)'}}>BALANCE TOTAL DISPONIBLE</span>
          </div>
          <div style={{fontFamily:"'Anton',sans-serif",fontSize:'clamp(3rem,6vw,5rem)',color:'#22c55e',lineHeight:1,letterSpacing:'-0.02em',textShadow:'0 0 60px rgba(34,197,94,0.8)'}}>
            ${loadingData ? '—' : totalRevenue.toFixed(2)}
          </div>
          <p style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:13,color:'rgba(255,255,255,0.3)',marginTop:8}}>
            Master: ${Number(summary?.masterRevenue||totalRevenue).toFixed(2)} · Publishing: ${Number(summary?.publishingRevenue||0).toFixed(2)}
          </p>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:10,alignItems:'flex-end',position:'relative',zIndex:1}}>
          {loadingData ? null : [
            {label:'Streams',value:Number(summary?.totalStreams||0).toLocaleString(),icon:TrendingUp},
            {label:'Plataformas',value:Object.keys(summary?.byPlatform||{}).length,icon:Globe},
          ].map(s=>(
            <div key={s.label} style={{display:'flex',alignItems:'center',gap:6,background:'rgba(34,197,94,0.08)',border:'1px solid rgba(34,197,94,0.15)',borderRadius:8,padding:'6px 12px'}}>
              <s.icon size={12} color="#22c55e"/>
              <span style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:12,color:'rgba(255,255,255,0.6)'}}>{s.label}:</span>
              <span style={{fontFamily:"'Anton',sans-serif",fontSize:13,color:'#22c55e'}}>{s.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Overview tab */}
      {tab === 'overview' && (
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
          <Card>
            <h3 style={{fontFamily:"'Anton',sans-serif",fontSize:15,color:'#F2EDE5',letterSpacing:'0.06em',margin:'0 0 16px'}}>POR PLATAFORMA</h3>
            {loadingData && [0,1,2].map(i=><div key={i} style={{marginBottom:14}}><Skeleton h="32px" radius="8px"/></div>)}
            {!loadingData && platforms.length===0 && <p style={{color:'rgba(255,255,255,0.25)',fontSize:13,fontFamily:"'Space Grotesk',sans-serif"}}>Sin datos de plataformas aún.</p>}
            {platforms.map(([p,v]:any,pi:number)=>{
              const pct=Math.min(100,(Number(v)/maxPlatform)*100);
              const c=[P,PL,'#3b82f6','#22c55e','#f59e0b','#ec4899'][pi%6];
              return <div key={p} style={{marginBottom:12,background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.05)',borderRadius:12,padding:'10px 14px'}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}><span style={{color:'rgba(255,255,255,0.7)',textTransform:'capitalize',fontSize:13,fontFamily:"'Space Grotesk',sans-serif"}}>{p}</span><span style={{color:'#22c55e',fontWeight:700,fontSize:13,fontFamily:"'Space Grotesk',sans-serif"}}>${Number(v).toFixed(2)}</span></div>
                <div style={{height:5,background:'rgba(255,255,255,0.05)',borderRadius:100,overflow:'hidden'}}><div style={{height:'100%',background:`linear-gradient(90deg,${c}88,${c})`,borderRadius:100,width:`${pct}%`,boxShadow:`0 0 8px ${c}60`,transition:'width 1s ease'}}/></div>
              </div>;
            })}
          </Card>
          <Card>
            <h3 style={{fontFamily:"'Anton',sans-serif",fontSize:15,color:'#F2EDE5',letterSpacing:'0.06em',margin:'0 0 16px'}}>MASTER vs PUBLISHING</h3>
            {[
              {label:'Master (Grabación)',value:summary?.masterRevenue||totalRevenue,color:P,pct:70},
              {label:'Publishing (Composición)',value:summary?.publishingRevenue||0,color:'#C084FC',pct:30},
            ].map((item,i)=>(
              <div key={i} style={{marginBottom:20}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                  <span style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:13,color:'rgba(255,255,255,0.6)'}}>{item.label}</span>
                  <span style={{fontFamily:"'Anton',sans-serif",fontSize:13,color:item.color}}>${Number(item.value).toFixed(2)}</span>
                </div>
                <div style={{height:8,background:'rgba(255,255,255,0.05)',borderRadius:100,overflow:'hidden'}}>
                  <div style={{height:'100%',width:`${item.pct}%`,background:item.color,borderRadius:100,boxShadow:`0 0 8px ${item.color}80`,transition:'width 1s ease'}}/>
                </div>
              </div>
            ))}
          </Card>
        </div>
      )}

      {/* Master tab */}
      {tab === 'master' && (
        <Card>
          <h3 style={{fontFamily:"'Anton',sans-serif",fontSize:16,color:'#F2EDE5',margin:'0 0 8px'}}>REGALÍAS DE MASTER</h3>
          <p style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:13,color:'rgba(255,255,255,0.4)',margin:'0 0 20px'}}>Ingresos por reproducción de tus grabaciones en plataformas de streaming.</p>
          {platforms.length===0 && <p style={{color:'rgba(255,255,255,0.25)',fontFamily:"'Space Grotesk',sans-serif",fontSize:13}}>Sin datos de master aún.</p>}
          {platforms.map(([p,v]:any,i:number)=>(
            <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'12px 0',borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
              <span style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:13,color:'rgba(255,255,255,0.6)',textTransform:'capitalize'}}>{p}</span>
              <span style={{fontFamily:"'Anton',sans-serif",fontSize:14,color:'#F2EDE5'}}>${Number(v).toFixed(2)}</span>
            </div>
          ))}
        </Card>
      )}

      {/* Publishing tab */}
      {tab === 'publishing' && (
        <Card>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
            <div>
              <h3 style={{fontFamily:"'Anton',sans-serif",fontSize:16,color:'#F2EDE5',margin:'0 0 4px'}}>OBRAS REGISTRADAS</h3>
              <p style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:12,color:'rgba(255,255,255,0.35)',margin:0}}>Sincronizado con tu catálogo de letras</p>
            </div>
            <Btn3D small onClick={()=>toast('Usa la pestaña Letras en Catálogo para registrar obras','info')}>+ REGISTRAR OBRA</Btn3D>
          </div>
          {publishing.length===0 ? (
            <p style={{color:'rgba(255,255,255,0.25)',fontFamily:"'Space Grotesk',sans-serif",fontSize:13,textAlign:'center',padding:'20px 0'}}>No hay obras registradas. Las letras de tu catálogo aparecerán aquí automáticamente.</p>
          ) : publishing.map((p:any,i:number)=>(
            <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 0',borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
              <div>
                <p style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:13,fontWeight:600,color:'#F2EDE5',margin:0}}>{p.title}</p>
                <p style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:11,color:'rgba(255,255,255,0.3)',margin:0}}>ISWC: {p.iswc||'Pendiente'}</p>
              </div>
              <span style={{fontFamily:"'Anton',sans-serif",fontSize:13,color:'#C084FC'}}>${Number(p.revenue||0).toFixed(2)}</span>
            </div>
          ))}
        </Card>
      )}

      {/* History tab */}
      {tab === 'history' && (
        <Card>
          <h3 style={{fontFamily:"'Anton',sans-serif",fontSize:16,color:'#F2EDE5',margin:'0 0 16px'}}>HISTORIAL MENSUAL</h3>
          {monthly.length===0 && <p style={{color:'rgba(255,255,255,0.25)',fontFamily:"'Space Grotesk',sans-serif",fontSize:13}}>Sin historial aún.</p>}
          {monthly.map((m:any,i:number)=>(
            <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
              <span style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:13,color:'rgba(255,255,255,0.55)'}}>{m.month}</span>
              <span style={{fontFamily:"'Anton',sans-serif",fontSize:14,color:'#22c55e'}}>${Number(m.revenue||0).toFixed(2)}</span>
            </div>
          ))}
        </Card>
      )}
    </PageShell>
    </>
  );
}

// ─── AI CHAT ─────────────────────────────────────────────────────────────────
const CHAT_CHIPS = [
  'Cómo subir mis streams en Spotify',
  'Estrategia de lanzamiento para este mes',
  'Explícame cómo funcionan los splits',
  'Ideas de marketing para reggaeton',
  'Cuál es el mejor momento para lanzar un sencillo',
];

function AIChatPage() {
  const [messages, setMessages] = useState<{role:string;content:string}[]>([{role:'assistant',content:'¡Hola! Soy tu asistente musical IA. ¿En qué puedo ayudarte hoy? Elige una sugerencia o escribe tu pregunta.'}]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showChips, setShowChips] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:'smooth'})},[messages]);

  const send = async (msg?: string) => {
    const text = (msg || input).trim();
    if (!text || loading) return;
    setInput(''); setShowChips(false);
    setMessages(p=>[...p,{role:'user',content:text}]);
    setLoading(true);
    try {
      const d = await apiFetch('/ai/chat',{method:'POST',body:JSON.stringify({message:text,history:messages})});
      setMessages(p=>[...p,{role:'assistant',content:d.response||d.message||'Sin respuesta'}]);
    } catch(e:any) {
      const msg = e.message || 'Error al contactar el servicio de IA';
      setMessages(p=>[...p,{role:'assistant',content:msg}]);
    }
    setLoading(false);
  };

  return (
    <PageShell title="IA Chat" helpText="Soporte 24/7 de IM Music. Pregúntame cómo usar cualquier función, resolver dudas sobre distribución, regalías o marketing musical.">
      <div style={{ position:'relative', background:'rgba(6,3,14,0.94)', backdropFilter:'blur(28px)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'24px', overflow:'hidden', display:'flex', flexDirection:'column', height:'calc(100vh - 160px)', minHeight:'480px' }}>
        {/* Neural dot pattern background */}
        <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(rgba(94,23,235,0.12) 1.5px, transparent 1.5px)', backgroundSize:'28px 28px', pointerEvents:'none', zIndex:0 }} />
        {/* Floating abstract shapes */}
        <div style={{ position:'absolute', top:'-40px', right:'-40px', width:220, height:220, borderRadius:'50%', background:'radial-gradient(circle, rgba(59,130,246,0.08), transparent 70%)', animation:'orbFloat0 14s ease-in-out infinite', pointerEvents:'none', zIndex:0 }} />
        <div style={{ position:'absolute', bottom:60, left:'-30px', width:160, height:160, background:'radial-gradient(circle, rgba(94,23,235,0.07), transparent 70%)', transform:'rotate(45deg)', animation:'orbFloat1 18s ease-in-out infinite', pointerEvents:'none', zIndex:0 }} />
        <div style={{ position:'absolute', top:'45%', right:'15%', width:100, height:100, borderRadius:'50%', background:'radial-gradient(circle, rgba(192,132,252,0.06), transparent 70%)', animation:'orbFloat2 22s ease-in-out infinite', pointerEvents:'none', zIndex:0 }} />
        {/* Chat header */}
        <div style={{ position:'relative', zIndex:1, display:'flex', alignItems:'center', gap:'12px', padding:'16px 20px', borderBottom:'1px solid rgba(255,255,255,0.06)', flexShrink:0 }}>
          <div style={{ position:'relative', flexShrink:0 }}>
            <div style={{ width:'38px', height:'38px', background:`linear-gradient(135deg,${P},${PL})`, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:`0 0 16px rgba(94,23,235,0.5)` }}>
              <Sparkles size={16} color="#fff"/>
            </div>
            {/* Pulse ring */}
            <div style={{ position:'absolute', inset:'-4px', borderRadius:'50%', border:`2px solid ${P}44`, animation:'glowPulse 2s ease-in-out infinite' }} />
          </div>
          <div>
            <p style={{ color:'#F2EDE5', fontSize:'14px', fontWeight:700, margin:0, fontFamily:"'Space Grotesk',sans-serif" }}>Asistente IA Musical</p>
            <p style={{ color:'rgba(94,23,235,0.7)', fontSize:'11px', margin:0, fontFamily:"'Space Grotesk',sans-serif", letterSpacing:'0.05em' }}>● Activo ahora</p>
          </div>
        </div>

        {/* Messages */}
        <div style={{ position:'relative', zIndex:1, flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:'14px', padding:'20px 20px 8px', scrollbarWidth:'none' }}>
          {messages.map((m,i)=>(
            <div key={i} style={{display:'flex',justifyContent:m.role==='user'?'flex-end':'flex-start',alignItems:'flex-end',gap:'8px',animation:'messageAppear 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards'}}>
              {m.role==='assistant' && (
                <div style={{width:'28px',height:'28px',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,position:'relative',overflow:'hidden'}}>
                  <div style={{position:'absolute',inset:0,borderRadius:'50%',background:`conic-gradient(${P},${PL},#C084FC,${P})`,animation:'conicSpin 3s linear infinite'}}/>
                  <div style={{position:'relative',zIndex:1,width:'22px',height:'22px',borderRadius:'50%',background:'#0a0414',display:'flex',alignItems:'center',justifyContent:'center'}}><Sparkles size={10} color={PL}/></div>
                </div>
              )}
              <div style={{maxWidth:'72%',padding:'13px 16px',borderRadius:m.role==='user'?'18px 18px 4px 18px':'4px 18px 18px 18px',fontSize:'13px',lineHeight:'1.65',background:m.role==='user'?`linear-gradient(300deg,${P},${PL},#C084FC,${P})`:'rgba(255,255,255,0.06)',backgroundSize:m.role==='user'?'300% 300%':'auto',animation:m.role==='user'?'bubbleGradient 4s ease infinite':undefined,color:'#fff',border:m.role==='user'?'none':'1px solid rgba(255,255,255,0.08)',fontFamily:"'Space Grotesk',sans-serif",boxShadow:m.role==='user'?`0 4px 20px rgba(94,23,235,0.4), 0 0 40px rgba(94,23,235,0.15)`:'none'}}>{m.content}</div>
            </div>
          ))}
          {loading && (
            <div style={{display:'flex',justifyContent:'flex-start',alignItems:'flex-end',gap:'8px'}}>
              <div style={{width:'28px',height:'28px',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,position:'relative',overflow:'hidden'}}>
                <div style={{position:'absolute',inset:0,borderRadius:'50%',background:`conic-gradient(${P},${PL},#C084FC,${P})`,animation:'conicSpin 3s linear infinite'}}/>
                <div style={{position:'relative',zIndex:1,width:'22px',height:'22px',borderRadius:'50%',background:'#0a0414',display:'flex',alignItems:'center',justifyContent:'center'}}><Sparkles size={10} color={PL}/></div>
              </div>
              <div style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.08)',padding:'14px 18px',borderRadius:'4px 18px 18px 18px',display:'flex',gap:'5px',alignItems:'center'}}>
                {[0,1,2].map(i=><div key={i} style={{width:'7px',height:'7px',background:PL,borderRadius:'50%',animation:`typingBounce 1.2s ease-in-out ${i*0.18}s infinite`}}/>)}
              </div>
            </div>
          )}
          <div ref={bottomRef}/>
        </div>

        {/* Suggestion chips */}
        {showChips && (
          <div style={{ position:'relative', zIndex:1, padding:'12px 20px 0', borderTop:'1px solid rgba(255,255,255,0.05)' }}>
            <p style={{color:'rgba(255,255,255,0.2)',fontSize:'10px',fontFamily:"'Space Grotesk',sans-serif",margin:'0 0 8px',letterSpacing:'0.12em',textTransform:'uppercase'}}>Sugerencias</p>
            <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
              {CHAT_CHIPS.map(chip=>(
                <button key={chip} onClick={()=>send(chip)}
                  style={{background:'rgba(94,23,235,0.08)',border:'1px solid rgba(94,23,235,0.22)',borderRadius:'100px',padding:'6px 14px',color:'rgba(255,255,255,0.65)',fontSize:'11px',fontFamily:"'Space Grotesk',sans-serif",cursor:'pointer',transition:'all 0.2s cubic-bezier(0.34,1.56,0.64,1)',whiteSpace:'nowrap'}}
                  onMouseEnter={e=>{const el=e.currentTarget as HTMLElement;el.style.background='rgba(94,23,235,0.2)';el.style.color='#fff';el.style.transform='translateY(-2px)';el.style.boxShadow=`0 6px 20px rgba(94,23,235,0.25)`;}}
                  onMouseLeave={e=>{const el=e.currentTarget as HTMLElement;el.style.background='rgba(94,23,235,0.08)';el.style.color='rgba(255,255,255,0.65)';el.style.transform='';el.style.boxShadow='';}}>
                  {chip}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input bar */}
        <div style={{ position:'relative', zIndex:1, display:'flex', gap:'10px', padding:'14px 20px 18px', borderTop:'1px solid rgba(255,255,255,0.06)', alignItems:'center', flexShrink:0 }}>
          <button title="Voz (próximamente)" onClick={()=>toast('Entrada de voz próximamente','info')}
            style={{width:'42px',height:'42px',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',cursor:'not-allowed',flexShrink:0,opacity:0.45}}>
            <Mic size={16} color="rgba(255,255,255,0.5)"/>
          </button>
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder="Escribe tu pregunta musical..."
            style={{flex:1,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'14px',padding:'12px 18px',color:'#fff',fontFamily:"'Space Grotesk',sans-serif",fontSize:'13px',outline:'none',transition:'border-color 0.2s, box-shadow 0.2s'}}
            onFocus={e=>{(e.currentTarget as HTMLElement).style.borderColor='rgba(94,23,235,0.5)';(e.currentTarget as HTMLElement).style.boxShadow='0 0 20px rgba(94,23,235,0.15)';}}
            onBlur={e=>{(e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.08)';(e.currentTarget as HTMLElement).style.boxShadow='none';}}
          />
          <Btn3D small onClick={()=>send()} disabled={loading||!input.trim()}><Send size={14}/></Btn3D>
        </div>
      </div>
    </PageShell>
  );
}

// ─── SHARED INPUT STYLE ───────────────────────────────────────────────────────
const IS: React.CSSProperties = { background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'10px', padding:'10px 14px', color:'#fff', fontFamily:"'Space Grotesk',sans-serif", fontSize:'13px', outline:'none', width:'100%' };
function EmptyState({ icon: Icon, text, emoji }: { icon: any; text: string; emoji?: string }) {
  return (
    <div style={{ textAlign:'center', padding:'56px 24px' }}>
      {emoji ? (
        <div style={{ fontSize:'48px', marginBottom:'16px', display:'inline-block', animation:'dashFloat 3s ease-in-out infinite' }}>{emoji}</div>
      ) : (
        <Icon size={36} color="rgba(94,23,235,0.25)" style={{ marginBottom:'16px', display:'block', margin:'0 auto 16px' }} />
      )}
      <p style={{ color:'rgba(255,255,255,0.2)', fontFamily:"'Space Grotesk',sans-serif", fontSize:'13px', margin:0 }}>{text}</p>
    </div>
  );
}
function Badge({ color, label }: { color: string; label: string }) {
  return <span style={{ background:`${color}22`, color, border:`1px solid ${color}55`, borderRadius:'6px', padding:'2px 8px', fontSize:'10px', fontWeight:700, fontFamily:"'Space Grotesk',sans-serif", textTransform:'uppercase', letterSpacing:'0.08em' }}>{label}</span>;
}

// ─── PUBLISHING ───────────────────────────────────────────────────────────────
function PublishingPage() {
  const [items, setItems] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title:'', composers:'', splits:'', iswc:'' });
  const [loading, setLoading] = useState(false);
  const load = () => apiFetch('/publishing').then(d => setItems(Array.isArray(d) ? d : [])).catch(() => {});
  useEffect(() => { load(); }, []);
  const save = async () => {
    if (!form.title) return; setLoading(true);
    try { await apiFetch('/publishing', { method:'POST', body: JSON.stringify(form) }); setForm({ title:'', composers:'', splits:'', iswc:'' }); setShowForm(false); load(); toast('Obra registrada exitosamente'); } catch(e:any) { toast(e.message,'error'); }
    setLoading(false);
  };
  return (
    <PageShell title="Publishing" action={<Btn3D small onClick={() => setShowForm(!showForm)}><Plus size={13}/> Nueva obra</Btn3D>}>
      {showForm && <Card style={{ marginBottom:'20px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'10px' }}>
          <input style={IS} placeholder="Título de la obra" value={form.title} onChange={e => setForm(f=>({...f,title:e.target.value}))} />
          <input style={IS} placeholder="ISWC (opcional)" value={form.iswc} onChange={e => setForm(f=>({...f,iswc:e.target.value}))} />
          <input style={IS} placeholder="Compositores (separar con comas)" value={form.composers} onChange={e => setForm(f=>({...f,composers:e.target.value}))} />
          <input style={IS} placeholder="Splits % (ej: 50/50)" value={form.splits} onChange={e => setForm(f=>({...f,splits:e.target.value}))} />
        </div>
        <div style={{ display:'flex', gap:'10px' }}>
          <Btn3D small onClick={save} disabled={loading}>{loading?'Guardando...':'Registrar'}</Btn3D>
          <Btn3D small variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Btn3D>
        </div>
      </Card>}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'16px', marginBottom:'20px' }}>
        {[{label:'Obras registradas',value:items.length,icon:BookOpen},{label:'Con ISWC',value:items.filter(i=>i.iswc).length,icon:Check},{label:'Regalías pub.',value:'$0.00',icon:DollarSign}].map(c=><StatCard key={c.label} label={c.label} value={c.value} icon={c.icon}/>)}
      </div>
      <Card>
        {items.length===0 && <EmptyState icon={BookOpen} text="Sin obras registradas. Registra tu primera composición." />}
        {items.map(it=>(
          <div key={it.id} style={{ display:'flex', alignItems:'center', gap:'14px', padding:'12px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ width:'38px', height:'38px', background:'rgba(94,23,235,0.12)', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><BookOpen size={15} color={PL}/></div>
            <div style={{ flex:1 }}>
              <p style={{ color:'#fff', fontSize:'13px', fontWeight:600, margin:'0 0 2px', fontFamily:"'Space Grotesk',sans-serif" }}>{it.title}</p>
              <p style={{ color:'rgba(255,255,255,0.3)', fontSize:'11px', margin:0, fontFamily:"'Space Grotesk',sans-serif" }}>{it.composers || '—'}</p>
            </div>
            {it.iswc && <Badge color={PL} label={it.iswc}/>}
            <span style={{ color:'rgba(255,255,255,0.3)', fontSize:'11px', fontFamily:"'Space Grotesk',sans-serif" }}>{it.splits || '—'}</span>
          </div>
        ))}
      </Card>
    </PageShell>
  );
}

// ─── RELEASES ─────────────────────────────────────────────────────────────────
function ReleasesPage() {
  const [releases, setReleases] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title:'', release_date:'', platforms:'Spotify,Apple Music,YouTube', status:'draft' });
  const [loading, setLoading] = useState(false);
  const load = () => apiFetch('/releases').then(d => setReleases(Array.isArray(d) ? d : [])).catch(() => {});
  useEffect(() => { load(); }, []);
  const save = async () => {
    if (!form.title) return; setLoading(true);
    try { await apiFetch('/releases', { method:'POST', body: JSON.stringify(form) }); setForm({ title:'', release_date:'', platforms:'Spotify,Apple Music,YouTube', status:'draft' }); setShowForm(false); load(); toast('Release programado'); } catch(e:any) { toast(e.message,'error'); }
    setLoading(false);
  };
  const statusColor: Record<string,string> = { draft:'#71717a', scheduled:'#3b82f6', published:'#22c55e' };
  return (
    <PageShell title="Releases" action={<Btn3D small onClick={() => setShowForm(!showForm)}><Plus size={13}/> Nuevo release</Btn3D>}>
      {showForm && <Card style={{ marginBottom:'20px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'10px' }}>
          <input style={IS} placeholder="Título del release" value={form.title} onChange={e => setForm(f=>({...f,title:e.target.value}))} />
          <input style={{...IS, colorScheme:'dark'}} type="date" value={form.release_date} onChange={e => setForm(f=>({...f,release_date:e.target.value}))} />
          <input style={IS} placeholder="Plataformas (separar con comas)" value={form.platforms} onChange={e => setForm(f=>({...f,platforms:e.target.value}))} />
          <select style={{...IS}} value={form.status} onChange={e => setForm(f=>({...f,status:e.target.value}))}>
            <option value="draft">Borrador</option>
            <option value="scheduled">Programado</option>
            <option value="published">Publicado</option>
          </select>
        </div>
        <div style={{ display:'flex', gap:'10px' }}>
          <Btn3D small onClick={save} disabled={loading}>{loading?'Guardando...':'Programar'}</Btn3D>
          <Btn3D small variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Btn3D>
        </div>
      </Card>}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'16px', marginBottom:'20px' }}>
        {[{label:'Total releases',value:releases.length,icon:Package},{label:'Programados',value:releases.filter(r=>r.status==='scheduled').length,icon:Calendar},{label:'Publicados',value:releases.filter(r=>r.status==='published').length,icon:Check}].map(c=><StatCard key={c.label} label={c.label} value={c.value} icon={c.icon}/>)}
      </div>
      <Card>
        {releases.length===0 && <EmptyState icon={Calendar} text="Sin releases. Programa tu próximo lanzamiento." />}
        {releases.map(r=>(
          <div key={r.id} style={{ display:'flex', alignItems:'center', gap:'14px', padding:'12px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ width:'38px', height:'38px', background:'rgba(94,23,235,0.12)', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><Calendar size={15} color={PL}/></div>
            <div style={{ flex:1 }}>
              <p style={{ color:'#fff', fontSize:'13px', fontWeight:600, margin:'0 0 2px', fontFamily:"'Space Grotesk',sans-serif" }}>{r.title}</p>
              <p style={{ color:'rgba(255,255,255,0.3)', fontSize:'11px', margin:0, fontFamily:"'Space Grotesk',sans-serif" }}>{r.release_date ? new Date(r.release_date).toLocaleDateString('es-CO') : '—'} · {r.platforms}</p>
            </div>
            <Badge color={statusColor[r.status]||'#71717a'} label={r.status}/>
          </div>
        ))}
      </Card>
    </PageShell>
  );
}

// ─── VIDEOS ───────────────────────────────────────────────────────────────────
function VideosPage() {
  const [videosTab, setVideosTab] = useState<'videos'|'content-id'|'yt-artists'|'analytics'>('videos');
  const [videos, setVideos] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title:'', description:'' });
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);
  const load = () => apiFetch('/videos').then(d => setVideos(Array.isArray(d) ? d : [])).catch(() => {});
  useEffect(() => {
    load();
    apiFetch('/videos/analytics').then(setAnalytics).catch(()=>{});
  }, []);
  const save = async () => {
    if (!form.title) return; setLoading(true);
    try { await apiFetch('/videos', { method:'POST', body: JSON.stringify(form) }); setForm({ title:'', description:'' }); setShowForm(false); load(); } catch {}
    setLoading(false);
  };

  const VIDEOS_TABS = [{id:'videos',label:'Mis Videos',icon:Video},{id:'content-id',label:'Content ID',icon:Shield},{id:'yt-artists',label:'YT for Artists',icon:Award},{id:'analytics',label:'Analytics',icon:BarChart3}] as const;

  return (
    <PageShell title="Videos & YouTube" action={videosTab==='videos'?<Btn3D small onClick={() => setShowForm(!showForm)}><Plus size={13}/> Subir video</Btn3D>:undefined}>
      {/* Tabs */}
      <div style={{display:'flex',gap:4,marginBottom:20,background:'rgba(255,255,255,0.03)',borderRadius:12,padding:4}}>
        {VIDEOS_TABS.map(t=>(
          <button key={t.id} onClick={()=>setVideosTab(t.id)}
            style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:6,padding:'9px 8px',borderRadius:9,border:'none',cursor:'pointer',background:videosTab===t.id?'rgba(255,0,0,0.15)':'transparent',color:videosTab===t.id?'#ff4444':'rgba(255,255,255,0.35)',fontFamily:"'Space Grotesk',sans-serif",fontSize:11,fontWeight:700,transition:'all 0.2s',whiteSpace:'nowrap'}}>
            <t.icon size={12}/>{t.label}
          </button>
        ))}
      </div>

      {/* Videos tab */}
      {videosTab === 'videos' && <>
        {showForm && <Card style={{ marginBottom:'20px' }}>
          <div style={{ display:'flex', flexDirection:'column', gap:'10px', marginBottom:'10px' }}>
            <input style={IS} placeholder="Título del video" value={form.title} onChange={e => setForm(f=>({...f,title:e.target.value}))} />
            <textarea style={{...IS, resize:'vertical', minHeight:'72px'}} placeholder="Descripción" value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))} />
            <div style={{ border:'2px dashed rgba(255,255,255,0.1)', borderRadius:'10px', padding:'24px', textAlign:'center', color:'rgba(255,255,255,0.25)', fontSize:'13px', fontFamily:"'Space Grotesk',sans-serif" }}><Upload size={20} style={{ display:'block', margin:'0 auto 8px' }}/> Arrastra el archivo de video aquí</div>
          </div>
          <div style={{ display:'flex', gap:'10px' }}>
            <Btn3D small onClick={save} disabled={loading}>{loading?'Guardando...':'Registrar'}</Btn3D>
            <Btn3D small variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Btn3D>
          </div>
        </Card>}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px,1fr))', gap:'16px' }}>
          {videos.length===0 && <Card style={{ gridColumn:'1/-1' }}><EmptyState icon={Video} text="Sin videos. Sube tu primer video musical." /></Card>}
          {videos.map(v=>(
            <Card key={v.id} style={{ padding:'0', overflow:'hidden' }}>
              <div style={{ height:'120px', background:'rgba(255,0,0,0.06)', display:'flex', alignItems:'center', justifyContent:'center', borderRadius:'20px 20px 0 0' }}><Video size={32} color="rgba(255,255,255,0.15)"/></div>
              <div style={{ padding:'14px' }}>
                <p style={{ color:'#fff', fontSize:'13px', fontWeight:600, margin:'0 0 4px', fontFamily:"'Space Grotesk',sans-serif" }}>{v.title}</p>
                <p style={{ color:'rgba(255,255,255,0.3)', fontSize:'11px', margin:0, fontFamily:"'Space Grotesk',sans-serif" }}>{v.description||'Sin descripción'}</p>
                <div style={{ marginTop:'10px' }}><Badge color="#22c55e" label={v.status||'pendiente'}/></div>
              </div>
            </Card>
          ))}
        </div>
      </>}

      {/* Content ID tab */}
      {videosTab === 'content-id' && (
        <Card>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20}}>
            <div>
              <h3 style={{fontFamily:"'Anton',sans-serif",fontSize:18,color:'#F2EDE5',margin:'0 0 8px'}}>YOUTUBE CONTENT ID</h3>
              <p style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:13,color:'rgba(255,255,255,0.5)',margin:0,maxWidth:480}}>Protege tu música en YouTube. Cuando alguien use tu audio, tú monetizas automáticamente en lugar de ellos.</p>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:6,background:'rgba(255,165,0,0.1)',border:'1px solid rgba(255,165,0,0.3)',borderRadius:8,padding:'6px 14px',flexShrink:0}}>
              <div style={{width:6,height:6,borderRadius:'50%',background:'#f59e0b'}}/>
              <span style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:11,fontWeight:700,color:'#f59e0b'}}>PENDIENTE ACTIVACIÓN</span>
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:24}}>
            {[
              {num:'1',label:'Verificar elegibilidad',desc:'Mínimo 10 tracks distribuidos',done:false},
              {num:'2',label:'Enviar solicitud',desc:'IM Music gestiona el registro',done:false},
              {num:'3',label:'Activar monetización',desc:'Empieza a generar ingresos',done:false},
            ].map(step=>(
              <div key={step.num} style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:12,padding:16,textAlign:'center'}}>
                <div style={{width:32,height:32,borderRadius:'50%',background:step.done?'#22c55e':'rgba(255,255,255,0.1)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 10px',fontFamily:"'Anton',sans-serif",fontSize:14,color:step.done?'#fff':'rgba(255,255,255,0.4)'}}>{step.done?'✓':step.num}</div>
                <p style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:12,fontWeight:600,color:'#fff',margin:'0 0 4px'}}>{step.label}</p>
                <p style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:11,color:'rgba(255,255,255,0.35)',margin:0}}>{step.desc}</p>
              </div>
            ))}
          </div>
          <div style={{background:'rgba(255,0,0,0.05)',border:'1px solid rgba(255,0,0,0.15)',borderRadius:12,padding:14,marginBottom:20,fontSize:12,color:'rgba(255,255,255,0.5)',fontFamily:"'Space Grotesk',sans-serif"}}>
            ℹ️ IM Music gestiona tu Content ID a través de nuestros partners certificados. Plan PRO requerido para activación automática.
          </div>
          <Btn3D onClick={()=>window.open('https://studio.youtube.com','_blank')}>SOLICITAR CONTENT ID →</Btn3D>
        </Card>
      )}

      {/* YouTube for Artists tab */}
      {videosTab === 'yt-artists' && (
        <Card>
          <h3 style={{fontFamily:"'Anton',sans-serif",fontSize:18,color:'#F2EDE5',margin:'0 0 8px'}}>YOUTUBE FOR ARTISTS</h3>
          <p style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:13,color:'rgba(255,255,255,0.5)',margin:'0 0 24px',maxWidth:500}}>Accede a analytics avanzados y herramientas exclusivas para artistas en YouTube Music.</p>
          <div style={{display:'flex',flexDirection:'column',gap:12,marginBottom:24}}>
            {[
              {label:'Canal de YouTube verificado',done:false},
              {label:'Mínimo 10 videos subidos',done:videos.length>=10},
              {label:'Música distribuida en YouTube Music',done:false},
            ].map((req,i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 16px',background:'rgba(255,255,255,0.03)',border:`1px solid ${req.done?'rgba(34,197,94,0.2)':'rgba(255,255,255,0.06)'}`,borderRadius:10}}>
                <div style={{width:20,height:20,borderRadius:'50%',background:req.done?'#22c55e':'rgba(255,255,255,0.08)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:11,color:req.done?'#fff':'rgba(255,255,255,0.3)'}}>{req.done?'✓':'✗'}</div>
                <span style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:13,color:req.done?'rgba(255,255,255,0.8)':'rgba(255,255,255,0.4)'}}>{req.label}</span>
              </div>
            ))}
          </div>
          <Btn3D onClick={()=>window.open('https://artists.youtube.com','_blank')}>SOLICITAR VERIFICACIÓN →</Btn3D>
        </Card>
      )}

      {/* Analytics tab */}
      {videosTab === 'analytics' && (
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16}}>
          {[
            {label:'Vistas totales',value:analytics?.views||'—',icon:Play,color:'#FF0000'},
            {label:'Tiempo de visualización',value:analytics?.watchTime||'—',icon:TrendingUp,color:'#f59e0b'},
            {label:'Suscriptores',value:analytics?.subscribers||'—',icon:Users,color:'#22c55e'},
          ].map(s=>(
            <Card key={s.label} style={{textAlign:'center',padding:28}}>
              <s.icon size={28} color={s.color} style={{marginBottom:12}}/>
              <p style={{fontFamily:"'Anton',sans-serif",fontSize:28,color:s.color,margin:'0 0 6px'}}>{s.value}</p>
              <p style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:12,color:'rgba(255,255,255,0.4)',margin:0}}>{s.label}</p>
            </Card>
          ))}
          {!analytics && <Card style={{gridColumn:'1/-1'}}><EmptyState icon={BarChart3} text="Conecta tu canal de YouTube para ver analytics." /></Card>}
        </div>
      )}
    </PageShell>
  );
}

// ─── LYRICS ───────────────────────────────────────────────────────────────────
function LyricsPage() {
  const [tracks, setTracks] = useState<any[]>([]);
  const [selected, setSelected] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [saved, setSaved] = useState(false);
  useEffect(() => { apiFetch('/tracks').then(d => setTracks(Array.isArray(d)?d:[])).catch(()=>{}); }, []);
  useEffect(() => {
    if (!selected) return;
    apiFetch(`/lyrics/${selected}`).then(d => setLyrics(d.lyrics||'')).catch(()=>{});
  }, [selected]);
  const save = async () => {
    if (!selected) return;
    await apiFetch('/lyrics', { method:'POST', body: JSON.stringify({ track_id: selected, lyrics }) }).catch(()=>{});
    setSaved(true); setTimeout(()=>setSaved(false),2000);
  };
  const exportLRC = () => {
    const blob = new Blob([lyrics], { type:'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download=`lyrics_${selected}.lrc`; a.click(); URL.revokeObjectURL(url);
  };
  return (
    <PageShell title="Editor de Letras">
      <div style={{ display:'grid', gridTemplateColumns:'220px 1fr', gap:'20px' }}>
        <Card style={{ height:'fit-content' }}>
          <h3 style={{ fontFamily:"'Anton',sans-serif", fontSize:'13px', color:'#fff', letterSpacing:'0.06em', margin:'0 0 12px' }}>TRACKS</h3>
          {tracks.length===0 && <p style={{ color:'rgba(255,255,255,0.25)', fontSize:'12px', fontFamily:"'Space Grotesk',sans-serif" }}>Sin tracks</p>}
          {tracks.map(t=>(
            <button key={t.id} onClick={() => setSelected(String(t.id))} style={{ width:'100%', textAlign:'left', background: selected===String(t.id)?'rgba(94,23,235,0.18)':'transparent', border:'none', borderRadius:'8px', padding:'8px 10px', color: selected===String(t.id)?PL:'rgba(255,255,255,0.5)', fontSize:'12px', fontFamily:"'Space Grotesk',sans-serif", cursor:'pointer', marginBottom:'2px' }}>
              {t.title}
            </button>
          ))}
        </Card>
        <Card>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'14px' }}>
            <h3 style={{ fontFamily:"'Anton',sans-serif", fontSize:'13px', color:'#fff', letterSpacing:'0.06em', margin:0 }}>EDITOR LRC</h3>
            <div style={{ display:'flex', gap:'8px' }}>
              <Btn3D small variant="ghost" onClick={exportLRC} disabled={!selected}><Download size={13}/> Exportar LRC</Btn3D>
              <Btn3D small onClick={save} disabled={!selected}>{saved?<><Check size={13}/> Guardado</>:<><Send size={13}/> Guardar</>}</Btn3D>
            </div>
          </div>
          <textarea value={lyrics} onChange={e => setLyrics(e.target.value)} placeholder={selected ? "[00:00.00] Escribe las letras en formato LRC...\n[00:05.00] Cada línea con timestamp\n[00:10.00] Segunda estrofa..." : "Selecciona un track para editar sus letras"} style={{ ...IS, resize:'vertical', minHeight:'380px', fontFamily:'monospace', fontSize:'13px', lineHeight:1.7 }} />
        </Card>
      </div>
    </PageShell>
  );
}

// ─── MARKETING IA ─────────────────────────────────────────────────────────────
const ARCHETYPE_Q = [
  { q:'¿Cómo describes tu sonido?', opts:['Oscuro y profundo','Alegre y positivo','Íntimo y vulnerable','Épico y poderoso','Experimental y extraño'] },
  { q:'¿Qué emoción principal transmite tu música?', opts:['Melancolía','Euforia','Amor','Rabia','Introspección'] },
  { q:'¿Cuál es tu referente artístico?', opts:['Bad Bunny','Billie Eilish','Coldplay','Kendrick Lamar','Björk'] },
  { q:'¿Cómo te vistes en escena?', opts:['Streetwear','Minimalista','Elegante','Alternativo','Sin definir'] },
  { q:'¿Qué red social dominas más?', opts:['TikTok','Instagram','YouTube','Twitter/X','Ninguna aún'] },
];
const ARCHETYPES: Record<string, { name:string; colors:string[]; personality:string; tribe:string; plan:string[] }> = {
  '0-0': { name:'El Oscuro', colors:['#1a1a2e','#7B3FFF'], personality:'Misterioso, profundo, artístico', tribe:'Fans del dark-pop y alt-R&B', plan:['Lunes: Reel detrás de cámaras del estudio','Miércoles: Story con fragmento de letra','Viernes: Video lyric nuevo','Domingo: Live Q&A nocturno'] },
  default: { name:'El Independiente', colors:['#5E17EB','#C084FC'], personality:'Auténtico, versátil, directo', tribe:'Fans del indie y artistas emergentes', plan:['Lunes: Contenido del proceso creativo','Martes: Colaboración con otro artista','Jueves: Release de contenido exclusivo','Sábado: Live acústico','Domingo: Recap de la semana'] },
};
function MarketingPage() {
  const [step, setStep] = useState<'quiz'|'results'|'plan'>('quiz');
  const [answers, setAnswers] = useState<number[]>([]);
  const [current, setCurrent] = useState(0);
  const [plan30, setPlan30] = useState<any[]>([]);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [payUrl, setPayUrl] = useState('');
  const archKey = `${answers[0]??'x'}-${answers[1]??'x'}`;
  const arch = ARCHETYPES[archKey] || ARCHETYPES.default;
  const answer = (idx: number) => {
    const next = [...answers]; next[current]=idx; setAnswers(next);
    if (current < ARCHETYPE_Q.length-1) setCurrent(c=>c+1);
    else setStep('results');
  };
  const doGenPlan = async () => {
    setLoadingPlan(true); setStep('plan');
    try { const d = await apiFetch('/ai/chat', { method:'POST', body: JSON.stringify({ message:`Genera un plan de contenido de 30 días para un artista con arquetipo "${arch.name}". Devuelve JSON array con {week,day,type,action}.`, history:[] }) }); const text = d.response||''; const match = text.match(/\[[\s\S]*\]/); if (match) { try { setPlan30(JSON.parse(match[0])); } catch { setPlan30(arch.plan.map((p,i)=>({week:1,day:i+1,type:'Post',action:p}))); } } else { setPlan30(arch.plan.map((p,i)=>({week:1,day:i+1,type:'Post',action:p}))); } } catch { setPlan30(arch.plan.map((p,i)=>({week:1,day:i+1,type:'Post',action:p}))); }
    setLoadingPlan(false);
  };
  const genPlan = async () => {
    try {
      const check = await apiFetch('/marketing/content-plan/purchase', { method: 'POST' });
      if (check.access === 'free') { await doGenPlan(); return; }
      if (check.access === 'paid') { setPayUrl(check.paymentUrl); return; }
    } catch (e: any) {
      if (e.status === 403) { toast('Necesitas el plan Indie o Pro para generar el plan de contenido IA', 'error'); return; }
      await doGenPlan(); // fail-open
    }
  };
  return (
    <PageShell title="Marketing IA">
      {step==='quiz' && <Card style={{ maxWidth:'560px', margin:'0 auto' }}>
        <div style={{ marginBottom:'20px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'8px' }}><span style={{ color:PL, fontSize:'11px', fontFamily:"'Space Grotesk',sans-serif", fontWeight:700 }}>PREGUNTA {current+1} DE {ARCHETYPE_Q.length}</span></div>
          <div style={{ height:'3px', background:'rgba(255,255,255,0.06)', borderRadius:'100px', overflow:'hidden' }}><div style={{ height:'100%', background:`linear-gradient(90deg,${P},${PL})`, width:`${((current+1)/ARCHETYPE_Q.length)*100}%`, transition:'width 0.3s' }}/></div>
        </div>
        <h2 style={{ fontFamily:"'Anton',sans-serif", fontSize:'20px', color:'#fff', margin:'0 0 20px', letterSpacing:'0.02em' }}>{ARCHETYPE_Q[current].q}</h2>
        <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
          {ARCHETYPE_Q[current].opts.map((o,i)=>(
            <button key={i} onClick={()=>answer(i)} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'10px', padding:'12px 16px', color:'rgba(255,255,255,0.7)', fontFamily:"'Space Grotesk',sans-serif", fontSize:'13px', cursor:'pointer', textAlign:'left', transition:'all 0.15s' }}
              onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor='rgba(94,23,235,0.5)';(e.currentTarget as HTMLButtonElement).style.color='#fff';}}
              onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor='rgba(255,255,255,0.08)';(e.currentTarget as HTMLButtonElement).style.color='rgba(255,255,255,0.7)';}}>
              {o}
            </button>
          ))}
        </div>
      </Card>}
      {step==='results' && <div>
        <Card style={{ marginBottom:'20px', background:`linear-gradient(135deg,${arch.colors[0]}33,${arch.colors[1]}22)`, border:`1px solid ${arch.colors[1]}44` }}>
          <div style={{ display:'flex', alignItems:'center', gap:'20px' }}>
            <div style={{ display:'flex', gap:'8px' }}>
              {arch.colors.map((c,i)=><div key={i} style={{ width:'40px', height:'40px', background:c, borderRadius:'50%', boxShadow:`0 0 20px ${c}88` }}/>)}
            </div>
            <div>
              <p style={{ color:'rgba(255,255,255,0.4)', fontSize:'11px', fontFamily:"'Space Grotesk',sans-serif", textTransform:'uppercase', letterSpacing:'0.15em', margin:'0 0 4px' }}>TU ARQUETIPO</p>
              <h2 style={{ fontFamily:"'Anton',sans-serif", fontSize:'28px', color:'#fff', margin:0, letterSpacing:'0.02em' }}>{arch.name}</h2>
            </div>
          </div>
        </Card>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'16px', marginBottom:'20px' }}>
          <Card><p style={{ color:'rgba(255,255,255,0.35)', fontSize:'10px', fontFamily:"'Space Grotesk',sans-serif", textTransform:'uppercase', letterSpacing:'0.15em', margin:'0 0 8px' }}>PERSONALIDAD</p><p style={{ color:'#fff', fontSize:'13px', fontFamily:"'Space Grotesk',sans-serif", margin:0 }}>{arch.personality}</p></Card>
          <Card><p style={{ color:'rgba(255,255,255,0.35)', fontSize:'10px', fontFamily:"'Space Grotesk',sans-serif", textTransform:'uppercase', letterSpacing:'0.15em', margin:'0 0 8px' }}>TU TRIBU</p><p style={{ color:'#fff', fontSize:'13px', fontFamily:"'Space Grotesk',sans-serif", margin:0 }}>{arch.tribe}</p></Card>
          <Card><p style={{ color:'rgba(255,255,255,0.35)', fontSize:'10px', fontFamily:"'Space Grotesk',sans-serif", textTransform:'uppercase', letterSpacing:'0.15em', margin:'0 0 8px' }}>COLORES MARCA</p><div style={{ display:'flex', gap:'6px', marginTop:'4px' }}>{arch.colors.map((c,i)=><div key={i} style={{ width:'24px', height:'24px', background:c, borderRadius:'6px' }}/>)}</div></Card>
        </div>
        <div style={{ display:'flex', gap:'12px' }}>
          <Btn3D onClick={genPlan}><Sparkles size={14}/> Generar plan 30 días</Btn3D>
          <Btn3D variant="ghost" onClick={()=>{setStep('quiz');setAnswers([]);setCurrent(0);}}>Repetir test</Btn3D>
        </div>
        {payUrl && (
          <div style={{ marginTop:'20px', padding:'20px', background:'rgba(94,23,235,0.08)', border:'1px solid rgba(94,23,235,0.3)', borderRadius:'16px' }}>
            <p style={{ color:'#fff', fontSize:'14px', fontFamily:"'Space Grotesk',sans-serif", margin:'0 0 12px', fontWeight:600 }}>Plan de Contenido IA — $15.000 COP</p>
            <p style={{ color:'rgba(255,255,255,0.45)', fontSize:'12px', fontFamily:"'Space Grotesk',sans-serif", margin:'0 0 16px' }}>Acceso único al Plan de 30 días generado por IA para tu arquetipo {arch.name}.</p>
            <div style={{ display:'flex', gap:'10px' }}>
              <a href={payUrl} target="_blank" rel="noopener noreferrer" style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:`linear-gradient(135deg,${P},${PL})`, color:'#fff', borderRadius:'12px', padding:'10px 20px', fontFamily:"'Anton',sans-serif", fontSize:'12px', letterSpacing:'0.1em', textDecoration:'none', boxShadow:`0 4px 16px rgba(94,23,235,0.4)` }}>
                <CreditCard size={14}/> PAGAR CON WOMPI
              </a>
              <Btn3D small variant="ghost" onClick={()=>setPayUrl('')}>Cancelar</Btn3D>
            </div>
          </div>
        )}
      </div>}
      {step==='plan' && <div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
          <h2 style={{ fontFamily:"'Anton',sans-serif", fontSize:'18px', color:'#fff', margin:0 }}>PLAN 30 DÍAS — {arch.name.toUpperCase()}</h2>
          <Btn3D small variant="ghost" onClick={()=>setStep('results')}>← Atrás</Btn3D>
        </div>
        {loadingPlan && <Card><div style={{ textAlign:'center', padding:'40px' }}><div style={{ width:'32px', height:'32px', border:`3px solid ${P}`, borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 12px' }}/><p style={{ color:'rgba(255,255,255,0.4)', fontFamily:"'Space Grotesk',sans-serif" }}>Generando plan con IA...</p></div></Card>}
        {!loadingPlan && <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:'14px' }}>
          {plan30.map((item,i)=>(
            <Card key={i} style={{ padding:'16px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'8px' }}><Badge color={PL} label={`Semana ${item.week||Math.floor(i/7)+1}`}/><Badge color="#22c55e" label={item.type||'Post'}/></div>
              <p style={{ color:'rgba(255,255,255,0.4)', fontSize:'10px', fontFamily:"'Space Grotesk',sans-serif", margin:'0 0 4px' }}>DÍA {item.day||i+1}</p>
              <p style={{ color:'#fff', fontSize:'13px', fontFamily:"'Space Grotesk',sans-serif", margin:0, lineHeight:1.5 }}>{item.action}</p>
            </Card>
          ))}
        </div>}
      </div>}
    </PageShell>
  );
}

// ─── META ADS ─────────────────────────────────────────────────────────────────
function MetaAdsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', objective: 'reach', budget: '', audience: '', copy: '' });
  const [aiLoading, setAiLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const objectives = ['reach', 'traffic', 'engagement', 'leads', 'conversions', 'video_views'];

  const generateCopy = async () => {
    if (!form.name) return toast('Ingresa el nombre de la campaña primero', 'error');
    setAiLoading(true);
    try {
      const d = await apiFetch('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: `Genera un copy publicitario de Facebook/Instagram para una campaña musical. Campaña: "${form.name}", Objetivo: ${form.objective}, Audiencia: ${form.audience || 'fans de música'}. El copy debe ser atractivo, incluir emojis y un CTA claro. Máximo 150 palabras.`,
          history: []
        })
      });
      setForm(f => ({ ...f, copy: d.response || '' }));
    } catch { toast('Error generando copy con IA', 'error'); }
    setAiLoading(false);
  };

  const createCampaign = () => {
    if (!form.name || !form.budget) return toast('Nombre y presupuesto son requeridos', 'error');
    setCampaigns(c => [{ id: Date.now(), ...form, status: 'draft', reach: 0, impressions: 0, clicks: 0, created_at: new Date().toISOString() }, ...c]);
    setForm({ name: '', objective: 'reach', budget: '', audience: '', copy: '' });
    toast('Campaña creada', 'success');
  };

  return (
    <PageShell title="Meta Ads">
      {/* Connection card */}
      <Card style={{ marginBottom: '20px', background: connected ? 'rgba(24,119,242,0.08)' : 'rgba(255,255,255,0.02)', border: `1px solid ${connected ? 'rgba(24,119,242,0.3)' : 'rgba(255,255,255,0.06)'}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(135deg, #1877F2, #00B2FF)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Globe size={20} color="#fff" />
            </div>
            <div>
              <p style={{ color: '#fff', fontSize: '14px', fontWeight: 600, margin: '0 0 2px', fontFamily: "'Space Grotesk',sans-serif" }}>Meta Business Suite</p>
              <p style={{ color: connected ? '#22c55e' : 'rgba(255,255,255,0.35)', fontSize: '11px', margin: 0, fontFamily: "'Space Grotesk',sans-serif" }}>{connected ? '● Conectado' : '○ No conectado'}</p>
            </div>
          </div>
          <Btn3D small onClick={() => { setConnected(c => !c); toast(connected ? 'Cuenta desconectada' : '¡Cuenta Meta conectada!', connected ? 'error' : 'success'); }}>
            {connected ? 'Desconectar' : 'Conectar cuenta Meta'}
          </Btn3D>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        {/* Campaign creator */}
        <Card>
          <h3 style={{ fontFamily: "'Anton',sans-serif", fontSize: '14px', color: '#fff', letterSpacing: '0.06em', margin: '0 0 16px' }}>CREAR CAMPAÑA</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input style={IS} placeholder="Nombre de la campaña" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <select style={{ ...IS, appearance: 'none' as any }} value={form.objective} onChange={e => setForm(f => ({ ...f, objective: e.target.value }))}>
              {objectives.map(o => <option key={o} value={o} style={{ background: '#1a0a2e' }}>{o.replace('_', ' ').toUpperCase()}</option>)}
            </select>
            <input style={IS} placeholder="Presupuesto diario (COP)" type="number" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} />
            <input style={IS} placeholder="Audiencia objetivo (ej: fans trap Colombia)" value={form.audience} onChange={e => setForm(f => ({ ...f, audience: e.target.value }))} />
            <Btn3D small onClick={createCampaign}><Plus size={14} /> Crear campaña</Btn3D>
          </div>
        </Card>

        {/* AI Copy generator */}
        <Card>
          <h3 style={{ fontFamily: "'Anton',sans-serif", fontSize: '14px', color: '#fff', letterSpacing: '0.06em', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>COPY CON IA <Sparkles size={13} color={PL} /></h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Btn3D small variant="ghost" onClick={generateCopy} disabled={aiLoading}>
              {aiLoading ? 'Generando...' : <><Sparkles size={13} /> Generar copy con IA</>}
            </Btn3D>
            <textarea
              style={{ ...IS, height: '150px', resize: 'none' as any, lineHeight: '1.5' }}
              placeholder="El copy aparecerá aquí. Puedes editarlo antes de usar."
              value={form.copy}
              onChange={e => setForm(f => ({ ...f, copy: e.target.value }))}
            />
            {form.copy && (
              <Btn3D small variant="ghost" onClick={() => { navigator.clipboard.writeText(form.copy); toast('Copy copiado al portapapeles', 'success'); }}>
                <Copy size={13} /> Copiar
              </Btn3D>
            )}
          </div>
        </Card>
      </div>

      {/* Campaigns list */}
      <h3 style={{ fontFamily: "'Anton',sans-serif", fontSize: '14px', color: '#fff', letterSpacing: '0.06em', margin: '0 0 14px' }}>MIS CAMPAÑAS</h3>
      {campaigns.length === 0 ? (
        <Card><EmptyState icon={Globe} text="Sin campañas todavía. Crea tu primera campaña arriba." /></Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '14px' }}>
          {campaigns.map(c => (
            <Card key={c.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <p style={{ color: '#fff', fontSize: '14px', fontWeight: 600, margin: 0, fontFamily: "'Space Grotesk',sans-serif" }}>{c.name}</p>
                <Badge color={c.status === 'active' ? '#22c55e' : '#f59e0b'} label={c.status === 'active' ? 'Activa' : 'Borrador'} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                {(['Alcance', 'Impresiones', 'Clics'] as const).map((label, idx) => (
                  <div key={label} style={{ textAlign: 'center', padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                    <p style={{ color: '#fff', fontSize: '16px', fontWeight: 700, margin: '0 0 2px', fontFamily: "'Anton',sans-serif" }}>{idx === 0 ? c.reach : idx === 1 ? c.impressions : c.clicks}</p>
                    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px', margin: 0, fontFamily: "'Space Grotesk',sans-serif", textTransform: 'uppercase' as any }}>{label}</p>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', fontFamily: "'Space Grotesk',sans-serif" }}>
                  ${parseInt(c.budget || '0').toLocaleString()} COP/día
                </span>
                <Btn3D small variant="ghost" onClick={() => { setCampaigns(cs => cs.filter(x => x.id !== c.id)); toast('Campaña eliminada', 'error'); }}>
                  <Trash2 size={12} />
                </Btn3D>
              </div>
            </Card>
          ))}
        </div>
      )}
    </PageShell>
  );
}

// ─── MARKET INTEL ─────────────────────────────────────────────────────────────
function MarketIntelPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [genre, setGenre] = useState('');
  const [artistType, setArtistType] = useState('');
  const GENRES = ['Reggaeton','Trap','Salsa','Vallenato','Pop Latino','R&B','Hip-Hop','Electrónica','Rock Latino','Afrobeats','Cumbia','Champeta','Mambo Urbano','Drill'];
  const ARTIST_TYPES = ['Solista masculino','Solista femenina','Dúo','Banda/Grupo','DJ/Productor','Colectivo'];

  const analyze = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/ai/market-intel', { method: 'POST', body: JSON.stringify({ genre, artistType }) });
      setResult(data);
    } catch (e: any) { toast(e.message || 'Error analizando mercado', 'error'); }
    setLoading(false);
  };

  return (
    <PageShell title="Mercado Musical">
      <HoloCard color="#3b82f6" style={{ padding: 28, marginBottom: 20 }}>
        <h3 style={{ fontFamily: "'Anton',sans-serif", fontSize: 20, color: '#F2EDE5', margin: '0 0 8px' }}>ANALIZA TU MERCADO OBJETIVO</h3>
        <p style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 14, color: 'rgba(255,255,255,0.4)', margin: '0 0 24px' }}>Descubre en qué países escuchan tu género, el perfil de tu audiencia ideal y cómo lanzar tu música.</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          <div>
            <label style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.15em', textTransform: 'uppercase' as any, display: 'block', marginBottom: 8 }}>Género musical</label>
            <select value={genre} onChange={e => setGenre(e.target.value)} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 16px', color: '#fff', fontFamily: "'Space Grotesk',sans-serif", fontSize: 14, outline: 'none', appearance: 'none' as any }}>
              <option value="" style={{ background: '#1a0a2e' }}>Selecciona tu género</option>
              {GENRES.map(g => <option key={g} value={g} style={{ background: '#1a0a2e' }}>{g}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.15em', textTransform: 'uppercase' as any, display: 'block', marginBottom: 8 }}>Tipo de artista</label>
            <select value={artistType} onChange={e => setArtistType(e.target.value)} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 16px', color: '#fff', fontFamily: "'Space Grotesk',sans-serif", fontSize: 14, outline: 'none', appearance: 'none' as any }}>
              <option value="" style={{ background: '#1a0a2e' }}>Selecciona</option>
              {ARTIST_TYPES.map(t => <option key={t} value={t} style={{ background: '#1a0a2e' }}>{t}</option>)}
            </select>
          </div>
        </div>
        <Btn3D onClick={analyze} disabled={!genre || !artistType || loading}>
          {loading ? 'ANALIZANDO...' : 'ANALIZAR MERCADO →'}
        </Btn3D>
      </HoloCard>

      {result && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            <HoloCard color="#22c55e" style={{ padding: 28 }}>
              <h3 style={{ fontFamily: "'Anton',sans-serif", fontSize: 16, color: '#F2EDE5', margin: '0 0 20px', letterSpacing: '0.05em' }}>🌍 TOP PAÍSES</h3>
              {(result.topCountries || []).map((c: any, i: number) => (
                <div key={i} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 13, fontWeight: 600, color: '#F2EDE5' }}>{c.flag} {c.country}</span>
                    <span style={{ fontFamily: "'Anton',sans-serif", fontSize: 13, color: '#22c55e' }}>{c.percentage}%</span>
                  </div>
                  <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 100, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${c.percentage}%`, background: 'linear-gradient(90deg, #22c55e, #16a34a)', borderRadius: 100, boxShadow: '0 0 8px rgba(34,197,94,0.5)' }} />
                  </div>
                </div>
              ))}
            </HoloCard>

            <HoloCard color="#3b82f6" style={{ padding: 28 }}>
              <h3 style={{ fontFamily: "'Anton',sans-serif", fontSize: 16, color: '#F2EDE5', margin: '0 0 20px', letterSpacing: '0.05em' }}>🏙️ TOP CIUDADES</h3>
              {(result.topCities || []).map((c: any, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontFamily: "'Anton',sans-serif", fontSize: 12, color: '#3b82f6' }}>#{i+1}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 13, fontWeight: 600, color: '#F2EDE5', margin: 0 }}>{c.city}</p>
                    <p style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: 0 }}>{c.country}</p>
                  </div>
                  <span style={{ fontFamily: "'Anton',sans-serif", fontSize: 13, color: '#3b82f6' }}>{c.streams}</span>
                </div>
              ))}
            </HoloCard>
          </div>

          <HoloCard color="#C084FC" style={{ padding: 28, marginBottom: 20 }}>
            <h3 style={{ fontFamily: "'Anton',sans-serif", fontSize: 16, color: '#F2EDE5', margin: '0 0 20px' }}>👥 PERFIL DE AUDIENCIA IDEAL</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
              {[
                { label: 'Edad principal', value: result.audience?.ageRange || '18-28', icon: '🎯' },
                { label: 'Género dominante', value: result.audience?.gender || '60% M', icon: '👤' },
                { label: 'Plataforma #1', value: result.audience?.platform || 'Spotify', icon: '🎵' },
                { label: 'Horario pico', value: result.audience?.peakTime || '8pm-11pm', icon: '⏰' },
              ].map((s, i) => (
                <div key={i} style={{ background: 'rgba(192,132,252,0.08)', border: '1px solid rgba(192,132,252,0.2)', borderRadius: 16, padding: '20px 16px', textAlign: 'center' as any }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
                  <div style={{ fontFamily: "'Anton',sans-serif", fontSize: 18, color: '#F2EDE5', marginBottom: 4 }}>{s.value}</div>
                  <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 11, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' as any, letterSpacing: '0.1em' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </HoloCard>

          <HoloCard color="#f59e0b" style={{ padding: 28 }}>
            <h3 style={{ fontFamily: "'Anton',sans-serif", fontSize: 16, color: '#F2EDE5', margin: '0 0 12px' }}>🚀 ESTRATEGIA DE LANZAMIENTO RECOMENDADA</h3>
            <p style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.8, margin: 0 }}>{result.strategy || '...'}</p>
          </HoloCard>
        </>
      )}
    </PageShell>
  );
}

// ─── SPOTLIGHT ────────────────────────────────────────────────────────────────
function SpotlightPage() {
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [subs, setSubs] = useState<any[]>([]);
  const [genre, setGenre] = useState('');
  const [tracks, setTracks] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState<number|null>(null);
  useEffect(() => {
    apiFetch('/playlists').then(d=>setPlaylists(Array.isArray(d)?d:[])).catch(()=>{});
    apiFetch('/tracks').then(d=>setTracks(Array.isArray(d)?d:[])).catch(()=>{});
  }, []);
  const submit = async (playlistId: number) => {
    if (!tracks[0]) return; setSubmitting(playlistId);
    try { const d = await apiFetch('/playlists', { method:'POST', body: JSON.stringify({ playlist_id: playlistId, track_id: tracks[0].id }) }); setSubs(s=>[...s,d]); } catch {}
    setSubmitting(null);
  };
  const filtered = genre ? playlists.filter(p=>(p.genre||'').toLowerCase().includes(genre.toLowerCase())) : playlists;
  return (
    <PageShell title="Spotlight Playlists">
      <div style={{ display:'flex', gap:'12px', marginBottom:'20px', alignItems:'center' }}>
        <input style={{...IS, maxWidth:'220px'}} placeholder="Filtrar por género..." value={genre} onChange={e=>setGenre(e.target.value)}/>
        <span style={{ color:'rgba(255,255,255,0.3)', fontSize:'12px', fontFamily:"'Space Grotesk',sans-serif" }}>{filtered.length} playlists</span>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:'16px', marginBottom:'24px' }}>
        {filtered.length===0 && <Card style={{ gridColumn:'1/-1' }}><EmptyState icon={Radio} text="Sin playlists disponibles." /></Card>}
        {filtered.map(pl=>(
          <Card key={pl.id}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'10px' }}>
              <div>
                <p style={{ color:'#fff', fontSize:'14px', fontWeight:600, margin:'0 0 3px', fontFamily:"'Space Grotesk',sans-serif" }}>{pl.name||pl.title||'Playlist'}</p>
                <p style={{ color:'rgba(255,255,255,0.3)', fontSize:'11px', margin:0, fontFamily:"'Space Grotesk',sans-serif" }}>{pl.genre||'Varios géneros'} · {pl.followers||0} seguidores</p>
              </div>
              {pl.genre && <Badge color={PL} label={pl.genre}/>}
            </div>
            <Btn3D small onClick={()=>submit(pl.id)} disabled={submitting===pl.id}>{submitting===pl.id?'Enviando...':'Enviar track'}</Btn3D>
          </Card>
        ))}
      </div>
      {subs.length>0 && <Card>
        <h3 style={{ fontFamily:"'Anton',sans-serif", fontSize:'13px', color:'#fff', letterSpacing:'0.06em', margin:'0 0 12px' }}>HISTORIAL DE ENVÍOS</h3>
        {subs.map((s,i)=><div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}><span style={{ color:'rgba(255,255,255,0.5)', fontSize:'12px', fontFamily:"'Space Grotesk',sans-serif" }}>Playlist #{s.playlist_id||i+1}</span><Badge color="#3b82f6" label="Enviado"/></div>)}
      </Card>}
    </PageShell>
  );
}

// ─── HYPERFOLLOW ──────────────────────────────────────────────────────────────
function HyperfollowPage() {
  const [releases, setReleases] = useState<any[]>([]);
  const [selected, setSelected] = useState('');
  const [copied, setCopied] = useState(false);
  const [pages, setPages] = useState<any[]>([]);
  const [creating, setCreating] = useState(false);
  useEffect(() => { apiFetch('/releases').then(d=>setReleases(Array.isArray(d)?d:[])).catch(()=>{}); }, []);
  const create = async () => {
    if (!selected) return; setCreating(true);
    try { const d = await apiFetch('/releases', { method:'POST', body: JSON.stringify({ type:'hyperfollow', release_id: selected }) }); setPages(p=>[...p, { ...d, slug: `immusic.com/pre/${selected}`, leads: 0 }]); } catch { setPages(p=>[...p,{ slug:`immusic.com/pre/${selected}`, leads:0, release_id:selected }]); }
    setCreating(false);
  };
  const copy = (slug: string) => { navigator.clipboard.writeText(`https://${slug}`); setCopied(true); setTimeout(()=>setCopied(false),2000); };
  return (
    <PageShell title="HyperFollow">
      <Card style={{ marginBottom:'20px' }}>
        <h3 style={{ fontFamily:"'Anton',sans-serif", fontSize:'14px', color:'#fff', letterSpacing:'0.06em', margin:'0 0 14px' }}>CREAR LANDING PAGE DE PRE-SAVE</h3>
        <div style={{ display:'flex', gap:'10px', alignItems:'flex-end' }}>
          <div style={{ flex:1 }}>
            <p style={{ color:'rgba(255,255,255,0.4)', fontSize:'11px', fontFamily:"'Space Grotesk',sans-serif", margin:'0 0 6px' }}>Release</p>
            <select style={{...IS}} value={selected} onChange={e=>setSelected(e.target.value)}>
              <option value="">Seleccionar release...</option>
              {releases.map(r=><option key={r.id} value={r.id}>{r.title}</option>)}
            </select>
          </div>
          <Btn3D small onClick={create} disabled={!selected||creating}>{creating?'Creando...':'Crear landing'}</Btn3D>
        </div>
      </Card>
      <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
        {pages.length===0 && <Card><EmptyState icon={Link2} text="Sin landing pages. Crea la primera para tu próximo lanzamiento." /></Card>}
        {pages.map((pg,i)=>(
          <Card key={i}>
            <div style={{ display:'flex', alignItems:'center', gap:'16px' }}>
              <div style={{ flex:1 }}>
                <p style={{ color:'rgba(255,255,255,0.4)', fontSize:'10px', fontFamily:"'Space Grotesk',sans-serif", textTransform:'uppercase', letterSpacing:'0.1em', margin:'0 0 4px' }}>URL DE PRE-SAVE</p>
                <p style={{ color:PL, fontSize:'13px', fontFamily:'monospace', margin:0 }}>https://{pg.slug}</p>
              </div>
              <div style={{ textAlign:'center' }}>
                <p style={{ fontFamily:"'Anton',sans-serif", fontSize:'24px', color:'#fff', margin:0 }}>{pg.leads||0}</p>
                <p style={{ color:'rgba(255,255,255,0.3)', fontSize:'10px', fontFamily:"'Space Grotesk',sans-serif", margin:0 }}>Leads</p>
              </div>
              <Btn3D small variant="ghost" onClick={()=>copy(pg.slug)}><Copy size={13}/> {copied?'¡Copiado!':'Copiar link'}</Btn3D>
            </div>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}

// ─── COMMUNITY ────────────────────────────────────────────────────────────────
function CommunityPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const load = () => apiFetch('/chat/recent').then(d=>setMessages(Array.isArray(d)?d:[])).catch(()=>{});
  useEffect(() => { load(); const t = setInterval(load, 5000); return ()=>clearInterval(t); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages]);
  const send = async () => {
    if (!input.trim()||sending) return; const msg=input.trim(); setInput(''); setSending(true);
    try { await apiFetch('/chat', { method:'POST', body: JSON.stringify({ message: msg }) }); load(); } catch {}
    setSending(false);
  };
  return (
    <PageShell title="Comunidad">
      <div style={{ display:'grid', gridTemplateColumns:'1fr 260px', gap:'20px' }}>
        <Card style={{ display:'flex', flexDirection:'column', height:'540px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'14px' }}>
            <h3 style={{ fontFamily:"'Anton',sans-serif", fontSize:'14px', color:'#fff', letterSpacing:'0.06em', margin:0 }}>CHAT EN VIVO</h3>
            <div style={{ display:'flex', alignItems:'center', gap:'6px' }}><div style={{ width:'6px', height:'6px', background:'#22c55e', borderRadius:'50%', animation:'pulse 2s ease-in-out infinite' }}/><span style={{ color:'rgba(255,255,255,0.3)', fontSize:'11px', fontFamily:"'Space Grotesk',sans-serif" }}>En vivo · auto-actualiza</span></div>
          </div>
          <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:'10px', paddingRight:'4px' }}>
            {messages.length===0 && <EmptyState icon={MessageCircle} text="Sin mensajes aún. ¡Sé el primero!" />}
            {messages.map((m,i)=>(
              <div key={i} style={{ display:'flex', gap:'10px', alignItems:'flex-start' }}>
                <div style={{ width:'28px', height:'28px', background:`rgba(94,23,235,0.2)`, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><User size={12} color={PL}/></div>
                <div>
                  <span style={{ color:PL, fontSize:'11px', fontWeight:700, fontFamily:"'Space Grotesk',sans-serif" }}>{m.user_name||m.author||'Artista'} </span>
                  <span style={{ color:'rgba(255,255,255,0.2)', fontSize:'10px', fontFamily:"'Space Grotesk',sans-serif" }}>{m.created_at ? new Date(m.created_at).toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit'}) : ''}</span>
                  <p style={{ color:'rgba(255,255,255,0.7)', fontSize:'13px', margin:'3px 0 0', fontFamily:"'Space Grotesk',sans-serif", lineHeight:1.5 }}>{m.message||m.content}</p>
                </div>
              </div>
            ))}
            <div ref={bottomRef}/>
          </div>
          <div style={{ display:'flex', gap:'10px', marginTop:'14px', paddingTop:'14px', borderTop:'1px solid rgba(255,255,255,0.06)' }}>
            <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder="Escribe un mensaje..." style={{...IS,flex:1}}/>
            <Btn3D small onClick={send} disabled={sending||!input.trim()}><Send size={13}/></Btn3D>
          </div>
        </Card>
        <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
          <Card><h3 style={{ fontFamily:"'Anton',sans-serif", fontSize:'13px', color:'#fff', letterSpacing:'0.06em', margin:'0 0 10px' }}>ACTIVOS AHORA</h3><p style={{ fontFamily:"'Anton',sans-serif", fontSize:'36px', color:PL, margin:'0 0 4px' }}>—</p><p style={{ color:'rgba(255,255,255,0.3)', fontSize:'11px', fontFamily:"'Space Grotesk',sans-serif", margin:0 }}>artistas online</p></Card>
          <Card><h3 style={{ fontFamily:"'Anton',sans-serif", fontSize:'13px', color:'#fff', letterSpacing:'0.06em', margin:'0 0 10px' }}>MENSAJES HOY</h3><p style={{ fontFamily:"'Anton',sans-serif", fontSize:'36px', color:'#fff', margin:'0 0 4px' }}>{messages.length}</p><p style={{ color:'rgba(255,255,255,0.3)', fontSize:'11px', fontFamily:"'Space Grotesk',sans-serif", margin:0 }}>en el feed</p></Card>
        </div>
      </div>
    </PageShell>
  );
}

// ─── MARKETPLACE ──────────────────────────────────────────────────────────────
// ─── BEAT CARD ───────────────────────────────────────────────────────────────
function BeatCard({ beat, showBuy, showEdit, showRating }: { beat: any; showBuy?: boolean; showEdit?: boolean; showRating?: boolean }) {
  const GRADIENTS = [
    'linear-gradient(135deg,#5E17EB,#C084FC)',
    'linear-gradient(135deg,#7B3FFF,#2D0B6B)',
    'linear-gradient(135deg,#1a0533,#5E17EB)',
    'linear-gradient(135deg,#C084FC,#7B3FFF)',
  ];
  const gIdx = Math.abs(((beat.title || beat.titulo || '').charCodeAt(0) || 0)) % 4;
  const title = beat.title || beat.titulo || 'Sin título';
  const genre = beat.genre || beat.genero || '--';
  const bpm = beat.bpm || '--';
  const key = beat.key || beat.tonalidad || '--';
  const price = beat.price ?? beat.precio ?? 0;
  const rating = beat.rating || beat.rating_promedio;
  return (
    <HoloCard color="#5E17EB" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ height: 120, background: GRADIENTS[gIdx], display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <Music size={36} color="rgba(255,255,255,0.3)" />
        <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.5)', borderRadius: 100, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 10, fontWeight: 700, color: '#F2EDE5' }}>{bpm} BPM</span>
        </div>
        {showRating && rating && (
          <div style={{ position: 'absolute', bottom: 10, right: 10, background: 'rgba(0,0,0,0.5)', borderRadius: 100, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Star size={10} color="#fbbf24" fill="#fbbf24" />
            <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 10, fontWeight: 700, color: '#F2EDE5' }}>{Number(rating).toFixed(1)}</span>
          </div>
        )}
      </div>
      <div style={{ padding: '16px 20px' }}>
        <p style={{ fontFamily: "'Anton',sans-serif", fontSize: 15, color: '#F2EDE5', margin: '0 0 4px' }}>{title}</p>
        <p style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{genre} · {key}</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: "'Anton',sans-serif", fontSize: 18, color: '#22c55e' }}>${Number(price).toLocaleString()} COP</span>
          {showBuy && <Btn3D small onClick={() => toast('Procesando compra...', 'info')}><ShoppingBag size={12} /> Comprar</Btn3D>}
          {showEdit && <Btn3D small variant="ghost" onClick={() => toast('Editar beat', 'info')}>EDITAR</Btn3D>}
        </div>
      </div>
    </HoloCard>
  );
}

function MarketplaceStore() {
  const [beats, setBeats] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const GENRES = ['Todos','Trap','Reggaeton','R&B','Hip-Hop','Afrobeats','Drill','Pop','Electrónica'];
  const DEMO_BEATS = [
    { id:1, titulo:'Dark Trap 140', genero:'Trap', precio:49900, bpm:140, tonalidad:'Am' },
    { id:2, titulo:'Reggaeton Loop Vol.3', genero:'Reggaeton', precio:39900, bpm:95, tonalidad:'Dm' },
    { id:3, titulo:'Afrobeats Groove', genero:'Afrobeats', precio:59900, bpm:108, tonalidad:'Cm' },
    { id:4, titulo:'Sad Piano RnB', genero:'R&B', precio:44900, bpm:75, tonalidad:'Fm' },
    { id:5, titulo:'Hip-Hop Classic', genero:'Hip-Hop', precio:34900, bpm:90, tonalidad:'Gm' },
    { id:6, titulo:'Perreo Intenso', genero:'Reggaeton', precio:54900, bpm:100, tonalidad:'Cm' },
  ];
  useEffect(() => { apiFetch('/marketplace/beats').then(d => setBeats(Array.isArray(d) ? d : [])).catch(() => {}); }, []);
  const list = beats.length > 0 ? beats : DEMO_BEATS;
  const filtered = list.filter(b =>
    (filter === 'all' || (b.genre || b.genero) === filter) &&
    (search === '' || (b.title || b.titulo || '').toLowerCase().includes(search.toLowerCase()))
  );
  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar beats..."
          style={{ flex: 1, minWidth: 200, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '10px 16px', color: '#fff', fontFamily: "'Space Grotesk',sans-serif", fontSize: 13, outline: 'none' }} />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {GENRES.map(g => (
            <button key={g} onClick={() => setFilter(g === 'Todos' ? 'all' : g)}
              style={{ background: filter === (g === 'Todos' ? 'all' : g) ? 'rgba(94,23,235,0.3)' : 'rgba(255,255,255,0.04)', border: `1px solid ${filter === (g === 'Todos' ? 'all' : g) ? 'rgba(94,23,235,0.6)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 100, padding: '6px 14px', color: filter === (g === 'Todos' ? 'all' : g) ? '#C084FC' : 'rgba(255,255,255,0.45)', fontFamily: "'Space Grotesk',sans-serif", fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
              {g}
            </button>
          ))}
        </div>
      </div>
      {filtered.length === 0 ? (
        <HoloCard color="#5E17EB" style={{ padding: 40, textAlign: 'center' }}>
          <ShoppingBag size={48} color="rgba(255,255,255,0.1)" style={{ marginBottom: 16 }} />
          <h3 style={{ fontFamily: "'Anton',sans-serif", fontSize: 20, color: 'rgba(255,255,255,0.2)', margin: '0 0 8px' }}>SIN BEATS AÚN</h3>
          <p style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 14, color: 'rgba(255,255,255,0.15)' }}>Sé el primero en subir un beat al marketplace.</p>
        </HoloCard>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 20 }}>
          {filtered.map((beat: any, i: number) => <BeatCard key={beat.id || i} beat={beat} showBuy />)}
        </div>
      )}
    </div>
  );
}

function MyBeatsStore() {
  const [beats, setBeats] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', genre: '', price: '', bpm: '', key: '', description: '' });
  const [loading, setLoading] = useState(false);
  useEffect(() => { apiFetch('/marketplace/my-beats').then(d => setBeats(Array.isArray(d) ? d : [])).catch(() => {}); }, []);
  const submit = async () => {
    setLoading(true);
    try {
      await apiFetch('/marketplace/beats', { method: 'POST', body: JSON.stringify(form) });
      toast('Beat publicado exitosamente', 'success');
      setShowForm(false);
      setForm({ title: '', genre: '', price: '', bpm: '', key: '', description: '' });
      apiFetch('/marketplace/my-beats').then(d => setBeats(Array.isArray(d) ? d : [])).catch(() => {});
    } catch (e: any) { toast(e.message, 'error'); }
    setLoading(false);
  };
  const FORM_FIELDS = [
    { key: 'title', label: 'Nombre del beat', placeholder: 'Título del beat, ej: Dark Trap 140' },
    { key: 'price', label: 'Precio (COP)', placeholder: 'Precio en COP, ej: 50000' },
    { key: 'bpm', label: 'BPM', placeholder: 'BPM, ej: 140' },
    { key: 'key', label: 'Tonalidad', placeholder: 'Tonalidad, ej: Am' },
  ];
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h3 style={{ fontFamily: "'Anton',sans-serif", fontSize: 20, color: '#F2EDE5', margin: '0 0 4px' }}>MI TIENDA</h3>
          <p style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: 0 }}>{beats.length} beats publicados · Comisión plataforma: 5%</p>
        </div>
        <Btn3D small onClick={() => setShowForm(!showForm)}>+ SUBIR BEAT</Btn3D>
      </div>
      {showForm && (
        <HoloCard color="#5E17EB" style={{ padding: 28, marginBottom: 24 }}>
          <h4 style={{ fontFamily: "'Anton',sans-serif", fontSize: 16, color: '#F2EDE5', margin: '0 0 20px' }}>PUBLICAR NUEVO BEAT</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            {FORM_FIELDS.map(f => (
              <div key={f.key}>
                <label style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 11, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.15em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>{f.label}</label>
                <input value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px', color: '#fff', fontFamily: "'Space Grotesk',sans-serif", fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
              </div>
            ))}
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 11, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.15em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Género</label>
            <select value={form.genre} onChange={e => setForm(p => ({ ...p, genre: e.target.value }))}
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px', color: '#fff', fontFamily: "'Space Grotesk',sans-serif", fontSize: 13, outline: 'none' }}>
              <option value="">Selecciona género</option>
              {['Trap','Reggaeton','R&B','Hip-Hop','Afrobeats','Drill','Pop','Electrónica'].map(g => <option key={g}>{g}</option>)}
            </select>
          </div>
          <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Descripción del beat..."
            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px', color: '#fff', fontFamily: "'Space Grotesk',sans-serif", fontSize: 13, outline: 'none', resize: 'vertical', minHeight: 80, boxSizing: 'border-box', marginBottom: 16 }} />
          <div style={{ display: 'flex', gap: 12 }}>
            <Btn3D onClick={submit} disabled={loading || !form.title || !form.price}>{loading ? 'PUBLICANDO...' : 'PUBLICAR BEAT'}</Btn3D>
            <Btn3D variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Btn3D>
          </div>
        </HoloCard>
      )}
      {beats.length === 0 ? (
        <HoloCard color="#5E17EB" style={{ padding: 40, textAlign: 'center' }}>
          <Music size={48} color="rgba(255,255,255,0.1)" style={{ marginBottom: 16 }} />
          <h3 style={{ fontFamily: "'Anton',sans-serif", fontSize: 18, color: 'rgba(255,255,255,0.2)', margin: '0 0 8px' }}>SIN BEATS PUBLICADOS</h3>
          <p style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.15)' }}>Sube tu primer beat y empieza a vender.</p>
        </HoloCard>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 20 }}>
          {beats.map((beat: any, i: number) => <BeatCard key={beat.id || i} beat={beat} showEdit />)}
        </div>
      )}
    </div>
  );
}

function HotRanking() {
  const [beats, setBeats] = useState<any[]>([]);
  useEffect(() => { apiFetch('/marketplace/hot').then(d => setBeats(Array.isArray(d) ? d : [])).catch(() => {}); }, []);
  return (
    <div>
      <HoloCard color="#f59e0b" style={{ padding: 28, marginBottom: 20 }}>
        <h3 style={{ fontFamily: "'Anton',sans-serif", fontSize: 20, color: '#F2EDE5', margin: '0 0 4px' }}>🔥 HOT RANKING</h3>
        <p style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: 0 }}>Los beats más vendidos esta semana</p>
      </HoloCard>
      {beats.length === 0 ? (
        <HoloCard color="#f59e0b" style={{ padding: 40, textAlign: 'center' }}>
          <p style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 14, color: 'rgba(255,255,255,0.25)' }}>El ranking se actualiza con las primeras ventas.</p>
        </HoloCard>
      ) : beats.map((beat: any, i: number) => (
        <HoloCard key={beat.id || i} color="#f59e0b" style={{ padding: 20, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: i === 0 ? 'linear-gradient(135deg,#fbbf24,#f59e0b)' : i === 1 ? 'linear-gradient(135deg,#94a3b8,#64748b)' : 'linear-gradient(135deg,#cd7c32,#92400e)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontFamily: "'Anton',sans-serif", fontSize: 20, color: '#fff' }}>#{i + 1}</span>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: "'Anton',sans-serif", fontSize: 16, color: '#F2EDE5', margin: 0 }}>{beat.title || beat.titulo}</p>
              <p style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: 0 }}>{beat.genre || beat.genero} · {beat.bpm} BPM · {beat.sales || beat.total_compras || 0} ventas</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontFamily: "'Anton',sans-serif", fontSize: 18, color: '#f59e0b', margin: '0 0 8px' }}>${Number(beat.price || beat.precio || 0).toLocaleString()}</p>
              <Btn3D small onClick={() => toast('Comprando beat...', 'info')}>COMPRAR</Btn3D>
            </div>
          </div>
        </HoloCard>
      ))}
    </div>
  );
}

function TopRatedBeats() {
  const [beats, setBeats] = useState<any[]>([]);
  useEffect(() => { apiFetch('/marketplace/top-rated').then(d => setBeats(Array.isArray(d) ? d : [])).catch(() => {}); }, []);
  return (
    <div>
      <HoloCard color="#C084FC" style={{ padding: 28, marginBottom: 20 }}>
        <h3 style={{ fontFamily: "'Anton',sans-serif", fontSize: 20, color: '#F2EDE5', margin: '0 0 4px' }}>⭐ MEJOR PUNTUADOS</h3>
        <p style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: 0 }}>Los beats con mejores reseñas de la comunidad</p>
      </HoloCard>
      {beats.length === 0 ? (
        <HoloCard color="#C084FC" style={{ padding: 40, textAlign: 'center' }}>
          <p style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 14, color: 'rgba(255,255,255,0.25)' }}>Las puntuaciones aparecerán cuando los artistas dejen reseñas.</p>
        </HoloCard>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 20 }}>
          {beats.map((beat: any, i: number) => <BeatCard key={beat.id || i} beat={beat} showRating showBuy />)}
        </div>
      )}
    </div>
  );
}

const MKT_TABS = [
  { id: 'store' as const, label: 'Tienda General', icon: ShoppingBag },
  { id: 'my-beats' as const, label: 'Mi Tienda', icon: Music },
  { id: 'hot' as const, label: '🔥 Hot Ranking', icon: TrendingUp },
  { id: 'top-rated' as const, label: '⭐ Mejor Puntuados', icon: Star },
];

function MarketplacePage() {
  const [tab, setTab] = useState<'store' | 'my-beats' | 'hot' | 'top-rated'>('store');
  return (
    <PageShell title="Marketplace de Beats">
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'rgba(255,255,255,0.03)', borderRadius: 14, padding: 4 }}>
        {MKT_TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', background: tab === t.id ? 'rgba(94,23,235,0.25)' : 'transparent', color: tab === t.id ? '#C084FC' : 'rgba(255,255,255,0.35)', fontFamily: "'Space Grotesk',sans-serif", fontSize: 11, fontWeight: 700, transition: 'all 0.2s' }}>
            <t.icon size={13} />{t.label}
          </button>
        ))}
      </div>
      {tab === 'store' && <MarketplaceStore />}
      {tab === 'my-beats' && <MyBeatsStore />}
      {tab === 'hot' && <HotRanking />}
      {tab === 'top-rated' && <TopRatedBeats />}
    </PageShell>
  );
}

// ─── SPLITS ───────────────────────────────────────────────────────────────────
const AVATAR_COLORS = ['#5E17EB','#7B3FFF','#C084FC','#22c55e','#f59e0b','#3b82f6','#ef4444','#8b5cf6'];

function SplitsPieChart({ splits }: { splits: { name: string; percentage: number }[] }) {
  const total = splits.reduce((a,s)=>a+Number(s.percentage),0);
  if (splits.length === 0) return null;
  let cumulative = 0;
  const segments = splits.map((s,i) => {
    const pct = (Number(s.percentage)/Math.max(total,1))*100;
    const start = cumulative; cumulative += pct;
    return { ...s, pct, start, color: AVATAR_COLORS[i%AVATAR_COLORS.length] };
  });
  const conicStops = segments.map(s=>`${s.color} ${s.start.toFixed(1)}% ${(s.start+s.pct).toFixed(1)}%`).join(', ');
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'16px', margin:'0 0 20px' }}>
      <div style={{ width:'140px', height:'140px', borderRadius:'50%', background:`conic-gradient(${conicStops})`, boxShadow:'0 0 40px rgba(94,23,235,0.3)', flexShrink:0 }} />
      <div style={{ display:'flex', flexWrap:'wrap', gap:'8px', justifyContent:'center' }}>
        {segments.map((s,i)=>(
          <div key={i} style={{ display:'flex', alignItems:'center', gap:'5px' }}>
            <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:s.color, flexShrink:0 }}/>
            <span style={{ color:'rgba(255,255,255,0.55)', fontSize:'11px', fontFamily:"'Space Grotesk',sans-serif" }}>{s.name} ({s.percentage}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SplitsTab() {
  const [splits, setSplits] = useState<any[]>([]);
  const [tracks, setTracks] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    track_id: '',
    collaborator_name: '',
    collaborator_email: '',
    percentage: '',
    role: 'productor',
    type: 'master',
  });

  useEffect(() => {
    apiFetch('/splits').then(d=>setSplits(Array.isArray(d)?d:[])).catch(()=>{});
    apiFetch('/tracks').then(d=>setTracks(Array.isArray(d)?d:[])).catch(()=>{});
  }, []);

  const create = async () => {
    if (!form.collaborator_name || !form.percentage) {
      toast('Nombre y porcentaje son obligatorios', 'error');
      return;
    }
    try {
      await apiFetch('/splits', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          percentage: parseFloat(form.percentage),
          track_id: form.track_id ? parseInt(form.track_id) : null,
        })
      });
      toast('Colaborador agregado', 'success');
      setShowForm(false);
      setForm({track_id:'',collaborator_name:'',collaborator_email:'',percentage:'',role:'productor',type:'master'});
      apiFetch('/splits').then(d=>setSplits(Array.isArray(d)?d:[])).catch(()=>{});
    } catch(e:any) { toast(e.message, 'error'); }
  };

  const grouped: Record<string, any[]> = {};
  splits.forEach(s => {
    const key = s.track_id ? String(s.track_id) : 'general';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(s);
  });

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <div>
          <h3 style={{fontFamily:"'-apple-system','Space Grotesk',sans-serif",fontSize:18,fontWeight:700,color:'#F5F5F7',margin:'0 0 4px'}}>Gestión de Splits</h3>
          <p style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:13,color:'rgba(255,255,255,0.4)',margin:0}}>
            Master (grabación) y Publishing (composición)
          </p>
        </div>
        <AppleBtn small onClick={()=>setShowForm(!showForm)}>+ AGREGAR COLABORADOR</AppleBtn>
      </div>

      {showForm && (
        <AppleCard style={{padding:24,marginBottom:20}}>
          <h4 style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:14,fontWeight:700,color:'#F5F5F7',margin:'0 0 16px'}}>
            Nuevo colaborador
          </h4>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
            <div>
              <label style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:11,color:'rgba(255,255,255,0.35)',letterSpacing:'0.12em',textTransform:'uppercase',display:'block',marginBottom:6}}>Canción (opcional)</label>
              <select value={form.track_id} onChange={e=>setForm(p=>({...p,track_id:e.target.value}))}
                style={{width:'100%',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,padding:'10px 12px',color:'#fff',fontFamily:"'Space Grotesk',sans-serif",fontSize:13,outline:'none'}}>
                <option value="">Todas las canciones</option>
                {tracks.map((t:any)=><option key={t.id} value={t.id}>{t.title}</option>)}
              </select>
            </div>
            <div>
              <label style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:11,color:'rgba(255,255,255,0.35)',letterSpacing:'0.12em',textTransform:'uppercase',display:'block',marginBottom:6}}>Tipo de split</label>
              <select value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value}))}
                style={{width:'100%',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,padding:'10px 12px',color:'#fff',fontFamily:"'Space Grotesk',sans-serif",fontSize:13,outline:'none'}}>
                <option value="master">Master (grabación)</option>
                <option value="publishing">Publishing (composición)</option>
              </select>
            </div>
            <div>
              <label style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:11,color:'rgba(255,255,255,0.35)',letterSpacing:'0.12em',textTransform:'uppercase',display:'block',marginBottom:6}}>Nombre *</label>
              <input value={form.collaborator_name} onChange={e=>setForm(p=>({...p,collaborator_name:e.target.value}))} placeholder="Nombre del colaborador"
                style={{width:'100%',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,padding:'10px 12px',color:'#fff',fontFamily:"'Space Grotesk',sans-serif",fontSize:13,outline:'none',boxSizing:'border-box'}}/>
            </div>
            <div>
              <label style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:11,color:'rgba(255,255,255,0.35)',letterSpacing:'0.12em',textTransform:'uppercase',display:'block',marginBottom:6}}>Email</label>
              <input value={form.collaborator_email} onChange={e=>setForm(p=>({...p,collaborator_email:e.target.value}))} placeholder="email@ejemplo.com"
                style={{width:'100%',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,padding:'10px 12px',color:'#fff',fontFamily:"'Space Grotesk',sans-serif",fontSize:13,outline:'none',boxSizing:'border-box'}}/>
            </div>
            <div>
              <label style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:11,color:'rgba(255,255,255,0.35)',letterSpacing:'0.12em',textTransform:'uppercase',display:'block',marginBottom:6}}>Porcentaje % *</label>
              <input value={form.percentage} onChange={e=>setForm(p=>({...p,percentage:e.target.value}))} placeholder="30"
                type="number" min="0" max="100"
                style={{width:'100%',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,padding:'10px 12px',color:'#fff',fontFamily:"'Space Grotesk',sans-serif",fontSize:13,outline:'none',boxSizing:'border-box'}}/>
            </div>
            <div>
              <label style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:11,color:'rgba(255,255,255,0.35)',letterSpacing:'0.12em',textTransform:'uppercase',display:'block',marginBottom:6}}>Rol</label>
              <select value={form.role} onChange={e=>setForm(p=>({...p,role:e.target.value}))}
                style={{width:'100%',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,padding:'10px 12px',color:'#fff',fontFamily:"'Space Grotesk',sans-serif",fontSize:13,outline:'none'}}>
                <option value="productor">Productor</option>
                <option value="co-autor">Co-autor</option>
                <option value="letrista">Letrista</option>
                <option value="ingeniero">Ingeniero de mezcla</option>
                <option value="manager">Manager</option>
                <option value="artista">Artista</option>
              </select>
            </div>
          </div>
          <div style={{display:'flex',gap:10}}>
            <AppleBtn onClick={create} fullWidth>GUARDAR COLABORADOR</AppleBtn>
            <AppleBtn variant="ghost" onClick={()=>setShowForm(false)}>Cancelar</AppleBtn>
          </div>
        </AppleCard>
      )}

      {splits.length === 0 ? (
        <AppleCard style={{padding:40,textAlign:'center'}}>
          <div style={{fontSize:40,marginBottom:12}}>💰</div>
          <p style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:14,color:'rgba(255,255,255,0.25)'}}>
            Sin colaboradores aún. Agrega productores, co-autores o managers.
          </p>
        </AppleCard>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          {Object.entries(grouped).map(([trackId, trackSplits]) => {
            const track = tracks.find((t:any)=>String(t.id)===trackId);
            const totalPct = trackSplits.reduce((sum,s)=>sum+parseFloat(s.percentage||0),0);
            return (
              <AppleCard key={trackId} style={{padding:20}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
                  <div style={{display:'flex',alignItems:'center',gap:10}}>
                    <div style={{width:36,height:36,borderRadius:10,background:'rgba(94,23,235,0.2)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                      <Music size={16} color="#7B3FFF"/>
                    </div>
                    <div>
                      <p style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:13,fontWeight:700,color:'#F5F5F7',margin:0}}>
                        {track?.title || 'Todas las canciones'}
                      </p>
                      <p style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:11,color:'rgba(255,255,255,0.3)',margin:0}}>
                        {trackSplits.length} colaboradores
                      </p>
                    </div>
                  </div>
                  <div style={{
                    background:totalPct===100?'rgba(48,209,88,0.15)':totalPct>100?'rgba(255,69,58,0.15)':'rgba(255,214,10,0.15)',
                    border:`1px solid ${totalPct===100?'rgba(48,209,88,0.3)':totalPct>100?'rgba(255,69,58,0.3)':'rgba(255,214,10,0.3)'}`,
                    borderRadius:100,padding:'4px 12px',
                    fontFamily:"'Space Grotesk',sans-serif",fontSize:11,fontWeight:700,
                    color:totalPct===100?'#30D158':totalPct>100?'#FF453A':'#FFD60A',
                  }}>
                    {totalPct}% {totalPct===100?'✓':totalPct>100?'⚠️ EXCEDE':'⚠️ INCOMPLETO'}
                  </div>
                </div>
                {trackSplits.map((s:any,i:number)=>(
                  <div key={i} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 0',borderTop:'1px solid rgba(255,255,255,0.04)'}}>
                    <div style={{width:32,height:32,borderRadius:'50%',background:'linear-gradient(135deg,#5E17EB,#7B3FFF)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                      <span style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:12,fontWeight:700,color:'#fff'}}>
                        {(s.collaborator_name||s.artist_name||s.name||'?')[0]?.toUpperCase()}
                      </span>
                    </div>
                    <div style={{flex:1}}>
                      <p style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:13,fontWeight:600,color:'#F5F5F7',margin:0}}>{s.collaborator_name||s.artist_name||s.name}</p>
                      <p style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:11,color:'rgba(255,255,255,0.3)',margin:0}}>
                        {s.role} · {s.type === 'master' ? 'Master' : 'Publishing'}
                      </p>
                    </div>
                    <div style={{background:'rgba(94,23,235,0.15)',border:'1px solid rgba(94,23,235,0.3)',borderRadius:100,padding:'4px 12px'}}>
                      <span style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:12,fontWeight:700,color:'#C084FC'}}>{s.percentage}%</span>
                    </div>
                  </div>
                ))}
              </AppleCard>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SplitsPage() {
  return <CatalogPage initialTab="splits" />;
}

function _SplitsPageOld() {
  const [splitsTab, setSplitsTab] = useState<'master'|'publishing'|'all'>('master');
  const [splits, setSplits] = useState<any[]>([]);
  const [tracks, setTracks] = useState<any[]>([]);
  const [selectedTrack, setSelectedTrack] = useState('');
  const [form, setForm] = useState({ name:'', email:'', percentage:'', type:'master', role:'artista' });
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    apiFetch('/splits').then(d=>setSplits(Array.isArray(d)?d:[])).catch(()=>{});
    apiFetch('/tracks').then(d=>setTracks(Array.isArray(d)?d:[])).catch(()=>{});
  }, []);
  const add = async () => {
    if (!form.name||!form.percentage) return; setLoading(true);
    try {
      const d = await apiFetch('/splits', { method:'POST', body: JSON.stringify({ ...form, track_id: selectedTrack }) });
      setSplits(s=>[...s,d]); setForm({ name:'', email:'', percentage:'', type:splitsTab==='publishing'?'publishing':'master', role:'artista' });
      toast(`Split de ${form.type} agregado para ${form.name}`);
    } catch(e:any) { toast(e.message,'error'); }
    setLoading(false);
  };
  const bySplit = splits.reduce((acc:any,s:any)=>{ const k=s.track_id||'general'; if(!acc[k])acc[k]=[]; acc[k].push(s); return acc; }, {});
  const filteredSplits = splitsTab==='all' ? splits : splits.filter(s=>s.type===splitsTab||(splitsTab==='master'&&!s.type));

  const SPLITS_TABS = [{id:'master',label:'Master (Grabación)',icon:Music},{id:'publishing',label:'Publishing (Composición)',icon:BookOpen},{id:'all',label:'Todos los colaboradores',icon:Users}] as const;
  const ROLES = ['artista','productor','co-autor','letrista','ingeniero de mezcla','mánager'];

  return (
    <PageShell title="Splits de Regalías" helpText="Divide las regalías entre todos tus colaboradores. Agrega productores, co-autores o managers y define qué porcentaje le corresponde a cada uno.">
      {/* Tabs */}
      <div style={{display:'flex',gap:4,marginBottom:20,background:'rgba(255,255,255,0.03)',borderRadius:12,padding:4}}>
        {SPLITS_TABS.map(t=>(
          <button key={t.id} onClick={()=>{setSplitsTab(t.id);setForm(f=>({...f,type:t.id==='publishing'?'publishing':t.id==='all'?f.type:'master'}))}}
            style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:6,padding:'9px 8px',borderRadius:9,border:'none',cursor:'pointer',background:splitsTab===t.id?'rgba(94,23,235,0.25)':'transparent',color:splitsTab===t.id?'#C084FC':'rgba(255,255,255,0.35)',fontFamily:"'Space Grotesk',sans-serif",fontSize:11,fontWeight:700,transition:'all 0.2s',whiteSpace:'nowrap'}}>
            <t.icon size={12}/>{t.label}
          </button>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'320px 1fr', gap:'20px' }}>
        <div>
          <Card style={{ marginBottom:'16px' }}>
            <h3 style={{ fontFamily:"'Anton',sans-serif", fontSize:'13px', color:'#fff', letterSpacing:'0.06em', margin:'0 0 14px' }}>AGREGAR COLABORADOR</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
              <select style={IS} value={selectedTrack} onChange={e=>setSelectedTrack(e.target.value)}>
                <option value="">Track general...</option>
                {tracks.map(t=><option key={t.id} value={t.id}>{t.title}</option>)}
              </select>
              <input style={IS} placeholder="Nombre del colaborador" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/>
              <input style={IS} placeholder="Email" type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))}/>
              <select style={IS} value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))}>
                {ROLES.map(r=><option key={r} value={r} style={{textTransform:'capitalize'}}>{r.charAt(0).toUpperCase()+r.slice(1)}</option>)}
              </select>
              <select style={IS} value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}>
                <option value="master">Master (Grabación)</option>
                <option value="publishing">Publishing (Composición)</option>
                <option value="lyrics">Letras</option>
              </select>
              <div style={{ position:'relative' }}>
                <input style={IS} placeholder="Porcentaje" type="number" min="0" max="100" value={form.percentage} onChange={e=>setForm(f=>({...f,percentage:e.target.value}))}/>
                <Percent size={13} color="rgba(255,255,255,0.3)" style={{ position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)' }}/>
              </div>
              <Btn3D small onClick={add} disabled={loading} fullWidth>{loading?'Guardando...':'Agregar split'}</Btn3D>
            </div>
          </Card>
          <Card style={{ background:'rgba(94,23,235,0.08)', border:'1px solid rgba(94,23,235,0.2)' }}>
            <p style={{ color:'rgba(255,255,255,0.35)', fontSize:'11px', fontFamily:"'Space Grotesk',sans-serif", lineHeight:1.6, margin:0 }}>💡 Master = derechos de grabación · Publishing = derechos de composición. La suma no debe superar 100% por tipo.</p>
          </Card>
        </div>
        <Card>
          <h3 style={{ fontFamily:"'Anton',sans-serif", fontSize:'13px', color:'#fff', letterSpacing:'0.06em', margin:'0 0 16px' }}>
            {splitsTab==='master'?'SPLITS DE MASTER':splitsTab==='publishing'?'SPLITS DE PUBLISHING':'TODOS LOS COLABORADORES'}
          </h3>
          {filteredSplits.length===0 && <EmptyState icon={Users} text="Sin colaboradores en esta categoría." />}
          {filteredSplits.length > 0 && <SplitsPieChart splits={filteredSplits} />}
          {Object.entries(
            filteredSplits.reduce((acc:any,s:any)=>{ const k=s.track_id||'general'; if(!acc[k])acc[k]=[]; acc[k].push(s); return acc; }, {})
          ).map(([trackId, trackSplits]:any)=>(
            <div key={trackId} style={{ marginBottom:'20px' }}>
              <p style={{ color:PL, fontSize:'11px', fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, textTransform:'uppercase', letterSpacing:'0.12em', margin:'0 0 10px' }}>{tracks.find(t=>String(t.id)===trackId)?.title||'General'}</p>
              {trackSplits.map((s:any,i:number)=>(
                <div key={i} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ width:'34px', height:'34px', background:AVATAR_COLORS[i%AVATAR_COLORS.length], borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontFamily:"'Anton',sans-serif", fontSize:'13px', color:'#fff' }}>
                    {(s.name||'?').split(' ').map((w:string)=>w[0]).slice(0,2).join('').toUpperCase()}
                  </div>
                  <div style={{ flex:1 }}>
                    <p style={{ color:'#fff', fontSize:'13px', margin:0, fontFamily:"'Space Grotesk',sans-serif", fontWeight:500 }}>{s.name}</p>
                    <p style={{ color:'rgba(255,255,255,0.3)', fontSize:'11px', margin:0, fontFamily:"'Space Grotesk',sans-serif" }}>{s.role||s.email||'Sin email'}{s.type&&<> · <span style={{color:s.type==='publishing'?'#C084FC':'#22c55e'}}>{s.type}</span></>}</p>
                  </div>
                  <div style={{ fontFamily:"'Anton',sans-serif", fontSize:'22px', color:AVATAR_COLORS[i%AVATAR_COLORS.length] }}>{s.percentage}%</div>
                  <Badge color="#22c55e" label="Activo"/>
                </div>
              ))}
            </div>
          ))}
        </Card>
      </div>
    </PageShell>
  );
}

// ─── VAULT ────────────────────────────────────────────────────────────────────
function VaultPage() {
  const [files, setFiles] = useState<any[]>([]);
  useEffect(() => { apiFetch('/vault/files').then(d=>setFiles(Array.isArray(d)?d:[])).catch(()=>{}); }, []);
  const fileIcon = (type:string) => { if(type?.includes('audio')||type?.includes('mp3')||type?.includes('wav')) return FileAudio; if(type?.includes('video')) return FileVideo; if(type?.includes('image')) return FileImage; return FileText; };
  const fileColor = (type:string) => { if(type?.includes('audio')) return '#22c55e'; if(type?.includes('video')) return '#3b82f6'; if(type?.includes('image')) return '#f59e0b'; return 'rgba(255,255,255,0.4)'; };
  const formatSize = (bytes:number) => { if(!bytes) return '—'; if(bytes<1024) return `${bytes}B`; if(bytes<1048576) return `${(bytes/1024).toFixed(1)}KB`; return `${(bytes/1048576).toFixed(1)}MB`; };
  return (
    <PageShell title="Vault" action={<Btn3D small><Upload size={13}/> Subir archivo</Btn3D>}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'14px', marginBottom:'20px' }}>
        {[{label:'Archivos totales',value:files.length,icon:Lock},{label:'Audio',value:files.filter(f=>f.type?.includes('audio')).length,icon:FileAudio},{label:'Almacenamiento',value:'—',icon:BarChart3}].map(c=><StatCard key={c.label} label={c.label} value={c.value} icon={c.icon}/>)}
      </div>
      <Card>
        {files.length===0 && <EmptyState icon={Lock} text="Tu vault está vacío. Sube contratos, masters y archivos importantes." />}
        {files.map(f=>{const FIcon=fileIcon(f.type||f.mime_type); const col=fileColor(f.type||f.mime_type); return (
          <div key={f.id} style={{ display:'flex', alignItems:'center', gap:'14px', padding:'12px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ width:'38px', height:'38px', background:`${col}18`, borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><FIcon size={16} color={col}/></div>
            <div style={{ flex:1 }}><p style={{ color:'#fff', fontSize:'13px', margin:0, fontFamily:"'Space Grotesk',sans-serif", fontWeight:500 }}>{f.name||f.filename||'Archivo'}</p><p style={{ color:'rgba(255,255,255,0.3)', fontSize:'11px', margin:0, fontFamily:"'Space Grotesk',sans-serif" }}>{formatSize(f.size)} · {f.created_at?new Date(f.created_at).toLocaleDateString('es-CO'):'—'}</p></div>
            <a href={f.url||'#'} download style={{ display:'flex', alignItems:'center', gap:'5px', color:'rgba(255,255,255,0.3)', fontSize:'12px', fontFamily:"'Space Grotesk',sans-serif", textDecoration:'none', padding:'6px 10px', borderRadius:'8px', border:'1px solid rgba(255,255,255,0.08)' }}><Download size={12}/>Descargar</a>
          </div>
        );})}
      </Card>
    </PageShell>
  );
}

// ─── BULK UPLOAD ──────────────────────────────────────────────────────────────
function BulkUploadPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<{name:string;status:'ok'|'error'|'uploading'}[]>([]);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const onDrop = (e: React.DragEvent) => { e.preventDefault(); setDragging(false); setFiles(f=>[...f,...Array.from(e.dataTransfer.files)]); };
  const onInput = (e: React.ChangeEvent<HTMLInputElement>) => { if(e.target.files) setFiles(f=>[...f,...Array.from(e.target.files!)]); };
  const upload = async () => {
    if(!files.length) return; setUploading(true);
    const newResults = files.map(f=>({name:f.name, status:'uploading' as const})); setResults(newResults);
    for (let i=0; i<files.length; i++) {
      const fd = new FormData(); fd.append('file', files[i]);
      try {
        const res = await fetch(`${API}/upload`, { method:'POST', headers:{ Authorization:`Bearer ${token()}` }, body: fd });
        setResults(r => r.map((x,idx)=>idx===i?{...x,status:res.ok?'ok':'error'}:x));
      } catch { setResults(r=>r.map((x,idx)=>idx===i?{...x,status:'error'}:x)); }
    }
    setUploading(false); setFiles([]);
  };
  const statusIcon = (s:string) => s==='ok'?<Check size={13} color="#22c55e"/>:s==='error'?<X size={13} color="#ef4444"/>:<div style={{ width:'13px', height:'13px', border:`2px solid ${P}`, borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>;
  return (
    <PageShell title="Subida Masiva">
      <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:'20px' }}>
        <div>
          <label onDragOver={e=>{e.preventDefault();setDragging(true)}} onDragLeave={()=>setDragging(false)} onDrop={onDrop}
            style={{ display:'block', border:`2px dashed ${dragging?P:'rgba(255,255,255,0.12)'}`, borderRadius:'20px', padding:'60px 40px', textAlign:'center', cursor:'pointer', background: dragging?'rgba(94,23,235,0.08)':'transparent', transition:'all 0.2s', marginBottom:'16px' }}>
            <Upload size={40} color={dragging?P:'rgba(255,255,255,0.2)'} style={{ marginBottom:'16px' }}/>
            <p style={{ color:'#fff', fontSize:'15px', fontFamily:"'Space Grotesk',sans-serif", margin:'0 0 6px', fontWeight:600 }}>Arrastra archivos aquí</p>
            <p style={{ color:'rgba(255,255,255,0.3)', fontSize:'13px', fontFamily:"'Space Grotesk',sans-serif", margin:0 }}>MP3, WAV, FLAC, ZIP · hasta 500MB por archivo</p>
            <input type="file" multiple onChange={onInput} style={{ display:'none' }} accept=".mp3,.wav,.flac,.zip,.pdf"/>
          </label>
          {files.length>0 && <Card style={{ marginBottom:'14px' }}>
            <h3 style={{ fontFamily:"'Anton',sans-serif", fontSize:'13px', color:'#fff', letterSpacing:'0.06em', margin:'0 0 12px' }}>EN COLA ({files.length})</h3>
            {files.map((f,i)=><div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}><span style={{ color:'rgba(255,255,255,0.6)', fontSize:'12px', fontFamily:"'Space Grotesk',sans-serif" }}>{f.name}</span><span style={{ color:'rgba(255,255,255,0.3)', fontSize:'11px', fontFamily:"'Space Grotesk',sans-serif" }}>{(f.size/1048576).toFixed(1)}MB</span></div>)}
            <div style={{ marginTop:'14px', display:'flex', gap:'10px' }}>
              <Btn3D small onClick={upload} disabled={uploading}>{uploading?'Subiendo...':'Subir todo'}</Btn3D>
              <Btn3D small variant="ghost" onClick={()=>setFiles([])}>Limpiar</Btn3D>
            </div>
          </Card>}
        </div>
        <div>
          <Card>
            <h3 style={{ fontFamily:"'Anton',sans-serif", fontSize:'13px', color:'#fff', letterSpacing:'0.06em', margin:'0 0 12px' }}>RESULTADOS</h3>
            {results.length===0 && <EmptyState icon={Upload} text="Los resultados aparecerán aquí." />}
            {results.map((r,i)=>(
              <div key={i} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                {statusIcon(r.status)}
                <span style={{ color:'rgba(255,255,255,0.6)', fontSize:'12px', fontFamily:"'Space Grotesk',sans-serif", flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.name}</span>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </PageShell>
  );
}

// ─── STORE MAXIMIZER ──────────────────────────────────────────────────────────
function StoreMaximizerPage() {
  const [stats, setStats] = useState<any>(null);
  const [enabled, setEnabled] = useState<Record<string,boolean>>({});
  useEffect(() => { apiFetch('/stats').then(d=>{ setStats(d); const init: Record<string,boolean>={}; Object.keys(d?.byPlatform||{}).forEach(p=>{init[p]=true;}); setEnabled(init); }).catch(()=>{}); }, []);
  const PLATFORMS = [
    { key:'spotify', name:'Spotify', color:'#1DB954' },
    { key:'apple', name:'Apple Music', color:'#FC3C44' },
    { key:'youtube', name:'YouTube Music', color:'#FF0000' },
    { key:'tiktok', name:'TikTok', color:'#69C9D0' },
    { key:'amazon', name:'Amazon Music', color:'#00A8E0' },
    { key:'deezer', name:'Deezer', color:'#A238FF' },
    { key:'tidal', name:'Tidal', color:'#fff' },
    { key:'pandora', name:'Pandora', color:'#3668FF' },
  ];
  const toggle = (key:string) => setEnabled(e=>({...e,[key]:!e[key]}));
  return (
    <PageShell title="Store Maximizer">
      <p style={{ color:'rgba(255,255,255,0.4)', fontSize:'13px', fontFamily:"'Space Grotesk',sans-serif", margin:'0 0 24px', lineHeight:1.6 }}>Activa o desactiva tu distribución en cada plataforma. Los cambios se aplican en el próximo ciclo de distribución.</p>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:'14px' }}>
        {PLATFORMS.map(pl=>{
          const rev = stats?.byPlatform?.[pl.key] || 0;
          const isOn = enabled[pl.key]!==false;
          return (
            <Card key={pl.key} style={{ display:'flex', alignItems:'center', gap:'14px' }}>
              <div style={{ width:'40px', height:'40px', background:`${pl.color}20`, borderRadius:'12px', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, border:`1px solid ${pl.color}40` }}>
                <Globe size={18} color={pl.color}/>
              </div>
              <div style={{ flex:1 }}>
                <p style={{ color:'#fff', fontSize:'13px', fontWeight:600, margin:'0 0 2px', fontFamily:"'Space Grotesk',sans-serif" }}>{pl.name}</p>
                <p style={{ color:'rgba(255,255,255,0.3)', fontSize:'11px', margin:0, fontFamily:"'Space Grotesk',sans-serif" }}>${Number(rev).toFixed(2)} esta semana</p>
              </div>
              <button onClick={()=>toggle(pl.key)} style={{ background:'none', border:'none', cursor:'pointer', padding:0, flexShrink:0 }}>
                {isOn ? <ToggleRight size={28} color="#22c55e"/> : <ToggleLeft size={28} color="rgba(255,255,255,0.2)"/>}
              </button>
            </Card>
          );
        })}
      </div>
    </PageShell>
  );
}

// ─── RIAA CERTIFICATIONS ──────────────────────────────────────────────────────
function RIAAPage() {
  const [data, setData] = useState<any>(null);
  const [streams, setStreams] = useState(0);
  useEffect(() => {
    apiFetch('/riaa').then(setData).catch(()=>{});
    apiFetch('/royalties/summary').then(d=>setStreams(Number(d?.totalStreams||0))).catch(()=>{});
  }, []);
  const LEVELS = [
    { name:'Oro', threshold:500000, color:'#F59E0B', icon:'🥇' },
    { name:'Platino', threshold:1000000, color:'#94A3B8', icon:'🥈' },
    { name:'Diamante', threshold:10000000, color:'#67E8F9', icon:'💎' },
  ];
  const current = LEVELS.filter(l=>streams>=l.threshold).pop();
  const next = LEVELS.find(l=>streams<l.threshold);
  const progress = next ? Math.min((streams/next.threshold)*100,100) : 100;
  return (
    <PageShell title="Certificaciones RIAA">
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px', marginBottom:'20px' }}>
        <Card style={{ textAlign:'center', padding:'40px 24px' }}>
          <div style={{ fontSize:'64px', marginBottom:'12px' }}>{current?.icon||'🎵'}</div>
          <h2 style={{ fontFamily:"'Anton',sans-serif", fontSize:'32px', color: current?.color||'rgba(255,255,255,0.3)', margin:'0 0 8px', letterSpacing:'0.02em' }}>{current?.name?.toUpperCase()||'SIN CERT.'}</h2>
          <p style={{ color:'rgba(255,255,255,0.4)', fontSize:'13px', fontFamily:"'Space Grotesk',sans-serif", margin:0 }}>Certificación actual</p>
        </Card>
        <Card>
          <h3 style={{ fontFamily:"'Anton',sans-serif", fontSize:'14px', color:'#fff', letterSpacing:'0.06em', margin:'0 0 20px' }}>PRÓXIMO NIVEL</h3>
          {next ? <>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'8px' }}><span style={{ color:'rgba(255,255,255,0.5)', fontSize:'12px', fontFamily:"'Space Grotesk',sans-serif" }}>{streams.toLocaleString()} streams</span><span style={{ color:next.color, fontSize:'12px', fontFamily:"'Space Grotesk',sans-serif", fontWeight:700 }}>{next.name} — {next.threshold.toLocaleString()}</span></div>
            <div style={{ height:'8px', background:'rgba(255,255,255,0.06)', borderRadius:'100px', overflow:'hidden', marginBottom:'16px' }}><div style={{ height:'100%', background:`linear-gradient(90deg,${P},${next.color})`, borderRadius:'100px', width:`${progress}%`, transition:'width 1s' }}/></div>
            <p style={{ color:'rgba(255,255,255,0.3)', fontSize:'12px', fontFamily:"'Space Grotesk',sans-serif", margin:0 }}>Faltan {(next.threshold-streams).toLocaleString()} streams para {next.name}</p>
          </> : <p style={{ color:'#22c55e', fontSize:'13px', fontFamily:"'Space Grotesk',sans-serif" }}>¡Máximo nivel alcanzado! 💎</p>}
        </Card>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'14px' }}>
        {LEVELS.map(l=>{
          const reached = streams>=l.threshold;
          return (
            <Card key={l.name} style={{ textAlign:'center', opacity: reached?1:0.45 }}>
              <div style={{ fontSize:'32px', marginBottom:'10px' }}>{l.icon}</div>
              <p style={{ fontFamily:"'Anton',sans-serif", fontSize:'16px', color:reached?l.color:'rgba(255,255,255,0.3)', margin:'0 0 4px' }}>{l.name.toUpperCase()}</p>
              <p style={{ color:'rgba(255,255,255,0.25)', fontSize:'11px', fontFamily:"'Space Grotesk',sans-serif", margin:0 }}>{l.threshold.toLocaleString()} streams</p>
              {reached && <div style={{ marginTop:'10px' }}><Badge color={l.color} label="✓ Alcanzado"/></div>}
            </Card>
          );
        })}
      </div>
    </PageShell>
  );
}

// ─── TEAM ────────────────────────────────────────────────────────────────────
// ─── LABEL PAGE ───────────────────────────────────────────────────────────────
function LabelPage() {
  const [label, setLabel] = useState<any>(null);
  const [artists, setArtists] = useState<any[]>([]);
  const [creating, setCreating] = useState(false);
  const [labelName, setLabelName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    apiFetch('/labels/my').then(d => { setLabel(d); }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!label) return;
    apiFetch(`/labels/${label.id}/artists`).then(d => setArtists(Array.isArray(d) ? d : [])).catch(() => {});
    apiFetch(`/labels/${label.id}/stats`).then(setStats).catch(() => {});
  }, [label]);

  if (!label && !creating) return (
    <PageShell title="Mi Sello">
      <HoloCard color="#f59e0b" style={{ padding: 40, textAlign: 'center' }}>
        <Icon3D icon={Award} color="#f59e0b" size={64} />
        <h2 style={{ fontFamily: "'Anton',sans-serif", fontSize: 28, color: '#F2EDE5', margin: '24px 0 12px' }}>
          CREA TU SELLO DISCOGRÁFICO
        </h2>
        <p style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 15, color: 'rgba(255,255,255,0.5)', margin: '0 auto 32px', maxWidth: 500 }}>
          Gestiona múltiples artistas desde un solo panel. Controla regalías, distribución y marketing de todo tu roster.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 40, maxWidth: 600, margin: '0 auto 40px' }}>
          {[
            { icon: Users, label: 'Hasta 15 artistas', color: P },
            { icon: DollarSign, label: 'Splits sello/artista', color: '#22c55e' },
            { icon: BarChart3, label: 'Dashboard consolidado', color: '#3b82f6' },
          ].map((f, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 20, textAlign: 'center' }}>
              <f.icon size={24} color={f.color} style={{ marginBottom: 8 }} />
              <p style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: 0 }}>{f.label}</p>
            </div>
          ))}
        </div>
        <Btn3D onClick={() => setCreating(true)}>CREAR MI SELLO →</Btn3D>
      </HoloCard>
    </PageShell>
  );

  if (creating) return (
    <PageShell title="Crear Sello">
      <HoloCard color="#f59e0b" style={{ padding: 32, maxWidth: 500, margin: '0 auto' }}>
        <h3 style={{ fontFamily: "'Anton',sans-serif", fontSize: 22, color: '#F2EDE5', margin: '0 0 24px' }}>NOMBRE DE TU SELLO</h3>
        <input
          value={labelName}
          onChange={e => setLabelName(e.target.value)}
          placeholder="Ej: Urban Records Colombia"
          style={{ ...IS, marginBottom: 16 }}
        />
        <div style={{ display: 'flex', gap: 12 }}>
          <Btn3D onClick={async () => {
            try {
              const data = await apiFetch('/labels', { method: 'POST', body: JSON.stringify({ name: labelName }) });
              setLabel(data); setCreating(false); toast('¡Sello creado!', 'success');
            } catch (e: any) { toast(e.message, 'error'); }
          }} disabled={!labelName.trim()}>CREAR SELLO</Btn3D>
          <Btn3D variant="ghost" onClick={() => setCreating(false)}>Cancelar</Btn3D>
        </div>
      </HoloCard>
    </PageShell>
  );

  return (
    <PageShell title={label?.name || 'Mi Sello'}>
      {/* Label header */}
      <HoloCard color="#f59e0b" style={{ padding: 28, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, #f59e0b, #d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 30px rgba(245,158,11,0.4)' }}>
              <Award size={28} color="#fff" />
            </div>
            <div>
              <h2 style={{ fontFamily: "'Anton',sans-serif", fontSize: 24, color: '#F2EDE5', margin: 0 }}>{label.name}</h2>
              <p style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: 0, textTransform: 'uppercase' as any, letterSpacing: '0.1em' }}>
                Plan {label.plan} · {artists.length}/{label.max_artists} artistas · Comisión {label.commission_rate}%
              </p>
            </div>
          </div>
          <Btn3D small onClick={() => setShowInvite(v => !v)}>+ Agregar artista</Btn3D>
        </div>
        {showInvite && (
          <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' as any }}>
            <input style={{ ...IS, flex: 1, minWidth: 200 }} placeholder="Email del artista" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} />
            <Btn3D small onClick={async () => {
              try {
                await apiFetch(`/labels/${label.id}/artists`, { method: 'POST', body: JSON.stringify({ email: inviteEmail }) });
                toast('Artista agregado al sello', 'success');
                setInviteEmail(''); setShowInvite(false);
                apiFetch(`/labels/${label.id}/artists`).then(d => setArtists(Array.isArray(d) ? d : [])).catch(() => {});
              } catch (e: any) { toast(e.message || 'Error', 'error'); }
            }} disabled={!inviteEmail.trim()}>Agregar</Btn3D>
            <Btn3D small variant="ghost" onClick={() => setShowInvite(false)}>Cancelar</Btn3D>
          </div>
        )}
      </HoloCard>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 20 }}>
        {[
          { label: 'Artistas activos', value: artists.length, icon: Users, glowColor: P },
          { label: 'Regalías totales', value: stats ? `$${Number(stats.total_revenue || 0).toFixed(2)}` : '—', icon: DollarSign, glowColor: '#22c55e' },
          { label: 'Streams totales', value: stats ? Number(stats.total_streams || 0).toLocaleString() : '—', icon: TrendingUp, glowColor: '#C084FC' },
          { label: 'Tracks en roster', value: stats?.total_tracks ?? '—', icon: Music, glowColor: '#f59e0b' },
        ].map(s => <StatCard key={s.label} label={s.label} value={s.value} icon={s.icon} glowColor={s.glowColor} />)}
      </div>

      {/* Artists roster */}
      <Card>
        <h3 style={{ fontFamily: "'Anton',sans-serif", fontSize: 18, color: '#F2EDE5', margin: '0 0 20px', letterSpacing: '0.03em' }}>ROSTER DE ARTISTAS</h3>
        {artists.length === 0 ? (
          <EmptyState icon={Users} text="Sin artistas en el sello todavía. Agrega artistas con el botón de arriba." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {artists.map((a: any, i: number) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: `linear-gradient(135deg,${P},${PL})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Anton',sans-serif", color: '#fff', fontSize: 14 }}>
                    {(a.name || a.email || 'A')[0].toUpperCase()}
                  </div>
                  <div>
                    <p style={{ color: '#fff', fontSize: 13, fontWeight: 600, margin: 0, fontFamily: "'Space Grotesk',sans-serif" }}>{a.name || a.email}</p>
                    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, margin: 0, fontFamily: "'Space Grotesk',sans-serif" }}>{a.email}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Badge color="#22c55e" label={`${a.royalty_split || 85}% artista`} />
                  <Badge color={a.status === 'active' ? '#22c55e' : '#f59e0b'} label={a.status || 'active'} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </PageShell>
  );
}

function TeamPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name:'', email:'', role:'collaborator' });
  const [loading, setLoading] = useState(false);
  const load = () => apiFetch('/artists').then(d=>setMembers(Array.isArray(d)?d:[])).catch(()=>{});
  useEffect(() => { load(); }, []);
  const invite = async () => {
    if (!form.name||!form.email) return; setLoading(true);
    try { await apiFetch('/artists', { method:'POST', body: JSON.stringify(form) }); setForm({ name:'', email:'', role:'collaborator' }); setShowForm(false); load(); } catch {}
    setLoading(false);
  };
  const ROLES: Record<string,string> = { artist:'#7B3FFF', collaborator:'#3b82f6', producer:'#22c55e', manager:'#f59e0b', admin:'#ef4444' };
  return (
    <PageShell title="Equipo" action={<Btn3D small onClick={()=>setShowForm(!showForm)}><Plus size={13}/> Invitar miembro</Btn3D>}>
      {showForm && <Card style={{ marginBottom:'20px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'10px' }}>
          <input style={IS} placeholder="Nombre" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/>
          <input style={IS} placeholder="Email" type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))}/>
          <select style={IS} value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))}>
            <option value="collaborator">Colaborador</option>
            <option value="artist">Artista</option>
            <option value="producer">Productor</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div style={{ display:'flex', gap:'10px' }}>
          <Btn3D small onClick={invite} disabled={loading}>{loading?'Invitando...':'Enviar invitación'}</Btn3D>
          <Btn3D small variant="ghost" onClick={()=>setShowForm(false)}>Cancelar</Btn3D>
        </div>
      </Card>}
      <Card>
        {members.length===0 && <EmptyState icon={Users} text="Sin miembros de equipo. Invita a tus colaboradores." />}
        {members.map(m=>(
          <div key={m.id} style={{ display:'flex', alignItems:'center', gap:'14px', padding:'12px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ width:'38px', height:'38px', background:'rgba(94,23,235,0.12)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><User size={15} color={PL}/></div>
            <div style={{ flex:1 }}>
              <p style={{ color:'#fff', fontSize:'13px', fontWeight:600, margin:'0 0 2px', fontFamily:"'Space Grotesk',sans-serif" }}>{m.name}</p>
              <p style={{ color:'rgba(255,255,255,0.3)', fontSize:'11px', margin:0, fontFamily:"'Space Grotesk',sans-serif" }}>{m.email}</p>
            </div>
            <Badge color={ROLES[m.role]||'#71717a'} label={m.role||'miembro'}/>
          </div>
        ))}
      </Card>
    </PageShell>
  );
}

// ─── STATS ────────────────────────────────────────────────────────────────────
function StatsPage() {
  const [stats, setStats] = useState<any>(null);
  const [monthly, setMonthly] = useState<any[]>([]);
  useEffect(() => {
    apiFetch('/stats').then(setStats).catch(()=>{});
    apiFetch('/royalties/monthly').then(d=>setMonthly(Array.isArray(d)?d:[])).catch(()=>{});
  }, []);
  const platforms = Object.entries(stats?.byPlatform||{});
  const maxRev = Math.max(...platforms.map(([,v]:any)=>Number(v)),1);
  const maxMonth = Math.max(...monthly.map((m:any)=>Number(m.revenue||0)),1);
  return (
    <PageShell title="Estadísticas">
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'14px', marginBottom:'24px' }}>
        {[{label:'Streams totales',value:stats?Number(stats.totalStreams||0).toLocaleString():'—',icon:TrendingUp},{label:'Ingresos totales',value:stats?`$${Number(stats.totalRevenue||0).toFixed(2)}`:'—',icon:DollarSign},{label:'Plataformas',value:platforms.length||'—',icon:Globe},{label:'Meses de datos',value:monthly.length||'—',icon:Calendar}].map(c=><StatCard key={c.label} label={c.label} value={c.value} icon={c.icon}/>)}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px' }}>
        <Card>
          <h3 style={{ fontFamily:"'Anton',sans-serif", fontSize:'14px', color:'#fff', letterSpacing:'0.06em', margin:'0 0 20px' }}>INGRESOS POR PLATAFORMA</h3>
          {platforms.length===0 && <EmptyState icon={BarChart3} text="Sin datos de plataformas." />}
          {platforms.map(([name,rev]:any)=>(
            <div key={name} style={{ marginBottom:'14px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'5px' }}>
                <span style={{ color:'rgba(255,255,255,0.6)', fontSize:'12px', textTransform:'capitalize', fontFamily:"'Space Grotesk',sans-serif" }}>{name}</span>
                <span style={{ color:'#fff', fontSize:'12px', fontWeight:600, fontFamily:"'Space Grotesk',sans-serif" }}>${Number(rev).toFixed(2)}</span>
              </div>
              <div style={{ height:'6px', background:'rgba(255,255,255,0.05)', borderRadius:'100px', overflow:'hidden' }}>
                <div style={{ height:'100%', background:`linear-gradient(90deg,${P},${PL})`, borderRadius:'100px', width:`${(Number(rev)/maxRev)*100}%` }}/>
              </div>
            </div>
          ))}
        </Card>
        <Card>
          <h3 style={{ fontFamily:"'Anton',sans-serif", fontSize:'14px', color:'#fff', letterSpacing:'0.06em', margin:'0 0 20px' }}>INGRESOS MENSUALES</h3>
          {monthly.length===0 && <EmptyState icon={TrendingUp} text="Sin historial mensual." />}
          <div style={{ display:'flex', alignItems:'flex-end', gap:'6px', height:'140px' }}>
            {monthly.slice(-12).map((m:any,i:number)=>{
              const h = Math.max((Number(m.revenue||0)/maxMonth)*120,4);
              return (
                <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'4px' }}>
                  <div style={{ width:'100%', background:`linear-gradient(to top,${P},${PL})`, borderRadius:'4px 4px 0 0', height:`${h}px`, transition:'height 0.5s ease', minWidth:'8px' }}/>
                  <span style={{ color:'rgba(255,255,255,0.2)', fontSize:'9px', fontFamily:"'Space Grotesk',sans-serif", textAlign:'center', writingMode:'vertical-rl', transform:'rotate(180deg)', maxHeight:'30px', overflow:'hidden' }}>{(m.month||'').slice(-5)}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </PageShell>
  );
}

// ─── FEEDBACK ────────────────────────────────────────────────────────────────
const ROADMAP_SECTIONS = [
  { status: 'done', label: 'COMPLETADO', color: '#22c55e', items: ['Distribución en 150+ plataformas', 'Splits automáticos', 'Marketing Suite con IA', 'Legal IA con legislación colombiana', 'Marketplace de beats', 'Sistema de playlists'] },
  { status: 'progress', label: 'EN PROGRESO', color: '#f59e0b', items: ['Dockerización y deploy en producción', 'Integración Wompi pagos reales', 'Content ID YouTube', 'Distribución directa a plataformas'] },
  { status: 'planned', label: 'PLANIFICADO', color: '#5E17EB', items: ['App móvil iOS y Android', 'Integración Spotify for Artists API', 'Dashboard de labels avanzado', 'Campamentos musicales online', 'Producción de videos musicales'] },
];

function FeedbackPage() {
  const [tab, setTab] = useState<'feedback' | 'bugs' | 'roadmap'>('feedback');
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [form, setForm] = useState({ type: 'sugerencia', title: '', description: '', priority: 'media' });
  const [loading, setLoading] = useState(false);
  const load = () => apiFetch('/feedback').then(d => setFeedbacks(Array.isArray(d) ? d : [])).catch(() => {});
  useEffect(() => { load(); }, []);
  const submit = async () => {
    setLoading(true);
    try {
      await apiFetch('/feedback', { method: 'POST', body: JSON.stringify(form) });
      toast('¡Gracias por tu feedback! Lo revisaremos pronto.', 'success');
      setForm({ type: 'sugerencia', title: '', description: '', priority: 'media' });
      load();
    } catch (e: any) { toast(e.message, 'error'); }
    setLoading(false);
  };
  return (
    <PageShell title="Feedback & Mejoras">
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'rgba(255,255,255,0.03)', borderRadius: 14, padding: 4 }}>
        {[{ id: 'feedback', label: '💡 Sugerencias' }, { id: 'bugs', label: '🐛 Reportar Bug' }, { id: 'roadmap', label: '🗺️ Roadmap' }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            style={{ flex: 1, padding: '10px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', background: tab === t.id ? 'rgba(94,23,235,0.25)' : 'transparent', color: tab === t.id ? '#C084FC' : 'rgba(255,255,255,0.35)', fontFamily: "'Space Grotesk',sans-serif", fontSize: 12, fontWeight: 700, transition: 'all 0.2s' }}>
            {t.label}
          </button>
        ))}
      </div>

      {(tab === 'feedback' || tab === 'bugs') && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <HoloCard color="#5E17EB" style={{ padding: 28 }}>
            <h3 style={{ fontFamily: "'Anton',sans-serif", fontSize: 16, color: '#F2EDE5', margin: '0 0 20px' }}>
              {tab === 'feedback' ? '💡 NUEVA SUGERENCIA' : '🐛 REPORTAR BUG'}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 11, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.15em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Tipo</label>
                <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} style={{ ...IS }}>
                  {tab === 'feedback' ? (
                    <>
                      <option value="sugerencia">Sugerencia de mejora</option>
                      <option value="nueva_funcion">Nueva función</option>
                      <option value="ux">Mejora de UX/UI</option>
                    </>
                  ) : (
                    <>
                      <option value="bug_critico">Bug crítico (no puedo usar la plataforma)</option>
                      <option value="bug_medio">Bug medio (funciona con dificultad)</option>
                      <option value="bug_menor">Bug menor (problema visual)</option>
                    </>
                  )}
                </select>
              </div>
              <div>
                <label style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 11, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.15em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Título</label>
                <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  placeholder={tab === 'feedback' ? 'Ej: Agregar modo oscuro al editor de letras' : 'Ej: El botón de subir track no funciona en móvil'}
                  style={{ ...IS, boxSizing: 'border-box' as any }} />
              </div>
              <div>
                <label style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 11, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.15em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Descripción detallada</label>
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder={tab === 'feedback' ? 'Describe tu sugerencia...' : 'Describe el bug paso a paso: ¿qué hiciste?, ¿qué pasó?, ¿qué esperabas?'}
                  style={{ ...IS, resize: 'vertical' as any, minHeight: 120, boxSizing: 'border-box' as any }} />
              </div>
              <div>
                <label style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 11, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.15em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Prioridad</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['baja', 'media', 'alta'].map(p => (
                    <button key={p} onClick={() => setForm(prev => ({ ...prev, priority: p }))}
                      style={{ flex: 1, padding: 8, borderRadius: 8, border: `1px solid ${form.priority === p ? 'rgba(94,23,235,0.6)' : 'rgba(255,255,255,0.08)'}`, background: form.priority === p ? 'rgba(94,23,235,0.2)' : 'rgba(255,255,255,0.03)', color: form.priority === p ? '#C084FC' : 'rgba(255,255,255,0.4)', fontFamily: "'Space Grotesk',sans-serif", fontSize: 11, fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer', letterSpacing: '0.1em' }}>
                      {p === 'baja' ? '🟢' : p === 'media' ? '🟡' : '🔴'} {p}
                    </button>
                  ))}
                </div>
              </div>
              <Btn3D onClick={submit} disabled={loading || !form.title || !form.description} fullWidth>
                {loading ? 'ENVIANDO...' : tab === 'feedback' ? 'ENVIAR SUGERENCIA' : 'REPORTAR BUG'}
              </Btn3D>
            </div>
          </HoloCard>
          <div>
            <HoloCard color="#5E17EB" style={{ padding: 24 }}>
              <h4 style={{ fontFamily: "'Anton',sans-serif", fontSize: 14, color: '#F2EDE5', margin: '0 0 12px' }}>REPORTES RECIENTES</h4>
              {feedbacks.length === 0 ? (
                <p style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.2)', textAlign: 'center', padding: '16px 0' }}>Sin reportes aún.</p>
              ) : feedbacks.slice(0, 6).map((f: any, i: number) => (
                <div key={f.id || i} style={{ padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 12, fontWeight: 600, color: '#F2EDE5' }}>{f.title || f.subject}</span>
                    <Badge color={f.status === 'resuelto' ? '#22c55e' : '#f59e0b'} label={f.status || 'PENDIENTE'} />
                  </div>
                  <p style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: 0 }}>{f.type || f.category} · {f.priority || 'media'}</p>
                </div>
              ))}
            </HoloCard>
          </div>
        </div>
      )}

      {tab === 'roadmap' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {ROADMAP_SECTIONS.map((section, i) => (
            <HoloCard key={i} color={section.color} style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: section.color, boxShadow: `0 0 10px ${section.color}` }} />
                <h3 style={{ fontFamily: "'Anton',sans-serif", fontSize: 14, color: section.color, margin: 0, letterSpacing: '0.2em' }}>{section.label}</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {section.items.map((item, ii) => (
                  <div key={ii} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ color: section.color, fontSize: 12 }}>{section.status === 'done' ? '✓' : section.status === 'progress' ? '◐' : '○'}</span>
                    <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{item}</span>
                  </div>
                ))}
              </div>
            </HoloCard>
          ))}
        </div>
      )}
    </PageShell>
  );
}

// ─── MARKETING SUITE ─────────────────────────────────────────────────────────
const MS_STEPS = [
  { number: 1, title: 'Test de Arquetipo',   subtitle: 'Descubre tu identidad artística',    icon: '🎭', color: '#5E17EB' },
  { number: 2, title: 'Tu Marca Personal',   subtitle: 'Concepto, tribu y comunicación',     icon: '✨', color: '#7B3FFF' },
  { number: 3, title: 'Estudio de Mercado',  subtitle: 'Dónde escuchan tu música',           icon: '🌍', color: '#3b82f6' },
  { number: 4, title: 'Meta Ads',            subtitle: 'Campañas listas para lanzar',        icon: '📱', color: '#1877F2' },
  { number: 5, title: 'Plan de Contenidos',  subtitle: 'Calendario mensual con guiones',     icon: '📅', color: '#f59e0b' },
  { number: 6, title: 'Kit de Lanzamiento',  subtitle: 'HyperFollow + Promo Cards',          icon: '🚀', color: '#22c55e' },
];

const QUIZ_QUESTIONS = [
  { id: 'q1', question: '¿Cómo describes tu música en una frase?', options: ['Cruda y auténtica, sin filtros', 'Melódica y emotiva, llega al alma', 'Innovadora y experimental, siempre evolucionando', 'Poderosa y energética, para mover masas'] },
  { id: 'q2', question: '¿Qué mueve a tu audiencia ideal?', options: ['Buscan autenticidad y rebeldía', 'Necesitan conexión emocional profunda', 'Quieren arte que los haga pensar', 'Buscan energía y escapismo'] },
  { id: 'q3', question: '¿Cuál es tu red social principal?', options: ['TikTok — contenido crudo y directo', 'Instagram — estética cuidada', 'YouTube — contenido profundo y largo', 'Todos por igual'] },
  { id: 'q4', question: '¿Qué artista te representa mejor?', options: ['Bad Bunny / J Balvin — irreverente y global', 'Rosalía / C. Tangana — artístico y culturalmente profundo', 'Karol G / Feid — pop urbano masivo', 'Bizarrap / Trueno — underground que explota'] },
  { id: 'q5', question: '¿Cuál es tu mayor fortaleza artística?', options: ['Mi historia personal y honestidad', 'Mi habilidad vocal/instrumental', 'Mi visión estética y producción', 'Mi energía en vivo y conexión directa'] },
];

function Step1Archetype({ onComplete }: { onComplete: (data: any) => void }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const allAnswered = QUIZ_QUESTIONS.every(q => answers[q.id]);

  const analyze = async () => {
    setLoading(true);
    try {
      const payload = QUIZ_QUESTIONS.map(q => ({ question: q.question, answer: answers[q.id] }));
      const data = await apiFetch('/ai/archetype', { method: 'POST', body: JSON.stringify({ answers: payload }) });
      setResult(data);
    } catch { setResult({ archetype: 'El Creador', emoji: '🎨', description: 'Eres un artista que vive para crear y expresar su visión única al mundo.', tribe: 'Los Visionarios', keyword: 'Autenticidad', brandColor: '#5E17EB', hashtags: ['#Creator','#Arte','#Música','#Visión','#Único'] }); }
    setLoading(false);
  };

  if (result) return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '72px', marginBottom: '16px' }}>{result.emoji}</div>
      <div style={{ fontSize: '28px', fontWeight: 700, color: result.brandColor || '#5E17EB', marginBottom: '8px' }}>{result.archetype}</div>
      <div style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '16px', lineHeight: 1.6 }}>{result.description}</div>
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '24px' }}>
        <span style={{ background: 'rgba(94,23,235,0.2)', border: '1px solid rgba(94,23,235,0.4)', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', color: '#fff' }}>Tribu: {result.tribe}</span>
        <span style={{ background: 'rgba(94,23,235,0.2)', border: '1px solid rgba(94,23,235,0.4)', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', color: '#fff' }}>Palabra clave: {result.keyword}</span>
      </div>
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '32px' }}>
        {(result.hashtags || []).map((h: string, i: number) => (
          <span key={i} style={{ color: result.brandColor || '#5E17EB', fontSize: '13px' }}>{h}</span>
        ))}
      </div>
      <button onClick={() => onComplete({ archetype: result.archetype, archetypeData: result })}
        style={{ background: 'linear-gradient(135deg, #5E17EB, #7B3FFF)', color: '#fff', border: 'none', borderRadius: '12px', padding: '14px 32px', fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}>
        Continuar con mi marca →
      </button>
    </div>
  );

  return (
    <div>
      <div style={{ marginBottom: '28px', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>
        {Object.keys(answers).length}/{QUIZ_QUESTIONS.length} preguntas respondidas
      </div>
      {QUIZ_QUESTIONS.map(q => (
        <div key={q.id} style={{ marginBottom: '28px' }}>
          <div style={{ fontSize: '15px', fontWeight: 600, color: '#fff', marginBottom: '12px' }}>{q.question}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {q.options.map((opt, i) => (
              <button key={i} onClick={() => setAnswers(a => ({ ...a, [q.id]: opt }))}
                style={{ padding: '12px 16px', borderRadius: '10px', border: `1px solid ${answers[q.id] === opt ? '#5E17EB' : 'rgba(255,255,255,0.1)'}`, background: answers[q.id] === opt ? 'rgba(94,23,235,0.3)' : 'rgba(255,255,255,0.04)', color: answers[q.id] === opt ? '#fff' : 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '13px', textAlign: 'left', transition: 'all 0.2s' }}>
                {opt}
              </button>
            ))}
          </div>
        </div>
      ))}
      <button onClick={analyze} disabled={!allAnswered || loading}
        style={{ width: '100%', background: allAnswered ? 'linear-gradient(135deg, #5E17EB, #7B3FFF)' : 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: '12px', padding: '14px', fontSize: '15px', fontWeight: 600, cursor: allAnswered ? 'pointer' : 'not-allowed', opacity: allAnswered ? 1 : 0.5 }}>
        {loading ? 'Analizando tu arquetipo...' : 'Descubrir mi arquetipo ✨'}
      </button>
    </div>
  );
}

function Step2Branding({ brandData, onComplete }: { brandData: any; onComplete: (data: any) => void }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (!brandData.archetype) return;
    setLoading(true);
    apiFetch('/ai/branding', { method: 'POST', body: JSON.stringify({ archetype: brandData.archetype, archetypeData: brandData.archetypeData }) })
      .then(data => setResult(data))
      .catch(() => setResult({ concept: 'Un artista que rompe barreras y conecta con su tribu de manera auténtica.', tribe: 'Jóvenes creativos que buscan música que los represente.', language: 'Auténtico, directo, con actitud', valueProposition: 'Ofreces música que nace de la experiencia real. Tu audiencia siente que eres uno de ellos.', tagline: 'Real. Tuyo. Sin filtros.', hashtags: ['#MiMúsica', '#Auténtico', '#Indie', '#ArtistaIndependiente', '#SinFiltros', '#Música'], colorPalette: ['#5E17EB', '#7B3FFF', '#22c55e'], contentPillars: ['Behind the scenes', 'Proceso creativo', 'Conexión con fans'] }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.5)' }}>✨ Construyendo tu marca personal...</div>;
  if (!result) return null;

  return (
    <div>
      <div style={{ background: 'rgba(94,23,235,0.1)', border: '1px solid rgba(94,23,235,0.3)', borderRadius: '16px', padding: '24px', marginBottom: '20px' }}>
        <div style={{ fontSize: '12px', color: '#7B3FFF', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Concepto de marca</div>
        <div style={{ fontSize: '18px', fontWeight: 600, color: '#fff', lineHeight: 1.5 }}>{result.concept}</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Tu tribu</div>
          <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px', lineHeight: 1.5 }}>{result.tribe}</div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Lenguaje</div>
          <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px', lineHeight: 1.5 }}>{result.language}</div>
        </div>
      </div>
      <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Propuesta de valor</div>
        <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px', lineHeight: 1.6 }}>{result.valueProposition}</div>
      </div>
      <div style={{ background: 'linear-gradient(135deg, rgba(94,23,235,0.15), rgba(123,63,255,0.1))', border: '1px solid rgba(94,23,235,0.3)', borderRadius: '12px', padding: '16px', marginBottom: '20px', textAlign: 'center' }}>
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Tu tagline</div>
        <div style={{ fontSize: '22px', fontWeight: 700, color: '#fff', fontStyle: 'italic' }}>"{result.tagline}"</div>
      </div>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '28px' }}>
        {(result.colorPalette || []).map((c: string, i: number) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '8px', padding: '6px 12px' }}>
            <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: c }} />
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>{c}</span>
          </div>
        ))}
      </div>
      <button onClick={() => onComplete({ branding: result })}
        style={{ width: '100%', background: 'linear-gradient(135deg, #7B3FFF, #5E17EB)', color: '#fff', border: 'none', borderRadius: '12px', padding: '14px', fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}>
        Continuar al estudio de mercado →
      </button>
    </div>
  );
}

function Step3Market({ brandData, onComplete }: { brandData: any; onComplete: (data: any) => void }) {
  const [genre, setGenre] = useState('urbano');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const GENRES = ['urbano', 'trap', 'reggaeton', 'pop', 'rock', 'salsa', 'cumbia', 'electrónica', 'hip-hop', 'indie', 'vallenato', 'metal'];

  const analyze = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/ai/market-intel', { method: 'POST', body: JSON.stringify({ genre, artistType: brandData.archetype || 'independiente' }) });
      setResult(data);
    } catch { setResult({ topCountries: [{ country: 'Colombia', flag: '🇨🇴', percentage: 35 }, { country: 'México', flag: '🇲🇽', percentage: 28 }, { country: 'Argentina', flag: '🇦🇷', percentage: 15 }, { country: 'Chile', flag: '🇨🇱', percentage: 12 }, { country: 'Perú', flag: '🇵🇪', percentage: 10 }], topCities: [{ city: 'Bogotá', country: 'Colombia', streams: '2.4M' }, { city: 'Medellín', country: 'Colombia', streams: '1.8M' }, { city: 'CDMX', country: 'México', streams: '1.5M' }], audience: { ageRange: '18-28', gender: '58% Masculino', platform: 'Spotify', peakTime: '8pm-11pm' }, strategy: 'Enfoca tus lanzamientos en Colombia y México, donde la audiencia urbana está en crecimiento constante.' }); }
    setLoading(false);
  };

  if (result) return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
        <div style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '12px', color: '#3b82f6', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Top países</div>
          {(result.topCountries || []).map((c: any, i: number) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <span style={{ fontSize: '18px' }}>{c.flag}</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>{c.country}</span>
                  <span style={{ fontSize: '12px', color: '#3b82f6' }}>{c.percentage}%</span>
                </div>
                <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px' }}>
                  <div style={{ height: '100%', width: `${c.percentage}%`, background: '#3b82f6', borderRadius: '2px' }} />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div>
          <div style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '12px', padding: '16px', marginBottom: '12px' }}>
            <div style={{ fontSize: '12px', color: '#3b82f6', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>Audiencia</div>
            {Object.entries(result.audience || {}).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
                <span style={{ color: 'rgba(255,255,255,0.5)', textTransform: 'capitalize' }}>{k.replace(/([A-Z])/g, ' $1')}</span>
                <span style={{ color: '#fff' }}>{v as string}</span>
              </div>
            ))}
          </div>
          <div style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '12px', padding: '16px' }}>
            <div style={{ fontSize: '12px', color: '#3b82f6', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Top ciudades</div>
            {(result.topCities || []).slice(0, 3).map((c: any, i: number) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                <span style={{ color: 'rgba(255,255,255,0.7)' }}>{c.city}, {c.country}</span>
                <span style={{ color: '#3b82f6' }}>{c.streams}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {result.strategy && (
        <div style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
          <div style={{ fontSize: '12px', color: '#3b82f6', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Estrategia recomendada</div>
          <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px', lineHeight: 1.6 }}>{result.strategy}</div>
        </div>
      )}
      <button onClick={() => onComplete({ market: result, genre })}
        style={{ width: '100%', background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: '#fff', border: 'none', borderRadius: '12px', padding: '14px', fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}>
        Continuar a Meta Ads →
      </button>
    </div>
  );

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', marginBottom: '12px' }}>Selecciona tu género musical</div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {GENRES.map(g => (
            <button key={g} onClick={() => setGenre(g)}
              style={{ padding: '8px 16px', borderRadius: '20px', border: `1px solid ${genre === g ? '#3b82f6' : 'rgba(255,255,255,0.15)'}`, background: genre === g ? 'rgba(59,130,246,0.2)' : 'transparent', color: genre === g ? '#fff' : 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '13px', textTransform: 'capitalize', transition: 'all 0.2s' }}>
              {g}
            </button>
          ))}
        </div>
      </div>
      <button onClick={analyze} disabled={loading}
        style={{ width: '100%', background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: '#fff', border: 'none', borderRadius: '12px', padding: '14px', fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}>
        {loading ? 'Analizando mercado...' : 'Analizar mi mercado 🌍'}
      </button>
    </div>
  );
}

function Step4MetaAds({ brandData, onComplete }: { brandData: any; onComplete: (data: any) => void }) {
  const [objective, setObjective] = useState('streams');
  const [budget, setBudget] = useState('50000');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const OBJECTIVES = [{ id: 'streams', label: 'Más streams', icon: '🎵' }, { id: 'followers', label: 'Más seguidores', icon: '👥' }, { id: 'presave', label: 'Pre-save', icon: '📥' }, { id: 'awareness', label: 'Awareness', icon: '👁️' }];

  const generate = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/ai/meta-ads-copy', { method: 'POST', body: JSON.stringify({ archetype: brandData.archetype, branding: brandData.branding, market: brandData.market, genre: brandData.genre, objective, budget }) });
      setResult(data);
    } catch { setResult({ ads: [{ format: 'Historia (Stories)', headline: 'Tu nueva canción llegó', copy: 'Escúchala ahora en todas las plataformas. 🔥', cta: 'Escúchalo ahora', audience: '18-28, intereses: música urbana', tip: 'Usa vertical 9:16, primeros 3 segundos impactantes' }, { format: 'Feed (Imagen/Video)', headline: 'Nuevo lanzamiento disponible', copy: 'Ya está disponible en Spotify y Apple Music.', cta: 'Escuchar en Spotify', audience: '18-30, fans del género', tip: 'Imagen de alta calidad, texto mínimo' }, { format: 'Reel (Video corto)', headline: '¿Ya la escuchaste?', copy: 'El tema del momento ya está disponible.', cta: 'Ver ahora', audience: '16-25, muy activos en Instagram', tip: 'Clip de 15-30s del mejor momento de la canción' }], budgetRecommendation: '40% Stories, 35% Feed, 25% Reels' }); }
    setLoading(false);
  };

  const adColors: Record<string, string> = { 'Historia (Stories)': '#E1306C', 'Feed (Imagen/Video)': '#1877F2', 'Reel (Video corto)': '#9333ea' };

  if (result) return (
    <div>
      {(result.ads || []).map((ad: any, i: number) => (
        <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${adColors[ad.format] || '#5E17EB'}33`, borderRadius: '14px', padding: '20px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: adColors[ad.format] || '#5E17EB' }}>{ad.format}</span>
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.06)', padding: '4px 10px', borderRadius: '20px' }}>{ad.cta}</span>
          </div>
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#fff', marginBottom: '8px' }}>{ad.headline}</div>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', marginBottom: '12px', lineHeight: 1.5 }}>{ad.copy}</div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px' }}>
            <span style={{ marginRight: '16px' }}>👥 {ad.audience}</span>
          </div>
          {ad.tip && <div style={{ marginTop: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>💡 {ad.tip}</div>}
        </div>
      ))}
      {result.budgetRecommendation && (
        <div style={{ background: 'rgba(24,119,242,0.1)', border: '1px solid rgba(24,119,242,0.3)', borderRadius: '12px', padding: '14px', marginBottom: '24px', fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>
          💰 Distribución sugerida: {result.budgetRecommendation}
        </div>
      )}
      <button onClick={() => onComplete({ metaAds: result, budget, objective })}
        style={{ width: '100%', background: 'linear-gradient(135deg, #1877F2, #1251a3)', color: '#fff', border: 'none', borderRadius: '12px', padding: '14px', fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}>
        Continuar al plan de contenidos →
      </button>
    </div>
  );

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', marginBottom: '12px' }}>Objetivo de campaña</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {OBJECTIVES.map(o => (
            <button key={o.id} onClick={() => setObjective(o.id)}
              style={{ padding: '12px 16px', borderRadius: '10px', border: `1px solid ${objective === o.id ? '#1877F2' : 'rgba(255,255,255,0.1)'}`, background: objective === o.id ? 'rgba(24,119,242,0.2)' : 'rgba(255,255,255,0.04)', color: objective === o.id ? '#fff' : 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '13px', textAlign: 'left', transition: 'all 0.2s' }}>
              {o.icon} {o.label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ marginBottom: '28px' }}>
        <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>Presupuesto diario (COP)</div>
        <input type="number" value={budget} onChange={e => setBudget(e.target.value)}
          style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', padding: '12px 16px', color: '#fff', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }}
          placeholder="50000" />
      </div>
      <button onClick={generate} disabled={loading}
        style={{ width: '100%', background: 'linear-gradient(135deg, #1877F2, #1251a3)', color: '#fff', border: 'none', borderRadius: '12px', padding: '14px', fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}>
        {loading ? 'Generando copies...' : 'Generar copies con IA 📱'}
      </button>
    </div>
  );
}

function Step5ContentPlan({ brandData, onComplete }: { brandData: any; onComplete: (data: any) => void }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [activeWeek, setActiveWeek] = useState(0);

  useEffect(() => {
    setLoading(true);
    apiFetch('/ai/content-plan', { method: 'POST', body: JSON.stringify({ archetype: brandData.archetype, branding: brandData.branding, market: brandData.market, genre: brandData.genre }) })
      .then(data => setResult(data))
      .catch(() => setResult({ weeks: [{ week: 1, theme: 'Lanzamiento', posts: [{ day: 'Lunes', format: 'Reel', title: 'Behind the scenes', duration: '30s', script: 'Muestra el proceso de creación de tu canción. Habla directo a cámara sobre qué inspiró el tema.', hashtags: ['#BehindTheScenes', '#Proceso', '#Música'] }, { day: 'Miércoles', format: 'Post', title: 'Arte del sencillo', duration: 'Estática', script: 'Publica el arte oficial del sencillo con una cita de la letra. Usa tu paleta de colores.', hashtags: ['#NuevoSencillo', '#Arte', '#Lanzamiento'] }, { day: 'Viernes', format: 'Historia', title: 'Cuenta regresiva', duration: '15s', script: 'Crea expectativa con una cuenta regresiva animada. Muestra 5 segundos del audio.', hashtags: ['#PróximoLanzamiento', '#Próximo', '#Exclusivo'] }] }, { week: 2, theme: 'Conexión', posts: [{ day: 'Lunes', format: 'TikTok', title: 'Trend musical', duration: '15s', script: 'Úsate en el trend de la semana incorporando tu canción.', hashtags: ['#Trend', '#TikTok', '#MúsicaNueva'] }, { day: 'Jueves', format: 'Post', title: 'Letra favorita', duration: 'Estática', script: 'Diseño con tu verso favorito de la canción. Pregunta a tus fans cuál es el suyo.', hashtags: ['#Letra', '#Canción', '#Favorito'] }, { day: 'Sábado', format: 'Reel', title: 'Fan react', duration: '30s', script: 'Reacciona a los comentarios de tus fans sobre la canción. Sé auténtico y cercano.', hashtags: ['#Fans', '#Reacción', '#Comunidad'] }] }] }))
      .finally(() => setLoading(false));
  }, []);

  const formatColors: Record<string, string> = { 'Reel': '#E1306C', 'TikTok': '#010101', 'Post': '#5E17EB', 'Historia': '#f59e0b', 'YouTube': '#FF0000' };

  if (loading) return <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.5)' }}>📅 Generando tu calendario de contenidos...</div>;
  if (!result) return null;

  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', overflowX: 'auto' }}>
        {(result.weeks || []).map((w: any, i: number) => (
          <button key={i} onClick={() => setActiveWeek(i)}
            style={{ flexShrink: 0, padding: '8px 18px', borderRadius: '20px', border: `1px solid ${activeWeek === i ? '#f59e0b' : 'rgba(255,255,255,0.15)'}`, background: activeWeek === i ? 'rgba(245,158,11,0.2)' : 'transparent', color: activeWeek === i ? '#fff' : 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '13px', transition: 'all 0.2s' }}>
            Semana {w.week} {w.theme ? `— ${w.theme}` : ''}
          </button>
        ))}
      </div>
      {result.weeks?.[activeWeek]?.posts?.map((post: any, i: number) => (
        <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '18px', marginBottom: '14px' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '10px' }}>
            <span style={{ background: formatColors[post.format] || '#5E17EB', color: '#fff', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap' }}>{post.format}</span>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', paddingTop: '2px' }}>{post.day} · {post.duration}</span>
          </div>
          <div style={{ fontSize: '15px', fontWeight: 600, color: '#fff', marginBottom: '8px' }}>{post.title}</div>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, marginBottom: '10px' }}>{post.script}</div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {(post.hashtags || []).map((h: string, j: number) => (
              <span key={j} style={{ color: '#f59e0b', fontSize: '12px' }}>{h}</span>
            ))}
          </div>
        </div>
      ))}
      <button onClick={() => onComplete({ contentPlan: result })}
        style={{ width: '100%', marginTop: '8px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', border: 'none', borderRadius: '12px', padding: '14px', fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}>
        Continuar al kit de lanzamiento →
      </button>
    </div>
  );
}

function Step6LaunchKit({ brandData, onComplete }: { brandData: any; onComplete: (data: any) => void }) {
  const [hyperUrl, setHyperUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const genUrl = () => {
    const slug = `im-${Date.now()}`;
    setHyperUrl(`https://immusic.co/pre/${slug}`);
  };

  return (
    <div>
      <div style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(22,163,74,0.1))', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '16px', padding: '24px', marginBottom: '20px', textAlign: 'center' }}>
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>🎉</div>
        <div style={{ fontSize: '20px', fontWeight: 700, color: '#22c55e', marginBottom: '8px' }}>¡Tu Marketing Suite está completo!</div>
        <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>Has completado los 5 pasos. Aquí está tu kit de lanzamiento:</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
        {[
          { icon: '🎭', label: 'Arquetipo', value: brandData.archetype || '—' },
          { icon: '✨', label: 'Tagline', value: brandData.branding?.tagline || '—' },
          { icon: '🌍', label: 'Mercado principal', value: brandData.market?.topCountries?.[0]?.country || '—' },
          { icon: '📱', label: 'Ads listos', value: `${brandData.metaAds?.ads?.length || 0} formatos` },
          { icon: '📅', label: 'Posts planificados', value: `${(brandData.contentPlan?.weeks || []).reduce((s: number, w: any) => s + (w.posts?.length || 0), 0)} posts` },
          { icon: '🎨', label: 'Color de marca', value: brandData.archetypeData?.brandColor || '#5E17EB' },
        ].map((item, i) => (
          <div key={i} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '14px' }}>
            <div style={{ fontSize: '20px', marginBottom: '6px' }}>{item.icon}</div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>{item.label}</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>{item.value}</div>
          </div>
        ))}
      </div>
      <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '14px', padding: '20px', marginBottom: '20px' }}>
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff', marginBottom: '12px' }}>🔗 Página HyperFollow</div>
        {hyperUrl ? (
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.06)', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#22c55e', fontFamily: 'monospace' }}>{hyperUrl}</div>
            <button onClick={() => { navigator.clipboard.writeText(hyperUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              style={{ background: copied ? '#22c55e' : 'rgba(34,197,94,0.2)', border: '1px solid rgba(34,197,94,0.4)', color: '#22c55e', borderRadius: '8px', padding: '10px 16px', cursor: 'pointer', fontSize: '13px', transition: 'all 0.3s' }}>
              {copied ? '✓' : 'Copiar'}
            </button>
          </div>
        ) : (
          <button onClick={genUrl}
            style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e', borderRadius: '10px', padding: '10px 20px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
            Generar link HyperFollow →
          </button>
        )}
      </div>
      <button onClick={() => onComplete({})}
        style={{ width: '100%', background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#fff', border: 'none', borderRadius: '12px', padding: '16px', fontSize: '16px', fontWeight: 700, cursor: 'pointer' }}>
        🚀 ¡Lanzar mi música al mundo!
      </button>
    </div>
  );
}

function MarketingSuitePage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [brandData, setBrandData] = useState<any>({});

  const handleComplete = (stepNumber: number, data: any) => {
    setBrandData((prev: any) => ({ ...prev, ...data }));
    setCompletedSteps(prev => [...new Set([...prev, stepNumber])]);
    setCurrentStep(stepNumber + 1);
  };

  const step = MS_STEPS[currentStep - 1];

  return (
    <PageShell title="Marketing Suite" helpText="Sigue el flujo completo: Test de Arquetipo → Tu Marca → Estudio de Mercado → Meta Ads → Plan de Contenidos → Kit de Lanzamiento.">
      {/* Progress steps */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0', marginBottom: '32px', overflowX: 'auto', padding: '4px 0' }}>
        {MS_STEPS.map((s, i) => {
          const isCompleted = completedSteps.includes(s.number);
          const isCurrent = currentStep === s.number;
          const isLocked = !isCompleted && !isCurrent;
          return (
            <React.Fragment key={s.number}>
              <button onClick={() => isCompleted && setCurrentStep(s.number)}
                style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: isCompleted ? 'pointer' : 'default', padding: '4px 6px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isCompleted ? '16px' : '20px', background: isCompleted ? '#22c55e' : isCurrent ? s.color : 'rgba(255,255,255,0.06)', border: `2px solid ${isCompleted ? '#22c55e' : isCurrent ? s.color : 'rgba(255,255,255,0.1)'}`, boxShadow: isCurrent ? `0 0 20px ${s.color}66` : 'none', transition: 'all 0.3s', color: isLocked ? 'rgba(255,255,255,0.3)' : '#fff' }}>
                  {isCompleted ? '✓' : s.icon}
                </div>
                <span style={{ fontSize: '10px', color: isCompleted ? '#22c55e' : isCurrent ? '#fff' : 'rgba(255,255,255,0.3)', textAlign: 'center', maxWidth: '64px', lineHeight: 1.2, fontWeight: isCurrent ? 600 : 400 }}>{s.title}</span>
              </button>
              {i < MS_STEPS.length - 1 && (
                <div style={{ flex: 1, height: '2px', background: completedSteps.includes(s.number) ? '#22c55e' : 'rgba(255,255,255,0.08)', minWidth: '16px', transition: 'background 0.5s', marginBottom: '18px' }} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Step header */}
      <div style={{ background: `linear-gradient(135deg, ${step?.color}22, ${step?.color}0a)`, border: `1px solid ${step?.color}44`, borderRadius: '16px', padding: '20px 24px', marginBottom: '28px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ fontSize: '36px' }}>{step?.icon}</div>
        <div>
          <div style={{ fontSize: '11px', color: step?.color, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '4px' }}>Paso {step?.number} de {MS_STEPS.length}</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#fff', marginBottom: '2px' }}>{step?.title}</div>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>{step?.subtitle}</div>
        </div>
      </div>

      {/* Step content */}
      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '28px' }}>
        {currentStep === 1 && <Step1Archetype onComplete={data => handleComplete(1, data)} />}
        {currentStep === 2 && <Step2Branding brandData={brandData} onComplete={data => handleComplete(2, data)} />}
        {currentStep === 3 && <Step3Market brandData={brandData} onComplete={data => handleComplete(3, data)} />}
        {currentStep === 4 && <Step4MetaAds brandData={brandData} onComplete={data => handleComplete(4, data)} />}
        {currentStep === 5 && <Step5ContentPlan brandData={brandData} onComplete={data => handleComplete(5, data)} />}
        {currentStep === 6 && <Step6LaunchKit brandData={brandData} onComplete={data => handleComplete(6, data)} />}
        {currentStep > 6 && (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎉</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#22c55e', marginBottom: '12px' }}>¡Marketing Suite completado!</div>
            <div style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '24px' }}>Has configurado todo tu sistema de marketing. ¡Tu música está lista para llegar al mundo!</div>
            <button onClick={() => { setCurrentStep(1); setCompletedSteps([]); setBrandData({}); }}
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '12px', padding: '12px 24px', cursor: 'pointer', fontSize: '14px' }}>
              Empezar de nuevo
            </button>
          </div>
        )}
      </div>
    </PageShell>
  );
}

// ─── SETTINGS ────────────────────────────────────────────────────────────────
// ─── PROMO CARDS ─────────────────────────────────────────────────────────────
function PromoCardsPage() {
  const [tracks, setTracks] = useState<any[]>([]);
  const [cards, setCards] = useState<any[]>([]);
  const [form, setForm] = useState({ track_id:'', template:'square' });
  const [generating, setGenerating] = useState(false);
  useEffect(() => {
    apiFetch('/tracks').then(d=>setTracks(Array.isArray(d)?d:[])).catch(()=>{});
    apiFetch('/promo').then(d=>setCards(Array.isArray(d)?d:[])).catch(()=>{});
  }, []);
  const generate = async () => {
    setGenerating(true);
    try {
      const d = await apiFetch('/promo/generate', { method:'POST', body: JSON.stringify(form) });
      setCards(c=>[d,...c]);
    } catch {
      // fallback: add a local preview card
      const track = tracks.find(t=>String(t.id)===form.track_id);
      setCards(c=>[{ id: Date.now(), title: track?.title||'Mi Track', template: form.template, generated_at: new Date().toISOString() }, ...c]);
    }
    setGenerating(false);
  };
  const TEMPLATES = [
    { id:'square', label:'Square', w:200, h:200, desc:'1:1 Instagram' },
    { id:'story', label:'Story', w:120, h:213, desc:'9:16 Stories' },
    { id:'banner', label:'Banner', w:320, h:107, desc:'3:1 Twitter' },
  ];
  const GRAD_PALETTES = [
    'linear-gradient(135deg,#5E17EB,#C084FC)',
    'linear-gradient(135deg,#7B3FFF,#1DB954)',
    'linear-gradient(135deg,#4A12D0,#FC3C44)',
    'linear-gradient(135deg,#2D0B6B,#7B3FFF)',
  ];
  const PromoPreview = ({ card, idx }: { card:any; idx:number }) => {
    const tpl = TEMPLATES.find(t=>t.id===card.template)||TEMPLATES[0];
    const grad = GRAD_PALETTES[idx % GRAD_PALETTES.length];
    const scale = 160 / Math.max(tpl.w, tpl.h);
    return (
      <Card style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'14px' }}>
        <div style={{ position:'relative', width: tpl.w*scale, height: tpl.h*scale, background: grad, borderRadius:'10px', overflow:'hidden', boxShadow:'0 8px 32px rgba(0,0,0,0.4)', flexShrink:0 }}>
          <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.3)' }}/>
          <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'10px', textAlign:'center' }}>
            <p style={{ fontFamily:"'Anton',sans-serif", fontSize:`${Math.max(10, 14*scale)}px`, color:'#fff', margin:0, letterSpacing:'0.04em', textShadow:'0 2px 8px rgba(0,0,0,0.8)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{card.title||'TRACK'}</p>
            <p style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:`${Math.max(8, 9*scale)}px`, color:'rgba(255,255,255,0.6)', margin:'2px 0 0', letterSpacing:'0.1em' }}>IM MUSIC</p>
          </div>
          <div style={{ position:'absolute', top:'8px', right:'8px', width:'20px', height:'20px', background:'rgba(255,255,255,0.15)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center' }}><Music size={10} color="#fff"/></div>
        </div>
        <div style={{ textAlign:'center', width:'100%' }}>
          <p style={{ color:'#fff', fontSize:'12px', fontWeight:600, margin:'0 0 2px', fontFamily:"'Space Grotesk',sans-serif" }}>{card.title||'Track'}</p>
          <p style={{ color:'rgba(255,255,255,0.3)', fontSize:'10px', margin:'0 0 10px', fontFamily:"'Space Grotesk',sans-serif" }}>{tpl.desc}</p>
          <Btn3D small variant="ghost" onClick={()=>{
            const canvas = document.createElement('canvas'); canvas.width=tpl.w*4; canvas.height=tpl.h*4;
            const ctx = canvas.getContext('2d')!; const grd = ctx.createLinearGradient(0,0,canvas.width,canvas.height);
            grd.addColorStop(0,'#5E17EB'); grd.addColorStop(1,'#C084FC'); ctx.fillStyle=grd; ctx.fillRect(0,0,canvas.width,canvas.height);
            ctx.fillStyle='rgba(0,0,0,0.3)'; ctx.fillRect(0,0,canvas.width,canvas.height);
            ctx.fillStyle='#fff'; ctx.font=`bold ${48}px Anton,sans-serif`; ctx.textAlign='center'; ctx.fillText(card.title||'TRACK', canvas.width/2, canvas.height*0.75);
            canvas.toBlob(b=>{ if(!b)return; const a=document.createElement('a'); a.href=URL.createObjectURL(b); a.download=`promo_${card.template}_${card.id||idx}.png`; a.click(); });
          }}><Download size={12}/> Descargar</Btn3D>
        </div>
      </Card>
    );
  };
  return (
    <PageShell title="Promo Cards">
      <Card style={{ marginBottom:'20px' }}>
        <h3 style={{ fontFamily:"'Anton',sans-serif", fontSize:'14px', color:'#fff', letterSpacing:'0.06em', margin:'0 0 16px' }}>GENERAR PROMO CARD</h3>
        <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:'16px', alignItems:'end' }}>
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            <select style={IS} value={form.track_id} onChange={e=>setForm(f=>({...f,track_id:e.target.value}))}>
              <option value="">Selecciona un track...</option>
              {tracks.map(t=><option key={t.id} value={t.id}>{t.title}</option>)}
            </select>
            <div style={{ display:'flex', gap:'10px' }}>
              {TEMPLATES.map(t=>(
                <button key={t.id} onClick={()=>setForm(f=>({...f,template:t.id}))}
                  style={{ flex:1, padding:'10px 8px', borderRadius:'10px', border:`1px solid ${form.template===t.id?P:'rgba(255,255,255,0.08)'}`, background: form.template===t.id?'rgba(94,23,235,0.15)':'transparent', cursor:'pointer', transition:'all 0.2s' }}>
                  <p style={{ fontFamily:"'Anton',sans-serif", fontSize:'12px', color: form.template===t.id?PL:'rgba(255,255,255,0.5)', margin:'0 0 2px', letterSpacing:'0.06em' }}>{t.label}</p>
                  <p style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:'10px', color:'rgba(255,255,255,0.25)', margin:0 }}>{t.desc}</p>
                </button>
              ))}
            </div>
          </div>
          <Btn3D onClick={generate} disabled={generating||!form.track_id}><Sparkles size={14}/> {generating?'Generando...':'Generar'}</Btn3D>
        </div>
      </Card>
      {cards.length===0 && <Card><EmptyState icon={Image} text="Sin promo cards. Selecciona un track y genera tu primera card." /></Card>}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:'16px' }}>
        {cards.map((c,i)=><PromoPreview key={c.id||i} card={c} idx={i}/>)}
      </div>
    </PageShell>
  );
}

// ─── PLAYLISTS ────────────────────────────────────────────────────────────────
const PL_DEMO = [
  { id:1, name:'Trap Colombia 🇨🇴', curator:'IM Music Editorial', followers:'45.2K', genre:'Trap', mood:'Energético', accepts:true, platform:'Spotify' },
  { id:2, name:'New Urban Latin', curator:'Playlist Pro Network', followers:'128K', genre:'Reggaeton', mood:'Fiesta', accepts:true, platform:'Spotify' },
  { id:3, name:'R&B Vibes LATAM', curator:'Urban Curators', followers:'32.8K', genre:'R&B', mood:'Sensual', accepts:true, platform:'Apple Music' },
  { id:4, name:'Trap & Drill MX', curator:'TrapMX Official', followers:'89K', genre:'Trap', mood:'Oscuro', accepts:false, platform:'Spotify' },
  { id:5, name:'Pop Latino Rising', curator:'Latin Hits Network', followers:'215K', genre:'Pop Latino', mood:'Positivo', accepts:true, platform:'Spotify' },
  { id:6, name:'Afrobeats Colombia', curator:'Afro Sounds COL', followers:'18.4K', genre:'Afrobeats', mood:'Groove', accepts:true, platform:'Spotify' },
];

function PlaylistDiscover() {
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const GENRES = ['Todos','Trap','Reggaeton','R&B','Hip-Hop','Pop Latino','Electrónica'];
  useEffect(() => { apiFetch('/playlists').then(d => setPlaylists(Array.isArray(d) ? d : [])).catch(() => {}); }, []);
  const displayed = playlists.length > 0 ? playlists : PL_DEMO;
  const filtered = filter === 'all' ? displayed : displayed.filter((p: any) => p.genre === filter);
  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {GENRES.map(g => (
          <button key={g} onClick={() => setFilter(g === 'Todos' ? 'all' : g)}
            style={{ background: filter === (g === 'Todos' ? 'all' : g) ? 'rgba(94,23,235,0.3)' : 'rgba(255,255,255,0.04)', border: `1px solid ${filter === (g === 'Todos' ? 'all' : g) ? 'rgba(94,23,235,0.6)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 100, padding: '6px 14px', color: filter === (g === 'Todos' ? 'all' : g) ? '#C084FC' : 'rgba(255,255,255,0.45)', fontFamily: "'Space Grotesk',sans-serif", fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
            {g}
          </button>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
        {filtered.map((pl: any, i: number) => (
          <HoloCard key={pl.id || i} color="#5E17EB" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg,#5E17EB,#C084FC)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Play size={22} color="#fff" fill="#fff" />
              </div>
              <span style={{ background: pl.accepts ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', border: `1px solid ${pl.accepts ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`, borderRadius: 100, padding: '4px 10px', fontFamily: "'Space Grotesk',sans-serif", fontSize: 10, fontWeight: 700, color: pl.accepts ? '#22c55e' : '#ef4444' }}>
                {pl.accepts ? 'ACEPTA ENVÍOS' : 'CERRADA'}
              </span>
            </div>
            <h4 style={{ fontFamily: "'Anton',sans-serif", fontSize: 16, color: '#F2EDE5', margin: '0 0 4px' }}>{pl.name || pl.title}</h4>
            <p style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: '0 0 12px' }}>{pl.curator || pl.owner || 'Curador'}</p>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>👥 {typeof pl.followers === 'number' ? pl.followers.toLocaleString() : pl.followers}</span>
              <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>🎵 {pl.genre}</span>
              {pl.mood && <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>🎭 {pl.mood}</span>}
            </div>
            {pl.accepts && (
              <Btn3D small fullWidth onClick={() => toast(`Enviando track a ${pl.name}...`, 'info')}>
                ENVIAR TRACK →
              </Btn3D>
            )}
          </HoloCard>
        ))}
      </div>
    </div>
  );
}

function PlaylistSubmitTab() {
  const [tracks, setTracks] = useState<any[]>([]);
  const [selectedTrack, setSelectedTrack] = useState('');
  const [message, setMessage] = useState('');
  useEffect(() => { apiFetch('/tracks').then(d => setTracks(Array.isArray(d) ? d : [])).catch(() => {}); }, []);
  return (
    <HoloCard color="#5E17EB" style={{ padding: 32 }}>
      <h3 style={{ fontFamily: "'Anton',sans-serif", fontSize: 20, color: '#F2EDE5', margin: '0 0 8px' }}>ENVIAR TRACK A PLAYLISTS</h3>
      <p style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 14, color: 'rgba(255,255,255,0.4)', margin: '0 0 24px' }}>
        Selecciona el track que quieres enviar a curadores de playlists editoriales.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 11, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.15em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Track a enviar</label>
          <select value={selectedTrack} onChange={e => setSelectedTrack(e.target.value)} style={{ ...IS }}>
            <option value="">Selecciona un track</option>
            {tracks.map((t: any) => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 11, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.15em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Mensaje al curador (opcional)</label>
          <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Cuéntale al curador sobre tu música..."
            style={{ ...IS, resize: 'vertical' as any, minHeight: 100, boxSizing: 'border-box' as any }} />
        </div>
        <Btn3D onClick={() => toast('Envío registrado. El curador revisará tu track.', 'success')} disabled={!selectedTrack}>
          ENVIAR A PLAYLISTS SELECCIONADAS →
        </Btn3D>
      </div>
    </HoloCard>
  );
}

function PlaylistHistory() {
  return (
    <HoloCard color="#5E17EB" style={{ padding: 28 }}>
      <h3 style={{ fontFamily: "'Anton',sans-serif", fontSize: 16, color: '#F2EDE5', margin: '0 0 16px' }}>HISTORIAL DE ENVÍOS</h3>
      <p style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.25)', textAlign: 'center', padding: '20px 0' }}>
        Tus envíos a playlists aparecerán aquí con su estado: pendiente, aceptado o rechazado.
      </p>
    </HoloCard>
  );
}

const PL_TABS = [
  { id: 'discover' as const, label: '🔍 Descubrir Playlists', icon: Globe },
  { id: 'submit' as const, label: '📤 Enviar Track', icon: Send },
  { id: 'history' as const, label: '📋 Mis Envíos', icon: BarChart3 },
];

function PlaylistsPage() {
  const [tab, setTab] = useState<'discover' | 'submit' | 'history'>('discover');
  return (
    <PageShell title="Playlists & Discovery">
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'rgba(255,255,255,0.03)', borderRadius: 14, padding: 4 }}>
        {PL_TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', background: tab === t.id ? 'rgba(94,23,235,0.25)' : 'transparent', color: tab === t.id ? '#C084FC' : 'rgba(255,255,255,0.35)', fontFamily: "'Space Grotesk',sans-serif", fontSize: 11, fontWeight: 700, transition: 'all 0.2s' }}>
            <t.icon size={13} />{t.label}
          </button>
        ))}
      </div>
      {tab === 'discover' && <PlaylistDiscover />}
      {tab === 'submit' && <PlaylistSubmitTab />}
      {tab === 'history' && <PlaylistHistory />}
    </PageShell>
  );
}

// ─── LEGAL IA ─────────────────────────────────────────────────────────────────
function LegalPage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState('');
  const [history, setHistory] = useState<{q:string;a:string;date:string}[]>([]);
  const EXAMPLES = ['¿Cómo protege la Ley 23 de 1982 mis derechos de autor en Colombia?','¿Qué es un split de regalías?','¿Cómo registro mi música ante la DNDA?','Revisar contrato discográfico colombiano','¿Puedo usar samples bajo la ley colombiana?','¿Qué derechos me otorga el Decreto 1360 de 1989?'];
  const consult = async (q?: string) => {
    const text = q || query; if (!text.trim()) return;
    setQuery(text); setLoading(true); setResponse('');
    try {
      const d = await apiFetch('/legal-agent/consulta', { method:'POST', body: JSON.stringify({ consulta: text }) });
      const ans = d.respuesta || d.response || d.message || 'Sin respuesta del agente.';
      setResponse(ans);
      setHistory(h=>[{ q: text, a: ans, date: new Date().toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit'}) }, ...h.slice(0,9)]);
    } catch(e:any) {
      setResponse(`No se pudo conectar al agente legal. ${e.message}`);
    }
    setLoading(false);
  };
  return (
    <PageShell title="Legal IA">
      <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:'20px', alignItems:'start' }}>
        <div>
          {/* Examples */}
          <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', marginBottom:'14px' }}>
            {EXAMPLES.map(ex=>(
              <button key={ex} onClick={()=>consult(ex)} style={{ background:'rgba(94,23,235,0.1)', border:'1px solid rgba(94,23,235,0.25)', borderRadius:'100px', padding:'6px 14px', color:PL, fontSize:'11px', fontFamily:"'Space Grotesk',sans-serif", cursor:'pointer', transition:'all 0.2s', whiteSpace:'nowrap' }}
                onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.background='rgba(94,23,235,0.2)';}}
                onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.background='rgba(94,23,235,0.1)';}}>
                {ex}
              </button>
            ))}
          </div>
          {/* Input */}
          <Card style={{ marginBottom:'16px' }}>
            <textarea value={query} onChange={e=>setQuery(e.target.value)} placeholder="Escribe tu consulta legal... (ej: ¿Cómo protejo mis derechos de autor en Colombia?)"
              style={{...IS, resize:'vertical', minHeight:'100px', marginBottom:'12px', lineHeight:1.6}}
              onKeyDown={e=>{ if(e.key==='Enter'&&e.ctrlKey) consult(); }}/>
            <div style={{ display:'flex', gap:'10px', alignItems:'center' }}>
              <Btn3D onClick={()=>consult()} disabled={loading||!query.trim()}><Scale size={14}/> {loading?'Consultando...':'Consultar a la IA'}</Btn3D>
              {query && <Btn3D small variant="ghost" onClick={()=>setQuery('')}>Limpiar</Btn3D>}
              <span style={{ color:'rgba(255,255,255,0.2)', fontSize:'11px', fontFamily:"'Space Grotesk',sans-serif", marginLeft:'auto' }}>Ctrl+Enter para enviar</span>
            </div>
          </Card>
          {/* Response */}
          {(loading || response) && (
            <Card style={{ marginBottom:'16px' }}>
              {loading && (
                <div style={{ display:'flex', gap:'5px', alignItems:'center', marginBottom:'12px' }}>
                  {[0,1,2].map(i=><div key={i} style={{ width:'8px', height:'8px', background:PL, borderRadius:'50%', animation:`bounce 1.2s ease-in-out ${i*0.15}s infinite` }}/>)}
                  <span style={{ color:'rgba(255,255,255,0.3)', fontSize:'12px', fontFamily:"'Space Grotesk',sans-serif", marginLeft:'8px' }}>El agente está analizando...</span>
                </div>
              )}
              {response && (
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'12px' }}>
                    <div style={{ width:'28px', height:'28px', background:'rgba(94,23,235,0.2)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><Scale size={12} color={PL}/></div>
                    <span style={{ color:PL, fontSize:'11px', fontWeight:700, fontFamily:"'Space Grotesk',sans-serif", textTransform:'uppercase', letterSpacing:'0.1em' }}>Agente Legal IA</span>
                  </div>
                  <p style={{ color:'rgba(255,255,255,0.75)', fontSize:'14px', fontFamily:"'Space Grotesk',sans-serif", lineHeight:1.75, margin:0, whiteSpace:'pre-wrap' }}>{response}</p>
                </div>
              )}
            </Card>
          )}
          {/* Disclaimer */}
          <div style={{ background:'rgba(251,191,36,0.06)', border:'1px solid rgba(251,191,36,0.2)', borderRadius:'10px', padding:'12px 16px', display:'flex', gap:'10px', alignItems:'flex-start' }}>
            <span style={{ fontSize:'16px', flexShrink:0 }}>⚠️</span>
            <p style={{ color:'rgba(255,255,255,0.4)', fontSize:'12px', fontFamily:"'Space Grotesk',sans-serif", margin:0, lineHeight:1.6 }}>Esta herramienta es informativa y no reemplaza asesoría legal profesional. Para contratos importantes, consulta a un abogado especializado en propiedad intelectual.</p>
          </div>
        </div>
        {/* History sidebar */}
        <Card style={{ position:'sticky', top:'80px' }}>
          <h3 style={{ fontFamily:"'Anton',sans-serif", fontSize:'12px', color:'#fff', letterSpacing:'0.08em', margin:'0 0 12px' }}>CONSULTAS RECIENTES</h3>
          {history.length===0 && <p style={{ color:'rgba(255,255,255,0.2)', fontSize:'12px', fontFamily:"'Space Grotesk',sans-serif" }}>Sin consultas aún.</p>}
          {history.map((h,i)=>(
            <div key={i} onClick={()=>{setQuery(h.q);setResponse(h.a);}} style={{ padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,0.04)', cursor:'pointer' }}>
              <p style={{ color:'rgba(255,255,255,0.6)', fontSize:'12px', fontFamily:"'Space Grotesk',sans-serif", margin:'0 0 2px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{h.q}</p>
              <span style={{ color:'rgba(255,255,255,0.2)', fontSize:'10px', fontFamily:"'Space Grotesk',sans-serif" }}>{h.date}</span>
            </div>
          ))}
        </Card>
      </div>
    </PageShell>
  );
}

// ─── FINANCING ────────────────────────────────────────────────────────────────
function FinancingPage() {
  const [eligibility, setEligibility] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [form, setForm] = useState({ amount:'', purpose:'', contact:'' });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  useEffect(() => {
    apiFetch('/financing/eligibility').then(setEligibility).catch(()=>setEligibility({ eligible: false, reason:'Sin suficiente historial de streaming' }));
    apiFetch('/financing/solicitud').then(d=>setApplications(Array.isArray(d)?d:[])).catch(()=>{});
  }, []);
  const apply = async () => {
    if (!form.amount||!form.purpose) return; setLoading(true);
    try {
      const d = await apiFetch('/financing/solicitud', { method:'POST', body: JSON.stringify(form) });
      setApplications(a=>[d,...a]); setSubmitted(true); setForm({ amount:'', purpose:'', contact:'' });
    } catch { setSubmitted(true); setApplications(a=>[{ id:Date.now(), amount:form.amount, purpose:form.purpose, status:'Pendiente', created_at: new Date().toISOString() },...a]); setForm({ amount:'', purpose:'', contact:'' }); }
    setLoading(false);
  };
  const statusColor: Record<string,string> = { Pendiente:'#f59e0b', 'En revisión':'#3b82f6', Aprobado:'#22c55e', Rechazado:'#ef4444' };
  const STEPS = [
    { n:'1', title:'Verifica tu elegibilidad', desc:'Analizamos tu historial de streams y regalías para determinar el monto máximo de adelanto.' },
    { n:'2', title:'Solicita tu adelanto', desc:'Completa el formulario indicando el monto que necesitas y el propósito del financiamiento.' },
    { n:'3', title:'Recibe tu dinero', desc:'Una vez aprobado, recibes el adelanto en tu cuenta bancaria en 24-48 horas.' },
  ];
  return (
    <PageShell title="Financiamiento">
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px', marginBottom:'24px' }}>
        {/* Eligibility */}
        <Card style={{ background: eligibility?.eligible ? 'linear-gradient(135deg,rgba(34,197,94,0.08),rgba(34,197,94,0.04))' : 'rgba(255,255,255,0.03)', border:`1px solid ${eligibility?.eligible?'rgba(34,197,94,0.3)':'rgba(255,255,255,0.07)'}` }}>
          <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'16px' }}>
            <div style={{ width:'48px', height:'48px', background: eligibility?.eligible?'rgba(34,197,94,0.15)':'rgba(255,255,255,0.06)', borderRadius:'14px', display:'flex', alignItems:'center', justifyContent:'center' }}>
              {eligibility?.eligible ? <Check size={22} color="#22c55e"/> : <Clock size={22} color="rgba(255,255,255,0.3)"/>}
            </div>
            <div>
              <p style={{ fontFamily:"'Anton',sans-serif", fontSize:'16px', color: eligibility?.eligible?'#22c55e':'rgba(255,255,255,0.5)', margin:'0 0 2px' }}>{eligibility?.eligible?'ELEGIBLE':'AÚN NO ELEGIBLE'}</p>
              <p style={{ color:'rgba(255,255,255,0.3)', fontSize:'11px', fontFamily:"'Space Grotesk',sans-serif", margin:0 }}>{eligibility?.reason||'Verificando...'}</p>
            </div>
          </div>
          {eligibility?.eligible && eligibility?.max_amount && (
            <div style={{ background:'rgba(34,197,94,0.08)', borderRadius:'10px', padding:'14px' }}>
              <p style={{ color:'rgba(255,255,255,0.4)', fontSize:'10px', fontFamily:"'Space Grotesk',sans-serif", textTransform:'uppercase', letterSpacing:'0.1em', margin:'0 0 4px' }}>ADELANTO MÁXIMO ESTIMADO</p>
              <p style={{ fontFamily:"'Anton',sans-serif", fontSize:'28px', color:'#22c55e', margin:0 }}>${Number(eligibility.max_amount).toLocaleString()} <span style={{ fontSize:'14px', color:'rgba(255,255,255,0.3)', fontFamily:"'Space Grotesk',sans-serif" }}>COP</span></p>
            </div>
          )}
        </Card>
        {/* Application form */}
        <Card>
          <h3 style={{ fontFamily:"'Anton',sans-serif", fontSize:'13px', color:'#fff', letterSpacing:'0.06em', margin:'0 0 14px' }}>SOLICITAR ADELANTO</h3>
          {submitted && <div style={{ background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.3)', borderRadius:'8px', padding:'10px 14px', marginBottom:'12px', color:'#22c55e', fontSize:'12px', fontFamily:"'Space Grotesk',sans-serif" }}>✓ Solicitud enviada. Te contactaremos pronto.</div>}
          <div style={{ display:'flex', flexDirection:'column', gap:'10px', marginBottom:'12px' }}>
            <div>
              <p style={{ color:'rgba(255,255,255,0.35)', fontSize:'10px', fontFamily:"'Space Grotesk',sans-serif", textTransform:'uppercase', letterSpacing:'0.1em', margin:'0 0 5px' }}>Monto solicitado (COP)</p>
              <input style={IS} type="number" placeholder="ej: 500000" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))}/>
            </div>
            <div>
              <p style={{ color:'rgba(255,255,255,0.35)', fontSize:'10px', fontFamily:"'Space Grotesk',sans-serif", textTransform:'uppercase', letterSpacing:'0.1em', margin:'0 0 5px' }}>Propósito</p>
              <select style={IS} value={form.purpose} onChange={e=>setForm(f=>({...f,purpose:e.target.value}))}>
                <option value="">Selecciona...</option>
                <option value="produccion">Producción musical</option>
                <option value="marketing">Campaña de marketing</option>
                <option value="equipo">Compra de equipo</option>
                <option value="gira">Gira / Shows</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div>
              <p style={{ color:'rgba(255,255,255,0.35)', fontSize:'10px', fontFamily:"'Space Grotesk',sans-serif", textTransform:'uppercase', letterSpacing:'0.1em', margin:'0 0 5px' }}>Teléfono de contacto</p>
              <input style={IS} placeholder="+57 300 000 0000" value={form.contact} onChange={e=>setForm(f=>({...f,contact:e.target.value}))}/>
            </div>
          </div>
          <Btn3D small onClick={apply} disabled={loading||!form.amount||!form.purpose}>{loading?'Enviando...':'Solicitar adelanto'}</Btn3D>
        </Card>
      </div>
      {/* Applications tracker */}
      {applications.length>0 && <Card style={{ marginBottom:'24px' }}>
        <h3 style={{ fontFamily:"'Anton',sans-serif", fontSize:'13px', color:'#fff', letterSpacing:'0.06em', margin:'0 0 14px' }}>MIS SOLICITUDES</h3>
        {applications.map((a,i)=>(
          <div key={a.id||i} style={{ display:'flex', alignItems:'center', gap:'14px', padding:'12px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ flex:1 }}>
              <p style={{ color:'#fff', fontSize:'13px', fontWeight:600, margin:'0 0 2px', fontFamily:"'Space Grotesk',sans-serif" }}>${Number(a.amount).toLocaleString()} COP — {a.purpose}</p>
              <p style={{ color:'rgba(255,255,255,0.3)', fontSize:'11px', margin:0, fontFamily:"'Space Grotesk',sans-serif" }}>{a.created_at?new Date(a.created_at).toLocaleDateString('es-CO'):'Hoy'}</p>
            </div>
            <Badge color={statusColor[a.status]||'#71717a'} label={a.status||'Pendiente'}/>
          </div>
        ))}
      </Card>}
      {/* How it works */}
      <h3 style={{ fontFamily:"'Anton',sans-serif", fontSize:'16px', color:'#fff', letterSpacing:'0.04em', margin:'0 0 16px' }}>¿CÓMO FUNCIONA?</h3>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'16px' }}>
        {STEPS.map(s=>(
          <Card key={s.n}>
            <div style={{ width:'36px', height:'36px', background:`linear-gradient(135deg,${P},${PL})`, borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'14px', boxShadow:`0 0 20px rgba(94,23,235,0.3)` }}>
              <span style={{ fontFamily:"'Anton',sans-serif", fontSize:'16px', color:'#fff' }}>{s.n}</span>
            </div>
            <h4 style={{ fontFamily:"'Anton',sans-serif", fontSize:'14px', color:'#fff', margin:'0 0 8px', letterSpacing:'0.03em' }}>{s.title}</h4>
            <p style={{ color:'rgba(255,255,255,0.4)', fontSize:'12px', fontFamily:"'Space Grotesk',sans-serif", margin:0, lineHeight:1.6 }}>{s.desc}</p>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}

// ─── SETTINGS (improved) ──────────────────────────────────────────────────────
function SettingsPage({ user }: { user: any }) {
  const [profile, setProfile] = useState({ name: user?.name||'', email: user?.email||'', bio:'' });
  const [pw, setPw] = useState({ current:'', next:'', confirm:'' });
  const [saving, setSaving] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [notifs, setNotifs] = useState({ royalties:true, releases:true, community:false, marketing:true, legal:false });
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const flash = (m: string) => { setMsg(m); setTimeout(()=>setMsg(''),3500); };
  const saveProfile = async () => {
    setSaving(true);
    try { await apiFetch('/auth/profile', { method:'PUT', body: JSON.stringify(profile) }); flash('Perfil guardado ✓'); } catch(e:any) { flash(e.message); }
    setSaving(false);
  };
  const savePassword = async () => {
    if (pw.next!==pw.confirm) { flash('Las contraseñas no coinciden'); return; }
    if (pw.next.length<6) { flash('La contraseña debe tener mínimo 6 caracteres'); return; }
    setPwSaving(true);
    try { await apiFetch('/auth/profile', { method:'PUT', body: JSON.stringify({ password: pw.next, currentPassword: pw.current }) }); flash('Contraseña actualizada ✓'); setPw({ current:'', next:'', confirm:'' }); } catch(e:any) { flash(e.message); }
    setPwSaving(false);
  };
  const deleteAccount = async () => {
    try { await apiFetch('/auth/profile', { method:'DELETE' }); localStorage.removeItem('im_token'); window.location.reload(); } catch(e:any) { flash(e.message); setDeleteConfirm(false); }
  };
  const INTEGRATIONS = [
    { name:'Spotify for Artists', color:'#1DB954' },
    { name:'Apple Music Connect', color:'#FC3C44' },
    { name:'YouTube Studio', color:'#FF0000' },
    { name:'Instagram', color:'#E1306C' },
  ];
  const NOTIF_LABELS: Record<string,string> = { royalties:'Pagos y regalías', releases:'Lanzamientos programados', community:'Mensajes de comunidad', marketing:'Reportes de marketing', legal:'Consultas legales' };
  const Toggle = ({ k }: { k: keyof typeof notifs }) => (
    <button onClick={()=>setNotifs(n=>({...n,[k]:!n[k]}))} style={{ background:'none', border:'none', cursor:'pointer', padding:0 }}>
      {notifs[k] ? <ToggleRight size={28} color="#22c55e"/> : <ToggleLeft size={28} color="rgba(255,255,255,0.2)"/>}
    </button>
  );
  return (
    <PageShell title="Ajustes">
      {msg && <div style={{ background: msg.includes('✓')?'rgba(34,197,94,0.1)':'rgba(239,68,68,0.1)', border:`1px solid ${msg.includes('✓')?'rgba(34,197,94,0.3)':'rgba(239,68,68,0.3)'}`, borderRadius:'10px', padding:'10px 16px', marginBottom:'16px', color: msg.includes('✓')?'#22c55e':'#f87171', fontSize:'13px', fontFamily:"'Space Grotesk',sans-serif" }}>{msg}</div>}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px' }}>
        {/* Left column */}
        <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
          {/* Profile */}
          <Card>
            <h3 style={{ fontFamily:"'Anton',sans-serif", fontSize:'14px', color:'#fff', letterSpacing:'0.06em', margin:'0 0 16px' }}>PERFIL</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:'12px', marginBottom:'14px' }}>
              {([['Nombre artístico','name','text'],['Email','email','email'],['Bio / descripción','bio','text']] as const).map(([label,key,type])=>(
                <div key={key}>
                  <p style={{ color:'rgba(255,255,255,0.35)', fontSize:'10px', fontFamily:"'Space Grotesk',sans-serif", margin:'0 0 5px', textTransform:'uppercase', letterSpacing:'0.1em' }}>{label}</p>
                  {key==='bio'
                    ? <textarea style={{...IS,resize:'vertical',minHeight:'72px'}} value={(profile as any)[key]} onChange={e=>setProfile(p=>({...p,[key]:e.target.value}))} placeholder="Cuéntanos sobre ti como artista..."/>
                    : <input style={IS} type={type} value={(profile as any)[key]} onChange={e=>setProfile(p=>({...p,[key]:e.target.value}))}/>
                  }
                </div>
              ))}
            </div>
            <Btn3D small onClick={saveProfile} disabled={saving}>{saving?'Guardando...':'Guardar perfil'}</Btn3D>
          </Card>
          {/* Password */}
          <Card>
            <h3 style={{ fontFamily:"'Anton',sans-serif", fontSize:'14px', color:'#fff', letterSpacing:'0.06em', margin:'0 0 16px' }}>CAMBIAR CONTRASEÑA</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:'10px', marginBottom:'14px' }}>
              {[['Contraseña actual','current'],['Nueva contraseña','next'],['Confirmar contraseña','confirm']].map(([ph,k])=>(
                <input key={k} style={IS} type="password" placeholder={ph} value={(pw as any)[k]} onChange={e=>setPw(p=>({...p,[k]:e.target.value}))}/>
              ))}
            </div>
            <Btn3D small onClick={savePassword} disabled={pwSaving}>{pwSaving?'Actualizando...':'Actualizar contraseña'}</Btn3D>
          </Card>
          {/* Danger zone */}
          <Card style={{ border:'1px solid rgba(239,68,68,0.2)', background:'rgba(239,68,68,0.04)' }}>
            <h3 style={{ fontFamily:"'Anton',sans-serif", fontSize:'14px', color:'#ef4444', letterSpacing:'0.06em', margin:'0 0 10px' }}>ZONA DE PELIGRO</h3>
            <p style={{ color:'rgba(255,255,255,0.35)', fontSize:'12px', fontFamily:"'Space Grotesk',sans-serif", margin:'0 0 14px', lineHeight:1.6 }}>Eliminar tu cuenta borrará permanentemente todos tus datos, tracks y regalías. Esta acción no se puede deshacer.</p>
            {!deleteConfirm
              ? <Btn3D small variant="danger" onClick={()=>setDeleteConfirm(true)}>Eliminar cuenta</Btn3D>
              : <div style={{ display:'flex', gap:'10px', alignItems:'center' }}>
                  <span style={{ color:'#f87171', fontSize:'12px', fontFamily:"'Space Grotesk',sans-serif" }}>¿Estás seguro?</span>
                  <Btn3D small variant="danger" onClick={deleteAccount}>Sí, eliminar</Btn3D>
                  <Btn3D small variant="ghost" onClick={()=>setDeleteConfirm(false)}>Cancelar</Btn3D>
                </div>
            }
          </Card>
        </div>
        {/* Right column */}
        <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
          {/* Plan */}
          <Card>
            <h3 style={{ fontFamily:"'Anton',sans-serif", fontSize:'14px', color:'#fff', letterSpacing:'0.06em', margin:'0 0 16px' }}>PLAN ACTUAL</h3>
            <div style={{ background:`linear-gradient(135deg,rgba(94,23,235,0.2),rgba(123,63,255,0.1))`, border:'1px solid rgba(94,23,235,0.4)', borderRadius:'14px', padding:'20px', marginBottom:'14px' }}>
              <p style={{ fontFamily:"'Anton',sans-serif", fontSize:'28px', color:PL, margin:'0 0 2px' }}>{(user?.plan||'INDIE').toUpperCase()}</p>
              <p style={{ color:'rgba(255,255,255,0.35)', fontSize:'12px', fontFamily:"'Space Grotesk',sans-serif", margin:'0 0 14px' }}>Tu plan actual · renovación mensual</p>
              <Btn3D small><Zap size={13}/> Actualizar plan</Btn3D>
            </div>
          </Card>
          {/* Notifications */}
          <Card>
            <h3 style={{ fontFamily:"'Anton',sans-serif", fontSize:'14px', color:'#fff', letterSpacing:'0.06em', margin:'0 0 16px' }}>NOTIFICACIONES</h3>
            {(Object.keys(notifs) as (keyof typeof notifs)[]).map(k=>(
              <div key={k} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                <p style={{ color:'rgba(255,255,255,0.65)', fontSize:'13px', fontFamily:"'Space Grotesk',sans-serif", margin:0 }}>{NOTIF_LABELS[k]}</p>
                <Toggle k={k}/>
              </div>
            ))}
          </Card>
          {/* Integrations */}
          <Card>
            <h3 style={{ fontFamily:"'Anton',sans-serif", fontSize:'14px', color:'#fff', letterSpacing:'0.06em', margin:'0 0 16px' }}>INTEGRACIONES</h3>
            {INTEGRATIONS.map(ig=>(
              <div key={ig.name} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ width:'32px', height:'32px', background:`${ig.color}20`, borderRadius:'9px', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, border:`1px solid ${ig.color}40` }}><Globe size={14} color={ig.color}/></div>
                <div style={{ flex:1 }}><p style={{ color:'#fff', fontSize:'13px', margin:0, fontFamily:"'Space Grotesk',sans-serif" }}>{ig.name}</p></div>
                <Btn3D small variant="ghost"><Link2 size={12}/> Conectar</Btn3D>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </PageShell>
  );
}

function GenericPage({ moduleId }: { moduleId: string }) {
  const mod = MODULES.find(m => m.id === moduleId);
  const Icon = mod?.icon || Zap;
  return (
    <PageShell title={mod?.label || moduleId}>
      <Card style={{ textAlign: 'center', padding: '64px 24px' }}>
        <div style={{ width: '64px', height: '64px', background: 'rgba(94,23,235,0.08)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}><Icon size={28} color="rgba(255,255,255,0.12)" /></div>
        <h2 style={{ fontFamily: "'Anton', sans-serif", fontSize: '20px', color: 'rgba(255,255,255,0.18)', letterSpacing: '0.05em', margin: '0 0 8px' }}>MÓDULO EN CONSTRUCCIÓN</h2>
        <p style={{ color: 'rgba(255,255,255,0.12)', fontSize: '13px', margin: 0, fontFamily: "'Space Grotesk', sans-serif" }}>Disponible próximamente</p>
      </Card>
    </PageShell>
  );
}

// ─── LEGAL PAGES ──────────────────────────────────────────────────────────────
function LegalStaticPage({ title, onBack, children }: { title: string; onBack: () => void; children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: '#050308', color: '#F2EDE5', fontFamily: "'Space Grotesk', sans-serif" }}>
      <nav style={{ position: 'sticky', top: 0, padding: '16px 48px', background: 'rgba(5,3,8,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(94,23,235,0.15)', display: 'flex', alignItems: 'center', gap: '16px', zIndex: 10 }}>
        <button onClick={onBack} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', padding: '6px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontFamily: "'Space Grotesk', sans-serif" }}>← Volver</button>
        <span style={{ fontFamily: "'Anton', sans-serif", fontSize: '16px', letterSpacing: '0.1em', color: '#F2EDE5' }}>IM MUSIC</span>
      </nav>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '64px 32px' }}>
        <h1 style={{ fontFamily: "'Anton', sans-serif", fontSize: '36px', letterSpacing: '0.05em', marginBottom: '40px', color: '#F2EDE5' }}>{title}</h1>
        {children}
      </div>
    </div>
  );
}

function TermsPage({ onBack }: { onBack: () => void }) {
  const S = { color: 'rgba(255,255,255,0.7)', fontSize: '15px', lineHeight: 1.8, marginBottom: '24px' };
  const H = { fontFamily: "'Anton', sans-serif", fontSize: '18px', letterSpacing: '0.05em', margin: '32px 0 12px', color: '#F2EDE5' };
  return (
    <LegalStaticPage title="TÉRMINOS Y CONDICIONES" onBack={onBack}>
      <p style={S}>Última actualización: 12 de abril de 2026</p>
      <p style={S}>Bienvenido a IM Music. Al utilizar nuestra plataforma, aceptas estos Términos y Condiciones. Si no estás de acuerdo, por favor no uses el servicio.</p>
      <h2 style={H}>1. DESCRIPCIÓN DEL SERVICIO</h2>
      <p style={S}>IM Music es una plataforma de distribución musical digital que permite a artistas independientes distribuir su música en plataformas de streaming, gestionar regalías, registrar composiciones y acceder a herramientas de marketing.</p>
      <h2 style={H}>2. ELEGIBILIDAD</h2>
      <p style={S}>Debes tener al menos 18 años de edad o contar con el consentimiento de un tutor legal. Debes tener los derechos legales sobre el contenido que distribuyes a través de nuestra plataforma.</p>
      <h2 style={H}>3. DERECHOS DE PROPIEDAD INTELECTUAL</h2>
      <p style={S}>Mantienes todos los derechos sobre tu música. Al usar IM Music, nos otorgas una licencia no exclusiva para distribuir tu contenido en las plataformas seleccionadas. Garantizas que tienes los derechos para distribuir todo el contenido subido.</p>
      <h2 style={H}>4. REGALÍAS Y PAGOS</h2>
      <p style={S}>Las regalías se calculan según los reportes de las plataformas de distribución. IM Music retiene el porcentaje acordado según tu plan de suscripción. Los pagos se procesan mensualmente una vez que superes el umbral mínimo de pago.</p>
      <h2 style={H}>5. CONDUCTA PROHIBIDA</h2>
      <p style={S}>Está prohibido subir contenido que infrinja derechos de autor de terceros, contenido fraudulento, streams artificiales o cualquier práctica que viole las políticas de las plataformas de distribución.</p>
      <h2 style={H}>6. TERMINACIÓN</h2>
      <p style={S}>Nos reservamos el derecho de suspender o terminar tu cuenta si violas estos términos. Puedes cancelar tu cuenta en cualquier momento desde la configuración de tu perfil.</p>
      <h2 style={H}>7. LEY APLICABLE</h2>
      <p style={S}>Estos términos se rigen por las leyes de la República de Colombia. Cualquier disputa se resolverá ante los tribunales competentes de Bogotá D.C.</p>
      <h2 style={H}>8. CONTACTO</h2>
      <p style={S}>Para consultas legales: legal@immusic.co</p>
    </LegalStaticPage>
  );
}

function PrivacyPage({ onBack }: { onBack: () => void }) {
  const S = { color: 'rgba(255,255,255,0.7)', fontSize: '15px', lineHeight: 1.8, marginBottom: '24px' };
  const H = { fontFamily: "'Anton', sans-serif", fontSize: '18px', letterSpacing: '0.05em', margin: '32px 0 12px', color: '#F2EDE5' };
  return (
    <LegalStaticPage title="POLÍTICA DE PRIVACIDAD" onBack={onBack}>
      <p style={S}>Última actualización: 12 de abril de 2026</p>
      <p style={S}>IM Music se compromete a proteger tu privacidad de conformidad con la Ley 1581 de 2012 (Habeas Data) y el Decreto 1377 de 2013 de la República de Colombia.</p>
      <h2 style={H}>1. DATOS QUE RECOPILAMOS</h2>
      <p style={S}>Recopilamos: información de registro (nombre, email), información de pago (procesada por Wompi), datos de tu música y regalías, información de uso de la plataforma para mejorar el servicio.</p>
      <h2 style={H}>2. USO DE LA INFORMACIÓN</h2>
      <p style={S}>Usamos tus datos para: proveer y mejorar el servicio, procesar pagos, enviarte reportes de regalías, comunicarte sobre tu cuenta y servicios relevantes, cumplir obligaciones legales.</p>
      <h2 style={H}>3. COMPARTIR DATOS</h2>
      <p style={S}>Compartimos datos con: plataformas de distribución (Spotify, Apple Music, etc.) para cumplir el servicio, procesadores de pago (Wompi), proveedores de servicios tecnológicos bajo acuerdos de confidencialidad. No vendemos tus datos personales.</p>
      <h2 style={H}>4. SEGURIDAD</h2>
      <p style={S}>Implementamos medidas de seguridad técnicas y organizativas incluyendo encriptación SSL, autenticación JWT, y acceso restringido a datos sensibles.</p>
      <h2 style={H}>5. TUS DERECHOS</h2>
      <p style={S}>Tienes derecho a: conocer, actualizar y rectificar tu información personal; solicitar prueba de la autorización; ser informado sobre el uso de tus datos; presentar quejas ante la Superintendencia de Industria y Comercio.</p>
      <h2 style={H}>6. COOKIES</h2>
      <p style={S}>Usamos cookies esenciales para el funcionamiento de la plataforma y cookies analíticas para mejorar la experiencia. Puedes gestionar las cookies desde la configuración de tu navegador.</p>
      <h2 style={H}>7. CONTACTO</h2>
      <p style={S}>Para ejercer tus derechos o consultas de privacidad: privacidad@immusic.co</p>
    </LegalStaticPage>
  );
}

// ─── COOKIE CONSENT ───────────────────────────────────────────────────────────
function CookieConsent() {
  const [show, setShow] = useState(() => !localStorage.getItem('im_cookies'));
  if (!show) return null;
  return (
    <div style={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', zIndex: 9999, background: 'rgba(13,6,24,0.97)', border: '1px solid rgba(94,23,235,0.3)', borderRadius: '16px', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '20px', backdropFilter: 'blur(20px)', maxWidth: '600px', width: 'calc(100vw - 48px)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
      <p style={{ margin: 0, fontSize: '13px', fontFamily: "'Space Grotesk', sans-serif", color: 'rgba(255,255,255,0.65)', flex: 1, lineHeight: 1.5 }}>
        Usamos cookies esenciales para el funcionamiento de la plataforma. Al continuar, aceptas nuestra <span style={{ color: '#7B3FFF', cursor: 'pointer' }}>política de privacidad</span>.
      </p>
      <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
        <button onClick={() => { localStorage.setItem('im_cookies', '1'); setShow(false); }}
          style={{ background: 'linear-gradient(135deg,#5E17EB,#7B3FFF)', border: 'none', color: '#fff', padding: '8px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, whiteSpace: 'nowrap' }}>
          Aceptar
        </button>
        <button onClick={() => setShow(false)}
          style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontFamily: "'Space Grotesk', sans-serif", whiteSpace: 'nowrap' }}>
          Rechazar
        </button>
      </div>
    </div>
  );
}


// ─── ONBOARDING TOUR ─────────────────────────────────────────────────────────
const TOUR_STEPS = [
  { id:'welcome', title:'Bienvenido a IM Music 🎉', subtitle:'Tu plataforma musical completa', description:'Te guiaremos por cada función paso a paso. El tour toma 3 minutos y te explicará exactamente cómo usar cada herramienta.', icon:'🎵', page:null, tip:null, requiredFields:[] },
  { id:'catalog', title:'Paso 1: Sube tu música', subtitle:'Catálogo → Arrastra tu canción', description:'Arrastra un archivo .wav o .flac al área de subida. La IA extrae automáticamente: título, género, BPM, tonalidad. Verifica los metadatos antes de publicar — estos datos van directamente a Spotify, Apple Music y 150+ plataformas.', icon:'🎵', page:'catalog', tip:'⚡ Tip: Usa .wav 24-bit/44.1kHz para la mejor calidad en todas las plataformas.', requiredFields:['Título','Artista principal','Género','Tipo (Single/EP/Album)','Portada 3000x3000px','ISRC (opcional)'] },
  { id:'splits', title:'Paso 2: Divide las regalías', subtitle:'Splits → Agregar colaboradores', description:'Apenas subes una canción, define quién recibe qué. Agrega tu productor (ej: 30%), co-autor (ej: 20%), manager. Los pagos son automáticos cada mes. Sin contratos complicados.', icon:'💰', page:'splits', tip:'⚡ Tip: El 100% debe sumar entre todos. Tú decides cuánto queda para ti.', requiredFields:['Nombre del colaborador','Email para pagos','Porcentaje %','Rol (Productor/Co-autor/Letrista)','Tipo (Master/Publishing)'] },
  { id:'releases', title:'Paso 3: Programa el lanzamiento', subtitle:'Releases → Nuevo Release', description:'Define la fecha y hora exacta de tu lanzamiento. Selecciona las plataformas. IM Music envía tu música a Spotify, Apple Music, YouTube Music, TikTok y más. Se recomienda programar con 2-3 semanas de anticipación.', icon:'🚀', page:'releases', tip:'⚡ Tip: Lanza los viernes a las 12am para maximizar el algoritmo de Spotify.', requiredFields:['Título del release','Fecha de lanzamiento','Plataformas destino','Tipo de release','UPC (se genera automático)'] },
  { id:'royalties', title:'Paso 4: Monitorea tus regalías', subtitle:'Regalías → Dashboard de ingresos', description:'Aquí ves todo el dinero que genera tu música. Master (reproducciones en streaming) y Publishing (cuando alguien usa tu canción). Los pagos llegan 30-60 días después de cada mes reportado.', icon:'💵', page:'royalties', tip:'⚡ Tip: Las regalías de Publishing son separadas — asegúrate de registrar tus obras en SAYCO.', requiredFields:[] },
  { id:'marketing-suite', title:'Paso 5: Marketing con IA', subtitle:'Marketing Suite → Flujo completo', description:'Sigue el flujo de 6 pasos: Test de Arquetipo → Branding → Estudio de Mercado → Meta Ads → Plan de Contenidos → Kit de Lanzamiento. Cada paso usa IA para personalizar todo según tu música y público.', icon:'✨', page:'marketing-suite', tip:'⚡ Tip: Completa el test de arquetipo primero — define TODO lo demás.', requiredFields:['Test de arquetipo (5 preguntas)','Género musical','Tipo de artista'] },
  { id:'ai-chat', title:'Paso 6: Soporte 24/7', subtitle:'IA Chat → Pregunta cualquier cosa', description:'El asistente de IM Music responde dudas sobre la plataforma, distribución, regalías, contratos y marketing. También puedes reportar bugs o sugerir mejoras aquí.', icon:'🤖', page:'ai-chat', tip:'⚡ Tip: Pregunta "¿cómo subo mi música?" para ver el proceso completo.', requiredFields:[] },
  { id:'videos', title:'Paso 7: Videos & YouTube', subtitle:'Videos → Content ID + YouTube for Artists', description:'Gestiona tus videos musicales, activa Content ID para monetizar cuando alguien use tu audio en YouTube, y solicita verificación de YouTube for Artists para analytics avanzados.', icon:'🎬', page:'videos', tip:'⚡ Tip: El Content ID requiere plan PRO y puede tardar 2-4 semanas en activarse.', requiredFields:[] },
  { id:'marketplace', title:'Paso 8: Vende tus beats', subtitle:'Marketplace → Mi Tienda', description:'Si produces beats, súbelos aquí y véndelos directamente a otros artistas. IM Music cobra solo 5% de comisión. Tú recibes el 95%. También puedes comprar beats de otros productores.', icon:'🛒', page:'marketplace', tip:'⚡ Tip: Pon el BPM y tonalidad siempre — los artistas filtran por eso.', requiredFields:['Título del beat','Género','BPM','Tonalidad','Precio en COP'] },
  { id:'done', title:'¡Ya sabes todo! 🏆', subtitle:'Empieza por subir tu primera canción', description:'Recuerda el flujo: Subir canción → Configurar splits → Programar release → Monitorear regalías → Marketing. Si tienes dudas, el IA Chat está disponible 24/7.', icon:'🏆', page:'catalog', tip:null, requiredFields:[] },
];

function OnboardingTour({ onComplete, onNav }: { onComplete: () => void; onNav: (page: string) => void }) {
  const [step, setStep] = useState(0);
  const current = TOUR_STEPS[step];
  const isLast = step === TOUR_STEPS.length - 1;

  const goNext = () => {
    if (current.page) onNav(current.page);
    if (isLast) { localStorage.setItem('im_tour_done', '1'); onComplete(); }
    else { setStep(s => s + 1); }
  };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:99999, background:'rgba(0,0,0,0.88)', backdropFilter:'blur(24px)', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ background:'rgba(12,8,20,0.98)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:28, padding:'40px 44px', maxWidth:560, width:'100%', boxShadow:'0 40px 80px rgba(0,0,0,0.7)' }}>
        {/* Progress bar */}
        <div style={{ display:'flex', gap:4, marginBottom:32 }}>
          {TOUR_STEPS.map((_,i) => (
            <div key={i} style={{ flex:1, height:3, borderRadius:2, background: i < step ? '#5E17EB' : i === step ? '#7B3FFF' : 'rgba(255,255,255,0.08)', transition:'all 0.3s ease' }} />
          ))}
        </div>
        {/* Icon */}
        <div style={{ fontSize:52, marginBottom:20, textAlign:'center' }}>{current.icon}</div>
        {/* Step counter */}
        <p style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:11, fontWeight:700, color:'rgba(94,23,235,0.8)', textTransform:'uppercase', letterSpacing:'0.15em', textAlign:'center', margin:'0 0 8px' }}>
          {step === 0 ? 'BIENVENIDA' : isLast ? 'LISTO' : `FUNCIÓN ${step} DE ${TOUR_STEPS.length-2}`}
        </p>
        {/* Title */}
        <h2 style={{ fontFamily:"'-apple-system','Space Grotesk',sans-serif", fontSize:24, fontWeight:700, color:'#F5F5F7', textAlign:'center', margin:'0 0 6px', letterSpacing:'-0.02em' }}>{current.title}</h2>
        {/* Subtitle */}
        <p style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:12, fontWeight:600, color:'#5E17EB', textAlign:'center', margin:'0 0 16px', textTransform:'uppercase', letterSpacing:'0.1em' }}>{current.subtitle}</p>
        {/* Description */}
        <p style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:14, color:'rgba(255,255,255,0.55)', lineHeight:1.75, margin:'0 0 16px', textAlign:'center' }}>{current.description}</p>
        {/* Required fields */}
        {current.requiredFields.length > 0 && (
          <div style={{ background:'rgba(94,23,235,0.08)', border:'1px solid rgba(94,23,235,0.2)', borderRadius:14, padding:'14px 18px', marginBottom:16 }}>
            <p style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:11, fontWeight:700, color:'rgba(94,23,235,0.8)', textTransform:'uppercase', letterSpacing:'0.1em', margin:'0 0 10px' }}>📋 DATOS REQUERIDOS POR LAS PLATAFORMAS:</p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {current.requiredFields.map((f,i) => (
                <span key={i} style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:100, padding:'4px 10px', fontFamily:"'Space Grotesk',sans-serif", fontSize:11, color:'rgba(255,255,255,0.6)' }}>{f}</span>
              ))}
            </div>
          </div>
        )}
        {/* Tip */}
        {current.tip && (
          <div style={{ background:'rgba(48,209,88,0.08)', border:'1px solid rgba(48,209,88,0.2)', borderRadius:12, padding:'10px 14px', marginBottom:20 }}>
            <p style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:12, color:'rgba(48,209,88,0.8)', margin:0 }}>{current.tip}</p>
          </div>
        )}
        {/* Buttons */}
        <div style={{ display:'flex', gap:10, justifyContent:'center', marginTop:24 }}>
          {step > 0 && <AppleBtn variant="ghost" small onClick={() => setStep(s => s - 1)}>← Atrás</AppleBtn>}
          <AppleBtn onClick={goNext}>{isLast ? 'EMPEZAR AHORA 🚀' : step === 0 ? 'INICIAR TOUR →' : 'SIGUIENTE →'}</AppleBtn>
        </div>
        {/* Skip */}
        {!isLast && (
          <button onClick={() => { localStorage.setItem('im_tour_done','1'); onComplete(); }}
            style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.18)', fontFamily:"'Space Grotesk',sans-serif", fontSize:12, marginTop:16, display:'block', width:'100%', textAlign:'center' }}>
            Saltar tour
          </button>
        )}
      </div>
    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
type Screen = 'landing' | 'login' | 'app' | 'terms' | 'privacy';

export default function App() {
  const [screen, setScreen] = useState<Screen>(() => {
    try {
      const t = localStorage.getItem('im_token');
      if (!t) return 'landing';
      const payload = JSON.parse(atob(t.split('.')[1]));
      if (payload.exp && payload.exp * 1000 < Date.now()) { localStorage.removeItem('im_token'); return 'landing'; }
      return 'app';
    } catch { return 'landing'; }
  });
  const [user, setUser] = useState<any>(() => {
    try {
      const t = localStorage.getItem('im_token');
      if (!t) return null;
      return JSON.parse(atob(t.split('.')[1]));
    } catch { return null; }
  });
  const [activePage, setActivePage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [lang, setLang] = useState<Lang>(() => (localStorage.getItem('im_lang') as Lang) || 'es');
  const [showTour, setShowTour] = useState(() => !localStorage.getItem('im_tour_done'));

  const handleLogin = (u: any) => { setUser(u); setScreen('app'); };
  const handleLogout = () => { localStorage.removeItem('im_token'); setUser(null); setScreen('landing'); };

  if (screen === 'terms') return <LangContext.Provider value={{ lang, setLang }}><TermsPage onBack={() => setScreen('landing')} /><CookieConsent /></LangContext.Provider>;
  if (screen === 'privacy') return <LangContext.Provider value={{ lang, setLang }}><PrivacyPage onBack={() => setScreen('landing')} /><CookieConsent /></LangContext.Provider>;
  if (screen === 'landing') return <LangContext.Provider value={{ lang, setLang }}><LandingPage onEnter={() => setScreen('login')} onNav={(s: Screen) => setScreen(s)} /><CookieConsent /></LangContext.Provider>;
  if (screen === 'login') return <LangContext.Provider value={{ lang, setLang }}><LoginPage onLogin={handleLogin} onBack={() => setScreen('landing')} /><CookieConsent /></LangContext.Provider>;

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':       return <DashboardPage onNav={setActivePage} />;
      case 'catalog':         return <CatalogPage />;
      case 'royalties':       return <RoyaltiesPage />;
      case 'ai-chat':         return <AIChatPage />;
      case 'releases':        return <ReleasesPage />;
      case 'videos':          return <VideosPage />;
      case 'marketing-suite': return <MarketingSuitePage />;
      case 'community':       return <CommunityPage />;
      case 'marketplace':     return <MarketplacePage />;
      case 'playlists':       return <PlaylistsPage />;
      case 'splits':          return <CatalogPage initialTab="splits" />;
      case 'store-maximizer': return <StoreMaximizerPage />;
      case 'label':           return <LabelPage />;
      case 'team':            return <TeamPage />;
      case 'stats':           return <StatsPage />;
      case 'feedback':        return <FeedbackPage />;
      case 'settings':        return <SettingsPage user={user} />;
      case 'legal':           return <LegalPage />;
      case 'financing':       return <FinancingPage />;
      default:                return <GenericPage moduleId={activePage} />;
    }
  };

  return (
    <LangContext.Provider value={{ lang, setLang }}>
    <div style={{ minHeight: '100vh', background: '#050308' }}>
      {/* Fixed grid pattern */}
      <div style={{ position: 'fixed', inset: 0, backgroundImage: `linear-gradient(rgba(94,23,235,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(94,23,235,0.025) 1px, transparent 1px)`, backgroundSize: '52px 52px', pointerEvents: 'none', zIndex: 0 }} />
      {/* Global ambient orbs */}
      <div style={{ position: 'fixed', top: '-300px', right: '-200px', width: '700px', height: '700px', background: `radial-gradient(circle, rgba(94,23,235,0.06) 0%, transparent 65%)`, pointerEvents: 'none', zIndex: 0, animation: 'orbFloat 20s ease-in-out infinite' }} />
      <div style={{ position: 'fixed', bottom: '-200px', left: `${SIDEBAR_W - 100}px`, width: '500px', height: '500px', background: `radial-gradient(circle, rgba(123,63,255,0.04) 0%, transparent 65%)`, pointerEvents: 'none', zIndex: 0, animation: 'orbFloat 26s ease-in-out infinite reverse' }} />

      <CursorTrail />
      <ToastContainer />
      {screen === 'app' && showTour && (
        <OnboardingTour onComplete={() => setShowTour(false)} onNav={(page) => { setActivePage(page); setShowTour(false); }} />
      )}
      <Sidebar active={activePage} onNav={setActivePage} user={user} onLogout={handleLogout} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="dashboard-main">
        {/* Top bar */}
        <div style={{ position: 'sticky', top: 0, height: '56px', background: 'rgba(5,3,8,0.88)', backdropFilter: 'blur(24px) saturate(160%)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Hamburger — visible on mobile only */}
            <button className="dash-hamburger" onClick={() => setSidebarOpen(o => !o)}
              style={{ width:'36px', height:'36px', display:'none', alignItems:'center', justifyContent:'center', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'10px', cursor:'pointer', flexDirection:'column', gap:'5px', padding:'8px' }}>
              {[0,1,2].map(i => <div key={i} style={{ width:'18px', height:'2px', background:'rgba(255,255,255,0.7)', borderRadius:'2px' }} />)}
            </button>
            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '11px', fontFamily: "'Space Grotesk',sans-serif", letterSpacing: '0.06em' }}>IM MUSIC</span>
            <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: '11px' }}>/</span>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '13px', fontWeight: 600, letterSpacing: '0.03em', color: 'rgba(255,255,255,0.55)' }}>
              {MODULES.find(m => m.id === activePage)?.label || 'Dashboard'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <LangToggleButton />
            <button onClick={() => toast('Sin notificaciones nuevas', 'info')} style={{ width:'36px', height:'36px', display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'10px', cursor:'pointer', backdropFilter:'blur(12px)', transition:'all 0.2s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background='rgba(94,23,235,0.12)'; (e.currentTarget as HTMLElement).style.borderColor='rgba(94,23,235,0.3)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.05)'; (e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.08)'; }}>
              <Bell size={16} color="rgba(255,255,255,0.55)" />
            </button>
            <div style={{ width: '36px', height: '36px', background: `linear-gradient(135deg,${P},${PL})`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 14px rgba(94,23,235,0.45)`, fontSize:'14px', fontFamily:"'Anton',sans-serif", color:'#fff', cursor:'pointer' }}>
              {(user?.name || user?.email || 'U')[0].toUpperCase()}
            </div>
          </div>
        </div>
        <main key={activePage} className="page-in">
          {renderPage()}
        </main>
      </div>
      {/* All keyframes are in index.css */}
    </div>
    </LangContext.Provider>
  );
}
