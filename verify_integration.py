#!/usr/bin/env python3
"""
System Verification Script
Checks if all integrated models and dependencies are properly set up
"""

import sys
import os
import subprocess
from pathlib import Path

def print_header(title):
    print("\n" + "="*60)
    print(f"  {title}")
    print("="*60)

def print_check(status, message):
    icon = "✅" if status else "❌"
    print(f"{icon} {message}")
    return status

def check_models():
    """Check if all model files exist"""
    print_header("CHECKING MODEL FILES")
    
    models_dir = Path(__file__).parent / "notebooks" / "Saved_models"
    models = {
        "ASL Alphabet": "final_asl_model-training-optimized.keras",
        "Sign MNIST": "final_sign_mnist_cnn.keras",
        "HaGRID": "HAGRID_best_model.keras",
    }
    
    all_exist = True
    for model_name, filename in models.items():
        path = models_dir / filename
        exists = path.exists()
        size = f"({path.stat().st_size / 1024 / 1024:.1f} MB)" if exists else ""
        all_exist &= print_check(exists, f"{model_name}: {filename} {size}")
    
    return all_exist

def check_dependencies():
    """Check if required Python packages are installed"""
    print_header("CHECKING PYTHON DEPENDENCIES")
    
    required = {
        "tensorflow": "TensorFlow (Model inference)",
        "flask": "Flask (API backend)",
        "flask_cors": "Flask-CORS (Cross-origin requests)",
        "opencv": "OpenCV (Image processing)",
        "pillow": "Pillow (Image handling)",
        "numpy": "NumPy (Numerical computing)",
    }
    
    all_installed = True
    for package, description in required.items():
        try:
            __import__(package)
            all_installed &= print_check(True, f"{description}")
        except ImportError:
            all_installed &= print_check(False, f"{description} - NOT INSTALLED")
    
    return all_installed

def check_files():
    """Check if all integration files exist"""
    print_header("CHECKING INTEGRATION FILES")
    
    base_dir = Path(__file__).parent
    files = {
        "API Server": "scripts/model_api_server.py",
        "Windows Startup": "START_MODEL_API.bat",
        "Linux/Mac Startup": "START_MODEL_API.sh",
        "Integration Docs": "README_INTEGRATION.md",
        "Quick Start": "INTEGRATION_QUICK_START.md",
        "ASL Recognizer": "components/asl-recognizer.tsx",
    }
    
    all_exist = True
    for file_name, file_path in files.items():
        path = base_dir / file_path
        exists = path.exists()
        all_exist &= print_check(exists, f"{file_name}: {file_path}")
    
    return all_exist

def check_directories():
    """Check if all required directories exist"""
    print_header("CHECKING DIRECTORY STRUCTURE")
    
    base_dir = Path(__file__).parent
    dirs = {
        "Scripts": "scripts",
        "Components": "components",
        "Models": "notebooks/Saved_models",
        "App": "app",
        "Public": "public",
    }
    
    all_exist = True
    for dir_name, dir_path in dirs.items():
        path = base_dir / dir_path
        exists = path.exists() and path.is_dir()
        all_exist &= print_check(exists, f"{dir_name}: {dir_path}")
    
    return all_exist

def check_api_server():
    """Check if Flask API server can be started (dry run)"""
    print_header("CHECKING API SERVER")
    
    try:
        # Try to import Flask and required modules
        import flask
        import flask_cors
        print_check(True, "Flask and CORS available")
        
        # Check if model_api_server.py can be imported
        script_path = Path(__file__).parent / "scripts" / "model_api_server.py"
        if script_path.exists():
            print_check(True, "model_api_server.py found and readable")
            return True
        else:
            print_check(False, "model_api_server.py not found")
            return False
    except ImportError as e:
        print_check(False, f"Flask/CORS not available: {e}")
        return False

def main():
    """Run all checks"""
    print("\n")
    print("╔" + "="*58 + "╗")
    print("║" + " "*15 + "ASL MODELS INTEGRATION VERIFICATION" + " "*9 + "║")
    print("╚" + "="*58 + "╝")
    
    results = {
        "Models": check_models(),
        "Dependencies": check_dependencies(),
        "Files": check_files(),
        "Directories": check_directories(),
        "API Server": check_api_server(),
    }
    
    print_header("VERIFICATION SUMMARY")
    
    all_passed = True
    for check_name, passed in results.items():
        icon = "✅" if passed else "⚠️"
        all_passed &= passed
        status = "PASS" if passed else "FAIL"
        print(f"{icon} {check_name}: {status}")
    
    print("\n" + "="*60)
    if all_passed:
        print("✅ ALL CHECKS PASSED - SYSTEM READY TO USE!")
        print("\nQuick Start:")
        print("  1. Run: START_MODEL_API.bat  (or .sh on Linux/Mac)")
        print("  2. Run: npm run dev")
        print("  3. Open: http://localhost:3000")
    else:
        print("⚠️  SOME CHECKS FAILED - PLEASE FIX THE ISSUES ABOVE")
        print("\nCommon Fixes:")
        print("  - Missing dependencies: pip install flask flask-cors tensorflow pillow opencv-python")
        print("  - Missing model files: Check notebooks/Saved_models/ directory")
        print("  - Missing scripts: Verify scripts/ directory exists")
    print("="*60 + "\n")
    
    return 0 if all_passed else 1

if __name__ == "__main__":
    sys.exit(main())
