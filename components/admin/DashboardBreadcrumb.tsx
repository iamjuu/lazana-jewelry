"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

export default function DashboardBreadcrumb() {
  const pathname = usePathname();

  if (!pathname) {
    return null;
  }

  // Split pathname into segments
  const segments = pathname.split("/").filter(Boolean);

  // Determine root link based on path
  const isAdminRoute = pathname.startsWith("/admin");
  const isDashboardRoute = pathname.startsWith("/dashboard");
  
  // Don't show breadcrumb on root dashboard page
  if (isDashboardRoute && pathname === "/dashboard") {
    return null;
  }

  // Create breadcrumb items
  const breadcrumbs = segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/");
    const isLast = index === segments.length - 1;
    
    // Format segment name (capitalize and replace hyphens)
    const label = segment
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    return {
      href,
      label,
      isLast,
    };
  });

  // Get root link and label: admin area -> admin dashboard, dashboard -> dashboard, else public home
  const rootHref = isAdminRoute ? "/admin/dashboard" : isDashboardRoute ? "/dashboard" : "/";
  const rootLabel = isAdminRoute ? "Home" : isDashboardRoute ? "Dashboard" : "Home";

  return (
    <nav
      className="overflow-x-auto text-sm text-zinc-400 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      aria-label="Breadcrumb"
    >
      <div className="flex min-w-max items-center gap-2 pr-4">
        <Link
          href={rootHref}
          className="shrink-0 transition-colors hover:text-white"
        >
          {rootLabel}
        </Link>
        {breadcrumbs.map((crumb, index) => {
          // Skip the first segment if it matches the root
          const firstSegment = segments[0]?.toLowerCase();
          if (index === 0 && (
            (isDashboardRoute && firstSegment === "dashboard") ||
            (isAdminRoute && firstSegment === "admin")
          )) {
            return null;
          }
          return (
            <span key={crumb.href} className="flex shrink-0 items-center gap-2">
              <span className="text-zinc-600">/</span>
              {crumb.isLast ? (
                <span className="font-medium text-white">{crumb.label}</span>
              ) : (
                <Link
                  href={crumb.href}
                  className="transition-colors hover:text-white"
                >
                  {crumb.label}
                </Link>
              )}
            </span>
          );
        })}
      </div>
    </nav>
  );
}

