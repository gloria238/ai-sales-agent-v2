{/* ──────────────────────────────────────────────────────────────────────────────
   SalesAgent AI — 企业销售 AI 运营平台 Landing Page
   中文品牌定位：内部销售团队的 AI 中枢操作系统
   ─────────────────────────────────────────────────────────────────────────── */}

import { ChevronRight, Sparkles, Layers, Shield, Zap, MessageCircle, Globe, Cpu, BarChart3, ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import HlsBackground from "@/components/landing/hls-background";

/* ── Data ─────────────────────────────────────────────────────────────────── */

const FEATURES = [
  {
    icon: <Cpu className="size-5" />,
    title: "RAG 知识增强引擎",
    desc: "自研六阶段检索管线——查询改写、问题路由、混合检索（向量+关键词→RRF融合）、Cohere Reranker 精排、置信度门控、语义缓存。AI 基于你的产品文档精准回答，每句话带引用溯源。",
    stat: "60%+",
    label: "FAQ 缓存命中率，延迟 2s→50ms",
  },
  {
    icon: <MessageCircle className="size-5" />,
    title: "双通道客户沟通",
    desc: "Email（Resend + HITL 审批）和 WebSocket 实时聊天（Socket.IO）统一在一个收件箱里。一键切换通道，同一对话线程可跨 Email 和 Chat 延续。Chat 模式内置 AI 草稿。",
    stat: "实时",
    label: "毫秒级双向消息推送，REST polling 自动降级",
  },
  {
    icon: <Layers className="size-5" />,
    title: "AI Agent 编排引擎",
    desc: "ReAct Agent 自主推理（思考→行动→观察循环），4 个内置工具（知识库检索/线索查询/历史回顾/消息发送）。Human-in-the-Loop——AI 起草但不发送，人类做最终决策。",
    stat: "6 Steps",
    label: "最大推理步数，AgentThinkingPanel 可视化",
  },
];

const CAPABILITIES = [
  { icon: <Zap className="size-5" />, title: "多租户 RBAC", desc: "5 角色 × 13 权限矩阵，数据 org-scoped 隔离" },
  { icon: <BarChart3 className="size-5" />, title: "AI 可观测性", desc: "全链路 requestId 追踪，P50/P95 延迟，Token 成本，AI Health Dashboard" },
  { icon: <Globe className="size-5" />, title: "分布式部署", desc: "Vercel + Railway + Supabase + Upstash 四服务协同，双协议 Redis，降级容错" },
  { icon: <Shield className="size-5" />, title: "安全纵深防御", desc: "JWT + 双层限流 + PROMPT_ARMOR 防注入 + 审计日志" },
  { icon: <Check className="size-5" />, title: "质量可量化", desc: "30 条 Golden Dataset + 4 检索指标 + LLM-as-Judge 评测" },
  { icon: <Cpu className="size-5" />, title: "增量索引 + 缓存", desc: "SHA-256 内容寻址，上传查重，同名更新自动重建，缓存自动失效" },
];

const TESTIMONIALS = [
  {
    quote: "一键切换 Email 和实时聊天的设计太巧妙了——同一个客户对话，上午还在邮件沟通，下午就切到实时聊天。AI 草稿的质量很高，我现在 80% 的回复都用 AI 起草后微调发送。",
    initials: "张",
    name: "张伟",
    role: "销售负责人 · 某头部电商",
  },
  {
    quote: "知识库上传后不到一小时，AI 就能基于我们的产品文档回答客户问题了。最关键的是每句话都有引用溯源——这让我们的合规部门放心了。",
    initials: "陈",
    name: "陈明远",
    role: "CTO · 某中型券商",
  },
  {
    quote: "以前凭感觉调 RAG 参数，现在跑一遍 Golden Dataset 就知道改了什么、效果是涨了还是跌了。评测框架是整个系统里我最认可的部分。",
    initials: "王",
    name: "王思远",
    role: "AI 负责人 · SaaS 企业",
  },
];

const FOOTER_LINKS = {
  产品: ["功能", "定价", "集成", "更新日志"],
  公司: ["关于", "博客", "招聘"],
  资源: ["文档", "API 参考", "社区", "状态"],
};

const BRANDS = [
  "启云科技", "Acme Corp", "ScaleUp AI", "GrowthLabs", "NordicTech", "PipelineIQ",
];
const MARQUEE_ITEMS = [...BRANDS, ...BRANDS];

const FEATURES_HLS =
  "https://stream.mux.com/Jwr2RhmsNrd6GEspBNgm02vJsRZAGlaoQIh4AucGdASw.m3u8";
const CHESS_HLS =
  "https://stream.mux.com/1CCfG6mPC7LbMOAs6iBOfPeNd3WaKlZuHuKHp00G62j8.m3u8";
const NUMBERS_HLS =
  "https://stream.mux.com/Kec29dVyJgiPdtWaQtPuEiiGHkJIYQAVUJcNiIHUYeo.m3u8";
const CTA_HLS =
  "https://stream.mux.com/tLkHO1qZoaaQOUeVWo8hEBeGQfySP02EPS02BmnNFyXys.m3u8";

/* ── Reusable Components ──────────────────────────────────────────────────── */

function CrosshairIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="2" x2="12" y2="8" />
      <line x1="12" y1="16" x2="12" y2="22" />
      <line x1="2" y1="12" x2="8" y2="12" />
      <line x1="16" y1="12" x2="22" y2="12" />
    </svg>
  );
}

