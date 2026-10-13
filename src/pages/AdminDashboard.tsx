// src/pages/AdminDashboard.tsx
import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

interface AdminDashboardProps {
  adminName: string;
  onLogout: () => void;
}

export default function AdminDashboard({ adminName, onLogout }: AdminDashboardProps) {
  const [usersList, setUsersList] = useState<any[]>([]);
  const [recentSessions, setRecentSessions] = useState<any[]>([]);
  const [allSessionsForCSV, setAllSessionsForCSV] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'STATISTIK' | 'PERINGKAT' | 'KELOLA'>('STATISTIK');

  // Palet Warna Senada
  const colors = {
    sidebarBg: '#2e2626', mainBg: '#3b3131', menuActiveBg: '#4a3f3f',
    buttonBg: '#d98b8b', buttonHover: '#e69a9a',
    cardBg: '#fff8f0', textLight: '#ffffff', textMuted: '#c4b5b5', textDark: '#4a3f3f',
    accentRed: '#e74c3c', accentGold: '#f1c40f', accentBlue: '#3498db', accentGreen: '#2ecc71',
    accentOrange: '#e67e22'
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Ambil Data Pengguna
      const usersSnapshot = await getDocs(collection(db, "users"));
      const users: any[] = [];
      usersSnapshot.forEach((doc) => {
        users.push({ id: doc.id, ...doc.data() });
      });
      setUsersList(users);

      // Ambil Data Log Sesi 
      const sessionQuery = query(collection(db, "sessions"), orderBy("timestamp", "desc"));
      const sessionSnapshot = await getDocs(sessionQuery);
      const sessions: any[] = [];
      sessionSnapshot.forEach((doc) => {
        sessions.push({ id: doc.id, ...doc.data() });
      });
      setAllSessionsForCSV(sessions);
      setRecentSessions(sessions.slice(0, 50)); // Batasi 50 untuk UI

    } catch (error) {
      console.error("Gagal mengambil data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- FUNGSI MODERASI PENGGUNA ---
  const handleEditName = async (userId: string, currentName: string) => {
    const newName = prompt(`Masukkan nama baru untuk pengguna "${currentName}":`, currentName);
    if (newName && newName.trim() !== "" && newName !== currentName) {
      try {
        await updateDoc(doc(db, "users", userId), { name: newName });
        alert("Nama berhasil diubah!");
        fetchData(); 
      } catch (error) {
        alert("Gagal mengubah nama.");
      }
    }
  };

  const handleToggleBan = async (userId: string, currentBanStatus: boolean) => {
    const action = currentBanStatus ? "membuka blokir" : "memblokir";
    const confirmAction = window.confirm(`Apakah Anda yakin ingin ${action} akun ini?`);
    if (confirmAction) {
      try {
        await updateDoc(doc(db, "users", userId), { isBanned: !currentBanStatus });
        alert(`Akun berhasil di-${currentBanStatus ? 'buka blokir' : 'blokir'}!`);
        fetchData(); 
      } catch (error) {
        alert(`Gagal ${action} akun.`);
      }
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    const confirmAction = window.confirm(`PERINGATAN KERAS!\nApakah Anda yakin ingin menghapus permanen akun "${userName}" beserta seluruh datanya? Tindakan ini tidak dapat dibatalkan.`);
    if (confirmAction) {
      try {
        await deleteDoc(doc(db, "users", userId));
        alert(`Akun "${userName}" berhasil dihapus dari database.`);
        fetchData(); 
      } catch (error) {
        alert("Gagal menghapus akun.");
      }
    }
  };

  // --- FUNGSI EXPORT CSV ---
  const handleExportCSV = () => {
    if (allSessionsForCSV.length === 0) {
      alert("Belum ada data permainan untuk diekspor!");
      return;
    }
    const headers = [
      "ID Sesi", "ID User", "Nama Pengguna", "Level Materi", 
      "Akurasi (%)", "Waktu Rata-rata (s)", "Streak Dicapai", 
      "XP Didapat", "Keputusan AGDL", "Waktu Pelaksanaan"
    ];
    const rows = allSessionsForCSV.map(s => [
      s.id, s.userId, `"${s.userName}"`, s.levelMateri, s.akurasi, 
      s.waktuRataRata, s.streakDicapai, s.xpDidapat, s.keputusanAGDL, 
      `"${new Date(s.timestamp).toLocaleString('id-ID')}"`
    ]);
    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Log_Penelitian_SIBI_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- KALKULASI STATISTIK ---
  const regularUsers = usersList.filter(user => user.role !== 'admin');
  const totalUsers = regularUsers.length;
  const sortedByXP = [...regularUsers].sort((a, b) => (b.totalXP || 0) - (a.totalXP || 0));
  const topPlayer = sortedByXP.length > 0 ? sortedByXP[0] : null;
  const sortedByStreak = [...regularUsers].sort((a, b) => (b.bestStreak || 0) - (a.bestStreak || 0));
  const highestStreakUser = sortedByStreak.length > 0 ? sortedByStreak[0] : null;

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', backgroundColor: colors.mainBg, color: colors.textLight, fontFamily: '"Comic Sans MS", "Chalkboard SE", sans-serif' }}>
      
      {/* SIDEBAR ADMIN */}
      <div style={{ width: '260px', backgroundColor: colors.sidebarBg, display: 'flex', flexDirection: 'column', padding: '40px 0', borderRight: '1px solid #1a1a1a', zIndex: 10, boxShadow: '4px 0 15px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', paddingLeft: '35px', marginBottom: '50px' }}>
          <span style={{ fontSize: '30px' }}>🛡️</span>
          <h1 style={{ fontSize: '24px', margin: 0, fontWeight: 'bold', color: colors.accentGold }}>Admin Area</h1>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div onClick={() => setActiveTab('STATISTIK')} style={{ backgroundColor: activeTab === 'STATISTIK' ? colors.menuActiveBg : 'transparent', padding: '15px 35px', borderTopRightRadius: '25px', borderBottomRightRadius: '25px', display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer', width: '85%', borderLeft: activeTab === 'STATISTIK' ? `4px solid ${colors.accentGold}` : '4px solid transparent', transition: 'all 0.3s' }}>
            <span style={{ fontSize: '20px', opacity: activeTab === 'STATISTIK' ? 1 : 0.5 }}>📈</span>
            <span style={{ fontSize: '16px', fontWeight: 'bold', color: activeTab === 'STATISTIK' ? colors.accentGold : colors.textMuted }}>Dashboard</span>
          </div>
          <div onClick={() => setActiveTab('PERINGKAT')} style={{ backgroundColor: activeTab === 'PERINGKAT' ? colors.menuActiveBg : 'transparent', padding: '15px 35px', borderTopRightRadius: '25px', borderBottomRightRadius: '25px', display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer', width: '85%', borderLeft: activeTab === 'PERINGKAT' ? `4px solid ${colors.accentGold}` : '4px solid transparent', transition: 'all 0.3s' }}>
            <span style={{ fontSize: '20px', opacity: activeTab === 'PERINGKAT' ? 1 : 0.5 }}>🏆</span>
            <span style={{ fontSize: '16px', fontWeight: 'bold', color: activeTab === 'PERINGKAT' ? colors.accentGold : colors.textMuted }}>Peringkat</span>
          </div>
          <div onClick={() => setActiveTab('KELOLA')} style={{ backgroundColor: activeTab === 'KELOLA' ? colors.menuActiveBg : 'transparent', padding: '15px 35px', borderTopRightRadius: '25px', borderBottomRightRadius: '25px', display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer', width: '85%', borderLeft: activeTab === 'KELOLA' ? `4px solid ${colors.accentGold}` : '4px solid transparent', transition: 'all 0.3s' }}>
            <span style={{ fontSize: '20px', opacity: activeTab === 'KELOLA' ? 1 : 0.5 }}>👥</span>
            <span style={{ fontSize: '16px', fontWeight: 'bold', color: activeTab === 'KELOLA' ? colors.accentGold : colors.textMuted }}>Kelola Pengguna</span>
          </div>
        </div>

        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '15px', paddingBottom: '25px' }}>
          <div onClick={onLogout} style={{ padding: '15px 35px', display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer', opacity: 0.7, transition: 'all 0.2s' }} onMouseOver={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = colors.accentRed; }} onMouseOut={(e) => { e.currentTarget.style.opacity = '0.7'; e.currentTarget.style.color = colors.textLight; }}>
            <span style={{ fontSize: '20px' }}>🚪</span>
            <span style={{ fontSize: '16px', fontWeight: 'bold' }}>KELUAR</span>
          </div>
        </div>
      </div>

      {/* KONTEN UTAMA */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '40px 50px', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '30px' }}>
          <div>
            <h1 style={{ fontSize: '36px', margin: '0 0 5px 0', color: colors.cardBg, display: 'flex', alignItems: 'center', gap: '10px' }}>
              Portal Administrator ⚙️
            </h1>
            <h2 style={{ fontSize: '18px', margin: 0, fontWeight: 'normal', color: colors.textMuted, textTransform: 'capitalize' }}>
              Selamat bertugas, {adminName}.
            </h2>
          </div>
          
          <button 
            onClick={handleExportCSV}
            disabled={isLoading || allSessionsForCSV.length === 0}
            style={{ backgroundColor: colors.accentGreen, color: 'white', border: 'none', padding: '12px 25px', borderRadius: '15px', fontSize: '14px', fontWeight: 'bold', cursor: (isLoading || allSessionsForCSV.length===0) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 4px 10px rgba(46, 204, 113, 0.3)', opacity: (isLoading || allSessionsForCSV.length===0) ? 0.5 : 1, transition: 'all 0.2s' }}
            onMouseOver={(e) => { if (!isLoading && allSessionsForCSV.length > 0) e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseOut={(e) => { if (!isLoading && allSessionsForCSV.length > 0) e.currentTarget.style.transform = 'translateY(0)' }}
          >
            <span style={{ fontSize: '18px' }}>📥</span> UNDUH DATA LOG (CSV)
          </button>
        </div>

        {isLoading ? (
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '20px', fontWeight: 'bold', color: colors.textMuted }}>
            Sinkronisasi data... ⏳
          </div>
        ) : (
          <>
            {/* VIEW 1: STATISTIK & LOG PERMAINAN */}
            {activeTab === 'STATISTIK' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', flex: 1, overflow: 'hidden' }}>
                <div style={{ display: 'flex', gap: '20px', flexShrink: 0 }}>
                  
                  {/* KLIKABLE: Ke Kelola Pengguna */}
                  <div 
                    onClick={() => setActiveTab('KELOLA')}
                    style={{ flex: 1, backgroundColor: colors.cardBg, color: colors.textDark, padding: '25px', borderRadius: '20px', boxShadow: '0 8px 20px rgba(0,0,0,0.15)', borderBottom: `5px solid ${colors.accentBlue}`, cursor: 'pointer', transition: 'transform 0.2s' }}
                    onMouseOver={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                    onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                    title="Klik untuk mengelola akun"
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <div style={{ fontSize: '14px', fontWeight: 'bold', color: colors.textMuted, textTransform: 'uppercase' }}>Total Pengguna</div>
                      <span style={{ fontSize: '12px', color: colors.accentBlue, fontWeight: 'bold' }}>Kelola Akun ➔</span>
                    </div>
                    <div style={{ fontSize: '36px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <span>👥</span> {totalUsers} <span style={{ fontSize: '16px', fontWeight: 'normal', color: colors.textMuted }}>Akun</span>
                    </div>
                  </div>
                  
                  {/* KLIKABLE: Shortcut ke Leaderboard */}
                  <div 
                    onClick={() => setActiveTab('PERINGKAT')}
                    style={{ flex: 1, backgroundColor: colors.cardBg, color: colors.textDark, padding: '25px', borderRadius: '20px', boxShadow: '0 8px 20px rgba(0,0,0,0.15)', borderBottom: `5px solid ${colors.accentGold}`, cursor: 'pointer', transition: 'transform 0.2s' }}
                    onMouseOver={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                    onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                    title="Klik untuk melihat klasemen lengkap"
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <div style={{ fontSize: '14px', fontWeight: 'bold', color: colors.textMuted, textTransform: 'uppercase' }}>Peringkat #1 Global</div>
                      <span style={{ fontSize: '12px', color: colors.accentGold, fontWeight: 'bold' }}>Lihat Klasemen ➔</span>
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px', textTransform: 'capitalize' }}>
                      <span>👑</span> {topPlayer?.name || '-'}
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                         <span style={{ fontSize: '14px', color: colors.buttonBg, textTransform: 'none' }}>{topPlayer?.totalXP || 0} XP</span>
                      </div>
                    </div>
                  </div>

                  {/* TIDAK KLIKABLE: Hanya Info Streak */}
                  <div style={{ flex: 1, backgroundColor: colors.cardBg, color: colors.textDark, padding: '25px', borderRadius: '20px', boxShadow: '0 8px 20px rgba(0,0,0,0.15)', borderBottom: `5px solid ${colors.accentOrange}` }}>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: colors.textMuted, marginBottom: '10px', textTransform: 'uppercase' }}>Rekor Streak Tertinggi</div>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span>🔥</span> {highestStreakUser?.bestStreak || 0} 
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                         <span style={{ fontSize: '12px', color: colors.buttonBg, textTransform: 'capitalize' }}>Oleh: {highestStreakUser?.name || '-'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* TABEL LOG YANG DIBATASI */}
                <div style={{ flex: 1, backgroundColor: colors.cardBg, borderRadius: '25px', padding: '30px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', color: colors.textDark, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexShrink: 0 }}>
                    <h3 style={{ margin: 0, fontSize: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span>📋</span> Histori 50 Aktivitas Terakhir
                    </h3>
                    <span style={{ fontSize: '12px', color: colors.textMuted, fontWeight: 'bold' }}>Total Record: {allSessionsForCSV.length}</span>
                  </div>
                  
                  <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#fdfbf9', borderRadius: '15px', border: '1px solid #e8e2da' }}>
                    {recentSessions.length === 0 ? (
                      <div style={{ padding: '20px', textAlign: 'center', color: colors.textMuted, fontStyle: 'italic', marginTop: '20px' }}>Belum ada histori permainan.</div>
                    ) : (
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ backgroundColor: '#f2ece4', position: 'sticky', top: 0, zIndex: 1 }}>
                          <tr>
                            <th style={{ padding: '12px 20px', fontSize: '13px', color: '#8a7979' }}>Pengguna</th>
                            <th style={{ padding: '12px 20px', fontSize: '13px', color: '#8a7979' }}>Waktu</th>
                            <th style={{ padding: '12px 20px', fontSize: '13px', color: '#8a7979' }}>Lvl</th>
                            <th style={{ padding: '12px 20px', fontSize: '13px', color: '#8a7979' }}>Akurasi</th>
                            <th style={{ padding: '12px 20px', fontSize: '13px', color: '#8a7979' }}>AGDL</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentSessions.map((s, idx) => (
                            <tr key={s.id} style={{ borderBottom: '1px solid #f2ece4', backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.01)' }}>
                              <td style={{ padding: '12px 20px', fontWeight: 'bold', textTransform: 'capitalize' }}>{s.userName}</td>
                              <td style={{ padding: '12px 20px', fontSize: '12px', color: colors.textMuted }}>{new Date(s.timestamp).toLocaleString('id-ID', {day: '2-digit', month: 'short', hour: '2-digit', minute:'2-digit'})}</td>
                              <td style={{ padding: '12px 20px', fontWeight: 'bold', color: colors.buttonBg }}>{s.levelMateri}</td>
                              <td style={{ padding: '12px 20px', fontWeight: 'bold', color: s.akurasi >= 80 ? colors.accentGreen : s.akurasi < 50 ? colors.accentRed : colors.accentGold }}>{s.akurasi}%</td>
                              <td style={{ padding: '12px 20px' }}>
                                <span style={{ fontSize: '11px', fontWeight: 'bold', padding: '4px 8px', borderRadius: '8px', backgroundColor: s.keputusanAGDL === 'LEVEL UP' || s.keputusanAGDL === 'TAMAT' ? '#d4efdf' : s.keputusanAGDL === 'LEVEL DOWN' ? '#fadbd8' : '#fcf3cf', color: s.keputusanAGDL === 'LEVEL UP' || s.keputusanAGDL === 'TAMAT' ? colors.accentGreen : s.keputusanAGDL === 'LEVEL DOWN' ? colors.accentRed : '#d4ac0d' }}>
                                  {s.keputusanAGDL}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 2: LEADERBOARD (PAPAN PERINGKAT LENGKAP) */}
            {activeTab === 'PERINGKAT' && (
              <div style={{ backgroundColor: colors.cardBg, borderRadius: '25px', padding: '40px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', color: colors.textDark, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                
                <div style={{ width: '100%', maxWidth: '800px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px' }}>
                  <div>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '28px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      🏆 Klasemen Pengguna
                    </h3>
                    <p style={{ margin: 0, color: colors.textMuted, fontSize: '15px' }}>
                      Peringkat berdasarkan akumulasi Experience (XP) terbanyak.
                    </p>
                  </div>
                  <button onClick={() => setActiveTab('STATISTIK')} style={{ background: '#f2ece4', border: 'none', padding: '10px 20px', borderRadius: '15px', color: colors.textDark, cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#e8e2da'} onMouseOut={e => e.currentTarget.style.backgroundColor = '#f2ece4'}>
                    ⬅️ Kembali
                  </button>
                </div>
                
                {sortedByXP.length === 0 ? (
                  <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', color: colors.textMuted, fontStyle: 'italic', fontSize: '18px' }}>
                    Belum ada data pemain untuk diurutkan.
                  </div>
                ) : (
                  <div style={{ width: '100%', maxWidth: '800px', flex: 1, overflowY: 'auto', paddingRight: '10px', paddingBottom: '20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      {sortedByXP.map((player, index) => (
                        <div 
                          key={player.id} 
                          style={{ 
                            display: 'flex', alignItems: 'center', gap: '20px', 
                            backgroundColor: index === 0 ? '#fff8cc' : index === 1 ? '#f5f7f8' : index === 2 ? '#fdf3e8' : '#ffffff', 
                            padding: '20px 30px', borderRadius: '20px', 
                            border: index === 0 ? `2px solid ${colors.accentGold}` : index === 1 ? '2px solid #bdc3c7' : index === 2 ? '2px solid #cd7f32' : '2px solid #f2ece4', 
                            boxShadow: index <= 2 ? '0 8px 20px rgba(0,0,0,0.05)' : 'none', 
                            transition: 'transform 0.2s' 
                          }} 
                          onMouseOver={e => e.currentTarget.style.transform = 'scale(1.01)'} 
                          onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                        >
                          <strong style={{ fontSize: '30px', color: index === 0 ? colors.accentGold : index === 1 ? '#95a5a6' : index === 2 ? '#d35400' : colors.textMuted, width: '45px', textAlign: 'center', textShadow: index <= 2 ? '0 2px 4px rgba(0,0,0,0.1)' : 'none' }}>
                            #{index + 1}
                          </strong>
                          
                          <div style={{ width: '50px', height: '50px', backgroundColor: index === 0 ? colors.accentGold : index === 1 ? '#bdc3c7' : index === 2 ? '#cd7f32' : '#e8e2da', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '24px', boxShadow: 'inset 0 -3px 0 rgba(0,0,0,0.1)' }}>
                            {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '👤'}
                          </div>

                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <div style={{ fontWeight: 'bold', fontSize: '22px', textTransform: 'capitalize', color: colors.textDark }}>
                              {player.name}
                            </div>
                            <div style={{ fontSize: '14px', fontWeight: 'bold', color: colors.textMuted, display: 'flex', gap: '15px', marginTop: '4px' }}>
                              <span title="Level Maksimal" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>📚 Lvl {player.unlockedLevel || 1}</span>
                              <span title="Best Streak" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>🔥 {player.bestStreak || 0} Streak</span>
                            </div>
                          </div>
                          
                          <div style={{ fontSize: '26px', fontWeight: 'bold', color: colors.buttonBg, textAlign: 'right' }}>
                            {player.totalXP || 0} <span style={{ fontSize: '14px', color: colors.textMuted }}>XP</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* VIEW 3: TABEL MODERASI PENGGUNA */}
            {activeTab === 'KELOLA' && (
              <div style={{ backgroundColor: colors.cardBg, borderRadius: '25px', padding: '30px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', color: colors.textDark, flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '20px' }}>Daftar Seluruh Pengguna</h3>
                <div style={{ overflowY: 'auto', flex: 1 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                    <thead style={{ position: 'sticky', top: 0, backgroundColor: colors.cardBg, zIndex: 1 }}>
                      <tr style={{ borderBottom: `2px solid ${colors.textMuted}`, color: colors.textMuted }}>
                        <th style={{ padding: '15px', fontWeight: 'bold' }}>Nama Pengguna</th>
                        <th style={{ padding: '15px', fontWeight: 'bold' }}>Email</th>
                        <th style={{ padding: '15px', fontWeight: 'bold' }}>Lvl</th>
                        <th style={{ padding: '15px', fontWeight: 'bold' }}>XP</th>
                        <th style={{ padding: '15px', fontWeight: 'bold' }}>Status</th>
                        <th style={{ padding: '15px', fontWeight: 'bold', textAlign: 'center' }}>Aksi Moderasi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usersList.map((user) => (
                        <tr key={user.id} style={{ borderBottom: '1px solid #f2ece4', transition: 'background-color 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#fdfbf9'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                          <td style={{ padding: '15px', fontWeight: 'bold', textTransform: 'capitalize' }}>{user.name} {user.role === 'admin' && '🛡️'}</td>
                          <td style={{ padding: '15px', color: '#7f8c8d', fontSize: '14px' }}>{user.email}</td>
                          <td style={{ padding: '15px' }}>{user.role === 'admin' ? '-' : (user.unlockedLevel || 1)}</td>
                          <td style={{ padding: '15px', color: colors.buttonBg, fontWeight: 'bold' }}>{user.role === 'admin' ? '-' : (user.totalXP || 0)}</td>
                          <td style={{ padding: '15px' }}>
                            <span style={{ padding: '5px 10px', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold', backgroundColor: user.isBanned ? '#fadbd8' : '#d4efdf', color: user.isBanned ? '#c0392b' : '#27ae60' }}>
                              {user.isBanned ? 'DIBLOKIR' : 'AKTIF'}
                            </span>
                          </td>
                          <td style={{ padding: '15px', display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button onClick={() => handleEditName(user.id, user.name)} style={{ padding: '8px 12px', borderRadius: '10px', border: 'none', backgroundColor: '#3498db', color: 'white', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>EDIT</button>
                            {user.role !== 'admin' && (
                              <>
                                <button onClick={() => handleToggleBan(user.id, user.isBanned)} style={{ padding: '8px 12px', borderRadius: '10px', border: 'none', backgroundColor: user.isBanned ? '#2ecc71' : '#f39c12', color: 'white', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>{user.isBanned ? 'BUKA' : 'BLOKIR'}</button>
                                <button onClick={() => handleDeleteUser(user.id, user.name)} style={{ padding: '8px 12px', borderRadius: '10px', border: 'none', backgroundColor: '#e74c3c', color: 'white', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>HAPUS</button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}