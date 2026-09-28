/*
 * Main application code for the Marga Research Hub.
 * The page reads paper records from paper.json, prepares them for display,
 * and connects the search, filters, modals, saved papers, and other controls.
 */

// Restore the saved theme before the page is initialized.
(function () {
  try {
    var stored = localStorage.getItem("margaThemePref");
    var wantsDark = stored
      ? stored === "dark"
      : window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (wantsDark) document.documentElement.setAttribute("data-theme", "dark");
  } catch (e) { }
})();

// Remove the no-JavaScript fallback class now that this file is running.
document.body && document.body.classList.remove("no-js");


// Show fewer papers on small screens and more on larger screens.
const config = {
  breakpoints: {
    small: 0,
    medium: 500,
    large: 900
  }
};

function updateNumber() {
  const width = window.innerWidth;
  let paper_number = 1;

  if (width >= config.breakpoints.large) {
    paper_number = 10;
  } else if (width >= config.breakpoints.medium) {
    paper_number = 8;
  } else {
    paper_number = 5;
  }

  return paper_number;
}

(function () {
  "use strict";

  /* Settings used by the catalogue and its supporting features. */
  var CONTACT_EMAIL = "admin@margasrilanka.org";
  var STOREHOUSE_URL = "https://margastorehouse.org";
  // Live data comes from the Apps Script web app (URL ends in /exec). If it is slow or
  // unreachable, the site falls back to the paper.json shipped alongside it.
 
  // script.js
  var DATA_URL = "https://script.google.com/macros/s/AKfycbzQdyW1KDBDw-ThzYvk2stL8YxrLuqxNatpn9Z-B78kMW0GC6eVLIhK0jQamci9tLayzg/exec";
  var PAGE_SIZE = updateNumber();
  var ABSTRACT_TRUNCATE = 190;
  var TICKER_LIMIT = 20;
  var TOUR_STORAGE_KEY = "margaSiteTourSeen";
  var SAVED_STORAGE_KEY = "margaSavedPapers";
  var THEME_STORAGE_KEY = "margaThemePref";
  var VISITOR_API_BASE = "https://abacus.jasoncameron.dev";
  var VISITOR_NAMESPACE = "margasrilanka.org";
  var VISITOR_KEY = "research-hub-visits";
  var VISITOR_SESSION_KEY = "margaVisitorCounted";
  var VISITOR_CACHE_KEY = "margaVisitorCountCache";
  var TOUR_STEPS = [
    {
      title: "Search the catalogue",
      description:
        "Enter keywords, author names, or paper IDs in the search bar. Use the advanced filters to narrow by year, partner, field, or publication type."
    },
    {
      title: "View and request papers",
      description:
        "Open a paper record to read details. If the PDF URL is missing, use the Request Access button to ask for the paper."
    },
    {
      title: "Contact support",
      description:
        "Use the Contact Us button to email the team directly, or open the chat assistant for fast help with research, paper requests, or locating relevant work."
    },
    {
      title: "Save papers for later",
      description: " Click the Save button on any paper to add it to your personal collection. Access your saved papers from the Saved Papers section."
    },
    {
      title: "Marga Papers",
      description: "Marga Papers will have the Marga Logo on the top left corner of the paper card."
    }
  ];

  var PARTNER_LABELS = {
    cso: "Civil Society Organization",
    intl: "International Organization",
    gov: "Government Body",
    mcc: "Program Partner",
    org: "Partner Organization",
    "think-tank": "Think Tank"
  };

  var LITTYPE_LABELS = {
    published: "Published",
    unpublished: "Unpublished",
    presentation: "Presentation",
    report: "Report"
  };

    /* These small icons are kept in the file so catalogue icons do not depend
      on an external icon font being available. */
  var AREA_ICON_PATHS = {
    "fa-wheat-awn": '<path d="M12 21V4"/><circle cx="12" cy="5.5" r="1.15" fill="currentColor" stroke="none"/><circle cx="9.2" cy="8.6" r="1" fill="currentColor" stroke="none"/><circle cx="14.8" cy="8.6" r="1" fill="currentColor" stroke="none"/><circle cx="9.2" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="14.8" cy="12" r="1" fill="currentColor" stroke="none"/>',
    "fa-heartbeat": '<path d="M2.3 12.3h4l1.8-5 3 10.6 2-8 1.7 2.4h6.5"/>',
    "fa-gavel": '<rect x="11.6" y="2.6" width="4" height="7.2" rx="1" transform="rotate(45 13.6 6.2)"/><path d="M9.3 9.1L3.6 14.8M4.2 20.6h7.4"/>',
    "fa-handshake": '<circle cx="9" cy="12" r="4.1"/><circle cx="15" cy="12" r="4.1"/>',
    "fa-graduation-cap": '<path d="M12 5 2 9.5 12 14l10-4.5L12 5Z" stroke-linejoin="round"/><path d="M6 11.6V17c0 1 2.5 2.4 6 2.4s6-1.4 6-2.4v-5.4"/><path d="M21 9.5v5"/>',
    "fa-briefcase": '<rect x="3" y="8" width="18" height="11" rx="2"/><path d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M3 13h18"/>',
    "fa-scale-balanced": '<path d="M12 3v18M7 21h10"/><path d="M4 7h7M13 7h7"/><path d="M4 7l-2.5 5a2.5 2.5 0 0 0 5 0L4 7Z" stroke-linejoin="round"/><path d="M20 7l-2.5 5a2.5 2.5 0 0 0 5 0L20 7Z" stroke-linejoin="round"/>',
    "fa-child-reaching": '<circle cx="12" cy="5" r="2"/><path d="M12 7.1v6.8M12 9.2l4-4M12 9.2l-3 3M9 21l3-7M15 21l-3-7"/>',
    "fa-map-marked-alt": '<path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21Z" stroke-linejoin="round"/><circle cx="12" cy="9.3" r="2.2"/>',
    "fa-landmark": '<path d="M3 21h18M4 21v-7M20 21v-7M2 10l10-6 10 6M7 10v7M12 10v7M17 10v7"/>',
    "fa-bus": '<rect x="3" y="5" width="18" height="11" rx="2"/><path d="M3 11h18M6 8h4M14 8h4"/><circle cx="7.5" cy="18.4" r="1.5" fill="currentColor" stroke="none"/><circle cx="16.5" cy="18.4" r="1.5" fill="currentColor" stroke="none"/>',
    "fa-road": '<path d="M9 3 4 21M15 3l5 18"/><path d="M12 3.5v3M12 9.5v3M12 15.5v3"/>',
    "fa-building": '<rect x="5" y="3" width="14" height="18" rx="1"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2"/><path d="M10 21v-4h4v4"/>',
    "fa-leaf": '<path d="M4 20c8 0 14-5 15-15C10 6 5 11 4 20Z" stroke-linejoin="round"/><path d="M6.5 17.5C10 13 14 10 18 6"/>',
    "fa-laptop": '<rect x="4" y="4.5" width="16" height="10.5" rx="1.2"/><path d="M2 18.5h20l-2-3H4l-2 3Z" stroke-linejoin="round"/>'
  };
  var AREA_ICON_FALLBACK = '<path d="M6 3h9l3 3v15H6z" stroke-linejoin="round"/><path d="M9 10h6M9 13.5h6M9 17h4"/>';

  function iconSvg(key) {
    var body = AREA_ICON_PATHS[key] || AREA_ICON_FALLBACK;
    return (
      '<span class="area-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' +
      body +
      "</svg></span>"
    );
  }

  var SVG_SAVE =
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 3.5h12a1 1 0 0 1 1 1V21l-7-4-7 4V4.5a1 1 0 0 1 1-1Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>';
  var SVG_SHARE =
    '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="6" cy="12" r="2.4" stroke="currentColor" stroke-width="1.8"/><circle cx="18" cy="6" r="2.4" stroke="currentColor" stroke-width="1.8"/><circle cx="18" cy="18" r="2.4" stroke="currentColor" stroke-width="1.8"/><path d="M8.1 10.8l7.8-4.2M8.1 13.2l7.8 4.2" stroke="currentColor" stroke-width="1.8"/></svg>';
  var SVG_REQUEST =
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var SVG_EXTERNAL =
    '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var SVG_TOAST_OK =
    '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12.5 10 17 19 7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var SVG_TOAST_ERR =
    '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/><path d="M12 7.5v6M12 16.5h.01" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>';
  var SVG_EMPTY_SEARCH =
    '<svg width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" stroke-width="1.8"/><path d="M20 20l-4.3-4.3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
  var SVG_EMPTY_SAVE =
    '<svg width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 3.5h12a1 1 0 0 1 1 1V21l-7-4-7 4V4.5a1 1 0 0 1 1-1Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>';
  var SVG_ERROR =
    '<svg width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3 2 20h20L12 3Z" stroke-linejoin="round" stroke="currentColor" stroke-width="1.7"/><path d="M12 10v4M12 17h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

  /* This object stores the current search, filter, sort, and saved-paper state. */
  var state = {
    papers: [],
    filtered: [],
    visibleCount: PAGE_SIZE,
    query: "",
    scope: "keywords",
    yearMin: null,
    yearMax: null,
    institution: "",
    field: "",
    litType: "",
    sort: "newest",
    savedOnly: false
  };
  function loadSavedPapers() {
    try {
      var raw = window.localStorage.getItem(SAVED_STORAGE_KEY);
      var arr = raw ? JSON.parse(raw) : [];
      return new Set(Array.isArray(arr) ? arr : []);
    } catch (e) {
      // Continue with no saved papers if browser storage is unavailable.
      return new Set();
    }
  }

  function persistSavedPapers() {
    try {
      window.localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify(Array.from(saved)));
    } catch (e) {
      // Saving is optional, so the page can continue if storage is unavailable.
    }
  }

  var papersByKey = {};
  var dataBounds = { yearMin: 1980, yearMax: new Date().getFullYear() };
  var saved = loadSavedPapers();
  var recentlyViewed = [];
  var currentDetailPaper = null;
  var lastFocusedBeforeModal = null;
  var tourIndex = 0;

  /* Small helper functions used in several parts of the application. */
  function escHtml(str) {
    return String(str == null ? "" : str).replace(/[&<>"']/g, function (ch) {
      if (ch === "&") return "&amp;";
      if (ch === "<") return "&lt;";
      if (ch === ">") return "&gt;";
      if (ch === '"') return "&quot;";
      return "&#39;";
    });
  }

  function stripCiteArtifacts(text) {
    // Source abstracts occasionally carry leftover extraction markers
    // like "[cite: 3]" or "[cite: 4, 5]" - strip these for readers.
    return (text || "")
      .replace(/\s*\[cite:[^\]]*\]/gi, "")
      .replace(/[ \t]{2,}/g, " ")
      .trim();
  }

  function capitalize(s) {
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  }

  function uniqueNonEmpty(arr) {
    var seen = {};
    var out = [];
    arr.forEach(function (v) {
      v = (v || "").trim();
      if (v && !Object.prototype.hasOwnProperty.call(seen, v)) {
        seen[v] = true;
        out.push(v);
      }
    });
    return out;
  }

  function splitAuthors(str) {
    // Splits on commas that are NOT inside parentheses, since author
    // entries embed roles like "(Professor of Crop Science, ...)".
    var parts = [];
    var depth = 0;
    var current = "";
    for (var i = 0; i < str.length; i++) {
      var ch = str.charAt(i);
      if (ch === "(") depth++;
      if (ch === ")") depth = Math.max(0, depth - 1);
      if (ch === "," && depth === 0) {
        parts.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    if (current.trim()) parts.push(current.trim());
    return parts.filter(Boolean);
  }

  function shortAuthors(str) {
    if (!str) return "Author not specified";
    var parts = splitAuthors(str);
    if (!parts.length) return "Author not specified";
    var first = parts[0].replace(/\([^)]*\)/g, "").trim();
    return parts.length > 1 ? first + ", et al." : first;
  }

  function fullAuthors(p) {
    return p.authors ? p.authors : "Author not specified";
  }

  function citationLabel(n) {
    if (n === 0) return "No citations yet";
    return n + (n === 1 ? " citation" : " citations");
  }

  function copyText(text) {
    function fallback() {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.top = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try {
        ok = document.execCommand("copy");
      } catch (e) {
        ok = false;
      }
      document.body.removeChild(ta);
      return ok;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard
        .writeText(text)
        .then(function () {
          return true;
        })
        .catch(function () {
          return fallback();
        });
    }
    return Promise.resolve(fallback());
  }

  function buildMailto(to, subject, body) {
    return (
      "mailto:" +
      to +
      "?subject=" +
      encodeURIComponent(subject) +
      "&body=" +
      encodeURIComponent(body)
    );
  }

  /* Load the JSON file and convert every record into one consistent shape. */
  function parseFlag(v) {
    // Accepts a real JSON boolean, or common string spellings someone
    // hand-editing paper.json might type ("true", "yes", "1", blank, etc.)
    if (v === true) return true;
    if (typeof v === "string") return /^(true|yes|y|1)$/i.test(v.trim());
    return false;
  }

  function normalize(raw, index) {
    // Create safe, consistent values for the interface without changing the source record.
    var key = index + "::" + (raw.id || "noid");
    var yearStr = (raw.year || "").toString().trim();
    var yearNum = /^\d{4}$/.test(yearStr) ? parseInt(yearStr, 10) : null;
    var citationsNum =
      typeof raw.citations === "number"
        ? raw.citations
        : parseInt(raw.citations, 10) || 0;
    var title = (raw.title || "Untitled record").toString().trim();
    var authors = (raw.authors || "").toString().trim();
    var abstract = stripCiteArtifacts((raw.abstract || "").toString());

    var p = {
      key: key,
      id: (raw.id || "-").toString().trim() || "-",
      title: title,
      titleLower: title.toLowerCase(),
      authors: authors,
      authorsLower: authors.toLowerCase(),
      year: yearStr,
      yearNum: yearNum,
      partner: (raw.partner || "").toString().trim(),
      partnerName: (raw.partnerName || "").toString().trim(),
      isMarga: parseFlag(raw.isMarga),
      area: (raw.area || "").toString().trim(),
      areaName: (raw.areaName || "General").toString().trim(),
      areaIcon: (raw.areaIcon || "").toString().trim(),
      abstract: abstract,
      abstractLower: abstract.toLowerCase(),
      pdfUrl: (raw.pdfUrl || "").toString().trim(),
      citations: citationsNum,
      litType: (raw.litType || "").toString().trim().toLowerCase()
    };
    papersByKey[key] = p;
    return p;
  }

  function loadPapers() {
    function readJson(url, signal) {
      return fetch(url, { cache: "no-store", signal: signal }).then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      }).then(function (data) {
        if (!Array.isArray(data)) throw new Error("Unexpected data");
        return data;
      });
    }
    var controller = typeof AbortController === "function" ? new AbortController() : null;
    var timer = controller ? setTimeout(function () { controller.abort(); }, 20000) : null;
    return readJson(DATA_URL, controller ? controller.signal : undefined)
      .catch(function (err) {
        console.warn("Live data failed, using paper.json instead:", err);
        return readJson(FALLBACK_DATA_URL);
      })
      .finally(function () { if (timer) clearTimeout(timer); });
  }

  function findByKey(key) {
    return papersByKey[key] || null;
  }

  /* Apply the current filters and sort order before rendering the results. */
  function computeFiltered() {
    // Filtering happens in memory so the results update without another request.
    var q = state.query.trim().toLowerCase();
    var list = state.papers.filter(function (p) {
      if (state.savedOnly && !saved.has(p.key)) return false;
      if (q) {
        var hay;
        if (state.scope === "author") hay = p.authorsLower;
        else if (state.scope === "id") hay = p.id.toLowerCase();
        else hay = p.titleLower + " " + p.abstractLower;
        if (hay.indexOf(q) === -1) return false;
      }
      if (state.yearMin != null && state.yearMax != null && p.yearNum != null) {
        if (p.yearNum < state.yearMin || p.yearNum > state.yearMax) return false;
      }
      if (state.institution && p.partnerName !== state.institution) return false;
      if (state.field && p.areaName !== state.field) return false;
      if (state.litType && p.litType !== state.litType) return false;
      return true;
    });
    state.filtered = sortPapers(list, state.sort);
  }

  function sortPapers(list, sort) {
    var arr = list.slice();
    if (sort === "oldest") {
      arr.sort(function (a, b) {
        return (a.yearNum || 9999) - (b.yearNum || 9999);
      });
    } else if (sort === "cited") {
      arr.sort(function (a, b) {
        return b.citations - a.citations;
      });
    } else if (sort === "title") {
      arr.sort(function (a, b) {
        return a.title.localeCompare(b.title);
      });
    } else {
      arr.sort(function (a, b) {
        return (b.yearNum || 0) - (a.yearNum || 0);
      });
    }
    return arr;
  }

  /* Store references to page elements so event handlers can reuse them. */
  var dom = {};
  function cacheDom() {
    // Keep all page-element references together so the HTML and JavaScript are easy to compare.
    dom.preloader = document.getElementById("preloader");
    dom.themeToggles = document.querySelectorAll(".theme-toggle");

    dom.searchToggle = document.getElementById("searchToggle");
    dom.mobileSearchBtn = document.getElementById("mobileSearchBtn");
    dom.searchPanel = document.getElementById("searchPanel");
    dom.searchInput = document.getElementById("searchInput");
    dom.scopeSelect = document.getElementById("scopeSelect");
    dom.btnSearch = document.getElementById("btnSearch");

    dom.mobileMenuBtn = document.getElementById("mobileMenuBtn");
    dom.mobileMenuPanel = document.getElementById("mobileMenuPanel");

    dom.advToggle = document.getElementById("advancedToggle");
    dom.advPanel = document.getElementById("advancedPanel");
    dom.rangeMin = document.getElementById("rangeMin");
    dom.rangeMax = document.getElementById("rangeMax");
    dom.rangeFill = document.getElementById("rangeFill");
    dom.rangeMinVal = document.getElementById("rangeMinVal");
    dom.rangeMaxVal = document.getElementById("rangeMaxVal");
    dom.institutionSelect = document.getElementById("institutionSelect");
    dom.fieldSelect = document.getElementById("fieldSelect");
    dom.litTypeSelect = document.getElementById("litTypeSelect");
    dom.btnApplyAdvanced = document.getElementById("btnApplyAdvanced");
    dom.btnResetAdvanced = document.getElementById("btnResetAdvanced");

    dom.spotlightDesktop = document.getElementById("spotlightDesktop");
    dom.rollingSlides = document.getElementById("rollingSlides");
    dom.rollingDots = document.getElementById("rollingDots");

    dom.statPapers = document.getElementById("statPapers");
    dom.statInstitutions = document.getElementById("statInstitutions");
    dom.statAreas = document.getElementById("statAreas");
    dom.visitorCount = document.getElementById("visitorCount");
    dom.statSince = document.getElementById("statSince");

    dom.resultsCount = document.getElementById("resultsCount");
    dom.sortSelect = document.getElementById("sortSelect");
    dom.activeFilters = document.getElementById("activeFilters");
    dom.paperGrid = document.getElementById("paperGrid");
    dom.loadMoreWrap = document.getElementById("loadMoreWrap");
    dom.loadMoreBtn = document.getElementById("loadMoreBtn");

    dom.detailOverlay = document.getElementById("detailOverlay");
    dom.detailModalScroll = document.getElementById("detailModalScroll");
    dom.detailCloseBtn = document.getElementById("detailCloseBtn");

    dom.requestOverlay = document.getElementById("requestOverlay");
    dom.reqPaperTitle = document.getElementById("reqPaperTitle");
    dom.reqPaperAuthors = document.getElementById("reqPaperAuthors");
    dom.reqName = document.getElementById("reqName");
    dom.reqEmail = document.getElementById("reqEmail");
    dom.reqNotes = document.getElementById("reqNotes");
    dom.reqNameError = document.getElementById("reqNameError");
    dom.reqEmailError = document.getElementById("reqEmailError");
    dom.reqSend = document.getElementById("reqSend");
    dom.requestClose = document.getElementById("requestClose");

    dom.a11yOverlay = document.getElementById("a11yOverlay");
    dom.a11yClose = document.getElementById("a11yClose");
    dom.a11yTourBtn = document.getElementById("a11yTourBtn");

    dom.newsletterForm = document.getElementById("newsletterForm");
    dom.newsletterEmail = document.getElementById("newsletterEmail");
    dom.newsletterError = document.getElementById("newsletterError");

    dom.backToTopBtn = document.getElementById("backToTopBtn");

    dom.chatFabBtn = document.getElementById("chatFabBtn");
    dom.chatCloseBtn = document.getElementById("chatCloseBtn");
    dom.chatPanel = document.getElementById("chatPanel");
    dom.chatBody = document.getElementById("chatBody");
    dom.chatForm = document.getElementById("chatForm");
    dom.chatInput = document.getElementById("chatInput");
    dom.chatQuickReplies = document.getElementById("chatQuickReplies");

    dom.storehouseLink = document.getElementById("storehouseLink");
    dom.footerYear = document.getElementById("footerYear");
    dom.toastRegion = document.getElementById("toastRegion");
    dom.tourOverlay = document.getElementById("tourOverlay");
    dom.tourCloseBtn = document.getElementById("tourCloseBtn");
    dom.tourPrevBtn = document.getElementById("tourPrevBtn");
    dom.tourNextBtn = document.getElementById("tourNextBtn");
    dom.tourStepText = document.getElementById("tourStepText");
    dom.tourProgress = document.getElementById("tourProgress");
  }

  /* Show short status messages without interrupting the visitor. */
  function showToast(message, type) {
    if (!dom.toastRegion) return;
    var el = document.createElement("div");
    el.className = "toast" + (type === "error" ? " toast-error" : "");
    el.setAttribute("role", "status");
    el.innerHTML =
      (type === "error" ? SVG_TOAST_ERR : SVG_TOAST_OK) +
      "<span>" +
      escHtml(message) +
      "</span>";
    dom.toastRegion.appendChild(el);
    requestAnimationFrame(function () {
      el.classList.add("is-visible");
    });
    setTimeout(function () {
      el.classList.remove("is-visible");
      setTimeout(function () {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, 250);
    }, 3200);
  }

  function isTourSeen() {
    try {
      return !!localStorage.getItem(TOUR_STORAGE_KEY);
    } catch (e) {
      try {
        return !!sessionStorage.getItem(TOUR_STORAGE_KEY);
      } catch (ignore) {
        return false;
      }
    }
  }

  function markTourSeen() {
    try {
      localStorage.setItem(TOUR_STORAGE_KEY, "1");
    } catch (e) {
      try {
        sessionStorage.setItem(TOUR_STORAGE_KEY, "1");
      } catch (ignore) {
        // Ignore storage failures.
      }
    }
  }

  function renderTourStep() {
    // Update the text and button labels whenever the visitor moves through the tour.
    if (!dom.tourStepText) return;
    var step = TOUR_STEPS[tourIndex] || TOUR_STEPS[0];
    dom.tourStepText.innerHTML =
      '<h4>' + escHtml(step.title) + '</h4>' +
      '<p>' + escHtml(step.description) + '</p>';
    dom.tourPrevBtn.disabled = tourIndex === 0;
    dom.tourNextBtn.textContent =
      tourIndex === TOUR_STEPS.length - 1 ? "Got it" : "Next";
    dom.tourProgress.textContent =
      "Step " + (tourIndex + 1) + " of " + TOUR_STEPS.length;
  }

  function openTour() {
    if (!dom.tourOverlay) return;
    dom.tourOverlay.hidden = false;
    dom.tourOverlay.classList.add("is-open");
    dom.tourOverlay.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    dom.tourCloseBtn.focus();
  }

  function closeTour() {
    if (!dom.tourOverlay) return;
    dom.tourOverlay.classList.remove("is-open");
    dom.tourOverlay.hidden = true;
    dom.tourOverlay.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    markTourSeen();
  }

  function startTour() {
    tourIndex = 0;
    renderTourStep();
    openTour();
  }

  function wireTour() {
    if (!dom.tourOverlay) return;
    dom.tourCloseBtn.addEventListener("click", closeTour);
    dom.tourPrevBtn.addEventListener("click", function () {
      if (tourIndex > 0) {
        tourIndex -= 1;
        renderTourStep();
      }
    });
    dom.tourNextBtn.addEventListener("click", function () {
      if (tourIndex < TOUR_STEPS.length - 1) {
        tourIndex += 1;
        renderTourStep();
      } else {
        closeTour();
      }
    });
    dom.tourOverlay.addEventListener("click", function (e) {
      if (e.target === dom.tourOverlay) closeTour();
    });
  }

  /* Open and close the search panel and mobile navigation. */
  function setSearchOpen(open) {
    // Keep the desktop and mobile search buttons in the same state.
    dom.searchPanel.classList.toggle("is-open", open);
    [dom.searchToggle, dom.mobileSearchBtn].forEach(function (btn) {
      if (btn) btn.setAttribute("aria-expanded", open);
    });
    if (open) closeMobileMenu();
  }
  function closeMobileMenu() {
    dom.mobileMenuPanel.classList.remove("is-open");
    dom.mobileMenuBtn.setAttribute("aria-expanded", "false");
  }

  /* Connect the theme buttons and keep their labels in sync. */
  function applyTheme(theme, persist) {
    // Change the root theme attribute; CSS then changes the page colors.
    if (theme === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    if (persist) {
      try {
        localStorage.setItem(THEME_STORAGE_KEY, theme);
      } catch (e) { }
    }
    var isDark = theme === "dark";
    Array.prototype.forEach.call(dom.themeToggles || [], function (btn) {
      btn.setAttribute("aria-pressed", isDark ? "true" : "false");
      var label = isDark ? "Switch to light mode" : "Switch to dark mode";
      btn.setAttribute("aria-label", label);
      btn.title = label;
    });
  }

  function wireTheme() {
    if (!dom.themeToggles || !dom.themeToggles.length) return;
    Array.prototype.forEach.call(dom.themeToggles, function (btn) {
      btn.addEventListener("click", function () {
        var isDark = document.documentElement.getAttribute("data-theme") === "dark";
        applyTheme(isDark ? "light" : "dark", true);
      });
    });
    // Match the button state to the theme restored at startup.
    var current = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
    applyTheme(current, false);
  }

  function wireHeader() {
    [dom.searchToggle, dom.mobileSearchBtn].forEach(function (btn) {
      if (!btn) return;
      btn.addEventListener("click", function () {
        setSearchOpen(!dom.searchPanel.classList.contains("is-open"));
      });
    });
    document.addEventListener("click", function (e) {
      var isTrigger =
        (dom.searchToggle && dom.searchToggle.contains(e.target)) ||
        (dom.mobileSearchBtn && dom.mobileSearchBtn.contains(e.target));
      if (!dom.searchPanel.contains(e.target) && !isTrigger) setSearchOpen(false);
    });

    dom.mobileMenuBtn.addEventListener("click", function () {
      var open = dom.mobileMenuPanel.classList.toggle("is-open");
      dom.mobileMenuBtn.setAttribute("aria-expanded", open);
      if (open) setSearchOpen(false);
    });

    dom.advToggle.addEventListener("click", function () {
      var open = dom.advPanel.classList.toggle("is-open");
      dom.advToggle.setAttribute("aria-expanded", open);
    });

    dom.btnSearch.addEventListener("click", applySearchFromRow);
    dom.searchInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") applySearchFromRow();
    });

    dom.btnApplyAdvanced.addEventListener("click", applyAdvancedFilters);
    dom.btnResetAdvanced.addEventListener("click", function () {
      clearAllFilters();
      showToast("Filters reset");
    });
  }

  function applySearchFromRow() {
    // Save the search controls in state, then rebuild the visible paper list.
    state.query = dom.searchInput.value;
    state.scope = dom.scopeSelect.value || "keywords";
    state.visibleCount = PAGE_SIZE;
    setSearchOpen(false);
    refreshAndScrollToPapers();
  }

  function applyAdvancedFilters() {
    // Copy the advanced controls into state before filtering the catalogue.
    state.yearMin = parseInt(dom.rangeMin.value, 10);
    state.yearMax = parseInt(dom.rangeMax.value, 10);
    state.institution = dom.institutionSelect.value;
    state.field = dom.fieldSelect.value;
    state.litType = dom.litTypeSelect.value;
    state.visibleCount = PAGE_SIZE;
    setSearchOpen(false);
    refreshAndScrollToPapers();
  }

  function refreshAndScrollToPapers() {
    // All filter changes use this same path so the count, chips, and cards stay consistent.
    computeFiltered();
    renderActiveFilterChips();
    renderGrid();
    var section = document.getElementById("papers");
    if (section) section.scrollIntoView({ behavior: "smooth" });
  }

  /* Set up the two handles used to filter papers by publication year. */
  function setupYearSlider() {
    // Use the earliest and latest valid years in paper.json as the slider limits.
    var years = state.papers
      .map(function (p) {
        return p.yearNum;
      })
      .filter(function (y) {
        return !!y;
      });
    var minY = years.length ? Math.min.apply(null, years) : dataBounds.yearMin;
    var maxY = years.length
      ? Math.max.apply(null, years)
      : new Date().getFullYear();
    dataBounds.yearMin = minY;
    dataBounds.yearMax = maxY;

    dom.rangeMin.min = minY;
    dom.rangeMin.max = maxY;
    dom.rangeMax.min = minY;
    dom.rangeMax.max = maxY;
    dom.rangeMin.value = minY;
    dom.rangeMax.value = maxY;
    state.yearMin = minY;
    state.yearMax = maxY;

    updateRangeVisual();

    dom.rangeMin.addEventListener("input", function () {
      clampRange("min");
    });
    dom.rangeMax.addEventListener("input", function () {
      clampRange("max");
    });
    // Whichever thumb the person is actively dragging gets priority,
    // so overlapping thumbs near the same value stay easy to grab.
    dom.rangeMin.addEventListener("pointerdown", function () {
      dom.rangeMin.style.zIndex = 3;
      dom.rangeMax.style.zIndex = 2;
    });
    dom.rangeMax.addEventListener("pointerdown", function () {
      dom.rangeMax.style.zIndex = 3;
      dom.rangeMin.style.zIndex = 2;
    });
  }

  function clampRange(source) {
    // Prevent the lower year from moving above the upper year, and vice versa.
    var min = parseInt(dom.rangeMin.value, 10);
    var max = parseInt(dom.rangeMax.value, 10);
    if (min > max) {
      if (source === "min") {
        dom.rangeMin.value = max;
      } else {
        dom.rangeMax.value = min;
      }
    }
    updateRangeVisual();
  }

  function updateRangeVisual() {
    var min = parseInt(dom.rangeMin.value, 10);
    var max = parseInt(dom.rangeMax.value, 10);
    var lo = parseInt(dom.rangeMin.min, 10);
    var hi = parseInt(dom.rangeMin.max, 10);
    var span = hi - lo || 1;
    var pctMin = ((min - lo) / span) * 100;
    var pctMax = ((max - lo) / span) * 100;
    dom.rangeFill.style.left = pctMin + "%";
    dom.rangeFill.style.width = Math.max(0, pctMax - pctMin) + "%";
    dom.rangeMinVal.textContent = min;
    dom.rangeMaxVal.textContent = max;
  }

  /* Fill the filter menus from the values found in paper.json. */
  function fillSelect(select, values, placeholderLabel, labelFn) {
    var html = '<option value="">' + escHtml(placeholderLabel) + "</option>";
    values.forEach(function (v) {
      var label = labelFn ? labelFn(v) : v;
      html += '<option value="' + escHtml(v) + '">' + escHtml(label) + "</option>";
    });
    select.innerHTML = html;
  }

  function populateFilterSelects() {
    // The available filter choices come from the loaded paper records.
    var institutions = uniqueNonEmpty(
      state.papers.map(function (p) {
        return p.partnerName;
      })
    ).sort();
    var areas = uniqueNonEmpty(
      state.papers.map(function (p) {
        return p.areaName;
      })
    ).sort();
    var types = uniqueNonEmpty(
      state.papers.map(function (p) {
        return p.litType;
      })
    ).sort();

    fillSelect(dom.institutionSelect, institutions, "Any partner organization");
    fillSelect(dom.fieldSelect, areas, "Any field of study");
    fillSelect(dom.litTypeSelect, types, "Any publication type", function (v) {
      return LITTYPE_LABELS[v] || capitalize(v);
    });
  }

  function renderActiveFilterChips() {
    var chips = [];
    if (state.query) {
      var scopeLabel =
        state.scope === "author"
          ? "Author"
          : state.scope === "id"
            ? "Paper ID"
            : "Keywords";
      chips.push({
        label: scopeLabel + ': "' + state.query + '"',
        clear: function () {
          state.query = "";
          dom.searchInput.value = "";
        }
      });
    }
    if (
      state.yearMin != null &&
      state.yearMax != null &&
      (state.yearMin !== dataBounds.yearMin || state.yearMax !== dataBounds.yearMax)
    ) {
      chips.push({
        label: "Years " + state.yearMin + "–" + state.yearMax,
        clear: function () {
          state.yearMin = dataBounds.yearMin;
          state.yearMax = dataBounds.yearMax;
          dom.rangeMin.value = dataBounds.yearMin;
          dom.rangeMax.value = dataBounds.yearMax;
          updateRangeVisual();
        }
      });
    }
    if (state.institution) {
      chips.push({
        label: "Partner: " + state.institution,
        clear: function () {
          state.institution = "";
          dom.institutionSelect.value = "";
        }
      });
    }
    if (state.field) {
      chips.push({
        label: "Field: " + state.field,
        clear: function () {
          state.field = "";
          dom.fieldSelect.value = "";
        }
      });
    }
    if (state.litType) {
      chips.push({
        label: "Type: " + (LITTYPE_LABELS[state.litType] || capitalize(state.litType)),
        clear: function () {
          state.litType = "";
          dom.litTypeSelect.value = "";
        }
      });
    }
    if (state.savedOnly) {
      chips.push({
        label: "Saved papers only",
        clear: function () {
          setSavedOnly(false);
        }
      });
    }

    var wrap = dom.activeFilters;
    if (!chips.length) {
      wrap.innerHTML = "";
      wrap.hidden = true;
      return;
    }
    wrap.hidden = false;
    wrap.innerHTML =
      chips
        .map(function (c, i) {
          return (
            '<span class="filter-chip">' +
            escHtml(c.label) +
            '<button type="button" data-chip-index="' +
            i +
            '" aria-label="Remove this filter">&times;</button></span>'
          );
        })
        .join("") +
      '<button type="button" class="filter-chip-clear" id="clearAllFilters">Clear all</button>';

    Array.prototype.forEach.call(
      wrap.querySelectorAll("[data-chip-index]"),
      function (btn) {
        btn.addEventListener("click", function () {
          var i = parseInt(btn.dataset.chipIndex, 10);
          chips[i].clear();
          state.visibleCount = PAGE_SIZE;
          computeFiltered();
          renderActiveFilterChips();
          renderGrid();
        });
      }
    );
    var clearAllBtn = document.getElementById("clearAllFilters");
    if (clearAllBtn) clearAllBtn.addEventListener("click", clearAllFilters);
  }

  function clearAllFilters() {
    state.query = "";
    dom.searchInput.value = "";
    state.institution = "";
    dom.institutionSelect.value = "";
    state.field = "";
    dom.fieldSelect.value = "";
    state.litType = "";
    dom.litTypeSelect.value = "";
    state.yearMin = dataBounds.yearMin;
    state.yearMax = dataBounds.yearMax;
    dom.rangeMin.value = dataBounds.yearMin;
    dom.rangeMax.value = dataBounds.yearMax;
    updateRangeVisual();
    state.savedOnly = false;
    state.visibleCount = PAGE_SIZE;
    computeFiltered();
    renderActiveFilterChips();
    renderGrid();
  }

  /* Connect the sort menu and the button that loads more results. */
  function wireToolbar() {
    dom.sortSelect.addEventListener("change", function () {
      state.sort = dom.sortSelect.value;
      state.visibleCount = PAGE_SIZE;
      computeFiltered();
      renderGrid();
    });
    dom.loadMoreBtn.addEventListener("click", function () {
      state.visibleCount += PAGE_SIZE;
      renderGrid();
    });
  }

  /* Create the loading cards, empty states, and paper cards in the results grid. */
  function renderSkeletons(count) {
    var html = "";
    for (var i = 0; i < count; i++) {
      html +=
        '<div class="skeleton-card"><div class="sk sk-title"></div><div class="sk sk-line"></div>' +
        '<div style="display:flex;gap:8px;"><div class="sk sk-pill"></div><div class="sk sk-pill"></div><div class="sk sk-pill"></div></div>' +
        '<div class="sk sk-body"></div><div class="sk sk-body"></div><div class="sk sk-body"></div></div>';
    }
    dom.paperGrid.innerHTML = html;
    dom.resultsCount.textContent = "Loading papers…";
    dom.loadMoreWrap.hidden = true;
  }

  function renderHeroSkeletons() {
    if (!dom.statPapers || !dom.statInstitutions || !dom.statAreas || !dom.statSince) return;

    dom.statPapers.innerHTML = '<span class="sk hero-stat-skeleton"></span>';
    dom.statInstitutions.innerHTML = '<span class="sk hero-stat-skeleton"></span>';
    dom.statAreas.innerHTML = '<span class="sk hero-stat-skeleton"></span>';
    dom.statSince.innerHTML = '<span class="sk hero-stat-skeleton"></span>';

    dom.spotlightDesktop.innerHTML =
      '<span class="spotlight-label">Newest Additions</span>' +
      '<div class="spot-card spot-main hero-spot-skeleton-card">' +
      '<div class="sk sk-title"></div><div class="sk sk-line"></div>' +
      '<div class="spot-skeleton-tags"><span class="sk sk-pill"></span><span class="sk sk-pill"></span></div></div>' +
      '<div class="spot-card hero-spot-skeleton-card">' +
      '<div class="sk sk-title"></div><div class="sk sk-line"></div><div class="sk sk-pill"></div></div>' +
      '<div class="spot-card hero-spot-skeleton-card">' +
      '<div class="sk sk-title"></div><div class="sk sk-line"></div><div class="sk sk-pill"></div></div>' +
      '<div class="spot-ticker"><div class="ticker-track"><span class="sk sk-line hero-ticker-skeleton"></span></div></div>';

    if (dom.rollingSlides) {
      dom.rollingSlides.innerHTML =
        '<div class="rolling-slide is-active hero-rolling-skeleton">' +
        '<div class="sk sk-title"></div><div class="sk sk-line"></div>' +
        '<div class="spot-skeleton-tags"><span class="sk sk-pill"></span></div></div>';
    }
    if (dom.rollingDots) {
      dom.rollingDots.innerHTML =
        '<span class="sk hero-dot-skeleton"></span><span class="sk hero-dot-skeleton"></span><span class="sk hero-dot-skeleton"></span>';
    }
  }

  function renderHeroFallback() {
    if (dom.statPapers) dom.statPapers.textContent = "-";
    if (dom.statInstitutions) dom.statInstitutions.textContent = "-";
    if (dom.statAreas) dom.statAreas.textContent = "-";
    if (dom.statSince) dom.statSince.textContent = "-";

    if (dom.spotlightDesktop) {
      dom.spotlightDesktop.innerHTML =
        '<span class="spotlight-label">Newest Additions</span><p class="hero-fallback-text">Papers will appear here once the catalogue loads.</p>';
    }
    if (dom.rollingSlides) {
      dom.rollingSlides.innerHTML =
        '<p class="hero-fallback-text hero-fallback-mobile">Papers will appear here once the catalogue loads.</p>';
    }
    if (dom.rollingDots) dom.rollingDots.innerHTML = "";
  }

  function abstractHTML(text) {
    var safeText = text || "No abstract available for this record.";
    if (safeText.length <= ABSTRACT_TRUNCATE) {
      return '<p class="paper-desc">' + escHtml(safeText) + "</p>";
    }
    var cut = safeText.slice(0, ABSTRACT_TRUNCATE);
    var lastSpace = cut.lastIndexOf(" ");
    if (lastSpace > 40) cut = cut.slice(0, lastSpace);
    var truncated = cut + "…";
    return (
      '<p class="paper-desc" data-truncated="' +
      escHtml(truncated) +
      '" data-full="' +
      escHtml(safeText) +
      '">' +
      escHtml(truncated) +
      "</p>" +
      '<button type="button" class="read-more" data-action="read-more" data-expanded="false">Read more</button>'
    );
  }

  function toggleReadMore(btn) {
    var desc = btn.previousElementSibling;
    if (!desc) return;
    var expanded = btn.dataset.expanded === "true";
    if (expanded) {
      desc.textContent = desc.dataset.truncated;
      btn.textContent = "Read more";
      btn.dataset.expanded = "false";
    } else {
      desc.textContent = desc.dataset.full;
      btn.textContent = "Show less";
      btn.dataset.expanded = "true";
    }
  }

  function cardHTML(p) {
    var isMarga = p.isMarga;
    var isSaved = saved.has(p.key);
    return (
      '<article class="paper-card' +
      (isMarga ? " has-badge" : "") +
      '" data-key="' +
      p.key +
      '">' +
      (isMarga
        ? '<span class="marga-badge" title="Published via Marga Institute"></span>'
        : "") +
      '<h3><button type="button" data-action="view">' +
      escHtml(p.title) +
      "</button></h3>" +
      '<p class="paper-authors" title="' +
      escHtml(fullAuthors(p)) +
      '">' +
      escHtml(fullAuthors(p)) +
      "</p>" +
      '<div class="pill-row">' +
      (p.year
        ? '<span class="pill">' + escHtml(p.year) + "</span>"
        : '<span class="pill">Year unspecified</span>') +
      '<span class="pill">' +
      citationLabel(p.citations) +
      "</span>" +
      (p.litType
        ? '<span class="pill pill-status" data-status="' +
        p.litType +
        '">' +
        escHtml(LITTYPE_LABELS[p.litType] || capitalize(p.litType)) +
        "</span>"
        : "") +
      '<span class="pill">' +
      iconSvg(p.areaIcon) +
      escHtml(p.areaName) +
      "</span>" +
      "</div>" +
      abstractHTML(p.abstract) +
      '<div class="card-actions">' +
      '<button class="btn btn-ghost btn-sm" type="button" data-action="view">View paper</button>' +
      '<button class="btn btn-ghost btn-sm save-btn' +
      (isSaved ? " is-saved" : "") +
      '" type="button" data-action="save" aria-pressed="' +
      (isSaved ? "true" : "false") +
      '">' +
      SVG_SAVE +
      (isSaved ? "Saved" : "Save") +
      "</button>" +
      '<button class="btn btn-ghost btn-sm" type="button" data-action="cite">Cite</button>' +
      '<span class="spacer"></span>' +
      '<button class="icon-btn" type="button" data-action="share" title="Share" aria-label="Share this paper">' +
      SVG_SHARE +
      "</button>" +
      '<button class="request-btn" type="button" data-action="request" title="Request this paper" aria-label="Request this paper">' +
      SVG_REQUEST +
      "</button>" +
      "</div>" +
      "</article>"
    );
  }

  function emptyStateHTML() {
    if (state.savedOnly) {
      return (
        '<div class="empty-state">' +
        SVG_EMPTY_SAVE +
        "<h3>No saved papers yet</h3>" +
        "<p>Tap Save on any paper to bookmark it here for quick access later.</p>" +
        '<button class="btn btn-ghost btn-sm" type="button" data-action="browse-all">Browse all papers</button>' +
        "</div>"
      );
    }
    return (
      '<div class="empty-state">' +
      SVG_EMPTY_SEARCH +
      "<h3>No papers match your filters</h3>" +
      "<p>Try widening the year range, clearing a filter, or searching a different keyword.</p>" +
      '<button class="btn btn-ghost btn-sm" type="button" data-action="clear-filters">Clear all filters</button>' +
      "</div>"
    );
  }

  function renderGrid() {
    // Show only the current page of results and update the result count.
    var total = state.filtered.length;
    var toShow = state.filtered.slice(0, state.visibleCount);

    dom.resultsCount.innerHTML = total
      ? "Showing <strong>" +
      toShow.length +
      "</strong> of <strong>" +
      total +
      "</strong> paper" +
      (total === 1 ? "" : "s")
      : "No papers found";

    if (!total) {
      dom.paperGrid.innerHTML = emptyStateHTML();
      dom.loadMoreWrap.hidden = true;
      return;
    }

    dom.paperGrid.innerHTML = toShow.map(cardHTML).join("");

    var remaining = total - toShow.length;
    dom.loadMoreWrap.hidden = remaining <= 0;
    if (remaining > 0) {
      dom.loadMoreBtn.textContent =
        "Load more papers (" + remaining + " remaining)";
    }
  }

  function updateSaveButtonUI(btn, paper) {
    var isSaved = saved.has(paper.key);
    btn.classList.toggle("is-saved", isSaved);
    btn.setAttribute("aria-pressed", isSaved ? "true" : "false");
    btn.innerHTML = SVG_SAVE + (isSaved ? "Saved" : "Save");
  }

  function syncSaveButtonsFor(key) {
    var paper = findByKey(key);
    if (!paper) return;
    var gridBtn = dom.paperGrid.querySelector(
      '[data-key="' + cssEscape(key) + '"] [data-action="save"]'
    );
    if (gridBtn) updateSaveButtonUI(gridBtn, paper);
    if (
      dom.detailOverlay.classList.contains("is-open") &&
      currentDetailPaper &&
      currentDetailPaper.key === key
    ) {
      var modalBtn = dom.detailModalScroll.querySelector('[data-action="save"]');
      if (modalBtn) updateSaveButtonUI(modalBtn, paper);
    }
  }

  function cssEscape(str) {
    if (window.CSS && window.CSS.escape) return window.CSS.escape(str);
    return str.replace(/[^a-zA-Z0-9_-]/g, "\\$&");
  }

  function toggleSave(paper) {
    if (saved.has(paper.key)) saved.delete(paper.key);
    else saved.add(paper.key);
    persistSavedPapers();
    updateSavedCount();
  }

  function updateSavedCount() {
    var n = saved.size;
    Array.prototype.forEach.call(
      document.querySelectorAll(".nav-saved-count"),
      function (el) {
        el.textContent = String(n);
        el.hidden = n === 0;
      }
    );
  }

  function setSavedOnly(on) {
    state.savedOnly = on;
    state.visibleCount = PAGE_SIZE;
    computeFiltered();
    renderActiveFilterChips();
    renderGrid();
    var section = document.getElementById("papers");
    if (section) section.scrollIntoView({ behavior: "smooth" });
  }

  function wireGridDelegation() {
    dom.paperGrid.addEventListener("click", function (e) {
      var actionEl = e.target.closest("[data-action]");
      if (!actionEl) return;
      var action = actionEl.dataset.action;

      if (action === "browse-all") {
        setSavedOnly(false);
        return;
      }
      if (action === "clear-filters") {
        clearAllFilters();
        return;
      }
      if (action === "read-more") {
        toggleReadMore(actionEl);
        return;
      }

      var card = actionEl.closest("[data-key]");
      if (!card) return;
      var paper = findByKey(card.dataset.key);
      if (!paper) return;

      if (action === "view") {
        openDetail(paper.key);
      } else if (action === "save") {
        toggleSave(paper);
        syncSaveButtonsFor(paper.key);
        if (state.savedOnly && !saved.has(paper.key)) {
          computeFiltered();
          renderGrid();
        }
      } else if (action === "cite") {
        citePaper(paper);
      } else if (action === "share") {
        sharePaper(paper);
      } else if (action === "request") {
        openRequestModal(paper.title, fullAuthors(paper));
      }
    });
  }

  /* Build a simple citation and shareable link for each paper. */
  function buildCitation(p) {
    var authorPart = p.authors
      ? p.authors.replace(/\s*\([^)]*\)/g, "")
      : "Unknown author";
    var yearPart = p.year || "n.d.";
    var pub = p.partnerName || "Marga Institute";
    return authorPart + " (" + yearPart + "). " + p.title + ". " + pub + ".";
  }

  function citePaper(paper) {
    var citation = buildCitation(paper);
    copyText(citation).then(function (ok) {
      showToast(
        ok ? "Citation copied to clipboard" : citation,
        ok ? "success" : "info"
      );
    });
  }

  function buildDeepLink(key) {
    return window.location.href.split("#")[0] + "#paper=" + encodeURIComponent(key);
  }

  function sharePaper(paper) {
    var url = buildDeepLink(paper.key);
    var text = paper.title + (paper.authors ? " - " + shortAuthors(paper.authors) : "");
    if (navigator.share) {
      navigator.share({ title: paper.title, text: text, url: url }).catch(function () { });
    } else {
      copyText(url).then(function (ok) {
        showToast(
          ok ? "Link copied to clipboard" : "Could not copy the link",
          ok ? "success" : "error"
        );
      });
    }
  }

  /* Track recently opened papers and fill the paper details modal. */
  function pushRecentlyViewed(key) {
    var idx = recentlyViewed.indexOf(key);
    if (idx !== -1) recentlyViewed.splice(idx, 1);
    recentlyViewed.unshift(key);
    if (recentlyViewed.length > 8) recentlyViewed.length = 8;
  }

  function renderDetailModal(paper) {
    currentDetailPaper = paper;
    var isSaved = saved.has(paper.key);
    var partnerLabel = PARTNER_LABELS[paper.partner] || "";
    var pdfUnavailable = !paper.pdfUrl || paper.pdfUrl === "#";
    var pdfBtn = pdfUnavailable
      ? '<button class="btn btn-gold btn-sm" type="button" data-action="pdf-unavailable" title="PDF unavailable">Open PDF ' +
      SVG_EXTERNAL +
      "</button>"
      : '<a class="btn btn-gold btn-sm" href="' +
      escHtml(paper.pdfUrl) +
      '" target="_blank" rel="nofollow noopener">Open PDF ' +
      SVG_EXTERNAL +
      "</a>";

    var recents = recentlyViewed
      .filter(function (k) {
        return k !== paper.key;
      })
      .slice(0, 5);
    var recentHTML = recents.length
      ? recents
        .map(function (k) {
          var rp = findByKey(k);
          if (!rp) return "";
          return (
            '<button type="button" class="recent-item" data-recent-key="' +
            rp.key +
            '">' +
            escHtml(rp.title) +
            '<span>' +
            escHtml(shortAuthors(rp.authors)) +
            (rp.year ? " - " + escHtml(rp.year) : "") +
            "</span></button>"
          );
        })
        .join("")
      : '<p class="sidebar-empty">Papers you view will show up here for quick access.</p>';

    dom.detailModalScroll.innerHTML =
      '<div class="detail-layout">' +
      '<div class="detail-main">' +
      '<div class="detail-head">' +
      (paper.isMarga
        ? '<span class="marga-badge" title="Published via Marga Institute" style="position:static;flex:none;"></span>'
        : "") +
      "<div><h3>" +
      escHtml(paper.title) +
      '</h3><p class="detail-authors">' +
      escHtml(fullAuthors(paper)) +
      '</p><p class="detail-ref">Reference ' +
      escHtml(paper.id) +
      "</p></div>" +
      "</div>" +
      '<div class="pill-row" style="margin-top:16px;">' +
      (paper.year
        ? '<span class="pill">' + escHtml(paper.year) + "</span>"
        : '<span class="pill">Year unspecified</span>') +
      '<span class="pill">' +
      citationLabel(paper.citations) +
      "</span>" +
      (paper.litType
        ? '<span class="pill pill-status" data-status="' +
        paper.litType +
        '">' +
        escHtml(LITTYPE_LABELS[paper.litType] || capitalize(paper.litType)) +
        "</span>"
        : "") +
      '<span class="pill">' +
      iconSvg(paper.areaIcon) +
      escHtml(paper.areaName) +
      "</span>" +
      "</div>" +
      '<div class="detail-body">' +
      "<h4>Abstract</h4><p>" +
      escHtml(paper.abstract || "No abstract available for this record.") +
      "</p>" +
      (paper.partnerName
        ? "<h4>Partner</h4><p>" +
        escHtml(paper.partnerName) +
        (partnerLabel ? " · " + escHtml(partnerLabel) : "") +
        "</p>"
        : "") +
      "</div>" +
      '<div class="detail-actions">' +
      pdfBtn +
      '<button type="button" class="btn btn-ghost btn-sm save-btn' +
      (isSaved ? " is-saved" : "") +
      '" data-action="save" aria-pressed="' +
      (isSaved ? "true" : "false") +
      '">' +
      SVG_SAVE +
      (isSaved ? "Saved" : "Save") +
      "</button>" +
      '<button type="button" class="btn btn-ghost btn-sm" data-action="cite">Cite this paper</button>' +
      '<button type="button" class="btn btn-ghost btn-sm" data-action="share">Share</button>' +
      '<button type="button" class="btn btn-maroon btn-sm" data-action="request">Request access</button>' +
      "</div>" +
      "</div>" +
      '<aside class="detail-sidebar"><h4>Recently Viewed</h4>' +
      recentHTML +
      "</aside>" +
      "</div>";
  }

  function openDetail(key) {
    var paper = findByKey(key);
    if (!paper) return;
    pushRecentlyViewed(key);
    renderDetailModal(paper);
    dom.detailOverlay.classList.add("is-open");
    document.body.style.overflow = "hidden";
    lastFocusedBeforeModal = document.activeElement;
    setTimeout(function () {
      dom.detailCloseBtn.focus();
    }, 150);
    history.replaceState(null, "", "#paper=" + encodeURIComponent(key));
  }

  function closeDetail() {
    dom.detailOverlay.classList.remove("is-open");
    document.body.style.overflow = "";
    if (location.hash.indexOf("#paper=") === 0) {
      history.replaceState(null, "", location.pathname + location.search);
    }
    if (lastFocusedBeforeModal && typeof lastFocusedBeforeModal.focus === "function") {
      lastFocusedBeforeModal.focus();
    }
  }

  function wireDetailModal() {
    dom.detailCloseBtn.addEventListener("click", closeDetail);
    dom.detailOverlay.addEventListener("click", function (e) {
      if (e.target === dom.detailOverlay) closeDetail();
    });
    dom.detailModalScroll.addEventListener("click", function (e) {
      var recentBtn = e.target.closest("[data-recent-key]");
      if (recentBtn) {
        openDetail(recentBtn.dataset.recentKey);
        return;
      }
      var el = e.target.closest("[data-action]");
      if (!el || !currentDetailPaper) return;
      var paper = currentDetailPaper;
      var action = el.dataset.action;
      if (action === "save") {
        toggleSave(paper);
        updateSaveButtonUI(el, paper);
        syncSaveButtonsFor(paper.key);
      } else if (action === "cite") {
        citePaper(paper);
      } else if (action === "share") {
        sharePaper(paper);
      } else if (action === "request") {
        openRequestModal(paper.title, fullAuthors(paper));
      } else if (action === "pdf-unavailable") {
        showToast(
          "PDF unavailable. Please request access using the Request Access button.",
          "error"
        );
      }
    });

    window.addEventListener("hashchange", function () {
      if (!state.papers.length) return;
      var m = location.hash.match(/^#paper=(.+)$/);
      if (m) {
        var key = decodeURIComponent(m[1]);
        if (findByKey(key)) openDetail(key);
      } else if (dom.detailOverlay.classList.contains("is-open")) {
        closeDetail();
      }
    });
  }

  function handleInitialHash() {
    var m = location.hash.match(/^#paper=(.+)$/);
    if (m) {
      var key = decodeURIComponent(m[1]);
      if (findByKey(key)) openDetail(key);
    }
  }

  /* Build the newest-paper spotlight used in the hero section. */
  function pickSpotlight() {
    var sorted = state.papers.slice().sort(function (a, b) {
      var ay = a.yearNum || 0,
        by = b.yearNum || 0;
      if (by !== ay) return by - ay;
      return b.citations - a.citations;
    });
    return sorted.slice(0, 3);
  }

  function spotlightCardHTML(p, index) {
    var isMain = index === 0;
    return (
      '<button type="button" class="spot-card' +
      (isMain ? " spot-main" : "") +
      '" data-key="' +
      p.key +
      '">' +
      "<div>" +
      '<span class="rank">0' +
      (index + 1) +
      "</span>" +
      "<h4>" +
      escHtml(p.title) +
      "</h4>" +
      '<p class="meta">' +
      escHtml(shortAuthors(p.authors)) +
      (p.year ? " - " + escHtml(p.year) : "") +
      "</p>" +
      "</div>" +
      (isMain
        ? '<div class="tags"><span class="tag-chip">' +
        iconSvg(p.areaIcon) +
        "<span>" +
        escHtml(p.areaName) +
        "</span></span>" +
        (p.partnerName
          ? '<span class="tag-chip"><span>' + escHtml(p.partnerName) + "</span></span>"
          : "") +
        "</div>"
        : "") +
      "</button>"
    );
  }

  function renderHeroSpotlight() {
    var top3 = pickSpotlight();
    if (!top3.length) {
      renderHeroFallback();
      return;
    }
    var html = '<span class="spotlight-label">Newest Additions</span>';
    top3.forEach(function (p, i) {
      html += spotlightCardHTML(p, i);
    });
    html +=
      '<div class="spot-ticker"><div class="ticker-track" id="tickerTrack"></div></div>';
    dom.spotlightDesktop.innerHTML = html;
    dom.spotlightDesktop.addEventListener("click", function (e) {
      var card = e.target.closest("[data-key]");
      if (card) openDetail(card.dataset.key);
    });

    renderTicker();
    renderRollingMobile(top3);
  }

  function renderTicker() {
    var track = document.getElementById("tickerTrack");
    if (!track) return;
    var items = state.papers.slice(0, TICKER_LIMIT);
    if (!items.length) return;
    var html = items
      .map(function (p) {
        return (
          '<button type="button" class="ticker-item" data-key="' +
          p.key +
          '">' +
          escHtml(p.title) +
          "</button>"
        );
      })
      .join("");
    track.innerHTML = html + html;
    track.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-key]");
      if (btn) openDetail(btn.dataset.key);
    });
  }

  function renderRollingMobile(top3) {
    dom.rollingSlides.innerHTML = top3
      .map(function (p, i) {
        return (
          '<button type="button" class="rolling-slide' +
          (i === 0 ? " is-active" : "") +
          '" data-key="' +
          p.key +
          '">' +
          "<h4>" +
          escHtml(p.title) +
          "</h4>" +
          '<p class="meta">' +
          escHtml(shortAuthors(p.authors)) +
          (p.year ? " - " + escHtml(p.year) : "") +
          "</p>" +
          '<div class="tags"><span class="tag-chip">' +
          iconSvg(p.areaIcon) +
          "<span>" +
          escHtml(p.areaName) +
          "</span></span></div>" +
          "</button>"
        );
      })
      .join("");

    dom.rollingSlides.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-key]");
      if (btn) openDetail(btn.dataset.key);
    });

    var slides = dom.rollingSlides.querySelectorAll(".rolling-slide");
    dom.rollingDots.innerHTML = "";
    var current = 0;
    var rollTimer;
    if (!slides.length) return;

    Array.prototype.forEach.call(slides, function (_, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.setAttribute("aria-label", "Show spotlight paper " + (i + 1));
      if (i === 0) b.className = "is-active";
      b.addEventListener("click", function (e) {
        e.stopPropagation();
        goToSlide(i);
        resetTimer();
      });
      dom.rollingDots.appendChild(b);
    });

    function goToSlide(i) {
      slides[current].classList.remove("is-active");
      dom.rollingDots.children[current].classList.remove("is-active");
      current = i;
      slides[current].classList.add("is-active");
      dom.rollingDots.children[current].classList.add("is-active");
    }
    function nextSlide() {
      goToSlide((current + 1) % slides.length);
    }
    function resetTimer() {
      clearInterval(rollTimer);
      var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!reduced && slides.length > 1) rollTimer = setInterval(nextSlide, 4200);
    }
    resetTimer();
  }

  /* Update the visitor counter and the published figures in the hero. */
  function renderVisitorCount(count) {
    if (!dom.visitorCount) return;
    if (typeof count !== "number" || !isFinite(count) || count <= 0) return;
    dom.visitorCount.textContent = String(Math.round(count)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    try {
      window.localStorage.setItem(VISITOR_CACHE_KEY, String(Math.round(count)));
    } catch (e) {
      /* The counter can still be displayed without local storage. */
    }
  }

  function updateVisitorCount() {
    // Use "hit" once per browser tab; later loads only read the current total.
    if (!dom.visitorCount) return;

    var alreadyCountedThisSession = false;
    try {
      alreadyCountedThisSession = window.sessionStorage.getItem(VISITOR_SESSION_KEY) === "1";
    } catch (e) {
      /* Count this visit again if session storage is unavailable. */
    }

    // Count a tab once, then read the existing total on later page loads.
    var action = alreadyCountedThisSession ? "get" : "hit";
    var url = VISITOR_API_BASE + "/" + action + "/" + VISITOR_NAMESPACE + "/" + VISITOR_KEY;

    fetch(url, { cache: "no-store" })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (data) {
        if (!alreadyCountedThisSession) {
          try {
            window.sessionStorage.setItem(VISITOR_SESSION_KEY, "1");
          } catch (e) {
            /* The count still displays if session storage is unavailable. */
          }
        }
        renderVisitorCount(data && data.value);
      })
      .catch(function () {
        // Use the last known value if the counter service is unavailable.
        var cached = null;
        try {
          cached = Number(window.localStorage.getItem(VISITOR_CACHE_KEY));
        } catch (e) {
          cached = null;
        }
        if (cached && !Number.isNaN(cached) && cached > 0) renderVisitorCount(cached);
      });
  }

  function renderStats() {
    // These are the published figures displayed in the hero section.
    dom.statPapers.textContent = "1200";
    dom.statInstitutions.textContent = "25";
    dom.statAreas.textContent = "18";
    dom.statSince.textContent = "1972";
    updateVisitorCount();
  }

  function clearRequestErrors() {
    if (dom.reqName) {
      dom.reqName.classList.remove("has-error");
    }
    if (dom.reqEmail) {
      dom.reqEmail.classList.remove("has-error");
    }
    if (dom.reqNameError) dom.reqNameError.textContent = "";
    if (dom.reqEmailError) dom.reqEmailError.textContent = "";
  }

  function openRequestModal(title, authors) {
    if (!dom.reqPaperTitle || !dom.reqPaperAuthors || !dom.requestOverlay) return;
    dom.reqPaperTitle.textContent = title;
    dom.reqPaperAuthors.textContent = authors;
    if (dom.reqName) dom.reqName.value = "";
    if (dom.reqEmail) dom.reqEmail.value = "";
    if (dom.reqNotes) dom.reqNotes.value = "";
    clearRequestErrors();
    dom.requestOverlay.classList.add("is-open");
    document.body.style.overflow = "hidden";
    setTimeout(function () {
      if (dom.reqName) dom.reqName.focus();
    }, 150);
  }

  function closeRequestModal() {
    if (!dom.requestOverlay) return;
    dom.requestOverlay.classList.remove("is-open");
    document.body.style.overflow = dom.detailOverlay && dom.detailOverlay.classList.contains("is-open") ? "hidden" : "";
  }

  function validateRequestForm() {
    var valid = true;
    clearRequestErrors();
    if (!dom.reqName.value.trim()) {
      dom.reqName.classList.add("has-error");
      dom.reqNameError.textContent = "Please enter your name.";
      valid = false;
    }
    var email = dom.reqEmail.value.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      dom.reqEmail.classList.add("has-error");
      dom.reqEmailError.textContent = "Please enter a valid email address.";
      valid = false;
    }
    return valid;
  }

  function wireRequestModal() {
    dom.requestClose.addEventListener("click", closeRequestModal);
    dom.requestOverlay.addEventListener("click", function (e) {
      if (e.target === dom.requestOverlay) closeRequestModal();
    });
    dom.reqSend.addEventListener("click", function () {
      if (!validateRequestForm()) return;
      var title = dom.reqPaperTitle.textContent;
      var authors = dom.reqPaperAuthors.textContent;
      var name = dom.reqName.value.trim();
      var email = dom.reqEmail.value.trim();
      var notes = dom.reqNotes.value.trim() || "-";
      var subject = "Paper Access Request – " + title;
      var body =
        "Hello Marga Research Hub team,\n\n" +
        "I would like to request access to the following paper:\n\n" +
        "Paper: " +
        title +
        "\n" +
        "Author(s): " +
        authors +
        "\n\n" +
        "Requested by:\n" +
        "Name: " +
        name +
        "\n" +
        "Email: " +
        email +
        "\n\n" +
        "Notes:\n" +
        notes +
        "\n\n" +
        "Thank you,\n" +
        name;
      showToast("Opening your email app…");
      window.location.href = buildMailto(CONTACT_EMAIL, subject, body);
      closeRequestModal();
    });
  }

  /* Open the accessibility information and its guided tour. */
  function openA11yModal() {
    dom.a11yOverlay.classList.add("is-open");
    document.body.style.overflow = "hidden";
  }
  function closeA11yModal() {
    dom.a11yOverlay.classList.remove("is-open");
    document.body.style.overflow = "";
  }
  function wireA11yModal() {
    dom.a11yClose.addEventListener("click", closeA11yModal);
    dom.a11yOverlay.addEventListener("click", function (e) {
      if (e.target === dom.a11yOverlay) closeA11yModal();
    });
    if (dom.a11yTourBtn) {
      dom.a11yTourBtn.addEventListener("click", function () {
        closeA11yModal();
        startTour();
      });
    }
  }

  /* Connect the navigation buttons to the relevant page actions. */
  function setActiveNav(name) {
    Array.prototype.forEach.call(document.querySelectorAll("[data-nav]"), function (el) {
      el.classList.toggle("active", el.dataset.nav === name);
    });
  }

  function wireNav() {
    function on(selector, handler) {
      Array.prototype.forEach.call(document.querySelectorAll(selector), function (el) {
        el.addEventListener("click", handler);
      });
    }
    on('[data-nav="home"]', function () {
      setActiveNav("home");
      closeMobileMenu();
    });
    on('[data-nav="papers"]', function () {
      setActiveNav("papers");
      closeMobileMenu();
    });
    on('[data-nav="contact"]', function (e) {
      e.preventDefault();
      closeMobileMenu();
      window.location.href = buildMailto(
        CONTACT_EMAIL,
        "Question via Research Hub website",
        "Hello Marga Research Hub team,\n\n"
      );
    });
    on('[data-nav="saved"]', function (e) {
      e.preventDefault();
      setActiveNav("saved");
      closeMobileMenu();
      setSavedOnly(true);
    });
    on('[data-nav="a11y"]', function (e) {
      e.preventDefault();
      closeMobileMenu();
      openA11yModal();
    });
  }

  /* Validate the newsletter form and prepare an email request. */
  function wireNewsletter() {
    dom.newsletterForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = dom.newsletterEmail.value.trim();
      dom.newsletterEmail.classList.remove("has-error");
      dom.newsletterError.textContent = "";
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        dom.newsletterEmail.classList.add("has-error");
        dom.newsletterError.textContent = "Please enter a valid email address.";
        return;
      }
      var subject = "Newsletter Subscription Request";
      var body =
        "Hello Marga Research Hub team,\n\n" +
        "Please add the following email address to the research newsletter list:\n\n" +
        email +
        "\n\nThank you.";
      showToast("Opening your email app…");
      window.location.href = buildMailto(CONTACT_EMAIL, subject, body);
      dom.newsletterEmail.value = "";
    });
  }

  /* Show the back-to-top button after the visitor scrolls down. */
  function wireBackToTop() {
    var THRESHOLD = 360;
    var ticking = false;
    function update() {
      dom.backToTopBtn.classList.toggle("is-visible", window.scrollY > THRESHOLD);
      ticking = false;
    }
    window.addEventListener("scroll", function () {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    });
    update();
    dom.backToTopBtn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* Provide quick replies and simple paper searching in the chat panel. */
  function addChatMessage(text, from, isHtml) {
    var msg = document.createElement("div");
    msg.className = "chat-msg " + (from === "user" ? "chat-msg-user" : "chat-msg-bot");
    var p = document.createElement("p");
    if (isHtml) p.innerHTML = text;
    else p.textContent = text;
    msg.appendChild(p);
    dom.chatBody.appendChild(msg);
    dom.chatBody.scrollTop = dom.chatBody.scrollHeight;
    return msg;
  }

  function addChatResults(intro, results) {
    var msg = addChatMessage(intro, "bot");
    var list = document.createElement("div");
    list.className = "chat-results";
    results.forEach(function (p) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "chat-result-btn";
      btn.dataset.key = p.key;
      btn.innerHTML =
        escHtml(p.title) +
        "<span>" +
        escHtml(shortAuthors(p.authors)) +
        (p.year ? " - " + escHtml(p.year) : "") +
        "</span>";
      btn.addEventListener("click", function () {
        openDetail(p.key);
        setChatOpen(false);
      });
      list.appendChild(btn);
    });
    msg.appendChild(list);
    dom.chatBody.scrollTop = dom.chatBody.scrollHeight;
  }

  function showChatTyping() {
    var el = document.createElement("div");
    el.className = "chat-typing";
    el.id = "chatTypingIndicator";
    el.innerHTML = "<span></span><span></span><span></span>";
    dom.chatBody.appendChild(el);
    dom.chatBody.scrollTop = dom.chatBody.scrollHeight;
  }
  function hideChatTyping() {
    var el = document.getElementById("chatTypingIndicator");
    if (el) el.remove();
  }

  function searchPapersFreeText(query, limit) {
    var q = query.trim().toLowerCase();
    if (!q) return [];
    var out = [];
    for (var i = 0; i < state.papers.length && out.length < (limit || 3); i++) {
      var p = state.papers[i];
      var hay = p.titleLower + " " + p.authorsLower + " " + p.areaName.toLowerCase();
      if (hay.indexOf(q) !== -1) out.push(p);
    }
    return out;
  }

  function setChatOpen(open) {
    dom.chatPanel.classList.toggle("is-open", open);
    dom.chatFabBtn.setAttribute("aria-expanded", open);
    if (open) {
      setTimeout(function () {
        dom.chatInput.focus();
      }, 150);
    }
  }

  function wireChat() {
    dom.chatFabBtn.addEventListener("click", function () {
      setChatOpen(!dom.chatPanel.classList.contains("is-open"));
    });
    dom.chatCloseBtn.addEventListener("click", function () {
      setChatOpen(false);
    });

    Array.prototype.forEach.call(
      dom.chatQuickReplies.querySelectorAll(".chip"),
      function (chip) {
        chip.addEventListener("click", function () {
          addChatMessage(chip.textContent, "user");
          var reply = chip.dataset.reply;
          showChatTyping();
          setTimeout(function () {
            hideChatTyping();
            if (reply === "browse") {
              addChatMessage("Here's our newest research - taking you there now.", "bot");
              setChatOpen(false);
              var section = document.getElementById("papers");
              if (section) section.scrollIntoView({ behavior: "smooth" });
            } else if (reply === "request") {
              addChatMessage("Sure - opening a request form for you.", "bot");
              setChatOpen(false);
              openRequestModal("Requested paper title", "Requested paper author(s)");
            } else if (reply === "contact") {
              var mailto = buildMailto(
                CONTACT_EMAIL,
                "Question via Research Hub chat",
                "Hello Marga Research Hub team,\n\n"
              );
              addChatMessage(
                'You can reach the team directly at <a href="' +
                mailto +
                '">' +
                CONTACT_EMAIL +
                "</a>, or use Contact Us in the menu.",
                "bot",
                true
              );
            }
          }, 450);
        });
      }
    );

    dom.chatForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var text = dom.chatInput.value.trim();
      if (!text) return;
      addChatMessage(text, "user");
      dom.chatInput.value = "";
      showChatTyping();
      setTimeout(function () {
        hideChatTyping();
        var results = searchPapersFreeText(text, 3);
        if (results.length) {
          addChatResults("Here's what I found - tap one to view it:", results);
        } else {
          addChatMessage(
            "I couldn't find a paper matching that. Try a topic or author name, or email " +
            CONTACT_EMAIL +
            " and the team will help directly.",
            "bot"
          );
        }
      }, 550);
    });
  }

  /* Let Escape close whichever overlay or panel is currently open. */
  function wireGlobalEscape() {
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      if (dom.tourOverlay && dom.tourOverlay.classList.contains("is-open")) {
        closeTour();
      } else if (dom.detailOverlay.classList.contains("is-open")) {
        closeDetail();
      } else if (dom.requestOverlay.classList.contains("is-open")) {
        closeRequestModal();
      } else if (dom.a11yOverlay.classList.contains("is-open")) {
        closeA11yModal();
      } else if (dom.chatPanel.classList.contains("is-open")) {
        setChatOpen(false);
      } else if (dom.searchPanel.classList.contains("is-open")) {
        setSearchOpen(false);
      } else if (dom.mobileMenuPanel.classList.contains("is-open")) {
        closeMobileMenu();
      }
    });
  }

  /* Connect small static features such as the footer year and email links. */
  function wireMisc() {
    if (dom.storehouseLink) dom.storehouseLink.href = STOREHOUSE_URL;
    if (dom.footerYear) dom.footerYear.textContent = String(new Date().getFullYear());
    Array.prototype.forEach.call(
      document.querySelectorAll(".footer-mailto"),
      function (btn) {
        btn.addEventListener("click", function () {
          window.location.href = buildMailto(
            CONTACT_EMAIL,
            btn.dataset.mailtoSubject || "Message from Research Hub website",
            "Hello Marga Research Hub team,\n\n"
          );
        });
      }
    );
  }

  /* Show a helpful retry message when paper.json cannot be loaded. */
  function renderLoadError(err) {
    console.error("Failed to load paper data:", err);
    dom.resultsCount.textContent = "";
    dom.loadMoreWrap.hidden = true;
    dom.paperGrid.innerHTML =
      '<div class="error-state">' +
      SVG_ERROR +
      "<h3>Couldn't load the paper catalogue</h3>" +
      "<p>This page reads its data from <code>paper.json</code> in the same folder. " +
      "If you opened this file directly from your computer, some browsers block that request. " +
      "Try serving the folder with a local server, for example " +
      "<code>python3 -m http.server</code>, then open the page from that address.</p>" +
      '<button class="btn btn-maroon btn-sm" type="button" id="retryLoadBtn">Try again</button>' +
      "</div>";
    var retryBtn = document.getElementById("retryLoadBtn");
    if (retryBtn) retryBtn.addEventListener("click", init);
    renderHeroFallback();
  }

    /* Keep the loading screen visible until the first data request finishes.
      The timeout below prevents a slow request from blocking the page forever. */
  var preloaderHidden = false;
  var preloaderStartedAt = Date.now();
  var PRELOADER_MIN_DURATION = 2500;
  var preloaderMotion = null;

  function startPreloaderAnimation() {
    if (!dom.preloader || !window.gsap) return;
    var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    var logo = dom.preloader.querySelector(".preloader-logo");
    var word = dom.preloader.querySelector(".preloader-word");
    var bar = dom.preloader.querySelector(".preloader-bar");
    var fill = dom.preloader.querySelector(".preloader-bar-fill");
    var inner = dom.preloader.querySelector(".preloader-inner");

    window.gsap.set([logo, word, bar], { opacity: 0 });
    window.gsap.set(logo, { scale: 0.82, rotation: -6 });
    window.gsap.set(word, { y: 12 });
    window.gsap.set(bar, { y: 8 });
    window.gsap.set(fill, { xPercent: -120 });

    var intro = window.gsap.timeline();
    intro
      .to(logo, { opacity: 1, scale: 1, rotation: 0, duration: 0.75, ease: "back.out(1.7)" })
      .to(word, { opacity: 1, y: 0, duration: 0.55, ease: "power3.out" }, "-=0.35")
      .to(bar, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }, "-=0.2");

    var pulse = window.gsap.to(logo, {
      scale: 1.06,
      duration: 1.1,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });
    var progress = window.gsap.to(fill, {
      xPercent: 220,
      duration: 1.35,
      repeat: -1,
      ease: "power1.inOut"
    });

    preloaderMotion = { intro: intro, pulse: pulse, progress: progress, inner: inner };
  }

  function hidePreloader() {
    if (preloaderHidden) return;
    var remaining = PRELOADER_MIN_DURATION - (Date.now() - preloaderStartedAt);
    if (remaining > 0) {
      setTimeout(hidePreloader, remaining);
      return;
    }
    preloaderHidden = true;
    document.body.classList.remove("is-loading");
    var preloaderEl = dom.preloader || document.getElementById("preloader");
    if (!preloaderEl) return;

    var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (preloaderMotion && window.gsap && !reduceMotion) {
      preloaderMotion.intro.kill();
      preloaderMotion.pulse.kill();
      preloaderMotion.progress.kill();
      window.gsap.timeline({
        onComplete: function () {
          preloaderEl.classList.add("is-hidden");
          setTimeout(function () {
            if (preloaderEl.parentNode) preloaderEl.parentNode.removeChild(preloaderEl);
          }, 600);
        }
      })
        .to(preloaderMotion.inner, { y: -16, opacity: 0, duration: 0.35, ease: "power2.in" })
        .to(preloaderEl, { opacity: 0, duration: 0.55, ease: "power2.inOut" }, "-=0.1");
      return;
    }

    preloaderEl.classList.add("is-hidden");
    setTimeout(function () {
      if (preloaderEl.parentNode) preloaderEl.parentNode.removeChild(preloaderEl);
    }, 600);
  }
  setTimeout(hidePreloader, 8000);

  /* Connect all controls, load the papers, and render the first view. */
  var wired = false;
  function init() {
    if (!wired) {
      cacheDom();
      startPreloaderAnimation();
      wireTheme();
      wireHeader();
      wireToolbar();
      wireGridDelegation();
      wireDetailModal();
      wireRequestModal();
      wireA11yModal();
      wireTour();
      wireNav();
      wireNewsletter();
      wireBackToTop();
      wireChat();
      wireGlobalEscape();
      wireMisc();
      wired = true;
    }
    renderSkeletons(PAGE_SIZE);
    renderHeroSkeletons();
    loadPapers()
      .then(function (raw) {
        papersByKey = {};
        state.papers = raw.map(normalize);
        setupYearSlider();
        populateFilterSelects();
        renderStats();
        renderHeroSpotlight();
        computeFiltered();
        renderActiveFilterChips();
        renderGrid();
        updateSavedCount();
        handleInitialHash();
        if (!isTourSeen() && !dom.detailOverlay.classList.contains("is-open")) {
          startTour();
        }
        hidePreloader();
      })
      .catch(function (err) {
        renderLoadError(err);
        hidePreloader();
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

function openOfflinePage() {
  if (window.location.pathname.endsWith("/offline.html")) return;
  window.location.replace("offline.html");
}

if (navigator.onLine === false) openOfflinePage();
window.addEventListener("offline", openOfflinePage);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", function () {
    navigator.serviceWorker.register("sw.js").catch(function (error) {
      console.warn("Offline fallback could not be registered:", error);
    });
  });
}