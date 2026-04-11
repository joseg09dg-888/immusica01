import React, { useState, useEffect, useRef } from 'react';
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
  ArrowRight, Disc, Headphones, TrendingDown, Shield,
  Download, FileText, ExternalLink, Copy, RefreshCw,
  Calendar, Clock, Eye, X, Edit2, ToggleLeft, ToggleRight,
  FileAudio, FileVideo, FileImage, Percent
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
  const [hovered, setHovered] = useState(false);
  const bg = variant === 'danger' ? '#7f1d1d' : variant === 'ghost' ? 'rgba(255,255,255,0.07)' : P;
  let shadow: string;
  if (variant === 'primary') {
    if (pressed)  shadow = `0 2px 0 #2D0B6B, 0 0 12px rgba(94,23,235,0.3)`;
    else if (hovered) shadow = `0 4px 0 #2D0B6B, 0 0 30px rgba(94,23,235,0.5), 0 0 60px rgba(94,23,235,0.2)`;
    else          shadow = `0 6px 0 #2D0B6B, 0 0 20px rgba(94,23,235,0.3)`;
  } else if (variant === 'danger') {
    shadow = `0 ${pressed ? '1px' : hovered ? '3px' : '4px'} 0 rgba(80,0,0,0.9)`;
  } else {
    shadow = pressed ? `0 1px 0 rgba(0,0,0,0.8)` : hovered ? `0 0 20px rgba(94,23,235,0.3), 0 3px 0 rgba(0,0,0,0.5)` : `0 3px 0 rgba(0,0,0,0.6)`;
  }
  let translateY = '0';
  if (pressed)  translateY = '6px';
  else if (hovered) translateY = '-3px';

  return (
    <button type={type} onClick={onClick} disabled={disabled}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => { setPressed(false); }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setPressed(false); setHovered(false); }}
      style={{
        background: bg, color: '#fff',
        border: variant === 'ghost' ? '1px solid rgba(255,255,255,0.18)' : 'none',
        borderRadius: '14px',
        padding: small ? '10px 22px' : '15px 36px',
        minHeight: small ? '40px' : '52px',
        minWidth: small ? '80px' : '160px',
        fontFamily: "'Anton', sans-serif",
        letterSpacing: '0.15em',
        textTransform: 'uppercase',
        fontSize: small ? '11px' : '13px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        display: 'inline-flex', alignItems: 'center', justifyContent: fullWidth ? 'center' : undefined,
        gap: '8px',
        transform: `translateY(${translateY})`,
        boxShadow: shadow,
        transition: pressed
          ? 'transform 0.06s ease, box-shadow 0.06s ease'
          : `transform 0.35s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s ease`,
        width: fullWidth ? '100%' : undefined,
        whiteSpace: 'nowrap',
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
  {
    name: 'FREE', price: 'GRATIS', cop: '$0 COP', period: '/mes',
    features: ['3 lanzamientos/año', 'Spotify + Apple Music', 'Estadísticas básicas', 'Soporte por email'],
    cta: 'EMPEZAR GRATIS', featured: false,
  },
  {
    name: 'INDIE', price: '$37.000', cop: 'COP/mes', period: '/mes',
    features: ['Lanzamientos ilimitados', '+150 plataformas', 'Analytics avanzado', 'Splits automáticos', 'Marketing IA'],
    cta: 'EMPEZAR AHORA', featured: false,
  },
  {
    name: 'PRO', price: '$119.000', cop: 'COP/mes', period: '/mes',
    features: ['Todo lo de INDIE', 'Publishing completo', 'Spotlight premium', 'Store Maximizer', 'Financiamiento', 'Soporte 24/7 prioritario'],
    cta: 'IR AL PRO', featured: true,
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

function LandingPage({ onEnter }: { onEnter: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const cursorDotRef = useRef<HTMLDivElement>(null);
  const cursorRingRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

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

  // Cursor dot: direct DOM mutation — zero React re-renders
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (cursorDotRef.current) {
        cursorDotRef.current.style.left = `${e.clientX - 4}px`;
        cursorDotRef.current.style.top = `${e.clientY - 4}px`;
      }
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  // Cursor ring: lag via RAF, direct DOM mutation — zero React re-renders
  useEffect(() => {
    let target = { x: -100, y: -100 };
    const pos = { x: -100, y: -100 };
    const onMove = (e: MouseEvent) => { target = { x: e.clientX, y: e.clientY }; };
    window.addEventListener('mousemove', onMove, { passive: true });
    let rafId: number;
    const loop = () => {
      pos.x += (target.x - pos.x) * 0.12;
      pos.y += (target.y - pos.y) * 0.12;
      if (cursorRingRef.current) {
        cursorRingRef.current.style.left = `${pos.x - 18}px`;
        cursorRingRef.current.style.top = `${pos.y - 18}px`;
      }
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(rafId); window.removeEventListener('mousemove', onMove); };
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
    <div style={{ minHeight: '100vh', background: '#020202', color: '#fff', overflowX: 'hidden', cursor: 'none' }}>
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

        * { box-sizing: border-box; cursor: none !important; }
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

      {/* ── CUSTOM CURSOR — refs only, no React state ── */}
      <div ref={cursorDotRef} style={{ position: 'fixed', left: '-100px', top: '-100px', width: '8px', height: '8px', background: '#fff', borderRadius: '50%', pointerEvents: 'none', zIndex: 99999, mixBlendMode: 'difference' }} />
      <div ref={cursorRingRef} style={{ position: 'fixed', left: '-100px', top: '-100px', width: '36px', height: '36px', border: `1.5px solid rgba(94,23,235,0.8)`, borderRadius: '50%', pointerEvents: 'none', zIndex: 99998 }} />

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
          {[['Servicios','#servicios'], ['Precios','#precios'], ['Artistas','#artistas']].map(([l, href]) => (
            <a key={l} href={href} style={{ color: 'rgba(255,255,255,0.45)', fontSize: '11px', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', cursor: 'pointer', transition: 'color 0.2s', textDecoration: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#F2EDE5')} onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}>
              {l}
            </a>
          ))}
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
        {/* Pure CSS background — zero WebGL, zero JS overhead */}
        <div style={{ position: 'absolute', inset: 0, background: "radial-gradient(ellipse 80% 60% at 20% 50%, rgba(94,23,235,0.25) 0%, transparent 60%), radial-gradient(ellipse 60% 80% at 80% 20%, rgba(123,63,255,0.15) 0%, transparent 60%), #000", pointerEvents: 'none' }} />

        <div className="landing-hero-grid" style={{ maxWidth: '1340px', margin: '0 auto', width: '100%', display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '80px', alignItems: 'center', position: 'relative' }}>
          {/* Left: text */}
          <div>
            {/* Badge */}
            <div className="hero-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(94,23,235,0.14)', border: '1px solid rgba(94,23,235,0.4)', borderRadius: '100px', padding: '8px 20px', marginBottom: '36px' }}>
              <div style={{ width: '7px', height: '7px', background: '#22c55e', borderRadius: '50%', animation: 'pulse 1.5s ease-in-out infinite', flexShrink: 0 }} />
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '11px', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: PL }}>Plataforma activa — 50K+ artistas</span>
            </div>

            {/* Headline — staggered animation */}
            <h1 className="landing-hero-h1" style={{ fontFamily: "'Anton', sans-serif", fontSize: 'clamp(3.5rem, 7vw, 6rem)', lineHeight: 0.92, margin: '0 0 28px', letterSpacing: '-0.01em' }}>
              <span className="hero-line-1" style={{ display: 'block', color: '#F2EDE5' }}>DISTRIBUYE.</span>
              <span className="hero-line-2" style={{ display: 'block', background: `linear-gradient(130deg, ${P} 0%, ${PL} 50%, #C084FC 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>MONETIZA.</span>
              <span className="hero-line-3" style={{ display: 'block', color: '#F2EDE5' }}>DOMINA.</span>
            </h1>

            {/* Rotating tagline */}
            <div className="hero-body" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', fontFamily: "'Space Grotesk', sans-serif", fontSize: '14px', fontWeight: 600, letterSpacing: '0.06em' }}>
              <span style={{ color: PL, fontSize: '12px' }}>▸</span>
              <RotatingText
                texts={['DISTRIBUCIÓN EN 150+ PLATAFORMAS', 'REGALÍAS EN TIEMPO REAL', 'MARKETING CON IA', 'SPLITS AUTOMÁTICOS', 'PUBLISHING & REGISTRO']}
                rotationInterval={2500} splitBy="words" staggerDuration={0.04} staggerFrom="first"
                style={{ color: 'rgba(242,237,229,0.55)', fontFamily: "'Space Grotesk', sans-serif", fontSize: '13px', letterSpacing: '0.06em' }}
              />
            </div>

            <p className="hero-body" style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '17px', color: 'rgba(242,237,229,0.5)', lineHeight: 1.75, margin: '0 0 44px', maxWidth: '480px' }}>
              La plataforma todo-en-uno para artistas independientes. Distribución en 150+ tiendas, regalías en tiempo real, marketing con IA y herramientas de crecimiento profesional.
            </p>

            <div className="hero-cta landing-hero-cta" style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '52px', flexWrap: 'wrap' }}>
              <Magnet padding={60} magnetStrength={3}>
                <Btn3D onClick={onEnter}>COMENZAR GRATIS <ArrowRight size={16} /></Btn3D>
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
      <section className="landing-stats-section" style={{ background: `linear-gradient(135deg, rgba(94,23,235,0.12) 0%, rgba(45,11,107,0.18) 100%)`, borderTop: '1px solid rgba(94,23,235,0.2)', borderBottom: '1px solid rgba(94,23,235,0.2)', padding: '64px 48px', position: 'relative', zIndex: 1, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '600px', height: '300px', background: `radial-gradient(ellipse, rgba(94,23,235,0.12) 0%, transparent 70%)`, pointerEvents: 'none' }} />
        <div className="landing-stats-grid" style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0', position: 'relative' }}>
          {[
            { end: 150, suffix: '+', label: 'Plataformas globales', icon: Globe },
            { end: 50, suffix: 'K+', label: 'Artistas activos', icon: Users },
            { end: 2, suffix: 'M+', prefix: '$', label: 'En regalías pagadas', icon: DollarSign },
            { end: 98, suffix: '%', label: 'Tasa de satisfacción', icon: Star },
          ].map((stat, i) => (
            <div key={i} className={`reveal reveal-delay-${i + 1}`} style={{ textAlign: 'center', padding: '0 24px', borderRight: i < 3 ? '1px solid rgba(94,23,235,0.2)' : 'none' }}>
              <stat.icon size={22} color={PL} style={{ marginBottom: '14px', display: 'block', margin: '0 auto 14px' }} />
              <div style={{ fontFamily: "'Anton', sans-serif", fontSize: 'clamp(2.5rem, 4vw, 3.75rem)', color: '#F2EDE5', letterSpacing: '-0.02em', lineHeight: 1, marginBottom: '10px' }}>
                {stat.prefix || ''}<CountUp end={stat.end} suffix={stat.suffix} duration={2000} />
              </div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── SERVICES ── */}
      <section id="servicios" className="landing-section-padding" style={{ padding: '120px 48px', position: 'relative', zIndex: 1 }}>
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
            <ServiceCard key={i} icon={s.icon} title={s.title} desc={s.desc} />
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
      <section id="precios" className="landing-section-padding" style={{ padding: '120px 48px', position: 'relative', zIndex: 1 }}>
        {/* Glow behind section */}
        <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translateX(-50%)', width: '900px', height: '500px', background: 'radial-gradient(ellipse, rgba(94,23,235,0.1) 0%, transparent 65%)', pointerEvents: 'none' }} />
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

      {/* ── CTA FINAL ── */}
      <section className="landing-section-padding" style={{ padding: '120px 48px', position: 'relative', zIndex: 1, textAlign: 'center' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '800px', height: '400px', background: `radial-gradient(ellipse, rgba(94,23,235,0.18) 0%, transparent 70%)`, pointerEvents: 'none' }} />
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

function PlanCard({ plan, onSelect }: { key?: React.Key; plan: typeof PLANS[0]; onSelect: (el?: HTMLElement) => void }) {
  const [hover, setHover] = useState(false);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const cardRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ rx: -y * 10, ry: x * 10 });
  };

  return (
    <div className={`reveal reveal-delay-${plan.name === 'FREE' ? 1 : plan.name === 'INDIE' ? 2 : 3}`} style={{ perspective: '800px' }}>
      <div
        ref={cardRef}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => { setHover(false); setTilt({ rx: 0, ry: 0 }); }}
        onMouseMove={handleMouseMove}
        className={plan.featured ? 'featured-plan' : ''}
        style={{
          background: plan.featured
            ? `linear-gradient(160deg, rgba(94,23,235,0.25) 0%, rgba(123,63,255,0.15) 50%, rgba(94,23,235,0.1) 100%)`
            : 'rgba(255,255,255,0.03)',
          border: `1px solid ${plan.featured ? 'rgba(94,23,235,0.7)' : hover ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.07)'}`,
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
        {plan.featured && (
          <div style={{ position: 'absolute', top: '16px', right: '16px', background: `linear-gradient(135deg, ${P}, ${PL})`, padding: '5px 14px', borderRadius: '100px', fontFamily: "'Anton', sans-serif", fontSize: '10px', letterSpacing: '0.2em', color: '#fff', boxShadow: `0 0 20px rgba(94,23,235,0.6)`, zIndex: 1 }}>
            MÁS POPULAR
          </div>
        )}
        {plan.featured && (
          <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 50% 0%, rgba(94,23,235,0.2) 0%, transparent 65%)`, pointerEvents: 'none' }} />
        )}
        <p style={{ fontFamily: "'Anton', sans-serif", fontSize: '13px', color: plan.featured ? '#C084FC' : PL, letterSpacing: '0.25em', margin: '0 0 16px' }}>{plan.name}</p>
        <div style={{ marginBottom: '4px' }}>
          <span style={{ fontFamily: "'Anton', sans-serif", fontSize: plan.price === 'GRATIS' ? '44px' : '40px', color: '#F2EDE5', letterSpacing: '-0.02em', textShadow: plan.featured ? `0 0 40px rgba(94,23,235,0.6)` : 'none' }}>{plan.price}</span>
        </div>
        <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.35)', margin: '0 0 20px', letterSpacing: '0.05em' }}>{plan.cop}</p>
        <div style={{ height: '1px', background: plan.featured ? `linear-gradient(90deg, transparent, rgba(94,23,235,0.5), transparent)` : 'rgba(255,255,255,0.06)', margin: '0 0 20px' }} />
        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px' }}>
          {plan.features.map((f, i) => (
            <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 0', fontFamily: "'Space Grotesk', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
              <Check size={15} color={plan.featured ? '#C084FC' : PL} style={{ flexShrink: 0 }} />{f}
            </li>
          ))}
        </ul>
        <div ref={btnRef}>
          <Btn3D fullWidth variant={plan.featured ? 'primary' : 'ghost'} onClick={() => onSelect(btnRef.current ?? undefined)}>{plan.cta}</Btn3D>
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
      const data = await apiFetch(`/auth/${tab}`, { method: 'POST', body: JSON.stringify(body) });
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

// ─── SHARED INPUT STYLE ───────────────────────────────────────────────────────
const IS: React.CSSProperties = { background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'10px', padding:'10px 14px', color:'#fff', fontFamily:"'Space Grotesk',sans-serif", fontSize:'13px', outline:'none', width:'100%' };
function EmptyState({ icon: Icon, text }: { icon: any; text: string }) {
  return <div style={{ textAlign:'center', padding:'48px 24px' }}><Icon size={32} color="rgba(255,255,255,0.1)" style={{ marginBottom:'12px' }} /><p style={{ color:'rgba(255,255,255,0.2)', fontFamily:"'Space Grotesk',sans-serif", fontSize:'13px', margin:0 }}>{text}</p></div>;
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
    try { await apiFetch('/publishing', { method:'POST', body: JSON.stringify(form) }); setForm({ title:'', composers:'', splits:'', iswc:'' }); setShowForm(false); load(); } catch {}
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
    try { await apiFetch('/releases', { method:'POST', body: JSON.stringify(form) }); setForm({ title:'', release_date:'', platforms:'Spotify,Apple Music,YouTube', status:'draft' }); setShowForm(false); load(); } catch {}
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
  const [videos, setVideos] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title:'', description:'' });
  const [loading, setLoading] = useState(false);
  const load = () => apiFetch('/videos').then(d => setVideos(Array.isArray(d) ? d : [])).catch(() => {});
  useEffect(() => { load(); }, []);
  const save = async () => {
    if (!form.title) return; setLoading(true);
    try { await apiFetch('/videos', { method:'POST', body: JSON.stringify(form) }); setForm({ title:'', description:'' }); setShowForm(false); load(); } catch {}
    setLoading(false);
  };
  return (
    <PageShell title="Videos" action={<Btn3D small onClick={() => setShowForm(!showForm)}><Plus size={13}/> Subir video</Btn3D>}>
      {showForm && <Card style={{ marginBottom:'20px' }}>
        <div style={{ display:'flex', flexDirection:'column', gap:'10px', marginBottom:'10px' }}>
          <input style={IS} placeholder="Título del video" value={form.title} onChange={e => setForm(f=>({...f,title:e.target.value}))} />
          <textarea style={{...IS, resize:'vertical', minHeight:'72px'}} placeholder="Descripción" value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))} />
          <div style={{ border:'2px dashed rgba(255,255,255,0.1)', borderRadius:'10px', padding:'24px', textAlign:'center', color:'rgba(255,255,255,0.25)', fontSize:'13px', fontFamily:"'Space Grotesk',sans-serif" }}><Upload size={20} style={{ marginBottom:'8px', display:'block', margin:'0 auto 8px' }}/> Arrastra el archivo de video aquí</div>
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
            <div style={{ height:'120px', background:'rgba(94,23,235,0.08)', display:'flex', alignItems:'center', justifyContent:'center', borderRadius:'20px 20px 0 0' }}><Video size={32} color="rgba(255,255,255,0.15)"/></div>
            <div style={{ padding:'14px' }}>
              <p style={{ color:'#fff', fontSize:'13px', fontWeight:600, margin:'0 0 4px', fontFamily:"'Space Grotesk',sans-serif" }}>{v.title}</p>
              <p style={{ color:'rgba(255,255,255,0.3)', fontSize:'11px', margin:0, fontFamily:"'Space Grotesk',sans-serif" }}>{v.description||'Sin descripción'}</p>
              <div style={{ marginTop:'10px' }}><Badge color="#22c55e" label={v.status||'pendiente'}/></div>
            </div>
          </Card>
        ))}
      </div>
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
  const archKey = `${answers[0]??'x'}-${answers[1]??'x'}`;
  const arch = ARCHETYPES[archKey] || ARCHETYPES.default;
  const answer = (idx: number) => {
    const next = [...answers]; next[current]=idx; setAnswers(next);
    if (current < ARCHETYPE_Q.length-1) setCurrent(c=>c+1);
    else setStep('results');
  };
  const genPlan = async () => {
    setLoadingPlan(true); setStep('plan');
    try { const d = await apiFetch('/ai/chat', { method:'POST', body: JSON.stringify({ message:`Genera un plan de contenido de 30 días para un artista con arquetipo "${arch.name}". Devuelve JSON array con {week,day,type,action}.`, history:[] }) }); const text = d.response||''; const match = text.match(/\[[\s\S]*\]/); if (match) { try { setPlan30(JSON.parse(match[0])); } catch { setPlan30(arch.plan.map((p,i)=>({week:1,day:i+1,type:'Post',action:p}))); } } else { setPlan30(arch.plan.map((p,i)=>({week:1,day:i+1,type:'Post',action:p}))); } } catch { setPlan30(arch.plan.map((p,i)=>({week:1,day:i+1,type:'Post',action:p}))); }
    setLoadingPlan(false);
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
                <div style={{ width:'28px', height:'28px', background:`rgba(94,23,235,0.2)`, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><UserIcon size={12} color={PL}/></div>
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
function MarketplacePage() {
  const [beats, setBeats] = useState<any[]>([]);
  const [playing, setPlaying] = useState<number|null>(null);
  useEffect(() => { apiFetch('/marketplace/beats').then(d=>setBeats(Array.isArray(d)?d:[])).catch(()=>{}); }, []);
  const DEMO_BEATS = [
    { id:1, title:'Dark Trap 140bpm', producer:'ProducerX', price:49900, genre:'Trap', bpm:140 },
    { id:2, title:'Reggaeton Loop Vol.3', producer:'BeatMaker', price:39900, genre:'Reggaeton', bpm:95 },
    { id:3, title:'Afrobeats Groove', producer:'AfroStudio', price:59900, genre:'Afrobeats', bpm:108 },
    { id:4, title:'Sad Piano RnB', producer:'EmotionBeat', price:44900, genre:'R&B', bpm:75 },
    { id:5, title:'Cumbia Electrónica', producer:'LaBocha', price:34900, genre:'Cumbia', bpm:120 },
    { id:6, title:'Perreo Intenso', producer:'UrbanProd', price:54900, genre:'Reggaeton', bpm:100 },
  ];
  const list = beats.length>0 ? beats : DEMO_BEATS;
  return (
    <PageShell title="Marketplace de Beats">
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:'16px' }}>
        {list.map(b=>(
          <Card key={b.id} style={{ position:'relative' }}>
            <div style={{ height:'80px', background:`linear-gradient(135deg,rgba(94,23,235,0.15),rgba(123,63,255,0.1))`, borderRadius:'12px', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'14px', position:'relative', overflow:'hidden' }}>
              {[...Array(12)].map((_,i)=><div key={i} style={{ width:'3px', background:playing===b.id?PL:'rgba(255,255,255,0.15)', borderRadius:'3px', height:`${20+Math.random()*40}px`, margin:'0 2px', animation: playing===b.id?`waveBar ${0.8+Math.random()*0.6}s ease-in-out ${i*0.06}s infinite`:'none' }}/>)}
              <button onClick={()=>setPlaying(playing===b.id?null:b.id)} style={{ position:'absolute', width:'36px', height:'36px', background:`rgba(94,23,235,0.9)`, border:'none', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', boxShadow:`0 0 20px rgba(94,23,235,0.5)` }}>{playing===b.id?<div style={{ width:'10px', height:'10px', background:'#fff', borderRadius:'2px' }}/>:<Play size={14} color="#fff" style={{ marginLeft:'2px' }}/>}</button>
            </div>
            <p style={{ color:'#fff', fontSize:'14px', fontWeight:600, margin:'0 0 3px', fontFamily:"'Space Grotesk',sans-serif" }}>{b.title}</p>
            <p style={{ color:'rgba(255,255,255,0.35)', fontSize:'11px', margin:'0 0 12px', fontFamily:"'Space Grotesk',sans-serif" }}>{b.producer} · {b.genre} · {b.bpm} BPM</p>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontFamily:"'Anton',sans-serif", fontSize:'18px', color:PL }}>${(b.price/100).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g,'.')}<span style={{ fontSize:'11px', color:'rgba(255,255,255,0.3)', fontFamily:"'Space Grotesk',sans-serif" }}> COP</span></span>
              <Btn3D small><ShoppingBag size={12}/> Comprar</Btn3D>
            </div>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}

// ─── SPLITS ───────────────────────────────────────────────────────────────────
function SplitsPage() {
  const [splits, setSplits] = useState<any[]>([]);
  const [tracks, setTracks] = useState<any[]>([]);
  const [selectedTrack, setSelectedTrack] = useState('');
  const [form, setForm] = useState({ name:'', email:'', percentage:'' });
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    apiFetch('/splits').then(d=>setSplits(Array.isArray(d)?d:[])).catch(()=>{});
    apiFetch('/tracks').then(d=>setTracks(Array.isArray(d)?d:[])).catch(()=>{});
  }, []);
  const add = async () => {
    if (!form.name||!form.percentage) return; setLoading(true);
    try { const d = await apiFetch('/splits', { method:'POST', body: JSON.stringify({ ...form, track_id: selectedTrack }) }); setSplits(s=>[...s,d]); setForm({ name:'', email:'', percentage:'' }); } catch {}
    setLoading(false);
  };
  const bySplit = splits.reduce((acc:any,s:any)=>{ const k=s.track_id||'general'; if(!acc[k])acc[k]=[]; acc[k].push(s); return acc; }, {});
  return (
    <PageShell title="Splits de Regalías">
      <div style={{ display:'grid', gridTemplateColumns:'340px 1fr', gap:'20px' }}>
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
              <div style={{ position:'relative' }}>
                <input style={IS} placeholder="Porcentaje" type="number" min="0" max="100" value={form.percentage} onChange={e=>setForm(f=>({...f,percentage:e.target.value}))}/>
                <Percent size={13} color="rgba(255,255,255,0.3)" style={{ position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)' }}/>
              </div>
              <Btn3D small onClick={add} disabled={loading} fullWidth>{loading?'Guardando...':'Agregar split'}</Btn3D>
            </div>
          </Card>
          <Card style={{ background:'rgba(94,23,235,0.08)', border:'1px solid rgba(94,23,235,0.2)' }}>
            <p style={{ color:'rgba(255,255,255,0.35)', fontSize:'11px', fontFamily:"'Space Grotesk',sans-serif", lineHeight:1.6, margin:0 }}>💡 Los splits se calculan automáticamente. La suma de porcentajes no debe superar 100%.</p>
          </Card>
        </div>
        <Card>
          <h3 style={{ fontFamily:"'Anton',sans-serif", fontSize:'13px', color:'#fff', letterSpacing:'0.06em', margin:'0 0 16px' }}>SPLITS ACTIVOS</h3>
          {splits.length===0 && <EmptyState icon={Users} text="Sin splits. Agrega colaboradores para dividir regalías." />}
          {Object.entries(bySplit).map(([trackId, trackSplits]:any)=>(
            <div key={trackId} style={{ marginBottom:'20px' }}>
              <p style={{ color:PL, fontSize:'11px', fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, textTransform:'uppercase', letterSpacing:'0.12em', margin:'0 0 10px' }}>{tracks.find(t=>String(t.id)===trackId)?.title||'General'}</p>
              {trackSplits.map((s:any,i:number)=>(
                <div key={i} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ width:'32px', height:'32px', background:'rgba(94,23,235,0.12)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><UserIcon size={13} color={PL}/></div>
                  <div style={{ flex:1 }}><p style={{ color:'#fff', fontSize:'13px', margin:0, fontFamily:"'Space Grotesk',sans-serif" }}>{s.name}</p><p style={{ color:'rgba(255,255,255,0.3)', fontSize:'11px', margin:0, fontFamily:"'Space Grotesk',sans-serif" }}>{s.email||'Sin email'}</p></div>
                  <div style={{ fontFamily:"'Anton',sans-serif", fontSize:'20px', color:PL }}>{s.percentage}%</div>
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
            <div style={{ width:'38px', height:'38px', background:'rgba(94,23,235,0.12)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><UserIcon size={15} color={PL}/></div>
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
function FeedbackPage() {
  const [list, setList] = useState<any[]>([]);
  const [form, setForm] = useState({ category:'bug', subject:'', message:'' });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const load = () => apiFetch('/feedback').then(d=>setList(Array.isArray(d)?d:[])).catch(()=>{});
  useEffect(() => { load(); }, []);
  const submit = async () => {
    if (!form.subject||!form.message) return; setLoading(true);
    try { await apiFetch('/feedback', { method:'POST', body: JSON.stringify(form) }); setForm({ category:'bug', subject:'', message:'' }); setSent(true); setTimeout(()=>setSent(false),3000); load(); } catch {}
    setLoading(false);
  };
  const catColor: Record<string,string> = { bug:'#ef4444', feature:'#3b82f6', improvement:'#22c55e', other:'#71717a' };
  return (
    <PageShell title="Feedback">
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px' }}>
        <Card>
          <h3 style={{ fontFamily:"'Anton',sans-serif", fontSize:'14px', color:'#fff', letterSpacing:'0.06em', margin:'0 0 16px' }}>ENVIAR FEEDBACK</h3>
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            <select style={IS} value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>
              <option value="bug">🐛 Bug / Error</option>
              <option value="feature">✨ Nueva función</option>
              <option value="improvement">⚡ Mejora</option>
              <option value="other">💬 Otro</option>
            </select>
            <input style={IS} placeholder="Asunto" value={form.subject} onChange={e=>setForm(f=>({...f,subject:e.target.value}))}/>
            <textarea style={{...IS,resize:'vertical',minHeight:'120px'}} placeholder="Describe tu feedback..." value={form.message} onChange={e=>setForm(f=>({...f,message:e.target.value}))}/>
            <Btn3D onClick={submit} disabled={loading||!form.subject||!form.message}>{loading?'Enviando...':sent?<><Check size={14}/> ¡Enviado!</>:<><Send size={14}/> Enviar feedback</>}</Btn3D>
          </div>
        </Card>
        <Card>
          <h3 style={{ fontFamily:"'Anton',sans-serif", fontSize:'14px', color:'#fff', letterSpacing:'0.06em', margin:'0 0 16px' }}>MIS REPORTES</h3>
          {list.length===0 && <EmptyState icon={Star} text="Sin reportes enviados." />}
          {list.map(fb=>(
            <div key={fb.id} style={{ padding:'12px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'4px' }}><p style={{ color:'#fff', fontSize:'13px', fontWeight:600, margin:0, fontFamily:"'Space Grotesk',sans-serif" }}>{fb.subject}</p><Badge color={catColor[fb.category]||'#71717a'} label={fb.category}/></div>
              <p style={{ color:'rgba(255,255,255,0.4)', fontSize:'12px', margin:0, fontFamily:"'Space Grotesk',sans-serif", lineHeight:1.5 }}>{fb.message}</p>
            </div>
          ))}
        </Card>
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
function PlaylistsPage() {
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [tracks, setTracks] = useState<any[]>([]);
  const [genre, setGenre] = useState('');
  const [mood, setMood] = useState('');
  const [modal, setModal] = useState<any>(null);
  const [selTrack, setSelTrack] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [submitMsg, setSubmitMsg] = useState('');
  useEffect(() => {
    apiFetch('/playlists').then(d=>setPlaylists(Array.isArray(d)?d:[])).catch(()=>{});
    apiFetch('/tracks').then(d=>setTracks(Array.isArray(d)?d:[])).catch(()=>{});
  }, []);
  const submit = async () => {
    if (!selTrack||!modal) return; setSubmitting(true);
    try {
      await apiFetch('/playlists/submit', { method:'POST', body: JSON.stringify({ playlist_id: modal.id, track_id: selTrack }) });
      const track = tracks.find(t=>String(t.id)===selTrack);
      setHistory(h=>[{ playlist: modal.name||modal.title, track: track?.title||'Track', date: new Date().toLocaleDateString('es-CO'), status:'Enviado' }, ...h]);
      setSubmitMsg('¡Track enviado correctamente!');
    } catch(e:any) { setSubmitMsg(`Error: ${e.message}`); }
    setSubmitting(false); setModal(null); setSelTrack('');
    setTimeout(()=>setSubmitMsg(''),4000);
  };
  const DEMO_PLAYLISTS = [
    { id:1, name:'Nuevos Talentos Latino', curator:'Spotify Editorial', followers:84200, genre:'Varios', mood:'Hype' },
    { id:2, name:'Trap Colombia 2026', curator:'UrbanPlex', followers:32100, genre:'Trap', mood:'Oscuro' },
    { id:3, name:'Pop Indie Español', curator:'IndieVibes', followers:19800, genre:'Indie', mood:'Alegre' },
    { id:4, name:'Perreo Non-Stop', curator:'ReggaetonHQ', followers:124000, genre:'Reggaeton', mood:'Fiesta' },
    { id:5, name:'Chill R&B Colombia', curator:'SoulCurator', followers:28500, genre:'R&B', mood:'Relajado' },
    { id:6, name:'Beats para Estudiar', curator:'FocusFlow', followers:61000, genre:'Lo-fi', mood:'Concentración' },
  ];
  const list = playlists.length>0 ? playlists : DEMO_PLAYLISTS;
  const filtered = list.filter(p=>{
    const gOk = !genre || (p.genre||'').toLowerCase().includes(genre.toLowerCase());
    const mOk = !mood || (p.mood||'').toLowerCase().includes(mood.toLowerCase());
    return gOk && mOk;
  });
  return (
    <PageShell title="Playlists">
      {submitMsg && <div style={{ background: submitMsg.includes('Error')?'rgba(239,68,68,0.1)':'rgba(34,197,94,0.1)', border:`1px solid ${submitMsg.includes('Error')?'rgba(239,68,68,0.3)':'rgba(34,197,94,0.3)'}`, borderRadius:'10px', padding:'10px 16px', marginBottom:'16px', color: submitMsg.includes('Error')?'#f87171':'#22c55e', fontSize:'13px', fontFamily:"'Space Grotesk',sans-serif" }}>{submitMsg}</div>}
      {/* Filters */}
      <div style={{ display:'flex', gap:'12px', marginBottom:'20px', flexWrap:'wrap' }}>
        <input style={{...IS, maxWidth:'200px'}} placeholder="Filtrar por género..." value={genre} onChange={e=>setGenre(e.target.value)}/>
        <input style={{...IS, maxWidth:'200px'}} placeholder="Filtrar por mood..." value={mood} onChange={e=>setMood(e.target.value)}/>
        <span style={{ color:'rgba(255,255,255,0.3)', fontSize:'12px', fontFamily:"'Space Grotesk',sans-serif", alignSelf:'center' }}>{filtered.length} playlists</span>
      </div>
      {/* Grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:'16px', marginBottom:'28px' }}>
        {filtered.length===0 && <Card style={{ gridColumn:'1/-1' }}><EmptyState icon={Play} text="No hay playlists con esos filtros." /></Card>}
        {filtered.map(pl=>(
          <Card key={pl.id}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'12px' }}>
              <div style={{ width:'44px', height:'44px', background:`linear-gradient(135deg,${P},${PL})`, borderRadius:'12px', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><Play size={18} color="#fff" style={{ marginLeft:'2px' }}/></div>
              <div style={{ display:'flex', gap:'4px', flexWrap:'wrap', justifyContent:'flex-end' }}>
                {pl.genre && <Badge color={PL} label={pl.genre}/>}
                {pl.mood && <Badge color="#f59e0b" label={pl.mood}/>}
              </div>
            </div>
            <p style={{ color:'#fff', fontSize:'14px', fontWeight:600, margin:'0 0 3px', fontFamily:"'Space Grotesk',sans-serif" }}>{pl.name||pl.title}</p>
            <p style={{ color:'rgba(255,255,255,0.35)', fontSize:'11px', margin:'0 0 4px', fontFamily:"'Space Grotesk',sans-serif" }}>por {pl.curator||pl.owner||'Curador'}</p>
            <div style={{ display:'flex', alignItems:'center', gap:'5px', marginBottom:'14px' }}>
              <Users size={11} color="rgba(255,255,255,0.3)"/>
              <span style={{ color:'rgba(255,255,255,0.3)', fontSize:'11px', fontFamily:"'Space Grotesk',sans-serif" }}>{(pl.followers||0).toLocaleString()} seguidores</span>
            </div>
            <Btn3D small onClick={()=>setModal(pl)}>Enviar track</Btn3D>
          </Card>
        ))}
      </div>
      {/* History */}
      {history.length>0 && <Card>
        <h3 style={{ fontFamily:"'Anton',sans-serif", fontSize:'13px', color:'#fff', letterSpacing:'0.06em', margin:'0 0 14px' }}>HISTORIAL DE ENVÍOS</h3>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontFamily:"'Space Grotesk',sans-serif", fontSize:'12px' }}>
            <thead><tr>{['Playlist','Track','Fecha','Estado'].map(h=><th key={h} style={{ textAlign:'left', color:'rgba(255,255,255,0.3)', padding:'6px 12px 10px 0', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', fontSize:'10px' }}>{h}</th>)}</tr></thead>
            <tbody>{history.map((r,i)=>(
              <tr key={i} style={{ borderTop:'1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding:'10px 12px 10px 0', color:'rgba(255,255,255,0.7)' }}>{r.playlist}</td>
                <td style={{ padding:'10px 12px 10px 0', color:'rgba(255,255,255,0.7)' }}>{r.track}</td>
                <td style={{ padding:'10px 12px 10px 0', color:'rgba(255,255,255,0.3)' }}>{r.date}</td>
                <td style={{ padding:'10px 0' }}><Badge color="#22c55e" label={r.status}/></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </Card>}
      {/* Modal */}
      {modal && (
        <div onClick={()=>setModal(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:'20px' }}>
          <div onClick={e=>e.stopPropagation()} style={{ background:'#0e0e14', border:'1px solid rgba(94,23,235,0.3)', borderRadius:'20px', padding:'28px', width:'100%', maxWidth:'420px', boxShadow:'0 0 60px rgba(94,23,235,0.2)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
              <h3 style={{ fontFamily:"'Anton',sans-serif", fontSize:'16px', color:'#fff', margin:0, letterSpacing:'0.04em' }}>ENVIAR A PLAYLIST</h3>
              <button onClick={()=>setModal(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.3)', padding:'4px' }}><X size={18}/></button>
            </div>
            <p style={{ color:'rgba(255,255,255,0.4)', fontSize:'13px', fontFamily:"'Space Grotesk',sans-serif", margin:'0 0 16px' }}>{modal.name||modal.title}</p>
            <p style={{ color:'rgba(255,255,255,0.35)', fontSize:'11px', fontFamily:"'Space Grotesk',sans-serif", margin:'0 0 6px', textTransform:'uppercase', letterSpacing:'0.1em' }}>Selecciona el track</p>
            <select style={{...IS, marginBottom:'16px'}} value={selTrack} onChange={e=>setSelTrack(e.target.value)}>
              <option value="">Elige un track...</option>
              {tracks.map(t=><option key={t.id} value={t.id}>{t.title}</option>)}
            </select>
            <div style={{ display:'flex', gap:'10px' }}>
              <Btn3D small onClick={submit} disabled={!selTrack||submitting}>{submitting?'Enviando...':'Confirmar envío'}</Btn3D>
              <Btn3D small variant="ghost" onClick={()=>setModal(null)}>Cancelar</Btn3D>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}

// ─── LEGAL IA ─────────────────────────────────────────────────────────────────
function LegalPage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState('');
  const [history, setHistory] = useState<{q:string;a:string;date:string}[]>([]);
  const EXAMPLES = ['¿Qué es un split de regalías?','¿Cómo registro mi música?','Revisar contrato discográfico','¿Qué son los derechos de autor?','¿Puedo usar samples?'];
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
              <p style={{ fontFamily:"'Anton',sans-serif", fontSize:'28px', color:PL, margin:'0 0 2px' }}>{(user?.plan||'FREE').toUpperCase()}</p>
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
      case 'dashboard':      return <DashboardPage />;
      case 'catalog':        return <CatalogPage />;
      case 'royalties':      return <RoyaltiesPage />;
      case 'ai-chat':        return <AIChatPage />;
      case 'publishing':     return <PublishingPage />;
      case 'releases':       return <ReleasesPage />;
      case 'videos':         return <VideosPage />;
      case 'lyrics':         return <LyricsPage />;
      case 'marketing':      return <MarketingPage />;
      case 'spotlight':      return <SpotlightPage />;
      case 'hyperfollow':    return <HyperfollowPage />;
      case 'community':      return <CommunityPage />;
      case 'marketplace':    return <MarketplacePage />;
      case 'splits':         return <SplitsPage />;
      case 'vault':          return <VaultPage />;
      case 'bulk-upload':    return <BulkUploadPage />;
      case 'store-maximizer':return <StoreMaximizerPage />;
      case 'riaa':           return <RIAAPage />;
      case 'team':           return <TeamPage />;
      case 'stats':          return <StatsPage />;
      case 'feedback':       return <FeedbackPage />;
      case 'settings':       return <SettingsPage user={user} />;
      case 'promo-cards':    return <PromoCardsPage />;
      case 'playlists':      return <PlaylistsPage />;
      case 'legal':          return <LegalPage />;
      case 'financing':      return <FinancingPage />;
      default:               return <GenericPage moduleId={activePage} />;
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
