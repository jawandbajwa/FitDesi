# FitDesi — Session 3 Build Log

**Date:** May 1, 2026  
**Developer:** Jawand Singh  
**Live URL:** https://jawandbajwa.github.io/FitDesi/

---

## Session 3 Summary

This session completed the recipe system, deployed to GitHub Pages, and planned the full improvement roadmap.

---

## What Was Completed This Session

### Recipe System — Full Overhaul

#### Bulk Importers Built
- `import_ingredients.html` — imports all 144 ingredients (77 Indian + 67 Canadian) to Firebase
- `import_recipes.html` — imports all 74 recipes with full ingredients + step-by-step instructions

#### Recipe Detail Panel Updated
- Full ingredient list with amounts (e.g. Paneer 150g, Ghee 5g)
- Numbered step-by-step cooking instructions for every recipe
- YouTube video embed where available
- Macro cards (Protein / Carbs / Fat / Calories)

#### Bugs Fixed
| Bug | Cause | Fix |
|---|---|---|
| Recipes page had no styling | `recipes.css` only had instructions block appended — full file missing | Rebuilt complete `recipes.css` from scratch |
| Cuisine toggle not switching | Old `firebase.js` only fetched one collection | Updated to accept `cuisine` param |
| Category filter not working | `renderRecipes()` calling `.classList` on null `emptyState` element | Made empty state inline HTML, removed DOM dependency |
| Duplicate recipes showing | Old recipes mixed with new import | Cleared Firebase collections and re-imported fresh |
| Wrong file in project | Node.js database `recipes.js` was in project instead of frontend version | Replaced with correct frontend file using Firebase imports |

### GitHub Pages Deployment
- Git installed on Windows
- Repository created: `jawandbajwa/FitDesi`
- Code pushed to GitHub main branch
- GitHub Pages enabled — Deploy from branch → main → root
- Firebase Authorized Domains updated with `jawandbajwa.github.io`
- **Live and fully working at:** https://jawandbajwa.github.io/FitDesi/

### Deployment Commands Used
```bash
git init
git add .
git commit -m "FitDesi initial commit"
git branch -M main
git remote add origin https://github.com/jawandbajwa/fitdesi.git
git push -u origin main
```

---

## App Review — Honest Assessment

### Overall Rating: 7.2 / 10

Solid for a personal project built from scratch. Above average for a first full-stack app. Not yet at commercial product level — but the foundation is genuinely strong.

---

### Strong Points

**Clean architecture.** Firebase + modular JS + separate CSS per page — proper separation of concerns. Most beginners dump everything into one file.

**Well thought out data model.** Dual recipe collections, user-scoped logs, shared ingredients — real database design decisions, not accidents.

**Meal planner algorithm works.** Scoring combinations by weighted macro distance is legitimate nutrition logic. Most fitness apps give random meals.

**Recipe quality is high.** 74 recipes with real ingredients, proper gram measurements, step-by-step instructions and YouTube links. Genuinely useful content.

**Ships under pressure.** Hit bugs, stayed with them, asked the right questions, kept moving.

---

### Where It Lacks

**No error handling.** If Firebase goes down, the app shows a blank screen. Every async function needs try/catch with user-facing feedback.

**No loading states.** When switching cuisine or opening a recipe there is zero feedback while data is fetching. On a slow connection it looks broken.

**Mobile experience is weak.** Designed desktop-first. Recipe detail panel, planner modal and admin panel all have layout issues on a 390px iPhone screen. Most users will be on phone.

**No offline support.** Close WiFi and open the app — it dies. Firebase has built-in offline persistence but it is not set up.

**Security rules are wide open.** Firestore is likely still in test mode. Anyone who finds the Firebase config can read and write all data.

**No data validation.** Admin panel lets you save a recipe with 0 calories and negative protein. Onboarding accepts 9999kg weight. No input sanitisation.

**Exercise page has no logging.** You can see what workout to do but cannot record that you did it, how many reps, what weight.

**No progress tracking.** Body recomposition requires tracking weight and body fat over time. The app calculates once but never tracks week to week.

---

## Improvement Roadmap

### Priority Order

#### Week 1 — Foundation
1. **Security rules** — Protect all user data immediately. Not optional on a public URL.
2. **Error handling** — Wrap every Firebase call in try/catch. Show user what went wrong.
3. **Loading spinners** — Every `await getRecipes()` needs a visual indicator.

#### Week 2 — Mobile + PWA
4. **Mobile layout audit** — Test every page on a real phone. Fix every overflow and cut-off button.
5. **PWA** — Add `manifest.json` and service worker. Installs on home screen like a real app.
6. **Offline support** — `enableIndexedDbPersistence(db)` in `firebase.js`. Works without internet.

#### Week 3 — Core Missing Features
7. **Workout logging** — Sets, reps, weight per exercise. Store in `users/{uid}/workouts/{date}`.
8. **Progress tracking** — Weekly weight + body fat logged and graphed over time.

