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
  getAllUsers,
  assignCoach,
  saveCoachChoice,
  setAdminStatus,
  getUserRecipes,
  deleteUserRecipe,
  getAllUserRecipes,
  promoteUserRecipe,
} from "./firebase.js";
import { COACHES } from "./coaches.js";

let currentUser = null;
let allIngredients = [];
let allRecipes = [];
let allUsers = [];
let editingIngredientId = null;
let editingRecipeId = null;
let addedIngredients = [];
let selectedRecipeCategory = "";
let deleteTarget = null;
let deleteType = "";
let deleteCallback = null;
let activeCuisine = "indian";
let allUserRecipes = [];
let userRecipesLoaded = false;

// ─── INLINE VALIDATION HELPER ────────────────────────────────
function validateField(id, required = true) {
  const el = document.getElementById(id);
  if (!el) return true;

  let errEl = document.getElementById(id + "_err");
  if (!errEl) {
    errEl = document.createElement("div");
    errEl.className = "field-error";
    errEl.id = id + "_err";
    el.insertAdjacentElement("afterend", errEl);
    el.addEventListener("input", () => {
      el.classList.remove("input-error");
      errEl.textContent = "";
    });
  }

  const raw = el.value.trim();
  if (raw === "") {
    el.classList.remove("input-error");
    errEl.textContent = "";
    if (required) { el.classList.add("input-error"); errEl.textContent = "Required"; return false; }
    return true;
  }
  const val = parseFloat(raw);
  if (isNaN(val)) {
    el.classList.add("input-error"); errEl.textContent = "Enter a valid number"; return false;
  }
  const min = el.getAttribute("min") !== null ? parseFloat(el.getAttribute("min")) : -Infinity;
  const max = el.getAttribute("max") !== null ? parseFloat(el.getAttribute("max")) : Infinity;
  if (val < min) { el.classList.add("input-error"); errEl.textContent = `Min value is ${min}`; return false; }
  if (val > max) { el.classList.add("input-error"); errEl.textContent = `Max value is ${max}`; return false; }
  el.classList.remove("input-error"); errEl.textContent = ""; return true;
}

// ─── TOAST ───────────────────────────────────────────────────
function showToast(msg, type = "success") {
  const existing = document.querySelector(".admin-toast");
  if (existing) existing.remove();
  const toast = document.createElement("div");
  toast.className = `admin-toast ${type}`;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}

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
  document.getElementById("statIngredients").textContent = allIngredients.length;
  document.getElementById("statRecipes").textContent = allRecipes.length;
  document.getElementById("statUsers").textContent = allUsers.length;
}

// ─── TAB SWITCHING ───────────────────────────────────────────
document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".admin-tab-pane").forEach((c) => c.classList.add("hidden"));
    btn.classList.add("active");
    document.getElementById(`tab-${btn.dataset.tab}`).classList.remove("hidden");
    if (btn.dataset.tab === "users") loadUsers();
    if (btn.dataset.tab === "recipes") loadAllUserRecipes();
  });
});

// ─── USERS ───────────────────────────────────────────────────
const USERS_CACHE_KEY = "fitdesi_admin_users";

function saveUsersCache(users) {
  try { localStorage.setItem(USERS_CACHE_KEY, JSON.stringify(users)); } catch (e) {}
}

function loadUsersCache() {
  try { return JSON.parse(localStorage.getItem(USERS_CACHE_KEY) || "null"); } catch (e) { return null; }
}

async function loadUsers() {
  const list = document.getElementById("userList");

  // Already loaded on init — just render, no second Firestore read
  if (allUsers.length) {
    renderUsers();
    return;
  }

  // First tab open before init finished — show cache while waiting
  const cached = loadUsersCache();
  if (cached) {
    allUsers = cached;
    updateStats();
    renderUsers();
  } else {
    list.innerHTML = `<div style="text-align:center;color:rgba(255,255,255,0.3);padding:40px;font-size:13px;">Loading members…</div>`;
    try {
      const fresh = await getAllUsers();
      allUsers = fresh;
      saveUsersCache(fresh);
      updateStats();
      renderUsers();
    } catch (e) {
      list.innerHTML = `<div style="text-align:center;color:rgba(255,255,255,0.3);padding:40px;font-size:13px;">Offline — no cached data yet</div>`;
    }
  }
}

