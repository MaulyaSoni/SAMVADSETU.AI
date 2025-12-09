# 🚀 ASL Alphabet Notebook - Quick Start Guide

## How to Run in VS Code (Local) or Google Colab

### Option 1: Run Locally in VS Code ⚡

**Prerequisites:**
- Python 3.10+
- TensorFlow 2.12+ (already installed: 2.19.0)
- VS Code with Jupyter extension

**Steps:**

1. **Open the notebook in VS Code:**
   - File → Open → `notebooks/1_ASL_Alphabet_Dataset.ipynb`

2. **Configure kernel:**
   - Click "Select Kernel" (top right)
   - Choose "Python 3.12.12" or your Python environment

3. **Run cells sequentially:**
   - Click the ▶️ play button on each cell
   - Or use keyboard shortcut: `Ctrl+Enter`

4. **Download dataset (when you reach Cell 5):**
   ```
   Option A: Use Kaggle API (requires kaggle.json)
   Option B: Manual download from https://www.kaggle.com/datasets/grassknoted/asl-alphabet
   ```

5. **Expected outputs after training:**
   - Model files in `models/` directory
   - Training plots and confusion matrix
   - Ready for deployment

---

### Option 2: Run in Google Colab (Recommended for GPU) 🌐

**Advantages:**
- ✅ Free GPU (T4 or better)
- ✅ 2-3x faster training
- ✅ No local setup needed
- ✅ Cloud storage for large datasets

**Steps:**

1. **Copy notebook to Colab:**
   - Open notebook locally in VS Code
   - Click the "Open in Colab" button (if available)
   - OR manually upload to Google Colab

2. **Upload Kaggle credentials:**
   ```python
   # In Cell 3, uncomment and run:
   from google.colab import files
   files.upload()  # Upload kaggle.json
   ```

3. **Run all cells:**
   - Cell → Run All (Ctrl+F9)
   - Or run cells individually with Shift+Enter

4. **Download trained models:**
   - After training completes:
   - Left sidebar → Files → Download model files
   - Or mount Google Drive to save automatically

5. **Total training time:**
   - Stage 1 (head-only): 5-10 minutes
   - Stage 2 (fine-tuning): 15-30 minutes
   - Total: 20-40 minutes on GPU

---

## 📊 Notebook Structure

| Cell | Purpose | Status |
|------|---------|--------|
| 0 | Core library imports | ✅ Ready |
| 1 | Python/TensorFlow setup | ✅ Ready |
| 2 | GPU & mixed precision config | ✅ Ready |
| 3 | Kaggle API setup | ✅ Ready |
| 4 | Dataset download | ⏳ Awaiting kaggle.json |
| 5 | Dataset verification | ⏳ Awaiting dataset |
| 6 | Configuration parameters | ⏳ Ready |
| 7 | tf.data pipeline | ⏳ Ready |
| 8 | Data augmentation | ⏳ Ready |
| 9 | Model building | ⏳ Ready |
| 10 | Compile & callbacks | ⏳ Ready |
| 11 | **STAGE 1: Train head** | ⏳ Ready (5-10 min) |
| 12 | **STAGE 2: Fine-tune** | ⏳ Ready (15-30 min) |
| 13 | Plot training history | ⏳ Ready |
| 14 | Validation evaluation | ⏳ Ready |
| 15 | Confusion matrix | ⏳ Ready |
| 16 | Save H5 model | ⏳ Ready |
| 17 | Export SavedModel | ⏳ Ready |
| 18 | Browser inference (JS) | 📖 Reference |
| 19 | Production tips | 📖 Reference |
| 20 | Deployment summary | ⏳ Ready |

---

## 🔑 Key Points

### Dataset Setup
- **Size:** 87,000 images (27 classes: A-Z + space)
- **Source:** Kaggle ASL Alphabet dataset
- **To download:**
  1. Create account: https://www.kaggle.com
  2. Generate API token: https://www.kaggle.com/settings/account
  3. Download `kaggle.json` and place in `~/.kaggle/`

### Model Architecture
- **Base:** EfficientNetB0 (ImageNet pre-trained)
- **Input:** 160×160 RGB images
- **Output:** 27 classes (ASL alphabet)
- **Training:** Staged fine-tuning (2 stages)

### Performance
- **Accuracy:** Expected 92-96% on validation set
- **Model size:** ~20-30 MB (H5), ~8-10 MB (TFJS quantized)
- **Inference:** ~50ms (CPU), ~5ms (GPU)

---

## 🛠️ Troubleshooting

### No GPU detected
**Problem:** Cell 2 shows "GPUs detected: 0"
**Solution:**
- In Google Colab: Runtime → Change runtime type → GPU
- Local: Install NVIDIA GPU drivers + CUDA 11.8+

### Kaggle dataset download fails
**Problem:** Cell 4 fails to download dataset
**Solution:**
1. Download manually: https://www.kaggle.com/datasets/grassknoted/asl-alphabet
2. Extract to: `./external_data/asl_alphabet/`
3. Run Cell 5 to verify

### Out of memory during training
**Problem:** Cell 11/12 runs out of GPU/CPU memory
**Solution:**
- Reduce batch size in Cell 6: `"BATCH_SIZE": 32` (from 64)
- Reduce image size: `"IMG_SIZE": 128` (from 160)
- Run on GPU instead of CPU

### Missing imports in later cells
**Problem:** Cells 13+ fail with "name not defined"
**Solution:**
- Always run cells sequentially (1→2→3...)
- Don't skip cells or run out of order
- Restart kernel and run all again

---

## 📦 Next Steps After Training

1. **Convert to TFJS** (for web deployment)
   ```bash
   pip install tensorflowjs
   tensorflowjs_converter --input_format=tf_saved_model \
     models/saved_model models/tfjs
   ```

2. **Integrate with SamvadSetu web app**
   - Copy TFJS files to `public/tfjs/asl_model/`
   - Update `lib/gesture-classifier.ts`
   - Test on `/recognize` page

3. **Deploy to production**
   - Host model on Firebase/Vercel/custom server
   - Add monitoring and feedback collection
   - Plan monthly retraining

---

## 📚 Documentation

- **Full Guide:** `NOTEBOOKS_GUIDE.md`
- **Notebook Details:** `NOTEBOOK_COMPLETION.md`
- **Checklist:** `NOTEBOOKS_CHECKLIST.md`

---

## ✅ Environment Status

```
Python:      3.12.12
TensorFlow:  2.19.0
NumPy:       ✓ installed
Pandas:      ✓ installed
Matplotlib:  ✓ installed
Scikit-learn: ✓ installed
Seaborn:     ✓ installed
GPU:         No (use Colab for GPU)
Kaggle API:  ✓ available
```

---

**Ready to train?** 🎉

1. Prepare Kaggle credentials
2. Open notebook in VS Code or Colab
3. Run cells 1→20 sequentially
4. Monitor training progress
5. Deploy trained model

Good luck! 🚀
