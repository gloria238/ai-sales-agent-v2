"use client";
import { useState } from "react";
import { toast } from "sonner";

/**
 * Customer Portal — Login page.
 * Phase 19: Skeleton. Currently accepts email lookup (matches Lead.email).
 * Full auth integration (JWT + httpOnly cookie) to be wired in Phase 20.
 */
export default function PortalLoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    // Phase 19 skeleton: simulate magic-link send
    await new Promise((r) => setTimeout(r, 1200));
    setSent(true);
    setLoading(false);
    toast.success("If that email is registered, you'll receive a login link.");
  }

  if (sent) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center animate-slide-up">
          <div className="glass-card p-8 sm:p-10 rounded-2xl">
            <div className="size-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-5">
              <svg className="size-7 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-text mb-2">Check your email</h2>
            <p className="text-sm text-text-secondary leading-relaxed">
              We sent a login link to <span className="font-semibold text-text">{email}</span>.
              Click the link to access your conversations.
            </p>
            <button
              onClick={() => setSent(false)}
              className="mt-6 text-sm text-accent hover:text-accent-hover transition-colors font-medium"
            >
              ← Try a different email
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm animate-slide-up">
        <div className="glass-card p-8 sm:p-10 rounded-2xl">
          <div className="text-center mb-8">
            <span className="inline-flex size-11 rounded-2xl bg-accent items-center justify-center text-white font-bold text-lg shadow-sm shadow-accent/25 mb-5">
              S
            </span>
            <h1 className="text-xl font-bold tracking-tight text-text">Customer Portal</h1>
            <p className="text-sm text-text-secondary mt-1.5">
              Access your conversations and resources
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-1.5">
                Your email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="block w-full rounded-xl border border-border bg-bg px-3.5 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all duration-200"
                required
                autoComplete="email"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-accent text-white text-sm font-semibold py-2.5 hover:bg-accent-hover disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 shadow-sm shadow-accent/25 hover:shadow-md hover:shadow-accent/30 active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending link...
                </span>
              ) : (
                "Send login link"
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-text-muted mt-8">
          <a href="/login" className="hover:text-text-secondary transition-colors">
            ← Team member? Sign in here
          </a>
        </p>
      </div>
    </div>
  );
}
