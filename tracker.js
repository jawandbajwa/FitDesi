// ─── FIREBASE IMPORTS ────────────────────────────────────────
import {
  auth,
  onAuthStateChanged,
  saveUserProfile,
  getUserProfile,
  saveDailyLog,
  getDailyLog,
  saveNotifTimes,
  getNotifTimes,
  getRecipes,
  saveProgressEntry,
  getProgressHistory,
} from "./firebase.js";

// ─── CONSTANTS ───────────────────────────────────────────────
const MEALS = ["breakfast", "lunch", "snack", "dinner"];

// ─── STATE ───────────────────────────────────────────────────
let currentUser = null;
let selectedGoal = "";
let selectedGender = "";
let selectedActivity = "";
let currentMeal = "";
let editGender = "";
let editGoal = "";
let editActivity = "";

// Planner state
let plannerMode = "full";
let plannerCuisine = "indian";
let currentPlan = { breakfast: null, lunch: null, dinner: null, snack: null };
let swappingMeal = null;
let plannerRecipes = [];

// ─── FIREBASE HELPERS ────────────────────────────────────────
async function getProfile() {
  if (!currentUser) return null;
  return await getUserProfile(currentUser.uid);
}

async function saveProfile(profile) {
  if (!currentUser) return;
  await saveUserProfile(currentUser.uid, profile);
}

function getTodayKey() {
  return new Date().toDateString();
}

async function getTodayLog() {
  if (!currentUser) return { breakfast: [], lunch: [], snack: [], dinner: [] };
  return await getDailyLog(currentUser.uid, getTodayKey());
}

async function saveTodayLog(log) {
  if (!currentUser) return;
  await saveDailyLog(currentUser.uid, getTodayKey(), log);
}

async function getRecipesFromDB(cuisine = "indian") {
  try {
    return await getRecipes(cuisine);
  } catch (e) {
    return [];
  }
}

function getMealTotals(log) {
  const totals = { protein: 0, carbs: 0, fat: 0, calories: 0 };
  MEALS.forEach((meal) => {
    (log[meal] || []).forEach((item) => {
      totals.protein += item.protein || 0;
      totals.carbs += item.carbs || 0;
      totals.fat += item.fat || 0;
      totals.calories += item.calories || 0;
    });
  });
  return totals;
}

// ─── HEIGHT & WEIGHT HELPERS ─────────────────────────────────
function getHeightInCm() {
  const isCm = document.getElementById("heightCm").classList.contains("active");
  if (isCm) {
    return parseFloat(document.getElementById("userHeight").value) || 0;
  } else {
    const ft = parseFloat(document.getElementById("userHeightFt").value) || 0;
    const inches =
      parseFloat(document.getElementById("userHeightIn").value) || 0;
    return Math.round(ft * 30.48 + inches * 2.54);
  }
}

function getWeightInKg() {
  const isKg = document.getElementById("weightKg").classList.contains("active");
  if (isKg) {
    return parseFloat(document.getElementById("userWeight").value) || 0;
  } else {
    const lbs = parseFloat(document.getElementById("userWeightLbs").value) || 0;
    return Math.round(lbs * 0.453592 * 10) / 10;
  }
}

function getEditWeightInKg() {
  const isKg = document
    .getElementById("editWeightKg")
    .classList.contains("active");
  if (isKg) {
    return parseFloat(document.getElementById("editWeight").value) || 0;
  } else {
    const lbs =
      parseFloat(document.getElementById("editWeightLbsVal").value) || 0;
    return Math.round(lbs * 0.453592 * 10) / 10;
  }
}

function getEditHeightInCm() {
  const isCm = document
    .getElementById("editHeightCm")
    .classList.contains("active");
  if (isCm) {
    return parseFloat(document.getElementById("editHeight").value) || 0;
  } else {
    const ft =
      parseFloat(document.getElementById("editHeightFtVal").value) || 0;
    const inches =
      parseFloat(document.getElementById("editHeightInVal").value) || 0;
    return Math.round(ft * 30.48 + inches * 2.54);
  }
}

// ─── MACRO CALCULATOR ────────────────────────────────────────
function calculateMacros(profile) {
  const { weight, height, age, gender, activity, goal } = profile;
  let bmr =
    gender === "male"
      ? 10 * weight + 6.25 * height - 5 * age + 5
      : 10 * weight + 6.25 * height - 5 * age - 161;

  const multipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
  };
  let tdee = bmr * (multipliers[activity] || 1.55);

  let calories, protein, carbs, fat;
  if (goal === "recomp") {
    calories = Math.round(tdee * 0.95);
    protein = Math.round(weight * 2.2);
    fat = Math.round((calories * 0.25) / 9);
    carbs = Math.round((calories - protein * 4 - fat * 9) / 4);
  } else if (goal === "muscle") {
    calories = Math.round(tdee * 1.1);
    protein = Math.round(weight * 2.0);
    fat = Math.round((calories * 0.28) / 9);
    carbs = Math.round((calories - protein * 4 - fat * 9) / 4);
  } else {
    calories = Math.round(tdee * 0.85);
    protein = Math.round(weight * 2.4);
    fat = Math.round((calories * 0.25) / 9);
    carbs = Math.round((calories - protein * 4 - fat * 9) / 4);
  }
  return { calories, protein, carbs, fat };
}

// ─── BODY STATS ──────────────────────────────────────────────
function calculateBodyFat(profile) {
  const { gender, height, neck, waist, hip } = profile;
  if (!neck || !waist) return null;
  let bf;
  if (gender === "male") {
    bf =
      495 /
        (1.0324 -
          0.19077 * Math.log10(waist - neck) +
          0.15456 * Math.log10(height)) -
      450;
  } else {
    if (!hip) return null;
    bf =
      495 /
        (1.29579 -
          0.35004 * Math.log10(waist + hip - neck) +
          0.221 * Math.log10(height)) -
      450;
  }
  return Math.round(bf * 10) / 10;
}

