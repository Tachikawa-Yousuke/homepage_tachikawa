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
    const home = this.game.data.home ? [{ label: 'ホームページを 見る', action: () => { location.href = this.game.data.home; } }] : [];
    this.items = [...pages, ...home, { label: () => (this.game.crt ? 'がめん：CRT' : 'がめん：ふつう'), action: () => this.game.toggleCrt() }];
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

// ---------- 極小フォント（3×5）: クレジット等の小さな英字用 ----------
const TINY = {
  '0':'111101101101111','1':'010110010010111','2':'111001111100111','3':'111001111001111','4':'101101111001001','5':'111100111001111','6':'111100111101111','7':'111001001001001','8':'111101111101111','9':'111101111001111',
  'A':'010101111101101','B':'110101110101110','C':'111100100100111','D':'110101101101110','E':'111100110100111','F':'111100110100100','G':'111100101101111','H':'101101111101101','I':'111010010010111','J':'001001001101111','K':'101101110101101','L':'100100100100111','M':'101111111101101','N':'110101101101101','O':'111101101101111','P':'111101111100100','Q':'111101101111011','R':'111101110101101','S':'111100111001111','T':'111010010010010','U':'101101101101111','V':'101101101101010','W':'101101111111101','X':'101101010101101','Y':'101101010010010','Z':'111001010100111',
  ' ':'000000000000000','.':'000000000000010','-':'000000111000000','/':'001001010100100',':':'000010000010000','©':'111101100101111','@':'111101111100111',
};
function tinyText(g, text, x, y, color) {
  g.fillStyle = color;
  for (const ch of String(text).toUpperCase()) {
    const bits = TINY[ch] || TINY[' '];
    for (let i = 0; i < 15; i++) if (bits[i] === '1') g.fillRect(x + (i % 3), y + Math.floor(i / 3), 1, 1);
    x += 4;
  }
}

