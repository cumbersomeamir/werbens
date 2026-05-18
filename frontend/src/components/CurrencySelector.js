"use client";

import { useEffect, useMemo, useState } from "react";

export const COUNTRY_OPTIONS = [
  { code: "US", label: "United States", currency: "USD", symbol: "$" },
  { code: "GB", label: "United Kingdom", currency: "GBP", symbol: "£" },
  { code: "IN", label: "India", currency: "INR", symbol: "₹" },
];

const STORAGE_KEY = "werbens-price-country";

export function normalizeCountry(value) {
  const country = String(value || "").trim().toUpperCase();
  if (country === "UK") return "GB";
  return COUNTRY_OPTIONS.some((option) => option.code === country) ? country : "US";
}

function getBrowserCountry() {
  if (typeof navigator === "undefined") return "";
  const locales = [navigator.language, ...(navigator.languages || [])].filter(Boolean);
  for (const locale of locales) {
    const match = String(locale).match(/-([A-Za-z]{2})\b/);
    if (match) return match[1];
  }
  return "";
}

export function usePriceCountry(initialCountry = "") {
  const [country, setCountry] = useState(() => normalizeCountry(initialCountry));

  useEffect(() => {
    const savedCountry = window.localStorage.getItem(STORAGE_KEY);
    if (savedCountry) {
      setCountry(normalizeCountry(savedCountry));
      return;
    }

    const browserCountry = getBrowserCountry();
    if (!initialCountry && browserCountry) {
      setCountry(normalizeCountry(browserCountry));
    }
  }, [initialCountry]);

  function updateCountry(nextCountry) {
    const normalized = normalizeCountry(nextCountry);
    setCountry(normalized);
    window.localStorage.setItem(STORAGE_KEY, normalized);
  }

  const option = useMemo(
    () => COUNTRY_OPTIONS.find((item) => item.code === country) || COUNTRY_OPTIONS[0],
    [country]
  );

  return { country, option, updateCountry };
}

export function formatPrice(priceMap, country) {
  const option = COUNTRY_OPTIONS.find((item) => item.code === normalizeCountry(country)) || COUNTRY_OPTIONS[0];
  const amount = priceMap?.[option.code] ?? priceMap?.US ?? 0;
  return `${option.symbol}${Number(amount).toLocaleString("en-US")}`;
}

export function CurrencySelector({ country, onCountryChange }) {
  const option = COUNTRY_OPTIONS.find((item) => item.code === normalizeCountry(country)) || COUNTRY_OPTIONS[0];

  return (
    <div className="mx-auto mb-8 flex max-w-6xl flex-col items-start justify-between gap-3 px-4 sm:mb-10 sm:flex-row sm:items-center sm:px-6">
      <div>
        <p className="text-sm font-semibold text-werbens-text">Showing prices in {option.currency}</p>
        <p className="text-xs text-werbens-muted">Auto-detected. Change it if your country is different.</p>
      </div>
      <label className="flex w-full items-center gap-3 sm:w-auto">
        <span className="text-sm font-semibold text-werbens-dark-cyan">Country</span>
        <select
          value={option.code}
          onChange={(event) => onCountryChange(event.target.value)}
          className="min-h-[44px] w-full rounded-xl border border-werbens-steel/40 bg-white px-4 py-2 text-sm font-semibold text-werbens-text shadow-sm outline-none transition focus:border-werbens-dark-cyan focus:ring-2 focus:ring-werbens-light-cyan/40 sm:w-52"
        >
          {COUNTRY_OPTIONS.map((item) => (
            <option key={item.code} value={item.code}>
              {item.label} ({item.currency})
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
