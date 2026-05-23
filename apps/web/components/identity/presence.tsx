"use client";
import { cn } from "@/lib/utils";
import type { PresenceState } from "@/lib/time";
import { presenceLabel, presenceColor } from "@/lib/time";

interface Props {
  state: PresenceState;
  showLabel?: boolean;
  size?: "sm" | "md";
}

export function PresenceDot({ state, showLabel = false, size = "sm" }: Props) {
  const dotSize = size === "sm" ? "size-2" : "size-2.5";
  const isPulse = state === "ai-processing" || state === "syncing" || state === "handoff-required";

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("relative flex", dotSize)}>
        {isPulse && (
          <span
            className={cn(
              "absolute inset-0 rounded-full animate-ping opacity-75",
              presenceColor(state),
            )}
          />
        )}
        <span
          className={cn(
            "relative inline-flex rounded-full",
            dotSize,
            presenceColor(state),
          )}
        />
      </span>
      {showLabel && (
        <span className="text-[11px] text-text-muted font-medium">
          {presenceLabel(state)}
        </span>
      )}
    </span>
  );
}
