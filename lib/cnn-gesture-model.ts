"use client"

export interface GesturePrediction {
  gesture: string
  confidence: number
  allPredictions: Array<{ gesture: string; score: number }>
}

export const GESTURE_LABELS = [
  "Hello",
  "Thank You",
  "Yes",
  "No",
  "Help",
  "Please",
  "Sorry",
  "I Love You",
  "Good",
  "Bad",
  "OK",
  "Stop",
  "Come",
  "Go",
  "Wait",
  "Eat",
  "Drink",
  "Water",
  "Pain",
  "Doctor",
  "Hospital",
  "Medicine",
  "Emergency",
  "Call",
  "Home",
  "Work",
  "Money",
  "Time",
  "Today",
  "Tomorrow",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
]

const GESTURE_TEMPLATES: Record<string, { fingerPattern: number[]; handShape: string; motion: string }> = {
  Hello: { fingerPattern: [1, 1, 1, 1, 1], handShape: "open", motion: "wave" },
  "Thank You": { fingerPattern: [1, 1, 1, 1, 1], handShape: "flat", motion: "forward" },
  Yes: { fingerPattern: [0, 0, 0, 0, 0], handShape: "fist", motion: "nod" },
  No: { fingerPattern: [1, 1, 0, 0, 0], handShape: "point", motion: "shake" },
  Help: { fingerPattern: [0, 0, 0, 0, 1], handShape: "thumbUp", motion: "up" },
  Please: { fingerPattern: [1, 1, 1, 1, 1], handShape: "flat", motion: "circle" },
  Sorry: { fingerPattern: [0, 0, 0, 0, 0], handShape: "fist", motion: "chest" },
  "I Love You": { fingerPattern: [1, 1, 0, 0, 1], handShape: "ily", motion: "static" },
  Good: { fingerPattern: [0, 0, 0, 0, 1], handShape: "thumbUp", motion: "static" },
  Bad: { fingerPattern: [0, 0, 0, 0, 1], handShape: "thumbDown", motion: "static" },
  OK: { fingerPattern: [0, 1, 1, 1, 1], handShape: "ok", motion: "static" },
  Stop: { fingerPattern: [1, 1, 1, 1, 1], handShape: "open", motion: "forward" },
  Come: { fingerPattern: [0, 1, 0, 0, 0], handShape: "point", motion: "toward" },
  Go: { fingerPattern: [0, 1, 0, 0, 0], handShape: "point", motion: "away" },
  Wait: { fingerPattern: [1, 1, 1, 1, 1], handShape: "open", motion: "down" },
  Eat: { fingerPattern: [1, 1, 1, 0, 0], handShape: "pinch", motion: "toMouth" },
  Drink: { fingerPattern: [0, 0, 0, 0, 1], handShape: "cup", motion: "toMouth" },
  Water: { fingerPattern: [1, 0, 0, 0, 0], handShape: "w", motion: "tap" },
  Pain: { fingerPattern: [0, 1, 1, 0, 0], handShape: "point", motion: "twist" },
  Doctor: { fingerPattern: [1, 1, 0, 0, 0], handShape: "flat", motion: "wrist" },
  Hospital: { fingerPattern: [1, 1, 0, 0, 0], handShape: "cross", motion: "draw" },
  Medicine: { fingerPattern: [1, 1, 1, 0, 0], handShape: "pinch", motion: "palm" },
  Emergency: { fingerPattern: [1, 1, 1, 1, 1], handShape: "open", motion: "shake" },
  Call: { fingerPattern: [1, 0, 0, 0, 1], handShape: "phone", motion: "ear" },
  Home: { fingerPattern: [1, 1, 1, 1, 1], handShape: "roof", motion: "static" },
  Work: { fingerPattern: [0, 0, 0, 0, 0], handShape: "fist", motion: "tap" },
  Money: { fingerPattern: [1, 1, 1, 0, 0], handShape: "rub", motion: "rub" },
  Time: { fingerPattern: [0, 1, 0, 0, 0], handShape: "point", motion: "wrist" },
  Today: { fingerPattern: [1, 1, 0, 0, 0], handShape: "flat", motion: "down" },
  Tomorrow: { fingerPattern: [0, 0, 0, 0, 1], handShape: "thumbUp", motion: "forward" },
  One: { fingerPattern: [0, 1, 0, 0, 0], handShape: "point", motion: "static" },
  Two: { fingerPattern: [0, 1, 1, 0, 0], handShape: "peace", motion: "static" },
  Three: { fingerPattern: [0, 1, 1, 1, 0], handShape: "three", motion: "static" },
  Four: { fingerPattern: [0, 1, 1, 1, 1], handShape: "four", motion: "static" },
  Five: { fingerPattern: [1, 1, 1, 1, 1], handShape: "open", motion: "static" },
}

