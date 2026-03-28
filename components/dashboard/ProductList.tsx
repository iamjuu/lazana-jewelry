"use client";

import { useState, useEffect } from "react";
import ProductForm from "./ProductForm";
import Swal from "sweetalert2";
import toast from "react-hot-toast";

type ProductListItem = {
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

type Props = {
  products: ProductListItem[];
  onRefresh: () => void;
};

const formatCurrency = (amount: number) => {
  // Show decimals only if the number has decimal values
  const rounded = Math.round(amount * 100) / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    currencyDisplay: "code",
    minimumFractionDigits: rounded % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(rounded);
};

const getMainImageUrl = (product: ProductListItem) => {
  const img = product.imageUrl?.[0];
  if (!img) return "";
  if (img.startsWith("data:image")) return img;
  if (img.startsWith("http://") || img.startsWith("https://")) return img;
  return `data:image/jpeg;base64,${img}`;
};

export default function ProductList({ products: initialProducts, onRefresh }: Props) {
  const [products, setProducts] = useState(initialProducts);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Sync products when prop changes
  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Are you sure you want to delete this product?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    setDeletingId(id);
    try {
      const response = await fetch(`/api/admin/products/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(data.message || "Failed to delete product");
      } else {
        setProducts(products.filter((p) => p._id !== id));
        onRefresh();
        toast.success("Product deleted successfully");
      }
    } catch {
      toast.error("Failed to delete product");
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditComplete = () => {
    setEditingId(null);
    onRefresh();
  };

  if (products.length === 0) {
    return (
      <div className="rounded-lg  p-10 text-center">
        <p className="text-zinc-400">There is no product</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-800 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-zinc-700 bg-zinc-900 text-left text-xs uppercase tracking-wide text-zinc-400">
              <th className="px-6 py-3 font-medium">Name</th>
              <th className="px-6 py-3 font-medium">Price</th>
              <th className="px-6 py-3 font-medium">Created</th>
              <th className="px-6 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr 
                key={product._id} 
                className={`border-b border-zinc-700 last:border-0 ${product.relativeproduct ? 'bg-blue-900/20' : ''}`}
              >
                {editingId === product._id ? (
                  <td colSpan={4} className="px-6 py-4">
                    <ProductForm
                      productId={product._id}
                      initialData={{
                        name: product.name,
                        shortDescription: product.shortDescription,
                        description: product.description,
                        category: product.category,
                        subcategory: product.subcategory,
                        price: product.price.toString(),
                        discount: (product as any).discount,
                        imageUrl: product.imageUrl || [],
                        videoUrl: product.videoUrl,
                        isSet: (product as any).isSet,
                        numberOfSets: (product as any).numberOfSets,
                        newAddition: (product as any).newAddition,
                        featured: (product as any).featured,
                        bestSelling: (product as any).bestSelling,
                        tuning: (product as any).tuning,
                        octave: (product as any).octave,
                        size: (product as any).size,
                        weight: (product as any).weight,
                      }}
                      onComplete={handleEditComplete}
                      onCancel={() => setEditingId(null)}
                      isUniversalProduct={!!product.relativeproduct}
                    />
                  </td>
                ) : (
                  <>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {getMainImageUrl(product) && (
                          <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-md border border-zinc-700 bg-zinc-900">
                            <img
                              src={getMainImageUrl(product)}
                              alt={product.name}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-white">{product.name}</p>
                            {product.relativeproduct && (
                              <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-medium text-white" title="Universal Product">
                                Universal
                              </span>
                            )}
                            {product.videoUrl && (
                              <span className="text-xs text-zinc-500" title="Has video">
                                🎥
                              </span>
                            )}
                          </div>
                          {product.description && (
                            <p className="mt-1 line-clamp-2 text-xs text-zinc-400">{product.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-white">
                      {product.discount && product.discount > 0 
                        ? formatCurrency(product.price - product.discount)
                        : formatCurrency(product.price)
                      }
                    </td>
                    <td className="px-6 py-4 text-zinc-400">
                      {new Date(product.createdAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingId(product._id)}
                          className="rounded-md border border-zinc-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-zinc-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(product._id)}
                          disabled={deletingId === product._id}
                          className="rounded-md border border-red-600 px-3 py-1 text-xs font-medium text-red-400 transition-colors hover:bg-red-900/20 disabled:opacity-50"
                        >
                          {deletingId === product._id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

