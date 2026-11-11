# 海老板全站视觉升级验收

状态：COMPLETE。2026-11-11（Asia/Shanghai）已发布 https://haiboss.com/ 。源码提交以正式项目台账及 GitHub main 为准。

## 本轮变化

- 首页、三个栏目、全部内容、8篇文章、3个专题、服务、案例、关于、联系、搜索、隐私和404，共23个生成页面更新。
- 增加全球贸易、AI信息网络、研究工作台3张场景图，均标注AI示意；CMS已有封面优先使用。
- 增加18秒1280×720、24fps H.264程序视频，带画面文字、VTT字幕、原生播放控件；160321字节，点击播放。
- 增加三个可切换的工作流场景、内容类型筛选、专题阅读路径、服务交付与FAQ、文章阅读进度、关联阅读和快捷搜索。
- 搜索包含公开文章的标题、摘要、栏目、内容类型与正文；不检索草稿或私有候选。
- 联系页与页脚从CMS取得公开邮箱sales@haiboss.com。网站询盘邮件通知仍未配置，不能将公开联系地址等同于通知送达。
- 保留Astro/Payload/PostgreSQL、现有URL和依赖锁。静态服务补充video/mp4、text/vtt、字节范围请求与真实404状态。

## 验收结果

- pnpm test：20/20通过；pnpm check通过；pnpm build生成23页，现有链接／SEO构建审计0错误。
- ego task space 5：23页分别以1440、390、320像素检查，共69次，均无水平溢出、缺少h1、缺失图片alt或首屏图片加载失败。
- 正式域名23页全部确认新版标识、唯一h1、图片可用、canonical正确；普通页面没有noindex，404保留noindex。
- 手机导航、Escape关闭菜单、工作流切换、内容筛选、搜索结果与空状态、动效暂停及偏好保存、系统减少动效、视频解码／播放／拖动，共14项交互检查通过。
- 线上MP4 Range返回206及正确Content-Range；越界返回416；字幕200；不存在页面404并显示自定义界面。RSS、robots、sitemap及CMS健康200，公开文章仍为8篇。
- 线上实际表单测试回执：IQ-8Z11-RK8W-VBQ1。只查询这一条测试记录，数据库唯一持久化1条；notification_state=pending，未宣称邮件送达。

## 部署与备份

运行目录：/home/codexops/apps/haiboss/releases/20261103-content-v1。

发布前已核对原文件SHA256与本机原始快照一致；没有覆盖未知补丁。只停止重建服务进行源码替换，静态站继续提供旧版本；构建审计通过后原子切换，再短暂重启静态服务加载媒体支持，恢复重建服务。

- 发布备份：/home/codexops/backups/haiboss-ui-20261111T042352Z，保存原源码、静态指针、公开联系资料及文件摘要。
- 新静态版本：apps/site/.site-releases/1794371081051-8d225687-4227-4719-996d-7218fd91afd6。
- 前一稳定版本：apps/site/.site-releases/1793725640925-508830b9-42bc-4fdb-a73c-6a7db3b9e478。
- 本轮不修改数据库结构、CMS模型、运行凭据、DNS、其他项目和系统依赖。公开联系邮箱通过已有Payload API写入，原值已备份。
- 素材来源与提示词：docs/visual-assets-20261111.json。原始生成文件留在本机，站点使用压缩WebP与程序生成MP4；设计资源与运行时CMS媒体目录分开。

## 回滚

1. 暂停haiboss-rebuild，确认current.json仍指向上述本轮版本且未发生新的内容发布；有新发布时先记录差异，不能盲目回退。
2. 核对备份deployment.json的文件哈希与当前本轮源码一致；恢复source-before.tar.gz中的原有文件，保留无关修改与新文件，不递归删除目录。
3. 在确认previous为上述前一稳定版本后，执行原发布工具：node services/rebuild/publish.cjs /home/codexops/apps/haiboss/releases/20261103-content-v1/apps/site --rollback。
4. 重启haiboss-site并恢复haiboss-rebuild，复查主站、CMS、原有询盘及媒体。数据库不随前台回滚；已验证的公开邮箱可保留，若需还原只修改备份中的email字段。

## 后续范围与费用

本轮没有新增云服务或付费外部模型API。内置image_gen使用3次；未取得独立账单，不虚报其货币成本。视频由本机代码与已有FFmpeg生成；Pillow仅安装于本轮.local隔离环境。

候选采集和已审核内容发布继续沿用既有流程；未把旧文章改日期充当新动态，也未自动发布未审核候选。网站通知、外部告警、持续离机备份和无人登录开机专项测试继续按原台账跟进。

本机验收原始记录在.local/ui-upgrade-20261111，正式证据归档至一人公司AI业务系统/evidence/haiboss/ui-20261111。
