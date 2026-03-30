"use client";

import { useRef, useState } from "react";
import { post } from "@/api/client.js";
import { API_ENDPOINTS } from "@/api/endpoints.js";

const IMAGE_MAX_BYTES = 12 * 1024 * 1024;
const VIDEO_MAX_BYTES = 35 * 1024 * 1024;

function formatLimitLabel(kind) {
  const maxBytes = kind === "video" ? VIDEO_MAX_BYTES : IMAGE_MAX_BYTES;
  return `${Math.round(maxBytes / (1024 * 1024))}MB max`;
}

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
      <div className="rounded-xl border border-werbens-dark-cyan/20 bg-werbens-light-cyan/5 p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-werbens-dark-cyan">
              From Device
            </p>
            <p className="mt-1 text-xs font-medium text-werbens-text">
              Choose a {kind} file from your computer
            </p>
            <p className="mt-1 text-[11px] text-werbens-muted">
              Accepted: {kind === "image" ? "JPG, PNG, WEBP, GIF" : "MP4, MOV, WEBM"} · {formatLimitLabel(kind)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={disabled || uploading}
            className="inline-flex min-w-[168px] items-center justify-center gap-2 rounded-xl border border-werbens-dark-cyan bg-werbens-dark-cyan px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              className="h-4 w-4 shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10 13V4" />
              <path d="m6.5 7.5 3.5-3.5 3.5 3.5" />
              <path d="M4 13.5v1.25A1.25 1.25 0 0 0 5.25 16h9.5A1.25 1.25 0 0 0 16 14.75V13.5" />
            </svg>
            {uploading ? `Uploading ${kind}...` : `Upload ${kind}`}
          </button>
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-werbens-muted">
          Or Paste URL
        </p>
        <input
          type="url"
          value={value || ""}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-lg border border-werbens-steel/40 bg-white px-3 py-2 text-sm text-werbens-text shadow-sm focus-ring"
          placeholder={placeholder}
        />
      </div>
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
