import React, { useState } from 'react';
import { getSpotifyMoodLogin, getMoodRecommendations } from '../services/api';
import { motion, AnimatePresence } from 'motion/react';
import { Music, Sparkles, Loader2, Play, ExternalLink, Headphones } from 'lucide-react';
import { toast } from 'sonner';

const MoodDiscovery: React.FC = () => {
  const [mood, setMood] = useState<string>('');
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const moods = [
    { id: 'alegre', label: 'Alegre', color: 'bg-yellow-400' },
    { id: 'energético', label: 'Energético', color: 'bg-orange-500' },
    { id: 'feliz', label: 'Feliz', color: 'bg-pink-400' },
    { id: 'relajado', label: 'Relajado', color: 'bg-emerald-400' },
    { id: 'romántico', label: 'Romántico', color: 'bg-red-400' },
    { id: 'triste', label: 'Triste', color: 'bg-blue-500' },
    { id: 'melancólico', label: 'Melancólico', color: 'bg-indigo-400' },
    { id: 'agresivo', label: 'Agresivo', color: 'bg-purple-600' },
  ];

  const handleMoodSelect = async (selectedMood: string) => {
    setMood(selectedMood);
    setLoading(true);
    try {
      const res = await getMoodRecommendations(selectedMood);
      setRecommendations(Array.isArray(res.data.tracks) ? res.data.tracks : []);
    } catch (err: any) {
      if (err.response?.status === 401) {
        toast.error('Spotify login required');
        getSpotifyMoodLogin();
      } else {
        toast.error('Error fetching recommendations');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card p-10 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-cyber-cyan">
          <Sparkles size={20} />
          <h3 className="text-xs font-black uppercase tracking-[0.2em]">Mood Discovery</h3>
        </div>
        <button 
          onClick={getSpotifyMoodLogin}
          className="text-[10px] font-black uppercase tracking-widest text-white/20 hover:text-white transition-colors"
        >
          Connect Spotify
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {moods.map((m) => (
          <button
            key={m.id}
            onClick={() => handleMoodSelect(m.id)}
            className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-3 ${
              mood === m.id 
                ? 'bg-white text-ink border-white' 
                : 'bg-white/5 border-white/5 hover:border-white/20'
            }`}
          >
            <div className={`w-3 h-3 rounded-full ${m.color}`} />
            <span className="text-[10px] font-black uppercase tracking-widest">{m.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-64 flex flex-col items-center justify-center gap-4 text-white/20"
          >
            <Loader2 className="animate-spin" size={32} />
            <p className="text-[10px] font-black uppercase tracking-widest">Finding your vibe...</p>
          </motion.div>
        ) : recommendations.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {Array.isArray(recommendations) && recommendations.map((track: any) => (
              <div key={track.id} className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 group hover:border-white/20 transition-all">
                <img 
                  src={track.album.images[0]?.url} 
                  alt={track.name} 
                  className="w-12 h-12 rounded-lg object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate">{track.name}</p>
                  <p className="text-[10px] text-white/40 truncate">{track.artists.map((a: any) => a.name).join(', ')}</p>
                </div>
                <a 
                  href={track.external_urls.spotify} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/20 hover:text-cyber-cyan hover:bg-cyber-cyan/10 transition-all"
                >
                  <ExternalLink size={14} />
                </a>
              </div>
            ))}
          </motion.div>
        ) : mood && (
          <div className="h-64 flex flex-col items-center justify-center gap-4 text-white/20">
            <Headphones size={48} />
            <p className="text-[10px] font-black uppercase tracking-widest">No tracks found for this mood</p>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MoodDiscovery;
