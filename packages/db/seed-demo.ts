// Demo seed: AI SDR client presentation data.
// Usage: pnpm tsx packages/db/seed-demo.ts
//
// Creates "Acme Corp" org with:
//   - 1 owner (demo@acmecorp.com / demo123456)
//   - 3 AI SDR agents (Inbound Qualifier, Outbound SDR, Enterprise Closer)
//   - 15 leads across pipeline stages
//   - 10 conversations with messages
//   - 2 campaigns (one draft, one active)
// All FK-safe — drops Acme Corp data first then recreates.

import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), "packages/db/.env") });

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

function getDatasourceUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL environment variable is required");
  if (url.includes("connection_limit")) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}connection_limit=1`;
}

const prisma = new PrismaClient({
  datasources: { db: { url: getDatasourceUrl() } },
});

const ORG_SLUG = "acme-corp";
const ORG_NAME = "Acme Corp";
const DEMO_EMAIL = "demo@acmecorp.com";
const DEMO_PASSWORD = "demo123456";

async function main() {
  console.log("Seeding demo data...");

  // Clean up existing Acme Corp
  const existingOrg = await prisma.organization.findUnique({ where: { slug: ORG_SLUG } });
  if (existingOrg) {
    console.log("Cleaning up existing Acme Corp data...");
    await prisma.campaignRun.deleteMany({ where: { campaign: { organizationId: existingOrg.id } } });
    await prisma.campaign.deleteMany({ where: { organizationId: existingOrg.id } });
    await prisma.message.deleteMany({ where: { conversation: { organizationId: existingOrg.id } } });
    await prisma.conversation.deleteMany({ where: { organizationId: existingOrg.id } });
    await prisma.script.deleteMany({ where: { organizationId: existingOrg.id } });
    await prisma.agent.deleteMany({ where: { organizationId: existingOrg.id } });
    await prisma.leadActivity.deleteMany({ where: { organizationId: existingOrg.id } });
    await prisma.lead.deleteMany({ where: { organizationId: existingOrg.id } });
    await prisma.membership.deleteMany({ where: { organizationId: existingOrg.id } });
    await prisma.auditLog.deleteMany({ where: { organizationId: existingOrg.id } });
    await prisma.organization.delete({ where: { id: existingOrg.id } });
    const existingUser = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } });
    if (existingUser) await prisma.user.delete({ where: { id: existingUser.id } });
    // Also clean up quick-demo-login user from any prior run
    const demoLoginUserOld = await prisma.user.findUnique({ where: { email: "demo@salesagent.ai" } });
    if (demoLoginUserOld) {
      const demoOrg = await prisma.organization.findUnique({ where: { slug: "demo-workspace" } });
      if (demoOrg) {
        await prisma.membership.deleteMany({ where: { organizationId: demoOrg.id } });
        await prisma.organization.delete({ where: { id: demoOrg.id } }).catch(() => {});
      }
      await prisma.membership.deleteMany({ where: { userId: demoLoginUserOld.id } });
      await prisma.user.delete({ where: { id: demoLoginUserOld.id } });
    }
  }

  // Create org
  const org = await prisma.organization.create({ data: { name: ORG_NAME, slug: ORG_SLUG } });

  // Create primary user
  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const user = await prisma.user.create({
    data: { email: DEMO_EMAIL, name: "Demo User", passwordHash: hash, emailVerified: true },
  });
  await prisma.membership.create({ data: { organizationId: org.id, userId: user.id, role: "owner" } });

  // Create quick-demo-login user (demo@salesagent.ai) — same org
  const demoHash = await bcrypt.hash("demo123456", 10);
  const demoUser = await prisma.user.upsert({
    where: { email: "demo@salesagent.ai" },
    update: {},
    create: { email: "demo@salesagent.ai", name: "Demo Explorer", passwordHash: demoHash, emailVerified: true },
  });
  await prisma.membership.upsert({
    where: { organizationId_userId: { organizationId: org.id, userId: demoUser.id } },
    update: {},
    create: { organizationId: org.id, userId: demoUser.id, role: "owner" },
  });

  // Create 3 AI SDR agents
  const agents = await Promise.all([
    prisma.agent.create({
      data: {
        organizationId: org.id, name: "Inbound Qualifier",
        description: "Handles inbound leads — qualifies, answers product questions, and routes hot leads to SDRs.",
        personality: "Friendly and consultative. Uses SPIN methodology. Asks discovery questions to understand the lead's situation before pitching.",
        goals: [{ type: "qualify_lead", priority: 1, successCriteria: "Lead score > 70 or meeting booked" }],
        knowledgeBase: {
          productDescription: "SalesAgent AI is an AI SDR platform that automates lead qualification, follow-ups, and meeting booking.",
          pricing: "Starter: $49/mo (1 agent, 500 emails). Pro: $149/mo (3 agents, 5000 emails). Enterprise: custom.",
          faq: [
            { question: "How does AI qualification work?", answer: "Our AI scores leads across intent, budget, authority, need, and timeline using conversation signals and profile data." },
            { question: "Can the AI book meetings?", answer: "Yes! The AI can check calendar availability and send meeting invites directly." },
          ],
        },
        isActive: true,
      },
    }),
    prisma.agent.create({
      data: {
        organizationId: org.id, name: "Outbound SDR",
        description: "Runs cold outreach campaigns. Personalizes emails at scale and handles replies.",
        personality: "Direct and value-focused. Uses Challenger methodology. Leads with insights, not features.",
        goals: [{ type: "book_meeting", priority: 1, successCriteria: "Meeting booked on calendar" }],
        knowledgeBase: {
          productDescription: "SalesAgent AI automates outbound sales — AI agents handle prospecting, follow-ups, and reply management.",
          pricing: "Starts at $49/mo. Enterprise plans available.",
        },
        isActive: true,
      },
    }),
    prisma.agent.create({
      data: {
        organizationId: org.id, name: "Enterprise Closer",
        description: "Handles high-value enterprise leads. Manages complex sales cycles with multiple stakeholders.",
        personality: "Professional and strategic. Uses MEDDIC methodology. Focuses on business value and ROI.",
        goals: [{ type: "handle_objection", priority: 1, successCriteria: "Objection resolved and deal advances" }],
        knowledgeBase: {
          productDescription: "Enterprise-grade AI SDR platform with custom agent training, dedicated infrastructure, and SLA guarantees.",
          pricing: "Custom enterprise pricing. Contact sales.",
          competitors: [
            { name: "Gong", strengths: "Call analytics", weaknesses: "No outbound automation" },
            { name: "Outreach.io", strengths: "Sequence automation", weaknesses: "No AI response handling" },
          ],
        },
        isActive: true,
      },
    }),
  ]);

  // Create 15 leads across stages
  const stageDistribution = [
    { stage: "new", count: 3 }, { stage: "contacted", count: 3 }, { stage: "qualified", count: 4 },
    { stage: "proposal", count: 2 }, { stage: "negotiation", count: 1 }, { stage: "closed_won", count: 1 }, { stage: "closed_lost", count: 1 },
  ];

  const leadData: Array<{ name: string; email: string; company: string; stage: string; score: number | null; source: string }> = [];

  const names = [
    { name: "Alice Chen", email: "alice@startup.io", company: "Startup.io" },
    { name: "Bob Martinez", email: "bob@growtech.com", company: "GrowTech" },
    { name: "Carol Davis", email: "carol@scaleup.co", company: "ScaleUp Co" },
    { name: "David Kim", email: "david@saaSFast.com", company: "SaaSFast" },
    { name: "Eva Johansson", email: "eva@nordictech.se", company: "NordicTech" },
    { name: "Frank Wilson", email: "frank@cloudops.io", company: "CloudOps" },
    { name: "Grace Lee", email: "grace@datapipe.com", company: "DataPipe" },
    { name: "Henry Brown", email: "henry@devtools.io", company: "DevTools" },
    { name: "Iris Wang", email: "iris@fintechx.com", company: "FinTechX" },
    { name: "Jack Taylor", email: "jack@apilayer.com", company: "APILayer" },
    { name: "Kate Miller", email: "kate@crmio.com", company: "CRMio" },
    { name: "Leo Patel", email: "leo@healthtech.ai", company: "HealthTech AI" },
    { name: "Maria Garcia", email: "maria@ecomly.com", company: "Ecomly" },
    { name: "Nick Robinson", email: "nick@cybersec.io", company: "CyberSec" },
    { name: "Olivia White", email: "olivia@martech.co", company: "MarTech Co" },
  ];

  let nameIdx = 0;
  for (const { stage, count } of stageDistribution) {
    for (let i = 0; i < count; i++) {
      const n = names[nameIdx++];
      leadData.push({
        ...n,
        stage,
        score: stage === "qualified" || stage === "proposal" ? 70 + Math.floor(Math.random() * 30) :
               stage === "closed_won" ? 85 + Math.floor(Math.random() * 15) :
               stage === "closed_lost" ? 20 + Math.floor(Math.random() * 30) :
               stage === "new" ? null : 30 + Math.floor(Math.random() * 50),
        source: ["website", "referral", "outbound", "linkedin"][Math.floor(Math.random() * 4)],
      });
    }
  }

  const leads = [];
  for (const l of leadData) {
    const lead = await prisma.lead.create({
      data: { organizationId: org.id, name: l.name, email: l.email, company: l.company, stage: l.stage, score: l.score, source: l.source },
    });
    leads.push(lead);
  }

  // Create 10 conversations with messages
  const activeLeads = leads.filter((l) => l.stage !== "closed_won" && l.stage !== "closed_lost").slice(0, 8);
  const conversations = [];
  for (let i = 0; i < activeLeads.length; i++) {
    const lead = activeLeads[i];
    const conv = await prisma.conversation.create({
      data: {
        organizationId: org.id, leadId: lead.id,
        agentId: agents[i % 3].id,
        channel: "email", subject: `Re: ${lead.company} partnership`,
        status: i < 6 ? "active" : "closed",
      },
    });
    conversations.push(conv);
  }

  // Add messages to conversations
  const inboundMessages = [
    "Hi, I'm interested in learning more about your AI SDR platform. Can you tell me about pricing?",
    "We're a SaaS startup with 20 people. Looking to scale outbound without hiring more SDRs. Can your AI handle that?",
    "Your platform looks interesting. How does the AI qualification work? Do we need to train it?",
    "We're currently using Outreach.io but looking for something with better AI capabilities. Can you compare?",
    "Do you support custom email domains and multi-tenant setups? We have 3 brands.",
    "I'd like to see a demo. What's your availability this week?",
  ];

  for (let i = 0; i < conversations.length; i++) {
    const conv = conversations[i];
    const inbound = inboundMessages[i % inboundMessages.length];
    await prisma.message.create({
      data: { conversationId: conv.id, direction: "inbound", content: inbound, channel: "email" },
    });

    if (i < 6) {
      // AI draft response
      const outbound = [
        "Hi! Thanks for reaching out. Our Starter plan is $49/mo for 1 agent and 500 emails/month. Pro is $149/mo for 3 agents and 5,000 emails. Would you like to see a demo?",
        "Absolutely! Our AI SDR agents are designed to scale outbound without adding headcount. One agent can handle 500+ conversations per month. Let me know if you'd like a walkthrough!",
        "Great question — our AI comes pre-trained on B2B sales best practices. You can also customize the agent's personality, knowledge base, and goals. No coding needed.",
        "Happy to compare! Our key differentiators: AI handles replies (not just sends), lead qualification is built-in, and multi-channel support is coming soon. Want a side-by-side comparison?",
        "Yes! We support custom domains, multi-tenant workspaces, and team collaboration with 4 role levels. It's designed for agencies and multi-brand teams.",
        "I'd love to show you! How about Thursday at 2pm ET? Here's a calendar link: [demo call]. Looking forward to it!",
      ];
      await prisma.message.create({
        data: { conversationId: conv.id, direction: "outbound", content: outbound[i], channel: "email" },
      });
    }
  }

  // Create 3 scripts
  const scripts = await Promise.all([
    prisma.script.create({
      data: {
        organizationId: org.id, name: "SaaS Cold Outreach — SPIN Method", category: "cold_outreach",
        description: "4-step cold email sequence for SaaS founders using SPIN methodology.",
        steps: [
          { order: 1, type: "ai_email", subject: "Quick question about {{lead.company}}", template: "Personalize a cold email introducing SalesAgent AI to {{lead.name}} at {{lead.company}}.", delay: "0d" },
          { order: 2, type: "ai_email", subject: "Re: {{lead.company}}", template: "Follow up with {{lead.name}} — reference the first email, add a relevant case study.", delay: "3d" },
          { order: 3, type: "ai_email", subject: "One last thing, {{lead.name}}", template: "Final follow-up. Offer a 15-min call or case study.", delay: "7d" },
          { order: 4, type: "ai_email", subject: "Closing the loop", template: "Breakup email. No pressure, leave the door open.", delay: "14d" },
        ],
      },
    }),
    prisma.script.create({
      data: {
        organizationId: org.id, name: "B2B Follow-Up Sequence", category: "follow_up",
        description: "3-step follow-up after initial contact. Keeps you top of mind.",
        steps: [
          { order: 1, type: "ai_email", subject: "Following up, {{lead.name}}", template: "Gentle follow-up referencing your last conversation. Add value.", delay: "2d" },
          { order: 2, type: "ai_email", subject: "{{lead.company}} + SalesAgent", template: "Share a relevant case study or result. Clear CTA.", delay: "5d" },
          { order: 3, type: "ai_email", subject: "Worth a quick chat?", template: "Offer a 15-min call. Make it easy.", delay: "10d" },
        ],
      },
    }),
    prisma.script.create({
      data: {
        organizationId: org.id, name: "Re-engagement Campaign", category: "re_engagement",
        description: "3-step re-engagement for cold leads. Win back lost opportunities.",
        steps: [
          { order: 1, type: "ai_email", subject: "Still interested, {{lead.name}}?", template: "Re-engage. Acknowledge the gap, share what's new.", delay: "0d" },
          { order: 2, type: "ai_email", subject: "Something new for {{lead.company}}", template: "Share a new feature or insight.", delay: "7d" },
          { order: 3, type: "ai_email", subject: "Closing the loop, {{lead.name}}", template: "Final check-in. No pressure.", delay: "14d" },
        ],
      },
    }),
  ]);

  // Create 2 campaigns
  await prisma.campaign.create({
    data: {
      organizationId: org.id, name: "SaaS Founder Q2 Outreach",
      description: "Cold outreach to SaaS founders who signed up for our newsletter.",
      scriptId: scripts[0].id, agentId: agents[1].id, status: "active",
      targetAudience: { stage: ["new", "contacted"], source: ["website", "linkedin"] },
      schedule: { timezone: "America/New_York", maxPerDay: 20 },
      stats: { sent: 45, delivered: 43, opened: 28, clicked: 12, replied: 5, booked: 2, unsubscribed: 1 },
    },
  });

  await prisma.campaign.create({
    data: {
      organizationId: org.id, name: "Enterprise Re-engagement",
      description: "Win back enterprise leads that went cold in Q1.",
      scriptId: scripts[2].id, agentId: agents[2].id, status: "draft",
      targetAudience: { stage: ["closed_lost"], scoreMin: 40 },
      schedule: { timezone: "America/Los_Angeles", maxPerDay: 10 },
      stats: { sent: 0, delivered: 0, opened: 0, clicked: 0, replied: 0, booked: 0, unsubscribed: 0 },
    },
  });

  console.log("Demo data seeded!");
  console.log(`  Org: ${ORG_SLUG}`);
  console.log(`  Login: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  console.log(`  Agents: ${agents.length} | Leads: ${leads.length} | Conversations: ${conversations.length} | Scripts: 3 | Campaigns: 2`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
