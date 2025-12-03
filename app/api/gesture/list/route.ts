import { type NextRequest, NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"

export async function GET(request: NextRequest) {
  try {
    const gesturesDir = path.join(process.cwd(), "public", "data", "gestures")
    const keypointsDir = path.join(process.cwd(), "public", "data", "keypoints")

    const gestures: any[] = []

    // Read all gesture directories
    try {
      const gestureNames = await fs.readdir(gesturesDir)

      for (const gestureName of gestureNames) {
        const imagePath = path.join(gesturesDir, gestureName)
        const keypointPath = path.join(keypointsDir, gestureName)

        try {
          const stats = await fs.stat(imagePath)
          if (stats.isDirectory()) {
            const images = await fs.readdir(imagePath)
            const keypoints = await fs.readdir(keypointPath).catch(() => [])

            gestures.push({
              name: gestureName,
              imageCount: images.length,
              keypointCount: keypoints.length,
              createdAt: stats.birthtime,
            })
          }
        } catch (err) {
          console.error(`Error reading gesture ${gestureName}:`, err)
        }
      }
    } catch (err) {
      console.error("Error reading gestures directory:", err)
    }

    return NextResponse.json({
      success: true,
      gestures,
      totalGestures: gestures.length,
      totalImages: gestures.reduce((sum, g) => sum + g.imageCount, 0),
    })
  } catch (error) {
    console.error("List gestures error:", error)
    return NextResponse.json({ error: "Failed to list gestures" }, { status: 500 })
  }
}
