// ─── COACH.JS ──────────────────────────────────────────────────
// AI Personal Coach for FitDesi
// Styles live in coach.css — this file handles logic only.

import {
  onAuthStateChanged,
  isAdmin,
  getUserProfile,
  getDailyLog,
  getWorkoutCycle,
  getProgressHistory,
  saveCoachChoice,
  addMealToLog,
  completeWorkout,
  swapExercise,
  auth,
} from "./firebase.js";
import { COACHES, getCoach, getCoachPersonality } from "./coaches.js";

// ─── STATE ──────────────────────────────────────────────────────
let currentCoach = null;
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
let quickRepliesContainer = null;

// ─── INIT ──────────────────────────────────────────────────────
export function initCoach() {
  if (coachButton) return;

  onAuthStateChanged(auth, async (user) => {
    if (!user) return;

    const profile = await getUserProfile(user.uid);

    const hasAccess = isAdmin(user) || profile?.isAdmin || profile?.coachEnabled;
    if (!profile || !hasAccess) return;

    if (profile.chosenCoach) {
      currentCoach = getCoach(profile.chosenCoach);
    }

    createFloatingButton();
    createChatSheet();
    setupVoiceRecognition();
  });
}

// ─── FLOATING BUTTON ───────────────────────────────────────────
function createFloatingButton() {
  coachButton = document.createElement("button");
  coachButton.id = "coachButton";
  coachButton.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M12 1C5.93 1 1 5.93 1 12c0 2.76.94 5.3 2.51 7.35L1 23l3.65-1.51C7.7 22.06 10.24 23 13 23c6.07 0 11-4.93 11-11S19.07 1 12 1z" fill="#7ed99a"/>
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

// ─── CHAT SHEET ────────────────────────────────────────────────
function createChatSheet() {
  // Backdrop — click outside sheet to close
  backdrop = document.createElement("div");
  backdrop.id = "coachBackdrop";
  backdrop.addEventListener("click", closeChat);
  document.body.appendChild(backdrop);

  chatSheet = document.createElement("div");
  chatSheet.id = "chatSheet";
  chatSheet.innerHTML = `
    <div class="chat-header">
      <button class="coach-switch-btn">🔄 Pick Coach</button>
      <div class="chat-handle"></div>
      <button class="chat-close">✕</button>
    </div>
    <div class="messages-container"></div>
    <div class="quick-replies"></div>
    <div class="input-area">
      <input type="text" placeholder="Ask your coach..." />
      <button class="send-btn">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M2 12L22 2L12 22L10 14L2 12Z" fill="#0d150f"/>
        </svg>
      </button>
      <button class="mic-btn">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M12 1a4 4 0 0 0-4 4v6a4 4 0 0 0 8 0V5a4 4 0 0 0-4-4z" fill="#7ed99a"/>
          <path d="M19 11a1 1 0 0 0-2 0c0 2.76-2.24 5-5 5s-5-2.24-5-5a1 1 0 0 0-2 0c0 3.53 2.61 6.43 6 6.92V21a1 1 0 0 0 2 0v-3.08c3.39-.49 6-3.39 6-6.92z" fill="#7ed99a"/>
        </svg>
      </button>
    </div>
  `;

  const closeBtn = chatSheet.querySelector(".chat-close");
  closeBtn.addEventListener("click", closeChat);

  // ── Drag to close — whole header is the target ─────────────
  const dragTarget = chatSheet.querySelector(".chat-header");
  let dragStartY = 0;
  let dragStartTime = 0;
  let dragging = false;

  dragTarget.addEventListener("touchstart", (e) => {
    dragStartY = e.touches[0].clientY;
    dragStartTime = Date.now();
    dragging = true;
    chatSheet.style.transition = "none";
  }, { passive: true });

  dragTarget.addEventListener("touchmove", (e) => {
    if (!dragging) return;
    const dy = e.touches[0].clientY - dragStartY;
    if (dy > 0) chatSheet.style.transform = `translateY(${dy}px)`;
  }, { passive: true });

  dragTarget.addEventListener("touchend", (e) => {
    if (!dragging) return;
    dragging = false;
    const dy = e.changedTouches[0].clientY - dragStartY;
    const elapsed = Date.now() - dragStartTime;
    const velocity = dy / Math.max(elapsed, 1); // px/ms
    if (dy > 50 || velocity > 0.4) {
      closeChat();
    } else {
      chatSheet.style.transition = "transform 0.3s ease";
      chatSheet.style.transform = "translateY(0%)";
    }
  });

  const switchBtn = chatSheet.querySelector(".coach-switch-btn");
  function refreshSwitchBtn() {
    switchBtn.textContent = currentCoach
      ? `${currentCoach.emoji} ${currentCoach.name}`
      : "🔄 Pick Coach";
  }
  refreshSwitchBtn();
  chatSheet._refreshSwitchBtn = refreshSwitchBtn;

  switchBtn.addEventListener("click", () => {
    conversationHistory = [];
    welcomeShown = false;
    showCoachPicker();
  });

  messagesContainer = chatSheet.querySelector(".messages-container");
  quickRepliesContainer = chatSheet.querySelector(".quick-replies");

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
  const isOpen = chatSheet.style.display !== "none";

  if (isOpen) {
    closeChat();
  } else {
    // Show backdrop
    backdrop.style.display = "block";
    requestAnimationFrame(() => backdrop.classList.add("visible"));

    chatSheet.style.transition = "transform 0.3s ease";
    chatSheet.style.display = "flex";
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        chatSheet.style.transform = "translateY(0%)";
      });
    });

    if (!currentCoach) {
      showCoachPicker();
    } else if (!welcomeShown) {
      sendWelcomeMessage();
    }
  }
}

