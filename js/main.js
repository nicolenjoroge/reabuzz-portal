// ===== STATE =====
let currentRole = "bpm";
let currentPanel = "landing";
let drafts = {};

var API_BASE =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:5000/api"
    : "https://rea-buzz-api-layers-fkbra6a3dmahckh0.southafricanorth-01.azurewebsites.net/api";

// ===== CONSTANTS =====
const STATUSES = ["Deployed", "UAT", "CAB", "Build", "Analysis", "Pipeline"];
const VERTICALS = [
  "RPA",
  "PowerApps",
  "Power Agents",
  "AI",
  "IBPS",
  "DocuSign",
  "Enterprise",
];
var DIVISIONS = [
  "Operations & Process",
  "Finance & Treasury",
  "Risk & Credit",
  "Wealth & Trustee",
  "Retail & Digital Banking",
  "Corporate & Investment Banking",
  "Customer Experience",
];
var DEPARTMENTS = [
  "Operations",
  "Finance",
  "Contact Centre",
  "Trustee Services",
  "Credit",
  "FX Desk",
  "Investment Banking",
  "Retail Banking",
];

// ===== STREAM DATA — loaded from Cosmos DB on boot =====
var streamData = {
  rpa: [],
  powerapps: [],
  poweragents: [],
  ibps: [],
  docusign: [],
  ai: [],
};

// ===== API HELPERS =====
function apiGetInitiatives() {
  return fetch(API_BASE + "/initiatives").then(function (r) {
    if (!r.ok) throw new Error("Failed to fetch initiatives");
    return r.json();
  });
}

function apiCreateInitiative(payload) {
  return fetch(API_BASE + "/initiatives", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).then(function (r) {
    return r.json().then(function (b) {
      if (!r.ok) throw b;
      return b;
    });
  });
}

function apiUpdateInitiative(id, payload) {
  return fetch(API_BASE + "/initiatives/" + encodeURIComponent(id), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).then(function (r) {
    return r.json().then(function (b) {
      if (!r.ok) throw b;
      return b;
    });
  });
}

function apiDeleteInitiative(id) {
  return fetch(API_BASE + "/initiatives/" + encodeURIComponent(id), {
    method: "DELETE",
  }).then(function (r) {
    return r.json().then(function (b) {
      if (!r.ok) throw b;
      return b;
    });
  });
}

function mapServerItemToUI(item, streamKey) {
  var meta = STREAM_META[streamKey];
  var rec = {};
  meta.cols.forEach(function (col) {
    rec[col.key] = item[col.key] !== undefined ? item[col.key] : "";
  });
  rec.nexusId = rec.nexusId || item.nexusId || item.id;
  rec._db = { id: item.id, raw: item };
  return rec;
}

function loadDataFromApi() {
  return apiGetInitiatives()
    .then(function (items) {
      streamData = {
        rpa: [],
        powerapps: [],
        poweragents: [],
        ibps: [],
        docusign: [],
        ai: [],
      };

      // Collect unique departments and divisions from real data
      var depts = {};
      var divs = {};

      items.forEach(function (it) {
        var section = (it.sectionId || "rpa").toLowerCase();
        var key =
          ["rpa", "powerapps", "poweragents", "ibps", "docusign", "ai"].indexOf(
            section,
          ) !== -1
            ? section
            : "rpa";
        streamData[key].push(mapServerItemToUI(it, key));

        if (it.department) depts[it.department] = true;
        if (it.division) divs[it.division] = true;
      });

      // Update the global arrays so dropdowns reflect real data
      var dbDepts = Object.keys(depts).sort();
      var dbDivs = Object.keys(divs).sort();

      if (dbDepts.length) DEPARTMENTS = dbDepts;
      if (dbDivs.length) DIVISIONS = dbDivs;

      if (window.render) window.render();
    })
    .catch(function (err) {
      console.error("Failed to load initiatives:", err);
      showToast("Failed to load initiatives from server", "danger");
    });
}

