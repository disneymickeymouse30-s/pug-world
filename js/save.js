/* =========================================================
 * パグの世界 - save.js
 * localStorage への保存。PUG PUG GARDEN の storage.js と同じく、
 * 壊れたデータでも初期値で起動できるようにしている。
 * データはひとつのJSONにまとめてあるので、将来クラウドセーブに移しやすい。
 * ========================================================= */
'use strict';
(function (PW) {
  const KEY = 'pugworld.save.v1';
  const SCHEMA = 1;

  function defaults() {
    return {
      schema: SCHEMA,
      createdAt: 0,
      updatedAt: 0,
      hero: null,                 // { name, coat, collar, lv, exp }
      bonus: { hp: 0, atk: 0, def: 0 },
      party: {},                  // { mochi: { joined: true, love: 0 } }
      treats: {},                 // おやつ袋 { cookie_2: 3, ... }
      zukan: { pugs: {}, treats: {} },
      flags: {},
      choices: {},                // { stolen_treats: 'share' }
      cleared: {},                // { forest_gate: 1 }（クリア回数）
      bonePieces: 0,
      endings: {},
      achievements: {},
      costumes: {},
      tutorial: { battle: false },
      stats: { battles: 0, wins: 0, lines: 0, fuses: 0, bursts: 0, maxCombo: 0 },
      settings: { sound: true }
    };
  }

  /** 保存データに足りない項目を初期値で補う（1段目と2段目のオブジェクトまで） */
  function fill(base, data) {
    const out = Object.assign({}, base);
    if (!data || typeof data !== 'object') return out;
    Object.keys(data).forEach(function (k) {
      const b = base[k], v = data[k];
      if (b && typeof b === 'object' && !Array.isArray(b)) {
        out[k] = (v && typeof v === 'object' && !Array.isArray(v)) ? fill(b, v) : b;
      } else {
        out[k] = v;
      }
    });
    return out;
  }

  /** 古い形式から移行する（今は schema 1 だけ） */
  function migrate(d) {
    d.schema = SCHEMA;
    return d;
  }

  PW.Save = {
    data: defaults(),
    broken: false,

    load: function () {
      this.broken = false;
      try {
        const raw = localStorage.getItem(KEY);
        this.data = raw ? migrate(fill(defaults(), JSON.parse(raw))) : defaults();
        if (this.data.hero && (typeof this.data.hero.lv !== 'number' || this.data.hero.lv < 1)) this.data.hero.lv = 1;
      } catch (e) {
        this.broken = true;
        this.data = defaults();
      }
      return this.data;
    },

    save: function () {
      this.data.updatedAt = Date.now();
      try { localStorage.setItem(KEY, JSON.stringify(this.data)); return true; } catch (e) { return false; }
    },

    reset: function () {
      this.data = defaults();
      try { localStorage.removeItem(KEY); } catch (e) { /* 無視 */ }
    },

    hasGame: function () { return !!(this.data.hero && this.data.hero.name); },

    newGame: function (hero) {
      const settings = this.data.settings;
      this.data = defaults();
      this.data.settings = settings;
      this.data.createdAt = Date.now();
      this.data.hero = { name: hero.name, coat: hero.coat, collar: hero.collar, lv: 1, exp: 0 };
      this.data.zukan.pugs.hero = true;
      this.save();
    },

    /* ---- 便利関数 ---- */
    meet: function (id) {
      if (this.data.zukan.pugs[id]) return false;
      this.data.zukan.pugs[id] = true;
      return true;
    },
    seeTreat: function (t, lv) {
      const k = PW.treatKey(t, lv);
      if (this.data.zukan.treats[k]) return false;
      this.data.zukan.treats[k] = true;
      return true;
    },
    addTreat: function (key, n) {
      const d = this.data.treats;
      d[key] = Math.max(0, (d[key] || 0) + n);
      if (!d[key]) delete d[key];
    },
    love: function (id) { return (this.data.party[id] && this.data.party[id].love) || 0; },
    addLove: function (id, n) {
      const p = this.data.party[id];
      if (!p) return 0;
      p.love = Math.max(0, Math.min(100, (p.love || 0) + n));
      return p.love;
    },

    /** 経験値を足してレベルアップ回数を返す */
    addExp: function (n) {
      const h = this.data.hero;
      let ups = 0;
      h.exp += n;
      while (h.exp >= PW.expToNext(h.lv) && h.lv < 99) {
        h.exp -= PW.expToNext(h.lv);
        h.lv += 1;
        ups += 1;
      }
      return ups;
    }
  };
})(window.PW);
