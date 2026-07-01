// ─── TYPE DEFINITIONS (JSDoc — for VS Code autocomplete + tsc --checkJs) ───
/**
 * @typedef {Object} UserProfile
 * @property {string} [name]
 * @property {string} [email]
 * @property {string} [photoURL]
 * @property {number} [age]
 * @property {number} [weight]                       Weight in kg (canonical, even if entered in lbs)
 * @property {number} [height]                       Height in cm
 * @property {"male"|"female"} [gender]
 * @property {"sedentary"|"light"|"moderate"|"heavy"} [activityLevel]
 * @property {"recomp"|"muscle"|"fatloss"} [goal]
 * @property {"kg"|"lbs"} [weightUnit]
 * @property {"cm"|"ft"} [heightUnit]
 * @property {boolean} [isAdmin]
 * @property {boolean} [coachEnabled]
 * @property {"vegeta"|"hinata"|"levi"|"allmight"|"gojo"} [chosenCoach]
 * @property {boolean} [onboardingDone]
 * @property {string} [createdAt]                    ISO timestamp
 */

/**
 * @typedef {Object} MealItem
 * @property {string} name
 * @property {number} protein
 * @property {number} carbs
 * @property {number} fat
 * @property {number} calories
 * @property {string} [recipeId]                     If from saved recipe
 */

/**
 * @typedef {Object} DailyLog
 * @property {MealItem[]} breakfast
 * @property {MealItem[]} lunch
 * @property {MealItem[]} snack
 * @property {MealItem[]} dinner
 */

/**
 * @typedef {Object} WorkoutCycle
 * @property {string} startDate                      ISO timestamp — DO NOT reset on cycle complete
 * @property {"A"|"B"} [currentSet]
 * @property {number} [cycleCount]
 * @property {number} [acknowledgedCycles]
 * @property {string} [activeSplit]                  "mysplit", "ppl", "upperlower", etc.
 * @property {Object[]} [customSplitDays]
 * @property {string} [lastSetPickedDate]            ISO date
 */

/**
 * @typedef {Object} Recipe
 * @property {string} id
 * @property {string} name
 * @property {"breakfast"|"lunch"|"dinner"|"snack"} [category]
 * @property {"indian"|"canadian"} [cuisine]
 * @property {string} [serving]
 * @property {Object[]} [ingredients]
 * @property {number} protein
 * @property {number} carbs
 * @property {number} fat
 * @property {number} calories
 * @property {string} [videoId]
 * @property {string} [instructions]
 * @property {string} [notes]
 */

/**
 * @typedef {Object} Ingredient
 * @property {string} id
 * @property {string} name
 * @property {number} protein
 * @property {number} carbs
 * @property {number} fat
 * @property {number} calories
 * @property {number} [fiber]
 * @property {string} category
 */

/**
 * @typedef {Object} ProgressEntry
 * @property {number} [weight]                       kg
 * @property {number} [bodyFat]                      Percent (e.g. 18.5)
 */

// ─── FIREBASE CONFIGURATION ──────────────────────────────────
// Note on Subresource Integrity: ES module `import` statements do NOT
// support the `integrity` attribute — that's only available for
// `<script integrity="...">` tags. So we can't add SRI hashes here.
// Our only protection against gstatic.com supply-chain compromise is
// pinning the SDK version (10.7.1 below) — the URL is immutable.
// When bumping the version, do it deliberately and check the Firebase
// release notes for any security advisories.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  setPersistence,
  indexedDBLocalPersistence,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  collectionGroup,
  query,
  getDocs,
  addDoc,
  serverTimestamp,
  deleteDoc,
  deleteField,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ─── OFFLINE DB ──────────────────────────────────────────────
import {
  cacheRecipes,
  getCachedRecipes,
  cacheIngredients,
  getCachedIngredients,
  cacheUserProfile,
  getCachedUserProfile,
  cacheDailyLog,
  getCachedDailyLog,
  cacheWorkoutCycle,
  getCachedWorkoutCycle,
} from "./db.js";

