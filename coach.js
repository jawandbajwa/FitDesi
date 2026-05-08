// ─── COACH.JS ──────────────────────────────────────────────────
// AI Personal Coach for FitDesi

import {
  onAuthStateChanged,
  isAdmin,
  getUserProfile,
  saveCoachChoice,
  addMealToLog,
  completeWorkout,
  swapExercise,
  auth,
} from "./firebase.js";
import { COACHES, getCoach, getCoachPersonality } from "./coaches.js";

// ─── STATE ──────────────────────────────────────────────────────
let currentCoach = null; // the chosen coach object
let conversationHistory = [];
let welcomeShown = false;
let isListening = false;
let recognition = null;

// ─── DOM ELEMENTS ──────────────────────────────────────────────
let coachButton = null;
let chatSheet = null;
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

    // Show coach if admin OR if admin has enabled coach for this user
    const hasAccess = isAdmin(user) || profile?.isAdmin || profile?.coachEnabled;
    if (!profile || !hasAccess) return;

    // If user already chose a coach, load it — otherwise picker will show on first open
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
  console.log("🤖 Coach: Creating floating button");

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
  coachButton.style.cssText = `
    position: fixed;
    bottom: 85px;
    right: 20px;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: #1e3a24;
    border: 2px solid #7ed99a;
    color: #7ed99a;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 1000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    transition: all 0.3s ease;
  `;

  coachButton.addEventListener("click", toggleChat);
  document.body.appendChild(coachButton);
}

// ─── CHAT SHEET ────────────────────────────────────────────────
function createChatSheet() {
  chatSheet = document.createElement("div");
  chatSheet.id = "chatSheet";
  chatSheet.innerHTML = `
    <div class="chat-header">
      <div class="chat-handle"></div>
      <button class="chat-close">✕</button>
    </div>
    <div class="messages-container"></div>
    <div class="quick-replies"></div>
    <div class="input-area">
      <input type="text" placeholder="Ask your coach..." />
      <button class="mic-btn">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M12 1a4 4 0 0 0-4 4v6a4 4 0 0 0 8 0V5a4 4 0 0 0-4-4z" fill="#7ed99a"/>
          <path d="M19 11a1 1 0 0 0-2 0c0 2.76-2.24 5-5 5s-5-2.24-5-5a1 1 0 0 0-2 0c0 3.53 2.61 6.43 6 6.92V21a1 1 0 0 0 2 0v-3.08c3.39-.49 6-3.39 6-6.92z" fill="#7ed99a"/>
        </svg>
      </button>
    </div>
  `;
  chatSheet.style.cssText = `
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 60vh;
    background: #0d150f;
    border-radius: 20px 20px 0 0;
    z-index: 1001;
    transform: translateY(100%);
    transition: transform 0.3s ease;
    display: flex;
    flex-direction: column;
    box-shadow: 0 -4px 20px rgba(0,0,0,0.5);
  `;

  // Style inner elements
  const header = chatSheet.querySelector(".chat-header");
  header.style.cssText = `
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 12px 20px 4px;
    flex-shrink: 0;
  `;

  const handle = chatSheet.querySelector(".chat-handle");
  handle.style.cssText = `
    width: 40px;
    height: 4px;
    background: #7ed99a;
    border-radius: 2px;
    cursor: grab;
  `;

  const closeBtn = chatSheet.querySelector(".chat-close");
  closeBtn.style.cssText = `
    position: absolute;
    right: 16px;
    top: 50%;
    transform: translateY(-50%);
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: rgba(126,217,154,0.1);
    border: 1px solid rgba(126,217,154,0.3);
    color: #7ed99a;
    font-size: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    line-height: 1;
  `;
  closeBtn.addEventListener("click", () => {
    chatSheet.style.transform = "translateY(100%)";
  });

  messagesContainer = chatSheet.querySelector(".messages-container");
  messagesContainer.style.cssText = `
    flex: 1;
    overflow-y: auto;
    padding: 0 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  `;

  quickRepliesContainer = chatSheet.querySelector(".quick-replies");
  quickRepliesContainer.style.cssText = `
    padding: 0 20px;
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  `;

  const inputArea = chatSheet.querySelector(".input-area");
  inputArea.style.cssText = `
    padding: 16px 20px;
    border-top: 1px solid rgba(126,217,154,0.2);
    display: flex;
    gap: 12px;
    align-items: center;
  `;

  inputField = inputArea.querySelector("input");
  inputField.style.cssText = `
    flex: 1;
    padding: 12px 16px;
    border: 1px solid rgba(126,217,154,0.3);
    border-radius: 24px;
    background: rgba(255,255,255,0.05);
    color: #7ed99a;
    font-size: 16px;
  `;

  micButton = inputArea.querySelector(".mic-btn");
  micButton.style.cssText = `
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: #1e3a24;
    border: 2px solid #7ed99a;
    color: #7ed99a;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  `;

  // Event listeners
  inputField.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
  });

  micButton.addEventListener("click", toggleVoiceInput);

  document.body.appendChild(chatSheet);
}

