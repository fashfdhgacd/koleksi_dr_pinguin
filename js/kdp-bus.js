(function () {
  if (window.KDP && window.KDP.ready) return;
  var owner = {
    recs: "modal-share",
    gallery: "app",
    posters: "force-posters",
    nav: "nav-fix",
    share: "share-sheet",
    overlay: "kdp-overlay"
  };
  window.KDP = {
    ready: true,
    owner: owner,
    can: function (zone, who) {
      return owner[zone] === who;
    }
  };
})();
