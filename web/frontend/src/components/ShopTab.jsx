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
        <div className="card" style={{ textAlign: 'center', padding: '100px 64px', backgroundColor: 'var(--surface-container-high)', marginBottom: '48px', overflow: 'hidden', position: 'relative' }}>
           <div className="box-glowing-light"></div>
           <span className="material-symbols-outlined box-shake" style={{ fontSize: '120px', color: 'var(--primary)', position: 'relative', z_index: 2, fontVariationSettings: "'FILL' 1" }}>inventory_2</span>
           <h2 style={{ marginTop: '24px', letterSpacing: '2px', textTransform: 'uppercase', fontSize: '1rem' }}>Magia w drodze...</h2>
           
           <style>{`
             .box-shake {
               display: inline-block;
               animation: shakeBox 0.5s ease-in-out infinite;
             }
             .box-glowing-light {
               position: absolute;
               top: 50%;
               left: 50%;
               transform: translate(-50%, -50%);
               width: 300px;
               height: 300px;
               background: radial-gradient(circle, var(--primary) 0%, transparent 70%);
               opacity: 0.3;
               animation: pulseLight 1s ease-in-out infinite alternate;
             }
             @keyframes shakeBox {
               0% { transform: rotate(0deg) scale(1.1); }
               25% { transform: rotate(5deg) scale(1.1); }
               50% { transform: rotate(0deg) scale(1.1); }
               75% { transform: rotate(-5deg) scale(1.1); }
               100% { transform: rotate(0deg) scale(1.1); }
             }
             @keyframes pulseLight {
               from { opacity: 0.2; transform: translate(-50%, -50%) scale(0.8); }
               to { opacity: 0.5; transform: translate(-50%, -50%) scale(1.2); }
             }
           `}</style>
        </div>
      )}

      {reward && !isOpening && (
        <div className="card reveal-card" style={{ textAlign: 'center', padding: '64px', background: 'var(--surface-container-highest)', color: 'var(--on-surface)', marginBottom: '48px', border: '2px solid var(--primary)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: reward.rarity === 'legendary' ? 'linear-gradient(45deg, gold, transparent, gold)' : 'none', opacity: 0.1, pointerEvents: 'none' }}></div>
          
          <p className="label-text" style={{ color: 'var(--primary)', marginBottom: '8px' }}>Pomyślny Łup</p>
          <div className="reward-reveal" style={{ fontSize: '100px', margin: '32px 0' }}>
            <span style={{ display: 'inline-block', filter: 'drop-shadow(0 0 20px var(--primary))' }}>{reward.icon || '✨'}</span>
          </div>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '8px' }}>{reward.name}</h2>
          <p className="label-text" style={{ fontSize: '1rem', color: 'var(--primary)', marginBottom: '24px' }}>{reward.rarity.toUpperCase()}</p>
          
          <p className="body-secondary" style={{ marginBottom: '32px' }}>
            {reward.is_duplicate ? 'To duplikat! Twoje szeleściaki (50%) zostały zwrócone.' : 'Przedmiot został dodany do Twojego Skarbca Wyposażenia.'}
          </p>
          
          <button className="btn-primary" onClick={() => setReward(null)}>Odbierz Nagrodę</button>

          <style>{`
            .reward-reveal {
              animation: revealItem 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            }
            .reveal-card {
               animation: fadeIn 0.5s ease-out;
            }
            @keyframes revealItem {
              0% { transform: scale(0) rotate(-45deg); opacity: 0; }
              100% { transform: scale(1) rotate(0deg); opacity: 1; }
            }
            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(20px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>
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
