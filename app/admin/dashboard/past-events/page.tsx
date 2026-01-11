"use client";

import { useState, useEffect } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

type PastEvent = {
  _id: string;
  name: string;
  title: string;
  location: string;
  day: string;
  time: string;
  date: string;
  description: string;
  thumbnailImage: string;
  photos?: string[];
  videos?: string[];
  createdAt: string;
  updatedAt: string;
};

// Generate hour options (1-12)
const HOUR_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1);

// Generate minute options (00, 15, 30, 45)
const MINUTE_OPTIONS = ['00', '15', '30', '45'];

// Period options
const PERIOD_OPTIONS = ['AM', 'PM'];

export default function PastEventsPage() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    title: "",
    location: "",
    day: "",
    time: "",
    date: "",
    description: "",
    thumbnailImage: "",
    photos: [] as string[],
    videos: [] as string[],
  });
  const [startHour, setStartHour] = useState("");
  const [startMinute, setStartMinute] = useState("");
  const [startPeriod, setStartPeriod] = useState("AM");
  const [endHour, setEndHour] = useState("");
  const [endMinute, setEndMinute] = useState("");
  const [endPeriod, setEndPeriod] = useState("AM");
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [videoPreviews, setVideoPreviews] = useState<string[]>([]);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pastEvents, setPastEvents] = useState<PastEvent[]>([]);
  const [pastEventsLoading, setPastEventsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalPastEvents, setTotalPastEvents] = useState<number>(0);
  
  // S3 upload states
  const [selectedThumbnailFile, setSelectedThumbnailFile] = useState<File | null>(null);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [selectedPhotoFiles, setSelectedPhotoFiles] = useState<(File | null)[]>([null, null, null, null, null, null]);
  const [uploadingPhotos, setUploadingPhotos] = useState<boolean[]>([false, false, false, false, false, false]);
  const [selectedVideoFiles, setSelectedVideoFiles] = useState<(File | null)[]>([null, null]);
  const [uploadingVideos, setUploadingVideos] = useState<boolean[]>([false, false]);

  // Fetch past events
  const fetchPastEvents = async () => {
    try {
      setPastEventsLoading(true);
      const params = new URLSearchParams();
      params.append("page", currentPage.toString());
      params.append("limit", "10");
      if (searchQuery.trim()) {
        params.append("search", searchQuery.trim());
      }
      
      const response = await fetch(`/api/admin/past-events?${params.toString()}`);
      const data = await response.json();
      if (data.success && data.data) {
        setPastEvents(data.data);
        if (data.pagination) {
          setTotalPages(data.pagination.pages || 1);
          setTotalPastEvents(data.pagination.total || 0);
        }
      } else {
        setPastEvents([]);
      }
    } catch (error) {
      console.error("Failed to fetch past events:", error);
      setPastEvents([]);
    } finally {
      setPastEventsLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1); // Reset to page 1 when search changes
  }, [searchQuery]);

  useEffect(() => {
    fetchPastEvents();
  }, [currentPage, searchQuery]);

  // Normalize image URL for display
  const getImageUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("data:image")) return url;
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `data:image/jpeg;base64,${url}`;
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this past event?")) return;

    setDeletingId(id);
    try {
      const response = await fetch(`/api/admin/past-events/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        alert(data.message || "Failed to delete past event");
      } else {
        setPastEvents(pastEvents.filter((e) => e._id !== id));
      }
    } catch {
      alert("Failed to delete past event");
    } finally {
      setDeletingId(null);
    }
  };

  // ====================
  // THUMBNAIL UPLOAD (S3)
  // ====================
  const handleThumbnailSelect = (file: File | null) => {
    if (!file) {
      setSelectedThumbnailFile(null);
      return;
    }
    setSelectedThumbnailFile(file);
    setError(null);
  };

  const handleUploadThumbnailToS3 = async () => {
    if (!selectedThumbnailFile) return;

    setUploadingThumbnail(true);
    setError(null);

    try {
      // Delete old thumbnail if replacing
      if (formData.thumbnailImage) {
        await fetch("/api/upload/s3/delete", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: formData.thumbnailImage }),
        });
      }

      // Upload new thumbnail to S3
      const uploadFormData = new FormData();
      uploadFormData.append("file", selectedThumbnailFile);
      uploadFormData.append("folder", "images");

      const response = await fetch("/api/upload/s3", {
        method: "POST",
        body: uploadFormData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload thumbnail to S3");
      }

      const { url } = await response.json();

      setFormData({ ...formData, thumbnailImage: url });
      setThumbnailPreview(url);
      setSelectedThumbnailFile(null);
    } catch (err) {
      console.error("Error uploading thumbnail:", err);
      setError("Failed to upload thumbnail");
    } finally {
      setUploadingThumbnail(false);
    }
  };

  const handleRemoveThumbnail = async () => {
    if (formData.thumbnailImage) {
      try {
        await fetch("/api/upload/s3/delete", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: formData.thumbnailImage }),
        });
      } catch (err) {
        console.error("Error deleting thumbnail:", err);
      }
    }
    setFormData({ ...formData, thumbnailImage: "" });
    setThumbnailPreview("");
    setSelectedThumbnailFile(null);
  };

  // ====================
  // PHOTOS UPLOAD (S3) - Max 6
  // ====================
  const handlePhotoSelect = (file: File | null, index: number) => {
    if (!file) return;
    const newFiles = [...selectedPhotoFiles];
    newFiles[index] = file;
    setSelectedPhotoFiles(newFiles);
    setError(null);
  };

  const handleUploadPhotoToS3 = async (index: number) => {
    const file = selectedPhotoFiles[index];
    if (!file) return;

    const newUploadingPhotos = [...uploadingPhotos];
    newUploadingPhotos[index] = true;
    setUploadingPhotos(newUploadingPhotos);
    setError(null);

    try {
      // Delete old photo if replacing
      if (formData.photos[index]) {
        await fetch("/api/upload/s3/delete", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: formData.photos[index] }),
        });
      }

      // Upload new photo to S3
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);
      uploadFormData.append("folder", "images");

      const response = await fetch("/api/upload/s3", {
        method: "POST",
        body: uploadFormData,
      });

      if (!response.ok) {
        throw new Error(`Failed to upload photo ${index + 1} to S3`);
      }

      const { url } = await response.json();

      const newPhotos = [...formData.photos];
      newPhotos[index] = url;
      setFormData({ ...formData, photos: newPhotos });
      setPhotoPreviews(newPhotos);

      // Clear selected file
      const newFiles = [...selectedPhotoFiles];
      newFiles[index] = null;
      setSelectedPhotoFiles(newFiles);
    } catch (err) {
      console.error(`Error uploading photo ${index + 1}:`, err);
      setError(`Failed to upload photo ${index + 1}`);
    } finally {
      const newUploadingPhotos = [...uploadingPhotos];
      newUploadingPhotos[index] = false;
      setUploadingPhotos(newUploadingPhotos);
    }
  };

  const handleRemovePhoto = async (index: number) => {
    if (formData.photos[index]) {
      try {
        await fetch("/api/upload/s3/delete", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: formData.photos[index] }),
        });
      } catch (err) {
        console.error(`Error deleting photo ${index + 1}:`, err);
      }
    }

    const newPhotos = [...formData.photos];
    newPhotos[index] = "";
    setFormData({ ...formData, photos: newPhotos.filter(p => p !== "") });
    setPhotoPreviews(newPhotos.filter(p => p !== ""));

    const newFiles = [...selectedPhotoFiles];
    newFiles[index] = null;
    setSelectedPhotoFiles(newFiles);
  };

  // ====================
  // VIDEOS UPLOAD (S3) - Max 2
  // ====================
  const handleVideoSelect = (file: File | null, index: number) => {
    if (!file) return;
    const newFiles = [...selectedVideoFiles];
    newFiles[index] = file;
    setSelectedVideoFiles(newFiles);
    setError(null);
  };

  const handleUnselectVideo = (index: number) => {
    const newFiles = [...selectedVideoFiles];
    newFiles[index] = null;
    setSelectedVideoFiles(newFiles);
    setError(null);
  };

  const handleUploadVideoToS3 = async (index: number) => {
    const file = selectedVideoFiles[index];
    if (!file) return;

    const newUploadingVideos = [...uploadingVideos];
    newUploadingVideos[index] = true;
    setUploadingVideos(newUploadingVideos);
    setError(null);

    try {
      // Delete old video if replacing
      if (formData.videos[index]) {
        await fetch("/api/upload/s3/delete", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: formData.videos[index] }),
        });
      }

      // Upload new video to S3
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);
      uploadFormData.append("folder", "videos");

      const response = await fetch("/api/upload/s3", {
        method: "POST",
        body: uploadFormData,
      });

      if (!response.ok) {
        throw new Error(`Failed to upload video ${index + 1} to S3`);
      }

      const { url } = await response.json();

      const newVideos = [...formData.videos];
      newVideos[index] = url;
      setFormData({ ...formData, videos: newVideos });
      setVideoPreviews(newVideos);

      // Clear selected file
      const newFiles = [...selectedVideoFiles];
      newFiles[index] = null;
      setSelectedVideoFiles(newFiles);
    } catch (err) {
      console.error(`Error uploading video ${index + 1}:`, err);
      setError(`Failed to upload video ${index + 1}`);
    } finally {
      const newUploadingVideos = [...uploadingVideos];
      newUploadingVideos[index] = false;
      setUploadingVideos(newUploadingVideos);
    }
  };

  const handleRemoveVideo = async (index: number) => {
    if (formData.videos[index]) {
      try {
        await fetch("/api/upload/s3/delete", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: formData.videos[index] }),
        });
      } catch (err) {
        console.error(`Error deleting video ${index + 1}:`, err);
      }
    }

    const newVideos = [...formData.videos];
    newVideos[index] = "";
    setFormData({ ...formData, videos: newVideos.filter(v => v !== "") });
    setVideoPreviews(newVideos.filter(v => v !== ""));

    const newFiles = [...selectedVideoFiles];
    newFiles[index] = null;
    setSelectedVideoFiles(newFiles);
  };

  // Parse time string to extract hours, minutes, and periods
  const parseTimeRange = (timeString: string) => {
    if (!timeString) {
      return {
        startHour: "", startMinute: "", startPeriod: "AM",
        endHour: "", endMinute: "", endPeriod: "AM"
      };
    }
    
    const match = timeString.match(/(\d+):(\d+)\s*(AM|PM)\s*-\s*(\d+):(\d+)\s*(AM|PM)/i);
    if (match) {
      return {
        startHour: match[1],
        startMinute: match[2],
        startPeriod: match[3].toUpperCase(),
        endHour: match[4],
        endMinute: match[5],
        endPeriod: match[6].toUpperCase()
      };
    }
    
    return {
      startHour: "", startMinute: "", startPeriod: "AM",
      endHour: "", endMinute: "", endPeriod: "AM"
    };
  };

  // Handle edit button click
  const handleEdit = (pastEvent: PastEvent) => {
    setEditingId(pastEvent._id);
    setShowAddForm(true);
    const timeRange = parseTimeRange(pastEvent.time || "");
    setFormData({
      name: pastEvent.name || "",
      title: pastEvent.title || "",
      location: pastEvent.location || "",
      day: pastEvent.day || "",
      time: pastEvent.time || "",
      date: pastEvent.date || "",
      description: pastEvent.description || "",
      thumbnailImage: pastEvent.thumbnailImage || "",
      photos: pastEvent.photos || [],
      videos: pastEvent.videos || [],
    });
    setStartHour(timeRange.startHour);
    setStartMinute(timeRange.startMinute);
    setStartPeriod(timeRange.startPeriod);
    setEndHour(timeRange.endHour);
    setEndMinute(timeRange.endMinute);
    setEndPeriod(timeRange.endPeriod);
    
    setThumbnailPreview(pastEvent.thumbnailImage ? getImageUrl(pastEvent.thumbnailImage) : "");
    setPhotoPreviews(pastEvent.photos?.map(p => getImageUrl(p)) || []);
    setVideoPreviews(pastEvent.videos || []);
    
    setError(null);
    setSuccess(null);
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
      setError("Date is required");
      setLoading(false);
      return;
    }

    if (!formData.description.trim()) {
      setError("Description is required");
      setLoading(false);
      return;
    }

    if (!formData.thumbnailImage) {
      setError("Thumbnail image is required");
      setLoading(false);
      return;
    }

    try {
      const isEdit = !!editingId;
      const url = isEdit 
        ? `/api/admin/past-events/${editingId}`
        : `/api/admin/past-events`;
      
      // Prepare request body
      const requestBody: {
        name: string;
        title: string;
        location: string;
        day: string;
        time: string;
        date: string;
        description: string;
        thumbnailImage: string;
        photos: string[];
        videos: string[];
      } = {
        name: formData.name.trim(),
        title: formData.title.trim(),
        location: formData.location.trim(),
        day: formData.day.trim(),
        time: timeRange,
        date: formData.date.trim(),
        description: formData.description.trim(),
        thumbnailImage: typeof formData.thumbnailImage === "string" ? formData.thumbnailImage : "",
        photos: formData.photos,
        videos: formData.videos,
      };

      const response = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || `Failed to ${isEdit ? "update" : "create"} past event`);
      }

      setSuccess(`Past event ${isEdit ? "updated" : "created"} successfully!`);
      setFormData({ name: "", title: "", location: "", day: "", time: "", date: "", description: "", thumbnailImage: "", photos: [], videos: [] });
      setStartHour("");
      setStartMinute("");
      setStartPeriod("AM");
      setEndHour("");
      setEndMinute("");
      setEndPeriod("AM");
      setThumbnailPreview("");
      setPhotoPreviews([]);
      setVideoPreviews([]);
      setEditingId(null);
      
      // Refresh past events list
      await fetchPastEvents();
      
      setTimeout(() => {
        setShowAddForm(false);
        setSuccess(null);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setFormData({ name: "", title: "", location: "", day: "", time: "", date: "", description: "", thumbnailImage: "", photos: [], videos: [] });
    setStartHour("");
    setStartMinute("00");
    setStartPeriod("AM");
    setEndHour("");
    setEndMinute("00");
    setEndPeriod("AM");
    setThumbnailPreview("");
    setPhotoPreviews([]);
    setVideoPreviews([]);
    setEditingId(null);
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="min-h-screen bg-zinc-900 p-6 sm:p-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-3xl font-bold text-white mb-6">Past Events Management</h1>

        {/* Add Button and Search */}
        {!showAddForm && (
          <div className="mb-6 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
              >
                Add Past Event
              </button>
              {totalPastEvents > 0 && (
                <div className="text-sm text-zinc-400">
                  Total Past Events: {totalPastEvents}
                </div>
              )}
            </div>
            
            {/* Search */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" size={20} />
              <input
                type="text"
                placeholder="Search past events by name, title, description, location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {/* Past Events List */}
        {!showAddForm && (
          <div className="mt-6">
            {pastEventsLoading ? (
              <div className="text-zinc-400 text-center py-8">Loading past events...</div>
            ) : pastEvents.length === 0 ? (
              <div className="rounded-lg border border-zinc-700 bg-zinc-800 p-10 text-center">
                <p className="text-zinc-400 mb-2">No past events found</p>
                <p className="text-zinc-500 text-sm mt-2">
                  Create your first past event using the Add button above.
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-zinc-700 bg-zinc-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px] text-sm">
                    <thead>
                      <tr className="border-b border-zinc-700 bg-zinc-900 text-left text-xs uppercase tracking-wide text-zinc-400">
                        <th className="px-6 py-3 font-medium">Thumbnail</th>
                        <th className="px-6 py-3 font-medium">Name</th>
                        <th className="px-6 py-3 font-medium">Title</th>
                        <th className="px-6 py-3 font-medium">Location</th>
                        <th className="px-6 py-3 font-medium">Date</th>
                        <th className="px-6 py-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pastEvents.map((pastEvent) => (
                        <tr key={pastEvent._id} className="border-b border-zinc-700 last:border-0 hover:bg-zinc-900/50 transition-colors">
                          <td className="px-6 py-4">
                            {pastEvent.thumbnailImage ? (
                              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md border border-zinc-700 bg-zinc-900">
                                <img
                                  src={getImageUrl(pastEvent.thumbnailImage)}
                                  alt={pastEvent.title || "Past Event"}
                                  className="h-full w-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                  }}
                                />
                              </div>
                            ) : (
                              <div className="h-16 w-16 shrink-0 rounded-md border border-zinc-700 bg-zinc-900 flex items-center justify-center">
                                <span className="text-zinc-500 text-xs">No Image</span>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-medium text-white">{pastEvent.name || "N/A"}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-medium text-white">{pastEvent.title || "Untitled"}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-zinc-300">{pastEvent.location || "N/A"}</p>
                          </td>
                          <td className="px-6 py-4 text-zinc-400">
                            {pastEvent.date || "N/A"}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEdit(pastEvent)}
                                className="rounded-md border border-zinc-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-zinc-700"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(pastEvent._id)}
                                disabled={deletingId === pastEvent._id}
                                className="rounded-md border border-red-600 px-3 py-1 text-xs font-medium text-red-400 transition-colors hover:bg-red-900/20 disabled:opacity-50"
                              >
                                {deletingId === pastEvent._id ? "Deleting..." : "Delete"}
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
                    Showing page {currentPage} of {totalPages} ({totalPastEvents} total past events)
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
        )}

        {/* Form */}
        {showAddForm && (
          <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border border-zinc-700 bg-zinc-800 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">
                {editingId ? "Edit" : "Add"} Past Event
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
                <label htmlFor="past-event-name" className="text-sm font-medium text-white">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="past-event-name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
                  placeholder="Enter event name"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="past-event-title" className="text-sm font-medium text-white">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  id="past-event-title"
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
                  placeholder="Enter event title"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="past-event-location" className="text-sm font-medium text-white">
                  Location <span className="text-red-500">*</span>
                </label>
                <input
                  id="past-event-location"
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
                  placeholder="Enter event location"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="past-event-date" className="text-sm font-medium text-white">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  id="past-event-date"
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="past-event-day" className="text-sm font-medium text-white">
                  Day <span className="text-red-500">*</span>
                </label>
                <input
                  id="past-event-day"
                  type="text"
                  required
                  value={formData.day}
                  onChange={(e) => setFormData({ ...formData, day: e.target.value })}
                  className="w-full rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
                  placeholder="e.g., Friday"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-white">
                  Time <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {/* Start Time */}
                  <div>
                    <label className="text-xs text-zinc-400 block mb-1">
                      Start Time
                    </label>
                    <div className="flex gap-2">
                      <select
                        id="past-event-start-hour"
                        required
                        value={startHour}
                        onChange={(e) => setStartHour(e.target.value)}
                        className="flex-1 rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
                      >
                        <option value="">Hour</option>
                        {HOUR_OPTIONS.map((hour) => (
                          <option key={hour} value={hour}>
                            {hour}
                          </option>
                        ))}
                      </select>
                      <select
                        id="past-event-start-minute"
                        value={startMinute}
                        onChange={(e) => setStartMinute(e.target.value)}
                        className="flex-1 rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
                      >
                        {MINUTE_OPTIONS.map((minute) => (
                          <option key={minute} value={minute.toString().padStart(2, '0')}>
                            {minute.toString().padStart(2, '0')}
                          </option>
                        ))}
                      </select>
                      <select
                        id="past-event-start-period"
                        value={startPeriod}
                        onChange={(e) => setStartPeriod(e.target.value)}
                        className="flex-1 rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
                      >
                        {PERIOD_OPTIONS.map((period) => (
                          <option key={period} value={period}>
                            {period}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {/* End Time */}
                  <div>
                    <label className="text-xs text-zinc-400 block mb-1">
                      End Time
                    </label>
                    <div className="flex gap-2">
                      <select
                        id="past-event-end-hour"
                        required
                        value={endHour}
                        onChange={(e) => setEndHour(e.target.value)}
                        className="flex-1 rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
                      >
                        <option value="">Hour</option>
                        {HOUR_OPTIONS.map((hour) => (
                          <option key={hour} value={hour}>
                            {hour}
                          </option>
                        ))}
                      </select>
                      <select
                        id="past-event-end-minute"
                        value={endMinute}
                        onChange={(e) => setEndMinute(e.target.value)}
                        className="flex-1 rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
                      >
                        {MINUTE_OPTIONS.map((minute) => (
                          <option key={minute} value={minute.toString().padStart(2, '0')}>
                            {minute.toString().padStart(2, '0')}
                          </option>
                        ))}
                      </select>
                      <select
                        id="past-event-end-period"
                        value={endPeriod}
                        onChange={(e) => setEndPeriod(e.target.value)}
                        className="flex-1 rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
                      >
                        {PERIOD_OPTIONS.map((period) => (
                          <option key={period} value={period}>
                            {period}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="past-event-description" className="text-sm font-medium text-white">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="past-event-description"
                rows={4}
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
                placeholder="Enter event description"
              />
            </div>

            {/* Thumbnail Image (Required) */}
            <div className="space-y-1">
              <label htmlFor="past-event-thumbnail" className="text-sm font-medium text-white">
                Thumbnail Image <span className="text-red-500">*</span> (Required)
              </label>
              <input
                id="past-event-thumbnail"
                type="file"
                accept="image/*"
                onChange={(e) => handleThumbnailSelect(e.target.files?.[0] || null)}
                className="w-full rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
              />
              
              {/* Pending file with upload button */}
              {selectedThumbnailFile && !formData.thumbnailImage && (
                <div className="bg-zinc-800 border border-zinc-600 rounded-md p-3 mt-2">
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <p className="text-sm text-white font-medium">📁 {selectedThumbnailFile.name}</p>
                      <p className="text-xs text-zinc-400 mt-1">
                        Size: {(selectedThumbnailFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleUploadThumbnailToS3}
                      disabled={uploadingThumbnail}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 text-white text-sm font-medium rounded-md transition-colors"
                    >
                      {uploadingThumbnail ? "Uploading..." : "Upload"}
                    </button>
                  </div>
                  {!uploadingThumbnail && (
                    <p className="text-xs text-yellow-500 mt-2">⚠️ Click "Upload" to save this image</p>
                  )}
                </div>
              )}

              {/* Uploaded thumbnail */}
              {thumbnailPreview && formData.thumbnailImage && (
                <div className="relative w-full h-48 max-w-md rounded-md border border-zinc-600 overflow-hidden bg-zinc-900 mt-2">
                  <img
                    src={thumbnailPreview}
                    alt="Thumbnail Preview"
                    className="w-full h-full object-contain"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveThumbnail}
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center transition-colors"
                    title="Remove thumbnail"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>

            {/* Photos (Optional, Max 6) */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">
                Photos (Optional, Maximum 6)
              </label>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <div key={index} className="space-y-2">
                    <label className="text-xs text-zinc-400">Photo {index + 1}</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handlePhotoSelect(e.target.files?.[0] || null, index)}
                      disabled={!!formData.photos[index]}
                      className="w-full rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-white focus:outline-none disabled:opacity-50"
                    />
                    
                    {/* Pending file with upload button */}
                    {selectedPhotoFiles[index] && !formData.photos[index] && (
                      <div className="bg-zinc-800 border border-zinc-600 rounded-md p-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-white font-medium truncate">📁 {selectedPhotoFiles[index]!.name}</p>
                            <p className="text-xs text-zinc-400">
                              {(selectedPhotoFiles[index]!.size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleUploadPhotoToS3(index)}
                            disabled={uploadingPhotos[index]}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 text-white text-xs font-medium rounded transition-colors"
                          >
                            {uploadingPhotos[index] ? "Uploading..." : "Upload"}
                          </button>
                        </div>
                        {!uploadingPhotos[index] && (
                          <p className="text-xs text-yellow-500 mt-1">⚠️ Click "Upload"</p>
                        )}
                      </div>
                    )}

                    {/* Uploaded photo */}
                    {formData.photos[index] && (
                      <div className="relative w-full h-32 rounded-md border border-zinc-600 overflow-hidden bg-zinc-900">
                        <img
                          src={formData.photos[index]}
                          alt={`Photo ${index + 1}`}
                          className="w-full h-full object-contain"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(index)}
                          className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center transition-colors"
                          title="Remove photo"
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Videos (Optional, Max 2) */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">
                Videos (Optional, Maximum 2)
              </label>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[0, 1].map((index) => (
                  <div key={index} className="space-y-2">
                    <label className="text-xs text-zinc-400">Video {index + 1}</label>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => handleVideoSelect(e.target.files?.[0] || null, index)}
                      disabled={!!formData.videos[index]}
                      className="w-full rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-white focus:outline-none disabled:opacity-50"
                    />
                    
                    {/* Pending file with upload button */}
                    {selectedVideoFiles[index] && !formData.videos[index] && (
                      <div className="bg-zinc-800 border border-zinc-600 rounded-md p-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-white font-medium truncate">🎥 {selectedVideoFiles[index]!.name}</p>
                            <p className="text-xs text-zinc-400">
                              {(selectedVideoFiles[index]!.size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleUnselectVideo(index)}
                              disabled={uploadingVideos[index]}
                              className="px-3 py-1 bg-zinc-600 hover:bg-zinc-700 disabled:bg-zinc-800 disabled:opacity-50 text-white text-xs font-medium rounded transition-colors"
                              title="Remove selection"
                            >
                              Remove
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUploadVideoToS3(index)}
                              disabled={uploadingVideos[index]}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 text-white text-xs font-medium rounded transition-colors"
                            >
                              {uploadingVideos[index] ? "Uploading..." : "Upload"}
                            </button>
                          </div>
                        </div>
                        {!uploadingVideos[index] && (
                          <p className="text-xs text-yellow-500 mt-1">⚠️ Click "Upload"</p>
                        )}
                      </div>
                    )}

                    {/* Uploaded video */}
                    {formData.videos[index] && (
                      <div className="relative w-full h-32 rounded-md border border-zinc-600 overflow-hidden bg-zinc-900">
                        <video
                          src={formData.videos[index]}
                          className="w-full h-full object-contain"
                          controls
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveVideo(index)}
                          className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center transition-colors"
                          title="Remove video"
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (editingId ? "Updating..." : "Creating...") : (editingId ? "Update Past Event" : "Create Past Event")}
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








