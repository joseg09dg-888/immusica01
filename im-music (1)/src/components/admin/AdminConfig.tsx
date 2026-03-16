import React, { useEffect, useState } from 'react';
import { getAiConfig, setEmergencyStop } from '../../services/api';
import { Settings, ShieldAlert, ShieldCheck, Cpu } from 'lucide-react';
import { toast } from 'sonner';

const AdminConfig: React.FC = () => {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await getAiConfig();
      setConfig(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEmergency = async (stop: boolean) => {
    try {
      await setEmergencyStop(stop);
      toast.success(stop ? 'EMERGENCY STOP ACTIVATED' : 'EMERGENCY STOP DEACTIVATED');
      await fetchConfig();
    } catch (error) {
      toast.error('Failed to toggle emergency stop');
      console.error(error);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="text-electric-purple animate-pulse font-black uppercase tracking-widest">Cargando Configuración...</div>
    </div>
  );

  return (
    <div className="max-w-4xl space-y-12">
      <div className="space-y-6">
        <h2 className="text-2xl font-display font-black uppercase tracking-tighter italic flex items-center gap-3">
          <Settings className="text-electric-purple" size={24} />
          Configuración de IA
        </h2>

        <div className="glass-card p-8 border-white/10 space-y-8">
          <div className="flex items-center justify-between p-6 rounded-2xl bg-white/5 border border-white/10">
            <div className="space-y-1">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <ShieldAlert className={config?.emergency_stop ? 'text-neon-pink' : 'text-emerald-400'} size={20} />
                Interruptor de Emergencia
              </h3>
              <p className="text-xs text-white/40">Desactiva todas las acciones autónomas de la IA de inmediato.</p>
            </div>
            <button 
              onClick={() => handleEmergency(!config?.emergency_stop)}
              className={`px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl ${
                config?.emergency_stop 
                  ? 'bg-emerald-500 text-white shadow-emerald-500/20' 
                  : 'bg-neon-pink text-white shadow-neon-pink/20 animate-pulse'
              }`}
            >
              {config?.emergency_stop ? 'Desactivar Emergencia' : 'Activar Emergencia'}
            </button>
          </div>

          <div className="space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-white/20 px-2 flex items-center gap-2">
              <Cpu size={14} />
              Estado de Agente Autónomo
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-1">
                <span className="text-[8px] font-black uppercase tracking-widest text-white/20">Modo de Operación</span>
                <p className="text-sm font-bold text-electric-purple uppercase italic tracking-tighter">Neural Autonomous v4</p>
              </div>
              <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-1">
                <span className="text-[8px] font-black uppercase tracking-widest text-white/20">Nivel de Confianza</span>
                <p className="text-sm font-bold text-emerald-400 uppercase italic tracking-tighter">98.4% Optimized</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-white/20 px-2">Raw Configuration Data</h4>
            <div className="bg-black/60 rounded-2xl p-6 border border-white/5 font-mono text-[11px] text-electric-purple/80 overflow-auto max-h-60 custom-scrollbar">
              <pre>{JSON.stringify(config, null, 2)}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminConfig;
