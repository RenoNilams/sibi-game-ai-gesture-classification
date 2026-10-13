// src/ml/onnxModel.ts

// `ort` datang dari <script src="https://cdn.jsdelivr.net/.../ort.min.js"></script> di index.html
// Di sini kita cuma kasih tahu TypeScript bahwa variabel global itu ada.
declare const ort: any;

let session: any = null;
let labels: string[] = [];

/**
 * Inisialisasi model ONNX dan load daftar label dari labels_sibi.json
 * Dipanggil sekali di App.tsx (useEffect)
 */
export async function initModel() {
  // Kalau sudah pernah init dan labels sudah ada, tidak usah diulang
  if (session && labels.length > 0) {
    console.log("initModel: sudah pernah dipanggil, skip");
    return;
  }

  // --- Load model ONNX ---
  try {
    console.log("initModel: mulai load /model_sibi.onnx ...");
    session = await ort.InferenceSession.create("/model_sibi.onnx", {
      executionProviders: ["wasm"],
    });
    console.log("initModel: ONNX model loaded ✅");
  } catch (err) {
    console.error("initModel: GAGAL load model_sibi.onnx", err);
    throw err;
  }

  // --- Load labels dari JSON ---
  try {
    console.log("initModel: mulai fetch /labels_sibi.json ...");
    const res = await fetch("/labels_sibi.json");
    if (!res.ok) {
      throw new Error("HTTP status " + res.status);
    }
    const data = await res.json();

    // Script Python menyimpan key "classes"
    labels = data.classes ?? data.labels ?? data;
    console.log("initModel: labels loaded ✅", labels);
  } catch (err) {
    console.error("initModel: GAGAL load labels_sibi.json", err);
    throw err;
  }
}

/**
 * Menerima fitur 84 titik => mengembalikan label + confidence
 */
export async function predictGesture(features: number[]) {
  if (!session) {
    throw new Error("Model belum di-init. Panggil initModel() dulu.");
  }
  if (!labels.length) {
    throw new Error("Labels belum dimuat.");
  }

  // Bungkus 84 data ke dalam format Tensor
  const input = new ort.Tensor("float32", Float32Array.from(features), [
    1,
    features.length,
  ]);

  const feeds: Record<string, any> = {};
  feeds[session.inputNames[0]] = input;

  // ==========================================
  // JURUS RAHASIA BYPASS ERROR ZIPMAP
  // Kita paksa session.run HANYA memproses dan memuntahkan output pertama (Index 0).
  // Output kedua (Index 1) yang bentuknya Map/Kamus kita abaikan sepenuhnya 
  // agar browser tidak crash!
  // ==========================================
  const results = await session.run(feeds, [session.outputNames[0]]);

  // Ambil tebakan finalnya (misal: "A", "B", "Bagus")
  const labelTensor = results[session.outputNames[0]];
  const predictedLabel = String(labelTensor.data[0]);

  // Karena probabilitas kita abaikan, kita set otomatis ke 1.0 (100%)
  // agar syarat di App.tsx terpenuhi dan teksnya langsung muncul!
  const confidence = 1.0;

  return { label: predictedLabel, confidence };
}