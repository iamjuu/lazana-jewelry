export type RazorpaySuccessResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type RazorpayPrefill = {
  name?: string;
  email?: string;
  contact?: string;
};

type OpenRazorpayCheckoutOptions = {
  key: string;
  amount: number;
  currency: string;
  orderId: string;
  name: string;
  description: string;
  prefill?: RazorpayPrefill;
  notes?: Record<string, string>;
  themeColor?: string;
  onSuccess: (response: RazorpaySuccessResponse) => void;
  onError?: (message: string) => void;
  onDismiss?: () => void;
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, handler: (response: any) => void) => void;
    };
  }
}

export function openRazorpayCheckout(options: OpenRazorpayCheckoutOptions) {
  if (typeof window === "undefined" || !window.Razorpay) {
    throw new Error("Razorpay Checkout SDK failed to load");
  }

  const razorpay = new window.Razorpay({
    key: options.key,
    amount: options.amount,
    currency: options.currency,
    name: options.name,
    description: options.description,
    order_id: options.orderId,
    prefill: options.prefill,
    notes: options.notes,
    handler: options.onSuccess,
    modal: {
      ondismiss: options.onDismiss,
    },
    theme: {
      color: options.themeColor || "#1C3163",
    },
  });

  razorpay.on("payment.failed", (response: any) => {
    const message =
      response?.error?.description ||
      response?.error?.reason ||
      "Payment failed";
    options.onError?.(message);
  });

  razorpay.open();
}
