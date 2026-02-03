"use client";
import React, { useState, useEffect, useRef } from "react";
import Navbar from "@/components/user/Navbar";
import Footer from "@/components/user/Footer";
import Image from "next/image";
import { Plus } from "lucide-react";
import { Bucket1 } from "@/public/assets";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/stores/useCart";
import toast from "react-hot-toast";
// Fonts are now defined in globals.css as font-seasons and font-touvlo

type Product = {
  _id: string;
  name: string;
  price: number;
  discount?: number;
  createdAt: string;
  description?: string;
  shortDescription?: string;
  imageUrl?: string[];
  videoUrl?: string | string[];
  relativeproduct?: boolean;
  category?: string | { _id: string; name: string; slug: string };
  subcategory?:
    | string
    | {
        _id: string;
        name: string;
        slug: string;
        category?: string | { _id: string; name: string; slug: string };
      };
};

type MediaItem = {
  type: "image" | "video";
  url: string;
  index: number;
};
// Magnifier Component
const ImageMagnifier = ({ src, alt }: { src: string; alt: string }) => {
  const [magnifierStyle, setMagnifierStyle] = useState<React.CSSProperties>({});
  const [showMagnifier, setShowMagnifier] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);
  const magnifierRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    setShowMagnifier(true);
    updateMagnifier(e);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    updateMagnifier(e);
  };

  const handleMouseLeave = () => {
    setShowMagnifier(false);
  };

  const updateMagnifier = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imgRef.current) return;

    const rect = imgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const percentX = (x / rect.width) * 100;
    const percentY = (y / rect.height) * 100;

    // Position magnifier relative to viewport to avoid overflow clipping
    const magnifierX = e.clientX;
    const magnifierY = e.clientY;

    setMagnifierStyle({
      display: "block",
      left: `${magnifierX}px`,
      top: `${magnifierY}px`,
      backgroundImage: `url(${src})`,
      backgroundPosition: `${percentX}% ${percentY}%`,
      backgroundSize: "400%",
    });
  };

  return (
    <>
      <div
        ref={imgRef}
        className="relative w-full h-full cursor-zoom-in"
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <Image
          src={src}
          alt={alt}
          fill
          className="object-contain"
          unoptimized
        />
      </div>
      {showMagnifier && (
        <div
          ref={magnifierRef}
          className="fixed pointer-events-none rounded-full shadow-2xl z-50"
          style={{
            ...magnifierStyle,
            width: "200px",
            height: "200px",
            transform: "translate(-50%, -50%)",
            borderRadius: "50%",
            border: "4px solid rgba(255, 255, 255, 0.9)",
            boxShadow:
              "0 0 30px rgba(0, 0, 0, 0.5), inset 0 0 20px rgba(0, 0, 0, 0.1)",
            backgroundRepeat: "no-repeat",
          }}
        />
      )}
    </>
  );
};

const ProductDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  const [selectedMedia, setSelectedMedia] = useState<MediaItem>({
    type: "image",
    url: "",
    index: 0,
  });
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [relativeProduct, setRelativeProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [buyingNow, setBuyingNow] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(),
  );
  const [showFullShortDesc, setShowFullShortDesc] = useState(false);
  const [showFullLongDesc, setShowFullLongDesc] = useState(false);
  const { addItem } = useCart();
  const videoRef = useRef<HTMLVideoElement>(null);

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/products/${productId}`);
      const data = await response.json();
      if (data.success) {
        setProduct(data.data);
      } else {
        router.push("/shop");
      }
    } catch (error) {
      console.error("Failed to fetch product:", error);
      router.push("/shop");
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedProducts = async () => {
    try {
      const response = await fetch("/api/products?limit=4");
      const data = await response.json();
      if (data.success) {
        // Filter out current product
        const filtered = data.data.filter((p: Product) => p._id !== productId);
        setRelatedProducts(filtered.slice(0, 4));
      }
    } catch (error) {
      console.error("Failed to fetch related products:", error);
    }
  };

  const fetchRelativeProduct = async () => {
    try {
      // Fetch products including relative products
      const response = await fetch(
        "/api/products?includeRelative=true&limit=100",
      );
      const data = await response.json();
      if (data.success && data.data) {
        // Look for a relative product that's not the current one
        const relative = data.data.find(
          (p: Product) => p.relativeproduct === true && p._id !== productId,
        );
        if (relative) {
          setRelativeProduct(relative);
        }
      }
    } catch (error) {
      console.error("Failed to fetch relative product:", error);
    }
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  useEffect(() => {
    if (productId) {
      fetchProduct();
      fetchRelatedProducts();
      // Only fetch relative product if current product is not a relative product
      fetchRelativeProduct();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  useEffect(() => {
    // Only show relative product if current product is NOT a relative product
    if (product && product.relativeproduct) {
      setRelativeProduct(null);
    }

    // Set initial selected media when product loads
    if (product) {
      const productImages =
        Array.isArray(product.imageUrl) && product.imageUrl.length > 0
          ? product.imageUrl
          : [];

      if (productImages.length > 0) {
        setSelectedMedia({
          type: "image",
          url: normalizeImageUrl(productImages[0]),
          index: 0,
        });
      }
    }
  }, [product]);

  // Helper function to normalize image URL
  const normalizeImageUrl = (url: string): string => {
    if (!url) return "";
    if (url.startsWith("data:image")) return url;
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `data:image/jpeg;base64,${url}`;
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-[#FDECE2] to-[#FEC1A2] min-h-screen">
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-2xl text-[#1C3163]">Loading product...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="bg-gradient-to-r from-[#FDECE2] to-[#FEC1A2] min-h-screen">
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-2xl text-[#1C3163]">Product not found</p>
        </div>
        <Footer />
      </div>
    );
  }

  // Get product images and videos
  const productImages =
    Array.isArray(product.imageUrl) && product.imageUrl.length > 0
      ? product.imageUrl
      : [];

  const productVideos = product.videoUrl
    ? (Array.isArray(product.videoUrl)
        ? product.videoUrl
        : [product.videoUrl]
      ).filter((v) => v && v.trim())
    : [];

  // Combine images and videos into media items
  const mediaItems: MediaItem[] = [
    ...productImages.map((url, index) => ({
      type: "image" as const,
      url: normalizeImageUrl(url),
      index,
    })),
    ...productVideos.map((url, index) => ({
      type: "video" as const,
      url: url,
      index,
    })),
  ];

  // Format price to show decimals only if needed
  const formatPrice = (price: number) => {
    const rounded = Math.round(price * 100) / 100;
    if (rounded % 1 === 0) {
      return `$${rounded}`;
    }
    return `$${rounded.toFixed(2)}`;
  };
  const hasDiscount = product.discount && product.discount > 0;
  const originalPrice = product.price;
  const discountedPrice =
    hasDiscount && product.discount
      ? product.price - product.discount
      : product.price;
  const priceInDollars = formatPrice(discountedPrice);
  const originalPriceFormatted = formatPrice(originalPrice);

  // Handle Add to Cart
  const handleAddToCart = () => {
    // Check if user is logged in
    const token = sessionStorage.getItem("userToken");
    if (!token) {
      toast.error("Please login to add items to cart");
      router.push("/login");
      return;
    }

    // Get first image URL for cart
    const imageUrl =
      productImages.length > 0 ? normalizeImageUrl(productImages[0]) : "";

    addItem({
      id: product._id,
      name: product.name,
      price: discountedPrice, // Use discounted price
      imageUrl: imageUrl,
    });

    toast.success("Added to cart!");
  };

  // Handle Add Relative Product to Cart
  const handleAddRelativeProductToCart = () => {
    if (!relativeProduct) return;

    // Check if user is logged in
    const token = sessionStorage.getItem("userToken");
    if (!token) {
      toast.error("Please login to add items to cart");
      router.push("/login");
      return;
    }

    // Calculate discounted price if applicable
    const hasRelativeDiscount =
      relativeProduct.discount && relativeProduct.discount > 0;
    const relativeDiscountedPrice =
      hasRelativeDiscount && relativeProduct.discount
        ? relativeProduct.price - relativeProduct.discount
        : relativeProduct.price;

    // Get first image URL for cart
    const imageUrl =
      relativeProduct.imageUrl && relativeProduct.imageUrl.length > 0
        ? normalizeImageUrl(relativeProduct.imageUrl[0])
        : "";

    addItem({
      id: relativeProduct._id,
      name: relativeProduct.name,
      price: relativeDiscountedPrice, // Use discounted price
      imageUrl: imageUrl,
    });

    toast.success("Added to cart!");
  };

  // Handle Add Related Product to Cart
  const handleAddRelatedProductToCart = (item: Product) => {
    // Check if user is logged in
    const token = sessionStorage.getItem("userToken");
    if (!token) {
      toast.error("Please login to add items to cart");
      router.push("/login");
      return;
    }

    // Calculate discounted price if discount exists
    const itemDiscountedPrice =
      item.discount && item.discount > 0
        ? item.price - item.discount
        : item.price;

    // Get first image URL for cart
    const itemImageUrl =
      item.imageUrl && item.imageUrl.length > 0
        ? normalizeImageUrl(item.imageUrl[0])
        : "";

    addItem({
      id: item._id,
      name: item.name,
      price: itemDiscountedPrice,
      imageUrl: itemImageUrl,
    });

    toast.success("Added to cart!");
  };

  // Handle Instant Buy - redirect to order confirmation
  const handleBuyNow = async () => {
    // Check if user is logged in
    const token = sessionStorage.getItem("userToken");
    if (!token) {
      toast.error("Please login to proceed with purchase");
      router.push("/login");
      return;
    }

    // Redirect to order confirmation with instant buy params
    router.push(
      `/order-confirmation?type=instant&productId=${product._id}&quantity=1`,
    );
  };

  return (
    <div className=" bg-gradient-to-r from-[#FDECE2] to-[#FEC1A2] min-h-screen]">
      <Navbar />

      {/* Breadcrumb */}
      <div className="max-w-6xl mx-auto px-4 mt-[25px]">
        <nav className="flex items-center space-x-2 text-sm sm:text-base text-[#6B5D4F]">
          <Link
            href="/"
            className="font-seasons hover:text-[#D5B584] transition-colors text-[#1c3163]"
            style={{ fontWeight: 700, textShadow: "0.5px 0 0 currentColor" }}
          >
            <span
              className="font-seasons text-[#1c3163] text-[16px]"
              style={{ fontWeight: 700, textShadow: "0.5px 0 0 currentColor" }}
            >
              Home
            </span>
          </Link>
          {product.category &&
          typeof product.category === "object" &&
          product.category.name ? (
            <>
              <span style={{ fontWeight: 700, color: "#1c3163" }}>/</span>
              <Link
                href={`/shop?category=${product.category.slug}`}
                className="font-seasons hover:text-[#D5B584] text-[#1c3163] transition-colors text-[16px]"
                style={{
                  fontWeight: 700,
                  textShadow: "0.5px 0 0 currentColor",
                }}
              >
                {product.category.name}
              </Link>
              {product.subcategory &&
                typeof product.subcategory === "object" &&
                product.subcategory.name && (
                  <>
                    <span style={{ fontWeight: 700, color: "#1c3163" }}>/</span>
                    <span
                      className="font-seasons text-[#1c3163] text-[16px]"
                      style={{
                        fontWeight: 700,
                        textShadow: "0.5px 0 0 currentColor",
                      }}
                    >
                      {product.subcategory.name}
                    </span>
                  </>
                )}
            </>
          ) : (
            <>
              <span style={{ fontWeight: 700, color: "#1c3163" }}>/</span>
              <span
                className="font-seasons text-[#1c3163] text-[16px]"
                style={{
                  fontWeight: 700,
                  textShadow: "0.5px 0 0 currentColor",
                }}
              >
                All Products
              </span>
            </>
          )}
        </nav>
      </div>

      <section className="w-full mt-[25px]">
        <div className="max-w-6xl mx-auto px-4">
          {/* Product Detail Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 lg:items-start">
            {/* Left Side - Images and Videos */}
            <div className="flex flex-row gap-4">
              {/* Thumbnail Images and Videos */}
              {mediaItems.length > 1 && (
                <div
                  className="flex sm:flex-col gap-3 overflow-x-auto sm:overflow-visible"
                  style={{ marginTop: "40px" }}
                >
                  {mediaItems.map((media, index) => (
                    <button
                      key={`${media.type}-${index}`}
                      onClick={() => setSelectedMedia(media)}
                      className={`relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                        selectedMedia.type === media.type &&
                        selectedMedia.index === media.index
                          ? "border-[#1C3163]"
                          : "border-transparent opacity-60 hover:opacity-100"
                      }`}
                    >
                      {media.type === "image" ? (
                        <Image
                          src={media.url}
                          alt={`Product view ${index + 1}`}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="relative w-full h-full bg-black">
                          <video
                            src={media.url}
                            className="w-full h-full object-cover"
                            muted
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <svg
                              className="w-8 h-8 text-white"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Main Display Area - Fixed Height */}
              <div className="relative w-full h-[400px] sm:h-[450px] md:h-[500px] rounded-lg overflow-hidden ">
                {selectedMedia.type === "image" ? (
                  selectedMedia.url ? (
                    <ImageMagnifier
                      src={selectedMedia.url}
                      alt={product.name}
                    />
                  ) : (
                    <Image
                      src={Bucket1}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  )
                ) : (
                  <video
                    ref={videoRef}
                    src={selectedMedia.url}
                    controls
                    autoPlay
                    className="w-full h-full object-contain"
                  />
                )}
              </div>
            </div>

            {/* Right Side - Product Info */}
            <div className="flex flex-col">
              <h1
                className="font-seasons text-[#1C3163] text-[28px] sm:text-[32px] md:text-[30px] lg:text-[32px] font-normal leading-none"
                style={{ textShadow: "0.5px 0 0 currentColor" }}
              >
                {product.name}
              </h1>

              <div className="">
                {hasDiscount ? (
                  <div className="flex items-center gap-3">
                    <p
                      className="font-seasons text-gray-500 text-[24px] sm:text-[16px] md:text-[24px] lg:text-[24px] line-through font-medium"
                      style={{ textShadow: "0.5px 0 0 currentColor" }}
                    >
                      {originalPriceFormatted}
                    </p>
                    <p
                      className="font-seasons text-[#1C3163] text-[12px] sm:text-[16px] lg:text-[24px] font-medium"
                      style={{ textShadow: "0.5px 0 0 currentColor" }}
                    >
                      {priceInDollars} USD
                    </p>
                  </div>
                ) : (
                  <p
                    className="font-seasons text-[#1C3163] text-[12px] sm:text-[16px] lg:text-[24px] font-medium"
                    style={{ textShadow: "0.5px 0 0 currentColor" }}
                  >
                    {priceInDollars} USD
                  </p>
                )}
              </div>

              {/* Short Description - Show after price */}
              {product.shortDescription && (
                <div className="mt-[25px]">
                  <p
                    className={`font-touvlo text-[#545454] md:text-[16px] sm:text-[15px] leading-relaxed ${!showFullShortDesc ? "line-clamp-4" : ""}`}
                  >
                    {product.shortDescription}
                  </p>
                  {product.shortDescription.length > 200 && (
                    <button
                      onClick={() => setShowFullShortDesc(!showFullShortDesc)}
                      className="text-[#1C3163] md:text-[16px] sm:text-[15px] font-semibold mt-2 hover:text-[#D5B584] transition-colors font-touvlo"
                    >
                      {showFullShortDesc ? "Read Less" : "Read More"}
                    </button>
                  )}
                </div>
              )}

              {/* Add to Cart Button */}
              <button
                onClick={handleAddToCart}
                className="w-full bg-[#2C3E50] hover:bg-[#1C3163] text-white py-4 rounded-lg  transition-colors text-[16px] font-medium mt-[25px] font-touvlo"
              >
                Add to Cart
              </button>

              {/* Buy Now with Stripe Button */}
              <button
                onClick={handleBuyNow}
                disabled={buyingNow}
                className="w-full bg-[#FFC439] font-touvlo hover:bg-[#F0B429] text-[#1C3163] py-4 rounded-lg mb-[25px] transition-colors text-[16px] font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-[25px]"
              >
                {buyingNow ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#1C3163]"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <span>Buy Now with</span>
                    <span className="font-bold">Stripe</span>
                  </>
                )}
              </button>

              {/* Secure Payment Badge */}
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600 mb-[25px] ">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Secure payment powered by Stripe</span>
              </div>

              {/* Relative Product - Show after cart button if current product is NOT a relative product */}
              {relativeProduct && !product.relativeproduct && (
                <>
                  {/* <h1 className="text-[#1C3163] text-[14px] sm:text-[18px] lg:text-[20px] font-medium mb-4">
                Learn how to play the crystal bowls
                </h1> */}

                  <h1
                    className="font-seasons text-[#1C3163] text-[14px] sm:text-[18px] lg:text-[18px] font-medium mb-[25px] "
                    style={{ textShadow: "0.5px 0 0 currentColor" }}
                  >
                    Learn how to play the crystal bowls
                  </h1>
                  <Link href={`/shop/${relativeProduct._id}`}>
                    <div className="mb-8 border border-[#D5B584]/30 rounded-lg p-4 bg-white">
                      <div className="flex items-center gap-4">
                        {relativeProduct.imageUrl &&
                          relativeProduct.imageUrl.length > 0 && (
                            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden flex-shrink-0">
                              <Image
                                src={normalizeImageUrl(
                                  relativeProduct.imageUrl[0],
                                )}
                                alt={relativeProduct.name}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            </div>
                          )}
                        <div className="flex-1">
                          <h4
                            className="font-touvlo text-[#D5B584] text-[16px] font-medium mb-1"
                            style={{ textShadow: "0.5px 0 0 currentColor" }}
                          >
                            {relativeProduct.name}
                          </h4>
                          <p
                            className="font-touvlo text-[#D5B584] text-[14px]"
                            style={{ textShadow: "0.5px 0 0 currentColor" }}
                          >
                            {formatPrice(relativeProduct.price)} USD
                          </p>
                        </div>
                        <button
                          onClick={handleAddRelativeProductToCart}
                          className="bg-[#D5B584] hover:bg-[#C4A573] text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shrink-0 font-touvlo"
                        >
                          + Add
                        </button>
                      </div>
                    </div>
                  </Link>
                </>
              )}

              {/* Description Section - Accordion Style */}
              {product.description && (
                <div className=" border-t border-b border-[#D5B584]/30">
                  <button
                    onClick={() => toggleSection("description")}
                    className="w-full py-4 flex items-center justify-between text-left"
                  >
                    <h3 className="font-seasons text-[#1C3163] md:text-[18px] sm:text-[20px] font-medium">
                      Description
                    </h3>
                    <span className="text-[#1C3163] text-2xl">
                      {expandedSections.has("description") ? "−" : "+"}
                    </span>
                  </button>
                  {expandedSections.has("description") && (
                    <div className="pb-4">
                      <p
                        className={`text-[#545454] md:text-[16px] sm:text-[15px] font-touvlo leading-relaxed whitespace-pre-wrap ${!showFullLongDesc ? "line-clamp-2" : ""}`}
                      >
                        {product.description}
                      </p>
                      {product.description.length > 150 && (
                        <button
                          onClick={() => setShowFullLongDesc(!showFullLongDesc)}
                          className="text-[#1C3163] md:text-[16px] sm:text-[14px] font-semibold mt-2 hover:text-[#D5B584] transition-colors"
                        >
                          {showFullLongDesc ? "Read Less" : "Read More"}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Additional Information Sections - Accordion Style */}
              <div className="space-y-0 ">
                {/* Bowl Sizing */}
                <div className="border-t border-[#D5B584]/30">
                  <button
                    onClick={() => toggleSection("bowlSizing")}
                    className="w-full py-4 flex items-center justify-between text-left"
                  >
                    <h3 className="text-[#1C3163] md:text-[18px] sm:text-[20px] font-medium font-seasons">
                      Bowl Sizing
                    </h3>
                    <span className="text-[#1C3163] text-2xl">
                      {expandedSections.has("bowlSizing") ? "−" : "+"}
                    </span>
                  </button>
                  {expandedSections.has("bowlSizing") && (
                    <div className="pb-4">
                      <p className="text-[#545454] md:text-[16px] sm:text-[15px] leading-relaxed font-touvlo">
                        Our crystal bowls come in various sizes to suit
                        different healing practices. We offer bowls ranging from
                        small (4-6 inches) for personal use to large (12-14
                        inches) for group sessions. Each size is carefully
                        crafted to produce specific frequencies and resonances.
                        The size you choose depends on your intended use -
                        smaller bowls are perfect for individual meditation and
                        chakra work, while larger bowls create powerful sound
                        waves ideal for group healing sessions.
                      </p>
                    </div>
                  )}
                </div>

                {/* Shipping and Delivery */}
                <div className="border-t border-[#D5B584]/30">
                  <button
                    onClick={() => toggleSection("shipping")}
                    className="w-full py-4 flex items-center justify-between text-left"
                  >
                    <h3 className="text-[#1C3163] md:text-[18px] sm:text-[20px] font-medium font-seasons ">
                      Shipping and Delivery
                    </h3>
                    <span className="text-[#1C3163] text-2xl">
                      {expandedSections.has("shipping") ? "−" : "+"}
                    </span>
                  </button>
                  {expandedSections.has("shipping") && (
                    <div className="pb-4">
                      <p className="text-[#545454] md:text-[16px] sm:text-[15px] leading-relaxed font-touvlo mb-3">
                        We offer Air Express shipping to ensure your crystal
                        bowls arrive safely and promptly. Shipping charges are
                        calculated based on the total number of bowls in your
                        order:
                      </p>
                      <ul className="list-disc list-inside text-[#545454] md:text-[16px] sm:text-[15px] space-y-2 ml-2 font-touvlo">
                        <li>1 Bowl: SGD $65</li>
                        <li>2-3 Bowls: SGD $111</li>
                        <li>4-7 Bowls: SGD $155</li>
                        <li>
                          8+ Bowls: Rates continue in cycles (8 = $65, 9-10 =
                          $111, 11-14 = $155, and so on)
                        </li>
                      </ul>
                      <p className="text-[#545454] md:text-[16px] sm:text-[15px] leading-relaxed font-touvlo mt-3">
                        All orders are carefully packaged to protect your bowls
                        during transit. Delivery times vary by location,
                        typically 7-14 business days for international orders.
                      </p>

                      {/* Additional Information */}
                      <div className="mt-6 space-y-4 pt-4 border-t border-[#D5B584]/30">
                        <div>
                          <h4 className="text-[#545454] font-semibold md:text-[16px] sm:text-[15px] mb-1 font-touvlo">
                            Return Policy
                          </h4>
                          <p className="text-[#545454] md:text-[16px] sm:text-[14px] font-touvlo">
                            No Returns unless it&apos;s broken
                          </p>
                        </div>
                        <div>
                          <h4 className="text-[#545454] font-semibold md:text-[16px] sm:text-[15px] mb-1 font-touvlo">
                            Care Instructions
                          </h4>
                          <p className="text-[#545454] md:text-[16px] sm:text-[14px] font-touvlo">
                            Wipe with soft cloth, avoid water contact
                          </p>
                        </div>
                        <div>
                          <h4 className="text-[#545454] font-semibold md:text-[16px] sm:text-[15px] mb-1 font-touvlo">
                            Includes Accessories
                          </h4>
                          <p className="text-[#545454] md:text-[16px] sm:text-[14px] font-touvlo">
                            Rubber ring + suede mallet
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3rd vs 4th Octave */}
                <div className="border-t border-[#D5B584]/30">
                  <button
                    onClick={() => toggleSection("octave")}
                    className="w-full py-4 flex items-center justify-between text-left"
                  >
                    <h3 className="text-[#1C3163] md:text-[18px] sm:text-[20px] font-medium font-seasons">
                      What's the difference between 3rd and 4th Octave bowls?
                    </h3>
                    <span className="text-[#1C3163] text-2xl">
                      {expandedSections.has("octave") ? "−" : "+"}
                    </span>
                  </button>
                  {expandedSections.has("octave") && (
                    <div className="pb-4">
                      <p className="text-[#545454] md:text-[16px] sm:text-[15px] leading-relaxed font-touvlo">
                        The 3rd octave bowls produce deeper, more grounding
                        frequencies that are ideal for root chakra work and deep
                        meditation. These bowls create a rich, resonant sound
                        that helps anchor you to the earth and promotes feelings
                        of stability and security. The 4th octave bowls have
                        higher, more ethereal frequencies that are perfect for
                        crown chakra activation and spiritual connection. These
                        bowls produce lighter, more uplifting tones that can
                        help elevate consciousness and facilitate connection
                        with higher realms. Each octave offers unique healing
                        properties, and many practitioners use both in their
                        healing sessions for a complete chakra balancing
                        experience.
                      </p>
                    </div>
                  )}
                </div>

                {/* Tuning System */}
                <div className="border-t border-[#D5B584]/30">
                  <button
                    onClick={() => toggleSection("tuning")}
                    className="w-full py-4 flex items-center justify-between text-left"
                  >
                    <h3 className="text-[#1C3163] md:text-[18px] sm:text-[20px] font-medium font-seasons">
                      Which tuning system are Our Bowls made in?
                    </h3>
                    <span className="text-[#1C3163] text-2xl">
                      {expandedSections.has("tuning") ? "−" : "+"}
                    </span>
                  </button>
                  {expandedSections.has("tuning") && (
                    <div className="">
                      <p className="text-[#545454] md:text-[16px] sm:text-[15px] leading-relaxed mb-3 font-touvlo">
                        Our bowls are available in multiple tuning frequencies
                        to suit your preferences:
                      </p>
                      <ul className="list-disc list-inside  md:text-[16px] sm:text-[15px] space-y-2 ml-2 font-touvlo text-[#545454]">
                        <li>
                          <strong>432 Hz:</strong> The healing frequency of
                          nature, known for its calming and harmonizing effects.
                          This is our standard tuning and is believed to
                          resonate with the natural frequency of the universe.
                        </li>
                        <li>
                          <strong>440 Hz:</strong> Western standard tuning,
                          commonly used in modern music. This frequency is
                          familiar to most ears and works well for general sound
                          healing.
                        </li>
                        <li>
                          <strong>528 Hz:</strong> The miracle frequency of
                          unconditional love, known for its transformative and
                          healing properties. This frequency is said to repair
                          DNA and promote positive transformation.
                        </li>
                      </ul>
                      <p className="text-[#545454] md:text-[16px] sm:text-[15px] leading-relaxed mt-3 font-touvlo">
                        If you would like your bowls in an alternative
                        frequency, please leave a note on your order at checkout
                        and we can customize your order to your preferred
                        frequency.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Related Products Section - Only show if current product is NOT a relative product */}
          {!product.relativeproduct && (
            <div className="">
              <h2 className="text-[#D5B584] text-[28px] sm:text-[30px] lg:text-[32px] font-normal font-seasons mb-[25px]">
                Related Products
              </h2>

              {relatedProducts.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                  {relatedProducts.map((item) => {
                    const itemImageUrl =
                      item.imageUrl && item.imageUrl.length > 0
                        ? normalizeImageUrl(item.imageUrl[0])
                        : null;

                    // Check if item has discount
                    const itemHasDiscount = item.discount && item.discount > 0;
                    const itemOriginalPrice = item.price;
                    const itemDiscountedPrice =
                      itemHasDiscount && item.discount
                        ? item.price - item.discount
                        : item.price;
                    const itemDisplayPrice = formatPrice(itemDiscountedPrice);
                    const itemDisplayOriginalPrice =
                      formatPrice(itemOriginalPrice);

                    return (
                      <div key={item._id} className="group">
                        <div className="relative w-full aspect-square rounded-lg overflow-hidden  mb-4">
                          {itemImageUrl ? (
                            <Link
                              href={`/shop/${item._id}`}
                              className="block w-full h-full"
                            >
                              <Image
                                src={itemImageUrl}
                                alt={item.name}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                                unoptimized
                              />
                            </Link>
                          ) : (
                            <Link
                              href={`/shop/${item._id}`}
                              className="block w-full h-full"
                            >
                              <Image
                                src={Bucket1}
                                alt={item.name}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            </Link>
                          )}
                        </div>
                        <Link
                          href={`/shop/${item._id}`}
                          className="block cursor-pointer"
                        >
                          <div>
                            <p className="text-[#1C3163] md:text-[16px] sm:text-[16px] font-medium font-touvlo ">
                              {item.name}
                            </p>
                            <div className="flex items-center gap-2 font-touvlo">
                              {itemHasDiscount ? (
                                <>
                                  <span className="text-[#545454] font-light line-through text-[14px]">
                                    {itemDisplayOriginalPrice}
                                  </span>
                                  <span className="text-[#545454] font-light text-[14px] whitespace-nowrap">
                                    {itemDisplayPrice} USD
                                  </span>
                                </>
                              ) : (
                                <span className="text-[#545454] font-light text-[14px] whitespace-nowrap">
                                  {itemDisplayPrice} USD
                                </span>
                              )}
                              {/* <button 
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleAddRelatedProductToCart(item);
                              }}
                              className="w-8 h-8 rounded-full border-2 border-[#1C3163] flex items-center justify-center hover:bg-[#1C3163] hover:text-white transition-colors"
                            >
                              <Plus size={16} />
                            </button> */}
                            </div>
                          </div>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[#1C3163] text-center py-8">
                  No related products available
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ProductDetailPage;
