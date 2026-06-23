"use client";

import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";

interface HlsBackgroundProps {
  src: string;
  overlayClass?: string;
  children: React.ReactNode;
  /** Preload strategy: 'auto' = immediate, 'lazy' = IntersectionObserver */
  preload?: "auto" | "lazy";
}

export default function HlsBackground({
  src,
  overlayClass = "",
  children,
  preload = "lazy",
}: HlsBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = useState(preload === "auto");
  const [loaded, setLoaded] = useState(false);

  // Lazy-load via IntersectionObserver
  useEffect(() => {
    if (preload === "auto" || shouldLoad) return;
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: "400px" } // start loading 400px before visible
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [preload, shouldLoad]);

  // Initialize HLS when ready
  useEffect(() => {
    if (!shouldLoad) return;
    const video = videoRef.current;
    if (!video) return;

    let hls: Hls | null = null;

    if (Hls.isSupported()) {
      hls = new Hls({
        enableWorker: false,
        lowLatencyMode: true,
      });
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setLoaded(true);
        video.play().catch(() => {});
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      video.addEventListener("loadeddata", () => setLoaded(true));
    }

    return () => {
      if (hls) hls.destroy();
    };
  }, [src, shouldLoad]);

  return (
    <div ref={containerRef} className="relative overflow-hidden bg-lp-background">
      {/* Gradient placeholder — shown until video loads */}
      <div
        className={`absolute inset-0 bg-gradient-to-br from-lp-background via-lp-secondary/30 to-lp-background transition-opacity duration-700 ${
          loaded ? "opacity-0" : "opacity-100"
        }`}
      />

      <video
        ref={videoRef}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
        autoPlay
        loop
        muted
        playsInline
        preload="none"
      />

      {overlayClass && (
        <div className={`absolute inset-0 pointer-events-none ${overlayClass}`} />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
