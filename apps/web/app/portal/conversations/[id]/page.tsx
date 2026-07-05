import { notFound } from "next/navigation";
import { ArrowLeft, Bot, User, Clock } from "lucide-react";

/**
 * Customer Portal — Conversation detail.
 * Phase 19: Skeleton with demo data. Will be wired to Conversation + Message queries
 * scoped to the customer's Lead records.
 */

const DEMO_MESSAGES: Record<string, Array<{
  id: string; direction: "inbound" | "outbound"; content: string; sender: string; time: string;
}>> = {
  "demo-1": [
    { id: "m1", direction: "inbound", content: "你好！我在你们网站上看到了 AI 销售助手这个产品，想了解一下定价和功能。我们是一个 50 人的 SaaS 团队，主要做 B2B 销售。", sender: "您", time: "今天 14:30" },
    { id: "m2", direction: "outbound", content: "您好！感谢您的关注。我们的 AI 销售助手专为 B2B SaaS 团队设计，主要功能包括：\n\n1. **AI 自动跟进**：7×24 小时自动处理客户咨询和邮件跟进\n2. **线索智能评分**：基于 BANT 维度自动评估线索质量\n3. **知识库 RAG**：上传产品文档后，AI 能准确回答客户问题\n4. **多渠道统一**：邮件、网站聊天、企微消息统一管理\n\n对于 50 人团队，推荐企业版方案，价格在 ¥2,980/月。您方便约一个 15 分钟的演示吗？", sender: "AI 销售助理", time: "今天 14:32" },
    { id: "m3", direction: "inbound", content: "价格比我们预期的高一些。能详细说一下企业版和标准版的区别吗？我们也想看一个 demo。", sender: "您", time: "今天 14:35" },
    { id: "m4", direction: "outbound", content: "当然！这是两个版本的对比：\n\n**标准版**（¥980/月）\n- 1 个 AI Agent\n- 5,000 条消息/月\n- 基础 RAG 知识库\n- 邮件渠道\n\n**企业版**（¥2,980/月）\n- 5 个 AI Agent\n- 无限制消息\n- 高级 RAG（混合检索）\n- 全渠道（邮件+企微+网站）\n- API 接入\n- 专用客户成功经理\n\n您这边方便的话，我帮您安排明天下午的 Demo？预计 30 分钟。", sender: "AI 销售助理", time: "今天 14:38" },
    { id: "m5", direction: "inbound", content: "感谢您的详细解答！我们团队会在本周内讨论并给您反馈。Demo 的话，明天下午 3 点可以吗？", sender: "您", time: "今天 14:42" },
  ],
  "demo-2": [
    { id: "m1", direction: "inbound", content: "我们公司对数据安全要求比较高，想了解一下你们的私有化部署方案。", sender: "您", time: "昨天 10:00" },
    { id: "m2", direction: "outbound", content: "您好！我们支持混合云和完全私有化部署两种方案。\n\n**混合云方案**：核心 AI 引擎部署在您自己的服务器上，管理后台使用我们的云端。适合中型团队，部署周期 1-2 周。\n\n**完全私有化方案**：全部组件部署在您自己的基础设施上，包括 Web 后台、Worker、数据库。适合大型企业，部署周期 3-4 周。\n\n请问您方便透露一下团队规模和具体的合规要求吗？这样我可以给您更精准的建议。", sender: "AI 销售助理", time: "昨天 10:03" },
    { id: "m3", direction: "inbound", content: "请问私有化部署的具体时间周期是多久？我们需要评估上线时间。", sender: "您", time: "1 小时前" },
  ],
};

export default async function PortalConversationDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const messages = DEMO_MESSAGES[params.id];
  if (!messages) {
    // In production, this should be a proper 404 or redirect
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-text-muted">Conversation not found.</p>
        <a href="/portal/conversations" className="text-accent text-sm hover:underline mt-2 inline-block">
          ← Back to conversations
        </a>
      </div>
    );
  }

  const subject = params.id === "demo-1" ? "产品演示和报价咨询" : "企业版定制方案";

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <a
          href="/portal/conversations"
          className="size-8 rounded-lg border border-border flex items-center justify-center hover:bg-bg-subtle transition-colors shrink-0"
        >
          <ArrowLeft className="size-4 text-text-muted" />
        </a>
        <div className="min-w-0">
          <h1 className="text-sm font-semibold text-text truncate">{subject}</h1>
          <p className="text-xs text-text-muted">AI 销售助理 · 在线</p>
        </div>
      </div>

      {/* Messages */}
      <div className="space-y-4 mb-6">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.direction === "inbound" ? "justify-end" : "justify-start"}`}
          >
            {msg.direction === "outbound" && (
              <div className="size-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 mt-1">
                <Bot className="size-4 text-accent" />
              </div>
            )}

            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.direction === "inbound"
                  ? "bg-accent text-white rounded-br-md"
                  : "bg-bg-card border border-border rounded-bl-md"
              }`}
            >
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              <div
                className={`flex items-center gap-1 mt-2 text-xs ${
                  msg.direction === "inbound" ? "text-white/60" : "text-text-muted"
                }`}
              >
                <Clock className="size-3" />
                <span>{msg.time}</span>
              </div>
            </div>

            {msg.direction === "inbound" && (
              <div className="size-8 rounded-lg bg-accent/20 flex items-center justify-center shrink-0 mt-1">
                <User className="size-4 text-accent" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Input area — skeleton, disabled */}
      <div className="sticky bottom-4">
        <div className="glass-card p-3 flex items-center gap-3">
          <input
            type="text"
            placeholder="Type your message... (Phase 20)"
            disabled
            className="flex-1 rounded-xl border border-border bg-bg px-3.5 py-2.5 text-sm text-text-muted placeholder:text-text-muted/50 cursor-not-allowed"
          />
          <button
            disabled
            className="rounded-xl bg-accent/40 text-white/60 text-sm font-medium px-5 py-2.5 cursor-not-allowed shrink-0"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
