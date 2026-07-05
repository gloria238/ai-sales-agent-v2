"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "邮箱或密码错误");
        setLoading(false);
        return;
      }
      toast.success("欢迎回来！");
      router.push("/home");
      router.refresh();
    } catch {
      setError("网络错误，请重试");
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm mx-auto animate-slide-up">
      {/* Glass card */}
      <div className="glass-card p-8 sm:p-10 rounded-2xl">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex size-11 rounded-2xl bg-accent items-center justify-center text-white font-bold text-lg shadow-sm shadow-accent/25 mb-5 hover:shadow-md hover:shadow-accent/30 transition-shadow duration-300">
            S
          </Link>
          <h1 className="text-xl font-bold tracking-tight text-text">欢迎回来</h1>
          <p className="text-sm text-text-secondary mt-1.5">登录以继续使用 SalesAgent</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-1.5">
              邮箱地址
            </label>
            <input
              id="email" type="email" value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              className="block w-full rounded-xl border border-border bg-bg px-3.5 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all duration-200"
              required autoComplete="email"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-text-secondary mb-1.5">
              密码
            </label>
            <input
              id="password" type="password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              className="block w-full rounded-xl border border-border bg-bg px-3.5 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all duration-200"
              required autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="rounded-xl bg-danger-soft border border-danger/20 px-4 py-3 text-sm text-danger animate-scale-in">
              {error}
            </div>
          )}

          <button
            type="submit" disabled={loading}
            className="w-full rounded-xl bg-accent text-white text-sm font-semibold py-2.5 hover:bg-accent-hover disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 shadow-sm shadow-accent/25 hover:shadow-md hover:shadow-accent/30 active:scale-[0.98]"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                登录中...
              </span>
            ) : "登录"}
          </button>
        </form>
      </div>

      <p className="text-center text-sm text-text-muted mt-6">
        还没有账号？{" "}
        <Link href="/register" className="text-accent font-semibold hover:text-accent-hover transition-colors">
          立即注册
        </Link>
      </p>

      <p className="text-center text-xs text-text-muted mt-8">
        <Link href="/" className="hover:text-text-secondary transition-colors">
          ← 返回首页
        </Link>
      </p>
    </div>
  );
}
