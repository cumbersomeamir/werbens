"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingLayout } from "./OnboardingLayout";
import { PlatformStep } from "./PlatformStep";
import { BusinessInfoStep } from "./BusinessInfoStep";
import { GoalsStep } from "./GoalsStep";
import { useCurrentUser } from "./useCurrentUser";

const STEPS = ["platforms", "business", "goals"];
const TOTAL_STEPS = 3;
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export function OnboardingFlow() {
  const router = useRouter();
  const { userId, username } = useCurrentUser();
  const [stepIndex, setStepIndex] = useState(0);
  const [platformError, setPlatformError] = useState("");
  const [saveError, setSaveError] = useState("");

  const [data, setData] = useState({
    platforms: [],
    business: null,
    goals: [],
  });

  const currentStep = STEPS[stepIndex];

  const saveToBackend = async (payload) => {
    setSaveError("");
    try {
      const { saveOnboarding } = await import("@/api/services/onboardingService.js");
      await saveOnboarding({
        userId,
        username,
        ...payload,
      });
    } catch (err) {
      if (err.message?.includes("timeout") || err.name === "AbortError") {
        setSaveError("Request timed out. Is the backend running?");
      } else if (err.data?.skipped) {
        // Database unavailable but skipped is OK
        return;
      } else {
        setSaveError(err.message || "Could not save. Please try again.");
      }
      throw err;
    }
  };

  const togglePlatform = (id) => {
    setPlatformError("");
    setData((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(id)
        ? prev.platforms.filter((p) => p !== id)
        : [...prev.platforms, id],
    }));
  };

  const handlePlatformContinue = () => {
    if (data.platforms.length < 1) {
      setPlatformError("Connect at least one platform to continue.");
      return;
    }
    setStepIndex(1);
  };

  const handleBusinessContinue = (businessData) => {
    setData((prev) => ({ ...prev, business: businessData }));
    setStepIndex(2);
  };

  const handleBusinessSkip = (businessData) => {
    setData((prev) => ({ ...prev, business: businessData }));
    setStepIndex(2);
  };

  const handleGoalsComplete = async (goals) => {
    const payload = { ...data, goals };
    setData((prev) => ({ ...prev, goals }));
    try {
      await saveToBackend(payload);
      router.push("/");
    } catch {
      // saveError already set
    }
  };

  const handleGoalsSkip = async (goals) => {
    const payload = { ...data, goals };
    setData((prev) => ({ ...prev, goals }));
    try {
      await saveToBackend(payload);
      router.push("/");
    } catch {
      // saveError already set
    }
  };

  return (
    <OnboardingLayout step={stepIndex + 1} totalSteps={TOTAL_STEPS}>
      {saveError && (
        <p className="mb-4 text-sm text-red-600 text-center">{saveError}</p>
      )}
      {currentStep === "platforms" && (
        <PlatformStep
          connectedPlatforms={data.platforms}
          onToggle={togglePlatform}
          onContinue={handlePlatformContinue}
          error={platformError}
        />
      )}

      {currentStep === "business" && (
        <BusinessInfoStep
          initialData={data.business}
          onContinue={handleBusinessContinue}
          onSkip={handleBusinessSkip}
        />
      )}

      {currentStep === "goals" && (
        <GoalsStep
          initialGoals={data.goals}
          onComplete={handleGoalsComplete}
          onSkip={handleGoalsSkip}
        />
      )}
    </OnboardingLayout>
  );
}