function getBodyFatCategory(bf, gender) {
  if (gender === "male") {
    if (bf < 6) return "Essential Fat";
    if (bf < 14) return "Athletic";
    if (bf < 18) return "Fitness";
    if (bf < 25) return "Average";
    return "High";
  } else {
    if (bf < 14) return "Essential Fat";
    if (bf < 21) return "Athletic";
    if (bf < 25) return "Fitness";
    if (bf < 32) return "Average";
    return "High";
  }
}

function calculateIdealWeight(height, gender) {
  const heightInInches = height / 2.54;
  const inchesOver5ft = heightInInches - 60;
  let base = gender === "male" ? 50 : 45.5;
  let ideal = base + 2.3 * inchesOver5ft;
  return { low: Math.round(ideal - 5), high: Math.round(ideal + 5) };
}

function getBMI(weight, height) {
  const bmi = weight / ((height / 100) * (height / 100));
  let category;
  if (bmi < 18.5) category = "Underweight";
  else if (bmi < 25) category = "Healthy";
  else if (bmi < 30) category = "Overweight";
  else category = "Obese";
  return { value: Math.round(bmi * 10) / 10, category };
}

function renderBodyStats(profile) {
  const section = document.getElementById("bodyStatsSection");
  const bf = calculateBodyFat(profile);
  const ideal = calculateIdealWeight(profile.height, profile.gender);
  const bmi = getBMI(profile.weight, profile.height);
  const fatMass = bf ? Math.round((profile.weight * bf) / 100) : null;
  const leanMass = fatMass ? Math.round(profile.weight - fatMass) : null;

  section.className = "body-stats";
  section.innerHTML = `
        <div class="body-stat-card">
            <div class="body-stat-val">${bmi.value}</div>
            <div class="body-stat-lbl">BMI</div>
            <div class="body-stat-note">${bmi.category}</div>
        </div>
        <div class="body-stat-card">
            <div class="body-stat-val">${bf !== null ? bf + "%" : "—"}</div>
            <div class="body-stat-lbl">Body Fat</div>
            <div class="body-stat-note">${bf !== null ? getBodyFatCategory(bf, profile.gender) : "Add measurements"}</div>
        </div>
        <div class="body-stat-card">
            <div class="body-stat-val">${ideal.low}–${ideal.high}kg</div>
            <div class="body-stat-lbl">Ideal Weight</div>
            <div class="body-stat-note">Based on height</div>
        </div>
        <div class="body-stat-card">
            <div class="body-stat-val">${leanMass !== null ? leanMass + "kg" : "—"}</div>
            <div class="body-stat-lbl">Lean Mass</div>
            <div class="body-stat-note">${fatMass !== null ? fatMass + "kg fat mass" : "Add measurements"}</div>
        </div>
    `;
}

// ─── COACH MESSAGES ──────────────────────────────────────────
function generateCoachMessage(profile, macros, consumed, recipes) {
  const { name, goal } = profile;
  const remaining = {
    protein: Math.max(0, macros.protein - consumed.protein),
    calories: Math.max(0, macros.calories - consumed.calories),
  };
  const hour = new Date().getHours();
  const proteinPct = Math.round((consumed.protein / macros.protein) * 100);
  const goalLabel =
    goal === "recomp"
      ? "body recomposition"
      : goal === "muscle"
        ? "muscle gain"
        : "fat loss";
  const highProteinRecipes = recipes
    .filter((r) => r.protein >= 15)
    .sort((a, b) => b.protein - a.protein)
    .slice(0, 2)
    .map((r) => `${r.name} (${r.protein}g protein)`)
    .join(" or ");

  let message = "";
  if (hour < 11) {
    message = `Good morning ${name}! Today's mission for your ${goalLabel} goal: hit ${macros.protein}g protein, ${macros.carbs}g carbs and ${macros.fat}g fat within ${macros.calories} calories. `;
    if (consumed.protein === 0)
      message += `You haven't logged breakfast yet — start strong. `;
    if (highProteinRecipes)
      message += `Try ${highProteinRecipes} from your cookbook for a protein-rich start.`;
  } else if (hour < 15) {
    message = `Hey ${name}! Midday check-in — you've hit ${consumed.protein}g protein so far (${proteinPct}% of your goal). `;
    if (remaining.protein > 60) {
      message += `You still need ${remaining.protein}g protein — make lunch count. `;
      if (highProteinRecipes)
        message += `${highProteinRecipes} would be great choices.`;
    } else if (remaining.protein > 20) {
      message += `Good progress! ${remaining.protein}g protein remaining — dinner and snacks will get you there.`;
    } else {
      message += `Excellent — you're almost at your protein target! Focus on keeping calories in check.`;
    }
  } else if (hour < 19) {
    message = `Afternoon ${name}! You've consumed ${consumed.protein}g of ${macros.protein}g protein. `;
    if (remaining.calories < 300) {
      message += `Running low on calories — choose dinner wisely, prioritize protein over carbs. `;
    } else {
      message += `${remaining.calories} calories and ${remaining.protein}g protein remaining. `;
      if (highProteinRecipes)
        message += `For dinner, ${highProteinRecipes} would help close the gap.`;
    }
  } else {
    message = `Evening ${name}! End of day — ${consumed.protein}g of ${macros.protein}g protein consumed. `;
    if (proteinPct >= 90) {
      message += `Outstanding day! You crushed your protein target. Rest well and come back stronger tomorrow.`;
    } else if (proteinPct >= 70) {
      message += `Solid effort. ${remaining.protein}g short — try paneer, Greek yogurt or roasted chana before bed.`;
    } else {
      message += `${remaining.protein}g short today. Start tomorrow with a high protein breakfast and log every meal. You've got this ${name}.`;
    }
  }
  return message;
}

