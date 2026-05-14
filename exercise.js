import {
  auth,
  onAuthStateChanged,
  saveWorkoutCycle,
  getWorkoutCycle,
  saveWorkoutLog,
  getWorkoutLog,
} from "./firebase.js";

// ─── MY SPLIT DATA ───────────────────────────────────────
const MY_SPLIT = [
  {
    day: 1,
    name: "Chest + Triceps",
    muscles: ["chest", "triceps"],
    icon: "💪",
    sets: {
      A: [
        {
          name: "Incline Bench Press",
          muscle: "chest",
          target: "Upper Chest",
          video: "jPLdzuHckI8",
        },
        {
          name: "Barbell Bench Press",
          muscle: "chest",
          target: "Middle Chest",
          video: "vcBig73ojpE",
        },
        {
          name: "Chest Dips",
          muscle: "chest",
          target: "Lower Chest",
          video: "2z8JmcrW-As",
        },
        {
          name: "Overhead Tricep Extension",
          muscle: "triceps",
          target: "Triceps Long Head",
          video: "YbX7Wd8jQ-Q",
        },
        {
          name: "Tricep Pushdown",
          muscle: "triceps",
          target: "Triceps Contraction",
          video: "2-LAMcpzODU",
        },
      ],
      B: [
        {
          name: "Incline Dumbbell Press",
          muscle: "chest",
          target: "Upper Chest",
          video: "8iPEnn-ltC8",
        },
        {
          name: "Dumbbell Flyes",
          muscle: "chest",
          target: "Middle Chest",
          video: "eozdVDA78K0",
        },
        {
          name: "Decline Bench Press",
          muscle: "chest",
          target: "Lower Chest",
          video: "6fotcWsMb0c",
        },
        {
          name: "Skull Crushers",
          muscle: "triceps",
          target: "Triceps Stretch",
          video: "d_KZxkY_0cM",
        },
        {
          name: "Close Grip Bench Press",
          muscle: "triceps",
          target: "Triceps Compound",
          video: "UYJsFzqdgK4",
        },
      ],
    },
  },
  {
    day: 2,
    name: "Back + Biceps",
    muscles: ["back", "biceps"],
    icon: "🏋️",
    sets: {
      A: [
        {
          name: "Pull-Ups / Chin-Ups",
          muscle: "back",
          target: "Lats Vertical",
          video: "eGo4IYlbE5g",
        },
        {
          name: "Seated Cable Row",
          muscle: "back",
          target: "Lats Horizontal",
          video: "GZbfZ033f74",
        },
        {
          name: "Barbell Row",
          muscle: "back",
          target: "Mid Back",
          video: "FWJR5Ve8bnQ",
        },
        {
          name: "Incline Dumbbell Curl",
          muscle: "biceps",
          target: "Biceps Stretch",
          video: "soxrZlIl35U",
        },
        {
          name: "Concentration Curl",
          muscle: "biceps",
          target: "Biceps Contraction",
          video: "4tqc6FQSHn8",
        },
      ],
      B: [
        {
          name: "Lat Pulldown",
          muscle: "back",
          target: "Lats Vertical",
          video: "CAwf7n6Luuc",
        },
        {
          name: "Single Arm Dumbbell Row",
          muscle: "back",
          target: "Lats Horizontal",
          video: "roCP6wCXPqo",
        },
        {
          name: "T-Bar Row",
          muscle: "back",
          target: "Mid Back",
          video: "j3Igk5nyZE4",
        },
        {
          name: "Preacher Curl",
          muscle: "biceps",
          target: "Biceps Stretch",
          video: "fIWP-FRFNU0",
        },
        {
          name: "Barbell Curl",
          muscle: "biceps",
          target: "Biceps Contraction",
          video: "kwG2ipFRgfo",
        },
      ],
    },
  },
  {
    day: 3,
    name: "Legs + Core",
    muscles: ["quads", "hamstrings", "glutes", "calves", "abs"],
    icon: "🦵",
    sets: {
      A: [
        {
          name: "Squat",
          muscle: "quads",
          target: "Quads",
          video: "Dy28eq2PjcM",
        },
        {
          name: "Romanian Deadlift",
          muscle: "hamstrings",
          target: "Hamstrings",
          video: "_oyxCn2iSjU",
        },
        {
          name: "Hip Thrust",
          muscle: "glutes",
          target: "Glutes",
          video: "SEdqd1n0cvg",
        },
        {
          name: "Standing Calf Raise",
          muscle: "calves",
          target: "Calves",
          video: "c5Kv6-fnTj8",
        },
        { name: "Plank", muscle: "abs", target: "Core", video: "pSHjTRCQxIw" },
      ],
      B: [
        {
          name: "Hack Squat",
          muscle: "quads",
          target: "Quads",
          video: "fE5BWPy7uRc",
        },
        {
          name: "Leg Curl",
          muscle: "hamstrings",
          target: "Hamstrings",
          video: "ELOCsoDSmrg",
        },
        {
          name: "Bulgarian Split Squat",
          muscle: "glutes",
          target: "Glutes",
          video: "2C-uNgKwPLE",
        },
        {
          name: "Seated Calf Raise",
          muscle: "calves",
          target: "Calves",
          video: "JbyjNymZOt0",
        },
        {
          name: "Side Plank",
          muscle: "abs",
          target: "Core",
          video: "44ND4bOB-T0",
        },
      ],
    },
  },
  {
    day: 4,
    name: "Shoulders + Abs",
    muscles: ["shoulders", "abs"],
    icon: "🏔️",
    sets: {
      A: [
        {
          name: "Overhead Press",
          muscle: "shoulders",
          target: "Front Delts",
          video: "_RlRDWO2jfg",
        },
        {
          name: "Dumbbell Lateral Raise",
          muscle: "shoulders",
          target: "Side Delts",
          video: "b_LEX4n9lOs",
        },
        {
          name: "Face Pulls",
          muscle: "shoulders",
          target: "Rear Delts",
          video: "rep-qVOkqgk",
        },
        {
          name: "Ab Wheel Rollout",
          muscle: "abs",
          target: "Upper Abs",
          video: "j6lR4u193gE",
        },
        {
          name: "Leg Raise",
          muscle: "abs",
          target: "Lower Abs",
          video: "JB2oyawG9KI",
        },
      ],
      B: [
        {
          name: "Arnold Press",
          muscle: "shoulders",
          target: "Front Delts",
          video: "6Z15_WdXmVw",
        },
        {
          name: "Upright Row",
          muscle: "shoulders",
          target: "Side Delts",
          video: "93BUvCE92As",
        },
        {
          name: "Reverse Pec Deck",
          muscle: "shoulders",
          target: "Rear Delts",
          video: "Z57CtFmRMxA",
        },
        {
          name: "Cable Crunch",
          muscle: "abs",
          target: "Upper Abs",
          video: "aBd6T01PBqw",
        },
        {
          name: "Hanging Knee Raise",
          muscle: "abs",
          target: "Lower Abs",
          video: "hdng3Nm1x_E",
        },
      ],
    },
  },
  {
    day: 5,
    name: "Light Cardio",
    muscles: [],
    icon: "🏃",
    isCardio: true,
    tips: [
      "20 minutes on the Stair Master at a comfortable pace",
      "Focus on breathing — keep heart rate at 60-70% max",
      "Light stretching after cardio — hold each stretch 30 seconds",
      "Today is recovery — let your muscles repair and grow",
      "Stay hydrated — drink at least 3 litres today",
      "Foam roll your legs and back if they feel tight",
    ],
  },
];

