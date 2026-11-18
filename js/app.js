(function(){
"use strict";
const L = window.LESSONS.slice().sort((a,b)=>a.n-b.n);
const BOOKS = {
  P:{slug:"armanpv", name:"Арман-ПВ", auth:"С.Тұрсынғалиева, Г.Рыскелдиева", from:121, to:168, color:"linear-gradient(140deg,#1e5bd8,#0b2a6b)"},
  M:{slug:"mektep", name:"Мектеп", auth:"Б.Керімбекова, Ж.Мұқанова", from:75, to:122, color:"linear-gradient(140deg,#f59e0b,#b45309)"},
  A:{slug:"atamura", name:"Атамұра", auth:"А.Ақтанова, А.Жүндібаева, Л.Жүмекенова", from:76, to:137, color:"linear-gradient(140deg,#10b981,#065f46)"},
  Z:{slug:"zhazushy", name:"Жазушы", auth:"С.Қасқабасов, Р.Әлмұханова, Е.Раушанов, Қ.Қайырбай", from:87, to:140, color:"linear-gradient(140deg,#e11d48,#7f1d1d)"}
};
const BKEYS = ["P","M","A","Z"];
const TOPIC = [
  {from:1,to:4, ic:"⚔️", name:"Нысанбай жырау. «Кенесары – Наурызбай»", p:{P:122,M:75,A:79,Z:91}},
  {from:5,to:9, ic:"🦅", name:"Махамбет. «Махамбеттің Баймағамбетке айтқаны»", p:{P:137,M:97,A:99,Z:108}},
  {from:10,to:13, ic:"🔥", name:"Махамбет. «Мен, мен едім, мен едім»", p:{P:143,M:102,A:104,Z:117}},
  {from:14,to:16, ic:"🌳", name:"Махамбет. «Бағаналы терек»", p:{P:146,M:105,A:103,Z:118}},
  {from:17,to:24, ic:"🧭", name:"Шоқан Уәлиханов. «Ыстықкөл күнделігі»", p:{P:154,M:115,A:124,Z:127}}
];
const topicOf = n => TOPIC.find(t=>n>=t.from && n<=t.to);
const $ = (s,el=document)=>el.querySelector(s);
const $$ = (s,el=document)=>[...el.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const shuffle = a => { a=a.slice(); for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; };
const store = {
  get(k,d){ try{ const v=localStorage.getItem("bh9_"+k); return v?JSON.parse(v):d; }catch(e){ return d; } },
  set(k,v){ try{ localStorage.setItem("bh9_"+k, JSON.stringify(v)); }catch(e){} }
};
const pad = n => String(n).padStart(2,"0");

/* ---------- refs ---------- */
function refChip(b,p,label){
  const B=BOOKS[b];
  return `<button class="ref" data-b="${b}" data-p="${p}" title="Оқулықты ашу"><i>📖</i>${B.name}, ${p}-бет${label?` · ${esc(label)}`:""}</button>`;
}
function parseRefs(s){ return [...String(s||"").matchAll(/\[\[([MAZP])(\d+)\|?([^\]]*)\]\]/g)].map(m=>({b:m[1],p:+m[2],l:m[3]})); }
function stripRefs(s){ return esc(String(s||"").replace(/\[\[([MAZP])(\d+)\|?([^\]]*)\]\]/g,"").replace(/\s+/g," ").trim()); }
function inlineRefs(s){ // text with refs as chips inline
  return esc(String(s||"")).replace(/\[\[([MAZP])(\d+)\|?([^\]]*)\]\]/g,(m,b,p,l)=>refChip(b,p,l));
}
function refsBlock(s){ const r=parseRefs(s); return r.length?`<div class="refs">${r.map(x=>refChip(x.b,x.p,x.l)).join("")}</div>`:""; }
function refPlain(s){ return String(s||"").replace(/\[\[([MAZP])(\d+)\|?([^\]]*)\]\]/g,(m,b,p,l)=>`(${BOOKS[b].name}, ${p}-бет${l?", "+l:""})`); }

/* ---------- confetti / toast ---------- */
function confetti(){
  const cols=["#ffc94d","#38bdf8","#2dd4bf","#fb7185","#fff"];
  for(let i=0;i<60;i++){ const c=document.createElement("i"); c.className="confetti";
    c.style.left=Math.random()*100+"vw"; c.style.background=cols[i%cols.length];
    c.style.animationDelay=Math.random()*.5+"s"; c.style.animationDuration=1.2+Math.random()+"s";
    document.body.appendChild(c); setTimeout(()=>c.remove(),2600); }
}
let toastT;
function toast(html,ms=2200){ const t=$("#toast"); t.innerHTML=html; t.classList.add("show"); clearTimeout(toastT); toastT=setTimeout(()=>t.classList.remove("show"),ms); }

