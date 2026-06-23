import { ChevronRight } from "lucide-react";
import HlsBackground from "@/components/landing/hls-background";

/* ──────────────────────────────────────────────────────────────────────────────
   SalesAgent AI Landing Page — Revenue Acceleration Platform
   Dark "liquid glass" aesthetic with green accent, video backgrounds, and
   7 marketing sections. SalesAgent = AI SDR agents that qualify, follow up,
   and book meetings automatically.
   ─────────────────────────────────────────────────────────────────────────── */

/* ── Crosshair Logo Icon ──────────────────────────────────────────────────── */

function CrosshairIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="2" x2="12" y2="8" />
      <line x1="12" y1="16" x2="12" y2="22" />
      <line x1="2" y1="12" x2="8" y2="12" />
      <line x1="16" y1="12" x2="22" y2="12" />
    </svg>
  );
}

/* ── Data ─────────────────────────────────────────────────────────────────── */

const BRANDS = [
  "Acme Corp", "ScaleUp AI", "GrowthLabs", "NordicTech",
  "PipelineIQ", "OutboundOS",
];
const MARQUEE_ITEMS = [...BRANDS, ...BRANDS];

const FEATURES = [
  {
    title: "AI Lead Qualification",
    desc: "AI agents score every lead across intent, budget, authority, need, and timeline. Hot leads auto-route to human SDRs — no manual triage.",
    stat: "94.2%",
    label: "response rate on managed conversations",
  },
  {
    title: "Campaign Orchestration",
    desc: "Schedule multi-step sequences with delays, retries, and conditional branching. AI personalizes every email at send time and pauses on reply.",
    stat: "3,241",
    label: "meetings booked by AI agents monthly",
  },
  {
    title: "Real-Time Monitoring",
    desc: "Live dashboard: active conversations, response rate, qualified leads, booked meetings, campaign analytics. All streaming via SSE in real time.",
    stat: "12,847",
    label: "AI-qualified leads processed monthly",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "We replaced 3 SDRs with one AI agent. Our reply rate went from 12% to 38%. The ROI was visible in week one.",
    initials: "SC",
    name: "Sarah Chen",
    role: "Head of Growth, ScaleUp AI",
  },
  {
    quote:
      "SalesAgent handles our entire inbound funnel. Leads get a response within 2 minutes, 24/7. Our meeting book rate tripled.",
    initials: "MK",
    name: "Marcus Kline",
    role: "VP Sales, NordicTech",
  },
  {
    quote:
      "The multi-channel orchestration is what sold us. Email today, SMS tomorrow — all coordinated by one AI brain. Game changer.",
    initials: "EL",
    name: "Elena Rossi",
    role: "CRO, PipelineIQ",
  },
];

const FOOTER_LINKS = {
  Product: ["Features", "Pricing", "Integrations", "Changelog", "Roadmap"],
  Company: ["About", "Blog", "Careers", "Press"],
  Resources: ["Documentation", "Community", "Support", "Status"],
};

/* ── Video URLs ───────────────────────────────────────────────────────────── */

const HERO_VIDEO = "/videos/hero.mp4";
const FEATURES_HLS =
  "https://stream.mux.com/Jwr2RhmsNrd6GEspBNgm02vJsRZAGlaoQIh4AucGdASw.m3u8";
const CHESS_HLS =
  "https://stream.mux.com/1CCfG6mPC7LbMOAs6iBOfPeNd3WaKlZuHuKHp00G62j8.m3u8";
const REVERSE_CHESS_HLS =
  "https://stream.mux.com/f0001qPDy00mvqP023lqK3lWx31uHvxirFCHK1yNLczzqxY.m3u8";
const NUMBERS_HLS =
  "https://stream.mux.com/Kec29dVyJgiPdtWaQtPuEiiGHkJIYQAVUJcNiIHUYeo.m3u8";
const CTA_HLS =
  "https://stream.mux.com/tLkHO1qZoaaQOUeVWo8hEBeGQfySP02EPS02BmnNFyXys.m3u8";

/* ── Reusable Components ──────────────────────────────────────────────────── */

function AnnouncementBadge({ text, link }: { text: string; link?: string }) {
  return (
    <div className="liquid-glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm">
      <span className="text-lp-foreground font-medium">{text}</span>
      {link && (
        <span className="inline-flex items-center gap-1 text-lp-primary font-semibold">
          {link}
          <ChevronRight className="size-3.5" />
        </span>
      )}
    </div>
  );
}

