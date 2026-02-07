import Link from "next/link";

export function CTASection() {
  return (
    <section className="py-24 bg-werbens-dark-cyan text-werbens-alt-text">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-6">
          Ready to create content on autopilot?
        </h2>
        <p className="text-xl text-werbens-alt-text/80 mb-10">
          Join thousands of brands using Werbens. Start free, no credit card
          required. Scale your content without scaling your team.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/onboarding"
            className="px-10 py-4 rounded-2xl bg-werbens-light-cyan text-werbens-text font-semibold text-lg hover:bg-werbens-light-cyan/90 transition hover:scale-105"
          >
            Get started free
          </Link>
          <Link
            href="/login"
            className="px-10 py-4 rounded-2xl border-2 border-werbens-alt-text/30 text-werbens-alt-text font-semibold text-lg hover:bg-werbens-alt-text/10 transition"
          >
            Sign in
          </Link>
        </div>
        <p className="mt-6 text-sm text-werbens-alt-text/60">
          Free plan includes 10 content pieces per month. Upgrade anytime.
        </p>
      </div>
    </section>
  );
}
