# Copilot Instructions for Samvad Setu

**Project**: Real-time sign language recognition system combining Next.js frontend with unified TensorFlow model backend.

## Architecture Overview

**Frontend**: Next.js 15 app at port 3000 (`app/` directory)
- React components in `components/` (Radix UI + Shadcn)
- Key entry: [asl-recognizer.tsx](../components/asl-recognizer.tsx) - handles camera streaming and model inference
- Pages: `recognize/`, `train/`, `collect/`, `test-model/`, `about/`

**Backend**: Flask API server at port 5000 (`scripts/model_api_server.py`)
- Loads 3 ASL recognition models from `notebooks/Saved_models/`
- Serves REST endpoints: `/api/models/health`, `/api/models/predict`, `/api/models/available`
- Unified interface via [unified_model_loader.py](../scripts/unified_model_loader.py)
- Next.js API routes in `app/api/` bridge frontend to Flask server

**Models**: Keras `.keras` files stored in `notebooks/Saved_models/`
- `final_asl_model-training-optimized.keras` - 29 classes (A-Z + del, nothing, space), 160x160 input
- `final_sign_mnist_cnn.keras` - 26 classes (A-Z)
- `HAGRID_best_model.keras` - Hand detection (2 classes)

## Critical Workflows

### Start Development
```bash
# Terminal 1: Start Flask API (loads all 3 models, takes ~30s)
python scripts/model_api_server.py
# Wait for: [SUCCESS] models loaded successfully

# Terminal 2: Start Next.js dev server
npm run dev
# Visit http://localhost:3000
```

### Run Verification
```bash
python verify_integration.py  # Full system check
python verify_integration_simple.py  # Quick check
```

### Deploy Frontend Only
```bash
npm run build  # Requires models accessible at http://localhost:5000
next start
```

## Project-Specific Patterns

**1. Model Loading & Inference**
- Always use [unified_model_loader.py](../scripts/unified_model_loader.py) as single source of truth
- Models auto-load at Flask server startup; failures are non-fatal (logged, server continues)
- Images normalized to float32 [0,1] before prediction
- Input shapes: ASL alphabet expects 160x160x3, others auto-resize

**2. Frontend-Backend Communication**
- Frontend sends base64-encoded images via POST to `http://localhost:5000/api/models/predict`
- Response JSON includes: `prediction` (label), `confidence`, `success` flag
- Fallback: browser-side mock model if API unreachable (see asl-recognizer.tsx lines ~45-55)
- CORS enabled on Flask via `from flask_cors import CORS`

**3. Image Processing**
- Use OpenCV (cv2) for model API server processing
- Use canvas API for browser-side preprocessing
- Color spaces: RGB for frontend, RGB expected by models (not BGR by default)
- See [RGB_COLOR_SPACE_FIX.md](../RGB_COLOR_SPACE_FIX.md) for known color conversion issues

**4. Model Configuration**
- Define class labels in [unified_model_loader.py](../scripts/unified_model_loader.py) `_get_model_info()` method
- Each model stored as separate Keras model with own config
- Check `model.input_shape` and `model.output_shape` before inference

**5. File Organization**
- Training notebooks: `notebooks/` (Jupyter)
- Model files: `notebooks/Saved_models/`
- Backend scripts: `scripts/` (Flask server, model loader, utilities)
- Frontend: `app/` (Next.js structure), `components/`, `lib/`
- Config: `next.config.js`, `package.json`, `tsconfig.json`

## Integration Points & Dependencies

- **TensorFlow/Keras**: Models load as `tf.keras.models.load_model()`, may need `safe_mode=False` for compatibility
- **Flask + Next.js API routes**: Frontend calls via `fetch()` to `http://localhost:5000` (CORS-enabled)
- **MediaPipe**: Hand detection alternative (in package.json but not primary pipeline)
- **Radix UI + Shadcn**: Component library for UI (copy pattern from [components/ui/](../components/ui/))

## Common Debugging

**Models not loading**: Check `notebooks/Saved_models/` files exist; TensorFlow version compatibility (see `verify_integration.py`)

**API unreachable from frontend**: Ensure Flask server running on :5000 and CORS configured; check browser console for fetch errors

**Inference slow**: First call loads model into memory (~10-20s); subsequent calls <1s. Cache model reference in Flask global.

**Color mismatch**: Models expect RGB; verify image preprocessing doesn't use BGR (OpenCV default is BGR, convert to RGB with `cv2.cvtColor(img, cv2.COLOR_BGR2RGB)`)

## Adding New Features

- **New model**: Add file to `notebooks/Saved_models/`, update `unified_model_loader.py` model_files dict and `_get_model_info()` class labels
- **New endpoint**: Add route to `app/api/` (Next.js) or `model_api_server.py` (Flask)
- **New component**: Follow Radix UI pattern in `components/`, import from Shadcn UI library
- **Training**: Add notebooks to `notebooks/`, save models as `.keras` files

## Build & Run Commands

- `npm run dev` - Start Next.js dev server (port 3000)
- `npm run build` - Build Next.js (requires Flask server running)
- `npm run lint` - ESLint check
- `npm start` - Run production build
- `python scripts/model_api_server.py` - Start Flask API (port 5000)
- Windows batch: `START_MODEL_API.bat` (Python + Flask)