/* ---------- games ---------- */
const GNAME={match:"Сәйкестендіру",tf:"Иә / Жоқ",quiz:"Викторина",order:"Ретімен қой",sort:"Сұрыптау",fill:"Бос орынды толтыр",opinion:"Пікір платформасы",write:"Жазылым алаңы"};
function gameShell(g,id){
  return `<div class="game" data-gid="${id}"><div class="game-h"><b>🎮 ${GNAME[g.k]}</b><span class="score"></span></div><div class="gbody"></div>
  <div class="gbar"><button class="btn sm light g-reset">↺ Қайта бастау</button><span class="feedback"></span></div></div>`;
}
function done(root,ok,total){
  const fb=$(".feedback",root), sc=$(".score",root);
  sc.textContent=`${ok} / ${total}`;
  if(ok===total){ fb.className="feedback ok"; fb.textContent="Керемет! Барлығы дұрыс! 🎉"; confetti(); markProgress(root); }
}
function markProgress(root){
  const n=+document.body.dataset.lesson; if(!n) return;
  const p=store.get("prog",{}); p[n]=p[n]||{}; p[n][root.dataset.gid]=1; store.set("prog",p);
}
const G = {
  match(root,g){
    const body=$(".gbody",root); let ok=0, sel=null;
    const L1=shuffle(g.p.map((p,i)=>({t:p[0],i}))), R1=shuffle(g.p.map((p,i)=>({t:p[1],i})));
    body.innerHTML=`<div class="mcols"><div>${L1.map(x=>`<button class="chip l" data-i="${x.i}">${esc(x.t)}</button>`).join("")}</div><div>${R1.map(x=>`<button class="chip r" data-i="${x.i}">${esc(x.t)}</button>`).join("")}</div></div>`;
    $(".score",root).textContent=`0 / ${g.p.length}`;
    body.onclick=e=>{ const c=e.target.closest(".chip"); if(!c||c.classList.contains("ok")) return;
      if(!sel || sel.classList.contains(c.classList.contains("l")?"l":"r")){ $$(".chip.sel",body).forEach(x=>x.classList.remove("sel")); sel=c; c.classList.add("sel"); return; }
      if(sel.dataset.i===c.dataset.i){ sel.classList.remove("sel"); sel.classList.add("ok"); c.classList.add("ok"); ok++; sel=null; done(root,ok,g.p.length); }
      else { c.classList.add("no"); sel.classList.add("no"); const s=sel; setTimeout(()=>{c.classList.remove("no"); s.classList.remove("no","sel");},450); sel=null; }
    };
  },
  tf(root,g){
    const body=$(".gbody",root); let ok=0, ans=0;
    body.innerHTML=g.i.map((x,i)=>`<div class="tf-row" data-i="${i}"><span>${i+1}. ${esc(x[0])}</span><span class="bt"><button data-v="1">Иә</button><button data-v="0">Жоқ</button></span></div>`).join("");
    $(".score",root).textContent=`0 / ${g.i.length}`;
    body.onclick=e=>{ const b=e.target.closest("button"); if(!b) return; const row=b.closest(".tf-row"); if(row.dataset.done) return;
      row.dataset.done=1; ans++; const right=(+b.dataset.v)===g.i[+row.dataset.i][1];
      row.classList.add(right?"ok":"no"); if(right) ok++; else row.querySelector(".bt").innerHTML=`<b style="color:var(--ok)">${g.i[+row.dataset.i][1]?"Иә":"Жоқ"}</b>`;
      $(".score",root).textContent=`${ok} / ${g.i.length}`;
      if(ans===g.i.length){ if(ok===g.i.length) done(root,ok,g.i.length); else { const fb=$(".feedback",root); fb.className="feedback no"; fb.textContent=`Нәтиже: ${ok}/${g.i.length}. Қателерді талдаңыз.`; } }
    };
  },
  quiz(root,g){
    const body=$(".gbody",root); let ok=0, ans=0;
    body.innerHTML=g.i.map((q,qi)=>{ const o=shuffle(q[1].map((t,i)=>({t,i})));
      return `<div class="q" data-q="${qi}"><p>${qi+1}. ${esc(q[0])}</p><div class="opts">${o.map(x=>`<button data-i="${x.i}">${esc(x.t)}</button>`).join("")}</div></div>`; }).join("");
    $(".score",root).textContent=`0 / ${g.i.length}`;
    body.onclick=e=>{ const b=e.target.closest(".opts button"); if(!b) return; const q=b.closest(".q"); if(q.dataset.done) return;
      q.dataset.done=1; ans++; const a=g.i[+q.dataset.q][2];
      if(+b.dataset.i===a){ b.classList.add("ok"); ok++; } else { b.classList.add("no"); $$("button",q).find(x=>+x.dataset.i===a).classList.add("ok"); }
      $(".score",root).textContent=`${ok} / ${g.i.length}`;
      if(ans===g.i.length){ if(ok===g.i.length) done(root,ok,g.i.length); else { const fb=$(".feedback",root); fb.className="feedback no"; fb.textContent=`Нәтиже: ${ok}/${g.i.length}`; } }
    };
  },
  order(root,g){
    const body=$(".gbody",root);
    let cur=shuffle(g.i.map((t,i)=>({t,i}))); if(cur.every((x,i)=>x.i===i)) cur.reverse();
    const draw=()=>{ body.innerHTML=`<div class="olist">${cur.map((x,k)=>`<div class="oitem" draggable="true" data-k="${k}"><span class="n">${k+1}</span><span class="t">${esc(x.t)}</span><span class="mv"><button data-u="${k}">▲</button> <button data-d="${k}">▼</button></span></div>`).join("")}</div><button class="btn sm blue g-check" style="margin-top:6px">✓ Тексеру</button>`; };
    draw(); $(".score",root).textContent=`${g.i.length} элемент`;
    let drag=null;
    body.onclick=e=>{ const u=e.target.dataset.u, d=e.target.dataset.d;
      if(u!==undefined && +u>0){ [cur[+u-1],cur[+u]]=[cur[+u],cur[+u-1]]; draw(); }
      if(d!==undefined && +d<cur.length-1){ [cur[+d+1],cur[+d]]=[cur[+d],cur[+d+1]]; draw(); }
      if(e.target.classList.contains("g-check")){ let ok=0; $$(".oitem",body).forEach((el,k)=>{ const r=cur[k].i===k; el.classList.add(r?"ok":"no"); if(r) ok++; });
        if(ok===cur.length) done(root,ok,cur.length); else { $(".score",root).textContent=`${ok} / ${cur.length}`; const fb=$(".feedback",root); fb.className="feedback no"; fb.textContent="Қызыл элементтердің орнын ауыстырып көріңіз."; } }
    };
    body.addEventListener("dragstart",e=>{ const it=e.target.closest(".oitem"); if(it) drag=+it.dataset.k; });
    body.addEventListener("dragover",e=>e.preventDefault());
    body.addEventListener("drop",e=>{ e.preventDefault(); const it=e.target.closest(".oitem"); if(!it||drag===null) return; const to=+it.dataset.k; const [m]=cur.splice(drag,1); cur.splice(to,0,m); drag=null; draw(); });
  },
  sort(root,g){
    const body=$(".gbody",root); let sel=null;
    const items=shuffle(g.i.map((x,i)=>({t:x[0],c:x[1],i})));
    const cols=Math.min(g.c.length,3);
    body.innerHTML=`<div class="bank">${items.map(x=>`<button class="w" data-i="${x.i}">${esc(x.t)}</button>`).join("")}</div>
      <div class="buckets" style="grid-template-columns:repeat(${cols},1fr)">${g.c.map((c,ci)=>`<div class="bucket" data-c="${ci}"><h5>⬇ ${esc(c)}</h5><div class="in"></div></div>`).join("")}</div>
      <button class="btn sm blue g-check" style="margin-top:8px">✓ Тексеру</button>`;
    $(".score",root).textContent=`0 / ${items.length}`;
    body.onclick=e=>{
      const w=e.target.closest(".w");
      if(w){ if(w.closest(".bucket")&&sel){ sel.classList.remove("sel"); $(".in",w.closest(".bucket")).appendChild(sel); sel=null; return; } if(w.closest(".bucket")){ $(".bank",body).appendChild(w); w.classList.remove("ok","no"); return; } $$(".w.sel",body).forEach(x=>x.classList.remove("sel")); sel=w; w.classList.add("sel"); return; }
      const b=e.target.closest(".bucket"); if(b&&sel){ sel.classList.remove("sel"); $(".in",b).appendChild(sel); sel=null; return; }
      if(e.target.classList.contains("g-check")){ let ok=0; $$(".bucket .w",body).forEach(x=>{ const r=g.i[+x.dataset.i][1]===+x.closest(".bucket").dataset.c; x.classList.toggle("ok",r); x.classList.toggle("no",!r); if(r) ok++; });
        $(".score",root).textContent=`${ok} / ${items.length}`;
        if(ok===items.length) done(root,ok,items.length); else { const fb=$(".feedback",root); fb.className="feedback no"; fb.textContent=$$(".bank .w",body).length?"Барлық сөзді орналастырыңыз.":"Қызылдарды басып, қайта орналастырыңыз."; } }
    };
    $$(".w",body).forEach(w=>{ w.draggable=true; w.addEventListener("dragstart",()=>{sel=w;}); });
    $$(".bucket",body).forEach(b=>{ b.addEventListener("dragover",e=>e.preventDefault()); b.addEventListener("drop",e=>{e.preventDefault(); if(sel){ sel.classList.remove("sel"); $(".in",b).appendChild(sel); sel=null; }}); });
  },
  fill(root,g){
    const body=$(".gbody",root); const ans=[]; let k=0;
    const html=esc(g.x).replace(/\{([^}]+)\}/g,(m,a)=>{ ans.push(a); return `<button class="blank" data-k="${k++}">&nbsp;</button>`; });
    body.innerHTML=`<div class="bank">${shuffle(ans.map((a,i)=>({a,i}))).map(x=>`<button class="w" data-a="${esc(x.a)}">${esc(x.a)}</button>`).join("")}</div><div class="fill">${html}</div><button class="btn sm blue g-check" style="margin-top:8px">✓ Тексеру</button>`;
    $(".score",root).textContent=`0 / ${ans.length}`;
    let sel=null;
    body.onclick=e=>{
      const w=e.target.closest(".bank .w"); if(w){ $$(".bank .w.sel",body).forEach(x=>x.classList.remove("sel")); sel=w; w.classList.add("sel");
        const empty=$$(".blank",body).find(b=>!b.dataset.v); if(empty){ empty.dataset.v=w.dataset.a; empty.textContent=w.dataset.a; w.remove(); sel=null; } return; }
      const bl=e.target.closest(".blank"); if(bl&&bl.dataset.v){ const nb=document.createElement("button"); nb.className="w"; nb.dataset.a=bl.dataset.v; nb.textContent=bl.dataset.v; $(".bank",body).appendChild(nb); delete bl.dataset.v; bl.innerHTML="&nbsp;"; bl.classList.remove("ok","no"); return; }
      if(e.target.classList.contains("g-check")){ let ok=0; $$(".blank",body).forEach(b=>{ const r=b.dataset.v===ans[+b.dataset.k]; b.classList.toggle("ok",r); b.classList.toggle("no",!r); if(r) ok++; });
        $(".score",root).textContent=`${ok} / ${ans.length}`; if(ok===ans.length) done(root,ok,ans.length); else { const fb=$(".feedback",root); fb.className="feedback no"; fb.textContent="Қызыл сөзді басып, қайта таңдаңыз."; } }
    };
  },
  opinion(root,g){
    const body=$(".gbody",root); const opts=["✅ Келісемін","🤔 Ішінара","❌ Келіспеймін"];
    body.innerHTML=g.i.map((s,i)=>`<div class="op-row" data-i="${i}"><p>${i+1}. ${esc(s)}</p><div class="bt">${opts.map((o,k)=>`<button data-k="${k}">${o}</button>`).join("")}</div><input placeholder="Себебі... (дәлеліңізді жазыңыз)"></div>`).join("")+`<button class="btn sm blue g-send">📨 Жауаптарымды жіберу</button>`;
    $(".score",root).textContent=`${g.i.length} пікір`;
    body.onclick=e=>{ const b=e.target.closest(".bt button"); if(b){ $$("button",b.parentNode).forEach(x=>x.classList.remove("on")); b.classList.add("on"); return; }
      if(e.target.classList.contains("g-send")){ const rows=$$(".op-row",body); const miss=rows.filter(r=>!$(".on",r)).length;
        const fb=$(".feedback",root); if(miss){ fb.className="feedback no"; fb.textContent=`Тағы ${miss} пікірге ұстаным таңдаңыз.`; return; }
        const noReason=rows.filter(r=>!$("input",r).value.trim()).length;
        fb.className="feedback ok"; fb.textContent=noReason?`Жіберілді! Кеңес: ${noReason} пікірге дәлел жазылмаған.`:"Жіберілді! Ұстанымың дәлелді. Жарайсың! 👏"; if(!noReason){confetti(); markProgress(root);} }
    };
  },
  write(root,g){
    const body=$(".gbody",root); const key="w_"+document.body.dataset.lesson+"_"+root.dataset.gid;
    body.innerHTML=`<p style="margin:0 0 8px;font-weight:800">✍️ ${esc(g.p)}</p><textarea class="wr" placeholder="Осы жерге жазыңыз...">${esc(store.get(key,""))}</textarea>
      <div class="checks">${g.c.map(c=>`<label><input type="checkbox"> ${esc(c)}</label>`).join("")}</div>
      <div class="gbar"><button class="btn sm blue g-save">💾 Сақтау</button><button class="btn sm light g-copy">📋 Көшіру</button><span class="wc"></span></div>`;
    const ta=$("textarea",body), wc=$(".wc",body);
    const count=()=>{ const n=(ta.value.trim().match(/\S+/g)||[]).length; wc.innerHTML=`Сөз саны: <b style="color:${n>=g.w?"var(--ok)":"var(--bad)"}">${n}</b> / ${g.w}`; $(".score",root).textContent=n>=g.w?"Көлемі жеткілікті ✓":`кемінде ${g.w} сөз`; };
    ta.oninput=count; count();
    body.onclick=e=>{ if(e.target.classList.contains("g-save")){ store.set(key,ta.value); toast("💾 Мәтін сақталды"); }
      if(e.target.classList.contains("g-copy")){ try{ navigator.clipboard.writeText(ta.value); toast("📋 Көшірілді"); }catch(err){ ta.select(); } }
      if(e.target.type==="checkbox"){ const all=$$("input[type=checkbox]",body).every(x=>x.checked); const n=(ta.value.trim().match(/\S+/g)||[]).length; if(all&&n>=g.w){ const fb=$(".feedback",root); fb.className="feedback ok"; fb.textContent="Тексеру парағы толық орындалды! 🌟"; confetti(); markProgress(root);} }
    };
  }
};
function mountGames(scope){
  $$(".game",scope).forEach(root=>{ const g=GAMES[root.dataset.gid]; if(!g) return; const run=()=>{ $(".feedback",root).textContent=""; G[g.k](root,g); }; run(); $(".g-reset",root).onclick=run; });
}
let GAMES={};

