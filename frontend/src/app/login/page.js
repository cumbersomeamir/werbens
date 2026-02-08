"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [otpError, setOtpError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("phone"); // "phone" | "otp"
  const confirmationRef = useRef(null);
  const recaptchaRef = useRef(null);

  const handleGoogleLogin = () => {
    signIn("google", { callbackUrl: "/" });
  };

  const ensureRecaptcha = () => {
    if (!auth) return null;
    if (recaptchaRef.current) return recaptchaRef.current;
    try {
      const verifier = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        { size: "invisible" }
      );
      recaptchaRef.current = verifier;
      return verifier;
    } catch (err) {
      console.error("Recaptcha error:", err);
      return null;
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setPhoneError("");
    const trimmed = phone.replace(/\s/g, "");
    if (!trimmed) {
      setPhoneError("Phone number is required");
      return;
    }
    if (!/^\+?[\d\s-]{10,}$/.test(trimmed)) {
      setPhoneError("Use format: +1 234 567 8900");
      return;
    }
    const phoneWithPlus = trimmed.startsWith("+") ? trimmed : `+${trimmed}`;

    if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
      setPhoneError("Firebase not configured. See docs/FIREBASE_SETUP.md");
      return;
    }

    setLoading(true);
    try {
      const verifier = ensureRecaptcha();
      if (!verifier) throw new Error("Could not init reCAPTCHA");
      const conf = await signInWithPhoneNumber(auth, phoneWithPlus, verifier);
      confirmationRef.current = conf;
      setStep("otp");
      setOtp("");
    } catch (err) {
      setPhoneError(err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setOtpError("");
    if (!confirmationRef.current) {
      setOtpError("Session expired. Please try again.");
      return;
    }
    if (!otp.trim()) {
      setOtpError("Enter the 6-digit code");
      return;
    }

    setLoading(true);
    try {
      await confirmationRef.current.confirm(otp.trim());
      router.push("/");
    } catch (err) {
      setOtpError(err.message || "Invalid code");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep("phone");
    setOtp("");
    setOtpError("");
    confirmationRef.current = null;
  };

  const handleSocialLogin = (provider) => {
    if (provider === "Google") {
      handleGoogleLogin();
    } else {
      console.log(`${provider} login – coming soon`);
    }
  };

  return (
    <div className="min-h-screen flex bg-werbens-surface">
      <div id="recaptcha-container" />

      {/* ── Left panel: brand story ── */}
      <div className="hidden lg:flex lg:w-1/2 bg-werbens-midnight noise text-werbens-alt-text p-16 flex-col justify-between relative overflow-hidden">
        {/* Floating decorative orbs */}
        <div className="absolute top-20 left-16 w-64 h-64 rounded-full bg-werbens-dark-cyan/15 blur-3xl animate-float pointer-events-none" />
        <div className="absolute bottom-32 right-12 w-80 h-80 rounded-full bg-werbens-light-cyan/10 blur-3xl animate-float-slow pointer-events-none" />
        <div className="absolute top-1/2 left-1/3 w-40 h-40 rounded-full bg-werbens-glow/10 blur-2xl animate-float pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10 animate-fade-in">
          <h2 className="text-3xl font-bold tracking-tight gradient-text-light">
            Werbens
          </h2>
        </div>

        {/* Headline & features */}
        <div className="relative z-10 animate-fade-in-up">
          <h3 className="text-4xl xl:text-5xl font-bold leading-tight mb-8">
            <span className="gradient-text-light">Create content</span>
            <br />
            for your business.
            <br />
            <span className="text-werbens-light-cyan/90">Totally autonomously.</span>
          </h3>
          <ul className="space-y-5 text-lg text-werbens-alt-text/80">
            <li className="flex items-center gap-4 stagger-1 animate-fade-in-up">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-werbens-light-cyan/10 border border-werbens-light-cyan/20">
                <span className="w-2 h-2 rounded-full bg-werbens-light-cyan animate-pulse-glow" />
              </span>
              AI-powered copy, images, and campaigns
            </li>
            <li className="flex items-center gap-4 stagger-2 animate-fade-in-up">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-werbens-light-cyan/10 border border-werbens-light-cyan/20">
                <span className="w-2 h-2 rounded-full bg-werbens-light-cyan animate-pulse-glow" />
              </span>
              Brand-consistent content in minutes
            </li>
            <li className="flex items-center gap-4 stagger-3 animate-fade-in-up">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-werbens-light-cyan/10 border border-werbens-light-cyan/20">
                <span className="w-2 h-2 rounded-full bg-werbens-light-cyan animate-pulse-glow" />
              </span>
              Scale without scaling your team
            </li>
          </ul>
        </div>

        {/* Footer note */}
        <p className="relative z-10 text-sm text-werbens-alt-text/50 animate-fade-in">
          Join businesses that ship content on autopilot.
        </p>
      </div>

      {/* ── Right panel: login form ── */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 bg-werbens-surface min-h-screen">
        <div className="w-full max-w-md">
          {/* Mobile header */}
          <div className="lg:hidden text-center mb-10 animate-fade-in-down">
            <h1 className="text-3xl font-bold gradient-text tracking-tight">
              Werbens
            </h1>
            <p className="text-werbens-muted mt-2 text-sm">
              Content for your business, autonomously.
            </p>
          </div>

          {/* Form card */}
          <div className="bg-white rounded-2xl shadow-elevated-lg p-6 sm:p-8 border border-werbens-steel/30 animate-scale-in">
            {/* Step header with transition */}
            <div
              key={step}
              className="animate-fade-in"
            >
              <h2 className="text-xl font-semibold text-werbens-text mb-1">
                {step === "phone" ? "Welcome back" : "Enter verification code"}
              </h2>
              <p className="text-werbens-muted mb-6 text-sm">
                {step === "phone"
                  ? "Sign in to continue creating"
                  : `We sent a code to ${phone}`}
              </p>
            </div>

            {/* Phone step */}
            {step === "phone" ? (
              <form onSubmit={handleSendOtp} className="space-y-5 animate-fade-in" key="phone-form">
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-werbens-text mb-2"
                  >
                    Phone number <span className="text-werbens-amber">*</span>
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      setPhoneError("");
                    }}
                    placeholder="+1 234 567 8900"
                    className="w-full px-4 py-3 rounded-xl border border-werbens-steel/40 bg-werbens-surface/50 text-werbens-text placeholder:text-werbens-muted/60 focus:outline-none focus:border-werbens-dark-cyan focus:ring-2 focus:ring-werbens-dark-cyan/20 glow-sm transition-all duration-200"
                  />
                  {phoneError && (
                    <p className="mt-2 text-sm text-red-500 flex items-center gap-1.5 animate-fade-in">
                      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                      </svg>
                      {phoneError}
                    </p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-werbens-dark-cyan to-werbens-dark-cyan/85 text-werbens-alt-text font-medium hover:glow hover:shadow-elevated transition-all duration-200 focus:outline-none focus-ring disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Sending...
                    </>
                  ) : (
                    "Continue with phone"
                  )}
                </button>
              </form>
            ) : (
              /* OTP step */
              <form onSubmit={handleVerifyOtp} className="space-y-5 animate-fade-in-up" key="otp-form">
                <div>
                  <label
                    htmlFor="otp"
                    className="block text-sm font-medium text-werbens-text mb-2"
                  >
                    Verification code
                  </label>
                  <input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => {
                      setOtp(e.target.value.replace(/\D/g, ""));
                      setOtpError("");
                    }}
                    placeholder="000000"
                    className="w-full px-4 py-3.5 rounded-xl border border-werbens-steel/40 bg-werbens-surface/50 text-werbens-text placeholder:text-werbens-muted/40 focus:outline-none focus:border-werbens-dark-cyan focus:ring-2 focus:ring-werbens-dark-cyan/20 glow-sm transition-all duration-200 text-center text-2xl tracking-[0.4em] font-mono"
                  />
                  {otpError && (
                    <p className="mt-2 text-sm text-red-500 flex items-center gap-1.5 animate-fade-in">
                      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                      </svg>
                      {otpError}
                    </p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={loading || otp.length < 6}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-werbens-dark-cyan to-werbens-dark-cyan/85 text-werbens-alt-text font-medium hover:glow hover:shadow-elevated transition-all duration-200 focus:outline-none focus-ring disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Verifying...
                    </>
                  ) : (
                    "Verify"
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleBack}
                  className="w-full text-sm text-werbens-dark-cyan hover:text-werbens-dark-cyan/80 font-medium transition-colors duration-200 flex items-center justify-center gap-1.5 py-1"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                  </svg>
                  Change number
                </button>
              </form>
            )}

            {/* Refined divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-werbens-steel/25" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-4 bg-white text-xs font-medium uppercase tracking-wider text-werbens-muted">
                  or continue with
                </span>
              </div>
            </div>

            {/* Social login buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleSocialLogin("Apple")}
                className="flex items-center justify-center gap-2.5 py-3 rounded-xl border border-werbens-steel/30 bg-white text-werbens-text font-medium hover-lift hover:border-werbens-steel/50 hover:shadow-elevated focus:outline-none focus-ring transition-all duration-200 min-h-[48px]"
              >
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden
                >
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                </svg>
                Apple
              </button>
              <button
                type="button"
                onClick={() => handleSocialLogin("Google")}
                className="flex items-center justify-center gap-2.5 py-3 rounded-xl border border-werbens-steel/30 bg-white text-werbens-text font-medium hover-lift hover:border-werbens-steel/50 hover:shadow-elevated focus:outline-none focus-ring transition-all duration-200 min-h-[48px]"
              >
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google
              </button>
            </div>
          </div>

          {/* Skip link */}
          <p className="mt-8 text-center animate-fade-in">
            <Link
              href="/"
              className="text-sm text-werbens-muted hover:text-werbens-dark-cyan font-medium transition-colors duration-200"
            >
              Skip for now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
