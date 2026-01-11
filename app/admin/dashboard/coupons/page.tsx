"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, X, Check } from "lucide-react";
import toast from "react-hot-toast";

type Category = {
  _id: string;
  name: string;
};

type Event = {
  _id: string;
  title: string;
  name: string;
  date?: string;
};

type Product = {
  _id: string;
  name: string;
  price?: number;
};

type ProductCoupon = {
  _id: string;
  couponCode: string;
  couponName: string;
  discountType: "percentage" | "amount";
  discountPercent?: number;
  discountAmount?: number;
  expiryDate: string;
  excludedCategories?: Category[];
  excludedProducts?: Product[];
  usageLimit?: number | null;
  usedCount?: number;
  perUserLimit?: number | null;
  userUsage?: Array<{ userId: string | { _id: string }; count: number; lastUsedAt: string }>;
  isActive: boolean;
  createdAt: string;
};

type EventCoupon = {
  _id: string;
  couponCode: string;
  couponName: string;
  discountType: "percentage" | "amount";
  discountPercent?: number;
  discountAmount?: number;
  expiryDate: string;
  excludedEvents?: Event[];
  usageLimit?: number | null;
  usedCount?: number;
  perUserLimit?: number | null;
  userUsage?: Array<{ userId: string | { _id: string }; count: number; lastUsedAt: string }>;
  isActive: boolean;
  createdAt: string;
};

