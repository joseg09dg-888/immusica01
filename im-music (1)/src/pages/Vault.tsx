import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Database, Upload, Download, Trash2, FileText, Music, Image, File } from 'lucide-react';
import { getVaultFiles, uploadToVault, deleteFromVault } from '../services/api';
import { toast } from 'sonner';

const Vault: React.FC = () => {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const res = await getVaultFiles();
      setFiles(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', file.name);

    try {
      await uploadToVault(formData);
      toast.success('Archivo subido al Vault');
      fetchFiles();
    } catch (error) {
      toast.error('Error al subir archivo');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteFromVault(id);
      toast.success('Archivo eliminado');
      fetchFiles();
    } catch (error) {
      toast.error('Error al eliminar archivo');
    }
  };

  const getFileIcon = (type: string) => {
    if (type.includes('audio')) return <Music size={20} />;
    if (type.includes('image')) return <Image size={20} />;
    if (type.includes('pdf') || type.includes('text')) return <FileText size={20} />;
    return <File size={20} />;
  };

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 bg-ink relative overflow-hidden">
      <div className="max-w-7xl mx-auto space-y-12 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-cyber-cyan">
              <Database size={24} />
              <span className="text-xs font-black uppercase tracking-[0.3em]">Neural Infrastructure</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-display font-black tracking-tighter uppercase italic">
              Artist <span className="text-white outline-text">Vault</span>
            </h1>
            <p className="text-white/40 max-w-xl text-lg">
              Tu backup seguro en la nube. Guarda masters, portadas y documentos críticos con cifrado neural.
            </p>
          </div>

          <label className="flex items-center gap-3 px-8 py-4 bg-cyber-cyan text-ink rounded-2xl font-black uppercase tracking-widest text-xs cursor-pointer hover:scale-105 transition-all shadow-xl shadow-cyber-cyan/20">
            {uploading ? 'Subiendo...' : (
              <>
                <Upload size={18} />
                <span>Subir al Vault</span>
              </>
            )}
            <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            [1,2,3].map(i => (
              <div key={i} className="glass-card p-8 h-48 animate-pulse bg-white/5" />
            ))
          ) : files.length === 0 ? (
            <div className="col-span-full py-20 text-center glass-card border-dashed border-white/10">
              <Database size={48} className="mx-auto text-white/10 mb-4" />
              <p className="text-white/20 font-black uppercase tracking-widest">El Vault está vacío</p>
            </div>
          ) : (
            files.map((file) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-6 flex flex-col justify-between group hover:bg-white/5 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-white/40 group-hover:text-cyber-cyan transition-colors">
                    {getFileIcon(file.file_type || '')}
                  </div>
                  <div className="flex gap-2">
                    <a 
                      href={file.file_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-white/10 rounded-lg text-white/20 hover:text-white transition-all"
                    >
                      <Download size={18} />
                    </a>
                    <button 
                      onClick={() => handleDelete(file.id)}
                      className="p-2 hover:bg-red-500/10 rounded-lg text-white/20 hover:text-red-500 transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="mt-8 space-y-1">
                  <h3 className="font-bold text-white truncate">{file.name}</h3>
                  <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-white/20">
                    <span>{(file.file_size / 1024 / 1024).toFixed(2)} MB</span>
                    <span className="w-1 h-1 rounded-full bg-white/10" />
                    <span>{new Date(file.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Vault;
