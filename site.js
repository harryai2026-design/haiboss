function shell(content){
  document.getElementById('app').innerHTML=`<nav class="nav"><div class="wrap navin"><a class="logo" href="index.html">海老板<i>·</i></a><button class="nav-toggle" type="button" aria-label="打开网站导航" aria-expanded="false" onclick="document.body.classList.toggle('menu-open');this.setAttribute('aria-expanded',document.body.classList.contains('menu-open'))"><span></span><span></span></button><div class="links"><a href="pain-points.html">痛点</a><a href="ai-growth.html">AI 增效</a><a href="solutions.html">服务场景</a><a href="cases.html">案例</a><a href="about.html">关于</a><a class="call" href="contact.html">联系海老板</a></div></div></nav>${content}<footer class="footer"><div class="wrap">海老板 · AI 外贸增效服务</div></footer>`;
}

function renderPage(title,sub,kind,items){
  document.body.dataset.page=kind;
  const art=kind==='growth'?'assets/growth-signal-flow.webp':null;
  shell(`<main><section class="hero"><div class="wrap"><div class="kicker">${kind.toUpperCase()} / HAIBOSS</div><h1>${title}</h1><p>${sub}</p></div></section>${art?`<section class="wrap page-art-wrap"><img class="page-art" src="${art}" alt="${title}视觉插图"></section>`:''}<section class="wrap grid">${items.map(x=>`<article class="card"><b>${x[0]}</b><h2>${x[1]||x[0]}</h2><p>${x[2]||x[1]}</p></article>`).join('')}</section></main>`);
}

function renderAbout(){
  document.body.dataset.page='about';
  shell(`<main><section class="hero"><div class="wrap"><div class="kicker">ABOUT HAIBOSS</div><h1>海老板，<br><span>让外贸增长更有章法。</span></h1><p>我们关注的不是把 AI 说得多复杂，而是让传统外贸团队真正用得上、跑得动，并在日常工作中看见效率变化。</p></div></section><section class="wrap about-signature"><div><b>HAIBOSS / AI TRADE GROWTH</b><p>把经验变成系统，把线索变成增长。</p></div><img src="assets/haiboss-logo-dark.png" alt="海老板品牌标识"></section><section class="wrap grid"><article class="card"><b>01 / 理念</b><h2>技术服务于业务</h2><p>从真实的产品、市场和客户问题出发，让 AI 进入外贸工作流。</p></article><article class="card"><b>02 / 原则</b><h2>先解决问题，再谈工具</h2><p>不追求堆砌功能，优先找到能降低重复劳动、提升判断和沟通效率的环节。</p></article><article class="card"><b>03 / 方式</b><h2>从小处开始验证</h2><p>从一个品类、一个市场或一个团队切入，逐步建立适合企业自己的方法。</p></article></section></main>`);
}

