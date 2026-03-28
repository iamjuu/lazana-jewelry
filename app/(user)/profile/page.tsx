"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/user/Navbar";
import Footer from "@/components/user/Footer";
import toast from "react-hot-toast";
import {
  User,
  Mail,
  Phone,
  MapPin,
  LogOut,
  Save,
  Package,
  Calendar,
  Ticket,
  CheckCircle,
  Clock,
  XCircle,
  Truck,
} from "lucide-react";
import Image from "next/image";
import ProtectedRoute from "@/components/user/ProtectedRoute";

type UserProfile = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  imageUrl?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
};

type OrderItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  isSet?: boolean;
  imageUrl?: string[];
};

type DeliveryCharges = {
  method: string;
  breakdown: string;
  total: number;
};

type Order = {
  _id: string;
  items: OrderItem[];
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
  paymentProvider?: string;
  currentMessage?: string;
  productTotal?: number;
  deliveryCharges?: DeliveryCharges;
  customerComments?: string;
  couponCode?: string;
  couponId?: string;
  discountAmount?: number;
};

type Booking = {
  _id: string;
  sessionId: string;
  sessionType: "discovery" | "private" | "corporate" | "event";
  seats: number;
  amount: number;
  status: string;
  phone?: string;
  comment?: string;
  createdAt: string;
  updatedAt: string;
  couponCode?: string;
  couponId?: string;
  discountAmount?: number;
  event?: {
    _id: string;
    title: string;
    date: string;
    time: string;
    location: string;
  };
};

type TabType = "profile" | "orders" | "bookings" | "bookedEvents";

