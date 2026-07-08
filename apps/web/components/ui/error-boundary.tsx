"use client";

import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
}

export function ErrorBoundary({ error, reset, title = "Something went wrong" }: ErrorBoundaryProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] px-6 text-center animate-fade-in">
      <div className="rounded-md border border-border bg-bg-card p-8 max-w-md w-full space-y-4">
        <div className="size-12 rounded-full bg-danger/10 flex items-center justify-center mx-auto">
          <span className="text-danger text-xl font-bold">!</span>
        </div>
        <h2 className="text-lg font-semibold text-text">{title}</h2>
        <p className="text-sm text-text-muted">
          {error.message || "An unexpected error occurred."}
        </p>
        <div className="flex gap-3 justify-center pt-2">
          <Button onClick={reset} variant="outline" size="sm">
            Try again
          </Button>
          <Button onClick={() => (window.location.href = "/home")} size="sm">
            Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
