import { promises as fs } from "fs"
import path from "path"

export interface ModelConfig {
  id: string
  name: string
  filename: string
  type: "LSTM" | "CNN"
  description: string
  gesture_classes: string[]
  num_gestures: number
  accuracy: number
  input_shape: number[]
  training_date: string
  framework: string
}

let cachedConfig: { models: ModelConfig[]; default_model: string } | null = null

export async function loadModelConfig() {
  if (cachedConfig) {
    return cachedConfig
  }

  try {
    const configPath = path.join(process.cwd(), "public", "models", "model_config.json")
    const content = await fs.readFile(configPath, "utf-8")
    cachedConfig = JSON.parse(content)
    console.log("[Model Config] Loaded model configuration with", cachedConfig.models.length, "models")
    return cachedConfig
  } catch (error) {
    console.error("[Model Config] Error loading model configuration:", error)
    // Return default empty config
    return {
      models: [],
      default_model: "",
    }
  }
}

export async function getDefaultModelConfig(): Promise<ModelConfig | null> {
  const config = await loadModelConfig()
  if (!config.models.length) return null

  const defaultId = config.default_model
  return config.models.find((m) => m.id === defaultId) || config.models[0]
}

export async function getModelConfigById(modelId: string): Promise<ModelConfig | null> {
  const config = await loadModelConfig()
  return config.models.find((m) => m.id === modelId) || null
}

export async function getAllModels(): Promise<ModelConfig[]> {
  const config = await loadModelConfig()
  return config.models
}

export async function checkModelFile(filename: string): Promise<boolean> {
  try {
    const modelPath = path.join(process.cwd(), "public", "models", filename)
    await fs.access(modelPath)
    return true
  } catch {
    return false
  }
}

export async function getModelMetadata(modelId: string = "default") {
  const modelConfig = modelId === "default" ? await getDefaultModelConfig() : await getModelConfigById(modelId)

  if (!modelConfig) {
    return {
      success: false,
      error: "Model not found",
      metadata: null,
    }
  }

  const fileExists = await checkModelFile(modelConfig.filename)

  return {
    success: fileExists,
    error: fileExists ? null : "Model file not found",
    metadata: {
      id: modelConfig.id,
      name: modelConfig.name,
      type: modelConfig.type,
      description: modelConfig.description,
      gesture_classes: modelConfig.gesture_classes,
      num_gestures: modelConfig.num_gestures,
      accuracy: modelConfig.accuracy,
      training_date: modelConfig.training_date,
      model_path: fileExists ? `/models/${modelConfig.filename}` : null,
    },
  }
}
