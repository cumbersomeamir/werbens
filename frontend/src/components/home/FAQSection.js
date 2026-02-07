"use client";

import { useState } from "react";

const faqs = [
  {
    q: "What is Werbens?",
    a: "Werbens is an AI-powered autonomous content creation platform. It generates social media posts, ad copy, emails, blog content, and marketing campaigns that match your brand voice. Connect your platforms, train the AI on your style, and create content at scale.",
  },
  {
    q: "How does brand voice cloning work?",
    a: "You provide samples of your best content—past posts, brand guidelines, or a brief description. Our AI analyzes tone, vocabulary, sentence structure, and formatting. Every new piece it generates follows those patterns, so it sounds like you.",
  },
  {
    q: "Is my data secure?",
    a: "Yes. Werbens is SOC 2 Type II compliant and GDPR ready. We use encrypted connections, role-based access, and never train on your data without permission. Your brand assets and customer information stay protected.",
  },
  {
    q: "Can I use Werbens for SEO content?",
    a: "Absolutely. Werbens generates SEO-optimized blog posts, meta descriptions, and landing page copy. You can specify keywords, target audience, and content length. Integrate with WordPress, HubSpot, or export to your CMS.",
  },
  {
    q: "What platforms does Werbens support?",
    a: "We support Instagram, Facebook, Twitter/X, LinkedIn, YouTube, TikTok, Pinterest, Google My Business, plus email tools like Mailchimp and Klaviyo. More integrations are added regularly.",
  },
];

export function FAQSection() {
  const [open, setOpen] = useState(null);

  return (
    <section className="py-24 bg-werbens-light-cyan/30">
      <div className="mx-auto max-w-3xl px-6">
        <h2 className="text-4xl font-bold text-werbens-dark-cyan text-center mb-4">
          Frequently asked questions
        </h2>
        <p className="text-center text-werbens-text/80 mb-12">
          Everything you need to know about AI content creation and Werbens.
        </p>
        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-werbens-dark-cyan/10 overflow-hidden"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full text-left px-6 py-4 flex justify-between items-center font-semibold text-werbens-dark-cyan hover:bg-werbens-dark-cyan/5 transition"
              >
                {faq.q}
                <span className="text-2xl text-werbens-dark-cyan/60">
                  {open === i ? "−" : "+"}
                </span>
              </button>
              {open === i && (
                <div className="px-6 pb-4">
                  <p className="text-werbens-text/80 leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
