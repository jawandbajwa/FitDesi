const tips = [
  "Combine dal with rice to get a complete amino acid profile — essential for muscle building.",
  "Paneer is one of the best vegetarian protein sources — 100g gives you about 18g of protein.",
  "Eat your largest meal within 2 hours after your workout for best muscle recovery.",
  "Soaked chana has more bioavailable protein than unsoaked — prep it the night before.",
  "Greek yogurt with fruit is a perfect high protein vegetarian snack between meals.",
  "Tofu absorbs flavors well and packs 8g protein per 100g — great for Indian curries.",
  "Hydration matters as much as protein — drink at least 3 litres of water on workout days.",
];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getDate() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function getDailyTip() {
  const day = new Date().getDay();
  return tips[day % tips.length];
}

function getTodayWorkout() {
  const stored = localStorage.getItem("todayWorkout");
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      return null;
    }
  }
  return null;
}

function getProteinGoal() {
  const goal = localStorage.getItem("proteinGoal");
  return goal ? goal + "g" : "—";
}

function getProteinToday() {
  const today = new Date().toDateString();
  const data = JSON.parse(localStorage.getItem("proteinData") || "{}");
  return data[today] ? data[today] + "g" : "0g";
}

// Set greeting and date
document.getElementById("greeting").textContent = getGreeting();
document.getElementById("currentDate").textContent = getDate();
document.getElementById("dailyTip").textContent = getDailyTip();

// Set protein stats
document.getElementById("proteinToday").textContent = getProteinToday();
document.getElementById("proteinGoal").textContent = getProteinGoal();

// Set today's workout from exercise cycle
const todayWorkout = getTodayWorkout();
const workoutEl = document.getElementById("todayWorkout");
if (workoutEl) {
  if (todayWorkout) {
    if (todayWorkout.isCardio) {
      workoutEl.innerHTML = `
                <span class="workout-day">Today</span>
                <span class="workout-muscles cardio">${todayWorkout.icon} ${todayWorkout.name}</span>
            `;
    } else {
      workoutEl.innerHTML = `
                <span class="workout-day">Today's Workout</span>
                <span class="workout-muscles">${todayWorkout.icon} ${todayWorkout.name}</span>
            `;
    }
  } else {
    workoutEl.innerHTML = `
            <span class="workout-day">Today</span>
            <span class="workout-muscles empty">Set up your cycle in the Exercise page</span>
        `;
  }
}
