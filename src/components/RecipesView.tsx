import React, { useMemo, useState } from 'react';
import {
  CalendarPlus,
  Clock,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
  Utensils,
  X,
} from 'lucide-react';
import {
  buildDailyMealSlots,
  DAY_FULL,
  MealSlot,
  RECIPE_CATEGORIES,
  Recipe,
  RecipeCategory,
  SCHEMA_LIMITS,
  UserProfile,
} from '../types';
import {
  createMealLog,
  deleteRecipe,
  saveRecipe,
  toggleRecipeFavorite,
} from '../lib/firestoreService';
import { buildStarterRecipes } from '../lib/starterRecipes';
import { useT } from '../lib/i18n';

interface Props {
  uid: string;
  profile: UserProfile;
  recipes: Recipe[];
}

const PRESET_IMAGES = [
  {
    label: 'Salmon Bowl',
    url: '/src/assets/images/recipe_salmon_bowl_1794921378325.jpg',
  },
  {
    label: 'Chicken Pesto',
    url: '/src/assets/images/recipe_chicken_pesto_1794921378076.jpg',
  },
  {
    label: 'Protein Oats',
    url: '/src/assets/images/recipe_protein_oats_1794921378850.jpg',
  },
  {
    label: 'Steak Stir-Fry',
    url: '/src/assets/images/recipe_beef_stirfry_1794921378792.jpg',
  },
];

