import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const AuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { handleAuthCallback } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      handleAuthCallback(code).then(() => {
        navigate('/dashboard');
      });
    } else {
      navigate('/');
    }
  }, [searchParams, handleAuthCallback, navigate]);

  return (
    <div className="h-screen flex flex-col items-center justify-center gap-4 bg-ink">
      <Loader2 className="animate-spin text-cyber-cyan" size={48} />
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Authenticating with Spotify...</p>
    </div>
  );
};

export default AuthCallback;
