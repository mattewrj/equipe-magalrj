export function initMusic() {
  const audio = document.querySelector('#site-music');
  const player = document.querySelector('#music-player');
  if (!audio || !player) return;
  const toggle = player.querySelector('[data-music-toggle]');
  const label = player.querySelector('[data-music-label]');
  const slider = player.querySelector('[data-music-volume]');
  const output = player.querySelector('[data-music-level]');
  const status = player.querySelector('[data-music-status]');
  let context, gain, source;
  let wantsMusic = true, started = false, failed = false, disposed = false;
  const listeners = new AbortController();
  const automaticStart = new AbortController();
  const on = (target, type, handler) => target.addEventListener(type, handler, { signal: listeners.signal });

  audio.loop = true;
  audio.volume = .25;
  // GainNode also controls loudness on iOS, where audio.volume is system-controlled.
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      context = new AudioContextClass();
      gain = context.createGain();
      gain.gain.value = .25;
      source = context.createMediaElementSource(audio);
      source.connect(gain);
      gain.connect(context.destination);
      audio.volume = 1;
    }
  } catch {
    if (source) {
      source.disconnect();
      source.connect(context.destination);
    }
    gain = null;
    audio.volume = .25;
  }

  function render() {
    const playing = !audio.paused && (!context || context.state === 'running');
    player.dataset.playing = String(playing);
    toggle.setAttribute('aria-label', playing ? 'Pausar música' : 'Tocar música');
    toggle.setAttribute('aria-pressed', String(playing));
    label.textContent = failed ? 'Indisponível' : playing ? 'Música' : started ? 'Pausada' : 'Ouvir música';
    if (playing) {
      started = true;
      automaticStart.abort();
    }
  }
  function reportError(error) {
    if (disposed || error?.name === 'AbortError') return;
    if (error?.name !== 'NotAllowedError') {
      failed = true;
      automaticStart.abort();
      status.textContent = 'Não foi possível tocar a música. Use o botão para tentar novamente.';
    }
    render();
  }
  function play() {
    if (disposed) return;
    wantsMusic = true;
    failed = false;
    status.textContent = '';
    // Both calls stay inside the user gesture; awaiting resume first loses activation.
    if (context && context.state !== 'running') context.resume().then(render).catch(reportError);
    audio.play().then(() => {
      if (!wantsMusic || disposed) audio.pause();
      render();
    }).catch(reportError);
  }
  function pause() {
    wantsMusic = false;
    automaticStart.abort();
    audio.pause();
    render();
  }
  function startOnInteraction(event) {
    if (player.contains(event.target) || !wantsMusic || failed) return;
    if (event.type === 'keydown' && (event.repeat || event.ctrlKey || event.metaKey || event.altKey || ['Shift', 'Control', 'Alt', 'Meta', 'Escape'].includes(event.key))) return;
    play();
  }
  document.addEventListener('click', startOnInteraction, { signal: automaticStart.signal });
  document.addEventListener('keydown', startOnInteraction, { signal: automaticStart.signal });
  on(toggle, 'click', () => {
    automaticStart.abort();
    if (!audio.paused && (!context || context.state === 'running')) pause();
    else play();
  });
  on(slider, 'input', () => {
    const volume = Number(slider.value) / 100;
    if (gain) {
      gain.gain.cancelScheduledValues(context.currentTime);
      gain.gain.setTargetAtTime(volume, context.currentTime, .04);
    } else audio.volume = volume;
    output.textContent = `${slider.value}%`;
    slider.setAttribute('aria-valuetext', `${slider.value}%`);
  });
  for (const event of ['play', 'playing', 'pause', 'ended']) on(audio, event, render);
  on(audio, 'error', () => reportError(audio.error));
  if (context) on(context, 'statechange', render);
  on(window, 'pagehide', event => {
    if (event.persisted) return;
    disposed = true;
    automaticStart.abort();
    listeners.abort();
    audio.pause();
    context?.close().catch(() => {});
  });
  player.hidden = false;
  render();
  play();
}