// ─── STANDARD SPLITS ─────────────────────────────────────
const STANDARD_SPLITS = {
  mysplit: { name: "My Split", days: MY_SPLIT },
  ppl: {
    name: "Push Pull Legs",
    days: [
      {
        name: "Push Day",
        muscles: ["chest", "shoulders", "triceps"],
        icon: "💪",
      },
      { name: "Pull Day", muscles: ["back", "biceps"], icon: "🏋️" },
      {
        name: "Leg Day",
        muscles: ["quads", "hamstrings", "glutes", "calves"],
        icon: "🦵",
      },
    ],
  },
  upperlower: {
    name: "Upper Lower",
    days: [
      {
        name: "Upper Body",
        muscles: ["chest", "back", "shoulders", "biceps", "triceps"],
        icon: "💪",
      },
      {
        name: "Lower Body",
        muscles: ["quads", "hamstrings", "glutes", "calves"],
        icon: "🦵",
      },
    ],
  },
  fullbody: {
    name: "Full Body",
    days: [
      {
        name: "Full Body",
        muscles: [
          "chest",
          "back",
          "shoulders",
          "biceps",
          "triceps",
          "quads",
          "hamstrings",
          "glutes",
        ],
        icon: "🔥",
      },
    ],
  },
  brosplit: {
    name: "Bro Split",
    days: [
      { name: "Chest Day", muscles: ["chest", "triceps"], icon: "💪" },
      { name: "Back Day", muscles: ["back", "biceps"], icon: "🏋️" },
      { name: "Shoulder Day", muscles: ["shoulders"], icon: "🏔️" },
      { name: "Arm Day", muscles: ["biceps", "triceps"], icon: "💪" },
      {
        name: "Leg Day",
        muscles: ["quads", "hamstrings", "glutes", "calves"],
        icon: "🦵",
      },
    ],
  },
  arnold: {
    name: "Arnold Split",
    days: [
      { name: "Chest + Back", muscles: ["chest", "back"], icon: "🏋️" },
      {
        name: "Shoulders + Arms",
        muscles: ["shoulders", "biceps", "triceps"],
        icon: "💪",
      },
      {
        name: "Legs",
        muscles: ["quads", "hamstrings", "glutes", "calves"],
        icon: "🦵",
      },
    ],
  },
  ppl6: {
    name: "PPL 6 Day",
    days: [
      {
        name: "Push Day A",
        muscles: ["chest", "shoulders", "triceps"],
        icon: "💪",
      },
      { name: "Pull Day A", muscles: ["back", "biceps"], icon: "🏋️" },
      {
        name: "Leg Day A",
        muscles: ["quads", "hamstrings", "glutes", "calves"],
        icon: "🦵",
      },
      {
        name: "Push Day B",
        muscles: ["chest", "shoulders", "triceps"],
        icon: "💪",
      },
      { name: "Pull Day B", muscles: ["back", "biceps"], icon: "🏋️" },
      {
        name: "Leg Day B",
        muscles: ["quads", "hamstrings", "glutes", "calves"],
        icon: "🦵",
      },
    ],
  },
  ul4: {
    name: "Upper Lower 4 Day",
    days: [
      {
        name: "Upper A",
        muscles: ["chest", "back", "shoulders", "biceps", "triceps"],
        icon: "💪",
      },
      {
        name: "Lower A",
        muscles: ["quads", "hamstrings", "glutes", "calves"],
        icon: "🦵",
      },
      {
        name: "Upper B",
        muscles: ["chest", "back", "shoulders", "biceps", "triceps"],
        icon: "💪",
      },
      {
        name: "Lower B",
        muscles: ["quads", "hamstrings", "glutes", "calves"],
        icon: "🦵",
      },
    ],
  },
  custom: { name: "+ Custom", days: [] },
};

