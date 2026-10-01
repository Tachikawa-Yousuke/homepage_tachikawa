// M2D Lab RPG — ゲーム本体（外部ライブラリなし）
import { TILE, getTile } from './tiles.js';
import { getSprite } from './sprites.js';
import { MAPS, SOLID, INTERACT } from './maps.js';

const W = 320, H = 180;                       // 内部解像度（16:9）。整数倍に拡大して表示する
const FONT = '"DotGothic16", "Noto Sans JP", monospace';
const SPEED = 2;                              // 1 フレームの移動量 [px]（8 フレームで 1 マス）
const TILE_NAME = { '.': 'floor', '~': 'carpet', 'D': 'door', 'E': 'elevator', 's': 'stairs', 'W': 'window', 'w': 'whiteboard', 'p': 'board', 'b': 'shelf', 'e': 'equipment', 'r': 'counter', 't': 'plant', 'd': 'desk', 'P': 'deskPC', 'c': 'chair' };
const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const OPPOSITE = { up: 'down', down: 'up', left: 'right', right: 'left' };

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
    addEventListener('keydown', (e) => { const k = KEYMAP[e.key]; if (!k) return; e.preventDefault(); this.press(k); });
    addEventListener('keyup', (e) => { const k = KEYMAP[e.key]; if (k) this.held[k] = false; });
  }
  press(k) { if (!this.held[k]) this.pressed[k] = true; this.held[k] = true; this.any = true; }
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
  g.fillStyle = '#0d1030'; g.fillRect(x, y, w, h);
  g.fillStyle = '#ffffff';
  g.fillRect(x + 1, y + 1, w - 2, 1); g.fillRect(x + 1, y + h - 2, w - 2, 1);
  g.fillRect(x + 1, y + 1, 1, h - 2); g.fillRect(x + w - 2, y + 1, 1, h - 2);
  g.fillStyle = '#7f88bf';
  g.fillRect(x + 3, y + 3, w - 6, 1); g.fillRect(x + 3, y + h - 4, w - 6, 1);
  g.fillRect(x + 3, y + 3, 1, h - 6); g.fillRect(x + w - 4, y + 3, 1, h - 6);
}
function setFont(g, px = 16) { g.font = `${px}px ${FONT}`; g.textBaseline = 'top'; }
function wrapText(g, text, maxW) {
  const lines = [];
  for (const para of String(text).split('\n')) {
    let line = '';
    for (const ch of para) {
      const t = line + ch;
      if (g.measureText(t).width > maxW && line) { lines.push(line); line = ch; } else line = t;
    }
    lines.push(line);
  }
  return lines;
}
const splitSentences = (s) => String(s).split(/(?<=。)/).map((t) => t.trim()).filter(Boolean);

