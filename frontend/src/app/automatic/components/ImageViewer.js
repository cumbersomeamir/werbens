"use client";

import { useEffect, useState } from "react";
import { useCurrentUser } from "@/app/onboarding/components/useCurrentUser";
import { getAutomaticImageDownloadUrl } from "@/api/services/automaticService.js";

/**
 * Full-screen image viewer with black overlay and download button
 */
export function ImageViewer({ image, prompt, imageKey, onClose }) {
  const { userId } = useCurrentUser();
  const [isDownloading, setIsDownloading] = useState(false);
  useEffect(() => {
    // Prevent body scroll when viewer is open
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  useEffect(() => {
    // Close on Escape key
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const handleDownload = async () => {
    if (isDownloading) return;
    
    setIsDownloading(true);
    try {
      let downloadUrl = image;
      
      // Get fresh presigned URL if available
      if (imageKey && userId) {
        try {
          const result = await getAutomaticImageDownloadUrl({ userId, imageKey });
          downloadUrl = result.downloadUrl;
        } catch (err) {
          console.warn("Failed to get fresh download URL:", err);
        }
      }
      
      // Standard download pattern: fetch -> blob -> object URL -> anchor click
      const response = await fetch(downloadUrl, { method: "GET" });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `werbens-generated-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);
    } catch (err) {
      console.error("Download error:", err);
      alert("Failed to download image. Please try right-clicking the image and selecting 'Save image as...'");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all duration-200 hover:scale-110 active:scale-95"
        aria-label="Close viewer"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      {/* Image container */}
      <div
        className="relative max-w-[95vw] max-h-[95vh] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={image}
          alt={prompt || "Generated content"}
          className="max-w-full max-h-[95vh] object-contain rounded-lg shadow-2xl"
        />
      </div>

      {/* Download button */}
      <div
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-werbens-dark-cyan to-werbens-midnight text-white font-semibold shadow-elevated-lg hover:shadow-elevated-xl transition-all duration-200 hover:scale-105 active:scale-95 ${
            isDownloading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          <span>{isDownloading ? "Downloading..." : "Download"}</span>
        </button>
      </div>

      {/* Prompt text (optional, shown at bottom) */}
      {prompt && (
        <div
          className="absolute bottom-24 left-1/2 transform -translate-x-1/2 z-10 max-w-2xl px-4"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-sm text-white/80 text-center bg-black/40 backdrop-blur-sm rounded-lg px-4 py-2">
            {prompt}
          </p>
        </div>
      )}
    </div>
  );
}
