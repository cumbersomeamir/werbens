"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { OnboardingLayout } from "./OnboardingLayout";
import { useCurrentUser } from "./useCurrentUser";
import { Step1Identity } from "./steps/Step1Identity";
import { Step2ContentGoal } from "./steps/Step2ContentGoal";
import { Step3Platforms } from "./steps/Step3Platforms";
import { Step4VisualStyle } from "./steps/Step4VisualStyle";
import { Step5HumanPresence } from "./steps/Step5HumanPresence";
import { Step6VoiceDna } from "./steps/Step6VoiceDna";
import { saveOnboarding } from "@/api/services/onboardingService.js";

const TOTAL_STEPS = 6;

const defaultData = {
  primaryRole: "",
  industries: [],
  audienceTypes: [],
  primaryGoal: "",
  secondaryGoal: "",
  priorityPlatform: "instagram",
  postingCadence: "medium",
  visualVibes: [],
  visualTheme: "",
  complexityPreference: 50,
  showPeople: true,
  faceUsage: "noFaces",
  framing: "mixed",
  tone: "professional",
  emojiLevel: "few",
  ctaStyle: "soft",
  formality: 50,
};

export function OnboardingFlow() {
  const router = useRouter();
  const { userId, username, loading: userLoading } = useCurrentUser();
  const [stepIndex, setStepIndex] = useState(0);
  const [data, setData] = useState(defaultData);
  const [saveError, setSaveError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const step = stepIndex + 1;
  const onBack = useCallback(() => {
    setSaveError("");
    if (stepIndex > 0) setStepIndex((i) => i - 1);
  }, [stepIndex]);

  const onNext = useCallback(() => {
    setSaveError("");
    if (stepIndex < TOTAL_STEPS - 1) setStepIndex((i) => i + 1);
  }, [stepIndex]);

  const handleSubmit = useCallback(
    async (finalData) => {
      if (!userId) {
        setSaveError("Sign in to save onboarding.");
        return;
      }
      setSubmitting(true);
      setSaveError("");
      try {
        const payload = {
          userId,
          username: username || undefined,
          primaryRole: finalData.primaryRole || undefined,
          industries: finalData.industries,
          audienceTypes: finalData.audienceTypes,
          primaryGoal: finalData.primaryGoal || undefined,
          secondaryGoal: finalData.secondaryGoal || undefined,
          priorityPlatform: finalData.priorityPlatform || undefined,
          postingCadence: finalData.postingCadence || undefined,
          visualVibes: finalData.visualVibes,
          visualTheme: finalData.visualTheme || undefined,
          complexityPreference: finalData.complexityPreference,
          showPeople: finalData.showPeople,
          faceUsage: finalData.showPeople ? (finalData.faceUsage || "noFaces") : "noFaces",
          framing: finalData.framing || undefined,
          tone: finalData.tone || undefined,
          emojiLevel: finalData.emojiLevel || undefined,
          ctaStyle: finalData.ctaStyle || undefined,
          formality: finalData.formality,
          version: 1,
          source: "onboarding_v1",
        };
        await saveOnboarding(payload);
        router.push("/automatic");
      } catch (err) {
        const msg = err?.data?.error || err?.message || "Could not save. Please try again.";
        setSaveError(msg);
      } finally {
        setSubmitting(false);
      }
    },
    [userId, username, router]
  );

  if (userLoading) {
    return (
      <OnboardingLayout step={1} totalSteps={TOTAL_STEPS}>
        <p className="text-werbens-alt-text/60 text-center">Loading…</p>
      </OnboardingLayout>
    );
  }

  return (
    <OnboardingLayout step={step} totalSteps={TOTAL_STEPS}>
      {saveError && (
        <p className="mb-4 text-sm text-red-400 text-center">{saveError}</p>
      )}

      {stepIndex === 0 && (
        <Step1Identity data={data} setData={setData} onNext={onNext} onBack={onBack} />
      )}
      {stepIndex === 1 && (
        <Step2ContentGoal data={data} setData={setData} onNext={onNext} onBack={onBack} />
      )}
      {stepIndex === 2 && (
        <Step3Platforms data={data} setData={setData} onNext={onNext} onBack={onBack} userId={userId} />
      )}
      {stepIndex === 3 && (
        <Step4VisualStyle data={data} setData={setData} onNext={onNext} onBack={onBack} />
      )}
      {stepIndex === 4 && (
        <Step5HumanPresence data={data} setData={setData} onNext={onNext} onBack={onBack} />
      )}
      {stepIndex === 5 && (
        <Step6VoiceDna
          data={data}
          setData={setData}
          onSubmit={handleSubmit}
          onBack={onBack}
          submitting={submitting}
        />
      )}
    </OnboardingLayout>
  );
}
