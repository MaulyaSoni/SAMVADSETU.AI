"use client"

// Persistent training data storage using IndexedDB

export interface TrainingSample {
  id: string
  gesture: string
  features: number[] // 63 landmarks (21 points * 3 coords)
  imageData?: string
  timestamp: number
}

export interface TrainingDataset {
  samples: TrainingSample[]
  gestureClasses: string[]
  version: number
}

const DB_NAME = "signbridge_training"
const DB_VERSION = 1
const STORE_NAME = "samples"

let db: IDBDatabase | null = null

async function openDB(): Promise<IDBDatabase> {
  if (db) return db

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      db = request.result
      resolve(db)
    }

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: "id" })
        store.createIndex("gesture", "gesture", { unique: false })
      }
    }
  })
}

export async function saveSample(sample: TrainingSample): Promise<void> {
  const database = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite")
    const store = transaction.objectStore(STORE_NAME)
    const request = store.put(sample)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

export async function getAllSamples(): Promise<TrainingSample[]> {
  const database = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readonly")
    const store = transaction.objectStore(STORE_NAME)
    const request = store.getAll()
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result || [])
  })
}

export async function getSamplesByGesture(gesture: string): Promise<TrainingSample[]> {
  const database = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readonly")
    const store = transaction.objectStore(STORE_NAME)
    const index = store.index("gesture")
    const request = index.getAll(gesture)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result || [])
  })
}

export async function getGestureClasses(): Promise<string[]> {
  const samples = await getAllSamples()
  const classes = new Set(samples.map((s) => s.gesture))
  return Array.from(classes).sort()
}

export async function getDatasetStats(): Promise<{
  totalSamples: number
  gestureClasses: string[]
  samplesPerGesture: Record<string, number>
}> {
  const samples = await getAllSamples()
  const samplesPerGesture: Record<string, number> = {}

  samples.forEach((s) => {
    samplesPerGesture[s.gesture] = (samplesPerGesture[s.gesture] || 0) + 1
  })

  return {
    totalSamples: samples.length,
    gestureClasses: Object.keys(samplesPerGesture).sort(),
    samplesPerGesture,
  }
}

export async function clearAllSamples(): Promise<void> {
  const database = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite")
    const store = transaction.objectStore(STORE_NAME)
    const request = store.clear()
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

export async function deleteSamplesByGesture(gesture: string): Promise<void> {
  const samples = await getSamplesByGesture(gesture)
  const database = await openDB()

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite")
    const store = transaction.objectStore(STORE_NAME)

    let completed = 0
    samples.forEach((sample) => {
      const request = store.delete(sample.id)
      request.onsuccess = () => {
        completed++
        if (completed === samples.length) resolve()
      }
      request.onerror = () => reject(request.error)
    })

    if (samples.length === 0) resolve()
  })
}