function generateOnboardingCoachMessage(profile, macros) {
  const { name, weight, goal } = profile;
  const goalMessages = {
    recomp: `Your body recomposition plan uses a slight 5% calorie deficit with very high protein. This protects muscle while your body burns fat. Combining dal, paneer, tofu and legumes daily will be your protein backbone.`,
    muscle: `Your muscle gain plan uses a 10% calorie surplus with high protein to maximize muscle growth. Focus on progressive overload in the gym and hit these numbers consistently.`,
    fatloss: `Your fat loss plan uses a 15% deficit with very high protein at 2.4g per kg bodyweight. This prevents muscle loss while you're cutting. Never skip protein even on rest days.`,
  };
  return `Hey ${name}! Based on your stats — ${weight}kg — your daily targets are ${macros.protein}g protein, ${macros.carbs}g carbs, ${macros.fat}g fat and ${macros.calories} calories. ${goalMessages[goal]} These numbers sync across your entire app. Let's get to work!`;
}

// ─── RENDER ──────────────────────────────────────────────────
function renderMacroRings(macros, consumed) {
  const items = [
    {
      label: "Protein",
      consumed: consumed.protein,
      target: macros.protein,
      unit: "g",
    },
    {
      label: "Carbs",
      consumed: consumed.carbs,
      target: macros.carbs,
      unit: "g",
    },
    { label: "Fat", consumed: consumed.fat, target: macros.fat, unit: "g" },
    {
      label: "Calories",
      consumed: consumed.calories,
      target: macros.calories,
      unit: "kcal",
    },
  ];
  document.getElementById("macroRings").innerHTML = items
    .map((item) => {
      const pct = Math.min(
        100,
        Math.round((item.consumed / item.target) * 100),
      );
      return `
            <div class="macro-ring-card">
                <div class="macro-ring-val">${Math.round(item.consumed)}${item.unit}</div>
                <div class="macro-ring-target">of ${item.target}${item.unit}</div>
                <div class="macro-ring-lbl">${item.label}</div>
                <div class="macro-ring-bar">
                    <div class="macro-ring-fill" style="width:${pct}%"></div>
                </div>
            </div>
        `;
    })
    .join("");
}

function renderMeals(log) {
  MEALS.forEach((meal) => {
    const items = log[meal] || [];
    const container = document.getElementById(`${meal}Items`);
    const totalEl = document.getElementById(`${meal}Total`);
    const totalProtein = items.reduce((sum, i) => sum + (i.protein || 0), 0);
    totalEl.textContent = `${Math.round(totalProtein)}g protein`;
    container.innerHTML = items
      .map(
        (item, idx) => `
            <div class="meal-item">
                <span class="meal-item-name">${item.name}</span>
                <span class="meal-item-macros">${Math.round(item.protein)}g P · ${Math.round(item.carbs)}g C · ${Math.round(item.fat)}g F</span>
                <button class="meal-item-delete" data-meal="${meal}" data-idx="${idx}">✕</button>
            </div>
        `,
      )
      .join("");
    container.querySelectorAll(".meal-item-delete").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const log = await getTodayLog();
        log[btn.dataset.meal].splice(parseInt(btn.dataset.idx), 1);
        await saveTodayLog(log);
        await refreshTracker();
      });
    });
  });
}

async function refreshTracker() {
  const profile = await getProfile();
  if (!profile) return;
  const macros = calculateMacros(profile);
  const log = await getTodayLog();
  const consumed = getMealTotals(log);
  const recipes = await getRecipesFromDB("indian");

  renderMacroRings(macros, consumed);
  renderMeals(log);
  renderBodyStats(profile);

  document.getElementById("coachDailyMessage").textContent =
    generateCoachMessage(profile, macros, consumed, recipes);

  localStorage.setItem("proteinGoal", macros.protein);
  const todayStr = new Date().toDateString();
  const proteinData = JSON.parse(localStorage.getItem("proteinData") || "{}");
  proteinData[todayStr] = Math.round(consumed.protein);
  localStorage.setItem("proteinData", JSON.stringify(proteinData));

  // Sync full macro totals to fitdesiLogs so home page rings stay accurate
  const fitdesiLogs = JSON.parse(localStorage.getItem("fitdesiLogs") || "{}");
  fitdesiLogs[todayStr] = {
    protein: Math.round(consumed.protein),
    carbs:   Math.round(consumed.carbs),
    fat:     Math.round(consumed.fat),
    calories: Math.round(consumed.calories),
  };
  localStorage.setItem("fitdesiLogs", JSON.stringify(fitdesiLogs));
}

// ─── FOOD MODAL ──────────────────────────────────────────────
async function openFoodModal(meal) {
  currentMeal = meal;
  document.getElementById("foodModal").classList.add("open");
  document.getElementById("foodSearch").value = "";
  document.getElementById("manualName").value = "";
  document.getElementById("manualProtein").value = "";
  document.getElementById("manualCarbs").value = "";
  document.getElementById("manualFat").value = "";
  document.getElementById("manualCalories").value = "";
  await renderFoodList("");
}

async function renderFoodList(query) {
  const indianRecipes = await getRecipesFromDB("indian");
  const canadianRecipes = await getRecipesFromDB("canadian");
  const recipes = [...indianRecipes, ...canadianRecipes];
  const filtered = recipes.filter((r) =>
    r.name.toLowerCase().includes(query.toLowerCase()),
  );
  const list = document.getElementById("foodList");
  if (filtered.length === 0) {
    list.innerHTML = `<div style="text-align:center;color:rgba(255,255,255,0.2);font-size:12px;padding:16px">No recipes found — add them in admin panel</div>`;
    return;
  }
  list.innerHTML = filtered
    .map(
      (r, idx) => `
        <div class="food-item" data-idx="${idx}">
            <span class="food-item-name">${r.name}</span>
            <span class="food-item-macros">${r.protein}g P · ${r.carbs}g C · ${r.fat}g F</span>
        </div>
    `,
    )
    .join("");
  list.querySelectorAll(".food-item").forEach((el, i) => {
    el.addEventListener("click", () => addFoodToMeal(filtered[i]));
  });
}

