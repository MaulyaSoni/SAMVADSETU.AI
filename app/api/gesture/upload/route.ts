import { type NextRequest, NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const gestureName = formData.get("gestureName") as string
    const files = formData.getAll("files") as File[]

    if (!gestureName || files.length === 0) {
      return NextResponse.json({ error: "Missing gesture name or files" }, { status: 400 })
    }

    // Create gesture directory
    const gestureDir = path.join(process.cwd(), "public", "data", "gestures", gestureName)

    // CHANGE: Create directory structure for gesture data storage
    try {
      await fs.mkdir(gestureDir, { recursive: true })
    } catch (err) {
      console.error("Directory creation error:", err)
    }

    // Save uploaded files
    const savedFiles: string[] = []
    for (const file of files) {
      const buffer = await file.arrayBuffer()
      const timestamp = Date.now()
      const ext = file.name.split(".").pop() || "jpg"
      const filename = `${gestureName}_${timestamp}_${Math.random().toString(36).substr(2, 9)}.${ext}`
      const filepath = path.join(gestureDir, filename)

      try {
        await fs.writeFile(filepath, Buffer.from(buffer))
        savedFiles.push(filename)
      } catch (err) {
        console.error(`Error saving file ${filename}:`, err)
      }
    }

    return NextResponse.json({
      success: true,
      gesture: gestureName,
      filesUploaded: savedFiles.length,
      message: `Uploaded ${savedFiles.length} images for gesture "${gestureName}"`,
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
