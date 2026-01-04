# RGB Color Space Fix - Model Prediction Accuracy

## Problem Identified

The model was not giving correct predictions despite achieving 95%+ training accuracy because of a **color space mismatch** between training and inference:

- **Training**: Images were loaded in RGB format by TensorFlow's `image_dataset_from_directory` with `color_mode='rgb'`
- **Inference (OLD)**: Images were being converted from RGB → BGR using OpenCV `cv2.cvtColor(image, cv2.COLOR_RGB2BGR)`
- **Result**: Model trained on RGB colors but received BGR colors at inference = wrong predictions

## Root Cause Location

In `scripts/model_api_server.py`:

### Lines 245-249 (OLD - INCORRECT):
```python
image = Image.open(BytesIO(image_data))  # Image is loaded in RGB
image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)  # ❌ Converted to BGR!
```

This unnecessary conversion broke the color space that the model was trained on.

## Solution Applied

### In `/api/models/predict` endpoint (Lines 220-251):
```python
# Decode image
image_data = base64.b64decode(data['image'])
image = Image.open(BytesIO(image_data))
image = np.array(image)
# Keep as RGB - model was trained on RGB images
```

### In `/api/models/compare` endpoint (Lines 295-305):
```python
# Decode image
image_data = base64.b64decode(data['image'])
image = Image.open(BytesIO(image_data))
image = np.array(image)
# Keep as RGB - model was trained on RGB images
```

## Image Processing Pipeline (CORRECTED)

```
Browser Canvas
    ↓
Canvas.toDataURL("image/jpeg")  → JPEG (RGB format)
    ↓
Base64 encode
    ↓
Send to Flask API
    ↓
Base64 decode in API
    ↓
PIL Image.open()  → RGB array
    ↓
NO color space conversion ✓
    ↓
Normalize: /255.0
    ↓
Resize to 160×160×3
    ↓
Model.predict() ✓
```

## Training Preprocessing Verification

From `notebooks/1_ASL_Alphabet_Dataset.ipynb`:
- ✓ `color_mode='rgb'` - Trained on RGB images
- ✓ `Rescaling: 1./255` - Normalizes to 0-1 range
- ✓ `Input: 160×160×3 RGB Image` - Expects RGB format

## Files Modified

1. **scripts/model_api_server.py**
   - `/api/models/predict` endpoint: Removed BGR conversion
   - `/api/models/compare` endpoint: Removed BGR conversion
   - Both now keep images in native RGB format

## Expected Improvement

With this fix:
- ✅ Images arrive at model in same format as training
- ✅ Color channels match training distribution
- ✅ Predictions should return to 95%+ accuracy

## Next Steps to Verify

1. Restart the API server:
   ```bash
   python scripts/model_api_server.py
   ```

2. Test predictions in the web app at:
   ```
   http://localhost:3000/recognize
   ```

3. Verify that gestures are recognized correctly

## Technical Note

This is a common issue in deep learning pipelines where training and inference preprocessing must be **exactly identical**. Color space (RGB vs BGR) is a critical component because it affects how the model interprets pixel values across channels.
