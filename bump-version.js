#!/usr/bin/env node
// Usage:
//   node bump-version.js patch   → 2.1.3 → 2.1.4   (small change; rolls to minor at 10)
//   node bump-version.js minor   → 2.1.9 → 2.2.0   (notable update; rolls to major at 10)
//   node bump-version.js major   → 2.9.x → 3.0.0   (big release)

const fs = require("fs");
const path = require("path");

const MANIFEST = path.join(__dirname, "manifest.json");
const PROFILE  = path.join(__dirname, "profile.html");
const SW       = path.join(__dirname, "sw.js");

const type = process.argv[2];
if (!type || !["patch", "minor", "major"].includes(type)) {
  console.error("Usage: node bump-version.js [patch|minor|major]");
  process.exit(1);
}

// ── Read current version from manifest.json ──────────────────────
const manifest = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
const current = manifest.version || "1.0.0";
const [maj, min, pat] = current.split(".").map(Number);

// ── Calculate next version ────────────────────────────────────────
// Each number rolls over at 10 — patch stays 0-9, minor stays 0-9
let next;
if (type === "major") {
  next = `${maj + 1}.0.0`;
} else if (type === "minor") {
  const newMin = min + 1;
  next = newMin >= 10 ? `${maj + 1}.0.0` : `${maj}.${newMin}.0`;
} else {
  const newPat = pat + 1;
  if (newPat >= 10) {
    const newMin = min + 1;
    next = newMin >= 10 ? `${maj + 1}.0.0` : `${maj}.${newMin}.0`;
  } else {
    next = `${maj}.${min}.${newPat}`;
  }
}

// ── Update manifest.json ──────────────────────────────────────────
manifest.version = next;
fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");

// ── Update profile.html ───────────────────────────────────────────
let profile = fs.readFileSync(PROFILE, "utf8");
profile = profile.replace(
  /(<span class="settings-row-value">)\d+\.\d+\.\d+(<\/span>)/,
  `$1${next}$2`
);
fs.writeFileSync(PROFILE, profile);

// ── Bump sw.js cache version ──────────────────────────────────────
let sw = fs.readFileSync(SW, "utf8");
const swMatch = sw.match(/const CACHE_NAME = "fitdesi-v(\d+)"/);
if (swMatch) {
  const nextSw = parseInt(swMatch[1]) + 1;
  sw = sw.replace(
    /const CACHE_NAME = "fitdesi-v\d+"/,
    `const CACHE_NAME = "fitdesi-v${nextSw}"`
  );
  fs.writeFileSync(SW, sw);
  console.log(`sw.js cache: fitdesi-v${swMatch[1]} → fitdesi-v${nextSw}`);
}

console.log(`Version: ${current} → ${next}`);
