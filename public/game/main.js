// M2D Lab RPG — ゲーム本体（外部ライブラリなし）
import { TILE, getTile } from './tiles.js';
import { getSprite, SPRITE_H } from './sprites.js';
import { MAPS, LEGEND } from './maps.js';

const W = 240, H = 160;                       // 内部解像度（携帯機と同じ 3:2）。整数倍に拡大して表示する
const FONT = '"DotGothic16", "Noto Sans JP", monospace';
const SPEED = 2;                              // 1 フレームの移動量 [px]（8 フレームで 1 マス）
const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const OPPOSITE = { up: 'down', down: 'up', left: 'right', right: 'left' };
const SPRITE_DY = SPRITE_H - TILE;            // 足元をタイルに合わせるための上方向のずれ

// ---------- データ（Astro が <script id="game-data"> に埋め込む） ----------
function loadData() {
  let d = {};
  try { d = JSON.parse(document.getElementById('game-data').textContent); } catch (e) { console.warn('game-data missing', e); }
  return Object.assign({ base: '/', site: {}, members: [], equipment: [], publications: [], research: [], news: [], pages: [] }, d);
}

// ---------- 入力 ----------
const KEYMAP = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right', z: 'a', Z: 'a', Enter: 'a', ' ': 'a', x: 'b', X: 'b', Escape: 'b', m: 'menu', M: 'menu' };
class Input {
  constructor() {
    this.held = {}; this.pressed = {}; this.any = false;
    addEventListener('keydown', (e) => { const k = KEYMAP[e.key]; if (!k) return; e.preventDefault(); if (!e.repeat) this.press(k); else this.held[k] = true; });
    addEventListener('keyup', (e) => { const k = KEYMAP[e.key]; if (k) this.held[k] = false; });
  }
  press(k) { this.pressed[k] = true; this.held[k] = true; this.any = true; }
  bindButton(el, k) {
    const down = (e) => { e.preventDefault(); this.press(k); el.classList.add('on'); };
    const up = (e) => { e.preventDefault(); this.held[k] = false; el.classList.remove('on'); };
    el.addEventListener('pointerdown', down);
    for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) el.addEventListener(ev, up);
  }
  consume(k) { const v = !!this.pressed[k]; this.pressed[k] = false; return v; }
  endFrame() { this.pressed = {}; this.any = false; }
}

// ---------- 描画ユーティリティ ----------
function drawWindow(g, x, y, w, h) {
  g.fillStyle = '#f8f8f8'; g.fillRect(x, y, w, h);
  g.fillStyle = '#303030'; g.fillRect(x, y, w, 1); g.fillRect(x, y + h - 1, w, 1); g.fillRect(x, y, 1, h); g.fillRect(x + w - 1, y, 1, h);
  g.fillStyle = '#7890c8'; g.fillRect(x + 1, y + 1, w - 2, 2); g.fillRect(x + 1, y + h - 3, w - 2, 2); g.fillRect(x + 1, y + 1, 2, h - 2); g.fillRect(x + w - 3, y + 1, 2, h - 2);
  g.fillStyle = '#ffffff'; g.fillRect(x + 3, y + 3, w - 6, h - 6);
}
const TEXT = '#303030', TEXT_HI = '#d04a4a', TEXT_MUTED = '#8890a0';
function setFont(g, px = 16) { g.font = `${px}px ${FONT}`; g.textBaseline = 'top'; }
const NO_HEAD = '。、，．）」』】！？ゝゞーっゃゅょぁぃぅぇぉ';   // 行頭に置かない文字（簡易禁則処理）
function wrapText(g, text, maxW) {
  const lines = [];
  for (const para of String(text).split('\n')) {
    let line = '';
    for (const ch of para) {
      const t = line + ch;
      if (g.measureText(t).width > maxW && line && !NO_HEAD.includes(ch)) { lines.push(line); line = ch; } else line = t;
    }
    lines.push(line);
  }
  return lines;
}
function outlinedText(g, text, x, y, fill, outline) {
  g.fillStyle = outline;
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]]) g.fillText(text, x + dx, y + dy);
  g.fillStyle = fill; g.fillText(text, x, y);
}
const splitSentences = (s) => String(s).split(/(?<=。)/).map((t) => t.trim()).filter(Boolean);
const pad2 = (n) => String(n).padStart(2, '0');