// ===== STREAM SCHEMAS =====
var STREAM_META = {
  rpa: {
    label: "RPA",
    description: "Robotic Process Automation initiatives",
    cols: [
      {
        key: "nexusId",
        label: "Nexus ID",
        type: "text",
        short: true,
        display: true,
      },
      {
        key: "processName",
        label: "Process name",
        type: "text",
        display: true,
      },
      {
        key: "status",
        label: "Status",
        type: "status",
        short: true,
        display: true,
      },
      {
        key: "department",
        label: "Department",
        type: "select",
        opts: "DEPARTMENTS",
        display: true,
      },
      { key: "division", label: "Division", type: "select", opts: "DIVISIONS" },
      { key: "country", label: "Country", type: "text", short: true },
      {
        key: "problemStatement",
        label: "Problem statement",
        type: "textarea",
        hidden: true,
        expandable: true
      },
      {
        key: "proposedSolution",
        label: "Proposed solution",
        type: "textarea",
        hidden: true,
        display: true,
        expandable: true
      },
      {
        key: "manHours",
        label: "Man hours",
        type: "number",
        short: true,
        display: true,
      },
      {
        key: "incrementalHours",
        label: "Incremental hours",
        type: "number",
        short: true,
      },
      {
        key: "tatReduction",
        label: "TAT reduction",
        type: "text",
        short: true,
      },
      {
        key: "costSavings",
        label: "Cost savings",
        type: "number",
        short: true,
      },
      {
        key: "qualBenefits",
        label: "Qualitative benefits",
        type: "textarea",
        hidden: true,
        expandable: true
      },
      { key: "targetCompletion", label: "Target completion", type: "date" },
      {
        key: "processOwner",
        label: "Process owner",
        type: "text",
        display: true,
      },
      { key: "benefitsSigned", label: "Benefits signed off", type: "text" },
      { key: "developer", label: "Developer", type: "text", hidden: true },
      { key: "architect", label: "Architect", type: "text", hidden: true },
      { key: "analyst", label: "Analyst", type: "text", hidden: true },
      { key: "comments", label: "Comments", type: "textarea", hidden: true },
    ],
  },
  powerapps: {
    label: "PowerApps",
    description: "PowerApps initiatives",
    cols: null,
  },
  poweragents: {
    label: "Power Agents",
    description: "Power Agents initiatives",
    cols: null,
  },
  ibps: {
    label: "IBPS",
    description: "IBPS initiatives",
    cols: [
      {
        key: "nexusId",
        label: "Nexus ID",
        type: "text",
        short: true,
        display: true,
      },
      {
        key: "processName",
        label: "Process name",
        type: "text",
        display: true,
      },
      {
        key: "status",
        label: "Status",
        type: "status",
        short: true,
        display: true,
      },
      {
        key: "department",
        label: "Department",
        type: "select",
        opts: "DEPARTMENTS",
        display: true,
      },
      { key: "division", label: "Division", type: "select", opts: "DIVISIONS" },
      {
        key: "problemStatement",
        label: "Problem statement",
        type: "textarea",
        hidden: true,
        expandable: true
      },
      {
        key: "proposedSolution",
        label: "Proposed solution",
        type: "textarea",
        hidden: true,
        display: true,
        expandable: true
      },
      {
        key: "manHours",
        label: "Man hours",
        type: "number",
        short: true,
        display: true,
      },
      {
        key: "paperPrintSavings",
        label: "Paper & print savings",
        type: "number",
        short: true,
      },
      {
        key: "tatReduction",
        label: "TAT reduction",
        type: "text",
        short: true,
      },
      {
        key: "qualBenefits",
        label: "Qualitative benefits",
        type: "textarea",
        hidden: true,
        expandable: true
      },
      { key: "targetCompletion", label: "Target completion", type: "date" },
      {
        key: "processOwner",
        label: "Process owner",
        type: "text",
        display: true,
      },
      { key: "bpmOwner", label: "BPM owner", type: "text" },
      { key: "benefitsSigned", label: "Benefits signed off", type: "text" },
      { key: "comments", label: "Comments", type: "textarea", hidden: true },
    ],
  },
  docusign: {
    label: "DocuSign",
    description: "DocuSign initiatives",
    cols: [
      {
        key: "nexusId",
        label: "Nexus ID",
        type: "text",
        short: true,
        display: true,
      },
      {
        key: "processName",
        label: "Process name",
        type: "text",
        display: true,
      },
      {
        key: "status",
        label: "Status",
        type: "status",
        short: true,
        display: true,
      },
      {
        key: "department",
        label: "Department",
        type: "select",
        opts: "DEPARTMENTS",
        display: true,
      },
      { key: "division", label: "Division", type: "select", opts: "DIVISIONS" },
      {
        key: "problemStatement",
        label: "Problem statement",
        type: "textarea",
        hidden: true,
        expandable: true
      },
      {
        key: "proposedSolution",
        label: "Proposed solution",
        type: "textarea",
        hidden: true,
        display: true,
        expandable: true
      },
      {
        key: "manHours",
        label: "Man hours",
        type: "number",
        short: true,
        display: true,
      },
      {
        key: "paperSavings",
        label: "Paper savings",
        type: "number",
        short: true,
      },
      { key: "tat", label: "TAT", type: "text", short: true },
      {
        key: "costSavingsDocusign",
        label: "Cost savings",
        type: "number",
        short: true,
      },
      {
        key: "totalCostSavings",
        label: "Total cost savings",
        type: "number",
        short: true,
      },
      {
        key: "qualBenefits",
        label: "Qualitative benefits",
        type: "textarea",
        hidden: true,
      },
      { key: "targetCompletion", label: "Target completion", type: "date" },
      {
        key: "processOwner",
        label: "Process owner",
        type: "text",
        display: true,
      },
      {
        key: "benefitsApproved",
        label: "Benefits approved",
        type: "text",
        hidden: true,
      },
      {
        key: "benefitsValidated",
        label: "Benefits validated by",
        type: "text",
        hidden: true,
      },
      {
        key: "benefitsSigned",
        label: "Benefits signed off",
        type: "text",
        hidden: true,
      },
      { key: "bpmOwner", label: "BPM owner", type: "text", hidden: true },
      { key: "comments", label: "Comments", type: "textarea", hidden: true },
    ],
  },
  ai: {
    label: "AI",
    description: "AI initiatives",
    cols: [
      {
        key: "nexusId",
        label: "Nexus ID",
        type: "text",
        short: true,
        display: true,
      },
      {
        key: "processName",
        label: "Process name",
        type: "text",
        display: true,
      },
      {
        key: "status",
        label: "Status",
        type: "status",
        short: true,
        display: true,
      },
      {
        key: "department",
        label: "Department",
        type: "select",
        opts: "DEPARTMENTS",
        display: true,
      },
      { key: "division", label: "Division", type: "select", opts: "DIVISIONS" },
      { key: "type", label: "Type", type: "text", short: true },
      { key: "vendor", label: "Vendor", type: "text", short: true },
      { key: "aiCluster", label: "AI cluster", type: "text", short: true },
      { key: "country", label: "Country", type: "text", short: true },
      {
        key: "problemStatement",
        label: "Problem statement",
        type: "textarea",
        hidden: true,
        expandable: true
      },
      {
        key: "proposedSolution",
        label: "Proposed solution",
        type: "textarea",
        hidden: true,
        display: true,
        expandable: true
      },
      {
        key: "manHours",
        label: "Man hours",
        type: "number",
        short: true,
        display: true,
      },
      {
        key: "incrementalHours",
        label: "Incremental hours",
        type: "number",
        short: true,
      },
      {
        key: "tatReduction",
        label: "TAT reduction",
        type: "text",
        short: true,
      },
      {
        key: "costSavings",
        label: "Cost savings",
        type: "number",
        short: true,
      },
      {
        key: "qualBenefits",
        label: "Qualitative benefits",
        type: "textarea",
        hidden: true,
      },
      { key: "targetCompletion", label: "Target completion", type: "date" },
      {
        key: "processOwner",
        label: "Process owner",
        type: "text",
        display: true,
      },
      { key: "benefitsSigned", label: "Benefits signed off", type: "text" },
      { key: "developer", label: "Developer", type: "text", hidden: true },
      { key: "comments", label: "Comments", type: "textarea", hidden: true },
    ],
  },
};
STREAM_META.powerapps.cols = STREAM_META.rpa.cols;
STREAM_META.poweragents.cols = STREAM_META.rpa.cols;

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
    renderAccessDenied();
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
    case "stream_rpa":
      renderStream("rpa");
      break;
    case "stream_powerapps":
      renderStream("powerapps");
      break;
    case "stream_poweragents":
      renderStream("poweragents");
      break;
    case "stream_ibps":
      renderStream("ibps");
      break;
    case "stream_docusign":
      renderStream("docusign");
      break;
    case "stream_ai":
      renderStream("ai");
      break;
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
      renderStream("rpa");
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
  var full = wrap.querySelector('.td-expand-full');
  var text = wrap.querySelector('.td-expand-text');
  var isOpen = full.style.display !== 'none';
  full.style.display  = isOpen ? 'none' : 'block';
  text.style.display  = isOpen ? '' : 'none';
  btn.innerHTML       = isOpen ? '&#x25BC;' : '&#x25B2;';
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

