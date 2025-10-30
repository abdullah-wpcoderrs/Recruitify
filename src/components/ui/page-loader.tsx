"use client";

import { LoadingShimmer } from "./loading-shimmer";

interface PageLoaderProps {
  message?: string;
}

export function PageLoader({ message = "Loading..." }: PageLoaderProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <LoadingShimmer size="lg" />
        <p className="text-sm text-gray-600 mt-4">{message}</p>
      </div>
    </div>
  );
}

interface SectionLoaderProps {
  message?: string;
  className?: string;
}

export function SectionLoader({ message = "Loading...", className }: SectionLoaderProps) {
  return (
    <div className={className || "flex items-center justify-center py-12"}>
      <div className="text-center">
        <LoadingShimmer size="md" />
        {message && <p className="text-sm text-gray-600 mt-4">{message}</p>}
      </div>
    </div>
  );
}