const firebaseConfig = {
  apiKey: "AIzaSyDPh5lJSDw6npXHHAompfLZCU3TJLbQUgk",
  authDomain: "fitdesi-punjab.firebaseapp.com",
  projectId: "fitdesi-punjab",
  storageBucket: "fitdesi-punjab.firebasestorage.app",
  messagingSenderId: "164487770265",
  appId: "1:164487770265:web:4d7c4fa01e292940ac4808",
};

// ─── INITIALIZE ──────────────────────────────────────────────
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// Use IndexedDB persistence — survives cookie clears, "Sign out of browser",
// and is isolated per origin in true PWA standalone installs.
// Falls back silently if IndexedDB is unavailable (e.g. private browsing).
setPersistence(auth, indexedDBLocalPersistence).catch(() => {});

// ─── ADMIN EMAIL ─────────────────────────────────────────────
const ADMIN_EMAIL = "jawandbajwa@gmail.com"; // Replace with your actual Gmail

// ─── AUTH FUNCTIONS ──────────────────────────────────────────
// Detect if running as an installed PWA on ANY platform (iOS or Android)
function isStandalonePWA() {
  return (
    window.navigator.standalone === true || // iOS "Add to Home Screen"
    window.matchMedia("(display-mode: standalone)").matches // Android "Install App"
  );
}

function isAndroidPWA() {
  // True only when installed as a PWA on Android (standalone mode).
  // Regular Android Chrome browser is NOT standalone.
  return /android/i.test(navigator.userAgent) &&
    window.matchMedia("(display-mode: standalone)").matches;
}

/**
 * Sign in via Google. Uses popup on browsers + iOS; redirect on Android PWA
 * (popups are blocked in WebView shell). Falls back to redirect if popup is blocked.
 * @returns {Promise<import("firebase/auth").User | null>}  User on popup success, null on redirect
 */
async function signInWithGoogle() {
  try {
    // Android standalone PWA: signInWithPopup may be blocked inside the
    // WebView shell, so use redirect. Result captured by getRedirectResult()
    // in login.html.
    if (isAndroidPWA()) {
      await signInWithRedirect(auth, provider);
      return null;
    }

    // All other cases (Android Chrome browser, iOS, desktop): use popup.
    // signInWithRedirect is NOT used for regular Android Chrome because it
    // relies on sessionStorage which Chrome wipes when the tab is killed
    // during the Google redirect — causing getRedirectResult() to return
    // null and the login screen to loop endlessly.
    // Popup is triggered by user gesture so Chrome will NOT block it.
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    // If popup is blocked for any reason, fall back to redirect
    if (error.code === "auth/popup-blocked" || error.code === "auth/cancelled-popup-request") {
      await signInWithRedirect(auth, provider);
      return null;
    }
    console.error("Sign in error:", error);
    throw error;
  }
}

// Explicit redirect sign-in — used as a manual fallback in login.html
async function signInWithGoogleRedirect() {
  await signInWithRedirect(auth, provider);
}

async function signOutUser() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Sign out error:", error);
  }
}

/**
 * Whether the given Firebase Auth user has admin privileges.
 * @param {import("firebase/auth").User | null | undefined} user
 * @returns {boolean}
 */
function isAdmin(user) {
  return user && user.email === ADMIN_EMAIL;
}

// ─── USER PROFILE ────────────────────────────────────────────
/**
 * Save a user's profile to Firestore (also writes top-level stub doc).
 * @param {string} userId
 * @param {UserProfile} profile
 * @returns {Promise<void>}
 */
async function saveUserProfile(userId, profile) {
  try {
    await setDoc(doc(db, "users", userId, "data", "profile"), profile, { merge: true });
    // Write a stub to the top-level users/{uid} document so getDocs(collection(db,"users"))
    // can discover all users. Firestore subcollections don't create parent documents
    // automatically — without this stub, getAllUsers() always returns [].
    await setDoc(doc(db, "users", userId), { uid: userId, _exists: true }, { merge: true });
  } catch (error) {
    console.error("Error saving user profile:", error);
    throw error;
  }
}