async function addFoodToMeal(food) {
  const log = await getTodayLog();
  log[currentMeal].push({
    name: food.name,
    protein: food.protein || 0,
    carbs: food.carbs || 0,
    fat: food.fat || 0,
    calories: food.calories || 0,
  });
  await saveTodayLog(log);
  document.getElementById("foodModal").classList.remove("open");
  await refreshTracker();
}

// ─── NOTIFICATIONS ───────────────────────────────────────────
function scheduleNotifications() {
  if (!("Notification" in window)) return;
  Notification.requestPermission().then((perm) => {
    if (perm !== "granted") return;
    const name = currentUser?.displayName?.split(" ")[0] || "there";
    const times = {
      breakfast: document.getElementById("notifBreakfast")?.value || "08:00",
      lunch: document.getElementById("notifLunch")?.value || "13:00",
      dinner: document.getElementById("notifDinner")?.value || "20:00",
    };
    const messages = {
      breakfast: `Good morning ${name}! Time to log breakfast and start hitting your protein goal 💪`,
      lunch: `Hey ${name}! Lunch time — log your meal and check your macro progress 🥗`,
      dinner: `Evening ${name}! Dinner check-in — how's your protein looking today? Finish strong 🌙`,
    };
    Object.entries(times).forEach(([meal, time]) => {
      const [h, m] = time.split(":").map(Number);
      const now = new Date();
      const target = new Date();
      target.setHours(h, m, 0, 0);
      if (target <= now) target.setDate(target.getDate() + 1);
      setTimeout(() => {
        new Notification("FitDesi Coach", { body: messages[meal] });
      }, target - now);
    });
  });
}

// ─── MEAL PLANNER ────────────────────────────────────────────
document.getElementById("planMyDayBtn").addEventListener("click", async () => {
  const profile = await getProfile();
  if (!profile) {
    alert("Please complete your profile first.");
    return;
  }
  const macros = calculateMacros(profile);
  const log = await getTodayLog();
  const consumed = getMealTotals(log);
  renderPlannerTargets(macros, consumed);
  document.getElementById("plannerResults").classList.add("hidden");
  document.getElementById("plannerModal").classList.add("open");
  plannerRecipes = await getRecipesFromDB(plannerCuisine);
});

document.getElementById("plannerClose").addEventListener("click", () => {
  document.getElementById("plannerModal").classList.remove("open");
});

document.querySelectorAll(".planner-mode-btn").forEach((btn) => {
  btn.addEventListener("click", async () => {
    document
      .querySelectorAll(".planner-mode-btn")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    plannerMode = btn.dataset.mode;
    const profile = await getProfile();
    if (!profile) return;
    const macros = calculateMacros(profile);
    const log = await getTodayLog();
    const consumed = getMealTotals(log);
    renderPlannerTargets(macros, consumed);
    document.getElementById("plannerResults").classList.add("hidden");
  });
});

document.querySelectorAll(".planner-cuisine-btn").forEach((btn) => {
  btn.addEventListener("click", async () => {
    document
      .querySelectorAll(".planner-cuisine-btn")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    plannerCuisine = btn.dataset.cuisine;
    plannerRecipes = await getRecipesFromDB(plannerCuisine);
    document.getElementById("plannerResults").classList.add("hidden");
  });
});

function renderPlannerTargets(macros, consumed) {
  const isRemaining = plannerMode === "remaining";
  const targets = {
    protein: isRemaining
      ? Math.max(0, macros.protein - Math.round(consumed.protein))
      : macros.protein,
    carbs: isRemaining
      ? Math.max(0, macros.carbs - Math.round(consumed.carbs))
      : macros.carbs,
    fat: isRemaining
      ? Math.max(0, macros.fat - Math.round(consumed.fat))
      : macros.fat,
    calories: isRemaining
      ? Math.max(0, macros.calories - Math.round(consumed.calories))
      : macros.calories,
  };
  document.getElementById("plannerTargets").innerHTML = `
        <div class="planner-target-item">
            <div class="planner-target-val">${targets.protein}g</div>
            <div class="planner-target-lbl">Protein</div>
            ${isRemaining ? `<div class="planner-target-sub">of ${macros.protein}g</div>` : ""}
        </div>
        <div class="planner-target-item">
            <div class="planner-target-val">${targets.carbs}g</div>
            <div class="planner-target-lbl">Carbs</div>
            ${isRemaining ? `<div class="planner-target-sub">of ${macros.carbs}g</div>` : ""}
        </div>
        <div class="planner-target-item">
            <div class="planner-target-val">${targets.fat}g</div>
            <div class="planner-target-lbl">Fat</div>
            ${isRemaining ? `<div class="planner-target-sub">of ${macros.fat}g</div>` : ""}
        </div>
        <div class="planner-target-item">
            <div class="planner-target-val">${targets.calories}</div>
            <div class="planner-target-lbl">Cal</div>
            ${isRemaining ? `<div class="planner-target-sub">of ${macros.calories}</div>` : ""}
        </div>
    `;
  document.getElementById("plannerTargets").dataset.targets =
    JSON.stringify(targets);
}

