/* =========================================================
 * パグの世界 - treatArt.js
 * 魔法のおやつブロックの絵（画像ファイルを使わず Canvas で描く）。
 * 種類は形で、段階は大きさ・飾り・右下の点の数で見分けられる（色だけに頼らない）。
 * ========================================================= */
'use strict';
(function (PW) {
  const TAU = Math.PI * 2;
  const INK = '#3B281F';

  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  PW.roundRect = rr;

  function star(ctx, x, y, R, r, n) {
    ctx.beginPath();
    for (let i = 0; i < n * 2; i++) {
      const a = -Math.PI / 2 + i * Math.PI / n;
      const d = i % 2 ? r : R;
      ctx.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d);
    }
    ctx.closePath();
  }

  function cookie(ctx, lv) {
    const s = [0, 0.62, 0.74, 0.8][lv];
    ctx.lineWidth = 0.09;
    ctx.strokeStyle = INK;
    // 本体
    if (lv === 3) {
      // 王冠形
      ctx.beginPath();
      ctx.moveTo(-s, s * 0.7);
      ctx.lineTo(-s, -s * 0.35);
      ctx.lineTo(-s * 0.5, s * 0.05);
      ctx.lineTo(0, -s * 0.75);
      ctx.lineTo(s * 0.5, s * 0.05);
      ctx.lineTo(s, -s * 0.35);
      ctx.lineTo(s, s * 0.7);
      ctx.closePath();
      ctx.fillStyle = '#F4B652';
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, s, 0, TAU);
      ctx.fillStyle = lv === 2 ? '#E39A4E' : '#EAB06A';
    }
    ctx.fill();
    ctx.stroke();
    // つや
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.ellipse(-s * 0.3, -s * 0.35, s * 0.35, s * 0.18, -0.5, 0, TAU);
    ctx.fill();
    // チョコチップ / 飾り
    ctx.fillStyle = '#5A3524';
    const chips = lv === 1 ? [[0.25, 0.2], [-0.3, 0.25], [0.1, -0.3]] :
      lv === 2 ? [[0.35, 0.3], [-0.35, 0.3], [0.05, -0.1], [0.4, -0.25], [-0.2, -0.4]] :
        [[-0.55, 0.35], [0, 0.35], [0.55, 0.35]];
    chips.forEach(function (c) {
      ctx.beginPath();
      ctx.arc(c[0] * s, c[1] * s, s * (lv === 3 ? 0.13 : 0.12), 0, TAU);
      if (lv === 3) ctx.fillStyle = ['#FF6E8A', '#58C1F2', '#6CD08A'][chips.indexOf(c)];
      ctx.fill();
    });
    if (lv === 2) {
      ctx.strokeStyle = '#FFF4E2';
      ctx.lineWidth = 0.08;
      ctx.beginPath();
      ctx.moveTo(-s * 0.6, s * 0.05);
      ctx.quadraticCurveTo(-s * 0.3, -s * 0.2, 0, s * 0.05);
      ctx.quadraticCurveTo(s * 0.3, s * 0.3, s * 0.6, s * 0.05);
      ctx.stroke();
    }
  }

  function bone(ctx, lv) {
    const s = [0, 0.66, 0.78, 0.84][lv];
    const k = s * 0.3;
    ctx.save();
    ctx.rotate(-0.55);
    ctx.beginPath();
    ctx.arc(-s + k * 0.9, -k * 0.75, k, 0, TAU);
    ctx.arc(-s + k * 0.9, k * 0.75, k, 0, TAU);
    ctx.arc(s - k * 0.9, -k * 0.75, k, 0, TAU);
    ctx.arc(s - k * 0.9, k * 0.75, k, 0, TAU);
    ctx.rect(-s + k, -k * 0.62, (s - k) * 2, k * 1.24);
    ctx.fillStyle = lv === 3 ? '#FFE9A8' : lv === 2 ? '#E6B98A' : '#FFF6E6';
    ctx.fill();
    // 輪郭（形をなぞる）
    ctx.lineWidth = 0.08;
    ctx.strokeStyle = INK;
    ctx.beginPath();
    ctx.arc(-s + k * 0.9, -k * 0.75, k, Math.PI * 0.35, Math.PI * 1.75);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(-s + k * 0.9, k * 0.75, k, Math.PI * 0.25, Math.PI * 1.65);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(s - k * 0.9, -k * 0.75, k, -Math.PI * 0.75, Math.PI * 0.65);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(s - k * 0.9, k * 0.75, k, -Math.PI * 0.65, Math.PI * 0.75);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-s + k * 1.5, -k * 0.62); ctx.lineTo(s - k * 1.5, -k * 0.62);
    ctx.moveTo(-s + k * 1.5, k * 0.62); ctx.lineTo(s - k * 1.5, k * 0.62);
    ctx.stroke();
    if (lv === 2) {
      // ジャーキーのすじ
      ctx.strokeStyle = 'rgba(120,60,30,0.55)';
      ctx.lineWidth = 0.06;
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(i * s * 0.28 - 0.05, -k * 0.4);
        ctx.lineTo(i * s * 0.28 + 0.05, k * 0.4);
        ctx.stroke();
      }
    }
    ctx.restore();
    if (lv === 3) {
      ctx.fillStyle = '#FFFFFF';
      star(ctx, s * 0.05, 0, 0.22, 0.09, 4);
      ctx.fill();
    }
  }

  function candy(ctx, lv) {
    const s = [0, 0.6, 0.72, 0.8][lv];
    ctx.lineWidth = 0.09;
    ctx.strokeStyle = INK;
    if (lv >= 2) {
      // 棒
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(-0.06, s * 0.6, 0.12, 0.95 - s * 0.6);
      ctx.strokeRect(-0.06, s * 0.6, 0.12, 0.95 - s * 0.6);
    }
    ctx.beginPath();
    ctx.arc(0, -0.02, s, 0, TAU);
    if (lv === 3) {
      const g = ctx.createLinearGradient(-s, -s, s, s);
      ['#FF7E9D', '#FFC857', '#7ED87E', '#6EC1FF', '#C79BFF'].forEach(function (c, i) { g.addColorStop(i / 4, c); });
      ctx.fillStyle = g;
    } else {
      ctx.fillStyle = lv === 2 ? '#FF7FAA' : '#FF9FC0';
    }
    ctx.fill();
    ctx.stroke();
    if (lv === 2) {
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = 0.07;
      ctx.beginPath();
      for (let a = 0; a < TAU * 1.6; a += 0.2) {
        const d = s * 0.1 + a / (TAU * 1.6) * s * 0.75;
        ctx.lineTo(Math.cos(a) * d, -0.02 + Math.sin(a) * d);
      }
      ctx.stroke();
    }
    // 肉球
    ctx.fillStyle = lv === 2 ? 'rgba(255,255,255,0.85)' : '#FFFFFF';
    const p = s * (lv === 2 ? 0.75 : 1);
    ctx.beginPath();
    ctx.ellipse(0, p * 0.22, p * 0.34, p * 0.27, 0, 0, TAU);
    ctx.fill();
    [[-0.38, -0.22], [-0.13, -0.42], [0.13, -0.42], [0.38, -0.22]].forEach(function (q) {
      ctx.beginPath();
      ctx.ellipse(q[0] * p, q[1] * p, p * 0.12, p * 0.15, 0, 0, TAU);
      ctx.fill();
    });
  }

  function mischief(ctx) {
    // いたずらブロック（お邪魔）：灰色の石に落書き
    ctx.fillStyle = '#9A928C';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 0.09;
    ctx.beginPath();
    ctx.moveTo(-0.7, -0.3);
    ctx.lineTo(-0.35, -0.72);
    ctx.lineTo(0.4, -0.66);
    ctx.lineTo(0.74, -0.1);
    ctx.lineTo(0.52, 0.66);
    ctx.lineTo(-0.3, 0.72);
    ctx.lineTo(-0.74, 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#EDE6DF';
    ctx.lineWidth = 0.1;
    ctx.beginPath();
    ctx.moveTo(-0.3, -0.25); ctx.lineTo(0.3, 0.3);
    ctx.moveTo(0.3, -0.25); ctx.lineTo(-0.3, 0.3);
    ctx.stroke();
  }

  const DRAW = [cookie, bone, candy];

  /* 段階を表す点（右下） */
  function pips(ctx, lv) {
    for (let i = 0; i < lv; i++) {
      const x = 0.62 - i * 0.24, y = 0.7;
      ctx.beginPath();
      ctx.arc(x, y, 0.1, 0, TAU);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.lineWidth = 0.05;
      ctx.strokeStyle = INK;
      ctx.stroke();
    }
  }

  /** マス1つ分（タイル＋おやつ）を -1..1 の座標に描く */
  function drawTileUnit(ctx, t, lv) {
    if (t < 0) {
      rr(ctx, -0.94, -0.94, 1.88, 1.88, 0.3);
      ctx.fillStyle = '#CFC6BE';
      ctx.fill();
      mischief(ctx);
      return;
    }
    const T = PW.DATA.TREATS[t];
    rr(ctx, -0.94, -0.94, 1.88, 1.88, 0.34);
    ctx.fillStyle = T.tile;
    ctx.fill();
    ctx.lineWidth = 0.07;
    ctx.strokeStyle = T.tileDeep;
    ctx.stroke();
    if (lv === 3) {
      const g = ctx.createRadialGradient(0, 0, 0.2, 0, 0, 1);
      g.addColorStop(0, 'rgba(255,240,160,0.9)');
      g.addColorStop(1, 'rgba(255,240,160,0)');
      ctx.fillStyle = g;
      ctx.fillRect(-0.94, -0.94, 1.88, 1.88);
    }
    ctx.save();
    ctx.translate(0, -0.04);
    DRAW[t](ctx, lv);
    ctx.restore();
    pips(ctx, lv);
  }

  const cache = new Map();
  PW.TreatArt = {
    /** キャッシュ済みのマス画像（sizePx 四方） */
    tile: function (t, lv, sizePx) {
      const S = Math.max(8, Math.round(sizePx));
      const key = t + '_' + lv + '_' + S;
      let cv = cache.get(key);
      if (!cv) {
        cv = document.createElement('canvas');
        cv.width = cv.height = S;
        const c = cv.getContext('2d');
        c.translate(S / 2, S / 2);
        c.scale(S / 2, S / 2);
        drawTileUnit(c, t, lv);
        cache.set(key, cv);
        if (cache.size > 200) cache.clear();
      }
      return cv;
    },
    clear: function () { cache.clear(); },
    /** 図鑑などの単体キャンバスに描く */
    render: function (canvas, t, lv, silhouette) {
      const c = canvas.getContext('2d');
      c.clearRect(0, 0, canvas.width, canvas.height);
      c.drawImage(this.tile(t, lv, canvas.width), 0, 0, canvas.width, canvas.height);
      if (silhouette) {
        c.save();
        c.globalCompositeOperation = 'source-atop';
        c.fillStyle = '#8C7C72';
        c.fillRect(0, 0, canvas.width, canvas.height);
        c.restore();
      }
    }
  };
})(window.PW);