// ---------- タイトル画面（動く一枚絵） ----------
class Title {
  constructor(game) { this.game = game; this.t = 0; this.index = 0; this.items = [{ label: 'はじめる' }, { label: 'せつめいしょ' }]; }
  update(input) {
    this.t++;
    if (this.game.hero) { if (this.t >= 60 && input.consume('a')) location.href = this.game.data.play || '#'; return; }
    if (this.t < 70) { if (input.any) this.t = 70; return; }                 // ロゴ落下中は飛ばせる
    const n = this.items.length;
    if (input.consume('up')) this.index = (this.index + n - 1) % n;
    if (input.consume('down')) this.index = (this.index + 1) % n;
    if (input.consume('a')) {
      if (this.index === 0) this.game.startFade(() => { this.game.state = 'world'; this.game.hudTimer = 150; });
      else { const p = this.game.data.pages[0]; if (p) location.href = p.href; }
    }
  }
  // 丸い塊（雲・茂み）を行ごとの矩形で描く
  blob(g, cx, cy, rx, ry, color) {
    for (let dy = -ry; dy <= ry; dy++) { const w = Math.round(rx * Math.sqrt(1 - (dy * dy) / (ry * ry))); if (w > 0) g.fillRect(Math.round(cx - w), Math.round(cy + dy), w * 2, 1); }
  }
  cloud(g, x, y, s) {
    const puffs = [[0, 6, 14, 6], [10, 2, 10, 7], [22, 4, 12, 7], [34, 7, 9, 5]];
    g.fillStyle = '#d4e9fb'; puffs.forEach(([px, py, rx, ry]) => this.blob(g, x + px * s, y + (py + 2) * s, rx * s, ry * s));
    g.fillStyle = '#ffffff'; puffs.forEach(([px, py, rx, ry]) => this.blob(g, x + px * s, y + py * s, rx * s, ry * s));
    g.fillStyle = '#d4e9fb'; g.fillRect(Math.round(x - 14 * s), Math.round(y + 12 * s), Math.round(57 * s), Math.max(1, Math.round(2 * s)));
  }
  bush(g, x, y, r) {
    g.fillStyle = '#2f8a3c'; this.blob(g, x, y + 1, r, r * 0.7); this.blob(g, x + r * 0.8, y + 2, r * 0.8, r * 0.6);
    g.fillStyle = '#4fb35a'; this.blob(g, x - r * 0.2, y - 1, r * 0.7, r * 0.5);
    g.fillStyle = '#8ee08a'; g.fillRect(Math.round(x - r * 0.4), Math.round(y - 2), 2, 1); g.fillRect(Math.round(x + r * 0.3), Math.round(y), 1, 1);
  }
  draw(g) {
    const t = this.t;
    // 空（上ほど濃い）
    const sky = ['#4f9ee8', '#5faaee', '#72b8f2', '#86c5f5', '#9cd1f8', '#b4ddfa', '#cce8fc'];
    sky.forEach((c, i) => { g.fillStyle = c; g.fillRect(0, i * 16, W, 16); });
    // 雲（奥: 小さくゆっくり、手前: 大きく速く）
    for (let i = 0; i < 4; i++) this.cloud(g, ((i * 80 + t * 0.12) % (W + 90)) - 60, 14 + (i % 2) * 14, 0.6);
    for (let i = 0; i < 3; i++) this.cloud(g, ((i * 110 + 30 + t * 0.3) % (W + 120)) - 80, 40 + (i % 2) * 18, 1.0);
    this.cloud(g, ((t * 0.5) % (W + 160)) - 100, 66, 1.4);
    // 遠景: 石段の上の建物（ウエスト4号館）
    const bx = 196, by = 70;
    g.fillStyle = '#8c98a8'; g.fillRect(bx - 1, by - 2, 40, 2);
    g.fillStyle = '#f3eadb'; g.fillRect(bx, by, 38, 26);
    for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) { g.fillStyle = (r + c) % 3 === 0 ? '#fff3b0' : '#8fd3f4'; g.fillRect(bx + 3 + c * 9, by + 3 + r * 7, 5, 4); }
    g.fillStyle = '#d9cdb4'; g.fillRect(bx, by + 24, 38, 2);
    // 丘（なだらかな曲線）
    for (let x = 0; x < W; x++) {
      const top = 104 - Math.round(8 * Math.sin((x / W) * Math.PI)) + (x > 150 ? Math.round((x - 150) / 9) : 0);
      g.fillStyle = '#9bdc62'; g.fillRect(x, top, 1, H - top);
      g.fillStyle = '#7ac44a'; g.fillRect(x, top, 1, 2);
    }
    g.fillStyle = '#6fbf47'; g.fillRect(0, 138, W, H - 138);
    // 石段（右へ上る）
    for (let i = 0; i < 9; i++) {
      const sx = 160 + i * 9, sy = 128 - i * 4;
      g.fillStyle = '#b9bfc9'; g.fillRect(sx, sy, W - sx, 4);
      g.fillStyle = '#e4e8ee'; g.fillRect(sx, sy, W - sx, 1);
      g.fillStyle = '#7f8794'; g.fillRect(sx, sy + 3, 9, 1);
    }
    g.fillStyle = '#7f8794'; g.fillRect(160, 132, 80, 2);
    // 草の揺れ・茂み・花・小物
    const sway = Math.floor(t / 18) % 2;
    g.fillStyle = '#4fa63a';
    for (let x = 4; x < 150; x += 11) { const yy = 112 + ((x / 11) % 5) * 8; g.fillRect(x + sway, yy, 1, 3); g.fillRect(x + 2 + sway, yy, 1, 3); g.fillRect(x + 1 + sway, yy + 1, 1, 2); }
    this.bush(g, 30, 128, 14); this.bush(g, 120, 140, 12); this.bush(g, 72, 146, 9); this.bush(g, 150, 150, 11);
    [[12, 146, '#ff6b6b'], [52, 120, '#ffd84a'], [96, 128, '#ffffff'], [138, 122, '#ff6b6b'], [60, 150, '#ffd84a']].forEach(([x, y, c]) => { g.fillStyle = c; g.fillRect(x, y, 1, 1); g.fillRect(x - 1, y + 1, 3, 1); g.fillRect(x, y + 2, 1, 1); g.fillStyle = '#ffe9a0'; g.fillRect(x, y + 1, 1, 1); });
    // 小物: 顕微鏡と本の束
    g.fillStyle = '#5f6b7a'; g.fillRect(84, 136, 8, 2); g.fillRect(86, 128, 2, 8); g.fillRect(85, 126, 5, 3); g.fillRect(89, 124, 2, 6); g.fillStyle = '#8fd3f4'; g.fillRect(90, 124, 1, 2);
    g.fillStyle = '#ff6b6b'; g.fillRect(100, 144, 9, 2); g.fillStyle = '#4aa3ff'; g.fillRect(101, 142, 9, 2); g.fillStyle = '#ffd84a'; g.fillRect(100, 140, 8, 2);
    // キャラクター（石段を跳ねながら上る）
    const hop = Math.max(0, Math.sin((t % 60) / 60 * Math.PI * 2)) * 6;
    const frame = [1, 0, 2, 0][Math.floor(t / 7) % 4];
    g.drawImage(getSprite('player', 'right', frame), 190, 102 - Math.round(hop));
    // ロゴ（傾いた赤文字。上から落ちて弾む）
    const drop = Math.min(1, t / 50);
    const ease = 1 - Math.pow(1 - drop, 3);
    const bounce = t > 50 && t < 62 ? -Math.sin((t - 50) / 12 * Math.PI) * 3 : 0;
    const ly = -50 + (50 + 14) * ease + bounce;
    g.save();
    g.translate(104, ly + 20); g.rotate(-0.09); g.transform(1, 0, -0.18, 1, 0, 0);
    g.textAlign = 'center'; setFont(g, 48);
    outlinedText(g, 'M2D LAB', 0, -20, '#e23b3b', '#4a1010');
    g.fillStyle = '#ff8a7a'; g.fillText('M2D LAB', -1, -22); g.fillStyle = '#e23b3b'; g.fillText('M2D LAB', 0, -20);
    g.restore();
    g.textAlign = 'center'; setFont(g, 16);
    if (t > 55) outlinedText(g, this.game.data.site.labName || '材料創製力学研究室', 104, ly + 54, '#ffffff', '#4a1010');
    g.textAlign = 'left';
    // ヒーローモード: メニューの代わりに PRESS START
    if (this.game.hero) {
      if (t >= 60 && Math.floor(t / 30) % 2 === 0) { g.textAlign = 'center'; outlinedText(g, 'PRESS START', 104, 104, '#ffd84a', '#303030'); g.textAlign = 'left'; }
    }
    // メニュー（左寄り。小さな星がカーソル）
    if (!this.game.hero && t >= 70) {
      const mx = 30, my = 96;
      this.items.forEach((it, k) => {
        const y = my + k * 18, sel = k === this.index;
        outlinedText(g, it.label, mx + 14, y, sel ? '#ffffff' : '#e8f4ff', '#303030');
        if (sel) { const bob = Math.floor(t / 15) % 2; g.fillStyle = '#ffd84a'; g.fillRect(mx + 3, y + 5 + bob, 1, 7); g.fillRect(mx, y + 8 + bob, 7, 1); g.fillRect(mx + 2, y + 7 + bob, 3, 3); g.fillStyle = '#ffffff'; g.fillRect(mx + 3, y + 8 + bob, 1, 1); }
      });
    }
    // クレジット（極小フォント）
    tinyText(g, `© ${new Date().getFullYear()} M2D LAB`, 4, H - 7, '#2b5a3a');
    tinyText(g, 'KIMURA LAB / KYUSHU UNIV.', W - 4 - 4 * 25, H - 7, '#2b5a3a');
  }
}

