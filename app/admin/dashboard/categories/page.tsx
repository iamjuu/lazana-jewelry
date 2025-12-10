"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Package } from "lucide-react";
import toast from "react-hot-toast";

type Category = {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [submitting, setSubmitting] = useState(false);

  const fetchCategories = async () => {
    try {
      setLoading(true);
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
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("Category name is required");
      return;
    }

    setSubmitting(true);

    try {
      const url = editingCategory 
        ? `/api/admin/categories/${editingCategory._id}`
        : "/api/admin/categories";
      
      const method = editingCategory ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message || `Category ${editingCategory ? 'updated' : 'created'} successfully`);
        setFormData({ name: "", description: "" });
        setShowAddForm(false);
        setEditingCategory(null);
        fetchCategories();
      } else {
        toast.error(data.message || `Failed to ${editingCategory ? 'update' : 'create'} category`);
      }
    } catch (error) {
      console.error("Error submitting category:", error);
      toast.error(`Failed to ${editingCategory ? 'update' : 'create'} category`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({ name: category.name, description: category.description || "" });
    setShowAddForm(true);
  };

  const handleDelete = async (categoryId: string, categoryName: string) => {
    if (!confirm(`Are you sure you want to delete "${categoryName}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/categories/${categoryId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Category deleted successfully");
        fetchCategories();
      } else {
        toast.error(data.message || "Failed to delete category");
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("Failed to delete category");
    }
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingCategory(null);
    setFormData({ name: "", description: "" });
  };

  return (
    <div className="min-h-screen bg-zinc-900 p-6 sm:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Categories Management</h1>
            <p className="text-zinc-400 mt-1">Manage product categories</p>
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
                  placeholder="e.g., Crystal Bowls, Healing Tools, Accessories"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 bg-zinc-700 border border-zinc-600 rounded-md text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-white"
                  placeholder="Brief description of this category"
                  rows={3}
                />
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
                className="bg-zinc-800 rounded-lg p-6 hover:bg-zinc-750 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {category.name}
                    </h3>
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
                
                {category.description && (
                  <p className="text-sm text-zinc-400 mb-3">
                    {category.description}
                  </p>
                )}
                
                <div className="text-xs text-zinc-500">
                  Created {new Date(category.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

