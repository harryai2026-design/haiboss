# 海老板 · 出海情报、AI 应用与增长服务

Astro 静态前台 + Payload 3 + 独立 PostgreSQL，复用 independent-site-starter。保留增长服务，增加出海情报、AI 动态、实战指南、专题、内容搜索、RSS 和可靠咨询接收。

## 本地启动

使用 Node 24 LTS、pnpm，按锁文件安装后执行 pnpm setup、pnpm dev。
本机双击“启动海老板.cmd”；停止用“停止海老板.cmd”。当前独立端口：前台 http://localhost:45121 ，后台 http://localhost:45101/admin 。.local/runtime-node.json 只记录本机 Node 路径，其他电脑绑定自己的 Node 24，不复制秘密或运行数据。

首次创建所有者须在安全后台完成；生产初始化可使用 scripts/bootstrap-owner.ts，凭据仅写仓库外本人控制的私密文件。已有用户不会覆盖。

## 内容与发布

文章包含栏目、类型、专题、来源、日期、精选、内部核验记录和预约发布。编辑准备草稿，所有者发布或批准排期。草稿、内部记录不进入公开接口、搜索、RSS 或静态页面。
发布产生持久任务：重建→链接/SEO 审计→静态版本切换；失败保留旧版。预约发布只处理已审核且时间已到的草稿。代码回退不自动回退数据库。
content/launch.json 仅为首批内容导入材料；正常内容以 CMS 为准。导入脚本按 slug 只插入缺失项，不覆盖后续编辑。

命令（均从项目根目录运行）：
- node --env-file=.env --import tsx scripts/import-launch-content.ts
- node --env-file=.env --import tsx scripts/collect-content.ts
- node --env-file=.env --import tsx scripts/draft-candidate.ts <候选编号>

来源配置为 config/content-sources.json。采集只保存去重后的私有候选，转为待核验草稿后仍需编辑。定时脚本按上海时区工作日 08:30 运行一次，记录保存在 .local/editorial。未接付费 AI 生成供应商。

## 咨询与通知

表单向同源接收服务提交，落盘后返回编号，随后同步后台；重试保留同一编号。后台询盘禁止匿名读写，编辑无法读取客户信息。
通知队列随询盘保留，默认等待配置。适配器需要 NOTIFICATION_API_KEY_FILE、NOTIFICATION_FROM、NOTIFICATION_TO；默认不调用供应商。供应商受理不等于邮件送达，真实收信需另验。

## 检查与运维

依次使用 pnpm test、pnpm check、pnpm build；后台变更增加 pnpm build:cms、pnpm test:integration。
后台模型变化须生成类型和迁移，验证空库和已有库。Windows 迁移创建使用 node --env-file=.env --import tsx scripts/create-content-migration.ts，避开 Payload CLI 局部 TS 加载器与 drizzle-kit 的解析冲突。
生产准备脚本位于 deploy，服务仅绑定回环，运行配置、数据库、媒体、询盘与源码分离。正式状态、验证结果、缺项与回滚依据见 docs/RELEASE_STATUS.md 及正式项目台账。