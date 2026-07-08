"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[root-error]", error.message);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <div className="rounded-md border border-border bg-bg-card p-8 max-w-md w-full space-y-4">
        <div className="size-12 rounded-full bg-danger/10 flex items-center justify-center mx-auto">
          <span className="text-danger text-xl font-bold">!</span>
        </div>
        <h2 className="text-lg font-semibold text-text">Something went wrong</h2>
        <p className="text-sm text-text-muted">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
        <div className="flex gap-3 justify-center pt-2">
          <Button onClick={reset} variant="outline" size="sm">
            Try again
          </Button>
          <Button onClick={() => (window.location.href = "/home")} size="sm">
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