let isModelReady = false

interface FrameData {
  fingerStates: number[]
  centroid: { x: number; y: number }
  boundingBox: { width: number; height: number }
  skinPixelCount: number
  timestamp: number
}

const frameBuffer: FrameData[] = []
const BUFFER_SIZE = 10

export async function initializeCNNModel(): Promise<boolean> {
  // No TensorFlow loading needed - using pre-computed templates
  isModelReady = true
  return true
}

export function addFrameToBuffer(landmarks: number[], timestamp: number): void {
  // Extract finger states from landmarks
  const fingerStates = extractFingerStates(landmarks)
  const centroid = extractCentroid(landmarks)
  const boundingBox = extractBoundingBox(landmarks)

  frameBuffer.push({
    fingerStates,
    centroid,
    boundingBox,
    skinPixelCount: 0,
    timestamp,
  })

  while (frameBuffer.length > BUFFER_SIZE) frameBuffer.shift()
}

function extractFingerStates(landmarks: number[]): number[] {
  if (landmarks.length < 63) return [0, 0, 0, 0, 0]

  // Landmark indices for fingertips and bases (MediaPipe hand model)
  const tipIndices = [4, 8, 12, 16, 20] // thumb, index, middle, ring, pinky tips
  const baseIndices = [2, 5, 9, 13, 17] // corresponding bases

  const states: number[] = []
  for (let i = 0; i < 5; i++) {
    const tipY = landmarks[tipIndices[i] * 3 + 1]
    const baseY = landmarks[baseIndices[i] * 3 + 1]
    // Finger extended if tip is higher (smaller Y) than base
    states.push(tipY < baseY - 0.05 ? 1 : 0)
  }

  return states
}

function extractCentroid(landmarks: number[]): { x: number; y: number } {
  if (landmarks.length < 3) return { x: 0.5, y: 0.5 }

  let sumX = 0,
    sumY = 0,
    count = 0
  for (let i = 0; i < landmarks.length; i += 3) {
    sumX += landmarks[i]
    sumY += landmarks[i + 1]
    count++
  }

  return { x: sumX / count, y: sumY / count }
}

function extractBoundingBox(landmarks: number[]): { width: number; height: number } {
  if (landmarks.length < 3) return { width: 0, height: 0 }

  let minX = 1,
    maxX = 0,
    minY = 1,
    maxY = 0
  for (let i = 0; i < landmarks.length; i += 3) {
    minX = Math.min(minX, landmarks[i])
    maxX = Math.max(maxX, landmarks[i])
    minY = Math.min(minY, landmarks[i + 1])
    maxY = Math.max(maxY, landmarks[i + 1])
  }

  return { width: maxX - minX, height: maxY - minY }
}

export function clearFrameBuffer(): void {
  frameBuffer.length = 0
}

