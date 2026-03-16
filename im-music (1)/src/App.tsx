import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import SpotifyCallback from './pages/SpotifyCallback';
import Plans from './pages/Plans';
import Splits from './pages/Splits';
import Stats from './pages/Stats';
import Marketing from './pages/Marketing';
import Legal from './pages/Legal';
import Marketplace from './pages/Marketplace';
import CatalogMigration from './pages/CatalogMigration';
import Financing from './pages/Financing';
import FacebookAds from './pages/FacebookAds';
import Catalog from './pages/Catalog';
import Wallet from './pages/Wallet';
import { Toaster } from 'sonner';

import HyperFollow from './pages/HyperFollow';
import CommunityChat from './pages/CommunityChat';
import Playlists from './pages/Playlists';
import PromoCards from './pages/PromoCards';
import Releases from './pages/Releases';
import Videos from './pages/Videos';
import Publishing from './pages/Publishing';
import Artists from './pages/Artists';
import AIChat from './pages/AIChat';
import Spotlight from './pages/Spotlight';
import Vault from './pages/Vault';
import Riaa from './pages/Riaa';
import SpotifyVerify from './pages/SpotifyVerify';
import YoutubeCID from './pages/YoutubeCID';
import Feedback from './pages/Feedback';
import AdminRoute from './routes/AdminRoute';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/spotify/callback" element={<SpotifyCallback />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/plans" element={<Plans />} />
          <Route path="/splits" element={<Splits />} />
          <Route path="/hyperfollow" element={<HyperFollow />} />
          <Route path="/chat" element={<CommunityChat />} />
          <Route path="/ai-chat" element={<AIChat />} />
          <Route path="/playlists" element={<Playlists />} />
          <Route path="/spotlight" element={<Spotlight />} />
          <Route path="/promo-cards" element={<PromoCards />} />
          <Route path="/releases" element={<Releases />} />
          <Route path="/videos" element={<Videos />} />
          <Route path="/publishing" element={<Publishing />} />
          <Route path="/artists" element={<Artists />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/marketing" element={<Marketing />} />
          <Route path="/legal" element={<Legal />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/migration" element={<CatalogMigration />} />
          <Route path="/financing" element={<Financing />} />
          <Route path="/facebook-ads" element={<FacebookAds />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/wallet" element={<Wallet />} />
          <Route path="/vault" element={<Vault />} />
          <Route path="/riaa" element={<Riaa />} />
          <Route path="/spotify-verify" element={<SpotifyVerify />} />
          <Route path="/youtube-cid" element={<YoutubeCID />} />
          <Route path="/feedback" element={<Feedback />} />
          <Route path="/admin/*" element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
