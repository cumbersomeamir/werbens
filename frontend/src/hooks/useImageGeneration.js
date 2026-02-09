/**
 * Custom hook for image generation
 */
import { useState, useCallback } from "react";
import { generateImage, fileToBase64 } from "../api/services/imageGenerationService.js";

export function useImageGeneration() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const generate = useCallback(async ({ prompt, referenceImage, aspectRatio = "1:1" }) => {
    setIsLoading(true);
    setError(null);

    try {
      let referenceImageBase64 = null;
      let referenceImageMime = "image/jpeg";

      if (referenceImage instanceof File) {
        const { base64, mime } = await fileToBase64(referenceImage);
        referenceImageBase64 = base64;
        referenceImageMime = mime;
      } else if (typeof referenceImage === "string") {
        // Assume it's already base64
        referenceImageBase64 = referenceImage;
      }

      const result = await generateImage({
        prompt,
        referenceImageBase64,
        referenceImageMime,
        aspectRatio,
      });

      return result;
    } catch (err) {
      const errorMessage = err.message || "Image generation failed";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    generate,
    isLoading,
    error,
  };
}
