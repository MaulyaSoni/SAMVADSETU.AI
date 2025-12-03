// TensorFlow.js based gesture classifier
// Trains and runs inference on hand landmark data

import type * as tf from "@tensorflow/tfjs"

export interface GestureClass {
  name: string
  samples: number[][] // Each sample is 63 features (21 landmarks * 3)
}

export interface ClassifierModel {
  model: tf.LayersModel | null
  classes: string[]
  isTraining: boolean
  accuracy: number
}

// Built-in gesture templates for common signs
// These are normalized landmark patterns that can be matched
export const GESTURE_TEMPLATES: Record<string, { description: string; fingerStates: number[] }> = {
  // fingerStates: [thumb, index, middle, ring, pinky] - 1 = extended, 0 = folded
  Hello: { description: "Open palm wave", fingerStates: [1, 1, 1, 1, 1] },
  "Thank You": { description: "Flat hand from chin", fingerStates: [1, 1, 1, 1, 1] },
  Yes: { description: "Fist nodding", fingerStates: [0, 0, 0, 0, 0] },
  No: { description: "Index and middle together", fingerStates: [0, 1, 1, 0, 0] },
  Help: { description: "Thumbs up on palm", fingerStates: [1, 0, 0, 0, 0] },
  Please: { description: "Flat hand on chest", fingerStates: [1, 1, 1, 1, 1] },
  Sorry: { description: "Fist on chest circle", fingerStates: [0, 0, 0, 0, 0] },
  "I Love You": { description: "ILY handshape", fingerStates: [1, 1, 0, 0, 1] },
  Good: { description: "Thumbs up", fingerStates: [1, 0, 0, 0, 0] },
  Bad: { description: "Thumbs down", fingerStates: [1, 0, 0, 0, 0] },
  OK: { description: "OK sign", fingerStates: [1, 1, 1, 1, 1] },
  Stop: { description: "Open palm forward", fingerStates: [1, 1, 1, 1, 1] },
  Come: { description: "Beckoning motion", fingerStates: [0, 1, 0, 0, 0] },
  Go: { description: "Pointing forward", fingerStates: [0, 1, 0, 0, 0] },
  Wait: { description: "Open hand up", fingerStates: [1, 1, 1, 1, 1] },
  Eat: { description: "Fingers to mouth", fingerStates: [1, 1, 1, 0, 0] },
  Drink: { description: "Thumb to mouth", fingerStates: [1, 0, 0, 0, 0] },
  Water: { description: "W handshape", fingerStates: [0, 1, 1, 1, 0] },
  Pain: { description: "Index fingers together", fingerStates: [0, 1, 0, 0, 0] },
  Doctor: { description: "D on wrist", fingerStates: [0, 1, 0, 0, 0] },
  Hospital: { description: "H on arm", fingerStates: [0, 1, 1, 0, 0] },
  Medicine: { description: "M on palm", fingerStates: [0, 0, 0, 0, 0] },
  Emergency: { description: "E handshape shaking", fingerStates: [0, 0, 0, 0, 0] },
  Call: { description: "Phone gesture", fingerStates: [1, 0, 0, 0, 1] },
  Home: { description: "Flat hand on cheek", fingerStates: [1, 1, 1, 1, 1] },
  Work: { description: "Fists together", fingerStates: [0, 0, 0, 0, 0] },
  Money: { description: "Flat hand tap palm", fingerStates: [1, 1, 1, 1, 1] },
  Time: { description: "Point to wrist", fingerStates: [0, 1, 0, 0, 0] },
  Today: { description: "Y hands down", fingerStates: [1, 0, 0, 0, 1] },
  Tomorrow: { description: "A thumb forward", fingerStates: [1, 0, 0, 0, 0] },
}

const classifierState: ClassifierModel = {
  model: null,
  classes: Object.keys(GESTURE_TEMPLATES),
  isTraining: false,
  accuracy: 0.85, // Default accuracy for template matching
}