document
  .getElementById("generatePlanBtn")
  .addEventListener("click", async () => {
    const btn = document.getElementById("generatePlanBtn");
    btn.disabled = true;
    btn.textContent = "⏳ Finding best plan...";

    const targetsRaw =
      document.getElementById("plannerTargets").dataset.targets;
    if (!targetsRaw) {
      btn.disabled = false;
      btn.textContent = "✨ Generate Plan";
      return;
    }
    const targets = JSON.parse(targetsRaw);

    const breakfasts = plannerRecipes.filter((r) => r.category === "breakfast");
    const lunches = plannerRecipes.filter((r) => r.category === "lunch");
    const dinners = plannerRecipes.filter((r) => r.category === "dinner");
    const snacks = plannerRecipes.filter((r) => r.category === "snack");

    if (
      !breakfasts.length ||
      !lunches.length ||
      !dinners.length ||
      !snacks.length
    ) {
      alert(
        "Not enough recipes in the database. Add more recipes in the admin panel first.",
      );
      btn.disabled = false;
      btn.textContent = "✨ Generate Plan";
      return;
    }

    function scoreCombination(b, l, d, s) {
      const total = {
        protein:
          (b.protein || 0) +
          (l.protein || 0) +
          (d.protein || 0) +
          (s.protein || 0),
        carbs:
          (b.carbs || 0) + (l.carbs || 0) + (d.carbs || 0) + (s.carbs || 0),
        fat: (b.fat || 0) + (l.fat || 0) + (d.fat || 0) + (s.fat || 0),
        calories:
          (b.calories || 0) +
          (l.calories || 0) +
          (d.calories || 0) +
          (s.calories || 0),
      };
      return (
        Math.abs(total.protein - targets.protein) * 3 +
        Math.abs(total.carbs - targets.carbs) * 1 +
        Math.abs(total.fat - targets.fat) * 1.5 +
        Math.abs(total.calories - targets.calories) * 0.5
      );
    }

    function sample(arr, n) {
      return [...arr]
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.min(n, arr.length));
    }

    const bS = sample(breakfasts, 5);
    const lS = sample(lunches, 5);
    const dS = sample(dinners, 5);
    const sS = sample(snacks, 5);

    let bestScore = Infinity;
    let bestCombo = { b: bS[0], l: lS[0], d: dS[0], s: sS[0] };

    for (const b of bS)
      for (const l of lS)
        for (const d of dS)
          for (const s of sS) {
            const score = scoreCombination(b, l, d, s);
            if (score < bestScore) {
              bestScore = score;
              bestCombo = { b, l, d, s };
            }
          }

    currentPlan = {
      breakfast: bestCombo.b,
      lunch: bestCombo.l,
      dinner: bestCombo.d,
      snack: bestCombo.s,
    };

    renderPlannerResults(targets);
    document.getElementById("plannerResults").classList.remove("hidden");
    btn.disabled = false;
    btn.textContent = "✨ Generate Plan";
  });

function renderPlannerResults(targets) {
  const meals = ["breakfast", "lunch", "dinner", "snack"];
  const icons = { breakfast: "🌅", lunch: "☀️", dinner: "🌙", snack: "🍎" };

  document.getElementById("plannerMeals").innerHTML = meals
    .map((meal) => {
      const r = currentPlan[meal];
      if (!r) return "";
      return `
            <div class="planner-meal-card">
                <div class="planner-meal-header">
                    <div class="planner-meal-label">${icons[meal]} ${meal}</div>
                    <button class="planner-swap-btn" data-meal="${meal}">⇄ Swap</button>
                </div>
                <div class="planner-meal-name">${r.name}</div>
                <div class="planner-meal-macros">
                    P <span>${r.protein}g</span> · C <span>${r.carbs}g</span> · F <span>${r.fat}g</span> · <span>${r.calories} cal</span>
                </div>
            </div>
        `;
    })
    .join("");

  document.querySelectorAll(".planner-swap-btn").forEach((btn) => {
    btn.addEventListener("click", () => openSwapModal(btn.dataset.meal));
  });

  updatePlannerTotals(targets);
}

function updatePlannerTotals(targets) {
  const totals = { protein: 0, carbs: 0, fat: 0, calories: 0 };
  ["breakfast", "lunch", "dinner", "snack"].forEach((meal) => {
    const r = currentPlan[meal];
    if (r) {
      totals.protein += r.protein || 0;
      totals.carbs += r.carbs || 0;
      totals.fat += r.fat || 0;
      totals.calories += r.calories || 0;
    }
  });

  function diffLabel(actual, target) {
    const diff = actual - target;
    if (Math.abs(diff) < 5) return "";
    if (diff > 0)
      return `<div class="planner-total-diff over">+${diff} over</div>`;
    return `<div class="planner-total-diff under">${diff} under</div>`;
  }

  document.getElementById("plannerTotals").innerHTML = `
        <div class="planner-total-item">
            <div class="planner-total-val">${Math.round(totals.protein)}g</div>
            <div class="planner-total-lbl">Protein</div>
            ${diffLabel(Math.round(totals.protein), targets.protein)}
        </div>
        <div class="planner-total-item">
            <div class="planner-total-val">${Math.round(totals.carbs)}g</div>
            <div class="planner-total-lbl">Carbs</div>
            ${diffLabel(Math.round(totals.carbs), targets.carbs)}
        </div>
        <div class="planner-total-item">
            <div class="planner-total-val">${Math.round(totals.fat)}g</div>
            <div class="planner-total-lbl">Fat</div>
            ${diffLabel(Math.round(totals.fat), targets.fat)}
        </div>
        <div class="planner-total-item">
            <div class="planner-total-val">${Math.round(totals.calories)}</div>
            <div class="planner-total-lbl">Cal</div>
            ${diffLabel(Math.round(totals.calories), targets.calories)}
        </div>
    `;
  document.getElementById("plannerTotals").dataset.targets =
    JSON.stringify(targets);
}

function openSwapModal(meal) {
  swappingMeal = meal;
  document.getElementById("swapModalLabel").textContent =
    `Choose a different ${meal}`;
  const options = plannerRecipes.filter(
    (r) => r.category === meal && r.id !== currentPlan[meal]?.id,
  );
  document.getElementById("swapList").innerHTML =
    options.length > 0
      ? options
          .map(
            (r) => `
            <div class="swap-item" data-id="${r.id}">
                <div class="swap-item-name">${r.name}</div>
                <div class="swap-item-macros">P:${r.protein}g C:${r.carbs}g F:${r.fat}g ${r.calories}cal</div>
            </div>
        `,
          )
          .join("")
      : '<div style="color:rgba(255,255,255,0.2);text-align:center;padding:20px;font-size:12px">No other options available</div>';

  document.querySelectorAll(".swap-item").forEach((el) => {
    el.addEventListener("click", () => {
      const selected = plannerRecipes.find((r) => r.id === el.dataset.id);
      if (selected) {
        currentPlan[swappingMeal] = selected;
        const targets = JSON.parse(
          document.getElementById("plannerTotals").dataset.targets || "{}",
        );
        renderPlannerResults(targets);
        document.getElementById("swapModal").classList.remove("open");
      }
    });
  });
  document.getElementById("swapModal").classList.add("open");
}

