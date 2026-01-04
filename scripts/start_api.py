#!/usr/bin/env python3
"""
Simple test to run the API server
"""
import os
import sys

print("[TEST] Starting API server test...")
print(f"[TEST] Current directory: {os.getcwd()}")
print(f"[TEST] Python version: {sys.version}")

# Test imports
print("\n[TEST] Testing imports...")
try:
    import flask
    print("✓ Flask imported")
except Exception as e:
    print(f"✗ Flask import failed: {e}")
    sys.exit(1)

try:
    import flask_cors
    print("✓ Flask-CORS imported")
except Exception as e:
    print(f"✗ Flask-CORS import failed: {e}")
    sys.exit(1)

try:
    import tensorflow as tf
    print("✓ TensorFlow imported")
except Exception as e:
    print(f"✗ TensorFlow import failed: {e}")
    sys.exit(1)

# Test model loading
print("\n[TEST] Testing model loading...")
from pathlib import Path

models_dir = Path("notebooks/Saved_models")
print(f"[TEST] Models directory: {models_dir}")
print(f"[TEST] Exists: {models_dir.exists()}")

if models_dir.exists():
    files = list(models_dir.glob("*.keras"))
    print(f"[TEST] Found {len(files)} .keras files:")
    for f in files:
        size_mb = f.stat().st_size / (1024*1024)
        print(f"      - {f.name} ({size_mb:.1f} MB)")

# Now run the actual server
print("\n[TEST] Starting Flask server...")
print("=" * 60)

from scripts.model_api_server import app

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
