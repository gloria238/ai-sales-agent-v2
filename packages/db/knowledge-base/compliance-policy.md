# 启云科技 QiCloud — 合规与安全政策

> 版本: V2.0 | 更新: 2026-07-07 | 层级: 运营支撑层
> 关联: technical-specs.md, product-overview.md
> 读者: 客户 IT 安全团队、法务、采购决策者

## 认证与标准

| 认证 | 状态 | 覆盖 |
|------|------|------|
| ISO 27001 | ✅ 已获得 | 所有版本 |
| 等保三级 | ✅ 已获得 | 所有版本 |
| SOC 2 Type II | 🔄 审核中 (2026 Q4) | 专业版及企业版 |

## 数据保护

传输: TLS 1.3（强制 HTTPS），HSTS (max-age=63072000, includeSubDomains, preload)。存储: AES-256，企业版密钥客户自管。密码: bcrypt 12 轮盐哈希不可逆。API Key: SHA-256 哈希存储，仅保留前缀用于识别。日志脱敏: email/JWT 自动 SHA-256 哈希后才写入。AI 调用: 传输数据仅含查询和知识库上下文，不含完整客户 PII。私有化: 所有数据完全不出企业防火墙。

## 访问控制

5 角色×13 权限 RBAC，最小权限原则。JWT 无状态认证+Redis 黑名单即时失效。双层限流: API 100 req/min (Upstash 滑动窗口)，Auth 10 req/min (防暴力破解)。19 处 Zod Schema 输入验证。文件上传魔数校验+10MB 上限。所有操作写入不可变 AuditLog。客户 Portal 权限严格限定（Lead.userId scoping）。

## 隐私合规

PIPL（个人信息保护法）: 数据仅用于服务交付，不外泄不转售。数据删除: 客户可随时导出（JSON/CSV），要求彻底删除 30 天内完成。Cookie: 仅 session cookie (JWT, httpOnly+Secure)，无跟踪类 cookie。第三方数据: 除 DeepSeek API（AI 调用）和 Resend（邮件）外不与第三方共享。两个第三方均签署 DPA。

## 灾备与业务连续性

数据库每日自动备份（保留 14 天）。RTO（恢复时间）: 标准版 4h/专业版 1h/企业版 30min。RPO（恢复点）: 24h。各组件均有降级路径——单个外部服务挂掉不会全系统不可用。
