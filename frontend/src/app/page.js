import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-werbens-light-cyan">
      <div className="mx-auto max-w-7xl px-6 py-24">
        <h1 className="text-5xl font-bold text-werbens-dark-cyan">
          Werbens
        </h1>
        <p className="mt-4 text-xl text-werbens-text">
          Create content for your business or product — totally autonomously.
        </p>
        <Link
          href="/login"
          className="mt-8 inline-block px-6 py-3 rounded-xl bg-werbens-dark-cyan text-werbens-alt-text font-medium hover:bg-werbens-dark-cyan/90 transition"
        >
          Sign in
        </Link>
      </div>
    </main>
  );
}
