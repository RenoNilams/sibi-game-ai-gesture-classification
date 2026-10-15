# train_sibi_svm.py
import json
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC
from sklearn.metrics import classification_report, confusion_matrix
from skl2onnx import to_onnx

# ==========================
# KONFIGURASI DASAR
# ==========================
BASE_DIR = Path(__file__).parent

TRAIN_CSV = BASE_DIR / "hands_SIBI_training.csv"
VAL_CSV = BASE_DIR / "hands_SIBI_validation.csv"

ONNX_OUTPUT = BASE_DIR / "model_sibi.onnx"
LABELS_JSON = BASE_DIR / "labels_sibi.json"

LABEL_COL = "class_type"

# Urutan fitur (x,y) HARUS sama dengan urutan landmark MediaPipe
FEATURE_PAIRS = [
    ("wristX", "wristY"),           # 0
    ("thumb_CmcX", "thumb_CmcY"),   # 1
    ("thumb_McpX", "thumb_McpY"),   # 2
    ("thumb_IpX", "thumb_IpY"),     # 3
    ("thumb_TipX", "thumb_TipY"),   # 4
    ("index_McpX", "index_McpY"),   # 5
    ("index_PipX", "index_PipY"),   # 6
    ("index_DipX", "index_DipY"),   # 7
    ("index_TipX", "index_TipY"),   # 8
    ("middle_McpX", "middle_McpY"), # 9
    ("middle_PipX", "middle_PipY"), # 10
    ("middle_DipX", "middle_DipY"), # 11
    ("middle_TipX", "middle_TipY"), # 12
    ("ring_McpX", "ring_McpY"),     # 13
    ("ring_PipX", "ring_PipY"),     # 14
    ("ring_DipX", "ring_DipY"),     # 15
    ("ring_TipX", "ring_TipY"),     # 16
    ("pinky_McpX", "pinky_McpY"),   # 17
    ("pinky_PipX", "pinky_PipY"),   # 18
    ("pinky_DipX", "pinky_DipY"),   # 19
    ("pinky_TipX", "pinky_TipY"),   # 20
]


def make_features(df: pd.DataFrame) -> np.ndarray:
    """
    Mengubah koordinat absolut (0..1) jadi fitur:
    - relatif terhadap wrist (landmark 0)
    - dibagi dengan scale = jarak wrist ke middle_Mcp (landmark 9)
    Output: array shape (n_samples, 42)
    """
    feats = []

    for _, row in df.iterrows():
        wrist_x = row["wristX"]
        wrist_y = row["wristY"]
        mid_x = row["middle_McpX"]
        mid_y = row["middle_McpY"]

        dx = mid_x - wrist_x
        dy = mid_y - wrist_y
        scale = (dx * dx + dy * dy) ** 0.5
        if scale < 1e-6:
            scale = 1e-6  # hindari bagi 0

        row_feats = []
        for col_x, col_y in FEATURE_PAIRS:
            x = (row[col_x] - wrist_x) / scale
            y = (row[col_y] - wrist_y) / scale
            row_feats.append(x)
            row_feats.append(y)

        feats.append(row_feats)

    return np.asarray(feats, dtype=np.float32)


def load_dataset(csv_path: Path):
    df = pd.read_csv(csv_path)
    X = make_features(df)
    y = df[LABEL_COL].to_numpy()
    return X, y


def main():
    print("[INFO] Loading datasets...")
    X_train, y_train = load_dataset(TRAIN_CSV)
    X_val, y_val = load_dataset(VAL_CSV)

    print("[INFO] Train shape:", X_train.shape, "Val shape:", X_val.shape)

    # ==========================
    # TRAINING SVM
    # ==========================
    clf = make_pipeline(
        StandardScaler(),
        SVC(probability=True)
    )

    print("[INFO] Training SVM...")
    clf.fit(X_train, y_train)
    print("[INFO] Training done.")

    # Evaluasi sederhana di validation set
    y_pred = clf.predict(X_val)
    print("\n[INFO] Validation classification report:")
    print(classification_report(y_val, y_pred))
    print("[INFO] Confusion matrix:")
    print(confusion_matrix(y_val, y_pred))

    # ==========================
    # SIMPAN LABELS KE JSON
    # ==========================
    classes = sorted(list(set(y_train)))
    labels_data = {"classes": classes}
    with open(LABELS_JSON, "w", encoding="utf-8") as f:
        json.dump(labels_data, f, ensure_ascii=False, indent=2)
    print("[INFO] Labels saved to", LABELS_JSON)

    # ==========================
    # EXPORT KE ONNX
    # ==========================
    print("[INFO] Converting model to ONNX...")
    # gunakan contoh satu baris sebagai shape contoh
    onnx_model = to_onnx(
        clf,
        X_train[:1].astype(np.float32),
        target_opset=13,
        options={"zipmap": False},  # supaya output[1] = tensor probabilitas
    )

    with open(ONNX_OUTPUT, "wb") as f:
        f.write(onnx_model.SerializeToString())
    print("[INFO] ONNX model saved to", ONNX_OUTPUT)


if __name__ == "__main__":
    main()
