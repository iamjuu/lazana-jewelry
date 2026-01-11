  "use client";

  import NextImage from "next/image";
  import { useState, useEffect } from "react";

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

    // Helper to convert base64 string to data URL if needed
    const normalizeImageUrl = (url: string): string => {
      if (!url) return "";
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

    // Track pending video files (not yet uploaded)
    const [pendingVideoFiles, setPendingVideoFiles] = useState<(File | null)[]>([]);
    const [uploadingVideoIndex, setUploadingVideoIndex] = useState<number | null>(null);

    // Helper function to compress and convert image to base64
    const compressImageToBase64 = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const MAX_WIDTH = 800;
            const MAX_HEIGHT = 800;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_WIDTH) {
                height = Math.round((height * MAX_WIDTH) / width);
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width = Math.round((width * MAX_HEIGHT) / height);
                height = MAX_HEIGHT;
              }
            }

            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");

            if (!ctx) {
              reject(new Error("Could not get canvas context"));
              return;
            }

            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  reject(new Error("Failed to create blob"));
                  return;
                }

                const reader2 = new FileReader();
                reader2.onloadend = () => {
                  const base64String = reader2.result as string;
                  resolve(base64String);
                };
                reader2.onerror = () => reject(new Error("Failed to read blob"));
                reader2.readAsDataURL(blob);
              },
              "image/webp",
              0.8
            );
          };
          img.onerror = () => reject(new Error("Failed to load image"));
          img.src = e.target?.result as string;
        };
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
      });
    };

    const handleImageUpload = async (index: number, file: File | null) => {
      if (!file) {
        const newImages = [...uploadedImages];
        const newFormImages = [...formData.images];
        newImages.splice(index, 1);
        newFormImages.splice(index, 1);
        setUploadedImages(newImages);
        setFormData({ ...formData, images: newFormImages });
        
        // If removing the last image and there are multiple fields, reduce field count
        if (index === imageFieldCount - 1 && imageFieldCount > 1) {
          setImageFieldCount(imageFieldCount - 1);
        }
        return;
      }

      try {
        const base64String = await compressImageToBase64(file);
        const newImages = [...uploadedImages];
        const newFormImages = [...formData.images];
        
        while (newImages.length <= index) {
          newImages.push("");
          newFormImages.push("");
        }
        
        newImages[index] = base64String;
        newFormImages[index] = base64String;
        
        setUploadedImages(newImages);
        setFormData({ ...formData, images: newFormImages });
      } catch (error) {
        console.error("Error compressing image:", error);
        alert("Failed to process image. Please try again.");
      }
    };

    const handleAddImageField = () => {
      if (imageFieldCount < MAX_IMAGES) {
        setImageFieldCount(imageFieldCount + 1);
      } else {
        alert(`Maximum ${MAX_IMAGES} images allowed`);
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
        alert("Video file is too large. Maximum size is 100MB.");
        return;
      }

      // Store the file (don't upload yet)
      const newPendingFiles = [...pendingVideoFiles];
      while (newPendingFiles.length <= index) {
        newPendingFiles.push(null);
      }
      newPendingFiles[index] = file;
      setPendingVideoFiles(newPendingFiles);
    };

    const handleVideoUpload = async (index: number) => {
      const file = pendingVideoFiles[index];
      
      if (!file) {
        alert("Please select a video file first");
        return;
      }

      try {
        setUploadingVideoIndex(index);
        console.log(`[Video Upload] Starting upload for video ${index + 1}, size: ${file.size} bytes`);
        
        // If there's an existing video at this index, delete it from S3 first
        const existingVideoUrl = uploadedVideos[index];
        if (existingVideoUrl && existingVideoUrl.startsWith('https://')) {
          try {
            console.log(`[Video Upload] Deleting old video: ${existingVideoUrl}`);
            const deleteResponse = await fetch('/api/upload/s3/delete', {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: existingVideoUrl }),
            });
            
            if (deleteResponse.ok) {
              console.log(`✓ Old video deleted from S3`);
            }
          } catch (deleteError) {
            console.error('[Video Upload] Failed to delete old video:', deleteError);
            // Continue with upload even if delete fails
          }
        }
        
        // Upload new video to S3 using FormData
        const uploadFormData = new FormData();
        uploadFormData.append('file', file);
        uploadFormData.append('folder', 'videos');
        
        const response = await fetch('/api/upload/s3', {
          method: 'POST',
          body: uploadFormData,
        });

        if (!response.ok) {
          throw new Error('Failed to upload video to S3');
        }

        const result = await response.json();
        console.log(`[Video Upload] Success! S3 URL: ${result.url}`);

        // Update state with S3 URL
        const newVideos = [...uploadedVideos];
        const newFormVideos = [...formData.videos];
        
        while (newVideos.length <= index) {
          newVideos.push("");
          newFormVideos.push("");
        }
        
        newVideos[index] = result.url;
        newFormVideos[index] = result.url;
        
        setUploadedVideos(newVideos);
        setFormData({ ...formData, videos: newFormVideos });
        
        // Clear pending file
        const newPendingFiles = [...pendingVideoFiles];
        newPendingFiles[index] = null;
        setPendingVideoFiles(newPendingFiles);
        
        alert('Video uploaded successfully!');
      } catch (error) {
        console.error('[Video Upload] Error:', error);
        alert('Failed to upload video. Please try again.');
      } finally {
        setUploadingVideoIndex(null);
      }
    };

    const handleVideoRemove = async (index: number) => {
      const videoUrl = uploadedVideos[index];
      
      // If it's an S3 URL, delete from S3
      if (videoUrl && videoUrl.startsWith('https://')) {
        try {
          console.log(`[Video Remove] Deleting video from S3: ${videoUrl}`);
          const response = await fetch('/api/upload/s3/delete', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: videoUrl }),
          });
          
          if (response.ok) {
            console.log(`✓ Video deleted from S3`);
          } else {
            console.error('[Video Remove] Failed to delete from S3');
          }
        } catch (error) {
          console.error('[Video Remove] Error deleting from S3:', error);
          // Continue with removal from state even if S3 delete fails
        }
      }
      
      // Remove from state
      const newVideos = [...uploadedVideos];
      const newFormVideos = [...formData.videos];
      newVideos.splice(index, 1);
      newFormVideos.splice(index, 1);
      setUploadedVideos(newVideos);
      setFormData({ ...formData, videos: newFormVideos });
      
      // Clear pending file too
      const newPendingFiles = [...pendingVideoFiles];
      newPendingFiles.splice(index, 1);
      setPendingVideoFiles(newPendingFiles);
      
      // If removing the last video and there are multiple fields, reduce field count
      if (index === videoFieldCount - 1 && videoFieldCount > 0) {
        setVideoFieldCount(videoFieldCount - 1);
      }
    };

    const handleAddVideoField = () => {
      if (videoFieldCount < MAX_VIDEOS) {
        setVideoFieldCount(videoFieldCount + 1);
      } else {
        alert(`Maximum ${MAX_VIDEOS} videos allowed`);
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

      if (formData.images.length === 0) {
        setError("At least one image is required");
        setLoading(false);
        return;
      }

      if (formData.images.length > MAX_IMAGES) {
        setError(`Maximum ${MAX_IMAGES} images allowed`);
        setLoading(false);
        return;
      }

      if (formData.videos.length > MAX_VIDEOS) {
        setError(`Maximum ${MAX_VIDEOS} videos allowed`);
        setLoading(false);
        return;
      }

      try {
        const url = isEdit 
          ? `/api/admin/products/${productId}`
          : `/api/admin/products`;
        
        const method = isEdit ? "PATCH" : "POST";

        // Log price before sending
        console.log("Form submitting price:", formData.price, "Type:", typeof formData.price);
        const priceValue = formData.price.trim();
        console.log("Price value after trim:", priceValue);

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
            discount: formData.discount ? parseFloat(formData.discount) : undefined,
            imageUrl: formData.images,
            videoUrl: formData.videos.filter(v => v && v.trim() !== ""), // Filter out empty strings and always send array (even if empty)
            isSet: isUniversalProduct ? undefined : (formData.isSet || undefined),
            numberOfSets: isUniversalProduct ? undefined : (formData.isSet && formData.numberOfSets ? parseInt(formData.numberOfSets) : undefined),
            newAddition: isUniversalProduct ? undefined : (formData.newAddition || undefined),
            featured: isUniversalProduct ? undefined : (formData.featured || undefined),
            tuning: isUniversalProduct ? undefined : (formData.tuning ? parseFloat(formData.tuning) : undefined),
            octave: isUniversalProduct ? undefined : (formData.octave || undefined),
            size: isUniversalProduct ? undefined : (formData.size.trim() || undefined),
            weight: isUniversalProduct ? undefined : (formData.weight || undefined),
            relativeproduct: isUniversalProduct ? true : undefined,
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Failed to save product");
        }

        setSuccess(isEdit ? "Product updated successfully!" : "Product created successfully!");
        
        setTimeout(() => {
          if (onComplete) {
            onComplete();
          }
        }, 1500);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
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
                    handleImageUpload(index, file);
                  }}
                />
                {uploadedImages[index] && (
                  <div className="relative  w-full h-32 max-w-[200px] rounded-md border border-zinc-600 overflow-hidden  bg-zinc-900">
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
                    <button
                      type="button"
                      onClick={() => handleImageUpload(index, null)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 z-10"
                      title="Remove image"
                    >
                      ×
                    </button>
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
                  {pendingVideoFiles[index] && !uploadedVideos[index] && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleVideoSelect(index, null)}
                        disabled={uploadingVideoIndex === index}
                        className="px-4 py-2 bg-zinc-600 hover:bg-zinc-700 text-white rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                        title="Remove selection"
                      >
                        Remove
                      </button>
                      <button
                        type="button"
                        onClick={() => handleVideoUpload(index)}
                        disabled={uploadingVideoIndex === index}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                      >
                        {uploadingVideoIndex === index ? (
                          <span className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Uploading...
                          </span>
                        ) : (
                          'Upload'
                        )}
                      </button>
                    </div>
                  )}
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
                {pendingVideoFiles[index] && !uploadedVideos[index] && (
                  <div className="p-3 bg-zinc-800 rounded-md border border-zinc-600">
                    <p className="text-sm text-zinc-300">
                      📁 Selected: <span className="text-white">{pendingVideoFiles[index]?.name}</span>
                    </p>
                    <p className="text-xs text-zinc-400 mt-1">
                      Size: {((pendingVideoFiles[index]?.size || 0) / (1024 * 1024)).toFixed(2)} MB
                    </p>
                    <p className="text-xs text-yellow-400 mt-1">
                      ⚠️ Click "Upload" button to upload this video
                    </p>
                  </div>
                )}
                {/* Show uploaded video */}
                {uploadedVideos[index] && (
                  <div className="relative w-full rounded-md border border-zinc-600 overflow-hidden bg-zinc-900">
                    {uploadedVideos[index].startsWith("data:video") ? (
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

