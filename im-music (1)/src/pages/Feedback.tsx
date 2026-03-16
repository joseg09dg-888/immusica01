import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { MessageSquare, Send, History, Clock, CheckCircle, XCircle, Search } from 'lucide-react';
import { toast } from 'sonner';
import api from '../services/api';

interface FeedbackItem {
  id: number;
  type: string;
  title: string;
  description: string;
  status: 'pending' | 'reviewing' | 'implemented' | 'rejected';
  admin_notes?: string;
  created_at: string;
}

const FeedbackPage: React.FC = () => {
  const { t } = useTranslation();
  const [type, setType] = useState('suggestion');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [history, setHistory] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await api.get('/feedback/my');
      setHistory(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching feedback history:', error);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) {
      toast.error(t('error_generic'));
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post('/feedback', { type, title, description });

      if (response.status === 200 || response.status === 201) {
        toast.success(t('feedback.success_submit'));
        setTitle('');
        setDescription('');
        fetchHistory();
      } else {
        toast.error(t('error_generic'));
      }
    } catch (error) {
      toast.error(t('error_generic'));
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="text-white/40" size={16} />;
      case 'reviewing': return <Search className="text-cyber-cyan" size={16} />;
      case 'implemented': return <CheckCircle className="text-emerald-400" size={16} />;
      case 'rejected': return <XCircle className="text-neon-pink" size={16} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-20 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
        
        {/* Submit Feedback Form */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-8"
        >
          <div className="space-y-4">
            <h1 className="text-4xl font-display font-black uppercase tracking-tighter italic">
              {t('feedback.title')}
            </h1>
            <p className="text-white/60 font-medium">
              Help us build the future of IM Music. Your suggestions and bug reports are vital.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="glass-card p-8 space-y-6 border-white/10">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40 px-2">
                {t('feedback.type')}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['suggestion', 'bug', 'feature_request'].map((tKey) => (
                  <button
                    key={tKey}
                    type="button"
                    onClick={() => setType(tKey)}
                    className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                      type === tKey 
                        ? 'bg-cyber-cyan text-ink border-cyber-cyan shadow-lg shadow-cyber-cyan/20' 
                        : 'bg-white/5 text-white/40 border-white/5 hover:bg-white/10'
                    }`}
                  >
                    {t(`feedback.${tKey}`)}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40 px-2">
                {t('feedback.subject')}
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyber-cyan transition-colors"
                placeholder="Brief summary..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40 px-2">
                {t('feedback.description')}
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyber-cyan transition-colors resize-none"
                placeholder="Tell us more details..."
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-white text-ink rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-[1.02] transition-all disabled:opacity-50"
            >
              <Send size={18} />
              {submitting ? t('loading') : t('feedback.submit')}
            </button>
          </form>
        </motion.div>

        {/* Feedback History */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-8"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-display font-black uppercase tracking-tighter italic flex items-center gap-3">
              <History size={24} className="text-cyber-cyan" />
              {t('feedback.my_history')}
            </h2>
          </div>

          <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
            {loading ? (
              <div className="text-center py-12 text-white/20 uppercase font-black tracking-widest">
                {t('loading')}
              </div>
            ) : history.length === 0 ? (
              <div className="glass-card p-12 text-center border-white/5">
                <MessageSquare className="mx-auto text-white/10 mb-4" size={48} />
                <p className="text-white/20 uppercase font-black tracking-widest text-xs">
                  {t('feedback.no_feedback')}
                </p>
              </div>
            ) : (
              history.map((item) => (
                <div key={item.id} className="glass-card p-6 border-white/5 space-y-4 hover:border-white/10 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                          item.type === 'bug' ? 'bg-neon-pink/20 text-neon-pink' :
                          item.type === 'feature_request' ? 'bg-electric-purple/20 text-electric-purple' :
                          'bg-cyber-cyan/20 text-cyber-cyan'
                        }`}>
                          {t(`feedback.${item.type}`)}
                        </span>
                        <span className="text-[10px] text-white/20 font-medium">
                          {new Date(item.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="font-bold text-lg">{item.title}</h3>
                    </div>
                    <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                      {getStatusIcon(item.status)}
                      <span className="text-[10px] font-black uppercase tracking-widest">
                        {t(`feedback.${item.status}`)}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-white/60 leading-relaxed">
                    {item.description}
                  </p>

                  {item.admin_notes && (
                    <div className="bg-cyber-cyan/5 border border-cyber-cyan/10 p-4 rounded-xl space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-cyber-cyan">
                        {t('feedback.admin_notes')}
                      </p>
                      <p className="text-xs text-white/80 italic">
                        "{item.admin_notes}"
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default FeedbackPage;
