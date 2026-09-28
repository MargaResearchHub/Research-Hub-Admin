(function () {
  "use strict";

  /* ============================================================
     CONFIG
     ============================================================ */

  // Paste the Apps Script web app URL (ends in /exec) here.
  // app.js
  var API_URL = "https://script.google.com/macros/s/AKfycbzQdyW1KDBDw-ThzYvk2stL8YxrLuqxNatpn9Z-B78kMW0GC6eVLIhK0jQamci9tLayzg/exec";

  var SESSION_KEY = "libraryAdminSession";       // sessionStorage - cleared when tab closes


  var AREA_ICON_PRESETS = ["fa-language", "fa-file", "fa-gavel", "fa-users", "fa-landmark"];
  var LITTYPE_PRESETS = ["published", "unpublished", "presentation", "report"];

  var ACTION_LABELS = {
    LOGIN: "Signed in",
    LOGOUT: "Signed out",
    ADD_ENTRY: "Added entry",
    EDIT_ENTRY: "Edited entry",
    DELETE_ENTRY: "Deleted entry",
    DOWNLOAD_JSON: "Exported paper.json",
    IMPORT_JSON: "Imported paper.json",
    LOGIN_FAILED: "Failed sign-in",
    AUDIT_CLEARED: "Audit log cleared",
    USER_CREATED: "Account created",
    USER_REMOVED: "Account removed",
    PASSWORD_RESET: "Password reset by admin",
    PASSWORD_CHANGED: "Password changed",
    ROLE_CHANGED: "Role changed"
  };


  /* ============================================================
     TINY SELF-CONTAINED SVG ICON SET (no external icon dependency)
     ============================================================ */
  var ICONS = {
    edit: '<svg viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12.9 3.6l3.5 3.5-9 9-4 .9.9-4z"/></svg>',
    trash: '<svg viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 6h12M8 6V4.5A1.5 1.5 0 0 1 9.5 3h1A1.5 1.5 0 0 1 12 4.5V6M6 6l.7 10a1 1 0 0 0 1 .9h4.6a1 1 0 0 0 1-.9L14 6"/></svg>',
    eye: '<svg viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M1.5 10S4.5 4.5 10 4.5 18.5 10 18.5 10 15.5 15.5 10 15.5 1.5 10 1.5 10z"/><circle cx="10" cy="10" r="2.5"/></svg>',
    close: '<svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 4l12 12M16 4L4 16"/></svg>'
  };

  /* ============================================================
     DOM CACHE
     ============================================================ */
  var dom = {};
  function cacheDom() {
    dom.loginScreen = document.getElementById("loginScreen");
    dom.loginForm = document.getElementById("loginForm");
    dom.loginUsername = document.getElementById("loginUsername");
    dom.loginPassword = document.getElementById("loginPassword");
    dom.loginError = document.getElementById("loginError");
    dom.loginSubmitBtn = document.getElementById("loginSubmitBtn");

    dom.dashboard = document.getElementById("dashboard");
    dom.roleStamp = document.getElementById("roleStamp");
    dom.sessionUser = document.getElementById("sessionUser");
    dom.logoutBtn = document.getElementById("logoutBtn");

    dom.addEntryBtn = document.getElementById("addEntryBtn");
    dom.importBtn = document.getElementById("importBtn");
    dom.importFileInput = document.getElementById("importFileInput");
    dom.exportBtn = document.getElementById("exportBtn");
    dom.auditToggleBtn = document.getElementById("auditToggleBtn");
    dom.tableSearchInput = document.getElementById("tableSearchInput");

    dom.entryCount = document.getElementById("entryCount");
    dom.tableWrap = document.getElementById("tableWrap");
    dom.tableBody = document.getElementById("tableBody");
    dom.emptyState = document.getElementById("emptyState");
    dom.emptyImportBtn = document.getElementById("emptyImportBtn");
    dom.emptyAddBtn = document.getElementById("emptyAddBtn");

    dom.entryModalOverlay = document.getElementById("entryModalOverlay");
    dom.entryModalTitle = document.getElementById("entryModalTitle");
    dom.entryModalClose = document.getElementById("entryModalClose");
    dom.entryForm = document.getElementById("entryForm");
    dom.entrySaveBtn = document.getElementById("entrySaveBtn");
    dom.entryReadonlyNote = document.getElementById("entryReadonlyNote");

    dom.deleteModalOverlay = document.getElementById("deleteModalOverlay");
    dom.deleteModalClose = document.getElementById("deleteModalClose");
    dom.deleteSummary = document.getElementById("deleteSummary");
    dom.deleteCancelBtn = document.getElementById("deleteCancelBtn");
    dom.deleteConfirmBtn = document.getElementById("deleteConfirmBtn");

    dom.importModalOverlay = document.getElementById("importModalOverlay");
    dom.importModalClose = document.getElementById("importModalClose");
    dom.importSummary = document.getElementById("importSummary");
    dom.importCancelBtn = document.getElementById("importCancelBtn");
    dom.importConfirmBtn = document.getElementById("importConfirmBtn");

    dom.auditOverlay = document.getElementById("auditOverlay");
    dom.auditModalClose = document.getElementById("auditModalClose");
    dom.auditList = document.getElementById("auditList");
    dom.clearAuditBtn = document.getElementById("clearAuditBtn");

    dom.changePwBtn = document.getElementById("changePwBtn");
    dom.accountsBtn = document.getElementById("accountsBtn");
    dom.accountsOverlay = document.getElementById("accountsOverlay");
    dom.accountsModalClose = document.getElementById("accountsModalClose");
    dom.credBox = document.getElementById("credBox");
    dom.credTitle = document.getElementById("credTitle");
    dom.credUser = document.getElementById("credUser");
    dom.credPass = document.getElementById("credPass");
    dom.credCopyBtn = document.getElementById("credCopyBtn");
    dom.createUserForm = document.getElementById("createUserForm");
    dom.newUsername = document.getElementById("newUsername");
    dom.newRole = document.getElementById("newRole");
    dom.newPassword = document.getElementById("newPassword");
    dom.genPwBtn = document.getElementById("genPwBtn");
    dom.createUserError = document.getElementById("createUserError");
    dom.createUserBtn = document.getElementById("createUserBtn");
    dom.accountsList = document.getElementById("accountsList");
    dom.passwordOverlay = document.getElementById("passwordOverlay");
    dom.passwordModalClose = document.getElementById("passwordModalClose");
    dom.passwordTitle = document.getElementById("passwordTitle");
    dom.passwordNote = document.getElementById("passwordNote");
    dom.passwordForm = document.getElementById("passwordForm");
    dom.pwCurrent = document.getElementById("pwCurrent");
    dom.pwNew = document.getElementById("pwNew");
    dom.pwConfirm = document.getElementById("pwConfirm");
    dom.passwordError = document.getElementById("passwordError");
    dom.passwordSubmitBtn = document.getElementById("passwordSubmitBtn");

    dom.toastWrap = document.getElementById("toastWrap");

    dom.areaIconList = document.getElementById("areaIconList");
    dom.litTypeList = document.getElementById("litTypeList");
    dom.partnerNameList = document.getElementById("partnerNameList");
    dom.areaNameList = document.getElementById("areaNameList");
  }

  /* ============================================================
     SERVER API - Google Apps Script web app in front of the private Drive file
     ============================================================ */
  function api(action, payload) {
    if (/PASTE_/.test(API_URL)) return Promise.reject(new Error("API_URL hasn't been set in app.js yet."));
    var body = { action: action };
    var session = getSession();
    if (session && session.token) body.token = session.token;
    Object.keys(payload || {}).forEach(function (k) { body[k] = payload[k]; });
    // No Content-Type header on purpose: plain text keeps this a "simple" request,
    // which Apps Script can answer without a CORS preflight.
    return fetch(API_URL, { method: "POST", body: JSON.stringify(body) })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (!data || data.ok !== true) {
          var err = new Error((data && data.error) || "Unexpected response from the server.");
          err.code = data && data.code;
          throw err;
        }
        return data;
      }, function () {
        throw new Error("Can't reach the server. Check your connection and try again.");
      });
  }

  /* ============================================================
     SESSION (sessionStorage - cleared when the tab closes)
     ============================================================ */
  function getSession() {
    try {
      var raw = window.sessionStorage.getItem(SESSION_KEY);
      var parsed = raw ? JSON.parse(raw) : null;
      if (!parsed || !parsed.username || !parsed.token || (parsed.role !== "admin" && parsed.role !== "user")) return null;
      // if (parsed.expiresAt && Date.now() > parsed.expiresAt) return null; // Temporarily disabled while debugging.
      return parsed; // the role here only shapes the screen - the server re-checks it on every request
    } catch (e) {
      return null;
    }
  }
  function setSession(username, role, token, expiresAt, mustChange) {
    try {
      window.sessionStorage.setItem(SESSION_KEY, JSON.stringify({ username: username, role: role, token: token, expiresAt: expiresAt, mustChange: !!mustChange }));
    } catch (e) { /* storage unavailable - session just won't survive a reload */ }
  }
  function clearSession() {
    try { window.sessionStorage.removeItem(SESSION_KEY); } catch (e) { /* ignore */ }
  }

  /* ============================================================
     AUDIT LOG - the server records sign-ins and every add / edit / delete itself,
     so it can't be faked from a browser. The browser only reports the two
     things the server can't see on its own.
     ============================================================ */
  function logAction(action, details) {
    if (action !== "LOGOUT" && action !== "DOWNLOAD_JSON") return;
    api("logEvent", { event: action, details: details || "" }).catch(function () { /* best effort */ });
  }

  /* ============================================================
     ENTRIES DATA (in memory - the Drive file is the source of truth)
     ============================================================ */
  var entries = [];

  var entriesVersion = null; // which version of the Drive file this screen was loaded from

  function loadEntriesFromServer() {
    return api("getPapers").then(function (data) {
      entries = (data.papers || []).map(coerceImportedRecord);
      entriesVersion = data.version;
    });
  }

  // Sends the full proposed list to the server. The local list only changes once the
  // server accepts it, so the screen never shows something that wasn't actually saved.
  function saveEntries(next, isBulk) {
    return api("save", { papers: next, version: entriesVersion, bulk: !!isBulk }).then(function (data) {
      entries = next;
      entriesVersion = data.version;
    });
  }

  function sessionExpired() {
    clearSession();
    showLoginScreen();
    dom.loginError.textContent = "Your session has ended. Please sign in again.";
  }

  function handleApiError(err) {
    if (err && err.code === "auth") { sessionExpired(); return; }
    if (err && err.code === "mustchange") {
      var s = getSession();
      if (s) setSession(s.username, s.role, s.token, s.expiresAt, true);
      openPasswordModal(true);
      return;
    }
    toast((err && err.message) || "Something went wrong.", "error");
    if (err && err.code === "conflict") {
      loadEntriesFromServer().then(refreshAll).catch(function () { /* keep what's on screen */ });
    }
  }

  function findEntryIndexById(id) {
    for (var i = 0; i < entries.length; i++) {
      if (entries[i].id === id) return i;
    }
    return -1;
  }
  function idExists(id, excludeId) {
    for (var i = 0; i < entries.length; i++) {
      if (entries[i].id === id && entries[i].id !== excludeId) return true;
    }
    return false;
  }

  function nextEntryId() {
    var maxNum = 0;
    entries.forEach(function (e) {
      var m = /^SLR-(\d+)$/i.exec((e.id || "").trim());
      if (m) {
        var n = parseInt(m[1], 10);
        if (n > maxNum) maxNum = n;
      }
    });
    return "SLR-" + String(maxNum + 1).padStart(3, "0");
  }

  /* ============================================================
     SMALL HELPERS
     ============================================================ */
  function escHtml(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
  function uniqueNonEmpty(list) {
    var seen = {};
    var out = [];
    list.forEach(function (v) {
      var t = (v || "").toString().trim();
      if (t && !seen[t]) { seen[t] = true; out.push(t); }
    });
    return out;
  }
  function fillDatalist(el, values) {
    if (!el) return;
    el.innerHTML = values.map(function (v) { return '<option value="' + escHtml(v) + '">'; }).join("");
  }
  function formatTimestamp(iso) {
    try {
      var d = new Date(iso);
      return d.toLocaleString(undefined, {
        year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
      });
    } catch (e) {
      return iso;
    }
  }

  /* ============================================================
     TOAST - the small stamp chip is the signature visual moment,
     kept contained here rather than a full-screen overlay so it
     never gets in the way during repeated data-entry actions.
     ============================================================ */
  function toast(message, type, stampWord) {
    if (!dom.toastWrap) return;
    var el = document.createElement("div");
    el.className = "toast toast-" + (type || "info");
    el.innerHTML =
      (stampWord ? '<span class="toast-seal">' + escHtml(stampWord) + "</span>" : "") +
      '<span class="toast-msg">' + escHtml(message) + "</span>";
    dom.toastWrap.appendChild(el);
    requestAnimationFrame(function () { el.classList.add("is-visible"); });
    setTimeout(function () {
      el.classList.remove("is-visible");
      setTimeout(function () { el.remove(); }, 250);
    }, 3400);
  }

  /* ============================================================
     DATALISTS - rebuilt from whatever is currently in `entries`
     ============================================================ */
  function refreshDatalists() {
    fillDatalist(dom.partnerNameList, uniqueNonEmpty(entries.map(function (e) { return e.partnerName; })).sort());
    fillDatalist(dom.areaNameList, uniqueNonEmpty(entries.map(function (e) { return e.areaName; })).sort());
    var iconValues = uniqueNonEmpty(AREA_ICON_PRESETS.concat(entries.map(function (e) { return e.areaIcon; })));
    fillDatalist(dom.areaIconList, iconValues);
    var typeValues = uniqueNonEmpty(LITTYPE_PRESETS.concat(entries.map(function (e) { return e.litType; })));
    fillDatalist(dom.litTypeList, typeValues);
  }

  /* ============================================================
     TABLE RENDER
     ============================================================ */
  function getSearchQuery() {
    return (dom.tableSearchInput && dom.tableSearchInput.value || "").trim().toLowerCase();
  }
  function matchesSearch(entry, q) {
    if (!q) return true;
    var hay = [entry.id, entry.title, entry.authors, entry.partnerName, entry.areaName]
      .map(function (v) { return (v || "").toString().toLowerCase(); })
      .join(" ");
    return hay.indexOf(q) !== -1;
  }
  function renderTable() {
    var session = getSession();
    var isAdmin = !!session && session.role === "admin";
    var canEdit = !!session;   // staff and admins can edit; only admins can delete
    var q = getSearchQuery();
    var visible = entries.filter(function (e) { return matchesSearch(e, q); });

    dom.entryCount.textContent = entries.length === 0
      ? ""
      : (visible.length === entries.length
        ? entries.length + (entries.length === 1 ? " record" : " records")
        : visible.length + " of " + entries.length + " records");

    if (entries.length === 0) {
      dom.tableWrap.hidden = true;
      dom.emptyState.hidden = false;
      dom.tableBody.innerHTML = "";
      return;
    }
    dom.emptyState.hidden = true;
    dom.tableWrap.hidden = false;

    if (visible.length === 0) {
      dom.tableBody.innerHTML = '<tr class="no-match-row"><td colspan="6">No records match “' + escHtml(q) + '”.</td></tr>';
      return;
    }

    dom.tableBody.innerHTML = visible.map(function (e) {
      return (
        '<tr data-id="' + escHtml(e.id) + '">' +
        "<td class=\"cell-id\">" + escHtml(e.id) + (e.isMarga ? '<span class="mini-seal" title="Marga Institute">M</span>' : "") + "</td>" +
        '<td class="cell-title">' + escHtml(e.title) + "</td>" +
        '<td class="cell-authors">' + escHtml(e.authors) + "</td>" +
        "<td>" + escHtml(e.year || "-") + "</td>" +
        "<td>" + escHtml(e.areaName || "-") + "</td>" +
        '<td class="cell-actions">' +
        '<button type="button" class="icon-btn" data-action="view" title="View">' + ICONS.eye + "</button>" +
        (canEdit ? '<button type="button" class="icon-btn" data-action="edit" title="Edit">' + ICONS.edit + "</button>" : "") +
        (isAdmin ? '<button type="button" class="icon-btn icon-btn-danger" data-action="delete" title="Delete">' + ICONS.trash + "</button>" : "") +
        "</td></tr>"
      );
    }).join("");
  }

  /* ============================================================
     ENTRY MODAL (Add / Edit / View)
     ============================================================ */
  var entryModalMode = "add"; // "add" | "edit" | "view"
  var entryModalOriginalId = null;
  var isMargaManuallySet = false;
  var lastFocusedEl = null;

  function fieldEls() {
    return {
      id: document.getElementById("fld_id"),
      title: document.getElementById("fld_title"),
      authors: document.getElementById("fld_authors"),
      year: document.getElementById("fld_year"),
      partner: document.getElementById("fld_partner"),
      partnerName: document.getElementById("fld_partnerName"),
      isMarga: document.getElementById("fld_isMarga"),
      area: document.getElementById("fld_area"),
      areaName: document.getElementById("fld_areaName"),
      areaIcon: document.getElementById("fld_areaIcon"),
      litType: document.getElementById("fld_litType"),
      citations: document.getElementById("fld_citations"),
      pdfUrl: document.getElementById("fld_pdfUrl"),
      abstract: document.getElementById("fld_abstract")
    };
  }

  function setFormDisabled(disabled) {
    var f = fieldEls();
    Object.keys(f).forEach(function (k) { if (f[k]) f[k].disabled = disabled; });
  }

  function openEntryModal(mode, entry) {
    var session = getSession();
    if (mode !== "view" && !session) return;

    entryModalMode = mode;
    entryModalOriginalId = entry ? entry.id : null;
    isMargaManuallySet = mode !== "add";
    lastFocusedEl = document.activeElement;

    var f = fieldEls();
    var blank = { id: "", title: "", authors: "", year: "", partner: "", partnerName: "", isMarga: false, area: "", areaName: "", areaIcon: "", litType: "", citations: 0, pdfUrl: "", abstract: "" };
    var data = entry || blank;

    f.id.value = mode === "add" ? nextEntryId() : (data.id || ""); f.title.value = data.title || "";
    f.authors.value = data.authors || "";
    f.year.value = data.year || "";
    f.partner.value = data.partner || "";
    f.partnerName.value = data.partnerName || "";
    f.isMarga.checked = !!data.isMarga;
    f.area.value = data.area || "";
    f.areaName.value = data.areaName || "";
    f.areaIcon.value = data.areaIcon || "";
    f.litType.value = data.litType || "";
    f.citations.value = (data.citations != null ? data.citations : 0);
    f.pdfUrl.value = data.pdfUrl || "";
    f.abstract.value = data.abstract || "";

    clearFormErrors();

    var titleText = mode === "add" ? "Add entry" : mode === "edit" ? "Edit entry" : "View entry";
    dom.entryModalTitle.textContent = titleText;
    dom.entrySaveBtn.hidden = mode === "view";
    dom.entryReadonlyNote.hidden = mode !== "view";
    setFormDisabled(mode === "view");

    dom.entryModalOverlay.classList.add("is-open");
    f.id.disabled = true;
    f.title.focus();
  }

  function closeEntryModal() {
    dom.entryModalOverlay.classList.remove("is-open");
    if (lastFocusedEl && lastFocusedEl.focus) lastFocusedEl.focus();
  }

  function clearFormErrors() {
    document.querySelectorAll("#entryForm .modal-field-error").forEach(function (el) { el.textContent = ""; });
    document.querySelectorAll("#entryForm .has-error").forEach(function (el) { el.classList.remove("has-error"); });
  }
  function setFieldError(input, message) {
    input.classList.add("has-error");
    var id = f.id.value.trim();
    if (idExists(id, entryModalOriginalId)) { setFieldError(f.id, "That ID is already in use - choose a different one."); ok = false; }
  }

  function validateEntryForm() {
    clearFormErrors();
    var f = fieldEls();
    var ok = true;

    var id = f.id.value.trim();
    if (!id) { setFieldError(f.id, "Required."); ok = false; }
    else if (idExists(id, entryModalOriginalId)) { setFieldError(f.id, "That ID is already in use - choose a different one."); ok = false; }

    if (!f.title.value.trim()) { setFieldError(f.title, "Required."); ok = false; }
    if (!f.authors.value.trim()) { setFieldError(f.authors, "Required."); ok = false; }
    if (!f.year.value.trim()) { setFieldError(f.year, "Required."); ok = false; }
    if (!f.partnerName.value.trim()) { setFieldError(f.partnerName, "Required."); ok = false; }
    if (!f.areaName.value.trim()) { setFieldError(f.areaName, "Required."); ok = false; }
    if (!f.litType.value.trim()) { setFieldError(f.litType, "Required."); ok = false; }

    return ok;
  }

  function readEntryForm() {
    var f = fieldEls();
    var authors = f.authors.value.trim();
    return {
      id: f.id.value.trim(),
      title: f.title.value.trim(),
      authors: authors,
      authorsLower: authors.toLowerCase(),
      year: f.year.value.trim(),
      partner: f.partner.value.trim(),
      partnerName: f.partnerName.value.trim(),
      isMarga: !!f.isMarga.checked,
      area: f.area.value.trim(),
      areaName: f.areaName.value.trim(),
      areaIcon: f.areaIcon.value.trim(),
      abstract: f.abstract.value.trim(),
      pdfUrl: f.pdfUrl.value.trim(),
      citations: Number(f.citations.value) || 0,
      litType: f.litType.value.trim().toLowerCase()
    };
  }

  function handleEntryFormSubmit(e) {
    e.preventDefault();
    if (!validateEntryForm()) return;
    var data = readEntryForm();
    var next = entries.slice();
    var okMessage, stamp;

    if (entryModalMode === "add") {
      next.push(data);
      okMessage = "Entry added."; stamp = "FILED";
    } else if (entryModalMode === "edit") {
      var idx = findEntryIndexById(entryModalOriginalId);
      if (idx === -1) { toast("That entry no longer exists.", "error"); closeEntryModal(); refreshAll(); return; }
      next[idx] = data;
      okMessage = "Entry updated."; stamp = "UPDATED";
    } else {
      return;
    }

    dom.entrySaveBtn.disabled = true;
    dom.entrySaveBtn.textContent = "Saving…";
    saveEntries(next)
      .then(function () {
        toast(okMessage, "success", stamp);
        closeEntryModal();
        refreshAll();
      })
      .catch(handleApiError)
      .finally(function () {
        dom.entrySaveBtn.disabled = false;
        dom.entrySaveBtn.textContent = "Save entry";
      });
  }

  /* ============================================================
     DELETE CONFIRM
     ============================================================ */
  var pendingDeleteId = null;

  function openDeleteConfirm(id) {
    var session = getSession();
    if (!session || session.role !== "admin") return;
    var idx = findEntryIndexById(id);
    if (idx === -1) return;
    pendingDeleteId = id;
    var e = entries[idx];
    dom.deleteSummary.innerHTML = "<strong>" + escHtml(e.title) + "</strong><span>" + escHtml(e.id) + " - " + escHtml(e.authors) + "</span>";
    dom.deleteModalOverlay.classList.add("is-open");
  }
  function closeDeleteConfirm() {
    dom.deleteModalOverlay.classList.remove("is-open");
    pendingDeleteId = null;
  }
  function confirmDelete() {
    if (!pendingDeleteId) return;
    var idx = findEntryIndexById(pendingDeleteId);
    if (idx === -1) { closeDeleteConfirm(); return; }
    var next = entries.slice();
    next.splice(idx, 1);
    dom.deleteConfirmBtn.disabled = true;
    saveEntries(next)
      .then(function () {
        toast("Entry deleted.", "success", "REMOVED");
        closeDeleteConfirm();
        refreshAll();
      })
      .catch(function (err) { closeDeleteConfirm(); handleApiError(err); })
      .finally(function () { dom.deleteConfirmBtn.disabled = false; });
  }

  /* ============================================================
     IMPORT / EXPORT
     ============================================================ */
  var pendingImportData = null;

  var EXPORT_FIELD_ORDER = ["id", "title", "authors", "authorsLower", "year", "partner", "partnerName", "isMarga", "area", "areaName", "areaIcon", "abstract", "pdfUrl", "citations", "litType"];

  function coerceImportedRecord(raw) {
    var authors = (raw.authors || "").toString().trim();
    return {
      id: (raw.id || "").toString().trim(),
      title: (raw.title || "").toString().trim(),
      authors: authors,
      authorsLower: authors.toLowerCase(),
      year: raw.year != null ? raw.year.toString().trim() : "",
      partner: (raw.partner || "").toString().trim(),
      partnerName: (raw.partnerName || "").toString().trim(),
      isMarga: raw.isMarga === true || raw.isMarga === "true",
      area: (raw.area || "").toString().trim(),
      areaName: (raw.areaName || "").toString().trim(),
      areaIcon: (raw.areaIcon || "").toString().trim(),
      abstract: (raw.abstract || "").toString().trim(),
      pdfUrl: (raw.pdfUrl || "").toString().trim(),
      citations: Number(raw.citations) || 0,
      litType: (raw.litType || "").toString().trim().toLowerCase()
    };
  }

  function handleImportFile(file) {
    var reader = new FileReader();
    reader.onload = function () {
      var parsed;
      try {
        parsed = JSON.parse(reader.result);
      } catch (e) {
        toast("That file isn't valid JSON.", "error");
        return;
      }
      if (!Array.isArray(parsed)) {
        toast("Expected a JSON array of paper records.", "error");
        return;
      }
      pendingImportData = parsed.map(coerceImportedRecord);
      dom.importSummary.innerHTML =
        "This will replace <strong>" + entries.length + "</strong> record" + (entries.length === 1 ? "" : "s") +
        " currently loaded with <strong>" + pendingImportData.length + "</strong> record" + (pendingImportData.length === 1 ? "" : "s") +
        " from this file.";
      dom.importModalOverlay.classList.add("is-open");
    };
    reader.onerror = function () { toast("Couldn't read that file.", "error"); };
    reader.readAsText(file);
  }
  function closeImportConfirm() {
    dom.importModalOverlay.classList.remove("is-open");
    pendingImportData = null;
    dom.importFileInput.value = "";
  }
  function confirmImport() {
    if (!pendingImportData) return;
    var next = pendingImportData;
    dom.importConfirmBtn.disabled = true;
    saveEntries(next, true)
      .then(function () {
        toast("Imported " + entries.length + " records.", "success", "LOADED");
        closeImportConfirm();
        refreshAll();
      })
      .catch(function (err) { closeImportConfirm(); handleApiError(err); })
      .finally(function () { dom.importConfirmBtn.disabled = false; });
  }

  function exportPaperJson() {
    var ordered = entries.map(function (e) {
      var out = {};
      EXPORT_FIELD_ORDER.forEach(function (k) {
        out[k] = k === "isMarga" ? !!e.isMarga : (e[k] != null ? e[k] : (k === "citations" ? 0 : ""));
      });
      return out;
    });
    var json = JSON.stringify(ordered, null, 2);
    var blob = new Blob([json], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "paper.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    logAction("DOWNLOAD_JSON", entries.length + " entries exported");
    toast("paper.json downloaded.", "success", "EXPORTED");
  }

  /* ============================================================
     AUDIT TRAIL PANEL
     ============================================================ */
  function openAuditPanel() {
    var session = getSession();
    if (!session || session.role !== "admin") return;
    dom.auditList.innerHTML = '<p class="audit-empty">Loading…</p>';
    dom.auditOverlay.classList.add("is-open");
    api("getAudit")
      .then(function (data) { renderAuditPanel(data.log || []); })
      .catch(function (err) { closeAuditPanel(); handleApiError(err); });
  }
  function closeAuditPanel() {
    dom.auditOverlay.classList.remove("is-open");
  }
  function renderAuditPanel(log) {
    var list = log.slice().reverse();
    if (list.length === 0) {
      dom.auditList.innerHTML = '<p class="audit-empty">No activity recorded yet.</p>';
      return;
    }
    dom.auditList.innerHTML = list.map(function (entry) {
      var actionClass = "audit-dot-" + entry.action.toLowerCase().replace(/_/g, "-");
      return (
        '<div class="audit-row">' +
        '<span class="audit-dot ' + actionClass + '"></span>' +
        '<div class="audit-row-main">' +
        '<div class="audit-row-top"><strong>' + escHtml(ACTION_LABELS[entry.action] || entry.action) + "</strong>" +
        '<span class="audit-time">' + escHtml(formatTimestamp(entry.timestamp)) + "</span></div>" +
        '<div class="audit-row-meta">' + escHtml(entry.user) + " · " + escHtml(entry.role) +
        (entry.details ? " - " + escHtml(entry.details) : "") + "</div>" +
        "</div></div>"
      );
    }).join("");
  }
  function handleClearAuditLog() {
    if (!window.confirm("Clear the entire audit log? This can't be undone.")) return;
    api("clearAudit")
      .then(function () { return api("getAudit"); })
      .then(function (data) {
        renderAuditPanel(data.log || []);
        toast("Audit log cleared.", "success");
      })
      .catch(handleApiError);
  }

  /* ============================================================
     CHANGE PASSWORD - everyone. Required on first sign-in with a password an admin gave you.
     ============================================================ */
  var passwordForced = false;

  function openPasswordModal(forced) {
    passwordForced = !!forced;
    dom.passwordForm.reset();
    dom.passwordError.textContent = "";
    dom.passwordTitle.textContent = forced ? "Choose your own password" : "Change password";
    dom.passwordNote.textContent = forced
      ? "An admin set your current password. Choose a new one to continue - after that, only you will know it. (Closing this window signs you out.)"
      : "Your other signed-in devices will be signed out.";
    dom.passwordModalClose.setAttribute("aria-label", forced ? "Sign out" : "Close");
    dom.passwordOverlay.classList.add("is-open");
    dom.pwCurrent.focus();
  }

  function closePasswordModal() {
    if (passwordForced) {          // can't skip it - closing means signing out
      passwordForced = false;
      handleLogout();
      return;
    }
    dom.passwordOverlay.classList.remove("is-open");
    dom.passwordForm.reset();
  }

  function handlePasswordSubmit(e) {
    e.preventDefault();
    var current = dom.pwCurrent.value, next = dom.pwNew.value, confirm = dom.pwConfirm.value;
    dom.passwordError.textContent = "";
    if (!current || !next || !confirm) { dom.passwordError.textContent = "Fill in all three fields."; return; }
    if (next.length < 10) { dom.passwordError.textContent = "The new password needs at least 10 characters."; return; }
    if (next !== confirm) { dom.passwordError.textContent = "The two new passwords don't match."; return; }
    if (next === current) { dom.passwordError.textContent = "Choose a password that's different from the current one."; return; }

    dom.passwordSubmitBtn.disabled = true;
    dom.passwordSubmitBtn.textContent = "Updating…";
    api("changePassword", { oldPassword: current, newPassword: next })
      .then(function (data) {
        var s = getSession();
        setSession(s.username, s.role, data.token, data.expiresAt, false);
        var wasForced = passwordForced;
        passwordForced = false;
        dom.passwordOverlay.classList.remove("is-open");
        dom.passwordForm.reset();
        toast("Password updated.", "success", "UPDATED");
        if (wasForced) loadDashboardData();
      })
      .catch(function (err) {
        if (err && err.code === "auth") { passwordForced = false; sessionExpired(); return; }
        dom.passwordError.textContent = (err && err.message) || "Couldn't update the password.";
      })
      .finally(function () {
        dom.passwordSubmitBtn.disabled = false;
        dom.passwordSubmitBtn.textContent = "Update password";
      });
  }

  /* ============================================================
     ACCOUNTS (admins only) - the server enforces this; hiding the button is just tidiness
     ============================================================ */
  var accountsCache = [];

  // 12 random characters in 3 groups, from an alphabet without look-alikes (no 0/O, 1/l/I).
  function generatePassword() {
    var alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
    var limit = 256 - (256 % alphabet.length);   // rejection sampling: no modulo bias
    var out = "";
    var bytes = new Uint8Array(32);
    while (out.replace(/-/g, "").length < 12) {
      window.crypto.getRandomValues(bytes);
      for (var i = 0; i < bytes.length && out.replace(/-/g, "").length < 12; i++) {
        if (bytes[i] >= limit) continue;
        var len = out.replace(/-/g, "").length;
        if (len > 0 && len % 4 === 0) out += "-";
        out += alphabet.charAt(bytes[i] % alphabet.length);
      }
    }
    return out;
  }

  function showCredentials(title, username, password) {
    dom.credTitle.textContent = title;
    dom.credUser.textContent = username;
    dom.credPass.textContent = password;
    dom.credBox.hidden = false;
  }
  function hideCredentials() {
    dom.credBox.hidden = true;
    dom.credUser.textContent = "";
    dom.credPass.textContent = "";    // don't leave a password sitting in the page
  }
  function copyCredentials() {
    var text = "Username: " + dom.credUser.textContent + "\nPassword: " + dom.credPass.textContent;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        function () { toast("Copied.", "success"); },
        function () { toast("Couldn't copy - select the text and copy it by hand.", "error"); }
      );
    } else {
      toast("Couldn't copy - select the text and copy it by hand.", "error");
    }
  }

  function openAccountsPanel() {
    var session = getSession();
    if (!session || session.role !== "admin") return;
    hideCredentials();
    dom.createUserError.textContent = "";
    dom.newUsername.value = "";
    dom.newRole.value = "user";
    dom.newPassword.value = generatePassword();
    dom.accountsList.innerHTML = '<p class="accounts-empty">Loading…</p>';
    dom.accountsOverlay.classList.add("is-open");
    refreshAccounts();
  }
  function closeAccountsPanel() {
    dom.accountsOverlay.classList.remove("is-open");
    hideCredentials();
  }

  function refreshAccounts() {
    return api("listUsers")
      .then(function (data) { accountsCache = data.users || []; renderAccounts(); })
      .catch(function (err) { closeAccountsPanel(); handleApiError(err); });
  }

  function renderAccounts() {
    var me = (getSession() || {}).username;
    if (accountsCache.length === 0) {
      dom.accountsList.innerHTML = '<p class="accounts-empty">No accounts yet.</p>';
      return;
    }
    dom.accountsList.innerHTML = accountsCache.map(function (u) {
      var self = u.username === me;
      var isAdminRole = u.role === "admin";
      var status = self ? "You" : (u.mustChange ? "Hasn't chosen their own password yet" : "Active");
      return (
        '<div class="account-row" data-username="' + escHtml(u.username) + '">' +
        '<div class="account-info">' +
        '<span class="account-name">' + escHtml(u.username) + "</span>" +
        '<span class="role-chip role-chip-' + (isAdminRole ? "admin" : "user") + '">' + (isAdminRole ? "ADMIN" : "STAFF") + "</span>" +
        '<span class="account-meta">' + escHtml(status) + (u.createdBy ? " · added by " + escHtml(u.createdBy) : "") + "</span>" +
        "</div>" +
        (self ? "" :
          '<div class="account-actions">' +
          '<button type="button" class="btn btn-ghost btn-sm" data-act="reset">Reset password</button>' +
          '<button type="button" class="btn btn-ghost btn-sm" data-act="role">Make ' + (isAdminRole ? "staff" : "admin") + "</button>" +
          '<button type="button" class="btn btn-ghost btn-sm btn-danger-ghost" data-act="remove">Remove</button>' +
          "</div>") +
        "</div>"
      );
    }).join("");
  }

  function handleCreateUser(e) {
    e.preventDefault();
    var username = dom.newUsername.value.trim().toLowerCase();
    var password = dom.newPassword.value;
    var role = dom.newRole.value;
    dom.createUserError.textContent = "";
    if (!username) { dom.createUserError.textContent = "Enter a username."; return; }
    if (password.length < 10) { dom.createUserError.textContent = "The password needs at least 10 characters."; return; }

    dom.createUserBtn.disabled = true;
    api("createUser", { username: username, password: password, role: role })
      .then(function () {
        showCredentials("Account created - give these to " + username, username, password);
        dom.newUsername.value = "";
        dom.newRole.value = "user";
        dom.newPassword.value = generatePassword();
        return refreshAccounts();
      })
      .catch(function (err) {
        if (err && (err.code === "auth" || err.code === "mustchange")) { handleApiError(err); return; }
        dom.createUserError.textContent = (err && err.message) || "Couldn't create the account.";
      })
      .finally(function () { dom.createUserBtn.disabled = false; });
  }

  function handleAccountsListClick(e) {
    var btn = e.target.closest("[data-act]");
    if (!btn) return;
    var row = btn.closest(".account-row");
    if (!row) return;
    var name = row.dataset.username;
    var act = btn.dataset.act;
    var account = accountsCache.filter(function (u) { return u.username === name; })[0];
    if (!account) return;

    if (act === "reset") {
      if (!window.confirm("Reset the password for " + name + "?\n\nThey'll be signed out, and must choose a new password the next time they sign in.")) return;
      var pw = generatePassword();
      api("resetPassword", { username: name, password: pw })
        .then(function () {
          showCredentials("Password reset - give these to " + name, name, pw);
          toast("Password reset.", "success", "UPDATED");
          return refreshAccounts();
        })
        .catch(handleApiError);
    } else if (act === "role") {
      var newRole = account.role === "admin" ? "user" : "admin";
      var label = newRole === "admin" ? "an admin (they'll be able to delete records and manage accounts)" : "staff (they'll no longer be able to delete records or manage accounts)";
      if (!window.confirm("Make " + name + " " + label + "?")) return;
      api("setRole", { username: name, role: newRole })
        .then(function () { toast(name + " is now " + (newRole === "admin" ? "an admin." : "staff."), "success", "UPDATED"); return refreshAccounts(); })
        .catch(handleApiError);
    } else if (act === "remove") {
      if (!window.confirm("Remove " + name + "?\n\nThey'll be signed out immediately and won't be able to sign in again.")) return;
      api("deleteUser", { username: name })
        .then(function () { toast(name + " was removed.", "success", "REMOVED"); return refreshAccounts(); })
        .catch(handleApiError);
    }
  }

  /* ============================================================
     TABLE ROW CLICK DELEGATION
     ============================================================ */
  function wireTableDelegation() {
    dom.tableBody.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-action]");
      if (!btn) return;
      var row = btn.closest("tr[data-id]");
      if (!row) return;
      var id = row.dataset.id;
      var idx = findEntryIndexById(id);
      if (idx === -1) return;
      var action = btn.dataset.action;
      if (action === "view") openEntryModal("view", entries[idx]);
      else if (action === "edit") openEntryModal("edit", entries[idx]);
      else if (action === "delete") openDeleteConfirm(id);
    });
  }

  /* ============================================================
     AUTH FLOW
     ============================================================ */

  function handleLoginSubmit(e) {
    e.preventDefault();
    var username = dom.loginUsername.value.trim().toLowerCase();
    var password = dom.loginPassword.value;
    dom.loginError.textContent = "";

    if (!username || !password) {
      dom.loginError.textContent = "Enter a username and password.";
      return;
    }

    dom.loginSubmitBtn.disabled = true;
    dom.loginSubmitBtn.textContent = "Signing in…";

    // The password is checked on the server (Apps Script); this page never sees a password list or hash.
    api("login", { username: username, password: password })
      .then(function (data) {
        setSession(data.username, data.role, data.token, data.expiresAt, data.mustChange === true);
        dom.loginPassword.value = "";
        showDashboard();
      })
      .catch(function (err) {
        dom.loginError.textContent = (err && err.message) || "Couldn't sign in.";
      })
      .finally(function () {
        dom.loginSubmitBtn.disabled = false;
        dom.loginSubmitBtn.textContent = "Sign in";
      });
  }

  function handleLogout() {
    logAction("LOGOUT", "");
    clearSession();
    showLoginScreen();
  }

  /* ============================================================
     SCREEN SWITCHING
     ============================================================ */
  function showLoginScreen() {
    passwordForced = false;
    document.querySelectorAll(".modal-overlay.is-open").forEach(function (el) { el.classList.remove("is-open"); });
    hideCredentials();
    dom.dashboard.hidden = true;
    dom.loginScreen.hidden = false;
    dom.loginUsername.value = "";
    dom.loginPassword.value = "";
    dom.loginError.textContent = "";
    dom.loginUsername.focus();
  }
  function showDashboard() {
    var session = getSession();
    dom.loginScreen.hidden = true;
    dom.dashboard.hidden = false;
    dom.sessionUser.textContent = session.username;
    dom.roleStamp.textContent = session.role === "admin" ? "ADMIN" : "STAFF";
    dom.roleStamp.className = "role-stamp role-stamp-" + session.role;
    dom.auditToggleBtn.hidden = session.role !== "admin";
    dom.accountsBtn.hidden = session.role !== "admin";
    // Replacing the whole catalogue is admin-only (the server enforces this as well).
    dom.importBtn.hidden = session.role !== "admin";
    dom.emptyImportBtn.hidden = session.role !== "admin";

    entries = [];
    entriesVersion = null;
    dom.tableWrap.hidden = true;
    dom.emptyState.hidden = true;
    dom.entryCount.textContent = "";
    dom.addEntryBtn.disabled = true;

    // A password an admin handed out has to be replaced before anything else.
    if (session.mustChange) { openPasswordModal(true); return; }
    loadDashboardData();
  }

  function loadDashboardData() {
    dom.entryCount.textContent = "Loading records from Google Drive…";
    return loadEntriesFromServer()
      .then(function () {
        dom.addEntryBtn.disabled = false;
        refreshAll();
      })
      .catch(function (err) {
        if (err && (err.code === "auth" || err.code === "mustchange")) { handleApiError(err); return; }
        dom.entryCount.textContent = "Couldn't load the records: " + ((err && err.message) || "unknown error");
      });
  }
  function refreshAll() {
    refreshDatalists();
    renderTable();
  }

  /* ============================================================
     WIRING
     ============================================================ */
  function wireEvents() {
    dom.loginForm.addEventListener("submit", handleLoginSubmit);
    dom.logoutBtn.addEventListener("click", handleLogout);

    dom.addEntryBtn.addEventListener("click", function () { openEntryModal("add", null); });
    dom.emptyAddBtn.addEventListener("click", function () { openEntryModal("add", null); });
    dom.entryModalClose.addEventListener("click", closeEntryModal);
    dom.entryForm.addEventListener("submit", handleEntryFormSubmit);

    dom.deleteModalClose.addEventListener("click", closeDeleteConfirm);
    dom.deleteCancelBtn.addEventListener("click", closeDeleteConfirm);
    dom.deleteConfirmBtn.addEventListener("click", confirmDelete);

    dom.importBtn.addEventListener("click", function () { dom.importFileInput.click(); });
    dom.emptyImportBtn.addEventListener("click", function () { dom.importFileInput.click(); });
    dom.importFileInput.addEventListener("change", function () {
      if (dom.importFileInput.files && dom.importFileInput.files[0]) handleImportFile(dom.importFileInput.files[0]);
    });
    dom.importModalClose.addEventListener("click", closeImportConfirm);
    dom.importCancelBtn.addEventListener("click", closeImportConfirm);
    dom.importConfirmBtn.addEventListener("click", confirmImport);

    dom.exportBtn.addEventListener("click", exportPaperJson);

    dom.auditToggleBtn.addEventListener("click", openAuditPanel);

    dom.accountsBtn.addEventListener("click", openAccountsPanel);
    dom.accountsModalClose.addEventListener("click", closeAccountsPanel);
    dom.createUserForm.addEventListener("submit", handleCreateUser);
    dom.genPwBtn.addEventListener("click", function () { dom.newPassword.value = generatePassword(); });
    dom.credCopyBtn.addEventListener("click", copyCredentials);
    dom.accountsList.addEventListener("click", handleAccountsListClick);

    dom.changePwBtn.addEventListener("click", function () { openPasswordModal(false); });
    dom.passwordModalClose.addEventListener("click", closePasswordModal);
    dom.passwordForm.addEventListener("submit", handlePasswordSubmit);
    dom.auditModalClose.addEventListener("click", closeAuditPanel);
    dom.clearAuditBtn.addEventListener("click", handleClearAuditLog);

    dom.tableSearchInput.addEventListener("input", renderTable);
    wireTableDelegation();

    // Auto-suggest the Marga badge when adding a new entry, without ever
    // overriding a value the person has already set by hand.
    var partnerNameInput = document.getElementById("fld_partnerName");
    var isMargaInput = document.getElementById("fld_isMarga");
    partnerNameInput.addEventListener("blur", function () {
      if (entryModalMode !== "add" || isMargaManuallySet) return;
      if (/marga/i.test(partnerNameInput.value)) isMargaInput.checked = true;
    });
    isMargaInput.addEventListener("change", function () { isMargaManuallySet = true; });

    // Escape closes whichever modal is open
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      if (dom.passwordOverlay.classList.contains("is-open")) { if (!passwordForced) closePasswordModal(); }
      else if (dom.accountsOverlay.classList.contains("is-open")) closeAccountsPanel();
      else if (dom.entryModalOverlay.classList.contains("is-open")) closeEntryModal();
      else if (dom.deleteModalOverlay.classList.contains("is-open")) closeDeleteConfirm();
      else if (dom.importModalOverlay.classList.contains("is-open")) closeImportConfirm();
      else if (dom.auditOverlay.classList.contains("is-open")) closeAuditPanel();
    });
    dom.accountsOverlay.addEventListener("click", function (e) { if (e.target === dom.accountsOverlay) closeAccountsPanel(); });
    dom.passwordOverlay.addEventListener("click", function (e) { if (e.target === dom.passwordOverlay && !passwordForced) closePasswordModal(); });
    [dom.entryModalOverlay, dom.deleteModalOverlay, dom.importModalOverlay, dom.auditOverlay].forEach(function (overlay) {
      overlay.addEventListener("click", function (e) {
        if (e.target === overlay) overlay.classList.remove("is-open");
      });
    });
  }

  /* ============================================================
     INIT
     ============================================================ */
  function isMobileDevice() {
    var mobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    var narrowViewport = window.matchMedia && window.matchMedia("(max-width: 720px)").matches;
    return mobileUserAgent || narrowViewport;
  }

  function blockMobileAccess() {
    document.body.innerHTML = '<main class="access-blocked" role="alert"><h1>Desktop access required</h1><p>This registry is available on desktop devices only.</p></main>';
    document.documentElement.classList.add("access-blocked-page");
  }

  function installAccessGuards() {
    document.addEventListener("contextmenu", function (event) {
      event.preventDefault();
    }, true);

    if (isMobileDevice()) {
      blockMobileAccess();
      return false;
    }
    return true;
  }

  function init() {
    if (!installAccessGuards()) return;
    cacheDom();
    wireEvents();
    var session = getSession();
    if (session) showDashboard();
    else showLoginScreen();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();