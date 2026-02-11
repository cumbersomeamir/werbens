"use client";

export function InstagramContentForm({ content, setContent }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-werbens-muted mb-1">
          Image URL <span className="text-red-500">*</span>
        </label>
        <input
          type="url"
          value={content.instagram_image_url || ""}
          onChange={(e) => setContent((c) => ({ ...c, instagram_image_url: e.target.value }))}
          className="w-full rounded-lg border border-werbens-steel/40 bg-white px-3 py-2 text-sm text-werbens-text shadow-sm focus-ring"
          placeholder="https://example.com/image.jpg"
          required
        />
        <p className="mt-1 text-xs text-werbens-muted">
          Instagram requires an image. Text-only posts are not supported.
        </p>
      </div>
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
          Alt text helps make your content more accessible.
        </p>
      </div>
    </div>
  );
}
