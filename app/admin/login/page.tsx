"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function AdminLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Check if admin is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      const adminToken = sessionStorage.getItem("adminToken");
      if (!adminToken) {
        setCheckingAuth(false);
        return;
      }

      // Verify token by checking if we can access admin profile
      // The API uses cookies, so credentials: "include" will send the cookie
      try {
        const response = await fetch("/api/admin/profile", {
          method: "GET",
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          // If we get a valid response, redirect to dashboard
          if (data.success) {
            router.push("/admin/dashboard");
            return;
          }
        }
        
        // Token/cookie is invalid, clear sessionStorage and show login
        sessionStorage.removeItem("adminToken");
        sessionStorage.removeItem("adminRole");
        setCheckingAuth(false);
      } catch {
        // If API call fails, clear token and show login
        sessionStorage.removeItem("adminToken");
        sessionStorage.removeItem("adminRole");
        setCheckingAuth(false);
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    if (searchParams.get("registered") === "true") {
      setSuccess("Registration successful! Please login with your credentials.");
    }
  }, [searchParams]);

  // Show loading state while checking authentication
  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-900">
        <div className="text-white">Checking authentication...</div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Login failed");
        return;
      }

      // Validate response data
      if (!data.success || !data.data?.token || !data.data?.role) {
        setError("Invalid response from server");
        return;
      }

      // Verify admin role before navigation
      if (data.data.role !== "admin") {
        setError("Access denied. Admin login required.");
        return;
      }

      // Store token in sessionStorage (for client-side reference, cleared when browser closes)
      sessionStorage.setItem("adminToken", data.data.token);
      sessionStorage.setItem("adminRole", "admin");

      // Wait a bit for cookie to be set, then navigate
      // The middleware will verify the cookie token
      await new Promise(resolve => setTimeout(resolve, 100));
      
      router.push("/admin/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-6 py-24  shadow-lg  mt-[60px] border-t border-b rounded-lg border-[#1C3163]">
      <h1 className="font-seasons mb-2 text-3xl font-bold text-[#1C3163] whitespace-nowrap text-center">Crystal Bowl Studio </h1>
      <p className="font-touvlo mb-6 text-sm text-[#1C3163] text-center">Administrator Login</p>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="mt-10">
          <label htmlFor="email" className="font-touvlo block text-sm font-medium text-[#1C3163] mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full rounded-md border border-zinc-300 px-3 py-2"
            placeholder="admin@crystalbow.com"
          />
        </div>
        <div>
          <label htmlFor="password" className="font-touvlo block text-sm font-medium text-[#1C3163] mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="w-full rounded-md border border-zinc-300 px-3 py-2"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-green-600">{success}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-[#1C3163] px-4 py-2 font-touvlo text-white disabled:opacity-50"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm font-touvlo text-[#1C3163]">
        <Link href="/" className="underline">
          Back to Home
        </Link>
      </p>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-zinc-900"><div className="text-white">Loading...</div></div>}>
      <AdminLoginContent />
    </Suspense>
  );
}

