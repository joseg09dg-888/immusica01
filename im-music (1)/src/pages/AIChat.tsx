import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Sparkles, Brain, Zap, Loader2, User, Bot, Trash2, ArrowRight } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { toast } from 'sonner';

const AIChat: React.FC = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user', text: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    const currentMessages = [...messages, userMessage];
    setInput('');
    setLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: currentMessages.map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.text }]
        })),
        config: {
          systemInstruction: "Eres IM Music AI, un asistente experto en la industria musical, distribución digital, marketing para artistas y producción. Ayudas a los artistas de IM Music a potenciar sus carreras con consejos estratégicos, análisis de tendencias y soporte técnico sobre la plataforma. Sé profesional, inspirador y directo."
        }
      });

      const botMessage = { role: 'bot', text: response.text || 'Lo siento, no pude procesar tu solicitud.', timestamp: new Date() };
      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      toast.error('Error al conectar con la IA');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    toast.success('Conversación reiniciada');
  };

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 bg-ink relative overflow-hidden flex flex-col">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-electric-purple/5 blur-[150px] rounded-full -mr-64 -mt-64 animate-pulse-glow" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-cyber-cyan/5 blur-[150px] rounded-full -ml-64 -mb-64 animate-pulse-glow" />

      <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col space-y-8 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-electric-purple/10 border border-electric-purple/20 text-electric-purple text-[10px] font-black uppercase tracking-widest"
            >
              <Brain size={12} className="animate-pulse" />
              <span>Neural AI Assistant</span>
            </motion.div>
            <h1 className="text-6xl lg:text-8xl font-display font-black tracking-tighter uppercase italic leading-none">
              IM <span className="text-electric-purple">Music AI</span>
            </h1>
          </div>
          
          <button 
            onClick={clearChat}
            className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border border-white/5"
          >
            <Trash2 size={14} />
            Reiniciar Chat
          </button>
        </div>

        <div className="flex-1 glass-card border-white/5 bg-black/40 flex flex-col overflow-hidden shadow-2xl shadow-electric-purple/5">
          {/* Chat Header */}
          <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
            <div className="flex items-center gap-4">
              <Sparkles size={18} className="text-electric-purple" />
              <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Neural Processing Unit</span>
            </div>
            <div className="flex gap-2">
              <div className="w-2 h-2 rounded-full bg-electric-purple animate-pulse" />
              <div className="w-2 h-2 rounded-full bg-electric-purple/40" />
              <div className="w-2 h-2 rounded-full bg-electric-purple/20" />
            </div>
          </div>

          {/* Messages Area */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-thin scrollbar-thumb-white/10"
          >
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-8 opacity-40">
                <div className="w-24 h-24 bg-electric-purple/10 rounded-[2.5rem] flex items-center justify-center text-electric-purple animate-bounce-slow">
                  <Bot size={48} />
                </div>
                <div className="space-y-4">
                  <h3 className="text-2xl font-display font-black uppercase italic">¿En qué puedo ayudarte hoy?</h3>
                  <p className="text-xs max-w-xs mx-auto leading-relaxed">Pregúntame sobre estrategias de lanzamiento, marketing musical o cómo usar la plataforma.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg">
                  {[
                    "¿Cómo optimizar mi Spotify?",
                    "Estrategia para mi próximo single",
                    "¿Qué son los splits de regalías?",
                    "Consejos para mi HyperFollow"
                  ].map((suggestion, i) => (
                    <button 
                      key={i}
                      onClick={() => setInput(suggestion)}
                      className="p-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 hover:border-electric-purple/40 transition-all text-left flex items-center justify-between group"
                    >
                      {suggestion}
                      <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-all" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <AnimatePresence initial={false}>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-6 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
                    msg.role === 'user' ? 'bg-white/10 text-white' : 'bg-electric-purple text-ink'
                  }`}>
                    {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
                  </div>
                  <div className={`max-w-[75%] space-y-2 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                    <div className={`p-6 rounded-3xl text-sm leading-relaxed border ${
                      msg.role === 'user' 
                        ? 'bg-white/5 border-white/10 text-white/80 rounded-tr-none' 
                        : 'bg-electric-purple/10 border-electric-purple/20 text-white rounded-tl-none'
                    }`}>
                      {msg.text}
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-widest text-white/10">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {loading && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-6"
              >
                <div className="w-12 h-12 rounded-2xl bg-electric-purple text-ink flex items-center justify-center shrink-0">
                  <Loader2 size={20} className="animate-spin" />
                </div>
                <div className="p-6 rounded-3xl bg-electric-purple/5 border border-white/5 flex gap-2">
                  <div className="w-1.5 h-1.5 bg-electric-purple rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-electric-purple rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1.5 h-1.5 bg-electric-purple rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </motion.div>
            )}
          </div>

          {/* Input Area */}
          <form onSubmit={handleSend} className="p-8 border-t border-white/5 bg-white/[0.02]">
            <div className="relative">
              <input 
                type="text"
                placeholder="Escribe tu consulta musical..."
                className="w-full bg-black/40 border border-white/10 rounded-2xl px-8 py-6 text-white focus:outline-none focus:border-electric-purple transition-all pr-24 text-sm font-medium"
                value={input}
                onChange={e => setInput(e.target.value)}
                disabled={loading}
              />
              <button 
                type="submit"
                disabled={loading || !input.trim()}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-14 h-14 bg-electric-purple text-ink rounded-xl flex items-center justify-center hover:scale-105 transition-all shadow-xl shadow-electric-purple/20 disabled:opacity-50 disabled:hover:scale-100"
              >
                <Send size={20} />
              </button>
            </div>
            <div className="mt-6 flex items-center justify-center gap-6 text-[8px] font-black uppercase tracking-[0.3em] text-white/20">
              <div className="flex items-center gap-2">
                <Zap size={10} className="text-electric-purple" />
                <span>Powered by Gemini 3 Flash</span>
              </div>
              <div className="w-1 h-1 bg-white/10 rounded-full" />
              <span>Neural Response Optimization Active</span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
