import React, { useEffect, useState } from 'react';
import { getInboxMessages, processInboxMessage } from '../../services/api';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { Inbox, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface InboxMessage {
  id: number;
  source: string;
  sender: string;
  subject: string | null;
  message: string;
  priority: number;
  status: string;
  created_at: string;
}

const AdminInbox: React.FC = () => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('unread');

  useEffect(() => {
    fetchMessages();
  }, [filter]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await getInboxMessages(filter, 50);
      setMessages(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = async (id: number, status: string) => {
    try {
      await processInboxMessage(id, status);
      fetchMessages();
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="text-electric-purple animate-pulse font-black uppercase tracking-widest">{t('loading')}</div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-display font-black uppercase tracking-tighter italic flex items-center gap-3">
          <Inbox className="text-electric-purple" size={24} />
          {t('admin.inbox')}
        </h2>
        
        <div className="flex gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
          {['unread', 'read', 'all'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                filter === f 
                  ? 'bg-electric-purple text-white' 
                  : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}
            >
              {f === 'unread' ? 'No leídos' : f === 'read' ? 'Leídos' : 'Todos'}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card overflow-hidden border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-white/40">ID</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-white/40">Fuente</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-white/40">Remitente</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-white/40">Mensaje</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-white/40 text-center">Prioridad</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-white/40">Fecha</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-white/40 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {messages.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-white/20 uppercase font-black tracking-widest text-xs">
                    No hay mensajes en esta categoría
                  </td>
                </tr>
              ) : (
                messages.map(msg => (
                  <tr key={msg.id} className={`hover:bg-white/5 transition-colors ${msg.status === 'unread' ? 'bg-electric-purple/5' : ''}`}>
                    <td className="p-4 text-xs font-mono text-white/40">{msg.id}</td>
                    <td className="p-4">
                      <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 bg-white/5 rounded-md border border-white/10">
                        {msg.source}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="text-xs font-bold">{msg.sender}</div>
                      <div className="text-[10px] text-white/40 truncate max-w-[150px]">{msg.subject || '-'}</div>
                    </td>
                    <td className="p-4">
                      <p className="text-xs text-white/60 line-clamp-2 max-w-xs">{msg.message}</p>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`text-[10px] font-black px-2 py-1 rounded-md ${
                        msg.priority >= 4 ? 'bg-neon-pink/20 text-neon-pink' :
                        msg.priority >= 2 ? 'bg-electric-purple/20 text-electric-purple' :
                        'bg-white/10 text-white/40'
                      }`}>
                        P{msg.priority}
                      </span>
                    </td>
                    <td className="p-4 text-[10px] text-white/40">
                      {new Date(msg.created_at).toLocaleString()}
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => handleProcess(msg.id, 'resolved')}
                        className="p-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-lg transition-all"
                        title="Resolver"
                      >
                        <CheckCircle size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminInbox;
