# Changelog

All notable changes to FitDesi. Most-recent versions first.

This project uses [Semantic Versioning](https://semver.org/): MAJOR.MINOR.PATCH.

---

## [4.3.1] — 2026-05-20
### Fixed
- Admin panel: invalid `\v` escape in JS template literals broke 9 inline styles. Coach badge, Assign/Remove Coach button, edit ✏️/recipes 📖 toggle states, and coach picker active state are now properly themed.
- Admin Users-tab rows, picker, and recipes panel use `var(--card)` instead of `var(--bg)` so they visually elevate above the page background in Light theme.
- Added `.cuisine-tab:hover` for visual parity with `.tab-btn:hover`.

## [4.3.0] — 2026-05-20
### Fixed
- **Admin panel theming**: refactored `admin.css`, `admin.html`, and `admin.js` (40+ hardcoded `rgba(255,255,255,X)` colors) to use CSS variables. Light and Warm themes now have proper text contrast, visible cards, and themed buttons throughout the admin panel.
- Replaced 6 inline `rgba(255,255,255,0.2)` form-hint spans in `admin.html` with a `.field-hint` utility class.
- Delete modal: Cancel button was invisible in Light theme (`rgba(255,255,255,0.X)` on cream bg). Replaced with `.danger-btn` / `.cancel-btn` themed classes.
- Removed dead `getGreenColor()` helper from `admin.js` — `var(--green)` works directly inside template-literal `style.cssText` strings.

## [4.2.x] — 2026-05-20
### Added
- **Standardized bottom-nav SVGs** across all 5 pages — pixel-identical book / bar-chart / dumbbell / person / house icons. Active page changes color only, never the shape.
### Fixed
- Home button on `tracker.html` was missing `id="navProteinRing"` so the protein arc never animated there.
- Home button protein arc was invisible in Light/Warm themes (used `var(--green)` which equalled the disc's filled background color). Now uses a contrasting white/dark stroke per theme.

## [4.1.0] — 2026-05-20
### Added
- **3-theme system** — Light (cream + burnt orange), Warm (deep brown + warm gold), Dark (original). Pick via Profile → Display & Units → Theme.
- Bottom-nav and home button automatically adapt their accent color per theme.

## [3.2.0] — 2026-05-20
### Added
- **Train This Today** — tap any non-today chip in the week strip on the Workout page to shift the cycle so that workout becomes today's. `startDate` is recalculated without touching `cycleCount` / `acknowledgedCycles`, so no false new-cycle popup.

## [3.1.x] — 2026-05-20
### Fixed
- Admin panel: tab switching bug where both tabs showed simultaneously (stale cached `admin.js` used the old `.tab-content` selector). Renamed to `.admin-tab-pane` and added `?v=2` suffix to `firebase.js` import to bust ES-module cache in long-running sessions.
- Members count always showed 0: switched `getAllUsers()` from top-level `users/{uid}` collection scan to `collectionGroup("data")` query. Discovers ALL users who have ever signed in, no stub documents needed. Requires `/{path=**}/data/{document}` admin read rule in `firestore.rules`.
- Awaited `getUserProfile()` stub write before `getAllUsers()` in admin init so the admin user always appears in the Members list immediately.

## [3.0.0] — 2026-05-13
### Added
- **AI coach** full overhaul — rich personalities (Vegeta, Hinata, Levi, All Might, Gojo), full user context (meals/workouts/weight history), nutrition + exercise + bodybuilding knowledge base, 2048-token responses, smarter quick replies.
- Personal recipes: users can submit their own recipes (`users/{uid}/recipes/`). Admin can view, delete, or promote them to the shared library via the Recipes tab.

## [2.8.x] — earlier 2026-05
### Added
- Admin users list with offline caching, fetched-once-on-init pattern.
- Coach personality picker, coach access toggle per user.
- Coach uses first name only; token limit raised to prevent mid-sentence cutoff.

---

For the full commit history, see the [GitHub repo](https://github.com/jawandbajwa/FitDesi/commits/main).
