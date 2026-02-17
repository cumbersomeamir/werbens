export const OVERVIEW_STATS = {
  followers: { value: 0, change: null, label: "Followers / Subscribers" },
  impressions: { value: 0, change: null, label: "Total Impressions" },
  engagement: { value: 0, change: null, label: "Engagement" },
  reach: { value: 0, change: null, label: "Reach" },
  posts: { value: 0, change: null, label: "Total Posts" },
  videos: { value: 0, change: null, label: "Total Videos" },
  likes: { value: 0, change: null, label: "Total Likes" },
  comments: { value: 0, change: null, label: "Total Comments" },
};

/**
 * Extract numeric value from insights (array of { end_time, value })
 */
function sumInsightValues(val) {
  if (Array.isArray(val)) {
    return val.reduce((s, v) => s + (Number(v?.value) || 0), 0);
  }
  return Number(val) || 0;
}

/**
 * Extract all available metrics from a single SocialMedia doc
 */
function extractMetricsFromDoc(doc) {
  const m = {
    impressions: 0,
    engagement: 0,
    reach: 0,
    clicks: 0,
    posts: 0,
    videos: 0,
    followers: 0,
    likes: 0,
    comments: 0,
  };
  const platform = doc?.platform || "";
  const profile = doc.profile || {};

  if (platform === "x") {
    const pm = profile.public_metrics || {};
    m.followers += Number(pm.followers_count) || 0;
    const posts = doc.posts || [];
    for (const p of posts) {
      const pMetrics = p?.public_metrics || {};
      m.impressions += Number(pMetrics.impression_count) || 0;
      const likes = Number(pMetrics.like_count) || 0;
      const retweets = Number(pMetrics.retweet_count) || 0;
      const replies = Number(pMetrics.reply_count) || 0;
      const quotes = Number(pMetrics.quote_count) || 0;
      m.likes += likes;
      m.comments += replies;
      m.engagement += likes + retweets + replies + quotes;
    }
    m.posts = posts.length;
  } else if (platform === "instagram") {
    m.followers += Number(profile.followers_count) || 0;
    const insights = doc.insights || {};
    m.impressions += sumInsightValues(insights.impressions);
    m.reach += sumInsightValues(insights.reach);
    const media = doc.media || [];
    for (const item of media) {
      const l = Number(item.like_count) || 0;
      const c = Number(item.comments_count) || 0;
      m.likes += l;
      m.comments += c;
      m.engagement += l + c;
    }
    m.posts = Number(profile.media_count) || media.length;
  } else if (platform === "youtube") {
    const stats = profile.statistics || {};
    m.followers += Number(stats.subscriberCount) || 0;
    const videos = doc.videos || [];
    m.videos = Number(stats.videoCount) || videos.length;
    for (const v of videos) {
      const s = v?.statistics || {};
      m.impressions += Number(s.viewCount) || 0;
      m.likes += Number(s.likeCount) || 0;
      m.comments += Number(s.commentCount) || 0;
      m.engagement += (Number(s.likeCount) || 0) + (Number(s.commentCount) || 0);
    }
    if (videos.length === 0 && stats.viewCount) {
      m.impressions += Number(stats.viewCount) || 0;
    }
    m.posts = m.videos;
  } else if (platform === "facebook") {
    const insights = doc.insights || {};
    m.followers += sumInsightValues(insights.page_fans) || Number(profile.fan_count) || Number(profile.followers_count) || 0;
    m.impressions += sumInsightValues(insights.page_impressions);
    m.engagement += sumInsightValues(insights.page_engaged_users);
    m.reach += Number(insights.reach) || sumInsightValues(insights.reach);
    const posts = doc.posts || [];
    for (const p of posts) {
      const l = Number(p.likes) || 0;
      const c = Number(p.comments) || 0;
      m.likes += l;
      m.comments += c;
      m.engagement += l + c;
    }
    m.posts = posts.length;
  } else if (platform === "linkedin") {
    m.followers += Number(profile.connectionCount) || Number(doc.insights?.connectionCount) || 0;
    m.posts = doc.posts?.length ?? 0;
  } else if (platform === "pinterest") {
    const boards = doc.boards || [];
    const boardPins = boards.reduce((sum, b) => sum + (Number(b.pin_count) || 0), 0);
    m.posts = boardPins || (doc.pins?.length ?? 0);
  }
  return m;
}

/**
 * Aggregate overview stats from all connected SocialMedia accounts
 */
