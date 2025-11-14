import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SlideshowImage {
  src: string;
  alt: string;
  title?: string;
}

interface ImageSlideshowProps {
  images: SlideshowImage[];
  autoPlay?: boolean;
  autoPlayInterval?: number;
  showDots?: boolean;
  showArrows?: boolean;
  showPlayPause?: boolean;
  pauseOnHover?: boolean;
  className?: string;
}

const ImageSlideshow: React.FC<ImageSlideshowProps> = ({
  images,
  autoPlay = true,
  autoPlayInterval = 4000,
  showDots = true,
  showArrows = true,
  showPlayPause = false,
  pauseOnHover = true,
  className = ''
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<number | null>(null);
  const progressRef = useRef<number | null>(null);

  // Enhanced auto-play functionality with progress tracking
  useEffect(() => {
    const shouldPlay = isPlaying && !(pauseOnHover && isHovered) && images.length > 1;
    
    if (shouldPlay) {
      // Reset progress
      setProgress(0);
      
      // Start progress animation
      const progressInterval = window.setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            return 0;
          }
          return prev + (100 / (autoPlayInterval / 50)); // Update every 50ms
        });
      }, 50);
      
      // Set slide change interval
      const slideInterval = window.setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
        setProgress(0);
      }, autoPlayInterval);

      intervalRef.current = slideInterval;
      progressRef.current = progressInterval;

      return () => {
        if (intervalRef.current) window.clearInterval(intervalRef.current);
        if (progressRef.current) window.clearInterval(progressRef.current);
      };
    } else {
      // Clear intervals when not playing
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      if (progressRef.current) window.clearInterval(progressRef.current);
    }
  }, [isPlaying, isHovered, autoPlayInterval, images.length, pauseOnHover]);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    setProgress(0); // Reset progress when manually changing slides
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
    setProgress(0); // Reset progress when manually changing slides
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setProgress(0); // Reset progress when manually changing slides
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  if (!images || images.length === 0) {
    return null;
  }

  if (images.length === 1) {
    return (
      <div className={`relative ${className}`}>
        <img 
          src={images[0].src} 
          alt={images[0].alt}
          className="w-full h-auto rounded-2xl"
        />
      </div>
    );
  }

  return (
    <div 
      className={`relative ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main image container */}
      <div className="relative overflow-hidden rounded-2xl bg-gray-100">
        <div 
          className="flex transition-transform duration-700 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {images.map((image, index) => (
            <div key={index} className="w-full flex-shrink-0 relative">
              <img 
                src={image.src} 
                alt={image.alt}
                className={`w-full h-auto object-cover transition-opacity duration-300 ${
                  Math.abs(index - currentIndex) <= 1 ? 'opacity-100' : 'opacity-50'
                }`}
                loading={index === 0 ? "eager" : "lazy"}
              />
              {/* Subtle overlay for better text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
            </div>
          ))}
        </div>

        {/* Navigation arrows */}
        {showArrows && images.length > 1 && (
          <>
            <Button
              onClick={prevSlide}
              size="icon"
              variant="secondary"
              className={`absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-md transition-all duration-300 ${
                isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <Button
              onClick={nextSlide}
              size="icon"
              variant="secondary"
              className={`absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-md transition-all duration-300 ${
                isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </>
        )}

        {/* Enhanced Progress bar */}
        {isPlaying && !(pauseOnHover && isHovered) && images.length > 1 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-75 ease-linear rounded-full"
              style={{ 
                width: `${progress}%`
              }}
            />
          </div>
        )}

        {/* Controls */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          {/* Slide counter */}
          {images.length > 1 && (
            <div className="bg-black/60 text-white text-xs px-2 py-1 rounded-full">
              {currentIndex + 1} / {images.length}
            </div>
          )}
          
          {/* Play/Pause Button */}
          {showPlayPause && images.length > 1 && (
            <Button
              onClick={togglePlayPause}
              size="sm"
              variant="secondary"
              className="bg-white/90 hover:bg-white shadow-md"
              title={isPlaying ? "Pause slideshow" : "Play slideshow"}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
          )}
        </div>
      </div>

      {/* Dot indicators */}
      {showDots && images.length > 1 && (
        <div className="flex justify-center mt-6 gap-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`relative w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentIndex 
                  ? 'bg-primary scale-110 shadow-lg' 
                  : 'bg-muted hover:bg-muted-foreground/50'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            >
              {/* Progress ring for current slide */}
              {index === currentIndex && isPlaying && (
                <div className="absolute inset-0 rounded-full border-2 border-primary/30">
                  <div 
                    className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary transition-transform duration-75 ease-linear"
                    style={{
                      transform: `rotate(${(progress / 100) * 360}deg)`
                    }}
                  />
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Image title */}
      {images[currentIndex].title && (
        <div className="absolute bottom-4 left-4 right-4">
          <div className="glass-card px-4 py-2 rounded-lg backdrop-blur-sm">
            <h3 className="text-sm font-medium text-foreground">
              {images[currentIndex].title}
            </h3>
          </div>
        </div>
      )}
    </div>
  );

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          prevSlide();
          break;
        case 'ArrowRight':
          event.preventDefault();
          nextSlide();
          break;
        case ' ': // Spacebar
          event.preventDefault();
          togglePlayPause();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
};

export default ImageSlideshow;