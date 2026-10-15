import json
from pathlib import Path
import numpy as np
import pandas as pd
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC
from sklearn.metrics import classification_report
from skl2onnx import to_onnx

# ==========================
# KONFIGURASI DASAR
# ==========================
BASE_DIR = Path(__file__).parent

# Pastikan nama file CSV sesuai dengan yang dihasilkan script collect_data_v2.py
TRAIN_CSV = BASE_DIR / "dataset_sibi_train_v2.csv"
VAL_CSV = BASE_DIR / "dataset_sibi_val_v2.csv"

ONNX_OUTPUT = BASE_DIR / "model_sibi.onnx"
LABELS_JSON = BASE_DIR / "labels_sibi.json"

def normalize_features(df):
    """
    Melakukan normalisasi titik X, Y agar kebal terhadap jarak ke kamera.
    Normalisasi dilakukan terpisah untuk Tangan Kiri dan Tangan Kanan.
    """
    y = df['class_type'].values
    X_raw = df.drop(columns=['class_type']).values # Ambil 84 kolom koordinat
    
    X_norm = []
    for row in X_raw:
        left_hand = row[0:42]
        right_hand = row[42:84]
        
        # 1. Normalisasi Tangan Kiri
        if np.sum(left_hand) == 0:
            norm_l = np.zeros(42) # Jika tidak ada tangan kiri, biarkan 0
        else:
            w_x, w_y = left_hand[0], left_hand[1] # Wrist (Pergelangan)
            m_x, m_y = left_hand[18], left_hand[19] # Middle MCP
            scale = np.sqrt((m_x - w_x)**2 + (m_y - w_y)**2) + 1e-6
            norm_l = np.zeros(42)
            for i in range(0, 42, 2):
                norm_l[i] = (left_hand[i] - w_x) / scale
                norm_l[i+1] = (left_hand[i+1] - w_y) / scale
                
        # 2. Normalisasi Tangan Kanan
        if np.sum(right_hand) == 0:
            norm_r = np.zeros(42) # Jika tidak ada tangan kanan, biarkan 0
        else:
            w_x, w_y = right_hand[0], right_hand[1]
            m_x, m_y = right_hand[18], right_hand[19]
            scale = np.sqrt((m_x - w_x)**2 + (m_y - w_y)**2) + 1e-6
            norm_r = np.zeros(42)
            for i in range(0, 42, 2):
                norm_r[i] = (right_hand[i] - w_x) / scale
                norm_r[i+1] = (right_hand[i+1] - w_y) / scale
        
        # Gabungkan Kiri (42) dan Kanan (42) menjadi 84 Fitur
        X_norm.append(np.concatenate([norm_l, norm_r]))
        
    return np.array(X_norm, dtype=np.float32), y

# ==========================
# EKSEKUSI TRAINING
# ==========================
print("[INFO] Memuat dataset...")
try:
    df_train = pd.read_csv(TRAIN_CSV)
    df_val = pd.read_csv(VAL_CSV)
except Exception as e:
    print(f"ERROR: Tidak bisa menemukan file CSV. Pastikan nama file benar.\nDetail: {e}")
    exit()

X_train, y_train = normalize_features(df_train)
X_val, y_val = normalize_features(df_val)

print(f"[INFO] Data latih: {X_train.shape[0]} baris, Data uji: {X_val.shape[0]} baris.")
print("[INFO] Sedang melatih model SVM (ini butuh beberapa detik)...")

# SVM mengenali probabilitas agar UI React bisa menampilkan % Keyakinan
clf = make_pipeline(
    StandardScaler(),
    SVC(probability=True, kernel='rbf', C=10) # C=10 untuk akurasi lebih tajam
)
clf.fit(X_train, y_train)
print("[INFO] Selesai melatih!")

print("\n[INFO] Laporan Akurasi Validasi:")
y_pred = clf.predict(X_val)

# KUNCI PERUBAHAN ADA DI BARIS BAWAH INI (Menambahkan digits=4)
print(classification_report(y_val, y_pred, digits=4))

# ==========================
# SIMPAN MODEL & LABEL
# ==========================
classes = sorted(list(set(y_train)))
with open(LABELS_JSON, "w", encoding="utf-8") as f:
    json.dump({"classes": classes}, f, ensure_ascii=False, indent=2)
print(f"\n[INFO] Labels ({len(classes)} kelas) berhasil disimpan ke {LABELS_JSON}")

print("[INFO] Mengonversi ke format Web (ONNX)...")
onnx_model = to_onnx(clf, X_train[:1].astype(np.float32), target_opset=12)
with open(ONNX_OUTPUT, "wb") as f:
    f.write(onnx_model.SerializeToString())
print("[INFO] YAY! File model_sibi.onnx berhasil diperbarui!")