"use client";

import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { Calendar, Clock, Search, ChevronLeft, ChevronRight } from "lucide-react";

type TabType = "discovery" | "private" | "corporate" | "freeStudioVisit";
type MediaType = "image" | "video" | null;

type Session = {
  _id: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  videoUrl?: string;
  sessionType?: "regular" | "corporate" | "private" | "discovery" | "freeStudioVisit";
  format?: string;
  benefits?: string[];
  createdAt: string;
  updatedAt: string;
  // Discovery and Private session fields
  instructorName?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
  price?: number;
  featured?: boolean;
};

export default function SessionsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("discovery");
  const [showAddForm, setShowAddForm] = useState(false);
  const [mediaType, setMediaType] = useState<MediaType>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image: "",
    video: "",
    format: "",
    benefits: [""],
    instructorName: "",
    duration: "",
    price: "",
    date: "",
    startTime: "",
    featured: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalSessions, setTotalSessions] = useState<number>(0);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);
  const timePickerRef = useRef<HTMLDivElement>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedHour, setSelectedHour] = useState<number>(9);
  const [selectedMinute, setSelectedMinute] = useState<number>(0);
  const [selectedAmPm, setSelectedAmPm] = useState<"AM" | "PM">("AM");
  
  // S3 upload states
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  
  // Track original image URL when editing (for restore on cancel)
  const [originalImageUrl, setOriginalImageUrl] = useState<string>("");

  // Helper function to convert 12-hour to 24-hour format
  const convertTo24Hour = (hour: number, minute: number, amPm: "AM" | "PM"): string => {
    let h24 = hour;
    if (amPm === "PM" && hour !== 12) h24 = hour + 12;
    if (amPm === "AM" && hour === 12) h24 = 0;
    return `${String(h24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  };

  // Helper function to convert 24-hour to 12-hour format
  const convertTo12Hour = (time24: string): { hour: number; minute: number; amPm: "AM" | "PM" } => {
    if (!time24) return { hour: 9, minute: 0, amPm: "AM" };
    const [h, m] = time24.split(':').map(Number);
    let hour = h;
    let amPm: "AM" | "PM" = "AM";
    if (h === 0) {
      hour = 12;
    } else if (h === 12) {
      amPm = "PM";
    } else if (h > 12) {
      hour = h - 12;
      amPm = "PM";
    }
    return { hour, minute: m, amPm };
  };

  // Get Singapore time
  const getSingaporeDate = () => {
    const now = new Date();
    const singaporeTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Singapore" }));
    return singaporeTime;
  };

  // Calendar days generation
  const getCalendarDays = () => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = (firstDay.getDay() + 6) % 7; // Monday = 0

    const days: Array<{ day: number; isCurrentMonth: boolean }> = [];
    
    // Previous month days
    const prevMonth = new Date(currentYear, currentMonth, 0);
    const prevMonthDays = prevMonth.getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({ day: prevMonthDays - i, isCurrentMonth: false });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({ day, isCurrentMonth: true });
    }

    // Next month days to fill the grid (6 weeks * 7 days = 42)
    const totalCells = 42;
    const remainingDays = totalCells - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      days.push({ day, isCurrentMonth: false });
    }

    return days;
  };

  // Handle date selection
  const handleDateSelect = (day: number, isCurrentMonth: boolean) => {
    if (!isCurrentMonth) return;
    // Format date as YYYY-MM-DD without timezone conversion
    const year = currentYear;
    const month = String(currentMonth + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const dateStr = `${year}-${month}-${dayStr}`;
    setFormData({ ...formData, date: dateStr });
    setShowCalendar(false);
  };

  // Handle time selection
  const handleTimeSelect = () => {
    const time24 = convertTo24Hour(selectedHour, selectedMinute, selectedAmPm);
    setFormData({ ...formData, startTime: time24 });
    setShowTimePicker(false);
  };

  // Initialize time picker when startTime changes
  useEffect(() => {
    if (formData.startTime) {
      const { hour, minute, amPm } = convertTo12Hour(formData.startTime);
      setSelectedHour(hour);
      setSelectedMinute(minute);
      setSelectedAmPm(amPm);
    }
  }, [formData.startTime]);

  // Close calendar/time picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
      }
      if (timePickerRef.current && !timePickerRef.current.contains(event.target as Node)) {
        setShowTimePicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const tabs = [
    { id: "discovery" as TabType, label: "Discovery" },
    { id: "private" as TabType, label: "Private Session" },
    { id: "corporate" as TabType, label: "Corporate Sessions" },
    { id: "freeStudioVisit" as TabType, label: "Free Studio Visit" },
  ];

  // Fetch sessions
  const fetchSessions = async () => {
    try {
      setSessionsLoading(true);
      const params = new URLSearchParams();
      params.append("page", currentPage.toString());
      params.append("limit", "10");
      params.append("type", activeTab); // Filter by active tab
      if (searchQuery.trim()) {
        params.append("search", searchQuery.trim());
      }
      
      const response = await fetch(`/api/admin/sessions?${params.toString()}`);
      const data = await response.json();
      if (data.success && data.data) {
        setSessions(data.data);
        if (data.pagination) {
          setTotalPages(data.pagination.pages || 1);
          setTotalSessions(data.pagination.total || 0);
        }
      } else {
        setSessions([]);
      }
    } catch (error) {
      console.error("Failed to fetch sessions:", error);
      setSessions([]);
    } finally {
      setSessionsLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1); // Reset to page 1 when tab or search changes
  }, [activeTab, searchQuery]);

  useEffect(() => {
    fetchSessions();
  }, [activeTab, currentPage, searchQuery]);

  // Sessions are already filtered by API based on activeTab, no need to filter again
  const filteredSessions = sessions;

  // Normalize image URL for display
  const getImageUrl = (session: Session) => {
    const img = session.imageUrl;
    if (!img) return "";
    if (img.startsWith("data:image")) return img;
    if (img.startsWith("http://") || img.startsWith("https://")) return img;
    return `data:image/jpeg;base64,${img}`;
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this session?")) return;

    setDeletingId(id);
    try {
      const response = await fetch(`/api/sessions/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        alert(data.message || "Failed to delete session");
      } else {
        setSessions(sessions.filter((s) => s._id !== id));
      }
    } catch {
      alert("Failed to delete session");
    } finally {
      setDeletingId(null);
    }
  };

  const handleMediaTypeChange = (type: MediaType) => {
    setMediaType(type);
    setFormData({ ...formData, image: "", video: "" });
    setPreviewUrl("");
  };

  // ====================
  // IMAGE UPLOAD (S3)
  // ====================
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

  // Image upload to S3 now happens only during form submission
  // Removed handleUploadImageToS3 - upload happens in handleSubmit

  const handleRemoveImage = () => {
    // Clear form state - if editing, keep originalImageUrl for restore on cancel
    // If selectedImageFile exists (local file), just clear it (no S3 upload happened)
    // If formData.image exists (S3 URL), clear it but don't delete from S3 until form submission
    
    // Clean up object URL if it was created from local file
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    
    setFormData({ ...formData, image: "" });
    
    // If editing and we have original image, restore preview to original
    if (editingId && originalImageUrl && !selectedImageFile) {
      const currentSession = sessions.find(s => s._id === editingId);
      if (currentSession) {
        setPreviewUrl(getImageUrl(currentSession));
      }
    } else {
      setPreviewUrl("");
    }
    
    setSelectedImageFile(null);
  };

  // ====================
  // VIDEO UPLOAD (S3)
  // ====================
  const handleVideoSelect = (file: File | null) => {
    if (!file) {
      setSelectedVideoFile(null);
      return;
    }
    setSelectedVideoFile(file);
    setError(null);
  };

  const handleUploadVideoToS3 = async () => {
    if (!selectedVideoFile) return;

    setUploadingVideo(true);
    setError(null);

    try {
      // Delete old video if replacing
      if (formData.video) {
        await fetch("/api/upload/s3/delete", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: formData.video }),
        });
      }

      // Upload new video to S3
      const uploadFormData = new FormData();
      uploadFormData.append("file", selectedVideoFile);
      uploadFormData.append("folder", "videos");

      const response = await fetch("/api/upload/s3", {
        method: "POST",
        body: uploadFormData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload video to S3");
      }

      const { url } = await response.json();

      setFormData({ ...formData, video: url });
      setPreviewUrl(url);
      setSelectedVideoFile(null);
    } catch (err) {
      console.error("Error uploading video:", err);
      setError("Failed to upload video");
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleRemoveVideo = async () => {
    if (formData.video) {
      try {
        await fetch("/api/upload/s3/delete", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: formData.video }),
        });
      } catch (err) {
        console.error("Error deleting video:", err);
      }
    }
    setFormData({ ...formData, video: "" });
    setPreviewUrl("");
    setSelectedVideoFile(null);
  };

  const handleVideoUrlChange = (url: string) => {
    setFormData({ ...formData, video: url });
    setPreviewUrl(url);
  };

  // Handle benefits array
  const handleAddBenefit = () => {
    setFormData({ ...formData, benefits: [...formData.benefits, ""] });
  };

  const handleRemoveBenefit = (index: number) => {
    const newBenefits = formData.benefits.filter((_, i) => i !== index);
    setFormData({ ...formData, benefits: newBenefits.length > 0 ? newBenefits : [""] });
  };

  const handleBenefitChange = (index: number, value: string) => {
    const newBenefits = [...formData.benefits];
    newBenefits[index] = value;
    setFormData({ ...formData, benefits: newBenefits });
  };

  // Handle edit button click
  const handleEdit = (session: Session) => {
    setEditingId(session._id);
    setShowAddForm(true);
    
    // Format date to YYYY-MM-DD if it exists
    let formattedDate = "";
    if ((session as any).date) {
      const dateValue = (session as any).date;
      if (typeof dateValue === 'string') {
        // If it's already a string, use it (should be YYYY-MM-DD)
        formattedDate = dateValue.trim();
        // If it's not in YYYY-MM-DD format, try to convert
        if (!/^\d{4}-\d{2}-\d{2}$/.test(formattedDate)) {
          const parsedDate = new Date(dateValue);
          if (!isNaN(parsedDate.getTime())) {
            const year = parsedDate.getFullYear();
            const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
            const day = String(parsedDate.getDate()).padStart(2, '0');
            formattedDate = `${year}-${month}-${day}`;
          }
        }
      } else if (dateValue instanceof Date) {
        // If it's a Date object, convert to YYYY-MM-DD
        const year = dateValue.getFullYear();
        const month = String(dateValue.getMonth() + 1).padStart(2, '0');
        const day = String(dateValue.getDate()).padStart(2, '0');
        formattedDate = `${year}-${month}-${day}`;
      }
    }
    
    // Store original image URL for restore on cancel and S3 deletion on update
    const originalImg = session.imageUrl || "";
    setOriginalImageUrl(originalImg);
    
    setFormData({
      title: session.title || "",
      description: session.description || "",
      image: originalImg,
      video: session.videoUrl || "",
      format: session.format || "",
      benefits: session.benefits && session.benefits.length > 0 ? session.benefits : [""],
      instructorName: (session as any).instructorName || "",
      duration: (session as any).duration?.toString() || "",
      price: (session as any).price?.toString() || "",
      date: formattedDate,
      startTime: (session as any).startTime || "",
      featured: session.featured || false,
    });
    
    // Always use image (video no longer supported)
    if (session.imageUrl) {
      setMediaType("image");
      setPreviewUrl(getImageUrl(session));
    } else {
      setMediaType("image");
      setPreviewUrl("");
    }
    
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!formData.title.trim()) {
      setError("Title is required");
      setLoading(false);
      return;
    }

    if (!formData.description.trim()) {
      setError("Description is required");
      setLoading(false);
      return;
    }

    // Validate image is required
    if (!formData.image && !selectedImageFile) {
      // If editing and image was removed, require a new image
      if (editingId && originalImageUrl && !formData.image) {
        setError("Image is required. Please choose a new image or cancel to keep the existing one.");
        setLoading(false);
        return;
      }
      // If creating new or no original image existed
      if (!editingId || !originalImageUrl) {
        setError("Please upload an image");
        setLoading(false);
        return;
      }
    }

    // Validate featured count for private and corporate sessions (separate limits for each type)
    if (formData.featured && (activeTab === "private" || activeTab === "corporate")) {
      try {
        const response = await fetch("/api/sessions");
        const data = await response.json();
        
        if (data.success && data.data) {
          // Count existing featured sessions for the specific session type (excluding current session if editing)
          const featuredSessions = data.data.filter((s: Session) => 
            s.featured === true && 
            s.sessionType === activeTab &&
            s._id !== editingId
          );
          
          if (featuredSessions.length >= 3) {
            const sessionTypeLabel = activeTab === "private" ? "private" : "corporate";
            setError(`Maximum 3 featured sessions allowed for ${sessionTypeLabel} sessions. Please unfeature another ${sessionTypeLabel} session first.`);
            setLoading(false);
            return;
          }
        }
      } catch (error) {
        console.error("Failed to check featured sessions:", error);
        // Continue with submission if check fails
      }
    }

    try {
      const isEdit = !!editingId;
      const url = isEdit 
        ? `/api/sessions/${editingId}`
        : `/api/admin/sessions`;
      
      const method = isEdit ? "PATCH" : "POST";

      // Prepare request body
      const requestBody: {
        title: string;
        description: string;
        sessionType: TabType;
        imageUrl?: string;
        videoUrl?: string;
        format?: string;
        benefits?: string[];
        instructorName?: string;
        duration?: number;
        price?: number;
        date?: string;
        startTime?: string;
        featured?: boolean;
      } = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        sessionType: activeTab,
        format: formData.format.trim() || undefined,
        benefits: formData.benefits.filter(b => b.trim().length > 0),
      };

      // Add new fields conditionally
      if (activeTab === "discovery" || activeTab === "private") {
        requestBody.instructorName = formData.instructorName.trim();
        requestBody.duration = Number(formData.duration);
        // Ensure date is in YYYY-MM-DD format
        if (formData.date) {
          requestBody.date = formData.date.trim();
        }
        // Ensure startTime is in HH:MM format
        if (formData.startTime) {
          requestBody.startTime = formData.startTime.trim();
        }
      }

      if (activeTab === "discovery") {
        // Discovery sessions now require payment
        if (!formData.price || parseFloat(formData.price) < 0) {
          setError("Price is required for discovery sessions and must be 0 or greater");
          setLoading(false);
          return;
        }
        requestBody.price = parseFloat(formData.price);
      }

      if (activeTab === "private") {
        // Price removed - private sessions no longer require payment
      }

      // Add featured field for private and corporate sessions
      if (activeTab === "private" || activeTab === "corporate") {
        requestBody.featured = formData.featured;
      }

      if (activeTab === "freeStudioVisit") {
        requestBody.duration = Number(formData.duration);
      }

      // Handle image upload if a new file is selected (upload happens here during form submission)
      let finalImageUrl = formData.image;
      
      if (selectedImageFile) {
        // Upload new image file to S3 only during form submission
        // This prevents orphaned files if user cancels
        const uploadFormData = new FormData();
        uploadFormData.append('file', selectedImageFile);
        uploadFormData.append('folder', 'images');
        
        const uploadResponse = await fetch('/api/upload/s3', {
          method: 'POST',
          body: uploadFormData,
        });
        
        const uploadData = await uploadResponse.json();
        
        if (!uploadResponse.ok || !uploadData.success || !uploadData.url) {
          throw new Error('Failed to upload image to S3');
        }
        
        finalImageUrl = uploadData.url;
      }
      
      // Always use image (must have image or selectedImageFile will be uploaded)
      if (!finalImageUrl) {
        // If editing and no new image selected, use original image
        if (isEdit && originalImageUrl && !selectedImageFile) {
          finalImageUrl = originalImageUrl;
        } else {
          throw new Error('Image is required');
        }
      }
      
      requestBody.imageUrl = finalImageUrl;
      
      if (isEdit) {
        // Clear video if it exists when editing
        const currentSession = sessions.find(s => s._id === editingId);
        if (currentSession?.videoUrl) {
          requestBody.videoUrl = "";
        }
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || `Failed to ${isEdit ? "update" : "create"} session`);
      }

      // After successful update, delete old image from S3 if it was replaced
      if (isEdit && originalImageUrl && finalImageUrl && originalImageUrl !== finalImageUrl && originalImageUrl.startsWith('https://')) {
        try {
          await fetch("/api/upload/s3/delete", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: originalImageUrl }),
          });
          console.log(`✓ Deleted old image from S3: ${originalImageUrl}`);
        } catch (err) {
          console.error("Error deleting old image from S3:", err);
          // Don't fail the update if deletion fails
        }
      }

      setSuccess(`Session ${isEdit ? "updated" : "created"} successfully!`);
      setFormData({ 
        title: "", 
        description: "", 
        image: "", 
        video: "", 
        format: "", 
        benefits: [""],
        instructorName: "",
        duration: "",
        price: "",
        date: "",
        startTime: "",
        featured: false,
      });
      setMediaType(null);
      setPreviewUrl("");
      setEditingId(null);
      setOriginalImageUrl("");
      setSelectedImageFile(null);
      
      // Refresh sessions list
      await fetchSessions();
      
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
    // Clean up object URL if it was created from local file
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    
    // If editing, restore original image
    if (editingId && originalImageUrl) {
      const currentSession = sessions.find(s => s._id === editingId);
      if (currentSession) {
        setFormData({ 
          ...formData,
          image: originalImageUrl,
        });
        setPreviewUrl(getImageUrl(currentSession));
      }
    }
    
    setShowAddForm(false);
    setFormData({ 
      title: "", 
      description: "", 
      image: "", 
      video: "", 
      format: "", 
      benefits: [""],
      instructorName: "",
      duration: "",
      price: "",
      date: "",
      startTime: "",
      featured: false,
    });
    setMediaType(null);
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
        <h1 className="text-3xl font-bold text-white mb-6">Yoga Sessions Management</h1>

        {/* Tabs */}
        <div className="border-b border-zinc-800 mb-6">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setShowAddForm(false);
                  setFormData({ 
                    title: "", 
                    description: "", 
                    image: "", 
                    video: "", 
                    format: "", 
                    benefits: [""],
                    instructorName: "",
                    duration: "",
                    price: "",
                    date: "",
                    startTime: "",
                    featured: false,
                  });
                  setMediaType(null);
                  setPreviewUrl("");
                  setError(null);
                  setSuccess(null);
                }}
                className={`
                  whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors
                  ${
                    activeTab === tab.id
                      ? "border-emerald-500 text-emerald-400"
                      : "border-transparent text-zinc-400 hover:border-zinc-600 hover:text-zinc-300"
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Add Button and Search */}
        {!showAddForm && (
          <div className="mb-6 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <button
                onClick={() => {
                  setShowAddForm(true);
                  setMediaType("image");
                }}
                className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
              >
                Add {tabs.find(t => t.id === activeTab)?.label}
              </button>
              {totalSessions > 0 && (
                <div className="text-sm text-zinc-400">
                  Total {tabs.find(t => t.id === activeTab)?.label}: {totalSessions}
                </div>
              )}
            </div>
            
            {/* Search */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" size={20} />
              <input
                type="text"
                placeholder="Search sessions by title, description, instructor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {/* Sessions List */}
        {!showAddForm && (
          <div className="mt-6">
            {sessionsLoading ? (
              <div className="text-zinc-400 text-center py-8">Loading sessions...</div>
            ) : filteredSessions.length === 0 ? (
              <div className="rounded-lg border border-zinc-700 bg-zinc-800 p-10 text-center">
                <p className="text-zinc-400 mb-2">No {tabs.find(t => t.id === activeTab)?.label.toLowerCase()} sessions found</p>
                {sessions.length > 0 && (
                  <p className="text-zinc-500 text-sm mt-2">
                    Total sessions in database: {sessions.length} (showing filtered results for {activeTab})
                  </p>
                )}
                {sessions.length === 0 && (
                  <p className="text-zinc-500 text-sm mt-2">Create your first session using the Add button above.</p>
                )}
              </div>
            ) : (
              <div className="rounded-lg border border-zinc-700 bg-zinc-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-sm">
                    <thead>
                      <tr className="border-b border-zinc-700 bg-zinc-900 text-left text-xs uppercase tracking-wide text-zinc-400">
                        <th className="px-6 py-3 font-medium">Media</th>
                        <th className="px-6 py-3 font-medium">Title</th>
                        {(activeTab === "discovery" || activeTab === "private") ? (
                          <>
                            <th className="px-6 py-3 font-medium">Date & Time</th>
                            <th className="px-6 py-3 font-medium">Instructor</th>
                            {activeTab === "discovery" && (
                              <th className="px-6 py-3 font-medium">Price</th>
                            )}
                          </>
                        ) : (
                          <th className="px-6 py-3 font-medium">Description</th>
                        )}
                        <th className="px-6 py-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSessions.map((session) => (
                        <tr key={session._id} className="border-b border-zinc-700 last:border-0">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {session.imageUrl && (
                                <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-zinc-700 bg-zinc-900">
                                  <img
                                    src={getImageUrl(session)}
                                    alt={session.title || "Session"}
                                    className="h-full w-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.style.display = "none";
                                    }}
                                  />
                                </div>
                              )}
                              {session.videoUrl && !session.imageUrl && (
                                <div className="h-16 w-16 flex-shrink-0 rounded-md border border-zinc-700 bg-zinc-900 flex items-center justify-center">
                                  <span className="text-zinc-400 text-xs">🎥</span>
                                </div>
                              )}
                              {!session.imageUrl && !session.videoUrl && (
                                <div className="h-16 w-16 flex-shrink-0 rounded-md border border-zinc-700 bg-zinc-900 flex items-center justify-center">
                                  <span className="text-zinc-500 text-xs">No Media</span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-white">{session.title || "Untitled Session"}</p>
                              {session.videoUrl && (
                                <span className="text-xs text-zinc-500" title="Has video">
                                  🎥
                                </span>
                              )}
                            </div>
                          </td>
                          {(activeTab === "discovery" || activeTab === "private") ? (
                            <>
                              <td className="px-6 py-4 text-zinc-400">
                                {session.date && session.startTime ? (
                                  <div className="text-xs">
                                    <div className="font-medium text-white">
                                      {new Date(session.date + 'T00:00:00').toLocaleDateString('en-US', {
                                        year: "numeric",
                                        month: "short",
                                        day: "numeric",
                                        timeZone: 'Asia/Singapore'
                                      })}
                                    </div>
                                    <div className="text-zinc-500 mt-1">
                                      {(() => {
                                        const { hour, minute, amPm } = convertTo12Hour(session.startTime);
                                        return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${amPm}`;
                                      })()}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-zinc-500 text-xs">Not set</span>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                {session.instructorName ? (
                                  <p className="text-xs text-white font-medium">
                                    {session.instructorName}
                                  </p>
                                ) : (
                                  <span className="text-zinc-500 text-xs">Not set</span>
                                )}
                              </td>
                              {activeTab === "discovery" && (
                                <td className="px-6 py-4">
                                  <p className="text-xs text-white font-medium">
                                    ${(session as any).price?.toFixed(2) || '0.00'}
                                  </p>
                                </td>
                              )}
                            </>
                          ) : (
                            <td className="px-6 py-4">
                              {session.description ? (
                                <p className="line-clamp-2 text-xs text-zinc-400 max-w-md">
                                  {session.description}
                                </p>
                              ) : (
                                <span className="text-zinc-500 text-xs">No description</span>
                              )}
                            </td>
                          )}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEdit(session)}
                                className="rounded-md border border-zinc-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-zinc-700"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(session._id)}
                                disabled={deletingId === session._id}
                                className="rounded-md border border-red-600 px-3 py-1 text-xs font-medium text-red-400 transition-colors hover:bg-red-900/20 disabled:opacity-50"
                              >
                                {deletingId === session._id ? "Deleting..." : "Delete"}
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
                    Showing page {currentPage} of {totalPages} ({totalSessions} total {tabs.find(t => t.id === activeTab)?.label.toLowerCase()})
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
                {editingId ? "Edit" : "Add"} {tabs.find(t => t.id === activeTab)?.label}
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

            <div className="space-y-1">
              <label htmlFor="session-title" className="text-sm font-medium text-white">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                id="session-title"
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
                placeholder="Enter session title"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="session-image" className="text-sm font-medium text-white">
                Image <span className="text-red-500">*</span>
              </label>
                <input
                  id="session-image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageSelect(e.target.files?.[0] || null)}
                  className="w-full rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
                />
                
                {/* Selected file preview (not uploaded to S3 yet) */}
                {selectedImageFile && !formData.image && (
                  <div className="bg-zinc-800 border border-zinc-600 rounded-md p-3 mt-2">
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <p className="text-sm text-white font-medium">📁 {selectedImageFile.name}</p>
                        <p className="text-xs text-zinc-400 mt-1">
                          Size: {(selectedImageFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                        <p className="text-xs text-yellow-500 mt-2">⚠️ Image will be uploaded when you save the form</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          // Clean up object URL
                          if (previewUrl && previewUrl.startsWith('blob:')) {
                            URL.revokeObjectURL(previewUrl);
                          }
                          setSelectedImageFile(null);
                          setPreviewUrl("");
                          setFormData({ ...formData, image: "" });
                          // If editing, restore original image preview
                          if (editingId && originalImageUrl) {
                            const currentSession = sessions.find(s => s._id === editingId);
                            if (currentSession) {
                              setPreviewUrl(getImageUrl(currentSession));
                            }
                          }
                        }}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}

                {/* Uploaded image */}
                {previewUrl && formData.image && (
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
              <label htmlFor="session-description" className="text-sm font-medium text-white">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="session-description"
                rows={4}
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
                placeholder="Enter session description"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="session-format" className="text-sm font-medium text-white">
                Format
              </label>
              <input
                id="session-format"
                type="text"
                value={formData.format}
                onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                className="w-full rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
                placeholder="Enter session format (e.g., Online, In-person, Hybrid)"
              />
            </div>

            {/* Instructor Name - For Discovery and Private */}
            {(activeTab === "discovery" || activeTab === "private") && (
              <div className="space-y-1">
                <label htmlFor="instructor-name" className="text-sm font-medium text-white">
                  Instructor Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="instructor-name"
                  type="text"
                  required={activeTab === "discovery" || activeTab === "private"}
                  value={formData.instructorName}
                  onChange={(e) => setFormData({ ...formData, instructorName: e.target.value })}
                  className="w-full rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
                  placeholder="Enter instructor name"
                />
              </div>
            )}

            {/* Duration - For Discovery, Private, and Free Studio Visit */}
            {(activeTab === "discovery" || activeTab === "private" || activeTab === "freeStudioVisit") && (
              <div className="space-y-1">
                <label htmlFor="duration" className="text-sm font-medium text-white">
                  Duration (minutes) <span className="text-red-500">*</span>
                </label>
                <select
                  id="duration"
                  required={activeTab === "discovery" || activeTab === "private" || activeTab === "freeStudioVisit"}
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  className="w-full rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
                >
                  <option value="">Select Duration</option>
                  <option value="30">30 minutes</option>
                  <option value="60">1 hour (60 minutes)</option>
                  <option value="75">45 minutes</option>
                  <option value="75">75 minutes</option>
                  <option value="90">1.5 hours (90 minutes)</option>
                  <option value="120">2 hours (120 minutes)</option>
                </select>
              </div>
            )}

            {/* Price - For Discovery Sessions Only */}
            {activeTab === "discovery" && (
              <div className="space-y-1">
                <label htmlFor="price" className="text-sm font-medium text-white">
                  Price (USD) <span className="text-red-500">*</span>
                </label>
                <input
                  id="price"
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
                  placeholder="Enter price (e.g., 50.00)"
                />
                <p className="text-xs text-zinc-400 mt-1">
                  Discovery sessions now require payment. Enter the price in USD.
                </p>
              </div>
            )}


            {/* Featured - For Private and Corporate Only */}
            {(activeTab === "private" || activeTab === "corporate") && (
              <div className="space-y-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    className="w-4 h-4 rounded border-zinc-600 bg-zinc-900 text-white focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-zinc-900"
                  />
                  <span className="text-sm font-medium text-white">
                    Featured Session (Maximum 3 featured {activeTab} sessions allowed)
                  </span>
                </label>
              </div>
            )}

            {/* Date - For Discovery Only */}
            {activeTab === "discovery" && (
              <div className="space-y-1 relative">
                <label htmlFor="date" className="text-sm font-medium text-white">
                  Date <span className="text-red-500">{!editingId ? "*" : ""}</span>
                  {editingId && <span className="text-xs text-zinc-400 ml-2">(Cannot be changed after creation)</span>}
                </label>
                <div className="relative">
                  <input
                    id="date"
                    type="text"
                    required={activeTab === "discovery" && !editingId}
                    value={formData.date ? (() => {
                      // Parse date string (YYYY-MM-DD) and format for display
                      const dateParts = formData.date.split('-');
                      if (dateParts.length === 3) {
                        const year = dateParts[0];
                        const month = dateParts[1];
                        const day = dateParts[2];
                        return `${month}/${day}/${year}`;
                      }
                      return formData.date;
                    })() : ""}
                    readOnly
                    onClick={() => !editingId && setShowCalendar(!showCalendar)}
                    placeholder="mm/dd/yyyy"
                    disabled={!!editingId}
                    className={`w-full rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 pr-10 text-sm text-white focus:border-white focus:outline-none ${
                      editingId ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
                    }`}
                  />
                  <Calendar 
                    className={`absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none ${
                      editingId ? 'text-zinc-600' : 'text-zinc-400'
                    }`}
                  />
                </div>
                
                {/* Calendar Picker - Only show when not editing */}
                {showCalendar && !editingId && (
                  <div 
                    ref={calendarRef}
                    className="absolute z-50 mt-2 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl p-4 w-80"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <button
                        onClick={() => {
                          if (currentMonth === 0) {
                            setCurrentMonth(11);
                            setCurrentYear(currentYear - 1);
                          } else {
                            setCurrentMonth(currentMonth - 1);
                          }
                        }}
                        className="p-1 hover:bg-zinc-700 rounded"
                      >
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <h3 className="text-white font-semibold">
                        {new Date(currentYear, currentMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </h3>
                      <button
                        onClick={() => {
                          if (currentMonth === 11) {
                            setCurrentMonth(0);
                            setCurrentYear(currentYear + 1);
                          } else {
                            setCurrentMonth(currentMonth + 1);
                          }
                        }}
                        className="p-1 hover:bg-zinc-700 rounded"
                      >
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                        <div key={day} className="text-center text-xs text-zinc-400 font-medium py-1">
                          {day}
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {getCalendarDays().map(({ day, isCurrentMonth }, idx) => {
                        const dateStr = new Date(currentYear, currentMonth, day).toISOString().split('T')[0];
                        const isSelected = formData.date === dateStr;
                        const today = new Date();
                        const isToday = day === today.getDate() && 
                                       currentMonth === today.getMonth() && 
                                       currentYear === today.getFullYear() &&
                                       isCurrentMonth;
                        const isPast = isCurrentMonth && new Date(currentYear, currentMonth, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());

                        return (
                          <button
                            key={idx}
                            onClick={() => !isPast && handleDateSelect(day, isCurrentMonth)}
                            disabled={isPast || !isCurrentMonth}
                            className={`
                              p-2 text-sm rounded
                              ${!isCurrentMonth ? 'text-zinc-600' : ''}
                              ${isPast ? 'text-zinc-600 cursor-not-allowed' : 'text-white hover:bg-zinc-700 cursor-pointer'}
                              ${isSelected ? 'bg-white text-zinc-900 font-semibold' : ''}
                              ${isToday && !isSelected ? 'ring-2 ring-zinc-500' : ''}
                            `}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Start Time - For Discovery Only */}
            {activeTab === "discovery" && (
              <div className="space-y-1 relative">
                <label htmlFor="start-time" className="text-sm font-medium text-white">
                  Start Time <span className="text-red-500">{!editingId ? "*" : ""}</span>
                  {editingId && <span className="text-xs text-zinc-400 ml-2">(Cannot be changed after creation)</span>}
                </label>
                <div className="relative">
                  <input
                    id="start-time"
                    type="text"
                    required={activeTab === "discovery" && !editingId}
                    value={formData.startTime ? (() => {
                      const { hour, minute, amPm } = convertTo12Hour(formData.startTime);
                      return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${amPm}`;
                    })() : ""}
                    readOnly
                    onClick={() => !editingId && setShowTimePicker(!showTimePicker)}
                    placeholder="--:-- --"
                    disabled={!!editingId}
                    className={`w-full rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 pr-10 text-sm text-white focus:border-white focus:outline-none ${
                      editingId ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
                    }`}
                  />
                  <Clock 
                    className={`absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none ${
                      editingId ? 'text-zinc-600' : 'text-zinc-400'
                    }`}
                  />
                </div>

                {/* Time Picker - Only show when not editing */}
                {showTimePicker && !editingId && (
                  <div 
                    ref={timePickerRef}
                    className="absolute z-50 mt-2 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl p-4 w-64"
                  >
                    <div className="flex items-center justify-center gap-4 mb-4">
                      {/* Hour */}
                      <div className="flex flex-col items-center">
                        <label className="text-xs text-zinc-400 mb-2">Hour</label>
                        <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
                          {Array.from({ length: 12 }, (_, i) => i + 1).map(hour => (
                            <button
                              key={hour}
                              onClick={() => setSelectedHour(hour)}
                              className={`px-3 py-1 rounded text-sm ${
                                selectedHour === hour
                                  ? 'bg-white text-zinc-900 font-semibold'
                                  : 'text-white hover:bg-zinc-700'
                              }`}
                            >
                              {String(hour).padStart(2, '0')}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Minute */}
                      <div className="flex flex-col items-center">
                        <label className="text-xs text-zinc-400 mb-2">Minute</label>
                        <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
                          {[0, 15, 30, 45].map(minute => (
                            <button
                              key={minute}
                              onClick={() => setSelectedMinute(minute)}
                              className={`px-3 py-1 rounded text-sm ${
                                selectedMinute === minute
                                  ? 'bg-white text-zinc-900 font-semibold'
                                  : 'text-white hover:bg-zinc-700'
                              }`}
                            >
                              {String(minute).padStart(2, '0')}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* AM/PM */}
                      <div className="flex flex-col items-center">
                        <label className="text-xs text-zinc-400 mb-2">Period</label>
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => setSelectedAmPm("AM")}
                            className={`px-3 py-1 rounded text-sm ${
                              selectedAmPm === "AM"
                                ? 'bg-white text-zinc-900 font-semibold'
                                : 'text-white hover:bg-zinc-700'
                            }`}
                          >
                            AM
                          </button>
                          <button
                            onClick={() => setSelectedAmPm("PM")}
                            className={`px-3 py-1 rounded text-sm ${
                              selectedAmPm === "PM"
                                ? 'bg-white text-zinc-900 font-semibold'
                                : 'text-white hover:bg-zinc-700'
                            }`}
                          >
                            PM
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={handleTimeSelect}
                        className="flex-1 bg-white text-zinc-900 py-2 rounded font-medium hover:bg-zinc-100 transition"
                      >
                        Set Time
                      </button>
                      <button
                        onClick={() => setShowTimePicker(false)}
                        className="flex-1 bg-zinc-700 text-white py-2 rounded font-medium hover:bg-zinc-600 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-sm font-medium text-white">
                Benefits
              </label>
              <div className="space-y-2">
                {formData.benefits.map((benefit, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={benefit}
                      onChange={(e) => handleBenefitChange(index, e.target.value)}
                      className="flex-1 rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
                      placeholder={`Benefit ${index + 1}`}
                    />
                    {formData.benefits.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveBenefit(index)}
                        className="rounded-md border border-red-600 px-3 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-900/20"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddBenefit}
                  className="inline-flex items-center justify-center rounded-md border border-emerald-600 px-4 py-2 text-sm font-medium text-emerald-400 transition-colors hover:bg-emerald-900/20"
                >
                  + Add Benefit
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (editingId ? "Updating..." : "Creating...") : (editingId ? "Update Session" : "Create Session")}
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

