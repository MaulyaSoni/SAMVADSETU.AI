"use client";

import { useEffect, useRef, useState } from "react";

interface CameraFeedProps {
  onFrameCapture: (imageArray: number[]) => void;
  isActive?: boolean;
}

export default function CameraFeed({ onFrameCapture, isActive = true }: CameraFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const captureIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isActive) return;

    let stream: MediaStream | null = null;

    const initCamera = async () => {
      try {
        // Request camera access
        stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            width: { ideal: 640 }, 
            height: { ideal: 480 },
            facingMode: "user"
          },
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          
          // Wait for video to be ready
          await new Promise((resolve) => {
            if (videoRef.current) {
              videoRef.current.onloadedmetadata = () => {
                videoRef.current?.play().then(resolve).catch(resolve);
              };
            }
          });

          setIsLoading(false);
          startFrameCapture();
        }
      } catch (err) {
        console.error("Camera access error:", err);
        setError("Unable to access camera. Please grant camera permissions.");
        setIsLoading(false);
      }
    };

    initCamera();

    return () => {
      if (captureIntervalRef.current) {
        clearInterval(captureIntervalRef.current);
      }
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isActive]);

  const startFrameCapture = () => {
    // Capture frame every 300ms for prediction
    captureIntervalRef.current = setInterval(() => {
      if (!videoRef.current || !canvasRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      if (!ctx) return;

      // Set canvas to 128x128 (model input size)
      canvas.width = 128;
      canvas.height = 128;

      // Draw video frame onto canvas
      ctx.drawImage(videoRef.current, 0, 0, 128, 128);

      // Get image data
      const imageData = ctx.getImageData(0, 0, 128, 128);
      const data = imageData.data;

      // Convert to grayscale and extract pixel values (0-255)
      const grayscaleArray: number[] = [];
      for (let i = 0; i < data.length; i += 4) {
        // Calculate grayscale from RGB
        const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
        grayscaleArray.push(gray);
      }

      // Call parent handler with frame data
      onFrameCapture(grayscaleArray);
    }, 300);
  };

  return (
    <div className="relative w-full">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg">
          <p className="text-white font-semibold">Initializing camera...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <video
        ref={videoRef}
        className="w-full rounded-lg bg-black"
        playsInline
      />

      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
