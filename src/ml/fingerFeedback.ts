// src/ml/fingerFeedback.ts

// Tipe data untuk koordinat titik jari MediaPipe
type Point = { x: number; y: number };

/**
 * Rumus Matematika Euclidean Distance (Jarak antara 2 titik)
 */
function getDistance(p1: Point, p2: Point): number {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

export function getRealtimeFeedback(features: number[], targetLabel: string): string | null {
    let offset = 0;
    const isHand1Empty = features.slice(0, 42).every(v => v === 0);
    if (isHand1Empty) {
        offset = 42; 
    }

    const getPoint = (idx: number): Point => ({
        x: features[offset + idx * 2],
        y: features[offset + idx * 2 + 1]
    });

    const wrist = getPoint(0);      
    
    const thumbMcp = getPoint(2);   
    const thumbPip = getPoint(3);   
    const thumbTip = getPoint(4);   

    const indexMcp = getPoint(5);   
    const indexPip = getPoint(6);   
    const indexDip = getPoint(7);   
    const indexTip = getPoint(8);   

    const middleMcp = getPoint(9);  
    const middlePip = getPoint(10); 
    const middleTip = getPoint(12); 

    const ringMcp = getPoint(13);   
    const ringPip = getPoint(14);   
    const ringTip = getPoint(16);   

    const pinkyMcp = getPoint(17);  
    const pinkyPip = getPoint(18);  
    const pinkyTip = getPoint(20);  

    const target = targetLabel.toLowerCase();

    // --- Kelompok 1: Mengepal (Jempol Berdiri) -> A ---
    if (target === 'a') {
        if (indexTip.y < indexPip.y) return "⚠️ Lipat jari telunjukmu ke dalam rata!";
        if (middleTip.y < middlePip.y) return "⚠️ Lipat jari tengahmu ke dalam rata!";
        if (ringTip.y < ringMcp.y) return "⚠️ Lipat jari manismu ke dalam rata!";
        if (pinkyTip.y < pinkyMcp.y) return "⚠️ Lipat jari kelingkingmu ke dalam rata!";
        
        if (thumbTip.y > thumbPip.y + 0.03) return "⚠️ Tegakkan jempolmu di samping telunjuk!"; 
        
        return "✅ Postur A sempurna! Tahan posisimu.";
    }

    // --- Kelompok 2: Mengepal (E, M, N, S, T) ---
    if (['e', 'm', 'n', 's', 't'].includes(target)) {
        if (target === 'e') {
            if (indexTip.y < indexPip.y) return "⚠️ Lipat jari telunjukmu di bagian atas!";
            if (middleTip.y < middlePip.y) return "⚠️ Lipat jari tengahmu di bagian atas!";
            if (ringTip.y < ringMcp.y) return "⚠️ Lipat jari manismu!";
            if (pinkyTip.y < pinkyMcp.y) return "⚠️ Lipat jari kelingkingmu!";
            if (thumbTip.y < thumbPip.y) return "⚠️ Lipat jempolmu ke arah telapak tangan!";
            return "✅ Postur E sempurna! Tahan posisimu.";
        }

        if (target === 't') {
            if (middleTip.y < middlePip.y) return "⚠️ Lipat jari tengahmu!";
            if (ringTip.y < ringPip.y) return "⚠️ Lipat jari manismu!";
            if (pinkyTip.y < pinkyPip.y) return "⚠️ Lipat jari kelingkingmu!";
            
            if (getDistance(thumbTip, indexTip) > 0.08) {
                return "⚠️ Pertemukan ujung jempolmu dengan ujung jari telunjuk!";
            }
            return "✅ Postur T sempurna! Tahan posisimu.";
        }

        if (['m', 'n', 's'].includes(target)) {
            if (indexTip.y < indexPip.y) return "⚠️ Lipat jari telunjukmu rapat-rapat!";
            if (middleTip.y < middlePip.y) return "⚠️ Lipat jari tengahmu rapat-rapat!";
            if (ringTip.y < ringPip.y) return "⚠️ Lipat jari manismu rapat-rapat!";
            if (pinkyTip.y < pinkyPip.y) return "⚠️ Lipat jari kelingkingmu rapat-rapat!";

            if (target === 'm') {
                if (getDistance(thumbTip, ringPip) > 0.15 && getDistance(thumbTip, pinkyPip) > 0.15) {
                    return "⚠️ Selipkan jempolmu di antara jari manis dan kelingking!";
                }
                return "✅ Postur M sempurna! Tahan posisimu.";
            }

            if (target === 'n') {
                if (getDistance(thumbTip, middlePip) > 0.15 && getDistance(thumbTip, ringPip) > 0.15) {
                    return "⚠️ Selipkan jempolmu di antara jari tengah dan jari manis!";
                }
                return "✅ Postur N sempurna! Tahan posisimu.";
            }

            if (target === 's') {
                if (getDistance(thumbTip, middlePip) > 0.15 && getDistance(thumbTip, indexPip) > 0.15) {
                    return "⚠️ Lipat jempolmu menyilang di ATAS jari-jari yang mengepal!";
                }
                return "✅ Postur S sempurna! Tahan posisimu.";
            }
        }
    }

    // --- Kelompok 3: Empat Jari Tegak (Jempol Melipat ke Dalam) -> B, I, J ---
    if (target === 'b') {
        if (indexTip.y > indexPip.y) return "⚠️ Tegakkan jari telunjukmu lurus ke atas!";
        if (middleTip.y > middlePip.y) return "⚠️ Tegakkan jari tengahmu lurus ke atas!";
        if (ringTip.y > ringMcp.y) return "⚠️ Tegakkan jari manismu lurus ke atas!";
        if (pinkyTip.y > pinkyPip.y) return "⚠️ Tegakkan jari kelingkingmu lurus ke atas!";

        if (thumbTip.x > ringMcp.x && thumbTip.y > indexPip.y) {
           return "✅ Postur B sempurna! Tahan posisimu.";
        } else {
           return "⚠️ Lipat jempolmu ke depan telapak tangan!";
        }
    }

    if (['i', 'j'].includes(target)) {
        if (indexTip.y < indexMcp.y) return "⚠️ Lipat jari telunjukmu!";
        if (middleTip.y < middleMcp.y) return "⚠️ Lipat jari tengahmu!";
        if (ringTip.y < ringMcp.y) return "⚠️ Lipat jari manismu!";
        if (pinkyTip.y > pinkyPip.y) return "⚠️ Tegakkan jari kelingkingmu lurus ke atas!";
        
        if (thumbTip.x < middleMcp.x && thumbTip.y > pinkyPip.y) {
           return `✅ Postur ${target.toUpperCase()} sempurna! Tahan posisimu.`;
        } else {
           return "⚠️ Lipat jempolmu di depan telapak tangan!";
        }
    }

    // --- Kelompok 4: Melengkung -> C, O ---
    if (target === 'c') {
        if (indexTip.y < indexPip.y - 0.1 || indexTip.y > indexPip.y + 0.1) return "⚠️ Lengkungkan jari-jarimu seperti memegang gelas!";
        if (thumbTip.y < thumbPip.y - 0.1 || thumbTip.y > thumbPip.y + 0.1) return "⚠️ Lengkungkan juga jempolmu!";
        return "✅ Postur C sempurna! Tahan posisimu.";
    }

    if (target === 'o') {
        if (indexTip.y < indexPip.y - 0.1 || indexTip.y > indexPip.y + 0.1) return "⚠️ Rapatkan jari-jarimu dan pertemukan ujungnya!";
        if (getDistance(thumbTip, indexTip) > 0.15) return "⚠️ Pertemukan ujung keempat jarimu dengan jempol (membentuk O)!";
        return "✅ Postur O sempurna! Tahan posisimu.";
    }

    // --- Kelompok 5: Hanya Telunjuk -> D, G, Z ---
    if (target === 'd') {
        if (indexTip.y > indexPip.y) return "⚠️ Tegakkan jari telunjukmu lurus ke atas!";
        if (middleTip.y < middlePip.y) return "⚠️ Lipat jari tengahmu!";
        if (ringTip.y < ringMcp.y) return "⚠️ Lipat jari manismu!";
        if (pinkyTip.y < pinkyPip.y) return "⚠️ Lipat jari kelingkingmu!";

        if (thumbTip.x < indexMcp.x && thumbTip.y > pinkyPip.y) {
           return "✅ Postur D sempurna! Tahan posisimu.";
        } else {
           return "⚠️ Pertemukan ujung jempol dengan jari yang ditekuk!";
        }
    }

    if (target === 'g') {
        // G: Telunjuk arah horizontal ke kiri
        if (indexTip.x > indexPip.x) return "⚠️ Arahkan jari telunjukmu horizontal ke arah kiri!";
        if (middleTip.y < middleMcp.y) return "⚠️ Lipat jari tengahmu!";
        if (ringTip.y < ringMcp.y) return "⚠️ Lipat jari manismu!";
        if (pinkyTip.y < pinkyPip.y) return "⚠️ Lipat jari kelingkingmu!";
        
        if (thumbTip.x < indexMcp.x && thumbTip.y > pinkyPip.y) {
           return "✅ Postur G sempurna! Tahan posisimu.";
        } else {
           return "⚠️ Lipat jempolmu di depan telapak tangan!";
        }
    }

    if (target === 'z') {
        if (indexTip.y > indexPip.y) return "⚠️ Tegakkan jari telunjukmu!";
        if (middleTip.y < middlePip.y) return "⚠️ Lipat jari tengahmu!";
        if (ringTip.y < ringMcp.y) return "⚠️ Lipat jari manismu!";
        if (pinkyTip.y < pinkyPip.y) return "⚠️ Lipat jari kelingkingmu!";
        
        if (thumbTip.x < indexMcp.x && thumbTip.y > pinkyPip.y) {
           return "✅ Postur Z sempurna! Tahan posisimu.";
        } else {
           return "⚠️ Lipat jempolmu di depan telapak tangan!";
        }
    }

    // --- Kelompok 6: Dua Jari -> H, K, R, U, V ---
    if (['h', 'k', 'r', 'u', 'v'].includes(target)) {
        // Jari manis dan kelingking selalu terlipat untuk kelompok ini
        if (ringTip.y < ringMcp.y) return "⚠️ Lipat jari manismu!";
        if (pinkyTip.y < pinkyPip.y) return "⚠️ Lipat jari kelingkingmu!";

        if (target === 'h') {
           // H: Telunjuk dan tengah horizontal ke kiri
           if (indexTip.x > indexPip.x || middleTip.x > middlePip.x) {
               return "⚠️ Arahkan jari telunjuk dan jari tengahmu horizontal ke arah kiri!";
           }
           if (thumbTip.x < indexMcp.x - 0.05 && thumbTip.y > pinkyPip.y) {
              return "✅ Postur H sempurna! Tahan posisimu.";
           } else {
              return "⚠️ Posisikan jempolmu dengan benar di samping jari!";
           }
        } 
        
        // Aturan K, R, U, V (Telunjuk & Tengah Tegak ke Atas)
        if (target !== 'h') {
            if (indexTip.y > indexPip.y) return "⚠️ Tegakkan jari telunjukmu lurus ke atas!";
            if (middleTip.y > middlePip.y) return "⚠️ Tegakkan jari tengahmu lurus ke atas!";

            if (target === 'r') {
                // Heuristik sederhana: Rapatkan/silangkan jari
                if (getDistance(indexTip, middleTip) > 0.08) return "⚠️ Silangkan jari telunjuk di depan jari tengah!";
                return "✅ Postur R sempurna! Tahan posisimu.";
            } 
            
            if (target === 'k') {
                if (thumbTip.y > indexMcp.y) return "⚠️ Posisikan jempol di antara pangkal jari telunjuk dan jari tengah!";
                return "✅ Postur K sempurna! Tahan posisimu.";
            } 
            
            if (target === 'u') {
                if (getDistance(indexTip, middleTip) > 0.08) return "⚠️ Rapatkan jari telunjuk serta jari tengahmu!";
                if (thumbTip.x > indexMcp.x || thumbTip.y < pinkyPip.y) return "⚠️ Lipat jempolmu di depan telapak tangan!";
                return "✅ Postur U sempurna! Tahan posisimu.";   
            } 
            
            if (target === 'v') {
                if (getDistance(indexTip, middleTip) < 0.08) return "⚠️ Rentangkan dan buka jari telunjuk serta jari tengahmu (Bentuk V)!";
                if (thumbTip.x > indexMcp.x || thumbTip.y < pinkyPip.y) return "⚠️ Lipat jempolmu di depan telapak tangan!";
                return "✅ Postur V sempurna! Tahan posisimu.";
            }
        }
    }

    // --- Kelompok 7: Ibu Jari Terbuka (L-Shape) -> L, Y, P, Q ---
    if (target === 'l') {
        if (indexTip.y > indexPip.y) return "⚠️ Tegakkan jari telunjukmu lurus ke atas!";
        if (thumbTip.x < indexMcp.x - 0.1) {
           return "✅ Postur L sempurna! Tahan posisimu.";
        } else {
           return "⚠️ Buka jempolmu horizontal ke samping!";
        }
    }

    if (target === 'y') {
        if (indexTip.y < indexPip.y) return "⚠️ Lipat jari telunjukmu rata!";
        if (middleTip.y < middlePip.y) return "⚠️ Lipat jari tengahmu rata!";
        if (ringTip.y < ringMcp.y) return "⚠️ Lipat jari manismu rata!";
        if (pinkyTip.y > pinkyPip.y) return "⚠️ Tegakkan jari kelingkingmu!";
        if (thumbTip.x < indexMcp.x - 0.1) {
           return "✅ Postur Y sempurna! Tahan posisimu.";
        } else {
           return "⚠️ Buka jempolmu horizontal ke samping!";
        }
    }

    if (target === 'p') {
        if (indexTip.y < indexMcp.y) return "⚠️ Arahkan jari telunjukmu ke BAWAH!";
        if (middleTip.y < middleMcp.y) return "⚠️ Lipat jari tengahmu!";
        if (ringTip.y < ringMcp.y) return "⚠️ Lipat jari manismu!";
        if (pinkyTip.y < pinkyPip.y) return "⚠️ Lipat jari kelingkingmu!";
        if (thumbTip.x < indexMcp.x - 0.08) {
           return "✅ Postur P sempurna! Tahan posisimu.";
        } else {
           return "⚠️ Buka jempolmu horizontal ke samping!";
        }
    }

    if (target === 'q') {
        if (indexTip.y < indexMcp.y) return "⚠️ Arahkan jari telunjukmu ke BAWAH!";
        if (middleTip.y < middleMcp.y) return "⚠️ Lipat jari tengahmu!";
        if (ringTip.y < ringMcp.y) return "⚠️ Lipat jari manismu!";
        if (pinkyTip.y < pinkyPip.y) return "⚠️ Lipat jari kelingkingmu!";
        if (thumbTip.x < indexMcp.x - 0.08) {
           return "✅ Postur Q sempurna! Tahan posisimu.";
        } else {
           return "⚠️ Buka jempolmu horizontal ke samping!";
        }
    }

    // --- Kelompok 8: Tiga Jari Tegak -> F, W ---
    if (target === 'f') {
        if (getDistance(thumbTip, indexTip) > 0.15) return "⚠️ Pertemukan ujung jempol dan telunjukmu (Tanda 'OK')!";
        if (middleTip.y > middlePip.y) return "⚠️ Tegakkan jari tengahmu!";
        if (ringTip.y > ringPip.y) return "⚠️ Tegakkan jari manismu!";
        if (pinkyTip.y > pinkyPip.y) return "⚠️ Tegakkan jari kelingkingmu!";
        
        return "✅ Postur F (OK) sempurna! Tahan posisimu.";
    }

    if (target === 'w') {
        if (indexTip.y > indexPip.y) return "⚠️ Tegakkan jari telunjukmu!";
        if (middleTip.y > middlePip.y) return "⚠️ Tegakkan jari tengahmu!";
        if (ringTip.y > ringPip.y) return "⚠️ Tegakkan jari manismu!";
        if (pinkyTip.y < pinkyPip.y) return "⚠️ Lipat jari kelingkingmu!";
        
        if (thumbTip.x < indexMcp.x && thumbTip.y > pinkyPip.y) {
           return "✅ Postur W sempurna! Tahan posisimu.";
        } else {
           return "⚠️ Lipat jempolmu di depan telapak tangan!";
        }
    }

    // --- Kelompok 9: Telunjuk Membengkok -> X ---
    if (target === 'x') {
        if (indexPip.y < indexDip.y && indexTip.y > indexPip.y) return "⚠️ Bengkokkan jari telunjukmu ke dalam!";
        if (middleTip.y < middlePip.y) return "⚠️ Lipat jari tengahmu!";
        if (ringTip.y < ringMcp.y) return "⚠️ Lipat jari manismu!";
        if (pinkyTip.y < pinkyPip.y) return "⚠️ Lipat jari kelingkingmu!";
        
        if (thumbTip.x < indexMcp.x && thumbTip.y > pinkyPip.y) {
           return "✅ Postur X sempurna! Tahan posisimu.";
        } else {
           return "⚠️ Lipat jempolmu di depan telapak tangan!";
        }
    }

    return null; 
}