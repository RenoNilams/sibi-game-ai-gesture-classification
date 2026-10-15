# train_sibi_svm_v2.py
# Latih ulang SVM + ekspor ke ONNX untuk model SIBI.
# Input:
#   - hands_SIBI_training.csv
#   - hands_SIBI_validation.csv
# Output:
#   - model_sibi.onnx
#   - labels_sibi.json

from __future__ import annotations

from typing import Tuple, List
from pathlib import Path
import json

import numpy as np
import pandas as pd

from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.pipeline import make_pipeline
from sklearn.svm import SVC
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    accuracy_score,
)

from skl2onnx import convert_sklearn
from skl2onnx.common.data_types import FloatTensorType


# ==========================
#  KONFIGURASI FILE
# ==========================

TRAIN_CSV = "hands_SIBI_training.csv"
VAL_CSV = "hands_SIBI_validation.csv"

LABELS_JSON = "labels_sibi.json"
ONNX_MODEL = "model_sibi.onnx"


# ==========================
#  UTIL: NAMA KOLOM
# ==========================

LANDMARK_NAMES: List[str] = [
    "wrist",
    "thumb_Cmc",
    "thumb_Mcp",
    "thumb_Ip",
    "thumb_Tip",
    "index_Mcp",
    "index_Pip",
    "index_Dip",
    "index_Tip",
    "middle_Mcp",
    "middle_Pip",
    "middle_Dip",
    "middle_Tip",
    "ring_Mcp",
    "ring_Pip",
    "ring_Dip",
    "ring_Tip",
    "pinky_Mcp",
    "pinky_Pip",
    "pinky_Dip",
    "pinky_Tip",
]

COORDS = ["X", "Y"]


def expected_coord_columns() -> List[str]:
    return [f"{name}{c}" for name in LANDMARK_NAMES for c in COORDS]


# ==========================
#  LOAD & PREPROCESS DATA
# ==========================

def infer_label_column(df: pd.DataFrame) -> str:
    """
    Cari nama kolom label di CSV.
    Untuk dataset kamu nama kolomnya `class_type`.
    """
    candidates = ["class_type", "label", "kelas", "class", "huruf", "y"]
    for c in candidates:
        if c in df.columns:
            return c
    raise ValueError(
        "Tidak menemukan kolom label. Kolom yang ada: "
        + ", ".join(df.columns)
    )


def make_features(df: pd.DataFrame) -> np.ndarray:
    """
    Mengubah koordinat mentah (wristX, thumb_CmcX, ..., pinky_TipY)
    menjadi 42 fitur seperti di CameraCanvas.tsx:

    - relatif terhadap wrist (landmark 0)
    - dibagi skala = jarak wrist–middle_Mcp
    - sumbu X di-mirror (nx = -rx) supaya cocok
      dengan cara ekstraksi fitur di front-end.
    """
    # cek kolom koordinat
    needed = expected_coord_columns()
    missing = [c for c in needed if c not in df.columns]
    if missing:
        raise ValueError(f"Kolom koordinat hilang di CSV: {missing}")

    wristX = df["wristX"].to_numpy(dtype=np.float32)
    wristY = df["wristY"].to_numpy(dtype=np.float32)
    midX = df["middle_McpX"].to_numpy(dtype=np.float32)
    midY = df["middle_McpY"].to_numpy(dtype=np.float32)

    scale = np.sqrt((midX - wristX) ** 2 + (midY - wristY) ** 2)
    scale[scale < 1e-6] = 1e-6  # hindari bagi nol

    feat_list: List[np.ndarray] = []

    for name in LANDMARK_NAMES:
        x = df[f"{name}X"].to_numpy(dtype=np.float32)
        y = df[f"{name}Y"].to_numpy(dtype=np.float32)

        # relatif ke wrist
        rx = (x - wristX) / scale
        ry = (y - wristY) / scale

        # mirror di sumbu X (sama seperti di CameraCanvas.tsx)
        nx = -rx
        ny = ry

        feat_list.append(nx)
        feat_list.append(ny)

    # shape: (n_samples, 42)
    X = np.stack(feat_list, axis=1).astype(np.float32)
    return X


def load_dataset(csv_path: str) -> Tuple[np.ndarray, np.ndarray]:
    df = pd.read_csv(csv_path)
    label_col = infer_label_column(df)

    X = make_features(df)
    y = df[label_col].astype(str).to_numpy()

    return X, y


# ==========================
#  TRAIN & EVALUASI
# ==========================

def train_model(
    X_train: np.ndarray,
    y_train: np.ndarray,
) -> Tuple[any, LabelEncoder]:
    """
    Latih SVM (dalam pipeline StandardScaler).
    """
    le = LabelEncoder()
    y_train_enc = le.fit_transform(y_train)

    clf = make_pipeline(
        StandardScaler(),
        SVC(
            kernel="rbf",
            C=10.0,
            gamma="scale",
            probability=True,
            decision_function_shape="ovr",
            random_state=42,
        ),
    )

    clf.fit(X_train, y_train_enc)
    return clf, le


def evaluate_model(
    clf,
    le: LabelEncoder,
    X_val: np.ndarray,
    y_val: np.ndarray,
) -> None:
    y_val_enc = le.transform(y_val)
    y_pred = clf.predict(X_val)

    acc = accuracy_score(y_val_enc, y_pred)
    print("\n=== HASIL VALIDASI ===")
    print(f"Akurasi total : {acc:.4f}\n")

    print("Classification report:")
    print(classification_report(y_val_enc, y_pred))

    print("Confusion matrix:")
    print(confusion_matrix(y_val_enc, y_pred))


# ==========================
#  EKSPOR LABEL & ONNX
# ==========================

def save_labels(le: LabelEncoder, path: str) -> None:
    classes = le.classes_.tolist()
    obj = {"classes": classes}
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, indent=2, ensure_ascii=False)
    print(f"[OK] labels disimpan ke {path}")


def save_onnx(clf, n_features: int, path: str) -> None:
    initial_type = [("float_input", FloatTensorType([None, n_features]))]
    onnx_model = convert_sklearn(
        clf,
        initial_types=initial_type,
        target_opset=15,
    )
    with open(path, "wb") as f:
        f.write(onnx_model.SerializeToString())
    print(f"[OK] model ONNX disimpan ke {path}")


# ==========================
#  MAIN
# ==========================

def main():
    print("=== Load dataset training & validation ===")
    X_train, y_train = load_dataset(TRAIN_CSV)
    X_val, y_val = load_dataset(VAL_CSV)

    print(f"X_train shape: {X_train.shape}")
    print(f"X_val   shape: {X_val.shape}")
    print(f"Jumlah kelas: {len(sorted(set(y_train)))} -> {sorted(set(y_train))}")

    print("\n=== Training SVM ===")
    clf, le = train_model(X_train, y_train)

    evaluate_model(clf, le, X_val, y_val)

    print("\n=== Simpan label & ONNX ===")
    save_labels(le, LABELS_JSON)
    save_onnx(clf, X_train.shape[1], ONNX_MODEL)

    print("\nSelesai. File yang dihasilkan:")
    print(f"- {LABELS_JSON}")
    print(f"- {ONNX_MODEL}")


if __name__ == "__main__":
    main()
