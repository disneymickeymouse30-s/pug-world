/* =========================================================
 * パグの世界 - data/story.js
 * 会話シーンのデータ。
 *   { who, face, t }     … せりふ。who は characters のID / 'hero' / 'narr'（地の文）
 *   { do: 'meet', id }   … 図鑑に登録（出会った）
 *   { do: 'join', id }   … 仲間になる
 *   { choice }           … 選択肢。options[].effects で結果が変わる
 * {hero} は主人公の名前に置きかわる。
 * ========================================================= */
'use strict';
(function (PW) {
  PW.DATA.SCENES = {
    intro: [
      { who: 'narr', t: 'むかし、パグの世界には「大きな幸せの骨」という宝物がありました。' },
      { who: 'narr', t: '骨はパグたちに、毎日の小さなしあわせを届けていました。……あの日、何者かに砕かれてしまうまでは。' },
      { who: 'narr', t: '世界中に散らばった欠片からは、ふしぎなおやつや、いたずら好きのパグが生まれはじめたのです。' },
      { do: 'meet', id: 'elder' },
      { who: 'elder', face: 'worried', t: 'おお、{hero}。ちょうどいいところに来た。' },
      { who: 'elder', t: '村のおやつ倉庫がからっぽになってしもうた。足あとは「おやつの森」へ続いておる。' },
      { do: 'meet', id: 'mochi' },
      { who: 'mochi', face: 'worried', t: 'ええっ！？ おやつが……ぜんぶ？' },
      { who: 'mochi', face: 'sad', t: '……じゃあ、今日のおやつは？' },
      { who: 'elder', face: 'normal', t: 'ない。' },
      { who: 'mochi', face: 'brave', t: '{hero}、行こう！ おやつのためなら、ぼくどこへでも行くよ！' },
      { who: 'hero', face: 'happy', t: '（しっぽをぶんぶんふって、うなずいた）' },
      { who: 'elder', t: '森では「魔法のおやつブロック」が降ってくる。そろえて消せば、パグの力になるはずじゃ。' },
      { who: 'elder', face: 'sleepy', t: '気をつけてな。……わしは昼寝の時間じゃ。' },
      { do: 'join', id: 'mochi' },
      { who: 'narr', t: '食いしん坊パグの「モチ」が仲間になった！' }
    ],

    forest_start: [
      { who: 'narr', t: 'おやつの森の入口。あまいにおいがただよっている。' },
      { who: 'mochi', face: 'happy', t: 'くんくん……こっちからクッキーのにおいがする！' },
      { do: 'meet', id: 'itazura' },
      { who: 'itazura', face: 'wink', t: 'にしし！ ここから先は通さないよーだ！' },
      { who: 'mochi', face: 'brave', t: 'おやつを返してもらうよ！ {hero}、パズルで勝負だ！' }
    ],

    forest_wave1: [
      { who: 'itazura', face: 'sad', t: 'うわーん、負けたー！ ……でも、ふたごの弟がだまってないぞ！' },
      { who: 'mochi', face: 'worried', t: 'ふたご！？' },
      { who: 'itazura', face: 'wink', t: 'にしし！ 弟は兄ちゃんより、落とし穴を掘るのがうまいんだ！' },
      { who: 'mochi', face: 'normal', t: '下からお邪魔ブロックがせり上がってくるかも。上に積みすぎないようにね！' }
    ],

    forest_boss_appear: [
      { who: 'itazura', face: 'sad', t: 'ドロン兄貴ー！ たすけてー！' },
      { who: 'narr', t: '木の上から、サングラスのパグがひらりと飛びおりてきた。' },
      { do: 'meet', id: 'doron' },
      { who: 'doron', face: 'brave', t: 'やれやれ。おやつをひとりじめするのも楽じゃないぜ。' },
      { who: 'mochi', face: 'brave', t: '村のおやつを返せー！' },
      { who: 'doron', face: 'wink', t: '返してほしけりゃ、オレに勝ってみな。' }
    ],

    forest_clear: [
      { who: 'doron', face: 'sad', t: '……まいった。お前ら、強いな。' },
      { who: 'doron', face: 'worried', t: '実はな、欠片のせいで森のおやつの木が枯れちまって。弟分たちが腹をすかせてたんだ。' },
      { who: 'itazura', face: 'sad', t: 'おなか、すいた……' },
      { who: 'mochi', face: 'worried', t: '……おなかがすくのは、つらいよね。' },
      {
        choice: 'stolen_treats',
        q: '取り返したおやつを、どうする？',
        options: [
          {
            id: 'share', label: 'みんなで分ける',
            effects: { love: { mochi: 5 }, bonus: { def: 2 }, flag: 'village_forest_friends' },
            after: [
              { who: 'hero', face: 'happy', t: '（村のパグにも、森のパグにも、おやつを配った）' },
              { who: 'doron', face: 'normal', t: '……いいのかよ。' },
              { who: 'mochi', face: 'happy', t: 'みんなで食べると、もっとおいしいもんね！' },
              { who: 'narr', t: 'ゴンじいから「ほねのお守り」をもらった！ ぼうぎょが 2 上がった。' }
            ]
          },
          {
            id: 'return', label: 'ドロンに話を聞く',
            effects: { love: { mochi: 10 }, flag: 'doron_promise' },
            after: [
              { who: 'hero', face: 'normal', t: '（おやつの木が枯れた場所へ、案内してもらうことにした）' },
              { who: 'doron', face: 'normal', t: '……借りはかならず返す。森の奥で困ったら、オレを呼べ。' },
              { who: 'mochi', face: 'love', t: '{hero}はやさしいね。ぼく、そういうところ好きだよ。' }
            ]
          },
          {
            id: 'eat', label: 'いっしょに食べる',
            effects: { love: { mochi: 20 }, exp: 30, flag: 'forest_party' },
            after: [
              { who: 'narr', t: 'その場でおやつパーティーが始まった！' },
              { who: 'mochi', face: 'love', t: 'しあわせ〜……！ これだよ、これ！' },
              { who: 'itazura', face: 'happy', t: 'にしし！ おいしーい！' },
              { who: 'narr', t: 'みんなで笑いあって、経験値を 30 もらった。……村のぶんは、ちょっと減ってしまったけれど。' }
            ]
          },
          {
            id: 'store', label: '村の倉庫にしまう',
            effects: { treats: { cookie_2: 3, candy_2: 2, bone_2: 2 }, flag: 'doron_grudge' },
            after: [
              { who: 'hero', face: 'brave', t: '（おやつは村のもの。ちゃんと倉庫に持ち帰ることにした）' },
              { who: 'doron', face: 'sad', t: '……だよな。' },
              { who: 'mochi', face: 'worried', t: '……うん。村のみんなも待ってるもんね。' },
              { who: 'narr', t: 'おやつ袋に、どでかクッキーやジャーキーがたくさん入った！' }
            ]
          }
        ]
      },
      { who: 'narr', t: 'そのとき、森の奥で何かがきらりと光った。' },
      { who: 'mochi', face: 'sparkle', t: 'あれって……もしかして、しあわせの骨の欠片！？' },
      { who: 'narr', t: '「しあわせの骨の欠片」をひとつ手に入れた！' },
      { who: 'mochi', face: 'happy', t: 'まだまだ欠片はありそうだね。……おやつも。' },
      { who: 'narr', t: 'おやつの森の奥へ続く道は、まだ霧につつまれている。（つづく）' }
    ]
    ,

    forest_replay: [
      { who: 'doron', face: 'sad', t: 'またお前らか……。修行につきあってやっただけだからな。' },
      { who: 'mochi', face: 'happy', t: 'いい運動になったね！ おなかすいた！' }
    ]
  };

  /*
   * 村での会話。上から順に条件を見て、合うものの中からランダム。
   * if: { flag, choice: [id, option], loveAtLeast }
   */
  PW.DATA.TALKS = {
    mochi: [
      { if: { loveAtLeast: 60 }, lines: [
        { who: 'mochi', face: 'love', t: 'ねえ{hero}。欠片を全部あつめたら、骨はもとにもどるのかな。' },
        { who: 'mochi', face: 'normal', t: 'もどったら……ぼく、いちばんに{hero}とおやつを食べたいな。' }] },
      { if: { choice: ['stolen_treats', 'return'] }, lines: [
        { who: 'mochi', face: 'happy', t: 'ドロン、森の奥で待ってるって。ちょっとかっこよかったね。' }] },
      { if: { choice: ['stolen_treats', 'eat'] }, lines: [
        { who: 'mochi', face: 'love', t: 'あのパーティー、また開きたいなあ……。' }] },
      { if: { choice: ['stolen_treats', 'store'] }, lines: [
        { who: 'mochi', face: 'worried', t: 'ドロンたち、ちゃんとごはん食べてるかな……。' }] },
      { if: { loveAtLeast: 30 }, lines: [
        { who: 'mochi', face: 'happy', t: '最近、{hero}といると、おやつのことを忘れる時間があるんだ。……3秒くらい。' }] },
      { lines: [
        { who: 'mochi', face: 'normal', t: '……おやつ？' },
        { who: 'hero', face: 'normal', t: '（ちがうよ、と首をふった）' },
        { who: 'mochi', face: 'happy', t: 'おやつのある冒険？ ……そういうことにしよう。' }] },
      { lines: [
        { who: 'mochi', face: 'sleepy', t: 'ぼくのスキルは「いただきます！」。盤面の小さいおやつを、ぜんぶ食べちゃうよ。' }] },
      { lines: [
        { who: 'mochi', face: 'happy', t: 'いちばん好きなおやつ？ クッキー！ ……キャンディも。……ほねも。' }] }
    ],
    elder: [
      { if: { flag: 'village_forest_friends' }, lines: [
        { who: 'elder', face: 'happy', t: '森のパグたちが、畑の手伝いに来てくれるようになった。おぬしのおかげじゃ。' }] },
      { if: { flag: 'doron_grudge' }, lines: [
        { who: 'elder', face: 'normal', t: '倉庫はにぎやかになった。……じゃが、森は静かすぎるのう。' }] },
      { if: { flag: 'cleared_forest_gate' }, lines: [
        { who: 'elder', face: 'normal', t: '欠片をひとつ見つけたか。骨はな、ひとつひとつの欠片に、ちがう「しあわせ」が宿っておるのじゃ。' }] },
      { lines: [
        { who: 'elder', face: 'normal', t: '同じおやつを3つくっつけると、大きなおやつになる。大きいほど、消したときの力も強いぞ。' }] },
      { lines: [
        { who: 'elder', face: 'sleepy', t: '王様クッキーを3つ合わせると、とんでもないことが起きるらしい。……むにゃ。' }] }
    ]
  };
})(window.PW);
