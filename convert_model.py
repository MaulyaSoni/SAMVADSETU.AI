#!/usr/bin/env python3
"""
Convert SavedModel to TensorFlow.js format
Run this script to convert the ASL model
"""

import os
import subprocess
import sys

def convert_model():
    """Convert SavedModel to TFJS format"""
    
    saved_model_path = os.path.join(os.getcwd(), "notebooks", "models", "saved_model")
    output_path = os.path.join(os.getcwd(), "public", "models")
    
    if not os.path.exists(saved_model_path):
        print(f"❌ SavedModel not found at: {saved_model_path}")
        return False
    
    print(f"Converting SavedModel from: {saved_model_path}")
    print(f"Output directory: {output_path}")
    
    try:
        # Run tensorflowjs converter
        cmd = [
            sys.executable, "-m", "tensorflowjs",
            "--input_format", "tf_saved_model",
            "--output_format", "tfjs_graph_model",
            saved_model_path,
            output_path
        ]
        
        print(f"\nRunning: {' '.join(cmd)}\n")
        result = subprocess.run(cmd, check=True, capture_output=True, text=True)
        
        print(result.stdout)
        if result.returncode == 0:
            print("✅ Conversion successful!")
            print(f"Model files created in: {output_path}")
            return True
        else:
            print(f"❌ Conversion failed: {result.stderr}")
            return False
            
    except subprocess.CalledProcessError as e:
        print(f"❌ Error during conversion: {e}")
        print(f"STDOUT: {e.stdout}")
        print(f"STDERR: {e.stderr}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

if __name__ == "__main__":
    success = convert_model()
    sys.exit(0 if success else 1)
