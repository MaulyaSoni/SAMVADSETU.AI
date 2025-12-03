"use client"

import { useState, useEffect, useCallback } from "react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Slider } from "@/components/ui/slider"
import { getDatasetStats, getAllSamples } from "@/lib/training-data-store"
import {
  trainModel,
  loadTrainedModel,
  deleteSavedModel,
  type TrainingProgress,
  type TrainedModel,
} from "@/lib/tensorflow-model"

export default function TrainPage() {
  const [datasetStats, setDatasetStats] = useState<{
    totalSamples: number
    gestureClasses: string[]
    samplesPerGesture: Record<string, number>
  } | null>(null)

  const [trainingProgress, setTrainingProgress] = useState<TrainingProgress | null>(null)
  const [trainedModel, setTrainedModel] = useState<TrainedModel | null>(null)
  const [isTraining, setIsTraining] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Training config
  const [epochs, setEpochs] = useState(50)
  const [learningRate, setLearningRate] = useState(0.001)
  const [batchSize, setBatchSize] = useState(32)

  // Load dataset stats and existing model on mount
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const stats = await getDatasetStats()
      setDatasetStats(stats)

      const existingModel = await loadTrainedModel()
      setTrainedModel(existingModel)
    } catch (err) {
      console.error("Failed to load data:", err)
    }
  }

  const handleStartTraining = useCallback(async () => {
    if (!datasetStats || datasetStats.totalSamples === 0) {
      setError("No training data available. Please collect samples first.")
      return
    }

    if (datasetStats.gestureClasses.length < 2) {
      setError("Need at least 2 different gestures to train.")
      return
    }

    setIsTraining(true)
    setError(null)
    setTrainingProgress(null)

    try {
      const samples = await getAllSamples()
      const gestureLabels = datasetStats.gestureClasses

      const result = await trainModel(
        samples.map((s) => ({ gesture: s.gesture, features: s.features })),
        gestureLabels,
        { epochs, learningRate, batchSize },
        (progress) => setTrainingProgress(progress),
      )

      setTrainedModel(result)
      setTrainingProgress((prev) => (prev ? { ...prev, status: "Training complete! Model saved." } : null))
    } catch (err: any) {
      setError(err.message || "Training failed")
      console.error("Training error:", err)
    } finally {
      setIsTraining(false)
    }
  }, [datasetStats, epochs, learningRate, batchSize])

  const handleDeleteModel = async () => {
    if (confirm("Are you sure you want to delete the trained model?")) {
      await deleteSavedModel()
      setTrainedModel(null)
      setTrainingProgress(null)
    }
  }

  const minSamplesPerGesture = datasetStats ? Math.min(...Object.values(datasetStats.samplesPerGesture)) : 0

  const canTrain =
    datasetStats &&
    datasetStats.totalSamples >= 20 &&
    datasetStats.gestureClasses.length >= 2 &&
    minSamplesPerGesture >= 5

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">Train Model</h1>
            <p className="text-muted-foreground">Train the gesture recognition CNN model on your collected data</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Dataset Overview */}
            <Card className="container-glass border-primary/30">
              <CardHeader>
                <CardTitle className="text-primary">Dataset Overview</CardTitle>
                <CardDescription>Your collected training data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {datasetStats ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-primary/10 rounded-lg text-center">
                        <div className="text-3xl font-bold text-primary">{datasetStats.totalSamples}</div>
                        <div className="text-sm text-muted-foreground">Total Samples</div>
                      </div>
                      <div className="p-4 bg-secondary/10 rounded-lg text-center">
                        <div className="text-3xl font-bold text-secondary">{datasetStats.gestureClasses.length}</div>
                        <div className="text-sm text-muted-foreground">Gesture Classes</div>
                      </div>
                    </div>

                    {/* Samples per gesture */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Samples per Gesture</h4>
                      <div className="max-h-48 overflow-y-auto space-y-2">
                        {Object.entries(datasetStats.samplesPerGesture).map(([gesture, count]) => (
                          <div key={gesture} className="flex items-center justify-between">
                            <span className="text-sm">{gesture}</span>
                            <div className="flex items-center gap-2">
                              <Progress value={Math.min((count / 30) * 100, 100)} className="w-24 h-2" />
                              <span className="text-xs text-muted-foreground w-8">{count}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Requirements check */}
                    <div className="p-3 bg-muted/30 rounded-lg space-y-1 text-sm">
                      <div className={datasetStats.totalSamples >= 20 ? "text-green-500" : "text-yellow-500"}>
                        {datasetStats.totalSamples >= 20 ? "✓" : "○"} At least 20 total samples
                      </div>
                      <div className={datasetStats.gestureClasses.length >= 2 ? "text-green-500" : "text-yellow-500"}>
                        {datasetStats.gestureClasses.length >= 2 ? "✓" : "○"} At least 2 gesture classes
                      </div>
                      <div className={minSamplesPerGesture >= 5 ? "text-green-500" : "text-yellow-500"}>
                        {minSamplesPerGesture >= 5 ? "✓" : "○"} At least 5 samples per gesture
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">Loading dataset information...</div>
                )}
              </CardContent>
            </Card>

            {/* Training Configuration */}
            <Card className="container-glass border-secondary/30">
              <CardHeader>
                <CardTitle className="text-secondary">Training Configuration</CardTitle>
                <CardDescription>Adjust hyperparameters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Epochs */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label className="text-sm font-medium">Epochs</label>
                    <span className="text-sm text-muted-foreground">{epochs}</span>
                  </div>
                  <Slider
                    value={[epochs]}
                    onValueChange={([v]) => setEpochs(v)}
                    min={10}
                    max={200}
                    step={10}
                    disabled={isTraining}
                  />
                </div>

                {/* Learning Rate */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label className="text-sm font-medium">Learning Rate</label>
                    <span className="text-sm text-muted-foreground">{learningRate}</span>
                  </div>
                  <Slider
                    value={[learningRate * 1000]}
                    onValueChange={([v]) => setLearningRate(v / 1000)}
                    min={0.1}
                    max={10}
                    step={0.1}
                    disabled={isTraining}
                  />
                </div>

                {/* Batch Size */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label className="text-sm font-medium">Batch Size</label>
                    <span className="text-sm text-muted-foreground">{batchSize}</span>
                  </div>
                  <Slider
                    value={[batchSize]}
                    onValueChange={([v]) => setBatchSize(v)}
                    min={8}
                    max={64}
                    step={8}
                    disabled={isTraining}
                  />
                </div>

                {/* Train Button */}
                <Button
                  onClick={handleStartTraining}
                  disabled={!canTrain || isTraining}
                  size="lg"
                  className="w-full bg-secondary hover:bg-secondary/90"
                >
                  {isTraining ? "Training..." : "Start Training"}
                </Button>

                {error && (
                  <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-sm text-destructive">
                    {error}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Training Progress */}
          {trainingProgress && (
            <Card className="container-glass border-accent/30">
              <CardHeader>
                <CardTitle className="text-accent">Training Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span>{trainingProgress.status}</span>
                  <span>
                    Epoch {trainingProgress.epoch} / {trainingProgress.totalEpochs}
                  </span>
                </div>
                <Progress value={(trainingProgress.epoch / trainingProgress.totalEpochs) * 100} className="h-3" />
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-muted/30 rounded-lg text-center">
                    <div className="text-2xl font-bold">{(trainingProgress.accuracy * 100).toFixed(1)}%</div>
                    <div className="text-xs text-muted-foreground">Accuracy</div>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg text-center">
                    <div className="text-2xl font-bold">{trainingProgress.loss.toFixed(4)}</div>
                    <div className="text-xs text-muted-foreground">Loss</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Trained Model Info */}
          {trainedModel && (
            <Card className="container-glass border-green-500/30">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-green-500">Trained Model Ready</CardTitle>
                  <Button variant="destructive" size="sm" onClick={handleDeleteModel}>
                    Delete Model
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 bg-green-500/10 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-500">{(trainedModel.accuracy * 100).toFixed(1)}%</div>
                    <div className="text-xs text-muted-foreground">Accuracy</div>
                  </div>
                  <div className="p-3 bg-green-500/10 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-500">{trainedModel.numClasses}</div>
                    <div className="text-xs text-muted-foreground">Gestures</div>
                  </div>
                  <div className="p-3 bg-green-500/10 rounded-lg text-center">
                    <div className="text-lg font-bold text-green-500">
                      {new Date(trainedModel.trainedAt).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-muted-foreground">Trained</div>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {trainedModel.gestureLabels.map((label) => (
                    <span key={label} className="px-2 py-1 bg-green-500/20 text-green-500 text-xs rounded-full">
                      {label}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Next Steps */}
          <Card className="container-glass border-border/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Ready to test your model?</h3>
                  <p className="text-sm text-muted-foreground">Go to the Recognition page to use your trained model</p>
                </div>
                <Button asChild className="bg-primary hover:bg-primary/90">
                  <a href="/recognize">Go to Recognition</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
