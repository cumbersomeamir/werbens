import { PostLayout } from "../components/PostLayout";

export const metadata = {
  title: "Automate Posts | Werbens — Automated Social Content",
  description:
    "Set up automated posting rules to maintain consistent social media presence without manual effort.",
};

export default function AutomatePostPage() {
  return (
    <PostLayout>
      <div className="mb-8 sm:mb-10">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-werbens-text">
          Automate{" "}
          <span className="gradient-text">posting</span>
        </h1>
        <p className="mt-3 text-sm sm:text-base text-werbens-muted max-w-2xl">
          Set up automated posting rules to maintain consistent social media presence.
        </p>
      </div>

      <div className="rounded-2xl bg-white/90 border border-werbens-steel/30 shadow-elevated p-4 sm:p-6 lg:p-7">
        <p className="text-sm text-werbens-muted">
          Automated posting functionality coming soon.
        </p>
      </div>
    </PostLayout>
  );
}
