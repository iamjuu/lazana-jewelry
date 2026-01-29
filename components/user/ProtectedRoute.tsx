"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import toast from "react-hot-toast";

type ProtectedRouteProps = {
  children: React.ReactNode;
  redirectTo?: string;
  requireAuth?: boolean;
};

export default function ProtectedRoute({ 
  children, 
  redirectTo = "/login",
  requireAuth = true 
}: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const toastShownRef = useRef(false); // Track if toast was already shown to prevent duplicates
  const redirectingRef = useRef(false); // Track if we're currently redirecting

  useEffect(() => {
    const checkAuth = () => {
      const token = sessionStorage.getItem("userToken");
      
      // Don't redirect if we're already on the redirect page (prevents infinite loop)
      if (pathname === redirectTo) {
        setIsAuthenticated(false);
        setIsLoading(false);
        toastShownRef.current = false; // Reset when on login page
        redirectingRef.current = false; // Reset redirect flag
        return;
      }
      
      // If already redirecting, don't do anything (prevents duplicate toasts)
      if (redirectingRef.current) {
        return;
      }
      
      if (!token && requireAuth) {
        // Only show toast and redirect if not already on the redirect page and toast not shown yet
        if (pathname !== redirectTo && !toastShownRef.current) {
        toast.error("Please login to continue");
          toastShownRef.current = true; // Mark toast as shown
          redirectingRef.current = true; // Mark as redirecting
        router.push(redirectTo);
        }
        return;
      }
      
      setIsAuthenticated(!!token);
      setIsLoading(false);
      toastShownRef.current = false; // Reset when authenticated
      redirectingRef.current = false; // Reset redirect flag
    };

    checkAuth();
  }, [pathname, redirectTo, requireAuth, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-[#FDECE2] to-[#FEC1A2]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1C3163] mx-auto mb-4"></div>
          <p className="text-[#1C3163]">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated && requireAuth) {
    return null;
  }

  return <>{children}</>;
}



