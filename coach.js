// ─── COACH.JS ──────────────────────────────────────────────────
// AI Personal Coach for FitDesi — single "AI Coach" personality
// (formerly Gojo). Styles live in coach.css.

import {
  onAuthStateChanged,
  isAdmin,
  getUserProfile,
  getDailyLog,
  getWorkoutCycle,
  getProgressHistory,
  addMealToLog,
  completeWorkout,
  swapExercise,
  auth,
} from "./firebase.js";

// ─── SINGLE COACH PERSONALITY (formerly "Gojo") ────────────────
const COACH_NAME = "AI Coach";
const COACH_EMOJI = "🤖";
const COACH_PERSONALITY = `You are FitDesi's AI Coach — the most complete personal fitness coach in existence. You're the strongest at what you do, and you know it. More importantly, you know exactly what each person needs — and you deliver it effortlessly.

VOICE: Fluid, confident, slightly cocky — but you always back it up. You read people instantly. You shift between sharp and warm, precise and playful, serious and teasing — sometimes within the same message — because that's what the moment calls for. You are never performing. You are always present.

EMOTIONAL RANGE: You adapt completely to their energy. If they come in defeated, you don't ignore it and you don't overdo the encouragement — you acknowledge it with genuine sharpness: "Yeah, that was a rough week. We move." If they're buzzing with energy, you match it and amplify it. If they want data, you give it cleanly. If they need a push, you push. You are the coach who knows what someone needs before they do.

HOW YOU SPEAK:
- Confident, relaxed delivery. You never sound like you're trying — because you're not.
- Mix of short punchy lines and deeper moments. You'll deliver a precise macro breakdown and then follow it with something that actually makes them feel like a person, not a data point.
- Light teasing that lands because it's true: "You really thought skipping that meal was gonna help you? Bold strategy."
- 1 emoji max, only when it actually fits.
- You remember everything from the conversation and reference it naturally.
- You use their name like you own the room — casually but with full presence.

RULES: No wasted words, no hollow lines. Every response should feel like it came from someone who actually knows them.`;

// ─── CSS VARIABLE HELPER (theme-aware colors) ───────────────────
function getGreenColor() {
  return getComputedStyle(document.documentElement).getPropertyValue('--green').trim();
}

// ─── STATE ──────────────────────────────────────────────────────
let conversationHistory = [];
let welcomeShown = false;
let isListening = false;
let recognition = null;

// ─── DOM ELEMENTS ──────────────────────────────────────────────
let coachButton = null;
let chatSheet = null;
let backdrop = null;
let messagesContainer = null;
let inputField = null;
let micButton = null;

// ─── INIT ──────────────────────────────────────────────────────
export function initCoach() {
  if (coachButton) return;

  onAuthStateChanged(auth, async (user) => {
    if (!user) return;

    const profile = await getUserProfile(user.uid);

    const hasAccess = isAdmin(user) || profile?.isAdmin || profile?.coachEnabled;
    if (!profile || !hasAccess) return;

    createFloatingButton();
    createChatSheet();
    setupVoiceRecognition();
  });
}