// ===== STREAM TABLE =====
function renderStream(streamKey) {
  var meta = STREAM_META[streamKey];
  var data = streamData[streamKey] || [];

  var tableCols = meta.cols.filter(function (c) {
    // return !c.hidden && c.type !== "textarea";
    return c.display === true;
  });
  // .slice(0, 7);

  var thRow = '<th style="width:40px;">#</th>' +
  tableCols.map(function (c) {
    return '<th>' + c.label + '</th>';
  }).join('') + '<th></th>';

  var rows = data.length
    ? data
        .map(function (rec, rowIdx) {
          var tds = '<td class="td-mono" style="color:var(--txt2);opacity:.5;">' + (rowIdx + 1) + '</td>' + tableCols
            .map(function (c) {
              var val = rec[c.key] !== undefined ? rec[c.key] : "—";
              if (c.type === "status")
                return (
                  '<td><span class="pill ' +
                  pillClass(String(val)) +
                  '">' +
                  val +
                  "</span></td>"
                );
              if (c.key === "nexusId")
                return '<td class="td-mono">' + val + "</td>";
              if (c.key === "processName")
                return '<td class="td-name">' + val + "</td>";
              if (c.expandable)
                return (
                  '<td class="td-expandable">' +
                  '<div class="td-expand-wrap">' +
                  '<span class="td-expand-text">' +
                  String(val).substring(0, 60) +
                  (String(val).length > 60 ? "…" : "") +
                  "</span>" +
                  (String(val).length > 60
                    ? '<button class="td-expand-btn" onclick="toggleExpandRow(this)">&#x25BC;</button>'
                    : "") +
                  '<div class="td-expand-full" style="display:none;">' +
                  val +
                  "</div>" +
                  "</div>" +
                  "</td>"
                );
              return "<td>" + val + "</td>";
            })
            .join("");
          return (
            "<tr>" +
            tds +
            '<td><button class="btn btn-ghost btn-sm" data-action="edit" data-stream="' +
            streamKey +
            '" data-id="' +
            rec.nexusId +
            '">Edit</button></td>' +
            "</tr>"
          );
        })
        .join("")
    : '<tr><td colspan="' +
      (tableCols.length + 1) +
      '" style="text-align:center;padding:32px;color:var(--txt2);">No records yet.</td></tr>';

  document.getElementById("mainArea").innerHTML =
    header(
      meta.label,
      meta.description,
      "<button class=\"btn btn-ghost btn-sm\" onclick=\"showToast('Synced', 'success')\">⟳ Sync</button>" +
        '<button class="btn btn-primary" data-action="new-stream" data-stream="' +
        streamKey +
        '">+ New record</button>',
    ) +
    '<div class="panel-body"><div class="table-wrap">' +
    '<div class="table-toolbar">' +
    '<input class="search-input" placeholder="Search ' +
    meta.label +
    '…" data-action="filter" data-stream="' +
    streamKey +
    '">' +
    '<span style="margin-left:auto;font-size:12px;color:var(--txt2);">' +
    data.length +
    " record" +
    (data.length === 1 ? "" : "s") +
    "</span>" +
    "</div>" +
    '<div style="overflow-x:auto;"><table><thead><tr>' +
    thRow +
    '</tr></thead><tbody id="streamTableBody">' +
    rows +
    "</tbody></table></div>" +
    "</div></div>";

  var _sk = streamKey;
  document.getElementById("mainArea").onclick = function (e) {
    var el = e.target;
    while (el && el !== this) {
      if (el.dataset && el.dataset.action) {
        if (el.dataset.action === "edit") {
          var rec = (streamData[_sk] || []).find(function (r) {
            return r.nexusId === el.dataset.id;
          });
          editStreamRecord(_sk, el.dataset.id, rec);
          return;
        }
        if (el.dataset.action === "new-stream") {
          newStreamRecord(_sk);
          return;
        }
      }
      el = el.parentNode;
    }
  };

  document.getElementById("mainArea").oninput = function (e) {
    if (e.target.dataset && e.target.dataset.action === "filter") {
      filterStream(e.target.dataset.stream || _sk, e.target.value);
    }
  };
}