function analyzeHandFromImage(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
): {
  fingerCount: number
  fingerStates: number[]
  centroid: { x: number; y: number }
  aspectRatio: number
  skinRatio: number
  motion: { dx: number; dy: number }
} {
  const imageData = ctx.getImageData(0, 0, w, h)
  const data = imageData.data

  // Skin detection using YCbCr color space
  const skinPixels: { x: number; y: number }[] = []

  for (let y = 0; y < h; y += 4) {
    for (let x = 0; x < w; x += 4) {
      const idx = (y * w + x) * 4
      const r = data[idx],
        g = data[idx + 1],
        b = data[idx + 2]

      const Y = 0.299 * r + 0.587 * g + 0.114 * b
      const Cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b
      const Cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b

      if (Y > 80 && Cb > 77 && Cb < 127 && Cr > 133 && Cr < 173) {
        skinPixels.push({ x: x / w, y: y / h })
      }
    }
  }

  if (skinPixels.length < 10) {
    return {
      fingerCount: 0,
      fingerStates: [0, 0, 0, 0, 0],
      centroid: { x: 0.5, y: 0.5 },
      aspectRatio: 1,
      skinRatio: 0,
      motion: { dx: 0, dy: 0 },
    }
  }

  // Calculate centroid
  const centroid = skinPixels.reduce(
    (acc, p) => ({ x: acc.x + p.x / skinPixels.length, y: acc.y + p.y / skinPixels.length }),
    { x: 0, y: 0 },
  )

  // Calculate bounding box
  let minX = 1,
    maxX = 0,
    minY = 1,
    maxY = 0
  skinPixels.forEach((p) => {
    minX = Math.min(minX, p.x)
    maxX = Math.max(maxX, p.x)
    minY = Math.min(minY, p.y)
    maxY = Math.max(maxY, p.y)
  })

  const boxW = maxX - minX
  const boxH = maxY - minY
  const aspectRatio = boxH > 0 ? boxW / boxH : 1

  // Finger detection using contour analysis
  const topPixels = skinPixels.filter((p) => p.y < centroid.y - 0.05)
  const verticalSpread =
    topPixels.length > 5 ? Math.max(...topPixels.map((p) => p.x)) - Math.min(...topPixels.map((p) => p.x)) : 0

  // Estimate finger count based on hand shape metrics
  let fingerCount = 0
  const density = skinPixels.length / ((w / 4) * (h / 4))

  if (verticalSpread > 0.3 && aspectRatio > 0.8) {
    fingerCount = 5 // Open hand
  } else if (verticalSpread > 0.2) {
    fingerCount = Math.round(verticalSpread * 10)
  } else if (boxH > boxW * 1.5) {
    fingerCount = 1 // Pointing
  } else if (density > 0.3) {
    fingerCount = 0 // Fist
  }

  fingerCount = Math.min(5, Math.max(0, fingerCount))

  // Generate finger states from count
  const fingerStates = [0, 0, 0, 0, 0]
  if (fingerCount === 5) {
    fingerStates.fill(1)
  } else if (fingerCount === 4) {
    fingerStates[1] = fingerStates[2] = fingerStates[3] = fingerStates[4] = 1
  } else if (fingerCount === 3) {
    fingerStates[1] = fingerStates[2] = fingerStates[3] = 1
  } else if (fingerCount === 2) {
    fingerStates[1] = fingerStates[2] = 1
  } else if (fingerCount === 1) {
    fingerStates[1] = 1
  }

  // Motion detection from buffer
  let motion = { dx: 0, dy: 0 }
  if (frameBuffer.length >= 2) {
    const prev = frameBuffer[frameBuffer.length - 2]
    motion = {
      dx: centroid.x - prev.centroid.x,
      dy: centroid.y - prev.centroid.y,
    }
  }

  return {
    fingerCount,
    fingerStates,
    centroid,
    aspectRatio,
    skinRatio: density,
    motion,
  }
}