/**
 * Read a user's profile. Auto-creates a minimal profile from Google auth
 * data if none exists yet, plus a top-level `users/{uid}` stub doc so the
 * admin panel's collectionGroup query discovers them. Falls back to
 * IndexedDB cache on Firestore failure.
 * @param {string} userId
 * @returns {Promise<UserProfile|null>}
 */
async function getUserProfile(userId) {
  try {
    const snap = await getDoc(doc(db, "users", userId, "data", "profile"));
    if (snap.exists()) {
      const profile = snap.data();
      cacheUserProfile(userId, profile).catch(() => {});
      // Ensure top-level stub exists (fire-and-forget — never block the profile return)
      setDoc(doc(db, "users", userId), { uid: userId, _exists: true }, { merge: true }).catch(() => {});
      return profile;
    }
    // No profile doc yet — auto-create one from Google auth data
    // so the user appears in the admin panel immediately
    const user = auth.currentUser;
    const minimal = {
      name:      user?.displayName || "",
      email:     user?.email       || "",
      photoURL:  user?.photoURL    || "",
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, "users", userId, "data", "profile"), minimal, { merge: true });
    // Write stub so this user is discoverable by getAllUsers()
    await setDoc(doc(db, "users", userId), { uid: userId, _exists: true }, { merge: true });
    cacheUserProfile(userId, minimal).catch(() => {});
    return minimal;
  } catch (error) {
    console.error("Firestore profile failed, falling back to cache:", error);
    try {
      return await getCachedUserProfile(userId);
    } catch {
      return null;
    }
  }
}

// ─── DAILY LOGS ──────────────────────────────────────────────
/**
 * Save the meal log for one date.
 * @param {string} userId
 * @param {string} dateKey  Format: "YYYY-MM-DD"
 * @param {DailyLog} log
 * @returns {Promise<void>}
 */
async function saveDailyLog(userId, dateKey, log) {
  try {
    await setDoc(doc(db, "users", userId, "logs", dateKey), log);
  } catch (error) {
    console.error("Error saving daily log:", error);
    throw error;
  }
}

/**
 * Read the meal log for one date. Returns empty 4-meal structure if no log exists.
 * Falls back to IndexedDB cache on Firestore failure.
 * @param {string} userId
 * @param {string} dateKey  Format: "YYYY-MM-DD"
 * @returns {Promise<DailyLog>}
 */
async function getDailyLog(userId, dateKey) {
  const empty = { breakfast: [], lunch: [], snack: [], dinner: [] };
  try {
    const snap = await getDoc(doc(db, "users", userId, "logs", dateKey));
    const log = snap.exists() ? snap.data() : empty;
    cacheDailyLog(userId, dateKey, log).catch(() => {});
    return log;
  } catch (error) {
    console.error("Firestore daily log failed, falling back to cache:", error);
    try {
      return (await getCachedDailyLog(userId, dateKey)) || empty;
    } catch {
      return empty;
    }
  }
}

// ─── USER SPLIT ──────────────────────────────────────────────
async function saveUserSplit(userId, split) {
  try {
    await setDoc(doc(db, "users", userId, "data", "split"), split);
  } catch (error) {
    console.error("Error saving user split:", error);
    throw error;
  }
}

async function getUserSplit(userId) {
  try {
    const snap = await getDoc(doc(db, "users", userId, "data", "split"));
    return snap.exists() ? snap.data() : null;
  } catch (error) {
    console.error("Error getting user split:", error);
    throw error;
  }
}

// ─── RECIPES (Indian + Canadian) ─────────────────────────────
// cuisine param: 'indian' (default) or 'canadian'

async function saveRecipe(recipe, cuisine = "indian") {
  try {
    const col = cuisine === "canadian" ? "recipes_canadian" : "recipes_indian";
    if (recipe.id) {
      const ref = doc(db, "shared", col, "items", recipe.id);
      await setDoc(ref, recipe);
      return recipe.id;
    } else {
      const ref = doc(collection(db, "shared", col, "items"));
      await setDoc(ref, { ...recipe, id: ref.id });
      return ref.id;
    }
  } catch (error) {
    console.error("Error saving recipe:", error);
    throw error;
  }
}

