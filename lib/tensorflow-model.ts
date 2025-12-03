"use client"

// TensorFlow.js Model Training and Inference

export interface ModelConfig {
  inputSize: number
  numClasses: number
  learningRate: number
  epochs: number
  batchSize: number
}

export interface TrainingProgress {
  epoch: number
  totalEpochs: number
  loss: number
  accuracy: number
  status: string
}

export interface TrainedModel {
  isReady: boolean
  numClasses: number
  gestureLabels: string[]
  accuracy: number
  trainedAt: number
}

// Global state
let tf: any = null
let model: any = null
let modelMetadata: TrainedModel | null = null
let isTraining = false

// Load TensorFlow.js via CDN
async function loadTensorFlow(): Promise<any> {
  if (tf) return tf

  return new Promise((resolve, reject) => {
    // Check if already loaded
    if ((window as any).tf) {
      tf = (window as any).tf
      resolve(tf)
      return
    }

    const script = document.createElement("script")
    script.src = "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.17.0/dist/tf.min.js"
    script.async = true

    script.onload = () => {
      tf = (window as any).tf
      if (tf) {
        resolve(tf)
      } else {
        reject(new Error("TensorFlow.js failed to initialize"))
      }
    }

    script.onerror = () => reject(new Error("Failed to load TensorFlow.js"))
    document.head.appendChild(script)
  })
}

// Build CNN model architecture
function buildModel(inputSize: number, numClasses: number): any {
  const modelInstance = tf.sequential()

  // Input layer with dense
  modelInstance.add(
    tf.layers.dense({
      inputShape: [inputSize],
      units: 128,
      activation: "relu",
      kernelInitializer: "heNormal",
    }),
  )
  modelInstance.add(tf.layers.batchNormalization())
  modelInstance.add(tf.layers.dropout({ rate: 0.3 }))

  // Hidden layer 1
  modelInstance.add(
    tf.layers.dense({
      units: 64,
      activation: "relu",
      kernelInitializer: "heNormal",
    }),
  )
  modelInstance.add(tf.layers.batchNormalization())
  modelInstance.add(tf.layers.dropout({ rate: 0.3 }))

  // Hidden layer 2
  modelInstance.add(
    tf.layers.dense({
      units: 32,
      activation: "relu",
      kernelInitializer: "heNormal",
    }),
  )
  modelInstance.add(tf.layers.dropout({ rate: 0.2 }))

  // Output layer
  modelInstance.add(
    tf.layers.dense({
      units: numClasses,
      activation: "softmax",
    }),
  )

  return modelInstance
}

