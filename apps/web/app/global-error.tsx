"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="bg-bg text-text font-sans">
        <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
          <h1 className="text-2xl font-bold text-text mb-3">Application Error</h1>
          <p className="text-sm text-text-muted mb-6 max-w-md">
            A critical error occurred. Please refresh the page to continue.
          </p>
          <button
            onClick={reset}
            className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-hover transition-colors"
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
