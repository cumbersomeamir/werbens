"use client";

import { useState, useEffect } from "react";
import { getSocialAnalytics, syncSocialPlatform } from "@/lib/socialApi";
import { formatNumber } from "../data/analytics";

const PLATFORM_LABELS = { x: "X", instagram: "Instagram", linkedin: "LinkedIn", facebook: "Facebook" };

function CollapsibleCard({ title, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl bg-white shadow-elevated overflow-hidden border border-werbens-dark-cyan/10">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 px-4 sm:px-6 py-4 text-left hover:bg-werbens-mist/30 transition-colors"
        aria-expanded={open}
      >
        <span className="text-base sm:text-lg font-bold text-werbens-dark-cyan">{title}</span>
        <span
          className={`shrink-0 text-werbens-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>
      {open && (
        <div className="border-t border-werbens-dark-cyan/10 px-4 sm:px-6 py-4 sm:py-5 animate-fade-in-up">
          {children}
        </div>
      )}
    </div>
  );
}

function XProfile({ profile }) {
  if (!profile) return null;
  const metrics = profile.public_metrics || {};
  const displayName = profile.name || profile.username || "";
  const initial = (displayName.charAt(0) || profile.username?.charAt(0) || "?").toUpperCase();
  return (
    <div className="flex flex-col sm:flex-row gap-4 pb-4 border-b border-werbens-dark-cyan/10">
      <div className="flex items-start gap-3 shrink-0">
        {profile.profile_image_url ? (
          <img
            src={profile.profile_image_url}
            alt=""
            className="w-14 h-14 rounded-full object-cover ring-2 ring-werbens-dark-cyan/20"
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-werbens-dark-cyan/20 flex items-center justify-center ring-2 ring-werbens-dark-cyan/20">
            <span className="text-lg font-bold text-werbens-dark-cyan">{initial}</span>
          </div>
        )}
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-werbens-text">{displayName}</span>
            {profile.verified && (
              <span className="text-werbens-dark-cyan" title="Verified">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.25 1.336.25 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.688 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-4.578-2.79c-.24-.146-.384-.41-.384-.692 0-.483.504-.82.968-.82.21 0 .405.068.566.194l3.763 2.295 3.477-5.21c.17-.254.568-.324.842-.15.273.174.343.576.173.83z" />
                </svg>
              </span>
            )}
          </div>
          {profile.username && (
            <p className="text-sm text-werbens-muted">@{profile.username}</p>
          )}
          {profile.created_at && (
            <p className="text-xs text-werbens-muted mt-0.5">
              Joined {(() => {
                try {
                  const d = new Date(profile.created_at);
                  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
                } catch {
                  return "";
                }
              })()}
            </p>
          )}
        </div>
      </div>
      <div className="min-w-0 flex-1">
        {profile.description && (
          <p className="text-sm text-werbens-text mb-3">{profile.description}</p>
        )}
        {(profile.location || profile.url) && (
          <p className="text-xs text-werbens-muted space-x-2 mb-2">
            {profile.location && <span>{profile.location}</span>}
            {profile.url && (
              <a
                href={profile.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-werbens-dark-cyan hover:underline"
              >
                {profile.url}
              </a>
            )}
          </p>
        )}
        <div className="flex flex-wrap gap-4 sm:gap-6 mt-3 text-sm">
          <span className="font-semibold text-werbens-text">
            {formatNumber(metrics.followers_count ?? 0)} <span className="font-normal text-werbens-muted">Followers</span>
          </span>
          <span className="font-semibold text-werbens-text">
            {formatNumber(metrics.following_count ?? 0)} <span className="font-normal text-werbens-muted">Following</span>
          </span>
          <span className="font-semibold text-werbens-text">
            {formatNumber(metrics.tweet_count ?? 0)} <span className="font-normal text-werbens-muted">Tweets</span>
          </span>
          <span className="font-semibold text-werbens-text">
            {formatNumber(metrics.listed_count ?? 0)} <span className="font-normal text-werbens-muted">Listed</span>
          </span>
        </div>
      </div>
    </div>
  );
}

/** Aggregate engagement from posts (for X). */
function computePostAggregates(posts) {
  const agg = { impressions: 0, likes: 0, retweets: 0, replies: 0, quotes: 0 };
  if (!Array.isArray(posts)) return agg;
  for (const post of posts) {
    const m = post?.public_metrics || {};
    agg.impressions += Number(m.impression_count) || 0;
    agg.likes += Number(m.like_count) || 0;
    agg.retweets += Number(m.retweet_count) || 0;
    agg.replies += Number(m.reply_count) || 0;
    agg.quotes += Number(m.quote_count) || 0;
  }
  agg.engagement = agg.likes + agg.retweets + agg.replies + agg.quotes;
  return agg;
}

function XAggregates({ posts }) {
  if (!posts?.length) return null;
  const agg = computePostAggregates(posts);
  return (
    <div className="mb-4 p-4 rounded-xl bg-gradient-to-r from-werbens-mist/60 to-werbens-dark-cyan/5 border border-werbens-dark-cyan/10">
      <h4 className="text-xs font-semibold text-werbens-dark-cyan uppercase tracking-wider mb-3">
        Engagement totals (from {posts.length} recent post{posts.length !== 1 ? "s" : ""})
      </h4>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        <div>
          <p className="text-lg sm:text-xl font-bold text-werbens-dark-cyan">{formatNumber(agg.impressions)}</p>
          <p className="text-xs text-werbens-muted">Impressions</p>
        </div>
        <div>
          <p className="text-lg sm:text-xl font-bold text-werbens-dark-cyan">{formatNumber(agg.likes)}</p>
          <p className="text-xs text-werbens-muted">Likes</p>
        </div>
        <div>
          <p className="text-lg sm:text-xl font-bold text-werbens-dark-cyan">{formatNumber(agg.retweets)}</p>
          <p className="text-xs text-werbens-muted">Retweets</p>
        </div>
        <div>
          <p className="text-lg sm:text-xl font-bold text-werbens-dark-cyan">{formatNumber(agg.replies)}</p>
          <p className="text-xs text-werbens-muted">Replies</p>
        </div>
        <div>
          <p className="text-lg sm:text-xl font-bold text-werbens-dark-cyan">{formatNumber(agg.quotes)}</p>
          <p className="text-xs text-werbens-muted">Quotes</p>
        </div>
        <div>
          <p className="text-lg sm:text-xl font-bold text-werbens-dark-cyan">{formatNumber(agg.engagement)}</p>
          <p className="text-xs text-werbens-muted">Total engagement</p>
        </div>
      </div>
    </div>
  );
}

function XPosts({ posts }) {
  if (!posts?.length) return <p className="text-sm text-werbens-muted">No posts yet.</p>;
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-werbens-dark-cyan uppercase tracking-wider">Recent posts</h4>
      <ul className="space-y-3">
        {posts.map((post, idx) => {
          if (!post) return null;
          const m = post.public_metrics || {};
          return (
            <li
              key={post.id || `post-${idx}`}
              className="p-3 sm:p-4 rounded-xl bg-werbens-mist/40 border border-werbens-dark-cyan/8"
            >
              <p className="text-sm text-werbens-text whitespace-pre-wrap break-words">{post.text ?? ""}</p>
              {post.created_at && (
                <p className="text-xs text-werbens-muted mt-2">
                  {(() => {
                    try {
                      const d = new Date(post.created_at);
                      return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString(undefined, { dateStyle: "medium", timeStyle: "short" });
                    } catch {
                      return "";
                    }
                  })()}
                </p>
              )}
              <div className="flex flex-wrap gap-3 mt-2 text-xs text-werbens-muted">
                {m.impression_count != null && <span>{formatNumber(m.impression_count)} impressions</span>}
                {m.like_count != null && <span>{formatNumber(m.like_count)} likes</span>}
                {m.retweet_count != null && <span>{formatNumber(m.retweet_count)} retweets</span>}
                {m.reply_count != null && <span>{formatNumber(m.reply_count)} replies</span>}
                {m.quote_count != null && <span>{formatNumber(m.quote_count)} quotes</span>}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function PlatformContent({ platform, doc }) {
  if (!doc) return null;
  const profile = doc.profile;
  const posts = Array.isArray(doc.posts) ? doc.posts : [];
  if (platform === "x") {
    return (
      <>
        <XProfile profile={profile} />
        <XAggregates posts={posts} />
        <XPosts posts={posts} />
      </>
    );
  }
  return (
    <div className="text-sm text-werbens-muted">
      Profile and posts for {platform} will be shown here (same UI pattern).
    </div>
  );
}

export function SocialMediaSection({ userId }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [syncing, setSyncing] = useState(null);

  useEffect(() => {
    if (!userId) {
      setList([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    getSocialAnalytics(userId)
      .then((r) => {
        setList(r.data || []);
        if (r.error) setError(r.error);
      })
      .catch((err) => {
        setError(err.message || "Failed to load");
        setList([]);
      })
      .finally(() => setLoading(false));
  }, [userId]);

  const handleSync = async (platform) => {
    if (!userId) return;
    setSyncing(platform);
    try {
      await syncSocialPlatform(userId, platform);
      const r = await getSocialAnalytics(userId);
      setList(r.data || []);
    } catch (e) {
      setError(e.message || "Sync failed");
    } finally {
      setSyncing(null);
    }
  };

  if (!userId) return null;
  if (loading) {
    return (
      <section className="px-4 sm:px-6 pb-12 sm:pb-16" aria-label="Social accounts data">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-lg sm:text-xl font-bold text-werbens-dark-cyan mb-5">Connected social data</h2>
          <p className="text-sm text-werbens-muted">Loading…</p>
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 sm:px-6 pb-12 sm:pb-16" aria-label="Social accounts data">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-lg sm:text-xl font-bold text-werbens-dark-cyan mb-5 sm:mb-7">
          Connected social data
        </h2>
        {error && (
          <p className="text-sm text-red-600 mb-4" role="alert">
            {error}
          </p>
        )}
        {list.length === 0 ? (
          <p className="text-sm text-werbens-muted">Connect an account from Accounts to see data here.</p>
        ) : (
          <div className="space-y-4">
            {list.filter(Boolean).map((doc) => {
              const platformLabel = PLATFORM_LABELS[doc.platform] || doc.platform;
              const displayUsername = doc.profile?.username ? `@${doc.profile.username}` : doc.username || "";
              const title = `${platformLabel} – ${displayUsername}`.trim() || `${platformLabel} – Connected`;
              return (
                <CollapsibleCard key={`${doc.platform}-${doc.profile?.id || doc.userId}`} title={title}>
                  {doc.platform === "x" && (
                    <div className="flex justify-end mb-2">
                      <button
                        type="button"
                        onClick={() => handleSync("x")}
                        disabled={syncing === "x"}
                        className="text-xs font-medium text-werbens-dark-cyan hover:underline disabled:opacity-50"
                      >
                        {syncing === "x" ? "Syncing…" : "Sync now"}
                      </button>
                    </div>
                  )}
                  <PlatformContent platform={doc.platform} doc={doc} />
                  {doc.lastFetchedAt && (
                    <p className="text-xs text-werbens-muted mt-4">
                      Last synced:{" "}
                      {(() => {
                        try {
                          const d = new Date(doc.lastFetchedAt);
                          return Number.isNaN(d.getTime()) ? "" : d.toLocaleString();
                        } catch {
                          return "";
                        }
                      })()}
                    </p>
                  )}
                </CollapsibleCard>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
