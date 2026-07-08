"use client";
import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifyUrl, setVerifyUrl] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setVerifyUrl("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error || "Registration failed"); setLoading(false); return; }
      if (data.requiresVerification && data.verifyUrl) {
        setVerifyUrl(data.verifyUrl);
        toast.info("Verification email sent — check your inbox");
      }
    } catch { setError("Network error — please try again"); }
    finally { setLoading(false); }
  }

  return (
    <div className="w-full max-w-sm mx-auto animate-slide-up">
      <div className="rounded-md border border-border bg-bg-card p-8 sm:p-10 rounded-lg">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex size-11 rounded-lg bg-primary items-center justify-center text-white font-bold text-lg shadow-sm shadow-primary/25 mb-5 hover:shadow-md hover:shadow-primary/30 transition-shadow duration-300">
            S
          </Link>
          <h1 className="text-xl font-bold tracking-tight text-text">Create an account</h1>
          <p className="text-sm text-text-secondary mt-1.5">Deploy your first AI sales agent</p>
        </div>

        {verifyUrl ? (
          <div className="space-y-4 animate-scale-in">
            <div className="rounded-lg bg-success/10 border border-success/20 p-6 text-center">
              <div className="size-12 rounded-full bg-success flex items-center justify-center mx-auto mb-3">
                <svg className="size-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-success mb-1">Check your email</h3>
              <p className="text-xs text-text-secondary mb-4">
                We sent a verification link to <strong>{email}</strong>. Click it to complete registration. Expires in 10 minutes.
              </p>
              <p className="text-xs text-text-muted">
                No email?{" "}
                <a href={verifyUrl} className="text-primary font-medium hover:text-primary-hover transition-colors">
                  Click here to verify manually
                </a>
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-text-secondary mb-1.5">Full name</label>
              <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Jane Smith"
                className="block w-full rounded-xl border border-border bg-bg px-3.5 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                required />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-1.5">Email address</label>
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@company.com"
                className="block w-full rounded-xl border border-border bg-bg px-3.5 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                required autoComplete="email" />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text-secondary mb-1.5">Password</label>
              <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="block w-full rounded-xl border border-border bg-bg px-3.5 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                required minLength={8} autoComplete="new-password" />
            </div>

            {error && (
              <div className="rounded-xl bg-danger/10 border border-danger/20 px-4 py-3 text-sm text-danger animate-scale-in">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full rounded-xl bg-primary text-white text-sm font-semibold py-2.5 hover:bg-primary-hover disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 shadow-sm shadow-primary/25 hover:shadow-md hover:shadow-primary/30 active:scale-[0.98]">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : "Create account"}
            </button>
          </form>
        )}
      </div>

      <p className="text-center text-sm text-text-muted mt-6">
        Already have an account?{" "}
        <Link href="/login" className="text-primary font-semibold hover:text-primary-hover transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  );
}
