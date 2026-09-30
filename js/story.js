/* =========================================================
 * パグの世界 - story.js
 * 会話シーンを1行ずつ表示する。選択肢の結果（好感度・フラグ・アイテムなど）もここで反映。
 * ========================================================= */
'use strict';
(function (PW) {
  const $ = function (id) { return document.getElementById(id); };

  PW.Story = {
    queue: null,
    done: null,
    typing: null,
    busy: false,

    /** キャラクターの見た目・名前 */
    speaker: function (who) {
      if (who === 'hero') return { name: PW.Save.data.hero.name, look: PW.heroLook(PW.Save.data.hero) };
      const c = PW.DATA.CHARACTERS[who];
      return c ? { name: c.name, look: c.look } : null;
    },

    fill: function (text) {
      const h = PW.Save.data.hero;
      return text.replace(/\{hero\}/g, h ? h.name : 'きみ');
    },

    /** シーンIDか、行の配列を再生する */
    play: function (scene, onDone) {
      const steps = typeof scene === 'string' ? (PW.DATA.SCENES[scene] || []) : scene;
      this.queue = steps.slice();
      this.done = onDone || null;
      this.busy = true;
      $('dialog').classList.remove('hidden');
      $('dialog').classList.add('open');
      this.advance();
    },

    advance: function () {
      if (this.choosing) return;
      if (this.typing) { this.finishTyping(); return; }
      const step = this.queue.shift();
      if (!step) { this.close(); return; }
      if (step.do) { this.doAction(step); this.advance(); return; }
      if (step.choice) { this.showChoice(step); return; }
      this.showLine(step);
    },

    showLine: function (step) {
      const box = $('dialog');
      const narr = step.who === 'narr';
      box.classList.toggle('narr', narr);
      const sp = narr ? null : this.speaker(step.who);
      $('dialog-name').textContent = sp ? sp.name : '';
      const cv = $('dialog-face');
      if (sp) {
        PW.PugArt.renderToCanvas(cv, PW.lookWithFace(sp.look, step.face), { fit: 1.25, offsetY: 0.08 });
        cv.classList.remove('bob');
        void cv.offsetWidth;
        cv.classList.add('bob');
      }
      $('dialog-choices').innerHTML = '';
      this.typeText(this.fill(step.t));
    },

    typeText: function (text) {
      const el = $('dialog-text');
      const self = this;
      const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduce) { el.textContent = text; return; }
      let i = 0;
      el.textContent = '';
      this.typing = { text: text, id: setInterval(function () {
        i += 1;
        el.textContent = text.slice(0, i);
        if (i % 3 === 1 && PW.Sound && text[i - 1] !== '（') PW.Sound.talk();
        if (i >= text.length) self.finishTyping();
      }, 28) };
    },

    finishTyping: function () {
      if (!this.typing) return;
      clearInterval(this.typing.id);
      $('dialog-text').textContent = this.typing.text;
      this.typing = null;
    },

    showChoice: function (step) {
      const d = PW.Save.data;
      // 一度選んだ選択肢は、再プレイ時には聞かない
      if (d.choices[step.choice]) { this.advance(); return; }
      const box = $('dialog');
      box.classList.add('narr');
      $('dialog-name').textContent = '';
      $('dialog-text').textContent = step.q;
      const wrap = $('dialog-choices');
      wrap.innerHTML = '';
      const self = this;
      box.classList.add('choosing');
      this.choosing = true;
      step.options.forEach(function (op) {
        const b = document.createElement('button');
        b.className = 'btn btn-choice';
        b.type = 'button';
        b.textContent = op.label;
        b.addEventListener('click', function (e) {
          e.stopPropagation();
          if (PW.Sound) PW.Sound.choice();
          box.classList.remove('choosing');
          self.choosing = false;
          wrap.innerHTML = '';
          d.choices[step.choice] = op.id;
          self.applyEffects(op.effects || {});
          PW.Save.save();
          self.queue = (op.after || []).concat(self.queue);
          self.advance();
        });
        wrap.appendChild(b);
      });
    },

    applyEffects: function (fx) {
      const S = PW.Save, d = S.data;
      if (fx.love) Object.keys(fx.love).forEach(function (id) { S.addLove(id, fx.love[id]); });
      if (fx.bonus) Object.keys(fx.bonus).forEach(function (k) { d.bonus[k] = (d.bonus[k] || 0) + fx.bonus[k]; });
      if (fx.exp) S.addExp(fx.exp);
      if (fx.treats) Object.keys(fx.treats).forEach(function (k) { S.addTreat(k, fx.treats[k]); });
      if (fx.flag) d.flags[fx.flag] = true;
    },

    doAction: function (step) {
      const S = PW.Save;
      if (step.do === 'meet') {
        if (S.meet(step.id) && PW.UI) PW.UI.toast('パグ図鑑に「' + PW.DATA.CHARACTERS[step.id].name + '」が登録された');
      } else if (step.do === 'join') {
        S.data.party[step.id] = S.data.party[step.id] || { joined: true, love: 0 };
        S.data.party[step.id].joined = true;
        S.meet(step.id);
      }
      S.save();
    },

    skip: function () {
      if (this.choosing) return;
      // 選択肢の手前まで飛ばす（選択肢は飛ばさない）
      this.finishTyping();
      while (this.queue.length && !(this.queue[0].choice && !PW.Save.data.choices[this.queue[0].choice])) {
        const s = this.queue.shift();
        if (s.do) this.doAction(s);
      }
      this.advance();
    },

    close: function () {
      this.finishTyping();
      this.busy = false;
      const box = $('dialog');
      box.classList.remove('open');
      box.classList.add('hidden');
      const cb = this.done;
      this.done = null;
      if (cb) cb();
    }
  };
})(window.PW);
