#!/usr/bin/env python3
"""
Simplified Integration Verification
Quick check of essential components
"""

import os
import sys

def check(description, condition):
    """Print check result"""
    icon = "✅" if condition else "❌"
    print(f"{icon} {description}")
    return condition

print("\n" + "="*60)
print("  SAMVAD SETU - INTEGRATION VERIFICATION")
print("="*60 + "\n")

all_pass = True

# Check models
print("📦 MODELS:")
models = [
    ('notebooks/Saved_models/final_asl_model-training-optimized.keras', 'ASL Alphabet Model'),
    ('notebooks/Saved_models/final_sign_mnist_cnn.keras', 'Sign MNIST Model'),
    ('notebooks/Saved_models/HAGRID_best_model.keras', 'HaGRID Model'),
]
for path, name in models:
    exists = os.path.exists(path)
    size = f" [{os.path.getsize(path) / (1024**2):.1f} MB]" if exists else ""
    all_pass &= check(f"  {name}{size}", exists)

# Check Python packages
print("\n📚 DEPENDENCIES:")
packages = ['tensorflow', 'flask', 'flask_cors', 'cv2', 'PIL', 'numpy']
for pkg in packages:
    try:
        __import__(pkg)
        all_pass &= check(f"  {pkg}", True)
    except ImportError:
        all_pass &= check(f"  {pkg}", False)

# Check scripts
print("\n🔧 SCRIPTS:")
scripts = [
    ('scripts/model_api_server.py', 'Flask API Server'),
    ('START_MODEL_API.bat', 'Windows Startup'),
    ('START_MODEL_API.sh', 'Linux/Mac Startup'),
    ('verify_integration_simple.py', 'This Verification Script'),
]
for path, name in scripts:
    exists = os.path.exists(path)
    all_pass &= check(f"  {name}", exists)

# Check documentation
print("\n📖 DOCUMENTATION:")
docs = [
    ('README_INTEGRATION.md', 'Integration Guide'),
    ('INTEGRATION_QUICK_START.md', 'Quick Start'),
    ('COMPLETE_INTEGRATION_README.md', 'Complete README'),
]
for path, name in docs:
    exists = os.path.exists(path)
    all_pass &= check(f"  {name}", exists)

# Check directories
print("\n📁 DIRECTORIES:")
dirs = [
    ('scripts', 'Scripts'),
    ('notebooks/Saved_models', 'Models'),
    ('components', 'Components'),
    ('app', 'App'),
    ('public', 'Public'),
]
for path, name in dirs:
    exists = os.path.isdir(path)
    all_pass &= check(f"  {name}", exists)

# Summary
print("\n" + "="*60)
if all_pass:
    print("✅ ALL CHECKS PASSED - SYSTEM READY!")
    print("\n🚀 NEXT STEPS:")
    print("  1. START_MODEL_API.bat")
    print("  2. npm run dev")
    print("  3. http://localhost:3000/recognize")
else:
    print("⚠️  SOME CHECKS FAILED")
    print("\n🔧 COMMON FIXES:")
    print("  pip install flask flask-cors tensorflow pillow opencv-python")
print("="*60 + "\n")

sys.exit(0 if all_pass else 1)
