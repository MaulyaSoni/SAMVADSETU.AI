"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ModelInfo {
  modelLoaded: boolean
  metadata: {
    accuracy: number
    num_gestures: number
    model_type: string
    training_date: string
  }
}

export function ModelStatus() {
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchModelInfo = async () => {
      try {
        const response = await fetch("/api/model/info")
        const data = await response.json()
        setModelInfo(data)
      } catch (error) {
        console.error("[v0] Error fetching model info:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchModelInfo()
  }, [])

  if (loading) {
    return (
      <Card className="container-glass border-border/50">
        <CardContent className="pt-6">
          <div className="text-sm text-muted-foreground">Loading model info...</div>
        </CardContent>
      </Card>
    )
  }

  if (!modelInfo?.modelLoaded) {
    return (
      <Card className="container-glass border-destructive/50 bg-destructive/5">
        <CardHeader>
          <CardTitle className="text-sm text-destructive">Model Not Trained</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Run the training script to generate a model:{" "}
          <code className="text-xs bg-card p-1 rounded">python scripts/train_gesture_model.py</code>
        </CardContent>
      </Card>
    )
  }

  const { accuracy, num_gestures, model_type, training_date } = modelInfo.metadata

  return (
    <Card className="container-glass border-primary/30">
      <CardHeader>
        <CardTitle className="text-sm text-primary">Model Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">Accuracy</span>
          <span className="font-semibold text-primary">{(accuracy * 100).toFixed(1)}%</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">Gestures</span>
          <span className="font-semibold">{num_gestures}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">Type</span>
          <span className="font-semibold text-secondary">{model_type}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">Trained</span>
          <span className="font-semibold text-xs">{new Date(training_date).toLocaleDateString()}</span>
        </div>
      </CardContent>
    </Card>
  )
}