function ProfilePageContent() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [eventBookings, setEventBookings] = useState<Booking[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [eventBookingsLoading, setEventBookingsLoading] = useState(false);
  const [ordersPage, setOrdersPage] = useState(1);
  const [hasMoreOrders, setHasMoreOrders] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [bookingsPage, setBookingsPage] = useState(1);
  const [hasMoreBookings, setHasMoreBookings] = useState(true);
  const [isLoadingMoreBookings, setIsLoadingMoreBookings] = useState(false);
  const [eventBookingsPage, setEventBookingsPage] = useState(1);
  const [hasMoreEventBookings, setHasMoreEventBookings] = useState(true);
  const [isLoadingMoreEventBookings, setIsLoadingMoreEventBookings] =
    useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
  });
  const [previewUrl, setPreviewUrl] = useState<string>("");

  // Check URL query parameter for tab on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get("tab");
    if (tabParam === "orders") {
      setActiveTab("orders");
    } else {
      setActiveTab("profile");
    }
  }, []);

  useEffect(() => {
    const token = sessionStorage.getItem("userToken");
    if (token) {
      fetchUserData(token);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "orders" && orders.length === 0 && !ordersLoading) {
      fetchOrders(1, false);
    }
    if (activeTab === "bookings" && bookings.length === 0 && !bookingsLoading) {
      fetchBookings(1, false);
    }
    if (
      activeTab === "bookedEvents" &&
      eventBookings.length === 0 &&
      !eventBookingsLoading
    ) {
      fetchEventBookings(1, false);
    }
  }, [activeTab]);

  const fetchUserData = async (token: string) => {
    try {
      setLoading(true);
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        if (res.status === 401) {
          sessionStorage.removeItem("userToken");
          toast.error("Session expired. Please login again.");
          router.push("/login");
          return;
        }
        throw new Error("Failed to fetch user data");
      }

      const data = await res.json();
      if (data.success && data.data) {
        setUser(data.data);
        setFormData({
          name: data.data.name || "",
          phone: data.data.phone || "",
          street: data.data.address?.street || "",
          city: data.data.address?.city || "",
          state: data.data.address?.state || "",
          zipCode: data.data.address?.zipCode || "",
          country: data.data.address?.country || "",
        });
        if (data.data.imageUrl) {
          setPreviewUrl(getImageUrl(data.data.imageUrl));
        }
      }
    } catch (err) {
      console.error("Profile fetch error:", err);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async (page: number = 1, append: boolean = false) => {
    const token = sessionStorage.getItem("userToken");
    if (!token) return;

    try {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setOrdersLoading(true);
        setOrders([]); // Clear previous orders when fetching first page
      }

      const response = await fetch(`/api/orders?page=${page}&limit=5`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        if (append) {
          setOrders((prev) => [...prev, ...(data.data || [])]);
        } else {
          setOrders(data.data || []);
        }
        setHasMoreOrders(data.pagination?.hasMore || false);
        setOrdersPage(page);
      } else {
        toast.error(data.message || "Failed to fetch orders");
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Something went wrong");
    } finally {
      setOrdersLoading(false);
      setIsLoadingMore(false);
    }
  };

  // Load more orders when scrolling
  const handleLoadMoreOrders = () => {
    if (!isLoadingMore && hasMoreOrders) {
      fetchOrders(ordersPage + 1, true);
    }
  };

  // Load more bookings when scrolling
  const handleLoadMoreBookings = () => {
    if (!isLoadingMoreBookings && hasMoreBookings) {
      fetchBookings(bookingsPage + 1, true);
    }
  };

  // Load more event bookings when scrolling
  const handleLoadMoreEventBookings = () => {
    if (!isLoadingMoreEventBookings && hasMoreEventBookings) {
      fetchEventBookings(eventBookingsPage + 1, true);
    }
  };

  const fetchBookings = async (page: number = 1, append: boolean = false) => {
    const token = sessionStorage.getItem("userToken");
    if (!token) return;

    try {
      if (append) {
        setIsLoadingMoreBookings(true);
      } else {
        setBookingsLoading(true);
        setBookings([]); // Clear previous bookings when fetching first page
      }

      const response = await fetch(
        `/api/bookings?sessionType=discovery,private,corporate&page=${page}&limit=5`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const data = await response.json();
      if (data.success) {
        if (append) {
          setBookings((prev) => [...prev, ...(data.data || [])]);
        } else {
          setBookings(data.data || []);
        }
        setHasMoreBookings(data.pagination?.hasMore || false);
        setBookingsPage(page);
      } else {
        toast.error(data.message || "Failed to fetch bookings");
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
      toast.error("Something went wrong");
    } finally {
      setBookingsLoading(false);
      setIsLoadingMoreBookings(false);
    }
  };

  const fetchEventBookings = async (
    page: number = 1,
    append: boolean = false,
  ) => {
    const token = sessionStorage.getItem("userToken");
    if (!token) return;

    try {
      if (append) {
        setIsLoadingMoreEventBookings(true);
      } else {
        setEventBookingsLoading(true);
        setEventBookings([]); // Clear previous event bookings when fetching first page
      }

      const response = await fetch(
        `/api/bookings?sessionType=event&page=${page}&limit=5`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const data = await response.json();
      if (data.success) {
        if (append) {
          setEventBookings((prev) => [...prev, ...(data.data || [])]);
        } else {
          setEventBookings(data.data || []);
        }
        setHasMoreEventBookings(data.pagination?.hasMore || false);
        setEventBookingsPage(page);
      } else {
        toast.error(data.message || "Failed to fetch event bookings");
      }
    } catch (error) {
      console.error("Error fetching event bookings:", error);
      toast.error("Something went wrong");
    } finally {
      setEventBookingsLoading(false);
      setIsLoadingMoreEventBookings(false);
    }
  };

  const getImageUrl = (imageUrl: string) => {
    if (!imageUrl) return "";
    if (imageUrl.startsWith("data:image")) return imageUrl;
    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://"))
      return imageUrl;
    return `data:image/jpeg;base64,${imageUrl}`;
  };

  const compressImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          const maxWidth = 800;
          const maxHeight = 800;

          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Could not get canvas context"));
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL("image/jpeg", 0.8);
          resolve(compressed);
        };
        img.onerror = reject;
        if (e.target?.result) {
          img.src = e.target.result as string;
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const token =
      typeof window !== "undefined"
        ? sessionStorage.getItem("userToken")
        : null;
    if (!token) {
      router.push("/login");
      return;
    }

    setSaving(true);
    try {
      const updateData: any = {
        name: formData.name,
        phone: formData.phone,
        address: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: formData.country,
        },
      };

      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update profile");
      }

      toast.success("Profile updated successfully!");
      if (data.data) {
        setUser(data.data);
        if (data.data.imageUrl) {
          setPreviewUrl(getImageUrl(data.data.imageUrl));
        }
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update profile",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/user/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      sessionStorage.removeItem("userToken");
      sessionStorage.removeItem("userRole");
      localStorage.removeItem("user");
      window.dispatchEvent(new Event("logout"));
      toast.success("Logged out successfully");
      router.push("/");
      setTimeout(() => {
        router.refresh();
      }, 100);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Show decimals only when value has cents; omit .00 for whole numbers
  const formatAmount = (n: number): string => {
    const rounded = Math.round(n * 100) / 100;
    return rounded % 1 === 0 ? String(rounded) : rounded.toFixed(2);
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
      case "delivered":
      case "confirmed":
        return <CheckCircle className="text-green-600" size={20} />;
      case "shipped":
        return <Truck className="text-blue-600" size={20} />;
      case "pending":
        return <Clock className="text-yellow-600" size={20} />;
      case "cancelled":
      case "refunded":
        return <XCircle className="text-red-600" size={20} />;
      default:
        return <Package className="text-black" size={20} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
      case "delivered":
      case "confirmed":
        return "text-green-600 bg-green-50";
      case "shipped":
        return "text-blue-600 bg-blue-50";
      case "pending":
        return "text-yellow-600 bg-yellow-50";
      case "cancelled":
      case "refunded":
        return "text-red-600 bg-red-50";
      default:
        return "text-black bg-gray-50";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen  flex items-center justify-center font-touvlo">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-black text-lg">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen b flex items-center justify-center">
        <p className="text-black text-lg">Failed to load profile</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="max-w-6xl mx-auto bg-white px-3 sm:px-6 lg:px-8 py-6 sm:py-16 lg:py-20 font-touvlo">
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl overflow-hidden">
          {/* Header Section */}
          <div className=" px-4 sm:px-8 lg:px-12 py-6 sm:py-10">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
              {/* Profile Image */}
              <div className="relative group flex-shrink-0">
                <div className="relative w-24 h-24 sm:w-40 sm:h-40 rounded-full overflow-hidden border-4 border-white shadow-lg">
                  {previewUrl || user.imageUrl ? (
                    <Image
                      src={previewUrl || getImageUrl(user.imageUrl || "")}
                      alt={user.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full  flex items-center justify-center text-black text-3xl sm:text-5xl font-bold">
                      {getInitials(user.name)}
                    </div>
                  )}
                </div>
              </div>

              {/* User Info */}
              <div className="flex-1 text-center sm:text-left min-w-0">
                <h1 className="text-xl sm:text-4xl font-bold text-black mb-1 sm:mb-2 truncate">
                  {user.name}
                </h1>
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-4 text-black">
                  <div className="flex items-center justify-center sm:justify-start gap-2 min-w-0">
                    <Mail size={16} className="flex-shrink-0 sm:w-[18px] sm:h-[18px]" />
                    <span className="text-xs sm:text-base truncate">{user.email}</span>
                  </div>
                  {user.phone && (
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <Phone size={16} className="flex-shrink-0 sm:w-[18px] sm:h-[18px]" />
                      <span className="text-xs sm:text-base">{user.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#1c3163] hover:bg-[#152747] text-white px-4 py-2.5 rounded-lg transition-colors text-sm sm:text-base flex-shrink-0"
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>
          </div>

          {/* Tabs Navigation - scrollable on mobile */}
          <div className="border-b border-gray-200 bg-white overflow-x-auto scrollbar-hide">
            <nav className="flex -mb-px min-w-max sm:min-w-0 sm:flex">
              <button
                onClick={() => setActiveTab("profile")}
                className={`
                  flex-1 min-w-[80px] sm:min-w-0 px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-center border-b-2 transition-colors whitespace-nowrap
                  ${
                    activeTab === "profile"
                      ? "border-[#000000] text-black bg-white"
                      : "border-transparent text-black hover:text-black hover:border-gray-300"
                  }
                `}
              >
                <User size={18} className="inline-block mr-1 sm:mr-2 sm:w-5 sm:h-5" />
                Profile
              </button>
              <button
                onClick={() => setActiveTab("orders")}
                className={`
                  flex-1 min-w-[80px] sm:min-w-0 px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-center border-b-2 transition-colors whitespace-nowrap
                  ${
                    activeTab === "orders"
                      ? "border-[#000000] text-black bg-white"
                      : "border-transparent text-black hover:text-black hover:border-gray-300"
                  }
                `}
              >
                <Package size={18} className="inline-block mr-1 sm:mr-2 sm:w-5 sm:h-5" />
                Orders
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-4 sm:p-8 lg:p-12">
            {/* Profile Tab */}
            {activeTab === "profile" && (
              <form onSubmit={handleSave} className="space-y-5 sm:space-y-6">
                {/* Personal Information */}
                <div>
                  <h2 className="text-base sm:text-[18px] font-bold text-black mb-4 sm:mb-6 flex items-center gap-2">
                    <User size={20} className="sm:w-6 sm:h-6" />
                    Personal Information
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-sm font-medium text-black mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#000000] focus:ring-2 focus:ring-[#000000]/20 outline-none transition-all"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#000000] focus:ring-2 focus:ring-[#000000]/20 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Address Information */}
                <div>
                  <h2 className="text-base sm:text-[18px] font-bold text-black mb-4 sm:mb-6 flex items-center gap-2">
                    <MapPin size={20} className="sm:w-6 sm:h-6" />
                    Address Information
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-black mb-2">
                        Street Address
                      </label>
                      <input
                        type="text"
                        value={formData.street}
                        onChange={(e) =>
                          setFormData({ ...formData, street: e.target.value })
                        }
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#000000] focus:ring-2 focus:ring-[#000000]/20 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black mb-2">
                        City
                      </label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) =>
                          setFormData({ ...formData, city: e.target.value })
                        }
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#000000] focus:ring-2 focus:ring-[#000000]/20 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black mb-2">
                        State
                      </label>
                      <input
                        type="text"
                        value={formData.state}
                        onChange={(e) =>
                          setFormData({ ...formData, state: e.target.value })
                        }
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#000000] focus:ring-2 focus:ring-[#000000]/20 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black mb-2">
                        Zip Code
                      </label>
                      <input
                        type="text"
                        value={formData.zipCode}
                        onChange={(e) =>
                          setFormData({ ...formData, zipCode: e.target.value })
                        }
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#000000] focus:ring-2 focus:ring-[#000000]/20 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black mb-2">
                        Country
                      </label>
                      <input
                        type="text"
                        value={formData.country}
                        onChange={(e) =>
                          setFormData({ ...formData, country: e.target.value })
                        }
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#000000] focus:ring-2 focus:ring-[#000000]/20 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end pt-2 sm:pt-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-black hover:bg-gray-800 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg font-semibold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                  >
                    <Save size={20} />
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            )}

            {/* Orders Tab */}
            {activeTab === "orders" && (
              <div>
                <h2 className="text-base sm:text-[18px] font-bold text-black mb-4 sm:mb-6 flex items-center gap-2">
                  <Package size={20} className="sm:w-6 sm:h-6" />
                  My Orders
                </h2>
                {ordersLoading ? (
                  <div className="flex items-center justify-center py-8 sm:py-12">
                    <div className="w-8 h-8 border-4 border-[#000000]/30 border-t-[#000000] rounded-full animate-spin" />
                  </div>
                ) : orders.length === 0 ? (
                  <div className="bg-gray-50 rounded-lg p-6 sm:p-12 text-center">
                    <Package size={48} className="text-gray-400 mx-auto mb-3 sm:mb-4 sm:w-16 sm:h-16" />
                    <h3 className="text-black text-lg sm:text-xl font-medium mb-2">
                      No Orders Yet
                    </h3>
                    <p className="text-black text-sm sm:text-base mb-4 sm:mb-6">
                      You haven&apos;t placed any orders yet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 sm:space-y-6">
                    {orders.map((order) => (
                      <div
                        key={order._id}
                        className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200"
                      >
                        <div className="bg-white px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
                            <div className="flex items-center gap-4">
                              {getStatusIcon(order.status)}
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-sm text-black">
                                    Order ID
                                  </p>
                                  {order.couponCode && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                                      <Ticket size={12} />
                                      Coupon Applied
                                    </span>
                                  )}
                                </div>
                                <p className="text-black font-medium">
                                  #{order._id.slice(-8).toUpperCase()}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-col md:items-end gap-2">
                              <span
                                className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}
                              >
                                {order.status.charAt(0).toUpperCase() +
                                  order.status.slice(1)}
                              </span>
                              <p className="text-sm text-black">
                                {new Date(order.createdAt).toLocaleDateString(
                                  "en-US",
                                  {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  },
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="p-4 sm:p-6">
                          {/* Admin Message */}
                          {order.currentMessage && (
                            <div className="mb-3 sm:mb-4 bg-blue-50 border-l-4 border-blue-500 p-3 sm:p-4 rounded text-sm">
                              <div className="flex items-start gap-2">
                                <div className="flex-shrink-0 mt-0.5">
                                  <svg
                                    className="w-5 h-5 text-blue-500"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-blue-800">
                                    Latest Update:
                                  </p>
                                  <p className="text-sm text-blue-700 mt-1">
                                    {order.currentMessage}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="space-y-3 sm:space-y-4 mb-3 sm:mb-4">
                            {order.items.map((item, index) => {
                              const handleProductClick = async (
                                e: React.MouseEvent,
                              ) => {
                                e.preventDefault();
                                try {
                                  const response = await fetch(
                                    `/api/products/${item.productId}`,
                                  );
                                  const data = await response.json();

                                  if (data.success && data.data) {
                                    // Check if product is deleted
                                    if (data.data.deleted === true) {
                                      toast.error("Product unavailable");
                                      return;
                                    }
                                    // Product is available, navigate to product page
                                    router.push(`/shop/${item.productId}`);
                                  } else {
                                    // Product not found or error
                                    toast.error("Product unavailable");
                                  }
                                } catch (error) {
                                  // Error fetching product
                                  toast.error("Product unavailable");
                                }
                              };

                              return (
                                <div
                                  key={index}
                                  onClick={handleProductClick}
                                  className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start cursor-pointer hover:bg-gray-100 p-2 rounded-md transition-colors"
                                >
                                  <div className="flex w-full sm:w-auto gap-3 sm:gap-4 items-start flex-1 min-w-0">
                                    {/* Product Image */}
                                    {item.imageUrl &&
                                      item.imageUrl.length > 0 &&
                                      item.imageUrl[0] &&
                                      (() => {
                                        const normalizeImageUrl = (
                                          url: string,
                                        ): string => {
                                          if (!url) return "";
                                          if (url.startsWith("data:image"))
                                            return url;
                                          if (
                                            url.startsWith("http://") ||
                                            url.startsWith("https://")
                                          )
                                            return url;
                                          return `data:image/jpeg;base64,${url}`;
                                        };

                                        return (
                                          <div className="relative w-14 h-14 sm:w-20 sm:h-20 rounded-md overflow-hidden flex-shrink-0 border border-gray-200">
                                            <Image
                                              src={normalizeImageUrl(
                                                item.imageUrl[0],
                                              )}
                                              alt={item.name}
                                              fill
                                              className="object-cover"
                                              unoptimized
                                            />
                                          </div>
                                        );
                                      })()}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-black font-medium text-sm sm:text-base break-words">
                                        {item.name}
                                      </p>
                                      <p className="text-xs sm:text-sm text-black">
                                        Quantity: {item.quantity}{" "}
                                        {item.isSet ? "(Set)" : "(Piece)"}
                                      </p>
                                    </div>
                                  </div>
                                  <p className="text-black font-medium text-sm sm:text-base flex-shrink-0 pl-2 sm:pl-0">
                                    ${formatAmount(item.price * item.quantity)}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                          <div className="border-t border-gray-200 pt-3 sm:pt-4 mt-3 sm:mt-4 space-y-2 text-sm">
                            {order.deliveryCharges && (
                              <>
                                <div className="flex justify-between items-center text-sm">
                                  <p className="text-black">Product Total</p>
                                  <p className="text-black font-medium">
                                    $
                                    {formatAmount(
                                      order.productTotal ?? order.amount,
                                    )}
                                  </p>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                  <p className="text-black">
                                    Delivery ({order.deliveryCharges.method === "Air Express" ? "Air Economy" : order.deliveryCharges.method})
                                  </p>
                                  <p className="text-black font-medium">
                                    ${formatAmount(order.deliveryCharges.total)}
                                  </p>
                                </div>
                                {order.deliveryCharges.breakdown && (
                                  <p className="text-xs text-black italic pl-4">
                                    {order.deliveryCharges.breakdown}
                                  </p>
                                )}
                              </>
                            )}
                            {order.discountAmount != null && order.discountAmount > 0 ? (
                                <div className="flex justify-between items-center text-sm">
                                  <div className="flex items-center gap-2">
                                    <p className="text-black">Discount</p>
                                    {order.couponCode && (
                                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                                        Coupon Applied: {order.couponCode}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-green-600 font-medium">
                                    -${formatAmount(order.discountAmount)}
                                  </p>
                                </div>
                              ) : null}
                            <div className="flex justify-between items-center pt-2 border-t border-gray-300">
                              <p className="text-black font-semibold text-lg">
                                Total Amount (USD)
                              </p>
                              <p className="text-black font-semibold text-lg">
                                ${formatAmount(order.amount)}
                              </p>
                            </div>
                            {order.paymentProvider && (
                              <p className="text-sm text-black mt-2">
                                Paid via{" "}
                                {order.paymentProvider.charAt(0).toUpperCase() +
                                  order.paymentProvider.slice(1)}
                              </p>
                            )}
                            {order.customerComments && (
                              <div className="mt-4 pt-4 border-t border-gray-200">
                                <p className="text-sm font-medium text-black mb-1">
                                  Your Comments:
                                </p>
                                <p className="text-sm text-black italic">
                                  {order.customerComments}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Load More Button */}
                    {hasMoreOrders && (
                      <div className="text-center py-4 sm:py-6">
                        <button
                          onClick={handleLoadMoreOrders}
                          disabled={isLoadingMore}
                          className="w-full sm:w-auto bg-[#1C3163] text-white px-6 py-2.5 rounded-lg hover:bg-[#152747] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                        >
                          {isLoadingMore ? "Loading..." : "Load More Orders"}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Bookings Tab */}
            {activeTab === "bookings" && (
              <div>
                <h2 className="text-base sm:text-[18px] font-bold text-black mb-4 sm:mb-6 flex items-center gap-2">
                  <Calendar size={20} className="sm:w-6 sm:h-6" />
                  Booked Appointments
                </h2>
                {bookingsLoading ? (
                  <div className="flex items-center justify-center py-8 sm:py-12">
                    <div className="w-8 h-8 border-4 border-[#000000]/30 border-t-[#000000] rounded-full animate-spin" />
                  </div>
                ) : bookings.length === 0 ? (
                  <div className="bg-gray-50 rounded-lg p-6 sm:p-12 text-center">
                    <Calendar
                      size={48}
                      className="text-gray-400 mx-auto mb-3 sm:mb-4 sm:w-16 sm:h-16"
                    />
                    <h3 className="text-black text-lg sm:text-xl font-medium mb-2">
                      No Bookings Yet
                    </h3>
                    <p className="text-black text-sm sm:text-base mb-4 sm:mb-6">
                      You haven&apos;t booked any appointments yet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 sm:space-y-6">
                    {bookings.map((booking) => (
                      <div
                        key={booking._id}
                        className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200"
                      >
                        <div className="bg-white px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
                            <div className="flex items-center gap-4">
                              {getStatusIcon(booking.status)}
                              <div>
                                <p className="text-sm text-black">
                                  Booking ID
                                </p>
                                <p className="text-black font-medium">
                                  #{booking._id.slice(-8).toUpperCase()}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-col md:items-end gap-2">
                              <span
                                className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}
                              >
                                {booking.status.charAt(0).toUpperCase() +
                                  booking.status.slice(1)}
                              </span>
                              <p className="text-sm text-black">
                                {new Date(booking.createdAt).toLocaleDateString(
                                  "en-US",
                                  {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  },
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="p-4 sm:p-6">
                          <div className="space-y-3 text-sm sm:text-base">
                            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                              <span className="text-black">
                                Session Type:
                              </span>
                              <span className="text-black font-medium capitalize">
                                {booking.sessionType}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-black">Seats:</span>
                              <span className="text-black font-medium">
                                {booking.seats}
                              </span>
                            </div>
                            {booking.amount > 0 && (
                              <div className="flex justify-between">
                                <span className="text-black">Amount:</span>
                                <span className="text-black  text-black font-semibold text-lg">
                                  ${formatAmount(booking.amount)}
                                </span>
                              </div>
                            )}
                            {booking.comment && (
                              <div className="pt-3 border-t border-gray-200">
                                <p className="text-sm text-black mb-1">
                                  Details:
                                </p>
                                {(() => {
                                  if (!booking.comment) return null;
                                  if (booking.sessionType === "discovery") {
                                    try {
                                      const data = JSON.parse(booking.comment);
                                      return (
                                        <div className="space-y-1 mt-1 text-sm">
                                          <p className="text-black">
                                            <span className="text-black">
                                              Date:
                                            </span>{" "}
                                            {data.date}
                                          </p>
                                          <p className="text-black">
                                            <span className="text-black">
                                              Time:
                                            </span>{" "}
                                            {data.time}
                                          </p>
                                        </div>
                                      );
                                    } catch {
                                      return (
                                        <p className="text-black">
                                          {booking.comment}
                                        </p>
                                      );
                                    }
                                  }
                                  return (
                                    <p className="text-black">
                                      {booking.comment}
                                    </p>
                                  );
                                })()}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {hasMoreBookings && (
                      <div className="text-center py-4 sm:py-6">
                        <button
                          onClick={handleLoadMoreBookings}
                          disabled={isLoadingMoreBookings}
                          className="w-full sm:w-auto bg-[#1C3163] text-white px-6 py-2.5 rounded-lg hover:bg-[#152747] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                        >
                          {isLoadingMoreBookings
                            ? "Loading..."
                            : "Load More Bookings"}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Booked Events Tab */}
            {activeTab === "bookedEvents" && (
              <div>
                <h2 className="text-base sm:text-[18px] font-bold text-black mb-4 sm:mb-6 flex items-center gap-2">
                  <Calendar size={20} className="sm:w-6 sm:h-6" />
                  Booked Events
                </h2>
                {eventBookingsLoading ? (
                  <div className="flex items-center justify-center py-8 sm:py-12">
                    <div className="w-8 h-8 border-4 border-[#000000]/30 border-t-[#000000] rounded-full animate-spin" />
                  </div>
                ) : eventBookings.length === 0 ? (
                  <div className="bg-gray-50 rounded-lg p-6 sm:p-12 text-center">
                    <Calendar
                      size={48}
                      className="text-gray-400 mx-auto mb-3 sm:mb-4 sm:w-16 sm:h-16"
                    />
                    <h3 className="text-black text-lg sm:text-xl font-medium mb-2">
                      No Event Bookings Yet
                    </h3>
                    <p className="text-black text-sm sm:text-base mb-4 sm:mb-6">
                      You haven&apos;t booked any events yet.
                    </p>
                    <button
                      onClick={() => router.push("/events")}
                      className="w-full sm:w-auto bg-[#1C3163] text-white px-6 py-2.5 rounded-lg hover:bg-[#152747] transition-colors"
                    >
                      Browse Events
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4 sm:space-y-6">
                    {eventBookings.map((booking) => (
                      <div
                        key={booking._id}
                        className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200"
                      >
                        <div className="bg-white px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
                            <div className="flex items-center gap-4">
                              {getStatusIcon(booking.status)}
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-sm text-black">
                                    Booking ID
                                  </p>
                                  {booking.couponCode && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                                      <Ticket size={12} />
                                      Coupon Applied
                                    </span>
                                  )}
                                </div>
                                <p className="text-black font-medium">
                                  #{booking._id.slice(-8).toUpperCase()}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-col md:items-end gap-2">
                              <span
                                className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}
                              >
                                {booking.status.charAt(0).toUpperCase() +
                                  booking.status.slice(1)}
                              </span>
                              <p className="text-sm text-black">
                                {new Date(booking.createdAt).toLocaleDateString(
                                  "en-US",
                                  {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  },
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="p-4 sm:p-6">
                          <div className="space-y-3 text-sm sm:text-base">
                            {booking.event && (
                              <>
                                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                                  <span className="text-black">Event:</span>
                                  <span className="text-black font-medium break-words">
                                    {booking.event.title}
                                  </span>
                                </div>
                                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                                  <span className="text-black">Date:</span>
                                  <span className="text-black font-medium">
                                    {booking.event.date}
                                  </span>
                                </div>
                                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                                  <span className="text-black">Time:</span>
                                  <span className="text-black font-medium">
                                    {booking.event.time}
                                  </span>
                                </div>
                                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                                  <span className="text-black">
                                    Location:
                                  </span>
                                  <span className="text-black font-medium break-words">
                                    {booking.event.location}
                                  </span>
                                </div>
                              </>
                            )}
                            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                              <span className="text-black">Slots:</span>
                              <span className="text-black font-medium">
                                {booking.seats}
                              </span>
                            </div>
                            {booking.discountAmount &&
                              booking.discountAmount > 0 && (
                                <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-200">
                                  <div className="flex items-center gap-2">
                                    <span className="text-black">
                                      Discount
                                    </span>
                                    {booking.couponCode && (
                                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                                        {booking.couponCode}
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-green-600 font-medium">
                                    -USD ${formatAmount(booking.discountAmount)}
                                  </span>
                                </div>
                              )}
                            {booking.amount > 0 && (
                              <div className="flex justify-between pt-3 border-t border-gray-200">
                                <span className="text-black font-medium">
                                  Total Amount:
                                </span>
                                <span className="text-black font-semibold text-lg">
                                  USD${formatAmount(booking.amount)}
                                </span>
                              </div>
                            )}
                            {booking.comment && (
                              <div className="pt-3 border-t border-gray-200">
                                <p className="text-sm text-black mb-1">
                                  Details:
                                </p>
                                <p className="text-black">
                                  {booking.comment}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {hasMoreEventBookings && (
                      <div className="text-center py-4 sm:py-6">
                        <button
                          onClick={handleLoadMoreEventBookings}
                          disabled={isLoadingMoreEventBookings}
                          className="w-full sm:w-auto bg-[#1C3163] text-white px-6 py-2.5 rounded-lg hover:bg-[#152747] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                        >
                          {isLoadingMoreEventBookings
                            ? "Loading..."
                            : "Load More Events"}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfilePageContent />
    </ProtectedRoute>
  );
}


