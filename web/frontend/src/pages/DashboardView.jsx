import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import ProfileTab from '../components/ProfileTab';
import TimerTab from '../components/TimerTab';
import ShopTab from '../components/ShopTab';
import LeaderboardTab from '../components/LeaderboardTab';

export default function DashboardView({ session }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('timer'); // 'timer', 'profile', 'shop', 'leaderboard'

  const fetchProfileFromPython = useCallback(async () => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
    try {
      const response = await fetch(`${backendUrl}/api/me`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [session.access_token]);

  useEffect(() => {
    fetchProfileFromPython();
  }, [fetchProfileFromPython]);

  return (
    <div style={{ display: 'flex', width: '100%', minHeight: '100vh' }}>
      <aside className="sidebar">
        <div style={{ marginBottom: '40px' }}>
          <h1 className="logo-font" style={{ fontSize: '1.25rem', color: 'var(--on-surface)' }}>FocusQuest</h1>
        </div>

        <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '99px', backgroundColor: 'var(--surface-container-highest)', overflow: 'hidden' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '24px', margin: '8px', color: 'var(--primary)' }}>person</span>
          </div>
          <div>
            <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--primary)' }}>Level {profile?.level || 1}</p>
            <p className="label-text" style={{ fontSize: '0.65rem' }}>{profile?.coins || 0} Gold</p>
          </div>
        </div>

        <nav style={{ flex: 1 }}>
          <button 
            className={`sidebar-item ${activeTab === 'timer' ? 'active' : ''}`} 
            style={{ width: '100%', border: 'none', background: activeTab === 'timer' ? 'var(--surface-container)' : 'transparent', textAlign: 'left', cursor: 'pointer' }}
            onClick={() => setActiveTab('timer')}
          >
            <span className="material-symbols-outlined">timer</span>
            <span>Timer</span>
          </button>
          <button 
            className={`sidebar-item ${activeTab === 'profile' ? 'active' : ''}`} 
            style={{ width: '100%', border: 'none', background: activeTab === 'profile' ? 'var(--surface-container)' : 'transparent', textAlign: 'left', cursor: 'pointer' }}
            onClick={() => setActiveTab('profile')}
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>person</span>
            <span>Profil</span>
          </button>
          <button 
            className={`sidebar-item ${activeTab === 'shop' ? 'active' : ''}`} 
            style={{ width: '100%', border: 'none', background: activeTab === 'shop' ? 'var(--surface-container)' : 'transparent', textAlign: 'left', cursor: 'pointer' }}
            onClick={() => setActiveTab('shop')}
          >
            <span className="material-symbols-outlined">shopping_bag</span>
            <span>Sklep</span>
          </button>
          <button 
            className={`sidebar-item ${activeTab === 'leaderboard' ? 'active' : ''}`} 
            style={{ width: '100%', border: 'none', background: activeTab === 'leaderboard' ? 'var(--surface-container)' : 'transparent', textAlign: 'left', cursor: 'pointer' }}
            onClick={() => setActiveTab('leaderboard')}
          >
            <span className="material-symbols-outlined">emoji_events</span>
            <span>Ranking</span>
          </button>
        </nav>

        <div style={{ marginTop: 'auto' }}>
          <button className="btn-primary" style={{ width: '100%' }} onClick={() => setActiveTab('timer')}>Start Focus</button>
        </div>
      </aside>

      <main style={{ flex: 1, backgroundColor: 'var(--surface)' }}>
        <header className="glass-nav" style={{ position: 'sticky', top: 0, padding: '16px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
            {activeTab === 'timer' && 'Sesja Pracy'}
            {activeTab === 'profile' && 'Karta Wojownika'}
            {activeTab === 'shop' && 'Skarbiec Leśny'}
            {activeTab === 'leaderboard' && 'Arena'}
          </h2>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
             <div style={{ padding: '4px 12px', backgroundColor: 'var(--surface-container)', borderRadius: '99px', display: 'flex', gap: '8px', alignItems: 'center' }}>
               <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#f59e0b', fontVariationSettings: "'FILL' 1" }}>toll</span>
               <span className="label-text" style={{ color: 'var(--on-surface)' }}>{profile?.coins || 0}</span>
             </div>
             <button className="btn-secondary" onClick={() => supabase.auth.signOut()}>Wyloguj</button>
          </div>
        </header>

        {activeTab === 'profile' && <ProfileTab profile={profile} />}
        {activeTab === 'timer' && <TimerTab session={session} onSessionComplete={fetchProfileFromPython} />}
        {activeTab === 'shop' && <ShopTab session={session} profile={profile} onUpdateProfile={fetchProfileFromPython} />}
        {activeTab === 'leaderboard' && <LeaderboardTab session={session} />}

        <div style={{ position: 'fixed', bottom: 0, left: 0, width: '100%', height: '20vh', background: 'linear-gradient(to top, var(--surface-container-low), transparent)', pointerEvents: 'none', zIndex: -1 }}></div>
      </main>

      <nav className="mobile-nav">
        <button className="btn-text" style={{ color: activeTab === 'timer' ? 'var(--primary)' : 'var(--on-surface-variant)', border: 'none', background: 'transparent' }} onClick={() => setActiveTab('timer')}>
          <span className="material-symbols-outlined">timer</span>
        </button>
        <button className="btn-text" style={{ color: activeTab === 'profile' ? 'var(--primary)' : 'var(--on-surface-variant)', border: 'none', background: 'transparent' }} onClick={() => setActiveTab('profile')}>
          <span className="material-symbols-outlined">person</span>
        </button>
        <button className="btn-text" style={{ color: activeTab === 'shop' ? 'var(--primary)' : 'var(--on-surface-variant)', border: 'none', background: 'transparent' }} onClick={() => setActiveTab('shop')}>
          <span className="material-symbols-outlined">shopping_bag</span>
        </button>
        <button className="btn-text" style={{ color: activeTab === 'leaderboard' ? 'var(--primary)' : 'var(--on-surface-variant)', border: 'none', background: 'transparent' }} onClick={() => setActiveTab('leaderboard')}>
          <span className="material-symbols-outlined">emoji_events</span>
        </button>
      </nav>
    </div>
  );
}