function filterStream(streamKey, q) {
  var meta = STREAM_META[streamKey];
  var data = (streamData[streamKey] || []).filter(function (r) {
    return !q || JSON.stringify(r).toLowerCase().includes(q.toLowerCase());
  });
  var tableCols = meta.cols.filter(function (c) {
    // return !c.hidden && c.type !== "textarea";
    return c.display === true;
  });
  // .slice(0, 7);

  var rows = data.length
    ? data
        .map(function (rec) {
          var tds = tableCols
            .map(function (c) {
              var val = rec[c.key] !== undefined ? rec[c.key] : "—";
              if (c.type === "status")
                return (
                  '<td><span class="pill ' +
                  pillClass(String(val)) +
                  '">' +
                  val +
                  "</span></td>"
                );
              if (c.key === "nexusId")
                return '<td class="td-mono">' + val + "</td>";
              if (c.key === "processName")
                return '<td class="td-name">' + val + "</td>";
              return "<td>" + val + "</td>";
            })
            .join("");
          return (
            "<tr>" +
            tds +
            '<td><button class="btn btn-ghost btn-sm" data-action="edit" data-stream="' +
            streamKey +
            '" data-id="' +
            rec.nexusId +
            '">Edit</button></td>' +
            "</tr>"
          );
        })
        .join("")
    : '<tr><td colspan="' +
      (tableCols.length + 1) +
      '" style="text-align:center;padding:24px;color:var(--txt2);">No results</td></tr>';

  document.getElementById("streamTableBody").innerHTML = rows;
}

