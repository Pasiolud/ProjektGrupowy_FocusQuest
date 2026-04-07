import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export default function DashboardView({ session }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileFromPython = async () => {
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
    };
    fetchProfileFromPython();
  }, [session]);

  return (
    <div style={{ display: 'flex', width: '100%', minHeight: '100vh' }}>
      {/* Sidebar - The Organic Sanctuary */}
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
          <a href="#" className="sidebar-item active">
            <span className="material-symbols-outlined">timer</span>
            <span>Timer</span>
          </a>
          <a href="#" className="sidebar-item">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>person</span>
            <span>Profil</span>
          </a>
          <a href="#" className="sidebar-item">
            <span className="material-symbols-outlined">shopping_bag</span>
            <span>Sklep</span>
          </a>
        </nav>

        <div style={{ marginTop: 'auto' }}>
          <button className="btn-primary" style={{ width: '100%' }}>Start Focus</button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, backgroundColor: 'var(--surface)' }}>
        <header className="glass-nav" style={{ position: 'sticky', top: 0, padding: '16px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Dashboard</h2>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
             <div style={{ padding: '4px 12px', backgroundColor: 'var(--surface-container)', borderRadius: '99px', display: 'flex', gap: '8px', alignItems: 'center' }}>
               <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#f59e0b', fontVariationSettings: "'FILL' 1" }}>toll</span>
               <span className="label-text" style={{ color: 'var(--on-surface)' }}>{profile?.coins || 0}</span>
             </div>
             <button className="btn-secondary" onClick={() => supabase.auth.signOut()}>Wyloguj</button>
          </div>
        </header>

        <div className="page-container">
          <section style={{ marginBottom: '48px' }}>
            <p className="label-text" style={{ color: 'var(--primary)', marginBottom: '8px' }}>Current Standing</p>
            <h1 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '16px' }}>Hero Level {profile?.level || 1}</h1>
            <p className="body-secondary" style={{ maxWidth: '600px' }}>
              Twoja ścieżka do mistrzostwa koncentracji. Każda sesja przybliża Cię do kolejnego poziomu wtajemniczenia.
            </p>
          </section>

          {/* Stats Bento Grid */}
          <div className="bento-grid">
            <div className="card" style={{ gridColumn: 'span 8', backgroundColor: 'var(--surface-container-low)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '16px' }}>
                <h3 className="label-text">Progress to Level {profile?.level + 1 || 2}</h3>
                <p style={{ fontWeight: 800 }}>{profile?.total_xp || 0} <span className="label-text">/ 2500 XP</span></p>
              </div>
              <div style={{ height: '8px', backgroundColor: 'var(--surface-container-highest)', borderRadius: '99px', overflow: 'hidden' }}>
                <div style={{ width: '35%', height: '100%', background: 'var(--primary-gradient)', borderRadius: '99px' }}></div>
              </div>
            </div>

            <div className="card" style={{ gridColumn: 'span 4', background: 'var(--primary-gradient)', color: 'white' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '32px', marginBottom: '16px', fontVariationSettings: "'FILL' 1" }}>account_balance_wallet</span>
              <h3 className="label-text" style={{ color: 'rgba(255,255,255,0.7)' }}>Focus Treasury</h3>
              <p style={{ fontSize: '2.5rem', fontWeight: 900 }}>{profile?.coins || 0}</p>
            </div>

            <div className="card" style={{ gridColumn: 'span 4', textAlign: 'center' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '32px', marginBottom: '8px' }}>local_fire_department</span>
              <p style={{ fontSize: '2rem', fontWeight: 900 }}>{profile?.current_streak || 0}</p>
              <p className="label-text">Dni Streaka</p>
            </div>

            <div className="card" style={{ gridColumn: 'span 4', textAlign: 'center' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '32px', marginBottom: '8px' }}>schedule</span>
              <p style={{ fontSize: '2rem', fontWeight: 900 }}>{(profile?.weekly_focus_seconds || 0 / 3600).toFixed(1)}</p>
              <p className="label-text">Godzin w tyg.</p>
            </div>

            <div className="card" style={{ gridColumn: 'span 4', textAlign: 'center' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '32px', marginBottom: '8px' }}>psychology</span>
              <p style={{ fontSize: '2rem', fontWeight: 900 }}>24</p>
              <p className="label-text">Deep Sessions</p>
            </div>
          </div>
        </div>

        {/* Forest Background Blur Fallback */}
        <div style={{ position: 'fixed', bottom: 0, left: 0, width: '100%', height: '20vh', background: 'linear-gradient(to top, var(--surface-container-low), transparent)', pointerEvents: 'none', zIndex: -1 }}></div>
      </main>

      <nav className="mobile-nav">
        <button className="btn-text" style={{ color: 'var(--primary)' }}>
          <span className="material-symbols-outlined">timer</span>
        </button>
        <button className="btn-text">
          <span className="material-symbols-outlined">person</span>
        </button>
        <button className="btn-text">
          <span className="material-symbols-outlined">shopping_bag</span>
        </button>
      </nav>
    </div>
  );
}