// ─── COACH PICKER ──────────────────────────────────────────────
function showCoachPicker() {
  messagesContainer.innerHTML = "";
  quickRepliesContainer.innerHTML = "";

  const picker = document.createElement("div");
  picker.className = "coach-picker";

  const title = document.createElement("div");
  title.className = "coach-picker-title";
  title.textContent = "Choose Your Coach";

  const sub = document.createElement("div");
  sub.className = "coach-picker-sub";
  sub.textContent = "Pick a style that fits you";

  picker.appendChild(title);
  picker.appendChild(sub);

  let selectedId = null;

  Object.values(COACHES).forEach((coach) => {
    const card = document.createElement("div");
    card.className = "coach-pick-card";

    const avatar = document.createElement("div");
    avatar.className = "coach-pick-avatar";
    avatar.textContent = coach.emoji;
    avatar.style.background = coach.avatarBg; // data-driven, stays inline

    const info = document.createElement("div");
    info.className = "coach-pick-info";

    const name = document.createElement("div");
    name.className = "coach-pick-name";
    name.textContent = coach.name;

    const tag = document.createElement("span");
    tag.className = "coach-pick-tag";
    tag.textContent = coach.tag;
    tag.style.background = coach.tagColor.bg;   // data-driven, stays inline
    tag.style.color = coach.tagColor.text;        // data-driven, stays inline

    const desc = document.createElement("div");
    desc.className = "coach-pick-desc";
    desc.textContent = coach.description;

    info.appendChild(name);
    info.appendChild(tag);
    info.appendChild(document.createElement("br"));
    info.appendChild(desc);
    card.appendChild(avatar);
    card.appendChild(info);

    card.addEventListener("click", () => {
      // Deselect all
      picker.querySelectorAll(".coach-pick-card").forEach((c) => {
        c.classList.remove("selected");
        c.querySelector(".pick-check")?.remove();
      });

      // Select this card
      card.classList.add("selected");
      const check = document.createElement("div");
      check.className = "pick-check";
      check.textContent = "✓";
      card.appendChild(check);
      selectedId = coach.id;
      ctaBtn.classList.add("active");
    });

    picker.appendChild(card);
  });

  const ctaBtn = document.createElement("button");
  ctaBtn.className = "coach-cta-btn";
  ctaBtn.textContent = "Let's Go →";

  ctaBtn.addEventListener("click", async () => {
    if (!selectedId || !auth.currentUser) return;
    ctaBtn.textContent = "Saving…";
    ctaBtn.classList.remove("active");
    await saveCoachChoice(auth.currentUser.uid, selectedId);
    currentCoach = getCoach(selectedId);
    if (chatSheet._refreshSwitchBtn) chatSheet._refreshSwitchBtn();
    messagesContainer.innerHTML = "";
    welcomeShown = false;
    sendWelcomeMessage();
  });

  picker.appendChild(ctaBtn);
  messagesContainer.appendChild(picker);
}

