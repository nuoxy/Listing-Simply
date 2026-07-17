(function () {
  'use strict';

  // ── Theme toggle ──────────────────────────────────────────
  var themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    function setTheme(theme) {
      document.documentElement.setAttribute('data-theme', theme);
      try { localStorage.setItem('theme', theme); } catch (e) {}
      var meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', theme === 'dark' ? '#131210' : '#F2F0EB');
    }
    themeToggle.addEventListener('click', function () {
      var current = document.documentElement.getAttribute('data-theme');
      var isDark = current
        ? current === 'dark'
        : (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
      setTheme(isDark ? 'light' : 'dark');
    });
  }

  // ── Unified filter + sort ─────────────────────────────────
  var grid = document.getElementById('listings-grid');
  if (grid) {
    var allCards = Array.from(grid.querySelectorAll('.listing-card'));
    var state = { category: 'all', condition: 'all', location: 'all', search: '', sort: 'date-desc' };

    function applyFilters() {
      var term = state.search.trim().toLowerCase();
      var visible = allCards.filter(function (card) {
        if (state.category !== 'all' && card.dataset.category !== state.category) return false;
        if (state.condition !== 'all' && card.dataset.condition !== state.condition) return false;
        if (state.location !== 'all' && card.dataset.location !== state.location) return false;
        if (term) {
          var hay = (card.dataset.title || '') + ' ' + (card.dataset.location || '');
          if (hay.indexOf(term) === -1) return false;
        }
        return true;
      });

      visible.sort(function (a, b) {
        switch (state.sort) {
          case 'price-asc':  return +a.dataset.price - +b.dataset.price;
          case 'price-desc': return +b.dataset.price - +a.dataset.price;
          case 'expiry-asc': return +a.dataset.expiry - +b.dataset.expiry;
          default:           return +b.dataset.date - +a.dataset.date;
        }
      });

      allCards.forEach(function (c) { c.style.display = 'none'; });
      visible.forEach(function (c) { c.style.display = ''; grid.appendChild(c); });

      var noResults = document.getElementById('no-results');
      if (noResults) noResults.style.display = visible.length === 0 ? '' : 'none';
    }

    // Category chips
    var filterBar = document.getElementById('category-bar');
    if (filterBar) {
      filterBar.addEventListener('click', function (e) {
        var chip = e.target.closest('.chip');
        if (!chip) return;
        filterBar.querySelectorAll('.chip').forEach(function (c) { c.classList.remove('active'); });
        chip.classList.add('active');
        state.category = chip.dataset.filter;
        applyFilters();
      });
    }

    // Condition chips
    var condBar = document.getElementById('condition-bar');
    if (condBar) {
      condBar.addEventListener('click', function (e) {
        var chip = e.target.closest('.chip');
        if (!chip) return;
        condBar.querySelectorAll('.chip').forEach(function (c) { c.classList.remove('active'); });
        chip.classList.add('active');
        state.condition = chip.dataset.condition;
        applyFilters();
      });
    }

    // Sort select
    var sortSel = document.getElementById('sort-select');
    if (sortSel) {
      sortSel.addEventListener('change', function () { state.sort = this.value; applyFilters(); });
    }

    // Location select
    var locSel = document.getElementById('location-select');
    if (locSel) {
      locSel.addEventListener('change', function () { state.location = this.value; applyFilters(); });
    }

    // Search input (debounced 200 ms)
    var searchInput = document.getElementById('listing-search');
    if (searchInput) {
      var debounceTimer;
      searchInput.addEventListener('input', function () {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(function () { state.search = searchInput.value; applyFilters(); }, 200);
      });
    }
  }

  // ── Submit form: success state + Cloudinary upload widget ─
  var form = document.getElementById('submit-form');
  if (form) {
    if (window.location.search.indexOf('thanks') !== -1) {
      form.classList.add('hidden');
      var success = document.getElementById('submit-success');
      if (success) success.classList.remove('hidden');
    }
  }

  // ── Cloudinary Upload Widget ──────────────────────────────
  var uploadBtn = document.getElementById('cloudinary-upload');
  if (uploadBtn && window.cloudinary) {
    var cloudName    = uploadBtn.dataset.cloud;
    var uploadPreset = uploadBtn.dataset.preset;
    var slots        = [1, 2, 3, 4].map(function (n) {
      return document.getElementById('image_url_' + n);
    });
    var preview      = document.getElementById('img-preview');
    var uploadedCount = 0;

    var widget = window.cloudinary.createUploadWidget(
      {
        cloudName:    cloudName,
        uploadPreset: uploadPreset,
        maxFiles:     4,
        maxFileSize:  5242880,   // 5 MB
        sources:      ['local', 'camera'],
        multiple:     true,
        resourceType: 'image',
        showAdvancedOptions: false,
        cropping: false
      },
      function (error, result) {
        if (error) { return; }
        if (result.event !== 'success') { return; }

        var url = result.info.secure_url;

        // Fill next available hidden slot
        for (var i = 0; i < slots.length; i++) {
          if (!slots[i].value) {
            slots[i].value = url;

            // Build thumbnail with remove button
            var thumb = document.createElement('div');
            thumb.className = 'preview-thumb';
            thumb.dataset.slot = i;
            var img = document.createElement('img');
            img.src = url;
            img.alt = '';
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'remove-thumb';
            btn.setAttribute('aria-label', 'הסר תמונה');
            btn.textContent = '✕';
            thumb.appendChild(img);
            thumb.appendChild(btn);
            preview.appendChild(thumb);

            uploadedCount++;
            if (uploadedCount >= 4) {
              uploadBtn.disabled = true;
              uploadBtn.textContent = '📷 הועלו 4 תמונות';
            }
            break;
          }
        }
      }
    );

    uploadBtn.addEventListener('click', function () {
      widget.open();
    });

    // Remove thumbnail and free the slot
    preview.addEventListener('click', function (e) {
      var removeBtn = e.target.closest('.remove-thumb');
      if (!removeBtn) { return; }
      var thumb = removeBtn.closest('.preview-thumb');
      var slotIdx = parseInt(thumb.dataset.slot, 10);
      slots[slotIdx].value = '';
      thumb.remove();
      uploadedCount--;
      uploadBtn.disabled = false;
      uploadBtn.textContent = '📷 הוסף תמונות';
    });
  }

})();
