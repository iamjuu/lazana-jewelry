"use client";

import { useState, useEffect } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

type Blog = {
  _id: string;
  name: string;
  title: string;
  description: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
};

export default function BlogsPage() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    title: "",
    description: "",
    image: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [blogsLoading, setBlogsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalBlogs, setTotalBlogs] = useState<number>(0);
  
  // S3 upload states
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Fetch blogs
  const fetchBlogs = async () => {
    try {
      setBlogsLoading(true);
      const params = new URLSearchParams();
      params.append("page", currentPage.toString());
      params.append("limit", "10");
      if (searchQuery.trim()) {
        params.append("search", searchQuery.trim());
      }
      
      const response = await fetch(`/api/admin/blogs?${params.toString()}`);
      const data = await response.json();
      if (data.success && data.data) {
        setBlogs(data.data);
        if (data.pagination) {
          setTotalPages(data.pagination.pages || 1);
          setTotalBlogs(data.pagination.total || 0);
        }
      } else {
        setBlogs([]);
      }
    } catch (error) {
      console.error("Failed to fetch blogs:", error);
      setBlogs([]);
    } finally {
      setBlogsLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1); // Reset to page 1 when search changes
  }, [searchQuery]);

  useEffect(() => {
    fetchBlogs();
  }, [currentPage, searchQuery]);

  // Normalize image URL for display
  const getImageUrl = (blog: Blog) => {
    const img = blog.imageUrl;
    if (!img) return "";
    if (img.startsWith("data:image")) return img;
    if (img.startsWith("http://") || img.startsWith("https://")) return img;
    return `data:image/jpeg;base64,${img}`;
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this blog?")) return;

    setDeletingId(id);
    try {
      const response = await fetch(`/api/admin/blogs/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        alert(data.message || "Failed to delete blog");
      } else {
        setBlogs(blogs.filter((b) => b._id !== id));
      }
    } catch {
      alert("Failed to delete blog");
    } finally {
      setDeletingId(null);
    }
  };

  // Handle image selection (don't upload yet)
  const handleImageSelect = (file: File | null) => {
    if (!file) {
      setSelectedImageFile(null);
      return;
    }
    setSelectedImageFile(file);
    setError(null);
  };

  // Upload image to S3
  const handleUploadImageToS3 = async () => {
    if (!selectedImageFile) return;

    setUploadingImage(true);
    setError(null);

    try {
      // Delete old image if replacing
      if (formData.image) {
        await fetch("/api/upload/s3/delete", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: formData.image }),
        });
      }

      // Upload new image to S3
      const uploadFormData = new FormData();
      uploadFormData.append("file", selectedImageFile);
      uploadFormData.append("folder", "images");

      const response = await fetch("/api/upload/s3", {
        method: "POST",
        body: uploadFormData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload image to S3");
      }

      const { url } = await response.json();

      setFormData({ ...formData, image: url });
      setPreviewUrl(url);
      setSelectedImageFile(null);
    } catch (err) {
      console.error("Error uploading image:", err);
      setError("Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  // Remove uploaded image
  const handleRemoveImage = async () => {
    if (formData.image) {
      try {
        await fetch("/api/upload/s3/delete", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: formData.image }),
        });
      } catch (err) {
        console.error("Error deleting image:", err);
      }
    }
    setFormData({ ...formData, image: "" });
    setPreviewUrl("");
    setSelectedImageFile(null);
  };

  // Handle edit button click
  const handleEdit = (blog: Blog) => {
    setEditingId(blog._id);
    setShowAddForm(true);
    setFormData({
      name: blog.name || "",
      title: blog.title || "",
      description: blog.description || "",
      image: blog.imageUrl || "",
    });
    
    if (blog.imageUrl) {
      setPreviewUrl(getImageUrl(blog));
    } else {
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

    if (!formData.description.trim()) {
      setError("Description is required");
      setLoading(false);
      return;
    }

    try {
      const isEdit = !!editingId;
      const url = isEdit 
        ? `/api/admin/blogs/${editingId}`
        : `/api/admin/blogs`;
      
      const method = isEdit ? "PATCH" : "POST";

      // Prepare request body
      const requestBody: {
        name: string;
        title: string;
        description: string;
        imageUrl?: string;
      } = {
        name: formData.name.trim(),
        title: formData.title.trim(),
        description: formData.description.trim(),
      };

      if (formData.image) {
        requestBody.imageUrl = typeof formData.image === "string" ? formData.image : undefined;
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
        throw new Error(data.message || `Failed to ${isEdit ? "update" : "create"} blog`);
      }

      setSuccess(`Blog ${isEdit ? "updated" : "created"} successfully!`);
      setFormData({ name: "", title: "", description: "", image: "" });
      setPreviewUrl("");
      setEditingId(null);
      
      // Refresh blogs list
      await fetchBlogs();
      
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
    setFormData({ name: "", title: "", description: "", image: "" });
    setPreviewUrl("");
    setEditingId(null);
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="min-h-screen bg-zinc-900 p-6 sm:p-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-3xl font-bold text-white mb-6">Blog Management</h1>

        {/* Add Button and Search */}
        {!showAddForm && (
          <div className="mb-6 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
              >
                Add Blog
              </button>
              {totalBlogs > 0 && (
                <div className="text-sm text-zinc-400">
                  Total Blogs: {totalBlogs}
                </div>
              )}
            </div>
            
            {/* Search */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" size={20} />
              <input
                type="text"
                placeholder="Search blogs by name, title, description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {/* Blogs List */}
        {!showAddForm && (
          <div className="mt-6">
            {blogsLoading ? (
              <div className="text-zinc-400 text-center py-8">Loading blogs...</div>
            ) : blogs.length === 0 ? (
              <div className="rounded-lg border border-zinc-700 bg-zinc-800 p-10 text-center">
                <p className="text-zinc-400 mb-2">No blogs found</p>
                <p className="text-zinc-500 text-sm mt-2">
                  Create your first blog using the Add button above.
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-zinc-700 bg-zinc-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-sm">
                    <thead>
                      <tr className="border-b border-zinc-700 bg-zinc-900 text-left text-xs uppercase tracking-wide text-zinc-400">
                        <th className="px-6 py-3 font-medium">Image</th>
                        <th className="px-6 py-3 font-medium">Name</th>
                        <th className="px-6 py-3 font-medium">Title</th>
                        <th className="px-6 py-3 font-medium">Description</th>
                        <th className="px-6 py-3 font-medium">Created</th>
                        <th className="px-6 py-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {blogs.map((blog) => (
                        <tr key={blog._id} className="border-b border-zinc-700 last:border-0 hover:bg-zinc-900/50 transition-colors">
                          <td className="px-6 py-4">
                            {blog.imageUrl ? (
                              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md border border-zinc-700 bg-zinc-900">
                                <img
                                  src={getImageUrl(blog)}
                                  alt={blog.title || "Blog"}
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
                            <p className="font-medium text-white">{blog.name || "N/A"}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-medium text-white">{blog.title || "Untitled"}</p>
                          </td>
                          <td className="px-6 py-4">
                            {blog.description ? (
                              <p className="line-clamp-2 text-xs text-zinc-400 max-w-md">
                                {blog.description}
                              </p>
                            ) : (
                              <span className="text-zinc-500 text-xs">No description</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-zinc-400">
                            {new Date(blog.createdAt).toLocaleDateString(undefined, {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEdit(blog)}
                                className="rounded-md border border-zinc-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-zinc-700"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(blog._id)}
                                disabled={deletingId === blog._id}
                                className="rounded-md border border-red-600 px-3 py-1 text-xs font-medium text-red-400 transition-colors hover:bg-red-900/20 disabled:opacity-50"
                              >
                                {deletingId === blog._id ? "Deleting..." : "Delete"}
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
                    Showing page {currentPage} of {totalPages} ({totalBlogs} total blogs)
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
                {editingId ? "Edit" : "Add"} Blog
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
              <label htmlFor="blog-name" className="text-sm font-medium text-white">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                id="blog-name"
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
                placeholder="Enter blog name"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="blog-title" className="text-sm font-medium text-white">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                id="blog-title"
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
                placeholder="Enter blog title"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="blog-image" className="text-sm font-medium text-white">
                Image
              </label>
              <input
                id="blog-image"
                type="file"
                accept="image/*"
                onChange={(e) => handleImageSelect(e.target.files?.[0] || null)}
                className="w-full rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
              />
              
              {/* Pending file preview with upload button */}
              {selectedImageFile && !formData.image && (
                <div className="bg-zinc-800 border border-zinc-600 rounded-md p-3 mt-2">
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <p className="text-sm text-white font-medium">📁 {selectedImageFile.name}</p>
                      <p className="text-xs text-zinc-400 mt-1">
                        Size: {(selectedImageFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleUploadImageToS3}
                      disabled={uploadingImage}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 text-white text-sm font-medium rounded-md transition-colors"
                    >
                      {uploadingImage ? "Uploading..." : "Upload"}
                    </button>
                  </div>
                  {!uploadingImage && (
                    <p className="text-xs text-yellow-500 mt-2">⚠️ Click "Upload" to save this image</p>
                  )}
                </div>
              )}

              {/* Uploaded image preview */}
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
              <label htmlFor="blog-description" className="text-sm font-medium text-white">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="blog-description"
                rows={4}
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
                placeholder="Enter blog description"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (editingId ? "Updating..." : "Creating...") : (editingId ? "Update Blog" : "Create Blog")}
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

