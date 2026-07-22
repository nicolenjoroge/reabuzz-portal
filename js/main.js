// ===== STATE =====
let currentRole = "bpm";
let currentPanel = "landing";
let drafts = {};

var API_BASE =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:5000/api"
    : "https://rea-buzz-api-layers-fkbra6a3dmahckh0.southafricanorth-01.azurewebsites.net/api";


// ===== ROLE MANAGEMENT =====
function setRole(role) {
  currentRole = role;
  document.getElementById("btnBpm").className = role === "bpm" ? "active" : "";
  document.getElementById("btnEdit").className =
    role === "editorial" ? "active" : "";
  document.getElementById("roleBadge").className =
    "role-badge " + (role === "bpm" ? "bpm" : "editorial");
  document.getElementById("roleBadge").textContent =
    role === "bpm" ? "BPM" : "Editorial";
  document.getElementById("userAvatar").textContent =
    role === "bpm" ? "BU" : "EU";
  document.getElementById("userName").textContent =
    role === "bpm" ? "BPM User" : "Editorial User";
  document.getElementById("navDashboardSection").style.display =
    role === "bpm" ? "" : "none";
  if (role === "editorial" && currentPanel.startsWith("stream_"))
    showPanel("landing");
  else showPanel(currentPanel);
}

// ===== ROUTING =====
function showPanel(panel) {
  if (panel.startsWith("stream_") && currentRole !== "bpm") {
    
    return;
  }
  currentPanel = panel;
  document.querySelectorAll(".nav-item").forEach(function (el) {
    el.classList.toggle("active", el.dataset.panel === panel);
  });
  render();
}

function render() {
  switch (currentPanel) {
    case "landing":
      renderLanding();
      break;
    case "reastory":
      renderREAStory();
      break;
    case "portfolio":
      renderPortfolio();
      break;
    case "spotlight":
      renderSpotlight();
      break;
    case "whatsnew":
      renderWhatsNew();
      break;
    case "media":
      renderMedia();
      break;
    default:
      renderLanding();
  }
}

// ===== SHARED UTILITIES =====
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

function toggleExpandRow(btn) {
  var wrap = btn.parentNode;
  var full = wrap.querySelector(".td-expand-full");
  var text = wrap.querySelector(".td-expand-text");
  var isOpen = full.style.display !== "none";
  full.style.display = isOpen ? "none" : "block";
  text.style.display = isOpen ? "" : "none";
  btn.innerHTML = isOpen ? "&#x25BC;" : "&#x25B2;";
}

function pillClass(s) {
  return "pill-" + s.toLowerCase().replace(" ", "-");
}

function markDraft(section) {
  drafts[section] = true;
  var dot = document.querySelector('[data-draft="' + section + '"]');
  if (dot) dot.style.display = "block";
}

function clearDraft(section) {
  delete drafts[section];
  var dot = document.querySelector('[data-draft="' + section + '"]');
  if (dot) dot.style.display = "none";
}


// Content panel drawers override saveDrawer in content-panels.js

// ===== MEDIA LIBRARY =====
var BLOB_CONFIG = { account: "bpmstoryhub", container: "media", sasToken: "" };
var mediaItems = [];
var mediaLoading = false;
var mediaFilter = { type: "all", search: "" };
var mediaReady = false;
// Fetch SAS token from Flask on boot, then pre-load media items
fetch(API_BASE + "/media-url")
  .then(function (r) {
    return r.json();
  })
  .then(function (data) {
    BLOB_CONFIG.sasToken = data.sas;
    // Pre-load media so the picker is ready before user visits Media Library
    listBlobs(function () {
      mediaReady = true;
      if (window.currentPanel === "media") renderMedia();
    });
  })
  .catch(function (e) {
    console.warn("media-url fetch failed:", e.message);
  });

function blobUrl(name) {
  return (
    "https://" +
    BLOB_CONFIG.account +
    ".blob.core.windows.net/media/" +
    name.split("/").map(encodeURIComponent).join("/") +
    "?" +
    BLOB_CONFIG.sasToken
  );
}

