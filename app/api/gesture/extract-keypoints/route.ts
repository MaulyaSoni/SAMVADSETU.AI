import { type NextRequest, NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"

// Simulated MediaPipe keypoint extraction
// In production, this would use actual MediaPipe library
async function extractKeypointsFromImage(imagePath: string): Promise<number[][]> {
  // CHANGE: Mock keypoint extraction (21 hand landmarks per hand)
  // In production, integrate with @mediapipe/tasks-vision
  const landmarkCount = 21 // MediaPipe hand has 21 landmarks
  const mockKeypoints: number[][] = []

  for (let i = 0; i < landmarkCount; i++) {
    mockKeypoints.push([
      Math.random(), // x normalized (0-1)
      Math.random(), // y normalized (0-1)
      Math.random(), // z normalized (0-1)
      Math.random(), // visibility (0-1)
    ])
  }

  return mockKeypoints
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { gestureName } = body

    if (!gestureName) {
      return NextResponse.json({ error: "Missing gesture name" }, { status: 400 })
    }

    const gestureDir = path.join(process.cwd(), "public", "data", "gestures", gestureName)
    const csvDir = path.join(process.cwd(), "public", "data", "keypoints", gestureName)

    // Create keypoints directory
    try {
      await fs.mkdir(csvDir, { recursive: true })
    } catch (err) {
      console.error("Directory creation error:", err)
    }

    // Read all image files in gesture directory
    let files: string[] = []
    try {
      files = await fs.readdir(gestureDir)
    } catch (err) {
      console.error("Error reading gesture directory:", err)
    }

    const processedFiles: string[] = []

    // Extract keypoints from each image
    for (const filename of files) {
      if (!/\.(jpg|jpeg|png|gif)$/i.test(filename)) continue

      const imagePath = path.join(gestureDir, filename)
      const keypoints = await extractKeypointsFromImage(imagePath)

      // Convert to CSV format
      const csvFilename = filename.replace(/\.[^/.]+$/, ".csv")
      const csvPath = path.join(csvDir, csvFilename)

      // Create CSV header and data
      const header = Array.from(
        { length: 21 },
        (_, i) => `landmark_${i}_x,landmark_${i}_y,landmark_${i}_z,landmark_${i}_visibility`,
      ).join(",")

      const dataRows = keypoints.map((point) => point.join(",")).join("\n")
      const csvContent = `${header}\n${dataRows}`

      try {
        await fs.writeFile(csvPath, csvContent)
        processedFiles.push(csvFilename)
      } catch (err) {
        console.error(`Error writing CSV ${csvFilename}:`, err)
      }
    }

    return NextResponse.json({
      success: true,
      gesture: gestureName,
      processedImages: processedFiles.length,
      message: `Extracted keypoints from ${processedFiles.length} images`,
    })
  } catch (error) {
    console.error("Keypoint extraction error:", error)
    return NextResponse.json({ error: "Keypoint extraction failed" }, { status: 500 })
  }
}
