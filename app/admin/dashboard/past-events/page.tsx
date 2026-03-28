"use client";

import { useState, useEffect } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";

type PastEvent = {
  _id: string;
  name: string;
  title: string;
  location: string;
  day: string;
  time: string;
  date: string;
  endDate?: string;
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
    endDate: "",
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
  const [selectedPhotoFiles, setSelectedPhotoFiles] = useState<(File | null)[]>([null, null, null, null, null, null]);
  const [selectedVideoFiles, setSelectedVideoFiles] = useState<(File | null)[]>([null, null]);
  
  // Track original media URLs when editing (for restore on cancel)
  const [originalThumbnailUrl, setOriginalThumbnailUrl] = useState<string>("");
  const [originalPhotos, setOriginalPhotos] = useState<string[]>([]);
  const [originalVideos, setOriginalVideos] = useState<string[]>([]);

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

  // Auto-populate Day based on Date and EndDate (same logic as events dashboard)
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
      if (prev.day !== dayString) {
        return { ...prev, day: dayString };
      }
      return prev;
    });
  }, [formData.date, formData.endDate]);

  // Normalize image URL for display
  const getImageUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("data:image")) return url;
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `data:image/jpeg;base64,${url}`;
  };

  // Handle delete with toast confirmation
  const handleDelete = async (id: string) => {
    const event = pastEvents.find(e => e._id === id);
    const eventTitle = event?.title || "this past event";
    
    // Toast-based confirmation
    const confirmed = await new Promise<boolean>((resolve) => {
      const toastId = toast(
        (t) => (
          <div className="flex flex-col gap-3">
            <p className="text-white font-medium">Delete Past Event?</p>
            <p className="text-sm text-zinc-300">Are you sure you want to delete "{eventTitle}"? This action cannot be undone.</p>
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
        { duration: Infinity }
      );
    });

    if (!confirmed) return;

    setDeletingId(id);
    const deletePromise = fetch(`/api/admin/past-events/${id}`, {
      method: "DELETE",
    }).then(async (response) => {
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to delete past event");
      }
      setPastEvents(pastEvents.filter((e) => e._id !== id));
      return data;
    });

    toast.promise(deletePromise, {
      loading: "Deleting past event...",
      success: "Past event deleted successfully!",
      error: (err) => err.message || "Failed to delete past event",
    });

    try {
      await deletePromise;
    } catch {
      // Error handled by toast.promise
    } finally {
      setDeletingId(null);
    }
  };

  // ====================
  // THUMBNAIL UPLOAD (S3) - Upload only on form submission
  // ====================
  const handleThumbnailSelect = (file: File | null) => {
    if (!file) {
      setSelectedThumbnailFile(null);
      setThumbnailPreview("");
      setFormData({ ...formData, thumbnailImage: "" });
      return;
    }
    setSelectedThumbnailFile(file);
    // Clear any existing thumbnail URL when selecting new file
    setFormData({ ...formData, thumbnailImage: "" });
    // Use local file preview (not uploaded to S3 yet)
    setThumbnailPreview(URL.createObjectURL(file));
    setError(null);
  };

  const handleRemoveThumbnail = () => {
    // Clean up object URL if it was created from local file
    if (thumbnailPreview && thumbnailPreview.startsWith('blob:')) {
      URL.revokeObjectURL(thumbnailPreview);
    }
    
    setFormData({ ...formData, thumbnailImage: "" });
    
    // If editing and we have original thumbnail, restore preview to original
    if (editingId && originalThumbnailUrl && !selectedThumbnailFile) {
      setThumbnailPreview(getImageUrl(originalThumbnailUrl));
    } else {
      setThumbnailPreview("");
    }
    
    setSelectedThumbnailFile(null);
  };

  // ====================
  // PHOTOS UPLOAD (S3) - Max 6 - Upload only on form submission
  // ====================
  const handlePhotoSelect = (file: File | null, index: number) => {
    if (!file) {
      const newFiles = [...selectedPhotoFiles];
      newFiles[index] = null;
      setSelectedPhotoFiles(newFiles);
      // Update preview
      const newPreviews = [...photoPreviews];
      if (editingId && originalPhotos[index]) {
        newPreviews[index] = getImageUrl(originalPhotos[index]);
      } else {
        newPreviews[index] = "";
      }
      setPhotoPreviews(newPreviews);
      return;
    }
    const newFiles = [...selectedPhotoFiles];
    newFiles[index] = file;
    setSelectedPhotoFiles(newFiles);
    // Clear existing photo URL at this index
    const newPhotos = [...formData.photos];
    newPhotos[index] = "";
    setFormData({ ...formData, photos: newPhotos });
    // Use local file preview (not uploaded to S3 yet)
    const newPreviews = [...photoPreviews];
    newPreviews[index] = URL.createObjectURL(file);
    setPhotoPreviews(newPreviews);
    setError(null);
  };

  const handleRemovePhoto = (index: number) => {
    // Clean up object URL if it was created from local file
    if (photoPreviews[index] && photoPreviews[index].startsWith('blob:')) {
      URL.revokeObjectURL(photoPreviews[index]);
    }

    // Keep fixed 6 slots so slot index always matches the same position (don't filter/shrink)
    const newPhotos = [...formData.photos];
    while (newPhotos.length < 6) newPhotos.push("");
    newPhotos[index] = "";
    setFormData({ ...formData, photos: newPhotos });

    const newPreviews = [...photoPreviews];
    while (newPreviews.length < 6) newPreviews.push("");
    newPreviews[index] = "";
    setPhotoPreviews(newPreviews);

    const newFiles = [...selectedPhotoFiles];
    newFiles[index] = null;
    setSelectedPhotoFiles(newFiles);
  };

  // ====================
  // VIDEOS UPLOAD (S3) - Max 2 - Upload only on form submission
  // ====================
  const handleVideoSelect = (file: File | null, index: number) => {
    if (!file) {
      const newFiles = [...selectedVideoFiles];
      newFiles[index] = null;
      setSelectedVideoFiles(newFiles);
      // Update preview
      const newPreviews = [...videoPreviews];
      if (editingId && originalVideos[index]) {
        newPreviews[index] = originalVideos[index];
      } else {
        newPreviews[index] = "";
      }
      setVideoPreviews(newPreviews);
      return;
    }
    const newFiles = [...selectedVideoFiles];
    newFiles[index] = file;
    setSelectedVideoFiles(newFiles);
    // Clear existing video URL at this index
    const newVideos = [...formData.videos];
    newVideos[index] = "";
    setFormData({ ...formData, videos: newVideos });
    // Use local file preview (not uploaded to S3 yet)
    const newPreviews = [...videoPreviews];
    newPreviews[index] = URL.createObjectURL(file);
    setVideoPreviews(newPreviews);
    setError(null);
  };

  const handleUnselectVideo = (index: number) => {
    // Clean up object URL if it was created from local file
    if (videoPreviews[index] && videoPreviews[index].startsWith('blob:')) {
      URL.revokeObjectURL(videoPreviews[index]);
    }
    
    const newFiles = [...selectedVideoFiles];
    newFiles[index] = null;
    setSelectedVideoFiles(newFiles);
    
    // Update preview
    const newPreviews = [...videoPreviews];
    if (editingId && originalVideos[index]) {
      newPreviews[index] = originalVideos[index];
    } else {
      newPreviews[index] = "";
    }
    setVideoPreviews(newPreviews);
    setError(null);
  };

  const handleRemoveVideo = (index: number) => {
    // Clean up object URL if it was created from local file
    if (videoPreviews[index] && videoPreviews[index].startsWith('blob:')) {
      URL.revokeObjectURL(videoPreviews[index]);
    }
    
    // Keep arrays at fixed length (2 slots) to maintain indices - don't filter!
    const newVideos = [...formData.videos];
    // Ensure array has exactly 2 slots
    while (newVideos.length < 2) {
      newVideos.push("");
    }
    // Remove video at specific index only
    newVideos[index] = "";
    setFormData({ ...formData, videos: newVideos });
    
    // Update preview - maintain fixed indices (2 slots)
    const newPreviews = [...videoPreviews];
    // Ensure array has exactly 2 slots
    while (newPreviews.length < 2) {
      newPreviews.push("");
    }
    if (editingId && originalVideos[index] && !selectedVideoFiles[index]) {
      newPreviews[index] = originalVideos[index];
    } else {
      newPreviews[index] = "";
    }
    setVideoPreviews(newPreviews);

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
    // Store original media URLs for restore on cancel and S3 deletion on update
    const originalThumb = pastEvent.thumbnailImage || "";
    const originalPhotosArray = pastEvent.photos || [];
    const originalVideosArray = pastEvent.videos || [];
    
    setOriginalThumbnailUrl(originalThumb);
    setOriginalPhotos(originalPhotosArray);
    setOriginalVideos(originalVideosArray);
    
    setEditingId(pastEvent._id);
    setShowAddForm(true);
    const timeRange = parseTimeRange(pastEvent.time || "");
    // Pad photos to 6 fixed slots so remove button always targets the correct slot
    const paddedPhotos = [...originalPhotosArray];
    while (paddedPhotos.length < 6) paddedPhotos.push("");
    const paddedPreviews = originalPhotosArray.map(p => getImageUrl(p));
    while (paddedPreviews.length < 6) paddedPreviews.push("");

    setFormData({
      name: pastEvent.name || "",
      title: pastEvent.title || "",
      location: pastEvent.location || "",
      day: pastEvent.day || "",
      time: pastEvent.time || "",
      date: pastEvent.date || "",
      endDate: pastEvent.endDate || "",
      description: pastEvent.description || "",
      thumbnailImage: originalThumb,
      photos: paddedPhotos,
      videos: originalVideosArray,
    });
    setStartHour(timeRange.startHour);
    setStartMinute(timeRange.startMinute);
    setStartPeriod(timeRange.startPeriod);
    setEndHour(timeRange.endHour);
    setEndMinute(timeRange.endMinute);
    setEndPeriod(timeRange.endPeriod);
    
    setThumbnailPreview(originalThumb ? getImageUrl(originalThumb) : "");
    setPhotoPreviews(paddedPreviews);
    setVideoPreviews(originalVideosArray);
    
    // Clear selected files
    setSelectedThumbnailFile(null);
    setSelectedPhotoFiles([null, null, null, null, null, null]);
    setSelectedVideoFiles([null, null]);
    
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

    // Validate thumbnail (must have either existing or new file)
    if (!formData.thumbnailImage && !selectedThumbnailFile) {
      setError("Thumbnail image is required");
      setLoading(false);
      return;
    }

    try {
      const isEdit = !!editingId;
      
      // Upload all media during form submission
      let finalThumbnailUrl = formData.thumbnailImage;
      let finalPhotos: string[] = [...formData.photos];
      let finalVideos: string[] = [...formData.videos];
      
      // Upload thumbnail if new file selected
      if (selectedThumbnailFile) {
        const uploadToastId = toast.loading(
          <div className="flex flex-col gap-2">
            <span className="text-white font-medium">Uploading thumbnail to S3...</span>
            <div className="w-full bg-zinc-700 rounded-full h-2">
              <div className="bg-emerald-600 h-2 rounded-full animate-pulse" style={{ width: '50%' }}></div>
            </div>
          </div>,
          { duration: Infinity }
        );
        
        try {
          const uploadFormData = new FormData();
          uploadFormData.append('file', selectedThumbnailFile);
          uploadFormData.append('folder', 'images');
          
          const uploadResponse = await fetch('/api/upload/cloudinary', {
            method: 'POST',
            body: uploadFormData,
          });
          
          const uploadData = await uploadResponse.json();
          
          if (!uploadResponse.ok || !uploadData.success || !uploadData.url) {
            throw new Error('Failed to upload thumbnail to S3');
          }
          
          finalThumbnailUrl = uploadData.url;
          toast.dismiss(uploadToastId);
          toast.success('Thumbnail uploaded successfully!', { duration: 2000 });
        } catch (uploadErr) {
          toast.dismiss(uploadToastId);
          throw new Error('Failed to upload thumbnail. Please try again.');
        }
      }
      
      // Upload photos if new files selected
      for (let i = 0; i < selectedPhotoFiles.length; i++) {
        const file = selectedPhotoFiles[i];
        if (file) {
          const uploadToastId = toast.loading(
            <div className="flex flex-col gap-2">
              <span className="text-white font-medium">Uploading photo {i + 1} to S3...</span>
              <div className="w-full bg-zinc-700 rounded-full h-2">
                <div className="bg-emerald-600 h-2 rounded-full animate-pulse" style={{ width: '50%' }}></div>
              </div>
            </div>,
            { duration: Infinity }
          );
          
          try {
            const uploadFormData = new FormData();
            uploadFormData.append('file', file);
            uploadFormData.append('folder', 'images');
            
            const uploadResponse = await fetch('/api/upload/cloudinary', {
              method: 'POST',
              body: uploadFormData,
            });
            
            const uploadData = await uploadResponse.json();
            
            if (!uploadResponse.ok || !uploadData.success || !uploadData.url) {
              throw new Error(`Failed to upload photo ${i + 1} to S3`);
            }
            
            // Insert or replace at index i
            if (finalPhotos.length <= i) {
              finalPhotos.push(uploadData.url);
            } else {
              finalPhotos[i] = uploadData.url;
            }
            
            toast.dismiss(uploadToastId);
            toast.success(`Photo ${i + 1} uploaded successfully!`, { duration: 2000 });
          } catch (uploadErr) {
            toast.dismiss(uploadToastId);
            throw new Error(`Failed to upload photo ${i + 1}. Please try again.`);
          }
        }
      }
      
      // Upload videos if new files selected
      for (let i = 0; i < selectedVideoFiles.length; i++) {
        const file = selectedVideoFiles[i];
        if (file) {
          const uploadToastId = toast.loading(
            <div className="flex flex-col gap-2">
              <span className="text-white font-medium">Uploading video {i + 1} to S3...</span>
              <div className="w-full bg-zinc-700 rounded-full h-2">
                <div className="bg-emerald-600 h-2 rounded-full animate-pulse" style={{ width: '50%' }}></div>
              </div>
            </div>,
            { duration: Infinity }
          );
          
          try {
            const presignedRes = await fetch('/api/upload/cloudinary/presigned', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                folder: 'videos',
              }),
            });
            const presignedData = await presignedRes.json();
            if (!presignedRes.ok || !presignedData.success || !presignedData.uploadUrl || !presignedData.fields) {
              throw new Error(presignedData.message || 'Failed to get upload URL');
            }
            const cloudForm = new FormData();
            cloudForm.append('file', file);
            cloudForm.append('api_key', presignedData.fields.api_key);
            cloudForm.append('timestamp', presignedData.fields.timestamp);
            cloudForm.append('signature', presignedData.fields.signature);
            cloudForm.append('folder', presignedData.fields.folder);
            const putRes = await fetch(presignedData.uploadUrl, {
              method: 'POST',
              body: cloudForm,
            });
            const uploadJson = await putRes.json();
            if (!putRes.ok || uploadJson.error) {
              throw new Error(uploadJson.error?.message || `Upload failed: ${putRes.status}`);
            }
            const secureUrl = uploadJson.secure_url as string | undefined;
            if (!secureUrl) throw new Error('No secure_url from Cloudinary');
            if (finalVideos.length <= i) {
              finalVideos.push(secureUrl);
            } else {
              finalVideos[i] = secureUrl;
            }
            toast.dismiss(uploadToastId);
            toast.success(`Video ${i + 1} uploaded successfully!`, { duration: 2000 });
          } catch (uploadErr) {
            toast.dismiss(uploadToastId);
            throw new Error(`Failed to upload video ${i + 1}. Please try again.`);
          }
        }
      }
      
      // Use original thumbnail if editing and no new one uploaded
      if (!finalThumbnailUrl && isEdit && originalThumbnailUrl) {
        finalThumbnailUrl = originalThumbnailUrl;
      }
      
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
        endDate?: string;
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
        endDate: formData.endDate.trim() ? formData.endDate.trim() : undefined,
        description: formData.description.trim(),
        thumbnailImage: finalThumbnailUrl,
        photos: finalPhotos.filter(p => p !== ""),
        videos: finalVideos.filter(v => v !== ""),
      };

      // Show saving toast
      const saveToastId = toast.loading(
        <div className="flex flex-col gap-2">
          <span className="text-white font-medium">{isEdit ? "Updating past event..." : "Creating past event..."}</span>
          <div className="w-full bg-zinc-700 rounded-full h-2">
            <div className="bg-emerald-600 h-2 rounded-full animate-pulse" style={{ width: '70%' }}></div>
          </div>
        </div>,
        { duration: Infinity }
      );

      const response = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      toast.dismiss(saveToastId);

      if (!response.ok || !data.success) {
        throw new Error(data.message || `Failed to ${isEdit ? "update" : "create"} past event`);
      }

      // After successful update, delete old media from S3 if it was replaced
      if (isEdit) {
        // Delete old thumbnail if replaced
        if (originalThumbnailUrl && finalThumbnailUrl && originalThumbnailUrl !== finalThumbnailUrl && originalThumbnailUrl.startsWith('https://')) {
          try {
            await fetch("/api/upload/cloudinary/delete", {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ url: originalThumbnailUrl }),
            });
          } catch (err) {
            console.error("Error deleting old thumbnail from S3:", err);
          }
        }
        
        // Delete old photos that were removed
        originalPhotos.forEach((oldPhoto, index) => {
          if (oldPhoto && !finalPhotos.includes(oldPhoto) && oldPhoto.startsWith('https://')) {
            fetch("/api/upload/cloudinary/delete", {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ url: oldPhoto }),
            }).catch(err => console.error("Error deleting old photo from S3:", err));
          }
        });
        
        // Delete old videos that were removed
        originalVideos.forEach((oldVideo, index) => {
          if (oldVideo && !finalVideos.includes(oldVideo) && oldVideo.startsWith('https://')) {
            fetch("/api/upload/cloudinary/delete", {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ url: oldVideo }),
            }).catch(err => console.error("Error deleting old video from S3:", err));
          }
        });
      }

      toast.success(`Past event ${isEdit ? "updated" : "created"} successfully!`, { duration: 3000 });
      setSuccess(`Past event ${isEdit ? "updated" : "created"} successfully!`);
      
      // Clean up blob URLs
      if (thumbnailPreview && thumbnailPreview.startsWith('blob:')) {
        URL.revokeObjectURL(thumbnailPreview);
      }
      photoPreviews.forEach(preview => {
        if (preview && preview.startsWith('blob:')) {
          URL.revokeObjectURL(preview);
        }
      });
      videoPreviews.forEach(preview => {
        if (preview && preview.startsWith('blob:')) {
          URL.revokeObjectURL(preview);
        }
      });
      
      setFormData({ name: "", title: "", location: "", day: "", time: "", date: "", endDate: "", description: "", thumbnailImage: "", photos: [], videos: [] });
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
      setOriginalThumbnailUrl("");
      setOriginalPhotos([]);
      setOriginalVideos([]);
      setSelectedThumbnailFile(null);
      setSelectedPhotoFiles([null, null, null, null, null, null]);
      setSelectedVideoFiles([null, null]);
      
      // Refresh past events list
      await fetchPastEvents();
      
      setTimeout(() => {
        setShowAddForm(false);
        setSuccess(null);
      }, 1500);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      toast.error(errorMessage, { duration: 4000 });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Clean up blob URLs
    if (thumbnailPreview && thumbnailPreview.startsWith('blob:')) {
      URL.revokeObjectURL(thumbnailPreview);
    }
    photoPreviews.forEach(preview => {
      if (preview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
    });
    videoPreviews.forEach(preview => {
      if (preview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
    });
    
    // If editing, restore original media
    if (editingId) {
      if (originalThumbnailUrl) {
        setFormData({ 
          ...formData,
          thumbnailImage: originalThumbnailUrl,
          photos: originalPhotos,
          videos: originalVideos,
        });
        setThumbnailPreview(getImageUrl(originalThumbnailUrl));
        setPhotoPreviews(originalPhotos.map(p => getImageUrl(p)));
        setVideoPreviews(originalVideos);
      }
    }
    
    setShowAddForm(false);
    setFormData({ name: "", title: "", location: "", day: "", time: "", date: "", endDate: "", description: "", thumbnailImage: "", photos: [], videos: [] });
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
    setOriginalThumbnailUrl("");
    setOriginalPhotos([]);
    setOriginalVideos([]);
    setSelectedThumbnailFile(null);
    setSelectedPhotoFiles([null, null, null, null, null, null]);
    setSelectedVideoFiles([null, null]);
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
                            {pastEvent.endDate ? ` - ${pastEvent.endDate}` : ""}
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
                <label htmlFor="past-event-end-date" className="text-sm font-medium text-white">
                  End Date <span className="text-zinc-400 text-xs">(optional)</span>
                </label>
                <input
                  id="past-event-end-date"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="past-event-day" className="text-sm font-medium text-white">
                  Day <span className="text-zinc-400 text-xs">(auto-populated)</span>
                </label>
                <input
                  id="past-event-day"
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
              
              {/* Selected file preview (not uploaded to S3 yet) */}
              {selectedThumbnailFile && !formData.thumbnailImage && thumbnailPreview && (
                <div className="mt-2">
                  <div className="bg-zinc-800 border border-zinc-600 rounded-md p-3 mb-2">
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <p className="text-sm text-white font-medium">📁 {selectedThumbnailFile.name}</p>
                        <p className="text-xs text-zinc-400 mt-1">
                          Size: {(selectedThumbnailFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                        <p className="text-xs text-yellow-500 mt-2">⚠️ Image will be uploaded when you save the form</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (thumbnailPreview && thumbnailPreview.startsWith('blob:')) {
                            URL.revokeObjectURL(thumbnailPreview);
                          }
                          setSelectedThumbnailFile(null);
                          setThumbnailPreview("");
                          setFormData({ ...formData, thumbnailImage: "" });
                          if (editingId && originalThumbnailUrl) {
                            setThumbnailPreview(getImageUrl(originalThumbnailUrl));
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
                      src={thumbnailPreview}
                      alt="Preview"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              )}

              {/* Uploaded thumbnail */}
              {thumbnailPreview && formData.thumbnailImage && !selectedThumbnailFile && (
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
                    
                    {/* Selected file preview (not uploaded to S3 yet) */}
                    {selectedPhotoFiles[index] && !formData.photos[index] && photoPreviews[index] && (
                      <div className="space-y-2">
                        <div className="bg-zinc-800 border border-zinc-600 rounded-md p-2">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-white font-medium truncate">📁 {selectedPhotoFiles[index]!.name}</p>
                              <p className="text-xs text-zinc-400">
                                {(selectedPhotoFiles[index]!.size / (1024 * 1024)).toFixed(2)} MB
                              </p>
                              <p className="text-xs text-yellow-500 mt-1">⚠️ Will be uploaded when you save</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                if (photoPreviews[index] && photoPreviews[index].startsWith('blob:')) {
                                  URL.revokeObjectURL(photoPreviews[index]);
                                }
                                handlePhotoSelect(null, index);
                              }}
                              className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded transition-colors"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                        {/* Image Preview */}
                        <div className="relative w-full h-32 rounded-md border border-zinc-600 overflow-hidden bg-zinc-900">
                          <img
                            src={photoPreviews[index]}
                            alt={`Photo ${index + 1} Preview`}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      </div>
                    )}

                    {/* Uploaded photo */}
                    {photoPreviews[index] && formData.photos[index] && !selectedPhotoFiles[index] && (
                      <div className="relative w-full h-32 rounded-md border border-zinc-600 overflow-hidden bg-zinc-900">
                        <img
                          src={photoPreviews[index]}
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
                    
                    {/* Selected file preview (not uploaded to S3 yet) */}
                    {selectedVideoFiles[index] && !formData.videos[index] && videoPreviews[index] && (
                      <div className="space-y-2">
                        <div className="bg-zinc-800 border border-zinc-600 rounded-md p-2">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-white font-medium truncate">🎥 {selectedVideoFiles[index]!.name}</p>
                              <p className="text-xs text-zinc-400">
                                {(selectedVideoFiles[index]!.size / (1024 * 1024)).toFixed(2)} MB
                              </p>
                              <p className="text-xs text-yellow-500 mt-1">⚠️ Will be uploaded when you save</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleUnselectVideo(index)}
                              className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded transition-colors"
                              title="Remove selection"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                        {/* Video Preview */}
                        <div className="relative w-full h-32 rounded-md border border-zinc-600 overflow-hidden bg-zinc-900">
                          <video
                            src={videoPreviews[index]}
                            className="w-full h-full object-contain"
                            controls
                          />
                        </div>
                      </div>
                    )}

                    {/* Uploaded video */}
                    {videoPreviews[index] && formData.videos[index] && !selectedVideoFiles[index] && (
                      <div className="relative w-full h-32 rounded-md border border-zinc-600 overflow-hidden bg-zinc-900">
                        <video
                          src={videoPreviews[index]}
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








