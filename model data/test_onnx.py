import numpy as np
import onnxruntime as ort
import pandas as pd

MODEL_PATH = "model_sibi.onnx"          # sesuaikan kalau beda
TRAIN_CSV = "hands_SIBI_training.csv"   # sesuaikan kalau beda
LABEL_COL = "class_type"                # sesuaikan dgn nama sebenarnya

# 1. Load beberapa sampel dari training
df = pd.read_csv(TRAIN_CSV)
print("Kolom:", df.columns.tolist())
print(df[LABEL_COL].value_counts())

X = df.drop(columns=[LABEL_COL]).to_numpy().astype(np.float32)
y = df[LABEL_COL].to_numpy()

# 2. Load model ONNX
sess = ort.InferenceSession(MODEL_PATH, providers=["CPUExecutionProvider"])
print("Input names:", [i.name for i in sess.get_inputs()])
print("Output names:", [o.name for o in sess.get_outputs()])

input_name = sess.get_inputs()[0].name
prob_name = sess.get_outputs()[1].name  # asumsi: output[1] = probs

# 3. Coba 3 sampel berbeda
for idx in [0, 1, 2]:
  x0 = X[idx:idx+1]
  true_label = y[idx]
  probs = sess.run([prob_name], {input_name: x0})[0][0]  # [1, C] → [C]
  pred_idx = int(np.argmax(probs))
  print(f"Sample {idx}: true={true_label}, pred_idx={pred_idx}, top_prob={probs[pred_idx]:.4f}")
