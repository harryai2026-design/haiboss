function shell(content){
  document.getElementById('app').innerHTML=`<nav class="nav"><div class="wrap navin"><a class="logo" href="index.html">海老板<i>·</i></a><div class="links"><a href="pain-points.html">痛点</a><a href="ai-growth.html">AI 增效</a><a href="solutions.html">服务场景</a><a href="about.html">关于</a><a class="call" href="tel:18805065692">联系海老板</a></div></div></nav>${content}<footer class="footer"><div class="wrap">海老板 · AI 外贸增效服务</div></footer>`;
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

function renderContact(){
  document.body.dataset.page='contact';
  shell(`<main><section class="hero"><div class="wrap"><div class="kicker">TALK TO HAIBOSS</div><h1>聊聊你的外贸增长问题。</h1><p>如果你正在面对客户难找、效率不高、团队经验难沉淀等问题，可以直接联系海老板。</p><a class="phone" href="tel:18805065692">188 0506 5692</a><br><a class="btn" href="tel:18805065692">电话联系海老板 ↗</a></div></section></main>`);
}

document.addEventListener('DOMContentLoaded',()=>{const current=location.pathname.split('/').pop()||'index.html';document.querySelectorAll('.links a').forEach(a=>{if(a.getAttribute('href')===current)a.classList.add('active')});});
