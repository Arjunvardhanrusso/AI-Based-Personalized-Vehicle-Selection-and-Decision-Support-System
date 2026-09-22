import React, { useState, useEffect, useMemo, useRef } from 'react';


export interface VehicleImageProps {
  src?: string | null;
  vehicleId?: string;
  brand?: string;
  model?: string;
  variant?: string;
  bodyType?: string;
  alt: string;
  className?: string;
  imageClassName?: string;
  aspectRatio?: 'video' | 'wide' | 'card' | 'auto';
  showAttribution?: boolean;
  attributionText?: string;
  source?: string;
}

const BODY_TYPE_FALLBACK_MAP: Record<string, string> = {
  suv: '/images/fallbacks/suv.svg',
  'compact suv': '/images/fallbacks/suv.svg',
  'mid-size suv': '/images/fallbacks/suv.svg',
  'full-size suv': '/images/fallbacks/suv.svg',
  crossover: '/images/fallbacks/suv.svg',
  sedan: '/images/fallbacks/sedan.svg',
  'compact sedan': '/images/fallbacks/sedan.svg',
  'executive sedan': '/images/fallbacks/sedan.svg',
  'luxury sedan': '/images/fallbacks/luxury.svg',
  hatchback: '/images/fallbacks/hatchback.svg',
  'premium hatchback': '/images/fallbacks/hatchback.svg',
  mpv: '/images/fallbacks/mpv.svg',
  coupe: '/images/fallbacks/coupe.svg',
  convertible: '/images/fallbacks/convertible.svg',
  'sports car': '/images/fallbacks/sports-car.svg',
  supercar: '/images/fallbacks/supercar.svg',
  hypercar: '/images/fallbacks/supercar.svg',
  luxury: '/images/fallbacks/luxury.svg',
  pickup: '/images/fallbacks/pickup.svg',
  offroad: '/images/fallbacks/offroad.svg',
  '4x4': '/images/fallbacks/offroad.svg',
};

const DEFAULT_FALLBACK_SRC = '/images/fallbacks/default-car.svg';

const isExternalRealPhoto = (url?: string | null): boolean => {
  if (!url || typeof url !== 'string') return false;
  const clean = url.trim().toLowerCase();
  if (clean.includes('car-placeholder') || clean.includes('placehold.co')) return false;
  
  if (clean.startsWith('/assets/')) {
    return !clean.endsWith('.svg');
  }
  
  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    return !clean.endsWith('.svg');
  }
  return false;
};

export const VehicleImage: React.FC<VehicleImageProps> = ({
  src,
  vehicleId,
  brand,
  model,
  variant,
  bodyType,
  alt,
  className = '',
  imageClassName = '',
  aspectRatio = 'auto',
  showAttribution = false,
  attributionText,
  source,
}) => {
  // Determine appropriate fallback based on body type
  const bodyFallback = useMemo(() => {
    if (!bodyType) return DEFAULT_FALLBACK_SRC;
    const clean = bodyType.toLowerCase().trim();
    return BODY_TYPE_FALLBACK_MAP[clean] || DEFAULT_FALLBACK_SRC;
  }, [bodyType]);

  const [currentSrc, setCurrentSrc] = useState<string>(() => {
    if (isExternalRealPhoto(src)) {
      return src!;
    }
    return bodyFallback;
  });

  const [stage, setStage] = useState<'external' | 'body_fallback' | 'generic_fallback'>(() => {
    return isExternalRealPhoto(src) ? 'external' : 'body_fallback';
  });

  const [resolvedAttribution, setResolvedAttribution] = useState<string | undefined>(attributionText);
  const [resolvedSource, setResolvedSource] = useState<string | undefined>(source);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const isMountedRef = useRef<boolean>(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Synchronize and resolve image when props change
  useEffect(() => {
    // We now rely purely on the backend to provide the correct pre-resolved src.
    if (src) {
      setCurrentSrc(src);
      setStage(isExternalRealPhoto(src) ? 'external' : 'body_fallback');
      setIsLoading(true);
      setHasError(false);
    } else {
      setCurrentSrc(bodyFallback);
      setStage('body_fallback');
      setIsLoading(false);
    }
  }, [src, bodyFallback]);

  const handleError = () => {
    if (stage === 'external') {
      // External image failed in browser -> step down to body-type vector fallback
      setStage('body_fallback');
      setCurrentSrc(bodyFallback);
      setIsLoading(false);
    } else if (stage === 'body_fallback') {
      // Body fallback failed -> step down to generic vector fallback
      setStage('generic_fallback');
      setCurrentSrc(DEFAULT_FALLBACK_SRC);
      setIsLoading(false);
    } else {
      // All options exhausted
      setIsLoading(false);
      setHasError(true);
    }
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  const aspectClass =
    aspectRatio === 'video'
      ? 'aspect-video'
      : aspectRatio === 'wide'
      ? 'aspect-[16/10]'
      : aspectRatio === 'card'
      ? 'h-44 w-full'
      : 'w-full h-full';

  const displayAttribution = resolvedAttribution || (resolvedSource === 'carapi' ? 'CarAPI / Wikimedia Commons' : resolvedSource);

  return (
    <div
      data-vehicle-id={vehicleId}
      data-image-stage={stage}
      data-image-error={hasError ? 'true' : undefined}
      className={`relative flex items-center justify-center overflow-hidden select-none bg-viq-surface-container ${aspectClass} ${className}`}
    >
      {/* Loading Skeleton / Shimmer */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 z-0 bg-gradient-to-r from-viq-surface-container via-viq-surface-container-high to-viq-surface-container animate-pulse flex items-center justify-center">
          <div className="w-10 h-10 rounded-full border-2 border-viq-outline/20 border-t-viq-primary animate-spin opacity-40" />
        </div>
      )}

      {/* Car Image with smooth load fade or Error Fallback */}
      {hasError ? (
        <div className={`flex items-center justify-center w-full h-full bg-viq-surface-container border border-viq-outline-variant/30 text-viq-on-surface-variant font-mono text-xs ${imageClassName}`}>
          <div className="flex flex-col items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path>
              <path d="m2 2 20 20"></path>
            </svg>
            <span>Vehicle image unavailable</span>
          </div>
        </div>
      ) : (
        <img
          src={currentSrc}
          alt={alt || [brand, model, variant].filter(Boolean).join(' ') || 'Vehicle Photograph'}
          loading="lazy"
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          className={`max-h-full max-w-full object-contain transition-all duration-300 ${
            isLoading ? 'opacity-0 scale-98' : 'opacity-100 scale-100'
          } ${imageClassName}`}
        />
      )}

      {/* Subtle Attribution Pill for Wikimedia / CarAPI */}
      {(showAttribution || stage === 'external') && !isLoading && displayAttribution && (
        <div
          title={displayAttribution}
          className="absolute bottom-1.5 right-1.5 max-w-[85%] px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm border border-white/10 text-[9px] font-mono text-[#A3A3A3] truncate pointer-events-none z-10"
        >
          {displayAttribution}
        </div>
      )}
    </div>
  );
};

export default VehicleImage;
