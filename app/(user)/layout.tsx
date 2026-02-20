"use client";

import { ReactNode } from "react";

export default function UserLayout({ children }: { children: ReactNode }) {
  // Keep this layout passive. Route protection/redirects are handled in middleware
  // using server-side cookies. Client-side sessionStorage redirects can become stale
  // and cause redirect loops in normal browser tabs.
  return <div className="min-h-screen w-full min-w-0">{children}</div>;
}

