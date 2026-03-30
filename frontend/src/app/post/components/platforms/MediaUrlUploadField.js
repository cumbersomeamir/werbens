"use client";

import { useRef, useState } from "react";
import { post } from "@/api/client.js";
import { API_ENDPOINTS } from "@/api/endpoints.js";

const IMAGE_MAX_BYTES = 12 * 1024 * 1024;
const VIDEO_MAX_BYTES = 35 * 1024 * 1024;

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.readAsDataURL(file);
  });
}

export function MediaUrlUploadField({
  userId,
  kind,
  label,
  value,
  onChange,
  placeholder,
  helperText = "",
  required = false,
  disabled = false,
  setStatus,
  setUploadBusy,
}) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  async function handleUpload(file) {
    if (!file) return;

    if (!userId) {
      setStatus?.({ type: "error", text: "Sign in before uploading media." });
      return;
    }

    const expectedPrefix = kind === "image" ? "image/" : "video/";
    if (!String(file.type || "").startsWith(expectedPrefix)) {
      setStatus?.({ type: "error", text: `Please choose a valid ${kind} file.` });
      return;
    }

    const maxBytes = kind === "video" ? VIDEO_MAX_BYTES : IMAGE_MAX_BYTES;
    if (file.size > maxBytes) {
      setStatus?.({
        type: "error",
        text: `${kind === "video" ? "Video" : "Image"} is too large. Max ${Math.round(maxBytes / (1024 * 1024))}MB.`,
      });
      return;
    }

    setUploading(true);
    setUploadBusy?.(true);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const data = await post(API_ENDPOINTS.SOCIAL_POST_ALL_MEDIA_UPLOAD, {
        userId,
        fileName: file.name,
        mimeType: file.type,
        dataUrl,
      });

      const uploadedUrl = String(data?.url || "").trim();
      if (!uploadedUrl) {
        throw new Error("Upload succeeded but no media URL was returned.");
      }

      onChange(uploadedUrl);
      setStatus?.({
        type: "success",
        text: `${kind === "video" ? "Video" : "Image"} uploaded. URL field filled automatically.`,
      });
    } catch (err) {
      setStatus?.({
        type: "error",
        text: err?.message || `Failed to upload ${kind}.`,
      });
    } finally {
      setUploading(false);
      setUploadBusy?.(false);
    }
  }

  async function handleFileChange(event) {
    const file = event?.target?.files?.[0];
    event.target.value = "";
    await handleUpload(file);
  }

  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-werbens-muted mb-1">
        {label} {required ? <span className="text-red-500">*</span> : null}
      </label>
      <input
        type="url"
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-werbens-steel/40 bg-white px-3 py-2 text-sm text-werbens-text shadow-sm focus-ring"
        placeholder={placeholder}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || uploading}
        className="inline-flex items-center justify-center rounded-lg border border-werbens-dark-cyan/25 bg-white px-3 py-2 text-xs font-semibold text-werbens-dark-cyan disabled:opacity-60"
      >
        {uploading ? `Uploading ${kind}...` : `Upload ${kind} from device`}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={kind === "image" ? "image/*" : "video/*"}
        onChange={handleFileChange}
        className="hidden"
      />
      {helperText ? <p className="text-xs text-werbens-muted">{helperText}</p> : null}
    </div>
  );
}
