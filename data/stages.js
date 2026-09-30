/* =========================================================
 * パグの世界 - data/stages.js
 * 地域（ワールドマップ）とステージ（敵の出てくる順番）のデータ。
 * ========================================================= */
'use strict';
(function (PW) {
  /* 地域。stage が null の地域はまだ行けない（今後のアップデート） */
  PW.DATA.REGIONS = [
    { id: 'village',  name: 'パグの村',          icon: '🏡', stage: null, home: true },
    { id: 'forest',   name: 'おやつの森',        icon: '🍪', stage: 'forest_gate' },
    { id: 'plain',    name: 'ぷにぷに平原',      icon: '🐾', stage: null },
    { id: 'mountain', name: 'ほねほね山',        icon: '🦴', stage: null },
    { id: 'dogrun',   name: 'まほうのドッグラン', icon: '✨', stage: null },
    { id: 'sky',      name: '雲の上のパグ王国',  icon: '☁️', stage: null },
    { id: 'ruins',    name: '古代パグ遺跡',      icon: '🏛️', stage: null },
    { id: 'castle',   name: '闇のおやつ城',      icon: '🏰', stage: null },
    { id: 'paradise', name: '幻のパグ楽園',      icon: '🌈', stage: null }
  ];

  /*
   * ステージ
   * waves: 順番に戦う敵。敵を倒すと between の会話をはさんで次へ。
   *   hp / atk: 体力と攻撃力
   *   interval: 何秒ごとに行動するか
   *   riseEvery: 何回に1回「いたずら」（下からお邪魔ブロックがせり上がる）をするか
   *   fallMs: ブロックの落下間隔（小さいほど速い）
   */
  PW.DATA.STAGES = {
    forest_gate: {
      id: 'forest_gate', region: 'forest', name: 'おやつの森の入口',
      theme: 'forest',
      story: { start: 'forest_start', clear: 'forest_clear', replay: 'forest_replay' },
      waves: [
        { enemy: 'itazura', title: 'いたずらパグ', hp: 55, atk: 7, interval: 11, riseEvery: 3, fallMs: 850, exp: 14,
          between: 'forest_wave1' },
        { enemy: 'itazura', title: 'いたずらパグ（ふたご）', hp: 80, atk: 8, interval: 10, riseEvery: 2, fallMs: 780, exp: 18,
          between: 'forest_boss_appear' },
        { enemy: 'doron', title: 'おやつ泥棒パグ ドロン', hp: 190, atk: 10, interval: 9, riseEvery: 2, fallMs: 700, exp: 45,
          boss: true, riseRows: [1, 1, 2] }
      ]
    }
  };
})(window.PW);
