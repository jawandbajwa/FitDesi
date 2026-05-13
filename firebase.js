// ─── FIREBASE CONFIGURATION ──────────────────────────────────
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
  getDocs,
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

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isAndroidStandalone() {
  // Android PWA or any Android browser (redirect is needed; popup blocked)
  return /android/i.test(navigator.userAgent) ||
    window.matchMedia("(display-mode: standalone)").matches;
}

async function signInWithGoogle() {
  try {
    if (isIOS()) {
      // iOS: signInWithRedirect opens Google in Safari and the redirect back
      // lands in Safari — NOT in the PWA — so the PWA never captures the result.
      // Popup works correctly in both Safari browser and iOS standalone (Add to Home).
      const result = await signInWithPopup(auth, provider);
      return result.user;
    }
    if (isAndroidStandalone() || window.navigator.standalone === true) {
      // Android PWA / standalone: popup is blocked, must use redirect.
      // getRedirectResult() on login.html captures the credential.
      await signInWithRedirect(auth, provider);
      return null;
    }
    // Desktop browser: popup.
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
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

function isAdmin(user) {
  return user && user.email === ADMIN_EMAIL;
}

// ─── USER PROFILE ────────────────────────────────────────────
async function saveUserProfile(userId, profile) {
  try {
    await setDoc(doc(db, "users", userId, "data", "profile"), profile);
    // Write a stub to the top-level users/{uid} document so getDocs(collection(db,"users"))
    // can discover all users. Firestore subcollections don't create parent documents
    // automatically — without this stub, getAllUsers() always returns [].
    await setDoc(doc(db, "users", userId), { uid: userId, _exists: true }, { merge: true });
  } catch (error) {
    console.error("Error saving user profile:", error);
    throw error;
  }
}

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
async function saveDailyLog(userId, dateKey, log) {
  try {
    await setDoc(doc(db, "users", userId, "logs", dateKey), log);
  } catch (error) {
    console.error("Error saving daily log:", error);
    throw error;
  }
}

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
async function saveWorkoutCycle(userId, cycle) {
  try {
    await setDoc(doc(db, "users", userId, "data", "cycle"), cycle);
  } catch (error) {
    console.error("Error saving workout cycle:", error);
    throw error;
  }
}

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

async function assignCoach(uid, enabled) {
  try {
    const profileRef = doc(db, "users", uid, "data", "profile");
    await setDoc(profileRef, { coachEnabled: enabled }, { merge: true });
  } catch (error) {
    console.error("Error assigning coach:", error);
    throw error;
  }
}

async function setAdminStatus(uid, adminStatus) {
  try {
    const profileRef = doc(db, "users", uid, "data", "profile");
    await setDoc(profileRef, { isAdmin: adminStatus }, { merge: true });
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
    return ref.id;
  } catch (error) {
    console.error("Error promoting user recipe:", error);
    throw error;
  }
}

async function getAllUsers() {
  try {
    const usersSnap = await getDocs(collection(db, "users"));
    const users = [];
    for (const userDoc of usersSnap.docs) {
      const profileSnap = await getDoc(doc(db, "users", userDoc.id, "data", "profile"));
      if (profileSnap.exists()) {
        users.push({ uid: userDoc.id, ...profileSnap.data() });
      } else {
        // User exists in auth/Firestore but has no profile doc yet — still show them
        users.push({ uid: userDoc.id, name: "Unknown User", email: "" });
      }
    }
    return users;
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
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
  assignCoach,
  setAdminStatus,
  getAllUsers,
  getAllUserRecipes,
  promoteUserRecipe,
  markOnboardingDone,
};
