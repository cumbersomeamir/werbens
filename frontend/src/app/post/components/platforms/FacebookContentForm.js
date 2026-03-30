"use client";

import { MediaUrlUploadField } from "./MediaUrlUploadField";

export function FacebookContentForm({
  content,
  setContent,
  userId,
  setStatus,
  setUploadBusy,
}) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-werbens-muted mb-1">
          Message
        </label>
        <textarea
          rows={5}
          value={content.facebook_message || ""}
          onChange={(e) => setContent((c) => ({ ...c, facebook_message: e.target.value }))}
          className="w-full rounded-lg border border-werbens-steel/40 bg-white px-3 py-2 text-sm text-werbens-text shadow-sm focus-ring resize-y"
          placeholder="Write your Facebook post message here..."
        />
        <p className="mt-1 text-xs text-werbens-muted">
          {content.facebook_message?.length || 0} characters. Text is optional if you are posting only media.
        </p>
      </div>
      <div>
        <label className="block text-xs font-medium text-werbens-muted mb-1">
          Link (optional)
        </label>
        <input
          type="url"
          value={content.facebook_link || ""}
          onChange={(e) => setContent((c) => ({ ...c, facebook_link: e.target.value }))}
          className="w-full rounded-lg border border-werbens-steel/40 bg-white px-3 py-2 text-sm text-werbens-text shadow-sm focus-ring"
          placeholder="https://example.com/article"
        />
        <p className="mt-1 text-xs text-werbens-muted">
          Add a link to share with your post.
        </p>
      </div>
      <MediaUrlUploadField
        userId={userId}
        kind="image"
        label="Image URL"
        value={content.facebook_image_url || ""}
        onChange={(value) => setContent((c) => ({ ...c, facebook_image_url: value }))}
        placeholder="https://example.com/image.jpg"
        helperText="Facebook image posts are supported in this flow."
        setStatus={setStatus}
        setUploadBusy={setUploadBusy}
      />
      <MediaUrlUploadField
        userId={userId}
        kind="video"
        label="Video URL"
        value={content.facebook_video_url || ""}
        onChange={(value) => setContent((c) => ({ ...c, facebook_video_url: value }))}
        placeholder="https://example.com/video.mp4"
        helperText="Facebook video posts are also supported. If both image and video are filled, video is used."
        setStatus={setStatus}
        setUploadBusy={setUploadBusy}
      />
    </div>
  );
}