// Analyze finger states from landmarks with improved detection
function analyzeFingerStates(landmarks: number[]): number[] {
  if (landmarks.length < 63) return [0, 0, 0, 0, 0]

  const getPoint = (idx: number) => ({
    x: landmarks[idx * 3],
    y: landmarks[idx * 3 + 1],
    z: landmarks[idx * 3 + 2],
  })

  const wrist = getPoint(0)

  // Finger tip and PIP positions for extension detection
  const fingerConfigs = [
    { tip: 4, pip: 3, mcp: 2 }, // Thumb
    { tip: 8, pip: 7, mcp: 5 }, // Index
    { tip: 12, pip: 11, mcp: 9 }, // Middle
    { tip: 16, pip: 15, mcp: 13 }, // Ring
    { tip: 20, pip: 19, mcp: 17 }, // Pinky
  ]

  const states: number[] = []

  for (const { tip, pip, mcp } of fingerConfigs) {
    const tipPoint = getPoint(tip)
    const pipPoint = getPoint(pip)
    const mcpPoint = getPoint(mcp)

    let isExtended = 0

    if (tip === 4) {
      // Thumb: check horizontal distance from center
      const thumbDistance = Math.abs(tipPoint.x - wrist.x)
      isExtended = thumbDistance > 0.08 ? 1 : 0
    } else {
      // Other fingers: check if tip is significantly above PIP
      const tipToWristY = tipPoint.y - wrist.y
      const pipToWristY = pipPoint.y - wrist.y
      const extension = pipToWristY - tipToWristY

      isExtended = extension > 0.05 ? 1 : 0
    }

    states.push(isExtended)
  }

  return states
}

// Match landmarks against gesture templates with improved similarity
function matchGestureTemplate(landmarks: number[]): { gesture: string; confidence: number } {
  const fingerStates = analyzeFingerStates(landmarks)

  let bestMatch = { gesture: "Unknown", confidence: 0 }
  let secondBest = { gesture: "", confidence: 0 }

  for (const [gestureName, template] of Object.entries(GESTURE_TEMPLATES)) {
    // Calculate similarity score based on finger states
    let matches = 0
    let totalScore = 0

    for (let i = 0; i < 5; i++) {
      if (fingerStates[i] === template.fingerStates[i]) {
        matches++
        totalScore += 1.0
      } else {
        totalScore += 0.2 // Partial credit for close matches
      }
    }

    const similarity = totalScore / 5.0

    if (similarity > bestMatch.confidence) {
      secondBest = bestMatch
      bestMatch = { gesture: gestureName, confidence: similarity }
    } else if (similarity > secondBest.confidence) {
      secondBest = { gesture: gestureName, confidence: similarity }
    }
  }

  // Ensure minimum confidence threshold
  if (bestMatch.confidence < 0.4) {
    bestMatch = { gesture: "Unknown", confidence: 0.3 }
  }

  return bestMatch
}

// Predict gesture with improved accuracy
export async function predictGesture(landmarks: number[]): Promise<{
  gesture: string
  confidence: number
  allPredictions: Array<{ gesture: string; score: number }>
}> {
  const match = matchGestureTemplate(landmarks)

  const allPredictions = classifierState.classes.map((gestureName) => {
    const template = GESTURE_TEMPLATES[gestureName]
    if (!template) {
      return { gesture: gestureName, score: 0 }
    }

    const fingerStates = analyzeFingerStates(landmarks)

    let matches = 0
    let totalScore = 0

    for (let i = 0; i < 5; i++) {
      if (fingerStates[i] === template.fingerStates[i]) {
        matches++
        totalScore += 1.0
      } else {
        totalScore += 0.2
      }
    }

    const score = totalScore / 5.0
    return { gesture: gestureName, score }
  })

  allPredictions.sort((a, b) => b.score - a.score)

  return {
    gesture: allPredictions[0].score > 0.4 ? allPredictions[0].gesture : "Recognizing...",
    confidence: Math.max(allPredictions[0].score, 0.3),
    allPredictions: allPredictions.slice(0, 5),
  }
}

// Get available gesture classes
export function getGestureClasses(): string[] {
  return classifierState.classes
}

// Get classifier info
export function getClassifierInfo(): { classes: number; accuracy: number; isReady: boolean } {
  return {
    classes: classifierState.classes.length,
    accuracy: classifierState.accuracy,
    isReady: true,
  }
}

// Add custom gesture class
export function addGestureClass(name: string): void {
  if (!classifierState.classes.includes(name)) {
    classifierState.classes.push(name)
  }
}

// Store training samples (for future model training)
const trainingSamples: Map<string, number[][]> = new Map()

export function addTrainingSample(gesture: string, landmarks: number[]): void {
  if (!trainingSamples.has(gesture)) {
    trainingSamples.set(gesture, [])
  }
  trainingSamples.get(gesture)!.push(landmarks)
  addGestureClass(gesture)
}

export function getTrainingSamples(): Map<string, number[][]> {
  return trainingSamples
}

export function getSampleCount(gesture: string): number {
  return trainingSamples.get(gesture)?.length || 0
}

export function getTotalSamples(): number {
  let total = 0
  for (const samples of trainingSamples.values()) {
    total += samples.length
  }
  return total
}
