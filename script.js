/* 康养云 · progressive enhancement for a static multi-page site. */
(() => {
  'use strict';
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const header = $('.site-header');
  const nav = $('#mainNav');
  const toggle = $('#navToggle');
  const modal = $('#loginModal');
  let lastTrigger = null;
  let backgroundNodes = [];

  function closeNav(returnFocus = false) {
    nav?.classList.remove('is-open');
    toggle?.setAttribute('aria-expanded', 'false');
    toggle?.setAttribute('aria-label', '打开菜单');
    if (returnFocus) toggle?.focus();
  }
  toggle?.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? '关闭菜单' : '打开菜单');
  });
  nav?.addEventListener('click', event => {
    if (event.target.closest('a')) closeNav();
  });
  document.addEventListener('click', event => {
    if (!header?.contains(event.target)) closeNav();
  });
  window.matchMedia('(min-width: 901px)').addEventListener('change', event => {
    if (event.matches) closeNav();
  });

  function openModal(mode, trigger) {
    if (!modal) return;
    lastTrigger = trigger;
    $('#loginModalTitle').textContent = mode === 'admin' ? '机构合作入口' : '用户服务入口';
    $('#loginModalSub').textContent = mode === 'admin'
      ? '机构服务正在筹备中。欢迎先了解我们的康复服务场景与合作方向。'
      : '账户服务尚未开放。您可以先浏览服务内容，或体验预约填写流程。';
    closeNav();
    modal.hidden = false;
    document.body.classList.add('no-scroll');
    backgroundNodes = [...document.body.children].filter(node => node !== modal && !node.inert);
    backgroundNodes.forEach(node => { node.inert = true; });
    $('[data-close-modal]', $('.modal-card', modal)).focus();
  }
  function closeModal() {
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    document.body.classList.remove('no-scroll');
    backgroundNodes.forEach(node => { node.inert = false; });
    // The mobile institution trigger becomes hidden when its menu closes.
    const target = lastTrigger?.getClientRects().length && getComputedStyle(lastTrigger).visibility !== 'hidden' ? lastTrigger : toggle;
    target?.focus({ preventScroll: true });
  }
  $$('[data-login]').forEach(button => button.addEventListener('click', () => openModal(button.dataset.login, button)));
  $$('[data-close-modal]').forEach(button => button.addEventListener('click', closeModal));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      if (modal && !modal.hidden) closeModal();
      else if (nav?.classList.contains('is-open')) closeNav(true);
    }
    if (event.key !== 'Tab' || !modal || modal.hidden) return;
    const items = $$('a[href], button:not([disabled])', modal);
    const first = items[0], last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });

  const backTop = $('.back-top');
  const home = Boolean($('.hero'));
  const navigationLinks = home ? $$('#mainNav > a') : $$('.detail-nav a');
  const targets = navigationLinks.map(link => ({ link, target: $(link.hash) })).filter(item => item.target);
  if (!home) {
    const servicesLink = $('#mainNav a[href="index.html#services"]');
    servicesLink?.setAttribute('aria-current', 'page');
  }
  let scrollPending = false;
  function updateScroll() {
    header?.classList.toggle('is-scrolled', window.scrollY > 12);
    if (backTop) backTop.hidden = window.scrollY < 500;
    const offset = (header?.offsetHeight || 0) + ($('.detail-nav')?.offsetHeight || 0) + 80;
    let active = targets[0];
    for (const item of targets) {
      if (item.target.getBoundingClientRect().top <= offset) active = item;
    }
    for (const item of targets) {
      if (item === active) item.link.setAttribute('aria-current', 'location');
      else item.link.removeAttribute('aria-current');
    }
    scrollPending = false;
  }
  window.addEventListener('scroll', () => {
    if (!scrollPending) { scrollPending = true; requestAnimationFrame(updateScroll); }
  }, { passive: true });
  window.addEventListener('resize', updateScroll);
  window.addEventListener('pageshow', updateScroll);
  updateScroll();
  $$('a[href="#top"]').forEach(link => link.addEventListener('click', event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    closeNav();
    window.scrollTo({ top: 0, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
    if (link === backTop) $('.brand')?.focus({ preventScroll: true });
  }));

  // Ordinary .html links retain native history, refresh, and modified-click behavior.
  // Cross-document View Transitions are CSS-only, and unsupported browsers navigate normally.
  const revealItems = $$('[data-reveal]');
  if ('IntersectionObserver' in window && !reduceMotion.matches) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px 12px 0px', threshold: 0 });
    revealItems.forEach(item => {
      // Keep content around the initial viewport, including hash targets, immediately visible.
      const rect = item.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) return;
      item.classList.add('reveal-ready');
      const siblings = [...item.parentElement.children];
      item.style.setProperty('--reveal-delay', Math.min(siblings.indexOf(item) % 4, 3) * 55 + 'ms');
      observer.observe(item);
    });
    reduceMotion.addEventListener('change', event => {
      if (event.matches) {
        revealItems.forEach(item => item.classList.add('is-visible'));
        observer.disconnect();
      }
    });
  }

  const filterGroup = $('.service-filters');
  if (filterGroup) {
    filterGroup.hidden = false;
    const cards = $$('.service-card');
    filterGroup.addEventListener('click', event => {
      const button = event.target.closest('[data-filter]');
      if (!button) return;
      $$('[data-filter]', filterGroup).forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      let count = 0;
      cards.forEach(card => {
        card.hidden = button.dataset.filter !== 'all' && card.dataset.category !== button.dataset.filter;
        if (!card.hidden) { count++; card.classList.add('is-visible'); }
      });
      $('#serviceCount').textContent = '共 ' + count + ' 项服务';
    });
  }

  const form = $('#bookingForm');
  if (form) {
    $('#bkSubmit').disabled = false;
    const name = $('#bkName'), phone = $('#bkPhone'), service = $('#bkService');
    const success = $('#formSuccess');
    const inputs = [name, phone, service];
    const requested = new URLSearchParams(window.location.search).get('service');
    if ([...service.options].some(option => option.value === requested)) service.value = requested;
    const validate = input => {
      const value = input.value.trim();
      if (input === name) return value.length < 2 ? '请输入至少 2 个字的姓名（请使用虚构信息）' : '';
      if (input === phone) return /^1[3-9]\d{9}$/.test(value) ? '' : '请输入正确的 11 位手机号码';
      return value ? '' : '请选择服务项目';
    };
    function showError(input, message) {
      const field = input.closest('.field'), error = $('.field-error', field);
      field.classList.toggle('has-error', Boolean(message));
      input.setAttribute('aria-invalid', String(Boolean(message)));
      input.setAttribute('aria-describedby', error.id);
      error.textContent = message;
    }
    inputs.forEach(input => {
      input.required = true;
      input.addEventListener('blur', () => showError(input, validate(input)));
      input.addEventListener('input', () => showError(input, ''));
      input.addEventListener('change', () => showError(input, ''));
    });
    form.addEventListener('submit', event => {
      event.preventDefault();
      inputs.forEach(input => showError(input, validate(input)));
      const invalid = inputs.find(input => validate(input));
      if (invalid) { invalid.focus(); return; }
      let summary = $('.booking-summary', success);
      if (!summary) { summary = document.createElement('p'); summary.className = 'booking-summary'; $('.success-desc', success).after(summary); }
      // Never use HTML interpolation for values entered by a visitor.
      summary.textContent = name.value.trim() + ' · ' + phone.value.slice(0, 3) + ' **** ' + phone.value.slice(-4) + ' · ' + service.value;
      form.hidden = true;
      success.hidden = false;
      const check = $('.success-check', success);
      if (!reduceMotion.matches && check?.animate) check.animate([{ strokeDashoffset: 65 }, { strokeDashoffset: 0 }], { duration: 450, fill: 'forwards' });
      $('h3', success).focus({ preventScroll: true });
    });
    $('#bkReset').addEventListener('click', () => {
      success.hidden = true;
      form.hidden = false;
      name.focus({ preventScroll: true });
    });
  }
})();
