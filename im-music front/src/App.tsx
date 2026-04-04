import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard, Music, TrendingUp, DollarSign, ShieldCheck, Settings,
  Plus, Search, Bell, User as UserIcon, ChevronRight, BarChart3, Globe,
  Zap, FileText, CreditCard, Sparkles, Play, ShoppingBag, Menu, X,
  MessageCircle, Lock, Video, Mic, Award, Link2, Store, Split,
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
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Music size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">IM Music</h1>
          <p className="text-white/40 mt-1">Plataforma de distribución musical</p>
        </div>
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
          <div className="flex gap-2 mb-6">
            {(['login', 'register'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-2 rounded-lg font-medium transition-all ${tab === t ? 'bg-purple-600 text-white' : 'text-white/40 hover:text-white'}`}>
                {t === 'login' ? 'Iniciar sesión' : 'Registrarse'}
              </button>
            ))}
          </div>
          <form onSubmit={submit} className="space-y-4">
            {tab === 'register' && (
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre artístico"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 outline-none focus:border-purple-500" />
            )}
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 outline-none focus:border-purple-500" />
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Contraseña" required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 outline-none focus:border-purple-500" />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-all disabled:opacity-50">
              {loading ? 'Cargando...' : tab === 'login' ? 'Entrar' : 'Crear cuenta'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
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

function Sidebar({ active, onNav, user, onLogout, open, onClose }: {
  active: string; onNav: (id: string) => void; user: any;
  onLogout: () => void; open: boolean; onClose: () => void;
}) {
  const groups = [...new Set(MODULES.map(m => m.group))];
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggleGroup = (g: string) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      next.has(g) ? next.delete(g) : next.add(g);
      return next;
    });
  };

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/60 z-20 lg:hidden" onClick={onClose} />}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-zinc-950 border-r border-white/5 z-30 flex flex-col transition-transform duration-300
        ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="p-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-purple-600 rounded-xl flex items-center justify-center">
              <Music size={18} className="text-white" />
            </div>
            <span className="font-bold text-white text-lg">IM Music</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {groups.map(group => {
            const items = MODULES.filter(m => m.group === group);
            const isCollapsed = collapsed.has(group);
            return (
              <div key={group}>
                <button onClick={() => toggleGroup(group)}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-white/30 text-xs font-semibold uppercase tracking-widest hover:text-white/50 transition-colors">
                  <span>{group}</span>
                  <ChevronDown size={12} className={`transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
                </button>
                {!isCollapsed && items.map(m => (
                  <button key={m.id} onClick={() => { onNav(m.id); onClose(); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm
                      ${active === m.id ? 'bg-purple-600/20 text-purple-400 font-semibold' : 'text-white/40 hover:text-white hover:bg-white/5'}`}>
                    <m.icon size={16} />
                    <span>{m.label}</span>
                    {active === m.id && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-purple-400" />}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-purple-600/30 rounded-full flex items-center justify-center">
              <UserIcon size={14} className="text-purple-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{user?.name || user?.email}</p>
              <p className="text-white/30 text-xs capitalize">{user?.role || 'artist'}</p>
            </div>
          </div>
          <button onClick={onLogout} className="w-full flex items-center gap-2 px-3 py-2 text-white/40 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all text-sm">
            <LogOut size={14} /> Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  );
}

// ─── Page Shell ───────────────────────────────────────────────────────────────
function PageShell({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        {action}
      </div>
      {children}
    </div>
  );
}

function Card({ children, className = '', style, ...rest }: React.HTMLAttributes<HTMLDivElement> & { children: React.ReactNode }) {
  return (
    <div className={`bg-white/5 border border-white/10 rounded-2xl p-6 ${className}`} style={style} {...rest}>
      {children}
    </div>
  );
}

function Btn({ children, onClick, variant = 'primary', disabled = false, className = '' }: {
  children: React.ReactNode; onClick?: () => void; variant?: 'primary' | 'ghost' | 'danger';
  disabled?: boolean; className?: string;
}) {
  const styles = {
    primary: 'bg-purple-600 hover:bg-purple-500 text-white',
    ghost: 'bg-white/5 hover:bg-white/10 text-white border border-white/10',
    danger: 'bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/20',
  };
  return (
    <button onClick={onClick} disabled={disabled}
      className={`px-4 py-2 rounded-xl font-medium transition-all disabled:opacity-40 flex items-center gap-2 text-sm ${styles[variant]} ${className}`}>
      {children}
    </button>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [tracks, setTracks] = useState<any[]>([]);

  useEffect(() => {
    apiFetch('/royalties/summary').then(setStats).catch(() => {});
    apiFetch('/tracks').then(d => setTracks(d.slice(0, 5))).catch(() => {});
  }, []);

  const cards = [
    { label: 'Ingresos totales', value: stats ? `$${(stats.totalRevenue || 0).toFixed(2)}` : '—', icon: DollarSign },
    { label: 'Tracks', value: tracks.length || '—', icon: Music },
    { label: 'Plataformas', value: stats ? Object.keys(stats.byPlatform || {}).length : '—', icon: Globe },
    { label: 'Streams', value: stats ? (stats.totalStreams || 0).toLocaleString() : '—', icon: TrendingUp },
  ];

  return (
    <PageShell title="Dashboard">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map(c => (
          <Card key={c.label}>
            <c.icon size={20} className="text-purple-400 mb-3" />
            <p className="text-2xl font-bold text-white">{c.value}</p>
            <p className="text-white/40 text-sm mt-1">{c.label}</p>
          </Card>
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-white font-semibold mb-4">Últimos tracks</h3>
          {tracks.length === 0 && <p className="text-white/30 text-sm">Sin tracks aún</p>}
          <div className="space-y-3">
            {tracks.map(t => (
              <div key={t.id} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-600/20 rounded-lg flex items-center justify-center">
                  <Music size={14} className="text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{t.title}</p>
                  <p className="text-white/30 text-xs capitalize">{t.status}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <h3 className="text-white font-semibold mb-4">Plataformas</h3>
          {stats?.byPlatform && Object.entries(stats.byPlatform).slice(0, 5).map(([p, v]: any) => (
            <div key={p} className="flex items-center gap-3 mb-3">
              <span className="text-white/60 text-sm w-24 truncate capitalize">{p}</span>
              <div className="flex-1 bg-white/5 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${Math.min(100, (v / (stats.totalRevenue || 1)) * 100)}%` }} />
              </div>
              <span className="text-white/40 text-xs">${Number(v).toFixed(2)}</span>
            </div>
          ))}
          {!stats?.byPlatform && <p className="text-white/30 text-sm">Sin datos</p>}
        </Card>
      </div>
    </PageShell>
  );
}

// ─── Catalog ──────────────────────────────────────────────────────────────────
function CatalogPage() {
  const [tracks, setTracks] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('');
  const [loading, setLoading] = useState(false);

  const load = () => apiFetch('/tracks').then(setTracks).catch(() => {});
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!title) return;
    setLoading(true);
    try {
      await apiFetch('/tracks', { method: 'POST', body: JSON.stringify({ title, genre }) });
      setTitle(''); setGenre(''); setShowForm(false); load();
    } catch {}
    setLoading(false);
  };

  const del = async (id: number) => {
    if (!confirm('¿Eliminar track?')) return;
    await apiFetch(`/tracks/${id}`, { method: 'DELETE' }).catch(() => {});
    load();
  };

  const statusColor: Record<string, string> = { draft: 'bg-zinc-600', published: 'bg-green-600', scheduled: 'bg-blue-600' };

  return (
    <PageShell title="Catálogo" action={
      <Btn onClick={() => setShowForm(!showForm)}><Plus size={16} /> Nuevo track</Btn>
    }>
      {showForm && (
        <Card className="mb-6">
          <div className="flex gap-3 flex-wrap">
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Título del track"
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-white/30 outline-none focus:border-purple-500 min-w-48" />
            <input value={genre} onChange={e => setGenre(e.target.value)} placeholder="Género"
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-white/30 outline-none focus:border-purple-500 min-w-32" />
            <Btn onClick={create} disabled={loading}>{loading ? 'Creando...' : 'Crear'}</Btn>
            <Btn variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Btn>
          </div>
        </Card>
      )}
      <Card>
        {tracks.length === 0 && <p className="text-white/30 text-center py-8">Sin tracks. ¡Sube tu primer tema!</p>}
        <div className="divide-y divide-white/5">
          {tracks.map(t => (
            <div key={t.id} className="flex items-center gap-4 py-4">
              <div className="w-10 h-10 bg-purple-600/20 rounded-xl flex items-center justify-center">
                <Music size={18} className="text-purple-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{t.title}</p>
                <p className="text-white/40 text-sm">{t.genre || 'Sin género'}</p>
              </div>
              <span className={`px-2 py-1 rounded text-xs text-white font-medium ${statusColor[t.status] || 'bg-zinc-600'}`}>
                {t.status}
              </span>
              <button onClick={() => del(t.id)} className="text-white/20 hover:text-red-400 transition-colors">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
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
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total ingresos', value: summary ? `$${(summary.totalRevenue || 0).toFixed(2)}` : '—' },
          { label: 'Total streams', value: summary ? (summary.totalStreams || 0).toLocaleString() : '—' },
          { label: 'Plataformas', value: summary ? Object.keys(summary.byPlatform || {}).length : '—' },
        ].map(c => (
          <Card key={c.label}>
            <p className="text-2xl font-bold text-white">{c.value}</p>
            <p className="text-white/40 text-sm mt-1">{c.label}</p>
          </Card>
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-white font-semibold mb-4">Por plataforma</h3>
          {summary?.byPlatform && Object.entries(summary.byPlatform).map(([p, v]: any) => (
            <div key={p} className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="text-white/60 capitalize">{p}</span>
              <span className="text-white font-medium">${Number(v).toFixed(2)}</span>
            </div>
          ))}
        </Card>
        <Card>
          <h3 className="text-white font-semibold mb-4">Historial mensual</h3>
          {monthly.slice(0, 8).map((m: any) => (
            <div key={m.month} className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="text-white/60">{m.month}</span>
              <span className="text-white font-medium">${Number(m.revenue || 0).toFixed(2)}</span>
            </div>
          ))}
          {monthly.length === 0 && <p className="text-white/30 text-sm">Sin datos mensuales</p>}
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
    const msg = input.trim();
    setInput('');
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
      <Card className="flex flex-col" style={{ height: '60vh' }}>
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-lg px-4 py-3 rounded-2xl text-sm leading-relaxed
                ${m.role === 'user' ? 'bg-purple-600 text-white' : 'bg-white/10 text-white/80'}`}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white/10 px-4 py-3 rounded-2xl">
                <div className="flex gap-1">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        <div className="flex gap-3 mt-4 pt-4 border-t border-white/10">
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Escribe tu pregunta..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/30 outline-none focus:border-purple-500" />
          <Btn onClick={send} disabled={loading || !input.trim()}><Send size={16} /></Btn>
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

  const load = () => {
    apiFetch('/marketing/mi-branding').then(setArchetype).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const runTest = async () => {
    if (!genre) return;
    setLoading(true);
    try {
      const data = await apiFetch('/marketing/test', { method: 'POST', body: JSON.stringify({ genre, mood }) });
      setArchetype(data);
    } catch {}
    setLoading(false);
  };

  return (
    <PageShell title="Marketing IA">
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-white font-semibold mb-4">Test de Arquetipo</h3>
          <div className="space-y-3 mb-4">
            <input value={genre} onChange={e => setGenre(e.target.value)} placeholder="Género musical (ej: reggaeton, pop)"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/30 outline-none focus:border-purple-500" />
            <input value={mood} onChange={e => setMood(e.target.value)} placeholder="Mood (ej: energético, melancólico)"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/30 outline-none focus:border-purple-500" />
          </div>
          <Btn onClick={runTest} disabled={loading || !genre}>
            {loading ? 'Analizando...' : <><Sparkles size={16} /> Analizar arquetipo</>}
          </Btn>
        </Card>
        <Card>
          <h3 className="text-white font-semibold mb-4">Tu Branding</h3>
          {archetype ? (
            <div className="space-y-3">
              {archetype.archetype && <div><span className="text-white/40 text-sm">Arquetipo</span><p className="text-white font-medium">{archetype.archetype}</p></div>}
              {archetype.personality && <div><span className="text-white/40 text-sm">Personalidad</span><p className="text-white/70 text-sm">{archetype.personality}</p></div>}
              {archetype.colors && <div><span className="text-white/40 text-sm">Colores</span><p className="text-white/70 text-sm">{Array.isArray(archetype.colors) ? archetype.colors.join(', ') : archetype.colors}</p></div>}
            </div>
          ) : <p className="text-white/30 text-sm">Realiza el test para ver tu arquetipo</p>}
        </Card>
      </div>
    </PageShell>
  );
}

// ─── Marketplace ──────────────────────────────────────────────────────────────
function MarketplacePage() {
  const [beats, setBeats] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    apiFetch('/marketplace/beats').then(d => setBeats(Array.isArray(d) ? d : d.beats || [])).catch(() => {});
  }, []);

  const filtered = beats.filter(b => b.title?.toLowerCase().includes(search.toLowerCase()));

  return (
    <PageShell title="Marketplace">
      <div className="mb-6">
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar beats..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-white/30 outline-none focus:border-purple-500" />
        </div>
      </div>
      {filtered.length === 0 && <Card><p className="text-white/30 text-center py-8">Sin beats disponibles</p></Card>}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((b: any) => (
          <Card key={b.id} className="hover:border-purple-500/30 transition-colors cursor-pointer">
            <div className="w-full h-32 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-xl mb-4 flex items-center justify-center">
              <Play size={32} className="text-white/30" />
            </div>
            <p className="text-white font-semibold">{b.title}</p>
            <p className="text-white/40 text-sm">{b.genre}</p>
            <p className="text-purple-400 font-bold mt-2">${b.price || '0'}</p>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}

// ─── Community Chat ───────────────────────────────────────────────────────────
function CommunityPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = () => apiFetch('/chat/recent').then(d => setMessages(Array.isArray(d) ? d : [])).catch(() => {});
  useEffect(() => { load(); const t = setInterval(load, 5000); return () => clearInterval(t); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async () => {
    if (!input.trim()) return;
    const msg = input.trim(); setInput('');
    await apiFetch('/chat/send', { method: 'POST', body: JSON.stringify({ message: msg }) }).catch(() => {});
    load();
  };

  return (
    <PageShell title="Comunidad">
      <Card className="flex flex-col" style={{ height: '60vh' }}>
        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {messages.map((m: any, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-7 h-7 bg-purple-600/30 rounded-full flex items-center justify-center flex-shrink-0">
                <UserIcon size={12} className="text-purple-400" />
              </div>
              <div>
                <span className="text-purple-400 text-xs font-medium">{m.user_name || m.username || 'Usuario'} </span>
                <span className="text-white/30 text-xs">{m.created_at ? new Date(m.created_at).toLocaleTimeString() : ''}</span>
                <p className="text-white/70 text-sm mt-0.5">{m.message}</p>
              </div>
            </div>
          ))}
          {messages.length === 0 && <p className="text-white/30 text-sm text-center py-8">Sé el primero en escribir...</p>}
          <div ref={bottomRef} />
        </div>
        <div className="flex gap-3 mt-4 pt-4 border-t border-white/10">
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Escribe un mensaje..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/30 outline-none focus:border-purple-500" />
          <Btn onClick={send} disabled={!input.trim()}><Send size={16} /></Btn>
        </div>
      </Card>
    </PageShell>
  );
}

// ─── Vault ────────────────────────────────────────────────────────────────────
function VaultPage() {
  const [files, setFiles] = useState<any[]>([]);
  useEffect(() => {
    apiFetch('/vault/files').then(d => setFiles(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  return (
    <PageShell title="Vault">
      <Card>
        {files.length === 0 && <p className="text-white/30 text-center py-8">Sin archivos en el vault</p>}
        <div className="divide-y divide-white/5">
          {files.map((f: any) => (
            <div key={f.id} className="flex items-center gap-4 py-4">
              <Lock size={20} className="text-purple-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{f.file_name || f.filename}</p>
                <p className="text-white/40 text-sm">{f.file_type || f.type}</p>
              </div>
              <span className="text-white/30 text-xs">{f.created_at ? new Date(f.created_at).toLocaleDateString() : ''}</span>
            </div>
          ))}
        </div>
      </Card>
    </PageShell>
  );
}

// ─── Splits ───────────────────────────────────────────────────────────────────
function SplitsPage() {
  const [splits, setSplits] = useState<any[]>([]);
  const [tracks, setTracks] = useState<any[]>([]);
  const [trackId, setTrackId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pct, setPct] = useState('');
  const [showForm, setShowForm] = useState(false);

  const load = () => {
    apiFetch('/splits').then(d => setSplits(Array.isArray(d) ? d : [])).catch(() => {});
    apiFetch('/tracks').then(setTracks).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const add = async () => {
    await apiFetch('/splits', { method: 'POST', body: JSON.stringify({ track_id: trackId, collaborator_name: name, collaborator_email: email, percentage: pct }) }).catch(() => {});
    setShowForm(false); setName(''); setEmail(''); setPct(''); load();
  };

  return (
    <PageShell title="Splits" action={<Btn onClick={() => setShowForm(!showForm)}><Plus size={16} /> Nuevo split</Btn>}>
      {showForm && (
        <Card className="mb-6">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <select value={trackId} onChange={e => setTrackId(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-purple-500 col-span-2">
              <option value="">Seleccionar track</option>
              {tracks.map((t: any) => <option key={t.id} value={t.id}>{t.title}</option>)}
            </select>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre colaborador"
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/30 outline-none focus:border-purple-500" />
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email"
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/30 outline-none focus:border-purple-500" />
            <input value={pct} onChange={e => setPct(e.target.value)} placeholder="% (ej: 30)"
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/30 outline-none focus:border-purple-500" />
          </div>
          <div className="flex gap-2">
            <Btn onClick={add}>Agregar</Btn>
            <Btn variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Btn>
          </div>
        </Card>
      )}
      <Card>
        {splits.length === 0 && <p className="text-white/30 text-center py-8">Sin splits configurados</p>}
        <div className="divide-y divide-white/5">
          {splits.map((s: any) => (
            <div key={s.id} className="flex items-center gap-4 py-4">
              <Users size={18} className="text-purple-400" />
              <div className="flex-1">
                <p className="text-white font-medium">{s.collaborator_name}</p>
                <p className="text-white/40 text-sm">{s.collaborator_email}</p>
              </div>
              <span className="text-purple-400 font-bold">{s.percentage}%</span>
            </div>
          ))}
        </div>
      </Card>
    </PageShell>
  );
}

// ─── Legal ────────────────────────────────────────────────────────────────────
function LegalPage() {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const ask = async () => {
    if (!query.trim()) return;
    setLoading(true); setResponse('');
    try {
      const data = await apiFetch('/legal-agent/consulta', { method: 'POST', body: JSON.stringify({ consulta: query }) });
      setResponse(data.respuesta || data.response || JSON.stringify(data));
    } catch (err: any) { setResponse(`Error: ${err.message}`); }
    setLoading(false);
  };

  return (
    <PageShell title="Legal IA">
      <Card className="mb-6">
        <h3 className="text-white font-semibold mb-3">Consulta Legal</h3>
        <textarea value={query} onChange={e => setQuery(e.target.value)} rows={3} placeholder="Escribe tu consulta legal (contratos, derechos, licencias...)"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 outline-none focus:border-purple-500 resize-none mb-3" />
        <Btn onClick={ask} disabled={loading || !query.trim()}>
          {loading ? 'Consultando...' : <><Scale size={16} /> Consultar</>}
        </Btn>
      </Card>
      {response && (
        <Card>
          <h3 className="text-white font-semibold mb-3">Respuesta</h3>
          <p className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap">{response}</p>
        </Card>
      )}
    </PageShell>
  );
}

// ─── Financing ────────────────────────────────────────────────────────────────
function FinancingPage() {
  const [eligibility, setEligibility] = useState<any>(null);
  useEffect(() => {
    apiFetch('/financing/eligibility').then(setEligibility).catch(() => {});
  }, []);

  return (
    <PageShell title="Financiamiento">
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CreditCard size={24} className="text-purple-400 mb-4" />
          <h3 className="text-white font-semibold mb-2">Elegibilidad</h3>
          {eligibility ? (
            <div className="space-y-2">
              <div className={`flex items-center gap-2 ${eligibility.eligible ? 'text-green-400' : 'text-red-400'}`}>
                <Check size={16} />
                <span>{eligibility.eligible ? 'Eres elegible' : 'No elegible aún'}</span>
              </div>
              {eligibility.reason && <p className="text-white/40 text-sm">{eligibility.reason}</p>}
              {eligibility.amount && <p className="text-white font-bold text-xl">${eligibility.amount}</p>}
            </div>
          ) : <p className="text-white/30 text-sm">Verificando elegibilidad...</p>}
        </Card>
        <Card>
          <Lightbulb size={24} className="text-yellow-400 mb-4" />
          <h3 className="text-white font-semibold mb-2">Cómo funciona</h3>
          <ul className="space-y-2 text-white/50 text-sm">
            <li>• Anticipo sobre regalías futuras</li>
            <li>• Sin intereses adicionales</li>
            <li>• Se descuenta automáticamente de tus ganancias</li>
            <li>• Mínimo 3 meses de historial requerido</li>
          </ul>
        </Card>
      </div>
    </PageShell>
  );
}

// ─── Playlists ────────────────────────────────────────────────────────────────
function PlaylistsPage() {
  const [playlists, setPlaylists] = useState<any[]>([]);
  useEffect(() => {
    apiFetch('/playlists').then(d => setPlaylists(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  return (
    <PageShell title="Playlists">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {playlists.map((p: any) => (
          <Card key={p.id} className="hover:border-purple-500/30 transition-colors">
            <Play size={20} className="text-purple-400 mb-3" />
            <p className="text-white font-semibold">{p.name}</p>
            {p.genre && <p className="text-white/40 text-sm mt-1">{p.genre}</p>}
            {p.contact_email && <p className="text-purple-400 text-xs mt-2">{p.contact_email}</p>}
          </Card>
        ))}
        {playlists.length === 0 && <Card><p className="text-white/30 text-center py-8">Sin playlists</p></Card>}
      </div>
    </PageShell>
  );
}

// ─── Settings ─────────────────────────────────────────────────────────────────
function SettingsPage({ user }: { user: any }) {
  return (
    <PageShell title="Ajustes">
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-white font-semibold mb-4">Perfil</h3>
          <div className="space-y-3">
            <div>
              <label className="text-white/40 text-xs">Nombre</label>
              <p className="text-white">{user?.name || '—'}</p>
            </div>
            <div>
              <label className="text-white/40 text-xs">Email</label>
              <p className="text-white">{user?.email || '—'}</p>
            </div>
            <div>
              <label className="text-white/40 text-xs">Rol</label>
              <p className="text-white capitalize">{user?.role || 'artist'}</p>
            </div>
            <div>
              <label className="text-white/40 text-xs">Plan</label>
              <p className="text-purple-400 font-semibold capitalize">{user?.subscription_plan || 'free'}</p>
            </div>
          </div>
        </Card>
        <Card>
          <h3 className="text-white font-semibold mb-4">Integraciones</h3>
          {['Spotify', 'Apple Music', 'YouTube Music', 'TikTok'].map(s => (
            <div key={s} className="flex items-center justify-between py-3 border-b border-white/5">
              <span className="text-white/60">{s}</span>
              <span className="text-white/20 text-xs">No conectado</span>
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
      <Card className="text-center py-16">
        <Icon size={48} className="text-white/10 mx-auto mb-4" />
        <h2 className="text-white/40 text-lg font-medium">Módulo en construcción</h2>
        <p className="text-white/20 text-sm mt-2">Este módulo estará disponible próximamente</p>
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
      return payload;
    } catch { return null; }
  });
  const [activePage, setActivePage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const logout = () => {
    localStorage.removeItem('im_token');
    setUser(null);
  };

  if (!user) return <AuthPage onLogin={u => setUser(u)} />;

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': return <DashboardPage />;
      case 'catalog': return <CatalogPage />;
      case 'royalties': return <RoyaltiesPage />;
      case 'ai-chat': return <AIChatPage />;
      case 'marketing': return <MarketingPage />;
      case 'marketplace': return <MarketplacePage />;
      case 'community': return <CommunityPage />;
      case 'vault': return <VaultPage />;
      case 'splits': return <SplitsPage />;
      case 'legal': return <LegalPage />;
      case 'financing': return <FinancingPage />;
      case 'playlists': return <PlaylistsPage />;
      case 'settings': return <SettingsPage user={user} />;
      default: return <GenericPage moduleId={activePage} />;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      <Sidebar
        active={activePage}
        onNav={setActivePage}
        user={user}
        onLogout={logout}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="lg:ml-64">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between p-4 bg-zinc-950 border-b border-white/5">
          <button onClick={() => setSidebarOpen(true)} className="text-white/60 hover:text-white">
            <Menu size={24} />
          </button>
          <span className="text-white font-bold">IM Music</span>
          <Bell size={20} className="text-white/30" />
        </div>
        {/* Desktop topbar */}
        <div className="hidden lg:flex items-center justify-between px-8 py-4 border-b border-white/5">
          <div />
          <div className="flex items-center gap-4">
            <Bell size={18} className="text-white/30 cursor-pointer hover:text-white transition-colors" />
            <div className="w-8 h-8 bg-purple-600/30 rounded-full flex items-center justify-center">
              <UserIcon size={14} className="text-purple-400" />
            </div>
          </div>
        </div>
        <AnimatePresence mode="wait">
          <motion.main key={activePage} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            {renderPage()}
          </motion.main>
        </AnimatePresence>
      </div>
    </div>
  );
}
