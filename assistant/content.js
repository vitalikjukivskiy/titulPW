/* Local content layer: no fetch, analytics, accounts or background publishing. */
(() => {
  'use strict';
  const data = window.CYBERPW_CONTENT || { news: [], modules: [], guides: [] };
  const $ = (s, p = document) => p.querySelector(s);
  const $$ = (s, p = document) => [...p.querySelectorAll(s)];
  const el = (tag, cls = '', text = '') => { const n = document.createElement(tag); if (cls) n.className = cls; if (text !== '') n.textContent = text; return n; };
  const icon = (name) => { const n = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); n.setAttribute('class', 'icon'); n.setAttribute('aria-hidden', 'true'); const u = document.createElementNS(n.namespaceURI, 'use'); u.setAttribute('href', `#i-${/^[a-z-]+$/.test(name) ? name : 'log'}`); n.append(u); return n; };
  const safeURL = (s) => { try { const u = new URL(s); return u.protocol === 'https:' ? u.href : null; } catch { return null; } };
  const validVideo = (s) => typeof s === 'string' && /^[a-zA-Z0-9_-]{11}$/.test(s);
  const date = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || '') ? s.split('-').reverse().join('.') : 'Без дати';
  const categories = { update: 'Оновлення', announcement: 'Анонс', guide: 'Гайд', video: 'Відео' };
  const catIcons = { update: 'log', announcement: 'spark', guide: 'book', video: 'youtube' };
  const groups = { items: 'Предмети й крафт', world: 'Квести й світ', combat: 'Бій та інструменти', community: 'Спільнота', all: 'Загальний гайд' };
  const normalize = (s) => String(s || '').toLocaleLowerCase('uk-UA').replace(/[’‘`]/g, "'").trim();
  const single = document.body.dataset.single === 'true';
  const root = document.body.dataset.root || './';
  const news = (Array.isArray(data.news) ? data.news : []).filter(n => n.published === true && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(n.slug || '')).sort((a,b) => Number(Boolean(b.pinned))-Number(Boolean(a.pinned)) || String(b.date).localeCompare(String(a.date)));
  let toastTimer;
  const toast = (message) => { const n = $('#content-toast'); if (!n) return; n.textContent = message; n.classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => n.classList.remove('visible'), 4600); };
  async function copyText(text) {
    try { if (navigator.clipboard && isSecureContext) { await navigator.clipboard.writeText(text); return true; } } catch { /* Try an explicit local selection below. */ }
    const t = el('textarea'); t.value = text; t.setAttribute('aria-label', 'Текст для копіювання'); t.style.cssText = 'position:fixed;top:0;left:0;opacity:0'; document.body.append(t); t.select(); let ok = false;
    try { ok = document.execCommand('copy'); } catch { /* Report failure honestly. */ }
    t.remove(); return ok;
  }
  function external(text, url, cls = 'text-link') { const n = el('a', cls, text); const safe = safeURL(url); if (!safe) return el('span', cls, text); n.href = safe; n.target = '_blank'; n.rel = 'noopener noreferrer'; return n; }
  function badge(n) { const x = el('span', `news-type ${n.category}`); x.append(icon(catIcons[n.category] || 'log'), document.createTextNode(categories[n.category] || 'Новина')); return x; }
  function meta(n) { const m = el('div', 'news-card-meta'); const t = el('time', '', `${n.dateLabel || 'Матеріал'} · ${date(n.date)}`); t.dateTime = n.date; m.append(badge(n), t); return m; }
  function articleHref(slug) { return single ? `#news/${slug}` : `${root}news/${slug}.html`; }
  function card(n, featured = false) {
    const a = el('article', `news-card${featured ? ' featured' : ''}`); const link = el('a','news-card-link'); link.href = articleHref(n.slug); link.dataset.newsOpen = n.slug;
    link.append(meta(n));
    if (featured && n.version) { const art = el('div', 'news-art'); art.setAttribute('aria-hidden','true'); art.append(el('b','',n.version),icon(n.icon || 'armor')); link.append(art); }
    link.append(el('h3','',n.title),el('p','',n.summary));
    const b = el('div','news-card-bottom'); b.append(el('span','', n.category === 'announcement' ? 'Деталі анонсу' : 'Читати матеріал'),icon('arrow')); link.append(b); a.append(link); return a;
  }
  function prose(blocks) { const p = el('div','article-prose'); for (const b of (blocks || [])) { if (b.type === 'list') { const ul = el('ul'); for (const t of b.items || []) ul.append(el('li','',String(t))); p.append(ul); } else if (['p','h2','notice'].includes(b.type)) p.append(el(b.type === 'h2' ? 'h2' : 'p',b.type === 'notice' ? 'article-notice' : '', b.text || '')); } return p; }
  function fillArticle(parent,n) {
    parent.replaceChildren(meta(n)); const h = el('h2','',n.title); h.id='news-article-title'; parent.append(h, el('p','article-summary',n.summary),prose(n.blocks));
    if (validVideo(n.videoId)) { const v = external('Демонстрація на YouTube',`https://www.youtube.com/watch?v=${n.videoId}`,'btn article-video'); v.prepend(icon('play')); parent.append(v); }
    const refs=el('div','article-sources'); refs.append(el('strong','','Матеріали автора')); const list=el('ul'); for (const s of n.sources || []) { if (!safeURL(s.url)) continue; const li=el('li'); li.append(external(s.title,s.url,'')); list.append(li); } refs.append(list); parent.append(refs);
  }
  const newsRoot=$('[data-news-root]'); let newsFilter='all', search='', expanded=document.body.dataset.page === 'archive';
  const getFiltered = () => news.filter(n => (newsFilter==='all'||n.category===newsFilter) && normalize([n.title,n.summary,n.version,...(n.blocks || []).flatMap(b=>[b.text,...(b.items||[])])].join(' ')).includes(normalize(search)));
  function renderNews() {
    if (!newsRoot) return;
    const matches=getFiltered(), shown=expanded ? matches : matches.slice(0,3);
    $('#news-grid').replaceChildren(...shown.map((n,i)=>card(n,i===0&&newsFilter==='all'&&!search&&Boolean(n.pinned))));
    $('#news-empty').hidden=matches.length>0;
    $('#news-counter').textContent=`Показано ${shown.length} із ${matches.length} матеріалів`;
    const more=$('#news-more'); more.hidden=matches.length<=3 || document.body.dataset.page==='archive'; more.replaceChildren(document.createTextNode(expanded?'Згорнути до 3 новин':'Показати всі новини'),icon(expanded?'chevron':'plus'));
    $$('.news-filter').forEach(b=>b.setAttribute('aria-pressed', String(b.dataset.newsFilter===newsFilter)));
  }
  if(newsRoot){
    const initial=new URLSearchParams(location.search).get('category'); if(categories[initial])newsFilter=initial;
    $$('.news-filter').forEach(b=>b.addEventListener('click',()=>{newsFilter=b.dataset.newsFilter; expanded=document.body.dataset.page==='archive';renderNews();}));
    $('#news-search').addEventListener('input',e=>{search=e.target.value;renderNews();});
    $('#news-reset').addEventListener('click',()=>{search='';newsFilter='all';$('#news-search').value='';renderNews();$('#news-search').focus();});
    $('#news-more').addEventListener('click',()=>{expanded=!expanded;renderNews();if(!expanded)newsRoot.scrollIntoView({behavior:'auto'});});
    renderNews();
  }
  const dialog=$('#news-dialog'); let current=null,lastTrigger=null;
  function openNews(slug,trigger,hash=true){
    const n=news.find(x=>x.slug===slug); if(!n || !dialog || typeof dialog.showModal!=='function') return false;
    current=n;lastTrigger=trigger||document.activeElement;fillArticle($('#news-article-content'),n);
    const permalink=$('#news-permalink'); permalink.href=articleHref(slug); permalink.hidden=single;
    $('#news-share-status').textContent=''; if(!dialog.open)dialog.showModal();dialog.scrollTop=0;document.body.classList.add('modal-open');
    if(hash && location.hash!==`#news/${slug}`)history.pushState(null,'',`#news/${slug}`);
    return true;
  }
  function route(){const m=location.hash.match(/^#news\/([a-z0-9-]+)$/);if(m){if(!openNews(m[1],null,false))toast('Такої новини немає в цьому файлі. Відкрий журнал.');}else if(dialog?.open)dialog.close();}
  if(dialog){
    $('#news-close').addEventListener('click',()=>dialog.close());
    dialog.addEventListener('close',()=>{if(!$$('dialog[open]').length)document.body.classList.remove('modal-open');if(location.hash.startsWith('#news/'))history.replaceState(null,'','#news');if(lastTrigger?.isConnected)lastTrigger.focus({preventScroll:true});});
    dialog.addEventListener('click',e=>{if(e.target!==dialog)return;const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();});
    $('#news-share').addEventListener('click',async()=>{
      if(!current)return;const status=$('#news-share-status');
      if(!/^https?:$/.test(location.protocol)){status.textContent='Публічне посилання з’явиться після розміщення сайту. Це локальний файл.';return;}
      const url=new URL(single?`#news/${current.slug}`:`${root}news/${current.slug}.html`,location.href).href;
      const ok=await copyText(url);status.textContent=ok?'Посилання скопійовано.':'Не вдалося скопіювати. Скористайся окремою сторінкою новини.';
    });
    addEventListener('hashchange',route);addEventListener('popstate',route);route();
  }
  document.addEventListener('click',e=>{
    if(!(e.target instanceof Element))return;
    const a=e.target.closest('[data-news-open]');if(a&&!e.ctrlKey&&!e.metaKey&&!e.shiftKey&&e.button===0){if(openNews(a.dataset.newsOpen,a))e.preventDefault();return;}
    const cat=e.target.closest('[data-news-category]');if(cat&&newsRoot){newsFilter=cat.dataset.newsCategory;search='';$('#news-search').value='';expanded=document.body.dataset.page==='archive';renderNews();}
    const archive=e.target.closest('[data-news-archive]');if(archive&&single&&newsRoot){e.preventDefault();expanded=true;newsFilter='all';search='';$('#news-search').value='';renderNews();newsRoot.scrollIntoView({behavior:'auto'});}
  });
  if(single)$$('[data-news-archive]').forEach(a=>a.href='#news');
  // Expandable module cards retain their native details behavior.
  const modules = Array.isArray(data.modules) ? data.modules : []; let moduleFilter='all', allModules=false;
  function renderModules(){if(!$('#module-grid'))return;const matches=modules.filter(m=>moduleFilter==='all'||m.group===moduleFilter);$$('[data-module-id]').forEach(card=>{const index=matches.findIndex(m=>m.id===card.dataset.moduleId);card.hidden=index<0||(!allModules&&index>=6);});const more=$('#modules-more');more.hidden=matches.length<=6;more.replaceChildren(document.createTextNode(allModules?'Згорнути каталог':`Усі ${matches.length} інструментів`),icon(allModules?'chevron':'plus'));}
  if($('#module-grid')){$$('[data-module-filter]').forEach(b=>b.addEventListener('click',()=>{moduleFilter=b.dataset.moduleFilter;allModules=false;$$('[data-module-filter]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));renderModules();}));$('#modules-more').addEventListener('click',()=>{allModules=!allModules;renderModules();if(!allModules)$('#catalog').scrollIntoView({behavior:'auto'});});renderModules();}
  if($('#guide-search')){const update=()=>{let count=0;const q=normalize($('#guide-search').value);$$('[data-guide-text]').forEach(g=>{g.hidden=!normalize(g.dataset.guideText).includes(q);if(!g.hidden)count++;});$('#guide-counter').textContent=`Знайдено ${count} із ${(data.guides||[]).length} інструкцій`;$('#guide-empty').hidden=count>0;};$('#guide-search').addEventListener('input',update);update();}
  // Explicitly local checklist. No user or game identifier is stored.
  const checks=$$('[data-start-check]');const storageKey='cyberpw-site-start-v1';
  if(checks.length){let saved={},storageWorks=true;try{saved=JSON.parse(localStorage.getItem(storageKey)||'{}');if(!saved||typeof saved!=='object')saved={};}catch{storageWorks=false;}
    checks.forEach(c=>c.checked=saved[c.dataset.startCheck]===true);
    const progress=()=>{$('#start-progress').textContent=`${checks.filter(c=>c.checked).length} із ${checks.length} кроків`;};
    const save=()=>{const state=Object.fromEntries(checks.map(c=>[c.dataset.startCheck,c.checked]));try{localStorage.setItem(storageKey,JSON.stringify(state));}catch{storageWorks=false;$('.start-checklist p').textContent='Збереження недоступне. Позначки діють до перезавантаження цієї сторінки.';}progress();};
    checks.forEach(c=>c.addEventListener('change',save));$('#reset-checklist').addEventListener('click',()=>{checks.forEach(c=>c.checked=false);save();});progress();
    if(!storageWorks)$('.start-checklist p').textContent='Збереження недоступне. Позначки діють до перезавантаження цієї сторінки.';
  }
  $('#copy-bug')?.addEventListener('click',async()=>{const t=$('#bug-template');const ok=await copyText(t.value);$('#bug-copy-status').textContent=ok?'Скопійовано. Відправ повідомлення автору самостійно.':'Виділи текст і скопіюй його вручну.';if(!ok){t.focus();t.select();}});
  // Standalone archive/story pages do not load the landing's app.js.
  if(document.body.dataset.page!=='landing'){
    const menu=$('#menu-toggle'),nav=$('#nav-links');
    if(menu&&nav){const close=()=>{nav.classList.remove('open');menu.setAttribute('aria-expanded','false');};menu.addEventListener('click',()=>{const v=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(v));});$$('a',nav).forEach(a=>a.addEventListener('click',close));document.addEventListener('keydown',e=>{if(e.key==='Escape')close();});document.addEventListener('click',e=>{if(e.target instanceof Element&&!e.target.closest('.site-header'))close();});}
    $('#share-story')?.addEventListener('click',async()=>{if(!/^https?:$/.test(location.protocol)){toast('Це локальна сторінка. Публічне посилання буде після розміщення.');return;}toast(await copyText(location.href)?'Посилання скопійовано.':'Скопіюй адресу сторінки вручну.');});
    const bar=$('.reader-progress');if(bar){const update=()=>{const total=document.documentElement.scrollHeight-innerHeight;bar.style.width=(total>0?Math.min(100,scrollY/total*100):0)+'%';};addEventListener('scroll',update,{passive:true});update();}
  }
})();
