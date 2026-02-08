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

function ChevronIcon({ isOpen }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`flex-shrink-0 text-werbens-dark-cyan/50 transition-transform duration-300 ease-out ${
        isOpen ? "rotate-180" : "rotate-0"
      }`}
    >
      <path
        d="M5 7.5L10 12.5L15 7.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function FAQSection() {
  const [open, setOpen] = useState(null);

  return (
    <section className="py-16 sm:py-20 md:py-28 bg-gradient-to-b from-werbens-surface to-werbens-surface/80">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-werbens-dark-cyan text-center mb-3 sm:mb-4 animate-fade-in">
          Frequently asked questions
        </h2>
        <p className="text-center text-werbens-text/60 mb-10 sm:mb-14 text-sm sm:text-base animate-fade-in">
          Everything you need to know about AI content creation and Werbens.
        </p>
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className={`bg-white rounded-2xl shadow-elevated transition-all duration-300 ${
                open === i ? "ring-1 ring-werbens-dark-cyan/10" : ""
              }`}
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full text-left px-5 sm:px-7 py-5 sm:py-6 flex justify-between items-center gap-4 font-semibold text-werbens-dark-cyan hover:text-werbens-dark-cyan/80 transition-colors duration-200 text-[15px] sm:text-base"
              >
                <span>{faq.q}</span>
                <ChevronIcon isOpen={open === i} />
              </button>
              <div
                className="grid transition-all duration-300 ease-out"
                style={{
                  gridTemplateRows: open === i ? "1fr" : "0fr",
                }}
              >
                <div className="overflow-hidden">
                  <p className="px-5 sm:px-7 pb-5 sm:pb-6 text-werbens-text/70 leading-relaxed text-[15px]">
                    {faq.a}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
