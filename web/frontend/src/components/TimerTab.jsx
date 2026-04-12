import React, { useState, useEffect } from 'react';

export default function TimerTab({ session, onSessionComplete, timerTheme }) {
  const DEFAULT_TIME = 25 * 60; // 25 minutes in seconds
  const [timeLeft, setTimeLeft] = useState(DEFAULT_TIME);
  const [isActive, setIsActive] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [errorStatus, setErrorStatus] = useState('');

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
        body: JSON.stringify({ duration_seconds: DEFAULT_TIME }) // sending total expected time for simplicity right now
      });
      
      if (!response.ok) throw new Error('Błąd wysyłania wyniku sesji');
      
      const data = await response.json();
      onSessionComplete(data); // callback to parent to refresh profile
    } catch (err) {
      setErrorStatus(err.message);
    } finally {
      setIsFinishing(false);
      setTimeLeft(DEFAULT_TIME);
    }
  };

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(DEFAULT_TIME);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  
  // Progress for circle
  const progressPercent = ((DEFAULT_TIME - timeLeft) / DEFAULT_TIME) * 100;
  
  const timerGradientStyle = timerTheme ? { stopColor: timerTheme } : { stopColor: 'var(--primary)' };

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      
      {/* Circle Animation Container */}
      <div style={{ position: 'relative', width: '300px', height: '300px', marginBottom: '32px' }}>
        <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
          {/* Background Track */}
          <circle 
            cx="50" cy="50" r="45" 
            fill="none" 
            stroke="var(--surface-container-high)" 
            strokeWidth="4" 
          />
          {/* Progress Indicator */}
          <circle 
            cx="50" cy="50" r="45" 
            fill="none" 
            stroke={timerTheme ? timerTheme : "url(#progress-gradient)"}
            strokeWidth="4" 
            strokeDasharray="283" 
            strokeDashoffset={283 - (283 * progressPercent) / 100}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
          {!timerTheme && (
            <defs>
              <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--primary)" />
                <stop offset="100%" stopColor="var(--primary-container)" />
              </linearGradient>
            </defs>
          )}
        </svg>

        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--primary)', marginBottom: '8px' }}>
            {isActive ? 'eco' : 'potted_plant'}
          </span>
          <div className="logo-font" style={{ fontSize: '3rem', color: 'var(--on-surface)', lineHeight: 1 }}>
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px' }}>
        <button 
          className="btn-primary" 
          style={{ width: '160px', padding: '16px 0', fontSize: '1.25rem' }}
          onClick={toggleTimer}
          disabled={isFinishing}
        >
          {isActive ? 'Pauza' : (timeLeft < DEFAULT_TIME ? 'Wznów' : 'Skup się')}
        </button>
        
        {(!isActive && timeLeft < DEFAULT_TIME) && (
          <button 
            className="btn-secondary" 
            onClick={resetTimer}
          >
            Anuluj
          </button>
        )}
      </div>

      {errorStatus && (
        <p className="error-msg" style={{ marginTop: '24px', color: 'var(--error)' }}>{errorStatus}</p>
      )}
      {isFinishing && (
        <p style={{ marginTop: '24px', color: 'var(--primary)', fontWeight: 'bold' }}>Zapisywanie postępów...</p>
      )}
    </div>
  );
}
