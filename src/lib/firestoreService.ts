import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  BANNER_THEME_OPTIONS,
  BannerTheme,
  CrawlerState,
  Guild,
  CrawlerStyle,
  Habit,
  HabitColor,
  HabitLog,
  MealLog,
  MealSlot,
  Measurement,
  Recipe,
  SCHEMA_LIMITS,
  Sex,
  UserProfile,
  WorkoutDay,
  WorkoutPlan,
} from '../types';
import {
  clampInt,
  clampNumber,
  sanitizeCardio,
  sanitizeDateString,
  sanitizeDefaultDays,
  sanitizeExercises,
  sanitizeHabitColor,
  sanitizeId,
  sanitizeString,
  sanitizeStringArray,
} from './sanitize';
import { sanitizeLook } from './crawlerLook';
import { ParsedMealRow, ParsedWorkoutDay, ParsedWorkoutPlan } from './csvImport';

export async function updateUserWeekAndPhase(
  uid: string,
  currentWeek: number,
  phaseName: string
): Promise<void> {
  const path = `users/${uid}`;
  try {
    await updateDoc(doc(db, 'users', uid), {
      currentWeek: clampInt(currentWeek, 1, 52, 1),
      phaseName: sanitizeString(phaseName, SCHEMA_LIMITS.PHASE_NAME_MAX, 'Training Block'),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateMealsPerDay(uid: string, mealsPerDay: number): Promise<void> {
  const path = `users/${uid}`;
  try {
    await updateDoc(doc(db, 'users', uid), {
      mealsPerDay: clampInt(mealsPerDay, 1, 10, 6),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateDailyWaterGoal(
  uid: string,
  dailyWaterGoalMl: number
): Promise<void> {
  const path = `users/${uid}`;
  try {
    await updateDoc(doc(db, 'users', uid), {
      dailyWaterGoalMl: clampInt(dailyWaterGoalMl, 500, 10000, 3000),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export const normalizeSex = (v: unknown): Sex =>
  v === 'male' || v === 'female' ? v : 'unspecified';
export const normalizeCrawlerStyle = (v: unknown): CrawlerStyle =>
  v === 'masculine' || v === 'feminine' ? v : 'neutral';

export async function updateUserProfileSettings(
  uid: string,
  settings: Omit<UserProfile, 'ownerId' | 'createdAt' | 'updatedAt'>
): Promise<void> {
  const path = `users/${uid}`;
  try {
    await updateDoc(doc(db, 'users', uid), {
      displayName: sanitizeString(settings.displayName, SCHEMA_LIMITS.DISPLAY_NAME_MAX, 'Athlete'),
      currentWeek: clampInt(settings.currentWeek, 1, 52, 1),
      phaseName: sanitizeString(settings.phaseName, SCHEMA_LIMITS.PHASE_NAME_MAX, 'Lean Hypertrophy'),
      unitSystem: settings.unitSystem === 'imperial' ? 'imperial' : 'metric',
      startDate: sanitizeDateString(settings.startDate),
      targetWeight: Number(clampNumber(settings.targetWeight, 20, 500, 75).toFixed(1)),
      dailyCalorieTarget: clampInt(settings.dailyCalorieTarget, 800, 10000, 2400),
      proteinTargetG: clampInt(settings.proteinTargetG, 20, 600, 175),
      carbsTargetG: clampInt(settings.carbsTargetG, 0, 1200, 240),
      fatTargetG: clampInt(settings.fatTargetG, 10, 400, 75),
      weeklyWorkoutTarget: clampInt(settings.weeklyWorkoutTarget, 1, 7, 5),
      mealsPerDay: clampInt(settings.mealsPerDay ?? 6, 1, 10, 6),
      dailyWaterGoalMl: clampInt(settings.dailyWaterGoalMl ?? 3000, 500, 10000, 3000),
      ...(settings.sex ? { sex: normalizeSex(settings.sex) } : {}),
      ...(settings.crawlerStyle ? { crawlerStyle: normalizeCrawlerStyle(settings.crawlerStyle) } : {}),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function upsertWorkoutDay(
  uid: string,
  workout: Omit<WorkoutDay, 'ownerId' | 'createdAt' | 'updatedAt'>,
  isExisting: boolean
): Promise<void> {
  const workoutId = sanitizeId(workout.id || `w${workout.weekNumber}_d${workout.dayIndex}`);
  const path = `users/${uid}/workouts/${workoutId}`;
  const cleanExercises = sanitizeExercises(workout.exercises);
  const cleanCardio = sanitizeCardio(workout.cardio);
  const cleanPlanId = sanitizeString(workout.planId ?? '', 128, '');
  const cleanPlanName = sanitizeString(workout.planName ?? '', SCHEMA_LIMITS.PLAN_NAME_MAX, '');

  try {
    if (isExisting) {
      await updateDoc(doc(db, 'users', uid, 'workouts', workoutId), {
        focus: sanitizeString(workout.focus, SCHEMA_LIMITS.FOCUS_MAX, 'Training Session'),
        planId: cleanPlanId,
        planName: cleanPlanName,
        isRestDay: Boolean(workout.isRestDay),
        completed: Boolean(workout.completed),
        exercises: cleanExercises,
        cardio: cleanCardio,
        notes: sanitizeString(workout.notes, SCHEMA_LIMITS.NOTES_MAX, ''),
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(doc(db, 'users', uid, 'workouts', workoutId), {
        ownerId: uid,
        weekNumber: clampInt(workout.weekNumber, 1, 52, 1),
        dayIndex: clampInt(workout.dayIndex, 0, 6, 0),
        focus: sanitizeString(workout.focus, SCHEMA_LIMITS.FOCUS_MAX, 'Training Session'),
        planId: cleanPlanId,
        planName: cleanPlanName,
        isRestDay: Boolean(workout.isRestDay),
        completed: Boolean(workout.completed),
        exercises: cleanExercises,
        cardio: cleanCardio,
        notes: sanitizeString(workout.notes, SCHEMA_LIMITS.NOTES_MAX, ''),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, isExisting ? OperationType.UPDATE : OperationType.CREATE, path);
  }
}

export async function toggleWorkoutCompleted(
  uid: string,
  workoutId: string,
  completed: boolean
): Promise<void> {
  const safeId = sanitizeId(workoutId);
  const path = `users/${uid}/workouts/${safeId}`;
  try {
    await updateDoc(doc(db, 'users', uid, 'workouts', safeId), {
      completed: Boolean(completed),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function copyWeekPlans(
  uid: string,
  sourceWorkouts: WorkoutDay[],
  sourceMeals: MealLog[],
  targetWeek: number,
  existingTargetWorkoutIds: string[] = []
): Promise<void> {
  const safeTargetWeek = clampInt(targetWeek, 1, 52, 1);
  const path = `users/${uid}/workouts`;
  const existingSet = new Set(existingTargetWorkoutIds);
  try {
    const batch = writeBatch(db);
    sourceWorkouts.forEach((w) => {
      const id = sanitizeId(`w${safeTargetWeek}_d${w.dayIndex}`);
      const ref = doc(db, 'users', uid, 'workouts', id);
      const cleanFocus = sanitizeString(w.focus, SCHEMA_LIMITS.FOCUS_MAX, 'Training Session');
      const cleanExercises = sanitizeExercises(
        w.exercises.map((ex) => ({ ...ex, completed: false }))
      );
      const cleanCardio = sanitizeCardio(
        w.cardio ? { ...w.cardio, completed: false } : undefined
      );
      const cleanNotes = sanitizeString(w.notes, SCHEMA_LIMITS.NOTES_MAX, '');
      const cleanPlanId = sanitizeString(w.planId ?? '', 128, '');
      const cleanPlanName = sanitizeString(w.planName ?? '', SCHEMA_LIMITS.PLAN_NAME_MAX, '');

      if (existingSet.has(id)) {
        batch.update(ref, {
          focus: cleanFocus,
          planId: cleanPlanId,
          planName: cleanPlanName,
          isRestDay: Boolean(w.isRestDay),
          completed: false,
          exercises: cleanExercises,
          cardio: cleanCardio,
          notes: cleanNotes,
          updatedAt: serverTimestamp(),
        });
      } else {
        batch.set(ref, {
          ownerId: uid,
          weekNumber: safeTargetWeek,
          dayIndex: clampInt(w.dayIndex, 0, 6, 0),
          focus: cleanFocus,
          planId: cleanPlanId,
          planName: cleanPlanName,
          isRestDay: Boolean(w.isRestDay),
          completed: false,
          exercises: cleanExercises,
          cardio: cleanCardio,
          notes: cleanNotes,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    });

    sourceMeals.forEach((m, index) => {
      const id = sanitizeId(`meal_w${safeTargetWeek}_d${m.dayIndex}_${Date.now()}_${index}`);
      const ref = doc(db, 'users', uid, 'mealLogs', id);
      batch.set(ref, {
        ownerId: uid,
        weekNumber: safeTargetWeek,
        dayIndex: clampInt(m.dayIndex, 0, 6, 0),
        slot: m.slot,
        title: sanitizeString(m.title, SCHEMA_LIMITS.TITLE_MAX, 'Planned Meal'),
        recipeId: sanitizeString(m.recipeId, SCHEMA_LIMITS.RECIPE_ID_MAX, ''),
        servings: Number(clampNumber(m.servings, 0.25, 20, 1).toFixed(2)),
        calories: Math.round(clampNumber(m.calories, 0, 10000, 0)),
        proteinG: Number(clampNumber(m.proteinG, 0, 500, 0).toFixed(1)),
        carbsG: Number(clampNumber(m.carbsG, 0, 1000, 0).toFixed(1)),
        fatG: Number(clampNumber(m.fatG, 0, 500, 0).toFixed(1)),
        consumed: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function createMealLog(
  uid: string,
  meal: {
    weekNumber: number;
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
  }
): Promise<void> {
  const id = sanitizeId(`meal_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`);
  const path = `users/${uid}/mealLogs/${id}`;
  try {
    await setDoc(doc(db, 'users', uid, 'mealLogs', id), {
      ownerId: uid,
      weekNumber: clampInt(meal.weekNumber, 1, 52, 1),
      dayIndex: clampInt(meal.dayIndex, 0, 6, 0),
      slot: meal.slot,
      title: sanitizeString(meal.title, SCHEMA_LIMITS.TITLE_MAX, 'Meal'),
      recipeId: sanitizeString(meal.recipeId, SCHEMA_LIMITS.RECIPE_ID_MAX, ''),
      servings: Number(clampNumber(meal.servings, 0.25, 20, 1).toFixed(2)),
      calories: Math.round(clampNumber(meal.calories, 0, 10000, 0)),
      proteinG: Number(clampNumber(meal.proteinG, 0, 500, 0).toFixed(1)),
      carbsG: Number(clampNumber(meal.carbsG, 0, 1000, 0).toFixed(1)),
      fatG: Number(clampNumber(meal.fatG, 0, 500, 0).toFixed(1)),
      consumed: Boolean(meal.consumed),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function toggleMealConsumed(
  uid: string,
  mealId: string,
  consumed: boolean
): Promise<void> {
  const safeId = sanitizeId(mealId);
  const path = `users/${uid}/mealLogs/${safeId}`;
  try {
    await updateDoc(doc(db, 'users', uid, 'mealLogs', safeId), {
      consumed: Boolean(consumed),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateMealLog(
  uid: string,
  mealId: string,
  meal: {
    slot: MealSlot;
    title: string;
    recipeId: string;
    servings: number;
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    consumed: boolean;
  }
): Promise<void> {
  const safeId = sanitizeId(mealId);
  const path = `users/${uid}/mealLogs/${safeId}`;
  try {
    await updateDoc(doc(db, 'users', uid, 'mealLogs', safeId), {
      slot: meal.slot,
      title: sanitizeString(meal.title, SCHEMA_LIMITS.TITLE_MAX, 'Meal'),
      recipeId: sanitizeString(meal.recipeId, SCHEMA_LIMITS.RECIPE_ID_MAX, ''),
      servings: Number(clampNumber(meal.servings, 0.25, 20, 1).toFixed(2)),
      calories: Math.round(clampNumber(meal.calories, 0, 10000, 0)),
      proteinG: Number(clampNumber(meal.proteinG, 0, 500, 0).toFixed(1)),
      carbsG: Number(clampNumber(meal.carbsG, 0, 1000, 0).toFixed(1)),
      fatG: Number(clampNumber(meal.fatG, 0, 500, 0).toFixed(1)),
      consumed: Boolean(meal.consumed),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteMealLog(uid: string, mealId: string): Promise<void> {
  const safeId = sanitizeId(mealId);
  const path = `users/${uid}/mealLogs/${safeId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'mealLogs', safeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveRecipe(
  uid: string,
  recipe: Omit<Recipe, 'ownerId' | 'createdAt' | 'updatedAt'>,
  isExisting: boolean
): Promise<string> {
  const safeId = sanitizeId(
    recipe.id || `rec_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  );
  const path = `users/${uid}/recipes/${safeId}`;
  const cleanIngredients = sanitizeStringArray(recipe.ingredients, SCHEMA_LIMITS.INGREDIENTS_MAX);
  const cleanInstructions = sanitizeStringArray(
    recipe.instructions,
    SCHEMA_LIMITS.INSTRUCTIONS_MAX,
    400
  );

  try {
    if (isExisting) {
      await updateDoc(doc(db, 'users', uid, 'recipes', safeId), {
        title: sanitizeString(recipe.title, SCHEMA_LIMITS.TITLE_MAX, 'Custom Recipe'),
        category: recipe.category,
        prepMinutes: clampInt(recipe.prepMinutes, 0, 1440, 15),
        servings: clampInt(recipe.servings, 1, 50, 1),
        calories: Math.round(clampNumber(recipe.calories, 0, 5000, 0)),
        proteinG: Number(clampNumber(recipe.proteinG, 0, 500, 0).toFixed(1)),
        carbsG: Number(clampNumber(recipe.carbsG, 0, 800, 0).toFixed(1)),
        fatG: Number(clampNumber(recipe.fatG, 0, 400, 0).toFixed(1)),
        imageUrl: sanitizeString(recipe.imageUrl, SCHEMA_LIMITS.IMAGE_URL_MAX, ''),
        ingredients: cleanIngredients,
        instructions: cleanInstructions,
        isFavorite: Boolean(recipe.isFavorite),
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(doc(db, 'users', uid, 'recipes', safeId), {
        ownerId: uid,
        title: sanitizeString(recipe.title, SCHEMA_LIMITS.TITLE_MAX, 'Custom Recipe'),
        category: recipe.category,
        prepMinutes: clampInt(recipe.prepMinutes, 0, 1440, 15),
        servings: clampInt(recipe.servings, 1, 50, 1),
        calories: Math.round(clampNumber(recipe.calories, 0, 5000, 0)),
        proteinG: Number(clampNumber(recipe.proteinG, 0, 500, 0).toFixed(1)),
        carbsG: Number(clampNumber(recipe.carbsG, 0, 800, 0).toFixed(1)),
        fatG: Number(clampNumber(recipe.fatG, 0, 400, 0).toFixed(1)),
        imageUrl: sanitizeString(recipe.imageUrl, SCHEMA_LIMITS.IMAGE_URL_MAX, ''),
        ingredients: cleanIngredients,
        instructions: cleanInstructions,
        isFavorite: Boolean(recipe.isFavorite),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    return safeId;
  } catch (error) {
    handleFirestoreError(error, isExisting ? OperationType.UPDATE : OperationType.CREATE, path);
  }
}

export async function toggleRecipeFavorite(
  uid: string,
  recipeId: string,
  isFavorite: boolean
): Promise<void> {
  const safeId = sanitizeId(recipeId);
  const path = `users/${uid}/recipes/${safeId}`;
  try {
    await updateDoc(doc(db, 'users', uid, 'recipes', safeId), {
      isFavorite: Boolean(isFavorite),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteRecipe(uid: string, recipeId: string): Promise<void> {
  const safeId = sanitizeId(recipeId);
  const path = `users/${uid}/recipes/${safeId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'recipes', safeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveMeasurement(
  uid: string,
  measurement: Omit<Measurement, 'ownerId' | 'createdAt' | 'updatedAt'>,
  isExisting: boolean
): Promise<void> {
  const safeId = sanitizeId(
    measurement.id || `meas_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  );
  const path = `users/${uid}/measurements/${safeId}`;

  const payload = {
    weekNumber: clampInt(measurement.weekNumber, 1, 52, 1),
    date: sanitizeDateString(measurement.date),
    weight: Number(clampNumber(measurement.weight, 20, 500, 75).toFixed(1)),
    bodyFatPct: Number(clampNumber(measurement.bodyFatPct, 0, 70, 0).toFixed(1)),
    waist: Number(clampNumber(measurement.waist, 0, 300, 0).toFixed(1)),
    chest: Number(clampNumber(measurement.chest, 0, 300, 0).toFixed(1)),
    hips: Number(clampNumber(measurement.hips, 0, 300, 0).toFixed(1)),
    arms: Number(clampNumber(measurement.arms, 0, 150, 0).toFixed(1)),
    thighs: Number(clampNumber(measurement.thighs, 0, 200, 0).toFixed(1)),
    neck: Number(clampNumber(measurement.neck, 0, 100, 0).toFixed(1)),
    notes: sanitizeString(measurement.notes, SCHEMA_LIMITS.NOTES_MAX, ''),
  };

  try {
    if (isExisting) {
      await updateDoc(doc(db, 'users', uid, 'measurements', safeId), {
        ...payload,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(doc(db, 'users', uid, 'measurements', safeId), {
        ownerId: uid,
        ...payload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, isExisting ? OperationType.UPDATE : OperationType.CREATE, path);
  }
}

export async function deleteMeasurement(uid: string, measurementId: string): Promise<void> {
  const safeId = sanitizeId(measurementId);
  const path = `users/${uid}/measurements/${safeId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'measurements', safeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function upsertHydrationLog(
  uid: string,
  weekNumber: number,
  dayIndex: number,
  amountMl: number,
  goalMl: number,
  isExisting: boolean
): Promise<void> {
  const safeWeek = clampInt(weekNumber, 1, 52, 1);
  const safeDay = clampInt(dayIndex, 0, 6, 0);
  const hydrationId = sanitizeId(`hyd_w${safeWeek}_d${safeDay}`);
  const path = `users/${uid}/hydrationLogs/${hydrationId}`;
  const cleanAmount = clampInt(amountMl, 0, 20000, 0);
  const cleanGoal = clampInt(goalMl, 500, 10000, 3000);

  try {
    if (isExisting) {
      await updateDoc(doc(db, 'users', uid, 'hydrationLogs', hydrationId), {
        amountMl: cleanAmount,
        goalMl: cleanGoal,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(doc(db, 'users', uid, 'hydrationLogs', hydrationId), {
        ownerId: uid,
        weekNumber: safeWeek,
        dayIndex: safeDay,
        amountMl: cleanAmount,
        goalMl: cleanGoal,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, isExisting ? OperationType.UPDATE : OperationType.CREATE, path);
  }
}

export async function saveWorkoutPlan(
  uid: string,
  plan: Omit<WorkoutPlan, 'ownerId' | 'createdAt' | 'updatedAt'>,
  isExisting: boolean
): Promise<string> {
  const safeId = sanitizeId(
    plan.id || `plan_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  );
  const path = `users/${uid}/workoutPlans/${safeId}`;
  const cleanExercises = plan.isRestDay
    ? []
    : sanitizeExercises(plan.exercises.map((ex) => ({ ...ex, completed: false })));
  const cleanCardio = sanitizeCardio({ ...plan.cardio, completed: false });
  const payload = {
    name: sanitizeString(plan.name, SCHEMA_LIMITS.PLAN_NAME_MAX, 'Training Plan'),
    scheduledTime: sanitizeString(plan.scheduledTime ?? '', SCHEMA_LIMITS.PLAN_TIME_MAX, ''),
    defaultDays: sanitizeDefaultDays(plan.defaultDays),
    isRestDay: Boolean(plan.isRestDay),
    exercises: cleanExercises,
    cardio: cleanCardio,
    notes: sanitizeString(plan.notes ?? '', SCHEMA_LIMITS.NOTES_MAX, ''),
  };

  try {
    if (isExisting) {
      await updateDoc(doc(db, 'users', uid, 'workoutPlans', safeId), {
        ...payload,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(doc(db, 'users', uid, 'workoutPlans', safeId), {
        ownerId: uid,
        ...payload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    return safeId;
  } catch (error) {
    handleFirestoreError(error, isExisting ? OperationType.UPDATE : OperationType.CREATE, path);
  }
}

export async function deleteWorkoutPlan(uid: string, planId: string): Promise<void> {
  const safeId = sanitizeId(planId);
  const path = `users/${uid}/workoutPlans/${safeId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'workoutPlans', safeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function importWorkoutPlans(
  uid: string,
  plans: ParsedWorkoutPlan[],
  existingPlanIds: string[]
): Promise<number> {
  if (plans.length === 0) return 0;
  const path = `users/${uid}/workoutPlans`;
  const existingSet = new Set(existingPlanIds);
  const chunkSize = 400;

  try {
    for (let i = 0; i < plans.length; i += chunkSize) {
      const chunk = plans.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      chunk.forEach((plan) => {
        const safeId = sanitizeId(plan.id);
        const ref = doc(db, 'users', uid, 'workoutPlans', safeId);
        const payload = {
          name: sanitizeString(plan.name, SCHEMA_LIMITS.PLAN_NAME_MAX, 'Training Plan'),
          scheduledTime: sanitizeString(plan.scheduledTime, SCHEMA_LIMITS.PLAN_TIME_MAX, ''),
          defaultDays: sanitizeDefaultDays(plan.defaultDays),
          isRestDay: Boolean(plan.isRestDay),
          exercises: plan.isRestDay
            ? []
            : sanitizeExercises(plan.exercises.map((ex) => ({ ...ex, completed: false }))),
          cardio: sanitizeCardio({ ...plan.cardio, completed: false }),
          notes: sanitizeString(plan.notes, SCHEMA_LIMITS.NOTES_MAX, ''),
        };

        if (existingSet.has(safeId)) {
          batch.update(ref, {
            ...payload,
            updatedAt: serverTimestamp(),
          });
        } else {
          batch.set(ref, {
            ownerId: uid,
            ...payload,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      });
      await batch.commit();
    }
    return plans.length;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function applyPlanToWorkoutDay(
  uid: string,
  plan: WorkoutPlan,
  weekNumber: number,
  dayIndex: number,
  isExistingDay: boolean
): Promise<void> {
  const safeWeek = clampInt(weekNumber, 1, 52, 1);
  const safeDay = clampInt(dayIndex, 0, 6, 0);
  const workoutId = sanitizeId(`w${safeWeek}_d${safeDay}`);

  await upsertWorkoutDay(
    uid,
    {
      id: workoutId,
      weekNumber: safeWeek,
      dayIndex: safeDay,
      focus: plan.name,
      planId: plan.id,
      planName: plan.name,
      isRestDay: plan.isRestDay,
      completed: false,
      exercises: plan.isRestDay
        ? []
        : plan.exercises.map((ex, idx) => ({
            ...ex,
            id: `ex_${Date.now()}_${idx}`,
            completed: false,
          })),
      cardio: sanitizeCardio({ ...plan.cardio, completed: false }),
      notes: plan.notes,
    },
    isExistingDay
  );
}

export async function importTrainingDays(
  uid: string,
  days: ParsedWorkoutDay[],
  existingWorkoutIds: string[]
): Promise<number> {
  if (days.length === 0) return 0;
  const path = `users/${uid}/workouts`;
  const existingSet = new Set(existingWorkoutIds);
  const chunkSize = 400;

  try {
    for (let i = 0; i < days.length; i += chunkSize) {
      const chunk = days.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      chunk.forEach((w) => {
        const id = sanitizeId(`w${w.weekNumber}_d${w.dayIndex}`);
        const ref = doc(db, 'users', uid, 'workouts', id);
        const cleanFocus = sanitizeString(w.focus, SCHEMA_LIMITS.FOCUS_MAX, 'Training Session');
        const cleanPlanId = sanitizeString(w.planId ?? '', 128, '');
        const cleanPlanName = sanitizeString(w.planName ?? '', SCHEMA_LIMITS.PLAN_NAME_MAX, '');
        const cleanExercises = w.isRestDay ? [] : sanitizeExercises(w.exercises);
        const cleanCardio = sanitizeCardio(w.cardio);
        const cleanNotes = sanitizeString(w.notes, SCHEMA_LIMITS.NOTES_MAX, '');

        if (existingSet.has(id)) {
          batch.update(ref, {
            focus: cleanFocus,
            planId: cleanPlanId,
            planName: cleanPlanName,
            isRestDay: Boolean(w.isRestDay),
            completed: Boolean(w.completed),
            exercises: cleanExercises,
            cardio: cleanCardio,
            notes: cleanNotes,
            updatedAt: serverTimestamp(),
          });
        } else {
          batch.set(ref, {
            ownerId: uid,
            weekNumber: clampInt(w.weekNumber, 1, 52, 1),
            dayIndex: clampInt(w.dayIndex, 0, 6, 0),
            focus: cleanFocus,
            planId: cleanPlanId,
            planName: cleanPlanName,
            isRestDay: Boolean(w.isRestDay),
            completed: Boolean(w.completed),
            exercises: cleanExercises,
            cardio: cleanCardio,
            notes: cleanNotes,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      });
      await batch.commit();
    }
    return days.length;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function importMealLogs(
  uid: string,
  meals: ParsedMealRow[],
  existingMeals: MealLog[],
  replaceExistingDays: boolean
): Promise<number> {
  if (meals.length === 0) return 0;
  const path = `users/${uid}/mealLogs`;
  const chunkSize = 400;
  const ops: Array<{ type: 'delete'; id: string } | { type: 'create'; meal: ParsedMealRow; idx: number }> = [];

  if (replaceExistingDays) {
    const importedDayKeys = new Set(meals.map((m) => `${m.weekNumber}_${m.dayIndex}`));
    existingMeals.forEach((existing) => {
      if (importedDayKeys.has(`${existing.weekNumber}_${existing.dayIndex}`)) {
        ops.push({ type: 'delete', id: existing.id });
      }
    });
  }

  meals.forEach((meal, idx) => {
    ops.push({ type: 'create', meal, idx });
  });

  try {
    const baseTs = Date.now();
    for (let i = 0; i < ops.length; i += chunkSize) {
      const chunk = ops.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      chunk.forEach((op) => {
        if (op.type === 'delete') {
          batch.delete(doc(db, 'users', uid, 'mealLogs', sanitizeId(op.id)));
        } else {
          const m = op.meal;
          const id = sanitizeId(`csv_meal_${baseTs}_${op.idx}_${Math.random().toString(36).slice(2, 6)}`);
          batch.set(doc(db, 'users', uid, 'mealLogs', id), {
            ownerId: uid,
            weekNumber: clampInt(m.weekNumber, 1, 52, 1),
            dayIndex: clampInt(m.dayIndex, 0, 6, 0),
            slot: m.slot,
            title: sanitizeString(m.title, SCHEMA_LIMITS.TITLE_MAX, 'Meal'),
            recipeId: '',
            servings: Number(clampNumber(m.servings, 0.25, 20, 1).toFixed(2)),
            calories: Math.round(clampNumber(m.calories, 0, 10000, 0)),
            proteinG: Number(clampNumber(m.proteinG, 0, 500, 0).toFixed(1)),
            carbsG: Number(clampNumber(m.carbsG, 0, 1000, 0).toFixed(1)),
            fatG: Number(clampNumber(m.fatG, 0, 500, 0).toFixed(1)),
            consumed: Boolean(m.consumed),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      });
      await batch.commit();
    }
    return meals.length;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export const STARTER_HABITS: Array<{
  id: string;
  title: string;
  color: HabitColor;
  weeklyGoal: number;
  sortOrder: number;
}> = [
  { id: 'hab_creatine', title: 'Creatine (5g)', color: 'emerald', weeklyGoal: 7, sortOrder: 0 },
  { id: 'hab_made_bed', title: 'Made the bed', color: 'sky', weeklyGoal: 7, sortOrder: 1 },
  { id: 'hab_dishes', title: 'Washed the dishes', color: 'amber', weeklyGoal: 7, sortOrder: 2 },
  { id: 'hab_steps', title: '10k Steps', color: 'teal', weeklyGoal: 6, sortOrder: 3 },
  { id: 'hab_stretch', title: 'Stretch & Mobility', color: 'violet', weeklyGoal: 5, sortOrder: 4 },
  { id: 'hab_no_sugar', title: 'No Sugar / Snacks', color: 'rose', weeklyGoal: 6, sortOrder: 5 },
];

export async function saveHabit(
  uid: string,
  habit: Omit<Habit, 'ownerId' | 'createdAt' | 'updatedAt'>,
  isExisting: boolean
): Promise<string> {
  const safeId = sanitizeId(
    habit.id || `hab_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  );
  const path = `users/${uid}/habits/${safeId}`;
  const payload = {
    title: sanitizeString(habit.title, SCHEMA_LIMITS.HABIT_TITLE_MAX, 'Daily Habit'),
    color: sanitizeHabitColor(habit.color),
    weeklyGoal: clampInt(habit.weeklyGoal, 1, 7, 7),
    sortOrder: clampInt(habit.sortOrder, 0, 100, 0),
  };

  try {
    if (isExisting) {
      await updateDoc(doc(db, 'users', uid, 'habits', safeId), {
        ...payload,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(doc(db, 'users', uid, 'habits', safeId), {
        ownerId: uid,
        ...payload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    return safeId;
  } catch (error) {
    handleFirestoreError(error, isExisting ? OperationType.UPDATE : OperationType.CREATE, path);
  }
}

export async function deleteHabit(uid: string, habitId: string): Promise<void> {
  const safeId = sanitizeId(habitId);
  const path = `users/${uid}/habits/${safeId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'habits', safeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function toggleHabitCompletion(
  uid: string,
  date: string,
  habitId: string,
  existingLog?: HabitLog
): Promise<void> {
  const safeDate = sanitizeDateString(date);
  const safeLogId = sanitizeId(safeDate);
  const safeHabitId = sanitizeId(habitId);
  const path = `users/${uid}/habitLogs/${safeLogId}`;

  const currentIds = Array.isArray(existingLog?.completedHabitIds)
    ? existingLog.completedHabitIds.map((id) => sanitizeId(id))
    : [];

  const nextSet = new Set(currentIds);
  if (nextSet.has(safeHabitId)) {
    nextSet.delete(safeHabitId);
  } else {
    nextSet.add(safeHabitId);
  }
  const nextIds = Array.from(nextSet).slice(0, 30);

  try {
    if (existingLog) {
      await updateDoc(doc(db, 'users', uid, 'habitLogs', safeLogId), {
        completedHabitIds: nextIds,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(doc(db, 'users', uid, 'habitLogs', safeLogId), {
        ownerId: uid,
        date: safeDate,
        completedHabitIds: nextIds,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(
      error,
      existingLog ? OperationType.UPDATE : OperationType.CREATE,
      path
    );
  }
}

export async function seedStarterHabits(uid: string): Promise<void> {
  const path = `users/${uid}/habits`;
  try {
    const batch = writeBatch(db);
    STARTER_HABITS.forEach((h) => {
      batch.set(doc(db, 'users', uid, 'habits', h.id), {
        ownerId: uid,
        title: h.title,
        color: h.color,
        weeklyGoal: h.weeklyGoal,
        sortOrder: h.sortOrder,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

function sanitizeBannerTheme(val: unknown): BannerTheme {
  return typeof val === 'string' && BANNER_THEME_OPTIONS.includes(val as BannerTheme)
    ? (val as BannerTheme)
    : 'amber';
}

function sanitizeOptionalId(val: unknown): string {
  const raw = typeof val === 'string' ? val.trim() : '';
  if (!raw) return '';
  return raw.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40);
}

function buildCrawlerStatePayload(
  state: Omit<CrawlerState, 'createdAt' | 'updatedAt'>,
  fallbackName = 'Crawler'
) {
  const cleanDate =
    state.lastActiveDate && SCHEMA_LIMITS.DATE_PATTERN.test(state.lastActiveDate.trim())
      ? state.lastActiveDate.trim()
      : '';

  return {
    xp: clampInt(state.xp, 0, 1000000, 0),
    level: clampInt(state.level, 1, 8, 1),
    weeklyClears: clampInt(state.weeklyClears, 0, 500, 0),
    currentStreak: clampInt(state.currentStreak, 0, 3650, 0),
    bestStreak: clampInt(state.bestStreak, 0, 3650, 0),
    streakFreezes: clampInt(state.streakFreezes, 0, 5, 1),
    lastActiveDate: cleanDate,
    recoveryQuestActive: Boolean(state.recoveryQuestActive),
    equippedSpriteTier: clampInt(state.equippedSpriteTier, 1, 4, 1) as 1 | 2 | 3 | 4,
    equippedWeapon: sanitizeString(state.equippedWeapon, 60, 'wpn_spiked_wraps'),
    equippedArmor: sanitizeString(state.equippedArmor, 60, 'arm_leather_jacket'),
    equippedAccessory: sanitizeString(state.equippedAccessory, 60, 'acc_tousled_grit'),
    equippedAura: sanitizeString(state.equippedAura, 40, 'aur_none'),
    unlockedGearIds: sanitizeStringArray(state.unlockedGearIds ?? [], 60, 60),
    unlockedAchievementIds: sanitizeStringArray(state.unlockedAchievementIds ?? [], 20, 60),
    pendingLootBoxes: sanitizeStringArray(state.pendingLootBoxes ?? [], 20, 40),
    rewardedActionKeys: sanitizeStringArray(state.rewardedActionKeys ?? [], 120, 80),
    clearedWeekKeys: sanitizeStringArray(state.clearedWeekKeys ?? [], 60, 20),
    sfxEnabled: Boolean(state.sfxEnabled),
    crawlerName: sanitizeString(
      state.crawlerName || fallbackName,
      SCHEMA_LIMITS.CRAWLER_NAME_MAX,
      'Crawler'
    ),
    crawlerClass: sanitizeString(
      state.crawlerClass || 'Primal Brawler',
      SCHEMA_LIMITS.CRAWLER_CLASS_MAX,
      'Primal Brawler'
    ),
    crawlerMotto: sanitizeString(
      state.crawlerMotto ?? '',
      SCHEMA_LIMITS.CRAWLER_MOTTO_MAX,
      ''
    ),
    bannerTheme: sanitizeBannerTheme(state.bannerTheme),
    guildId: sanitizeOptionalId(state.guildId),
    guildName: sanitizeString(state.guildName ?? '', 50, ''),
    isPublicProfile: state.isPublicProfile ?? false,
    look: sanitizeLook(state.look),
  };
}

function buildPublicSnapshotFields(
  state: Omit<CrawlerState, 'createdAt' | 'updatedAt'>,
  fallbackName = 'Crawler'
) {
  const base = buildCrawlerStatePayload(state, fallbackName);
  return {
    crawlerName: base.crawlerName,
    crawlerClass: base.crawlerClass,
    crawlerMotto: base.crawlerMotto,
    bannerTheme: base.bannerTheme,
    xp: base.xp,
    level: base.level,
    weeklyClears: base.weeklyClears,
    currentStreak: base.currentStreak,
    bestStreak: base.bestStreak,
    equippedSpriteTier: base.equippedSpriteTier,
    equippedWeapon: base.equippedWeapon,
    equippedArmor: base.equippedArmor,
    equippedAccessory: base.equippedAccessory,
    equippedAura: base.equippedAura,
    unlockedAchievementIds: base.unlockedAchievementIds,
    unlockedGearCount: clampInt(base.unlockedGearIds.length, 0, 60, 0),
    look: base.look,
  };
}

export async function saveCrawlerState(
  uid: string,
  state: Omit<CrawlerState, 'createdAt' | 'updatedAt'>,
  isExisting: boolean,
  fallbackName = 'Crawler'
): Promise<void> {
  const safeId = sanitizeId(state.id || 'main');
  const path = `users/${uid}/crawlerState/${safeId}`;
  const payload = buildCrawlerStatePayload(state, fallbackName);

  try {
    if (isExisting) {
      await updateDoc(doc(db, 'users', uid, 'crawlerState', safeId), {
        ...payload,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(doc(db, 'users', uid, 'crawlerState', safeId), {
        ownerId: uid,
        ...payload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, isExisting ? OperationType.UPDATE : OperationType.CREATE, path);
  }
}

export async function syncSocialCrawlerProfile(
  uid: string,
  state: Omit<CrawlerState, 'createdAt' | 'updatedAt'>,
  fallbackName = 'Crawler'
): Promise<void> {
  const snapshotFields = buildPublicSnapshotFields(state, fallbackName);
  const cleanGuildId = sanitizeOptionalId(state.guildId);
  const cleanGuildName = sanitizeString(state.guildName ?? '', 50, '');
  const isPublic = state.isPublicProfile ?? false;

  const publicRef = doc(db, 'publicCrawlers', uid);
  const publicPath = `publicCrawlers/${uid}`;

  try {
    const publicSnap = await getDoc(publicRef);
    if (publicSnap.exists()) {
      await updateDoc(publicRef, {
        ...snapshotFields,
        guildId: cleanGuildId,
        guildName: cleanGuildName,
        isPublic,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(publicRef, {
        ownerId: uid,
        ...snapshotFields,
        guildId: cleanGuildId,
        guildName: cleanGuildName,
        isPublic,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, publicPath);
  }

  if (cleanGuildId) {
    const memberRef = doc(db, 'guilds', cleanGuildId, 'members', uid);
    const memberPath = `guilds/${cleanGuildId}/members/${uid}`;
    try {
      const memberSnap = await getDoc(memberRef);
      if (memberSnap.exists()) {
        await updateDoc(memberRef, {
          ...snapshotFields,
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, memberPath);
    }
  }
}

export function generateGuildInviteCode(guildName: string): string {
  const prefix =
    guildName
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 4) || 'CRWL';
  // 32 symbols (no 0/O/1/I): 256 % 32 === 0, so `byte % 32` has no modulo bias.
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  let suffix = '';
  for (const b of bytes) {
    suffix += chars[b % chars.length];
  }
  return sanitizeId(`${prefix}-${suffix}`);
}

export async function createGuild(params: {
  uid: string;
  crawler: Omit<CrawlerState, 'createdAt' | 'updatedAt'>;
  crawlerDocExists: boolean;
  fallbackName: string;
  name: string;
  motto: string;
  bannerTheme: BannerTheme;
  isPublic: boolean;
}): Promise<{ guildId: string; guildName: string }> {
  const { uid, crawler, crawlerDocExists, fallbackName, name, motto, bannerTheme, isPublic } = params;
  const cleanName = sanitizeString(name, SCHEMA_LIMITS.GUILD_NAME_MAX, 'Hunting Party');
  const finalName = cleanName.length >= 2 ? cleanName : 'Hunting Party';
  const cleanMotto = sanitizeString(motto, SCHEMA_LIMITS.GUILD_MOTTO_MAX, '');
  const cleanTheme = sanitizeBannerTheme(bannerTheme);
  const guildId = generateGuildInviteCode(finalName);

  const guildRef = doc(db, 'guilds', guildId);
  const memberRef = doc(db, 'guilds', guildId, 'members', uid);
  const crawlerRef = doc(db, 'users', uid, 'crawlerState', 'main');
  const publicRef = doc(db, 'publicCrawlers', uid);

  const snapshotFields = buildPublicSnapshotFields(crawler, fallbackName);
  const fullCrawlerPayload = buildCrawlerStatePayload(
    { ...crawler, guildId, guildName: finalName },
    fallbackName
  );

  try {
    const existingPublic = await getDoc(publicRef);
    const batch = writeBatch(db);

    batch.set(guildRef, {
      ownerId: uid,
      name: finalName,
      motto: cleanMotto,
      bannerTheme: cleanTheme,
      inviteCode: guildId,
      isPublic: Boolean(isPublic),
      memberCount: 1,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    batch.set(memberRef, {
      ownerId: uid,
      guildId,
      role: 'leader',
      ...snapshotFields,
      joinedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    if (crawlerDocExists) {
      batch.update(crawlerRef, {
        guildId,
        guildName: finalName,
        updatedAt: serverTimestamp(),
      });
    } else {
      batch.set(crawlerRef, {
        ownerId: uid,
        ...fullCrawlerPayload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    if (existingPublic.exists()) {
      batch.update(publicRef, {
        ...snapshotFields,
        guildId,
        guildName: finalName,
        isPublic: fullCrawlerPayload.isPublicProfile,
        updatedAt: serverTimestamp(),
      });
    } else {
      batch.set(publicRef, {
        ownerId: uid,
        ...snapshotFields,
        guildId,
        guildName: finalName,
        isPublic: fullCrawlerPayload.isPublicProfile,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    await batch.commit();
    return { guildId, guildName: finalName };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `guilds/${guildId}`);
  }
}

export async function lookupGuildByCode(rawCode: string): Promise<Guild | null> {
  const cleanCode = rawCode.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
  if (cleanCode.length < 4 || cleanCode.length > 40) return null;
  const path = `guilds/${cleanCode}`;
  try {
    const snap = await getDoc(doc(db, 'guilds', cleanCode));
    if (!snap.exists()) return null;
    return { ...(snap.data() as Omit<Guild, 'id'>), id: snap.id };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function joinGuild(params: {
  uid: string;
  crawler: Omit<CrawlerState, 'createdAt' | 'updatedAt'>;
  crawlerDocExists: boolean;
  fallbackName: string;
  guild: Guild;
}): Promise<void> {
  const { uid, crawler, crawlerDocExists, fallbackName, guild } = params;
  const guildId = sanitizeId(guild.id);
  const guildRef = doc(db, 'guilds', guildId);
  const memberRef = doc(db, 'guilds', guildId, 'members', uid);
  const crawlerRef = doc(db, 'users', uid, 'crawlerState', 'main');
  const publicRef = doc(db, 'publicCrawlers', uid);

  const snapshotFields = buildPublicSnapshotFields(crawler, fallbackName);
  const fullCrawlerPayload = buildCrawlerStatePayload(
    { ...crawler, guildId, guildName: guild.name },
    fallbackName
  );

  try {
    const [freshGuildSnap, existingMemberSnap, existingPublic] = await Promise.all([
      getDoc(guildRef),
      getDoc(memberRef),
      getDoc(publicRef),
    ]);
    if (!freshGuildSnap.exists()) {
      throw new Error('Guild was not found or has been disbanded.');
    }
    const freshGuild = freshGuildSnap.data() as Guild;
    if (existingMemberSnap.exists()) {
      // Already a member — just sync local state
      if (crawlerDocExists) {
        await updateDoc(crawlerRef, {
          guildId,
          guildName: freshGuild.name,
          updatedAt: serverTimestamp(),
        });
      }
      return;
    }
    if (freshGuild.memberCount >= 50) {
      throw new Error('This guild is full (50/50 crawlers).');
    }

    const batch = writeBatch(db);
    batch.set(memberRef, {
      ownerId: uid,
      guildId,
      role: 'member',
      ...snapshotFields,
      joinedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    batch.update(guildRef, {
      memberCount: freshGuild.memberCount + 1,
      updatedAt: serverTimestamp(),
    });

    if (crawlerDocExists) {
      batch.update(crawlerRef, {
        guildId,
        guildName: freshGuild.name,
        updatedAt: serverTimestamp(),
      });
    } else {
      batch.set(crawlerRef, {
        ownerId: uid,
        ...fullCrawlerPayload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    if (existingPublic.exists()) {
      batch.update(publicRef, {
        ...snapshotFields,
        guildId,
        guildName: freshGuild.name,
        isPublic: fullCrawlerPayload.isPublicProfile,
        updatedAt: serverTimestamp(),
      });
    } else {
      batch.set(publicRef, {
        ownerId: uid,
        ...snapshotFields,
        guildId,
        guildName: freshGuild.name,
        isPublic: fullCrawlerPayload.isPublicProfile,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    await batch.commit();
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes('not found') || error.message.includes('full'))
    ) {
      throw error;
    }
    handleFirestoreError(error, OperationType.WRITE, `guilds/${guildId}`);
  }
}

export async function updateGuildDetails(
  uid: string,
  guildId: string,
  updates: {
    name: string;
    motto: string;
    bannerTheme: BannerTheme;
    isPublic: boolean;
  }
): Promise<void> {
  const safeGuildId = sanitizeId(guildId);
  const cleanName = sanitizeString(updates.name, SCHEMA_LIMITS.GUILD_NAME_MAX, 'Hunting Party');
  const finalName = cleanName.length >= 2 ? cleanName : 'Hunting Party';
  const cleanMotto = sanitizeString(updates.motto, SCHEMA_LIMITS.GUILD_MOTTO_MAX, '');
  const cleanTheme = sanitizeBannerTheme(updates.bannerTheme);

  try {
    const batch = writeBatch(db);
    batch.update(doc(db, 'guilds', safeGuildId), {
      name: finalName,
      motto: cleanMotto,
      bannerTheme: cleanTheme,
      isPublic: Boolean(updates.isPublic),
      updatedAt: serverTimestamp(),
    });
    batch.update(doc(db, 'users', uid, 'crawlerState', 'main'), {
      guildName: finalName,
      updatedAt: serverTimestamp(),
    });
    const publicSnap = await getDoc(doc(db, 'publicCrawlers', uid));
    if (publicSnap.exists()) {
      batch.update(doc(db, 'publicCrawlers', uid), {
        guildName: finalName,
        updatedAt: serverTimestamp(),
      });
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `guilds/${safeGuildId}`);
  }
}

export async function leaveGuild(params: {
  uid: string;
  guildId: string;
  crawlerDocExists: boolean;
}): Promise<void> {
  const { uid, guildId, crawlerDocExists } = params;
  const safeGuildId = sanitizeId(guildId);
  const guildRef = doc(db, 'guilds', safeGuildId);
  const memberRef = doc(db, 'guilds', safeGuildId, 'members', uid);
  const crawlerRef = doc(db, 'users', uid, 'crawlerState', 'main');
  const publicRef = doc(db, 'publicCrawlers', uid);

  try {
    const [guildSnap, memberSnap, publicSnap] = await Promise.all([
      getDoc(guildRef),
      getDoc(memberRef),
      getDoc(publicRef),
    ]);

    const batch = writeBatch(db);
    if (memberSnap.exists()) {
      batch.delete(memberRef);
    }
    if (guildSnap.exists() && memberSnap.exists()) {
      const currentCount = (guildSnap.data() as Guild).memberCount;
      batch.update(guildRef, {
        memberCount: Math.max(0, currentCount - 1),
        updatedAt: serverTimestamp(),
      });
    }
    if (crawlerDocExists) {
      batch.update(crawlerRef, {
        guildId: '',
        guildName: '',
        updatedAt: serverTimestamp(),
      });
    }
    if (publicSnap.exists()) {
      batch.update(publicRef, {
        guildId: '',
        guildName: '',
        updatedAt: serverTimestamp(),
      });
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `guilds/${safeGuildId}`);
  }
}

export async function disbandGuild(params: {
  uid: string;
  guildId: string;
  crawlerDocExists: boolean;
}): Promise<void> {
  const { uid, guildId, crawlerDocExists } = params;
  const safeGuildId = sanitizeId(guildId);
  const guildRef = doc(db, 'guilds', safeGuildId);
  const memberRef = doc(db, 'guilds', safeGuildId, 'members', uid);
  const crawlerRef = doc(db, 'users', uid, 'crawlerState', 'main');
  const publicRef = doc(db, 'publicCrawlers', uid);

  try {
    const [memberSnap, publicSnap] = await Promise.all([getDoc(memberRef), getDoc(publicRef)]);
    const batch = writeBatch(db);
    if (memberSnap.exists()) {
      batch.delete(memberRef);
    }
    batch.delete(guildRef);
    if (crawlerDocExists) {
      batch.update(crawlerRef, {
        guildId: '',
        guildName: '',
        updatedAt: serverTimestamp(),
      });
    }
    if (publicSnap.exists()) {
      batch.update(publicRef, {
        guildId: '',
        guildName: '',
        updatedAt: serverTimestamp(),
      });
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `guilds/${safeGuildId}`);
  }
}



/** Foods the user typed once and wants to reuse (macros per 100 g). */
export async function saveCustomFood(
  uid: string,
  food: { name: string; calories: number; proteinG: number; carbsG: number; fatG: number }
): Promise<string> {
  const id = sanitizeId(`food_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`);
  const path = `users/${uid}/foods/${id}`;
  try {
    await setDoc(doc(db, 'users', uid, 'foods', id), {
      ownerId: uid,
      name: sanitizeString(food.name, SCHEMA_LIMITS.TITLE_MAX, 'Food'),
      calories: Math.round(clampNumber(food.calories, 0, 1000, 0)),
      proteinG: Number(clampNumber(food.proteinG, 0, 100, 0).toFixed(1)),
      carbsG: Number(clampNumber(food.carbsG, 0, 100, 0).toFixed(1)),
      fatG: Number(clampNumber(food.fatG, 0, 100, 0).toFixed(1)),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteCustomFood(uid: string, foodId: string): Promise<void> {
  const safeId = sanitizeId(foodId);
  const path = `users/${uid}/foods/${safeId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'foods', safeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
