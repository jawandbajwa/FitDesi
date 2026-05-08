// ─── ONBOARDING.JS ─────────────────────────────────────────────
// First-time user intro slides — shown once, ever.
// Flag stored in Firestore so it persists across sign-outs, devices,
// and browser data clears. localStorage used only as a fast-path cache.

import { onAuthStateChanged, auth, getUserProfile, markOnboardingDone } from "./firebase.js";

const CACHE_KEY = "fitdesi_onboarding_done";

export function initOnboarding() {
  // Fast local cache — skip Firestore read if already confirmed on this device
  if (localStorage.getItem(CACHE_KEY)) return;

  // Wait for auth then check Firestore profile
  onAuthStateChanged(auth, async (user) => {
    if (!user) return;

    const profile = await getUserProfile(user.uid);
    if (profile?.onboardingDone) {
      localStorage.setItem(CACHE_KEY, "true"); // cache for future loads
      return;
    }

    buildOnboarding(user.uid);
  });
}

// ─── SLIDE DEFINITIONS ─────────────────────────────────────────
const SLIDES = [
  {
    tag: "Welcome",
    tagBg: "rgba(126,217,154,0.12)", tagText: "#7ed99a",
    title: "Welcome to FitDesi",
    body: "Track your macros, meals, and workouts — all in one place.",
    buildVisual: buildMacroGrid,
  },
  {
    tag: "Nutrition",
    tagBg: "rgba(52,211,153,0.12)", tagText: "#34d399",
    title: "Track Every Meal",
    body: "Log Indian and Canadian dishes. Watch your macros update in real time.",
    buildVisual: buildNutritionVisual,
  },
  {
    tag: "Workouts",
    tagBg: "rgba(251,146,60,0.12)", tagText: "#fb923c",
    title: "Never Skip a Day",
    body: "Follow your personalized rolling split and log every set.",
    buildVisual: buildWorkoutVisual,
  },
  {
    tag: "AI Coach",
    tagBg: "rgba(167,139,250,0.12)", tagText: "#a78bfa",
    title: "Meet Your Coach",
    body: "5 personality-driven AI coaches always ready to guide and motivate you.",
    buildVisual: buildCoachVisual,
    isLast: true,
  },
];

