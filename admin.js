import {
  auth,
  onAuthStateChanged,
  isAdmin,
  saveIngredient,
  getIngredients,
  deleteIngredient,
  saveRecipe,
  getRecipes,
  deleteRecipe,
} from "./firebase.js";

let currentUser = null;
let allIngredients = [];
let allRecipes = [];
let editingIngredientId = null;
let editingRecipeId = null;
let addedIngredients = [];
let selectedRecipeCategory = "";
let deleteTarget = null;
let deleteType = "";
let activeCuisine = "indian";

// ─── EMOJI HELPERS ───────────────────────────────────────────
function getCategoryEmoji(category) {
  const map = {
    grain: "🌾",
    dairy: "🥛",
    vegetable: "🥦",
    spice: "🌶️",
    oil: "🫙",
    fruit: "🍎",
    nut: "🥜",
    supplement: "💪",
    other: "🥄",
  };
  return map[category] || "🥄";
}

function getCatEmoji(cat) {
  const map = { breakfast: "🌅", lunch: "☀️", dinner: "🌙", snack: "🍎" };
  return map[cat] || "🍛";
}

// ─── STATS ───────────────────────────────────────────────────
function updateStats() {
  document.getElementById("statIngredients").textContent =
    allIngredients.length;
  document.getElementById("statRecipes").textContent = allRecipes.length;
}

// ─── TAB SWITCHING ───────────────────────────────────────────
document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".tab-btn")
      .forEach((b) => b.classList.remove("active"));
    document
      .querySelectorAll(".tab-content")
      .forEach((c) => c.classList.add("hidden"));
    btn.classList.add("active");
    document
      .getElementById(`tab-${btn.dataset.tab}`)
      .classList.remove("hidden");
  });
});

// ─── CUISINE TOGGLE ──────────────────────────────────────────
document.querySelectorAll(".cuisine-tab").forEach((btn) => {
  btn.addEventListener("click", async () => {
    document
      .querySelectorAll(".cuisine-tab")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    activeCuisine = btn.dataset.cuisine;
    allRecipes = await getRecipes(activeCuisine);
    renderRecipes();
    updateStats();
  });
});

// ─── INGREDIENT LIST ─────────────────────────────────────────
function renderIngredients(query = "") {
  const list = document.getElementById("ingredientList");
  const filtered = allIngredients.filter((i) =>
    i.name.toLowerCase().includes(query.toLowerCase()),
  );

  if (filtered.length === 0) {
    list.innerHTML = `<div style="text-align:center;color:rgba(255,255,255,0.2);font-size:12px;padding:40px">No ingredients yet — add your first one</div>`;
    return;
  }

  list.innerHTML = filtered
    .map(
      (ing) => `
        <div class="admin-item">
            <div class="admin-item-icon">${getCategoryEmoji(ing.category)}</div>
            <div class="admin-item-info">
                <div class="admin-item-name">${ing.name}</div>
                <div class="admin-item-meta">Per 100g — P: ${ing.protein}g · C: ${ing.carbs}g · F: ${ing.fat}g · ${ing.calories} cal</div>
            </div>
            <div class="admin-item-actions">
                <button class="admin-edit-btn" data-id="${ing.id}">Edit</button>
                <button class="admin-delete-btn" data-id="${ing.id}" data-name="${ing.name}">Delete</button>
            </div>
        </div>
    `,
    )
    .join("");

  list.querySelectorAll(".admin-edit-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const ing = allIngredients.find((i) => i.id === btn.dataset.id);
      if (ing) openIngredientModal(ing);
    });
  });

  list.querySelectorAll(".admin-delete-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      deleteTarget = btn.dataset.id;
      deleteType = "ingredient";
      document.getElementById("deleteMessage").textContent =
        `Delete "${btn.dataset.name}"? This cannot be undone.`;
      document.getElementById("deleteModal").classList.add("open");
    });
  });
}

