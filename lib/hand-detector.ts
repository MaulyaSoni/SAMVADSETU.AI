"use client"

export interface HandLandmark {
  x: number
  y: number
  z?: number
}

export interface HandDetectionResult {
  landmarks: HandLandmark[]
  score: number
  handedness: "Left" | "Right"
  boundingBox: { x: number; y: number; width: number; height: number }
  fingerCount: number
}

let isInitialized = false

const SMOOTHING_FACTOR = 0.4
let previousLandmarks: HandLandmark[] | null = null
let landmarkVelocities: HandLandmark[] | null = null

export async function initializeHandDetector(): Promise<boolean> {
  if (isInitialized) return true

  try {
    isInitialized = true
    console.log("[SignBridge] Hand detector initialized (enhanced canvas-based)")
    return true
  } catch (error) {
    console.error("[SignBridge] Hand detector initialization failed:", error)
    return false
  }
}

export async function detectHandsAsync(videoElement: HTMLVideoElement): Promise<HandDetectionResult[]> {
  return detectHandsInternal(videoElement)
}

export function detectHands(videoElement: HTMLVideoElement, canvas?: HTMLCanvasElement): HandDetectionResult[] {
  return detectHandsInternal(videoElement, canvas)
}

function detectHandsInternal(
  videoElement: HTMLVideoElement,
  providedCanvas?: HTMLCanvasElement,
): HandDetectionResult[] {
  if (!isInitialized) return []

  try {
    if (videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
      return []
    }

    let canvas = providedCanvas
    let ctx: CanvasRenderingContext2D | null = null

    if (!canvas) {
      canvas = document.createElement("canvas")
      canvas.width = videoElement.videoWidth
      canvas.height = videoElement.videoHeight
    }

    ctx = canvas.getContext("2d", { willReadFrequently: true })
    if (!ctx) return []

    if (canvas.width !== videoElement.videoWidth) {
      canvas.width = videoElement.videoWidth
    }
    if (canvas.height !== videoElement.videoHeight) {
      canvas.height = videoElement.videoHeight
    }

    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const handRegion = detectHandRegion(imageData)

    if (!handRegion.detected) {
      previousLandmarks = null
      landmarkVelocities = null
      return []
    }

    const landmarks = generateHandLandmarks(handRegion, canvas.width, canvas.height)
    const smoothedLandmarks = applyKalmanSmoothing(landmarks)

    return [
      {
        landmarks: smoothedLandmarks,
        score: handRegion.confidence,
        handedness: handRegion.centerX < 0.5 ? "Right" : "Left",
        boundingBox: handRegion.boundingBox,
        fingerCount: handRegion.fingerCount,
      },
    ]
  } catch (error) {
    return []
  }
}

interface HandRegionResult {
  detected: boolean
  confidence: number
  centerX: number
  centerY: number
  boundingBox: { x: number; y: number; width: number; height: number }
  fingerCount: number
  contourPoints: Array<{ x: number; y: number }>
  skinMask: boolean[][]
  width: number
  height: number
}

function detectHandRegion(imageData: ImageData): HandRegionResult {
  const data = imageData.data
  const width = imageData.width
  const height = imageData.height

  const skinMask: boolean[][] = Array.from({ length: height }, () => Array(width).fill(false))

  let skinPixelCount = 0
  let totalX = 0,
    totalY = 0
  let minX = width,
    maxX = 0,
    minY = height,
    maxY = 0

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4
      const r = data[idx],
        g = data[idx + 1],
        b = data[idx + 2]

      // YCbCr color space
      const Y = 0.299 * r + 0.587 * g + 0.114 * b
      const Cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b
      const Cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b

      // RGB ratio conditions
      const rgbSkin = r > 95 && g > 40 && b > 20 && r > g && r > b && Math.abs(r - g) > 15 && r - Math.min(g, b) > 15

      // YCbCr conditions (wider range for better detection)
      const ycbcrSkin = Y > 60 && Cb > 77 && Cb < 135 && Cr > 130 && Cr < 180

      // HSV-like hue check
      const max = Math.max(r, g, b)
      const min = Math.min(r, g, b)
      const saturation = max > 0 ? (max - min) / max : 0
      const hsvSkin = saturation > 0.15 && saturation < 0.75

      if ((rgbSkin && ycbcrSkin) || (ycbcrSkin && hsvSkin)) {
        skinMask[y][x] = true
        skinPixelCount++
        totalX += x
        totalY += y
        minX = Math.min(minX, x)
        maxX = Math.max(maxX, x)
        minY = Math.min(minY, y)
        maxY = Math.max(maxY, y)
      }
    }
  }

  const minPixels = width * height * 0.005
  if (skinPixelCount < minPixels) {
    return {
      detected: false,
      confidence: 0,
      centerX: 0,
      centerY: 0,
      boundingBox: { x: 0, y: 0, width: 0, height: 0 },
      fingerCount: 0,
      contourPoints: [],
      skinMask,
      width,
      height,
    }
  }

  const centerX = totalX / skinPixelCount / width
  const centerY = totalY / skinPixelCount / height

  const contourPoints = extractContourPoints(skinMask, minX, maxX, minY, maxY, width, height)
  const fingerCount = countFingersFromContour(contourPoints, centerX * width, centerY * height, skinMask)

  const handArea = skinPixelCount / (width * height)
  const confidence = Math.min(0.95, 0.45 + handArea * 3.5 + fingerCount * 0.08)

  return {
    detected: true,
    confidence,
    centerX,
    centerY,
    boundingBox: {
      x: minX / width,
      y: minY / height,
      width: (maxX - minX) / width,
      height: (maxY - minY) / height,
    },
    fingerCount,
    contourPoints,
    skinMask,
    width,
    height,
  }
}