function renderUsers() {
  const list = document.getElementById("userList");

  if (!allUsers.length) {
    list.innerHTML = `<div style="text-align:center;color:rgba(255,255,255,0.2);font-size:12px;padding:40px;">No members yet — users appear here when they sign in with Google</div>`;
    return;
  }

  list.innerHTML = "";
  allUsers.forEach((user) => {
    const coach = user.chosenCoach ? COACHES[user.chosenCoach] : null;
    const enabled = !!user.coachEnabled;

    const row = document.createElement("div");
    row.style.cssText = `
      display: flex; align-items: center; gap: 14px;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 14px; padding: 14px 16px; margin-bottom: 10px;
    `;

    // Avatar / initials
    const avatar = document.createElement("div");
    const initials = (user.name || user.email || "?").charAt(0).toUpperCase();
    avatar.textContent = initials;
    avatar.style.cssText = `
      width: 42px; height: 42px; border-radius: 50%;
      background: rgba(126,217,154,0.15); color: #7ed99a;
      display: flex; align-items: center; justify-content: center;
      font-size: 18px; font-weight: 700; flex-shrink: 0;
    `;

    // Info
    const info = document.createElement("div");
    info.style.cssText = `flex: 1; min-width: 0;`;

    const name = document.createElement("div");
    name.textContent = user.name || "Unnamed";
    name.style.cssText = `font-size: 14px; font-weight: 600; color: #fff;`;

    const email = document.createElement("div");
    email.textContent = user.email || user.uid;
    email.style.cssText = `font-size: 12px; color: rgba(255,255,255,0.4); margin-top: 1px;`;

    const coachBadge = document.createElement("div");
    coachBadge.textContent = enabled
      ? coach ? `${coach.emoji} Coach ${coach.name}` : "✅ Coach Enabled (not chosen yet)"
      : "No Coach";
    coachBadge.style.cssText = `
      font-size: 11px; margin-top: 4px;
      color: ${enabled ? "#7ed99a" : "rgba(255,255,255,0.25)"};
    `;

    const joinDate = document.createElement("div");
    joinDate.textContent = user.createdAt
      ? `Joined ${new Date(user.createdAt).toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" })}`
      : "";
    joinDate.style.cssText = `font-size: 10px; color: rgba(255,255,255,0.18); margin-top: 2px;`;

    const adminBadge = document.createElement("div");
    adminBadge.textContent = "⚙️ Admin";
    adminBadge.style.cssText = `font-size: 10px; color: #f0a050; margin-top: 2px; ${user.isAdmin ? "" : "display:none;"}`;

    info.appendChild(name);
    info.appendChild(email);
    info.appendChild(coachBadge);
    if (user.createdAt) info.appendChild(joinDate);
    info.appendChild(adminBadge);

    // Toggle button
    const toggleBtn = document.createElement("button");
    toggleBtn.textContent = enabled ? "Remove Coach" : "Assign Coach";
    toggleBtn.style.cssText = `
      padding: 8px 14px; border-radius: 20px; font-size: 12px; font-weight: 600;
      cursor: pointer; border: 1.5px solid;
      flex-shrink: 0;
      background: ${enabled ? "rgba(239,68,68,0.1)" : "rgba(126,217,154,0.1)"};
      border-color: ${enabled ? "#f87171" : "#7ed99a"};
      color: ${enabled ? "#f87171" : "#7ed99a"};
    `;

    toggleBtn.addEventListener("click", async () => {
      toggleBtn.disabled = true;
      toggleBtn.textContent = "Saving…";
      const newState = !enabled;
      await assignCoach(user.uid, newState);
      user.coachEnabled = newState;
      renderUsers();
    });

    // Edit button — lets admin change the user's chosen coach
    const editBtn = document.createElement("button");
    editBtn.textContent = "✏️";
    editBtn.title = "Change coach personality";
    editBtn.style.cssText = `
      padding: 8px 10px; border-radius: 20px; font-size: 13px;
      cursor: pointer; border: 1.5px solid rgba(255,255,255,0.15);
      flex-shrink: 0; margin-left: 6px;
      background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.5);
    `;

    // Inline coach picker that expands below the row
    const picker = document.createElement("div");
    picker.style.cssText = `
      display: none; grid-template-columns: 1fr 1fr;
      gap: 8px; padding: 12px 0 4px; width: 100%;
    `;

    Object.values(COACHES).forEach((c) => {
      const opt = document.createElement("button");
      const isActive = user.chosenCoach === c.id;
      opt.style.cssText = `
        display: flex; align-items: center; gap: 8px;
        padding: 10px 12px; border-radius: 12px; cursor: pointer;
        border: 1.5px solid ${isActive ? "#7ed99a" : "rgba(255,255,255,0.1)"};
        background: ${isActive ? "rgba(126,217,154,0.1)" : "rgba(255,255,255,0.03)"};
        color: #fff; font-size: 13px; text-align: left;
      `;
      opt.innerHTML = `<span style="font-size:18px">${c.emoji}</span><div>
        <div style="font-weight:600;font-size:13px">${c.name}</div>
        <div style="font-size:10px;color:${c.tagColor.text};text-transform:uppercase;letter-spacing:0.5px">${c.tag}</div>
      </div>`;

      opt.addEventListener("click", async () => {
        opt.textContent = "Saving…";
        await saveCoachChoice(user.uid, c.id);
        user.chosenCoach = c.id;
        renderUsers();
      });

      picker.appendChild(opt);
    });

    // ── Admin toggle ─────────────────────────────────────────
    const adminRow = document.createElement("div");
    adminRow.style.cssText = `
      grid-column: 1 / -1; display: flex; align-items: center;
      justify-content: space-between; padding-top: 10px; margin-top: 4px;
      border-top: 0.5px solid rgba(255,255,255,0.06);
    `;
    const adminLabel = document.createElement("span");
    adminLabel.textContent = "Admin Access";
    adminLabel.style.cssText = `font-size: 12px; color: rgba(255,255,255,0.35);`;

    const isUserAdmin = !!user.isAdmin;
    const adminToggle = document.createElement("button");
    adminToggle.textContent = isUserAdmin ? "Revoke Admin" : "Grant Admin";
    adminToggle.style.cssText = `
      padding: 6px 14px; border-radius: 20px; font-size: 11px; font-weight: 600;
      cursor: pointer; border: 1.5px solid;
      background: ${isUserAdmin ? "rgba(239,68,68,0.1)" : "rgba(240,160,80,0.1)"};
      border-color: ${isUserAdmin ? "#f87171" : "#f0a050"};
      color: ${isUserAdmin ? "#f87171" : "#f0a050"};
    `;
    adminToggle.addEventListener("click", async () => {
      adminToggle.disabled = true;
      adminToggle.textContent = "Saving…";
      await setAdminStatus(user.uid, !isUserAdmin);
      user.isAdmin = !isUserAdmin;
      renderUsers();
    });
    adminRow.appendChild(adminLabel);
    adminRow.appendChild(adminToggle);
    picker.appendChild(adminRow);

    editBtn.addEventListener("click", () => {
      const open = picker.style.display === "grid";
      picker.style.display = open ? "none" : "grid";
      editBtn.style.borderColor = open ? "rgba(255,255,255,0.15)" : "#7ed99a";
      editBtn.style.color = open ? "rgba(255,255,255,0.5)" : "#7ed99a";
    });

    // ── Recipes button ──
    const recipesBtn = document.createElement("button");
    recipesBtn.textContent = "📖";
    recipesBtn.title = "View user recipes";
    recipesBtn.style.cssText = `
      padding: 8px 10px; border-radius: 20px; font-size: 13px;
      cursor: pointer; border: 1.5px solid rgba(255,255,255,0.15);
      flex-shrink: 0; margin-left: 6px;
      background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.5);
    `;

    const recipesPanel = document.createElement("div");
    recipesPanel.style.cssText = `
      display: none; padding: 4px 16px 12px;
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(255,255,255,0.07);
      border-top: none; border-radius: 0 0 14px 14px;
    `;

    recipesBtn.addEventListener("click", async () => {
      const isOpen = recipesPanel.style.display !== "none";
      if (isOpen) {
        recipesPanel.style.display = "none";
        recipesBtn.style.borderColor = "rgba(255,255,255,0.15)";
        recipesBtn.style.color = "rgba(255,255,255,0.5)";
        return;
      }
      recipesBtn.style.borderColor = "#7ed99a";
      recipesBtn.style.color = "#7ed99a";
      recipesPanel.style.display = "block";
      recipesPanel.innerHTML = `<div style="font-size:12px;color:rgba(255,255,255,0.3);padding:10px 0">Loading recipes…</div>`;
      try {
        const userRecipes = await getUserRecipes(user.uid);
        if (userRecipes.length === 0) {
          recipesPanel.innerHTML = `<div style="font-size:12px;color:rgba(255,255,255,0.2);padding:10px 0">No personal recipes yet</div>`;
          return;
        }
        recipesPanel.innerHTML = userRecipes.map((r) => `
          <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:0.5px solid rgba(255,255,255,0.04)">
            <span style="font-size:12px;color:rgba(255,255,255,0.65)">${r.name}
              <span style="font-size:10px;color:rgba(255,255,255,0.25);margin-left:4px">${r.category}</span>
            </span>
            <button data-rid="${r.id}" style="background:none;border:none;color:rgba(255,80,80,0.4);cursor:pointer;font-size:13px;padding:4px 8px;flex-shrink:0">🗑️</button>
          </div>`).join("");

        recipesPanel.querySelectorAll("button[data-rid]").forEach((btn) => {
          const rid  = btn.dataset.rid;
          const rObj = userRecipes.find((r) => r.id === rid);
          btn.addEventListener("click", () => {
            deleteCallback = async () => {
              await deleteUserRecipe(user.uid, rid);
              btn.closest("div").remove();
              if (!recipesPanel.querySelector("button[data-rid]")) {
                recipesPanel.innerHTML = `<div style="font-size:12px;color:rgba(255,255,255,0.2);padding:10px 0">No personal recipes yet</div>`;
              }
            };
            document.getElementById("deleteMessage").textContent =
              `Delete "${rObj?.name || "this recipe"}"? This cannot be undone.`;
            document.getElementById("deleteModal").classList.add("open");
          });
        });
      } catch (e) {
        recipesPanel.innerHTML = `<div style="font-size:12px;color:rgba(255,80,80,0.4);padding:10px 0">Error loading recipes</div>`;
      }
    });

    // Wrap row + picker in a container
    const container = document.createElement("div");
    container.style.cssText = `margin-bottom: 10px;`;

    row.style.marginBottom = "0";
    const pickerWrap = document.createElement("div");
    pickerWrap.style.cssText = `
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(255,255,255,0.07);
      border-top: none; border-radius: 0 0 14px 14px;
      padding: 0 16px 0;
    `;
    pickerWrap.appendChild(picker);

    row.appendChild(avatar);
    row.appendChild(info);
    row.appendChild(toggleBtn);
    row.appendChild(editBtn);
    row.appendChild(recipesBtn);
    container.appendChild(row);
    container.appendChild(pickerWrap);
    container.appendChild(recipesPanel);
    list.appendChild(container);
  });
}

