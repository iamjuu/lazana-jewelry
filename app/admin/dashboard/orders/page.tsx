"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { 
  Package, 
  Clock, 
  CheckCircle, 
  Truck, 
  XCircle,
  DollarSign,
  User,
  MapPin,
  Calendar,
  Eye,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import toast from "react-hot-toast";

type PaymentStatus = "pending" | "paid" | "cancelled" | "failed";
type DeliveryStatus = "pending" | "processing" | "ready to ship" | "shipped" | "reached to your country" | "on the way to delivery" | "delivered";

type OrderItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
};

type ShippingAddress = {
  fullName?: string;
  phone?: string;
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  line1?: string;
  line2?: string;
};

type Order = {
  _id: string;
  userId: string;
  items: OrderItem[];
  amount: number;
  currency: string;
  status: PaymentStatus; // Payment status
  deliveryStatus?: DeliveryStatus; // Delivery status
  paymentProvider?: string;
  paymentRef?: string;
  shippingAddress?: ShippingAddress;
  customerEmail?: string;
  customerName?: string;
  currentMessage?: string;
  deliveryStatusHistory?: Array<{ deliveryStatus: DeliveryStatus; message?: string; updatedAt: Date }>;
  createdAt: string;
  updatedAt: string;
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalOrders, setTotalOrders] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [deliveryMessage, setDeliveryMessage] = useState<string>("");
  const [customerMessage, setCustomerMessage] = useState<string>("");
  const [updatingPaymentStatus, setUpdatingPaymentStatus] = useState<string | null>(null); // Track which payment status is being updated
  const [updatingDeliveryStatus, setUpdatingDeliveryStatus] = useState<string | null>(null); // Track which status is being updated
  const [clearingMessage, setClearingMessage] = useState<boolean>(false); // Track if message is being cleared
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    paid: 0,
    cancelled: 0,
    failed: 0,
    totalRevenue: 0,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedOrder) {
        setSelectedOrder(null);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [selectedOrder]);

  useEffect(() => {
    // Reset to page 1 when filter changes, then fetch
    setCurrentPage(1);
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller
    abortControllerRef.current = new AbortController();
    const abortController = abortControllerRef.current;
    
    const fetchData = async () => {
      try {
        setError(null);
        setLoading(true);
        const token = sessionStorage.getItem("adminToken");
        
        // Build query parameters
        const params = new URLSearchParams();
        params.append("page", currentPage.toString());
        params.append("limit", "10");
        if (statusFilter !== "all") {
          params.append("status", statusFilter);
        }
        if (searchQuery.trim()) {
          params.append("search", searchQuery.trim());
        }
        
        const url = `/api/admin/orders?${params.toString()}`;
        
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: abortController.signal,
        });

        if (!response.ok) {
          let errorMessage = "Failed to load orders";
          if (response.status === 404) {
            errorMessage = "Orders API endpoint not found. Please check if the API route exists.";
          } else if (response.status === 401 || response.status === 403) {
            errorMessage = "Unauthorized. Please log in again.";
          } else {
            errorMessage = `Failed to load orders (Error ${response.status})`;
          }
          setError(errorMessage);
          toast.error(errorMessage);
          setOrders([]);
          setLoading(false);
          return;
        }

        const data = await response.json();

        if (data.success) {
          const ordersList = data.data?.orders || [];
          setOrders(ordersList);
          setError(null);
          
          if (data.data?.pagination) {
            setTotalPages(data.data.pagination.pages || 1);
            setTotalOrders(data.data.pagination.total || 0);
          }
          
          const stats = {
            total: data.data?.pagination?.total || ordersList.length,
            pending: ordersList.filter((o: Order) => o.status === "pending").length,
            paid: ordersList.filter((o: Order) => o.status === "paid").length,
            cancelled: ordersList.filter((o: Order) => o.status === "cancelled").length,
            failed: ordersList.filter((o: Order) => o.status === "failed").length,
            totalRevenue: ordersList
              .filter((o: Order) => o.status === "paid")
              .reduce((sum: number, o: Order) => sum + o.amount, 0),
          };
          setStats(stats);
        } else {
          const errorMessage = data.message || "Failed to load orders";
          setError(errorMessage);
          toast.error(errorMessage);
          setOrders([]);
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          const errorMessage = "Failed to load orders. Please check your connection.";
          setError(errorMessage);
          toast.error(errorMessage);
          setOrders([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      abortController.abort();
    };
  }, [statusFilter, currentPage, searchQuery]);

  const fetchOrders = async () => {
    try {
      setError(null);
      setLoading(true);
      const token = sessionStorage.getItem("adminToken");
      
      // Build query parameters
      const params = new URLSearchParams();
      params.append("page", currentPage.toString());
      params.append("limit", "10"); // 10 per page
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }
      if (searchQuery.trim()) {
        params.append("search", searchQuery.trim());
      }
      
      const url = `/api/admin/orders?${params.toString()}`;
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        // Handle HTTP error status codes
        let errorMessage = "Failed to load orders";
        if (response.status === 404) {
          errorMessage = "Orders API endpoint not found. Please check if the API route exists.";
          console.error("404 Error: Orders API endpoint not found -", url);
        } else if (response.status === 401 || response.status === 403) {
          errorMessage = "Unauthorized. Please log in again.";
          console.error("Auth Error: Unauthorized access");
        } else {
          errorMessage = `Failed to load orders (Error ${response.status})`;
          console.error(`HTTP Error: ${response.status}`);
        }
        setError(errorMessage);
        toast.error(errorMessage);
        setOrders([]);
        setLoading(false);
        return;
      }

      const data = await response.json();

      if (data.success) {
        const ordersList = data.data?.orders || [];
        setOrders(ordersList);
        setError(null);
        
        // Update pagination
        if (data.data?.pagination) {
          setTotalPages(data.data.pagination.pages || 1);
          setTotalOrders(data.data.pagination.total || 0);
        }
        
        // Calculate stats from current page (for display purposes)
        // Note: For accurate stats, you might want a separate stats API
        const stats = {
          total: data.data?.pagination?.total || ordersList.length,
          pending: ordersList.filter((o: Order) => o.status === "pending").length,
          paid: ordersList.filter((o: Order) => o.status === "paid").length,
          cancelled: ordersList.filter((o: Order) => o.status === "cancelled").length,
          failed: ordersList.filter((o: Order) => o.status === "failed").length,
          totalRevenue: ordersList
            .filter((o: Order) => o.status === "paid")
            .reduce((sum: number, o: Order) => sum + o.amount, 0),
        };
        setStats(stats);
      } else {
        // Handle API-level error (success: false)
        const errorMessage = data.message || "Failed to load orders";
        setError(errorMessage);
        toast.error(errorMessage);
        console.error("API Error:", data.message);
        setOrders([]);
      }
    } catch (error) {
      const errorMessage = "Failed to load orders. Please check your connection.";
      setError(errorMessage);
      console.error("Failed to fetch orders:", error);
      toast.error(errorMessage);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const updatePaymentStatus = async (orderId: string, newStatus: PaymentStatus, message?: string) => {
    setUpdatingPaymentStatus(newStatus); // Set loading state
    try {
      const token = sessionStorage.getItem("adminToken");
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus, message }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Payment status updated successfully");
        fetchOrders();
        if (selectedOrder?._id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: newStatus });
        }
      } else {
        toast.error(data.message || "Failed to update payment status");
      }
    } catch (error) {
      console.error("Failed to update payment status:", error);
      toast.error("Failed to update payment status");
    } finally {
      setUpdatingPaymentStatus(null); // Clear loading state
    }
  };

  const updateDeliveryStatus = async (orderId: string, newDeliveryStatus: DeliveryStatus, message?: string) => {
    setUpdatingDeliveryStatus(newDeliveryStatus); // Set loading state
    try {
      const token = sessionStorage.getItem("adminToken");
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ deliveryStatus: newDeliveryStatus, message }),
      });

      const data = await response.json();

      if (data.success) {
        const emailStatuses = ["processing", "ready to ship", "reached to your country", "delivered"];
        const emailSent = emailStatuses.includes(newDeliveryStatus);
        toast.success(emailSent ? "Delivery status updated and email sent to customer" : "Delivery status updated");
        fetchOrders();
        if (selectedOrder?._id === orderId) {
          // Refresh selected order data to show email status
          const updatedOrder = data.data;
          setSelectedOrder(updatedOrder);
        }
        setDeliveryMessage(""); // Clear message after sending
      } else {
        toast.error(data.message || "Failed to update delivery status");
      }
    } catch (error) {
      console.error("Failed to update delivery status:", error);
      toast.error("Failed to update delivery status");
    } finally {
      setUpdatingDeliveryStatus(null); // Clear loading state
    }
  };

  const updateCustomerMessage = async (orderId: string, message: string) => {
    try {
      const token = sessionStorage.getItem("adminToken");
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message }), // Only message, no status update
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Message updated successfully");
        fetchOrders();
        if (selectedOrder?._id === orderId) {
          setSelectedOrder({ ...selectedOrder, currentMessage: message });
        }
        setCustomerMessage(""); // Clear message after sending
      } else {
        toast.error(data.message || "Failed to update message");
      }
    } catch (error) {
      console.error("Failed to update message:", error);
      toast.error("Failed to update message");
    }
  };

  const clearCustomerMessage = async (orderId: string) => {
    setClearingMessage(true); // Start loading state
    try {
      const token = sessionStorage.getItem("adminToken");
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ clearMessage: true }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Message cleared successfully");
        fetchOrders();
        if (selectedOrder?._id === orderId) {
          const updatedOrder = data.data;
          setSelectedOrder(updatedOrder); // Update with full order data
          setCustomerMessage(""); // Clear message input
        }
      } else {
        toast.error(data.message || "Failed to clear message");
      }
    } catch (error) {
      console.error("Failed to clear message:", error);
      toast.error("Failed to clear message");
    } finally {
      setClearingMessage(false); // End loading state
    }
  };

  const getPaymentStatusBadge = (status: PaymentStatus) => {
    const badges = {
      pending: { bg: "bg-yellow-100", text: "text-yellow-800", icon: Clock },
      paid: { bg: "bg-green-100", text: "text-green-800", icon: CheckCircle },
      cancelled: { bg: "bg-red-100", text: "text-red-800", icon: XCircle },
      failed: { bg: "bg-red-100", text: "text-red-800", icon: XCircle },
    };

    const badge = badges[status];
    if (!badge) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          {status.toUpperCase()}
        </span>
      );
    }

    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        <Icon size={14} />
        {status.toUpperCase()}
      </span>
    );
  };

  const getDeliveryStatusBadge = (deliveryStatus: DeliveryStatus) => {
    const badges = {
      pending: { bg: "bg-gray-100", text: "text-gray-800", icon: Clock },
      processing: { bg: "bg-blue-100", text: "text-blue-800", icon: Package },
      "ready to ship": { bg: "bg-indigo-100", text: "text-indigo-800", icon: Package },
      shipped: { bg: "bg-purple-100", text: "text-purple-800", icon: Truck },
      "reached to your country": { bg: "bg-green-100", text: "text-green-800", icon: Truck },
      "on the way to delivery": { bg: "bg-orange-100", text: "text-orange-800", icon: Truck },
      delivered: { bg: "bg-emerald-100", text: "text-emerald-800", icon: CheckCircle },
    };

    const badge = badges[deliveryStatus];
    if (!badge) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          {deliveryStatus.toUpperCase()}
        </span>
      );
    }

    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        <Icon size={14} />
        {deliveryStatus.charAt(0).toUpperCase() + deliveryStatus.slice(1)}
      </span>
    );
  };

  const formatCurrency = (amount: number, currency: string = "USD") => {
    const amountInMainUnit = amount; // Already in dollars
    if (currency === "USD" || currency === "usd") {
      return `$${amountInMainUnit.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `${currency} ${amountInMainUnit.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-900 p-6 sm:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900 p-6 sm:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Orders Management</h1>
          <p className="text-zinc-400">Manage customer orders and track payments</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-zinc-800 rounded-lg p-6 border border-zinc-700">
            <div className="flex items-center justify-between mb-2">
              <Package className="text-blue-400" size={24} />
              <span className="text-2xl font-bold text-white">{stats.total}</span>
            </div>
            <p className="text-zinc-400 text-sm">Total Orders</p>
          </div>

          <div className="bg-zinc-800 rounded-lg p-6 border border-zinc-700">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="text-green-400" size={24} />
              <span className="text-2xl font-bold text-white">{stats.paid}</span>
            </div>
            <p className="text-zinc-400 text-sm">Paid Orders</p>
          </div>

          <div className="bg-zinc-800 rounded-lg p-6 border border-zinc-700">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="text-yellow-400" size={24} />
              <span className="text-2xl font-bold text-white">
                {formatCurrency(stats.totalRevenue)}
              </span>
            </div>
            <p className="text-zinc-400 text-sm">Total Revenue</p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-zinc-800 rounded-lg p-4 mb-6 border border-zinc-700">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" size={20} />
                <input
                  type="text"
                  placeholder="Search by customer name, email, payment ref, or product..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            {/* Status Filter */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Filter className="text-zinc-400" size={20} />
                <span className="text-white font-medium">Status:</span>
              </div>
              {["all", "pending", "paid", "cancelled", "failed"].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    statusFilter === status
                      ? "bg-blue-600 text-white"
                      : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-red-400 font-semibold mb-1">Error Loading Orders</h3>
                <p className="text-red-300 text-sm">{error}</p>
              </div>
              <button
                onClick={fetchOrders}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Orders Table */}
        <div className="bg-zinc-800 rounded-lg border border-zinc-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-900 border-b border-zinc-700">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-700">
                {orders.length === 0 && !loading && !error ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-zinc-400">
                      <div className="flex flex-col items-center gap-2">
                        <Package size={48} className="text-zinc-600" />
                        <p className="text-lg font-medium">No orders found</p>
                        <p className="text-sm text-zinc-500">
                          {statusFilter === "all" 
                            ? "You don't have any orders yet." 
                            : `No orders with status "${statusFilter}" found.`}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : orders.length === 0 && error ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-zinc-400">
                      <p className="text-red-400">Unable to load orders. Please try again.</p>
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order._id} className="hover:bg-zinc-750 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-mono text-blue-400">
                          {order._id.slice(-8).toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="font-medium text-white">
                            {order.customerName || "N/A"}
                          </div>
                          <div className="text-zinc-400 text-xs">
                            {order.customerEmail || "N/A"}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-zinc-300">
                          {order.items.length} item(s)
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-white">
                          {formatCurrency(order.amount, order.currency)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="text-zinc-300 capitalize">
                            {order.paymentProvider || "N/A"}
                          </div>
                          {order.paymentRef && (
                            <div className="text-zinc-500 text-xs font-mono">
                              {order.paymentRef.slice(0, 20)}...
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <div className="text-xs text-zinc-400">Payment:</div>
                          {getPaymentStatusBadge(order.status)}
                          {order.deliveryStatus && (
                            <>
                              <div className="text-xs text-zinc-400 mt-1">Delivery:</div>
                              {getDeliveryStatusBadge(order.deliveryStatus)}
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-zinc-400">
                          {formatDate(order.createdAt)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setCustomerMessage(order.currentMessage || ""); // Load current message when opening order
                          }}
                          className="text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700 mt-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-zinc-400">
                Showing page {currentPage} of {totalPages} ({totalOrders} total orders)
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-zinc-700 text-white rounded-lg text-sm font-medium transition-colors hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                          currentPage === pageNum
                            ? "bg-blue-600 text-white"
                            : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-zinc-700 text-white rounded-lg text-sm font-medium transition-colors hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={(e) => {
            // Close modal when clicking on backdrop
            if (e.target === e.currentTarget) {
              setSelectedOrder(null);
            }
          }}
          onKeyDown={(e) => {
            // Close modal on ESC key
            if (e.key === 'Escape') {
              setSelectedOrder(null);
            }
          }}
          tabIndex={-1}
        >
          <div className="bg-zinc-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-zinc-900 p-6 border-b border-zinc-700">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">Order Details</h2>
                  <p className="text-sm text-zinc-400">
                    Order ID: {selectedOrder._id}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  <XCircle size={24} />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Customer Info */}
              <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-700">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <User size={20} />
                  Customer Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-zinc-400">Name:</span>
                    <p className="text-white font-medium">
                      {selectedOrder.customerName || "N/A"}
                    </p>
                  </div>
                  <div>
                    <span className="text-zinc-400">Email:</span>
                    <p className="text-white font-medium">
                      {selectedOrder.customerEmail || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              {selectedOrder.shippingAddress && (
                <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-700">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <MapPin size={20} />
                    Shipping Address
                  </h3>
                  <div className="text-sm text-zinc-300 space-y-1">
                    {selectedOrder.shippingAddress.fullName && (
                      <p className="font-medium text-white">{selectedOrder.shippingAddress.fullName}</p>
                    )}
                    {selectedOrder.shippingAddress.phone && (
                      <p className="text-zinc-400">Phone: {selectedOrder.shippingAddress.phone}</p>
                    )}
                    {selectedOrder.shippingAddress.street && (
                      <p>{selectedOrder.shippingAddress.street}</p>
                    )}
                    <p>
                      {[
                        selectedOrder.shippingAddress.city,
                        selectedOrder.shippingAddress.state,
                        selectedOrder.shippingAddress.postalCode,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                    {selectedOrder.shippingAddress.country && (
                      <p className="font-medium">{selectedOrder.shippingAddress.country}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Order Items */}
              <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-700">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Package size={20} />
                  Order Items
                </h3>
                <div className="space-y-3">
                  {selectedOrder.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center py-2 border-b border-zinc-700 last:border-0"
                    >
                      <div>
                        <p className="text-white font-medium">{item.name}</p>
                        <p className="text-sm text-zinc-400">
                          Quantity: {item.quantity} × {formatCurrency(item.price, selectedOrder.currency)}
                        </p>
                      </div>
                      <div className="text-white font-semibold">
                        {formatCurrency(item.price * item.quantity, selectedOrder.currency)}
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-3 border-t-2 border-zinc-600">
                    <span className="text-lg font-semibold text-white">Total:</span>
                    <span className="text-xl font-bold text-white">
                      {formatCurrency(selectedOrder.amount, selectedOrder.currency)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Details */}
              <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-700">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <DollarSign size={20} />
                  Payment Details
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Provider:</span>
                    <span className="text-white font-medium capitalize">
                      {selectedOrder.paymentProvider || "N/A"}
                    </span>
                  </div>
                  {selectedOrder.paymentRef && (
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Reference:</span>
                      <span className="text-white font-mono text-xs">
                        {selectedOrder.paymentRef}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Payment Status:</span>
                    <div>{getPaymentStatusBadge(selectedOrder.status)}</div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Delivery Status:</span>
                    <div>{selectedOrder.deliveryStatus ? getDeliveryStatusBadge(selectedOrder.deliveryStatus) : <span className="text-zinc-400 text-sm">Not set</span>}</div>
                  </div>
                </div>
              </div>

              {/* Order Dates */}
              <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-700">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Calendar size={20} />
                  Timeline
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Created:</span>
                    <span className="text-white">{formatDate(selectedOrder.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Last Updated:</span>
                    <span className="text-white">{formatDate(selectedOrder.updatedAt)}</span>
                  </div>
                </div>
              </div>

              {/* Update Payment Status */}
              <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-700">
                <h3 className="text-lg font-semibold text-white mb-4">Update Payment Status</h3>
                
                <div className="flex flex-wrap gap-2">
                  {(["pending", "paid", "cancelled", "failed"] as PaymentStatus[]).map(
                    (status) => (
                      <button
                        key={status}
                        onClick={() => {
                          updatePaymentStatus(selectedOrder._id, status);
                        }}
                        disabled={
                          selectedOrder.status === status || 
                          updatingPaymentStatus === status
                        }
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                          selectedOrder.status === status || updatingPaymentStatus === status
                            ? "bg-zinc-700 text-zinc-500 cursor-not-allowed"
                            : status === "failed" || status === "cancelled"
                            ? "bg-red-600 hover:bg-red-700 text-white"
                            : "bg-blue-600 hover:bg-blue-700 text-white"
                        }`}
                      >
                        {updatingPaymentStatus === status ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                            <span>Updating...</span>
                          </>
                        ) : (
                          <span>Mark as {status.charAt(0).toUpperCase() + status.slice(1)}</span>
                        )}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Update Delivery Status - Email Sending Buttons */}
              <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-700">
                <h3 className="text-lg font-semibold text-white mb-4">Send Order Status Email</h3>
                <p className="text-sm text-zinc-400 mb-4">These actions will update delivery status and send email to customer</p>
                
                {/* Message Input for Delivery Status */}
                <div className="mb-4">
                  <label htmlFor="delivery-message" className="block text-sm font-medium text-zinc-300 mb-2">
                    Message to Customer (Optional)
                  </label>
                  <textarea
                    id="delivery-message"
                    value={deliveryMessage}
                    onChange={(e) => setDeliveryMessage(e.target.value)}
                    placeholder="e.g., Your order is being processed and will be ready soon..."
                    rows={3}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-zinc-400 mt-1">
                    This message will be emailed to the customer along with the status update
                  </p>
                </div>

                {/* Email Status Buttons - Only for statuses that send emails */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      updateDeliveryStatus(selectedOrder._id, "processing", deliveryMessage);
                    }}
                    disabled={
                      selectedOrder.deliveryStatus === "processing" || 
                      updatingDeliveryStatus === "processing" ||
                      selectedOrder.deliveryStatusHistory?.some((h: any) => h.deliveryStatus === "processing" && h.emailSent)
                    }
                    className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                      selectedOrder.deliveryStatus === "processing" || 
                      updatingDeliveryStatus === "processing" ||
                      selectedOrder.deliveryStatusHistory?.some((h: any) => h.deliveryStatus === "processing" && h.emailSent)
                        ? "bg-zinc-700 text-zinc-500 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700 text-white"
                    }`}
                  >
                    {updatingDeliveryStatus === "processing" ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <span>📦</span>
                        <span>Order Processing</span>
                        {selectedOrder.deliveryStatusHistory?.some((h: any) => h.deliveryStatus === "processing" && h.emailSent) && (
                          <span className="text-xs">✓ Sent</span>
                        )}
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      updateDeliveryStatus(selectedOrder._id, "ready to ship", deliveryMessage);
                    }}
                    disabled={
                      selectedOrder.deliveryStatus === "ready to ship" || 
                      updatingDeliveryStatus === "ready to ship" ||
                      selectedOrder.deliveryStatusHistory?.some((h: any) => h.deliveryStatus === "ready to ship" && h.emailSent)
                    }
                    className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                      selectedOrder.deliveryStatus === "ready to ship" || 
                      updatingDeliveryStatus === "ready to ship" ||
                      selectedOrder.deliveryStatusHistory?.some((h: any) => h.deliveryStatus === "ready to ship" && h.emailSent)
                        ? "bg-zinc-700 text-zinc-500 cursor-not-allowed"
                        : "bg-purple-600 hover:bg-purple-700 text-white"
                    }`}
                  >
                    {updatingDeliveryStatus === "ready to ship" ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <span>🚚</span>
                        <span>Order Shipping</span>
                        {selectedOrder.deliveryStatusHistory?.some((h: any) => h.deliveryStatus === "ready to ship" && h.emailSent) && (
                          <span className="text-xs">✓ Sent</span>
                        )}
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      updateDeliveryStatus(selectedOrder._id, "reached to your country", deliveryMessage);
                    }}
                    disabled={
                      selectedOrder.deliveryStatus === "reached to your country" || 
                      updatingDeliveryStatus === "reached to your country" ||
                      selectedOrder.deliveryStatusHistory?.some((h: any) => h.deliveryStatus === "reached to your country" && h.emailSent)
                    }
                    className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                      selectedOrder.deliveryStatus === "reached to your country" || 
                      updatingDeliveryStatus === "reached to your country" ||
                      selectedOrder.deliveryStatusHistory?.some((h: any) => h.deliveryStatus === "reached to your country" && h.emailSent)
                        ? "bg-zinc-700 text-zinc-500 cursor-not-allowed"
                        : "bg-green-600 hover:bg-green-700 text-white"
                    }`}
                  >
                    {updatingDeliveryStatus === "reached to your country" ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <span>🌍</span>
                        <span>Reached to Your Country</span>
                        {selectedOrder.deliveryStatusHistory?.some((h: any) => h.deliveryStatus === "reached to your country" && h.emailSent) && (
                          <span className="text-xs">✓ Sent</span>
                        )}
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      updateDeliveryStatus(selectedOrder._id, "delivered", deliveryMessage);
                    }}
                    disabled={
                      selectedOrder.deliveryStatus === "delivered" || 
                      updatingDeliveryStatus === "delivered" ||
                      selectedOrder.deliveryStatusHistory?.some((h: any) => h.deliveryStatus === "delivered" && h.emailSent)
                    }
                    className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                      selectedOrder.deliveryStatus === "delivered" || 
                      updatingDeliveryStatus === "delivered" ||
                      selectedOrder.deliveryStatusHistory?.some((h: any) => h.deliveryStatus === "delivered" && h.emailSent)
                        ? "bg-zinc-700 text-zinc-500 cursor-not-allowed"
                        : "bg-emerald-600 hover:bg-emerald-700 text-white"
                    }`}
                  >
                    {updatingDeliveryStatus === "delivered" ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <span>✅</span>
                        <span>Order Delivered</span>
                        {selectedOrder.deliveryStatusHistory?.some((h: any) => h.deliveryStatus === "delivered" && h.emailSent) && (
                          <span className="text-xs">✓ Sent</span>
                        )}
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Update Customer Message (No Email) */}
              <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-700">
                <h3 className="text-lg font-semibold text-white mb-4">Update Customer Message (No Email)</h3>
                
                {/* Show Current Message */}
                {selectedOrder.currentMessage && (
                  <div className="mb-4 p-3 bg-zinc-800 border border-zinc-600 rounded-lg">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-xs text-zinc-400 mb-1">Current Message:</p>
                        <p className="text-white text-sm">{selectedOrder.currentMessage}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="mb-4">
                  <label htmlFor="customer-message" className="block text-sm font-medium text-zinc-300 mb-2">
                    {selectedOrder.currentMessage ? "New Message (will replace current)" : "Latest Message to Customer"}
                  </label>
                  <textarea
                    id="customer-message"
                    value={customerMessage}
                    onChange={(e) => setCustomerMessage(e.target.value)}
                    placeholder={selectedOrder.currentMessage ? "Enter new message to replace current..." : "e.g., Product reached Coimbatore..."}
                    rows={3}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-zinc-400 mt-1">
                    This message will be saved but will NOT trigger an email. Use this to update the latest message shown to customers.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (customerMessage.trim()) {
                        updateCustomerMessage(selectedOrder._id, customerMessage.trim());
                      }
                    }}
                    disabled={!customerMessage.trim()}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {selectedOrder.currentMessage ? "Update Message" : "Send Message"}
                  </button>
                  {selectedOrder.currentMessage && (
                    <button
                      onClick={() => {
                        if (confirm("Are you sure you want to clear this message?")) {
                          clearCustomerMessage(selectedOrder._id);
                        }
                      }}
                      disabled={clearingMessage}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {clearingMessage ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Clearing...</span>
                        </>
                      ) : (
                        <span>Clear Message</span>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

