import Link from "next/link";

export function HeroSection() {
  return (
    <section
      className="relative min-h-[90vh] flex flex-col justify-center overflow-hidden"
      aria-labelledby="hero-heading"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-werbens-light-cyan via-werbens-light-cyan/80 to-werbens-dark-cyan/20" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(127,231,220,0.6),transparent)]" />
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-werbens-dark-cyan/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 left-0 w-72 h-72 bg-werbens-dark-cyan/5 rounded-full blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-6 py-32 text-center">
        <p className="text-werbens-dark-cyan/80 font-medium uppercase tracking-[0.2em] text-sm mb-6">
          AI-Powered Content Creation Platform
        </p>
        <h1
          id="hero-heading"
          className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight text-werbens-dark-cyan leading-[1.1]"
        >
          Create content.
          <br />
          <span className="text-werbens-dark-cyan/70">Automatically.</span>
        </h1>
        <p className="mt-8 text-xl sm:text-2xl text-werbens-text/80 max-w-2xl mx-auto leading-relaxed">
          Werbens is the autonomous content creation platform that generates
          brand-consistent social media posts, ad copy, emails, and marketing
          campaigns at scale. Save hours every week with AI that understands
          your voice.
        </p>
        <div className="mt-12 flex flex-wrap justify-center gap-4">
          <Link
            href="/onboarding"
            className="group px-8 py-4 rounded-2xl bg-werbens-dark-cyan text-werbens-alt-text font-semibold text-lg hover:bg-werbens-dark-cyan/90 transition-all hover:scale-105 shadow-lg shadow-werbens-dark-cyan/25"
          >
            Start creating free
          </Link>
          <Link
            href="/login"
            className="px-8 py-4 rounded-2xl border-2 border-werbens-dark-cyan/30 text-werbens-dark-cyan font-semibold text-lg hover:bg-werbens-dark-cyan/5 hover:border-werbens-dark-cyan/50 transition-all"
          >
            Sign in
          </Link>
        </div>
      </div>
    </section>
  );
}
