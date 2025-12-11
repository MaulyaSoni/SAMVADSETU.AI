// Client-side model inference utilities
// Loads the trained gesture model and performs predictions

export interface ModelMetadata {
  gesture_classes: string[]
  model_type: "LSTM" | "RandomForest"
  accuracy: number
  num_gestures: number
  training_date: string
  feature_dimension: number
}

let cachedMetadata: ModelMetadata | null = null

export async function loadModelMetadata(): Promise<ModelMetadata> {
  if (cachedMetadata) {
    return cachedMetadata
  }

  try {
    const response = await fetch("/models/model_metadata.json")
    cachedMetadata = await response.json()
    console.log("[v0] Model metadata loaded:", cachedMetadata)
    return cachedMetadata as ModelMetadata
  } catch (error) {
    console.error("[v0] Error loading model metadata:", error)
    throw error
  }
}

export interface PredictionResult {
  gesture: string
  confidence: number
  allPredictions: Array<{ gesture: string; score: number }>
}

export async function predictGesture(landmarks: number[][]): Promise<PredictionResult> {
  // Convert landmarks to feature vector (flatten)
  const features = landmarks.flat()

  try {
    const response = await fetch("/api/model/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ frameData: features }),
    })

    if (!response.ok) {
      throw new Error("Prediction failed")
    }

    const result = await response.json()
    console.log("[v0] Prediction result:", result)
    return result.prediction
  } catch (error) {
    console.error("[v0] Error during prediction:", error)
    throw error
  }
}

// Get model accuracy info
export async function getModelInfo(): Promise<{
  accuracy: string
  gestures: number
  type: string
}> {
  const metadata = await loadModelMetadata()
  return {
    accuracy: (metadata.accuracy * 100).toFixed(1),
    gestures: metadata.num_gestures,
    type: metadata.model_type,
  }
}
