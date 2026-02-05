"use client";

import { useState, useEffect } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";

type Event = {
  _id: string;
  name: string;
  title: string;
  location: string;
  day: string;
  time: string;
  date: string;
  endDate?: string;
  description: string;
  imageUrl?: string;
  totalSeats?: number;
  bookedSeats?: number;
  price?: number;
  createdAt: string;
  updatedAt: string;
};

// Generate hour options (1-12)
const HOUR_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1);

// Generate minute options (00, 15, 30, 45)
const MINUTE_OPTIONS = ["00", "15", "30", "45"];

// Period options
const PERIOD_OPTIONS = ["AM", "PM"];

export default function EventsPage() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    title: "",
    location: "",
    day: "",
    time: "",
    date: "",
    endDate: "",
    description: "",
    image: "",
    totalSeats: 1,
    price: 0,
  });
  const [startHour, setStartHour] = useState("");
  const [startMinute, setStartMinute] = useState("");
  const [startPeriod, setStartPeriod] = useState("AM");
  const [endHour, setEndHour] = useState("");
  const [endMinute, setEndMinute] = useState("");
  const [endPeriod, setEndPeriod] = useState("AM");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [events, setEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalEvents, setTotalEvents] = useState<number>(0);

  // S3 upload states
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);

  // Track original image URL when editing (for restore on cancel)
  const [originalImageUrl, setOriginalImageUrl] = useState<string>("");

  // Fetch events
  const fetchEvents = async () => {
    try {
      setEventsLoading(true);
      const params = new URLSearchParams();
      params.append("page", currentPage.toString());
      params.append("limit", "10");
      if (searchQuery.trim()) {
        params.append("search", searchQuery.trim());
      }

      const response = await fetch(`/api/admin/events?${params.toString()}`);
      const data = await response.json();
      if (data.success && data.data) {
        setEvents(data.data);
        if (data.pagination) {
          setTotalPages(data.pagination.pages || 1);
          setTotalEvents(data.pagination.total || 0);
        }
      } else {
        setEvents([]);
      }
    } catch (error) {
      console.error("Failed to fetch events:", error);
      setEvents([]);
    } finally {
      setEventsLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1); // Reset to page 1 when search changes
  }, [searchQuery]);

  useEffect(() => {
    fetchEvents();
  }, [currentPage, searchQuery]);

  // Auto-populate Day based on Date and EndDate
  useEffect(() => {
    if (!formData.date) {
      setFormData((prev) => ({ ...prev, day: "" }));
      return;
    }

    const startDate = new Date(formData.date);
    if (isNaN(startDate.getTime())) return;

    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const startDayName = days[startDate.getDay()];
    let dayString = startDayName;

    if (formData.endDate) {
      const endDate = new Date(formData.endDate);
      if (!isNaN(endDate.getTime())) {
        const endDayName = days[endDate.getDay()];
        if (startDayName !== endDayName) {
          dayString = `${startDayName}-${endDayName}`;
        }
      }
    }

    setFormData((prev) => {
      // Only update if the day is different to avoid infinite loop (though dependency array prevents it mostly)
      // Also allowing manual override if needed, but per requirement "day should be auto matically populated"
      if (prev.day !== dayString) {
        return { ...prev, day: dayString };
      }
      return prev;
    });
  }, [formData.date, formData.endDate]);

  // Normalize image URL for display
  const getImageUrl = (event: Event) => {
    const img = event.imageUrl;
    if (!img) return "";
    if (img.startsWith("data:image")) return img;
    if (img.startsWith("http://") || img.startsWith("https://")) return img;
    return `data:image/jpeg;base64,${img}`;
  };

  // Handle delete with toast confirmation
  const handleDelete = async (id: string) => {
    const event = events.find((e) => e._id === id);
    const eventTitle = event?.title || "this event";

    // Toast-based confirmation
    const confirmed = await new Promise<boolean>((resolve) => {
      const toastId = toast(
        (t) => (
          <div className="flex flex-col gap-3">
            <p className="text-white font-medium">Delete Event?</p>
            <p className="text-sm text-zinc-300">
              Are you sure you want to delete "{eventTitle}"? This action cannot
              be undone.
            </p>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => {
                  toast.dismiss(toastId);
                  resolve(true);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => {
                  toast.dismiss(toastId);
                  resolve(false);
                }}
                className="px-4 py-2 bg-zinc-600 hover:bg-zinc-700 text-white text-sm font-medium rounded-md transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ),
        { duration: Infinity },
      );
    });

    if (!confirmed) return;

    setDeletingId(id);
    const deletePromise = fetch(`/api/admin/events/${id}`, {
      method: "DELETE",
    }).then(async (response) => {
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to delete event");
      }
      setEvents(events.filter((e) => e._id !== id));
      return data;
    });

    toast.promise(deletePromise, {
      loading: "Deleting event...",
      success: "Event deleted successfully!",
      error: (err) => err.message || "Failed to delete event",
    });

    try {
      await deletePromise;
    } catch {
      // Error handled by toast.promise
    } finally {
      setDeletingId(null);
    }
  };

  // Handle image selection - use local preview (no upload yet)
  const handleImageSelect = (file: File | null) => {
    if (!file) {
      setSelectedImageFile(null);
      setPreviewUrl("");
      setFormData({ ...formData, image: "" });
      return;
    }
    setSelectedImageFile(file);
    // Clear any existing image URL when selecting new file
    setFormData({ ...formData, image: "" });
    // Use local file preview (not uploaded to S3 yet)
    setPreviewUrl(URL.createObjectURL(file));
    setError(null);
  };

  // Remove image - only clear form state, don't delete from S3 yet
  const handleRemoveImage = () => {
    // Clean up object URL if it was created from local file
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }

    setFormData({ ...formData, image: "" });

    // If editing and we have original image, restore preview to original
    if (editingId && originalImageUrl && !selectedImageFile) {
      const currentEvent = events.find((e) => e._id === editingId);
      if (currentEvent) {
        setPreviewUrl(getImageUrl(currentEvent));
      }
    } else {
      setPreviewUrl("");
    }

    setSelectedImageFile(null);
  };

  // Parse time string to extract hours, minutes, and periods
  const parseTimeRange = (timeString: string) => {
    if (!timeString) {
      return {
        startHour: "",
        startMinute: "",
        startPeriod: "AM",
        endHour: "",
        endMinute: "",
        endPeriod: "AM",
      };
    }

    const match = timeString.match(
      /(\d+):(\d+)\s*(AM|PM)\s*-\s*(\d+):(\d+)\s*(AM|PM)/i,
    );
    if (match) {
      return {
        startHour: match[1],
        startMinute: match[2],
        startPeriod: match[3].toUpperCase(),
        endHour: match[4],
        endMinute: match[5],
        endPeriod: match[6].toUpperCase(),
      };
    }

    return {
      startHour: "",
      startMinute: "",
      startPeriod: "AM",
      endHour: "",
      endMinute: "",
      endPeriod: "AM",
    };
  };

  // Handle edit button click
  const handleEdit = (event: Event) => {
    // Store original image URL for restore on cancel and S3 deletion on update
    const originalImg = event.imageUrl || "";
    setOriginalImageUrl(originalImg);

    setEditingId(event._id);
    setShowAddForm(true);
    const timeRange = parseTimeRange(event.time || "");
    setFormData({
      name: event.name || "",
      title: event.title || "",
      location: event.location || "",
      day: event.day || "",
      time: event.time || "",
      date: event.date || "",
      endDate: event.endDate || "",
      description: event.description || "",
      image: originalImg,
      totalSeats: event.totalSeats || 1,
      price: event.price || 0,
    });
    setStartHour(timeRange.startHour);
    setStartMinute(timeRange.startMinute);
    setStartPeriod(timeRange.startPeriod);
    setEndHour(timeRange.endHour);
    setEndMinute(timeRange.endMinute);
    setEndPeriod(timeRange.endPeriod);

    if (event.imageUrl) {
      setPreviewUrl(getImageUrl(event));
    } else {
      setPreviewUrl("");
    }

    setError(null);
    setSuccess(null);
    setSelectedImageFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!formData.name.trim()) {
      setError("Name is required");
      setLoading(false);
      return;
    }

    if (!formData.title.trim()) {
      setError("Title is required");
      setLoading(false);
      return;
    }

    if (!formData.location.trim()) {
      setError("Location is required");
      setLoading(false);
      return;
    }

    if (!formData.day.trim()) {
      setError("Day is required");
      setLoading(false);
      return;
    }

    if (!startHour || !startMinute || !endHour || !endMinute) {
      setError("Both start time and end time (hours and minutes) are required");
      setLoading(false);
      return;
    }

    // Combine start and end time into a single string
    const timeRange = `${startHour}:${startMinute} ${startPeriod} - ${endHour}:${endMinute} ${endPeriod}`;

    if (!formData.date.trim()) {
      setError("Start Date is required");
      setLoading(false);
      return;
    }

    if (!formData.description.trim()) {
      setError("Description is required");
      setLoading(false);
      return;
    }

    try {
      const isEdit = !!editingId;

      // Handle image upload if a new file is selected (upload happens here during form submission)
      let finalImageUrl = formData.image;
      let uploadToastId: string | undefined;

      if (selectedImageFile) {
        // Show progress toast during upload (green progress bar)
        uploadToastId = toast.loading(
          <div className="flex flex-col gap-2">
            <span className="text-white font-medium">
              Uploading image to S3...
            </span>
            <div className="w-full bg-zinc-700 rounded-full h-2">
              <div
                className="bg-emerald-600 h-2 rounded-full animate-pulse"
                style={{ width: "50%" }}
              ></div>
            </div>
          </div>,
          { duration: Infinity },
        );

        try {
          // Upload new image file to S3 only during form submission
          const uploadFormData = new FormData();
          uploadFormData.append("file", selectedImageFile);
          uploadFormData.append("folder", "images");

          const uploadResponse = await fetch("/api/upload/s3", {
            method: "POST",
            body: uploadFormData,
          });

          const uploadData = await uploadResponse.json();

          if (!uploadResponse.ok || !uploadData.success || !uploadData.url) {
            throw new Error("Failed to upload image to S3");
          }

          finalImageUrl = uploadData.url;

          // Update progress toast
          toast.dismiss(uploadToastId);
          toast.success("Image uploaded successfully!", { duration: 2000 });
        } catch (uploadErr) {
          toast.dismiss(uploadToastId);
          throw new Error("Failed to upload image. Please try again.");
        }
      }

      const url = isEdit
        ? `/api/admin/events/${editingId}`
        : `/api/admin/events`;

      const method = isEdit ? "PATCH" : "POST";

      // Prepare request body
      const requestBody: {
        name: string;
        title: string;
        location: string;
        day: string;
        time: string;
        date: string;
        endDate?: string;
        description: string;
        imageUrl?: string;
        totalSeats: number;
        price: number;
      } = {
        name: formData.name.trim(),
        title: formData.title.trim(),
        location: formData.location.trim(),
        day: formData.day.trim(),
        time: timeRange,
        date: formData.date.trim(),
        endDate: formData.endDate ? formData.endDate.trim() : undefined,
        description: formData.description.trim(),
        totalSeats: Number(formData.totalSeats),
        price: Number(formData.price),
      };

      // Use final image URL (uploaded or existing)
      if (finalImageUrl) {
        requestBody.imageUrl = finalImageUrl;
      } else if (isEdit && originalImageUrl) {
        // If editing and no new image, use original
        requestBody.imageUrl = originalImageUrl;
      }

      // Show saving toast
      const saveToastId = toast.loading(
        <div className="flex flex-col gap-2">
          <span className="text-white font-medium">
            {isEdit ? "Updating event..." : "Creating event..."}
          </span>
          <div className="w-full bg-zinc-700 rounded-full h-2">
            <div
              className="bg-emerald-600 h-2 rounded-full animate-pulse"
              style={{ width: "70%" }}
            ></div>
          </div>
        </div>,
        { duration: Infinity },
      );

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      toast.dismiss(saveToastId);

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || `Failed to ${isEdit ? "update" : "create"} event`,
        );
      }

      // After successful update, delete old image from S3 if it was replaced
      if (
        isEdit &&
        originalImageUrl &&
        finalImageUrl &&
        originalImageUrl !== finalImageUrl &&
        originalImageUrl.startsWith("https://")
      ) {
        try {
          await fetch("/api/upload/s3/delete", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: originalImageUrl }),
          });
        } catch (err) {
          console.error("Error deleting old image from S3:", err);
          // Don't fail the update if deletion fails
        }
      }

      toast.success(`Event ${isEdit ? "updated" : "created"} successfully!`, {
        duration: 3000,
      });
      setSuccess(`Event ${isEdit ? "updated" : "created"} successfully!`);
      setFormData({
        name: "",
        title: "",
        location: "",
        day: "",
        time: "",
        date: "",
        endDate: "",
        description: "",
        image: "",
        totalSeats: 1,
        price: 0,
      });
      setStartHour("");
      setStartMinute("");
      setStartPeriod("AM");
      setEndHour("");
      setEndMinute("");
      setEndPeriod("AM");

      // Clean up object URL if it was created from local file
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }

      setPreviewUrl("");
      setEditingId(null);
      setOriginalImageUrl("");
      setSelectedImageFile(null);

      // Refresh events list
      await fetchEvents();

      setTimeout(() => {
        setShowAddForm(false);
        setSuccess(null);
      }, 1500);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      toast.error(errorMessage, { duration: 4000 });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Clean up object URL if it was created from local file
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }

    // If editing, restore original image
    if (editingId && originalImageUrl) {
      const currentEvent = events.find((e) => e._id === editingId);
      if (currentEvent) {
        setFormData({
          ...formData,
          image: originalImageUrl,
        });
        setPreviewUrl(getImageUrl(currentEvent));
      }
    }

    setShowAddForm(false);
    setFormData({
      name: "",
      title: "",
      location: "",
      day: "",
      time: "",
      date: "",
      endDate: "",
      description: "",
      image: "",
      totalSeats: 1,
      price: 0,
    });
    setStartHour("");
    setStartMinute("");
    setStartPeriod("AM");
    setEndHour("");
    setEndMinute("");
    setEndPeriod("AM");
    setPreviewUrl("");
    setEditingId(null);
    setOriginalImageUrl("");
    setSelectedImageFile(null);
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="min-h-screen bg-zinc-900 p-6 sm:p-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-3xl font-bold text-white mb-6">
          Events Management
        </h1>

        {/* Add Button and Search */}
        {!showAddForm && (
          <div className="mb-6 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
              >
                Add Event
              </button>
              {totalEvents > 0 && (
                <div className="text-sm text-zinc-400">
                  Total Events: {totalEvents}
                </div>
              )}
            </div>

            {/* Search */}
            <div className="relative max-w-md">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Search events by name, title, description, location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {/* Events List */}
        {!showAddForm && (
          <div className="mt-6">
            {eventsLoading ? (
              <div className="text-zinc-400 text-center py-8">
                Loading events...
              </div>
            ) : events.length === 0 ? (
              <div className="rounded-lg border border-zinc-700 bg-zinc-800 p-10 text-center">
                <p className="text-zinc-400 mb-2">No events found</p>
                <p className="text-zinc-500 text-sm mt-2">
                  Create your first event using the Add button above.
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-zinc-700 bg-zinc-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px] text-sm">
                    <thead>
                      <tr className="border-b border-zinc-700 bg-zinc-900 text-left text-xs uppercase tracking-wide text-zinc-400">
                        <th className="px-6 py-3 font-medium">Image</th>
                        <th className="px-6 py-3 font-medium">Name</th>
                        <th className="px-6 py-3 font-medium">Title</th>
                        <th className="px-6 py-3 font-medium">Location</th>
                        <th className="px-6 py-3 font-medium">Date</th>
                        <th className="px-6 py-3 font-medium">Day</th>
                        <th className="px-6 py-3 font-medium">Time</th>
                        <th className="px-6 py-3 font-medium">Slots</th>
                        <th className="px-6 py-3 font-medium">Price</th>
                        <th className="px-6 py-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {events.map((event) => (
                        <tr
                          key={event._id}
                          className="border-b border-zinc-700 last:border-0 hover:bg-zinc-900/50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            {event.imageUrl ? (
                              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md border border-zinc-700 bg-zinc-900">
                                <img
                                  src={getImageUrl(event)}
                                  alt={event.title || "Event"}
                                  className="h-full w-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                  }}
                                />
                              </div>
                            ) : (
                              <div className="h-16 w-16 shrink-0 rounded-md border border-zinc-700 bg-zinc-900 flex items-center justify-center">
                                <span className="text-zinc-500 text-xs">
                                  No Image
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-medium text-white">
                              {event.name || "N/A"}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-medium text-white">
                              {event.title || "Untitled"}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-zinc-300">
                              {event.location || "N/A"}
                            </p>
                          </td>
                          <td className="px-6 py-4 text-zinc-400">
                            {event.date || "N/A"}
                            {event.endDate ? ` - ${event.endDate}` : ""}
                          </td>

                          <td className="px-6 py-4 text-zinc-400">
                            {event.day || "N/A"}
                          </td>
                          <td className="px-6 py-4 text-zinc-400">
                            {event.time || "N/A"}
                          </td>
                          <td className="px-6 py-4 text-zinc-400">
                            {event.bookedSeats !== undefined &&
                            event.totalSeats !== undefined
                              ? `${event.bookedSeats}/${event.totalSeats}`
                              : "N/A"}
                          </td>
                          <td className="px-6 py-4 text-zinc-400">
                            {event.price !== undefined
                              ? `SGD $${event.price.toFixed(2)}`
                              : "N/A"}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEdit(event)}
                                className="rounded-md border border-zinc-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-zinc-700"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(event._id)}
                                disabled={deletingId === event._id}
                                className="rounded-md border border-red-600 px-3 py-1 text-xs font-medium text-red-400 transition-colors hover:bg-red-900/20 disabled:opacity-50"
                              >
                                {deletingId === event._id
                                  ? "Deleting..."
                                  : "Delete"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700 mt-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-zinc-400">
                    Showing page {currentPage} of {totalPages} ({totalEvents}{" "}
                    total events)
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
                      {Array.from(
                        { length: Math.min(5, totalPages) },
                        (_, i) => {
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
                        },
                      )}
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
        )}

        {/* Form */}
        {showAddForm && (
          <form
            onSubmit={handleSubmit}
            className="space-y-6 rounded-lg border border-zinc-700 bg-zinc-800 p-6 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">
                {editingId ? "Edit" : "Add"} Event
              </h2>
              <button
                type="button"
                onClick={handleCancel}
                className="text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="rounded-md bg-red-500/20 border border-red-500/30 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-md bg-emerald-500/20 border border-emerald-500/30 px-4 py-3 text-sm text-emerald-400">
                {success}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label
                  htmlFor="event-name"
                  className="text-sm font-medium text-white"
                >
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="event-name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
                  placeholder="Enter event name"
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="event-title"
                  className="text-sm font-medium text-white"
                >
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  id="event-title"
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
                  placeholder="Enter event title"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label
                  htmlFor="event-location"
                  className="text-sm font-medium text-white"
                >
                  Location <span className="text-red-500">*</span>
                </label>
                <input
                  id="event-location"
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  className="w-full rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
                  placeholder="Enter event location"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label
                  htmlFor="event-date"
                  className="text-sm font-medium text-white"
                >
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  id="event-date"
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  className="w-full rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="event-end-date"
                  className="text-sm font-medium text-white"
                >
                  Event End Date{" "}
                  <span className="text-zinc-400 text-xs">(optional)</span>
                </label>
                <input
                  id="event-end-date"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                  className="w-full rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="event-day"
                className="text-sm font-medium text-white"
              >
                Day{" "}
                <span className="text-zinc-400 text-xs">(auto-populated)</span>
              </label>
              <input
                id="event-day"
                type="text"
                required
                readOnly
                value={formData.day}
                className="w-full rounded-md border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm text-zinc-400 cursor-not-allowed focus:outline-none"
                placeholder="e.g. Saturday (Auto-populated)"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-white">
                Time Range <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-4">
                {/* Start Time */}
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-zinc-400">Start Time</span>
                  <div className="flex gap-2">
                    <select
                      id="event-start-hour"
                      required
                      value={startHour}
                      onChange={(e) => setStartHour(e.target.value)}
                      className="rounded-md border border-zinc-600 bg-zinc-900 px-2 py-2 text-sm text-white focus:border-white focus:outline-none"
                    >
                      <option value="">Hour</option>
                      {HOUR_OPTIONS.map((hour) => (
                        <option key={hour} value={hour}>
                          {hour}
                        </option>
                      ))}
                    </select>
                    <select
                      id="event-start-minute"
                      required
                      value={startMinute}
                      onChange={(e) => setStartMinute(e.target.value)}
                      className="rounded-md border border-zinc-600 bg-zinc-900 px-2 py-2 text-sm text-white focus:border-white focus:outline-none"
                    >
                      <option value="">Min</option>
                      {MINUTE_OPTIONS.map((min) => (
                        <option key={min} value={min}>
                          {min.toString().padStart(2, "0")}
                        </option>
                      ))}
                    </select>
                    <select
                      id="event-start-period"
                      required
                      value={startPeriod}
                      onChange={(e) => setStartPeriod(e.target.value)}
                      className="rounded-md border border-zinc-600 bg-zinc-900 px-2 py-2 text-sm text-white focus:border-white focus:outline-none"
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                </div>
                {/* End Time */}
                <div className="space-y-2">
                  <label className="text-xs text-zinc-400 block">
                    End Time
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <select
                      id="event-end-hour"
                      required
                      value={endHour}
                      onChange={(e) => setEndHour(e.target.value)}
                      className="rounded-md border border-zinc-600 bg-zinc-900 px-2 py-2 text-sm text-white focus:border-white focus:outline-none"
                    >
                      <option value="">Hour</option>
                      {HOUR_OPTIONS.map((hour) => (
                        <option key={hour} value={hour}>
                          {hour}
                        </option>
                      ))}
                    </select>
                    <select
                      id="event-end-minute"
                      required
                      value={endMinute}
                      onChange={(e) => setEndMinute(e.target.value)}
                      className="rounded-md border border-zinc-600 bg-zinc-900 px-2 py-2 text-sm text-white focus:border-white focus:outline-none"
                    >
                      <option value="">Min</option>
                      {MINUTE_OPTIONS.map((min) => (
                        <option key={min} value={min}>
                          {min.toString().padStart(2, "0")}
                        </option>
                      ))}
                    </select>
                    <select
                      id="event-end-period"
                      required
                      value={endPeriod}
                      onChange={(e) => setEndPeriod(e.target.value)}
                      className="rounded-md border border-zinc-600 bg-zinc-900 px-2 py-2 text-sm text-white focus:border-white focus:outline-none"
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label
                  htmlFor="event-totalSeats"
                  className="text-sm font-medium text-white"
                >
                  Total Slots <span className="text-red-500">*</span>
                </label>
                <input
                  id="event-totalSeats"
                  type="number"
                  required
                  min="1"
                  value={formData.totalSeats}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      totalSeats: parseInt(e.target.value) || 1,
                    })
                  }
                  className="w-full rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
                  placeholder="Number of available slots"
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="event-price"
                  className="text-sm font-medium text-white"
                >
                  Price (SGD) <span className="text-red-500">*</span>
                </label>
                <input
                  id="event-price"
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      price: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
                  placeholder="Price per booking"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="event-image"
                className="text-sm font-medium text-white"
              >
                Image
              </label>
              <input
                id="event-image"
                type="file"
                accept="image/*"
                onChange={(e) => handleImageSelect(e.target.files?.[0] || null)}
                className="w-full rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
              />

              {/* Selected file preview (not uploaded to S3 yet) */}
              {selectedImageFile && !formData.image && previewUrl && (
                <div className="mt-2">
                  <div className="bg-zinc-800 border border-zinc-600 rounded-md p-3 mb-2">
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <p className="text-sm text-white font-medium">
                          📁 {selectedImageFile.name}
                        </p>
                        <p className="text-xs text-zinc-400 mt-1">
                          Size:{" "}
                          {(selectedImageFile.size / (1024 * 1024)).toFixed(2)}{" "}
                          MB
                        </p>
                        <p className="text-xs text-yellow-500 mt-2">
                          ⚠️ Image will be uploaded when you save the form
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          // Clean up object URL
                          if (previewUrl && previewUrl.startsWith("blob:")) {
                            URL.revokeObjectURL(previewUrl);
                          }
                          setSelectedImageFile(null);
                          setPreviewUrl("");
                          setFormData({ ...formData, image: "" });
                          // If editing, restore original image preview
                          if (editingId && originalImageUrl) {
                            const currentEvent = events.find(
                              (e) => e._id === editingId,
                            );
                            if (currentEvent) {
                              setPreviewUrl(getImageUrl(currentEvent));
                            }
                          }
                        }}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  {/* Image Preview */}
                  <div className="relative w-full h-48 max-w-md rounded-md border border-zinc-600 overflow-hidden bg-zinc-900">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              )}

              {/* Uploaded image preview */}
              {previewUrl && formData.image && !selectedImageFile && (
                <div className="relative w-full h-48 max-w-md rounded-md border border-zinc-600 overflow-hidden bg-zinc-900 mt-2">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-contain"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center transition-colors"
                    title="Remove image"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label
                htmlFor="event-description"
                className="text-sm font-medium text-white"
              >
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="event-description"
                rows={4}
                required
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
                placeholder="Enter event description"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading
                  ? editingId
                    ? "Updating..."
                    : "Creating..."
                  : editingId
                    ? "Update Event"
                    : "Create Event"}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="inline-flex items-center justify-center rounded-md border border-zinc-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
