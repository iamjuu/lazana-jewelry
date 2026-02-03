"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/user/Navbar";
import Footer from "@/components/user/Footer";
import toast from "react-hot-toast";
import { User, Mail, Phone, MapPin, LogOut, Save, Package, Calendar, Ticket, CheckCircle, Clock, XCircle, Truck } from "lucide-react";
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
  const [isLoadingMoreEventBookings, setIsLoadingMoreEventBookings] = useState(false);
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
    if (tabParam === "orders" || tabParam === "sessions" || tabParam === "bookings" || tabParam === "bookedEvents") {
      setActiveTab(tabParam === "sessions" ? "bookings" : tabParam as TabType);
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
    if (activeTab === "bookedEvents" && eventBookings.length === 0 && !eventBookingsLoading) {
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
      
      const response = await fetch(`/api/bookings?sessionType=discovery,private,corporate&page=${page}&limit=5`, {
        headers: { Authorization: `Bearer ${token}` },
      });

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

  const fetchEventBookings = async (page: number = 1, append: boolean = false) => {
    const token = sessionStorage.getItem("userToken");
    if (!token) return;

    try {
      if (append) {
        setIsLoadingMoreEventBookings(true);
      } else {
        setEventBookingsLoading(true);
        setEventBookings([]); // Clear previous event bookings when fetching first page
      }
      
      const response = await fetch(`/api/bookings?sessionType=event&page=${page}&limit=5`, {
        headers: { Authorization: `Bearer ${token}` },
      });

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
    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) return imageUrl;
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
    const token = typeof window !== "undefined" ? sessionStorage.getItem("userToken") : null;
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
      toast.error(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/user/logout", { 
        method: "POST", 
        credentials: "include" 
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
        return <Package className="text-gray-600" size={20} />;
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
        return "text-gray-600 bg-gray-50";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FDECE2] via-[#FEC1A2] to-[#D5B584] flex items-center justify-center font-touvlo">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FDECE2] via-[#FEC1A2] to-[#D5B584] flex items-center justify-center">
        <p className="text-white text-lg">Failed to load profile</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDECE2] via-[#FEC1A2] to-[#D5B584]">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 font-touvlo">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-[#D5B584] to-[#FEC1A2] px-6 sm:px-8 lg:px-12 py-8 sm:py-10">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Profile Image */}
              <div className="relative group">
                <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden border-4 border-white shadow-lg">
                  {previewUrl || user.imageUrl ? (
                    <Image
                      src={previewUrl || getImageUrl(user.imageUrl || "")}
                      alt={user.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#D5B584] to-[#FEC1A2] flex items-center justify-center text-white text-4xl sm:text-5xl font-bold">
                      {getInitials(user.name)}
                    </div>
                  )}
                </div>
              </div>

              {/* User Info */}
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">{user.name}</h1>
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-white/90">
                  <div className="flex items-center gap-2">
                    <Mail size={18} />
                    <span className="text-sm sm:text-base">{user.email}</span>
                  </div>
                  {user.phone && (
                    <div className="flex items-center gap-2">
                      <Phone size={18} />
                      <span className="text-sm sm:text-base">{user.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-white/20 hover:bg-[#1c3163] text-white px-4 py-2 rounded-lg transition-colors backdrop-blur-sm bg-[#1c3163]"
              >
                <LogOut size={18} />
                <span className="text-sm sm:text-base">Logout</span>
              </button>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="border-b border-gray-200 bg-white">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab("profile")}
                className={`
                  flex-1 px-6 py-4 text-sm font-medium text-center border-b-2 transition-colors
                  ${activeTab === "profile"
                    ? "border-[#D5B584] text-[#D5B584] bg-[#FEF9F5]"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }
                `}
              >
                <User size={20} className="inline-block mr-2" />
                Profile
              </button>
              <button
                onClick={() => setActiveTab("orders")}
                className={`
                  flex-1 px-6 py-4 text-sm font-medium text-center border-b-2 transition-colors
                  ${activeTab === "orders"
                    ? "border-[#D5B584] text-[#D5B584] bg-[#FEF9F5]"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }
                `}
              >
                <Package size={20} className="inline-block mr-2" />
                Orders
              </button>
              <button
                onClick={() => setActiveTab("bookings")}
                className={`
                  flex-1 px-6 py-4 text-sm font-medium text-center border-b-2 transition-colors
                  ${activeTab === "bookings"
                    ? "border-[#D5B584] text-[#D5B584] bg-[#FEF9F5]"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }
                `}
              >
                <Calendar size={20} className="inline-block mr-2" />
                Booked Yoga Sessions
              </button>
              <button
                onClick={() => setActiveTab("bookedEvents")}
                className={`
                  flex-1 px-6 py-4 text-sm font-medium text-center border-b-2 transition-colors
                  ${activeTab === "bookedEvents"
                    ? "border-[#D5B584] text-[#D5B584] bg-[#FEF9F5]"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }
                `}
              >
                <Calendar size={20} className="inline-block mr-2" />
                Booked Events
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6 sm:p-8 lg:p-12">
            {/* Profile Tab */}
            {activeTab === "profile" && (
              <form onSubmit={handleSave} className="space-y-6">
              {/* Personal Information */}
              <div>
                <h2 className="text-[18px] font-bold text-[#1C3163] mb-6 flex items-center gap-2">
                  <User size={24} />
                  Personal Information
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#D5B584] focus:ring-2 focus:ring-[#D5B584]/20 outline-none transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#D5B584] focus:ring-2 focus:ring-[#D5B584]/20 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div>
                <h2 className="text-[18px] font-bold text-[#1C3163] mb-6 flex items-center gap-2">
                  <MapPin size={24} />
                  Address Information
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Street Address
                    </label>
                    <input
                      type="text"
                      value={formData.street}
                      onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#D5B584] focus:ring-2 focus:ring-[#D5B584]/20 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#D5B584] focus:ring-2 focus:ring-[#D5B584]/20 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#D5B584] focus:ring-2 focus:ring-[#D5B584]/20 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Zip Code</label>
                    <input
                      type="text"
                      value={formData.zipCode}
                      onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#D5B584] focus:ring-2 focus:ring-[#D5B584]/20 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                    <input
                      type="text"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#D5B584] focus:ring-2 focus:ring-[#D5B584]/20 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 bg-gradient-to-r from-[#D5B584] to-[#FEC1A2] text-white px-8 py-3 rounded-lg font-semibold hover:from-[#C4A574] hover:to-[#E8B192] transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
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
                <h2 className="text-[18px] font-bold text-[#1C3163] mb-6 flex items-center gap-2">
                  <Package size={24} />
                  My Orders
                </h2>
                {ordersLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-4 border-[#D5B584]/30 border-t-[#D5B584] rounded-full animate-spin" />
                  </div>
                ) : orders.length === 0 ? (
                  <div className="bg-gray-50 rounded-lg p-12 text-center">
                    <Package size={64} className="text-gray-400 mx-auto mb-4" />
                    <h3 className="text-[#1C3163] text-xl font-medium mb-2">No Orders Yet</h3>
                    <p className="text-gray-600 mb-6">You haven&apos;t placed any orders yet.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {orders.map((order) => (
                      <div key={order._id} className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                        <div className="bg-white px-6 py-4 border-b border-gray-200">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="flex items-center gap-4">
                              {getStatusIcon(order.status)}
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-sm text-gray-600">Order ID</p>
                                  {order.couponCode && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                                      <Ticket size={12} />
                                      Coupon Applied
                                    </span>
                                  )}
                                </div>
                                <p className="text-[#1C3163] font-medium">
                                  #{order._id.slice(-8).toUpperCase()}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-col md:items-end gap-2">
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              </span>
                              <p className="text-sm text-gray-600">
                                {new Date(order.createdAt).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="p-6">
                          {/* Admin Message */}
                          {order.currentMessage && (
                            <div className="mb-4 bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                              <div className="flex items-start gap-2">
                                <div className="flex-shrink-0 mt-0.5">
                                  <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                  </svg>
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-blue-800">Latest Update:</p>
                                  <p className="text-sm text-blue-700 mt-1">{order.currentMessage}</p>
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="space-y-4 mb-4">
                            {order.items.map((item, index) => {
                              const handleProductClick = async (e: React.MouseEvent) => {
                                e.preventDefault();
                                try {
                                  const response = await fetch(`/api/products/${item.productId}`);
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
                                  className="flex gap-4 items-start cursor-pointer hover:bg-gray-100 p-2 rounded-md transition-colors"
                                >
                                  {/* Product Image */}
                                  {item.imageUrl && item.imageUrl.length > 0 && item.imageUrl[0] && (() => {
                                    const normalizeImageUrl = (url: string): string => {
                                      if (!url) return "";
                                      if (url.startsWith("data:image")) return url;
                                      if (url.startsWith("http://") || url.startsWith("https://")) return url;
                                      return `data:image/jpeg;base64,${url}`;
                                    };
                                    
                                    return (
                                      <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-md overflow-hidden flex-shrink-0 border border-gray-200">
                                        <Image
                                          src={normalizeImageUrl(item.imageUrl[0])}
                                          alt={item.name}
                                          fill
                                          className="object-cover"
                                          unoptimized
                                        />
                                      </div>
                                    );
                                  })()}
                                  <div className="flex-1">
                                    <p className="text-[#1C3163] font-medium">{item.name}</p>
                                    <p className="text-sm text-gray-600">
                                      Quantity: {item.quantity} {item.isSet ? '(Set)' : '(Piece)'}
                                    </p>
                                  </div>
                                  <p className="text-[#1C3163] font-medium">
                                    ${(item.price * item.quantity).toFixed(2)}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                          <div className="border-t border-gray-200 pt-4 mt-4 space-y-2">
                            {order.deliveryCharges && (
                              <>
                                <div className="flex justify-between items-center text-sm">
                                  <p className="text-gray-600">Product Total</p>
                                  <p className="text-[#1C3163] font-medium">
                                    ${order.productTotal ? order.productTotal.toFixed(2) : order.amount.toFixed(2)}
                                  </p>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                  <p className="text-gray-600">Delivery ({order.deliveryCharges.method})</p>
                                  <p className="text-[#1C3163] font-medium">
                                    ${order.deliveryCharges.total.toFixed(2)}
                                  </p>
                                </div>
                                {order.deliveryCharges.breakdown && (
                                  <p className="text-xs text-gray-500 italic pl-4">
                                    {order.deliveryCharges.breakdown}
                                  </p>
                                )}
                              </>
                            )}
                            {order.discountAmount && order.discountAmount > 0 && (
                              <div className="flex justify-between items-center text-sm">
                                <div className="flex items-center gap-2">
                                  <p className="text-gray-600">Discount</p>
                                  {order.couponCode && (
                                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                                      Coupon Applied: {order.couponCode}
                                    </span>
                                  )}
                                </div>
                                <p className="text-green-600 font-medium">
                                  -${order.discountAmount.toFixed(2)}
                                </p>
                              </div>
                            )}
                            <div className="flex justify-between items-center pt-2 border-t border-gray-300">
                              <p className="text-[#1C3163] font-semibold text-lg">Total Amount (SGD)</p>
                              <p className="text-[#1C3163] font-semibold text-xl">
                                ${order.amount.toFixed(2)}
                              </p>
                            </div>
                            {order.paymentProvider && (
                              <p className="text-sm text-gray-600 mt-2">
                                Paid via {order.paymentProvider.charAt(0).toUpperCase() + order.paymentProvider.slice(1)}
                              </p>
                            )}
                            {order.customerComments && (
                              <div className="mt-4 pt-4 border-t border-gray-200">
                                <p className="text-sm font-medium text-gray-700 mb-1">Your Comments:</p>
                                <p className="text-sm text-gray-600 italic">{order.customerComments}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Load More Button */}
                    {hasMoreOrders && (
                      <div className="text-center py-6">
                        <button
                          onClick={handleLoadMoreOrders}
                          disabled={isLoadingMore}
                          className="bg-[#1C3163] text-white px-6 py-2 rounded-lg hover:bg-[#152747] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                <h2 className="text-[18px] font-bold text-[#1C3163] mb-6 flex items-center gap-2">
                  <Calendar size={24} />
                  Booked Yoga Sessions
                </h2>
                {bookingsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-4 border-[#D5B584]/30 border-t-[#D5B584] rounded-full animate-spin" />
                  </div>
                ) : bookings.length === 0 ? (
                  <div className="bg-gray-50 rounded-lg p-12 text-center">
                    <Calendar size={64} className="text-gray-400 mx-auto mb-4" />
                    <h3 className="text-[#1C3163] text-xl font-medium mb-2">No Bookings Yet</h3>
                    <p className="text-gray-600 mb-6">You haven&apos;t booked any yoga sessions yet.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {bookings.map((booking) => (
                      <div key={booking._id} className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                        <div className="bg-white px-6 py-4 border-b border-gray-200">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="flex items-center gap-4">
                              {getStatusIcon(booking.status)}
                              <div>
                                <p className="text-sm text-gray-600">Booking ID</p>
                                <p className="text-[#1C3163] font-medium">
                                  #{booking._id.slice(-8).toUpperCase()}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-col md:items-end gap-2">
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                              </span>
                              <p className="text-sm text-gray-600">
                                {new Date(booking.createdAt).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="p-6">
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Session Type:</span>
                              <span className="text-[#1C3163] font-medium capitalize">{booking.sessionType}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Seats:</span>
                              <span className="text-[#1C3163] font-medium">{booking.seats}</span>
                            </div>
                            {booking.amount > 0 && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Amount:</span>
                                <span className="text-[#1C3163] font-medium">${booking.amount.toFixed(2)}</span>
                              </div>
                            )}
                            {booking.comment && (
                              <div className="pt-3 border-t border-gray-200">
                                <p className="text-sm text-gray-600 mb-1">Details:</p>
                                <p className="text-[#1C3163]">{booking.comment}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {hasMoreBookings && (
                      <div className="text-center py-6">
                        <button
                          onClick={handleLoadMoreBookings}
                          disabled={isLoadingMoreBookings}
                          className="bg-[#1C3163] text-white px-6 py-2 rounded-lg hover:bg-[#152747] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isLoadingMoreBookings ? "Loading..." : "Load More Bookings"}
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
                <h2 className="text-[18px] font-bold text-[#1C3163] mb-6 flex items-center gap-2">
                  <Calendar size={24} />
                  Booked Events
                </h2>
                {eventBookingsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-4 border-[#D5B584]/30 border-t-[#D5B584] rounded-full animate-spin" />
                  </div>
                ) : eventBookings.length === 0 ? (
                  <div className="bg-gray-50 rounded-lg p-12 text-center">
                    <Calendar size={64} className="text-gray-400 mx-auto mb-4" />
                    <h3 className="text-[#1C3163] text-xl font-medium mb-2">No Event Bookings Yet</h3>
                    <p className="text-gray-600 mb-6">You haven&apos;t booked any events yet.</p>
                    <button
                      onClick={() => router.push("/events")}
                      className="bg-[#1C3163] text-white px-6 py-2 rounded-lg hover:bg-[#152747] transition-colors"
                    >
                      Browse Events
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {eventBookings.map((booking) => (
                      <div key={booking._id} className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                        <div className="bg-white px-6 py-4 border-b border-gray-200">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="flex items-center gap-4">
                              {getStatusIcon(booking.status)}
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-sm text-gray-600">Booking ID</p>
                                  {booking.couponCode && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                                      <Ticket size={12} />
                                      Coupon Applied
                                    </span>
                                  )}
                                </div>
                                <p className="text-[#1C3163] font-medium">
                                  #{booking._id.slice(-8).toUpperCase()}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-col md:items-end gap-2">
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                              </span>
                              <p className="text-sm text-gray-600">
                                {new Date(booking.createdAt).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="p-6">
                          <div className="space-y-3">
                            {booking.event && (
                              <>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Event:</span>
                                  <span className="text-[#1C3163] font-medium">{booking.event.title}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Date:</span>
                                  <span className="text-[#1C3163] font-medium">{booking.event.date}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Time:</span>
                                  <span className="text-[#1C3163] font-medium">{booking.event.time}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Location:</span>
                                  <span className="text-[#1C3163] font-medium">{booking.event.location}</span>
                                </div>
                              </>
                            )}
                            <div className="flex justify-between">
                              <span className="text-gray-600">Slots:</span>
                              <span className="text-[#1C3163] font-medium">{booking.seats}</span>
                            </div>
                            {booking.discountAmount && booking.discountAmount > 0 && (
                              <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-200">
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-600">Discount</span>
                                  {booking.couponCode && (
                                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                                      {booking.couponCode}
                                    </span>
                                  )}
                                </div>
                                <span className="text-green-600 font-medium">
                                  -SGD ${booking.discountAmount.toFixed(2)}
                                </span>
                              </div>
                            )}
                            {booking.amount > 0 && (
                              <div className="flex justify-between pt-3 border-t border-gray-200">
                                <span className="text-gray-600 font-medium">Total Amount:</span>
                                <span className="text-[#1C3163] font-semibold">SGD ${booking.amount.toFixed(2)}</span>
                              </div>
                            )}
                            {booking.comment && (
                              <div className="pt-3 border-t border-gray-200">
                                <p className="text-sm text-gray-600 mb-1">Details:</p>
                                <p className="text-[#1C3163]">{booking.comment}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {hasMoreEventBookings && (
                      <div className="text-center py-6">
                        <button
                          onClick={handleLoadMoreEventBookings}
                          disabled={isLoadingMoreEventBookings}
                          className="bg-[#1C3163] text-white px-6 py-2 rounded-lg hover:bg-[#152747] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isLoadingMoreEventBookings ? "Loading..." : "Load More Events"}
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