// Train the model
export async function trainModel(
  samples: Array<{ gesture: string; features: number[] }>,
  gestureLabels: string[],
  config: Partial<ModelConfig> = {},
  onProgress?: (progress: TrainingProgress) => void,
): Promise<TrainedModel> {
  if (isTraining) {
    throw new Error("Model is already training")
  }

  isTraining = true

  try {
    await loadTensorFlow()

    const {
      inputSize = 63, // 21 landmarks * 3 coordinates
      learningRate = 0.001,
      epochs = 50,
      batchSize = 32,
    } = config

    const numClasses = gestureLabels.length

    onProgress?.({
      epoch: 0,
      totalEpochs: epochs,
      loss: 0,
      accuracy: 0,
      status: "Preparing data...",
    })

    // Prepare training data
    const labelToIndex = new Map(gestureLabels.map((label, idx) => [label, idx]))

    const xData: number[][] = []
    const yData: number[] = []

    samples.forEach((sample) => {
      const labelIndex = labelToIndex.get(sample.gesture)
      if (labelIndex !== undefined && sample.features.length === inputSize) {
        xData.push(sample.features)
        yData.push(labelIndex)
      }
    })

    if (xData.length === 0) {
      throw new Error("No valid training samples")
    }

    // Create tensors
    const xTensor = tf.tensor2d(xData)
    const yTensor = tf.oneHot(tf.tensor1d(yData, "int32"), numClasses)

    onProgress?.({
      epoch: 0,
      totalEpochs: epochs,
      loss: 0,
      accuracy: 0,
      status: "Building model...",
    })

    // Build and compile model
    if (model) {
      model.dispose()
    }

    model = buildModel(inputSize, numClasses)

    model.compile({
      optimizer: tf.train.adam(learningRate),
      loss: "categoricalCrossentropy",
      metrics: ["accuracy"],
    })

    onProgress?.({
      epoch: 0,
      totalEpochs: epochs,
      loss: 0,
      accuracy: 0,
      status: "Training started...",
    })

    // Train
    let finalAccuracy = 0
    let finalLoss = 0

    await model.fit(xTensor, yTensor, {
      epochs,
      batchSize,
      validationSplit: 0.2,
      shuffle: true,
      callbacks: {
        onEpochEnd: (epoch: number, logs: any) => {
          finalAccuracy = logs.val_acc || logs.acc || 0
          finalLoss = logs.val_loss || logs.loss || 0

          onProgress?.({
            epoch: epoch + 1,
            totalEpochs: epochs,
            loss: finalLoss,
            accuracy: finalAccuracy,
            status: `Epoch ${epoch + 1}/${epochs}`,
          })
        },
      },
    })

    // Cleanup tensors
    xTensor.dispose()
    yTensor.dispose()

    // Save metadata
    modelMetadata = {
      isReady: true,
      numClasses,
      gestureLabels,
      accuracy: finalAccuracy,
      trainedAt: Date.now(),
    }

    // Save to localStorage
    localStorage.setItem("signbridge_model_metadata", JSON.stringify(modelMetadata))

    // Save model weights to IndexedDB
    await model.save("indexeddb://signbridge_gesture_model")

    onProgress?.({
      epoch: epochs,
      totalEpochs: epochs,
      loss: finalLoss,
      accuracy: finalAccuracy,
      status: "Training complete!",
    })

    return modelMetadata
  } finally {
    isTraining = false
  }
}

// Load a previously trained model
export async function loadTrainedModel(): Promise<TrainedModel | null> {
  try {
    await loadTensorFlow()

    // Load metadata
    const metadataStr = localStorage.getItem("signbridge_model_metadata")
    if (!metadataStr) {
      return null
    }

    modelMetadata = JSON.parse(metadataStr)

    // Load model from IndexedDB
    model = await tf.loadLayersModel("indexeddb://signbridge_gesture_model")

    return modelMetadata
  } catch (error) {
    console.error("Failed to load trained model:", error)
    return null
  }
}

// Predict gesture from features
export async function predictGesture(features: number[]): Promise<{
  gesture: string
  confidence: number
  allPredictions: Array<{ gesture: string; score: number }>
} | null> {
  if (!model || !modelMetadata) {
    return null
  }

  try {
    const inputTensor = tf.tensor2d([features])
    const prediction = model.predict(inputTensor) as any
    const probabilities = await prediction.data()

    inputTensor.dispose()
    prediction.dispose()

    // Get all predictions sorted by score
    const allPredictions = modelMetadata.gestureLabels
      .map((label, idx) => ({
        gesture: label,
        score: probabilities[idx],
      }))
      .sort((a, b) => b.score - a.score)

    const topPrediction = allPredictions[0]

    return {
      gesture: topPrediction.gesture,
      confidence: topPrediction.score,
      allPredictions: allPredictions.slice(0, 5),
    }
  } catch (error) {
    console.error("Prediction error:", error)
    return null
  }
}

// Check if model is ready
export function isModelReady(): boolean {
  return model !== null && modelMetadata !== null
}

// Get model status
export function getModelStatus(): TrainedModel | null {
  return modelMetadata
}

// Dispose model
export function disposeModel(): void {
  if (model) {
    model.dispose()
    model = null
  }
  modelMetadata = null
}

// Check if currently training
export function isCurrentlyTraining(): boolean {
  return isTraining
}

// Delete saved model
export async function deleteSavedModel(): Promise<void> {
  try {
    await loadTensorFlow()
    await tf.io.removeModel("indexeddb://signbridge_gesture_model")
    localStorage.removeItem("signbridge_model_metadata")
    disposeModel()
  } catch (error) {
    console.error("Failed to delete model:", error)
  }
}
