import React from 'react';

export const SkeletonCard: React.FC = () => {
  return (
    <div className="flex flex-col bg-viq-surface-container-low rounded-xl overflow-hidden shadow-lg border border-viq-outline-variant/20 animate-pulse">
      {/* Image Skeleton */}
      <div className="relative h-48 w-full bg-viq-surface-container/60">
        <div className="absolute top-2.5 left-2.5 h-6 w-28 rounded-md bg-viq-surface-container-high" />
        <div className="absolute top-2.5 right-2.5 h-6 w-24 rounded-md bg-viq-surface-container-high" />
        <div className="absolute bottom-2.5 left-2.5 h-5 w-16 rounded bg-viq-surface-container-high" />
      </div>

      {/* Body Skeleton */}
      <div className="p-4 flex flex-col gap-3 flex-grow">
        <div className="flex justify-between items-start">
          <div className="space-y-1.5 flex-1">
            <div className="h-3 w-20 rounded bg-viq-surface-container-high" />
            <div className="h-5 w-48 rounded bg-viq-surface-container-highest" />
            <div className="h-3 w-32 rounded bg-viq-surface-container-high" />
          </div>
          <div className="flex flex-col items-end space-y-1">
            <div className="h-2.5 w-16 rounded bg-viq-surface-container-high" />
            <div className="h-4 w-20 rounded bg-viq-surface-container-highest" />
          </div>
        </div>

        {/* 3-Col Spec Matrix Skeleton */}
        <div className="grid grid-cols-3 gap-1.5 bg-viq-surface-container/50 rounded-lg p-2 border border-viq-outline-variant/20">
          <div className="h-8 rounded bg-viq-surface-container-high" />
          <div className="h-8 rounded bg-viq-surface-container-high" />
          <div className="h-8 rounded bg-viq-surface-container-high" />
        </div>

        {/* Rationale Bullet Skeleton */}
        <div className="space-y-2 mt-1">
          <div className="h-3.5 w-5/6 rounded bg-viq-surface-container-high" />
          <div className="h-3.5 w-4/6 rounded bg-viq-surface-container-high" />
        </div>

        {/* Action Button Skeleton */}
        <div className="flex items-center gap-2 mt-auto pt-2 border-t border-viq-outline-variant/20">
          <div className="h-9 flex-1 rounded-lg bg-viq-surface-container-highest" />
          <div className="h-9 w-9 rounded-lg bg-viq-surface-container-high" />
        </div>
      </div>
    </div>
  );
};

export default SkeletonCard;
