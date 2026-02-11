import { PostLayout } from "../components/PostLayout";

export const metadata = {
  title: "Schedule Posts | Werbens — Plan Social Content",
  description:
    "Schedule your social media posts for optimal timing. Plan ahead and maintain consistent presence.",
};

export default function SchedulePostPage() {
  return (
    <PostLayout>
      <div className="mb-8 sm:mb-10">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-werbens-text">
          Schedule{" "}
          <span className="gradient-text">posts</span>
        </h1>
        <p className="mt-3 text-sm sm:text-base text-werbens-muted max-w-2xl">
          Plan your content ahead of time. Schedule posts for optimal engagement times.
        </p>
      </div>

      <div className="rounded-2xl bg-white/90 border border-werbens-steel/30 shadow-elevated p-4 sm:p-6 lg:p-7">
        <p className="text-sm text-werbens-muted">
          Schedule posting functionality coming soon.
        </p>
      </div>
    </PostLayout>
  );
}