function listBlobs(callback) {
  mediaLoading = true;
  fetch(API_BASE + "/media-list")
    .then(function (r) {
      return r.text();
    })
    .then(function (xml) {
      var parser = new DOMParser();
      var doc = parser.parseFromString(xml, "text/xml");
      mediaItems = [];
      doc.querySelectorAll("Blob").forEach(function (b) {
        var name = b.querySelector("Name").textContent;
        var size = parseInt(b.querySelector("Content-Length").textContent) || 0;
        var lm = b.querySelector("Last-Modified").textContent;
        var ct = b.querySelector("Content-Type").textContent;
        mediaItems.push({
          name: name,
          size: size,
          lastModified: lm.split(" ").slice(1, 4).join(" "),
          type: ct.startsWith("video") ? "video" : "image",
        });
      });
      mediaLoading = false;
      if (callback) callback();
    })
    .catch(function (e) {
      console.error("Blob list error:", e);
      mediaLoading = false;
      if (callback) callback();
    });
}

function uploadBlob(file, onProgress, onDone, onError) {
  var cleanName = file.name.replace(/\s+/g, "-");
  var folder = file.type.startsWith("video") ? "videos" : "Images";
  var blobPath = folder + "/" + cleanName;

  var url =
    "https://" +
    BLOB_CONFIG.account +
    ".blob.core.windows.net/" +
    BLOB_CONFIG.container +
    "/" +
    blobPath.split("/").map(encodeURIComponent).join("/") +
    "?" +
    BLOB_CONFIG.sasToken;

  var xhr = new XMLHttpRequest();
  xhr.upload.onprogress = function (ev) {
    if (ev.lengthComputable && onProgress)
      onProgress(Math.round((ev.loaded / ev.total) * 100));
  };
  xhr.onload = function () {
    if (xhr.status === 201 || xhr.status === 200) {
      mediaItems.unshift({
        name: blobPath, // store full path e.g. "Images/bpm.png"
        size: file.size,
        lastModified: new Date().toISOString().split("T")[0],
        type: file.type.startsWith("video") ? "video" : "image",
      });
      if (onDone) onDone(blobPath);
    } else {
      if (onError) onError(xhr.statusText);
    }
  };
  xhr.onerror = function () {
    if (onError) onError("Network error");
  };
  xhr.open("PUT", url);
  xhr.setRequestHeader("x-ms-blob-type", "BlockBlob");
  xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
  xhr.send(file);
}

function deleteBlob(name, onDone, onError) {
  var url =
    "https://" +
    BLOB_CONFIG.account +
    ".blob.core.windows.net/" +
    BLOB_CONFIG.container +
    "/" +
    encodeURIComponent(name) +
    "?" +
    BLOB_CONFIG.sasToken;
  fetch(url, { method: "DELETE" })
    .then(function (r) {
      if (r.ok) {
        mediaItems = mediaItems.filter(function (m) {
          return m.name !== name;
        });
        if (onDone) onDone();
      } else {
        if (onError) onError(r.statusText);
      }
    })
    .catch(function (e) {
      if (onError) onError(e.message);
    });
}

function findUsages(name) {
  var draft = window.CS && CS.get() ? JSON.stringify(CS.get()) : "";
  return draft.includes(name) ? ["Content draft"] : [];
}

function formatSize(bytes) {
  if (!bytes) return "";
  return bytes > 1048576
    ? (bytes / 1048576).toFixed(1) + " MB"
    : (bytes / 1024).toFixed(0) + " KB";
}

