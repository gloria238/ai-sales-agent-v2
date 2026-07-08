import { prisma } from "@salesagent/db";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function DocsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const membership = await prisma.membership.findFirst({
    where: { userId: session.userId, organizationId: session.orgId },
  });
  if (!membership) redirect("/login");

  const endpoints = [
    // Auth
    { method: "POST", path: "/api/auth/login", auth: "None", desc: "Login with email and password" },
    { method: "POST", path: "/api/auth/register", auth: "None", desc: "Register a new account" },
    { method: "POST", path: "/api/auth/verify", auth: "None", desc: "Verify email with token" },
    { method: "POST", path: "/api/auth/logout", auth: "JWT", desc: "Logout current session" },
    // Organizations
    { method: "GET", path: "/api/orgs", auth: "JWT", desc: "List user's organizations" },
    { method: "GET", path: "/api/orgs/:slug", auth: "JWT", desc: "Get organization details" },
    // Leads
    { method: "GET", path: "/api/orgs/:slug/leads", auth: "JWT", desc: "List leads (search, filter, paginate)" },
    { method: "POST", path: "/api/orgs/:slug/leads", auth: "JWT", desc: "Create a new lead" },
    { method: "GET", path: "/api/orgs/:slug/leads/:id", auth: "JWT", desc: "Get lead details" },
    { method: "PATCH", path: "/api/orgs/:slug/leads/:id", auth: "JWT", desc: "Update a lead" },
    { method: "DELETE", path: "/api/orgs/:slug/leads/:id", auth: "JWT", desc: "Delete a lead" },
    { method: "GET", path: "/api/orgs/:slug/leads/export", auth: "JWT", desc: "Export leads as CSV" },
    { method: "POST", path: "/api/orgs/:slug/leads/import", auth: "JWT", desc: "Import leads from CSV" },
    // Conversations
    { method: "GET", path: "/api/orgs/:slug/conversations", auth: "JWT", desc: "List conversations" },
    { method: "GET", path: "/api/orgs/:slug/conversations/:id", auth: "JWT", desc: "Get conversation with messages" },
    { method: "PATCH", path: "/api/orgs/:slug/conversations/:id", auth: "JWT", desc: "Update conversation status" },
    { method: "GET", path: "/api/orgs/:slug/conversations/:id/messages", auth: "JWT", desc: "Get messages" },
    { method: "POST", path: "/api/orgs/:slug/conversations/:id/messages", auth: "JWT", desc: "Send reply" },
    { method: "POST", path: "/api/orgs/:slug/conversations/:id/ai-draft", auth: "JWT", desc: "Generate AI reply draft" },
    { method: "GET", path: "/api/orgs/:slug/inbox/stats", auth: "JWT", desc: "Inbox statistics" },
    // Agents
    { method: "GET", path: "/api/orgs/:slug/agents", auth: "JWT", desc: "List AI SDR agents" },
    { method: "POST", path: "/api/orgs/:slug/agents", auth: "JWT", desc: "Create an AI agent" },
    { method: "GET", path: "/api/orgs/:slug/agents/:id", auth: "JWT", desc: "Get agent details" },
    { method: "PATCH", path: "/api/orgs/:slug/agents/:id", auth: "JWT", desc: "Update agent configuration" },
    { method: "DELETE", path: "/api/orgs/:slug/agents/:id", auth: "JWT", desc: "Delete an agent" },
    // Campaigns
    { method: "GET", path: "/api/orgs/:slug/campaigns", auth: "JWT", desc: "List outbound campaigns" },
    { method: "POST", path: "/api/orgs/:slug/campaigns", auth: "JWT", desc: "Create a campaign" },
    { method: "GET", path: "/api/orgs/:slug/campaigns/:id", auth: "JWT", desc: "Get campaign + stats" },
    { method: "PATCH", path: "/api/orgs/:slug/campaigns/:id", auth: "JWT", desc: "Update campaign" },
    { method: "POST", path: "/api/orgs/:slug/campaigns/:id/start", auth: "JWT", desc: "Start campaign execution" },
    { method: "GET", path: "/api/orgs/:slug/campaigns/:id/runs", auth: "JWT", desc: "List campaign runs" },
    // Scripts
    { method: "GET", path: "/api/orgs/:slug/scripts", auth: "JWT", desc: "List scripts" },
    { method: "POST", path: "/api/orgs/:slug/scripts", auth: "JWT", desc: "Install script template" },
    // Members & Settings
    { method: "GET", path: "/api/orgs/:slug/members", auth: "JWT", desc: "List organization members" },
    { method: "POST", path: "/api/orgs/:slug/members", auth: "JWT", desc: "Invite a member" },
    { method: "GET", path: "/api/orgs/:slug/audit-log", auth: "JWT", desc: "List audit log entries" },
    { method: "GET", path: "/api/orgs/:slug/api-keys", auth: "JWT", desc: "List API keys" },
    { method: "POST", path: "/api/orgs/:slug/api-keys", auth: "JWT", desc: "Create API key" },
    // AI
    { method: "POST", path: "/api/orgs/:slug/ai/compose-response", auth: "JWT", desc: "AI compose reply draft" },
    { method: "POST", path: "/api/orgs/:slug/ai/score-lead", auth: "JWT", desc: "AI lead qualification scoring" },
    { method: "POST", path: "/api/orgs/:slug/ai/summarize-conversation", auth: "JWT", desc: "AI conversation summary" },
    { method: "POST", path: "/api/orgs/:slug/ai/generate-script", auth: "JWT", desc: "AI generate sales script" },
  ];

  const methodColor = (m: string) => ({
    GET: "bg-primary/10 text-primary",
    POST: "bg-bg-subtle text-lp-hero-sub",
    PUT: "bg-warning/10 text-warning",
    PATCH: "bg-warning/10 text-warning",
    DELETE: "bg-danger/10 text-danger",
  }[m] || "bg-bg-subtle text-text-muted");

  const sections = ["Auth", "Organizations", "Leads", "Conversations", "Agents", "Campaigns", "Scripts", "Members & Settings", "AI"];

  return (
    <div className="max-w-4xl p-4 lg:p-6">
      <h1 className="text-2xl font-bold text-text mb-2">API Reference</h1>
      <p className="text-text-muted mb-8">
        {endpoints.length} endpoints across auth, leads, conversations, agents, campaigns, and AI.
      </p>
      <div className="space-y-6">
        {sections.map((section) => (
          <div key={section}>
            <h2 className="text-lg font-semibold text-text mb-3">{section}</h2>
            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-bg-subtle">
                  <tr>
                    <th className="text-left px-4 py-2 text-xs font-medium text-text-muted w-16">Method</th>
                    <th className="text-left px-4 py-2 text-xs font-medium text-text-muted">Path</th>
                    <th className="text-left px-4 py-2 text-xs font-medium text-text-muted w-20">Auth</th>
                    <th className="text-left px-4 py-2 text-xs font-medium text-text-muted">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {endpoints
                    .filter((e) => {
                      const sec = section.toLowerCase();
                      if (sec === "auth") return e.path.includes("/api/auth");
                      if (sec === "organizations") return e.path.match(/^\/api\/orgs$/) || e.path.match(/^\/api\/orgs\/:slug$/);
                      if (sec === "leads") return e.path.includes("/leads");
                      if (sec === "conversations") return e.path.includes("/conversations") || e.path.includes("/inbox");
                      if (sec === "agents") return e.path.includes("/agents");
                      if (sec === "campaigns") return e.path.includes("/campaigns");
                      if (sec === "scripts") return e.path.includes("/scripts");
                      if (sec === "members & settings") return e.path.includes("/members") || e.path.includes("/audit") || e.path.includes("/api-keys");
                      if (sec === "ai") return e.path.includes("/ai/");
                      return false;
                    })
                    .map((e) => (
                      <tr key={e.method + e.path} className="border-t border-lp-border/20">
                        <td className="px-4 py-2"><span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${methodColor(e.method)}`}>{e.method}</span></td>
                        <td className="px-4 py-2 font-mono text-xs text-text-secondary">{e.path}</td>
                        <td className="px-4 py-2 text-xs text-text-muted">{e.auth}</td>
                        <td className="px-4 py-2 text-xs text-text-muted">{e.desc}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