// ─── EXERCISE LIBRARY ────────────────────────────────────
const exercises = [
  {
    name: "Bench Press",
    muscle: "chest",
    targets: "Middle chest, triceps, front delts",
    video: "vcBig73ojpE",
  },
  {
    name: "Incline Bench Press",
    muscle: "chest",
    targets: "Upper chest, front delts, triceps",
    video: "jPLdzuHckI8",
  },
  {
    name: "Decline Bench Press",
    muscle: "chest",
    targets: "Lower chest, triceps",
    video: "6fotcWsMb0c",
  },
  {
    name: "Dumbbell Flyes",
    muscle: "chest",
    targets: "Chest, front delts",
    video: "eozdVDA78K0",
  },
  {
    name: "Cable Crossover",
    muscle: "chest",
    targets: "Chest isolation",
    video: "taI4XduLpTk",
  },
  {
    name: "Push-Ups",
    muscle: "chest",
    targets: "Chest, front delts, triceps",
    video: "IODxDxX7oi4",
  },
  {
    name: "Chest Dips",
    muscle: "chest",
    targets: "Lower chest, triceps",
    video: "2z8JmcrW-As",
  },
  {
    name: "Deadlift",
    muscle: "back",
    targets: "Entire back, glutes, hamstrings",
    video: "VL5Ab0T07e4",
  },
  {
    name: "Pull-Ups / Chin-Ups",
    muscle: "back",
    targets: "Lats, biceps, rhomboids",
    video: "eGo4IYlbE5g",
  },
  {
    name: "Barbell Row",
    muscle: "back",
    targets: "Lats, rhomboids, traps, biceps",
    video: "FWJR5Ve8bnQ",
  },
  {
    name: "Seated Cable Row",
    muscle: "back",
    targets: "Lats, rhomboids, rear delts",
    video: "GZbfZ033f74",
  },
  {
    name: "Lat Pulldown",
    muscle: "back",
    targets: "Lats, biceps",
    video: "CAwf7n6Luuc",
  },
  {
    name: "Single Arm Dumbbell Row",
    muscle: "back",
    targets: "Lats, rhomboids, biceps",
    video: "roCP6wCXPqo",
  },
  {
    name: "T-Bar Row",
    muscle: "back",
    targets: "Lats, rhomboids, traps",
    video: "j3Igk5nyZE4",
  },
  {
    name: "Overhead Press",
    muscle: "shoulders",
    targets: "Front & side delts, traps, triceps",
    video: "_RlRDWO2jfg",
  },
  {
    name: "Dumbbell Lateral Raise",
    muscle: "shoulders",
    targets: "Side delts",
    video: "b_LEX4n9lOs",
  },
  {
    name: "Front Raise",
    muscle: "shoulders",
    targets: "Front delts",
    video: "CH9JzDStL3U",
  },
  {
    name: "Reverse Pec Deck",
    muscle: "shoulders",
    targets: "Rear delts, rhomboids",
    video: "Z57CtFmRMxA",
  },
  {
    name: "Face Pulls",
    muscle: "shoulders",
    targets: "Rear delts, traps, rhomboids",
    video: "rep-qVOkqgk",
  },
  {
    name: "Arnold Press",
    muscle: "shoulders",
    targets: "All three delt heads, triceps",
    video: "6Z15_WdXmVw",
  },
  {
    name: "Upright Row",
    muscle: "shoulders",
    targets: "Side delts, traps",
    video: "93BUvCE92As",
  },
  {
    name: "Barbell Curl",
    muscle: "biceps",
    targets: "Biceps, forearms",
    video: "kwG2ipFRgfo",
  },
  {
    name: "Dumbbell Curl",
    muscle: "biceps",
    targets: "Biceps",
    video: "ykJmrZ5v0Oo",
  },
  {
    name: "Hammer Curl",
    muscle: "biceps",
    targets: "Biceps, brachialis, forearms",
    video: "TwD-YGVP4Bk",
  },
  {
    name: "Preacher Curl",
    muscle: "biceps",
    targets: "Biceps",
    video: "fIWP-FRFNU0",
  },
  {
    name: "Incline Dumbbell Curl",
    muscle: "biceps",
    targets: "Biceps long head",
    video: "soxrZlIl35U",
  },
  {
    name: "Cable Curl",
    muscle: "biceps",
    targets: "Biceps",
    video: "NFzTWp2qpiE",
  },
  {
    name: "Concentration Curl",
    muscle: "biceps",
    targets: "Biceps",
    video: "4tqc6FQSHn8",
  },
  {
    name: "Tricep Pushdown",
    muscle: "triceps",
    targets: "Triceps",
    video: "2-LAMcpzODU",
  },
  {
    name: "Skull Crushers",
    muscle: "triceps",
    targets: "Triceps",
    video: "d_KZxkY_0cM",
  },
  {
    name: "Overhead Tricep Extension",
    muscle: "triceps",
    targets: "Triceps long head",
    video: "YbX7Wd8jQ-Q",
  },
  {
    name: "Close Grip Bench Press",
    muscle: "triceps",
    targets: "Triceps, chest",
    video: "UYJsFzqdgK4",
  },
  {
    name: "Tricep Dips",
    muscle: "triceps",
    targets: "Triceps, lower chest",
    video: "2z8JmcrW-As",
  },
  {
    name: "Kickbacks",
    muscle: "triceps",
    targets: "Triceps",
    video: "6SS6K3lAwZ8",
  },
  {
    name: "Diamond Push-Ups",
    muscle: "triceps",
    targets: "Triceps, chest",
    video: "8_ILkbB9an8",
  },
  {
    name: "Wrist Curl",
    muscle: "forearms",
    targets: "Forearm flexors",
    video: "7ac_qmBjkFI",
  },
  {
    name: "Reverse Wrist Curl",
    muscle: "forearms",
    targets: "Forearm extensors",
    video: "SfENsl5klVA",
  },
  {
    name: "Farmer's Carry",
    muscle: "forearms",
    targets: "Forearms, grip, traps",
    video: "Fkzk_RqlYig",
  },
  {
    name: "Dead Hang",
    muscle: "forearms",
    targets: "Forearms, grip",
    video: "2vspW4N4BMs",
  },
  {
    name: "Reverse Curl",
    muscle: "forearms",
    targets: "Brachialis, forearm extensors",
    video: "10AFVfSUzsU",
  },
  { name: "Crunch", muscle: "abs", targets: "Upper abs", video: "Xyd_fa5zoEU" },
  {
    name: "Leg Raise",
    muscle: "abs",
    targets: "Lower abs, hip flexors",
    video: "JB2oyawG9KI",
  },
  {
    name: "Plank",
    muscle: "abs",
    targets: "Entire core, shoulders",
    video: "pSHjTRCQxIw",
  },
  {
    name: "Cable Crunch",
    muscle: "abs",
    targets: "Upper abs",
    video: "aBd6T01PBqw",
  },
  {
    name: "Ab Wheel Rollout",
    muscle: "abs",
    targets: "Entire core",
    video: "j6lR4u193gE",
  },
  {
    name: "Hanging Knee Raise",
    muscle: "abs",
    targets: "Lower abs, hip flexors",
    video: "hdng3Nm1x_E",
  },
  {
    name: "Sit-Ups",
    muscle: "abs",
    targets: "Abs, hip flexors",
    video: "jDwoBqPH0jk",
  },
  {
    name: "Russian Twist",
    muscle: "obliques",
    targets: "Obliques",
    video: "wkD8rjkodUI",
  },
  {
    name: "Side Plank",
    muscle: "obliques",
    targets: "Obliques, core",
    video: "44ND4bOB-T0",
  },
  {
    name: "Woodchop",
    muscle: "obliques",
    targets: "Obliques, shoulders",
    video: "7eCm3WQgzmI",
  },
  {
    name: "Bicycle Crunch",
    muscle: "obliques",
    targets: "Obliques, abs",
    video: "9FGilxCbdz8",
  },
  {
    name: "Side Bend",
    muscle: "obliques",
    targets: "Obliques",
    video: "ltVi1F5SBkE",
  },
  {
    name: "Hyperextension",
    muscle: "lowerback",
    targets: "Lower back, glutes",
    video: "ph3pddpKzzw",
  },
  {
    name: "Good Morning",
    muscle: "lowerback",
    targets: "Lower back, hamstrings, glutes",
    video: "YA-h3n9L4YU",
  },
  {
    name: "Superman",
    muscle: "lowerback",
    targets: "Lower back, glutes",
    video: "z6PJMT2y8GQ",
  },
  {
    name: "Romanian Deadlift",
    muscle: "lowerback",
    targets: "Lower back, hamstrings, glutes",
    video: "_oyxCn2iSjU",
  },
  {
    name: "Squat",
    muscle: "quads",
    targets: "Quads, glutes, hamstrings",
    video: "Dy28eq2PjcM",
  },
  {
    name: "Leg Press",
    muscle: "quads",
    targets: "Quads, glutes",
    video: "IZxyjW7MPJQ",
  },
  {
    name: "Leg Extension",
    muscle: "quads",
    targets: "Quads",
    video: "YyvSfVjQeL0",
  },
  {
    name: "Lunges",
    muscle: "quads",
    targets: "Quads, glutes",
    video: "QOVaHwm-Q6U",
  },
  {
    name: "Hack Squat",
    muscle: "quads",
    targets: "Quads, glutes",
    video: "fE5BWPy7uRc",
  },
  {
    name: "Front Squat",
    muscle: "quads",
    targets: "Quads, core",
    video: "uYumuL_G_V0",
  },
  {
    name: "Leg Curl",
    muscle: "hamstrings",
    targets: "Hamstrings",
    video: "ELOCsoDSmrg",
  },
  {
    name: "Stiff Leg Deadlift",
    muscle: "hamstrings",
    targets: "Hamstrings, lower back",
    video: "1uDiW5--rAE",
  },
  {
    name: "Glute Ham Raise",
    muscle: "hamstrings",
    targets: "Hamstrings, glutes",
    video: "6XB6f8yk9cU",
  },
  {
    name: "Hip Thrust",
    muscle: "glutes",
    targets: "Glutes, hamstrings",
    video: "SEdqd1n0cvg",
  },
  {
    name: "Glute Bridge",
    muscle: "glutes",
    targets: "Glutes",
    video: "OUgsJ8-Vi0E",
  },
  {
    name: "Bulgarian Split Squat",
    muscle: "glutes",
    targets: "Glutes, quads",
    video: "2C-uNgKwPLE",
  },
  {
    name: "Cable Kickback",
    muscle: "glutes",
    targets: "Glutes",
    video: "5jJNfIlKTmg",
  },
  {
    name: "Standing Calf Raise",
    muscle: "calves",
    targets: "Gastrocnemius",
    video: "c5Kv6-fnTj8",
  },
  {
    name: "Seated Calf Raise",
    muscle: "calves",
    targets: "Soleus",
    video: "JbyjNymZOt0",
  },
  {
    name: "Donkey Calf Raise",
    muscle: "calves",
    targets: "Gastrocnemius",
    video: "QrDvbLE-oyo",
  },
  { name: "Shrugs", muscle: "traps", targets: "Traps", video: "cJRVVxmytaM" },
  {
    name: "Rack Pull",
    muscle: "traps",
    targets: "Traps, upper back",
    video: "Y99s0dNWpUw",
  },
  {
    name: "Straight Arm Pulldown",
    muscle: "lats",
    targets: "Lats",
    video: "vJwAbr_pVVM",
  },
  {
    name: "Bent Over Lateral Raise",
    muscle: "reardelts",
    targets: "Rear delts",
    video: "gQBJPfWf_-s",
  },
  {
    name: "Cable Rear Delt Fly",
    muscle: "reardelts",
    targets: "Rear delts",
    video: "EA7u4Q_8HQ0",
  },
];

