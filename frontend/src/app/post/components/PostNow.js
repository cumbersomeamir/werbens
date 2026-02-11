"use client";

import { useState, useEffect } from "react";
import { PostLayout } from "./PostLayout";
import { useCurrentUser } from "@/app/onboarding/components/useCurrentUser";
import { getSocialAccounts } from "@/lib/socialApi";
import { post } from "@/api/client.js";
import { API_ENDPOINTS } from "@/api/endpoints.js";
import { XContentForm, LinkedInContentForm, InstagramContentForm, FacebookContentForm, GenericContentForm } from "./platforms";
import { PLATFORM_LABELS, FRONTEND_PLATFORM_MAP, BACKEND_PLATFORM_MAP } from "./utils";

function PlatformSelector({ availableTargets, selectedTargets, onToggle }) {
  // For Post Now, only allow single selection
  const selectedTarget = selectedTargets.length > 0 ? selectedTargets[0] : null;
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {availableTargets.map((t) => {
        const label = PLATFORM_LABELS[t.platform] || t.platform;
        const isSelected = selectedTarget && 
          selectedTarget.platform === t.platform && 
          selectedTarget.channelId === t.channelId;
        return (
          <button
            key={`${t.platform}-${t.channelId}`}
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // Single selection: toggle this target (select if not selected, deselect if already selected)
              onToggle(t);
            }}
            className={`flex items-center justify-between rounded-xl border px-3 py-2 text-left transition-all ${
              isSelected
                ? "border-werbens-light-cyan bg-werbens-light-cyan/10 text-werbens-text"
                : "border-werbens-steel/30 bg-white/80 text-werbens-muted hover:border-werbens-steel/60"
            }`}
          >
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate">{label}</p>
              <p className="text-[11px] text-werbens-muted truncate">
                {t.displayName || t.username || t.channelId}
              </p>
            </div>
            {isSelected && (
              <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-werbens-dark-cyan text-[10px] text-white">
                ✓
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

async function fetchTargets(userId) {
  if (!userId) return [];
  const { accounts } = await getSocialAccounts(userId);
  const targets = [];
  for (const a of accounts || []) {
    const platform = a.platform;
    // Use SocialAccounts.channels for multi-channel platforms (e.g. YouTube, Meta)
    if (Array.isArray(a.channels) && a.channels.length > 0) {
      for (const ch of a.channels) {
        targets.push({
          platform,
          channelId: ch.channelId || ch.pageId || ch.igId || "",
          displayName: ch.title || ch.name || ch.username || a.displayName || a.username,
          username: a.username,
        });
      }
    } else {
      targets.push({
        platform,
        channelId: a.platformUserId || a.channelId || "",
        displayName: a.displayName || a.username,
        username: a.username,
      });
    }
  }
  return targets.filter((t) => t.channelId);
}

export function PostNow() {
  const { userId } = useCurrentUser();
  const [loadingTargets, setLoadingTargets] = useState(false);
  const [targets, setTargets] = useState([]);
  const [selectedTargets, setSelectedTargets] = useState([]);
  
  // Platform-specific content state
  const [content, setContent] = useState({
    // Generic fields
    title: "",
    body: "",
    hashtags: "",
    // X-specific fields
    x_text: "",
    x_media_ids: [],
    x_poll_options: [],
    x_poll_duration_minutes: 60,
    x_reply_to_tweet_id: "",
    x_quote_tweet_id: "",
    x_geo_place_id: "",
    x_for_super_followers_only: false,
    // LinkedIn-specific fields
    linkedin_text: "",
    linkedin_media_urn: "",
    linkedin_media_title: "",
    linkedin_media_alt_text: "",
    linkedin_visibility: "PUBLIC",
    linkedin_disable_reshare: false,
    // Instagram-specific fields
    instagram_image_url: "",
    instagram_caption: "",
    instagram_alt_text: "",
    // Facebook-specific fields
    facebook_message: "",
    facebook_link: "",
  });
  
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Determine if X, LinkedIn, Instagram, or Facebook is selected
  const isXSelected = selectedTargets.some((t) => t.platform === "x");
  const isLinkedInSelected = selectedTargets.some((t) => t.platform === "linkedin");
  const isInstagramSelected = selectedTargets.some((t) => t.platform === "instagram");
  const isFacebookSelected = selectedTargets.some((t) => t.platform === "facebook");

  async function ensureTargetsLoaded() {
    if (loadingTargets || targets.length > 0 || !userId) return;
    setLoadingTargets(true);
    try {
      const list = await fetchTargets(userId);
      setTargets(list);
    } catch (err) {
      console.error("load targets error", err);
      setStatus({ type: "error", text: err.message || "Failed to load accounts." });
    } finally {
      setLoadingTargets(false);
    }
  }

  // Load targets once on mount if userId is available
  useEffect(() => {
    if (userId && targets.length === 0 && !loadingTargets) {
      ensureTargetsLoaded();
    }
  }, [userId]); // Only depend on userId, not targets or loadingTargets to avoid loops

  function handleToggleTarget(t) {
    // For Post Now, only allow single selection
    setSelectedTargets((prev) => {
      const exists = prev.some((p) => p.platform === t.platform && p.channelId === t.channelId);
      if (exists) {
        // Deselect if clicking the same target
        return [];
      }
      // Select only this target (replace any existing selection)
      return [t];
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!userId) {
      setStatus({ type: "error", text: "Sign in to post content." });
      return;
    }
    if (selectedTargets.length === 0) {
      setStatus({ type: "error", text: "Select at least one platform/channel." });
      return;
    }
    // Validate content based on selected platforms
    if (isXSelected) {
      if (!content.x_text || content.x_text.trim().length === 0) {
        setStatus({ type: "error", text: "Tweet text is required for X." });
        return;
      }
      if (content.x_text.length > 280) {
        setStatus({ type: "error", text: `Tweet exceeds 280 characters (${content.x_text.length} characters).` });
        return;
      }
    } else if (isLinkedInSelected) {
      if (!content.linkedin_text || content.linkedin_text.trim().length === 0) {
        setStatus({ type: "error", text: "Post text is required for LinkedIn." });
        return;
      }
    } else if (isInstagramSelected) {
      if (!content.instagram_image_url || content.instagram_image_url.trim().length === 0) {
        setStatus({ type: "error", text: "Image URL is required for Instagram." });
        return;
      }
      // Validate URL format
      try {
        new URL(content.instagram_image_url.trim());
      } catch {
        setStatus({ type: "error", text: "Please provide a valid image URL." });
        return;
      }
      if (content.instagram_caption && content.instagram_caption.length > 2200) {
        setStatus({ type: "error", text: "Instagram caption exceeds 2200 characters." });
        return;
      }
    } else if (isFacebookSelected) {
      if (!content.facebook_message || content.facebook_message.trim().length === 0) {
        setStatus({ type: "error", text: "Facebook message is required." });
        return;
      }
      if (content.facebook_link) {
        try {
          new URL(content.facebook_link.trim());
        } catch {
          setStatus({ type: "error", text: "Please provide a valid link URL." });
          return;
        }
      }
    } else {
      if (!content.body && !content.title) {
        setStatus({ type: "error", text: "Add a title or description." });
        return;
      }
    }
    setSubmitting(true);
    setStatus(null);
    try {
      // Build platform-specific content
      const contentPayload = {};
      
      if (isXSelected) {
        // X-specific payload
        contentPayload.x_text = content.x_text.trim();
        if (content.x_media_ids && content.x_media_ids.length > 0) {
          contentPayload.x_media_ids = content.x_media_ids;
        }
        if (content.x_poll_options && content.x_poll_options.length >= 2) {
          contentPayload.x_poll = {
            options: content.x_poll_options,
            duration_minutes: content.x_poll_duration_minutes || 60,
          };
        }
        if (content.x_reply_to_tweet_id) {
          contentPayload.x_reply_to_tweet_id = content.x_reply_to_tweet_id.trim();
        }
        if (content.x_quote_tweet_id) {
          contentPayload.x_quote_tweet_id = content.x_quote_tweet_id.trim();
        }
        if (content.x_geo_place_id) {
          contentPayload.x_geo_place_id = content.x_geo_place_id.trim();
        }
        if (content.x_for_super_followers_only) {
          contentPayload.x_for_super_followers_only = true;
        }
      } else if (isLinkedInSelected) {
        // LinkedIn-specific payload
        contentPayload.linkedin_text = content.linkedin_text.trim();
        if (content.linkedin_media_urn) {
          contentPayload.linkedin_media_urn = content.linkedin_media_urn.trim();
          if (content.linkedin_media_title) {
            contentPayload.linkedin_media_title = content.linkedin_media_title.trim();
          }
          if (content.linkedin_media_alt_text) {
            contentPayload.linkedin_media_alt_text = content.linkedin_media_alt_text.trim();
          }
        }
        if (content.linkedin_visibility) {
          contentPayload.linkedin_visibility = content.linkedin_visibility;
        }
        if (content.linkedin_disable_reshare) {
          contentPayload.linkedin_disable_reshare = true;
        }
      } else if (isInstagramSelected) {
        // Instagram-specific payload
        contentPayload.instagram_image_url = content.instagram_image_url.trim();
        if (content.instagram_caption) {
          contentPayload.instagram_caption = content.instagram_caption.trim();
        }
        if (content.instagram_alt_text) {
          contentPayload.instagram_alt_text = content.instagram_alt_text.trim();
        }
      } else if (isFacebookSelected) {
        // Facebook-specific payload
        contentPayload.facebook_message = content.facebook_message.trim();
        if (content.facebook_link) {
          contentPayload.facebook_link = content.facebook_link.trim();
        }
      } else {
        // Generic payload for other platforms
        contentPayload.title = content.title;
        contentPayload.body = content.body;
        contentPayload.hashtags = content.hashtags
          ? content.hashtags
              .split(/[,\s]+/)
              .map((h) => h.trim())
              .filter(Boolean)
          : [];
      }
      
      const payload = {
        userId,
        mode: "immediate",
        targets: selectedTargets.map((t) => ({
          platform: BACKEND_PLATFORM_MAP[FRONTEND_PLATFORM_MAP[t.platform] || t.platform] || t.platform,
          channelId: t.channelId,
        })),
        content: {
          ...contentPayload,
          metadata: {},
        },
      };
      
      console.log("Form payload:", JSON.stringify(payload, null, 2));

      // Use the new /now endpoint for immediate posts
      const data = await post(API_ENDPOINTS.SOCIAL_POST_NOW, payload);
      if (!data.ok) {
        throw new Error(data.error || "Failed to create post");
      }
      
      // Check if post was posted immediately
      if (data.results && Array.isArray(data.results)) {
        const postedResults = data.results.filter((r) => r.status === "posted");
        const errorResults = data.results.filter((r) => r.error);
        
        if (errorResults.length > 0) {
          const errors = errorResults.map((r) => r.error).join(", ");
          throw new Error(errors);
        }
        
        if (postedResults.length > 0) {
          const platformPostIds = postedResults.map((r) => r.platformPostId).filter(Boolean);
          const platformNames = postedResults.map((r) => PLATFORM_LABELS[r.platform] || r.platform).join(", ");
          setStatus({
            type: "success",
            text: `Post published successfully on ${platformNames}!${platformPostIds.length > 0 ? ` Post ID: ${platformPostIds[0]}` : ""}`,
          });
        } else {
          setStatus({
            type: "success",
            text: "Post queued to be published shortly.",
          });
        }
      } else {
        setStatus({
          type: "success",
          text: "Post published successfully!",
        });
      }
      
      // Reset form after successful post
      setSelectedTargets([]);
      setContent({
        title: "",
        body: "",
        hashtags: "",
        x_text: "",
        x_media_ids: [],
        x_poll_options: [],
        x_poll_duration_minutes: 60,
        x_reply_to_tweet_id: "",
        x_quote_tweet_id: "",
        x_geo_place_id: "",
        x_for_super_followers_only: false,
        linkedin_text: "",
        linkedin_media_urn: "",
        linkedin_media_title: "",
        linkedin_media_alt_text: "",
        linkedin_visibility: "PUBLIC",
        linkedin_disable_reshare: false,
        instagram_image_url: "",
        instagram_caption: "",
        instagram_alt_text: "",
        facebook_message: "",
        facebook_link: "",
      });
    } catch (err) {
      console.error("Post submission error:", err);
      const errorMessage = err.message || err.data?.error || err.data?.message || "Failed to post.";
      setStatus({ 
        type: "error", 
        text: errorMessage
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PostLayout>
      <div className="mb-8 sm:mb-10">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-werbens-text">
          Post{" "}
          <span className="gradient-text">now</span>
        </h1>
        <p className="mt-3 text-sm sm:text-base text-werbens-muted max-w-2xl">
          Create and publish content immediately across your connected social media platforms.
        </p>
      </div>

      {status && (
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
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-2xl bg-white/90 border border-werbens-steel/30 shadow-elevated p-4 sm:p-6 lg:p-7"
        onFocus={(e) => {
          // Only load if focus is on an input/textarea, not on buttons
          if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            ensureTargetsLoaded();
          }
        }}
      >
        <div>
          <h2 className="text-sm font-semibold text-werbens-text">Destinations</h2>
          <p className="text-xs text-werbens-muted mt-0.5">
            Pick the channels you want this content to go to.
          </p>
        </div>

        {loadingTargets ? (
          <p className="text-sm text-werbens-muted">Loading connected accounts…</p>
        ) : targets.length === 0 ? (
          <p className="text-sm text-werbens-muted">
            Connect accounts on the <span className="font-semibold">Accounts</span> page
            to start posting.
          </p>
        ) : (
          <PlatformSelector
            availableTargets={targets}
            selectedTargets={selectedTargets}
            onToggle={handleToggleTarget}
          />
        )}

        <div className="border-t border-werbens-steel/20 pt-4 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-werbens-text">Content</h2>
            <p className="text-xs text-werbens-muted mt-0.5">
              {isXSelected
                ? "X (Twitter) specific fields. All parameters supported by X API v2."
                : isLinkedInSelected
                ? "LinkedIn specific fields. All parameters supported by LinkedIn Posts API."
                : isInstagramSelected
                ? "Instagram specific fields. Image is required - text-only posts are not supported."
                : isFacebookSelected
                ? "Facebook specific fields. Post to your Facebook Page."
                : "We'll adapt this content to each platform. YouTube will use the title + description; other platforms will use the body text."}
            </p>
          </div>
          
          {isXSelected ? (
            <XContentForm content={content} setContent={setContent} />
          ) : isLinkedInSelected ? (
            <LinkedInContentForm content={content} setContent={setContent} />
          ) : isInstagramSelected ? (
            <InstagramContentForm content={content} setContent={setContent} />
          ) : isFacebookSelected ? (
            <FacebookContentForm content={content} setContent={setContent} />
          ) : (
            <GenericContentForm content={content} setContent={setContent} />
          )}
        </div>

        <div className="pt-2 flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-werbens-dark-cyan to-werbens-light-cyan px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md focus-ring disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? "Publishing..." : "Post now"}
          </button>
        </div>
      </form>
    </PostLayout>
  );
}
