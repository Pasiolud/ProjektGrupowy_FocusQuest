import React, { useState, useEffect } from 'react';

export default function LeaderboardTab({ session }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState('');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
      try {
        const response = await fetch(`${backendUrl}/api/leaderboard`, {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });
        
        if (!response.ok) {
          throw new Error('Nie udało się pobrać rankingu.');
        }
        
        const data = await response.json();
        setLeaderboard(data.leaderboard || []);
      } catch (err) {
        setErrorStatus(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLeaderboard();
  }, [session.access_token]);

  return (
    <div className="page-container">
      <section style={{ marginBottom: '48px' }}>
        <p className="label-text" style={{ color: 'var(--primary)', marginBottom: '8px' }}>Hall of Fame</p>
        <h1 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '16px' }}>Ranking Globalny</h1>
        <p className="body-secondary" style={{ maxWidth: '600px' }}>
          Najbardziej zmotywowani dążą na sam szczyt. Oto najlepsi wojownicy skupienia.
        </p>
      </section>

      {errorStatus && (
        <div style={{ padding: '16px', backgroundColor: 'var(--error)', color: 'white', borderRadius: '12px', marginBottom: '24px' }}>
          {errorStatus}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--primary)' }}>
           Ładowanie tabeli wyników...
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 100px 100px', padding: '16px 24px', backgroundColor: 'var(--surface-container-high)', borderBottom: '1px solid var(--outline-variant)' }}>
            <span className="label-text">Miejsce</span>
            <span className="label-text">Bohater</span>
            <span className="label-text" style={{ textAlign: 'center' }}>Poziom</span>
            <span className="label-text" style={{ textAlign: 'right' }}>Top Streak</span>
          </div>
          
          {/* List */}
          <div>
            {leaderboard.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--on-surface-variant)' }}>
                Brak wojowników na liście.
              </div>
            ) : (
              leaderboard.map((user, index) => (
                <div 
                  key={user.id} 
                  style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '60px 1fr 100px 100px', 
                    padding: '16px 24px', 
                    borderBottom: '1px solid var(--surface-container-high)',
                    alignItems: 'center',
                    backgroundColor: index < 3 ? 'var(--surface-container-lowest)' : 'var(--surface)',
                    fontWeight: index < 3 ? 700 : 400
                  }}
                >
                  <span style={{ fontSize: '1.25rem', color: index === 0 ? '#f59e0b' : index === 1 ? '#94a3b8' : index === 2 ? '#b45309' : 'inherit' }}>
                    #{index + 1}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '99px', backgroundColor: 'var(--surface-container)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--primary)' }}>account_circle</span>
                    </div>
                    <span>{user.id.substring(0, 8)}...</span>
                  </div>
                  <span style={{ textAlign: 'center', color: 'var(--primary)', fontWeight: 800 }}>Lvl {user.level}</span>
                  <span style={{ textAlign: 'right', color: 'var(--secondary)' }}>{user.current_streak} dni</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
