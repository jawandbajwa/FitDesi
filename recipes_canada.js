// ============================================================
// FITDESI — CANADIAN RECIPES DATABASE
// ============================================================
// All recipes: no eggs, no meat, no fish
// Available ingredients: Walmart, Superstore, Costco, No Frills
// Sources: Vancouver with Love, Cookin' Canuck, verified Canadian
//          vegetarian nutrition sources, Elavegan, Plant Based School
// ============================================================

const { getMacros } = require('./ingredients_canada');

// ─── RECIPE BUILDER ──────────────────────────────────────────
function buildRecipe(recipe) {
  const computedIngredients = recipe.ingredients.map(item => ({
    ...item,
    macros: getMacros(item.name, item.grams),
  }));

  const totals = computedIngredients.reduce(
    (acc, item) => {
      if (!item.macros) return acc;
      acc.protein += item.macros.protein;
      acc.carbs += item.macros.carbs;
      acc.fat += item.macros.fat;
      acc.fiber += item.macros.fiber;
      acc.calories += item.macros.calories;
      return acc;
    },
    { protein: 0, carbs: 0, fat: 0, fiber: 0, calories: 0 }
  );

  return {
    ...recipe,
    ingredients: computedIngredients,
    totalMacros: {
      protein: Math.round(totals.protein * 10) / 10,
      carbs: Math.round(totals.carbs * 10) / 10,
      fat: Math.round(totals.fat * 10) / 10,
      fiber: Math.round(totals.fiber * 10) / 10,
      calories: Math.round(totals.calories),
    }
  };
}

// ============================================================
// RECIPES
// ============================================================