#### Week 4 — Nice to Have
9. **Shopping list** — Generate grocery list from meal plan.
10. **Push notifications** — Mobile meal reminders.
11. **Family member sharing** — Multi-user support.

---

## Firebase Security Rules — To Implement

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Users can only read/write their own data
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Shared recipes and ingredients — everyone reads, only admin writes
    match /shared/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
        request.auth.token.email == 'YOUR_ADMIN_EMAIL@gmail.com';
    }
  }
}
```

---

## PWA Setup — To Implement

**`manifest.json`**
```json
{
  "name": "FitDesi",
  "short_name": "FitDesi",
  "description": "Personal Indian vegetarian fitness tracker",
  "start_url": "/FitDesi/index.html",
  "display": "standalone",
  "background_color": "#080c0a",
  "theme_color": "#7ed99a",
  "icons": [
    {
      "src": "icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

Add to `<head>` in all HTML files:
```html
<link rel="manifest" href="manifest.json">
<meta name="theme-color" content="#7ed99a">
<meta name="apple-mobile-web-app-capable" content="yes">
```

---

## Workout Logging — Firebase Structure

```
users/
  {uid}/
    workouts/
      {dateKey}/           e.g. "Fri May 01 2026"
        exercises: [
          {
            name: "Pull-Ups / Chin-Ups",
            muscleGroup: "Lats Vertical",
            sets: [
              { reps: 8, weight: 0, unit: "bodyweight" },
              { reps: 7, weight: 0, unit: "bodyweight" },
              { reps: 6, weight: 0, unit: "bodyweight" }
            ]
          }
        ]
```

---

## Progress Tracking — Firebase Structure

```
users/
  {uid}/
    progress/
      {dateKey}/
        weight: 77          (kg)
        bodyFat: 18.5       (%)
        leanMass: 62.9      (kg)
        notes: "Felt strong today"
```

---

## Offline Support — One Line Fix

In `firebase.js` after `const db = getFirestore(app);` add:

```javascript
import { enableIndexedDbPersistence } from 'firebase/firestore';

enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
        console.log('Offline persistence failed - multiple tabs open');
    } else if (err.code === 'unimplemented') {
        console.log('Browser does not support offline persistence');
    }
});
```

---

## Full App Feature List (Completed)

### Home Page
- Greeting by time of day
- Today's protein progress
- Today's workout preview
- Daily tip rotation
- Admin badge for admin user
- Google Sign In / Sign Out

### Exercise Hub
- 5-day rolling workout cycle
- 8 split options + custom split builder
- Set A/B system
- Week view anchored to today
- Exercise library with YouTube embeds
- Cycle tracking in Firebase

### Macro Tracker
- 3-step onboarding
- Mifflin St Jeor BMR + TDEE
- 3 goals: Recomp / Muscle Gain / Fat Loss
- Macro progress bars
- BMI, Body Fat %, Ideal Weight, Lean Mass
- Daily meal log (Breakfast / Lunch / Snacks / Dinner)
- Add from recipe database or manual entry
- AI Coach messages (time-of-day aware)
- Edit Profile modal
- Meal notifications

### Meal Planner
- Plan Full Day or Fill Remaining toggle
- Indian or Canadian cuisine toggle
- Weighted macro scoring algorithm
- Swap individual meals
- Totals with over/under indicators
- Writes to Firebase daily log

### Recipe Cookbook
- 74 recipes (35 Indian + 39 Canadian)
- Full ingredient lists with gram amounts
- Numbered step-by-step cooking instructions
- YouTube video embeds
- Indian/Canadian cuisine toggle
- Category filter (All/Breakfast/Lunch/Dinner/Snacks)
- Search
- Add to Today's Meals

### Admin Panel
- Ingredient management (add/edit/delete)
- Recipe management with ingredient builder
- Indian/Canadian recipe tabs
- Auto macro calculation from ingredients
- Stats bar (ingredient count / recipe count / member count)

---

## Tech Stack Summary

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, Vanilla JavaScript ES Modules |
| Database | Firebase Firestore |
| Auth | Google Sign In |
| Hosting | GitHub Pages |
| Dev Server | VS Code Live Server |
| Firebase Project | fitdesi-punjab (Toronto region) |
| Repository | github.com/jawandbajwa/FitDesi |

---

## Session Statistics

| Metric | Count |
|---|---|
| Total recipes | 74 |
| Indian recipes | 35 |
| Canadian recipes | 39 |
| Total ingredients in DB | 144 |
| Pages built | 7 |
| Firebase collections | 6 |
| Bugs fixed this session | 5 |
| Total bugs fixed across all sessions | 20+ |

---

*Built with Claude Sonnet 4 — May 2026*  
*Sessions: April 30 + May 1, 2026*
