/* =========================================================
 * パグの世界 - main.js
 * 起動・画面の流れ（タイトル → 作成 → 村 → 冒険 → 結果）・入力・メインループ。
 * ========================================================= */
'use strict';
(function (PW) {
  const $ = function (id) { return document.getElementById(id); };
  const UI = PW.UI;
  let puzzle, battle;
  const hold = { left: false, right: false, down: false, dir: 0, t: 0, repeat: false };

  const Main = {
    boot: function () {
      PW.Save.load();
      PW.Sound.enabled = PW.Save.data.settings.sound;
      puzzle = new PW.Puzzle($('board-canvas'), {});
      battle = new PW.Battle(puzzle, UI);
      puzzle.bindPointer($('board-wrap'));
      this.bindActions();
      this.bindControls();
      this.bindKeyboard();
      this.bindLifecycle();
      UI.updateSound();
      this.toTitle();
      if (PW.Save.broken) UI.toast('セーブデータが読めなかったので、新しく始めます');
      let last = performance.now();
      const loop = function (now) {
        requestAnimationFrame(loop);
        const dt = Math.min(50, now - last);
        last = now;
        Main.tick(dt);
      };
      requestAnimationFrame(loop);
      this.registerSW();
    },

    tick: function (dt) {
      if (UI.screen !== 'screen-battle') return;
      const busy = PW.Story.busy || UI.stack.length > 0;
      if (!busy) {
        this.updateHold(dt);
        puzzle.update(dt);
        battle.update(dt);
      }
      puzzle.render();
    },

    resizeBoard: function () {
      requestAnimationFrame(function () { puzzle.resize(); puzzle.render(); });
    },

    /* ---------------- 画面の流れ ---------------- */
    toTitle: function () {
      battle.abort();
      UI.closeAll();
      const has = PW.Save.hasGame();
      $('btn-new').classList.toggle('hidden', has);
      $('btn-continue').classList.toggle('hidden', !has);
      $('btn-renew').classList.toggle('hidden', !has);
      UI.show('screen-title');
    },

    newGame: function () {
      const go = function () {
        UI.create = { coat: 'fawn', collar: 'red' };
        $('hero-name').value = '';
        UI.renderCreate();
        UI.show('screen-create');
      };
      if (PW.Save.hasGame()) UI.confirm('今のデータを消して、はじめから冒険しますか？', 'はじめから', go);
      else go();
    },

    createDone: function () {
      const input = $('hero-name');
      const name = input.value.replace(/\s+/g, ' ').trim().slice(0, 8);
      if (!name) {
        UI.toast('なまえを入れてね');
        input.focus();
        return;
      }
      PW.Save.newGame({ name: name, coat: UI.create.coat, collar: UI.create.collar });
      UI.show('screen-village');
      UI.renderVillage();
      PW.Story.play('intro', function () {
        PW.Save.save();
        UI.renderVillage();
        UI.toast('「冒険にでる」から、おやつの森へ行こう！', 3000);
      });
    },

    toVillage: function () {
      battle.abort();
      UI.closeAll();
      UI.show('screen-village');
      UI.renderVillage();
    },

    startStage: function (id) {
      const st = PW.DATA.STAGES[id];
      if (!st) return;
      UI.closeAll();
      const d = PW.Save.data;
      const seen = d.flags['seen_' + st.story.start];
      const begin = function () { battle.start(id); };
      if (!seen) {
        puzzle.reset({});
        UI.battleStart({ hasMochi: !!(d.party.mochi && d.party.mochi.joined) });
        const w0 = st.waves[0];
        UI.setEnemy({ name: w0.title, look: PW.DATA.CHARACTERS[w0.enemy].look, wave: w0 });
        UI.setHud({ hp: 1, maxHp: 1, shield: 0, gauge: 0, gaugeMax: 100, enemyHp: w0.hp, enemyMax: w0.hp });
        $('hud-hp-num').textContent = '';
        PW.Story.play(st.story.start, function () {
          d.flags['seen_' + st.story.start] = true;
          PW.Save.save();
          begin();
        });
      } else {
        begin();
      }
    },

    pause: function () {
      if (!battle.active || battle.phase !== 'fight' || PW.Story.busy || UI.top()) return;
      puzzle.paused = true;
      UI.open('ov-pause');
    },

    resume: function () {
      UI.close('ov-pause');
      puzzle.paused = false;
    },

    talk: function (who) {
      const talks = PW.DATA.TALKS[who] || [];
      const d = PW.Save.data;
      const ok = talks.filter(function (tk) {
        const c = tk.if;
        if (!c) return true;
        if (c.flag && !d.flags[c.flag]) return false;
        if (c.choice && d.choices[c.choice[0]] !== c.choice[1]) return false;
        if (c.loveAtLeast && PW.Save.love(who) < c.loveAtLeast) return false;
        return true;
      });
      // 条件つきの会話を少し優先する
      const special = ok.filter(function (tk) { return tk.if; });
      const pool = special.length && Math.random() < 0.6 ? special : ok;
      const pick = pool[Math.floor(Math.random() * pool.length)];
      if (pick) PW.Story.play(pick.lines, function () { UI.renderVillage(); });
    },

    giveTreat: function (key) {
      const S = PW.Save;
      if (!S.data.treats[key]) return;
      const U = PW.DATA.TREAT_USE;
      const parts = key.split('_');
      const lv = +parts[1];
      const amt = Math.round(U.love[lv] * (parts[0] === U.favorite ? U.favoriteMult : 1));
      const before = S.love('mochi');
      S.addTreat(key, -1);
      const after = S.addLove('mochi', amt);
      S.save();
      if (PW.Sound) PW.Sound.heal();
      const lines = ['もぐもぐ……しあわせ！', 'えっ、いいの！？ ありがとう！', 'これ大好き！ {hero}も大好き！', 'おいしい〜！ ……もう1個ある？'];
      UI.toast('モチ「' + lines[Math.floor(Math.random() * lines.length)].replace('{hero}', S.data.hero.name) + '」 好感度+' + (after - before));
      if (before < 30 && after >= 30) setTimeout(function () { UI.toast('モチと「なかよし」になった！ スキルが強くなった', 3200); }, 2300);
      UI.renderMochi();
    },

    eatTreat: function (key) {
      const S = PW.Save;
      if (!S.data.treats[key]) return;
      const lv = +key.split('_')[1];
      const exp = PW.DATA.TREAT_USE.exp[lv];
      S.addTreat(key, -1);
      const ups = S.addExp(exp);
      S.save();
      if (ups) { UI.toast('レベルアップ！ Lv' + S.data.hero.lv + ' になった'); if (PW.Sound) PW.Sound.levelUp(); }
      else { UI.toast('おいしい！ 経験値+' + exp); if (PW.Sound) PW.Sound.heal(); }
      UI.renderBag();
      UI.renderVillage();
    },

    /* ---------------- ボタン ---------------- */
    bindActions: function () {
      const self = this;
      document.addEventListener('click', function (e) {
        const el = e.target.closest('[data-action]');
        if (!el) return;
        PW.Sound.unlock();
        const a = el.dataset.action;
        if (a !== 'story-skip' && PW.Sound) PW.Sound.click();
        switch (a) {
          case 'title-new': self.newGame(); break;
          case 'title-continue': self.toVillage(); break;
          case 'to-title': self.toTitle(); break;
          case 'sound':
            PW.Save.data.settings.sound = !PW.Save.data.settings.sound;
            PW.Sound.enabled = PW.Save.data.settings.sound;
            PW.Save.save();
            UI.updateSound();
            break;
          case 'create-done': self.createDone(); break;
          case 'open-map': UI.renderMap(); UI.open('ov-map'); break;
          case 'start-stage': self.startStage(el.dataset.stage); break;
          case 'open-mochi': UI.renderMochi(); UI.open('ov-mochi'); break;
          case 'talk-mochi': UI.close('ov-mochi'); self.talk('mochi'); break;
          case 'open-elder': self.talk('elder'); break;
          case 'open-bag': UI.renderBag(); UI.open('ov-bag'); break;
          case 'give-treat': self.giveTreat(el.dataset.key); break;
          case 'eat-treat': self.eatTreat(el.dataset.key); break;
          case 'open-zukan': UI.renderZukan('pugs'); UI.open('ov-zukan'); break;
          case 'zukan-detail': UI.showDetail(el.dataset.key); break;
          case 'open-settings': UI.open('ov-settings'); break;
          case 'howto': UI.open('ov-howto'); break;
          case 'reset-save':
            UI.confirm('セーブデータをすべて消しますか？ もとに戻せません。', '消す', function () {
              const sound = PW.Save.data.settings.sound;
              PW.Save.reset();
              PW.Save.data.settings.sound = sound;
              self.toTitle();
              UI.toast('セーブデータを消しました');
            });
            break;
          case 'close': UI.close(); break;
          case 'confirm-yes': UI.answer(true); break;
          case 'confirm-no': UI.answer(false); break;
          case 'resume': self.resume(); break;
          case 'retreat':
            UI.confirm('村にもどりますか？ この冒険で集めた経験値とおやつはもらえません。', 'もどる', function () { self.toVillage(); });
            break;
          case 'result-village': self.toVillage(); break;
          case 'result-retry': UI.closeAll(); self.startStage(UI.lastResult.stageId); break;
          case 'story-skip': e.stopPropagation(); PW.Story.skip(); break;
        }
      });
      document.querySelectorAll('#ov-zukan .tab').forEach(function (t) {
        t.addEventListener('click', function () { UI.renderZukan(t.dataset.tab); });
      });
      $('dialog').addEventListener('click', function (e) {
        if (e.target.closest('button')) return;
        PW.Story.advance();
      });
      $('hero-name').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); } });
      window.addEventListener('pointerdown', function () { PW.Sound.unlock(); }, { passive: true });
    },

    /* ---------------- 画面下の操作ボタン ---------------- */
    bindControls: function () {
      const self = this;
      document.querySelectorAll('.controls .ctl').forEach(function (b) {
        b.addEventListener('pointerdown', function (e) {
          e.preventDefault();
          PW.Sound.unlock();
          b.classList.add('pressed');
          try { b.setPointerCapture(e.pointerId); } catch (err) { /* 非対応 */ }
          const h = b.dataset.hold, c = b.dataset.ctl;
          if (h) self.holdStart(h);
          if (c === 'rotate' && puzzle.rotate()) PW.Sound.rotate();
          if (c === 'skill') battle.useSkill();
          if (c === 'pause') self.pause();
        });
        const up = function () {
          b.classList.remove('pressed');
          if (b.dataset.hold) self.holdEnd(b.dataset.hold);
        };
        b.addEventListener('pointerup', up);
        b.addEventListener('pointercancel', up);
        b.addEventListener('contextmenu', function (e) { e.preventDefault(); });
      });
    },

    holdStart: function (k) {
      hold[k] = true;
      if (k === 'down') { puzzle.softDrop(true); return; }
      hold.dir = k === 'left' ? -1 : 1;
      hold.t = 0;
      hold.repeat = false;
      if (puzzle.move(hold.dir)) PW.Sound.move();
    },

    holdEnd: function (k) {
      hold[k] = false;
      if (k === 'down') { puzzle.softDrop(false); return; }
      hold.dir = hold.left ? -1 : hold.right ? 1 : 0;
      hold.t = 0;
      hold.repeat = false;
    },

    updateHold: function (dt) {
      if (!hold.dir) return;
      hold.t += dt;
      const T = PW.TIMING;
      if (!hold.repeat && hold.t >= T.DAS) { hold.repeat = true; hold.t = 0; puzzle.move(hold.dir); }
      else if (hold.repeat && hold.t >= T.ARR) { hold.t = 0; puzzle.move(hold.dir); }
    },

    /* ---------------- キーボード（PC） ---------------- */
    bindKeyboard: function () {
      const self = this;
      document.addEventListener('keydown', function (e) {
        if (e.target && e.target.tagName === 'INPUT') return;
        if (PW.Story.busy && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); PW.Story.advance(); return; }
        if (e.key === 'Escape') {
          if (UI.top() === 'ov-pause') self.resume();
          else if (UI.top() && UI.top() !== 'ov-result') UI.close();
          else self.pause();
          return;
        }
        if (UI.screen !== 'screen-battle' || UI.top() || PW.Story.busy) return;
        switch (e.key) {
          case 'ArrowLeft': e.preventDefault(); if (puzzle.move(-1)) PW.Sound.move(); break;
          case 'ArrowRight': e.preventDefault(); if (puzzle.move(1)) PW.Sound.move(); break;
          case 'ArrowDown': e.preventDefault(); puzzle.softDrop(true); break;
          case 'ArrowUp': case 'x': case 'X': e.preventDefault(); if (puzzle.rotate()) PW.Sound.rotate(); break;
          case ' ': e.preventDefault(); if (puzzle.canControl()) { PW.Sound.hardDrop(); puzzle.hardDrop(); } break;
          case 'c': case 'C': battle.useSkill(); break;
          case 'p': case 'P': self.pause(); break;
        }
      });
      document.addEventListener('keyup', function (e) {
        if (e.key === 'ArrowDown') puzzle.softDrop(false);
      });
    },

    /* ---------------- 画面の回転・アプリの切りかえ ---------------- */
    bindLifecycle: function () {
      const self = this;
      let t = 0;
      window.addEventListener('resize', function () {
        clearTimeout(t);
        t = setTimeout(function () {
          if (UI.screen === 'screen-battle') self.resizeBoard();
          if (UI.screen === 'screen-village') UI.drawVillage();
        }, 120);
      });
      document.addEventListener('visibilitychange', function () {
        if (document.hidden) {
          self.pause();
          puzzle.softDrop(false);
          hold.left = hold.right = hold.down = false;
          hold.dir = 0;
        }
      });
    },

    registerSW: function () {
      if (!('serviceWorker' in navigator) || location.protocol !== 'https:' || window.PW_NO_SW) return;
      window.addEventListener('load', function () {
        navigator.serviceWorker.register('sw.js').catch(function () { /* オフライン非対応でも遊べる */ });
      });
    }
  };

  /** 開発用：コンソールから盤面と戦闘を触れるように */
  Main.debug = function () { return { puzzle: puzzle, battle: battle }; };

  PW.Main = Main;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { Main.boot(); });
  else Main.boot();
})(window.PW);