export default function CouponsPage() {
  const [activeTab, setActiveTab] = useState<"product" | "event" | "expired">("product");
  const [productCoupons, setProductCoupons] = useState<ProductCoupon[]>([]);
  const [eventCoupons, setEventCoupons] = useState<EventCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    couponCode: "",
    couponName: "",
    discountType: "percentage" as "percentage" | "amount",
    discountPercent: "",
    discountAmount: "",
    expiryDate: "",
    excludedCategories: [] as string[],
    excludedProducts: [] as string[],
    excludedEvents: [] as string[],
    usageLimit: "",
    perUserLimit: "",
    isActive: true,
  });

  // Fetch categories for product coupons
  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await fetch("/api/admin/categories");
      const data = await response.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    } finally {
      setLoadingCategories(false);
    }
  };

  // Fetch products for product coupons (exclude universal products)
  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      const response = await fetch("/api/products?limit=1000&excludeImages=true");
      const data = await response.json();
      if (data.success) {
        // Filter out universal products - they shouldn't be eligible for coupons anyway
        const regularProducts = data.data.filter((product: Product & { relativeproduct?: boolean }) => 
          !product.relativeproduct
        );
        setProducts(regularProducts);
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Fetch events for event coupons (only upcoming events)
  const fetchEvents = async () => {
    try {
      setLoadingEvents(true);
      const response = await fetch("/api/admin/events");
      const data = await response.json();
      if (data.success) {
        // Filter to only show upcoming events (events with dates >= today)
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to start of day for comparison
        
        const upcomingEvents = data.data.filter((event: Event) => {
          if (!event.date) return false;
          
          // Parse event date (could be in YYYY-MM-DD format or other formats)
          let eventDate: Date;
          if (/^\d{4}-\d{2}-\d{2}$/.test(event.date)) {
            // YYYY-MM-DD format
            eventDate = new Date(event.date + 'T00:00:00');
          } else {
            // Try parsing other formats
            eventDate = new Date(event.date);
          }
          
          // Check if date is valid
          if (isNaN(eventDate.getTime())) return false;
          
          eventDate.setHours(0, 0, 0, 0);
          return eventDate >= today;
        });
        
        setEvents(upcomingEvents);
      }
    } catch (error) {
      console.error("Failed to fetch events:", error);
    } finally {
      setLoadingEvents(false);
    }
  };

  // Fetch product coupons
  const fetchProductCoupons = async () => {
    try {
      const response = await fetch("/api/admin/coupons/products");
      const data = await response.json();
      if (data.success) {
        setProductCoupons(data.data);
      } else {
        toast.error(data.message || "Failed to fetch product coupons");
      }
    } catch (error) {
      console.error("Failed to fetch product coupons:", error);
      toast.error("Failed to fetch product coupons");
    }
  };

  // Fetch event coupons
  const fetchEventCoupons = async () => {
    try {
      const response = await fetch("/api/admin/coupons/events");
      const data = await response.json();
      if (data.success) {
        setEventCoupons(data.data);
      } else {
        toast.error(data.message || "Failed to fetch event coupons");
      }
    } catch (error) {
      console.error("Failed to fetch event coupons:", error);
      toast.error("Failed to fetch event coupons");
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      if (activeTab === "product") {
        await Promise.all([fetchProductCoupons(), fetchCategories()]);
      } else if (activeTab === "event") {
        await Promise.all([fetchEventCoupons(), fetchEvents()]);
      } else if (activeTab === "expired") {
        // For expired tab, fetch both types
        await Promise.all([fetchProductCoupons(), fetchEventCoupons()]);
      }
      setLoading(false);
    };
    loadData();
  }, [activeTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.couponCode || !formData.couponName || !formData.expiryDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Validate discount based on type
    if (formData.discountType === "percentage") {
      if (!formData.discountPercent) {
        toast.error("Please enter discount percentage");
        return;
      }
      const discount = parseFloat(formData.discountPercent);
      if (isNaN(discount) || discount < 0 || discount > 100) {
        toast.error("Discount percentage must be between 0 and 100");
        return;
      }
    } else {
      if (!formData.discountAmount) {
        toast.error("Please enter discount amount");
        return;
      }
      const amount = parseFloat(formData.discountAmount);
      if (isNaN(amount) || amount < 0) {
        toast.error("Discount amount must be greater than 0");
        return;
      }
    }

    try {
      const url = activeTab === "product" 
        ? "/api/admin/coupons/products"
        : "/api/admin/coupons/events";
      
      const baseBody = {
        couponCode: formData.couponCode,
        couponName: formData.couponName,
        discountType: formData.discountType,
        expiryDate: formData.expiryDate,
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
        isActive: formData.isActive,
      };

      // Add discount value based on type
      if (formData.discountType === "percentage") {
        (baseBody as any).discountPercent = parseFloat(formData.discountPercent);
      } else {
        (baseBody as any).discountAmount = parseFloat(formData.discountAmount);
      }
      
      const body = activeTab === "product"
        ? {
            ...baseBody,
            excludedCategories: formData.excludedCategories,
            excludedProducts: formData.excludedProducts,
            perUserLimit: formData.perUserLimit ? parseInt(formData.perUserLimit) : null,
          }
        : {
            ...baseBody,
            excludedEvents: formData.excludedEvents,
          };

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success("Coupon created successfully!");
        setShowForm(false);
        resetForm();
        if (activeTab === "product") {
          fetchProductCoupons();
        } else {
          fetchEventCoupons();
        }
      } else {
        toast.error(data.message || "Failed to create coupon");
      }
    } catch (error) {
      console.error("Failed to create coupon:", error);
      toast.error("Failed to create coupon");
    }
  };

  const handleDelete = async (id: string, customUrl?: string) => {
    if (!confirm("Are you sure you want to delete this coupon?")) {
      return;
    }

    try {
      const url = customUrl || (activeTab === "product"
        ? `/api/admin/coupons/products/${id}`
        : `/api/admin/coupons/events/${id}`);

      const response = await fetch(url, {
        method: "DELETE",
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success("Coupon deleted successfully!");
        if (activeTab === "product") {
          fetchProductCoupons();
        } else if (activeTab === "event") {
          fetchEventCoupons();
        } else if (activeTab === "expired") {
          // For expired tab, refresh both
          await Promise.all([fetchProductCoupons(), fetchEventCoupons()]);
        }
      } else {
        toast.error(data.message || "Failed to delete coupon");
      }
    } catch (error) {
      console.error("Failed to delete coupon:", error);
      toast.error("Failed to delete coupon");
    }
  };

  const resetForm = () => {
    setFormData({
      couponCode: "",
      couponName: "",
      discountType: "percentage",
      discountPercent: "",
      discountAmount: "",
      expiryDate: "",
      excludedCategories: [],
      excludedProducts: [],
      excludedEvents: [],
      usageLimit: "",
      perUserLimit: "",
      isActive: true,
    });
  };

  // Calculate statistics
  const calculateStatistics = () => {
    const coupons = activeTab === "product" ? productCoupons : eventCoupons;
    const now = new Date();
    
    const totalCoupons = coupons.length;
    const activeCoupons = coupons.filter(c => c.isActive && new Date(c.expiryDate) >= now).length;
    const expiredCoupons = coupons.filter(c => new Date(c.expiryDate) < now).length;
    const totalUsage = coupons.reduce((sum, c) => sum + (c.usedCount || 0), 0);
    
    // Count unique users who used coupons
    const uniqueUsers = new Set<string>();
    coupons.forEach(coupon => {
      if (coupon.userUsage && coupon.userUsage.length > 0) {
        coupon.userUsage.forEach(usage => {
          const userId = typeof usage.userId === 'string' ? usage.userId : usage.userId._id;
          uniqueUsers.add(userId);
        });
      }
    });

    return {
      totalCoupons,
      activeCoupons,
      expiredCoupons,
      totalUsage,
      uniqueUsers: uniqueUsers.size,
    };
  };

  const stats = calculateStatistics();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const isExpired = (dateString: string) => {
    return new Date(dateString) < new Date();
  };

  const toggleCategorySelection = (categoryId: string) => {
    setFormData((prev) => ({
      ...prev,
      excludedCategories: prev.excludedCategories.includes(categoryId)
        ? prev.excludedCategories.filter((id) => id !== categoryId)
        : [...prev.excludedCategories, categoryId],
    }));
  };

  const toggleProductSelection = (productId: string) => {
    setFormData((prev) => ({
      ...prev,
      excludedProducts: prev.excludedProducts.includes(productId)
        ? prev.excludedProducts.filter((id) => id !== productId)
        : [...prev.excludedProducts, productId],
    }));
  };

  const toggleEventSelection = (eventId: string) => {
    setFormData((prev) => ({
      ...prev,
      excludedEvents: prev.excludedEvents.includes(eventId)
        ? prev.excludedEvents.filter((id) => id !== eventId)
        : [...prev.excludedEvents, eventId],
    }));
  };

  // Get expired coupons (both product and event)
  const getExpiredCoupons = () => {
    const allExpiredCoupons: Array<{
      _id: string;
      type: "product" | "event";
      couponCode: string;
      couponName: string;
      discountType: "percentage" | "amount";
      discountPercent?: number;
      discountAmount?: number;
      expiryDate: string;
      excludedCategories?: Category[];
      excludedEvents?: Event[];
      usageLimit?: number | null;
      usedCount?: number;
      perUserLimit?: number | null;
      userUsage?: Array<{ userId: string | { _id: string }; count: number; lastUsedAt: string }>;
      isActive: boolean;
      createdAt: string;
    }> = [];

    // Add expired product coupons
    productCoupons
      .filter(coupon => isExpired(coupon.expiryDate))
      .forEach(coupon => {
        allExpiredCoupons.push({
          ...coupon,
          type: "product",
        });
      });

    // Add expired event coupons
    eventCoupons
      .filter(coupon => isExpired(coupon.expiryDate))
      .forEach(coupon => {
        allExpiredCoupons.push({
          ...coupon,
          type: "event",
        });
      });

    // Sort by expiry date (most recently expired first)
    return allExpiredCoupons.sort((a, b) => {
      const dateA = new Date(a.expiryDate).getTime();
      const dateB = new Date(b.expiryDate).getTime();
      return dateB - dateA;
    });
  };

  const expiredCoupons = activeTab === "expired" ? getExpiredCoupons() : [];
  const currentCoupons = activeTab === "product" 
    ? productCoupons 
    : activeTab === "event" 
    ? eventCoupons 
    : expiredCoupons;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Coupon Management</h1>
        <p className="text-zinc-400">Manage product and event coupons</p>
      </div>

      {/* Statistics */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="rounded-lg bg-zinc-800 p-4">
          <div className="text-sm text-zinc-400 mb-1">Total Coupons</div>
          <div className="text-2xl font-bold text-white">{stats.totalCoupons}</div>
        </div>
        <div className="rounded-lg bg-zinc-800 p-4">
          <div className="text-sm text-zinc-400 mb-1">Active</div>
          <div className="text-2xl font-bold text-green-400">{stats.activeCoupons}</div>
        </div>
        <div className="rounded-lg bg-zinc-800 p-4">
          <div className="text-sm text-zinc-400 mb-1">Expired</div>
          <div className="text-2xl font-bold text-red-400">{stats.expiredCoupons}</div>
        </div>
        <div className="rounded-lg bg-zinc-800 p-4">
          <div className="text-sm text-zinc-400 mb-1">Total Usage</div>
          <div className="text-2xl font-bold text-white">{stats.totalUsage}</div>
        </div>
        <div className="rounded-lg bg-zinc-800 p-4">
          <div className="text-sm text-zinc-400 mb-1">Unique Users</div>
          <div className="text-2xl font-bold text-white">{stats.uniqueUsers}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-zinc-800">
        <div className="flex gap-4">
          <button
            onClick={() => {
              setActiveTab("product");
              setShowForm(false);
              resetForm();
            }}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "product"
                ? "text-white border-b-2 border-white"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Product Coupons
          </button>
          <button
            onClick={() => {
              setActiveTab("event");
              setShowForm(false);
              resetForm();
            }}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "event"
                ? "text-white border-b-2 border-white"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Event Coupons
          </button>
          <button
            onClick={() => {
              setActiveTab("expired");
              setShowForm(false);
              resetForm();
            }}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "expired"
                ? "text-white border-b-2 border-white"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Expired Coupons
          </button>
        </div>
      </div>

      {/* Add Coupon Button */}
      {!showForm && activeTab !== "expired" && (
        <button
          onClick={() => setShowForm(true)}
          className="mb-6 flex items-center gap-2 rounded-md bg-white px-4 py-2 text-black hover:bg-zinc-200 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add {activeTab === "product" ? "Product" : "Event"} Coupon
        </button>
      )}

      {/* Create Form */}
      {showForm && (
        <div className="mb-6 rounded-lg bg-zinc-800 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">
              Create {activeTab === "product" ? "Product" : "Event"} Coupon
            </h2>
            <button
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
              className="text-zinc-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white mb-1">
                  Coupon Code *
                </label>
                <input
                  type="text"
                  required
                  value={formData.couponCode}
                  onChange={(e) =>
                    setFormData({ ...formData, couponCode: e.target.value.toUpperCase() })
                  }
                  className="w-full rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 text-white"
                  placeholder="SAVE10"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-1">
                  Coupon Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.couponName}
                  onChange={(e) =>
                    setFormData({ ...formData, couponName: e.target.value })
                  }
                  className="w-full rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 text-white"
                  placeholder="Summer Sale"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-1">
                  Discount Type *
                </label>
                <select
                  required
                  value={formData.discountType}
                  onChange={(e) =>
                    setFormData({ 
                      ...formData, 
                      discountType: e.target.value as "percentage" | "amount",
                      discountPercent: "",
                      discountAmount: "",
                    })
                  }
                  className="w-full rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 text-white"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="amount">Fixed Amount (SGD)</option>
                </select>
              </div>

              {formData.discountType === "percentage" ? (
                <div>
                  <label className="block text-sm font-medium text-white mb-1">
                    Discount Percentage * (0-100%)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.discountPercent}
                    onChange={(e) =>
                      setFormData({ ...formData, discountPercent: e.target.value })
                    }
                    className="w-full rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 text-white"
                    placeholder="10"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-white mb-1">
                    Discount Amount * (SGD)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.discountAmount}
                    onChange={(e) =>
                      setFormData({ ...formData, discountAmount: e.target.value })
                    }
                    className="w-full rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 text-white"
                    placeholder="50"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-white mb-1">
                  Expiry Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.expiryDate}
                  onChange={(e) =>
                    setFormData({ ...formData, expiryDate: e.target.value })
                  }
                  className="w-full rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-1">
                  Total Usage Limit (optional)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.usageLimit}
                  onChange={(e) =>
                    setFormData({ ...formData, usageLimit: e.target.value })
                  }
                  className="w-full rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 text-white"
                  placeholder="Leave empty for unlimited"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-1">
                  Per User Limit (optional)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.perUserLimit}
                  onChange={(e) =>
                    setFormData({ ...formData, perUserLimit: e.target.value })
                  }
                  className="w-full rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 text-white"
                  placeholder="Leave empty for unlimited per user"
                />
                <p className="mt-1 text-xs text-zinc-400">How many times a single user can use this coupon</p>
              </div>

              <div className="flex items-center">
                <label className="flex items-center gap-2 text-sm font-medium text-white">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                    className="rounded border-zinc-600"
                  />
                  Active
                </label>
              </div>
            </div>

            {/* Excluded Categories (Product Coupons) */}
            {activeTab === "product" && (
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Exclude Categories (products in these categories won't be eligible)
                </label>
                {loadingCategories ? (
                  <p className="text-zinc-400">Loading categories...</p>
                ) : categories.length === 0 ? (
                  <p className="text-zinc-400">No categories available</p>
                ) : (
                  <div className="max-h-48 overflow-y-auto rounded-md border border-zinc-600 bg-zinc-900 p-3">
                    {categories.map((category) => (
                      <label
                        key={category._id}
                        className="flex items-center gap-2 py-1 text-white"
                      >
                        <input
                          type="checkbox"
                          checked={formData.excludedCategories.includes(category._id)}
                          onChange={() => toggleCategorySelection(category._id)}
                          className="rounded border-zinc-600"
                        />
                        {category.name}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Excluded Products (Product Coupons) */}
            {activeTab === "product" && (
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Exclude Products (these specific products won't be eligible for this coupon code)
                </label>
                {loadingProducts ? (
                  <p className="text-zinc-400">Loading products...</p>
                ) : products.length === 0 ? (
                  <p className="text-zinc-400">No products available</p>
                ) : (
                  <div className="max-h-48 overflow-y-auto rounded-md border border-zinc-600 bg-zinc-900 p-3">
                    {products.map((product) => (
                      <label
                        key={product._id}
                        className="flex items-center gap-2 py-1 text-white"
                      >
                        <input
                          type="checkbox"
                          checked={formData.excludedProducts.includes(product._id)}
                          onChange={() => toggleProductSelection(product._id)}
                          className="rounded border-zinc-600"
                        />
                        <span className="flex-1">{product.name}</span>
                        {product.price && (
                          <span className="text-zinc-400 text-sm">${product.price.toFixed(2)}</span>
                        )}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Excluded Events (Event Coupons) */}
            {activeTab === "event" && (
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Exclude Events (these events won't be eligible for this coupon)
                </label>
                {loadingEvents ? (
                  <p className="text-zinc-400">Loading events...</p>
                ) : events.length === 0 ? (
                  <p className="text-zinc-400">No events available</p>
                ) : (
                  <div className="max-h-48 overflow-y-auto rounded-md border border-zinc-600 bg-zinc-900 p-3">
                    {events.map((event) => (
                      <label
                        key={event._id}
                        className="flex items-center gap-2 py-1 text-white"
                      >
                        <input
                          type="checkbox"
                          checked={formData.excludedEvents.includes(event._id)}
                          onChange={() => toggleEventSelection(event._id)}
                          className="rounded border-zinc-600"
                        />
                        {event.title || event.name}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                className="rounded-md bg-white px-4 py-2 text-black hover:bg-zinc-200 transition-colors"
              >
                Create Coupon
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="rounded-md border border-zinc-600 px-4 py-2 text-white hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Coupons List */}
      {loading ? (
        <div className="text-center py-8 text-zinc-400">Loading...</div>
      ) : currentCoupons.length === 0 ? (
        <div className="text-center py-8 text-zinc-400">
          No {activeTab === "product" ? "product" : "event"} coupons found
        </div>
      ) : (
        <div className="rounded-lg bg-zinc-800 overflow-hidden">
          <table className="w-full">
            <thead className="bg-zinc-900">
              <tr>
                {activeTab === "expired" && (
                  <th className="px-4 py-3 text-left text-sm font-medium text-white">Type</th>
                )}
                <th className="px-4 py-3 text-left text-sm font-medium text-white">Code</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-white">Name</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-white">Discount</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-white">Expiry Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-white">
                  {activeTab === "expired" ? "Exclusions" : activeTab === "product" ? "Excluded Categories/Products" : "Excluded Events"}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-white">Total Usage</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-white">Per User Limit</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-white">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-white">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-700">
              {currentCoupons.map((coupon: any) => {
                const expired = isExpired(coupon.expiryDate);
                const usageLimitReached = coupon.usageLimit && coupon.usedCount && coupon.usedCount >= coupon.usageLimit;
                const couponType = activeTab === "expired" ? coupon.type : (activeTab === "product" ? "product" : "event");
                
                return (
                  <tr key={coupon._id} className="hover:bg-zinc-700/50">
                    {activeTab === "expired" && (
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                          couponType === "product" 
                            ? "bg-blue-500/20 text-blue-400" 
                            : "bg-purple-500/20 text-purple-400"
                        }`}>
                          {couponType === "product" ? "Product" : "Event"}
                        </span>
                      </td>
                    )}
                    <td className="px-4 py-3 text-white font-mono">{coupon.couponCode}</td>
                    <td className="px-4 py-3 text-white">{coupon.couponName}</td>
                    <td className="px-4 py-3 text-white">
                      {coupon.discountType === "percentage" 
                        ? `${coupon.discountPercent || 0}%`
                        : `SGD ${coupon.discountAmount || 0}`
                      }
                    </td>
                    <td className={`px-4 py-3 ${expired ? "text-red-400" : "text-white"}`}>
                      {formatDate(coupon.expiryDate)}
                      {expired && " (Expired)"}
                    </td>
                    <td className="px-4 py-3 text-white">
                      {couponType === "product" ? (
                        <div className="space-y-1">
                          {coupon.excludedCategories && coupon.excludedCategories.length > 0 && (
                            <div className="text-sm">
                              <span className="text-zinc-400">Categories: </span>
                              <span>{coupon.excludedCategories.map((cat: any) => cat.name).join(", ")}</span>
                            </div>
                          )}
                          {coupon.excludedProducts && coupon.excludedProducts.length > 0 && (
                            <div className="text-sm">
                              <span className="text-zinc-400">Products: </span>
                              <span>{coupon.excludedProducts.map((prod: any) => prod.name || prod).join(", ")}</span>
                            </div>
                          )}
                          {(!coupon.excludedCategories || coupon.excludedCategories.length === 0) &&
                           (!coupon.excludedProducts || coupon.excludedProducts.length === 0) && (
                            <span className="text-zinc-400 text-sm">None</span>
                          )}
                        </div>
                      ) : (
                        coupon.excludedEvents && coupon.excludedEvents.length > 0 ? (
                          <span className="text-sm">
                            {coupon.excludedEvents.map((evt: any) => evt.title || evt.name).join(", ")}
                          </span>
                        ) : (
                          <span className="text-zinc-400 text-sm">None</span>
                        )
                      )}
                    </td>
                    <td className="px-4 py-3 text-white">
                      {coupon.usedCount || 0}
                      {coupon.usageLimit ? ` / ${coupon.usageLimit}` : " / ∞"}
                      {usageLimitReached && (
                        <span className="ml-1 text-red-400 text-xs">(Limit Reached)</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-white">
                      {coupon.perUserLimit ? `${coupon.perUserLimit} per user` : "Unlimited per user"}
                      {coupon.userUsage && coupon.userUsage.length > 0 && (
                        <span className="block text-xs text-zinc-400 mt-1">
                          {coupon.userUsage.length} user{coupon.userUsage.length !== 1 ? 's' : ''} used
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                          coupon.isActive && !expired && !usageLimitReached
                            ? "bg-green-500/20 text-green-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {coupon.isActive && !expired && !usageLimitReached ? (
                          <>
                            <Check className="h-3 w-3" />
                            Active
                          </>
                        ) : (
                          "Inactive"
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => {
                          // For expired tab, we need to use the correct API endpoint based on type
                          if (activeTab === "expired") {
                            const url = couponType === "product"
                              ? `/api/admin/coupons/products/${coupon._id}`
                              : `/api/admin/coupons/events/${coupon._id}`;
                            handleDelete(coupon._id, url);
                          } else {
                            handleDelete(coupon._id);
                          }
                        }}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

