/* =========================================================
 * パグの世界 - pugArt.js（PUG PUG GARDEN から流用：パグ描画エンジン）
 * パグ・アイテムの描画。
 * 半径1の「単位座標」で描いてから拡大し、スプライトとしてキャッシュする。
 * ========================================================= */
'use strict';

(function (PPG) {
  const TAU = Math.PI * 2;
  const SPRITE_MARGIN = 1.5; // 半径に対する描画範囲（耳・王冠・天使の輪がはみ出すため）

  /* ---------- 小さな描画ヘルパー ---------- */
  function ellipse(ctx, x, y, rx, ry, rot) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, rot || 0, 0, TAU);
  }
  function circle(ctx, x, y, r) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
  }
  function starPath(ctx, x, y, outer, inner, points, rot) {
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const rr = i % 2 === 0 ? outer : inner;
      const a = (rot || -Math.PI / 2) + (i * Math.PI) / points;
      ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    ctx.closePath();
  }
  function heartPath(ctx, x, y, s) {
    ctx.beginPath();
    ctx.moveTo(x, y + s * 0.35);
    ctx.bezierCurveTo(x - s * 1.1, y - s * 0.35, x - s * 0.5, y - s * 1.05, x, y - s * 0.45);
    ctx.bezierCurveTo(x + s * 0.5, y - s * 1.05, x + s * 1.1, y - s * 0.35, x, y + s * 0.35);
    ctx.closePath();
  }
  function sparkPath(ctx, x, y, s) {
    ctx.beginPath();
    ctx.moveTo(x, y - s);
    ctx.quadraticCurveTo(x + s * 0.15, y - s * 0.15, x + s, y);
    ctx.quadraticCurveTo(x + s * 0.15, y + s * 0.15, x, y + s);
    ctx.quadraticCurveTo(x - s * 0.15, y + s * 0.15, x - s, y);
    ctx.quadraticCurveTo(x - s * 0.15, y - s * 0.15, x, y - s);
    ctx.closePath();
  }
  PPG.Shapes = { ellipse: ellipse, circle: circle, starPath: starPath, heartPath: heartPath, sparkPath: sparkPath };

  /* =========================================================
   * パグ本体を単位座標(半径1)で描く
   * ========================================================= */
  function drawPugUnit(ctx, L, blink) {
    const O = L.outline;
    const LW = 0.075;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    // --- くるんとした尻尾（体の後ろ） ---
    ctx.lineWidth = 0.2;
    ctx.strokeStyle = O;
    ctx.beginPath();
    ctx.arc(0.84, -0.42, 0.15, Math.PI * 0.8, Math.PI * 2.45);
    ctx.stroke();
    ctx.lineWidth = 0.1;
    ctx.strokeStyle = L.body;
    ctx.stroke();

    // --- 短い足 ---
    [-1, 1].forEach(function (sx) {
      ellipse(ctx, sx * 0.42, 0.9, 0.2, 0.14);
      ctx.fillStyle = L.shade;
      ctx.fill();
      ctx.lineWidth = LW;
      ctx.strokeStyle = O;
      ctx.stroke();
    });

    // --- マント（体の後ろに見える部分） ---
    if (L.acc.indexOf('cape') >= 0) {
      ctx.beginPath();
      ctx.moveTo(-0.95, 0.1);
      ctx.quadraticCurveTo(-1.18, 0.7, -0.8, 1.0);
      ctx.lineTo(0.8, 1.0);
      ctx.quadraticCurveTo(1.18, 0.7, 0.95, 0.1);
      ctx.closePath();
      ctx.fillStyle = '#C8323A';
      ctx.fill();
      ctx.lineWidth = LW;
      ctx.strokeStyle = O;
      ctx.stroke();
    }

    // --- 体（丸い顔＋体） ---
    const g = ctx.createRadialGradient(-0.35, -0.42, 0.1, 0, 0, 1.1);
    g.addColorStop(0, lighten(L.body, 0.18));
    g.addColorStop(0.55, L.body);
    g.addColorStop(1, L.shade);
    ellipse(ctx, 0, 0, L.chub, 1);
    ctx.fillStyle = g;
    ctx.fill();

    // --- 模様（茶白） ---
    if (L.patches === 'pinto') {
      ctx.save();
      ellipse(ctx, 0, 0, L.chub, 1);
      ctx.clip();
      ctx.fillStyle = '#FFF6EA';
      ctx.beginPath();
      ctx.moveTo(-0.1, -1.1);
      ctx.bezierCurveTo(-0.9, -0.9, -1.2, 0.1, -0.7, 0.5);
      ctx.bezierCurveTo(-0.4, 0.8, 0.1, 1.2, 0.3, 1.1);
      ctx.bezierCurveTo(0.2, 0.5, 0.25, 0.0, 0.05, -0.3);
      ctx.bezierCurveTo(0.0, -0.6, 0.15, -0.9, -0.1, -1.1);
      ctx.fill();
      circle(ctx, 0.62, 0.55, 0.16);
      ctx.fill();
      ctx.restore();
    }

    ellipse(ctx, 0, 0, L.chub, 1);
    ctx.lineWidth = LW;
    ctx.strokeStyle = O;
    ctx.stroke();

    // --- 垂れ耳 ---
    [-1, 1].forEach(function (sx) {
      ctx.beginPath();
      ctx.moveTo(sx * 0.28, -0.9);
      ctx.quadraticCurveTo(sx * 0.98, -1.08, sx * 1.04, -0.58);
      ctx.quadraticCurveTo(sx * 0.86, -0.36, sx * 0.64, -0.5);
      ctx.quadraticCurveTo(sx * 0.5, -0.72, sx * 0.28, -0.9);
      ctx.closePath();
      ctx.fillStyle = L.ear;
      ctx.fill();
      ctx.lineWidth = LW;
      ctx.strokeStyle = O;
      ctx.stroke();
    });

    // --- おでこのしわ ---
    ctx.strokeStyle = withAlpha(L.mask, 0.45);
    ctx.lineWidth = 0.05;
    for (let i = 0; i < L.wrinkles; i++) {
      const y = -0.64 + i * 0.1;
      const w = 0.2 - Math.abs(i - (L.wrinkles - 1) / 2) * 0.03;
      ctx.beginPath();
      ctx.moveTo(-w, y + 0.03);
      ctx.quadraticCurveTo(0, y - 0.05, w, y + 0.03);
      ctx.stroke();
    }

    // --- 黒いマズル（つぶれた鼻まわり） ---
    const mg = ctx.createRadialGradient(0, 0.2, 0.05, 0, 0.3, 0.6);
    mg.addColorStop(0, lighten(L.mask, 0.12));
    mg.addColorStop(1, L.mask);
    ellipse(ctx, 0, 0.3, 0.56, 0.42);
    ctx.fillStyle = mg;
    ctx.fill();
    // マズルのしわ
    ctx.strokeStyle = 'rgba(255,255,255,0.16)';
    ctx.lineWidth = 0.045;
    ctx.beginPath();
    ctx.moveTo(-0.34, 0.04);
    ctx.quadraticCurveTo(0, -0.1, 0.34, 0.04);
    ctx.stroke();

    // --- 口 ---
    drawMouth(ctx, L);

    // --- つぶれた鼻 ---
    ellipse(ctx, 0, 0.15, 0.2, 0.12);
    ctx.fillStyle = '#1A110D';
    ctx.fill();
    ellipse(ctx, -0.07, 0.11, 0.06, 0.03, -0.3);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fill();

    // --- ほっぺ ---
    if (L.blush) {
      ctx.fillStyle = 'rgba(255,120,150,0.45)';
      ellipse(ctx, -0.66, 0.2, 0.15, 0.09);
      ctx.fill();
      ellipse(ctx, 0.66, 0.2, 0.15, 0.09);
      ctx.fill();
    }

    // --- 大きな目 ---
    drawEyes(ctx, L, blink);

    // --- 首輪 ---
    if (L.collar) drawCollar(ctx, L);

    // --- アクセサリー ---
    L.acc.forEach(function (a) { drawAccessory(ctx, a, L); });
  }

  function drawMouth(ctx, L) {
    const dark = '#1A110D';
    ctx.strokeStyle = dark;
    ctx.lineWidth = 0.05;
    if (L.mouth === 'o') {
      ellipse(ctx, 0, 0.44, 0.07, 0.06);
      ctx.fillStyle = dark;
      ctx.fill();
      return;
    }
    if (L.mouth === 'grin') {
      ctx.beginPath();
      ctx.moveTo(-0.26, 0.34);
      ctx.quadraticCurveTo(0, 0.36, 0.26, 0.34);
      ctx.quadraticCurveTo(0.2, 0.62, 0, 0.62);
      ctx.quadraticCurveTo(-0.2, 0.62, -0.26, 0.34);
      ctx.closePath();
      ctx.fillStyle = '#5A1F24';
      ctx.fill();
      ellipse(ctx, 0, 0.55, 0.13, 0.07);
      ctx.fillStyle = '#FF7C95';
      ctx.fill();
      return;
    }
    if (L.mouth === 'tongue') {
      ellipse(ctx, 0.03, 0.5, 0.11, 0.14);
      ctx.fillStyle = '#FF7C95';
      ctx.fill();
      ctx.lineWidth = 0.035;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0.03, 0.42);
      ctx.lineTo(0.03, 0.56);
      ctx.strokeStyle = 'rgba(160,40,70,0.6)';
      ctx.stroke();
      ctx.strokeStyle = dark;
      ctx.lineWidth = 0.05;
    }
    ctx.beginPath();
    ctx.moveTo(0, 0.26);
    ctx.lineTo(0, 0.36);
    if (L.mouth === 'cat') {
      ctx.moveTo(0, 0.36);
      ctx.quadraticCurveTo(-0.12, 0.46, -0.24, 0.36);
      ctx.moveTo(0, 0.36);
      ctx.quadraticCurveTo(0.12, 0.46, 0.24, 0.36);
    } else {
      ctx.moveTo(0, 0.36);
      ctx.quadraticCurveTo(-0.15, 0.47, -0.28, 0.4);
      ctx.moveTo(0, 0.36);
      ctx.quadraticCurveTo(0.15, 0.47, 0.28, 0.4);
    }
    ctx.stroke();
  }

  function drawEyes(ctx, L, blink) {
    const ex = 0.37, ey = -0.1, er = 0.2;
    const dark = '#1C120E';
    let type = L.eyes;
    if (blink && (type === 'round' || type === 'star' || type === 'heart' || type === 'smug')) type = 'blink';
    [-1, 1].forEach(function (sx) {
      const x = sx * ex;
      let t = type;
      if (type === 'wink') t = sx < 0 ? 'round' : 'happy';
      ctx.lineWidth = 0.06;
      ctx.strokeStyle = dark;
      switch (t) {
        case 'sleep':
        case 'blink':
          ctx.beginPath();
          ctx.moveTo(x - 0.14, ey);
          ctx.quadraticCurveTo(x, ey + 0.1, x + 0.14, ey);
          ctx.stroke();
          break;
        case 'happy':
          ctx.beginPath();
          ctx.moveTo(x - 0.14, ey + 0.05);
          ctx.quadraticCurveTo(x, ey - 0.13, x + 0.14, ey + 0.05);
          ctx.stroke();
          break;
        case 'serene':
          ctx.beginPath();
          ctx.moveTo(x - 0.15, ey - 0.02);
          ctx.quadraticCurveTo(x, ey + 0.1, x + 0.15, ey - 0.02);
          ctx.stroke();
          ctx.lineWidth = 0.035;
          ctx.beginPath();
          ctx.moveTo(x + sx * 0.15, ey - 0.02);
          ctx.lineTo(x + sx * 0.22, ey - 0.08);
          ctx.stroke();
          break;
        case 'star':
          starPath(ctx, x, ey, er * 1.05, er * 0.48, 5);
          ctx.fillStyle = '#FFD447';
          ctx.fill();
          ctx.lineWidth = 0.04;
          ctx.stroke();
          break;
        case 'heart':
          heartPath(ctx, x, ey + 0.06, er * 1.05);
          ctx.fillStyle = '#FF4F86';
          ctx.fill();
          ctx.lineWidth = 0.035;
          ctx.stroke();
          circle(ctx, x - 0.06, ey - 0.05, 0.04);
          ctx.fillStyle = 'rgba(255,255,255,0.85)';
          ctx.fill();
          break;
        case 'smug':
          circle(ctx, x, ey + 0.02, er * 0.9);
          ctx.fillStyle = dark;
          ctx.fill();
          // まぶた（上半分を体の色でかくす）
          ctx.beginPath();
          ctx.arc(x, ey + 0.02, er * 0.98, Math.PI, TAU);
          ctx.closePath();
          ctx.fillStyle = L.body;
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(x - er, ey + 0.02);
          ctx.lineTo(x + er, ey + 0.02);
          ctx.stroke();
          circle(ctx, x - 0.05, ey + 0.08, 0.04);
          ctx.fillStyle = '#fff';
          ctx.fill();
          break;
        default: // round
          circle(ctx, x, ey, er);
          ctx.fillStyle = dark;
          ctx.fill();
          circle(ctx, x - 0.06, ey - 0.07, 0.075);
          ctx.fillStyle = '#fff';
          ctx.fill();
          circle(ctx, x + 0.07, ey + 0.07, 0.035);
          ctx.fill();
      }
    });
  }

  function drawCollar(ctx, L) {
    const a0 = Math.PI * 0.22, a1 = Math.PI * 0.78;
    ctx.lineCap = 'butt';
    ctx.beginPath();
    ctx.arc(0, 0, 0.86, a0, a1);
    ctx.lineWidth = 0.2;
    ctx.strokeStyle = L.outline;
    ctx.stroke();
    if (L.collarStyle === 'rainbow') {
      const colors = ['#FF6B8B', '#FFB347', '#FFE45C', '#6BD68A', '#5BB8F0', '#A98BF0'];
      const step = (a1 - a0) / colors.length;
      colors.forEach(function (c, i) {
        ctx.beginPath();
        ctx.arc(0, 0, 0.86, a0 + step * i, a0 + step * (i + 1) + 0.01);
        ctx.lineWidth = 0.12;
        ctx.strokeStyle = c;
        ctx.stroke();
      });
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, 0.86, a0, a1);
      ctx.lineWidth = 0.12;
      ctx.strokeStyle = L.collar;
      ctx.stroke();
      if (L.collarStyle === 'kariyushi') {
        // かりゆし風の花柄
        for (let i = 0; i < 5; i++) {
          const a = a0 + ((a1 - a0) * (i + 0.5)) / 5;
          starPath(ctx, Math.cos(a) * 0.86, Math.sin(a) * 0.86, 0.05, 0.022, 5, a);
          ctx.fillStyle = i % 2 ? '#FFE45C' : '#FFFFFF';
          ctx.fill();
        }
      } else if (L.collarStyle === 'sailor') {
        ctx.beginPath();
        ctx.arc(0, 0, 0.86, a0, a1);
        ctx.lineWidth = 0.025;
        ctx.strokeStyle = '#FFFFFF';
        ctx.stroke();
      }
    }
    ctx.lineCap = 'round';
    if (L.tag) {
      circle(ctx, 0, 0.92, 0.1);
      ctx.fillStyle = '#FFD447';
      ctx.fill();
      ctx.lineWidth = 0.04;
      ctx.strokeStyle = L.outline;
      ctx.stroke();
      if (L.tagText) {
        ctx.fillStyle = '#C0305A';
        ctx.font = 'bold 0.14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(L.tagText, 0, 0.925);
      }
    }
  }

  function drawAccessory(ctx, a, L) {
    const O = L.outline;
    ctx.lineWidth = 0.06;
    ctx.strokeStyle = O;
    switch (a) {
      case 'pacifier':
        circle(ctx, 0, 0.56, 0.09);
        ctx.lineWidth = 0.05;
        ctx.strokeStyle = '#FF86AE';
        ctx.stroke();
        ellipse(ctx, 0, 0.44, 0.17, 0.09);
        ctx.fillStyle = '#9ED8FF';
        ctx.fill();
        ctx.lineWidth = 0.045;
        ctx.strokeStyle = O;
        ctx.stroke();
        break;
      case 'bandana':
        ctx.beginPath();
        ctx.moveTo(-0.66, 0.6);
        ctx.quadraticCurveTo(0, 0.74, 0.66, 0.6);
        ctx.lineTo(0, 1.02);
        ctx.closePath();
        ctx.fillStyle = '#4FAE6E';
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#FFFFFF';
        [[-0.3, 0.72], [0.28, 0.72], [0, 0.86], [-0.05, 0.7]].forEach(function (p) {
          circle(ctx, p[0], p[1], 0.035);
          ctx.fill();
        });
        break;
      case 'starTag':
        starPath(ctx, 0, 0.9, 0.16, 0.07, 5);
        ctx.fillStyle = '#FFE45C';
        ctx.fill();
        ctx.lineWidth = 0.04;
        ctx.stroke();
        break;
      case 'crown':
        ctx.beginPath();
        ctx.moveTo(-0.38, -0.8);
        ctx.lineTo(-0.44, -1.18);
        ctx.lineTo(-0.2, -1.0);
        ctx.lineTo(0, -1.28);
        ctx.lineTo(0.2, -1.0);
        ctx.lineTo(0.44, -1.18);
        ctx.lineTo(0.38, -0.8);
        ctx.closePath();
        ctx.fillStyle = '#FFD447';
        ctx.fill();
        ctx.stroke();
        [[-0.2, -0.88, '#E8504F'], [0, -0.9, '#5BB8F0'], [0.2, -0.88, '#E8504F']].forEach(function (p) {
          circle(ctx, p[0], p[1], 0.05);
          ctx.fillStyle = p[2];
          ctx.fill();
        });
        break;
      case 'miniCrown':
        ctx.save();
        ctx.translate(0.36, -0.92);
        ctx.rotate(0.35);
        ctx.beginPath();
        ctx.moveTo(-0.2, 0.08);
        ctx.lineTo(-0.24, -0.16);
        ctx.lineTo(-0.1, -0.04);
        ctx.lineTo(0, -0.2);
        ctx.lineTo(0.1, -0.04);
        ctx.lineTo(0.24, -0.16);
        ctx.lineTo(0.2, 0.08);
        ctx.closePath();
        ctx.fillStyle = '#FFD447';
        ctx.fill();
        ctx.lineWidth = 0.045;
        ctx.stroke();
        ctx.restore();
        break;
      case 'cape':
        // 首元のファー
        ctx.beginPath();
        ctx.arc(0, 0, 0.84, Math.PI * 0.2, Math.PI * 0.8);
        ctx.lineWidth = 0.2;
        ctx.strokeStyle = O;
        ctx.stroke();
        ctx.lineWidth = 0.14;
        ctx.strokeStyle = '#FFFFFF';
        ctx.stroke();
        ctx.fillStyle = '#1A110D';
        for (let i = 0; i < 5; i++) {
          const ang = Math.PI * (0.27 + i * 0.115);
          circle(ctx, Math.cos(ang) * 0.84, Math.sin(ang) * 0.84, 0.025);
          ctx.fill();
        }
        break;
      case 'bow':
        drawBow(ctx, 0.46, -0.86, 0.26, '#FF86AE', O, 0.3);
        break;
      case 'ribbon':
        drawBow(ctx, 0, -0.98, 0.42, '#FF5E8E', O, 0);
        ctx.fillStyle = '#FFFFFF';
        [[-0.28, -1.02], [0.3, -1.0], [-0.2, -0.88], [0.22, -0.9]].forEach(function (p) {
          circle(ctx, p[0], p[1], 0.03);
          ctx.fill();
        });
        break;
      case 'sparkle':
        ctx.fillStyle = '#FFF3A8';
        ctx.lineWidth = 0.03;
        [[-1.08, -0.55, 0.14], [1.12, 0.18, 0.12], [-0.95, 0.78, 0.1]].forEach(function (p) {
          sparkPath(ctx, p[0], p[1], p[2]);
          ctx.fill();
          ctx.stroke();
        });
        break;
      case 'gem':
        ctx.beginPath();
        ctx.moveTo(0, -0.62);
        ctx.lineTo(0.08, -0.5);
        ctx.lineTo(0, -0.38);
        ctx.lineTo(-0.08, -0.5);
        ctx.closePath();
        ctx.fillStyle = '#6FE3FF';
        ctx.fill();
        ctx.lineWidth = 0.035;
        ctx.stroke();
        break;
      case 'scarf':
      case 'knitScarf': {
        const col = a === 'scarf' ? '#3E7CC9' : '#E8504F';
        ctx.lineCap = 'butt';
        ctx.beginPath();
        ctx.arc(0, 0, 0.84, Math.PI * 0.18, Math.PI * 0.82);
        ctx.lineWidth = 0.28;
        ctx.strokeStyle = O;
        ctx.stroke();
        ctx.lineWidth = 0.2;
        ctx.strokeStyle = col;
        ctx.stroke();
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0.36, 0.7);
        ctx.lineTo(0.62, 0.72);
        ctx.lineTo(0.58, 1.12);
        ctx.lineTo(0.36, 1.08);
        ctx.closePath();
        ctx.fillStyle = col;
        ctx.fill();
        ctx.lineWidth = 0.05;
        ctx.strokeStyle = O;
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,0.8)';
        ctx.lineWidth = 0.035;
        ctx.beginPath();
        ctx.moveTo(0.38, 0.86);
        ctx.lineTo(0.6, 0.88);
        ctx.moveTo(0.37, 0.98);
        ctx.lineTo(0.59, 1.0);
        ctx.stroke();
        break;
      }
      case 'halo':
        ellipse(ctx, 0, -1.2, 0.48, 0.12);
        ctx.lineWidth = 0.13;
        ctx.strokeStyle = O;
        ctx.stroke();
        ctx.lineWidth = 0.08;
        ctx.strokeStyle = '#FFF08A';
        ctx.stroke();
        break;
      case 'shades':
        ctx.fillStyle = '#17171C';
        [-1, 1].forEach(function (sx) {
          ctx.beginPath();
          ctx.moveTo(sx * 0.12, -0.24);
          ctx.lineTo(sx * 0.62, -0.26);
          ctx.quadraticCurveTo(sx * 0.62, 0.06, sx * 0.4, 0.06);
          ctx.quadraticCurveTo(sx * 0.14, 0.06, sx * 0.12, -0.24);
          ctx.closePath();
          ctx.fill();
          ctx.lineWidth = 0.04;
          ctx.strokeStyle = O;
          ctx.stroke();
        });
        ctx.beginPath();
        ctx.moveTo(-0.14, -0.22);
        ctx.lineTo(0.14, -0.22);
        ctx.lineWidth = 0.06;
        ctx.strokeStyle = '#17171C';
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,0.6)';
        ctx.lineWidth = 0.04;
        ctx.beginPath();
        ctx.moveTo(-0.5, -0.18);
        ctx.lineTo(-0.4, -0.06);
        ctx.moveTo(0.3, -0.18);
        ctx.lineTo(0.4, -0.06);
        ctx.stroke();
        break;
      case 'hibiscus':
        ctx.save();
        ctx.translate(-0.7, -0.74);
        for (let i = 0; i < 5; i++) {
          ctx.rotate(TAU / 5);
          ellipse(ctx, 0, -0.14, 0.1, 0.15);
          ctx.fillStyle = '#FF3F5E';
          ctx.fill();
          ctx.lineWidth = 0.03;
          ctx.stroke();
        }
        circle(ctx, 0, 0, 0.06);
        ctx.fillStyle = '#FFE45C';
        ctx.fill();
        ctx.restore();
        break;
      case 'sailorCap':
        ellipse(ctx, 0, -0.86, 0.5, 0.13);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-0.34, -0.88);
        ctx.quadraticCurveTo(-0.34, -1.24, 0, -1.24);
        ctx.quadraticCurveTo(0.34, -1.24, 0.34, -0.88);
        ctx.closePath();
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#2E5AAC';
        ctx.fillRect(-0.34, -0.98, 0.68, 0.08);
        circle(ctx, 0, -1.25, 0.06);
        ctx.fillStyle = '#E8504F';
        ctx.fill();
        break;
      case 'knitHat':
        ctx.beginPath();
        ctx.moveTo(-0.82, -0.52);
        ctx.quadraticCurveTo(-0.8, -1.22, 0, -1.2);
        ctx.quadraticCurveTo(0.8, -1.22, 0.82, -0.52);
        ctx.closePath();
        ctx.fillStyle = '#E8504F';
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-0.86, -0.5);
        ctx.quadraticCurveTo(0, -0.72, 0.86, -0.5);
        ctx.lineTo(0.84, -0.66);
        ctx.quadraticCurveTo(0, -0.88, -0.84, -0.66);
        ctx.closePath();
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        ctx.stroke();
        circle(ctx, 0, -1.24, 0.16);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        ctx.stroke();
        break;
      default:
        break;
    }
  }

  function drawBow(ctx, x, y, s, color, O, rot) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    [-1, 1].forEach(function (sx) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(sx * s * 1.1, -s * 0.9, sx * s * 1.05, 0);
      ctx.quadraticCurveTo(sx * s * 1.1, s * 0.9, 0, 0);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      ctx.lineWidth = 0.05;
      ctx.strokeStyle = O;
      ctx.stroke();
    });
    circle(ctx, 0, 0, s * 0.28);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  /* ---------- 色ユーティリティ ---------- */
  function hexToRgb(hex) {
    const h = hex.replace('#', '');
    return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)];
  }
  function lighten(hex, amt) {
    const c = hexToRgb(hex).map(function (v) { return Math.round(v + (255 - v) * amt); });
    return 'rgb(' + c.join(',') + ')';
  }
  function withAlpha(hex, a) {
    return 'rgba(' + hexToRgb(hex).join(',') + ',' + a + ')';
  }
  PPG.Color = { lighten: lighten, withAlpha: withAlpha };

  /* =========================================================
   * アイテムを単位座標で描く
   * ========================================================= */
  function drawItemUnit(ctx, type) {
    const O = '#3B281F';
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.lineWidth = 0.08;
    ctx.strokeStyle = O;
    if (type === 'treat') {
      // 骨型ビスケット（先に太い線で輪郭、上から塗りつぶして一体化させる）
      ctx.save();
      ctx.rotate(-0.4);
      const bone = function () {
        ctx.beginPath();
        ctx.rect(-0.6, -0.24, 1.2, 0.48);
        [[-0.62, -0.26], [-0.62, 0.26], [0.62, -0.26], [0.62, 0.26]].forEach(function (p) {
          ctx.moveTo(p[0] + 0.3, p[1]);
          ctx.arc(p[0], p[1], 0.3, 0, TAU);
        });
      };
      bone();
      ctx.lineWidth = 0.16;
      ctx.stroke();
      bone();
      ctx.fillStyle = '#F3C77E';
      ctx.fill();
      // 肉球マーク
      ctx.fillStyle = '#B7793A';
      circle(ctx, 0, 0.04, 0.1); ctx.fill();
      [[-0.14, -0.1], [0, -0.15], [0.14, -0.1]].forEach(function (p) { circle(ctx, p[0], p[1], 0.045); ctx.fill(); });
      ctx.restore();
    } else if (type === 'ball') {
      const colors = ['#FF5E6E', '#FFFFFF', '#FFD447', '#FFFFFF', '#5BB8F0', '#FFFFFF'];
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, 0.95, (i * TAU) / 6, ((i + 1) * TAU) / 6);
        ctx.closePath();
        ctx.fillStyle = colors[i];
        ctx.fill();
      }
      circle(ctx, 0, 0, 0.95);
      ctx.stroke();
      circle(ctx, 0, 0, 0.16);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.lineWidth = 0.05;
      ctx.stroke();
      ellipse(ctx, -0.35, -0.4, 0.2, 0.1, -0.7);
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fill();
    } else if (type === 'time') {
      // パグ耳つき時計
      [-1, 1].forEach(function (sx) {
        ctx.beginPath();
        ctx.moveTo(sx * 0.3, -0.82);
        ctx.quadraticCurveTo(sx * 0.95, -1.0, sx * 0.98, -0.5);
        ctx.quadraticCurveTo(sx * 0.7, -0.45, sx * 0.55, -0.62);
        ctx.closePath();
        ctx.fillStyle = '#5A3E30';
        ctx.fill();
        ctx.lineWidth = 0.06;
        ctx.stroke();
      });
      circle(ctx, 0, 0.05, 0.85);
      ctx.fillStyle = '#A8DDFF';
      ctx.fill();
      ctx.lineWidth = 0.08;
      ctx.stroke();
      circle(ctx, 0, 0.05, 0.66);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.lineWidth = 0.05;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, 0.05); ctx.lineTo(0, -0.42);
      ctx.moveTo(0, 0.05); ctx.lineTo(0.3, 0.2);
      ctx.lineWidth = 0.08;
      ctx.stroke();
      circle(ctx, 0, 0.05, 0.07);
      ctx.fillStyle = O;
      ctx.fill();
    } else if (type === 'clean') {
      // ほうき
      ctx.save();
      ctx.rotate(0.5);
      ctx.beginPath();
      ctx.moveTo(0.75, -1.2); ctx.lineTo(0.75, 0.5);
      ctx.lineWidth = 0.14;
      ctx.strokeStyle = '#8A5A2E';
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0.55, 0.45); ctx.lineTo(0.95, 0.45); ctx.lineTo(1.05, 1.0); ctx.lineTo(0.45, 1.0);
      ctx.closePath();
      ctx.fillStyle = '#FFD447';
      ctx.fill();
      ctx.lineWidth = 0.06;
      ctx.strokeStyle = O;
      ctx.stroke();
      ctx.restore();
      // お掃除パグの顔
      ctx.save();
      ctx.scale(0.82, 0.82);
      drawPugUnit(ctx, CLEANER_LOOK, false);
      ctx.restore();
    }
  }
  const CLEANER_LOOK = PPG.makeLook({ body: '#F4CF9C', shade: '#DDA86C', eyes: 'happy', mouth: 'smile',
    collar: null, acc: ['bandana'], blush: true, wrinkles: 1 });

  /* =========================================================
   * スプライトキャッシュ
   * look(見た目オブジェクト)ごと・ピクセルサイズごとに画像を作っておく
   * ========================================================= */
  const spriteCache = new Map();
  let cacheCount = 0;

  function getSprite(key, drawFn, pxRadius) {
    const R = Math.max(4, Math.round(pxRadius));
    let bySize = spriteCache.get(key);
    if (!bySize) { bySize = new Map(); spriteCache.set(key, bySize); }
    let cv = bySize.get(R);
    if (!cv) {
      const S = Math.ceil(R * SPRITE_MARGIN * 2) + 2;
      cv = document.createElement('canvas');
      cv.width = S;
      cv.height = S;
      const c = cv.getContext('2d');
      c.translate(S / 2, S / 2);
      c.scale(R, R);
      drawFn(c);
      bySize.set(R, cv);
      cacheCount++;
      if (cacheCount > 600) { spriteCache.clear(); cacheCount = 0; } // メモリ保護
    }
    return cv;
  }

  // 見た目オブジェクトに番号をふってキャッシュキーにする
  const lookIds = new WeakMap();
  let lookSeq = 0;
  function lookKey(look, blink) {
    let id = lookIds.get(look);
    if (!id) { id = 'L' + (++lookSeq); lookIds.set(look, id); }
    return id + (blink ? 'b' : '');
  }

  PPG.PugArt = {
    drawPugUnit: drawPugUnit,
    drawItemUnit: drawItemUnit,

    /** キャッシュを捨てる（画面サイズが変わったとき） */
    clearCache: function () { spriteCache.clear(); cacheCount = 0; },

    /**
     * パグを描く
     * @param ctx 描画先（すでに論理座標に変換されている）
     * @param pxPerUnit 論理座標1あたりの実ピクセル数
     */
    drawPug: function (ctx, look, x, y, r, pxPerUnit, opts) {
      opts = opts || {};
      const blink = !!opts.blink;
      const spr = getSprite(lookKey(look, blink), function (c) { drawPugUnit(c, look, blink); }, r * pxPerUnit * (opts.quality || 1));
      const size = (spr.width / (r * pxPerUnit * (opts.quality || 1))) * r;
      ctx.save();
      ctx.translate(x, y);
      if (opts.angle) ctx.rotate(opts.angle);
      if (opts.sx || opts.sy) ctx.scale(opts.sx || 1, opts.sy || 1);
      if (opts.alpha !== undefined) ctx.globalAlpha *= opts.alpha;
      ctx.drawImage(spr, -size / 2, -size / 2, size, size);
      ctx.restore();
    },

    drawItem: function (ctx, type, x, y, r, pxPerUnit, opts) {
      opts = opts || {};
      const spr = getSprite('item_' + type, function (c) { drawItemUnit(c, type); }, r * pxPerUnit);
      const size = (spr.width / (r * pxPerUnit)) * r;
      ctx.save();
      ctx.translate(x, y);
      if (opts.angle) ctx.rotate(opts.angle);
      if (opts.alpha !== undefined) ctx.globalAlpha *= opts.alpha;
      ctx.drawImage(spr, -size / 2, -size / 2, size, size);
      ctx.restore();
    },

    /** オーラ（レアパグ以上）。スプライトの下に毎フレーム描く */
    drawAura: function (ctx, aura, x, y, r, t) {
      const pulse = 0.75 + Math.sin(t * 3) * 0.25;
      const g = ctx.createRadialGradient(x, y, r * 0.6, x, y, r * 1.55);
      g.addColorStop(0, 'rgba(' + aura.color + ',' + (0.55 * pulse) + ')');
      g.addColorStop(1, 'rgba(' + aura.color + ',0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r * 1.55, 0, TAU);
      ctx.fill();
      if (aura.rays) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(t * 0.4);
        ctx.fillStyle = 'rgba(' + aura.color + ',0.35)';
        for (let i = 0; i < 12; i++) {
          ctx.rotate(TAU / 12);
          ctx.beginPath();
          ctx.moveTo(-r * 0.12, r * 0.9);
          ctx.lineTo(0, r * 1.75);
          ctx.lineTo(r * 0.12, r * 0.9);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      }
    },

    /**
     * 単体キャンバス（図鑑・次のパグ表示など）にパグを描く
     * silhouette: true で「？？？」用のシルエットにする
     */
    renderToCanvas: function (canvas, look, opts) {
      opts = opts || {};
      const ctx = canvas.getContext('2d');
      const w = canvas.width, h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      const R = Math.min(w, h) / (2 * (opts.fit || 1.5));
      ctx.save();
      ctx.translate(w / 2, h / 2 + (opts.offsetY || 0) * R);
      ctx.scale(R, R);
      if (opts.item) drawItemUnit(ctx, opts.item);
      else drawPugUnit(ctx, look, false);
      ctx.restore();
      if (opts.silhouette) {
        ctx.save();
        ctx.globalCompositeOperation = 'source-atop';
        ctx.fillStyle = opts.silhouetteColor || '#6B5A52';
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
      }
    }
  };
})(window.PPG);
