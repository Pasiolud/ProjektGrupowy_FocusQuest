import React, { useState, useEffect } from 'react';

export default function InventoryTab({ session, profile, onUpdateProfile }) {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState('');

  const fetchInventory = async () => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
    try {
      const response = await fetch(`${backendUrl}/api/inventory`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setInventory(data.inventory);
      } else {
        throw new Error('Nie udało się załadować ekwipunku.');
      }
    } catch (err) {
      setErrorStatus(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [session.access_token]);

  const equipItem = async (item) => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
    try {
      const response = await fetch(`${backendUrl}/api/inventory/equip`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          item_id: item.id,
          category: item.category,
          css_value: item.css_value
        })
      });
      
      if (!response.ok) throw new Error('Błąd podczas zakładania przedmiotu');
      
      onUpdateProfile(); // re-fetches profile to update app-wide theme
    } catch (err) {
      setErrorStatus(err.message);
    }
  };

  let equippedThemes = {};
  if (profile?.equipped_theme) {
    try {
      equippedThemes = JSON.parse(profile.equipped_theme);
    } catch (e) {
      console.error('Invalid equipped_theme format:', e);
    }
  }

  // Group inventory by category
  const categories = {
    'timer_color': 'Kolory Timera',
    'profile_bg': 'Tła Profilu',
    'avatar_skin': 'Wojownicy (Awatary)'
  };
  
  const groupedInventory = inventory.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <div className="page-container">
      <section style={{ marginBottom: '48px' }}>
        <p className="label-text" style={{ color: 'var(--primary)', marginBottom: '8px' }}>Twój ekwipunek</p>
        <h1 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '16px' }}>Skarbiec Wyposażenia</h1>
        <p className="body-secondary" style={{ maxWidth: '600px' }}>
          Modyfikuj wygląd swojego stanowiska pracy używając rzadkich znalezisk ze Sklepu.
        </p>
      </section>

      {errorStatus && (
        <div style={{ padding: '16px', backgroundColor: 'var(--error)', color: 'white', borderRadius: '12px', marginBottom: '24px' }}>
          {errorStatus}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--primary)' }}>
           Ładowanie skarbca...
        </div>
      ) : inventory.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '64px', backgroundColor: 'var(--surface-container-high)', color: 'var(--on-surface-variant)' }}>
           <span className="material-symbols-outlined" style={{ fontSize: '48px', marginBottom: '16px' }}>inventory_2</span>
           <h3>Twój ekwipunek jest pusty</h3>
           <p className="body-secondary" style={{ marginTop: '8px' }}>Rozpocznij skupienie, by zdobyć monety i otworzyć paczki w Sklepie.</p>
        </div>
      ) : (
        Object.entries(categories).map(([catKey, catName]) => {
          const itemsCat = groupedInventory[catKey];
          if (!itemsCat) return null;
          
          return (
            <div key={catKey} style={{ marginBottom: '48px' }}>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '24px', paddingBottom: '12px', borderBottom: '1px solid var(--surface-container-highest)' }}>
                {catName}
              </h2>
              <div className="bento-grid">
                {itemsCat.map((item) => {
                  const isEquipped = equippedThemes[item.category] === item.css_value;
                  return (
                    <div className="card" key={item.id} style={{ gridColumn: 'span 4', textAlign: 'center', border: isEquipped ? '2px solid var(--primary)' : '1px solid transparent', backgroundColor: isEquipped ? 'var(--surface-container)' : 'var(--surface-container-low)' }}>
                      <span style={{ fontSize: '48px', marginBottom: '16px', display: 'inline-block' }}>{item.icon}</span>
                      <h3 style={{ fontSize: '1.1rem', marginBottom: '4px' }}>{item.name}</h3>
                      <p className="label-text" style={{ color: 'var(--primary)' }}>{item.rarity.toUpperCase()}</p>
                      
                      <button 
                        className={isEquipped ? 'btn-secondary' : 'btn-primary'} 
                        style={{ width: '100%', marginTop: '24px' }}
                        disabled={isEquipped}
                        onClick={() => equipItem(item)}
                      >
                        {isEquipped ? 'Założono' : 'Załóż'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