// ─── MUSCLE OPTIONS FOR CUSTOM SPLIT ─────────────────────
const MUSCLE_OPTIONS = [
  "Chest",
  "Back",
  "Shoulders",
  "Biceps",
  "Triceps",
  "Forearms",
  "Legs",
  "Quads",
  "Hamstrings",
  "Glutes",
  "Calves",
  "Abs",
  "Core",
  "Cardio",
  "Rest",
];

// ─── STATE ───────────────────────────────────────────────
let currentUser = null;
let cycleData = null;
let activeMode = "workout";
let activeMuscle = "chest";
let searchQuery = "";
let activeSplit = "mysplit";
let customSplitDays = [];

// ─── CYCLE LOGIC ─────────────────────────────────────────
function getSplitDays() {
  if (activeSplit === "custom") {
    return customSplitDays.length > 0 ? customSplitDays : [];
  }
  return STANDARD_SPLITS[activeSplit]?.days || MY_SPLIT;
}

function getTodayDayIndex() {
  if (!cycleData || !cycleData.startDate) return 0;
  const start = new Date(cycleData.startDate);
  const today = new Date();
  start.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((today - start) / (1000 * 60 * 60 * 24));
  const splitDays = getSplitDays();
  return diffDays % splitDays.length;
}

// Returns how many full cycles have elapsed since cycleData.startDate
function elapsedCycleCount() {
  const splitDays = getSplitDays();
  if (!splitDays.length) return 0;
  const start = new Date(cycleData.startDate);
  const today = new Date();
  start.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((today - start) / (1000 * 60 * 60 * 24));
  return Math.floor(diffDays / splitDays.length);
}

