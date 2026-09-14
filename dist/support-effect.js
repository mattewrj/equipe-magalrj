// Original, lightweight Canvas 2D effect. No external runtime or WebGL required.
const activeEffects = new WeakMap();
const TAU = Math.PI * 2;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

/**
 * Attach an orbital constellation to section#apoio.
 * Expected children: canvas.support-canvas and .support-orb (optional center).
 * The canvas needs a CSS width/height independent of its bitmap dimensions.
 * Returns an idempotent cleanup function.
 */
export function initSupportEffect(root) {
  if (!root?.querySelector) return () => {};
  activeEffects.get(root)?.();
  const canvas = root.querySelector('canvas.support-canvas');
  const context = canvas?.getContext('2d', { alpha: true });
  if (!canvas || !context) return () => {};

  const orb = root.querySelector('.support-orb');
  const spotlightSurface = root.querySelector('.support-stage') || root;
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const cssProperties = ['--support-x', '--support-y', '--orb-rotate-x', '--orb-rotate-y'];
  const previousStyles = cssProperties.map(name => [
    name, root.style.getPropertyValue(name), root.style.getPropertyPriority(name),
  ]);
  const previousCanvas = {
    ariaHidden: canvas.getAttribute('aria-hidden'),
    pointerEvents: canvas.style.getPropertyValue('pointer-events'),
    pointerPriority: canvas.style.getPropertyPriority('pointer-events'),
    width: canvas.getAttribute('width'),
    height: canvas.getAttribute('height'),
  };

  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.setProperty('pointer-events', 'none');

  let destroyed = false;
  let reducedMotion = motionQuery.matches;
  let visible = false;
  let width = 0;
  let height = 0;
  let dpr = 1;
  let radius = 1;
  let centerX = 0;
  let centerY = 0;
  let raf = 0;
  let resizeTimer = 0;
  let previousTime = 0;
  let phase = 0;
  let particles = [];
  let projected = [];

  const target = { x: 0, y: 0, sectionX: 50, sectionY: 50, strength: 0 };
  const pointer = { ...target };

  function updateStyles() {
    root.style.setProperty('--support-x', `${pointer.sectionX.toFixed(2)}%`);
    root.style.setProperty('--support-y', `${pointer.sectionY.toFixed(2)}%`);
    root.style.setProperty('--orb-rotate-x', `${(reducedMotion ? 0 : -pointer.y * 6).toFixed(2)}deg`);
    root.style.setProperty('--orb-rotate-y', `${(reducedMotion ? 0 : pointer.x * 6).toFixed(2)}deg`);
  }

  function makeParticles(count) {
    // Deterministic distribution prevents the field from jumping on every resize.
    particles = Array.from({ length: count }, (_, index) => {
      const y = 1 - (index + 0.5) / count * 2;
      return {
        y,
        radial: Math.sqrt(1 - y * y),
        angle: index * Math.PI * (3 - Math.sqrt(5)),
        orbit: 0.91 + ((index * 13) % 17) / 17 * 0.28,
        speed: 0.13 + index % 4 * 0.024,
        size: index % 9 === 0 ? 2.1 : 0.8 + index % 3 * 0.3,
        cyan: index % 3 === 0,
      };
    });
    projected = particles.map(() => ({ x: 0, y: 0, z: 0, scale: 1, alpha: 1 }));
  }

  function project(x, y, z, yaw, pitch) {
    const rotatedX = x * Math.cos(yaw) + z * Math.sin(yaw);
    const rotatedZ = z * Math.cos(yaw) - x * Math.sin(yaw);
    const rotatedY = y * Math.cos(pitch) - rotatedZ * Math.sin(pitch);
    const depth = y * Math.sin(pitch) + rotatedZ * Math.cos(pitch);
    const scale = 3.8 / (3.8 - depth);
    return {
      x: centerX + rotatedX * radius * scale,
      y: centerY + rotatedY * radius * scale,
      z: depth,
      scale,
      alpha: clamp((depth + 1.4) / 2.6, 0.16, 1),
    };
  }

  function drawOrbit(tilt, rotation, extent, time) {
    const segments = 84;
    const yaw = rotation + pointer.x * 0.12;
    const pitch = tilt + pointer.y * 0.1;
    let previous;
    for (let index = 0; index <= segments; index++) {
      const angle = index / segments * TAU;
      const point = project(Math.cos(angle) * extent, Math.sin(angle) * extent, 0, yaw, pitch);
      if (previous) {
        context.beginPath();
        context.moveTo(previous.x, previous.y);
        context.lineTo(point.x, point.y);
        context.strokeStyle = `rgba(77, 181, 255, ${0.045 + point.alpha * 0.13})`;
        context.lineWidth = point.z > 0 ? 0.7 : 0.45;
        context.stroke();
      }
      previous = point;
    }
    const angle = time * 0.28 + rotation * 2;
    const satellite = project(Math.cos(angle) * extent, Math.sin(angle) * extent, 0, yaw, pitch);
    context.beginPath();
    context.arc(satellite.x, satellite.y, 2.6 * satellite.scale, 0, TAU);
    context.fillStyle = `rgba(133, 237, 255, ${0.5 + satellite.alpha * 0.5})`;
    context.fill();
  }

  function draw() {
    if (!width || !height || destroyed) return;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, width, height);
    const time = reducedMotion ? 0 : phase;
    const yaw = 0.35 + pointer.x * 0.17;
    const pitch = -0.16 + pointer.y * 0.14;
    const pointerX = centerX + pointer.x * radius * 1.65;
    const pointerY = centerY + pointer.y * radius * 1.65;

    const halo = context.createRadialGradient(centerX, centerY, radius * 0.25, centerX, centerY, radius * 1.8);
    halo.addColorStop(0, 'rgba(29, 129, 255, 0.035)');
    halo.addColorStop(0.56, 'rgba(43, 141, 255, 0.055)');
    halo.addColorStop(1, 'rgba(25, 114, 242, 0)');
    context.fillStyle = halo;
    context.fillRect(0, 0, width, height);

    drawOrbit(1.02, 0.43, 1.31, time);
    drawOrbit(-0.82, 1.19, 1.25, time + 6);
    drawOrbit(0.22, 0.7, 1.11, time + 12);

    for (let index = 0; index < particles.length; index++) {
      const particle = particles[index];
      const angle = particle.angle + time * particle.speed;
      const point = project(
        Math.cos(angle) * particle.radial * particle.orbit,
        particle.y * particle.orbit,
        Math.sin(angle) * particle.radial * particle.orbit,
        yaw, pitch,
      );
      const dx = pointerX - point.x;
      const dy = pointerY - point.y;
      const influence = Math.max(0, 1 - Math.hypot(dx, dy) / (radius * 0.85)) * pointer.strength;
      point.x += dx * influence * 0.065;
      point.y += dy * influence * 0.065;
      point.alpha = Math.min(1, point.alpha + influence * 0.3);
      projected[index] = point;
    }

    const linkDistance = radius * (particles.length > 35 ? 0.52 : 0.69);
    for (let index = 0; index < projected.length; index++) {
      const point = projected[index];
      let links = 0;
      for (let next = index + 1; next < projected.length && links < 3; next++) {
        const neighbor = projected[next];
        if (Math.abs(point.z - neighbor.z) > 0.66) continue;
        const distance = Math.hypot(point.x - neighbor.x, point.y - neighbor.y);
        if (distance > linkDistance) continue;
        const opacity = (1 - distance / linkDistance) * Math.min(point.alpha, neighbor.alpha) * 0.28;
        context.beginPath();
        context.moveTo(point.x, point.y);
        context.lineTo(neighbor.x, neighbor.y);
        context.strokeStyle = `rgba(84, 180, 255, ${opacity})`;
        context.lineWidth = 0.65;
        context.stroke();
        links++;
      }
    }

    for (let index = 0; index < projected.length; index++) {
      const point = projected[index];
      const particle = particles[index];
      const size = particle.size * point.scale;
      if (particle.size > 2) {
        context.beginPath();
        context.arc(point.x, point.y, size * 3.3, 0, TAU);
        context.fillStyle = `rgba(63, 187, 255, ${point.alpha * 0.08})`;
        context.fill();
      }
      context.beginPath();
      context.arc(point.x, point.y, size, 0, TAU);
      context.fillStyle = particle.cyan
        ? `rgba(159, 240, 255, ${point.alpha * 0.92})`
        : `rgba(83, 169, 255, ${point.alpha * 0.8})`;
      context.fill();
    }
  }

  function canAnimate() {
    return !destroyed && visible && !document.hidden && !reducedMotion && width > 0 && height > 0;
  }

  function stop() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    previousTime = 0;
  }

  function frame(timestamp) {
    raf = 0;
    if (!canAnimate()) return;
    const elapsed = previousTime ? Math.min((timestamp - previousTime) / 1000, 0.05) : 1 / 60;
    previousTime = timestamp;
    phase += elapsed;
    const damping = 1 - Math.exp(-elapsed * 6);
    for (const key of Object.keys(pointer)) pointer[key] += (target[key] - pointer[key]) * damping;
    updateStyles();
    draw();
    raf = requestAnimationFrame(frame);
  }

  function syncAnimation() {
    if (canAnimate()) {
      if (!raf) raf = requestAnimationFrame(frame);
    } else {
      stop();
      if (visible && !document.hidden) draw();
    }
  }

  function measure() {
    resizeTimer = 0;
    if (destroyed) return;
    const bounds = canvas.getBoundingClientRect();
    width = Math.max(0, bounds.width);
    height = Math.max(0, bounds.height);
    dpr = Math.min(window.devicePixelRatio || 1, 1.7);
    const bitmapWidth = Math.round(width * dpr);
    const bitmapHeight = Math.round(height * dpr);
    if (canvas.width !== bitmapWidth) canvas.width = bitmapWidth;
    if (canvas.height !== bitmapHeight) canvas.height = bitmapHeight;
    const orbBounds = orb?.getBoundingClientRect();
    const hasOrb = orbBounds && orbBounds.width > 0 && orbBounds.height > 0;
    centerX = hasOrb ? orbBounds.left + orbBounds.width / 2 - bounds.left : width / 2;
    centerY = hasOrb ? orbBounds.top + orbBounds.height / 2 - bounds.top : height / 2;
    const availableRadius = Math.min(width, height) * 0.39;
    const compact = window.innerWidth < 768;
    const desiredRadius = hasOrb
      ? clamp(Math.min(orbBounds.width, orbBounds.height) * 0.8, compact ? 100 : 130, compact ? 130 : 180)
      : availableRadius;
    radius = Math.max(1, Math.min(desiredRadius, availableRadius));
    const count = window.innerWidth < 768 ? 35 : 76;
    if (particles.length !== count) makeParticles(count);
    syncAnimation();
  }

  function queueMeasure() {
    if (!resizeTimer && !destroyed) resizeTimer = window.setTimeout(measure, 100);
  }

  function onPointer(event) {
    if (destroyed) return;
    // These are distinct coordinate spaces: the canvas may cover only half the section.
    const bounds = spotlightSurface.getBoundingClientRect();
    const canvasBounds = canvas.getBoundingClientRect();
    target.sectionX = clamp((event.clientX - bounds.left) / (bounds.width || 1) * 100, 0, 100);
    target.sectionY = clamp((event.clientY - bounds.top) / (bounds.height || 1) * 100, 0, 100);
    target.x = clamp((event.clientX - canvasBounds.left - centerX) / (radius * 1.65), -1, 1);
    target.y = clamp((event.clientY - canvasBounds.top - centerY) / (radius * 1.65), -1, 1);
    target.strength = 1;
    if (reducedMotion) {
      pointer.sectionX = target.sectionX;
      pointer.sectionY = target.sectionY;
      updateStyles();
    }
  }

  function onPointerLeave() {
    Object.assign(target, { x: 0, y: 0, sectionX: 50, sectionY: 50, strength: 0 });
    if (reducedMotion) {
      Object.assign(pointer, target);
      updateStyles();
    }
  }

  function onMotionChange() {
    reducedMotion = motionQuery.matches;
    if (reducedMotion) {
      Object.assign(pointer, { ...target, x: 0, y: 0, strength: 0 });
      updateStyles();
    }
    syncAnimation();
  }

  const initialBounds = root.getBoundingClientRect();
  visible = initialBounds.bottom > 0 && initialBounds.top < window.innerHeight;
  const intersectionObserver = typeof IntersectionObserver !== 'undefined'
    ? new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      syncAnimation();
    }, { threshold: 0 })
    : null;
  const resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(queueMeasure) : null;
  intersectionObserver?.observe(root);
  resizeObserver?.observe(canvas);
  resizeObserver?.observe(root);
  if (orb) resizeObserver?.observe(orb);
  root.addEventListener('pointermove', onPointer, { passive: true });
  root.addEventListener('pointerdown', onPointer, { passive: true });
  root.addEventListener('pointerleave', onPointerLeave, { passive: true });
  document.addEventListener('visibilitychange', syncAnimation);
  window.addEventListener('resize', queueMeasure, { passive: true });
  if (motionQuery.addEventListener) motionQuery.addEventListener('change', onMotionChange);
  else motionQuery.addListener(onMotionChange);
  updateStyles();
  measure();

  function cleanup() {
    if (destroyed) return;
    destroyed = true;
    stop();
    window.clearTimeout(resizeTimer);
    intersectionObserver?.disconnect();
    resizeObserver?.disconnect();
    root.removeEventListener('pointermove', onPointer);
    root.removeEventListener('pointerdown', onPointer);
    root.removeEventListener('pointerleave', onPointerLeave);
    document.removeEventListener('visibilitychange', syncAnimation);
    window.removeEventListener('resize', queueMeasure);
    if (motionQuery.removeEventListener) motionQuery.removeEventListener('change', onMotionChange);
    else motionQuery.removeListener(onMotionChange);
    context.clearRect(0, 0, width, height);
    for (const [name, value, priority] of previousStyles) {
      if (value) root.style.setProperty(name, value, priority);
      else root.style.removeProperty(name);
    }
    if (previousCanvas.pointerEvents) canvas.style.setProperty('pointer-events', previousCanvas.pointerEvents, previousCanvas.pointerPriority);
    else canvas.style.removeProperty('pointer-events');
    for (const [name, value] of [['aria-hidden', previousCanvas.ariaHidden], ['width', previousCanvas.width], ['height', previousCanvas.height]]) {
      if (value === null) canvas.removeAttribute(name);
      else canvas.setAttribute(name, value);
    }
    if (activeEffects.get(root) === cleanup) activeEffects.delete(root);
  }

  activeEffects.set(root, cleanup);
  return cleanup;
}
