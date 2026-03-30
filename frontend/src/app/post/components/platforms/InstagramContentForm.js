"use client";

import { MediaUrlUploadField } from "./MediaUrlUploadField";

export function InstagramContentForm({
  content,
  setContent,
  userId,
  setStatus,
  setUploadBusy,
}) {
  return (
    <div className="space-y-3">
      <MediaUrlUploadField
        userId={userId}
        kind="image"
        label="Image URL"
        required={!content.instagram_video_url}
        value={content.instagram_image_url || ""}
        onChange={(value) => setContent((c) => ({ ...c, instagram_image_url: value }))}
        placeholder="https://example.com/image.jpg"
        helperText="Instagram supports image posts. Uploading from device fills this field automatically."
        setStatus={setStatus}
        setUploadBusy={setUploadBusy}
      />
      <MediaUrlUploadField
        userId={userId}
        kind="video"
        label="Video URL"
        required={!content.instagram_image_url}
        value={content.instagram_video_url || ""}
        onChange={(value) => setContent((c) => ({ ...c, instagram_video_url: value }))}
        placeholder="https://example.com/video.mp4"
        helperText="Instagram also supports video posts in this flow. If both image and video are filled, video is used."
        setStatus={setStatus}
        setUploadBusy={setUploadBusy}
      />
      <div>
        <label className="block text-xs font-medium text-werbens-muted mb-1">
          Caption
        </label>
        <textarea
          rows={5}
          value={content.instagram_caption || ""}
          onChange={(e) => setContent((c) => ({ ...c, instagram_caption: e.target.value }))}
          className="w-full rounded-lg border border-werbens-steel/40 bg-white px-3 py-2 text-sm text-werbens-text shadow-sm focus-ring resize-y"
          placeholder="Write your Instagram caption here. You can include hashtags."
          maxLength={2200}
        />
        <p className="mt-1 text-xs text-werbens-muted">
          {content.instagram_caption?.length || 0} / 2200 characters
        </p>
      </div>
      <div>
        <label className="block text-xs font-medium text-werbens-muted mb-1">
          Alt Text (optional)
        </label>
        <input
          type="text"
          value={content.instagram_alt_text || ""}
          onChange={(e) => setContent((c) => ({ ...c, instagram_alt_text: e.target.value }))}
          className="w-full rounded-lg border border-werbens-steel/40 bg-white px-3 py-2 text-sm text-werbens-text shadow-sm focus-ring"
          placeholder="Describe the image for accessibility"
          maxLength={1000}
        />
        <p className="mt-1 text-xs text-werbens-muted">
          Alt text helps make image posts more accessible.
        </p>
      </div>
    </div>
  );
}
