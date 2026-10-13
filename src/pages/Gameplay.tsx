// src/pages/Gameplay.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CameraCanvas } from '../components/CameraCanvas';
import { predictGesture } from '../ml/onnxModel';
import { getRealtimeFeedback } from '../ml/fingerFeedback';

const correctAudio = new Audio('/audio/correct.mp3'); correctAudio.preload = 'auto';
const timeoutAudio = new Audio('/audio/timeout.mp3'); timeoutAudio.preload = 'auto';
const countdownAudio = new Audio('/audio/countdown.mp3'); countdownAudio.preload = 'auto';
const startAudio = new Audio('/audio/start.mp3'); startAudio.preload = 'auto';

interface GameplayProps {
  userLevel: number;
  isTrial: boolean;
  isPractice?: boolean; 
  initialStreak?: number; 
  targetArray: string[];
  onSesiSelesai: (benar: number, salah: number, waktuTotal: number, maxSessionStreak: number, bonusXP: number, finalGlobalStreak: number, maxGlobalStreak: number) => void;
  onLanjutUjian: () => void;
  onKembali: () => void;
}

const HOLD_THRESHOLD = 15;
const WAKTU_MAKSIMAL = 15;
const STABILIZATION_FRAMES = 5; 

export default function Gameplay({ userLevel, isTrial, isPractice = false, initialStreak = 0, targetArray, onSesiSelesai, onLanjutUjian, onKembali }: GameplayProps) {
  const colors = {
    bgGradient: 'radial-gradient(circle at 50% 0%, #564747 0%, #2e2626 100%)',
    sidebarBg: '#2e2626',
    cardBg: '#fff8f0',         
    textLight: '#ffffff',
    textMuted: '#c4b5b5',
    textDark: '#4a3f3f',
    accentGold: '#f1c40f',
    accentGreen: '#27ae60', // <- Diubah ke Emerald Green yang lebih kalem
    accentRed: '#e74c3c',
    accentBlue: '#3498db',
    buttonBg: '#d98b8b',       
    buttonHover: '#e69a9a',
    buttonLocked: '#635353',
  };

  const [currentIndex, setCurrentIndex] = useState(0);
  const [sisaWaktu, setSisaWaktu] = useState(WAKTU_MAKSIMAL);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [tebakanAI, setTebakanAI] = useState("...");
  const [pesanKoreksi, setPesanKoreksi] = useState<string | null>(null);
  const [holdProgress, setHoldProgress] = useState(0);
  const [trialPassed, setTrialPassed] = useState(false);
  const [showMantap, setShowMantap] = useState(false);
  const [showTimeout, setShowTimeout] = useState(false);
  
  const [uiStats, setUiStats] = useState({ streak: initialStreak, bonusXP: 0 });
  const [isCameraReady, setIsCameraReady] = useState(false);

  const currentIndexRef = useRef(0);
  const sisaWaktuRef = useRef(WAKTU_MAKSIMAL);
  const isTransitioningRef = useRef(false);
  const isCameraReadyRef = useRef(false);
  
  const statsRef = useRef({ 
    correct: 0, wrong: 0, time: 0, 
    globalStreak: initialStreak, maxGlobalStreak: initialStreak,
    sessionStreak: 0, maxSessionStreak: 0, bonusXP: 0 
  });
  
  const holdCountRef = useRef(0);
  const isPredictingRef = useRef(false);
  const lastTebakanRef = useRef("...");
  
  const consecutiveLabelRef = useRef<string>("");
  const consecutiveCountRef = useRef<number>(0);

  useEffect(() => { currentIndexRef.current = currentIndex; }, [currentIndex]);
  useEffect(() => { sisaWaktuRef.current = sisaWaktu; }, [sisaWaktu]);
  useEffect(() => { isTransitioningRef.current = isTransitioning; }, [isTransitioning]);

  const playAudio = (type: 'correct' | 'timeout' | 'countdown' | 'start') => {
    let audio: HTMLAudioElement | null = null;
    if (type === 'correct') audio = correctAudio;
    else if (type === 'timeout') audio = timeoutAudio;
    else if (type === 'countdown') audio = countdownAudio;
    else if (type === 'start') audio = startAudio;

    if (audio) { audio.currentTime = 0; audio.volume = 0.6; audio.play().catch(e => console.log(e)); }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      playAudio('start');
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleUlangi = () => {
    playAudio('start');
    setHoldProgress(0);
    holdCountRef.current = 0;
    setTrialPassed(false);
    setPesanKoreksi("Mari kita coba sekali lagi!");
    setIsTransitioning(false);
    isTransitioningRef.current = false;
  };

  const handlePindahSoal = useCallback(() => {
    if (currentIndexRef.current + 1 < targetArray.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      if (isTrial) onLanjutUjian();
      else onSesiSelesai(
        statsRef.current.correct, statsRef.current.wrong, statsRef.current.time, 
        statsRef.current.maxSessionStreak, statsRef.current.bonusXP,
        statsRef.current.globalStreak, statsRef.current.maxGlobalStreak
      );
    }
  }, [targetArray.length, isTrial, onLanjutUjian, onSesiSelesai]);

  useEffect(() => {
    setIsTransitioning(false); isTransitioningRef.current = false;
    setShowMantap(false); setShowTimeout(false);
    setSisaWaktu(WAKTU_MAKSIMAL); setHoldProgress(0); holdCountRef.current = 0;
    setTrialPassed(false); setPesanKoreksi(null); 
    setTebakanAI("..."); lastTebakanRef.current = "...";
    consecutiveLabelRef.current = ""; consecutiveCountRef.current = 0; 
    countdownAudio.pause(); countdownAudio.currentTime = 0;
  }, [currentIndex]);

  useEffect(() => {
    if (isTrial || isTransitioning || !isCameraReady) return;
    const timer = setInterval(() => setSisaWaktu(prev => (prev <= 1 ? 0 : prev - 1)), 1000);
    return () => clearInterval(timer);
  }, [isTrial, isTransitioning, isCameraReady]);

  useEffect(() => { 
    if (!isTrial && !isTransitioningRef.current && isCameraReady && sisaWaktu === 5) playAudio('countdown'); 
  }, [sisaWaktu, isTrial, isCameraReady]);

  useEffect(() => {
    if (sisaWaktu === 0 && !isTransitioningRef.current && !isTrial && isCameraReady) {
      setIsTransitioning(true); isTransitioningRef.current = true; setShowTimeout(true); playAudio('timeout'); 
      statsRef.current.wrong += 1; 
      statsRef.current.globalStreak = 0; 
      statsRef.current.sessionStreak = 0;
      statsRef.current.time += WAKTU_MAKSIMAL;
      setUiStats({ streak: 0, bonusXP: statsRef.current.bonusXP }); 
      setTimeout(() => handlePindahSoal(), 1000);
    }
  }, [sisaWaktu, isTrial, isCameraReady, handlePindahSoal]);

  const handleLandmarks = useCallback(async (features: number[]) => {
    if (!isCameraReadyRef.current) { setIsCameraReady(true); isCameraReadyRef.current = true; }
    if (isTrial && trialPassed) return;
    if (isTransitioningRef.current || isPredictingRef.current || (!isTrial && sisaWaktuRef.current <= 0)) return;
    
    if (features.length !== 84) return;
    isPredictingRef.current = true;
    
    const soalSaatIni = targetArray[currentIndexRef.current] || "...";

    try {
      if (isTrial) setPesanKoreksi(getRealtimeFeedback(features, soalSaatIni));
      const { label } = await predictGesture(features);
      
      if (label === consecutiveLabelRef.current) consecutiveCountRef.current += 1;
      else { consecutiveLabelRef.current = label; consecutiveCountRef.current = 1; }

      if (consecutiveCountRef.current >= STABILIZATION_FRAMES) {
        if (label !== lastTebakanRef.current) { setTebakanAI(label); lastTebakanRef.current = label; }
      }

      if (label.toLowerCase() === soalSaatIni.toLowerCase()) {
        holdCountRef.current += 1;
        setHoldProgress(Math.min((holdCountRef.current / HOLD_THRESHOLD) * 100, 100));

        if (holdCountRef.current >= HOLD_THRESHOLD && !isTransitioningRef.current) {
          setIsTransitioning(true); isTransitioningRef.current = true; 
          countdownAudio.pause(); countdownAudio.currentTime = 0;
          playAudio('correct'); 
          
          if (isTrial) {
            setTrialPassed(true); 
            setPesanKoreksi(isPractice ? "Sempurna! Lanjut ke gestur berikutnya." : "Sempurna! Lanjut ke gestur berikutnya.");
            setIsTransitioning(false); isTransitioningRef.current = false;
          } else {
             setShowMantap(true); 
             const waktuTerpakai = WAKTU_MAKSIMAL - sisaWaktuRef.current;
             let bonus = 0;
             if (waktuTerpakai <= 5) bonus = 30; else if (waktuTerpakai <= 10) bonus = 15;
             
             statsRef.current.correct += 1; 
             statsRef.current.globalStreak += 1; 
             statsRef.current.sessionStreak += 1;
             statsRef.current.maxGlobalStreak = Math.max(statsRef.current.maxGlobalStreak, statsRef.current.globalStreak);
             statsRef.current.maxSessionStreak = Math.max(statsRef.current.maxSessionStreak, statsRef.current.sessionStreak);
             statsRef.current.bonusXP += bonus; 
             statsRef.current.time += waktuTerpakai;
             
             setUiStats({ streak: statsRef.current.globalStreak, bonusXP: statsRef.current.bonusXP });
             setTimeout(() => handlePindahSoal(), 1000); 
          }
        }
      } else {
        if (holdCountRef.current > 0) {
            holdCountRef.current = Math.max(0, holdCountRef.current - 1);
            setHoldProgress(Math.min((holdCountRef.current / HOLD_THRESHOLD) * 100, 100));
        }
      }
    } catch (error) { console.error(error); } finally { isPredictingRef.current = false; }
  }, [targetArray, isTrial, trialPassed, isPractice, handlePindahSoal]);

  const handleTombolPercobaan = () => {
    if (currentIndexRef.current + 1 < targetArray.length) handlePindahSoal();
    else { playAudio('start'); setTimeout(() => handlePindahSoal(), 300); }
  };

  const soalSaatIni = targetArray[currentIndex] || "...";

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', background: colors.bgGradient, color: colors.textLight, fontFamily: '"Comic Sans MS", "Chalkboard SE", "Marker Felt", sans-serif', overflow: 'hidden' }}>
      
      {/* 1. HEADER */}
      <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 40px', backgroundColor: colors.sidebarBg, borderBottom: '2px solid rgba(0,0,0,0.2)', zIndex: 10, boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}>
        <button onClick={onKembali} style={{ backgroundColor: 'transparent', color: colors.textMuted, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.8 }} onMouseOver={e => e.currentTarget.style.opacity = '1'} onMouseOut={e => e.currentTarget.style.opacity = '0.8'}>
          <span>⬅️</span> KEMBALI
        </button>
        <h2 style={{ margin: 0, letterSpacing: '1px', fontWeight: 'bold', color: colors.cardBg, display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isPractice ? "📚 LATIHAN MANDIRI" : (isTrial ? "🎓 MODE PERCOBAAN" : "⚔️ MODE TANTANGAN")} {isPractice ? "" : `- Level ${userLevel}`}
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', color: colors.textMuted }}>
           {!isPractice && <strong style={{ fontSize: '20px', color: colors.textLight }}>{currentIndex + 1} / {targetArray.length}</strong>}
           <div style={{ width: '12px', height: '12px', backgroundColor: isTrial ? colors.buttonBg : colors.accentGold, borderRadius: '50%', boxShadow: `0 0 10px ${isTrial ? colors.buttonBg : colors.accentGold}`}}></div>
        </div>
      </div>

      {/* 2. ARENA TENGAH */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '10px 40px' }}>
        <div style={{ display: 'flex', gap: '35px', justifyContent: 'center', alignItems: 'stretch', width: '100%', maxWidth: '1400px', height: '100%', maxHeight: '580px', minHeight: '400px' }}>
          
          {/* PANEL KIRI */}
          {isTrial ? (
            <div style={{ flex: 1.2, maxWidth: '720px', backgroundColor: colors.cardBg, borderRadius: '35px', padding: '30px 40px', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 15px 40px rgba(0,0,0,0.3)' }}>
              
              <div style={{ display: 'flex', flex: 1, gap: '30px', minHeight: 0, alignItems: 'center' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                  <div style={{ fontSize: '16px', color: '#978d8d', textTransform: 'uppercase', letterSpacing: '3px', fontWeight: 'bold', marginBottom: '15px' }}>Target Gestur</div>
                  <h1 style={{ fontSize: '100px', margin: 0, fontWeight: 'bold', color: colors.buttonBg, lineHeight: '1', textShadow: '0 4px 10px rgba(178, 132, 132, 0.4)', wordBreak: 'break-word' }}>
                    {soalSaatIni}
                  </h1>
                </div>

                {soalSaatIni !== "..." && (
                  <div style={{ height: '100%', aspectRatio: '3/4', backgroundColor: '#fdfbf9', borderRadius: '20px', overflow: 'hidden', border: `5px solid #e8e2da`, display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 8px 25px rgba(0,0,0,0.1)' }}>
                    <img 
                      src={`/kamus/${soalSaatIni}.jpg`} 
                      alt={`Panduan ${soalSaatIni}`} 
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                      onError={(e) => { e.currentTarget.src = `https://placehold.co/400x533/f2ece4/b28484?text=${soalSaatIni}&font=Montserrat`; }}
                    />
                  </div>
                )}
              </div>

              {/* AREA PROGRESS BAR & TOMBOL ULANGI */}
              <div style={{ width: '100%', padding: '0 10px', marginTop: '10px' }}>
                <div style={{ minHeight: '40px', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '8px' }}>
                  {trialPassed && <span style={{ color: colors.accentGreen, fontSize: '20px' }}>✅</span>}
                  <p style={{ color: trialPassed ? colors.buttonBg : '#8c7f7f', fontSize: '18px', lineHeight: '1.4', margin: 0, fontWeight: trialPassed ? 'bold' : '600' }}>
                    {pesanKoreksi || "Peragakan di depan kamera..."}
                  </p>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{ flex: 1, height: '24px', backgroundColor: '#e8e2da', borderRadius: '12px', overflow: 'hidden', boxShadow: 'inset 0 3px 6px rgba(0,0,0,0.15)' }}>
                     {/* PROGRESS BAR: Tetap gradien emas-ke-pink agar cantik dan konsisten */}
                     <div style={{ width: `${holdProgress}%`, height: '100%', background: `linear-gradient(90deg, ${colors.accentGold} 0%, ${colors.buttonBg} 100%)`, transition: 'width 0.1s linear' }}></div>
                  </div>
                  
                  {/* TOMBOL ULANGI BULAT KHUSUS (Dengan Border Putih & Glow Biru) */}
                  <button 
                    onClick={handleUlangi}
                    disabled={!trialPassed || !isCameraReady}
                    title="Ulangi Gestur Ini"
                    style={{ 
                      width: '45px', height: '45px', borderRadius: '50%', 
                      border: (trialPassed && isCameraReady) ? '2px solid white' : 'none',
                      backgroundColor: (trialPassed && isCameraReady) ? colors.accentBlue : colors.buttonLocked,
                      color: 'white', fontSize: '20px', cursor: (trialPassed && isCameraReady) ? 'pointer' : 'not-allowed',
                      display: 'flex', justifyContent: 'center', alignItems: 'center',
                      boxShadow: (trialPassed && isCameraReady) ? '0 6px 15px rgba(52, 152, 219, 0.5)' : 'none',
                      transition: 'all 0.2s', opacity: trialPassed ? 1 : 0.5, flexShrink: 0
                    }}
                    onMouseOver={e => { if(trialPassed && isCameraReady) { e.currentTarget.style.transform = 'rotate(-45deg) scale(1.1)'; } }}
                    onMouseOut={e => { if(trialPassed && isCameraReady) { e.currentTarget.style.transform = 'rotate(0deg) scale(1)'; } }}
                  >
                    🔁
                  </button>
                </div>
              </div>

            </div>
          ) : (
            <div style={{ width: '380px', flexShrink: 0, backgroundColor: colors.cardBg, borderRadius: '35px', padding: '35px', display: 'flex', flexDirection: 'column', boxShadow: '0 15px 40px rgba(0,0,0,0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', backgroundColor: '#ffffff', padding: '12px 20px', borderRadius: '15px', marginBottom: '25px', boxShadow: '0 4px 8px rgba(0,0,0,0.05)' }}>
                <div style={{ color: sisaWaktu <= 5 ? colors.accentRed : colors.accentGold, fontWeight: 'bold', fontSize: '18px' }}>⏱️ {sisaWaktu}s</div>
                <div style={{ color: colors.accentRed, fontWeight: 'bold', fontSize: '18px' }}>🔥 {uiStats.streak}</div>
                <div style={{ color: colors.accentBlue, fontWeight: 'bold', fontSize: '18px' }}>⚡ +{uiStats.bonusXP}</div>
              </div>
              <div style={{ textAlign: 'center', width: '100%', flexShrink: 0, marginTop: '20px' }}>
                <span style={{ fontSize: '14px', color: '#978d8d', textTransform: 'uppercase', letterSpacing: '3px', fontWeight: 'bold' }}>Target Gestur</span>
                <h1 style={{ fontSize: '90px', margin: '20px 0 30px 0', fontWeight: 'bold', color: colors.buttonBg, textShadow: `0 3px 6px rgba(178, 132, 132, 0.4)`, lineHeight: '1', wordBreak: 'break-word' }}>{soalSaatIni}</h1>
              </div>
              <div style={{ width: '100%', textAlign: 'center', flexShrink: 0, marginTop: 'auto' }}>
                <div style={{ width: '100%', height: '22px', backgroundColor: '#e8e2da', borderRadius: '11px', marginBottom: '15px', overflow: 'hidden', boxShadow: 'inset 0 3px 6px rgba(0,0,0,0.1)' }}>
                   <div style={{ width: `${holdProgress}%`, height: '100%', background: `linear-gradient(90deg, ${colors.accentGold} 0%, ${colors.buttonBg} 100%)`, transition: 'width 0.1s linear' }}></div>
                </div>
                <div style={{ minHeight: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <p style={{ color: '#8c7f7f', fontSize: '18px', fontWeight: 'bold', margin: 0 }}>
                    {isTransitioning ? "Memproses..." : "Peragakan secepat mungkin!"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* PANEL KANAN: KAMERA */}
          <div style={{ flex: 1, height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
            <div style={{ height: '100%', aspectRatio: '4/3', backgroundColor: '#000000', borderRadius: '35px', overflow: 'hidden', position: 'relative', border: `12px solid ${colors.cardBg}`, boxShadow: `0 0 0 6px ${colors.buttonBg}, 0 25px 50px rgba(0,0,0,0.6)`, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              
              <CameraCanvas onLandmarks={handleLandmarks} />
              
              {!isCameraReady && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.sidebarBg, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', zIndex: 15 }}>
                  <div style={{ fontSize: '50px', marginBottom: '15px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>⏳</div>
                  <h3 style={{ color: colors.cardBg, margin: 0, letterSpacing: '1px' }}>Mengaktifkan Kamera...</h3>
                  <p style={{ color: colors.textMuted, fontSize: '14px', marginTop: '5px' }}>Mohon izinkan akses kamera di browsermu.</p>
                </div>
              )}

              {(showMantap || showTimeout) && isCameraReady && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: showTimeout ? 'rgba(231, 76, 60, 0.85)' : 'rgba(217, 139, 139, 0.9)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10, backdropFilter: 'blur(5px)' }}>
                  <h1 style={{ color: 'white', fontSize: '70px', letterSpacing: '5px', textAlign: 'center', textShadow: '0 6px 15px rgba(0,0,0,0.3)' }}>
                    {showTimeout ? 'WAKTU HABIS!' : 'MANTAP!🌟'}
                  </h1>
                </div>
              )}

              {/* LENCANA "BENAR" PREMIUM (Emerald Green Kalem + Border Putih) */}
              {isTrial && trialPassed && !isTransitioning && isCameraReady && (
                 <div style={{ position: 'absolute', top: '20px', left: '20px', backgroundColor: 'rgba(39, 174, 96, 0.95)', border: '2px solid rgba(255,255,255,0.6)', padding: '8px 25px', borderRadius: '15px', color: 'white', fontWeight: 'bold', fontSize: '18px', boxShadow: '0 6px 20px rgba(0,0,0,0.3)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                   <span>✅</span> BENAR
                 </div>
              )}

              {isCameraReady && (
                <div style={{ position: 'absolute', bottom: '15px', right: '15px', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(54, 45, 45, 0.85)', backdropFilter: 'blur(8px)', color: colors.textLight, padding: '8px 20px', borderRadius: '20px', fontSize: '15px', border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 8px 20px rgba(0,0,0,0.3)' }}>
                  <span>🤖 AI melihat: <strong style={{ color: colors.buttonBg, textTransform: 'uppercase', fontSize: '18px', marginLeft: '5px' }}>{tebakanAI}</strong></span>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* 3. AREA KONTROL BAWAH (CTA) */}
      {isTrial && (
        <div style={{ flexShrink: 0, paddingBottom: '30px', display: 'flex', width: '100%', maxWidth: '1400px', margin: '0 auto', padding: '0 40px 30px 40px', alignItems: 'center', zIndex: 10 }}>
          
          {isPractice ? (
            <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
              <button 
                onClick={() => { playAudio('start'); setTimeout(() => onKembali(), 300); }}
                disabled={!trialPassed || !isCameraReady}
                style={{ padding: '18px 70px', fontSize: '20px', fontWeight: 'bold', borderRadius: '50px', cursor: (trialPassed && isCameraReady) ? 'pointer' : 'not-allowed', background: (trialPassed && isCameraReady) ? `linear-gradient(135deg, ${colors.buttonHover} 0%, ${colors.buttonBg} 100%)` : colors.buttonLocked, color: (trialPassed && isCameraReady) ? 'white' : '#8c8080', border: '2px solid #ffffff', transition: 'all 0.25s', fontFamily: 'inherit', boxShadow: (trialPassed && isCameraReady) ? `0 8px 25px rgba(217, 139, 139, 0.6), inset 0 4px 0 rgba(255,255,255,0.3)` : 'none' }}
              >
                SELESAI & KEMBALI 📖
              </button>
            </div>
          ) : (
            /* DESAIN LAYOUT NAVIGASI (Dengan Tombol Tengah Terracotta Glow) */
            <>
              {/* KOLOM KIRI: TOMBOL SEBELUMNYA */}
              <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }}>
                <button 
                  onClick={handlePrev}
                  disabled={currentIndex === 0 || !isCameraReady}
                  style={{ padding: '14px 25px', fontSize: '15px', fontWeight: 'bold', borderRadius: '25px', cursor: (currentIndex > 0 && isCameraReady) ? 'pointer' : 'not-allowed', backgroundColor: (currentIndex > 0 && isCameraReady) ? '#8a7979' : colors.buttonLocked, color: (currentIndex > 0 && isCameraReady) ? 'white' : '#8c8080', border: 'none', fontFamily: 'inherit', transition: 'all 0.2s', boxShadow: (currentIndex > 0 && isCameraReady) ? '0 6px 12px rgba(0,0,0,0.15)' : 'none' }}
                  onMouseOver={e => { if (currentIndex > 0 && isCameraReady) e.currentTarget.style.backgroundColor = '#9e8c8c'; }}
                  onMouseOut={e => { if (currentIndex > 0 && isCameraReady) e.currentTarget.style.backgroundColor = '#8a7979'; }}
                >
                  ⬅️ SEBELUMNYA
                </button>
              </div>

              {/* KOLOM TENGAH: TOMBOL LANJUTKAN / MULAI TANTANGAN (Gaya Lama yang Estetik) */}
              <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                <button 
                  onClick={handleTombolPercobaan}
                  disabled={!trialPassed || !isCameraReady}
                  style={{ 
                    padding: '18px 45px', fontSize: '18px', fontWeight: 'bold', borderRadius: '40px', 
                    cursor: (trialPassed && isCameraReady) ? 'pointer' : 'not-allowed', 
                    background: (trialPassed && isCameraReady) ? `linear-gradient(135deg, ${colors.buttonHover} 0%, ${colors.buttonBg} 100%)` : colors.buttonLocked, 
                    color: (trialPassed && isCameraReady) ? 'white' : '#8c8080', 
                    border: (trialPassed && isCameraReady) ? '2px solid #ffffff' : 'none', 
                    fontFamily: 'inherit', transition: 'all 0.2s', letterSpacing: '1px',
                    boxShadow: (trialPassed && isCameraReady) ? `0 8px 25px rgba(217, 139, 139, 0.6), inset 0 4px 0 rgba(255,255,255,0.3)` : 'none' 
                  }}
                  onMouseOver={e => { if (trialPassed && isCameraReady) e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)'; }}
                  onMouseOut={e => { if (trialPassed && isCameraReady) e.currentTarget.style.transform = 'translateY(0) scale(1)'; }}
                >
                  {currentIndex + 1 < targetArray.length ? 'LANJUTKAN GESTUR ➡️' : 'MULAI TANTANGAN ⚔️ ➡️'}
                </button>
              </div>
              
              {/* KOLOM KANAN: SPACER */}
              <div style={{ flex: 1 }}></div>
            </>
          )}
          
        </div>
      )}

    </div>
  );
}