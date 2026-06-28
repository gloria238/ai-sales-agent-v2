"use client";

import { ErrorBoundary } from "@/components/ui/error-boundary";

export default function AuditLogError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorBoundary error={error} reset={reset} title="Audit log error" />;
}