function renderMedia() {
  document.getElementById("mainArea").innerHTML =
    header(
      "Media library",
      "Images and videos stored in Azure Blob Storage.",
      '<button class="btn btn-primary" onclick="triggerUpload()">↑ Upload media</button>' +
        '<input type="file" id="fileInput" accept="image/*,video/mp4,video/quicktime" multiple style="display:none" onchange="handleFiles(this.files)">',
    ) +
    '<div class="panel-body"><div class="table-wrap">' +
    '<div class="table-toolbar">' +
    '<input class="search-input" placeholder="Search files…" oninput="mediaFilter.search=this.value;renderMediaGrid()" id="mediaSearch">' +
    '<div style="display:flex;gap:6px;margin-left:8px;">' +
    '<button class="btn btn-ghost btn-sm" id="mfAll"  onclick="mediaFilter.type=\'all\';renderMediaGrid()">All</button>' +
    '<button class="btn btn-ghost btn-sm" id="mfImg"  onclick="mediaFilter.type=\'image\';renderMediaGrid()">Images</button>' +
    '<button class="btn btn-ghost btn-sm" id="mfVid"  onclick="mediaFilter.type=\'video\';renderMediaGrid()">Videos</button>' +
    '</div><span style="margin-left:auto;font-size:12px;color:var(--txt2);" id="mediaCount"></span>' +
    "</div>" +
    '<div id="uploadProgress" style="display:none;padding:12px 18px;border-bottom:1px solid var(--border);">' +
    '<div style="font-size:12px;font-weight:bold;margin-bottom:6px;" id="uploadProgressLabel">Uploading…</div>' +
    '<div style="background:var(--border);border-radius:4px;height:6px;"><div id="uploadProgressBar" style="background:var(--med);height:6px;border-radius:4px;width:0%;transition:width .2s;"></div></div>' +
    "</div>" +
    '<div id="mediaGridWrap"></div>' +
    "</div></div>";

  if (mediaItems.length === 0 && !mediaLoading) {
    listBlobs(renderMediaGrid);
    document.getElementById("mediaGridWrap").innerHTML =
      '<div class="empty-state"><div class="es-icon">⏳</div><h4>Loading…</h4></div>';
  } else {
    renderMediaGrid();
  }
}

function renderMediaGrid() {
  var items = mediaItems.filter(function (m) {
    return (
      (mediaFilter.type === "all" || m.type === mediaFilter.type) &&
      (!mediaFilter.search ||
        m.name.toLowerCase().includes(mediaFilter.search.toLowerCase()))
    );
  });

  document.getElementById("mediaCount").textContent =
    items.length + " file" + (items.length === 1 ? "" : "s");
  ["mfAll", "mfImg", "mfVid"].forEach(function (id) {
    document.getElementById(id).className = "btn btn-ghost btn-sm";
  });
  document.getElementById(
    mediaFilter.type === "all"
      ? "mfAll"
      : mediaFilter.type === "image"
        ? "mfImg"
        : "mfVid",
  ).className = "btn btn-primary btn-sm";

  if (!items.length) {
    document.getElementById("mediaGridWrap").innerHTML =
      '<div class="empty-state"><div class="es-icon">🗂</div><h4>' +
      (mediaFilter.search || mediaFilter.type !== "all"
        ? "No files match"
        : "No files yet") +
      "</h4></div>";
    return;
  }

  document.getElementById("mediaGridWrap").innerHTML =
    "<table><thead><tr><th></th><th>File name</th><th>Size</th><th>Uploaded</th><th>Used in</th><th></th></tr></thead><tbody>" +
    items
      .map(function (m) {
        var usages = findUsages(m.name);
        return (
          "<tr>" +
          '<td style="font-size:18px;width:36px;">' +
          (m.type === "video" ? "🎬" : "🖼") +
          "</td>" +
          '<td class="td-name" style="word-break:break-all;">' +
          m.name +
          "</td>" +
          '<td class="td-mono">' +
          formatSize(m.size) +
          "</td>" +
          '<td class="td-mono">' +
          m.lastModified +
          "</td>" +
          '<td style="font-size:12px;">' +
          (usages.length
            ? usages.join(", ")
            : '<span style="opacity:.4;">Not used</span>') +
          "</td>" +
          '<td><div style="display:flex;gap:6px;">' +
          '<button class="btn btn-ghost btn-sm" onclick="copyBlobUrl(\'' +
          m.name +
          "')\">Copy URL</button>" +
          '<button class="btn btn-danger btn-sm" onclick="confirmDeleteBlob(\'' +
          m.name +
          "')\">Delete</button>" +
          "</div></td></tr>"
        );
      })
      .join("") +
    "</tbody></table>";
}

function triggerUpload() {
  document.getElementById("fileInput").click();
}

