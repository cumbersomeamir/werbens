"use client";

import { useState, useEffect } from "react";
import { getSocialAnalytics, syncSocialPlatform } from "@/lib/socialApi";
import { formatNumber } from "../data/analytics";

const PLATFORM_LABELS = { x: "X", youtube: "YouTube", instagram: "Instagram", linkedin: "LinkedIn", pinterest: "Pinterest", facebook: "Facebook" };

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

function LinkedInProfile({ profile }) {
  if (!profile || typeof profile !== "object") return null;
  const nameRaw = profile.name ?? ([profile.given_name, profile.family_name].filter(Boolean).join(" ").trim() || profile.username);
  const name = typeof nameRaw === "string" ? nameRaw : "LinkedIn";
  const initial = (name.charAt(0) || "?").toUpperCase();
  const pictureUrl = typeof profile.picture === "string" ? profile.picture : null;
  return (
    <div className="flex flex-col sm:flex-row gap-4 pb-4 border-b border-werbens-dark-cyan/10">
      <div className="flex items-start gap-3 shrink-0">
        {pictureUrl ? (
          <img src={pictureUrl} alt="" className="w-14 h-14 rounded-full object-cover ring-2 ring-werbens-dark-cyan/20" />
        ) : (
          <div className="w-14 h-14 rounded-full bg-werbens-dark-cyan/20 flex items-center justify-center ring-2 ring-werbens-dark-cyan/20">
            <span className="text-lg font-bold text-werbens-dark-cyan">{initial}</span>
          </div>
        )}
        <div>
          <h3 className="font-bold text-werbens-text">{name}</h3>
          {typeof profile.email === "string" && profile.email && (
            <p className="text-sm text-werbens-muted mt-0.5">{profile.email}</p>
          )}
          {typeof profile.locale === "string" && profile.locale && (
            <p className="text-xs text-werbens-muted mt-0.5">Locale: {profile.locale}</p>
          )}
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-werbens-muted">
          Profile data from Sign In with LinkedIn (OpenID Connect). Posts and engagement require additional API access.
        </p>
      </div>
    </div>
  );
}

function PinterestProfile({ profile, boardsCount, pinsCount }) {
  if (!profile || typeof profile !== "object") return null;
  const username = typeof profile.username === "string" ? profile.username : "Pinterest";
  const initial = (username.charAt(0) || "?").toUpperCase();
  const imgUrl = typeof profile.profile_image === "string" ? profile.profile_image : null;
  return (
    <div className="flex flex-col sm:flex-row gap-4 pb-4 border-b border-werbens-dark-cyan/10">
      <div className="flex items-start gap-3 shrink-0">
        {imgUrl ? (
          <img src={imgUrl} alt="" className="w-14 h-14 rounded-full object-cover ring-2 ring-werbens-dark-cyan/20" />
        ) : (
          <div className="w-14 h-14 rounded-full bg-werbens-dark-cyan/20 flex items-center justify-center ring-2 ring-werbens-dark-cyan/20">
            <span className="text-lg font-bold text-werbens-dark-cyan">{initial}</span>
          </div>
        )}
        <div>
          <h3 className="font-bold text-werbens-text">{username}</h3>
          {profile.business_name && (
            <p className="text-sm text-werbens-muted mt-0.5">{profile.business_name}</p>
          )}
          {profile.account_type && (
            <p className="text-xs text-werbens-muted mt-0.5">{profile.account_type}</p>
          )}
          <div className="flex flex-wrap gap-3 mt-2 text-sm">
            <span className="font-semibold text-werbens-text">{formatNumber(boardsCount ?? 0)} <span className="font-normal text-werbens-muted">Boards</span></span>
            <span className="font-semibold text-werbens-text">{formatNumber(pinsCount ?? 0)} <span className="font-normal text-werbens-muted">Pins</span></span>
          </div>
        </div>
      </div>
      <div className="min-w-0 flex-1">
        {profile.website_url && (
          <a href={profile.website_url} target="_blank" rel="noopener noreferrer" className="text-sm text-werbens-dark-cyan hover:underline">
            {profile.website_url}
          </a>
        )}
      </div>
    </div>
  );
}