function extractContourPoints(
  skinMask: boolean[][],
  minX: number,
  maxX: number,
  minY: number,
  maxY: number,
  width: number,
  height: number,
): Array<{ x: number; y: number }> {
  const contour: Array<{ x: number; y: number }> = []

  // Scan from top
  for (let x = minX; x <= maxX; x += 2) {
    for (let y = minY; y <= maxY; y++) {
      if (skinMask[y]?.[x]) {
        contour.push({ x, y })
        break
      }
    }
  }

  // Scan right edge
  for (let y = minY; y <= maxY; y += 2) {
    for (let x = maxX; x >= minX; x--) {
      if (skinMask[y]?.[x]) {
        contour.push({ x, y })
        break
      }
    }
  }

  // Scan bottom
  for (let x = maxX; x >= minX; x -= 2) {
    for (let y = maxY; y >= minY; y--) {
      if (skinMask[y]?.[x]) {
        contour.push({ x, y })
        break
      }
    }
  }

  // Scan left edge
  for (let y = maxY; y >= minY; y -= 2) {
    for (let x = minX; x <= maxX; x++) {
      if (skinMask[y]?.[x]) {
        contour.push({ x, y })
        break
      }
    }
  }

  return contour
}

function countFingersFromContour(
  contour: Array<{ x: number; y: number }>,
  centerX: number,
  centerY: number,
  skinMask: boolean[][],
): number {
  if (contour.length < 10) return 0

  const hull = convexHull(contour)
  if (hull.length < 5) return 1

  let defectCount = 0
  const minDefectDepth = 15
  const maxDefectAngle = 100 // degrees

  for (let i = 0; i < hull.length; i++) {
    const p1 = hull[i]
    const p2 = hull[(i + 1) % hull.length]
    const p3 = hull[(i + 2) % hull.length]

    // Calculate angle at p2
    const v1 = { x: p1.x - p2.x, y: p1.y - p2.y }
    const v2 = { x: p3.x - p2.x, y: p3.y - p2.y }

    const dot = v1.x * v2.x + v1.y * v2.y
    const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y)
    const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y)

    if (mag1 === 0 || mag2 === 0) continue

    const angle = Math.acos(Math.max(-1, Math.min(1, dot / (mag1 * mag2))))
    const angleDeg = angle * (180 / Math.PI)

    // Find deepest point between hull points
    let maxDepth = 0
    for (const cp of contour) {
      const dist = pointToLineDistance(cp, p1, p3)
      if (dist > maxDepth) maxDepth = dist
    }

    // Count as defect (finger valley) if conditions are met
    if (angleDeg < maxDefectAngle && maxDepth > minDefectDepth && p2.y < centerY) {
      defectCount++
    }
  }

  return Math.min(Math.max(defectCount + 1, 1), 5)
}

function convexHull(points: Array<{ x: number; y: number }>): Array<{ x: number; y: number }> {
  if (points.length < 3) return points

  const sorted = [...points].sort((a, b) => a.x - b.x || a.y - b.y)
  const lower: Array<{ x: number; y: number }> = []
  const upper: Array<{ x: number; y: number }> = []

  for (const p of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
      lower.pop()
    }
    lower.push(p)
  }

  for (let i = sorted.length - 1; i >= 0; i--) {
    const p = sorted[i]
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
      upper.pop()
    }
    upper.push(p)
  }

  lower.pop()
  upper.pop()

  return lower.concat(upper)
}

function cross(o: { x: number; y: number }, a: { x: number; y: number }, b: { x: number; y: number }): number {
  return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x)
}