function newStreamRecord(streamKey) {
  var meta = STREAM_META[streamKey];

  document.getElementById("drawerTitle").textContent =
    meta.label + " — New record";
  document.getElementById("drawerSub").textContent =
    "Fill in all required fields";
  document.getElementById("drawerDelete").style.display = "none";

  var fields = meta.cols
    .map(function (col) {
      var id = "sf_" + col.key;
      var inp = "";
      if (col.type === "status") {
        inp =
          '<select id="' +
          id +
          '">' +
          STATUSES.map(function (s) {
            return (
              "<option" +
              (s === "Pipeline" ? " selected" : "") +
              ">" +
              s +
              "</option>"
            );
          }).join("") +
          "</select>";
      } else if (col.type === "select" && col.opts === "DIVISIONS") {
        inp =
          '<select id="' +
          id +
          '">' +
          DIVISIONS.map(function (d) {
            return "<option>" + d + "</option>";
          }).join("") +
          "</select>";
      } else if (col.type === "select" && col.opts === "DEPARTMENTS") {
        inp =
          '<select id="' +
          id +
          '">' +
          DEPARTMENTS.map(function (d) {
            return "<option>" + d + "</option>";
          }).join("") +
          "</select>";
      } else if (col.type === "textarea") {
        inp = '<textarea id="' + id + '" style="min-height:70px;"></textarea>';
      } else if (col.type === "number") {
        inp = '<input id="' + id + '" type="number" value="0">';
      } else if (col.type === "date") {
        inp = '<input id="' + id + '" type="date">';
      } else {
        inp = '<input id="' + id + '">';
      }
      var wide =
        col.type === "textarea" ||
        col.key === "processName" ||
        col.key === "problemStatement" ||
        col.key === "proposedSolution" ||
        col.key === "qualBenefits";
      return (
        '<div class="field"' +
        (wide ? ' style="grid-column:span 2;"' : "") +
        ">" +
        "<label>" +
        col.label +
        "</label>" +
        inp +
        "</div>"
      );
    })
    .join("");

  document.getElementById("drawerBody").innerHTML =
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">' +
    fields +
    "</div>";

  window._editingType = "stream";
  window._editingStream = streamKey;
  window._editingRec = null; // null = new record

  document.getElementById("drawerOverlay").className = "drawer-overlay open";
}

