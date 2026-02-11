"use client";

export function GenericContentForm({ content, setContent }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-werbens-muted mb-1">
          Title (optional, recommended for YouTube)
        </label>
        <input
          type="text"
          value={content.title}
          onChange={(e) => setContent((c) => ({ ...c, title: e.target.value }))}
          className="w-full rounded-lg border border-werbens-steel/40 bg-white px-3 py-2 text-sm text-werbens-text shadow-sm focus-ring"
          placeholder="E.g. 5 AI tools to automate your marketing"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-werbens-muted mb-1">
          Main content
        </label>
        <textarea
          rows={5}
          value={content.body}
          onChange={(e) => setContent((c) => ({ ...c, body: e.target.value }))}
          className="w-full rounded-lg border border-werbens-steel/40 bg-white px-3 py-2 text-sm text-werbens-text shadow-sm focus-ring resize-y"
          placeholder="Write your post copy here (we'll reuse it across platforms)."
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-werbens-muted mb-1">
          Hashtags (optional)
        </label>
        <input
          type="text"
          value={content.hashtags}
          onChange={(e) => setContent((c) => ({ ...c, hashtags: e.target.value }))}
          className="w-full rounded-lg border border-werbens-steel/40 bg-white px-3 py-2 text-sm text-werbens-text shadow-sm focus-ring"
          placeholder="#marketing, #ai, #startup"
        />
      </div>
    </div>
  );
}
