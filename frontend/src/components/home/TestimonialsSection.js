export function TestimonialsSection() {
  const testimonials = [
    {
      quote:
        "Werbens cut our content creation time by 80%. We now publish 5x more without hiring. The AI actually sounds like us.",
      author: "Sarah Chen",
      role: "Head of Marketing, TechScale",
      initials: "SC",
      color: "bg-werbens-light-cyan",
    },
    {
      quote:
        "Finally, a tool that understands brand consistency. Our social presence has never been more cohesive.",
      author: "Marcus Johnson",
      role: "Founder, GrowthLab",
      initials: "MJ",
      color: "bg-werbens-dark-cyan",
    },
    {
      quote:
        "We went from one post per week to daily content across 6 platforms. Werbens is a game-changer.",
      author: "Elena Rodriguez",
      role: "Content Director, Studio M",
      initials: "ER",
      color: "bg-werbens-amber",
    },
  ];

  return (
    <section className="py-16 sm:py-20 md:py-28 bg-werbens-mist">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center mb-12 sm:mb-16 animate-fade-in">
          <p className="text-sm font-semibold tracking-widest uppercase text-werbens-light-cyan mb-3">
            Testimonials
          </p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-werbens-dark-cyan mb-3 sm:mb-4">
            Loved by marketing teams
          </h2>
          <p className="text-werbens-text/70 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
            Join thousands of brands using Werbens to scale their content
            without scaling their team.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
          {testimonials.map((t, i) => (
            <blockquote
              key={i}
              className={`relative bg-white rounded-2xl p-6 sm:p-8 shadow-elevated hover-lift transition-all duration-300 animate-fade-in-up stagger-${i + 1}`}
            >
              {/* Decorative quotation mark */}
              <span
                className="absolute top-4 right-6 text-8xl leading-none font-serif text-werbens-light-cyan/20 select-none pointer-events-none"
                aria-hidden="true"
              >
                &ldquo;
              </span>

              {/* Star rating */}
              <div className="flex items-center gap-0.5 mb-5">
                {[...Array(5)].map((_, s) => (
                  <svg
                    key={s}
                    className="w-4 h-4 text-werbens-amber"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>

              {/* Quote text */}
              <p className="relative text-lg text-werbens-text leading-relaxed mb-8 font-light">
                &ldquo;{t.quote}&rdquo;
              </p>

              {/* Author footer */}
              <footer className="flex items-center gap-3 pt-5 border-t border-werbens-mist">
                {/* Avatar circle with initials */}
                <div
                  className={`flex-shrink-0 w-10 h-10 ${t.color} rounded-full flex items-center justify-center`}
                >
                  <span className="text-sm font-bold text-white">
                    {t.initials}
                  </span>
                </div>
                <div>
                  <cite className="not-italic font-semibold text-werbens-dark-cyan block text-sm">
                    {t.author}
                  </cite>
                  <p className="text-xs text-werbens-muted">{t.role}</p>
                </div>
                {/* Verified badge */}
                <div className="ml-auto flex-shrink-0" title="Verified customer">
                  <svg
                    className="w-5 h-5 text-werbens-light-cyan"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