// ─── FLOATING BUTTON ───────────────────────────────────────────
function createFloatingButton() {
  coachButton = document.createElement("button");
  coachButton.id = "coachButton";
  coachButton.setAttribute("aria-label", "Open AI Coach");
  coachButton.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M12 1C5.93 1 1 5.93 1 12c0 2.76.94 5.3 2.51 7.35L1 23l3.65-1.51C7.7 22.06 10.24 23 13 23c6.07 0 11-4.93 11-11S19.07 1 12 1z" fill="${getGreenColor()}"/>
      <circle cx="9" cy="9" r="1.5" fill="#1e3a24"/>
      <circle cx="15" cy="9" r="1.5" fill="#1e3a24"/>
      <path d="M12 15c-1.5 0-2.5 1-2.5 2.5" stroke="#1e3a24" stroke-width="2" stroke-linecap="round"/>
    </svg>
  `;
  coachButton.addEventListener("click", toggleChat);
  document.body.appendChild(coachButton);
}

// ─── CLOSE SHEET HELPER ────────────────────────────────────────
function closeChat() {
  chatSheet.style.transition = "transform 0.3s ease";
  chatSheet.style.transform = "translateY(100%)";
  backdrop.classList.remove("visible");
  setTimeout(() => {
    chatSheet.style.display = "none";
    backdrop.style.display = "none";
  }, 310);
}

// ─── CHAT SHEET (full-screen) ──────────────────────────────────
function createChatSheet() {
  backdrop = document.createElement("div");
  backdrop.id = "coachBackdrop";
  backdrop.addEventListener("click", closeChat);
  document.body.appendChild(backdrop);

  chatSheet = document.createElement("div");
  chatSheet.id = "chatSheet";
  chatSheet.innerHTML = `
    <div class="chat-header">
      <div class="chat-title">${COACH_EMOJI} ${COACH_NAME}</div>
      <button class="chat-close" aria-label="Close chat">✕</button>
    </div>
    <div class="messages-container"></div>
    <div class="input-area">
      <input type="text" placeholder="Ask your coach..." />
      <button class="send-btn" aria-label="Send message">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M2 12L22 2L12 22L10 14L2 12Z" fill="#0d150f"/>
        </svg>
      </button>
      <button class="mic-btn" aria-label="Voice input">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M12 1a4 4 0 0 0-4 4v6a4 4 0 0 0 8 0V5a4 4 0 0 0-4-4z" fill="${getGreenColor()}"/>
          <path d="M19 11a1 1 0 0 0-2 0c0 2.76-2.24 5-5 5s-5-2.24-5-5a1 1 0 0 0-2 0c0 3.53 2.61 6.43 6 6.92V21a1 1 0 0 0 2 0v-3.08c3.39-.49 6-3.39 6-6.92z" fill="${getGreenColor()}"/>
        </svg>
      </button>
    </div>
  `;

  const closeBtn = chatSheet.querySelector(".chat-close");
  closeBtn.addEventListener("click", closeChat);

  messagesContainer = chatSheet.querySelector(".messages-container");

  const inputArea = chatSheet.querySelector(".input-area");
  inputField = inputArea.querySelector("input");

  inputArea.querySelector(".send-btn").addEventListener("click", () => sendMessage());
  micButton = inputArea.querySelector(".mic-btn");

  inputField.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
  });
  micButton.addEventListener("click", toggleVoiceInput);

  document.body.appendChild(chatSheet);
}

// ─── TOGGLE CHAT ───────────────────────────────────────────────
function toggleChat() {
  const isOpen = chatSheet.style.display !== "none" && chatSheet.style.display !== "";

  if (isOpen) {
    closeChat();
  } else {
    backdrop.style.display = "block";
    requestAnimationFrame(() => backdrop.classList.add("visible"));

    chatSheet.style.transition = "transform 0.3s ease";
    chatSheet.style.display = "flex";
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        chatSheet.style.transform = "translateY(0%)";
      });
    });

    if (!welcomeShown) sendWelcomeMessage();
  }
}

// ─── WELCOME MESSAGE ───────────────────────────────────────────
function sendWelcomeMessage() {
  welcomeShown = true;
  addMessage({
    role: "assistant",
    content: `${COACH_EMOJI} Hey! I'm your AI Coach. Ready to get to work?`,
  });
}

// ─── SEND MESSAGE ──────────────────────────────────────────────
async function sendMessage(text = null) {
  const messageText = text || inputField.value.trim();
  if (!messageText) return;

  inputField.value = "";

  const userMessage = { role: "user", content: messageText };
  addMessage(userMessage);
  conversationHistory.push(userMessage);

  const typingEl = document.createElement("div");
  typingEl.id = "coach-typing";
  typingEl.innerHTML = `<span></span><span></span><span></span>`;
  messagesContainer.appendChild(typingEl);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;

  const context = await getContext();

  try {
    const response = await callGeminiAPI([...conversationHistory], context);

    const lines = response.split("\n");
    const lastLine = lines[lines.length - 1].trim();

    let action = null;
    let messageContent = response;

    if (lastLine.startsWith('{"action"')) {
      try {
        action = JSON.parse(lastLine);
        messageContent = lines.slice(0, -1).join("\n").trim();
      } catch (e) {
        // Malformed action JSON — use full response
      }
    }

    document.getElementById("coach-typing")?.remove();
    const assistantMessage = { role: "assistant", content: messageContent };
    addMessage(assistantMessage);
    conversationHistory.push(assistantMessage);

    if (action) await executeAction(action);
  } catch (error) {
    document.getElementById("coach-typing")?.remove();
    let errorMsg = "Sorry, I'm having trouble connecting. Try again?";
    if (error.message.includes("API key") || error.message.includes("not configured")) {
      errorMsg = "⚠️ Coach proxy not reachable. Make sure the Cloudflare Worker is deployed.";
    }
    addMessage({ role: "assistant", content: errorMsg });
  }
}