// ─── INGREDIENT MODAL ────────────────────────────────────────
function openIngredientModal(ing = null) {
  editingIngredientId = ing ? ing.id : null;
  document.getElementById("ingredientModalTitle").textContent = ing
    ? "Edit Ingredient"
    : "Add Ingredient";
  document.getElementById("ingName").value = ing ? ing.name : "";
  document.getElementById("ingProtein").value = ing ? ing.protein : "";
  document.getElementById("ingCarbs").value = ing ? ing.carbs : "";
  document.getElementById("ingFat").value = ing ? ing.fat : "";
  document.getElementById("ingCalories").value = ing ? ing.calories : "";
  document.getElementById("ingFiber").value = ing ? ing.fiber || "" : "";
  document.getElementById("ingCategory").value = ing
    ? ing.category || "grain"
    : "grain";
  document.getElementById("ingredientModal").classList.add("open");
}

document
  .getElementById("addIngredientBtn")
  .addEventListener("click", () => openIngredientModal());

document
  .getElementById("ingredientModalClose")
  .addEventListener("click", () => {
    document.getElementById("ingredientModal").classList.remove("open");
  });

document
  .getElementById("saveIngredient")
  .addEventListener("click", async () => {
    const name = document.getElementById("ingName").value.trim();
    const protein =
      parseFloat(document.getElementById("ingProtein").value) || 0;
    const carbs = parseFloat(document.getElementById("ingCarbs").value) || 0;
    const fat = parseFloat(document.getElementById("ingFat").value) || 0;
    const calories =
      parseFloat(document.getElementById("ingCalories").value) || 0;
    const fiber = parseFloat(document.getElementById("ingFiber").value) || 0;
    const category = document.getElementById("ingCategory").value;

    if (!name) {
      alert("Please enter ingredient name.");
      return;
    }

    const ingredient = { name, protein, carbs, fat, calories, fiber, category };
    if (editingIngredientId) ingredient.id = editingIngredientId;

    await saveIngredient(ingredient);
    document.getElementById("ingredientModal").classList.remove("open");
    allIngredients = await getIngredients();
    renderIngredients();
    updateStats();
    alert("Ingredient saved!");
  });

document.getElementById("ingredientSearch").addEventListener("input", (e) => {
  renderIngredients(e.target.value);
});

// ─── RECIPE LIST ─────────────────────────────────────────────
function renderRecipes(query = "") {
  const list = document.getElementById("recipeList");
  const filtered = allRecipes.filter((r) =>
    r.name.toLowerCase().includes(query.toLowerCase()),
  );

  if (filtered.length === 0) {
    list.innerHTML = `<div style="text-align:center;color:rgba(255,255,255,0.2);font-size:12px;padding:40px">No ${activeCuisine} recipes yet — add your first one</div>`;
    return;
  }

  list.innerHTML = filtered
    .map(
      (r) => `
        <div class="admin-item">
            <div class="admin-item-icon">${getCatEmoji(r.category)}</div>
            <div class="admin-item-info">
                <div class="admin-item-name">${r.name}</div>
                <div class="admin-item-meta">${r.category} · P: ${r.protein}g · C: ${r.carbs}g · F: ${r.fat}g · ${r.calories} cal</div>
            </div>
            <div class="admin-item-actions">
                <button class="admin-edit-btn" data-id="${r.id}">Edit</button>
                <button class="admin-delete-btn" data-id="${r.id}" data-name="${r.name}">Delete</button>
            </div>
        </div>
    `,
    )
    .join("");

  list.querySelectorAll(".admin-edit-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const recipe = allRecipes.find((r) => r.id === btn.dataset.id);
      if (recipe) openRecipeModal(recipe);
    });
  });

  list.querySelectorAll(".admin-delete-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      deleteTarget = btn.dataset.id;
      deleteType = "recipe";
      document.getElementById("deleteMessage").textContent =
        `Delete "${btn.dataset.name}"? This cannot be undone.`;
      document.getElementById("deleteModal").classList.add("open");
    });
  });
}

