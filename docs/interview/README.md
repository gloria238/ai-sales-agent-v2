# SalesAgent AI — 面试技术深度分析

> 9 个模块，覆盖全栈架构的每一个关键决策。

## 目录

| 模块 | 文件 | 核心问题 |
|------|------|---------|
| 1 | [01-整体架构.md](./01-整体架构.md) | Monorepo 依赖关系、App Router 边界、Vercel+Railway 双部署、16 数据模型关系图 |
| 2 | [02-前端架构.md](./02-前端架构.md) | Inbox 7 useState 状态机、Server/Client 分工、Email/Chat 通道隔离、分页 scrollHeight 保持 |
| 3 | [03-API层.md](./03-API层.md) | 9 层守卫链、Zod 校验、ai-draft 时序分析、percentile_cont 原始 SQL、限流策略 |
| 4 | [04-RAG-Pipeline.md](./04-RAG-Pipeline.md) | Query Rewriter 三变体、6 分类路由、RRF k=60 原理、Confidence Gate 0.7 阈值、两层语义缓存 |
| 5 | [05-HITL和Worker.md](./05-HITL和Worker.md) | conversationWorker 完整流程、PROMPT_ARMOR、ReAct Agent 4 工具、指数退避、BANT 评分 |
| 6 | [06-安全机制.md](./06-安全机制.md) | JWT 自实现、5×13 RBAC 矩阵、WebSocket 认证缺口、safe() 误用历史、customer 角色拦截 |
| 7 | [07-防幻觉机制.md](./07-防幻觉机制.md) | 5 层防幻觉金字塔、Confidence Gate vs 防幻觉区别、HITL 审核疲劳、KB 冲突检测空缺 |
| 8 | [08-可观测性和CI.md](./08-可观测性和CI.md) | AICallMetric 字段覆盖率、54 测试边界、CI 三 job 并行、Precision@5 测量条件 |
| 9 | [09-技术决策地图.md](./09-技术决策地图.md) | 最佳三决策、最大三债务、100 org 瓶颈分析、竞品差异化、面试坦白指南 |

## 重要提示

所有代码引用均为实际行号和真实函数名。如果某处写"无"或"不存在"，是实际读完文件后的结论，不猜测。
