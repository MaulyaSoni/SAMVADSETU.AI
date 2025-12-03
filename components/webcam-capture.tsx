"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import {
  initializeHandDetector,
  detectHands,
  drawHandLandmarks,
  landmarksToFeatures,
  normalizeLandmarks,
  type HandDetectionResult,
} from "@/lib/hand-detector"

interface WebcamCaptureProps {
  onHandDetected?: (detection: HandDetectionResult, features: number[]) => void
  onFrameCaptured?: (imageData: string, features: number[]) => void
  showSkeleton?: boolean
  autoDetect?: boolean
  detectInterval?: number
}

export function WebcamCapture({
  onHandDetected,
  onFrameCaptured,
  showSkeleton = true,
  autoDetect = false,
  detectInterval = 100,
}: WebcamCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)
  const lastDetectionTime = useRef<number>(0)

  const [isStreaming, setIsStreaming] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const [initProgress, setInitProgress] = useState("")
  const [lastDetection, setLastDetection] = useState<HandDetectionResult | null>(null)
  const [error, setError] = useState<string>("")
  const [permissionState, setPermissionState] = useState<"prompt" | "granted" | "denied" | "unknown">("unknown")
  const [fps, setFps] = useState(0)

  const frameCount = useRef(0)
  const lastFpsUpdate = useRef(Date.now())

  useEffect(() => {
    const init = async () => {
      setIsInitializing(true)
      setInitProgress("Initializing hand detector...")

      try {
        const handSuccess = await initializeHandDetector()
        setIsInitialized(handSuccess)

        if (!handSuccess) {
          setError("Hand detector failed. Please refresh.")
        } else {
          setInitProgress("")
        }
      } catch (err) {
        console.error("[SignBridge] Initialization error:", err)
        setError("Failed to initialize. Please refresh the page.")
      } finally {
        setIsInitializing(false)
      }
    }
    init()
  }, [])

  useEffect(() => {
    const checkPermission = async () => {
      try {
        if (navigator.permissions) {
          const result = await navigator.permissions.query({ name: "camera" as PermissionName })
          setPermissionState(result.state as "prompt" | "granted" | "denied")
        }
      } catch {
        // Permission API not supported
      }
    }
    checkPermission()
  }, [])

  const startCamera = async () => {
    setError("")

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Camera API not supported. Use Chrome, Firefox, Edge, or Safari.")
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await new Promise((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = resolve
          }
        })
        await videoRef.current.play()
        setIsStreaming(true)
        setPermissionState("granted")
      }
    } catch (err: any) {
      console.error("[SignBridge] Camera error:", err)

      if (err.name === "NotAllowedError") {
        setPermissionState("denied")
        setError("Camera access denied. Please enable camera in browser settings.")
      } else if (err.name === "NotFoundError") {
        setError("No camera found. Please connect a camera.")
      } else if (err.name === "NotReadableError") {
        setError("Camera is in use by another application.")
      } else {
        setError(`Camera error: ${err.message || "Unknown error"}`)
      }
    }
  }

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach((track) => track.stop())
      videoRef.current.srcObject = null
    }
    setIsStreaming(false)
    cancelAnimationFrame(animationRef.current)
  }

  const runDetection = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !isStreaming || !isInitialized) {
      if (autoDetect && isStreaming) {
        animationRef.current = requestAnimationFrame(runDetection)
      }
      return
    }

    const video = videoRef.current
    const canvas = canvasRef.current
    const overlayCanvas = overlayCanvasRef.current
    const ctx = canvas.getContext("2d", { willReadFrequently: true })

    if (!ctx) return

    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth || 640
      canvas.height = video.videoHeight || 480
      if (overlayCanvas) {
        overlayCanvas.width = canvas.width
        overlayCanvas.height = canvas.height
      }
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Update FPS
    frameCount.current++
    const now = Date.now()
    if (now - lastFpsUpdate.current >= 1000) {
      setFps(frameCount.current)
      frameCount.current = 0
      lastFpsUpdate.current = now
    }

    // Rate-limit detection
    if (now - lastDetectionTime.current < detectInterval) {
      if (autoDetect && isStreaming) {
        animationRef.current = requestAnimationFrame(runDetection)
      }
      return
    }
    lastDetectionTime.current = now

    const detections = detectHands(video, canvas)

    // Draw skeleton on overlay canvas
    if (overlayCanvas && showSkeleton) {
      const overlayCtx = overlayCanvas.getContext("2d")
      if (overlayCtx) {
        overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height)
        if (detections.length > 0) {
          drawHandLandmarks(overlayCtx, detections[0].landmarks, "#00ffff")
        }
      }
    }

    if (detections.length > 0) {
      const detection = detections[0]
      setLastDetection(detection)

      const normalized = normalizeLandmarks(detection.landmarks)
      const features = landmarksToFeatures(normalized)

      if (onHandDetected && features.length === 63) {
        onHandDetected(detection, features)
      }
    } else {
      setLastDetection(null)
    }

    if (autoDetect && isStreaming) {
      animationRef.current = requestAnimationFrame(runDetection)
    }
  }, [isStreaming, isInitialized, showSkeleton, autoDetect, detectInterval, onHandDetected])

  useEffect(() => {
    if (autoDetect && isStreaming && isInitialized) {
      animationRef.current = requestAnimationFrame(runDetection)
    }

    return () => {
      cancelAnimationFrame(animationRef.current)
    }
  }, [autoDetect, isStreaming, isInitialized, runDetection])

  const captureFrame = async () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")

    if (!ctx) return

    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    const detections = detectHands(video, canvas)

    if (detections.length > 0 && onFrameCaptured) {
      const detection = detections[0]
      const normalized = normalizeLandmarks(detection.landmarks)
      const features = landmarksToFeatures(normalized)
      const imageData = canvas.toDataURL("image/jpeg", 0.8)

      if (showSkeleton) {
        drawHandLandmarks(ctx, detection.landmarks, "#00ffff")
      }

      onFrameCaptured(imageData, features)
    }
  }

  const toggleCamera = () => {
    if (isStreaming) {
      stopCamera()
    } else {
      startCamera()
    }
  }

  return (
    <div className="space-y-4">
      {/* Video container */}
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden border-2 border-primary/50">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: "scaleX(-1)" }}
        />
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover opacity-0" />
        <canvas
          ref={overlayCanvasRef}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          style={{ transform: "scaleX(-1)" }}
        />

        {/* Not streaming overlay */}
        {!isStreaming && (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground bg-black/80">
            <div className="text-center">
              <div className="text-4xl mb-2">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <p className="font-medium">Camera Ready</p>
              {permissionState === "denied" ? (
                <p className="text-sm text-destructive">Permission denied - check browser settings</p>
              ) : (
                <p className="text-sm">Click Start to begin</p>
              )}
            </div>
          </div>
        )}

        {/* Status indicators */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          <div className="flex gap-2 flex-wrap">
            {isStreaming && (
              <div className="px-2 py-1 bg-red-500/80 text-white text-xs rounded-full flex items-center gap-1">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                LIVE
              </div>
            )}
            {isStreaming && <div className="px-2 py-1 bg-black/60 text-white text-xs rounded-full">{fps} FPS</div>}
            {isInitialized && (
              <div className="px-2 py-1 bg-green-500/80 text-white text-xs rounded-full">Hand Detection Ready</div>
            )}
          </div>
          {lastDetection && (
            <div className="px-2 py-1 bg-primary/80 text-primary-foreground text-xs rounded-full">
              Hand: {lastDetection.handedness} ({(lastDetection.score * 100).toFixed(0)}%) | Fingers:{" "}
              {lastDetection.fingerCount}
            </div>
          )}
        </div>

        {/* Initialization status */}
        {isInitializing && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="bg-black/80 backdrop-blur-sm rounded-lg p-4 text-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-sm text-primary">{initProgress || "Initializing..."}</p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-destructive/20 border border-destructive/50 rounded-lg">
          <p className="text-sm text-destructive font-medium mb-2">{error}</p>
          {permissionState === "denied" && (
            <div className="text-xs text-muted-foreground space-y-1">
              <p>To enable camera access:</p>
              <ul className="list-disc list-inside ml-2">
                <li>Click the camera icon in your browser address bar</li>
                <li>Or go to browser Settings - Privacy and Security - Site Settings</li>
                <li>Find Camera permissions and allow access for this site</li>
                <li>Refresh the page after enabling</li>
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-3">
        <Button
          onClick={toggleCamera}
          size="lg"
          disabled={isInitializing}
          className={`flex-1 ${
            isStreaming ? "bg-destructive hover:bg-destructive/90" : "bg-primary hover:bg-primary/90"
          } text-white`}
        >
          {isInitializing ? initProgress || "Initializing..." : isStreaming ? "Stop Camera" : "Start Camera"}
        </Button>

        {!autoDetect && (
          <Button
            onClick={captureFrame}
            disabled={!isStreaming || !isInitialized}
            size="lg"
            variant="outline"
            className="flex-1 border-secondary text-secondary bg-transparent hover:bg-secondary/10"
          >
            Capture Frame
          </Button>
        )}
      </div>
    </div>
  )
}
