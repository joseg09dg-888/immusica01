import React, { useState, useEffect } from 'react';
import { ShoppingBag, Menu, X, Instagram, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ARTIST_INFO } from '../constants';

interface NavbarProps {
  cartCount: number;
  onCartClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ cartCount, onCartClick }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Inicio', href: '#' },
    { name: 'Sobre Mí', href: '#about' },
    { name: 'Galería', href: '#gallery' },
    { name: 'Tienda', href: '#store' },
  ];

  return (
    <nav className={`fixed top-0 left-0 w-full z-40 transition-all duration-500 ${
      isScrolled ? 'py-4 bg-zinc-950/80 backdrop-blur-xl border-b border-white/5' : 'py-8 bg-transparent'
    }`}>
      <div className="container mx-auto px-6 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2 group">
          {/* Reemplaza la URL de abajo con el link de tu logo real */}
          <img 
            src="https://picsum.photos/seed/piercing-logo/200/200" 
            alt="Nath Piercer Logo" 
            className="w-10 h-10 object-contain rounded-full border border-violet-500/30 group-hover:border-violet-500 transition-all"
            referrerPolicy="no-referrer"
          />
          <span className="text-xl font-bold tracking-tighter text-zinc-100 hidden sm:block">
            NATH<span className="text-violet-500 group-hover:text-violet-400 transition-colors">PIERCER</span>
          </span>
        </a>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-12">
          <div className="flex items-center gap-8">
            {navLinks.map(link => (
              <a 
                key={link.name} 
                href={link.href} 
                className="text-sm font-bold uppercase tracking-widest text-zinc-400 hover:text-violet-500 transition-colors"
              >
                {link.name}
              </a>
            ))}
          </div>
          
          <div className="flex items-center gap-6 border-l border-zinc-800 pl-8">
            <button 
              onClick={onCartClick}
              className="relative p-2 text-zinc-100 hover:text-violet-500 transition-colors"
            >
              <ShoppingBag className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-violet-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-zinc-950">
                  {cartCount}
                </span>
              )}
            </button>
            <a 
              href={`https://instagram.com/${ARTIST_INFO.instagram}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-zinc-400 hover:text-zinc-100 transition-colors"
            >
              <Instagram className="w-6 h-6" />
            </a>
          </div>
        </div>

        {/* Mobile Toggle */}
        <div className="flex items-center gap-4 md:hidden">
          <button 
            onClick={onCartClick}
            className="relative p-2 text-zinc-100"
          >
            <ShoppingBag className="w-6 h-6" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-violet-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-zinc-100"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-zinc-900 border-b border-zinc-800 overflow-hidden"
          >
            <div className="px-6 py-8 flex flex-col gap-6">
              {navLinks.map(link => (
                <a 
                  key={link.name} 
                  href={link.href} 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-xl font-bold uppercase tracking-widest text-zinc-100"
                >
                  {link.name}
                </a>
              ))}
              <div className="pt-6 border-t border-zinc-800 flex gap-6">
                <a href={`https://instagram.com/${ARTIST_INFO.instagram}`} className="text-zinc-400"><Instagram /></a>
                <a href={`https://wa.me/${ARTIST_INFO.whatsapp}`} className="text-zinc-400"><MessageCircle /></a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
