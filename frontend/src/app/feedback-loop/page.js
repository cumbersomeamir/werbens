import { Suspense } from "react";
import { FeedbackLoopFlow } from "./components/FeedbackLoopFlow";

export const metadata = {
  title: "Feedback Loop | Werbens",
  description:
    "Autonomous X feedback loop with in-loop generation, scheduling, posting, and performance measurement.",
};

export default function FeedbackLoopPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-b from-werbens-mist to-werbens-surface flex items-center justify-center text-werbens-muted">
          Loading...
        </div>
      }
    >
      <FeedbackLoopFlow />
    </Suspense>
  );
}
