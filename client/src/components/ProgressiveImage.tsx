import React, { useState, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';

interface ProgressiveImageProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  placeholderColor?: string;
  threshold?: number;
  rootMargin?: string;
}

const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
  src,
  alt,
  className = '',
  style = {},
  placeholderColor = '#f3f4f6',
  threshold = 0.1, // How much of the element needs to be visible
  rootMargin = '200px 0px' // Load images 200px before they come into view
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  
  // Use intersection observer to detect when the component is in view
  const { ref, inView } = useInView({
    threshold,
    rootMargin,
    triggerOnce: true // Only trigger once
  });
  
  // Load the image when it comes into view with better error handling
  useEffect(() => {
    if (inView && !imageSrc && src) {
      // Validate URL before setting
      if (src.startsWith('http') || src.startsWith('data:')) {
        setImageSrc(src);
      } else {
        setError(true);
      }
    }
  }, [inView, src, imageSrc]);
  
  // Reset state when src changes
  useEffect(() => {
    setIsLoaded(false);
    setError(false);
    setImageSrc(null);
  }, [src]);

  return (
    <div 
      ref={ref}
      className="relative w-full h-full overflow-hidden" 
      style={{ backgroundColor: placeholderColor }}
    >
      {/* Placeholder that shows until image loads */}
      {(!isLoaded || !inView) && !error && (
        <div className="absolute inset-0 bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse" />
      )}
      
      {/* Actual image that fades in when loaded */}
      {imageSrc && (
        <img
          src={imageSrc}
          alt={alt}
          className={`w-full h-full transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'} ${className}`}
          style={style}
          decoding="async"
          onLoad={() => setIsLoaded(true)}
          onError={() => setError(true)}
        />
      )}
      
      {/* Error state */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-gray-400 text-sm flex flex-col items-center">
            <svg className="w-8 h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>Failed to load</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressiveImage;