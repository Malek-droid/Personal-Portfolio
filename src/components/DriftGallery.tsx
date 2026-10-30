import React, { useEffect, useRef, useState, useCallback } from "react";

export interface GalleryImage {
  src: string;
  alt: string;
  caption: string;
  width: number;
  height: number;
}

interface DriftGalleryProps {
  images: GalleryImage[];
}

export function DriftGallery({ images }: DriftGalleryProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  const handleImageError = (src: string) => {
    setFailedImages((prev) => ({ ...prev, [src]: true }));
  };

  const openLightbox = (index: number, e: React.MouseEvent<HTMLButtonElement>) => {
    triggerRef.current = e.currentTarget;
    setActiveIndex(index);
  };

  const closeLightbox = useCallback(() => {
    setActiveIndex(null);
    // Return focus to trigger button
    setTimeout(() => {
      triggerRef.current?.focus();
    }, 0);
  }, []);

  const showNext = useCallback(() => {
    setActiveIndex((prev) => (prev === null ? null : (prev + 1) % images.length));
  }, [images.length]);

  const showPrev = useCallback(() => {
    setActiveIndex((prev) => (prev === null ? null : (prev - 1 + images.length) % images.length));
  }, [images.length]);

  // Lock body scroll while lightbox is open & preload neighbors
  useEffect(() => {
    if (activeIndex === null) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Preload neighboring images
    const nextIdx = (activeIndex + 1) % images.length;
    const prevIdx = (activeIndex - 1 + images.length) % images.length;
    [nextIdx, prevIdx].forEach((idx) => {
      const img = new Image();
      img.src = images[idx].src;
    });

    // Keyboard controls
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeLightbox();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        showNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        showPrev();
      } else if (e.key === "Tab" && dialogRef.current) {
        // Focus trap
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length > 0) {
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [activeIndex, images, closeLightbox, showNext, showPrev]);

  // Focus dialog on open
  useEffect(() => {
    if (activeIndex !== null && dialogRef.current) {
      dialogRef.current.focus();
    }
  }, [activeIndex]);

  const featured = images[0];
  const secondary = images.slice(1);

  return (
    <div className="mt-6 flex flex-col gap-4">
      {/* Featured large image on top */}
      {featured && (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={(e) => openLightbox(0, e)}
            className="group relative block w-full overflow-hidden rounded-sm border border-[#1e1e1e] bg-[#0c0c0e] text-left transition-colors hover:border-[#7c3aed]/50 cursor-zoom-in focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
            aria-label={`View enlarged: ${featured.caption}`}
          >
            {failedImages[featured.src] ? (
              <div className="flex aspect-[1600/777] w-full items-center justify-center bg-[#111] p-6 text-center font-mono text-xs text-[#888]">
                Screenshot unavailable
              </div>
            ) : (
              <img
                src={featured.src}
                alt={featured.alt}
                width={featured.width}
                height={featured.height}
                loading="lazy"
                decoding="async"
                onError={() => handleImageError(featured.src)}
                className="h-auto w-full object-contain transition-transform duration-300 group-hover:scale-[1.01]"
              />
            )}
            <div className="absolute top-2 right-2 rounded bg-black/70 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-[#aaa] backdrop-blur-xs opacity-0 transition-opacity group-hover:opacity-100">
              Click to enlarge
            </div>
          </button>
          <p className="font-mono text-[11px] tracking-wider text-[#888]">{featured.caption}</p>
        </div>
      )}

      {/* Two smaller images in equal columns (stacks on mobile) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {secondary.map((img, i) => {
          const actualIndex = i + 1;
          const isFailed = failedImages[img.src];
          return (
            <div key={img.src} className="flex flex-col gap-2">
              <button
                type="button"
                onClick={(e) => openLightbox(actualIndex, e)}
                className="group relative block w-full overflow-hidden rounded-sm border border-[#1e1e1e] bg-[#0c0c0e] text-left transition-colors hover:border-[#7c3aed]/50 cursor-zoom-in focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
                aria-label={`View enlarged: ${img.caption}`}
              >
                {isFailed ? (
                  <div className="flex aspect-[1600/800] w-full items-center justify-center bg-[#111] p-6 text-center font-mono text-xs text-[#888]">
                    Screenshot unavailable
                  </div>
                ) : (
                  <img
                    src={img.src}
                    alt={img.alt}
                    width={img.width}
                    height={img.height}
                    loading="lazy"
                    decoding="async"
                    onError={() => handleImageError(img.src)}
                    className="h-auto w-full object-contain transition-transform duration-300 group-hover:scale-[1.01]"
                  />
                )}
                <div className="absolute top-2 right-2 rounded bg-black/70 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-[#aaa] backdrop-blur-xs opacity-0 transition-opacity group-hover:opacity-100">
                  Click to enlarge
                </div>
              </button>
              <p className="font-mono text-[11px] tracking-wider text-[#888]">{img.caption}</p>
            </div>
          );
        })}
      </div>

      {/* Lightbox Modal */}
      {activeIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Screenshot lightbox gallery"
          ref={dialogRef}
          tabIndex={-1}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={closeLightbox}
        >
          {/* Modal Container */}
          <div
            className="relative flex flex-col items-center max-w-[90vw] max-h-[88vh] text-left focus:outline-none"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Bar with Counter and Close Button */}
            <div className="w-full flex items-center justify-between pb-3 font-mono text-xs text-[#aaa]">
              <span className="text-[#a78bfa] tracking-widest">
                {activeIndex + 1} / {images.length}
              </span>
              <button
                type="button"
                onClick={closeLightbox}
                aria-label="Close"
                className="rounded px-2.5 py-1 text-white hover:text-[#a78bfa] transition-colors font-mono text-sm border border-[#27272a] hover:border-[#7c3aed] bg-[#0c0c0e]"
              >
                ✕ Esc
              </button>
            </div>

            {/* Main Image Box */}
            <div className="relative overflow-hidden rounded border border-[#27272a] bg-[#09090b] shadow-2xl flex items-center justify-center max-h-[72vh]">
              {failedImages[images[activeIndex].src] ? (
                <div className="flex h-64 w-96 max-w-[80vw] items-center justify-center p-8 text-center font-mono text-sm text-[#888]">
                  Screenshot unavailable
                </div>
              ) : (
                <img
                  src={images[activeIndex].src}
                  alt={images[activeIndex].alt}
                  width={images[activeIndex].width}
                  height={images[activeIndex].height}
                  className="max-h-[72vh] max-w-[90vw] object-contain select-none"
                />
              )}
            </div>

            {/* Bottom Caption and Navigation */}
            <div className="w-full flex flex-wrap items-center justify-between gap-3 pt-3">
              <p className="font-mono text-xs text-[#ccc] tracking-wide flex-1">
                {images[activeIndex].caption}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={showPrev}
                  aria-label="Previous screenshot"
                  className="rounded px-3 py-1 font-mono text-xs text-white border border-[#27272a] hover:border-[#7c3aed] bg-[#0c0c0e] hover:text-[#a78bfa] transition-colors"
                >
                  ← Prev
                </button>
                <button
                  type="button"
                  onClick={showNext}
                  aria-label="Next screenshot"
                  className="rounded px-3 py-1 font-mono text-xs text-white border border-[#27272a] hover:border-[#7c3aed] bg-[#0c0c0e] hover:text-[#a78bfa] transition-colors"
                >
                  Next →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

