import React from 'react';

export default function ProfileTab({ profile }) {
  return (
    <div className="page-container">
      <section style={{ marginBottom: '48px' }}>
        <p className="label-text" style={{ color: 'var(--primary)', marginBottom: '8px' }}>Current Standing</p>
        <h1 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '16px' }}>Hero Level {profile?.level || 1}</h1>
        <p className="body-secondary" style={{ maxWidth: '600px' }}>
          Twoja ścieżka do mistrzostwa koncentracji. Każda sesja przybliża Cię do kolejnego poziomu wtajemniczenia.
        </p>
      </section>

      <div className="bento-grid">
        <div className="card" style={{ gridColumn: 'span 8', backgroundColor: 'var(--surface-container-low)' }}>
          {(() => {
             const lvl = profile?.level || 1;
             const totalXp = profile?.total_xp || 0;
             
             // Calculate XP needed for NEXT level jump
             const xpNeededForNext = 1000 * (lvl**1.5);
             
             // Calculate how much XP was needed for all PREVIOUS levels
             let previousXpSum = 0;
             for(let i=1; i<lvl; i++) {
               previousXpSum += 1000 * (i**1.5);
             }
             
             const progressXp = totalXp - previousXpSum;
             const progressPercent = Math.min(100, (progressXp / xpNeededForNext) * 100);

             return (
               <>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '16px' }}>
                   <h3 className="label-text">Progress to Level {lvl + 1}</h3>
                   <p style={{ fontWeight: 800 }}>{Math.floor(progressXp)} <span className="label-text">/ {Math.floor(xpNeededForNext)} XP</span></p>
                 </div>
                 <div style={{ height: '8px', backgroundColor: 'var(--surface-container-highest)', borderRadius: '99px', overflow: 'hidden' }}>
                   <div style={{ width: `${progressPercent}%`, height: '100%', background: 'var(--primary-gradient)', borderRadius: '99px', transition: 'width 0.5s ease' }}></div>
                 </div>
               </>
             );
          })()}
        </div>

        <div className="card" style={{ gridColumn: 'span 4', background: 'var(--primary-gradient)', color: 'white' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '32px', marginBottom: '16px', fontVariationSettings: "'FILL' 1" }}>account_balance_wallet</span>
          <h3 className="label-text" style={{ color: 'rgba(255,255,255,0.7)' }}>Focus Treasury</h3>
          <p style={{ fontSize: '2.5rem', fontWeight: 900 }}>{profile?.coins || 0}</p>
        </div>

        <div className="card" style={{ gridColumn: 'span 3', textAlign: 'center' }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '32px', marginBottom: '8px' }}>today</span>
          <p style={{ fontSize: '2rem', fontWeight: 900 }}>{Math.floor((profile?.daily_focus_seconds || 0) / 60)}</p>
          <p className="label-text">Minuty dzisiaj</p>
        </div>

        <div className="card" style={{ gridColumn: 'span 3', textAlign: 'center' }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '32px', marginBottom: '8px' }}>local_fire_department</span>
          <p style={{ fontSize: '2rem', fontWeight: 900 }}>{profile?.current_streak || 0}</p>
          <p className="label-text">Dni Streaka</p>
        </div>

        <div className="card" style={{ gridColumn: 'span 3', textAlign: 'center' }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '32px', marginBottom: '8px' }}>schedule</span>
          <p style={{ fontSize: '2rem', fontWeight: 900 }}>{((profile?.weekly_focus_seconds || 0) / 3600).toFixed(1)}</p>
          <p className="label-text">Godzin w tyg.</p>
        </div>

        <div className="card" style={{ gridColumn: 'span 3', textAlign: 'center' }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '32px', marginBottom: '8px' }}>psychology</span>
          <p style={{ fontSize: '2rem', fontWeight: 900 }}>{profile?.total_sessions || 0}</p>
          <p className="label-text">Deep Sessions</p>
        </div>
      </div>
    </div>
  );
}
