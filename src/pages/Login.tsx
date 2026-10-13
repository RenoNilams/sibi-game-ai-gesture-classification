// src/pages/Login.tsx
import React, { useState } from 'react';
import { auth, db } from '../firebase'; 
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile, 
  signOut, 
  sendPasswordResetEmail,
  signInWithPopup, 
  GoogleAuthProvider 
} from 'firebase/auth'; 
import { doc, setDoc, getDoc } from 'firebase/firestore';

interface LoginProps {
  onLoginSuccess: (userData: any) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState(''); 
  const [showResetModal, setShowResetModal] = useState(false); 

  const colors = {
    bgGradient: 'radial-gradient(circle at 50% 0%, #564747 0%, #2e2626 100%)',
    sidebarBg: '#2e2626',
    cardBg: '#fff8f0',         
    textLight: '#ffffff',
    textMuted: '#9e9191',
    textDark: '#4a3f3f',
    accentGold: '#f1c40f',
    buttonBg: '#d98b8b',
    buttonHover: '#e69a9a',
    inputBg: '#f2ece4',
  };

  // FUNGSI VALIDASI
  const validateInput = () => {
    // 1. Validasi Nama
    if (isRegistering) {
      const nameRegex = /^[a-zA-Z\s]*$/;
      if (!nameRegex.test(name)) {
        setError('Nama hanya boleh berisi huruf dan spasi.');
        return false;
      }
      if (name.length > 15) {
        setError('Nama maksimal 15 karakter agar profil rapi.');
        return false;
      }
      if (name.trim().length === 0) {
        setError('Nama tidak boleh kosong.');
        return false;
      }
    }

    // 2. Validasi Email (Diperluas)
    const emailLower = email.toLowerCase();
    const validDomains = ['@gmail.com', '@student.unp.ac.id', '@student.ac.id', '@yahoo.com'];
    const isValidDomain = validDomains.some(domain => emailLower.endsWith(domain));
    
    if (!isValidDomain) {
      setError('Gunaan email valid (@gmail.com, @yahoo.com, atau email kampus)');
      return false;
    }

    return true;
  };

