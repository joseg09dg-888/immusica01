import React, { useState } from 'react';
import PlanCard from './PlanCard';
import { Sparkles, MessageCircle } from 'lucide-react';
import { motion } from 'motion/react';
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

const PlansList: React.FC = () => {
  const { t } = useTranslation();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');

  const plans: Plan[] = [
    {
      id: 'basic',
      name: 'Basic Rebellion',
      priceYearly: 50,
      priceMonthly: 5,
      description: 'Essential tools for the emerging independent artist.',
      features: [
        'Global Distribution',
        'Basic AI Marketing Tools',
        'Standard Performance Analytics',
        'Email Support'
      ]
    },
    {
      id: 'pro',
      name: 'Pro Rebellion',
      priceYearly: 99,
      priceMonthly: 10,
      description: 'Advanced neural infrastructure for scaling your career.',
      features: [
        'Everything in Basic',
        'AI Content Generation (30 days)',
        'Real-time Revenue Analytics',
        'Priority Support',
        'Facebook Ads Integration'
      ]
    },
    {
      id: 'premium',
      name: 'Premium Elite',
      priceYearly: null,
      priceMonthly: null,
      description: 'Full-scale artist development and management tools.',
      features: [
        'Everything in Pro',
        'Custom AI Branding Archetypes',
        'Legal Contract Review Agent',
        'Dedicated Artist Manager',
        'Catalog Migration Support'
      ],
      isContactRequired: true
    }
  ];

  return (
    <div className="space-y-16">
      {/* Billing Toggle */}
      <div className="flex flex-col items-center gap-6">
        <div className="flex items-center gap-4 p-2 bg-white/5 rounded-full border border-white/10 backdrop-blur-xl">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
              billingCycle === 'monthly' ? 'bg-cyber-cyan text-ink shadow-lg shadow-cyber-cyan/20' : 'text-white/40 hover:text-white'
            }`}
          >
            {t('monthly')}
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
              billingCycle === 'yearly' ? 'bg-cyber-cyan text-ink shadow-lg shadow-cyber-cyan/20' : 'text-white/40 hover:text-white'
            }`}
          >
            {t('yearly')}
            <span className="ml-2 text-[8px] opacity-60">{t('save_percentage', { percentage: 20 })}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {plans.map((plan, i) => (
          <PlanCard 
            key={plan.id} 
            plan={plan} 
            billingCycle={billingCycle}
            index={i} 
          />
        ))}
      </div>
      
      {/* Enterprise Section */}
      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="glass-card p-8 sm:p-12 text-center space-y-8 border-cyber-cyan/20 bg-gradient-to-br from-cyber-cyan/10 via-transparent to-neon-pink/5 relative overflow-hidden group"
      >
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:32px_32px]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyber-cyan/10 blur-[100px] rounded-full -mr-48 -mt-48 group-hover:bg-cyber-cyan/20 transition-colors duration-1000" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-neon-pink/10 blur-[100px] rounded-full -ml-48 -mb-48 group-hover:bg-neon-pink/20 transition-colors duration-1000" />

        <div className="w-20 h-20 bg-cyber-cyan/10 text-cyber-cyan rounded-3xl flex items-center justify-center mx-auto relative z-10 shadow-2xl shadow-cyber-cyan/20 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
          <Sparkles size={40} />
        </div>
        
        <div className="space-y-4 relative z-10">
          <h3 className="text-4xl lg:text-6xl font-display font-black uppercase tracking-tighter italic leading-none">
            Neural <span className="text-white outline-text">Enterprise</span>
          </h3>
          <p className="text-white/40 text-base max-w-2xl mx-auto font-medium leading-relaxed">
            {t('enterprise_desc')}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 relative z-10">
          <button 
            onClick={() => window.open('https://wa.me/573001234567?text=Hola,%20quiero%20información%20sobre%20el%20plan%20Enterprise.', '_blank')}
            className="px-12 py-6 bg-cyber-cyan text-ink rounded-2xl font-black uppercase tracking-[0.4em] text-[10px] hover:scale-105 transition-all shadow-2xl shadow-cyber-cyan/20 flex items-center gap-4 group/btn"
          >
            <MessageCircle size={18} />
            <span>{t('contact_whatsapp')}</span>
            <div className="w-8 h-px bg-ink/20 group-hover/btn:w-12 transition-all" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default PlansList;
