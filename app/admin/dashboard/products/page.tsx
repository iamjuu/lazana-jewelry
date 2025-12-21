"use client";

import { useState, useEffect } from "react";
import ProductForm from "@/components/dashboard/ProductForm";
import ProductList from "@/components/dashboard/ProductList";

type Product = {
  _id: string;
  name: string;
  price: number;
  createdAt: string;
  description?: string;
  shortDescription?: string;
  category?: string | { _id: string; name: string; slug: string };
  subcategory?: string | { _id: string; name: string; slug: string; category: string | { _id: string; name: string; slug: string } };
  imageUrl?: string[];
  videoUrl?: string | string[];
  relativeproduct?: boolean;
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isUniversalProduct, setIsUniversalProduct] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const productsPerPage = 10;

  const fetchProducts = async (page: number = 1) => {
    try {
      setLoading(true);
      // Fetch all products including universal products (relativeproduct: true)
      const response = await fetch(`/api/products?includeRelative=true&page=${page}&limit=${productsPerPage}`);
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
    fetchProducts(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

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
    <div className="min-h-screen bg-zinc-900 p-6 sm:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-white">Products Management</h1>
          {!showAddForm && (
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setIsUniversalProduct(false);
                  setShowAddForm(true);
                }}
                className="inline-flex items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-100"
              >
                Add Product
              </button>
              <button
                onClick={() => {
                  setIsUniversalProduct(true);
                  setShowAddForm(true);
                }}
                className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                Add Universal Product
              </button>
            </div>
          )}
        </div>

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
              <div className="mt-6 flex items-center justify-between border-t border-zinc-700 pt-4">
                <div className="text-sm text-zinc-400">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                    className="rounded-md border border-zinc-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className="rounded-md border border-zinc-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
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

