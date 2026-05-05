// ─── COACH.JS ──────────────────────────────────────────────────
// AI Personal Coach for FitDesi - Admin Only

import {
  onAuthStateChanged,
  getUserProfile,
  addMealToLog,
  completeWorkout,
  swapExercise,
  auth,
} from "./firebase.js";

// ─── STATE ──────────────────────────────────────────────────────
let isAdmin = false;
let conversationHistory = [];
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
  console.log("🤖 Coach: initCoach called");

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      console.log("🤖 Coach: No user logged in");
      return;
    }

    console.log("🤖 Coach: User logged in, checking profile...");
    const profile = await getUserProfile(user.uid);
    console.log("🤖 Coach: User profile:", profile);

    if (!profile || !profile.isAdmin) {
      console.log("🤖 Coach: User is not admin");
      return;
    }

    console.log("🤖 Coach: User is admin, initializing coach...");
    isAdmin = true;

    // Create floating button
    createFloatingButton();

    // Create chat sheet
    createChatSheet();

    // Setup voice recognition
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
    <div class="chat-handle"></div>
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
  const handle = chatSheet.querySelector(".chat-handle");
  handle.style.cssText = `
    width: 40px;
    height: 4px;
    background: #7ed99a;
    border-radius: 2px;
    margin: 12px auto;
    cursor: grab;
  `;

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
    // First open - send welcome message
    if (conversationHistory.length === 0) {
      sendWelcomeMessage();
    }
  }
}

// ─── WELCOME MESSAGE ───────────────────────────────────────────
function sendWelcomeMessage() {
  const message = {
    role: "assistant",
    content:
      "Hey Jawand! I'm your personal coach. How's your day going? Ready to crush some goals?",
  };

  addMessage(message);
  showQuickReplies([
    "Great, feeling strong!",
    "A bit tired today",
    "Need meal ideas",
  ]);
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
    const response = await callAnthropicAPI([...conversationHistory], context);

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
    addMessage({
      role: "assistant",
      content: "Sorry, I'm having trouble connecting. Try again?",
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
  context.proteinGoal = localStorage.getItem("proteinGoal") || "169";
  context.todayWorkout = localStorage.getItem("todayWorkout") || "Rest day";

  // From Firebase
  if (auth.currentUser) {
    const profile = await getUserProfile(auth.currentUser.uid);
    if (profile) {
      context.weight = profile.weight || 0;
      context.goal = profile.goal || "recomp";
    }

    // Current streak - simplified, assume from workout logs
    context.streak = 0; // Would need to calculate from Firestore
  }

  return context;
}

// ─── ANTHROPIC API ────────────────────────────────────────────
async function callAnthropicAPI(messages, context) {
  const systemPrompt = `You are Jawand's personal fitness coach inside FitDesi. You know him well: body recomposition goal, 169g protein daily, 300g carbs, 69g fat, 2496 calories. Indian vegetarian and Canadian plant-based food. Workouts 5 days a week.
Personality: direct, warm, like a knowledgeable friend who knows fitness. Maximum 2 sentences per response. No bullet points. Talk like a real person not a bot.
When user mentions eating something, estimate macros from your knowledge. When they are tired suggest the fastest high protein option. When they want to swap food or exercise, do it.
If you take an action include this exact JSON on a new line at the end of your response:
{"action":"add_meal","name":"...","protein":0,"carbs":0,"fat":0,"calories":0,"meal_type":"breakfast"}
or
{"action":"complete_workout"}
or
{"action":"swap_exercise","old":"...","new":"..."}`;

  const payload = {
    model: "claude-sonnet-4-20250514",
    max_tokens: 300,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `Context: Today protein: ${context.todayProtein}g, Goal: ${context.proteinGoal}g, Today's workout: ${context.todayWorkout}, Weight: ${context.weight}kg, Goal: ${context.goal}, Streak: ${context.streak} days\n\n${messages[messages.length - 1].content}`,
      },
    ],
  };

  // Keep last 10 messages for history
  if (messages.length > 10) {
    messages = messages.slice(-10);
  }

  // Add conversation history
  payload.messages.unshift(
    ...messages.slice(0, -1).map((m) => ({
      role: m.role,
      content: m.content,
    })),
  );

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": "YOUR_ANTHROPIC_API_KEY", // Replace with actual key
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  return data.content[0].text;
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
