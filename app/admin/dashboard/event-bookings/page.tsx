"use client";

import React, { useEffect, useState } from "react";
import { Calendar, User, DollarSign, CheckCircle, XCircle, Clock, Eye } from "lucide-react";
import toast from "react-hot-toast";
import Booking from "@/models/Booking";
import Event from "@/models/Event";

type BookingType = {
  _id: string;
  userId: string;
  sessionId: string;
  sessionType: "event";
  seats: number;
  amount: number;
  status: "pending" | "confirmed" | "cancelled";
  phone?: string;
  comment?: string;
  paymentProvider?: string;
  paymentRef?: string;
  paymentStatus?: "pending" | "paid" | "failed";
  createdAt: string;
  updatedAt: string;
};

type EventType = {
  _id: string;
  title: string;
  date: string;
  time: string;
  location: string;
};

type BookingWithEvent = BookingType & {
  event?: EventType;
  userName?: string;
  userEmail?: string;
};

export default function EventBookingsPage() {
  const [bookings, setBookings] = useState<BookingWithEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<BookingWithEvent | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [stats, setStats] = useState({
    total: 0,
    confirmed: 0,
    pending: 0,
    cancelled: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    fetchBookings();
  }, [statusFilter]);

  const fetchBookings = async () => {
    try {
      setError(null);
      setLoading(true);
      
      const url = `/api/admin/bookings?sessionType=event${statusFilter !== "all" ? `&status=${statusFilter}` : ""}`;
      
      const response = await fetch(url);

      if (!response.ok) {
        const errorMessage = "Failed to load event bookings";
        setError(errorMessage);
        toast.error(errorMessage);
        setBookings([]);
        setLoading(false);
        return;
      }

      const data = await response.json();

      if (data.success) {
        setBookings(data.data || []);
        setError(null);
        
        // Calculate stats
        const stats = {
          total: data.data?.length || 0,
          confirmed: data.data?.filter((b: BookingType) => b.status === "confirmed").length || 0,
          pending: data.data?.filter((b: BookingType) => b.status === "pending").length || 0,
          cancelled: data.data?.filter((b: BookingType) => b.status === "cancelled").length || 0,
          totalRevenue: data.data
            ?.filter((b: BookingType) => b.status === "confirmed" && b.paymentStatus === "paid")
            .reduce((sum: number, b: BookingType) => sum + b.amount, 0) || 0,
        };
        setStats(stats);
      } else {
        const errorMessage = data.message || "Failed to load event bookings";
        setError(errorMessage);
        toast.error(errorMessage);
        setBookings([]);
      }
    } catch (error) {
      const errorMessage = "Failed to load event bookings. Please check your connection.";
      setError(errorMessage);
      console.error("Failed to fetch event bookings:", error);
      toast.error(errorMessage);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "text-emerald-400 bg-emerald-400/20 border-emerald-400/30";
      case "pending":
        return "text-yellow-400 bg-yellow-400/20 border-yellow-400/30";
      case "cancelled":
        return "text-red-400 bg-red-400/20 border-red-400/30";
      default:
        return "text-zinc-400 bg-zinc-400/20 border-zinc-400/30";
    }
  };

  const getPaymentStatusColor = (status?: string) => {
    switch (status) {
      case "paid":
        return "text-emerald-400 bg-emerald-400/20 border-emerald-400/30";
      case "failed":
        return "text-red-400 bg-red-400/20 border-red-400/30";
      case "pending":
        return "text-yellow-400 bg-yellow-400/20 border-yellow-400/30";
      default:
        return "text-zinc-400 bg-zinc-400/20 border-zinc-400/30";
    }
  };

  return (
    <div className="min-h-screen bg-zinc-900 p-6 sm:p-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-3xl font-bold text-white mb-6">Event Bookings</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="rounded-lg border border-zinc-700 bg-zinc-800 p-4">
            <div className="text-sm text-zinc-400 mb-1">Total Bookings</div>
            <div className="text-2xl font-semibold text-white">{stats.total}</div>
          </div>
          <div className="rounded-lg border border-zinc-700 bg-zinc-800 p-4">
            <div className="text-sm text-zinc-400 mb-1">Confirmed</div>
            <div className="text-2xl font-semibold text-emerald-400">{stats.confirmed}</div>
          </div>
          <div className="rounded-lg border border-zinc-700 bg-zinc-800 p-4">
            <div className="text-sm text-zinc-400 mb-1">Pending</div>
            <div className="text-2xl font-semibold text-yellow-400">{stats.pending}</div>
          </div>
          <div className="rounded-lg border border-zinc-700 bg-zinc-800 p-4">
            <div className="text-sm text-zinc-400 mb-1">Cancelled</div>
            <div className="text-2xl font-semibold text-red-400">{stats.cancelled}</div>
          </div>
          <div className="rounded-lg border border-zinc-700 bg-zinc-800 p-4">
            <div className="text-sm text-zinc-400 mb-1">Revenue</div>
            <div className="text-2xl font-semibold text-white">SGD ${stats.totalRevenue.toFixed(2)}</div>
          </div>
        </div>

        {/* Filter */}
        <div className="mb-6">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border border-zinc-600 bg-zinc-800 px-4 py-2 text-sm text-white focus:border-white focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="confirmed">Confirmed</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Bookings List */}
        {loading ? (
          <div className="text-zinc-400 text-center py-8">Loading event bookings...</div>
        ) : error ? (
          <div className="rounded-lg border border-red-700 bg-red-900/20 p-4 text-red-400">
            {error}
          </div>
        ) : bookings.length === 0 ? (
          <div className="rounded-lg border border-zinc-700 bg-zinc-800 p-10 text-center">
            <p className="text-zinc-400">No event bookings found</p>
          </div>
        ) : (
          <div className="rounded-lg border border-zinc-700 bg-zinc-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-sm">
                <thead>
                  <tr className="border-b border-zinc-700 bg-zinc-900 text-left text-xs uppercase tracking-wide text-zinc-400">
                    <th className="px-6 py-3 font-medium">Event</th>
                    <th className="px-6 py-3 font-medium">User</th>
                    <th className="px-6 py-3 font-medium">Amount</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium">Payment</th>
                    <th className="px-6 py-3 font-medium">Date</th>
                    <th className="px-6 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => (
                    <tr key={booking._id} className="border-b border-zinc-700 last:border-0 hover:bg-zinc-900/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-white">
                          {booking.event?.title || "Unknown Event"}
                        </div>
                        {booking.event && (
                          <div className="text-xs text-zinc-400 mt-1">
                            {booking.event.date} · {booking.event.time}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-white">
                          {booking.userName || "Unknown User"}
                        </div>
                        {booking.userEmail && (
                          <div className="text-xs text-zinc-400">{booking.userEmail}</div>
                        )}
                        {booking.phone && (
                          <div className="text-xs text-zinc-400">{booking.phone}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-white">
                        SGD ${booking.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${getStatusColor(booking.status)}`}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {booking.paymentStatus && (
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${getPaymentStatusColor(booking.paymentStatus)}`}>
                            {booking.paymentStatus}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-zinc-400">
                        {formatDate(booking.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setSelectedBooking(booking)}
                          className="rounded-md border border-zinc-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-zinc-700"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-800 rounded-lg border border-zinc-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Booking Details</h2>
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="text-zinc-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-zinc-400 mb-1">Event</div>
                  <div className="text-white font-medium">
                    {selectedBooking.event?.title || "Unknown Event"}
                  </div>
                  {selectedBooking.event && (
                    <div className="text-sm text-zinc-400 mt-1">
                      {selectedBooking.event.date} · {selectedBooking.event.time} · {selectedBooking.event.location}
                    </div>
                  )}
                </div>

                <div>
                  <div className="text-sm text-zinc-400 mb-1">User</div>
                  <div className="text-white">
                    {selectedBooking.userName || "Unknown User"}
                  </div>
                  {selectedBooking.userEmail && (
                    <div className="text-sm text-zinc-400">{selectedBooking.userEmail}</div>
                  )}
                  {selectedBooking.phone && (
                    <div className="text-sm text-zinc-400">{selectedBooking.phone}</div>
                  )}
                </div>

                <div>
                  <div className="text-sm text-zinc-400 mb-1">Amount</div>
                  <div className="text-white font-medium">
                    SGD ${selectedBooking.amount.toFixed(2)}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-zinc-400 mb-1">Status</div>
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${getStatusColor(selectedBooking.status)}`}>
                    {selectedBooking.status}
                  </span>
                </div>

                {selectedBooking.paymentStatus && (
                  <div>
                    <div className="text-sm text-zinc-400 mb-1">Payment Status</div>
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${getPaymentStatusColor(selectedBooking.paymentStatus)}`}>
                      {selectedBooking.paymentStatus}
                    </span>
                  </div>
                )}

                {selectedBooking.comment && (
                  <div>
                    <div className="text-sm text-zinc-400 mb-1">Comment</div>
                    <div className="text-white">{selectedBooking.comment}</div>
                  </div>
                )}

                <div>
                  <div className="text-sm text-zinc-400 mb-1">Booking Date</div>
                  <div className="text-white">{formatDate(selectedBooking.createdAt)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}







