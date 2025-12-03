"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { Header } from "@/components/header"
import { WebcamCapture } from "@/components/webcam-capture"
import { GestureDisplay } from "@/components/gesture-display"
import { TranslationOutput } from "@/components/translation-output"
import { ConversationHistory } from "@/components/conversation-history"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { loadTrainedModel, predictGesture } from "@/lib/tensorflow-model"
import { generateContextualSentence } from "@/lib/sentence-generator"
import type { HandDetectionResult } from "@/lib/hand-detector"

interface ConversationEntry {
  id: string
  gesture: string
  sentence: string
  timestamp: Date
  confidence: number
}

interface PredictionResult {
  gesture: string
  confidence: number
  allPredictions?: Array<{ gesture: string; score: number }>
}

export default function RecognizePage() {
  const [prediction, setPrediction] = useState<PredictionResult | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [autoMode, setAutoMode] = useState(true)
  const [recognizedGestures, setRecognizedGestures] = useState<string[]>([])
  const [generatedSentence, setGeneratedSentence] = useState("")
  const [conversationHistory, setConversationHistory] = useState<ConversationEntry[]>([])
  const [modelLoaded, setModelLoaded] = useState(false)
  const [modelInfo, setModelInfo] = useState<{
    isReady: boolean
    numClasses: number
    gestureLabels: string[]
    accuracy: number
  } | null>(null)

  // Gesture stability tracking
  const lastGesture = useRef("")
  const gestureStableCount = useRef(0)
  const lastAddedTime = useRef(0)

  // Load trained model on mount
  useEffect(() => {
    loadModel()
  }, [])

  const loadModel = async () => {
    const model = await loadTrainedModel()
    if (model) {
      setModelLoaded(true)
      setModelInfo(model)
    }
  }

  const handleHandDetected = useCallback(
    async (detection: HandDetectionResult, features: number[]) => {
      if (!modelLoaded || !detection.detected || features.length !== 63) {
        return
      }

      const now = Date.now()
      setIsProcessing(true)

      // Run prediction through TensorFlow model
      const result = await predictGesture(features)

      if (!result || result.confidence < 0.3) {
        setPrediction({
          gesture: "Recognizing...",
          confidence: result?.confidence || 0,
          allPredictions: result?.allPredictions,
        })
        setIsProcessing(false)
        return
      }

      setPrediction(result)

      // Track gesture stability
      if (result.gesture === lastGesture.current) {
        gestureStableCount.current++
      } else {
        gestureStableCount.current = 1
        lastGesture.current = result.gesture
      }

      // Only add to history if gesture is stable and confident
      const minTimeBetweenGestures = 1500
      if (
        gestureStableCount.current >= 8 &&
        result.confidence > 0.6 &&
        now - lastAddedTime.current > minTimeBetweenGestures
      ) {
        const lastInHistory = recognizedGestures[recognizedGestures.length - 1]
        if (result.gesture !== lastInHistory) {
          const updatedGestures = [...recognizedGestures, result.gesture]
          setRecognizedGestures(updatedGestures)

          const sentence = generateContextualSentence(updatedGestures)
          setGeneratedSentence(sentence)

          const entry: ConversationEntry = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            gesture: result.gesture,
            sentence,
            timestamp: new Date(),
            confidence: result.confidence,
          }
          setConversationHistory((prev) => [...prev, entry])

          gestureStableCount.current = 0
          lastAddedTime.current = now
        }
      }

      setIsProcessing(false)
    },
    [modelLoaded, recognizedGestures],
  )

  const clearHistory = () => {
    setConversationHistory([])
    setRecognizedGestures([])
    setGeneratedSentence("")
    setPrediction(null)
    lastGesture.current = ""
    gestureStableCount.current = 0
    lastAddedTime.current = 0
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-4xl font-bold tracking-tight">Real-Time Translation</h1>
              <p className="text-muted-foreground">Show your hand gestures to the camera for instant translation</p>
            </div>

            <div className="flex items-center gap-3 p-3 bg-card/50 rounded-lg border border-border/50">
              <span className="text-sm font-medium">Continuous Mode</span>
              <Switch checked={autoMode} onCheckedChange={setAutoMode} />
            </div>
          </div>

          {/* Model not loaded warning */}
          {!modelLoaded && (
            <Card className="border-yellow-500/50 bg-yellow-500/10">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-yellow-500">No Trained Model Found</h3>
                    <p className="text-sm text-muted-foreground">You need to collect data and train a model first</p>
                  </div>
                  <div className="flex gap-2">
                    <Button asChild variant="outline" size="sm">
                      <a href="/collect">Collect Data</a>
                    </Button>
                    <Button asChild size="sm" className="bg-yellow-600 hover:bg-yellow-700">
                      <a href="/train">Train Model</a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 space-y-4">
              <Card className="container-glass border-primary/30">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-primary flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                      Live Camera Feed
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          modelLoaded ? "bg-green-500" : "bg-yellow-500 animate-pulse"
                        }`}
                      />
                      <span className="text-xs text-muted-foreground">
                        {modelLoaded
                          ? `Model: ${modelInfo?.numClasses} gestures (${((modelInfo?.accuracy || 0) * 100).toFixed(0)}% acc)`
                          : "No model loaded"}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <WebcamCapture
                    onHandDetected={handleHandDetected}
                    showSkeleton={true}
                    autoDetect={autoMode && modelLoaded}
                    detectInterval={100}
                  />
                </CardContent>
              </Card>

              <Card className="container-glass border-border/30">
                <CardContent className="pt-4">
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground">
                      <strong>Tips:</strong> Hold your hand steady for recognition. The model will recognize gestures
                      you trained it on. Higher confidence = more accurate prediction.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2 space-y-4">
              <GestureDisplay prediction={prediction} isProcessing={isProcessing} />
              <TranslationOutput sentence={generatedSentence} onClear={clearHistory} />

              {recognizedGestures.length > 0 && (
                <Card className="container-glass border-accent/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-accent">Current Sequence</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {recognizedGestures.slice(-5).map((g, idx) => (
                        <span key={idx} className="px-2 py-1 bg-accent/20 text-accent text-xs rounded-full">
                          {g}
                        </span>
                      ))}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearHistory}
                      className="mt-3 text-xs text-muted-foreground"
                    >
                      Clear sequence
                    </Button>
                  </CardContent>
                </Card>
              )}

              {modelInfo && (
                <Card className="container-glass border-border/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Trained Gestures</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                      {modelInfo.gestureLabels.map((gesture) => (
                        <span
                          key={gesture}
                          className="px-1.5 py-0.5 bg-muted/50 text-muted-foreground text-[10px] rounded"
                        >
                          {gesture}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          <ConversationHistory entries={conversationHistory} onClear={clearHistory} />
        </div>
      </main>
    </div>
  )
}
