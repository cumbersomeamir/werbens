"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { get, post, put } from "@/api/client.js";
import { API_ENDPOINTS } from "@/api/endpoints.js";
import { PLATFORM_LABELS } from "../utils";

const IMAGE_MAX_BYTES = 12 * 1024 * 1024;
const VIDEO_MAX_BYTES = 100 * 1024 * 1024;

function targetKey(target) {
  return `${String(target?.platform || "").toLowerCase()}::${String(target?.channelId || "")}`;
}

function dedupeTargets(list = []) {
  const map = new Map();
  for (const item of list) {
    const key = targetKey(item);
    if (!key || key === "::") continue;
    if (!map.has(key)) map.set(key, item);
  }
  return Array.from(map.values());
}

function summarizeResponse(data) {
  const summary = data?.summary || {};
  return `Posted ${Number(summary.posted || 0)} | Queued ${Number(summary.queued || 0)} | Failed ${Number(summary.failed || 0)}`;
}

function normalizeUrlInput(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://${raw}`;
}

function isValidHttpUrl(value) {
  try {
    const url = new URL(String(value || ""));
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

function PlatformMultiSelector({ availableTargets, selectedKeys, onToggle }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {availableTargets.map((target) => {
        const key = targetKey(target);
        const selected = selectedKeys.includes(key);
        const label = PLATFORM_LABELS[target.platform] || target.platform;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onToggle(key)}
            className={`flex items-center justify-between rounded-xl border px-3 py-2 text-left transition-all ${
              selected
                ? "border-werbens-light-cyan bg-werbens-light-cyan/10 text-werbens-text"
                : "border-werbens-steel/30 bg-white/80 text-werbens-muted hover:border-werbens-steel/60"
            }`}
          >
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate">{label}</p>
              <p className="text-[11px] text-werbens-muted truncate">
                {target.displayName || target.username || target.channelId}
              </p>
            </div>
            {selected ? (
              <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-werbens-dark-cyan text-[10px] text-white">
                ✓
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export function PostToAllPanel({ userId }) {
  const [loading, setLoading] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [status, setStatus] = useState(null);
  const [availableTargets, setAvailableTargets] = useState([]);
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [form, setForm] = useState({
    caption: "",
    hashtags: "",
    linkUrl: "",
    imageUrl: "",
    videoUrl: "",
    instagramAltText: "",
  });

  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);

  const selectedTargets = useMemo(() => {
    const byKey = new Map(availableTargets.map((target) => [targetKey(target), target]));
    return selectedKeys.map((key) => byKey.get(key)).filter(Boolean);
  }, [availableTargets, selectedKeys]);

  const selectedPlatforms = useMemo(
    () => Array.from(new Set(selectedTargets.map((target) => String(target.platform || "").toLowerCase()))),
    [selectedTargets]
  );
  const hasInstagramSelected = selectedPlatforms.includes("instagram");
  const hasYoutubeSelected = selectedPlatforms.includes("youtube");
  const hasPinterestSelected = selectedPlatforms.includes("pinterest");
  const hasXSelected = selectedPlatforms.includes("x");
  const hasUnsupportedSelected = hasYoutubeSelected || hasPinterestSelected;

  const platformRequirements = useMemo(() => {
    const rules = [];
    if (hasInstagramSelected) rules.push("Instagram selected: image URL or video URL is required.");
    if (hasYoutubeSelected) rules.push("YouTube selected: video URL is required.");
    if (hasXSelected) rules.push("X selected: text will be trimmed to 280 chars.");
    rules.push("For this flow, add at least one of Link URL, Image URL, or Video URL.");
    return rules;
  }, [hasInstagramSelected, hasYoutubeSelected, hasXSelected]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    async function loadPreferences() {
      setLoading(true);
      setStatus(null);
      try {
        const query = new URLSearchParams({ userId: String(userId) });
        const data = await get(`${API_ENDPOINTS.SOCIAL_POST_ALL_PREFERENCES}?${query.toString()}`);
        if (cancelled) return;

        const available = dedupeTargets(Array.isArray(data?.availableTargets) ? data.availableTargets : []);
        const selected = dedupeTargets(Array.isArray(data?.preferences?.selectedTargets) ? data.preferences.selectedTargets : []);
        const selectedSet = new Set(selected.map((item) => targetKey(item)));

        setAvailableTargets(available);
        setSelectedKeys(
          selectedSet.size > 0 ? available.map((item) => targetKey(item)).filter((key) => selectedSet.has(key)) : []
        );
      } catch (err) {
        if (cancelled) return;
        setStatus({ type: "error", text: err?.message || "Failed to load post-to-all settings." });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadPreferences();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  function toggleSelectedKey(key) {
    setSelectedKeys((prev) => (prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]));
  }

  async function savePreferences() {
    if (!userId) return;
    setSavingPrefs(true);
    setStatus(null);
    try {
      await put(API_ENDPOINTS.SOCIAL_POST_ALL_PREFERENCES, {
        userId,
        selectedTargets,
      });
      setStatus({ type: "success", text: "Post-to-all account preferences saved." });
    } catch (err) {
      setStatus({ type: "error", text: err?.message || "Failed to save preferences." });
    } finally {
      setSavingPrefs(false);
    }
  }

  async function uploadMedia(kind, file) {
    if (!file) return;
    if (!userId) {
      setStatus({ type: "error", text: "Sign in before uploading media." });
      return;
    }

    const expectedMimePrefix = kind === "image" ? "image/" : "video/";
    if (!String(file.type || "").startsWith(expectedMimePrefix)) {
      setStatus({ type: "error", text: `Please choose a valid ${kind} file.` });
      return;
    }

    const maxBytes = kind === "video" ? VIDEO_MAX_BYTES : IMAGE_MAX_BYTES;
    if (file.size > maxBytes) {
      setStatus({
        type: "error",
        text: `${kind === "video" ? "Video" : "Image"} is too large. Max ${Math.round(maxBytes / (1024 * 1024))}MB.`,
      });
      return;
    }

    if (kind === "image") setUploadingImage(true);
    if (kind === "video") setUploadingVideo(true);
    setStatus(null);

    try {
      const dataUrl = await readFileAsDataUrl(file);
      const data = await post(API_ENDPOINTS.SOCIAL_POST_ALL_MEDIA_UPLOAD, {
        userId,
        fileName: file.name,
        mimeType: file.type,
        dataUrl,
      });

      const uploadedUrl = String(data?.url || "");
      if (!uploadedUrl) {
        throw new Error("Upload succeeded but media URL was not returned.");
      }

      setForm((prev) =>
        kind === "image" ? { ...prev, imageUrl: uploadedUrl } : { ...prev, videoUrl: uploadedUrl }
      );
      setStatus({
        type: "success",
        text: `${kind === "image" ? "Image" : "Video"} uploaded. URL field was filled automatically.`,
      });
    } catch (err) {
      setStatus({ type: "error", text: err?.message || `Failed to upload ${kind}.` });
    } finally {
      if (kind === "image") setUploadingImage(false);
      if (kind === "video") setUploadingVideo(false);
    }
  }

  async function onImageFileChange(event) {
    const file = event?.target?.files?.[0];
    event.target.value = "";
    await uploadMedia("image", file);
  }

  async function onVideoFileChange(event) {
    const file = event?.target?.files?.[0];
    event.target.value = "";
    await uploadMedia("video", file);
  }

  async function submitPostToAll(event) {
    event.preventDefault();
    if (!userId) {
      setStatus({ type: "error", text: "Sign in to post content." });
      return;
    }
    if (!selectedTargets.length) {
      setStatus({ type: "error", text: "Select at least one destination account." });
      return;
    }

    const caption = String(form.caption || "").trim();
    const linkUrl = normalizeUrlInput(form.linkUrl);
    const imageUrl = normalizeUrlInput(form.imageUrl);
    const videoUrl = normalizeUrlInput(form.videoUrl);

    if (!caption) {
      setStatus({ type: "error", text: "Caption is required." });
      return;
    }
    if (linkUrl && !isValidHttpUrl(linkUrl)) {
      setStatus({ type: "error", text: "Link URL must be a valid http(s) URL." });
      return;
    }
    if (imageUrl && !isValidHttpUrl(imageUrl)) {
      setStatus({ type: "error", text: "Image URL must be a valid http(s) URL." });
      return;
    }
    if (videoUrl && !isValidHttpUrl(videoUrl)) {
      setStatus({ type: "error", text: "Video URL must be a valid http(s) URL." });
      return;
    }
    if (!linkUrl && !imageUrl && !videoUrl) {
      setStatus({ type: "error", text: "Add at least one of Link URL, Image URL, or Video URL." });
      return;
    }
    if (hasInstagramSelected && !imageUrl && !videoUrl) {
      setStatus({ type: "error", text: "Instagram selected: image URL or video URL is required." });
      return;
    }
    if (hasYoutubeSelected && !videoUrl) {
      setStatus({ type: "error", text: "YouTube selected: video URL is required." });
      return;
    }

    setSubmitting(true);
    setStatus(null);
    try {
      const data = await post(API_ENDPOINTS.SOCIAL_POST_ALL_NOW, {
        userId,
        caption,
        hashtags: form.hashtags,
        linkUrl,
        imageUrl,
        videoUrl,
        instagramAltText: form.instagramAltText,
        selectedTargets,
        savePreference: true,
      });

      const resultText = summarizeResponse(data);
      const failed = Array.isArray(data?.results) ? data.results.filter((row) => row?.status === "failed") : [];
      if (failed.length > 0) {
        const errText = failed.map((row) => `${row.platform}: ${row.error || "failed"}`).join(" | ");
        setStatus({ type: "error", text: `${resultText} | ${errText}` });
      } else {
        setStatus({ type: "success", text: `${resultText} | Post to all completed.` });
      }
    } catch (err) {
      setStatus({ type: "error", text: err?.message || "Failed to run post-to-all." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {status ? (
        <div
          className={`mb-4 rounded-xl px-4 py-3 text-sm ${
            status.type === "error"
              ? "bg-red-50 text-red-800 border border-red-100"
              : "bg-emerald-50 text-emerald-800 border border-emerald-100"
          }`}
          role="alert"
        >
          {status.text}
        </div>
      ) : null}

      <form
        onSubmit={submitPostToAll}
        className="space-y-6 rounded-2xl bg-white/90 border border-werbens-steel/30 shadow-elevated p-4 sm:p-6 lg:p-7"
      >
        <div>
          <h2 className="text-sm font-semibold text-werbens-text">Post to All Destinations</h2>
          <p className="text-xs text-werbens-muted mt-0.5">
            Select accounts once, save preferences, and publish from one concise form.
          </p>
        </div>

        {loading ? (
          <p className="text-sm text-werbens-muted">Loading connected accounts…</p>
        ) : availableTargets.length === 0 ? (
          <p className="text-sm text-werbens-muted">
            Connect accounts on the <span className="font-semibold">Accounts</span> page to use post-to-all.
          </p>
        ) : (
          <PlatformMultiSelector availableTargets={availableTargets} selectedKeys={selectedKeys} onToggle={toggleSelectedKey} />
        )}

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={savePreferences}
            disabled={savingPrefs || loading || !userId}
            className="inline-flex items-center justify-center rounded-lg border border-werbens-dark-cyan/25 bg-white px-4 py-2 text-sm font-semibold text-werbens-dark-cyan disabled:opacity-60"
          >
            {savingPrefs ? "Saving…" : "Save account preferences"}
          </button>
        </div>

        <div className="border-t border-werbens-steel/20 pt-4 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-werbens-text">Super Form</h2>
            <p className="text-xs text-werbens-muted mt-0.5">
              Fields and requirements update from selected platforms.
            </p>
          </div>

          <div className="rounded-xl border border-werbens-steel/30 bg-werbens-mist/30 px-3 py-3">
            <p className="text-[11px] font-semibold text-werbens-text">
              Selected platforms: {selectedPlatforms.length ? selectedPlatforms.map((p) => PLATFORM_LABELS[p] || p).join(", ") : "None"}
            </p>
            <ul className="mt-2 space-y-1 text-[11px] text-werbens-muted">
              {platformRequirements.map((rule, index) => (
                <li key={`rule-${index}`}>• {rule}</li>
              ))}
            </ul>
          </div>

          {hasUnsupportedSelected ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              YouTube/Pinterest are selected. Their posting adapters are still limited, so those targets may queue and fail.
            </div>
          ) : null}

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-werbens-text mb-1">Caption *</label>
              <textarea
                rows={5}
                value={form.caption}
                onChange={(e) => setForm((prev) => ({ ...prev, caption: e.target.value }))}
                className="w-full rounded-xl border border-werbens-steel/30 px-3 py-2 text-sm text-werbens-text focus:outline-none focus:ring-2 focus:ring-werbens-dark-cyan/30"
                placeholder="Write your post caption..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-werbens-text mb-1">Hashtags</label>
                <input
                  type="text"
                  value={form.hashtags}
                  onChange={(e) => setForm((prev) => ({ ...prev, hashtags: e.target.value }))}
                  className="w-full rounded-xl border border-werbens-steel/30 px-3 py-2 text-sm text-werbens-text focus:outline-none focus:ring-2 focus:ring-werbens-dark-cyan/30"
                  placeholder="ai, automation, growth"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-werbens-text mb-1">
                  Link URL {!hasInstagramSelected && !hasYoutubeSelected ? "*" : "(optional)"}
                </label>
                <input
                  type="text"
                  value={form.linkUrl}
                  onChange={(e) => setForm((prev) => ({ ...prev, linkUrl: e.target.value }))}
                  className="w-full rounded-xl border border-werbens-steel/30 px-3 py-2 text-sm text-werbens-text focus:outline-none focus:ring-2 focus:ring-werbens-dark-cyan/30"
                  placeholder="https://example.com"
                />
              </div>
            </div>

            <div className="rounded-xl border border-werbens-steel/30 bg-white p-3 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-werbens-text">
                  Media inputs (image/video upload + URL)
                </p>
                <p className="text-[11px] text-werbens-muted">
                  {hasInstagramSelected || hasYoutubeSelected || hasPinterestSelected
                    ? "Platform media requirements are active."
                    : "Optional media."}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-werbens-text mb-1">
                    Image URL {hasInstagramSelected ? "*" : "(optional)"}
                  </label>
                  <input
                    type="text"
                    value={form.imageUrl}
                    onChange={(e) => setForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
                    className="w-full rounded-xl border border-werbens-steel/30 px-3 py-2 text-sm text-werbens-text focus:outline-none focus:ring-2 focus:ring-werbens-dark-cyan/30"
                    placeholder="https://example.com/image.jpg"
                  />
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={uploadingImage || submitting}
                    className="inline-flex items-center justify-center rounded-lg border border-werbens-dark-cyan/25 bg-white px-3 py-2 text-xs font-semibold text-werbens-dark-cyan disabled:opacity-60"
                  >
                    {uploadingImage ? "Uploading image..." : "Upload image from device"}
                  </button>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={onImageFileChange}
                    className="hidden"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-werbens-text mb-1">
                    Video URL {hasYoutubeSelected ? "*" : "(optional)"}
                  </label>
                  <input
                    type="text"
                    value={form.videoUrl}
                    onChange={(e) => setForm((prev) => ({ ...prev, videoUrl: e.target.value }))}
                    className="w-full rounded-xl border border-werbens-steel/30 px-3 py-2 text-sm text-werbens-text focus:outline-none focus:ring-2 focus:ring-werbens-dark-cyan/30"
                    placeholder="https://example.com/video.mp4"
                  />
                  <button
                    type="button"
                    onClick={() => videoInputRef.current?.click()}
                    disabled={uploadingVideo || submitting}
                    className="inline-flex items-center justify-center rounded-lg border border-werbens-dark-cyan/25 bg-white px-3 py-2 text-xs font-semibold text-werbens-dark-cyan disabled:opacity-60"
                  >
                    {uploadingVideo ? "Uploading video..." : "Upload video from device"}
                  </button>
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    onChange={onVideoFileChange}
                    className="hidden"
                  />
                </div>
              </div>
            </div>

            {hasInstagramSelected ? (
              <div>
                <label className="block text-xs font-semibold text-werbens-text mb-1">Instagram alt text</label>
                <input
                  type="text"
                  value={form.instagramAltText}
                  onChange={(e) => setForm((prev) => ({ ...prev, instagramAltText: e.target.value }))}
                  className="w-full rounded-xl border border-werbens-steel/30 px-3 py-2 text-sm text-werbens-text focus:outline-none focus:ring-2 focus:ring-werbens-dark-cyan/30"
                  placeholder="Optional accessibility description"
                />
              </div>
            ) : null}
          </div>
        </div>

        <div className="pt-2 flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={submitting || loading || uploadingImage || uploadingVideo || !userId}
            className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-werbens-dark-cyan to-werbens-light-cyan px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md focus-ring disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? "Posting to all..." : "Post to all"}
          </button>
        </div>
      </form>
    </>
  );
}
