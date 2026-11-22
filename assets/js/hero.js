/* Home hero: a slowly drifting human–AI–social network.
   Three kinds of nodes – people (round), AI systems (square), institutions (ring) –
   linked by nearness. Respects prefers-reduced-motion (draws one still frame). */
(function () {
  "use strict";
  var canvas = document.getElementById("hero-canvas");
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext("2d");
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var W = 0, H = 0, DPR = Math.min(window.devicePixelRatio || 1, 2), nodes = [], raf = null;

  function seeded(i) { var x = Math.sin(i * 9301 + 49297) * 233280; return x - Math.floor(x); }

  function init() {
    var r = canvas.getBoundingClientRect();
    W = r.width; H = r.height;
    canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    var n = Math.round(Math.min(110, Math.max(40, (W * H) / 14000)));
    nodes = [];
    for (var i = 0; i < n; i++) {
      var k = seeded(i + 1);
      nodes.push({
        x: seeded(i * 3 + 2) * W, y: seeded(i * 7 + 5) * H,
        vx: (seeded(i * 11 + 3) - 0.5) * 0.25, vy: (seeded(i * 13 + 7) - 0.5) * 0.25,
        type: k < 0.62 ? "person" : (k < 0.86 ? "ai" : "inst"),
        r: k < 0.62 ? 2.6 : (k < 0.86 ? 3.4 : 5.5)
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    var maxD = Math.min(170, Math.max(110, W / 9));
    for (var i = 0; i < nodes.length; i++) {
      for (var j = i + 1; j < nodes.length; j++) {
        var a = nodes[i], b = nodes[j], dx = a.x - b.x, dy = a.y - b.y, d = Math.sqrt(dx * dx + dy * dy);
        if (d < maxD) {
          var mixed = (a.type === "ai") !== (b.type === "ai");
          ctx.strokeStyle = mixed ? "rgba(97,206,212," + (0.42 * (1 - d / maxD)) + ")" : "rgba(255,255,255," + (0.22 * (1 - d / maxD)) + ")";
          ctx.lineWidth = mixed ? 1.1 : 0.8;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
    }
    for (var k = 0; k < nodes.length; k++) {
      var p = nodes[k];
      if (p.type === "person") { ctx.fillStyle = "rgba(255,255,255,.9)"; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill(); }
      else if (p.type === "ai") { ctx.fillStyle = "rgba(97,206,212,.95)"; ctx.fillRect(p.x - p.r, p.y - p.r, p.r * 2, p.r * 2); }
      else { ctx.strokeStyle = "rgba(255,255,255,.75)"; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.stroke(); }
    }
  }

  function step() {
    for (var i = 0; i < nodes.length; i++) {
      var p = nodes[i]; p.x += p.vx; p.y += p.vy;
      if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
      if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
    }
    draw(); raf = requestAnimationFrame(step);
  }

  function start() { init(); if (reduce) { draw(); } else { cancelAnimationFrame(raf); step(); } }
  var to; window.addEventListener("resize", function () { clearTimeout(to); to = setTimeout(start, 150); });
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) cancelAnimationFrame(raf); else if (!reduce) step();
  });
  start();
})();
