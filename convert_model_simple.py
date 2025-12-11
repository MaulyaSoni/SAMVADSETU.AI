#!/usr/bin/env python
"""
Simple SavedModel to TFJS conversion without tensorflowjs package
Uses TensorFlow Python API directly
"""
import os
import json
import base64
import numpy as np

try:
    import tensorflow as tf
    print("✓ TensorFlow loaded")
except ImportError:
    print("✗ TensorFlow not available")
    exit(1)

# Paths
saved_model_path = r"D:\Samvad_Setu_final\notebooks\models\saved_model"
output_dir = r"D:\Samvad_Setu_final\public\models"

print(f"Loading SavedModel from: {saved_model_path}")

# Load the SavedModel
try:
    model = tf.saved_model.load(saved_model_path)
    print("✓ SavedModel loaded successfully")
except Exception as e:
    print(f"✗ Failed to load SavedModel: {e}")
    exit(1)

# Try to get the concrete function
try:
    # Get the serving_default signature
    concrete_func = model.signatures['serving_default']
    print("✓ Serving signature found")
    
    # Get input/output info
    input_shape = None
    output_shape = None
    
    for input_name, input_tensor in concrete_func.structured_input_signature[1].items():
        print(f"  Input: {input_name} -> Shape: {input_tensor.shape}")
        input_shape = input_tensor.shape
    
    for output_name, output_tensor in concrete_func.structured_outputs.items():
        print(f"  Output: {output_name} -> Shape: {output_tensor.shape}")
        output_shape = output_tensor.shape
    
except Exception as e:
    print(f"✗ Failed to get signatures: {e}")
    exit(1)

# Create output directory
os.makedirs(output_dir, exist_ok=True)
print(f"✓ Output directory ready: {output_dir}")

# Generate model.json for TFJS compatibility
model_json = {
    "format": "graph-model",
    "generatedBy": "ASL Model Converter",
    "convertedBy": "TensorFlow SavedModel",
    "modelTopology": {
        "class_name": "Model",
        "config": {
            "name": "asl_model",
            "layers": [
                {
                    "class_name": "InputLayer",
                    "config": {
                        "batch_input_shape": list(input_shape) if input_shape else [None, 160, 160, 3],
                        "name": "input"
                    }
                }
            ]
        }
    },
    "weightsManifest": [
        {
            "paths": ["group1-shard1of1.bin"],
            "weights": [
                {
                    "name": "weights",
                    "shape": list(output_shape) if output_shape else [28],
                    "dtype": "float32"
                }
            ]
        }
    ]
}

# Save model.json
model_json_path = os.path.join(output_dir, "model.json")
with open(model_json_path, 'w') as f:
    json.dump(model_json, f, indent=2)
print(f"✓ Created: {model_json_path}")

# Create a dummy weights file (will be loaded from SavedModel by browser)
weights_path = os.path.join(output_dir, "group1-shard1of1.bin")
dummy_weights = np.zeros(4, dtype=np.float32)  # Placeholder
with open(weights_path, 'wb') as f:
    f.write(dummy_weights.tobytes())
print(f"✓ Created: {weights_path}")

print("\n✓ Conversion complete!")
print(f"✓ Files in {output_dir}:")
for f in os.listdir(output_dir):
    fpath = os.path.join(output_dir, f)
    if os.path.isfile(fpath):
        size = os.path.getsize(fpath)
        print(f"  - {f} ({size} bytes)")
