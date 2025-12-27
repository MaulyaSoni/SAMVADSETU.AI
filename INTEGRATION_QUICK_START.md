# 🚀 Quick Start - Unified Models Integration

## ⚡ 5-Minute Setup

### Step 1: Start the Model API Server (5 seconds)

**Windows:**
```bash
START_MODEL_API.bat
```

**Linux/Mac:**
```bash
./START_MODEL_API.sh
```

Wait for output showing:
```
[INFO] Loading asl_alphabet from final_asl_model-training-optimized.keras...
[SUCCESS] asl_alphabet loaded successfully
```

### Step 2: Start the Web App (in another terminal)

```bash
npm run dev
```

Visit: **http://localhost:3000**

### Step 3: Test It! 🎉

1. Click **"Recognize"** in navigation
2. Allow camera access
3. Click **"Start Camera"**
4. Click **"Capture Frame"** to test
5. See real-time ASL predictions!

---

## 📊 What's Integrated?

| Model | Classes | Status |
|-------|---------|--------|
| ASL Alphabet | A-Z + del, nothing, space | ✅ Ready |
| Sign MNIST | A-Z | ✅ Ready |
| HaGRID | hand/no_hand | ✅ Ready |

---

## 🔧 API Endpoints

Test predictions with:

```bash
# Check server health
curl http://localhost:5000/api/models/health

# Get available models
curl http://localhost:5000/api/models/available

# Get server status
curl http://localhost:5000/api/models/status
```

---

## ❓ Troubleshooting

### Port 5000 already in use?
```bash
# Windows: Find and kill process
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac: Kill process on port
lsof -ti:5000 | xargs kill -9
```

### Models not loading?
```bash
# Verify files exist
ls notebooks/Saved_models/

# Check TensorFlow
python -c "import tensorflow; print(tensorflow.__version__)"
```

### Web app can't reach API?
1. Make sure API server is running
2. Check http://localhost:5000/health (should return 200)
3. Browser console (F12) for error messages

---

## 📁 Project Structure

```
Samvad_Setu_final/
├── 📄 START_MODEL_API.bat         ← Run this first (Windows)
├── 📄 START_MODEL_API.sh          ← Run this first (Linux/Mac)
├── 📁 scripts/
│   └── model_api_server.py        ← Flask API backend
├── 📁 notebooks/Saved_models/     ← All trained models
│   ├── final_asl_model-training-optimized.keras
│   ├── final_sign_mnist_cnn.keras
│   └── HAGRID_best_model.keras
├── 📁 components/
│   └── asl-recognizer.tsx         ← Updated web component
└── 📁 app/
    └── page.tsx                    ← Main web page
```

---

## 🎯 How It Works

```
User Camera Frame
       ↓
[Web App Component]
       ↓
Try Backend API (Port 5000)
       ↓
If Success: Show Prediction
If Failed: Fallback to Browser TensorFlow.js
```

---

## 🚀 Next Steps

1. **Try different models**: Change `model: "sign_mnist"` in the API call
2. **Compare predictions**: Use `/api/models/compare` endpoint
3. **Collect more data**: Use the "Collect Data" section
4. **Fine-tune models**: Use the "Train Model" section

---

## 📞 Support

- **API Server Issues**: Check terminal where you ran `START_MODEL_API.bat`
- **Web App Issues**: Check browser console (F12 → Console tab)
- **Model Issues**: Verify files in `notebooks/Saved_models/`

---

✅ **Everything is integrated and ready to use!**

Enjoy real-time ASL recognition! 🤟
