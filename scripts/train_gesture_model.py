"""
SignBridge LSTM Gesture Recognition Model Training
Trains an LSTM classifier on extracted MediaPipe keypoints
"""

import os
import numpy as np
import pandas as pd
from pathlib import Path
import json
from datetime import datetime

# sklearn
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix

# Try to import TensorFlow/Keras, fallback to simple implementation if not available
try:
    import tensorflow as tf
    from tensorflow import keras
    from tensorflow.keras import layers, Sequential
    TENSORFLOW_AVAILABLE = True
except ImportError:
    print("[v0] TensorFlow not available, using scikit-learn models only")
    TENSORFLOW_AVAILABLE = False
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.preprocessing import LabelEncoder

def load_keypoints_from_csv_directory(base_path: str) -> dict:
    """
    Load all keypoint CSV files organized by gesture class
    Returns: {gesture_name: [(features, label), ...]}
    """
    data = {}
    base_path = Path(base_path)
    
    for gesture_dir in base_path.iterdir():
        if not gesture_dir.is_dir():
            continue
            
        gesture_name = gesture_dir.name
        gesture_data = []
        
        # Read all CSV files for this gesture
        for csv_file in gesture_dir.glob('*.csv'):
            try:
                df = pd.read_csv(csv_file)
                # Extract numeric values (landmarks)
                features = df.values.flatten()
                gesture_data.append(features)
                print(f"[v0] Loaded {csv_file.name} for gesture '{gesture_name}'")
            except Exception as e:
                print(f"[v0] Error loading {csv_file}: {e}")
        
        if gesture_data:
            data[gesture_name] = gesture_data
            print(f"[v0] Loaded {len(gesture_data)} samples for gesture '{gesture_name}'")
    
    return data

def prepare_training_data(gesture_data: dict) -> tuple:
    """
    Convert gesture data dictionary to training arrays
    Returns: (X, y) where X is features and y is labels
    """
    X = []
    y = []
    
    for gesture_idx, (gesture_name, samples) in enumerate(gesture_data.items()):
        for sample in samples:
            X.append(sample)
            y.append(gesture_idx)
    
    X = np.array(X, dtype=np.float32)
    y = np.array(y, dtype=np.int32)
    
    print(f"[v0] Training data shape: X={X.shape}, y={y.shape}")
    return X, y

def build_lstm_model(input_shape: int, num_classes: int) -> keras.Model:
    """
    Build LSTM model for gesture classification
    CHANGE: Create sequential LSTM architecture
    """
    model = Sequential([
        layers.Reshape((21, 4), input_shape=(input_shape,)),
        layers.LSTM(64, activation='relu', return_sequences=True),
        layers.Dropout(0.2),
        layers.LSTM(32, activation='relu'),
        layers.Dropout(0.2),
        layers.Dense(64, activation='relu'),
        layers.Dropout(0.2),
        layers.Dense(num_classes, activation='softmax')
    ])
    
    model.compile(
        optimizer='adam',
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )
    
    return model

def train_lstm_model(X: np.ndarray, y: np.ndarray, num_classes: int) -> dict:
    """
    Train LSTM model and return history
    """
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    
    print(f"[v0] Train set: {X_train.shape}, Test set: {X_test.shape}")
    
    model = build_lstm_model(X.shape[1], num_classes)
    
    history = model.fit(
        X_train, y_train,
        validation_split=0.2,
        epochs=50,
        batch_size=16,
        verbose=1
    )
    
    # Evaluate
    test_loss, test_accuracy = model.evaluate(X_test, y_test)
    y_pred = np.argmax(model.predict(X_test), axis=1)
    
    print(f"[v0] Test Accuracy: {test_accuracy:.4f}")
    print(f"[v0] Classification Report:\n{classification_report(y_test, y_pred)}")
    
    return {
        'model': model,
        'test_accuracy': float(test_accuracy),
        'history': history.history,
        'X_test': X_test,
        'y_test': y_test,
        'y_pred': y_pred
    }

def train_random_forest_model(X: np.ndarray, y: np.ndarray) -> dict:
    """
    CHANGE: Fallback to Random Forest if TensorFlow unavailable
    Lightweight alternative for CPU-only environments
    """
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    
    print(f"[v0] Training Random Forest model...")
    model = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
    model.fit(X_train, y_train)
    
    # Evaluate
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    
    print(f"[v0] Test Accuracy: {accuracy:.4f}")
    print(f"[v0] Classification Report:\n{classification_report(y_test, y_pred)}")
    
    return {
        'model': model,
        'test_accuracy': float(accuracy),
        'X_test': X_test,
        'y_test': y_test,
        'y_pred': y_pred
    }

def save_model_and_metadata(results: dict, gesture_names: list, output_dir: str):
    """
    Save trained model and metadata for inference
    """
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    # Save model
    if TENSORFLOW_AVAILABLE:
        model_path = output_path / 'gesture_model.h5'
        results['model'].save(model_path)
        print(f"[v0] Model saved to {model_path}")
    else:
        import pickle
        model_path = output_path / 'gesture_model.pkl'
        with open(model_path, 'wb') as f:
            pickle.dump(results['model'], f)
        print(f"[v0] Model saved to {model_path}")
    
    # Save metadata
    metadata = {
        'gesture_classes': gesture_names,
        'model_type': 'LSTM' if TENSORFLOW_AVAILABLE else 'RandomForest',
        'accuracy': results['test_accuracy'],
        'num_gestures': len(gesture_names),
        'training_date': datetime.now().isoformat(),
        'feature_dimension': 84,  # 21 landmarks * 4 values
    }
    
    metadata_path = output_path / 'model_metadata.json'
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)
    print(f"[v0] Metadata saved to {metadata_path}")
    
    return metadata

def main():
    # CHANGE: Configure paths for gesture data
    base_data_dir = './public/data/keypoints'
    output_dir = './public/models'
    
    print(f"[v0] Loading keypoint data from {base_data_dir}...")
    
    if not os.path.exists(base_data_dir):
        print(f"[v0] ERROR: Data directory not found at {base_data_dir}")
        print(f"[v0] Please run data collection and keypoint extraction first")
        return
    
    # Load data
    gesture_data = load_keypoints_from_csv_directory(base_data_dir)
    
    if not gesture_data:
        print(f"[v0] ERROR: No gesture data found")
        return
    
    gesture_names = list(gesture_data.keys())
    print(f"[v0] Found {len(gesture_names)} gesture classes: {gesture_names}")
    
    # Prepare training data
    X, y = prepare_training_data(gesture_data)
    
    # Standardize features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # Train model
    if TENSORFLOW_AVAILABLE:
        print(f"[v0] Training LSTM model...")
        results = train_lstm_model(X_scaled, y, len(gesture_names))
    else:
        print(f"[v0] Training Random Forest model (TensorFlow not available)...")
        results = train_random_forest_model(X_scaled, y)
    
    # Save model and metadata
    save_model_and_metadata(results, gesture_names, output_dir)
    
    print(f"[v0] Training complete!")

if __name__ == '__main__':
    main()