/* ---------- pages ---------- */
const app = ()=>$("#app");
function home(){
  document.body.dataset.lesson="";
  const prog=store.get("prog",{});
  const quotes=[["Мен, мен едім, мен едім, Мен Нарында жүргенде Еңіреп жүрген ер едім.","Махамбет Өтемісұлы"],["Ханнан қырық туғанша, Қарадан бір-ақ тусайшы.","Махамбет Өтемісұлы"],["Кеудедегі шыбын жан – Ар-намыстың құрбаны.","Нысанбай жырау"]];
  const q=quotes[Math.floor(Math.random()*quotes.length)];
  const nGames=L.reduce((a,l)=>a+l.tasks.length+2,0);
  app().innerHTML=`
  <section class="hero"><div class="wrap">
    <div><span class="pill">📘 Қазақ әдебиеті · 9-сынып · 2-тоқсан</span>
      <h1>Тарихи шындық пен <em>көркемдік шешім</em></h1>
      <p class="lead">Нысанбай жырау, Махамбет Өтемісұлы, Шоқан Уәлиханов мұрасы бойынша 24 сабақ: педагог-шебер деңгейіндегі ҚМЖ, топтық тапсырмалар, интерактивті ойындар, зияткерлік алаң және төрт баспаның оқулығы бір жерде.</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:16px"><a class="btn gold" href="#/lesson/1">▶ 1-сабақтан бастау</a><a class="btn ghost" href="#/books">📚 Оқулықтар</a><a class="btn ghost" href="kmzh/KMZh_9-synyp_2-toqsan.docx" download>⬇ Барлық ҚМЖ (Word)</a></div>
      <div class="stats"><div class="stat"><b>24</b><span>сабақ + ҚМЖ</span></div><div class="stat"><b>4</b><span>баспа оқулығы</span></div><div class="stat"><b>${nGames}+</b><span>интерактивті ойын</span></div><div class="stat"><b>${Object.keys(window.GLOSSARY).length}</b><span>сөздік бот қоры</span></div></div>
    </div>
    <div class="hero-art"><div class="orb" style="width:180px;height:180px;background:#38bdf8;opacity:.35;right:0;top:0"></div><div class="orb" style="width:120px;height:120px;background:#ffc94d;opacity:.35;left:10px;bottom:0"></div>
      <div class="book3d"><div class="quote">«${esc(q[0])}»<small>— ${q[1]}</small></div></div></div>
  </div></section>
  <section class="block"><div class="wrap">
    <div class="sec-title"><div><h2>Сабақтар</h2><p>Тақырыпты таңдаңыз — әр сабақта 4 тапсырма, А деңгейі, зияткерлік алаң, бекіту мен рефлексия бар.</p></div></div>
    ${TOPIC.map(t=>`<div class="unit"><div class="ico">${t.ic}</div><div><h3>${esc(t.name)}</h3><small>${t.from}–${t.to}-сабақтар</small></div></div>
      <div class="grid">${L.filter(l=>l.n>=t.from&&l.n<=t.to).map(l=>{ const total=l.tasks.length+2; const d=Object.keys(prog[l.n]||{}).length;
        return `<a class="lcard" href="#/lesson/${l.n}"><span class="num">${l.n}</span><span class="tags">${l.goals.map(g=>`<span class="tag">${g.split(" ")[0]}</span>`).join("")}${/БЖБ/.test(l.title)?'<span class="tag red">БЖБ</span>':""}${/ТЖБ/.test(l.title)?'<span class="tag red">ТЖБ</span>':""}</span><h4>${esc(l.title)}</h4><span class="tags"><span class="tag gold">💎 ${esc(l.value)}</span></span><div class="progress"><i style="width:${Math.min(100,d/total*100)}%"></i></div></a>`; }).join("")}</div>`).join("")}
  </div></section>`;
}
function stageLab(n,t){ return `<div class="stage-lab"><b>${n}</b><span>${t}</span></div>`; }
function lessonPage(n,tab){
  const l=L.find(x=>x.n===n); if(!l){ home(); return; }
  document.body.dataset.lesson=n; GAMES={};
  const t=topicOf(n); let gi=0; const gid=g=>{ const id="g"+(gi++); GAMES[id]=g; return id; };
  const prev=L.find(x=>x.n===n-1), next=L.find(x=>x.n===n+1);
  const descHtml=d=>`<div class="desc"><b>Дескриптор:</b><ul>${d.map(x=>`<li>${esc(x[0])} — <b>${x[1]} балл</b></li>`).join("")}</ul></div>`;
  const taskCard=(tk,i)=>`<div class="tcard task"><h3><span class="form ${tk.f}">${tk.f}</span> ${i+1}-тапсырма. ${esc(tk.m)}</h3>
     <div class="who"><div><b>Педагог</b>${stripRefs(tk.t)}</div><div><b>Оқушы</b>${stripRefs(tk.s)}</div></div>
     ${refsBlock(tk.t+" "+tk.r)}${gameShell(tk.g,gid(tk.g))}${descHtml(tk.d)}</div>`;
  const lesson=`
   <div class="stage">${stageLab("Басы","10 минут")}<div>
     <div class="tcard hook"><h3>✨ Қызығушылықты ояту: ${esc(l.hook.m)}</h3><p style="margin:0 0 6px"><span class="tag gold">💎 Құндылық: ${esc(l.value)}</span></p>
       <div class="who"><div><b>Педагог</b>${stripRefs(l.hook.t)}</div><div><b>Оқушы</b>${stripRefs(l.hook.s)}</div></div>
       ${gameShell(l.hook.g,gid(l.hook.g))}
       <p style="margin:12px 0 0;font-size:14.5px">📝 ${stripRefs(l.hw0)}</p>${refsBlock(l.hw0)}</div></div></div>
   <div class="stage">${stageLab("Ортасы","30 минут")}<div>
     ${l.tasks.map(taskCard).join("")}
     <div class="tcard alevel"><h3><span class="form" style="background:var(--rose)">А</span> ${esc(l.A.m)}</h3><p>${inlineRefs(l.A.t)}</p>
       ${gameShell({k:"write",p:refPlain(l.A.t),c:l.A.d.map(x=>x[0]),w:50},gid({k:"write",p:refPlain(l.A.t),c:l.A.d.map(x=>x[0]),w:50}))}${descHtml(l.A.d)}</div>
     <div class="tcard arena"><h3>🧠 Зияткерлік алаң</h3><p style="margin:0 0 6px">${stripRefs(l.arena.t)}</p>
       <div class="timer"><span class="clock" id="clock">03:00</span><button class="btn sm blue" data-t="180">▶ 3 мин</button><button class="btn sm light" data-t="60">1 мин</button><button class="btn sm light" data-t="0">■ Тоқтату</button><button class="btn sm light" id="pickg">🎲 Кездейсоқ топ</button></div>
       <div class="groups">${l.arena.groups.map((g,i)=>`<div class="group"><h4>${esc(g[0])}</h4><p>${stripRefs(g[1])}</p>${refsBlock(g[1])}<div class="gscore"><button data-s="-1">−</button><b data-g="${i}">0</b><button data-s="1">+</button><span style="font-size:12px;opacity:.8">ұпай</span></div></div>`).join("")}</div></div></div></div>
   <div class="stage">${stageLab("Соңы","5 минут")}<div>
     <div class="tcard end"><h3>✅ Бекіту: ${esc(l.end.m)}</h3><p style="margin:0">${stripRefs(l.end.t)}</p>${gameShell(l.end.g,gid(l.end.g))}</div>
     <div class="tcard end refl"><h3>💬 Рефлексия: ${esc(l.refl.m)}</h3>
       <div class="refl-emo">${["😍","🙂","🤔","😕"].map(e=>`<button>${e}</button>`).join("")}</div>
       ${l.refl.items.map(x=>`<label style="display:block;margin-top:6px;font-weight:700;font-size:14px">${esc(x)}<input></label>`).join("")}
       <div class="gbar"><button class="btn sm blue" id="reflsend">📨 Жіберу</button></div></div>
     <div class="hw">🏠 <b>Үй тапсырмасы:</b> ${stripRefs(l.hw)} ${refsBlock(l.hw)}</div></div></div>`;
  const books=`<p style="margin-top:0">Бұл тақырып төрт баспаның оқулығында. Батырманы басыңыз — оқулық дәл сол беттен ашылады.</p>
     <div class="bookgrid">${BKEYS.map(b=>`<div class="bookc" data-b="${b}" data-p="${t.p[b]}"><div class="cov" style="background:${BOOKS[b].color}"><small>${BOOKS[b].auth}</small>${BOOKS[b].name}</div><div class="info"><b>Тақырып басы:</b> ${t.p[b]}-бет<br><span style="color:var(--muted)">Оқулық беттері: ${BOOKS[b].from}–${BOOKS[b].to}</span></div></div>`).join("")}</div>`;
  app().innerHTML=`
  <section class="lesson-head"><div class="wrap">
    <div class="crumbs"><a href="#/">Басты бет</a> › ${esc(t.name)} › ${n}-сабақ</div>
    <h1>${n}. ${esc(l.title)}</h1>
    <div class="meta"><div class="box"><b>Оқу мақсаттары</b>${l.goals.map(esc).join("<br>")}</div><div class="box"><b>Сабақтың мақсаты</b>${esc(l.aim)}</div></div>
    <div class="books-row">${BKEYS.map(b=>refChip(b,t.p[b],"тақырып")).join("")}</div>
    <div class="tabs"><button data-tab="lesson" class="${tab!=="kmzh"&&tab!=="books"?"on":""}">🎯 Сабақ барысы</button><button data-tab="kmzh" class="${tab==="kmzh"?"on":""}">📄 ҚМЖ</button><button data-tab="books" class="${tab==="books"?"on":""}">📚 Оқулықтар</button></div>
  </div></section>
  <div class="wrap"><div class="panel" id="panel">
    <div data-pane="lesson" ${tab==="kmzh"||tab==="books"?'hidden':''}>${lesson}</div>
    <div data-pane="kmzh" ${tab==="kmzh"?'':'hidden'}>${kmzhHTML(l)}</div>
    <div data-pane="books" ${tab==="books"?'':'hidden'}>${books}</div>
    <div style="display:flex;justify-content:space-between;margin-top:18px;gap:10px;flex-wrap:wrap">${prev?`<a class="btn blue" href="#/lesson/${prev.n}">← ${prev.n}-сабақ</a>`:"<span></span>"}${next?`<a class="btn blue" href="#/lesson/${next.n}">${next.n}-сабақ →</a>`:""}</div>
  </div></div>`;
  mountGames(app());
  $$(".tabs button").forEach(b=>b.onclick=()=>{ $$(".tabs button").forEach(x=>x.classList.toggle("on",x===b)); $$("[data-pane]").forEach(p=>p.hidden=p.dataset.pane!==b.dataset.tab); });
  // arena timer & scores
  let tm=null; const clock=$("#clock");
  $$(".timer [data-t]").forEach(b=>b.onclick=()=>{ clearInterval(tm); let s=+b.dataset.t; const draw=()=>{ clock.textContent=pad(Math.floor(s/60))+":"+pad(s%60); clock.classList.toggle("warn",s<=20); };
    draw(); if(!s) return; tm=setInterval(()=>{ s--; draw(); if(s<=0){ clearInterval(tm); toast("⏰ Уақыт бітті! Топтар қорғауға дайын."); } },1000); });
  $$(".gscore button").forEach(b=>b.onclick=()=>{ const v=b.parentNode.querySelector("b"); v.textContent=Math.max(0,+v.textContent+ +b.dataset.s); });
  const pg=$("#pickg"); if(pg) pg.onclick=()=>{ const g=l.arena.groups[Math.floor(Math.random()*3)]; toast(`🎲 Бірінші болып қорғайды: <b>${esc(g[0])}</b>`,3000); };
  $$(".refl-emo button").forEach(b=>b.onclick=()=>{ $$(".refl-emo button").forEach(x=>x.classList.remove("on")); b.classList.add("on"); });
  const rs=$("#reflsend"); if(rs) rs.onclick=()=>{ toast("💙 Рефлексияңыз қабылданды. Рақмет!"); confetti(); };
  window.scrollTo(0,0);
}
function gameText(g){
  if(!g) return "";
  const s=x=>esc(x);
  switch(g.k){
    case "match": return "Сәйкестендіру: "+g.p.map(p=>`${s(p[0])} – ${s(p[1])}`).join("; ");
    case "tf": return g.i.map((x,i)=>`${i+1}) ${s(x[0])} (${x[1]?"Иә":"Жоқ"})`).join("<br>");
    case "quiz": return g.i.map((x,i)=>`${i+1}) ${s(x[0])} – <i>${s(x[1][x[2]])}</i>`).join("<br>");
    case "order": return "Ретін анықтау: "+g.i.map((x,i)=>`${i+1}) ${s(x)}`).join("; ");
    case "sort": return g.c.map((c,ci)=>`<b>${s(c)}:</b> `+g.i.filter(x=>x[1]===ci).map(x=>s(x[0])).join("; ")).join("<br>");
    case "fill": return "Толықтыру: "+s(g.x).replace(/\{([^}]+)\}/g,"<u>$1</u>");
    case "opinion": return "«Келісемін / Ішінара / Келіспеймін»: "+g.i.map((x,i)=>`${i+1}) ${s(x)}`).join("; ");
    case "write": return `Жазылым (кемінде ${g.w} сөз). Тексеру парағы: ${g.c.map(s).join("; ")}`;
  }
  return "";
}
function kmzhHTML(l){
  const fa="Керемет! / Жарайсың! / Ойыңды жинақы жеткізіп үйрен!";
  const R=s=>parseRefs(s).map(x=>`${BOOKS[x.b].name}, ${x.p}-бет${x.l?" – "+esc(x.l):""}`).join("<br>");
  const D=d=>"<b>Дескриптор:</b><br>"+d.map(x=>`– ${esc(x[0])} – ${x[1]} б.`).join("<br>");
  const T=s=>esc(refPlain(s));
  const rows=[];
  l.tasks.forEach((t,i)=>rows.push(`<tr>${i===0?`<td rowspan="${l.tasks.length+2}"><b>Ортасы</b><br>30 минут</td>`:""}<td><b>${i+1}-тапсырма. ${t.f} ${esc(t.m)}.</b> ${T(t.t)}<br><small>${gameText(t.g)}</small></td><td>${T(t.s)}</td><td><small>${D(t.d)}</small></td><td><small>${R(t.t+" "+t.r)}<br><i>Сайт: «${esc(t.m.replace(/[«»]/g,""))}» интерактиві</i></small></td></tr>`));
  rows.push(`<tr><td><b>${esc(l.A.m)}.</b> ${T(l.A.t)}</td><td>Жоғары деңгейдегі тапсырманы өз бетімен орындайды.</td><td><small>${D(l.A.d)}</small></td><td><small>${R(l.A.t)}<br><i>Сайт: А деңгейі</i></small></td></tr>`);
  rows.push(`<tr><td><b>Зияткерлік алаң.</b> ${T(l.arena.t)}<br>${l.arena.groups.map(g=>`<small><b>${esc(g[0])}:</b> ${T(g[1])}</small>`).join("<br>")}</td><td>Топпен ақылдасып, тапсырманы орындайды, қорғайды; топтар бір-бірін бағалайды.</td><td><small>Топтық бағалау: ұпай кестесі (сайтта)<br>Керемет! / Жарайсың!</small></td><td><small>${R(l.arena.groups.map(g=>g[1]).join(" "))}<br><i>Сайт: Зияткерлік алаң (таймер, ұпай)</i></small></td></tr>`);
  return `<div class="kmzh-tools"><a class="btn blue" href="kmzh/KMZh_${pad(l.n)}.docx" download>⬇ Осы ҚМЖ (Word)</a><a class="btn light" href="kmzh/KMZh_9-synyp_2-toqsan.docx" download>⬇ Барлық 24 ҚМЖ (Word)</a><button class="btn light" onclick="window.print()">🖨 Басып шығару</button></div>
  <div class="kmzh-wrap"><table class="kmzh">
  <tr><td class="lab">Бөлім:</td><td colspan="4">2. Тарихи шындық пен көркемдік шешім</td></tr>
  <tr><td class="lab">Педагогтің тегі, аты, әкесінің аты:</td><td colspan="4"></td></tr>
  <tr><td class="lab">Күні:</td><td colspan="4"></td></tr>
  <tr><td class="lab">Сынып: 9 «___»</td><td colspan="2"><b>Қатысқандар:</b></td><td colspan="2"><b>Қатыспағандар:</b></td></tr>
  <tr><td class="lab">Сабақтың тақырыбы:</td><td colspan="4"><b>${esc(l.title)}</b></td></tr>
  <tr><td class="lab">Оқу бағдарламасына сәйкес оқу мақсаттары</td><td colspan="4">${l.goals.map(esc).join("<br>")}</td></tr>
  <tr><td class="lab">Сабақтың мақсаты</td><td colspan="4">${esc(l.aim)}</td></tr>
  <tr><th colspan="5">Сабақтың барысы</th></tr>
  <tr><th>Сабақтың кезеңдері/ уақыт</th><th>Педагогтің әрекеті</th><th>Оқушының әрекеті</th><th>Бағалау</th><th>Ресурстар</th></tr>
  <tr><td><b>Басы</b><br>10 минут</td><td>Оқушылармен сәлемдесемін; сабақтың тақырыбын, күн ретін жазуға бағыттаймын; оқу мақсаттарын түсіндіремін.<br><b>Қызығушылықты ояту. ${esc(l.hook.m)}.</b> <i>Құндылық: ${esc(l.value)}.</i> ${T(l.hook.t)}<br><small>${gameText(l.hook.g)}</small><br><small>${T(l.hw0)}</small></td><td>Мұғаліммен сәлемдеседі; күн ретін жазып, мақсатпен танысады.<br>${T(l.hook.s)}</td><td><small>${fa}<br>Үй тапсырмасына 1 балл</small></td><td><small>${R(l.hook.t+" "+l.hw0)}<br><i>Bilim Hub сайты: «${esc(l.hook.m.replace(/[«»]/g,""))}» ойыны</i></small></td></tr>
  ${rows.join("")}
  <tr><td><b>Соңы</b><br>5 минут</td><td><b>Бекіту. ${esc(l.end.m)}.</b> ${T(l.end.t)}<br><small>${gameText(l.end.g)}</small><br><b>Рефлексия. ${esc(l.refl.m)}</b></td><td>Тұжырымдарды бағалап, таңдауын түсіндіреді.<br><small>${l.refl.items.map(x=>"– "+esc(x)).join("<br>")}</small></td><td><small>Өзін-өзі бағалау</small></td><td><small><i>Сайт: Бекіту ойыны, рефлексия парағы</i></small></td></tr>
  <tr><td class="lab">Үй тапсырмасы:</td><td colspan="4">${T(l.hw)}</td></tr>
  </table></div>`;
}
function booksPage(){
  document.body.dataset.lesson="";
  app().innerHTML=`<section class="block"><div class="wrap">
   <div class="sec-title"><div><h2>📚 Төрт баспаның оқулығы</h2><p>2-тоқсанның «Тарихи шындық пен көркемдік шешім» бөлімі. Тақырыпты басыңыз — оқулық сол беттен ашылады.</p></div></div>
   <div class="bookgrid">${BKEYS.map(b=>`<div class="bookc"><div class="cov" style="background:${BOOKS[b].color}" data-b="${b}" data-p="${BOOKS[b].from}"><small>${BOOKS[b].auth}, 2019</small>${BOOKS[b].name}</div>
     <div class="info"><b>Беттер:</b> ${BOOKS[b].from}–${BOOKS[b].to}<div class="topics">${TOPIC.map(t=>refChip(b,t.p[b],t.name.split(".")[0].split("«")[0].trim()||t.name)).join("")}</div></div></div>`).join("")}</div>
  </div></section>`;
}

