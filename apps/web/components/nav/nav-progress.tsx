"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Thin accent progress bar at the top of the viewport.
 * Shows on every route change to give immediate visual feedback.
 * Wrapped in ClientOnly to avoid usePathname SSR crash in root layout.
 */
function NavProgressInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 500);
    return () => clearTimeout(t);
  }, [pathname, searchParams]);

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-[2px] pointer-events-none">
      <div
        className="h-full bg-accent"
        style={{ animation: "nav-progress 0.5s ease-out forwards" }}
      />
      <style>{`
        @keyframes nav-progress {
          0%   { width: 0%; opacity: 1; }
          20%  { width: 25%; opacity: 1; }
          45%  { width: 60%; opacity: 0.9; }
          70%  { width: 85%; opacity: 0.6; }
          100% { width: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
}

/**
 * Only renders children after initial client mount.
 * Prevents usePathname/useSearchParams from running during SSR
 * where the Next.js router context doesn't exist at root layout level.
 */
function ClientOnly({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;
  return <>{children}</>;
}

export function NavProgress() {
  return (
    <ClientOnly>
      <NavProgressInner />
    </ClientOnly>
  );
}
