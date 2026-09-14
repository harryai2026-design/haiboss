function shell(content){
  document.getElementById('app').innerHTML=`<nav class="nav"><div class="wrap navin"><a class="logo" href="index.html">海老板<i>·</i></a><button class="nav-toggle" type="button" aria-label="打开网站导航" aria-expanded="false" onclick="document.body.classList.toggle('menu-open');this.setAttribute('aria-expanded',document.body.classList.contains('menu-open'))"><span></span><span></span></button><div class="links"><a href="growth-loop.html">增长链路</a><a href="pain-points.html">痛点</a><a href="ai-growth.html">AI 增效</a><a href="solutions.html">服务场景</a><a href="cases.html">案例</a><a href="about.html">关于</a><a class="call" href="contact.html">联系海老板</a></div></div></nav>${content}<footer class="footer"><div class="wrap">海老板 · AI 外贸增效服务</div></footer>`;
}

function renderPage(title,sub,kind,items){
  document.body.dataset.page=kind;
  const art=kind==='growth'?'assets/growth-signal-flow.webp':null;
  shell(`<main><section class="hero"><div class="wrap"><div class="kicker">${kind.toUpperCase()} / HAIBOSS</div><h1>${title}</h1><p>${sub}</p></div></section>${art?`<section class="wrap page-art-wrap"><img class="page-art" src="${art}" alt="${title}视觉插图"></section>`:''}<section class="wrap grid">${items.map(x=>`<article class="card"><b>${x[0]}</b><h2>${x[1]||x[0]}</h2><p>${x[2]||x[1]}</p></article>`).join('')}</section></main>`);
}

