import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, Terminal, Users, Shield, AlertTriangle, 
  MessageSquare, Sparkles, Trash2, Flag
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';
import { getChatHistory, reportMessage } from '../services/api';
import { toast } from 'sonner';
import { API_URL } from '../config/api';

const CommunityChat: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch history
    getChatHistory()
      .then(res => {
        if (Array.isArray(res.data)) {
          setMessages(res.data);
        } else if (res.data && Array.isArray(res.data.messages)) {
          setMessages(res.data.messages);
        } else {
          setMessages([]);
        }
      })
      .catch(err => {
        console.error(err);
        setMessages([]);
      });

    // Initialize socket
    const s = io(API_URL, {
      auth: { token: localStorage.getItem('im_music_token') }
    });

    s.on('connect', () => {
      console.log('Connected to chat');
    });

    s.on('message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    s.on('users_count', (count) => {
      setOnlineUsers(count);
    });

    s.on('banned', (data) => {
      toast.error(`Has sido baneado: ${data.reason}. Expira: ${new Date(data.expires_at).toLocaleString()}`);
    });

    s.on('moderation_alert', (data) => {
      toast.warning(`Advertencia de moderación: ${data.message}`);
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket) return;

    socket.emit('send_message', { text: newMessage });
    setNewMessage('');
  };

  const handleReport = async (messageId: number) => {
    const reason = prompt('Razón del reporte:');
    if (!reason) return;
    try {
      await reportMessage(messageId, reason);
      toast.success('Mensaje reportado');
    } catch (err) {
      toast.error('Error al reportar');
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 bg-ink relative overflow-hidden flex flex-col">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-cyber-cyan/5 blur-[150px] rounded-full -mr-64 -mt-64 animate-pulse-glow" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-neon-pink/5 blur-[150px] rounded-full -ml-64 -mb-64 animate-pulse-glow" />

      <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col space-y-8 relative z-10">
        <div className="flex items-end justify-between">
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyber-cyan/10 border border-cyber-cyan/20 text-cyber-cyan text-[10px] font-black uppercase tracking-widest"
            >
              <Shield size={12} className="animate-pulse" />
              <span>AI Moderated Community</span>
            </motion.div>
            <h1 className="text-6xl font-display font-black tracking-tighter uppercase italic">
              Neural <span className="text-cyber-cyan">Chat</span>
            </h1>
          </div>
          <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-white/60">{onlineUsers} Online</span>
          </div>
        </div>

        <div className="flex-1 glass-card border-white/5 bg-black/40 flex flex-col overflow-hidden">
          {/* Chat Header */}
          <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
            <div className="flex items-center gap-4">
              <Terminal size={18} className="text-cyber-cyan" />
              <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Main Terminal</span>
            </div>
            <div className="flex gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500/20" />
              <div className="w-2 h-2 rounded-full bg-amber-500/20" />
              <div className="w-2 h-2 rounded-full bg-emerald-500/20" />
            </div>
          </div>

          {/* Messages Area */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-thin scrollbar-thumb-white/10"
          >
            <AnimatePresence initial={false}>
              {Array.isArray(messages) && messages.map((msg, i) => (
                <motion.div
                  key={msg.id || i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex flex-col ${msg.user_id === user?.id ? 'items-end' : 'items-start'} space-y-2`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/20">
                      {msg.user_name || 'Anonymous'}
                    </span>
                    <span className="text-[8px] font-medium text-white/10">
                      {new Date(msg.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className={`relative group max-w-[80%] p-4 rounded-2xl border ${
                    msg.user_id === user?.id 
                      ? 'bg-cyber-cyan/10 border-cyber-cyan/20 text-cyber-cyan' 
                      : 'bg-white/5 border-white/10 text-white/80'
                  }`}>
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                    
                    {msg.user_id !== user?.id && (
                      <button 
                        onClick={() => handleReport(msg.id)}
                        className="absolute -right-12 top-1/2 -translate-y-1/2 p-2 text-white/10 hover:text-neon-pink opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Flag size={14} />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Input Area */}
          <form onSubmit={handleSend} className="p-6 border-t border-white/5 bg-white/[0.02]">
            <div className="relative">
              <input 
                type="text"
                placeholder="Escribe un mensaje..."
                className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-5 text-white focus:outline-none focus:border-cyber-cyan transition-all pr-20"
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
              />
              <button 
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 bg-cyber-cyan text-ink rounded-xl flex items-center justify-center hover:scale-105 transition-all shadow-lg shadow-cyber-cyan/20"
              >
                <Send size={18} />
              </button>
            </div>
            <div className="mt-4 flex items-center gap-4 text-[8px] font-black uppercase tracking-[0.2em] text-white/20">
              <Sparkles size={10} className="text-cyber-cyan" />
              <span>AI Moderation Active: Be respectful to avoid strikes</span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CommunityChat;