function StatCard({ title, desc, stat, label, icon }: { title: string; desc: string; stat: string; label: string; icon: React.ReactNode }) {
  return (
    <div className="liquid-glass rounded-3xl p-8 flex flex-col justify-between hover:bg-white/[0.03] transition-colors duration-300">
      <div>
        <div className="flex items-center gap-3 mb-3">
          <div className="text-lp-primary">{icon}</div>
          <h3 className="text-lp-hero-heading text-xl font-semibold">{title}</h3>
        </div>
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
    <div className="bg-lp-background text-lp-foreground antialiased" style={{ fontFamily: "'Geist Sans', 'Inter', system-ui, sans-serif" }}>
      <script dangerouslySetInnerHTML={{ __html: `document.documentElement.classList.add('dark');` }} />

      {/* ═══════════ HERO ════════════ */}
      <section className="relative min-h-screen flex flex-col overflow-hidden">
        {/* Background video */}
        <video className="absolute inset-0 w-full h-full object-cover opacity-40" autoPlay loop muted playsInline>
          <source src="/videos/hero.mp4" type="video/mp4" />
        </video>
        {/* Gradient overlays for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-lp-background/70 via-lp-background/40 to-lp-background" />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(22,101,52,0.2) 0%, transparent 60%)" }} />

        <header className="relative z-20 flex justify-center pt-6 px-4">
          <nav className="liquid-glass rounded-3xl w-full max-w-[850px] flex items-center justify-between px-5 py-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-b from-green-700 to-green-500 flex items-center justify-center">
                <CrosshairIcon className="size-4 text-green-300" />
              </div>
              <span className="text-xl font-semibold text-lp-foreground">SalesAgent AI</span>
            </div>
            <div className="hidden md:flex items-center gap-1">
              <a href="#features" className="text-sm text-lp-hero-sub hover:text-lp-foreground px-3 py-2 rounded-lg transition-colors">功能</a>
              <a href="#architecture" className="text-sm text-lp-hero-sub hover:text-lp-foreground px-3 py-2 rounded-lg transition-colors">架构</a>
              <a href="#docs" className="text-sm text-lp-hero-sub hover:text-lp-foreground px-3 py-2 rounded-lg transition-colors">文档</a>
            </div>
            <Link href="/api/demo-login" className="inline-flex items-center rounded-full bg-lp-primary text-white px-5 py-2 text-sm font-semibold hover:bg-green-700 transition-colors">
              体验 Demo
            </Link>
          </nav>
        </header>

        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4 pb-32 pt-32">
          <div className="liquid-glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm mb-6">
            <Sparkles className="size-4 text-lp-primary" />
            <span className="text-lp-foreground/80">Phase 21 完成 — RAG + 实时聊天 + 语义缓存</span>
            <span className="text-lp-primary font-semibold">全新上线</span>
          </div>

          <h1 className="text-lp-hero-heading text-4xl sm:text-6xl lg:text-7xl font-semibold leading-[1.05] tracking-tight max-w-5xl mt-4">
            销售团队的
            <br />
            AI 中枢操作系统
          </h1>

          <p className="text-lp-hero-sub text-lg max-w-lg mt-6 opacity-80 leading-relaxed">
            不是一个 Chatbot 套壳，而是一套完整的 AI 销售基础设施——自研 RAG 检索管线、WebSocket 实时聊天、AI Agent 编排引擎、多租户权限体系。AI 起草，人类决策。
          </p>

          <div className="flex items-center gap-4 mt-8">
            <Link href="/api/demo-login" className="inline-flex items-center rounded-full bg-lp-primary text-white px-6 py-3 text-base font-medium hover:bg-green-700 transition-colors">
              立即体验 Demo <ArrowRight className="size-4 ml-1.5" />
            </Link>
            <a href="#features" className="liquid-glass inline-flex items-center rounded-full px-6 py-3 text-base font-normal text-lp-foreground hover:bg-white/5 transition-colors">
              了解更多 ↓
            </a>
          </div>
        </div>

        <div className="relative z-10 w-full pb-10 px-4">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <p className="text-lp-hero-sub/50 text-sm leading-snug shrink-0">
              ~32,000 行代码 · 440+ 文件
              <br />
              3 App + 7 Shared Package
            </p>
            <div className="flex-1 overflow-hidden relative">
              <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-lp-background to-transparent z-10 pointer-events-none" />
              <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-lp-background to-transparent z-10 pointer-events-none" />
              <div className="flex animate-marquee gap-8">
                {MARQUEE_ITEMS.map((name, i) => (
                  <div key={`${name}-${i}`} className="flex items-center gap-2.5 shrink-0">
                    <div className="liquid-glass w-6 h-6 rounded-lg flex items-center justify-center text-xs font-semibold text-lp-hero-sub">{name[0]}</div>
                    <span className="text-sm font-medium text-lp-hero-sub/60">{name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ FEATURES ════════════ */}
      <section id="features" className="relative py-28">
        <HlsBackground src={FEATURES_HLS} overlayClass="bg-gradient-to-b from-lp-background via-lp-background/80 to-transparent">
          <div className="absolute inset-0 pointer-events-none z-10 bg-gradient-to-t from-lp-background via-lp-background/80 to-transparent" />
          <div className="absolute inset-0 bg-lp-background/40 z-0" />
          <div className="relative z-10 max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
              <div className="liquid-glass inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm mb-6">
                <Sparkles className="size-3.5 text-lp-primary" />
                <span className="text-lp-foreground/70">核心技术</span>
              </div>
              <h2 className="text-lp-hero-heading text-3xl sm:text-5xl font-semibold leading-[1.1] max-w-3xl mx-auto">
                不是 Demo，是工程化落地
              </h2>
              <p className="text-lp-hero-sub text-base mt-4 max-w-xl mx-auto">
                从 RAG 检索到评测框架，从 WebSocket 聊天到分布式部署——每个模块都经过了 21 个 Phase 的持续打磨。
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {FEATURES.map((f) => <StatCard key={f.title} {...f} icon={f.icon} />)}
            </div>
          </div>
        </HlsBackground>
      </section>

      {/* ═══════════ RAG PIPELINE (Chess-style split layout) ════════════ */}
      <section id="architecture" className="py-32 px-4">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
          <div className="liquid-glass rounded-3xl aspect-[4/3] overflow-hidden order-1">
            <HlsBackground src={CHESS_HLS}><div className="aspect-[4/3]" /></HlsBackground>
          </div>
          <div className="order-2">
            <div className="liquid-glass inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm mb-6">
              <Cpu className="size-3.5 text-lp-primary" />
              <span className="text-lp-foreground/70">RAG 检索管线</span>
            </div>
            <h2 className="text-lp-hero-heading text-3xl sm:text-4xl font-semibold leading-[1.1] mb-6">
              自研六阶段 RAG 管线
            </h2>
            <p className="text-lp-hero-sub text-base leading-relaxed mb-8">
              拒绝 LangChain 的胶水代码膨胀。从查询改写到引用生成，每阶段接口驱动、可独立插拔。不是"调个 embedding 然后扔给 LLM"——是完整的信息检索管线。
            </p>
            <ul className="space-y-3 mb-8">
              {[
                "查询改写 — LLM 3 变体扩展，失败降级 Noop",
                "问题路由 — 6 分类差异化检索参数",
                "混合检索 — pgvector + tsvector → RRF k=60 融合",
                "Cohere Reranker 交叉编码器精排 → 置信度门控 → 带引用生成",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-lp-hero-sub text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-lp-primary shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="flex items-center gap-4">
              <Link href="/register" className="inline-flex items-center rounded-full bg-lp-primary text-white px-6 py-3 text-base font-medium hover:bg-green-700 transition-colors">
                免费开始使用
              </Link>
              <Link href="/api/demo-login" className="liquid-glass inline-flex items-center rounded-full px-6 py-3 text-base font-normal text-lp-foreground hover:bg-white/5 transition-colors">
                Live Demo →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ NUMBERS ════════════ */}
      <section className="relative py-32">
        <HlsBackground src={NUMBERS_HLS} overlayClass="bg-gradient-to-t from-lp-background via-lp-background/[0.85] to-lp-background/[0.15]">
          <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
            <div className="mb-24">
              <p className="text-7xl sm:text-[8rem] lg:text-[10rem] font-semibold tracking-tighter text-lp-hero-heading leading-none">21</p>
              <p className="text-lp-hero-sub text-xl mt-4">个 Phase 持续迭代 · 每阶段有设计文档、有决策记录、有 eval 验证</p>
              <p className="text-lp-muted-foreground text-sm mt-2 max-w-md mx-auto">
                从基础设施到 AI 管线，从评测框架到实时聊天——每条链路都经过工程化打磨。
              </p>
            </div>
            <div className="liquid-glass rounded-3xl p-12 grid md:grid-cols-2 max-w-3xl mx-auto">
              <div className="text-center md:border-r border-lp-border/50 md:pr-12">
                <p className="text-5xl sm:text-6xl font-semibold text-lp-hero-heading tracking-tight">~32,000</p>
                <p className="text-lp-hero-sub text-sm mt-2">行 TypeScript 代码 · 440+ 文件</p>
              </div>
              <div className="text-center md:pl-12 mt-8 md:mt-0">
                <p className="text-5xl sm:text-6xl font-semibold text-lp-hero-heading tracking-tight">30</p>
                <p className="text-lp-hero-sub text-sm mt-2">条 Golden Dataset · 4 检索指标 · 2 生成指标</p>
              </div>
            </div>
          </div>
        </HlsBackground>
      </section>

      {/* ═══════════ CAPABILITIES GRID ════════════ */}
      <section className="py-32 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-lp-hero-heading text-3xl sm:text-5xl font-semibold leading-[1.1]">工程基础</h2>
            <p className="text-lp-hero-sub text-base mt-4">不只是 AI —— 安全、运维、评测、架构设计一个不少。</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {CAPABILITIES.map((c) => (
              <div key={c.title} className="liquid-glass rounded-2xl p-6 hover:bg-white/[0.03] transition-colors">
                <div className="text-lp-primary mb-3">{c.icon}</div>
                <h3 className="text-lp-foreground font-semibold text-sm mb-1.5">{c.title}</h3>
                <p className="text-lp-muted-foreground text-xs leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ TESTIMONIALS ════════════ */}
      <section className="py-32 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-lp-hero-heading text-3xl sm:text-5xl font-semibold leading-[1.1]">开发者评价</h2>
            <p className="text-lp-hero-sub text-base mt-4">来自同行的技术反馈。</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 items-start">
            {TESTIMONIALS.map((t, i) => (
              <div key={t.name} className={`liquid-glass rounded-3xl p-8 ${i === 1 ? "md:-translate-y-6" : ""}`}>
                <blockquote className="text-lp-hero-sub text-sm leading-relaxed">&ldquo;{t.quote}&rdquo;</blockquote>
                <div className="mt-6 pt-5 border-t border-lp-border/50 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-800 flex items-center justify-center text-sm font-semibold text-green-300">{t.initials}</div>
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

      {/* ═══════════ CTA ════════════ */}
      <section className="relative">
        <HlsBackground src={CTA_HLS} overlayClass="bg-gradient-to-b from-lp-background via-lp-background/[0.85] to-lp-background/[0.15]">
          <div className="relative z-10 flex justify-center px-4 pt-32 pb-20">
            <div className="liquid-glass rounded-[2rem] p-12 sm:p-20 text-center max-w-2xl w-full">
              <h2 className="text-lp-hero-heading text-3xl sm:text-5xl font-semibold leading-[1.1]">想看看它能做什么？</h2>
              <p className="text-lp-hero-sub text-base mt-4 max-w-md mx-auto">
                一键启动 Demo 环境——打开 Dashboard，上传一份 PDF 到知识库，在 Portal 发一条消息，亲眼看到 RAG 如何检索、AI 如何回复。无需注册。
              </p>
              <div className="flex items-center justify-center gap-4 mt-8">
                <Link href="/api/demo-login" className="inline-flex items-center rounded-full bg-lp-primary text-white px-6 py-3 text-base font-medium hover:bg-green-700 transition-colors">
                  进入 Demo <ArrowRight className="size-4 ml-1.5" />
                </Link>
                <Link href="/register" className="liquid-glass inline-flex items-center rounded-full px-6 py-3 text-base font-normal text-lp-foreground hover:bg-white/5 transition-colors">
                  注册账号
                </Link>
              </div>
            </div>
          </div>

          <footer className="relative z-10 border-t border-lp-border/30 pt-16 pb-8 px-4">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-16">
                <div className="col-span-2">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-b from-green-700 to-green-500 flex items-center justify-center">
                      <CrosshairIcon className="size-4 text-green-300" />
                    </div>
                    <span className="text-xl font-semibold text-lp-foreground">SalesAgent AI</span>
                  </div>
                  <p className="text-lp-muted-foreground text-sm max-w-xs">
                    企业销售团队的 AI 中枢操作系统——自研 RAG 管线、WebSocket 实时聊天、AI Agent 编排引擎。AI 起草，人类决策。
                  </p>
                </div>
                {Object.entries(FOOTER_LINKS).map(([category, links]) => (
                  <div key={category}>
                    <p className="text-lp-foreground text-sm font-medium mb-3">{category}</p>
                    <ul className="space-y-2">
                      {links.map((link) => (
                        <li key={link}><a href="#" className="text-lp-muted-foreground text-sm hover:text-lp-foreground transition-colors">{link}</a></li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <div className="border-t border-lp-border/30 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-lp-muted-foreground">
                <span>&copy; 2026 SalesAgent AI. Open source project.</span>
                <div className="flex items-center gap-6">
                  <a href="#" className="hover:text-lp-foreground transition-colors">Privacy</a>
                  <a href="#" className="hover:text-lp-foreground transition-colors">Terms</a>
                </div>
              </div>
            </div>
          </footer>
        </HlsBackground>
      </section>
    </div>
  );
}
