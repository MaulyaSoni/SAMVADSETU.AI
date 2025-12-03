import { type NextRequest, NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"

// Gesture prediction with mock model
// In Phase 3, this will use actual LSTM model

// Mock prediction function (will be replaced with actual model inference in production)
async function predictGestureWithModel(frameData: number[]): Promise<{
  gesture: string
  confidence: number
  allPredictions: Array<{ gesture: string; score: number }>
}> {
  // Load model metadata to get gesture classes
  const metadataPath = path.join(process.cwd(), "public", "models", "model_metadata.json")

  let metadata = null
  try {
    const content = await fs.readFile(metadataPath, "utf-8")
    metadata = JSON.parse(content)
  } catch (err) {
    console.error("[v0] Error loading metadata:", err)
  }

  // CHANGE: Use actual model inference (Python backend or loaded model)
  // For now, mock prediction with registered gestures
  const gestures = metadata?.gesture_classes || ["Hello", "Thank You", "Help", "Yes", "No"]

  // Create simulated predictions
  const predictions = gestures.map((gesture: string) => ({
    gesture,
    score: Math.random(),
  }))

  // Sort by score and get top prediction
  predictions.sort((a: any, b: any) => b.score - a.score)

  return {
    gesture: predictions[0].gesture,
    confidence: Math.min(predictions[0].score, 0.99),
    allPredictions: predictions.slice(0, 5),
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { frameData } = body

    if (!frameData || !Array.isArray(frameData)) {
      return NextResponse.json({ error: "Invalid frame data" }, { status: 400 })
    }

    const prediction = await predictGestureWithModel(frameData)

    return NextResponse.json({
      success: true,
      prediction,
    })
  } catch (error) {
    console.error("[v0] Prediction error:", error)
    return NextResponse.json({ error: "Prediction failed" }, { status: 500 })
  }
}
