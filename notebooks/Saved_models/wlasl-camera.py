# ===============================
# ENV SETUP
# ===============================
import os
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"

import cv2
import numpy as np
import tensorflow as tf
import mediapipe as mp
from collections import deque
from tensorflow.keras import layers

# ===============================
# CONFIG
# ===============================
IMG_SIZE = 160
MAX_FRAMES = 16
THRESHOLD = 0.6   # confidence threshold

# ===============================
# BINARY MODEL (SAFE + FAST)
# ===============================
def build_binary_sign_model():

    # -------- VIDEO INPUT --------
    video_in = tf.keras.Input(
        shape=(MAX_FRAMES, IMG_SIZE, IMG_SIZE, 3),
        name="video_input"
    )

    backbone = tf.keras.applications.MobileNetV2(
        include_top=False,
        weights="imagenet",
        input_shape=(IMG_SIZE, IMG_SIZE, 3),
        pooling="avg"
    )
    backbone.trainable = False

    x_vid = layers.TimeDistributed(backbone)(video_in)
    x_vid = layers.GlobalAveragePooling1D()(x_vid)   # (None, 1280)

    # -------- SKELETON INPUT --------
    skel_in = tf.keras.Input(
        shape=(MAX_FRAMES, 42),
        name="skeleton_input"
    )

    x_skel = layers.GlobalAveragePooling1D()(skel_in)  # (None, 42)
    x_skel = layers.Dense(64, activation="relu")(x_skel)

    # -------- FUSION --------
    x = layers.Concatenate()([x_vid, x_skel])
    x = layers.Dense(128, activation="relu")(x)
    x = layers.Dropout(0.3)(x)

    out = layers.Dense(1, activation="sigmoid")(x)

    model = tf.keras.Model(
        inputs=[video_in, skel_in],
        outputs=out
    )

    return model


print("⏳ Building binary model...")
model = build_binary_sign_model()
print("✅ Model ready (random weights – demo mode)")

# ===============================
# MEDIAPIPE HANDS
# ===============================
mp_hands = mp.solutions.hands
hands = mp_hands.Hands(
    static_image_mode=False,
    max_num_hands=1,
    min_detection_confidence=0.6,
    min_tracking_confidence=0.6
)

def extract_skeleton(frame):
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    res = hands.process(rgb)

    if not res.multi_hand_landmarks:
        return np.zeros((42,), dtype=np.float32)

    coords = []
    for lm in res.multi_hand_landmarks[0].landmark:
        coords.extend([lm.x, lm.y])

    return np.array(coords, dtype=np.float32)

# ===============================
# CAMERA
# ===============================
cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

buf_v = deque(maxlen=MAX_FRAMES)
buf_s = deque(maxlen=MAX_FRAMES)

print("🔥 SignBridge Binary LIVE")
print("➡ Press Q to quit")

# ===============================
# INFERENCE LOOP
# ===============================
while True:
    ret, frame = cap.read()
    if not ret:
        continue

    frame = cv2.flip(frame, 1)

    # preprocess frame
    fr = cv2.resize(frame, (IMG_SIZE, IMG_SIZE))
    fr = fr.astype(np.float32) / 255.0

    buf_v.append(fr)
    buf_s.append(extract_skeleton(frame))

    if len(buf_v) == MAX_FRAMES:
        video = np.expand_dims(np.array(buf_v), 0)
        skel  = np.expand_dims(np.array(buf_s), 0)

        prob = float(model.predict([video, skel], verbose=0)[0][0])
        label = 1 if prob > THRESHOLD else 0

        text = "SIGN DETECTED" if label == 1 else "NO SIGN"
        color = (0, 255, 0) if label == 1 else (0, 0, 255)

        cv2.putText(
            frame,
            f"{text} ({prob:.2f})",
            (20, 50),
            cv2.FONT_HERSHEY_SIMPLEX,
            1.1,
            color,
            3
        )

    cv2.imshow("SignBridge – Binary Live", frame)

    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

# ===============================
# CLEANUP
# ===============================
cap.release()
cv2.destroyAllWindows()
hands.close()
print("👋 Inference stopped")
