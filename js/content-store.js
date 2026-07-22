/**
 * content-store.js
 * -----------------------------------------------------------------------------
 * Data layer for the REA Buzz Content Editor.
 * Loads draft/page.json from Flask, exposes it to panels, handles save/publish.
 *
 * Load order in index.html:
 *   <script src="main.js"></script>
 *   <script src="content-store.js"></script>
 *   <script src="content-panels.js"></script>
 *
 * Panels read data via:        CS.get()
 * Panels write a field via:    CS.update('dot.path', value)
 * Panels add to an array:      CS.addItem('dot.path', item)
 * Panels remove from array:    CS.removeItem('dot.path', index)
 * Panels reorder an array:     CS.moveItem('dot.path', index, +1 or -1)
 * Panels build a media URL:    CS.mediaUrl('media/Images/bpm.png')
 * Panels append footer:        CS.appendFooter()
 * -----------------------------------------------------------------------------
 */

(function (window) {
  'use strict';

  // ---------------------------------------------------------------------------
  // Config
  // ---------------------------------------------------------------------------

  // SWITCH: local dev points at Flask on 5000, production uses same-domain proxy
  var API = (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  ) ? 'http://localhost:5000/api' : '/api';

  var AUTOSAVE_MS = 2000;

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  var _draft     = null;   // the raw page.json object
  var _media     = null;   // { baseUrl, sas } from /api/media-url
  var _saveTimer = null;
  var _saving    = false;

  // ---------------------------------------------------------------------------
  // HTTP helpers
  // ---------------------------------------------------------------------------

  function _req(method, path, body) {
    var opts = {
      method:  method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (body !== undefined) opts.body = JSON.stringify(body);

    return fetch(API + path, opts).then(function (r) {
      if (!r.ok) {
        return r.json().then(function (b) {
          throw new Error((b && b.error) || r.statusText);
        });
      }
      return r.json();
    });
  }

  // ---------------------------------------------------------------------------
  // Nested path helpers
  // ---------------------------------------------------------------------------

  function _get(obj, path) {
    return path.split('.').reduce(function (o, k) {
      return o == null ? undefined : o[isNaN(k) ? k : Number(k)];
    }, obj);
  }

  function _set(obj, path, value) {
    var keys = path.split('.');
    var cur  = obj;
    for (var i = 0; i < keys.length - 1; i++) {
      var k = isNaN(keys[i]) ? keys[i] : Number(keys[i]);
      if (cur[k] == null || typeof cur[k] !== 'object') cur[k] = {};
      cur = cur[k];
    }
    var last = keys[keys.length - 1];
    cur[isNaN(last) ? last : Number(last)] = value;
  }

  // ---------------------------------------------------------------------------
  // Save label
  // ---------------------------------------------------------------------------

  function _label(msg, isError) {
    var el = document.getElementById('cs-save-label');
    if (!el) return;
    el.textContent = msg;
    el.style.color = isError ? '#c0392b' : 'var(--txt2, #888)';
  }

  function _hhMM(iso) {
    if (!iso) return '';
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
    _label('Saving\u2026');

    _req('PUT', '/draft', _draft)
      .then(function (r) {
        _saving = false;
        _draft.lastSavedAt = r.lastSavedAt;
        _label('Saved ' + _hhMM(r.lastSavedAt));
      })
      .catch(function (e) {
        _saving = false;
        _label('Save failed', true);
        console.error('CS save:', e.message);
      });
  }

  // ---------------------------------------------------------------------------
  // Public: read
  // ---------------------------------------------------------------------------

  function get() {
    return _draft;
  }

  // ---------------------------------------------------------------------------
  // Public: write a single field
  // ---------------------------------------------------------------------------

  function update(path, value) {
    if (!_draft) return;
    _set(_draft, path, value);
    // Mark draft dot on sidebar
    var section = path.split('.')[0];
    var sectionMap = {
      landing:    'landing',
      reaStory:   'reastory',
      innovation: 'portfolio',
      spotlight:  'spotlight',
      whatsNew:   'whatsnew',
    };
    if (window.markDraft && sectionMap[section]) {
      window.markDraft(sectionMap[section]);
    }
    _scheduleSave();
  }

  // ---------------------------------------------------------------------------
  // Public: array helpers
  // ---------------------------------------------------------------------------

  function _getArray(path) {
    var arr = _get(_draft, path);
    return Array.isArray(arr) ? arr : null;
  }

  function addItem(path, item) {
    var arr = _getArray(path);
    if (!arr) return;
    arr.push(item);
    _scheduleSave();
  }

  function removeItem(path, idx) {
    var arr = _getArray(path);
    if (!arr) return;
    arr.splice(idx, 1);
    _scheduleSave();
  }

  function moveItem(path, idx, dir) {
    var arr    = _getArray(path);
    var newIdx = idx + dir;
    if (!arr || newIdx < 0 || newIdx >= arr.length) return;
    var tmp      = arr[idx];
    arr[idx]     = arr[newIdx];
    arr[newIdx]  = tmp;
    _scheduleSave();
  }

  // ---------------------------------------------------------------------------
  // Public: media URL builder
  // ---------------------------------------------------------------------------

  function mediaUrl(path) {
    if (!path) return '';
    var stripped = path.replace(/^media\//, '');
    var encoded  = stripped.split('/').map(encodeURIComponent).join('/');
    if (!_media) return '';
    return _media.baseUrl + '/' + encoded + '?' + _media.sas;
  }

  // ---------------------------------------------------------------------------
  // Public: append save label + version card after panel renders
  // Called at the end of every renderXxx() in content-panels.js
  // ---------------------------------------------------------------------------

  function appendFooter() {
    var body = document.querySelector('#mainArea .panel-body');
    if (!body) return;

    // Remove existing footer elements to avoid duplicates on re-render
    var existingLabel = document.getElementById('cs-save-label');
    var existingMount = document.getElementById('cs-version-mount');
    if (existingLabel) existingLabel.remove();
    if (existingMount) existingMount.remove();

    // Save indicator
    var lbl = document.createElement('div');
    lbl.id = 'cs-save-label';
    lbl.style.cssText = 'font-size:11px;color:var(--txt2);text-align:right;padding:4px 2px;min-height:16px;';
    if (_draft && _draft.lastSavedAt) {
      lbl.textContent = 'Last saved ' + _hhMM(_draft.lastSavedAt);
    }
    body.appendChild(lbl);

    // Version card
    var vm = document.createElement('div');
    vm.id  = 'cs-version-mount';
    body.appendChild(vm);
    _renderVersionCard(vm);
  }

  // ---------------------------------------------------------------------------
  // Publish
  // ---------------------------------------------------------------------------

  function publish(section) {
    if (!_draft) return;
    var user = window.currentRole === 'bpm' ? 'BPM User' : 'Editorial User';

    // Disable publish buttons while in flight
    document.querySelectorAll('.btn-publish').forEach(function (btn) {
      btn.disabled = true;
      btn.textContent = 'Publishing\u2026';
    });

    _label('Publishing\u2026');

    _req('PUT', '/draft', _draft)
      .then(function () {
        return _req('POST', '/publish', { publishedBy: user });
      })
      .then(function (r) {
        _draft.version     = r.version;
        _draft.publishedAt = r.publishedAt;
        _label('Published ' + r.version);
        _toast('Published as ' + r.version + ' \u2713  Live site updated.', 'success');
        if (window.clearDraft) window.clearDraft(section);
        var vm = document.getElementById('cs-version-mount');
        if (vm) _renderVersionCard(vm);
      })
      .catch(function (e) {
        _toast('Publish failed: ' + e.message, 'danger');
      })
      .finally(function () {
        document.querySelectorAll('.btn-publish').forEach(function (btn) {
          btn.disabled = false;
          btn.textContent = '\u2191 Publish';
        });
      });
  }

  // ---------------------------------------------------------------------------
  // Discard
  // ---------------------------------------------------------------------------

  function discard() {
    _req('GET', '/draft')
      .then(function (data) {
        _draft = data;
        _label('Reverted to last saved');
        _toast('Draft discarded.', 'info');
        if (window.render) window.render();
      })
      .catch(function (e) {
        _toast('Could not reload draft: ' + e.message, 'danger');
      });
  }

  // ---------------------------------------------------------------------------
  // Rollback
  // ---------------------------------------------------------------------------

  function rollback(version) {
    if (!confirm(
      'Restore ' + version + '?\n\nThe live site serves this version immediately and your draft is replaced.'
    )) return;

    _req('POST', '/rollback', { version: version })
      .then(function () { return _req('GET', '/draft'); })
      .then(function (data) {
        _draft = data;
        _toast('Restored to ' + version + ' \u2713', 'success');
        if (window.render) window.render();
      })
      .catch(function (e) {
        _toast('Rollback failed: ' + e.message, 'danger');
      });
  }

  // ---------------------------------------------------------------------------
  // Version history card
  // ---------------------------------------------------------------------------

  function _renderVersionCard(mount) {
    if (!mount) return;
    mount.innerHTML = '<div class="section-card" style="opacity:.6;font-size:13px;">Loading\u2026</div>';

    _req('GET', '/versions')
      .then(function (m) {
        var versions = m.versions || [];
        var liveN    = m.liveVersion;

        if (!versions.length) {
          mount.innerHTML =
            '<div class="section-card"><h4>Version history</h4>' +
            '<div style="color:var(--txt2);font-size:13px;padding:8px 0;">Nothing published yet.</div></div>';
          return;
        }

        var rows = versions.map(function (v) {
          var isLive = Number(v.version.replace('v', '')) === liveN;
          var date   = v.publishedAt ? v.publishedAt.split('T')[0] : '\u2014';
          var who    = v.publishedBy && v.publishedBy !== 'unknown' ? ' \u00b7 ' + v.publishedBy : '';

          return '<div class="list-item" style="align-items:center;">' +
            '<div class="li-body">' +
              '<div class="li-title" style="display:flex;align-items:center;gap:8px;">' +
                v.version +
                (isLive
                  ? '<span style="font-size:10px;background:#1a8a5a;color:#fff;padding:2px 7px;border-radius:4px;font-weight:bold;">LIVE</span>'
                  : '') +
              '</div>' +
              '<div class="li-sub">' + date + who + '</div>' +
            '</div>' +
            '<div class="li-actions">' +
              (!isLive
                ? '<button class="btn btn-ghost btn-sm" id="rollback_' + v.version + '">Restore</button>'
                : '<span style="font-size:12px;color:var(--txt2);">Current live</span>') +
            '</div>' +
          '</div>';
        }).join('');

        mount.innerHTML =
          '<div class="section-card">' +
            '<h4>Version history</h4>' +
            '<div class="sc-sub" style="margin-bottom:12px;">Restore serves that version live and loads it into your draft.</div>' +
            rows +
          '</div>';

        // Wire rollback buttons directly after render
        versions.forEach(function (v) {
          var btn = document.getElementById('rollback_' + v.version);
          if (btn) {
            btn.addEventListener('click', function () { rollback(v.version); });
          }
        });
      })
      .catch(function () {
        if (mount) {
          mount.innerHTML =
            '<div class="section-card"><h4>Version history</h4>' +
            '<div style="color:var(--txt2);font-size:13px;">Could not load versions.</div></div>';
        }
      });
  }

  // ---------------------------------------------------------------------------
  // Patch main.js globals
  // ---------------------------------------------------------------------------

  function _patch() {
    window.publishSection = function (section) { publish(section); };
    window.discardDraft   = function () { discard(); };
  }

  // ---------------------------------------------------------------------------
  // Toast
  // ---------------------------------------------------------------------------

  function _toast(msg, type) {
    if (window.showToast) { window.showToast(msg, type); return; }
    console.log('[' + type + ']', msg);
  }

  // ---------------------------------------------------------------------------
  // Boot
  // ---------------------------------------------------------------------------

  document.addEventListener('DOMContentLoaded', function () {
    _patch();

    // Fetch media config so CS.mediaUrl() works
    fetch(API + '/media-url')
      .then(function (r) { return r.json(); })
      .then(function (data) { _media = data; })
      .catch(function (e) { console.warn('CS: could not load media config —', e.message); });

    // Fetch the draft — main boot sequence
    _req('GET', '/draft')
      .then(function (data) {
        _draft = data;
        if (window.render) window.render();
        if (data.restoredFrom) {
          _toast('Draft restored from ' + data.restoredFrom + ' \u2014 publish when ready.', 'info');
        }
      })
      .catch(function (e) {
        if (e.message && e.message.includes('404')) {
          _toast('No draft yet \u2014 save content to create one.', 'info');
        } else {
          console.warn('CS: could not load draft \u2014', e.message);
          _toast('API unreachable \u2014 running on local data.', 'info');
        }
      });
  });

  // ---------------------------------------------------------------------------
  // Public surface — window.CS
  // ---------------------------------------------------------------------------

  window.CS = {
    get:          get,
    update:       update,
    addItem:      addItem,
    removeItem:   removeItem,
    moveItem:     moveItem,
    mediaUrl:     mediaUrl,
    publish:      publish,
    discard:      discard,
    rollback:     rollback,
    appendFooter: appendFooter,
  };

}(window));