// ---------- ゲーム ----------
class Game {
  constructor(canvas, data) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.data = data;
    this.ctx.imageSmoothingEnabled = false;
    this.input = new Input(); this.dialog = new Dialog(this); this.menu = new Menu(this); this.title = new Title(this);
    this.hero = canvas.dataset.mode === 'hero';   // トップページ埋め込み（タイトル演出のみ）
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
    if (this.info(x, y).door && !this.warpAt(x, y)) return true;  // ワープ先のないドアは閉まっている
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
        const blocked = (this.info(nx, ny).door && !this.warpAt(nx, ny)) || this.info(nx, ny).solid || this.npcAt(nx, ny);
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
      if (!'=.,p'.includes(this.tileAt(nx, ny))) continue;
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
    if (this.info(fx, fy).door && !this.warpAt(fx, fy)) { this.dialog.show([(this.map.doorText || {})[`${fx},${fy}`] || 'カギが かかっている。']); return; }
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
      else if (['grass', 'floor', 'path', 'plaza'].includes(info.tile)) tile = getTile(info.tile, (x * 7 + y * 13) % 3);
      else if (info.tile === 'flower') tile = getTile('flower', flowerFrame);
      else if (info.tile === 'shelf') tile = getTile('shelf', x % 3);
      else if (info.tile === 'equipment') tile = getTile('equipment', this.eqIndex.get(`${x},${y}`) ?? 0);
      else if (info.tile === 'roof' || info.tile === 'groof') tile = getTile(info.tile, this.tileAt(x, y - 1) === ch ? 0 : 1);
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
      const target = this.npcAt(fx, fy) || this.info(fx, fy).act || (this.info(fx, fy).door && !this.warpAt(fx, fy));
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
    if (canvas.dataset.mode === 'hero') return;        // ヒーローは CSS で幅いっぱいに表示
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
