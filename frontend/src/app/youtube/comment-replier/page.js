import { Suspense } from "react";
import { YoutubeCommentReplierFlow } from "./components/YoutubeCommentReplierFlow";

export const metadata = {
  title: "YouTube Comment Replier | Werbens",
  description:
    "Auto-reply to YouTube comments with LLM, review comment data, and track posted replies.",
};

export default function YoutubeCommentReplierPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-b from-werbens-mist to-werbens-surface flex items-center justify-center text-werbens-muted">
          Loading...
        </div>
      }
    >
      <YoutubeCommentReplierFlow />
    </Suspense>
  );
}
