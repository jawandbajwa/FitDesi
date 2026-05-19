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
| `exercise.html` / `exercise.js` / `exercise.css` | Workout page — rolling split cycle, exercise library, set logging, Train This Today (tap any week-day chip to shift startDate) |
| `profile.html` / `profile.css` | User profile — edit stats, theme toggle, sign out, app version |
| `admin.html` / `admin.js` / `admin.css` | Admin panel — manage ingredients, recipes, users + coach assignment |
| `firebase.js` | ALL Firebase calls — auth, Firestore reads/writes, cache helpers |
| `coach.js` | AI coach UI — floating button, chat sheet, personality picker, Gemini calls |
| `coaches.js` | Coach definitions — 5 coaches with names, personalities, system prompts |
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

### Known past bugs (fixed)
- **Members always 0** — `users/{uid}` top-level docs didn't exist; `getDocs(collection(db,"users"))` returned []. Fixed by switching to `collectionGroup`.
- **Both tabs visible simultaneously** — stale cached `admin.js` used `.tab-content` selector (old name); `querySelectorAll(".tab-content")` found 0 elements so no pane was ever hidden. Fixed by renaming to `.admin-tab-pane` + adding `?v=2` import suffix.
- **Wrong Firestore paths in old admin queries** — old code queried `users/{uid}` directly instead of `users/{uid}/data/profile`. Fixed when collectionGroup approach was introduced.

---

## Firebase / Firestore Structure

```
users/{uid}/
  data/profile        → { name, email, photoURL, age, weight, height, goal,
                           activityLevel, gender, isAdmin, weightUnit, heightUnit,
                           coachEnabled, chosenCoach, onboardingDone, createdAt }
  data/cycle          → { startDate, currentSet, cycleCount, acknowledgedCycles,
                           activeSplit, customSplitDays, lastSetPickedDate }
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
- `coachEnabled: boolean` — set by admin to grant coach access to a user
- `chosenCoach: "vegeta"|"hinata"|"levi"|"allmight"|"gojo"` — set by the user on first open
- `onboardingDone: boolean` — set to `true` after user dismisses or completes onboarding slides

---

## AI Coach System

### How it works
1. Admin assigns coach access to a user in **Admin Panel → Users tab** (`coachEnabled: true`)
2. User sees the coach floating button on any page (fixed position: `bottom: 160px, right: 16px`)
3. First time they tap it → personality picker appears (choose once, saved forever)
4. User can switch coach anytime via the coach name button in the chat header (top-left)
5. Admin can also change a user's coach from the Users tab edit button (`✏️`)

### Chat UI details
- **Floating button**: 48×48px, `bottom: 160px, right: 16px` — positioned above bottom nav and page content
- **Chat sheet**: 60vh bottom sheet, slides up on button tap
- **Header**: 3-column CSS grid (`1fr auto 1fr`) — coach name/emoji pill (left, `justify-self: start`) | drag handle dot (center) | ✕ close (right, `justify-self: end`). Border-bottom separates from messages.
- **Backdrop**: `#coachBackdrop` fixed overlay, click to close, fades in/out with `.visible` class
- **Swipe to close**: touch listeners on `.chat-header` (full header, not just the dot). Closes if drag >50px down OR velocity >0.4px/ms. Springs back otherwise.
- **Messages**: `textContent` rendering (not innerHTML) — safe against HTML injection from AI
- **Typing indicator**: animated three-dot pulse bubble shown while Gemini responds
- **Quick replies**: contextual and time-of-day aware. Opening replies based on hour (morning/afternoon/evening/night). Follow-up replies based on coach message content. Generic replies rotate from a pool so they never feel repeated.
- **Input area**: text field + send button (green circle) + mic button (voice input)
- **Action JSON**: coach can append `{"action":"add_meal"|"complete_workout"|"swap_exercise",...}` on a new line — only stripped if line starts with `{"action"`
- **Name display**: coach addresses user by first name only — `fullName.split(" ")[0]` extracted in `getContext()`

### getContext() — what the coach knows every call
Fetches in parallel via `Promise.all`:
- `getUserProfile` — name, weight, height, age, gender, goal, activity, units
- `getDailyLog` — today's meals by type (breakfast/lunch/snack/dinner), names, per-meal cal/protein summary
- `getWorkoutCycle` — active split type, current set (A/B)
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