function renderPage(title,sub,kind,items){
  document.body.dataset.page=kind;
  const art=kind==='growth'?'assets/growth-signal-flow.webp':null;
  const bridge=kind==='growth'?`<section class="section growth-bridge"><div class="wrap"><div class="kicker">AI INTERVENTION POINTS</div><h2 class="title">AI 不替你做决定，<br>但会让每一步更有依据。</h2><div class="bridge-grid"><article><b>INPUT / 输入</b><h3>产品、供应链、市场与客户事实</h3><p>把零散资料整理成可以判断的业务上下文。</p></article><article><b>REASON / 判断</b><h3>机会、角色、意图与优先级</h3><p>识别哪些市场、客户和采购角色值得先验证。</p></article><article><b>ACTION / 行动</b><h3>内容、触达、技术确认与跟进</h3><p>让每个线索都有下一步，而不是停在名单里。</p></article></div><a class="btn" href="growth-loop.html">查看完整增长链路 ↗</a></div></section>`:'';
  shell(`<main><section class="hero"><div class="wrap"><div class="kicker">${kind.toUpperCase()} / HAIBOSS</div><h1>${title}</h1><p>${sub}</p></div></section>${art?`<section class="wrap page-art-wrap"><img class="page-art" src="${art}" alt="${title}视觉插图"></section>`:''}<section class="wrap grid">${items.map(x=>`<article class="card"><b>${x[0]}</b><h2>${x[1]||x[0]}</h2><p>${x[2]||x[1]}</p></article>`).join('')}</section>${bridge}</main>`);
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

function renderGrowthLoop(){
  document.body.dataset.page='growth-loop';
  const stages=[
    ['01','供应链能力','产品、交期、认证、定制与交付边界'],['02','产品机会','把能力翻译成买家听得懂的价值'],['03','市场机会','找到需求增长、竞争可进入的市场'],['04','ICP / 采购角色','定位进口商、经销商与真实决策人'],['05','Pain Point','理解客户为什么现在必须解决'],['06','Search Intent','把痛点变成可被搜索和验证的意图'],['07','内容','用证据回答问题，承接主动需求'],['08','询盘','让内容进入可跟进的业务线索'],['09','技术确认','确认规格、场景、交期与适配性'],['10','报价 / 批准','推动内部决策与采购批准'],['11','订单','把一次机会变成可交付的合作'],['12','复购记录','沉淀客户、产品与市场反馈']
  ];
  shell(`<main><section class="hero loop-hero"><div class="wrap"><div class="kicker">HAIBOSS / GROWTH OPERATING SYSTEM</div><h1>从供应链能力，<br><span>走到复购记录。</span></h1><p>海老板不是只帮你找客户，而是把产品能力、市场判断、内容获客与业务跟进，连接成一条可以持续优化的出海增长链路。</p></div></section><section class="wrap loop-intro"><div><div class="kicker">THE FULL LOOP</div><h2>每一个询盘，<br>都应该回到系统里。</h2></div><p>先理解企业能交付什么，再判断市场需要什么；从采购角色的真实痛点出发，用内容获得询盘，再把技术确认、报价、订单与复购反馈沉淀为下一轮增长的输入。</p></section><section class="wrap loop-map"><div class="loop-orbit"><div class="orbit-core"><b>HAIBOSS</b><span>增长闭环</span></div>${stages.map((s,i)=>`<article class="loop-node node-${i+1}"><b>${s[0]}</b><strong>${s[1]}</strong><span>${s[2]}</span></article>`).join('')}</div></section><section class="section alt"><div class="wrap loop-principles"><div><div class="kicker">WHAT WE IMPROVE</div><h2 class="title">不是把每个环节<br>做成孤岛。</h2></div><div class="principle-list"><article><b>01 / 供给到需求</b><h3>让产品能力遇见真实机会</h3><p>从供应链和产品事实出发，避免盲目追逐市场或泛化投放。</p></article><article><b>02 / 意图到内容</b><h3>让内容回答采购问题</h3><p>围绕 Pain Point 和 Search Intent 组织内容，而不是只堆品牌曝光。</p></article><article><b>03 / 询盘到复购</b><h3>让业务反馈反哺下一轮</h3><p>把技术确认、报价、订单和复购记录，变成团队可复用的客户资产。</p></article></div></div></section><section class="section"><div class="wrap"><div class="kicker">THE STARTING POINT</div><h2 class="title">从一个产品、一个市场、<br>一个问题开始。</h2><p class="desc">告诉海老板你的产品能力和当前卡点，我们先判断最值得被验证的增长环节。</p><a class="btn primary" href="contact.html">和海老板聊聊 ↗</a></div></section></main>`);
}

function renderContact(){
  document.body.dataset.page='contact';
  shell(`<main><section class="hero"><div class="wrap"><div class="kicker">TALK TO HAIBOSS</div><h1>聊聊你的外贸增长问题。</h1><p>如果你正在面对客户难找、效率不高、团队经验难沉淀等问题，可以直接联系海老板。</p><a class="phone" href="tel:18805065692">188 0506 5692</a><br><a class="btn" href="tel:18805065692">电话联系海老板 ↗</a></div></section></main>`);
}

function renderContact(){
  document.body.dataset.page='contact';
  shell(`<main><section class="hero"><div class="wrap"><div class="kicker">TALK TO HAIBOSS</div><h1>聊聊你的外贸增长问题。</h1><p>如果你正在面对客户难找、效率不高、团队经验难沉淀等问题，可以直接联系海老板。</p><a class="phone" href="tel:18805065692">188 0506 5692</a><br><a class="btn" href="tel:18805065692">电话联系海老板 ↗</a></div></section><section class="section contact-panel"><div class="wrap contact-grid"><div><div class="kicker">WECHAT / EMAIL</div><h2 class="title">把问题发过来，<br>我们一起拆解。</h2><p class="desc">微信扫码添加，或发送邮件至 sales@haiboss.top。</p><a class="email-link" href="mailto:sales@haiboss.top">sales@haiboss.top ↗</a></div><div class="wechat-card"><img src="assets/wechat-contact-card.png" alt="微信二维码与企业邮箱 sales@haiboss.top"><p>微信扫码添加 · 商务咨询</p></div></div></section></main>`);
}

function renderContact(){
  document.body.dataset.page='contact';
  shell(`<main><section class="hero"><div class="wrap"><div class="kicker">TALK TO HAIBOSS</div><h1>聊聊你的外贸增长问题。</h1><p>如果你正在面对客户难找、效率不高、团队经验难沉淀等问题，可以直接联系海老板。</p><a class="phone" href="tel:18805065692">188 0506 5692</a><br><a class="btn" href="tel:18805065692">电话联系海老板 ↗</a></div></section><section class="section contact-panel"><div class="wrap contact-grid"><div><div class="kicker">WECHAT / EMAIL</div><h2 class="title">把问题发过来，<br>我们一起拆解。</h2><p class="desc">微信扫码添加，或发送邮件至 sales@haiboss.com。</p><a class="email-link" href="mailto:sales@haiboss.com">sales@haiboss.com ↗</a></div><div class="wechat-card"><img src="assets/wechat-contact-card-com.png" alt="微信二维码与企业邮箱 sales@haiboss.com"><p>微信扫码添加 · 商务咨询</p></div></div></section></main>`);
}

function renderContact(){
  document.body.dataset.page='contact';
  shell(`<main><section class="hero"><div class="wrap"><div class="kicker">TALK TO HAIBOSS</div><h1>聊聊你的外贸增长问题。</h1><p>如果你正在面对客户难找、效率不高、团队经验难沉淀等问题，可以直接联系海老板。</p><a class="phone" href="tel:18805065692">188 0506 5692</a><br><a class="btn" href="tel:18805065692">电话联系海老板 ↗</a></div></section><section class="section contact-panel"><div class="wrap contact-grid"><div><div class="kicker">WECHAT / EMAIL</div><h2 class="title">把问题发过来，<br>我们一起拆解。</h2><p class="desc">微信扫码添加，或发送邮件至 sales@haiboss.top。</p><a class="email-link" href="mailto:sales@haiboss.top">sales@haiboss.top ↗</a></div><div class="wechat-card"><img src="assets/wechat-contact-card.png" alt="微信二维码与企业邮箱 sales@haiboss.top"><p>微信扫码添加 · 商务咨询</p></div></div></section></main>`);
}

function renderContact(){
  document.body.dataset.page='contact';
  shell(`<main><section class="hero"><div class="wrap"><div class="kicker">TALK TO HAIBOSS</div><h1>聊聊你的外贸增长问题。</h1><p>如果你正在面对客户难找、效率不高、团队经验难沉淀等问题，可以直接联系海老板。</p><a class="phone" href="tel:18805065692">188 0506 5692</a><br><a class="btn" href="tel:18805065692">电话联系海老板 ↗</a></div></section><section class="section intake-panel"><div class="wrap intake-grid"><div><div class="kicker">START WITH ONE NODE</div><h2 class="title">先说清楚，<br>你卡在哪一步。</h2><p class="desc">不需要准备复杂方案。告诉海老板你的产品、目标市场和当前最难推进的环节，我们从最值得验证的节点开始。</p></div><div class="intake-list"><div><b>01</b><span>产品与供应链能力</span></div><div><b>02</b><span>目标市场与采购角色</span></div><div><b>03</b><span>内容、询盘或跟进卡点</span></div><div><b>04</b><span>技术确认、报价或复购问题</span></div></div></div></section><section class="section contact-panel"><div class="wrap contact-grid"><div><div class="kicker">WECHAT / EMAIL</div><h2 class="title">把问题发过来，<br>我们一起拆解。</h2><p class="desc">微信扫码添加，或发送邮件至 sales@haiboss.top。</p><a class="email-link" href="mailto:sales@haiboss.top">sales@haiboss.top ↗</a></div><div class="wechat-card"><img src="assets/wechat-contact-card.png" alt="微信二维码与企业邮箱 sales@haiboss.top"><p>微信扫码添加 · 商务咨询</p></div></div></section></main>`);
}

function renderContact(){
  document.body.dataset.page='contact';
  shell(`<main><section class="hero"><div class="wrap"><div class="kicker">TALK TO HAIBOSS</div><h1>聊聊你的外贸增长问题。</h1><p>如果你正在面对客户难找、效率不高、团队经验难沉淀等问题，可以直接联系海老板。</p><a class="phone" href="tel:18805065692">188 0506 5692</a><br><a class="btn" href="tel:18805065692">电话联系海老板 ↗</a></div></section><section class="section intake-panel"><div class="wrap intake-grid"><div><div class="kicker">START WITH ONE NODE</div><h2 class="title">先说清楚，<br>你卡在哪一步。</h2><p class="desc">不需要准备复杂方案。告诉海老板你的产品、目标市场和当前最难推进的环节，我们从最值得验证的节点开始。</p><div class="intake-list"><div><b>01</b><span>产品与供应链能力</span></div><div><b>02</b><span>目标市场与采购角色</span></div><div><b>03</b><span>内容、询盘或跟进卡点</span></div><div><b>04</b><span>技术确认、报价或复购问题</span></div></div></div><form class="diagnostic-form" id="diagnostic-form"><div class="kicker">QUICK DIAGNOSIS</div><label>你的产品 / 供应链能力<input name="product" required placeholder="例如：工业零部件、OEM 定制能力"></label><label>目标市场或客户类型<input name="market" required placeholder="例如：欧洲经销商、北美品牌方"></label><label>当前卡点<select name="node" required><option value="">请选择最需要解决的一环</option><option>产品机会与市场选择</option><option>ICP / 采购角色识别</option><option>Pain Point / Search Intent</option><option>内容与询盘获取</option><option>技术确认与报价</option><option>订单与复购沉淀</option></select></label><label>补充说明<textarea name="note" rows="4" placeholder="可以简单描述现在遇到的问题"></textarea></label><button class="btn primary" type="submit">生成咨询邮件 ↗</button><p class="form-note">点击后会打开你的本地邮件客户端，发送前可再次确认内容。</p><output id="diagnostic-result" class="diagnostic-result" aria-live="polite"></output></form></div></section><section class="section contact-panel"><div class="wrap contact-grid"><div><div class="kicker">WECHAT / EMAIL</div><h2 class="title">把问题发过来，<br>我们一起拆解。</h2><p class="desc">微信扫码添加，或发送邮件至 sales@haiboss.top。</p><a class="email-link" href="mailto:sales@haiboss.top">sales@haiboss.top ↗</a></div><div class="wechat-card"><img src="assets/wechat-contact-card.png" alt="微信二维码与企业邮箱 sales@haiboss.top"><p>微信扫码添加 · 商务咨询</p></div></div></section></main>`);
  const form=document.getElementById('diagnostic-form');
  form.addEventListener('submit',event=>{event.preventDefault();const data=new FormData(form);const subject=`海老板增长诊断｜${data.get('product')}`;const body=[`产品 / 供应链：${data.get('product')}`,`目标市场 / 客户：${data.get('market')}`,`当前卡点：${data.get('node')}`,`补充说明：${data.get('note')||'暂无'}`].join('\\n');const href=`mailto:sales@haiboss.top?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;const out=document.getElementById('diagnostic-result');out.innerHTML=`内容已整理好：<a href="${href}">点击打开邮件客户端发送</a>`;});
}

document.addEventListener('DOMContentLoaded',()=>{const current=location.pathname.split('/').pop()||'index.html';document.querySelectorAll('.links a').forEach(a=>{if(a.getAttribute('href')===current)a.classList.add('active')});});

