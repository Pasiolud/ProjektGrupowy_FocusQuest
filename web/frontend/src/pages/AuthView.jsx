import React, { useState } from 'react';
import { supabase } from '../supabase';

export default function AuthView() {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      if (isLoginMode) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.user?.identities?.length === 0) setErrorMsg('Ten email jest już zajęty.');
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', width: '100%', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--surface-container-low)' }}>
      <div className="card" style={{ maxWidth: '420px', width: '90%', backgroundColor: 'var(--surface-container-lowest)' }}>
        <header style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '8px', color: 'var(--primary)' }}>FocusQuest</h1>
          <p className="body-secondary">
            {isLoginMode ? 'Zaloguj się do swojego zadania' : 'Rozpocznij swoją przygodę'}
          </p>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="label-text" style={{ marginBottom: '8px', display: 'block' }}>E-mail</label>
            <input 
              type="email" 
              className="input-field" 
              placeholder="twój@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label className="label-text" style={{ marginBottom: '8px', display: 'block' }}>Hasło</label>
            <input 
              type="password" 
              className="input-field" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {!isLoginMode && (
            <div className="input-group">
              <label className="label-text" style={{ marginBottom: '8px', display: 'block' }}>Potwierdź hasło</label>
              <input 
                type="password" 
                className="input-field" 
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          )}

          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '16px' }} disabled={loading}>
            {loading ? 'Przetwarzanie...' : (isLoginMode ? 'Wstąp do gry' : 'Załóż konto')}
          </button>
          {errorMsg && <p className="error-msg" style={{ marginTop: '16px', textAlign: 'center' }}>{errorMsg}</p>}
        </form>

        <div style={{ marginTop: '32px', textAlign: 'center' }}>
          <span className="body-secondary" style={{ fontSize: '0.875rem' }}>
            {isLoginMode ? 'Nie masz konta? ' : 'Masz już konto? '}
          </span>
          <button 
            type="button" 
            className="btn-text" 
            style={{ backgroundColor: 'transparent', border: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
            onClick={() => setIsLoginMode(!isLoginMode)}
          >
            {isLoginMode ? 'Zarejestruj się' : 'Zaloguj się'}
          </button>
        </div>
      </div>
    </div>
  );
}
