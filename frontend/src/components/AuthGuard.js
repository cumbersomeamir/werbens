"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useCurrentUser } from "@/app/onboarding/components/useCurrentUser";

/**
 * AuthGuard - Protects routes by redirecting to login if user is not authenticated
 * Exclude root (/) and login (/login) pages
 */
export function AuthGuard({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { userId, loading } = useCurrentUser();

  // Public routes that don't require authentication
  // Note: basePath is "/app", but usePathname() returns pathname WITHOUT basePath
  const publicRoutes = ["/", "/login", "/terms", "/privacy"];

  useEffect(() => {
    // Don't redirect if still loading or on public route
    if (loading) return;
    if (publicRoutes.includes(pathname)) return;

    // Redirect to login if not authenticated
    if (!userId) {
      router.push("/login");
    }
  }, [userId, loading, pathname, router]);

  // Show nothing while checking auth (prevents flash)
  if (loading && !publicRoutes.includes(pathname)) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-werbens-mist to-werbens-surface flex items-center justify-center">
        <div className="text-werbens-muted">Loading...</div>
      </div>
    );
  }

  // Allow access to public routes or if authenticated
  if (publicRoutes.includes(pathname) || userId) {
    return <>{children}</>;
  }

  // Show nothing while redirecting
  return (
    <div className="min-h-screen bg-gradient-to-b from-werbens-mist to-werbens-surface flex items-center justify-center">
      <div className="text-werbens-muted">Redirecting to login...</div>
    </div>
  );
}