function editStreamRecord(streamKey, nexusId, rec) {
  var meta = STREAM_META[streamKey];
  var rec = (streamData[streamKey] || []).find(function (r) {
    return r.nexusId === nexusId;
  });
  if (!rec) return;

  document.getElementById("drawerTitle").textContent =
    meta.label + " — Edit record";
  document.getElementById("drawerSub").textContent =
    rec.nexusId + (rec.processName ? " · " + rec.processName : "");
  document.getElementById("drawerDelete").style.display = "";
  document.getElementById("drawerDelete").onclick = function () {
    if (!confirm("Delete " + rec.nexusId + "?")) return;
    if (rec._db && rec._db.id) {
      apiDeleteInitiative(rec._db.id)
        .then(function () {
          streamData[streamKey] = streamData[streamKey].filter(function (r) {
            return r.nexusId !== nexusId;
          });
          closeDrawer();
          showToast("Deleted \u2713", "success");
          renderStream(streamKey);
        })
        .catch(function (e) {
          showToast(e.error || "Delete failed", "danger");
        });
    } else {
      // Local-only record (not yet saved to Cosmos)
      streamData[streamKey] = streamData[streamKey].filter(function (r) {
        return r.nexusId !== nexusId;
      });
      closeDrawer();
      renderStream(streamKey);
    }
  };

  var fields = meta.cols
    .map(function (col) {
      var val = rec[col.key] !== undefined ? rec[col.key] : "";
      var id = "sf_" + col.key;
      var inp = "";

      if (col.type === "status") {
        inp =
          '<select id="' +
          id +
          '">' +
          STATUSES.map(function (s) {
            return (
              "<option" + (s === val ? " selected" : "") + ">" + s + "</option>"
            );
          }).join("") +
          "</select>";
      } else if (col.type === "select" && col.opts === "DIVISIONS") {
        inp =
          '<select id="' +
          id +
          '">' +
          DIVISIONS.map(function (d) {
            return (
              "<option" + (d === val ? " selected" : "") + ">" + d + "</option>"
            );
          }).join("") +
          "</select>";
      } else if (col.type === "select" && col.opts === "DEPARTMENTS") {
        inp =
          '<select id="' +
          id +
          '">' +
          DEPARTMENTS.map(function (d) {
            return (
              "<option" + (d === val ? " selected" : "") + ">" + d + "</option>"
            );
          }).join("") +
          "</select>";
      } else if (col.type === "textarea") {
        inp =
          '<textarea id="' +
          id +
          '" style="min-height:70px;">' +
          val +
          "</textarea>";
      } else if (col.type === "number") {
        inp = '<input id="' + id + '" type="number" value="' + val + '">';
      } else if (col.type === "date") {
        inp = '<input id="' + id + '" type="date" value="' + val + '">';
      } else {
        inp = '<input id="' + id + '" value="' + val + '">';
      }

      var wide =
        col.type === "textarea" ||
        col.key === "processName" ||
        col.key === "problemStatement" ||
        col.key === "proposedSolution" ||
        col.key === "qualBenefits";
      return (
        '<div class="field"' +
        (wide ? ' style="grid-column:span 2;"' : "") +
        ">" +
        "<label>" +
        col.label +
        "</label>" +
        inp +
        "</div>"
      );
    })
    .join("");

  document.getElementById("drawerBody").innerHTML =
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">' +
    fields +
    "</div>";
  console.log(
    "drawerBody innerHTML length:",
    document.getElementById("drawerBody").innerHTML.length,
  );
  console.log("fields string length:", fields.length);
  document.getElementById("drawerOverlay").className = "drawer-overlay open";

  // saveDrawer for stream records — content-panels.js handles all other panels
  window._editingType = "stream";
  window._editingStream = streamKey;
  window._editingRec = rec;
}