function isNewCycle() {
  if (!cycleData || !cycleData.startDate) return false;

  // Same-day localStorage guard — blocks re-show on refresh before Firestore loads
  const todayStr = new Date().toISOString().split("T")[0];
  if (localStorage.getItem("fitdesi_cycle_ack") === todayStr) return false;

  // Compare elapsed cycles vs how many the user has already acknowledged
  const elapsed = elapsedCycleCount();
  const acknowledged = cycleData.acknowledgedCycles ?? 0;
  return elapsed > acknowledged;
}

function getCurrentSet() {
  return cycleData?.currentSet || "A";
}

// ─── GET EXERCISES FOR DAY ───────────────────────────────
function getExercisesForDay(dayData) {
  if (!dayData || dayData.isCardio) return null;

  // If it's My Split, use the structured Set A/B
  if (activeSplit === "mysplit") {
    const mySplitDay = MY_SPLIT.find((d) => d.name === dayData.name);
    if (mySplitDay) return mySplitDay.sets[getCurrentSet()];
  }

  // For other splits, pull from exercise library by muscle
  const muscles = dayData.muscles || [];
  const result = [];
  muscles.forEach((muscle) => {
    const muscleExercises = exercises.filter((e) => e.muscle === muscle);
    if (muscleExercises.length > 0) {
      const picked =
        muscleExercises[Math.floor(Math.random() * muscleExercises.length)];
      result.push({
        name: picked.name,
        muscle: picked.muscle,
        target: muscle.charAt(0).toUpperCase() + muscle.slice(1),
        video: picked.video,
      });
    }
  });
  return result;
}

// ─── RENDER SPLIT SELECTOR ───────────────────────────────
function renderSplitSelector() {
  return `
        <div class="section-label">Active Split</div>
        <div class="split-scroll">
            ${Object.entries(STANDARD_SPLITS)
              .map(
                ([key, split]) => `
                <div class="split-pill ${key === activeSplit ? "active" : ""} ${key === "custom" ? "custom-pill" : ""}"
                    data-split="${key}">${split.name}</div>
            `,
              )
              .join("")}
        </div>
    `;
}

// ─── RENDER WEEK VIEW ────────────────────────────────────
function renderWeekView() {
  const splitDays = getSplitDays();
  if (splitDays.length === 0) return "";

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const today = new Date().getDay(); // 0=Sun, 1=Mon ... 6=Sat
  const todayIdx = getTodayDayIndex();

  // Convert JS day (0=Sun) to our index (0=Mon)
  const todayColIdx = today === 0 ? 6 : today - 1;

  return `
        <div class="week-grid">
            ${days
              .map((day, i) => {
                // How many days from today is this column?
                const offset = i - todayColIdx;
                // What cycle day index is that?
                const cycleIdx =
                  (((todayIdx + offset) % splitDays.length) +
                    splitDays.length) %
                  splitDays.length;
                const dayData = splitDays[cycleIdx];
                const isToday = i === todayColIdx;

                const muscles = dayData?.isCardio
                  ? "Cardio"
                  : dayData?.muscles
                      ?.slice(0, 2)
                      .map((m) => m.charAt(0).toUpperCase() + m.slice(1))
                      .join("<br>") || "Rest";

                return `
                    <div class="week-day ${isToday ? "today" : ""}" data-cycle-idx="${cycleIdx}" data-day-name="${dayData?.name || "Rest"}">
                        <div class="week-day-name">${day}</div>
                        <div class="week-day-muscle">${dayData?.icon || ""} ${muscles}</div>
                    </div>
                `;
              })
              .join("")}
        </div>
    `;
}

