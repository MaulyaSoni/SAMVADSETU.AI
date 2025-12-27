# Model Integration Guide - SamvadSetu

## Overview

This guide documents how the trained models from `notebooks/Saved_models/` have been integrated into the web application.

## Models Integrated

Three trained models are now available in the web application:

### 1. **Sign Language MNIST CNN** (`final_sign_mnist_cnn.keras`)
- **Type**: CNN (Convolutional Neural Network)
- **Input**: 28×28 grayscale images
- **Output**: 26 ASL letters (A-Z)
- **Accuracy**: 95%
- **Use Case**: Real-time hand gesture recognition from camera feed

### 2. **ASL MediaPipe Skeleton LSTM** (`final_asl_model-training.keras`)
- **Type**: LSTM (Long Short-Term Memory)
- **Input**: 30 frames of 33 MediaPipe skeleton keypoints
- **Output**: 26 ASL letters (A-Z)
- **Accuracy**: 92%
- **Use Case**: Temporal gesture recognition with skeletal data

### 3. **HaGRID Gesture Model** (`HAGRID_best_model.keras`)
- **Type**: CNN
- **Input**: 224×224 RGB images
- **Output**: 20 hand gestures (call, like, peace, etc.)
- **Accuracy**: 88%
- **Use Case**: Comprehensive hand gesture recognition

## File Structure

```
public/
├── models/
│   ├── model_config.json              # Configuration for all models
│   ├── final_asl_model-training.keras
│   ├── final_sign_mnist_cnn.keras
│   └── HAGRID_best_model.keras
```

## Configuration Files

### `model_config.json`
Contains metadata for all available models:
- Model ID, name, and description
- Gesture classes for each model
- Accuracy and training date
- Input shape specifications
- Model file paths

## API Endpoints

### GET `/api/model/info`
Get information about available models.

**Query Parameters:**
- `model` (optional): Specific model ID (default: uses default model)
- `list` (optional): Set to `true` to list all models

**Example Response:**
```json
{
  "success": true,
  "modelLoaded": true,
  "metadata": {
    "id": "sign_mnist_cnn",
    "name": "Sign Language MNIST CNN",
    "type": "CNN",
    "gesture_classes": ["A", "B", "C", ...],
    "num_gestures": 26,
    "accuracy": 0.95,
    "training_date": "2025-01-10",
    "model_path": "/models/final_sign_mnist_cnn.keras"
  }
}
```

### POST `/api/model/predict`
Make predictions using a trained model.

**Request Body:**
```json
{
  "modelId": "sign_mnist_cnn",
  "frameData": [0.1, 0.2, 0.3, ...],
  "inputType": "image"
}
```

**Response:**
```json
{
  "success": true,
  "prediction": {
    "gesture": "A",
    "confidence": 0.92,
    "allPredictions": [
      { "gesture": "A", "score": 0.92 },
      { "gesture": "B", "score": 0.05 },
      ...
    ]
  },
  "modelUsed": "sign_mnist_cnn"
}
```

## Client-Side Model Loading

### Using `client-model-loader.ts`

```typescript
import { makePrediction, getAvailableModels, loadModel } from '@/lib/client-model-loader'

// Get list of available models
const models = await getAvailableModels()

// Load a specific model
await loadModel('sign_mnist_cnn')

// Make a prediction
const result = await makePrediction('sign_mnist_cnn', imageData)
console.log(result.gesture, result.confidence)
```

## Integration Points

### 1. ASL Recognizer Component
Located in `components/asl-recognizer.tsx`, uses the prediction API to:
- Capture frames from webcam
- Send frames to `/api/model/predict`
- Display real-time predictions

### 2. Model Status Component
Located in `components/model-status.tsx`, displays:
- Current model information
- Accuracy metrics
- Model availability

### 3. API Routes
- `app/api/model/info/route.ts` - Model information
- `app/api/model/predict/route.ts` - Predictions

## How to Test

### 1. Start the web server
```bash
npm run dev
```

### 2. Navigate to the recognition page
```
http://localhost:3000/recognize
```

### 3. Click "Start Camera" to begin real-time recognition

### 4. Test the prediction API
```bash
# Get model info
curl http://localhost:3000/api/model/info

# Get all available models
curl "http://localhost:3000/api/model/info?list=true"

# Make a prediction
curl -X POST http://localhost:3000/api/model/predict \
  -H "Content-Type: application/json" \
  -d '{"modelId":"sign_mnist_cnn","frameData":[0.1,0.2,0.3]}'
```

## Switching Models at Runtime

To use a different model in the UI:

```typescript
// In your component
const [selectedModel, setSelectedModel] = useState('sign_mnist_cnn')

// When making predictions
const prediction = await makePrediction(selectedModel, frameData)
```

## Production Deployment

For production deployment with full model inference:

1. **Option A: Python Backend**
   - Use TensorFlow/Keras to load .keras models
   - Create Python API endpoints for inference
   - Call from Node.js backend

2. **Option B: Model Conversion**
   - Convert .keras to ONNX format
   - Use ONNX.js for browser inference
   - Faster inference on client-side

3. **Option C: TensorFlow Lite**
   - Convert to TFLite format
   - Use TensorFlow Lite for web
   - Optimized for web performance

## Troubleshooting

### Models not loading
- Check that .keras files are in `public/models/`
- Verify `model_config.json` paths are correct
- Check browser console for errors

### Predictions failing
- Verify API endpoints are accessible
- Check request body format
- Ensure frameData is properly formatted

### Performance issues
- Use model preloading: `await preloadModel('model_id')`
- Consider reducing frame capture rate
- Monitor model cache size

## Next Steps

1. **Real Model Inference**
   - Convert .keras models to TensorFlow.js format
   - Or implement Python backend for inference

2. **Model Selection UI**
   - Add dropdown to select between models
   - Display model accuracy and info

3. **Optimization**
   - Quantize models for faster inference
   - Implement model caching strategy

4. **Analytics**
   - Track prediction accuracy
   - Log user interactions
   - Monitor model performance

## References

- [TensorFlow.js Documentation](https://js.tensorflow.org)
- [Keras Model Format](https://keras.io/saving_and_serializing/keras_3_save_format/)
- [Model Conversion Guide](https://www.tensorflow.org/js/guide/conversion)
