# 海老板正式上线记录

更新：2026-11-04（Asia/Shanghai）。新版已上线，未接通能力另列，正式状态以原一人公司AI业务系统registry为准。

## 正式入口

- 主站：https://haiboss.com/ 。www.haiboss.com、haiboss.top、www.haiboss.top 均经真实浏览器验证跳转至主站。
- 后台：https://cms.haiboss.com/admin ，独立所有者账号 harryai2026@gmail.com。凭据仅在受限私有文件和安全界面中使用。
- 原UCloud实例118.26.110.62，目录 /home/codexops/apps/haiboss/releases/20261103-content-v1，独立PostgreSQL16.14；锁定既有Astro/Payload/Next依赖，未整体升级系统依赖。
- 独立隧道haiboss-sg，ID 1a70288d-4bf7-4f4a-9fe0-7e9449c4e3a4。后台45201、前台45221、询盘45202、重建45203、数据库45232均只监听回环；没有公开数据库和重建服务。
- 旧Pages项目和历史部署保留，已关闭生产及预览自动部署。原main基线ec59e6aa03d0f2391c67c003d1c484becc089afe；最终源码提交见正式台账source_control。
- 主站及www前台DNS已切换，邮箱MX及其他业务隧道、账号、补丁保持原状。haiboss.com浏览器缓存已改为遵循源站标头，旧入口已执行指定URL清除。

## 验收证据

- 生产后台限额构建、23页静态构建和链接/SEO审计通过；18项单元/HTTP检查、源码检查、后台类型检查、8组隔离PostgreSQL集成检查通过。
- 首页、8篇公开内容、分类、搜索、RSS已上线；“客户”搜索得到5篇，390px移动视口宽度与页面宽度均为390，无水平溢出。
- 公网CMS健康、默认语言标题/摘要、所有者登录/身份/退出通过；Secure、HttpOnly、SameSite=Lax在真实浏览器核验。修复了生产Cookie标记及单语言默认接口问题。
- 匿名询盘读取、匿名CRM直接写入、私有候选读取均被拒绝。
- 正式表单回执IQ-X36R-VPD7-FWG7，经公网CMS核对入库1条；恢复/重试测试IQ-50GJ-SY16-Y9E9也唯一入库。均明确标记为测试，不作客户统计。
- 生产内容保存→持久发布任务→静态重建成功已验证，任务2，公开内容未改变。
- 隧道入口按可信CF-Connecting-IP区分访问者，伪造转发地址不能绕过限流；已补HTTP测试。
- 桌面、移动及表单截图、脱敏JSON证据在本机.local/evidence，正式台账另有证据归档。

## 持续运行与备份

- haiboss-editorial.service已启用、运行：上海时区工作日08:30采集私有候选，由编辑核验、所有者发布或批准排期，不自动发布未审核材料。
- Google来源已改为官网提供的FeedBurner RSS。生产实测Google10条、OpenAI20条，新增10、重复20，两个来源均成功；公开文章仍为8篇。付费AI请求为0。
- haiboss-backup.timer已启用：上海时区每日02:30。实际备份服务运行成功；静态站和耐久询盘接收已解除对数据库服务生命周期的依赖。
- 最新备份 /home/codexops/backups/haiboss-candidate-20261103T171014Z，隔离端口45233恢复后核对8篇公开文章、1位所有者、正式测试询盘唯一记录通过，未覆盖生产数据库。
- 首份162224Z及最新171014Z备份均已完成Windows离机复制及SHA256核对；这些是本轮实际副本，不是持续离机同步。
- 原SVG/iArt/自媒体升级前代码、配置、SQLite一致性快照在 /home/codexops/backups/pre-haiboss-upgrade-20261103T140719Z；原媒体原位保留。

## 尚未接通

- 管理员常驻设置：loginctl enable-linger codexops返回Access denied，Linger仍为no。服务已enable和运行不等于整机重启自恢复已验收。已请本人在UCloud VNC安全界面登录管理员，再执行该命令并回验；未重置密码、未索要聊天秘密。
- 询盘邮件：供应商未配置，notification=pending；当前从后台查看，未声称真实邮件送达。
- 独立外部告警：Cloudflare没有现成通知目标，未注册外部服务或发送消息；既有本机Ops巡检不等于电脑离线仍可独立告警。
- 持续离机备份未配置；本轮只有实际复制的离机副本。收费AI生成未接入。

## 历史与回滚

11月3日22:28起曾SSH超时、相关隧道530/1033，旧主站保持在线；11月4日恢复后通过原账号、指纹和codexops身份核验。曾观察高负载，因无内核日志权限未宣称已确认根因。后续编译使用1200MB总内存、1100MB回收阈值、80%单核CPU及15分钟时限。

前台DNS、静态版本和独立数据库的回滚边界见《生产切换与回滚.md》。升级前状态与授权保留在原Git历史及正式证据中。