// ─── ADD MESSAGE ───────────────────────────────────────────────
function addMessage(message) {
  const messageEl = document.createElement("div");
  messageEl.className = `message ${message.role}`;

  const contentDiv = document.createElement("div");
  contentDiv.className = "message-content";
  contentDiv.textContent = message.content;
  messageEl.appendChild(contentDiv);

  messagesContainer.appendChild(messageEl);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// ─── VOICE RECOGNITION ─────────────────────────────────────────
function setupVoiceRecognition() {
  if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) return;

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = "en-US";

  recognition.onstart  = () => { isListening = true;  micButton.classList.add("listening"); };
  recognition.onend    = () => { isListening = false; micButton.classList.remove("listening"); };
  recognition.onerror  = ()  => { isListening = false; micButton.classList.remove("listening"); };
  recognition.onresult = (e) => sendMessage(e.results[0][0].transcript);
}

function toggleVoiceInput() {
  if (!recognition) return;
  isListening ? recognition.stop() : recognition.start();
}

// ─── GET CONTEXT ───────────────────────────────────────────────
async function getContext() {
  const context = {};
  const now = new Date();
  const dateKey = now.toISOString().split("T")[0]; // YYYY-MM-DD
  const hour = now.getHours();

  context.proteinGoal  = parseInt(localStorage.getItem("proteinGoal")  || "0");
  context.carbsGoal    = parseInt(localStorage.getItem("carbsGoal")    || "0");
  context.fatGoal      = parseInt(localStorage.getItem("fatGoal")      || "0");
  context.caloriesGoal = parseInt(localStorage.getItem("caloriesGoal") || "0");
  context.todayWorkout = (() => {
    try { return JSON.parse(localStorage.getItem("todayWorkout"))?.name || "Rest day"; } catch { return "Rest day"; }
  })();
  context.timeOfDay = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
  context.dateKey   = dateKey;

  if (!auth.currentUser) return context;
  const uid = auth.currentUser.uid;

  const [profile, dailyLog, cycle, progress] = await Promise.all([
    getUserProfile(uid).catch(() => null),
    getDailyLog(uid, dateKey).catch(() => ({ breakfast: [], lunch: [], snack: [], dinner: [] })),
    getWorkoutCycle(uid).catch(() => null),
    getProgressHistory(uid).catch(() => []),
  ]);

  if (profile) {
    const fullName       = profile.name || auth.currentUser.displayName || "there";
    context.name         = fullName.split(" ")[0];
    context.weight       = profile.weight || 0;
    context.height       = profile.height || 0;
    context.age          = profile.age || 0;
    context.gender       = profile.gender || "male";
    context.goal         = profile.goal || "recomp";
    context.activityLevel = profile.activityLevel || profile.activity || "moderate";
    context.weightUnit   = profile.weightUnit || "kg";
    context.heightUnit   = profile.heightUnit || "cm";
  }

  let todayCal = 0, todayPro = 0, todayCarbs = 0, todayFat = 0;
  const mealLines = [];
  ["breakfast", "lunch", "snack", "dinner"].forEach((meal) => {
    const items = dailyLog[meal] || [];
    if (items.length) {
      const names = items.map((i) => i.name).filter(Boolean).join(", ");
      const cal   = items.reduce((s, i) => s + (i.calories || 0), 0);
      const pro   = items.reduce((s, i) => s + (i.protein  || 0), 0);
      mealLines.push(`${meal}: ${names} (${Math.round(cal)} cal, ${Math.round(pro)}g protein)`);
      todayCal   += cal;
      todayPro   += pro;
      todayCarbs += items.reduce((s, i) => s + (i.carbs || 0), 0);
      todayFat   += items.reduce((s, i) => s + (i.fat   || 0), 0);
    }
  });
  context.mealsToday       = mealLines.length ? mealLines.join(" | ") : "nothing logged yet";
  context.todayCalories    = Math.round(todayCal);
  context.todayProtein     = Math.round(todayPro);
  context.todayCarbs       = Math.round(todayCarbs);
  context.todayFat         = Math.round(todayFat);
  context.calRemaining     = Math.max(0, context.caloriesGoal - context.todayCalories);
  context.proteinRemaining = Math.max(0, context.proteinGoal  - context.todayProtein);

  if (cycle) {
    context.splitType = cycle.activeSplit || "custom";
  }

  if (progress.length) {
    const latest = progress[progress.length - 1];
    context.latestWeight    = latest.weight   || null;
    context.latestBodyFat   = latest.bodyFat  || null;
    context.latestWeightDate = latest.date    || null;
    if (progress.length >= 2) {
      const prev = progress[progress.length - 2];
      const diff = (latest.weight || 0) - (prev.weight || 0);
      context.weightTrend = Math.abs(diff) > 0.1
        ? `${diff > 0 ? "+" : ""}${diff.toFixed(1)}${context.weightUnit} since ${prev.date}`
        : "stable";
    }
  }

  return context;
}