export const RecipesView: React.FC<Props> = ({ uid, profile, recipes }) => {
  const t = useT();
  const [filter, setFilter] = useState<'all' | 'favorites' | RecipeCategory>('all');
  const [search, setSearch] = useState('');
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  // View details drawer
  const [detailRecipe, setDetailRecipe] = useState<Recipe | null>(null);

  // Schedule modal
  const mealsPerDay = profile.mealsPerDay ?? 6;
  const dailySlots = buildDailyMealSlots(mealsPerDay);
  const [scheduleRecipe, setScheduleRecipe] = useState<Recipe | null>(null);
  const [schedWeek, setSchedWeek] = useState(profile.currentWeek);
  const [schedDay, setSchedDay] = useState(0);
  const [schedSlot, setSchedSlot] = useState<MealSlot>('meal_1');
  const [schedServings, setSchedServings] = useState(1);
  const [schedFeedback, setSchedFeedback] = useState<string | null>(null);

  // Editor modal
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<RecipeCategory>('lunch');
  const [prepMinutes, setPrepMinutes] = useState(20);
  const [servings, setServings] = useState(1);
  const [calories, setCalories] = useState(550);
  const [proteinG, setProteinG] = useState(45);
  const [carbsG, setCarbsG] = useState(55);
  const [fatG, setFatG] = useState(15);
  const [imageUrl, setImageUrl] = useState('');
  const [ingredientsText, setIngredientsText] = useState('');
  const [instructionsText, setInstructionsText] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const missingStarters = useMemo(() => {
    const have = new Set(recipes.map((r) => r.id));
    return buildStarterRecipes().filter((r) => !have.has(r.id));
  }, [recipes]);

  const handleAddStarters = async () => {
    setSeeding(true);
    try {
      for (const rec of missingStarters) {
        await saveRecipe(uid, rec, false);
      }
    } finally {
      setSeeding(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return recipes.filter((r) => {
      if (filter === 'favorites' && !r.isFavorite) return false;
      if (filter !== 'all' && filter !== 'favorites' && r.category !== filter) return false;
      if (!q) return true;
      return (
        r.title.toLowerCase().includes(q) ||
        r.ingredients.some((i) => i.toLowerCase().includes(q))
      );
    });
  }, [recipes, filter, search]);

  const openCreateModal = () => {
    setEditingId(null);
    setTitle('');
    setCategory('lunch');
    setPrepMinutes(20);
    setServings(1);
    setCalories(550);
    setProteinG(45);
    setCarbsG(55);
    setFatG(15);
    setImageUrl('');
    setIngredientsText('');
    setInstructionsText('');
    setIsFavorite(false);
    setEditorOpen(true);
  };

  const openEditModal = (rec: Recipe) => {
    setEditingId(rec.id);
    setTitle(rec.title);
    setCategory(rec.category);
    setPrepMinutes(rec.prepMinutes);
    setServings(rec.servings);
    setCalories(rec.calories);
    setProteinG(rec.proteinG);
    setCarbsG(rec.carbsG);
    setFatG(rec.fatG);
    setImageUrl(rec.imageUrl);
    setIngredientsText(rec.ingredients.join('\n'));
    setInstructionsText(rec.instructions.join('\n'));
    setIsFavorite(rec.isFavorite);
    setEditorOpen(true);
  };

  const handleSaveRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const ingredients = ingredientsText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);
      const instructions = instructionsText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      await saveRecipe(
        uid,
        {
          id: editingId ?? '',
          title,
          category,
          prepMinutes,
          servings,
          calories,
          proteinG,
          carbsG,
          fatG,
          imageUrl,
          ingredients,
          instructions,
          isFavorite,
        },
        Boolean(editingId)
      );
      setEditorOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleRecipe) return;
    setSaving(true);
    try {
      await createMealLog(uid, {
        weekNumber: schedWeek,
        dayIndex: schedDay,
        slot: schedSlot,
        title: scheduleRecipe.title,
        recipeId: scheduleRecipe.id,
        servings: schedServings,
        calories: Math.round(scheduleRecipe.calories * schedServings),
        proteinG: Number((scheduleRecipe.proteinG * schedServings).toFixed(1)),
        carbsG: Number((scheduleRecipe.carbsG * schedServings).toFixed(1)),
        fatG: Number((scheduleRecipe.fatG * schedServings).toFixed(1)),
        consumed: false,
      });
      setSchedFeedback(
        `Added to Week ${schedWeek} · ${DAY_FULL[schedDay]} ${schedSlot}`
      );
      setTimeout(() => {
        setScheduleRecipe(null);
        setSchedFeedback(null);
      }, 900);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-[#131a24] border-2 border-[#263347] rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <p className="text-xs text-slate-400">
            {recipes.length} saved recipes · Schedule directly into your weekly Diet Plan
          </p>
          <h1 className="text-xl font-bold text-white mt-1">Recipe Tracker & Meal Prep</h1>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
          {missingStarters.length > 0 && (
            <button
              type="button"
              onClick={() => void handleAddStarters()}
              disabled={seeding}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap"
            >
              <Utensils className="w-4 h-4" />
              {seeding ? t('Adding...') : t('Add {n} starter recipes', { n: missingStarters.length })}
            </button>
          )}
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            New Recipe
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 bg-[#131a24] border border-[#263347] rounded-lg overflow-x-auto">
          {(
            [
              { id: 'all', label: 'All' },
              { id: 'favorites', label: 'Favorites' },
              { id: 'breakfast', label: 'Breakfast' },
              { id: 'lunch', label: 'Lunch' },
              { id: 'dinner', label: 'Dinner' },
              { id: 'snack', label: 'Snack' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                filter === tab.id
                  ? 'bg-amber-400 text-slate-950'
                  : 'text-slate-300 hover:text-white hover:bg-[#1a2332]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search recipes or ingredients..."
            className="w-full pl-9 pr-3 py-2 text-sm text-white placeholder:text-slate-500 bg-[#0e141d] border border-[#2d3c54] rounded-lg focus:outline-none focus:border-emerald-400"
          />
        </div>
      </div>

      {/* Recipe Grid */}
      {filtered.length === 0 ? (
        <div className="bg-[#131a24] border-2 border-[#263347] rounded-xl p-12 text-center">
          <p className="text-sm font-medium text-slate-200">No recipes match your filter</p>
          <p className="text-xs text-slate-400 mt-1 mb-4">
            Create a custom macro-tracked recipe to reuse across your weekly diet plans.
          </p>
          <button
            type="button"
            onClick={openCreateModal}
            className="px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg"
          >
            Create First Recipe
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((rec) => {
            const showImage = Boolean(rec.imageUrl) && !failedImages[rec.id];
            return (
              <article
                key={rec.id}
                className="bg-[#131a24] border-2 border-[#263347] rounded-xl overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="aspect-4/3 bg-[#0e141d] border-b border-[#253247] relative overflow-hidden">
                    {showImage ? (
                      <img
                        src={rec.imageUrl}
                        alt={rec.title}
                        referrerPolicy="no-referrer"
                        onError={() =>
                          setFailedImages((prev) => ({ ...prev, [rec.id]: true }))
                        }
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#0e141d] to-[#1a2332] text-slate-400 p-4 text-center">
                        <Utensils className="w-7 h-7 mb-2 text-slate-500" />
                        <span className="text-xs font-medium text-slate-300">{rec.title}</span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        void toggleRecipeFavorite(uid, rec.id, !rec.isFavorite)
                      }
                      aria-label={rec.isFavorite ? 'Remove favorite' : 'Favorite recipe'}
                      className="absolute top-3 right-3 p-2 rounded-lg bg-[#090d12]/85 text-slate-200 hover:text-amber-400 border border-[#33445e] transition-colors"
                    >
                      <Star
                        className={`w-4 h-4 ${
                          rec.isFavorite ? 'fill-amber-400 text-amber-400' : ''
                        }`}
                      />
                    </button>
                  </div>

                  <div className="p-5">
                    <div className="flex items-center gap-2 text-xs text-slate-400 capitalize">
                      <span>{rec.category}</span>
                      <span aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {rec.prepMinutes} min
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {rec.servings} {rec.servings === 1 ? 'serving' : 'servings'}
                      </span>
                    </div>

                    <h2 className="text-base font-semibold text-white mt-1.5 leading-snug">
                      {rec.title}
                    </h2>

                    <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-[#253247] font-mono tabular-nums">
                      <div>
                        <p className="text-[11px] font-sans text-slate-400">Calories</p>
                        <p className="text-sm font-semibold text-white">{rec.calories}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-sans text-slate-400">Protein</p>
                        <p className="text-sm font-semibold text-emerald-400">{rec.proteinG}g</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-sans text-slate-400">Carbs</p>
                        <p className="text-sm font-semibold text-sky-300">{rec.carbsG}g</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-sans text-slate-400">Fat</p>
                        <p className="text-sm font-semibold text-amber-300">{rec.fatG}g</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-5 py-3.5 bg-[#0e141d] border-t border-[#253247] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setDetailRecipe(rec)}
                      className="px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:bg-[#1a2332] rounded-md transition-colors whitespace-nowrap"
                    >
                      Prep Steps
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditModal(rec)}
                      aria-label={`Edit ${rec.title}`}
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-[#1a2332] rounded-md transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void deleteRecipe(uid, rec.id)}
                      aria-label={`Delete ${rec.title}`}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-[#1a2332] rounded-md transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const defaultSlotMap: Record<RecipeCategory, MealSlot> = {
                        breakfast: 'meal_1',
                        lunch: mealsPerDay >= 2 ? 'meal_2' : 'meal_1',
                        dinner: mealsPerDay >= 3 ? 'meal_3' : 'meal_1',
                        snack: mealsPerDay >= 4 ? 'meal_4' : 'on_the_spot',
                      };
                      setScheduleRecipe(rec);
                      setSchedWeek(profile.currentWeek);
                      setSchedSlot(defaultSlotMap[rec.category]);
                      setSchedServings(1);
                    }}
                    className="min-h-[40px] inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors whitespace-nowrap"
                  >
                    <CalendarPlus className="w-3.5 h-3.5" />
                    Add to Plan
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Recipe Detail Modal */}
      {detailRecipe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-2xl bg-[#131a24] border-2 border-[#33445e] rounded-xl shadow-2xl overflow-hidden max-h-[88vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 bg-[#0f151e] border-b border-[#253247]">
              <div>
                <p className="text-xs text-slate-400 capitalize">
                  {detailRecipe.category} · {detailRecipe.prepMinutes} min · {detailRecipe.servings}{' '}
                  {detailRecipe.servings === 1 ? 'serving' : 'servings'}
                </p>
                <h2 className="text-lg font-semibold text-white">{detailRecipe.title}</h2>
              </div>
              <button
                type="button"
                onClick={() => setDetailRecipe(null)}
                aria-label="Close recipe details"
                className="p-2 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-4 gap-4 p-4 bg-[#0e141d] border border-[#263347] rounded-lg font-mono tabular-nums">
                <div>
                  <p className="text-xs font-sans text-slate-400">Calories / svg</p>
                  <p className="text-base font-bold text-white">{detailRecipe.calories}</p>
                </div>
                <div>
                  <p className="text-xs font-sans text-slate-400">Protein</p>
                  <p className="text-base font-bold text-emerald-400">{detailRecipe.proteinG}g</p>
                </div>
                <div>
                  <p className="text-xs font-sans text-slate-400">Carbs</p>
                  <p className="text-base font-bold text-sky-300">{detailRecipe.carbsG}g</p>
                </div>
                <div>
                  <p className="text-xs font-sans text-slate-400">Fat</p>
                  <p className="text-base font-bold text-amber-300">{detailRecipe.fatG}g</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-white mb-3">Ingredients</h3>
                  {detailRecipe.ingredients.length === 0 ? (
                    <p className="text-xs text-slate-400">No ingredients listed.</p>
                  ) : (
                    <ul className="space-y-2 text-sm text-slate-200">
                      {detailRecipe.ingredients.map((ing, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-emerald-400 font-mono text-xs mt-1">•</span>
                          <span>{ing}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-white mb-3">Preparation</h3>
                  {detailRecipe.instructions.length === 0 ? (
                    <p className="text-xs text-slate-400">No instructions listed.</p>
                  ) : (
                    <ol className="space-y-3 text-sm text-slate-200">
                      {detailRecipe.instructions.map((step, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <span className="text-xs font-mono font-semibold text-slate-400 mt-0.5 tabular-nums">
                            {String(i + 1).padStart(2, '0')}.
                          </span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Recipe to Diet Plan Modal */}
      {scheduleRecipe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-md bg-[#131a24] border-2 border-[#33445e] rounded-xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-[#0f151e] border-b border-[#253247]">
              <h2 className="text-base font-semibold text-white">Schedule Recipe</h2>
              <button
                type="button"
                onClick={() => setScheduleRecipe(null)}
                aria-label="Close schedule modal"
                className="p-2 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="p-6 space-y-4">
              <p className="text-sm font-medium text-white">{scheduleRecipe.title}</p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Week</label>
                  <input
                    type="number"
                    min={1}
                    max={52}
                    value={schedWeek}
                    onChange={(e) => setSchedWeek(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm text-white bg-[#0e141d] tabular-nums border border-[#2d3c54] rounded-lg focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Day</label>
                  <select
                    value={schedDay}
                    onChange={(e) => setSchedDay(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm text-white border border-[#2d3c54] rounded-lg bg-[#0e141d] focus:outline-none focus:border-emerald-400"
                  >
                    {DAY_FULL.map((d, i) => (
                      <option key={d} value={i} className="bg-[#0e141d] text-slate-100">
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Meal Slot</label>
                  <select
                    value={schedSlot}
                    onChange={(e) => setSchedSlot(e.target.value as MealSlot)}
                    className="w-full px-3 py-2 text-sm text-white border border-[#2d3c54] rounded-lg bg-[#0e141d] focus:outline-none focus:border-emerald-400"
                  >
                    {dailySlots.map((s) => (
                      <option key={s.key} value={s.key} className="bg-[#0e141d] text-slate-100">
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Servings</label>
                  <input
                    type="number"
                    step="0.25"
                    min={0.25}
                    max={10}
                    value={schedServings}
                    onChange={(e) => setSchedServings(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm text-white bg-[#0e141d] tabular-nums border border-[#2d3c54] rounded-lg focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div className="p-3 bg-[#0e141d] border border-[#263347] rounded-lg text-xs font-mono tabular-nums text-slate-200">
                Logged macros: {Math.round(scheduleRecipe.calories * schedServings)} kcal ·{' '}
                {Math.round(scheduleRecipe.proteinG * schedServings)}g P ·{' '}
                {Math.round(scheduleRecipe.carbsG * schedServings)}g C ·{' '}
                {Math.round(scheduleRecipe.fatG * schedServings)}g F
              </div>

              {schedFeedback && (
                <p className="text-xs font-medium text-emerald-400">{schedFeedback}</p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setScheduleRecipe(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-200 hover:bg-[#1a2332] rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg"
                >
                  {saving ? 'Adding...' : 'Add to Diet Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create / Edit Recipe Modal */}
      {editorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-2xl bg-[#131a24] border-2 border-[#33445e] rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 bg-[#0f151e] border-b border-[#253247]">
              <h2 className="text-base font-semibold text-white">
                {editingId ? 'Edit Recipe' : 'Create New Recipe'}
              </h2>
              <button
                type="button"
                onClick={() => setEditorOpen(false)}
                aria-label="Close recipe editor"
                className="p-2 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRecipe} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Recipe Title
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={SCHEMA_LIMITS.TITLE_MAX}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Turkey Quinoa Power Bowl"
                    className="w-full px-3 py-2 text-sm text-white placeholder:text-slate-500 bg-[#0e141d] border border-[#2d3c54] rounded-lg focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as RecipeCategory)}
                    className="w-full px-3 py-2 text-sm text-white border border-[#2d3c54] rounded-lg bg-[#0e141d] focus:outline-none focus:border-emerald-400"
                  >
                    {RECIPE_CATEGORIES.map((s) => (
                      <option key={s.key} value={s.key} className="bg-[#0e141d] text-slate-100">
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Prep (min)</label>
                  <input
                    type="number"
                    min={0}
                    max={1440}
                    value={prepMinutes}
                    onChange={(e) => setPrepMinutes(Number(e.target.value))}
                    className="w-full px-2.5 py-2 text-sm text-white bg-[#0e141d] font-mono tabular-nums border border-[#2d3c54] rounded-lg focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Servings</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={servings}
                    onChange={(e) => setServings(Number(e.target.value))}
                    className="w-full px-2.5 py-2 text-sm text-white bg-[#0e141d] font-mono tabular-nums border border-[#2d3c54] rounded-lg focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Calories</label>
                  <input
                    type="number"
                    min={0}
                    max={5000}
                    value={calories}
                    onChange={(e) => setCalories(Number(e.target.value))}
                    className="w-full px-2.5 py-2 text-sm text-white bg-[#0e141d] font-mono tabular-nums border border-[#2d3c54] rounded-lg focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Protein (g)</label>
                  <input
                    type="number"
                    step="0.5"
                    min={0}
                    max={500}
                    value={proteinG}
                    onChange={(e) => setProteinG(Number(e.target.value))}
                    className="w-full px-2.5 py-2 text-sm text-white bg-[#0e141d] font-mono tabular-nums border border-[#2d3c54] rounded-lg focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Carbs (g)</label>
                  <input
                    type="number"
                    step="0.5"
                    min={0}
                    max={800}
                    value={carbsG}
                    onChange={(e) => setCarbsG(Number(e.target.value))}
                    className="w-full px-2.5 py-2 text-sm text-white bg-[#0e141d] font-mono tabular-nums border border-[#2d3c54] rounded-lg focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Fat (g)</label>
                  <input
                    type="number"
                    step="0.5"
                    min={0}
                    max={400}
                    value={fatG}
                    onChange={(e) => setFatG(Number(e.target.value))}
                    className="w-full px-2.5 py-2 text-sm text-white bg-[#0e141d] font-mono tabular-nums border border-[#2d3c54] rounded-lg focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Recipe Photo (optional URL or choose preset)
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {PRESET_IMAGES.map((img) => (
                    <button
                      key={img.url}
                      type="button"
                      onClick={() => setImageUrl(img.url)}
                      className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
                        imageUrl === img.url
                          ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/50'
                          : 'bg-[#0e141d] text-slate-300 border-[#2d3c54] hover:bg-[#1a2332]'
                      }`}
                    >
                      {img.label}
                    </button>
                  ))}
                  {imageUrl && (
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="px-2.5 py-1 text-xs text-slate-400 hover:text-white"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  maxLength={SCHEMA_LIMITS.IMAGE_URL_MAX}
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="/src/assets/images/..."
                  className="w-full px-3 py-2 text-xs text-white placeholder:text-slate-500 bg-[#0e141d] font-mono border border-[#2d3c54] rounded-lg focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Ingredients (one per line)
                  </label>
                  <textarea
                    rows={5}
                    value={ingredientsText}
                    onChange={(e) => setIngredientsText(e.target.value)}
                    placeholder={'200g chicken breast\n150g cooked rice\n100g steamed broccoli'}
                    className="w-full px-3 py-2 text-sm text-white placeholder:text-slate-500 bg-[#0e141d] border border-[#2d3c54] rounded-lg focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Instructions (one step per line)
                  </label>
                  <textarea
                    rows={5}
                    value={instructionsText}
                    onChange={(e) => setInstructionsText(e.target.value)}
                    placeholder={'Season chicken and grill 6 min per side.\nServe over rice with broccoli.'}
                    className="w-full px-3 py-2 text-sm text-white placeholder:text-slate-500 bg-[#0e141d] border border-[#2d3c54] rounded-lg focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#253247]">
                <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFavorite}
                    onChange={(e) => setIsFavorite(e.target.checked)}
                    className="rounded border-[#394c69] bg-[#0e141d] text-emerald-400 focus:ring-emerald-400"
                  />
                  Mark as favorite
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditorOpen(false)}
                    className="px-4 py-2 text-xs font-medium text-slate-200 hover:bg-[#1a2332] rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 rounded-lg"
                  >
                    {saving ? 'Saving...' : 'Save Recipe'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