function FeatureCard({
  title,
  desc,
  stat,
  label,
}: {
  title: string;
  desc: string;
  stat: string;
  label: string;
}) {
  return (
    <div className="liquid-glass rounded-3xl p-8 flex flex-col justify-between hover:bg-white/[0.03] transition-colors duration-300">
      <div>
        <h3 className="text-lp-hero-heading text-xl font-semibold mb-3">{title}</h3>
        <p className="text-lp-hero-sub text-sm leading-relaxed">{desc}</p>
      </div>
      <div className="mt-8 pt-6 border-t border-lp-border/50">
        <p className="text-lp-hero-heading text-3xl font-semibold tracking-tight">{stat}</p>
        <p className="text-lp-muted-foreground text-sm mt-1">{label}</p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════════════════════════════ */

export default function LandingPage() {
  return (
    <div
      className="bg-lp-background text-lp-foreground antialiased"
      style={{ fontFamily: "'Geist Sans', 'Inter', system-ui, sans-serif" }}
    >
      {/* Force dark for landing */}
      <script
        dangerouslySetInnerHTML={{
          __html: `document.documentElement.classList.add('dark');`,
        }}
      />

      {/* ════════════════════════════════════════════════════════════════════════
          SECTION 1: HERO
          ════════════════════════════════════════════════════════════════════ */}

      <section className="relative min-h-screen flex flex-col overflow-hidden">
        <video
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay loop muted playsInline
        >
          <source src={HERO_VIDEO} type="video/mp4" />
        </video>

        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(to bottom, transparent 0%, transparent 30%, hsl(260 87% 3% / 0.1) 45%, hsl(260 87% 3% / 0.4) 60%, hsl(260 87% 3% / 0.75) 75%, hsl(260 87% 3%) 95%)",
          }}
        />

        {/* Navbar */}
        <header className="relative z-20 flex justify-center pt-6 px-4">
          <nav className="liquid-glass rounded-3xl w-full max-w-[850px] flex items-center justify-between px-5 py-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-b from-lp-secondary to-lp-muted flex items-center justify-center">
                <CrosshairIcon className="size-4 text-lp-primary" />
              </div>
              <span className="text-xl font-semibold text-lp-foreground">
                SalesAgent
              </span>
            </div>

            <div className="hidden md:flex items-center gap-1">
              <button className="text-sm text-lp-hero-sub hover:text-lp-foreground px-3 py-2 rounded-lg transition-colors inline-flex items-center gap-0.5">
                Features
                <ChevronRight className="size-3 rotate-90 text-lp-muted-foreground" />
              </button>
              <button className="text-sm text-lp-hero-sub hover:text-lp-foreground px-3 py-2 rounded-lg transition-colors">
                Solutions
              </button>
              <button className="text-sm text-lp-hero-sub hover:text-lp-foreground px-3 py-2 rounded-lg transition-colors">
                Plans
              </button>
              <button className="text-sm text-lp-hero-sub hover:text-lp-foreground px-3 py-2 rounded-lg transition-colors inline-flex items-center gap-0.5">
                Docs
                <ChevronRight className="size-3 rotate-90 text-lp-muted-foreground" />
              </button>
            </div>

            <a
              href="/register"
              className="inline-flex items-center rounded-full bg-lp-primary text-lp-primary-foreground px-5 py-2 text-sm font-semibold hover:bg-lp-primary/90 transition-colors"
            >
              Sign Up
            </a>
          </nav>
        </header>

        {/* Hero Content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4 pb-32 pt-32">
          <AnnouncementBadge text="AI SDR v2 Launched!" link="Explore" />

          <h1 className="text-lp-hero-heading text-4xl sm:text-6xl lg:text-7xl font-semibold leading-[1.05] tracking-tight max-w-5xl mt-6">
            AI sales agents that
            <br />
            qualify, follow up, and
            <br />
            book meetings automatically
          </h1>

          <p className="text-lp-hero-sub text-lg max-w-md mt-4 opacity-80">
            AI SDRs handle inbound leads, run outbound campaigns, and schedule
            meetings — while your team focuses on closing.
          </p>

          <div className="flex items-center gap-4 mt-8">
            <a
              href="/register"
              className="inline-flex items-center rounded-full bg-lp-primary text-lp-primary-foreground px-6 py-3 text-base font-medium hover:bg-lp-primary/90 transition-colors"
            >
              Start Free Right Now
            </a>
            <a
              href="/api/demo-login"
              className="liquid-glass inline-flex items-center rounded-full px-6 py-3 text-base font-normal text-lp-foreground hover:bg-white/5 transition-colors"
            >
              Try Live Demo →
            </a>
          </div>
        </div>

        {/* Social Proof Bar */}
        <div className="relative z-10 w-full pb-10 px-4">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <p className="text-lp-hero-sub/50 text-sm leading-snug shrink-0">
              Trusted by modern
              <br />
              GTM teams worldwide
            </p>
            <div className="flex-1 overflow-hidden relative">
              <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-lp-background to-transparent z-10 pointer-events-none" />
              <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-lp-background to-transparent z-10 pointer-events-none" />
              <div className="flex animate-marquee gap-8">
                {MARQUEE_ITEMS.map((name, i) => (
                  <div key={`${name}-${i}`} className="flex items-center gap-2.5 shrink-0">
                    <div className="liquid-glass w-6 h-6 rounded-lg flex items-center justify-center text-xs font-semibold text-lp-hero-sub">
                      {name[0]}
                    </div>
                    <span className="text-sm font-medium text-lp-hero-sub/60">{name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════════
          SECTION 2: FEATURES (3-Card Grid + HLS Background)
          ════════════════════════════════════════════════════════════════════ */}

      <section id="features" className="relative py-28">
        <HlsBackground
          src={FEATURES_HLS}
          overlayClass="bg-gradient-to-b from-lp-background via-lp-background/80 to-transparent"
        >
          <div className="absolute inset-0 pointer-events-none z-10 bg-gradient-to-t from-lp-background via-lp-background/80 to-transparent" />
          <div className="absolute inset-0 bg-lp-background/40 z-0" />

          <div className="relative z-10 max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
              <div className="liquid-glass inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm mb-6">
                <span className="text-lp-foreground/70">Core Platform</span>
                <ChevronRight className="size-3 text-lp-muted-foreground" />
                <span className="text-lp-primary">Capabilities</span>
              </div>
              <h2 className="text-lp-hero-heading text-3xl sm:text-5xl font-semibold leading-[1.1] max-w-3xl mx-auto">
                Built for Teams That Ship Relentlessly
              </h2>
              <p className="text-lp-hero-sub text-base mt-4 max-w-xl mx-auto">
                Three pillars that keep your revenue engine humming — AI agents
                working 24/7 while your team sleeps.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {FEATURES.map((f) => (
                <FeatureCard key={f.title} {...f} />
              ))}
            </div>
          </div>
        </HlsBackground>
      </section>

      {/* ════════════════════════════════════════════════════════════════════════
          SECTION 3: CHESS (Video Left, Content Right)
          ════════════════════════════════════════════════════════════════════ */}

      <section className="py-32 px-4">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
          <div className="liquid-glass rounded-3xl aspect-[4/3] overflow-hidden order-1">
            <HlsBackground src={CHESS_HLS}>
              <div className="aspect-[4/3]" />
            </HlsBackground>
          </div>

          <div className="order-2">
            <div className="liquid-glass inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm mb-6">
              <span className="text-lp-foreground/70">Smart Routing</span>
              <span className="text-lp-primary text-xs font-semibold bg-lp-primary/10 px-2 py-0.5 rounded-full">
                New
              </span>
            </div>
            <h2 className="text-lp-hero-heading text-3xl sm:text-4xl font-semibold leading-[1.1] mb-6">
              Every Lead Finds Its Perfect Path
            </h2>
            <p className="text-lp-hero-sub text-base leading-relaxed mb-8">
              AI-powered lead scoring meets adaptive routing. Each prospect is
              matched to the rep, sequence, and cadence most likely to convert —
              in real time.
            </p>
            <ul className="space-y-4 mb-8">
              {[
                "AI-scored lead qualification (BANT framework)",
                "Dynamic SDR rep assignment",
                "Multi-touch attribution across channels",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-lp-hero-sub">
                  <span className="w-1.5 h-1.5 rounded-full bg-lp-primary shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="flex items-center gap-4">
              <a
                href="/register"
                className="inline-flex items-center rounded-full bg-lp-primary text-lp-primary-foreground px-6 py-3 text-base font-medium hover:bg-lp-primary/90 transition-colors"
              >
                See It in Action
              </a>
              <a
                href="/docs"
                className="liquid-glass inline-flex items-center rounded-full px-6 py-3 text-base font-normal text-lp-foreground hover:bg-white/5 transition-colors"
              >
                Read the Docs
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════════
          SECTION 4: REVERSE CHESS (Content Left, Video Right)
          ════════════════════════════════════════════════════════════════════ */}

      <section className="py-32 px-4">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
          <div className="order-2 lg:order-1">
            <div className="liquid-glass inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm mb-6">
              <span className="text-lp-foreground/70">Campaign Builder</span>
              <span className="text-lp-primary text-xs font-semibold bg-lp-primary/10 px-2 py-0.5 rounded-full">
                Beta
              </span>
            </div>
            <h2 className="text-lp-hero-heading text-3xl sm:text-4xl font-semibold leading-[1.1] mb-6">
              Design Campaigns That Actually Close
            </h2>
            <p className="text-lp-hero-sub text-base leading-relaxed mb-8">
              Visual campaign builder with live conversion metrics at every
              stage. Drag-and-drop sequences, A/B test messaging, and see
              exactly where deals advance or stall.
            </p>

            <div className="grid grid-cols-2 gap-4 mb-8">
              {[
                { value: "38%", label: "reply rate (vs 12% industry avg)" },
                { value: "2 min", label: "avg. AI response time" },
                { value: "3.2x", label: "meeting book rate increase" },
                { value: "24/7", label: "always-on lead engagement" },
              ].map((s) => (
                <div key={s.label} className="liquid-glass rounded-2xl p-4 text-center">
                  <p className="text-lp-hero-heading text-2xl font-semibold tracking-tight">
                    {s.value}
                  </p>
                  <p className="text-lp-muted-foreground text-xs mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            <a
              href="/register"
              className="inline-flex items-center rounded-full bg-lp-primary text-lp-primary-foreground px-6 py-3 text-base font-medium hover:bg-lp-primary/90 transition-colors"
            >
              Try Campaign Builder
            </a>
          </div>

          <div className="liquid-glass rounded-3xl aspect-[4/3] overflow-hidden order-1 lg:order-2">
            <HlsBackground src={REVERSE_CHESS_HLS}>
              <div className="aspect-[4/3]" />
            </HlsBackground>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════════
          SECTION 5: NUMBERS (Full-Width HLS Background)
          ════════════════════════════════════════════════════════════════════ */}

      <section className="relative py-32">
        <HlsBackground
          src={NUMBERS_HLS}
          overlayClass="bg-gradient-to-t from-lp-background via-lp-background/[0.85] to-lp-background/[0.15]"
        >
          <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
            <div className="mb-24">
              <p className="text-7xl sm:text-[8rem] lg:text-[10rem] font-semibold tracking-tighter text-lp-hero-heading leading-none">
                50K+
              </p>
              <p className="text-lp-hero-sub text-xl mt-4">
                AI-qualified conversations handled across 2,400+ teams
              </p>
              <p className="text-lp-muted-foreground text-sm mt-2 max-w-md mx-auto">
                Aggregate platform metrics — Q1–Q4 2025. SalesAgent processes
                thousands of AI-driven interactions daily.
              </p>
            </div>

            <div className="liquid-glass rounded-3xl p-12 grid md:grid-cols-2 max-w-3xl mx-auto">
              <div className="text-center md:border-r border-lp-border/50 md:pr-12">
                <p className="text-5xl sm:text-6xl font-semibold text-lp-hero-heading tracking-tight">
                  12,847
                </p>
                <p className="text-lp-hero-sub text-sm mt-2">
                  AI-qualified leads this month
                </p>
              </div>
              <div className="text-center md:pl-12 mt-8 md:mt-0">
                <p className="text-5xl sm:text-6xl font-semibold text-lp-hero-heading tracking-tight">
                  99.97%
                </p>
                <p className="text-lp-hero-sub text-sm mt-2">Platform uptime</p>
              </div>
            </div>
          </div>
        </HlsBackground>
      </section>

      {/* ════════════════════════════════════════════════════════════════════════
          SECTION 6: TESTIMONIALS
          ════════════════════════════════════════════════════════════════════ */}

      <section className="py-32 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-lp-hero-heading text-3xl sm:text-5xl font-semibold leading-[1.1]">
              Trusted by Revenue
              <br />
              Leaders Everywhere
            </h2>
            <p className="text-lp-hero-sub text-base mt-4">
              Hear from the teams that made the switch to AI SDRs.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 items-start">
            {TESTIMONIALS.map((t, i) => (
              <div
                key={t.name}
                className={`liquid-glass rounded-3xl p-8 ${i === 1 ? "md:-translate-y-6" : ""}`}
              >
                <blockquote className="text-lp-hero-sub text-sm leading-relaxed">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <div className="mt-6 pt-5 border-t border-lp-border/50 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-lp-secondary flex items-center justify-center text-sm font-semibold text-lp-hero-sub">
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-lp-foreground text-sm font-medium">{t.name}</p>
                    <p className="text-lp-muted-foreground text-xs">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════════
          SECTION 7: CTA + FOOTER (Shared HLS Background)
          ════════════════════════════════════════════════════════════════════ */}

      <section className="relative">
        <HlsBackground
          src={CTA_HLS}
          overlayClass="bg-gradient-to-b from-lp-background via-lp-background/[0.85] to-lp-background/[0.15]"
        >
          {/* CTA */}
          <div className="relative z-10 flex justify-center px-4 pt-32 pb-20">
            <div className="liquid-glass rounded-[2rem] p-12 sm:p-20 text-center max-w-2xl w-full">
              <h2 className="text-lp-hero-heading text-3xl sm:text-5xl font-semibold leading-[1.1]">
                Ready to Deploy Your AI SDR?
              </h2>
              <p className="text-lp-hero-sub text-base mt-4 max-w-md mx-auto">
                Set up your first AI sales agent in minutes. Qualify leads, run
                campaigns, and book meetings — automatically. No credit card
                required.
              </p>
              <div className="flex items-center justify-center gap-4 mt-8">
                <a
                  href="/register"
                  className="inline-flex items-center rounded-full bg-lp-primary text-lp-primary-foreground px-6 py-3 text-base font-medium hover:bg-lp-primary/90 transition-colors"
                >
                  Start Free Today
                </a>
                <a
                  href="/api/demo-login"
                  className="liquid-glass inline-flex items-center rounded-full px-6 py-3 text-base font-normal text-lp-foreground hover:bg-white/5 transition-colors"
                >
                  Try Live Demo →
                </a>
              </div>
            </div>
          </div>

          {/* Footer */}
          <footer className="relative z-10 border-t border-lp-border/30 pt-16 pb-8 px-4">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-16">
                <div className="col-span-2">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-b from-lp-secondary to-lp-muted flex items-center justify-center">
                      <CrosshairIcon className="size-4 text-lp-primary" />
                    </div>
                    <span className="text-xl font-semibold text-lp-foreground">
                      SalesAgent
                    </span>
                  </div>
                  <p className="text-lp-muted-foreground text-sm max-w-xs">
                    AI SDR platform — qualify leads, automate follow-ups, and
                    book meetings. Built for modern GTM teams.
                  </p>
                </div>

                {Object.entries(FOOTER_LINKS).map(([category, links]) => (
                  <div key={category}>
                    <p className="text-lp-foreground text-sm font-medium mb-3">
                      {category}
                    </p>
                    <ul className="space-y-2">
                      {links.map((link) => (
                        <li key={link}>
                          <a
                            href="#"
                            className="text-lp-muted-foreground text-sm hover:text-lp-foreground transition-colors"
                          >
                            {link}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="border-t border-lp-border/30 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-lp-muted-foreground">
                <span>&copy; 2026 SalesAgent AI. All rights reserved.</span>
                <div className="flex items-center gap-6">
                  <a href="#" className="hover:text-lp-foreground transition-colors">
                    Privacy
                  </a>
                  <a href="#" className="hover:text-lp-foreground transition-colors">
                    Terms
                  </a>
                  <a href="#" className="hover:text-lp-foreground transition-colors">
                    Cookies
                  </a>
                </div>
              </div>
            </div>
          </footer>
        </HlsBackground>
      </section>
    </div>
  );
}