// saveDrawer — defined in content-panels.js.
// Stream record saving is handled via _saveStreamRecord() called from there.
window._saveStreamRecord = function () {
  var streamKey = window._editingStream;
  var meta = STREAM_META[streamKey];

  // Collect field values
  var payload = {};
  meta.cols.forEach(function (col) {
    var el = document.getElementById("sf_" + col.key);
    if (!el) return;
    payload[col.key] =
      col.type === "number" ? parseFloat(el.value) || 0 : el.value;
  });
  payload.sectionId = streamKey.toUpperCase();

  var rec = window._editingRec;

  if (rec && rec._db && rec._db.id) {
    // UPDATE existing
    apiUpdateInitiative(rec._db.id, payload)
      .then(function (updated) {
        var idx = streamData[streamKey].indexOf(rec);
        streamData[streamKey][idx] = mapServerItemToUI(updated, streamKey);
        showToast("Saved \u2713", "success");
        closeDrawer();
        renderStream(streamKey);
      })
      .catch(function (e) {
        showToast(e.error || "Save failed", "danger");
      });
  } else {
    // CREATE new
    if (!payload.nexusId) {
      showToast("Please enter a Nexus ID", "danger");
      return;
    }
    apiCreateInitiative(payload)
      .then(function (created) {
        streamData[streamKey].push(mapServerItemToUI(created, streamKey));
        showToast("Created \u2713", "success");
        closeDrawer();
        renderStream(streamKey);
      })
      .catch(function (e) {
        showToast(e.error || "Create failed", "danger");
      });
  }
};
if (window._editingType === "stream") {
  var streamKey = window._editingStream;
  var nexusId = window._editingNexusId;
  var meta = STREAM_META[streamKey];
  var rec = (streamData[streamKey] || []).find(function (r) {
    return r.nexusId === nexusId;
  });
  if (rec) {
    meta.cols.forEach(function (col) {
      var el = document.getElementById("sf_" + col.key);
      if (!el) return;
      rec[col.key] =
        col.type === "number" ? parseFloat(el.value) || 0 : el.value;
    });
  }
  closeDrawer();
  showToast("Saved ✓", "success");
  renderStream(streamKey);
  // return;
}
// Content panel drawers override saveDrawer in content-panels.js

// ===== MEDIA LIBRARY =====
var BLOB_CONFIG = { account: "bpmstoryhub", container: "media", sasToken: "" };
var mediaItems = [];
var mediaLoading = false;
var mediaFilter = { type: "all", search: "" };

