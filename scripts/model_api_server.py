"""
Unified Model API Backend - Flask Server
Integrates all ASL recognition models and serves predictions via REST API
"""

import os
import sys
import json
import base64
import numpy as np
import cv2
from pathlib import Path
from io import BytesIO
from PIL import Image
import tensorflow as tf
from flask import Flask, request, jsonify, Blueprint
from flask_cors import CORS
from datetime import datetime

# Add scripts to path
sys.path.insert(0, str(Path(__file__).parent / "scripts"))

app = Flask(__name__)
CORS(app)

# ==================== MODEL LOADER ====================

class UnifiedModelLoader:
    """Unified loader for all ASL recognition models"""
    
    def __init__(self):
        self.models = {}
        self.model_configs = {}
        # Path should go up one level from scripts/ to reach notebooks/
        self.models_dir = Path(__file__).parent.parent / "notebooks" / "Saved_models"
        self.load_all_models()
    
    def load_all_models(self):
        """Load all available models"""
        model_files = {
            # TEMPORARILY DISABLED: ASL model has batch normalization architecture issue
            # "asl_alphabet": "final_asl_model-training-optimized.keras",
            "sign_mnist": "final_sign_mnist_cnn.keras",
            "hagrid": "HAGRID_best_model.keras",
        }
        
        for model_name, filename in model_files.items():
            model_path = self.models_dir / filename
            if model_path.exists():
                try:
                    print(f"[INFO] Loading {model_name} from {filename}...")
                    # Try standard loading first
                    try:
                        model = tf.keras.models.load_model(str(model_path), compile=False)
                    except Exception as e:
                        # Try with safe_mode=False for compatibility issues
                        print(f"[WARNING] Standard load failed, trying safe_mode=False...")
                        try:
                            model = tf.keras.models.load_model(str(model_path), compile=False, safe_mode=False)
                        except Exception as e2:
                            # Skip this model if all loading methods fail
                            raise Exception(f"Both loading methods failed: {e} | {e2}")
                    self.models[model_name] = model
                    self.model_configs[model_name] = self._get_model_info(model, model_name)
                    print(f"[SUCCESS] {model_name} loaded successfully")
                except Exception as e:
                    print(f"[ERROR] Failed to load {model_name}: {str(e)[:100]}")
                    # Continue with next model instead of crashing
                    continue
            else:
                print(f"[WARNING] Model file not found: {filename}")
    
    def _get_model_info(self, model, model_name):
        """Extract model information"""
        config = {
            "name": model_name,
            "input_shape": model.input_shape,
            "output_shape": model.output_shape,
            "params": int(model.count_params()),
            "timestamp": datetime.now().isoformat(),
        }
        
        # Define class names for each model
        if model_name == "asl_alphabet":
            config["classes"] = sorted([
                "A","B","C","D","E","F","G","H","I","J",
                "K","L","M","N","O","P","Q","R","S","T",
                "U","V","W","X","Y","Z","del","nothing","space"
            ])
        elif model_name == "sign_mnist":
            config["classes"] = sorted([
                "A","B","C","D","E","F","G","H","I","J",
                "K","L","M","N","O","P","Q","R","S","T",
                "U","V","W","X","Y","Z"
            ])
        elif model_name == "hagrid":
            config["classes"] = ["hand", "no_hand"]
        
        return config
    
    def predict(self, image, model_name="asl_alphabet", confidence_threshold=0.5):
        """
        Make a prediction using specified model
        
        Args:
            image: Input image (numpy array)
            model_name: Which model to use
            confidence_threshold: Minimum confidence for prediction
        
        Returns:
            dict with prediction results
        """
        if model_name not in self.models:
            return {
                "error": f"Model '{model_name}' not found",
                "available_models": list(self.models.keys()),
                "success": False
            }
        
        try:
            model = self.models[model_name]
            config = self.model_configs[model_name]
            
            # Convert to RGB if grayscale
            if len(image.shape) == 2:
                image = cv2.cvtColor(image, cv2.COLOR_GRAY2RGB)
            elif image.shape[2] == 4:
                image = cv2.cvtColor(image, cv2.COLOR_RGBA2RGB)
            
            # Normalize image
            image = image.astype("float32") / 255.0
            
            # Ensure correct shape
            expected_shape = config["input_shape"][1:]
            if image.shape != expected_shape:
                image = self._resize_image(image, expected_shape)
            
            # Make prediction
            pred = model.predict(image[None, ...], verbose=0)
            
            # Get top prediction
            idx = np.argmax(pred[0])
            confidence = float(pred[0][idx])
            
            result = {
                "model": model_name,
                "prediction": config["classes"][idx],
                "confidence": confidence,
                "confidence_percent": f"{confidence*100:.2f}%",
                "all_predictions": {
                    config["classes"][i]: float(pred[0][i]) 
                    for i in range(len(config["classes"]))
                },
                "success": True
            }
            
            if confidence < confidence_threshold:
                result["warning"] = f"Low confidence: {confidence:.2%}"
            
            return result
        
        except Exception as e:
            return {
                "error": str(e),
                "model": model_name,
                "success": False
            }
    
    def _resize_image(self, image, target_shape):
        """Resize image to target shape"""
        if len(target_shape) == 3:  # (H, W, C)
            h, w, c = target_shape
            resized = cv2.resize(image, (w, h))
            if resized.ndim == 2:
                resized = np.stack([resized] * c, axis=-1)
            return resized
        else:
            return image
    
    def get_available_models(self):
        """Get list of available models with their info"""
        return {
            name: {
                "input_shape": config["input_shape"],
                "output_shape": config["output_shape"],
                "classes": config.get("classes", []),
                "params": config["params"],
                "num_classes": len(config.get("classes", []))
            }
            for name, config in self.model_configs.items()
        }
    
    def health_check(self):
        """Check health of all models"""
        return {
            "status": "healthy" if self.models else "no_models",
            "timestamp": datetime.now().isoformat(),
            "loaded_models": list(self.models.keys()),
            "models_info": self.get_available_models()
        }