function pointToLineDistance(
  point: { x: number; y: number },
  lineStart: { x: number; y: number },
  lineEnd: { x: number; y: number },
): number {
  const dx = lineEnd.x - lineStart.x
  const dy = lineEnd.y - lineStart.y
  const lineLenSq = dx * dx + dy * dy

  if (lineLenSq === 0) {
    return Math.sqrt(Math.pow(point.x - lineStart.x, 2) + Math.pow(point.y - lineStart.y, 2))
  }

  const t = Math.max(0, Math.min(1, ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / lineLenSq))
  const projX = lineStart.x + t * dx
  const projY = lineStart.y + t * dy

  return Math.sqrt(Math.pow(point.x - projX, 2) + Math.pow(point.y - projY, 2))
}

function generateHandLandmarks(
  handRegion: HandRegionResult,
  canvasWidth: number,
  canvasHeight: number,
): HandLandmark[] {
  const { centerX, centerY, boundingBox, fingerCount, contourPoints, skinMask } = handRegion
  const landmarks: HandLandmark[] = []

  // Find fingertip candidates from contour
  const fingertipCandidates: Array<{ x: number; y: number; strength: number }> = []

  // Sort contour by y to find topmost points (potential fingertips)
  const topPoints = [...contourPoints].filter((p) => p.y < centerY * canvasHeight).sort((a, b) => a.y - b.y)

  // Cluster top points to find distinct fingertips
  for (const point of topPoints) {
    const tooClose = fingertipCandidates.some((fp) => Math.abs(fp.x - point.x) < boundingBox.width * canvasWidth * 0.1)
    if (!tooClose && fingertipCandidates.length < 5) {
      // Calculate tip strength based on local curvature
      const strength = 1.0 - point.y / (centerY * canvasHeight)
      fingertipCandidates.push({ x: point.x, y: point.y, strength })
    }
  }

  // Sort fingertips left to right
  fingertipCandidates.sort((a, b) => a.x - b.x)

  // Wrist position
  const wristX = centerX
  const wristY = boundingBox.y + boundingBox.height * 0.92

  // Landmark 0: Wrist
  landmarks.push({ x: wristX, y: wristY, z: 0 })

  // Default finger positions
  const defaultFingerAngles = [-0.45, -0.22, 0, 0.22, 0.45]
  const defaultFingerLengths = [0.45, 0.65, 0.72, 0.65, 0.52]

  // Generate 20 landmarks (4 per finger × 5 fingers)
  for (let fingerIdx = 0; fingerIdx < 5; fingerIdx++) {
    let tipX: number, tipY: number

    if (fingerIdx < fingertipCandidates.length && fingerIdx < fingerCount) {
      tipX = fingertipCandidates[fingerIdx].x / canvasWidth
      tipY = fingertipCandidates[fingerIdx].y / canvasHeight
    } else {
      const angle = defaultFingerAngles[fingerIdx]
      const baseLength = defaultFingerLengths[fingerIdx] * boundingBox.height
      const isExtended = fingerIdx < fingerCount
      const length = isExtended ? baseLength : baseLength * 0.35

      tipX = centerX + Math.sin(angle) * boundingBox.width * 0.4
      tipY = centerY - length
    }

    // Generate 4 joints per finger: MCP, PIP, DIP, TIP
    const mcpX = wristX + (tipX - wristX) * 0.35
    const mcpY = wristY + (tipY - wristY) * 0.35
    landmarks.push({ x: mcpX, y: mcpY, z: 0 })

    const pipX = wristX + (tipX - wristX) * 0.55
    const pipY = wristY + (tipY - wristY) * 0.55
    landmarks.push({ x: pipX, y: pipY, z: 0 })

    const dipX = wristX + (tipX - wristX) * 0.75
    const dipY = wristY + (tipY - wristY) * 0.75
    landmarks.push({ x: dipX, y: dipY, z: 0 })

    landmarks.push({ x: tipX, y: tipY, z: 0 })
  }

  return landmarks
}

function applyKalmanSmoothing(landmarks: HandLandmark[]): HandLandmark[] {
  if (!previousLandmarks || previousLandmarks.length !== landmarks.length) {
    previousLandmarks = landmarks
    landmarkVelocities = landmarks.map(() => ({ x: 0, y: 0, z: 0 }))
    return landmarks
  }

  const smoothed = landmarks.map((curr, i) => {
    const prev = previousLandmarks![i]
    const vel = landmarkVelocities![i]

    // Predict next position using velocity
    const predictedX = prev.x + vel.x
    const predictedY = prev.y + vel.y

    // Blend prediction with measurement
    const alpha = SMOOTHING_FACTOR
    const newX = predictedX * alpha + curr.x * (1 - alpha)
    const newY = predictedY * alpha + curr.y * (1 - alpha)

    // Update velocity
    landmarkVelocities![i] = {
      x: (newX - prev.x) * 0.8 + vel.x * 0.2,
      y: (newY - prev.y) * 0.8 + vel.y * 0.2,
      z: 0,
    }

    return { x: newX, y: newY, z: curr.z }
  })

  previousLandmarks = smoothed
  return smoothed
}

