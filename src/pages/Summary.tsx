// src/pages/Summary.tsx
import React, { useEffect, useState } from 'react';
import Confetti from 'react-confetti';

const nextLevelAudio = new Audio('/audio/nextlevel.mp3');
nextLevelAudio.preload = 'auto';
const summaryAudio = new Audio('/audio/summary.mp3');
summaryAudio.preload = 'auto';
const leveldownAudio = new Audio('/audio/leveldown.mp3');
leveldownAudio.preload = 'auto';

interface SummaryProps {
  levelSaatIni: number;
  levelTujuan: number;
  akurasi: number;
  baseScore: number;
  streakBonus: number;
  speedBonus: number;
  scoreSesi: number;
  statusLevel: 'LEVEL UP' | 'MAINTAIN' | 'LEVEL DOWN';
  avgTime: number;
  currentStreak: number;
  bestStreak: number;
  totalXPSaatIni: number;
  isTamat?: boolean; 
  isMilestone?: boolean;      
  materiDikuasai?: string[];  
  onLanjut: () => void;
  onUlangi: () => void;
  onKembali: () => void;
  onBukaKamus: () => void; 
}

export default function Summary({ 
  levelSaatIni, levelTujuan, akurasi, baseScore, streakBonus, speedBonus, scoreSesi, statusLevel, avgTime, currentStreak, bestStreak, totalXPSaatIni, isTamat, isMilestone, materiDikuasai, onLanjut, onUlangi, onKembali, onBukaKamus 
}: SummaryProps) {
  
  const [activeBtn, setActiveBtn] = useState<'kembali' | 'kamus' | 'ulangi' | 'lanjut' | null>(null);
  
  const [showCheckpointView, setShowCheckpointView] = useState(false);
  const [zoomedCard, setZoomedCard] = useState<string | null>(null);

  const colors = {
    bgDark: '#3b3131',
    cardOuter: '#f2ece4',
    cardHeader: '#8a7979',
    cardBody: '#ffffff',
    cardBg: '#fff8f0', 
    textDark: '#4a3f3f',
    textMuted: '#9e9191',
    accentGold: '#f1c40f',
    accentGreen: '#2ecc71',
    accentRed: '#e74c3c',
    accentOrange: '#e67e22', 
    accentBlue: '#3498db',
    terakota: '#d98b8b'
  };

  useEffect(() => {
    if (!showCheckpointView) {
      const audio = statusLevel === 'LEVEL DOWN' ? leveldownAudio : summaryAudio;
      audio.currentTime = 0; 
      audio.volume = 0.6;
      audio.play().catch(err => console.log("Audio diblokir browser:", err));
    }
  }, [statusLevel, showCheckpointView]);

  const playClickSound = (callback: () => void) => {
    nextLevelAudio.currentTime = 0; 
    nextLevelAudio.volume = 0.8;
    nextLevelAudio.play().catch(e => console.log(e));
    setTimeout(() => { callback(); }, 150);
  };

  let pesanMotivasi = "";
  let teksTombolKanan = "";
  let tombolKananAktif = true;
  let statusIcon = '🎯';
  let badgeColor = colors.accentGold;

  if (isTamat) {
    pesanMotivasi = "LUAR BIASA! 🎉 Kamu telah menamatkan seluruh level SIBI Master. Kamu adalah seorang Master sejati!";
    teksTombolKanan = "SELESAI 🏆";
    statusIcon = '👑';
    badgeColor = colors.accentGold;
    tombolKananAktif = false; 
  } else if (statusLevel === 'LEVEL UP') {
    if (isMilestone) {
       pesanMotivasi = "Luar biasa! 🌟 Kamu menguasai gestur ini dengan sangat baik. Siap untuk tantangan baru?";
    } else {
       pesanMotivasi = "Luar biasa! 🌟 Kamu menguasai gestur ini dengan sangat baik. Siap untuk tantangan baru?";
    }
    teksTombolKanan = "LEVEL SELANJUTNYA 🔓";
    statusIcon = '🏆';
    badgeColor = colors.accentGreen;
  } else if (statusLevel === 'MAINTAIN') {
    pesanMotivasi = "Sedikit lagi! 💪 Yuk, asah terus ingatanmu sampai benar-benar hafal di luar kepala.";
    teksTombolKanan = "LEVEL SELANJUTNYA 🔒";
    tombolKananAktif = false;
    statusIcon = '🎯';
    badgeColor = colors.accentGold;
  } else {
    pesanMotivasi = "Jangan menyerah! 🫂 Coba pelajari lagi gesturnya di Kamus sebelum mencoba lagi.";
    teksTombolKanan = "LEVEL SEBELUMNYA ⬅️";
    statusIcon = '💪';
    badgeColor = colors.accentRed;
  }

  const Divider = () => <div style={{ height: '35px', width: '2px', backgroundColor: '#e0d5d5' }}></div>;

  // ==========================================
  // VIEW: POS ISTIRAHAT (CHECKPOINT FLASHBACK)
  // ==========================================
  if (showCheckpointView) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh', width: '100vw', backgroundColor: colors.bgDark, color: 'white', fontFamily: '"Comic Sans MS", "Chalkboard SE", "Marker Felt", sans-serif', padding: '60px 20px', overflowY: 'auto' }}>
        <img src="/logo-sibi.png" alt="Logo" style={{ position: 'fixed', top: '15%', right: '-5%', width: '600px', opacity: 0.03, transform: 'rotate(15deg)', pointerEvents: 'none' }} />
        
        <div style={{ width: '100%', maxWidth: '850px', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10 }}>
          <div style={{ fontSize: '70px', marginBottom: '-15px', filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.3))' }}>⛺</div>
          <h1 style={{ color: colors.accentGold, fontSize: '38px', margin: '0 0 15px 0', letterSpacing: '2px', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>POS ISTIRAHAT</h1>
          <p style={{ color: colors.textMuted, fontSize: '18px', textAlign: 'center', lineHeight: '1.5', margin: '0 0 40px 0', padding: '0 20px' }}>
            Kerja bagus! Kamu telah melewati 3 level dengan gemilang. Yuk, minumlah segelas air dan istirahatkan matamu sejenak sambil melihat <strong>kilas balik gestur yang baru saja kamu kuasai:</strong>
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '20px', width: '100%', marginBottom: '50px' }}>
            {(() => {
              const items = materiDikuasai || [];
              let row1 = items;
              let row2: string[] = [];
              
              if (items.length === 7) { 
                row1 = items.slice(0, 4); 
                row2 = items.slice(4, 7); 
              } else if (items.length === 6) { 
                row1 = items.slice(0, 3); 
                row2 = items.slice(3, 6); 
              }

              const renderCard = (item: string, idx: number) => {
                const rotation = idx % 2 === 0 ? '-2deg' : '2deg';
                
                return (
                  <div 
                    key={idx} 
                    onClick={() => setZoomedCard(item)}
                    style={{ 
                      backgroundColor: colors.cardBody, borderRadius: '15px', padding: '10px', 
                      border: `3px solid ${colors.cardOuter}`, boxShadow: '0 10px 25px rgba(0,0,0,0.3)', 
                      display: 'flex', flexDirection: 'column', width: '130px', 
                      transform: `rotate(${rotation})`, cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' 
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05) translateY(-5px)'; e.currentTarget.style.boxShadow = '0 15px 35px rgba(0,0,0,0.4)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = `rotate(${rotation})`; e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.3)'; }}
                  >
                    <div style={{ width: '100%', aspectRatio: '3/4', backgroundColor: '#e2dcd5', borderRadius: '10px', overflow: 'hidden', marginBottom: '10px' }}>
                      <img src={`/kamus/${item}.jpg`} alt={item} style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={(e) => { e.currentTarget.src = `https://placehold.co/300x400/e2dcd5/d98b8b?text=${item}`; }} />
                    </div>
                    <strong style={{ color: colors.textDark, fontSize: '16px', textAlign: 'center', textTransform: 'capitalize' }}>{item}</strong>
                  </div>
                );
              };

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
                    {row1.map((item, idx) => renderCard(item, idx))}
                  </div>
                  {row2.length > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
                      {row2.map((item, idx) => renderCard(item, idx + row1.length))}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          <div style={{ display: 'flex', gap: '15px', width: '100%', maxWidth: '700px', marginBottom: '40px' }}>
            <button 
              onClick={() => playClickSound(onKembali)} 
              style={{ flex: 1, padding: '16px', backgroundColor: '#8a7979', color: 'white', border: 'none', borderRadius: '15px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 6px 0 #5c5252', transition: 'transform 0.1s' }}
              onMouseDown={e => e.currentTarget.style.transform = 'translateY(6px)'}
              onMouseUp={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              🏠 BERANDA
            </button>
            <button 
              onClick={() => playClickSound(onBukaKamus)} 
              style={{ flex: 1, padding: '16px', backgroundColor: colors.accentBlue, color: 'white', border: 'none', borderRadius: '15px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 6px 0 #2980b9', transition: 'transform 0.1s' }}
              onMouseDown={e => e.currentTarget.style.transform = 'translateY(6px)'}
              onMouseUp={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              📖 BUKA KAMUS
            </button>
            <button 
              onClick={() => playClickSound(onLanjut)} 
              style={{ flex: 1.2, padding: '16px', backgroundColor: colors.accentGreen, color: 'white', border: 'none', borderRadius: '15px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 6px 0 #27ae60', transition: 'transform 0.1s' }}
              onMouseDown={e => e.currentTarget.style.transform = 'translateY(6px)'}
              onMouseUp={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              LANJUT BELAJAR ➡️
            </button>
          </div>
        </div>

        {zoomedCard && (
          <div 
            onClick={() => setZoomedCard(null)}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(30, 25, 25, 0.9)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', backdropFilter: 'blur(8px)' }}
          >
            <div onClick={(e) => e.stopPropagation()} style={{ position: 'relative', maxWidth: '400px', width: '90%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <button 
                onClick={() => setZoomedCard(null)}
                style={{ position: 'absolute', top: '-40px', right: '-40px', background: 'none', border: 'none', color: colors.cardBg, fontSize: '50px', cursor: 'pointer', transition: 'transform 0.2s', zIndex: 10 }}
                onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                &times;
              </button>
              
              <div style={{ padding: '15px', backgroundColor: colors.cardBg, borderRadius: '25px', boxShadow: '0 25px 50px rgba(0,0,0,0.6)', width: '100%' }}>
                <img 
                  src={`/kamus/${zoomedCard}.jpg`} 
                  alt={zoomedCard} 
                  onError={(e) => { e.currentTarget.src = `https://placehold.co/800x800/e2dcd5/d98b8b?text=${zoomedCard}`; }}
                  style={{ width: '100%', aspectRatio: '3/4', borderRadius: '15px', objectFit: 'contain', backgroundColor: '#e2dcd5' }}
                />
              </div>
              
              <h2 style={{ color: colors.cardBg, marginTop: '20px', fontSize: '32px', letterSpacing: '2px', textTransform: 'capitalize', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                {zoomedCard}
              </h2>
            </div>
          </div>
        )}

      </div>
    );
  }

  // ==========================================
  // VIEW: SUMMARY UTAMA
  // ==========================================
  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100vw', backgroundColor: colors.bgDark, color: 'white', fontFamily: '"Comic Sans MS", "Chalkboard SE", "Marker Felt", sans-serif', position: 'relative', overflow: 'hidden' }}>
      
      <img src="/logo-sibi.png" alt="Logo SIBI Background" style={{ position: 'absolute', top: '15%', right: '-5%', width: '600px', opacity: 0.03, transform: 'rotate(15deg)', pointerEvents: 'none', filter: 'brightness(0) invert(1)' }} />
      
      {(statusLevel === 'LEVEL UP' || isTamat) && <Confetti recycle={isTamat} numberOfPieces={isTamat ? 600 : 400} gravity={0.2} />}

      <div style={{ width: '100%', maxWidth: '650px', display: 'flex', flexDirection: 'column', gap: '15px', zIndex: 10, transform: 'translateY(-40px)' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '0 10px', color: '#d1ccc0', fontWeight: 'bold' }}>
          <div style={{ fontSize: '20px' }}>Level {levelSaatIni}</div>
          <div style={{ fontSize: '28px', letterSpacing: '4px', transform: 'translateY(5px)' }}>SUMMARY</div>
          <div style={{ fontSize: '20px', color: (statusLevel === 'LEVEL UP' || isTamat) ? colors.accentGreen : '#d1ccc0' }}>
            {isTamat ? 'TAMAT 👑' : (statusLevel === 'LEVEL UP' ? `>>> Level ${levelTujuan}` : <span style={{opacity: 0}}>.</span>)}
          </div>
        </div>

        <div style={{ backgroundColor: colors.cardOuter, width: '100%', borderRadius: '30px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', border: `4px solid ${colors.cardOuter}` }}>
          
          <div style={{ backgroundColor: colors.cardHeader, padding: '20px 25px', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
            <h1 style={{ margin: 0, color: 'white', fontSize: '28px', letterSpacing: '1px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '32px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>{statusIcon}</span>
              SESI SELESAI
            </h1>
            <div style={{ position: 'absolute', right: '25px', backgroundColor: badgeColor, color: statusLevel === 'MAINTAIN' ? colors.textDark : 'white', padding: '6px 16px', borderRadius: '15px', fontSize: '14px', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>
              {isTamat ? 'TAMAT!' : (statusLevel === 'LEVEL UP' ? 'LEVEL UP!' : statusLevel === 'MAINTAIN' ? 'TETAP' : statusLevel)}
            </div>
          </div>

          <div style={{ backgroundColor: colors.cardBody, padding: '35px 35px 30px 35px' }}>
            
            <div style={{ backgroundColor: colors.cardOuter, borderRadius: '18px', padding: '15px 20px', marginBottom: '25px', display: 'flex', justifyContent: 'space-around', alignItems: 'center', color: colors.textDark, boxShadow: 'inset 0 4px 8px rgba(0,0,0,0.05)' }}>
              <div style={{ textAlign: 'center' }}>
                <span style={{ display: 'block', marginBottom: '5px', color: colors.textMuted, fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>Skor Dasar</span>
                <strong style={{ fontSize: '22px' }}>{baseScore}</strong>
              </div>
              <Divider />
              <div style={{ textAlign: 'center' }}>
                <span style={{ display: 'block', marginBottom: '5px', color: colors.textMuted, fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>Akurasi</span>
                <strong style={{ fontSize: '22px' }}>{akurasi.toFixed(0)}%</strong>
              </div>
              <Divider />
              <div style={{ textAlign: 'center' }}>
                <span style={{ display: 'block', marginBottom: '5px', color: colors.textMuted, fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>Bonus Waktu</span>
                <strong style={{ fontSize: '22px', color: colors.accentGreen }}>+{speedBonus}</strong>
              </div>
              <Divider />
              <div style={{ textAlign: 'center' }}>
                <span style={{ display: 'block', marginBottom: '5px', color: colors.textMuted, fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>Bonus Streak</span>
                <strong style={{ fontSize: '22px', color: colors.accentOrange }}>+{streakBonus}</strong>
              </div>
            </div>

            <div style={{ textAlign: 'center', margin: '0 0 25px 0' }}>
              <div style={{ fontSize: '20px', color: colors.textDark, marginBottom: '8px' }}>
                Selamat! Kamu mendapatkan <span style={{ color: colors.accentGreen, fontSize: '34px', fontWeight: 'bold', display: 'inline-block', transform: 'translateY(3px)' }}>{scoreSesi} XP!</span>
              </div>
              <p style={{ color: colors.textMuted, fontSize: '15px', fontStyle: 'italic', margin: 0, padding: '0 20px', lineHeight: '1.4' }}>
                "{pesanMotivasi}"
              </p>
              
              {/* TOMBOL KAMUS SEKARANG SELALU MUNCUL DI SETIAP SUMMARY */}
              <div style={{ marginTop: '15px' }}>
                <button 
                  onClick={() => playClickSound(onBukaKamus)}
                  style={{ 
                    backgroundColor: '#eaf4fc', color: colors.accentBlue, border: `2px solid ${colors.accentBlue}`, 
                    padding: '8px 20px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold', 
                    cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit',
                    boxShadow: '0 4px 6px rgba(52, 152, 219, 0.15)'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.backgroundColor = colors.accentBlue; e.currentTarget.style.color = '#fff'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#eaf4fc'; e.currentTarget.style.color = colors.accentBlue; e.currentTarget.style.transform = 'translateY(0)' }}
                >
                  📖 Buka Kamus SIBI
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 10px', marginBottom: '30px', borderTop: `2px dashed ${colors.cardOuter}`, paddingTop: '20px' }}>
              <div style={{ textAlign: 'left', flex: 1 }}>
                <div style={{ fontSize: '11px', color: colors.textMuted, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '5px' }}>Waktu Rata-rata</div>
                <strong style={{ fontSize: '18px', color: colors.textDark }}>{avgTime.toFixed(1)}s ⏱️</strong>
              </div>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontSize: '11px', color: colors.textMuted, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '5px' }}>Streak Saat Ini</div>
                <strong style={{ fontSize: '18px', color: colors.accentOrange }}>{currentStreak} 🔥</strong>
              </div>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontSize: '11px', color: colors.textMuted, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '5px' }}>Rekor Streak</div>
                <strong style={{ fontSize: '18px', color: colors.accentGold }}>{bestStreak} 👑</strong>
              </div>
              <div style={{ textAlign: 'right', flex: 1 }}>
                <div style={{ fontSize: '11px', color: colors.textMuted, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '5px' }}>Total XP Kamu</div>
                <strong style={{ fontSize: '18px', color: colors.accentBlue }}>{totalXPSaatIni + scoreSesi} ✨</strong>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '15px' }}>
              <button 
                onMouseDown={() => setActiveBtn('kembali')}
                onMouseUp={() => { setActiveBtn(null); playClickSound(onKembali); }}
                onMouseLeave={() => setActiveBtn(null)}
                style={{ flex: 1, padding: '14px 8px', backgroundColor: '#8a7979', color: 'white', border: 'none', borderRadius: '15px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'inherit', boxShadow: activeBtn === 'kembali' ? '0 0 0 transparent' : '0 6px 0 #5c5252', transform: activeBtn === 'kembali' ? 'translateY(6px)' : 'translateY(0)', transition: 'all 0.1s ease', lineHeight: '1.4' }}
              >
                KEMBALI KE<br/>BERANDA
              </button>
              
              <button 
                onMouseDown={() => setActiveBtn('ulangi')}
                onMouseUp={() => { setActiveBtn(null); playClickSound(onUlangi); }}
                onMouseLeave={() => setActiveBtn(null)}
                style={{ flex: 1, padding: '14px 8px', backgroundColor: statusLevel === 'MAINTAIN' ? '#b8a6a6' : colors.terakota, color: 'white', border: 'none', borderRadius: '15px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'inherit', boxShadow: activeBtn === 'ulangi' ? '0 0 0 transparent' : `0 6px 0 ${statusLevel === 'MAINTAIN' ? '#8a7979' : '#b36d6d'}`, transform: activeBtn === 'ulangi' ? 'translateY(6px)' : 'translateY(0)', transition: 'all 0.1s ease', lineHeight: '1.4' }}
              >
                ULANGI<br/>LEVEL INI
              </button>
              
              <button 
                disabled={!tombolKananAktif}
                onMouseDown={() => tombolKananAktif && setActiveBtn('lanjut')}
                onMouseUp={() => { 
                  if(tombolKananAktif) { 
                    setActiveBtn(null); 
                    if (isMilestone && statusLevel === 'LEVEL UP' && !isTamat) {
                      playClickSound(() => setShowCheckpointView(true));
                    } else {
                      playClickSound(onLanjut); 
                    }
                  } 
                }}
                onMouseLeave={() => setActiveBtn(null)}
                style={{ flex: 1.2, padding: '14px 8px', backgroundColor: !tombolKananAktif ? '#e0d5d5' : statusLevel === 'LEVEL DOWN' ? colors.accentRed : colors.accentGreen, color: !tombolKananAktif ? '#a89d9d' : 'white', border: 'none', borderRadius: '15px', fontSize: '13px', fontWeight: 'bold', fontFamily: 'inherit', cursor: tombolKananAktif ? 'pointer' : 'not-allowed', boxShadow: activeBtn === 'lanjut' || !tombolKananAktif ? '0 0 0 transparent' : `0 6px 0 ${statusLevel === 'LEVEL DOWN' ? '#c0392b' : '#27ae60'}`, transform: activeBtn === 'lanjut' && tombolKananAktif ? 'translateY(6px)' : 'translateY(0)', transition: 'all 0.1s ease', lineHeight: '1.4' }}
              >
                {teksTombolKanan.split(' ').map((word, i) => <React.Fragment key={i}>{word}<br/></React.Fragment>)}
              </button>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
}