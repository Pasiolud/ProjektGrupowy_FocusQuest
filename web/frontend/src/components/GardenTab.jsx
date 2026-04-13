import React, { useState } from 'react';

export default function GardenTab({ session, profile, onUpdateProfile }) {
  const [errorStatus, setErrorStatus] = useState('');
  const [activeTab, setActiveTab] = useState('active'); // active | seeds

  const safeParse = (val) => {
    if (!val) return [];
    if (typeof val === 'string') {
      try { return JSON.parse(val); } catch (e) { return []; }
    }
    return val;
  };

  const gardenSlots = safeParse(profile?.garden_slots);
  const seeds = safeParse(profile?.seed_inventory);

  const plantSeed = async (index) => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
    try {
      const response = await fetch(`${backendUrl}/api/garden/plant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ seed_index: index })
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Błąd sadzenia');
      }
      onUpdateProfile();
      setActiveTab('active');
    } catch (err) {
      setErrorStatus(err.message);
    }
  };

  const sellPlant = async (plantId) => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
    try {
      const response = await fetch(`${backendUrl}/api/garden/sell`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ plant_id: plantId })
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Błąd sprzedaży');
      }
      onUpdateProfile();
    } catch (err) {
      setErrorStatus(err.message);
    }
  };

  const getPlantImage = (plant) => {
    const progress = (plant.progress / plant.target) * 100;
    let stage = 1;
    if (progress >= 100) stage = 3;
    else if (progress >= 33) stage = 2;
    
    return `/assets/garden/${plant.type}_${stage}.png`;
  };

  return (
    <div className="page-container">
      <section style={{ marginBottom: '48px' }}>
        <p className="label-text" style={{ color: 'var(--primary)', marginBottom: '8px' }}>Twój Ogród Spokoju</p>
        <h1 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '16px' }}>Zen Garden</h1>
        <p className="body-secondary" style={{ maxWidth: '600px' }}>
          Każda chwila skupienia odżywia Twoje rośliny. Wyhoduj nasiona zdobyte podczas sesji i sprzedaj je za monety.
        </p>
      </section>

      {errorStatus && (
        <div style={{ padding: '16px', backgroundColor: 'var(--error)', color: 'white', borderRadius: '12px', marginBottom: '24px' }}>
          {errorStatus}
        </div>
      )}

      <div style={{ display: 'flex', gap: '24px', marginBottom: '32px' }}>
        <button onClick={() => setActiveTab('active')} style={{ 
          background: 'none', border: 'none', paddingBottom: '8px', 
          borderBottom: activeTab === 'active' ? '2px solid var(--primary)' : 'none',
          color: activeTab === 'active' ? 'var(--primary)' : 'var(--on-surface-variant)',
          fontWeight: activeTab === 'active' ? 700 : 400, cursor: 'pointer'
        }}>
          Aktualne Rośliny ({gardenSlots.length}/3)
        </button>
        <button onClick={() => setActiveTab('seeds')} style={{ 
          background: 'none', border: 'none', paddingBottom: '8px', 
          borderBottom: activeTab === 'seeds' ? '2px solid var(--primary)' : 'none',
          color: activeTab === 'seeds' ? 'var(--primary)' : 'var(--on-surface-variant)',
          fontWeight: activeTab === 'seeds' ? 700 : 400, cursor: 'pointer'
        }}>
          Twoje Nasiona ({seeds.length})
        </button>
      </div>

      {activeTab === 'active' && (
        <div className="bento-grid">
          {gardenSlots.length === 0 && (
            <div className="card" style={{ gridColumn: 'span 12', textAlign: 'center', padding: '64px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--surface-container-highest)', marginBottom: '16px' }}>potted_plant</span>
              <p className="body-secondary">Twój ogród jest pusty. Zasadź coś ze swojej kolekcji nasion!</p>
              <button className="btn-secondary" style={{ marginTop: '24px' }} onClick={() => setActiveTab('seeds')}>Przejdź do nasion</button>
            </div>
          )}
          {gardenSlots.map((plant) => {
            const progress = Math.min(100, (plant.progress / plant.target) * 100);
            const isReady = progress >= 100;
            return (
              <div key={plant.id} className="card" style={{ gridColumn: 'span 4', textAlign: 'center', position: 'relative' }}>
                <div style={{ height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                   <img src={getPlantImage(plant)} alt={plant.name} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                </div>
                <h3 style={{ marginBottom: '4px' }}>{plant.name}</h3>
                <p className="label-text" style={{ color: 'var(--primary)', marginBottom: '16px' }}>{plant.rarity.toUpperCase()}</p>
                
                <div style={{ height: '6px', backgroundColor: 'var(--surface-container-highest)', borderRadius: '99px', overflow: 'hidden', marginBottom: '8px' }}>
                  <div style={{ width: `${progress}%`, height: '100%', background: 'var(--primary-gradient)', borderRadius: '99px' }}></div>
                </div>
                <p className="label-text" style={{ fontSize: '0.6rem', marginBottom: '24px' }}>
                  {isReady ? 'DOJRZAŁA' : `ROŚNIE... (${progress.toFixed(0)}%)`}
                </p>

                {isReady ? (
                  <button className="btn-primary" style={{ width: '100%', backgroundColor: '#f59e0b' }} onClick={() => sellPlant(plant.id)}>
                    Sprzedaj za {plant.value} <span className="material-symbols-outlined" style={{ fontSize: '16px', verticalAlign: 'middle' }}>toll</span>
                  </button>
                ) : (
                  <button className="btn-secondary" style={{ width: '100%' }} disabled>Wymaga więcej skupienia</button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'seeds' && (
        <div className="bento-grid">
          {seeds.length === 0 && (
            <div className="card" style={{ gridColumn: 'span 12', textAlign: 'center', padding: '64px' }}>
              <p className="body-secondary">Nie masz jeszcze żadnych nasion. Ukończ sesję skupienia, aby je zdobyć!</p>
            </div>
          )}
          {seeds.map((seed, idx) => (
            <div key={idx} className="card" style={{ gridColumn: 'span 4', textAlign: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--primary-container)', marginBottom: '16px' }}>eco</span>
              <h3>{seed.name}</h3>
              <p className="label-text" style={{ marginBottom: '16px' }}>{seed.rarity.toUpperCase()}</p>
              <div style={{ textAlign: 'left', marginBottom: '24px', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span className="body-secondary">Wymaga:</span>
                  <span style={{ fontWeight: 600 }}>{seed.target / 3600}h</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="body-secondary">Wartość:</span>
                  <span style={{ fontWeight: 600, color: '#f59e0b' }}>{seed.value} monety</span>
                </div>
              </div>
              <button className="btn-primary" style={{ width: '100%' }} onClick={() => plantSeed(idx)} disabled={gardenSlots.length >= 3}>
                {gardenSlots.length >= 3 ? 'Brak miejsca' : 'Zasadź teraz'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
