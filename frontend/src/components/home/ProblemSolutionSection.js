export function ProblemSolutionSection() {
  return (
    <section className="py-12 sm:py-16 md:py-24 bg-werbens-dark-cyan text-werbens-alt-text">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
          <div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6">
              Content creation shouldn&apos;t be a bottleneck
            </h2>
            <p className="text-werbens-alt-text/80 text-lg leading-relaxed mb-6">
              Most businesses spend 15+ hours weekly on social media, email
              marketing, and ad copy. Manual content creation drains resources,
              creates inconsistencies, and slows growth. Marketing teams are
              stretched thin while quality suffers.
            </p>
            <ul className="space-y-3 text-werbens-alt-text/90">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-werbens-light-cyan" />
                Inconsistent brand voice across channels
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-werbens-light-cyan" />
                Repetitive, time-consuming workflows
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-werbens-light-cyan" />
                Scaling content = scaling headcount
              </li>
            </ul>
          </div>
          <div className="bg-werbens-dark-cyan/50 rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-werbens-light-cyan/20">
            <h3 className="text-2xl font-bold text-werbens-light-cyan mb-4">
              Werbens fixes this
            </h3>
            <p className="text-werbens-alt-text/90 leading-relaxed">
              Our AI content engine learns your brand voice, tone, and style.
              Connect your platforms once—Instagram, Facebook, LinkedIn,
              YouTube—and generate weeks of content in minutes. Maintain
              consistency, scale without hiring, and focus on strategy instead
              of copy-paste.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
