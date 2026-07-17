import { PricingFlow } from "./components/PricingFlow";
import { getRequestCountry } from "@/lib/requestCountry";

export const metadata = {
  title: "Pricing",
  description:
    "Werbens pricing for AI-powered content creation, daily content, automatic posting, brand visuals, and scalable social media campaigns.",
  keywords:
    "Werbens pricing, content creation plans, AI content pricing, social media automation plans",
  alternates: {
    canonical: "https://app.werbens.com/app/pricing",
  },
  openGraph: {
    title: "Werbens Pricing",
    description:
      "AI content creation plans for brands that need social posts, ad creatives, visuals, and campaign assets.",
    url: "https://app.werbens.com/app/pricing",
  },
};

export default async function PricingPage() {
  const initialCountry = await getRequestCountry();
  return <PricingFlow initialCountry={initialCountry} />;
}