function renderCases(){
  document.body.dataset.page='cases';
  const modules=[
    ['A / 独立站赛道','现有业务版块 + 品牌零售版块','梳理产品与买家画像，建立承接海外客户的品牌官网和转化路径。','独立站规划','2 条业务线'],
    ['B / 全球社媒矩阵','高质量内容与品牌曝光','围绕目标市场持续输出内容，搭建 LinkedIn、Facebook、Instagram、YouTube 等触达阵地。','内容与渠道规划','高质量内容节奏'],
    ['C / 私域社群建立','沉淀精准用户，形成长期资产','结合行业讨论与品牌社群，筛选高匹配用户并设计持续互动机制。','社群策略','用户沉淀目标'],
    ['D / 大客户精准渗透','锁定高价值客户，加速业务增长','通过 Email、WhatsApp 等渠道进行精准开发，围绕客户事实完成深度触达。','大客户开发','每周 2 个目标客户'],
    ['E / 网红 KOL 深度合作','借力海外意见领袖放大品牌声量','围绕 Fitness、Wellness、Biohacking、Healthy Living 等内容方向筛选合作对象。','KOL 内容合作','每个方向 2 条深度内容'],
    ['F / 平台国际站运营','专业运营，持续优化增长','以数据复盘、内容资产和产品素材为基础，持续优化平台表现和询盘承接。','平台运营','类目排名目标']
  ];
  shell(`<main><section class="hero cases-hero"><div class="wrap"><div class="kicker">ANNUAL CLIENT PLAN / HAIBOSS</div><h1>一家客户的<br><span>年度出海增长方案。</span></h1><p>这是面向一家 B2B 技术型 OEM / ODM 企业的综合服务示范：从独立站、社媒矩阵到大客户开发，建立一套持续增长的海外触达系统。</p></div></section><section class="wrap case-feature"><img src="assets/case-client-annual-plan.webp" alt="匿名客户年度出海增长服务方案总览"><div><div class="kicker">CLIENT PROFILE / ANONYMOUS</div><h2>从“有产品”，到“有一套增长系统”。</h2><p>客户拥有技术型产品与制造能力，但需要把现有业务、品牌零售、海外内容、精准开发和平台运营连接起来。海老板以 12 个月为周期，分阶段建立获客、转化和沉淀机制。</p><div class="case-metrics"><span><strong>12 个月</strong>服务周期</span><span><strong>6 大模块</strong>综合服务</span></div></div></section><section class="wrap cases-intro"><div><div class="kicker">SIX SERVICE MODULES</div><h2>一份方案，<br>六个增长支点。</h2></div><p>以下内容依据附件中的单客户年度服务方案整理。页面中的数量均为方案目标或执行口径，不代表已经完成的客户结果。</p></section><section class="wrap case-grid">${modules.map((c,i)=>`<article class="case-card case-module"><div class="module-index">${String(i+1).padStart(2,'0')}</div><div class="case-body"><b>${c[0]}</b><h2>${c[1]}</h2><p>${c[2]}</p><div class="case-metrics"><span><strong>${c[3]}</strong>服务内容</span><span><strong>${c[4]}</strong>参考目标</span></div></div></article>`).join('')}</section><section class="quote"><div class="wrap"><blockquote>不是购买几个工具，而是共同搭建一套能持续运转的海外增长体系。</blockquote></div></section></main>`);
}

function renderContact(){
  document.body.dataset.page='contact';
  shell(`<main><section class="hero"><div class="wrap"><div class="kicker">TALK TO HAIBOSS</div><h1>聊聊你的外贸增长问题。</h1><p>如果你正在面对客户难找、效率不高、团队经验难沉淀等问题，可以直接联系海老板。</p><a class="phone" href="tel:18805065692">188 0506 5692</a><br><a class="btn" href="tel:18805065692">电话联系海老板 ↗</a></div></section></main>`);
}

function renderContact(){
  document.body.dataset.page='contact';
  shell(`<main><section class="hero"><div class="wrap"><div class="kicker">TALK TO HAIBOSS</div><h1>聊聊你的外贸增长问题。</h1><p>如果你正在面对客户难找、效率不高、团队经验难沉淀等问题，可以直接联系海老板。</p><a class="phone" href="tel:18805065692">188 0506 5692</a><br><a class="btn" href="tel:18805065692">电话联系海老板 ↗</a></div></section><section class="section contact-panel"><div class="wrap contact-grid"><div><div class="kicker">WECHAT / EMAIL</div><h2 class="title">把问题发过来，<br>我们一起拆解。</h2><p class="desc">微信扫码添加，或发送邮件至 sales@haiboss.top。</p><a class="email-link" href="mailto:sales@haiboss.top">sales@haiboss.top ↗</a></div><div class="wechat-card"><img src="assets/wechat-contact-card.png" alt="微信二维码与企业邮箱 sales@haiboss.top"><p>微信扫码添加 · 商务咨询</p></div></div></section></main>`);
}

document.addEventListener('DOMContentLoaded',()=>{const current=location.pathname.split('/').pop()||'index.html';document.querySelectorAll('.links a').forEach(a=>{if(a.getAttribute('href')===current)a.classList.add('active')});});

