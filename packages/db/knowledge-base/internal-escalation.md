# 启云科技 QiCloud — 内部支持升级流程

> 版本: V1.0 | 更新: 2026-07-07 | 层级: 运营支撑层
> 读者: 启云内部技术支持团队

## 问题分级

| 级别 | 定义 | 响应 | 升级条件 |
|------|------|------|---------|
| L1 | 使用咨询（怎么配置/功能在哪） | 4h | N/A |
| L2 | 功能异常（不影响核心业务） | 2h | 1h 未解决 |
| L3 | 核心业务中断 | 30min | 立即通知技术负责人 |
| L4 | 安全事件（数据泄露/未授权访问） | 15min | 立即通知 CTO+合规团队 |

## 常见 L2 排查指南

### AI 回答质量突然下降
检查知识库是否有新上传文档改变了检索排序→跑 `pnpm eval:sales:retrieval` 确认检索指标→检查 DeepSeek API 版本→检查 Cohere Reranker API 状态。

### 客户反馈"AI 答非所问"
到 KB Playground 用客户原问题复现→检查 Confidence Gate 是否触发不足→补充相关文档到知识库。

### 系统卡顿或超时
查 AI Health Dashboard→P95 延迟飙升？查 Supabase Dashboard→DB CPU 和连接数？查 Vercel Dashboard→Serverless 超时日志？查 Upstash Dashboard→Redis 配额？跨区域延迟→确认 DB 和函数是否同区域。
