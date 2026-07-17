export const siteUrl = "https://app.werbens.com";
export const appUrl = `${siteUrl}/app`;
export const organizationId = `${appUrl}#organization`;
export const softwareId = `${appUrl}#software`;
export const websiteId = `${appUrl}#website`;
export const logoUrl = `${siteUrl}/app/werbens-logo.svg`;
export const productDescription =
  "Werbens is a marketing company that owns and operates an AI-powered platform for brand content, social posts, ad creatives, visuals, and campaign assets.";

export const organizationSchema = {
  "@type": "Organization",
  "@id": organizationId,
  name: "Werbens",
  url: appUrl,
  logo: logoUrl,
};

export const softwareSchema = {
  "@type": "SoftwareApplication",
  "@id": softwareId,
  name: "Werbens",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: appUrl,
  description: productDescription,
  publisher: { "@id": organizationId },
};

export const solutionPages = [
  {
    slug: "ai-reel-generator",
    title: "AI Reel Generator",
    headline: "AI reels that are planned, produced, and ready to post.",
    description:
      "Create short-form videos for Instagram, YouTube Shorts, TikTok, and LinkedIn with brand direction, scripts, visuals, and publishing-ready assets.",
    keywords: ["AI reel generator", "AI reels", "short-form video", "Instagram reels"],
    outcomes: [
      "Turn product launches, founder ideas, and campaign briefs into reel concepts.",
      "Keep every video aligned with brand voice, visual style, and audience intent.",
      "Produce consistent weekly content without rebuilding the creative process each time.",
    ],
  },
  {
    slug: "social-media-automation",
    title: "Social Media Automation",
    headline: "Automated social content without losing brand control.",
    description:
      "Plan, create, and manage consistent social media content across Instagram, Facebook, LinkedIn, YouTube, and TikTok.",
    keywords: ["social media automation", "AI social media", "content calendar", "brand posts"],
    outcomes: [
      "Generate platform-specific posts, captions, visuals, and reel ideas from one brand brief.",
      "Maintain a steady content calendar for teams that cannot afford creative gaps.",
      "Reduce manual production while keeping human review and brand direction intact.",
    ],
  },
  {
    slug: "ai-ad-creatives",
    title: "AI Ad Creatives",
    headline: "Ad creatives built for testing, learning, and conversion.",
    description:
      "Generate campaign visuals, video hooks, ad copy, and creative variants for Meta, Google, LinkedIn, and YouTube campaigns.",
    keywords: ["AI ad creatives", "ad creative generator", "Meta ads", "creative testing"],
    outcomes: [
      "Create multiple angles for the same offer so teams can test faster.",
      "Match each creative to audience awareness, platform format, and campaign goal.",
      "Refresh campaigns before creative fatigue kills performance.",
    ],
  },
  {
    slug: "brand-content-studio",
    title: "Brand Content Studio",
    headline: "A creative content studio for brands that need volume and taste.",
    description:
      "Combine AI-assisted production with human creative direction for reels, images, ads, campaign assets, and brand storytelling.",
    keywords: ["brand content studio", "AI content studio", "brand visuals", "creative production"],
    outcomes: [
      "Build a repeatable creative system around your brand identity.",
      "Create campaign-ready assets across video, image, copy, and social formats.",
      "Scale output while keeping quality, tone, and design consistent.",
    ],
  },
  {
    slug: "personal-brand-content",
    title: "Personal Brand Content",
    headline: "Personal brand content that sounds like you and scales with you.",
    description:
      "Create founder-led posts, reels, LinkedIn content, thought leadership, and personal brand campaigns with consistent voice and visuals.",
    keywords: ["personal brand content", "founder content", "LinkedIn content", "AI personal branding"],
    outcomes: [
      "Turn raw expertise into short-form content, carousels, and daily social posts.",
      "Keep voice, positioning, and authority consistent across platforms.",
      "Support creators, consultants, founders, and executives with repeatable content output.",
    ],
  },
  {
    slug: "ai-content-marketing",
    title: "AI Content Marketing",
    headline: "Content marketing powered by AI, strategy, and brand context.",
    description:
      "Create SEO pages, social campaigns, email content, ad copy, and brand assets from one connected content system.",
    keywords: ["AI content marketing", "content marketing platform", "SEO content", "marketing automation"],
    outcomes: [
      "Connect campaign strategy with production across search, social, and paid media.",
      "Repurpose one idea into pages, posts, ads, emails, and short videos.",
      "Create more content while preserving a clear brand narrative.",
    ],
  },
];

export const industryPages = [
  {
    slug: "restaurants-and-food-brands",
    title: "Restaurants & Food Brands",
    headline: "Food content that makes people stop, crave, and order.",
    description:
      "Create reels, menu visuals, launch campaigns, offer creatives, and social content for restaurants, cafes, cloud kitchens, and food brands.",
    keywords: ["restaurant marketing", "food reels", "food brand content", "cafe social media"],
  },
  {
    slug: "fashion-and-lifestyle",
    title: "Fashion & Lifestyle Brands",
    headline: "Fashion content with sharper storytelling and stronger visual rhythm.",
    description:
      "Create campaign visuals, product reels, lookbook content, launch assets, and ad creatives for fashion and lifestyle brands.",
    keywords: ["fashion marketing", "fashion reels", "lifestyle brand content", "AI fashion ads"],
  },
  {
    slug: "home-decor-and-interiors",
    title: "Home Decor & Interiors",
    headline: "Interior content that turns spaces into stories.",
    description:
      "Create reels, room reveals, product visuals, before-after content, and campaign assets for home decor, furniture, and interior brands.",
    keywords: ["home decor marketing", "interior design content", "furniture ads", "home decor reels"],
  },
  {
    slug: "hospitality-and-hotels",
    title: "Hospitality & Hotels",
    headline: "Hospitality content that sells the feeling of staying there.",
    description:
      "Create destination reels, hotel campaigns, guest experience videos, offer creatives, and social content for hospitality brands.",
    keywords: ["hotel marketing", "hospitality content", "resort reels", "travel ad creatives"],
  },
  {
    slug: "education-and-coaching",
    title: "Education & Coaching",
    headline: "Education content that explains, builds trust, and converts.",
    description:
      "Create course reels, explainer videos, webinar campaigns, social posts, and ad creatives for educators, coaches, and learning brands.",
    keywords: ["education marketing", "coaching content", "course ads", "edtech content"],
  },
  {
    slug: "saas-and-b2b",
    title: "SaaS & B2B",
    headline: "B2B content that makes complex products easy to understand.",
    description:
      "Create LinkedIn content, product explainers, demo clips, case study assets, and demand generation creatives for SaaS and B2B teams.",
    keywords: ["SaaS content marketing", "B2B content", "LinkedIn marketing", "product explainer videos"],
  },
];

export function findPage(collection, slug) {
  return collection.find((page) => page.slug === slug) || null;
}