const rawRecipes = [

  // ══════════════════════════════════════════════
  // BREAKFAST
  // ══════════════════════════════════════════════

  {
    name: "Classic Rolled Oatmeal",
    category: "breakfast",
    servingSize: "1 bowl",
    prepTime: "5 min",
    source: "Canadian breakfast staple",
    ingredients: [
      { name: "Rolled Oats (large flake)", grams: 80 },
      { name: "Milk (2% fat, pasteurized)", grams: 250 },
      { name: "Banana (ripe)", grams: 100 },
      { name: "Cinnamon (ground)", grams: 2 },
      { name: "Maple Syrup (pure)", grams: 10 },
    ]
  },

  {
    name: "High Protein Oatmeal (with Whey)",
    category: "breakfast",
    servingSize: "1 bowl",
    prepTime: "5 min",
    source: "Adapted for muscle building",
    ingredients: [
      { name: "Rolled Oats (large flake)", grams: 80 },
      { name: "Soy Milk (unsweetened)", grams: 250 },
      { name: "Diesel NZ Whey Isolate", grams: 30 },
      { name: "Banana (ripe)", grams: 100 },
      { name: "Peanut Butter (natural, no sugar)", grams: 20 },
      { name: "Chia Seeds", grams: 12 },
      { name: "Cinnamon (ground)", grams: 2 },
    ]
  },

  {
    name: "Banana Oat Pancakes (No Egg)",
    category: "breakfast",
    servingSize: "4 pancakes",
    prepTime: "15 min",
    source: "Vancouver with Love — 3 ingredient vegan pancakes",
    ingredients: [
      { name: "Rolled Oats (large flake)", grams: 80 },
      { name: "Banana (ripe)", grams: 120 },
      { name: "Soy Milk (unsweetened)", grams: 60 },
      { name: "Cinnamon (ground)", grams: 2 },
      { name: "Baking Powder", grams: 4 },
      { name: "Coconut Oil", grams: 5 },
      { name: "Maple Syrup (pure)", grams: 15 },
    ]
  },

  {
    name: "Protein Pancakes (High Protein, No Egg)",
    category: "breakfast",
    servingSize: "4 pancakes",
    prepTime: "15 min",
    source: "Elavegan — vegan protein pancakes",
    ingredients: [
      { name: "Oat Flour", grams: 60 },
      { name: "Diesel NZ Whey Isolate", grams: 30 },
      { name: "Banana (ripe)", grams: 100 },
      { name: "Soy Milk (unsweetened)", grams: 120 },
      { name: "Baking Powder", grams: 5 },
      { name: "Vanilla Extract (pure)", grams: 4 },
      { name: "Cinnamon (ground)", grams: 2 },
      { name: "Coconut Oil", grams: 5 },
    ]
  },

  {
    name: "Overnight Oats with Berries",
    category: "breakfast",
    servingSize: "1 jar",
    prepTime: "5 min (+ overnight)",
    source: "Easy Canadian meal prep breakfast",
    ingredients: [
      { name: "Rolled Oats (large flake)", grams: 80 },
      { name: "Greek Yogurt (plain, 0% fat)", grams: 100 },
      { name: "Soy Milk (unsweetened)", grams: 120 },
      { name: "Chia Seeds", grams: 15 },
      { name: "Mixed Berries (frozen)", grams: 80 },
      { name: "Maple Syrup (pure)", grams: 10 },
    ]
  },

  {
    name: "Protein Overnight Oats (with Whey)",
    category: "breakfast",
    servingSize: "1 jar",
    prepTime: "5 min (+ overnight)",
    source: "Heavenly Spiced — high protein vegan meal prep",
    ingredients: [
      { name: "Rolled Oats (large flake)", grams: 80 },
      { name: "Diesel NZ Whey Isolate", grams: 30 },
      { name: "Greek Yogurt (plain, 0% fat)", grams: 150 },
      { name: "Soy Milk (unsweetened)", grams: 100 },
      { name: "Chia Seeds", grams: 15 },
      { name: "Blueberries (fresh or frozen)", grams: 80 },
      { name: "Almond Butter (natural)", grams: 15 },
    ]
  },

  {
    name: "Chia Pudding",
    category: "breakfast",
    servingSize: "1 jar",
    prepTime: "5 min (+ 4hr set)",
    source: "Popular Canadian plant-based breakfast",
    ingredients: [
      { name: "Chia Seeds", grams: 40 },
      { name: "Soy Milk (unsweetened)", grams: 300 },
      { name: "Maple Syrup (pure)", grams: 15 },
      { name: "Vanilla Extract (pure)", grams: 4 },
      { name: "Mixed Berries (frozen)", grams: 80 },
    ]
  },

  {
    name: "Peanut Butter Banana Toast",
    category: "breakfast",
    servingSize: "2 slices",
    prepTime: "3 min",
    source: "Quick high protein breakfast",
    ingredients: [
      { name: "Whole Wheat Bread", grams: 70 },
      { name: "Peanut Butter (natural, no sugar)", grams: 32 },
      { name: "Banana (ripe)", grams: 100 },
      { name: "Hemp Hearts (shelled hemp seeds)", grams: 15 },
      { name: "Cinnamon (ground)", grams: 1 },
    ]
  },

  {
    name: "Greek Yogurt Parfait",
    category: "breakfast",
    servingSize: "1 bowl",
    prepTime: "3 min",
    source: "Canadian high protein no-cook breakfast",
    ingredients: [
      { name: "Greek Yogurt (plain, 0% fat)", grams: 200 },
      { name: "Rolled Oats (large flake)", grams: 30 },
      { name: "Blueberries (fresh or frozen)", grams: 80 },
      { name: "Hemp Hearts (shelled hemp seeds)", grams: 20 },
      { name: "Almonds (raw)", grams: 15 },
      { name: "Maple Syrup (pure)", grams: 10 },
    ]
  },

  {
    name: "Protein Smoothie (Post Workout)",
    category: "breakfast",
    servingSize: "1 large glass",
    prepTime: "3 min",
    source: "Classic Canadian gym smoothie",
    ingredients: [
      { name: "Diesel NZ Whey Isolate", grams: 30 },
      { name: "Banana (ripe)", grams: 120 },
      { name: "Soy Milk (unsweetened)", grams: 300 },
      { name: "Peanut Butter (natural, no sugar)", grams: 20 },
      { name: "Mixed Berries (frozen)", grams: 80 },
      { name: "Flaxseeds (ground)", grams: 10 },
    ]
  },

  {
    name: "Avocado Toast with Hemp Hearts",
    category: "breakfast",
    servingSize: "2 slices",
    prepTime: "5 min",
    source: "Canadian trendy high protein breakfast",
    ingredients: [
      { name: "Whole Wheat Bread", grams: 70 },
      { name: "Avocado", grams: 75 },
      { name: "Hemp Hearts (shelled hemp seeds)", grams: 20 },
      { name: "Nutritional Yeast", grams: 10 },
      { name: "Sriracha Hot Sauce", grams: 5 },
    ]
  },

  // ══════════════════════════════════════════════
  // LUNCH
  // ══════════════════════════════════════════════

  {
    name: "Red Lentil Dal (Canadian Style)",
    category: "lunch",
    servingSize: "1 bowl",
    prepTime: "25 min",
    source: "Cookin' Canuck — vegan red lentil dal",
    ingredients: [
      { name: "Red Lentils (dry)", grams: 100 },
      { name: "Canned Tomatoes (diced)", grams: 200 },
      { name: "Coconut Milk (canned, full fat)", grams: 60 },
      { name: "Vegetable Broth (low sodium)", grams: 240 },
      { name: "Olive Oil (extra virgin)", grams: 10 },
      { name: "Curry Powder", grams: 5 },
      { name: "Cinnamon (ground)", grams: 1 },
    ]
  },

  {
    name: "Black Bean Burrito Bowl",
    category: "lunch",
    servingSize: "1 bowl",
    prepTime: "20 min",
    source: "Canadian Mexican-inspired high protein bowl",
    ingredients: [
      { name: "Black Beans (canned, drained)", grams: 160 },
      { name: "Brown Rice (dry)", grams: 60 },
      { name: "Bell Pepper (red)", grams: 80 },
      { name: "Avocado", grams: 75 },
      { name: "Canned Tomatoes (diced)", grams: 80 },
      { name: "Olive Oil (extra virgin)", grams: 8 },
      { name: "Smoked Paprika", grams: 3 },
      { name: "Curry Powder", grams: 2 },
      { name: "Sriracha Hot Sauce", grams: 5 },
    ]
  },

  {
    name: "Chickpea and Lentil Soup",
    category: "lunch",
    servingSize: "1 large bowl",
    prepTime: "30 min",
    source: "Vegan in the Freezer — chickpeas and red lentils",
    ingredients: [
      { name: "Red Lentils (dry)", grams: 80 },
      { name: "Chickpeas (canned, drained)", grams: 120 },
      { name: "Canned Tomatoes (diced)", grams: 200 },
      { name: "Vegetable Broth (low sodium)", grams: 400 },
      { name: "Coconut Milk (canned, full fat)", grams: 60 },
      { name: "Olive Oil (extra virgin)", grams: 10 },
      { name: "Curry Powder", grams: 5 },
      { name: "Smoked Paprika", grams: 2 },
    ]
  },

  {
    name: "Quinoa Power Bowl",
    category: "lunch",
    servingSize: "1 bowl",
    prepTime: "20 min",
    source: "Canadian meal prep favourite",
    ingredients: [
      { name: "Quinoa (dry)", grams: 60 },
      { name: "Chickpeas (canned, drained)", grams: 120 },
      { name: "Kale (fresh)", grams: 60 },
      { name: "Avocado", grams: 75 },
      { name: "Hemp Hearts (shelled hemp seeds)", grams: 20 },
      { name: "Tahini (sesame paste)", grams: 20 },
      { name: "Olive Oil (extra virgin)", grams: 8 },
    ]
  },

  {
    name: "Veggie Wrap with Hummus",
    category: "lunch",
    servingSize: "1 large wrap",
    prepTime: "10 min",
    source: "Quick Canadian work lunch",
    ingredients: [
      { name: "Whole Wheat Tortilla (large)", grams: 45 },
      { name: "Hummus (store-bought)", grams: 60 },
      { name: "Spinach (fresh)", grams: 40 },
      { name: "Bell Pepper (red)", grams: 60 },
      { name: "Avocado", grams: 60 },
      { name: "Chickpeas (canned, drained)", grams: 80 },
      { name: "Tahini (sesame paste)", grams: 15 },
    ]
  },

  {
    name: "Lentil and Sweet Potato Curry",
    category: "lunch",
    servingSize: "1 bowl",
    prepTime: "30 min",
    source: "Veggie Kitchenly — Canadian meal prep curry",
    ingredients: [
      { name: "Red Lentils (dry)", grams: 80 },
      { name: "Sweet Potato", grams: 150 },
      { name: "Canned Tomatoes (diced)", grams: 150 },
      { name: "Coconut Milk (canned, full fat)", grams: 80 },
      { name: "Vegetable Broth (low sodium)", grams: 200 },
      { name: "Olive Oil (extra virgin)", grams: 8 },
      { name: "Curry Powder", grams: 6 },
      { name: "Smoked Paprika", grams: 2 },
    ]
  },

  {
    name: "Chickpea Salad Sandwich",
    category: "lunch",
    servingSize: "1 sandwich",
    prepTime: "10 min",
    source: "Popular Canadian vegan lunch",
    ingredients: [
      { name: "Chickpeas (canned, drained)", grams: 160 },
      { name: "Whole Wheat Bread", grams: 70 },
      { name: "Avocado", grams: 50 },
      { name: "Tahini (sesame paste)", grams: 15 },
      { name: "Spinach (fresh)", grams: 30 },
      { name: "Bell Pepper (red)", grams: 40 },
    ]
  },

  {
    name: "Edamame and Quinoa Bowl",
    category: "lunch",
    servingSize: "1 bowl",
    prepTime: "15 min",
    source: "Canadian plant-based gym lunch",
    ingredients: [
      { name: "Quinoa (dry)", grams: 60 },
      { name: "Edamame (frozen, shelled)", grams: 120 },
      { name: "Kale (fresh)", grams: 50 },
      { name: "Broccoli (fresh)", grams: 80 },
      { name: "Soy Sauce (low sodium)", grams: 15 },
      { name: "Hemp Hearts (shelled hemp seeds)", grams: 10 },
      { name: "Hemp Hearts (shelled hemp seeds)", grams: 15 },
    ]
  },

  {
    name: "Three Bean Chili",
    category: "lunch",
    servingSize: "1 large bowl",
    prepTime: "35 min",
    source: "Grateful Grazer — three bean chili",
    ingredients: [
      { name: "Black Beans (canned, drained)", grams: 120 },
      { name: "Kidney Beans (canned, drained)", grams: 120 },
      { name: "Chickpeas (canned, drained)", grams: 120 },
      { name: "Canned Tomatoes (diced)", grams: 300 },
      { name: "Vegetable Broth (low sodium)", grams: 200 },
      { name: "Olive Oil (extra virgin)", grams: 10 },
      { name: "Smoked Paprika", grams: 4 },
      { name: "Curry Powder", grams: 3 },
    ]
  },

  {
    name: "Whole Wheat Pasta with Chickpeas",
    category: "lunch",
    servingSize: "1 bowl",
    prepTime: "20 min",
    source: "Happy Muncher — pasta e fagioli style",
    ingredients: [
      { name: "Whole Wheat Pasta (dry)", grams: 80 },
      { name: "Chickpeas (canned, drained)", grams: 120 },
      { name: "Canned Tomatoes (diced)", grams: 150 },
      { name: "Spinach (fresh)", grams: 50 },
      { name: "Olive Oil (extra virgin)", grams: 10 },
      { name: "Nutritional Yeast", grams: 10 },
    ]
  },

  // ══════════════════════════════════════════════
  // DINNER
  // ══════════════════════════════════════════════

  {
    name: "Black Bean and Rice",
    category: "dinner",
    servingSize: "1 bowl",
    prepTime: "20 min",
    source: "Cookin' Canuck — black beans and rice",
    ingredients: [
      { name: "Black Beans (canned, drained)", grams: 160 },
      { name: "Brown Rice (dry)", grams: 60 },
      { name: "Canned Tomatoes (diced)", grams: 100 },
      { name: "Bell Pepper (red)", grams: 80 },
      { name: "Olive Oil (extra virgin)", grams: 8 },
      { name: "Smoked Paprika", grams: 3 },
      { name: "Curry Powder", grams: 2 },
    ]
  },

  {
    name: "Coconut Chickpea Curry",
    category: "dinner",
    servingSize: "1 bowl",
    prepTime: "25 min",
    source: "Heavenly Spiced — instant pot coconut chickpea curry",
    ingredients: [
      { name: "Chickpeas (canned, drained)", grams: 200 },
      { name: "Coconut Milk (canned, full fat)", grams: 120 },
      { name: "Canned Tomatoes (diced)", grams: 150 },
      { name: "Vegetable Broth (low sodium)", grams: 100 },
      { name: "Olive Oil (extra virgin)", grams: 10 },
      { name: "Curry Powder", grams: 8 },
      { name: "Smoked Paprika", grams: 2 },
    ]
  },

  {
    name: "Lentil Bolognese with Pasta",
    category: "dinner",
    servingSize: "1 bowl",
    prepTime: "30 min",
    source: "Any Reason Vegans — lentil bolognese",
    ingredients: [
      { name: "Green Lentils (dry)", grams: 80 },
      { name: "Whole Wheat Pasta (dry)", grams: 80 },
      { name: "Canned Tomatoes (diced)", grams: 200 },
      { name: "Vegetable Broth (low sodium)", grams: 150 },
      { name: "Olive Oil (extra virgin)", grams: 10 },
      { name: "Nutritional Yeast", grams: 10 },
      { name: "Smoked Paprika", grams: 2 },
    ]
  },

  {
    name: "Buddha Bowl with Tahini Dressing",
    category: "dinner",
    servingSize: "1 bowl",
    prepTime: "30 min",
    source: "Veggie Kitchenly — roasted vegetable buddha bowl",
    ingredients: [
      { name: "Quinoa (dry)", grams: 60 },
      { name: "Chickpeas (canned, drained)", grams: 120 },
      { name: "Sweet Potato", grams: 130 },
      { name: "Broccoli (fresh)", grams: 80 },
      { name: "Kale (fresh)", grams: 50 },
      { name: "Tahini (sesame paste)", grams: 25 },
      { name: "Olive Oil (extra virgin)", grams: 8 },
      { name: "Hemp Hearts (shelled hemp seeds)", grams: 15 },
    ]
  },

  {
    name: "Split Pea Soup",
    category: "dinner",
    servingSize: "1 large bowl",
    prepTime: "45 min",
    source: "Classic Canadian comfort food",
    ingredients: [
      { name: "Split Yellow Peas (dry)", grams: 100 },
      { name: "Vegetable Broth (low sodium)", grams: 500 },
      { name: "Sweet Potato", grams: 100 },
      { name: "Olive Oil (extra virgin)", grams: 8 },
      { name: "Smoked Paprika", grams: 3 },
      { name: "Cinnamon (ground)", grams: 1 },
    ]
  },

  {
    name: "Tofu Stir Fry with Brown Rice",
    category: "dinner",
    servingSize: "1 plate",
    prepTime: "20 min",
    source: "Power Kitchen CA — tofu and veggie stir fry",
    ingredients: [
      { name: "Brown Rice (dry)", grams: 60 },
      { name: "Edamame (frozen, shelled)", grams: 80 },
      { name: "Broccoli (fresh)", grams: 100 },
      { name: "Bell Pepper (red)", grams: 80 },
      { name: "Mushrooms (cremini)", grams: 80 },
      { name: "Soy Sauce (low sodium)", grams: 20 },
      { name: "Coconut Oil", grams: 8 },
      { name: "Hemp Hearts (shelled hemp seeds)", grams: 15 },
    ]
  },

  {
    name: "Lentil Chickpea Stew",
    category: "dinner",
    servingSize: "1 bowl",
    prepTime: "30 min",
    source: "Vegan Richa — lentil chickpea stew",
    ingredients: [
      { name: "Red Lentils (dry)", grams: 70 },
      { name: "Chickpeas (canned, drained)", grams: 120 },
      { name: "Canned Tomatoes (diced)", grams: 150 },
      { name: "Coconut Milk (canned, full fat)", grams: 80 },
      { name: "Spinach (fresh)", grams: 60 },
      { name: "Vegetable Broth (low sodium)", grams: 200 },
      { name: "Olive Oil (extra virgin)", grams: 8 },
      { name: "Curry Powder", grams: 5 },
      { name: "Nutritional Yeast", grams: 10 },
    ]
  },

  {
    name: "Black Bean Tacos",
    category: "dinner",
    servingSize: "2 tacos",
    prepTime: "15 min",
    source: "Canadian tex-mex vegetarian dinner",
    ingredients: [
      { name: "Black Beans (canned, drained)", grams: 160 },
      { name: "Whole Wheat Tortilla (large)", grams: 70 },
      { name: "Avocado", grams: 75 },
      { name: "Bell Pepper (red)", grams: 60 },
      { name: "Canned Tomatoes (diced)", grams: 80 },
      { name: "Smoked Paprika", grams: 3 },
      { name: "Sriracha Hot Sauce", grams: 5 },
      { name: "Greek Yogurt (plain, 0% fat)", grams: 40 },
    ]
  },

  {
    name: "Quinoa Vegetable Bake",
    category: "dinner",
    servingSize: "1 serving",
    prepTime: "40 min",
    source: "Heavenly Spiced — curried quinoa bake",
    ingredients: [
      { name: "Quinoa (dry)", grams: 70 },
      { name: "Chickpeas (canned, drained)", grams: 120 },
      { name: "Sweet Potato", grams: 100 },
      { name: "Broccoli (fresh)", grams: 80 },
      { name: "Canned Tomatoes (diced)", grams: 100 },
      { name: "Coconut Milk (canned, full fat)", grams: 60 },
      { name: "Olive Oil (extra virgin)", grams: 8 },
      { name: "Curry Powder", grams: 6 },
    ]
  },

  // ══════════════════════════════════════════════
  // SNACKS
  // ══════════════════════════════════════════════

  {
    name: "Greek Yogurt with Berries and Seeds",
    category: "snack",
    servingSize: "1 bowl",
    prepTime: "2 min",
    source: "High protein Canadian snack",
    ingredients: [
      { name: "Greek Yogurt (plain, 0% fat)", grams: 175 },
      { name: "Mixed Berries (frozen)", grams: 80 },
      { name: "Hemp Hearts (shelled hemp seeds)", grams: 20 },
      { name: "Chia Seeds", grams: 10 },
      { name: "Maple Syrup (pure)", grams: 10 },
    ]
  },

  {
    name: "Protein Smoothie (Simple)",
    category: "snack",
    servingSize: "1 glass",
    prepTime: "3 min",
    source: "Post workout recovery shake",
    ingredients: [
      { name: "Diesel NZ Whey Isolate", grams: 30 },
      { name: "Soy Milk (unsweetened)", grams: 300 },
      { name: "Banana (ripe)", grams: 100 },
    ]
  },

  {
    name: "Peanut Butter Apple Slices",
    category: "snack",
    servingSize: "1 plate",
    prepTime: "2 min",
    source: "Classic Canadian quick snack",
    ingredients: [
      { name: "Apple", grams: 182 },
      { name: "Peanut Butter (natural, no sugar)", grams: 32 },
      { name: "Hemp Hearts (shelled hemp seeds)", grams: 10 },
    ]
  },

  {
    name: "Roasted Chickpeas (Spiced)",
    category: "snack",
    servingSize: "1/2 cup",
    prepTime: "30 min (oven)",
    source: "Power Kitchen CA — roasted chickpeas",
    ingredients: [
      { name: "Chickpeas (canned, drained)", grams: 160 },
      { name: "Olive Oil (extra virgin)", grams: 8 },
      { name: "Smoked Paprika", grams: 3 },
      { name: "Curry Powder", grams: 2 },
    ]
  },

  {
    name: "Mixed Nuts and Dates",
    category: "snack",
    servingSize: "1 handful",
    prepTime: "0 min",
    source: "High calorie density snack for bulking",
    ingredients: [
      { name: "Almonds (raw)", grams: 20 },
      { name: "Walnuts", grams: 15 },
      { name: "Pumpkin Seeds (raw)", grams: 15 },
    ]
  },

  {
    name: "Cottage Cheese with Fruit",
    category: "snack",
    servingSize: "1 bowl",
    prepTime: "2 min",
    source: "Canadian high casein protein snack",
    ingredients: [
      { name: "Cottage Cheese (2% fat)", grams: 200 },
      { name: "Blueberries (fresh or frozen)", grams: 80 },
      { name: "Hemp Hearts (shelled hemp seeds)", grams: 15 },
      { name: "Maple Syrup (pure)", grams: 10 },
    ]
  },

  {
    name: "Hummus and Veggie Plate",
    category: "snack",
    servingSize: "1 plate",
    prepTime: "5 min",
    source: "Classic Canadian work desk snack",
    ingredients: [
      { name: "Hummus (store-bought)", grams: 80 },
      { name: "Bell Pepper (red)", grams: 80 },
      { name: "Celery", grams: 80 },
      { name: "Broccoli (fresh)", grams: 60 },
    ]
  },

  {
    name: "Almond Butter Banana Smoothie",
    category: "snack",
    servingSize: "1 glass",
    prepTime: "3 min",
    source: "Pre-workout fuel",
    ingredients: [
      { name: "Almond Butter (natural)", grams: 25 },
      { name: "Banana (ripe)", grams: 120 },
      { name: "Soy Milk (unsweetened)", grams: 250 },
      { name: "Chia Seeds", grams: 12 },
      { name: "Cinnamon (ground)", grams: 2 },
    ]
  },

  {
    name: "Hemp Heart Energy Oat Bites (no bake)",
    category: "snack",
    servingSize: "2 bites",
    prepTime: "15 min (+ 30 min freeze)",
    source: "Canadian no-bake energy balls",
    ingredients: [
      { name: "Rolled Oats (large flake)", grams: 60 },
      { name: "Peanut Butter (natural, no sugar)", grams: 50 },
      { name: "Hemp Hearts (shelled hemp seeds)", grams: 20 },
      { name: "Chia Seeds", grams: 10 },
      { name: "Maple Syrup (pure)", grams: 20 },
      { name: "Vanilla Extract (pure)", grams: 4 },
    ]
  },

];

