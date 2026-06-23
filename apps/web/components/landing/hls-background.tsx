"use client";

import { useEffect, useRef } from "react";
import Hls from "hls.js";

interface HlsBackgroundProps {
  src: string;
  overlayClass?: string;
  children: React.ReactNode;
}

export default function HlsBackground({
  src,
  overlayClass = "",
  children,
}: HlsBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
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
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [src]);

  return (
    <div className="relative overflow-hidden">
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay
        loop
        muted
        playsInline
      />
      {overlayClass && (
        <div
          className={`absolute inset-0 pointer-events-none ${overlayClass}`}
        />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
