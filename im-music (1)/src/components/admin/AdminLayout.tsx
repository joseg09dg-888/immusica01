import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Inbox, Terminal, ListTodo, Settings, Shield, ChevronRight, Globe } from 'lucide-react';
import { motion } from 'motion/react';

const AdminLayout: React.FC = () => {
  const location = useLocation();

  const menuItems = [
    { label: 'Buzón', path: '/admin/inbox', icon: Inbox },
    { label: 'Logs', path: '/admin/logs', icon: Terminal },
    { label: 'Tareas', path: '/admin/tasks', icon: ListTodo },
    { label: 'Infraestructura', path: '/admin/infra', icon: Globe },
    { label: 'Configuración', path: '/admin/config', icon: Settings },
  ];

  const isActive = (path: string) => location.pathname === path || (path === '/admin/inbox' && location.pathname === '/admin');

  return (
    <div className="min-h-screen pt-32 pb-20 px-6">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-12">
        
        {/* Sidebar */}
        <aside className="lg:w-64 shrink-0 space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-electric-purple">
              <Shield size={32} />
              <h1 className="text-3xl font-display font-black uppercase tracking-tighter italic leading-none">
                IM MUSIC<br />
                <span className="text-[10px] tracking-[0.3em] text-white/20">Admin Console</span>
              </h1>
            </div>
          </div>

          <nav className="space-y-2">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`group flex items-center justify-between p-4 rounded-2xl transition-all border ${
                  isActive(item.path)
                    ? 'bg-electric-purple text-white border-electric-purple shadow-lg shadow-electric-purple/20'
                    : 'bg-white/5 text-white/40 border-transparent hover:bg-white/10 hover:border-white/10'
                }`}
              >
                <div className="flex items-center gap-4">
                  <item.icon size={20} />
                  <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                </div>
                <ChevronRight size={14} className={`transition-transform ${isActive(item.path) ? 'translate-x-0' : '-translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100'}`} />
              </Link>
            ))}
          </nav>

          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[8px] font-black uppercase tracking-widest text-white/40">IA Operator Active</span>
            </div>
            <p className="text-[9px] text-white/20 leading-relaxed">
              Monitoring system integrity and autonomous agent operations.
            </p>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
