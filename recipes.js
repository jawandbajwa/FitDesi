import {
  auth,
  onAuthStateChanged,
  getRecipes,
  saveDailyLog,
  getDailyLog,
} from "./firebase.js";

let currentUser = null;
let allRecipes = [];
let activeCategory = "all";
let activeCuisine = "indian";
let searchQuery = "";
let currentRecipe = null;
let selectedMeal = "";

// ─── TOAST ───────────────────────────────────────────────────
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

// ─── EMOJI MAPPING ───────────────────────────────────────────
function getRecipeEmoji(name, category) {
  const n = name.toLowerCase();
  if (n.includes("paneer")) return "🧀";
  if (n.includes("dal") || n.includes("daal")) return "🍲";
  if (n.includes("rice") || n.includes("khichdi")) return "🍚";
  if (n.includes("roti") || n.includes("paratha") || n.includes("thepla"))
    return "🫓";
  if (n.includes("oat") || n.includes("porridge")) return "🥣";
  if (n.includes("pancake") || n.includes("chilla")) return "🥞";
  if (n.includes("smoothie") || n.includes("shake") || n.includes("lassi"))
    return "🥤";
  if (n.includes("salad") || n.includes("sprout")) return "🥗";
  if (
    n.includes("chana") ||
    n.includes("chickpea") ||
    n.includes("rajma") ||
    n.includes("bean")
  )
    return "🫘";
  if (n.includes("soup") || n.includes("lentil")) return "🍜";
  if (n.includes("tofu")) return "🫕";
  if (n.includes("toast") || n.includes("bread") || n.includes("sandwich"))
    return "🍞";
  if (n.includes("wrap") || n.includes("burrito") || n.includes("taco"))
    return "🌯";
  if (n.includes("bowl")) return "🥗";
  if (n.includes("yogurt") || n.includes("curd") || n.includes("cottage"))
    return "🫙";
  if (n.includes("curry")) return "🍛";
  if (n.includes("pasta") || n.includes("bolognese")) return "🍝";
  if (n.includes("hummus")) return "🥙";
  if (n.includes("nut") || n.includes("almond") || n.includes("walnut"))
    return "🥜";
  if (n.includes("protein") || n.includes("whey")) return "💪";
  if (n.includes("avocado")) return "🥑";
  if (n.includes("stir fry")) return "🥘";
  if (n.includes("chili")) return "🌶️";
  const catEmojis = { breakfast: "🌅", lunch: "☀️", dinner: "🌙", snack: "🍎" };
  return catEmojis[category] || "🍛";
}

// ─── RENDER RECIPE LIST ──────────────────────────────────────
function renderRecipes() {
  const list = document.getElementById("recipeList");
  const empty = document.getElementById("emptyState");

  let filtered = allRecipes.filter((r) => {
    const catMatch = activeCategory === "all" || r.category === activeCategory;
    const searchMatch = r.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return catMatch && searchMatch;
  });

  if (filtered.length === 0) {
    list.innerHTML = `
        <div class="empty-state">
            <div class="empty-icon">🍛</div>
            <div class="empty-title">No recipes found</div>
            <div class="empty-desc">Try a different category or cuisine</div>
        </div>
    `;
    return;
  }
  list.innerHTML = filtered
    .map(
      (r) => `
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
            <div class="recipe-cat-tag">${r.category}</div>
            <div class="recipe-arrow">→</div>
        </div>
    `,
    )
    .join("");
}

// ─── OPEN DETAIL ─────────────────────────────────────────────
function openDetail(recipe) {
  currentRecipe = recipe;
  document.getElementById("detailPanel").classList.remove("hidden");
  document.getElementById("detailIcon").textContent = getRecipeEmoji(
    recipe.name,
    recipe.category,
  );
  document.getElementById("detailName").textContent = recipe.name;
  document.getElementById("detailMeta").textContent =
    `${recipe.category} · ${recipe.servingSize || "1 serving"} · ${recipe.prepTime || ""} · ${activeCuisine === "canadian" ? "🇨🇦 Canadian" : "🇮🇳 Indian"}`;

  document.getElementById("detailMacros").innerHTML = `
        <div class="macro-card">
            <div class="macro-val">${recipe.protein}g</div>
            <div class="macro-lbl">Protein</div>
        </div>
        <div class="macro-card">
            <div class="macro-val">${recipe.carbs}g</div>
            <div class="macro-lbl">Carbs</div>
        </div>
        <div class="macro-card">
            <div class="macro-val">${recipe.fat}g</div>
            <div class="macro-lbl">Fat</div>
        </div>
        <div class="macro-card">
            <div class="macro-val">${recipe.calories}</div>
            <div class="macro-lbl">Cal</div>
        </div>
    `;

  const ingredients = recipe.ingredients || [];
  document.getElementById("detailIngredients").innerHTML =
    ingredients.length > 0
      ? ingredients
          .map(
            (ing) => `
            <div class="ingredient-row">
                <span class="ingredient-name">${ing.name}</span>
                <span class="ingredient-amount">${ing.amount}${ing.unit || "g"}</span>
            </div>
        `,
          )
          .join("")
      : '<div style="color:rgba(255,255,255,0.2);font-size:12px;padding:8px 0">No ingredients listed</div>';

  const instructions = recipe.instructions || [];
  const instructionsEl = document.getElementById("detailInstructions");
  const instructionsLabel = document.getElementById("instructionsLabel");
  if (instructions.length > 0) {
    instructionsLabel.style.display = "block";
    instructionsEl.innerHTML = instructions
      .map(
        (step, i) => `
            <div class="instruction-step">
                <div class="step-number">${i + 1}</div>
                <div class="step-text">${step}</div>
            </div>
        `,
      )
      .join("");
  } else {
    instructionsLabel.style.display = "none";
    instructionsEl.innerHTML = "";
  }

  const videoEl = document.getElementById("detailVideo");
  const videoLabel = document.getElementById("videoLabel");
  if (recipe.videoId) {
    videoLabel.style.display = "block";
    videoEl.innerHTML = `<iframe src="https://www.youtube.com/embed/${recipe.videoId}?rel=0&modestbranding=1" allowfullscreen loading="lazy"></iframe>`;
  } else {
    videoLabel.style.display = "none";
    videoEl.innerHTML = "";
  }

  window.scrollTo(0, 0);
}

