/* =========================================================
 * パグの世界 - data/items.js
 * 魔法のおやつ（パズルのマス）のデータ。
 * t: 盤面での種類番号 / role: ライン消去したときの効果
 * ========================================================= */
'use strict';
(function (PW) {
  PW.DATA.TREATS = [
    {
      id: 'cookie', name: 'クッキー', role: 'attack', roleName: 'こうげき',
      tile: '#FFE2BC', tileDeep: '#F2B874',
      levels: [
        null,
        { name: 'ちびクッキー', rarity: 1, desc: '焼きたてのひとくちクッキー。食べるとちょっとだけ強気になる。' },
        { name: 'どでかクッキー', rarity: 2, desc: 'ちびクッキーが3枚合体した大きなクッキー。かじりがいがある。' },
        { name: '王様クッキー', rarity: 3, desc: '王冠の形に焼きあがった伝説級のクッキー。ひと口で勇気があふれる。' }
      ],
      effect: 'ライン消去で敵にダメージ'
    },
    {
      id: 'bone', name: 'ほね', role: 'guard', roleName: 'ガード',
      tile: '#E3F0FF', tileDeep: '#9CC6F0',
      levels: [
        null,
        { name: 'こつぶ骨', rarity: 1, desc: 'ポケットに入る小さな骨。持っているとなんだか安心する。' },
        { name: 'ほねほねジャーキー', rarity: 2, desc: 'かみごたえ抜群。かんでいる間はどんな攻撃もこわくない。' },
        { name: 'しあわせの骨のかけら', rarity: 3, desc: '砕けた「大きな幸せの骨」の欠片に似た、あたたかい骨。' }
      ],
      effect: 'ライン消去でガード（次の攻撃を防ぐ）'
    },
    {
      id: 'candy', name: 'キャンディ', role: 'heal', roleName: 'かいふく',
      tile: '#FFE0EC', tileDeep: '#FF9CC0',
      levels: [
        null,
        { name: '肉球キャンディ', rarity: 1, desc: '肉球の形をしたあまいキャンディ。なめると元気が出る。' },
        { name: 'ぺろぺろ肉球キャンディ', rarity: 2, desc: 'ひと晩じゅうなめていられる大きなキャンディ。' },
        { name: '虹色肉球キャンディ', rarity: 3, desc: '光にかざすと虹が見える、夢のようなキャンディ。' }
      ],
      effect: 'ライン消去でHP回復＋スキルゲージ'
    }
  ];

  /* おやつ袋でできること（村で使う） */
  PW.DATA.TREAT_USE = {
    exp:  [0, 0, 6, 25],   // 自分で食べたときの経験値（Lv1は袋に入らない）
    love: [0, 0, 6, 20],   // モチにあげたときの好感度
    favorite: 'cookie',    // モチの好物（好感度1.5倍）
    favoriteMult: 1.5
  };

  PW.treatKey = function (t, lv) { return PW.DATA.TREATS[t].id + '_' + lv; };
})(window.PW);
