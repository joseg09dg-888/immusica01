import React, { useState, useEffect } from 'react';
import { ShoppingCart, X, Plus, Minus, Send, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CartItem } from '../types';
import { ARTIST_INFO } from '../constants';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  updateQuantity: (id: string, delta: number) => void;
  removeFromCart: (id: string) => void;
}

export const Cart: React.FC<CartProps> = ({ isOpen, onClose, cartItems, updateQuantity, removeFromCart }) => {
  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleWhatsAppOrder = () => {
    const itemsList = cartItems
      .map((item) => `- ${item.name} (x${item.quantity}): $${(item.price * item.quantity).toLocaleString()}`)
      .join('%0A');
    
    const message = `¡Hola Nath Piercer! 👋 Me gustaría cotizar las siguientes joyas:%0A%0A${itemsList}%0A%0A*Total estimado: $${total.toLocaleString()}*%0A%0A¿Están disponibles?`;
    
    window.open(`https://wa.me/${ARTIST_INFO.whatsapp}?text=${message}`, '_blank');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-zinc-900 text-zinc-100 shadow-2xl z-50 flex flex-col"
          >
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShoppingCart className="w-6 h-6 text-violet-500" />
                <h2 className="text-xl font-bold uppercase tracking-wider">Tu Carrito</h2>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {cartItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-zinc-500 space-y-4">
                  <ShoppingCart className="w-16 h-16 opacity-20" />
                  <p className="text-lg">Tu carrito está vacío</p>
                  <button 
                    onClick={onClose}
                    className="text-violet-500 hover:underline font-medium"
                  >
                    Ver catálogo
                  </button>
                </div>
              ) : (
                cartItems.map((item) => (
                  <div key={item.id} className="flex gap-4 group">
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium text-zinc-100">{item.name}</h3>
                        <button 
                          onClick={() => removeFromCart(item.id)}
                          className="text-zinc-500 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center bg-zinc-800 rounded-lg p-1">
                          <button 
                            onClick={() => updateQuantity(item.id, -1)}
                            className="p-1 hover:text-emerald-500 transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center text-sm font-mono">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, 1)}
                            className="p-1 hover:text-violet-500 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <span className="font-mono text-violet-400">
                          ${(item.price * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cartItems.length > 0 && (
              <div className="p-6 border-t border-zinc-800 bg-zinc-900/50 backdrop-blur-md">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-zinc-400 uppercase text-xs tracking-widest font-bold">Total Estimado</span>
                  <span className="text-2xl font-mono text-violet-400 font-bold">${total.toLocaleString()}</span>
                </div>
                <button
                  onClick={handleWhatsAppOrder}
                  className="w-full bg-violet-600 hover:bg-violet-500 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-violet-900/20"
                >
                  <Send className="w-5 h-5" />
                  PEDIR POR WHATSAPP
                </button>
                <p className="text-center text-zinc-500 text-xs mt-4">
                  Se generará un mensaje automático para Natalia.
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
