import React, { useState, useEffect } from 'react';
import { createFacebookCampaign, getCampaigns, getCampaignInsights } from '../services/api';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Facebook, Target, DollarSign, Calendar, Rocket, 
  Loader2, CheckCircle2, AlertCircle, Sparkles, 
  Zap, ArrowRight, Globe, BarChart3, TrendingUp,
  Eye, MousePointer2, Activity, MoreVertical, X
} from 'lucide-react';
import { toast } from 'sonner';

const FacebookAds: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'create' | 'manage'>('create');
  const [loading, setLoading] = useState(false);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [insights, setInsights] = useState<any>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);

  const [formData, setFormData] = useState({
    campaignName: '',
    objective: 'OUTCOME_TRAFFIC',
    budgetType: 'daily',
    budgetAmount: 500, // $5.00
    startDate: new Date().toISOString().split('T')[0],
    creative: {
      title: '',
      body: '',
      websiteUrl: '',
      callToAction: 'LEARN_MORE'
    }
  });

  useEffect(() => {
    if (activeTab === 'manage') {
      fetchCampaigns();
    }
  }, [activeTab]);

  const fetchCampaigns = async () => {
    setCampaignsLoading(true);
    try {
      const res = await getCampaigns();
      setCampaigns(res.data);
    } catch (err) {
      toast.error('Error loading campaigns');
    } finally {
      setCampaignsLoading(false);
    }
  };

  const handleViewInsights = async (campaignId: string) => {
    setSelectedCampaign(campaigns.find(c => c.id === campaignId));
    setInsightsLoading(true);
    try {
      const res = await getCampaignInsights(campaignId);
      setInsights(res.data[0] || null);
    } catch (err) {
      toast.error('Error loading insights');
    } finally {
      setInsightsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createFacebookCampaign(formData);
      toast.success('Campaign created successfully on Facebook!');
      setActiveTab('manage');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error creating campaign');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#1877F2]/5 blur-[120px] rounded-full -mr-64 -mt-64 animate-pulse-glow" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cyber-cyan/5 blur-[120px] rounded-full -ml-64 -mb-64 animate-pulse-glow" />

      <div className="max-w-6xl mx-auto space-y-16 relative z-10">
        <div className="text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1877F2]/10 border border-[#1877F2]/20 text-[#1877F2] text-[10px] font-black uppercase tracking-widest"
          >
            <Sparkles size={12} className="animate-pulse" />
            <span>Neural Conversion Engine</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl lg:text-9xl font-display font-black tracking-tighter uppercase leading-[0.85] italic"
          >
            Facebook <br />
            <span className="text-[#1877F2]">Ads Manager</span>
          </motion.h1>
          
          {/* Tabs */}
          <div className="flex items-center justify-center gap-4 pt-8">
            {[
              { id: 'create', label: 'Create Campaign', icon: Rocket },
              { id: 'manage', label: 'Manage Campaigns', icon: Activity },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-3 transition-all ${
                  activeTab === tab.id 
                    ? 'bg-[#1877F2] text-white shadow-xl shadow-[#1877F2]/20' 
                    : 'bg-white/5 text-white/40 hover:bg-white/10'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'create' ? (
            <motion.form 
              key="create"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              onSubmit={handleSubmit} 
              className="glass-card p-12 space-y-16 border-white/5 bg-white/[0.02] relative overflow-hidden"
            >
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#1877F2]/5 blur-[60px] rounded-full -mr-32 -mt-32" />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 relative z-10">
            {/* Basic Info */}
            <div className="space-y-10">
              <div className="flex items-center gap-4 text-cyber-cyan">
                <div className="w-10 h-10 rounded-xl bg-cyber-cyan/10 flex items-center justify-center">
                  <Target size={20} />
                </div>
                <h3 className="text-sm font-black uppercase tracking-[0.2em]">Campaign Architecture</h3>
              </div>
              
              <div className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/20 ml-1">Campaign Name</label>
                  <input
                    type="text"
                    required
                    value={formData.campaignName}
                    onChange={(e) => setFormData({...formData, campaignName: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm font-medium focus:border-cyber-cyan/40 focus:bg-white/10 outline-none transition-all"
                    placeholder="e.g. Neural Single Launch 2024"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/20 ml-1">Optimization Objective</label>
                  <div className="grid grid-cols-1 gap-3">
                    {[
                      { id: 'OUTCOME_TRAFFIC', label: 'Traffic', desc: 'Maximize link clicks' },
                      { id: 'OUTCOME_SALES', label: 'Sales', desc: 'Drive conversions' },
                      { id: 'OUTCOME_AWARENESS', label: 'Awareness', desc: 'Maximize reach' },
                    ].map((obj) => (
                      <button
                        key={obj.id}
                        type="button"
                        onClick={() => setFormData({...formData, objective: obj.id})}
                        className={`p-5 rounded-2xl border text-left transition-all flex items-center justify-between group ${
                          formData.objective === obj.id 
                            ? 'bg-cyber-cyan/10 border-cyber-cyan/40 text-cyber-cyan' 
                            : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="space-y-1">
                          <p className="text-sm font-black uppercase tracking-tight italic">{obj.label}</p>
                          <p className="text-[10px] font-medium opacity-60">{obj.desc}</p>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                          formData.objective === obj.id ? 'border-cyber-cyan bg-cyber-cyan text-ink' : 'border-white/10'
                        }`}>
                          {formData.objective === obj.id && <CheckCircle2 size={12} />}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Budget & Schedule */}
            <div className="space-y-10">
              <div className="flex items-center gap-4 text-emerald-400">
                <div className="w-10 h-10 rounded-xl bg-emerald-400/10 flex items-center justify-center">
                  <DollarSign size={20} />
                </div>
                <h3 className="text-sm font-black uppercase tracking-[0.2em]">Budget & Timeline</h3>
              </div>
              
              <div className="space-y-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/20 ml-1">Budget Type</label>
                    <select
                      value={formData.budgetType}
                      onChange={(e) => setFormData({...formData, budgetType: e.target.value as any})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm font-medium focus:border-cyber-cyan/40 focus:bg-white/10 outline-none appearance-none transition-all"
                    >
                      <option value="daily">Daily</option>
                      <option value="lifetime">Lifetime</option>
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/20 ml-1">Amount (USD)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                      <input
                        type="number"
                        required
                        value={formData.budgetAmount / 100}
                        onChange={(e) => setFormData({...formData, budgetAmount: parseFloat(e.target.value) * 100})}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-12 pr-5 text-sm font-medium focus:border-cyber-cyan/40 focus:bg-white/10 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/20 ml-1">Launch Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                    <input
                      type="date"
                      required
                      value={formData.startDate}
                      onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-12 pr-5 text-sm font-medium focus:border-cyber-cyan/40 focus:bg-white/10 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="p-8 bg-white/[0.02] rounded-[32px] border border-white/5 space-y-4">
                  <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Estimated Reach</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-display font-black text-emerald-400">1.2K - 4.5K</span>
                    <span className="text-xs text-white/20 font-bold uppercase tracking-widest">/ day</span>
                  </div>
                  <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="w-2/3 h-full bg-emerald-400 animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Creative */}
          <div className="space-y-10 pt-16 border-t border-white/5 relative z-10">
            <div className="flex items-center gap-4 text-neon-pink">
              <div className="w-10 h-10 rounded-xl bg-neon-pink/10 flex items-center justify-center">
                <Rocket size={20} />
              </div>
              <h3 className="text-sm font-black uppercase tracking-[0.2em]">Neural Ad Creative</h3>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
              <div className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/20 ml-1">Headline</label>
                  <input
                    type="text"
                    required
                    value={formData.creative.title}
                    onChange={(e) => setFormData({...formData, creative: {...formData.creative, title: e.target.value}})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm font-medium focus:border-cyber-cyan/40 focus:bg-white/10 outline-none transition-all"
                    placeholder="e.g. Listen to my new neural single!"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/20 ml-1">Ad Body Copy</label>
                  <textarea
                    required
                    value={formData.creative.body}
                    onChange={(e) => setFormData({...formData, creative: {...formData.creative, body: e.target.value}})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm font-medium focus:border-cyber-cyan/40 focus:bg-white/10 outline-none min-h-[150px] transition-all"
                    placeholder="Tell your neural story..."
                  />
                </div>
              </div>
              
              <div className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/20 ml-1">Destination URL</label>
                  <div className="relative">
                    <Globe className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                    <input
                      type="url"
                      required
                      value={formData.creative.websiteUrl}
                      onChange={(e) => setFormData({...formData, creative: {...formData.creative, websiteUrl: e.target.value}})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-12 pr-5 text-sm font-medium focus:border-cyber-cyan/40 focus:bg-white/10 outline-none transition-all"
                      placeholder="https://open.spotify.com/..."
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/20 ml-1">Call to Action</label>
                  <select
                    value={formData.creative.callToAction}
                    onChange={(e) => setFormData({...formData, creative: {...formData.creative, callToAction: e.target.value as any}})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm font-medium focus:border-cyber-cyan/40 focus:bg-white/10 outline-none appearance-none transition-all"
                  >
                    <option value="LEARN_MORE">Learn More</option>
                    <option value="SHOP_NOW">Shop Now</option>
                    <option value="SIGN_UP">Sign Up</option>
                    <option value="LISTEN_NOW">Listen Now</option>
                  </select>
                </div>

                <div className="p-8 bg-[#1877F2]/5 rounded-[32px] border border-[#1877F2]/10 flex items-center gap-6">
                  <div className="w-14 h-14 bg-[#1877F2] text-white rounded-2xl flex items-center justify-center shadow-xl shadow-[#1877F2]/20">
                    <Facebook size={24} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-black uppercase tracking-tight italic">Meta Integration</p>
                    <p className="text-[10px] font-medium text-white/40">Direct neural link to your Ad Account</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-8 bg-[#1877F2] text-white rounded-[2rem] font-black uppercase tracking-[0.4em] text-[10px] shadow-2xl shadow-[#1877F2]/20 hover:shadow-[#1877F2]/40 hover:scale-[1.02] transition-all flex items-center justify-center gap-4 relative overflow-hidden group/btn"
          >
            <div className="absolute inset-0 bg-white translate-y-full group-hover/btn:translate-y-0 transition-transform duration-500 ease-out" />
            <span className="relative z-10 flex items-center gap-4">
              {loading ? <Loader2 className="animate-spin" size={20} /> : <Zap size={20} />}
              <span>{loading ? 'Processing Neural Campaign...' : 'Initialize Facebook Campaign'}</span>
            </span>
          </button>
        </motion.form>
      ) : (
        <motion.div 
          key="manage"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="space-y-8"
        >
          {campaignsLoading ? (
            <div className="py-20 flex items-center justify-center">
              <Loader2 className="animate-spin text-[#1877F2]" size={48} />
            </div>
          ) : campaigns.length === 0 ? (
            <div className="glass-card p-20 text-center space-y-6">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto text-white/20">
                <Activity size={32} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/20">No active neural campaigns found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {campaigns.map((campaign, i) => (
                <motion.div
                  key={campaign.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-card p-8 flex flex-col md:flex-row items-center gap-10 group hover:bg-white/[0.05] transition-all border-white/5"
                >
                  <div className="w-20 h-20 bg-[#1877F2]/10 rounded-[1.5rem] flex items-center justify-center text-[#1877F2] flex-shrink-0">
                    <Facebook size={32} />
                  </div>
                  
                  <div className="flex-1 space-y-2 text-center md:text-left">
                    <h3 className="text-2xl font-display font-black uppercase tracking-tight italic">{campaign.name}</h3>
                    <div className="flex items-center justify-center md:justify-start gap-6 text-[10px] font-black uppercase tracking-widest text-white/20">
                      <span className="flex items-center gap-2">
                        <Target size={12} />
                        {campaign.objective}
                      </span>
                      <span className="w-1 h-1 bg-white/10 rounded-full" />
                      <span className="flex items-center gap-2">
                        <DollarSign size={12} />
                        ${(campaign.daily_budget / 100).toFixed(2)} / day
                      </span>
                      <span className="w-1 h-1 bg-white/10 rounded-full" />
                      <span className={`px-3 py-1 rounded-full border ${
                        campaign.status === 'ACTIVE' ? 'bg-emerald-400/10 border-emerald-400/20 text-emerald-400' : 'bg-white/5 border-white/10 text-white/40'
                      }`}>
                        {campaign.status}
                      </span>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleViewInsights(campaign.id)}
                    className="px-8 py-4 bg-white/5 hover:bg-white/10 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center gap-3 transition-all"
                  >
                    <BarChart3 size={16} />
                    View Insights
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>

    {/* Insights Modal */}
    <AnimatePresence>
      {selectedCampaign && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedCampaign(null)}
            className="absolute inset-0 bg-ink/95 backdrop-blur-2xl"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 40 }}
            className="glass-card w-full max-w-4xl max-h-[90vh] overflow-y-auto relative z-10 border-white/10 bg-white/[0.02]"
          >
            <div className="sticky top-0 z-20 bg-ink/50 backdrop-blur-2xl p-10 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-8">
                <div className="w-16 h-16 rounded-2xl bg-[#1877F2]/10 flex items-center justify-center text-[#1877F2]">
                  <Facebook size={32} />
                </div>
                <div>
                  <h2 className="text-3xl font-display font-black uppercase tracking-tight italic">{selectedCampaign.name}</h2>
                  <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Neural Conversion Insights</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedCampaign(null)}
                className="w-12 h-12 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-12 space-y-16">
              {insightsLoading ? (
                <div className="py-20 flex items-center justify-center">
                  <Loader2 className="animate-spin text-[#1877F2]" size={48} />
                </div>
              ) : insights ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                      { label: 'Impressions', value: insights.impressions, icon: Eye, color: 'text-cyber-cyan', bg: 'bg-cyber-cyan/10' },
                      { label: 'Link Clicks', value: insights.inline_link_clicks, icon: MousePointer2, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
                      { label: 'Spend (USD)', value: `$${insights.spend}`, icon: DollarSign, color: 'text-neon-pink', bg: 'bg-neon-pink/10' }
                    ].map((stat, i) => (
                      <div key={i} className="p-10 bg-white/[0.02] border border-white/5 rounded-[2.5rem] space-y-6">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">{stat.label}</p>
                          <div className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                            <stat.icon size={18} />
                          </div>
                        </div>
                        <p className="text-5xl font-display font-black italic tracking-tighter">{stat.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="p-10 bg-white/[0.02] border border-white/5 rounded-[2.5rem] space-y-4">
                      <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">CTR (Click-Through Rate)</p>
                      <p className="text-4xl font-display font-black italic text-cyber-cyan">{insights.ctr}%</p>
                      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(parseFloat(insights.ctr) * 10, 100)}%` }}
                          className="h-full bg-cyber-cyan" 
                        />
                      </div>
                    </div>
                    <div className="p-10 bg-white/[0.02] border border-white/5 rounded-[2.5rem] space-y-4">
                      <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">CPC (Cost Per Click)</p>
                      <p className="text-4xl font-display font-black italic text-emerald-400">${insights.cpc}</p>
                      <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Neural Efficiency Score: Optimal</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-20 text-center space-y-6 opacity-40">
                  <BarChart3 size={64} className="mx-auto text-white/10" />
                  <p className="text-[10px] font-black uppercase tracking-[0.4em]">No neural insights available for this campaign yet</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>

        <div className="flex items-center gap-6 p-10 bg-white/[0.02] rounded-[40px] border border-white/5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-cyber-cyan/5 to-transparent" />
          <div className="w-12 h-12 bg-cyber-cyan/10 rounded-full flex items-center justify-center text-cyber-cyan shrink-0 relative z-10">
            <AlertCircle size={24} />
          </div>
          <div className="space-y-1 relative z-10">
            <p className="text-sm font-bold uppercase tracking-tight italic">Safety Protocol</p>
            <p className="text-xs text-white/40 leading-relaxed">
              Note: Campaigns are created in <span className="text-white font-black">PAUSED</span> status for your final review in Meta Ads Manager. This ensures neural integrity before deployment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacebookAds;
