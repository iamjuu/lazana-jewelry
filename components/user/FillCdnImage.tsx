"use client";

import Image, { type StaticImageData } from "next/image";

/** Use next/image only for Cloudinary + local + data URLs; legacy S3/other hosts use <img> (no next.config hostname). */
function isStringAllowedForNextImage(src: string): boolean {
  if (!src) return false;
  if (src.startsWith("/")) return true;
  if (src.startsWith("data:")) return true;
  try {
    return new URL(src).hostname === "res.cloudinary.com";
  } catch {
    return false;
  }
}

type FillCdnImageProps = {
  src: string | StaticImageData;
  alt: string;
  className?: string;
  sizes?: string;
};

export function FillCdnImage({ src, alt, className, sizes }: FillCdnImageProps) {
  if (typeof src === "object") {
    return (
      <Image src={src} alt={alt} fill sizes={sizes} className={className} />
    );
  }
  if (!src) return null;

  if (isStringAllowedForNextImage(src)) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        className={className}
        unoptimized={src.startsWith("http") || src.startsWith("data:")}
      />
    );
  }

  // Legacy non-Cloudinary URLs (e.g. old S3) — plain img avoids adding AWS to next.config
  // eslint-disable-next-line @next/next/no-img-element -- intentional for non-allowlisted hosts
  return <img src={src} alt={alt} className={`absolute inset-0 h-full w-full object-cover ${className ?? ""}`} />;
}
