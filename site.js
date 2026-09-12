function shell(content){
  document.getElementById('app').innerHTML=`<nav class="nav"><div class="wrap navin"><a class="logo" href="index.html">海老板<i>·</i></a><div class="links"><a href="pain-points.html">痛点</a><a href="ai-growth.html">AI 增效</a><a href="solutions.html">服务场景</a><a href="cases.html">案例</a><a href="about.html">关于</a><a class="call" href="contact.html">联系海老板</a></div></div></nav>${content}<footer class="footer"><div class="wrap">海老板 · AI 外贸增效服务</div></footer>`;
}

function renderPage(title,sub,kind,items){
  document.body.dataset.page=kind;
  const art=kind==='growth'?'assets/growth-signal-flow.png':null;
  shell(`<main><section class="hero"><div class="wrap"><div class="kicker">${kind.toUpperCase()} / HAIBOSS</div><h1>${title}</h1><p>${sub}</p></div></section>${art?`<section class="wrap page-art-wrap"><img class="page-art" src="${art}" alt="${title}视觉插图"></section>`:''}<section class="wrap grid">${items.map(x=>`<article class="card"><b>${x[0]}</b><h2>${x[1]||x[0]}</h2><p>${x[2]||x[1]}</p></article>`).join('')}</section></main>`);
}

function renderAbout(){
  document.body.dataset.page='about';
  shell(`<main><section class="hero"><div class="wrap"><div class="kicker">ABOUT HAIBOSS</div><h1>海老板，<br><span>让外贸增长更有章法。</span></h1><p>我们关注的不是把 AI 说得多复杂，而是让传统外贸团队真正用得上、跑得动，并在日常工作中看见效率变化。</p></div></section><section class="wrap about-signature"><div><b>HAIBOSS / AI TRADE GROWTH</b><p>把经验变成系统，把线索变成增长。</p></div><img src="assets/haiboss-logo-dark.png" alt="海老板品牌标识"></section><section class="wrap grid"><article class="card"><b>01 / 理念</b><h2>技术服务于业务</h2><p>从真实的产品、市场和客户问题出发，让 AI 进入外贸工作流。</p></article><article class="card"><b>02 / 原则</b><h2>先解决问题，再谈工具</h2><p>不追求堆砌功能，优先找到能降低重复劳动、提升判断和沟通效率的环节。</p></article><article class="card"><b>03 / 方式</b><h2>从小处开始验证</h2><p>从一个品类、一个市场或一个团队切入，逐步建立适合企业自己的方法。</p></article></section></main>`);
}

function renderCases(){
  document.body.dataset.page='cases';
  const cases=[
    ['01 / 工业设备','从有产品，到建立主动获客路径','产品与买家画像、目标市场筛选、关键人识别、个性化触达','3 个目标市场','30–50 条 / 月目标线索','assets/case-industrial.png'],
    ['02 / 五金汽配','让标准化产品进入精准客户开发','SKU 重组、进口商与经销商搜索、客户分级、跟进沉淀','2–3 条重点产品线','P0 / P1 / P2 分级','assets/case-hardware.png'],
    ['03 / 家居建材','从询盘响应，到持续内容与客户触达','市场机会判断、卖点整理、多语言内容、询盘优先级','8–12 条 / 月内容计划','重点询盘 24 小时内响应','assets/case-building-materials.png'],
    ['04 / 消费品牌','从单一平台，扩展到多渠道品牌触达','客户画像、社媒信号、KOL / 经销商筛选、内容实验','20–30 家 / 月重点客户','3–5 组内容实验方向','assets/case-consumer-brand.png']
  ];
  shell(`<main><section class="hero cases-hero"><div class="wrap"><div class="kicker">CASES / HAIBOSS</div><h1>把增长方案，<br><span>落到具体行业。</span></h1><p>以下为典型行业的示范服务路径与参考指标，用来说明海老板如何把 AI 放进真实的外贸工作流。</p></div></section><section class="wrap cases-intro"><div><div class="kicker">REFERENCE PLAYBOOK</div><h2>不承诺漂亮数字，<br>只拆解可执行动作。</h2></div><p>案例中的指标为示范目标，不代表已验证客户结果。真实项目将根据产品、市场、团队和周期共同确定。</p></section><section class="wrap case-grid">${cases.map(c=>`<article class="case-card"><img src="${c[5]}" alt="${c[1]}行业视觉"><div class="case-body"><b>${c[0]}</b><h2>${c[1]}</h2><p>${c[2]}</p><div class="case-metrics"><span><strong>${c[3]}</strong>参考范围</span><span><strong>${c[4]}</strong>衡量方式</span></div></div></article>`).join('')}</section><section class="quote"><div class="wrap"><blockquote>先从一个品类、一个市场、一个具体问题开始。</blockquote></div></section></main>`);
}

function renderContact(){
  document.body.dataset.page='contact';
  shell(`<main><section class="hero"><div class="wrap"><div class="kicker">TALK TO HAIBOSS</div><h1>聊聊你的外贸增长问题。</h1><p>如果你正在面对客户难找、效率不高、团队经验难沉淀等问题，可以直接联系海老板。</p><a class="phone" href="tel:18805065692">188 0506 5692</a><br><a class="btn" href="tel:18805065692">电话联系海老板 ↗</a></div></section></main>`);
}

document.addEventListener('DOMContentLoaded',()=>{const current=location.pathname.split('/').pop()||'index.html';document.querySelectorAll('.links a').forEach(a=>{if(a.getAttribute('href')===current)a.classList.add('active')});});
