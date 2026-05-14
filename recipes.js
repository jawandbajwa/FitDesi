import {
  auth,
  onAuthStateChanged,
  getRecipes,
  saveDailyLog,
  getDailyLog,
  getUserRecipes,
  saveUserRecipe,
  deleteUserRecipe,
  getIngredients,
} from "./firebase.js";

let currentUser = null;
let allRecipes   = [];   // app recipes (indian / canadian)
let myRecipes    = [];   // user's own recipes
let activeCategory = "all";
let activeCuisine  = "indian";
let searchQuery    = "";
let currentRecipe  = null;
let selectedMeal   = "";

// User recipe form state
let editingUserRecipeId  = null;
let myRecipeCategory     = "";
let myRecipeBuilderIngs  = [];  // { id, name, amount, protein, carbs, fat, calories }
let dbIngredients        = [];  // all ingredients from shared collection
let pendingIngredient    = null;
let recipeToDelete       = null;

// ─── TOAST ────────────────────────────────────────────────────────────
function showToast(msg) {
  let el = document.getElementById("appToast");
  if (!el) {
    el = document.createElement("div");
    el.id = "appToast";
    el.className = "toast";
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 2500);
}

// ─── EMOJI MAPPING ────────────────────────────────────────────────────
function getRecipeEmoji(name, category) {
  const n = (name || "").toLowerCase();
  if (n.includes("paneer")) return "🧀";
  if (n.includes("dal") || n.includes("daal")) return "🍲";
  if (n.includes("rice") || n.includes("khichdi")) return "🍚";
  if (n.includes("roti") || n.includes("paratha") || n.includes("thepla")) return "🫓";
  if (n.includes("oat") || n.includes("porridge")) return "🥣";
  if (n.includes("pancake") || n.includes("chilla")) return "🥞";
  if (n.includes("smoothie") || n.includes("shake") || n.includes("lassi")) return "🥤";
  if (n.includes("salad") || n.includes("sprout")) return "🥗";
  if (n.includes("chana") || n.includes("chickpea") || n.includes("rajma") || n.includes("bean")) return "🫘";
  if (n.includes("soup") || n.includes("lentil")) return "🍜";
  if (n.includes("tofu")) return "🫕";
  if (n.includes("toast") || n.includes("bread") || n.includes("sandwich")) return "🍞";
  if (n.includes("wrap") || n.includes("burrito") || n.includes("taco")) return "🌯";
  if (n.includes("bowl")) return "🥗";
  if (n.includes("yogurt") || n.includes("curd") || n.includes("cottage")) return "🫙";
  if (n.includes("curry")) return "🍛";
  if (n.includes("pasta") || n.includes("bolognese")) return "🍝";
  if (n.includes("hummus")) return "🥙";
  if (n.includes("nut") || n.includes("almond") || n.includes("walnut")) return "🥜";
  if (n.includes("protein") || n.includes("whey")) return "💪";
  if (n.includes("avocado")) return "🥑";
  if (n.includes("stir fry")) return "🥘";
  if (n.includes("chili")) return "🌶️";
  const catEmojis = { breakfast: "🌅", lunch: "☀️", dinner: "🌙", snack: "🍎" };
  return catEmojis[category] || "🍛";
}

