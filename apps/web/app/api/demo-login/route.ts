import { NextResponse } from "next/server";
import { prisma } from "@salesagent/db";
import bcrypt from "bcryptjs";
import { signToken } from "@/lib/auth";

const DEMO_EMAIL = "demo@salesagent.ai";
const DEMO_PASSWORD = "demo123456";
const DEMO_NAME = "Demo User";
const ORG_SLUG = "demo-workspace";
const ORG_NAME = "Demo Workspace";

async function seedDemoDataIfEmpty(orgId: string) {
  const leadCount = await prisma.lead.count({ where: { organizationId: orgId } });
  if (leadCount > 0) return; // Already seeded

  // ── 3 Agents ──
  const agents = await Promise.all([
    prisma.agent.create({
      data: {
        organizationId: orgId, name: "Inbound SDR", isActive: true,
        description: "Qualifies inbound leads, answers product questions, books meetings.",
        personality: "Friendly and consultative. Uses SPIN methodology. Asks discovery questions before pitching.",
        goals: [{ type: "qualify_lead", priority: 1, successCriteria: "Lead score > 70 or meeting booked" }],
        knowledgeBase: {
          productDescription: "SalesAgent AI is an AI SDR platform that automates lead qualification, follow-ups, and meeting booking 24/7.",
          pricing: "Starter $49/mo (1 agent, 500 emails). Pro $149/mo (3 agents, 5,000 emails). Enterprise custom.",
          faq: [
            { question: "How does AI qualification work?", answer: "Our AI scores leads across intent, budget, authority, need, and timeline using conversation signals." },
            { question: "Can the AI book meetings?", answer: "Yes — AI checks availability and sends calendar invites automatically." },
          ],
        },
      },
    }),
    prisma.agent.create({
      data: {
        organizationId: orgId, name: "Outbound SDR", isActive: true,
        description: "Runs cold outreach campaigns at scale with AI-personalized emails.",
        personality: "Direct and value-focused. Uses Challenger methodology. Leads with insights, not features.",
        goals: [{ type: "book_meeting", priority: 1, successCriteria: "Meeting booked" }],
        knowledgeBase: { productDescription: "AI SDR platform for outbound sales automation.", pricing: "From $49/mo." },
      },
    }),
    prisma.agent.create({
      data: {
        organizationId: orgId, name: "Enterprise Closer", isActive: true,
        description: "Handles high-value enterprise leads through complex sales cycles.",
        personality: "Professional and strategic. Uses MEDDIC. Focuses on ROI and business value.",
        goals: [{ type: "handle_objection", priority: 1, successCriteria: "Objection resolved" }],
        knowledgeBase: { productDescription: "Enterprise-grade AI SDR with custom training and SLA.", pricing: "Custom pricing." },
      },
    }),
  ]);

  // ── 12 Leads across stages ──
  const leads = [
    { name: "Alice Chen", email: "alice@startup.io", company: "Startup.io", stage: "qualified", score: 82, source: "website" },
    { name: "Bob Martinez", email: "bob@growtech.com", company: "GrowTech", stage: "contacted", score: 55, source: "outbound" },
    { name: "Carol Davis", email: "carol@scaleup.co", company: "ScaleUp Co", stage: "proposal", score: 78, source: "referral" },
    { name: "David Kim", email: "david@saasfast.com", company: "SaaSFast", stage: "new", score: null, source: "linkedin" },
    { name: "Eva Johansson", email: "eva@nordictech.se", company: "NordicTech", stage: "qualified", score: 71, source: "website" },
    { name: "Frank Wilson", email: "frank@cloudops.io", company: "CloudOps", stage: "negotiation", score: 88, source: "referral" },
    { name: "Grace Lee", email: "grace@datapipe.com", company: "DataPipe", stage: "contacted", score: 48, source: "outbound" },
    { name: "Henry Brown", email: "henry@devtools.io", company: "DevTools", stage: "new", score: null, source: "linkedin" },
    { name: "Iris Wang", email: "iris@fintechx.com", company: "FinTechX", stage: "qualified", score: 75, source: "website" },
    { name: "Jack Taylor", email: "jack@apilayer.com", company: "APILayer", stage: "closed_won", score: 93, source: "referral" },
    { name: "Maria Garcia", email: "maria@ecomly.com", company: "Ecomly", stage: "new", score: null, source: "website" },
    { name: "Nick Robinson", email: "nick@cybersec.io", company: "CyberSec", stage: "closed_lost", score: 28, source: "outbound" },
  ];

  for (const l of leads) {
    await prisma.lead.create({
      data: { organizationId: orgId, name: l.name, email: l.email, company: l.company, stage: l.stage, score: l.score, source: l.source },
    }).catch(() => {}); // ignore if already exists
  }

  // ── 6 Conversations with messages ──
  const activeLeads = await prisma.lead.findMany({
    where: { organizationId: orgId, stage: { notIn: ["closed_won", "closed_lost"] } },
    take: 6,
  });

  const inboundMessages = [
    "Hi! I'm interested in your AI SDR platform. Can you tell me about pricing and how it works?",
    "We're a startup with 25 people. Looking to scale outbound without hiring more SDRs. Can your AI help?",
    "Your platform looks great. How does the AI qualification work? Do we need to train it?",
    "We're currently using Outreach but need better AI capabilities. How do you compare?",
    "Do you support custom domains and multi-team setups? We have 2 brands.",
    "I'd like to see a demo this week. What's your availability?",
  ];

  for (let i = 0; i < activeLeads.length; i++) {
    const lead = activeLeads[i];
    const conv = await prisma.conversation.create({
      data: { organizationId: orgId, leadId: lead.id, agentId: agents[i % 3].id, channel: "email", subject: `Re: ${lead.company} - SalesAgent`, status: "active" },
    });
    await prisma.message.create({
      data: { conversationId: conv.id, direction: "inbound", content: inboundMessages[i], channel: "email" },
    });
  }

  // ── 3 Scripts ──
  const script1 = await prisma.script.create({
    data: { organizationId: orgId, name: "Cold Outreach — 4 Steps", category: "cold_outreach", description: "4-step SaaS cold email sequence.", steps: [
      { order: 1, type: "ai_email", subject: "Quick question about {{lead.company}}", delay: "0d" },
      { order: 2, type: "ai_email", subject: "Re: {{lead.company}}", delay: "3d" },
      { order: 3, type: "ai_email", subject: "One last thing", delay: "7d" },
      { order: 4, type: "ai_email", subject: "Closing the loop", delay: "14d" },
    ] },
  });
  const script2 = await prisma.script.create({
    data: { organizationId: orgId, name: "Follow-Up — 3 Steps", category: "follow_up", description: "Gentle post-contact follow-up.", steps: [
      { order: 1, type: "ai_email", subject: "Following up, {{lead.name}}", delay: "2d" },
      { order: 2, type: "ai_email", subject: "{{lead.company}} + SalesAgent", delay: "5d" },
      { order: 3, type: "ai_email", subject: "Worth a chat?", delay: "10d" },
    ] },
  });

  // ── 2 Campaigns ──
  await prisma.campaign.create({
    data: { organizationId: orgId, name: "Q2 SaaS Outreach", scriptId: script1.id, agentId: agents[1].id, status: "active",
      targetAudience: { stage: ["new", "contacted"], source: ["website"] },
      schedule: { maxPerDay: 20 }, stats: { sent: 38, delivered: 37, opened: 22, replied: 4, booked: 1 } },
  });
  await prisma.campaign.create({
    data: { organizationId: orgId, name: "Enterprise Re-engagement", scriptId: script2.id, agentId: agents[2].id, status: "draft",
      targetAudience: { scoreMin: 40 }, schedule: { maxPerDay: 10 },
      stats: { sent: 0, delivered: 0, opened: 0, replied: 0 } },
  });
}