// ---------- 会話ウィンドウ（2 行） ----------
class Dialog {
  constructor(game) { this.game = game; this.open = false; this.pages = []; }
  show(pages, opts = {}) {
    const g = this.game.ctx; setFont(g);
    const LINES = 2;
    this.pages = [];
    for (const raw of pages) {
      const p = typeof raw === 'string' ? { text: raw } : raw;
      const lines = wrapText(g, p.text, W - 44);
      for (let i = 0; i < lines.length; i += LINES) {
        const last = i + LINES >= lines.length;
        this.pages.push({ name: p.name, lines: lines.slice(i, i + LINES), choice: last ? p.choice : undefined });
      }
    }
    this.i = 0; this.open = true; this.onClose = opts.onClose || null; this.tick = 0;
    this.begin();
  }
  begin() { const p = this.pages[this.i]; this.chars = 0; this.total = p.lines.join('').length; this.choice = p.choice ? { options: p.choice, index: 0 } : null; }
  update(input) {
    this.tick++;
    if (this.chars < this.total) { if (this.tick % 2 === 0) this.chars++; if (input.consume('a')) this.chars = this.total; return; }
    if (this.choice) {
      const n = this.choice.options.length;
      if (input.consume('up')) this.choice.index = (this.choice.index + n - 1) % n;
      if (input.consume('down')) this.choice.index = (this.choice.index + 1) % n;
      if (input.consume('a')) this.close(this.choice.index); else if (input.consume('b')) this.close(n - 1);
      return;
    }
    if (input.consume('a') || input.consume('b')) { if (this.i < this.pages.length - 1) { this.i++; this.begin(); } else this.close(null); }
  }
  close(result) { this.open = false; const cb = this.onClose; this.onClose = null; if (cb) cb(result); }
  draw(g) {
    const p = this.pages[this.i];
    const boxH = 46, y = H - boxH - 2;
    drawWindow(g, 2, y, W - 4, boxH);
    setFont(g);
    if (p.name) { const nw = Math.ceil(g.measureText(p.name).width) + 14; drawWindow(g, 6, y - 20, nw, 22); g.fillStyle = TEXT_HI; g.fillText(p.name, 13, y - 17); }
    g.fillStyle = TEXT;
    let drawn = 0;
    p.lines.forEach((line, k) => { const n = Math.min(line.length, this.chars - drawn); if (n > 0) g.fillText(line.slice(0, n), 10, y + 7 + k * 17); drawn += line.length; });
    if (this.chars >= this.total) {
      if (this.choice) {
        const cw = 80, ch = this.choice.options.length * 17 + 12, cx = W - 2 - cw, cy = y - ch - 1;
        drawWindow(g, cx, cy, cw, ch);
        this.choice.options.forEach((o, k) => { g.fillStyle = TEXT; g.fillText((k === this.choice.index ? '▶' : '　') + o, cx + 6, cy + 6 + k * 17); });
      } else if (Math.floor(this.tick / 20) % 2 === 0) { g.fillStyle = TEXT_HI; g.fillText('▼', W - 24, y + boxH - 20); }
    }
  }
}

// ---------- メニュー ----------
class Menu {
  constructor(game) { this.game = game; this.open = false; this.index = 0; this.items = []; }
  show() {
    const pages = this.game.data.pages.map((p) => ({ label: p.label, action: () => { location.href = p.href; } }));
    this.items = [...pages, { label: () => (this.game.crt ? 'がめん：CRT' : 'がめん：ふつう'), action: () => this.game.toggleCrt() }];
    this.open = true; this.index = 0;
  }
  update(input) {
    const n = this.items.length;
    if (input.consume('up')) this.index = (this.index + n - 1) % n;
    if (input.consume('down')) this.index = (this.index + 1) % n;
    if (input.consume('a')) this.items[this.index].action();
    if (input.consume('b') || input.consume('menu')) this.open = false;
  }
  draw(g) {
    setFont(g);
    const w = 150, h = this.items.length * 16 + 12, x = W - w - 2, y = 2;
    drawWindow(g, x, y, w, h);
    this.items.forEach((it, k) => { const label = typeof it.label === 'function' ? it.label() : it.label; g.fillStyle = k === this.index ? TEXT_HI : TEXT; g.fillText((k === this.index ? '▶' : '　') + label, x + 6, y + 6 + k * 16); });
  }
}

