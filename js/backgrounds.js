/* =========================================================
 * パグの世界 - backgrounds.js（PUG PUG GARDEN から流用：背景描画）
 * ステージ背景。静止部分は画面サイズごとに一度だけ描いてキャッシュし、
 * 雪・星・キラキラなどの動く部分だけ毎フレーム描く。
 * ========================================================= */
'use strict';

(function (PPG) {
  const TAU = Math.PI * 2;
  const S = function () { return PPG.Shapes; };

  /* 決まった並びの乱数（背景が毎回同じ形になるように） */
  function seeded(seed) {
    let s = seed;
    return function () {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
  }

  function vGrad(ctx, h, stops) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    stops.forEach(function (st) { g.addColorStop(st[0], st[1]); });
    return g;
  }

  function cloud(ctx, x, y, s, color) {
    ctx.fillStyle = color || 'rgba(255,255,255,0.92)';
    ctx.beginPath();
    ctx.arc(x, y, s * 0.5, 0, TAU);
    ctx.arc(x + s * 0.5, y - s * 0.22, s * 0.6, 0, TAU);
    ctx.arc(x + s * 1.1, y, s * 0.5, 0, TAU);
    ctx.fill();
    ctx.fillRect(x, y - s * 0.05, s * 1.1, s * 0.5);
  }

  function hill(ctx, w, h, baseY, amp, color, phase, freq) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = 0; x <= w; x += w / 40) {
      ctx.lineTo(x, baseY - Math.sin(x / w * Math.PI * freq + phase) * amp);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();
  }

  function flower(ctx, x, y, s, petal, center) {
    ctx.fillStyle = petal;
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * TAU;
      ctx.beginPath();
      ctx.arc(x + Math.cos(a) * s, y + Math.sin(a) * s, s * 0.75, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = center;
    ctx.beginPath();
    ctx.arc(x, y, s * 0.6, 0, TAU);
    ctx.fill();
  }

  function pawPrint(ctx, x, y, s, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(x, y + s * 0.3, s * 0.55, s * 0.45, 0, 0, TAU);
    ctx.fill();
    [[-0.55, -0.3], [-0.2, -0.62], [0.2, -0.62], [0.55, -0.3]].forEach(function (p) {
      ctx.beginPath();
      ctx.arc(x + p[0] * s, y + p[1] * s, s * 0.22, 0, TAU);
      ctx.fill();
    });
  }

  /* ---------------- ステージ1：パグの庭 ---------------- */
  function drawGarden(ctx, w, h) {
    ctx.fillStyle = vGrad(ctx, h, [[0, '#9ED9FF'], [0.6, '#DDF3FF'], [1, '#EFFBEA']]);
    ctx.fillRect(0, 0, w, h);
    const u = Math.min(w, h);
    // 太陽
    ctx.fillStyle = 'rgba(255,228,92,0.35)';
    ctx.beginPath(); ctx.arc(w * 0.84, h * 0.09, u * 0.12, 0, TAU); ctx.fill();
    ctx.fillStyle = '#FFE45C';
    ctx.beginPath(); ctx.arc(w * 0.84, h * 0.09, u * 0.07, 0, TAU); ctx.fill();
    cloud(ctx, w * 0.08, h * 0.12, u * 0.12);
    cloud(ctx, w * 0.55, h * 0.2, u * 0.09);
    hill(ctx, w, h, h * 0.66, h * 0.05, '#A8E0A6', 0.5, 2.2);
    hill(ctx, w, h, h * 0.76, h * 0.035, '#79C98A', 2.0, 3);
    // 柵
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = 'rgba(59,40,31,0.35)';
    ctx.lineWidth = Math.max(1, u * 0.004);
    const fy = h * 0.72, fh = h * 0.07, pw = u * 0.035;
    ctx.fillRect(0, fy + fh * 0.25, w, fh * 0.14);
    ctx.fillRect(0, fy + fh * 0.62, w, fh * 0.14);
    for (let x = pw * 0.5; x < w; x += pw * 2.2) {
      ctx.beginPath();
      ctx.moveTo(x, fy + fh);
      ctx.lineTo(x, fy + pw * 0.5);
      ctx.lineTo(x + pw * 0.5, fy);
      ctx.lineTo(x + pw, fy + pw * 0.5);
      ctx.lineTo(x + pw, fy + fh);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.fillStyle = '#6CC58A';
    ctx.fillRect(0, h * 0.79, w, h * 0.21);
    const rnd = seeded(7);
    for (let i = 0; i < 26; i++) {
      const colors = ['#FF86AE', '#FFFFFF', '#FFD447', '#B99BFF'];
      flower(ctx, rnd() * w, h * 0.8 + rnd() * h * 0.2, u * 0.012, colors[i % 4], '#FFB23F');
    }
    for (let i = 0; i < 8; i++) pawPrint(ctx, rnd() * w, h * 0.84 + rnd() * h * 0.15, u * 0.02, 'rgba(59,40,31,0.12)');
  }

  /* ---------------- ステージ2：沖縄 ---------------- */
  function drawOkinawa(ctx, w, h) {
    const u = Math.min(w, h);
    ctx.fillStyle = vGrad(ctx, h, [[0, '#3FB4FF'], [0.45, '#B8ECFF'], [0.46, '#16A6C2'], [0.66, '#63DCD8'], [0.67, '#FFF0C8'], [1, '#FFE3A6']]);
    ctx.fillRect(0, 0, w, h);
    cloud(ctx, w * 0.62, h * 0.1, u * 0.14);
    cloud(ctx, w * 0.05, h * 0.2, u * 0.08);
    // 水面のきらめき線
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = Math.max(1, u * 0.004);
    const rnd = seeded(11);
    for (let i = 0; i < 22; i++) {
      const x = rnd() * w, y = h * 0.47 + rnd() * h * 0.18;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + u * 0.04, y); ctx.stroke();
    }
    // 首里城をイメージした赤い建物（左奥の丘の上）
    const bx = w * 0.04, by = h * 0.44, bw = u * 0.42, bh = u * 0.16;
    ctx.fillStyle = '#7FC98A';
    ctx.beginPath(); ctx.ellipse(bx + bw / 2, by + bh * 0.2, bw * 0.75, bh * 0.45, 0, Math.PI, TAU); ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(bx + bw * 0.1, by - bh * 0.25, bw * 0.8, bh * 0.25);
    ctx.fillStyle = '#C8322C';
    ctx.fillRect(bx + bw * 0.16, by - bh * 0.72, bw * 0.68, bh * 0.5);
    ctx.fillStyle = '#FFD447';
    ctx.fillRect(bx + bw * 0.44, by - bh * 0.62, bw * 0.12, bh * 0.4);
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = '#8C2A1E';
      ctx.fillRect(bx + bw * (0.2 + i * 0.17), by - bh * 0.62, bw * 0.05, bh * 0.36);
    }
    // 屋根（2段）
    [[0.72, 1.0, 0.55], [1.12, 0.72, 0.4]].forEach(function (r) {
      const ry = by - bh * r[0];
      const rw = bw * r[1];
      const cx = bx + bw / 2;
      ctx.fillStyle = '#E0673A';
      ctx.beginPath();
      ctx.moveTo(cx - rw / 2 - bw * 0.05, ry);
      ctx.quadraticCurveTo(cx - rw * 0.3, ry - bh * 0.1, cx - rw * 0.18, ry - bh * r[2]);
      ctx.lineTo(cx + rw * 0.18, ry - bh * r[2]);
      ctx.quadraticCurveTo(cx + rw * 0.3, ry - bh * 0.1, cx + rw / 2 + bw * 0.05, ry);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#9E3A22';
      ctx.fillRect(cx - rw / 2 - bw * 0.05, ry - bh * 0.03, rw + bw * 0.1, bh * 0.06);
    });
    // ヤシの木
    const tx = w * 0.88, ty = h * 0.7;
    ctx.strokeStyle = '#9C6B3E';
    ctx.lineWidth = u * 0.022;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(tx, ty); ctx.quadraticCurveTo(tx - u * 0.05, ty - u * 0.2, tx - u * 0.02, ty - u * 0.34); ctx.stroke();
    ctx.fillStyle = '#3FA35A';
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI / 2 + (i - 2.5) * 0.55;
      ctx.beginPath();
      ctx.ellipse(tx - u * 0.02 + Math.cos(a) * u * 0.08, ty - u * 0.34 + Math.sin(a) * u * 0.05 + u * 0.03, u * 0.1, u * 0.025, a, 0, TAU);
      ctx.fill();
    }
    // シーサー（右下の石垣の上）
    const sx = w * 0.8, sy = h * 0.86, ss = u * 0.11;
    ctx.fillStyle = '#C9B79A';
    ctx.fillRect(sx - ss * 1.1, sy, ss * 2.2, ss * 1.2);
    ctx.fillStyle = '#E09A4A';
    ctx.strokeStyle = '#7A4A1E';
    ctx.lineWidth = Math.max(1.2, ss * 0.06);
    ctx.beginPath(); ctx.ellipse(sx, sy - ss * 0.35, ss * 0.55, ss * 0.45, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(sx - ss * 0.1, sy - ss * 0.95, ss * 0.5, 0, TAU); ctx.fill(); ctx.stroke();
    // たてがみ
    ctx.fillStyle = '#C8322C';
    for (let i = 0; i < 7; i++) {
      const a = Math.PI * 0.75 + i * 0.35;
      ctx.beginPath(); ctx.arc(sx - ss * 0.1 + Math.cos(a) * ss * 0.5, sy - ss * 0.95 + Math.sin(a) * ss * 0.5, ss * 0.13, 0, TAU); ctx.fill();
    }
    ctx.fillStyle = '#1A110D';
    ctx.beginPath(); ctx.arc(sx - ss * 0.3, sy - ss * 1.02, ss * 0.07, 0, TAU); ctx.arc(sx + ss * 0.1, sy - ss * 1.02, ss * 0.07, 0, TAU); ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(sx - ss * 0.35, sy - ss * 0.78, ss * 0.5, ss * 0.1);
    // ハイビスカス
    [[w * 0.06, h * 0.9], [w * 0.2, h * 0.96], [w * 0.95, h * 0.97]].forEach(function (p) {
      flower(ctx, p[0], p[1], u * 0.03, '#FF3F5E', '#FFE45C');
    });
  }

  /* ---------------- ステージ3：釜山 ---------------- */
  function drawBusan(ctx, w, h) {
    const u = Math.min(w, h);
    ctx.fillStyle = vGrad(ctx, h, [[0, '#1B1E4B'], [0.35, '#4A3A8A'], [0.52, '#F28C74'], [0.56, '#FFC38A'], [0.57, '#1E3A6E'], [1, '#0F2347']]);
    ctx.fillRect(0, 0, w, h);
    const rnd = seeded(23);
    // 月
    ctx.fillStyle = '#FFF4C8';
    ctx.beginPath(); ctx.arc(w * 0.18, h * 0.1, u * 0.05, 0, TAU); ctx.fill();
    ctx.fillStyle = '#1B1E4B';
    ctx.beginPath(); ctx.arc(w * 0.2, h * 0.09, u * 0.045, 0, TAU); ctx.fill();
    // 高層ビル群
    for (let i = 0; i < 16; i++) {
      const bw = u * (0.05 + rnd() * 0.05);
      const bh = h * (0.08 + rnd() * 0.2);
      const x = w * 0.28 + i * (w * 0.72 / 16);
      const y = h * 0.565 - bh;
      ctx.fillStyle = i % 2 ? '#2B2E63' : '#353A74';
      ctx.fillRect(x, y, bw, bh);
      ctx.fillStyle = 'rgba(255,220,140,0.85)';
      for (let wy = y + u * 0.012; wy < h * 0.55; wy += u * 0.022) {
        for (let wx = x + u * 0.008; wx < x + bw - u * 0.01; wx += u * 0.016) {
          if (rnd() > 0.45) ctx.fillRect(wx, wy, u * 0.006, u * 0.008);
        }
      }
    }
    // 丘に並ぶカラフルな家（左側）
    ctx.fillStyle = '#2F3D6E';
    ctx.beginPath();
    ctx.moveTo(0, h * 0.57);
    ctx.lineTo(0, h * 0.3);
    ctx.quadraticCurveTo(w * 0.22, h * 0.34, w * 0.42, h * 0.57);
    ctx.closePath();
    ctx.fill();
    const houseColors = ['#FF9EB5', '#7FD6E8', '#FFE07A', '#A7E08A', '#C9A8FF', '#FFB374'];
    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 6; col++) {
        const x = col * u * 0.06 + row * u * 0.012;
        const y = h * 0.34 + row * h * 0.033;
        const hillY = h * 0.3 + (x / (w * 0.42)) * (x / (w * 0.42)) * h * 0.27;
        if (y < hillY + h * 0.01 || x > w * 0.4) continue;
        ctx.fillStyle = houseColors[(row * 3 + col) % houseColors.length];
        ctx.fillRect(x, y, u * 0.045, h * 0.026);
        ctx.fillStyle = 'rgba(255,240,180,0.9)';
        ctx.fillRect(x + u * 0.01, y + h * 0.008, u * 0.01, h * 0.01);
      }
    }
    // 大きな吊り橋（海の上）
    const by = h * 0.63;
    ctx.strokeStyle = '#9FB6E8';
    ctx.lineWidth = Math.max(1.5, u * 0.008);
    ctx.beginPath(); ctx.moveTo(0, by); ctx.lineTo(w, by); ctx.stroke();
    [w * 0.3, w * 0.7].forEach(function (px) {
      ctx.fillStyle = '#B9C8EE';
      ctx.fillRect(px - u * 0.008, by - h * 0.1, u * 0.016, h * 0.11);
    });
    ctx.lineWidth = Math.max(1, u * 0.004);
    ctx.beginPath();
    ctx.moveTo(0, by - h * 0.02);
    ctx.quadraticCurveTo(w * 0.15, by - h * 0.01, w * 0.3, by - h * 0.1);
    ctx.quadraticCurveTo(w * 0.5, by + h * 0.01, w * 0.7, by - h * 0.1);
    ctx.quadraticCurveTo(w * 0.85, by - h * 0.01, w, by - h * 0.02);
    ctx.stroke();
    // 港のクレーン（右下）
    ctx.strokeStyle = '#E8504F';
    ctx.lineWidth = Math.max(1.5, u * 0.01);
    const cx = w * 0.86, cy = h * 0.8;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, cy - h * 0.14); ctx.lineTo(cx - u * 0.18, cy - h * 0.14); ctx.moveTo(cx, cy - h * 0.14); ctx.lineTo(cx + u * 0.05, cy - h * 0.14); ctx.stroke();
    ctx.fillStyle = '#233C6A';
    ctx.fillRect(w * 0.7, cy, w * 0.3, h * 0.03);
    // 船
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath(); ctx.moveTo(w * 0.1, h * 0.84); ctx.lineTo(w * 0.3, h * 0.84); ctx.lineTo(w * 0.27, h * 0.87); ctx.lineTo(w * 0.13, h * 0.87); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#E8504F';
    ctx.fillRect(w * 0.17, h * 0.815, w * 0.06, h * 0.025);
    // 水面に映る光
    for (let i = 0; i < 30; i++) {
      ctx.fillStyle = 'rgba(255,210,140,' + (0.2 + rnd() * 0.4) + ')';
      ctx.fillRect(w * 0.28 + rnd() * w * 0.72, h * 0.58 + rnd() * h * 0.05, u * 0.03, Math.max(1, u * 0.003));
    }
  }

  /* ---------------- ステージ4：北海道 ---------------- */
  function drawHokkaido(ctx, w, h) {
    const u = Math.min(w, h);
    ctx.fillStyle = vGrad(ctx, h, [[0, '#63B8FF'], [0.55, '#DDF1FF'], [1, '#FFFFFF']]);
    ctx.fillRect(0, 0, w, h);
    cloud(ctx, w * 0.1, h * 0.1, u * 0.1);
    // 雪山
    function mountain(x, peakY, halfW, color, snow) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x - halfW, h * 0.7);
      ctx.lineTo(x, peakY);
      ctx.lineTo(x + halfW, h * 0.7);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = snow;
      ctx.beginPath();
      const sh = (h * 0.7 - peakY) * 0.38;
      const k = sh / (h * 0.7 - peakY);
      ctx.moveTo(x - halfW * k, peakY + sh);
      ctx.lineTo(x, peakY);
      ctx.lineTo(x + halfW * k, peakY + sh);
      for (let i = 3; i >= 0; i--) ctx.lineTo(x - halfW * k + (i / 3) * halfW * k * 2, peakY + sh + (i % 2 ? sh * 0.2 : 0));
      ctx.closePath();
      ctx.fill();
    }
    mountain(w * 0.25, h * 0.26, w * 0.45, '#8FA8D8', '#FFFFFF');
    mountain(w * 0.78, h * 0.33, w * 0.4, '#7B97CF', '#F4FAFF');
    // 雪原
    hill(ctx, w, h, h * 0.72, h * 0.025, '#FFFFFF', 1, 2);
    ctx.fillStyle = '#EAF5FF';
    ctx.fillRect(0, h * 0.82, w, h * 0.18);
    // 雪をかぶった木
    const rnd = seeded(31);
    for (let i = 0; i < 9; i++) {
      const x = (i / 8) * w + (rnd() - 0.5) * u * 0.05;
      const base = h * (0.74 + rnd() * 0.06);
      const s = u * (0.05 + rnd() * 0.03);
      for (let k = 0; k < 3; k++) {
        const ty = base - k * s * 0.7;
        ctx.fillStyle = '#2F7A58';
        ctx.beginPath(); ctx.moveTo(x - s * (1 - k * 0.25), ty); ctx.lineTo(x, ty - s * 1.1); ctx.lineTo(x + s * (1 - k * 0.25), ty); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath(); ctx.moveTo(x - s * 0.35, ty - s * 0.7); ctx.lineTo(x, ty - s * 1.1); ctx.lineTo(x + s * 0.35, ty - s * 0.7); ctx.closePath(); ctx.fill();
      }
    }
  }

  /* ---------------- ステージ5：パグ王国 ---------------- */
  function drawKingdom(ctx, w, h) {
    const u = Math.min(w, h);
    ctx.fillStyle = vGrad(ctx, h, [[0, '#A58BFF'], [0.55, '#FFC7E3'], [1, '#FFE8A8']]);
    ctx.fillRect(0, 0, w, h);
    // 虹
    const rc = ['#FF6B8B', '#FFB347', '#FFE45C', '#6BD68A', '#5BB8F0', '#A98BF0'];
    ctx.lineWidth = u * 0.025;
    rc.forEach(function (c, i) {
      ctx.strokeStyle = c;
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.62, w * 0.62 - i * u * 0.025, Math.PI, TAU);
      ctx.stroke();
    });
    ctx.globalAlpha = 1;
    // お城
    const cx = w * 0.5, base = h * 0.7, cw = u * 0.5;
    ctx.fillStyle = '#FFF1F7';
    ctx.strokeStyle = 'rgba(59,40,31,0.4)';
    ctx.lineWidth = Math.max(1, u * 0.004);
    ctx.fillRect(cx - cw / 2, base - cw * 0.45, cw, cw * 0.45);
    ctx.strokeRect(cx - cw / 2, base - cw * 0.45, cw, cw * 0.45);
    [[-0.5, 0.8], [0.5, 0.8], [0, 1.05]].forEach(function (t) {
      const tx = cx + t[0] * cw, tw = cw * 0.2, th = cw * t[1];
      ctx.fillStyle = '#FFE0EE';
      ctx.fillRect(tx - tw / 2, base - th, tw, th);
      ctx.strokeRect(tx - tw / 2, base - th, tw, th);
      ctx.fillStyle = '#8B6BE8';
      ctx.beginPath(); ctx.moveTo(tx - tw * 0.65, base - th); ctx.lineTo(tx, base - th - tw * 1.2); ctx.lineTo(tx + tw * 0.65, base - th); ctx.closePath(); ctx.fill(); ctx.stroke();
      // 旗
      ctx.strokeStyle = '#3B281F';
      ctx.beginPath(); ctx.moveTo(tx, base - th - tw * 1.2); ctx.lineTo(tx, base - th - tw * 1.9); ctx.stroke();
      ctx.fillStyle = '#FFD447';
      ctx.beginPath(); ctx.moveTo(tx, base - th - tw * 1.9); ctx.lineTo(tx + tw * 0.7, base - th - tw * 1.72); ctx.lineTo(tx, base - th - tw * 1.55); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(59,40,31,0.4)';
    });
    // 門（パグの顔）
    ctx.fillStyle = '#5A3E30';
    ctx.beginPath(); ctx.arc(cx, base - cw * 0.12, cw * 0.12, Math.PI, TAU); ctx.fillRect(cx - cw * 0.12, base - cw * 0.12, cw * 0.24, cw * 0.12); ctx.fill();
    ctx.fillStyle = '#FFD447';
    ctx.beginPath(); ctx.arc(cx, base - cw * 0.34, cw * 0.06, 0, TAU); ctx.fill();
    // 地面（チェック柄）
    ctx.fillStyle = '#FFD9A8';
    ctx.fillRect(0, base, w, h - base);
    ctx.fillStyle = '#FFC98A';
    const cs = u * 0.06;
    for (let y = base, r = 0; y < h; y += cs, r++) {
      for (let x = (r % 2) * cs; x < w; x += cs * 2) ctx.fillRect(x, y, cs, cs);
    }
    // 浮かぶ王冠
    const rnd = seeded(41);
    for (let i = 0; i < 6; i++) {
      const x = rnd() * w, y = h * (0.1 + rnd() * 0.35), s = u * 0.025;
      ctx.fillStyle = 'rgba(255,212,71,0.8)';
      ctx.beginPath();
      ctx.moveTo(x - s, y + s * 0.5); ctx.lineTo(x - s, y - s * 0.5); ctx.lineTo(x - s * 0.4, y); ctx.lineTo(x, y - s * 0.8); ctx.lineTo(x + s * 0.4, y); ctx.lineTo(x + s, y - s * 0.5); ctx.lineTo(x + s, y + s * 0.5);
      ctx.closePath(); ctx.fill();
    }
  }

  const DRAWERS = { garden: drawGarden, okinawa: drawOkinawa, busan: drawBusan, hokkaido: drawHokkaido, kingdom: drawKingdom };

  /* ---------------- 動く演出（毎フレーム） ---------------- */
  const motes = [];
  function ensureMotes(n) {
    const rnd = seeded(97);
    while (motes.length < n) motes.push({ x: rnd(), y: rnd(), s: 0.5 + rnd(), p: rnd() * TAU });
  }

  function drawAnimated(ctx, stageId, w, h, t) {
    const u = Math.min(w, h);
    ensureMotes(60);
    if (stageId === 'hokkaido') {
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      motes.forEach(function (m) {
        const y = ((m.y + t * 0.04 * m.s) % 1) * h;
        const x = ((m.x + Math.sin(t * 0.8 + m.p) * 0.02 + 1) % 1) * w;
        ctx.beginPath(); ctx.arc(x, y, u * 0.004 * (1 + m.s), 0, TAU); ctx.fill();
      });
    } else if (stageId === 'busan') {
      motes.slice(0, 30).forEach(function (m) {
        const a = 0.3 + 0.7 * Math.abs(Math.sin(t * 1.5 + m.p));
        ctx.fillStyle = 'rgba(255,255,230,' + a + ')';
        ctx.beginPath(); ctx.arc(m.x * w, m.y * h * 0.35, u * 0.0025 * (1 + m.s), 0, TAU); ctx.fill();
      });
      // 橋のライト
      for (let i = 0; i < 12; i++) {
        const on = Math.sin(t * 2 + i * 0.7) > 0;
        ctx.fillStyle = on ? 'rgba(255,240,160,0.95)' : 'rgba(160,190,255,0.7)';
        ctx.beginPath(); ctx.arc((i + 0.5) / 12 * w, h * 0.63, u * 0.004, 0, TAU); ctx.fill();
      }
    } else if (stageId === 'okinawa') {
      motes.slice(0, 18).forEach(function (m) {
        const a = Math.max(0, Math.sin(t * 2 + m.p * 3));
        if (a < 0.2) return;
        ctx.fillStyle = 'rgba(255,255,255,' + a + ')';
        S().sparkPath(ctx, m.x * w, h * 0.47 + m.y * h * 0.18, u * 0.008 * a);
        ctx.fill();
      });
    } else if (stageId === 'kingdom') {
      motes.slice(0, 24).forEach(function (m) {
        const y = (1 - ((m.y + t * 0.02 * m.s) % 1)) * h;
        const a = 0.4 + 0.6 * Math.abs(Math.sin(t * 2 + m.p));
        ctx.fillStyle = 'rgba(255,240,150,' + a + ')';
        S().sparkPath(ctx, m.x * w, y, u * 0.008 * m.s);
        ctx.fill();
      });
    } else {
      // 庭：ふわふわ飛ぶ花びら
      motes.slice(0, 12).forEach(function (m) {
        const x = ((m.x + t * 0.015 * m.s) % 1) * w;
        const y = (m.y * 0.6 + Math.sin(t + m.p) * 0.02) * h;
        ctx.fillStyle = 'rgba(255,160,190,0.7)';
        ctx.beginPath(); ctx.ellipse(x, y, u * 0.007, u * 0.004, t + m.p, 0, TAU); ctx.fill();
      });
    }
  }

  /* ---------------- キャッシュ付き背景 ---------------- */
  PPG.Background = {
    cache: {},
    /** ステージの静止背景を(w,h)ピクセルで返す */
    get: function (stageId, w, h) {
      const key = stageId + '_' + w + 'x' + h;
      if (!this.cache[key]) {
        const cv = document.createElement('canvas');
        cv.width = w;
        cv.height = h;
        (DRAWERS[stageId] || drawGarden)(cv.getContext('2d'), w, h);
        this.cache[key] = cv;
      }
      return this.cache[key];
    },
    clear: function () { this.cache = {}; },
    drawAnimated: drawAnimated
  };
})(window.PPG);
