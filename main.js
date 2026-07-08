// ===== STATE =====
let currentRole = "bpm";
let currentPanel = "initiatives";
let drafts = {};

var API_BASE =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:5000/api" // Flask dev server
    : "/api";

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
const DIVISIONS = [
  "Operations & Process",
  "Finance & Treasury",
  "Risk & Credit",
  "Wealth & Trustee",
  "Retail & Digital Banking",
  "Corporate & Investment Banking",
  "Customer Experience",
];
const DEPARTMENTS = [
  "Operations",
  "Finance",
  "Contact Centre",
  "Trustee Services",
  "Credit",
  "FX Desk",
  "Investment Banking",
  "Retail Banking",
];
const DEPT_BY_DIVISION = {
  "Operations & Process": ["Operations"],
  "Finance & Treasury": ["Finance", "FX Desk"],
  "Risk & Credit": ["Credit"],
  "Wealth & Trustee": ["Trustee Services"],
  "Retail & Digital Banking": ["Retail Banking"],
  "Corporate & Investment Banking": ["Investment Banking"],
  "Customer Experience": ["Contact Centre"],
};

// Sample initiative data (mirrors Dashboard)
let initiatives = [
  {
    id: "NX-1042",
    name: "Document Approval, reimagined",
    department: "Operations",
    division: "Operations & Process",
    status: "Deployed",
    vertical: "PowerApps",
    quant: "68% faster TAT",
    qual: "Approvers report far less back-and-forth chasing.",
    manHours: 3200,
    tat: 68,
    costSavings: 4200000,
  },
  {
    id: "NX-1051",
    name: "Etims invoice automation",
    department: "Finance",
    division: "Finance & Treasury",
    status: "Deployed",
    vertical: "RPA",
    quant: "2,100 hrs saved",
    qual: "Finance no longer dreads month-end.",
    manHours: 2100,
    tat: 54,
    costSavings: 3100000,
  },
  {
    id: "NX-1058",
    name: "AI Credit Memo",
    department: "Credit",
    division: "Risk & Credit",
    status: "UAT",
    vertical: "AI",
    quant: "1,800 hrs saved",
    qual: "Analysts edit instead of starting from scratch.",
    manHours: 1800,
    tat: 41,
    costSavings: 2400000,
  },
  {
    id: "NX-1063",
    name: "FX Pre Trade checks",
    department: "FX Desk",
    division: "Finance & Treasury",
    status: "Build",
    vertical: "Power Agents",
    quant: "1,450 hrs saved",
    qual: "Traders catch issues before they become problems.",
    manHours: 1450,
    tat: 37,
    costSavings: 1900000,
  },
  {
    id: "NX-1071",
    name: "Trustee Service workflow",
    department: "Trustee Services",
    division: "Wealth & Trustee",
    status: "Deployed",
    vertical: "IBPS",
    quant: "1,200 hrs saved",
    qual: "Clients get same-day responses.",
    manHours: 1200,
    tat: 33,
    costSavings: 1500000,
  },
  {
    id: "NX-1077",
    name: "NCBA Now · DocuSign",
    department: "Retail Banking",
    division: "Retail & Digital Banking",
    status: "Deployed",
    vertical: "DocuSign",
    quant: "980 hrs saved",
    qual: "Customers stop needing to visit a branch to sign.",
    manHours: 980,
    tat: 29,
    costSavings: 1100000,
  },
  {
    id: "NX-1083",
    name: "Investment Banking flow",
    department: "Investment Banking",
    division: "Corporate & Investment Banking",
    status: "UAT",
    vertical: "Enterprise",
    quant: "860 hrs saved",
    qual: "Confirmations route themselves.",
    manHours: 860,
    tat: 26,
    costSavings: 980000,
  },
  {
    id: "NX-1089",
    name: "Non-SAP reconciliation",
    department: "Finance",
    division: "Finance & Treasury",
    status: "CAB",
    vertical: "RPA",
    quant: "740 hrs saved",
    qual: "Finance closes books days earlier.",
    manHours: 740,
    tat: 22,
    costSavings: 850000,
  },
];

let metrics = { manHours: 13950, avgTat: 33, costSavings: 17400000 };

// let contentData = {
//   landing: { featuredInitiative: 'NX-1042', pageHighlight: 'Spotlight', pageHighlightNote: 'Meet the people behind the ideas', videoList: ['H1 Summary · Six months in review', 'EVA · The assistant behind REA'] },
//   reastory: { reaTitle: 'Real efficiency, automated.', reaBody: 'REA is the bank\'s push to automate the repetitive, the manual, and the slow.', bpmTitle: 'Business Process Management', bpmBody: 'The team behind every automation you see on this site.' },
//   portfolio: { rankOrder: ['NX-1042', 'NX-1051', 'NX-1058', 'NX-1063', 'NX-1071', 'NX-1077'], comingSoon: [{ name: 'Loan top-up automation', desc: 'Fewer forms, faster approval for existing customers.' }] },
//   spotlight: {
//     testimonials: [{ quote: 'We used to chase approvals for two days. Now I find out before lunch.', name: 'Process Owner', role: 'Operations' }, { quote: 'That job doesn\'t exist anymore — and honestly, I don\'t miss it.', name: 'Process Owner', role: 'Finance' }],
//     people: [{ name: 'Team member', contribution: 'Submitted the idea behind Document Approval', tag: 'Submitter' }],
//     ideas: [{ title: 'A 5-minute fix nobody noticed', badge: 'Subtly major', desc: 'One routing change that quietly saved every branch a daily headache.' }]
//   },
//   whatsnew: { spotlightTitle: 'NCBA Now just got a DocuSign upgrade', spotlightBody: 'Contracts that used to take three signatures now close in minutes.', buzzItems: ['Etims invoice automation just hit 2,000 hours saved', 'Three initiatives quietly moved to UAT this week', 'Someone in BPM finally automated the thing everyone complained about'] }
// };

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

