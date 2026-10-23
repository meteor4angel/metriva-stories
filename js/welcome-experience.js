(function (global) {
  'use strict';
  const CAST = ['female', 'male', 'biscuit', 'cat', 'bird'];
  const DEFAULTS = {female: 'neutral', male: 'neutral', biscuit: 'sit', cat: 'sit', bird: 'perched'};
  const STATES = new Set(['hidden', 'entering', 'greeting', 'inviting', 'waiting', 'disappointed', 'exiting', 'returning', 'minimized']);
  class SafeStore {
    constructor(storage) { this.storage = storage; this.memory = new Map(); }
    get(key) { try { return this.storage?.getItem(key) ?? this.memory.get(key) ?? null; } catch (_) { return this.memory.get(key) ?? null; } }
    set(key, value) { this.memory.set(key, String(value)); try { this.storage?.setItem(key, String(value)); } catch (_) {} }
  }
  function browserStore(name) { try { return global[name]; } catch (_) { return null; } }
  function visitMode(config, local, session) {
    const s = config.storage;
    if (session.get(s.dismissedSessionKey) === 'true') return 'minimized';
    if (session.get(s.seenSessionKey) === 'true') return 'waiting';
    return local.get(s.visitedKey) === 'true' ? 'returningVisit' : 'firstVisit';
  }
  function assetUrl(path, base) { return new URL(path, base).href; }
  class WelcomeExperience {
    constructor(config, options = {}) {
      this.config = config; this.options = options;
      this.document = options.document || global.document;
      this.base = new URL(options.assetBase || 'public/assets/welcome/', this.document.baseURI).href;
      this.local = new SafeStore(options.localStorage ?? browserStore('localStorage'));
      this.session = new SafeStore(options.sessionStorage ?? browserStore('sessionStorage'));
      this.clock = options.clock || global; this.timers = new Set(); this.abort = new AbortController();
      this.media = options.media || global.matchMedia?.('(prefers-reduced-motion: reduce)');
      this.reduced = !!this.media?.matches || this.local.get(config.storage.reducedMotionKey) === 'true';
      this.sound = this.local.get(config.storage.soundKey) === 'true'; this.gesture = false;
      this.state = 'hidden'; this.destroyed = false; this.closing = false; this.groupIndex = 0;
      this.pendingImages = new Map(); this.mode = visitMode(config, this.local, this.session);
    }
    later(callback, ms) {
      const id = this.clock.setTimeout(() => { this.timers.delete(id); if (!this.destroyed) callback(); }, ms);
      this.timers.add(id); return id;
    }
    cancel() { for (const id of this.timers) this.clock.clearTimeout(id); this.timers.clear(); this.groupTimer = null; this.stopAudio(); }
    listen(node, name, callback, options = {}) { node?.addEventListener(name, callback, {...options, signal: this.abort.signal}); }
    preload(path) {
      if (!path) return Promise.resolve(false);
      if (this.pendingImages.has(path)) return this.pendingImages.get(path);
      const promise = new Promise(resolve => {
        const image = new global.Image(); image.onload = () => resolve(true); image.onerror = () => resolve(false); image.src = assetUrl(path, this.base);
      });
      this.pendingImages.set(path, promise); return promise;
    }
    async mount() {
      const hero = this.document.querySelector('#app .hero');
      if (!this.config.enabled || !hero || this.mode === 'hidden') return this;
      this.slot = this.document.createElement('section'); this.slot.className = 'mw-slot is-floating'; this.slot.setAttribute('aria-label', 'Metriva welcome guides'); hero.after(this.slot);
      this.root = this.document.createElement('div'); this.root.className = 'mw-welcome'; this.root.dataset.state = 'hidden'; this.slot.append(this.root);
      this.root.dataset.composed = String(!!this.config.groupPoses?.enabled);
      this.root.innerHTML = `<div class="mw-toolbar" role="group" aria-label="Welcome controls"><button type="button" data-welcome="move" aria-label="Move welcome guides" title="Drag to move; arrow keys also move the guides">↔ Move</button><button type="button" data-welcome="captions" aria-label="Hide speech bubble">Hide text</button><button type="button" data-welcome="sound"></button><button type="button" data-welcome="motion"></button><button type="button" data-welcome="close" aria-label="Close welcome">×</button></div><p class="mw-caption" role="status" aria-live="polite" aria-atomic="true"></p><div class="mw-stage" aria-hidden="true"><div class="mw-cast">${CAST.map(id => `<span class="mw-character mw-${id}"><img alt="" draggable="false"></span>`).join('')}</div><div class="mw-group"><img alt="" draggable="false"><img alt="" draggable="false"></div></div><div class="mw-entry-door" aria-hidden="true"><img class="mw-door-art" alt="" draggable="false"></div><div class="mw-door" aria-hidden="true"><div class="mw-door-leaf"><img class="mw-door-art" alt="" draggable="false"></div></div><button type="button" class="mw-reopen" data-welcome="reopen">Meet the guides ✨</button><span class="mw-sr-status" role="status" aria-live="polite"></span>`;
      if (!this.config.groupPoses?.enabled && this.config.door.art) this.root.querySelectorAll('.mw-door-art').forEach(img => { img.src = assetUrl(this.config.door.art, this.base); img.onerror = () => { img.hidden = true; }; });
      this.setupDragging();
      this.caption = this.root.querySelector('.mw-caption'); this.cast = this.root.querySelector('.mw-cast'); this.group = this.root.querySelector('.mw-group');
      this.setupWaitingHover();
      this.figures = Object.fromEntries(CAST.map(id => [id, this.root.querySelector('.mw-' + id + ' img')]));
      this.listen(this.root, 'click', event => {
        const action = event.target.closest('[data-welcome]')?.dataset.welcome;
        if (action === 'close') this.close();
        if (action === 'captions') { this.captionHidden = !this.captionHidden; this.updateControls(); }
        if (action === 'sound') this.toggleSound();
        if (action === 'motion') this.toggleMotion();
        if (action === 'reopen') { this.session.set(this.config.storage.dismissedSessionKey, false); this.mode = 'returningVisit'; this.begin(); }
      });
      this.listen(this.document, 'click', event => {
        if (this.root.contains(event.target)) return;
        const link = event.target.closest('a[href],button[onclick]');
        if (link) this.dismissImmediately();
      }, {capture: true});
      this.listen(this.document, 'visibilitychange', () => { if (this.document.hidden) this.stopAudio(); });
      this.listen(this.media, 'change', event => { this.reduced = event.matches || this.local.get(this.config.storage.reducedMotionKey) === 'true'; this.updateControls(); if (this.state === 'waiting') this.waiting(); });
      this.updateControls(); this.showCast({});
      if (this.mode === 'minimized') { this.transition('minimized'); return this; }
      this.local.set(this.config.storage.visitedKey, true); this.session.set(this.config.storage.seenSessionKey, true);
      // Loading illustrations never blocks browsing or navigation.
      const sequence = this.config.sequences[this.mode === 'firstVisit' ? 'firstVisit' : 'returningVisit'];
      const critical = this.config.groupPoses?.enabled ? [this.config.groupPoses.assets[sequence[0].groupPose], this.config.groupWaiting.assets[1]] : CAST.map(id => this.config.characters[id].expressions[DEFAULTS[id]]);
      await Promise.all(critical.map(path => this.preload(path)));
      if (this.destroyed) return this;
      if (!this.slot.isConnected) { this.destroy(); return this; }
      if (this.mode === 'waiting') this.waiting(); else this.begin();
      if (this.config.groupPoses?.enabled) { for (const path of Object.values(this.config.groupPoses.assets)) this.preload(path); }
      else for (const actor of Object.values(this.config.characters)) for (const path of Object.values(actor.expressions)) this.preload(path);
      for (const path of Object.values(this.config.groupWaiting.assets)) this.preload(path);
      if (this.config.groupWaiting.hoverAsset) this.preload(this.config.groupWaiting.hoverAsset);
      return this;
    }
    setupDragging() {
      const handle = this.root.querySelector('[data-welcome="move"]');
      this.listen(this.root, 'pointerdown', event => {
        if (event.button !== 0 || !event.target.closest('.mw-group,[data-welcome="move"]')) return;
        const box = this.slot.getBoundingClientRect();
        this.drag = {id:event.pointerId, x:event.clientX, y:event.clientY, left:box.left, top:box.top};
        this.root.setPointerCapture(event.pointerId); this.root.classList.add('is-dragging'); event.preventDefault();
      });
      this.listen(this.root, 'pointermove', event => {
        if (!this.drag || this.drag.id !== event.pointerId) return;
        this.moveTo(this.drag.left + event.clientX - this.drag.x, this.drag.top + event.clientY - this.drag.y);
      });
      const finish = event => {
        if (!this.drag || this.drag.id !== event.pointerId) return;
        this.drag = null; this.root.classList.remove('is-dragging');
        if (this.root.hasPointerCapture(event.pointerId)) this.root.releasePointerCapture(event.pointerId);
      };
      this.listen(this.root, 'pointerup', finish); this.listen(this.root, 'pointercancel', finish);
      this.listen(this.root, 'lostpointercapture', finish);
      this.listen(handle, 'keydown', event => {
        const direction = {ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[event.key];
        if (!direction) return;
        event.preventDefault(); const box = this.slot.getBoundingClientRect(), step = event.shiftKey ? 40 : 16;
        this.moveTo(box.left + direction[0] * step, box.top + direction[1] * step);
      });
      this.listen(this.document.defaultView || global, 'resize', () => { if (this.position) this.moveTo(this.position.x, this.position.y); });
    }
    moveTo(x, y) {
      const view = this.document.defaultView || global, box = this.root.getBoundingClientRect(), inset = 8;
      const left = Math.max(inset, Math.min(x, view.innerWidth - box.width - inset));
      const top = Math.max(inset, Math.min(y, view.innerHeight - box.height - inset));
      Object.assign(this.slot.style, {left:left + 'px', top:top + 'px', bottom:'auto'});
      this.position = {x:left, y:top};
    }
    setupWaitingHover() {
      this.listen(this.group, 'pointerenter', event => { if (event.pointerType === 'mouse') this.setWaitingHover(true); });
      this.listen(this.group, 'pointerleave', event => { if (event.pointerType === 'mouse') this.setWaitingHover(false); });
    }
    setWaitingHover(active) {
      if (this.state !== 'waiting' || !this.config.groupWaiting.hoverAsset || this.hovered === active) return;
      this.hovered = active;
      if (active) this.showGroupAsset(this.config.groupWaiting.hoverAsset, 'hover', true);
      else this.groupFrame(this.config.groupWaiting.sequence[this.groupIndex], true);
    }
    updateControls() {
      if (!this.root) return;
      this.root.dataset.reducedMotion = String(this.reduced);
      this.root.dataset.captionsHidden = String(!!this.captionHidden);
      const captions = this.root.querySelector('[data-welcome="captions"]');
      if (captions) { captions.textContent = this.captionHidden ? 'Show text' : 'Hide text'; captions.setAttribute('aria-label', this.captionHidden ? 'Show speech bubble' : 'Hide speech bubble'); captions.setAttribute('aria-pressed', String(!this.captionHidden)); }
      const sound = this.root.querySelector('[data-welcome="sound"]');
      sound.textContent = this.sound ? (this.config.audio.availableClips.length ? '♫ Sound on' : '♫ Captions only') : '♫ Sound off'; sound.setAttribute('aria-pressed', String(this.sound));
      sound.setAttribute('aria-label', this.sound ? 'Mute welcome voices' : 'Enable welcome voices');
      sound.title = this.config.audio.availableClips.length ? 'Welcome voice playback' : 'Voice recordings have not been supplied yet. Captions are always available.';
      const motion = this.root.querySelector('[data-welcome="motion"]');
      motion.textContent = this.reduced ? '▷ Motion' : 'Ⅱ Motion'; motion.setAttribute('aria-pressed', String(this.reduced));
      motion.setAttribute('aria-label', this.reduced ? 'Enable welcome motion' : 'Reduce welcome motion');
    }
    transition(state) {
      if (!STATES.has(state)) throw new Error('Unknown welcome state: ' + state);
      if (state !== 'waiting') this.hovered = false;
      this.state = state; if (this.root) this.root.dataset.state = state;
      if (this.slot) this.slot.classList.toggle('is-minimized', state === 'minimized');
      if (this.position) this.moveTo(this.position.x, this.position.y);
    }
    begin() {
      this.cancel(); this.closing = false; this.root.querySelector('[data-welcome="close"]').setAttribute('aria-label', 'Close welcome');
      this.run(this.config.sequences[this.mode === 'firstVisit' ? 'firstVisit' : 'returningVisit']);
    }
    showCast(poses, speaker, expression) {
      if (this.config.groupPoses?.enabled) { this.cast.classList.add('is-hidden'); return; }
      this.group.classList.remove('is-active'); this.cast.classList.remove('is-hidden');
      for (const id of CAST) {
        const expressions = this.config.characters[id].expressions;
        const pose = poses[id] || (speaker === id ? expression : null) || DEFAULTS[id];
        const path = expressions[pose] || expressions[DEFAULTS[id]];
        const img = this.figures[id]; const url = assetUrl(path, this.base);
        if (img.src !== url) {
          img.hidden = false;
          img.onerror = () => { const fallback = assetUrl(expressions[DEFAULTS[id]], this.base); if (img.src !== fallback) img.src = fallback; else img.hidden = true; };
          img.src = url;
        }
        img.parentElement.dataset.expression = pose; img.parentElement.classList.toggle('is-speaking', speaker === id);
      }
    }
    run(steps, index = 0) {
      if (this.destroyed || !steps?.[index]) return;
      const step = steps[index]; this.currentStep = step; this.transition(step.state); this.stopAudio();
      this.root.dataset.tableau = step.tableau || 'cluster';
      if (step.state === 'hidden') { this.minimize(); return; }
      if (step.useGroupWaiting) { this.waiting(); return; }
      if (this.config.groupPoses?.enabled && step.groupPose) this.showGroupPose(step.groupPose);
      else this.showCast(step.poses || {}, step.speaker, step.expression);
      this.caption.textContent = step.text || ''; this.caption.hidden = !step.text;
      this.root.dataset.speaker = step.speaker || ''; this.root.dataset.step = step.id;
      if (step.state === 'exiting') this.root.classList.toggle('is-door-open', step.door === 'open');
      this.playVoice(step);
      const duration = this.reduced ? Math.min(step.durationMs || 0, 1800) : step.durationMs || 0;
      this.later(() => this.run(steps, index + 1), duration * (this.options.durationScale || 1));
    }
    async showGroupAsset(path, identity, immediate = false, waiting = false) {
      const request = this.frameRequest = (this.frameRequest || 0) + 1;
      const state = this.state; let ready = await this.preload(path);
      if (!ready && this.config.groupPoses?.fallback) { path = this.config.groupPoses.fallback; ready = await this.preload(path); }
      if (!ready || this.destroyed || this.state !== state || (waiting && this.state !== 'waiting') || request !== this.frameRequest) return;
      const images = [...this.group.querySelectorAll('img')], next = images.find(img => !img.classList.contains('is-visible')) || images[0];
      next.src = assetUrl(path, this.base); next.style.transitionDuration = immediate || this.reduced ? '0ms' : this.config.groupWaiting.transitionMs + 'ms';
      images.forEach(img => { if (immediate || this.reduced) img.style.transitionDuration = '0ms'; img.classList.toggle('is-visible', img === next); });
      if (waiting) this.root.dataset.groupFrame = String(identity);
      else this.root.dataset.groupPose = String(identity);
      this.group.classList.add('is-active'); this.cast.classList.add('is-hidden');
    }
    showGroupPose(pose) {
      return this.showGroupAsset(this.config.groupPoses.assets[pose], pose, this.state === 'exiting');
    }
    groupFrame(number, immediate = false) {
      if (this.hovered) return Promise.resolve();
      return this.showGroupAsset(this.config.groupWaiting.assets[number], number, immediate, true);
    }
    waiting() {
      if (this.groupTimer) { this.clock.clearTimeout(this.groupTimer); this.timers.delete(this.groupTimer); }
      this.transition('waiting'); this.root.dataset.tableau = 'cluster'; this.caption.textContent = this.mode === 'firstVisit' ? 'Go on, pick your first story!' : 'Ready for another story?'; this.caption.hidden = false;
      this.showCast({biscuit:'rest',cat:'sit',bird:'perched'});
      this.root.dataset.speaker = ''; this.groupIndex = 0;
      const order = this.config.groupWaiting.sequence;
      if (this.config.groupWaiting.enabled) this.groupFrame(order[0], true);
      const next = () => {
        if (this.state !== 'waiting' || this.reduced || !this.config.groupWaiting.loop) return;
        if (!this.hovered) { this.groupIndex = (this.groupIndex + 1) % order.length; this.groupFrame(order[this.groupIndex]); }
        this.groupTimer = this.later(next, this.config.groupWaiting.frameDurationMs * (this.options.durationScale || 1));
      };
      if (!this.reduced && this.config.groupWaiting.enabled) this.groupTimer = this.later(next, this.config.groupWaiting.frameDurationMs * (this.options.durationScale || 1));
    }
    close() {
      if (this.closing || this.state === 'minimized') { this.minimize(); return; }
      this.cancel(); this.closing = true; this.session.set(this.config.storage.dismissedSessionKey, true);
      const button = this.root.querySelector('[data-welcome="close"]'); button.setAttribute('aria-label', 'Skip goodbye and close now'); button.focus({preventScroll:true});
      this.run(this.config.sequences.onClose);
    }
    minimize() {
      this.cancel(); this.closing = false; this.transition('minimized');
      this.root.querySelector('[data-welcome="reopen"]')?.focus({preventScroll:true});
    }
    dismissImmediately() { this.session.set(this.config.storage.dismissedSessionKey, true); this.destroy(); }
    stopAudio() { if (this.audio) { this.audio.pause(); this.audio.removeAttribute('src'); this.audio.load?.(); this.audio = null; } }
    playVoice(step) {
      if (!this.config.audio.enabled || !this.sound || !this.gesture || !step.audio || !this.config.audio.availableClips.includes(step.audio)) return;
      const audio = new global.Audio(assetUrl('audio/' + step.audio, this.base)); this.audio = audio;
      audio.addEventListener('error', () => { if (this.audio === audio) this.stopAudio(); }, {once:true}); audio.play().catch(() => { if (this.audio === audio) this.stopAudio(); });
    }
    toggleSound() {
      this.gesture = true; this.sound = !this.sound; this.local.set(this.config.storage.soundKey, this.sound); this.updateControls(); this.stopAudio();
      if (this.sound) {
        if (!this.config.audio.availableClips.length) this.root.querySelector('.mw-sr-status').textContent = 'Voice recordings are not available yet. Welcome captions are still shown.';
        else this.playVoice(this.currentStep || {});
      }
    }
    toggleMotion() {
      this.reduced = !this.reduced; this.local.set(this.config.storage.reducedMotionKey, this.reduced); this.updateControls();
      if (this.state === 'waiting') this.waiting();
    }
    destroy() {
      if (this.destroyed) return; const focused = this.root?.contains(this.document.activeElement);
      this.destroyed = true; this.cancel(); this.abort.abort(); this.transition('hidden'); this.slot?.remove();
      if (focused) this.document.querySelector('#app .hero .btn')?.focus({preventScroll:true});
    }
  }
  async function resolveConfig(options, configUrl) {
    if (options.config) return options.config;
    if (!options.configUrl && global.METRIVA_WELCOME_CONFIG) return global.METRIVA_WELCOME_CONFIG;
    if (configUrl.protocol === 'file:') throw new Error('Local welcome configuration script is missing');
    const response = await (options.fetch || global.fetch)(configUrl);
    if (!response.ok) throw new Error('Welcome configuration unavailable');
    return response.json();
  }
  async function start(options = {}) {
    const doc = options.document || global.document;
    const configUrl = new URL(options.configUrl || 'public/assets/welcome/welcome-experience.json', doc.baseURI);
    const config = await resolveConfig(options, configUrl);
    const experience = new WelcomeExperience(config, {...options, assetBase: options.assetBase || new URL('.', configUrl).href});
    await experience.mount(); return experience;
  }
  global.MetrivaWelcome = {WelcomeExperience, SafeStore, visitMode, start, resolveConfig, CAST, STATES};
  if (typeof module !== 'undefined') module.exports = global.MetrivaWelcome;
  if (global.document && global.document.currentScript?.dataset.autostart !== 'false') {
    let active;
    const boot = () => start().then(value => { active = value; }).catch(error => global.console?.warn('Welcome skipped:', error.message));
    if (global.document.readyState === 'loading') global.document.addEventListener('DOMContentLoaded', boot, {once:true}); else boot();
    global.document.addEventListener('metriva:route', () => { active?.dismissImmediately(); });
  }
})(typeof window !== 'undefined' ? window : globalThis);
