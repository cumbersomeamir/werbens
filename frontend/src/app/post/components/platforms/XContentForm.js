"use client";

import { useState } from "react";

export function XContentForm({ content, setContent }) {
  const [pollOption, setPollOption] = useState("");
  
  const addPollOption = () => {
    if (pollOption.trim() && content.x_poll_options.length < 4) {
      setContent((c) => ({
        ...c,
        x_poll_options: [...c.x_poll_options, pollOption.trim()],
      }));
      setPollOption("");
    }
  };
  
  const removePollOption = (index) => {
    setContent((c) => ({
      ...c,
      x_poll_options: c.x_poll_options.filter((_, i) => i !== index),
    }));
  };
  
  return (
    <div className="space-y-4">
      {/* Tweet Text (Required) */}
      <div>
        <label className="block text-xs font-medium text-werbens-muted mb-1">
          Tweet Text <span className="text-red-500">*</span> (max 280 characters)
        </label>
        <textarea
          rows={4}
          value={content.x_text}
          onChange={(e) => {
            const val = e.target.value;
            if (val.length <= 280) {
              setContent((c) => ({ ...c, x_text: val }));
            }
          }}
          className="w-full rounded-lg border border-werbens-steel/40 bg-white px-3 py-2 text-sm text-werbens-text shadow-sm focus-ring resize-y"
          placeholder="What's happening?"
          required
        />
        <p className="text-xs text-werbens-muted mt-1">
          {content.x_text.length}/280 characters
        </p>
      </div>
      
      {/* Media IDs */}
      <div>
        <label className="block text-xs font-medium text-werbens-muted mb-1">
          Media IDs (optional, comma-separated)
        </label>
        <input
          type="text"
          value={content.x_media_ids.join(", ")}
          onChange={(e) => {
            const ids = e.target.value
              .split(",")
              .map((id) => id.trim())
              .filter(Boolean);
            setContent((c) => ({ ...c, x_media_ids: ids }));
          }}
          className="w-full rounded-lg border border-werbens-steel/40 bg-white px-3 py-2 text-sm text-werbens-text shadow-sm focus-ring"
          placeholder="1234567890, 0987654321"
        />
        <p className="text-xs text-werbens-muted mt-1">
          Upload media first via X API, then use the media IDs here. Max 4 media items.
        </p>
      </div>
      
      {/* Poll */}
      <div className="border border-werbens-steel/20 rounded-lg p-3 space-y-2">
        <label className="block text-xs font-medium text-werbens-muted">
          Poll (optional, mutually exclusive with media)
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={pollOption}
            onChange={(e) => setPollOption(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addPollOption())}
            className="flex-1 rounded-lg border border-werbens-steel/40 bg-white px-3 py-1.5 text-sm text-werbens-text shadow-sm focus-ring"
            placeholder="Add poll option (2-4 options)"
            disabled={content.x_poll_options.length >= 4}
          />
          <button
            type="button"
            onClick={addPollOption}
            disabled={!pollOption.trim() || content.x_poll_options.length >= 4}
            className="px-3 py-1.5 rounded-lg bg-werbens-dark-cyan text-white text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add
          </button>
        </div>
        {content.x_poll_options.length > 0 && (
          <div className="space-y-1">
            {content.x_poll_options.map((opt, idx) => (
              <div key={idx} className="flex items-center justify-between bg-werbens-surface rounded px-2 py-1">
                <span className="text-xs text-werbens-text">{opt}</span>
                <button
                  type="button"
                  onClick={() => removePollOption(idx)}
                  className="text-red-500 text-xs hover:text-red-700"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        {content.x_poll_options.length >= 2 && (
          <div className="mt-2">
            <label className="block text-xs font-medium text-werbens-muted mb-1">
              Poll Duration (minutes)
            </label>
            <input
              type="number"
              min="5"
              max="10080"
              value={content.x_poll_duration_minutes}
              onChange={(e) =>
                setContent((c) => ({
                  ...c,
                  x_poll_duration_minutes: parseInt(e.target.value) || 60,
                }))
              }
              className="w-full rounded-lg border border-werbens-steel/40 bg-white px-3 py-1.5 text-sm text-werbens-text shadow-sm focus-ring"
            />
          </div>
        )}
      </div>
      
      {/* Reply to Tweet */}
      <div>
        <label className="block text-xs font-medium text-werbens-muted mb-1">
          Reply to Tweet ID (optional)
        </label>
        <input
          type="text"
          value={content.x_reply_to_tweet_id}
          onChange={(e) => setContent((c) => ({ ...c, x_reply_to_tweet_id: e.target.value }))}
          className="w-full rounded-lg border border-werbens-steel/40 bg-white px-3 py-2 text-sm text-werbens-text shadow-sm focus-ring"
          placeholder="1234567890123456789"
        />
      </div>
      
      {/* Quote Tweet */}
      <div>
        <label className="block text-xs font-medium text-werbens-muted mb-1">
          Quote Tweet ID (optional)
        </label>
        <input
          type="text"
          value={content.x_quote_tweet_id}
          onChange={(e) => setContent((c) => ({ ...c, x_quote_tweet_id: e.target.value }))}
          className="w-full rounded-lg border border-werbens-steel/40 bg-white px-3 py-2 text-sm text-werbens-text shadow-sm focus-ring"
          placeholder="1234567890123456789"
        />
      </div>
      
      {/* Geo Place ID */}
      <div>
        <label className="block text-xs font-medium text-werbens-muted mb-1">
          Geo Place ID (optional, requires geo enabled in profile)
        </label>
        <input
          type="text"
          value={content.x_geo_place_id}
          onChange={(e) => setContent((c) => ({ ...c, x_geo_place_id: e.target.value }))}
          className="w-full rounded-lg border border-werbens-steel/40 bg-white px-3 py-2 text-sm text-werbens-text shadow-sm focus-ring"
          placeholder="Place ID"
        />
      </div>
      
      {/* Super Followers Only */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="x_super_followers"
          checked={content.x_for_super_followers_only}
          onChange={(e) =>
            setContent((c) => ({ ...c, x_for_super_followers_only: e.target.checked }))
          }
          className="rounded border-werbens-steel/40"
        />
        <label htmlFor="x_super_followers" className="text-xs font-medium text-werbens-muted">
          For Super Followers only
        </label>
      </div>
    </div>
  );
}