  // FUNGSI LOGIN MANUAL (EMAIL & PASSWORD)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    if (!validateInput()) {
      setLoading(false);
      return;
    }

    try {
      if (isRegistering) {
        // --- PROSES DAFTAR BARU ---
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await updateProfile(user, { displayName: name });

        const userDocData = {
          uid: user.uid,
          name: name.trim(), 
          email: email.toLowerCase(),
          totalXP: 0,
          unlockedLevel: 1,
          bestStreak: 0,
          role: 'user', 
          isBanned: false, 
          createdAt: new Date().toISOString()
        };
        await setDoc(doc(db, "users", user.uid), userDocData);

        onLoginSuccess(userDocData);
      } else {
        // --- PROSES MASUK (LOGIN) ---
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const userData = docSnap.data();
          if (userData.isBanned === true) {
            await signOut(auth); 
            setError('Akun Anda telah ditangguhkan oleh Administrator.');
            return; 
          }
          onLoginSuccess(userData);
        } else {
          setError("Data profil tidak ditemukan di database.");
        }
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') setError('Email ini sudah terdaftar. Silakan Masuk.');
      else if (err.code === 'auth/wrong-password') setError('Kata sandi yang Anda masukkan salah.');
      else if (err.code === 'auth/user-not-found') setError('Email tidak terdaftar. Silakan Daftar Baru.');
      else if (err.code === 'auth/invalid-credential') setError('Email atau Kata Sandi salah. Periksa kembali.');
      else if (err.code === 'auth/weak-password') setError('Kata sandi terlalu lemah (minimal 6 karakter).');
      else setError('Terjadi kesalahan sistem. Periksa koneksi Anda.');
    } finally {
      setLoading(false);
    }
  };

  // FUNGSI LOGIN GOOGLE
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    setSuccessMsg('');
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      let userData;

      if (docSnap.exists()) {
        userData = docSnap.data();
        if (userData.isBanned) {
          await signOut(auth);
          setError('Akun Anda telah ditangguhkan oleh Administrator.');
          setLoading(false);
          return;
        }
      } else {
        // Daftar otomatis dengan profil Google
        userData = {
          uid: user.uid,
          name: user.displayName || 'Pemain', 
          email: user.email,
          totalXP: 0,
          unlockedLevel: 1,
          bestStreak: 0,
          role: 'user', 
          isBanned: false, 
          createdAt: new Date().toISOString()
        };
        await setDoc(docRef, userData);
      }

      onLoginSuccess(userData);

    } catch (err: any) {
      console.error(err);
      setError('Gagal memverifikasi akun Google. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  // FUNGSI LUPA SANDI
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    if (!email) {
      setError('Masukkan email Anda terlebih dahulu.');
      setLoading(false);
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMsg('Tautan reset kata sandi telah dikirim! Cek inbox/spam email Anda.');
      setTimeout(() => {
        setShowResetModal(false);
        setSuccessMsg('');
      }, 4000); 
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found') setError('Email tersebut belum terdaftar.');
      else if (err.code === 'auth/invalid-email') setError('Format email tidak valid.');
      else setError('Gagal mengirim email reset. Coba lagi nanti.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100vw', background: colors.bgGradient, fontFamily: '"Comic Sans MS", "Chalkboard SE", "Marker Felt", sans-serif', position: 'relative' }}>
      
      <div style={{ display: 'flex', width: '1000px', height: '600px', backgroundColor: colors.cardBg, borderRadius: '40px', boxShadow: '0 25px 50px rgba(0,0,0,0.4)', overflow: 'hidden' }}>
        
        {/* SISI KIRI: Branding */}
        <div style={{ flex: 1, backgroundColor: colors.buttonBg, padding: '50px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: colors.textLight, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          
          <img 
            src="/logo-sibi.png" 
            alt="Dekorasi Logo SIBI"
            style={{ position: 'absolute', top: '-40px', left: '-40px', width: '250px', opacity: 0.1, transform: 'rotate(-15deg)', filter: 'brightness(0) invert(1)' }} 
          />
          <img 
            src="/logo-sibi.png"
            alt="Dekorasi Logo SIBI 2"
            style={{ position: 'absolute', bottom: '-30px', right: '-30px', width: '200px', opacity: 0.1, transform: 'rotate(20deg)', filter: 'brightness(0) invert(1)' }}
          />

          <img 
            src="/logo-sibi.png" 
            alt="Logo SIBI Master Utama"
            style={{ width: '140px', marginBottom: '20px', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' }} 
          />

          <h1 style={{ fontSize: '40px', margin: '0 0 15px 0', letterSpacing: '2px', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>SIBI Master</h1>
          <p style={{ fontSize: '18px', lineHeight: '1.5', margin: 0, opacity: 0.9 }}>
            Platform belajar interaktif. Mari mulai petualangan belajarmu hari ini!
          </p>
        </div>

        {/* SISI KANAN: Formulir Login Terpadu */}
        <div style={{ flex: 1.2, padding: '40px 50px', display: 'flex', flexDirection: 'column', justifyContent: 'center', backgroundColor: colors.cardBg, overflowY: 'auto' }}>
          
          <div style={{ marginBottom: '20px', textAlign: 'center' }}>
            <h2 style={{ margin: '0 0 5px 0', fontSize: '30px', color: colors.textDark }}>
              {isRegistering ? 'Buat Akun Baru 👋' : 'Selamat Datang! 👋'}
            </h2>
            {error && <p style={{ color: '#e74c3c', fontWeight: 'bold', margin: '5px 0 0 0', fontSize: '14px' }}>⚠️ {error}</p>}
            {successMsg && <p style={{ color: '#2ecc71', fontWeight: 'bold', margin: '5px 0 0 0', fontSize: '14px' }}>✅ {successMsg}</p>}
          </div>

          {/* Tombol Login Google */}
          <button 
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            style={{ 
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              width: '100%', padding: '14px', borderRadius: '15px', border: '2px solid #e0e0e0', 
              backgroundColor: '#ffffff', color: colors.textDark, fontSize: '16px', fontWeight: 'bold', 
              cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
              boxShadow: '0 4px 6px rgba(0,0,0,0.02)', marginBottom: '15px'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Masuk Praktis dengan Google
          </button>

          {/* Pemisah ATAU */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#e0e0e0' }}></div>
            <span style={{ margin: '0 15px', color: colors.textMuted, fontSize: '13px', fontWeight: 'bold' }}>ATAU EMAIL</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#e0e0e0' }}></div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            
            {isRegistering && (
              <div style={{ display: 'flex', alignItems: 'center', backgroundColor: colors.inputBg, borderRadius: '15px', padding: '12px 20px' }}>
                <span style={{ fontSize: '18px', marginRight: '15px', opacity: 0.7 }}>👤</span>
                <input 
                  type="text" 
                  placeholder="Nama panggilan (max 15)" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={isRegistering}
                  maxLength={15} 
                  style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: '15px', color: colors.textDark, fontFamily: 'inherit' }}
                />
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', backgroundColor: colors.inputBg, borderRadius: '15px', padding: '12px 20px' }}>
              <span style={{ fontSize: '18px', marginRight: '15px', opacity: 0.7 }}>📧</span>
              <input 
                type="email" 
                placeholder="Alamat Email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: '15px', color: colors.textDark, fontFamily: 'inherit' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', backgroundColor: colors.inputBg, borderRadius: '15px', padding: '12px 20px' }}>
              <span style={{ fontSize: '18px', marginRight: '15px', opacity: 0.7 }}>🔒</span>
              <input 
                type="password" 
                placeholder="Kata Sandi" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6} 
                style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: '15px', color: colors.textDark, fontFamily: 'inherit' }}
              />
            </div>

            {!isRegistering && (
              <div style={{ textAlign: 'right', marginTop: '-5px' }}>
                <span 
                  onClick={() => { setError(''); setSuccessMsg(''); setShowResetModal(true); }}
                  style={{ fontSize: '13px', color: colors.buttonBg, cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Lupa Kata Sandi?
                </span>
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              style={{ 
                marginTop: '5px', padding: '14px', borderRadius: '15px', border: 'none', 
                backgroundColor: colors.buttonBg, color: 'white', fontSize: '16px', fontWeight: 'bold', 
                cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s', fontFamily: 'inherit',
                boxShadow: `0 6px 12px ${colors.buttonBg}60`,
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'MEMPROSES...' : (isRegistering ? 'DAFTAR SEKARANG' : 'MASUK')}
            </button>
          </form>

          <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px', color: colors.textMuted }}>
            {isRegistering ? 'Sudah punya akun? ' : 'Belum punya akun? '}
            <span 
              onClick={() => { setIsRegistering(!isRegistering); setError(''); setSuccessMsg(''); }}
              style={{ color: colors.buttonBg, fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline' }}
            >
              {isRegistering ? 'Masuk di sini' : 'Daftar manual'}
            </span>
          </div>

        </div>
      </div>

      {/* MODAL LUPA KATA SANDI */}
      {showResetModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(5px)' }}>
          <div style={{ backgroundColor: colors.cardBg, padding: '40px', borderRadius: '25px', width: '400px', boxShadow: '0 15px 30px rgba(0,0,0,0.5)', position: 'relative' }}>
            <button 
              onClick={() => { setShowResetModal(false); setError(''); setSuccessMsg(''); }}
              style={{ position: 'absolute', top: '15px', right: '20px', background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: colors.textMuted }}
            >
              &times;
            </button>
            <h3 style={{ margin: '0 0 15px 0', color: colors.textDark }}>Reset Kata Sandi 🔐</h3>
            <p style={{ margin: '0 0 20px 0', color: colors.textMuted, fontSize: '14px', lineHeight: '1.5' }}>
              Masukkan email yang terdaftar. Kami akan mengirimkan tautan untuk membuat kata sandi baru.
            </p>
            
            {error && <p style={{ color: '#e74c3c', fontWeight: 'bold', margin: '0 0 15px 0', fontSize: '14px' }}>⚠️ {error}</p>}
            {successMsg && <p style={{ color: '#2ecc71', fontWeight: 'bold', margin: '0 0 15px 0', fontSize: '14px' }}>✅ {successMsg}</p>}

            <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <input 
                type="email" 
                placeholder="Alamat Email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ padding: '12px 20px', borderRadius: '10px', border: `2px solid ${colors.inputBg}`, backgroundColor: '#ffffff', fontSize: '16px', outline: 'none', fontFamily: 'inherit' }}
              />
              <button 
                type="submit"
                disabled={loading}
                style={{ padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: colors.buttonBg, color: 'white', fontWeight: 'bold', fontSize: '16px', cursor: loading ? 'not-allowed' : 'pointer' }}
              >
                {loading ? 'MENGIRIM...' : 'KIRIM TAUTAN RESET'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}