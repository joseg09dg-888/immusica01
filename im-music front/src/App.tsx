import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard, Music, TrendingUp, DollarSign, Settings,
  Plus, Search, Bell, User as UserIcon, BarChart3, Globe,
  Zap, CreditCard, Sparkles, Play, ShoppingBag, Menu,
  MessageCircle, Lock, Video, Mic, Award, Link2, Store,
  Upload, Image, Scale, Lightbulb, ChevronDown, Send, Trash2,
  LogOut, BookOpen, Package, Users, Radio, Star, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const API = '/api';
const token = () => localStorage.getItem('im_token') || '';

async function apiFetch(path: string, opts: RequestInit = {}) {
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token()}`,
      ...(opts.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Error');
  return data;
}

// ─── Design tokens ────────────────────────────────────────────────────────────
const P = '#5E17EB';
const PL = '#7B3FFF';

// ─── Auth Page ────────────────────────────────────────────────────────────────
function AuthPage({ onLogin }: { onLogin: (u: any) => void }) {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const body = tab === 'login' ? { email, password } : { email, password, name };
      const data = await apiFetch(`/auth/${tab}`, { method: 'POST', body: JSON.stringify(body) });
      localStorage.setItem('im_token', data.token);
      onLogin(data.user);
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      {/* Grid background */}
      <div style={{ position: 'fixed', inset: 0, backgroundImage: `linear-gradient(rgba(94,23,235,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(94,23,235,0.06) 1px, transparent 1px)`, backgroundSize: '48px 48px', pointerEvents: 'none' }} />
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        style={{ width: '100%', maxWidth: '440px', position: 'relative' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ width: '64px', height: '64px', background: `linear-gradient(135deg, ${P}, ${PL})`, borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: `0 0 40px rgba(94,23,235,0.4)` }}>
            <Music size={28} color="#fff" />
          </div>
          <h1 style={{ fontFamily: "'Anton', sans-serif", fontSize: '36px', letterSpacing: '0.02em', color: '#fff', margin: 0 }}>IM MUSIC</h1>
          <p style={{ color: 'rgba(255,255,255,0.35)', marginTop: '4px', fontSize: '14px' }}>Plataforma de distribución musical</p>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '32px', backdropFilter: 'blur(24px)' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '4px' }}>
            {(['login', 'register'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                flex: 1, padding: '10px', borderRadius: '10px', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600,
                fontSize: '13px', border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                background: tab === t ? P : 'transparent',
                color: tab === t ? '#fff' : 'rgba(255,255,255,0.4)'
              }}>
                {t === 'login' ? 'Iniciar sesión' : 'Registrarse'}
              </button>
            ))}
          </div>
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {tab === 'register' && (
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre artístico"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '14px 16px', color: '#fff', fontFamily: "'Space Grotesk', sans-serif", fontSize: '14px', outline: 'none', width: '100%', boxSizing: 'border-box' }} />
            )}
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '14px 16px', color: '#fff', fontFamily: "'Space Grotesk', sans-serif", fontSize: '14px', outline: 'none', width: '100%', boxSizing: 'border-box' }} />
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Contraseña" required
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '14px 16px', color: '#fff', fontFamily: "'Space Grotesk', sans-serif", fontSize: '14px', outline: 'none', width: '100%', boxSizing: 'border-box' }} />
            {error && <p style={{ color: '#f87171', fontSize: '13px', margin: 0 }}>{error}</p>}
            <Btn3D disabled={loading} type="submit">{loading ? 'Cargando...' : tab === 'login' ? 'ENTRAR' : 'CREAR CUENTA'}</Btn3D>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

// ─── 3D Button ────────────────────────────────────────────────────────────────
function Btn3D({ children, onClick, disabled = false, type = 'button', variant = 'primary', small = false }: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean;
  type?: 'button' | 'submit'; variant?: 'primary' | 'ghost' | 'danger'; small?: boolean;
}) {
  const [pressed, setPressed] = useState(false);
  const bg = variant === 'danger' ? '#7f1d1d' : variant === 'ghost' ? 'rgba(255,255,255,0.06)' : P;
  const shadow = variant === 'primary' ? `0 ${pressed ? '2px' : '6px'} 0 rgba(45,11,107,1), 0 0 ${pressed ? '20px' : '40px'} rgba(94,23,235,0.4)` : `0 ${pressed ? '2px' : '4px'} 0 rgba(0,0,0,0.5)`;
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      onMouseDown={() => setPressed(true)} onMouseUp={() => setPressed(false)} onMouseLeave={() => setPressed(false)}
      style={{
        background: bg, color: '#fff', border: variant === 'ghost' ? '1px solid rgba(255,255,255,0.12)' : 'none',
        borderRadius: '12px', padding: small ? '8px 16px' : '14px 28px',
        fontFamily: "'Anton', sans-serif", letterSpacing: '0.1em', textTransform: 'uppercase',
        fontSize: small ? '11px' : '13px', cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1, display: 'inline-flex', alignItems: 'center', gap: '8px',
        transform: `translateY(${pressed ? '3px' : '0'})`,
        boxShadow: shadow,
        transition: 'transform 0.08s cubic-bezier(0.3,0.7,0.4,1), box-shadow 0.08s ease, background 0.15s',
        width: type === 'submit' ? '100%' : undefined,
        justifyContent: type === 'submit' ? 'center' : undefined,
      }}>
      {children}
    </button>
  );
}

function GhostBtn({ children, onClick, small = false }: { children: React.ReactNode; onClick?: () => void; small?: boolean }) {
  return <Btn3D variant="ghost" onClick={onClick} small={small}>{children}</Btn3D>;
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
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

const SIDEBAR_W = 256;

function Sidebar({ active, onNav, user, onLogout, open, onClose }: {
  active: string; onNav: (id: string) => void; user: any;
  onLogout: () => void; open: boolean; onClose: () => void;
}) {
  const groups = [...new Set(MODULES.map(m => m.group))];
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const toggle = (g: string) => setCollapsed(prev => { const n = new Set(prev); n.has(g) ? n.delete(g) : n.add(g); return n; });

  return (
    <>
      {open && <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 20 }} />}
      <aside style={{
        position: 'fixed', top: 0, left: 0, height: '100%', width: `${SIDEBAR_W}px`,
        background: '#0a0a0a', borderRight: '1px solid rgba(255,255,255,0.05)',
        zIndex: 30, display: 'flex', flexDirection: 'column',
        transform: open ? 'translateX(0)' : undefined,
        transition: 'transform 0.3s ease',
      }}>
        {/* Logo */}
        <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', background: `linear-gradient(135deg, ${P}, ${PL})`, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 20px rgba(94,23,235,0.3)` }}>
            <Music size={16} color="#fff" />
          </div>
          <span style={{ fontFamily: "'Anton', sans-serif", fontSize: '18px', color: '#fff', letterSpacing: '0.05em' }}>IM MUSIC</span>
        </div>

        {/* Nav */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 8px' }}>
          {groups.map(group => {
            const items = MODULES.filter(m => m.group === group);
            const isCollapsed = collapsed.has(group);
            return (
              <div key={group}>
                <button onClick={() => toggle(group)} style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '6px 12px', background: 'none', border: 'none', cursor: 'pointer',
                  color: 'rgba(255,255,255,0.25)', fontSize: '9px', fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: '8px'
                }}>
                  <span>{group}</span>
                  <ChevronDown size={10} style={{ transform: isCollapsed ? 'rotate(-90deg)' : 'none', transition: 'transform 0.2s' }} />
                </button>
                {!isCollapsed && items.map(m => {
                  const isActive = active === m.id;
                  return (
                    <button key={m.id} onClick={() => { onNav(m.id); onClose(); }} style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '9px 12px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                      background: isActive ? `rgba(94,23,235,0.18)` : 'transparent',
                      color: isActive ? PL : 'rgba(255,255,255,0.38)',
                      fontSize: '12px', fontFamily: "'Space Grotesk', sans-serif", fontWeight: isActive ? 600 : 400,
                      transition: 'all 0.15s', textAlign: 'left',
                      borderLeft: isActive ? `2px solid ${P}` : '2px solid transparent',
                    }}>
                      <m.icon size={14} />
                      <span>{m.label}</span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* User footer */}
        <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', padding: '8px' }}>
            <div style={{ width: '32px', height: '32px', background: `rgba(94,23,235,0.25)`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <UserIcon size={14} color={PL} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ color: '#fff', fontSize: '12px', fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name || user?.email}</p>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', margin: 0, textTransform: 'capitalize' }}>{user?.role || 'artist'}</p>
            </div>
          </div>
          <button onClick={onLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', fontSize: '11px', fontFamily: "'Space Grotesk', sans-serif", borderRadius: '8px', transition: 'all 0.15s' }}>
            <LogOut size={13} /> Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────
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
      style={{
        background: 'rgba(255,255,255,0.04)', border: `1px solid ${hover || glow ? 'rgba(94,23,235,0.35)' : 'rgba(255,255,255,0.07)'}`,
        borderRadius: '20px', padding: '24px', transition: 'all 0.25s ease',
        boxShadow: hover ? `0 0 40px rgba(94,23,235,0.12), 0 8px 32px rgba(0,0,0,0.3)` : 'none',
        transform: hover ? 'translateY(-2px)' : 'none',
        ...style
      }}>
      {children}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color = P }: { label: string; value: string | number; icon: any; color?: string; key?: React.Key }) {
  const [hover, setHover] = useState(false);
  return (
    <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        background: 'rgba(255,255,255,0.04)', border: `1px solid ${hover ? 'rgba(94,23,235,0.4)' : 'rgba(255,255,255,0.07)'}`,
        borderRadius: '20px', padding: '24px', transition: 'all 0.25s ease',
        boxShadow: hover ? `0 0 40px rgba(94,23,235,0.15), 0 0 0 1px rgba(94,23,235,0.2)` : 'none',
        transform: hover ? 'translateY(-4px) scale(1.01)' : 'none',
      }}>
      <div style={{ width: '40px', height: '40px', background: `rgba(94,23,235,0.15)`, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', border: '1px solid rgba(94,23,235,0.2)' }}>
        <Icon size={18} color={PL} />
      </div>
      <p style={{ fontFamily: "'Anton', sans-serif", fontSize: '26px', color: '#fff', margin: '0 0 4px', letterSpacing: '0.02em' }}>{value}</p>
      <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', margin: 0, fontFamily: "'Space Grotesk', sans-serif" }}>{label}</p>
    </div>
  );
}

// ─── Purple Marquee Strip ─────────────────────────────────────────────────────
const MARQUEE_ITEMS = ['DISTRIBUCIÓN GLOBAL', 'REGALÍAS EN TIEMPO REAL', 'IA MUSICAL', 'MARKETING INTELIGENTE', 'SPLITS AUTOMÁTICOS', 'STORE MAXIMIZER', 'PUBLISHING'];
function MarqueeStrip() {
  const items = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];
  return (
    <div style={{ background: P, padding: '10px 0', overflow: 'hidden', borderTop: '1px solid rgba(255,255,255,0.1)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
      <div style={{ display: 'flex', gap: '0', animation: 'marqueeScroll 20s linear infinite', width: 'max-content' }}>
        {items.map((item, i) => (
          <span key={i} style={{ fontFamily: "'Anton', sans-serif", fontSize: '12px', letterSpacing: '0.2em', color: '#fff', padding: '0 32px', whiteSpace: 'nowrap' }}>
            {item} <span style={{ color: 'rgba(255,255,255,0.4)' }}>✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
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
      <MarqueeStrip />
      <PageShell title="Dashboard">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {cards.map(c => <StatCard key={c.label} label={c.label} value={c.value} icon={c.icon} />)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <Card>
            <h3 style={{ fontFamily: "'Anton', sans-serif", fontSize: '16px', color: '#fff', letterSpacing: '0.05em', marginBottom: '16px', marginTop: 0 }}>ÚLTIMOS TRACKS</h3>
            {tracks.length === 0 && <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '13px' }}>Sin tracks aún</p>}
            {tracks.map(t => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ width: '36px', height: '36px', background: 'rgba(94,23,235,0.15)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Music size={14} color={PL} />
                </div>
                <div>
                  <p style={{ color: '#fff', fontSize: '13px', fontWeight: 600, margin: 0 }}>{t.title}</p>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', margin: 0 }}>{t.status}</p>
                </div>
              </div>
            ))}
          </Card>
          <Card>
            <h3 style={{ fontFamily: "'Anton', sans-serif", fontSize: '16px', color: '#fff', letterSpacing: '0.05em', marginBottom: '16px', marginTop: 0 }}>PLATAFORMAS</h3>
            {stats?.byPlatform && Object.entries(stats.byPlatform).slice(0, 5).map(([p, v]: any) => (
              <div key={p} style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', textTransform: 'capitalize' }}>{p}</span>
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>${Number(v).toFixed(2)}</span>
                </div>
                <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '100px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: `linear-gradient(90deg, ${P}, ${PL})`, borderRadius: '100px', width: `${Math.min(100, (v / (stats.totalRevenue || 1)) * 100)}%` }} />
                </div>
              </div>
            ))}
            {!stats?.byPlatform && <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '13px' }}>Sin datos</p>}
          </Card>
        </div>
      </PageShell>
    </>
  );
}

// ─── Catalog ──────────────────────────────────────────────────────────────────
function CatalogPage() {
  const [tracks, setTracks] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('');
  const [loading, setLoading] = useState(false);
  const load = () => apiFetch('/tracks').then(d => setTracks(Array.isArray(d) ? d : [])).catch(() => {});
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!title) return; setLoading(true);
    try { await apiFetch('/tracks', { method: 'POST', body: JSON.stringify({ title, genre }) }); setTitle(''); setGenre(''); setShowForm(false); load(); }
    catch {} setLoading(false);
  };
  const del = async (id: number) => { if (!confirm('¿Eliminar?')) return; await apiFetch(`/tracks/${id}`, { method: 'DELETE' }).catch(() => {}); load(); };

  const statusColors: Record<string, string> = { draft: '#52525b', published: '#16a34a', scheduled: '#1d4ed8' };

  return (
    <PageShell title="Catálogo" action={<Btn3D small onClick={() => setShowForm(!showForm)}><Plus size={14} /> Nuevo track</Btn3D>}>
      {showForm && (
        <Card style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Título del track" style={{ flex: 1, minWidth: '160px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px 14px', color: '#fff', fontFamily: "'Space Grotesk',sans-serif", fontSize: '13px', outline: 'none' }} />
            <input value={genre} onChange={e => setGenre(e.target.value)} placeholder="Género" style={{ width: '120px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px 14px', color: '#fff', fontFamily: "'Space Grotesk',sans-serif", fontSize: '13px', outline: 'none' }} />
            <Btn3D small onClick={create} disabled={loading}>{loading ? 'Creando...' : 'Crear'}</Btn3D>
            <GhostBtn small onClick={() => setShowForm(false)}>Cancelar</GhostBtn>
          </div>
        </Card>
      )}
      <Card>
        {tracks.length === 0 && <p style={{ color: 'rgba(255,255,255,0.25)', textAlign: 'center', padding: '32px 0', fontFamily: "'Space Grotesk',sans-serif" }}>Sin tracks. ¡Sube tu primer tema!</p>}
        {tracks.map(t => (
          <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ width: '40px', height: '40px', background: 'rgba(94,23,235,0.15)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Music size={16} color={PL} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ color: '#fff', fontSize: '14px', fontWeight: 600, margin: 0 }}>{t.title}</p>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', margin: 0 }}>{t.genre || 'Sin género'}</p>
            </div>
            <span style={{ background: statusColors[t.status] || '#52525b', color: '#fff', fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{t.status}</span>
            <button onClick={() => del(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.2)', padding: '4px', borderRadius: '6px', transition: 'color 0.15s' }}>
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </Card>
    </PageShell>
  );
}

// ─── Royalties ────────────────────────────────────────────────────────────────
function RoyaltiesPage() {
  const [summary, setSummary] = useState<any>(null);
  const [monthly, setMonthly] = useState<any[]>([]);
  useEffect(() => {
    apiFetch('/royalties/summary').then(setSummary).catch(() => {});
    apiFetch('/royalties/monthly').then(setMonthly).catch(() => {});
  }, []);
  return (
    <PageShell title="Regalías">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Total ingresos', value: summary ? `$${Number(summary.totalRevenue || 0).toFixed(2)}` : '—', icon: DollarSign },
          { label: 'Total streams', value: summary ? Number(summary.totalStreams || 0).toLocaleString() : '—', icon: TrendingUp },
          { label: 'Plataformas', value: summary ? Object.keys(summary.byPlatform || {}).length : '—', icon: Globe },
        ].map(c => <StatCard key={c.label} label={c.label} value={c.value} icon={c.icon} />)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <Card>
          <h3 style={{ fontFamily: "'Anton', sans-serif", fontSize: '16px', color: '#fff', letterSpacing: '0.05em', marginBottom: '16px', marginTop: 0 }}>POR PLATAFORMA</h3>
          {summary?.byPlatform && Object.entries(summary.byPlatform).map(([p, v]: any) => (
            <div key={p} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <span style={{ color: 'rgba(255,255,255,0.6)', textTransform: 'capitalize', fontSize: '13px' }}>{p}</span>
              <span style={{ color: '#fff', fontWeight: 600, fontSize: '13px' }}>${Number(v).toFixed(2)}</span>
            </div>
          ))}
          {!summary?.byPlatform && <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '13px' }}>Sin datos</p>}
        </Card>
        <Card>
          <h3 style={{ fontFamily: "'Anton', sans-serif", fontSize: '16px', color: '#fff', letterSpacing: '0.05em', marginBottom: '16px', marginTop: 0 }}>HISTORIAL MENSUAL</h3>
          {monthly.slice(0, 8).map((m: any) => (
            <div key={m.month} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>{m.month}</span>
              <span style={{ color: '#fff', fontWeight: 600, fontSize: '13px' }}>${Number(m.revenue || 0).toFixed(2)}</span>
            </div>
          ))}
          {monthly.length === 0 && <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '13px' }}>Sin datos mensuales</p>}
        </Card>
      </div>
    </PageShell>
  );
}

// ─── AI Chat ──────────────────────────────────────────────────────────────────
function AIChatPage() {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([
    { role: 'assistant', content: '¡Hola! Soy tu asistente musical IA. ¿En qué puedo ayudarte hoy?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const msg = input.trim(); setInput('');
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setLoading(true);
    try {
      const data = await apiFetch('/ai/chat', { method: 'POST', body: JSON.stringify({ message: msg, history: messages }) });
      setMessages(prev => [...prev, { role: 'assistant', content: data.response || data.message || 'Sin respuesta' }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.message}` }]);
    }
    setLoading(false);
  };

  return (
    <PageShell title="IA Chat">
      <Card style={{ display: 'flex', flexDirection: 'column', height: '520px' }}>
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '4px' }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '70%', padding: '12px 16px', borderRadius: '16px', fontSize: '13px', lineHeight: '1.6',
                background: m.role === 'user' ? `linear-gradient(135deg, ${P}, ${PL})` : 'rgba(255,255,255,0.07)',
                color: '#fff', border: m.role === 'user' ? 'none' : '1px solid rgba(255,255,255,0.08)',
              }}>{m.content}</div>
            </div>
          ))}
          {loading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)', padding: '12px 16px', borderRadius: '16px', display: 'flex', gap: '5px', alignItems: 'center' }}>
                {[0, 1, 2].map(i => <div key={i} style={{ width: '7px', height: '7px', background: PL, borderRadius: '50%', animation: `bounce 1.2s ease-in-out ${i * 0.15}s infinite` }} />)}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        <div style={{ display: 'flex', gap: '12px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="Escribe tu pregunta..."
            style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '12px 16px', color: '#fff', fontFamily: "'Space Grotesk',sans-serif", fontSize: '13px', outline: 'none' }} />
          <Btn3D small onClick={send} disabled={loading || !input.trim()}><Send size={14} /></Btn3D>
        </div>
      </Card>
    </PageShell>
  );
}

// ─── Marketing ────────────────────────────────────────────────────────────────
function MarketingPage() {
  const [archetype, setArchetype] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [genre, setGenre] = useState('');
  const [mood, setMood] = useState('');
  useEffect(() => { apiFetch('/marketing/mi-branding').then(setArchetype).catch(() => {}); }, []);
  const runTest = async () => {
    if (!genre) return; setLoading(true);
    try { const data = await apiFetch('/marketing/test', { method: 'POST', body: JSON.stringify({ genre, mood }) }); setArchetype(data); }
    catch {} setLoading(false);
  };
  return (
    <PageShell title="Marketing IA">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <Card>
          <h3 style={{ fontFamily: "'Anton', sans-serif", fontSize: '16px', color: '#fff', letterSpacing: '0.05em', marginBottom: '16px', marginTop: 0 }}>TEST DE ARQUETIPO</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
            <input value={genre} onChange={e => setGenre(e.target.value)} placeholder="Género musical (ej: reggaeton, pop)"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '12px 14px', color: '#fff', fontFamily: "'Space Grotesk',sans-serif", fontSize: '13px', outline: 'none' }} />
            <input value={mood} onChange={e => setMood(e.target.value)} placeholder="Mood (ej: energético, melancólico)"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '12px 14px', color: '#fff', fontFamily: "'Space Grotesk',sans-serif", fontSize: '13px', outline: 'none' }} />
          </div>
          <Btn3D small onClick={runTest} disabled={loading || !genre}>{loading ? 'Analizando...' : <><Sparkles size={13} /> Analizar arquetipo</>}</Btn3D>
        </Card>
        <Card glow={!!archetype?.archetype}>
          <h3 style={{ fontFamily: "'Anton', sans-serif", fontSize: '16px', color: '#fff', letterSpacing: '0.05em', marginBottom: '16px', marginTop: 0 }}>TU BRANDING</h3>
          {archetype?.archetype ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div><span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Arquetipo</span><p style={{ color: '#fff', fontWeight: 700, margin: '4px 0 0', fontSize: '18px', fontFamily: "'Anton', sans-serif", letterSpacing: '0.05em' }}>{archetype.archetype}</p></div>
              {archetype.personality && <div><span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Personalidad</span><p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', margin: '4px 0 0' }}>{archetype.personality}</p></div>}
            </div>
          ) : <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '13px' }}>Realiza el test para ver tu arquetipo</p>}
        </Card>
      </div>
    </PageShell>
  );
}

// ─── Splits ───────────────────────────────────────────────────────────────────
function SplitsPage() {
  const [splits, setSplits] = useState<any[]>([]);
  const [tracks, setTracks] = useState<any[]>([]);
  const [show, setShow] = useState(false);
  const [trackId, setTrackId] = useState(''); const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [pct, setPct] = useState('');
  const load = () => { apiFetch('/splits').then(d => setSplits(Array.isArray(d) ? d : [])).catch(() => {}); apiFetch('/tracks').then(setTracks).catch(() => {}); };
  useEffect(() => { load(); }, []);
  const add = async () => { await apiFetch('/splits', { method: 'POST', body: JSON.stringify({ track_id: trackId, collaborator_name: name, collaborator_email: email, percentage: pct }) }).catch(() => {}); setShow(false); setName(''); setEmail(''); setPct(''); load(); };
  const inputStyle: React.CSSProperties = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '10px 14px', color: '#fff', fontFamily: "'Space Grotesk',sans-serif", fontSize: '13px', outline: 'none', boxSizing: 'border-box' };
  return (
    <PageShell title="Splits" action={<Btn3D small onClick={() => setShow(!show)}><Plus size={14} /> Nuevo split</Btn3D>}>
      {show && <Card style={{ marginBottom: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
          <select value={trackId} onChange={e => setTrackId(e.target.value)} style={{ ...inputStyle, gridColumn: '1/-1' }}>
            <option value="">Seleccionar track</option>
            {tracks.map((t: any) => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre colaborador" style={inputStyle} />
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" style={inputStyle} />
          <input value={pct} onChange={e => setPct(e.target.value)} placeholder="% (ej: 30)" style={inputStyle} />
        </div>
        <div style={{ display: 'flex', gap: '8px' }}><Btn3D small onClick={add}>Agregar</Btn3D><GhostBtn small onClick={() => setShow(false)}>Cancelar</GhostBtn></div>
      </Card>}
      <Card>
        {splits.length === 0 && <p style={{ color: 'rgba(255,255,255,0.25)', textAlign: 'center', padding: '32px 0', fontFamily: "'Space Grotesk',sans-serif" }}>Sin splits configurados</p>}
        {splits.map((s: any) => (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <Users size={16} color={PL} />
            <div style={{ flex: 1 }}><p style={{ color: '#fff', fontSize: '13px', fontWeight: 600, margin: 0 }}>{s.collaborator_name || s.artist_name}</p><p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', margin: 0 }}>{s.collaborator_email || s.email}</p></div>
            <span style={{ color: PL, fontWeight: 700, fontSize: '16px', fontFamily: "'Anton', sans-serif" }}>{s.percentage}%</span>
          </div>
        ))}
      </Card>
    </PageShell>
  );
}

// ─── Legal ────────────────────────────────────────────────────────────────────
function LegalPage() {
  const [query, setQuery] = useState(''); const [response, setResponse] = useState(''); const [loading, setLoading] = useState(false);
  const ask = async () => { if (!query.trim()) return; setLoading(true); setResponse(''); try { const d = await apiFetch('/legal-agent/consulta', { method: 'POST', body: JSON.stringify({ consulta: query }) }); setResponse(d.respuesta || d.response || JSON.stringify(d)); } catch (e: any) { setResponse(`Error: ${e.message}`); } setLoading(false); };
  return (
    <PageShell title="Legal IA">
      <Card style={{ marginBottom: '20px' }}>
        <h3 style={{ fontFamily: "'Anton', sans-serif", fontSize: '16px', color: '#fff', letterSpacing: '0.05em', marginBottom: '12px', marginTop: 0 }}>CONSULTA LEGAL</h3>
        <textarea value={query} onChange={e => setQuery(e.target.value)} rows={3} placeholder="Escribe tu consulta legal..."
          style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '12px 16px', color: '#fff', fontFamily: "'Space Grotesk',sans-serif", fontSize: '13px', outline: 'none', resize: 'none', marginBottom: '12px', boxSizing: 'border-box' }} />
        <Btn3D small onClick={ask} disabled={loading || !query.trim()}>{loading ? 'Consultando...' : <><Scale size={13} /> Consultar</>}</Btn3D>
      </Card>
      {response && <Card glow><h3 style={{ fontFamily: "'Anton', sans-serif", fontSize: '16px', color: '#fff', letterSpacing: '0.05em', marginBottom: '12px', marginTop: 0 }}>RESPUESTA</h3><p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', lineHeight: '1.7', whiteSpace: 'pre-wrap', margin: 0 }}>{response}</p></Card>}
    </PageShell>
  );
}

// ─── Financing ────────────────────────────────────────────────────────────────
function FinancingPage() {
  const [el, setEl] = useState<any>(null);
  useEffect(() => { apiFetch('/financing/eligibility').then(setEl).catch(() => {}); }, []);
  return (
    <PageShell title="Financiamiento">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <Card glow={el?.eligible}>
          <CreditCard size={24} color={PL} style={{ marginBottom: '16px' }} />
          <h3 style={{ fontFamily: "'Anton', sans-serif", fontSize: '16px', color: '#fff', letterSpacing: '0.05em', marginBottom: '12px', marginTop: 0 }}>ELEGIBILIDAD</h3>
          {el ? <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: el.eligible ? '#4ade80' : '#f87171', marginBottom: '8px' }}>
              <Check size={16} /><span style={{ fontWeight: 600 }}>{el.eligible ? 'Eres elegible' : 'No elegible aún'}</span>
            </div>
            {el.reason && <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', margin: 0 }}>{el.reason}</p>}
          </div> : <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '13px' }}>Verificando...</p>}
        </Card>
        <Card>
          <Lightbulb size={24} color="#fbbf24" style={{ marginBottom: '16px' }} />
          <h3 style={{ fontFamily: "'Anton', sans-serif", fontSize: '16px', color: '#fff', letterSpacing: '0.05em', marginBottom: '12px', marginTop: 0 }}>CÓMO FUNCIONA</h3>
          <ul style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', lineHeight: '1.8', paddingLeft: '16px', margin: 0 }}>
            <li>Anticipo sobre regalías futuras</li><li>Sin intereses adicionales</li>
            <li>Descuento automático de ganancias</li><li>Mínimo 3 meses de historial</li>
          </ul>
        </Card>
      </div>
    </PageShell>
  );
}

// ─── Settings ─────────────────────────────────────────────────────────────────
function SettingsPage({ user }: { user: any }) {
  return (
    <PageShell title="Ajustes">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <Card>
          <h3 style={{ fontFamily: "'Anton', sans-serif", fontSize: '16px', color: '#fff', letterSpacing: '0.05em', marginBottom: '16px', marginTop: 0 }}>PERFIL</h3>
          {[{ label: 'Nombre', value: user?.name }, { label: 'Email', value: user?.email }, { label: 'Rol', value: user?.role }, { label: 'Plan', value: user?.subscription_plan || 'free' }].map(f => (
            <div key={f.label} style={{ marginBottom: '12px' }}>
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em' }}>{f.label}</span>
              <p style={{ color: '#fff', fontSize: '14px', margin: '3px 0 0', fontWeight: 500 }}>{f.value || '—'}</p>
            </div>
          ))}
        </Card>
        <Card>
          <h3 style={{ fontFamily: "'Anton', sans-serif", fontSize: '16px', color: '#fff', letterSpacing: '0.05em', marginBottom: '16px', marginTop: 0 }}>INTEGRACIONES</h3>
          {['Spotify', 'Apple Music', 'YouTube Music', 'TikTok'].map(s => (
            <div key={s} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>{s}</span>
              <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '11px' }}>No conectado</span>
            </div>
          ))}
        </Card>
      </div>
    </PageShell>
  );
}

// ─── Generic Page ─────────────────────────────────────────────────────────────
function GenericPage({ moduleId }: { moduleId: string }) {
  const mod = MODULES.find(m => m.id === moduleId);
  const Icon = mod?.icon || Zap;
  return (
    <PageShell title={mod?.label || moduleId}>
      <Card style={{ textAlign: 'center', padding: '64px 24px' }}>
        <div style={{ width: '64px', height: '64px', background: 'rgba(94,23,235,0.1)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <Icon size={28} color="rgba(255,255,255,0.15)" />
        </div>
        <h2 style={{ fontFamily: "'Anton', sans-serif", fontSize: '20px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.05em', margin: '0 0 8px' }}>MÓDULO EN CONSTRUCCIÓN</h2>
        <p style={{ color: 'rgba(255,255,255,0.15)', fontSize: '13px', margin: 0 }}>Disponible próximamente</p>
      </Card>
    </PageShell>
  );
}

// ─── App Root ─────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState<any>(() => {
    try {
      const t = localStorage.getItem('im_token');
      if (!t) return null;
      const payload = JSON.parse(atob(t.split('.')[1]));
      if (payload.exp && payload.exp * 1000 < Date.now()) { localStorage.removeItem('im_token'); return null; }
      return payload;
    } catch { return null; }
  });
  const [activePage, setActivePage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const logout = () => { localStorage.removeItem('im_token'); setUser(null); };

  if (!user) return <AuthPage onLogin={u => setUser(u)} />;

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': return <DashboardPage />;
      case 'catalog': return <CatalogPage />;
      case 'royalties': return <RoyaltiesPage />;
      case 'ai-chat': return <AIChatPage />;
      case 'marketing': return <MarketingPage />;
      case 'splits': return <SplitsPage />;
      case 'legal': return <LegalPage />;
      case 'financing': return <FinancingPage />;
      case 'settings': return <SettingsPage user={user} />;
      default: return <GenericPage moduleId={activePage} />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#050505' }}>
      {/* Purple grid background */}
      <div style={{ position: 'fixed', inset: 0, backgroundImage: `linear-gradient(rgba(94,23,235,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(94,23,235,0.04) 1px, transparent 1px)`, backgroundSize: '48px 48px', pointerEvents: 'none', zIndex: 0 }} />
      {/* Ambient glow */}
      <div style={{ position: 'fixed', top: '-200px', left: '-200px', width: '600px', height: '600px', background: `radial-gradient(circle, rgba(94,23,235,0.07) 0%, transparent 70%)`, pointerEvents: 'none', zIndex: 0 }} />

      <Sidebar active={activePage} onNav={setActivePage} user={user} onLogout={logout} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content — offset by sidebar width */}
      <div style={{ marginLeft: `${SIDEBAR_W}px`, position: 'relative', zIndex: 1 }}>
        {/* Top bar */}
        <div style={{ position: 'sticky', top: 0, background: 'rgba(5,5,5,0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '12px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 10 }}>
          {/* Mobile menu button */}
          <button onClick={() => setSidebarOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', display: 'none' }}>
            <Menu size={22} />
          </button>
          <div />
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Bell size={18} color="rgba(255,255,255,0.3)" style={{ cursor: 'pointer' }} />
            <div style={{ width: '32px', height: '32px', background: `rgba(94,23,235,0.2)`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid rgba(94,23,235,0.3)` }}>
              <UserIcon size={14} color={PL} />
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.main key={activePage} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.15 }}>
            {renderPage()}
          </motion.main>
        </AnimatePresence>
      </div>

      {/* Marquee keyframe */}
      <style>{`
        @keyframes marqueeScroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #000; } ::-webkit-scrollbar-thumb { background: ${P}; border-radius: 4px; }
        input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.2); }
        select { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); color: #fff; }
        select option { background: #1a1a1a; }
      `}</style>
    </div>
  );
}
