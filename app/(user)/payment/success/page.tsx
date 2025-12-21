"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/user/Navbar";
import Footer from "@/components/user/Footer";
import { CheckCircle, XCircle, Loader } from "lucide-react";
import Link from "next/link";

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams?.get("orderId");
  const paymentIntent = searchParams?.get("payment_intent");
  
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setError("Order ID is missing");
      setStatus("error");
      return;
    }

    verifyPayment();
  }, [orderId, paymentIntent]);

  const verifyPayment = async () => {
    try {
      const token = localStorage.getItem("userToken");
      if (!token) {
        router.push("/login");
        return;
      }

      // Wait a bit to ensure Stripe has processed the payment after redirect
      await new Promise(resolve => setTimeout(resolve, 2000));

      const response = await fetch("/api/payment/verify-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId, paymentIntent }),
      });

      const data = await response.json();

      if (data.success) {
        setStatus("success");
      } else {
        setError(data.message || "Payment verification failed");
        setStatus("error");
      }
    } catch (error: any) {
      console.error("Payment verification error:", error);
      setError(error.message || "Failed to verify payment");
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-[#FDECE2] to-[#FEC1A2]">
      <Navbar />
      
      <div className="max-w-2xl mx-auto px-4 py-12">
        {status === "loading" && (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <Loader className="w-16 h-16 text-[#1C3163] animate-spin mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-[#1C3163] mb-2">Verifying Payment...</h1>
            <p className="text-gray-600">Please wait while we confirm your payment</p>
          </div>
        )}

        {status === "success" && (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-[#1C3163] mb-2">Payment Successful!</h1>
            <p className="text-gray-600 mb-6">Your order has been confirmed and payment processed successfully.</p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/profile?tab=orders"
                className="bg-[#1C3163] text-white px-6 py-2 rounded-lg hover:bg-[#152747] transition-colors"
              >
                View Orders
              </Link>
              <Link
                href="/shop"
                className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-[#1C3163] mb-2">Payment Verification Failed</h1>
            <p className="text-gray-600 mb-6">{error || "There was an issue verifying your payment"}</p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/profile?tab=orders"
                className="bg-[#1C3163] text-white px-6 py-2 rounded-lg hover:bg-[#152747] transition-colors"
              >
                View Orders
              </Link>
              <Link
                href="/shop"
                className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Back to Shop
              </Link>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-r from-[#FDECE2] to-[#FEC1A2]">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#1C3163] mx-auto mb-4"></div>
            <p className="text-[#1C3163]">Loading...</p>
          </div>
        </div>
        <Footer />
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}

