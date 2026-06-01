"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

interface Props {
  className?: string;
  variant?: "landing" | "nav";
}

export function DemoLoginButton({ className, variant = "landing" }: Props) {
  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    setLoading(true);
    // Use location.href because /api/demo-login sets a cookie via Set-Cookie
    // header and redirects. fetch() can't follow Set-Cookie redirects cleanly.
    window.location.href = "/api/demo-login";
  };

  if (variant === "nav") {
    return (
      <button
        onClick={handleClick}
        disabled={loading}
        className={`rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white text-sm font-semibold px-4 py-2 transition-all duration-200 shadow-sm shadow-violet-500/20 active:scale-[0.98] disabled:opacity-70 disabled:cursor-wait ${className ?? ""}`}
      >
        {loading ? (
          <span className="inline-flex items-center gap-1.5">
            <Loader2 className="size-3.5 animate-spin" />
            Loading...
          </span>
        ) : (
          "Try Demo"
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-semibold px-7 py-3.5 text-base transition-all duration-200 shadow-md shadow-violet-500/20 active:scale-[0.98] disabled:opacity-70 disabled:cursor-wait disabled:scale-100 inline-flex items-center gap-2 ${className ?? ""}`}
    >
      {loading ? (
        <>
          <Loader2 className="size-5 animate-spin" />
          Launching demo...
        </>
      ) : (
        "Try Live Demo →"
      )}
    </button>
  );
}