// ─── RECIPE MODAL ────────────────────────────────────────────
function openRecipeModal(recipe = null) {
  editingRecipeId = recipe ? recipe.id : null;
  addedIngredients = recipe ? [...(recipe.ingredients || [])] : [];
  selectedRecipeCategory = recipe ? recipe.category : "";

  document.getElementById("recipeModalTitle").textContent = recipe
    ? "Edit Recipe"
    : `Add ${activeCuisine === "canadian" ? "🇨🇦 Canadian" : "🇮🇳 Indian"} Recipe`;
  document.getElementById("recName").value = recipe ? recipe.name : "";
  document.getElementById("recServing").value = recipe
    ? recipe.servingSize || ""
    : "";
  document.getElementById("recVideoId").value = recipe
    ? recipe.videoId || ""
    : "";
  document.getElementById("ingSearchRecipe").value = "";
  document.getElementById("ingSearchResults").innerHTML = "";

  document.querySelectorAll('.option-btn[data-field="recCat"]').forEach((b) => {
    b.classList.toggle("selected", b.dataset.val === selectedRecipeCategory);
  });

  renderAddedIngredients();
  updateRecipeMacros();
  document.getElementById("recipeModal").classList.add("open");
}

function renderAddedIngredients() {
  const container = document.getElementById("addedIngredients");
  if (addedIngredients.length === 0) {
    container.innerHTML = `<div style="text-align:center;color:rgba(255,255,255,0.2);font-size:11px;padding:12px">Search and add ingredients above</div>`;
    return;
  }
  container.innerHTML = addedIngredients
    .map(
      (ing, idx) => `
        <div class="added-ing-row">
            <span class="added-ing-name">${ing.name}</span>
            <input class="added-ing-amount" type="number" value="${ing.amount || 100}" min="0" data-idx="${idx}">
            <span class="added-ing-unit">g</span>
            <button class="added-ing-remove" data-idx="${idx}">✕</button>
        </div>
    `,
    )
    .join("");

  container.querySelectorAll(".added-ing-amount").forEach((input) => {
    input.addEventListener("input", (e) => {
      addedIngredients[parseInt(e.target.dataset.idx)].amount =
        parseFloat(e.target.value) || 0;
      updateRecipeMacros();
    });
  });

  container.querySelectorAll(".added-ing-remove").forEach((btn) => {
    btn.addEventListener("click", () => {
      addedIngredients.splice(parseInt(btn.dataset.idx), 1);
      renderAddedIngredients();
      updateRecipeMacros();
    });
  });
}

function updateRecipeMacros() {
  let protein = 0,
    carbs = 0,
    fat = 0,
    calories = 0;
  addedIngredients.forEach((ing) => {
    const factor = (ing.amount || 0) / 100;
    const base = allIngredients.find((i) => i.id === ing.id) || ing;
    protein += (base.protein || 0) * factor;
    carbs += (base.carbs || 0) * factor;
    fat += (base.fat || 0) * factor;
    calories += (base.calories || 0) * factor;
  });
  document.getElementById("recProtein").textContent = Math.round(protein) + "g";
  document.getElementById("recCarbs").textContent = Math.round(carbs) + "g";
  document.getElementById("recFat").textContent = Math.round(fat) + "g";
  document.getElementById("recCalories").textContent = Math.round(calories);
}

function renderIngSearchResults(query) {
  const results = document.getElementById("ingSearchResults");
  if (!query) {
    results.innerHTML = "";
    return;
  }
  const filtered = allIngredients
    .filter(
      (i) =>
        i.name.toLowerCase().includes(query.toLowerCase()) &&
        !addedIngredients.find((a) => a.id === i.id),
    )
    .slice(0, 6);

  if (filtered.length === 0) {
    results.innerHTML = `<div style="color:rgba(255,255,255,0.2);font-size:11px;padding:8px">Not found — add it in Ingredients tab first</div>`;
    return;
  }

  results.innerHTML = filtered
    .map(
      (ing) => `
        <div class="ing-result-item" data-id="${ing.id}">
            <span>${ing.name}</span>
            <span class="ing-result-macros">P:${ing.protein} C:${ing.carbs} F:${ing.fat} per 100g</span>
        </div>
    `,
    )
    .join("");

  results.querySelectorAll(".ing-result-item").forEach((el) => {
    el.addEventListener("click", () => {
      const ing = allIngredients.find((i) => i.id === el.dataset.id);
      if (ing) {
        addedIngredients.push({ ...ing, amount: 100 });
        document.getElementById("ingSearchRecipe").value = "";
        results.innerHTML = "";
        renderAddedIngredients();
        updateRecipeMacros();
      }
    });
  });
}

