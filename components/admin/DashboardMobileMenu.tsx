"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import DashboardNav from "@/components/admin/DashboardNav";
import AdminLogoutButton from "@/components/admin/AdminLogoutButton";

type NavItem = {
  label: string;
  href: string;
};

export default function DashboardMobileMenu({ items }: { items: NavItem[] }) {
  const [isOpen, setIsOpen] = useState(false);

  const primaryItems = items.filter((item) => item.label !== "Settings");
  const settingsItems = items.filter((item) => item.label === "Settings");

  useEffect(() => {
    if (!isOpen) {
      document.body.style.overflow = "";
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-200 transition-colors hover:border-zinc-700 hover:bg-zinc-800 lg:hidden"
        aria-label="Open dashboard menu"
        aria-expanded={isOpen}
        aria-controls="admin-mobile-menu"
      >
        <Menu size={18} />
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            aria-label="Close dashboard menu"
            onClick={() => setIsOpen(false)}
          />

          <aside
            id="admin-mobile-menu"
            className="absolute inset-y-0 left-0 flex w-[min(20rem,88vw)] flex-col border-r border-zinc-800 bg-zinc-950 px-5 py-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <Link
                  href="/admin/dashboard"
                  className="text-lg font-semibold text-white"
                  onClick={() => setIsOpen(false)}
                >
                  Lazana Jewelry
                </Link>
                <p className="mt-1 text-xs text-zinc-400">Admin Dashboard</p>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-200 transition-colors hover:border-zinc-700 hover:bg-zinc-800"
                aria-label="Close dashboard menu"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <DashboardNav
                items={primaryItems}
                className="mt-8 space-y-1"
                onNavigate={() => setIsOpen(false)}
              />
            </div>

            <div className="mt-6 border-t border-zinc-800 pt-4">
              <DashboardNav
                items={settingsItems}
                className="space-y-1"
                onNavigate={() => setIsOpen(false)}
              />
              <div className="mt-4">
                <AdminLogoutButton />
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
