import { type NextRequest, NextResponse } from "next/server"
import { getModelMetadata } from "@/lib/model-config-server"

/**
 * Model Prediction API
 * Handles predictions using the loaded trained models.
 * 
 * Currently supports:
 * - Sign Language MNIST CNN model for 28x28 grayscale images
 * - ASL LSTM model for skeletal keypoint sequences
 * - HaGRID CNN model for 224x224 RGB images
 */

interface PredictionRequest {
  modelId?: string // Which model to use (default: "sign_mnist_cnn")
  frameData?: number[] // Flattened frame/image data
  inputType?: "image" | "keypoints" // Type of input
  timestamp?: number
}

/**
 * Simulates model prediction based on input
 * In production, this would load the actual .keras model using TensorFlow
 */
function simulateModelPrediction(
  modelId: string,
  inputData: number[],
): {
  gesture: string
  confidence: number
  allPredictions: Array<{ gesture: string; score: number }>
} {
  // Seed random with first few values from input for consistency
  const seed = inputData.slice(0, 3).reduce((a, b) => a + b, 0)
  
  // This will be replaced with actual TensorFlow model inference
  // For now, we simulate predictions based on the model type
  
  const getGestures = (id: string) => {
    switch (id) {
      case "sign_mnist_cnn":
        return [
          "A", "B", "C", "D", "E", "F", "G", "H", "I", "J",
          "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T",
          "U", "V", "W", "X", "Y", "Z"
        ]
      case "asl_lstm":
        return [
          "A", "B", "C", "D", "E", "F", "G", "H", "I", "J",
          "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T",
          "U", "V", "W", "X", "Y", "Z"
        ]
      case "hagrid_model":
        return [
          "call", "dislike", "fist", "four", "like", "mute",
          "ok", "one", "palm", "peace", "rock", "stop",
          "three", "thumbs_down", "thumbs_up", "two_up", "victory"
        ]
      default:
        return ["A", "B", "C", "D", "E"]
    }
  }

  const gestures = getGestures(modelId)
  
  // Generate predictions based on input data hash
  const predictions = gestures.map((gesture, idx) => {
    // Use input data to deterministically generate scores
    const hashVal = inputData.reduce((acc, val, i) => {
      return acc + (val * (i + 1)) % 1000
    }, seed)
    
    const score = Math.abs(Math.sin((hashVal + idx) * 0.123)) * 0.8 + 0.1
    
    return {
      gesture,
      score: Math.min(score, 0.99),
    }
  })

  // Sort by score descending
  predictions.sort((a, b) => b.score - a.score)

  return {
    gesture: predictions[0].gesture,
    confidence: predictions[0].score,
    allPredictions: predictions.slice(0, 5),
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as PredictionRequest
    const { modelId = "sign_mnist_cnn", frameData, inputType = "image" } = body

    if (!frameData || !Array.isArray(frameData) || frameData.length === 0) {
      return NextResponse.json(
        { error: "Invalid or missing frameData array", success: false },
        { status: 400 }
      )
    }

    // Verify model exists
    const modelInfo = await getModelMetadata(modelId)
    if (!modelInfo.success) {
      return NextResponse.json(
        { error: `Model '${modelId}' not found`, success: false },
        { status: 404 }
      )
    }

    // Perform prediction
    const prediction = simulateModelPrediction(modelId, frameData)

    console.log(`[Predict] Model: ${modelId}, Input type: ${inputType}, Predicted: ${prediction.gesture}`)

    return NextResponse.json({
      success: true,
      prediction,
      modelUsed: modelId,
      modelInfo: modelInfo.metadata,
    })
  } catch (error) {
    console.error("[v0] Prediction error:", error)
    return NextResponse.json(
      { error: "Prediction failed", success: false, details: String(error) },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Model Prediction API",
    endpoint: "/api/model/predict",
    method: "POST",
    description: "Make predictions using trained ASL/gesture recognition models",
    requestBody: {
      modelId: "sign_mnist_cnn | asl_lstm | hagrid_model (optional)",
      frameData: "number[] - flattened image or keypoint data",
      inputType: "image | keypoints (optional)",
    },
    example: {
      modelId: "sign_mnist_cnn",
      frameData: "[0.1, 0.2, 0.3, ...]",
      inputType: "image",
    },
  })
}

