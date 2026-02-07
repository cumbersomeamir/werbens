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
    <div className="w-full max-w-md">
      <h1 className="text-2xl font-bold text-werbens-dark-cyan mb-2">
        Tell us about your business
      </h1>
      <p className="text-werbens-text/80 mb-6">
        Optional. You can add or update this later.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="businessName" className="block text-sm font-medium text-werbens-text mb-1.5">
            Business name
          </label>
          <input
            id="businessName"
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="Your brand or company"
            className="w-full px-4 py-3 rounded-xl border border-werbens-dark-cyan/20 bg-white text-werbens-text placeholder:text-werbens-text/40 focus:outline-none focus:ring-2 focus:ring-werbens-dark-cyan/40"
          />
        </div>

        <div>
          <label htmlFor="businessType" className="block text-sm font-medium text-werbens-text mb-1.5">
            Business type
          </label>
          <select
            id="businessType"
            value={businessType}
            onChange={(e) => setBusinessType(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-werbens-dark-cyan/20 bg-white text-werbens-text focus:outline-none focus:ring-2 focus:ring-werbens-dark-cyan/40"
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
          <label htmlFor="website" className="block text-sm font-medium text-werbens-text mb-1.5">
            Website (optional)
          </label>
          <input
            id="website"
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://"
            className="w-full px-4 py-3 rounded-xl border border-werbens-dark-cyan/20 bg-white text-werbens-text placeholder:text-werbens-text/40 focus:outline-none focus:ring-2 focus:ring-werbens-dark-cyan/40"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => onSkip({ businessName, businessType, website })}
            className="flex-1 py-3 rounded-xl border border-werbens-dark-cyan/20 text-werbens-dark-cyan font-medium hover:bg-werbens-dark-cyan/5 transition"
          >
            Skip
          </button>
          <button
            type="submit"
            className="flex-1 py-3 rounded-xl bg-werbens-dark-cyan text-werbens-alt-text font-medium hover:bg-werbens-dark-cyan/90 transition"
          >
            Continue
          </button>
        </div>
      </form>
    </div>
  );
}
