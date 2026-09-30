/* =========================================================
 * パグの世界 - audio.js（PUG PUG GARDEN の sound.js を拡張）
 * 音声ファイルを使わず、WebAudioで短い効果音を合成する
 * ========================================================= */
'use strict';

(function (PPG) {
  PPG.Sound = {
    ctx: null,
    enabled: true,

    /** iOSは最初のタップ後でないと音が出ないので、操作時に呼ぶ */
    unlock: function () {
      try {
        if (!this.ctx) {
          const AC = window.AudioContext || window.webkitAudioContext;
          if (!AC) return;
          this.ctx = new AC();
        }
        if (this.ctx.state === 'suspended') this.ctx.resume();
      } catch (e) { this.ctx = null; }
    },

    tone: function (freq, dur, type, vol, slideTo, delay) {
      if (!this.enabled || !this.ctx) return;
      try {
        const t = this.ctx.currentTime + (delay || 0);
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type || 'sine';
        osc.frequency.setValueAtTime(freq, t);
        if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(vol || 0.12, t + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + dur + 0.03);
      } catch (e) { /* 音が出なくてもゲームは続ける */ }
    },

    click: function () { this.tone(880, 0.06, 'sine', 0.06); },
    drop: function () { this.tone(700, 0.13, 'triangle', 0.1, 360); },
    merge: function (level) {
      const base = 260 + level * 55;
      this.tone(base, 0.11, 'sine', 0.16, base * 1.7);
      this.tone(base * 1.5, 0.13, 'triangle', 0.08, null, 0.05);
    },
    big: function () {
      [523, 659, 784, 1047].forEach(function (f, i) { PPG.Sound.tone(f, 0.2, 'triangle', 0.12, null, i * 0.08); });
    },
    god: function () {
      [392, 523, 659, 784, 1047, 1319].forEach(function (f, i) { PPG.Sound.tone(f, 0.35, 'sine', 0.13, null, i * 0.1); });
    },
    special: function () {
      [880, 1175, 1568].forEach(function (f, i) { PPG.Sound.tone(f, 0.12, 'square', 0.05, null, i * 0.06); });
    },
    item: function () { this.tone(520, 0.2, 'sine', 0.12, 1040); },
    danger: function () { this.tone(220, 0.12, 'square', 0.04); },
    over: function () {
      [440, 370, 311, 262].forEach(function (f, i) { PPG.Sound.tone(f, 0.28, 'sine', 0.13, null, i * 0.15); });
    }
  };
})(window.PPG);

/* ---------- パグの世界 用の効果音（WebAudio合成） ---------- */
(function (PPG) {
  const S = PPG.Sound;
  function seq(notes, dur, type, vol, gap) {
    notes.forEach(function (f, i) { S.tone(f, dur, type, vol, null, i * gap); });
  }
  Object.assign(S, {
    move: function () { this.tone(520, 0.03, 'sine', 0.035); },
    rotate: function () { this.tone(760, 0.05, 'triangle', 0.05, 900); },
    lock: function () { this.tone(300, 0.08, 'triangle', 0.08, 180); },
    hardDrop: function () { this.tone(420, 0.12, 'triangle', 0.1, 140); },
    clear: function (lines, chain) {
      const base = 523 * Math.pow(1.12, chain);
      const n = Math.min(4, lines);
      const notes = [base, base * 1.26, base * 1.5, base * 2].slice(0, n + 1);
      seq(notes, 0.14, 'triangle', 0.11, 0.06);
    },
    fuse: function (lv) { this.merge(lv * 2 + 1); },
    burst: function () { seq([523, 659, 784, 1047, 1319, 1568], 0.25, 'sine', 0.12, 0.07); },
    hit: function () { this.tone(180, 0.12, 'square', 0.06, 90); this.tone(900, 0.08, 'sine', 0.06, 400, 0.02); },
    hurt: function () { this.tone(330, 0.18, 'sawtooth', 0.05, 160); },
    guard: function () { this.tone(1200, 0.08, 'sine', 0.05, 1500); },
    heal: function () { seq([660, 880, 990], 0.12, 'sine', 0.07, 0.05); },
    rise: function () { this.tone(140, 0.25, 'square', 0.05, 90); },
    skill: function () { seq([784, 988, 1175, 1568], 0.16, 'square', 0.05, 0.05); },
    win: function () { seq([523, 659, 784, 1047, 784, 1047], 0.2, 'triangle', 0.11, 0.1); },
    levelUp: function () { seq([392, 523, 659, 784, 1047], 0.22, 'sine', 0.12, 0.08); },
    talk: function () { this.tone(640 + Math.random() * 120, 0.035, 'sine', 0.035); },
    choice: function () { this.tone(988, 0.1, 'triangle', 0.08, 1320); }
  });
})(window.PPG);
