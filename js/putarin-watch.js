(function () {
  document.addEventListener('click', function (e) {
    var btn = e.target && e.target.closest && e.target.closest('.openv');
    if (!btn) return;
    var card = btn.closest('.card');
    if (!card) return;
    var id = card.getAttribute('data-id');
    if (!id) return;
    e.preventDefault();
    e.stopPropagation();
    location.href = '/v/' + encodeURIComponent(id);
  }, true);
})();
