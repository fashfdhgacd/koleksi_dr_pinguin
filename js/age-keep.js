(function () {
  var KEY = "kdp_age_ok";
  var DAY = 30 * 24 * 60 * 60 * 1000;
  function pass() {
    try {
      localStorage.setItem(KEY, String(Date.now() + DAY));
      sessionStorage.setItem("age_ok", "1");
    } catch (_) {}
    var gate = document.getElementById("ageGate");
    var main = document.getElementById("mainContent");
    if (gate) gate.classList.add("hidden");
    if (main) {
      main.classList.remove("opacity-0");
      main.classList.add("opacity-100");
    }
  }
  function ok() {
    try {
      if (sessionStorage.getItem("age_ok") === "1") return true;
      var raw = localStorage.getItem(KEY);
      if (raw === "1") return true;
      var n = parseInt(raw, 10);
      return !!(n && Date.now() < n);
    } catch (_) { return false; }
  }
  if (ok()) pass();
  document.addEventListener("click", function (e) {
    var t = e.target.closest && e.target.closest("#btnEnter, #btnLeave");
    if (!t) return;
    if (t.id === "btnEnter") {
      e.preventDefault();
      pass();
    }
  }, true);
})();
