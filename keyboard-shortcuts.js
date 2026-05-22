// FitDesi — Global Keyboard Shortcuts
//
// Loaded as `<script defer src="keyboard-shortcuts.js"></script>` on every
// page. Self-contained, no module imports, runs after DOMContentLoaded.
//
// Shortcuts:
//   /            Focus the first visible search input (or Cmd/Ctrl+K)
//   Esc          Close any open modal / overlay / detail panel
//   g h          Go home (sequence: g then h within 1.5s)
//   g t          Tracker (nutrition)
//   g r          Recipes
//   g w          Workout (exercise)
//   g p          Profile
//   ?            Show keyboard-shortcuts help overlay
//
// Don't trigger when:
//   - Typing in <input>, <textarea>, <select>, [contenteditable]
//   - Modifier keys pressed (except Cmd/Ctrl+K)
//   - Help overlay is the only thing open (Esc closes it)

(function () {
  "use strict";

  // ── Page paths (relative — works for the GitHub project URL) ────────────
  const ROUTES = {
    h: "index.html",
    t: "tracker.html",
    r: "recipes.html",
    w: "exercise.html",
    p: "profile.html",
  };

  // ── Help overlay HTML — injected lazily on first "?" press ─────────────
  function buildHelpOverlay() {
    if (document.getElementById("kbdHelpOverlay")) return;
    const overlay = document.createElement("div");
    overlay.id = "kbdHelpOverlay";
    overlay.className = "kbd-help-overlay";
    overlay.innerHTML = `
      <div class="kbd-help-card" role="dialog" aria-label="Keyboard shortcuts">
        <div class="kbd-help-header">
          <h2>Keyboard shortcuts</h2>
          <button type="button" class="kbd-help-close" aria-label="Close">✕</button>
        </div>
        <div class="kbd-help-grid">
          <div class="kbd-help-row"><kbd>/</kbd><span>Focus search</span></div>
          <div class="kbd-help-row"><kbd>Ctrl</kbd><span>+</span><kbd>K</kbd><span>Focus search</span></div>
          <div class="kbd-help-row"><kbd>Esc</kbd><span>Close modal / overlay</span></div>
          <div class="kbd-help-section">Navigation</div>
          <div class="kbd-help-row"><kbd>g</kbd><kbd>h</kbd><span>Home</span></div>
          <div class="kbd-help-row"><kbd>g</kbd><kbd>t</kbd><span>Nutrition tracker</span></div>
          <div class="kbd-help-row"><kbd>g</kbd><kbd>r</kbd><span>Recipes</span></div>
          <div class="kbd-help-row"><kbd>g</kbd><kbd>w</kbd><span>Workout</span></div>
          <div class="kbd-help-row"><kbd>g</kbd><kbd>p</kbd><span>Profile</span></div>
          <div class="kbd-help-section">Help</div>
          <div class="kbd-help-row"><kbd>?</kbd><span>Show this overlay</span></div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    // Close handlers
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay || e.target.closest(".kbd-help-close")) {
        overlay.classList.remove("visible");
      }
    });
  }

  function toggleHelp() {
    buildHelpOverlay();
    const overlay = document.getElementById("kbdHelpOverlay");
    overlay.classList.toggle("visible");
  }

  function closeHelp() {
    const overlay = document.getElementById("kbdHelpOverlay");
    if (overlay) overlay.classList.remove("visible");
  }

  // ── Detect if user is typing in an editable field ──────────────────────
  function isEditable(target) {
    if (!target) return false;
    const tag = target.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
    if (target.isContentEditable) return true;
    return false;
  }

  // ── Find and focus the first visible search input ──────────────────────
  function focusSearch() {
    const candidates = document.querySelectorAll(
      'input[type="search"], .search-input, input#searchInput, input[id*="Search" i], input[placeholder*="Search" i]'
    );
    for (const el of candidates) {
      // Visible-ish check (not display:none, not hidden, has bounding box)
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        el.focus();
        el.select?.();
        return true;
      }
    }
    return false;
  }

  // ── Close any "open" modal / overlay / detail panel ─────────────────────
  function closeAnyOverlay() {
    // Help overlay first
    const helpOverlay = document.getElementById("kbdHelpOverlay");
    if (helpOverlay && helpOverlay.classList.contains("visible")) {
      helpOverlay.classList.remove("visible");
      return true;
    }
    // Generic .modal-overlay.open
    const openModals = document.querySelectorAll(".modal-overlay.open, .ep-overlay.open");
    if (openModals.length) {
      openModals.forEach((m) => m.classList.remove("open"));
      return true;
    }
    // Recipes detail panel
    const detail = document.getElementById("detailPanel");
    if (detail && !detail.classList.contains("hidden")) {
      detail.classList.add("hidden");
      return true;
    }
    return false;
  }

  // ── "g" sequence state ─────────────────────────────────────────────────
  let waitingForG = false;
  let gTimer = null;

  function startGSequence() {
    waitingForG = true;
    clearTimeout(gTimer);
    gTimer = setTimeout(() => {
      waitingForG = false;
    }, 1500); // 1.5s window to press the second key
  }

  function endGSequence() {
    waitingForG = false;
    clearTimeout(gTimer);
  }

  // ── Main keydown handler ───────────────────────────────────────────────
  document.addEventListener("keydown", (e) => {
    // Cmd/Ctrl+K — focus search (popular convention)
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      focusSearch();
      return;
    }

    // Anything else with modifiers — let the browser handle it
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    // Esc works even inside inputs (it should close modals + blur)
    if (e.key === "Escape") {
      if (isEditable(e.target)) {
        e.target.blur();
      }
      closeAnyOverlay();
      endGSequence();
      return;
    }

    // Everything else — only when NOT typing in a field
    if (isEditable(e.target)) return;

    // ?  — show help (note: requires Shift on most keyboards)
    if (e.key === "?") {
      e.preventDefault();
      toggleHelp();
      return;
    }

    // /  — focus search
    if (e.key === "/") {
      if (focusSearch()) {
        e.preventDefault();
      }
      return;
    }

    // "g" — start a navigation sequence
    if (e.key === "g") {
      e.preventDefault();
      startGSequence();
      return;
    }

    // Second key in the "g X" sequence
    if (waitingForG) {
      const route = ROUTES[e.key.toLowerCase()];
      if (route) {
        e.preventDefault();
        endGSequence();
        // Navigate relative to current page so it works on /FitDesi/ subpath
        window.location.href = route;
      } else {
        endGSequence();
      }
    }
  });
})();
