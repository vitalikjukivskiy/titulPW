/* CyberPW Assistant landing page. No libraries, tracking SDKs or secrets. */
(() => {
  'use strict';
  const cfg = window.CYBERPW_SITE_CONFIG || {};
  const videos = Array.isArray(window.CYBERPW_VIDEOS) ? window.CYBERPW_VIDEOS : [];
  const $ = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) => Array.from(parent.querySelectorAll(selector));
  const safeUrl = (value) => {
    if (typeof value !== 'string' || !value.trim()) return null;
    try { const url = new URL(value); return url.protocol === 'https:' ? url.href : null; }
    catch (_) { return null; }
  };
  const validId = (id) => typeof id === 'string' && /^[A-Za-z0-9_-]{11}$/.test(id);
  const icon = (name) => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'icon'); svg.setAttribute('aria-hidden', 'true');
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', `#i-${name}`); svg.append(use); return svg;
  };
  const node = (tag, className = '', text = null) => {
    const result = document.createElement(tag);
    if (className) result.className = className;
    if (text !== null) result.textContent = text;
    return result;
  };
  const track = (event, properties = {}) => {
    // Off by default. This only emits an in-memory event, never a network request.
    // A production analytics adapter and consent management are a separate integration.
    if (cfg.analyticsEnabled !== true) return;
    const detail = Object.freeze({ event, ...properties });
    window.dispatchEvent(new CustomEvent('cyberpw:analytics', { detail }));
  };
  const duration = (seconds) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  const readableDate = (date) => {
    const [year, month, day] = date.split('-'); return `${day}.${month}.${year}`;
  };
  let toastTimer;
  function toast(message) {
    const element = $('#toast'); element.textContent = message;
    element.classList.add('visible'); clearTimeout(toastTimer);
    toastTimer = setTimeout(() => element.classList.remove('visible'), 3500);
  }
  function bindImage(img) {
    if (!img || img.dataset.bound === 'true') return;
    img.dataset.bound = 'true';
    const loaded = () => {
      if (img.naturalWidth > 0) { img.classList.add('loaded'); img.style.visibility = 'visible'; }
    };
    img.addEventListener('load', loaded);
    img.addEventListener('error', () => {
      if (img.dataset.backup && !img.dataset.backupUsed) {
        img.dataset.backupUsed = 'true'; img.src = img.dataset.backup; return;
      }
      img.classList.remove('loaded'); img.style.visibility = 'hidden';
      // The purpose-built fallback remains readable if the source is inaccessible.
      const fallback = img.parentElement.querySelector('.screen-fallback span');
      if (fallback) fallback.textContent = 'Скриншот доступний у форумному гайді. Переглянь відео або відкрий інструкцію за посиланням поруч.';
    });
    if (img.complete && img.naturalWidth > 0) loaded();
    else if (img.complete && !img.naturalWidth && img.getAttribute('src')) {
      // Handle images that failed before this deferred script started.
      img.dispatchEvent(new Event('error'));
    }
  }
  $$('img.remote-photo').forEach(bindImage);

  // Use only owner-provided HTTPS destinations. A click is never treated as a sale.
  const downloadUrl = safeUrl(cfg.downloadUrl);
  if (downloadUrl) $$('[data-download]').forEach(link => {
    link.href = downloadUrl; link.target = '_blank'; link.rel = 'noopener noreferrer';
  });
  const vip = cfg.vip || {};
  const checkoutUrl = safeUrl(vip.checkoutUrl);
  const contactUrl = safeUrl(vip.contactUrl);
  if (contactUrl) $('#vip-contact').href = contactUrl;
  if (checkoutUrl) {
    $$('[data-vip]').forEach(link => {
      link.href = checkoutUrl; link.target = '_blank'; link.rel = 'noopener noreferrer';
    });
    $$('[data-vip-label]').forEach(label => { label.textContent = 'Придбати VIP'; });
  }
  if (typeof vip.price === 'number' && Number.isFinite(vip.price) && vip.price > 0) {
    const value = new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 2 }).format(vip.price);
    $$('[data-vip-price]').forEach(element => {
      element.textContent = `${value} ${String(vip.currency || 'грн')}${vip.period ? ' / ' + String(vip.period) : ''}`;
    });
  }

  // Selectable feature demonstrations with accessible keyboard navigation.
  const forum = 'https://forum.cyberpw.fun/index.php?threads/';
  const features = {
    titles: {
      kicker: 'TITULHELPER', title: 'Не згадуй, де зупинився.\nПродовжуй свій ланцюжок.',
      description: 'Синхронізуй отримані титули з персонажем, знайди наступний етап і передай координати в гру. Без ручного калібрування.',
      points: ['Прогрес і титульні ланцюжки', 'Синхронізація з персонажем', 'Введення координат у CyberPW'],
      video: 'tf3h1I3RJ1E', watch: 'Дивитися за 38 секунд',
      guide: forum + 'trophy-titulhelper-gajd-po-roboti-z-titulami.310/',
      image: 'https://forum.cyberpw.fun/index.php?attachments/1787830761247-webp.728/',
      label: 'CyberPW Assistant · TitulHelper', fallback: 'Синхронізація та введення', icon: 'compass',
    },
    craft: {
      kicker: 'ПРЕДМЕТИ / КРАФТ', title: 'Крафтити самому?\nЧи купити готове?',
      description: 'Знайди предмет і рецепт, перевір необхідні компоненти та їхні ціни в комісійці. Порівняй варіанти до того, як витратиш ресурси.',
      points: ['Рецепт, компоненти та потрібна піч', 'Ціни компонентів і готового предмета', 'Розрахунок собівартості'],
      video: '75gX4-s2VjU', watch: 'Дивитися за 35 секунд',
      guide: forum + 'hammer-and-pick-kraft-cyberpw-assistant.316/',
      image: 'https://forum.cyberpw.fun/index.php?attachments/1787830827171-webp.734/',
      label: 'CyberPW Assistant · Крафт', fallback: 'Рецепт. Компоненти. Порівняння.', icon: 'coins',
    },
    combat: {
      kicker: 'MACRO STUDIO / AUTOSWAP', title: 'Твій персонаж.\nТвоя послідовність дій.',
      description: 'Збирай макрос із навичок, клавіш, кліків і пауз. Обери потрібне вікно гри та признач гарячу клавішу, зручну саме тобі.',
      points: ['Конструктор сценаріїв і гарячі клавіші', 'Дії для конкретного клієнта гри', 'AutoSwap і бібліотека Macro Market'],
      video: 'x0ngM2Dsg7o', watch: 'Дивитися за 21 секунду',
      guide: forum + 'gear-makrosi-cyberpw-assistant.318/',
      image: 'https://forum.cyberpw.fun/index.php?attachments/1787830840938-webp.735/',
      label: 'CyberPW Assistant · Макроси', fallback: 'Навички. Пауза. Наступна дія.', icon: 'bolt',
    },
  };
  function changeFeature(key, moveFocus = false) {
    const feature = features[key]; if (!feature) return;
    $$('.feature-tab').forEach(button => {
      const selected = button.dataset.tab === key;
      button.setAttribute('aria-selected', String(selected)); button.tabIndex = selected ? 0 : -1;
      if (selected && moveFocus) button.focus();
    });
    $('#feature-panel').setAttribute('aria-labelledby', `tab-${key}`);
    $('#feature-kicker').textContent = feature.kicker;
    const title = $('#feature-title'); title.replaceChildren();
    feature.title.split('\n').forEach((line, index) => { if (index) title.append(node('br')); title.append(document.createTextNode(line)); });
    $('#feature-description').textContent = feature.description;
    $('#feature-points').replaceChildren(...feature.points.map(text => {
      const li = node('li'); li.append(icon('check'), document.createTextNode(text)); return li;
    }));
    const watch = $('#feature-watch'); watch.dataset.video = feature.video;
    watch.href = `https://www.youtube.com/shorts/${feature.video}`;
    $('span', watch).textContent = feature.watch;
    $('#feature-guide').href = feature.guide;
    const image = $('#feature-image'); image.classList.remove('loaded'); image.style.visibility = 'visible';
    image.alt = `${feature.label} у форумному гайді автора`; image.src = feature.image;
    $('#screen-label').textContent = feature.label;
    const fallback = $('.screen-fallback'); $('svg', fallback).replaceWith(icon(feature.icon));
    $('#screen-fallback-title').textContent = feature.fallback;
    track('feature_view', { feature: key });
  }
  $$('.feature-tab').forEach((button, index, all) => {
    button.addEventListener('click', () => changeFeature(button.dataset.tab));
    button.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % all.length;
      if (event.key === 'ArrowLeft') next = (index - 1 + all.length) % all.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = all.length - 1;
      if (next !== undefined) { event.preventDefault(); changeFeature(all[next].dataset.tab, true); }
    });
  });

  // Author's genuine video IDs and original titles; the cards have editorial headings.
  let filter = 'all'; let expanded = false;
  const filteredVideos = () => videos.filter(video => filter === 'all' || video.category === filter);
  function makeVideoCard(video) {
    const article = node('article', 'short-card');
    const link = node('a', 'short-poster'); link.href = `https://www.youtube.com/shorts/${video.id}`;
    link.dataset.video = video.id; link.dataset.placement = 'shorts';
    link.setAttribute('aria-label', `${video.title}. Відео ${duration(video.seconds)}. ${video.status === 'preview' ? 'Анонс.' : ''}`);
    link.title = video.originalTitle;
    const orbit = node('span', 'short-orbit'); orbit.setAttribute('aria-hidden', 'true'); orbit.append(icon(video.icon));
    const image = node('img', 'thumb'); image.alt = ''; image.loading = 'lazy'; image.decoding = 'async';
    image.src = `https://i.ytimg.com/vi/${video.id}/maxresdefault.jpg`;
    image.dataset.backup = `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`;
    const shade = node('span', 'short-shade');
    const top = node('span', 'short-top');
    const type = node('span', `short-type ${video.status === 'vip' ? 'vip' : video.status === 'preview' ? 'preview' : ''}`);
    type.append(icon(video.status === 'vip' ? 'crown' : video.status === 'preview' ? 'spark' : 'youtube'));
    type.append(document.createTextNode(video.status === 'vip' ? 'VIP' : video.status === 'preview' ? 'Анонс' : 'Shorts'));
    top.append(type, node('span', 'short-duration', duration(video.seconds)));
    const bottom = node('span', 'short-bottom'); const play = node('span', 'small-play'); play.append(icon('play'));
    bottom.append(play, node('small', '', video.module), node('strong', '', video.title));
    link.append(orbit, image, shade, top, bottom);
    article.append(link, node('p', 'short-description', video.description));
    const date = node('time', 'short-date', `${readableDate(video.date)} · ${video.seconds} с`); date.dateTime = video.date;
    article.append(date); bindImage(image); return article;
  }
  function renderVideos() {
    const selected = filteredVideos(); const visible = expanded ? selected : selected.slice(0, 8);
    const grid = $('#shorts-grid'); grid.removeAttribute('aria-live');
    grid.replaceChildren(...visible.map(makeVideoCard));
    const more = $('#show-more'); more.hidden = selected.length <= 8;
    more.replaceChildren(document.createTextNode(expanded ? 'Згорнути добірку' : `Показати ще ${selected.length - 8} відео`), icon(expanded ? 'chevron' : 'plus'));
    $('#video-counter').textContent = `Показано ${visible.length} із ${selected.length} відео`;
  }
  $('#video-counter').setAttribute('role', 'status'); $('#video-counter').setAttribute('aria-live', 'polite');
  $$('.filter-btn').forEach(button => {
    button.addEventListener('click', () => {
      filter = button.dataset.filter; expanded = false;
      $$('.filter-btn').forEach(other => other.setAttribute('aria-pressed', String(other === button)));
      renderVideos(); track('shorts_filter', { category: filter });
    });
  });
  $('#show-more').addEventListener('click', () => {
    expanded = !expanded; renderVideos();
    if (!expanded) $('#videos').scrollIntoView({ behavior: 'smooth' });
  });
  renderVideos();

  // Lazy, user-initiated YouTube embed. No iframe or playback before a click.
  const overview = { id: 'dyzDBIT_HRo', title: 'Повний огляд CyberPW Assistant', originalTitle: 'Сyber.pw Асистент (повний огляд)', long: true };
  let currentVideo = null; let videoQueue = []; let lastTrigger = null;
  const videoDialog = $('#video-modal'); const vipDialog = $('#vip-modal');
  const canUseDialog = typeof videoDialog.showModal === 'function';
  function cleanupDialog(dialog) {
    if (dialog === videoDialog) { $('#player-wrap').replaceChildren(); currentVideo = null; }
    if (!$$('dialog[open]').length) document.body.classList.remove('modal-open');
  }
  function openDialog(dialog, trigger) {
    lastTrigger = trigger || document.activeElement;
    if (!dialog.open) dialog.showModal();
    document.body.classList.add('modal-open');
  }
  function closeDialog(dialog) { if (dialog.open) dialog.close(); }
  [videoDialog, vipDialog].forEach(dialog => {
    dialog.addEventListener('close', () => {
      cleanupDialog(dialog);
      if (lastTrigger && document.contains(lastTrigger) && typeof lastTrigger.focus === 'function') lastTrigger.focus({ preventScroll: true });
    });
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeDialog(dialog);
    });
  });
  function openVideo(id, trigger, keepQueue = false) {
    if (!validId(id)) return false;
    const video = id === overview.id ? overview : videos.find(item => item.id === id);
    if (!video || !canUseDialog) return false;
    if (!keepQueue) {
      const source = filteredVideos();
      videoQueue = video.long ? [] : (source.some(item => item.id === id) ? source : videos);
    }
    currentVideo = video;
    videoDialog.classList.toggle('is-short', !video.long);
    $('#video-title').textContent = video.title;
    $('#video-original').textContent = `Назва на каналі: ${video.originalTitle}${video.status === 'preview' ? ' · Попередня демонстрація / анонс' : ''}`;
    const directUrl = `https://www.youtube.com/${video.long ? 'watch?v=' : 'shorts/'}${id}`;
    $('#video-youtube').href = directUrl;
    const player = $('#player-wrap'); player.replaceChildren();
    const local = location.protocol === 'file:' || location.origin === 'null';
    $('#video-local-note').hidden = !local;
    if (local) {
      const fallback = node('div', 'player-fallback'); fallback.append(icon('youtube'));
      const direct = node('a', 'btn gold', 'Дивитися на YouTube');
      direct.href = directUrl; direct.target = '_blank'; direct.rel = 'noopener noreferrer';
      fallback.append(direct); player.append(fallback);
    } else {
      const iframe = node('iframe');
      iframe.title = video.title; iframe.allowFullscreen = true;
      iframe.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture; fullscreen');
      iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
      iframe.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1`;
      player.append(iframe);
    }
    const index = videoQueue.findIndex(item => item.id === id);
    $('#video-prev').disabled = index <= 0;
    $('#video-next').disabled = index < 0 || index >= videoQueue.length - 1;
    openDialog(videoDialog, trigger);
    track('video_open', { video_id: id, format: video.long ? 'long' : 'short', placement: trigger?.dataset?.placement || 'player' });
    return true;
  }
  $('#video-prev').addEventListener('click', () => {
    const index = videoQueue.findIndex(video => video.id === currentVideo?.id);
    if (index > 0) openVideo(videoQueue[index - 1].id, lastTrigger, true);
  });
  $('#video-next').addEventListener('click', () => {
    const index = videoQueue.findIndex(video => video.id === currentVideo?.id);
    if (index >= 0 && index < videoQueue.length - 1) openVideo(videoQueue[index + 1].id, lastTrigger, true);
  });

  document.addEventListener('click', event => {
    if (!(event.target instanceof Element)) return;
    const close = event.target.closest('[data-close]');
    if (close) { const dialog = document.getElementById(close.dataset.close); if (dialog) closeDialog(dialog); return; }
    const video = event.target.closest('[data-video]');
    if (video && !event.ctrlKey && !event.metaKey && !event.shiftKey && event.button === 0) {
      if (openVideo(video.dataset.video, video)) event.preventDefault();
      return;
    }
    const vipLink = event.target.closest('[data-vip]');
    if (vipLink) {
      if (checkoutUrl) {
        track('checkout_click', { placement: vipLink.dataset.placement || 'unknown' });
      } else if (canUseDialog && !event.ctrlKey && !event.metaKey) {
        event.preventDefault(); openDialog(vipDialog, vipLink);
        track('vip_open', { placement: vipLink.dataset.placement || 'unknown' });
      }
      return;
    }
    const download = event.target.closest('[data-download]');
    if (download) track('download_click', { placement: download.dataset.placement || 'unknown' });
    if (event.target.closest('#vip-contact')) track('vip_contact_click');
  });
  $('#copy-vip').addEventListener('click', async () => {
    const text = $('#vip-request'); let copied = false;
    try {
      if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(text.value); copied = true; }
    } catch (_) { /* The accessible text field below remains a fallback. */ }
    if (!copied) {
      text.focus(); text.select();
      try { copied = document.execCommand('copy'); } catch (_) { copied = false; }
    }
    toast(copied ? 'Запит скопійовано. Відкрий профіль автора на форумі.' : 'Текст виділено. Скопіюй його вручну.');
    if (copied) track('vip_request_copied');
  });

  // Small-screen navigation; native anchor navigation still works without JavaScript.
  const menu = $('#menu-toggle'); const links = $('#nav-links');
  function closeMenu() { links.classList.remove('open'); menu.setAttribute('aria-expanded', 'false'); menu.setAttribute('aria-label', 'Відкрити меню'); }
  menu.addEventListener('click', () => {
    const opened = links.classList.toggle('open');
    menu.setAttribute('aria-expanded', String(opened)); menu.setAttribute('aria-label', opened ? 'Закрити меню' : 'Відкрити меню');
  });
  $$('#nav-links a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
  document.addEventListener('click', event => { if (event.target instanceof Element && !event.target.closest('.site-header')) closeMenu(); });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      $('#mobile-bar').classList.toggle('visible', !entries[0].isIntersecting);
    }, { threshold: 0 }).observe($('.hero'));
    const sectionObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        $$('#nav-links a').forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`));
      });
    }, { rootMargin: '-15% 0px -55% 0px' });
    ['features', 'catalog', 'videos', 'vip', 'news', 'roadmap', 'guides'].forEach(id => sectionObserver.observe(document.getElementById(id)));
  } else {
    window.addEventListener('scroll', () => $('#mobile-bar').classList.toggle('visible', window.scrollY > 550), { passive: true });
  }
  track('page_view');
})();