# Global instance
model_loader = None

def get_model_loader():
    """Get or create the global model loader instance"""
    global model_loader
    if model_loader is None:
        model_loader = UnifiedModelLoader()
    return model_loader


# ==================== API ROUTES ====================

@app.route('/api/models/health', methods=['GET'])
def health_check():
    """Check if models are loaded and healthy"""
    loader = get_model_loader()
    return jsonify(loader.health_check()), 200


@app.route('/api/models/available', methods=['GET'])
def get_available_models():
    """Get list of available models"""
    loader = get_model_loader()
    return jsonify({
        "status": "success",
        "timestamp": datetime.now().isoformat(),
        "models": loader.get_available_models()
    }), 200


@app.route('/api/models/predict', methods=['POST'])
def predict():
    """
    Make a prediction using the specified model
    
    Expected JSON:
    {
        "image": "<base64_encoded_image>",
        "model": "asl_alphabet",
        "confidence_threshold": 0.5
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'image' not in data:
            return jsonify({
                "error": "Missing 'image' in request",
                "success": False
            }), 400
        
        # Decode image
        try:
            image_data = base64.b64decode(data['image'])
            image = Image.open(BytesIO(image_data))
            image = np.array(image)
            # Keep as RGB - model was trained on RGB images
        except Exception as e:
            return jsonify({
                "error": f"Invalid image data: {str(e)}",
                "success": False
            }), 400
        
        # Get parameters
        model_name = data.get('model', 'asl_alphabet')
        confidence_threshold = float(data.get('confidence_threshold', 0.5))
        
        # Make prediction
        loader = get_model_loader()
        result = loader.predict(image, model_name, confidence_threshold)
        
        return jsonify(result), 200 if result.get('success', True) else 400
    
    except Exception as e:
        return jsonify({
            "error": str(e),
            "success": False
        }), 500


@app.route('/api/models/compare', methods=['POST'])
def compare_predictions():
    """
    Get predictions from multiple models for comparison
    
    Expected JSON:
    {
        "image": "<base64_encoded_image>",
        "models": ["asl_alphabet", "sign_mnist"],
        "confidence_threshold": 0.5
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'image' not in data:
            return jsonify({
                "error": "Missing 'image' in request",
                "success": False
            }), 400
        
        # Decode image
        try:
            image_data = base64.b64decode(data['image'])
            image = Image.open(BytesIO(image_data))
            image = np.array(image)
            # Keep as RGB - model was trained on RGB images
        except Exception as e:
            return jsonify({
                "error": f"Invalid image data: {str(e)}",
                "success": False
            }), 400
        
        # Get parameters
        models = data.get('models', ['asl_alphabet', 'sign_mnist'])
        confidence_threshold = float(data.get('confidence_threshold', 0.5))
        
        # Get predictions from all models
        loader = get_model_loader()
        results = {}
        
        for model_name in models:
            results[model_name] = loader.predict(image, model_name, confidence_threshold)
        
        return jsonify({
            "status": "success",
            "timestamp": datetime.now().isoformat(),
            "predictions": results,
            "compared_models": list(results.keys())
        }), 200
    
    except Exception as e:
        return jsonify({
            "error": str(e),
            "success": False
        }), 500


@app.route('/api/models/status', methods=['GET'])
def model_status():
    """Get detailed status of all models"""
    loader = get_model_loader()
    return jsonify({
        "status": "success",
        "timestamp": datetime.now().isoformat(),
        "health": loader.health_check()
    }), 200


@app.route('/health', methods=['GET'])
def app_health():
    """Check API server health"""
    return jsonify({
        "status": "healthy",
        "service": "ASL Model API",
        "timestamp": datetime.now().isoformat()
    }), 200


if __name__ == '__main__':
    print("[INFO] Starting ASL Model API Server...")
    print("[INFO] Loading models...")
    get_model_loader()  # Pre-load models on startup
    print("[INFO] Server ready. Starting Flask...")
    app.run(host='0.0.0.0', port=5000, debug=False)
