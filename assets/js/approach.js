/* Approach page: two interactive diagrams (causal logic, four levels). Keyboard accessible. */
(function () {
  "use strict";
  var NS = "http://www.w3.org/2000/svg";
  function el(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function wrapText(parent, text, x, y, maxChars, lh, attrs) {
    var words = text.split(" "), line = "", lines = [];
    words.forEach(function (w) { if ((line + " " + w).trim().length > maxChars) { lines.push(line.trim()); line = w; } else line += " " + w; });
    lines.push(line.trim());
    var t = el("text", Object.assign({ x: x, y: y - ((lines.length - 1) * lh) / 2 }, attrs), parent);
    lines.forEach(function (l, i) { var s = el("tspan", { x: x, dy: i === 0 ? 0 : lh }, t); s.textContent = l; });
    return t;
  }
  function panelHTML(item) {
    var h = "<h4>" + item.title + "</h4>";
    if (item.q) h += "<p><strong>Question.</strong> " + item.q + "</p>";
    if (item.text) h += "<p>" + item.text + "</p>";
    if (item.list) h += "<ul>" + item.list.map(function (x) { return "<li>" + x + "</li>"; }).join("") + "</ul>";
    if (item.out) h += "<p><strong>Key outcome.</strong> " + item.out + "</p>";
    return h;
  }
  function wire(nodes, items, panel) {
    function select(i) {
      nodes.forEach(function (n, j) { n.classList.toggle("active", i === j); n.classList.toggle("dim", i !== j); n.setAttribute("aria-pressed", i === j ? "true" : "false"); });
      panel.innerHTML = panelHTML(items[i]);
    }
    nodes.forEach(function (n, i) {
      n.addEventListener("click", function () { select(i); });
      n.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select(i); }
        if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); nodes[(i + 1) % nodes.length].focus(); }
        if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); nodes[(i - 1 + nodes.length) % nodes.length].focus(); }
      });
    });
    select(0);
  }

  /* ---------- 1. Shared causal logic ---------- */
  var CAUSAL = [
    { title: "1 · Context and actors", short: "Context & actors",
      text: "Who uses the system, for which task, with what expertise and in which organizational or social setting. The same application can help a novice and hinder an expert, so the context is part of the explanation – not background noise." },
    { title: "2 · AI capabilities, functioning and autonomy", short: "AI capabilities & autonomy",
      text: "What the system can do, how it works and how far it acts on its own. We keep three things apart: the system’s operational autonomy, the intentionality people perceive in it, and human responsibility. Anthropomorphism is a psychological phenomenon, not evidence that a system has human intentions, needs or experiences." },
    { title: "3 · Mediating mechanisms", short: "Mediating mechanisms",
      text: "The processes through which AI use turns into effects – for example cognitive offloading, trust, social comparison, knowledge sharing or psychological safety. Each is defined at its own level of analysis, and for every study we fix in advance whether a concept acts as a precondition, mediator, moderator or outcome." },
    { title: "4 · Short- and long-term outcomes", short: "Outcomes",
      text: "Individual, group and societal outcomes, short and long term. We always separate supported performance (with AI), durable competence (later, without AI) and independent initiative – and we look at how gains and costs are distributed." },
    { title: "5 · Risks, institutional controls and adaptive feedback", short: "Risks, controls & feedback",
      text: "Technical, human, organizational and societal risks; the controls that institutions put in place; and the feedback through which outcomes and incidents change how systems are designed and deployed in the next cycle." }
  ];

  function drawCausal() {
    var host = document.getElementById("diagram-causal");
    if (!host) return;
    var panel = document.getElementById("panel-causal");
    host.innerHTML = "";
    var narrow = host.clientWidth < 720;
    var W = narrow ? 420 : 1000, H = narrow ? 640 : 290;
    var svg = el("svg", { viewBox: "0 0 " + W + " " + H, role: "group", "aria-label": "Five-element causal logic shared by all studies. Select an element to read about it." }, host);
    var defs = el("defs", {}, svg);
    var m = el("marker", { id: "arr", viewBox: "0 0 10 10", refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: "auto-start-reverse" }, defs);
    el("path", { d: "M0 0 L10 5 L0 10 z", fill: "#275882" }, m);
    var fills = ["#00707a", "#0f6383", "#275882", "#1b3f5f", "#c23b4a"];
    var nodes = [];
    CAUSAL.forEach(function (c, i) {
      var x, y, w, h;
      if (narrow) { w = 300; h = 86; x = 60; y = 20 + i * 118; }
      else { w = 166; h = 120; x = 20 + i * 196; y = 40; }
      var g = el("g", { class: "node", tabindex: 0, role: "button", "aria-label": c.title }, svg);
      el("rect", { x: x, y: y, width: w, height: h, fill: fills[i] }, g);
      el("text", { x: x + 12, y: y + 24, fill: "rgba(255,255,255,.7)", "font-weight": 900, "font-size": 18 }, g).textContent = String(i + 1);
      wrapText(g, c.short, x + w / 2, y + h / 2 + 8, narrow ? 26 : 15, 20, { "text-anchor": "middle", fill: "#fff", "font-weight": 700, "font-size": 16, "font-family": "Raleway, sans-serif" });
      if (i < CAUSAL.length - 1) {
        if (narrow) el("line", { x1: x + w / 2, y1: y + h + 4, x2: x + w / 2, y2: y + 114, stroke: "#275882", "stroke-width": 2.5, "marker-end": "url(#arr)" }, svg);
        else el("line", { x1: x + w + 4, y1: y + h / 2, x2: x + 192, y2: y + h / 2, stroke: "#275882", "stroke-width": 2.5, "marker-end": "url(#arr)" }, svg);
      }
      nodes.push(g);
    });
    // feedback loop
    if (narrow) {
      el("path", { d: "M360 " + (20 + 4 * 118 + 43) + " C 410 400, 410 120, 362 63", fill: "none", stroke: "#c23b4a", "stroke-width": 2.5, "stroke-dasharray": "6 5", "marker-end": "url(#arr)" }, svg);
      el("text", { x: 404, y: 330, "font-size": 13, fill: "#c23b4a", "font-weight": 700, transform: "rotate(90 404 330)", "text-anchor": "middle" }, svg).textContent = "adaptive feedback";
    } else {
      el("path", { d: "M" + (20 + 4 * 196 + 83) + " 164 C " + (20 + 4 * 196 + 83) + " 250, 103 250, 103 166", fill: "none", stroke: "#c23b4a", "stroke-width": 2.5, "stroke-dasharray": "7 6", "marker-end": "url(#arr)" }, svg);
      el("text", { x: 500, y: 268, "font-size": 14, fill: "#c23b4a", "font-weight": 700, "text-anchor": "middle" }, svg).textContent = "adaptive feedback into the next design and deployment cycle";
    }
    wire(nodes, CAUSAL, panel);
  }

  /* ---------- 2. Four connected levels ---------- */
  var LEVELS = [
    { title: "Individual", q: "How does using AI shape people’s thinking, learning, self-understanding and agency? Under which conditions does it support development, and when does it increase over-reliance?",
      list: ["cognitive load and offloading; self-regulation and metacognition", "actual knowledge versus the sense of competence; motivation, autonomy, self-efficacy", "professional and narrative identity, creativity, well-being"],
      out: "knowledge and independent judgment that remain without AI." },
    { title: "Relationships, interactions and groups", q: "How does AI change human–AI relationships and the relationships between people? When does it support shared thinking and collaboration, and when does it narrow dialogue or the diversity of perspectives?",
      list: ["social presence and anthropomorphism; trust and appropriate reliance", "help-seeking, social support and belonging; psychological safety, voice and silence", "shared sensemaking, group norms, conflict handling, collective creativity; human–AI teamwork"] },
    { title: "Organizations and institutions", q: "Under which conditions does individual and group AI use become shared knowledge, organizational learning and lasting change? How do the division of labor, control and responsibility evolve?",
      list: ["knowledge sharing and knowledge hiding; organizational memory and revising routines", "collaboration across units; leadership, culture and justice", "role clarity, workload and capacity; decision rights and accountability", "settings: the university, industrial human–AI teams (Operator 5.0), small and medium-sized enterprises"],
      out: "institutionalized knowledge, decision quality and sustainable work organization." },
    { title: "Society, institutional systems and policy", q: "How are the benefits, burdens and influence of AI distributed across social groups? Which institutional and policy conditions support equitable access, participation and responsible use?",
      list: ["digital inequalities and inclusion; access to education and services; social trust", "stakeholder participation, representation and contestability", "transformation of professions and employment; consequences for public services, regions and cities"] }
  ];

  function drawLevels() {
    var host = document.getElementById("diagram-levels");
    if (!host) return;
    var panel = document.getElementById("panel-levels");
    host.innerHTML = "";
    var W = 1000, H = 440;
    var svg = el("svg", { viewBox: "0 0 " + W + " " + H, role: "group", "aria-label": "Four connected levels of analysis, from the individual to society. Select a level to read its research question." }, host);
    var fills = ["#00707a", "#0f6383", "#275882", "#1b3f5f"];
    var labels = ["Individual", "Relationships & groups", "Organizations & institutions", "Society, institutions & policy"];
    var nodes = [];
    // draw from outside (society) to inside (individual); keep a DOM order that matches reading order for focus
    var rects = [];
    for (var i = 3; i >= 0; i--) {
      var pad = (3 - i) * 0;
      var inset = i * 0; // placeholder for clarity
      var x = 500 - (160 + i * 110), y = 220 - (55 + i * 52), w = 2 * (160 + i * 110), h = 2 * (55 + i * 52);
      var g = el("g", { class: "node", tabindex: 0, role: "button", "aria-label": "Level " + (i + 1) + ": " + LEVELS[i].title }, svg);
      el("rect", { x: x, y: y, width: w, height: h, rx: 18, fill: fills[i], stroke: "#fff", "stroke-width": 3 }, g);
      var ty = i === 0 ? 228 : y + 30;
      el("text", { x: 500, y: ty, "text-anchor": "middle", fill: "#fff", "font-weight": 800, "font-size": i === 0 ? 22 : 18, "font-family": "Raleway, sans-serif" }, g).textContent = (i + 1) + " · " + labels[i];
      rects[i] = g;
    }
    nodes = [rects[0], rects[1], rects[2], rects[3]];
    wire(nodes, LEVELS, panel);
  }

  function drawAll() { drawCausal(); drawLevels(); }
  var to; window.addEventListener("resize", function () { clearTimeout(to); to = setTimeout(drawCausal, 200); });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", drawAll); else drawAll();
})();