// Fetch SAS token from Flask on boot, then pre-load media items
fetch(API_BASE + "/media-url")
  .then(function (r) {
    return r.json();
  })
  .then(function (data) {
    BLOB_CONFIG.sasToken = data.sas;
    // Pre-load media so the picker is ready before user visits Media Library
    listBlobs(function () {
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
  var name = file.name.replace(/\s+/g, "-");
  var url =
    "https://" +
    BLOB_CONFIG.account +
    ".blob.core.windows.net/" +
    BLOB_CONFIG.container +
    "/" +
    encodeURIComponent(name) +
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
        name: name,
        size: file.size,
        lastModified: new Date().toISOString().split("T")[0],
        type: file.type.startsWith("video") ? "video" : "image",
      });
      if (onDone) onDone(name);
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
    "image/webp",
    "video/mp4",
    "video/quicktime",
  ];
  if (allowed.indexOf(file.type) === -1) {
    showToast("File type not allowed.", "danger");
    return;
  }
  if (file.size > 500 * 1024 * 1024) {
    showToast("File too large (max 500MB).", "danger");
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
    "position:fixed;inset:0;background:rgba(26,22,20,0.5);z-index:500;display:flex;align-items:center;justify-content:center;";
  modal.innerHTML =
    '<div style="background:#fff;border-radius:14px;width:760px;max-height:80vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.25);">' +
    '<div style="padding:18px 22px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;">' +
    '<div><div style="font-size:15px;font-weight:bold;">Media library</div><div style="font-size:12px;color:var(--txt2);">Select a ' +
    (type || "file") +
    "</div></div>" +
    '<div style="display:flex;gap:8px;align-items:center;">' +
    '<input id="pickerSearch" class="search-input" placeholder="Search…" style="max-width:200px;" oninput="renderPickerGrid(this.value)">' +
    '<button style="background:none;border:none;font-size:20px;color:var(--txt2);cursor:pointer;" onclick="closeMediaPicker()">✕</button>' +
    "</div></div>" +
    '<div id="pickerGrid" style="flex:1;overflow-y:auto;padding:18px;display:grid;grid-template-columns:repeat(4,1fr);gap:12px;"></div>' +
    '<div style="padding:14px 22px;border-top:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;">' +
    '<button class="btn btn-ghost btn-sm" onclick="triggerUploadFromPicker()">↑ Upload new</button>' +
    '<button class="btn btn-ghost btn-sm" onclick="closeMediaPicker()">Cancel</button>' +
    "</div></div>";
  document.body.appendChild(modal);
  modal.addEventListener("click", function (e) {
    if (e.target === modal) closeMediaPicker();
  });

  if (mediaItems.length === 0)
    listBlobs(function () {
      renderPickerGrid("");
    });
  else renderPickerGrid("");
}

function renderPickerGrid(search) {
  var items = mediaItems.filter(function (m) {
    return (
      (_pickerType === "all" || m.type === _pickerType) &&
      (!search || m.name.toLowerCase().includes(search.toLowerCase()))
    );
  });
  var grid = document.getElementById("pickerGrid");
  if (!grid) return;

  if (!items.length) {
    grid.style.display = "block";
    grid.innerHTML =
      '<div class="empty-state"><div class="es-icon">🗂</div><h4>No files</h4><p>Upload one first</p></div>';
    return;
  }

  grid.style.display = "grid";
  grid.innerHTML = items
    .map(function (m, i) {
      return (
        '<div class="picker-cell" data-index="' +
        i +
        '" style="cursor:pointer;border:2px solid #e0ddd6;border-radius:10px;overflow:hidden;">' +
        '<div style="height:90px;background:#f5f4f0;display:flex;align-items:center;justify-content:center;font-size:32px;">' +
        (m.type === "video" ? "🎬" : "🖼") +
        "</div>" +
        '<div style="padding:8px 10px;border-top:1px solid #e0ddd6;">' +
        '<div style="font-size:11px;font-weight:bold;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="' +
        m.name +
        '">' +
        m.name +
        "</div>" +
        '<div style="font-size:10px;color:#888;">' +
        formatSize(m.size) +
        "</div>" +
        "</div>" +
        "</div>"
      );
    })
    .join("");

  // Delegation — hover and click handled here, no inline handlers
  grid.onclick = function (ev) {
    var cell = ev.target;
    while (cell && cell !== grid) {
      if (cell.classList && cell.classList.contains("picker-cell")) break;
      cell = cell.parentNode;
    }
    if (!cell || !cell.dataset || cell.dataset.index === undefined) return;
    var m = items[Number(cell.dataset.index)];
    if (!m) return;
    // Build full blob URL to pass to callback, keep raw name for path storage
    var url = blobUrl(m.name);
    closeMediaPicker();
    if (_pickerCallback) _pickerCallback(url, m.name);
    _pickerCallback = null;
  };

  grid.onmouseover = function (ev) {
    var cell = ev.target;
    while (cell && cell !== grid) {
      if (cell.classList && cell.classList.contains("picker-cell")) break;
      cell = cell.parentNode;
    }
    if (cell && cell.classList && cell.classList.contains("picker-cell")) {
      cell.style.borderColor = "#3ab3e5";
    }
  };

  grid.onmouseout = function (ev) {
    var cell = ev.target;
    while (cell && cell !== grid) {
      if (cell.classList && cell.classList.contains("picker-cell")) break;
      cell = cell.parentNode;
    }
    if (cell && cell.classList && cell.classList.contains("picker-cell")) {
      cell.style.borderColor = "#e0ddd6";
    }
  };
}

function closeMediaPicker() {
  var m = document.getElementById("mediaPickerModal");
  if (m) m.remove();
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

// ===== ACCESS DENIED =====
function renderAccessDenied() {
  document.getElementById("mainArea").innerHTML =
    '<div class="access-denied"><div class="ad-icon">🔒</div>' +
    "<h3>Dashboard access is restricted to BPM users</h3>" +
    "<p>Switch to a BPM account to manage initiative data and metrics.</p></div>";
}

// ===== DASHBOARD NAV TOGGLE =====
function toggleDashboardNav() {
  var el = document.getElementById("dashNavItems");
  var arrow = document.getElementById("dashNavArrow");
  var collapsed = el.style.display === "none";
  el.style.display = collapsed ? "" : "none";
  arrow.style.transform = collapsed ? "" : "rotate(-90deg)";
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
// Load Cosmos data first, then let content-store.js render once the draft loads.
loadDataFromApi();
showPanel("stream_rpa");
