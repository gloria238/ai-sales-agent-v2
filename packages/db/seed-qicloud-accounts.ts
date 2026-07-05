// 启云科技 — 补充账号种子
// Usage: pnpm tsx packages/db/seed-qicloud-accounts.ts
//
// Adds to existing qicloud-demo org:
//   - 3 customer portal accounts (Lead → User link)
//   - 3 extra team members

import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), "packages/db/.env") });

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

function getDatasourceUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL required");
  if (url.includes("connection_limit")) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}connection_limit=1`;
}

const prisma = new PrismaClient({ datasources: { db: { url: getDatasourceUrl() } } });

async function main() {
  const org = await prisma.organization.findUnique({ where: { slug: "qicloud-demo" } });
  if (!org) { console.error("请先运行 pnpm seed-chinese-demo"); process.exit(1); }

  const pwd = await bcrypt.hash("demo123456", 12);

  // ═══ 1. Customer Portal accounts (Link 3 Leads to User records) ═══

  const customers = [
    { name: "赵明辉", email: "zhaomh@yunfan-tech.com" },
    { name: "王校长", email: "wang@siyuan-edu.com" },
    { name: "吴刚",    email: "wugang@ronghui-fin.com" },
  ];

  for (const c of customers) {
    // Find the lead
    const lead = await prisma.lead.findFirst({
      where: { organizationId: org.id, email: c.email },
    });
    if (!lead) { console.log(`  跳过: Lead ${c.email} 不存在`); continue; }

    // Create user if not exists
    const user = await prisma.user.upsert({
      where: { email: c.email },
      update: { passwordHash: pwd, emailVerified: true, name: c.name },
      create: { email: c.email, passwordHash: pwd, emailVerified: true, name: c.name },
    });

    // Link lead to user (Customer Portal access)
    if (!lead.userId) {
      await prisma.lead.update({
        where: { id: lead.id },
        data: { userId: user.id },
      });
      console.log(`✅ 客户账号: ${c.email} / demo123456 — ${c.name}`);
    } else {
      console.log(`  已存在: ${c.email}`);
    }
  }

  // ═══ 2. Extra team members ═══
  const extras = [
    { email: "tang.ming@qicloud.cn", name: "唐明", role: "operator" as const },
    { email: "huang.yuan@qicloud.cn", name: "黄媛", role: "operator" as const },
    { email: "jiang.tao@qicloud.cn", name: "江涛", role: "viewer" as const },
  ];

  for (const m of extras) {
    const existingMem = await prisma.membership.findFirst({
      where: { organizationId: org.id, user: { email: m.email } },
    });
    if (existingMem) { console.log(`  已存在: ${m.email}`); continue; }

    const user = await prisma.user.upsert({
      where: { email: m.email },
      update: { passwordHash: pwd, emailVerified: true, name: m.name },
      create: { email: m.email, passwordHash: pwd, emailVerified: true, name: m.name },
    });
    await prisma.membership.create({
      data: { userId: user.id, organizationId: org.id, role: m.role },
    });
    console.log(`✅ 团队成员: ${m.email} / demo123456 — ${m.name} (${m.role})`);
  }

  // ═══ 3. Summary ═══
  const members = await prisma.membership.findMany({
    where: { organizationId: org.id },
    include: { user: { select: { email: true, name: true } } },
  });
  const customerLeads = await prisma.lead.findMany({
    where: { organizationId: org.id, userId: { not: null } },
    select: { email: true, name: true },
  });

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("启云科技 全部账号:");
  console.log("  密码均为: demo123456\n");
  console.log("【管理后台】(dashboard)");
  for (const m of members) {
    console.log(`  ${m.user.email} — ${m.user.name} (${m.role})`);
  }
  console.log("\n【客户门户】(portal)");
  for (const c of customerLeads) {
    console.log(`  ${c.email} — ${c.name}`);
  }
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
