# VS Code Notebook Execution Guide

## 🎯 Your Notebook is Ready!

The ASL Alphabet notebook is now properly configured in VS Code with:
- ✅ All dependencies installed
- ✅ TensorFlow 2.19.0 (compatible)
- ✅ Python 3.12.12
- ✅ 20 cells ready to execute

---

## 📋 How to Run (Step-by-Step)

### Step 1: Open the Notebook
```
File → Open File
→ Select: notebooks/1_ASL_Alphabet_Dataset.ipynb
```

### Step 2: Select Python Kernel
- **Top right:** Look for "Select Kernel" button
- **Click** → Choose "Python 3.12.12" (or your active Python)
- **Wait** for kernel to initialize (takes 5-10 seconds)

### Step 3: Run Cells One by One

**Method A: Using the Play Button** ▶️
1. Click on any cell
2. Click the **▶️ Play** button (top-left of cell)
3. Wait for execution to complete
4. Move to next cell

**Method B: Using Keyboard Shortcut** ⌨️
1. Click on any cell
2. Press **Ctrl + Enter** (or Cmd + Enter on Mac)
3. Wait for execution
4. Press **↓** arrow to move to next cell
5. Repeat

**Method C: Run All Cells** (⚠️ For short notebooks only)
- Menu → Run → Run All Cells
- ⚠️ Not recommended for this notebook (training takes time)

---

## 🔄 Execution Flow

### Phase 1: Setup (2-3 minutes)
```
Cell 0: Import libraries        ✓ ~1 second
  ↓
Cell 1: Python/TensorFlow check ✓ ~3 seconds
  ↓
Cell 2: GPU setup               ✓ ~1 second
  ↓
Cell 3: Kaggle configuration    ✓ ~1 second
  ↓
Cell 4: Dataset download setup  ✓ ~1 second
```

**What you'll see:**
```
✓ Core libraries imported successfully
Python 3.12.12
TensorFlow 2.19.0
✓ Running in Google Colab
GPUs detected: 0
⚠ No GPU detected — training will be slower on CPU
```

### Phase 2: Data Preparation (10 minutes - only if downloading dataset)
```
Cell 5: Verify dataset          ⏳ ~1 second
  ↓
Cell 6: Configuration params    ✓ ~1 second
  ↓
Cell 7: tf.data pipeline        ⏳ Depends on dataset size
  ↓
Cell 8: Data augmentation       ✓ ~1 second
  ↓
Cell 9: Model building          ✓ ~5 seconds
```

**Note:** If dataset not present locally, you must:
1. Download manually from: https://www.kaggle.com/datasets/grassknoted/asl-alphabet
2. Extract to: `external_data/asl_alphabet/`
3. Then run Cell 7+

### Phase 3: Training (30-40 minutes on CPU, 20-30 min on GPU)
```
Cell 10: Compile model          ✓ ~2 seconds
   ↓
Cell 11: STAGE 1 training       ⏳ 5-10 minutes (8 epochs)
   ↓
Cell 12: STAGE 2 fine-tuning    ⏳ 15-30 minutes (25 epochs)
```

**Watch for:**
```
Epoch 1/8
120/120 ━━━━━━━━━━━━━━━━ 25s 150ms/step - accuracy: 0.4521 - loss: 1.8234
                               - val_accuracy: 0.6123 - val_loss: 1.1245

Epoch 2/8
120/120 ━━━━━━━━━━━━━━━━ 20s 140ms/step - accuracy: 0.7234 - loss: 0.8156
...
```

### Phase 4: Evaluation (5 minutes)
```
Cell 13: Plot training history  ✓ ~2 seconds + plot display
   ↓
Cell 14: Validation metrics     ✓ ~30 seconds
   ↓
Cell 15: Confusion matrix       ✓ ~2 seconds + plot display
   ↓
Cell 16: Save H5 model          ✓ ~10 seconds
   ↓
Cell 17: Export SavedModel      ✓ ~5 seconds
```

### Phase 5: Documentation (Optional)
```
Cell 18: Browser inference (JS) 📖 Reference code
Cell 19: Production tips        📖 Reference guide
Cell 20: Deployment summary     ✓ Final status check
```

---

## ⏱️ Time Estimates

### If running on CPU (local machine)
| Phase | Duration | Action |
|-------|----------|--------|
| Setup | 5 sec | Just wait |
| Data prep | 10 min | If downloading dataset |
| Training | 45-60 min | Go get coffee ☕ |
| Evaluation | 5 min | Watch results |
| **Total** | **~1 hour** | Budget time accordingly |

### If running on GPU (Google Colab)
| Phase | Duration | Action |
|-------|----------|--------|
| Setup | 5 sec | Just wait |
| Data prep | 5 min | Faster download |
| Training | 20-30 min | Go get snack 🍪 |
| Evaluation | 2 min | Quick analysis |
| **Total** | **~30 min** | Much faster! |

---

## 🔴 What to Watch For (Errors)

