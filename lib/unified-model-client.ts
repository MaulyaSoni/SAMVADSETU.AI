/**
 * Unified Model Inference Client
 * Handles communication with the backend unified model API
 */

export interface PredictionResult {
  model: string;
  prediction: string;
  confidence: number;
  all_predictions: Record<string, number>;
  success: boolean;
  warning?: string;
  error?: string;
}

export interface ModelInfo {
  input_shape: number[];
  output_shape: number[];
  classes: string[];
  params: number;
}

export interface HealthStatus {
  status: string;
  loaded_models: string[];
  models_info: Record<string, ModelInfo>;
}

class UnifiedModelClient {
  private apiUrl: string = "/api/v1/models";

  /**
   * Check health of all loaded models
   */
  async checkHealth(): Promise<HealthStatus> {
    try {
      const response = await fetch(`${this.apiUrl}/health`);
      if (!response.ok) throw new Error("Health check failed");
      return await response.json();
    } catch (error) {
      console.error("Health check error:", error);
      throw error;
    }
  }

  /**
   * Get list of available models
   */
  async getAvailableModels(): Promise<Record<string, ModelInfo>> {
    try {
      const response = await fetch(`${this.apiUrl}/available`);
      if (!response.ok) throw new Error("Failed to fetch models");
      const data = await response.json();
      return data.models;
    } catch (error) {
      console.error("Failed to get available models:", error);
      throw error;
    }
  }

  /**
   * Make a prediction from base64 encoded image
   */
  async predict(
    imageBase64: string,
    model: string = "asl_alphabet",
    confidenceThreshold: number = 0.5
  ): Promise<PredictionResult> {
    try {
      const response = await fetch(`${this.apiUrl}/predict`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: imageBase64,
          model,
          confidence_threshold: confidenceThreshold,
        }),
      });

      if (!response.ok) throw new Error("Prediction failed");
      return await response.json();
    } catch (error) {
      console.error("Prediction error:", error);
      throw error;
    }
  }

  /**
   * Make a prediction from image file path
   */
  async predictFromPath(
    imagePath: string,
    model: string = "asl_alphabet",
    confidenceThreshold: number = 0.5
  ): Promise<PredictionResult> {
    try {
      const response = await fetch(`${this.apiUrl}/predict/url`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          path: imagePath,
          model,
          confidence_threshold: confidenceThreshold,
        }),
      });

      if (!response.ok) throw new Error("Prediction failed");
      return await response.json();
    } catch (error) {
      console.error("Prediction error:", error);
      throw error;
    }
  }

  /**
   * Get predictions from multiple models for comparison
   */
  async comparePredictions(
    imageBase64: string,
    models: string[] = ["asl_alphabet", "sign_mnist"],
    confidenceThreshold: number = 0.5
  ): Promise<{
    status: string;
    predictions: Record<string, PredictionResult>;
    compared_models: string[];
  }> {
    try {
      const response = await fetch(`${this.apiUrl}/compare`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: imageBase64,
          models,
          confidence_threshold: confidenceThreshold,
        }),
      });

      if (!response.ok) throw new Error("Comparison failed");
      return await response.json();
    } catch (error) {
      console.error("Comparison error:", error);
      throw error;
    }
  }

  /**
   * Convert canvas to base64 image
   */
  canvasToBase64(canvas: HTMLCanvasElement, type: string = "image/jpeg"): string {
    return canvas.toDataURL(type).split(",")[1];
  }

  /**
   * Convert Blob to base64
   */
  async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result.split(",")[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}

// Export singleton instance
export const modelClient = new UnifiedModelClient();

export default UnifiedModelClient;
