"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { ASLRecognizer } from "@/components/asl-recognizer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { ASLPrediction } from "@/lib/gesture-classifier"

interface PredictionLog {
  id: string
  prediction: string
  confidence: number
  timestamp: Date
}

export default function RecognizePage() {
  const [predictions, setPredictions] = useState<PredictionLog[]>([])
  const [latestPrediction, setLatestPrediction] = useState<ASLPrediction | null>(null)

  const handleRecognition = (result: ASLPrediction) => {
    setLatestPrediction(result)

    // Add to history
    const log: PredictionLog = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      prediction: result.prediction.class,
      confidence: parseFloat(result.prediction.confidence),
      timestamp: new Date(),
    }
    setPredictions((prev) => [log, ...prev].slice(0, 10))
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">ASL Alphabet Recognition</h1>
            <p className="text-muted-foreground mt-2">
              Use your webcam to recognize American Sign Language letters
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ASLRecognizer onRecognition={handleRecognition} autoCapture={false} />
            </div>

            <div className="space-y-4">
              {/* Latest Prediction */}
              {latestPrediction && (
                <Card>
                  <CardHeader>
                    <CardTitle>Latest Prediction</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center p-6 bg-blue-50 rounded-lg">
                      <div className="text-5xl font-bold text-blue-600">
                        {latestPrediction.prediction.class}
                      </div>
                      <div className="text-sm text-gray-600 mt-2">
                        Confidence: <span className="font-semibold">{latestPrediction.prediction.confidence}%</span>
                      </div>
                    </div>

                    {latestPrediction.topPredictions.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-xs font-semibold text-gray-700 uppercase">Top Matches</h3>
                        {latestPrediction.topPredictions.map((pred, idx) => (
                          <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                            <span className="font-medium">{pred.class}</span>
                            <span className="text-gray-600">{pred.probability}%</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Prediction History */}
              {predictions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Recognition History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {predictions.map((log) => (
                        <div
                          key={log.id}
                          className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition"
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              <div className="text-xl font-bold text-blue-600 w-8 text-center">{log.prediction}</div>
                              <div>
                                <div className="text-xs text-gray-500">
                                  {log.timestamp.toLocaleTimeString()}
                                </div>
                              </div>
                            </div>
                            <div className="text-sm font-semibold text-gray-700">{log.confidence.toFixed(1)}%</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Empty State */}
              {!latestPrediction && (
                <Card className="bg-slate-50 border-dashed">
                  <CardContent className="pt-6">
                    <div className="text-center text-sm text-gray-600">
                      <p>Start by clicking "Capture" to recognize a gesture</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Instructions */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-900">How to Use</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-blue-800">
              <ol className="list-decimal list-inside space-y-1">
                <li>Click "Start Camera" to enable your webcam</li>
                <li>Position your hand clearly in the camera frame</li>
                <li>Click "Capture" to take a snapshot</li>
                <li>The model will recognize the ASL letter and show the result</li>
                <li>Your prediction history appears on the right</li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