/**
 * Read all shared recipes for one cuisine. Falls back to IndexedDB on Firestore failure.
 * @param {"indian"|"canadian"} [cuisine]
 * @returns {Promise<Recipe[]>}
 */
async function getRecipes(cuisine = "indian") {
  try {
    // Always try Firestore first — navigator.onLine is unreliable on mobile
    // networks and cellular connections, so we let the fetch itself fail
    // and fall back to cache only when it genuinely can't reach Firebase.
    const col = cuisine === "canadian" ? "recipes_canadian" : "recipes_indian";
    const snap = await getDocs(collection(db, "shared", col, "items"));
    const recipes = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      _cuisine: cuisine,
    }));
    // Fire-and-forget cache update — never let a cache write failure
    // mask a successful Firestore read (was a bug: if cacheRecipes threw,
    // the entire catch block ran and returned [] instead of the fresh data).
    cacheRecipes(recipes, cuisine).catch(() => {});
    return recipes;
  } catch (error) {
    console.error("Firestore recipes failed, falling back to cache:", error);
    try {
      const cached = await getCachedRecipes(cuisine);
      if (cached && cached.length > 0) return cached;
    } catch (cacheError) {
      console.error("Cache also failed:", cacheError);
    }
    return [];
  }
}

async function deleteRecipe(id, cuisine = "indian") {
  try {
    const col = cuisine === "canadian" ? "recipes_canadian" : "recipes_indian";
    await deleteDoc(doc(db, "shared", col, "items", id));
    logAdminAction("deleteRecipe", { recipeId: id, cuisine });
  } catch (error) {
    console.error("Error deleting recipe:", error);
    throw error;
  }
}

// ─── INGREDIENTS ─────────────────────────────────────────────
async function saveIngredient(ingredient) {
  try {
    if (ingredient.id) {
      const ref = doc(db, "shared", "ingredients", "items", ingredient.id);
      await setDoc(ref, ingredient);
      return ingredient.id;
    } else {
      const ref = doc(collection(db, "shared", "ingredients", "items"));
      await setDoc(ref, { ...ingredient, id: ref.id });
      return ref.id;
    }
  } catch (error) {
    console.error("Error saving ingredient:", error);
    throw error;
  }
}

/**
 * Read all shared ingredients. Falls back to IndexedDB on Firestore failure.
 * @returns {Promise<Ingredient[]>}
 */
async function getIngredients() {
  try {
    const snap = await getDocs(
      collection(db, "shared", "ingredients", "items"),
    );
    const ingredients = snap.docs.map((d) => d.data());
    cacheIngredients(ingredients).catch(() => {});
    return ingredients;
  } catch (error) {
    console.error("Firestore ingredients failed, falling back to cache:", error);
    try {
      return await getCachedIngredients();
    } catch {
      return [];
    }
  }
}

async function deleteIngredient(ingredientId) {
  try {
    await deleteDoc(doc(db, "shared", "ingredients", "items", ingredientId));
    logAdminAction("deleteIngredient", { ingredientId });
  } catch (error) {
    console.error("Error deleting ingredient:", error);
    throw error;
  }
}

// ─── NOTIFICATION TIMES ──────────────────────────────────────
async function saveNotifTimes(userId, times) {
  try {
    await setDoc(doc(db, "users", userId, "data", "notifications"), times);
  } catch (error) {
    console.error("Error saving notification times:", error);
    throw error;
  }
}

async function getNotifTimes(userId) {
  try {
    const snap = await getDoc(
      doc(db, "users", userId, "data", "notifications"),
    );
    return snap.exists()
      ? snap.data()
      : { breakfast: "08:00", lunch: "13:00", dinner: "20:00" };
  } catch (error) {
    console.error("Error getting notification times:", error);
    throw error;
  }
}

// ─── WORKOUT CYCLE ───────────────────────────────────────────
/**
 * Save the user's workout cycle state. NEVER reset startDate when a cycle
 * completes — see CLAUDE.md Workout/Cycle System.
 * @param {string} userId
 * @param {WorkoutCycle} cycle
 * @returns {Promise<void>}
 */
