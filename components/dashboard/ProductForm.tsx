  "use client";

  import NextImage from "next/image";
  import { useState, useEffect } from "react";
  import toast from "react-hot-toast";

  type Category = {
    _id: string;
    name: string;
  };

  type Subcategory = {
    _id: string;
    name: string;
    category: string | Category;
  };

  type ProductFormProps = {
    productId?: string;
    initialData?: {
      name?: string;
      shortDescription?: string;
      description?: string;
      category?: string | { _id: string; name: string; slug: string };
      subcategory?: string | { _id: string; name: string; slug: string; category: string | Category };
      price?: string;
      discount?: number;
      imageUrl?: string[];
      videoUrl?: string | string[];
      isSet?: boolean;
      numberOfSets?: number;
      newAddition?: boolean;
      featured?: boolean;
      bestSelling?: boolean;
      tuning?: string;
      octave?: '3rd octave' | '4th octave';
      size?: string;
      weight?: 'less than 1kg' | 'less than 6kg' | 'between 1-3kg' | '3-5kg' | 'greater than 6kg';
    };
    onComplete?: () => void;
    onCancel?: () => void;
    isUniversalProduct?: boolean; // New prop to indicate universal product
  };

  export default function ProductForm({ productId, initialData, onComplete, onCancel, isUniversalProduct = false }: ProductFormProps) {
    const isEdit = !!productId;
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
    const [loadingSubcategories, setLoadingSubcategories] = useState(false);
    
    const [formData, setFormData] = useState({
      name: initialData?.name || "",
      shortDescription: initialData?.shortDescription || "",
      description: initialData?.description || "",
      category: typeof initialData?.category === 'object' && initialData?.category?._id 
        ? String(initialData.category._id) 
        : (initialData?.category ? String(initialData.category) : ""),
      subcategory: typeof initialData?.subcategory === 'object' && initialData?.subcategory?._id 
        ? String(initialData.subcategory._id) 
        : (initialData?.subcategory ? String(initialData.subcategory) : ""),
      price: initialData?.price || "",
      discount: initialData?.discount ? String(initialData.discount) : "",
      images: initialData?.imageUrl || [] as string[],
      videos: Array.isArray(initialData?.videoUrl) 
        ? initialData.videoUrl 
        : initialData?.videoUrl 
          ? [initialData.videoUrl] 
          : [] as string[],
      isSet: initialData?.isSet || false,
      numberOfSets: initialData?.numberOfSets ? String(initialData.numberOfSets) : "",
      newAddition: initialData?.newAddition || false,
      featured: initialData?.featured || false,
      bestSelling: initialData?.bestSelling || false,
      tuning: initialData?.tuning ? String(initialData.tuning) : "",
      octave: initialData?.octave || "",
      size: initialData?.size || "",
      weight: initialData?.weight || "",
    });

    // Fetch categories on component mount
    useEffect(() => {
      const fetchCategories = async () => {
        try {
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
      
      fetchCategories();
    }, []);

    // Fetch subcategories when category changes
    useEffect(() => {
      const fetchSubcategories = async () => {
        if (!formData.category) {
          setSubcategories([]);
          setFormData(prev => ({ ...prev, subcategory: "" })); // Reset subcategory when category is cleared
          return;
        }

        try {
          setLoadingSubcategories(true);
          const response = await fetch(`/api/admin/subcategories?categoryId=${formData.category}`);
          const data = await response.json();
          if (data.success) {
            setSubcategories(data.data);
          } else {
            setSubcategories([]);
          }
        } catch (error) {
          console.error("Failed to fetch subcategories:", error);
          setSubcategories([]);
        } finally {
          setLoadingSubcategories(false);
        }
      };
      
      fetchSubcategories();
    }, [formData.category]);

    // Helper to convert base64 string to data URL if needed (blob URLs pass through for local preview)
    const normalizeImageUrl = (url: string): string => {
      if (!url) return "";
      if (url.startsWith("blob:")) return url;
      if (url.startsWith("data:image")) return url;
      if (url.startsWith("http://") || url.startsWith("https://")) return url;
      return `data:image/jpeg;base64,${url}`;
    };

    const [uploadedImages, setUploadedImages] = useState<string[]>(() => {
      const existing = initialData?.imageUrl || [];
      return existing.map(normalizeImageUrl);
    });

    // Track number of image fields to show (max 7)
    const MAX_IMAGES = 7;
    const [imageFieldCount, setImageFieldCount] = useState(() => {
      const existing = initialData?.imageUrl || [];
      return Math.max(1, Math.min(MAX_IMAGES, existing.length)); // At least 1 field, max 7
    });

    // Helper to normalize video URL
    const normalizeVideoUrl = (url: string): string => {
      if (!url) return "";
      if (url.startsWith("data:video")) return url;
      if (url.startsWith("http://") || url.startsWith("https://")) return url;
      return `data:video/mp4;base64,${url}`;
    };

    // Track number of video fields to show (max 2)
    const MAX_VIDEOS = 2;
    const [videoFieldCount, setVideoFieldCount] = useState(() => {
      const existing = Array.isArray(initialData?.videoUrl) 
        ? initialData.videoUrl 
        : initialData?.videoUrl 
          ? [initialData.videoUrl] 
          : [];
      return Math.max(0, Math.min(MAX_VIDEOS, existing.length)); // Max 2 videos
    });

    const [uploadedVideos, setUploadedVideos] = useState<string[]>(() => {
      const existing = Array.isArray(initialData?.videoUrl) 
        ? initialData.videoUrl 
        : initialData?.videoUrl 
          ? [initialData.videoUrl] 
          : [];
      return existing.map(normalizeVideoUrl);
    });

    // Track pending image files (not yet uploaded to S3)
    const [pendingImageFiles, setPendingImageFiles] = useState<(File | null)[]>([]);
    
    // Track pending video files (not yet uploaded to S3)
    const [pendingVideoFiles, setPendingVideoFiles] = useState<(File | null)[]>([]);
    
    // Track original media URLs when editing (for restore on cancel)
    const [originalImages, setOriginalImages] = useState<string[]>(() => {
      if (initialData?.imageUrl) {
        return initialData.imageUrl;
      }
      return [];
    });

    // Track which original image indices user has removed (UI only; persisted when Save is clicked)
    const [removedOriginalImageIndices, setRemovedOriginalImageIndices] = useState<Set<number>>(new Set());
    const [originalVideos, setOriginalVideos] = useState<string[]>(() => {
      if (initialData?.videoUrl) {
        return Array.isArray(initialData.videoUrl) 
          ? initialData.videoUrl 
          : [initialData.videoUrl];
      }
      return [];
    });

    // Handle image selection - use local preview (no upload yet); changes apply to UI only until Save
    const handleImageSelect = (index: number, file: File | null) => {
      if (!file) {
        const newPendingFiles = [...pendingImageFiles];
        newPendingFiles[index] = null;
        setPendingImageFiles(newPendingFiles);
        // Remove from UI only; if this was an original image, mark as removed (persisted on Save)
        if (isEdit && originalImages[index]) {
          setRemovedOriginalImageIndices((prev) => new Set(prev).add(index));
        }
        const newImages = [...uploadedImages];
        const newFormImages = [...formData.images];
        newImages[index] = "";
        newFormImages[index] = "";
        setUploadedImages(newImages);
        setFormData({ ...formData, images: newFormImages });
        if (index === imageFieldCount - 1 && imageFieldCount > 1) {
          setImageFieldCount(imageFieldCount - 1);
        }
        return;
      }
      // User chose a new file: clear "removed" mark for this index so we use the new file on Save
      setRemovedOriginalImageIndices((prev) => {
        const next = new Set(prev);
        next.delete(index);
        return next;
      });

      // Store the file (don't upload yet)
      const newPendingFiles = [...pendingImageFiles];
      while (newPendingFiles.length <= index) {
        newPendingFiles.push(null);
      }
      newPendingFiles[index] = file;
      setPendingImageFiles(newPendingFiles);
      
      // Clear existing image URL at this index (will be replaced after upload)
        const newImages = [...uploadedImages];
        const newFormImages = [...formData.images];
        
        while (newImages.length <= index) {
          newImages.push("");
          newFormImages.push("");
        }
        
      // Use local file preview (not uploaded to S3 yet)
      newImages[index] = URL.createObjectURL(file);
      newFormImages[index] = ""; // Will be set to S3 URL after upload
        
        setUploadedImages(newImages);
        setFormData({ ...formData, images: newFormImages });
    };

    const handleImageRemove = (index: number) => {
      if (uploadedImages[index] && uploadedImages[index].startsWith("blob:")) {
        URL.revokeObjectURL(uploadedImages[index]);
      }
      // Remove from UI only; persist removal when user clicks Save
      if (isEdit && originalImages[index]) {
        setRemovedOriginalImageIndices((prev) => new Set(prev).add(index));
      }
      const newImages = [...uploadedImages];
      const newFormImages = [...formData.images];
      newImages[index] = "";
      newFormImages[index] = "";
      setUploadedImages(newImages);
      setFormData({ ...formData, images: newFormImages });
      const newPendingFiles = [...pendingImageFiles];
      newPendingFiles[index] = null;
      setPendingImageFiles(newPendingFiles);
      if (index === imageFieldCount - 1 && imageFieldCount > 1) {
        setImageFieldCount(imageFieldCount - 1);
      }
    };

    const handleAddImageField = () => {
      if (imageFieldCount < MAX_IMAGES) {
        setImageFieldCount(imageFieldCount + 1);
      } else {
        toast.error(`Maximum ${MAX_IMAGES} images allowed`);
      }
    };

    const handleVideoSelect = (index: number, file: File | null) => {
      if (!file) {
        // Remove file selection
        const newPendingFiles = [...pendingVideoFiles];
        newPendingFiles[index] = null;
        setPendingVideoFiles(newPendingFiles);
        
        // Reset the file input element
        const fileInput = document.getElementById(`product-video-file-${index}`) as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
        }
        return;
      }

      // Check file size (limit to 100MB)
      const MAX_SIZE = 100 * 1024 * 1024; // 100MB
      if (file.size > MAX_SIZE) {
        toast.error("Video file is too large. Maximum size is 100MB.");
        return;
      }

      // Store the file (don't upload yet)
      const newPendingFiles = [...pendingVideoFiles];
      while (newPendingFiles.length <= index) {
        newPendingFiles.push(null);
      }
      newPendingFiles[index] = file;
      setPendingVideoFiles(newPendingFiles);
      
      // Clear existing video URL at this index (will be replaced after upload)
        const newVideos = [...uploadedVideos];
        const newFormVideos = [...formData.videos];
        
        while (newVideos.length <= index) {
          newVideos.push("");
          newFormVideos.push("");
        }
        
      // Use local file preview (not uploaded to S3 yet)
      newVideos[index] = URL.createObjectURL(file);
      newFormVideos[index] = ""; // Will be set to S3 URL after upload
        
        setUploadedVideos(newVideos);
        setFormData({ ...formData, videos: newFormVideos });
    };

    // Video upload removed - will happen during form submission only

    const handleVideoRemove = (index: number) => {
      // Clean up object URL if it was created from local file
      if (uploadedVideos[index] && uploadedVideos[index].startsWith('blob:')) {
        URL.revokeObjectURL(uploadedVideos[index]);
      }
      
      const newVideos = [...uploadedVideos];
      const newFormVideos = [...formData.videos];
      
      // If editing and we have original video, restore it
      if (isEdit && originalVideos[index]) {
        newVideos[index] = normalizeVideoUrl(originalVideos[index]);
        newFormVideos[index] = originalVideos[index];
      } else {
      newVideos.splice(index, 1);
      newFormVideos.splice(index, 1);
      }
      
      setUploadedVideos(newVideos);
      setFormData({ ...formData, videos: newFormVideos });
      
      // Clear pending file too
      const newPendingFiles = [...pendingVideoFiles];
      newPendingFiles[index] = null;
      setPendingVideoFiles(newPendingFiles);
      
      // If removing the last video and there are multiple fields, reduce field count
      if (index === videoFieldCount - 1 && videoFieldCount > 0 && !originalVideos[index]) {
        setVideoFieldCount(videoFieldCount - 1);
      }
    };

    const handleAddVideoField = () => {
      if (videoFieldCount < MAX_VIDEOS) {
        setVideoFieldCount(videoFieldCount + 1);
      } else {
        toast.error(`Maximum ${MAX_VIDEOS} videos allowed`);
      }
    };

    const handleVideoUrlChange = (index: number, url: string) => {
      const newVideos = [...uploadedVideos];
      const newFormVideos = [...formData.videos];
      
      while (newVideos.length <= index) {
        newVideos.push("");
        newFormVideos.push("");
      }
      
      newVideos[index] = url;
      newFormVideos[index] = url;
      
      setUploadedVideos(newVideos);
      setFormData({ ...formData, videos: newFormVideos });
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Validation
      if (!formData.name.trim()) {
        setError("Product name is required");
        setLoading(false);
        return;
      }

      if (isUniversalProduct && !formData.shortDescription.trim()) {
        setError("Short description is required for universal products");
        setLoading(false);
        return;
      }

      if (!isUniversalProduct && formData.isSet && (!formData.numberOfSets || parseInt(formData.numberOfSets) <= 0)) {
        setError("Number of sets is required when 'Is Set' is checked");
        setLoading(false);
        return;
      }

      if (!formData.description.trim()) {
        setError("Description is required");
        setLoading(false);
        return;
      }

      if (!formData.price || Number.parseFloat(formData.price) <= 0) {
        setError("Valid price is required");
        setLoading(false);
        return;
      }

      // At least one image: either a pending file, an existing form URL, or an original not removed
      const hasImages =
        pendingImageFiles.some((f) => f !== null) ||
        formData.images.some((img) => img && img.trim() !== "") ||
        (isEdit && Array.from({ length: Math.max(originalImages.length, 1) }).some((_, i) => originalImages[i] && !removedOriginalImageIndices.has(i)));
      if (!hasImages) {
        setError("At least one image is required");
        setLoading(false);
        return;
      }

      const totalImages = Math.max(formData.images.filter(img => img).length, pendingImageFiles.filter(f => f !== null).length);
      if (totalImages > MAX_IMAGES) {
        setError(`Maximum ${MAX_IMAGES} images allowed`);
        setLoading(false);
        return;
      }

      const totalVideos = Math.max(formData.videos.filter(v => v).length, pendingVideoFiles.filter(f => f !== null).length);
      if (totalVideos > MAX_VIDEOS) {
        setError(`Maximum ${MAX_VIDEOS} videos allowed`);
        setLoading(false);
        return;
      }

      try {
        // Upload all pending images to S3 during form submission
        const finalImages: string[] = [...formData.images];
        
        for (let i = 0; i < pendingImageFiles.length; i++) {
          const file = pendingImageFiles[i];
          if (file) {
            const uploadToastId = toast.loading(
              <div className="flex flex-col gap-2">
                <span className="text-white font-medium">Uploading image {i + 1} to S3...</span>
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
              
              const uploadResponse = await fetch('/api/upload/s3', {
                method: 'POST',
                body: uploadFormData,
              });
              
              const uploadData = await uploadResponse.json();
              
              if (!uploadResponse.ok || !uploadData.success || !uploadData.url) {
                throw new Error(`Failed to upload image ${i + 1} to S3`);
              }
              
              // Insert or replace at index i
              if (finalImages.length <= i) {
                finalImages.push(uploadData.url);
              } else {
                finalImages[i] = uploadData.url;
              }
              
              toast.dismiss(uploadToastId);
              toast.success(`Image ${i + 1} uploaded successfully!`, { duration: 2000 });
            } catch (uploadErr) {
              toast.dismiss(uploadToastId);
              throw new Error(`Failed to upload image ${i + 1}. Please try again.`);
            }
          } else if (isEdit && originalImages[i] && !formData.images[i] && !removedOriginalImageIndices.has(i)) {
            // Use original image if editing, no new image, and user did not remove it
            if (finalImages.length <= i) {
              finalImages.push(originalImages[i]);
            } else {
              finalImages[i] = originalImages[i];
            }
          }
        }
        
        // Upload all pending videos to S3 during form submission
        const finalVideos: string[] = [...formData.videos];
        
        for (let i = 0; i < pendingVideoFiles.length; i++) {
          const file = pendingVideoFiles[i];
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
              const uploadFormData = new FormData();
              uploadFormData.append('file', file);
              uploadFormData.append('folder', 'videos');
              
              const uploadResponse = await fetch('/api/upload/s3', {
                method: 'POST',
                body: uploadFormData,
              });
              
              const uploadData = await uploadResponse.json();
              
              if (!uploadResponse.ok || !uploadData.success || !uploadData.url) {
                throw new Error(`Failed to upload video ${i + 1} to S3`);
              }
              
              // Insert or replace at index i
              if (finalVideos.length <= i) {
                finalVideos.push(uploadData.url);
              } else {
                finalVideos[i] = uploadData.url;
              }
              
              toast.dismiss(uploadToastId);
              toast.success(`Video ${i + 1} uploaded successfully!`, { duration: 2000 });
            } catch (uploadErr) {
              toast.dismiss(uploadToastId);
              throw new Error(`Failed to upload video ${i + 1}. Please try again.`);
            }
          } else if (isEdit && originalVideos[i] && !formData.videos[i]) {
            // Use original video if editing and no new video at this index
            if (finalVideos.length <= i) {
              finalVideos.push(originalVideos[i]);
            } else {
              finalVideos[i] = originalVideos[i];
            }
          }
        }

        const url = isEdit 
          ? `/api/admin/products/${productId}`
          : `/api/admin/products`;
        
        const method = isEdit ? "PATCH" : "POST";

        const priceValue = formData.price.trim();

        // Show saving toast
        const saveToastId = toast.loading(
          <div className="flex flex-col gap-2">
            <span className="text-white font-medium">{isEdit ? "Updating product..." : "Creating product..."}</span>
            <div className="w-full bg-zinc-700 rounded-full h-2">
              <div className="bg-emerald-600 h-2 rounded-full animate-pulse" style={{ width: '70%' }}></div>
            </div>
          </div>,
          { duration: Infinity }
        );

        const response = await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: formData.name.trim(),
            shortDescription: formData.shortDescription.trim() || undefined,
            description: formData.description.trim(),
            category: isUniversalProduct ? undefined : (formData.category || undefined),
            subcategory: isUniversalProduct ? undefined : (formData.subcategory || undefined),
            price: priceValue,
            discount: formData.discount.trim() === "" ? null : parseFloat(formData.discount),
            imageUrl: finalImages.filter(img => img && img.trim() !== ""),
            videoUrl: finalVideos.filter(v => v && v.trim() !== ""), // Filter out empty strings and always send array (even if empty)
            isSet: isUniversalProduct ? undefined : (formData.isSet || undefined),
            numberOfSets: isUniversalProduct ? undefined : (formData.isSet && formData.numberOfSets ? parseInt(formData.numberOfSets) : undefined),
            newAddition: isUniversalProduct ? undefined : (formData.newAddition || undefined),
            featured: isUniversalProduct ? undefined : (formData.featured || undefined),
            bestSelling: isUniversalProduct ? undefined : formData.bestSelling,
            tuning: isUniversalProduct ? undefined : (formData.tuning ? parseFloat(formData.tuning) : undefined),
            octave: isUniversalProduct ? undefined : (formData.octave || undefined),
            size: isUniversalProduct ? undefined : (formData.size.trim() || undefined),
            weight: isUniversalProduct ? undefined : (formData.weight || undefined),
            relativeproduct: isUniversalProduct ? true : undefined,
          }),
        });

        const data = await response.json();

        toast.dismiss(saveToastId);

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Failed to save product");
        }

        // After successful update, delete old media from S3 if it was replaced
        if (isEdit) {
          // Delete old images that were removed
          originalImages.forEach((oldImg, index) => {
            if (oldImg && !finalImages.includes(oldImg) && oldImg.startsWith('https://')) {
              fetch("/api/upload/s3/delete", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: oldImg }),
              }).catch(err => console.error("Error deleting old image from S3:", err));
            }
          });
          
          // Delete old videos that were removed
          originalVideos.forEach((oldVideo, index) => {
            if (oldVideo && !finalVideos.includes(oldVideo) && oldVideo.startsWith('https://')) {
              fetch("/api/upload/s3/delete", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: oldVideo }),
              }).catch(err => console.error("Error deleting old video from S3:", err));
            }
          });
        }

        // Clean up blob URLs
        uploadedImages.forEach(img => {
          if (img && img.startsWith('blob:')) {
            URL.revokeObjectURL(img);
          }
        });
        uploadedVideos.forEach(video => {
          if (video && video.startsWith('blob:')) {
            URL.revokeObjectURL(video);
          }
        });

        toast.success(isEdit ? "Product updated successfully!" : "Product created successfully!", { duration: 3000 });
        setSuccess(isEdit ? "Product updated successfully!" : "Product created successfully!");
        
        setTimeout(() => {
          if (onComplete) {
            onComplete();
          }
        }, 1500);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "An error occurred";
        setError(errorMessage);
        toast.error(errorMessage, { duration: 4000 });
        setLoading(false);
      }
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-zinc-700 bg-zinc-800 p-6 shadow-sm">
        {isUniversalProduct && (
          <div className="mb-4 p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-300">Universal Product</h3>
            <p className="text-sm text-blue-200 mt-1">This product will have limited fields compared to regular products.</p>
          </div>
        )}

        <div className="space-y-1">
          <label htmlFor="product-name" className="text-sm font-medium text-white">
            Product name <span className="text-red-500">*</span>
          </label>
          <input
            id="product-name"
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
            placeholder="Crystal Healing Bowl"
          />
        </div>

        {!isUniversalProduct && (
          <>

            <div className="space-y-1">
              <label htmlFor="product-category" className="text-sm font-medium text-white">
                Category
              </label>
          {loadingCategories ? (
            <div className="text-xs text-zinc-400 py-2">Loading categories...</div>
          ) : (
            <select
              id="product-category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value, subcategory: "" })}
              className="w-full rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
          )}
          {!loadingCategories && categories.length === 0 && (
            <p className="text-xs text-zinc-400 mt-1">
              No categories available. Create categories in the Categories section.
            </p>
          )}
            </div>

            <div className="space-y-1">
              <label htmlFor="product-subcategory" className="text-sm font-medium text-white">
                Subcategory
              </label>
          {!formData.category ? (
            <div className="text-xs text-zinc-400 py-2">Please select a category first</div>
          ) : loadingSubcategories ? (
            <div className="text-xs text-zinc-400 py-2">Loading subcategories...</div>
          ) : (
            <select
              id="product-subcategory"
              value={formData.subcategory}
              onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
              className="w-full rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
            >
              <option value="">Select a subcategory (optional)</option>
              {subcategories.map((subcat) => (
                <option key={subcat._id} value={subcat._id}>
                  {subcat.name}
                </option>
              ))}
            </select>
          )}
          {formData.category && !loadingSubcategories && subcategories.length === 0 && (
            <p className="text-xs text-zinc-400 mt-1">
              No subcategories available for this category. Create subcategories in the Subcategories section.
            </p>
            )}
            </div>
          </>
        )}

        <div className="space-y-1">
          <label htmlFor="product-short-description" className="text-sm font-medium text-white">
            Short Description {isUniversalProduct && <span className="text-red-500">*</span>}
          </label>
          <textarea
            id="product-short-description"
            rows={2}
            required={isUniversalProduct}
            value={formData.shortDescription}
            onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
            className="w-full rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
            placeholder={isUniversalProduct ? "Brief summary for product cards..." : "Brief summary for product cards..."}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="product-description" className="text-sm font-medium text-white">
            Full Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="product-description"
            rows={4}
            required
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
            placeholder="Detailed product description..."
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="product-price" className="text-sm font-medium text-white">
            Price ($) <span className="text-red-500">*</span>
          </label>
          <input
            id="product-price"
            type="number"
            step="0.01"
            min="0"
            required
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            className="w-full rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
            placeholder="29.99"
          />
          <p className="text-xs text-zinc-400">
            Enter price in dollars (e.g., 29.99 for $29.99)
          </p>
        </div>

        <div className="space-y-1">
          <label htmlFor="product-discount" className="text-sm font-medium text-white">
            Discount ($) <span className="text-zinc-400">(Optional)</span>
          </label>
          <input
            id="product-discount"
            type="number"
            step="0.01"
            min="0"
            value={formData.discount}
            onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
            className="w-full rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
            placeholder="0.00"
          />
          <p className="text-xs text-zinc-400">
            Optional discount amount. Final price will be: Price - Discount
          </p>
        </div>

        {!isUniversalProduct && (
          <>
            <div className="space-y-1">
              <label htmlFor="product-is-set" className="flex items-center gap-2 text-sm font-medium text-white">
                <input
                  id="product-is-set"
                  type="checkbox"
                  checked={formData.isSet}
                  onChange={(e) => setFormData({ ...formData, isSet: e.target.checked, numberOfSets: e.target.checked ? formData.numberOfSets : "" })}
                  className="w-4 h-4 text-white bg-zinc-900 border-zinc-600 rounded focus:ring-white focus:ring-2"
                />
                Is Set
              </label>
              <p className="text-xs text-zinc-400">
                Check if this product is a set
              </p>
            </div>

            {formData.isSet && (
              <div className="space-y-1">
                <label htmlFor="product-number-of-sets" className="text-sm font-medium text-white">
                  Number of Sets <span className="text-red-500">*</span>
                </label>
                <input
                  id="product-number-of-sets"
                  type="number"
                  min="1"
                  required={formData.isSet}
                  value={formData.numberOfSets}
                  onChange={(e) => setFormData({ ...formData, numberOfSets: e.target.value })}
                  className="w-full rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
                  placeholder="e.g., 2, 3, 5"
                />
                <p className="text-xs text-zinc-400">
                  Enter the number of sets in this product
                </p>
              </div>
            )}

            <div className="space-y-1">
              <label htmlFor="product-new-addition" className="flex items-center gap-2 text-sm font-medium text-white">
                <input
                  id="product-new-addition"
                  type="checkbox"
                  checked={formData.newAddition}
                  onChange={(e) => setFormData({ ...formData, newAddition: e.target.checked })}
                  className="w-4 h-4 text-white bg-zinc-900 border-zinc-600 rounded focus:ring-white focus:ring-2"
                />
                New Addition
              </label>
              <p className="text-xs text-zinc-400">
                Mark this product as a new addition
              </p>
            </div>

            <div className="space-y-1">
              <label htmlFor="product-featured" className="flex items-center gap-2 text-sm font-medium text-white">
                <input
                  id="product-featured"
                  type="checkbox"
                  checked={formData.featured}
                  onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                  className="w-4 h-4 text-white bg-zinc-900 border-zinc-600 rounded focus:ring-white focus:ring-2"
                />
                Featured
              </label>
              <p className="text-xs text-zinc-400">
                Mark this product as featured
              </p>
            </div>

            <div className="space-y-1">
              <label htmlFor="product-best-selling" className="flex items-center gap-2 text-sm font-medium text-white">
                <input
                  id="product-best-selling"
                  type="checkbox"
                  checked={formData.bestSelling}
                  disabled={isUniversalProduct}
                  onChange={(e) => setFormData({ ...formData, bestSelling: e.target.checked })}
                  className="w-4 h-4 text-white bg-zinc-900 border-zinc-600 rounded focus:ring-white focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                Best Selling
              </label>
              <p className="text-xs text-zinc-400">
                {isUniversalProduct 
                  ? "Universal products cannot be marked as best selling" 
                  : "Mark this product as best selling (max 4 products)"}
              </p>
            </div>

            <div className="space-y-1">
              <label htmlFor="product-tuning" className="text-sm font-medium text-white">
                Tuning (Hz)
              </label>
              <input
                id="product-tuning"
                type="number"
                step="0.1"
                min="0"
                value={formData.tuning}
                onChange={(e) => setFormData({ ...formData, tuning: e.target.value })}
                className="w-full rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
                placeholder="e.g., 20, 30"
              />
              <p className="text-xs text-zinc-400">
                Enter tuning frequency in Hz (optional)
              </p>
            </div>

            <div className="space-y-1">
              <label htmlFor="product-octave" className="text-sm font-medium text-white">
                Octave
              </label>
              <select
                id="product-octave"
                value={formData.octave}
                onChange={(e) => setFormData({ ...formData, octave: e.target.value as '3rd octave' | '4th octave' })}
                className="w-full rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
              >
                <option value="">Select octave (optional)</option>
                <option value="3rd octave">3rd octave</option>
                <option value="4th octave">4th octave</option>
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="product-size" className="text-sm font-medium text-white">
                Size
              </label>
              <input
                id="product-size"
                type="text"
                value={formData.size}
                onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                className="w-full rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
                placeholder="e.g., 5-6, 6-7, 7-8, or 8"
              />
              <p className="text-xs text-zinc-400">
                Enter size: range like "5-6" or "7-8" (between) or single value like "8" (exact inches) - optional
              </p>
            </div>

            <div className="space-y-1">
              <label htmlFor="product-weight" className="text-sm font-medium text-white">
                Weight
              </label>
              <select
                id="product-weight"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value as 'less than 1kg' | 'less than 6kg' | 'between 1-3kg' | '3-5kg' | 'greater than 6kg' })}
                className="w-full rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
              >
                <option value="">Select weight category (optional)</option>
                <option value="less than 1kg">Less than 1kg</option>
                <option value="less than 6kg">Less than 6kg</option>
                <option value="between 1-3kg">Between 1-3kg</option>
                <option value="3-5kg">3-5kg</option>
                <option value="greater than 6kg">Greater than 6kg</option>
              </select>
            </div>
          </>
        )}

        <div className="space-y-1">
          <label className="text-sm font-medium text-white">
            Product Images <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-zinc-400 mb-2">
            At least one image is required. Maximum {MAX_IMAGES} images allowed.
          </p>
          <div className="space-y-4">
            {Array.from({ length: imageFieldCount }).map((_, index) => (
              <div key={index} className="space-y-2">
                <label
                  htmlFor={`product-image-file-${index}`}
                  className="block text-xs text-zinc-400"
                >
                  {index === 0 ? "Main Image" : `Image ${index + 1}`}
                </label>
                <input
                  id={`product-image-file-${index}`}
                  type="file"
                  accept="image/*"
                  className="w-full rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    handleImageSelect(index, file);
                  }}
                />
                {uploadedImages[index] && (
                  <div className="relative  w-full h-32 max-w-[200px] rounded-md border border-zinc-600 overflow-hidden  bg-zinc-900">
                    {uploadedImages[index].startsWith("blob:") ? (
                      <img
                        src={uploadedImages[index]}
                        alt={index === 0 ? "Main Preview" : `Preview ${index + 1}`}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <NextImage
                        src={normalizeImageUrl(uploadedImages[index])}
                        alt={index === 0 ? "Main Preview" : `Preview ${index + 1}`}
                        width={200}
                        height={128}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => handleImageRemove(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 z-10"
                      title="Remove image"
                    >
                      ×
                    </button>
                    {pendingImageFiles[index] && (
                      <div className="absolute bottom-1 left-1 bg-yellow-600 text-white text-xs px-2 py-1 rounded">
                        ⚠️ Will upload on save
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            {imageFieldCount < MAX_IMAGES && (
              <button
                type="button"
                onClick={handleAddImageField}
                className="inline-flex items-center justify-center rounded-md border border-zinc-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
              >
                + Add Image ({imageFieldCount}/{MAX_IMAGES})
              </button>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-white">
            Product Videos (Optional)
          </label>
          <p className="text-xs text-zinc-400 mb-2">
            Upload video files (max 50MB each) or enter video URLs (YouTube, Vimeo, etc.). Maximum {MAX_VIDEOS} videos allowed.
          </p>
          <div className="space-y-4">
            {Array.from({ length: videoFieldCount }).map((_, index) => (
              <div key={index} className="space-y-2">
                <label
                  htmlFor={`product-video-file-${index}`}
                  className="block text-xs text-zinc-400"
                >
                  Video {index + 1}
                </label>
                <div className="flex gap-2">
                  <input
                    id={`product-video-file-${index}`}
                    type="file"
                    accept="video/*"
                    className="flex-1 rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      handleVideoSelect(index, file);
                    }}
                  />
                </div>
                <input
                  id={`product-video-url-${index}`}
                  type="text"
                  value={uploadedVideos[index] && !uploadedVideos[index].startsWith("data:") ? uploadedVideos[index] : ""}
                  onChange={(e) => {
                    handleVideoUrlChange(index, e.target.value);
                  }}
                  className="w-full rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
                  placeholder="Or enter video URL (e.g., https://youtube.com/watch?v=...)"
                />
                {/* Show pending file preview */}
                {pendingVideoFiles[index] && !formData.videos[index] && uploadedVideos[index] && (
                  <div className="space-y-2">
                  <div className="p-3 bg-zinc-800 rounded-md border border-zinc-600">
                    <p className="text-sm text-zinc-300">
                      📁 Selected: <span className="text-white">{pendingVideoFiles[index]?.name}</span>
                    </p>
                    <p className="text-xs text-zinc-400 mt-1">
                      Size: {((pendingVideoFiles[index]?.size || 0) / (1024 * 1024)).toFixed(2)} MB
                    </p>
                    <p className="text-xs text-yellow-400 mt-1">
                        ⚠️ Video will be uploaded when you save the form
                      </p>
                    </div>
                    <div className="relative w-full rounded-md border border-zinc-600 overflow-hidden bg-zinc-900">
                      <video
                        src={uploadedVideos[index]}
                        controls
                        className="w-full max-h-64 object-contain"
                      >
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  </div>
                )}
                {/* Show uploaded video (not pending file) */}
                {uploadedVideos[index] && formData.videos[index] && !pendingVideoFiles[index] && (
                  <div className="relative w-full rounded-md border border-zinc-600 overflow-hidden bg-zinc-900">
                    {uploadedVideos[index].startsWith("data:video") || uploadedVideos[index].startsWith("blob:") ? (
                      <video
                        src={normalizeVideoUrl(uploadedVideos[index])}
                        controls
                        className="w-full max-h-64 object-contain"
                      >
                        Your browser does not support the video tag.
                      </video>
                    ) : uploadedVideos[index].startsWith("http://") || uploadedVideos[index].startsWith("https://") ? (
                      <div className="p-4 text-sm text-zinc-400">
                        <p className="mb-2">✅ Video uploaded successfully!</p>
                        <p className="text-xs text-green-400 break-all">URL: {uploadedVideos[index]}</p>
                      </div>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => handleVideoRemove(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 z-10"
                      title="Remove video"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            ))}
            {videoFieldCount < MAX_VIDEOS && (
              <button
                type="button"
                onClick={handleAddVideoField}
                className="inline-flex items-center justify-center rounded-md border border-zinc-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
              >
                + Add Video ({videoFieldCount}/{MAX_VIDEOS})
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-red-900/50 border border-red-500 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-md bg-green-900/50 border border-green-500 px-3 py-2 text-sm text-green-200">
            {success}
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (isEdit ? "Updating..." : "Creating...") : isEdit ? "Update Product" : "Create Product"}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center justify-center rounded-md border border-zinc-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    );
  }

