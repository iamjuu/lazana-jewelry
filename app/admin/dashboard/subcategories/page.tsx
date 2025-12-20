"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Package, Image as ImageIcon } from "lucide-react";
import toast from "react-hot-toast";

type Category = {
  _id: string;
  name: string;
  slug: string;
};

type Subcategory = {
  _id: string;
  name: string;
  slug: string;
  category: string | Category;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
};

export default function SubcategoriesPage() {
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null);
  const [formData, setFormData] = useState({ 
    name: "", 
    category: "",
    image: "" as string | File | null,
  });
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await fetch("/api/admin/categories");
      const data = await response.json();
      if (data.success) {
        setCategories(data.data);
      } else {
        toast.error(data.message || "Failed to fetch categories");
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      toast.error("Failed to fetch categories");
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchSubcategories = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/subcategories");
      const data = await response.json();
      if (data.success) {
        setSubcategories(data.data);
      } else {
        toast.error(data.message || "Failed to fetch subcategories");
      }
    } catch (error) {
      console.error("Failed to fetch subcategories:", error);
      toast.error("Failed to fetch subcategories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchSubcategories();
  }, []);

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

  const handleImageUpload = async (file: File | null) => {
    if (!file) {
      setFormData({ ...formData, image: "" });
      setPreviewUrl("");
      return;
    }

    try {
      const base64String = await compressImageToBase64(file);
      setFormData({ ...formData, image: base64String });
      setPreviewUrl(base64String);
    } catch (error) {
      console.error("Error compressing image:", error);
      toast.error("Failed to process image");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("Subcategory name is required");
      return;
    }

    if (!formData.category) {
      toast.error("Category is required");
      return;
    }

    setSubmitting(true);

    try {
      const url = editingSubcategory 
        ? `/api/admin/subcategories/${editingSubcategory._id}`
        : "/api/admin/subcategories";
      
      const method = editingSubcategory ? "PUT" : "POST";

      const requestBody: any = {
        name: formData.name,
        category: formData.category,
        imageUrl: "", // Default to empty string
      };

      // Handle image URL
      if (formData.image && typeof formData.image === "string" && formData.image.length > 0) {
        requestBody.imageUrl = formData.image;
      } else if (editingSubcategory && editingSubcategory.imageUrl && !formData.image) {
        requestBody.imageUrl = editingSubcategory.imageUrl;
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message || `Subcategory ${editingSubcategory ? 'updated' : 'created'} successfully`);
        setFormData({ name: "", category: "", image: "" });
        setPreviewUrl("");
        setShowAddForm(false);
        setEditingSubcategory(null);
        fetchSubcategories();
      } else {
        toast.error(data.message || `Failed to ${editingSubcategory ? 'update' : 'create'} subcategory`);
      }
    } catch (error) {
      console.error("Error submitting subcategory:", error);
      toast.error(`Failed to ${editingSubcategory ? 'update' : 'create'} subcategory`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (subcategory: Subcategory) => {
    setEditingSubcategory(subcategory);
    
    const existingImageUrl = subcategory.imageUrl ? getImageUrl(subcategory.imageUrl) : "";
    const categoryId = typeof subcategory.category === 'object' ? subcategory.category._id : subcategory.category;
    
    setFormData({ 
      name: subcategory.name || "", 
      category: categoryId || "",
      image: subcategory.imageUrl || "", 
    });
    setPreviewUrl(existingImageUrl);
    setShowAddForm(true);
  };

  const handleDelete = async (subcategoryId: string, subcategoryName: string) => {
    if (!confirm(`Are you sure you want to delete "${subcategoryName}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/subcategories/${subcategoryId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Subcategory deleted successfully");
        fetchSubcategories();
      } else {
        toast.error(data.message || "Failed to delete subcategory");
      }
    } catch (error) {
      console.error("Error deleting subcategory:", error);
      toast.error("Failed to delete subcategory");
    }
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingSubcategory(null);
    setFormData({ name: "", category: "", image: "" });
    setPreviewUrl("");
  };

  const getCategoryName = (category: string | Category) => {
    return typeof category === 'object' ? category.name : 
           categories.find(cat => cat._id === category)?.name || 'Unknown';
  };

  return (
    <div className="min-h-screen bg-zinc-900 p-6 sm:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Subcategories Management</h1>
            <p className="text-zinc-400 mt-1">
              Manage product subcategories
            </p>
          </div>
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-100"
            >
              <Plus className="w-4 h-4" />
              Add Subcategory
            </button>
          )}
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="mb-8 bg-zinc-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              {editingSubcategory ? "Edit Subcategory" : "Add New Subcategory"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Category *
                </label>
                {loadingCategories ? (
                  <div className="text-xs text-zinc-400 py-2">Loading categories...</div>
                ) : (
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 bg-zinc-700 border border-zinc-600 rounded-md text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-white"
                    required
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
                    No categories available. Create categories first.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Subcategory Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-zinc-700 border border-zinc-600 rounded-md text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-white"
                  placeholder="e.g., Crystal Singing Bowls, Tibetan Bowls"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Subcategory Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e.target.files?.[0] || null)}
                  className="w-full px-4 py-2 bg-zinc-700 border border-zinc-600 rounded-md text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-white"
                />
                {previewUrl && (
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
                    {editingSubcategory && (
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, image: "" });
                          setPreviewUrl("");
                        }}
                        className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                )}
                {editingSubcategory && editingSubcategory.imageUrl && !previewUrl && (
                  <div className="mt-2 text-sm text-zinc-400">
                    Current image will be preserved. Upload a new image to replace it.
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-white text-zinc-900 rounded-md font-medium hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Saving..." : editingSubcategory ? "Update Subcategory" : "Create Subcategory"}
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

        {/* Subcategories List */}
        {loading ? (
          <div className="text-zinc-400 text-center py-12">Loading subcategories...</div>
        ) : subcategories.length === 0 ? (
          <div className="text-center py-12 bg-zinc-800 rounded-lg">
            <Package className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-400 text-lg mb-2">No subcategories yet</p>
            <p className="text-zinc-500 text-sm">Create your first subcategory to organize products</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subcategories.map((subcategory) => (
              <div
                key={subcategory._id}
                className="bg-zinc-800 rounded-lg overflow-hidden hover:bg-zinc-750 transition-colors"
              >
                {/* Subcategory Image */}
                {subcategory.imageUrl && (
                  <div className="relative w-full h-48 bg-zinc-900">
                    <img
                      src={getImageUrl(subcategory.imageUrl)}
                      alt={subcategory.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error("Subcategory image load error:", subcategory.imageUrl);
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                )}
                {!subcategory.imageUrl && (
                  <div className="relative w-full h-48 bg-zinc-900 flex items-center justify-center">
                    <ImageIcon className="w-12 h-12 text-zinc-600" />
                  </div>
                )}
                
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-1">
                        {subcategory.name}
                      </h3>
                      <p className="text-sm text-zinc-400 mb-1">
                        Category: {getCategoryName(subcategory.category)}
                      </p>
                      <p className="text-xs text-zinc-500">
                        Slug: {subcategory.slug}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(subcategory)}
                        className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded transition-colors"
                        title="Edit subcategory"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(subcategory._id, subcategory.name)}
                        className="p-2 text-zinc-400 hover:text-red-400 hover:bg-zinc-700 rounded transition-colors"
                        title="Delete subcategory"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="px-6 pb-4 text-xs text-zinc-500">
                  Created {new Date(subcategory.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

