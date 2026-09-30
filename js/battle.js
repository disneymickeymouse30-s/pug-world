/* =========================================================
 * パグの世界 - battle.js
 * パズルで起きたこと（ライン消去・融合・連鎖）を、冒険の出来事に変える。
 *   クッキー → こうげき / ほね → ガード / キャンディ → かいふく＋スキルゲージ
 *   敵は一定時間ごとに攻撃し、ときどき「いたずら」でお邪魔ブロックをせり上げる。
 * 画面の表示は ui（main.js から渡される）に任せる。
 * ========================================================= */
'use strict';
(function (PW) {
  const R = PW.RULES;

  PW.Battle = function (puzzle, ui) {
    this.puzzle = puzzle;
    this.ui = ui;
    this.active = false;
    const self = this;
    puzzle.hooks = {
      onNext: function (p) { ui.setNext(p); },
      onSpawn: function (p) { self.onSpawn(p); },
      onMove: function () { self.onUserMove(); },
      onRotate: function () { self.onUserMove(); },
      onLock: function () { if (PW.Sound) PW.Sound.lock(); },
      onClearStart: function (n, combo) { if (PW.Sound) PW.Sound.clear(n, combo); },
      onClear: function (info) { self.onClear(info); },
      onFuse: function (info) { self.onFuse(info); },
      onResolveEnd: function (info) { return self.onResolveEnd(info); },
      onTopOut: function () { self.lose('pile'); }
    };
  };
  const Bt = PW.Battle.prototype;

  /* =========================================================
   * 開始
   * ========================================================= */
  Bt.start = function (stageId) {
    const save = PW.Save.data;
    this.save = save;
    this.stage = PW.DATA.STAGES[stageId];
    this.stats = PW.heroStats(save);
    this.hero = { hp: this.stats.maxHp, maxHp: this.stats.maxHp, atk: this.stats.atk, def: this.stats.def };
    this.shield = 0;
    this.gauge = 0;
    this.runExp = 0;
    this.runTreats = {};
    this.run = { lines: 0, fuses: 0, bursts: 0, maxCombo: 0, damage: 0, defeated: 0 };
    this.waveIndex = -1;
    this.lvStart = save.hero.lv;
    this.phase = 'fight';
    this.active = true;
    this.faceTimer = 0;
    this.quietTimer = 6000;
    this.tutorial = !save.tutorial.battle;
    this.tut = { moved: false, fused: false, cleared: false, gauge: false, rotateTip: false };
    this.hasMochi = !!(save.party.mochi && save.party.mochi.joined);
    this.puzzle.reset({ fallMs: this.stage.waves[0].fallMs });
    this.ui.battleStart(this);
    this.nextWave();
    this.puzzle.start();
    if (this.tutorial) {
      this.say('mochi', '指で左右にうごかして、タップで回転だよ！ ためしに動かしてみて！', 0);
    } else {
      this.say('mochi', 'いくよ、{hero}！ おやつをそろえて、大きく育てよう！', 2600);
    }
  };

  Bt.nextWave = function () {
    this.waveIndex++;
    const w = this.stage.waves[this.waveIndex];
    const def = PW.DATA.CHARACTERS[w.enemy];
    this.enemy = {
      wave: w, id: w.enemy, name: w.title || def.name, look: def.look,
      hp: w.hp, maxHp: w.hp, atk: w.atk, interval: w.interval * 1000, timer: w.interval * 1000,
      attacks: 0, down: false
    };
    this.puzzle.setFallMs(w.fallMs);
    this.phase = 'fight';
    this.ui.setEnemy(this.enemy);
    this.refresh();
  };

  /* =========================================================
   * 毎フレーム
   * ========================================================= */
  Bt.update = function (dt) {
    if (!this.active) return;
    const pz = this.puzzle;
    if (this.faceTimer > 0) {
      this.faceTimer -= dt;
      if (this.faceTimer <= 0) this.ui.heroFace(this.baseFace());
    }
    if (this.phase !== 'fight' || pz.paused || pz.mode !== 'fall') return;
    // チュートリアル中は、最初にラインを消すまで敵は動かない
    if (this.tutorial && !this.tut.cleared) return;
    const e = this.enemy;
    e.timer -= dt;
    this.ui.setEnemyTimer(Math.max(0, e.timer / e.interval), e.timer < 3000);
    if (e.timer <= 0) this.enemyAct();

    this.quietTimer -= dt;
    if (this.quietTimer <= 0) {
      this.quietTimer = 14000 + Math.random() * 8000;
      if (!this.tutorial && pz.stackHeight() >= PW.BOARD.ROWS - 5) this.say('mochi', '上まで来てる！ 横一列を早めにそろえよう！', 2600);
    }
  };

  Bt.baseFace = function () {
    const r = this.hero.hp / this.hero.maxHp;
    if (r < 0.3) return 'worried';
    if (this.puzzle.stackHeight() >= PW.BOARD.ROWS - 3) return 'worried';
    return 'normal';
  };

  Bt.react = function (face, ms) {
    this.ui.heroFace(face);
    this.faceTimer = ms || 1300;
  };

  Bt.say = function (who, text, ms) {
    this.ui.say(who, text.replace(/\{hero\}/g, this.save.hero.name), ms);
  };

  Bt.refresh = function () {
    this.ui.setHud({
      hp: this.hero.hp, maxHp: this.hero.maxHp, shield: this.shield,
      gauge: this.gauge, gaugeMax: R.GAUGE_MAX, hasSkill: this.hasMochi,
      enemyHp: this.enemy ? this.enemy.hp : 0, enemyMax: this.enemy ? this.enemy.maxHp : 1
    });
  };

  /* =========================================================
   * パズルからの知らせ
   * ========================================================= */
  Bt.onSpawn = function (p) {
    const s = PW.Save;
    const self = this;
    p.m.forEach(function (row) {
      row.forEach(function (c) {
        if (c && s.seeTreat(c.t, c.lv)) self.ui.newTreat(c.t, c.lv);
      });
    });
    if (this.tutorial && this.tut.moved && !this.tut.rotateTip) {
      this.tut.rotateTip = true;
      this.say('mochi', 'いいね！ 下にシュッとはらうと一気に落ちるよ。横一列そろえてみよう！', 0);
    }
  };

  Bt.onUserMove = function () {
    if (this.tutorial && !this.tut.moved) {
      this.tut.moved = true;
    }
  };

  Bt.lineMult = function (lines, combo) {
    return R.LINE_MULT[Math.min(4, lines)] * (1 + R.COMBO_BONUS * Math.max(0, combo - 1));
  };

  /** おやつの力を効果に変える（ライン消去・バースト共通） */
  Bt.applyPower = function (vals, mult, lines, rowY, label) {
    const h = this.hero, e = this.enemy;
    const pz = this.puzzle;
    const out = { dmg: 0, guard: 0, heal: 0, gauge: 0 };
    const mochiHeal = this.hasMochi ? 1.5 : 1;

    out.dmg = Math.round(h.atk * (vals[0] * 0.9 + 0.5 * lines) * mult);
    out.guard = Math.round((h.def * 0.6 + 1) * vals[1] * mult);
    out.heal = Math.round(vals[2] * 2 * mult * mochiHeal);
    out.gauge = Math.round(vals[2] * 6 * mult + lines * 4);

    if (out.dmg > 0 && e && !e.down) {
      e.hp = Math.max(0, e.hp - out.dmg);
      this.run.damage += out.dmg;
      this.ui.damageEnemy(out.dmg, label);
      if (PW.Sound) PW.Sound.hit();
    }
    if (out.guard > 0) {
      this.shield = Math.min(h.maxHp, this.shield + out.guard);
      pz.addText('ガード+' + out.guard, 1.5, rowY - 0.6, '#9CD2FF', 0.8, 900);
      if (PW.Sound) PW.Sound.guard();
    }
    if (out.heal > 0) {
      const before = h.hp;
      h.hp = Math.min(h.maxHp, h.hp + out.heal);
      if (h.hp > before) {
        pz.addText('回復+' + (h.hp - before), PW.BOARD.COLS - 2.5, rowY - 0.6, '#FFB3CD', 0.8, 900);
        if (PW.Sound) PW.Sound.heal();
      }
    }
    if (this.hasMochi) this.addGauge(out.gauge);
    if (e && e.hp <= 0 && !e.down) this.enemyDown();
    this.refresh();
    return out;
  };

  Bt.addGauge = function (n) {
    const was = this.gauge;
    this.gauge = Math.min(R.GAUGE_MAX, this.gauge + n);
    if (was < R.GAUGE_MAX && this.gauge >= R.GAUGE_MAX) {
      this.ui.skillReady(true);
      if (!this.tut.gauge) {
        this.tut.gauge = true;
        this.say('mochi', 'おなかすいた！ ……じゃなくて、ぼくの出番！ 下の「モチ」ボタンを押して！', 3200);
      }
    }
  };

  Bt.onClear = function (info) {
    const mult = this.lineMult(info.lines, info.combo);
    const label = info.lines >= 4 ? 'スペシャル！' : info.combo >= 2 ? info.combo + 'コンボ' : '';
    this.applyPower(info.vals, mult, info.lines, info.rowY, label);
    const self = this;
    info.gained.forEach(function (g) {
      if (g.lv >= 2) {
        const k = PW.treatKey(g.t, g.lv);
        self.runTreats[k] = (self.runTreats[k] || 0) + 1;
      }
    });
    this.run.lines += info.lines;
    const words = ['', 'そろった！', 'ダブル！', 'トリプル！', 'パグ祭り！'];
    this.puzzle.addText(words[Math.min(4, info.lines)], PW.BOARD.COLS / 2 - 0.5, info.rowY, '#FFD447', info.lines >= 4 ? 1.4 : 1.1, 1100);
    this.react(info.lines >= 4 || info.combo >= 3 ? 'sparkle' : 'happy', 1400);

    if (this.tutorial && !this.tut.cleared) {
      this.tut.cleared = true;
      this.say('mochi', 'そろった！ クッキーはこうげき、ほねはガード、キャンディはかいふくになるよ！', 3600);
      const me = this;
      setTimeout(function () {
        if (me.active && me.phase === 'fight') me.say('mochi', 'あっ、いたずらパグが動きだした！ 上の時計がなくなると攻撃してくるよ！', 3400);
      }, 3800);
    }
  };

  Bt.onFuse = function (info) {
    const self = this;
    const pz = this.puzzle;
    let big = false;
    info.results.forEach(function (r) {
      const T = PW.DATA.TREATS[r.t];
      if (r.burst) {
        big = true;
        self.run.bursts++;
        const vals = [0, 0, 0];
        vals[r.t] = R.VALUE[r.lv] * r.count * R.BURST_MULT;
        const names = { attack: 'クッキー', guard: 'ほね', heal: 'キャンディ' };
        pz.addText(names[T.role] + 'バースト！', r.x, r.y, '#FFE066', 1.5, 1500);
        self.applyPower(vals, 1, 0, r.y, 'バースト！');
        const k = PW.treatKey(r.t, r.lv);
        self.runTreats[k] = (self.runTreats[k] || 0) + 1;
        if (PW.Sound) PW.Sound.burst();
        self.ui.flash();
      } else {
        const name = T.levels[r.lv].name;
        pz.addText(name + '！', r.x, r.y, '#FFFFFF', r.lv >= 3 ? 1.1 : 0.85, 1100);
        if (PW.Save.seeTreat(r.t, r.lv)) self.ui.newTreat(r.t, r.lv);
        if (PW.Sound) PW.Sound.fuse(r.lv);
        if (r.lv >= 3) big = true;
      }
      self.run.fuses++;
      if (self.hasMochi) self.addGauge(3);
    });
    this.react(big ? 'sparkle' : 'love', 1400);
    this.refresh();
    if (this.tutorial && !this.tut.fused) {
      this.tut.fused = true;
      this.say('mochi', 'おやつが合体した！ 同じおやつが3つくっつくと、大きくなるんだ。大きいほど消したとき強いよ！', 4200);
    } else if (big && Math.random() < 0.6) {
      this.say('mochi', ['おいしそう……じゃなくて、すごい！', 'でっかーい！', 'よだれが止まらないよ……！'][Math.floor(Math.random() * 3)], 2000);
    }
  };

  Bt.onResolveEnd = function (info) {
    if (info.combo >= 2) {
      this.ui.comboPop(info.combo);
      if (info.combo > this.run.maxCombo) this.run.maxCombo = info.combo;
    }
    if (this.phase === 'enemyDown') {
      this.afterEnemyDown();
      return true;
    }
    if (this.phase !== 'fight') return true;
    if (this.faceTimer <= 0) this.ui.heroFace(this.baseFace());
    return false;
  };

  /* =========================================================
   * 敵の行動
   * ========================================================= */
  Bt.enemyAct = function () {
    const e = this.enemy, w = e.wave, h = this.hero;
    e.attacks++;
    e.timer = e.interval;
    const mischief = w.riseEvery && e.attacks % w.riseEvery === 0;
    const raw = Math.max(1, Math.round(e.atk - h.def * 0.4 + (Math.random() * 3 - 1)));
    const blocked = Math.min(this.shield, raw);
    this.shield -= blocked;
    const dmg = raw - blocked;
    h.hp = Math.max(0, h.hp - dmg);
    this.ui.enemyAttack(dmg, blocked, mischief);
    if (dmg > 0) { if (PW.Sound) PW.Sound.hurt(); this.react('sad', 1200); } else if (PW.Sound) PW.Sound.guard();
    if (mischief) {
      const rows = w.riseRows ? w.riseRows[Math.floor(e.attacks / w.riseEvery - 1) % w.riseRows.length] : 1;
      if (PW.Sound) PW.Sound.rise();
      this.ui.enemyShout(e.id === 'doron' ? 'おやつはいただくぜ！' : 'にしし！落とし穴だ！');
      if (!this.puzzle.addGarbage(rows)) return; // あふれた（onTopOut で負け）
    }
    this.refresh();
    if (h.hp <= 0) this.lose('hp');
    else if (h.hp / h.maxHp < 0.3 && Math.random() < 0.5) this.say('mochi', 'だいじょうぶ！？ キャンディをそろえて回復しよう！', 2400);
  };

  Bt.enemyDown = function () {
    const e = this.enemy;
    e.down = true;
    this.phase = 'enemyDown';
    this.runExp += e.wave.exp;
    this.run.defeated++;
    this.ui.enemyDown(e);
  };

  Bt.afterEnemyDown = function () {
    const self = this;
    const w = this.enemy.wave;
    if (PW.Sound) PW.Sound.win();
    this.react('sparkle', 99999);
    this.ui.banner(this.enemy.name + ' に勝った！', '経験値 +' + w.exp);
    setTimeout(function () {
      if (!self.active) return;
      const last = self.waveIndex >= self.stage.waves.length - 1;
      if (last) { self.win(); return; }
      self.phase = 'story';
      self.ui.playScene(w.between, function () {
        if (!self.active) return;
        self.faceTimer = 0;
        self.nextWave();
        self.ui.heroFace('brave');
        self.faceTimer = 1500;
        self.puzzle.continuePlay();
      });
    }, 1500);
  };

  /* =========================================================
   * スキル（モチ：いただきます！）
   * ========================================================= */
  Bt.useSkill = function () {
    if (!this.active || !this.hasMochi || this.phase !== 'fight') return false;
    if (this.gauge < R.GAUGE_MAX) {
      this.say('mochi', 'まだおなかがすいてないよ。キャンディをそろえるとゲージがたまるよ！', 2200);
      return false;
    }
    const maxLv = PW.Save.love('mochi') >= 30 ? 2 : 1;
    const n = this.puzzle.eatCells(function (c) { return c.t >= 0 && c.lv <= maxLv; });
    if (n < 0) return false;
    if (n === 0) { this.say('mochi', '食べられるおやつがないみたい……', 1800); return false; }
    this.gauge = 0;
    const heal = n * 2;
    this.hero.hp = Math.min(this.hero.maxHp, this.hero.hp + heal);
    this.ui.skillReady(false);
    this.ui.skillCutin();
    this.say('mochi', 'いただきます！ もぐもぐ……' + n + 'こ食べたよ！', 2200);
    this.puzzle.addText('HP+' + heal, PW.BOARD.COLS / 2 - 0.5, PW.BOARD.ROWS / 2, '#FFB3CD', 1.2, 1200);
    if (PW.Sound) PW.Sound.skill();
    this.react('love', 1600);
    this.refresh();
    return true;
  };

  /* =========================================================
   * 終了
   * ========================================================= */
  Bt.finish = function (won) {
    this.active = false;
    this.puzzle.mode = 'over';
    const s = PW.Save, d = s.data;
    d.stats.battles++;
    if (won) d.stats.wins++;
    d.stats.lines += this.run.lines;
    d.stats.fuses += this.run.fuses;
    d.stats.bursts += this.run.bursts;
    d.stats.maxCombo = Math.max(d.stats.maxCombo, this.run.maxCombo);
    if (this.tutorial && this.tut.cleared) d.tutorial.battle = true;
    const treats = this.runTreats;
    Object.keys(treats).forEach(function (k) { s.addTreat(k, treats[k]); });
    s.addExp(this.runExp);
    const lvBefore = this.lvStart;
    const ups = d.hero.lv - lvBefore;
    s.save();
    return {
      won: won, exp: this.runExp, treats: treats, lvBefore: lvBefore, lvAfter: d.hero.lv, ups: ups,
      run: this.run, stageId: this.stage.id
    };
  };

  Bt.win = function () {
    const self = this;
    this.phase = 'story';
    const first = !this.save.cleared[this.stage.id];
    const scene = first ? this.stage.story.clear : (this.stage.story.replay || this.stage.story.clear);
    this.ui.playScene(scene, function () {
      const d = PW.Save.data;
      d.cleared[self.stage.id] = (d.cleared[self.stage.id] || 0) + 1;
      d.flags['cleared_' + self.stage.id] = true;
      if (first) d.bonePieces += 1;
      const result = self.finish(true);
      result.first = first;
      self.ui.showResult(result);
    });
  };

  Bt.lose = function (reason) {
    if (!this.active || this.phase === 'lose') return;
    this.phase = 'lose';
    this.puzzle.mode = 'over';
    if (PW.Sound) PW.Sound.over();
    this.ui.heroFace('sad');
    const self = this;
    setTimeout(function () {
      const result = self.finish(false);
      result.reason = reason;
      self.ui.showResult(result);
    }, 900);
  };

  Bt.abort = function () {
    this.active = false;
    this.puzzle.mode = 'over';
  };
})(window.PW);
