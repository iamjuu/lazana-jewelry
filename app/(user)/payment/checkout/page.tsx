"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import Navbar from "@/components/user/Navbar";
import Footer from "@/components/user/Footer";
import toast from "react-hot-toast";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "");

function CheckoutForm({ orderId, amount }: { orderId: string; amount: number }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);

    try {
      // Confirm the payment - this will handle 3D Secure and other authentication if needed
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment/success?orderId=${orderId}`,
        },
        redirect: "if_required", // Only redirect if required for authentication (e.g., 3D Secure)
      });

      if (error) {
        console.error("Payment confirmation error:", error);
        toast.error(error.message || "Payment failed. Please try again.");
        setLoading(false);
        return;
      }

      // Check payment intent status
      if (paymentIntent) {
        if (paymentIntent.status === "succeeded") {
          // Payment succeeded immediately - redirect to success page
          router.push(`/payment/success?orderId=${orderId}&payment_intent=${paymentIntent.id}`);
        } else if (paymentIntent.status === "processing") {
          // Payment is processing - redirect to success page (will verify there)
          router.push(`/payment/success?orderId=${orderId}&payment_intent=${paymentIntent.id}`);
        } else if (paymentIntent.status === "requires_action" || paymentIntent.status === "requires_confirmation") {
          // Payment requires action - Stripe will handle redirect automatically
          // The redirect will happen automatically, so we don't need to do anything here
        } else {
          // Unexpected status
          console.error("Unexpected payment status:", paymentIntent.status);
          toast.error(`Payment status: ${paymentIntent.status}. Please try again.`);
          setLoading(false);
        }
      } else {
        // No payment intent returned - might have redirected already
        // This is normal for 3D Secure flows
      }
    } catch (error: any) {
      console.error("Payment confirmation error:", error);
      toast.error(error.message || "Payment failed. Please check your card details and try again.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-medium text-[#1C3163] mb-4">Payment Details</h2>
        <PaymentElement />
      </div>

      <div className="bg-white p-4 rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <span className="text-lg font-medium text-[#1C3163]">Total Amount (SGD):</span>
          <span className="text-2xl font-bold text-[#1C3163]">${amount.toFixed(2)}</span>
        </div>
      </div>

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-[#1C3163] text-white py-3 rounded-md font-medium hover:bg-[#152747] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Processing Payment..." : "Pay Now"}
      </button>
    </form>
  );
}

function PaymentCheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams?.get("orderId");
  
  const [clientSecret, setClientSecret] = useState("");
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) {
      toast.error("Invalid order");
      router.push("/shop");
      return;
    }

    createPaymentIntent();
  }, [orderId]);

  const createPaymentIntent = async () => {
    try {
      const response = await fetch("/api/payment/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to create payment intent");
      }

      setClientSecret(data.clientSecret);
      setOrder(data.order);
    } catch (error: any) {
      console.error("Payment intent creation failed:", error);
      toast.error(error.message || "Failed to initialize payment");
      router.push("/shop");
    } finally {
      setLoading(false);
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

  if (!clientSecret) {
    return null;
  }

  const options = {
    clientSecret,
    appearance: {
      theme: "stripe" as const,
      variables: {
        colorPrimary: "#1C3163",
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-[#FDECE2] to-[#FEC1A2]">
      <Navbar />
      
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
        <h1 className="text-[28px] sm:text-[36px] font-normal text-[#1C3163] mb-8">
          Complete Your Payment
        </h1>

        <Elements stripe={stripePromise} options={options}>
          <CheckoutForm orderId={orderId!} amount={order?.amount || 0} />
        </Elements>
      </div>

      <Footer />
    </div>
  );
}

export default function PaymentCheckoutPage() {
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
      <PaymentCheckoutContent />
    </Suspense>
  );
}

