# Unified Models Integration Guide

## Overview
All trained ASL recognition models are now integrated into a single unified system that works with both the web app and command-line tools.

## Models Integrated

### 1. **ASL Alphabet Model** (`asl_alphabet`)
- **File**: `final_asl_model-training-optimized.keras`
- **Input**: 160x160 RGB images
- **Classes**: 29 (A-Z + del, nothing, space)
- **Status**: ✅ Ready

### 2. **Sign Language MNIST Model** (`sign_mnist`)
- **File**: `final_sign_mnist_cnn.keras`
- **Input**: Variable size RGB images
- **Classes**: 26 (A-Z)
- **Status**: ✅ Ready

### 3. **HaGRID Model** (`hagrid`)
- **File**: `HAGRID_best_model.keras`
- **Input**: Variable size images
- **Classes**: 2 (hand, no_hand)
- **Status**: ✅ Ready

## Architecture

```
┌─────────────────────────────────────────────────────┐
│              Web Application (Next.js)              │
│          (asl-recognizer component)                 │
└──────────────────┬──────────────────────────────────┘
                   │
        ┌──────────▼──────────┐
        │  Backend API Server │
        │  (Flask, Port 5000) │
        └──────────┬──────────┘
                   │
        ┌──────────▼──────────┐
        │ Unified Model Loader│
        │   (model_api_      │
        │   server.py)        │
        └──────────┬──────────┘
                   │
        ┌──────────▼──────────────────────────────┐
        │      Model Files (Keras .keras)        │
        ├─────────────────────────────────────────┤
        │ • ASL Alphabet Model                    │
        │ • Sign Language MNIST Model             │
        │ • HaGRID Model                          │
        └─────────────────────────────────────────┘
```

## How to Use

### Option 1: Automatic (Recommended)

1. **Start the Model API Server:**
   ```bash
   # Windows
   START_MODEL_API.bat

   # Linux/Mac
   ./START_MODEL_API.sh
   ```

2. **Start the Web App:**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

3. **Access the app:**
   - Open http://localhost:3000
   - Go to the Recognize page
   - The app will automatically use the backend API for predictions

### Option 2: Manual Setup

1. **Install dependencies:**
   ```bash
   # For the API server
   pip install flask flask-cors tensorflow pillow opencv-python

   # For the web app
   npm install
   ```

2. **Start API Server:**
   ```bash
   conda activate asl310
   python scripts/model_api_server.py
   ```

3. **In another terminal, start the web app:**
   ```bash
   npm run dev
   ```

## API Endpoints

All endpoints are available at `http://localhost:5000/api/models/`

### Health Check
```
GET /api/models/health
```
Returns status and loaded models.

### Get Available Models
```
GET /api/models/available
```
Lists all available models with their configuration.

### Make Prediction
```
POST /api/models/predict

Body:
{
  "image": "<base64_encoded_image>",
  "model": "asl_alphabet",  // or "sign_mnist", "hagrid"
  "confidence_threshold": 0.5
}

Response:
{
  "model": "asl_alphabet",
  "prediction": "A",
  "confidence": 0.95,
  "confidence_percent": "95.00%",
  "all_predictions": {
    "A": 0.95,
    "B": 0.02,
    ...
  },
  "success": true
}
```

### Compare Multiple Models
```
POST /api/models/compare

Body:
{
  "image": "<base64_encoded_image>",
  "models": ["asl_alphabet", "sign_mnist"],
  "confidence_threshold": 0.5
}

Response:
{
  "status": "success",
  "predictions": {
    "asl_alphabet": { ... },
    "sign_mnist": { ... }
  },
  "compared_models": ["asl_alphabet", "sign_mnist"]
}
```

### Model Status
```
GET /api/models/status
```
Returns detailed status of all models.

## Web App Integration

The web app has been updated to:

1. **Try backend API first** - Sends image to Flask server for fast GPU inference
2. **Fallback to client-side** - If API is unavailable, uses TensorFlow.js in the browser
3. **Display model source** - Shows whether prediction came from backend or client
4. **Show top predictions** - Displays top 3 predictions with confidence scores

### In `asl-recognizer.tsx`:
```typescript
// Backend API call (Fast - uses GPU/CPU from server)
const response = await fetch("http://localhost:5000/api/models/predict", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    image: imageBase64,
    model: "asl_alphabet",
    confidence_threshold: 0.5,
  }),
})

// Fallback: Client-side inference with TensorFlow.js
if (!response.ok) {
  // Uses browser-based TensorFlow.js model
}
```

## Performance Notes

- **Backend API**: Faster for real-time predictions (GPU/CPU optimized)
- **Client-side**: Works offline, no server required
- **Auto-fallback**: Seamless switching if API becomes unavailable

## Troubleshooting

### API Server Won't Start
```bash
# Check port 5000 is available
netstat -ano | findstr :5000  # Windows
lsof -i :5000                 # Linux/Mac

# If port is in use, kill the process or change port in model_api_server.py
```

### Models Not Loading
```bash
# Verify model files exist
ls -la notebooks/Saved_models/

# Check TensorFlow version compatibility
python -c "import tensorflow as tf; print(tf.__version__)"
```

### Connection Refused Error
```bash
# Make sure API server is running
# Check if http://localhost:5000/api/models/health returns 200
curl http://localhost:5000/api/models/health

# If not, restart the API server
```

## Integration Points

### Frontend Integration
- **Component**: `components/asl-recognizer.tsx`
- **API Client**: `lib/unified-model-client.ts` (optional utility)
- **Canvas capture** → **Base64 encoding** → **API request**

### Backend Integration  
- **Server**: `scripts/model_api_server.py`
- **Model Loader**: Built-in `UnifiedModelLoader` class
- **Routes**: Flask endpoints under `/api/models/`

### Model Files
- **Location**: `notebooks/Saved_models/`
- **Formats**: Keras `.keras` files
- **Auto-loading**: All models in directory are auto-discovered

## Next Steps

1. ✅ All models are integrated and ready to use
2. ✅ Web app has dual inference (backend + client-side fallback)
3. ✅ API server provides REST endpoints for external tools
4. 📝 Optional: Deploy to production with proper error handling
5. 📝 Optional: Add database to store predictions/analytics

## File Structure
```
.
├── notebooks/Saved_models/          # Model files
│   ├── final_asl_model-training-optimized.keras
│   ├── final_sign_mnist_cnn.keras
│   └── HAGRID_best_model.keras
├── scripts/
│   └── model_api_server.py          # Flask API server
├── components/
│   └── asl-recognizer.tsx           # Updated with API integration
├── lib/
│   └── unified-model-client.ts      # Optional API client utility
├── START_MODEL_API.bat              # Windows startup script
├── START_MODEL_API.sh               # Linux/Mac startup script
└── README_INTEGRATION.md            # This file
```

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review API responses for error messages
3. Check console logs in browser (F12)
4. Check server logs in terminal running `model_api_server.py`

---

**Last Updated**: 2025-12-27
**Status**: ✅ All models integrated and tested
