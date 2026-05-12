import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export default function LeaderboardTab({ session }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState('');
  const [category, setCategory] = useState('level'); // level, sessions, coins

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      setErrorStatus('');
      try {
        let orderByField = 'level';
        if (category === 'sessions') orderByField = 'total_sessions';
        if (category === 'coins') orderByField = 'coins';

        const { data, error } = await supabase
          .from('profiles')
          .select('id, email, level, total_sessions, coins, current_streak')
          .order(orderByField, { ascending: false })
          .limit(50);

        if (error) throw error;
        setLeaderboard(data || []);
      } catch (err) {
        setErrorStatus('Nie udało się pobrać rankingu z bazy.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchLeaderboard();
  }, [category]);

  const renderValue = (user) => {
    if (category === 'level') return `Lvl ${user.level}`;
    if (category === 'sessions') return `${user.total_sessions} sesji`;
    if (category === 'coins') return `${user.coins} monet`;
    return '';
  };

  return (
    <div className="page-container">
      <section style={{ marginBottom: '32px' }}>
        <p className="label-text" style={{ color: 'var(--primary)', marginBottom: '8px' }}>Hall of Fame</p>
        <h1 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '16px' }}>Ranking Globalny</h1>
        <p className="body-secondary" style={{ maxWidth: '600px' }}>
          Najbardziej zmotywowani dążą na sam szczyt. Oto najlepsi wojownicy skupienia.
        </p>
      </section>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', overflowX: 'auto', paddingBottom: '8px' }}>
        <button 
          className={category === 'level' ? 'btn-primary' : 'btn-secondary'} 
          onClick={() => setCategory('level')}
          style={{ flexShrink: 0 }}
        >
          🏆 Najwyższy Poziom
        </button>
        <button 
          className={category === 'sessions' ? 'btn-primary' : 'btn-secondary'} 
          onClick={() => setCategory('sessions')}
          style={{ flexShrink: 0 }}
        >
          ⏱️ Ilość Sesji
        </button>
        <button 
          className={category === 'coins' ? 'btn-primary' : 'btn-secondary'} 
          onClick={() => setCategory('coins')}
          style={{ flexShrink: 0 }}
        >
          🪙 Skarbiec (Monety)
        </button>
      </div>

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
          <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 120px', padding: '16px 24px', backgroundColor: 'var(--surface-container-high)', borderBottom: '1px solid var(--outline-variant)' }}>
            <span className="label-text">Miejsce</span>
            <span className="label-text">Bohater (Email / ID)</span>
            <span className="label-text" style={{ textAlign: 'right' }}>Wynik</span>
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
                    gridTemplateColumns: '60px 1fr 120px', 
                    padding: '16px 24px', 
                    borderBottom: '1px solid var(--surface-container-high)',
                    alignItems: 'center',
                    backgroundColor: index === 0 ? 'rgba(245, 158, 11, 0.1)' : index === 1 ? 'rgba(148, 163, 184, 0.1)' : index === 2 ? 'rgba(180, 83, 9, 0.1)' : 'var(--surface)',
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
                    <span>{user.email || (user.id.substring(0, 8) + '...')}</span>
                  </div>
                  <span style={{ textAlign: 'right', color: 'var(--primary)', fontWeight: 800 }}>{renderValue(user)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