// ---------- タイトル画面（動く一枚絵） ----------
class Title {
  constructor(game) { this.game = game; this.t = 0; this.index = 0; this.items = [{ label: 'はじめる' }, { label: 'せつめいしょ' }]; }
  update(input) {
    this.t++;
    if (this.t < 70) { if (input.any) this.t = 70; return; }                 // ロゴ落下中は飛ばせる
    const n = this.items.length;
    if (input.consume('up')) this.index = (this.index + n - 1) % n;
    if (input.consume('down')) this.index = (this.index + 1) % n;
    if (input.consume('a')) {
      if (this.index === 0) this.game.startFade(() => { this.game.state = 'world'; this.game.hudTimer = 150; });
      else { const p = this.game.data.pages[0]; if (p) location.href = p.href; }
    }
  }
  draw(g) {
    const t = this.t;
    // 空
    const sky = ['#6fb7f0', '#84c4f4', '#9ad1f7', '#b3dffa', '#cdeafc'];
    sky.forEach((c, i) => { g.fillStyle = c; g.fillRect(0, i * 18, W, 18); });
    g.fillStyle = '#def2ff'; g.fillRect(0, 90, W, 14);
    // 雲（速さの違う 2 層）
    const cloud = (x, y, s) => { g.fillStyle = '#ffffff'; g.fillRect(x, y + 4 * s, 24 * s, 6 * s); g.fillRect(x + 5 * s, y, 12 * s, 6 * s); g.fillRect(x + 14 * s, y + 2 * s, 8 * s, 5 * s); g.fillStyle = '#e4f1fb'; g.fillRect(x, y + 8 * s, 24 * s, 2 * s); };
    for (let i = 0; i < 3; i++) cloud(((i * 95 + t * 0.15) % (W + 60)) - 50, 8 + i * 16, 1);
    for (let i = 0; i < 2; i++) cloud(((i * 150 + 40 + t * 0.35) % (W + 80)) - 60, 40 + i * 20, 1.5);
    // 遠景の山と木
    g.fillStyle = '#5fae6a'; for (let x = 0; x < W; x += 24) { const top = 92 - ((x / 24) % 3) * 3; g.fillRect(x, top, 24, 106 - top); }
    // 建物（ウエスト4号館）
    const bx = 128, by = 56, bw = 96, bh = 50;
    g.fillStyle = '#8c98a8'; g.fillRect(bx - 2, by - 4, bw + 4, 4);
    g.fillStyle = '#f3eadb'; g.fillRect(bx, by, bw, bh);
    g.fillStyle = '#d9cdb4'; g.fillRect(bx, by + bh - 4, bw, 4);
    for (let r = 0; r < 4; r++) for (let c = 0; c < 7; c++) { g.fillStyle = (r + c) % 5 === 0 ? '#fff3b0' : '#8fd3f4'; g.fillRect(bx + 6 + c * 13, by + 5 + r * 11, 8, 7); }
    g.fillStyle = '#5f6b7a'; g.fillRect(bx + 40, by + bh - 12, 16, 12); g.fillStyle = '#bfe8ff'; g.fillRect(bx + 42, by + bh - 10, 5, 6); g.fillRect(bx + 49, by + bh - 10, 5, 6);
    g.fillStyle = '#ffffff'; g.fillRect(bx + 60, by + bh - 14, 30, 8); g.fillStyle = '#e85c4a'; g.fillRect(bx + 62, by + bh - 12, 12, 4); g.fillStyle = '#5f6b7a'; g.fillRect(bx + 76, by + bh - 12, 12, 1); g.fillRect(bx + 76, by + bh - 9, 10, 1);
    // 手前の木
    const tree = (x, y) => { g.fillStyle = '#8a5a2b'; g.fillRect(x + 6, y + 14, 4, 8); g.fillStyle = '#3f9b3a'; g.fillRect(x + 2, y + 4, 12, 12); g.fillRect(x + 4, y, 8, 6); g.fillStyle = '#6fcf5a'; g.fillRect(x + 4, y + 2, 3, 3); g.fillStyle = '#2c7a2c'; g.fillRect(x + 9, y + 10, 4, 4); };
    tree(100, 84); tree(226, 86); tree(10, 80);
    // 草地（風で揺れる）
    g.fillStyle = '#8cd65a'; g.fillRect(0, 106, W, H - 106);
    g.fillStyle = '#7ac44a'; g.fillRect(0, 106, W, 2);
    const sway = Math.floor(t / 18) % 2;
    g.fillStyle = '#5aa838';
    for (let x = 2; x < W; x += 14) { const yy = 112 + ((x / 14) % 4) * 11; g.fillRect(x + sway, yy, 1, 3); g.fillRect(x + 2 + sway, yy, 1, 3); g.fillRect(x + 1 + sway, yy + 1, 1, 2); }
    g.fillStyle = '#eedc9a'; g.fillRect(0, 140, W, 8);
    // キャラクター（その場で足踏み）
    const frame = [0, 1, 0, 2][Math.floor(t / 12) % 4];
    g.drawImage(getSprite('player', 'down', frame), 40, 128);
    // ロゴ（上から落ちて着地で弾む）
    const drop = Math.min(1, t / 50);
    const ease = 1 - Math.pow(1 - drop, 3);
    const bounce = t > 50 && t < 62 ? -Math.sin((t - 50) / 12 * Math.PI) * 3 : 0;
    const ly = -40 + (40 + 22) * ease + bounce;
    g.textAlign = 'center';
    setFont(g, 32); outlinedText(g, 'M2D LAB', W / 2, ly, '#ffd84a', '#303030');
    setFont(g, 16);
    if (t > 55) { outlinedText(g, this.game.data.site.labName || '材料創製力学研究室', W / 2, ly + 36, '#ffffff', '#303030'); }
    g.textAlign = 'left';
    // メニュー
    if (t >= 70) {
      const w = 126, h = this.items.length * 17 + 12, x = W - w - 8, y = 112;
      drawWindow(g, x, y, w, h);
      this.items.forEach((it, k) => { g.fillStyle = k === this.index ? TEXT_HI : TEXT; g.fillText((k === this.index ? '▶' : '　') + it.label, x + 6, y + 6 + k * 17); });
      g.textAlign = 'center'; g.fillStyle = '#303030';
      setFont(g, 16); if (Math.floor(t / 30) % 2 === 0) g.fillText('Z / A ボタンで けってい', W / 2, 150 - 2);
      g.textAlign = 'left';
    }
  }
}

