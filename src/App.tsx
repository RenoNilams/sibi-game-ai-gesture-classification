// src/App.tsx
import { useState, useEffect } from 'react';
import './App.css';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import Gameplay from './pages/Gameplay';
import Summary from './pages/Summary';
import Login from './pages/Login'; 
import { initModel } from './ml/onnxModel';

import { doc, updateDoc, collection, addDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth'; 
import { db, auth } from './firebase'; 

const getLevelData = (userName: string) => {
  const cleanName = userName ? userName.toUpperCase().replace(/[^A-Z]/g, '') : 'PEMAIN';
  const nameArray = cleanName.split('');
  if (nameArray.length === 0) nameArray.push('A'); 

  return [
    { level: 1, baru: ['A', 'B', 'C'], target: ['A', 'B', 'C', 'B', 'C'] },
    { level: 2, baru: ['D', 'E'], target: ['A', 'B', 'C', 'D', 'E'] },
    { level: 3, baru: ['F', 'G'], target: ['D', 'E', 'F', 'G', 'A'] },
    { level: 4, baru: ['H', 'I'], target: ['F', 'G', 'H', 'I', 'E'] },
    { level: 5, baru: ['J', 'K'], target: ['H', 'I', 'J', 'K', 'A'] },
    { level: 6, baru: ['L', 'M'], target: ['J', 'K', 'L', 'M', 'I'] },
    { level: 7, baru: ['N', 'O'], target: ['L', 'M', 'N', 'O', 'E'] },
    { level: 8, baru: ['P', 'Q'], target: ['N', 'O', 'P', 'Q', 'I'] },
    { level: 9, baru: ['R', 'S'], target: ['P', 'Q', 'R', 'S', 'O'] },
    { level: 10, baru: ['T', 'U'], target: ['R', 'S', 'T', 'U', 'A'] },
    { level: 11, baru: ['V', 'W'], target: ['T', 'U', 'V', 'W', 'O'] },
    { level: 12, baru: ['X', 'Y'], target: ['V', 'W', 'X', 'Y', 'U'] },
    { level: 13, baru: ['Z'], target: ['W', 'X', 'Y', 'Z', 'U'] },
    { level: 14, baru: [], target: ['Z', 'E', 'I', 'O', 'U'] },
    { level: 15, baru: ['Halo', 'Saya'], target: ['Halo', 'Saya', 'A', 'I', 'U'] },
    { level: 16, baru: ['Bagus', 'Sempurna'], target: ['Halo', 'Saya', 'Bagus', 'Sempurna', 'E'] },
    { level: 17, baru: ['Cinta', 'Teman'], target: ['Bagus', 'Sempurna', 'Cinta', 'Teman', 'O'] },
    { level: 18, baru: ['Nama', 'Rumah'], target: ['Cinta', 'Teman', 'Nama', 'Rumah', 'U'] },
    { level: 19, baru: ['Maaf', 'Bantu'], target: ['Maaf', 'Bantu', 'Nama', 'Rumah', 'I'] },
    { level: 20, baru: [], target: ['Maaf', 'Bantu', 'Halo', 'Teman', 'Nama'] },
    { level: 21, baru: [], target: ['Halo', 'Nama', 'Saya', ...nameArray] },
  ];
};

type AppState = 'LOGIN' | 'MENU' | 'TRIAL' | 'CHALLENGE' | 'SUMMARY' | 'PRACTICE';

function App() {
  const [isReady, setIsReady] = useState(false);
  const [appState, setAppState] = useState<AppState>('MENU');
  
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [unlockedLevel, setUnlockedLevel] = useState(() => {
    const saved = localStorage.getItem('sibi_unlockedLevel');
    return saved ? parseInt(saved) : 1;
  });
  
  const [activeLevel, setActiveLevel] = useState(1);
  
  const [totalXP, setTotalXP] = useState(() => {
    const saved = localStorage.getItem('sibi_totalXP');
    return saved ? parseInt(saved) : 0;
  });
  
  const [bestStreak, setBestStreak] = useState(() => {
    const saved = localStorage.getItem('sibi_bestStreak');
    return saved ? parseInt(saved) : 0;
  });

  const [currentGlobalStreak, setCurrentGlobalStreak] = useState(() => {
    const saved = localStorage.getItem('sibi_currentStreak');
    return saved ? parseInt(saved) : 0;
  });

  const [summaryData, setSummaryData] = useState<any>(null);
  const [practiceTarget, setPracticeTarget] = useState<string | null>(null);
  const [dashboardTab, setDashboardTab] = useState<'BELAJAR' | 'PERINGKAT' | 'PROFIL' | 'KAMUS'>('BELAJAR');

  useEffect(() => { localStorage.setItem('sibi_unlockedLevel', unlockedLevel.toString()); }, [unlockedLevel]);
  useEffect(() => { localStorage.setItem('sibi_totalXP', totalXP.toString()); }, [totalXP]);
  useEffect(() => { localStorage.setItem('sibi_bestStreak', bestStreak.toString()); }, [bestStreak]);
  useEffect(() => { localStorage.setItem('sibi_currentStreak', currentGlobalStreak.toString()); }, [currentGlobalStreak]);

  useEffect(() => {
    async function setup() {
      try {
        await initModel(); 
        setIsReady(true);
      } catch (err) {
        console.error("Gagal memuat AI:", err);
      }
    }
    setup();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setUnlockedLevel(1);
      setTotalXP(0);
      setBestStreak(0);
      setCurrentGlobalStreak(0); 
      setAppState('LOGIN');
      setDashboardTab('BELAJAR');
    } catch (error) {
      console.error("Gagal Logout:", error);
    }
  };

  const dynamicLevelData = getLevelData(currentUser?.name || "");

  const handleMulaiLevel = (targetLevel: number) => {
    setActiveLevel(targetLevel);
    const gesturBaru = dynamicLevelData[targetLevel - 1]?.baru || [];
    setAppState(gesturBaru.length > 0 ? 'TRIAL' : 'CHALLENGE');
  };

  const handleSesiSelesai = async (benar: number, salah: number, waktuTotal: number, maxSessionStreak: number, bonusXP: number, finalGlobalStreak: number, maxGlobalStreak: number) => {
    const totalSoal = benar + salah;
    const akurasi = totalSoal === 0 ? 0 : (benar / totalSoal) * 100;
    const avgTime = totalSoal > 0 ? waktuTotal / totalSoal : 0;

    const baseScore = benar * 50; 
    const streakBonus = maxSessionStreak * 10; 
    const speedBonus = bonusXP; 

    const scoreSesi = baseScore + streakBonus + speedBonus;

    const MAX_LEVEL = 21; 
    let statusLevel: 'LEVEL UP' | 'MAINTAIN' | 'LEVEL DOWN' = 'MAINTAIN';
    let nextActiveLevel = activeLevel;
    let nextUnlockedLevel = unlockedLevel;
    let isTamatSesiIni = false;

    if (akurasi >= 80) {
      if (activeLevel >= MAX_LEVEL) {
        statusLevel = 'LEVEL UP'; 
        nextActiveLevel = MAX_LEVEL; 
        nextUnlockedLevel = MAX_LEVEL; 
        isTamatSesiIni = true;
      } else {
        statusLevel = 'LEVEL UP';
        nextActiveLevel = activeLevel + 1;
        if (nextActiveLevel > unlockedLevel) {
          nextUnlockedLevel = nextActiveLevel;
        }
      }
    } else if (akurasi < 50) { 
      statusLevel = 'LEVEL DOWN';
      nextActiveLevel = Math.max(1, activeLevel - 1);
    } 

    nextUnlockedLevel = Math.min(MAX_LEVEL, nextUnlockedLevel);

    const newTotalXP = totalXP + scoreSesi;
    const newBestStreak = Math.max(bestStreak, maxGlobalStreak);
    const newCurrentGlobalStreak = finalGlobalStreak;

    // AMBIL KARTU HANYA DARI 3 LEVEL TERAKHIR (Perbaikan Kilas Balik)
    const isMilestone = activeLevel % 3 === 0; 
    const materiDikuasai = dynamicLevelData.slice(Math.max(0, activeLevel - 3), activeLevel).flatMap(lvl => lvl.baru);

    if (currentUser) {
      try {
        const userRef = doc(db, "users", currentUser.uid);
        await updateDoc(userRef, {
          totalXP: newTotalXP,
          unlockedLevel: nextUnlockedLevel, 
          bestStreak: newBestStreak,
          currentStreak: newCurrentGlobalStreak 
        });

        await addDoc(collection(db, "sessions"), {
          userId: currentUser.uid,
          userName: currentUser.name || "Anonim",
          levelMateri: activeLevel,
          akurasi: Math.round(akurasi),
          waktuRataRata: parseFloat(avgTime.toFixed(2)),
          streakDicapai: maxGlobalStreak, 
          xpDidapat: scoreSesi,
          keputusanAGDL: isTamatSesiIni ? "TAMAT" : statusLevel,
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        console.error("Gagal menyimpan ke cloud:", error);
      }
    }

    setSummaryData({ 
      levelSaatIni: activeLevel,
      levelTujuan: nextActiveLevel,
      akurasi, baseScore, streakBonus, speedBonus, scoreSesi: scoreSesi, statusLevel, avgTime,
      currentStreak: finalGlobalStreak, 
      bestStreak: newBestStreak,        
      totalXPSaatIni: totalXP,
      isTamat: isTamatSesiIni,
      isMilestone: isMilestone,
      materiDikuasai: materiDikuasai 
    });

    setBestStreak(newBestStreak);
    setCurrentGlobalStreak(newCurrentGlobalStreak); 
    setTotalXP(newTotalXP);
    setActiveLevel(nextActiveLevel);
    setUnlockedLevel(nextUnlockedLevel);
    setAppState('SUMMARY');
  };

  const currentLevelData = dynamicLevelData[activeLevel - 1] || dynamicLevelData[0];

  if (!isReady) {
    return (
      <div style={{ height: '100vh', width: '100vw', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#3d3d3d', color: '#d1ccc0', fontFamily: '"Comic Sans MS", sans-serif' }}>
        <h2>Membangunkan AI SIBI Master... 🤖</h2>
      </div>
    );
  }

  if (appState === 'LOGIN') {
    return <Login onLoginSuccess={(userData) => {
      setCurrentUser(userData); 
      if (userData.unlockedLevel) setUnlockedLevel(Math.min(21, userData.unlockedLevel)); 
      if (userData.totalXP !== undefined) setTotalXP(userData.totalXP);
      if (userData.bestStreak !== undefined) setBestStreak(userData.bestStreak);
      if (userData.currentStreak !== undefined) setCurrentGlobalStreak(userData.currentStreak);
      setAppState('MENU'); 
    }} />;
  }

  if (appState === 'MENU') {
    if (currentUser?.role === 'admin') {
      return <AdminDashboard adminName={currentUser?.name || "Admin"} onLogout={handleLogout} />;
    }
    return (
      <Dashboard 
        unlockedLevel={unlockedLevel} totalXP={totalXP} bestStreak={bestStreak} userName={currentUser?.name || "Pengguna"} userId={currentUser?.uid}
        initialTab={dashboardTab} 
        onMulaiLevel={(lvl) => { setDashboardTab('BELAJAR'); handleMulaiLevel(lvl); }} 
        onCobaGestur={(gesturId) => { setPracticeTarget(gesturId); setAppState('PRACTICE'); }} 
        onLogout={handleLogout} 
      />
    );
  }

  if (appState === 'PRACTICE' && practiceTarget) {
    return (
      <Gameplay 
        key={`practice-${practiceTarget}`} userLevel={activeLevel} isTrial={true} isPractice={true} targetArray={[practiceTarget]} 
        onLanjutUjian={() => {}} 
        onSesiSelesai={() => { setPracticeTarget(null); setDashboardTab('KAMUS'); setAppState('MENU'); }}
        onKembali={() => { setPracticeTarget(null); setDashboardTab('KAMUS'); setAppState('MENU'); }}
      />
    );
  }

  if (appState === 'TRIAL' || appState === 'CHALLENGE') {
    return (
      <Gameplay 
        key={appState} userLevel={activeLevel} isTrial={appState === 'TRIAL'}
        initialStreak={appState === 'CHALLENGE' ? currentGlobalStreak : 0}
        targetArray={appState === 'TRIAL' ? currentLevelData.baru : currentLevelData.target}
        onLanjutUjian={() => setAppState('CHALLENGE')}
        onSesiSelesai={(benar, salah, waktuTotal, maxSessionStreak, bonusXP, finalGlobalStreak, maxGlobalStreak) => 
          handleSesiSelesai(benar, salah, waktuTotal, maxSessionStreak, bonusXP, finalGlobalStreak, maxGlobalStreak)
        }
        onKembali={() => { setDashboardTab('BELAJAR'); setAppState('MENU'); }}
      />
    );
  }

  if (appState === 'SUMMARY' && summaryData) {
    return (
      <Summary 
        levelSaatIni={summaryData.levelSaatIni} levelTujuan={summaryData.levelTujuan} akurasi={summaryData.akurasi} baseScore={summaryData.baseScore} streakBonus={summaryData.streakBonus} speedBonus={summaryData.speedBonus} scoreSesi={summaryData.scoreSesi} statusLevel={summaryData.statusLevel} avgTime={summaryData.avgTime} currentStreak={summaryData.currentStreak} bestStreak={summaryData.bestStreak} totalXPSaatIni={summaryData.totalXPSaatIni} isTamat={summaryData.isTamat}
        isMilestone={summaryData.isMilestone} 
        materiDikuasai={summaryData.materiDikuasai} 
        onLanjut={() => handleMulaiLevel(summaryData.levelTujuan)}
        onUlangi={() => handleMulaiLevel(summaryData.levelSaatIni)}
        onKembali={() => { setDashboardTab('BELAJAR'); setAppState('MENU'); }}
        onBukaKamus={() => { setDashboardTab('KAMUS'); setAppState('MENU'); }}
      />
    );
  }

  return null;
}

export default App;