export type GuideFaqTab = 'overview' | 'gym' | 'diet' | 'habits' | 'measurements';

export type GuideActionType =
  | 'open_settings'
  | 'open_armory'
  | 'open_quick_food'
  | 'open_diet_add_meal'
  | 'go_diet_tab'
  | 'go_gym_tab'
  | 'open_gym_picker'
  | 'open_gym_templates'
  | 'open_measurement_modal'
  | 'scroll_to_habits';

export interface GuideFaqAction {
  label: string;
  type: GuideActionType;
}

export interface GuideFaqItem {
  id: string;
  tab: GuideFaqTab;
  question: string;
  steps: string[];
  action?: GuideFaqAction;
}

export const GUIDE_FAQ: GuideFaqItem[] = [
  // Overview / Home
  {
    id: 'overview-start',
    tab: 'overview',
    question: 'Where do I start?',
    steps: [
      'On Home, tap Edit Week & Targets. Do not know your numbers? Tap Calculate calories and macros for me and answer age, height, weight and goal.',
      'Open Diet to add your daily meals or generate a basic diet plan.',
      'Open Gym to pick a ready-made workout or add your exercises.',
      'Each day, check off eaten meals, workouts, water, and habits to earn XP.',
    ],
    action: { label: 'Take me there', type: 'open_settings' },
  },
  {
    id: 'overview-xp',
    tab: 'overview',
    question: 'What is XP and what is it for?',
    steps: [
      'XP is the score you earn by logging workouts, meals, water, habits, and check-ins.',
      'More XP levels up your character and deals damage to the Weekly Boss on Home.',
      'Beating weekly goals and bosses rewards loot boxes with gear and new looks.',
      'Tap the arena card on Home to open your Armory and inspect your gear.',
    ],
    action: { label: 'Take me there', type: 'open_armory' },
  },
  {
    id: 'overview-install',
    tab: 'overview',
    question: 'How do I install the app on my phone?',
    steps: [
      'On mobile, tap the menu icon at the top left and tap Install on Phone.',
      'On Android (Chrome), tap Install Phone App or open the Chrome menu and choose Install.',
      'On iPhone (Safari), tap the Share button at the bottom and choose Add to Home Screen.',
      'If you opened the link inside another app, open the URL directly in Safari or Chrome first.',
    ],
  },

  // Diet
  {
    id: 'diet-add-meal',
    tab: 'diet',
    question: 'How do I add food to my day?',
    steps: [
      'Open Diet and tap the green Add meal button at the top.',
      "Type what you ate, like 'pão integral 2 fatias, presunto 1 fatia'.",
      'Check the matched foods and calculated calories and macros below.',
      'Pick which Meal to save into (and mark Already eaten if you already ate it).',
      'Tap Add to day to save.',
    ],
    action: { label: 'Take me there', type: 'open_diet_add_meal' },
  },
  {
    id: 'diet-missing-food',
    tab: 'diet',
    question: 'How do I add a food that does not exist?',
    steps: [
      'Tap Log Food Eaten on Home (or tap More > Log Food Eaten in Diet).',
      'Tap Create new food (saved for next time) below the search list.',
      'Enter the name and calories, protein, carbs, and fat per 100 g, then save.',
      'If you do not want to save it for later, tap Enter manually for a one-time entry.',
    ],
    action: { label: 'Take me there', type: 'open_quick_food' },
  },
  {
    id: 'diet-copy-yesterday',
    tab: 'diet',
    question: "How do I copy yesterday's meals?",
    steps: [
      'In Diet, tap the day tab where you want to paste the meals.',
      'At the top right, tap More.',
      'Tap Copy yesterday here (or Copy same day last week).',
      'Yesterday items are added to the selected day so you can adjust or check them off.',
    ],
    action: { label: 'Take me there', type: 'go_diet_tab' },
  },
  {
    id: 'diet-rpg-stats',
    tab: 'diet',
    question: 'What do HP, STR, AGI, and INT mean?',
    steps: [
      'They are your daily nutrition bars styled like RPG stats at the top of Diet.',
      'HP · Rations tracks your consumed calories for the day against your calorie target.',
      'STR · Protein tracks protein, AGI · Carbs tracks carbs, and INT · Fat tracks fat.',
      'Each bar fills up as you mark foods as eaten.',
    ],
    action: { label: 'Take me there', type: 'go_diet_tab' },
  },
  {
    id: 'diet-targets',
    tab: 'diet',
    question: 'How do I adjust my targets?',
    steps: [
      'On Home, tap Edit Week & Targets (or tap the Current Week card in the side menu).',
      'Do not know your numbers? Tap Calculate calories and macros for me, fill in age, height, weight and goal, then tap Use these numbers.',
      'Or update calories, protein, carbs, fat, water goal, and target weight by hand.',
      'You can also change how many meals per day you want.',
      'Tap Save Targets to apply the changes everywhere.',
    ],
    action: { label: 'Take me there', type: 'open_settings' },
  },

  // Gym
  {
    id: 'gym-start-workout',
    tab: 'gym',
    question: 'How do I start a workout?',
    steps: [
      'Open Gym and pick the day of the week you are training.',
      'Keep Gym workout selected and add exercises or pick a saved plan.',
      'Tap Start Workout to start the live session timer.',
      'Check off each finished set and tap Finish Workout when you are done.',
    ],
    action: { label: 'Take me there', type: 'go_gym_tab' },
  },
  {
    id: 'gym-add-exercise',
    tab: 'gym',
    question: 'How do I add an exercise?',
    steps: [
      'Open Gym and scroll to Exercise Prescription on the selected day.',
      'Tap Browse Exercise DB to search the catalog with exercise photos.',
      'Or tap Custom Row to type an exercise name manually.',
      'Adjust sets, reps, and load, then tap Save Day Log.',
    ],
    action: { label: 'Take me there', type: 'open_gym_picker' },
  },
  {
    id: 'gym-ready-plan',
    tab: 'gym',
    question: 'How do I use a ready-made plan?',
    steps: [
      'In Gym, tap Ready-made Workouts near the top.',
      'Pick your level and split, then add the templates to your plans.',
      'Choose a day and select a saved plan from Plan for [day] (or from Training Plans).',
      'All exercises load into the day so you can adjust weights and train.',
    ],
    action: { label: 'Take me there', type: 'open_gym_templates' },
  },
  {
    id: 'gym-cardio',
    tab: 'gym',
    question: 'How do I log a run or walk?',
    steps: [
      'In Gym, select the day of the activity.',
      'Under Training type, tap Run or Walk.',
      'Fill in distance and time (for runs, entering any two values calculates pace automatically).',
      'Tap Save Day Log to record it and earn +35 XP.',
    ],
    action: { label: 'Take me there', type: 'go_gym_tab' },
  },
  {
    id: 'gym-export-text',
    tab: 'gym',
    question: 'How do I export my workout as text?',
    steps: [
      'In Gym, open a day that already has at least one exercise.',
      'Tap Export as text at the top of the day editor.',
      'Choose between What I did (sets, load, RPE) or Plan (to import).',
      'Tap Copy text or Share to send it anywhere.',
    ],
    action: { label: 'Take me there', type: 'go_gym_tab' },
  },

  // Habits & Measurements
  {
    id: 'measurements-log-weight',
    tab: 'measurements',
    question: 'How do I log my weight?',
    steps: [
      'Tap Log Check-in at the top of the app, or open Body > Measurements and tap Log Measurement.',
      'Enter the date, your current weight, and optional body fat or body measurements.',
      'Tap Save Check-in to update your history and progress chart.',
    ],
    action: { label: 'Take me there', type: 'open_measurement_modal' },
  },
  {
    id: 'habits-check',
    tab: 'habits',
    question: 'How do I check off a habit?',
    steps: [
      'On Home, scroll down to Daily Quests & Goal Squares.',
      "Under Today's Check-In, tap any habit tile you completed to mark it done and earn +10 XP.",
      'Use Add Habit or Edit Habits to create new routines or customize existing ones.',
      'Completing every habit on the same day awards a +25 XP sweep bonus.',
    ],
    action: { label: 'Take me there', type: 'scroll_to_habits' },
  },
];

export function isContextualFaqTab(faqTab: GuideFaqTab, activeTab: 'overview' | 'gym' | 'diet' | 'measurements'): boolean {
  if (activeTab === 'overview') return faqTab === 'overview' || faqTab === 'habits';
  return faqTab === activeTab;
}
