import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ShoppingBag, Plus, Search } from 'lucide-react';
import { Product } from '../types';

interface StoreProps {
  products: Product[];
  addToCart: (product: Product) => void;
}

export const Store: React.FC<StoreProps> = ({ products, addToCart }) => {
  const [filter, setFilter] = useState<string>('All');
  const categories = ['All', 'Ear', 'Nose', 'Lip'];

  const filteredProducts = filter === 'All' 
    ? products 
    : products.filter(p => p.category === filter);

  return (
    <section id="store" className="py-24 bg-zinc-950">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
          <div className="space-y-4">
            <h2 className="text-sm uppercase tracking-[0.3em] text-violet-500 font-bold">Catálogo</h2>
            <h3 className="text-4xl font-bold text-zinc-100">Joyería de Titanio</h3>
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
                  filter === cat 
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/20' 
                    : 'bg-zinc-900 text-zinc-400 hover:text-zinc-100 border border-zinc-800'
                }`}
              >
                {cat === 'All' ? 'Todos' : cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-800 group hover:border-violet-500/30 transition-all"
            >
              <div className="aspect-square relative overflow-hidden">
                <img 
                  src={product.image} 
                  alt={product.name} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-4 right-4 bg-zinc-950/80 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                  <span className="text-xs font-bold text-violet-400 uppercase tracking-tighter">Titanium G23</span>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-lg font-bold text-zinc-100 mb-1">{product.name}</h4>
                    <p className="text-zinc-500 text-sm line-clamp-2">{product.description}</p>
                  </div>
                  <span className="text-violet-400 font-mono font-bold">${product.price.toLocaleString()}</span>
                </div>
                <button
                  onClick={() => addToCart(product)}
                  className="w-full bg-zinc-800 hover:bg-violet-600 text-zinc-100 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 group-hover:bg-violet-600"
                >
                  <Plus className="w-5 h-5" />
                  Añadir al Carrito
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