// ─── USER RECIPE SECTION (Recipes tab) ───────────────────────
async function loadAllUserRecipes() {
  if (userRecipesLoaded) { renderUserRecipesSection(); return; }
  const container = document.getElementById("userRecipeList");
  container.innerHTML = `<div style="text-align:center;color:rgba(255,255,255,0.3);font-size:13px;padding:20px">Loading…</div>`;
  allUserRecipes = await getAllUserRecipes();
  userRecipesLoaded = true;
  renderUserRecipesSection();
}

function renderUserRecipesSection() {
  const container = document.getElementById("userRecipeList");
  if (!allUserRecipes.length) {
    container.innerHTML = `<div style="text-align:center;color:rgba(255,255,255,0.2);font-size:12px;padding:30px">No personal recipes from any user yet</div>`;
    return;
  }
  container.innerHTML = "";
  allUserRecipes.forEach((recipe) => {
    const wrapper = document.createElement("div");
    wrapper.style.cssText = `margin-bottom: 8px;`;

    const item = document.createElement("div");
    item.className = "admin-item";
    item.style.marginBottom = "0";
    item.style.borderRadius = "14px 14px 14px 14px";
    item.innerHTML = `
      <div class="admin-item-icon">${getCatEmoji(recipe.category)}</div>
      <div class="admin-item-info">
        <div class="admin-item-name">${recipe.name}</div>
        <div class="admin-item-meta">${recipe.category} · P: ${recipe.protein}g · C: ${recipe.carbs}g · F: ${recipe.fat}g · ${recipe.calories} cal</div>
        <div class="admin-item-meta" style="color:rgba(126,217,154,0.5);margin-top:3px">👤 ${recipe._ownerName}</div>
      </div>
      <div class="admin-item-actions">
        <button class="admin-promote-btn">⬆ Promote</button>
        <button class="admin-delete-btn" data-name="${recipe.name}">Delete</button>
      </div>
    `;

    const promotePicker = document.createElement("div");
    promotePicker.className = "promote-picker";

    ["indian", "canadian"].forEach((cuisine) => {
      const pb = document.createElement("button");
      pb.textContent = cuisine === "indian" ? "🇮🇳 Indian" : "🇨🇦 Canadian";
      pb.addEventListener("click", async () => {
        pb.textContent = "Promoting…";
        pb.disabled = true;
        try {
          await promoteUserRecipe(recipe._uid, recipe.id, cuisine);
          promotePicker.style.display = "none";
          item.style.borderRadius = "14px";
          showToast(`Promoted to ${cuisine === "indian" ? "Indian" : "Canadian"} recipes ✓`);
          if (cuisine === activeCuisine) {
            allRecipes = await getRecipes(activeCuisine);
            renderRecipes();
            updateStats();
          }
        } catch (e) {
          pb.textContent = cuisine === "indian" ? "🇮🇳 Indian" : "🇨🇦 Canadian";
          pb.disabled = false;
          showToast("Promote failed — try again", "error");
        }
      });
      promotePicker.appendChild(pb);
    });

    item.querySelector(".admin-promote-btn").addEventListener("click", () => {
      const open = promotePicker.style.display === "flex";
      promotePicker.style.display = open ? "none" : "flex";
      item.style.borderRadius = open ? "14px" : "14px 14px 0 0";
    });

    item.querySelector(".admin-delete-btn").addEventListener("click", () => {
      const uid = recipe._uid;
      const id = recipe.id;
      deleteCallback = async () => {
        await deleteUserRecipe(uid, id);
        allUserRecipes = allUserRecipes.filter((r) => !(r.id === id && r._uid === uid));
        renderUserRecipesSection();
      };
      document.getElementById("deleteMessage").textContent =
        `Delete "${recipe.name}"? This cannot be undone.`;
      document.getElementById("deleteModal").classList.add("open");
    });

    wrapper.appendChild(item);
    wrapper.appendChild(promotePicker);
    container.appendChild(wrapper);
  });
}

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

    // Validate numeric macro fields (optional but must be within range if entered)
    const r1 = validateField("ingProtein",  false);
    const r2 = validateField("ingCarbs",    false);
    const r3 = validateField("ingFat",      false);
    const r4 = validateField("ingCalories", false);
    const r5 = validateField("ingFiber",    false);
    if (!r1 || !r2 || !r3 || !r4 || !r5) return;

    const ingredient = { name, protein, carbs, fat, calories, fiber, category };
    if (editingIngredientId) ingredient.id = editingIngredientId;

    await saveIngredient(ingredient);
    document.getElementById("ingredientModal").classList.remove("open");
    allIngredients = await getIngredients();
    renderIngredients();
    updateStats();
    showToast("Ingredient saved ✓");
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

  const cuisineLabel = activeCuisine === "canadian" ? "🇨🇦 Canadian" : "🇮🇳 Indian";
  document.getElementById("recipeModalTitle").textContent = recipe
    ? "Edit Recipe"
    : `Add ${cuisineLabel} Recipe`;
  const badge = document.getElementById("recipeCuisineBadge");
  if (badge) badge.textContent = `Saving to: ${cuisineLabel} recipes`;
  document.getElementById("recName").value = recipe ? recipe.name : "";
  document.getElementById("recServing").value = recipe
    ? recipe.servingSize || ""
    : "";
  document.getElementById("recInstructions").value = recipe ? recipe.instructions || "" : "";
  document.getElementById("recNotes").value = recipe ? recipe.notes || "" : "";
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
    instructions: document.getElementById("recInstructions").value.trim(),
    notes: document.getElementById("recNotes").value.trim(),
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
  showToast("Recipe saved ✓");
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
  if (!deleteTarget && !deleteCallback) return;
  if (deleteCallback) {
    try { await deleteCallback(); } catch (e) {}
    deleteCallback = null;
  } else if (deleteType === "ingredient") {
    await deleteIngredient(deleteTarget);
    allIngredients = await getIngredients();
    renderIngredients();
    updateStats();
  } else if (deleteType === "recipe") {
    await deleteRecipe(deleteTarget, activeCuisine);
    allRecipes = await getRecipes(activeCuisine);
    renderRecipes();
    updateStats();
  }
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
  // Show ingredient/recipe counts immediately, then add user count when it loads
  updateStats();
  // Show cached user count immediately, refresh in background
  const cachedUsers = loadUsersCache();
  if (cachedUsers) { allUsers = cachedUsers; updateStats(); }
  getAllUsers().then((fresh) => { allUsers = fresh; saveUsersCache(fresh); updateStats(); }).catch(() => {});
});
