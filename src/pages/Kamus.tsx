// src/pages/Kamus.tsx
import React, { useState } from 'react';

interface KamusProps {
  onCobaGestur: (gesturId: string) => void;
}

const ALFABET_DATA = [
  { id: 'A', deskripsi: 'Tangan mengepal dengan ibu jari tegak lurus di samping telunjuk.' },
  { id: 'B', deskripsi: 'Keempat jari tegak lurus dan rapat, ibu jari ditekuk ke dalam telapak tangan.' },
  { id: 'C', deskripsi: 'Jari-jari melengkung membentuk setengah lingkaran menyerupai huruf C.' },
  { id: 'D', deskripsi: 'Telunjuk tegak lurus ke atas, jari lain menyentuh ibu jari membentuk lingkaran.' },
  { id: 'E', deskripsi: 'Semua jari ditekuk (menggenggam) menempel pada ibu jari di bawah.' },
  { id: 'F', deskripsi: 'Ujung telunjuk dan ibu jari bertemu membentuk lingkaran, tiga jari lain tegak.' },
  { id: 'G', deskripsi: 'Tangan mengepal, telunjuk menunjuk lurus ke samping.' },
  { id: 'H', deskripsi: 'Tangan mengepal, telunjuk dan jari tengah menunjuk lurus ke samping.' },
  { id: 'I', deskripsi: 'Tangan mengepal, hanya jari kelingking yang tegak lurus ke atas.' },
  { id: 'J', deskripsi: 'Jari kelingking digerakkan membuat pola lengkung J di udara.' },
  { id: 'K', deskripsi: 'Telunjuk dan jari tengah membentuk huruf V dengan ibu jari di tengah.' },
  { id: 'L', deskripsi: 'Ibu jari dan telunjuk tegak lurus membentuk sudut 90 derajat.' },
  { id: 'M', deskripsi: 'Tangan mengepal, ibu jari diselipkan di bawah telunjuk, tengah, dan manis.' },
  { id: 'N', deskripsi: 'Tangan mengepal, ibu jari diselipkan di bawah telunjuk dan jari tengah.' },
  { id: 'O', deskripsi: 'Seluruh ujung jari bertemu dengan ujung ibu jari membentuk lingkaran penuh.' },
  { id: 'P', deskripsi: 'Posisi tangan sama seperti huruf K, namun diarahkan ke bawah.' },
  { id: 'Q', deskripsi: 'Posisi tangan sama seperti huruf G, namun diarahkan ke bawah.' },
  { id: 'R', deskripsi: 'Telunjuk dan jari tengah tegak lurus ke atas dan saling menyilang.' },
  { id: 'S', deskripsi: 'Tangan mengepal penuh, ibu jari melintang di depan jari-jari lain.' },
  { id: 'T', deskripsi: 'Tangan mengepal, ibu jari diselipkan di antara telunjuk dan jari tengah.' },
  { id: 'U', deskripsi: 'Telunjuk dan jari tengah tegak lurus ke atas dan saling merapat.' },
  { id: 'V', deskripsi: 'Telunjuk dan jari tengah tegak lurus ke atas dan saling terbuka.' },
  { id: 'W', deskripsi: 'Telunjuk, jari tengah, dan manis tegak lurus dan saling terbuka.' },
  { id: 'X', deskripsi: 'Tangan mengepal, telunjuk sedikit ditekuk menyerupai kait.' },
  { id: 'Y', deskripsi: 'Ibu jari dan kelingking direntangkan lebar, jari lain mengepal.' },
  { id: 'Z', deskripsi: 'Telunjuk tegak lurus digerakkan membuat pola zig-zag Z di udara.' }
];

