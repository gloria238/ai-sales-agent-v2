// 中文 Demo 种子数据：启云科技销售团队
// Usage: pnpm tsx packages/db/seed-chinese-demo.ts
//
// Creates "启云科技" org with:
//   - 1 owner (admin@qicloud.cn / demo123456)
//   - 4 members (销售经理、销售代表、运营、只读)
//   - 3 AI 销售坐席
//   - 15 客户
//   - 10 对话 + 消息
//   - 2 外呼活动
//   - 知识库文档 + 分块（Keyword search only — no embedding needed）

import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), "packages/db/.env") });

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

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

const ORG_NAME = "启云科技";
const ORG_SLUG = "qicloud-demo";

async function main() {
  console.log("🌐 创建启云科技中文 Demo 组织...\n");

  // ── Clean up existing ──────────────────────────────────────────
  const existing = await prisma.organization.findUnique({ where: { slug: ORG_SLUG } });
  if (existing) {
    console.log("清理已有数据...");
    // FK-safe cascading delete — Prisma handles it via schema onDelete: Cascade
    await prisma.organization.delete({ where: { id: existing.id } });
    console.log("已删除旧组织");
  }

  // ── 1. Organization + User ──────────────────────────────────────
  const pwd = await bcrypt.hash("demo123456", 12);
  const user = await prisma.user.upsert({
    where: { email: "admin@qicloud.cn" },
    update: { passwordHash: pwd, emailVerified: true, name: "张启明" },
    create: {
      email: "admin@qicloud.cn", passwordHash: pwd, emailVerified: true, name: "张启明",
    },
  });

  const org = await prisma.organization.create({
    data: {
      name: ORG_NAME, slug: ORG_SLUG,
      memberships: {
        create: [
          { userId: user.id, role: "owner" },
        ],
      },
    },
  });

  // Create extra users for the team
  const members = [
    { email: "wang.li@qicloud.cn", name: "王莉", role: "admin" as const },
    { email: "liu.qiang@qicloud.cn", name: "刘强", role: "operator" as const },
    { email: "chen.xin@qicloud.cn", name: "陈欣", role: "operator" as const },
    { email: "zhou.wei@qicloud.cn", name: "周伟", role: "viewer" as const },
  ];
  for (const m of members) {
    const u = await prisma.user.upsert({
      where: { email: m.email },
      update: { passwordHash: pwd, emailVerified: true, name: m.name },
      create: { email: m.email, passwordHash: pwd, emailVerified: true, name: m.name },
    });
    await prisma.membership.create({
      data: { userId: u.id, organizationId: org.id, role: m.role },
    });
  }
  console.log("✅ 组织 + 5 成员");

  // ── 2. Feature Flags (China defaults) ──────────────────────────
  const flags = [
    { key: "email_channel", enabled: false },
    { key: "wechat_channel", enabled: true },
  ];
  for (const f of flags) {
    await prisma.featureFlag.create({
      data: { organizationId: org.id, key: f.key, enabled: f.enabled },
    });
  }
  console.log("✅ Feature Flags: email=关, 企微=开");

  // ── 3. AI Agents ────────────────────────────────────────────────
  const agents = await Promise.all([
    prisma.agent.create({
      data: {
        organizationId: org.id, name: "小云 — 入站客户顾问",
        description: "负责官网和企微进站客户的首次响应和需求筛选",
        personality: "专业、亲切、善于倾听。用 SPIN 方法论了解客户痛点。",
        goals: [
          { type: "qualify_lead", priority: 1, successCriteria: "准确识别客户预算和决策角色" },
          { type: "book_meeting", priority: 2, successCriteria: "将高意向客户转给销售代表" },
        ],
        knowledgeBase: {
          productDescription: "启云科技企业级 AI 客服与销售自动化 SaaS，帮助 50-500 人的 B2B 企业实现客户沟通智能化。核心功能包括 AI 销售坐席、RAG 知识库、多渠道统一收件箱、外呼活动引擎、数据分析看板。",
          pricing: "基础版 ¥1,999/月（3坐席/1万条消息）→ 专业版 ¥5,999/月（10坐席/5万条消息）→ 企业版 ¥19,999/月（不限坐席/不限消息/私有部署）",
        },
      },
    }),
    prisma.agent.create({
      data: {
        organizationId: org.id, name: "小启 — 外呼活动专员",
        description: "负责外呼活动的执行和客户跟进",
        personality: "主动、坚韧、数据驱动。善于在恰当的时机用恰当的话术触达客户。",
        goals: [
          { type: "follow_up", priority: 1, successCriteria: "活动打开率 >35%，回复率 >12%" },
          { type: "qualify_lead", priority: 2, successCriteria: "将回复客户升级为销售线索" },
        ],
        knowledgeBase: {
          productDescription: "启云科技提供 14 天免费试用，支持企业微信/邮件/网页多渠道接入。AI 7×24 小时值守，客户消息 30 秒响应。",
          faq: [
            { q: "和销售易有什么区别？", a: "销售易是 CRM（管理客户数据），启云是 AI 销售助手（主动跟进客户），两者互补不同替代。" },
            { q: "数据安全吗？", a: "HTTPS+TLS 1.3 传输加密，AES-256 存储加密，通过国家等保二级认证，企业版支持私有化部署。" },
          ],
        },
      },
    }),
    prisma.agent.create({
      data: {
        organizationId: org.id, name: "小科 — 客户成功顾问",
        description: "负责老客户续约提醒、增购推荐和售后问题解答",
        personality: "温暖、耐心、解决问题导向。把每个客户当成长期合作伙伴。",
        goals: [
          { type: "nurture", priority: 1, successCriteria: "续约率 >85%，增购转化率 >20%" },
        ],
      },
    }),
  ]);
  console.log(`✅ 3 AI 坐席`);

  // ── 4. Leads (15 customers) ─────────────────────────────────────
  const leads = await Promise.all([
    prisma.lead.create({ data: { organizationId: org.id, name: "赵明辉", email: "zhaomh@yunfan-tech.com", company: "云帆科技", phone: "13800001001", stage: "negotiation", score: 88, source: "referral", dealAmount: 85000 } }),
    prisma.lead.create({ data: { organizationId: org.id, name: "陈总", email: "chen@zhilian-hardware.com", company: "智联制造", phone: "13800001002", stage: "qualified", score: 75, source: "website", dealAmount: 42000 } }),
    prisma.lead.create({ data: { organizationId: org.id, name: "王校长", email: "wang@siyuan-edu.com", company: "思源教育", phone: "13800001003", stage: "proposal", score: 82, source: "linkedin", dealAmount: 120000 } }),
    prisma.lead.create({ data: { organizationId: org.id, name: "李明", email: "liming@baina-tech.com", company: "百纳科技", phone: "13800001004", stage: "new", score: 35, source: "website" } }),
    prisma.lead.create({ data: { organizationId: org.id, name: "张薇", email: "zhangwei@dahai-group.com", company: "大海集团", phone: "13800001005", stage: "contacted", score: 55, source: "outbound", dealAmount: 200000 } }),
    prisma.lead.create({ data: { organizationId: org.id, name: "孙浩然", email: "sunhr@huateng.cn", company: "华腾科技", stage: "qualified", score: 72, source: "website", dealAmount: 36000 } }),
    prisma.lead.create({ data: { organizationId: org.id, name: "周婷", email: "zhouting@meinian.com", company: "美年健康", stage: "new", score: 20, source: "other" } }),
    prisma.lead.create({ data: { organizationId: org.id, name: "吴刚", email: "wugang@ronghui-fin.com", company: "融汇金融", phone: "13800001008", stage: "closed_won", score: 95, source: "referral", dealAmount: 156000 } }),
    prisma.lead.create({ data: { organizationId: org.id, name: "郑丽", email: "zhengli@aikang.com", company: "艾康医药", stage: "closed_lost", score: 60, source: "outbound" } }),
    prisma.lead.create({ data: { organizationId: org.id, name: "马超", email: "machao@feiyu.com", company: "飞宇物流", stage: "contacted", score: 45, source: "linkedin", dealAmount: 29000 } }),
    prisma.lead.create({ data: { organizationId: org.id, name: "林小红", email: "linxh@yunduan-data.com", company: "云端数据", stage: "proposal", score: 78, source: "website", dealAmount: 67000 } }),
    prisma.lead.create({ data: { organizationId: org.id, name: "黄建军", email: "huangjj@hengyuan.com", company: "恒源建筑", stage: "new", score: 15, source: "outbound" } }),
    prisma.lead.create({ data: { organizationId: org.id, name: "许晴", email: "xuqing@ruiyi-law.com", company: "睿义律所", stage: "contacted", score: 40, source: "referral" } }),
    prisma.lead.create({ data: { organizationId: org.id, name: "何伟", email: "hewei@jucheng-mfg.com", company: "聚成制造", stage: "qualified", score: 68, source: "website", dealAmount: 54000 } }),
    prisma.lead.create({ data: { organizationId: org.id, name: "沈悦", email: "shenyue@tianyu-logistics.com", company: "天域物流", stage: "negotiation", score: 84, source: "linkedin", dealAmount: 93000 } }),
  ]);
  console.log("✅ 15 客户");

  // ── 5. Conversations + Messages ──────────────────────────────────
  // Conv 1: 赵明辉 (云帆科技) — negotiation — with agent 1
  const conv1 = await prisma.conversation.create({
    data: {
      organizationId: org.id, leadId: leads[0].id, agentId: agents[0].id,
      channel: "email", subject: "启云科技企业版采购咨询",
      status: "awaiting_approval",
      messages: {
        create: [
          { direction: "inbound", content: "你好！我们在对比市面上的 AI 销售助手方案。你们和销售易的 AI 功能有什么本质区别？我们团队 80 人，主要做 B2B SaaS。", channel: "email" },
          { direction: "outbound", content: "赵总您好！这是个很好的问题。核心区别在于：销售易是 CRM——帮您管客户数据、管销售阶段；启云是 AI 销售助手——帮销售主动跟进客户、自动回复、智能评分。\n\n打个比方：CRM 是您的"客户通讯录"，启云是帮您"给客户发消息"的 AI。我们的很多客户是两个系统一起用：销售易管流程，启云做执行。\n\n对于 80 人的 SaaS 团队，建议看看专业版（¥5,999/月，10 个 AI 坐席，全渠道接入）。您方便这周安排 30 分钟产品演示吗？", channel: "email", aiMetadata: { tone: "professional", suggestedAction: "send_now" } },
          { direction: "inbound", content: "好的，这周五下午 3 点可以吗？另外能否先发一份产品介绍 PDF？我们 CTO 也想看一下技术架构。", channel: "email" },
        ],
      },
    },
  });

  // Conv 2: 陈总 (智联制造) — qualified — with agent 1
  const conv2 = await prisma.conversation.create({
    data: {
      organizationId: org.id, leadId: leads[1].id, agentId: agents[0].id,
      channel: "email", subject: "咨询产品功能与定价",
      status: "active",
      messages: {
        create: [
          { direction: "inbound", content: "我们是一家工业硬件公司，销售团队 20 人在全国 6 个城市。最大的问题是客户信息分散在各人微信上，总部看不到全貌。你们能解决吗？", channel: "email" },
          { direction: "outbound", content: "陈总好，这正好是启云的核心价值之一。我们的多渠道统一收件箱可以把企微、邮件、网页咨询汇聚到一个后台，总部销售经理可以看到所有客户的沟通历史和 AI 处理状态。\n\n智联制造的场景，建议用专业版，搭 6 个区域坐席 + 2 个总部审核坐席。要不要我给您发一个同行业客户（某工业物联网公司）的使用案例？他们上线 3 个月后代理商跟进覆盖率从 61% 提升到 96%。", channel: "email", aiMetadata: { tone: "consultative", suggestedAction: "send_now" } },
        ],
      },
    },
  });

  // Conv 3: 王校长 (思源教育) — proposal — with agent 1
  const conv3 = await prisma.conversation.create({
    data: {
      organizationId: org.id, leadId: leads[2].id, agentId: agents[0].id,
      channel: "email", subject: "教育行业 AI 客服方案",
      status: "active",
      messages: {
        create: [
          { direction: "inbound", content: "我们是在线教育公司，课程顾问 45 人。寒暑假前咨询量暴增 3 倍，平时又用不了那么多人。你们能解决这个波峰波谷的问题吗？还有，家长信息必须保障隐私安全。", channel: "email" },
          { direction: "outbound", content: "王校长您好！教育行业的季节性波动确实是典型痛点。我们的方案：\n\n1. 旺季时 AI 7×24 处理家长咨询（秒级响应），课程顾问只需审核 AI 的回复，人均处理量从 35 条/天提升到 89 条/天\n2. 淡季时保持基础 AI 坐席覆盖，不用担心人力浪费\n3. 安全方面：企业版支持完全私有化部署，所有家长数据在您自己的服务器上，我们还通过了等保二级认证\n\n思源教育这类场景，我们已有成功案例（某 K12 平台上线 6 个月后夜间咨询覆盖率从 0 到 100%，试听课转化率翻倍）。您看什么时候方便深度交流一下？", channel: "email", aiMetadata: { tone: "professional", suggestedAction: "send_now" } },
        ],
      },
    },
  });

  // More conversations for the inbox demo
  const conv4 = await prisma.conversation.create({
    data: {
      organizationId: org.id, leadId: leads[3].id, agentId: agents[1].id,
      channel: "email", subject: "了解一下产品",
      status: "active",
      messages: {
        create: [
          { direction: "inbound", content: "在你们官网上看到这个产品，想了解一下基础版的价格和功能。我们是个 8 人的创业公司。", channel: "email" },
          { direction: "outbound", content: "您好！基础版 ¥1,999/月，包含 3 个 AI 坐席和 10,000 条消息/月，完全够 8 人团队使用。14 天免费试用，零风险。我帮您开通试用账号？", channel: "email", aiMetadata: { tone: "friendly" } },
        ],
      },
    },
  });

  const conv5 = await prisma.conversation.create({
    data: {
      organizationId: org.id, leadId: leads[5].id, agentId: agents[0].id,
      channel: "email", subject: "API 集成咨询",
      status: "active",
      messages: {
        create: [
          { direction: "inbound", content: "我们有自己的 CRM 系统，需要把你们的 AI 能力通过 API 集成进来。你们支持什么认证方式？有没有 SDK？", channel: "email" },
          { direction: "outbound", content: "您好！我们支持 API Key (Bearer Token) 和 Cookie Session 两种认证方式。提供了 Node.js 和 Python SDK。API 文档在 docs.qicloud.cn/api。专业版起就支持 API 接入。需要我发一份 API 集成指南吗？", channel: "email", aiMetadata: { tone: "professional" } },
        ],
      },
    },
  });

  const conv6 = await prisma.conversation.create({
    data: {
      organizationId: org.id, leadId: leads[7].id, agentId: agents[2].id,
      channel: "email", subject: "续约咨询",
      status: "closed",
      messages: {
        create: [
          { direction: "inbound", content: "我们的年费下个月到期，想了解一下续约有什么优惠？另外我们想从专业版升级到企业版，因为需要私有化部署。", channel: "email" },
          { direction: "outbound", content: "吴总好！续约客户享受 8 折年付优惠。从专业版升级到企业版的话，差价按天折算，另外企业版私有化部署一次性费用 ¥49,000。考虑到您是续约客户，我们可以在部署费上给到 9 折。需要我安排客户成功经理上门做升级评估吗？", channel: "email", aiMetadata: { tone: "friendly" } },
          { direction: "inbound", content: "好的，安排吧。另外私有化部署大概需要多长时间？我们想在 Q3 之前完成切换。", channel: "email" },
          { direction: "outbound", content: "私有化部署通常在 2-3 周内完成，包括环境安装、配置调优和运维培训。Q3 之前完全来得及。我让客户成功经理这周联系您确认具体时间。", channel: "email", aiMetadata: { tone: "professional" } },
        ],
      },
    },
  });

  const conv7 = await prisma.conversation.create({
    data: {
      organizationId: org.id, leadId: leads[10].id, agentId: agents[0].id,
      channel: "email", subject: "数据安全咨询",
      status: "active",
      messages: {
        create: [
          { direction: "inbound", content: "我们公司对数据合规要求很高。你们的数据加密和权限管理具体是什么方案？有没有安全认证？", channel: "email" },
          { direction: "outbound", content: "您好！安全方面我们有完整方案：\n\n- 传输层：HTTPS + TLS 1.3\n- 存储层：AES-256 加密\n- 认证层：JWT + bcrypt 12 轮哈希 + httpOnly Cookie\n- 权限层：4 角色 × 13 权限矩阵\n- 认证：通过国家信息安全等级保护二级\n\n如果这些还不够满足要求，企业版支持完全私有化部署——所有数据在您自己服务器上。需要我发一份安全白皮书吗？", channel: "email", aiMetadata: { tone: "professional" } },
        ],
      },
    },
  });

  const conv8 = await prisma.conversation.create({
    data: {
      organizationId: org.id, leadId: leads[14].id, agentId: agents[0].id,
      channel: "email", subject: "企业版报价",
      status: "awaiting_approval",
      messages: {
        create: [
          { direction: "inbound", content: "请发一份企业版的正式报价单。我们需要 20 个坐席，私有化部署，还要对接我们的飞书 SSO。", channel: "email" },
          { direction: "outbound", content: "沈总您好！根据您的需求，报价如下：\n\n企业版年付：¥191,990/年（8折）\n私有化部署费：¥49,000（一次性）\n飞书 SSO 集成：已包含在企业版中，无额外费用\n\n合计首年：¥240,990，次年：¥191,990/年\n\n以上报价含增值税专用发票。需要我帮您出正式合同吗？", channel: "email", aiMetadata: { tone: "professional", suggestedAction: "review" } },
        ],
      },
    },
  });

  const conv9 = await prisma.conversation.create({
    data: {
      organizationId: org.id, leadId: leads[4].id, agentId: agents[1].id,
      channel: "email", subject: "外呼活动咨询",
      status: "active",
      messages: {
        create: [
          { direction: "outbound", content: "张薇总您好！我是启云科技的小启。注意到大海上个月在我们官网浏览了外呼活动引擎的产品页，想了解一下您现在是否有在考虑提升销售团队的外呼效率？我们最近有客户用外呼活动引擎把邮件打开率从 12% 提升到了 31%。要不要了解一下？", channel: "email", aiMetadata: { tone: "professional" } },
        ],
      },
    },
  });

  const conv10 = await prisma.conversation.create({
    data: {
      organizationId: org.id, leadId: leads[12].id, agentId: agents[0].id,
      channel: "email", subject: "律所行业适用性咨询",
      status: "active",
      messages: {
        create: [
          { direction: "inbound", content: "我们是律师事务所，客户沟通内容涉及大量法律术语和保密信息。你们的 AI 能理解法律行业的语境吗？数据保密能不能保证？", channel: "email" },
          { direction: "outbound", content: "许律师您好！两个问题分别说明：\n\n1. 行业适配：您可以把律所常用的法律文书、常见问题解答、服务介绍上传到知识库（我们支持 PDF/Word），AI 就能"学会"法律行业的语境。已有律所客户在使用，反馈只要知识库内容够详实（通常 30-50 篇文档），AI 可以覆盖 80% 以上的日常客户问题。\n\n2. 数据保密：企业版支持私有化部署，数据完全在您自己的服务器上。传输和存储全程加密。我们签保密协议也是标准流程。\n\n需要我安排一次针对律所场景的演示吗？", channel: "email", aiMetadata: { tone: "consultative" } },
        ],
      },
    },
  });
  console.log("✅ 10 对话 + 消息");

  // ── 6. Scripts ──────────────────────────────────────────────────
  const scripts = await Promise.all([
    prisma.script.create({
      data: {
        organizationId: org.id, name: "B2B SaaS 冷启动邮件序列",
        description: "4 步冷启动邮件序列，适合初次接触的潜在客户",
        category: "cold_outreach",
        steps: [
          { order: 1, type: "ai_email", subject: "{{lead.company}}的销售自动化方案", template: "个性化冷启动邮件，介绍启云科技 AI 销售助手对 {{lead.company}} 的价值", delay: "0d" },
          { order: 2, type: "delay", delay: "3d" },
          { order: 3, type: "ai_email", subject: "回复：{{lead.company}}", template: "跟进第一封邮件，添加客户案例或行业数据", delay: "0d" },
          { order: 4, type: "delay", delay: "7d" },
          { order: 5, type: "ai_email", subject: "最后确认，{{lead.name}}", template: "最终跟进，轻松语气，留出回复空间", delay: "0d" },
        ],
      },
    }),
    prisma.script.create({
      data: {
        organizationId: org.id, name: "客户成功续约提醒",
        description: "3 步续约序列，到期前 60 天启动",
        category: "re_engagement",
        steps: [
          { order: 1, type: "ai_email", subject: "您的启云科技续约提醒", template: "友好提醒，总结过去一年的使用数据亮点", delay: "0d" },
          { order: 2, type: "delay", delay: "14d" },
          { order: 3, type: "ai_email", subject: "启云科技新功能上线 — 升级方案", template: "介绍新功能，提供升级优惠", delay: "0d" },
        ],
      },
    }),
  ]);
  console.log("✅ 2 话术脚本");

  // ── 7. Campaigns ─────────────────────────────────────────────────
  await prisma.campaign.create({
    data: {
      organizationId: org.id, name: "2026年7月 SaaS 新客户拓展",
      description: "针对新客户和已联系客户的冷启动邮件活动",
      scriptId: scripts[0].id, agentId: agents[1].id,
      status: "active",
      targetAudience: { stage: ["new", "contacted"], scoreMin: 0, scoreMax: 100 },
      schedule: { timezone: "Asia/Shanghai", workingHours: { start: "09:00", end: "18:00" }, maxPerDay: 20 },
      stats: { sent: 45, delivered: 45, opened: 16, clicked: 6, replied: 5, booked: 2, unsubscribed: 1 },
    },
  });

  await prisma.campaign.create({
    data: {
      organizationId: org.id, name: "2026年Q2 客户续约提醒",
      description: "针对已成交客户的续约提醒和增购推荐",
      scriptId: scripts[1].id, agentId: agents[2].id,
      status: "draft",
      targetAudience: { stage: ["closed_won"] },
      schedule: { timezone: "Asia/Shanghai", maxPerDay: 5 },
    },
  });
  console.log("✅ 2 外呼活动");

  // ── 8. Knowledge Base — Direct DocumentChunk insertion ──────────
  // Documents with pre-computed chunks (keyword-search only, no embedding needed)
  const kbDocs = [
    {
      name: "启云科技产品介绍.md",
      type: "md",
      status: "ready",
      chunkCount: 8,
      chunks: [
        "启云科技（QiCloud）是一站式企业级 AI 客服与销售自动化 SaaS 平台，帮助 50-500 人的 B2B 企业实现客户沟通的智能化、自动化和可量化。",
        "AI 销售坐席是启云科技的核心能力，可以自主完成客户跟进、线索筛选、话术推荐和会议预约。支持 7×24 小时值守，客户消息 30 秒内响应。",
        "支持五个沟通渠道：企业微信、个人微信、电子邮件、网页 Widget（一行代码嵌入官网）、REST API 自定义接入。所有渠道的消息汇聚到统一收件箱。",
        "RAG 知识库采用混合检索技术：向量语义搜索 + 全文关键词搜索并行执行，通过 RRF 算法融合排序。上传 PDF/Word/Markdown/FAQ 文档后自动分段索引，AI 引用来源回答。",
        "所有 AI 生成的消息默认进入"待审核"状态（HITL 模式），需要销售经理确认后才发送。AI 只写初稿，人工做最终决定。基础版除外——为降低使用门槛，基础版 AI 生成即发送。",
        "数据分析看板包含：销售漏斗实时分布、AI 效能指标（P50/P95 延迟、Token 消耗、AI 回复率）、活动效果（邮件打开率、回复率、ROI 估算）。Boss Dashboard 提供跨团队 AI 使用健康度和成本趋势。",
        "多租户架构：每个客户独立租户，数据物理隔离。4 角色 × 13 权限矩阵（管理员/销售经理/销售代表/只读）。支持 SSO 单点登录（飞书/钉钉/企业微信/OIDC）。",
        "技术栈：AI 引擎 DeepSeek + ReAct Agent，向量检索 pgvector + tsvector，任务队列 BullMQ + Redis，前端 Next.js 14 + React 18 + Tailwind CSS。支持私有化部署到客户自有服务器。",
      ],
    },
    {
      name: "启云科技定价表.md",
      type: "md",
      status: "ready",
      chunkCount: 7,
      chunks: [
        "基础版 ¥1,999/月：3 个 AI 坐席、10,000 条消息/月、基础 RAG 知识库（100 篇文档）、邮件 + 网页 Widget 接入、5 个团队成员账号。适合 5-20 人团队初步尝试 AI 销售自动化。",
        "专业版 ¥5,999/月：10 个 AI 坐席、50,000 条消息/月、高级混合检索知识库（500 篇文档）、全渠道接入（企微/邮件/网页/API）、外呼活动引擎、HITL 人工审核流程、20 个团队成员账号。适合 20-100 人正式团队。",
        "企业版 ¥19,999/月：不限 AI 坐席数、不限消息量、不限知识库文档、全渠道 + 自定义 API、私有化部署、自定义 AI 模型训练、99.9% SLA、7×24 专属客户成功经理。适合 100 人以上企业。",
        "年付享 8 折优惠。以专业版为例：月付 ¥5,999×12 = ¥71,988，年付 ¥57,590，节省 ¥14,398。",
        "所有套餐提供 14 天免费试用（基础版功能范围），无需绑定信用卡。试用期内可随时升级。到期后数据保留 30 天。",
        "私有化部署一次性费用 ¥49,000（企业版），包括环境安装、配置调优、运维培训，通常 2-3 周完成。客户自有运维团队可自行部署，免除部署费。",
        "增购项：额外 AI 坐席 ¥300/个/月（基础版/专业版），额外消息 ¥0.3/条（基础版）或 ¥0.2/条（专业版），额外知识库容量 ¥100/50 篇/月（基础版），定制 AI 训练 ¥29,000 起。",
      ],
    },
    {
      name: "启云科技常见问题 FAQ.md",
      type: "md",
      status: "ready",
      chunkCount: 10,
      chunks: [
        "Q：支持哪些沟通渠道？A：支持企业微信、个人微信、电子邮件、网页 Widget（一行代码嵌入官网）和 REST API 自定义接入，共五个渠道。所有渠道的消息汇聚到统一收件箱。",
        "Q：AI 会不会自动发消息？A：不会。所有 AI 消息默认进入"待审核"状态（HITL 模式），需要人工确认后才发送。基础版除外——基础版为降低使用门槛，AI 生成即发送，但可升级到专业版开启审核。",
        "Q：数据安全吗？A：传输层 HTTPS + TLS 1.3，存储层 AES-256 加密，认证层 JWT + bcrypt 12 轮哈希 + httpOnly Cookie。通过国家信息安全等级保护二级认证。企业版支持完全私有化部署。",
        "Q：和销售易/纷享销客有什么区别？A：销售易和纷享销客是 CRM（管理客户数据和销售流程），启云科技是 AI 销售助手（帮销售主动跟进客户、自动回复、智能评分）。两者互补不替代，很多客户是两个系统一起用。",
        "Q：可以对接现有的 CRM 吗？A：可以。专业版和企业版提供 RESTful API，支持 API Key (Bearer Token) 和 Cookie Session 认证。提供 Node.js 和 Python SDK。",
        "Q：知识库支持什么文件格式？A：支持 PDF、Word (.docx)、Markdown (.md)、纯文本 (.txt) 和 FAQ 问答对 (JSON)。单文件最大 10MB。上传后通常 30 秒内完成处理。",
        "Q：怎么接入企业微信？A：在后台"渠道管理"→"企业微信"中扫码授权即可。需要企业微信管理员账号。接入过程约 2 分钟，授权后消息实时同步。",
        "Q：支持哪些语言？A：AI 销售坐席支持中文、英文、日文、韩文——AI 自动检测客户消息语言并用相同语言回复。管理后台目前仅支持中文。客户 Portal 支持中文和英文自动切换。",
        "Q：有免费试用吗？A：有。所有套餐提供 14 天免费试用（基础版功能），无需绑定信用卡。试用期内可随时升级。到期后数据保留 30 天。",
        "Q：退费政策？A：月付客户可随时取消，当月费用不退。年付客户 30 天内可全额退款，超过 30 天按已使用月份（月付原价）扣除后退还余额。",
      ],
    },
    {
      name: "销售异议处理话术.md",
      type: "md",
      status: "ready",
      chunkCount: 6,
      chunks: [
        "异议：太贵了。应答：初级 SDR 月薪约 ¥8,000-12,000 + 五险一金 ≈ ¥12,000/月。基础版 ¥1,999/月 = SDR 成本的 1/6，但覆盖 3 倍的客户量。先免费试用 14 天看看效果？",
        "异议：已有销售易/纷享销客。应答：它们管理客户数据和流程，启云让 AI 主动跟进客户。两者互补不替代。通过 API 可以把 CRM 里的客户同步到启云，AI 处理完后结果写回 CRM。",
        "异议：需要请示领导。应答：给领导汇报三个数字：成本 ¥1,999/月（一顿商务午餐的预算）、见效当天能用、风险 14 天免费试用零成本。需要我帮您给领导做 10 分钟电话说明吗？",
        "异议：AI 回复质量能保证吗？应答：三层保障：AI 从知识库检索后回复不是凭空编造、所有草稿人工审核后才发送、实际数据 95% 的 AI 草稿被采纳（40% 直接发送 + 55% 微调后发送）。",
        "异议：数据安全吗？应答：HTTPS+TLS 1.3 + AES-256 加密 + 等保二级 + JWT bcrypt 12 轮。165 项安全检查全部高危修复。如不放心，企业版私有化部署数据在您自己服务器上。",
        "异议：我们行业特殊 AI 不懂。应答：把产品文档、术语表、FAQ 上传到知识库（通常 20-50 篇文档），AI 就能覆盖 80% 以上日常客户问题。企业版支持定制模型微调——用您真实的客户对话数据训练。",
      ],
    },
  ];

  for (const doc of kbDocs) {
    const document = await prisma.document.create({
      data: {
        organizationId: org.id,
        name: doc.name,
        type: doc.type,
        status: "ready",
        chunkCount: doc.chunkCount,
        metadata: { fileSize: doc.chunks.reduce((s, c) => s + c.length, 0), uploadedAt: new Date().toISOString(), source: "seed" },
      },
    });

    // Create chunks without embeddings — keyword search via regex fallback works fine
    for (let i = 0; i < doc.chunks.length; i++) {
      await prisma.$executeRawUnsafe(
        `INSERT INTO sales_agent."DocumentChunk" (id, document_id, organization_id, content, chunk_index, metadata, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        crypto.randomUUID(), document.id, org.id, doc.chunks[i], i,
        JSON.stringify({ title: doc.name.replace(".md", ""), fileName: doc.name }),
      );
    }
  }
  console.log(`✅ 4 知识库文档 + ${kbDocs.reduce((s, d) => s + d.chunkCount, 0)} 个分块`);

  // ── 9. AuditLog entries ──────────────────────────────────────────
  await prisma.auditLog.create({
    data: {
      organizationId: org.id, userId: user.id, userName: "张启明",
      action: "org.created", targetType: "Organization", targetId: org.id,
      metadata: { name: ORG_NAME, slug: ORG_SLUG },
    },
  });
  console.log("✅ 审计日志\n");

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🎉 启云科技中文 Demo 创建完成！");
  console.log("");
  console.log("登录信息：");
  console.log("  邮箱：admin@qicloud.cn");
  console.log("  密码：demo123456");
  console.log("");
  console.log("组织：启云科技 (qicloud-demo)");
  console.log("  - 5 成员 | 3 AI 坐席 | 15 客户");
  console.log("  - 10 对话 | 2 外呼活动 | 4 知识库文档");
  console.log("  - Feature Flag: 邮件=关, 企微=开");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