export async function POST() {
  try {
    // 1. Find or create demo user
    let user = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } });
    if (!user) {
      const hash = await bcrypt.hash(DEMO_PASSWORD, 10);
      user = await prisma.user.create({
        data: { email: DEMO_EMAIL, name: DEMO_NAME, passwordHash: hash, emailVerified: true },
      });
    }

    // 2. Find or create demo org
    let org = await prisma.organization.findUnique({ where: { slug: ORG_SLUG } });
    if (!org) {
      org = await prisma.organization.create({ data: { name: ORG_NAME, slug: ORG_SLUG } });
    }

    // 3. Ensure membership
    const membership = await prisma.membership.findFirst({
      where: { userId: user.id, organizationId: org.id },
    });
    if (!membership) {
      await prisma.membership.create({
        data: { userId: user.id, organizationId: org.id, role: "owner" },
      });
    }

    // 4. Seed demo data if empty
    await seedDemoDataIfEmpty(org.id);

    // 5. Sign JWT
    const token = await signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      orgId: org.id,
      orgSlug: org.slug,
      role: "owner",
    });

    // 6. Set cookie and redirect
    const response = NextResponse.redirect(new URL("/home", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));
    response.cookies.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Demo login error:", error);
    return NextResponse.json({ error: "Demo login failed" }, { status: 500 });
  }
}
