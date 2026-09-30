/* =========================================================
 * パグの世界 - ui.js
 * 画面の切りかえ・パネル・バトルのHUD・村の画面・図鑑。
 * （パネルの重ね方は PUG PUG GARDEN の ui.js を参考にしている）
 * ========================================================= */
'use strict';
(function (PW) {
  const $ = function (id) { return document.getElementById(id); };
  const D = function () { return PW.DATA; };

  function stars(n) { let s = ''; for (let i = 0; i < 5; i++) s += i < n ? '★' : '☆'; return s; }
  function heroName() { return PW.Save.data.hero ? PW.Save.data.hero.name : ''; }
  function renderFace(canvas, look, face) {
    PW.PugArt.renderToCanvas(canvas, PW.lookWithFace(look, face), { fit: 1.3, offsetY: 0.06 });
  }
  function replay(el, cls) { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }

  const UI = {
    stack: [],
    confirmCb: null,
    toastTimer: 0,
    sayTimer: 0,
    shoutTimer: 0,
    currentHeroFace: '',

    /* =========================================================
     * 画面とパネル
     * ========================================================= */
    show: function (id) {
      ['screen-title', 'screen-create', 'screen-village', 'screen-battle'].forEach(function (s) {
        $(s).classList.toggle('hidden', s !== id);
      });
      this.screen = id;
      if (id === 'screen-title') TitleScene.start(); else TitleScene.stop();
    },

    open: function (id) {
      $(id).classList.remove('hidden');
      if (this.stack.indexOf(id) < 0) this.stack.push(id);
      const btn = $(id).querySelector('.btn-primary, .btn');
      if (btn && !('ontouchstart' in window)) btn.focus({ preventScroll: true });
    },

    close: function (id) {
      id = id || this.stack[this.stack.length - 1];
      if (!id) return;
      $(id).classList.add('hidden');
      this.stack = this.stack.filter(function (s) { return s !== id; });
    },

    closeAll: function () {
      const self = this;
      this.stack.slice().forEach(function (id) { self.close(id); });
    },

    top: function () { return this.stack[this.stack.length - 1]; },

    confirm: function (text, yes, cb) {
      $('confirm-text').textContent = text;
      $('confirm-yes').textContent = yes || 'OK';
      this.confirmCb = cb;
      this.open('ov-confirm');
    },

    answer: function (ok) {
      const cb = this.confirmCb;
      this.confirmCb = null;
      this.close('ov-confirm');
      if (ok && cb) cb();
    },

    toast: function (text, ms) {
      const el = $('toast');
      el.textContent = text;
      el.classList.add('show');
      clearTimeout(this.toastTimer);
      this.toastTimer = setTimeout(function () { el.classList.remove('show'); }, ms || 2200);
    },

    banner: function (main, sub) {
      $('banner-main').textContent = main;
      $('banner-sub').textContent = sub || '';
      replay($('banner'), 'show');
    },

    flash: function () { replay($('screen-flash'), 'show'); },

    updateSound: function () {
      const on = PW.Save.data.settings.sound;
      document.querySelectorAll('.js-sound').forEach(function (b) { b.textContent = on ? '音 ON' : '音 OFF'; });
    },

    /* =========================================================
     * キャラクター作成
     * ========================================================= */
    create: { coat: 'fawn', collar: 'red' },

    renderCreate: function () {
      const self = this;
      const coats = $('coat-chips'), collars = $('collar-chips');
      coats.innerHTML = '';
      collars.innerHTML = '';
      D().COATS.forEach(function (c) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'chip';
        b.setAttribute('role', 'radio');
        b.setAttribute('aria-checked', String(c.id === self.create.coat));
        b.innerHTML = '<i style="background:' + c.look.body + '"></i>' + c.name;
        b.addEventListener('click', function () { self.create.coat = c.id; if (PW.Sound) PW.Sound.click(); self.renderCreate(); });
        coats.appendChild(b);
      });
      D().COLLARS.forEach(function (c) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'chip';
        b.setAttribute('role', 'radio');
        b.setAttribute('aria-checked', String(c.id === self.create.collar));
        b.innerHTML = '<i style="background:' + c.color + '"></i>' + c.name;
        b.addEventListener('click', function () { self.create.collar = c.id; if (PW.Sound) PW.Sound.click(); self.renderCreate(); });
        collars.appendChild(b);
      });
      const look = PW.heroLook({ coat: this.create.coat, collar: this.create.collar });
      renderFace($('create-preview'), look, 'happy');
    },

    /* =========================================================
     * 村
     * ========================================================= */
    renderVillage: function () {
      const d = PW.Save.data, st = PW.heroStats(d);
      $('st-name').textContent = d.hero.name;
      $('st-lv').textContent = 'Lv ' + d.hero.lv;
      $('st-exp').style.width = Math.min(100, d.hero.exp / PW.expToNext(d.hero.lv) * 100) + '%';
      $('st-hp').textContent = st.maxHp;
      $('st-atk').textContent = st.atk;
      $('st-def').textContent = st.def;
      $('st-bone').textContent = d.bonePieces;
      $('btn-mochi').classList.toggle('hidden', !(d.party.mochi && d.party.mochi.joined));
      this.drawVillage();
    },

    drawVillage: function () {
      const cv = $('village-canvas');
      const rect = cv.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(10, Math.round(rect.width * dpr)), h = Math.max(10, Math.round(rect.height * dpr));
      cv.width = w; cv.height = h;
      const ctx = cv.getContext('2d');
      ctx.drawImage(PW.Background.get('garden', w, h), 0, 0);
      const d = PW.Save.data;
      const r = h * 0.17;
      const hasMochi = d.party.mochi && d.party.mochi.joined;
      const heroX = hasMochi ? w * 0.38 : w * 0.5;
      PW.PugArt.drawPug(ctx, PW.lookWithFace(PW.heroLook(d.hero), 'happy'), heroX, h * 0.74, r, 1);
      if (hasMochi) PW.PugArt.drawPug(ctx, PW.lookWithFace(D().CHARACTERS.mochi.look, PW.Save.love('mochi') >= 30 ? 'love' : 'happy'), w * 0.62, h * 0.76, r * 0.95, 1);
      PW.PugArt.drawPug(ctx, D().CHARACTERS.elder.look, w * 0.85, h * 0.78, r * 0.75, 1);
    },

    renderMap: function () {
      const list = $('map-list');
      list.innerHTML = '';
      const d = PW.Save.data;
      D().REGIONS.forEach(function (rg) {
        const li = document.createElement('li');
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'map-item';
        let status = 'まだ霧につつまれている';
        if (rg.home) { b.classList.add('home'); status = 'いまいる場所'; b.disabled = true; }
        else if (rg.stage) {
          b.classList.add('open');
          const st = D().STAGES[rg.stage];
          status = st.name + (d.cleared[rg.stage] ? '（クリア ' + d.cleared[rg.stage] + '回）' : '（ボスがいる！）');
          b.dataset.action = 'start-stage';
          b.dataset.stage = rg.stage;
        } else { b.classList.add('locked'); b.disabled = true; }
        const known = rg.home || rg.stage;
        b.innerHTML = '<span class="ic">' + (known ? rg.icon : '？') + '</span><span class="nm">' +
          (known ? rg.name : '？？？') + '<br><span class="st">' + status + '</span></span>';
        li.appendChild(b);
        list.appendChild(li);
      });
    },

    renderMochi: function () {
      const love = PW.Save.love('mochi');
      const steps = D().AFFECTION_STEPS;
      let cur = steps[0], next = null;
      steps.forEach(function (s) { if (love >= s.at) cur = s; else if (!next) next = s; });
      renderFace($('mochi-face'), D().CHARACTERS.mochi.look, love >= 30 ? 'love' : 'happy');
      $('love-label').textContent = '好感度：' + cur.label;
      const hearts = Math.min(5, Math.floor(love / 20));
      $('love-hearts').textContent = '♥'.repeat(hearts) + '♡'.repeat(5 - hearts);
      $('love-hearts').setAttribute('aria-label', love + ' / 100');
      $('love-bar').style.width = love + '%';
      $('love-next').textContent = next ? ('あと ' + (next.at - love) + ' で「' + next.label + '」' + (next.unlock ? '：' + next.unlock : '')) : 'これ以上ないくらい、なかよし！';
      this.renderTreatList($('give-list'), 'give');
    },

    renderBag: function () { this.renderTreatList($('bag-list'), 'eat'); },

    renderTreatList: function (el, mode) {
      el.innerHTML = '';
      const bag = PW.Save.data.treats;
      const U = D().TREAT_USE;
      D().TREATS.forEach(function (T, t) {
        for (let lv = 2; lv <= PW.RULES.MAX_LV; lv++) {
          const k = PW.treatKey(t, lv);
          const n = bag[k] || 0;
          if (!n) continue;
          const b = document.createElement('button');
          b.type = 'button';
          b.className = 'give-item';
          b.dataset.action = mode === 'give' ? 'give-treat' : 'eat-treat';
          b.dataset.key = k;
          const cv = document.createElement('canvas');
          cv.width = cv.height = 72;
          PW.TreatArt.render(cv, t, lv);
          const gain = mode === 'give' ? '好感度+' + Math.round(U.love[lv] * (T.id === U.favorite ? U.favoriteMult : 1)) : '経験値+' + U.exp[lv];
          const label = document.createElement('span');
          label.innerHTML = T.levels[lv].name + '<br><small>' + gain + '</small>';
          const num = document.createElement('span');
          num.className = 'n';
          num.textContent = '×' + n;
          b.appendChild(cv); b.appendChild(label); b.appendChild(num);
          el.appendChild(b);
        }
      });
    },

    /* =========================================================
     * 図鑑
     * ========================================================= */
    zukanTab: 'pugs',

    renderZukan: function (tab) {
      this.zukanTab = tab || this.zukanTab;
      document.querySelectorAll('#ov-zukan .tab').forEach(function (b) {
        const on = b.dataset.tab === UI.zukanTab;
        b.classList.toggle('is-on', on);
        b.setAttribute('aria-selected', String(on));
      });
      const grid = $('zukan-grid');
      grid.innerHTML = '';
      const z = PW.Save.data.zukan;
      let got = 0, total = 0;
      if (this.zukanTab === 'pugs') {
        D().PUG_ZUKAN.forEach(function (id) {
          total++;
          const open = !!z.pugs[id];
          if (open) got++;
          const ch = id === 'hero' ? { name: heroName(), look: PW.heroLook(PW.Save.data.hero) } : D().CHARACTERS[id];
          const cell = UI.zukanCell(open ? ch.name : '？？？', open, 'pug:' + id);
          PW.PugArt.renderToCanvas(cell.firstChild, ch.look, { fit: 1.3, silhouette: !open });
          grid.appendChild(cell);
        });
        $('zukan-count').textContent = 'であったパグ ' + got + ' / ' + total;
      } else {
        D().TREATS.forEach(function (T, t) {
          for (let lv = 1; lv <= PW.RULES.MAX_LV; lv++) {
            total++;
            const open = !!z.treats[PW.treatKey(t, lv)];
            if (open) got++;
            const cell = UI.zukanCell(open ? T.levels[lv].name : '？？？', open, 'treat:' + t + ':' + lv);
            PW.TreatArt.render(cell.firstChild, t, lv, !open);
            grid.appendChild(cell);
          }
        });
        $('zukan-count').textContent = 'みつけたおやつ ' + got + ' / ' + total;
      }
    },

    zukanCell: function (name, open, key) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'zukan-cell' + (open ? '' : ' locked');
      b.dataset.action = 'zukan-detail';
      b.dataset.key = key;
      const cv = document.createElement('canvas');
      cv.width = cv.height = 128;
      b.appendChild(cv);
      const s = document.createElement('span');
      s.textContent = name;
      b.appendChild(s);
      return b;
    },

    showDetail: function (key) {
      const parts = key.split(':');
      const meta = $('detail-meta');
      meta.innerHTML = '';
      function row(k, v) { meta.insertAdjacentHTML('beforeend', '<dt>' + k + '</dt><dd>' + v + '</dd>'); }
      const cv = $('detail-canvas');
      if (parts[0] === 'pug') {
        const id = parts[1];
        const open = !!PW.Save.data.zukan.pugs[id];
        if (id === 'hero') {
          const h = PW.Save.data.hero;
          PW.PugArt.renderToCanvas(cv, PW.lookWithFace(PW.heroLook(h), 'happy'), { fit: 1.3 });
          $('detail-kind').textContent = 'きみのパグ';
          $('detail-name').textContent = h.name;
          $('detail-rarity').textContent = '';
          $('detail-desc').textContent = 'しあわせの骨の欠片をさがして旅をしている。おやつをそろえるのが得意。';
          row('レベル', h.lv);
        } else {
          const c = D().CHARACTERS[id];
          PW.PugArt.renderToCanvas(cv, c.look, { fit: 1.3, silhouette: !open });
          $('detail-kind').textContent = open ? c.kind : '？？？';
          $('detail-name').textContent = open ? c.name : '？？？';
          $('detail-rarity').textContent = stars(c.rarity);
          $('detail-desc').textContent = open ? c.desc : 'まだ出会っていないパグ。世界のどこかで待っている。';
          if (open) {
            if (c.where) row('出会った場所', c.where);
            if (c.skill) row('スキル', c.skill.name + '：' + c.skill.desc);
            if (c.passive) row('とくい', c.passive);
            if (PW.Save.data.party[id]) row('好感度', PW.Save.love(id) + ' / 100');
          }
        }
      } else {
        const t = +parts[1], lv = +parts[2];
        const T = D().TREATS[t], L = T.levels[lv];
        const open = !!PW.Save.data.zukan.treats[PW.treatKey(t, lv)];
        PW.TreatArt.render(cv, t, lv, !open);
        $('detail-kind').textContent = open ? T.name + '・' + ['', '小', '中', '大'][lv] : '？？？';
        $('detail-name').textContent = open ? L.name : '？？？';
        $('detail-rarity').textContent = stars(L.rarity);
        $('detail-desc').textContent = open ? L.desc : (lv === 1 ? '冒険に出ると見つかる。' : '同じおやつを3つくっつけると……？');
        if (open) {
          row('効果', T.effect);
          row('手に入る場所', lv === 1 ? 'おやつの森（盤面に降ってくる）' : '盤面で融合');
          row('ちから', PW.RULES.VALUE[lv]);
        }
      }
      this.open('ov-detail');
    },

    /* =========================================================
     * バトルのHUD（battle.js から呼ばれる）
     * ========================================================= */
    battleStart: function (b) {
      this.battle = b;
      this.show('screen-battle');
      $('hud-hero-name').textContent = heroName() + ' Lv' + PW.Save.data.hero.lv;
      this.heroLookCache = PW.heroLook(PW.Save.data.hero);
      this.currentHeroFace = '';
      this.heroFace('brave');
      renderFace($('skill-face'), D().CHARACTERS.mochi.look, 'happy');
      renderFace($('say-face'), D().CHARACTERS.mochi.look, 'happy');
      $('btn-skill').classList.toggle('off', !b.hasMochi);
      $('btn-skill').classList.remove('ready');
      $('say').classList.remove('show');
      $('dmg-layer').innerHTML = '';
      if (PW.Main) PW.Main.resizeBoard();
    },

    setNext: function (p) { PW.Puzzle.renderPiece($('next-canvas'), p); },

    setEnemy: function (e) {
      $('hud-enemy-name').textContent = e.name;
      renderFace($('enemy-face'), e.look, 'default');
      const wrap = document.querySelector('.enemy-face-wrap');
      wrap.classList.remove('down');
      $('screen-battle').classList.toggle('boss', !!e.wave.boss);
      this.setEnemyTimer(1, false);
      replay($('enemy-face'), 'react');
    },

    setEnemyTimer: function (ratio, urgent) {
      $('enemy-timer').style.strokeDashoffset = String(113.1 * (1 - ratio));
      document.querySelector('.timer-ring').classList.toggle('urgent', !!urgent);
    },

    setHud: function (h) {
      $('hud-hp').style.width = (h.hp / h.maxHp * 100) + '%';
      $('hud-shield').style.width = Math.min(100, h.shield / h.maxHp * 100) + '%';
      $('hud-hp-bar').classList.toggle('low', h.hp / h.maxHp < 0.3);
      $('hud-hp-num').textContent = 'HP ' + h.hp + '/' + h.maxHp;
      $('hud-shield-num').textContent = h.shield > 0 ? 'ガード ' + h.shield : '';
      $('hud-hp-bar').setAttribute('aria-label', 'HP ' + h.hp + '/' + h.maxHp);
      $('hud-enemy').style.width = (h.enemyHp / h.enemyMax * 100) + '%';
      $('hud-enemy-num').textContent = 'HP ' + h.enemyHp + '/' + h.enemyMax;
      $('hud-enemy-bar').setAttribute('aria-label', '敵のHP ' + h.enemyHp + '/' + h.enemyMax);
      $('skill-gauge').style.width = (h.gauge / h.gaugeMax * 100) + '%';
    },

    heroFace: function (face) {
      if (face === this.currentHeroFace) return;
      this.currentHeroFace = face;
      const cv = $('hero-face');
      renderFace(cv, this.heroLookCache || PW.heroLook(PW.Save.data.hero), face === 'normal' ? 'default' : face);
      replay(cv, 'react');
    },

    say: function (who, text, ms) {
      const el = $('say');
      $('say-text').textContent = text;
      el.classList.add('show');
      clearTimeout(this.sayTimer);
      if (ms > 0) this.sayTimer = setTimeout(function () { el.classList.remove('show'); }, ms);
    },

    hideSay: function () { $('say').classList.remove('show'); },

    popDamage: function (html, cls) {
      const el = document.createElement('div');
      el.className = 'dmg ' + (cls || '');
      el.innerHTML = html;
      $('dmg-layer').appendChild(el);
      setTimeout(function () { el.remove(); }, 1000);
    },

    damageEnemy: function (dmg, label) {
      replay(document.querySelector('.enemy-face-wrap'), 'hit');
      this.popDamage('-' + dmg + (label ? '<small>' + label + '</small>' : ''), '');
    },

    enemyAttack: function (dmg, blocked, mischief) {
      if (dmg > 0) this.popDamage('-' + dmg + (blocked ? '<small>ガードで' + blocked + '防いだ</small>' : ''), 'to-hero');
      else this.popDamage('ガード！<small>' + blocked + '防いだ</small>', 'to-hero guarded');
      if (navigator.vibrate && dmg > 0) { try { navigator.vibrate(40); } catch (e) { /* 非対応 */ } }
      if (!mischief) this.enemyShout(['えいっ！', 'たいあたり！', 'くらえー！'][Math.floor(Math.random() * 3)]);
    },

    enemyShout: function (text) {
      const el = $('enemy-shout');
      el.textContent = text;
      el.classList.add('show');
      clearTimeout(this.shoutTimer);
      this.shoutTimer = setTimeout(function () { el.classList.remove('show'); }, 1400);
    },

    enemyDown: function (e) {
      renderFace($('enemy-face'), e.look, 'sad');
      document.querySelector('.enemy-face-wrap').classList.add('down');
      this.setEnemyTimer(0, false);
      this.hideSay();
    },

    comboPop: function (n) {
      const el = $('combo-pop');
      el.textContent = n + ' コンボ！';
      replay(el, 'show');
    },

    skillReady: function (on) { $('btn-skill').classList.toggle('ready', !!on); },

    skillCutin: function () {
      renderFace($('cutin-face'), D().CHARACTERS.mochi.look, 'love');
      replay($('cutin'), 'show');
    },

    /* バトル中は盤面を隠さないよう、結果画面でまとめて知らせる */
    newTreat: function (t, lv) {
      if (!this.battle || !this.battle.active) { this.toast('おやつ図鑑に「' + D().TREATS[t].levels[lv].name + '」が登録された'); return; }
      this.battle.newTreats = this.battle.newTreats || [];
      this.battle.newTreats.push(D().TREATS[t].levels[lv].name);
    },

    playScene: function (id, cb) {
      this.hideSay();
      PW.Story.play(id, cb);
    },

    showResult: function (r) {
      this.lastResult = r;
      const won = r.won;
      $('result-title').textContent = won ? 'ステージクリア！' : 'ひと休み……';
      renderFace($('result-face'), this.heroLookCache || PW.heroLook(PW.Save.data.hero), won ? 'sparkle' : 'sad');
      $('result-msg').textContent = won ? (r.first ? 'しあわせの骨の欠片をひとつ見つけた！' : 'いい修行になった！') :
        (r.reason === 'pile' ? 'おやつが上までいっぱいになった。モチ「つぎは横一列を早めにそろえよう！」' :
          'HPがなくなった。モチ「キャンディとほねで、守りながら戦おう！」');
      const st = $('result-stats');
      st.innerHTML = '';
      [['経験値', '+' + r.exp], ['消したライン', r.run.lines], ['融合', r.run.fuses + '回'], ['最大コンボ', r.run.maxCombo || '―']]
        .forEach(function (p) { st.insertAdjacentHTML('beforeend', '<div><dt>' + p[0] + '</dt><dd>' + p[1] + '</dd></div>'); });
      const tr = $('result-treats');
      tr.innerHTML = '';
      Object.keys(r.treats).forEach(function (k) {
        const parts = k.split('_');
        const t = D().TREATS.findIndex(function (T) { return T.id === parts[0]; });
        const lv = +parts[1];
        const chip = document.createElement('span');
        chip.className = 'treat-chip';
        const cv = document.createElement('canvas');
        cv.width = cv.height = 60;
        PW.TreatArt.render(cv, t, lv);
        chip.appendChild(cv);
        chip.appendChild(document.createTextNode('×' + r.treats[k]));
        chip.title = D().TREATS[t].levels[lv].name;
        tr.appendChild(chip);
      });
      const nt = this.battle && this.battle.newTreats;
      if (nt && nt.length) {
        tr.insertAdjacentHTML('beforeend', '<p class="panel-note small" style="width:100%;margin:6px 0 0">図鑑に登録：' + nt.join('、') + '</p>');
        this.battle.newTreats = [];
      }
      const lvEl = $('result-lv');
      if (r.ups > 0) {
        lvEl.textContent = 'レベルアップ！ Lv' + r.lvBefore + ' → Lv' + r.lvAfter + '（HP・こうげき・ぼうぎょが上がった）';
        lvEl.classList.remove('hidden');
        if (PW.Sound) setTimeout(function () { PW.Sound.levelUp(); }, 400);
      } else {
        const h = PW.Save.data.hero;
        lvEl.textContent = 'つぎのレベルまで あと ' + (PW.expToNext(h.lv) - h.exp);
        lvEl.classList.remove('hidden');
      }
      this.open('ov-result');
    }
  };

  /* =========================================================
   * タイトル画面の背景（おやつがふわふわ降ってきて、パグたちが見上げている）
   * ========================================================= */
  const TitleScene = {
    raf: 0, items: [], last: 0,
    start: function () {
      if (this.raf) return;
      const cv = $('title-canvas');
      this.cv = cv;
      this.items = [];
      for (let i = 0; i < 14; i++) this.items.push(this.makeItem(true));
      this.last = performance.now();
      const self = this;
      const loop = function (now) {
        self.raf = requestAnimationFrame(loop);
        const dt = Math.min(50, now - self.last);
        self.last = now;
        self.draw(dt);
      };
      this.raf = requestAnimationFrame(loop);
    },
    stop: function () { cancelAnimationFrame(this.raf); this.raf = 0; },
    makeItem: function (anywhere) {
      return { x: Math.random(), y: anywhere ? Math.random() * 0.55 : -0.1, t: Math.floor(Math.random() * 3),
        lv: 1 + Math.floor(Math.random() * 3), s: 0.6 + Math.random() * 0.6, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.002,
        v: 0.00003 + Math.random() * 0.00004 };
    },
    draw: function (dt) {
      const cv = this.cv;
      const rect = cv.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.round(rect.width * dpr), h = Math.round(rect.height * dpr);
      if (!w || !h) return;
      if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
      const ctx = cv.getContext('2d');
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(PW.Background.get('garden', w, h), 0, 0);
      const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const u = Math.min(w, h * 0.6);
      const self = this;
      this.items.forEach(function (it, i) {
        if (!reduce) { it.y += it.v * dt; it.rot += it.vr * dt; }
        if (it.y > 0.6) self.items[i] = self.makeItem(false);
        const size = u * 0.1 * it.s;
        ctx.save();
        ctx.globalAlpha = 0.9;
        ctx.translate(it.x * w, it.y * h);
        ctx.rotate(it.rot);
        ctx.drawImage(PW.TreatArt.tile(it.t, it.lv, size), -size / 2, -size / 2, size, size);
        ctx.restore();
      });
      const C = D().CHARACTERS;
      const base = h * 0.62;
      const r = u * 0.13;
      PW.PugArt.drawPug(ctx, PW.lookWithFace(C.mochi.look, 'sparkle'), w * 0.3, base, r, 1);
      PW.PugArt.drawPug(ctx, PW.lookWithFace(PW.makeLook({ collar: '#E8504F', tag: true, wrinkles: 3 }), 'happy'), w * 0.52, base - r * 0.15, r * 1.12, 1);
      PW.PugArt.drawPug(ctx, C.doron.look, w * 0.76, base + r * 0.1, r * 0.92, 1);
    }
  };

  PW.UI = UI;
})(window.PW);
