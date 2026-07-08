/**
 * content-store.js
 * -----------------------------------------------------------------------------
 * Single source of truth for the Content Editor.
 *
 * WHAT IT DOES
 *   1. On load       — GET /api/draft → stores raw page.json → calls renderPanel()
 *   2. On field edit — oninput handlers call CS.update(path, value) → schedules auto-save
 *   3. Auto-save     — debounced PUT /api/draft (1.5s after last edit)
 *   4. Publish       — PUT /api/draft then POST /api/publish
 *   5. Discard       — GET /api/draft again, re-render
 *   6. Rollback      — POST /api/rollback, reload draft, re-render
 *
 * NO TRANSLATION LAYER
 *   The render functions (content-panels.js) read directly from the raw
 *   page.json shape — the same keys, the same nesting. No contentData mapping.
 *
 * USAGE IN index.html
 *   <script src="main.js"></script>        ← keep as-is (dashboard, nav, drawers)
 *   <script src="content-store.js"></script>
 *   <script src="content-panels.js"></script>
 *
 * -----------------------------------------------------------------------------
 * SWITCH: API_BASE
 *
 *   Option 1 — Same domain (recommended)
 *     staticwebapp.config.json proxies /api/* → Flask.
 *     var API_BASE = '/api';
 *
 *   Option 2 — Separate domains
 *     var API_BASE = 'https://rea-buzz-api.azurewebsites.net/api';
 *     Set ALLOWED_ORIGIN in Flask .env to your Static Web App domain.
 *
 *   Local dev: auto-detects localhost → Flask on port 5000.
 * -----------------------------------------------------------------------------
 */

