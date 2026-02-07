export const OVERVIEW_STATS = {
  impressions: { value: 1247800, change: 12.4, label: "Total Impressions" },
  engagement: { value: 89234, change: 8.2, label: "Engagement" },
  reach: { value: 456120, change: -2.1, label: "Reach" },
  clicks: { value: 34210, change: 18.7, label: "Clicks" },
};

export const CHANNELS = [
  {
    id: "social",
    name: "Social Media",
    platforms: ["Instagram", "LinkedIn", "Twitter", "Facebook"],
    metrics: {
      posts: 48,
      impressions: 623400,
      engagement: 42100,
      engagementRate: 6.8,
      change: 14.2,
    },
    topContent: [
      { title: "Product launch post", engagement: 12400, type: "Instagram" },
      { title: "LinkedIn thought piece", engagement: 8200, type: "LinkedIn" },
      { title: "Behind-the-scenes Reel", engagement: 5600, type: "Instagram" },
    ],
  },
  {
    id: "ads",
    name: "Ad Creatives",
    platforms: ["Meta Ads", "Google Ads", "LinkedIn Ads"],
    metrics: {
      campaigns: 6,
      impressions: 412300,
      clicks: 18920,
      ctr: 4.6,
      change: 8.5,
    },
    topContent: [
      { title: "Summer sale banner", clicks: 4200, type: "Meta" },
      { title: "Search campaign - Product", clicks: 3100, type: "Google" },
      { title: "B2B lead gen", clicks: 2100, type: "LinkedIn" },
    ],
  },
  {
    id: "email",
    name: "Email Campaigns",
    platforms: ["Newsletter", "Product updates", "Promotions"],
    metrics: {
      sent: 125000,
      opens: 43750,
      openRate: 35,
      clicks: 9190,
      clickRate: 7.4,
      change: 3.2,
    },
    topContent: [
      { title: "Weekly digest #42", openRate: 42, type: "Newsletter" },
      { title: "New feature announcement", openRate: 38, type: "Product" },
      { title: "Flash sale email", openRate: 31, type: "Promotion" },
    ],
  },
];

export function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}
