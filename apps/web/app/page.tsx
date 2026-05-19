import Link from "next/link";

const features = [
  { icon: "🤖", title: "AI Lead Qualification", desc: "AI agents score every lead across intent, budget, authority, need, and timeline. Hot leads auto-route to human SDRs." },
  { icon: "📨", title: "AI Follow-up Sequences", desc: "Multi-step outbound campaigns with AI-personalized emails. Detects replies and pauses sequences automatically." },
  { icon: "💬", title: "Conversation Memory", desc: "AI remembers every interaction. Full context across email threads — no repetitive questions, no lost context." },
  { icon: "📊", title: "Multi-Channel Outreach", desc: "Email today. Chat and SMS coming soon. Unified inbox for all channels with AI draft suggestions." },
  { icon: "🎯", title: "Campaign Orchestration", desc: "Schedule sequences with delays, retries, and conditional branching. AI personalizes every email at send time." },
  { icon: "📈", title: "Real-Time Monitoring", desc: "Live dashboard: active conversations, response rate, qualified leads, booked meetings, campaign analytics." },
];

const useCases = [
  { title: "Inbound Lead Response", desc: "AI SDR responds to inbound inquiries within minutes. Qualifies, answers questions, and books meetings — 24/7." },
  { title: "Cold Outbound at Scale", desc: "Launch personalized cold email campaigns to hundreds of leads. AI writes each email, handles replies, and tracks results." },
  { title: "Re-engagement Campaigns", desc: "Win back cold leads with AI-crafted re-engagement sequences. New features, case studies, check-ins — on autopilot." },
  { title: "Meeting Booking", desc: "AI handles the back-and-forth of scheduling. Finds mutual availability, sends calendar invites, and confirms." },
];

