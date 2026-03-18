import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import api from '../services/api';

interface Track {
  id: number;
  title: string;
  scheduled_date?: string;
  status: string;
}

const ScheduleRelease: React.FC = () => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<number | ''>('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTracks();
    fetchScheduledTracks();
  }, []);

  const fetchTracks = async () => {
    try {
      const res = await api.get('/tracks');
      setTracks(res.data);
    } catch (error) {
      console.error('Error al cargar tracks:', error);
    }
  };

  const fetchScheduledTracks = async () => {
    try {
      await api.get('/releases/scheduled');
      // Solo para refrescar, no necesitamos guardar el resultado
    } catch (error) {
      console.error('Error al cargar programaciones:', error);
    }
  };

  const handleSchedule = async () => {
    if (!selectedTrack || !selectedDate) {
      setMessage('Selecciona un track y una fecha');
      return;
    }

    const today = new Date();
    if (selectedDate <= today) {
      setMessage('La fecha debe ser futura');
      return;
    }

    setLoading(true);
    try {
      await api.post(`/releases/track/${selectedTrack}/schedule`, {
        scheduled_date: selectedDate.toISOString()
      });
      setMessage('✅ Lanzamiento programado correctamente');
      fetchScheduledTracks();
      fetchTracks(); // para actualizar el estado en el select
    } catch (error: any) {
      setMessage('❌ Error: ' + (error.response?.data?.error || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (trackId: number) => {
    if (!confirm('¿Cancelar la programación de este track?')) return;
    try {
      await api.delete(`/releases/track/${trackId}/schedule`);
      setMessage('✅ Programación cancelada');
      fetchScheduledTracks();
      fetchTracks();
    } catch (error: any) {
      setMessage('❌ Error: ' + (error.response?.data?.error || 'Error desconocido'));
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h2>Programar Lanzamiento</h2>

      <div style={{ marginBottom: '20px' }}>
        <label>Selecciona una canción:</label>
        <select
          value={selectedTrack}
          onChange={(e) => setSelectedTrack(e.target.value ? Number(e.target.value) : '' )}
          style={{ width: '100%', padding: '8px', marginTop: '5px' }}
        >
          <option value="">-- Elige un track --</option>
          {tracks.map(track => (
            <option key={track.id} value={track.id}>
              {track.title} {track.status === 'scheduled' ? '(programado)' : ''}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label>Fecha de lanzamiento:</label>
        <Calendar
          onChange={setSelectedDate}
          value={selectedDate}
          minDate={new Date()}
          locale="es"
        />
      </div>

      <button
        onClick={handleSchedule}
        disabled={loading}
        style={{
          background: '#3b82f6',
          color: 'white',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '4px',
          cursor: 'pointer',
          width: '100%',
          fontSize: '16px'
        }}
      >
        {loading ? 'Programando...' : 'Programar lanzamiento'}
      </button>

      {message && (
        <div style={{ marginTop: '20px', padding: '10px', background: '#f0f0f0', borderRadius: '4px' }}>
          {message}
        </div>
      )}

      <h3 style={{ marginTop: '40px' }}>Tus lanzamientos programados</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ borderBottom: '2px solid #ddd', padding: '8px', textAlign: 'left' }}>Canción</th>
            <th style={{ borderBottom: '2px solid #ddd', padding: '8px', textAlign: 'left' }}>Fecha programada</th>
            <th style={{ borderBottom: '2px solid #ddd', padding: '8px', textAlign: 'left' }}>Acción</th>
          </tr>
        </thead>
        <tbody>
          {tracks.filter(t => t.status === 'scheduled').map(track => (
            <tr key={track.id}>
              <td style={{ borderBottom: '1px solid #ddd', padding: '8px' }}>{track.title}</td>
              <td style={{ borderBottom: '1px solid #ddd', padding: '8px' }}>
                {track.scheduled_date ? new Date(track.scheduled_date).toLocaleDateString() : ''}
              </td>
              <td style={{ borderBottom: '1px solid #ddd', padding: '8px' }}>
                <button
                  onClick={() => handleCancel(track.id)}
                  style={{ background: '#ef4444', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ScheduleRelease;