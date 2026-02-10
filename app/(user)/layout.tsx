"use client";

import { ReactNode, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function UserLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check if admin is logged in
    const adminToken = sessionStorage.getItem("adminToken");
    
    // Public routes that admins can access
    const publicRoutes = ["/login", "/signup", "/register", "/verify-email", "/resend-verification"];
    const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
    
    // If admin is logged in and trying to access user routes (not public routes)
    if (adminToken && !isPublicRoute) {
      console.log("🚫 Admin detected on user route, redirecting to dashboard");
      router.replace("/admin/dashboard");
    }
  }, [pathname, router]);

  return (
    <div className="min-h-screen w-full min-w-0" style={{ backgroundColor: '#fee8dd' }}>
      {children}
    </div>
  );
}

