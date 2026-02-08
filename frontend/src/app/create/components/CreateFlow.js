"use client";

import { CreateLayout } from "./CreateLayout";
import { CreateChat } from "./CreateChat";

export function CreateFlow() {
  return (
    <CreateLayout>
      <section className="px-4 sm:px-6 pt-8 sm:pt-10 pb-4 animate-fade-in-up">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
            <span className="gradient-text">Create</span>
          </h1>
          <p className="mt-2 text-sm sm:text-base text-werbens-alt-text leading-relaxed max-w-lg">
            On-demand content generation. Type, attach images, and generate.
          </p>
        </div>
      </section>
      <CreateChat />
    </CreateLayout>
  );
}
