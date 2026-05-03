// ─── FIREBASE CONFIGURATION ──────────────────────────────────
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
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

// ─── ADMIN EMAIL ─────────────────────────────────────────────
const ADMIN_EMAIL = "jawandbajwa@gmail.com"; // Replace with your actual Gmail

// ─── AUTH FUNCTIONS ──────────────────────────────────────────
async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("Sign in error:", error);
    throw error;
  }
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
  } catch (error) {
    console.error("Error saving user profile:", error);
    throw error;
  }
}

async function getUserProfile(userId) {
  try {
    if (navigator.onLine) {
      const snap = await getDoc(doc(db, "users", userId, "data", "profile"));
      const profile = snap.exists() ? snap.data() : null;
      if (profile) await cacheUserProfile(userId, profile);
      return profile;
    } else {
      return await getCachedUserProfile(userId);
    }
  } catch (error) {
    console.error("Error getting user profile:", error);
    try {
      return await getCachedUserProfile(userId);
    } catch (cacheError) {
      console.error("Cache error:", cacheError);
      throw error;
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
  try {
    if (navigator.onLine) {
      const snap = await getDoc(doc(db, "users", userId, "logs", dateKey));
      const log = snap.exists()
        ? snap.data()
        : { breakfast: [], lunch: [], snack: [], dinner: [] };
      await cacheDailyLog(userId, dateKey, log);
      return log;
    } else {
      const cached = await getCachedDailyLog(userId, dateKey);
      return cached || { breakfast: [], lunch: [], snack: [], dinner: [] };
    }
  } catch (error) {
    console.error("Error getting daily log:", error);
    try {
      const cached = await getCachedDailyLog(userId, dateKey);
      return cached || { breakfast: [], lunch: [], snack: [], dinner: [] };
    } catch (cacheError) {
      console.error("Cache error:", cacheError);
      throw error;
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
    // Try Firebase first if online
    if (navigator.onLine) {
      const col =
        cuisine === "canadian" ? "recipes_canadian" : "recipes_indian";
      const snap = await getDocs(collection(db, "shared", col, "items"));
      const recipes = snap.docs.map((d) => d.data());
      // Cache for offline
      await cacheRecipes(recipes);
      return recipes;
    } else {
      // Offline: use cached data
      return await getCachedRecipes();
    }
  } catch (error) {
    console.error("Error getting recipes:", error);
    // Fallback to cache
    try {
      return await getCachedRecipes();
    } catch (cacheError) {
      console.error("Cache error:", cacheError);
      throw error;
    }
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
    if (navigator.onLine) {
      const snap = await getDocs(
        collection(db, "shared", "ingredients", "items"),
      );
      const ingredients = snap.docs.map((d) => d.data());
      await cacheIngredients(ingredients);
      return ingredients;
    } else {
      return await getCachedIngredients();
    }
  } catch (error) {
    console.error("Error getting ingredients:", error);
    try {
      return await getCachedIngredients();
    } catch (cacheError) {
      console.error("Cache error:", cacheError);
      throw error;
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
    if (navigator.onLine) {
      const snap = await getDoc(doc(db, "users", userId, "data", "cycle"));
      const cycle = snap.exists() ? snap.data() : null;
      if (cycle) await cacheWorkoutCycle(userId, cycle);
      return cycle;
    } else {
      return await getCachedWorkoutCycle(userId);
    }
  } catch (error) {
    console.error("Error getting workout cycle:", error);
    try {
      return await getCachedWorkoutCycle(userId);
    } catch (cacheError) {
      console.error("Cache error:", cacheError);
      throw error;
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

// ─── EXPORT ──────────────────────────────────────────────────
export {
  auth,
  db,
  provider,
  ADMIN_EMAIL,
  onAuthStateChanged,
  signInWithGoogle,
  signOutUser,
  isAdmin,
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
};