const KATA_DATA = [
  { id: 'Halo', deskripsi: 'Telapak tangan kanan terbuka melambai ke arah kamera.' },
  { id: 'Saya', deskripsi: 'Posisikan dari depan ke arah dada.' },
  { id: 'Bagus', deskripsi: 'Mengacungkan jari jempol.' },
  { id: 'Sempurna', deskripsi: 'Mengacungkan jari jempol dari kedua tangan dan dirapatkan di tengah.' },
  { id: 'Cinta', deskripsi: 'Ujung jari dari kedua tangan disatukan membentuk hati.' },
  { id: 'Teman', deskripsi: 'Kedua jari telunjuk membentuk kait, dan saling dikaitkan.' },
  { id: 'Nama', deskripsi: 'Seperti membuat garis di telapak tangan kiri.' },
  { id: 'Rumah', deskripsi: 'Satukan kedua ujung tangan seperti membentuk atap.' },
  { id: 'Maaf', deskripsi: 'Ujung jari jempol dan telunjuk diarahkan dari luar ke pipi.' },
  { id: 'Bantu', deskripsi: 'Jari telunjuk dan jari tengah dari kedua tangan saling bersilangan.' }
];

export default function Kamus({ onCobaGestur }: KamusProps) {
  const [zoomedItem, setZoomedItem] = useState<{id: string, deskripsi: string, type: 'abjad' | 'kata'} | null>(null);

  const colors = {
    cardBg: '#fff8f0',         
    textMuted: '#c4b5b5',
    accentGold: '#f1c40f',
    sidebarBg: '#2e2626',
    buttonBg: '#d98b8b',
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 0 50px 0' }}>
      
      {/* HEADER UTAMA KAMUS */}
      <div style={{ textAlign: 'center', width: '100%', maxWidth: '1200px', marginBottom: '40px', position: 'relative' }}>
        <h1 style={{ color: colors.cardBg, fontSize: '38px', margin: '0 0 10px 0', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>Pusat Panduan Gestur</h1>
        <p style={{ color: colors.textMuted, fontSize: '18px', margin: 0 }}>Klik pada kartu untuk melihat detail pergerakan tangan.</p>
      </div>

      {/* --- SECTION 1: ABJAD A-Z --- */}
      <div style={{ width: '100%', maxWidth: '1200px', marginBottom: '50px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px', borderBottom: `2px solid ${colors.accentGold}40`, paddingBottom: '10px' }}>
          <span style={{ fontSize: '20px', backgroundColor: '#3498db', padding: '5px 10px', borderRadius: '8px', color: 'white', lineHeight: 1, fontWeight: 'bold' }}>abc</span>
          <h2 style={{ margin: 0, color: colors.cardBg, fontSize: '24px', letterSpacing: '1px' }}>Kategori: Abjad (A-Z)</h2>
        </div>

        {/* CSS Grid menggunakan minmax(140px) agar bisa muat ~7 kartu ke samping */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '20px' }}>
          {ALFABET_DATA.map((item) => (
            <div 
              key={item.id}
              onClick={() => setZoomedItem({ ...item, type: 'abjad' })}
              style={{ 
                backgroundColor: colors.cardBg, borderRadius: '20px', overflow: 'hidden', cursor: 'pointer',
                boxShadow: '0 6px 15px rgba(0,0,0,0.2)', transition: 'transform 0.2s, box-shadow 0.2s',
                display: 'flex', flexDirection: 'column'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 12px 20px rgba(0,0,0,0.3)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 15px rgba(0,0,0,0.2)'; }}
            >
              <div style={{ width: '100%', aspectRatio: '3/4', backgroundColor: '#e2dcd5', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                <img 
                  src={`/kamus/${item.id}.jpg`} 
                  alt={`Gestur ${item.id}`} 
                  onError={(e) => { e.currentTarget.src = `https://placehold.co/300x400/e2dcd5/d98b8b?text=${item.id}&font=Montserrat`; }}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <div style={{ backgroundColor: colors.sidebarBg, padding: '10px', textAlign: 'center' }}>
                <strong style={{ fontSize: '24px', color: colors.accentGold }}>{item.id}</strong>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- SECTION 2: KATA SEHARI-HARI --- */}
      <div style={{ width: '100%', maxWidth: '1200px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px', borderBottom: `2px solid ${colors.buttonBg}40`, paddingBottom: '10px' }}>
          <span style={{ fontSize: '20px', backgroundColor: '#e74c3c', padding: '5px 10px', borderRadius: '8px', color: 'white', lineHeight: 1, fontWeight: 'bold' }}>💬</span>
          <h2 style={{ margin: 0, color: colors.cardBg, fontSize: '24px', letterSpacing: '1px' }}>Kategori: Kata Dasar</h2>
        </div>
        
        {/* Ukuran dan rasio disamakan persis dengan Abjad (140px & 3/4) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '20px' }}>
          {KATA_DATA.map((item) => (
            <div 
              key={item.id}
              onClick={() => setZoomedItem({ ...item, type: 'kata' })}
              style={{ 
                backgroundColor: colors.cardBg, borderRadius: '20px', overflow: 'hidden', cursor: 'pointer',
                boxShadow: '0 6px 15px rgba(0,0,0,0.2)', transition: 'transform 0.2s, box-shadow 0.2s',
                display: 'flex', flexDirection: 'column'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 12px 20px rgba(0,0,0,0.3)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 15px rgba(0,0,0,0.2)'; }}
            >
              <div style={{ width: '100%', aspectRatio: '3/4', backgroundColor: '#e2dcd5', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                <img 
                  src={`/kamus/${item.id}.jpg`} 
                  alt={`Gestur ${item.id}`} 
                  onError={(e) => { e.currentTarget.src = `https://placehold.co/300x400/e2dcd5/d98b8b?text=${item.id}&font=Montserrat`; }}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <div style={{ backgroundColor: colors.buttonBg, padding: '12px', textAlign: 'center' }}>
                <strong style={{ fontSize: '16px', color: 'white', textTransform: 'capitalize' }}>{item.id}</strong>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL / POP-UP ZOOM GAMBAR + DESKRIPSI */}
      {zoomedItem && (
        <div 
          onClick={() => setZoomedItem(null)}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(30, 25, 25, 0.9)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', backdropFilter: 'blur(8px)' }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <button 
              onClick={() => setZoomedItem(null)}
              style={{ position: 'absolute', top: '-40px', right: '-40px', background: 'none', border: 'none', color: colors.cardBg, fontSize: '50px', cursor: 'pointer', transition: 'transform 0.2s', zIndex: 10 }}
              onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'}
              onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              &times;
            </button>
            
            <div style={{ padding: '10px', backgroundColor: colors.cardBg, borderRadius: '25px', boxShadow: '0 25px 50px rgba(0,0,0,0.6)' }}>
              <img 
                src={`/kamus/${zoomedItem.id}.jpg`} 
                alt={`Gestur ${zoomedItem.id} Detail`} 
                onError={(e) => { e.currentTarget.src = `https://placehold.co/800x800/e2dcd5/d98b8b?text=Foto+${zoomedItem.id}+Belum+Ada&font=Montserrat`; }}
                style={{ maxHeight: '45vh', maxWidth: '100%', borderRadius: '15px', objectFit: 'contain', backgroundColor: '#e2dcd5' }}
              />
            </div>
            
            <div style={{ marginTop: '20px', textAlign: 'center', maxWidth: '600px' }}>
              <h2 style={{ color: colors.cardBg, margin: '0 0 10px 0', fontSize: '32px', letterSpacing: '2px', textTransform: 'capitalize', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                {zoomedItem.type === 'kata' ? `Kata: ${zoomedItem.id}` : `Huruf: ${zoomedItem.id}`}
              </h2>
              <p style={{ color: '#e0d5d5', fontSize: '16px', lineHeight: '1.6', margin: '0 0 20px 0', textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
                {zoomedItem.deskripsi}
              </p>
              
              {/* TOMBOL COBA GESTUR */}
              <button 
                onClick={() => {
                  onCobaGestur(zoomedItem.id);
                  setZoomedItem(null); 
                }}
                style={{ padding: '12px 30px', backgroundColor: '#2ecc71', color: 'white', border: 'none', borderRadius: '15px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'inherit', boxShadow: `0 6px 0 #27ae60`, transition: 'all 0.1s' }}
                onMouseDown={e => { e.currentTarget.style.transform = 'translateY(6px)'; e.currentTarget.style.boxShadow = '0 0 0 transparent'; }}
                onMouseUp={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 6px 0 #27ae60`; }}
              >
                🎥 COBA GESTUR INI
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}