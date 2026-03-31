import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Instagram, MessageCircle, ShieldCheck } from 'lucide-react';
import { ARTIST_INFO } from '../constants';

export const Hero: React.FC = () => {
  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden bg-zinc-950">
      {/* Background Accents */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-violet-900/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/4"></div>
      <div className="absolute bottom-0 left-0 w-1/3 h-1/2 bg-zinc-900/50 blur-[100px] rounded-full translate-y-1/4 -translate-x-1/4"></div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900/50 border border-zinc-800 rounded-full backdrop-blur-md">
              <ShieldCheck className="w-4 h-4 text-violet-500" />
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Higiene & Bioseguridad Garantizada</span>
            </div>

            <h1 className="text-6xl md:text-8xl font-bold text-zinc-100 leading-[0.9] tracking-tighter">
              ARTE EN TU PIEL, <br />
              <span className="text-violet-500 italic font-serif font-light">SEGURIDAD</span> EN TU CUERPO.
            </h1>

            <p className="text-xl text-zinc-400 max-w-2xl leading-relaxed">
              {ARTIST_INFO.specialty}. Ubicada en {ARTIST_INFO.location}. 
              Perforaciones profesionales con Natalia Cruz Duran.
            </p>

            <div className="flex flex-wrap gap-4">
              <a 
                href="#store"
                className="px-8 py-4 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-violet-900/20 active:scale-95"
              >
                Ver Joyería <ArrowRight className="w-5 h-5" />
              </a>
              <a 
                href={`https://wa.me/${ARTIST_INFO.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 bg-zinc-900 hover:bg-zinc-800 text-zinc-100 border border-zinc-800 rounded-2xl font-bold flex items-center gap-2 transition-all active:scale-95"
              >
                Agendar Cita <MessageCircle className="w-5 h-5" />
              </a>
            </div>

            <div className="pt-12 flex items-center gap-8">
              <div className="flex -space-x-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="w-12 h-12 rounded-full border-4 border-zinc-950 overflow-hidden bg-zinc-800">
                    <img src={`https://picsum.photos/seed/face${i}/100/100`} alt="Client" referrerPolicy="no-referrer" />
                  </div>
                ))}
              </div>
              <p className="text-zinc-500 text-sm font-medium">
                <span className="text-zinc-100 font-bold">+500</span> Perforaciones exitosas en Neiva
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Vertical Rail Text */}
      <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden xl:block">
        <p className="writing-mode-vertical rotate-180 text-[10px] uppercase tracking-[1em] text-zinc-700 font-bold">
          NATALIA CRUZ DURAN • NATH PIERCER • NEIVA HUILA
        </p>
      </div>
    </section>
  );
};
