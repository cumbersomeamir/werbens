import Link from "next/link";
import { TemplatesAdminFlow } from "../components/TemplatesAdminFlow";

export const metadata = {
  title: "Admin — Manage Templates | Werbens",
  description: "Admin dashboard for adding, categorising, and sorting content templates.",
};

export default function TemplatesAdminPage() {
  return (
    <div className="min-h-screen bg-werbens-light-cyan/20">
      <header className="border-b border-werbens-dark-cyan/10 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-lg font-semibold text-werbens-dark-cyan">
            Werbens Admin
          </Link>
          <nav className="flex gap-4">
            <Link
              href="/templates"
              className="text-sm text-werbens-text/70 hover:text-werbens-dark-cyan"
            >
              ← Back to templates
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">
        <TemplatesAdminFlow />
      </main>
    </div>
  );
}