// ─── RENDER MY WORKOUT ───────────────────────────────────
function renderMyWorkout() {
  const container = document.getElementById("workoutContainer");
  const splitDays = getSplitDays();

  if (!cycleData || !cycleData.startDate) {
    container.innerHTML = `
            ${renderSplitSelector()}
            ${renderWeekView()}
            <div class="setup-prompt">
                <div class="setup-icon">🏋️</div>
                <div class="setup-title">Start your cycle</div>
                <div class="setup-desc">Begin your rolling split from today</div>
                <button class="start-cycle-btn" id="startCycleBtn">Start My Cycle Today</button>
            </div>
        `;
    attachSplitListeners();
    document
      .getElementById("startCycleBtn")
      ?.addEventListener("click", async () => {
        cycleData = {
          startDate: new Date().toISOString(),
          currentSet: "A",
          cycleCount: 1,
          activeSplit,
        };
        await saveWorkoutCycle(currentUser.uid, cycleData);
        renderMyWorkout();
        updateHomeWorkout();
      });
    return;
  }

  const dayIdx = getTodayDayIndex();
  const dayData = splitDays[dayIdx];
  const currentSet = getCurrentSet();
  const cycleNum = cycleData.cycleCount || 1;

  if (!dayData) {
    container.innerHTML = `${renderSplitSelector()}${renderWeekView()}<div style="text-align:center;padding:40px;color:rgba(255,255,255,0.3)">No workout data for today</div>`;
    attachSplitListeners();
    return;
  }

  const dayExercises = getExercisesForDay(dayData);

  container.innerHTML = `
        ${renderSplitSelector()}
        ${renderWeekView()}
        <hr class="workout-divider">
        <div class="workout-day-badge">Day ${dayIdx + 1} of ${splitDays.length} · Cycle ${cycleNum}</div>
        <div class="workout-title">${dayData.icon} ${dayData.name}</div>
        <div class="workout-subtitle">Set ${currentSet} · Started ${new Date(cycleData.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>

        ${
          dayData.isCardio
            ? `
            <div class="cardio-tips">
                ${
                  dayData.tips
                    ? dayData.tips
                        .map(
                          (tip) => `
                    <div class="cardio-tip">
                        <span class="cardio-tip-dot">·</span>
                        <span>${tip}</span>
                    </div>
                `,
                        )
                        .join("")
                    : '<div class="cardio-tip"><span class="cardio-tip-dot">·</span><span>Light cardio day — stair master, treadmill or walking</span></div>'
                }
            </div>
        `
            : `
            <div class="workout-exercises">
                ${
                  dayExercises
                    ? dayExercises
                        .map(
                          (ex) => `
                    <div class="workout-ex-card">
                        <div class="workout-ex-target">${ex.target}</div>
                        <div class="workout-ex-name">${ex.name}</div>
                        <div class="video-wrapper">
                            <iframe src="https://www.youtube.com/embed/${ex.video}?rel=0&modestbranding=1"
                                allowfullscreen loading="lazy"></iframe>
                        </div>
                        <div class="workout-logging" data-exercise="${ex.name}">
                            <div class="logging-header">
                                <span>Log your sets</span>
                                <button class="add-set-btn" data-exercise="${ex.name}">+ Add Set</button>
                            </div>
                            <div class="sets-container" id="sets-${ex.name.replace(/\s+/g, "-")}">
                                <!-- Sets will be added here -->
                            </div>
                        </div>
                    </div>
                `,
                        )
                        .join("")
                    : '<div style="color:rgba(255,255,255,0.2);text-align:center;padding:20px">No exercises found</div>'
                }
            </div>
        `
        }
    `;

  attachSplitListeners();

  // Load workout logs for today
  const todayKey = new Date().toISOString().split("T")[0];
  for (const ex of dayExercises) {
    loadExerciseLogs(ex.name, todayKey);
  }

  // Attach logging listeners
  attachLoggingListeners();
}

// ─── ATTACH SPLIT LISTENERS ──────────────────────────────
function attachSplitListeners() {
  document.querySelectorAll(".split-pill").forEach((pill) => {
    pill.addEventListener("click", async () => {
      const split = pill.dataset.split;
      if (split === "custom") {
        openCustomSplitModal();
        return;
      }
      activeSplit = split;
      if (cycleData) {
        cycleData.activeSplit = split;
        await saveWorkoutCycle(currentUser.uid, cycleData);
      }
      renderMyWorkout();
      updateHomeWorkout();
    });
  });
}

// ─── WORKOUT LOGGING ─────────────────────────────────────
async function loadExerciseLogs(exerciseName, dateKey) {
  const sets = await getWorkoutLog(currentUser.uid, dateKey, exerciseName);
  renderSets(exerciseName, sets);
}

function renderSets(exerciseName, sets) {
  const container = document.getElementById(
    `sets-${exerciseName.replace(/\s+/g, "-")}`,
  );
  if (!container) return;

  container.innerHTML = sets
    .map(
      (set, index) => `
    <div class="set-row">
      <span class="set-label">Set ${index + 1}</span>
      <input type="number" class="set-input reps-input" placeholder="Reps" value="${set.reps || ""}" min="1">
      <input type="number" class="set-input weight-input" placeholder="Weight" value="${set.weight || ""}" min="0" step="0.5">
      <button class="remove-set-btn" data-exercise="${exerciseName}" data-set-index="${index}">×</button>
    </div>
  `,
    )
    .join("");
}

function attachLoggingListeners() {
  // Add set buttons
  document.querySelectorAll(".add-set-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const exerciseName = e.target.dataset.exercise;
      const container = document.getElementById(
        `sets-${exerciseName.replace(/\s+/g, "-")}`,
      );
      const setRows = container.querySelectorAll(".set-row");
      const newIndex = setRows.length;

      const newSet = document.createElement("div");
      newSet.className = "set-row";
      newSet.innerHTML = `
        <span class="set-label">Set ${newIndex + 1}</span>
        <input type="number" class="set-input reps-input" placeholder="Reps" min="1">
        <input type="number" class="set-input weight-input" placeholder="Weight" min="0" step="0.5">
        <button class="remove-set-btn" data-exercise="${exerciseName}" data-set-index="${newIndex}">×</button>
      `;
      container.appendChild(newSet);

      // Re-attach remove listeners
      attachRemoveListeners();
      saveCurrentSets(exerciseName);
    });
  });

  attachRemoveListeners();
  attachInputListeners();
}

