// src/pages/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { collection, query, getDocs } from 'firebase/firestore'; 
import { db } from '../firebase'; 
import Kamus from './Kamus'; 

interface DashboardProps {
  unlockedLevel: number;
  totalXP: number;
  bestStreak: number;
  userName: string;
  userId?: string; 
  initialTab?: 'BELAJAR' | 'PERINGKAT' | 'PROFIL' | 'KAMUS'; 
  onMulaiLevel: (level: number) => void;
  onCobaGestur: (gesturId: string) => void; 
  onLogout: () => void;
}

export default function Dashboard({ unlockedLevel, totalXP, bestStreak, userName, userId, initialTab = 'BELAJAR', onMulaiLevel, onCobaGestur, onLogout }: DashboardProps) {
  const [hoveredLevel, setHoveredLevel] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'BELAJAR' | 'PERINGKAT' | 'PROFIL' | 'KAMUS'>(initialTab);
  
  // STATE UNTUK KONFIRMASI LOGOUT & MODAL TUTORIAL
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [fullLeaderboard, setFullLeaderboard] = useState<any[]>([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(true);

  const displayUnlockedLevel = Math.min(21, unlockedLevel);
  const progressPercent = Math.round((displayUnlockedLevel / 21) * 100);

  const colors = {
    sidebarBg: '#2e2626',
    mainBg: '#3b3131',
    menuActiveBg: '#4a3f3f',
    buttonBg: '#d98b8b',       
    buttonHover: '#e69a9a',
    buttonLocked: '#635353',
    cardBg: '#fff8f0',        
    textLight: '#ffffff',
    textMuted: '#c4b5b5',
    textDark: '#4a3f3f',
    accentGold: '#f1c40f',
    accentGreen: '#2ecc71',
    accentRed: '#e74c3c',
    accentOrange: '#e67e22',
    accentBlue: '#3498db'
  };

  const sidebarQuotes = [
    "💡 'Setiap gerakan tanganmu hari ini membawamu lebih dekat pada penguasaan.'",
    "💡 Tahukah Kamu? SIBI (Sistem Isyarat Bahasa Indonesia) diresmikan pemerintah pada tahun 1994.",
    "💡 'Konsistensi dalam berlatih SIBI lebih penting daripada intensitas sesekali.'",
    "💡 Tahukah Kamu? SIBI menggunakan tata bahasa yang sama dengan bahasa lisan (S-P-O-K).",
    "💡 'Bahasa isyarat adalah cara indah untuk menghubungkan hati tanpa kata.'",
    "💡 Tahukah Kamu? Belajar bahasa isyarat dapat meningkatkan memori visual otakmu lho!",
    "💡 'Jangan takut salah. Setiap koreksi AI membantumu menjadi lebih baik.'",
    "💡 'Satu huruf hari ini, satu kalimat besok. Pertahankan semangat belajar!'"
  ];
  const [currentQuote, setCurrentQuote] = useState(sidebarQuotes[Math.floor(Math.random() * sidebarQuotes.length)]);

  const getLevelTargetInfo = (lvl: number) => {
    const targets: Record<number, string> = {
      1: 'A, B, C', 2: 'D, E', 3: 'F, G', 4: 'H, I', 5: 'J, K',
      6: 'L, M', 7: 'N, O', 8: 'P, Q', 9: 'R, S', 10: 'T, U',
      11: 'V, W', 12: 'X, Y', 13: 'Z', 14: 'Review Abjad',
      15: 'Halo, Saya', 16: 'Bagus, Sempurna', 17: 'Cinta, Teman',
      18: 'Nama, Rumah', 19: 'Maaf, Bantu', 20: 'Review Kata',
      21: 'Tantangan Final'
    };
    return targets[lvl] || '';
  };

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setIsLoadingLeaderboard(true);
      try {
        const q = query(collection(db, "users"));
        const querySnapshot = await getDocs(q);
        
        const players: any[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.role !== 'admin') {
            players.push({
              id: doc.id,
              name: data.name || "Pengguna",
              xp: data.totalXP || 0,
              level: data.unlockedLevel ? Math.min(21, data.unlockedLevel) : 1, 
              streak: data.bestStreak || 0,
              isMe: doc.id === userId,
              joined: data.createdAt ? new Date(data.createdAt).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'}) : new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})
            });
          }
        });

        players.sort((a, b) => b.xp - a.xp);

        const rankedPlayers = players.map((p, index) => ({
           ...p,
           rank: index + 1,
           icon: index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '👤'
        }));
        
        setFullLeaderboard(rankedPlayers); 
        setLeaderboardData(rankedPlayers.slice(0, 3)); 

      } catch (error) {
        console.error("Gagal mengambil data leaderboard:", error);
      } finally {
        setIsLoadingLeaderboard(false);
      }
    };
    fetchLeaderboard();

    const intervalQuote = setInterval(() => {
      setCurrentQuote(sidebarQuotes[Math.floor(Math.random() * sidebarQuotes.length)]);
    }, 10000); 

    return () => clearInterval(intervalQuote);
  }, [totalXP, userId]); 

  // FUNGSI INTERSEPTOR UNTUK MENAMPILKAN MODAL TUTORIAL
  const handleKlikMulai = (level: number) => {
    const startAudio = new Audio('/audio/start.mp3');
    startAudio.volume = 0.8;
    startAudio.play().catch(e => console.log("Audio terblokir:", e));

    if (level === 1) {
      // Jika pengguna menekan Level 1, tampilkan modal panduan
      setShowTutorial(true);
    } else {
      // Jika level 2 ke atas, langsung masuk ke mode percobaan/tantangan
      setTimeout(() => { onMulaiLevel(level); }, 300); 
    }
  };

  const handleLanjutDariTutorial = () => {
    setShowTutorial(false);
    onMulaiLevel(1); // Mulai level 1 setelah menekan "Saya Paham"
  };

  const StatsBadge = ({ icon, label, value, color }: { icon: string, label: string, value: string | number, color: string }) => (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#4a3f3f', padding: '12px 5px', borderRadius: '16px', border: '1px solid #635353', borderBottom: `4px solid ${color}`, boxShadow: '0 4px 10px rgba(0,0,0,0.15)' }}>
      <span style={{ fontSize: '10px', color: '#e0d5d5', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold', marginBottom: '5px', textAlign: 'center', whiteSpace: 'nowrap' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '22px', filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.3))' }}>{icon}</span>
        <strong style={{ fontSize: '18px', color: '#ffffff' }}>{value}</strong>
      </div>
    </div>
  );

  const myProfileData = fullLeaderboard.find(p => p.isMe);
  const myRank = myProfileData?.rank || '-';
  const joinDate = myProfileData?.joined || 'Baru Saja';
  
  const getAvatarEmoji = (name: string) => {
    const emojis = ['🦊', '🐼', '🐯', '🐰', '🦁', '🐻', '🐸', '🐨', '🐵', '🐹', '🐶', '🐙', '🦉'];
    if (!name) return '👤';
    let sum = 0;
    for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
    return emojis[sum % emojis.length];
  };
  const userEmoji = getAvatarEmoji(userName);

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', backgroundColor: colors.mainBg, color: colors.textLight, fontFamily: '"Comic Sans MS", "Chalkboard SE", "Marker Felt", sans-serif', position: 'relative' }}>
      
      {/* PANGGIL MODAL TUTORIAL DI SINI */}
      {showTutorial && <TutorialModal onTutup={handleLanjutDariTutorial} />}

      {/* === SIDEBAR KIRI === */}
      <div style={{ width: '260px', backgroundColor: colors.sidebarBg, display: 'flex', flexDirection: 'column', padding: '40px 0 0 0', borderRight: '1px solid #1a1a1a', zIndex: 10, boxShadow: '4px 0 15px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', paddingLeft: '35px', marginBottom: '50px' }}>
          <img src="/logo-sibi.png" alt="Icon SIBI" style={{ width: '45px', filter: 'brightness(0) invert(1) drop-shadow(0 2px 3px rgba(0,0,0,0.4))' }} />
          <h1 style={{ fontSize: '24px', margin: 0, letterSpacing: '1px', fontWeight: 'bold', color: colors.cardBg }}>sibi-game</h1>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          
          <div onClick={() => setActiveTab('BELAJAR')} style={{ backgroundColor: activeTab === 'BELAJAR' ? colors.menuActiveBg : 'transparent', padding: '15px 35px', borderTopRightRadius: '25px', borderBottomRightRadius: '25px', display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer', width: '85%', borderLeft: activeTab === 'BELAJAR' ? `4px solid ${colors.buttonBg}` : '4px solid transparent', transition: 'all 0.3s' }}>
            <span style={{ fontSize: '20px', opacity: activeTab === 'BELAJAR' ? 1 : 0.6 }}>📚</span>
            <span style={{ fontSize: '17px', fontWeight: 'bold', color: activeTab === 'BELAJAR' ? colors.buttonBg : colors.textLight, opacity: activeTab === 'BELAJAR' ? 1 : 0.8 }}>BELAJAR</span>
          </div>
          
          <div onClick={() => setActiveTab('KAMUS')} style={{ backgroundColor: activeTab === 'KAMUS' ? colors.menuActiveBg : 'transparent', padding: '15px 35px', borderTopRightRadius: '25px', borderBottomRightRadius: '25px', display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer', width: '85%', borderLeft: activeTab === 'KAMUS' ? `4px solid ${colors.buttonBg}` : '4px solid transparent', transition: 'all 0.3s' }}>
            <span style={{ fontSize: '20px', opacity: activeTab === 'KAMUS' ? 1 : 0.6 }}>📖</span>
            <span style={{ fontSize: '17px', fontWeight: 'bold', color: activeTab === 'KAMUS' ? colors.buttonBg : colors.textLight, opacity: activeTab === 'KAMUS' ? 1 : 0.8, whiteSpace: 'nowrap' }}>KAMUS SIBI</span>
          </div>

          <div onClick={() => setActiveTab('PERINGKAT')} style={{ backgroundColor: activeTab === 'PERINGKAT' ? colors.menuActiveBg : 'transparent', padding: '15px 35px', borderTopRightRadius: '25px', borderBottomRightRadius: '25px', display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer', width: '85%', borderLeft: activeTab === 'PERINGKAT' ? `4px solid ${colors.buttonBg}` : '4px solid transparent', transition: 'all 0.3s' }}>
            <span style={{ fontSize: '20px', opacity: activeTab === 'PERINGKAT' ? 1 : 0.6 }}>🏆</span>
            <span style={{ fontSize: '17px', fontWeight: 'bold', color: activeTab === 'PERINGKAT' ? colors.buttonBg : colors.textLight, opacity: activeTab === 'PERINGKAT' ? 1 : 0.8 }}>PERINGKAT</span>
          </div>
          
          <div onClick={() => setActiveTab('PROFIL')} style={{ backgroundColor: activeTab === 'PROFIL' ? colors.menuActiveBg : 'transparent', padding: '15px 35px', borderTopRightRadius: '25px', borderBottomRightRadius: '25px', display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer', width: '85%', borderLeft: activeTab === 'PROFIL' ? `4px solid ${colors.buttonBg}` : '4px solid transparent', transition: 'all 0.3s' }}>
            <span style={{ fontSize: '20px', opacity: activeTab === 'PROFIL' ? 1 : 0.6 }}>👤</span>
            <span style={{ fontSize: '17px', fontWeight: 'bold', color: activeTab === 'PROFIL' ? colors.buttonBg : colors.textLight, opacity: activeTab === 'PROFIL' ? 1 : 0.8 }}>PROFIL</span>
          </div>
        </div>

        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '15px', paddingBottom: '25px', paddingLeft: '35px', paddingRight: '20px' }}>
          
          <div style={{ backgroundColor: 'rgba(255, 248, 240, 0.05)', borderRadius: '15px', padding: '15px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center', zIndex: 11, marginBottom: '20px' }}>
            <p style={{ margin: 0, fontSize: '13px', color: colors.textMuted, fontStyle: 'italic', lineHeight: '1.5' }}>
              {currentQuote}
            </p>
          </div>

          <div onClick={() => setShowLogoutConfirm(true)} style={{ padding: '15px 0', display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer', opacity: 0.7, transition: 'all 0.2s', marginLeft: '-35px', paddingLeft: '35px' }} onMouseOver={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = colors.accentRed; e.currentTarget.style.backgroundColor = 'rgba(231, 76, 60, 0.05)'; }} onMouseOut={(e) => { e.currentTarget.style.opacity = '0.7'; e.currentTarget.style.color = colors.textLight; e.currentTarget.style.backgroundColor = 'transparent'; }}>
            <span style={{ fontSize: '20px' }}>🚪</span>
            <span style={{ fontSize: '16px', letterSpacing: '0.5px', fontWeight: 'bold' }}>KELUAR AKUN</span>
          </div>
        </div>
      </div>

      {/* === KONTEN TENGAH BERDASARKAN TAB === */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', overflowY: 'auto', minHeight: 0 }}>
        <img src="/logo-sibi.png" alt="Watermark SIBI" style={{ position: 'absolute', top: '15%', left: '15%', width: '180px', opacity: 0.03, transform: 'rotate(-15deg)', pointerEvents: 'none', filter: 'brightness(0) invert(1)' }} />
        
        {/* TAB: BELAJAR (MAP LEVEL) */}
        {activeTab === 'BELAJAR' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '40px 0 0 50px', position: 'relative', minHeight: 0 }}>
             <div style={{ position: 'absolute', top: '70%', left: '15%', fontSize: '120px', opacity: 0.03, transform: 'rotate(-10deg)', pointerEvents: 'none' }}>🤟🏻</div>
             <div style={{ position: 'absolute', top: '40%', right: '20%', fontSize: '140px', opacity: 0.03, transform: 'rotate(20deg)', pointerEvents: 'none' }}>📚</div>
             
             <div style={{ marginBottom: '20px', paddingRight: '50px', zIndex: 2 }}>
               <h1 style={{ fontSize: '42px', margin: '0 0 5px 0', fontWeight: 'bold', color: colors.cardBg, textTransform: 'capitalize' }}>Halo, {userName}! 👋🏻</h1>
               <h2 style={{ fontSize: '20px', margin: 0, fontWeight: 'normal', color: colors.textMuted }}>Siap untuk melanjutkan petualangan belajarmu hari ini?</h2>
             </div>

             <div style={{ flex: 1, overflowY: 'auto', padding: '70px 50px 100px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2 }}>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', width: '100%', maxWidth: '500px', position: 'relative' }}>
                 {Array.from({ length: 21 }, (_, i) => i + 1).map((level) => {
                   const isUnlocked = level <= displayUnlockedLevel;
                   const isActive = level === displayUnlockedLevel; 
                   const xOffset = Math.sin(level * 0.7) * 120; 
                   const isHovered = hoveredLevel === level;
                   
                   const isBonus = level === 14 || level === 20;
                   const isFinalBoss = level === 21;
                   const targetInfo = getLevelTargetInfo(level);

                   let tooltipText = `🔒 Selesaikan Level ${level - 1} dulu`;
                   if (isUnlocked) {
                     if (isFinalBoss) tooltipText = `👑 Tantangan Final SIBI!`;
                     else if (isBonus) tooltipText = `✨ Ujian Bonus Level ${level}`;
                     else tooltipText = `🌟 Mulai Level ${level} (${targetInfo})`;
                   }

                   let btnBg = colors.buttonLocked;
                   if (isUnlocked) {
                     if (isFinalBoss) btnBg = isHovered ? '#cc6666' : '#b85c5c'; 
                     else if (isBonus) btnBg = isHovered ? '#d4b26a' : '#c49f53'; 
                     else btnBg = isHovered ? colors.buttonHover : colors.buttonBg;
                   }
                   
                   let btnContent;
                   if (!isUnlocked) {
                     btnContent = <span>🔒</span>;
                   } else {
                     btnContent = (
                       <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: isActive ? '4px' : '2px' }}>
                         {isFinalBoss && <span style={{ fontSize: isActive ? '24px' : '18px', lineHeight: '1', filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.2))' }}>👑</span>}
                         {isBonus && <span style={{ fontSize: isActive ? '20px' : '14px', lineHeight: '1', filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.2))' }}>✨</span>}
                         <span style={{ lineHeight: '1' }}>{level}</span>
                       </div>
                     );
                   }

                   return (
                     <div key={level} style={{ display: 'flex', justifyContent: 'center', width: '100%', transform: `translateX(${xOffset}px)` }}>
                       <div style={{ position: 'relative' }}>
                         {isHovered && (
                           <div style={{ position: 'absolute', top: '-48px', left: '50%', transform: 'translateX(-50%)', backgroundColor: isUnlocked ? colors.cardBg : '#635353', color: isUnlocked ? colors.textDark : '#e0d5d5', padding: '8px 16px', borderRadius: '15px', fontSize: '14px', fontWeight: 'bold', whiteSpace: 'nowrap', boxShadow: '0 4px 10px rgba(0,0,0,0.3)', pointerEvents: 'none', zIndex: 20 }}>
                             {tooltipText}
                           </div>
                         )}
                         <button 
                            onClick={() => isUnlocked && handleKlikMulai(level)} 
                            onMouseEnter={() => setHoveredLevel(level)} 
                            onMouseLeave={() => setHoveredLevel(null)} 
                            style={{ 
                              width: isActive ? '100px' : '85px', 
                              height: isActive ? '100px' : '85px', 
                              borderRadius: isFinalBoss ? (isActive ? '25px' : '22px') : '50%', 
                              backgroundColor: btnBg, 
                              color: isUnlocked ? '#ffffff' : '#9e9191', 
                              border: isActive ? `6px solid ${colors.cardBg}` : (isUnlocked ? `4px solid ${colors.cardBg}` : '4px solid #4a3f3f'), 
                              fontSize: isActive ? '32px' : '26px', 
                              fontWeight: 'bold', 
                              fontFamily: 'inherit', 
                              cursor: isUnlocked ? 'pointer' : 'not-allowed', 
                              boxShadow: isActive ? `0 0 20px ${btnBg}80, 0 8px 15px rgba(0,0,0,0.4), inset 0 -6px 0 rgba(0,0,0,0.2)` : (isUnlocked ? `0 6px 12px rgba(0,0,0,0.3), inset 0 -4px 0 rgba(0,0,0,0.2)` : 'inset 0 4px 8px rgba(0,0,0,0.4)'), 
                              transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)', 
                              display: 'flex', 
                              justifyContent: 'center', 
                              alignItems: 'center', 
                              position: 'relative', 
                              zIndex: 10 
                            }} 
                            onMouseDown={(e) => { if (isUnlocked) e.currentTarget.style.transform = 'scale(0.9) translateY(4px)' }} 
                            onMouseUp={(e) => { if (isUnlocked) e.currentTarget.style.transform = 'scale(1) translateY(0)' }}
                          >
                           {btnContent}
                         </button>
                       </div>
                     </div>
                   );
                 })}
               </div>
             </div>
          </div>
        )}

        {/* TAB: PERINGKAT */}
        {activeTab === 'PERINGKAT' && (
          <div style={{ flex: 1, padding: '50px', display: 'flex', flexDirection: 'column', zIndex: 2, minHeight: 0 }}>
            <h1 style={{ fontSize: '36px', margin: '0 0 10px 0', color: colors.cardBg, display: 'flex', alignItems: 'center', gap: '15px', flexShrink: 0 }}>
              <span>🏆</span> Papan Peringkat Global
            </h1>
            <p style={{ fontSize: '18px', color: colors.textMuted, margin: '0 0 40px 0', flexShrink: 0 }}>Bersainglah dengan pemain lain dan raih XP terbanyak!</p>

            <div style={{ backgroundColor: colors.cardBg, borderRadius: '30px', padding: '40px', boxShadow: '0 15px 35px rgba(0,0,0,0.3)', flex: 1, overflowY: 'auto' }}>
               {isLoadingLeaderboard ? (
                 <div style={{ textAlign: 'center', padding: '50px', color: colors.textMuted, fontSize: '18px' }}>Menganalisis data pemain... ⏳</div>
               ) : fullLeaderboard.length === 0 ? (
                 <div style={{ textAlign: 'center', padding: '50px', color: colors.textMuted, fontSize: '18px' }}>Belum ada data pemain. Jadilah yang pertama!</div>
               ) : (
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                   {fullLeaderboard.map((player) => (
                     <div key={player.id} style={{ display: 'flex', alignItems: 'center', gap: '20px', backgroundColor: player.isMe ? '#fdfbf9' : '#ffffff', padding: '20px 30px', borderRadius: '20px', border: player.isMe ? `3px solid ${colors.buttonBg}` : '2px solid #f2ece4', boxShadow: player.isMe ? `0 8px 20px ${colors.buttonBg}40` : 'none', transform: player.isMe ? 'scale(1.02)' : 'scale(1)', transition: 'all 0.2s' }}>
                       <div style={{ fontSize: '24px', fontWeight: 'bold', color: player.rank <= 3 ? colors.accentGold : colors.textMuted, width: '40px', textAlign: 'center' }}>
                         #{player.rank}
                       </div>
                       <div style={{ fontSize: '32px' }}>{player.icon}</div>
                       <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                         <span style={{ fontSize: '20px', fontWeight: 'bold', color: colors.textDark, textTransform: 'capitalize' }}>
                           {player.name} {player.isMe && <span style={{ color: colors.buttonBg, fontSize: '14px', marginLeft: '10px' }}>(You)</span>}
                         </span>
                         <div style={{ display: 'flex', gap: '15px', marginTop: '5px', fontSize: '14px', color: colors.textMuted, fontWeight: 'bold' }}>
                           <span>📚 Level {player.level}</span>
                           <span>🔥 Streak Tertinggi: {player.streak}</span>
                         </div>
                       </div>
                       <div style={{ fontSize: '28px', fontWeight: 'bold', color: colors.buttonBg }}>
                         {player.xp} <span style={{ fontSize: '16px', color: colors.textMuted }}>XP</span>
                       </div>
                     </div>
                   ))}
                 </div>
               )}
            </div>
          </div>
        )}

        {/* TAB: PROFIL */}
        {activeTab === 'PROFIL' && (
          <div style={{ flex: 1, padding: '50px', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2, overflowY: 'auto', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.04) 2px, transparent 2px)', backgroundSize: '30px 30px', zIndex: 0 }}></div>

            <div style={{ display: 'flex', gap: '40px', width: '100%', maxWidth: '1100px', alignItems: 'stretch', zIndex: 1 }}>
              <div style={{ flex: 1, backgroundColor: colors.cardBg, borderRadius: '35px', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 50px rgba(0,0,0,0.25)', overflow: 'hidden' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: '100%', height: '160px', backgroundColor: colors.buttonBg, display: 'flex', justifyContent: 'center', position: 'relative' }}>
                    <img src="/logo-sibi.png" alt="Logo SIBI" style={{ position: 'absolute', top: '30px', width: '160px', opacity: 0.15, filter: 'brightness(0) invert(1)' }} />
                  </div>
                  <div style={{ width: '140px', height: '140px', backgroundColor: '#ffffff', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', border: `8px solid ${colors.cardBg}`, boxShadow: '0 10px 25px rgba(0,0,0,0.15)', marginTop: '-70px', zIndex: 1, fontSize: '75px' }}>
                    {userEmoji}
                  </div>
                  <h2 style={{ fontSize: '36px', color: colors.textDark, margin: '15px 0 5px 0', textTransform: 'capitalize' }}>{userName}</h2>
                  <div style={{ fontSize: '16px', color: colors.textMuted, fontWeight: 'bold', marginBottom: '35px' }}>Bergabung sejak: {joinDate}</div>
                  
                  <div style={{ width: '85%', padding: '0 15px', marginBottom: '40px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: colors.textMuted, fontWeight: 'bold', fontSize: '16px' }}>Peringkat Global</span>
                      <span style={{ color: colors.accentGold, fontWeight: 'bold', fontSize: '22px' }}>#{myRank}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: colors.textMuted, fontWeight: 'bold', fontSize: '16px' }}>ID Pemain</span>
                      <span style={{ color: colors.textDark, fontWeight: 'bold', fontSize: '16px' }}>{userId?.substring(0,8)}</span>
                    </div>
                  </div>
                </div>
                
                <div style={{ marginTop: 'auto' }}>
                  <button 
                    onClick={() => setShowLogoutConfirm(true)}
                    style={{ width: '100%', padding: '25px', backgroundColor: colors.accentRed, color: 'white', border: 'none', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', justifyContent: 'center', gap: '12px' }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#c0392b'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = colors.accentRed}
                  >
                    <span>🚪</span> KELUAR AKUN
                  </button>
                </div>
              </div>

              <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '30px', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: '30px' }}>
                  <div style={{ flex: 1, backgroundColor: colors.cardBg, padding: '35px', borderRadius: '30px', boxShadow: '0 12px 30px rgba(0,0,0,0.15)', borderLeft: `8px solid ${colors.buttonBg}` }}>
                    <div style={{ fontSize: '15px', color: colors.textMuted, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '15px' }}>Level Master</div>
                    <div style={{ fontSize: '50px', color: colors.textDark, fontWeight: 'bold', lineHeight: '1' }}>{displayUnlockedLevel} <span style={{ fontSize: '22px', color: colors.textMuted }}>/ 21</span></div>
                  </div>
                  <div style={{ flex: 1, backgroundColor: colors.cardBg, padding: '35px', borderRadius: '30px', boxShadow: '0 12px 30px rgba(0,0,0,0.15)', borderLeft: `8px solid ${colors.accentRed}` }}>
                    <div style={{ fontSize: '15px', color: colors.textMuted, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '15px' }}>Rekor Streak Terbaik</div>
                    <div style={{ fontSize: '50px', color: colors.textDark, fontWeight: 'bold', lineHeight: '1', display: 'flex', alignItems: 'center', gap: '15px' }}>🔥 {bestStreak}</div>
                  </div>
                </div>

                <div style={{ backgroundColor: colors.cardBg, padding: '35px 45px', borderRadius: '30px', boxShadow: '0 12px 30px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: `4px solid ${colors.accentGold}` }}>
                  <div>
                    <div style={{ fontSize: '18px', color: colors.accentGold, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px' }}>Total Experience</div>
                    <div style={{ fontSize: '16px', color: colors.textMuted }}>Kumpulkan terus dari latihan!</div>
                  </div>
                  <div style={{ fontSize: '65px', color: colors.textDark, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '15px' }}>{totalXP} ✨</div>
                </div>

                <div style={{ backgroundColor: colors.cardBg, padding: '40px', borderRadius: '30px', boxShadow: '0 12px 30px rgba(0,0,0,0.15)', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ margin: '0 0 25px 0', letterSpacing: '1px', fontWeight: 'bold', fontSize: '22px', color: colors.textDark, borderBottom: '2px solid #f2ece4', paddingBottom: '15px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    🎖️ PENCAPAIAN SIBI
                  </h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', flex: 1, alignItems: 'center' }}>
                    <div style={{ flex: 1, textAlign: 'center', opacity: displayUnlockedLevel >= 5 ? 1 : 0.4, filter: displayUnlockedLevel >= 5 ? 'none' : 'grayscale(100%)', position: 'relative' }}>
                      {displayUnlockedLevel < 5 && <div style={{ position: 'absolute', top: '-15px', right: '25px', fontSize: '24px' }}>🔒</div>}
                      <div style={{ fontSize: '55px', marginBottom: '15px', filter: displayUnlockedLevel >= 5 ? 'drop-shadow(0 4px 6px rgba(0,0,0,0.2))' : 'none' }}>🎓</div>
                      <div style={{ fontSize: '16px', fontWeight: 'bold', color: colors.textDark }}>Pemula Tangguh</div>
                      <div style={{ fontSize: '14px', color: colors.textMuted }}>Mencapai Level 5</div>
                    </div>
                    <div style={{ flex: 1, textAlign: 'center', opacity: bestStreak >= 10 ? 1 : 0.4, filter: bestStreak >= 10 ? 'none' : 'grayscale(100%)', position: 'relative' }}>
                      {bestStreak < 10 && <div style={{ position: 'absolute', top: '-15px', right: '25px', fontSize: '24px' }}>🔒</div>}
                      <div style={{ fontSize: '55px', marginBottom: '15px', filter: bestStreak >= 10 ? 'drop-shadow(0 4px 6px rgba(0,0,0,0.2))' : 'none' }}>🔥</div>
                      <div style={{ fontSize: '16px', fontWeight: 'bold', color: colors.textDark }}>Raja Konsisten</div>
                      <div style={{ fontSize: '14px', color: colors.textMuted }}>Streak 10x Beruntun</div>
                    </div>
                    <div style={{ flex: 1, textAlign: 'center', opacity: totalXP >= 10000 ? 1 : 0.4, filter: totalXP >= 10000 ? 'none' : 'grayscale(100%)', position: 'relative' }}>
                      {totalXP < 10000 && <div style={{ position: 'absolute', top: '-15px', right: '25px', fontSize: '24px' }}>🔒</div>}
                      <div style={{ fontSize: '55px', marginBottom: '15px', filter: totalXP >= 10000 ? 'drop-shadow(0 4px 6px rgba(0,0,0,0.2))' : 'none' }}>✨</div>
                      <div style={{ fontSize: '16px', fontWeight: 'bold', color: colors.textDark }}>Kolektor XP</div>
                      <div style={{ fontSize: '14px', color: colors.textMuted }}>Kumpulkan 10.000 XP</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB KAMUS */}
        {activeTab === 'KAMUS' && (
          <div style={{ padding: '50px', overflowY: 'auto' }}>
            <Kamus onCobaGestur={onCobaGestur} />
          </div>
        )}

      </div>

      {/* === WIDGET KANAN (HANYA MUNCUL DI TAB BELAJAR) === */}
      {activeTab === 'BELAJAR' && (
        <div style={{ width: '440px', padding: '40px 40px 40px 0', display: 'flex', flexDirection: 'column', gap: '30px', zIndex: 10 }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '15px' }}>
            <StatsBadge icon="👑" label="Peringkat" value={`#${myRank}`} color={colors.accentGold} />
            <StatsBadge icon="🔥" label="Streak Benar" value={bestStreak} color={colors.accentRed} />
            <StatsBadge icon="✨" label="Total XP" value={totalXP} color={colors.accentBlue} />
          </div>

          <div style={{ backgroundColor: colors.cardBg, color: colors.textDark, borderRadius: '25px', padding: '30px 25px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
              <h3 style={{ margin: 0, letterSpacing: '1px', fontWeight: 'bold', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}><span>🏆</span> TOP 3 PERINGKAT</h3>
              <span onClick={() => setActiveTab('PERINGKAT')} style={{ fontSize: '12px', color: colors.buttonBg, cursor: 'pointer', fontWeight: 'bold' }}>LIHAT SEMUA</span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {isLoadingLeaderboard ? (
                <div style={{ textAlign: 'center', padding: '20px', color: colors.textMuted, fontStyle: 'italic' }}>Memuat data pemain... ⏳</div>
              ) : leaderboardData.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: colors.textMuted }}>Belum ada pemain.</div>
              ) : (
                leaderboardData.map((player) => (
                  <div key={player.id} style={{ display: 'flex', alignItems: 'center', gap: '15px', backgroundColor: player.isMe ? '#fdfbf9' : 'transparent', padding: player.isMe ? '12px' : '5px 12px', borderRadius: '15px', border: player.isMe ? `2px solid ${colors.buttonBg}` : 'none' }}>
                    <strong style={{ fontSize: '18px', color: player.rank === 1 ? colors.accentGold : '#9e9191', width: '25px', textAlign: 'center' }}>{player.rank}</strong>
                    <div style={{ fontSize: '26px' }}>{player.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold', fontSize: '16px', color: player.isMe ? colors.buttonBg : colors.textDark, textTransform: 'capitalize' }}>
                        {player.name} {player.isMe ? '(You)' : ''}
                      </div>
                      <div style={{ fontSize: '13px', color: '#9e9191', marginTop: '2px' }}>{player.xp} XP</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          <div style={{ backgroundColor: colors.cardBg, color: colors.textDark, borderRadius: '25px', padding: '30px 25px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 20px 0', letterSpacing: '1px', fontWeight: 'bold', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}><span>📈</span> PROGRES BELAJAR</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '15px', fontWeight: 'bold', color: '#555' }}>
              <span>Penyelesaian Target SIBI</span>
              <span style={{ color: colors.buttonBg }}>{progressPercent}%</span>
            </div>
            <div style={{ width: '100%', height: '14px', backgroundColor: '#e8e4e1', borderRadius: '7px', overflow: 'hidden', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)' }}>
               <div style={{ width: `${progressPercent}%`, height: '100%', backgroundColor: colors.buttonBg, transition: 'width 0.5s ease-in-out' }}></div>
            </div>
            <p style={{ fontSize: '14px', color: '#9e9191', marginTop: '18px', lineHeight: '1.5', fontStyle: 'italic' }}>
              {displayUnlockedLevel === 21 
                ? "Luar biasa! Kamu telah menguasai semua 21 level." 
                : `Kamu telah membuka ${displayUnlockedLevel} dari 21 level. Sedikit lagi menuju master SIBI!`}
            </p>
          </div>

        </div>
      )}

      {/* === MODAL KONFIRMASI LOGOUT === */}
      {showLogoutConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(5px)' }}>
          <div style={{ backgroundColor: colors.cardBg, padding: '40px', borderRadius: '30px', width: '400px', textAlign: 'center', boxShadow: '0 15px 35px rgba(0,0,0,0.5)' }}>
            <div style={{ fontSize: '60px', marginBottom: '10px' }}>🥺</div>
            <h2 style={{ color: colors.textDark, margin: '0 0 10px 0', fontSize: '28px' }}>Yakin mau keluar?</h2>
            <p style={{ color: colors.textMuted, fontSize: '16px', lineHeight: '1.5', marginBottom: '30px' }}>
              Progres dan <em>streak</em> harianmu sedang bagus lho. Apakah kamu benar-benar ingin berhenti belajar sekarang?
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <button 
                onClick={() => setShowLogoutConfirm(false)}
                style={{ padding: '15px', backgroundColor: colors.buttonBg, color: 'white', border: 'none', borderRadius: '15px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = colors.buttonHover}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = colors.buttonBg}
              >
                TIDAK, LANJUT BELAJAR!
              </button>
              <button 
                onClick={onLogout}
                style={{ padding: '15px', backgroundColor: 'transparent', color: colors.accentRed, border: `2px solid ${colors.accentRed}`, borderRadius: '15px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseOver={(e) => { e.currentTarget.style.backgroundColor = colors.accentRed; e.currentTarget.style.color = 'white'; }}
                onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = colors.accentRed; }}
              >
                Ya, Keluar Akun
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ==========================================
// KOMPONEN MODAL ONBOARDING (MUNCUL DI LEVEL 1)
// ==========================================
const TutorialModal = ({ onTutup }: { onTutup: () => void }) => {
  return (
    <div style={tutorialStyles.overlay}>
      <div style={tutorialStyles.modalBox}>
        <h2 style={tutorialStyles.title}>👋 Selamat Datang di SIBI Master!</h2>
        <div style={tutorialStyles.content}>
          <p style={{ marginBottom: '15px' }}>Sebelum masuk ke area kamera, yuk pahami aturan mainnya:</p>
          <ul style={tutorialStyles.list}>
            <li style={tutorialStyles.listItem}>
              📸 <strong>Izin Kamera:</strong> Sistem butuh akses kamera untuk melacak tanganmu. Tenang, videomu tidak akan disimpan!
            </li>
            <li style={tutorialStyles.listItem}>
              🎯 <strong>Target Gestur:</strong> Peragakan gestur sesuai huruf/kata yang muncul di layar dengan tepat.
            </li>
            <li style={tutorialStyles.listItem}>
              🔥 <strong>Skor & Streak:</strong> Jawab dengan cepat dan berturut-turut untuk mendapatkan bonus XP maksimal!
            </li>
            <li style={tutorialStyles.listItem}>
              📈 <strong>Naik Level:</strong> Akurasi tinggi menaikkan level, jika sering salah level akan otomatis disesuaikan (AGDL).
            </li>
          </ul>
        </div>
        <button 
          style={tutorialStyles.button} 
          onClick={onTutup} 
          onMouseOver={e => e.currentTarget.style.transform = 'scale(1.02)'} 
          onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          Saya Paham, Mulai Main! 🚀
        </button>
      </div>
    </div>
  );
};

const tutorialStyles: { [key: string]: React.CSSProperties } = {
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    zIndex: 9999, backdropFilter: 'blur(5px)'
  },
  modalBox: {
    backgroundColor: '#2e2626', color: '#ffffff', padding: '35px',
    borderRadius: '20px', maxWidth: '550px', width: '90%',
    boxShadow: '0 10px 40px rgba(0,0,0,0.6)', border: '2px solid #635353'
  },
  title: {
    marginTop: 0, color: '#f1c40f', borderBottom: '1px solid #635353',
    paddingBottom: '15px', textAlign: 'center', letterSpacing: '1px'
  },
  content: { lineHeight: '1.6', fontSize: '16px', color: '#e8e2da' },
  list: { paddingLeft: '0', display: 'flex', flexDirection: 'column', gap: '12px', listStyle: 'none', margin: 0 },
  listItem: { backgroundColor: 'rgba(255,255,255,0.05)', padding: '12px 15px', borderRadius: '10px', borderLeft: '4px solid #d98b8b' },
  button: {
    width: '100%', padding: '16px', marginTop: '25px',
    background: 'linear-gradient(135deg, #e69a9a 0%, #d98b8b 100%)',
    color: 'white', border: 'none', borderRadius: '12px',
    fontSize: '18px', fontWeight: 'bold', cursor: 'pointer',
    transition: 'all 0.2s', boxShadow: '0 4px 15px rgba(217, 139, 139, 0.4)'
  }
};