// ─── ADD TO MEAL ─────────────────────────────────────────────
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
    name: currentRecipe.name,
    protein: currentRecipe.protein || 0,
    carbs: currentRecipe.carbs || 0,
    fat: currentRecipe.fat || 0,
    calories: currentRecipe.calories || 0,
  });
  await saveDailyLog(currentUser.uid, dateKey, log);
  document.getElementById("mealSelectorModal").classList.remove("open");
  showToast(`✓ ${currentRecipe.name} added to ${meal}`);
}

// ─── LOAD RECIPES ────────────────────────────────────────────
async function loadRecipes(cuisine) {
  allRecipes = await getRecipes(cuisine);
  renderRecipes();
}

// ─── EVENT DELEGATION — one listener handles everything ──────
document.addEventListener("click", async function (e) {
  // ── Cuisine toggle ──
  const cuisineBtn = e.target.closest(".cuisine-btn");
  if (cuisineBtn && cuisineBtn.dataset.cuisine) {
    console.log("Cuisine clicked:", cuisineBtn.dataset.cuisine);
    document
      .querySelectorAll(".cuisine-btn")
      .forEach((b) => b.classList.remove("active"));
    cuisineBtn.classList.add("active");
    activeCuisine = cuisineBtn.dataset.cuisine;
    activeCategory = "all";
    document
      .querySelectorAll(".cat-btn")
      .forEach((b) => b.classList.remove("active"));
    const allCat = document.querySelector('.cat-btn[data-cat="all"]');
    if (allCat) allCat.classList.add("active");
    await loadRecipes(activeCuisine);
    return;
  }

  // ── Category filter ──
  const catBtn = e.target.closest(".cat-btn");
  if (catBtn && catBtn.dataset.cat) {
    console.log("Category clicked:", catBtn.dataset.cat);
    document
      .querySelectorAll(".cat-btn")
      .forEach((b) => b.classList.remove("active"));
    catBtn.classList.add("active");
    activeCategory = catBtn.dataset.cat;
    renderRecipes();
    return;
  }

  // ── Recipe item ──
  const recipeItem = e.target.closest(".recipe-item");
  if (recipeItem) {
    const recipe = allRecipes.find((r) => r.id === recipeItem.dataset.id);
    if (recipe) openDetail(recipe);
    return;
  }

  // ── Detail back ──
  if (e.target.closest("#detailBack")) {
    document.getElementById("detailPanel").classList.add("hidden");
    currentRecipe = null;
    return;
  }

  // ── Add to meal ──
  if (e.target.id === "addToMealBtn") {
    if (currentRecipe) openMealSelector(currentRecipe);
    return;
  }

  // ── Meal selector choice ──
  const mealSelBtn = e.target.closest(".meal-sel-btn");
  if (mealSelBtn) {
    document
      .querySelectorAll(".meal-sel-btn")
      .forEach((b) => b.classList.remove("selected"));
    mealSelBtn.classList.add("selected");
    selectedMeal = mealSelBtn.dataset.meal;
    return;
  }

  // ── Confirm add to meal ──
  if (e.target.id === "confirmAddMeal") {
    if (selectedMeal) await addRecipeToMeal(selectedMeal);
    return;
  }

  // ── Close meal selector ──
  if (e.target.id === "mealSelectorClose") {
    document.getElementById("mealSelectorModal").classList.remove("open");
    return;
  }
});

// ─── Search ──────────────────────────────────────────────────
document.getElementById("recipeSearch").addEventListener("input", (e) => {
  searchQuery = e.target.value;
  renderRecipes();
});

// ─── INIT ────────────────────────────────────────────────────
document.getElementById("currentDate").textContent =
  new Date().toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  currentUser = user;
  await loadRecipes(activeCuisine);
});