function attachRemoveListeners() {
  document.querySelectorAll(".remove-set-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const exerciseName = e.target.dataset.exercise;
      const setIndex = parseInt(e.target.dataset.setIndex);
      const container = document.getElementById(
        `sets-${exerciseName.replace(/\s+/g, "-")}`,
      );
      const setRows = container.querySelectorAll(".set-row");
      if (setRows[setIndex]) {
        setRows[setIndex].remove();
        // Renumber remaining sets
        container.querySelectorAll(".set-row").forEach((row, idx) => {
          row.querySelector(".set-label").textContent = `Set ${idx + 1}`;
          row.querySelector(".remove-set-btn").dataset.setIndex = idx;
        });
        saveCurrentSets(exerciseName);
      }
    });
  });
}

function attachInputListeners() {
  document.querySelectorAll(".set-input").forEach((input) => {
    input.addEventListener("input", (e) => {
      const exerciseName =
        e.target.closest(".workout-logging").dataset.exercise;
      saveCurrentSets(exerciseName);
    });
  });
}

async function saveCurrentSets(exerciseName) {
  const container = document.getElementById(
    `sets-${exerciseName.replace(/\s+/g, "-")}`,
  );
  const setRows = container.querySelectorAll(".set-row");
  const sets = Array.from(setRows)
    .map((row) => {
      const reps = parseInt(row.querySelector(".reps-input").value) || 0;
      const weight = parseFloat(row.querySelector(".weight-input").value) || 0;
      return { reps, weight };
    })
    .filter((set) => set.reps > 0 || set.weight > 0);

  const todayKey = new Date().toISOString().split("T")[0];
  await saveWorkoutLog(currentUser.uid, todayKey, exerciseName, sets);
}

// ─── RENDER EXERCISE LIBRARY ─────────────────────────────
function renderLibrary() {
  const grid = document.getElementById("exerciseGrid");
  const filtered = exercises.filter((ex) => {
    const muscleMatch = ex.muscle === activeMuscle;
    const searchMatch =
      ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.targets.toLowerCase().includes(searchQuery.toLowerCase());
    return muscleMatch && searchMatch;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;color:rgba(255,255,255,0.2);padding:60px 0;font-size:14px">No exercises found</div>`;
    return;
  }

  grid.innerHTML = filtered
    .map(
      (ex) => `
        <div class="exercise-card">
            <div class="video-wrapper">
                <iframe src="https://www.youtube.com/embed/${ex.video}?rel=0&modestbranding=1"
                    allowfullscreen loading="lazy"></iframe>
            </div>
            <div class="card-body">
                <span class="card-muscle-tag">${ex.muscle}</span>
                <div class="card-title">${ex.name}</div>
                <div class="card-targets">${ex.targets}</div>
            </div>
        </div>
    `,
    )
    .join("");
}

// ─── CUSTOM SPLIT MODAL ──────────────────────────────────
function openCustomSplitModal() {
  renderCustomSplitDays();
  document.getElementById("customSplitModal").classList.add("open");
}

function renderCustomSplitDays() {
  const container = document.getElementById("customSplitDays");
  if (customSplitDays.length === 0) {
    customSplitDays = [{ name: "Day 1", muscles: [] }];
  }

  container.innerHTML = customSplitDays
    .map(
      (day, idx) => `
        <div class="custom-day-row">
            <div class="custom-day-header">
                <div class="custom-day-title">Day ${idx + 1}</div>
                ${customSplitDays.length > 1 ? `<button class="custom-day-remove" data-idx="${idx}">Remove</button>` : ""}
            </div>
            <div class="custom-day-options">
                ${MUSCLE_OPTIONS.map((opt) => {
                  const isSelected = day.muscles.includes(opt);
                  const isCardio = opt === "Cardio" || opt === "Rest";
                  return `<button class="custom-day-option ${isSelected ? (isCardio ? "cardio-sel" : "selected") : ""}"
                        data-day="${idx}" data-opt="${opt}">${opt}</button>`;
                }).join("")}
            </div>
        </div>
    `,
    )
    .join("");

  container.querySelectorAll(".custom-day-option").forEach((btn) => {
    btn.addEventListener("click", () => {
      const dayIdx = parseInt(btn.dataset.day);
      const opt = btn.dataset.opt;
      const isCardio = opt === "Cardio" || opt === "Rest";
      const day = customSplitDays[dayIdx];

      if (isCardio) {
        day.muscles = day.muscles.includes(opt) ? [] : [opt];
      } else {
        day.muscles = day.muscles.filter((m) => m !== "Cardio" && m !== "Rest");
        if (day.muscles.includes(opt)) {
          day.muscles = day.muscles.filter((m) => m !== opt);
        } else {
          day.muscles.push(opt);
        }
      }
      renderCustomSplitDays();
    });
  });

  container.querySelectorAll(".custom-day-remove").forEach((btn) => {
    btn.addEventListener("click", () => {
      customSplitDays.splice(parseInt(btn.dataset.idx), 1);
      renderCustomSplitDays();
    });
  });
}

document.getElementById("addCustomDay").addEventListener("click", () => {
  customSplitDays.push({
    name: `Day ${customSplitDays.length + 1}`,
    muscles: [],
  });
  renderCustomSplitDays();
});

document.getElementById("customSplitClose").addEventListener("click", () => {
  document.getElementById("customSplitModal").classList.remove("open");
});

document
  .getElementById("saveCustomSplit")
  .addEventListener("click", async () => {
    STANDARD_SPLITS.custom.days = customSplitDays.map((day, idx) => ({
      name: `Day ${idx + 1} — ${day.muscles.join(", ") || "Rest"}`,
      muscles: day.muscles.map((m) => m.toLowerCase()),
      icon: day.muscles.includes("Cardio")
        ? "🏃"
        : day.muscles.includes("Rest")
          ? "😴"
          : "💪",
      isCardio: day.muscles.includes("Cardio") || day.muscles.includes("Rest"),
    }));

    activeSplit = "custom";
    if (cycleData) {
      cycleData.activeSplit = "custom";
      cycleData.customSplitDays = customSplitDays;
      await saveWorkoutCycle(currentUser.uid, cycleData);
    }

    document.getElementById("customSplitModal").classList.remove("open");
    renderMyWorkout();
    updateHomeWorkout();
  });

// ─── SET SELECTOR POPUP ──────────────────────────────────
document.addEventListener("click", async (e) => {
  if (e.target.id === "chooseSetA" || e.target.id === "chooseSetB") {
    cycleData.currentSet = e.target.id === "chooseSetA" ? "A" : "B";
    cycleData.cycleCount = (cycleData.cycleCount || 1) + 1;
    // Record how many cycles have been acknowledged so isNewCycle() won't
    // fire again until another full split length has elapsed.
    cycleData.acknowledgedCycles = elapsedCycleCount();
    // Belt-and-suspenders localStorage stamp
    localStorage.setItem("fitdesi_cycle_ack", new Date().toISOString().split("T")[0]);
    await saveWorkoutCycle(currentUser.uid, cycleData);
    document.getElementById("setPopupModal").classList.remove("open");
    renderMyWorkout();
  }
});

// ─── MODE SWITCHING ──────────────────────────────────────
document.querySelectorAll(".mode-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".mode-btn")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    activeMode = btn.dataset.mode;
    document
      .getElementById("workoutView")
      .classList.toggle("hidden", activeMode !== "workout");
    document
      .getElementById("libraryView")
      .classList.toggle("hidden", activeMode !== "library");
  });
});

