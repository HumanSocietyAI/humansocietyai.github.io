/* Site-wide helpers: e-mail assembly, search placement. No cookies, no tracking. */
(function () {
  "use strict";

  // 1. E-mail addresses are stored reversed in data attributes and assembled here,
  //    so that simple harvesting robots that do not run JavaScript cannot read them.
  function rev(s) { return (s || "").split("").reverse().join(""); }
  document.querySelectorAll("a.js-mail[data-u][data-d]").forEach(function (a) {
    var addr = rev(a.getAttribute("data-u")) + "@" + rev(a.getAttribute("data-d"));
    a.setAttribute("href", "mailto:" + addr);
    if (a.classList.contains("show-address")) a.textContent = addr;
    a.title = addr;
  });

  // 2. Move Quarto's search button from the teal header into the dark-blue top bar.
  function moveSearch() {
    var target = document.getElementById("tb-search");
    var search = document.getElementById("quarto-search");
    if (!target || !search) return false;
    target.appendChild(search);
    search.style.display = "flex";
    return true;
  }
  if (!moveSearch()) {
    var tries = 0;
    var t = setInterval(function () { if (moveSearch() || ++tries > 40) clearInterval(t); }, 100);
  }
})();
