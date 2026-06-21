(function () {
  'use strict';

  // ── Category filter chips ─────────────────────────────────
  var filterBar = document.querySelector('.filter-bar');
  if (filterBar) {
    filterBar.addEventListener('click', function (e) {
      var chip = e.target.closest('.chip');
      if (!chip) return;

      filterBar.querySelectorAll('.chip').forEach(function (c) {
        c.classList.remove('active');
      });
      chip.classList.add('active');

      var filter = chip.dataset.filter;
      document.querySelectorAll('.listing-card').forEach(function (card) {
        var show = filter === 'all' || card.dataset.category === filter;
        card.style.display = show ? '' : 'none';
      });
    });
  }

  // ── Submit form: show success state after Netlify redirect ─
  var form = document.getElementById('submit-form');
  if (form) {
    // Netlify redirects to /?submission=listing-submission after POST
    // For a SPA-style success without redirect, intercept submit:
    form.addEventListener('submit', function (e) {
      // Let the native Netlify form POST proceed naturally.
      // Netlify will redirect to the page with ?submission param.
      // We handle the success state via URL param below.
    });

    // If page loaded with ?thanks query param, show success
    if (window.location.search.indexOf('thanks') !== -1) {
      form.classList.add('hidden');
      var success = document.getElementById('submit-success');
      if (success) success.classList.remove('hidden');
    }
  }

  // ── Telegram share button: inject dynamic URL ─────────────
  // (Handled server-side in Hugo template; nothing extra needed here)

})();