/* ---------- textbook viewer ---------- */
const V={b:"P",p:121,zoom:1};
function openBook(b,p){
  V.b=b; V.p=p; $("#viewer").classList.add("open"); document.body.style.overflow="hidden"; renderViewer();
}
function renderViewer(){
  const B=BOOKS[V.b];
  $$("#viewer .bsel button").forEach(x=>x.classList.toggle("on",x.dataset.vb===V.b));
  $("#vpage").value=V.p; $("#vtitle").textContent=`${B.name} · ${V.p}-бет`;
  const body=$("#vbody");
  if(V.p<B.from||V.p>B.to){ body.innerHTML=`<div class="vmsg"><h3>Бұл бет 2-тоқсан бөлімінен тыс</h3><p>${B.name} оқулығында ${B.from}–${B.to} беттер қолжетімді.</p><button class="btn gold" id="vgo">${B.from}-бетке өту</button></div>`; $("#vgo").onclick=()=>{V.p=B.from;renderViewer();}; }
  else body.innerHTML=`<img alt="${B.name}, ${V.p}-бет" src="books/${B.slug}/${V.p}.jpg" style="width:${Math.round(900*V.zoom)}px">`;
  const th=$("#vthumbs"); let h=""; for(let i=B.from;i<=B.to;i++) h+=`<button data-p="${i}" class="${i===V.p?"on":""}">${i}</button>`; th.innerHTML=h;
  const on=$(".on",th); if(on) on.scrollIntoView({inline:"center",block:"nearest"});
  body.scrollTop=0;
  // preload neighbours
  [V.p+1,V.p-1].forEach(x=>{ if(x>=B.from&&x<=B.to){ const im=new Image(); im.src=`books/${B.slug}/${x}.jpg`; } });
}
function closeBook(){ $("#viewer").classList.remove("open"); document.body.style.overflow=""; }