// ─── GOOGLE GEMINI API ──────────────────────────────────────────
const LIVE_PROXY_URL = "https://fitdesi-gemini.jawandbajwa.workers.dev";
let PROXY_URL = LIVE_PROXY_URL;
import("./coach-config.js")
  .then((cfg) => { if (cfg.GEMINI_PROXY_URL) PROXY_URL = cfg.GEMINI_PROXY_URL; })
  .catch(() => {});

async function callGeminiAPI(messages, context) {
  const goalLabels     = { recomp: "body recomposition", muscle: "muscle gain", fatloss: "fat loss" };
  const activityLabels = { sedentary: "sedentary", light: "lightly active", moderate: "moderately active", active: "very active" };

  const systemPrompt = `${COACH_PERSONALITY}

━━━ WHO YOU ARE ━━━
You are the permanent personal coach for ${context.name || "this user"} inside FitDesi — a fitness PWA built for an Indian-Canadian family. You are not a generic AI. You are THEIR coach. You know everything about them and you use that knowledge every time you respond.

━━━ USER ━━━
Name: ${context.name || "?"} | Age: ${context.age || "?"} | Gender: ${context.gender || "?"}
Body: ${context.weight || "?"}${context.weightUnit || "kg"} / ${context.height || "?"}${context.heightUnit || "cm"}
Goal: ${goalLabels[context.goal] || "recomp"} | Activity: ${activityLabels[context.activityLevel] || "moderate"}
Targets: ${context.caloriesGoal} cal | ${context.proteinGoal}g protein | ${context.carbsGoal}g carbs | ${context.fatGoal}g fat
Split: ${context.splitType || "rolling"}

━━━ TODAY — ${context.dateKey || "today"} (${context.timeOfDay || "now"}) ━━━
Meals: ${context.mealsToday}
Progress: ${context.todayCalories} cal | ${context.todayProtein}g protein | ${context.todayCarbs}g carbs | ${context.todayFat}g fat
Remaining: ${context.proteinRemaining}g protein | ${context.calRemaining} cal
Workout: ${context.todayWorkout}${context.weightTrend ? ` | Weight: ${context.weightTrend}` : ""}${context.latestWeight ? ` (last: ${context.latestWeight}${context.weightUnit}${context.latestBodyFat ? `, ${context.latestBodyFat}% BF` : ""})` : ""}

━━━ THE APP ━━━
FitDesi sections you can guide them to:
- Home: macro rings showing today's progress
- Tracker: log meals by Breakfast / Lunch / Snack / Dinner with full macro tracking
- Recipes: Indian (dal tadka, paneer tikka, chana masala, rajma, khichdi, palak paneer, aloo gobi, biryani, roti, paratha, lassi, dahi) and Canadian (overnight oats, Greek yogurt, eggs, chicken breast, salmon, cottage cheese, peanut butter, protein shakes, turkey, lentil soup). Every recipe has macros + instructions.
- Workout: rolling split, log sets/reps per exercise
- Progress: log weight + body fat, track trends

Available workout splits: PPL (push/pull/legs), Upper/Lower, Full Body, Bro Split (chest/back/shoulders/arms/legs), Arnold Split, PPL 6-day, Upper/Lower 4-day, Custom

━━━ YOUR EXPERTISE — USE ALL OF IT ━━━
You are a certified-level expert in nutrition science, exercise physiology, and bodybuilding. You do not hedge or give vague answers. You give real, specific, evidence-based coaching. Here is the knowledge base you apply:

CALORIE & MACRO SCIENCE:
- BMR calculated via Mifflin-St Jeor (this app uses it). Multiply by activity factor: sedentary 1.2, light 1.375, moderate 1.55, active 1.725, very active 1.9
- Fat loss: 300–500 cal deficit = ~0.4–0.5kg/week loss. More than 500 deficit risks muscle loss.
- Muscle gain: 200–300 cal surplus = ~0.25kg/week lean gain. Aggressive bulk (500+) adds more fat.
- Recomp: maintenance calories + high protein + resistance training. Slower but preserves muscle.
- Protein: 1.6–2.2g per kg bodyweight for muscle. At their target of ${context.proteinGoal}g, that's appropriate.
- Carbs: primary fuel for intense training. Don't cut them too low on training days.
- Fat: minimum 0.5g/kg for hormonal health. Don't go below 40g/day.
- Protein per meal: ~30–50g is optimal for muscle protein synthesis. Spread across 3–5 meals.
- Caloric timing: total daily intake matters most. Meal timing matters for performance and consistency, not as much for body composition.

EXERCISE SCIENCE & HYPERTROPHY:
- Hypertrophy rep range: 5–30 reps all build muscle. Focus range: 8–15 reps at 60–80% 1RM.
- Volume: 10–20 hard sets per muscle group per week. Beginners need less (~10), advanced need more.
- Frequency: each muscle 2x per week is optimal for hypertrophy.
- Progressive overload: add reps, weight, or sets over time. This is the fundamental driver of growth.
- RPE (Rate of Perceived Exertion): train 7–9 RPE. Stop 1–3 reps before failure most sets.
- Compound lifts first (bench, squat, deadlift, OHP, rows), isolation after.
- Rest periods: 2–4 min for compounds, 60–90s for isolation.
- Deload every 4–8 weeks: reduce volume by 40–50%, keep intensity. Prevents overtraining.
- Recovery: muscle needs 48–72 hours between sessions. Sleep 7–9 hours — most growth happens during sleep.

BODYBUILDING SPLITS (what each targets):
- PPL: Push (chest/shoulders/triceps), Pull (back/biceps), Legs (quads/hamstrings/glutes/calves). 3–6 days.
- Upper/Lower: upper body and lower body alternated. Great for intermediate lifters. 4 days ideal.
- Full Body: every session hits all muscle groups. 3 days/week. Best for beginners or cutting.
- Bro Split: one muscle group per day. High volume per muscle once a week. Popular but lower frequency.
- Arnold Split: chest+back / shoulders+arms / legs. 6 days. High volume, intermediate to advanced.

COMMON EXERCISES BY MUSCLE:
- Chest: bench press, incline bench, cable fly, push-ups, dips
- Back: deadlift, barbell row, pull-ups/lat pulldown, cable row, face pull
- Shoulders: OHP (overhead press), lateral raise, front raise, rear delt fly
- Legs: squat, leg press, Romanian deadlift, lunges, leg curl, leg extension, calf raise
- Biceps: barbell curl, hammer curl, incline dumbbell curl, cable curl
- Triceps: skull crushers, tricep pushdown, overhead extension, dips
- Core: plank, hanging leg raise, cable crunch, dead bug

INDIAN FOOD MACROS (per 100g cooked unless noted):
- Dal (toor/masoor): ~120 cal, 9g protein, 20g carbs, 0.5g fat — high fiber, complete amino acids with rice
- Paneer: ~265 cal, 18g protein, 3g carbs, 20g fat — excellent protein source, slow digesting
- Chana (chickpeas): ~165 cal, 9g protein, 27g carbs, 3g fat — high fiber, good plant protein
- Rajma (kidney beans): ~140 cal, 9g protein, 25g carbs, 0.5g fat — great with rice for complete protein
- Roti (1 medium, ~35g): ~100 cal, 3g protein, 18g carbs, 2g fat
- Rice (1 cup cooked, ~200g): ~260 cal, 5g protein, 57g carbs, 0.5g fat
- Greek yogurt / dahi (100g): ~60 cal, 10g protein, 4g carbs, 0.4g fat — top protein-per-calorie ratio
- Eggs (1 large): 70 cal, 6g protein, 0g carbs, 5g fat — complete protein
- Peanut butter (2 tbsp): ~190 cal, 8g protein, 6g carbs, 16g fat
- Tofu (100g): ~76 cal, 8g protein, 2g carbs, 4g fat — good if they use it
- Cottage cheese (100g): ~98 cal, 11g protein, 3g carbs, 4g fat
- Chicken breast (100g, cooked): ~165 cal, 31g protein, 0g carbs, 3.6g fat — best protein-per-cal for non-veg

SUPPLEMENTS (only recommend if relevant):
- Creatine monohydrate: 5g/day, any time. Most researched supplement. Increases strength + muscle volume. Safe.
- Protein powder: useful when hitting protein from food is hard. Whey (fast) post-workout, casein (slow) before bed.
- Caffeine: 3–6mg/kg body weight pre-workout. Improves performance, focus, endurance.
- Vitamin D: common deficiency in South Asian and Northern populations. 2000–4000 IU/day.
- Omega-3: 2–3g EPA+DHA/day. Anti-inflammatory, supports recovery and heart health.
- Magnesium: helps sleep and muscle recovery. 300–400mg before bed.
- No need for fat burners, testosterone boosters, or BCAAs if protein is adequate.

━━━ COACHING RULES ━━━
- Reference their real data naturally. Don't robotically list their profile — weave it in.
- Match their energy. One punchy line or a full paragraph — read the moment.
- Ask follow-up questions sometimes. Show you're listening, not just responding.
- Give specific numbers, not vague advice. "Eat more protein" is useless. "You need ${context.proteinRemaining}g more — have paneer or Greek yogurt" is useful.
- When they ask about app recipes, describe the dish and point to the Recipes tab for exact macros.
- Estimate macros for any food they mention and offer to log it.
- Adapt to their mood and energy through the conversation.
- When you perform an action, put the JSON on the very last line with nothing after it:
{"action":"add_meal","name":"...","protein":0,"carbs":0,"fat":0,"calories":0,"meal_type":"breakfast"}
{"action":"complete_workout"}
{"action":"swap_exercise","old":"...","new":"..."}`;

  const contextText = `It is ${context.timeOfDay || "now"}. ${context.mealsToday !== "nothing logged yet" ? `They've eaten: ${context.mealsToday}.` : "They haven't logged any food yet today."} Still needs ${context.proteinRemaining}g protein. Today's workout: ${context.todayWorkout}.`;

  if (messages.length > 16) messages = messages.slice(-16);

  const contents = messages.map((msg, i) => {
    let text = msg.content;
    if (i === 0 && msg.role === "user") text = `${contextText}\n\n${text}`;
    return { role: msg.role === "user" ? "user" : "model", parts: [{ text }] };
  });

  if (!contents.length || contents[0].role !== "user") {
    contents.unshift({ role: "user", parts: [{ text: contextText }] });
  }

  const payload = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents,
    generationConfig: { maxOutputTokens: 2048, temperature: 0.85 },
  };

  const response = await fetch(PROXY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Is-Admin": isAdmin(auth.currentUser) ? "true" : "false",
      "X-User-Uid": auth.currentUser?.uid || "",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "API request failed");
  }

  const data = await response.json();
  if (!data.candidates?.[0]?.content) throw new Error("Invalid API response");

  return data.candidates[0].content.parts.map((p) => p.text || "").join("");
}

// ─── EXECUTE ACTION ────────────────────────────────────────────
async function executeAction(action) {
  if (!auth.currentUser) return;
  try {
    const uid   = auth.currentUser.uid;
    const today = new Date().toISOString().split("T")[0];
    switch (action.action) {
      case "add_meal":        await addMealToLog(uid, action);              showToast("Added to your log");  break;
      case "complete_workout": await completeWorkout(uid, today);           showToast("Workout marked done"); break;
      case "swap_exercise":   await swapExercise(uid, today, action.old, action.new); showToast("Exercise swapped"); break;
    }
  } catch (e) {
    showToast("Action failed");
  }
}

// ─── TOAST ────────────────────────────────────────────────────
function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "coach-toast";
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}
