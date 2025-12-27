#!/bin/bash

# Start the ASL Model API Server

echo ""
echo "============================================"
echo "ASL Model API Server Startup"
echo "============================================"
echo ""

# Activate the conda environment
echo "[INFO] Activating asl310 environment..."
source activate asl310 2>/dev/null || conda activate asl310

# Check if required packages are installed
echo "[INFO] Checking dependencies..."
pip show flask flask-cors tensorflow > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "[INFO] Installing required packages..."
    pip install flask flask-cors tensorflow pillow opencv-python
fi

# Start the API server
echo ""
echo "[INFO] Starting ASL Model API Server on http://localhost:5000"
echo "[INFO] Models will be loaded automatically..."
echo ""

python "$(dirname "$0")/scripts/model_api_server.py"

if [ $? -ne 0 ]; then
    echo ""
    echo "[ERROR] Server failed to start!"
    echo ""
    exit 1
fi
