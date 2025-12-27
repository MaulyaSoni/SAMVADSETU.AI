"""
Unified Model Loader for ASL Recognition
Integrates all trained models into a single interface
"""

import os
import json
import numpy as np
import tensorflow as tf
from pathlib import Path

class UnifiedModelLoader:
    """Unified loader for all ASL recognition models"""
    
    def __init__(self):
        self.models = {}
        self.model_configs = {}
        self.models_dir = Path(__file__).parent.parent / "notebooks" / "Saved_models"
        self.load_all_models()
    
    def load_all_models(self):
        """Load all available models"""
        model_files = {
            "asl_alphabet": "final_asl_model-training-optimized.keras",
            "sign_mnist": "final_sign_mnist_cnn.keras",
            "hagrid": "HAGRID_best_model.keras",
        }
        
        for model_name, filename in model_files.items():
            model_path = self.models_dir / filename
            if model_path.exists():
                try:
                    print(f"[INFO] Loading {model_name} from {filename}...")
                    model = tf.keras.models.load_model(str(model_path), compile=False)
                    self.models[model_name] = model
                    self.model_configs[model_name] = self._get_model_info(model, model_name)
                    print(f"[SUCCESS] {model_name} loaded successfully")
                except Exception as e:
                    print(f"[WARNING] Failed to load {model_name}: {e}")
            else:
                print(f"[WARNING] Model file not found: {filename}")
    
    def _get_model_info(self, model, model_name):
        """Extract model information"""
        config = {
            "name": model_name,
            "input_shape": model.input_shape,
            "output_shape": model.output_shape,
            "params": model.count_params(),
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
                "available_models": list(self.models.keys())
            }
        
        try:
            model = self.models[model_name]
            config = self.model_configs[model_name]
            
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
        import cv2
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
                "params": config["params"]
            }
            for name, config in self.model_configs.items()
        }
    
    def health_check(self):
        """Check health of all models"""
        return {
            "status": "healthy" if self.models else "no_models",
            "loaded_models": list(self.models.keys()),
            "models_info": self.get_available_models()
        }


# Global instance
_model_loader = None

def get_model_loader():
    """Get or create the global model loader instance"""
    global _model_loader
    if _model_loader is None:
        _model_loader = UnifiedModelLoader()
    return _model_loader