// ---------- ゲーム ----------
class Game {
  constructor(canvas, data) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.data = data;
    this.ctx.imageSmoothingEnabled = false;
    this.input = new Input(); this.dialog = new Dialog(this); this.menu = new Menu(this); this.title = new Title(this);
    this.state = 'title'; this.tick = 0; this.crt = false; this.hudTimer = 0;
    this.fade = { alpha: 1, target: 0, cb: null };
    this.player = { tx: 0, ty: 0, x: 0, y: 0, dir: 'down', moving: false, anim: 0 };
    const s = MAPS.campus.start;
    this.loadMap('campus', s.x - MAPS.campus._pad.l, s.y - MAPS.campus._pad.t, s.facing);
    canvas.addEventListener('pointerdown', (e) => { e.preventDefault(); this.input.press('a'); });
    canvas.addEventListener('pointerup', () => { this.input.held.a = false; });
  }
  // --- マップ ---
  loadMap(name, tx, ty, facing) {
    const m = MAPS[name]; this.mapName = name; this.map = m; this.legend = LEGEND[m.theme];
    tx += m._pad.l; ty += m._pad.t;
    this.cols = m.rows[0].length; this.rowsN = m.rows.length;
    Object.assign(this.player, { tx, ty, x: tx * TILE, y: ty * TILE, dir: facing, moving: false, anim: 0 });
    this.npcs = (m.npcs || []).map((n) => ({ ...n, px: n.x * TILE, py: n.y * TILE, moving: false, anim: 0, wait: 60 + Math.floor(Math.random() * 60) }));
    if (m.studentSpots) {
      const palettes = ['studentA', 'studentB', 'studentC', 'studentD'];
      this.data.members.filter((mm) => mm.group === 'student').slice(0, m.studentSpots.length)
        .forEach((s, i) => { const sp = m.studentSpots[i]; this.npcs.push({ id: 'student', member: s, ...sp, px: sp.x * TILE, py: sp.y * TILE, moving: false, anim: 0 }); });
    }
    this.eqIndex = new Map(); let k = 0;
    m.rows.forEach((row, y) => [...row].forEach((ch, x) => { if (ch === 'e') this.eqIndex.set(`${x},${y}`, k++); }));
    this.hudTimer = 150;
  }
  tileAt(x, y) { if (y < 0 || y >= this.rowsN || x < 0 || x >= this.cols) return this.map.theme === 'outdoor' ? 'T' : '#'; return this.map.rows[y][x]; }
  info(x, y) { return this.legend[this.tileAt(x, y)] || {}; }
  npcAt(x, y) { return this.npcs.find((n) => (n.x === x && n.y === y) || (n.moving && n.nx === x && n.ny === y)); }
  warpAt(x, y) { return (this.map.warps || []).find((w) => w.x === x && w.y === y); }
  isSolid(x, y) {
    const ch = this.tileAt(x, y);
    if (ch === 'D' && !this.warpAt(x, y)) return true;          // ワープ先のないドアは閉まっている
    if (this.info(x, y).solid) return true;
    return !!this.npcAt(x, y) || (this.player.tx === x && this.player.ty === y);
  }
  startFade(cb) { this.fade = { alpha: 0, target: 1, cb }; }
  toggleCrt() { this.crt = !this.crt; document.body.classList.toggle('crt', this.crt); }

  // --- 更新 ---
  update() {
    this.tick++;
    const f = this.fade;
    if (f.alpha !== f.target) {
      f.alpha += Math.sign(f.target - f.alpha) * 0.06;
      if (Math.abs(f.alpha - f.target) < 0.06) { f.alpha = f.target; if (f.alpha === 1) { const cb = f.cb; f.cb = null; if (cb) cb(); f.target = 0; } }
      this.input.endFrame(); return;
    }
    if (this.state === 'title') { this.title.update(this.input); this.input.endFrame(); return; }
    if (this.hudTimer > 0) this.hudTimer--;
    if (this.dialog.open) this.dialog.update(this.input);
    else if (this.menu.open) this.menu.update(this.input);
    else { this.updateWorld(); this.updateNpcs(); }
    this.input.endFrame();
  }
  updateWorld() {
    const p = this.player, inp = this.input;
    if (!p.moving) {
      if (inp.consume('menu') || inp.consume('b')) { this.menu.show(); return; }
      if (inp.consume('a')) { this.interact(); return; }
      const dir = ['up', 'down', 'left', 'right'].find((d) => inp.held[d] || inp.pressed[d]);
      if (dir) {
        p.dir = dir;
        const [dx, dy] = DIRS[dir];
        const nx = p.tx + dx, ny = p.ty + dy;
        const ch = this.tileAt(nx, ny);
        const blocked = (ch === 'D' && !this.warpAt(nx, ny)) || this.info(nx, ny).solid || this.npcAt(nx, ny);
        if (!blocked) { p.moving = true; p.ntx = nx; p.nty = ny; }
      } else p.anim = 0;
    }
    if (p.moving) {
      p.anim++;
      const gx = p.ntx * TILE, gy = p.nty * TILE;
      p.x += Math.sign(gx - p.x) * Math.min(SPEED, Math.abs(gx - p.x));
      p.y += Math.sign(gy - p.y) * Math.min(SPEED, Math.abs(gy - p.y));
      if (p.x === gx && p.y === gy) {
        p.moving = false; p.tx = p.ntx; p.ty = p.nty;
        const w = this.warpAt(p.tx, p.ty);
        if (w) this.startFade(() => this.loadMap(w.to, w.tx, w.ty, w.facing));
      }
    }
  }
  updateNpcs() {
    for (const n of this.npcs) {
      if (!n.wander) continue;
      if (n.moving) {
        n.anim++;
        const gx = n.nx * TILE, gy = n.ny * TILE;
        n.px += Math.sign(gx - n.px) * Math.min(1, Math.abs(gx - n.px));
        n.py += Math.sign(gy - n.py) * Math.min(1, Math.abs(gy - n.py));
        if (n.px === gx && n.py === gy) { n.moving = false; n.x = n.nx; n.y = n.ny; n.wait = 40 + Math.floor(Math.random() * 100); }
        continue;
      }
      n.anim = 0;
      if (--n.wait > 0) continue;
      const dir = ['up', 'down', 'left', 'right'][Math.floor(Math.random() * 4)];
      n.facing = dir; n.wait = 30;
      const [dx, dy] = DIRS[dir]; const nx = n.x + dx, ny = n.y + dy;
      if (this.tileAt(nx, ny) !== '=' && this.tileAt(nx, ny) !== '.' && this.tileAt(nx, ny) !== ',') continue;
      if (this.isSolid(nx, ny) || this.warpAt(nx, ny) || (this.player.moving && this.player.ntx === nx && this.player.nty === ny)) continue;
      n.moving = true; n.nx = nx; n.ny = ny;
    }
  }
  facingTile() { const [dx, dy] = DIRS[this.player.dir]; return [this.player.tx + dx, this.player.ty + dy]; }
  interact() {
    const [fx, fy] = this.facingTile();
    const npc = this.npcAt(fx, fy);
    if (npc && !npc.moving) { npc.facing = OPPOSITE[this.player.dir]; this.talk(npc); return; }
    const ch = this.tileAt(fx, fy);
    if (ch === 'D' && !this.warpAt(fx, fy)) { this.dialog.show(['カギが かかっている。']); return; }
    const act = this.info(fx, fy).act;
    if (act) this.examine(act, fx, fy);
  }
  talk(npc) {
    const d = this.data;
    if (npc.id === 'kimura') {
      const m = d.members.find((x) => x.id === 'kimura') || d.members.find((x) => x.group === 'faculty') || { name: '木村 康裕', role: '准教授' };
      const name = m.name;
      const pages = [{ name, text: `${m.name}です。${m.role}を しています。` }];
      if (m.bio) pages.push(...splitSentences(m.bio).map((t) => ({ name, text: t })));
      pages.push({ name, text: 'くわしくは メニューの「研究室概要」を 見てください。' });
      this.dialog.show(pages);
    } else if (npc.id === 'student' && npc.member) {
      const m = npc.member;
      let text = `${m.name}です。${m.role}です。`;
      if (m.interests && m.interests.length) text += `\n${m.interests.join('、')}を 研究しています。`;
      this.dialog.show([{ name: m.name, text }]);
    } else if (npc.lines) {
      this.dialog.show(npc.lines.map((t) => ({ name: npc.name, text: t })));
    }
  }
  examine(act, x, y) {
    const d = this.data, s = d.site;
    switch (act) {
      case 'sign': this.dialog.show([(this.map.signs || {})[`${x},${y}`] || '看板が ある。']); break;
      case 'research': { const pages = ['ホワイトボードに 研究テーマが 書かれている。']; d.research.forEach((r, i) => pages.push(`${i + 1}. ${r.title}`, r.summary)); this.dialog.show(pages); break; }
      case 'news': { const pages = ['掲示板に お知らせが 貼られている。']; d.news.slice(0, 4).forEach((n) => pages.push(`${n.date}\n${n.title}`)); this.dialog.show(pages); break; }
      case 'pubs': {
        const pubs = d.publications; const pages = ['本棚には 研究室の論文が 並んでいる。'];
        if (pubs.length) { const years = pubs.map((p) => p.year); pages.push(`査読付き論文 ${pubs.length}件（${Math.min(...years)}〜${Math.max(...years)}年）。`); pubs.slice(0, 2).forEach((p) => pages.push(`${p.venue}（${p.year}）`, p.title)); }
        pages.push('くわしくは メニューの「業績」を 見てください。'); this.dialog.show(pages); break;
      }
      case 'equipment': { const eq = d.equipment[this.eqIndex.get(`${x},${y}`) ?? -1]; this.dialog.show(eq ? [eq.name, eq.description] : ['装置が ある。']); break; }
      case 'elevator': case 'stairs': {
        const ex = this.map.exit;
        if (!ex) { this.dialog.show([act === 'elevator' ? 'エレベーター。' : '階段。']); break; }
        this.dialog.show([{ text: `${act === 'elevator' ? 'エレベーター' : '階段'}。\n1Fへ 降りますか？`, choice: ['はい', 'いいえ'] }],
          { onClose: (sel) => { if (sel === 0) this.startFade(() => this.loadMap(ex.to, ex.tx, ex.ty, ex.facing)); } });
        break;
      }
      case 'pc': this.dialog.show(['机の上に PCがある。\n電源は 入っていない。']); break;
      case 'reception': {
        this.dialog.show(['見学受付：\n研究室見学・Web面談は いつでも 受け付けています。', { text: '問い合わせフォームを 開きますか？', choice: ['はい', 'いいえ'] }],
          { onClose: (sel) => { if (sel === 0 && s.contactFormUrl) window.open(s.contactFormUrl, '_blank', 'noopener'); } });
        break;
      }
    }
  }

  // --- 描画 ---
  camera() {
    const mw = this.cols * TILE, mh = this.rowsN * TILE, p = this.player;
    const cx = mw <= W ? -(W - mw) / 2 : Math.max(0, Math.min(mw - W, p.x + 8 - W / 2));
    const cy = mh <= H ? -(H - mh) / 2 : Math.max(0, Math.min(mh - H, p.y + 8 - H / 2));
    return [Math.round(cx), Math.round(cy)];
  }
  draw() {
    const g = this.ctx;
    g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
    if (this.state === 'title') this.title.draw(g);
    else {
      const [cx, cy] = this.camera();
      this.drawMap(g, cx, cy);
      this.drawSprites(g, cx, cy);
      this.drawOverlay(g, cx, cy);
      this.drawHud(g);
      if (this.menu.open) this.menu.draw(g);
      if (this.dialog.open) this.dialog.draw(g);
    }
    if (this.fade.alpha > 0) { g.fillStyle = `rgba(0,0,0,${this.fade.alpha})`; g.fillRect(0, 0, W, H); }
  }
  visibleRange(cx, cy) {
    return [Math.max(0, Math.floor(cx / TILE)), Math.max(0, Math.floor(cy / TILE)), Math.min(this.cols - 1, Math.ceil((cx + W) / TILE)), Math.min(this.rowsN - 1, Math.ceil((cy + H) / TILE) + 1)];
  }
  drawMap(g, cx, cy) {
    const [x0, y0, x1, y1] = this.visibleRange(cx, cy);
    const flowerFrame = Math.floor(this.tick / 30) % 2;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const ch = this.tileAt(x, y);
      const info = this.legend[ch] || this.legend['.'];
      let tile;
      if (ch === '#') tile = (y + 1 < this.rowsN && this.tileAt(x, y + 1) !== '#') ? getTile('wallFace') : getTile('wallTop');
      else if (info.tile === 'grass' || info.tile === 'floor' || info.tile === 'path') tile = getTile(info.tile, (x * 7 + y * 13) % 3);
      else if (info.tile === 'flower') tile = getTile('flower', flowerFrame);
      else if (info.tile === 'shelf') tile = getTile('shelf', x % 3);
      else if (info.tile === 'equipment') tile = getTile('equipment', this.eqIndex.get(`${x},${y}`) ?? 0);
      else if (info.tile === 'roof') tile = getTile('roof', this.tileAt(x, y - 1) === 'R' ? 0 : 1);
      else tile = getTile(info.tile);
      g.drawImage(tile, x * TILE - cx, y * TILE - cy);
    }
  }
  drawSprites(g, cx, cy) {
    const list = this.npcs.map((n) => ({ x: n.px, y: n.py, img: getSprite(n.palette, n.facing, n.moving ? [0, 1, 0, 2][Math.floor(n.anim / 8) % 4] : 0) }));
    const p = this.player;
    list.push({ x: p.x, y: p.y, img: getSprite('player', p.dir, p.moving ? [0, 1, 0, 2][Math.floor(p.anim / 8) % 4] : 0) });
    list.sort((a, b) => a.y - b.y).forEach((s) => g.drawImage(s.img, s.x - cx, s.y - SPRITE_DY - cy));
  }
  drawOverlay(g, cx, cy) {
    // 木の上半分を手前に重ねる（キャラクターが木の陰に入る）
    const [x0, y0, x1, y1] = this.visibleRange(cx, cy);
    for (let y = y0; y <= y1 + 1; y++) for (let x = x0; x <= x1; x++) {
      const ov = (this.legend[this.tileAt(x, y)] || {}).overlay;
      if (ov) g.drawImage(getTile(ov), x * TILE - cx, (y - 1) * TILE - cy);
    }
    const p = this.player;
    if (!this.dialog.open && !this.menu.open && !p.moving) {
      const [fx, fy] = this.facingTile();
      const ch = this.tileAt(fx, fy);
      const target = this.npcAt(fx, fy) || this.info(fx, fy).act || (ch === 'D' && !this.warpAt(fx, fy));
      if (target) { setFont(g); outlinedText(g, '!', fx * TILE + 5 - cx, fy * TILE - 18 - cy + (Math.floor(this.tick / 15) % 2), '#ffd84a', '#303030'); }
      const lab = this.map.labels && this.tileAt(p.tx, p.ty - 1) === 'D' && this.map.labels[p.tx];
      if (lab) { setFont(g); const w = Math.ceil(g.measureText(lab).width) + 14; const lx = Math.max(2, Math.min(W - w - 2, p.tx * TILE + 8 - w / 2 - cx)), ly = (p.ty - 1) * TILE - 24 - cy; drawWindow(g, lx, ly, w, 22); g.fillStyle = TEXT; g.fillText(lab, lx + 7, ly + 3); }
    }
  }
  drawHud(g) {
    if (this.hudTimer <= 0) return;                     // 場所名は入室直後だけ表示（横から滑り込む）
    setFont(g);
    const label = this.map.name;
    const w = Math.min(W - 4, Math.ceil(g.measureText(label).width) + 16);
    const slide = this.hudTimer > 130 ? (this.hudTimer - 130) * 6 : (this.hudTimer < 20 ? (20 - this.hudTimer) * 6 : 0);
    drawWindow(g, 2 - slide, 2, w, 22); g.fillStyle = TEXT; g.fillText(label, 10 - slide, 5);
  }
}

