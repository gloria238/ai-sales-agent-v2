/**
 * SalesAgent Domain Golden Dataset — 30 hand-crafted Q&A pairs for RAG evaluation.
 *
 * Domain: 启云科技 (Qicloud) — Enterprise AI Customer Service & Sales Automation SaaS.
 * Knowledge base: product overview, pricing, FAQ, objection handling, case studies, competitor comparison.
 *
 * Categories: faq(8), product(7), pricing(5), competitor(4), case(3), general(3)
 * Difficulty: easy(12), medium(12), hard(6)
 */

import type { EvalCase } from "./types";

export const SALES_DATASET: EvalCase[] = [
  // ─── FAQ (8) ───────────────────────────────────────────────────────
  {
    id: "faq-01",
    question: "启云科技的AI客服支持哪些渠道？",
    groundTruthAnswer: "启云科技AI客服支持网页聊天、微信、企业微信、邮件和API接入等全渠道覆盖，实现统一的消息管理和客户视图。",
    relevantChunkIds: [], // filled by retriever
    metadata: { category: "faq", difficulty: "easy" },
  },
  {
    id: "faq-02",
    question: "你们的系统部署需要多长时间？",
    groundTruthAnswer: "标准SaaS版本当天即可开通使用。私有化部署根据客户IT环境复杂度，通常1-2周完成。系统提供完整的API文档和SDK，便于快速集成。",
    relevantChunkIds: [],
    metadata: { category: "faq", difficulty: "easy" },
  },
  {
    id: "faq-03",
    question: "AI客服能处理多复杂的客户问题？",
    groundTruthAnswer: "AI客服基于大语言模型和RAG知识库，能处理产品咨询、故障排查、订单查询、退换货政策等大多数常见问题。复杂问题会自动转接人工坐席，并附带完整对话上下文。",
    relevantChunkIds: [],
    metadata: { category: "faq", difficulty: "medium" },
  },
  {
    id: "faq-04",
    question: "数据安全怎么保障？",
    groundTruthAnswer: "系统已通过ISO 27001和等保三级认证。数据加密传输(TLS 1.3)，存储加密(AES-256)，支持数据脱敏和审计日志。私有化部署方案支持完全本地化数据存储。",
    relevantChunkIds: [],
    metadata: { category: "faq", difficulty: "medium" },
  },
  {
    id: "faq-05",
    question: "怎么训练AI理解我们公司的业务？",
    groundTruthAnswer: "通过知识库上传功能——支持PDF、Word、Markdown、FAQ等格式的文档批量导入。系统自动解析、分块、向量化，AI即可基于这些内容回答。通常上传核心产品文档后1小时内即可生效。",
    relevantChunkIds: [],
    metadata: { category: "faq", difficulty: "easy" },
  },
  {
    id: "faq-06",
    question: "你们的AI准确率怎么样？能保证不回答错吗？",
    groundTruthAnswer: "系统采用RAG检索增强生成技术，AI严格基于知识库内容回答，知识库没有的信息会明确告知而非编造。同时支持Answer置信度阈值设置，低于阈值自动转人工。实际客户场景中准确率通常达到90%以上。",
    relevantChunkIds: [],
    metadata: { category: "faq", difficulty: "medium" },
  },
  {
    id: "faq-07",
    question: "系统是否支持多语言？",
    groundTruthAnswer: "支持中文(简繁体)、英文、日文、韩文等10种语言。AI能自动检测客户语言并以相同语言回复。知识库支持多语言文档上传，同一条知识可以有不同的语言版本。",
    relevantChunkIds: [],
    metadata: { category: "faq", difficulty: "easy" },
  },
  {
    id: "faq-08",
    question: "你们的客户支持SLA是什么？",
    groundTruthAnswer: "标准版提供工作日9:00-18:00技术支持，响应时间<4小时。专业版提供7×24小时支持，响应时间<1小时。企业版提供专属技术经理+7×24小时+30分钟响应SLA。",
    relevantChunkIds: [],
    metadata: { category: "faq", difficulty: "medium" },
  },

  // ─── Product (7) ────────────────────────────────────────────────────
  {
    id: "prod-01",
    question: "启云科技的核心产品功能有哪些？",
    groundTruthAnswer: "核心产品包含三大模块：AI客服机器人(智能问答/多轮对话/情感识别)、AI销售助手(线索评分/自动跟进/话术生成)、统一工作台(全渠道消息管理/数据分析/知识库管理)。三个模块可在统一平台上无缝协作。",
    relevantChunkIds: [],
    metadata: { category: "product", difficulty: "easy" },
  },
  {
    id: "prod-02",
    question: "你们的AI销售助手具体能做什么？",
    groundTruthAnswer: "AI销售助手可以自动评分和分级海量线索(BANT/MEDDIC维度)、根据客户阶段和画像自动生成个性化跟进消息、在外呼活动中多步骤编排并自动执行邮件/消息序列、学习Top Sales的话术自动推荐最佳回复。销售团队效率通常提升3-5倍。",
    relevantChunkIds: [],
    metadata: { category: "product", difficulty: "medium" },
  },
  {
    id: "prod-03",
    question: "知识库支持哪些格式的文档上传？",
    groundTruthAnswer: "支持PDF、Word(DOCX)、Markdown、TXT、FAQ(JSON格式)五种格式。系统会自动解析文档、智能分块(递归语义分割，1000字符/块，200字符重叠)、向量化存储(pgvector+tsvector混合索引)。单个文件上限10MB。",
    relevantChunkIds: [],
    metadata: { category: "product", difficulty: "easy" },
  },
  {
    id: "prod-04",
    question: "RAG是什么？你们怎么实现的？",
    groundTruthAnswer: "RAG(检索增强生成)是让AI基于企业知识库的事实来回答问题，而非凭空生成。我们的RAG管线包括：查询改写→问题路由→混合检索(pgvector向量+tsvector关键词→RRF融合)→Cohere Reranker重排序→DeepSeek生成带引用的回答。这确保AI的回答基于真实文档而非幻觉。",
    relevantChunkIds: [],
    metadata: { category: "product", difficulty: "hard" },
  },
  {
    id: "prod-05",
    question: "可以和现有的CRM系统对接吗？",
    groundTruthAnswer: "支持通过RESTful API和Webhook与主流CRM系统对接，包括Salesforce、HubSpot、Zoho CRM等。也支持自定义CRM通过标准API对接。对接后可以实现客户数据同步、对话记录回传、商机阶段自动更新。",
    relevantChunkIds: [],
    metadata: { category: "product", difficulty: "medium" },
  },
  {
    id: "prod-06",
    question: "你们的系统支持私有化部署吗？",
    groundTruthAnswer: "支持三种部署方式：公有云SaaS(标准版，当天开通)、私有云部署(企业版，1-2周部署)、混合部署(AI引擎本地化+管理后台云端)。私有化方案支持AWS/阿里云/腾讯云/自建机房。",
    relevantChunkIds: [],
    metadata: { category: "product", difficulty: "medium" },
  },
  {
    id: "prod-07",
    question: "系统的并发处理能力是多少？",
    groundTruthAnswer: "标准版支持同时处理500个客户会话，专业版2000个，企业版可水平扩展至10000+。AI响应延迟P50<800ms, P95<3s。基于BullMQ异步任务队列实现弹性伸缩。",
    relevantChunkIds: [],
    metadata: { category: "product", difficulty: "hard" },
  },

  // ─── Pricing (5) ────────────────────────────────────────────────────
  {
    id: "pricing-01",
    question: "启云科技怎么收费？",
    groundTruthAnswer: "提供三个版本：标准版￥9,800/月(3个AI坐席+基础知识库)，专业版￥29,800/月(10个AI坐席+高级分析+7×24支持)，企业版按需定制(无限AI坐席+私有化部署+专属技术经理)。年付享8折优惠。",
    relevantChunkIds: [],
    metadata: { category: "pricing", difficulty: "easy" },
  },
  {
    id: "pricing-02",
    question: "每个AI坐席是什么意思？怎么算的？",
    groundTruthAnswer: "一个AI坐席相当于一个能同时处理多个客户会话的AI工作单元。标准版3个AI坐席可以同时处理约150个活跃客户会话。如果业务增长，可以在线升级增加AI坐席数(￥2,000/月/个)。",
    relevantChunkIds: [],
    metadata: { category: "pricing", difficulty: "medium" },
  },
  {
    id: "pricing-03",
    question: "有免费试用吗？",
    groundTruthAnswer: "标准版提供14天免费试用，包含3个AI坐席、基础知识库和全部功能。试用期间有专属客户成功经理指导配置。试用结束后可选择付费继续或导出数据。不需要绑定信用卡。",
    relevantChunkIds: [],
    metadata: { category: "pricing", difficulty: "easy" },
  },
  {
    id: "pricing-04",
    question: "企业版大概要多少钱？",
    groundTruthAnswer: "企业版按需报价，通常起步价￥80,000/月。包含无限AI坐席、私有化部署、定制化开发(SLA/品牌/UI)、专属技术经理、7×24小时30分钟响应SLA。具体价格根据并发规模、定制需求和部署方案评估后确定。",
    relevantChunkIds: [],
    metadata: { category: "pricing", difficulty: "medium" },
  },
  {
    id: "pricing-05",
    question: "你们的定价和竞品比有什么优势？",
    groundTruthAnswer: "相比国际竞品(Intercom/Zendesk AI $100-500/坐席/月)和国内竞品(网易七鱼/腾讯企点)，启云科技在同等功能下价格约为国际竞品的1/3-1/5，且支持私有化部署和中文场景深度优化。核心差异在于我们的RAG+混合检索技术确保更高的回答准确率。",
    relevantChunkIds: [],
    metadata: { category: "pricing", difficulty: "hard" },
  },

  // ─── Competitor (4) ─────────────────────────────────────────────────
  {
    id: "comp-01",
    question: "你们和网易七鱼有什么区别？",
    groundTruthAnswer: "网易七鱼是传统的基于意图识别+话术库的客服机器人，需要大量人工配置FAQ。启云科技基于大语言模型+RAG，无需大量配置——上传文档即可自动学习。我们的AI能处理开放域问题，而非仅匹配预设话术。同时我们提供AI销售助手模块，覆盖从营销到成交的完整链路。",
    relevantChunkIds: [],
    metadata: { category: "competitor", difficulty: "medium" },
  },
  {
    id: "comp-02",
    question: "和Intercom的AI功能比怎么样？",
    groundTruthAnswer: "Intercom Fin基于GPT-4，英文场景表现出色但中文支持有限，且不支持私有化部署。启云科技基于DeepSeek大模型，中文理解和生成能力更强，支持私有化部署，价格约为Intercom的1/5。但Intercom在全球品牌知名度和第三方集成生态上有优势。",
    relevantChunkIds: [],
    metadata: { category: "competitor", difficulty: "hard" },
  },
  {
    id: "comp-03",
    question: "为什么不用ChatGPT直接做客服？",
    groundTruthAnswer: "直接用ChatGPT做企业客服有三个核心问题：1)数据安全——客户数据发送到OpenAI服务器，不符合国内合规要求；2)幻觉——ChatGPT会自信地编造不存在的信息；3)无法学习企业知识——ChatGPT不知道你们公司的产品细节。启云科技基于RAG技术确保AI严格基于你的知识库回答，支持私有化部署保证数据安全。",
    relevantChunkIds: [],
    metadata: { category: "competitor", difficulty: "medium" },
  },
  {
    id: "comp-04",
    question: "和腾讯企点比怎么样？",
    groundTruthAnswer: "腾讯企点强在微信/QQ生态的原生集成，适合以社交渠道为主的客服场景。但AI能力方面主要是关键词匹配+预设话术。启云科技的AI基于大语言模型，能处理复杂问题的理解和推理。企点的优势是渠道覆盖(微信/QQ/企业微信)，我们的优势是AI智能度和销售全链路覆盖。两者可以互补——企点做前端渠道，启云做后端AI引擎。",
    relevantChunkIds: [],
    metadata: { category: "competitor", difficulty: "hard" },
  },

  // ─── Case Studies (3) ───────────────────────────────────────────────
  {
    id: "case-01",
    question: "有哪些客户案例可以参考？",
    groundTruthAnswer: "典型客户案例包括：某头部电商平台(日处理10万+客服会话，AI自动解决率85%)、某SaaS企业(销售团队效率提升4倍，线索到成交转化率提升60%)、某金融机构(合规知识库管理，人工客服效率提升200%)。具体案例详情可联系销售获取脱敏版本。",
    relevantChunkIds: [],
    metadata: { category: "case", difficulty: "easy" },
  },
  {
    id: "case-02",
    question: "电商行业的客户用了之后效果怎么样？",
    groundTruthAnswer: "某头部电商平台部署启云科技AI客服后：日处理客服会话从3000增至10万+(30倍扩容)，AI自动解决率85%，人工坐席从200人降至30人(处理高价值复杂问题)，客户满意度NPS从42提升至68，年节省人力成本约￥800万。",
    relevantChunkIds: [],
    metadata: { category: "case", difficulty: "medium" },
  },
  {
    id: "case-03",
    question: "你们有金融行业的案例吗？合规方面怎么解决的？",
    groundTruthAnswer: "某中型券商采用私有化部署方案：AI知识库管理3000+份合规文档(法规/内部制度/产品说明)，所有AI回答严格基于已审核的知识库内容，带完整的引用溯源。合规审核工作从5人天降至4小时，回答合规率99.7%。系统通过等保三级认证，数据完全留存在客户本地。",
    relevantChunkIds: [],
    metadata: { category: "case", difficulty: "hard" },
  },

  // ─── General (3) ────────────────────────────────────────────────────
  {
    id: "gen-01",
    question: "你们的公司背景是什么？",
    groundTruthAnswer: "启云科技成立于2024年，专注于企业级AI应用，核心团队来自阿里巴巴、字节跳动和微软。已获得多家头部VC投资，服务客户覆盖电商、SaaS、金融、教育等行业。总部位于深圳。",
    relevantChunkIds: [],
    metadata: { category: "general", difficulty: "easy" },
  },
  {
    id: "gen-02",
    question: "AI客服未来会被完全替代人工吗？",
    groundTruthAnswer: "不会。我们的理念是'AI辅助而非替代'——AI处理80%的重复性标准问题，让人类专注于20%需要同理心、创造力和复杂判断的高价值对话。系统支持Human-in-the-Loop模式：AI起草回复，人工审核后发送。这是效率与质量的最佳平衡。",
    relevantChunkIds: [],
    metadata: { category: "general", difficulty: "easy" },
  },
  {
    id: "gen-03",
    question: "接你们系统需要技术人员吗？",
    groundTruthAnswer: "SaaS版本零代码部署——注册即用，上传知识库文档即可开始。如需对接CRM/ERP等系统，我们有标准API和SDK，通常一个后端工程师1-3天即可完成集成。我们提供详细的API文档和专属客户成功经理全程指导。",
    relevantChunkIds: [],
    metadata: { category: "general", difficulty: "easy" },
  },
];