// ─── BUILD ALL RECIPES ───────────────────────────────────────
const recipes = rawRecipes.map(buildRecipe);

// ─── UTILITY FUNCTIONS ───────────────────────────────────────
function getByCategory(category) {
  return recipes.filter(r => r.category === category);
}

function printRecipe(recipe) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📋 ${recipe.name.toUpperCase()}`);
  console.log(`Category: ${recipe.category} | Serving: ${recipe.servingSize} | Time: ${recipe.prepTime}`);
  console.log(`Source: ${recipe.source}`);
  console.log(`${'─'.repeat(60)}`);
  recipe.ingredients.forEach(item => {
    if (item.macros) {
      console.log(`  ${item.name.padEnd(35)} ${String(item.grams + 'g').padEnd(8)} → P:${item.macros.protein}g C:${item.macros.carbs}g F:${item.macros.fat}g ${item.macros.calories}cal`);
    }
  });
  console.log(`${'─'.repeat(60)}`);
  const t = recipe.totalMacros;
  console.log(`TOTAL → Protein: ${t.protein}g | Carbs: ${t.carbs}g | Fat: ${t.fat}g | Fiber: ${t.fiber}g | Calories: ${t.calories}`);
}

function printCategory(category) {
  const list = getByCategory(category);
  console.log(`\n${'#'.repeat(60)}`);
  console.log(`# ${category.toUpperCase()} (${list.length} recipes)`);
  console.log(`${'#'.repeat(60)}`);
  list.forEach(printRecipe);
}

module.exports = { recipes, getByCategory, printRecipe, printCategory };

// ─── RUN DIRECTLY ────────────────────────────────────────────
if (require.main === module) {
  console.log('\nFITDESI — CANADIAN VEGETARIAN RECIPES (No Eggs, No Meat)');
  console.log(`Total: ${recipes.length} recipes`);
  console.log('Sources: Vancouver with Love, Cookin Canuck, Elavegan, Vegan Richa, Grateful Grazer');

  ['breakfast', 'lunch', 'dinner', 'snack'].forEach(printCategory);

  console.log('\n\nQUICK SUMMARY:');
  console.log('Name'.padEnd(40) + 'Cat'.padEnd(12) + 'P'.padEnd(8) + 'C'.padEnd(8) + 'F'.padEnd(8) + 'Cal');
  console.log('─'.repeat(78));
  recipes.forEach(r => {
    const t = r.totalMacros;
    console.log(
      r.name.padEnd(40) +
      r.category.padEnd(12) +
      (t.protein + 'g').padEnd(8) +
      (t.carbs + 'g').padEnd(8) +
      (t.fat + 'g').padEnd(8) +
      t.calories
    );
  });
}