// ─── TOGGLE CHAT ───────────────────────────────────────────────
function toggleChat() {
  const isOpen = chatSheet.style.transform === "translateY(0%)";
  chatSheet.style.transform = isOpen ? "translateY(100%)" : "translateY(0%)";

  if (!isOpen) {
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
  picker.style.cssText = `padding: 16px 0; display: flex; flex-direction: column; gap: 0;`;

  const title = document.createElement("div");
  title.textContent = "Choose Your Coach";
  title.style.cssText = `font-size: 18px; font-weight: 700; color: #7ed99a; text-align: center; margin-bottom: 4px;`;

  const sub = document.createElement("div");
  sub.textContent = "Pick a style that fits you";
  sub.style.cssText = `font-size: 12px; color: rgba(255,255,255,0.4); text-align: center; margin-bottom: 16px;`;

  picker.appendChild(title);
  picker.appendChild(sub);

  let selectedId = null;

  Object.values(COACHES).forEach((coach) => {
    const card = document.createElement("div");
    card.style.cssText = `
      display: flex; align-items: center; gap: 14px;
      background: rgba(255,255,255,0.04);
      border: 1.5px solid rgba(126,217,154,0.15);
      border-radius: 14px; padding: 14px; margin-bottom: 10px;
      cursor: pointer; transition: all 0.2s; position: relative;
    `;

    const avatar = document.createElement("div");
    avatar.textContent = coach.emoji;
    avatar.style.cssText = `
      width: 48px; height: 48px; border-radius: 50%;
      background: ${coach.avatarBg};
      display: flex; align-items: center; justify-content: center;
      font-size: 22px; flex-shrink: 0;
    `;

    const info = document.createElement("div");
    info.style.cssText = `flex: 1; min-width: 0;`;

    const name = document.createElement("div");
    name.textContent = coach.name;
    name.style.cssText = `font-size: 15px; font-weight: 700; color: #fff; margin-bottom: 3px;`;

    const tag = document.createElement("span");
    tag.textContent = coach.tag;
    tag.style.cssText = `
      display: inline-block; font-size: 10px; font-weight: 600;
      padding: 2px 8px; border-radius: 20px; margin-bottom: 4px;
      text-transform: uppercase; letter-spacing: 0.5px;
      background: ${coach.tagColor.bg}; color: ${coach.tagColor.text};
    `;

    const desc = document.createElement("div");
    desc.textContent = coach.description;
    desc.style.cssText = `font-size: 12px; color: rgba(255,255,255,0.45); line-height: 1.4;`;

    info.appendChild(name);
    info.appendChild(tag);
    info.appendChild(document.createElement("br"));
    info.appendChild(desc);
    card.appendChild(avatar);
    card.appendChild(info);

    card.addEventListener("click", () => {
      // Deselect all
      picker.querySelectorAll(".coach-pick-card").forEach((c) => {
        c.style.borderColor = "rgba(126,217,154,0.15)";
        c.style.background = "rgba(255,255,255,0.04)";
        const chk = c.querySelector(".pick-check");
        if (chk) chk.remove();
      });

      // Select this
      card.style.borderColor = "#7ed99a";
      card.style.background = "rgba(126,217,154,0.1)";
      const check = document.createElement("div");
      check.className = "pick-check";
      check.textContent = "✓";
      check.style.cssText = `
        position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
        width: 22px; height: 22px; background: #7ed99a; color: #0d150f;
        border-radius: 50%; display: flex; align-items: center;
        justify-content: center; font-size: 12px; font-weight: 700; line-height: 22px; text-align: center;
      `;
      card.appendChild(check);
      selectedId = coach.id;
      ctaBtn.style.opacity = "1";
      ctaBtn.style.pointerEvents = "auto";
    });

    card.className = "coach-pick-card";
    picker.appendChild(card);
  });

  const ctaBtn = document.createElement("button");
  ctaBtn.textContent = "Let's Go →";
  ctaBtn.style.cssText = `
    width: 100%; padding: 14px; background: #7ed99a; color: #0d150f;
    font-size: 15px; font-weight: 700; border: none; border-radius: 12px;
    cursor: pointer; opacity: 0.4; pointer-events: none; margin-top: 4px;
    transition: opacity 0.2s;
  `;

  ctaBtn.addEventListener("click", async () => {
    if (!selectedId || !auth.currentUser) return;
    ctaBtn.textContent = "Saving…";
    ctaBtn.style.opacity = "0.6";
    await saveCoachChoice(auth.currentUser.uid, selectedId);
    currentCoach = getCoach(selectedId);
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
  showQuickReplies(["Great, feeling strong!", "A bit tired today", "Need meal ideas"]);
}

// ─── SEND MESSAGE ──────────────────────────────────────────────
async function sendMessage(text = null) {
  const messageText = text || inputField.value.trim();
  if (!messageText) return;

  inputField.value = "";

  // Add user message
  const userMessage = { role: "user", content: messageText };
  addMessage(userMessage);
  conversationHistory.push(userMessage);

  // Clear quick replies
  quickRepliesContainer.innerHTML = "";

  // Get context
  const context = await getContext();

  // Call Anthropic API
  try {
    const response = await callGeminiAPI([...conversationHistory], context);

    // Parse response
    const lines = response.split("\n");
    const lastLine = lines[lines.length - 1];

    let action = null;
    let messageContent = response;

    try {
      action = JSON.parse(lastLine);
      messageContent = lines.slice(0, -1).join("\n");
    } catch (e) {
      // No action JSON
    }

    // Add assistant message
    const assistantMessage = { role: "assistant", content: messageContent };
    addMessage(assistantMessage);
    conversationHistory.push(assistantMessage);

    // Execute action if present
    if (action) {
      await executeAction(action);
    }

    // Show quick replies
    showQuickReplies(getQuickRepliesForContext(messageContent));
  } catch (error) {
    console.error("Coach API error:", error);
    let errorMsg = "Sorry, I'm having trouble connecting. Try again?";
    if (
      error.message.includes("API key") ||
      error.message.includes("not configured")
    ) {
      errorMsg = "⚠️ Coach proxy not reachable. Make sure the Cloudflare Worker is deployed.";
    }
    addMessage({
      role: "assistant",
      content: errorMsg,
    });
  }
}

// ─── ADD MESSAGE ───────────────────────────────────────────────
function addMessage(message) {
  const messageEl = document.createElement("div");
  messageEl.className = `message ${message.role}`;
  messageEl.innerHTML = `<div class="message-content">${message.content}</div>`;

  messageEl.style.cssText = `
    align-self: ${message.role === "user" ? "flex-end" : "flex-start"};
    max-width: 80%;
    padding: 12px 16px;
    border-radius: 18px;
    background: ${message.role === "user" ? "#7ed99a" : "#1e3a24"};
    color: ${message.role === "user" ? "#1e3a24" : "#7ed99a"};
    border: 1px solid ${message.role === "user" ? "#7ed99a" : "rgba(126,217,154,0.3)"};
  `;

  messagesContainer.appendChild(messageEl);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// ─── QUICK REPLIES ────────────────────────────────────────────
function showQuickReplies(replies) {
  quickRepliesContainer.innerHTML = "";

  replies.forEach((reply) => {
    const button = document.createElement("button");
    button.textContent = reply;
    button.style.cssText = `
      padding: 8px 16px;
      border: 1px solid rgba(126,217,154,0.3);
      border-radius: 16px;
      background: rgba(126,217,154,0.1);
      color: #7ed99a;
      cursor: pointer;
      font-size: 14px;
    `;

    button.addEventListener("click", () => sendMessage(reply));
    quickRepliesContainer.appendChild(button);
  });
}

function getQuickRepliesForContext(message) {
  // Simple context detection
  if (
    message.toLowerCase().includes("tired") ||
    message.toLowerCase().includes("rest")
  ) {
    return [
      "Need a quick protein hit",
      "Skip workout today",
      "Light cardio instead",
    ];
  }
  if (
    message.toLowerCase().includes("meal") ||
    message.toLowerCase().includes("eat")
  ) {
    return ["Already ate", "Give me options", "Too busy right now"];
  }
  if (
    message.toLowerCase().includes("workout") ||
    message.toLowerCase().includes("exercise")
  ) {
    return ["Too tired", "Sounds good", "Swap for something else"];
  }
  return ["Thanks!", "Tell me more", "Got any tips?"];
}

// ─── VOICE RECOGNITION ─────────────────────────────────────────
function setupVoiceRecognition() {
  if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      isListening = true;
      micButton.style.borderColor = "#7ed99a";
      micButton.style.boxShadow = "0 0 0 3px rgba(126,217,154,0.3)";
    };

    recognition.onend = () => {
      isListening = false;
      micButton.style.borderColor = "#7ed99a";
      micButton.style.boxShadow = "none";
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      sendMessage(transcript);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      isListening = false;
      micButton.style.borderColor = "#7ed99a";
      micButton.style.boxShadow = "none";
    };
  }
}

function toggleVoiceInput() {
  if (!recognition) return;

  if (isListening) {
    recognition.stop();
  } else {
    recognition.start();
  }
}

// ─── GET CONTEXT ───────────────────────────────────────────────
async function getContext() {
  const context = {};

  // From localStorage
  const proteinData = JSON.parse(localStorage.getItem("proteinData") || "{}");
  const today = new Date().toDateString();
  context.todayProtein = proteinData[today] || 0;
  context.proteinGoal = parseInt(localStorage.getItem("proteinGoal") || "0");
  context.carbsGoal   = parseInt(localStorage.getItem("carbsGoal")   || "0");
  context.fatGoal     = parseInt(localStorage.getItem("fatGoal")      || "0");
  context.caloriesGoal = parseInt(localStorage.getItem("caloriesGoal") || "0");
  context.todayWorkout = localStorage.getItem("todayWorkout") || "Rest day";

  // From Firebase
  if (auth.currentUser) {
    const profile = await getUserProfile(auth.currentUser.uid);
    if (profile) {
      context.name           = profile.name || auth.currentUser.displayName || "there";
      context.weight         = profile.weight || 0;
      context.height         = profile.height || 0;
      context.age            = profile.age || 0;
      context.gender         = profile.gender || "male";
      context.goal           = profile.goal || "recomp";
      context.activityLevel  = profile.activity || "moderate";
      context.weightUnit     = profile.weightUnit || "kg";
    }
    context.streak = 0;
  }

  return context;
}

// ─── GOOGLE GEMINI API ──────────────────────────────────────────
// On the live site all requests go through the Cloudflare Worker proxy
// (key is stored as a Worker secret — never exposed to the browser).
// For local dev, coach-config.js can export GEMINI_PROXY_URL to override.
const LIVE_PROXY_URL = "https://fitdesi-gemini.jawandbajwa.workers.dev";
let PROXY_URL = LIVE_PROXY_URL;
import("./coach-config.js")
  .then((cfg) => { if (cfg.GEMINI_PROXY_URL) PROXY_URL = cfg.GEMINI_PROXY_URL; })
  .catch(() => {});

async function callGeminiAPI(messages, context) {
  const goalLabels = { recomp: "body recomposition", muscle: "muscle gain", fatloss: "fat loss" };
  const activityLabels = { sedentary: "sedentary", light: "lightly active", moderate: "moderately active", active: "very active" };

  const personalityLayer = currentCoach
    ? getCoachPersonality(currentCoach.id)
    : "Be direct, warm, and helpful. Max 2 sentences per response. No bullet points.";

  const systemPrompt = `${personalityLayer}

USER PROFILE — ${context.name}:
- Age: ${context.age}, Gender: ${context.gender}
- Weight: ${context.weight}${context.weightUnit}, Height: ${context.height}cm
- Activity: ${activityLabels[context.activityLevel] || "moderately active"}
- Fitness goal: ${goalLabels[context.goal] || context.goal}
- Daily targets: ${context.caloriesGoal} cal, ${context.proteinGoal}g protein, ${context.carbsGoal}g carbs, ${context.fatGoal}g fat
- Diet: Indian vegetarian and Canadian plant-based foods. Workouts 5 days a week.

RULES:
- Always address them by name (${context.name})
- When they mention eating something, estimate macros from your knowledge
- Suggest fast high-protein options when tired
- Swap food or exercises on request
- If you take an action include this exact JSON on a new line at the end:
{"action":"add_meal","name":"...","protein":0,"carbs":0,"fat":0,"calories":0,"meal_type":"breakfast"}
or {"action":"complete_workout"}
or {"action":"swap_exercise","old":"...","new":"..."}`;

  const contextText = `Today so far: ${context.todayProtein}g protein of ${context.proteinGoal}g goal. Today's workout: ${context.todayWorkout}. Streak: ${context.streak} days.`;

  // Keep last 10 messages for history
  if (messages.length > 10) {
    messages = messages.slice(-10);
  }

  // Build proper Gemini multi-turn conversation format
  const contents = messages.map((msg, i) => {
    let text = msg.content;
    // Inject context into the first user message
    if (i === 0 && msg.role === "user") {
      text = `${contextText}\n\n${text}`;
    }
    return {
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text }],
    };
  });

  // Gemini requires the conversation to start with a user turn
  if (!contents.length || contents[0].role !== "user") {
    contents.unshift({ role: "user", parts: [{ text: contextText }] });
  }

  const payload = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents,
    generationConfig: {
      maxOutputTokens: 300,
      temperature: 0.7,
    },
  };

  const response = await fetch(PROXY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "API request failed");
  }

  const data = await response.json();

  if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
    throw new Error("Invalid API response");
  }

  return data.candidates[0].content.parts[0].text;
}

// ─── EXECUTE ACTION ────────────────────────────────────────────
async function executeAction(action) {
  if (!auth.currentUser) return;

  try {
    const uid = auth.currentUser.uid;
    const today = new Date().toISOString().split("T")[0];

    switch (action.action) {
      case "add_meal":
        await addMealToLog(uid, action);
        showToast("Added to your log");
        break;
      case "complete_workout":
        await completeWorkout(uid, today);
        showToast("Workout marked done");
        break;
      case "swap_exercise":
        await swapExercise(uid, today, action.old, action.new);
        showToast("Exercise swapped");
        break;
    }
  } catch (error) {
    console.error("Action execution error:", error);
    showToast("Action failed");
  }
}

// ─── TOAST ────────────────────────────────────────────────────
function showToast(message) {
  const toast = document.createElement("div");
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 100px;
    left: 50%;
    transform: translateX(-50%);
    background: #7ed99a;
    color: #1e3a24;
    padding: 12px 24px;
    border-radius: 24px;
    z-index: 1002;
    font-weight: bold;
  `;

  document.body.appendChild(toast);
  setTimeout(() => document.body.removeChild(toast), 3000);
}
