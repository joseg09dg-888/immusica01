import React from 'react';
import { Instagram, MessageCircle, MapPin, Heart, Lock } from 'lucide-react';
import { ARTIST_INFO } from '../constants';

interface FooterProps {
  onAdminClick: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onAdminClick }) => {
  return (
    <footer className="bg-zinc-950 border-t border-zinc-900 pt-24 pb-12">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="space-y-6">
            <a href="#" className="text-2xl font-bold tracking-tighter text-zinc-100">
              NATH<span className="text-violet-500">PIERCER</span>
            </a>
            <p className="text-zinc-500 text-sm leading-relaxed">
              Perforaciones profesionales con Natalia Cruz Duran. Especialista en joyería de titanio grado implante y bioseguridad.
            </p>
            <div className="flex gap-4">
              <a href={`https://instagram.com/${ARTIST_INFO.instagram}`} className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400 hover:bg-violet-600 hover:text-white transition-all">
                <Instagram className="w-5 h-5" />
              </a>
              <a href={`https://wa.me/${ARTIST_INFO.whatsapp}`} className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400 hover:bg-violet-600 hover:text-white transition-all">
                <MessageCircle className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-100">Navegación</h4>
            <ul className="space-y-4">
              <li><a href="#" className="text-zinc-500 hover:text-violet-500 transition-colors text-sm">Inicio</a></li>
              <li><a href="#about" className="text-zinc-500 hover:text-violet-500 transition-colors text-sm">Sobre Mí</a></li>
              <li><a href="#gallery" className="text-zinc-500 hover:text-violet-500 transition-colors text-sm">Galería</a></li>
              <li><a href="#store" className="text-zinc-500 hover:text-violet-500 transition-colors text-sm">Tienda</a></li>
            </ul>
          </div>

          <div className="space-y-6">
            <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-100">Contacto</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-sm text-zinc-500">
                <MapPin className="w-5 h-5 text-violet-500 flex-shrink-0" />
                <span>{ARTIST_INFO.location}</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-zinc-500">
                <MessageCircle className="w-5 h-5 text-violet-500 flex-shrink-0" />
                <span>WhatsApp: +{ARTIST_INFO.whatsapp}</span>
              </li>
            </ul>
          </div>

          <div className="space-y-6">
            <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-100">Horarios</h4>
            <ul className="space-y-2 text-sm text-zinc-500">
              <li className="flex justify-between"><span>Lunes - Viernes:</span> <span>10am - 7pm</span></li>
              <li className="flex justify-between"><span>Sábados:</span> <span>10am - 4pm</span></li>
              <li className="flex justify-between"><span>Domingos:</span> <span>Cerrado</span></li>
            </ul>
          </div>
        </div>

        <div className="pt-12 border-t border-zinc-900 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <p className="text-zinc-600 text-xs">
              © {new Date().getFullYear()} Nath Piercer.
            </p>
            <button 
              onClick={onAdminClick}
              className="text-zinc-800 hover:text-zinc-600 transition-colors"
              title="Acceso Natalia"
            >
              <Lock className="w-3 h-3" />
            </button>
          </div>
          <p className="text-zinc-600 text-xs flex items-center gap-1">
            Hecho con <Heart className="w-3 h-3 text-red-500 fill-red-500" /> para Natalia Cruz Duran
          </p>
        </div>
      </div>
    </footer>
  );
};
