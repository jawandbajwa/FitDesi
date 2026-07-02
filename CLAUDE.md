# FitDesi — App Overview for AI Agents

## What this app is
FitDesi is a personal fitness PWA (Progressive Web App) built for an Indian-Canadian family. It tracks nutrition, workouts, and body progress. It is a **static site** — no build step, no framework, no npm. Plain HTML + CSS + JavaScript modules, hosted on **GitHub Pages**.

Live URL: https://jawandbajwa.github.io/FitDesi/

---

## Tech Stack
- **Frontend**: Vanilla HTML, CSS, ES Modules (no bundler, no framework)
- **Backend**: Firebase (Firestore database + Google Auth)
- **Hosting**: GitHub Pages (push to `main` branch = live instantly)
- **PWA**: `sw.js` service worker, `manifest.json`, installable on homescreen
- **AI Proxy**: Cloudflare Worker at `https://fitdesi-gemini.jawandbajwa.workers.dev` — proxies Gemini API, keys stored as Worker secrets

### To deploy a change
```
git add <files>
git commit -m "description"
git push origin main
```
That's it. No build step. Changes go live in ~1 minute.

### After deploying CSS or JS changes
Use `bump-version.js` to bump the version and SW cache in one command:
```bash
node bump-version.js patch   # small change   → +1 on patch (e.g. 2.1.3 → 2.1.4); auto-rolls to minor at 10
node bump-version.js minor   # notable update → +1 on minor (e.g. 2.1.x → 2.2.0); auto-rolls to major at 10
node bump-version.js major   # big release    → +1 on major (e.g. 2.x.x → 3.0.0)
```
This updates `manifest.json`, `profile.html` (About section), and `sw.js` cache version atomically.

---

## File Map

| File | Purpose |
|------|---------|
| `index.html` | Home page — protein ring, macro rings, streak, today's workout card |
| `tracker.html` / `tracker.js` / `tracker.css` | Nutrition tracker — Today tab, Meal Plan tab, Progress tab |
| `recipes.html` / `recipes.js` / `recipes.css` | Recipe browser — Indian & Canadian, filter by meal type |
| `exercise.html` / `exercise.js` / `exercise.css` | Workout page — rolling split cycle (single unified exercise list per day, no A/B), exercise library, set logging, Train This Today (tap any week-day chip to shift startDate) |
| `profile.html` / `profile.css` | User profile — edit stats, theme toggle, sign out, app version |
| `admin.html` / `admin.js` / `admin.css` | Admin panel — manage ingredients, recipes, users + AI Coach on/off toggle |
| `firebase.js` | ALL Firebase calls — auth, Firestore reads/writes, cache helpers |
| `coach.js` | AI Coach UI — floating button, full-screen chat, single inlined personality, Gemini calls |
| `cloudflare-worker.js` | Source for the Cloudflare Worker proxy (deploy manually, not via GitHub) |
| `bump-version.js` | Version bump script — updates manifest.json, profile.html, sw.js together |
| `style.css` | Global styles shared by all pages — also contains ALL light theme overrides |
| `sw.js` | Service worker — network-first caching strategy |
| `app.js` | Home page JS — macro rings, streak, coach message, quick actions |
| `db.js` | IndexedDB helpers for offline caching of workout/cycle data |
| `ingredients.js` | Indian ingredient database (used by admin) |
| `ingredients_canada.js` | Canadian ingredient database |
| `recipes_canada.js` | Canadian recipe database |
| `onboarding.js` | First-time intro slides — shown once ever, flag persisted in Firestore |
| `onboarding-preview.html` | Dev-only preview of all 4 onboarding slides side by side (not in SW cache) |
| `coach-config.js` | **Gitignored** — local dev overrides (e.g. `GEMINI_PROXY_URL`) |
| `coach-config.example.js` | Template for coach-config.js |
| `keyboard-shortcuts.js` | Global shortcuts (g h, g t, g r, g w, g p, /, Esc, ?). Self-contained, loaded on every page via `<script defer src="keyboard-shortcuts.js">`. |
| `404.html` | Branded 404 page — auto-served by GitHub Pages for unmatched routes |
| `privacy.html` / `terms.html` | Privacy policy + ToS; linked from Profile About |