function PinterestBoards({ boards }) {
  if (!boards?.length) return null;
  return (
    <div className="space-y-4 mb-4">
      <h4 className="text-sm font-semibold text-werbens-dark-cyan uppercase tracking-wider">Boards</h4>
      <ul className="space-y-2">
        {boards.slice(0, 15).map((board, idx) => (
          <li key={board.id || `board-${idx}`} className="p-3 rounded-xl bg-werbens-mist/40 border border-werbens-dark-cyan/8 flex justify-between items-center">
            <span className="text-sm font-medium text-werbens-text truncate">{board.name || "Unnamed"}</span>
            <span className="text-xs text-werbens-muted shrink-0 ml-2">{formatNumber(board.pin_count ?? 0)} pins</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PinterestPins({ pins }) {
  if (!pins?.length) return <p className="text-sm text-werbens-muted">No pins synced yet.</p>;
  const getImageUrl = (pin) => {
    const m = pin.media;
    if (!m) return null;
    if (typeof m === "string") return m;
    if (m.images?.original?.url) return m.images.original.url;
    if (m.images?.["736x"]?.url) return m.images["736x"].url;
    return null;
  };
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-werbens-dark-cyan uppercase tracking-wider">Recent pins</h4>
      <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {pins.slice(0, 18).map((pin, idx) => {
          if (!pin) return null;
          const thumb = getImageUrl(pin);
          return (
            <li key={pin.id || `pin-${idx}`} className="rounded-xl overflow-hidden bg-werbens-mist/40 border border-werbens-dark-cyan/8">
              {thumb && <img src={thumb} alt="" className="w-full aspect-square object-cover" />}
              <div className="p-2">
                <p className="text-xs font-medium text-werbens-text line-clamp-2">{pin.title || "Pin"}</p>
                {pin.link && (
                  <a href={pin.link} target="_blank" rel="noopener noreferrer" className="text-xs text-werbens-dark-cyan hover:underline truncate block">View</a>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function YouTubeProfile({ profile }) {
  if (!profile) return null;
  const stats = profile.statistics || {};
  const thumb = profile.thumbnails?.medium?.url || profile.thumbnails?.default?.url;
  return (
    <div className="flex flex-col sm:flex-row gap-4 pb-4 border-b border-werbens-dark-cyan/10">
      <div className="flex items-start gap-3 shrink-0">
        {thumb ? (
          <img src={thumb} alt="" className="w-14 h-14 rounded-full object-cover ring-2 ring-werbens-dark-cyan/20" />
        ) : (
          <div className="w-14 h-14 rounded-full bg-werbens-dark-cyan/20 flex items-center justify-center ring-2 ring-werbens-dark-cyan/20">
            <span className="text-lg font-bold text-werbens-dark-cyan">{(profile.title || "?").charAt(0)}</span>
          </div>
        )}
        <div>
          <h3 className="font-bold text-werbens-text">{profile.title || "YouTube Channel"}</h3>
          {profile.publishedAt && (
            <p className="text-xs text-werbens-muted mt-0.5">
              Created {(() => {
                try {
                  const d = new Date(profile.publishedAt);
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
          <p className="text-sm text-werbens-text line-clamp-3">{profile.description}</p>
        )}
        <div className="flex flex-wrap gap-4 sm:gap-6 mt-3 text-sm">
          <span className="font-semibold text-werbens-text">
            {formatNumber(stats.subscriberCount ?? 0)} <span className="font-normal text-werbens-muted">Subscribers</span>
          </span>
          <span className="font-semibold text-werbens-text">
            {formatNumber(stats.videoCount ?? 0)} <span className="font-normal text-werbens-muted">Videos</span>
          </span>
          <span className="font-semibold text-werbens-text">
            {formatNumber(stats.viewCount ?? 0)} <span className="font-normal text-werbens-muted">Total views</span>
          </span>
        </div>
      </div>
    </div>
  );
}

function computeVideoAggregates(videos) {
  const agg = { views: 0, likes: 0, comments: 0 };
  if (!Array.isArray(videos)) return agg;
  for (const v of videos) {
    const s = v?.statistics || {};
    agg.views += Number(s.viewCount) || 0;
    agg.likes += Number(s.likeCount) || 0;
    agg.comments += Number(s.commentCount) || 0;
  }
  agg.engagement = agg.likes + agg.comments;
  return agg;
}

function YouTubeAggregates({ videos }) {
  if (!videos?.length) return null;
  const agg = computeVideoAggregates(videos);
  return (
    <div className="mb-4 p-4 rounded-xl bg-gradient-to-r from-werbens-mist/60 to-werbens-dark-cyan/5 border border-werbens-dark-cyan/10">
      <h4 className="text-xs font-semibold text-werbens-dark-cyan uppercase tracking-wider mb-3">
        Totals (from {videos.length} video{videos.length !== 1 ? "s" : ""})
      </h4>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <p className="text-lg sm:text-xl font-bold text-werbens-dark-cyan">{formatNumber(agg.views)}</p>
          <p className="text-xs text-werbens-muted">Views</p>
        </div>
        <div>
          <p className="text-lg sm:text-xl font-bold text-werbens-dark-cyan">{formatNumber(agg.likes)}</p>
          <p className="text-xs text-werbens-muted">Likes</p>
        </div>
        <div>
          <p className="text-lg sm:text-xl font-bold text-werbens-dark-cyan">{formatNumber(agg.comments)}</p>
          <p className="text-xs text-werbens-muted">Comments</p>
        </div>
        <div>
          <p className="text-lg sm:text-xl font-bold text-werbens-dark-cyan">{formatNumber(agg.engagement)}</p>
          <p className="text-xs text-werbens-muted">Total engagement</p>
        </div>
      </div>
    </div>
  );
}

function YouTubeVideos({ videos }) {
  if (!videos?.length) return <p className="text-sm text-werbens-muted">No videos yet.</p>;
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-werbens-dark-cyan uppercase tracking-wider">Recent videos</h4>
      <ul className="space-y-3">
        {videos.slice(0, 20).map((video, idx) => {
          if (!video) return null;
          const s = video.statistics || {};
          const thumb = video.thumbnails?.medium?.url || video.thumbnails?.default?.url;
          return (
            <li
              key={video.id || `video-${idx}`}
              className="p-3 sm:p-4 rounded-xl bg-werbens-mist/40 border border-werbens-dark-cyan/8 flex gap-3"
            >
              {thumb && (
                <img src={thumb} alt="" className="w-24 h-14 object-cover rounded-lg shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-werbens-text line-clamp-2">{video.title || "Untitled"}</p>
                {video.publishedAt && (
                  <p className="text-xs text-werbens-muted mt-1">
                    {(() => {
                      try {
                        const d = new Date(video.publishedAt);
                        return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString(undefined, { dateStyle: "medium" });
                      } catch {
                        return "";
                      }
                    })()}
                  </p>
                )}
                <div className="flex flex-wrap gap-3 mt-2 text-xs text-werbens-muted">
                  <span>{formatNumber(s.viewCount ?? 0)} views</span>
                  <span>{formatNumber(s.likeCount ?? 0)} likes</span>
                  <span>{formatNumber(s.commentCount ?? 0)} comments</span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
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

function FacebookProfile({ profile }) {
  if (!profile || typeof profile !== "object") return null;
  const name = typeof profile.name === "string" ? profile.name : "Facebook Page";
  const pic = profile.picture;
  return (
    <div className="flex flex-col sm:flex-row gap-4 pb-4 border-b border-werbens-dark-cyan/10">
      <div className="flex items-center gap-3 shrink-0">
        {pic ? (
          <img src={pic} alt="" className="w-14 h-14 rounded-full object-cover ring-2 ring-werbens-dark-cyan/20" />
        ) : (
          <div className="w-14 h-14 rounded-full bg-werbens-dark-cyan/20 flex items-center justify-center ring-2 ring-werbens-dark-cyan/20">
            <span className="text-lg font-bold text-werbens-dark-cyan">{(name.charAt(0) || "F").toUpperCase()}</span>
          </div>
        )}
        <div>
          <h3 className="font-bold text-werbens-text">{name}</h3>
          <p className="text-xs text-werbens-muted mt-0.5">Page you manage. Personal profile posts are not included.</p>
        </div>
      </div>
    </div>
  );
}

function computeFacebookAggregates(posts) {
  const agg = { posts: 0, likes: 0, comments: 0 };
  if (!Array.isArray(posts)) return agg;
  for (const p of posts) {
    if (!p) continue;
    agg.posts += 1;
    agg.likes += Number(p.likes) || 0;
    agg.comments += Number(p.comments) || 0;
  }
  agg.engagement = agg.likes + agg.comments;
  return agg;
}

function FacebookAggregates({ posts }) {
  if (!posts?.length) return null;
  const agg = computeFacebookAggregates(posts);
  return (
    <div className="mb-4 p-4 rounded-xl bg-gradient-to-r from-werbens-mist/60 to-werbens-dark-cyan/5 border border-werbens-dark-cyan/10">
      <h4 className="text-xs font-semibold text-werbens-dark-cyan uppercase tracking-wider mb-3">
        Engagement totals (from {agg.posts} post{agg.posts !== 1 ? "s" : ""})
      </h4>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <p className="text-lg sm:text-xl font-bold text-werbens-dark-cyan">{formatNumber(agg.posts)}</p>
          <p className="text-xs text-werbens-muted">Posts</p>
        </div>
        <div>
          <p className="text-lg sm:text-xl font-bold text-werbens-dark-cyan">{formatNumber(agg.likes)}</p>
          <p className="text-xs text-werbens-muted">Likes</p>
        </div>
        <div>
          <p className="text-lg sm:text-xl font-bold text-werbens-dark-cyan">{formatNumber(agg.comments)}</p>
          <p className="text-xs text-werbens-muted">Comments</p>
        </div>
        <div>
          <p className="text-lg sm:text-xl font-bold text-werbens-dark-cyan">{formatNumber(agg.engagement)}</p>
          <p className="text-xs text-werbens-muted">Total engagement</p>
        </div>
      </div>
    </div>
  );
}

function FacebookPosts({ posts }) {
  if (!posts?.length) return <p className="text-sm text-werbens-muted">No posts yet.</p>;
  return (
    <div className="space-y-4 mb-4">
      <h4 className="text-sm font-semibold text-werbens-dark-cyan uppercase tracking-wider">Page posts</h4>
      <ul className="space-y-3">
        {posts.slice(0, 20).map((post, idx) => {
          if (!post) return null;
          return (
            <li key={post.id || `fb-${idx}`} className="p-3 sm:p-4 rounded-xl bg-werbens-mist/40 border border-werbens-dark-cyan/8">
              <p className="text-sm text-werbens-text whitespace-pre-wrap break-words">{post.message ?? ""}</p>
              {post.full_picture && (
                <img src={post.full_picture} alt="" className="mt-2 rounded-lg max-h-48 object-cover w-full" />
              )}
              {post.created_time && (
                <p className="text-xs text-werbens-muted mt-2">
                  {(() => {
                    try {
                      const d = new Date(post.created_time);
                      return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString(undefined, { dateStyle: "medium", timeStyle: "short" });
                    } catch {
                      return "";
                    }
                  })()}
                </p>
              )}
              <div className="flex flex-wrap gap-3 mt-2 text-xs text-werbens-muted">
                {post.likes != null && <span>{formatNumber(post.likes)} likes</span>}
                {post.comments != null && <span>{formatNumber(post.comments)} comments</span>}
              </div>
              {post.permalink_url && (
                <a href={post.permalink_url} target="_blank" rel="noopener noreferrer" className="text-xs text-werbens-dark-cyan hover:underline mt-2 inline-block">View on Facebook</a>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function FacebookInsights({ insights }) {
  if (!insights || typeof insights !== "object" || Object.keys(insights).length === 0) return null;
  const labels = { page_impressions: "Impressions", page_engaged_users: "Engaged users", page_fans: "Page fans" };
  return (
    <div className="space-y-4 mb-4">
      <h4 className="text-sm font-semibold text-werbens-dark-cyan uppercase tracking-wider">Insights (last 30 days)</h4>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {Object.entries(insights).map(([key, values]) => {
          const arr = Array.isArray(values) ? values : [];
          const total = arr.reduce((s, v) => s + (Number(v?.value) || 0), 0);
          return (
            <div key={key} className="p-3 rounded-xl bg-werbens-mist/40 border border-werbens-dark-cyan/8">
              <p className="text-xs text-werbens-muted uppercase tracking-wider">{labels[key] || key}</p>
              <p className="text-lg font-bold text-werbens-dark-cyan mt-1">{formatNumber(total)}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function InstagramProfile({ profile }) {
  if (!profile || typeof profile !== "object") return null;
  const username = typeof profile.username === "string" ? profile.username : "Instagram";
  const pic = profile.profile_picture_url;
  return (
    <div className="flex flex-col sm:flex-row gap-4 pb-4 border-b border-werbens-dark-cyan/10">
      <div className="flex items-center gap-3 shrink-0">
        {pic ? (
          <img src={pic} alt="" className="w-14 h-14 rounded-full object-cover ring-2 ring-werbens-dark-cyan/20" />
        ) : (
          <div className="w-14 h-14 rounded-full bg-werbens-dark-cyan/20 flex items-center justify-center ring-2 ring-werbens-dark-cyan/20">
            <span className="text-lg font-bold text-werbens-dark-cyan">@</span>
          </div>
        )}
        <div>
          <h3 className="font-bold text-werbens-text">@{username}</h3>
          {profile.biography && <p className="text-sm text-werbens-muted mt-0.5 line-clamp-2">{profile.biography}</p>}
          <div className="flex flex-wrap gap-3 mt-2 text-sm">
            <span className="font-semibold text-werbens-text">{formatNumber(profile.followers_count ?? 0)} <span className="font-normal text-werbens-muted">followers</span></span>
            <span className="font-semibold text-werbens-text">{formatNumber(profile.follows_count ?? 0)} <span className="font-normal text-werbens-muted">following</span></span>
            <span className="font-semibold text-werbens-text">{formatNumber(profile.media_count ?? 0)} <span className="font-normal text-werbens-muted">media</span></span>
          </div>
        </div>
      </div>
    </div>
  );
}

function computeInstagramAggregates(media) {
  const agg = { media: 0, likes: 0, comments: 0 };
  if (!Array.isArray(media)) return agg;
  for (const m of media) {
    if (!m) continue;
    agg.media += 1;
    agg.likes += Number(m.like_count) || 0;
    agg.comments += Number(m.comments_count) || 0;
  }
  agg.engagement = agg.likes + agg.comments;
  return agg;
}

function InstagramAggregates({ media }) {
  if (!media?.length) return null;
  const agg = computeInstagramAggregates(media);
  return (
    <div className="mb-4 p-4 rounded-xl bg-gradient-to-r from-werbens-mist/60 to-werbens-dark-cyan/5 border border-werbens-dark-cyan/10">
      <h4 className="text-xs font-semibold text-werbens-dark-cyan uppercase tracking-wider mb-3">
        Engagement totals (from {agg.media} item{agg.media !== 1 ? "s" : ""})
      </h4>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <p className="text-lg sm:text-xl font-bold text-werbens-dark-cyan">{formatNumber(agg.likes)}</p>
          <p className="text-xs text-werbens-muted">Likes</p>
        </div>
        <div>
          <p className="text-lg sm:text-xl font-bold text-werbens-dark-cyan">{formatNumber(agg.comments)}</p>
          <p className="text-xs text-werbens-muted">Comments</p>
        </div>
        <div>
          <p className="text-lg sm:text-xl font-bold text-werbens-dark-cyan">{formatNumber(agg.engagement)}</p>
          <p className="text-xs text-werbens-muted">Total engagement</p>
        </div>
      </div>
    </div>
  );
}

function InstagramMedia({ media }) {
  if (!media?.length) return <p className="text-sm text-werbens-muted">No media yet.</p>;
  return (
    <div className="space-y-4 mb-4">
      <h4 className="text-sm font-semibold text-werbens-dark-cyan uppercase tracking-wider">Recent media</h4>
      <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {media.slice(0, 18).map((item, idx) => {
          if (!item) return null;
          const thumb = item.thumbnail_url || item.media_url;
          return (
            <li key={item.id || `ig-${idx}`} className="rounded-xl overflow-hidden bg-werbens-mist/40 border border-werbens-dark-cyan/8">
              {thumb && <img src={thumb} alt="" className="w-full aspect-square object-cover" />}
              <div className="p-2">
                <p className="text-xs text-werbens-text line-clamp-2">{item.caption || ""}</p>
                <div className="flex gap-2 mt-1 text-xs text-werbens-muted">
                  <span>{formatNumber(item.like_count ?? 0)} likes</span>
                  <span>{formatNumber(item.comments_count ?? 0)} comments</span>
                </div>
                {item.permalink && (
                  <a href={item.permalink} target="_blank" rel="noopener noreferrer" className="text-xs text-werbens-dark-cyan hover:underline mt-1 inline-block">View</a>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function InstagramInsights({ insights }) {
  if (!insights || typeof insights !== "object" || Object.keys(insights).length === 0) return null;
  const labels = { impressions: "Impressions", reach: "Reach", profile_views: "Profile views" };
  return (
    <div className="space-y-4 mb-4">
      <h4 className="text-sm font-semibold text-werbens-dark-cyan uppercase tracking-wider">Account insights</h4>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {Object.entries(insights).map(([key, values]) => {
          const arr = Array.isArray(values) ? values : [];
          const total = arr.reduce((s, v) => s + (Number(v?.value) || 0), 0);
          return (
            <div key={key} className="p-3 rounded-xl bg-werbens-mist/40 border border-werbens-dark-cyan/8">
              <p className="text-xs text-werbens-muted uppercase tracking-wider">{labels[key] || key}</p>
              <p className="text-lg font-bold text-werbens-dark-cyan mt-1">{formatNumber(total)}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PlatformContent({ platform, doc }) {
  if (!doc) return null;
  const profile = doc.profile;
  const posts = Array.isArray(doc.posts) ? doc.posts : [];
  const videos = Array.isArray(doc.videos) ? doc.videos : [];
  if (platform === "x") {
    return (
      <>
        <XProfile profile={profile} />
        <XAggregates posts={posts} />
        <XPosts posts={posts} />
      </>
    );
  }
  if (platform === "youtube") {
    return (
      <>
        <YouTubeProfile profile={profile} />
        <YouTubeAggregates videos={videos} />
        <YouTubeVideos videos={videos} />
      </>
    );
  }
  if (platform === "linkedin") {
    return (
      <>
        <LinkedInProfile profile={profile} />
      </>
    );
  }
  if (platform === "pinterest") {
    const boards = Array.isArray(doc.boards) ? doc.boards : [];
    const pins = Array.isArray(doc.pins) ? doc.pins : [];
    return (
      <>
        <PinterestProfile profile={profile} boardsCount={boards.length} pinsCount={pins.length} />
        <PinterestBoards boards={boards} />
        <PinterestPins pins={pins} />
      </>
    );
  }
  if (platform === "facebook") {
    const posts = Array.isArray(doc.posts) ? doc.posts : [];
    const insights = doc.insights || null;
    return (
      <>
        <FacebookProfile profile={profile} />
        <FacebookAggregates posts={posts} />
        <FacebookInsights insights={insights} />
        <FacebookPosts posts={posts} />
      </>
    );
  }
  if (platform === "instagram") {
    const media = Array.isArray(doc.media) ? doc.media : [];
    const insights = doc.insights || null;
    return (
      <>
        <InstagramProfile profile={profile} />
        <InstagramAggregates media={media} />
        <InstagramInsights insights={insights} />
        <InstagramMedia media={media} />
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
              const displayName =
                doc.platform === "youtube"
                  ? (doc.profile?.title || doc.username || "Channel")
                  : doc.platform === "linkedin"
                    ? (typeof doc.profile?.name === "string" && doc.profile.name)
                      ? doc.profile.name
                      : ([doc.profile?.given_name, doc.profile?.family_name].filter(Boolean).join(" ").trim() || doc.username || "LinkedIn")
                    : doc.platform === "pinterest"
                      ? (typeof doc.profile?.username === "string" && doc.profile.username) || doc.username || "Pinterest"
                      : doc.platform === "facebook"
                        ? (typeof doc.profile?.name === "string" && doc.profile.name) || doc.username || "Facebook"
                        : doc.platform === "instagram"
                          ? (typeof doc.profile?.username === "string" && doc.profile.username) ? `@${doc.profile.username}` : doc.username || "Instagram"
                          : doc.profile?.username
                            ? `@${doc.profile.username}`
                            : doc.username || "";
              const title = `${platformLabel} – ${displayName}`.trim() || `${platformLabel} – Connected`;
              const cardKey = `${doc.platform}-${doc.channelId ?? doc.profile?.id ?? doc.userId}`;
              return (
                <CollapsibleCard key={cardKey} title={title}>
                  {(doc.platform === "x" || doc.platform === "youtube" || doc.platform === "linkedin" || doc.platform === "pinterest" || doc.platform === "facebook" || doc.platform === "instagram") && (
                    <div className="flex justify-end mb-2">
                      <button
                        type="button"
                        onClick={() => handleSync(doc.platform)}
                        disabled={syncing === doc.platform}
                        className="text-xs font-medium text-werbens-dark-cyan hover:underline disabled:opacity-50"
                      >
                        {syncing === doc.platform ? "Syncing…" : "Sync now"}
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
