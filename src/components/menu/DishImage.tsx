"use client";
import { useState } from "react";
import Image from "next/image";

interface DishImageProps {
  src: string | null;
  alt: string;
  className?: string;
}

export function DishImage({ src, alt, className = "" }: DishImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-zinc-800">
        <span className="text-5xl opacity-40">🍽️</span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* Skeleton while loading */}
      {!loaded && (
        <div className="absolute inset-0 skeleton" />
      )}
      <Image
        src={src}
        alt={alt}
        fill
        className={`object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"} ${className}`}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
      />
    </div>
  );
}