function handleFiles(files) {
  if (!files || !files.length) return;
  var file = files[0];
  var allowed = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/svg",
    "image/webp",
    "video/mp4",
    "video/quicktime",
  ];
  if (allowed.indexOf(file.type) === -1) {
    showToast("File type not allowed.", "danger");
    return;
  }
  if (file.size > 1000 * 1024 * 1024) {
    showToast("File too large (max 1GB).", "danger");
    return;
  }

  var prog = document.getElementById("uploadProgress");
  var bar = document.getElementById("uploadProgressBar");
  var label = document.getElementById("uploadProgressLabel");
  prog.style.display = "block";
  bar.style.width = "0%";
  label.textContent = "Uploading " + file.name + "…";

  uploadBlob(
    file,
    function (pct) {
      bar.style.width = pct + "%";
      label.textContent = "Uploading " + file.name + " (" + pct + "%)";
    },
    function (name) {
      prog.style.display = "none";
      showToast("Uploaded: " + name + " ✓", "success");
      renderMediaGrid();
    },
    function (err) {
      prog.style.display = "none";
      showToast("Upload failed: " + err, "danger");
    },
  );
}

function copyBlobUrl(name) {
  var url = blobUrl(name);
  if (navigator.clipboard) {
    navigator.clipboard.writeText(url).then(function () {
      showToast("URL copied ✓", "success");
    });
  }
}

function confirmDeleteBlob(name) {
  var usages = findUsages(name);
  var msg = usages.length
    ? "Used in: " + usages.join(", ") + ". Delete anyway?"
    : 'Delete "' + name + '"? This cannot be undone.';
  if (!confirm(msg)) return;
  deleteBlob(
    name,
    function () {
      showToast("Deleted ✓", "success");
      renderMediaGrid();
    },
    function (err) {
      showToast("Delete failed: " + err, "danger");
    },
  );
}

// Media picker modal — used by content panels to select images/videos
var _pickerCallback = null;
var _pickerType = "all";

function openMediaPicker(type, callback) {
  _pickerCallback = callback;
  _pickerType = type || "all";

  var existing = document.getElementById("mediaPickerModal");
  if (existing) existing.remove();

  var modal = document.createElement("div");
  modal.id = "mediaPickerModal";
  modal.style.cssText =
    "position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;";

  modal.innerHTML =
    '<div style="background:#fff;border-radius:12px;width:560px;max-height:70vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.3);">' +
    '<div style="padding:16px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;">' +
    '<div style="font-size:15px;font-weight:bold;">Choose ' +
    (type === "video" ? "a video" : "an image") +
    "</div>" +
    '<div style="display:flex;gap:8px;align-items:center;">' +
    '<input id="pickerSearch" placeholder="Search…" style="border:1px solid var(--border);border-radius:6px;padding:5px 10px;font-size:13px;width:180px;" oninput="_renderPickerList(this.value)">' +
    '<button onclick="closeMediaPicker()" style="background:none;border:none;font-size:20px;cursor:pointer;color:var(--txt2);">&#x2715;</button>' +
    "</div>" +
    "</div>" +
    '<div id="pickerList" style="flex:1;overflow-y:auto;"></div>' +
    '<div style="padding:12px 20px;border-top:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;">' +
    '<button class="btn btn-ghost btn-sm" id="pickerUploadBtn">&#x2191; Upload new</button>' +
    '<button class="btn btn-ghost btn-sm" onclick="closeMediaPicker()">Cancel</button>' +
    "</div>" +
    "</div>";

  document.body.appendChild(modal);

  // Close on backdrop click
  modal.addEventListener("click", function (e) {
    if (e.target === modal) closeMediaPicker();
  });

  // Upload button
  document.getElementById('pickerUploadBtn').addEventListener('click', function () {
  var input    = document.createElement('input');
  input.type   = 'file';
  input.accept = _pickerType === 'video' ? 'video/mp4,video/quicktime' : 'image/*';
  input.onchange = function () {
    if (!this.files.length) return;
    var file = this.files[0];
    var list = document.getElementById('pickerList');
    if (list) list.innerHTML = '<div style="padding:24px;text-align:center;color:var(--txt2);">Uploading ' + file.name + '…</div>';

    uploadBlob(file,
      null,  // no progress bar in picker
      function (blobPath) {
        // success — select the uploaded file immediately
        var cb = _pickerCallback;
        _pickerCallback = null;
        closeMediaPicker();
        if (cb) cb(blobUrl(blobPath), blobPath);
        showToast('Uploaded and selected: ' + blobPath + ' \u2713', 'success');
      },
      function (err) {
        showToast('Upload failed: ' + err, 'danger');
        _renderPickerList('');
      }
    );
  };
  input.click();
});

  // Render list — load if needed
  if (mediaReady) {
    _renderPickerList("");
  } else {
    document.getElementById("pickerList").innerHTML =
      '<div style="padding:24px;text-align:center;color:var(--txt2);">Loading…</div>';
    listBlobs(function () {
      mediaReady = true;
      _renderPickerList("");
    });
  }
}

