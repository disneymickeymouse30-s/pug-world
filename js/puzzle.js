/* =========================================================
 * パグの世界 - puzzle.js
 * 盤面エンジン：テトリス風の落下・回転・ライン消去（pug-tetris から移植）と、
 * スイカゲーム風の「同じおやつが3つつながると融合して大きくなる」を1つの盤面で動かす。
 *
 * 1手の流れ：固定 → [ライン消去 → 融合 → 重力] を何も起きなくなるまで繰り返す → 次のブロック
 * 戦闘のことは知らない。起きたことを hooks で battle.js に知らせるだけ。
 * ========================================================= */
'use strict';
(function (PW) {
  const B = PW.BOARD, T = PW.TIMING, R = PW.RULES;
  const KICKS = [[0, 0], [-1, 0], [1, 0], [0, -1], [-2, 0], [2, 0], [-1, -1], [1, -1]];
  let cellSeq = 1;

  function makeCell(t, lv) { return { id: cellSeq++, t: t, lv: lv, vy: 0, pop: 0, flash: 0 }; }
  function rand(n) { return Math.floor(Math.random() * n); }

  PW.Puzzle = function (canvas, hooks) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.hooks = hooks || {};
    this.layout = { w: 1, h: 1, dpr: 1, cs: 20, ox: 0, oy: 0 };
    this.fx = [];     // 粒
    this.texts = [];  // 浮かぶ文字
    this.reset({});
  };
  const P = PW.Puzzle.prototype;

  /* =========================================================
   * 初期化
   * ========================================================= */
  P.reset = function (opts) {
    this.grid = [];
    for (let y = 0; y < B.ROWS; y++) this.grid.push(new Array(B.COLS).fill(null));
    this.piece = null;
    this.next = null;
    this.bag = [];
    this.mode = 'idle';     // idle / fall / resolve / held / over
    this.paused = false;
    this.fallMs = (opts && opts.fallMs) || T.FALL_MS;
    this.fallTimer = 0;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.soft = false;
    this.res = null;
    this.shake = 0;
    this.lastHole = rand(B.COLS);
    this.fx.length = 0;
    this.texts.length = 0;
    this.time = 0;
  };

  P.setFallMs = function (ms) { this.fallMs = ms; };

  P.start = function () {
    this.mode = 'fall';
    this.spawn();
  };

  /* =========================================================
   * ブロックづくり
   * ========================================================= */
  P.nextShape = function () {
    if (!this.bag.length) {
      this.bag = PW.SHAPES.slice();
      for (let i = this.bag.length - 1; i > 0; i--) {
        const j = rand(i + 1);
        const tmp = this.bag[i]; this.bag[i] = this.bag[j]; this.bag[j] = tmp;
      }
    }
    return this.bag.pop();
  };

  P.makePiece = function () {
    const shape = this.nextShape();
    const nT = PW.DATA.TREATS.length;
    const count = [0, 0, 0];
    const m = shape.m.map(function (row) {
      return row.map(function (v) {
        if (!v) return null;
        // 1つのブロックに同じおやつは2つまで（置いた瞬間に勝手に融合しないように）
        let t = rand(nT), guard = 0;
        while (count[t] >= 2 && guard++ < 10) t = rand(nT);
        count[t]++;
        return makeCell(t, Math.random() < R.LV2_CHANCE ? 2 : 1);
      });
    });
    return { id: shape.id, m: m, x: 0, y: 0 };
  };

  P.spawn = function () {
    const p = this.next || this.makePiece();
    this.next = this.makePiece();
    const n = p.m.length;
    let top = 0;
    while (top < n && p.m[top].every(function (c) { return !c; })) top++;
    p.x = Math.floor((B.COLS - n) / 2);
    p.y = -top;
    this.piece = p;
    this.fallTimer = 0;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.mode = 'fall';
    if (this.hooks.onNext) this.hooks.onNext(this.next);
    if (this.hooks.onSpawn) this.hooks.onSpawn(p);
    if (this.collide(p.m, p.x, p.y)) this.topOut();
  };

  /* =========================================================
   * 当たり判定・操作
   * ========================================================= */
  P.collide = function (m, px, py) {
    for (let r = 0; r < m.length; r++) {
      for (let c = 0; c < m[r].length; c++) {
        if (!m[r][c]) continue;
        const x = px + c, y = py + r;
        if (x < 0 || x >= B.COLS || y >= B.ROWS) return true;
        if (y >= 0 && this.grid[y][x]) return true;
      }
    }
    return false;
  };

  P.canControl = function () { return this.mode === 'fall' && this.piece && !this.paused; };

  P.grounded = function () { return this.piece && this.collide(this.piece.m, this.piece.x, this.piece.y + 1); };

  P.touchLock = function () {
    if (this.grounded() && this.lockResets < 14) { this.lockTimer = 0; this.lockResets++; }
  };

  P.move = function (dx) {
    if (!this.canControl()) return false;
    const p = this.piece;
    if (this.collide(p.m, p.x + dx, p.y)) return false;
    p.x += dx;
    this.touchLock();
    if (this.hooks.onMove) this.hooks.onMove(dx);
    return true;
  };

  P.rotate = function () {
    if (!this.canControl()) return false;
    const p = this.piece;
    if (p.id === 'O') return false;
    const n = p.m.length;
    const m = [];
    for (let r = 0; r < n; r++) {
      m.push([]);
      for (let c = 0; c < n; c++) m[r].push(p.m[n - 1 - c][r]);
    }
    for (let i = 0; i < KICKS.length; i++) {
      const k = KICKS[i];
      if (!this.collide(m, p.x + k[0], p.y + k[1])) {
        p.m = m;
        p.x += k[0];
        p.y += k[1];
        this.touchLock();
        if (this.hooks.onRotate) this.hooks.onRotate();
        return true;
      }
    }
    return false;
  };

  P.stepDown = function () {
    const p = this.piece;
    if (!p) return false;
    if (!this.collide(p.m, p.x, p.y + 1)) { p.y++; return true; }
    return false;
  };

  P.softDrop = function (on) { this.soft = !!on; };

  P.hardDrop = function () {
    if (!this.canControl()) return;
    let n = 0;
    while (this.stepDown()) n++;
    this.shake = Math.max(this.shake, 3);
    if (this.hooks.onHardDrop) this.hooks.onHardDrop(n);
    this.lock();
  };

  P.ghostY = function () {
    const p = this.piece;
    let y = p.y;
    while (!this.collide(p.m, p.x, y + 1)) y++;
    return y;
  };

  /* =========================================================
   * 固定
   * ========================================================= */
  P.lock = function () {
    const p = this.piece;
    if (!p) return;
    let out = false;
    for (let r = 0; r < p.m.length; r++) {
      for (let c = 0; c < p.m[r].length; c++) {
        const cell = p.m[r][c];
        if (!cell) continue;
        const x = p.x + c, y = p.y + r;
        if (y < 0) { out = true; continue; }
        cell.vy = y;
        cell.pop = 0.35;
        this.grid[y][x] = cell;
      }
    }
    this.piece = null;
    if (this.hooks.onLock) this.hooks.onLock();
    if (out) { this.topOut(); return; }
    this.beginResolve();
  };

  P.topOut = function () {
    if (this.mode === 'over') return;
    this.mode = 'over';
    this.piece = null;
    if (this.hooks.onTopOut) this.hooks.onTopOut();
  };

  /* =========================================================
   * 連鎖の処理（ライン消去 → 融合 → 重力 をくり返す）
   * ========================================================= */
  P.beginResolve = function () {
    this.mode = 'resolve';
    this.res = { phase: 'settle', timer: 0, combo: 0, lines: 0, fuses: 0, pending: null };
  };

  P.findLines = function () {
    const rows = [];
    for (let y = 0; y < B.ROWS; y++) {
      if (this.grid[y].every(function (c) { return !!c; })) rows.push(y);
    }
    return rows;
  };

  P.findFuses = function () {
    const seen = {};
    const groups = [];
    const g = this.grid;
    for (let y = 0; y < B.ROWS; y++) {
      for (let x = 0; x < B.COLS; x++) {
        const c = g[y][x];
        if (!c || c.t < 0 || seen[y * 100 + x]) continue;
        const group = [];
        const stack = [[x, y]];
        seen[y * 100 + x] = true;
        while (stack.length) {
          const q = stack.pop();
          group.push({ x: q[0], y: q[1] });
          [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) {
            const nx = q[0] + d[0], ny = q[1] + d[1];
            if (nx < 0 || nx >= B.COLS || ny < 0 || ny >= B.ROWS || seen[ny * 100 + nx]) return;
            const o = g[ny][nx];
            if (o && o.t === c.t && o.lv === c.lv) { seen[ny * 100 + nx] = true; stack.push([nx, ny]); }
          });
        }
        if (group.length >= R.FUSE_MIN) groups.push({ t: c.t, lv: c.lv, cells: group });
      }
    }
    return groups;
  };

  P.applyGravity = function () {
    let moved = false;
    for (let x = 0; x < B.COLS; x++) {
      let write = B.ROWS - 1;
      for (let y = B.ROWS - 1; y >= 0; y--) {
        const c = this.grid[y][x];
        if (!c) continue;
        if (write !== y) {
          this.grid[write][x] = c;
          this.grid[y][x] = null;
          moved = true;
        }
        write--;
      }
    }
    return moved;
  };

  P.updateResolve = function (dt) {
    const s = this.res;
    if (s.phase === 'settle') {
      if (!this.anyMoving()) s.phase = 'check';
      return;
    }
    if (s.phase === 'check') {
      const lines = this.findLines();
      if (lines.length) {
        s.phase = 'clearing';
        s.timer = T.CLEAR_MS;
        s.pending = lines;
        const self = this;
        lines.forEach(function (y) { self.grid[y].forEach(function (c) { c.flash = 1; }); });
        if (this.hooks.onClearStart) this.hooks.onClearStart(lines.length, s.combo);
        return;
      }
      const groups = this.findFuses();
      if (groups.length) {
        s.phase = 'fusing';
        s.timer = T.FUSE_MS;
        s.pending = groups;
        const g = this.grid;
        groups.forEach(function (gr) { gr.cells.forEach(function (p) { g[p.y][p.x].flash = 0.8; }); });
        return;
      }
      this.endResolve();
      return;
    }
    s.timer -= dt;
    if (s.timer > 0) return;
    if (s.phase === 'clearing') this.doClear(s.pending);
    else if (s.phase === 'fusing') this.doFuse(s.pending);
    s.pending = null;
    this.applyGravity();
    s.phase = 'settle';
  };

  P.doClear = function (rows) {
    const s = this.res;
    const vals = [0, 0, 0];
    const gained = [];
    let junk = 0;
    const cs = this.layout.cs;
    const self = this;
    rows.forEach(function (y) {
      self.grid[y].forEach(function (c, x) {
        if (c.t >= 0) {
          vals[c.t] += R.VALUE[c.lv];
          gained.push({ t: c.t, lv: c.lv });
          self.burstFx(x, y, PW.DATA.TREATS[c.t].tileDeep, 5);
        } else {
          junk++;
          self.burstFx(x, y, '#A39A93', 4);
        }
      });
      self.grid[y] = new Array(B.COLS).fill(null);
    });
    s.combo++;
    s.lines += rows.length;
    this.shake = Math.max(this.shake, rows.length >= 3 ? 7 : 4);
    if (this.hooks.onClear) {
      this.hooks.onClear({ lines: rows.length, vals: vals, gained: gained, junk: junk, combo: s.combo, rowY: rows[0], cs: cs });
    }
  };

  P.doFuse = function (groups) {
    const s = this.res;
    const center = (B.COLS - 1) / 2;
    const results = [];
    const g = this.grid;
    const self = this;
    groups.forEach(function (gr) {
      // 一番下（同じ高さなら真ん中寄り）のマスに集まる
      let target = gr.cells[0];
      gr.cells.forEach(function (p) {
        if (p.y > target.y || (p.y === target.y && Math.abs(p.x - center) < Math.abs(target.x - center))) target = p;
      });
      const burst = gr.lv >= R.MAX_LV;
      gr.cells.forEach(function (p) {
        const c = g[p.y][p.x];
        if (!burst && p === target) {
          c.lv += 1;
          c.pop = 1;
          c.flash = 0;
        } else {
          g[p.y][p.x] = null;
          self.burstFx(p.x, p.y, PW.DATA.TREATS[gr.t].tileDeep, burst ? 8 : 3, burst ? null : target);
        }
      });
      results.push({ t: gr.t, lv: burst ? gr.lv : gr.lv + 1, burst: burst, count: gr.cells.length, x: target.x, y: target.y });
    });
    s.combo++;
    s.fuses += groups.length;
    if (groups.some(function (r) { return r.lv >= R.MAX_LV; })) this.shake = Math.max(this.shake, 10);
    if (this.hooks.onFuse) this.hooks.onFuse({ results: results, combo: s.combo });
  };

  P.endResolve = function () {
    const s = this.res;
    this.res = null;
    const hold = this.hooks.onResolveEnd ? this.hooks.onResolveEnd({ combo: s.combo, lines: s.lines, fuses: s.fuses }) : false;
    if (this.mode === 'over') return;
    if (hold) { this.mode = 'held'; return; }
    this.continuePlay();
  };

  /** 保留（敵を倒した後など）から再開 */
  P.continuePlay = function () {
    if (this.mode === 'over') return;
    if (this.piece) {
      // スキル使用中に止めていたブロックを戻す
      let tries = 0;
      while (this.collide(this.piece.m, this.piece.x, this.piece.y) && tries++ < 4) this.piece.y--;
      this.mode = 'fall';
      if (this.collide(this.piece.m, this.piece.x, this.piece.y)) this.topOut();
    } else {
      this.spawn();
    }
  };

  P.anyMoving = function () {
    for (let y = 0; y < B.ROWS; y++) {
      for (let x = 0; x < B.COLS; x++) {
        const c = this.grid[y][x];
        if (c && Math.abs(c.vy - y) > 0.001) return true;
      }
    }
    return false;
  };

  /* =========================================================
   * 外からの干渉（敵のいたずら・スキル）
   * ========================================================= */
  /** 下からお邪魔ブロックを rows 段せり上げる。あふれたら false */
  P.addGarbage = function (rows) {
    let ok = true;
    for (let n = 0; n < rows; n++) {
      if (this.grid[0].some(function (c) { return !!c; })) ok = false;
      this.grid.shift();
      if (Math.random() > 0.7) this.lastHole = rand(B.COLS);
      const row = [];
      for (let x = 0; x < B.COLS; x++) {
        if (x === this.lastHole) { row.push(null); continue; }
        const c = makeCell(-1, 1);
        c.vy = B.ROWS + n;
        row.push(c);
      }
      this.grid.push(row);
    }
    if (this.piece) {
      let tries = 0;
      while (this.collide(this.piece.m, this.piece.x, this.piece.y) && tries++ < rows + 2) this.piece.y--;
    }
    this.shake = Math.max(this.shake, 6);
    if (!ok) { this.topOut(); return false; }
    return true;
  };

  /** 条件に合うマスを消す（モチのスキル）。消した数を返し、連鎖処理を始める */
  P.eatCells = function (pred) {
    if (this.mode !== 'fall' || this.paused) return -1;
    const list = [];
    for (let y = 0; y < B.ROWS; y++) {
      for (let x = 0; x < B.COLS; x++) {
        const c = this.grid[y][x];
        if (c && pred(c)) { list.push({ t: c.t, lv: c.lv }); this.burstFx(x, y, '#FFD447', 4); this.grid[y][x] = null; }
      }
    }
    if (!list.length) return 0;
    this.applyGravity();
    this.beginResolve();
    return list.length;
  };

  P.stackHeight = function () {
    for (let y = 0; y < B.ROWS; y++) if (this.grid[y].some(function (c) { return !!c; })) return B.ROWS - y;
    return 0;
  };

  /* =========================================================
   * 毎フレームの更新
   * ========================================================= */
  P.update = function (dt) {
    if (this.paused) return;
    this.time += dt;
    this.frameDt = dt;
    // 見た目の移動（重力で落ちる・せり上がる）
    const sp = T.FALL_SPEED * dt / 1000;
    for (let y = 0; y < B.ROWS; y++) {
      for (let x = 0; x < B.COLS; x++) {
        const c = this.grid[y][x];
        if (!c) continue;
        if (c.vy < y) c.vy = Math.min(y, c.vy + sp * (1 + (y - c.vy) * 0.3));
        else if (c.vy > y) c.vy = Math.max(y, c.vy - sp);
        if (c.pop > 0) c.pop = Math.max(0, c.pop - dt / 260);
        if (c.flash > 0 && this.mode !== 'resolve') c.flash = Math.max(0, c.flash - dt / 200);
      }
    }
    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt / 40);

    if (this.mode === 'resolve') { this.updateResolve(dt); return; }
    if (this.mode !== 'fall' || !this.piece) return;

    const interval = this.soft ? T.SOFT_MS : this.fallMs;
    this.fallTimer += dt;
    while (this.fallTimer >= interval) {
      this.fallTimer -= interval;
      if (!this.stepDown()) break;
      this.lockTimer = 0;
    }
    if (this.grounded()) {
      this.lockTimer += dt;
      if (this.lockTimer >= T.LOCK_MS || (this.soft && this.lockTimer >= 90)) this.lock();
    } else {
      this.lockTimer = 0;
    }
  };

  /* =========================================================
   * 演出
   * ========================================================= */
  P.burstFx = function (gx, gy, color, n, toward) {
    const cs = this.layout.cs;
    const x = (gx + 0.5) * cs, y = (gy + 0.5) * cs;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = (0.4 + Math.random()) * cs * 3.2;
      let vx = Math.cos(a) * v, vy = Math.sin(a) * v - cs * 2;
      if (toward) {
        vx = ((toward.x + 0.5) * cs - x) * 3 + (Math.random() - 0.5) * cs;
        vy = ((toward.y + 0.5) * cs - y) * 3 + (Math.random() - 0.5) * cs;
      }
      this.fx.push({ x: x, y: y, vx: vx, vy: vy, life: 0, max: 450 + Math.random() * 250,
        r: cs * (0.08 + Math.random() * 0.1), color: color, grav: toward ? 0 : cs * 9 });
    }
    if (this.fx.length > 180) this.fx.splice(0, this.fx.length - 180);
  };

  /** 盤面の上に浮かぶ文字（gx, gy はマス座標） */
  P.addText = function (text, gx, gy, color, size, dur) {
    this.texts.push({ text: text, x: gx, y: gy, color: color || '#FFFFFF', size: size || 1, life: 0, max: dur || 1000 });
    if (this.texts.length > 8) this.texts.shift();
  };

  /* =========================================================
   * 描画
   * ========================================================= */
  P.resize = function () {
    const parent = this.canvas.parentElement;
    const rect = parent.getBoundingClientRect();
    const w = Math.max(80, rect.width), h = Math.max(80, rect.height);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const L = this.layout;
    L.w = w; L.h = h; L.dpr = dpr;
    L.cs = Math.floor(Math.min((w - 8) / B.COLS, (h - 8) / B.ROWS));
    L.ox = Math.round((w - L.cs * B.COLS) / 2);
    L.oy = Math.round((h - L.cs * B.ROWS) / 2);
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    PW.TreatArt.clear();
  };

  P.render = function () {
    const ctx = this.ctx, L = this.layout, cs = L.cs;
    const W = cs * B.COLS, H = cs * B.ROWS;
    const tpx = cs * L.dpr;
    ctx.setTransform(L.dpr, 0, 0, L.dpr, 0, 0);
    ctx.clearRect(0, 0, L.w, L.h);
    const sx = this.shake ? (Math.random() - 0.5) * this.shake : 0;
    const sy = this.shake ? (Math.random() - 0.5) * this.shake : 0;
    ctx.translate(L.ox + sx, L.oy + sy);

    // 盤面の地
    PW.roundRect(ctx, -4, -4, W + 8, H + 8, 14);
    ctx.fillStyle = 'rgba(255, 252, 244, 0.9)';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#3B281F';
    ctx.stroke();
    ctx.fillStyle = 'rgba(59, 40, 31, 0.1)';
    for (let y = 1; y < B.ROWS; y++) for (let x = 1; x < B.COLS; x++) {
      ctx.beginPath(); ctx.arc(x * cs, y * cs, Math.max(1, cs * 0.04), 0, Math.PI * 2); ctx.fill();
    }
    // 危険ライン（上から3段目）
    const danger = this.stackHeight() >= B.ROWS - 3;
    if (danger) {
      ctx.fillStyle = 'rgba(232, 80, 79,' + (0.12 + 0.08 * Math.sin(this.time / 120)) + ')';
      ctx.fillRect(0, 0, W, cs * 3);
    }
    ctx.save();
    ctx.beginPath();
    ctx.rect(-2, -2, W + 4, H + 4);
    ctx.clip();

    // 置かれたおやつ
    for (let y = 0; y < B.ROWS; y++) {
      for (let x = 0; x < B.COLS; x++) {
        const c = this.grid[y][x];
        if (c) this.drawCell(ctx, c, x * cs, c.vy * cs, cs, tpx);
      }
    }
    // ゴーストとブロック
    const p = this.piece;
    if (p && (this.mode === 'fall' || this.mode === 'resolve' || this.mode === 'held')) {
      if (this.mode === 'fall') {
        const gy = this.ghostY();
        ctx.save();
        ctx.globalAlpha = 0.28;
        this.eachPieceCell(p, function (c, x, y) {
          PW.roundRect(ctx, x * cs + 2, (gy + y - p.y) * cs + 2, cs - 4, cs - 4, cs * 0.2);
          ctx.fillStyle = PW.DATA.TREATS[c.t].tileDeep;
          ctx.fill();
        });
        ctx.restore();
      }
      const self = this;
      this.eachPieceCell(p, function (c, x, y) { self.drawCell(ctx, c, x * cs, y * cs, cs, tpx); });
    }
    ctx.restore();

    // 粒
    const dt = this.paused ? 0 : Math.min(50, this.frameDt || 16);
    this.frameDt = 0;
    for (let i = this.fx.length - 1; i >= 0; i--) {
      const f = this.fx[i];
      f.life += dt;
      if (f.life > f.max) { this.fx.splice(i, 1); continue; }
      f.vy += f.grav * dt / 1000;
      f.x += f.vx * dt / 1000;
      f.y += f.vy * dt / 1000;
      ctx.globalAlpha = 1 - f.life / f.max;
      ctx.fillStyle = f.color;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // 浮かぶ文字
    for (let i = this.texts.length - 1; i >= 0; i--) {
      const t = this.texts[i];
      t.life += dt;
      if (t.life > t.max) { this.texts.splice(i, 1); continue; }
      const k = t.life / t.max;
      const px = Math.max(cs * 0.5, Math.min(W - cs * 0.5, (t.x + 0.5) * cs));
      const py = (t.y + 0.5) * cs - k * cs * 1.2;
      const size = cs * 0.55 * t.size * (k < 0.15 ? 0.6 + k / 0.15 * 0.4 : 1);
      ctx.globalAlpha = k > 0.75 ? (1 - k) / 0.25 : 1;
      ctx.font = '800 ' + Math.round(size) + 'px "Mochiy Pop One", "M PLUS Rounded 1c", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round';
      ctx.lineWidth = Math.max(3, size * 0.22);
      ctx.strokeStyle = '#3B281F';
      ctx.strokeText(t.text, px, py);
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, px, py);
    }
    ctx.globalAlpha = 1;
  };

  P.eachPieceCell = function (p, fn) {
    for (let r = 0; r < p.m.length; r++) {
      for (let c = 0; c < p.m[r].length; c++) {
        const cell = p.m[r][c];
        if (cell) fn(cell, p.x + c, p.y + r);
      }
    }
  };

  P.drawCell = function (ctx, c, x, y, cs, tpx) {
    const img = PW.TreatArt.tile(c.t, c.lv, tpx);
    const s = 1 + c.pop * 0.28;
    const d = cs * s;
    ctx.drawImage(img, x + (cs - d) / 2, y + (cs - d) / 2, d, d);
    if (c.flash > 0) {
      ctx.globalAlpha = c.flash * (0.55 + 0.35 * Math.sin(this.time / 40));
      ctx.fillStyle = '#FFFFFF';
      PW.roundRect(ctx, x + 1, y + 1, cs - 2, cs - 2, cs * 0.2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  };

  /** 「つぎ」表示用に1つのブロックを小さなキャンバスへ描く */
  PW.Puzzle.renderPiece = function (canvas, piece) {
    const c = canvas.getContext('2d');
    c.clearRect(0, 0, canvas.width, canvas.height);
    if (!piece) return;
    let minR = 9, maxR = -1, minC = 9, maxC = -1;
    piece.m.forEach(function (row, r) {
      row.forEach(function (v, k) {
        if (!v) return;
        minR = Math.min(minR, r); maxR = Math.max(maxR, r);
        minC = Math.min(minC, k); maxC = Math.max(maxC, k);
      });
    });
    const w = maxC - minC + 1, h = maxR - minR + 1;
    const cs = Math.floor(Math.min(canvas.width / (w + 0.4), canvas.height / (h + 0.4)));
    const ox = (canvas.width - w * cs) / 2, oy = (canvas.height - h * cs) / 2;
    piece.m.forEach(function (row, r) {
      row.forEach(function (v, k) {
        if (v) c.drawImage(PW.TreatArt.tile(v.t, v.lv, cs), ox + (k - minC) * cs, oy + (r - minR) * cs, cs, cs);
      });
    });
  };

  /* =========================================================
   * 指での操作（pug-tetris のドラッグ操作を pointer イベントで作り直し）
   *   左右ドラッグ：1マスずつ移動 / 下ドラッグ：ゆっくり落とす
   *   下へはらう：一気に落とす / タップ：回転
   * ========================================================= */
  P.bindPointer = function (el) {
    const self = this;
    let g = null;
    el.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      g = { id: e.pointerId, x0: e.clientX, y0: e.clientY, lx: e.clientX, ly: e.clientY, t0: performance.now(), moved: false, soft: 0 };
      try { el.setPointerCapture(e.pointerId); } catch (err) { /* 非対応 */ }
      if (self.hooks.onUserInput) self.hooks.onUserInput();
    });
    el.addEventListener('pointermove', function (e) {
      if (!g || e.pointerId !== g.id || !self.canControl()) return;
      const step = Math.max(14, self.layout.cs * 0.85);
      const dx = e.clientX - g.lx;
      const nx = Math.trunc(dx / step);
      if (nx) {
        for (let i = 0; i < Math.abs(nx); i++) if (self.move(nx > 0 ? 1 : -1) && PW.Sound) PW.Sound.move();
        g.lx += nx * step;
        g.moved = true;
      }
      const dy = e.clientY - g.ly;
      if (dy > step && Math.abs(e.clientY - g.y0) > Math.abs(e.clientX - g.x0)) {
        const ny = Math.trunc(dy / step);
        for (let i = 0; i < ny; i++) self.stepDown();
        g.ly += ny * step;
        g.soft += ny;
        g.moved = true;
        self.fallTimer = 0;
      } else if (dy < -step) {
        g.ly = e.clientY;
      }
    });
    function end(e) {
      if (!g || e.pointerId !== g.id) return;
      const dt = performance.now() - g.t0;
      const dy = e.clientY - g.y0, dx = e.clientX - g.x0;
      if (e.type === 'pointerup' && self.canControl()) {
        if (!g.moved && dt < 300 && Math.abs(dx) < 10 && Math.abs(dy) < 10) {
          if (self.rotate() && PW.Sound) PW.Sound.rotate();
        } else if (dy > self.layout.cs * 1.5 && dy / Math.max(1, dt) > 0.9 && Math.abs(dy) > Math.abs(dx) * 1.5) {
          if (PW.Sound) PW.Sound.hardDrop();
          self.hardDrop();
        }
      }
      g = null;
    }
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
  };
})(window.PW);