const audiences = [
  { label: "SaaS Startups", icon: "🚀" }, { label: "SDR Teams", icon: "📞" },
  { label: "Agencies", icon: "🏢" }, { label: "Founders", icon: "💡" },
  { label: "RevOps", icon: "📈" }, { label: "Outbound", icon: "📨" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg text-text">
      {/* Glass navbar */}
      <header className="sticky top-0 z-50 border-b border-border bg-glass-bg backdrop-blur-xl">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-14">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="size-8 rounded-xl bg-accent flex items-center justify-center text-white text-sm font-bold shadow-sm shadow-accent/20">S</div>
            <span className="font-bold text-lg tracking-tight">SalesAgent</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-text-secondary hover:text-text transition-colors px-3 py-2">Sign in</Link>
            <Link href="/register" className="rounded-xl bg-accent text-white text-sm font-semibold px-4 py-2 hover:bg-accent-hover transition-all duration-200 shadow-sm shadow-accent/20 active:scale-[0.98]">Get started</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-6 pt-28 pb-16 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-accent-soft border border-accent/10 px-4 py-1.5 text-sm font-medium text-accent mb-8">
          <span className="relative flex size-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-50" />
            <span className="relative inline-flex rounded-full size-2 bg-accent" />
          </span>
          AI SDR Infrastructure
        </div>
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05]">
          AI sales agents that{" "}
          <span className="bg-gradient-to-r from-accent to-accent-hover bg-clip-text text-transparent [background-clip:text] [-webkit-background-clip:text]">
            qualify, follow up, and book meetings
          </span>{" "}
          automatically.
        </h1>
        <p className="mt-8 text-xl text-text-secondary max-w-xl mx-auto leading-relaxed">
          AI SDRs handle inbound leads, run outbound campaigns, and schedule meetings — while your team focuses on closing.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link href="/register" className="rounded-xl bg-accent text-white font-semibold px-7 py-3.5 text-base hover:bg-accent-hover transition-all duration-200 shadow-md shadow-accent/20 active:scale-[0.98]">
            Start your AI SDR
          </Link>
          <Link href="/login" className="rounded-xl border border-border bg-bg-card text-text font-semibold px-7 py-3.5 text-base hover:bg-bg-subtle transition-all duration-200">
            Sign in
          </Link>
        </div>
        <p className="mt-6 text-sm text-text-muted">Free to start. No credit card required.</p>
      </section>

      {/* Built for */}
      <section className="max-w-3xl mx-auto px-6 pb-28">
        <p className="text-xs font-semibold text-text-muted uppercase tracking-[0.2em] text-center mb-7">Built for</p>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {audiences.map((a) => (
            <div key={a.label} className="glass-card p-4 text-center group cursor-default hover:border-accent/30 transition-all duration-200">
              <div className="text-xl mb-2 group-hover:scale-110 transition-transform duration-200">{a.icon}</div>
              <p className="text-xs font-semibold text-text-secondary tracking-tight">{a.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trusted by */}
      <section className="max-w-4xl mx-auto px-6 pb-24">
        <p className="text-xs font-semibold text-text-muted uppercase tracking-[0.2em] text-center mb-7">Trusted by modern GTM teams</p>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 opacity-40">
          {["Acme Corp", "ScaleUp AI", "SaaS Founders", "GrowthLabs", "NordicTech", "PipelineIQ", "OutboundOS", "RevOps Co"].map((name) => (
            <span key={name} className="text-sm font-bold text-text-secondary tracking-tight">{name}</span>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-12">
          {[
            { stat: "12,847", label: "AI-qualified leads this month", icon: "target" },
            { stat: "3,241", label: "Meetings booked by AI agents", icon: "calendar" },
            { stat: "94.2%", label: "Response rate on managed conversations", icon: "zap" },
          ].map((s) => (
            <div key={s.label} className="glass-card p-5 text-center">
              <div className="size-10 rounded-xl bg-accent-soft flex items-center justify-center mx-auto mb-3">
                <div className="size-4 rounded-sm bg-accent/20" />
              </div>
              <p className="text-2xl font-bold text-text tracking-tight">{s.stat}</p>
              <p className="text-xs text-text-muted mt-1">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center">
          <blockquote className="glass-card inline-block max-w-lg p-5 text-sm text-text-secondary italic">
            "We replaced 3 SDRs with one AI agent. Our reply rate went from 12% to 38%. The ROI was visible in week one."
            <footer className="mt-2 text-xs text-text-muted not-italic font-medium">— Sarah Chen, Head of Growth at ScaleUp AI</footer>
          </blockquote>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 pb-32">
        <p className="text-xs font-semibold text-text-muted uppercase tracking-[0.2em] text-center mb-5">Capabilities</p>
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-5 tracking-tight">Everything your SDR team needs, automated</h2>
        <p className="text-base text-text-secondary text-center mb-16 max-w-xl mx-auto leading-relaxed">
          AI agents that work 24/7 — qualifying leads, sending follow-ups, and booking meetings while your team sleeps.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div key={f.title} className="glass-card p-7 group hover:border-accent/40 transition-all duration-300" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="size-12 rounded-2xl bg-accent-soft flex items-center justify-center text-xl mb-5 group-hover:scale-110 transition-transform duration-300">{f.icon}</div>
              <h3 className="font-semibold text-text mb-2.5 text-base">{f.title}</h3>
              <p className="text-sm text-text-secondary leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Use Cases */}
      <section className="bg-bg-subtle/80 border-y border-border py-28">
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-[0.2em] text-center mb-5">Use Cases</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-5 tracking-tight">How teams use SalesAgent</h2>
          <p className="text-base text-text-secondary text-center mb-16 max-w-xl mx-auto leading-relaxed">
            Real SDR workflows that replace manual outreach with AI-powered conversations.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {useCases.map((item) => (
              <div key={item.title} className="glass-card p-7 hover:border-accent/30 transition-all duration-300">
                <h3 className="font-semibold text-text mb-2.5 text-base">{item.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture */}
      <section className="max-w-5xl mx-auto px-6 py-28">
        <p className="text-xs font-semibold text-text-muted uppercase tracking-[0.2em] text-center mb-5">Architecture</p>
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-5 tracking-tight">Built like a production SaaS</h2>
        <p className="text-base text-text-secondary text-center mb-3 max-w-xl mx-auto leading-relaxed">
          AI SDR agents powered by async queues, real-time inbox, and production-grade infrastructure. Not a demo — designed for real outbound operations.
        </p>
        <p className="text-sm text-text-muted text-center mb-14 italic">Designed to reflect real production operational systems</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { label: "Async Queue Orchestration", desc: "BullMQ + Redis for email sequences, delays, retries, and failure recovery." },
            { label: "Real-time Inbox", desc: "SSE streaming for live conversation updates and AI draft suggestions." },
            { label: "Multi-tenant RBAC", desc: "4 roles, 10 permissions. Isolated orgs with scoped data and team collaboration." },
            { label: "Distributed Workers", desc: "Railway workers for AI response composition, campaign delivery, and lead scoring." },
            { label: "AI Pipeline", desc: "DeepSeek-powered response composition, lead scoring, summarization, and script generation." },
            { label: "PostgreSQL + Prisma", desc: "Type-safe queries, schema migrations, and connection pooling via Supabase." },
          ].map((item) => (
            <div key={item.label} className="glass-card p-6 text-left hover:border-accent/20 transition-all duration-200">
              <p className="text-base font-semibold text-text mb-2">{item.label}</p>
              <p className="text-sm text-text-secondary leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-2xl mx-auto px-6 pb-32 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-5">Ready to deploy your AI SDR?</h2>
        <p className="text-base text-text-secondary mb-10 max-w-md mx-auto leading-relaxed">
          Set up your first AI sales agent in minutes. Qualify leads, run campaigns, and book meetings — automatically.
        </p>
        <Link href="/register" className="inline-flex rounded-xl bg-accent text-white font-semibold px-8 py-4 hover:bg-accent-hover transition-all duration-200 shadow-md shadow-accent/20 active:scale-[0.98] text-base">
          Start your AI SDR
        </Link>
        <p className="mt-6 text-sm text-text-muted">Free to start. Upgrade when you need more agents.</p>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-text-muted">
          <span>&copy; 2026 SalesAgent AI. All rights reserved.</span>
          <div className="flex items-center gap-6">
            <Link href="/docs" className="hover:text-text-secondary transition-colors">API Docs</Link>
            <Link href="/login" className="hover:text-text-secondary transition-colors">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