// ─── MUSCLE FILTER ───────────────────────────────────────
document.querySelectorAll(".muscle-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".muscle-btn")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    activeMuscle = btn.dataset.muscle;
    renderLibrary();
  });
});

// ─── SEARCH ──────────────────────────────────────────────
document.getElementById("searchInput").addEventListener("input", (e) => {
  searchQuery = e.target.value;
  renderLibrary();
});

// ─── TRAIN THIS TODAY ────────────────────────────────────
let trainTodayPendingIdx = null;

// Delegated click on week-day chips — skip the "today" chip (already active)
document.getElementById("workoutContainer").addEventListener("click", (e) => {
  const chip = e.target.closest(".week-day");
  if (!chip || chip.classList.contains("today")) return;
  if (!cycleData || !cycleData.startDate) return;

  trainTodayPendingIdx = parseInt(chip.dataset.cycleIdx, 10);
  const dayName = chip.dataset.dayName || "this workout";
  document.getElementById("trainTodayMsg").textContent =
    `Start your cycle from "${dayName}" today?`;
  document.getElementById("trainTodayModal").classList.add("open");
});

document.getElementById("trainTodayCancel").addEventListener("click", () => {
  document.getElementById("trainTodayModal").classList.remove("open");
  trainTodayPendingIdx = null;
});

document.getElementById("trainTodayModal").addEventListener("click", (e) => {
  if (e.target === e.currentTarget) {
    e.currentTarget.classList.remove("open");
    trainTodayPendingIdx = null;
  }
});

document.getElementById("trainTodayConfirm").addEventListener("click", async () => {
  if (trainTodayPendingIdx === null || !cycleData) return;

  const splitDays = getSplitDays();
  const cycleIdx = trainTodayPendingIdx;

  // Recalculate startDate so that cycleIdx becomes today's index,
  // while keeping the elapsed cycle count intact (no popup re-trigger).
  // newDiffDays = acknowledgedCycles * splitLen + cycleIdx
  // → today is exactly cycleIdx days into the current "acknowledged" cycle.
  const ack = cycleData.acknowledgedCycles ?? 0;
  const newDiffDays = ack * splitDays.length + cycleIdx;

  const todayMidnight = new Date();
  todayMidnight.setHours(0, 0, 0, 0);
  const newStartDate = new Date(todayMidnight.getTime() - newDiffDays * 86400000);

  // Only update startDate — never touch cycleCount or acknowledgedCycles
  cycleData.startDate = newStartDate.toISOString();
  await saveWorkoutCycle(currentUser.uid, cycleData);

  document.getElementById("trainTodayModal").classList.remove("open");
  location.reload();
});

// ─── HOME WORKOUT SYNC ───────────────────────────────────
function updateHomeWorkout() {
  const splitDays = getSplitDays();
  if (!splitDays.length) return;
  const dayIdx = getTodayDayIndex();
  const dayData = splitDays[dayIdx];
  if (!dayData) return;
  localStorage.setItem(
    "todayWorkout",
    JSON.stringify({
      name: dayData.name,
      icon: dayData.icon,
      isCardio: dayData.isCardio || false,
    }),
  );
}

// ─── INIT ────────────────────────────────────────────────
document.getElementById("currentDate").textContent =
  new Date().toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  currentUser = user;
  cycleData = await getWorkoutCycle(user.uid);

  if (cycleData) {
    activeSplit = cycleData.activeSplit || "mysplit";
    if (cycleData.customSplitDays) {
      customSplitDays = cycleData.customSplitDays;
      STANDARD_SPLITS.custom.days = customSplitDays.map((day, idx) => ({
        name: `Day ${idx + 1} — ${day.muscles.join(", ") || "Rest"}`,
        muscles: day.muscles.map((m) => m.toLowerCase()),
        icon: day.muscles.includes("Cardio") ? "🏃" : "💪",
        isCardio:
          day.muscles.includes("Cardio") || day.muscles.includes("Rest"),
      }));
    }
    if (isNewCycle()) {
      // Stamp localStorage immediately so refresh before picking a set
      // doesn't re-show the popup.
      localStorage.setItem("fitdesi_cycle_ack", new Date().toISOString().split("T")[0]);
      document.getElementById("setPopupModal").classList.add("open");
    }
  }

  document.querySelector('[data-muscle="chest"]').classList.add("active");
  renderMyWorkout();
  renderLibrary();
  updateHomeWorkout();
});
