"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface PredictionResult {
  gesture: string
  confidence: number
  allPredictions?: Array<{ gesture: string; score: number }>
}

interface GestureDisplayProps {
  prediction: PredictionResult | null
  isProcessing?: boolean
}

export function GestureDisplay({ prediction, isProcessing = false }: GestureDisplayProps) {
  return (
    <Card className="container-glass border-secondary/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-secondary flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11"
            />
          </svg>
          Gesture Recognition
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main prediction */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Detected Gesture</p>
          <div className="text-3xl font-bold text-primary h-12 flex items-center">
            {isProcessing ? (
              <span className="text-muted-foreground animate-pulse">Analyzing...</span>
            ) : prediction ? (
              prediction.gesture
            ) : (
              <span className="text-muted-foreground">Show a gesture</span>
            )}
          </div>
        </div>

        {/* Confidence bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">Confidence</p>
            <span className="text-sm font-semibold text-accent">
              {prediction ? `${(prediction.confidence * 100).toFixed(0)}%` : "—"}
            </span>
          </div>
          <Progress value={prediction ? prediction.confidence * 100 : 0} className="h-2" />
        </div>

        {/* Top predictions */}
        {prediction?.allPredictions && prediction.allPredictions.length > 1 && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Alternative Matches</p>
            <div className="space-y-1">
              {prediction.allPredictions.slice(1, 4).map((p, idx) => (
                <div key={idx} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{p.gesture}</span>
                  <span className="text-muted-foreground">{(p.score * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
