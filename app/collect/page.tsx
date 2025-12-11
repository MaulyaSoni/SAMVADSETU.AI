"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { Header } from "@/components/header"
import { WebcamCapture } from "@/components/webcam-capture"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import {
  saveSample,
  getDatasetStats,
  deleteSamplesByGesture,
  clearAllSamples,
  type TrainingSample,
} from "@/lib/training-data-store"
import type { HandDetectionResult } from "@/lib/hand-detector"

export default function CollectPage() {
  const [gestureName, setGestureName] = useState("")
  const [sessionSamples, setSessionSamples] = useState<TrainingSample[]>([])
  const [isCapturing, setIsCapturing] = useState(false)
  const [captureProgress, setCaptureProgress] = useState(0)
  const [status, setStatus] = useState("")
  const [datasetStats, setDatasetStats] = useState<{
    totalSamples: number
    gestureClasses: string[]
    samplesPerGesture: Record<string, number>
  } | null>(null)

  const captureCountRef = useRef(0)
  const maxCaptures = 30

  // Load dataset stats on mount
  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    const stats = await getDatasetStats()
    setDatasetStats(stats)
  }

  // Handle hand detection during capture
  const handleHandDetected = useCallback(
    async (detection: HandDetectionResult, features: number[]) => {
      if (!isCapturing || !gestureName.trim()) return
      if (!detection.landmarks || features.length !== 63) return

      captureCountRef.current++
      const progress = (captureCountRef.current / maxCaptures) * 100
      setCaptureProgress(progress)

      const sample: TrainingSample = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        gesture: gestureName.trim(),
        features,
        timestamp: Date.now(),
      }

      await saveSample(sample)
      setSessionSamples((prev) => [...prev, sample])

      if (captureCountRef.current >= maxCaptures) {
        stopBatchCapture()
      }
    },
    [isCapturing, gestureName],
  )

  const startBatchCapture = () => {
    if (!gestureName.trim()) {
      setStatus("Please enter a gesture name first")
      return
    }

    setIsCapturing(true)
    captureCountRef.current = 0
    setCaptureProgress(0)
    setStatus(`Recording "${gestureName}"... Hold your gesture steady`)
  }

  const stopBatchCapture = async () => {
    setIsCapturing(false)
    const count = captureCountRef.current
    setStatus(`Captured ${count} samples for "${gestureName}"`)
    captureCountRef.current = 0
    await loadStats()
  }

  const handleClearGesture = async () => {
    if (!gestureName.trim()) return
    await deleteSamplesByGesture(gestureName.trim())
    setSessionSamples((prev) => prev.filter((s) => s.gesture !== gestureName.trim()))
    setStatus(`Cleared all samples for "${gestureName}"`)
    await loadStats()
  }

  const handleClearAll = async () => {
    if (confirm("Are you sure you want to delete ALL training data?")) {
      await clearAllSamples()
      setSessionSamples([])
      setStatus("All training data cleared")
      await loadStats()
    }
  }

  const currentGestureSamples = gestureName.trim() ? datasetStats?.samplesPerGesture[gestureName.trim()] || 0 : 0

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">Collect Training Data</h1>
            <p className="text-muted-foreground">Record your own gestures to train the recognition model</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Card className="container-glass border-primary/30">
                <CardHeader>
                  <CardTitle className="text-primary">Capture Gestures</CardTitle>
                  <CardDescription>Position your hand in the frame and capture multiple samples</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Gesture Name</label>
                    <Input
                      placeholder="e.g., 'Hello', 'Thank You', 'Pain'"
                      value={gestureName}
                      onChange={(e) => setGestureName(e.target.value)}
                      className="bg-input border-border/50"
                      disabled={isCapturing}
                    />
                    {gestureName && (
                      <p className="text-xs text-muted-foreground">
                        {currentGestureSamples} samples saved for this gesture
                      </p>
                    )}
                  </div>

                  <WebcamCapture
                    onHandDetected={handleHandDetected}
                    showSkeleton={true}
                    autoDetect={isCapturing}
                    detectInterval={100}
                  />

                  {isCapturing && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Recording progress</span>
                        <span>
                          {captureCountRef.current} / {maxCaptures}
                        </span>
                      </div>
                      <Progress value={captureProgress} className="h-2" />
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      onClick={isCapturing ? stopBatchCapture : startBatchCapture}
                      disabled={!gestureName.trim()}
                      size="lg"
                      className={`flex-1 ${
                        isCapturing ? "bg-destructive hover:bg-destructive/90" : "bg-secondary hover:bg-secondary/90"
                      } text-white`}
                    >
                      {isCapturing ? "Stop Recording" : "Start Batch Capture"}
                    </Button>
                    <Button
                      onClick={handleClearGesture}
                      disabled={currentGestureSamples === 0 || isCapturing}
                      variant="outline"
                      size="lg"
                    >
                      Clear Gesture
                    </Button>
                  </div>

                  {status && (
                    <div className="p-3 bg-primary/10 border border-primary/30 rounded-lg text-sm text-primary">
                      {status}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card className="container-glass border-accent/30">
                <CardHeader>
                  <CardTitle className="text-accent">Dataset Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Samples</span>
                    <span className="font-bold text-lg">{datasetStats?.totalSamples || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Gesture Classes</span>
                    <span className="font-bold text-lg">{datasetStats?.gestureClasses.length || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Session Captures</span>
                    <span className="font-bold text-lg">{sessionSamples.length}</span>
                  </div>

                  {datasetStats && datasetStats.gestureClasses.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-border/30">
                      <h4 className="text-xs font-medium text-muted-foreground">Samples per Gesture</h4>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {Object.entries(datasetStats.samplesPerGesture).map(([gesture, count]) => (
                          <div
                            key={gesture}
                            className="flex justify-between text-xs cursor-pointer hover:bg-muted/30 px-1 py-0.5 rounded"
                            onClick={() => setGestureName(gesture)}
                          >
                            <span>{gesture}</span>
                            <span className="text-muted-foreground">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={handleClearAll}
                    variant="destructive"
                    size="sm"
                    className="w-full"
                    disabled={!datasetStats || datasetStats.totalSamples === 0}
                  >
                    Clear All Data
                  </Button>
                </CardContent>
              </Card>

              <Card className="container-glass border-secondary/30">
                <CardHeader>
                  <CardTitle className="text-secondary text-sm">Capture Tips</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    "Use good, even lighting",
                    "Keep hand fully in frame",
                    "Vary hand angles slightly",
                    "Capture 20-30 samples per gesture",
                    "Keep background clean/simple",
                    "Hold gesture steady during capture",
                  ].map((tip, idx) => (
                    <div key={idx} className="flex gap-2 text-sm">
                      <span className="text-accent font-bold">{idx + 1}.</span>
                      <span className="text-muted-foreground">{tip}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Next Steps */}
              <Card className="container-glass border-green-500/30">
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-green-500">Next Step</h4>
                    <p className="text-xs text-muted-foreground">After collecting enough samples, train your model</p>
                    <Button asChild size="sm" className="w-full bg-green-600 hover:bg-green-700">
                      <a href="/train">Go to Training</a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
