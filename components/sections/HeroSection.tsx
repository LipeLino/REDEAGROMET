"use client";

import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";

const slides = [
  {
    id: 1,
    url: "https://images.unsplash.com/photo-1560493676-04071c5f467b?auto=format&fit=crop&q=80",
    alt: "Agricultural field with modern irrigation system"
  },
  {
    id: 2,
    url: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&q=80",
    alt: "Weather monitoring station in field"
  },
  {
    id: 3,
    url: "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&q=80",
    alt: "Agricultural technology and data monitoring"
  }
];

const SLIDE_INTERVAL = 3000; // 3 seconds
const TRANSITION_DURATION = 750; // 750ms

export function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const autoPlayRef = useRef<NodeJS.Timeout>();
  const transitionTimeoutRef = useRef<NodeJS.Timeout>();

  const handleSlideChange = useCallback((newIndex: number) => {
    if (!isTransitioning) {
      setIsTransitioning(true);
      setCurrentSlide(newIndex);
      
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
      
      transitionTimeoutRef.current = setTimeout(() => {
        setIsTransitioning(false);
      }, TRANSITION_DURATION);
    }
  }, [isTransitioning]);

  const nextSlide = useCallback(() => {
    handleSlideChange((currentSlide + 1) % slides.length);
  }, [currentSlide, handleSlideChange]);

  const prevSlide = useCallback(() => {
    handleSlideChange((currentSlide - 1 + slides.length) % slides.length);
  }, [currentSlide, handleSlideChange]);

  const goToSlide = useCallback((index: number) => {
    handleSlideChange(index);
  }, [handleSlideChange]);

  // Auto-play management
  useEffect(() => {
    if (!isPaused) {
      autoPlayRef.current = setInterval(nextSlide, SLIDE_INTERVAL);
    }

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [isPaused, nextSlide]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, []);

  return (
    <div className="relative min-h-[400px] md:min-h-[500px] lg:min-h-[600px] bg-gradient-to-r from-[#003366] to-[#004080] text-white">
      <div className="absolute inset-0 bg-black/40 z-10" />
      
      <div className="container mx-auto min-h-[400px] md:min-h-[500px] lg:min-h-[600px] flex flex-col lg:flex-row items-center relative z-20 px-4 py-12 lg:py-0">
        {/* Content Section */}
        <div className="w-full lg:w-[70%] lg:pr-8 mb-8 lg:mb-0 text-center lg:text-left">
          <h1 className="hero-title text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 lg:mb-8 leading-[1.2] py-2 shine-text">
            Informações Agrometeorológicas do Triângulo Mineiro Sul
          </h1>
          <p className="text-base sm:text-lg lg:text-xl xl:text-2xl text-gray-100 max-w-2xl mx-auto lg:mx-0">
            Monitoramento em tempo real das condições climáticas para otimização da produção agrícola
          </p>
        </div>

        {/* Slideshow Section */}
        <div className="w-full lg:w-[40%] flex justify-center items-center">
          <div 
            className="w-[280px] h-[280px] sm:w-[350px] sm:h-[350px] md:w-[400px] md:h-[400px] lg:w-[550px] lg:h-[450px] relative overflow-hidden rounded-lg shadow-xl"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {slides.map((slide, index) => (
              <div
                key={slide.id}
                className={cn(
                  "absolute inset-0 transition-all duration-750 ease-in-out transform",
                  index === currentSlide 
                    ? "opacity-100 translate-x-0" 
                    : index < currentSlide 
                      ? "opacity-0 -translate-x-full" 
                      : "opacity-0 translate-x-full"
                )}
                aria-hidden={index !== currentSlide}
              >
                <Image
                  src={slide.url}
                  alt={slide.alt}
                  fill
                  className="object-cover"
                  priority={index === 0}
                  sizes="(max-width: 640px) 280px, (max-width: 768px) 350px, (max-width: 1024px) 400px, 550px"
                />
              </div>
            ))}

            {/* Navigation Arrows */}
            <button
              onClick={prevSlide}
              className={cn(
                "absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full",
                "bg-black/20 hover:bg-black/40 active:bg-black/60",
                "transition-all duration-300 transform",
                "focus:outline-none focus:ring-2 focus:ring-white/50",
                "hover:scale-110 active:scale-95",
                isTransitioning ? "opacity-50 cursor-not-allowed" : "opacity-100",
                "z-30"
              )}
              disabled={isTransitioning}
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </button>
            <button
              onClick={nextSlide}
              className={cn(
                "absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full",
                "bg-black/20 hover:bg-black/40 active:bg-black/60",
                "transition-all duration-300 transform",
                "focus:outline-none focus:ring-2 focus:ring-white/50",
                "hover:scale-110 active:scale-95",
                isTransitioning ? "opacity-50 cursor-not-allowed" : "opacity-100",
                "z-30"
              )}
              disabled={isTransitioning}
              aria-label="Next slide"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </button>

            {/* Navigation Dots */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-30">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  disabled={isTransitioning}
                  className={cn(
                    "transition-all duration-300 transform",
                    "focus:outline-none focus:ring-2 focus:ring-white/50",
                    "hover:scale-110 active:scale-95",
                    index === currentSlide
                      ? "w-4 bg-white"
                      : "w-2 bg-white/50 hover:bg-white/75",
                    "h-2 rounded-full",
                    isTransitioning ? "cursor-not-allowed" : "cursor-pointer"
                  )}
                  aria-label={`Go to slide ${index + 1}`}
                  aria-current={index === currentSlide}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 flex justify-center z-20">
        <ChevronDown className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 animate-bounce text-white" />
      </div>

      <style jsx global>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes slideInLeft {
          from {
            transform: translateX(-100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes slideOutRight {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }

        @keyframes slideOutLeft {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(-100%);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
