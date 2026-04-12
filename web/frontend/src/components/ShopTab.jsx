import React, { useState } from 'react';

export default function ShopTab({ session, profile, onUpdateProfile }) {
  const [isOpening, setIsOpening] = useState(false);
  const [reward, setReward] = useState(null);
  const [errorStatus, setErrorStatus] = useState('');

  const openBox = async (boxType, cost) => {
    if (profile?.coins < cost) {
      setErrorStatus('Nie masz wystarczającej ilości monet!');
      return;
    }
    
    setErrorStatus('');
    setIsOpening(true);
    setReward(null);

    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
    try {
      const response = await fetch(`${backendUrl}/api/shop/open-box`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ box_type: boxType, cost: cost })
      });
      
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Błąd podczas płatności');
      }
      
      const data = await response.json();
      
      // Artificial delay for an animation feel
      setTimeout(() => {
        setReward(data.item);
        setIsOpening(false);
        onUpdateProfile(); // refresh coins etc
      }, 1500);

    } catch (err) {
      setErrorStatus(err.message);
      setIsOpening(false);
    }
  };

  return (
    <div className="page-container">
      <section style={{ marginBottom: '48px' }}>
        <p className="label-text" style={{ color: 'var(--primary)', marginBottom: '8px' }}>Sklep i Ekwipunek</p>
        <h1 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '16px' }}> Focus Shop</h1>
        <p className="body-secondary" style={{ maxWidth: '600px' }}>
          Wymień swoje zdobyte w skupieniu monety na rzadkie przedmioty, tła i relaksujące dźwięki.
        </p>
      </section>

      {errorStatus && (
        <div style={{ padding: '16px', backgroundColor: 'var(--error)', color: 'white', borderRadius: '12px', marginBottom: '24px' }}>
          {errorStatus}
        </div>
      )}

      {isOpening && (
        <div className="card" style={{ textAlign: 'center', padding: '64px', backgroundColor: 'var(--surface-container-high)', marginBottom: '48px' }}>
           <span className="material-symbols-outlined" style={{ fontSize: '64px', color: 'var(--primary)', animation: 'spin 2s linear infinite' }}>sync</span>
           <h2 style={{ marginTop: '16px' }}>Otwieranie skrzynki...</h2>
           <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {reward && !isOpening && (
        <div className="card" style={{ textAlign: 'center', padding: '48px', backgroundImage: 'var(--primary-gradient)', color: 'white', marginBottom: '48px' }}>
          <p className="label-text" style={{ color: 'rgba(255,255,255,0.8)' }}>Zdobyto Pudełko!</p>
          <span className="material-symbols-outlined" style={{ fontSize: '80px', margin: '24px 0', fontVariationSettings: "'FILL' 1" }}>
            {reward.icon || 'star'}
          </span>
          <h2 style={{ fontSize: '2rem', marginBottom: '8px' }}>{reward.name}</h2>
          <p>{reward.is_duplicate ? 'Duplikat! Otrzymujesz zwrot 50% monet.' : 'Teraz możesz tego użyć w profilu!'}</p>
          <button className="btn-secondary" style={{ marginTop: '24px' }} onClick={() => setReward(null)}>Super!</button>
        </div>
      )}

      {!isOpening && !reward && (
        <div className="bento-grid">
          <div className="card" style={{ gridColumn: 'span 4', textAlign: 'center' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#f59e0b', marginBottom: '16px', fontVariationSettings: "'FILL' 1" }}>inventory_2</span>
            <h3>Drewniana Skrzynka</h3>
            <p className="body-secondary" style={{ margin: '8px 0 24px 0', fontSize: '0.875rem' }}>Szansa na pospolite tła i kolory.</p>
            <button className="btn-primary" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }} onClick={() => openBox('wood', 500)}>
              <span>500</span>
              <span className="material-symbols-outlined" style={{ fontSize: '20px', fontVariationSettings: "'FILL' 1" }}>toll</span>
            </button>
          </div>

          <div className="card" style={{ gridColumn: 'span 4', textAlign: 'center', border: '1px solid var(--primary-container)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--primary)', marginBottom: '16px', fontVariationSettings: "'FILL' 1" }}>redeem</span>
            <h3>Skrzynia Natury</h3>
            <p className="body-secondary" style={{ margin: '8px 0 24px 0', fontSize: '0.875rem' }}>Ekskluzywne rzadkie motywy i odgłosy lasu.</p>
            <button className="btn-primary" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }} onClick={() => openBox('nature', 1500)}>
              <span>1500</span>
              <span className="material-symbols-outlined" style={{ fontSize: '20px', fontVariationSettings: "'FILL' 1" }}>toll</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
