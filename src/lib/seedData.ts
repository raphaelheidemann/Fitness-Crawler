import { doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { CrawlerStyle, MealSlot, RecipeCategory, SCHEMA_LIMITS, Sex } from '../types';
import { buildDefaultCrawlerState } from './crawlerEngine';
import { STARTER_HABITS } from './firestoreService';
import { sanitizeString, todayIsoDate } from './sanitize';

function offsetIsoDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export async function initializeUserWorkspace(
  uid: string,
  displayName: string,
  includeStarterPlan = true,
  sex: Sex = 'unspecified',
  crawlerStyle: CrawlerStyle = 'masculine'
): Promise<void> {
  const path = `users/${uid}`;
  try {
    const batch = writeBatch(db);
    const safeName = sanitizeString(displayName, SCHEMA_LIMITS.DISPLAY_NAME_MAX, 'Athlete');

    batch.set(doc(db, 'users', uid), {
      ownerId: uid,
      displayName: safeName,
      currentWeek: includeStarterPlan ? 4 : 1,
      phaseName: includeStarterPlan ? 'Lean Hypertrophy' : 'Phase 1',
      unitSystem: 'metric',
      startDate: includeStarterPlan ? offsetIsoDate(21) : todayIsoDate(),
      targetWeight: 76.0,
      dailyCalorieTarget: 2450,
      proteinTargetG: 180,
      carbsTargetG: 260,
      fatTargetG: 75,
      weeklyWorkoutTarget: 5,
      mealsPerDay: 6,
      dailyWaterGoalMl: 3000,
      sex,
      crawlerStyle,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    if (includeStarterPlan) {
      const recipes = [
        {
          id: 'rec_protein_oats',
          title: 'Blueberry Almond Protein Overnight Oats',
          category: 'breakfast' as RecipeCategory,
          prepMinutes: 10,
          servings: 1,
          calories: 520,
          proteinG: 42,
          carbsG: 56,
          fatG: 14,
          imageUrl: '/src/assets/images/recipe_protein_oats_1794921378850.jpg',
          ingredients: [
            '70g rolled oats',
            '35g vanilla whey isolate',
            '180ml unsweetened almond milk',
            '100g fresh blueberries',
            '1/2 medium banana, sliced',
            '10g chia seeds',
            '12g natural almond butter',
          ],
          instructions: [
            'Whisk whey isolate into almond milk until smooth with no clumps.',
            'Combine oats and chia seeds in a glass bowl or jar, then pour in protein milk.',
            'Refrigerate at least 4 hours or overnight.',
            'Top with blueberries, sliced banana, and almond butter before serving.',
          ],
          isFavorite: true,
        },
        {
          id: 'rec_chicken_pesto',
          title: 'Herb Chicken Pesto & Roasted Sweet Potato',
          category: 'lunch' as RecipeCategory,
          prepMinutes: 25,
          servings: 2,
          calories: 640,
          proteinG: 54,
          carbsG: 58,
          fatG: 21,
          imageUrl: '/src/assets/images/recipe_chicken_pesto_1794921378076.jpg',
          ingredients: [
            '380g boneless skinless chicken breast',
            '320g sweet potato, cubed',
            '200g broccolini, trimmed',
            '30g basil pesto',
            '10ml extra-virgin olive oil',
            '1 tsp dried oregano, garlic powder, sea salt',
          ],
          instructions: [
            'Toss cubed sweet potatoes with olive oil and salt; roast at 210°C for 22 minutes.',
            'Season chicken breast with oregano, garlic, and salt, then grill 6 minutes per side.',
            'Char broccolini in a hot skillet for 4 minutes until crisp-tender.',
            'Slice chicken and plate with sweet potatoes, broccolini, and basil pesto.',
          ],
          isFavorite: true,
        },
        {
          id: 'rec_salmon_bowl',
          title: 'Seared Salmon & Edamame Rice Bowl',
          category: 'dinner' as RecipeCategory,
          prepMinutes: 20,
          servings: 1,
          calories: 690,
          proteinG: 46,
          carbsG: 64,
          fatG: 26,
          imageUrl: '/src/assets/images/recipe_salmon_bowl_1794921378325.jpg',
          ingredients: [
            '170g wild salmon fillet',
            '180g cooked brown jasmine rice',
            '70g shelled edamame',
            '1/2 small avocado, sliced',
            '60g cucumber, thin rounds',
            '10ml low-sodium tamari & ginger glaze',
            '1 tsp toasted sesame seeds',
          ],
          instructions: [
            'Pat salmon dry, season lightly, and sear skin-side down for 4 minutes until crisp.',
            'Flip and baste with tamari ginger glaze for 2 minutes.',
            'Build bowl with warm brown rice, steamed edamame, cucumber, and avocado.',
            'Place salmon on top and finish with toasted sesame seeds.',
          ],
          isFavorite: true,
        },
        {
          id: 'rec_beef_stirfry',
          title: 'Flank Steak & Snap Pea Stir-Fry',
          category: 'dinner' as RecipeCategory,
          prepMinutes: 18,
          servings: 2,
          calories: 610,
          proteinG: 48,
          carbsG: 62,
          fatG: 17,
          imageUrl: '/src/assets/images/recipe_beef_stirfry_1794921378792.jpg',
          ingredients: [
            '340g lean flank steak, thinly sliced',
            '300g cooked jasmine rice',
            '140g sugar snap peas',
            '1 large red bell pepper, sliced',
            '2 scallions, chopped',
            '15ml tamari, 1 tsp sesame oil, chili flakes',
          ],
          instructions: [
            'Sear sliced flank steak in a scorching wok for 2 minutes; set aside.',
            'Stir-fry bell peppers and snap peas for 3 minutes until bright and crisp.',
            'Return beef with tamari and sesame oil, tossing for 45 seconds.',
            'Serve alongside jasmine rice and top with scallions and sesame seeds.',
          ],
          isFavorite: false,
        },
      ];

      recipes.forEach(({ id, ...rec }) => {
        // firestore.rules rejects an `id` field: the id lives in the doc path
        batch.set(doc(db, 'users', uid, 'recipes', id), {
          ownerId: uid,
          ...rec,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });

      // Measurements across Weeks 1 - 4
      const measurements = [
        {
          id: 'meas_w1',
          weekNumber: 1,
          date: offsetIsoDate(21),
          weight: 79.4,
          bodyFatPct: 16.8,
          waist: 84.5,
          chest: 102.0,
          hips: 96.5,
          arms: 36.2,
          thighs: 58.5,
          neck: 38.5,
          notes: 'Baseline check-in before starting upper/lower block.',
        },
        {
          id: 'meas_w2',
          weekNumber: 2,
          date: offsetIsoDate(14),
          weight: 78.8,
          bodyFatPct: 16.4,
          waist: 83.8,
          chest: 102.2,
          hips: 96.2,
          arms: 36.3,
          thighs: 58.6,
          neck: 38.5,
          notes: 'Hit 5/5 workouts; morning weight trending down steadily.',
        },
        {
          id: 'meas_w3',
          weekNumber: 3,
          date: offsetIsoDate(7),
          weight: 78.2,
          bodyFatPct: 15.9,
          waist: 83.0,
          chest: 102.5,
          hips: 96.0,
          arms: 36.5,
          thighs: 58.8,
          neck: 38.5,
          notes: 'Bench and RDL progressed +2.5kg; sleep averaged 7.5 hrs.',
        },
        {
          id: 'meas_w4',
          weekNumber: 4,
          date: todayIsoDate(),
          weight: 77.7,
          bodyFatPct: 15.5,
          waist: 82.3,
          chest: 102.8,
          hips: 95.8,
          arms: 36.7,
          thighs: 59.0,
          neck: 38.4,
          notes: 'Mid-block check-in. Waist down 2.2cm with strength up.',
        },
      ];

      measurements.forEach(({ id, ...m }) => {
        batch.set(doc(db, 'users', uid, 'measurements', id), {
          ownerId: uid,
          ...m,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });

      const EX_IMG = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises';

      // Base weekly gym split helper for Weeks 1..4 so charts show multi-week volume progression
      const buildWeekWorkouts = (week: number) => {
        const loadBump = (week - 1) * 2.5;
        const allCompletedInPast = week < 4;
        return [
          {
            dayIndex: 0,
            focus: 'Upper Body Push',
            isRestDay: false,
            completed: true,
            notes: 'Controlled 2s eccentric on incline press.',
            exercises: [
              { id: 'ex1', name: 'Barbell Bench Press - Medium Grip', sets: 4, reps: '6-8', targetLoad: 80 + loadBump, actualLoad: 80 + loadBump, rpe: 8, completed: true, restSeconds: 150, muscleGroup: 'chest', imageUrl: `${EX_IMG}/Barbell_Bench_Press_-_Medium_Grip/0.jpg` },
              { id: 'ex2', name: 'Incline Dumbbell Press', sets: 3, reps: '8-10', targetLoad: 30 + (week > 2 ? 2 : 0), actualLoad: 30 + (week > 2 ? 2 : 0), rpe: 8.5, completed: true, restSeconds: 120, muscleGroup: 'chest', imageUrl: `${EX_IMG}/Incline_Dumbbell_Press/0.jpg` },
              { id: 'ex3', name: 'Cable Incline Triceps Extension', sets: 3, reps: '12', targetLoad: 25 + loadBump, actualLoad: 25 + loadBump, rpe: 8, completed: true, restSeconds: 90, muscleGroup: 'triceps', imageUrl: `${EX_IMG}/Cable_Incline_Triceps_Extension/0.jpg` },
              { id: 'ex4', name: 'Seated Side Lateral Raise', sets: 4, reps: '15', targetLoad: 12, actualLoad: 12, rpe: 9, completed: true, restSeconds: 60, muscleGroup: 'shoulders', imageUrl: `${EX_IMG}/Seated_Side_Lateral_Raise/0.jpg` },
            ],
          },
          {
            dayIndex: 1,
            focus: 'Lower Body Squat & Core',
            isRestDay: false,
            completed: true,
            notes: 'Brace hard out of the hole.',
            exercises: [
              { id: 'ex1', name: 'Barbell Squat', sets: 4, reps: '6', targetLoad: 105 + loadBump, actualLoad: 105 + loadBump, rpe: 8, completed: true, restSeconds: 180, muscleGroup: 'quadriceps', imageUrl: `${EX_IMG}/Barbell_Squat/0.jpg` },
              { id: 'ex2', name: 'Dumbbell Lunges', sets: 3, reps: '10', targetLoad: 22, actualLoad: 22, rpe: 8.5, completed: true, restSeconds: 90, muscleGroup: 'quadriceps', imageUrl: `${EX_IMG}/Dumbbell_Lunges/0.jpg` },
              { id: 'ex3', name: 'Seated Leg Curl', sets: 3, reps: '12', targetLoad: 55 + loadBump, actualLoad: 55 + loadBump, rpe: 8, completed: true, restSeconds: 90, muscleGroup: 'hamstrings', imageUrl: `${EX_IMG}/Seated_Leg_Curl/0.jpg` },
              { id: 'ex4', name: 'Hanging Leg Raise', sets: 3, reps: '12', targetLoad: 0, actualLoad: 0, rpe: 8, completed: true, restSeconds: 60, muscleGroup: 'abdominals', imageUrl: `${EX_IMG}/Hanging_Leg_Raise/0.jpg` },
            ],
          },
          {
            dayIndex: 2,
            focus: 'Active Recovery & Zone 2 Walk',
            isRestDay: true,
            completed: true,
            notes: '35 min incline treadmill walk + thoracic mobility.',
            cardio: {
              activityType: 'walk' as const,
              distance: 3.5,
              durationMinutes: 35,
              caloriesBurned: 210,
              paceOrIncline: '6% incline · 5.8 km/h',
              completed: true,
            },
            exercises: [],
          },
          {
            dayIndex: 3,
            focus: 'Upper Body Pull',
            isRestDay: false,
            completed: allCompletedInPast,
            notes: 'Full scapular stretch on pulldowns.',
            exercises: [
              { id: 'ex1', name: 'Pullups', sets: 4, reps: '8', targetLoad: 10 + (week > 2 ? 2.5 : 0), actualLoad: allCompletedInPast ? 10 + (week > 2 ? 2.5 : 0) : 0, rpe: 8.5, completed: allCompletedInPast, restSeconds: 120, muscleGroup: 'lats', imageUrl: `${EX_IMG}/Pullups/0.jpg` },
              { id: 'ex2', name: 'Bent Over Barbell Row', sets: 4, reps: '10', targetLoad: 65 + loadBump, actualLoad: allCompletedInPast ? 65 + loadBump : 0, rpe: 8, completed: allCompletedInPast, restSeconds: 120, muscleGroup: 'middle back', imageUrl: `${EX_IMG}/Bent_Over_Barbell_Row/0.jpg` },
              { id: 'ex3', name: 'Face Pull', sets: 3, reps: '15', targetLoad: 22, actualLoad: allCompletedInPast ? 22 : 0, rpe: 8, completed: allCompletedInPast, restSeconds: 60, muscleGroup: 'shoulders', imageUrl: `${EX_IMG}/Face_Pull/0.jpg` },
              { id: 'ex4', name: 'EZ-Bar Curl', sets: 3, reps: '10', targetLoad: 32.5, actualLoad: allCompletedInPast ? 32.5 : 0, rpe: 8.5, completed: allCompletedInPast, restSeconds: 75, muscleGroup: 'biceps', imageUrl: `${EX_IMG}/EZ-Bar_Curl/0.jpg` },
            ],
          },
          {
            dayIndex: 4,
            focus: 'Lower Body Hinge & Calves',
            isRestDay: false,
            completed: allCompletedInPast,
            notes: 'Keep bar close to shins on RDL.',
            exercises: [
              { id: 'ex1', name: 'Romanian Deadlift', sets: 4, reps: '8', targetLoad: 100 + loadBump, actualLoad: allCompletedInPast ? 100 + loadBump : 0, rpe: 8, completed: allCompletedInPast, restSeconds: 150, muscleGroup: 'hamstrings', imageUrl: `${EX_IMG}/Romanian_Deadlift/0.jpg` },
              { id: 'ex2', name: 'Leg Press', sets: 3, reps: '12', targetLoad: 160 + loadBump * 2, actualLoad: allCompletedInPast ? 160 + loadBump * 2 : 0, rpe: 8.5, completed: allCompletedInPast, restSeconds: 120, muscleGroup: 'quadriceps', imageUrl: `${EX_IMG}/Leg_Press/0.jpg` },
              { id: 'ex3', name: 'Standing Calf Raises', sets: 4, reps: '14', targetLoad: 70, actualLoad: allCompletedInPast ? 70 : 0, rpe: 8.5, completed: allCompletedInPast, restSeconds: 60, muscleGroup: 'calves', imageUrl: `${EX_IMG}/Standing_Calf_Raises/0.jpg` },
            ],
          },
          {
            dayIndex: 5,
            focus: 'Upper Hypertrophy & Tempo Run',
            isRestDay: false,
            completed: allCompletedInPast,
            notes: 'Arm & shoulder pump followed by 5 km outdoor run.',
            cardio: {
              activityType: 'run' as const,
              distance: 5.0,
              durationMinutes: 28,
              caloriesBurned: 340,
              paceOrIncline: '5:35 /km tempo',
              completed: allCompletedInPast,
            },
            exercises: [
              { id: 'ex1', name: 'Seated Dumbbell Press', sets: 3, reps: '10', targetLoad: 26, actualLoad: allCompletedInPast ? 26 : 0, rpe: 8, completed: allCompletedInPast, restSeconds: 120, muscleGroup: 'shoulders', imageUrl: `${EX_IMG}/Seated_Dumbbell_Press/0.jpg` },
              { id: 'ex2', name: 'Flat Bench Cable Flyes', sets: 3, reps: '14', targetLoad: 18, actualLoad: allCompletedInPast ? 18 : 0, rpe: 8.5, completed: allCompletedInPast, restSeconds: 75, muscleGroup: 'chest', imageUrl: `${EX_IMG}/Flat_Bench_Cable_Flyes/0.jpg` },
              { id: 'ex3', name: 'Hammer Curls', sets: 3, reps: '12', targetLoad: 16, actualLoad: allCompletedInPast ? 16 : 0, rpe: 8, completed: allCompletedInPast, restSeconds: 75, muscleGroup: 'biceps', imageUrl: `${EX_IMG}/Hammer_Curls/0.jpg` },
            ],
          },
          {
            dayIndex: 6,
            focus: 'Full Rest & Meal Prep',
            isRestDay: true,
            completed: allCompletedInPast,
            notes: 'Batch prep chicken pesto and overnight oats for next week.',
            exercises: [],
          },
        ];
      };

      for (let wk = 1; wk <= 4; wk++) {
        buildWeekWorkouts(wk).forEach((w) => {
          const id = `w${wk}_d${w.dayIndex}`;
          batch.set(doc(db, 'users', uid, 'workouts', id), {
            ownerId: uid,
            weekNumber: wk,
            ...w,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        });
      }

      // Seed Week 4 hydration logs
      const sampleHydration = [
        { dayIndex: 0, amountMl: 3000, goalMl: 3000 },
        { dayIndex: 1, amountMl: 3250, goalMl: 3000 },
        { dayIndex: 2, amountMl: 1750, goalMl: 3000 },
      ];
      sampleHydration.forEach((h) => {
        const id = `hyd_w4_d${h.dayIndex}`;
        batch.set(doc(db, 'users', uid, 'hydrationLogs', id), {
          ownerId: uid,
          weekNumber: 4,
          dayIndex: h.dayIndex,
          amountMl: h.amountMl,
          goalMl: h.goalMl,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });

      // Week 4 Daily Meal Plan linked to recipes + snacks
      const week4Meals: Array<{
        dayIndex: number;
        slot: MealSlot;
        title: string;
        recipeId: string;
        servings: number;
        calories: number;
        proteinG: number;
        carbsG: number;
        fatG: number;
        consumed: boolean;
      }> = [];

      for (let d = 0; d < 7; d++) {
        const pastOrToday = d <= 2;
        week4Meals.push(
          {
            dayIndex: d,
            slot: 'breakfast',
            title: 'Blueberry Almond Protein Overnight Oats',
            recipeId: 'rec_protein_oats',
            servings: 1,
            calories: 520,
            proteinG: 42,
            carbsG: 56,
            fatG: 14,
            consumed: pastOrToday,
          },
          {
            dayIndex: d,
            slot: 'lunch',
            title: 'Herb Chicken Pesto & Roasted Sweet Potato',
            recipeId: 'rec_chicken_pesto',
            servings: 1,
            calories: 640,
            proteinG: 54,
            carbsG: 58,
            fatG: 21,
            consumed: pastOrToday,
          },
          {
            dayIndex: d,
            slot: 'dinner',
            title: d % 2 === 0 ? 'Seared Salmon & Edamame Rice Bowl' : 'Flank Steak & Snap Pea Stir-Fry',
            recipeId: d % 2 === 0 ? 'rec_salmon_bowl' : 'rec_beef_stirfry',
            servings: 1,
            calories: d % 2 === 0 ? 690 : 610,
            proteinG: d % 2 === 0 ? 46 : 48,
            carbsG: d % 2 === 0 ? 64 : 62,
            fatG: d % 2 === 0 ? 26 : 17,
            consumed: d <= 1,
          },
          {
            dayIndex: d,
            slot: 'snack',
            title: 'Greek Yogurt & Honey Rice Cakes',
            recipeId: '',
            servings: 1,
            calories: 380,
            proteinG: 34,
            carbsG: 46,
            fatG: 6,
            consumed: d <= 1,
          }
        );
      }

      // Also add summary daily logs for weeks 1..3 (3 sample days each) so weekly nutrition charts have multi-week trends
      for (let wk = 1; wk <= 3; wk++) {
        for (let d = 0; d < 5; d++) {
          week4Meals.push(
            {
              dayIndex: d,
              slot: 'breakfast',
              title: 'Blueberry Almond Protein Overnight Oats',
              recipeId: 'rec_protein_oats',
              servings: 1,
              calories: 520,
              proteinG: 42,
              carbsG: 56,
              fatG: 14,
              consumed: true,
            },
            {
              dayIndex: d,
              slot: 'lunch',
              title: 'Herb Chicken Pesto & Roasted Sweet Potato',
              recipeId: 'rec_chicken_pesto',
              servings: 1,
              calories: 640,
              proteinG: 54,
              carbsG: 58,
              fatG: 21,
              consumed: true,
            },
            {
              dayIndex: d,
              slot: 'dinner',
              title: 'Seared Salmon & Edamame Rice Bowl',
              recipeId: 'rec_salmon_bowl',
              servings: 1,
              calories: 690,
              proteinG: 46,
              carbsG: 64,
              fatG: 26,
              consumed: true,
            },
            {
              dayIndex: d,
              slot: 'snack',
              title: 'Whey Shake & Banana',
              recipeId: '',
              servings: 1,
              calories: 390 + wk * 40,
              proteinG: 36,
              carbsG: 48,
              fatG: 8,
              consumed: true,
            }
          );
        }
      }

      week4Meals.forEach((meal, idx) => {
        const wk = idx < 28 ? 4 : Math.floor((idx - 28) / 20) + 1;
        const id = `seed_meal_w${wk}_d${meal.dayIndex}_${idx}`;
        batch.set(doc(db, 'users', uid, 'mealLogs', id), {
          ownerId: uid,
          weekNumber: wk,
          ...meal,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });

      // Seed 14 days of realistic habit completion logs so the visual squares mosaic pops immediately
      for (let daysAgo = 14; daysAgo >= 1; daysAgo--) {
        const logDate = offsetIsoDate(daysAgo);
        const completedHabitIds = STARTER_HABITS.filter((_, idx) => {
          const score = (daysAgo * 3 + idx * 5) % 10;
          return score >= 2;
        }).map((h) => h.id);

        if (completedHabitIds.length > 0) {
          batch.set(doc(db, 'users', uid, 'habitLogs', logDate), {
            ownerId: uid,
            date: logDate,
            completedHabitIds,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      }
    }

    // Seed starter habits for all new users (both starter plan and blank Week 1)
    STARTER_HABITS.forEach((habit) => {
      batch.set(doc(db, 'users', uid, 'habits', habit.id), {
        ownerId: uid,
        title: habit.title,
        color: habit.color,
        weeklyGoal: habit.weeklyGoal,
        sortOrder: habit.sortOrder,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });

    // Seed initial Crawler progression state (starts Lv 2 with 1 starter Loot Box when exploring starter plan)
    const initialCrawler = buildDefaultCrawlerState(uid);
    if (includeStarterPlan) {
      initialCrawler.xp = 380;
      initialCrawler.level = 2;
      initialCrawler.weeklyClears = 1;
      initialCrawler.currentStreak = 7;
      initialCrawler.bestStreak = 7;
      initialCrawler.streakFreezes = 2;
      initialCrawler.lastActiveDate = offsetIsoDate(1);
      initialCrawler.unlockedGearIds = [
        'wpn_spiked_wraps',
        'arm_leather_jacket',
        'acc_tousled_grit',
        'aur_none',
        'wpn_iron_gauntlets',
        'aur_torch_ember',
      ];
      initialCrawler.equippedWeapon = 'wpn_iron_gauntlets';
      initialCrawler.equippedAura = 'aur_torch_ember';
      initialCrawler.unlockedAchievementIds = ['ach_first_blood', 'ach_torchbearer'];
      initialCrawler.pendingLootBoxes = ['bronze'];
      initialCrawler.clearedWeekKeys = ['w1'];
    }
    const { id: _crawlerDocId, ...crawlerFields } = initialCrawler;
    batch.set(doc(db, 'users', uid, 'crawlerState', 'main'), {
      ...crawlerFields,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
