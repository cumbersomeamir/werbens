import { Suspense } from "react";
import { ReportsFlow } from "./components/ReportsFlow";

export const metadata = {
  title: "Reports | Werbens",
  description:
    "Analyse YouTube posting time versus views and engagement, with downloadable Excel report.",
};

export default function ReportsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-b from-werbens-mist to-werbens-surface flex items-center justify-center text-werbens-muted">
          Loading reports...
        </div>
      }
    >
      <ReportsFlow />
    </Suspense>
  );
}
