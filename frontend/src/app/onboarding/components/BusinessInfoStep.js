"use client";

import { useState } from "react";

export function BusinessInfoStep({ initialData, onContinue, onSkip }) {
  const [businessName, setBusinessName] = useState(initialData?.businessName ?? "");
  const [businessType, setBusinessType] = useState(initialData?.businessType ?? "");
  const [website, setWebsite] = useState(initialData?.website ?? "");

  const handleSubmit = (e) => {
    e.preventDefault();
    onContinue({ businessName, businessType, website });
  };

  return (
    <div className="w-full max-w-md animate-fade-in-up">
      <h1 className="text-2xl sm:text-3xl font-bold text-werbens-alt-text mb-2 tracking-tight">
        Tell us about your business
      </h1>
      <p className="text-werbens-alt-text/70 mb-8 text-sm sm:text-base">
        Optional. You can add or update this later.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="businessName" className="block text-sm font-medium text-werbens-alt-text/80 mb-2">
            Business name
          </label>
          <input
            id="businessName"
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="Your brand or company"
            className="w-full px-4 py-3 rounded-xl bg-werbens-slate/50 border border-werbens-steel text-werbens-alt-text placeholder:text-werbens-muted focus:outline-none focus:ring-2 focus:ring-werbens-glow/40 focus:border-werbens-glow transition-all duration-200"
          />
        </div>

        <div>
          <label htmlFor="businessType" className="block text-sm font-medium text-werbens-alt-text/80 mb-2">
            Business type
          </label>
          <select
            id="businessType"
            value={businessType}
            onChange={(e) => setBusinessType(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-werbens-slate/50 border border-werbens-steel text-werbens-alt-text focus:outline-none focus:ring-2 focus:ring-werbens-glow/40 focus:border-werbens-glow transition-all duration-200 appearance-none"
          >
            <option value="">Select type</option>
            <option value="ecommerce">E-commerce</option>
            <option value="saas">SaaS / Software</option>
            <option value="agency">Agency</option>
            <option value="creator">Creator / Influencer</option>
            <option value="local">Local business</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label htmlFor="website" className="block text-sm font-medium text-werbens-alt-text/80 mb-2">
            Website (optional)
          </label>
          <input
            id="website"
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://"
            className="w-full px-4 py-3 rounded-xl bg-werbens-slate/50 border border-werbens-steel text-werbens-alt-text placeholder:text-werbens-muted focus:outline-none focus:ring-2 focus:ring-werbens-glow/40 focus:border-werbens-glow transition-all duration-200"
          />
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-3">
          <button
            type="button"
            onClick={() => onSkip({ businessName, businessType, website })}
            className="flex-1 py-3.5 rounded-2xl glass-dark border border-werbens-steel/50 text-werbens-alt-text/80 font-medium hover:text-werbens-alt-text hover:border-werbens-light-cyan/40 transition-all duration-200 min-h-[48px]"
          >
            Skip
          </button>
          <button
            type="submit"
            className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-werbens-dark-cyan to-werbens-light-cyan text-werbens-alt-text font-semibold glow hover:opacity-90 transition-all duration-200 min-h-[48px] shadow-elevated"
          >
            Continue
          </button>
        </div>
      </form>
    </div>
  );
}
