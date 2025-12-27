"""
API endpoint for unified model inference
Handles predictions from all integrated models
"""

import io
import json
import base64
import numpy as np
import cv2
from PIL import Image
from flask import Blueprint, request, jsonify
import sys
from pathlib import Path

# Add scripts directory to path
sys.path.insert(0, str(Path(__file__).parent.parent / "scripts"))

from unified_model_loader import get_model_loader

model_api = Blueprint('model_api', __name__, url_prefix='/api/v1/models')

@model_api.route('/health', methods=['GET'])
def health_check():
    """Check if models are loaded and healthy"""
    loader = get_model_loader()
    return jsonify(loader.health_check()), 200

@model_api.route('/available', methods=['GET'])
def get_available_models():
    """Get list of available models"""
    loader = get_model_loader()
    return jsonify({
        "status": "success",
        "models": loader.get_available_models()
    }), 200

@model_api.route('/predict', methods=['POST'])
def predict():
    """
    Make a prediction using the specified model
    
    Expected JSON:
    {
        "image": "<base64_encoded_image>",
        "model": "asl_alphabet",  # or "sign_mnist", "hagrid"
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
            image = Image.open(io.BytesIO(image_data))
            image = np.array(image)
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

@model_api.route('/predict/url', methods=['POST'])
def predict_from_url():
    """
    Make a prediction from an image URL or file path
    
    Expected JSON:
    {
        "path": "/path/to/image.jpg",
        "model": "asl_alphabet",
        "confidence_threshold": 0.5
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'path' not in data:
            return jsonify({
                "error": "Missing 'path' in request",
                "success": False
            }), 400
        
        # Load image
        image_path = data['path']
        if not Path(image_path).exists():
            return jsonify({
                "error": f"Image file not found: {image_path}",
                "success": False
            }), 404
        
        try:
            image = cv2.imread(image_path)
            if image is None:
                raise ValueError("Failed to read image")
            image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        except Exception as e:
            return jsonify({
                "error": f"Failed to read image: {str(e)}",
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

@model_api.route('/compare', methods=['POST'])
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
            image = Image.open(io.BytesIO(image_data))
            image = np.array(image)
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
            "predictions": results,
            "compared_models": list(results.keys())
        }), 200
    
    except Exception as e:
        return jsonify({
            "error": str(e),
            "success": False
        }), 500
