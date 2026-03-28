"use client";

import { Suspense, useEffect, useState } from "react";
import Script from "next/script";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/user/Navbar";
import Footer from "@/components/user/Footer";
import toast from "react-hot-toast";
import { openRazorpayCheckout } from "@/lib/razorpay-client";

type PaymentOrderData = {
  key: string;
  amount: number;
  currency: string;
  razorpayOrderId: string;
  description: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
};

function PaymentCheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams?.get("orderId");

  const [paymentData, setPaymentData] = useState<PaymentOrderData | null>(null);
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!orderId) {
      toast.error("Invalid order");
      router.push("/shop");
      return;
    }

    createPaymentOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const createPaymentOrder = async () => {
    try {
      const response = await fetch("/api/payment/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      const data = await response.json();

      if (!data.success || !data.data?.razorpayOrderId) {
        throw new Error(data.message || "Failed to create payment order");
      }

      setPaymentData(data.data);
      setOrder(data.order);
    } catch (error: any) {
      console.error("Payment order creation failed:", error);
      toast.error(error.message || "Failed to initialize payment");
      router.push("/shop");
    } finally {
      setLoading(false);
    }
  };

  const handlePayNow = () => {
    if (!paymentData || !orderId) {
      return;
    }

    setProcessing(true);

    try {
      openRazorpayCheckout({
        key: paymentData.key,
        amount: paymentData.amount,
        currency: paymentData.currency,
        orderId: paymentData.razorpayOrderId,
        name: "Lazana Jewelry",
        description: paymentData.description,
        prefill: paymentData.prefill,
        notes: {
          localOrderId: orderId,
        },
        onSuccess: (response) => {
          router.push(
            `/payment/success?orderId=${orderId}&razorpay_payment_id=${response.razorpay_payment_id}&razorpay_order_id=${response.razorpay_order_id}&razorpay_signature=${response.razorpay_signature}`
          );
        },
        onError: (message) => {
          toast.error(message);
          setProcessing(false);
        },
        onDismiss: () => {
          setProcessing(false);
        },
      });
    } catch (error: any) {
      toast.error(error.message || "Unable to open Razorpay checkout");
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-[#FDECE2] to-[#FEC1A2]">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#1C3163] mx-auto mb-4"></div>
            <p className="text-[#1C3163]">Loading payment...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!paymentData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-[#FDECE2] to-[#FEC1A2]">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
        <h1 className="text-[28px] sm:text-[30px] font-normal text-[#1C3163] mb-8 font-touvlo">
          Complete Your Payment
        </h1>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-medium text-[#1C3163] mb-4">Payment Method</h2>
            <p className="text-[#545454] mb-3">
              You will complete this order in the Razorpay checkout popup.
            </p>
            <p className="text-sm text-[#545454]">
              Supported methods depend on your Razorpay account configuration.
            </p>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-lg font-medium text-[#1C3163]">
                Total Amount ({paymentData.currency}):
              </span>
              <span className="text-2xl font-bold text-[#1C3163]">
                {(paymentData.amount / 100).toFixed(2)}
              </span>
            </div>
            <p className="text-sm text-[#545454]">
              Order #{order?._id?.toString()?.slice(-8) || orderId}
            </p>
          </div>

          <button
            type="button"
            disabled={processing}
            onClick={handlePayNow}
            className="w-full bg-[#1C3163] text-white py-3 rounded-md font-medium hover:bg-[#152747] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? "Opening Razorpay..." : "Pay with Razorpay"}
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default function PaymentCheckoutPage() {
  return (
    <Suspense
      fallback={
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
      }
    >
      <PaymentCheckoutContent />
    </Suspense>
  );
}
