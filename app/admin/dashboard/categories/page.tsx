"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Package, Image as ImageIcon, Star } from "lucide-react";
import toast from "react-hot-toast";

type Category = {
  _id: string;
  name: string;
  slug: string;
  imageUrl?: string;
  isFeatured?: boolean;
  createdAt: string;
  updatedAt: string;
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ 
    name: "", 
    image: "",
    isFeatured: false 
  });
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [featuredCount, setFeaturedCount] = useState(0);
  
  // S3 upload states
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  
  // Track original image URL when editing (for restore on cancel)
  const [originalImageUrl, setOriginalImageUrl] = useState<string>("");

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/categories");
      const data = await response.json();
      console.log("Categories API response:", data); // Debug log
      if (data.success) {
        console.log("Categories data:", data.data); // Debug log
        setCategories(data.data);
        // Count featured categories
        const featured = data.data.filter((cat: Category) => cat.isFeatured === true).length;
        console.log("Featured count:", featured); // Debug log
        setFeaturedCount(featured);
      } else {
        toast.error(data.message || "Failed to fetch categories");
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      toast.error("Failed to fetch categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Debug: Log formData changes
  useEffect(() => {
    if (showAddForm) {
      console.log("Form data state:", formData);
      console.log("Preview URL:", previewUrl);
      console.log("Editing category:", editingCategory);
    }
  }, [formData, previewUrl, editingCategory, showAddForm]);

  const getImageUrl = (imageUrl?: string) => {
    if (!imageUrl) return "";
    if (imageUrl.startsWith("data:image")) return imageUrl;
    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) return imageUrl;
    // If it's a base64 string without data: prefix, add it
    if (imageUrl.length > 100 && !imageUrl.includes("://")) {
      return `data:image/jpeg;base64,${imageUrl}`;
    }
    return imageUrl;
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
  };

  // Remove image - only clear form state, don't delete from S3 yet
  const handleRemoveImage = () => {
    // Clean up object URL if it was created from local file
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
      }
    
    setFormData({ ...formData, image: "" });
    
    // If editing and we have original image, restore preview to original
    if (editingCategory && originalImageUrl && !selectedImageFile) {
      setPreviewUrl(getImageUrl(originalImageUrl));
    } else {
    setPreviewUrl("");
    }
    
    setSelectedImageFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("Category name is required");
      return;
    }

    // Check featured limit
    if (formData.isFeatured) {
      const currentFeaturedCount = editingCategory && editingCategory.isFeatured 
        ? featuredCount // If editing and already featured, count stays same
        : featuredCount + 1; // If adding new featured or changing to featured, add 1
      
      if (currentFeaturedCount > 4) {
        toast.error("Maximum 4 featured categories allowed. Please unfeature another category first.");
        return;
      }
    }

    setSubmitting(true);

    try {
      const isEdit = !!editingCategory;
      
      // Handle image upload if a new file is selected (upload happens here during form submission)
      let finalImageUrl = formData.image;
      let uploadToastId: string | undefined;
      
      if (selectedImageFile) {
        // Show progress toast during upload (green progress bar)
        uploadToastId = toast.loading(
          <div className="flex flex-col gap-2">
            <span className="text-white font-medium">Uploading image to S3...</span>
            <div className="w-full bg-zinc-700 rounded-full h-2">
              <div className="bg-emerald-600 h-2 rounded-full animate-pulse" style={{ width: '50%' }}></div>
            </div>
          </div>,
          { duration: Infinity }
        );
        
        try {
          // Upload new image file to S3 only during form submission
          const uploadFormData = new FormData();
          uploadFormData.append('file', selectedImageFile);
          uploadFormData.append('folder', 'images');
          
          const uploadResponse = await fetch('/api/upload/cloudinary', {
            method: 'POST',
            body: uploadFormData,
          });
          
          const uploadData = await uploadResponse.json();
          
          if (!uploadResponse.ok || !uploadData.success || !uploadData.url) {
            throw new Error('Failed to upload image to S3');
          }
          
          finalImageUrl = uploadData.url;
          
          // Update progress toast
          toast.dismiss(uploadToastId);
          toast.success('Image uploaded successfully!', { duration: 2000 });
        } catch (uploadErr) {
          toast.dismiss(uploadToastId);
          throw new Error('Failed to upload image. Please try again.');
        }
      }

      const url = editingCategory 
        ? `/api/admin/categories/${editingCategory._id}`
        : "/api/admin/categories";
      
      const method = editingCategory ? "PUT" : "POST";

      // ALWAYS explicitly send all fields
      const requestBody: any = {
        name: formData.name,
        isFeatured: formData.isFeatured === true, // Explicitly set boolean (true or false)
        imageUrl: "", // Default to empty string
      };

      // Use final image URL (uploaded or existing)
      if (finalImageUrl) {
        requestBody.imageUrl = finalImageUrl;
      } else if (isEdit && originalImageUrl) {
        // When editing, preserve existing image if no new one uploaded
        requestBody.imageUrl = originalImageUrl;
      }
      // Otherwise imageUrl stays as empty string (which will be saved in DB)
      
      // Show saving toast
      const saveToastId = toast.loading(
        <div className="flex flex-col gap-2">
          <span className="text-white font-medium">{isEdit ? "Updating category..." : "Creating category..."}</span>
          <div className="w-full bg-zinc-700 rounded-full h-2">
            <div className="bg-emerald-600 h-2 rounded-full animate-pulse" style={{ width: '70%' }}></div>
          </div>
        </div>,
        { duration: Infinity }
      );

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      toast.dismiss(saveToastId);

      if (!data.success) {
        throw new Error(data.message || `Failed to ${isEdit ? 'update' : 'create'} category`);
      }

      // After successful update, delete old image from S3 if it was replaced
      if (isEdit && originalImageUrl && finalImageUrl && originalImageUrl !== finalImageUrl && originalImageUrl.startsWith('https://')) {
        try {
          await fetch("/api/upload/cloudinary/delete", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: originalImageUrl }),
          });
        } catch (err) {
          console.error("Error deleting old image from S3:", err);
          // Don't fail the update if deletion fails
        }
      }

      toast.success(data.message || `Category ${isEdit ? 'updated' : 'created'} successfully`, { duration: 3000 });
        setFormData({ name: "", image: "", isFeatured: false });
      
      // Clean up object URL if it was created from local file
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
      
        setPreviewUrl("");
        setShowAddForm(false);
        setEditingCategory(null);
      setOriginalImageUrl("");
      setSelectedImageFile(null);
        fetchCategories();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `Failed to ${editingCategory ? 'update' : 'create'} category`;
      toast.error(errorMessage, { duration: 4000 });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (category: Category) => {
    // Store original image URL for restore on cancel and S3 deletion on update
    const originalImg = category.imageUrl || "";
    setOriginalImageUrl(originalImg);
    
    setEditingCategory(category);
    
    // Preserve existing image if available
    const existingImageUrl = originalImg ? getImageUrl(originalImg) : "";
    
    // Handle isFeatured - it's already a boolean, just check if it's true
    const isFeaturedValue = category.isFeatured === true;
    
    // Reset form data completely
    const newFormData = { 
      name: category.name || "", 
      image: originalImg, // Preserve existing image URL
      isFeatured: Boolean(isFeaturedValue) // Force to boolean
    };
    
    setFormData(newFormData);
    setPreviewUrl(existingImageUrl);
    setSelectedImageFile(null);
    setShowAddForm(true);
  };

  const handleDelete = async (categoryId: string, categoryName: string) => {
    // Toast-based confirmation
    const confirmed = await new Promise<boolean>((resolve) => {
      const toastId = toast(
        (t) => (
          <div className="flex flex-col gap-3">
            <p className="text-white font-medium">Delete Category?</p>
            <p className="text-sm text-zinc-300">Are you sure you want to delete "{categoryName}"? This action cannot be undone.</p>
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

    const deletePromise = fetch(`/api/admin/categories/${categoryId}`, {
        method: "DELETE",
    }).then(async (response) => {
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || "Failed to delete category");
      }
      fetchCategories();
      return data;
    });

    toast.promise(deletePromise, {
      loading: "Deleting category...",
      success: "Category deleted successfully!",
      error: (err) => err.message || "Failed to delete category",
    });

    try {
      await deletePromise;
    } catch {
      // Error handled by toast.promise
    }
  };

  const handleCancel = () => {
    // Clean up object URL if it was created from local file
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    
    // If editing, restore original image
    if (editingCategory && originalImageUrl) {
      setFormData({ 
        ...formData,
        image: originalImageUrl,
      });
      setPreviewUrl(getImageUrl(originalImageUrl));
    }
    
    setShowAddForm(false);
    setEditingCategory(null);
    setFormData({ name: "", image: "", isFeatured: false });
    setPreviewUrl("");
    setOriginalImageUrl("");
    setSelectedImageFile(null);
  };

  const handleFeaturedChange = (checked: boolean) => {
    if (checked) {
      // Check if we can add another featured category
      const willExceedLimit = editingCategory && editingCategory.isFeatured
        ? featuredCount > 4 // Already featured, won't change count
        : featuredCount >= 4; // Adding new featured, check if at limit
      
      if (willExceedLimit) {
        toast.error("Maximum 4 featured categories allowed. Please unfeature another category first.");
        return;
      }
    }
    setFormData({ ...formData, isFeatured: checked });
  };

  return (
    <div className="min-h-screen bg-zinc-900 p-6 sm:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Categories Management</h1>
            <p className="text-zinc-400 mt-1">
              Manage product categories {featuredCount > 0 && `(${featuredCount}/4 featured)`}
            </p>
          </div>
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-100"
            >
              <Plus className="w-4 h-4" />
              Add Category
            </button>
          )}
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="mb-8 bg-zinc-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              {editingCategory ? "Edit Category" : "Add New Category"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-zinc-700 border border-zinc-600 rounded-md text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-white"
                  placeholder="e.g., Rings, Necklaces, Accessories"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Category Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageSelect(e.target.files?.[0] || null)}
                  className="w-full px-4 py-2 bg-zinc-700 border border-zinc-600 rounded-md text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-white"
                />
                
                {/* Selected file preview (not uploaded to S3 yet) */}
                {selectedImageFile && !formData.image && previewUrl && (
                  <div className="mt-2">
                    <div className="bg-zinc-700 border border-zinc-600 rounded-md p-3 mb-2">
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
                            if (previewUrl && previewUrl.startsWith('blob:')) {
                              URL.revokeObjectURL(previewUrl);
                            }
                            setSelectedImageFile(null);
                            setPreviewUrl("");
                            setFormData({ ...formData, image: "" });
                            if (editingCategory && originalImageUrl) {
                              setPreviewUrl(getImageUrl(originalImageUrl));
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
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.error("Image load error:", previewUrl);
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Uploaded image preview */}
                {previewUrl && formData.image && !selectedImageFile && (
                  <div className="mt-4 relative w-full h-48 max-w-md rounded-md border border-zinc-600 overflow-hidden bg-zinc-900">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error("Image load error:", previewUrl);
                        e.currentTarget.style.display = "none";
                      }}
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
                {editingCategory && editingCategory.imageUrl && !previewUrl && !formData.image && (
                  <div className="mt-2 text-sm text-zinc-400">
                    Current image will be preserved. Upload a new image to replace it.
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isFeatured"
                  checked={formData.isFeatured === true}
                  onChange={(e) => {
                    console.log("Checkbox changed to:", e.target.checked); // Debug log
                    handleFeaturedChange(e.target.checked);
                  }}
                  className="w-4 h-4 text-[#000000] bg-zinc-700 border-zinc-600 rounded focus:ring-[#000000] focus:ring-2"
                />
                <label htmlFor="isFeatured" className="flex items-center gap-2 text-sm font-medium text-zinc-300 cursor-pointer">
                  <Star className={`w-4 h-4 ${formData.isFeatured ? 'text-yellow-400 fill-yellow-400' : 'text-yellow-400'}`} />
                  Featured Category {featuredCount >= 4 && !formData.isFeatured && "(Maximum 4 reached)"}
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-white text-zinc-900 rounded-md font-medium hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Saving..." : editingCategory ? "Update Category" : "Create Category"}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 bg-zinc-700 text-white rounded-md font-medium hover:bg-zinc-600"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Categories List */}
        {loading ? (
          <div className="text-zinc-400 text-center py-12">Loading categories...</div>
        ) : categories.length === 0 ? (
          <div className="text-center py-12 bg-zinc-800 rounded-lg">
            <Package className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-400 text-lg mb-2">No categories yet</p>
            <p className="text-zinc-500 text-sm">Create your first category to organize products</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
              <div
                key={category._id}
                className="bg-zinc-800 rounded-lg overflow-hidden hover:bg-zinc-750 transition-colors"
              >
                {/* Category Image */}
                {category.imageUrl && (
                  <div className="relative w-full h-48 bg-zinc-900">
                    <img
                      src={getImageUrl(category.imageUrl)}
                      alt={category.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error("Category image load error:", category.imageUrl);
                        e.currentTarget.style.display = "none";
                      }}
                      onLoad={() => {
                        console.log("Category image loaded successfully:", category.imageUrl);
                      }}
                    />
                  </div>
                )}
                {!category.imageUrl && (
                  <div className="relative w-full h-48 bg-zinc-900 flex items-center justify-center">
                    <ImageIcon className="w-12 h-12 text-zinc-600" />
                  </div>
                )}
                
                <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-white">
                      {category.name}
                    </h3>
                        {category.isFeatured && (
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        )}
                      </div>
                    <p className="text-xs text-zinc-500">
                      Slug: {category.slug}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(category)}
                      className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded transition-colors"
                      title="Edit category"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(category._id, category.name)}
                      className="p-2 text-zinc-400 hover:text-red-400 hover:bg-zinc-700 rounded transition-colors"
                      title="Delete category"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="text-xs text-zinc-500">
                  Created {new Date(category.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

