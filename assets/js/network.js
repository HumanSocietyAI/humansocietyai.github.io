/* People page: interactive bipartite graph of members and research lines (D3 v7, self-hosted). */
(function () {
  "use strict";
  var el = document.getElementById("network-graph");
  if (!el || !window.d3) return;
  var d3 = window.d3;
  var COLORS = {
    "Business & Economics": "#c0392b",
    "Engineering": "#275882",
    "Humanities": "#8e44ad",
    "Information Technology": "#00707a",
    "Nagykanizsa Centre": "#d68910",
    "University-level unit": "#5a6470",
    "External": "#7f8c8d"
  };
  var tip = document.querySelector(".network-tip");

  fetch("/assets/data/network.json").then(function (r) { return r.json(); }).then(function (data) {
    var w = el.clientWidth, h = el.clientHeight;
    var svg = d3.select(el).attr("viewBox", [0, 0, w, h]).attr("role", "group")
      .attr("aria-label", "Network of members and the nine research lines; the grouped lists below contain the same information.");
    var g = svg.append("g");
    svg.call(d3.zoom().scaleExtent([0.5, 3]).on("zoom", function (e) { g.attr("transform", e.transform); }));

    var lines = data.nodes.filter(function (n) { return n.type === "line"; });
    // place research lines on a circle, members float in between
    lines.forEach(function (n, i) {
      var a = (i / lines.length) * 2 * Math.PI - Math.PI / 2;
      n.fx = w / 2 + Math.cos(a) * w * 0.36;
      n.fy = h / 2 + Math.sin(a) * h * 0.33;
    });

    var sim = d3.forceSimulation(data.nodes)
      .force("link", d3.forceLink(data.links).id(function (d) { return d.id; }).distance(function (l) { return l.main ? 70 : 120; }).strength(function (l) { return l.main ? 0.5 : 0.18; }))
      .force("charge", d3.forceManyBody().strength(function (d) { return d.type === "line" ? -400 : -55; }))
      .force("collide", d3.forceCollide().radius(function (d) { return d.type === "line" ? 34 : 9; }))
      .force("x", d3.forceX(w / 2).strength(0.03))
      .force("y", d3.forceY(h / 2).strength(0.05));

    var link = g.append("g").attr("stroke-linecap", "round").selectAll("line").data(data.links).join("line")
      .attr("stroke", function (l) { return l.main ? "#7fa7c4" : "#c9d6e3"; })
      .attr("stroke-width", function (l) { return l.main ? 1.6 : 1; });

    var node = g.append("g").selectAll("g").data(data.nodes).join("g")
      .attr("class", function (d) { return "gnode " + d.type; })
      .attr("tabindex", 0)
      .attr("role", "button")
      .attr("aria-label", function (d) { return d.type === "line" ? "Research line " + d.num + ": " + d.label : d.label + ", " + d.group; })
      .style("cursor", "pointer");

    node.filter(function (d) { return d.type === "line"; }).append("circle").attr("r", 26)
      .attr("fill", "rgba(97,206,212,.85)").attr("stroke", "#00707a").attr("stroke-width", 2);
    node.filter(function (d) { return d.type === "line"; }).append("text").text(function (d) { return d.num; })
      .attr("text-anchor", "middle").attr("dy", "0.36em").attr("font-weight", 900).attr("font-size", 18).attr("fill", "#0b2f3a");
    node.filter(function (d) { return d.type === "line" && w >= 640; }).append("text").text(function (d) { return d.label; })
      .attr("text-anchor", "middle").attr("dy", 44).attr("font-size", 12.5).attr("font-weight", 700).attr("fill", "#12263a")
      .attr("paint-order", "stroke").attr("stroke", "#fff").attr("stroke-width", 4);
    node.filter(function (d) { return d.type === "member"; }).append("circle").attr("r", 6.5)
      .attr("fill", function (d) { return COLORS[d.group] || "#5a6470"; }).attr("stroke", "#fff").attr("stroke-width", 1.5);

    var adj = {};
    data.links.forEach(function (l) {
      var s = l.source.id || l.source, t = l.target.id || l.target;
      (adj[s] = adj[s] || {})[t] = 1; (adj[t] = adj[t] || {})[s] = 1;
    });
    function focus(d) {
      node.attr("opacity", function (o) { return o === d || (adj[d.id] && adj[d.id][o.id]) ? 1 : 0.18; });
      link.attr("opacity", function (l) { return l.source === d || l.target === d ? 1 : 0.08; });
    }
    function unfocus() { node.attr("opacity", 1); link.attr("opacity", 1); hideTip(); }
    function showTip(e, d) {
      if (!tip) return;
      tip.innerHTML = d.type === "line" ? "<strong>" + d.num + " · " + d.label + "</strong><br>Click to open the research line"
        : "<strong>" + d.label + "</strong><br>" + d.position + "<br><em>" + d.group + "</em>";
      var r = el.getBoundingClientRect();
      tip.style.left = Math.min(r.width - 270, (e.clientX - r.left) + 14) + "px";
      tip.style.top = ((e.clientY - r.top) + 14) + "px";
      tip.style.opacity = 1;
    }
    function hideTip() { if (tip) tip.style.opacity = 0; }
    function activate(d) {
      if (d.type === "line") { window.location.href = d.url; return; }
      var card = document.querySelector('.member-card[data-member="' + d.id + '"]');
      if (card) { card.scrollIntoView({ behavior: "smooth", block: "center" }); card.classList.remove("flash"); void card.offsetWidth; card.classList.add("flash"); }
    }
    node.on("mouseenter focus", function (e, d) { focus(d); if (e.clientX) showTip(e, d); })
      .on("mousemove", function (e, d) { showTip(e, d); })
      .on("mouseleave blur", unfocus)
      .on("click", function (e, d) { activate(d); })
      .on("keydown", function (e, d) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); activate(d); } });

    node.filter(function (d) { return d.type === "member"; }).call(d3.drag()
      .on("start", function (e, d) { if (!e.active) sim.alphaTarget(0.25).restart(); d.fx = d.x; d.fy = d.y; })
      .on("drag", function (e, d) { d.fx = e.x; d.fy = e.y; })
      .on("end", function (e, d) { if (!e.active) sim.alphaTarget(0); d.fx = null; d.fy = null; }));

    var PAD = 18;
    sim.on("tick", function () {
      data.nodes.forEach(function (d) { if (d.type === "member") { d.x = Math.max(PAD, Math.min(w - PAD, d.x)); d.y = Math.max(PAD, Math.min(h - PAD, d.y)); } });
      link.attr("x1", function (d) { return d.source.x; }).attr("y1", function (d) { return d.source.y; })
        .attr("x2", function (d) { return d.target.x; }).attr("y2", function (d) { return d.target.y; });
      node.attr("transform", function (d) { return "translate(" + d.x + "," + d.y + ")"; });
    });
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) { sim.tick(300); sim.stop(); sim.on("tick")(); }

    // legend
    var legend = document.querySelector(".network-legend");
    if (legend) {
      var used = {}; data.nodes.forEach(function (n) { if (n.group) used[n.group] = 1; });
      legend.innerHTML = '<span><i style="background:rgba(97,206,212,.85);border:2px solid #00707a"></i> Research line</span>' +
        Object.keys(COLORS).filter(function (k) { return used[k]; }).map(function (k) {
          return '<span><i style="background:' + COLORS[k] + '"></i> ' + k + "</span>";
        }).join("");
    }
  });
})();
