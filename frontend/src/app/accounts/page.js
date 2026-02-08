import { Suspense } from "react";
import { AccountsFlow } from "./components/AccountsFlow";

export default function AccountsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-b from-werbens-mist to-werbens-surface flex items-center justify-center text-werbens-muted">Loading…</div>}>
      <AccountsFlow />
    </Suspense>
  );
}
