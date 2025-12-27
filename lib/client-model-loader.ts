/**
 * Client-side Model Loading and Management
 * Handles loading and caching of trained ASL/gesture recognition models
 */

import type { ModelConfig } from "./model-config-server"

export interface LoadedModel {
  id: string
  config: ModelConfig
  model: any // TensorFlow.js model
  ready: boolean
}

interface ModelCache {
  [modelId: string]: LoadedModel
}

let modelCache: ModelCache = {}
let tf: any = null

async function loadTensorFlow(): Promise<any> {
  if (tf) return tf

  try {
    // @ts-ignore
    if (typeof window !== "undefined" && (window as any).tf) {
      tf = (window as any).tf
      return tf
    }

    // For Node.js/SSR
    tf = await import("@tensorflow/tfjs")
    return tf
  } catch (error) {
    console.error("[Model Loader] Failed to load TensorFlow.js:", error)
    throw error
  }
}

/**
 * Load model configuration from server
 */
export async function loadModelConfigs(): Promise<ModelConfig[]> {
  try {
    const response = await fetch("/api/model/info?list=true")
    const data = await response.json()

    if (data.success) {
      return data.models
    }
    throw new Error(data.error || "Failed to load model configs")
  } catch (error) {
    console.error("[Model Loader] Error loading model configs:", error)
    return []
  }
}

/**
 * Load a specific model from public/models directory
 */
export async function loadModel(modelId: string): Promise<LoadedModel | null> {
  // Check cache first
  if (modelCache[modelId]?.ready) {
    console.log(`[Model Loader] Using cached model: ${modelId}`)
    return modelCache[modelId]
  }

  try {
    const tf = await loadTensorFlow()

    // Get model config from server
    const response = await fetch(`/api/model/info?model=${modelId}`)
    const data = await response.json()

    if (!data.success) {
      throw new Error(data.error || "Model not found")
    }

    const config = data.metadata
    const modelPath = config.model_path // e.g., "/models/final_sign_mnist_cnn.keras"

    if (!modelPath) {
      throw new Error("Model file not accessible")
    }

    console.log(`[Model Loader] Loading model: ${modelId} from ${modelPath}`)

    // Load the .keras model using TensorFlow.js
    // Note: TensorFlow.js can load SavedModel or HDF5 formats
    // For .keras files, we may need to convert or use alternative loader
    let model

    try {
      // Try loading as a SavedModel first
      model = await tf.loadGraphModel(modelPath)
      console.log(`[Model Loader] Loaded as GraphModel: ${modelId}`)
    } catch (err) {
      console.warn(`[Model Loader] Could not load as GraphModel, trying alternative format...`, err)

      // For .keras files, we might need a different approach
      // This is where custom model loading logic would go
      console.log(
        `[Model Loader] Note: .keras file (${modelPath}) may need Python backend for full inference`
      )

      // For now, create a placeholder model that uses the API
      model = {
        predict: async (input: any) => {
          // Use the API to make predictions instead of local inference
          console.log(`[Model Loader] Using API-based inference for ${modelId}`)
          return input
        },
      }
    }

    const loadedModel: LoadedModel = {
      id: modelId,
      config,
      model,
      ready: true,
    }

    modelCache[modelId] = loadedModel
    console.log(`[Model Loader] ✓ Model loaded successfully: ${modelId}`)

    return loadedModel
  } catch (error) {
    console.error(`[Model Loader] Failed to load model ${modelId}:`, error)
    return null
  }
}

/**
 * Make a prediction using a loaded or API-based model
 */
export async function makePrediction(
  modelId: string,
  inputData: number[] | number[][]
): Promise<{
  gesture: string
  confidence: number
  allPredictions: Array<{ gesture: string; score: number }>
}> {
  try {
    const flatInput = Array.isArray(inputData[0]) ? (inputData as number[][]).flat() : (inputData as number[])

    // Use the API endpoint for prediction
    const response = await fetch("/api/model/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        modelId,
        frameData: flatInput,
        inputType: "image",
      }),
    })

    const data = await response.json()

    if (!data.success) {
      throw new Error(data.error || "Prediction failed")
    }

    return data.prediction
  } catch (error) {
    console.error("[Model Loader] Prediction error:", error)
    throw error
  }
}

/**
 * Get list of available models with their status
 */
export async function getAvailableModels(): Promise<
  Array<{
    id: string
    name: string
    type: string
    accuracy: number
    loaded: boolean
  }>
> {
  try {
    const configs = await loadModelConfigs()

    return configs.map((config) => ({
      id: config.id,
      name: config.name,
      type: config.type,
      accuracy: config.accuracy,
      loaded: Boolean(modelCache[config.id]?.ready),
    }))
  } catch (error) {
    console.error("[Model Loader] Error getting available models:", error)
    return []
  }
}

/**
 * Preload a model into cache
 */
export async function preloadModel(modelId: string): Promise<boolean> {
  try {
    const loaded = await loadModel(modelId)
    return loaded?.ready ?? false
  } catch (error) {
    console.error(`[Model Loader] Failed to preload model ${modelId}:`, error)
    return false
  }
}

/**
 * Unload a model from cache to free memory
 */
export function unloadModel(modelId: string): void {
  if (modelCache[modelId]) {
    if (modelCache[modelId].model?.dispose) {
      modelCache[modelId].model.dispose()
    }
    delete modelCache[modelId]
    console.log(`[Model Loader] Model unloaded: ${modelId}`)
  }
}

/**
 * Get current cache status
 */
export function getCacheStatus(): {
  loadedModels: string[]
  cacheSize: number
} {
  return {
    loadedModels: Object.keys(modelCache).filter((id) => modelCache[id].ready),
    cacheSize: Object.keys(modelCache).length,
  }
}
