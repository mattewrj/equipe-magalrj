// A native horizontal reel: the second group only makes the visual loop seamless.
export function initGallery(root) {
  if (!root) return () => {};
  const viewport = root.querySelector('.reel-window');
  const track = root.querySelector('.reel-track');
  if (!viewport || !track) return () => {};

  const controller = new AbortController();
  const { signal } = controller;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const pauseButton = root.querySelector('[data-gallery-pause]');
  const status = root.querySelector('[data-gallery-status]');
  const dialog = document.querySelector('#gallery-dialog');
  const dialogImage = dialog?.querySelector('img.gallery-dialog-image, .gallery-dialog-image img');
  const dialogTitle = dialog?.querySelector('#gallery-dialog-title');
  const dialogCounter = dialog?.querySelector('[data-dialog-counter]');
  let photos = [], originals = [], firstGroup, cycle = 0;
  let frame = 0, wakeTimer = 0, lastTime = 0, motionPosition = 0, inView = false;
  let hovered = false, focused = false, userPaused = motion.matches;
  let touching = false, touchPointerId = null, dragging = false, gesture = null;
  let pauseUntil = 0, suppressClickUntil = 0, disposed = false, loadFailed = false;
  let dialogIndex = 0, restoreTarget = null, previousOverflow = '';
  let savedScroll = { x: 0, y: 0 }, restoreFrame = 0;
  const on = (target, event, listener, options = {}) => target?.addEventListener(event, listener, { ...options, signal });
  const pausesForFocus = element => Boolean(element && (viewport.contains(element) || (root.contains(element) && element.closest?.('[data-gallery-prev], [data-gallery-next]'))));

  const announce = message => { if (status) status.textContent = message; };
  const paused = () => !inView || document.hidden || hovered || focused || touching || dragging || userPaused || motion.matches || dialog?.open || performance.now() < pauseUntil;
  function updatePlayback() {
    cancelAnimationFrame(frame);
    clearTimeout(wakeTimer);
    frame = 0;
    lastTime = 0;
    root.classList.toggle('gallery-is-paused', paused());
    if (pauseButton) {
      pauseButton.disabled = motion.matches || loadFailed;
      pauseButton.setAttribute('aria-pressed', String(userPaused));
      pauseButton.setAttribute('aria-label', motion.matches ? 'Animação desativada pela preferência de movimento reduzido' : (userPaused ? 'Reproduzir animação das fotos' : 'Pausar animação das fotos'));
      const label = pauseButton.querySelector('[data-gallery-pause-label]');
      const icon = pauseButton.querySelector('[data-gallery-pause-icon], span[aria-hidden="true"]');
      if (label) label.textContent = motion.matches ? 'Sem animação' : (userPaused ? 'Reproduzir' : 'Pausar');
      if (icon) icon.textContent = userPaused || motion.matches ? '▶' : 'Ⅱ';
    }
    if (disposed || !photos.length) return;
    if (!paused()) {
      motionPosition = viewport.scrollLeft;
      frame = requestAnimationFrame(tick);
    }
    else if (pauseUntil > performance.now()) wakeTimer = setTimeout(updatePlayback, pauseUntil - performance.now() + 30);
  }
  function tick(now) {
    if (disposed || paused()) { updatePlayback(); return; }
    const dt = lastTime ? Math.min(now - lastTime, 50) : 0;
    lastTime = now;
    if (cycle > 0) {
      // Accumulate fractional pixels even on browsers that round scrollLeft writes.
      motionPosition = (motionPosition + dt * .024) % cycle;
      viewport.scrollLeft = motionPosition;
    }
    frame = requestAnimationFrame(tick);
  }
  function hold(milliseconds = 1800) {
    pauseUntil = Math.max(pauseUntil, performance.now() + milliseconds);
    updatePlayback();
  }
  function measure() {
    if (!firstGroup) return;
    const groupGap = parseFloat(getComputedStyle(track).columnGap) || 0;
    cycle = firstGroup.getBoundingClientRect().width + groupGap;
  }
  function currentIndex() {
    if (!originals.length || !cycle) return 0;
    const left = viewport.scrollLeft % cycle;
    let closest = 0, distance = Infinity;
    originals.forEach((card, index) => {
      const difference = Math.abs(card.offsetLeft - firstGroup.offsetLeft - left);
      if (difference < distance) { closest = index; distance = difference; }
    });
    return closest;
  }
  function alignCard(index, smooth = true) {
    if (!originals[index]) return;
    hold(2400);
    const target = originals[index].offsetLeft - firstGroup.offsetLeft;
    viewport.scrollTo({ left: target, behavior: smooth && !motion.matches ? 'smooth' : 'instant' });
  }
  function step(direction, moveFocus = false) {
    if (!photos.length) return;
    const index = (currentIndex() + direction + photos.length) % photos.length;
    alignCard(index);
    if (moveFocus) originals[index].focus({ preventScroll: true });
    announce(`Foto ${index + 1} de ${photos.length}.`);
  }
  function makeCard(photo, index) {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = `reel-card ${photo.width < photo.height ? 'portrait' : 'landscape'}`;
    card.dataset.photoIndex = String(index);
    card.setAttribute('aria-label', `Ampliar foto ${index + 1} de ${photos.length}`);
    const picture = document.createElement('img');
    picture.src = photo.thumbnail || photo.src;
    picture.alt = photo.alt || '';
    picture.width = photo.width;
    picture.height = photo.height;
    picture.loading = 'lazy';
    picture.decoding = 'async';
    picture.draggable = false;
    if (photo.position) picture.style.objectPosition = photo.position;
    const badge = document.createElement('span');
    badge.className = 'reel-card-code';
    badge.textContent = '4479';
    badge.setAttribute('aria-hidden', 'true');
    const expand = document.createElement('span');
    expand.className = 'reel-card-expand';
    expand.textContent = '↗';
    expand.setAttribute('aria-hidden', 'true');
    const caption = document.createElement('span');
    caption.className = 'reel-card-caption';
    const number = document.createElement('span');
    number.className = 'reel-card-number';
    number.textContent = String(index + 1).padStart(2, '0');
    caption.append(number);
    card.append(picture, badge, expand, caption);
    return card;
  }

  let dialogError;
  if (dialogImage) {
    dialogError = document.createElement('p');
    dialogError.className = 'gallery-image-error';
    dialogError.hidden = true;
    dialogError.setAttribute('role', 'status');
    dialogImage.parentElement.append(dialogError);
    on(dialogImage, 'error', () => {
      dialogImage.hidden = true;
      dialogError.textContent = 'Não foi possível carregar esta foto. Experimente a próxima imagem.';
      dialogError.hidden = false;
    });
    on(dialogImage, 'load', () => { dialogImage.hidden = false; dialogError.hidden = true; });
  }
  function displayPhoto(index) {
    dialogIndex = (index + photos.length) % photos.length;
    const photo = photos[dialogIndex];
    if (!photo || !dialogImage) return;
    dialogImage.hidden = false;
    if (dialogError) dialogError.hidden = true;
    dialogImage.src = photo.src;
    dialogImage.alt = photo.alt || '';
    dialogImage.width = photo.width;
    dialogImage.height = photo.height;
    if (dialogTitle) dialogTitle.textContent = `Foto ${String(dialogIndex + 1).padStart(2, '0')}`;
    if (dialogCounter) dialogCounter.textContent = `${String(dialogIndex + 1).padStart(2, '0')} / ${String(photos.length).padStart(2, '0')}`;
  }
  function openPhoto(index) {
    if (!dialog || !dialogImage || !photos[index]) return;
    restoreTarget = originals[index];
    savedScroll = { x: window.scrollX, y: window.scrollY };
    previousOverflow = document.documentElement.style.overflow;
    displayPhoto(index);
    dialog.showModal();
    document.documentElement.style.overflow = 'hidden';
    dialog.querySelector('[data-dialog-close]')?.focus({ preventScroll: true });
    updatePlayback();
  }
  on(dialog?.querySelector('[data-dialog-close]'), 'click', () => dialog.close());
  on(dialog?.querySelector('[data-dialog-prev]'), 'click', () => displayPhoto(dialogIndex - 1));
  on(dialog?.querySelector('[data-dialog-next]'), 'click', () => displayPhoto(dialogIndex + 1));
  on(dialog, 'keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      displayPhoto(dialogIndex + (event.key === 'ArrowRight' ? 1 : -1));
    }
  });
  on(dialog, 'click', event => { if (event.target === dialog) dialog.close(); });
  on(dialog, 'close', () => {
    document.documentElement.style.overflow = previousOverflow;
    restoreTarget?.focus({ preventScroll: true });
    window.scrollTo({ left: savedScroll.x, top: savedScroll.y, behavior: 'instant' });
    restoreFrame = requestAnimationFrame(() => window.scrollTo({ left: savedScroll.x, top: savedScroll.y, behavior: 'instant' }));
    hold();
  });

  on(root.querySelector('[data-gallery-prev]'), 'click', () => step(-1));
  on(root.querySelector('[data-gallery-next]'), 'click', () => step(1));
  on(pauseButton, 'click', () => { userPaused = !userPaused; updatePlayback(); });
  on(viewport, 'pointerenter', event => { if (event.pointerType === 'mouse') { hovered = true; updatePlayback(); } });
  on(viewport, 'pointerleave', event => {
    if (event.pointerType === 'mouse') { hovered = false; resetCardEffects(); updatePlayback(); }
  });
  on(root, 'focusin', event => {
    focused = pausesForFocus(event.target);
    const card = event.target.closest('.reel-card');
    // Pointer focus must not move a card between pointerdown and pointerup.
    if (card && firstGroup?.contains(card) && !gesture && !touching) alignCard(Number(card.dataset.photoIndex), false);
    updatePlayback();
  });
  on(root, 'focusout', () => queueMicrotask(() => { focused = pausesForFocus(document.activeElement); updatePlayback(); }));
  on(viewport, 'keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const moveFocus = Boolean(event.target.closest('.reel-card'));
    if (event.key === 'Home' || event.key === 'End') {
      const index = event.key === 'Home' ? 0 : photos.length - 1;
      alignCard(index);
      if (moveFocus) originals[index]?.focus({ preventScroll: true });
      announce(`Foto ${index + 1} de ${photos.length}.`);
    } else step(event.key === 'ArrowRight' ? 1 : -1, moveFocus);
  });
  on(viewport, 'wheel', () => hold(), { passive: true });
  on(viewport, 'dragstart', event => event.preventDefault());
  on(viewport, 'pointerdown', event => {
    if (event.pointerType !== 'mouse') { touching = true; touchPointerId = event.pointerId; updatePlayback(); return; }
    if (event.button !== 0) return;
    const card = event.target.closest('.reel-card');
    if (card && !firstGroup?.contains(card)) event.preventDefault();
    gesture = { id: event.pointerId, x: event.clientX, left: viewport.scrollLeft };
    hold();
  });
  on(viewport, 'pointermove', event => {
    if (event.pointerType !== 'mouse') return;
    if (gesture?.id === event.pointerId) {
      const delta = event.clientX - gesture.x;
      if (Math.abs(delta) > 6 && !dragging) {
        dragging = true;
        viewport.classList.add('is-dragging');
        viewport.setPointerCapture(event.pointerId);
        updatePlayback();
      }
      if (dragging) {
        event.preventDefault();
        let next = gesture.left - delta;
        if (cycle && next < 0) { gesture.left += cycle; next += cycle; }
        if (cycle && next >= cycle) { gesture.left -= cycle; next -= cycle; }
        viewport.scrollLeft = next;
        return;
      }
    }
    if (motion.matches) return;
    const card = event.target.closest('.reel-card');
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
    card.style.setProperty('--card-x', `${x * 100}%`);
    card.style.setProperty('--card-y', `${y * 100}%`);
    card.style.setProperty('--card-tilt-x', `${(0.5 - y) * 5}deg`);
    card.style.setProperty('--card-tilt-y', `${(x - 0.5) * 5}deg`);
  });
  function resetCardEffects() {
    track.querySelectorAll('.reel-card').forEach(card => {
      card.style.setProperty('--card-tilt-x', '0deg');
      card.style.setProperty('--card-tilt-y', '0deg');
    });
  }
  on(viewport, 'pointerout', event => {
    const card = event.target.closest('.reel-card');
    if (card && !card.contains(event.relatedTarget)) {
      card.style.setProperty('--card-tilt-x', '0deg');
      card.style.setProperty('--card-tilt-y', '0deg');
    }
  });
  function finishGesture(event) {
    if (touchPointerId === event.pointerId) { touching = false; touchPointerId = null; hold(2200); }
    if (gesture?.id !== event.pointerId) return;
    if (dragging) suppressClickUntil = performance.now() + 350;
    dragging = false;
    gesture = null;
    viewport.classList.remove('is-dragging');
    if (viewport.hasPointerCapture(event.pointerId)) viewport.releasePointerCapture(event.pointerId);
    hold(2200);
  }
  on(window, 'pointerup', finishGesture);
  on(window, 'pointercancel', finishGesture);
  on(viewport, 'lostpointercapture', finishGesture);
  on(window, 'blur', () => {
    if (gesture && viewport.hasPointerCapture(gesture.id)) viewport.releasePointerCapture(gesture.id);
    gesture = null;
    dragging = false;
    touching = false;
    touchPointerId = null;
    hovered = false;
    viewport.classList.remove('is-dragging');
    hold();
  });
  on(viewport, 'click', event => {
    if (performance.now() < suppressClickUntil) { event.preventDefault(); event.stopPropagation(); return; }
    const card = event.target.closest('.reel-card');
    if (card) openPhoto(Number(card.dataset.photoIndex));
  });
  on(document, 'visibilitychange', updatePlayback);
  on(motion, 'change', () => { if (motion.matches) resetCardEffects(); updatePlayback(); });
  const observer = new IntersectionObserver(entries => {
    inView = entries.some(entry => entry.isIntersecting);
    updatePlayback();
  }, { threshold: .05 });
  observer.observe(viewport);
  const resize = new ResizeObserver(measure);
  resize.observe(viewport);

  fetch('/data/team-gallery.json', { signal }).then(response => {
    if (!response.ok) throw new Error('Gallery data unavailable');
    return response.json();
  }).then(data => {
    if (disposed) return;
    photos = (data.photos || []).filter(photo => typeof photo.src === 'string' && photo.src.length > 0);
    if (!photos.length) throw new Error('Gallery is empty');
    firstGroup = document.createElement('div');
    firstGroup.className = 'reel-group';
    originals = photos.map(makeCard);
    firstGroup.append(...originals);
    const duplicate = firstGroup.cloneNode(true);
    duplicate.setAttribute('aria-hidden', 'true');
    duplicate.querySelectorAll('button').forEach(button => { button.tabIndex = -1; });
    track.replaceChildren(firstGroup, duplicate);
    for (const picture of track.querySelectorAll('img')) {
      on(picture, 'error', () => {
        if (picture.parentElement.querySelector('.gallery-image-error')) return;
        const message = document.createElement('span');
        message.className = 'gallery-image-error';
        message.textContent = 'Foto indisponível';
        picture.hidden = true;
        picture.after(message);
      });
    }
    const count = root.querySelector('[data-gallery-count]');
    if (count) count.textContent = `${photos.length} registros`;
    root.classList.add('gallery-ready');
    root.classList.remove('gallery-loading');
    root.querySelectorAll('[data-gallery-loading], .gallery-skeleton').forEach(element => { element.hidden = true; });
    resize.observe(firstGroup);
    measure();
    updatePlayback();
  }).catch(error => {
    if (error.name === 'AbortError') return;
    loadFailed = true;
    root.classList.add('gallery-ready', 'gallery-error');
    root.classList.remove('gallery-loading');
    root.querySelectorAll('[data-gallery-loading], .gallery-skeleton').forEach(element => { element.hidden = true; });
    const message = document.createElement('p');
    message.className = 'gallery-image-error';
    message.textContent = 'Não foi possível carregar as fotos. Atualize a página para tentar novamente.';
    track.replaceChildren(message);
    root.querySelectorAll('[data-gallery-prev], [data-gallery-next], [data-gallery-pause]').forEach(button => { button.disabled = true; });
    announce('Galeria indisponível no momento.');
  });
  focused = pausesForFocus(document.activeElement);
  updatePlayback();

  return () => {
    disposed = true;
    if (dialog?.open) {
      dialog.close();
      document.documentElement.style.overflow = previousOverflow;
    }
    controller.abort();
    observer.disconnect();
    resize.disconnect();
    cancelAnimationFrame(frame);
    cancelAnimationFrame(restoreFrame);
    clearTimeout(wakeTimer);
    dialogError?.remove();
  };
}
