// トップページのローディング演出（同じタブでは初回のみ。クリックで省略できる）
(function () {
  var loader = document.getElementById('loader');
  if (!loader) return;
  var base = '/';
  try { base = (JSON.parse(document.getElementById('game-data').textContent).base || '/').replace(/\/$/, ''); } catch (e) {}
  var seen = false;
  try { seen = sessionStorage.getItem('m2d-loaded') === '1'; } catch (e) {}
  if (seen) { loader.hidden = true; return; }

  var fill = document.getElementById('load-fill');
  var pct = document.getElementById('load-pct');
  var walker = document.getElementById('load-walker');
  var p = 0, done = false;
  function finish() {
    if (done) return;
    done = true;
    loader.classList.add('done');
    try { sessionStorage.setItem('m2d-loaded', '1'); } catch (e) {}
    setTimeout(function () { loader.hidden = true; }, 600);
  }
  loader.addEventListener('click', finish);
  function step() {
    if (done) return;
    p = Math.min(100, p + 3 + Math.random() * 9);          // ゲーム風に不均一に進む
    fill.style.width = p + '%';
    pct.textContent = Math.floor(p) + '%';
    walker.style.left = 'calc(' + p + '% - 16px)';
    if (p >= 100) setTimeout(finish, 350); else setTimeout(step, 90 + Math.random() * 160);
  }
  setTimeout(step, 200);
  // バーの上を歩く主人公（ゲームと同じドット絵を使う）
  import(base + '/game/sprites.js').then(function (m) {
    var g = walker.getContext('2d'), f = 0;
    function anim() {
      if (done) return;
      g.clearRect(0, 0, 16, 20);
      g.drawImage(m.getSprite('player', 'right', [0, 1, 0, 2][f++ % 4]), 0, 0);
      setTimeout(anim, 120);
    }
    anim();
  }).catch(function () {});
})();
