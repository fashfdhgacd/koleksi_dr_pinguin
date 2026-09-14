(function () {
  function makePill(href, label) {
    var a = document.createElement('a');
    a.href = href;
    a.setAttribute('data-putarin-nav', href);
    a.className = 'cat-pill';
    a.textContent = label;
    a.style.textDecoration = 'none';
    return a;
  }
  function makeCard(href, title, sub, icon) {
    var a = document.createElement('a');
    a.href = href;
    a.setAttribute('data-putarin-nav', href);
    a.className = 'genre-card group';
    a.style.textDecoration = 'none';
    a.innerHTML = '<div class="w-10 h-10 rounded bg-[#ff9000]/15 text-[#ff9000] flex items-center justify-center mb-3"><i class="fas '+icon+' text-sm"></i></div><div class="font-semibold text-sm truncate">'+title+'</div><div class="text-xs text-neutral-500 mt-0.5">'+sub+'</div>';
    return a;
  }
  function inject() {
    var pills = document.getElementById('categoryPills');
    if (pills) {
      if (!pills.querySelector('[data-putarin-nav="/putarin"]')) {
        var pill = makePill('/putarin', 'JAV 18+');
        if (pills.children.length > 1) pills.insertBefore(pill, pills.children[1]);
        else pills.appendChild(pill);
      }
      if (!pills.querySelector('[data-putarin-nav="/mumu"]')) {
        var pill2 = makePill('/mumu', 'Video AI China');
        var jav = pills.querySelector('[data-putarin-nav="/putarin"]');
        if (jav && jav.nextSibling) pills.insertBefore(pill2, jav.nextSibling);
        else pills.appendChild(pill2);
      }
    }
    var grid = document.getElementById('genreGrid');
    if (grid) {
      if (!grid.querySelector('[data-putarin-nav="/putarin"]')) {
        var card = makeCard('/putarin', 'JAV 18+', 'Halaman sendiri', 'fa-film');
        if (grid.firstChild) grid.insertBefore(card, grid.firstChild);
        else grid.appendChild(card);
      }
      if (!grid.querySelector('[data-putarin-nav="/mumu"]')) {
        var card2 = makeCard('/mumu', 'Video AI China', 'Halaman sendiri', 'fa-dragon');
        var javCard = grid.querySelector('[data-putarin-nav="/putarin"]');
        if (javCard && javCard.nextSibling) grid.insertBefore(card2, javCard.nextSibling);
        else if (javCard) grid.appendChild(card2);
        else if (grid.firstChild) grid.insertBefore(card2, grid.firstChild);
        else grid.appendChild(card2);
      }
    }
  }
  inject();
  setTimeout(inject, 400);
  setTimeout(inject, 1200);
  setTimeout(inject, 2500);
})();
