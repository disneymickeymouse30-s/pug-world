/* =========================================================
 * パグの世界 - config.js
 * ゲーム全体の定数。キャラ・おやつ・ストーリーの中身は /data に置く。
 * pugArt.js / backgrounds.js が window.PPG を使うので同じオブジェクトを共有する。
 * ========================================================= */
'use strict';
window.PW = window.PPG = window.PW || {};
window.PW.DATA = window.PW.DATA || {};

(function (PW) {
  PW.VERSION = '0.1.0';

  /* ---------- パズル盤面 ---------- */
  PW.BOARD = { COLS: 8, ROWS: 14 };

  PW.TIMING = {
    FALL_MS: 850,        // 1マス落ちる間隔
    SOFT_MS: 45,         // ソフトドロップ中の間隔
    LOCK_MS: 420,        // 接地してから固定されるまで
    CLEAR_MS: 300,       // ライン消去のフラッシュ
    FUSE_MS: 230,        // 融合のフラッシュ
    FALL_SPEED: 16,      // 重力で落ちるマスの見た目の速さ（マス/秒）
    DAS: 150, ARR: 55    // ボタン長押しの横移動
  };

  PW.RULES = {
    FUSE_MIN: 3,                 // 同じおやつが何個つながると融合するか
    MAX_LV: 3,                   // おやつの最大段階（最大段階の融合は「バースト」）
    VALUE: [0, 1, 4, 12],        // 段階ごとの力
    LINE_MULT: [0, 1, 1.3, 1.6, 2.1],
    COMBO_BONUS: 0.25,           // 連鎖1回ごとの倍率アップ
    BURST_MULT: 2,               // バーストの倍率
    LV2_CHANCE: 0.07,            // 最初から中サイズのおやつが混ざる確率
    GAUGE_MAX: 100
  };

  /* ---------- ブロックの形（テトリスの7種。回転しやすい正方行列） ---------- */
  PW.SHAPES = [
    { id: 'I', m: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]] },
    { id: 'O', m: [[1, 1], [1, 1]] },
    { id: 'T', m: [[0, 1, 0], [1, 1, 1], [0, 0, 0]] },
    { id: 'J', m: [[1, 0, 0], [1, 1, 1], [0, 0, 0]] },
    { id: 'L', m: [[0, 0, 1], [1, 1, 1], [0, 0, 0]] },
    { id: 'S', m: [[0, 1, 1], [1, 1, 0], [0, 0, 0]] },
    { id: 'Z', m: [[1, 1, 0], [0, 1, 1], [0, 0, 0]] }
  ];

  /* ---------- パグの見た目（pugArt.js 用） ---------- */
  const BASE_LOOK = {
    body: '#F0C38A', shade: '#D69C5E', mask: '#5C4032', ear: '#5A3E30', outline: '#3B281F',
    eyes: 'round', mouth: 'smile', collar: null, collarStyle: 'plain', tag: false, tagText: '',
    acc: [], blush: false, wrinkles: 2, chub: 1, patches: null, aura: null
  };
  PW.makeLook = function (over) {
    return Object.assign({}, BASE_LOOK, over, { acc: (over && over.acc) ? over.acc.slice() : [] });
  };

  /* 表情（リアクション）→ 目と口の組み合わせ */
  PW.FACES = {
    normal:  { eyes: 'round', mouth: 'smile' },
    happy:   { eyes: 'happy', mouth: 'tongue' },
    sparkle: { eyes: 'star',  mouth: 'grin' },
    love:    { eyes: 'heart', mouth: 'tongue' },
    sad:     { eyes: 'sleep', mouth: 'o' },
    worried: { eyes: 'round', mouth: 'o' },
    brave:   { eyes: 'smug',  mouth: 'grin' },
    sleepy:  { eyes: 'sleep', mouth: 'smile' },
    wink:    { eyes: 'wink',  mouth: 'grin' }
  };

  /** 基本の見た目に表情を重ねた見た目（キャッシュ付き） */
  const faceCache = new WeakMap();
  PW.lookWithFace = function (look, face) {
    if (!face || face === 'default') return look;
    let byFace = faceCache.get(look);
    if (!byFace) { byFace = {}; faceCache.set(look, byFace); }
    if (!byFace[face]) byFace[face] = Object.assign({}, look, PW.FACES[face] || {}, { acc: look.acc.slice() });
    return byFace[face];
  };
})(window.PW);
