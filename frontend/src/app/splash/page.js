"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { SplashScreen } from "./components/SplashScreen";

export default function SplashPage() {
  const router = useRouter();

  const handleComplete = useCallback(() => {
    router.push("/");
  }, [router]);

  return <SplashScreen onComplete={handleComplete} />;
}