async function saveWorkoutCycle(userId, cycle) {
  try {
    await setDoc(doc(db, "users", userId, "data", "cycle"), cycle);
  } catch (error) {
    console.error("Error saving workout cycle:", error);
    throw error;
  }
}

/**
 * Read the user's workout cycle state. Returns null if not set up yet.
 * @param {string} userId
 * @returns {Promise<WorkoutCycle|null>}
 */
async function getWorkoutCycle(userId) {
  try {
    const snap = await getDoc(doc(db, "users", userId, "data", "cycle"));
    const cycle = snap.exists() ? snap.data() : null;
    if (cycle) cacheWorkoutCycle(userId, cycle).catch(() => {});
    return cycle;
  } catch (error) {
    console.error("Firestore workout cycle failed, falling back to cache:", error);
    try {
      return await getCachedWorkoutCycle(userId);
    } catch {
      return null;
    }
  }
}

// ─── WORKOUT LOGS ───────────────────────────────────────────
async function saveWorkoutLog(userId, dateKey, exerciseName, setsData) {
  try {
    await setDoc(
      doc(db, "users", userId, "workouts", dateKey, "exercises", exerciseName),
      { sets: setsData },
    );
  } catch (error) {
    console.error("Error saving workout log:", error);
    throw error;
  }
}

async function getWorkoutLog(userId, dateKey, exerciseName) {
  try {
    const snap = await getDoc(
      doc(db, "users", userId, "workouts", dateKey, "exercises", exerciseName),
    );
    return snap.exists() ? snap.data().sets : [];
  } catch (error) {
    console.error("Error getting workout log:", error);
    return [];
  }
}

// ─── PROGRESS TRACKING ───────────────────────────────────────
async function saveProgressEntry(userId, entry) {
  try {
    const dateKey = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    await setDoc(doc(db, "users", userId, "progress", dateKey), entry);
  } catch (error) {
    console.error("Error saving progress entry:", error);
    throw error;
  }
}

/**
 * Read all progress entries (weight + body-fat history) for the user.
 * @param {string} userId
 * @returns {Promise<Array<ProgressEntry & {date: string}>>}
 */
async function getProgressHistory(userId) {
  try {
    const snap = await getDocs(collection(db, "users", userId, "progress"));
    const history = [];
    snap.forEach((doc) => {
      history.push({ date: doc.id, ...doc.data() });
    });
    return history.sort((a, b) => new Date(a.date) - new Date(b.date));
  } catch (error) {
    console.error("Error getting progress history:", error);
    return [];
  }
}

async function clearWeightHistory(userId) {
  try {
    const snap = await getDocs(collection(db, "users", userId, "progress"));
    await Promise.all(
      snap.docs.map((d) => {
        const data = d.data();
        const ref = doc(db, "users", userId, "progress", d.id);
        // If the doc has bodyFat too, just strip the weight field; otherwise delete the doc
        return data.bodyFat != null
          ? updateDoc(ref, { weight: deleteField() })
          : deleteDoc(ref);
      }),
    );
  } catch (error) {
    console.error("Error clearing weight history:", error);
    throw error;
  }
}

async function clearBodyFatHistory(userId) {
  try {
    const snap = await getDocs(collection(db, "users", userId, "progress"));
    await Promise.all(
      snap.docs.map((d) => {
        const data = d.data();
        const ref = doc(db, "users", userId, "progress", d.id);
        // If the doc has weight too, just strip the bodyFat field; otherwise delete the doc
        return data.weight != null
          ? updateDoc(ref, { bodyFat: deleteField() })
          : deleteDoc(ref);
      }),
    );
  } catch (error) {
    console.error("Error clearing body fat history:", error);
    throw error;
  }
}