function _renderPickerList(search) {
  var list = document.getElementById("pickerList");
  if (!list) return;

  var items = mediaItems.filter(function (m) {
    return (
      (_pickerType === "all" || m.type === _pickerType) &&
      (!search || m.name.toLowerCase().includes(search.toLowerCase()))
    );
  });

  if (!items.length) {
    list.innerHTML =
      '<div style="padding:24px;text-align:center;color:var(--txt2);font-size:13px;">No files found.</div>';
    return;
  }

  list.innerHTML = items
    .map(function (m, i) {
      return (
        '<div style="padding:10px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:12px;cursor:pointer;" ' +
        'id="picker_item_' +
        i +
        '">' +
        '<span style="font-size:20px;">' +
        (m.type === "video" ? "🎬" : "🖼") +
        "</span>" +
        '<div style="flex:1;min-width:0;">' +
        '<div style="font-size:13px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' +
        m.name +
        "</div>" +
        '<div style="font-size:11px;color:var(--txt2);">' +
        formatSize(m.size) +
        "</div>" +
        "</div>" +
        '<span style="font-size:12px;color:var(--med);">Select</span>' +
        "</div>"
      );
    })
    .join("");

  // Wire each item click directly
  items.forEach(function (m, i) {
    var el = document.getElementById("picker_item_" + i);
    if (!el) return;
    el.addEventListener("click", function () {
      var url = blobUrl(m.name);
      var name = m.name;
      var cb = _pickerCallback; // grab reference first
      _pickerCallback = null; // clear it
      closeMediaPicker(); // close modal
      if (cb) cb(url, name); // fire callback after
    });
    // Hover effect
    el.addEventListener("mouseover", function () {
      this.style.background = "#f5f4f0";
    });
    el.addEventListener("mouseout", function () {
      this.style.background = "";
    });
  });
}

function closeMediaPicker() {
  var m = document.getElementById("mediaPickerModal");
  if (m) m.remove();
  // Don't null _pickerCallback here — handled in click handler
}

function triggerUploadFromPicker() {
  var input = document.createElement("input");
  input.type = "file";
  input.accept =
    _pickerType === "video" ? "video/mp4,video/quicktime" : "image/*";
  input.onchange = function () {
    if (!this.files.length) return;
    handleFiles(this.files);
    setTimeout(function () {
      var s = document.getElementById("pickerSearch");
      renderPickerGrid(s ? s.value : "");
    }, 2000);
  };
  input.click();
}

// ===== DRAWER =====
function closeDrawer(e) {
  if (e && e.target !== document.getElementById("drawerOverlay")) return;
  document.getElementById("drawerOverlay").className = "drawer-overlay";
  document.getElementById("drawerDelete").style.display = "";
  window._editingType = null;
}



// ===== TOAST =====
function showToast(msg, type) {
  var t = document.createElement("div");
  t.style.cssText =
    "position:fixed;bottom:24px;left:50%;transform:translateX(-50%);" +
    "background:" +
    (type === "success"
      ? "#1a8a5a"
      : type === "info"
        ? "var(--brand)"
        : "var(--danger)") +
    ";" +
    "color:#fff;font-size:13px;font-weight:bold;padding:10px 20px;border-radius:10px;z-index:9999;box-shadow:0 4px 14px rgba(0,0,0,0.2);";
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(function () {
    t.remove();
  }, 3000);
}

// ===== INIT =====
showPanel("landing");