/* ---------- Sozdikqor bot ---------- */
function botReply(q){
  q=q.trim(); if(!q) return;
  const box=$("#msgs"); box.insertAdjacentHTML("beforeend",`<div class="msg u">${esc(q)}</div>`);
  const key=q.toLowerCase().replace(/[«»"'.,!?]/g,"").trim();
  const G=window.GLOSSARY; let hit=G[key]; let word=key;
  if(!hit){ const k=Object.keys(G).find(w=>key.startsWith(w)||w.startsWith(key)&&key.length>3); if(k){ hit=G[k]; word=k; } }
  const url="https://sozdikqor.kz/search?q="+encodeURIComponent(key);
  const html= hit ? `<b>${esc(word.toUpperCase())}</b> — ${esc(hit)}<br><br>📚 Толық түсіндірме, мысалдар: <a href="${url}" target="_blank" rel="noopener">sozdikqor.kz → «${esc(key)}»</a>`
                  : `«${esc(q)}» сөзі сабақ сөздігінде жоқ екен. 300 000-нан астам сөз бар <b>Sozdikqor</b> қорынан іздеп көрейік:<br><a href="${url}" target="_blank" rel="noopener">🔎 sozdikqor.kz → «${esc(key)}»</a>`;
  setTimeout(()=>{ box.insertAdjacentHTML("beforeend",`<div class="msg b">${html}</div>`); box.scrollTop=box.scrollHeight; },250);
  box.scrollTop=box.scrollHeight;
}

/* ---------- tools ---------- */
function picker(){
  const n=+prompt("Сыныптағы оқушы саны:", store.get("cls",25)); if(!n) return; store.set("cls",n);
  const x=1+Math.floor(Math.random()*n); toast(`<div class="big-pick">🎯 №${x}</div><div style="text-align:center">журнал бойынша оқушы</div>`,3500);
}

/* ---------- router ---------- */
function route(){
  const h=location.hash.replace(/^#\/?/,"").split("/");
  $$("nav.menu a").forEach(a=>a.classList.toggle("on",("#/"+h.join("/")).startsWith(a.getAttribute("href"))&&a.getAttribute("href")!=="#/"));
  $("nav.menu").classList.remove("open");
  if(h[0]==="lesson") lessonPage(+h[1],h[2]); else if(h[0]==="books") booksPage(); else home();
}
document.addEventListener("click",e=>{
  const r=e.target.closest("[data-b][data-p]"); if(r){ e.preventDefault(); openBook(r.dataset.b,+r.dataset.p); return; }
});
window.addEventListener("hashchange",route);
window.addEventListener("DOMContentLoaded",()=>{
  // viewer
  $("#viewer .bsel").innerHTML=BKEYS.map(b=>`<button data-vb="${b}">${BOOKS[b].name}</button>`).join("");
  $("#viewer .bsel").onclick=e=>{ const b=e.target.dataset.vb; if(!b) return; const t=topicOf(+document.body.dataset.lesson||1); V.b=b; V.p=t?t.p[b]:BOOKS[b].from; renderViewer(); };
  $("#vprev").onclick=()=>{ if(V.p>BOOKS[V.b].from){V.p--;renderViewer();} };
  $("#vnext").onclick=()=>{ if(V.p<BOOKS[V.b].to){V.p++;renderViewer();} };
  $("#vpage").onchange=e=>{ V.p=+e.target.value||V.p; renderViewer(); };
  $("#vzi").onclick=()=>{ V.zoom=Math.min(2,V.zoom+.2); renderViewer(); };
  $("#vzo").onclick=()=>{ V.zoom=Math.max(.5,V.zoom-.2); renderViewer(); };
  $("#vclose").onclick=closeBook;
  $("#vthumbs").onclick=e=>{ const p=e.target.dataset.p; if(p){ V.p=+p; renderViewer(); } };
  document.addEventListener("keydown",e=>{ if(!$("#viewer").classList.contains("open")) return; if(e.key==="Escape") closeBook(); if(e.key==="ArrowRight") $("#vnext").click(); if(e.key==="ArrowLeft") $("#vprev").click(); });
  // bot
  const sugg=["кіреуке","төлеңгіт","бақыраш","жайшы","психологизм","толғау","делбеші","антитеза"];
  $("#sugg").innerHTML=sugg.map(w=>`<button>${w}</button>`).join("");
  $("#sugg").onclick=e=>{ if(e.target.tagName==="BUTTON") botReply(e.target.textContent); };
  $("#botbtn").onclick=()=>$("#bot").classList.toggle("open");
  $("#botx").onclick=()=>$("#bot").classList.remove("open");
  $("#botform").onsubmit=e=>{ e.preventDefault(); const i=$("#botin"); botReply(i.value); i.value=""; };
  $(".burger").onclick=()=>$("nav.menu").classList.toggle("open");
  $("#tpick").onclick=picker;
  $("#ttop").onclick=()=>window.scrollTo({top:0,behavior:"smooth"});
  $("#tfull").onclick=()=>{ try{ document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen(); }catch(err){} };
  route();
});
})();
