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

### To deploy a change
```
git add <files>
git commit -m "description"
git push origin main
```
That's it. No build step. Changes go live in ~1 minute.

### After deploying CSS or JS changes
Bump the service worker cache version in `sw.js`:
```js
const CACHE_NAME = "fitdesi-v4"; // increment this number
```
This forces all users to get fresh files on next visit.

---

## File Map

| File | Purpose |
|------|---------|
| `index.html` | Home page — protein ring, macro rings, streak, today's workout card |
| `tracker.html` / `tracker.js` / `tracker.css` | Nutrition tracker — Today tab, Meal Plan tab, Progress tab |
| `recipes.html` / `recipes.js` / `recipes.css` | Recipe browser — Indian & Canadian, filter by meal type |
| `exercise.html` / `exercise.js` / `exercise.css` | Workout page — rolling split cycle, exercise library, set logging |
| `profile.html` / `profile.css` | User profile — edit stats, theme toggle, sign out |
| `admin.html` / `admin.js` / `admin.css` | Admin panel — manage ingredients, recipes, users (admin only) |
| `firebase.js` | ALL Firebase calls — auth, Firestore reads/writes, cache helpers |
| `style.css` | Global styles shared by all pages — also contains ALL light theme overrides |
| `sw.js` | Service worker — network-first caching strategy |
| `app.js` | Home page JS — macro rings, streak, coach message, quick actions |
| `db.js` | IndexedDB helpers for offline caching of workout/cycle data |
| `ingredients.js` | Indian ingredient database (used by admin) |
| `ingredients_canada.js` | Canadian ingredient database |
| `recipes_canada.js` | Canadian recipe database |

---

## Firebase / Firestore Structure

```
users/{uid}/
  profile          → { name, email, photoURL, age, weight, height, goal,
                        activityLevel, gender, isAdmin, weightUnit, heightUnit }
  data/
    cycle          → { startDate, currentSet, cycleCount, cycleCountackowledgedCycles,
                        activeSplit, customSplitDays, lastSetPickedDate }
  progress/{YYYY-MM-DD}  → { weight, bodyFat }
  workoutLogs/{date}/{exerciseName}  → [{ reps, weight }, ...]

ingredients/{id}   → { name, protein, carbs, fat, calories, fiber, category }
recipes/{id}       → { name, category, cuisine, serving, ingredients:[],
                        protein, carbs, fat, calories, videoId }
```

Auth: Google Sign-In only. `isAdmin: true` on the user profile doc grants admin access.

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
- Protein: `bodyWeight(kg) * 2.0` g (or 1g/lb)
- Fat: `25%` of total calories
- Carbs: remaining calories / 4
- Calories: BMR × activity multiplier

Profile stores: `age`, `weight` (kg or lbs), `height` (cm or ft/in), `gender`, `activityLevel`, `goal` (bulk/cut/maintain/athlete)

---

## Common Gotchas

1. **Service worker caching** — after changing CSS or JS, bump `CACHE_NAME` in `sw.js` or users will see old files.
2. **`nav-item` vs `nav-tab`** — exercise.html and recipes.html use `.nav-item`; tracker.html uses `.nav-tab`. Both are styled in `style.css`. Light theme needs overrides for both.
3. **Inline styles on modals** — some modal buttons in exercise.html have hardcoded dark colors as inline styles. Override them with `!important` in style.css targeting the element's ID.
4. **Chart.js** — loaded via CDN. Use `type: "category"` for x-axis (not `"time"` — no date adapter loaded). Always call `.destroy()` on old chart instance before creating a new one.
5. **`deleteField()`** — imported from `firebase/firestore`, used in `clearWeightHistory` / `clearBodyFatHistory` to surgically remove one field from a progress doc without deleting the whole doc.
6. **`startDate` must never be reset** — see Workout/Cycle System above.

---

## How to Make Changes

1. Edit the relevant file(s) directly — no compilation needed
2. Test by opening the file in browser (or push and test on live site)
3. `git add`, `git commit`, `git push origin main`
4. If you changed CSS or JS: bump `CACHE_NAME` in `sw.js` in the same commit
5. Site is live at https://jawandbajwa.github.io/FitDesi/ within ~1 minute