// ─── COACH FUNCTIONS ──────────────────────────────────────────
async function addMealToLog(uid, meal) {
  try {
    const today = new Date().toISOString().split("T")[0];
    const logRef = doc(db, "users", uid, "logs", today);

    // Get existing log
    const existingLog = await getDoc(logRef);
    const currentLog = existingLog.exists()
      ? existingLog.data()
      : {
          breakfast: [],
          lunch: [],
          snack: [],
          dinner: [],
        };

    // Add meal to appropriate array
    const mealType = meal.meal_type || "snack";
    if (!currentLog[mealType]) currentLog[mealType] = [];
    currentLog[mealType].push({
      name: meal.name,
      protein: meal.protein,
      carbs: meal.carbs,
      fat: meal.fat,
      calories: meal.calories,
      timestamp: new Date().toISOString(),
    });

    await setDoc(logRef, currentLog);
  } catch (error) {
    console.error("Error adding meal to log:", error);
    throw error;
  }
}

// Returns all workout log docs for the streak calculation on the home page.
// Each doc.id is a date string (ISO format), doc.data() has { completed, completedAt }.
async function getWorkoutLogsAll(uid) {
  try {
    const snap = await getDocs(collection(db, "users", uid, "workoutLogs"));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error("Error fetching workout logs:", error);
    return [];
  }
}

async function completeWorkout(uid, date) {
  try {
    await setDoc(
      doc(db, "users", uid, "workoutLogs", date),
      {
        completed: true,
        completedAt: new Date().toISOString(),
      },
      { merge: true },
    );
  } catch (error) {
    console.error("Error completing workout:", error);
    throw error;
  }
}

async function swapExercise(uid, date, oldName, newName) {
  try {
    const workoutRef = doc(
      db,
      "users",
      uid,
      "workouts",
      date,
      "exercises",
      oldName,
    );
    const newRef = doc(
      db,
      "users",
      uid,
      "workouts",
      date,
      "exercises",
      newName,
    );

    // Get old exercise data
    const oldDoc = await getDoc(workoutRef);
    if (oldDoc.exists()) {
      const data = oldDoc.data();
      // Create new exercise with same data
      await setDoc(newRef, data);
      // Delete old exercise
      await deleteDoc(workoutRef);
    }
  } catch (error) {
    console.error("Error swapping exercise:", error);
    throw error;
  }
}

// ─── ONBOARDING ──────────────────────────────────────────────
async function markOnboardingDone(uid) {
  try {
    const profileRef = doc(db, "users", uid, "data", "profile");
    await setDoc(profileRef, { onboardingDone: true }, { merge: true });
  } catch (error) {
    console.error("Error marking onboarding done:", error);
  }
}

// ─── COACH FUNCTIONS ─────────────────────────────────────────
async function saveCoachChoice(uid, coachId) {
  try {
    const profileRef = doc(db, "users", uid, "data", "profile");
    await setDoc(profileRef, { chosenCoach: coachId }, { merge: true });
  } catch (error) {
    console.error("Error saving coach choice:", error);
    throw error;
  }
}

async function saveCalorieAdjustment(uid, calorieAdjustment) {
  try {
    const profileRef = doc(db, "users", uid, "data", "profile");
    await setDoc(profileRef, { calorieAdjustment }, { merge: true });
  } catch (error) {
    console.error("Error saving calorie adjustment:", error);
    throw error;
  }
}

async function assignCoach(uid, enabled) {
  try {
    const profileRef = doc(db, "users", uid, "data", "profile");
    await setDoc(profileRef, { coachEnabled: enabled }, { merge: true });
    logAdminAction("assignCoach", { target: uid, enabled });
  } catch (error) {
    console.error("Error assigning coach:", error);
    throw error;
  }
}

async function setAdminStatus(uid, adminStatus) {
  try {
    const profileRef = doc(db, "users", uid, "data", "profile");
    await setDoc(profileRef, { isAdmin: adminStatus }, { merge: true });
    logAdminAction("setAdminStatus", { target: uid, adminStatus });
  } catch (error) {
    console.error("Error setting admin status:", error);
    throw error;
  }
}

