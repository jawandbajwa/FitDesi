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
| `exercise.html` / `exercise.js` / `exercise.css` | Workout page — rolling split cycle, exercise library, set logging |
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
| `coach-config.js` | **Gitignored** — local dev overrides (e.g. `GEMINI_PROXY_URL`) |
| `coach-config.example.js` | Template for coach-config.js |

---

## Firebase / Firestore Structure

```
users/{uid}/
  data/profile   → { name, email, photoURL, age, weight, height, goal,
                      activityLevel, gender, isAdmin, weightUnit, heightUnit,
                      coachEnabled, chosenCoach }
  data/cycle     → { startDate, currentSet, cycleCount, acknowledgedCycles,
                      activeSplit, customSplitDays, lastSetPickedDate }
  progress/{YYYY-MM-DD}  → { weight, bodyFat }
  workoutLogs/{date}/{exerciseName}  → [{ reps, weight }, ...]

ingredients/{id}   → { name, protein, carbs, fat, calories, fiber, category }
recipes/{id}       → { name, category, cuisine, serving, ingredients:[],
                        protein, carbs, fat, calories, videoId }
```

Auth: Google Sign-In only. `isAdmin: true` on the user profile doc grants admin access.

**Coach-related profile fields:**
- `coachEnabled: boolean` — set by admin to grant coach access to a user
- `chosenCoach: "vegeta"|"hinata"|"levi"|"allmight"|"gojo"` — set by the user on first open

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
- **Header**: coach name/emoji button (left) → switch coach | drag handle (center) | ✕ close (right)
- **Messages**: `textContent` rendering (not innerHTML) — safe against HTML injection from AI
- **Typing indicator**: animated three-dot pulse bubble shown while Gemini responds
- **Quick replies**: stay visible (dimmed) while coach thinks, replaced when reply arrives
- **Input area**: text field + send button (green circle) + mic button (voice input)
- **Action JSON**: coach can append `{"action":"add_meal"|"complete_workout"|"swap_exercise",...}` on a new line — only stripped if line starts with `{"action"`

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
- **`maxOutputTokens`**: 600 (set in `generationConfig` — prevents mid-sentence cutoff)
- **Response parsing**: joins all `parts[].text` in case Gemini splits response across multiple parts

### To redeploy the worker after changes
```powershell
cd C:\Users\jawan\fitdesi-gemini
Copy-Item "D:\FitDesi\cloudflare-worker.js" -Destination "src\index.js" -Force
wrangler deploy
```

### firebase.js coach functions
- `getAllUsers()` — fetches all user profile docs for admin panel
- `assignCoach(uid, enabled)` — sets `coachEnabled` on a user's profile
- `saveCoachChoice(uid, coachId)` — sets `chosenCoach` on a user's profile

---

## Versioning

Version is stored in two places: `manifest.json` and `profile.html` (About section).
Current version: **2.1.0**

Rules:
- Small change → `node bump-version.js patch` (+1 patch, 0–9, rolls to minor at 10)
- Notable update → `node bump-version.js minor` (+1 minor, 0–9, rolls to major at 10)
- Big release → `node bump-version.js major` (+1 major)

The script also bumps `sw.js` cache version automatically (current: `fitdesi-v28`).

---

## Key CSS Conventions

- **Dark theme** is the default. All base styles are dark.
- **Light theme** is applied via `[data-theme="light"]` on the `<html>` element.
- All light theme overrides live at the **bottom of `style.css`** in one block.
- Flash prevention: every HTML page has this inline script in `<head>` before any CSS:
  ```html
  <script>try{if(localStorage.getItem("fitdesi_theme")==="light")document.documentElement.setAttribute("data-theme","light")}catch(e){}</script>
  ```
- CSS variables: `--bg`, `--card`, `--border`, `--text`, `--text-dim`, `--green`, `--radius`
- Page-specific styles go in their own CSS file (e.g. `tracker.css`). Global/shared styles go in `style.css`.
- Modals are bottom-sheets by default (`align-items: flex-end`). Exception: `#plannerModal` is centered.

---

## Key JS Conventions

- All Firebase operations go through `firebase.js`. Never import Firebase SDK directly in other files.
- `localStorage` keys in use:
  - `fitdesi_theme` — `"dark"` or `"light"`
  - `fitdesi_cycle_ack` — date string `"YYYY-MM-DD"`, prevents cycle popup from re-showing same day
  - `proteinGoal` — user's daily protein target (used by nav ring on all pages)
  - `carbsGoal`, `fatGoal`, `caloriesGoal` — full macro targets
  - `proteinData` — `{ "Mon May 04 2026": 120 }` — today's protein for nav ring
  - `todayWorkout` — `{ name, icon, isCardio }` — synced from exercise.js to home page
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

---

## Nutrition / Macro Calculation

Uses **Mifflin-St Jeor BMR** → multiply by activity factor → split into macros:
- Protein: `bodyWeight(kg) * 2.0` g
- Fat: `25%` of total calories
- Carbs: remaining calories / 4
- Calories: BMR × activity multiplier

Profile stores: `age`, `weight` (kg or lbs), `height` (cm or ft/in), `gender`, `activityLevel`, `goal` (recomp/muscle/fatloss)

---

## Common Gotchas

1. **Service worker caching** — always run `node bump-version.js patch` (or `minor`/`major`) before pushing JS/CSS changes.
2. **`nav-item` vs `nav-tab`** — exercise.html and recipes.html use `.nav-item`; tracker.html uses `.nav-tab`. Both are styled in `style.css`.
3. **Inline styles on modals** — some modal buttons in exercise.html have hardcoded dark colors as inline styles. Override with `!important` in style.css targeting the element's ID.
4. **Chart.js** — loaded via CDN. Use `type: "category"` for x-axis (not `"time"` — no date adapter loaded). Always call `.destroy()` on old chart instance before creating a new one.
5. **`deleteField()`** — imported from `firebase/firestore`, used in `clearWeightHistory` / `clearBodyFatHistory` to surgically remove one field from a progress doc without deleting the whole doc.
6. **`startDate` must never be reset** — see Workout/Cycle System above.
7. **Coach is not admin-only anymore** — any user with `coachEnabled: true` on their profile sees the coach button. Admin still sees it via the `isAdmin()` check.
8. **Cloudflare Worker is separate from GitHub** — changes to `cloudflare-worker.js` must be manually deployed via `wrangler deploy`. Pushing to GitHub does not update the live worker.

---

## How to Make Changes

1. Edit the relevant file(s) directly — no compilation needed
2. Run `node bump-version.js patch` (or `minor`/`major`) to bump version + SW cache
3. `git add`, `git commit`, `git push origin main`
4. Site is live at https://jawandbajwa.github.io/FitDesi/ within ~1 minute
5. If `cloudflare-worker.js` changed: also redeploy via `wrangler deploy` from `C:\Users\jawan\fitdesi-gemini`