// ─── BUILD ─────────────────────────────────────────────────────
function buildOnboarding(uid) {
  let current = 0;

  // Overlay
  const overlay = document.createElement("div");
  overlay.style.cssText = `
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.8);
    z-index: 9999;
    display: flex; align-items: center; justify-content: center;
    padding: 24px;
    backdrop-filter: blur(6px);
    opacity: 0; transition: opacity 0.35s ease;
  `;

  // Card
  const card = document.createElement("div");
  card.style.cssText = `
    width: 100%; max-width: 360px;
    background: #122518;
    border-radius: 28px;
    border: 1px solid rgba(126,217,154,0.2);
    box-shadow: 0 24px 64px rgba(0,0,0,0.55);
    overflow: hidden;
    display: flex; flex-direction: column;
    transform: translateY(20px); transition: transform 0.35s ease;
  `;

  // Slide content area
  const slideArea = document.createElement("div");
  slideArea.style.cssText = `
    padding: 36px 28px 20px;
    display: flex; flex-direction: column; align-items: center;
    min-height: 380px;
  `;

  // Bottom bar
  const bottomBar = document.createElement("div");
  bottomBar.style.cssText = `
    padding: 16px 24px 22px;
    display: flex; align-items: center; justify-content: space-between;
    border-top: 1px solid rgba(126,217,154,0.1);
    position: relative;
  `;

  // Left button — Skip on slide 1, ← back on slides 2-4
  const leftBtn = document.createElement("button");
  leftBtn.style.cssText = `
    font-size: 14px; color: rgba(255,255,255,0.35);
    background: none; border: none; cursor: pointer;
    font-weight: 500; font-family: inherit; padding: 8px 4px;
    min-width: 44px; text-align: left;
    transition: color 0.2s;
  `;
  leftBtn.addEventListener("click", () => {
    if (current === 0) {
      dismiss();
    } else {
      current--;
      renderSlide();
    }
  });

  // Dots container — each dot is clickable
  const dotsEl = document.createElement("div");
  dotsEl.style.cssText = `
    position: absolute; left: 50%; transform: translateX(-50%);
    display: flex; gap: 7px; align-items: center;
  `;
  const dots = SLIDES.map((_, i) => {
    const d = document.createElement("div");
    d.style.cssText = `
      height: 7px; border-radius: 4px;
      background: rgba(126,217,154,0.25);
      transition: all 0.3s ease; width: 7px;
      cursor: pointer;
    `;
    d.addEventListener("click", () => { current = i; renderSlide(); });
    dotsEl.appendChild(d);
    return d;
  });

  // Next / Let's Go button
  const nextBtn = document.createElement("button");
  nextBtn.style.cssText = `
    background: #7ed99a; color: #0d150f;
    border: none; border-radius: 50px;
    padding: 11px 22px; font-size: 14px; font-weight: 700;
    cursor: pointer; font-family: inherit;
    transition: background 0.25s, color 0.25s;
  `;
  nextBtn.addEventListener("click", () => {
    if (current < SLIDES.length - 1) {
      current++;
      renderSlide();
    } else {
      dismiss();
    }
  });

  function renderSlide() {
    const s = SLIDES[current];
    slideArea.innerHTML = "";

    // Tag
    const tag = el("div", `
      font-size: 11px; font-weight: 700; text-transform: uppercase;
      letter-spacing: 1.5px; padding: 4px 14px; border-radius: 20px;
      margin-bottom: 16px;
      background: ${s.tagBg}; color: ${s.tagText};
    `, s.tag);

    // Title
    const title = el("div", `
      font-size: 26px; font-weight: 800; color: #fff;
      text-align: center; line-height: 1.2; margin-bottom: 12px;
    `, s.title);

    // Body
    const body = el("div", `
      font-size: 14px; color: rgba(255,255,255,0.5);
      text-align: center; line-height: 1.65; max-width: 280px;
      margin-bottom: 28px;
    `, s.body);

    slideArea.appendChild(tag);
    slideArea.appendChild(title);
    slideArea.appendChild(body);

    const visual = s.buildVisual();
    visual.style.width = "100%";
    slideArea.appendChild(visual);

    // Sync dots
    dots.forEach((d, i) => {
      d.style.width = i === current ? "22px" : "7px";
      d.style.background = i === current ? "#7ed99a" : "rgba(126,217,154,0.25)";
    });

    // Sync left button
    if (current === 0) {
      leftBtn.textContent = "Skip";
      leftBtn.style.color = "rgba(255,255,255,0.35)";
    } else {
      leftBtn.textContent = "← Back";
      leftBtn.style.color = "rgba(255,255,255,0.6)";
    }

    // Sync button
    if (s.isLast) {
      nextBtn.textContent = "Let's Go 🚀";
      nextBtn.style.background = "#a78bfa";
      nextBtn.style.color = "#fff";
    } else {
      nextBtn.textContent = "Next →";
      nextBtn.style.background = "#7ed99a";
      nextBtn.style.color = "#0d150f";
    }
  }

  function dismiss() {
    localStorage.setItem(CACHE_KEY, "true");
    markOnboardingDone(uid).catch(() => {}); // persist to Firestore
    overlay.style.opacity = "0";
    card.style.transform = "translateY(20px)";
    setTimeout(() => overlay.remove(), 350);
  }

  bottomBar.appendChild(leftBtn);
  bottomBar.appendChild(dotsEl);
  bottomBar.appendChild(nextBtn);
  card.appendChild(slideArea);
  card.appendChild(bottomBar);
  overlay.appendChild(card);
  document.body.appendChild(overlay);

  renderSlide();

  // Fade in
  requestAnimationFrame(() => {
    overlay.style.opacity = "1";
    card.style.transform = "translateY(0)";
  });
}

// ─── HELPERS ───────────────────────────────────────────────────
function el(tag, css, text = "") {
  const e = document.createElement(tag);
  e.style.cssText = css;
  if (text) e.textContent = text;
  return e;
}

// ─── VISUAL BUILDERS ───────────────────────────────────────────
function buildMacroGrid() {
  const grid = document.createElement("div");
  grid.style.cssText = "display:grid;grid-template-columns:1fr 1fr;gap:10px;";
  [
    { icon: "🥩", val: "165g", lbl: "Protein" },
    { icon: "🍚", val: "285g", lbl: "Carbs" },
    { icon: "🥑", val: "66g",  lbl: "Fat" },
    { icon: "🔥", val: "2393", lbl: "Calories" },
  ].forEach(({ icon, val, lbl }) => {
    const card = document.createElement("div");
    card.style.cssText = `
      background: rgba(126,217,154,0.07);
      border: 1px solid rgba(126,217,154,0.2);
      border-radius: 16px; aspect-ratio: 1/1;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center; gap: 6px;
    `;
    card.innerHTML = `
      <div style="font-size:26px">${icon}</div>
      <div style="color:#7ed99a;font-size:20px;font-weight:800;line-height:1">${val}</div>
      <div style="color:rgba(255,255,255,0.4);font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">${lbl}</div>
    `;
    grid.appendChild(card);
  });
  return grid;
}

