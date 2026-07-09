/**
 * content-panels.js
 * ---------------------------------------------------------------------------
 * Content panel render functions. Reads directly from CS.get() — the raw
 * page.json. No translation layer.
 *
 * Each panel:
 *   - renders from CS.get()
 *   - writes field edits via CS.update('dot.path', value)
 *   - calls CS.appendFooter() at the end to add save label + version card
 *
 * Drawers use window.saveDrawer() which routes to _drawerSave.
 * ---------------------------------------------------------------------------
 */

(function (window) {
  "use strict";

  // -------------------------------------------------------------------------
  // Shared helpers
  // -------------------------------------------------------------------------

  // Escape HTML special characters
  function e(s) {
    if (s == null) return "";
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // Render the main panel header (matches main.js header() shape)
  function header(title, desc, actions) {
    return (
      '<div class="main-header">' +
      '<div class="main-header-left"><h2>' +
      title +
      "</h2><p>" +
      desc +
      "</p></div>" +
      '<div class="main-header-actions">' +
      (actions || "") +
      "</div>" +
      "</div>"
    );
  }

  // Publish + Discard buttons — always visible so editor can publish any time
  function toolbar(section) {
    return (
      '<button class="btn btn-ghost btn-sm" onclick="CS.discard()">Discard</button>' +
      '<button class="btn btn-publish" onclick="CS.publish(\'' +
      section +
      "')\">\u2191 Publish</button>"
    );
  }

  // A section card
  function card(title, sub, body) {
    return (
      '<div class="section-card">' +
      "<h4>" +
      title +
      "</h4>" +
      (sub ? '<div class="sc-sub">' + sub + "</div>" : "") +
      body +
      "</div>"
    );
  }

  // A text input wired to CS.update
  function input(path, value, placeholder) {
    return (
      '<input value="' +
      e(value) +
      '" ' +
      (placeholder ? 'placeholder="' + e(placeholder) + '" ' : "") +
      "oninput=\"CS.update('" +
      path +
      "', this.value)\">"
    );
  }

  // A textarea wired to CS.update
  function textarea(path, value, rows) {
    return (
      '<textarea rows="' +
      (rows || 4) +
      '" ' +
      "oninput=\"CS.update('" +
      path +
      "', this.value)\">" +
      e(value) +
      "</textarea>"
    );
  }

  // A form field with label
  function field(label, inputHtml, hint) {
    return (
      '<div class="field"><label>' +
      label +
      "</label>" +
      inputHtml +
      (hint ? '<div class="field-hint">' + hint + "</div>" : "") +
      "</div>"
    );
  }

  // A list row (drag handle, title, sub, actions)
  function listRow(title, sub, actions) {
    return (
      '<div class="list-item">' +
      '<span class="li-drag">\u2807</span>' +
      '<div class="li-body">' +
      '<div class="li-title">' +
      title +
      "</div>" +
      (sub ? '<div class="li-sub">' + sub + "</div>" : "") +
      "</div>" +
      '<div class="li-actions">' +
      actions +
      "</div>" +
      "</div>"
    );
  }

  // No data fallback
  function noData() {
    document.getElementById("mainArea").innerHTML =
      '<div class="access-denied"><div class="ad-icon">\u23F3</div>' +
      "<h3>Loading\u2026</h3><p>Waiting for draft data from the API.</p></div>";
  }

  // Image picker — dropdown select populated from mediaItems
  function imagePicker(csPath, current, previewId) {
    return (
      '<div class="field" style="grid-column:span 2;">' +
      "<label>Image</label>" +
      '<div style="display:flex;gap:8px;align-items:center;margin-bottom:6px;">' +
      '<span id="' +
      previewId +
      '_path" style="font-size:12px;color:var(--txt2);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' +
      e(current || "No image selected") +
      "</span>" +
      '<button class="btn btn-ghost btn-sm" type="button" id="btn_' +
      previewId +
      '" data-cspath="' +
      csPath +
      '" data-preview="' +
      previewId +
      '" data-mediatype="image">Choose \u2026</button>' +
      "</div>" +
      (current
        ? '<img id="' +
          previewId +
          '" src="' +
          CS.mediaUrl(current) +
          '" style="width:100%;max-height:140px;object-fit:cover;border-radius:8px;" onerror="this.style.display=\'none\'">'
        : '<div id="' +
          previewId +
          '" style="width:100%;height:80px;border:1px dashed var(--border);border-radius:8px;display:flex;align-items:center;justify-content:center;color:var(--txt2);font-size:12px;">No image</div>') +
      "</div>"
    );
  }

  function videoPicker(csPath, current, previewId) {
    return (
      '<div class="field">' +
      "<label>Video</label>" +
      '<div style="display:flex;gap:8px;align-items:center;">' +
      '<span id="' +
      previewId +
      '_path" style="font-size:12px;color:var(--txt2);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' +
      e(current || "No video selected") +
      "</span>" +
      '<button class="btn btn-ghost btn-sm" type="button" id="btn_' +
      previewId +
      '" data-cspath="' +
      csPath +
      '" data-preview="' +
      previewId +
      '" data-mediatype="video">Choose \u2026</button>' +
      "</div>" +
      "</div>"
    );
  }

  function _wirePickers() {
    document.querySelectorAll("[data-cspath]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var csPath = btn.dataset.cspath;
        var previewId = btn.dataset.preview;
        var mediaType = btn.dataset.mediatype;

        openMediaPicker(mediaType, function (url, name) {
          var path = name.startsWith("media/") ? name : "media/" + name;
          CS.update(csPath, path);
          var lbl = document.getElementById(previewId + "_path");
          var img = document.getElementById(previewId);
          if (lbl) lbl.textContent = path;
          if (img && mediaType === "image") {
            img.src = CS.mediaUrl(path);
            img.style.display = "";
          }
        });
      });
    });
  }

  window._wirePickers = _wirePickers;

  // Delegated listener — handles pick-image / pick-video buttons
  // Covers both drawer body (initiative drawers) and main area (panel-body pickers like REA Story)
  document.addEventListener("DOMContentLoaded", function () {
    function handlePicker(ev, container) {
      var el = ev.target;
      while (el && el !== container) {
        if (el.dataset && el.dataset.action) break;
        el = el.parentNode;
      }
      if (!el || !el.dataset || !el.dataset.action) return;

      var action = el.dataset.action;
      var csPath = el.dataset.path;
      var preview = el.dataset.preview;

      if (action === "pick-image") {
        openMediaPicker("image", function (url, name) {
          var path = name.startsWith("media/") ? name : "media/" + name;
          CS.update(csPath, path);
          var img = document.getElementById(preview);
          var lbl = document.getElementById(preview + "_path");
          if (lbl) lbl.textContent = path;
          if (img) {
            img.src = CS.mediaUrl(path);
            img.style.display = "";
          }
        });
      }

      if (action === "pick-video") {
        openMediaPicker("video", function (url, name) {
          var path = name.startsWith("media/") ? name : "media/" + name;
          CS.update(csPath, path);
          var lbl = document.getElementById(preview + "_path");
          if (lbl) lbl.textContent = path;
        });
      }
    }

    var drawerBody = document.getElementById("drawerBody");
    if (drawerBody)
      drawerBody.addEventListener("click", function (ev) {
        handlePicker(ev, drawerBody);
      });

    var mainArea = document.getElementById("mainArea");
    if (mainArea)
      mainArea.addEventListener("click", function (ev) {
        handlePicker(ev, mainArea);
      });
  });

  // saveDrawer — handles both content panel drawers and stream record drawers
  window.saveDrawer = function () {
    if (window._editingType === "stream") {
      if (window._saveStreamRecord) window._saveStreamRecord();
      return;
    }
    if (_drawerSave) _drawerSave();
    else closeDrawer();
  };

  var _drawerSave = null;

  // -------------------------------------------------------------------------
  // LANDING PAGE
  //
  // page.json keys used:
  //   landing.marquee[].value, .label, .highlight
  //   landing.hero.eyebrow, .headingLine1
  //   landing.featuredInitiative.refId
  //   landing.videoSlides.refIds[]
  //   landing.storyhub.refIds[]
  // -------------------------------------------------------------------------

  window.renderLanding = function () {
    var d = CS.get();
    if (!d) {
      noData();
      return;
    }

    var l = d.landing || {};
    var marquee = l.marquee || [];
    var hero = l.hero || {};
    var featRef = (l.featuredInitiative && l.featuredInitiative.refId) || "";
    var videoRefs = (l.videoSlides && l.videoSlides.refIds) || [];

    // Featured initiative dropdown — built from topInitiatives items
    var initItems =
      (d.innovation &&
        d.innovation.topInitiatives &&
        d.innovation.topInitiatives.items) ||
      [];
    var initOpts = initItems
      .map(function (it) {
        return (
          '<option value="' +
          e(it.id) +
          '"' +
          (it.id === featRef ? " selected" : "") +
          ">" +
          e(it.title) +
          "</option>"
        );
      })
      .join("");

    // Marquee rows
    var marqueeRows = marquee
      .map(function (m, i) {
        return listRow(
          "<strong>" +
            e(m.value) +
            '</strong> &nbsp;<span style="color:var(--txt2)">' +
            e(m.label) +
            "</span>" +
            (m.highlight
              ? ' &nbsp;<span class="pill pill-deployed" style="font-size:10px;">Highlight</span>'
              : ""),
          null,
          '<button class="btn btn-ghost btn-sm" onclick="_landingMarqueeEdit(' +
            i +
            ')">Edit</button>' +
            '<button class="btn btn-ghost btn-sm btn-icon" onclick="CS.removeItem(\'landing.marquee\',' +
            i +
            ');window.renderLanding()">&#x2715;</button>',
        );
      })
      .join("");

    // Video refId rows
    // Video refId rows
    var videoRows = videoRefs
      .map(function (id, i) {
        // Find the matching video title for display
        var allVideos =
          (d.innovation && d.innovation.videos && d.innovation.videos.items) ||
          [];
        var match = allVideos.find(function (v) {
          return v.id === id;
        });
        var label = match ? match.title + " (" + id + ")" : id;
        return listRow(
          e(label),
          null,
          '<button class="btn btn-ghost btn-sm btn-icon" onclick="CS.removeItem(\'landing.videoSlides.refIds\',' +
            i +
            ');window.renderLanding()">&#x2715;</button>',
        );
      })
      .join("");

    document.getElementById("mainArea").innerHTML =
      header(
        "Landing page",
        "Marquee stats, hero text, featured initiative, video shelf.",
        toolbar("landing"),
      ) +
      '<div class="panel-body">' +
      card(
        "Marquee stats",
        "The four rolling numbers at the top of the page.",
        marqueeRows +
          '<button class="add-btn" onclick="_landingMarqueeEdit(-1)">+ Add stat</button>',
      ) +
      card(
        "Hero text",
        "landing.hero",
        '<div class="form-grid" style="grid-template-columns:1fr 1fr;gap:14px;">' +
          field("Eyebrow", input("landing.hero.eyebrow", hero.eyebrow)) +
          field(
            "Heading line",
            input("landing.hero.headingLine1", hero.headingLine1),
          ) +
          "</div>",
      ) +
      card(
        "Featured initiative",
        "landing.featuredInitiative.refId",
        field(
          "Initiative",
          "<select onchange=\"CS.update('landing.featuredInitiative.refId', this.value)\">" +
            initOpts +
            "</select>",
          "Editorially chosen \u2014 not date-driven.",
        ),
      ) +
      card(
        "Video shelf",
        "landing.videoSlides.refIds",
        videoRows +
          '<button class="add-btn" onclick="_landingPickVideo()">+ Add video</button>',
      ) +
      +"</div>";

    CS.appendFooter();

    _wirePickers();
  };

  // Marquee drawer
  window._landingMarqueeEdit = function (idx) {
    var d = CS.get();
    var arr = (d.landing && d.landing.marquee) || [];
    var isNew = idx < 0;
    var m = isNew ? { value: "", label: "", highlight: false } : arr[idx];

    document.getElementById("drawerTitle").textContent = isNew
      ? "Add stat"
      : "Edit stat";
    document.getElementById("drawerSub").textContent = isNew
      ? "New marquee stat"
      : m.value;
    document.getElementById("drawerDelete").style.display = isNew ? "none" : "";
    document.getElementById("drawerDelete").onclick = function () {
      CS.removeItem("landing.marquee", idx);
      closeDrawer();
      window.renderLanding();
    };
    document.getElementById("drawerBody").innerHTML =
      '<div class="form-grid" style="grid-template-columns:1fr 1fr;gap:14px;">' +
      field(
        "Value (e.g. 200,000+)",
        '<input id="mq_val" value="' + e(m.value) + '">',
      ) +
      field("Label", '<input id="mq_lbl" value="' + e(m.label) + '">') +
      field(
        "Highlight?",
        '<select id="mq_hl">' +
          '<option value="false"' +
          (!m.highlight ? " selected" : "") +
          ">No</option>" +
          '<option value="true"' +
          (m.highlight ? " selected" : "") +
          ">Yes</option>" +
          "</select>",
      ) +
      "</div>";

    document.getElementById("drawerOverlay").className = "drawer-overlay open";

    _drawerSave = function () {
      var updated = {
        value: document.getElementById("mq_val").value,
        label: document.getElementById("mq_lbl").value,
        highlight: document.getElementById("mq_hl").value === "true",
      };
      if (isNew) {
        CS.addItem("landing.marquee", updated);
      } else {
        CS.update("landing.marquee." + idx + ".value", updated.value);
        CS.update("landing.marquee." + idx + ".label", updated.label);
        CS.update("landing.marquee." + idx + ".highlight", updated.highlight);
      }
      closeDrawer();
      window.renderLanding();
    };
  };

