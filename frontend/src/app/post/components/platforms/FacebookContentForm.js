"use client";

export function FacebookContentForm({ content, setContent }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-werbens-muted mb-1">
          Message <span className="text-red-500">*</span>
        </label>
        <textarea
          rows={5}
          value={content.facebook_message || ""}
          onChange={(e) => setContent((c) => ({ ...c, facebook_message: e.target.value }))}
          className="w-full rounded-lg border border-werbens-steel/40 bg-white px-3 py-2 text-sm text-werbens-text shadow-sm focus-ring resize-y"
          placeholder="Write your Facebook post message here..."
          required
        />
        <p className="mt-1 text-xs text-werbens-muted">
          {content.facebook_message?.length || 0} characters
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
    </div>
  );
}