document.getElementById("swapModalClose").addEventListener("click", () => {
  document.getElementById("swapModal").classList.remove("open");
});

document
  .getElementById("confirmPlanBtn")
  .addEventListener("click", async () => {
    if (!currentUser) return;
    const dateKey = new Date().toDateString();
    let log;
    if (plannerMode === "full") {
      log = { breakfast: [], lunch: [], snack: [], dinner: [] };
    } else {
      log = await getTodayLog();
    }
    Object.entries(currentPlan).forEach(([meal, recipe]) => {
      if (!recipe) return;
      if (!log[meal]) log[meal] = [];
      log[meal].push({
        name: recipe.name,
        protein: recipe.protein || 0,
        carbs: recipe.carbs || 0,
        fat: recipe.fat || 0,
        calories: recipe.calories || 0,
      });
    });
    await saveTodayLog(log);
    document.getElementById("plannerModal").classList.remove("open");
    await refreshTracker();
    alert("Plan added to today's log! ✓");
  });

document
  .getElementById("generateShoppingListBtn")
  .addEventListener("click", async () => {
    if (!currentPlan) return;
    await generateShoppingList(currentPlan);
    document.getElementById("plannerModal").classList.remove("open");
    document.getElementById("shoppingListSection").style.display = "block";
    document
      .getElementById("shoppingListSection")
      .scrollIntoView({ behavior: "smooth" });
  });

// ─── SHOPPING LIST ───────────────────────────────────────────
async function generateShoppingList(plan) {
  const ingredientsMap = new Map();

  for (const [meal, recipe] of Object.entries(plan)) {
    if (!recipe || !recipe.ingredients) continue;
    for (const ing of recipe.ingredients) {
      const key = ing.name.toLowerCase();
      if (ingredientsMap.has(key)) {
        const existing = ingredientsMap.get(key);
        existing.amount += ing.amount || 0;
      } else {
        ingredientsMap.set(key, {
          name: ing.name,
          amount: ing.amount || 0,
          unit: ing.unit || "g",
        });
      }
    }
  }

  const shoppingList = Array.from(ingredientsMap.values());
  localStorage.setItem("shoppingList", JSON.stringify(shoppingList));
  renderShoppingList(shoppingList);
}

function renderShoppingList(list) {
  const container = document.getElementById("shoppingItems");
  container.innerHTML = list
    .map(
      (item) => `
    <div class="shopping-item">
      <input type="checkbox" class="shopping-checkbox" data-name="${item.name}">
      <span class="shopping-item-name">${item.name}</span>
      <span class="shopping-item-amount">${item.amount}${item.unit}</span>
    </div>
  `,
    )
    .join("");

  // Load checked state
  const checked = JSON.parse(localStorage.getItem("shoppingChecked") || "{}");
  document.querySelectorAll(".shopping-checkbox").forEach((cb) => {
    cb.checked = checked[cb.dataset.name] || false;
    cb.addEventListener("change", () => {
      checked[cb.dataset.name] = cb.checked;
      localStorage.setItem("shoppingChecked", JSON.stringify(checked));
    });
  });
}

document.getElementById("clearShoppingList")?.addEventListener("click", () => {
  localStorage.removeItem("shoppingList");
  localStorage.removeItem("shoppingChecked");
  document.getElementById("shoppingItems").innerHTML = "";
});

// Load shopping list on page load
const savedList = localStorage.getItem("shoppingList");
if (savedList) {
  const list = JSON.parse(savedList);
  renderShoppingList(list);
  document.getElementById("shoppingListSection").style.display = "block";
}

