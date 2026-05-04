// IndexedDB for offline persistence
const DB_NAME = "FitDesiDB";
const DB_VERSION = 1;

// Open database
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Create stores
      if (!db.objectStoreNames.contains("recipes")) {
        db.createObjectStore("recipes", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("ingredients")) {
        db.createObjectStore("ingredients", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("userProfile")) {
        db.createObjectStore("userProfile", { keyPath: "userId" });
      }
      if (!db.objectStoreNames.contains("dailyLogs")) {
        db.createObjectStore("dailyLogs", { keyPath: "key" }); // key: userId_dateKey
      }
      if (!db.objectStoreNames.contains("workoutCycle")) {
        db.createObjectStore("workoutCycle", { keyPath: "userId" });
      }
    };
  });
}

// Generic store operations
async function getFromStore(storeName, key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], "readonly");
    const store = transaction.objectStore(storeName);
    const request = store.get(key);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

async function putInStore(storeName, data) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], "readwrite");
    const store = transaction.objectStore(storeName);
    const request = store.put(data);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

async function getAllFromStore(storeName) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], "readonly");
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

// Specific functions
async function cacheRecipes(recipes, cuisine) {
  // If a cuisine is specified, first remove any stale entries for that cuisine
  // so switching cuisines never leaves old mixed data behind.
  if (cuisine) {
    const all = await getAllFromStore("recipes");
    const stale = all.filter(r => (r._cuisine || "indian") === cuisine);
    if (stale.length > 0) {
      const db = await openDB();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(["recipes"], "readwrite");
        const store = tx.objectStore("recipes");
        stale.forEach(r => store.delete(r.id));
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
      });
    }
  }
  for (const recipe of recipes) {
    await putInStore("recipes", recipe);
  }
}

async function getCachedRecipes(cuisine) {
  const all = await getAllFromStore("recipes");
  if (!cuisine) return all;
  // Return only recipes that match the requested cuisine.
  // Fall back to "indian" for legacy cached entries that have no _cuisine tag.
  return all.filter(r => (r._cuisine || "indian") === cuisine);
}

async function cacheIngredients(ingredients) {
  for (const ingredient of ingredients) {
    await putInStore("ingredients", ingredient);
  }
}

async function getCachedIngredients() {
  return await getAllFromStore("ingredients");
}

async function cacheUserProfile(userId, profile) {
  await putInStore("userProfile", { userId, ...profile });
}

async function getCachedUserProfile(userId) {
  const data = await getFromStore("userProfile", userId);
  return data ? data : null;
}

async function cacheDailyLog(userId, dateKey, log) {
  await putInStore("dailyLogs", {
    key: `${userId}_${dateKey}`,
    userId,
    dateKey,
    log,
  });
}

async function getCachedDailyLog(userId, dateKey) {
  const data = await getFromStore("dailyLogs", `${userId}_${dateKey}`);
  return data ? data.log : null;
}

async function cacheWorkoutCycle(userId, cycle) {
  await putInStore("workoutCycle", { userId, ...cycle });
}

async function getCachedWorkoutCycle(userId) {
  const data = await getFromStore("workoutCycle", userId);
  return data ? data : null;
}

// Sync functions - attempt to sync cached data to Firebase when online
async function syncToFirebase() {
  if (!navigator.onLine) return;

  try {
    // Import Firebase functions dynamically
    const {
      saveRecipe,
      saveIngredient,
      saveUserProfile,
      saveDailyLog,
      saveWorkoutCycle,
    } = await import("./firebase.js");

    // Sync recipes — preserve each recipe's cuisine so it goes to the right collection
    const cachedRecipes = await getCachedRecipes();
    for (const recipe of cachedRecipes) {
      try {
        const cuisineForSync = recipe._cuisine || recipe.cuisine || "indian";
        await saveRecipe(recipe, cuisineForSync);
      } catch (e) {
        console.error("Failed to sync recipe:", e);
      }
    }

    // Sync ingredients
    const cachedIngredients = await getCachedIngredients();
    for (const ingredient of cachedIngredients) {
      try {
        await saveIngredient(ingredient);
      } catch (e) {
        console.error("Failed to sync ingredient:", e);
      }
    }

    // Note: User data sync would need user auth context
    console.log("Offline data synced to Firebase");
  } catch (e) {
    console.error("Sync failed:", e);
  }
}

// Listen for online event to sync
if (typeof window !== "undefined") {
  window.addEventListener("online", syncToFirebase);
}

export {
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
  syncToFirebase,
};