### The 5 coaches (defined in `coaches.js`)
| ID | Name | Tag | Personality |
|----|------|-----|-------------|
| `vegeta` | Vegeta | Strict | Demanding, elite mentality, rare compliments |
| `hinata` | Hinata | Polite | Warm, encouraging, celebrates every win |
| `levi` | Levi | No-Nonsense | Blunt, data-driven, exact numbers only |
| `allmight` | All Might | Hype | PLUS ULTRA energy, explosive motivation |
| `gojo` | Gojo | The Honored One | All 4 personalities combined, adapts to user's energy |

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
- `saveCoachChoice(uid, coachId)` — sets `chosenCoach` on a user's profile
- `markOnboardingDone(uid)` — sets `onboardingDone: true` on a user's profile (merge)
- `getUserRecipes(uid)` — reads users/{uid}/recipes
- `deleteUserRecipe(uid, recipeId)` — deletes from users/{uid}/recipes
- `getAllUserRecipes()` — reads personal recipes from every user
- `promoteUserRecipe(uid, recipeId, cuisine)` — copies user recipe to shared/recipes_{cuisine}/items

---

## Versioning

Version is stored in two places: `manifest.json` and `profile.html` (About section).
Current version: **4.2.0**

Rules:
- Small change → `node bump-version.js patch` (+1 patch, 0–9, rolls to minor at 10)
- Notable update → `node bump-version.js minor` (+1 minor, 0–9, rolls to major at 10)
- Big release → `node bump-version.js major` (+1 major)

The script also bumps `sw.js` cache version automatically (current: `fitdesi-v81`).

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
- CSS variables: `--bg`, `--card`, `--border`, `--text`, `--text-dim`, `--text-faint`, `--green` (accent), `--green-muted`, `--green-dark`, `--radius`

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
- New cycle detection uses `acknowledgedCycles` (integer in Firestore):
  - `elapsedCycleCount()` = `Math.floor(diffDays / splitDays.length)`
  - Show Set A/B popup when `elapsedCycleCount() > cycleData.acknowledgedCycles`
  - On picking Set A/B: save `acknowledgedCycles = elapsedCycleCount()` to Firestore
- `localStorage("fitdesi_cycle_ack")` = today's date string — blocks popup re-showing on same-day refresh

### Train This Today
Tapping any non-today chip in the week strip shows a confirmation popup. On confirm, `startDate` is recalculated so the tapped cycle day index becomes today — without touching `cycleCount` or `acknowledgedCycles`.

**Formula (safe — no cycle popup re-trigger):**
```
ack          = cycleData.acknowledgedCycles ?? 0
newDiffDays  = ack × splitDays.length + cycleIdx
newStartDate = todayMidnight − newDiffDays × 86400000
```
Only `startDate` is written back; page reloads after save.

---

## Nutrition / Macro Calculation

Uses **Mifflin-St Jeor BMR** → multiply by activity factor → split into macros:
- Protein: `bodyWeight(kg) * 2.0` g
- Fat: `25%` of total calories
- Carbs: remaining calories / 4
- Calories: BMR × activity multiplier

Profile stores: `age`, `weight` (kg or lbs), `height` (cm or ft/in), `gender`, `activityLevel`, `goal` (recomp/muscle/fatloss)

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
| 4 — AI Coach | purple | 5 coach avatars, Gojo center + larger |

### Navigation
- Left button: "Skip" on slide 1, "← Back" on slides 2–4
- Dots: all 4 are clickable and jump directly to that slide
- Right button: "Next →" on slides 1–3, "Let's Go 🚀" (purple) on slide 4

---

## Common Gotchas

1. **Service worker caching** — always run `node bump-version.js patch` (or `minor`/`major`) before pushing JS/CSS changes.
2. **`nav-item` vs `nav-tab`** — exercise.html/recipes.html/profile.html use `.nav-item`; index.html/tracker.html use `.nav-tab`. Both are styled identically in `style.css` (aliases). **SVG icons are now standardized** across all 5 pages — see "Bottom Nav Icons" reference above. If you add a new page or edit an icon, use the canonical SVG markup so the icon shape never changes between pages.
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

---

## How to Make Changes

1. Edit the relevant file(s) directly — no compilation needed
2. Run `node bump-version.js patch` (or `minor`/`major`) to bump version + SW cache
3. `git add`, `git commit`, `git push origin main`
4. Site is live at https://jawandbajwa.github.io/FitDesi/ within ~1 minute
5. If `cloudflare-worker.js` changed: also redeploy via `wrangler deploy` from `C:\Users\jawan\fitdesi-gemini`
