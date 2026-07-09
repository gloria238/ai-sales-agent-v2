// 中文 Demo 种子数据：启云科技销售团队
// Usage: pnpm tsx packages/db/seed-chinese-demo.ts
//
// Creates "启云科技" org with:
//   - 1 owner (admin@qicloud.cn / demo123456)
//   - 4 members (销售经理、销售代表、运营、只读)
//   - 3 AI 销售坐席
//   - 17 客户
//   - 12 对话 + 消息（含 2 条外国客户 Email）
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
    const orgId = existing.id;
    // FK-safe cleanup using Prisma API — avoids column name guesswork
    await prisma.aICallMetric.deleteMany({ where: { organizationId: orgId } });
    await prisma.message.deleteMany({ where: { conversation: { organizationId: orgId } } });
    await prisma.conversation.deleteMany({ where: { organizationId: orgId } });
    await prisma.leadActivity.deleteMany({ where: { organizationId: orgId } });
    await prisma.campaignRun.deleteMany({ where: { campaign: { organizationId: orgId } } });
    await prisma.campaign.deleteMany({ where: { organizationId: orgId } });
    await prisma.documentChunk.deleteMany({ where: { organizationId: orgId } });
    await prisma.document.deleteMany({ where: { organizationId: orgId } });
    await prisma.lead.deleteMany({ where: { organizationId: orgId } });
    await prisma.apiKey.deleteMany({ where: { organizationId: orgId } });
    await prisma.featureFlag.deleteMany({ where: { organizationId: orgId } });
    await prisma.auditLog.deleteMany({ where: { organizationId: orgId } });
    await prisma.script.deleteMany({ where: { organizationId: orgId } });
    await prisma.agent.deleteMany({ where: { organizationId: orgId } });
    await prisma.membership.deleteMany({ where: { organizationId: orgId } });
    await prisma.organization.delete({ where: { id: orgId } });
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

  // ── 4. Leads (17 customers) — sequential, connection_limit=1 ──
  const leadData = [
    { name: "赵明辉", email: "zhaomh@yunfan-tech.com", company: "云帆科技", phone: "13800001001", stage: "negotiation", score: 88, source: "referral", dealAmount: 85000 },
    { name: "陈总", email: "chen@zhilian-hardware.com", company: "智联制造", phone: "13800001002", stage: "qualified", score: 75, source: "website", dealAmount: 42000 },
    { name: "王校长", email: "wang@siyuan-edu.com", company: "思源教育", phone: "13800001003", stage: "proposal", score: 82, source: "linkedin", dealAmount: 120000 },
    { name: "李明", email: "liming@baina-tech.com", company: "百纳科技", phone: "13800001004", stage: "new", score: 35, source: "website" },
    { name: "张薇", email: "zhangwei@dahai-group.com", company: "大海集团", phone: "13800001005", stage: "contacted", score: 55, source: "outbound", dealAmount: 200000 },
    { name: "孙浩然", email: "sunhr@huateng.cn", company: "华腾科技", stage: "qualified", score: 72, source: "website", dealAmount: 36000 },
    { name: "周婷", email: "zhouting@meinian.com", company: "美年健康", stage: "new", score: 20, source: "other" },
    { name: "吴刚", email: "wugang@ronghui-fin.com", company: "融汇金融", phone: "13800001008", stage: "closed_won", score: 95, source: "referral", dealAmount: 156000 },
    { name: "郑丽", email: "zhengli@aikang.com", company: "艾康医药", stage: "closed_lost", score: 60, source: "outbound" },
    { name: "马超", email: "machao@feiyu.com", company: "飞宇物流", stage: "contacted", score: 45, source: "linkedin", dealAmount: 29000 },
    { name: "林小红", email: "linxh@yunduan-data.com", company: "云端数据", stage: "proposal", score: 78, source: "website", dealAmount: 67000 },
    { name: "黄建军", email: "huangjj@hengyuan.com", company: "恒源建筑", stage: "new", score: 15, source: "outbound" },
    { name: "许晴", email: "xuqing@ruiyi-law.com", company: "睿义律所", stage: "contacted", score: 40, source: "referral" },
    { name: "何伟", email: "hewei@jucheng-mfg.com", company: "聚成制造", stage: "qualified", score: 68, source: "website", dealAmount: 54000 },
    { name: "沈悦", email: "shenyue@tianyu-logistics.com", company: "天域物流", stage: "negotiation", score: 84, source: "linkedin", dealAmount: 93000 },
    { name: "James Wilson", email: "james.wilson@nexgen-tech.com", company: "NexGen Tech", stage: "qualified", score: 72, source: "linkedin", dealAmount: 65000 },
    { name: "Sarah Chen", email: "sarah.chen@pacific-ventures.com", company: "Pacific Ventures", stage: "contacted", score: 58, source: "website", dealAmount: 48000 },
  ];
  const leads = [];
  for (const d of leadData) {
    leads.push(await prisma.lead.create({ data: { organizationId: org.id, ...d } }));
  }
  console.log("✅ 17 客户（含 2 外国联系人）");

  // ── 5. Conversations + Messages ──────────────────────────────────
  // Conv 1: 赵明辉 (云帆科技) — negotiation — awaiting_approval (last AI draft pending)
  const conv1 = await prisma.conversation.create({
    data: {
      organizationId: org.id, leadId: leads[0].id, agentId: agents[0].id,
      channel: "chat", subject: "企业版采购评估",
      status: "awaiting_approval",
      messages: {
        create: [
          { direction: "inbound", content: "你好，我们团队 80 人，主要做 B2B SaaS。在对比几个 AI 销售助手的方案，想了解一下你们的核心能力。", channel: "chat" },
          { direction: "outbound", content: "赵总您好！欢迎了解。\n\n我们的核心价值很简单：用 AI 帮销售团队做三件事——自动跟进客户、智能评分筛选、知识库驱动回复。和传统 CRM 不同，我们不是在「管」客户数据，而是在「帮」销售执行。\n\n80 人团队是很典型的规模——建议直接看专业版（¥5,999/月，10 个 AI 坐席，全渠道接入），性价比最高。这周方便安排一次 30 分钟的在线演示吗？我请产品经理一起。", channel: "chat", aiMetadata: { tone: "professional", suggestedAction: "send_now" } },
          { direction: "inbound", content: "可以，这周五下午 3 点。不过我还有个问题——我们现在用的是销售易 CRM，两个系统能一起用吗？", channel: "chat" },
          { direction: "outbound", content: "完全没问题。\n\n销售易管客户数据和销售流程，启云做 AI 执行——两者互补不替代。我们有 API 可以把 CRM 里的客户群体同步过来，AI 处理完后把消息记录和评分写回 CRM。很多客户是同时用的。\n\n周五演示我会重点展示 CRM 双向同步这部分。另外，你们 CTO 方便参加吗？可以顺便过一遍技术架构和安全性。", channel: "chat", aiMetadata: { tone: "professional", suggestedAction: "send_now" } },
          { direction: "inbound", content: "CTO 这周在国外，下周回来。周五演示可以先看产品和功能，技术部分我录屏发给他。另外帮我提前发一份产品介绍 PDF，我先看看。", channel: "chat" },
          { direction: "outbound", content: "好的赵总，产品介绍 PDF 我发到您邮箱了。\n\n周五演示议程：\n1. AI 坐席能力展示（15分钟）——自动跟进客户、智能评分、知识库回复\n2. CRM 双向同步（5分钟）——销售易/纷享销客 API 对接\n3. 您的团队搭建方案（10分钟）——80 人团队的坐席配置建议\n\n周五下午 3 点，线上腾讯会议。我把邀请链接发您。有什么问题随时找我。", channel: "chat", aiMetadata: { tone: "professional", suggestedAction: "review" } },
        ],
      },
    },
  });

  // Conv 2: 陈总 (智联制造) — qualified — active
  const conv2 = await prisma.conversation.create({
    data: {
      organizationId: org.id, leadId: leads[1].id, agentId: agents[0].id,
      channel: "chat", subject: "制造业销售管理方案",
      status: "active",
      messages: {
        create: [
          { direction: "inbound", content: "我们做工业硬件的，销售 20 个人在全国 6 个城市。最大痛点是客户信息散在各人微信上，总部看不到全貌。你们能解决吗？", channel: "chat" },
          { direction: "outbound", content: "陈总您好！这正好是我们的强项。\n\n启云的多渠道统一收件箱把企微、邮件、网页咨询汇聚到同一个后台，总部销售经理可以看到所有客户对话、AI 处理状态和跟进记录，不用再跟每个销售要截图。\n\n智联 20 人 6 区域的场景，建议专业版——6 个区域 AI 坐席 + 2 个总部审核坐席。某工业 IoT 客户上线 3 个月后，代理商跟进覆盖率从 61% 提升到了 96%。我发你一份他们的案例？", channel: "chat", aiMetadata: { tone: "consultative", suggestedAction: "send_now" } },
          { direction: "inbound", content: "这个案例发来看看。另外我们的主要沟通渠道是企业微信，你们能直接接入吗？", channel: "chat" },
          { direction: "outbound", content: "案例已发。\n\n企业微信接入很简单：后台「渠道管理」→「企业微信」→ 管理员扫码授权，2 分钟搞定。授权后客户消息实时同步到统一收件箱，AI 就可以自动处理了。\n\n对了，你们最近有没有考虑拓展海外市场？如果有的话，我们的邮件渠道也能覆盖。", channel: "chat", aiMetadata: { tone: "consultative", suggestedAction: "send_now" } },
          { direction: "inbound", content: "海外暂时没有计划。案例看完了，挺有参考价值。这样，我下周组织一下各区域经理线上跟你聊聊，先确认一下团队内部对 AI 助手的接受度。你哪天有空？", channel: "chat" },
        ],
      },
    },
  });

  // Conv 3: 王校长 (思源教育) — proposal — active
  const conv3 = await prisma.conversation.create({
    data: {
      organizationId: org.id, leadId: leads[2].id, agentId: agents[0].id,
      channel: "chat", subject: "教育行业 AI 客服方案",
      status: "active",
      messages: {
        create: [
          { direction: "inbound", content: "在线教育公司，课程顾问 45 人。寒暑假咨询量暴增 3 倍，平时又用不了那么多人。你们能解决波峰波谷问题吗？还有家长信息要保障隐私。", channel: "chat" },
          { direction: "outbound", content: "王校长您好！教育行业的季节性波动是我们最熟悉的场景之一。\n\n方案很清晰：\n1. 旺季 AI 7×24 处理（秒级响应），课程顾问审核 AI 回复即可，人均处理量从 35 条/天 → 89 条/天\n2. 淡季只保留基础 AI 坐席，零人力浪费\n3. 企业版支持完全私有化部署，家长数据在您自己的服务器上，通过等保二级\n\n某 K12 平台上线 6 个月后夜间咨询覆盖率从 0 → 100%，试听课转化率翻倍。", channel: "chat", aiMetadata: { tone: "professional", suggestedAction: "send_now" } },
          { direction: "inbound", content: "这个案例数据很硬。私有化部署大概多长时间？我们想在暑假前搞定。还有一个问题——我们的课程体系很复杂，AI 能学会吗？", channel: "chat" },
          { direction: "outbound", content: "私有化部署 2-3 周。暑假前完全来得及。\n\n关于课程体系：把课程介绍、价格表、FAQ 上传到知识库（PDF/Word/MD 都行），通常 30-50 篇文档 AI 就能覆盖 80% 以上的日常咨询。思源有 45 人课程顾问团队，历史对话数据肯定很丰富——企业版还支持定制模型微调，用你们真实对话训练。\n\n要不这周我上门演示？带上给教育行业定制的解决方案。", channel: "chat", aiMetadata: { tone: "consultative", suggestedAction: "send_now" } },
          { direction: "inbound", content: "好，这周四上午 10 点来我们公司。地址是海淀区中关村软件园 3 号楼。记得带企业版报价。另外帮我们安排 14 天免费试用，我先让两个课程顾问试试。", channel: "chat" },
        ],
      },
    },
  });

  // Conv 4: 李明 (百纳科技) — new lead — active with multi-round discovery
  const conv4 = await prisma.conversation.create({
    data: {
      organizationId: org.id, leadId: leads[3].id, agentId: agents[1].id,
      channel: "chat", subject: "了解产品与服务",
      status: "active",
      messages: {
        create: [
          { direction: "inbound", content: "在你们官网看到产品，我们是个 8 人的创业公司，做企业服务 SaaS。想了解一下基础版。", channel: "chat" },
          { direction: "outbound", content: "您好！创业公司选启云很合适——基础版 ¥1,999/月，3 个 AI 坐席 + 10,000 条消息/月，完全够 8 人团队用。\n\n14 天免费试用，不用绑卡。要不要我帮您开通试用？几分钟就好。", channel: "chat", aiMetadata: { tone: "friendly", suggestedAction: "send_now" } },
          { direction: "inbound", content: "好啊，帮我开一下。另外问一下——我们主要用企业微信和客户沟通，你们能直接连企微吗？", channel: "chat" },
          { direction: "outbound", content: "企业微信完全支持。后台扫码授权 2 分钟就接通，客户消息实时同步到收件箱。\n\n试用账号信息我发你了：\n- 登录地址和密码见邮件\n- 知识库已经预置了一份 SaaS 行业通用 FAQ\n- 建议先上传你们的产品文档，AI 就能针对百纳的产品回答问题\n\n遇到问题随时找我。", channel: "chat", aiMetadata: { tone: "friendly", suggestedAction: "send_now" } },
          { direction: "inbound", content: "收到，登录进去了。我在知识库上传了一份产品介绍 PDF，大概多久能用？另外 AI 坐席是自动回复客户的吗？我需要审核吗？", channel: "chat" },
          { direction: "outbound", content: "PDF 通常 30 秒内处理完成，刷新一下知识库页面就能看到。\n\n关于 AI 回复机制：基础版是 AI 自动回复（适合小团队快速上手），专业版起开启 HITL 审核模式——AI 起草初稿，你批准后再发。如果试用下来觉得审核功能重要，可以随时升级。\n\n现在可以试着在「收件箱」里给 AI 发一条模拟消息，体验一下 AI 是怎么基于你刚上传的 PDF 来回复的。", channel: "chat", aiMetadata: { tone: "friendly", suggestedAction: "send_now" } },
          { direction: "inbound", content: "试了一下，AI 回答得还挺准的，确实引用了我们文档里的内容。这个 RAG 是怎么做到的？", channel: "chat" },
        ],
      },
    },
  });

  // Conv 5: 孙浩然 (华腾科技) — API 集成 — active
  const conv5 = await prisma.conversation.create({
    data: {
      organizationId: org.id, leadId: leads[5].id, agentId: agents[0].id,
      channel: "chat", subject: "API 集成技术对接",
      status: "active",
      messages: {
        create: [
          { direction: "inbound", content: "我们有自己的 CRM，想通过 API 把你们的 AI 能力集成进来。支持什么认证方式？有没有 SDK？支持的并发量多少？", channel: "chat" },
          { direction: "outbound", content: "技术对接这块我们支持得很完善：\n\n认证：API Key (Bearer Token) + Cookie Session 双模式\nSDK：Node.js 和 Python，npm install / pip install 即用\n并发：专业版 50 QPS，企业版 200 QPS\n\nAPI 文档在 docs.qicloud.cn/api，有完整的 OpenAPI Spec。专业版起就支持 API 接入——适合华腾这类有自己技术栈的团队。需要我拉个技术群吗？", channel: "chat", aiMetadata: { tone: "professional", suggestedAction: "send_now" } },
          { direction: "inbound", content: "文档看了，接口设计挺规范的。我们评估完给你反馈。另外，Token 消耗怎么计费？", channel: "chat" },
          { direction: "outbound", content: "Token 计费很简单：\n\n专业版 ¥5,999/月 含 50,000 条消息，超出后每条 ¥0.2\n企业版不限消息量\n\nAPI 调用按「AI 草稿生成」次数计，一次 AI 撰写回复 ≈ 一次消耗（通常 1,500-4,000 token）。你们想做多少量级的集成？我帮你算个月度预算。", channel: "chat", aiMetadata: { tone: "professional", suggestedAction: "send_now" } },
        ],
      },
    },
  });

  // Conv 6: 吴刚 (融汇金融) — closed_won — showing completed deal
  const conv6 = await prisma.conversation.create({
    data: {
      organizationId: org.id, leadId: leads[7].id, agentId: agents[2].id,
      channel: "chat", subject: "续约与升级咨询",
      status: "closed",
      messages: {
        create: [
          { direction: "inbound", content: "年费下个月到期，我们想从专业版升级到企业版——需要私有化部署。续约有什么优惠吗？", channel: "chat" },
          { direction: "outbound", content: "吴总好！\n\n续约优惠：年付 8 折\n升级方案：专业版→企业版差价按天折算\n私有化部署费：¥49,000（一次性），续约客户部署费打 9 折\n\n升级后首年总费用：¥191,990（年付 8 折）+ ¥44,100（部署费）≈ ¥236,090\n\n我让客户成功经理这周联系您安排升级评估？", channel: "chat", aiMetadata: { tone: "friendly", suggestedAction: "send_now" } },
          { direction: "inbound", content: "好的，安排吧。私有化部署大概多久？我们想在 Q3 前完成。另外部署后运维需要我们自己维护吗？", channel: "chat" },
          { direction: "outbound", content: "私有化部署 2-3 周完成，包括安装、配置和运维培训。Q3 前完全来得及。\n\n运维方面：基础运维（监控/备份/重启）培训 2 小时即可上手，日常工作量很小。复杂问题我们有 7×24 远程支持。如果想完全托管，我们也可以提供运维外包服务——每月 ¥3,000。\n\n客户成功经理这周联系您确认时间。恭喜升级！", channel: "chat", aiMetadata: { tone: "professional", suggestedAction: "send_now" } },
        ],
      },
    },
  });

  // Conv 7: 林小红 (云端数据) — 数据安全 — active
  const conv7 = await prisma.conversation.create({
    data: {
      organizationId: org.id, leadId: leads[10].id, agentId: agents[0].id,
      channel: "chat", subject: "数据安全与合规咨询",
      status: "active",
      messages: {
        create: [
          { direction: "inbound", content: "我们做数据服务的，合规要求非常高。请详细说明：1. 数据传输和存储加密方案 2. 权限模型 3. 安全认证 4. 是否支持私有化部署", channel: "chat" },
          { direction: "outbound", content: "林总您好！逐条回答：\n\n1. 传输：HTTPS + TLS 1.3，强制 HSTS\n存储：AES-256，密钥托管在 Supabase KMS\n\n2. 权限：4 角色 × 13 权限细粒度矩阵（owner/admin/operator/viewer），数据 org-scoped 隔离\n\n3. 认证：等保二级，完成 165 项安全审计（高危项全部修复），JWT + bcrypt 12 + httpOnly Cookie\n\n4. 私有化部署：企业版支持，数据完全在您自己服务器上\n\n需要发安全白皮书吗？", channel: "chat", aiMetadata: { tone: "professional", suggestedAction: "send_now" } },
          { direction: "inbound", content: "安全白皮书发我。权限矩阵也发来看看——我们的客户数据需要按项目团队隔离访问。", channel: "chat" },
          { direction: "outbound", content: "白皮书和权限矩阵已发到您邮箱。\n\n关于按项目团队隔离：企业版支持自定义角色和团队分组——可以把客户数据按项目划分到不同团队，每个团队只能看到自己项目的对话和数据。这正好是云端数据这类服务公司的典型需求。\n\n需要安排一次针对性的安全演示吗？CTO 和安全团队可以一起。", channel: "chat", aiMetadata: { tone: "consultative", suggestedAction: "send_now" } },
        ],
      },
    },
  });

  // Conv 8: 沈悦 (天域物流) — negotiation — awaiting_approval
  const conv8 = await prisma.conversation.create({
    data: {
      organizationId: org.id, leadId: leads[14].id, agentId: agents[0].id,
      channel: "chat", subject: "企业版正式报价",
      status: "awaiting_approval",
      messages: {
        create: [
          { direction: "inbound", content: "请发一份企业版正式报价。我们需要 20 个坐席，私有化部署，对接飞书 SSO。", channel: "chat" },
          { direction: "outbound", content: "沈总您好！根据您的需求，报价如下：\n\n企业版年付：¥191,990/年（8 折）\n私有化部署费：¥49,000（一次性）\n飞书 SSO：已含在企业版内，零额外费用\n\n合计首年：¥240,990，次年：¥191,990/年\n\n含增值税专票。需要我出正式合同吗？", channel: "chat", aiMetadata: { tone: "professional", suggestedAction: "review" } },
          { direction: "inbound", content: "合同先不出，我们内部再讨论一下。有几个细节想确认：私有化部署后后续升级怎么处理？20 个坐席够用吗，后续扩容怎么计费？", channel: "chat" },
          { direction: "outbound", content: "好问题，逐一说明：\n\n升级：私有化部署后由我们的运维团队远程协助升级，小版本免费，大版本需协调窗口期，不会影响业务运行\n\n扩容：企业版不限坐席数和消息量，所以 20 个还是 50 个坐席，费用不变。你们天域物流的业务增长完全不用担心坐席上限\n\n要不要请你们的运维负责人一起聊一次，把部署和运维流程过一遍？", channel: "chat", aiMetadata: { tone: "professional", suggestedAction: "review" } },
        ],
      },
    },
  });

  // Conv 9: James Wilson (NexGen Tech) — 外国客户 Email — active
  const conv9 = await prisma.conversation.create({
    data: {
      organizationId: org.id, leadId: leads[15].id, agentId: agents[0].id,
      channel: "email", subject: "Re: AI Sales Assistant for NexGen Tech — Enterprise Evaluation",
      status: "active",
      messages: {
        create: [
          { direction: "inbound", content: "Hi there,\n\nWe're a B2B SaaS company based in Austin, TX with a sales team of 40. We're evaluating AI sales assistant platforms and came across QiCloud. A few questions:\n\n1. How does your AI handle English-language sales conversations?\n2. Do you have any US-based customers we could speak with?\n3. What's your data residency policy — can we keep data in US servers?\n\nLooking forward to hearing from you.\n\nBest,\nJames Wilson\nVP of Sales, NexGen Tech", channel: "email" },
          { direction: "outbound", content: "Hi James,\n\nThanks for reaching out — great questions.\n\n1. English-language capability: Our AI supports English natively. The knowledge base, conversation handling, and response generation all work in English. The system auto-detects the customer's language and responds in the same language.\n\n2. US references: We have several US-based customers. I can connect you with a SaaS company in San Francisco (60-person team) that's been using QiCloud for 8 months — they saw a 40% reduction in response time and 3x increase in qualified leads.\n\n3. Data residency: For Enterprise plans, we support private deployment — all data stays on your own infrastructure, in whatever region you choose. For our cloud-hosted plans, data currently resides in Asia-Pacific (Singapore). If US data residency is a hard requirement, the Enterprise plan with private deployment is the right path.\n\nWould you be open to a 30-minute demo this week? I can walk you through the platform and show you how it handles English-language sales workflows.\n\nBest,\nQiCloud Team", channel: "email", aiMetadata: { tone: "professional", suggestedAction: "send_now" } },
          { direction: "inbound", content: "Thanks for the detailed response. A few follow-ups:\n\n- Can you share the SF customer's case study?\n- What does the Enterprise plan pricing look like for a 40-person team?\n- Do you support SSO integration with Okta?\n\nWe're available Thursday 10am CT for a demo.\n\nJames", channel: "email" },
          { direction: "outbound", content: "Hi James,\n\nHere's what you asked for:\n\n- Case study: Attached. The SF customer's key metrics: 40% faster response time, 3x qualified leads, 96% agent follow-up coverage (up from 61%).\n\n- Enterprise pricing for 40 users: $2,500/month (annual billing, 20% discount applied). Includes unlimited AI seats, unlimited messages, full channel support (email + website widget + API), and SSO. Private deployment is a one-time $6,500 setup fee.\n\n- Okta SSO: Yes, fully supported via OIDC. We also support Azure AD, Google Workspace, and custom SAML.\n\nThursday 10am CT works — I'll send a calendar invite with the Zoom link. Looking forward to it.\n\nBest,\nQiCloud Team", channel: "email", aiMetadata: { tone: "professional", suggestedAction: "review" } },
        ],
      },
    },
  });

  // Conv 10: Sarah Chen (Pacific Ventures) — 外国客户 Email — contacted
  const conv10 = await prisma.conversation.create({
    data: {
      organizationId: org.id, leadId: leads[16].id, agentId: agents[0].id,
      channel: "email", subject: "Inquiry: AI-powered sales automation for investment advisory",
      status: "active",
      messages: {
        create: [
          { direction: "inbound", content: "Hello,\n\nI'm exploring AI sales tools for our investment advisory firm. We have 15 relationship managers who spend too much time on repetitive client follow-ups. Key requirements:\n\n- Multi-language support (English + Mandarin + Cantonese)\n- Compliance-friendly — all AI-generated messages need human approval before sending\n- Integration with our existing CRM (Salesforce)\n\nIs QiCloud a good fit? Would appreciate pricing for a 15-user setup.\n\nRegards,\nSarah Chen\nManaging Director, Pacific Ventures", channel: "email" },
          { direction: "outbound", content: "Hi Sarah,\n\nQiCloud sounds like an excellent fit for Pacific Ventures. Here's why:\n\n1. Multi-language: We support English, Mandarin, Cantonese, Japanese, and Korean. AI auto-detects the client's language and matches it. For a HK-based firm serving both English and Chinese-speaking clients, this is exactly the use case we built for.\n\n2. Compliance + HITL: All AI-generated messages go through a Human-in-the-Loop review flow by default — AI drafts, your RM approves before sending. Full audit trail on every decision. This is critical for regulated industries like investment advisory.\n\n3. Salesforce integration: We have a REST API + pre-built Salesforce connector. Client data syncs both ways — leads from Salesforce → QiCloud for AI follow-up → results written back to Salesforce.\n\nPricing for 15 users:\n- Professional plan: $750/month (annual billing), includes 10 AI seats + 5 additional seats at $40/seat/month = $950/month total\n\nWould you like to schedule a demo? I can show you the compliance review flow and Salesforce integration specifically.\n\nBest,\nQiCloud Team", channel: "email", aiMetadata: { tone: "consultative", suggestedAction: "send_now" } },
          { direction: "inbound", content: "This sounds promising. A few more questions before we schedule a demo:\n\n1. What's the typical implementation timeline for a team our size?\n2. Can we run a pilot with 3 RMs before rolling out to all 15?\n3. Do you have any financial services clients we can reference?\n\nSarah", channel: "email" },
          { direction: "outbound", content: "Hi Sarah,\n\nGreat follow-up questions:\n\n1. Timeline: Typically 2-3 weeks for a team your size. Week 1: setup + Salesforce integration + knowledge base upload. Week 2: team training + pilot launch. Week 3: review + full rollout.\n\n2. Pilot: Absolutely. Start with 3 RMs on the Professional plan, then scale to all 15 when you're comfortable. No minimum seat commitment during pilot.\n\n3. Financial services references: We have a regional bank in Singapore and an insurance brokerage in Taipei using QiCloud. Both report significant reduction in follow-up time. I can connect you with the Singapore bank's Head of Digital — they're happy to share their experience.\n\nWhen works for you to connect? I'm happy to jump on a call at your convenience.\n\nBest,\nQiCloud Team", channel: "email", aiMetadata: { tone: "consultative", suggestedAction: "send_now" } },
        ],
      },
    },
  });

  // Conv 11: 张薇 (大海集团) — cold outreach from 小启 — active
  const conv11 = await prisma.conversation.create({
    data: {
      organizationId: org.id, leadId: leads[4].id, agentId: agents[1].id,
      channel: "chat", subject: "外呼活动跟进",
      status: "active",
      messages: {
        create: [
          { direction: "outbound", content: "张薇总您好！我是启云科技的小启。\n\n注意到您上个月浏览了我们外呼活动引擎的产品页。我们最近有客户用这个功能把邮件打开率从 12% 拉到了 31%。大海集团 200 万 pipeline 的量级，哪怕提升 5% 的转化率都是可观的数字。\n\n要不要花 15 分钟了解一下？不方便的话我发一份案例也可以。", channel: "chat", aiMetadata: { tone: "professional", suggestedAction: "send_now" } },
          { direction: "inbound", content: "发案例吧，最近比较忙。你们的 AI 能自动识别客户意向吗？我们用过一些工具，回复质量不太行。", channel: "chat" },
          { direction: "outbound", content: "案例已发。\n\n关于意向识别：我们的评分系统从 5 个维度打分（预算/决策角色/时间线/需求匹配/竞品认知），不是简单的关键词匹配。\n\n至于回复质量——您提到的「不太行」大概率是对方没有配置知识库。启云的做法是：你把产品文档、FAQ、话术上传到知识库，AI 基于这些内容来回复，不是凭空编。另外专业版所有 AI 草稿都要人审核后才发——质量不过关您可以改或扔。\n\n等您忙完这段时间，随时找我做演示。", channel: "chat", aiMetadata: { tone: "consultative", suggestedAction: "send_now" } },
        ],
      },
    },
  });

  // Conv 12: 许晴 (睿义律所) — 律所场景 — active
  const conv12 = await prisma.conversation.create({
    data: {
      organizationId: org.id, leadId: leads[12].id, agentId: agents[0].id,
      channel: "chat", subject: "律所 AI 客服方案",
      status: "active",
      messages: {
        create: [
          { direction: "inbound", content: "我们是律师事务所，客户沟通涉及大量法律术语和保密信息。你们的 AI 能理解法律语境吗？数据保密能不能保证？", channel: "chat" },
          { direction: "outbound", content: "许律师您好！两个问题分开说：\n\n1. 行业适配：把律所的法律文书、FAQ、服务介绍上传到知识库（支持 PDF/Word），AI 就能「学会」法律行业的语境和术语。已有律所客户在使用，反馈只要知识库够详实（30-50 篇文档），AI 可覆盖 80% 以上日常客户问题。\n\n2. 保密：企业版支持私有化部署，数据完全在您自己服务器上。传输 HTTPS+TLS 1.3，存储 AES-256。签保密协议是标准流程，我们没问题。\n\n要不要安排一次针对律所场景的演示？", channel: "chat", aiMetadata: { tone: "consultative", suggestedAction: "send_now" } },
          { direction: "inbound", content: "私有化部署的方案不错。你们有没有做过律所的案例？发一个来看看。另外，律师的计时收费模式决定了他们没办法随时盯着 AI 审核消息——你们有没有移动端？", channel: "chat" },
          { direction: "outbound", content: "律所案例已发——某精品所上线后客户咨询响应时间从 4 小时缩短到了 3 分钟，律师只需碎片时间审核 AI 草稿。\n\n移动端：管理后台是响应式设计，手机浏览器打开就能用，审核 AI 草稿直接点击「批准」或「拒绝」就搞定，不需要开电脑。WebSocket 实时推送，新消息到了手机会显示通知。\n\n不过目前没有独立的 App——如果移动端体验对你们至关重要，这个可以作为定制需求评估。", channel: "chat", aiMetadata: { tone: "consultative", suggestedAction: "send_now" } },
        ],
      },
    },
  });
  console.log("✅ 12 对话 + 消息");

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
        "所有 AI 生成的消息默认进入「待审核」状态（HITL 模式），需要销售经理确认后才发送。AI 只写初稿，人工做最终决定。基础版除外——为降低使用门槛，基础版 AI 生成即发送。",
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
        "Q：AI 会不会自动发消息？A：不会。所有 AI 消息默认进入「待审核」状态（HITL 模式），需要人工确认后才发送。基础版除外——基础版为降低使用门槛，AI 生成即发送，但可升级到专业版开启审核。",
        "Q：数据安全吗？A：传输层 HTTPS + TLS 1.3，存储层 AES-256 加密，认证层 JWT + bcrypt 12 轮哈希 + httpOnly Cookie。通过国家信息安全等级保护二级认证。企业版支持完全私有化部署。",
        "Q：和销售易/纷享销客有什么区别？A：销售易和纷享销客是 CRM（管理客户数据和销售流程），启云科技是 AI 销售助手（帮销售主动跟进客户、自动回复、智能评分）。两者互补不替代，很多客户是两个系统一起用。",
        "Q：可以对接现有的 CRM 吗？A：可以。专业版和企业版提供 RESTful API，支持 API Key (Bearer Token) 和 Cookie Session 认证。提供 Node.js 和 Python SDK。",
        "Q：知识库支持什么文件格式？A：支持 PDF、Word (.docx)、Markdown (.md)、纯文本 (.txt) 和 FAQ 问答对 (JSON)。单文件最大 10MB。上传后通常 30 秒内完成处理。",
        "Q：怎么接入企业微信？A：在后台「渠道管理」→「企业微信」中扫码授权即可。需要企业微信管理员账号。接入过程约 2 分钟，授权后消息实时同步。",
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
        `INSERT INTO sales_agent."DocumentChunk" (id, "documentId", "organizationId", content, "chunkIndex", metadata, "createdAt")
         VALUES ($1, $2, $3, $4, $5, $6::jsonb, NOW())`,
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
  console.log("  - 5 成员 | 3 AI 坐席 | 17 客户");
  console.log("  - 12 对话 | 2 外呼活动 | 4 知识库文档");
  console.log("  - Feature Flag: 邮件=关, 企微=开");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
