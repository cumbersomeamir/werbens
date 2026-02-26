import { Suspense } from "react";
import { IdeationEngineFlow } from "./components/IdeationEngineFlow";

export const metadata = {
  title: "Ideation Engine | Werbens",
  description:
    "Track YouTube channels, discover relevant creators, stay updated with latest uploads, and compare performance signals.",
};

export default function IdeationEnginePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-b from-werbens-mist to-werbens-surface flex items-center justify-center text-werbens-muted">
          Loading ideation engine...
        </div>
      }
    >
      <IdeationEngineFlow />
    </Suspense>
  );
}
