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
