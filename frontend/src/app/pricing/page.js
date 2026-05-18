import { PricingFlow } from "./components/PricingFlow";
import { getRequestCountry } from "@/lib/requestCountry";

export const metadata = {
  title: "Pricing | Werbens — AI Content Creation Plans",
  description:
    "Simple pricing for AI-powered content. Free plan includes automatic posting and daily content. Paid plans add more images and video. Video generations available as premium add-on.",
  keywords:
    "Werbens pricing, content creation plans, AI content pricing, social media automation plans",
};

export default async function PricingPage() {
  const initialCountry = await getRequestCountry();
  return <PricingFlow initialCountry={initialCountry} />;
}