(function (window) {
  'use strict';

  // ---------------------------------------------------------------------------
  // Config
  // ---------------------------------------------------------------------------

  var API_BASE = (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  )
    ? 'http://localhost:5000/api'   // Flask dev server
    : '/api';                        // production (Option 1: same-domain proxy)

  var AUTOSAVE_MS = 1500;

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  var _draft     = null;   // the live page.json object from Flask
  var _saveTimer = null;
  var _saving    = false;

  // ---------------------------------------------------------------------------
  // Low-level fetch
  // ---------------------------------------------------------------------------

  function _req(path, opts) {
    return fetch(API_BASE + path, opts || {}).then(function (r) {
      if (!r.ok) {
        return r.json().then(function (b) {
          throw new Error((b && b.error) || r.statusText);
        });
      }
      return r.json();
    });
  }

  // ---------------------------------------------------------------------------
  // Nested key writer
  // update('whatsNew.editorsPick.heading', 'New headline')
  // update('innovation.topInitiatives.items.0.title', 'New title')
  // ---------------------------------------------------------------------------

  function _set(obj, path, value) {
    var keys = path.split('.');
    var cur  = obj;
    for (var i = 0; i < keys.length - 1; i++) {
      var k = isNaN(keys[i]) ? keys[i] : Number(keys[i]);
      if (cur[k] === undefined || cur[k] === null) cur[k] = {};
      cur = cur[k];
    }
    var last = keys[keys.length - 1];
    cur[isNaN(last) ? last : Number(last)] = value;
  }

  // ---------------------------------------------------------------------------
  // Auto-save
  // ---------------------------------------------------------------------------

  function _scheduleSave() {
    clearTimeout(_saveTimer);
    _saveTimer = setTimeout(_save, AUTOSAVE_MS);
  }

  function _save() {
    if (_saving || !_draft) return;
    _saving = true;
    _setSaveLabel('Saving…');

    _req('/draft', {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(_draft),
    })
      .then(function (r) {
        _saving = false;
        _draft.lastSavedAt = r.lastSavedAt;
        _setSaveLabel('Saved ' + _hhMM(r.lastSavedAt));
      })
      .catch(function (e) {
        _saving = false;
        _setSaveLabel('Save failed', true);
        console.warn('content-store save error:', e.message);
      });
  }

  function _setSaveLabel(msg, err) {
    var el = document.getElementById('cs-save-label');
    if (!el) return;
    el.textContent = msg;
    el.style.color = err ? '#c0392b' : 'var(--txt2, #888)';
  }

  function _hhMM(iso) {
    if (!iso) return '';
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // ---------------------------------------------------------------------------
  // Public: update a field and schedule auto-save
  // Called by oninput/onchange handlers in content-panels.js:
  //   CS.update('whatsNew.editorsPick.heading', this.value)
  // ---------------------------------------------------------------------------

  function update(path, value) {
    if (!_draft) return;
    _set(_draft, path, value);
    // Mark a draft dot in the sidebar
    var section = path.split('.')[0];
    var sectionMap = {
      landing: 'landing', reaStory: 'reastory',
      innovation: 'portfolio', spotlight: 'spotlight', whatsNew: 'whatsnew',
    };
    if (window.markDraft && sectionMap[section]) {
      window.markDraft(sectionMap[section]);
    }
    _scheduleSave();
  }

  // ---------------------------------------------------------------------------
  // Public: splice helpers for array fields
  // ---------------------------------------------------------------------------

  function removeItem(path, idx) {
    if (!_draft) return;
    var keys = path.split('.');
    var arr  = keys.reduce(function (o, k) {
      return o && (isNaN(k) ? o[k] : o[Number(k)]);
    }, _draft);
    if (Array.isArray(arr)) {
      arr.splice(idx, 1);
      _scheduleSave();
    }
  }

  function addItem(path, item) {
    if (!_draft) return;
    var keys = path.split('.');
    var arr  = keys.reduce(function (o, k) {
      return o && (isNaN(k) ? o[k] : o[Number(k)]);
    }, _draft);
    if (Array.isArray(arr)) {
      arr.push(item);
      _scheduleSave();
    }
  }

  function moveItem(path, idx, dir) {
    if (!_draft) return;
    var keys = path.split('.');
    var arr  = keys.reduce(function (o, k) {
      return o && (isNaN(k) ? o[k] : o[Number(k)]);
    }, _draft);
    var newIdx = idx + dir;
    if (!Array.isArray(arr) || newIdx < 0 || newIdx >= arr.length) return;
    var tmp = arr[idx]; arr[idx] = arr[newIdx]; arr[newIdx] = tmp;
    _scheduleSave();
  }

  // ---------------------------------------------------------------------------
  // Public getter — panels read the draft directly
  // ---------------------------------------------------------------------------

  function get() { return _draft; }

  // ---------------------------------------------------------------------------
  // Publish
  // ---------------------------------------------------------------------------

  function publish(section) {
    if (!_draft) return;
    var user = (window.currentRole === 'bpm') ? 'BPM User' : 'Editorial User';
    _setSaveLabel('Publishing…');

    _req('/draft', {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(_draft),
    })
      .then(function () {
        return _req('/publish', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ publishedBy: user }),
        });
      })
      .then(function (r) {
        _draft.version     = r.version;
        _draft.publishedAt = r.publishedAt;
        if (window.clearDraft) window.clearDraft(section);
        _setSaveLabel('Published ' + r.version);
        _showToast('Published as ' + r.version + ' \u2713  Live site updated.', 'success');
        _renderVersionCard();
        if (window.render) window.render();
      })
      .catch(function (e) {
        _showToast('Publish failed: ' + e.message, 'danger');
      });
  }

  // ---------------------------------------------------------------------------
  // Discard
  // ---------------------------------------------------------------------------

  function discard(section) {
    _load().then(function () {
      if (window.clearDraft) window.clearDraft(section);
      _showToast('Draft discarded \u2014 reverted to last saved.', 'info');
      if (window.render) window.render();
    }).catch(function (e) {
      _showToast('Could not reload draft: ' + e.message, 'danger');
    });
  }

  // ---------------------------------------------------------------------------
  // Rollback
  // ---------------------------------------------------------------------------

  function rollback(version) {
    if (!confirm(
      'Restore ' + version + '?\n\n' +
      'The live site serves this version immediately, and your draft ' +
      'is replaced with its content.'
    )) return;

    _req('/rollback', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ version: version }),
    })
      .then(_load)
      .then(function () {
        _showToast('Restored to ' + version + ' \u2713  Live site updated.', 'success');
        if (window.render) window.render();
      })
      .catch(function (e) {
        _showToast('Rollback failed: ' + e.message, 'danger');
      });
  }

  // ---------------------------------------------------------------------------
  // Version history card
  // ---------------------------------------------------------------------------

  function _renderVersionCard() {
    var mount = document.getElementById('cs-version-mount');
    if (!mount) return;
    mount.innerHTML = '<div class="section-card" style="opacity:.6;font-size:13px;">Loading\u2026</div>';

    _req('/versions').then(function (manifest) {
      var versions = manifest.versions || [];
      var liveN    = manifest.liveVersion;

      if (!versions.length) {
        mount.innerHTML =
          '<div class="section-card"><h4>Version history</h4>' +
          '<div style="color:var(--txt2);font-size:13px;padding:8px 0;">Nothing published yet.</div></div>';
        return;
      }

      var rows = versions.map(function (v) {
        var isLive = Number(v.version.replace('v', '')) === liveN;
        var date   = v.publishedAt ? v.publishedAt.split('T')[0] : '\u2014';
        var who    = (v.publishedBy && v.publishedBy !== 'unknown')
          ? ' \u00b7 ' + v.publishedBy : '';
        return (
          '<div class="list-item" style="align-items:center;">' +
            '<div class="li-body">' +
              '<div class="li-title" style="display:flex;align-items:center;gap:8px;">' +
                v.version +
                (isLive
                  ? '<span style="font-size:10px;background:#1a8a5a;color:#fff;' +
                    'padding:2px 7px;border-radius:4px;font-weight:bold;">LIVE</span>'
                  : '') +
              '</div>' +
              '<div class="li-sub">' + date + who + '</div>' +
            '</div>' +
            '<div class="li-actions">' +
              (!isLive
                ? '<button class="btn btn-ghost btn-sm" onclick="CS.rollback(\'' + v.version + '\')">Restore</button>'
                : '<span style="font-size:12px;color:var(--txt2);">Current live</span>') +
            '</div>' +
          '</div>'
        );
      }).join('');

      mount.innerHTML =
        '<div class="section-card">' +
          '<h4>Version history</h4>' +
          '<div class="sc-sub" style="margin-bottom:12px;">' +
            'Restore instantly serves that version live and loads it into your draft.' +
          '</div>' +
          rows +
        '</div>';
    }).catch(function () {
      mount.innerHTML =
        '<div class="section-card"><h4>Version history</h4>' +
        '<div style="color:var(--txt2);font-size:13px;">Could not load versions.</div></div>';
    });
  }

  // ---------------------------------------------------------------------------
  // Patch main.js globals so existing toolbar buttons work
  // ---------------------------------------------------------------------------

  function _patchGlobals() {
    // publishSection(section) is called by "Publish" buttons in main.js render fns
    window.publishSection = publish;

    // discardDraft(section) is called by "Discard draft" buttons
    window.discardDraft   = discard;
  }

  // ---------------------------------------------------------------------------
  // Patch render functions to append save-label + version card
  // ---------------------------------------------------------------------------

  function _patchRenderers() {
    var map = {
      landing:   'renderLanding',
      reastory:  'renderREAStory',
      portfolio: 'renderPortfolio',
      spotlight: 'renderSpotlight',
      whatsnew:  'renderWhatsNew',
    };

    Object.keys(map).forEach(function (key) {
      var fn  = map[key];
      var orig = window[fn];
      if (!orig) return;

      window[fn] = function () {
        orig.apply(this, arguments);

        var body = document.querySelector('#mainArea .panel-body');
        if (!body) return;

        // Save indicator
        var lbl = document.createElement('div');
        lbl.id = 'cs-save-label';
        lbl.style.cssText = 'font-size:11px;color:var(--txt2);text-align:right;padding:0 2px 4px;min-height:16px;';
        if (_draft && _draft.lastSavedAt) {
          lbl.textContent = 'Last saved ' + _hhMM(_draft.lastSavedAt);
        }
        body.appendChild(lbl);

        // Version card
        var vm = document.createElement('div');
        vm.id  = 'cs-version-mount';
        body.appendChild(vm);
        _renderVersionCard();
      };
    });
  }

  // ---------------------------------------------------------------------------
  // Load draft from Flask
  // ---------------------------------------------------------------------------

  function _load() {
    return _req('/draft').then(function (data) {
      _draft = data;
    });
  }

  // ---------------------------------------------------------------------------
  // Toast (fallback if main.js showToast isn't available yet)
  // ---------------------------------------------------------------------------

  function _showToast(msg, type) {
    if (window.showToast) { window.showToast(msg, type); return; }
    var t = document.createElement('div');
    t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);' +
      'background:' + (type === 'success' ? '#1a8a5a' : type === 'danger' ? '#c0392b' : '#333') + ';' +
      'color:#fff;font-size:13px;font-weight:bold;padding:10px 20px;border-radius:10px;z-index:9999;';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 3000);
  }

  // ---------------------------------------------------------------------------
  // Boot
  // ---------------------------------------------------------------------------

  document.addEventListener('DOMContentLoaded', function () {
    _patchGlobals();
    _patchRenderers();

    _load()
      .then(function () {
        // content-panels.js overrides the render functions and needs _draft ready
        if (window.render) window.render();
        if (_draft && _draft.restoredFrom) {
          _showToast('Draft restored from ' + _draft.restoredFrom + ' \u2014 publish when ready.', 'info');
        }
      })
      .catch(function (e) {
        if (e.message && e.message.includes('404')) {
          _showToast('No draft yet \u2014 save content to create one.', 'info');
        } else {
          console.warn('content-store: could not load draft \u2014', e.message);
          _showToast('API unreachable \u2014 running on local data.', 'info');
        }
      });
  });

  // ---------------------------------------------------------------------------
  // Public surface  window.CS
  // ---------------------------------------------------------------------------

  window.CS = {
    get:        get,
    update:     update,
    removeItem: removeItem,
    addItem:    addItem,
    moveItem:   moveItem,
    publish:    publish,
    discard:    discard,
    rollback:   rollback,
  };

}(window));