// ─── ALL EVENT LISTENERS ──────────────────────────────────────
document.addEventListener("click", async function (e) {
  if (e.target.classList.contains("option-btn") && e.target.dataset.field) {
    const field = e.target.dataset.field;
    document
      .querySelectorAll(`.option-btn[data-field="${field}"]`)
      .forEach((b) => b.classList.remove("selected"));
    e.target.classList.add("selected");
    if (field === "gender") selectedGender = e.target.dataset.val;
    if (field === "activity") selectedActivity = e.target.dataset.val;
    if (field === "editGender") editGender = e.target.dataset.val;
    if (field === "editActivity") editActivity = e.target.dataset.val;
  }

  if (e.target.closest(".goal-btn")) {
    const btn = e.target.closest(".goal-btn");
    const field = btn.dataset.field;
    if (field === "editGoal") {
      document
        .querySelectorAll('.goal-btn[data-field="editGoal"]')
        .forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
      editGoal = btn.dataset.val;
    } else {
      document
        .querySelectorAll(".goal-btn:not([data-field])")
        .forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
      selectedGoal = btn.dataset.val;
    }
  }

  if (e.target.id === "activityInfo") {
    document.getElementById("activityInfoBox").classList.toggle("hidden");
  }

  if (e.target.id === "weightKg") {
    document.getElementById("weightKg").classList.add("active");
    document.getElementById("weightLbs").classList.remove("active");
    document.getElementById("weightKgInput").classList.remove("hidden");
    document.getElementById("weightLbsInput").classList.add("hidden");
  }
  if (e.target.id === "weightLbs") {
    document.getElementById("weightLbs").classList.add("active");
    document.getElementById("weightKg").classList.remove("active");
    document.getElementById("weightLbsInput").classList.remove("hidden");
    document.getElementById("weightKgInput").classList.add("hidden");
  }

  if (e.target.id === "heightCm") {
    document.getElementById("heightCm").classList.add("active");
    document.getElementById("heightFt").classList.remove("active");
    document.getElementById("heightCmInput").classList.remove("hidden");
    document.getElementById("heightFtInput").classList.add("hidden");
  }
  if (e.target.id === "heightFt") {
    document.getElementById("heightFt").classList.add("active");
    document.getElementById("heightCm").classList.remove("active");
    document.getElementById("heightFtInput").classList.remove("hidden");
    document.getElementById("heightCmInput").classList.add("hidden");
  }

  if (e.target.id === "toStep2") {
    const name = document.getElementById("userName").value.trim();
    const age = document.getElementById("userAge").value;
    const weight = getWeightInKg();
    const height = getHeightInCm();
    if (!name) {
      alert("Please enter your name.");
      return;
    }
    if (!age) {
      alert("Please enter your age.");
      return;
    }
    if (!selectedGender) {
      alert("Please select your gender.");
      return;
    }
    if (!weight) {
      alert("Please enter your weight.");
      return;
    }
    if (!height) {
      alert("Please enter your height.");
      return;
    }
    document.getElementById("step1").classList.add("hidden");
    document.getElementById("step2").classList.remove("hidden");
  }

  if (e.target.id === "toStep1") {
    document.getElementById("step2").classList.add("hidden");
    document.getElementById("step1").classList.remove("hidden");
  }

  if (e.target.id === "toStep3") {
    if (!selectedGoal) {
      alert("Please select your goal.");
      return;
    }
    if (!selectedActivity) {
      alert("Please select your activity level.");
      return;
    }
    const profile = {
      name: document.getElementById("userName").value.trim(),
      age: parseInt(document.getElementById("userAge").value),
      gender: selectedGender,
      weight: getWeightInKg(),
      height: getHeightInCm(),
      neck: parseFloat(document.getElementById("userNeck").value) || 0,
      waist: parseFloat(document.getElementById("userWaist").value) || 0,
      hip: parseFloat(document.getElementById("userHip").value) || 0,
      goal: selectedGoal,
      activity: selectedActivity,
    };
    const macros = calculateMacros(profile);
    document.getElementById("macroResults").innerHTML = `
            <div class="macro-result-card">
                <div class="macro-result-val">${macros.calories}</div>
                <div class="macro-result-lbl">Calories</div>
            </div>
            <div class="macro-result-card">
                <div class="macro-result-val">${macros.protein}g</div>
                <div class="macro-result-lbl">Protein</div>
            </div>
            <div class="macro-result-card">
                <div class="macro-result-val">${macros.carbs}g</div>
                <div class="macro-result-lbl">Carbs</div>
            </div>
            <div class="macro-result-card">
                <div class="macro-result-val">${macros.fat}g</div>
                <div class="macro-result-lbl">Fat</div>
            </div>
        `;
    document.getElementById("coachIntro").textContent =
      `Here are your personalized daily targets, ${profile.name}`;
    document.getElementById("coachMessage").textContent =
      generateOnboardingCoachMessage(profile, macros);
    document.getElementById("step2").classList.add("hidden");
    document.getElementById("step3").classList.remove("hidden");
    window._tempProfile = profile;
  }

  if (e.target.id === "toStep2b") {
    document.getElementById("step3").classList.add("hidden");
    document.getElementById("step2").classList.remove("hidden");
  }

  if (e.target.id === "saveProfile") {
    if (window._tempProfile) {
      await saveProfile(window._tempProfile);
      document.getElementById("onboarding").classList.add("hidden");
      document.getElementById("trackerMain").classList.remove("hidden");
      await refreshTracker();
      scheduleNotifications();
    }
  }

  if (e.target.classList.contains("add-meal-btn")) {
    await openFoodModal(e.target.dataset.meal);
  }

  if (e.target.id === "foodModalClose") {
    document.getElementById("foodModal").classList.remove("open");
  }

  if (e.target.id === "addManualFood") {
    const name = document.getElementById("manualName").value.trim();
    if (!name) {
      alert("Please enter a food name.");
      return;
    }
    await addFoodToMeal({
      name,
      protein: parseFloat(document.getElementById("manualProtein").value) || 0,
      carbs: parseFloat(document.getElementById("manualCarbs").value) || 0,
      fat: parseFloat(document.getElementById("manualFat").value) || 0,
      calories:
        parseFloat(document.getElementById("manualCalories").value) || 0,
    });
  }

  if (e.target.id === "saveNotifications") {
    const times = {
      breakfast: document.getElementById("notifBreakfast").value,
      lunch: document.getElementById("notifLunch").value,
      dinner: document.getElementById("notifDinner").value,
    };
    await saveNotifTimes(currentUser.uid, times);
    scheduleNotifications();
    alert("Notifications saved!");
  }

  if (e.target.id === "resetProfile") {
    if (confirm("Reset your profile? This will clear all your data.")) {
      await saveUserProfile(currentUser.uid, null);
      location.reload();
    }
  }

  if (e.target.id === "editProfileBtn") {
    const profile = await getProfile();
    if (!profile) return;
    editGender = profile.gender || "";
    editGoal = profile.goal || "";
    editActivity = profile.activity || "";
    document.getElementById("editName").value = profile.name || "";
    document.getElementById("editAge").value = profile.age || "";
    document.getElementById("editWeight").value = profile.weight || "";
    document.getElementById("editHeight").value = profile.height || "";
    document.getElementById("editNeck").value = profile.neck || "";
    document.getElementById("editWaist").value = profile.waist || "";
    document.getElementById("editHip").value = profile.hip || "";
    document
      .querySelectorAll('.option-btn[data-field="editGender"]')
      .forEach((b) => {
        b.classList.toggle("selected", b.dataset.val === profile.gender);
      });
    document
      .querySelectorAll('.option-btn[data-field="editActivity"]')
      .forEach((b) => {
        b.classList.toggle("selected", b.dataset.val === profile.activity);
      });
    document
      .querySelectorAll('.goal-btn[data-field="editGoal"]')
      .forEach((b) => {
        b.classList.toggle("selected", b.dataset.val === profile.goal);
      });
    document.getElementById("editModal").classList.add("open");
  }

  if (e.target.id === "editModalClose") {
    document.getElementById("editModal").classList.remove("open");
  }

  if (e.target.id === "editWeightKg") {
    document.getElementById("editWeightKg").classList.add("active");
    document.getElementById("editWeightLbs").classList.remove("active");
    document.getElementById("editWeightKgInput").classList.remove("hidden");
    document.getElementById("editWeightLbsInput").classList.add("hidden");
  }
  if (e.target.id === "editWeightLbs") {
    document.getElementById("editWeightLbs").classList.add("active");
    document.getElementById("editWeightKg").classList.remove("active");
    document.getElementById("editWeightLbsInput").classList.remove("hidden");
    document.getElementById("editWeightKgInput").classList.add("hidden");
  }

  if (e.target.id === "editHeightCm") {
    document.getElementById("editHeightCm").classList.add("active");
    document.getElementById("editHeightFt").classList.remove("active");
    document.getElementById("editHeightCmInput").classList.remove("hidden");
    document.getElementById("editHeightFtInput").classList.add("hidden");
  }
  if (e.target.id === "editHeightFt") {
    document.getElementById("editHeightFt").classList.add("active");
    document.getElementById("editHeightCm").classList.remove("active");
    document.getElementById("editHeightFtInput").classList.remove("hidden");
    document.getElementById("editHeightCmInput").classList.add("hidden");
  }

  if (e.target.id === "saveEditProfile") {
    const name = document.getElementById("editName").value.trim();
    const age = parseInt(document.getElementById("editAge").value);
    const weight = getEditWeightInKg();
    const height = getEditHeightInCm();
    if (
      !name ||
      !age ||
      !weight ||
      !height ||
      !editGender ||
      !editGoal ||
      !editActivity
    ) {
      alert("Please fill in all fields.");
      return;
    }
    const updatedProfile = {
      name,
      age,
      gender: editGender,
      weight,
      height,
      neck: parseFloat(document.getElementById("editNeck").value) || 0,
      waist: parseFloat(document.getElementById("editWaist").value) || 0,
      hip: parseFloat(document.getElementById("editHip").value) || 0,
      goal: editGoal,
      activity: editActivity,
    };
    await saveProfile(updatedProfile);
    document.getElementById("editModal").classList.remove("open");
    await refreshTracker();
    alert("Profile updated!");
  }
});

