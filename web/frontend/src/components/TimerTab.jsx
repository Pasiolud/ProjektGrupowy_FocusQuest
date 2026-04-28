import React, { useState, useEffect } from 'react';

export default function TimerTab({ session, profile, onSessionComplete, timerTheme }) {
  const [isTestMode, setIsTestMode] = useState(false);
  const DEFAULT_TIME = isTestMode ? 60 : 25 * 60; // 1 min (Test) or 25 min (Prod)
  const [timeLeft, setTimeLeft] = useState(DEFAULT_TIME);
  const [isActive, setIsActive] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [errorStatus, setErrorStatus] = useState('');
  const [sessionResult, setSessionResult] = useState(null);

  // Update time left immediately when test mode is toggled if not active
  useEffect(() => {
    if (!isActive) {
      setTimeLeft(DEFAULT_TIME);
    }
  }, [isTestMode, isActive, DEFAULT_TIME]);

  useEffect(() => {
    let interval = null;
    
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0 && !isFinishing) {
      clearInterval(interval);
      handleSessionComplete();
    }
    
    return () => clearInterval(interval);
  }, [isActive, timeLeft, isFinishing]);

  const handleSessionComplete = async () => {
    setIsFinishing(true);
    setIsActive(false);
    
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
    try {
      const response = await fetch(`${backendUrl}/api/session/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ duration_seconds: DEFAULT_TIME })
      });
      
      if (!response.ok) throw new Error('Błąd wysyłania wyniku sesji');
      
      const data = await response.json();
      setSessionResult(data);
      onSessionComplete(data);
    } catch (err) {
      setErrorStatus(err.message);
    } finally {
      setIsFinishing(false);
      setTimeLeft(DEFAULT_TIME);
    }
  };

  const closeResult = () => {
    setSessionResult(null);
  };

  const minutes = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const seconds = String(timeLeft % 60).padStart(2, '0');
  
  const progressPercent = ((DEFAULT_TIME - timeLeft) / DEFAULT_TIME) * 100;
  const circleClass = timerTheme || '';

  const isLevelUp = sessionResult && profile && sessionResult.new_level > profile.level;

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', position: 'relative' }}>
      
      {/* Circle Animation Container */}
      <div style={{ position: 'relative', width: '300px', height: '300px', marginBottom: '48px' }}>
        <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%', overflow: 'visible' }}>
          <circle 
            cx="50" cy="50" r="45" 
            fill="none" 
            stroke="var(--surface-container-high)" 
            strokeWidth="3" 
            opacity="0.5"
          />
          <circle 
            className={circleClass}
            cx="50" cy="50" r="45" 
            fill="none" 
            stroke="url(#progress-gradient)"
            strokeWidth="8" 
            strokeDasharray="283" 
            strokeDashoffset={283 - (283 * progressPercent) / 100}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s linear', opacity: 0.2, filter: 'blur(8px)' }}
          />
          <circle 
            className={circleClass}
            cx="50" cy="50" r="45" 
            fill="none" 
            stroke="url(#progress-gradient)"
            strokeWidth="4" 
            strokeDasharray="283" 
            strokeDashoffset={283 - (283 * progressPercent) / 100}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
          <defs>
            <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--primary)" />
              <stop offset="100%" stopColor="var(--primary-container)" />
            </linearGradient>
          </defs>
        </svg>

        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ 
            width: '180px', 
            height: '180px', 
            borderRadius: '999px', 
            backgroundColor: 'rgba(255,255,255,0.05)', 
            backdropFilter: 'blur(10px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '32px', color: 'var(--primary)', marginBottom: '4px', opacity: 0.8 }}>
              {isActive ? 'auto_awesome' : 'hourglass_empty'}
            </span>
            <div className="logo-font" style={{ fontSize: '3.5rem', color: 'var(--on-surface)', lineHeight: 1, fontWeight: 900, letterSpacing: '-2px' }}>
              {minutes}:{seconds}
            </div>
            <p className="label-text" style={{ fontSize: '0.6rem', marginTop: '4px', opacity: 0.6 }}>FOCUS MODE</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button 
            className="btn-primary" 
            style={{ width: '160px', padding: '16px 0', fontSize: '1.25rem' }}
            onClick={() => setIsActive(!isActive)}
            disabled={isFinishing}
          >
            {isActive ? 'Pauza' : (timeLeft < DEFAULT_TIME ? 'Wznów' : 'Skup się')}
          </button>
          {(!isActive && timeLeft < DEFAULT_TIME) && (
            <button className="btn-secondary" onClick={() => { setIsActive(false); setTimeLeft(DEFAULT_TIME); }}>Anuluj</button>
          )}
        </div>
        
        {/* Developer Test Switch */}
        {!isActive && timeLeft === DEFAULT_TIME && (
          <button 
            className="btn-text" 
            onClick={() => setIsTestMode(!isTestMode)}
            style={{ marginTop: '8px', opacity: 0.6, fontSize: '0.8rem' }}
          >
            [{isTestMode ? 'Test Mode: 1 MIN' : 'Real Mode: 25 MIN'}] Kliknij by zmienić
          </button>
        )}
      </div>

      {/* REWARD MODAL */}
      {sessionResult && (
        <div className="reward-overlay">
          <div className="reward-modal">
            {isLevelUp && <div className="level-up-banner">POZIOM WYŻEJ!</div>}
            
            <h2 style={{ fontSize: '2rem', marginBottom: '8px' }}>Sesja Ukończona!</h2>
            <p className="body-secondary" style={{ marginBottom: '32px' }}>Świetna robota, wojowniku. Oto Twoje łupy:</p>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginBottom: '40px' }}>
               <div className="reward-item">
                  <span className="material-symbols-outlined xp-icon">military_tech</span>
                  <p className="reward-value">+{sessionResult.earned.xp} XP</p>
               </div>
               <div className="reward-item">
                  <span className="material-symbols-outlined coin-icon">toll</span>
                  <p className="reward-value">+{sessionResult.earned.coins}</p>
               </div>
            </div>

            {sessionResult.reward_seed && (
              <div className="seed-reward">
                <p className="label-text" style={{ color: 'var(--primary)', marginBottom: '12px' }}>ZDOBYTO NASIONO</p>
                <div style={{ padding: '24px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '16px', border: '1px dashed var(--primary)' }}>
                   <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--primary)' }}>eco</span>
                   <h3 style={{ marginTop: '8px' }}>{sessionResult.reward_seed.name}</h3>
                   <p className="label-text">{sessionResult.reward_seed.rarity.toUpperCase()}</p>
                </div>
              </div>
            )}

            <button className="btn-primary" style={{ width: '100%', marginTop: '32px' }} onClick={closeResult}>Odbierz Nagrody</button>
          </div>

          <style>{`
            .reward-overlay {
              position: fixed;
              top: 0; left: 0; width: 100vw; height: 100vh;
              background: rgba(0,0,0,0.85);
              backdrop-filter: blur(8px);
              z-index: 1000;
              display: flex; align-items: center; justify-content: center;
              animation: fadeIn 0.3s ease-out;
            }
            .reward-modal {
              background: var(--surface-container-high);
              padding: 48px;
              border-radius: 32px;
              width: 90%; max-width: 480px;
              text-align: center;
              box-shadow: 0 20px 50px rgba(0,0,0,0.5);
              position: relative;
              animation: slideUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            }
            .level-up-banner {
              position: absolute;
              top: -20px; left: 50%;
              transform: translateX(-50%);
              background: var(--primary-gradient);
              padding: 8px 24px;
              border-radius: 99px;
              font-weight: 900;
              color: white;
              box-shadow: 0 10px 20px var(--primary-container);
              animation: scaleIn 0.5s 0.2s both, pulse 2s infinite;
            }
            .reward-item { animation: fadeIn 0.5s 0.3s both; }
            .xp-icon { font-size: 40px; color: #3b82f6; display: block; filter: drop-shadow(0 0 10px #3b82f6); }
            .coin-icon { font-size: 40px; color: #f59e0b; display: block; filter: drop-shadow(0 0 10px #f59e0b); }
            .reward-value { font-weight: 800; font-size: 1.25rem; margin-top: 8px; }
            .seed-reward { animation: fadeIn 0.5s 0.6s both; }
            
            @keyframes slideUp { from { transform: translateY(50px) scale(0.9); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }
            @keyframes scaleIn { from { transform: translateX(-50%) scale(0); } to { transform: translateX(-50%) scale(1); } }
            @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(var(--primary-rgb), 0.4); } 70% { box-shadow: 0 0 0 15px rgba(var(--primary-rgb), 0); } 100% { box-shadow: 0 0 0 0 rgba(var(--primary-rgb), 0); } }
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          `}</style>
        </div>
      )}

      {errorStatus && <p className="error-msg" style={{ marginTop: '24px', color: 'var(--error)' }}>{errorStatus}</p>}
      {isFinishing && <p style={{ marginTop: '24px', color: 'var(--primary)', fontWeight: 'bold' }}>Zapisywanie postępów...</p>}
    </div>
  );
}
