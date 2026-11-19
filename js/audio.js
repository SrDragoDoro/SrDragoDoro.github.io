/* =============================================================================
 * audio.js — SFX sintetizados con Web Audio API.
 *
 * No hay archivos de sonido: cada efecto se genera con osciladores y ruido.
 * El audio empieza silenciado y solo se inicializa tras un gesto del usuario.
 * ========================================================================== */

(function () {
  'use strict';

  class GDSound {
    constructor() {
      this.ctx = null;
      this.master = null;
      this.muted = true;
      this.noiseBuffer = null;
    }

    /* Crea el contexto en el primer gesto real del usuario. */
    ensure() {
      if (this.ctx) {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        return this.ctx;
      }

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;

      this.ctx = new AudioCtx();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.32;
      this.master.connect(this.ctx.destination);

      // Ruido corto reutilizable para impactos.
      const length = Math.floor(this.ctx.sampleRate * 0.14);
      const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / length);
      }
      this.noiseBuffer = buffer;

      return this.ctx;
    }

    toggle() {
      this.muted = !this.muted;
      if (!this.muted) {
        this.ensure();
        this.play('toggle');
      }
      return !this.muted;
    }

    /* Un tono con envolvente y barrido de frecuencia. */
    tone(options) {
      const ctx = this.ensure();
      if (!ctx) return;

      const {
        freq = 440,
        to = freq,
        type = 'square',
        when = 0,
        dur = 0.1,
        vol = 0.16,
        filter = 0,
      } = options;

      const t0 = ctx.currentTime + when;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(Math.max(20, freq), t0);
      if (to !== freq) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), t0 + dur);
      }

      let node = osc;
      if (filter) {
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.setValueAtTime(filter, t0);
        node.connect(lp);
        node = lp;
      }

      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

      node.connect(gain);
      gain.connect(this.master);

      osc.start(t0);
      osc.stop(t0 + dur + 0.03);
    }

    noise(when, dur, vol, cutoff) {
      const ctx = this.ensure();
      if (!ctx || !this.noiseBuffer) return;

      const t0 = ctx.currentTime + when;
      const src = ctx.createBufferSource();
      src.buffer = this.noiseBuffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(cutoff, t0);
      filter.frequency.exponentialRampToValueAtTime(Math.max(120, cutoff * 0.25), t0 + dur);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(vol, t0);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

      src.connect(filter);
      filter.connect(gain);
      gain.connect(this.master);

      src.start(t0);
      src.stop(t0 + dur + 0.02);
    }

    play(name) {
      if (this.muted) return;
      const ctx = this.ensure();
      if (!ctx) return;

      switch (name) {
        case 'click':
          this.tone({ freq: 520, to: 760, type: 'square', dur: 0.055, vol: 0.1 });
          this.tone({ freq: 1200, to: 900, type: 'sine', dur: 0.035, vol: 0.04 });
          break;

        case 'jump':
          this.tone({ freq: 190, to: 640, type: 'triangle', dur: 0.17, vol: 0.19, filter: 2600 });
          this.tone({ freq: 380, to: 980, type: 'sine', dur: 0.12, vol: 0.05 });
          break;

        case 'land':
          this.tone({ freq: 150, to: 55, type: 'sine', dur: 0.13, vol: 0.2 });
          this.noise(0, 0.09, 0.07, 900);
          break;

        case 'section':
          [392, 523.25, 659.25, 783.99].forEach((freq, i) => {
            this.tone({
              freq,
              to: freq * 1.01,
              type: 'square',
              when: i * 0.065,
              dur: 0.11,
              vol: 0.08,
              filter: 3200,
            });
          });
          this.tone({ freq: 98, to: 62, type: 'sine', when: 0, dur: 0.16, vol: 0.13 });
          break;

        case 'dash':
          this.noise(0, 0.22, 0.075, 2400);
          this.tone({ freq: 96, to: 760, type: 'sawtooth', dur: 0.28, vol: 0.1, filter: 2800 });
          this.tone({ freq: 320, to: 1480, type: 'triangle', when: 0.06, dur: 0.24, vol: 0.08 });
          this.tone({ freq: 900, to: 1700, type: 'sine', when: 0.18, dur: 0.16, vol: 0.04 });
          break;

        case 'select':
          this.tone({ freq: 660, to: 660, type: 'square', dur: 0.05, vol: 0.08, filter: 3400 });
          this.tone({ freq: 990, to: 1180, type: 'sine', when: 0.05, dur: 0.1, vol: 0.07 });
          break;

        case 'open':
          this.tone({ freq: 330, to: 550, type: 'triangle', dur: 0.12, vol: 0.1, filter: 2200 });
          break;

        case 'close':
          this.tone({ freq: 480, to: 260, type: 'triangle', dur: 0.1, vol: 0.08 });
          break;

        case 'achievement':
          [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
            this.tone({
              freq,
              type: 'triangle',
              when: i * 0.085,
              dur: 0.24,
              vol: 0.12,
            });
            this.tone({
              freq: freq * 2,
              type: 'sine',
              when: i * 0.085,
              dur: 0.16,
              vol: 0.035,
            });
          });
          this.tone({ freq: 130.81, to: 196, type: 'sine', dur: 0.4, vol: 0.07 });
          break;

        case 'toggle':
          this.tone({ freq: 880, to: 1174.66, type: 'sine', dur: 0.12, vol: 0.09 });
          break;

        default:
          break;
      }
    }
  }

  window.GDAudio = new GDSound();
})();
