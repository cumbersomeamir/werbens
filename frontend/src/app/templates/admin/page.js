import { TemplatesAdminFlow } from "../components/TemplatesAdminFlow";

export const metadata = {
  title: "Admin — Manage Templates | Werbens",
  description: "Admin dashboard for adding, categorising, and sorting content templates.",
};

export default function TemplatesAdminPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-werbens-mist to-werbens-surface">
      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-14">
        <TemplatesAdminFlow />
      </main>
    </div>
  );
}