// ─── USER RECIPES ────────────────────────────────────────────
async function saveUserRecipe(uid, recipe) {
  try {
    if (recipe.id) {
      const ref = doc(db, "users", uid, "recipes", recipe.id);
      await setDoc(ref, recipe);
      return recipe.id;
    } else {
      const ref = doc(collection(db, "users", uid, "recipes"));
      const id = ref.id;
      await setDoc(ref, { ...recipe, id });
      return id;
    }
  } catch (error) {
    console.error("Error saving user recipe:", error);
    throw error;
  }
}

async function getUserRecipes(uid) {
  try {
    const snap = await getDocs(collection(db, "users", uid, "recipes"));
    return snap.docs.map((d) => ({ ...d.data(), id: d.id, _isUserRecipe: true }));
  } catch (error) {
    console.error("Error getting user recipes:", error);
    return [];
  }
}

async function deleteUserRecipe(uid, recipeId) {
  try {
    await deleteDoc(doc(db, "users", uid, "recipes", recipeId));
    // Only log when admin deletes someone else's recipe — not when the
    // user deletes their own from the recipes page.
    if (auth.currentUser && auth.currentUser.uid !== uid) {
      logAdminAction("deleteUserRecipe", { targetUser: uid, recipeId });
    }
  } catch (error) {
    console.error("Error deleting user recipe:", error);
    throw error;
  }
}

// Fetch every user's personal recipes in one call (admin only)
async function getAllUserRecipes() {
  try {
    const usersSnap = await getDocs(collection(db, "users"));
    const allRecipes = [];
    await Promise.all(
      usersSnap.docs.map(async (userDoc) => {
        const uid = userDoc.id;
        const [profileSnap, recipesSnap] = await Promise.all([
          getDoc(doc(db, "users", uid, "data", "profile")),
          getDocs(collection(db, "users", uid, "recipes")),
        ]);
        const profile = profileSnap.exists() ? profileSnap.data() : {};
        const ownerName = profile.name || profile.email || "Unknown";
        recipesSnap.docs.forEach((d) => {
          allRecipes.push({
            ...d.data(),
            id: d.id,
            _uid: uid,
            _ownerName: ownerName,
            _isUserRecipe: true,
          });
        });
      })
    );
    return allRecipes;
  } catch (error) {
    console.error("Error fetching all user recipes:", error);
    return [];
  }
}

// Copy a user's personal recipe into the shared recipes collection
async function promoteUserRecipe(uid, recipeId, cuisine = "indian") {
  try {
    const recipeSnap = await getDoc(doc(db, "users", uid, "recipes", recipeId));
    if (!recipeSnap.exists()) throw new Error("Recipe not found");
    const recipe = { ...recipeSnap.data() };
    delete recipe._isUserRecipe;
    const col = cuisine === "canadian" ? "recipes_canadian" : "recipes_indian";
    const ref = doc(collection(db, "shared", col, "items"));
    await setDoc(ref, {
      ...recipe,
      id: ref.id,
      cuisine,
      _promotedFrom: uid,
      _promotedAt: new Date().toISOString(),
    });
    logAdminAction("promoteUserRecipe", {
      fromUser: uid,
      recipeId,
      cuisine,
      sharedId: ref.id,
    });
    return ref.id;
  } catch (error) {
    console.error("Error promoting user recipe:", error);
    throw error;
  }
}

