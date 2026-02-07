"use client";

export function CreateLayout({ children }) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  );
}
