/**
 * Customer Portal layout — standalone, no dashboard sidebar/nav.
 * Customers see only their own conversations and resources.
 * Phase 19: Customer Portal skeleton.
 */
export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg relative overflow-hidden">
      {/* Ambient gradient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 size-96 rounded-full bg-accent/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 size-96 rounded-full bg-accent/5 blur-3xl" />
      </div>

      {/* Portal header — minimal branding bar */}
      <header className="relative z-10 border-b border-border bg-bg-card/70 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between px-4 h-14">
          <a href="/portal/conversations" className="flex items-center gap-2.5 font-semibold text-text">
            <span className="size-7 rounded-lg bg-accent flex items-center justify-center text-white font-bold text-xs shadow-sm shadow-accent/20">
              S
            </span>
            <span className="text-sm tracking-tight">客户门户</span>
          </a>
          <nav className="flex items-center gap-4 text-sm">
            <a href="/portal/conversations" className="text-text-secondary hover:text-text transition-colors">
              消息
            </a>
            <a href="/portal/conversations" className="text-text-muted hover:text-text transition-colors">
              资源
            </a>
          </nav>
        </div>
      </header>

      <main className="relative z-10">{children}</main>
    </div>
  );
}
