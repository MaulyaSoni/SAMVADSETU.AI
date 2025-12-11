import { NextRequest, NextResponse } from "next/server";

/**
 * ASL Recognition API - This endpoint is kept for future use
 * Currently, recognition happens client-side in the browser
 * since we have direct access to image data and TensorFlow.js there
 */

export async function POST(request: NextRequest) {
  try {
    return NextResponse.json(
      {
        error: "Client-side processing required",
        message: "ASL recognition is processed on the client side using TensorFlow.js",
        success: false,
        details: "Use the ASLRecognizer component which handles image processing in the browser",
      },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("ASL prediction error:", error);
    return NextResponse.json(
      {
        error: "Request failed",
        details: error?.message || String(error),
        success: false,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "ASL Alphabet Recognition API",
    endpoint: "/api/recognize",
    method: "POST",
    description: "Predict ASL alphabet letter from image",
    note: "This endpoint is for reference. Recognition happens client-side.",
  });
}

