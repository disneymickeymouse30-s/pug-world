/* =========================================================
 * パグの世界 - data/characters.js
 * パグ（主人公・仲間・村の住人・敵）のデータ。
 * 新しいパグはここに1件足せば、会話・図鑑に登場できる。
 * ========================================================= */
'use strict';
(function (PW) {
  const L = PW.makeLook;

  /* 主人公の毛色（キャラクター作成で選ぶ） */
  PW.DATA.COATS = [
    { id: 'fawn',    name: 'フォーン',     look: { body: '#F0C38A', shade: '#D69C5E', mask: '#5C4032', ear: '#5A3E30' } },
    { id: 'apricot', name: 'アプリコット', look: { body: '#F2B06C', shade: '#D08A45', mask: '#5A3A2A', ear: '#4E3222' } },
    { id: 'black',   name: 'ブラック',     look: { body: '#4A433E', shade: '#2E2825', mask: '#1E1A18', ear: '#171311', outline: '#1A1411' } },
    { id: 'silver',  name: 'シルバー',     look: { body: '#C9C3BC', shade: '#9C958E', mask: '#3E3A38', ear: '#55504D' } }
  ];

  /* 首輪の色 */
  PW.DATA.COLLARS = [
    { id: 'red',    name: 'あか',   color: '#E8504F' },
    { id: 'sky',    name: 'そら',   color: '#4FB0F0' },
    { id: 'leaf',   name: 'みどり', color: '#4DBB74' },
    { id: 'candy',  name: 'ピンク', color: '#FF7FAA' }
  ];

  /** 主人公の見た目を作る */
  PW.heroLook = function (hero) {
    const coat = PW.DATA.COATS.find(function (c) { return c.id === hero.coat; }) || PW.DATA.COATS[0];
    const collar = PW.DATA.COLLARS.find(function (c) { return c.id === hero.collar; }) || PW.DATA.COLLARS[0];
    return L(Object.assign({}, coat.look, { collar: collar.color, tag: true, wrinkles: 3 }));
  };

  /* ---------------------------------------------------------
   * キャラクター
   * role: hero / ally / villager / enemy
   * zukan: 図鑑に載るか / hidden: 図鑑でシルエットのまま名前も隠す
   * --------------------------------------------------------- */
  PW.DATA.CHARACTERS = {
    mochi: {
      name: 'モチ', role: 'ally', kind: '食いしん坊パグ', rarity: 2,
      desc: 'いつもおなかをすかせている、村いちばんの食いしん坊。おやつのことになると誰よりも勇敢。',
      where: 'パグの村',
      look: L({ body: '#F4C590', shade: '#D89A5C', eyes: 'happy', mouth: 'tongue', chub: 1.1,
        collar: '#FFB23F', tag: true, tagText: 'M', blush: true, wrinkles: 2 }),
      skill: { id: 'itadakimasu', name: 'いただきます！',
        desc: '盤面の小さいおやつを全部たべて、HPを回復する' },
      passive: 'キャンディの回復量が1.5倍'
    },
    elder: {
      name: 'ゴンじい', role: 'villager', kind: '長老パグ', rarity: 3,
      desc: 'パグの村の長老。しあわせの骨のことを一番よく知っている。昼寝の時間は絶対にゆずらない。',
      where: 'パグの村',
      look: L({ body: '#D8D2CA', shade: '#ABA39A', mask: '#4A4440', ear: '#5E5752', eyes: 'serene', mouth: 'smile',
        acc: ['knitHat'], wrinkles: 5, chub: 1.02 })
    },
    itazura: {
      name: 'いたずらパグ', role: 'enemy', kind: '敵パグ', rarity: 1,
      desc: '欠片の魔力でいたずら心がふくらんだパグ。悪い子ではないけど、落とし穴を掘るのが大好き。',
      where: 'おやつの森の入口',
      look: L({ body: '#B79C86', shade: '#8E7563', mask: '#3A2C24', ear: '#3A2C24', eyes: 'wink', mouth: 'grin',
        acc: ['bandana'], wrinkles: 3 })
    },
    doron: {
      name: 'ドロン', role: 'enemy', kind: 'おやつ泥棒パグ', rarity: 3,
      desc: '村の倉庫からおやつを持ち去った泥棒パグ。サングラスは「顔を覚えられないため」らしい。',
      where: 'おやつの森の入口',
      look: L({ body: '#4A433E', shade: '#2E2825', mask: '#1E1A18', ear: '#171311', outline: '#1A1411',
        eyes: 'smug', mouth: 'grin', acc: ['shades', 'scarf'], wrinkles: 3, chub: 1.05 })
    },

    /* ---- まだ出会えないパグ（図鑑ではシルエット） ---- */
    hoshi:   { name: 'ホシ',   role: 'ally', kind: '魔法パグ', rarity: 3, hidden: true,
      look: L({ body: '#D6C3F5', shade: '#AE93DE', mask: '#4B3A6A', ear: '#5E4884', eyes: 'star', acc: ['sparkle'] }) },
    hayate:  { name: 'ハヤテ', role: 'ally', kind: '俊足パグ', rarity: 3, hidden: true,
      look: L({ body: '#EFC188', shade: '#D2975A', eyes: 'smug', mouth: 'grin', acc: ['bandana'] }) },
    lucky:   { name: 'ラッキー', role: 'ally', kind: '幸運パグ', rarity: 4, hidden: true,
      look: L({ body: '#FFF8EF', shade: '#E4D6C4', mask: '#6E5A52', ear: '#B89F8E', eyes: 'happy', acc: ['starTag'] }) },
    nemu:    { name: 'ネム',   role: 'ally', kind: 'お昼寝パグ', rarity: 3, hidden: true,
      look: L({ body: '#F8DDB6', shade: '#E6BD8C', eyes: 'sleep', mouth: 'o', blush: true }) },
    ganko:   { name: 'ガンコ', role: 'ally', kind: 'ねばり強いパグ', rarity: 3, hidden: true,
      look: L({ body: '#DDA15E', shade: '#B97A3A', eyes: 'round', mouth: 'cat', wrinkles: 5 }) },
    sakichi: { name: 'さきち', role: 'ally', kind: '？？？', rarity: 5, hidden: true,
      look: L({ body: '#F4C590', shade: '#D89A5C', mask: '#5A3A2E', eyes: 'star', mouth: 'tongue',
        collar: '#FF5E8E', tag: true, tagText: 'S', acc: ['ribbon', 'sparkle'], blush: true }) }
  };

  /* 図鑑の並び */
  PW.DATA.PUG_ZUKAN = ['hero', 'mochi', 'elder', 'itazura', 'doron', 'hoshi', 'hayate', 'nemu', 'ganko', 'lucky', 'sakichi'];

  /* ---------- 主人公の成長 ---------- */
  PW.DATA.HERO_BASE = { hp: 60, atk: 5, def: 3 };
  PW.DATA.HERO_GROWTH = { hp: 10, atk: 1, def: 1 };
  PW.expToNext = function (lv) { return 12 + lv * lv * 10; };
  PW.heroStats = function (save) {
    const h = save.hero, B = PW.DATA.HERO_BASE, G = PW.DATA.HERO_GROWTH;
    const up = h.lv - 1;
    const bonus = save.bonus || {};
    return {
      maxHp: B.hp + G.hp * up + (bonus.hp || 0),
      atk: B.atk + G.atk * up + (bonus.atk || 0),
      def: B.def + G.def * up + (bonus.def || 0)
    };
  };

  /* ---------- 好感度 ---------- */
  PW.DATA.AFFECTION_STEPS = [
    { at: 0,  label: 'なかま' },
    { at: 30, label: 'なかよし', unlock: 'スキル強化：中サイズのおやつも食べられる' },
    { at: 60, label: 'しんゆう', unlock: 'とっておきの話が聞ける' },
    { at: 100, label: 'かけがえのない相棒' }
  ];
})(window.PW);
