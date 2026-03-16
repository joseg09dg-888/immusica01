import React, { useState } from 'react';
import SplitForm from '../components/SplitForm';
import SplitsList from '../components/SplitsList';
import { motion, AnimatePresence } from 'motion/react';
import { UserPlus, List, Sparkles } from 'lucide-react';

const Splits: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'create' | 'manage'>('create');

  return (
    <div className="min-h-screen bg-ink pt-32 pb-20 px-6 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-electric-purple/5 blur-[150px] rounded-full -mr-64 -mt-64 animate-pulse-glow" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-cyber-cyan/5 blur-[150px] rounded-full -ml-64 -mb-64 animate-pulse-glow" />

      <div className="max-w-7xl mx-auto space-y-16 relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12">
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-electric-purple/10 border border-electric-purple/20 text-electric-purple text-[10px] font-black uppercase tracking-widest"
            >
              <Sparkles size={12} />
              <span>Neural Royalty Protocol</span>
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-6xl lg:text-9xl font-display font-black tracking-tighter uppercase leading-[0.85] italic"
            >
              Royalty <br />
              <span className="text-electric-purple">Splits</span>
            </motion.h1>
          </div>

          <div className="flex items-center gap-4 p-2 bg-white/5 rounded-[2rem] border border-white/10">
            <button
              onClick={() => setActiveTab('create')}
              className={`px-8 py-4 rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${
                activeTab === 'create' ? 'bg-electric-purple text-white shadow-xl shadow-electric-purple/20' : 'text-white/40 hover:text-white'
              }`}
            >
              <UserPlus size={14} />
              Create Split
            </button>
            <button
              onClick={() => setActiveTab('manage')}
              className={`px-8 py-4 rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${
                activeTab === 'manage' ? 'bg-electric-purple text-white shadow-xl shadow-electric-purple/20' : 'text-white/40 hover:text-white'
              }`}
            >
              <List size={14} />
              Manage Splits
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'create' ? (
            <motion.div
              key="create"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <SplitForm />
            </motion.div>
          ) : (
            <motion.div
              key="manage"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <SplitsList />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Splits;