// ─── WELCOME MESSAGE ───────────────────────────────────────────
function sendWelcomeMessage() {
  welcomeShown = true;
  const coach = currentCoach;
  const greeting = coach
    ? `${coach.emoji} Hey! I'm Coach ${coach.name}. Ready to get to work?`
    : "Hey! I'm your personal coach. Ready to crush some goals?";

  addMessage({ role: "assistant", content: greeting });
  showQuickReplies(getOpeningQuickReplies());
}

function getOpeningQuickReplies() {
  const hour = new Date().getHours();
  if (hour < 11) return ["What should I eat for breakfast?", "How's my protein target?", "What's my workout today?"];
  if (hour < 15) return ["What should I have for lunch?", "How am I doing today?", "Need a snack idea"];
  if (hour < 20) return ["What's left for dinner?", "I just finished my workout", "How are my macros today?"];
  return ["How'd I do today?", "What's my plan tomorrow?", "I'm feeling tired today"];
}

// ─── SEND MESSAGE ──────────────────────────────────────────────
async function sendMessage(text = null) {
  const messageText = text || inputField.value.trim();
  if (!messageText) return;

  inputField.value = "";

  const userMessage = { role: "user", content: messageText };
  addMessage(userMessage);
  conversationHistory.push(userMessage);

  // Show typing indicator
  quickRepliesContainer.classList.add("dimmed");
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

    quickRepliesContainer.classList.remove("dimmed");
    showQuickReplies(getQuickRepliesForContext(messageContent));
  } catch (error) {
    document.getElementById("coach-typing")?.remove();
    quickRepliesContainer.classList.remove("dimmed");
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

// ─── QUICK REPLIES ────────────────────────────────────────────
function showQuickReplies(replies) {
  quickRepliesContainer.innerHTML = "";
  replies.forEach((reply) => {
    const button = document.createElement("button");
    button.className = "quick-reply-btn";
    button.textContent = reply;
    button.addEventListener("click", () => sendMessage(reply));
    quickRepliesContainer.appendChild(button);
  });
}

function getQuickRepliesForContext(message) {
  const msg = message.toLowerCase();

  if (msg.includes("tired") || msg.includes("rest") || msg.includes("exhausted") || msg.includes("sleep"))
    return ["Still want to train light", "Taking the day off", "What should I eat when tired?"];
  if (msg.includes("recipe") || msg.includes("dal") || msg.includes("paneer") || msg.includes("meal plan"))
    return ["Add that to my log", "Give me something else", "What else is high protein?"];
  if (msg.includes("protein") || msg.includes("macro") || msg.includes("calorie"))
    return ["What should I eat now?", "Log something for me", "How do I hit my goal?"];
  if (msg.includes("workout") || msg.includes("exercise") || msg.includes("train") || msg.includes("gym"))
    return ["Log my workout done", "Swap an exercise", "What muscles am I hitting?"];
  if (msg.includes("weight") || msg.includes("progress") || msg.includes("goal"))
    return ["Am I on track?", "What should I focus on?", "How long will this take?"];

  // Rotate through varied generic replies so it never feels the same
  const pools = [
    ["What should I eat next?", "How are my macros?", "Give me a tip"],
    ["Log my meal", "Check my progress", "What's my workout?"],
    ["I need motivation", "Give me a recipe idea", "How am I doing today?"],
    ["What's high in protein?", "I feel good today", "Any adjustments?"],
  ];
  return pools[Math.floor(Date.now() / 60000) % pools.length];
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

  // From localStorage — instant, no network
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

  // Parallel Firestore reads — all at once, no waterfall
  const [profile, dailyLog, cycle, progress] = await Promise.all([
    getUserProfile(uid).catch(() => null),
    getDailyLog(uid, dateKey).catch(() => ({ breakfast: [], lunch: [], snack: [], dinner: [] })),
    getWorkoutCycle(uid).catch(() => null),
    getProgressHistory(uid).catch(() => []),
  ]);

  // Profile
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

  // Today's food log — build a human-readable meal summary
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

  // Workout split
  if (cycle) {
    context.splitType = cycle.activeSplit || "custom";
    context.currentSet = cycle.currentSet || "A";
  }

  // Weight trend from progress history
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

  const personalityLayer = currentCoach
    ? getCoachPersonality(currentCoach.id)
    : "Be direct, warm, and helpful. Talk like a real person — not a chatbot.";

  const systemPrompt = `${personalityLayer}

━━━ WHO YOU ARE COACHING ━━━
You are the permanent personal coach for ${context.name || "this user"} inside FitDesi — a fitness app built for an Indian-Canadian family. You are not a generic AI assistant. You are THEIR coach and you know everything about them.

━━━ USER PROFILE ━━━
Name: ${context.name || "Unknown"} | Age: ${context.age || "?"} | Gender: ${context.gender || "not set"}
Body: ${context.weight || "?"}${context.weightUnit || "kg"} / ${context.height || "?"}${context.heightUnit || "cm"}
Goal: ${goalLabels[context.goal] || context.goal || "recomp"} | Activity level: ${activityLabels[context.activityLevel] || "moderate"}
Daily targets: ${context.caloriesGoal} cal | ${context.proteinGoal}g protein | ${context.carbsGoal}g carbs | ${context.fatGoal}g fat
Diet: Indian vegetarian and Canadian foods. Trains 5 days/week on a ${context.splitType || "rolling"} split${context.currentSet ? ` (Set ${context.currentSet})` : ""}.

━━━ TODAY — ${context.dateKey || "today"} (${context.timeOfDay || "now"}) ━━━
Meals logged: ${context.mealsToday}
Nutrition so far: ${context.todayCalories} cal | ${context.todayProtein}g protein | ${context.todayCarbs}g carbs | ${context.todayFat}g fat
Still needs: ${context.proteinRemaining}g protein | ${context.calRemaining} cal remaining
Today's workout: ${context.todayWorkout}${context.weightTrend ? `\nWeight trend: ${context.weightTrend}` : ""}${context.latestWeight ? ` (last logged: ${context.latestWeight}${context.weightUnit})` : ""}

━━━ THE APP ━━━
FitDesi has 5 sections you can guide them to:
1. Home — macro rings showing daily progress at a glance
2. Tracker — log meals by meal type (Breakfast / Lunch / Snack / Dinner), tracks all macros in real time
3. Recipes — browse Indian recipes (dal tadka, paneer tikka, chana masala, khichdi, roti, biryani, rajma, aloo gobi, palak paneer, etc.) and Canadian recipes (overnight oats, Greek yogurt bowls, eggs, salmon, chicken breast, peanut butter, protein shakes, etc.). Every recipe has full macros and step-by-step instructions.
4. Workout — log sets and reps per exercise. Rolling split means the cycle continues automatically.
5. Progress — log weight and body fat, view trend charts over time.

━━━ HOW TO COACH ━━━
- You know ${context.name || "them"} personally. Reference their real data naturally in conversation — don't list it robotically.
- Talk like a real person. Some replies are one punchy line. Some are a short paragraph. Match the energy and tone of what they sent you.
- Ask follow-up questions sometimes instead of always giving advice. Show you're actually listening, not just responding.
- When they ask about a meal or recipe from the app, describe it based on your knowledge of Indian/Canadian cuisine and point them to the Recipes tab for exact macros.
- When they mention eating something not yet logged, estimate the macros from your knowledge and offer to add it to their log.
- When they ask what to eat next, look at what they still need today (${context.proteinRemaining}g protein, ${context.calRemaining} cal) and suggest something specific from Indian or Canadian cuisine.
- Track their mood and energy across the conversation — if they seem tired or stressed, adapt your approach.
- When you perform an action, append the JSON on the very last line (no text after it):
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
    generationConfig: { maxOutputTokens: 1200, temperature: 0.85 },
  };

  const response = await fetch(PROXY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Is-Admin": isAdmin(auth.currentUser) ? "true" : "false",
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