function matchGestureTemplate(analysis: ReturnType<typeof analyzeHandFromImage>): {
  gesture: string
  confidence: number
  scores: Array<{ gesture: string; score: number }>
} {
  const scores: Array<{ gesture: string; score: number }> = []

  for (const [gesture, template] of Object.entries(GESTURE_TEMPLATES)) {
    let score = 0

    // Match finger pattern (50% weight)
    const fingerMatch =
      template.fingerPattern.reduce((acc, expected, i) => {
        return acc + (analysis.fingerStates[i] === expected ? 1 : 0)
      }, 0) / 5
    score += fingerMatch * 0.5

    // Match motion (30% weight)
    const motionMag = Math.sqrt(analysis.motion.dx ** 2 + analysis.motion.dy ** 2)
    if (template.motion === "static" && motionMag < 0.02) {
      score += 0.3
    } else if (
      template.motion === "wave" &&
      motionMag > 0.03 &&
      Math.abs(analysis.motion.dx) > Math.abs(analysis.motion.dy)
    ) {
      score += 0.3
    } else if (template.motion === "forward" && analysis.motion.dy < -0.02) {
      score += 0.3
    } else if (template.motion === "shake" && motionMag > 0.02) {
      score += 0.2
    } else if (template.motion !== "static") {
      score += 0.1 // Partial match for any motion
    }

    // Hand shape bonus (20% weight)
    if (template.handShape === "open" && analysis.fingerCount === 5) {
      score += 0.2
    } else if (template.handShape === "fist" && analysis.fingerCount === 0) {
      score += 0.2
    } else if (template.handShape === "point" && analysis.fingerCount === 1) {
      score += 0.2
    } else if (template.handShape === "peace" && analysis.fingerCount === 2) {
      score += 0.2
    } else if (template.handShape === "three" && analysis.fingerCount === 3) {
      score += 0.2
    } else if (template.handShape === "four" && analysis.fingerCount === 4) {
      score += 0.2
    } else {
      score += 0.05 // Small base score
    }

    scores.push({ gesture, score })
  }

  scores.sort((a, b) => b.score - a.score)

  return {
    gesture: scores[0].gesture,
    confidence: scores[0].score,
    scores: scores.slice(0, 5),
  }
}

export async function predictGestureFromFrame(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
): Promise<GesturePrediction> {
  if (!isModelReady) {
    return { gesture: "Initializing...", confidence: 0, allPredictions: [] }
  }

  const ctx = canvas.getContext("2d", { willReadFrequently: true })
  if (!ctx) return { gesture: "Unknown", confidence: 0, allPredictions: [] }

  ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

  // Analyze hand directly from image
  const analysis = analyzeHandFromImage(ctx, canvas.width, canvas.height)

  // Add to buffer for motion tracking
  frameBuffer.push({
    fingerStates: analysis.fingerStates,
    centroid: analysis.centroid,
    boundingBox: { width: 0, height: 0 },
    skinPixelCount: 0,
    timestamp: Date.now(),
  })
  while (frameBuffer.length > BUFFER_SIZE) frameBuffer.shift()

  // No hand detected
  if (analysis.skinRatio < 0.05) {
    return { gesture: "No Hand Detected", confidence: 0, allPredictions: [] }
  }

  // Match against templates
  const result = matchGestureTemplate(analysis)

  // Require minimum confidence
  if (result.confidence < 0.4) {
    return {
      gesture: "Recognizing...",
      confidence: result.confidence,
      allPredictions: result.scores,
    }
  }

  return {
    gesture: result.gesture,
    confidence: result.confidence,
    allPredictions: result.scores,
  }
}

export function getCNNModelStatus(): {
  isReady: boolean
  numClasses: number
  backend: string
  sequenceLength: number
  bufferSize: number
} {
  return {
    isReady: isModelReady,
    numClasses: GESTURE_LABELS.length,
    backend: "template-matching", // No TensorFlow backend
    sequenceLength: BUFFER_SIZE,
    bufferSize: frameBuffer.length,
  }
}

export function disposeCNNModel(): void {
  isModelReady = false
  clearFrameBuffer()
}
