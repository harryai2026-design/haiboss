# 技术执行依据

TECH_ARCHITECTURE_APPROVED = YES

依据：用户确认按其技术偏好方案升级，并于 2026-11-03 要求执行。采用 independent-site-starter：Astro 静态前台、Payload 3、PostgreSQL、pnpm workspace、内容发布任务、可靠询盘。具体页面、URL、视觉、模型和验收以根目录 v0.2 执行方案为准。

线上预检：haiboss.com / www.haiboss.com / haiboss.top 均 HTTP 200 且页面为海老板。历史台账显示主站为 Cloudflare Pages，生产入口应先核对现有 Pages 连接与后台可用执行端，保持已有主站连续可用。新电脑 SSH 文件缺失，CF 尚未登录，不能把页面可读当作部署权限已通。
