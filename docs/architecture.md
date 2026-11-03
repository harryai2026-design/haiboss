# 架构、数据与交接

## 目录

```text
config/site.json             品牌、主题、语言、模块选择
apps/site/                   Astro 页面、样式和表单
packages/config/             统一配置、域名白名单
packages/content/            已发布内容取数、安全富文本输出
packages/seo/                通用 JSON-LD，不默认假设制造商
services/cms/                Payload / Next.js 管理内容、用户与询盘
services/inquiry-intake/     独立磁盘接收，不依赖数据库启动
services/rebuild/            持久化构建队列
scripts/                    本地启停、审计、集成测试、打包
```

## 数据边界

- 一套模板用于一个业务站点；复用代码不代表已实现租户隔离。
- 数据库是内容与 CRM 主数据；静态页和搜索索引均可重建。
- 本地 `.local/postgres` 保存开发库，`.local/inquiries` 保存尚待后台确认的询盘，`services/cms/media` 保存公开媒体，`.local/logs` 保存运行日志。
- 未同步询盘不能清理。同步成功后队列只保留去重凭据，移除联系人正文；30 天后清理已同步凭据。
- 浏览器只收到询盘编号。后台 inquiries 的 REST create 禁止匿名调用，可信接收器用独立秘密调用 ingest 端点。
- 前端使用 `/api/inquiries/` 以匹配静态站的尾斜杠规则；生产反向代理应同时把有/无尾斜杠的询盘地址送到接收服务。默认不信任任意 X-Forwarded-For，确需真实访客 IP 时由受控反代覆盖该头，并显式配置 TRUST_PROXY。
- 公开媒体仅允许图片，不保存私有报价、客户附件或秘密。需要私有资料时新增受保护的集合与下载接口。
- 无默认账户；所有者管理账号和询盘，编辑只处理公开内容。

## 数据库迁移

基线迁移包含模板支持的表，不包含企业/产品/客户种子。功能关闭后不删除表。已有数据不能随模板升级被示例资料覆盖。

```powershell
pnpm cms:types
pnpm db:migrate:create
pnpm db:migrate
```

这些命令使用 `.env` 的数据库连接。模型/语言/模块变化后，先在开发库生成迁移，再用全新测试库迁移和回归；不把开发期自动 push 带到生产。生成基线时使用 `SCHEMA_ALL_MODULES=1` 包含可选产品模型；普通运行不设置它。

## 本地运行与停止

`pnpm dev` 启动项目内 PostgreSQL、CMS、询盘接收（启用时）、重建服务和静态入口，首次构建完成后才提供网站；全部只绑定回环地址。Astro 在构建时运行，前台入口只提供静态文件和询盘转发。不注册开机服务、不操作 VPS。脚本退出停止项目子进程，数据保留。

## 后续生产部署

生产尚未配置。应按实际项目确定受控 GitHub 仓库、进程用户、数据库用户/库名、静态目录、端口、媒体卷、入口和备份位置。复用资源前读基础配置台账。DNS 用 CF，公开网站由 HTTPS 入口提供静态文件，询盘反代到接收服务，后台使用单独域名或明确路径。

生产构建需设置 `SITE_ENVIRONMENT=production`、实际 HTTPS 域名、`STRICT_CONTENT_BUILD=1` 和有效 CMS 地址。空内容列表允许发布空状态；CMS 不可达则构建失败。禁止离线回退成旧数据。

重建先输出到 `.dist-next`，构建和 SEO 审计成功后复制到不可变的 `.site-releases/<版本>`，再原子替换 `current.json` 指针。静态入口每次请求读取已发布版本；没有目录联接权限或正在监听目录改名的依赖，失败构建保留旧版本。`services/rebuild/publish.cjs <应用目录> --rollback` 可回退静态版本。若生产改用 Caddy 直接服务文件，应将其发布切换接到同一个已验证版本，不能假定它自动读取本地指针。代码回退不会自动回退数据库迁移。

完整备份至少覆盖 PostgreSQL、媒体、未同步询盘和单独保管的运行配置。独立存储副本与恢复测试需在真实部署时落实；本模板没有自动云端备份或已配置通知的承诺。
