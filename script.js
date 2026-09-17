/* ==================== 康养云·智慧康复互联平台 · 公共交互 ==================== */
(() => {
  'use strict';

  const kPhonePattern = /^1[3-9]\d{9}$/;
  const kToastDuration = 2600;
  const kNavBreakpoint = 900;
  const kReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const toastEl = document.getElementById('toast');
  const navEl = document.getElementById('mainNav');
  const navToggleEl = document.getElementById('navToggle');
  const formEl = document.getElementById('bookingForm');
  const successEl = document.getElementById('formSuccess');
  const submitBtn = document.getElementById('bkSubmit');
  const resetBtn = document.getElementById('bkReset');
  const nameInput = document.getElementById('bkName');
  const phoneInput = document.getElementById('bkPhone');
  const serviceSelect = document.getElementById('bkService');
  const loginModal = document.getElementById('loginModal');
  const loginPanel = document.getElementById('loginFormPanel');
  const loginSuccessEl = document.getElementById('loginSuccess');
  const loginForm = document.getElementById('loginForm');
  const loginAccount = document.getElementById('loginAccount');
  const loginPassword = document.getElementById('loginPassword');
  const loginSubmit = document.getElementById('loginSubmit');
  const loginModalTitle = document.getElementById('loginModalTitle');
  const loginModalSub = document.getElementById('loginModalSub');
  const loginAccountLabel = document.getElementById('loginAccountLabel');
  const loginSuccessDesc = document.getElementById('loginSuccessDesc');

  /** 两种登录模式的文案配置 */
  const kLoginModes = {
    user: {
      title: '用户登录',
      sub: '登录后可查看您的康复记录与预约进度',
      accountLabel: '手机号',
      accountPlaceholder: '请输入手机号',
      successDesc: '欢迎回来，正在为您进入个人中心…',
    },
    admin: {
      title: '管理员登录',
      sub: '管理员登录后可管理服务项目与预约订单',
      accountLabel: '管理员账号',
      accountPlaceholder: '请输入管理员账号',
      successDesc: '欢迎回来，正在为您进入管理后台…',
    },
  };

  let toastTimer = 0;
  let loginMode = 'user';
  let lastLoginTrigger = null;
  let loginCloseTimer = 0;

  /** 底部轻提示：显示一条消息并在片刻后自动消失 */
  function showToast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add('is-show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-show'), kToastDuration);
  }

  /** 吸顶导航：页面滚动后加深背景与投影 */
  function initStickyHeader() {
    const header = document.querySelector('.site-header');
    if (!header) return;
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /** 收起移动端菜单 */
  function closeMobileNav() {
    if (!navEl || !navToggleEl) return;
    navEl.classList.remove('is-open');
    navToggleEl.setAttribute('aria-expanded', 'false');
    navToggleEl.setAttribute('aria-label', '打开菜单');
  }

  /** 移动端汉堡菜单：开合、点击链接后收起、放大到桌面宽度时复位 */
  function initMobileNav() {
    if (!navEl || !navToggleEl) return;

    navToggleEl.addEventListener('click', () => {
      const isOpen = navEl.classList.toggle('is-open');
      navToggleEl.setAttribute('aria-expanded', String(isOpen));
      navToggleEl.setAttribute('aria-label', isOpen ? '关闭菜单' : '打开菜单');
    });

    navEl.addEventListener('click', (event) => {
      if (event.target.closest('a')) closeMobileNav();
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > kNavBreakpoint) closeMobileNav();
    });
  }

  /** 修复回顶：sticky 头部作为锚点时浏览器无法滚到顶部，改由脚本直接滚动 */
  function initBackToTop() {
    document.querySelectorAll('a[href="#top"]').forEach((link) => {
      link.addEventListener('click', (event) => {
        event.preventDefault();
        window.scrollTo({ top: 0, behavior: kReducedMotion ? 'auto' : 'smooth' });
      });
    });
  }

  /** 拦截占位链接（href="#"），避免点击后页面跳回顶部 */
  function initPlaceholderLinks() {
    document.querySelectorAll('a[href="#"]').forEach((link) => {
      link.addEventListener('click', (event) => {
        event.preventDefault();
        showToast('演示页面：该链接暂未接入目标页面');
      });
    });
  }

  /** 播放单个元素的浮入动画，结束后移除占位属性 */
  function playReveal(element) {
    const delay = Number(element.dataset.revealIndex || 0) * 90;
    const animation = element.animate(
      [
        { opacity: 0, transform: 'translateY(26px)' },
        { opacity: 1, transform: 'translateY(0)' },
      ],
      { duration: 680, delay, easing: 'cubic-bezier(.22, .61, .36, 1)', fill: 'backwards' }
    );
    const cleanup = () => element.removeAttribute('data-reveal');
    animation.onfinish = cleanup;
    animation.oncancel = cleanup;
  }

  /** 滚动渐入：元素进入视口后浮入，同一容器内的卡片依次错峰 */
  function initReveal() {
    const items = [...document.querySelectorAll('[data-reveal]')];
    if (!items.length) return;

    if (kReducedMotion) {
      items.forEach((item) => item.removeAttribute('data-reveal'));
      return;
    }

    items.forEach((item) => {
      const siblings = [...item.parentElement.querySelectorAll(':scope > [data-reveal]')];
      item.dataset.revealIndex = String(Math.min(siblings.indexOf(item), 5));
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        playReveal(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0, rootMargin: '0px 0px -36px 0px' });

    items.forEach((item) => observer.observe(item));
  }

  /** 重播成功对勾的描边动画（元素隐藏期间 CSS 动画已提前跑完，显示时需重播） */
  function playSuccessAnimation(container) {
    container.querySelectorAll('.success-ring, .success-check').forEach((el) => {
      el.style.animation = 'none';
      el.getBoundingClientRect();
      el.style.animation = '';
    });
  }

  /** 打开登录弹窗：按模式切换文案并重置表单 */
  function openLoginModal(mode, trigger) {
    loginMode = mode;
    lastLoginTrigger = trigger;
    const config = kLoginModes[mode];
    loginModalTitle.textContent = config.title;
    loginModalSub.textContent = config.sub;
    loginAccountLabel.textContent = config.accountLabel;
    loginAccount.placeholder = config.accountPlaceholder;
    loginSuccessDesc.textContent = config.successDesc;

    resetLoginForm();
    closeMobileNav();
    loginModal.hidden = false;
    document.body.classList.add('no-scroll');
    loginAccount.focus();
  }

  /** 关闭登录弹窗并复位状态 */
  function closeLoginModal() {
    loginModal.hidden = true;
    document.body.classList.remove('no-scroll');
    clearTimeout(loginCloseTimer);
    if (lastLoginTrigger) lastLoginTrigger.focus({ preventScroll: true });
  }

  /** 登录表单复位到初始填写状态 */
  function resetLoginForm() {
    clearTimeout(loginCloseTimer);
    loginForm.reset();
    [loginAccount, loginPassword].forEach((input) => setFieldState(input, ''));
    loginSubmit.disabled = false;
    loginSubmit.textContent = '登 录';
    loginPanel.hidden = false;
    loginSuccessEl.hidden = true;
  }

  /** 登录账号校验：用户模式要求手机号格式，管理员模式仅要求非空 */
  function getLoginAccountError() {
    const value = loginAccount.value.trim();
    if (!value) return loginMode === 'user' ? '请输入手机号' : '请输入管理员账号';
    if (loginMode === 'user' && !kPhonePattern.test(value)) return '请输入正确的 11 位手机号码';
    return '';
  }

  /** 登录密码校验：非空且不少于 6 位 */
  function getLoginPasswordError() {
    const value = loginPassword.value;
    if (!value) return '请输入密码';
    if (value.length < 6) return '密码至少 6 位';
    return '';
  }

  /** 提交登录：校验通过后象征性成功，随后自动关闭弹窗 */
  async function handleLoginSubmit(event) {
    event.preventDefault();
    setFieldState(loginAccount, getLoginAccountError());
    setFieldState(loginPassword, getLoginPasswordError());
    const firstInvalid = [loginAccount, loginPassword].find((input) => input.closest('.field').classList.contains('has-error'));
    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    loginSubmit.disabled = true;
    loginSubmit.textContent = '登录中…';
    await new Promise((resolve) => setTimeout(resolve, 800));

    loginPanel.hidden = true;
    loginSuccessEl.hidden = false;
    playSuccessAnimation(loginSuccessEl);
    loginCloseTimer = setTimeout(closeLoginModal, 2000);
  }

  /** 初始化登录弹窗：打开、关闭（X/遮罩/Esc）与表单校验 */
  function initLoginModal() {
    if (!loginModal) return;

    document.querySelectorAll('[data-login]').forEach((button) => {
      button.addEventListener('click', () => openLoginModal(button.dataset.login, button));
    });

    loginModal.querySelectorAll('[data-close-modal]').forEach((el) => {
      el.addEventListener('click', closeLoginModal);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !loginModal.hidden) closeLoginModal();
    });

    loginForm.addEventListener('submit', handleLoginSubmit);
    [loginAccount, loginPassword].forEach((input) => {
      input.addEventListener('blur', () => {
        setFieldState(input, input === loginAccount ? getLoginAccountError() : getLoginPasswordError());
      });
      input.addEventListener('input', () => setFieldState(input, ''));
    });
  }

  /** 按字段规则返回错误信息，空串表示校验通过 */
  function getFieldError(input) {
    const value = input.value.trim();
    if (input === nameInput) {
      if (!value) return '请输入您的姓名';
      if (value.length < 2) return '姓名至少 2 个字';
      return '';
    }
    if (input === phoneInput) {
      if (!value) return '请输入联系电话';
      if (!kPhonePattern.test(value)) return '请输入正确的 11 位手机号码';
      return '';
    }
    if (input === serviceSelect) {
      if (!value) return '请选择服务项目';
      return '';
    }
    return '';
  }

  /** 更新字段的错误状态与提示文字 */
  function setFieldState(input, message) {
    const field = input.closest('.field');
    if (!field) return;
    field.classList.toggle('has-error', Boolean(message));
    const errorEl = field.querySelector('.field-error');
    if (errorEl) errorEl.textContent = message;
  }

  /** 从服务页跳转而来时（URL 携带 service 参数）自动预选对应服务项目 */
  function applyServiceFromUrl() {
    const service = new URLSearchParams(window.location.search).get('service');
    if (!service) return;
    const matched = [...serviceSelect.options].find((option) => option.value === service);
    if (matched) serviceSelect.value = service;
  }

  /** 提交预约：整体校验 → 调用提交接口 → 切换到成功态 */
  async function handleSubmit(event) {
    event.preventDefault();
    const inputs = [nameInput, phoneInput, serviceSelect];
    inputs.forEach((input) => setFieldState(input, getFieldError(input)));

    const firstInvalid = inputs.find((input) => input.closest('.field').classList.contains('has-error'));
    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = '提交中…';
    try {
      await submitBookingToServer({
        name: nameInput.value.trim(),
        phone: phoneInput.value.trim(),
        service: serviceSelect.value,
      });
      formEl.hidden = true;
      successEl.hidden = false;
      playSuccessAnimation(successEl);
    } catch (error) {
      showToast('提交失败，请稍后重试，或直接致电客服热线');
      submitBtn.disabled = false;
      submitBtn.textContent = '提交预约';
    }
  }

  /** 成功后再次预约：重置表单并回到填写状态 */
  function resetForm() {
    formEl.reset();
    successEl.hidden = true;
    formEl.hidden = false;
    submitBtn.disabled = false;
    submitBtn.textContent = '提交预约';
    nameInput.focus();
  }

  /**
   * 预约数据提交接口（预留后端接入点）
   * 当前为纯前端演示：短暂延迟后直接成功。
   * 接入后端时替换为真实请求，例如：
   *   const res = await fetch('/api/booking', {
   *     method: 'POST',
   *     headers: { 'Content-Type': 'application/json' },
   *     body: JSON.stringify(payload),
   *   });
   *   if (!res.ok) throw new Error('提交失败');
   */
  function submitBookingToServer(payload) {
    return new Promise((resolve) => setTimeout(resolve, 700));
  }

  /** 初始化预约表单：实时校验、提交、重置与 URL 预选（仅首页存在） */
  function initBookingForm() {
    if (!formEl) return;
    [nameInput, phoneInput, serviceSelect].forEach((input) => {
      input.addEventListener('blur', () => setFieldState(input, getFieldError(input)));
      input.addEventListener('input', () => setFieldState(input, ''));
    });
    formEl.addEventListener('submit', handleSubmit);
    resetBtn.addEventListener('click', resetForm);
    applyServiceFromUrl();
  }

  initStickyHeader();
  initBackToTop();
  initMobileNav();
  initPlaceholderLinks();
  initLoginModal();
  initReveal();
  initBookingForm();
})();
