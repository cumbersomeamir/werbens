"use client";

export function LinkedInContentForm({ content, setContent }) {
  return (
    <div className="space-y-4">
      {/* LinkedIn Text (Required) */}
      <div>
        <label className="block text-xs font-medium text-werbens-muted mb-1">
          Post Text <span className="text-red-500">*</span>
        </label>
        <textarea
          rows={6}
          value={content.linkedin_text}
          onChange={(e) => setContent((c) => ({ ...c, linkedin_text: e.target.value }))}
          className="w-full rounded-lg border border-werbens-steel/40 bg-white px-3 py-2 text-sm text-werbens-text shadow-sm focus-ring resize-y"
          placeholder="Share your professional insights..."
          required
        />
      </div>
      
      {/* Media URN */}
      <div>
        <label className="block text-xs font-medium text-werbens-muted mb-1">
          Media URN (optional, e.g., urn:li:image:xxx or urn:li:video:xxx)
        </label>
        <input
          type="text"
          value={content.linkedin_media_urn || ""}
          onChange={(e) => setContent((c) => ({ ...c, linkedin_media_urn: e.target.value }))}
          className="w-full rounded-lg border border-werbens-steel/40 bg-white px-3 py-2 text-sm text-werbens-text shadow-sm focus-ring"
          placeholder="urn:li:image:xxx"
        />
      </div>
      
      {/* Media Title */}
      {content.linkedin_media_urn && (
        <div>
          <label className="block text-xs font-medium text-werbens-muted mb-1">
            Media Title (optional)
          </label>
          <input
            type="text"
            value={content.linkedin_media_title || ""}
            onChange={(e) => setContent((c) => ({ ...c, linkedin_media_title: e.target.value }))}
            className="w-full rounded-lg border border-werbens-steel/40 bg-white px-3 py-2 text-sm text-werbens-text shadow-sm focus-ring"
            placeholder="Media title"
          />
        </div>
      )}
      
      {/* Media Alt Text */}
      {content.linkedin_media_urn && (
        <div>
          <label className="block text-xs font-medium text-werbens-muted mb-1">
            Media Alt Text (optional)
          </label>
          <input
            type="text"
            value={content.linkedin_media_alt_text || ""}
            onChange={(e) => setContent((c) => ({ ...c, linkedin_media_alt_text: e.target.value }))}
            className="w-full rounded-lg border border-werbens-steel/40 bg-white px-3 py-2 text-sm text-werbens-text shadow-sm focus-ring"
            placeholder="Alt text for accessibility"
          />
        </div>
      )}
      
      {/* Visibility */}
      <div>
        <label className="block text-xs font-medium text-werbens-muted mb-1">
          Visibility
        </label>
        <select
          value={content.linkedin_visibility || "PUBLIC"}
          onChange={(e) => setContent((c) => ({ ...c, linkedin_visibility: e.target.value }))}
          className="w-full rounded-lg border border-werbens-steel/40 bg-white px-3 py-2 text-sm text-werbens-text shadow-sm focus-ring"
        >
          <option value="PUBLIC">Public</option>
          <option value="CONNECTIONS">Connections Only</option>
          <option value="LOGGED_IN">Logged In Members</option>
        </select>
      </div>
      
      {/* Disable Reshare */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="linkedin_disable_reshare"
          checked={content.linkedin_disable_reshare || false}
          onChange={(e) =>
            setContent((c) => ({ ...c, linkedin_disable_reshare: e.target.checked }))
          }
          className="rounded border-werbens-steel/40"
        />
        <label htmlFor="linkedin_disable_reshare" className="text-xs font-medium text-werbens-muted">
          Disable resharing
        </label>
      </div>
    </div>
  );
}
