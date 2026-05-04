import React, { useState, useEffect } from 'react';

export default function ShopTab({ session, profile, onUpdateProfile }) {
  const [isOpening, setIsOpening] = useState(false);
  const [reward, setReward] = useState(null);
  const [errorStatus, setErrorStatus] = useState('');
  
  // CS:GO Roulette State
  const [rouletteItems, setRouletteItems] = useState([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [stopOffset, setStopOffset] = useState(0);

  const FILLER_EMOJIS = ["🌿", "💧", "🔥", "⭐", "🌸", "🍄", "🌙", "🎵", "🎨", "🍀", "💎"];
  const FILLER_RARITIES = ["common", "common", "common", "rare", "rare", "legendary"];
  const ITEM_WIDTH = 100;
  const ITEM_GAP = 16;
  const WINNING_INDEX = 40; // Stop at 40th item

  const openBox = async (boxType, cost) => {
    if (profile?.coins < cost) {
      setErrorStatus('Nie masz wystarczającej ilości monet!');
      return;
    }
    
    setErrorStatus('');
    setIsOpening(true);
    setReward(null);
    setIsSpinning(false);

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
      
      // Generate roulette array
      const items = Array.from({ length: 50 }).map((_, i) => {
        if (i === WINNING_INDEX) return data.item;
        return {
          id: `filler-${i}`,
          icon: FILLER_EMOJIS[Math.floor(Math.random() * FILLER_EMOJIS.length)],
          rarity: FILLER_RARITIES[Math.floor(Math.random() * FILLER_RARITIES.length)]
        };
      });
      
      setRouletteItems(items);
      // Randomize stop offset between -40px and +40px for realism
      setStopOffset(Math.floor(Math.random() * 80) - 40);
      
      // Trigger animation next frame
      setTimeout(() => {
        setIsSpinning(true);
      }, 50);

      // Wait for 5 seconds of spinning + 1 second delay before showing reward screen
      setTimeout(() => {
        setReward(data.item);
        setIsOpening(false);
        setIsSpinning(false);
        onUpdateProfile();
      }, 6000);

    } catch (err) {
      setErrorStatus(err.message);
      setIsOpening(false);
    }
  };

  const getBorderColor = (rarity) => {
    if (rarity === 'legendary') return '#f59e0b'; // Gold
    if (rarity === 'rare') return '#3b82f6'; // Blue
    return '#94a3b8'; // Common gray
  };

  const totalItemWidth = ITEM_WIDTH + ITEM_GAP;
  const translationX = isSpinning ? -(WINNING_INDEX * totalItemWidth + (ITEM_WIDTH / 2) + stopOffset) : 0;

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
        <div className="card" style={{ padding: '0', backgroundColor: 'var(--surface)', marginBottom: '48px', overflow: 'hidden', position: 'relative', height: '240px', border: '1px solid var(--outline-variant)' }}>
           
           {/* Center winning line */}
           <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: '4px', backgroundColor: '#f59e0b', zIndex: 10, transform: 'translateX(-50%)', boxShadow: '0 0 15px #f59e0b, 0 0 5px #f59e0b', borderRadius: '2px' }}></div>
           
           {/* Fade edges */}
           <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '100px', background: 'linear-gradient(to right, var(--surface), transparent)', zIndex: 5 }}></div>
           <div style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: '100px', background: 'linear-gradient(to left, var(--surface), transparent)', zIndex: 5 }}></div>

           {/* Roulette Track Wrapper (starts exactly at 50% width) */}
           <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, display: 'flex', alignItems: 'center' }}>
             
             {/* The moving track */}
             <div style={{ 
                 display: 'flex', 
                 gap: `${ITEM_GAP}px`,
                 transform: `translateX(${translationX}px)`,
                 transition: isSpinning ? 'transform 5s cubic-bezier(0.1, 0.8, 0.1, 1)' : 'none'
              }}>
                {rouletteItems.map((item, idx) => (
                  <div key={idx} style={{ 
                    width: `${ITEM_WIDTH}px`, height: '140px', 
                    backgroundColor: 'var(--surface-container-high)', 
                    borderRadius: '16px', 
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
                    borderBottom: `6px solid ${getBorderColor(item.rarity)}`,
                    boxShadow: '0 10px 20px rgba(0,0,0,0.2)'
                  }}>
                    <span style={{ fontSize: '48px', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' }}>{item.icon}</span>
                  </div>
                ))}
             </div>
           </div>
           
           <h3 style={{ position: 'absolute', bottom: '16px', width: '100%', textAlign: 'center', color: 'var(--on-surface-variant)', letterSpacing: '2px', textTransform: 'uppercase', fontSize: '0.75rem' }}>
             Otwieranie skrzyni...
           </h3>
        </div>
      )}

      {reward && !isOpening && (
        <div className="card reveal-card" style={{ textAlign: 'center', padding: '64px', background: 'var(--surface-container-highest)', color: 'var(--on-surface)', marginBottom: '48px', border: `2px solid ${getBorderColor(reward.rarity)}`, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: reward.rarity === 'legendary' ? 'linear-gradient(45deg, gold, transparent, gold)' : 'none', opacity: 0.1, pointerEvents: 'none' }}></div>
          
          <p className="label-text" style={{ color: getBorderColor(reward.rarity), marginBottom: '8px' }}>Pomyślny Łup</p>
          <div className="reward-reveal" style={{ fontSize: '100px', margin: '32px 0' }}>
            <span style={{ display: 'inline-block', filter: `drop-shadow(0 0 40px ${getBorderColor(reward.rarity)})` }}>{reward.icon || '✨'}</span>
          </div>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '8px' }}>{reward.name}</h2>
          <p className="label-text" style={{ fontSize: '1rem', color: getBorderColor(reward.rarity), marginBottom: '24px' }}>{reward.rarity.toUpperCase()}</p>
          
          <p className="body-secondary" style={{ marginBottom: '32px' }}>
            {reward.is_duplicate ? 'To duplikat! Część Twoich monet (50%) została zwrócona.' : 'Przedmiot został dodany do Twojego Skarbca Wyposażenia.'}
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

