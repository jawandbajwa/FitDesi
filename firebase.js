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
  await setDoc(doc(db, "users", userId, "data", "profile"), profile);
}

async function getUserProfile(userId) {
  const snap = await getDoc(doc(db, "users", userId, "data", "profile"));
  return snap.exists() ? snap.data() : null;
}

// ─── DAILY LOGS ──────────────────────────────────────────────
async function saveDailyLog(userId, dateKey, log) {
  await setDoc(doc(db, "users", userId, "logs", dateKey), log);
}

async function getDailyLog(userId, dateKey) {
  const snap = await getDoc(doc(db, "users", userId, "logs", dateKey));
  return snap.exists()
    ? snap.data()
    : { breakfast: [], lunch: [], snack: [], dinner: [] };
}

// ─── USER SPLIT ──────────────────────────────────────────────
async function saveUserSplit(userId, split) {
  await setDoc(doc(db, "users", userId, "data", "split"), split);
}

async function getUserSplit(userId) {
  const snap = await getDoc(doc(db, "users", userId, "data", "split"));
  return snap.exists() ? snap.data() : null;
}

// ─── RECIPES (Indian + Canadian) ─────────────────────────────
// cuisine param: 'indian' (default) or 'canadian'

async function saveRecipe(recipe, cuisine = "indian") {
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
}

async function getRecipes(cuisine = "indian") {
  const col = cuisine === "canadian" ? "recipes_canadian" : "recipes_indian";
  const snap = await getDocs(collection(db, "shared", col, "items"));
  return snap.docs.map((d) => d.data());
}

async function deleteRecipe(id, cuisine = "indian") {
  const col = cuisine === "canadian" ? "recipes_canadian" : "recipes_indian";
  await deleteDoc(doc(db, "shared", col, "items", id));
}

// ─── INGREDIENTS ─────────────────────────────────────────────
async function saveIngredient(ingredient) {
  if (ingredient.id) {
    const ref = doc(db, "shared", "ingredients", "items", ingredient.id);
    await setDoc(ref, ingredient);
    return ingredient.id;
  } else {
    const ref = doc(collection(db, "shared", "ingredients", "items"));
    await setDoc(ref, { ...ingredient, id: ref.id });
    return ref.id;
  }
}

async function getIngredients() {
  const snap = await getDocs(collection(db, "shared", "ingredients", "items"));
  return snap.docs.map((d) => d.data());
}

async function deleteIngredient(ingredientId) {
  await deleteDoc(doc(db, "shared", "ingredients", "items", ingredientId));
}

// ─── NOTIFICATION TIMES ──────────────────────────────────────
async function saveNotifTimes(userId, times) {
  await setDoc(doc(db, "users", userId, "data", "notifications"), times);
}

async function getNotifTimes(userId) {
  const snap = await getDoc(doc(db, "users", userId, "data", "notifications"));
  return snap.exists()
    ? snap.data()
    : { breakfast: "08:00", lunch: "13:00", dinner: "20:00" };
}

// ─── WORKOUT CYCLE ───────────────────────────────────────────
async function saveWorkoutCycle(userId, cycle) {
  await setDoc(doc(db, "users", userId, "data", "cycle"), cycle);
}

async function getWorkoutCycle(userId) {
  const snap = await getDoc(doc(db, "users", userId, "data", "cycle"));
  return snap.exists() ? snap.data() : null;
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
};
