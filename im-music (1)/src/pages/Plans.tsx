import React from 'react';
import PlansList from '../components/PlansList';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';

const Plans: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen pt-32 pb-20 px-6">
      <div className="max-w-7xl mx-auto space-y-24">
        <div className="text-center space-y-8 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-electric-purple/10 blur-[100px] rounded-full pointer-events-none" />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-6 relative z-10"
          >
            <h1 className="text-3xl sm:text-6xl lg:text-[10vw] font-display font-black tracking-tighter uppercase leading-[0.85] italic">
              {t('choose_rebellion')}
            </h1>
            <p className="text-white/60 text-xl max-w-2xl mx-auto font-medium leading-relaxed">
              {t('plans_desc')}
            </p>
          </motion.div>
        </div>
        <PlansList />
      </div>
    </div>
  );
};

export default Plans;
