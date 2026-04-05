import React, { useState, useEffect, useRef } from 'react';
import Aurora from './components/Aurora';
import Dither from './components/Dither';
import Magnet from './components/Magnet';
import SpotlightCard from './components/SpotlightCard';
import SplitText from './components/SplitText';
import Particles from './components/Particles';
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

function LandingPage({ onEnter }: { onEnter: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#020202', color: '#fff', overflowX: 'hidden' }}>
      {/* Global styles */}
      <style>{`
        @keyframes rotateCube { 0%{transform:rotateX(-20deg) rotateY(0deg)} 100%{transform:rotateX(-20deg) rotateY(360deg)} }
        @keyframes marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        @keyframes marqueeRev { from{transform:translateX(-50%)} to{transform:translateX(0)} }
        @keyframes floatUp { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-track{background:#000} ::-webkit-scrollbar-thumb{background:${P};border-radius:4px}
        input::placeholder,textarea::placeholder{color:rgba(255,255,255,0.2)}
        select{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);color:#fff}
        select option{background:#1a1a1a}
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes marqueeScroll { from{transform:translateX(0)} to{transform:translateX(-50%)} }
      `}</style>

      {/* Purple grid */}
      <div style={{ position: 'fixed', inset: 0, backgroundImage: `linear-gradient(rgba(94,23,235,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(94,23,235,0.035) 1px, transparent 1px)`, backgroundSize: '56px 56px', pointerEvents: 'none', zIndex: 0 }} />

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
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', padding: '80px 48px 0', position: 'relative', zIndex: 1, overflow: 'hidden' }}>
        {/* Dither WebGL wave background — retro pixel aesthetic */}
        <Dither
          waveColor={[0.37, 0.09, 0.92]}
          disableAnimation={false}
          enableMouseInteraction
          mouseRadius={0.3}
          colorNum={4}
          pixelSize={2}
          waveAmplitude={0.3}
          waveFrequency={3}
          waveSpeed={0.05}
          style={{ opacity: 0.85 }}
        />
        {/* Aurora glow layer on top */}
        <Aurora
          colorStops={['#3a0ca3', '#5E17EB', '#7209b7']}
          amplitude={1.0}
          blend={0.5}
          speed={0.5}
          style={{ top: '0%', height: '100%', opacity: 0.35, mixBlendMode: 'screen' as any }}
        />
        {/* Particles layer */}
        <Particles
          particleCount={100}
          particleSpread={8}
          speed={0.04}
          particleColors={['#5E17EB', '#9B59B6', '#C084FC', '#ffffff']}
          moveParticlesOnHover
          particleHoverFactor={0.5}
          alphaParticles
          particleBaseSize={60}
          style={{ pointerEvents: 'auto', opacity: 0.6 }}
        />
        {/* Ambient glow */}
        <div style={{ position: 'absolute', top: '10%', left: '-100px', width: '500px', height: '500px', background: `radial-gradient(circle, rgba(94,23,235,0.12) 0%, transparent 65%)`, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '30%', right: '-50px', width: '400px', height: '400px', background: `radial-gradient(circle, rgba(123,63,255,0.08) 0%, transparent 65%)`, pointerEvents: 'none' }} />

        <div style={{ maxWidth: '1300px', margin: '0 auto', width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '64px', alignItems: 'center' }}>
          {/* Left: text */}
          <div style={{ animation: 'fadeIn 0.8s ease forwards' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(94,23,235,0.12)', border: '1px solid rgba(94,23,235,0.3)', borderRadius: '100px', padding: '6px 16px', marginBottom: '32px' }}>
              <div style={{ width: '6px', height: '6px', background: '#22c55e', borderRadius: '50%', animation: 'pulse 1.5s ease-in-out infinite' }} />
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '11px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: PL }}>Plataforma activa — 50K+ artistas</span>
            </div>

            <h1 style={{ fontFamily: "'Anton', sans-serif", fontSize: 'clamp(48px, 5.5vw, 80px)', lineHeight: 1.0, margin: '0 0 24px', letterSpacing: '-0.01em' }}>
              <SplitText text="DISTRIBUYE." style={{ display: 'block', color: '#fff' }} charDelay={40} />
              <SplitText text="MONETIZA." delay={400}
                style={{ display: 'block', background: `linear-gradient(135deg, ${P}, ${PL}, #C084FC)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
                charDelay={40}
              />
              <SplitText text="DOMINA." delay={800} style={{ display: 'block', color: '#fff' }} charDelay={40} />
            </h1>

            <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '18px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, margin: '0 0 40px', maxWidth: '460px' }}>
              La plataforma todo-en-uno para artistas independientes. Distribución en 150+ tiendas, regalías en tiempo real, marketing con IA y herramientas de crecimiento profesional.
            </p>

            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '48px' }}>
              <Magnet padding={60} magnetStrength={3}>
                <Btn3D onClick={onEnter}>
                  COMENZAR GRATIS <ArrowRight size={16} />
                </Btn3D>
              </Magnet>
              <Magnet padding={60} magnetStrength={4}>
                <Btn3D variant="ghost" onClick={onEnter}>
                  <Play size={14} /> Ver demo
                </Btn3D>
              </Magnet>
            </div>

            {/* Mini stats — animated counters */}
            <div style={{ display: 'flex', gap: '32px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '32px' }}>
              {STATS.map(s => (
                <div key={s.label}>
                  <p style={{ fontFamily: "'Anton', sans-serif", fontSize: '26px', color: '#fff', margin: 0, letterSpacing: '0.02em' }}>
                    {s.prefix || ''}<AnimatedCounter target={s.num} suffix={s.suffix} />
                  </p>
                  <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '11px', color: 'rgba(255,255,255,0.35)', margin: '2px 0 0', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: 3D cube */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', animation: 'floatUp 6s ease-in-out infinite' }}>
            <RotatingCube />
            {/* Orbiting tags */}
            {[
              { label: '150+ Plataformas', top: '12%', left: '-8%', icon: Globe },
              { label: 'IA Integrada', top: '20%', right: '-5%', icon: Zap },
              { label: 'Pagos Seguros', bottom: '20%', right: '-8%', icon: Shield },
              { label: 'Analytics Pro', bottom: '15%', left: '-5%', icon: BarChart3 },
            ].map((tag, i) => (
              <div key={i} style={{ position: 'absolute', ...({ top: tag.top, left: tag.left, right: tag.right, bottom: tag.bottom } as any), background: 'rgba(10,10,10,0.9)', border: '1px solid rgba(94,23,235,0.35)', borderRadius: '10px', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '7px', backdropFilter: 'blur(12px)', animation: `floatUp ${5 + i}s ease-in-out ${i * 0.8}s infinite`, boxShadow: `0 0 20px rgba(94,23,235,0.15)` }}>
                <tag.icon size={13} color={PL} />
                <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.8)', whiteSpace: 'nowrap' }}>{tag.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MARQUEE ── */}
      <div style={{ marginTop: '80px', position: 'relative', zIndex: 1 }}>
        <Marquee />
        <div style={{ marginTop: '2px' }}><Marquee reverse /></div>
      </div>

      {/* ── SERVICES ── */}
      <section id="servicios" style={{ padding: '120px 48px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '1300px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '72px' }}>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '11px', fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', color: PL, display: 'block', marginBottom: '16px' }}>LO QUE OFRECEMOS</span>
            <h2 style={{ fontFamily: "'Anton', sans-serif", fontSize: 'clamp(36px, 4vw, 60px)', color: '#fff', margin: 0, letterSpacing: '0.01em' }}>
              TODO LO QUE NECESITAS<br />
              <span style={{ background: `linear-gradient(135deg, ${P}, ${PL})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>EN UNA PLATAFORMA</span>
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
            {SERVICES.map((s, i) => (
              <ServiceCard key={i} {...s} />
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="precios" style={{ padding: '120px 48px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '72px' }}>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '11px', fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', color: PL, display: 'block', marginBottom: '16px' }}>PLANES Y PRECIOS</span>
            <h2 style={{ fontFamily: "'Anton', sans-serif", fontSize: 'clamp(36px, 4vw, 56px)', color: '#fff', margin: 0, letterSpacing: '0.01em' }}>ELIGE TU PLAN</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', alignItems: 'center' }}>
            {PLANS.map((plan, i) => (
              <PlanCard key={i} plan={plan} onSelect={onEnter} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section style={{ padding: '120px 48px', position: 'relative', zIndex: 1, textAlign: 'center' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <div style={{ width: '80px', height: '80px', background: `linear-gradient(135deg, ${P}, ${PL})`, borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px', boxShadow: `0 0 60px rgba(94,23,235,0.5)` }}>
            <Music size={36} color="#fff" />
          </div>
          <h2 style={{ fontFamily: "'Anton', sans-serif", fontSize: 'clamp(40px, 5vw, 68px)', color: '#fff', margin: '0 0 20px', letterSpacing: '0.01em' }}>
            EMPIEZA HOY.<br />
            <span style={{ background: `linear-gradient(135deg, ${P}, ${PL})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>ES GRATIS.</span>
          </h2>
          <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '18px', color: 'rgba(255,255,255,0.45)', margin: '0 0 48px' }}>Sin tarjeta de crédito. Sin contratos. Cancela cuando quieras.</p>
          <Magnet padding={60} magnetStrength={2}>
            <Btn3D onClick={onEnter}>
              CREAR CUENTA GRATIS <ArrowRight size={16} />
            </Btn3D>
          </Magnet>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '40px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '24px', height: '24px', background: P, borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Music size={12} color="#fff" /></div>
          <span style={{ fontFamily: "'Anton', sans-serif", fontSize: '14px', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.4)' }}>IM MUSIC © 2026</span>
        </div>
        <div style={{ display: 'flex', gap: '32px' }}>
          {['Privacidad', 'Términos', 'Contacto'].map(l => (
            <span key={l} style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.25)', cursor: 'pointer', letterSpacing: '0.05em' }}>{l}</span>
          ))}
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
