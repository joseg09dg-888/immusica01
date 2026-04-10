import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import Dither from './components/Dither';
import CSSLightPillar from './components/CSSLightPillar';

// Lazy-loaded heavy WebGL components
const LightPillar = lazy(() =>
  new Promise<{ default: React.ComponentType<any> }>(resolve =>
    setTimeout(() => import('./components/LightPillar').then(resolve), 300)
  )
);
const CircularGallery = lazy(() => import('./components/CircularGallery'));

// ─── Error Boundary ───────────────────────────────────────────────────────────
class WebGLErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: Error) { console.warn('[WebGL component error]', error.message); }
  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}
import Magnet from './components/Magnet';
import SpotlightCard from './components/SpotlightCard';
import BlurText from './components/BlurText';
import RotatingText from './components/RotatingText';
import ShinyText from './components/ShinyText';
import CountUp from './components/CountUp';
import TiltCard from './components/TiltCard';
import {
  LayoutDashboard, Music, TrendingUp, DollarSign, Settings,
  Plus, Bell, User as UserIcon, BarChart3, Globe,
  Zap, CreditCard, Sparkles, Play, ShoppingBag,
  MessageCircle, Lock, Video, Mic, Award, Link2, Store,
  Upload, Image, Scale, Lightbulb, ChevronDown, Send, Trash2,
  LogOut, BookOpen, Package, Users, Radio, Star, Check,
  ArrowRight, Disc, Headphones, TrendingDown, Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// ─── Constants ───────────────────────────────────────────────────────────────
const P = '#5E17EB';
const PL = '#7B3FFF';
const SIDEBAR_W = 256;
const API = '/api';
const token = () => localStorage.getItem('im_token') || '';

async function apiFetch(path: string, opts: RequestInit = {}) {
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}`, ...(opts.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Error');
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

// ─── 3D Button ───────────────────────────────────────────────────────────────
function Btn3D({ children, onClick, disabled = false, type = 'button', variant = 'primary', small = false, fullWidth = false }: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean;
  type?: 'button' | 'submit'; variant?: 'primary' | 'ghost' | 'danger'; small?: boolean; fullWidth?: boolean;
}) {
  const [pressed, setPressed] = useState(false);
  const bg = variant === 'danger' ? '#7f1d1d' : variant === 'ghost' ? 'rgba(255,255,255,0.06)' : P;
  const shadow = variant === 'primary'
    ? `0 ${pressed ? '2px' : '6px'} 0 rgba(45,11,107,1), 0 0 ${pressed ? '20px' : '40px'} rgba(94,23,235,0.45)`
    : `0 ${pressed ? '1px' : '3px'} 0 rgba(0,0,0,0.6)`;
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      onMouseDown={() => setPressed(true)} onMouseUp={() => setPressed(false)} onMouseLeave={() => setPressed(false)}
      style={{
        background: bg, color: '#fff',
        border: variant === 'ghost' ? '1px solid rgba(255,255,255,0.15)' : 'none',
        borderRadius: '12px', padding: small ? '8px 18px' : '14px 32px',
        fontFamily: "'Anton', sans-serif", letterSpacing: '0.12em', textTransform: 'uppercase',
        fontSize: small ? '11px' : '13px', cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1, display: 'inline-flex', alignItems: 'center', gap: '8px',
        transform: `translateY(${pressed ? '4px' : '0'})`,
        boxShadow: shadow,
        transition: pressed ? 'transform 0.06s ease, box-shadow 0.06s ease' : 'transform 0.18s cubic-bezier(0.3,0.7,0.4,1.5), box-shadow 0.18s ease',
        width: fullWidth ? '100%' : undefined, justifyContent: fullWidth ? 'center' : undefined,
      }}>
      {children}
    </button>
  );
}

// ─── ══════════════════════════════════════════════════════════════
//      LANDING PAGE
// ═════════════════════════════════════════════════════════════════
const MARQUEE_WORDS = ['DISTRIBUCIÓN GLOBAL', 'REGALÍAS EN TIEMPO REAL', 'IA MUSICAL', 'MARKETING INTELIGENTE', 'SPLITS AUTOMÁTICOS', 'STORE MAXIMIZER', 'PUBLISHING', 'VAULT SEGURO'];

function Marquee({ reverse = false }: { reverse?: boolean }) {
  const items = [...MARQUEE_WORDS, ...MARQUEE_WORDS];
  return (
    <div style={{ overflow: 'hidden', borderTop: '1px solid rgba(94,23,235,0.2)', borderBottom: '1px solid rgba(94,23,235,0.2)', background: 'rgba(94,23,235,0.08)', padding: '12px 0' }}>
      <div style={{ display: 'flex', width: 'max-content', animation: `marquee${reverse ? 'Rev' : ''} 28s linear infinite` }}>
        {items.map((w, i) => (
          <span key={i} style={{ fontFamily: "'Anton', sans-serif", fontSize: '11px', letterSpacing: '0.25em', color: reverse ? 'rgba(255,255,255,0.3)' : PL, padding: '0 28px', whiteSpace: 'nowrap' }}>
            {w} <span style={{ color: P, opacity: 0.5 }}>✦</span>
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
  { icon: Disc, title: 'Distribución Global', desc: 'Tu música en +150 plataformas: Spotify, Apple Music, YouTube, TikTok y más. ISRC y UPC incluidos.' },
  { icon: DollarSign, title: 'Regalías en Tiempo Real', desc: 'Dashboard con ingresos actualizados diariamente. Histórico completo y proyecciones inteligentes.' },
  { icon: Sparkles, title: 'Marketing con IA', desc: 'Identifica tu arquetipo artístico, genera estrategias y automatiza campañas con inteligencia artificial.' },
  { icon: Users, title: 'Splits y Colaboraciones', desc: 'Divide regalías automáticamente entre colaboradores. Contratos digitales, pagos en tiempo real.' },
  { icon: Shield, title: 'Publishing y Registro', desc: 'Registra tus composiciones, gestiona derechos de autor y cobra royalties de sincronización.' },
  { icon: Headphones, title: 'Spotlight Playlists', desc: 'Envía tu música a curadores verificados. Acceso directo a playlists editoriales de alto alcance.' },
];

const PLANS = [
  { name: 'FREE', price: '$0', period: '/mes', features: ['3 lanzamientos/año', 'Spotify + Apple Music', 'Estadísticas básicas', 'Soporte por email'], cta: 'Empezar gratis', featured: false },
  { name: 'INDIE', price: '$9', period: '/mes', features: ['Lanzamientos ilimitados', '+150 plataformas', 'Analytics avanzado', 'Splits automáticos', 'Marketing IA'], cta: 'Empezar ahora', featured: true },
  { name: 'PRO', price: '$29', period: '/mes', features: ['Todo en INDIE', 'Publishing completo', 'Spotlight premium', 'Store Maximizer', 'Financiamiento', 'Soporte prioritario'], cta: 'Ir al Pro', featured: false },
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

function LandingPage({ onEnter }: { onEnter: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100 });
  const [ringPos, setRingPos] = useState({ x: -100, y: -100 });
  const ringRef = useRef<{ x: number; y: number }>({ x: -100, y: -100 });
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 50);
      const doc = document.documentElement;
      const prog = window.scrollY / (doc.scrollHeight - doc.clientHeight);
      setScrollProgress(Math.min(prog, 1));
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  // Ring lags behind cursor
  useEffect(() => {
    let target = { x: -100, y: -100 };
    const onMove = (e: MouseEvent) => { target = { x: e.clientX, y: e.clientY }; };
    window.addEventListener('mousemove', onMove);
    const loop = () => {
      ringRef.current.x += (target.x - ringRef.current.x) * 0.12;
      ringRef.current.y += (target.y - ringRef.current.y) * 0.12;
      setRingPos({ x: ringRef.current.x, y: ringRef.current.y });
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(rafRef.current); window.removeEventListener('mousemove', onMove); };
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#020202', color: '#fff', overflowX: 'hidden', cursor: 'none' }}>
      {/* Global styles */}
      <style>{`
        @keyframes marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        @keyframes marqueeRev { from{transform:translateX(-50%)} to{transform:translateX(0)} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes cardFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes glowPulse { 0%,100%{opacity:0.4} 50%{opacity:0.9} }
        @keyframes blobFloat { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(30px,-20px) scale(1.05)} 66%{transform:translate(-20px,15px) scale(0.97)} }
        @keyframes blobFloat2 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(-25px,20px) scale(1.03)} 66%{transform:translate(20px,-15px) scale(0.98)} }
        @keyframes waveBar { 0%,100%{height:20px} 50%{height:var(--h)} }
        @keyframes dashFloat { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-12px)} }
        @keyframes fadeInUp { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
        * { box-sizing: border-box; cursor: none !important; }
        html { scroll-behavior: smooth; }
        ::-webkit-scrollbar{width:3px} ::-webkit-scrollbar-track{background:#000} ::-webkit-scrollbar-thumb{background:${P};border-radius:3px}
      `}</style>

      {/* ── CUSTOM CURSOR ── */}
      <div style={{ position: 'fixed', left: cursorPos.x - 4, top: cursorPos.y - 4, width: '8px', height: '8px', background: '#fff', borderRadius: '50%', pointerEvents: 'none', zIndex: 99999, transition: 'transform 0.1s ease', mixBlendMode: 'difference' }} />
      <div style={{ position: 'fixed', left: ringPos.x - 18, top: ringPos.y - 18, width: '36px', height: '36px', border: `1.5px solid rgba(94,23,235,0.8)`, borderRadius: '50%', pointerEvents: 'none', zIndex: 99998, transition: 'opacity 0.2s ease' }} />

      {/* ── SCROLL PROGRESS BAR ── */}
      <div style={{ position: 'fixed', top: 0, left: 0, height: '3px', background: `linear-gradient(90deg, ${P}, ${PL}, #C084FC)`, width: `${scrollProgress * 100}%`, zIndex: 9999, transition: 'width 0.1s linear', boxShadow: `0 0 8px rgba(94,23,235,0.8)` }} />

      {/* Purple grid */}
      <div style={{ position: 'fixed', inset: 0, backgroundImage: `linear-gradient(rgba(94,23,235,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(94,23,235,0.03) 1px, transparent 1px)`, backgroundSize: '56px 56px', pointerEvents: 'none', zIndex: 0 }} />

      {/* ── NAVBAR ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        padding: '0 48px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: scrolled ? 'rgba(2,2,2,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(94,23,235,0.15)' : '1px solid transparent',
        transition: 'all 0.35s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', background: `linear-gradient(135deg, ${P}, ${PL})`, borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 16px rgba(94,23,235,0.4)` }}>
            <Music size={15} color="#fff" />
          </div>
          <span style={{ fontFamily: "'Anton', sans-serif", fontSize: '20px', letterSpacing: '0.05em' }}>IM MUSIC</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          {['Servicios', 'Precios', 'Artistas'].map(l => (
            <span key={l} style={{ color: 'rgba(255,255,255,0.45)', fontSize: '12px', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', transition: 'color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#fff')} onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}>
              {l}
            </span>
          ))}
          <Magnet padding={40} magnetStrength={3}>
            <Btn3D small onClick={onEnter}>Entrar</Btn3D>
          </Magnet>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', padding: '100px 72px 80px', position: 'relative', zIndex: 1, overflow: 'hidden', background: '#000' }}>
        {/* CSS animated background — always visible immediately */}
        <CSSLightPillar />
        {/* LightPillar WebGL background — lazy loaded, replaces CSS version if WebGL works */}
        <WebGLErrorBoundary fallback={null}>
          <Suspense fallback={null}>
            <LightPillar
              topColor="#5E17EB"
              bottomColor="#7B3FFF"
              intensity={1}
              rotationSpeed={0.3}
              glowAmount={0.002}
              pillarWidth={3}
              pillarHeight={0.4}
              noiseIntensity={0.5}
              pillarRotation={25}
              interactive={false}
              mixBlendMode="screen"
              quality="high"
            />
          </Suspense>
        </WebGLErrorBoundary>
        {/* Subtle dark overlay so text stays readable */}
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: '1340px', margin: '0 auto', width: '100%', display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '80px', alignItems: 'center' }}>
          {/* Left: text */}
          <div style={{ animation: 'fadeInUp 0.7s ease forwards' }}>
            {/* Badge */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(94,23,235,0.12)', border: '1px solid rgba(94,23,235,0.35)', borderRadius: '100px', padding: '7px 18px', marginBottom: '36px' }}>
              <div style={{ width: '7px', height: '7px', background: '#22c55e', borderRadius: '50%', animation: 'pulse 1.5s ease-in-out infinite', flexShrink: 0 }} />
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '11px', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: PL }}>Plataforma activa — 50K+ artistas</span>
            </div>

            {/* Headline — Anton, huge, cream */}
            <h1 style={{ fontFamily: "'Anton', sans-serif", fontSize: 'clamp(56px, 7vw, 96px)', lineHeight: 0.95, margin: '0 0 28px', letterSpacing: '-0.02em' }}>
              <span style={{ display: 'block', color: '#F2EDE5' }}>DISTRIBUYE.</span>
              <span style={{ display: 'block', background: `linear-gradient(130deg, ${P} 0%, ${PL} 50%, #C084FC 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>MONETIZA.</span>
              <span style={{ display: 'block', color: '#F2EDE5' }}>DOMINA.</span>
            </h1>

            {/* Rotating tagline */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', fontFamily: "'Space Grotesk', sans-serif", fontSize: '14px', fontWeight: 600, letterSpacing: '0.06em' }}>
              <span style={{ color: PL, fontSize: '12px' }}>▸</span>
              <RotatingText
                texts={['DISTRIBUCIÓN EN 150+ PLATAFORMAS', 'REGALÍAS EN TIEMPO REAL', 'MARKETING CON IA', 'SPLITS AUTOMÁTICOS', 'PUBLISHING & REGISTRO']}
                rotationInterval={2500}
                splitBy="words"
                staggerDuration={0.04}
                staggerFrom="first"
                style={{ color: 'rgba(242,237,229,0.55)', fontFamily: "'Space Grotesk', sans-serif", fontSize: '13px', letterSpacing: '0.06em' }}
              />
            </div>

            <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '18px', color: 'rgba(242,237,229,0.45)', lineHeight: 1.75, margin: '0 0 44px', maxWidth: '480px' }}>
              La plataforma todo-en-uno para artistas independientes. Distribución en 150+ tiendas, regalías en tiempo real, marketing con IA y herramientas de crecimiento profesional.
            </p>

            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '52px', flexWrap: 'wrap' }}>
              <Magnet padding={60} magnetStrength={3}>
                <Btn3D onClick={onEnter}>COMENZAR GRATIS <ArrowRight size={16} /></Btn3D>
              </Magnet>
              <Magnet padding={60} magnetStrength={4}>
                <Btn3D variant="ghost" onClick={onEnter}><Play size={14} /> Ver demo</Btn3D>
              </Magnet>
            </div>

            {/* Mini stats */}
            <div style={{ display: 'flex', gap: '36px', borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '32px', flexWrap: 'wrap' }}>
              {STATS.map(s => (
                <div key={s.label}>
                  <p style={{ fontFamily: "'Anton', sans-serif", fontSize: '28px', color: '#F2EDE5', margin: 0, letterSpacing: '0.02em' }}>
                    {s.prefix || ''}<AnimatedCounter target={s.num} suffix={s.suffix} />
                  </p>
                  <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '10px', color: 'rgba(242,237,229,0.3)', margin: '3px 0 0', textTransform: 'uppercase', letterSpacing: '0.12em' }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: CSS animated music dashboard — no WebGL */}
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', animation: 'dashFloat 6s ease-in-out infinite' }}>
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
      <section style={{ background: `linear-gradient(135deg, rgba(94,23,235,0.15) 0%, rgba(45,11,107,0.2) 100%)`, borderTop: '1px solid rgba(94,23,235,0.2)', borderBottom: '1px solid rgba(94,23,235,0.2)', padding: '64px 48px', position: 'relative', zIndex: 1, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '600px', height: '300px', background: `radial-gradient(ellipse, rgba(94,23,235,0.12) 0%, transparent 70%)`, pointerEvents: 'none' }} />
        <div className="landing-stats-grid" style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0', position: 'relative' }}>
          {[
            { end: 150, suffix: '+', label: 'Plataformas globales', icon: Globe },
            { end: 50, suffix: 'K+', label: 'Artistas activos', icon: Users },
            { end: 2, suffix: 'M+', prefix: '$', label: 'En regalías pagadas', icon: DollarSign },
            { end: 98, suffix: '%', label: 'Tasa de satisfacción', icon: Star },
          ].map((stat, i) => (
            <div key={i} style={{ textAlign: 'center', padding: '0 24px', borderRight: i < 3 ? '1px solid rgba(94,23,235,0.2)' : 'none' }}>
              <stat.icon size={20} color={PL} style={{ marginBottom: '12px' }} />
              <div style={{ fontFamily: "'Anton', sans-serif", fontSize: 'clamp(40px, 4vw, 60px)', color: '#fff', letterSpacing: '-0.02em', lineHeight: 1, marginBottom: '8px' }}>
                {stat.prefix || ''}<CountUp end={stat.end} suffix={stat.suffix} duration={2000} />
              </div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── SERVICES ── */}
      <section id="servicios" style={{ padding: '120px 0', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '72px', padding: '0 48px' }}>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '11px', fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', color: PL, display: 'block', marginBottom: '16px' }}>LO QUE OFRECEMOS</span>
          <h2 style={{ fontFamily: "'Anton', sans-serif", fontSize: 'clamp(36px, 4vw, 60px)', color: '#fff', margin: 0, letterSpacing: '0.01em' }}>
            TODO LO QUE NECESITAS<br />
            <span style={{ background: `linear-gradient(135deg, ${P}, ${PL})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>EN UNA PLATAFORMA</span>
          </h2>
        </div>
        {/* CircularGallery — interactive scrollable service showcase */}
        <div style={{ width: '100%', height: '500px', background: '#0a0a0a' }}>
          <WebGLErrorBoundary fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'rgba(255,255,255,0.3)', fontFamily: "'Space Grotesk', sans-serif", fontSize: '14px' }}>Galería de servicios</div>}>
            <Suspense fallback={<div style={{ height: '100%', background: '#0a0a0a' }} />}>
              <CircularGallery
                items={[
                  { image: 'https://picsum.photos/seed/dist/800/600?grayscale', text: 'Distribución Digital' },
                  { image: 'https://picsum.photos/seed/ai/800/600?grayscale', text: 'Marketing con IA' },
                  { image: 'https://picsum.photos/seed/agent/800/600?grayscale', text: 'Agentes IA 24/7' },
                  { image: 'https://picsum.photos/seed/royal/800/600?grayscale', text: 'Gestión de Regalías' },
                  { image: 'https://picsum.photos/seed/video/800/600?grayscale', text: 'Videos Musicales' },
                  { image: 'https://picsum.photos/seed/fund/800/600?grayscale', text: 'Financiamiento' },
                ]}
                bend={1}
                textColor="#F2EDE5"
                borderRadius={0.05}
                scrollSpeed={2}
                scrollEase={0.05}
              />
            </Suspense>
          </WebGLErrorBoundary>
        </div>
      </section>

      {/* ── POR QUÉ NOSOTROS ── */}
      <section style={{ padding: '80px 48px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '11px', fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', color: PL, display: 'block', marginBottom: '16px' }}>NUESTRA VENTAJA</span>
            <h2 style={{ fontFamily: "'Anton', sans-serif", fontSize: 'clamp(32px, 3.5vw, 52px)', color: '#fff', margin: 0, letterSpacing: '0.01em' }}>
              POR QUÉ <span style={{ background: `linear-gradient(135deg, ${P}, ${PL})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>IM MUSIC</span>
            </h2>
          </div>
          <div className="landing-why-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
            {[
              { icon: Zap, title: 'Velocidad', desc: 'Lanza en menos de 24h. Sin burocracia, sin esperas. Tu música llega rápido.' },
              { icon: DollarSign, title: 'Más ingresos', desc: '0% comisión en todas las regalías. 100% de tus ganancias, siempre.' },
              { icon: Sparkles, title: 'IA de primera', desc: 'Herramientas de IA entrenadas específicamente para la industria musical.' },
              { icon: Shield, title: 'Seguridad total', desc: 'Contratos digitales, splits automatizados, pagos verificados y seguros.' },
            ].map((d, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '32px 24px', transition: 'all 0.3s ease' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(94,23,235,0.08)'; (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(94,23,235,0.3)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.02)'; (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.06)'; }}
              >
                <div style={{ width: '44px', height: '44px', background: `rgba(94,23,235,0.15)`, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', border: '1px solid rgba(94,23,235,0.25)' }}>
                  <d.icon size={20} color={PL} />
                </div>
                <h3 style={{ fontFamily: "'Anton', sans-serif", fontSize: '20px', color: '#fff', margin: '0 0 10px', letterSpacing: '0.03em' }}>{d.title}</h3>
                <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.7, margin: 0 }}>{d.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ARTISTS CAROUSEL ── */}
      <section id="artistas" style={{ padding: '100px 0', position: 'relative', zIndex: 1, overflow: 'hidden' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 48px', marginBottom: '48px' }}>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '11px', fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', color: PL, display: 'block', marginBottom: '16px' }}>ARTISTAS QUE CONFÍAN</span>
            <h2 style={{ fontFamily: "'Anton', sans-serif", fontSize: 'clamp(32px, 3.5vw, 52px)', color: '#fff', margin: 0, letterSpacing: '0.01em' }}>
              HISTORIAS DE <span style={{ background: `linear-gradient(135deg, ${P}, ${PL})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>ÉXITO</span>
            </h2>
          </div>
        </div>
        <div className="artist-carousel" style={{ display: 'flex', gap: '20px', padding: '16px 48px 32px', overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' as any }}>
          {ARTISTS.map((artist, i) => (
            <div key={i} style={{ flexShrink: 0, width: '220px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '28px 20px', textAlign: 'center', transition: 'all 0.3s ease', cursor: 'default' }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = 'translateY(-8px)'; el.style.borderColor = artist.color + '60'; el.style.boxShadow = `0 20px 40px rgba(0,0,0,0.4), 0 0 30px ${artist.color}25`; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = 'translateY(0)'; el.style.borderColor = 'rgba(255,255,255,0.08)'; el.style.boxShadow = 'none'; }}
            >
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: `linear-gradient(135deg, ${artist.color}40, ${artist.color}20)`, border: `2px solid ${artist.color}60`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', margin: '0 auto 16px' }}>
                {artist.img}
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
      <section style={{ padding: '80px 48px', position: 'relative', zIndex: 1, background: 'rgba(0,0,0,0.4)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '11px', fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', color: PL, display: 'block', marginBottom: '16px' }}>TESTIMONIOS</span>
            <h2 style={{ fontFamily: "'Anton', sans-serif", fontSize: 'clamp(30px, 3vw, 48px)', color: '#fff', margin: 0 }}>LO QUE DICEN LOS ARTISTAS</h2>
          </div>
          <div className="landing-testimonials-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            {[
              { quote: '"IM Music cambió todo para mí. Mis regalías llegaron a tiempo por primera vez en mi carrera."', name: 'Luna Vera', role: 'R&B Artist', stars: 5 },
              { quote: '"El split automático con mi productor funciona perfecto. Cero drama, cero confusion, puro dinero."', name: 'Niko Beats', role: 'Trap Producer', stars: 5 },
              { quote: '"El marketing con IA me generó una estrategia que triplicó mis seguidores en 3 meses."', name: 'Mía Solar', role: 'Pop Artist', stars: 5 },
            ].map((t, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '32px', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '20px', right: '24px', display: 'flex', gap: '3px' }}>
                  {Array.from({ length: t.stars }).map((_, si) => <Star key={si} size={12} color="#fbbf24" fill="#fbbf24" />)}
                </div>
                <div style={{ fontSize: '40px', color: P, lineHeight: 1, marginBottom: '16px', fontFamily: 'Georgia, serif' }}>"</div>
                <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '15px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, margin: '0 0 24px', fontStyle: 'italic' }}>{t.quote.slice(1, -1)}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: `linear-gradient(135deg, ${P}, ${PL})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <UserIcon size={16} color="#fff" />
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
      <section id="precios" style={{ padding: '120px 48px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '72px' }}>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '11px', fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', color: PL, display: 'block', marginBottom: '16px' }}>PLANES Y PRECIOS</span>
            <h2 style={{ fontFamily: "'Anton', sans-serif", fontSize: 'clamp(36px, 4vw, 56px)', color: '#fff', margin: '0 0 12px', letterSpacing: '0.01em' }}>ELIGE TU PLAN</h2>
            <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '16px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>Sin compromisos. Cambia de plan cuando quieras.</p>
          </div>
          <div className="landing-pricing-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', alignItems: 'center' }}>
            {PLANS.map((plan, i) => (
              <PlanCard key={i} plan={plan} onSelect={onEnter} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section style={{ padding: '120px 48px', position: 'relative', zIndex: 1, textAlign: 'center' }}>
        {/* Glow backdrop */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '800px', height: '400px', background: `radial-gradient(ellipse, rgba(94,23,235,0.15) 0%, transparent 70%)`, pointerEvents: 'none' }} />
        <div style={{ maxWidth: '700px', margin: '0 auto', position: 'relative' }}>
          <div style={{ width: '88px', height: '88px', background: `linear-gradient(135deg, ${P}, ${PL})`, borderRadius: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px', boxShadow: `0 0 80px rgba(94,23,235,0.6), 0 20px 40px rgba(94,23,235,0.3)` }}>
            <Music size={40} color="#fff" />
          </div>
          <h2 style={{ fontFamily: "'Anton', sans-serif", fontSize: 'clamp(44px, 5.5vw, 72px)', color: '#fff', margin: '0 0 20px', letterSpacing: '0.01em', lineHeight: 1.05 }}>
            EMPIEZA HOY.<br />
            <ShinyText text="ES GRATIS." color={`rgba(255,255,255,0.5)`} shineColor="#fff" speed={1.5} spread={100}
              style={{ fontFamily: "'Anton', sans-serif", fontSize: 'inherit', letterSpacing: '0.01em' }} />
          </h2>
          <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '18px', color: 'rgba(255,255,255,0.4)', margin: '0 0 48px', lineHeight: 1.7 }}>Sin tarjeta de crédito. Sin contratos. Cancela cuando quieras.</p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
            <Magnet padding={60} magnetStrength={2}>
              <Btn3D onClick={onEnter}>
                CREAR CUENTA GRATIS <ArrowRight size={16} />
              </Btn3D>
            </Magnet>
            <Magnet padding={60} magnetStrength={3}>
              <Btn3D variant="ghost" onClick={onEnter}>
                Ver demo <Play size={14} />
              </Btn3D>
            </Magnet>
          </div>
          <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.2)', marginTop: '24px', letterSpacing: '0.05em' }}>
            50,000+ artistas ya confían en IM Music · Distribución activa en 150+ plataformas
          </p>
        </div>
      </section>

      {/* ── FOOTER (4 columns) ── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '64px 48px 32px', position: 'relative', zIndex: 1 }}>
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
              {['Privacidad', 'Términos de uso', 'Cookies', 'DMCA', 'Licencias'].map(l => (
                <div key={l} style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.35)', marginBottom: '10px', cursor: 'pointer', transition: 'color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}>{l}</div>
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

function ServiceCard({ icon: Icon, title, desc }: { key?: React.Key; icon: any; title: string; desc: string }) {
  const [hover, setHover] = useState(false);
  return (
    <SpotlightCard
      spotlightColor="rgba(94,23,235,0.3)"
      style={{ padding: '32px', borderRadius: '20px' }}
    >
      <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
        <div style={{ width: '48px', height: '48px', background: hover ? `rgba(94,23,235,0.3)` : `rgba(94,23,235,0.12)`, borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', border: `1px solid ${hover ? 'rgba(94,23,235,0.5)' : 'rgba(94,23,235,0.2)'}`, transition: 'all 0.3s', boxShadow: hover ? `0 0 20px rgba(94,23,235,0.3)` : 'none' }}>
          <Icon size={22} color={hover ? '#fff' : PL} />
        </div>
        <h3 style={{ fontFamily: "'Anton', sans-serif", fontSize: '18px', color: '#fff', margin: '0 0 10px', letterSpacing: '0.03em' }}>{title}</h3>
        <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, margin: 0 }}>{desc}</p>
      </div>
    </SpotlightCard>
  );
}

function PlanCard({ plan, onSelect }: { key?: React.Key; plan: typeof PLANS[0]; onSelect: () => void }) {
  const [hover, setHover] = useState(false);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ rx: -y * 12, ry: x * 12 });
  };

  return (
    <div style={{ perspective: '800px' }}>
      <div
        ref={cardRef}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => { setHover(false); setTilt({ rx: 0, ry: 0 }); }}
        onMouseMove={handleMouseMove}
        style={{
          background: plan.featured ? `linear-gradient(160deg, rgba(94,23,235,0.2), rgba(123,63,255,0.1))` : 'rgba(255,255,255,0.03)',
          border: `1px solid ${plan.featured ? 'rgba(94,23,235,0.6)' : hover ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)'}`,
          borderRadius: '24px', padding: '36px 28px',
          transform: plan.featured
            ? `scale(1.04) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`
            : `translateY(${hover ? '-6px' : '0'}) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
          transition: hover ? 'transform 0.1s ease, box-shadow 0.3s ease, border-color 0.3s ease' : 'transform 0.4s cubic-bezier(0.3,0.7,0.4,1.5), box-shadow 0.3s ease, border-color 0.3s ease',
          boxShadow: plan.featured
            ? `0 0 60px rgba(94,23,235,0.25), 0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)`
            : hover ? '0 20px 40px rgba(0,0,0,0.4), 0 0 30px rgba(94,23,235,0.1)' : 'none',
          position: 'relative', overflow: 'hidden',
          transformStyle: 'preserve-3d',
          cursor: 'pointer',
        }}
      >
        {plan.featured && (
          <div style={{ position: 'absolute', top: '16px', right: '16px', background: `linear-gradient(135deg, ${P}, ${PL})`, padding: '4px 12px', borderRadius: '100px', fontFamily: "'Anton', sans-serif", fontSize: '10px', letterSpacing: '0.15em', color: '#fff', boxShadow: `0 0 16px rgba(94,23,235,0.4)` }}>POPULAR</div>
        )}
        {plan.featured && (
          <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 50% 0%, rgba(94,23,235,0.15) 0%, transparent 60%)`, pointerEvents: 'none' }} />
        )}
        <p style={{ fontFamily: "'Anton', sans-serif", fontSize: '13px', color: PL, letterSpacing: '0.25em', margin: '0 0 16px' }}>{plan.name}</p>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '8px' }}>
          <span style={{ fontFamily: "'Anton', sans-serif", fontSize: '52px', color: '#fff', letterSpacing: '-0.02em', textShadow: plan.featured ? `0 0 40px rgba(94,23,235,0.5)` : 'none' }}>{plan.price}</span>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.3)' }}>{plan.period}</span>
        </div>
        <div style={{ height: '1px', background: plan.featured ? `linear-gradient(90deg, transparent, rgba(94,23,235,0.4), transparent)` : 'rgba(255,255,255,0.06)', margin: '20px 0' }} />
        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px' }}>
          {plan.features.map((f, i) => (
            <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 0', fontFamily: "'Space Grotesk', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.65)' }}>
              <Check size={14} color={PL} style={{ flexShrink: 0 }} />{f}
            </li>
          ))}
        </ul>
        <Btn3D fullWidth variant={plan.featured ? 'primary' : 'ghost'} onClick={onSelect}>{plan.cta}</Btn3D>
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
      const data = await apiFetch(`/auth/${tab}`, { method: 'POST', body: JSON.stringify(body) });
      localStorage.setItem('im_token', data.token);
      onLogin(data.user);
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  const inputStyle: React.CSSProperties = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '14px 16px', color: '#fff', fontFamily: "'Space Grotesk', sans-serif", fontSize: '14px', outline: 'none', width: '100%', boxSizing: 'border-box', transition: 'border-color 0.2s' };

  return (
    <div style={{ minHeight: '100vh', background: '#020202', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', position: 'relative', overflow: 'hidden' }}>
      {/* Dither wave background */}
      <Dither
        waveColor={[0.25, 0.06, 0.6]}
        colorNum={4} pixelSize={3}
        waveAmplitude={0.25} waveFrequency={2.5} waveSpeed={0.03}
        enableMouseInteraction mouseRadius={0.25}
        style={{ position: 'fixed', opacity: 0.6 }}
      />
      <div style={{ position: 'fixed', inset: 0, backgroundImage: `linear-gradient(rgba(94,23,235,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(94,23,235,0.04) 1px, transparent 1px)`, backgroundSize: '56px 56px', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', top: '-200px', left: '50%', transform: 'translateX(-50%)', width: '800px', height: '600px', background: `radial-gradient(ellipse, rgba(94,23,235,0.15) 0%, transparent 65%)`, pointerEvents: 'none' }} />

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}
        style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 1 }}>
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
      </motion.div>
    </div>
  );
}

// ─── SIDEBAR ─────────────────────────────────────────────────────────────────
const MODULES = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, group: 'General' },
  { id: 'catalog', label: 'Catálogo', icon: Music, group: 'Música' },
  { id: 'royalties', label: 'Regalías', icon: DollarSign, group: 'Música' },
  { id: 'publishing', label: 'Publishing', icon: BookOpen, group: 'Música' },
  { id: 'releases', label: 'Releases', icon: Package, group: 'Música' },
  { id: 'videos', label: 'Videos', icon: Video, group: 'Contenido' },
  { id: 'lyrics', label: 'Letras', icon: Mic, group: 'Contenido' },
  { id: 'promo-cards', label: 'Promo Cards', icon: Image, group: 'Contenido' },
  { id: 'marketing', label: 'Marketing IA', icon: Sparkles, group: 'Marketing' },
  { id: 'spotlight', label: 'Spotlight', icon: Radio, group: 'Marketing' },
  { id: 'hyperfollow', label: 'HyperFollow', icon: Link2, group: 'Marketing' },
  { id: 'community', label: 'Comunidad', icon: MessageCircle, group: 'Social' },
  { id: 'marketplace', label: 'Marketplace', icon: ShoppingBag, group: 'Social' },
  { id: 'playlists', label: 'Playlists', icon: Play, group: 'Social' },
  { id: 'ai-chat', label: 'IA Chat', icon: Zap, group: 'IA' },
  { id: 'legal', label: 'Legal IA', icon: Scale, group: 'IA' },
  { id: 'financing', label: 'Financiamiento', icon: CreditCard, group: 'Finanzas' },
  { id: 'splits', label: 'Splits', icon: Users, group: 'Finanzas' },
  { id: 'vault', label: 'Vault', icon: Lock, group: 'Archivos' },
  { id: 'bulk-upload', label: 'Subida Masiva', icon: Upload, group: 'Archivos' },
  { id: 'store-maximizer', label: 'Store Maximizer', icon: Store, group: 'Distribución' },
  { id: 'riaa', label: 'Certificaciones', icon: Award, group: 'Distribución' },
  { id: 'team', label: 'Equipo', icon: Users, group: 'Gestión' },
  { id: 'stats', label: 'Estadísticas', icon: BarChart3, group: 'Gestión' },
  { id: 'feedback', label: 'Feedback', icon: Star, group: 'Gestión' },
  { id: 'settings', label: 'Ajustes', icon: Settings, group: 'Gestión' },
];

function Sidebar({ active, onNav, user, onLogout, open, onClose }: {
  active: string; onNav: (id: string) => void; user: any; onLogout: () => void; open: boolean; onClose: () => void;
}) {
  const groups = [...new Set(MODULES.map(m => m.group))];
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const toggle = (g: string) => setCollapsed(prev => { const n = new Set(prev); n.has(g) ? n.delete(g) : n.add(g); return n; });

  return (
    <>
      {open && <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 20 }} />}
      <aside style={{ position: 'fixed', top: 0, left: 0, height: '100%', width: `${SIDEBAR_W}px`, background: '#080808', borderRight: '1px solid rgba(255,255,255,0.05)', zIndex: 30, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '18px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', background: `linear-gradient(135deg, ${P}, ${PL})`, borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 16px rgba(94,23,235,0.35)` }}>
            <Music size={15} color="#fff" />
          </div>
          <span style={{ fontFamily: "'Anton', sans-serif", fontSize: '17px', letterSpacing: '0.05em', color: '#fff' }}>IM MUSIC</span>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 8px' }}>
          {groups.map(group => {
            const items = MODULES.filter(m => m.group === group);
            const isCollapsed = collapsed.has(group);
            return (
              <div key={group}>
                <button onClick={() => toggle(group)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 10px', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.2)', fontSize: '9px', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: '6px' }}>
                  <span>{group}</span>
                  <ChevronDown size={9} style={{ transform: isCollapsed ? 'rotate(-90deg)' : 'none', transition: 'transform 0.2s' }} />
                </button>
                {!isCollapsed && items.map(m => {
                  const isActive = active === m.id;
                  return (
                    <button key={m.id} onClick={() => { onNav(m.id); onClose(); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '9px', padding: '8px 10px', borderRadius: '9px', border: 'none', cursor: 'pointer', background: isActive ? `rgba(94,23,235,0.16)` : 'transparent', color: isActive ? PL : 'rgba(255,255,255,0.35)', fontSize: '12px', fontFamily: "'Space Grotesk', sans-serif", fontWeight: isActive ? 600 : 400, transition: 'all 0.15s', textAlign: 'left', borderLeft: isActive ? `2px solid ${P}` : '2px solid transparent' }}>
                      <m.icon size={13} /><span>{m.label}</span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
        <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', marginBottom: '4px' }}>
            <div style={{ width: '30px', height: '30px', background: `rgba(94,23,235,0.2)`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <UserIcon size={13} color={PL} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ color: '#fff', fontSize: '12px', fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name || user?.email}</p>
              <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '10px', margin: 0, textTransform: 'capitalize' }}>{user?.role || 'artist'}</p>
            </div>
          </div>
          <button onClick={onLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '7px', padding: '7px 10px', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.25)', fontSize: '11px', fontFamily: "'Space Grotesk', sans-serif", borderRadius: '8px' }}>
            <LogOut size={12} /> Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  );
}

// ─── APP SHELL PAGES ──────────────────────────────────────────────────────────
function PageShell({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div style={{ padding: '32px', maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <h1 style={{ fontFamily: "'Anton', sans-serif", fontSize: '28px', color: '#fff', letterSpacing: '0.02em', margin: 0 }}>{title}</h1>
        {action}
      </div>
      {children}
    </div>
  );
}

function Card({ children, style = {}, glow = false }: { children: React.ReactNode; style?: React.CSSProperties; glow?: boolean }) {
  const [hover, setHover] = useState(false);
  return (
    <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${hover || glow ? 'rgba(94,23,235,0.35)' : 'rgba(255,255,255,0.07)'}`, borderRadius: '20px', padding: '24px', transition: 'all 0.25s ease', boxShadow: hover ? `0 0 40px rgba(94,23,235,0.1), 0 8px 32px rgba(0,0,0,0.3)` : 'none', transform: hover ? 'translateY(-2px)' : 'none', ...style }}>
      {children}
    </div>
  );
}

function StatCard({ label, value, icon: Icon }: { label: string; value: string | number; icon: any; key?: React.Key }) {
  const [hover, setHover] = useState(false);
  return (
    <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${hover ? 'rgba(94,23,235,0.4)' : 'rgba(255,255,255,0.07)'}`, borderRadius: '20px', padding: '24px', transition: 'all 0.25s ease', boxShadow: hover ? `0 0 40px rgba(94,23,235,0.15)` : 'none', transform: hover ? 'translateY(-4px) scale(1.01)' : 'none' }}>
      <div style={{ width: '40px', height: '40px', background: `rgba(94,23,235,0.12)`, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px', border: '1px solid rgba(94,23,235,0.18)' }}>
        <Icon size={18} color={PL} />
      </div>
      <p style={{ fontFamily: "'Anton', sans-serif", fontSize: '26px', color: '#fff', margin: '0 0 4px', letterSpacing: '0.02em' }}>{value}</p>
      <p style={{ color: 'rgba(255,255,255,0.32)', fontSize: '12px', margin: 0, fontFamily: "'Space Grotesk', sans-serif" }}>{label}</p>
    </div>
  );
}

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
function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [tracks, setTracks] = useState<any[]>([]);
  useEffect(() => {
    apiFetch('/royalties/summary').then(setStats).catch(() => {});
    apiFetch('/tracks').then(d => setTracks(Array.isArray(d) ? d.slice(0, 5) : [])).catch(() => {});
  }, []);
  const cards = [
    { label: 'Ingresos totales', value: stats ? `$${Number(stats.totalRevenue || 0).toFixed(2)}` : '—', icon: DollarSign },
    { label: 'Tracks', value: tracks.length || '—', icon: Music },
    { label: 'Plataformas', value: stats ? Object.keys(stats.byPlatform || {}).length : '—', icon: Globe },
    { label: 'Streams', value: stats ? Number(stats.totalStreams || 0).toLocaleString() : '—', icon: TrendingUp },
  ];
  return (
    <>
      <AppMarqueeStrip />
      <PageShell title="Dashboard">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {cards.map(c => <StatCard key={c.label} label={c.label} value={c.value} icon={c.icon} />)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <Card>
            <h3 style={{ fontFamily: "'Anton', sans-serif", fontSize: '15px', color: '#fff', letterSpacing: '0.06em', margin: '0 0 16px' }}>ÚLTIMOS TRACKS</h3>
            {tracks.length === 0 && <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '13px', fontFamily: "'Space Grotesk', sans-serif" }}>Sin tracks aún</p>}
            {tracks.map(t => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ width: '34px', height: '34px', background: 'rgba(94,23,235,0.13)', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Music size={13} color={PL} />
                </div>
                <div>
                  <p style={{ color: '#fff', fontSize: '13px', fontWeight: 600, margin: 0, fontFamily: "'Space Grotesk', sans-serif" }}>{t.title}</p>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', margin: 0, fontFamily: "'Space Grotesk', sans-serif" }}>{t.status}</p>
                </div>
              </div>
            ))}
          </Card>
          <Card>
            <h3 style={{ fontFamily: "'Anton', sans-serif", fontSize: '15px', color: '#fff', letterSpacing: '0.06em', margin: '0 0 16px' }}>PLATAFORMAS</h3>
            {stats?.byPlatform && Object.entries(stats.byPlatform).slice(0, 5).map(([plat, v]: any) => (
              <div key={plat} style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: '12px', textTransform: 'capitalize', fontFamily: "'Space Grotesk', sans-serif" }}>{plat}</span>
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', fontFamily: "'Space Grotesk', sans-serif" }}>${Number(v).toFixed(2)}</span>
                </div>
                <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '100px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: `linear-gradient(90deg, ${P}, ${PL})`, borderRadius: '100px', width: `${Math.min(100, (v / Math.max(stats.totalRevenue, 1)) * 100)}%` }} />
                </div>
              </div>
            ))}
            {!stats?.byPlatform && <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '13px', fontFamily: "'Space Grotesk', sans-serif" }}>Sin datos</p>}
          </Card>
        </div>
      </PageShell>
    </>
  );
}

// ─── CATALOG ─────────────────────────────────────────────────────────────────
function CatalogPage() {
  const [tracks, setTracks] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState(''); const [genre, setGenre] = useState(''); const [loading, setLoading] = useState(false);
  const load = () => apiFetch('/tracks').then(d => setTracks(Array.isArray(d) ? d : [])).catch(() => {});
  useEffect(() => { load(); }, []);
  const create = async () => { if (!title) return; setLoading(true); try { await apiFetch('/tracks', { method: 'POST', body: JSON.stringify({ title, genre }) }); setTitle(''); setGenre(''); setShowForm(false); load(); } catch {} setLoading(false); };
  const del = async (id: number) => { if (!confirm('¿Eliminar?')) return; await apiFetch(`/tracks/${id}`, { method: 'DELETE' }).catch(() => {}); load(); };
  const statusColors: Record<string, string> = { draft: '#52525b', published: '#16a34a', scheduled: '#1d4ed8' };
  const inputStyle: React.CSSProperties = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '10px 14px', color: '#fff', fontFamily: "'Space Grotesk',sans-serif", fontSize: '13px', outline: 'none' };
  return (
    <PageShell title="Catálogo" action={<Btn3D small onClick={() => setShowForm(!showForm)}><Plus size={13} /> Nuevo track</Btn3D>}>
      {showForm && <Card style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Título" style={{ ...inputStyle, flex: 1, minWidth: '140px' }} />
          <input value={genre} onChange={e => setGenre(e.target.value)} placeholder="Género" style={{ ...inputStyle, width: '110px' }} />
          <Btn3D small onClick={create} disabled={loading}>{loading ? 'Creando...' : 'Crear'}</Btn3D>
          <Btn3D small variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Btn3D>
        </div>
      </Card>}
      <Card>
        {tracks.length === 0 && <p style={{ color: 'rgba(255,255,255,0.25)', textAlign: 'center', padding: '32px 0', fontFamily: "'Space Grotesk',sans-serif" }}>Sin tracks. ¡Sube tu primer tema!</p>}
        {tracks.map(t => (
          <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ width: '38px', height: '38px', background: 'rgba(94,23,235,0.13)', borderRadius: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Music size={15} color={PL} /></div>
            <div style={{ flex: 1 }}><p style={{ color: '#fff', fontSize: '13px', fontWeight: 600, margin: 0, fontFamily: "'Space Grotesk',sans-serif" }}>{t.title}</p><p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', margin: 0, fontFamily: "'Space Grotesk',sans-serif" }}>{t.genre || 'Sin género'}</p></div>
            <span style={{ background: statusColors[t.status] || '#52525b', color: '#fff', fontSize: '10px', fontWeight: 700, padding: '3px 7px', borderRadius: '5px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{t.status}</span>
            <button onClick={() => del(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.2)', padding: '4px', borderRadius: '5px' }}><Trash2 size={14} /></button>
          </div>
        ))}
      </Card>
    </PageShell>
  );
}

// ─── ROYALTIES ───────────────────────────────────────────────────────────────
function RoyaltiesPage() {
  const [summary, setSummary] = useState<any>(null); const [monthly, setMonthly] = useState<any[]>([]);
  useEffect(() => { apiFetch('/royalties/summary').then(setSummary).catch(() => {}); apiFetch('/royalties/monthly').then(setMonthly).catch(() => {}); }, []);
  return (
    <PageShell title="Regalías">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[{ label: 'Total ingresos', value: summary ? `$${Number(summary.totalRevenue||0).toFixed(2)}` : '—', icon: DollarSign }, { label: 'Total streams', value: summary ? Number(summary.totalStreams||0).toLocaleString() : '—', icon: TrendingUp }, { label: 'Plataformas', value: summary ? Object.keys(summary.byPlatform||{}).length : '—', icon: Globe }].map(c => <StatCard key={c.label} label={c.label} value={c.value} icon={c.icon} />)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <Card><h3 style={{ fontFamily: "'Anton', sans-serif", fontSize: '15px', color: '#fff', letterSpacing: '0.06em', margin: '0 0 16px' }}>POR PLATAFORMA</h3>{summary?.byPlatform && Object.entries(summary.byPlatform).map(([p,v]:any)=>(<div key={p} style={{display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid rgba(255,255,255,0.04)'}}><span style={{color:'rgba(255,255,255,0.55)',textTransform:'capitalize',fontSize:'13px',fontFamily:"'Space Grotesk',sans-serif"}}>{p}</span><span style={{color:'#fff',fontWeight:600,fontSize:'13px',fontFamily:"'Space Grotesk',sans-serif"}}>${Number(v).toFixed(2)}</span></div>))}{!summary?.byPlatform&&<p style={{color:'rgba(255,255,255,0.25)',fontSize:'13px',fontFamily:"'Space Grotesk',sans-serif"}}>Sin datos</p>}</Card>
        <Card><h3 style={{ fontFamily: "'Anton', sans-serif", fontSize: '15px', color: '#fff', letterSpacing: '0.06em', margin: '0 0 16px' }}>HISTORIAL MENSUAL</h3>{monthly.slice(0,8).map((m:any)=>(<div key={m.month} style={{display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid rgba(255,255,255,0.04)'}}><span style={{color:'rgba(255,255,255,0.55)',fontSize:'13px',fontFamily:"'Space Grotesk',sans-serif"}}>{m.month}</span><span style={{color:'#fff',fontWeight:600,fontSize:'13px',fontFamily:"'Space Grotesk',sans-serif"}}>${Number(m.revenue||0).toFixed(2)}</span></div>))}{monthly.length===0&&<p style={{color:'rgba(255,255,255,0.25)',fontSize:'13px',fontFamily:"'Space Grotesk',sans-serif"}}>Sin datos</p>}</Card>
      </div>
    </PageShell>
  );
}

// ─── AI CHAT ─────────────────────────────────────────────────────────────────
function AIChatPage() {
  const [messages, setMessages] = useState<{role:string;content:string}[]>([{role:'assistant',content:'¡Hola! Soy tu asistente musical IA. ¿En qué puedo ayudarte hoy?'}]);
  const [input, setInput] = useState(''); const [loading, setLoading] = useState(false); const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:'smooth'})},[messages]);
  const send = async()=>{ if(!input.trim()||loading)return; const msg=input.trim();setInput('');setMessages(p=>[...p,{role:'user',content:msg}]);setLoading(true);try{const d=await apiFetch('/ai/chat',{method:'POST',body:JSON.stringify({message:msg,history:messages})});setMessages(p=>[...p,{role:'assistant',content:d.response||d.message||'Sin respuesta'}]);}catch(e:any){setMessages(p=>[...p,{role:'assistant',content:`Error: ${e.message}`}]);}setLoading(false);};
  return (
    <PageShell title="IA Chat">
      <Card style={{display:'flex',flexDirection:'column',height:'520px'}}>
        <div style={{flex:1,overflowY:'auto',display:'flex',flexDirection:'column',gap:'12px',paddingRight:'4px'}}>
          {messages.map((m,i)=>(<div key={i} style={{display:'flex',justifyContent:m.role==='user'?'flex-end':'flex-start'}}><div style={{maxWidth:'70%',padding:'12px 16px',borderRadius:'16px',fontSize:'13px',lineHeight:'1.6',background:m.role==='user'?`linear-gradient(135deg,${P},${PL})`:'rgba(255,255,255,0.07)',color:'#fff',border:m.role==='user'?'none':'1px solid rgba(255,255,255,0.08)',fontFamily:"'Space Grotesk',sans-serif"}}>{m.content}</div></div>))}
          {loading&&<div style={{display:'flex',justifyContent:'flex-start'}}><div style={{background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.08)',padding:'12px 16px',borderRadius:'16px',display:'flex',gap:'5px',alignItems:'center'}}>{[0,1,2].map(i=><div key={i} style={{width:'7px',height:'7px',background:PL,borderRadius:'50%',animation:`bounce 1.2s ease-in-out ${i*0.15}s infinite`}}/>)}</div></div>}
          <div ref={bottomRef}/>
        </div>
        <div style={{display:'flex',gap:'12px',marginTop:'16px',paddingTop:'16px',borderTop:'1px solid rgba(255,255,255,0.06)'}}>
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder="Escribe tu pregunta..." style={{flex:1,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'12px',padding:'12px 16px',color:'#fff',fontFamily:"'Space Grotesk',sans-serif",fontSize:'13px',outline:'none'}}/>
          <Btn3D small onClick={send} disabled={loading||!input.trim()}><Send size={14}/></Btn3D>
        </div>
      </Card>
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

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
type Screen = 'landing' | 'login' | 'app';

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

  const handleLogin = (u: any) => { setUser(u); setScreen('app'); };
  const handleLogout = () => { localStorage.removeItem('im_token'); setUser(null); setScreen('landing'); };

  if (screen === 'landing') return <LandingPage onEnter={() => setScreen('login')} />;
  if (screen === 'login') return <LoginPage onLogin={handleLogin} onBack={() => setScreen('landing')} />;

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': return <DashboardPage />;
      case 'catalog': return <CatalogPage />;
      case 'royalties': return <RoyaltiesPage />;
      case 'ai-chat': return <AIChatPage />;
      default: return <GenericPage moduleId={activePage} />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#050505' }}>
      <div style={{ position: 'fixed', inset: 0, backgroundImage: `linear-gradient(rgba(94,23,235,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(94,23,235,0.03) 1px, transparent 1px)`, backgroundSize: '48px 48px', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', top: '-200px', left: '-200px', width: '600px', height: '600px', background: `radial-gradient(circle, rgba(94,23,235,0.06) 0%, transparent 70%)`, pointerEvents: 'none', zIndex: 0 }} />
      <Sidebar active={activePage} onNav={setActivePage} user={user} onLogout={handleLogout} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div style={{ marginLeft: `${SIDEBAR_W}px`, position: 'relative', zIndex: 1 }}>
        <div style={{ position: 'sticky', top: 0, background: 'rgba(5,5,5,0.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '12px 32px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <Bell size={17} color="rgba(255,255,255,0.28)" style={{ cursor: 'pointer' }} />
            <div style={{ width: '30px', height: '30px', background: `rgba(94,23,235,0.18)`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid rgba(94,23,235,0.28)` }}><UserIcon size={13} color={PL} /></div>
          </div>
        </div>
        <AnimatePresence mode="wait">
          <motion.main key={activePage} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.14 }}>
            {renderPage()}
          </motion.main>
        </AnimatePresence>
      </div>
      <style>{`
        @keyframes marqueeScroll { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-track{background:#000} ::-webkit-scrollbar-thumb{background:${P};border-radius:4px}
        input::placeholder,textarea::placeholder{color:rgba(255,255,255,0.2)}
        select{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);color:#fff}
        select option{background:#1a1a1a}
      `}</style>
    </div>
  );
}
