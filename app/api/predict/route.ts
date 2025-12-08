import { NextRequest, NextResponse } from "next/server";
import * as tf from "@tensorflow/tfjs";

let model: tf.LayersModel | null = null;
let labels: { [key: string]: string } = {};

async function loadModel() {
  if (model) return;

  try {
    // Load the TFJS model from public directory
    model = await tf.loadLayersModel("indexeddb://cnn-gesture-model");
    console.log("Model loaded from IndexedDB");
  } catch (error) {
    try {
      console.log("Loading model from file...");
      model = await tf.loadLayersModel("/tfjs/model.json");
      console.log("Model loaded from file");
    } catch (fileError) {
      console.error("Failed to load model:", fileError);
      throw new Error("Could not load gesture recognition model");
    }
  }

  // Load labels
  if (Object.keys(labels).length === 0) {
    try {
      const response = await fetch("/data/models/labels.json");
      labels = await response.json();
      console.log("Labels loaded:", Object.values(labels));
    } catch (error) {
      console.error("Error loading labels:", error);
      labels = { "0": "hand_gesture_1", "1": "hand_gesture_2", "2": "hand_gesture_3" };
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageArray } = body;

    if (!imageArray || !Array.isArray(imageArray)) {
      return NextResponse.json(
        { error: "Invalid imageArray provided" },
        { status: 400 }
      );
    }

    // Load model if not already loaded
    await loadModel();

    // Convert array to tensor (128x128 grayscale)
    const input = tf.tensor(imageArray)
      .reshape([1, 128, 128, 1])
      .asType("float32");

    // Normalize if needed (values should be 0-1)
    const normalized = input.div(255.0);

    // Run prediction
    const prediction = model!.predict(normalized) as tf.Tensor;
    const probabilities = await prediction.data();

    // Get top prediction
    let maxProb = 0;
    let predictedIndex = 0;
    for (let i = 0; i < probabilities.length; i++) {
      if (probabilities[i] > maxProb) {
        maxProb = probabilities[i];
        predictedIndex = i;
      }
    }

    // Get gesture label
    const gestureLabel = labels[String(predictedIndex)] || "unknown_gesture";

    // Cleanup tensors
    input.dispose();
    normalized.dispose();
    prediction.dispose();

    return NextResponse.json({
      gesture: gestureLabel,
      confidence: (maxProb * 100).toFixed(2) + "%",
      index: predictedIndex,
      allProbabilities: Array.from(probabilities),
    });
    
  } catch (error) {
    console.error("Prediction error:", error);
    return NextResponse.json(
      { error: "Prediction failed", details: String(error) },
      { status: 500 }
    );
  }
}
