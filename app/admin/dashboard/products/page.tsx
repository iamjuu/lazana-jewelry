"use client";

import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import ProductForm from "@/components/dashboard/ProductForm";
import ProductList from "@/components/dashboard/ProductList";

type Product = {
  _id: string;
  name: string;
  price: number;
  discount?: number;
  createdAt: string;
  description?: string;
  shortDescription?: string;
  category?: string | { _id: string; name: string; slug: string };
  subcategory?: string | { _id: string; name: string; slug: string; category: string | { _id: string; name: string; slug: string } };
  imageUrl?: string[];
  videoUrl?: string | string[];
  relativeproduct?: boolean;
  bestSelling?: boolean;
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isUniversalProduct, setIsUniversalProduct] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const productsPerPage = 10;

  const fetchProducts = async (page: number = 1, search: string = "") => {
    try {
      setLoading(true);
      // Build query parameters
      const params = new URLSearchParams();
      params.append("includeRelative", "true");
      params.append("page", page.toString());
      params.append("limit", productsPerPage.toString());
      if (search.trim()) {
        params.append("search", search.trim());
      }
      
      const response = await fetch(`/api/products?${params.toString()}`);
      const data = await response.json();
      if (data.success) {
        setProducts(data.data);
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages || 1);
          setCurrentPage(data.pagination.page || 1);
        }
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1); // Reset to page 1 when search changes
  }, [searchQuery]);

  useEffect(() => {
    fetchProducts(currentPage, searchQuery);
  }, [currentPage, searchQuery]);

  const handleAddComplete = () => {
    setShowAddForm(false);
    fetchProducts(currentPage);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-900 px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <h1 className="text-2xl font-bold text-white sm:text-3xl">Products Management</h1>
          {!showAddForm && (
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
              <button
                onClick={() => {
                  setIsUniversalProduct(false);
                  setShowAddForm(true);
                }}
                className="inline-flex min-h-11 items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-100"
              >
                Add Product
              </button>
              <button
                onClick={() => {
                  setIsUniversalProduct(true);
                  setShowAddForm(true);
                }}
                className="inline-flex min-h-11 items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                Add Universal Product
              </button>
            </div>
          )}
        </div>

        {/* Search */}
        {!showAddForm && (
          <div className="mb-6">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" size={20} />
              <input
                type="text"
                placeholder="Search products by name, description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-zinc-600 bg-zinc-800 py-2.5 pl-10 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {showAddForm && (
          <div className="mb-8">
            <ProductForm 
              onComplete={handleAddComplete} 
              onCancel={() => {
                setShowAddForm(false);
                setIsUniversalProduct(false);
              }}
              isUniversalProduct={isUniversalProduct}
            />
          </div>
        )}

        {loading ? (
          <div className="text-zinc-400">Loading products...</div>
        ) : (
          <>
            <ProductList products={products} onRefresh={() => fetchProducts(currentPage)} />
            {totalPages > 1 && (
              <div className="mt-6 flex flex-col gap-3 border-t border-zinc-700 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-zinc-400">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                    className="rounded-md border border-zinc-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className="rounded-md border border-zinc-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

