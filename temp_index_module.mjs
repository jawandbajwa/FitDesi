
      import {
        onAuthStateChanged,
        auth,
        isAdmin,
        getWorkoutCycle,
        getUserProfile,
        getDailyLog,
      } from "./firebase.js";
      import { initCoach } from "./coach.js";

      initCoach();

      const PROTEIN_CIRC = 339.3;
      const MINI_CIRC = 87.96;

      function setRing(id, circ, pct) {
        const el = document.getElementById(id);
        if (el)
          el.setAttribute("stroke-dashoffset", circ * (1 - Math.min(pct, 1)));
      }

      function getTimeOfDay() {
        const h = new Date().getHours();
        if (h < 12) return "morning";
        if (h < 17) return "afternoon";
        return "evening";
      }

      const MY_SPLIT = [
        { name: "Chest + Triceps", icon: "💪" },
        { name: "Back + Biceps", icon: "🏋️" },
        { name: "Legs + Core", icon: "🦵" },
        { name: "Shoulders + Abs", icon: "🏔️" },
        { name: "Light Cardio", icon: "🏃", isCardio: true },
      ];

      const STANDARD_SPLITS = {
        mysplit: MY_SPLIT,
        ppl: [
          { name: "Push Day", icon: "💪" },
          { name: "Pull Day", icon: "🏋️" },
          { name: "Leg Day", icon: "🦵" },
        ],
        upperlower: [
          { name: "Upper Body", icon: "💪" },
          { name: "Lower Body", icon: "🦵" },
        ],
        fullbody: [{ name: "Full Body", icon: "🔥" }],
        brosplit: [
          { name: "Chest Day", icon: "💪" },
          { name: "Back Day", icon: "🏋️" },
          { name: "Shoulder Day", icon: "🏔️" },
          { name: "Arm Day", icon: "💪" },
          { name: "Leg Day", icon: "🦵" },
        ],
        arnold: [
          { name: "Chest + Back", icon: "🏋️" },
          { name: "Shoulders + Arms", icon: "💪" },
          { name: "Legs", icon: "🦵" },
        ],
        ppl6: [
          { name: "Push Day A", icon: "💪" },
          { name: "Pull Day A", icon: "🏋️" },
          { name: "Leg Day A", icon: "🦵" },
          { name: "Push Day B", icon: "💪" },
          { name: "Pull Day B", icon: "🏋️" },
          { name: "Leg Day B", icon: "🦵" },
        ],
        ul4: [
          { name: "Upper A", icon: "💪" },
          { name: "Lower A", icon: "🦵" },
          { name: "Upper B", icon: "💪" },
          { name: "Lower B", icon: "🦵" },
        ],
      };

      function getTodayWorkout(cycleData) {
        if (!cycleData || !cycleData.startDate) return null;
        const splitKey = cycleData.activeSplit || "mysplit";
        let splitDays;
        if (splitKey === "custom" && cycleData.customSplitDays) {
          splitDays = cycleData.customSplitDays.map((day, idx) => ({
            name: `Day ${idx + 1} — ${day.muscles.join(", ") || "Rest"}`,
            icon: day.muscles.includes("Cardio") ? "🏃" : "💪",
            isCardio:
              day.muscles.includes("Cardio") || day.muscles.includes("Rest"),
          }));
        } else {
          splitDays = STANDARD_SPLITS[splitKey] || MY_SPLIT;
        }
        const start = new Date(cycleData.startDate);
        const today = new Date();
        start.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
        const diffDays = Math.floor((today - start) / (1000 * 60 * 60 * 24));
        return splitDays[diffDays % splitDays.length];
      }

      function calculateMacros(profile) {
        const { weight, height, age, gender, activity, goal } = profile;
        let bmr =
          gender === "male"
            ? 10 * weight + 6.25 * height - 5 * age + 5
            : 10 * weight + 6.25 * height - 5 * age - 161;
        const multipliers = {
          sedentary: 1.2,
          light: 1.375,
          moderate: 1.55,
          active: 1.725,
        };
        let tdee = bmr * (multipliers[activity] || 1.55);
        let calTarget =
          goal === "recomp"
            ? tdee * 0.95
            : goal === "muscle"
              ? tdee * 1.1
              : tdee * 0.85;
        let protein =
          goal === "recomp"
            ? Math.round(weight * 2.2)
            : goal === "muscle"
              ? Math.round(weight * 2.0)
              : Math.round(weight * 2.4);
        let fat = Math.round((calTarget * 0.25) / 9);
        let carbs = Math.round((calTarget - protein * 4 - fat * 9) / 4);
        return { protein, carbs, fat, calories: Math.round(calTarget) };
      }

      // Set date
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

        try {
          // Greeting
          const firstName = user.displayName
            ? user.displayName.split(" ")[0]
            : "there";
          document.getElementById("greeting").textContent =
            `Good ${getTimeOfDay()}, ${firstName}`;

          // Admin badge
          if (isAdmin(user)) {
            const adminBadge = document.createElement("a");
            adminBadge.href = "admin.html";
            adminBadge.style.cssText = `font-size:10px;color:#f0a050;background:rgba(240,160,80,0.1);border:0.5px solid rgba(240,160,80,0.2);padding:4px 10px;border-radius:20px;text-decoration:none;`;
            adminBadge.textContent = "⚙️ Admin";
            document.querySelector(".nav-right").prepend(adminBadge);
          }

          // Sign out button (small, in header)
          const signOutBtn = document.createElement("button");
          signOutBtn.textContent = "Out";
          signOutBtn.style.cssText = `font-size:11px;color:rgba(255,255,255,0.25);background:none;border:0.5px solid rgba(255,255,255,0.08);padding:4px 10px;border-radius:20px;cursor:pointer;font-family:Inter,sans-serif;`;
          signOutBtn.addEventListener("click", async () => {
            try {
              const { signOutUser } = await import("./firebase.js");
              await signOutUser();
              window.location.href = "login.html";
            } catch (e) {}
          });
          document.querySelector(".nav-right").appendChild(signOutBtn);

          // Today's workout
          document.getElementById("loadingOverlay").classList.remove("hidden");
          const cycleData = await getWorkoutCycle(user.uid);
          document.getElementById("loadingOverlay").classList.add("hidden");

          const todayWorkout = getTodayWorkout(cycleData);
          const wEl = document.getElementById("todayWorkout");
          if (wEl && todayWorkout) {
            wEl.innerHTML = `
              <div class="workout-card-info">
                <div class="workout-label">${todayWorkout.isCardio ? "Active Recovery" : "Today's Workout"}</div>
                <div class="workout-name${todayWorkout.isCardio ? " cardio-day" : ""}">${todayWorkout.icon} ${todayWorkout.name}</div>
              </div>
              <button class="workout-start-btn" onclick="location.href='exercise.html'">Start →</button>`;
          }

          // Profile & macros
          const profile = await getUserProfile(user.uid);
          if (profile) {
            const macros = calculateMacros(profile);
            document.getElementById("proteinGoal").textContent =
              macros.protein + "g";
            document.getElementById("carbsGoalLabel").textContent =
              "of " + macros.carbs + "g";
            document.getElementById("fatGoalLabel").textContent =
              "of " + macros.fat + "g";
            document.getElementById("calGoalLabel").textContent =
              "of " + macros.calories;

            // Fetch today's log from Firebase (fall back to localStorage cache)
            let protein = 0,
              carbs = 0,
              fat = 0,
              calories = 0;
            try {
              const todayLog = await getDailyLog(
                user.uid,
                new Date().toDateString(),
              );
              ["breakfast", "lunch", "snack", "dinner"].forEach((meal) => {
                (todayLog[meal] || []).forEach((item) => {
                  protein += item.protein || 0;
                  carbs += item.carbs || 0;
                  fat += item.fat || 0;
                  calories += item.calories || 0;
                });
              });
              protein = Math.round(protein);
              carbs = Math.round(carbs);
              fat = Math.round(fat);
              calories = Math.round(calories);
              // Keep localStorage cache in sync
              const todayStr = new Date().toDateString();
              const cached = JSON.parse(
                localStorage.getItem("fitdesiLogs") || "{}",
              );
              cached[todayStr] = { protein, carbs, fat, calories };
              localStorage.setItem("fitdesiLogs", JSON.stringify(cached));
            } catch (_) {
              // Fallback to localStorage cache
              const cached = JSON.parse(
                localStorage.getItem("fitdesiLogs") || "{}",
              );
              const day = cached[new Date().toDateString()] || {};
              protein = day.protein || 0;
              carbs = day.carbs || 0;
              fat = day.fat || 0;
              calories = day.calories || 0;
            }

            document.getElementById("proteinToday").textContent = protein + "g";
            document.getElementById("carbsToday").textContent = carbs + "g";
            document.getElementById("fatToday").textContent = fat + "g";
            document.getElementById("caloriesToday").textContent = calories;

            // Update rings
            setRing("proteinRingArc", PROTEIN_CIRC, protein / macros.protein);
            setRing(
              "carbsRingArc",
              MINI_CIRC,
              macros.carbs > 0 ? carbs / macros.carbs : 0,
            );
            setRing(
              "fatRingArc",
              MINI_CIRC,
              macros.fat > 0 ? fat / macros.fat : 0,
            );
            setRing(
              "calRingArc",
              MINI_CIRC,
              macros.calories > 0 ? calories / macros.calories : 0,
            );
            setRing("navProteinRing", 138.2, protein / macros.protein);
          } else {
            // Workouts this week from Firebase
            try {
              const { getDocs, collection, db } = await import("./firebase.js");
              const workoutsSnap = await getDocs(
                collection(db, "users", user.uid, "workouts"),
              );
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const weekAgo = new Date(today);
              weekAgo.setDate(today.getDate() - 7);
              let weekCount = 0;
              const doneDays = [];
              workoutsSnap.forEach((doc) => {
                const d = new Date(doc.id);
                if (!isNaN(d) && d >= weekAgo) {
                  weekCount++;
                  doneDays.push(d);
                }
              });
              document.getElementById("workoutsDone").textContent = weekCount;
              // Fill streak dots
              const dots = document.querySelectorAll(".streak-dot");
              const dayNames = [
                "Sun",
                "Mon",
                "Tue",
                "Wed",
                "Thu",
                "Fri",
                "Sat",
              ];
              for (let i = 6; i >= 0; i--) {
                const day = new Date(today);
                day.setDate(today.getDate() - i);
                const dayStr = day.toDateString();
                const done = doneDays.some((d) => d.toDateString() === dayStr);
                if (done) dots[6 - i].classList.add("filled");
              }
            } catch (e) {}

            // Daily tip
            const tips = [
              "Combine dal with rice for a complete amino acid profile.",
              "Paneer gives ~18g protein per 100g — stack it.",
              "Eat your biggest meal within 2 hours post-workout.",
              "Soaked chana has more bioavailable protein — prep the night before.",
              "Greek yogurt + fruit = perfect high-protein snack.",
              "Tofu absorbs spices well and packs 8g per 100g.",
              "Drink 3+ litres on workout days for best recovery.",
            ];
            document.getElementById("dailyTip").textContent =
              tips[new Date().getDay() % tips.length];
          }
        } catch (error) {
          console.error("Error loading:", error);
          document.getElementById("loadingOverlay").classList.add("hidden");
        }
      });
    
