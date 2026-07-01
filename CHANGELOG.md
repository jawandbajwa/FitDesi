# Changelog

All notable changes to FitDesi. Most-recent versions first.

This project uses [Semantic Versioning](https://semver.org/): MAJOR.MINOR.PATCH.

---

## [4.8.0] — 2026-07-01
### Changed
- **Global theme-aware color refactor** — swept every page, component CSS, and dynamic JS style injection to replace hardcoded `rgba(255,255,255,X)` / `#f0f0f0` / dark-only hex tints with `var(--text)`, `var(--text-dim)`, `var(--text-faint)`, `var(--card)`, `var(--bg)`, `var(--border)`, `var(--red)`. This is the reliability fix behind the theme system: base tokens are redefined per theme in `[data-theme="light"]` / `[data-theme="warm"]` blocks, so any component that references a token auto-adapts to all 3 themes without needing per-selector override rules.
- Files refactored: `recipes.css` (60+ hardcoded values → CSS vars), `tracker.css`, `coach.css`, `login.html` (inline styles), `404.html` (.nf-path contrast), `index.html` (home cards, quick actions, coach message), `exercise.html` (Set A/B and Train This Today modal inline styles), `tracker.html` (Waist/Hip helper labels, swap modal), `recipes.html` (meal selector subtitle), `admin.html` (Users empty state), `onboarding.js` (slide text), `tracker.js` (Chart.js tick/grid/tooltip colors now resolved from CSS vars at chart init), `exercise.js` and `recipes.js` (empty-state inline text).
- Login page (`login.html`) card, subtitle, Google sign-in button, and footer now use CSS vars — Light theme was showing invisible white-on-white text on the sign-in card and footer before this fix.

### Fixed
- Login page in Light theme: "Continue with Google" button label, "Sign in with your Google account…" subtitle, and privacy footer text were nearly invisible on the cream card. All now use `var(--text)` / `var(--text-dim)` / `var(--text-faint)`.
- Tracker Progress tab: Weight and Body Fat chart tick labels, gridlines, and tooltip colors were hardcoded `rgba(255,255,255,X)` (invisible on Light cream bg). Now resolved from `--text-dim` / `--border` / `--card` at chart init time via a `cssVar()` helper.
- 404 page: the missing-URL path chip used `--text-faint` (cream-tan) on `--card` (white) in Light — invisible. Now uses `--text-dim` (medium brown) for readable contrast.
- Recipes page: recipe cards, category chips, cuisine switcher, search input, detail panel, ingredient list, macro cards, meal-selector modal, user-recipe form — every text/border/bg color now theme-aware. Previously ~60 selectors relied on style.css per-selector overrides that only covered 5 of them.

## [4.7.0] — 2026-07-01
### Added
- **Calorie deficit/surplus fine-tune slider** — Profile → Edit Profile, below the goal picker. Slider ranges −500 to +500 cal in steps of 50, shows the live delta (red for deficit, green for surplus) and the resulting calorie/macro target as you drag. Saved as `calorieAdjustment` on the user profile, either when the slider is released or via the "Recalculate Macros" button — not on every drag tick.
### Changed
- **Macro calculation formula** (`calculateMacros` in profile.html, tracker.js, index.html) now computes calories as `TDEE + goal preset + calorieAdjustment` (Recomp 0 / Muscle +300 / Fat Loss −500) instead of a flat TDEE percentage per goal. Protein defaults to 2.0× bodyweight(kg) app-wide, bumped to 2.4× for a Recomp goal while in a calorie deficit to protect muscle during a lean recomp.
- `saveUserProfile()` in firebase.js now writes with `{ merge: true }` instead of a full document overwrite — fixes a pre-existing bug where editing your profile from Profile → Edit Profile silently wiped `isAdmin`, `coachEnabled`, `chosenCoach`, `onboardingDone`, `email`, `photoURL`, and `createdAt` from the profile doc.

## [4.6.3] — 2026-05-21
### Added
- **Global keyboard shortcuts** (`keyboard-shortcuts.js`). Press `?` for the help overlay. `/` or `Ctrl/Cmd+K` focuses search. `g h / g t / g r / g w / g p` navigates between Home / Tracker / Recipes / Workout / Profile in a vim-style sequence. `Esc` closes any open modal or overlay. Doesn't fire when typing in a field. Skipped when modifier keys are pressed (except Ctrl+K).
- Profile About → new "⌨️ Keyboard shortcuts" row that dispatches the `?` key when clicked, so the feature is discoverable.

## [4.6.2] — 2026-05-21
### Added
- **Recipe print stylesheet** — a 🖨️ Print button in the recipe detail header triggers `window.print()`. A `@media print` block in `recipes.css` strips all UI chrome and renders the recipe as a clean cookbook-style printable card (28pt title, uppercase macros table, dotted-underline ingredients, page-break-aware section labels, A4 layout, "Printed from FitDesi" footer).

## [4.6.1] — 2026-05-21
### Added
- **Custom 404 page** — branded, themed, shows the missing URL and offers "Back to FitDesi" + quick links to main sections. Auto-served by GitHub Pages and cached by SW for offline.
- **Back-to-top floating button** on all 8 main pages — appears after scrolling 300px, themed with the green accent, respects `prefers-reduced-motion`. Sits above the bottom nav (or lower on pages without nav).

## [4.6.0] — 2026-05-21
### Added
- **Account deletion flow** (GDPR right-to-be-forgotten). Profile → "Delete my account & data" → confirmation modal requires typing "DELETE" → wipes all Firestore data (profile, meal logs, workouts, progress, recipes) and signs out. `deleteAllUserData(uid)` in firebase.js.
- **Admin action audit log** at `audit/{auto-id}`. Every sensitive admin action (setAdminStatus, assignCoach, deleteIngredient, deleteRecipe, deleteUserRecipe, promoteUserRecipe) now writes an immutable record with actor UID, action, target, timestamp. `logAdminAction()` helper in firebase.js. Append-only by admin in Firestore rules; nobody can update or delete entries.
- **Cloudflare Worker rate limiting** (`cloudflare-worker.js`). Sliding-window per-UID (or per-IP fallback) limits via Workers KV: family users 30/min + 200/hour, admin 100/min + 1000/hour. Returns 429 with `Retry-After`. No-ops if `RATE_LIMIT` KV binding isn't set (graceful degradation). Requires `wrangler deploy` from `C:\Users\jawan\fitdesi-gemini` after a one-time KV namespace creation in Cloudflare dashboard.
- **Privacy Policy** (`privacy.html`) and **Terms of Service** (`terms.html`) pages. Linked from Profile About section. Cover what data is collected, where it's stored, third-party services, user rights, and a clear "not medical advice" disclaimer.
- **Subresource Integrity (SRI)** hash on Chart.js CDN script tag. Pinned to chart.js@4.4.7 with sha384 integrity check + `crossorigin="anonymous"`. Browser will reject any tampered version from the CDN.
- **JSDoc type definitions** for core Firebase APIs (UserProfile, DailyLog, WorkoutCycle, Recipe, Ingredient, ProgressEntry) plus annotations on the most-used functions in firebase.js. Enables VS Code autocomplete + type checking without a TypeScript migration.

### Changed
- coach.js now sends `X-User-Uid` header to the Worker so per-UID rate limiting works (was IP-only before).
- Firestore rules: new `audit/{document}` collection — admin can create+read, nobody can update or delete (preserves tamper-evident history).

### Documented
- Firebase ES module imports can't have SRI hashes (only `<script>` tags support `integrity`). Only protection is the pinned 10.7.1 SDK version. Documented in firebase.js header comment.

## [4.5.1] — 2026-05-20
### Added
- **Lighthouse CI** workflow runs after every deploy + on PRs, audits Performance / Accessibility / Best Practices / SEO with public clickable report links.
- **ESLint** (flat config) + **Prettier** for code quality. Optional local install via `npm install`; runs automatically on PRs via `lint.yml` workflow.
- **Dependabot** extended to also watch npm dev-dependencies.

### Fixed
- `bump-version.js` was breaking after package.json was added (was incompatibly typed as ES module). Removed `"type": "module"` and renamed `eslint.config.js` → `.mjs` instead.

## [4.5.0] — 2026-05-20
### Added
- **Skeleton loading states** — shimmering placeholders shown in admin tabs (Ingredients, Recipes, Users, Personal Recipes) during the Firestore load. Replaces the 1-2s blank flash. Themed for all 3 themes. Respects `prefers-reduced-motion`.
- **Empty-state designs** — friendly cards (icon + heading + body + CTA) when lists are empty. Different copy and icons for "no items yet" vs "no search results".
- **Accessibility quick wins**: `:focus-visible` outlines using theme accent on all interactive elements; `aria-label` + `type="button"` on all icon-only buttons (✕ close, ✏️ edit, 📖 view, 🗑️ delete, coach picker); global `prefers-reduced-motion` handler caps animations to 0.01ms.

## [4.4.0] — 2026-05-20
### Added
- **Dependabot config** for weekly automated GitHub Actions update PRs.
- **SEO meta tags** on all 7 HTML pages (meta description, Open Graph, Twitter Card, canonical URL). Link previews now show proper cards in iMessage, WhatsApp, Slack.
- **sitemap.xml** and **robots.txt** at site root. Admin and Profile pages also have `<meta name="robots" content="noindex">`.
- **CHANGELOG.md** with categorised history, linked from profile.html About section as "📋 What's New".
- **Bug-report and feature-request flow** — `.github/ISSUE_TEMPLATE/{bug_report,feature_request,config}.md` plus "🐛 Report a Bug" and "💡 Request a Feature" rows in profile About section with pre-filled GitHub issue URLs. Blank issues disabled.

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
