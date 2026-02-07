export function TestimonialsSection() {
  const testimonials = [
    {
      quote:
        "Werbens cut our content creation time by 80%. We now publish 5x more without hiring. The AI actually sounds like us.",
      author: "Sarah Chen",
      role: "Head of Marketing, TechScale",
    },
    {
      quote:
        "Finally, a tool that understands brand consistency. Our social presence has never been more cohesive.",
      author: "Marcus Johnson",
      role: "Founder, GrowthLab",
    },
    {
      quote:
        "We went from one post per week to daily content across 6 platforms. Werbens is a game-changer.",
      author: "Elena Rodriguez",
      role: "Content Director, Studio M",
    },
  ];

  return (
    <section className="py-12 sm:py-16 md:py-24 bg-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-werbens-dark-cyan text-center mb-3 sm:mb-4">
          Loved by marketing teams
        </h2>
        <p className="text-center text-werbens-text/70 max-w-xl mx-auto mb-10 sm:mb-16 text-sm sm:text-base">
          Join thousands of brands using Werbens to scale their content
          without scaling their team.
        </p>
        <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
          {testimonials.map((t, i) => (
            <blockquote
              key={i}
              className="bg-werbens-light-cyan/30 rounded-xl sm:rounded-2xl p-6 sm:p-8 border border-werbens-dark-cyan/10"
            >
              <p className="text-werbens-text leading-relaxed mb-6 italic">
                &ldquo;{t.quote}&rdquo;
              </p>
              <footer>
                <cite className="not-italic font-semibold text-werbens-dark-cyan">
                  {t.author}
                </cite>
                <p className="text-sm text-werbens-text/60">{t.role}</p>
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
