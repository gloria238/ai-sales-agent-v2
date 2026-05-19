// Production-safe seed: installs sales scripts & demo leads. Idempotent.
// Usage: pnpm tsx packages/db/seed-production.ts <org-slug>
//
// Creates if not present:
//   - 3 sales playbook scripts:
//       1. SaaS Cold Outreach — SPIN Method
//       2. B2B Follow-Up Sequence
//       3. Re-engagement Campaign
//   - 5 demo leads at different stages

import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), "packages/db/.env") });

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SCRIPTS = [
  {
    slug: "saas-cold-outreach",
    name: "SaaS Cold Outreach — SPIN Method",
    description: "4-step cold email sequence for SaaS founders. Uses SPIN methodology.",
    category: "cold_outreach",
    steps: [
      { order: 1, type: "ai_email", subject: "Quick question about {{lead.company}}", template: "Personalize a cold email introducing our product to {{lead.name}} at {{lead.company}}. Focus on a specific problem their industry faces.", delay: "0d" },
      { order: 2, type: "ai_email", subject: "Re: {{lead.company}}", template: "Follow up with {{lead.name}} — reference first email, add a relevant case study or stat. Keep it brief.", delay: "3d" },
      { order: 3, type: "ai_email", subject: "One last thing, {{lead.name}}", template: "Final follow-up. Acknowledge they're busy, offer 15-min call or case study. Make it easy to respond.", delay: "7d" },
      { order: 4, type: "ai_email", subject: "Closing the loop", template: "Breakup email for {{lead.name}}. No pressure, leave the door open. Include link to valuable resource.", delay: "14d" },
    ],
  },
  {
    slug: "b2b-follow-up",
    name: "B2B Follow-Up Sequence",
    description: "3-step follow-up after initial contact. Keeps you top of mind.",
    category: "follow_up",
    steps: [
      { order: 1, type: "ai_email", subject: "Following up, {{lead.name}}", template: "Gentle follow-up to {{lead.name}} referencing your last conversation. Add value.", delay: "2d" },
      { order: 2, type: "ai_email", subject: "{{lead.company}} + [Product]", template: "Share a relevant case study or result with {{lead.name}}. Clear CTA.", delay: "5d" },
      { order: 3, type: "ai_email", subject: "Worth a quick chat?", template: "Final follow-up. Offer a 15-min call.", delay: "10d" },
    ],
  },
  {
    slug: "re-engagement",
    name: "Re-engagement Campaign",
    description: "3-step re-engagement for cold leads. Win back lost opportunities.",
    category: "re_engagement",
    steps: [
      { order: 1, type: "ai_email", subject: "Still interested, {{lead.name}}?", template: "Re-engage {{lead.name}} at {{lead.company}}. Acknowledge the gap, share what's new.", delay: "0d" },
      { order: 2, type: "ai_email", subject: "Something new for {{lead.company}}", template: "Share a new feature, case study, or insight with {{lead.name}}.", delay: "7d" },
      { order: 3, type: "ai_email", subject: "{{lead.name}}, closing the loop", template: "Final check-in. No pressure. Leave door open.", delay: "14d" },
    ],
  },
];

const DEMO_LEADS = [
  { name: "Alice Startup", email: "alice@saasfounder.io", company: "SaaS Startup Inc", stage: "new", source: "website" },
  { name: "Bob Growth", email: "bob@growthscale.com", company: "GrowthScale", stage: "qualified", source: "referral" },
  { name: "Carol Enterprise", email: "carol@bigcorp.com", company: "BigCorp Enterprises", stage: "proposal", source: "linkedin" },
  { name: "David Tech", email: "david@devtool.co", company: "DevTool Co", stage: "contacted", source: "outbound" },
  { name: "Eva Nordic", email: "eva@nordicstartup.se", company: "Nordic Startup AB", stage: "new", source: "website" },
];

async function main() {
  const orgSlug = process.argv[2];
  if (!orgSlug) { console.error("Usage: pnpm tsx packages/db/seed-production.ts <org-slug>"); process.exit(1); }

  const org = await prisma.organization.findUnique({ where: { slug: orgSlug } });
  if (!org) { console.error(`Organization "${orgSlug}" not found`); process.exit(1); }

  // Install scripts (idempotent by name)
  for (const s of SCRIPTS) {
    const existing = await prisma.script.findFirst({ where: { organizationId: org.id, name: s.name } });
    if (existing) { console.log(`Script "${s.name}" already installed, skipping`); continue; }
    await prisma.script.create({
      data: { organizationId: org.id, name: s.name, description: s.description, category: s.category, steps: s.steps },
    });
    console.log(`Script installed: ${s.name}`);
  }

  // Create leads (idempotent by email)
  for (const l of DEMO_LEADS) {
    const existing = await prisma.lead.findFirst({ where: { organizationId: org.id, email: l.email } });
    if (existing) { console.log(`Lead "${l.email}" already exists, skipping`); continue; }
    await prisma.lead.create({
      data: { organizationId: org.id, name: l.name, email: l.email, company: l.company, stage: l.stage, source: l.source },
    });
    console.log(`Lead created: ${l.name} (${l.email})`);
  }

  console.log("Production seed complete.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