// ===== CORE ROUTING =====
function showPanel(panel) {
  if (panel.startsWith("stream_")) {
    if (currentRole !== "bpm") {
      renderAccessDenied();
      return;
    }
  }
  currentPanel = panel;
  var navItems = document.querySelectorAll(".nav-item");
  for (var i = 0; i < navItems.length; i++) {
    navItems[i].classList.toggle("active", navItems[i].dataset.panel === panel);
  }
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

// ===== UTILITIES =====
function header(title, desc, actions) {
  return (
    '<div class="main-header"><div class="main-header-left"><h2>' +
    title +
    "</h2><p>" +
    desc +
    '</p></div><div class="main-header-actions">' +
    (actions || "") +
    "</div></div>"
  );
}

function draftBar(section) {
  if (!drafts[section]) return "";
  return (
    '<div class="draft-bar"><div class="db-left"><span class="db-icon">\uD83D\uDFE1</span>Unsaved draft — changes not yet published to the live site.</div>' +
    '<div style="display:flex;gap:8px;">' +
    '<button class="btn btn-ghost btn-sm" onclick="discardDraft(\'' +
    section +
    "')\">Discard draft</button>" +
    '<button class="btn btn-publish btn-sm" onclick="publishSection(\'' +
    section +
    "')\">\u2191 Publish</button>" +
    "</div></div>"
  );
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

// function publishSection(section) {
//   clearDraft(section);
//   showToast('Published \u2713 Changes are now live on the storyhub.', 'success');
//   render();
// }

// function discardDraft(section) {
//   clearDraft(section);
//   showToast('Draft discarded.', 'info');
//   render();
// }

function renderAccessDenied() {
  document.getElementById("mainArea").innerHTML =
    '<div class="access-denied"><div class="ad-icon">\uD83D\uDD12</div>' +
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

// ===== STREAM SCHEMAS =====
// One Cosmos DB container, partitioned by deliveryStream field
var STREAM_META = {
  rpa: {
    label: "RPA",
    description:
      "Robotic Process Automation initiatives — one container, partitioned by deliveryStream: rpa",
    cols: [
      {
        key: "nexusId",
        label: "Nexus ID",
        type: "text",
        readonly: true,
        short: true,
      },
      { key: "processName", label: "Process name", type: "text" },
      { key: "status", label: "Status", type: "status", short: true },
      {
        key: "department",
        label: "Department",
        type: "select",
        opts: "DEPARTMENTS",
      },
      { key: "division", label: "Division", type: "select", opts: "DIVISIONS" },
      { key: "country", label: "Country", type: "text", short: true },
      {
        key: "problemStatement",
        label: "Problem statement",
        type: "textarea",
        hidden: true,
      },
      {
        key: "proposedSolution",
        label: "Proposed solution",
        type: "textarea",
        hidden: true,
      },
      { key: "manHours", label: "Man hours", type: "number", short: true },
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
      { key: "processOwner", label: "Process owner", type: "text" },
      { key: "benefitsSigned", label: "Benefits signed off", type: "text" },
      { key: "developer", label: "Developer", type: "text", hidden: true },
      { key: "architect", label: "Architect", type: "text", hidden: true },
      { key: "analyst", label: "Analyst", type: "text", hidden: true },
      { key: "comments", label: "Comments", type: "textarea", hidden: true },
    ],
  },
  powerapps: {
    label: "PowerApps",
    description: "PowerApps initiatives — deliveryStream: powerapps",
    cols: null, // same as rpa — set below
  },
  poweragents: {
    label: "Power Agents",
    description: "Power Agents initiatives — deliveryStream: poweragents",
    cols: null, // same as rpa — set below
  },
  ibps: {
    label: "IBPS",
    description: "IBPS initiatives — deliveryStream: ibps",
    cols: [
      {
        key: "nexusId",
        label: "Nexus ID",
        type: "text",
        readonly: true,
        short: true,
      },
      { key: "processName", label: "Process name", type: "text" },
      { key: "status", label: "Status", type: "status", short: true },
      {
        key: "department",
        label: "Department",
        type: "select",
        opts: "DEPARTMENTS",
      },
      { key: "division", label: "Division", type: "select", opts: "DIVISIONS" },
      {
        key: "problemStatement",
        label: "Problem statement",
        type: "textarea",
        hidden: true,
      },
      {
        key: "proposedSolution",
        label: "Proposed solution",
        type: "textarea",
        hidden: true,
      },
      { key: "manHours", label: "Man hours", type: "number", short: true },
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
      },
      { key: "targetCompletion", label: "Target completion", type: "date" },
      { key: "processOwner", label: "Process owner", type: "text" },
      { key: "bpmOwner", label: "BPM owner", type: "text" },
      { key: "benefitsSigned", label: "Benefits signed off", type: "text" },
      { key: "comments", label: "Comments", type: "textarea", hidden: true },
    ],
  },
  docusign: {
    label: "DocuSign",
    description: "DocuSign initiatives — deliveryStream: docusign",
    cols: [
      {
        key: "nexusId",
        label: "Nexus ID",
        type: "text",
        readonly: true,
        short: true,
      },
      { key: "processName", label: "Process name", type: "text" },
      { key: "status", label: "Status", type: "status", short: true },
      {
        key: "department",
        label: "Department",
        type: "select",
        opts: "DEPARTMENTS",
      },
      { key: "division", label: "Division", type: "select", opts: "DIVISIONS" },
      {
        key: "problemStatement",
        label: "Problem statement",
        type: "textarea",
        hidden: true,
      },
      {
        key: "proposedSolution",
        label: "Proposed solution",
        type: "textarea",
        hidden: true,
      },
      { key: "manHours", label: "Man hours", type: "number", short: true },
      {
        key: "paperSavings",
        label: "Paper savings",
        type: "number",
        short: true,
      },
      { key: "tat", label: "TAT", type: "text", short: true },
      {
        key: "costSavings",
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
      { key: "processOwner", label: "Process owner", type: "text" },
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
    description: "AI initiatives — deliveryStream: ai",
    cols: [
      {
        key: "nexusId",
        label: "Nexus ID",
        type: "text",
        readonly: true,
        short: true,
      },
      { key: "processName", label: "Process name", type: "text" },
      { key: "status", label: "Status", type: "status", short: true },
      {
        key: "department",
        label: "Department",
        type: "select",
        opts: "DEPARTMENTS",
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
      },
      {
        key: "proposedSolution",
        label: "Proposed solution",
        type: "textarea",
        hidden: true,
      },
      { key: "manHours", label: "Man hours", type: "number", short: true },
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
      { key: "processOwner", label: "Process owner", type: "text" },
      { key: "benefitsSigned", label: "Benefits signed off", type: "text" },
      { key: "developer", label: "Developer", type: "text", hidden: true },
      { key: "comments", label: "Comments", type: "textarea", hidden: true },
    ],
  },
};
// PowerApps and Power Agents share the same schema as RPA
STREAM_META.powerapps.cols = STREAM_META.rpa.cols;
STREAM_META.poweragents.cols = STREAM_META.rpa.cols;

// ===== PER-STREAM DATA STORE =====
// In production: each record has { deliveryStream, nexusId, ... } and is stored in one Cosmos container
var streamData = {
  rpa: [
    {
      nexusId: "NX-1042",
      processName: "Document Approval",
      status: "Deployed",
      department: "Operations",
      division: "Operations & Process",
      country: "Kenya",
      manHours: 3200,
      incrementalHours: 400,
      tatReduction: "68%",
      costSavings: 4200000,
      processOwner: "J. Kamau",
      benefitsSigned: "Yes",
      developer: "Dev A",
      architect: "Arch A",
      analyst: "Ana A",
      targetCompletion: "2026-03-01",
      problemStatement: "Manual approval routing caused 2-day delays.",
      proposedSolution: "PowerApps automated routing by type and value.",
      qualBenefits: "Approvers report far less back-and-forth.",
      comments: "",
    },
    {
      nexusId: "NX-1051",
      processName: "Etims Invoice Automation",
      status: "Deployed",
      department: "Finance",
      division: "Finance & Treasury",
      country: "Kenya",
      manHours: 2100,
      incrementalHours: 300,
      tatReduction: "54%",
      costSavings: 3100000,
      processOwner: "A. Omondi",
      benefitsSigned: "Yes",
      developer: "Dev B",
      architect: "Arch A",
      analyst: "Ana B",
      targetCompletion: "2026-02-15",
      problemStatement: "Daily manual re-keying of invoice data.",
      proposedSolution: "Bot extracts and validates directly from Etims.",
      qualBenefits: "Finance no longer dreads month-end.",
      comments: "",
    },
  ],
  powerapps: [],
  poweragents: [],
  ibps: [
    {
      nexusId: "NX-1089",
      processName: "Non-SAP Reconciliation",
      status: "CAB",
      department: "Finance",
      division: "Finance & Treasury",
      manHours: 740,
      paperPrintSavings: 120000,
      tatReduction: "22%",
      processOwner: "B. Wanjiru",
      bpmOwner: "BPM Lead",
      benefitsSigned: "Pending",
      targetCompletion: "2026-08-01",
      problemStatement: "Manual ledger reconciliation outside SAP.",
      proposedSolution: "Automated reconciliation bot.",
      qualBenefits: "Finance closes books days earlier.",
      comments: "",
    },
  ],
  docusign: [
    {
      nexusId: "NX-1077",
      processName: "NCBA Now · DocuSign",
      status: "Deployed",
      department: "Retail Banking",
      division: "Retail & Digital Banking",
      manHours: 980,
      paperSavings: 50000,
      tat: "29% faster",
      costSavings: 1100000,
      totalCostSavings: 1150000,
      processOwner: "M. Kariuki",
      bpmOwner: "BPM Lead",
      benefitsApproved: "Yes",
      benefitsValidated: "Finance",
      benefitsSigned: "Yes",
      targetCompletion: "2026-01-10",
      problemStatement: "Customers had to visit branch to sign contracts.",
      proposedSolution: "Native e-signature inside NCBA Now app.",
      qualBenefits: "No more branch visits for signatures.",
      comments: "",
    },
  ],
  ai: [
    {
      nexusId: "NX-1058",
      processName: "AI Credit Memo",
      status: "UAT",
      department: "Credit",
      division: "Risk & Credit",
      type: "Generative AI",
      vendor: "OpenAI",
      aiCluster: "Azure OpenAI",
      country: "Kenya",
      manHours: 1800,
      incrementalHours: 220,
      tatReduction: "41%",
      costSavings: 2400000,
      processOwner: "P. Ngugi",
      benefitsSigned: "Pending",
      developer: "Dev C",
      targetCompletion: "2026-07-01",
      problemStatement: "Credit memos written manually from scratch.",
      proposedSolution: "AI drafts memos from application data.",
      qualBenefits: "Analysts edit instead of starting from scratch.",
      comments: "",
    },
  ],
};

// ===== RENDER STREAM TABLE =====
function renderStream(streamKey) {
  var meta = STREAM_META[streamKey];
  var data = streamData[streamKey] || [];

  // Table shows non-hidden, non-textarea fields, capped at 7 columns to avoid overflow
  var tableCols = meta.cols
    .filter(function (c) {
      return !c.hidden && c.type !== "textarea";
    })
    .slice(0, 7);

  var thRow =
    tableCols
      .map(function (c) {
        return "<th>" + c.label + "</th>";
      })
      .join("") + "<th></th>";

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
            '<tr data-stream="' +
            streamKey +
            '" data-id="' +
            rec.nexusId +
            '">' +
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
      '" style="text-align:center;padding:32px;color:var(--txt2);">No records yet. Add the first one.</td></tr>';

  var h = header(
    meta.icon + " " + meta.label,
    meta.description,
    '<button class="btn btn-ghost btn-sm" data-action="sync">⟳ Sync</button>' +
      '<button class="btn btn-primary" data-action="new-stream" data-stream="' +
      streamKey +
      '">+ New record</button>',
  );

  document.getElementById("mainArea").innerHTML =
    h +
    '<div class="panel-body">' +
    '<div class="table-wrap">' +
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

  // Event delegation — edit, new, sync, and filter all handled here
  var _sk = streamKey;
  document.getElementById("mainArea").onclick = function (e) {
    var el = e.target;
    while (el && el !== this) {
      if (el.dataset && el.dataset.action) {
        if (el.dataset.action === "edit") {
          editStreamRecord(_sk, el.dataset.id);
          return;
        }
        if (el.dataset.action === "new-stream") {
          newStreamRecord(_sk);
          return;
        }
        if (el.dataset.action === "sync") {
          showToast("Cosmos DB synced ✓", "success");
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
  var tableCols = meta.cols
    .filter(function (c) {
      return !c.hidden && c.type !== "textarea";
    })
    .slice(0, 7);

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
  var newId = "NX-" + (1300 + (streamData[streamKey] || []).length);
  var rec = {
    nexusId: newId,
    processName: "New " + STREAM_META[streamKey].label + " initiative",
    status: "Pipeline",
    department: "Operations",
    division: "Operations & Process",
  };
  if (!streamData[streamKey]) streamData[streamKey] = [];
  streamData[streamKey].push(rec);
  editStreamRecord(streamKey, newId);
}

function editStreamRecord(streamKey, nexusId) {
  var meta = STREAM_META[streamKey];
  var rec = (streamData[streamKey] || []).find(function (r) {
    return r.nexusId === nexusId;
  });
  if (!rec) return;

  document.getElementById("drawerTitle").textContent =
    meta.icon + " " + meta.label + " — Edit record";
  document.getElementById("drawerSub").textContent =
    rec.nexusId + (rec.processName ? " · " + rec.processName : "");
  document.getElementById("drawerDelete").style.display = "";
  document.getElementById("drawerDelete").onclick = function () {
    if (!confirm("Delete " + rec.nexusId + "?")) return;
    streamData[streamKey] = (streamData[streamKey] || []).filter(function (r) {
      return r.nexusId !== nexusId;
    });
    closeDrawer();
    renderStream(streamKey);
  };

  var fields = meta.cols
    .map(function (col) {
      var val = rec[col.key] !== undefined ? rec[col.key] : "";
      var id = "sf_" + col.key;
      var input = "";

      if (col.readonly) {
        input =
          '<input id="' +
          id +
          '" value="' +
          val +
          '" readonly style="opacity:0.6;">';
      } else if (col.type === "status") {
        var opts = STATUSES.map(function (s) {
          return (
            "<option" + (s === val ? " selected" : "") + ">" + s + "</option>"
          );
        }).join("");
        input = '<select id="' + id + '">' + opts + "</select>";
      } else if (col.type === "select" && col.opts === "DIVISIONS") {
        var opts = DIVISIONS.map(function (d) {
          return (
            "<option" + (d === val ? " selected" : "") + ">" + d + "</option>"
          );
        }).join("");
        input = '<select id="' + id + '">' + opts + "</select>";
      } else if (col.type === "select" && col.opts === "DEPARTMENTS") {
        var opts = DEPARTMENTS.map(function (d) {
          return (
            "<option" + (d === val ? " selected" : "") + ">" + d + "</option>"
          );
        }).join("");
        input = '<select id="' + id + '">' + opts + "</select>";
      } else if (col.type === "textarea") {
        input =
          '<textarea id="' +
          id +
          '" style="min-height:70px;">' +
          val +
          "</textarea>";
      } else if (col.type === "number") {
        input = '<input id="' + id + '" type="number" value="' + val + '">';
      } else if (col.type === "date") {
        input = '<input id="' + id + '" type="date" value="' + val + '">';
      } else {
        input = '<input id="' + id + '" value="' + val + '">';
      }

      var isWide =
        col.type === "textarea" ||
        col.key === "processName" ||
        col.key === "problemStatement" ||
        col.key === "proposedSolution" ||
        col.key === "qualBenefits";

      return (
        '<div class="field"' +
        (isWide ? ' style="grid-column:span 2;"' : "") +
        ">" +
        "<label>" +
        col.label +
        "</label>" +
        input +
        "</div>"
      );
    })
    .join("");

  document.getElementById("drawerBody").innerHTML =
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">' +
    fields +
    "</div>";

  document.getElementById("drawerOverlay").className = "drawer-overlay open";
  window._editingType = "stream";
  window._editingStream = streamKey;
  window._editingNexusId = nexusId;
}

// Override saveDrawer for stream type
// var _origSaveDrawer = null;
// function saveDrawer() {
//   if (window._editingType === 'stream') {
//     var streamKey = window._editingStream;
//     var nexusId = window._editingNexusId;
//     var meta = STREAM_META[streamKey];
//     var rec = (streamData[streamKey] || []).find(function (r) { return r.nexusId === nexusId; });
//     if (rec) {
//       meta.cols.forEach(function (col) {
//         var el = document.getElementById('sf_' + col.key);
//         if (!el) return;
//         rec[col.key] = (col.type === 'number') ? (parseFloat(el.value) || 0) : el.value;
//       });
//     }
//     closeDrawer();
//     showToast('Saved to Cosmos DB ✓', 'success');
//     renderStream(streamKey);
//     return;
//   }
//   // Fall through to original handlers below
//   _saveDrawerOriginal();
// }

// function _saveDrawerOriginal() {
//   if (window._editingType === 'testimonial') {
//     var t = contentData.spotlight.testimonials[window._editingIdx];
//     t.quote = document.getElementById('f_tq').value;
//     t.name = document.getElementById('f_tn').value;
//     t.role = document.getElementById('f_tr').value;
//     markDraft('spotlight'); closeDrawer(); renderSpotlight();
//   } else if (window._editingType === 'person') {
//     var p = contentData.spotlight.people[window._editingIdx];
//     p.name = document.getElementById('f_pn').value;
//     p.contribution = document.getElementById('f_pc').value;
//     p.tag = document.getElementById('f_pt').value;
//     markDraft('spotlight'); closeDrawer(); renderSpotlight();
//   } else if (window._editingType === 'idea') {
//     var id = contentData.spotlight.ideas[window._editingIdx];
//     id.title = document.getElementById('f_it').value;
//     id.badge = document.getElementById('f_ib').value;
//     id.desc = document.getElementById('f_id').value;
//     markDraft('spotlight'); closeDrawer(); renderSpotlight();
//   } else if (window._editingType === 'storypack') {
//     markDraft('portfolio'); closeDrawer(); showToast('Story pack saved as draft ✓', 'info'); renderPortfolio();
//   } else {
//     closeDrawer();
//   }
// }

// showPanel and render defined above

// ===== PANEL: LANDING PAGE =====
// function renderLanding() {
//   var d = contentData.landing;
//   var initOpts = initiatives.map(function (i) { return '<option' + (i.id === d.featuredInitiative ? ' selected' : '') + ' value="' + i.id + '">' + i.name + '</option>'; }).join('');
//   var sectionOpts = ['REA Story', 'Innovation Portfolio', 'Spotlight', 'What\'s New'].map(function (s) { return '<option' + (s === d.pageHighlight ? ' selected' : '') + '>' + s + '</option>'; }).join('');
//   var videos = d.videoList.map(function (v, idx) { return '<div class="list-item"><span class="li-drag">⠿</span><div class="li-body"><div class="li-title">' + v + '</div></div><div class="li-actions"><button class="btn btn-ghost btn-sm btn-icon" onclick="removeVideo(' + idx + ')">✕</button></div></div>'; }).join('');
//   var h = header('Landing page', 'Edit the editorial slots shown on the landing page.', drafts.landing ? '<button class="btn btn-ghost btn-sm" onclick="discardDraft(\'landing\')">Discard draft</button><button class="btn btn-publish" onclick="publishSection(\'landing\')">↑ Publish</button>' : '');
//   var body = '<div class="panel-body">'
//     + draftBar('landing')
//     + '<div class="section-card"><h4>Featured initiative</h4><div class="sc-sub">Editorially chosen — appears as the large spotlight card on the landing page.</div>'
//     + '<div class="form-grid" style="grid-template-columns:1fr;gap:14px;">'
//     + '<div class="field"><label>Initiative</label><select onchange="updateLanding(\'featuredInitiative\',this.value)">' + initOpts + '</select><div class="field-hint">This is not date-driven — choose whatever you most want featured.</div></div>'
//     + '</div></div>'
//     + '<div class="section-card"><h4>Page highlight</h4><div class="sc-sub">Rotating callout into a sub-section — editorial pick, changes each cycle.</div>'
//     + '<div class="form-grid" style="grid-template-columns:1fr 1fr;gap:14px;">'
//     + '<div class="field"><label>Section to spotlight</label><select onchange="updateLanding(\'pageHighlight\',this.value)">' + sectionOpts + '</select></div>'
//     + '<div class="field"><label>Teaser note</label><input value="' + d.pageHighlightNote + '" onchange="updateLanding(\'pageHighlightNote\',this.value)"></div>'
//     + '</div></div>'
//     + '<div class="section-card"><h4>Video highlights</h4><div class="sc-sub">Order them by dragging. First video is H1 summary by convention.</div>'
//     + videos
//     + '<button class="add-btn" onclick="addVideo()">+ Add video</button>'
//     + '</div></div>';
//   document.getElementById('mainArea').innerHTML = h + draftBar('landing') + body.replace(draftBar('landing'), '');
//   document.getElementById('mainArea').innerHTML = h + draftBar('landing') + '<div class="panel-body">'
//     + '<div class="section-card"><h4>Featured initiative</h4><div class="sc-sub">Editorially chosen — appears as the large spotlight card on the landing page.</div>'
//     + '<div class="field"><label>Initiative</label><select onchange="updateLanding(\'featuredInitiative\',this.value)">' + initOpts + '</select><div class="field-hint">Not date-driven — pick whatever you most want featured right now.</div></div></div>'
//     + '<div class="section-card"><h4>Page highlight</h4><div class="sc-sub">Rotating callout into a sub-section — editorial pick each cycle.</div>'
//     + '<div class="form-grid" style="grid-template-columns:1fr 1fr;gap:14px;">'
//     + '<div class="field"><label>Section to spotlight</label><select onchange="updateLanding(\'pageHighlight\',this.value)">' + sectionOpts + '</select></div>'
//     + '<div class="field"><label>Teaser note</label><input value="' + d.pageHighlightNote + '" onchange="updateLanding(\'pageHighlightNote\',this.value)"></div>'
//     + '</div></div>'
//     + '<div class="section-card"><h4>Video highlights</h4><div class="sc-sub">Controls the scrollable video shelf on the landing page.</div>'
//     + videos
//     + '<button class="add-btn" onclick="addVideo()">+ Add video</button></div>'
//     + '</div>';
// }
// function updateLanding(key, val) { contentData.landing[key] = val; markDraft('landing'); }
// function addVideo() {
//   openMediaPicker('video', function (url, name) {
//     contentData.landing.videoList.push(name);
//     markDraft('landing');
//     renderLanding();
//   });
// }
// function removeVideo(idx) { contentData.landing.videoList.splice(idx, 1); markDraft('landing'); renderLanding(); }

// // ===== PANEL: REA STORY =====
// function renderREAStory() {
//   var d = contentData.reastory;
//   var h = header('REA Story', 'Edit the two scroll panels: REA background and the BPM team introduction.', drafts.reastory ? '<button class="btn btn-ghost btn-sm" onclick="discardDraft(\'reastory\')">Discard draft</button><button class="btn btn-publish" onclick="publishSection(\'reastory\')">↑ Publish</button>' : '');
//   document.getElementById('mainArea').innerHTML = h + draftBar('reastory') + '<div class="panel-body">'
//     + '<div class="section-card"><h4>Panel 1 — REA background</h4><div class="sc-sub">The first scroll panel: what REA is.</div>'
//     + '<div class="form-grid" style="grid-template-columns:1fr;gap:14px;">'
//     + '<div class="field"><label>Headline</label><input value="' + d.reaTitle + '" oninput="updateStory(\'reaTitle\',this.value)"></div>'
//     + '<div class="field"><label>Body copy</label><textarea oninput="updateStory(\'reaBody\',this.value)">' + d.reaBody + '</textarea></div>'
//     + '<div class="field"><label>Photo</label><div id="reastory_photo" style="border:1px dashed var(--border);border-radius:8px;padding:18px;display:flex;align-items:center;gap:12px;cursor:pointer;" onclick="openMediaPicker(\'image\',function(url,name){ document.getElementById(\'reastory_photo_url\').value=url; document.getElementById(\'reastory_photo_preview\').textContent=name; updateStory(\'reaPhoto\',url); })"><span style="font-size:22px;">📷</span><div><div style="font-size:13px;font-weight:bold;color:var(--med);">Choose from media library</div><div style="font-size:11px;color:var(--txt2);margin-top:2px;" id="reastory_photo_preview">No photo selected</div></div></div><input type="hidden" id="reastory_photo_url"></div>'
//     + '</div></div>'
//     + '<div class="section-card"><h4>Panel 2 — BPM team <span style="font-size:11px;font-weight:normal;color:var(--txt2);margin-left:6px;">Content pending</span></h4><div class="sc-sub">The second scroll panel: who drives REA. BPM content pack required.</div>'
//     + '<div class="form-grid" style="grid-template-columns:1fr;gap:14px;">'
//     + '<div class="field"><label>Department headline</label><input value="' + d.bpmTitle + '" oninput="updateStory(\'bpmTitle\',this.value)"></div>'
//     + '<div class="field"><label>Department description</label><textarea oninput="updateStory(\'bpmBody\',this.value)">' + d.bpmBody + '</textarea></div>'
//     + '</div>'
//     + '<div style="margin-top:16px;"><div style="font-size:12px;font-weight:bold;color:var(--txt2);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">Team members</div>'
//     + '<div class="list-item"><span class="li-drag">⠿</span><div class="li-body"><div class="li-title">Team member · Role pending</div></div><div class="li-actions"><button class="btn btn-ghost btn-sm btn-icon">✎</button><button class="btn btn-ghost btn-sm btn-icon">✕</button></div></div>'
//     + '<button class="add-btn" onclick="alert(\'Add team member form coming soon\')">+ Add team member</button></div>'
//     + '</div></div>';
// }
// function updateStory(key, val) { contentData.reastory[key] = val; markDraft('reastory'); }

// // ===== PANEL: INNOVATION PORTFOLIO =====
// function renderPortfolio() {
//   var d = contentData.portfolio;
//   var ranked = d.rankOrder.map(function (id, idx) {
//     var i = initiatives.find(function (x) { return x.id === id; }) || { name: id };
//     return '<div class="list-item"><span style="font-size:22px;font-weight:bold;color:var(--txt2);opacity:0.25;width:28px;flex-shrink:0;">' + (idx + 1) + '</span><div class="li-body"><div class="li-title">' + i.name + '</div><div class="li-sub">' + id + '</div></div><div class="li-actions"><button class="btn btn-ghost btn-sm btn-icon" onclick="moveRank(\'' + id + '\',-1)">↑</button><button class="btn btn-ghost btn-sm btn-icon" onclick="moveRank(\'' + id + '\',1)">↓</button><button class="btn btn-ghost btn-sm" onclick="editStoryPack(\'' + id + '\')">Story pack ✎</button></div></div>';
//   }).join('');
//   var coming = d.comingSoon.map(function (c, idx) {
//     return '<div class="list-item"><span class="li-drag">⠿</span><div class="li-body"><div class="li-title">' + c.name + '</div><div class="li-sub">' + c.desc + '</div></div><div class="li-actions"><button class="btn btn-ghost btn-sm btn-icon" onclick="removeComingSoon(' + idx + ')">✕</button></div></div>';
//   }).join('');
//   var h = header('Innovation Portfolio', 'Manage the ranked shelf, story packs, coming soon list, and video highlights.', drafts.portfolio ? '<button class="btn btn-ghost btn-sm" onclick="discardDraft(\'portfolio\')">Discard</button><button class="btn btn-publish" onclick="publishSection(\'portfolio\')">↑ Publish</button>' : '');
//   document.getElementById('mainArea').innerHTML = h + draftBar('portfolio') + '<div class="panel-body">'
//     + '<div class="section-card"><h4>Top initiatives ranking</h4><div class="sc-sub">Drag or use arrows to reorder. Each initiative links to its story pack.</div>' + ranked + '</div>'
//     + '<div class="section-card"><h4>Coming soon</h4><div class="sc-sub">Name + one-line description — shown with the same visual weight as deployed initiatives.</div>' + coming + '<button class="add-btn" onclick="addComingSoon()">+ Add coming soon initiative</button></div>'
//     + '</div>';
// }
// function moveRank(id, dir) {
//   var arr = contentData.portfolio.rankOrder;
//   var idx = arr.indexOf(id);
//   var newIdx = idx + dir;
//   if (newIdx < 0 || newIdx >= arr.length) return;
//   arr.splice(idx, 1); arr.splice(newIdx, 0, id);
//   markDraft('portfolio'); renderPortfolio();
// }
// function addComingSoon() {
//   var name = prompt('Initiative name:'); if (!name) return;
//   var desc = prompt('One-line description:'); if (!desc) return;
//   contentData.portfolio.comingSoon.push({ name: name, desc: desc });
//   markDraft('portfolio'); renderPortfolio();
// }
// function removeComingSoon(idx) { contentData.portfolio.comingSoon.splice(idx, 1); markDraft('portfolio'); renderPortfolio(); }
// function editStoryPack(id) {
//   var i = initiatives.find(function (x) { return x.id === id; }) || { name: id };
//   document.getElementById('drawerTitle').textContent = 'Story pack — ' + i.name;
//   document.getElementById('drawerSub').textContent = 'Before / after · screenshots · impact · persona · video';
//   document.getElementById('drawerDelete').style.display = 'none';
//   document.getElementById('drawerBody').innerHTML = '<div class="form-grid" style="grid-template-columns:1fr;gap:14px;">'
//     + '<div class="field"><label>Persona name</label><input placeholder="e.g. The Approval Bottleneck Killer"></div>'
//     + '<div class="field"><label>Before (the problem)</label><textarea placeholder="Describe what the process looked like before this initiative."></textarea></div>'
//     + '<div class="field"><label>After (the outcome)</label><textarea placeholder="Describe how it works now."></textarea></div>'
//     + '<div class="field"><label>Impact numbers</label><input placeholder="e.g. 68% faster TAT, 3,200 hours saved"></div>'
//     + '<div class="field"><label>Video</label><div id="sp_video_pick" style="border:1px dashed var(--border);border-radius:8px;padding:16px;display:flex;align-items:center;gap:12px;cursor:pointer;" onclick="openMediaPicker(\'video\',function(url,name){ document.getElementById(\'sp_video_url\').textContent=name; })"><span style="font-size:20px;">🎬</span><div><div style="font-size:13px;font-weight:bold;color:var(--med);">Choose from media library</div><div style="font-size:11px;color:var(--txt2);margin-top:2px;" id="sp_video_url">No video selected</div></div></div></div>'
//     + '<div class="field"><label>Screenshots</label><div id="sp_screen_pick" style="border:1px dashed var(--border);border-radius:8px;padding:16px;display:flex;align-items:center;gap:12px;cursor:pointer;" onclick="openMediaPicker(\'image\',function(url,name){ var el=document.getElementById(\'sp_screens_list\'); el.innerHTML+=\'<div style=&quot;font-size:12px;padding:4px 0;border-bottom:1px solid var(--border);&quot;>\'+name+\'</div>\'; })"><span style="font-size:20px;">📎</span><div><div style="font-size:13px;font-weight:bold;color:var(--med);">Pick from media library</div><div style="font-size:11px;color:var(--txt2);">Add multiple screenshots</div></div></div><div id="sp_screens_list" style="margin-top:6px;"></div></div>'
//     + '</div>';
//   document.getElementById('drawerOverlay').className = 'drawer-overlay open';
//   window._editingType = 'storypack';
// }

// // ===== PANEL: SPOTLIGHT =====
// function renderSpotlight() {
//   var d = contentData.spotlight;
//   var testimonials = d.testimonials.map(function (t, idx) {
//     return '<div class="list-item"><span class="li-drag">⠿</span><div class="li-body"><div class="li-title">"' + t.quote.substring(0, 60) + '…"</div><div class="li-sub">' + t.name + ' · ' + t.role + '</div></div><div class="li-actions"><button class="btn btn-ghost btn-sm btn-icon" onclick="editTestimonial(' + idx + ')">✎</button><button class="btn btn-ghost btn-sm btn-icon" onclick="removeTestimonial(' + idx + ')">✕</button></div></div>';
//   }).join('');
//   var people = d.people.map(function (p, idx) {
//     return '<div class="list-item"><span class="li-drag">⠿</span><div class="li-body"><div class="li-title">' + p.name + '</div><div class="li-sub">' + p.contribution + ' · ' + p.tag + '</div></div><div class="li-actions"><button class="btn btn-ghost btn-sm btn-icon" onclick="editPerson(' + idx + ')">✎</button><button class="btn btn-ghost btn-sm btn-icon" onclick="removePerson(' + idx + ')">✕</button></div></div>';
//   }).join('');
//   var ideas = d.ideas.map(function (id, idx) {
//     return '<div class="list-item"><span class="li-drag">⠿</span><div class="li-body"><div class="li-title">' + id.title + '</div><div class="li-sub">' + id.badge + ' · ' + id.desc.substring(0, 50) + '…</div></div><div class="li-actions"><button class="btn btn-ghost btn-sm btn-icon" onclick="editIdea(' + idx + ')">✎</button><button class="btn btn-ghost btn-sm btn-icon" onclick="removeIdea(' + idx + ')">✕</button></div></div>';
//   }).join('');
//   var h = header('Spotlight', 'Curate the three sub-beats: Testimonials, People, and Ideas.', drafts.spotlight ? '<button class="btn btn-ghost btn-sm" onclick="discardDraft(\'spotlight\')">Discard</button><button class="btn btn-publish" onclick="publishSection(\'spotlight\')">↑ Publish</button>' : '');
//   document.getElementById('mainArea').innerHTML = h + draftBar('spotlight') + '<div class="panel-body">'
//     + '<div class="section-card"><h4>Testimonials</h4><div class="sc-sub">Process owner voices — impact received. Keep the set small and curated.</div>' + testimonials + '<button class="add-btn" onclick="addTestimonial()">+ Add testimonial</button></div>'
//     + '<div class="section-card"><h4>People</h4><div class="sc-sub">Who\'s driving innovative thinking — impact created.</div>' + people + '<button class="add-btn" onclick="addPerson()">+ Add person</button></div>'
//     + '<div class="section-card"><h4>Ideas</h4><div class="sc-sub">Creative, disruptive, or subtly major — by design, not by ranking.</div>' + ideas + '<button class="add-btn" onclick="addIdea()">+ Add idea</button></div>'
//     + '</div>';
// }
// function editTestimonial(idx) {
//   var t = contentData.spotlight.testimonials[idx];
//   document.getElementById('drawerTitle').textContent = 'Edit testimonial';
//   document.getElementById('drawerSub').textContent = t.name + ' · ' + t.role;
//   document.getElementById('drawerDelete').onclick = function () { contentData.spotlight.testimonials.splice(idx, 1); closeDrawer(); markDraft('spotlight'); renderSpotlight(); };
//   document.getElementById('drawerBody').innerHTML = '<div class="form-grid" style="grid-template-columns:1fr;gap:14px;">'
//     + '<div class="field"><label>Quote</label><textarea id="f_tq">' + t.quote + '</textarea></div>'
//     + '<div class="field"><label>Name</label><input id="f_tn" value="' + t.name + '"></div>'
//     + '<div class="field"><label>Role / Department</label><input id="f_tr" value="' + t.role + '"></div>'
//     + '</div>';
//   document.getElementById('drawerOverlay').className = 'drawer-overlay open';
//   window._editingType = 'testimonial'; window._editingIdx = idx;
// }
// function addTestimonial() { contentData.spotlight.testimonials.push({ quote: 'New testimonial', name: 'Process Owner', role: 'Department' }); editTestimonial(contentData.spotlight.testimonials.length - 1); }
// function removeTestimonial(idx) { contentData.spotlight.testimonials.splice(idx, 1); markDraft('spotlight'); renderSpotlight(); }
// function editPerson(idx) {
//   var p = contentData.spotlight.people[idx];
//   document.getElementById('drawerTitle').textContent = 'Edit person';
//   document.getElementById('drawerSub').textContent = p.name;
//   document.getElementById('drawerDelete').onclick = function () { contentData.spotlight.people.splice(idx, 1); closeDrawer(); markDraft('spotlight'); renderSpotlight(); };
//   document.getElementById('drawerBody').innerHTML = '<div class="form-grid" style="grid-template-columns:1fr;gap:14px;">'
//     + '<div class="field"><label>Name</label><input id="f_pn" value="' + p.name + '"></div>'
//     + '<div class="field"><label>Contribution</label><textarea id="f_pc">' + p.contribution + '</textarea></div>'
//     + '<div class="field"><label>Role tag (e.g. Submitter, Builder)</label><input id="f_pt" value="' + p.tag + '"></div>'
//     + '<div class="field"><label>Photo</label><div style="border:1px dashed var(--border);border-radius:8px;padding:16px;display:flex;align-items:center;gap:12px;cursor:pointer;" onclick="openMediaPicker(\'image\',function(url,name){ this.querySelector(\'div div:last-child\').textContent=name; }.bind(this))"><span style="font-size:20px;">📷</span><div><div style="font-size:13px;font-weight:bold;color:var(--med);">Choose from media library</div><div style="font-size:11px;color:var(--txt2);margin-top:2px;">No photo selected</div></div></div></div>'
//     + '</div>';
//   document.getElementById('drawerOverlay').className = 'drawer-overlay open';
//   window._editingType = 'person'; window._editingIdx = idx;
// }
// function addPerson() { contentData.spotlight.people.push({ name: 'Team member', contribution: '', tag: 'Submitter' }); editPerson(contentData.spotlight.people.length - 1); }
// function removePerson(idx) { contentData.spotlight.people.splice(idx, 1); markDraft('spotlight'); renderSpotlight(); }
// function editIdea(idx) {
//   var idea = contentData.spotlight.ideas[idx];
//   document.getElementById('drawerTitle').textContent = 'Edit idea';
//   document.getElementById('drawerSub').textContent = idea.title;
//   document.getElementById('drawerDelete').onclick = function () { contentData.spotlight.ideas.splice(idx, 1); closeDrawer(); markDraft('spotlight'); renderSpotlight(); };
//   var badges = ['Subtly major', 'Disruptive', 'Creative'].map(function (b) { return '<option' + (b === idea.badge ? ' selected' : '') + '>' + b + '</option>'; }).join('');
//   document.getElementById('drawerBody').innerHTML = '<div class="form-grid" style="grid-template-columns:1fr;gap:14px;">'
//     + '<div class="field"><label>Title</label><input id="f_it" value="' + idea.title + '"></div>'
//     + '<div class="field"><label>Badge</label><select id="f_ib">' + badges + '</select></div>'
//     + '<div class="field"><label>Description</label><textarea id="f_id">' + idea.desc + '</textarea></div>'
//     + '</div>';
//   document.getElementById('drawerOverlay').className = 'drawer-overlay open';
//   window._editingType = 'idea'; window._editingIdx = idx;
// }
// function addIdea() { contentData.spotlight.ideas.push({ title: 'New idea', badge: 'Creative', desc: '' }); editIdea(contentData.spotlight.ideas.length - 1); }
// function removeIdea(idx) { contentData.spotlight.ideas.splice(idx, 1); markDraft('spotlight'); renderSpotlight(); }

// // ===== PANEL: WHAT'S NEW =====
// function renderWhatsNew() {
//   var d = contentData.whatsnew;
//   var buzz = d.buzzItems.map(function (b, idx) {
//     return '<div class="list-item"><span class="li-drag">⠿</span><div class="li-body"><div class="li-title">' + b + '</div></div><div class="li-actions"><button class="btn btn-ghost btn-sm btn-icon" onclick="removeBuzz(' + idx + ')">✕</button></div></div>';
//   }).join('');
//   var h = header("What's New", "Edit the editor's pick spotlight and the five buzz feed cards.", drafts.whatsnew ? '<button class="btn btn-ghost btn-sm" onclick="discardDraft(\'whatsnew\')">Discard</button><button class="btn btn-publish" onclick="publishSection(\'whatsnew\')">↑ Publish</button>' : '');
//   document.getElementById('mainArea').innerHTML = h + draftBar('whatsnew') + '<div class="panel-body">'
//     + '<div class="section-card"><h4>Editor\'s pick</h4><div class="sc-sub">The large spotlight card — editorially chosen, not date-driven.</div>'
//     + '<div class="form-grid" style="grid-template-columns:1fr;gap:14px;">'
//     + '<div class="field"><label>Headline</label><input value="' + d.spotlightTitle + '" oninput="updateWN(\'spotlightTitle\',this.value)"></div>'
//     + '<div class="field"><label>Snippet</label><textarea oninput="updateWN(\'spotlightBody\',this.value)">' + d.spotlightBody + '</textarea></div>'
//     + '</div></div>'
//     + '<div class="section-card"><h4>Buzz feed <span style="font-size:11px;color:var(--txt2);font-weight:normal;margin-left:4px;">(' + d.buzzItems.length + ' of 5 slots used)</span></h4><div class="sc-sub">Casual, recency-driven items. Lighter tone than the spotlight card.</div>'
//     + buzz
//     + (d.buzzItems.length < 5 ? '<button class="add-btn" onclick="addBuzz()">+ Add buzz item</button>' : '<div class="field-hint" style="margin-top:8px;">5-slot limit reached. Remove an item to add another.</div>')
//     + '</div></div>';
// }
// function updateWN(key, val) { contentData.whatsnew[key] = val; markDraft('whatsnew'); }
// function addBuzz() { var t = prompt('Buzz item headline:'); if (t && contentData.whatsnew.buzzItems.length < 5) { contentData.whatsnew.buzzItems.push(t); markDraft('whatsnew'); renderWhatsNew(); } }
// function removeBuzz(idx) { contentData.whatsnew.buzzItems.splice(idx, 1); markDraft('whatsnew'); renderWhatsNew(); }

// ===== MEDIA LIBRARY — Azure Blob Storage backed =====

// INTEGRATION POINT: replace these with your real values from backend
var BLOB_CONFIG = {
  account: "bpmstoryhub",
  container: "media",
  sasToken: "", // must have: racwdl (read, add, create, write, delete, list)
};

var mediaItems = []; // populated from Blob Storage list API
var mediaLoading = false;
var mediaFilter = { type: "all", search: "" };

//fetch media from base URL
fetch(API_BASE + "/media-base-url")
  .then(function (r) {
    return r.json();
  })
  .then(function (data) {
    // BLOB_CONFIG.account = data.baseUrl.split(".")[0].replace("https://", "");
    BLOB_CONFIG.sasToken = data.sas;

    if (window.currentPanel === "media") renderMedia();
  });
// Derive blob URL from item name
function blobUrl(name) {
  return (
    "https://" +
    BLOB_CONFIG.account +
    ".blob.core.windows.net/media/" +
    encodeURIComponent(name) +
    "?" +
    BLOB_CONFIG.sasToken
  );
}

// List blobs from Azure Blob Storage
function listBlobs(callback) {
  mediaLoading = true;

  // INTEGRATION POINT: real fetch below — mocked until SAS token is wired
  if (BLOB_CONFIG.sasToken === "YOUR_SAS_TOKEN_HERE") {
    // Mock data so the UI is fully exercisable before backend is wired
    setTimeout(function () {
      mediaItems = [
        {
          name: "H1-Summary-Six-months-in-review.mp4",
          size: 88080384,
          lastModified: "2026-06-20",
          type: "video",
        },
        {
          name: "EVA-The-assistant-behind-REA.mp4",
          size: 58720256,
          lastModified: "2026-06-18",
          type: "video",
        },
        {
          name: "Document-Approval-before.png",
          size: 1258291,
          lastModified: "2026-06-15",
          type: "image",
        },
        {
          name: "Document-Approval-after.png",
          size: 943718,
          lastModified: "2026-06-15",
          type: "image",
        },
        {
          name: "REA-Story-team-photo.jpg",
          size: 2201088,
          lastModified: "2026-06-10",
          type: "image",
        },
        {
          name: "Etims-invoice-before.png",
          size: 876544,
          lastModified: "2026-06-08",
          type: "image",
        },
        {
          name: "NCBA-Now-DocuSign-screenshot.png",
          size: 1048576,
          lastModified: "2026-06-05",
          type: "image",
        },
      ];
      mediaLoading = false;
      if (callback) callback();
    }, 600);
    return;
  }

  // Real Azure Blob Storage list call
  fetch(API_BASE + "/media-list")
    .then(function (r) {
      return r.text();
    })
    .then(function (xml) {
      var parser = new DOMParser();
      var doc = parser.parseFromString(xml, "text/xml");
      var blobs = doc.querySelectorAll("Blob");
      mediaItems = [];
      blobs.forEach(function (b) {
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
    .catch(function (err) {
      console.error("Blob list error:", err);
      mediaLoading = false;
      if (callback) callback();
    });
}

// Upload a file to Blob Storage
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

  // INTEGRATION POINT: real PUT upload
  if (BLOB_CONFIG.sasToken === "YOUR_SAS_TOKEN_HERE") {
    // Simulate upload progress
    var pct = 0;
    var iv = setInterval(function () {
      pct += 20;
      if (onProgress) onProgress(pct);
      if (pct >= 100) {
        clearInterval(iv);
        mediaItems.unshift({
          name: name,
          size: file.size,
          lastModified: new Date().toISOString().split("T")[0],
          type: file.type.startsWith("video") ? "video" : "image",
        });
        if (onDone) onDone(name);
      }
    }, 300);
    return;
  }

  var xhr = new XMLHttpRequest();
  xhr.upload.onprogress = function (e) {
    if (e.lengthComputable && onProgress)
      onProgress(Math.round((e.loaded / e.total) * 100));
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

// Delete a blob from Blob Storage
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

  // INTEGRATION POINT: real DELETE call
  if (BLOB_CONFIG.sasToken === "YOUR_SAS_TOKEN_HERE") {
    setTimeout(function () {
      mediaItems = mediaItems.filter(function (m) {
        return m.name !== name;
      });
      if (onDone) onDone();
    }, 300);
    return;
  }

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
    .catch(function (err) {
      if (onError) onError(err.message);
    });
}

// Scan JSON content records to find where a blob URL is used
function findUsages(name) {
  var url = blobUrl(name);
  var usages = [];
  var content = JSON.stringify(contentData);
  if (content.includes(name)) usages.push("Content records");
  return usages;
}

function formatSize(bytes) {
  if (bytes > 1048576) return (bytes / 1048576).toFixed(1) + " MB";
  return (bytes / 1024).toFixed(0) + " KB";
}

function renderMedia() {
  var h = header(
    "Media library",
    "Upload and manage images and videos. Files are stored in Azure Blob Storage.",
    '<button class="btn btn-primary" onclick="triggerUpload()">↑ Upload media</button>' +
      '<input type="file" id="fileInput" accept="image/*,video/mp4,video/quicktime" multiple style="display:none" onchange="handleFiles(this.files)">',
  );
  document.getElementById("mainArea").innerHTML =
    h +
    '<div class="panel-body">' +
    '<div class="table-wrap">' +
    '<div class="table-toolbar">' +
    '<input class="search-input" placeholder="Search files…" oninput="mediaFilter.search=this.value;renderMediaGrid()" id="mediaSearch">' +
    '<div style="display:flex;gap:6px;margin-left:8px;">' +
    '<button class="btn btn-ghost btn-sm" onclick="mediaFilter.type=\'all\';renderMediaGrid()" id="mfAll">All</button>' +
    '<button class="btn btn-ghost btn-sm" onclick="mediaFilter.type=\'image\';renderMediaGrid()" id="mfImg">Images</button>' +
    '<button class="btn btn-ghost btn-sm" onclick="mediaFilter.type=\'video\';renderMediaGrid()" id="mfVid">Videos</button>' +
    "</div>" +
    '<span style="margin-left:auto;font-size:12px;color:var(--txt2);" id="mediaCount"></span>' +
    "</div>" +
    '<div id="uploadDropZone" style="margin:0;border:2px dashed var(--border);border-radius:0;padding:32px;text-align:center;background:var(--bg);display:none;">' +
    '<div style="font-size:24px;margin-bottom:8px;">📎</div>' +
    '<div style="font-size:13px;color:var(--txt2);">Drop files here to upload</div>' +
    "</div>" +
    '<div id="uploadProgress" style="display:none;padding:12px 18px;background:rgba(58,179,229,0.06);border-bottom:1px solid var(--border);">' +
    '<div style="font-size:12px;font-weight:bold;margin-bottom:6px;" id="uploadProgressLabel">Uploading…</div>' +
    '<div style="background:var(--border);border-radius:4px;height:6px;">' +
    '<div id="uploadProgressBar" style="background:var(--med);height:6px;border-radius:4px;width:0%;transition:width .2s;"></div>' +
    "</div>" +
    "</div>" +
    '<div id="mediaGridWrap"></div>' +
    "</div></div>";

  // Wire drag-and-drop on the whole panel-body
  var panel = document.querySelector(".panel-body");
  panel.addEventListener("dragover", function (e) {
    e.preventDefault();
    document.getElementById("uploadDropZone").style.display = "block";
  });
  panel.addEventListener("dragleave", function (e) {
    if (!panel.contains(e.relatedTarget))
      document.getElementById("uploadDropZone").style.display = "none";
  });
  panel.addEventListener("drop", function (e) {
    e.preventDefault();
    document.getElementById("uploadDropZone").style.display = "none";
    handleFiles(e.dataTransfer.files);
  });

  if (mediaItems.length === 0 && !mediaLoading) {
    listBlobs(renderMediaGrid);
    document.getElementById("mediaGridWrap").innerHTML =
      '<div class="empty-state"><div class="es-icon">⏳</div><h4>Loading from Blob Storage…</h4><p>Fetching your media files</p></div>';
  } else {
    renderMediaGrid();
  }
}

function renderMediaGrid() {
  var items = mediaItems.filter(function (m) {
    var typeOk = mediaFilter.type === "all" || m.type === mediaFilter.type;
    var searchOk =
      !mediaFilter.search ||
      m.name.toLowerCase().includes(mediaFilter.search.toLowerCase());
    return typeOk && searchOk;
  });

  document.getElementById("mediaCount").textContent =
    items.length + " file" + (items.length === 1 ? "" : "s");

  // Highlight active filter
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

  if (items.length === 0) {
    document.getElementById("mediaGridWrap").innerHTML =
      '<div class="empty-state"><div class="es-icon">🗂</div><h4>' +
      (mediaFilter.search || mediaFilter.type !== "all"
        ? "No files match this filter"
        : "No files yet") +
      "</h4><p>" +
      (mediaFilter.search || mediaFilter.type !== "all"
        ? "Try a different search or filter"
        : "Upload your first asset using the button above") +
      "</p></div>";
    return;
  }

  var rows = items
    .map(function (m) {
      var icon = m.type === "video" ? "🎬" : "🖼";
      var usages = findUsages(m.name);
      var usageStr = usages.length
        ? usages.join(", ")
        : '<span style="color:var(--txt2);opacity:0.5;">Not used</span>';
      return (
        "<tr>" +
        '<td style="font-size:18px;width:36px;">' +
        icon +
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
        usageStr +
        "</td>" +
        "<td>" +
        '<div style="display:flex;gap:6px;">' +
        '<button class="btn btn-ghost btn-sm" onclick="copyBlobUrl(\'' +
        m.name +
        "')\">Copy URL</button>" +
        '<button class="btn btn-danger btn-sm" onclick="confirmDeleteBlob(\'' +
        m.name +
        "')\">Delete</button>" +
        "</div>" +
        "</td>" +
        "</tr>"
      );
    })
    .join("");

  document.getElementById("mediaGridWrap").innerHTML =
    "<table><thead><tr><th></th><th>File name</th><th>Size</th><th>Uploaded</th><th>Used in</th><th></th></tr></thead><tbody>" +
    rows +
    "</tbody></table>";
}

function triggerUpload() {
  document.getElementById("fileInput").click();
}

function handleFiles(files) {
  if (!files || !files.length) return;
  var file = files[0]; // handle one at a time for simplicity
  var allowed = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "video/mp4",
    "video/quicktime",
  ];
  if (allowed.indexOf(file.type) === -1) {
    showToast(
      "File type not allowed. Use JPG, PNG, WebP, MP4 or MOV.",
      "danger",
    );
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
  label.textContent = "Uploading " + file.name + "…";
  bar.style.width = "0%";

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
      showToast("Blob URL copied ✓", "success");
    });
  } else {
    showToast("URL: " + url, "info");
  }
}

function confirmDeleteBlob(name) {
  var usages = findUsages(name);
  var msg = usages.length
    ? "This file is referenced in: " +
      usages.join(", ") +
      ". Deleting it will break those references. Delete anyway?"
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

// ===== MEDIA PICKER MODAL =====
// Called from any photo/video field — opens a filterable modal, returns selected blob URL via callback
var _pickerCallback = null;
var _pickerType = "all"; // 'image' or 'video'

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
    '<div><div style="font-size:15px;font-weight:bold;">Media library</div><div style="font-size:12px;color:var(--txt2);margin-top:2px;">Select a ' +
    (type || "file") +
    " to insert</div></div>" +
    '<div style="display:flex;gap:8px;align-items:center;">' +
    '<input id="pickerSearch" class="search-input" placeholder="Search…" style="max-width:200px;" oninput="renderPickerGrid(this.value)">' +
    '<button style="background:none;border:none;font-size:20px;color:var(--txt2);cursor:pointer;" onclick="closeMediaPicker()">✕</button>' +
    "</div>" +
    "</div>" +
    '<div id="pickerGrid" style="flex:1;overflow-y:auto;padding:18px;display:grid;grid-template-columns:repeat(4,1fr);gap:12px;"></div>' +
    '<div style="padding:14px 22px;border-top:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;">' +
    '<button class="btn btn-ghost btn-sm" onclick="triggerUploadFromPicker()">↑ Upload new</button>' +
    '<button class="btn btn-ghost btn-sm" onclick="closeMediaPicker()">Cancel</button>' +
    "</div>" +
    "</div>";
  document.body.appendChild(modal);
  modal.addEventListener("click", function (e) {
    if (e.target === modal) closeMediaPicker();
  });

  if (mediaItems.length === 0) {
    listBlobs(function () {
      renderPickerGrid("");
    });
  } else {
    renderPickerGrid("");
  }
}

function renderPickerGrid(search) {
  var items = mediaItems.filter(function (m) {
    var typeOk = _pickerType === "all" || m.type === _pickerType;
    var searchOk =
      !search || m.name.toLowerCase().includes(search.toLowerCase());
    return typeOk && searchOk;
  });
  var grid = document.getElementById("pickerGrid");
  if (!grid) return;
  if (items.length === 0) {
    grid.style.display = "block";
    grid.innerHTML =
      '<div class="empty-state"><div class="es-icon">🗂</div><h4>No ' +
      (_pickerType !== "all" ? _pickerType + "s" : "files") +
      "</h4><p>Upload one first</p></div>";
    return;
  }
  grid.style.display = "grid";
  grid.innerHTML = items
    .map(function (m) {
      var isVid = m.type === "video";
      return (
        "<div onclick=\"selectMediaItem('" +
        m.name +
        '\')" style="cursor:pointer;border:2px solid var(--border);border-radius:10px;overflow:hidden;transition:border-color .15s;" onmouseover="this.style.borderColor=\'var(--med)\'" onmouseout="this.style.borderColor=\'var(--border)\'">' +
        '<div style="height:90px;background:var(--bg);display:flex;align-items:center;justify-content:center;font-size:32px;">' +
        (isVid ? "🎬" : "🖼") +
        "</div>" +
        '<div style="padding:8px 10px;border-top:1px solid var(--border);">' +
        '<div style="font-size:11px;font-weight:bold;color:var(--txt);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="' +
        m.name +
        '">' +
        m.name +
        "</div>" +
        '<div style="font-size:10px;color:var(--txt2);margin-top:2px;">' +
        formatSize(m.size) +
        "</div>" +
        "</div>" +
        "</div>"
      );
    })
    .join("");
}

function selectMediaItem(name) {
  var url = blobUrl(name);
  closeMediaPicker();
  if (_pickerCallback) _pickerCallback(url, name);
  _pickerCallback = null;
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
    // After upload, refresh picker grid
    setTimeout(function () {
      renderPickerGrid(
        document.getElementById("pickerSearch")
          ? document.getElementById("pickerSearch").value
          : "",
      );
    }, 2000);
  };
  input.click();
}

// saveDrawer — handled by stream system above

// ===== PUBLISH / DISCARD =====
function publishSection(section) {
  clearDraft(section);
  showToast("Published ✓ Changes are now live on the storyhub.", "success");
  render();
}
function discardDraft(section) {
  clearDraft(section);
  showToast("Draft discarded.", "info");
  render();
}

// ===== ACCESS DENIED =====
function renderAccessDenied() {
  document.getElementById("mainArea").innerHTML =
    '<div class="access-denied"><div class="ad-icon">🔒</div><h3>Dashboard access is restricted to BPM users</h3><p>Switch to a BPM account to manage initiative data and metrics.</p></div>';
}

// ===== DRAWER UTILS =====
function closeDrawer(e) {
  if (e && e.target !== document.getElementById("drawerOverlay")) return;
  document.getElementById("drawerOverlay").className = "drawer-overlay";
  document.getElementById("drawerDelete").style.display = "";
}

// ===== TOAST =====
function showToast(msg, type) {
  var t = document.createElement("div");
  t.style.cssText =
    "position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:" +
    (type === "success"
      ? "#1a8a5a"
      : type === "info"
        ? "var(--brand)"
        : "var(--danger)") +
    ";color:#fff;font-size:13px;font-weight:bold;padding:10px 20px;border-radius:10px;z-index:9999;box-shadow:0 4px 14px rgba(0,0,0,0.2);";
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(function () {
    t.remove();
  }, 3000);
}

// Init
// showPanel("landing");