export function aggregateOverviewStats(socialList) {
  const totals = {
    impressions: 0,
    engagement: 0,
    reach: 0,
    clicks: 0,
    posts: 0,
    videos: 0,
    followers: 0,
    likes: 0,
    comments: 0,
  };
  const list = Array.isArray(socialList) ? socialList : [];
  for (const doc of list) {
    const m = extractMetricsFromDoc(doc);
    Object.keys(totals).forEach((k) => {
      totals[k] += m[k] ?? 0;
    });
  }
  return {
    followers: { value: totals.followers, change: null, label: "Followers / Subscribers" },
    impressions: { value: totals.impressions, change: null, label: "Total Impressions" },
    engagement: { value: totals.engagement, change: null, label: "Engagement" },
    reach: { value: totals.reach, change: null, label: "Reach" },
    posts: { value: totals.posts, change: null, label: "Total Posts" },
    videos: { value: totals.videos, change: null, label: "Total Videos" },
    likes: { value: totals.likes, change: null, label: "Total Likes" },
    comments: { value: totals.comments, change: null, label: "Total Comments" },
  };
}

/**
 * Build dynamic Social Media channel from connected accounts
 */
export function buildSocialChannelFromData(socialList) {
  const list = Array.isArray(socialList) ? socialList : [];
  const platformLabels = { x: "X", youtube: "YouTube", instagram: "Instagram", linkedin: "LinkedIn", pinterest: "Pinterest", facebook: "Facebook" };
  const totals = { impressions: 0, engagement: 0, posts: 0 };
  const topContent = [];

  for (const doc of list) {
    const m = extractMetricsFromDoc(doc);
    totals.impressions += m.impressions;
    totals.engagement += m.engagement;
    totals.posts += m.posts;

    const platformLabel = platformLabels[doc.platform] || doc.platform;
    if (doc.platform === "x" && doc.posts?.length) {
      const sorted = [...doc.posts].sort((a, b) => {
        const ea = (a?.public_metrics?.like_count || 0) + (a?.public_metrics?.retweet_count || 0);
        const eb = (b?.public_metrics?.like_count || 0) + (b?.public_metrics?.retweet_count || 0);
        return eb - ea;
      });
      const top = sorted[0];
      if (top?.text) {
        topContent.push({ title: top.text.slice(0, 50) + (top.text.length > 50 ? "…" : ""), engagement: (top.public_metrics?.like_count || 0) + (top.public_metrics?.retweet_count || 0), type: platformLabel });
      }
    } else if (doc.platform === "instagram" && doc.media?.length) {
      const sorted = [...doc.media].sort((a, b) => (b.like_count || 0) + (b.comments_count || 0) - (a.like_count || 0) - (a.comments_count || 0));
      const top = sorted[0];
      if (top?.caption) {
        topContent.push({ title: (top.caption || "Post").slice(0, 50) + ((top.caption || "").length > 50 ? "…" : ""), engagement: (top.like_count || 0) + (top.comments_count || 0), type: platformLabel });
      } else {
        topContent.push({ title: "Instagram post", engagement: (top.like_count || 0) + (top.comments_count || 0), type: platformLabel });
      }
    } else if (doc.platform === "youtube" && doc.videos?.length) {
      const sorted = [...doc.videos].sort((a, b) => (Number(b?.statistics?.viewCount) || 0) - (Number(a?.statistics?.viewCount) || 0));
      const top = sorted[0];
      if (top?.title) {
        topContent.push({ title: top.title.slice(0, 50) + (top.title.length > 50 ? "…" : ""), engagement: Number(top.statistics?.viewCount) || 0, type: platformLabel });
      }
    }
  }

  const platforms = [...new Set(list.map((d) => platformLabels[d.platform] || d.platform).filter(Boolean))];
  const engagementRate = totals.impressions > 0 ? ((totals.engagement / totals.impressions) * 100).toFixed(1) : "0";

  return {
    id: "social",
    name: "Social Media",
    platforms: platforms.length ? platforms : ["Connect accounts"],
    metrics: {
      posts: totals.posts,
      impressions: totals.impressions,
      engagement: totals.engagement,
      engagementRate: Number(engagementRate),
      change: null,
    },
    topContent: topContent.slice(0, 5),
  };
}

export const CHANNELS = [
  {
    id: "social",
    name: "Social Media",
    platforms: ["Connect accounts"],
    metrics: {
      posts: 0,
      impressions: 0,
      engagement: 0,
      engagementRate: 0,
      change: null,
    },
    topContent: [],
  },
];

export function formatNumber(num) {
  const n = Number(num);
  if (num == null || Number.isNaN(n)) return "0";
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return String(n);
}
