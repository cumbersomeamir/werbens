import { PackagesFlow } from "./components/PackagesFlow";
import { getRequestCountry } from "@/lib/requestCountry";

export const metadata = {
  title: "Packages | Werbens",
  description:
    "Website content packages for ready-to-post reels, brand visuals, revisions, and social ad management.",
};

export default async function PackagesPage() {
  const initialCountry = await getRequestCountry();
  return <PackagesFlow initialCountry={initialCountry} />;
}