function buildNutritionVisual() {
  const row = document.createElement("div");
  row.style.cssText = "display:flex;gap:10px;";
  [
    { icon: "🍛", name: "Dal Tadka",     macro: "18g protein" },
    { icon: "🫙", name: "Greek Yogurt",  macro: "17g protein" },
    { icon: "🥜", name: "Peanut Butter", macro: "8g protein"  },
  ].forEach(({ icon, name, macro }) => {
    const c = document.createElement("div");
    c.style.cssText = `
      flex:1; background:rgba(126,217,154,0.06);
      border:1px solid rgba(126,217,154,0.15);
      border-radius:16px; padding:16px 8px; text-align:center;
    `;
    c.innerHTML = `
      <div style="font-size:28px;margin-bottom:8px">${icon}</div>
      <div style="color:#fff;font-size:11px;font-weight:600">${name}</div>
      <div style="color:rgba(126,217,154,0.7);font-size:10px;margin-top:4px">${macro}</div>
    `;
    row.appendChild(c);
  });
  return row;
}

function buildWorkoutVisual() {
  const row = document.createElement("div");
  row.style.cssText = "display:flex;gap:7px;";
  [
    { day: "Mon", icon: "🏋️", label: "Push", today: false },
    { day: "Tue", icon: "🦵", label: "Legs", today: true  },
    { day: "Wed", icon: "🔙", label: "Pull", today: false },
    { day: "Thu", icon: "😴", label: "Rest", today: false },
    { day: "Fri", icon: "🏋️", label: "Push", today: false },
  ].forEach(({ day, icon, label, today }) => {
    const c = document.createElement("div");
    c.style.cssText = `
      flex:1; border-radius:12px; padding:10px 4px; text-align:center;
      background:${today ? "rgba(126,217,154,0.15)" : "rgba(126,217,154,0.05)"};
      border:1px solid ${today ? "#7ed99a" : "rgba(126,217,154,0.15)"};
    `;
    c.innerHTML = `
      <div style="color:${today ? "#7ed99a" : "rgba(255,255,255,0.4)"};font-size:9px;font-weight:700;text-transform:uppercase">${day}</div>
      <div style="font-size:18px;margin:5px 0">${icon}</div>
      <div style="color:${today ? "#7ed99a" : "rgba(255,255,255,0.35)"};font-size:9px;font-weight:${today ? "600" : "400"}">${label}</div>
    `;
    row.appendChild(c);
  });
  return row;
}

function buildCoachVisual() {
  const row = document.createElement("div");
  row.style.cssText = "display:flex;gap:8px;align-items:flex-end;justify-content:center;";
  [
    { emoji: "🔥", name: "Vegeta",    bg: "rgba(239,68,68,0.12)",   big: false },
    { emoji: "🌿", name: "Hinata",    bg: "rgba(126,217,154,0.12)", big: false },
    { emoji: "✨", name: "Gojo",      bg: "rgba(99,179,237,0.15)",  big: true  },
    { emoji: "⚡", name: "Levi",      bg: "rgba(251,191,36,0.12)",  big: false },
    { emoji: "💪", name: "All Might", bg: "rgba(167,139,250,0.12)", big: false },
  ].forEach(({ emoji, name, bg, big }) => {
    const wrap = document.createElement("div");
    wrap.style.cssText = "display:flex;flex-direction:column;align-items:center;gap:6px;";
    const size = big ? "68px" : "50px";
    const fs   = big ? "30px" : "22px";
    wrap.innerHTML = `
      <div style="
        width:${size};height:${size};border-radius:50%;
        background:${bg};
        border:${big ? "2px solid #7ed99a" : "1.5px solid rgba(126,217,154,0.2)"};
        box-shadow:${big ? "0 0 20px rgba(126,217,154,0.3)" : "none"};
        display:flex;align-items:center;justify-content:center;font-size:${fs};
      ">${emoji}</div>
      <div style="font-size:10px;color:${big ? "#7ed99a" : "rgba(255,255,255,0.45)"};font-weight:600;text-align:center">${name}</div>
    `;
    row.appendChild(wrap);
  });
  return row;
}