export function landmarksToFeatures(landmarks: HandLandmark[]): number[] {
  return landmarks.flatMap((l) => [l.x, l.y, l.z || 0])
}

export function normalizeLandmarks(landmarks: HandLandmark[]): HandLandmark[] {
  if (landmarks.length === 0) return []

  const wrist = landmarks[0]
  let minX = Number.POSITIVE_INFINITY,
    maxX = Number.NEGATIVE_INFINITY
  let minY = Number.POSITIVE_INFINITY,
    maxY = Number.NEGATIVE_INFINITY

  for (const l of landmarks) {
    minX = Math.min(minX, l.x)
    maxX = Math.max(maxX, l.x)
    minY = Math.min(minY, l.y)
    maxY = Math.max(maxY, l.y)
  }

  const scale = Math.max(maxX - minX, maxY - minY) || 1

  return landmarks.map((l) => ({
    x: (l.x - wrist.x) / scale,
    y: (l.y - wrist.y) / scale,
    z: (l.z || 0) / scale,
  }))
}

export function drawHandLandmarks(ctx: CanvasRenderingContext2D, landmarks: HandLandmark[], color = "#00ffff") {
  if (!landmarks || landmarks.length < 21) return

  const canvas = ctx.canvas
  const width = canvas.width
  const height = canvas.height

  ctx.save()

  // Finger colors for distinct visualization
  const fingerColors = ["#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4", "#ffeaa7"]
  const fingerIndices = [
    [0, 1, 2, 3, 4], // Thumb
    [0, 5, 6, 7, 8], // Index
    [0, 9, 10, 11, 12], // Middle
    [0, 13, 14, 15, 16], // Ring
    [0, 17, 18, 19, 20], // Pinky
  ]

  // Palm connections
  const palmConnections = [
    [5, 9],
    [9, 13],
    [13, 17],
    [5, 17],
  ]

  // Glow effect
  ctx.shadowColor = color
  ctx.shadowBlur = 10

  // Draw palm
  ctx.strokeStyle = "#ffffff40"
  ctx.lineWidth = 2
  for (const [start, end] of palmConnections) {
    if (start < landmarks.length && end < landmarks.length) {
      ctx.beginPath()
      ctx.moveTo(landmarks[start].x * width, landmarks[start].y * height)
      ctx.lineTo(landmarks[end].x * width, landmarks[end].y * height)
      ctx.stroke()
    }
  }

  // Draw fingers with gradient
  ctx.lineWidth = 3
  ctx.lineCap = "round"
  ctx.lineJoin = "round"

  fingerIndices.forEach((finger, fIdx) => {
    ctx.strokeStyle = fingerColors[fIdx]
    ctx.shadowColor = fingerColors[fIdx]

    for (let i = 0; i < finger.length - 1; i++) {
      const startIdx = finger[i]
      const endIdx = finger[i + 1]

      if (startIdx < landmarks.length && endIdx < landmarks.length) {
        ctx.beginPath()
        ctx.moveTo(landmarks[startIdx].x * width, landmarks[startIdx].y * height)
        ctx.lineTo(landmarks[endIdx].x * width, landmarks[endIdx].y * height)
        ctx.stroke()
      }
    }
  })

  // Draw keypoints
  ctx.shadowBlur = 6
  for (let i = 0; i < landmarks.length; i++) {
    const lm = landmarks[i]
    const x = lm.x * width
    const y = lm.y * height

    const isTip = [4, 8, 12, 16, 20].includes(i)
    const isWrist = i === 0
    const radius = isTip ? 6 : isWrist ? 7 : 3

    let pointColor = color
    if (isTip) {
      pointColor = fingerColors[[4, 8, 12, 16, 20].indexOf(i)]
    } else if (isWrist) {
      pointColor = "#ffffff"
    }

    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fillStyle = pointColor
    ctx.shadowColor = pointColor
    ctx.fill()
    ctx.strokeStyle = "#fff"
    ctx.lineWidth = 1
    ctx.stroke()
  }

  ctx.restore()
}

export function isHandDetectorReady(): boolean {
  return isInitialized
}

export function getMediaPipeHands(): any {
  return null
}