### Error: "Module not found: tensorflow"
**Cause:** Kernel not using correct Python environment
**Fix:** 
1. Select Kernel → Choose Python 3.12.12
2. Restart Kernel (top right menu)
3. Run Cell 1 again

### Error: "No GPU detected"
**Cause:** Running on CPU (expected locally)
**Fix:** 
- If you need GPU: Copy to Google Colab and run there
- If local training acceptable: Continue with CPU (will be slower)

### Error: "Dataset not found"
**Cause:** Kaggle dataset not downloaded
**Fix:**
1. Download manually: https://www.kaggle.com/datasets/grassknoted/asl-alphabet
2. Extract to: `D:\Samvad_Setu_final\external_data\asl_alphabet\`
3. Run Cell 7 again

### Error: "Out of memory"
**Cause:** Batch size too large for your system
**Fix:**
1. Edit Cell 6: Change `"BATCH_SIZE": 64` → `32`
2. Restart kernel
3. Run cells again

---

## 📊 Expected Outputs

### After Cell 11 (STAGE 1):
```
✓ Stage 1 complete
Best validation accuracy: 0.7234
```

### After Cell 12 (STAGE 2):
```
✓ Stage 2 complete
Best validation accuracy: 0.9456
```

### After Cell 14 (Validation):
```
Overall Accuracy: 0.9456 (94.56%)

              precision  recall  f1-score  support
         A       0.9234  0.9123   0.9178      120
         B       0.8901  0.9012   0.8956      118
        ...
    accuracy                      0.9456     3254
```

### After Cell 15 (Confusion Matrix):
- Visual heatmap showing which letters are confused
- Diagonal = correct predictions (should be high)
- Off-diagonal = errors (should be low)

### After Cell 16 (Model Save):
```
✓ Model saved (H5): models/asl_alphabet_model.h5
  File size: 24.35 MB
✓ Labels saved: models/labels.json
✓ Training config saved: models/training_config.json
✓ Model summary saved: models/model_summary.txt
```

### After Cell 20 (Summary):
```
✓ MODEL ARTIFACTS:
  ✓ asl_alphabet_model.h5        → Keras model
  ✓ saved_model/                 → TensorFlow SavedModel
  ✓ labels.json                  → Class labels
  ✓ training_history.png         → Accuracy/Loss curves
  ✓ confusion_matrix.png         → Per-class performance
  ✓ evaluation_results.json      → Validation metrics

✅ PRODUCTION NOTEBOOK READY FOR DEPLOYMENT
```

---

## 💡 Pro Tips

### 1. Save Outputs Regularly
- After each training stage, outputs are auto-saved to `models/`
- Download before restarting kernel

### 2. Pause Between Stages
```
After Cell 12 (training completes):
- Save checkpoint
- Review training curves (Cell 13)
- Check metrics before fine-tuning
```

### 3. Use VS Code Built-in Features
- **Outline** (Ctrl+Shift+O): Jump to any cell
- **Go to Line** (Ctrl+G): Jump to specific line
- **Search** (Ctrl+F): Find text in notebook

### 4. Monitor Progress
- **Terminal** (Ctrl+`): Open to watch system resources
- **Variables** panel: See global variables after each cell
- **Output panel**: Scroll through results

### 5. Save Notebook State
- Auto-saves in VS Code
- Manual save: Ctrl+S
- Checkpoints preserved in `models/` directory

---

## 🎯 Quick Checklist

Before running:
- [ ] Notebook file exists: `notebooks/1_ASL_Alphabet_Dataset.ipynb`
- [ ] Python kernel selected: Python 3.12.12
- [ ] Kaggle dataset ready (or will download)
- [ ] At least 10GB disk space free
- [ ] For training: CPU/GPU with 6GB+ RAM

While running:
- [ ] Don't close VS Code or terminal
- [ ] Monitor output for errors
- [ ] Save model files after training completes

After running:
- [ ] Check `models/` directory for output files
- [ ] Review training plots and confusion matrix
- [ ] Next step: Convert to TFJS and deploy

---

## 🚀 Next Steps After Training

1. **TFJS Conversion** (local machine)
   ```bash
   pip install tensorflowjs
   tensorflowjs_converter --input_format=tf_saved_model \
     models/saved_model models/tfjs
   ```

2. **Copy to Web App**
   ```
   Copy models/tfjs/* → public/tfjs/asl_model/
   Copy models/labels.json → data/models/labels.json
   ```

3. **Test in Browser**
   - Open web app at `localhost:3000`
   - Go to `/recognize` page
   - Test real-time gesture recognition

---

## 📞 Support

If you encounter issues:
1. Check **NOTEBOOKS_GUIDE.md** for detailed explanations
2. Review **COLAB_QUICK_START.md** for Colab-specific help
3. Check **NOTEBOOK_COMPLETION.md** for deployment info

---

**Status: ✅ Ready to Train**

Your notebook is properly configured and ready to run in VS Code.
Choose your execution method above and start training! 🎉