async function getAllUsers() {
  try {
    // Use collectionGroup to query all "data" sub-collections across every user.
    // Each user has exactly one doc in their "data" collection: the "profile" doc.
    // This discovers ALL users who have ever signed in — no stub top-level docs needed.
    const snap = await getDocs(query(collectionGroup(db, "data")));
    const users = [];
    snap.docs.forEach((d) => {
      // Only include "profile" docs — skip "cycle" and any other sub-docs
      if (d.ref.id !== "profile") return;
      // d.ref.parent.parent is the users/{uid} doc — grab the uid from its id
      const uid = d.ref.parent.parent?.id;
      if (uid) users.push({ uid, ...d.data() });
    });
    return users;
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
}

// ─── ADMIN AUDIT LOG ─────────────────────────────────────────
/**
 * Append a record to the audit/ collection whenever the admin takes
 * a sensitive action (grants admin, deletes a recipe, promotes a user
 * recipe, etc.). Fire-and-forget — never blocks the action itself.
 *
 * Stored at audit/{auto-id} with: at (serverTimestamp), actor, action,
 * target (optional uid), details (optional object).
 *
 * @param {string} action - Short action name, e.g. "setAdminStatus", "deleteRecipe"
 * @param {object} [details] - Extra context (target uid, name, cuisine, etc.)
 */
async function logAdminAction(action, details = {}) {
  const actor = auth.currentUser;
  if (!actor) return; // not signed in — shouldn't happen for admin actions
  try {
    await addDoc(collection(db, "audit"), {
      at: serverTimestamp(),
      actor: actor.uid,
      actorEmail: actor.email || null,
      action,
      ...details,
    });
  } catch (e) {
    // Audit failure must never block the actual admin action
    console.warn("Audit log write failed:", e);
  }
}

// ─── ACCOUNT DELETION ────────────────────────────────────────
/**
 * GDPR right-to-be-forgotten — permanently delete all of a user's data.
 *
 * Deletes from Firestore:
 *  - users/{uid}/data/profile
 *  - users/{uid}/data/cycle
 *  - users/{uid}/data/notifications
 *  - users/{uid}/data/coachHistory (if exists)
 *  - users/{uid}/logs/*               (every dated meal log)
 *  - users/{uid}/progress/*           (weight + body fat history)
 *  - users/{uid}/workoutLogs/*        (workout completion + sets)
 *  - users/{uid}/recipes/*            (personal recipes)
 *  - users/{uid}                      (top-level stub)
 *
 * NOTE: This does NOT delete the user's Firebase Auth account — that
 * requires Firebase Admin SDK (server-side). User can revoke Google
 * access at https://myaccount.google.com/permissions to fully sever.
 *
 * @param {string} uid - The user ID to delete data for.
 * @returns {Promise<void>}
 */
async function deleteAllUserData(uid) {
  if (!uid) throw new Error("deleteAllUserData: uid required");

  // List of sub-collections to wipe
  const subCollections = ["data", "logs", "progress", "workoutLogs", "recipes"];

  for (const sub of subCollections) {
    try {
      const snap = await getDocs(collection(db, "users", uid, sub));
      // Delete each doc in the sub-collection
      await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
    } catch (e) {
      console.warn(`Failed to delete users/${uid}/${sub}:`, e);
      // Continue with the next sub-collection — don't leave half-deleted data
    }
  }

  // Finally, delete the top-level stub doc
  try {
    await deleteDoc(doc(db, "users", uid));
  } catch (e) {
    console.warn("Failed to delete top-level user doc:", e);
  }
}

// ─── EXPORT ──────────────────────────────────────────────────
export {
  auth,
  db,
  provider,
  ADMIN_EMAIL,
  onAuthStateChanged,
  signInWithGoogle,
  signInWithGoogleRedirect,
  signOutUser,
  isAdmin,
  isStandalonePWA,
  getRedirectResult,
  saveUserProfile,
  getUserProfile,
  saveDailyLog,
  getDailyLog,
  saveUserSplit,
  getUserSplit,
  saveRecipe,
  getRecipes,
  deleteRecipe,
  saveIngredient,
  getIngredients,
  deleteIngredient,
  saveNotifTimes,
  getNotifTimes,
  saveWorkoutCycle,
  getWorkoutCycle,
  saveWorkoutLog,
  getWorkoutLog,
  saveProgressEntry,
  getProgressHistory,
  clearWeightHistory,
  clearBodyFatHistory,
  addMealToLog,
  getWorkoutLogsAll,
  completeWorkout,
  swapExercise,
  saveUserRecipe,
  getUserRecipes,
  deleteUserRecipe,
  saveCoachChoice,
  saveCalorieAdjustment,
  assignCoach,
  setAdminStatus,
  getAllUsers,
  getAllUserRecipes,
  promoteUserRecipe,
  markOnboardingDone,
  deleteAllUserData,
  logAdminAction,
};
