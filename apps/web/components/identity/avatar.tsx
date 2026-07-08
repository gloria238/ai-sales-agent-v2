"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { PresenceState } from "@/lib/time";
import { presenceColor } from "@/lib/time";

type AvatarSize = "sm" | "md" | "lg" | "xl";

const SIZE_MAP: Record<AvatarSize, { container: string; text: string }> = {
  sm: { container: "size-8", text: "text-[10px]" },
  md: { container: "size-10", text: "text-xs" },
  lg: { container: "size-12", text: "text-sm" },
  xl: { container: "size-16", text: "text-lg" },
};

const AVATAR_GRADIENTS = [
  "from-primary/70 to-primary/20",
  "from-primary/50 to-muted-foreground/20",
  "from-lp-hero-sub/40 to-lp-hero-sub/10",
  "from-muted-foreground/60 to-primary/20",
  "from-lp-hero-sub/30 to-primary/30",
  "from-primary/40 to-lp-hero-sub/20",
];

function avatarGradient(name: string): string {
  return AVATAR_GRADIENTS[(name.charCodeAt(0) || 0) % AVATAR_GRADIENTS.length];
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

const pravatarUrl = (seed: string, size = 150) =>
  `https://i.pravatar.cc/${size}?u=${encodeURIComponent(seed)}`;

interface Props {
  name: string;
  size?: AvatarSize;
  presence?: PresenceState | null;
  seed?: string;
  className?: string;
}

export function Avatar({ name, size = "md", presence, seed, className }: Props) {
  const [imgError, setImgError] = useState(false);
  const dim = SIZE_MAP[size];

  return (
    <span className={cn("relative inline-flex shrink-0", className)}>
      {imgError ? (
        /* Fallback: gradient initials */
        <span
          className={cn(
            "rounded-full flex items-center justify-center font-semibold text-white bg-gradient-to-br shadow-sm",
            avatarGradient(name),
            dim.container,
            dim.text,
          )}
        >
          {initials(name)}
        </span>
      ) : (
        <img
          src={pravatarUrl(seed || name, 150)}
          alt={name}
          className={cn("rounded-full object-cover bg-bg-subtle", dim.container)}
          onError={() => setImgError(true)}
          loading="lazy"
        />
      )}

      {/* Presence dot */}
      {presence && (
        <span
          className={cn(
            "absolute -bottom-0.5 -right-0.5 size-3 rounded-full ring-2 ring-bg",
            presenceColor(presence),
            presence === "ai-processing" && "animate-pulse",
            presence === "handoff-required" && "animate-pulse",
          )}
        />
      )}
    </span>
  );
}
