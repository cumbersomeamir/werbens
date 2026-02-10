"use client";

export function PostLayout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-werbens-mist to-werbens-surface">
      <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-16">
        {children}
      </main>
    </div>
  );
}

