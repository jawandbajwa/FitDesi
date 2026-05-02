// ============================================================
// FITDESI — INGREDIENTS DATABASE
// ============================================================
// HOW IT WORKS:
// - per100g: the base nutritional values (never changes)
// - defaultServing: natural unit label shown to user
// - defaultGrams: gram equivalent of that serving (used in calculations)
// - To calculate macros for any amount:
//   macro = (grams / 100) * per100g.macro
// ============================================================

const ingredients = [

  // ─────────────────────────────────────────────
  // DALS & LEGUMES
  // ─────────────────────────────────────────────

  {
    name: "Toor Dal",
    category: "Grain/Legume",
    defaultServing: "1 katori dry (50g)",
    defaultGrams: 50,
    per100g: { protein: 22.3, carbs: 57.6, fat: 1.7, fiber: 15.0, calories: 335 },
    notes: "IFCT 2017 — use raw/dry weight in recipes"
  },
  {
    name: "Moong Dal (Yellow, split)",
    category: "Grain/Legume",
    defaultServing: "1 katori dry (50g)",
    defaultGrams: 50,
    per100g: { protein: 24.5, carbs: 56.7, fat: 1.2, fiber: 16.3, calories: 334 },
    notes: "IFCT 2017 — easiest to digest dal"
  },
  {
    name: "Chana Dal",
    category: "Grain/Legume",
    defaultServing: "1 katori dry (50g)",
    defaultGrams: 50,
    per100g: { protein: 20.8, carbs: 59.8, fat: 5.3, fiber: 18.6, calories: 360 },
    notes: "IFCT 2017 — high fiber"
  },
  {
    name: "Urad Dal",
    category: "Grain/Legume",
    defaultServing: "1 katori dry (50g)",
    defaultGrams: 50,
    per100g: { protein: 24.0, carbs: 59.6, fat: 1.2, fiber: 1.8, calories: 347 },
    notes: "IFCT 2017 — highest protein dal"
  },
  {
    name: "Masoor Dal (Red Lentil)",
    category: "Grain/Legume",
    defaultServing: "1 katori dry (50g)",
    defaultGrams: 50,
    per100g: { protein: 25.1, carbs: 59.0, fat: 0.7, fiber: 11.7, calories: 343 },
    notes: "IFCT 2017 — iron rich, fastest cooking dal"
  },
  {
    name: "Rajma (Kidney Beans)",
    category: "Grain/Legume",
    defaultServing: "1 katori dry (60g)",
    defaultGrams: 60,
    per100g: { protein: 22.9, carbs: 60.6, fat: 1.3, fiber: 25.0, calories: 346 },
    notes: "IFCT 2017 — soak overnight before cooking"
  },
  {
    name: "Kabuli Chana (Chickpeas)",
    category: "Grain/Legume",
    defaultServing: "1 katori dry (60g)",
    defaultGrams: 60,
    per100g: { protein: 20.1, carbs: 61.0, fat: 3.0, fiber: 15.0, calories: 360 },
    notes: "IFCT 2017 — slow digesting, great for satiety"
  },
  {
    name: "Soya Chunks",
    category: "Grain/Legume",
    defaultServing: "1 serving dry (30g)",
    defaultGrams: 30,
    per100g: { protein: 52.0, carbs: 33.0, fat: 0.5, fiber: 13.0, calories: 345 },
    notes: "Highest plant protein — 30g dry expands to ~90g soaked"
  },
  {
    name: "Whole Moong (Green Gram)",
    category: "Grain/Legume",
    defaultServing: "1 katori dry (50g)",
    defaultGrams: 50,
    per100g: { protein: 24.0, carbs: 56.7, fat: 1.3, fiber: 8.0, calories: 334 },
    notes: "IFCT 2017 — great sprouted for breakfast"
  },
  {
    name: "Lobia (Black Eyed Peas)",
    category: "Grain/Legume",
    defaultServing: "1 katori dry (60g)",
    defaultGrams: 60,
    per100g: { protein: 23.5, carbs: 57.0, fat: 1.5, fiber: 10.8, calories: 342 },
    notes: "IFCT 2017"
  },
  {
    name: "Chana (Bengal Gram whole)",
    category: "Grain/Legume",
    defaultServing: "1 katori dry (60g)",
    defaultGrams: 60,
    per100g: { protein: 17.1, carbs: 60.9, fat: 5.3, fiber: 10.1, calories: 360 },
    notes: "IFCT 2017 — Biki Singh's staple food"
  },

  // ─────────────────────────────────────────────
  // DAIRY & ALTERNATIVES
  // ─────────────────────────────────────────────

  {
    name: "Paneer (full fat)",
    category: "Dairy",
    defaultServing: "1 serving (100g)",
    defaultGrams: 100,
    per100g: { protein: 18.3, carbs: 1.2, fat: 20.8, fiber: 0, calories: 265 },
    notes: "IFCT 2017 — best dairy protein source"
  },
  {
    name: "Paneer (low fat)",
    category: "Dairy",
    defaultServing: "1 serving (100g)",
    defaultGrams: 100,
    per100g: { protein: 18.0, carbs: 3.5, fat: 8.0, fiber: 0, calories: 160 },
    notes: "Made from skimmed milk — better for fat loss"
  },
  {
    name: "Tofu (firm)",
    category: "Dairy Alt",
    defaultServing: "1 serving (100g)",
    defaultGrams: 100,
    per100g: { protein: 8.0, carbs: 2.0, fat: 4.8, fiber: 0.3, calories: 76 },
    notes: "USDA — cholesterol free, vegan alternative to paneer"
  },
  {
    name: "Tofu (extra firm)",
    category: "Dairy Alt",
    defaultServing: "1 serving (100g)",
    defaultGrams: 100,
    per100g: { protein: 9.5, carbs: 2.3, fat: 5.0, fiber: 0.5, calories: 88 },
    notes: "USDA — best for curries and stir fry"
  },
  {
    name: "Greek Yogurt (full fat)",
    category: "Dairy",
    defaultServing: "1 bowl (150g)",
    defaultGrams: 150,
    per100g: { protein: 10.0, carbs: 3.6, fat: 5.0, fiber: 0, calories: 97 },
    notes: "Strained — much higher protein than regular curd"
  },
  {
    name: "Curd / Dahi (full fat)",
    category: "Dairy",
    defaultServing: "1 katori (100g)",
    defaultGrams: 100,
    per100g: { protein: 3.1, carbs: 4.7, fat: 4.1, fiber: 0, calories: 60 },
    notes: "IFCT 2017 — probiotic, post-meal digestion"
  },
  {
    name: "Milk (cow, full fat)",
    category: "Dairy",
    defaultServing: "1 glass (200ml)",
    defaultGrams: 200,
    per100g: { protein: 3.2, carbs: 4.7, fat: 3.9, fiber: 0, calories: 65 },
    notes: "IFCT 2017"
  },
  {
    name: "Milk (buffalo)",
    category: "Dairy",
    defaultServing: "1 glass (200ml)",
    defaultGrams: 200,
    per100g: { protein: 4.3, carbs: 5.1, fat: 7.0, fiber: 0, calories: 97 },
    notes: "IFCT 2017 — higher fat and protein than cow milk"
  },
  {
    name: "Skimmed Milk Powder",
    category: "Dairy",
    defaultServing: "2 tbsp (20g)",
    defaultGrams: 20,
    per100g: { protein: 36.0, carbs: 52.0, fat: 1.0, fiber: 0, calories: 362 },
    notes: "USDA — add to smoothies or oats to boost protein"
  },

  // ─────────────────────────────────────────────
  // GRAINS & CEREALS
  // ─────────────────────────────────────────────

  {
    name: "Basmati Rice (raw)",
    category: "Grain",
    defaultServing: "1 katori raw (60g)",
    defaultGrams: 60,
    per100g: { protein: 6.8, carbs: 78.2, fat: 0.6, fiber: 1.0, calories: 349 },
    notes: "IFCT 2017 — low GI, cook with less water for firmer texture"
  },
  {
    name: "Brown Basmati Rice (raw)",
    category: "Grain",
    defaultServing: "1 katori raw (60g)",
    defaultGrams: 60,
    per100g: { protein: 7.5, carbs: 73.0, fat: 2.5, fiber: 3.5, calories: 355 },
    notes: "Higher fiber than white — better for fat loss"
  },
  {
    name: "Whole Wheat Flour (Atta)",
    category: "Grain",
    defaultServing: "1 roti worth (30g)",
    defaultGrams: 30,
    per100g: { protein: 11.8, carbs: 71.2, fat: 1.7, fiber: 11.2, calories: 341 },
    notes: "IFCT 2017 — staple for roti"
  },
  {
    name: "Suji / Semolina (Rava)",
    category: "Grain",
    defaultServing: "1 serving (50g)",
    defaultGrams: 50,
    per100g: { protein: 10.4, carbs: 73.8, fat: 0.9, fiber: 2.5, calories: 349 },
    notes: "IFCT 2017 — upma, idli, dhokla"
  },
  {
    name: "Oats (rolled)",
    category: "Grain",
    defaultServing: "1 bowl (50g)",
    defaultGrams: 50,
    per100g: { protein: 16.9, carbs: 66.3, fat: 6.9, fiber: 10.6, calories: 389 },
    notes: "USDA — highest protein grain, beta-glucan for heart health"
  },
  {
    name: "Poha (Flattened Rice)",
    category: "Grain",
    defaultServing: "1 serving (60g)",
    defaultGrams: 60,
    per100g: { protein: 6.9, carbs: 77.0, fat: 0.9, fiber: 0.4, calories: 346 },
    notes: "IFCT 2017 — light breakfast option"
  },
  {
    name: "Quinoa (raw)",
    category: "Grain",
    defaultServing: "1 serving (50g)",
    defaultGrams: 50,
    per100g: { protein: 14.1, carbs: 64.2, fat: 6.1, fiber: 7.0, calories: 368 },
    notes: "USDA — only complete protein grain, all amino acids"
  },
  {
    name: "Ragi / Finger Millet",
    category: "Grain",
    defaultServing: "1 serving (40g)",
    defaultGrams: 40,
    per100g: { protein: 7.3, carbs: 72.0, fat: 1.3, fiber: 3.6, calories: 328 },
    notes: "IFCT 2017 — highest calcium grain"
  },
  {
    name: "Bajra / Pearl Millet",
    category: "Grain",
    defaultServing: "1 roti worth (40g)",
    defaultGrams: 40,
    per100g: { protein: 11.8, carbs: 67.5, fat: 5.0, fiber: 1.2, calories: 361 },
    notes: "IFCT 2017 — iron and zinc rich"
  },
  {
    name: "Besan (Chickpea Flour)",
    category: "Grain",
    defaultServing: "1 serving (40g)",
    defaultGrams: 40,
    per100g: { protein: 22.5, carbs: 57.6, fat: 6.7, fiber: 10.9, calories: 387 },
    notes: "IFCT 2017 — high protein flour for chilla, kadhi"
  },

  // ─────────────────────────────────────────────
  // VEGETABLES
  // ─────────────────────────────────────────────

  {
    name: "Spinach (Palak)",
    category: "Vegetable",
    defaultServing: "1 bowl (100g)",
    defaultGrams: 100,
    per100g: { protein: 2.9, carbs: 3.6, fat: 0.7, fiber: 2.2, calories: 23 },
    notes: "IFCT 2017 — iron, folate, add to any dish"
  },
  {
    name: "Onion",
    category: "Vegetable",
    defaultServing: "1 medium (80g)",
    defaultGrams: 80,
    per100g: { protein: 1.2, carbs: 9.3, fat: 0.1, fiber: 1.7, calories: 42 },
    notes: "IFCT 2017 — base for almost every Indian recipe"
  },
  {
    name: "Tomato",
    category: "Vegetable",
    defaultServing: "1 medium (80g)",
    defaultGrams: 80,
    per100g: { protein: 0.9, carbs: 3.9, fat: 0.2, fiber: 1.2, calories: 18 },
    notes: "IFCT 2017 — lycopene, vitamin C"
  },
  {
    name: "Potato",
    category: "Vegetable",
    defaultServing: "1 medium (100g)",
    defaultGrams: 100,
    per100g: { protein: 1.9, carbs: 17.8, fat: 0.1, fiber: 2.2, calories: 70 },
    notes: "IFCT 2017 — limit for fat loss goals"
  },
  {
    name: "Cauliflower (Gobi)",
    category: "Vegetable",
    defaultServing: "1 cup (100g)",
    defaultGrams: 100,
    per100g: { protein: 2.6, carbs: 4.0, fat: 0.4, fiber: 2.0, calories: 25 },
    notes: "IFCT 2017 — low calorie, versatile"
  },
  {
    name: "Peas (Matar, fresh)",
    category: "Vegetable",
    defaultServing: "1 katori (80g)",
    defaultGrams: 80,
    per100g: { protein: 7.2, carbs: 15.6, fat: 0.4, fiber: 5.5, calories: 84 },
    notes: "IFCT 2017 — one of the most protein-rich vegetables"
  },
  {
    name: "Capsicum / Bell Pepper",
    category: "Vegetable",
    defaultServing: "1 medium (80g)",
    defaultGrams: 80,
    per100g: { protein: 1.0, carbs: 6.0, fat: 0.3, fiber: 2.1, calories: 26 },
    notes: "USDA — highest vitamin C vegetable"
  },
  {
    name: "Carrot (Gajar)",
    category: "Vegetable",
    defaultServing: "1 medium (80g)",
    defaultGrams: 80,
    per100g: { protein: 0.9, carbs: 9.6, fat: 0.2, fiber: 2.8, calories: 41 },
    notes: "IFCT 2017 — beta-carotene, eye health"
  },
  {
    name: "Brinjal / Eggplant (Baingan)",
    category: "Vegetable",
    defaultServing: "1 medium (100g)",
    defaultGrams: 100,
    per100g: { protein: 1.4, carbs: 5.7, fat: 0.3, fiber: 3.4, calories: 25 },
    notes: "IFCT 2017"
  },
  {
    name: "Bitter Gourd (Karela)",
    category: "Vegetable",
    defaultServing: "1 medium (80g)",
    defaultGrams: 80,
    per100g: { protein: 2.1, carbs: 4.2, fat: 0.2, fiber: 2.8, calories: 17 },
    notes: "IFCT 2017 — blood sugar control"
  },
  {
    name: "Bottle Gourd (Lauki)",
    category: "Vegetable",
    defaultServing: "1 cup (100g)",
    defaultGrams: 100,
    per100g: { protein: 0.5, carbs: 2.5, fat: 0.1, fiber: 0.5, calories: 14 },
    notes: "IFCT 2017 — very low calorie, good for cutting"
  },
  {
    name: "Fenugreek Leaves (Methi)",
    category: "Vegetable",
    defaultServing: "1 bunch (50g)",
    defaultGrams: 50,
    per100g: { protein: 4.4, carbs: 6.0, fat: 0.9, fiber: 1.1, calories: 49 },
    notes: "IFCT 2017 — high iron, blood sugar control"
  },
  {
    name: "Ginger (Adrak)",
    category: "Vegetable",
    defaultServing: "1 tsp grated (5g)",
    defaultGrams: 5,
    per100g: { protein: 1.8, carbs: 17.0, fat: 0.8, fiber: 2.0, calories: 80 },
    notes: "IFCT 2017 — anti-inflammatory, digestion"
  },
  {
    name: "Garlic (Lehsun)",
    category: "Vegetable",
    defaultServing: "3 cloves (10g)",
    defaultGrams: 10,
    per100g: { protein: 6.3, carbs: 29.0, fat: 0.5, fiber: 2.1, calories: 149 },
    notes: "IFCT 2017 — antimicrobial, heart health"
  },
  {
    name: "Mushroom (Button)",
    category: "Vegetable",
    defaultServing: "1 cup (100g)",
    defaultGrams: 100,
    per100g: { protein: 3.1, carbs: 3.3, fat: 0.3, fiber: 1.0, calories: 22 },
    notes: "USDA — vitamin D, B vitamins, low calorie protein"
  },
  {
    name: "Cucumber (Kheera)",
    category: "Vegetable",
    defaultServing: "1 medium (100g)",
    defaultGrams: 100,
    per100g: { protein: 0.7, carbs: 2.2, fat: 0.1, fiber: 0.5, calories: 13 },
    notes: "IFCT 2017 — hydrating, zero calorie snack"
  },
  {
    name: "Sweet Corn (fresh)",
    category: "Vegetable",
    defaultServing: "1 cob (80g)",
    defaultGrams: 80,
    per100g: { protein: 3.2, carbs: 19.0, fat: 1.2, fiber: 2.7, calories: 96 },
    notes: "USDA"
  },
  {
    name: "Green Chilli",
    category: "Vegetable",
    defaultServing: "1 piece (10g)",
    defaultGrams: 10,
    per100g: { protein: 2.9, carbs: 9.3, fat: 0.6, fiber: 3.0, calories: 40 },
    notes: "IFCT 2017 — capsaicin boosts metabolism"
  },

  // ─────────────────────────────────────────────
  // OILS & FATS
  // ─────────────────────────────────────────────

  {
    name: "Ghee",
    category: "Oil/Fat",
    defaultServing: "1 tsp (5g)",
    defaultGrams: 5,
    per100g: { protein: 0, carbs: 0, fat: 100, fiber: 0, calories: 900 },
    notes: "IFCT 2017 — Varinder Ghuman uses ghee on rice — use sparingly"
  },
  {
    name: "Mustard Oil",
    category: "Oil/Fat",
    defaultServing: "1 tsp (5g)",
    defaultGrams: 5,
    per100g: { protein: 0, carbs: 0, fat: 100, fiber: 0, calories: 884 },
    notes: "USDA — omega-3 rich, common in North India"
  },
  {
    name: "Sunflower Oil",
    category: "Oil/Fat",
    defaultServing: "1 tsp (5g)",
    defaultGrams: 5,
    per100g: { protein: 0, carbs: 0, fat: 100, fiber: 0, calories: 884 },
    notes: "USDA — light, neutral flavour"
  },
  {
    name: "Coconut Oil",
    category: "Oil/Fat",
    defaultServing: "1 tsp (5g)",
    defaultGrams: 5,
    per100g: { protein: 0, carbs: 0, fat: 100, fiber: 0, calories: 884 },
    notes: "USDA — MCTs, common in South Indian cooking"
  },

  // ─────────────────────────────────────────────
  // NUTS & SEEDS
  // ─────────────────────────────────────────────

  {
    name: "Almonds (Badam)",
    category: "Nut/Seed",
    defaultServing: "1 handful (20g)",
    defaultGrams: 20,
    per100g: { protein: 21.2, carbs: 21.7, fat: 49.4, fiber: 12.5, calories: 579 },
    notes: "USDA — vitamin E, pre-soaked is better"
  },
  {
    name: "Cashews (Kaju)",
    category: "Nut/Seed",
    defaultServing: "1 handful (20g)",
    defaultGrams: 20,
    per100g: { protein: 18.2, carbs: 30.2, fat: 43.8, fiber: 3.3, calories: 553 },
    notes: "USDA — magnesium rich"
  },
  {
    name: "Peanuts / Groundnuts",
    category: "Nut/Seed",
    defaultServing: "1 handful (30g)",
    defaultGrams: 30,
    per100g: { protein: 25.8, carbs: 16.1, fat: 49.2, fiber: 8.5, calories: 567 },
    notes: "IFCT 2017 — best budget protein snack"
  },
  {
    name: "Peanut Butter (natural)",
    category: "Nut/Seed",
    defaultServing: "2 tbsp (32g)",
    defaultGrams: 32,
    per100g: { protein: 22.0, carbs: 20.0, fat: 50.0, fiber: 6.0, calories: 588 },
    notes: "USDA — no added sugar variety"
  },
  {
    name: "Walnuts (Akhrot)",
    category: "Nut/Seed",
    defaultServing: "1 handful (20g)",
    defaultGrams: 20,
    per100g: { protein: 15.2, carbs: 13.7, fat: 65.2, fiber: 6.7, calories: 654 },
    notes: "USDA — highest omega-3 nut"
  },
  {
    name: "Flaxseeds (Alsi)",
    category: "Nut/Seed",
    defaultServing: "1 tbsp (10g)",
    defaultGrams: 10,
    per100g: { protein: 18.3, carbs: 28.9, fat: 42.2, fiber: 27.3, calories: 534 },
    notes: "USDA — grind before eating for better absorption"
  },
  {
    name: "Chia Seeds",
    category: "Nut/Seed",
    defaultServing: "1 tbsp (12g)",
    defaultGrams: 12,
    per100g: { protein: 16.5, carbs: 42.1, fat: 30.7, fiber: 34.4, calories: 486 },
    notes: "USDA — complete protein, soak in water before eating"
  },
  {
    name: "Pumpkin Seeds",
    category: "Nut/Seed",
    defaultServing: "1 handful (20g)",
    defaultGrams: 20,
    per100g: { protein: 30.2, carbs: 10.7, fat: 49.1, fiber: 6.0, calories: 559 },
    notes: "USDA — highest protein seed, zinc rich"
  },
  {
    name: "Sesame Seeds (Til)",
    category: "Nut/Seed",
    defaultServing: "1 tbsp (10g)",
    defaultGrams: 10,
    per100g: { protein: 17.7, carbs: 23.5, fat: 49.7, fiber: 11.8, calories: 573 },
    notes: "IFCT 2017 — calcium rich, use in chutney or tadka"
  },

  // ─────────────────────────────────────────────
  // SPICES & CONDIMENTS
  // ─────────────────────────────────────────────

  {
    name: "Turmeric Powder (Haldi)",
    category: "Spice",
    defaultServing: "1/4 tsp (1g)",
    defaultGrams: 1,
    per100g: { protein: 9.7, carbs: 67.1, fat: 3.3, fiber: 21.1, calories: 312 },
    notes: "IFCT 2017 — curcumin, anti-inflammatory"
  },
  {
    name: "Cumin Seeds (Jeera)",
    category: "Spice",
    defaultServing: "1 tsp (3g)",
    defaultGrams: 3,
    per100g: { protein: 17.8, carbs: 44.2, fat: 22.3, fiber: 10.5, calories: 375 },
    notes: "IFCT 2017 — digestion aid, use in tadka"
  },
  {
    name: "Red Chilli Powder",
    category: "Spice",
    defaultServing: "1/2 tsp (2g)",
    defaultGrams: 2,
    per100g: { protein: 12.0, carbs: 49.7, fat: 13.5, fiber: 34.5, calories: 282 },
    notes: "IFCT 2017"
  },
  {
    name: "Garam Masala",
    category: "Spice",
    defaultServing: "1/2 tsp (2g)",
    defaultGrams: 2,
    per100g: { protein: 13.0, carbs: 50.0, fat: 15.0, fiber: 26.0, calories: 360 },
    notes: "Mixed spice blend"
  },
  {
    name: "Salt",
    category: "Spice",
    defaultServing: "1/2 tsp (3g)",
    defaultGrams: 3,
    per100g: { protein: 0, carbs: 0, fat: 0, fiber: 0, calories: 0 },
    notes: "No macros — limit to 2300mg sodium/day"
  },
  {
    name: "Coconut (fresh, grated)",
    category: "Spice",
    defaultServing: "2 tbsp (20g)",
    defaultGrams: 20,
    per100g: { protein: 3.3, carbs: 6.4, fat: 41.6, fiber: 9.0, calories: 354 },
    notes: "IFCT 2017 — MCTs, use in chutneys and curries"
  },
  {
    name: "Curry Leaves",
    category: "Spice",
    defaultServing: "1 sprig (5g)",
    defaultGrams: 5,
    per100g: { protein: 6.1, carbs: 18.7, fat: 1.0, fiber: 6.4, calories: 108 },
    notes: "IFCT 2017 — iron, calcium"
  },
  {
    name: "Coriander Leaves (Dhania)",
    category: "Spice",
    defaultServing: "1 handful (10g)",
    defaultGrams: 10,
    per100g: { protein: 3.3, carbs: 6.3, fat: 0.6, fiber: 2.8, calories: 44 },
    notes: "IFCT 2017 — garnish for every dish"
  },
  {
    name: "Jaggery (Gur)",
    category: "Spice",
    defaultServing: "1 tsp (10g)",
    defaultGrams: 10,
    per100g: { protein: 0.4, carbs: 98.0, fat: 0.1, fiber: 0, calories: 383 },
    notes: "IFCT 2017 — iron, less refined than sugar"
  },

  // ─────────────────────────────────────────────
  // FRUITS
  // ─────────────────────────────────────────────

  {
    name: "Banana (ripe)",
    category: "Fruit",
    defaultServing: "1 medium (100g)",
    defaultGrams: 100,
    per100g: { protein: 1.1, carbs: 22.8, fat: 0.3, fiber: 2.6, calories: 89 },
    notes: "IFCT 2017 — potassium, pre-workout energy"
  },
  {
    name: "Apple",
    category: "Fruit",
    defaultServing: "1 medium (130g)",
    defaultGrams: 130,
    per100g: { protein: 0.3, carbs: 13.8, fat: 0.2, fiber: 2.4, calories: 52 },
    notes: "IFCT 2017 — quercetin, fiber"
  },
  {
    name: "Mango (ripe)",
    category: "Fruit",
    defaultServing: "1 serving (100g)",
    defaultGrams: 100,
    per100g: { protein: 0.6, carbs: 16.9, fat: 0.4, fiber: 1.6, calories: 65 },
    notes: "IFCT 2017 — vitamin A, C, seasonal"
  },
  {
    name: "Dates (Khajoor, dry)",
    category: "Fruit",
    defaultServing: "2 dates (20g)",
    defaultGrams: 20,
    per100g: { protein: 2.5, carbs: 75.0, fat: 0.4, fiber: 8.0, calories: 282 },
    notes: "IFCT 2017 — Biki Singh eats before bed, iron rich"
  },
  {
    name: "Banana (unripe/raw)",
    category: "Fruit",
    defaultServing: "1 medium (100g)",
    defaultGrams: 100,
    per100g: { protein: 1.3, carbs: 23.0, fat: 0.1, fiber: 2.6, calories: 89 },
    notes: "IFCT 2017 — resistant starch, better blood sugar"
  },

  // ─────────────────────────────────────────────
  // PROTEIN SUPPLEMENTS
  // ─────────────────────────────────────────────

  {
    name: "Diesel NZ Whey Isolate",
    category: "Protein Supp",
    defaultServing: "1 scoop (30g)",
    defaultGrams: 30,
    per100g: { protein: 90.0, carbs: 1.7, fat: 0.3, fiber: 0, calories: 370 },
    notes: "Perfect Sports — grass-fed NZ dairy (NZMP), 27g protein per scoop, 0g sugar, stevia sweetened, keto approved"
  },
  {
    name: "Sattu (Roasted Chana Flour)",
    category: "Grain/Legume",
    defaultServing: "2 tbsp (30g)",
    defaultGrams: 30,
    per100g: { protein: 20.6, carbs: 65.2, fat: 6.2, fiber: 1.3, calories: 408 },
    notes: "IFCT 2017 — traditional Bihar/UP protein drink, mix with water and lemon"
  },

];

// ============================================================
// HELPER FUNCTIONS
// ============================================================

// Get macros for a specific ingredient and amount
function getMacros(ingredientName, grams) {
  const ing = ingredients.find(i => i.name.toLowerCase() === ingredientName.toLowerCase());
  if (!ing) {
    console.warn(`Ingredient not found: ${ingredientName}`);
    return null;
  }
  const factor = grams / 100;
  return {
    name: ing.name,
    grams,
    protein: Math.round(ing.per100g.protein * factor * 10) / 10,
    carbs: Math.round(ing.per100g.carbs * factor * 10) / 10,
    fat: Math.round(ing.per100g.fat * factor * 10) / 10,
    fiber: Math.round(ing.per100g.fiber * factor * 10) / 10,
    calories: Math.round(ing.per100g.calories * factor),
  };
}

// Find an ingredient by name
function findIngredient(name) {
  return ingredients.find(i => i.name.toLowerCase().includes(name.toLowerCase()));
}

// Get all ingredients by category
function getByCategory(category) {
  return ingredients.filter(i => i.category === category);
}

module.exports = { ingredients, getMacros, findIngredient, getByCategory };