document.getElementById("ingSearchRecipe").addEventListener("input", (e) => {
  renderIngSearchResults(e.target.value);
});

document.querySelectorAll('.option-btn[data-field="recCat"]').forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll('.option-btn[data-field="recCat"]')
      .forEach((b) => b.classList.remove("selected"));
    btn.classList.add("selected");
    selectedRecipeCategory = btn.dataset.val;
  });
});

document
  .getElementById("addRecipeBtn")
  .addEventListener("click", () => openRecipeModal());

document.getElementById("recipeModalClose").addEventListener("click", () => {
  document.getElementById("recipeModal").classList.remove("open");
});

document.getElementById("saveRecipe").addEventListener("click", async () => {
  const name = document.getElementById("recName").value.trim();
  if (!name) {
    alert("Please enter recipe name.");
    return;
  }
  if (!selectedRecipeCategory) {
    alert("Please select a category.");
    return;
  }

  let protein = 0,
    carbs = 0,
    fat = 0,
    calories = 0;
  addedIngredients.forEach((ing) => {
    const factor = (ing.amount || 0) / 100;
    const base = allIngredients.find((i) => i.id === ing.id) || ing;
    protein += (base.protein || 0) * factor;
    carbs += (base.carbs || 0) * factor;
    fat += (base.fat || 0) * factor;
    calories += (base.calories || 0) * factor;
  });

  const recipe = {
    name,
    category: selectedRecipeCategory,
    servingSize: document.getElementById("recServing").value.trim(),
    videoId: document.getElementById("recVideoId").value.trim(),
    cuisine: activeCuisine,
    ingredients: addedIngredients.map((ing) => ({
      id: ing.id,
      name: ing.name,
      amount: ing.amount || 100,
      unit: "g",
    })),
    protein: Math.round(protein),
    carbs: Math.round(carbs),
    fat: Math.round(fat),
    calories: Math.round(calories),
  };

  if (editingRecipeId) recipe.id = editingRecipeId;

  await saveRecipe(recipe, activeCuisine);
  document.getElementById("recipeModal").classList.remove("open");
  allRecipes = await getRecipes(activeCuisine);
  renderRecipes();
  updateStats();
  alert("Recipe saved!");
});

document.getElementById("recipeSearch").addEventListener("input", (e) => {
  renderRecipes(e.target.value);
});

// ─── DELETE MODAL ────────────────────────────────────────────
document.getElementById("deleteModalClose").addEventListener("click", () => {
  document.getElementById("deleteModal").classList.remove("open");
});

document.getElementById("cancelDelete").addEventListener("click", () => {
  document.getElementById("deleteModal").classList.remove("open");
});

document.getElementById("confirmDelete").addEventListener("click", async () => {
  if (!deleteTarget) return;
  if (deleteType === "ingredient") {
    await deleteIngredient(deleteTarget);
    allIngredients = await getIngredients();
    renderIngredients();
  } else if (deleteType === "recipe") {
    await deleteRecipe(deleteTarget, activeCuisine);
    allRecipes = await getRecipes(activeCuisine);
    renderRecipes();
  }
  updateStats();
  document.getElementById("deleteModal").classList.remove("open");
  deleteTarget = null;
});

// ─── INIT ────────────────────────────────────────────────────
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  currentUser = user;

  if (!isAdmin(user)) {
    document.getElementById("accessDenied").classList.remove("hidden");
    document.getElementById("adminContent").classList.add("hidden");
    return;
  }

  document.getElementById("accessDenied").classList.add("hidden");
  document.getElementById("adminContent").classList.remove("hidden");
  allIngredients = await getIngredients();
  allRecipes = await getRecipes(activeCuisine);
  renderIngredients();
  renderRecipes();
  updateStats();
});