// ---------- 会話ウィンドウ ----------
class Dialog {
  constructor(game) { this.game = game; this.open = false; this.pages = []; }
  show(pages, opts = {}) {
    const g = this.game.ctx; setFont(g);
    const LINES = 3;
    this.pages = [];
    for (const raw of pages) {
      const p = typeof raw === 'string' ? { text: raw } : raw;
      const lines = wrapText(g, p.text, W - 36);
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
    if (this.chars < this.total) {
      if (this.tick % 2 === 0) this.chars++;
      if (input.consume('a')) this.chars = this.total;
      return;
    }
    if (this.choice) {
      const n = this.choice.options.length;
      if (input.consume('up')) this.choice.index = (this.choice.index + n - 1) % n;
      if (input.consume('down')) this.choice.index = (this.choice.index + 1) % n;
      if (input.consume('a')) this.close(this.choice.index);
      else if (input.consume('b')) this.close(n - 1);
      return;
    }
    if (input.consume('a') || input.consume('b')) {
      if (this.i < this.pages.length - 1) { this.i++; this.begin(); } else this.close(null);
    }
  }
  close(result) { this.open = false; const cb = this.onClose; this.onClose = null; if (cb) cb(result); }
  draw(g) {
    const p = this.pages[this.i];
    const boxH = 66, y = H - boxH - 3;
    drawWindow(g, 3, y, W - 6, boxH);
    setFont(g);
    if (p.name) {
      const nw = Math.ceil(g.measureText(p.name).width) + 18;
      drawWindow(g, 8, y - 19, nw, 22);
      g.fillStyle = '#ffe066'; g.fillText(p.name, 17, y - 16);
    }
    g.fillStyle = '#ffffff';
    let drawn = 0;
    p.lines.forEach((line, k) => {
      const n = Math.min(line.length, this.chars - drawn);
      if (n > 0) g.fillText(line.slice(0, n), 16, y + 9 + k * 18);
      drawn += line.length;
    });
    if (this.chars >= this.total) {
      if (this.choice) {
        const cw = 92, ch = this.choice.options.length * 18 + 14, cx = W - 3 - cw, cy = y - ch - 2;
        drawWindow(g, cx, cy, cw, ch);
        this.choice.options.forEach((o, k) => {
          g.fillStyle = k === this.choice.index ? '#ffe066' : '#ffffff';
          g.fillText((k === this.choice.index ? '▶' : '　') + o, cx + 8, cy + 8 + k * 18);
        });
      } else if (Math.floor(this.tick / 20) % 2 === 0) {
        g.fillStyle = '#ffffff'; g.fillText('▼', W - 30, y + boxH - 21);
      }
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
    const w = 186, h = this.items.length * 18 + 16, x = W - w - 4, y = 4;
    drawWindow(g, x, y, w, h);
    this.items.forEach((it, k) => {
      const label = typeof it.label === 'function' ? it.label() : it.label;
      g.fillStyle = k === this.index ? '#ffe066' : '#ffffff';
      g.fillText((k === this.index ? '▶' : '　') + label, x + 8, y + 8 + k * 18);
    });
    g.fillStyle = '#9aa3d6'; g.fillText('Xでとじる', x + 8, y + h + 2);
  }
}

// ---------- ゲーム ----------
class Game {
  constructor(canvas, data) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.data = data;
    this.ctx.imageSmoothingEnabled = false;
    this.input = new Input(); this.dialog = new Dialog(this); this.menu = new Menu(this);
    this.state = 'title'; this.tick = 0; this.crt = false;
    this.fade = { alpha: 1, target: 0, cb: null };
    this.player = { tx: 1, ty: 2, x: 16, y: 32, dir: 'down', moving: false, anim: 0 };
    this.loadMap('corridor4f', 1, 2, 'down');
    canvas.addEventListener('pointerdown', (e) => { e.preventDefault(); this.input.press('a'); });
    canvas.addEventListener('pointerup', () => { this.input.held.a = false; });
  }
  // --- マップ ---
  loadMap(name, tx, ty, facing) {
    const m = MAPS[name]; this.mapName = name; this.map = m;
    tx += m._pad.l; ty += m._pad.t;
    this.cols = m.rows[0].length; this.rowsN = m.rows.length;
    Object.assign(this.player, { tx, ty, x: tx * TILE, y: ty * TILE, dir: facing, moving: false, anim: 0 });
    this.npcs = (m.npcs || []).map((n) => ({ ...n }));
    if (m.studentSpots) {
      const palettes = ['studentA', 'studentB', 'studentC', 'studentD'];
      this.data.members.filter((mm) => mm.group === 'student').slice(0, m.studentSpots.length)
        .forEach((s, i) => this.npcs.push({ id: 'student', member: s, ...m.studentSpots[i], palette: palettes[i % 4] }));
    }
    // 装置タイル e を読み順に装置データへ対応付ける
    this.eqIndex = new Map(); let k = 0;
    m.rows.forEach((row, y) => [...row].forEach((ch, x) => { if (ch === 'e') this.eqIndex.set(`${x},${y}`, k++); }));
  }
  tileAt(x, y) { if (y < 0 || y >= this.rowsN || x < 0 || x >= this.cols) return '#'; return this.map.rows[y][x]; }
  npcAt(x, y) { return this.npcs.find((n) => n.x === x && n.y === y); }
  isSolid(x, y) { return SOLID.has(this.tileAt(x, y)) || !!this.npcAt(x, y); }
  warpAt(x, y) { return (this.map.warps || []).find((w) => w.x === x && w.y === y); }
  startFade(cb) { this.fade = { alpha: 0, target: 1, cb }; }
  toggleCrt() { this.crt = !this.crt; document.body.classList.toggle('crt', this.crt); }

  // --- 更新 ---
  update() {
    this.tick++;
    const f = this.fade;
    if (f.alpha !== f.target) {
      f.alpha += Math.sign(f.target - f.alpha) * 0.06;
      if (Math.abs(f.alpha - f.target) < 0.06) {
        f.alpha = f.target;
        if (f.alpha === 1) { const cb = f.cb; f.cb = null; if (cb) cb(); f.target = 0; }
      }
      this.input.endFrame(); return;
    }
    if (this.state === 'title') {
      if (this.input.any) this.startFade(() => { this.state = 'world'; });
      this.input.endFrame(); return;
    }
    if (this.dialog.open) this.dialog.update(this.input);
    else if (this.menu.open) this.menu.update(this.input);
    else this.updateWorld();
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
        if (!this.isSolid(p.tx + dx, p.ty + dy)) { p.moving = true; p.ntx = p.tx + dx; p.nty = p.ty + dy; }
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
  facingTile() { const [dx, dy] = DIRS[this.player.dir]; return [this.player.tx + dx, this.player.ty + dy]; }
  interact() {
    const [fx, fy] = this.facingTile();
    const npc = this.npcAt(fx, fy);
    if (npc) { npc.facing = OPPOSITE[this.player.dir]; this.talk(npc); return; }
    const ch = this.tileAt(fx, fy);
    if (INTERACT.has(ch)) this.examine(ch, fx, fy);
  }
  talk(npc) {
    const d = this.data;
    if (npc.id === 'kimura') {
      const m = d.members.find((x) => x.id === 'kimura') || d.members.find((x) => x.group === 'faculty') || { name: '木村 康裕', role: '准教授' };
      const name = m.name;
      const pages = [{ name, text: `${m.name}です。${m.role}をしています。` }];
      if (m.bio) pages.push(...splitSentences(m.bio).map((t) => ({ name, text: t })));
      pages.push({ name, text: 'くわしくは メニューの「研究室概要」を 見てください。' });
      this.dialog.show(pages);
    } else if (npc.id === 'student' && npc.member) {
      const m = npc.member;
      let text = `${m.name}です。${m.role}です。`;
      if (m.interests && m.interests.length) text += `\n${m.interests.join('、')}を 研究しています。`;
      this.dialog.show([{ name: m.name, text }]);
    }
  }
  examine(ch, x, y) {
    const d = this.data, s = d.site;
    switch (ch) {
      case 'w': {
        const pages = ['ホワイトボードに 研究テーマが 書かれている。'];
        d.research.forEach((r, i) => pages.push(`${i + 1}. ${r.title}\n${r.summary}`));
        this.dialog.show(pages); break;
      }
      case 'p': {
        const pages = ['掲示板に お知らせが 貼られている。'];
        d.news.slice(0, 4).forEach((n) => pages.push(`${n.date}\n${n.title}`));
        this.dialog.show(pages); break;
      }
      case 'b': {
        const pubs = d.publications;
        const pages = ['本棚には 研究室の論文が 並んでいる。'];
        if (pubs.length) {
          const years = pubs.map((p) => p.year); const yMin = Math.min(...years), yMax = Math.max(...years);
          pages.push(`査読付き論文 ${pubs.length}件（${yMin}〜${yMax}年）が 載っている。`);
          pubs.slice(0, 2).forEach((p) => pages.push(`${p.venue}（${p.year}）\n${p.title}`));
        }
        pages.push('くわしくは メニューの「業績」を 見てください。');
        this.dialog.show(pages); break;
      }
      case 'e': {
        const eq = d.equipment[this.eqIndex.get(`${x},${y}`) ?? -1];
        this.dialog.show(eq ? [`${eq.name}\n${eq.description}`] : ['装置がある。']); break;
      }
      case 'E': this.dialog.show(['エレベーター。\n1Fへ 降りられる。\n（1Fは 工事中です）']); break;
      case 's': this.dialog.show(['階段。\n（下の階は 工事中です）']); break;
      case 'P': this.dialog.show(['机の上に PCがある。\n電源は 入っていない。']); break;
      case 'r': {
        const pages = ['見学受付：\n研究室見学・Web面談は いつでも 受け付けています。', { text: '問い合わせフォームを 開きますか？', choice: ['はい', 'いいえ'] }];
        this.dialog.show(pages, { onClose: (sel) => { if (sel === 0 && s.contactFormUrl) window.open(s.contactFormUrl, '_blank', 'noopener'); } });
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
    const [cx, cy] = this.camera();
    this.drawMap(g, cx, cy);
    this.drawSprites(g, cx, cy);
    if (this.state === 'title') { this.drawTitle(g); }
    else {
      this.drawHud(g, cx, cy);
      if (this.menu.open) this.menu.draw(g);
      if (this.dialog.open) this.dialog.draw(g);
    }
    if (this.fade.alpha > 0) { g.fillStyle = `rgba(0,0,0,${this.fade.alpha})`; g.fillRect(0, 0, W, H); }
  }
  drawMap(g, cx, cy) {
    const x0 = Math.max(0, Math.floor(cx / TILE)), y0 = Math.max(0, Math.floor(cy / TILE));
    const x1 = Math.min(this.cols - 1, Math.ceil((cx + W) / TILE)), y1 = Math.min(this.rowsN - 1, Math.ceil((cy + H) / TILE));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const ch = this.tileAt(x, y);
      let tile;
      if (ch === '#') tile = (y + 1 < this.rowsN && this.tileAt(x, y + 1) !== '#') ? getTile('wallFace') : getTile('wallTop');
      else if (ch === '.') tile = getTile('floor', (x * 7 + y * 13) % 3);
      else if (ch === 'b') tile = getTile('shelf', x % 3);
      else if (ch === 'e') tile = getTile('equipment', this.eqIndex.get(`${x},${y}`) ?? 0);
      else tile = getTile(TILE_NAME[ch] || 'floor');
      g.drawImage(tile, x * TILE - cx, y * TILE - cy);
    }
  }
  drawSprites(g, cx, cy) {
    const list = this.npcs.map((n) => ({ x: n.x * TILE, y: n.y * TILE, img: getSprite(n.palette, n.facing, 0) }));
    const p = this.player;
    const frame = p.moving ? [0, 1, 0, 2][Math.floor(p.anim / 8) % 4] : 0;
    list.push({ x: p.x, y: p.y, img: getSprite('player', p.dir, frame) });
    list.sort((a, b) => a.y - b.y).forEach((s) => g.drawImage(s.img, s.x - cx, s.y - 8 - cy));
    // 調べられる対象の上に「!」
    if (this.state === 'world' && !this.dialog.open && !this.menu.open && !p.moving) {
      const [fx, fy] = this.facingTile();
      if (this.npcAt(fx, fy) || INTERACT.has(this.tileAt(fx, fy))) {
        setFont(g); g.fillStyle = '#ffe066';
        g.fillText('!', fx * TILE + 5 - cx, fy * TILE - 20 - cy + (Math.floor(this.tick / 15) % 2));
      }
      const lab = this.map.labels && this.tileAt(p.tx, p.ty - 1) === 'D' && this.map.labels[p.tx];
      if (lab) { setFont(g); const w = Math.ceil(g.measureText(lab).width) + 16; const lx = p.tx * TILE + 8 - w / 2 - cx, ly = (p.ty - 1) * TILE - 26 - cy; drawWindow(g, lx, ly, w, 22); g.fillStyle = '#fff'; g.fillText(lab, lx + 8, ly + 3); }
    }
  }
  drawHud(g) {
    setFont(g);
    const label = this.map.name;
    const w = Math.ceil(g.measureText(label).width) + 18;
    drawWindow(g, 4, 4, w, 24); g.fillStyle = '#fff'; g.fillText(label, 13, 8);
  }
  drawTitle(g) {
    g.fillStyle = 'rgba(0,0,10,0.72)'; g.fillRect(0, 0, W, H);
    const s = this.data.site;
    g.textAlign = 'center';
    setFont(g, 32); g.fillStyle = '#ffe066'; g.fillText('M2D LAB', W / 2, 30);
    setFont(g, 16); g.fillStyle = '#fff';
    g.fillText(s.labName || '材料創製力学研究室', W / 2, 70);
    g.fillStyle = '#b8c0e8'; g.fillText('KIMURA LAB / KYUSHU UNIV.', W / 2, 90);
    if (Math.floor(this.tick / 30) % 2 === 0) { g.fillStyle = '#fff'; g.fillText('PRESS Z / TAP TO START', W / 2, 128); }
    g.fillStyle = '#7f88bf'; g.fillText(`© ${new Date().getFullYear()} M2D Lab`, W / 2, 158);
    g.textAlign = 'left';
  }
}

// ---------- 起動 ----------
async function boot() {
  const canvas = document.getElementById('game');
  canvas.width = W; canvas.height = H;
  const controls = document.getElementById('controls');
  const resize = () => {
    const ch = controls && getComputedStyle(controls).display !== 'none' ? controls.offsetHeight : 0;
    const scale = Math.max(1, Math.floor(Math.min(innerWidth / W, (innerHeight - ch - 8) / H)));
    canvas.style.width = `${W * scale}px`; canvas.style.height = `${H * scale}px`;
  };
  addEventListener('resize', resize); resize();
  try { await document.fonts.load(`16px "DotGothic16"`); } catch (e) { /* フォント未取得でも動かす */ }
  const game = new Game(canvas, loadData());
  window.__game = game; // デバッグ用
  addEventListener('error', (e) => console.error('game error:', e.message, e.filename, e.lineno));
  document.querySelectorAll('[data-k]').forEach((el) => game.input.bindButton(el, el.dataset.k));
  let acc = 0, last = performance.now();
  const loop = (now) => {
    acc += Math.min(100, now - last); last = now;
    try {
      while (acc >= 1000 / 60) { game.update(); acc -= 1000 / 60; }
      game.draw();
    } catch (err) { console.error('game loop error:', err); }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
boot();
