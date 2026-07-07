import Link from "next/link";
import { MessageSquare, Clock, ArrowRight } from "lucide-react";

/**
 * Customer Portal — Conversation list.
 * Phase 19: Skeleton with demo data. Will be wired to Lead.userId scoped queries.
 * Each customer sees only conversations linked to their Lead record.
 */

// Demo conversations shown when no real data (skeleton mode)
const DEMO_CONVERSATIONS = [
  {
    id: "demo-1",
    subject: "产品演示和报价咨询",
    lastMessage: "感谢您的详细解答！我们团队会在本周内讨论并给您反馈。",
    agentName: "AI 销售助理",
    updatedAt: "2 分钟前",
    unread: true,
  },
  {
    id: "demo-2",
    subject: "企业版定制方案",
    lastMessage: "请问私有化部署的具体时间周期是多久？我们需要评估上线时间。",
    agentName: "AI 销售助理",
    updatedAt: "1 小时前",
    unread: false,
  },
  {
    id: "demo-3",
    subject: "售后服务和技术支持",
    lastMessage: "好的，我这边把技术文档发给您参考。有任何问题随时联系我。",
    agentName: "AI 客服助理",
    updatedAt: "昨天",
    unread: false,
  },
];

export default function PortalConversationsPage() {
  // Phase 19: In the wired version, this would be:
  //   const session = await getPortalSession();
  //   const leads = await prisma.lead.findMany({ where: { userId: session.userId } });
  //   const conversations = await prisma.conversation.findMany({
  //     where: { leadId: { in: leads.map(l => l.id) } },
  //     include: { messages: { orderBy: { createdAt: "desc" }, take: 1 }, agent: true },
  //   });

  const conversations = DEMO_CONVERSATIONS;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 animate-slide-up">
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight text-text">我的对话</h1>
        <p className="text-sm text-text-secondary mt-1">与 AI 助理的消息记录</p>
      </div>

      {conversations.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <MessageSquare className="size-10 text-text-muted mx-auto mb-3 opacity-30" />
          <p className="text-sm text-text-muted">No conversations yet.</p>
          <p className="text-xs text-text-muted mt-1">Start a conversation from our website or contact page.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map((conv) => (
            <Link
              key={conv.id}
              href={`/portal/conversations/${conv.id}`}
              className="block glass-card p-4 sm:p-5 hover:border-accent/30 hover:shadow-md transition-all duration-200 group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-text truncate">{conv.subject}</h3>
                    {conv.unread && (
                      <span className="shrink-0 size-2 rounded-full bg-accent animate-pulse" />
                    )}
                  </div>
                  <p className="text-sm text-text-secondary truncate">{conv.lastMessage}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-text-muted">{conv.agentName}</span>
                    <span className="text-xs text-text-muted flex items-center gap-1">
                      <Clock className="size-3" />
                      {conv.updatedAt}
                    </span>
                  </div>
                </div>
                <ArrowRight className="size-4 text-text-muted group-hover:text-accent group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Future: Resource Center section */}
      <div className="mt-8 pt-6 border-t border-border">
        <h2 className="text-sm font-semibold text-text mb-3">资源中心</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: "产品手册", desc: "查看最新产品文档和方案介绍" },
            { label: "报价单", desc: "下载您的专属报价和合同模板" },
          ].map((r) => (
            <div
              key={r.label}
              className="glass-card p-4 hover:border-accent/30 transition-all duration-200 cursor-pointer group"
            >
              <h3 className="text-sm font-medium text-text group-hover:text-accent transition-colors">{r.label}</h3>
              <p className="text-xs text-text-muted mt-1">{r.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
