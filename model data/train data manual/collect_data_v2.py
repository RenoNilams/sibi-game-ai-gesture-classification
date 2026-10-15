import cv2
import mediapipe as mp
import csv
import time
import os
import random

mp_hands = mp.solutions.hands
mp_drawing = mp.solutions.drawing_utils
hands = mp_hands.Hands(
    static_image_mode=False,
    max_num_hands=2, # SEKARANG BISA BACA 2 TANGAN
    min_detection_confidence=0.7,
    min_tracking_confidence=0.7
)

# Header diperbarui: 42 untuk Kiri (L_) + 42 untuk Kanan (R_) = 84 Kolom + 1 Class
LANDMARK_NAMES = [
    'wrist', 'thumb_Cmc', 'thumb_Mcp', 'thumb_Ip', 'thumb_Tip', 
    'index_Mcp', 'index_Pip', 'index_Dip', 'index_Tip', 
    'middle_Mcp', 'middle_Pip', 'middle_Dip', 'middle_Tip', 
    'ring_Mcp', 'ring_Pip', 'ring_Dip', 'ring_Tip', 
    'pinky_Mcp', 'pinky_Pip', 'pinky_Dip', 'pinky_Tip'
]

COLUMNS = ['class_type']
for hand_side in ['L_', 'R_']:
    for name in LANDMARK_NAMES:
        COLUMNS.extend([f"{hand_side}{name}X", f"{hand_side}{name}Y"])

def append_to_csv(filename, data_row):
    file_exists = os.path.isfile(filename)
    with open(filename, mode='a', newline='') as f:
        writer = csv.writer(f)
        if not file_exists:
            writer.writerow(COLUMNS)
        writer.writerow(data_row)

target_label = input("Masukkan label gestur (contoh: Bagus, Rumah, A): ").strip()
target_samples = int(input(f"Berapa banyak data '{target_label}' yang mau direkam?: "))

cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)
print("\n[SIAP MEREKAM] Tekan 'S' untuk mulai, 'Q' untuk keluar.")

recording = False
count = 0

while cap.isOpened():
    ret, frame = cap.read()
    if not ret: break
        
    frame = cv2.flip(frame, 1) # Mirror
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = hands.process(rgb_frame)
    
    if results.multi_hand_landmarks and results.multi_handedness:
        # Default: array diisi 0.0 jika tangan tidak terdeteksi
        left_hand_features = [0.0] * 42
        right_hand_features = [0.0] * 42
        
        for idx, hand_landmarks in enumerate(results.multi_hand_landmarks):
            mp_drawing.draw_landmarks(frame, hand_landmarks, mp_hands.HAND_CONNECTIONS)
            
            # MediaPipe terbalik gara-gara cv2.flip, jadi kita reverse logikanya:
            # Jika MediaPipe bilang "Right", di layar cermin itu sebenarnya Kiri pengguna.
            label = results.multi_handedness[idx].classification[0].label
            actual_hand = "Left" if label == "Right" else "Right"
            
            # Ekstrak 42 titik X,Y
            hand_data = []
            for lm in hand_landmarks.landmark:
                hand_data.extend([lm.x, lm.y])
                
            # Masukkan ke "kursi" yang benar
            if actual_hand == "Left":
                left_hand_features = hand_data
            else:
                right_hand_features = hand_data
                
        # Simpan jika mode merekam aktif
        if recording:
            row = [target_label] + left_hand_features + right_hand_features
            
            if random.random() < 0.8:
                append_to_csv('dataset_sibi_train_v2.csv', row)
            else:
                append_to_csv('dataset_sibi_val_v2.csv', row)
                
            count += 1
            if count >= target_samples:
                recording = False
                print(f"\nSelesai! {count} data '{target_label}' ditambahkan.")
                break

    # UI Informasi
    cv2.putText(frame, f"Kelas: {target_label} | Terekam: {count}/{target_samples}", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
    status_text = "MEREKAM..." if recording else "Tekan 'S' untuk mulai merekam"
    cv2.putText(frame, status_text, (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255) if recording else (255, 0, 0), 2)
    
    cv2.imshow('Kamera SIBI v2 (Support 2 Tangan)', frame)

    key = cv2.waitKey(1) & 0xFF
    if key == ord('s') and not recording and count < target_samples:
        recording = True
    elif key == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()