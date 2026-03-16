import React from 'react';
import { motion } from 'motion/react';
import { Zap, ShieldCheck, CheckCircle2, MessageCircle, Rocket, Loader2 } from 'lucide-react';
import { createWompiPayment } from '../services/api';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface Plan {
  id: string;
  name: string;
  priceYearly: number | null;
  priceMonthly: number | null;
  description: string;
  features: string[];
  isContactRequired?: boolean;
}

interface Props {
  plan: Plan;
  billingCycle: 'monthly' | 'yearly';
  index: number;
}

const PlanCard: React.FC<Props> = ({ plan, billingCycle, index }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = React.useState(false);
  const isPremium = plan.id === 'premium';
  const whatsappNumber = '573001234567'; // Cambia por tu número

  const currentPrice = billingCycle === 'yearly' ? plan.priceYearly : plan.priceMonthly;

  const handleClick = async () => {
    if (isPremium || plan.isContactRequired) {
      const message = encodeURIComponent(`Hola, quiero información sobre el plan ${plan.name}.`);
      window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
    } else {
      if (!currentPrice) return;
      
      setLoading(true);
      try {
        const res = await createWompiPayment(
          plan.id,
          currentPrice // Pass the base amount, backend handles cents conversion
        );
        
        // Redirect to Wompi checkout or handle response
        if (res.data.checkoutUrl) {
          window.location.href = res.data.checkoutUrl;
        } else {
          toast.success('Iniciando proceso de pago...');
        }
      } catch (err) {
        toast.error('Error al procesar el pago. Intenta de nuevo.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -10, scale: 1.02 }}
      className={`glass-card p-6 sm:p-10 flex flex-col gap-10 relative overflow-hidden group border-white/5 ${isPremium ? 'border-cyber-cyan/40 bg-cyber-cyan/5' : ''}`}
    >
      {/* Animated Background Glow */}
      <div className={`absolute inset-0 bg-gradient-to-br ${isPremium ? 'from-cyber-cyan/10 to-transparent' : 'from-white/5 to-transparent'} opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
      
      {isPremium && (
        <div className="absolute top-0 right-0 bg-electric-purple text-white px-6 py-2 rounded-bl-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-electric-purple/20 z-20">
          IM MUSIC
        </div>
      )}
      
      <div className="space-y-6 relative z-10">
        <div className={`w-16 h-16 rounded-3xl flex items-center justify-center transition-all duration-500 ${
          isPremium ? 'bg-cyber-cyan text-ink shadow-2xl shadow-cyber-cyan/20' : 'bg-white/5 text-white/40 group-hover:bg-white/10 group-hover:text-white'
        }`}>
          {isPremium ? <ShieldCheck size={32} /> : <Zap size={32} />}
        </div>
        
        <div className="space-y-2">
          <h3 className="text-4xl font-display font-black tracking-tighter leading-none uppercase italic group-hover:text-cyber-cyan transition-colors">
            {plan.name}
          </h3>
          <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">{plan.description}</p>
        </div>

        <div className="flex items-baseline gap-2">
          {currentPrice !== null ? (
            <>
              <span className="text-5xl lg:text-6xl font-display font-black text-white tracking-tighter italic">
                ${currentPrice}
              </span>
              <span className="text-white/20 text-[10px] font-black uppercase tracking-widest">
                / {billingCycle === 'yearly' ? t('yearly').toLowerCase() : t('monthly').toLowerCase()}
              </span>
            </>
          ) : (
            <span className="text-4xl font-display font-black text-white tracking-tighter italic uppercase">
              {t('contact_us')}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-4 flex-1 relative z-10">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 mb-6">{t('neural_features')}</p>
        {plan.features.map((feature: string, i: number) => (
          <div key={i} className="flex items-start gap-4 text-xs text-white/40 group-hover:text-white/80 transition-colors">
            <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-cyber-cyan/20 group-hover:text-cyber-cyan transition-colors">
              <CheckCircle2 size={12} />
            </div>
            <span className="font-medium leading-relaxed">{feature}</span>
          </div>
        ))}
      </div>

      <button 
        onClick={handleClick}
        disabled={loading}
        className={`w-full py-6 rounded-2xl font-black uppercase tracking-[0.4em] text-[10px] transition-all shadow-2xl flex items-center justify-center gap-4 relative z-10 overflow-hidden group/btn ${
          loading ? 'opacity-50 cursor-not-allowed' : ''
        } ${
          isPremium 
            ? 'bg-cyber-cyan text-ink shadow-cyber-cyan/20 hover:shadow-cyber-cyan/40' 
            : 'bg-white/5 text-white border border-white/10 hover:bg-white hover:text-ink shadow-white/0 hover:shadow-white/10'
        }`}
      >
        <div className="absolute inset-0 bg-white translate-y-full group-hover/btn:translate-y-0 transition-transform duration-500 ease-out" />
        <span className="relative z-10 flex items-center gap-4">
          {loading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : isPremium ? (
            <>
              <MessageCircle size={18} />
              <span>{t('contact_hq')}</span>
            </>
          ) : (
            <>
              <Rocket size={18} />
              <span>{t('initialize_upgrade')}</span>
            </>
          )}
        </span>
      </button>

      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-cyber-cyan/5 blur-[60px] rounded-full -mr-24 -mt-24 group-hover:bg-cyber-cyan/10 transition-colors duration-1000" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-neon-pink/5 blur-[60px] rounded-full -ml-24 -mb-24 group-hover:bg-neon-pink/10 transition-colors duration-1000" />
      
      {/* Scanline Effect */}
      <div className="absolute inset-0 bg-scanline opacity-[0.02] pointer-events-none" />
    </motion.div>
  );
};

export default PlanCard;
