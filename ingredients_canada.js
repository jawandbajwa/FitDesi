// ============================================================
// FITDESI — CANADIAN INGREDIENTS DATABASE
// ============================================================
// Available at: Walmart, Superstore, Costco, Loblaws, No Frills,
//               Sobeys, Metro, T&T, Indian grocery stores in Canada
// Sources: USDA FoodData Central, Health Canada CNF, verified
//          Canadian nutrition databases
// All per100g values are RAW/DRY unless noted
// ============================================================

const canadianIngredients = [

  // ─────────────────────────────────────────────
  // LEGUMES & BEANS (all available canned or dry)
  // ─────────────────────────────────────────────

  {
    name: "Black Beans (dry)",
    category: "Grain/Legume",
    defaultServing: "1/2 cup dry (90g)",
    defaultGrams: 90,
    per100g: { protein: 21.6, carbs: 62.4, fat: 0.9, fiber: 15.5, calories: 341 },
    store: "Walmart / Superstore / No Frills",
    notes: "USDA — staple for burritos, tacos, rice bowls"
  },
  {
    name: "Black Beans (canned, drained)",
    category: "Grain/Legume",
    defaultServing: "1/2 can (120g drained)",
    defaultGrams: 120,
    per100g: { protein: 8.9, carbs: 16.6, fat: 0.5, fiber: 7.5, calories: 109 },
    store: "Walmart / Superstore / No Frills",
    notes: "USDA — rinse before use to reduce sodium"
  },
  {
    name: "Chickpeas (canned, drained)",
    category: "Grain/Legume",
    defaultServing: "1/2 can (120g drained)",
    defaultGrams: 120,
    per100g: { protein: 8.9, carbs: 27.4, fat: 2.6, fiber: 7.6, calories: 164 },
    store: "Walmart / Superstore / No Frills",
    notes: "USDA — ready to use, great for curries, salads, roasting"
  },
  {
    name: "Red Lentils (dry)",
    category: "Grain/Legume",
    defaultServing: "1/2 cup dry (100g)",
    defaultGrams: 100,
    per100g: { protein: 25.1, carbs: 59.0, fat: 0.7, fiber: 11.7, calories: 343 },
    store: "Walmart / Superstore / T&T / Indian Grocery",
    notes: "USDA — fastest cooking lentil, no soaking needed"
  },
  {
    name: "Green Lentils (dry)",
    category: "Grain/Legume",
    defaultServing: "1/2 cup dry (100g)",
    defaultGrams: 100,
    per100g: { protein: 25.8, carbs: 60.1, fat: 0.8, fiber: 30.5, calories: 352 },
    store: "Walmart / Superstore",
    notes: "USDA — high fiber, holds shape when cooked, great for salads"
  },
  {
    name: "Kidney Beans (canned, drained)",
    category: "Grain/Legume",
    defaultServing: "1/2 can (120g drained)",
    defaultGrams: 120,
    per100g: { protein: 8.7, carbs: 22.8, fat: 0.5, fiber: 6.4, calories: 127 },
    store: "Walmart / Superstore / No Frills",
    notes: "USDA — canned = no soaking needed"
  },
  {
    name: "Edamame (frozen, shelled)",
    category: "Grain/Legume",
    defaultServing: "1 cup (155g)",
    defaultGrams: 155,
    per100g: { protein: 11.9, carbs: 8.9, fat: 5.2, fiber: 5.2, calories: 121 },
    store: "Costco / Walmart / T&T",
    notes: "USDA — complete soy protein, microwave in 3 min"
  },
  {
    name: "Split Yellow Peas (dry)",
    category: "Grain/Legume",
    defaultServing: "1/2 cup dry (100g)",
    defaultGrams: 100,
    per100g: { protein: 25.0, carbs: 60.4, fat: 1.1, fiber: 16.3, calories: 341 },
    store: "Walmart / Superstore — very cheap in Canada",
    notes: "USDA — Canadian staple, makes great dhal-style soup"
  },
  {
    name: "Hummus (store-bought)",
    category: "Grain/Legume",
    defaultServing: "3 tbsp (50g)",
    defaultGrams: 50,
    per100g: { protein: 7.9, carbs: 14.3, fat: 9.6, fiber: 6.0, calories: 177 },
    store: "Walmart / Superstore / Costco",
    notes: "USDA — Sabra or PC brand widely available"
  },

  // ─────────────────────────────────────────────
  // DAIRY & DAIRY ALTERNATIVES
  // ─────────────────────────────────────────────

  {
    name: "Cottage Cheese (2% fat)",
    category: "Dairy",
    defaultServing: "1/2 cup (113g)",
    defaultGrams: 113,
    per100g: { protein: 12.4, carbs: 3.4, fat: 2.3, fiber: 0, calories: 84 },
    store: "Walmart / Superstore / Costco",
    notes: "USDA — Canadian bodybuilder staple, high casein protein"
  },
  {
    name: "Greek Yogurt (plain, 0% fat)",
    category: "Dairy",
    defaultServing: "3/4 cup (175g)",
    defaultGrams: 175,
    per100g: { protein: 10.2, carbs: 3.6, fat: 0.4, fiber: 0, calories: 59 },
    store: "Walmart / Superstore / Costco (Oikos, Liberte, PC)",
    notes: "USDA — highest protein yogurt, use as sour cream substitute"
  },
  {
    name: "Greek Yogurt (plain, 2% fat)",
    category: "Dairy",
    defaultServing: "3/4 cup (175g)",
    defaultGrams: 175,
    per100g: { protein: 10.0, carbs: 3.8, fat: 2.0, fiber: 0, calories: 73 },
    store: "Walmart / Superstore",
    notes: "USDA — Oikos and Liberte widely available in Canada"
  },
  {
    name: "Milk (2% fat, pasteurized)",
    category: "Dairy",
    defaultServing: "1 cup (250ml)",
    defaultGrams: 250,
    per100g: { protein: 3.4, carbs: 5.0, fat: 2.0, fiber: 0, calories: 52 },
    store: "Everywhere — Neilson, Dairyland, Natrel",
    notes: "Health Canada CNF — Canadian standard dairy"
  },
  {
    name: "Cheddar Cheese (mild)",
    category: "Dairy",
    defaultServing: "1 slice / 1 oz (30g)",
    defaultGrams: 30,
    per100g: { protein: 25.0, carbs: 1.3, fat: 33.1, fiber: 0, calories: 403 },
    store: "Walmart / Superstore — Black Diamond, Cracker Barrel",
    notes: "USDA — high protein, use sparingly for fat loss"
  },
  {
    name: "Oat Milk (unsweetened)",
    category: "Dairy Alt",
    defaultServing: "1 cup (250ml)",
    defaultGrams: 250,
    per100g: { protein: 1.0, carbs: 6.6, fat: 1.5, fiber: 0.2, calories: 44 },
    store: "Walmart / Superstore — Oatly, Earth's Own",
    notes: "USDA — low protein but great for pancakes, coffee"
  },
  {
    name: "Soy Milk (unsweetened)",
    category: "Dairy Alt",
    defaultServing: "1 cup (250ml)",
    defaultGrams: 250,
    per100g: { protein: 3.3, carbs: 2.4, fat: 1.8, fiber: 0.3, calories: 39 },
    store: "Walmart / Superstore — Silk, So Good",
    notes: "USDA — highest protein plant milk, use in shakes"
  },
  {
    name: "Almond Milk (unsweetened)",
    category: "Dairy Alt",
    defaultServing: "1 cup (250ml)",
    defaultGrams: 250,
    per100g: { protein: 0.4, carbs: 0.5, fat: 1.0, fiber: 0.2, calories: 13 },
    store: "Walmart / Superstore — Silk, Blue Diamond",
    notes: "USDA — very low calorie, low protein"
  },

  // ─────────────────────────────────────────────
  // GRAINS & CEREALS
  // ─────────────────────────────────────────────

  {
    name: "Rolled Oats (large flake)",
    category: "Grain",
    defaultServing: "1/2 cup dry (40g)",
    defaultGrams: 40,
    per100g: { protein: 16.9, carbs: 66.3, fat: 6.9, fiber: 10.6, calories: 389 },
    store: "Walmart / Superstore — Quaker, PC, Robin Hood",
    notes: "USDA — Canadian breakfast staple, cheap and high protein"
  },
  {
    name: "Quick Oats (instant)",
    category: "Grain",
    defaultServing: "1 packet / 1/2 cup (40g)",
    defaultGrams: 40,
    per100g: { protein: 16.9, carbs: 66.3, fat: 6.9, fiber: 10.6, calories: 389 },
    store: "Walmart / Superstore — Quaker",
    notes: "USDA — same macros as rolled oats, cooks faster"
  },
  {
    name: "Quinoa (dry)",
    category: "Grain",
    defaultServing: "1/4 cup dry (45g)",
    defaultGrams: 45,
    per100g: { protein: 14.1, carbs: 64.2, fat: 6.1, fiber: 7.0, calories: 368 },
    store: "Walmart / Costco / Superstore",
    notes: "USDA — complete protein grain, rinse before cooking"
  },
  {
    name: "Brown Rice (dry)",
    category: "Grain",
    defaultServing: "1/4 cup dry (45g)",
    defaultGrams: 45,
    per100g: { protein: 7.9, carbs: 77.2, fat: 2.9, fiber: 3.5, calories: 370 },
    store: "Walmart / Superstore / Costco",
    notes: "USDA — more fiber and nutrients than white rice"
  },
  {
    name: "Whole Wheat Bread",
    category: "Grain",
    defaultServing: "2 slices (70g)",
    defaultGrams: 70,
    per100g: { protein: 9.0, carbs: 43.0, fat: 3.5, fiber: 6.9, calories: 247 },
    store: "Walmart / Superstore — Dempsters, Silver Hills",
    notes: "USDA — Silver Hills Sprouted Bread is best option in Canada"
  },
  {
    name: "Whole Wheat Tortilla (large)",
    category: "Grain",
    defaultServing: "1 tortilla (45g)",
    defaultGrams: 45,
    per100g: { protein: 9.8, carbs: 49.3, fat: 7.0, fiber: 7.0, calories: 300 },
    store: "Walmart / Superstore — Mission, PC",
    notes: "USDA — great for wraps and burritos"
  },
  {
    name: "Whole Wheat Pasta (dry)",
    category: "Grain",
    defaultServing: "1 cup dry (85g)",
    defaultGrams: 85,
    per100g: { protein: 14.6, carbs: 73.5, fat: 2.5, fiber: 8.7, calories: 348 },
    store: "Walmart / Superstore",
    notes: "USDA — more protein and fiber than regular pasta"
  },
  {
    name: "All-Purpose Flour",
    category: "Grain",
    defaultServing: "1/4 cup (30g)",
    defaultGrams: 30,
    per100g: { protein: 10.3, carbs: 76.3, fat: 1.0, fiber: 2.7, calories: 364 },
    store: "Everywhere — Robin Hood, Five Roses",
    notes: "USDA — use for pancakes and baking"
  },
  {
    name: "Oat Flour",
    category: "Grain",
    defaultServing: "1/4 cup (30g)",
    defaultGrams: 30,
    per100g: { protein: 15.3, carbs: 65.7, fat: 7.0, fiber: 10.0, calories: 404 },
    store: "Walmart / Superstore / Health stores",
    notes: "USDA — or blend rolled oats yourself in blender"
  },

  // ─────────────────────────────────────────────
  // VEGETABLES (fresh, widely available in Canada)
  // ─────────────────────────────────────────────

  {
    name: "Spinach (fresh)",
    category: "Vegetable",
    defaultServing: "2 cups (60g)",
    defaultGrams: 60,
    per100g: { protein: 2.9, carbs: 3.6, fat: 0.4, fiber: 2.2, calories: 23 },
    store: "Everywhere",
    notes: "USDA — buy in large containers from Costco for value"
  },
  {
    name: "Kale (fresh)",
    category: "Vegetable",
    defaultServing: "2 cups (67g)",
    defaultGrams: 67,
    per100g: { protein: 4.3, carbs: 8.8, fat: 0.9, fiber: 3.6, calories: 49 },
    store: "Walmart / Superstore",
    notes: "USDA — higher protein than spinach, massage before using raw"
  },
  {
    name: "Broccoli (fresh)",
    category: "Vegetable",
    defaultServing: "1 cup florets (91g)",
    defaultGrams: 91,
    per100g: { protein: 2.8, carbs: 7.0, fat: 0.4, fiber: 2.6, calories: 34 },
    store: "Everywhere",
    notes: "USDA — one of highest protein vegetables"
  },
  {
    name: "Sweet Potato",
    category: "Vegetable",
    defaultServing: "1 medium (130g)",
    defaultGrams: 130,
    per100g: { protein: 1.6, carbs: 20.1, fat: 0.1, fiber: 3.0, calories: 86 },
    store: "Everywhere",
    notes: "USDA — complex carb, great post-workout"
  },
  {
    name: "Bell Pepper (red)",
    category: "Vegetable",
    defaultServing: "1 medium (119g)",
    defaultGrams: 119,
    per100g: { protein: 1.0, carbs: 6.0, fat: 0.3, fiber: 2.1, calories: 31 },
    store: "Everywhere",
    notes: "USDA — highest vitamin C vegetable"
  },
  {
    name: "Mushrooms (cremini)",
    category: "Vegetable",
    defaultServing: "1 cup sliced (70g)",
    defaultGrams: 70,
    per100g: { protein: 3.3, carbs: 4.7, fat: 0.4, fiber: 1.3, calories: 28 },
    store: "Everywhere",
    notes: "USDA — vitamin D, umami flavor booster"
  },
  {
    name: "Zucchini",
    category: "Vegetable",
    defaultServing: "1 medium (200g)",
    defaultGrams: 200,
    per100g: { protein: 1.2, carbs: 3.1, fat: 0.3, fiber: 1.0, calories: 17 },
    store: "Everywhere",
    notes: "USDA — very low calorie, great for adding volume"
  },
  {
    name: "Frozen Mixed Vegetables",
    category: "Vegetable",
    defaultServing: "1 cup (130g)",
    defaultGrams: 130,
    per100g: { protein: 3.3, carbs: 13.7, fat: 0.3, fiber: 4.0, calories: 65 },
    store: "Walmart / Costco",
    notes: "USDA — peas, corn, carrots, beans — convenient and cheap"
  },
  {
    name: "Canned Tomatoes (diced)",
    category: "Vegetable",
    defaultServing: "1/2 can (200g)",
    defaultGrams: 200,
    per100g: { protein: 1.0, carbs: 4.0, fat: 0.2, fiber: 1.3, calories: 20 },
    store: "Everywhere — Hunt's, PC, Del Monte",
    notes: "USDA — base for curries, soups, chili"
  },
  {
    name: "Avocado",
    category: "Vegetable",
    defaultServing: "1/2 avocado (75g)",
    defaultGrams: 75,
    per100g: { protein: 2.0, carbs: 8.5, fat: 14.7, fiber: 6.7, calories: 160 },
    store: "Walmart / Superstore",
    notes: "USDA — healthy fats, great on toast or in bowls"
  },
  {
    name: "Celery",
    category: "Vegetable",
    defaultServing: "2 stalks (80g)",
    defaultGrams: 80,
    per100g: { protein: 0.7, carbs: 3.0, fat: 0.2, fiber: 1.6, calories: 16 },
    store: "Everywhere",
    notes: "USDA — very low calorie snack"
  },

  // ─────────────────────────────────────────────
  // FRUITS
  // ─────────────────────────────────────────────

  {
    name: "Blueberries (fresh or frozen)",
    category: "Fruit",
    defaultServing: "1 cup (148g)",
    defaultGrams: 148,
    per100g: { protein: 0.7, carbs: 14.5, fat: 0.3, fiber: 2.4, calories: 57 },
    store: "Walmart / Costco — buy frozen for value",
    notes: "USDA — antioxidants, great on oats and pancakes"
  },
  {
    name: "Strawberries (fresh or frozen)",
    category: "Fruit",
    defaultServing: "1 cup (152g)",
    defaultGrams: 152,
    per100g: { protein: 0.7, carbs: 7.7, fat: 0.3, fiber: 2.0, calories: 32 },
    store: "Walmart / Superstore / Costco",
    notes: "USDA — vitamin C, low calorie"
  },
  {
    name: "Banana (ripe)",
    category: "Fruit",
    defaultServing: "1 medium (118g)",
    defaultGrams: 118,
    per100g: { protein: 1.1, carbs: 22.8, fat: 0.3, fiber: 2.6, calories: 89 },
    store: "Everywhere",
    notes: "USDA — pre-workout energy, egg replacer in pancakes"
  },
  {
    name: "Apple",
    category: "Fruit",
    defaultServing: "1 medium (182g)",
    defaultGrams: 182,
    per100g: { protein: 0.3, carbs: 13.8, fat: 0.2, fiber: 2.4, calories: 52 },
    store: "Everywhere",
    notes: "USDA — fiber, natural sweetness"
  },
  {
    name: "Mixed Berries (frozen)",
    category: "Fruit",
    defaultServing: "1 cup (140g)",
    defaultGrams: 140,
    per100g: { protein: 0.7, carbs: 12.0, fat: 0.3, fiber: 3.5, calories: 50 },
    store: "Costco / Walmart — best value frozen",
    notes: "USDA — antioxidant powerhouse, use in smoothies"
  },

  // ─────────────────────────────────────────────
  // NUTS & SEEDS & NUT BUTTERS
  // ─────────────────────────────────────────────

  {
    name: "Hemp Hearts (shelled hemp seeds)",
    category: "Nut/Seed",
    defaultServing: "3 tbsp (30g)",
    defaultGrams: 30,
    per100g: { protein: 31.6, carbs: 8.7, fat: 48.8, fiber: 4.0, calories: 553 },
    store: "Costco / Walmart / Superstore — Manitoba Harvest",
    notes: "USDA — Canadian superfood, complete protein, add to anything"
  },
  {
    name: "Chia Seeds",
    category: "Nut/Seed",
    defaultServing: "2 tbsp (20g)",
    defaultGrams: 20,
    per100g: { protein: 16.5, carbs: 42.1, fat: 30.7, fiber: 34.4, calories: 486 },
    store: "Walmart / Superstore / Costco",
    notes: "USDA — omega-3, soak in liquid for pudding or add to oats"
  },
  {
    name: "Flaxseeds (ground)",
    category: "Nut/Seed",
    defaultServing: "2 tbsp (14g)",
    defaultGrams: 14,
    per100g: { protein: 18.3, carbs: 28.9, fat: 42.2, fiber: 27.3, calories: 534 },
    store: "Walmart / Superstore",
    notes: "USDA — omega-3, ground is better absorbed than whole"
  },
  {
    name: "Pumpkin Seeds (raw)",
    category: "Nut/Seed",
    defaultServing: "1/4 cup (30g)",
    defaultGrams: 30,
    per100g: { protein: 30.2, carbs: 10.7, fat: 49.1, fiber: 6.0, calories: 559 },
    store: "Walmart / Superstore / Costco",
    notes: "USDA — highest protein seed, zinc, magnesium"
  },
  {
    name: "Almonds (raw)",
    category: "Nut/Seed",
    defaultServing: "1/4 cup / 23 almonds (28g)",
    defaultGrams: 28,
    per100g: { protein: 21.2, carbs: 21.7, fat: 49.4, fiber: 12.5, calories: 579 },
    store: "Costco / Walmart — buy in bulk for value",
    notes: "USDA — vitamin E, best pre-soaked overnight"
  },
  {
    name: "Peanut Butter (natural, no sugar)",
    category: "Nut/Seed",
    defaultServing: "2 tbsp (32g)",
    defaultGrams: 32,
    per100g: { protein: 22.0, carbs: 20.0, fat: 50.0, fiber: 6.0, calories: 588 },
    store: "Walmart / Superstore — Kraft Natural, Adams",
    notes: "USDA — get natural (just peanuts + salt), no palm oil"
  },
  {
    name: "Almond Butter (natural)",
    category: "Nut/Seed",
    defaultServing: "2 tbsp (32g)",
    defaultGrams: 32,
    per100g: { protein: 21.0, carbs: 18.8, fat: 59.0, fiber: 7.0, calories: 634 },
    store: "Costco / Walmart / Superstore",
    notes: "USDA — higher in healthy fats than peanut butter"
  },
  {
    name: "Walnuts",
    category: "Nut/Seed",
    defaultServing: "1/4 cup (28g)",
    defaultGrams: 28,
    per100g: { protein: 15.2, carbs: 13.7, fat: 65.2, fiber: 6.7, calories: 654 },
    store: "Costco / Walmart",
    notes: "USDA — highest omega-3 nut, anti-inflammatory"
  },

  // ─────────────────────────────────────────────
  // OILS & FATS
  // ─────────────────────────────────────────────

  {
    name: "Olive Oil (extra virgin)",
    category: "Oil/Fat",
    defaultServing: "1 tbsp (14g)",
    defaultGrams: 14,
    per100g: { protein: 0, carbs: 0, fat: 100, fiber: 0, calories: 884 },
    store: "Everywhere",
    notes: "USDA — anti-inflammatory, use for sauteing"
  },
  {
    name: "Coconut Oil",
    category: "Oil/Fat",
    defaultServing: "1 tbsp (14g)",
    defaultGrams: 14,
    per100g: { protein: 0, carbs: 0, fat: 100, fiber: 0, calories: 892 },
    store: "Walmart / Superstore / Costco",
    notes: "USDA — MCTs, great for high heat cooking"
  },
  {
    name: "Butter (unsalted)",
    category: "Oil/Fat",
    defaultServing: "1 tbsp (14g)",
    defaultGrams: 14,
    per100g: { protein: 0.9, carbs: 0.1, fat: 81.1, fiber: 0, calories: 717 },
    store: "Everywhere — Gay Lea, Lactantia",
    notes: "USDA — use for pancakes, baking"
  },

  // ─────────────────────────────────────────────
  // CONDIMENTS & PANTRY STAPLES
  // ─────────────────────────────────────────────

  {
    name: "Maple Syrup (pure)",
    category: "Spice",
    defaultServing: "1 tbsp (20g)",
    defaultGrams: 20,
    per100g: { protein: 0, carbs: 67.0, fat: 0.1, fiber: 0, calories: 260 },
    store: "Everywhere — Canadian product",
    notes: "USDA — use sparingly as natural sweetener"
  },
  {
    name: "Tahini (sesame paste)",
    category: "Nut/Seed",
    defaultServing: "2 tbsp (30g)",
    defaultGrams: 30,
    per100g: { protein: 17.0, carbs: 21.2, fat: 53.8, fiber: 9.3, calories: 595 },
    store: "Walmart / Superstore / T&T",
    notes: "USDA — use in dressings, hummus, bowls"
  },
  {
    name: "Soy Sauce (low sodium)",
    category: "Spice",
    defaultServing: "1 tbsp (15g)",
    defaultGrams: 15,
    per100g: { protein: 8.1, carbs: 8.0, fat: 0.1, fiber: 0.4, calories: 60 },
    store: "Walmart / T&T — Kikkoman",
    notes: "USDA — use in stir fry, marinades"
  },
  {
    name: "Nutritional Yeast",
    category: "Other",
    defaultServing: "2 tbsp (15g)",
    defaultGrams: 15,
    per100g: { protein: 50.0, carbs: 31.0, fat: 3.0, fiber: 6.0, calories: 325 },
    store: "Walmart / Superstore / Health food stores",
    notes: "USDA — cheesy flavor, B12, complete protein booster"
  },
  {
    name: "Sriracha Hot Sauce",
    category: "Spice",
    defaultServing: "1 tsp (5g)",
    defaultGrams: 5,
    per100g: { protein: 1.3, carbs: 18.3, fat: 0.5, fiber: 0, calories: 93 },
    store: "Walmart / Superstore / T&T",
    notes: "Negligible calories — use for flavor"
  },
  {
    name: "Baking Powder",
    category: "Spice",
    defaultServing: "1 tsp (4g)",
    defaultGrams: 4,
    per100g: { protein: 0, carbs: 25.0, fat: 0, fiber: 0, calories: 100 },
    store: "Everywhere — Magic, Fleischmann's",
    notes: "Leavening agent for pancakes and baking"
  },
  {
    name: "Vanilla Extract (pure)",
    category: "Spice",
    defaultServing: "1 tsp (4g)",
    defaultGrams: 4,
    per100g: { protein: 0.1, carbs: 12.7, fat: 0.1, fiber: 0, calories: 288 },
    store: "Walmart / Superstore",
    notes: "USDA — negligible macros in serving size"
  },
  {
    name: "Cinnamon (ground)",
    category: "Spice",
    defaultServing: "1 tsp (2.6g)",
    defaultGrams: 2.6,
    per100g: { protein: 3.9, carbs: 80.6, fat: 1.2, fiber: 53.1, calories: 261 },
    store: "Everywhere",
    notes: "USDA — blood sugar regulation, great in oats"
  },
  {
    name: "Curry Powder",
    category: "Spice",
    defaultServing: "1 tsp (2g)",
    defaultGrams: 2,
    per100g: { protein: 12.7, carbs: 55.8, fat: 14.0, fiber: 33.2, calories: 325 },
    store: "Walmart / Superstore / Indian grocery",
    notes: "USDA — use in lentil soups, chickpea curry"
  },
  {
    name: "Smoked Paprika",
    category: "Spice",
    defaultServing: "1 tsp (2g)",
    defaultGrams: 2,
    per100g: { protein: 14.1, carbs: 53.9, fat: 12.9, fiber: 34.9, calories: 282 },
    store: "Everywhere",
    notes: "USDA — smoky depth of flavor for Western dishes"
  },
  {
    name: "Vegetable Broth (low sodium)",
    category: "Other",
    defaultServing: "1 cup (240ml)",
    defaultGrams: 240,
    per100g: { protein: 0.2, carbs: 0.8, fat: 0, fiber: 0, calories: 4 },
    store: "Walmart / Superstore — PC, Imagine, Swanson",
    notes: "USDA — use instead of water in soups, grains"
  },
  {
    name: "Coconut Milk (canned, full fat)",
    category: "Dairy Alt",
    defaultServing: "1/4 cup (60ml)",
    defaultGrams: 60,
    per100g: { protein: 2.3, carbs: 6.0, fat: 21.3, fiber: 0, calories: 230 },
    store: "Walmart / Superstore / T&T",
    notes: "USDA — use in curries, smoothies"
  },
  {
    name: "Apple Cider Vinegar",
    category: "Spice",
    defaultServing: "1 tbsp (15g)",
    defaultGrams: 15,
    per100g: { protein: 0, carbs: 0.9, fat: 0, fiber: 0, calories: 21 },
    store: "Everywhere — Bragg's widely available",
    notes: "Negligible macros — blood sugar, digestion"
  },

  // ─────────────────────────────────────────────
  // PROTEIN SUPPLEMENTS (available in Canada)
  // ─────────────────────────────────────────────

  {
    name: "Diesel NZ Whey Isolate",
    category: "Protein Supp",
    defaultServing: "1 scoop (30g)",
    defaultGrams: 30,
    per100g: { protein: 90.0, carbs: 1.7, fat: 0.3, fiber: 0, calories: 370 },
    store: "Perfect Sports Canada / Popeyes / GNC Canada",
    notes: "Perfect Sports — 27g protein per scoop, NZ grass-fed dairy, 0g sugar"
  },

];

// ─── HELPER FUNCTIONS ────────────────────────────────────────
function getMacros(ingredientName, grams) {
  const ing = canadianIngredients.find(
    i => i.name.toLowerCase() === ingredientName.toLowerCase()
  );
  if (!ing) {
    console.warn(`Canadian ingredient not found: ${ingredientName}`);
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

function findIngredient(name) {
  return canadianIngredients.find(
    i => i.name.toLowerCase().includes(name.toLowerCase())
  );
}

function getByCategory(category) {
  return canadianIngredients.filter(i => i.category === category);
}

module.exports = { canadianIngredients, getMacros, findIngredient, getByCategory };
