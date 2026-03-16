import React, { useEffect, useState } from 'react';
import { getPendingTasks } from '../../services/api';
import { ListTodo, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

const AdminTasks: React.FC = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPendingTasks()
      .then(res => setTasks(Array.isArray(res.data) ? res.data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="text-electric-purple animate-pulse font-black uppercase tracking-widest">Cargando Tareas...</div>
    </div>
  );

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-display font-black uppercase tracking-tighter italic flex items-center gap-3">
        <ListTodo className="text-electric-purple" size={24} />
        Tareas Pendientes
      </h2>

      <div className="glass-card overflow-hidden border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-white/40">ID</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-white/40">Tipo</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-white/40">Estado</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-white/40">Prioridad</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-white/40">Entrada/Salida</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-white/40">Creado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-white/20 uppercase font-black tracking-widest text-xs">
                    No hay tareas pendientes en la cola
                  </td>
                </tr>
              ) : (
                tasks.map(task => (
                  <tr key={task.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 text-xs font-mono text-white/40">{task.id}</td>
                    <td className="p-4">
                      <span className="text-[10px] font-black uppercase tracking-widest text-white">
                        {task.task_type}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {task.status === 'pending' ? <Clock size={14} className="text-white/40" /> :
                         task.status === 'completed' ? <CheckCircle2 size={14} className="text-emerald-400" /> :
                         <AlertCircle size={14} className="text-neon-pink" />}
                        <span className={`text-[10px] font-black uppercase tracking-widest ${
                          task.status === 'pending' ? 'text-white/40' :
                          task.status === 'completed' ? 'text-emerald-400' :
                          'text-neon-pink'
                        }`}>
                          {task.status}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`text-[10px] font-black px-2 py-1 rounded-md ${
                        task.priority >= 4 ? 'bg-neon-pink/20 text-neon-pink' :
                        task.priority >= 2 ? 'bg-electric-purple/20 text-electric-purple' :
                        'bg-white/10 text-white/40'
                      }`}>
                        P{task.priority}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <div className="text-[9px] text-white/40 truncate max-w-[200px]">IN: {task.input_data || '-'}</div>
                        <div className="text-[9px] text-electric-purple/40 truncate max-w-[200px]">OUT: {task.output_data || '-'}</div>
                        {task.error_message && (
                          <div className="text-[9px] text-neon-pink truncate max-w-[200px]">ERR: {task.error_message}</div>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-[10px] text-white/40">
                      {new Date(task.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminTasks;