document.getElementById("foodSearch").addEventListener("input", async (e) => {
  await renderFoodList(e.target.value);
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

  const notifTimes = await getNotifTimes(user.uid);
  if (document.getElementById("notifBreakfast")) {
    document.getElementById("notifBreakfast").value =
      notifTimes.breakfast || "08:00";
    document.getElementById("notifLunch").value = notifTimes.lunch || "13:00";
    document.getElementById("notifDinner").value = notifTimes.dinner || "20:00";
  }

  const profile = await getProfile();
  if (profile) {
    document.getElementById("onboarding").classList.add("hidden");
    document.getElementById("trackerMain").classList.remove("hidden");
    await refreshTracker();
    scheduleNotifications();
  } else {
    document.getElementById("onboarding").classList.remove("hidden");
  }

  // Load progress history
  loadProgressHistory();
});

// ─── PROGRESS TRACKING ──────────────────────────────────────
async function loadProgressHistory() {
  if (!currentUser) return;

  const history = await getProgressHistory(currentUser.uid);
  renderProgressCharts(history);
}

function renderProgressCharts(history) {
  const weightData = history
    .filter((h) => h.weight)
    .map((h) => ({ x: new Date(h.date), y: h.weight }));
  const bodyFatData = history
    .filter((h) => h.bodyFat)
    .map((h) => ({ x: new Date(h.date), y: h.bodyFat }));

  // Weight chart
  const weightCtx = document.getElementById("weightChart");
  if (weightCtx) {
    new Chart(weightCtx, {
      type: "line",
      data: {
        datasets: [
          {
            label: "Weight (kg)",
            data: weightData,
            borderColor: "#7ed99a",
            backgroundColor: "rgba(126, 217, 154, 0.1)",
            tension: 0.4,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            type: "time",
            time: { unit: "day" },
            ticks: { color: "rgba(255,255,255,0.6)" },
            grid: { color: "rgba(255,255,255,0.1)" },
          },
          y: {
            ticks: { color: "rgba(255,255,255,0.6)" },
            grid: { color: "rgba(255,255,255,0.1)" },
          },
        },
        plugins: {
          legend: { display: false },
        },
      },
    });
  }

  // Body fat chart
  const bodyFatCtx = document.getElementById("bodyFatChart");
  if (bodyFatCtx) {
    new Chart(bodyFatCtx, {
      type: "line",
      data: {
        datasets: [
          {
            label: "Body Fat %",
            data: bodyFatData,
            borderColor: "#f0a050",
            backgroundColor: "rgba(240, 160, 80, 0.1)",
            tension: 0.4,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            type: "time",
            time: { unit: "day" },
            ticks: { color: "rgba(255,255,255,0.6)" },
            grid: { color: "rgba(255,255,255,0.1)" },
          },
          y: {
            ticks: { color: "rgba(255,255,255,0.6)" },
            grid: { color: "rgba(255,255,255,0.1)" },
          },
        },
        plugins: {
          legend: { display: false },
        },
      },
    });
  }
}

// Save progress button
document.getElementById("saveProgress")?.addEventListener("click", async () => {
  if (!currentUser) return;

  const weight = parseFloat(document.getElementById("progressWeight").value);
  const bodyFat = parseFloat(document.getElementById("progressBodyFat").value);

  if (!weight && !bodyFat) return;

  await saveProgressEntry(currentUser.uid, { weight, bodyFat });

  // Clear inputs
  document.getElementById("progressWeight").value = "";
  document.getElementById("progressBodyFat").value = "";

  // Reload charts
  loadProgressHistory();
});
