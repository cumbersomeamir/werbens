"use client";

import { CreateLayout } from "./CreateLayout";
import { CreateChat } from "./CreateChat";

export function CreateFlow() {
  return (
    <CreateLayout>
      <section className="px-6 pt-8 pb-4">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-2xl md:text-3xl font-bold text-werbens-dark-cyan">
            Create
          </h1>
          <p className="mt-1 text-werbens-text/80">
            On-demand content generation. Type, attach images, and generate.
          </p>
        </div>
      </section>
      <CreateChat />
    </CreateLayout>
  );
}
