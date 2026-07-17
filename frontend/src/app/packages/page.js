import { PackagesFlow } from "./components/PackagesFlow";
import { getRequestCountry } from "@/lib/requestCountry";

export const metadata = {
  title: "Content Packages",
  description:
    "Werbens content packages for ready-to-post reels, brand visuals, revisions, personal image cloning, and social ad management.",
  alternates: {
    canonical: "https://app.werbens.com/app/packages",
  },
  openGraph: {
    title: "Werbens Content Packages",
    description:
      "Ready-to-post reels, brand visuals, revisions, and ad management packages for growing brands.",
    url: "https://app.werbens.com/app/packages",
  },
};

export default async function PackagesPage() {
  const initialCountry = await getRequestCountry();
  return <PackagesFlow initialCountry={initialCountry} />;
}
