import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Gem, Sparkles, MapPin } from 'lucide-react';
import { ARTIST_INFO } from '../constants';

export const About: React.FC = () => {
  return (
    <section id="about" className="py-24 bg-zinc-950 text-zinc-100 overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="aspect-[4/5] rounded-3xl overflow-hidden border border-zinc-800">
              <img 
                src="https://picsum.photos/seed/natalia/800/1000" 
                alt="Natalia Cruz Duran" 
                className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="absolute -bottom-8 -right-8 bg-violet-600 p-8 rounded-3xl shadow-2xl hidden md:block">
              <p className="text-4xl font-bold font-mono">100%</p>
              <p className="text-xs uppercase tracking-widest font-bold opacity-80">Titanio G23</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div className="space-y-4">
              <h2 className="text-sm uppercase tracking-[0.3em] text-violet-500 font-bold">Sobre la Artista</h2>
              <h3 className="text-5xl font-bold leading-tight">
                {ARTIST_INFO.name} <br />
                <span className="text-zinc-500 italic font-serif font-light">Nath Piercer</span>
              </h3>
              <div className="flex items-center gap-2 text-zinc-400">
                <MapPin className="w-4 h-4 text-violet-500" />
                <span className="text-sm font-medium">{ARTIST_INFO.location}</span>
              </div>
            </div>

            <p className="text-zinc-400 text-lg leading-relaxed">
              {ARTIST_INFO.bio}
            </p>

            <div className="grid sm:grid-cols-2 gap-6">
              <div className="p-6 bg-zinc-900 rounded-2xl border border-zinc-800 hover:border-violet-500/50 transition-colors">
                <ShieldCheck className="w-8 h-8 text-violet-500 mb-4" />
                <h4 className="font-bold mb-2 uppercase text-sm tracking-wider">Higiene Estricta</h4>
                <p className="text-zinc-500 text-sm">Protocolos de bioseguridad de grado hospitalario y materiales estériles.</p>
              </div>
              <div className="p-6 bg-zinc-900 rounded-2xl border border-zinc-800 hover:border-violet-500/50 transition-colors">
                <Gem className="w-8 h-8 text-violet-500 mb-4" />
                <h4 className="font-bold mb-2 uppercase text-sm tracking-wider">Titanio G23</h4>
                <p className="text-zinc-500 text-sm">Solo joyería de titanio grado implante para una cicatrización segura.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