window._landingPickVideo = function () {
  var d         = CS.get();
  var allVideos = (d.innovation && d.innovation.videos && d.innovation.videos.items) || [];
  var existing  = (d.landing && d.landing.videoSlides && d.landing.videoSlides.refIds) || [];

  if (!allVideos.length) {
    showToast('No videos found — add videos in Innovation Portfolio first.', 'info');
    return;
  }

  // Filter out already-added videos
  var available = allVideos.filter(function (v) {
    return existing.indexOf(v.id) === -1;
  });

  if (!available.length) {
    showToast('All videos are already in the shelf.', 'info');
    return;
  }

  // Build a simple modal dropdown
  var existing = document.getElementById('videoPickerModal');
  if (existing) existing.remove();

  var modal = document.createElement('div');
  modal.id  = 'videoPickerModal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;';
  modal.innerHTML =
    '<div style="background:#fff;border-radius:12px;width:460px;max-height:60vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.3);">' +
      '<div style="padding:16px 20px;border-bottom:1px solid var(--border);font-size:15px;font-weight:bold;">Add video to shelf</div>' +
      '<div style="flex:1;overflow-y:auto;">' +
        available.map(function (v, i) {
          return '<div id="vpick_' + i + '" style="padding:12px 20px;border-bottom:1px solid var(--border);cursor:pointer;display:flex;align-items:center;gap:12px;">' +
            '<span style="font-size:18px;">🎬</span>' +
            '<div style="flex:1;">' +
              '<div style="font-size:13px;font-weight:500;">' + e(v.title) + '</div>' +
              '<div style="font-size:11px;color:var(--txt2);">' + e(v.id) + ' · ' + e(v.tag) + '</div>' +
            '</div>' +
            '<span style="font-size:12px;color:var(--med);">Add</span>' +
          '</div>';
        }).join('') +
      '</div>' +
      '<div style="padding:12px 20px;border-top:1px solid var(--border);text-align:right;">' +
        '<button class="btn btn-ghost btn-sm" id="vpick_cancel">Cancel</button>' +
      '</div>' +
    '</div>';

  document.body.appendChild(modal);

  // Wire cancel
  document.getElementById('vpick_cancel').addEventListener('click', function () {
    modal.remove();
  });
  modal.addEventListener('click', function (e) {
    if (e.target === modal) modal.remove();
  });

  // Wire each video item
  available.forEach(function (v, i) {
    var el = document.getElementById('vpick_' + i);
    if (!el) return;
    el.addEventListener('mouseover', function () { this.style.background = '#f5f4f0'; });
    el.addEventListener('mouseout',  function () { this.style.background = ''; });
    el.addEventListener('click', function () {
      CS.addItem('landing.videoSlides.refIds', v.id);
      modal.remove();
      window.renderLanding();
    });
  });
};

  // -------------------------------------------------------------------------
  // REA STORY
  //
  // page.json keys used:
  //   reaStory.teaser.sectionLabel, .headline, .href
  //   reaStory.rea.tag, .heading, .body, .video
  //   reaStory.bpm.tag, .heading, .body, .image
  // -------------------------------------------------------------------------

  window.renderREAStory = function () {
    var d = CS.get();
    if (!d) {
      noData();
      return;
    }

    var rs = d.reaStory || {};
    var teaser = rs.teaser || {};
    var rea = rs.rea || {};
    var bpm = rs.bpm || {};

    document.getElementById("mainArea").innerHTML =
      header(
        "REA Story",
        "The two scroll panels — what REA is, and who drives it.",
        toolbar("reastory"),
      ) +
      '<div class="panel-body">' +
      card(
        "Teaser card",
        "The storyhub card that links visitors to this section.",
        '<div class="form-grid" style="grid-template-columns:1fr 1fr;gap:14px;">' +
          field(
            "Section label",
            input("reaStory.teaser.sectionLabel", teaser.sectionLabel),
          ) +
          field(
            "Headline",
            input("reaStory.teaser.headline", teaser.headline),
          ) +
          field("Link href", input("reaStory.teaser.href", teaser.href)) +
          "</div>",
      ) +
      card(
        "Panel 1 — What REA is",
        "reaStory.rea",
        '<div class="form-grid" style="grid-template-columns:1fr 1fr;gap:14px;">' +
          field("Tag", input("reaStory.rea.tag", rea.tag)) +
          field("Heading", input("reaStory.rea.heading", rea.heading)) +
          '<div class="field" style="grid-column:span 2"><label>Body copy</label>' +
          textarea("reaStory.rea.body", rea.body, 6) +
          "</div>" +
          '<div class="field" style="grid-column:span 2"><label>Video</label>' +
          '<div style="display:flex;gap:8px;align-items:center;">' +
          '<span id="prev_reavid_path" style="font-size:12px;color:var(--txt2);flex:1;">' +
          e(rea.video || "No video selected") +
          "</span>" +
          '<button class="btn btn-ghost btn-sm" type="button" id="btn_reavid">Choose \u2026</button>' +
          "</div>" +
          "</div>" +
          "</div>",
      ) +
      card(
        "Panel 2 — Who drives it (BPM)",
        "reaStory.bpm",
        '<div class="form-grid" style="grid-template-columns:1fr 1fr;gap:14px;">' +
          field("Tag", input("reaStory.bpm.tag", bpm.tag)) +
          field("Heading", input("reaStory.bpm.heading", bpm.heading)) +
          '<div class="field" style="grid-column:span 2"><label>Body copy</label>' +
          textarea("reaStory.bpm.body", bpm.body, 5) +
          "</div>" +
          '<div class="field" style="grid-column:span 2"><label>Image</label>' +
          '<div style="display:flex;gap:8px;align-items:center;margin-bottom:6px;">' +
          '<span id="prev_bpm_path" style="font-size:12px;color:var(--txt2);flex:1;">' +
          e(bpm.image || "No image selected") +
          "</span>" +
          '<button class="btn btn-ghost btn-sm" type="button" id="btn_bpm">Choose \u2026</button>' +
          "</div>" +
          (bpm.image
            ? '<img id="prev_bpm" src="' +
              CS.mediaUrl(bpm.image) +
              '" style="width:100%;max-height:140px;object-fit:cover;border-radius:8px;" onerror="this.style.display=\'none\'">'
            : '<div id="prev_bpm" style="width:100%;height:80px;border:1px dashed var(--border);border-radius:8px;display:flex;align-items:center;justify-content:center;color:var(--txt2);font-size:12px;">No image</div>') +
          "</div>" +
          "</div>",
      ) +
      "</div>";

    CS.appendFooter();

    // Wire buttons directly after render — no delegation needed
    var btnBpm = document.getElementById("btn_bpm");
    if (btnBpm) {
      btnBpm.addEventListener("click", function () {
        openMediaPicker("image", function (url, name) {
          var path = name.startsWith("media/") ? name : "media/" + name;
          CS.update("reaStory.bpm.image", path);
          var lbl = document.getElementById("prev_bpm_path");
          var img = document.getElementById("prev_bpm");
          if (lbl) lbl.textContent = path;
          if (img) {
            img.src = CS.mediaUrl(path);
            img.style.display = "";
          }
        });
      });
    }

    var btnVid = document.getElementById("btn_reavid");
    if (btnVid) {
      btnVid.addEventListener("click", function () {
        openMediaPicker("video", function (url, name) {
          var path = name.startsWith("media/") ? name : "media/" + name;
          CS.update("reaStory.rea.video", path);
          var lbl = document.getElementById("prev_reavid_path");
          if (lbl) lbl.textContent = path;
        });
      });
    }
  };

  // -------------------------------------------------------------------------
  // INNOVATION PORTFOLIO
  //
  // page.json keys used:
  //   innovation.teaser.sectionLabel, .headline, .href
  //   innovation.sectionSub
  //   innovation.topInitiatives.rowLabel, .rowTitle, .rowNote, .items[]
  //     item: id, rank, title, image, body, description, ctaLabel, ctaHref,
  //           stream, businessArea, stats[], story{}, media[]
  //   innovation.deployed.items[]
  //   innovation.comingSoon.rowTitle, .items[]
  //   innovation.videos.rowTitle, .items[]
  // -------------------------------------------------------------------------

  window.renderPortfolio = function () {
    var d = CS.get();
    if (!d) {
      noData();
      return;
    }

    var iv = d.innovation || {};
    var teaser = iv.teaser || {};
    var topInit = iv.topInitiatives || {};
    var items = topInit.items || [];
    var deployed = (iv.deployed && iv.deployed.items) || [];
    var coming = (iv.comingSoon && iv.comingSoon.items) || [];
    var videos = (iv.videos && iv.videos.items) || [];

    // Top initiatives ranked list
    var topRows = items
      .map(function (item, i) {
        return listRow(
          '<span style="font-size:18px;font-weight:bold;color:var(--txt2);opacity:.25;margin-right:8px;">' +
            (i + 1) +
            "</span>" +
            e(item.title),
          e(item.id) +
            (item.stream ? " \u00b7 " + e(item.stream) : "") +
            (item.businessArea ? " \u00b7 " + e(item.businessArea) : ""),
          '<button class="btn btn-ghost btn-sm btn-icon" onclick="CS.moveItem(\'innovation.topInitiatives.items\',' +
            i +
            ',-1);window.renderPortfolio()">\u2191</button>' +
            '<button class="btn btn-ghost btn-sm btn-icon" onclick="CS.moveItem(\'innovation.topInitiatives.items\',' +
            i +
            ',1);window.renderPortfolio()">\u2193</button>' +
            '<button class="btn btn-ghost btn-sm" onclick="_portfolioInitiativeDrawer(' +
            i +
            ')">Edit</button>',
        );
      })
      .join("");

    // Deployed list
    var deployedRows = deployed
      .map(function (item, i) {
        return listRow(
          e(item.title),
          e((item.description || "").substring(0, 80)) +
            (item.description && item.description.length > 80 ? "\u2026" : ""),
          '<button class="btn btn-ghost btn-sm" onclick="_portfolioDeployedDrawer(' +
            i +
            ')">Edit</button>' +
            '<button class="btn btn-ghost btn-sm btn-icon" onclick="CS.removeItem(\'innovation.deployed.items\',' +
            i +
            ');window.renderPortfolio()">&#x2715;</button>',
        );
      })
      .join("");
    var comingRows = coming
      .map(function (item, i) {
        return listRow(
          e(item.title),
          e((item.body || "").substring(0, 80)) +
            (item.body && item.body.length > 80 ? "\u2026" : ""),
          '<button class="btn btn-ghost btn-sm" onclick="_portfolioComingSoonDrawer(' +
            i +
            ')">Edit</button>' +
            '<button class="btn btn-ghost btn-sm btn-icon" onclick="CS.removeItem(\'innovation.comingSoon.items\',' +
            i +
            ');window.renderPortfolio()">&#x2715;</button>',
        );
      })
      .join("");

    // Videos list
    var videoRows = videos
      .map(function (v, i) {
        return listRow(
          e(v.title),
          e(v.tag) + " \u00b7 " + e(v.id),
          '<button class="btn btn-ghost btn-sm" onclick="_portfolioVideoDrawer(' +
            i +
            ')">Edit</button>' +
            '<button class="btn btn-ghost btn-sm btn-icon" onclick="CS.removeItem(\'innovation.videos.items\',' +
            i +
            ');window.renderPortfolio()">&#x2715;</button>',
        );
      })
      .join("");

    document.getElementById("mainArea").innerHTML =
      header(
        "Innovation Portfolio",
        "Top initiatives, coming soon, and video highlights.",
        toolbar("portfolio"),
      ) +
      '<div class="panel-body">' +
      card(
        "Section copy",
        "innovation.teaser + sectionSub",
        '<div class="form-grid" style="grid-template-columns:1fr 1fr;gap:14px;">' +
          field(
            "Teaser headline",
            input("innovation.teaser.headline", teaser.headline),
          ) +
          field(
            "Section subtitle",
            input("innovation.sectionSub", iv.sectionSub),
          ) +
          field(
            "Section label",
            input("innovation.teaser.sectionLabel", teaser.sectionLabel),
          ) +
          field("Link href", input("innovation.teaser.href", teaser.href)) +
          "</div>",
      ) +
      card(
        "Top initiatives",
        "Reorder with arrows. Edit opens the full story, stats, and media fields.",
        topRows,
      ) +
      card(
        "Deployed initiatives",
        "innovation.deployed.items",
        deployedRows +
          '<button class="add-btn" onclick="_portfolioDeployedDrawer(-1)">+ Add item</button>',
      ) +
      card(
        "Coming soon",
        "innovation.comingSoon.items",
        comingRows +
          '<button class="add-btn" onclick="_portfolioComingSoonDrawer(-1)">+ Add item</button>',
      ) +
      card(
        "Video highlights",
        "innovation.videos.items",
        videoRows +
          '<button class="add-btn" onclick="_portfolioVideoDrawer(-1)">+ Add video</button>',
      ) +
      "</div>";

    CS.appendFooter();
  };

  // Initiative drawer — full schema including story, stats, media
  window._portfolioInitiativeDrawer = function (idx) {
    var d = CS.get();
    var item = (d.innovation.topInitiatives.items || [])[idx];
    if (!item) return;
    var base = "innovation.topInitiatives.items." + idx;
    var story = item.story || {};
    var stats = item.stats || [];

    document.getElementById("drawerTitle").textContent = "Edit — " + item.title;
    document.getElementById("drawerSub").textContent = item.id;
    document.getElementById("drawerDelete").style.display = "none";
    document.getElementById("drawerBody").innerHTML =
      '<div class="form-grid" style="grid-template-columns:1fr 1fr;gap:12px;">' +
      field("Title", input(base + ".title", item.title)) +
      field("Stream", input(base + ".stream", item.stream)) +
      field("Business area", input(base + ".businessArea", item.businessArea)) +
      imagePicker(base + ".image", item.image, "prev_init") +
      field("CTA label", input(base + ".ctaLabel", item.ctaLabel)) +
      field("CTA href", input(base + ".ctaHref", item.ctaHref)) +
      '<div class="field" style="grid-column:span 2"><label>Teaser body</label>' +
      textarea(base + ".body", item.body, 3) +
      "</div>" +
      '<div class="field" style="grid-column:span 2"><label>Full description</label>' +
      textarea(base + ".description", item.description, 4) +
      "</div>" +
      '<div class="field" style="grid-column:span 2"><label>Stats</label>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">' +
      stats
        .map(function (s, si) {
          return (
            '<div style="display:flex;gap:6px;">' +
            '<input placeholder="Value" value="' +
            e(s.value) +
            '" oninput="CS.update(\'' +
            base +
            ".stats." +
            si +
            '.value\',this.value)" style="flex:1">' +
            '<input placeholder="Label" value="' +
            e(s.label) +
            '" oninput="CS.update(\'' +
            base +
            ".stats." +
            si +
            '.label\',this.value)" style="flex:1">' +
            "</div>"
          );
        })
        .join("") +
      "</div></div>" +
      '<div class="field" style="grid-column:span 2"><label>Story — eyebrow</label>' +
      input(base + ".story.eyebrow", story.eyebrow) +
      "</div>" +
      '<div class="field" style="grid-column:span 2"><label>Story — heading</label>' +
      input(base + ".story.heading", story.heading) +
      "</div>" +
      '<div class="field" style="grid-column:span 2"><label>Story — body</label>' +
      textarea(base + ".story.body", story.body, 6) +
      "</div>" +
      field(
        "Story — closing line",
        input(
          base + ".story.closing.line",
          story.closing && story.closing.line,
        ),
      ) +
      '<div class="field" style="grid-column:span 2"><label>Story — closing body</label>' +
      textarea(
        base + ".story.closing.body",
        story.closing && story.closing.body,
        3,
      ) +
      "</div>" +
      "</div>";

    document.getElementById("drawerOverlay").className = "drawer-overlay open";
    _wirePickers();
    _drawerSave = function () {
      closeDrawer();
      window.renderPortfolio();
    };
  };

  // Deployed drawer
  window._portfolioDeployedDrawer = function (idx) {
    var d = CS.get();
    var arr = (d.innovation.deployed && d.innovation.deployed.items) || [];
    var isNew = idx < 0;
    var item = isNew ? { title: "", description: "", image: "" } : arr[idx];
    var base = "innovation.deployed.items." + idx;

    document.getElementById("drawerTitle").textContent = isNew
      ? "Add deployed initiative"
      : "Edit — " + item.title;
    document.getElementById("drawerSub").textContent = isNew ? "" : item.title;
    document.getElementById("drawerDelete").style.display = isNew ? "none" : "";
    document.getElementById("drawerDelete").onclick = function () {
      CS.removeItem("innovation.deployed.items", idx);
      closeDrawer();
      window.renderPortfolio();
    };
    document.getElementById("drawerBody").innerHTML =
      '<div class="form-grid" style="grid-template-columns:1fr;gap:12px;">' +
      field("Title", '<input id="dep_t" value="' + e(item.title) + '">') +
      field(
        "Description",
        '<textarea id="dep_d" rows="4">' + e(item.description) + "</textarea>",
      ) +
      imagePicker(base + ".image", item.image, "prev_dep") +
      "</div>";

    document.getElementById("drawerOverlay").className = "drawer-overlay open";
    _drawerSave = function () {
      var updated = {
        title: document.getElementById("dep_t").value,
        description: document.getElementById("dep_d").value,
        image:
          CS.get() &&
          (function () {
            var a = (CS.get().innovation.deployed || {}).items || [];
            return (a[idx] && a[idx].image) || "";
          })(),
      };
      if (isNew) {
        CS.addItem("innovation.deployed.items", updated);
      } else {
        CS.update(base + ".title", updated.title);
        CS.update(base + ".description", updated.description);
        CS.update(base + ".image", updated.image);
      }
      closeDrawer();
      window.renderPortfolio();
    };
    _wirePickers();
  };

  // Coming soon drawer
  window._portfolioComingSoonDrawer = function (idx) {
    var d = CS.get();
    var arr = (d.innovation.comingSoon && d.innovation.comingSoon.items) || [];
    var isNew = idx < 0;
    var item = isNew ? { title: "", body: "", image: "" } : arr[idx];
    var base = "innovation.comingSoon.items." + idx;

    document.getElementById("drawerTitle").textContent = isNew
      ? "Add coming soon"
      : "Edit — " + item.title;
    document.getElementById("drawerSub").textContent = isNew ? "" : item.title;
    document.getElementById("drawerDelete").style.display = isNew ? "none" : "";
    document.getElementById("drawerDelete").onclick = function () {
      CS.removeItem("innovation.comingSoon.items", idx);
      closeDrawer();
      window.renderPortfolio();
    };
    document.getElementById("drawerBody").innerHTML =
      '<div class="form-grid" style="grid-template-columns:1fr;gap:12px;">' +
      field("Title", '<input id="cs_t" value="' + e(item.title) + '">') +
      field(
        "Body",
        '<textarea id="cs_b" rows="3">' + e(item.body) + "</textarea>",
      ) +
      imagePicker(base + ".image", item.image, "prev_cs") +
      "</div>";

    document.getElementById("drawerOverlay").className = "drawer-overlay open";
    _drawerSave = function () {
      var updated = {
        title: document.getElementById("cs_t").value,
        body: document.getElementById("cs_b").value,
        image:
          CS.get() &&
          (function () {
            var a = (CS.get().innovation.comingSoon || {}).items || [];
            return isNew ? "" : (a[idx] && a[idx].image) || "";
          })(),
        description: "",
      };
      if (isNew) {
        CS.addItem("innovation.comingSoon.items", updated);
      } else {
        CS.update(base + ".title", updated.title);
        CS.update(base + ".body", updated.body);
      }
      closeDrawer();
      window.renderPortfolio();
    };
    _wirePickers();
  };

  // Video drawer
  window._portfolioVideoDrawer = function (idx) {
    var d = CS.get();
    var arr = (d.innovation.videos && d.innovation.videos.items) || [];
    var isNew = idx < 0;
    var v = isNew
      ? { id: "", tag: "", title: "", thumbnail: "", poster: "", src: "" }
      : arr[idx];
    var base = "innovation.videos.items." + idx;

    document.getElementById("drawerTitle").textContent = isNew
      ? "Add video"
      : "Edit — " + v.title;
    document.getElementById("drawerSub").textContent = isNew ? "" : v.id;
    document.getElementById("drawerDelete").style.display = isNew ? "none" : "";
    document.getElementById("drawerDelete").onclick = function () {
      CS.removeItem("innovation.videos.items", idx);
      closeDrawer();
      window.renderPortfolio();
    };
    document.getElementById("drawerBody").innerHTML =
      '<div class="form-grid" style="grid-template-columns:1fr 1fr;gap:12px;">' +
      field("ID", '<input id="v_id"  value="' + e(v.id) + '">') +
      field("Tag / duration", '<input id="v_tag" value="' + e(v.tag) + '">') +
      '<div class="field" style="grid-column:span 2">' +
      field("Title", '<input id="v_title" value="' + e(v.title) + '">') +
      "</div>" +
      imagePicker(base + ".thumbnail", v.thumbnail, "prev_vthumb") +
      imagePicker(base + ".poster", v.poster, "prev_vposter") +
      videoPicker(base + ".src", v.src, "prev_vsrc") +
      "</div>";

    document.getElementById("drawerOverlay").className = "drawer-overlay open";
    _drawerSave = function () {
      var d = CS.get();
      var arr2 = (d.innovation.videos && d.innovation.videos.items) || [];
      var cur = !isNew && arr2[idx] ? arr2[idx] : {};
      var nv = {
        id: document.getElementById("v_id").value,
        tag: document.getElementById("v_tag").value,
        title: document.getElementById("v_title").value,
        thumbnail: cur.thumbnail || "",
        poster: cur.poster || "",
        src: cur.src || "",
        featured: true,
      };
      if (isNew) {
        CS.addItem("innovation.videos.items", nv);
      } else {
        ["id", "tag", "title", "thumbnail", "poster", "src"].forEach(
          function (k) {
            CS.update(base + "." + k, nv[k]);
          },
        );
      }
      closeDrawer();
      window.renderPortfolio();
    };
  };

  // -------------------------------------------------------------------------
  // SPOTLIGHT
  //
  // page.json keys used:
  //   spotlight.teaser.sectionLabel, .headline, .href
  //   spotlight.testimonials.actLabel, .actTitle, .actDesc, .items[]
  //     item: quote, name, role
  //   spotlight.people.actLabel, .actTitle, .actDesc, .items[]
  //     item: name, contribution, tag
  // -------------------------------------------------------------------------

  window.renderSpotlight = function () {
    var d = CS.get();
    if (!d) {
      noData();
      return;
    }

    var sp = d.spotlight || {};
    var teaser = sp.teaser || {};
    var tObj = sp.testimonials || {};
    var pObj = sp.people || {};
    var tItems = tObj.items || [];
    var pItems = pObj.items || [];

    var testimonialRows = tItems
      .map(function (t, i) {
        return listRow(
          "\u201c" +
            e(t.quote.substring(0, 70)) +
            (t.quote.length > 70 ? "\u2026" : "") +
            "\u201d",
          e(t.name) + " \u00b7 " + e(t.role),
          '<button class="btn btn-ghost btn-sm btn-icon" onclick="_spotlightTestimonialDrawer(' +
            i +
            ')">&#x270E;</button>' +
            '<button class="btn btn-ghost btn-sm btn-icon" onclick="CS.removeItem(\'spotlight.testimonials.items\',' +
            i +
            ');window.renderSpotlight()">&#x2715;</button>',
        );
      })
      .join("");

    var peopleRows = pItems
      .map(function (p, i) {
        return listRow(
          e(p.name),
          e(p.contribution) +
            ' \u00b7 <span class="pill pill-deployed" style="font-size:10px;">' +
            e(p.tag) +
            "</span>",
          '<button class="btn btn-ghost btn-sm btn-icon" onclick="_spotlightPersonDrawer(' +
            i +
            ')">&#x270E;</button>' +
            '<button class="btn btn-ghost btn-sm btn-icon" onclick="CS.removeItem(\'spotlight.people.items\',' +
            i +
            ');window.renderSpotlight()">&#x2715;</button>',
        );
      })
      .join("");

    document.getElementById("mainArea").innerHTML =
      header(
        "Spotlight",
        "Testimonials and the people driving REA.",
        toolbar("spotlight"),
      ) +
      '<div class="panel-body">' +
      card(
        "Teaser card",
        null,
        '<div class="form-grid" style="grid-template-columns:1fr 1fr;gap:14px;">' +
          field(
            "Section label",
            input("spotlight.teaser.sectionLabel", teaser.sectionLabel),
          ) +
          field(
            "Headline",
            input("spotlight.teaser.headline", teaser.headline),
          ) +
          field("Link href", input("spotlight.teaser.href", teaser.href)) +
          "</div>",
      ) +
      card(
        e(tObj.actTitle || "Testimonials"),
        e(tObj.actDesc || ""),
        '<div class="form-grid" style="grid-template-columns:1fr 1fr;gap:14px;margin-bottom:12px;">' +
          field(
            "Act label",
            input("spotlight.testimonials.actLabel", tObj.actLabel),
          ) +
          field(
            "Act title",
            input("spotlight.testimonials.actTitle", tObj.actTitle),
          ) +
          '<div class="field" style="grid-column:span 2">' +
          field(
            "Act description",
            input("spotlight.testimonials.actDesc", tObj.actDesc),
          ) +
          "</div>" +
          "</div>" +
          testimonialRows +
          '<button class="add-btn" onclick="_spotlightTestimonialDrawer(-1)">+ Add testimonial</button>',
      ) +
      card(
        e(pObj.actTitle || "People"),
        e(pObj.actDesc || ""),
        '<div class="form-grid" style="grid-template-columns:1fr 1fr;gap:14px;margin-bottom:12px;">' +
          field(
            "Act label",
            input("spotlight.people.actLabel", pObj.actLabel),
          ) +
          field(
            "Act title",
            input("spotlight.people.actTitle", pObj.actTitle),
          ) +
          '<div class="field" style="grid-column:span 2">' +
          field(
            "Act description",
            input("spotlight.people.actDesc", pObj.actDesc),
          ) +
          "</div>" +
          "</div>" +
          peopleRows +
          '<button class="add-btn" onclick="_spotlightPersonDrawer(-1)">+ Add person</button>',
      ) +
      "</div>";

    CS.appendFooter();
  };

  // Testimonial drawer
  window._spotlightTestimonialDrawer = function (idx) {
    var d = CS.get();
    var arr =
      (d.spotlight.testimonials && d.spotlight.testimonials.items) || [];
    var isNew = idx < 0;
    var t = isNew ? { quote: "", name: "Process Owner", role: "" } : arr[idx];
    var base = "spotlight.testimonials.items." + idx;

    document.getElementById("drawerTitle").textContent = isNew
      ? "Add testimonial"
      : "Edit testimonial";
    document.getElementById("drawerSub").textContent = isNew
      ? ""
      : t.name + " \u00b7 " + t.role;
    document.getElementById("drawerDelete").style.display = isNew ? "none" : "";
    document.getElementById("drawerDelete").onclick = function () {
      CS.removeItem("spotlight.testimonials.items", idx);
      closeDrawer();
      window.renderSpotlight();
    };
    document.getElementById("drawerBody").innerHTML =
      '<div class="form-grid" style="grid-template-columns:1fr;gap:12px;">' +
      field(
        "Quote",
        '<textarea id="tq" rows="3">' + e(t.quote) + "</textarea>",
      ) +
      field("Name", '<input id="tn" value="' + e(t.name) + '">') +
      field("Role", '<input id="tr" value="' + e(t.role) + '">') +
      "</div>";

    document.getElementById("drawerOverlay").className = "drawer-overlay open";
    _drawerSave = function () {
      var updated = {
        quote: document.getElementById("tq").value,
        name: document.getElementById("tn").value,
        role: document.getElementById("tr").value,
      };
      if (isNew) {
        CS.addItem("spotlight.testimonials.items", updated);
      } else {
        CS.update(base + ".quote", updated.quote);
        CS.update(base + ".name", updated.name);
        CS.update(base + ".role", updated.role);
      }
      closeDrawer();
      window.renderSpotlight();
    };
  };

  // Person drawer
  window._spotlightPersonDrawer = function (idx) {
    var d = CS.get();
    var arr = (d.spotlight.people && d.spotlight.people.items) || [];
    var isNew = idx < 0;
    var p = isNew ? { name: "", contribution: "", tag: "Submitter" } : arr[idx];
    var base = "spotlight.people.items." + idx;
    var tags = ["Submitter", "Builder", "Champion", "Pilot"];

    document.getElementById("drawerTitle").textContent = isNew
      ? "Add person"
      : "Edit — " + p.name;
    document.getElementById("drawerSub").textContent = isNew ? "" : p.name;
    document.getElementById("drawerDelete").style.display = isNew ? "none" : "";
    document.getElementById("drawerDelete").onclick = function () {
      CS.removeItem("spotlight.people.items", idx);
      closeDrawer();
      window.renderSpotlight();
    };
    document.getElementById("drawerBody").innerHTML =
      '<div class="form-grid" style="grid-template-columns:1fr;gap:12px;">' +
      field("Name", '<input id="pn" value="' + e(p.name) + '">') +
      field(
        "Contribution",
        '<textarea id="pc" rows="2">' + e(p.contribution) + "</textarea>",
      ) +
      field(
        "Tag",
        '<select id="pt">' +
          tags
            .map(function (tg) {
              return (
                "<option" +
                (tg === p.tag ? " selected" : "") +
                ">" +
                tg +
                "</option>"
              );
            })
            .join("") +
          "</select>",
      ) +
      "</div>";

    document.getElementById("drawerOverlay").className = "drawer-overlay open";
    _drawerSave = function () {
      var updated = {
        name: document.getElementById("pn").value,
        contribution: document.getElementById("pc").value,
        tag: document.getElementById("pt").value,
      };
      if (isNew) {
        CS.addItem("spotlight.people.items", updated);
      } else {
        CS.update(base + ".name", updated.name);
        CS.update(base + ".contribution", updated.contribution);
        CS.update(base + ".tag", updated.tag);
      }
      closeDrawer();
      window.renderSpotlight();
    };
  };

  // -------------------------------------------------------------------------
  // WHAT'S NEW
  //
  // page.json keys used:
  //   whatsNew.teaser.sectionLabel, .headline, .href
  //   whatsNew.sectionSub
  //   whatsNew.editorsPick.heading, .body
  //   whatsNew.buzzItems[].id, .age, .isNew, .headline, .body, .benefits[]
  // -------------------------------------------------------------------------

  window.renderWhatsNew = function () {
    var d = CS.get();
    if (!d) {
      noData();
      return;
    }

    var wn = d.whatsNew || {};
    var teaser = wn.teaser || {};
    var pick = wn.editorsPick || {};
    var buzz = wn.buzzItems || [];

    var buzzRows = buzz
      .map(function (b, i) {
        var base = "whatsNew.buzzItems." + i;
        return (
          '<div class="section-card" style="margin-bottom:12px;">' +
          '<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">' +
          '<span class="pill ' +
          (b.isNew ? "pill-deployed" : "pill-uat") +
          '" style="font-size:10px;">' +
          e(b.age) +
          "</span>" +
          '<span style="font-size:11px;color:var(--txt2);">' +
          e(b.id) +
          "</span>" +
          '<label style="margin-left:auto;font-size:12px;display:flex;align-items:center;gap:4px;">' +
          '<input type="checkbox"' +
          (b.isNew ? " checked" : "") +
          " onchange=\"CS.update('" +
          base +
          ".isNew',this.checked)\"> New</label>" +
          '<button class="btn btn-danger btn-sm" onclick="CS.removeItem(\'whatsNew.buzzItems\',' +
          i +
          ');window.renderWhatsNew()">Remove</button>' +
          "</div>" +
          '<div class="form-grid" style="grid-template-columns:1fr 1fr;gap:10px;">' +
          field("Headline", input(base + ".headline", b.headline)) +
          field("Age label", input(base + ".age", b.age)) +
          '<div class="field" style="grid-column:span 2"><label>Body</label>' +
          textarea(base + ".body", b.body, 3) +
          "</div>" +
          '<div class="field" style="grid-column:span 2"><label>Benefits (one per line)</label>' +
          '<textarea rows="3" oninput="CS.update(\'' +
          base +
          ".benefits',this.value.split('\\n').filter(Boolean))\">" +
          e((b.benefits || []).join("\n")) +
          "</textarea>" +
          "</div>" +
          "</div>" +
          "</div>"
        );
      })
      .join("");

    document.getElementById("mainArea").innerHTML =
      header(
        "What's New",
        "Editor's pick and buzz feed cards.",
        toolbar("whatsnew"),
      ) +
      '<div class="panel-body">' +
      card(
        "Teaser card",
        null,
        '<div class="form-grid" style="grid-template-columns:1fr 1fr;gap:14px;">' +
          field(
            "Section label",
            input("whatsNew.teaser.sectionLabel", teaser.sectionLabel),
          ) +
          field(
            "Headline",
            input("whatsNew.teaser.headline", teaser.headline),
          ) +
          field("Section sub", input("whatsNew.sectionSub", wn.sectionSub)) +
          field("Link href", input("whatsNew.teaser.href", teaser.href)) +
          "</div>",
      ) +
      card(
        "Editor's pick",
        "whatsNew.editorsPick — the large spotlight card, editorially chosen.",
        '<div class="form-grid" style="grid-template-columns:1fr;gap:14px;">' +
          field(
            "Heading",
            input("whatsNew.editorsPick.heading", pick.heading),
          ) +
          field("Body", textarea("whatsNew.editorsPick.body", pick.body, 3)) +
          "</div>",
      ) +
      '<div class="section-card">' +
      '<h4>Buzz items <span style="font-size:11px;color:var(--txt2);font-weight:normal;">' +
      buzz.length +
      " of 5 slots</span></h4>" +
      '<div class="sc-sub">whatsNew.buzzItems — full objects with id, age, headline, body, benefits[]</div>' +
      buzzRows +
      (buzz.length < 5
        ? '<button class="add-btn" onclick="_whatsNewAddBuzz()">+ Add buzz item</button>'
        : '<div class="field-hint">5-slot limit reached.</div>') +
      "</div>" +
      "</div>";

    CS.appendFooter();
  };

  window._whatsNewAddBuzz = function () {
    var buzz = (CS.get().whatsNew && CS.get().whatsNew.buzzItems) || [];
    CS.addItem("whatsNew.buzzItems", {
      id: "buzz-" + String(buzz.length + 1).padStart(3, "0"),
      age: "Latest",
      isNew: true,
      headline: "",
      body: "",
      benefits: [],
    });
    window.renderWhatsNew();
  };
})(window);