// ─── RENDER RECIPE LIST ───────────────────────────────────────────────
function renderRecipes() {
  const list   = document.getElementById("recipeList");
  const source = activeCuisine === "mine" ? myRecipes : allRecipes;

  let filtered = source.filter((r) => {
    if (activeCuisine !== "mine") {
      if (r._cuisine && r._cuisine !== activeCuisine) return false;
    }
    const catMatch    = activeCategory === "all" || r.category === activeCategory;
    const searchMatch = (r.name || "").toLowerCase().includes(searchQuery.toLowerCase());
    return catMatch && searchMatch;
  });

  if (filtered.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">${activeCuisine === "mine" ? "📖" : "🍛"}</div>
        <div class="empty-title">${activeCuisine === "mine" ? "No personal recipes yet" : "No recipes found"}</div>
        <div class="empty-desc">${activeCuisine === "mine" ? 'Tap "+ Add Recipe" to create your first one' : "Try a different category or cuisine"}</div>
      </div>`;
    return;
  }

  list.innerHTML = filtered.map((r) => `
    <div class="recipe-item" data-id="${r.id}">
      <div class="recipe-emoji">${getRecipeEmoji(r.name, r.category)}</div>
      <div class="recipe-content">
        <div class="recipe-name">${r.name}</div>
        <div class="recipe-macros">
          <div class="recipe-macro">P <span>${r.protein}g</span></div>
          <div class="recipe-macro">C <span>${r.carbs}g</span></div>
          <div class="recipe-macro">F <span>${r.fat}g</span></div>
          <div class="recipe-macro">Cal <span>${r.calories}</span></div>
        </div>
      </div>
      ${r._isUserRecipe
        ? '<div class="ur-badge">My Recipe</div>'
        : `<div class="recipe-cat-tag">${r.category}</div>`}
      <div class="recipe-arrow">→</div>
    </div>
  `).join("");
}

// ─── OPEN DETAIL ─────────────────────────────────────────────────────
function openDetail(recipe) {
  currentRecipe = recipe;
  document.getElementById("detailPanel").classList.remove("hidden");
  document.getElementById("detailIcon").textContent = getRecipeEmoji(recipe.name, recipe.category);
  document.getElementById("detailName").textContent  = recipe.name;

  const cuisineLabel = recipe._isUserRecipe
    ? "📖 My Recipe"
    : activeCuisine === "canadian"
      ? "🇨🇦 Canadian"
      : "🇮🇳 Indian";
  document.getElementById("detailMeta").textContent =
    `${recipe.category} · ${recipe.servingSize || recipe.serving || "1 serving"} · ${cuisineLabel}`;

  document.getElementById("detailMacros").innerHTML = `
    <div class="macro-card"><div class="macro-val">${recipe.protein}g</div><div class="macro-lbl">Protein</div></div>
    <div class="macro-card"><div class="macro-val">${recipe.carbs}g</div><div class="macro-lbl">Carbs</div></div>
    <div class="macro-card"><div class="macro-val">${recipe.fat}g</div><div class="macro-lbl">Fat</div></div>
    <div class="macro-card"><div class="macro-val">${recipe.calories}</div><div class="macro-lbl">Cal</div></div>`;

  const ingredients = recipe.ingredients || [];
  document.getElementById("detailIngredients").innerHTML = ingredients.length > 0
    ? ingredients.map((ing) => `
        <div class="ingredient-row">
          <span class="ingredient-name">${ing.name}</span>
          <span class="ingredient-amount">${ing.amount}${ing.unit || "g"}</span>
        </div>`).join("")
    : '<div style="color:rgba(255,255,255,0.2);font-size:12px;padding:8px 0">No ingredients listed</div>';

  const instructions = recipe.instructions || [];
  const instructionsEl    = document.getElementById("detailInstructions");
  const instructionsLabel = document.getElementById("instructionsLabel");
  if (instructions.length > 0) {
    instructionsLabel.style.display = "block";
    instructionsEl.innerHTML = instructions.map((step, i) => `
      <div class="instruction-step">
        <div class="step-number">${i + 1}</div>
        <div class="step-text">${step}</div>
      </div>`).join("");
  } else {
    instructionsLabel.style.display = "none";
    instructionsEl.innerHTML = "";
  }

  // Notes (user recipes)
  const notesLabel = document.getElementById("notesLabel");
  const notesEl    = document.getElementById("detailNotes");
  if (recipe.notes) {
    notesLabel.style.display = "block";
    notesEl.textContent = recipe.notes;
  } else {
    notesLabel.style.display = "none";
    notesEl.textContent = "";
  }

  const videoEl    = document.getElementById("detailVideo");
  const videoLabel = document.getElementById("videoLabel");
  if (recipe.videoId) {
    videoLabel.style.display = "block";
    videoEl.innerHTML = `<iframe src="https://www.youtube.com/embed/${recipe.videoId}?rel=0&modestbranding=1" allowfullscreen loading="lazy"></iframe>`;
  } else {
    videoLabel.style.display = "none";
    videoEl.innerHTML = "";
  }

  // Show edit/delete only for user's own recipes
  const actions = document.getElementById("userRecipeDetailActions");
  if (recipe._isUserRecipe) {
    actions.classList.remove("hidden");
  } else {
    actions.classList.add("hidden");
  }

  window.scrollTo(0, 0);
}

// ─── MEAL SELECTOR ────────────────────────────────────────────────────
function openMealSelector(recipe) {
  selectedMeal = recipe.category === "snack" ? "snack" : recipe.category;
  document.getElementById("mealSelectorRecipeName").textContent = recipe.name;
  document.getElementById("mealSelectorModal").classList.add("open");
  document.querySelectorAll(".meal-sel-btn").forEach((btn) => {
    btn.classList.toggle("selected", btn.dataset.meal === selectedMeal);
  });
}

async function addRecipeToMeal(meal) {
  if (!currentUser || !currentRecipe) return;
  const dateKey = new Date().toDateString();
  const log = await getDailyLog(currentUser.uid, dateKey);
  if (!log[meal]) log[meal] = [];
  log[meal].push({
    name:     currentRecipe.name,
    protein:  currentRecipe.protein  || 0,
    carbs:    currentRecipe.carbs    || 0,
    fat:      currentRecipe.fat      || 0,
    calories: currentRecipe.calories || 0,
  });
  await saveDailyLog(currentUser.uid, dateKey, log);
  document.getElementById("mealSelectorModal").classList.remove("open");
  showToast(`✓ ${currentRecipe.name} added to ${meal}`);
}

// ─── LOAD RECIPES ─────────────────────────────────────────────────────
async function loadRecipes(cuisine) {
  if (cuisine === "mine") {
    if (!currentUser) { renderRecipes(); return; }
    myRecipes = await getUserRecipes(currentUser.uid);
    renderRecipes();
    return;
  }
  allRecipes = await getRecipes(cuisine);
  renderRecipes();
}

// ─── INGREDIENT BUILDER ───────────────────────────────────────────────
async function ensureDbIngredients() {
  if (dbIngredients.length > 0) return;
  const ings = await getIngredients();
  dbIngredients = ings;
}

function filterIngredients(query) {
  const results = document.getElementById("urIngResults");
  if (!results) return;
  if (!query.trim()) { results.classList.remove("open"); return; }
  const q       = query.toLowerCase();
  const matches = dbIngredients.filter((ing) => (ing.name || "").toLowerCase().includes(q)).slice(0, 8);
  if (matches.length === 0) { results.classList.remove("open"); return; }
  // Use ingredient name as the data key — more reliable than id since older
  // Firestore documents may not have id stored inside the document data.
  results.innerHTML = matches.map((ing) => `
    <div class="ur-ing-result-item" data-name="${encodeURIComponent(ing.name)}">
      <span>${ing.name}</span>
      <span class="ur-ing-result-macros">P:${ing.protein}g C:${ing.carbs}g F:${ing.fat}g / 100g</span>
    </div>`).join("");
  results.classList.add("open");
}

function selectIngredientFromSearch(ing) {
  pendingIngredient = ing;
  document.getElementById("urIngResults").classList.remove("open");
  document.getElementById("urIngSearch").value = "";
  document.getElementById("urAmountName").textContent = ing.name;
  document.getElementById("urAmountInput").value = "100";
  document.getElementById("urAmountRow").classList.remove("hidden");
  document.getElementById("urAmountInput")?.focus();
}

function addPendingIngredient() {
  if (!pendingIngredient) return;
  const amount = parseFloat(document.getElementById("urAmountInput").value) || 0;
  if (amount <= 0) { showToast("Enter a valid amount"); return; }
  const ratio = amount / 100;
  myRecipeBuilderIngs.push({
    id:       pendingIngredient.id,
    name:     pendingIngredient.name,
    amount,
    protein:  (pendingIngredient.protein  || 0) * ratio,
    carbs:    (pendingIngredient.carbs    || 0) * ratio,
    fat:      (pendingIngredient.fat      || 0) * ratio,
    calories: (pendingIngredient.calories || 0) * ratio,
  });
  pendingIngredient = null;
  document.getElementById("urAmountRow").classList.add("hidden");
  document.getElementById("urAmountInput").value = "";
  renderAddedIngredients();
  recalcMacrosFromBuilder();
}

function cancelPendingIngredient() {
  pendingIngredient = null;
  document.getElementById("urAmountRow").classList.add("hidden");
  document.getElementById("urAmountInput").value = "";
}

function removeBuilderIngredient(idx) {
  myRecipeBuilderIngs.splice(idx, 1);
  renderAddedIngredients();
  recalcMacrosFromBuilder();
}

function renderAddedIngredients() {
  const list = document.getElementById("urAddedList");
  if (myRecipeBuilderIngs.length === 0) { list.innerHTML = ""; return; }
  list.innerHTML = myRecipeBuilderIngs.map((ing, i) => `
    <div class="ur-added-item">
      <span class="ur-added-name">${ing.name} (${ing.amount}g)</span>
      <span class="ur-added-macros">P:${Math.round(ing.protein)}g C:${Math.round(ing.carbs)}g F:${Math.round(ing.fat)}g</span>
      <button class="ur-added-remove" data-idx="${i}">✕</button>
    </div>`).join("");
}

function recalcMacrosFromBuilder() {
  let p = 0, c = 0, f = 0, cal = 0;
  myRecipeBuilderIngs.forEach((ing) => {
    p   += ing.protein;
    c   += ing.carbs;
    f   += ing.fat;
    cal += ing.calories;
  });
  document.getElementById("urProtein").value  = Math.round(p   * 10) / 10;
  document.getElementById("urCarbs").value    = Math.round(c   * 10) / 10;
  document.getElementById("urFat").value      = Math.round(f   * 10) / 10;
  document.getElementById("urCalories").value = Math.round(cal);
}

// ─── USER RECIPE MODAL ────────────────────────────────────────────────
function openUserRecipeModal(recipe = null) {
  editingUserRecipeId = recipe ? recipe.id : null;
  myRecipeCategory    = recipe ? recipe.category : "";
  myRecipeBuilderIngs = [];
  pendingIngredient   = null;

  document.getElementById("urModalTitle").textContent = recipe ? "Edit Recipe" : "New Recipe";
  document.getElementById("urName").value      = recipe ? recipe.name                                   : "";
  document.getElementById("urServing").value   = recipe ? (recipe.servingSize || recipe.serving || "") : "";
  document.getElementById("urProtein").value   = recipe ? recipe.protein  : "";
  document.getElementById("urCarbs").value     = recipe ? recipe.carbs    : "";
  document.getElementById("urFat").value       = recipe ? recipe.fat      : "";
  document.getElementById("urCalories").value  = recipe ? recipe.calories : "";
  document.getElementById("urNotes").value     = recipe ? (recipe.notes   || "") : "";
  document.getElementById("urVideoId").value   = recipe ? (recipe.videoId || "") : "";
  document.getElementById("urIngSearch").value = "";
  document.getElementById("urIngResults").classList.remove("open");
  document.getElementById("urAmountRow").classList.add("hidden");
  renderAddedIngredients();

  document.querySelectorAll(".ur-cat-pill").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.cat === myRecipeCategory);
  });

  document.getElementById("userRecipeModal").classList.add("open");
}

function closeUserRecipeModal() {
  document.getElementById("userRecipeModal").classList.remove("open");
  editingUserRecipeId = null;
  myRecipeCategory    = "";
  myRecipeBuilderIngs = [];
  pendingIngredient   = null;
}

async function saveUserRecipeForm() {
  const name = document.getElementById("urName").value.trim();
  if (!name)             { showToast("Recipe name is required"); return; }
  if (!myRecipeCategory) { showToast("Please select a category"); return; }

  const protein  = parseFloat(document.getElementById("urProtein").value)  || 0;
  const carbs    = parseFloat(document.getElementById("urCarbs").value)    || 0;
  const fat      = parseFloat(document.getElementById("urFat").value)      || 0;
  const calories = parseInt(document.getElementById("urCalories").value)   || 0;
  if (!protein && !calories) { showToast("Please enter at least protein or calories"); return; }

  const recipe = {
    name,
    category:    myRecipeCategory,
    servingSize: document.getElementById("urServing").value.trim() || "1 serving",
    protein,
    carbs,
    fat,
    calories,
    notes:   document.getElementById("urNotes").value.trim(),
    videoId: document.getElementById("urVideoId").value.trim(),
    ingredients: myRecipeBuilderIngs.map((ing) => ({
      name:   ing.name,
      amount: ing.amount,
      unit:   "g",
    })),
  };

  if (editingUserRecipeId) recipe.id = editingUserRecipeId;

  const btn = document.getElementById("urSaveBtn");
  btn.textContent = "Saving…";
  btn.disabled    = true;
  try {
    await saveUserRecipe(currentUser.uid, recipe);
    myRecipes = await getUserRecipes(currentUser.uid);
    renderRecipes();
    closeUserRecipeModal();
    showToast(editingUserRecipeId ? "✓ Recipe updated" : "✓ Recipe saved");
  } catch (err) {
    console.error(err);
    showToast("Error saving recipe");
  } finally {
    btn.textContent = "Save Recipe";
    btn.disabled    = false;
  }
}

// ─── DELETE MODAL ─────────────────────────────────────────────────────
function openDeleteModal(recipe) {
  recipeToDelete = recipe;
  document.getElementById("urDeleteName").textContent =
    `"${recipe.name}" will be permanently deleted.`;
  document.getElementById("urDeleteModal").classList.add("open");
}

async function confirmDeleteRecipe() {
  if (!recipeToDelete || !currentUser) return;
  const btn = document.getElementById("urConfirmDelete");
  btn.textContent = "Deleting…";
  btn.disabled    = true;
  try {
    await deleteUserRecipe(currentUser.uid, recipeToDelete.id);
    myRecipes = myRecipes.filter((r) => r.id !== recipeToDelete.id);
    document.getElementById("urDeleteModal").classList.remove("open");
    document.getElementById("detailPanel").classList.add("hidden");
    currentRecipe  = null;
    recipeToDelete = null;
    renderRecipes();
    showToast("✓ Recipe deleted");
  } catch (err) {
    console.error(err);
    showToast("Error deleting recipe");
  } finally {
    btn.textContent = "Delete";
    btn.disabled    = false;
  }
}

// ─── EVENT DELEGATION ─────────────────────────────────────────────────
document.addEventListener("click", async function (e) {

  // ── Cuisine toggle ──────────────────────────────────────────────────
  const cuisineBtn = e.target.closest(".cuisine-btn");
  if (cuisineBtn && cuisineBtn.dataset.cuisine) {
    document.querySelectorAll(".cuisine-btn").forEach((b) => b.classList.remove("active"));
    cuisineBtn.classList.add("active");
    activeCuisine = cuisineBtn.dataset.cuisine;
    activeCategory = "all";
    document.querySelectorAll(".cat-btn").forEach((b) => b.classList.remove("active"));
    const allCat = document.querySelector('.cat-btn[data-cat="all"]');
    if (allCat) allCat.classList.add("active");

    const addBtn = document.getElementById("addMyRecipeBtn");
    if (activeCuisine === "mine") {
      addBtn.classList.remove("hidden");
      ensureDbIngredients(); // pre-load in background
    } else {
      addBtn.classList.add("hidden");
      allRecipes = [];
    }
    await loadRecipes(activeCuisine);
    return;
  }

  // ── Category filter ─────────────────────────────────────────────────
  const catBtn = e.target.closest(".cat-btn");
  if (catBtn && catBtn.dataset.cat) {
    document.querySelectorAll(".cat-btn").forEach((b) => b.classList.remove("active"));
    catBtn.classList.add("active");
    activeCategory = catBtn.dataset.cat;
    renderRecipes();
    return;
  }

  // ── Recipe item ─────────────────────────────────────────────────────
  const recipeItem = e.target.closest(".recipe-item");
  if (recipeItem) {
    const source = activeCuisine === "mine" ? myRecipes : allRecipes;
    const recipe = source.find((r) => r.id === recipeItem.dataset.id);
    if (recipe) openDetail(recipe);
    return;
  }

  // ── Detail back ─────────────────────────────────────────────────────
  if (e.target.closest("#detailBack")) {
    document.getElementById("detailPanel").classList.add("hidden");
    currentRecipe = null;
    return;
  }

  // ── Add to meal button ───────────────────────────────────────────────
  if (e.target.id === "addToMealBtn") {
    if (currentRecipe) openMealSelector(currentRecipe);
    return;
  }

  // ── Meal selector choice ─────────────────────────────────────────────
  const mealSelBtn = e.target.closest(".meal-sel-btn");
  if (mealSelBtn) {
    document.querySelectorAll(".meal-sel-btn").forEach((b) => b.classList.remove("selected"));
    mealSelBtn.classList.add("selected");
    selectedMeal = mealSelBtn.dataset.meal;
    return;
  }

  // ── Confirm add to meal ──────────────────────────────────────────────
  if (e.target.id === "confirmAddMeal") {
    if (selectedMeal) await addRecipeToMeal(selectedMeal);
    return;
  }

  // ── Close meal selector ──────────────────────────────────────────────
  if (e.target.id === "mealSelectorClose") {
    document.getElementById("mealSelectorModal").classList.remove("open");
    return;
  }

  // ── Add My Recipe button ─────────────────────────────────────────────
  if (e.target.id === "addMyRecipeBtn") {
    await ensureDbIngredients();
    openUserRecipeModal();
    return;
  }

  // ── Close user recipe modal ──────────────────────────────────────────
  if (e.target.id === "urModalClose") {
    closeUserRecipeModal();
    return;
  }

  // ── Save user recipe ─────────────────────────────────────────────────
  if (e.target.id === "urSaveBtn") {
    await saveUserRecipeForm();
    return;
  }

  // ── User recipe category pills ───────────────────────────────────────
  const urPill = e.target.closest(".ur-cat-pill");
  if (urPill && urPill.dataset.cat) {
    myRecipeCategory = urPill.dataset.cat;
    document.querySelectorAll(".ur-cat-pill").forEach((p) => p.classList.remove("active"));
    urPill.classList.add("active");
    return;
  }

  // ── User recipe detail: Edit ─────────────────────────────────────────
  if (e.target.id === "detailEditBtn") {
    await ensureDbIngredients();
    openUserRecipeModal(currentRecipe);
    return;
  }

  // ── User recipe detail: Delete ───────────────────────────────────────
  if (e.target.id === "detailDeleteBtn") {
    openDeleteModal(currentRecipe);
    return;
  }

  // ── Confirm delete ───────────────────────────────────────────────────
  if (e.target.id === "urConfirmDelete") {
    await confirmDeleteRecipe();
    return;
  }

  // ── Cancel / close delete modal ──────────────────────────────────────
  if (e.target.id === "urCancelDelete" || e.target.id === "urDeleteClose") {
    document.getElementById("urDeleteModal").classList.remove("open");
    recipeToDelete = null;
    return;
  }

  // ── Ingredient search result click ───────────────────────────────────
  const ingResultItem = e.target.closest(".ur-ing-result-item");
  if (ingResultItem) {
    const decodedName = decodeURIComponent(ingResultItem.dataset.name || "");
    const ing = dbIngredients.find((i) => i.name === decodedName);
    if (ing) selectIngredientFromSearch(ing);
    return;
  }

  // ── Add pending ingredient ───────────────────────────────────────────
  if (e.target.id === "urAmountAdd") {
    addPendingIngredient();
    return;
  }

  // ── Cancel pending ingredient ─────────────────────────────────────────
  if (e.target.id === "urAmountCancel") {
    cancelPendingIngredient();
    return;
  }

  // ── Remove added ingredient ───────────────────────────────────────────
  const removeBtn = e.target.closest(".ur-added-remove");
  if (removeBtn) {
    const idx = parseInt(removeBtn.dataset.idx, 10);
    if (!isNaN(idx)) removeBuilderIngredient(idx);
    return;
  }
});

// ─── INGREDIENT SEARCH INPUT ──────────────────────────────────────────
// Use optional chaining so the module doesn't crash if the modal doesn't
// exist yet (e.g. old HTML served from SW cache during update transition).
document.getElementById("urIngSearch")?.addEventListener("input", (e) => {
  filterIngredients(e.target.value);
});

// Allow Enter key to confirm ingredient amount
document.getElementById("urAmountInput")?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") { e.preventDefault(); addPendingIngredient(); }
});

// ─── RECIPE SEARCH ────────────────────────────────────────────────────
document.getElementById("recipeSearch").addEventListener("input", (e) => {
  searchQuery = e.target.value;
  renderRecipes();
});

// ─── INIT ─────────────────────────────────────────────────────────────
document.getElementById("currentDate").textContent = new Date().toLocaleDateString("en-US", {
  weekday: "short",
  day:     "numeric",
  month:   "short",
});

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  currentUser = user;
  await loadRecipes(activeCuisine);
});
