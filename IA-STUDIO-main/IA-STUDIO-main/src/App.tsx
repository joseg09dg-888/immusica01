import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { About } from './components/About';
import { Gallery } from './components/Gallery';
import { Store } from './components/Store';
import { Cart } from './components/Cart';
import { Footer } from './components/Footer';
import { AdminTools } from './components/AdminTools';
import { Product, CartItem } from './types';
import { fetchRemoteData, GalleryImage } from './services/dataService';
import { PRODUCTS, GALLERY_IMAGES } from './constants';

export default function App() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [gallery, setGallery] = useState<GalleryImage[]>(GALLERY_IMAGES);
  const [loading, setLoading] = useState(true);

  // Load remote data from Google Sheets
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const data = await fetchRemoteData();
      setProducts(data.products);
      setGallery(data.gallery);
      setLoading(false);
    };
    loadData();
  }, []);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('nath_piercer_cart');
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (e) {
        console.error('Error loading cart', e);
      }
    }
  }, []);

  // Save cart to localStorage on change
  useEffect(() => {
    localStorage.setItem('nath_piercer_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product: Product) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (id: string, delta: number) => {
    setCartItems(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-zinc-950 selection:bg-violet-500 selection:text-white">
      <Navbar cartCount={cartCount} onCartClick={() => setIsCartOpen(true)} />
      
      <main>
        <Hero />
        <About />
        <Gallery images={gallery} />
        <Store products={products} addToCart={addToCart} />
      </main>

      <Cart 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        cartItems={cartItems}
        updateQuantity={updateQuantity}
        removeFromCart={removeFromCart}
      />

      <AdminTools 
        isOpen={isAdminOpen} 
        onClose={() => setIsAdminOpen(false)} 
      />

      <Footer onAdminClick={() => setIsAdminOpen(true)} />
    </div>
  );
}
