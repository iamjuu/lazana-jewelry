export type ApiResponse<T = unknown> = {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
};

export type WithTimestamps = {
  createdAt: Date;
  updatedAt: Date;
};

export type UserRole = "user" | "admin";

export interface IUser extends WithTimestamps {
  _id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  emailVerified: boolean;
  registered: boolean; // true when user completed initial signup process
  verificationToken?: string | null;
  phone?: string;
  imageUrl?: string;
  addresses?: Array<{
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  }>;
  // Keep address for backward compatibility
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
}

export interface IAdministrator extends WithTimestamps {
  _id: string;
  name: string;
  email: string;
  password: string;
  imageUrl?: string;
}

export interface Product extends WithTimestamps {
  _id: string;
  name: string;
  shortDescription?: string; // Brief description
  description: string; // Long description
  category?: string | Category; // Category reference (can be ObjectId string or populated Category object)
  subcategory?: string | Subcategory; // Subcategory reference (can be ObjectId string or populated Subcategory object)
  price: number; // Price in rupees/dollars (not cents/paise)
  imageUrl: string[]; // Array of base64 image strings
  videoUrl?: string | string[]; // Base64 video string(s) or URL(s) - supports up to 2 videos
  isSet?: boolean; // Checkbox field (true/false)
  numberOfSets?: number; // Number of sets (only if isSet is true)
  newAddition?: boolean; // New addition checkbox
  featured?: boolean; // Featured checkbox
  tuning?: number; // Hz value like 20, 30 (number in Hz)
  relativeproduct?: boolean; // Checkbox field (true/false)
  octave?: '3rd octave' | '4th octave'; // Dropdown: 3rd octave or 4th octave
  size?: string; // Size like "7-8 inch", "8 inch"
  weight?: 'less than 1kg' | 'less than 6kg' | 'between 1-3kg' | '3-5kg'; // Weight category
}

export interface Category extends WithTimestamps {
  _id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface Subcategory extends WithTimestamps {
  _id: string;
  name: string;
  slug: string;
  category: string | Category; // Category reference (can be ObjectId string or populated Category object)
  imageUrl?: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  isSet?: boolean; // To calculate delivery charges
}

export type OrderStatus = "pending" | "paid" | "cancelled" | "failed"; // Payment status only

export type DeliveryStatus = "pending" | "processing" | "ready to ship" | "shipped" | "reached to your country" | "on the way to delivery" | "delivered";

export type DeliveryMethod = "Air Express" | "Air Economy"; // Air Economy kept for backward compatibility, but only Air Express is available for new orders

export interface DeliveryCharges {
  method: DeliveryMethod;
  breakdown: string; // e.g., "3 sets × $170 + 2 pcs × $65 = $640"
  total: number;
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface OrderStatusUpdate {
  status: OrderStatus;
  message?: string; // Admin's custom message
  updatedAt: Date;
}

export interface DeliveryStatusUpdate {
  deliveryStatus: DeliveryStatus;
  message?: string; // Admin's custom message
  updatedAt: Date;
  emailSent?: boolean; // Track if email was sent for this status update
  emailSentAt?: Date; // When email was sent
}

export interface Order extends WithTimestamps {
  _id: string;
  userId: string;
  items: OrderItem[];
  productTotal: number; // Total product cost
  deliveryCharges: DeliveryCharges;
  amount: number; // productTotal + deliveryCharges.total - discountAmount
  currency: string; // SGD
  status: OrderStatus; // Payment status (pending, paid, cancelled)
  deliveryStatus: DeliveryStatus; // Delivery status (pending, processing, ready to ship, shipped, reached to your country, on the way to delivery, delivered)
  statusHistory: OrderStatusUpdate[]; // Track payment status updates
  deliveryStatusHistory: DeliveryStatusUpdate[]; // Track delivery status updates with messages
  currentMessage?: string; // Latest admin message (can be updated without triggering email)
  customerComments?: string; // User's comments/questions
  paymentProvider?: "stripe";
  paymentRef?: string;
  shippingAddress: ShippingAddress;
  customerEmail: string;
  customerName: string;
  couponCode?: string; // Coupon code used
  couponId?: string; // Coupon document ID
  discountAmount?: number; // Discount amount applied
}

export interface CorporateSession extends WithTimestamps {
  _id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  employeeCount: number;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  price: number;
  sessionName?: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  videoUrl?: string;
  format?: string;
  benefits?: string[];
  status?: string;
}

export interface YogaSession extends WithTimestamps {
  _id: string;
  instructor: string;
  date: string; // ISO date
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  totalSeats: number;
  bookedSeats: number;
  price: number; // smallest unit
  sessionType?: "regular" | "corporate" | "private";
  sessionName?: string;
  duration?: number; // in minutes
  title?: string;
  description?: string;
  imageUrl?: string;
  videoUrl?: string;
  format?: string;
  benefits?: string[];
}

export interface DiscoverySession extends WithTimestamps {
  _id: string;
  instructorName: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number; // in minutes
  totalSeats: number; // Always 1
  bookedSeats: number; // 0 or 1
  price: number; // Always 0
  title: string;
  description: string;
  imageUrl?: string;
  videoUrl?: string;
  format?: string;
  benefits?: string[];
  slotId?: string;
}

export interface PrivateSession extends WithTimestamps {
  _id: string;
  instructorName: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number; // in minutes
  totalSeats: number; // Always 1
  bookedSeats: number; // 0 or 1
  price: number; // Payment required
  title: string;
  description: string;
  imageUrl?: string;
  videoUrl?: string;
  format?: string;
  benefits?: string[];
  slotId?: string;
}

export interface FreeStudioVisit extends WithTimestamps {
  _id: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  videoUrl?: string;
  duration?: number; // Time in minutes
  sessionType: "freeStudioVisit";
}

export type BookingStatus = "pending" | "confirmed" | "cancelled";

export interface Booking extends WithTimestamps {
  _id: string;
  userId: string;
  sessionId: string;
  seats: number;
  amount: number;
  status: BookingStatus;
  phone?: string;
  comment?: string;
  paymentProvider?: "stripe" | "paypal" | "bank_transfer";
  paymentRef?: string;
  paymentStatus?: "pending" | "paid" | "failed";
  sessionType?: "discovery" | "private" | "corporate" | "event";
  slotId?: string;
  couponCode?: string; // Coupon code used
  couponId?: string; // Coupon document ID
  discountAmount?: number; // Discount amount applied
}

export type CartItem = {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  quantity: number;
};

export type Cart = {
  items: CartItem[];
};



