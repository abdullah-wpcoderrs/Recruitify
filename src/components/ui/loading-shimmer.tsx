"use client";

import { cn } from "@/lib/utils";

interface LoadingShimmerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function LoadingShimmer({ className, size = "md" }: LoadingShimmerProps) {
  const sizeClasses = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl",
  };

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className="relative">
        <div
          className={cn(
            "font-bold text-primary-600 animate-shimmer",
            sizeClasses[size]
          )}
        >
          RECRUITIFY
        </div>
      </div>
    </div>
  );
}

interface LoadingContainerProps {
  children?: React.ReactNode;
  className?: string;
}

export function LoadingContainer({ children, className }: LoadingContainerProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 space-y-4", className)}>
      <LoadingShimmer size="lg" />
      {children && (
        <p className="text-sm text-gray-600 animate-pulse">
          {children}
        </p>
      )}
    </div>
  );
}

// Full page loading component
interface PageLoadingProps {
  message?: string;
}

export function PageLoading({ message = "Loading..." }: PageLoadingProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <LoadingShimmer size="lg" />
        <p className="text-sm text-gray-600 mt-4 animate-pulse">{message}</p>
      </div>
    </div>
  );
}