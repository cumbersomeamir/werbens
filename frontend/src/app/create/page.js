import { CreateFlow } from "./components/CreateFlow";

export const metadata = {
  title: "Create | Werbens — On-Demand Content Generation",
  description:
    "Generate content on demand. Type your prompt, attach images, and create social posts, ad copy, or email content in seconds.",
  keywords:
    "AI content creation, on-demand content, content generator, social media content, ad copy generator",
};

export default function CreatePage() {
  return <CreateFlow />;
}
