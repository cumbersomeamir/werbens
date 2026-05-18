"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useCurrentUser } from "@/app/onboarding/components/useCurrentUser";

/**
 * AuthGuard - Protects routes by redirecting to login if user is not authenticated
 * Exclude public marketing pages
 */
export function AuthGuard({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { userId, loading } = useCurrentUser();

  // Public routes that don't require authentication
  // Note: basePath is "/app", but usePathname() returns pathname WITHOUT basePath
  const publicRoutes = ["/", "/portfolio", "/packages", "/login", "/terms", "/privacy"];
  const isPublicRoute =
    publicRoutes.includes(pathname) || pathname.startsWith("/portfolio/");

  useEffect(() => {
    // Don't redirect if still loading or on public route
    if (loading) return;
    if (isPublicRoute) return;

    // Redirect to login if not authenticated
    if (!userId) {
      router.push("/login");
    }
  }, [userId, loading, isPublicRoute, router]);

  // Show nothing while checking auth (prevents flash)
  if (loading && !isPublicRoute) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-werbens-mist to-werbens-surface flex items-center justify-center">
        <div className="text-werbens-muted">Loading...</div>
      </div>
    );
  }

  // Allow access to public routes or if authenticated
  if (isPublicRoute || userId) {
    return <>{children}</>;
  }

  // Show nothing while redirecting
  return (
    <div className="min-h-screen bg-gradient-to-b from-werbens-mist to-werbens-surface flex items-center justify-center">
      <div className="text-werbens-muted">Redirecting to login...</div>
    </div>
  );
}