### Tooling & CI files (added in v4.4-4.5)
| File | Purpose |
|------|---------|
| `package.json` | Lists ESLint + Prettier as dev deps. No build step — only used for `npm run lint` / `npm run format`. No `"type": "module"` (so `bump-version.js` keeps working with `require`). |
| `eslint.config.mjs` | ESLint 9+ flat config. Modern recommended rules + browser/SW globals. Warns (doesn't fail) on unused vars + smart-eqeqeq + prefer-const. |
| `.prettierrc.json` | Formatter config — 2-space, double-quote, ES5 trailing commas, 100-col (120 for HTML, 80 for MD). |
| `.prettierignore` | Skips vendor data files (ingredients*.js, recipes_canada.js) and sw.js. |
| `CHANGELOG.md` | Human-readable release notes. Linked from profile.html About section as "📋 What's New". |
| `sitemap.xml` | SEO — lists 5 public pages. |
| `robots.txt` | Disallows crawling of `/admin.html` and `/profile.html`; allows everything else; links sitemap. |
| `.github/dependabot.yml` | Weekly auto-PRs for GitHub Actions + npm dev-deps. |
| `.github/workflows/lighthouse.yml` | Runs Lighthouse on every deploy + PR; reports go to temporaryPublicStorage. |
| `.github/lighthouserc.json` | Lighthouse config — desktop preset, warn thresholds (Perf 70+, A11y 85+, BP 85+, SEO 85+). |
| `.github/workflows/lint.yml` | Runs ESLint + Prettier check on every PR + main push. `continue-on-error: true` for now. |
| `.github/workflows/pages.yml` | Deploys site to GitHub Pages on every push to main. |
| `.github/ISSUE_TEMPLATE/bug_report.md` | Structured bug-report template. |
| `.github/ISSUE_TEMPLATE/feature_request.md` | Structured feature-request template. |
| `.github/ISSUE_TEMPLATE/config.yml` | Disables blank issues, links to CLAUDE.md docs. |
| `firestore.rules` | Firestore security rules. Deploy via `firebase deploy --only firestore:rules` — NOT via git push. |

---

## Admin Panel — Current State

**Access:** `jawandbajwa@gmail.com` only. Route: `admin.html`
**Tab pane class:** `.admin-tab-pane` (never `.tab-content` — see Gotcha #10)
**firebase.js import:** `from "./firebase.js?v=2"` — version suffix busts ES module cache

### Tabs

**🥬 Ingredients**
- Full CRUD: add/edit/delete ingredients with per-100g macros + fiber + category
- Search bar filters the list in real time
- Stat card: total ingredient count

**🍛 Recipes** (two sections)
1. *Shared recipes* — Indian / Canadian cuisine toggle, full CRUD, ingredient picker with macro auto-calc, instructions + notes fields, YouTube video ID, serve size
2. *Personal Recipes — All Users* — loads via `getAllUserRecipes()` on first tab open (lazy). Each entry shows the user's name + recipe. Actions: **Promote** (inline 🇮🇳/🇨🇦 picker → `promoteUserRecipe()`) or **Delete** (uses shared delete modal via `deleteCallback` pattern)

**👥 Users**
- Loads via `collectionGroup(db, "data")` filtered to `ref.id === "profile"` — finds every user who has ever signed in, no stub docs needed
- Cached in `localStorage` under `fitdesi_admin_users`, refreshed in background on every page load
- Per-user row: avatar initials, name, email, coach badge, join date, admin badge (if `isAdmin`)
- **Assign Coach** button → expands inline picker (5 coach options) + Grant/Revoke Admin toggle
- **✏️ Edit** button → change coach inline
- **📖 Recipes** button → view that user's personal recipes

### Theming (Light + Warm)
admin.css uses CSS variables throughout — `var(--text)`, `var(--text-dim)`, `var(--text-faint)`, `var(--card)`, `var(--bg)`, `var(--border)`, `var(--green)`, `rgb(var(--green-rgb) / 0.X)`. The Users-tab DOM is built dynamically in admin.js, so the same CSS-variable strings appear in inline `style.cssText` template literals there too.

**Utility classes** (in admin.css, used in admin.html for inline-styled spots that need theming):
- `.field-hint` — small "optional" hint text inside `<label>` (themed via `var(--text-faint)`)
- `.muted-message` — empty-state / placeholder messages inside lists
- `.danger-btn` — red themed destructive action
- `.cancel-btn` — neutral themed cancel action
- `.delete-message` — delete-modal subtitle

### Known past bugs (fixed)
- **Members always 0** — `users/{uid}` top-level docs didn't exist; `getDocs(collection(db,"users"))` returned []. Fixed by switching to `collectionGroup`.
- **Both tabs visible simultaneously** — stale cached `admin.js` used `.tab-content` selector (old name); `querySelectorAll(".tab-content")` found 0 elements so no pane was ever hidden. Fixed by renaming to `.admin-tab-pane` + adding `?v=2` import suffix.
- **Wrong Firestore paths in old admin queries** — old code queried `users/{uid}` directly instead of `users/{uid}/data/profile`. Fixed when collectionGroup approach was introduced.
- **Light/Warm admin panel invisible text** — 40+ hardcoded `rgba(255,255,255,X)` colors and broken `\${getGreenColor()}` template-literal escapes in admin.js/css/html. Fixed by refactoring everything to CSS variables. See Gotcha #14.

---

## Firebase / Firestore Structure

```
users/{uid}/
  data/profile        → { name, email, photoURL, age, weight, height, goal,
                           activityLevel, gender, isAdmin, weightUnit, heightUnit,
                           coachEnabled, onboardingDone, createdAt,
                           calorieAdjustment }
  data/cycle          → { startDate, activeSplit, customSplitDays }
  data/notifications  → { breakfast, lunch, dinner }  (HH:MM strings)
  logs/{YYYY-MM-DD}   → { breakfast:[...], lunch:[...], snack:[...], dinner:[...] }
  progress/{YYYY-MM-DD} → { weight, bodyFat }
  workoutLogs/{date}/{exerciseName} → [{ reps, weight }, ...]
  recipes/{id}        → { name, category, cuisine, serving, ingredients:[],
                           protein, carbs, fat, calories, videoId,
                           instructions, notes, createdAt, uid }
                         ← User-submitted personal recipes. Read/written by the
                           user; admin can view, delete, or promote to shared.

shared/recipes_indian/items/{id}    → recipe doc (cuisine: "indian")
shared/recipes_canadian/items/{id}  → recipe doc (cuisine: "canadian")
shared/ingredients/items/{id}       → { name, protein, carbs, fat, calories, fiber, category }
```

> **Note:** The old CLAUDE.md had wrong paths (`ingredients/{id}`, `recipes/{id}` at the root). The correct paths are `shared/ingredients/items/{id}` and `shared/recipes_{cuisine}/items/{id}`.

Auth: Google Sign-In only. `isAdmin: true` on the user profile doc grants admin access.

**Coach-related profile fields:**
- `coachEnabled: boolean` — set by admin to grant AI Coach access. There is only ONE coach personality (formerly "Gojo"), so no per-user coach selection is stored.
- `onboardingDone: boolean` — set to `true` after user dismisses or completes onboarding slides

---

## AI Coach System

### How it works
1. Admin toggles **Enable Coach / Disable Coach** for a user in **Admin Panel → Users tab** (`coachEnabled: true/false`)
2. Any user with `coachEnabled: true` (or an admin) sees the 🤖 floating button on every page
3. Tap it → full-screen chat opens with a welcome message from the AI Coach
4. There is exactly ONE coach personality (formerly "Gojo") inlined at the top of `coach.js` as `COACH_PERSONALITY`. No picker, no per-user coach selection.

### Chat UI details
- **Floating button**: 48×48px, `bottom: 160px, right: 16px` — positioned above bottom nav and page content
- **Chat sheet**: **FULL SCREEN** (`inset: 0`), slides up on button tap. No bottom-sheet, no drag handle, no swipe-to-close.
- **Header**: `.chat-title` (🤖 AI Coach) on the left, `.chat-close` (✕) on the right. Only way to close.
- **Backdrop**: `#coachBackdrop` still exists behind the sheet during entry animation (visual only).
- **Messages**: `textContent` rendering (not innerHTML) — safe against HTML injection from AI
- **Typing indicator**: animated three-dot pulse bubble shown while Gemini responds
- **No quick replies.** The chat has only: message history + text input + send button + mic button.
- **Input area**: text field + send button (green circle) + mic button (voice input), fixed at bottom with `env(safe-area-inset-bottom)` padding
- **Action JSON**: coach can append `{"action":"add_meal"|"complete_workout"|"swap_exercise",...}` on a new line — only stripped if line starts with `{"action"`
- **Name display**: coach addresses user by first name only — `fullName.split(" ")[0]` extracted in `getContext()`

### getContext() — what the coach knows every call
Fetches in parallel via `Promise.all`:
- `getUserProfile` — name, weight, height, age, gender, goal, activity, units
- `getDailyLog` — today's meals by type (breakfast/lunch/snack/dinner), names, per-meal cal/protein summary
- `getWorkoutCycle` — active split type only (no Set A/B — that system was removed)
- `getProgressHistory` — latest weight + body fat entry, weight trend vs previous entry
Also from localStorage (instant): proteinGoal, carbsGoal, fatGoal, caloriesGoal, todayWorkout, time of day

### Coach system prompt knowledge base (injected every call)
- **Nutrition science**: Mifflin-St Jeor BMR, TDEE multipliers, deficit/surplus math, protein per kg targets, per-meal protein synthesis, carb/fat minimums
- **Exercise science**: hypertrophy rep ranges (5–30, focus 8–15), weekly volume (10–20 sets/muscle), RPE, rest periods, progressive overload, deload frequency (every 4–8 weeks), recovery (48–72h per muscle)
- **Bodybuilding splits**: PPL, Upper/Lower, Full Body, Bro Split, Arnold Split — what each targets and who it's for
- **Exercises per muscle**: chest, back, shoulders, legs, biceps, triceps, core — full lists
- **Indian food macros**: dal, paneer, chana, rajma, roti, rice, dahi — per 100g cooked with cal/protein/carb/fat
- **Canadian foods**: oats, eggs, Greek yogurt, chicken, salmon, cottage cheese, peanut butter — same detail
- **Supplements**: creatine (5g/day), protein powder, caffeine (3–6mg/kg), Vitamin D, Omega-3, Magnesium — evidence-based only, no hype
- **Temperature**: 0.85 (more natural, less robotic responses)
- **History**: last 16 messages kept for context

### The single AI Coach personality
Only one personality — inlined in `coach.js` as `COACH_PERSONALITY`. Formerly the "Gojo" personality: fluid, confident, slightly cocky but always earns it; reads user energy and shifts tone accordingly; uses their first name naturally; 1 emoji max; no wasted words. `COACH_NAME = "AI Coach"`, `COACH_EMOJI = "🤖"`.

### Cloudflare Worker (API proxy)
- **URL**: `https://fitdesi-gemini.jawandbajwa.workers.dev`
- **Model**: `gemini-flash-latest`
- **Key routing**:
  - Admin requests (`X-Is-Admin: true` header) → `GEMINI_API_KEY_ADMIN` (dedicated, never shared)
  - User requests → `GEMINI_API_KEY_1..4` with round-robin + auto-fallback on 429
- **Worker source**: `cloudflare-worker.js` in repo — deploy manually via `wrangler deploy` from `C:\Users\jawan\fitdesi-gemini`
- **Secrets**: stored in Cloudflare dashboard, never in code
- **`maxOutputTokens`**: 2048 (set in `generationConfig` — gives room for detailed nutrition/exercise explanations)
- **Response parsing**: joins all `parts[].text` in case Gemini splits response across multiple parts

### To redeploy the worker after changes
```powershell
cd C:\Users\jawan\fitdesi-gemini
Copy-Item "D:\FitDesi\cloudflare-worker.js" -Destination "src\index.js" -Force
wrangler deploy
```

### firebase.js admin functions
- `getAllUsers()` — uses `collectionGroup(db, "data")` filtered to `d.ref.id === "profile"` to discover ALL users who have ever signed in. No top-level stub docs needed. Requires `/{path=**}/data/{document}` read rule for admin in firestore.rules.
- `setAdminStatus(uid, adminStatus)` — sets `isAdmin` on a user's profile
- `assignCoach(uid, enabled)` — sets `coachEnabled` on a user's profile
- `markOnboardingDone(uid)` — sets `onboardingDone: true` on a user's profile (merge)
- `getUserRecipes(uid)` — reads users/{uid}/recipes
- `deleteUserRecipe(uid, recipeId)` — deletes from users/{uid}/recipes
- `getAllUserRecipes()` — reads personal recipes from every user
- `promoteUserRecipe(uid, recipeId, cuisine)` — copies user recipe to shared/recipes_{cuisine}/items

---

## Versioning

Version is stored in two places: `manifest.json` and `profile.html` (About section).
Current version: **4.9.0**

Rules:
- Small change → `node bump-version.js patch` (+1 patch, 0–9, rolls to minor at 10)
- Notable update → `node bump-version.js minor` (+1 minor, 0–9, rolls to major at 10)
- Big release → `node bump-version.js major` (+1 major)

The script also bumps `sw.js` cache version automatically (current: `fitdesi-v102`).

---

## Tooling & CI (v4.4-4.5)

### Linting & formatting (optional local install)
```bash
npm install            # installs ESLint + Prettier dev deps
npm run lint           # ESLint check
npm run lint:fix       # ESLint auto-fix
npm run format         # Prettier write
npm run format:check   # Prettier verify (used in CI)
```
- `eslint.config.mjs` uses ESLint 9 flat config + `@eslint/js` recommended rules
- `.prettierrc.json` defines formatting (2-space, double-quote, ES5 trailing commas, 100-col)
- Vendor data files (`ingredients*.js`, `recipes_canada.js`) are ignored by both
- **Not required for commits or deploy** — purely an opt-in quality tool. `node_modules` is gitignored.

### GitHub Actions workflows
| Workflow | Trigger | What it does | Blocks deploy? |
|---|---|---|---|
| `pages.yml` | Push to main | Deploys site to GitHub Pages | n/a |
| `lighthouse.yml` | After Pages deploy + on PRs + manual | Runs Lighthouse 3× per URL, reports Perf/A11y/BP/SEO scores with clickable report links | No (warn only) |
| `lint.yml` | Every PR + push to main | Runs ESLint + Prettier check | No (`continue-on-error: true` until codebase is clean) |

### Automated dependency updates
`.github/dependabot.yml` opens weekly PRs for:
- GitHub Actions versions (e.g., `actions/checkout@v4 → v5`)
- npm dev-deps (ESLint, Prettier, etc.) — only when running `npm install`

GitHub also has built-in security alerts (Security tab) for CVEs in any pinned versions — enable in repo settings.

### SEO & link previews
Every public HTML page has:
- `<meta name="description">` — page-specific description (~150 chars)
- Open Graph tags (`og:title`, `og:description`, `og:image`, `og:url`, `og:type`, `og:site_name`)
- Twitter Card tags (`twitter:card="summary"`, `twitter:title`, `twitter:description`, `twitter:image`)
- `<link rel="canonical">` — absolute URL

Admin and profile pages have `<meta name="robots" content="noindex">` (defence-in-depth alongside the `robots.txt` disallow rule).

`sitemap.xml` and `robots.txt` live at site root.

### Issue templates
`.github/ISSUE_TEMPLATE/{bug_report,feature_request,config}.md` — drives the "🐛 Report a Bug" / "💡 Request a Feature" links in profile.html About section. Blank issues are disabled (`config.yml`).

---

## Key CSS Conventions

### 3-Theme system — Light, Warm, Dark
- **Dark** is the default. No `data-theme` attribute on `<html>`.
- **Light** (cream + burnt orange): `[data-theme="light"]` — accent `#A85A1F`, bg `#FAF4EC`
- **Warm** (deep brown + gold): `[data-theme="warm"]` — accent `#E8B547`, bg `#1A1410`
- Both override blocks live at the **bottom of `style.css`** in sequence — light first, then warm.
- Both new themes override `--green` CSS variable so `var(--green)` references across the codebase automatically pick the right accent.
- Theme switcher: profile.html → Display & Units → Theme (3 buttons: Light / Warm / Dark)
- Flash prevention: every HTML page has this inline script in `<head>` before any CSS:
  ```html
  <script>try{var t=localStorage.getItem("fitdesi_theme");if(t==="light"||t==="warm")document.documentElement.setAttribute("data-theme",t)}catch(e){}</script>
  ```
- CSS variables: `--bg`, `--card`, `--border`, `--text`, `--text-dim`, `--text-faint`, `--green` (accent), `--green-rgb` (for transparent colors), `--green-muted`, `--green-dark`, `--radius`

### How colors work with themes
- **Never hardcode text/surface colors** — use CSS vars everywhere. Base tokens are redefined per theme in `[data-theme="light"]`/`[data-theme="warm"]` blocks in style.css, so components auto-adapt with zero per-selector overrides.
- **The token vocabulary** (dark theme default → Light → Warm):
  - Text: `var(--text)` (bright→dark brown→cream), `var(--text-dim)` (medium), `var(--text-faint)` (subtle)
  - Surfaces: `var(--bg)` (page bg), `var(--card)` (elevated card), `var(--border)` (hairlines/dividers)
  - Accents: `var(--green)` (dark green→burnt orange→gold), `var(--red)` (destructive)
- **Common replacements** (established v4.8.0):
  - `rgba(255,255,255, 0.85+)` → `var(--text)`
  - `rgba(255,255,255, 0.3–0.5)` → `var(--text-dim)`
  - `rgba(255,255,255, 0.15–0.25)` → `var(--text-faint)`
  - `rgba(255,255,255, 0.03–0.1)` as background → `var(--card)` (card-like) or `var(--bg)` (input-like)
  - `rgba(255,255,255, 0.05–0.13)` as border → `var(--border)`
  - `#f0f0f0` (text) → `var(--text)`
- **For transparency on green accents**: use `rgb(var(--green-rgb) / 0.12)` instead of `rgba(126,217,154,0.12)`
- **In JavaScript inline styles**: CSS vars work directly inside `style.cssText` template literals — `el.style.cssText = "color: var(--text);"` resolves correctly per theme. No helper function needed. (The old `getGreenColor()` helper was removed in v4.3.0.)
- **For dynamic JS rendering that can't consume vars** (e.g. Chart.js configs, canvas fillStyle): resolve at render time — `getComputedStyle(document.documentElement).getPropertyValue('--text-dim').trim()`. See `cssVar()` helper at the top of tracker.js's `buildChartOptions()`.
- **Beware `\v` in template literals**: writing `` `color: \var(--green);` `` makes JS interpret `\v` as the vertical-tab escape character → emits `<0x0B>ar(--green)` → invalid CSS. Always write `var(--green)` (no leading backslash).
- **Never use hardcoded hex for theme-sensitive colors**: `#7ed99a`, `#A85A1F`, `#E8B547`, `#f0f0f0`, `#111a13`, `#1a2e1e` etc. are theme-specific — always use the corresponding CSS variable.

### Utility classes (v4.5+)
| Class | Use case |
|------|---------|
| `.skeleton` | Apply to any element you want shimmering. Hides its text (`color: transparent !important`) and animates a gradient overlay. Themed for all 3 themes. Respects `prefers-reduced-motion`. |
| `.skeleton-card` + `.skeleton-icon` + `.skeleton-info` + `.skeleton-line` (with `.short` / `.medium` / `.long` modifiers) | Pre-built skeleton row matching the `.admin-item` layout. Use via the JS helper `renderSkeletonList(containerId, count)` in `admin.js`. |
| `.empty-state` + `.empty-icon` + `.empty-title` + `.empty-desc` + `.empty-cta` | Friendly empty-list card with icon, heading, body, and optional CTA button. Used when admin tabs / lists have no items. Themed automatically. |
| `.field-hint` | Small "optional" inline hint inside a `<label>`. Themed via `var(--text-faint)`. |
| `.muted-message` | Inline empty-state text for compact contexts (used inside expanded per-user panels). |
| `.danger-btn` | Red themed destructive action (delete modal). |
| `.cancel-btn` | Neutral themed cancel action (delete modal). |
| `.delete-message` | Delete-modal subtitle text, themed via `var(--text-dim)`. |

### Accessibility
- **Focus rings**: `:focus-visible` outline using `var(--green)` is applied to all interactive elements (`button`, `a`, `input`, `select`, `textarea`, `.tab-btn`, `.nav-tab`, `.nav-item`, `.theme-seg-btn`). Only shows on keyboard nav, never on click.
- **Reduced motion**: a global `@media (prefers-reduced-motion: reduce)` block caps all animations/transitions to 0.01ms across the app. Skeleton shimmer also respects this.
- **ARIA**: all icon-only buttons (✕ close, ✏️ edit, 📖 view, 🗑️ delete) have `aria-label`; modals close buttons use `type="button"` to prevent accidental form submission.

### Theme palette reference
| Variable | Light (Cream) | Warm (Gold) | Dark (default) |
|---|---|---|---|
| `--bg` | `#FAF4EC` | `#1A1410` | (base) |
| `--card` | `#FFFFFF` | `#2A2118` | (base) |
| `--border` | `#E8D9C2` | `#3D2F1F` | (base) |
| `--text` | `#3D2817` | `#F2E6CC` | (base) |
| `--text-dim` | `#8B6F4E` | `#8A7558` | (base) |
| `--text-faint` | `#B8A082` | `#5A4A35` | (base) |
| `--green` (accent) | `#A85A1F` | `#E8B547` | `#7ed99a` |
| Track/bar bg | `#F0E1CC` | `#3D2F1F` | (base) |
| Nav bg | `#FFFFFF` | `#120D0A` | (base) |
| Home circle | orange fill, white icon | gold fill, dark icon | (base) |

### Other CSS rules
- Page-specific styles go in their own CSS file (e.g. `tracker.css`). Global/shared styles go in `style.css`.
- Modals are bottom-sheets by default (`align-items: flex-end`). Exception: `#plannerModal` is centered.

### Bottom Nav Icons — Canonical SVG Reference
All 5 pages must use these exact SVG paths (verified pixel-identical). Each nav icon uses `width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"`.

| Icon | Paths |
|---|---|
| **Recipes** (book) | `M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2` · `M7 2v20` · `M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7` |
| **Nutrition** (bar chart) | `M18 20V10` · `M12 20V4` · `M6 20v-6` |
| **Home** (house, `stroke-width="2"`, inside `.home-tab-ring`) | `M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z` · polyline `9 22 9 12 15 12 15 22` |
| **Workout** (dumbbell) | `M6.5 6.5h11M6.5 17.5h11M4 12h16M4 12l-2-2M4 12l-2 2M20 12l2-2M20 12l2 2` |
| **Profile** (person) | `M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2` · `circle cx="12" cy="7" r="4"` |

Active page only changes the icon **color** (via `var(--green)`), never the shape.

---

## Key JS Conventions

- All Firebase operations go through `firebase.js`. Never import Firebase SDK directly in other files.
- `localStorage` keys in use:
  - `fitdesi_theme` — `"dark"` | `"light"` | `"warm"`
  - `fitdesi_onboarding_done` — `"true"` fast-path cache so onboarding skips the Firestore read on repeat visits (source of truth is `onboardingDone` in Firestore)
  - `fitdesi_cycle_ack` — date string `"YYYY-MM-DD"`, prevents cycle popup from re-showing same day
  - `proteinGoal` — user's daily protein target (used by nav ring on all pages)
  - `carbsGoal`, `fatGoal`, `caloriesGoal` — full macro targets
  - `proteinData` — `{ "Mon May 04 2026": 120 }` — today's protein for nav ring
  - `todayWorkout` — `{ name, icon, isCardio }` — synced from exercise.js to home page
  - `fitdesi_admin_users` — JSON array of all user objects, cached by admin.js for offline fallback
- Every page's bottom nav has a protein ring script (inline `<script>` at bottom of body).
- Input validation: use `min`/`max` HTML attributes + the `validateField(id, required)` helper (defined inline in each page's script or in the JS file). Shows `.field-error` below the input, adds `.input-error` class on the element.

---

## Workout / Cycle System

- The app uses a **rolling split** — days cycle continuously from the `startDate`.
- `getTodayDayIndex()` = `Math.floor((today - startDate) / 86400000) % splitDays.length`
- **Never reset `startDate`** when a cycle completes — it corrupts the day index.
- **No Set A/B alternation.** Each split day has a single flat `exercises: [...]` list in `MY_SPLIT`. Standard splits (PPL, Upper/Lower, etc.) pick exercises from the library by muscle. No cycle-completion popup, no `currentSet`, no `acknowledgedCycles`, no `fitdesi_cycle_ack` localStorage.
- **Cycle number for display**: `getCurrentCycleNumber()` = `Math.floor(diffDays / splitDays.length) + 1` — derived from `startDate` on the fly, not persisted.

### Train This Today
Tapping any non-today chip in the week strip shows a confirmation popup. On confirm, `startDate` is moved back so the tapped chip's cycle day index becomes today.

**Formula:**
```
newStartDate = todayMidnight − cycleIdx × 86400000
```
Only `startDate` is written back; page reloads after save.

---

## Nutrition / Macro Calculation

Uses **Mifflin-St Jeor BMR** → multiply by activity factor to get TDEE → apply goal preset → apply user's calorie adjustment slider → split into macros. `calculateMacros()` is duplicated (by design, mirrors intentionally) in `profile.html`, `tracker.js`, and `index.html` — keep all three in sync when changing the formula.

- BMR: Mifflin-St Jeor (`10*weight + 6.25*height - 5*age + 5` male, `-161` female)
- TDEE: `BMR × activity multiplier` (sedentary 1.2 / light 1.375 / moderate 1.55 / active 1.725)
- Goal preset (added to TDEE): Recomp `0`, Muscle `+300`, Fat Loss `−500`
- **Calorie adjustment slider**: user-set fine-tune from Profile → Edit Profile, `−500` to `+500` in steps of 50, stored as `calorieAdjustment` (integer, default 0) on the profile doc. Added on top of the goal preset.
- **Final calories**: `TDEE + goalPreset + calorieAdjustment`
- Protein: `bodyWeight(kg) * 2.0` g — bumped to `* 2.4` when `goal === "recomp"` AND `calorieAdjustment < 0` (deficit recomp), to protect muscle
- Fat: `25%` of total calories
- Carbs: remaining calories / 4

Profile stores: `age`, `weight` (kg or lbs), `height` (cm or ft/in), `gender`, `activityLevel`, `goal` (recomp/muscle/fatloss), `calorieAdjustment` (integer, default 0)

---

## Onboarding Slides

First-time user intro shown once, ever. Implemented in `onboarding.js`, triggered from `index.html`.

### How it works
1. `initOnboarding()` is called from `index.html` after page load via a dynamic `import()`
2. Checks `localStorage("fitdesi_onboarding_done")` first — if set, returns immediately (fast path)
3. Otherwise waits for `onAuthStateChanged`, then reads the user's Firestore profile
4. If `profile.onboardingDone` is true → sets localStorage cache and returns
5. If not → calls `buildOnboarding(uid)` to show the slides overlay

### Dismissing
- Skip button (slide 1) or "Let's Go" button (slide 4) calls `dismiss()`
- `dismiss()` sets `localStorage("fitdesi_onboarding_done") = "true"` immediately
- Then calls `markOnboardingDone(uid)` to write `onboardingDone: true` to Firestore
- This means it will never show again, even after sign-out, device change, or browser data clear

### Slide structure
4 slides, each with: tag pill, title, body text, and a visual area
| Slide | Tag | Visual |
|-------|-----|--------|
| 1 — Welcome | green | 2×2 macro grid (Protein, Carbs, Fat, Calories) — each card `height: 60px` |
| 2 — Nutrition | teal | 3 recipe cards (Dal Tadka, Greek Yogurt, Peanut Butter) |
| 3 — Workouts | orange | 5-day rolling split strip with today highlighted |
| 4 — AI Coach | purple | Single 🤖 AI Coach avatar (bigger, centered, gold glow) |

### Navigation
- Left button: "Skip" on slide 1, "← Back" on slides 2–4
- Dots: all 4 are clickable and jump directly to that slide
- Right button: "Next →" on slides 1–3, "Let's Go 🚀" (purple) on slide 4

---

## UX Polish (v4.6.x)

### Custom 404 page (`404.html`)
- Themed (matches Light/Warm/Dark via the same flash-prevention inline script)
- Shows the missing URL, "Go back" (uses history.back), "Back to FitDesi", and 4 quick-link buttons
- `<meta name="robots" content="noindex">` so 404 URLs don't get indexed
- Auto-served by GitHub Pages for any unmatched `/FitDesi/*` route
- Cached by sw.js so it works offline

### Back-to-top floating button (`.back-to-top`)
- CSS in `style.css`; injected via ~12-line inline `<script>` block at the bottom of every long page (index, tracker, recipes, exercise, admin, profile, privacy, terms)
- Hidden until `window.scrollY > 300`, then fades in
- Sits above bottom nav with `env(safe-area-inset-bottom)` padding
- Pages without bottom nav use `<body class="no-bottom-nav">` so the button sits lower
- Themed via `var(--green)` accent + respects `prefers-reduced-motion`

### Recipe print stylesheet (`@media print` in `recipes.css`)
- 🖨️ Print button in the recipe detail panel header → triggers `window.print()` (handler in recipes.js)
- All chrome (nav, header, search, filters, grid, buttons, modals, video, back-to-top) is hidden via `display: none !important`
- Detail panel re-styled as a cookbook card: 28pt name, uppercase macros table, section labels with underline, dotted-underline ingredient list, line-break-preserving instructions
- A4 page size, 1.4cm/1.2cm margins
- Footer reads "Printed from FitDesi · jawandbajwa.github.io/FitDesi"

### Global keyboard shortcuts (`keyboard-shortcuts.js`)
Loaded as `<script defer>` on all 8 pages. Self-contained, runs after DOMContentLoaded. Skipped when typing in `<input>`/`<textarea>`/`<select>`/contenteditable. Modifier keys (Cmd/Ctrl/Alt) are ignored except for Cmd/Ctrl+K.

| Key | Action |
|---|---|
| `/` or `Ctrl/Cmd+K` | Focus first visible search input |
| `Esc` | Close any open modal/overlay/detail panel; blur input if focused |
| `g` then `h` | Home |
| `g` then `t` | Tracker (nutrition) |
| `g` then `r` | Recipes |
| `g` then `w` | Workout |
| `g` then `p` | Profile |
| `?` | Toggle keyboard-shortcuts help overlay |

The help overlay (`.kbd-help-overlay`) is lazily injected on first `?` press. Styled via `.kbd-help-card` + `<kbd>` tag CSS in `style.css`. The Profile About section has a "⌨️ Keyboard shortcuts" row that dispatches a synthetic `?` keydown to discover the feature.

---

## Security & Compliance (v4.6+)

### Account deletion (GDPR right-to-be-forgotten)
- Button: Profile → "Delete my account & data" (quieter than Sign Out — underlined text link)
- Confirmation: must type "DELETE" in the modal before the red button enables
- `deleteAllUserData(uid)` in firebase.js iterates 5 sub-collections (`data`, `logs`, `progress`, `workoutLogs`, `recipes`) and deletes every doc, then the top-level stub
- Does NOT delete the Firebase Auth account itself — user must revoke at [myaccount.google.com/permissions](https://myaccount.google.com/permissions)
- Local storage also cleared on successful delete

### Admin audit log
- Every sensitive admin action writes to `audit/{auto-id}`: setAdminStatus, assignCoach, deleteIngredient, deleteRecipe, deleteUserRecipe, promoteUserRecipe
- Schema: `{ at: Timestamp, actor: uid, actorEmail, action: string, ...details }`
- Firestore rules: `allow create: if isAdmin()`, `allow update,delete: if false` — append-only, tamper-evident
- Failure to log NEVER blocks the action itself (fire-and-forget try/catch)
- `deleteUserRecipe` only logs when admin deletes someone else's recipe, not when a user deletes their own

### Cloudflare Worker rate limiting
- Per-UID (with IP fallback) sliding window via Workers KV
- Limits: user 30/min + 200/hour, admin 100/min + 1000/hour
- Returns 429 with `Retry-After` header
- Requires KV namespace `RATE_LIMIT` bound in `wrangler.toml`; no-ops if missing
- coach.js sends `X-User-Uid` header so Worker can identify the user

### Subresource Integrity (SRI)
- Chart.js CDN script has `integrity="sha384-..."` + `crossorigin="anonymous"` (pinned to 4.4.7)
- Firebase SDK ES module imports CANNOT have SRI — only `<script>` tags do. Pinned version (10.7.1) is the only protection there.
- To bump Chart.js: `curl -sL <new-url> | openssl dgst -sha384 -binary | openssl base64 -A`

### Privacy + Terms pages
- `privacy.html` — what data is collected, where stored, user rights, third-party services
- `terms.html` — usage rules, "not medical advice" disclaimer, liability waiver
- Both linked from Profile About section. Both in sitemap.xml.

---

## Common Gotchas

1. **Service worker caching** — always run `node bump-version.js patch` (or `minor`/`major`) before pushing JS/CSS changes.
2. **Bottom nav is standardized across all 5 pages** — all pages now use identical markup for the home button: `class="nav-tab nav-home-tab"` with `<span class="nav-label">Home</span>`. Other nav items use `class="nav-item"` (recipes/workout/profile) or `class="nav-tab"` (nutrition). Both are styled identically in `style.css` (aliases). **SVG icons are now standardized** across all 5 pages — see "Bottom Nav Icons" reference above. If you add a new page or edit an icon, use the canonical SVG markup so the icon shape never changes between pages.
3. **Inline styles on modals** — some modal buttons in exercise.html have hardcoded dark colors as inline styles. Override with `!important` in style.css targeting the element's ID.
4. **Chart.js** — loaded via CDN. Use `type: "category"` for x-axis (not `"time"` — no date adapter loaded). Always call `.destroy()` on old chart instance before creating a new one.
5. **`deleteField()`** — imported from `firebase/firestore`, used in `clearWeightHistory` / `clearBodyFatHistory` to surgically remove one field from a progress doc without deleting the whole doc.
6. **`startDate` must never be reset** — see Workout/Cycle System above.
7. **Coach is not admin-only anymore** — any user with `coachEnabled: true` on their profile sees the coach button. Admin still sees it via the `isAdmin()` check.
8. **Cloudflare Worker is separate from GitHub** — changes to `cloudflare-worker.js` must be manually deployed via `wrangler deploy`. Pushing to GitHub does not update the live worker.
9. **Onboarding source of truth is Firestore, not localStorage** — localStorage is only a fast-path cache. If you need to reset onboarding for a user (e.g. for testing), clear `onboardingDone` from their Firestore profile doc AND delete `fitdesi_onboarding_done` from localStorage.
10. **Admin tab panes use `.admin-tab-pane`, not `.tab-content`** — `style.css` has a global `.tab-content { display: none }` rule. Using the same class in admin would permanently hide all admin tabs.
11. **`getAllUsers()` uses `collectionGroup` — requires a Firestore rule** — `match /{path=**}/data/{document} { allow read: if isAdmin(); }` must be present in `firestore.rules` AND deployed via `firebase deploy --only firestore:rules`. Without it the query silently returns `permission-denied` (no error thrown — just returns []).
12. **Admin `firebase.js` import has a version suffix** — `from "./firebase.js?v=2"` in admin.js. When firebase.js changes significantly, increment the `?v=N` to bust the ES module cache in long-lived browser sessions.
13. **Firestore rules are NOT deployed by git push** — always run `firebase deploy --only firestore:rules` after editing `firestore.rules`.
14. **All green colors must use CSS variables** — never hardcode `#7ed99a`, `#A85A1F`, or `#E8B547`. Use `var(--green)` for solid colors and `rgb(var(--green-rgb) / alpha)` for transparency. Works directly inside JS template literals for `style.cssText` — no helper needed (browsers resolve CSS variables when the style is applied). The old `getGreenColor()` helper was removed in v4.3.0; use `var(--green)` instead.
15. **Beware `\v` in JS template literals** — When writing CSS into a JS template literal (`` ` ... ` ``), don't accidentally introduce `\var(--green)` — JS interprets `\v` as the vertical-tab escape char, so the string becomes `<0x0B>ar(--green)` and the browser drops the whole declaration as invalid. Always write `var(--green)` (no leading backslash) in template literals.
16. **Admin panel: NEVER hardcode `rgba(255,255,255,X)`** — these are invisible in Light theme (cream bg). Use `var(--text)`, `var(--text-dim)`, `var(--text-faint)`, `var(--card)`, `var(--bg)`, or `var(--border)`. For form-label hints, use the `.field-hint` class. For empty-state messages, use `.muted-message`. For destructive/cancel buttons, use `.danger-btn` / `.cancel-btn`. See "Admin Panel — Current State → Theming" above.
17. **Account deletion uses `auth.currentUser.uid`** — not a passed-in arg from outside. The button in profile.html reads `auth.currentUser` and calls `deleteAllUserData(user.uid)`. After deletion, also `localStorage.clear()` before redirecting. Firebase Auth account itself stays — user must revoke at myaccount.google.com to fully sever.
18. **Adding a new admin action? Call `logAdminAction()` from inside the firebase.js function** — not from admin.js. Centralized so we never forget. Pattern: `try { ...; logAdminAction("name", { ...details }); } catch { ... }`.
19. **Cloudflare Worker rate limiting requires KV namespace `RATE_LIMIT`** — set up via Cloudflare dashboard, bind in wrangler.toml, then `wrangler deploy`. Without it the worker still works (gracefully no-ops on rate check). Don't ship the worker without the binding once you're getting real traffic — runaway tabs can drain your Gemini quota.
20. **`saveUserProfile()` writes with `{ merge: true }`** (fixed v4.7.0) — it used to be a full-document `setDoc` overwrite, which silently wiped `isAdmin`, `coachEnabled`, `onboardingDone`, `email`, `photoURL`, and `createdAt` any time `profile.html`'s "Save & Recalculate" ran with a partial profile object. If you add a new profile field written from somewhere that only sends a subset of fields, merge semantics now protect the rest — but don't rely on this to skip validating what you're writing.
21. **Prefer CSS vars over hardcoded `rgba(255,255,255,X)` — base tokens are re-themed per theme** (established v4.8.0). `--text`, `--text-dim`, `--text-faint`, `--bg`, `--card`, `--border`, `--green`, `--green-rgb`, `--red` are all redefined inside the `[data-theme="light"]` and `[data-theme="warm"]` root blocks in style.css (~lines 2056 and 2321). Any component using these vars auto-adapts to all 3 themes with zero per-selector override rules. New CSS should use these vars everywhere text or surface color is needed. The main remaining exception is the `.ep-*` edit-profile modal in `profile.css`, which still hardcodes some colors and depends on hand-tuned `[data-theme="light"] .ep-*` / `[data-theme="warm"] .ep-*` override blocks in style.css (~lines 2177 and 2437) — that's a legacy pattern; the modal works but new elements inside it should still prefer vars. For dynamic JS style injection (e.g. Chart.js configs) that can't consume CSS vars directly, use `getComputedStyle(document.documentElement).getPropertyValue('--text-dim').trim()` to resolve the current-theme value at render time (see `cssVar()` helper in tracker.js).
22. **v4.9.0 simplification — Set A/B system and 5-coach picker removed**. If you find references in old branches to `currentSet`, `cycleCount`, `acknowledgedCycles`, `lastSetPickedDate`, `fitdesi_cycle_ack`, `chosenCoach`, `saveCoachChoice`, `COACHES`, or `coaches.js` — those all went away. `saveWorkoutCycle` writes without `{merge:true}`, so any stale fields on existing Firestore `data/cycle` docs get dropped on next save. Existing `chosenCoach` fields on user profile docs are harmless (unused). The Cloudflare Worker + key routing are unchanged — only the frontend was simplified.

---

## How to Make Changes

1. Edit the relevant file(s) directly — no compilation needed
2. (Optional) Run `npm run format` to auto-format with Prettier, or `npm run lint` to check ESLint
3. Run `node bump-version.js patch` (or `minor`/`major`) to bump version + SW cache
4. Add a section to `CHANGELOG.md` describing what changed (one bullet per item, grouped under Added / Fixed / Changed / Removed)
5. `git add`, `git commit`, `git push origin main`
6. Site is live at https://jawandbajwa.github.io/FitDesi/ within ~1 minute
7. GitHub Actions automatically runs Lighthouse + ESLint + Prettier check — see the Actions tab for reports
8. If `cloudflare-worker.js` changed: also redeploy via `wrangler deploy` from `C:\Users\jawan\fitdesi-gemini`
9. If `firestore.rules` changed: also redeploy via `firebase deploy --only firestore:rules`