// ---------- 起動 ----------
async function boot() {
  const canvas = document.getElementById('game');
  canvas.width = W; canvas.height = H;
  const controls = document.getElementById('controls');
  const stage = document.getElementById('stage');
  const resize = () => {
    const ch = controls && getComputedStyle(controls).display !== 'none' ? controls.offsetHeight : 0;
    const frame = stage ? (parseInt(getComputedStyle(stage).paddingTop) + parseInt(getComputedStyle(stage).paddingBottom)) : 0;
    const scale = Math.max(1, Math.floor(Math.min((innerWidth - 16) / W, (innerHeight - ch - frame - 16) / H)));
    canvas.style.width = `${W * scale}px`; canvas.style.height = `${H * scale}px`;
  };
  addEventListener('resize', resize); resize();
  try { await document.fonts.load(`16px "DotGothic16"`); } catch (e) { /* フォント未取得でも動かす */ }
  const game = new Game(canvas, loadData());
  window.__game = game; // デバッグ用
  document.querySelectorAll('[data-k]').forEach((el) => game.input.bindButton(el, el.dataset.k));
  let acc = 0, last = performance.now();
  const loop = (now) => {
    acc += Math.min(100, now - last); last = now;
    try { while (acc >= 1000 / 60) { game.update(); acc -= 1000 / 60; } game.draw(); }
    catch (err) { console.error('game loop error:', err); }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
boot();
