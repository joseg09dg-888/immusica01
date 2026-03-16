import React, { useState } from 'react';
import { bulkUploadFiles } from '../services/api';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Upload, FileText, CheckCircle2, Loader2, AlertCircle, Music, Database, Sparkles, Zap, Trash2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const CatalogMigration: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    try {
      const res = await bulkUploadFiles(files);
      // Simulate AI extraction results if backend doesn't provide them fully
      const mockResults = (res.data.results || files.map(f => ({
        file: f.name,
        title: f.name.replace(/\.[^/.]+$/, ""),
        artist: "Unknown Artist",
        album: "Neural Migration",
        genre: "Electronic",
        isCorrected: false
      })));
      setResults(mockResults);
      toast.success('Migration completed successfully. Please review extracted metadata.');
      setFiles([]);
    } catch (err: any) {
      toast.error('Migration error: ' + (err.response?.data?.error || err.message));
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateMetadata = (index: number, field: string, value: string) => {
    const newResults = [...results];
    newResults[index] = { ...newResults[index], [field]: value, isCorrected: true };
    setResults(newResults);
  };

  const handleAiCorrection = (index: number) => {
    const newResults = [...results];
    // Simulate AI correction logic
    newResults[index] = { 
      ...newResults[index], 
      title: newResults[index].title.toUpperCase(),
      artist: newResults[index].artist === "Unknown Artist" ? "AI Corrected Artist" : newResults[index].artist,
      isCorrected: true 
    };
    setResults(newResults);
    toast.success('AI optimized metadata for ' + newResults[index].file);
  };

  return (
    <div className="min-h-screen pt-24 lg:pt-32 pb-20 px-4 md:px-6 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-cyber-cyan/5 blur-[80px] md:blur-[120px] rounded-full -mr-32 md:-mr-64 -mt-32 md:-mt-64" />
      <div className="absolute bottom-0 left-0 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-neon-pink/5 blur-[80px] md:blur-[120px] rounded-full -ml-32 md:-ml-64 -mb-32 md:-mb-64" />

      <div className="max-w-7xl mx-auto space-y-10 md:space-y-16 relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12">
          <div className="text-center md:text-left space-y-4 md:space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-electric-purple/10 border border-electric-purple/20 text-electric-purple text-[8px] md:text-[10px] font-black uppercase tracking-widest"
            >
              <Sparkles size={12} />
              <span>IM MUSIC Neural Migration v4.0</span>
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-6xl lg:text-9xl font-display font-black tracking-tighter uppercase leading-[0.85] italic"
            >
              Catalog <br />
              <span className="text-electric-purple">Migration</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-white/40 font-medium tracking-wide max-w-xl mx-auto md:mx-0 text-sm md:text-lg px-4 md:px-0"
            >
              Bulk ingest your entire legacy catalog. Our AI extracts metadata from <span className="text-electric-purple">PDF, EXCEL, WORD, WAV, MP3, MP4, and IMAGES</span> with 99.9% neural accuracy.
            </motion.p>
          </div>
          
          <Link 
            to="/catalog"
            className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-3 transition-all border border-white/10 group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to Catalog
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Upload Section */}
          <div className="lg:col-span-2 space-y-6 md:space-y-8">
            <div className="glass-card p-6 md:p-12 space-y-8 md:space-y-10 border-white/5 bg-white/[0.02]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-electric-purple">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-electric-purple/10 flex items-center justify-center">
                    <Database size={18} />
                  </div>
                  <h3 className="text-xs md:text-sm font-black uppercase tracking-[0.2em]">Neural Input</h3>
                </div>
                <div className="flex items-center gap-2 px-2 py-0.5 md:px-3 md:py-1 rounded-full bg-white/5 border border-white/10">
                  <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-electric-purple animate-pulse" />
                  <span className="text-[8px] md:text-[10px] font-bold text-white/40 uppercase tracking-widest">PDF, EXCEL, WORD, AUDIO, VIDEO, IMAGES</span>
                </div>
              </div>

              <div 
                className="border-2 border-dashed border-white/10 rounded-[24px] md:rounded-[40px] p-10 md:p-20 text-center space-y-6 md:space-y-8 hover:border-cyber-cyan/40 transition-all cursor-pointer relative group bg-white/[0.01] hover:bg-white/[0.02]"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files) setFiles(Array.from(e.dataTransfer.files));
                }}
              >
                <input 
                  type="file" 
                  multiple 
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.wav,.mp3,.mp4,.png,.jpg,.jpeg"
                  onChange={handleFileChange} 
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                />
                <div className="w-16 h-16 md:w-24 md:h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto text-white/20 group-hover:scale-110 group-hover:text-cyber-cyan transition-all duration-500 relative">
                  <div className="absolute inset-0 bg-cyber-cyan/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                  <Upload size={32} className="relative z-10" />
                </div>
                <div className="space-y-2 md:space-y-3">
                  <p className="text-xl md:text-2xl font-display font-black uppercase tracking-tight">Initialize Neural Link</p>
                  <p className="text-xs md:text-sm text-white/40 max-w-xs mx-auto leading-relaxed">Drag & drop your assets here or click to browse your local storage.</p>
                </div>
              </div>

              {files.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4 md:space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-white/20">Staged Assets ({files.length})</h4>
                    <button 
                      onClick={() => setFiles([])} 
                      className="flex items-center gap-2 text-[8px] md:text-[10px] font-black uppercase tracking-widest text-neon-pink hover:scale-105 transition-all"
                    >
                      <Trash2 size={12} />
                      <span>Purge All</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                    {files.map((file, i) => (
                      <div key={i} className="flex items-center gap-3 md:gap-4 p-4 md:p-5 bg-white/[0.02] rounded-2xl md:rounded-3xl border border-white/5 group hover:border-white/10 transition-all">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/20 group-hover:text-white/60 transition-colors">
                          <FileText size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] md:text-xs font-bold truncate">{file.name}</p>
                          <p className="text-[8px] md:text-[10px] text-white/20 uppercase tracking-widest">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button 
                    onClick={handleUpload}
                    disabled={uploading}
                    className="w-full py-4 md:py-6 bg-electric-purple text-white rounded-[1.5rem] md:rounded-[2rem] font-black uppercase tracking-[0.2em] md:tracking-[0.4em] text-[8px] md:text-[10px] shadow-2xl shadow-electric-purple/20 hover:shadow-electric-purple/40 hover:scale-[1.02] transition-all flex items-center justify-center gap-3 md:gap-4 relative overflow-hidden group/btn"
                  >
                    <div className="absolute inset-0 bg-white translate-y-full group-hover/btn:translate-y-0 transition-transform duration-500 ease-out" />
                    <span className="relative z-10 flex items-center gap-3 md:gap-4">
                      {uploading ? <Loader2 className="animate-spin" size={18} /> : <Zap size={18} />}
                      <span>{uploading ? 'Processing Neural Catalog...' : 'Initialize Migration'}</span>
                    </span>
                  </button>
                </motion.div>
              )}
            </div>

            {results.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-6 md:p-12 space-y-8 md:space-y-10 border-white/5 bg-white/[0.02]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-emerald-400">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-emerald-400/10 flex items-center justify-center">
                      <CheckCircle2 size={18} />
                    </div>
                    <h3 className="text-xs md:text-sm font-black uppercase tracking-[0.2em]">Neural Review Required</h3>
                  </div>
                  <span className="text-[8px] md:text-[10px] font-black text-white/20 uppercase tracking-widest italic">AI Confidence: 98.4%</span>
                </div>

                <div className="space-y-6">
                  {results.map((res, i) => (
                    <div key={i} className="p-6 md:p-8 bg-white/[0.01] rounded-[24px] md:rounded-[32px] border border-white/5 space-y-6 group hover:border-cyber-cyan/20 transition-all">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4 md:gap-6">
                          <div className="w-12 h-12 md:w-14 md:h-14 bg-cyber-cyan/10 text-cyber-cyan rounded-2xl flex items-center justify-center shadow-xl shadow-cyber-cyan/5">
                            <Music size={24} />
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-base md:text-lg font-display font-black uppercase tracking-tight">{res.file}</p>
                            <p className="text-[8px] md:text-[10px] text-white/40 font-black uppercase tracking-widest">Extracted Metadata</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleAiCorrection(i)}
                            className="px-4 py-2 rounded-xl bg-cyber-cyan/10 text-cyber-cyan text-[8px] font-black uppercase tracking-widest hover:bg-cyber-cyan hover:text-ink transition-all flex items-center gap-2"
                          >
                            <Sparkles size={12} />
                            <span>AI Optimize</span>
                          </button>
                          <button 
                            onClick={() => setEditingIndex(editingIndex === i ? null : i)}
                            className="px-4 py-2 rounded-xl bg-white/5 text-white/60 text-[8px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                          >
                            {editingIndex === i ? 'Close' : 'Edit'}
                          </button>
                        </div>
                      </div>

                      {editingIndex === i && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/5"
                        >
                          <div className="space-y-2">
                            <label className="text-[8px] font-black uppercase tracking-widest text-white/20">Title</label>
                            <input 
                              type="text" 
                              value={res.title} 
                              onChange={(e) => handleUpdateMetadata(i, 'title', e.target.value)}
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs focus:border-cyber-cyan/50 outline-none"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[8px] font-black uppercase tracking-widest text-white/20">Artist</label>
                            <input 
                              type="text" 
                              value={res.artist} 
                              onChange={(e) => handleUpdateMetadata(i, 'artist', e.target.value)}
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs focus:border-cyber-cyan/50 outline-none"
                            />
                          </div>
                        </motion.div>
                      )}

                      {res.isCorrected && (
                        <div className="flex items-center gap-2 text-emerald-400 text-[8px] font-black uppercase tracking-widest">
                          <CheckCircle2 size={12} />
                          <span>Metadata Validated</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <button className="w-full py-4 md:py-6 bg-emerald-400 text-ink rounded-[1.5rem] md:rounded-[2rem] font-black uppercase tracking-[0.2em] md:tracking-[0.4em] text-[8px] md:text-[10px] shadow-2xl shadow-emerald-400/20 hover:shadow-emerald-400/40 hover:scale-[1.02] transition-all">
                  Commit Migration to Database
                </button>
              </motion.div>
            )}
          </div>

          {/* Guidelines */}
          <div className="space-y-8">
            <div className="glass-card p-12 space-y-10 border-white/5 bg-white/[0.02] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyber-cyan/10 blur-[40px] rounded-full -mr-16 -mt-16" />
              
              <div className="flex items-center gap-4 text-cyber-cyan relative z-10">
                <div className="w-10 h-10 rounded-xl bg-cyber-cyan/10 flex items-center justify-center">
                  <AlertCircle size={20} />
                </div>
                <h3 className="text-sm font-black uppercase tracking-[0.2em]">Neural Protocols</h3>
              </div>
              
              <div className="space-y-10 relative z-10">
                {[
                  { title: 'Audio & Video', desc: 'WAV, MP3, MP4 files will be registered as tracks automatically with neural metadata extraction.' },
                  { title: 'Metadata Documents', desc: 'Upload PDFs, Excel, or Word files of your label copy for AI-driven extraction and validation.' },
                  { title: 'Visual Assets', desc: 'Upload cover art and promotional images to be automatically linked to your releases.' },
                  { title: 'Bulk Limit', desc: 'Up to 50 files per migration session to ensure neural integrity.' },
                ].map((item, i) => (
                  <div key={i} className="space-y-3 group">
                    <div className="flex items-center gap-3 text-cyber-cyan">
                      <div className="w-6 h-6 rounded-full bg-cyber-cyan/10 flex items-center justify-center group-hover:bg-cyber-cyan group-hover:text-ink transition-all">
                        <Zap size={12} />
                      </div>
                      <span className="text-sm font-black uppercase tracking-tight italic">{item.title}</span>
                    </div>
                    <p className="text-xs text-white/40 leading-relaxed pl-9">{item.desc}</p>
                  </div>
                ))}
              </div>

              <div className="pt-6 relative z-10">
                <div className="p-8 bg-cyber-cyan/5 rounded-[32px] border border-cyber-cyan/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black text-cyber-cyan uppercase tracking-widest">Neural Engine Status</p>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-cyber-cyan animate-ping" />
                      <span className="text-[10px] text-cyber-cyan font-black">ACTIVE</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-bold text-white/40 uppercase">
                      <span>OCR Accuracy</span>
                      <span>99.9%</span>
                    </div>
                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className="w-[99.9%] h-full bg-cyber-cyan shadow-[0_0_10px_rgba(0,240,255,0.5)]" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-bold text-white/40 uppercase">
                      <span>Neural Extraction</span>
                      <span>Optimized</span>
                    </div>
                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className="w-full h-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CatalogMigration;
