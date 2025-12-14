"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { X, Eye, EyeOff } from "lucide-react";
import Navbar from "@/components/user/Navbar";
import Footer from "@/components/user/Footer";

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    // Validate password length
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Registration failed");
        return;
      }

      toast.success("Account created! Please check your email to verify your account.");
      
      // If verification URL is provided in development, show it
      if (data.data?.verificationUrl) {
        toast(
          <div>
            <p className="font-semibold mb-1">Development Mode - Click to verify:</p>
            <a href={data.data.verificationUrl} className="text-blue-600 underline break-all" target="_blank" rel="noopener noreferrer">
              Verify Email Now
            </a>
          </div>,
          { duration: 15000 }
        );
      }

      // Redirect to login page with a message
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch {
      setError("Something went wrong. Please try again.");
      toast.error("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex-col bg-gradient-to-b from-[#FEC1A2] to-[#FDECE2] flex items-center justify-center">
      <Navbar />
      <div className="w-full mt-[150px] max-w-lg">
        <form onSubmit={handleSubmit} className="relative w-[500px] bg-white p-8 rounded-lg shadow-lg border border-zinc-200">
          {/* Close button
          <button
            type="button"
            onClick={() => router.push("/home")}
            className="absolute top-4 left-4 w-8 h-8 flex items-center justify-center rounded-full border border-black/20 hover:bg-zinc-50 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-black" />
          </button> */}

          {/* Title */}
          <h1 className="text-3xl font-[300] text-black mb-6 mt-2">Sign Up</h1>

          <div className="space-y-5">
            {/* Full Name field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-black mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                required
                autoComplete="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-md border border-[#FEC1A2] px-3 py-2 focus:border-[#FEC1A2] focus:outline-none focus:ring-2 focus:ring-[#FEC1A2]/20 bg-white"
                placeholder="Enter your full name"
              />
            </div>

            {/* Email field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-black mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded-md border border-[#FEC1A2] px-3 py-2 focus:border-[#FEC1A2] focus:outline-none focus:ring-2 focus:ring-[#FEC1A2]/20 bg-white"
                placeholder="you@example.com"
              />
            </div>

            {/* Password field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-black mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full rounded-md border border-[#FEC1A2] px-3 py-2 pr-10 focus:border-[#FEC1A2] focus:outline-none focus:ring-2 focus:ring-[#FEC1A2]/20 bg-white"
                  placeholder="At least 6 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-black hover:text-zinc-600 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-black mb-1">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full rounded-md border border-[#FEC1A2] px-3 py-2 pr-10 focus:border-[#FEC1A2] focus:outline-none focus:ring-2 focus:ring-[#FEC1A2]/20 bg-white"
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-black hover:text-zinc-600 transition-colors"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="text-sm text-red-600">
                <p>{error}</p>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-[#FEC1A2] border border-[#F5A082] px-4 py-2 text-black font-medium transition-colors hover:bg-[#F5A082] disabled:opacity-50"
            >
              {loading ? "Creating Account..." : "Sign Up"}
            </button>
          </div>
        </form>

        <div className="mt-6 space-y-3 text-center text-sm text-zinc-600">
          <p>
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-black underline hover:no-underline">
              Login
            </Link>
          </p>
          <p>
            <Link href="/" className="text-black underline hover:no-underline">
              Back to Home
            </Link>
          </p>
        </div>
      </div>
      <div className="mt-[100px] w-full">
        <Footer />
      </div>
    </div>
  );
}

