import { type NextRequest, NextResponse } from "next/server"
import { getModelMetadata, getAllModels } from "@/lib/model-config-server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const modelId = searchParams.get("model") || "default"
    const listAll = searchParams.get("list") === "true"

    if (listAll) {
      const allModels = await getAllModels()
      return NextResponse.json({
        success: true,
        models: allModels.map((m) => ({
          id: m.id,
          name: m.name,
          type: m.type,
          accuracy: m.accuracy,
          num_gestures: m.num_gestures,
          training_date: m.training_date,
        })),
      })
    }

    const modelInfo = await getModelMetadata(modelId)

    return NextResponse.json({
      success: modelInfo.success,
      error: modelInfo.error,
      modelLoaded: modelInfo.success,
      metadata: modelInfo.metadata,
    })
  } catch (error) {
    console.error("Model info error:", error)
    return NextResponse.json(
      { error: "Failed to get model info", success: false },
      { status: 500 }
    )
  }
}
