import { type NextRequest, NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"

export async function GET(request: NextRequest) {
  try {
    const metadataPath = path.join(process.cwd(), "public", "models", "model_metadata.json")

    let metadata = null
    try {
      const content = await fs.readFile(metadataPath, "utf-8")
      metadata = JSON.parse(content)
    } catch (err) {
      console.error("Error reading model metadata:", err)
    }

    return NextResponse.json({
      success: true,
      modelLoaded: metadata !== null,
      metadata: metadata || {
        gesture_classes: [],
        accuracy: 0,
        model_type: "LSTM",
        training_date: "Not trained yet",
      },
    })
  } catch (error) {
    console.error("Model info error:", error)
    return NextResponse.json({ error: "Failed to get model info" }, { status: 500 })
  }
}
