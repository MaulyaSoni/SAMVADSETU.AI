import cv2
import numpy as np
import tensorflow as tf
import mediapipe as mp

MODEL_PATH = r"D:\Samvad_Setu_final\notebooks\Saved_models\final_asl_model-training-optimized.keras" 
IMG_SIZE = 160

CLASS_NAMES = sorted([
    "A","B","C","D","E","F","G","H","I","J",
    "K","L","M","N","O","P","Q","R","S","T",
    "U","V","W","X","Y","Z","del","nothing","space"
])

print("[INFO] Loading model...")
model = tf.keras.models.load_model(MODEL_PATH, compile=False)
print("[INFO] Model loaded successfully")

mp_hands = mp.solutions.hands
hands = mp_hands.Hands(
    max_num_hands=1,
    min_detection_confidence=0.6,
    min_tracking_confidence=0.6
)

cap = cv2.VideoCapture(0)
if not cap.isOpened():
    raise RuntimeError("Camera not accessible")

while True:
    ret, frame = cap.read()
    if not ret:
        break

    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    result = hands.process(rgb)

    if result.multi_hand_landmarks:
        h, w, _ = frame.shape
        lm = result.multi_hand_landmarks[0].landmark

        xs = [int(p.x * w) for p in lm]
        ys = [int(p.y * h) for p in lm]

        x1, y1 = max(min(xs)-20, 0), max(min(ys)-20, 0)
        x2, y2 = min(max(xs)+20, w), min(max(ys)+20, h)

        hand = frame[y1:y2, x1:x2]
        if hand.size:
            hand = cv2.resize(hand, (IMG_SIZE, IMG_SIZE))
            hand = hand.astype("float32") / 255.0
            pred = model.predict(hand[None, ...], verbose=0)

            idx = np.argmax(pred)
            label = CLASS_NAMES[idx]

            cv2.rectangle(frame, (x1,y1), (x2,y2), (0,255,0), 2)
            cv2.putText(frame, label, (x1, y1-10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0,255,0), 2)

    cv2.imshow("ASL Recognition", frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
