import Link from "next/link";

export function HeroSection() {
  return (
    <section
      className="noise relative min-h-[90vh] flex flex-col justify-center overflow-hidden bg-werbens-midnight"
      aria-labelledby="hero-heading"
    >
      {/* Layered gradient overlays for depth */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(127,231,220,0.15),transparent)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_80%_50%,rgba(0,139,139,0.12),transparent)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_20%_80%,rgba(0,139,139,0.08),transparent)]" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-werbens-midnight/80" />

      {/* Animated floating orbs */}
      <div className="absolute top-[15%] right-[10%] w-72 h-72 rounded-full bg-werbens-light-cyan/8 blur-3xl animate-float" />
      <div className="absolute bottom-[20%] left-[5%] w-96 h-96 rounded-full bg-werbens-dark-cyan/10 blur-3xl animate-float-slow" />
      <div className="absolute top-[50%] left-[40%] w-56 h-56 rounded-full bg-werbens-light-cyan/5 blur-2xl animate-float-slow" />
      <div className="absolute top-[10%] left-[20%] w-40 h-40 rounded-full bg-werbens-dark-cyan/8 blur-2xl animate-float" />

      {/* Content */}
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 py-24 sm:py-32 md:py-40 text-center">
        <p className="animate-fade-in-up stagger-1 text-werbens-light-cyan/70 font-medium uppercase tracking-[0.2em] sm:tracking-[0.25em] text-xs sm:text-sm mb-6 sm:mb-8">
          AI-Powered Content Creation Platform
        </p>

        <h1
          id="hero-heading"
          className="animate-fade-in-up stagger-2 text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.05]"
        >
          <span className="gradient-text-light">Create content.</span>
          <br />
          <span className="text-werbens-muted">Automatically.</span>
        </h1>

        <p className="animate-fade-in-up stagger-3 mt-8 sm:mt-10 text-lg sm:text-xl md:text-2xl text-werbens-cloud/70 max-w-2xl mx-auto leading-relaxed px-1">
          Werbens is the autonomous content creation platform that generates
          brand-consistent social media posts, ad copy, emails, and marketing
          campaigns at scale. Save hours every week with AI that understands
          your voice.
        </p>

        <div className="animate-fade-in-up stagger-4 mt-10 sm:mt-14 flex flex-col sm:flex-row flex-wrap justify-center gap-4 sm:gap-5">
          <Link
            href="/onboarding"
            className="group relative px-8 sm:px-10 py-4 sm:py-4.5 rounded-2xl bg-werbens-light-cyan text-werbens-midnight font-semibold text-base sm:text-lg transition-all duration-300 hover:scale-105 glow shadow-elevated min-h-[48px] flex items-center justify-center hover:animate-pulse-glow"
          >
            Start creating free
          </Link>
          <Link
            href="/login"
            className="glass-dark px-8 sm:px-10 py-4 sm:py-4.5 rounded-2xl border border-werbens-light-cyan/20 text-werbens-cloud font-semibold text-base sm:text-lg hover:border-werbens-light-cyan/40 hover:bg-werbens-light-cyan/5 transition-all duration-300 min-h-[48px] flex items-center justify-center"
          >
            Sign in
          </Link>
        </div>
      </div>
    </section>
  );
}
