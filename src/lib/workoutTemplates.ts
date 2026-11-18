import { ExerciseItem } from '../types';

export type TemplateLevel = 'beginner' | 'intermediate' | 'advanced';

export interface TemplateDay {
  name: string;
  /** 0 = Mon .. 6 = Sun; suggested default days for this session */
  weekdays: number[];
  exercises: ExerciseItem[];
}

export interface TemplateSplit {
  id: string;
  level: TemplateLevel;
  name: string;
  description: string;
  days: TemplateDay[];
}

export const TEMPLATE_LEVELS: { key: TemplateLevel; label: string; hint: string }[] = [
  { key: 'beginner', label: 'Beginner', hint: 'Machines and simple lifts' },
  { key: 'intermediate', label: 'Intermediate', hint: 'More volume and variations' },
  { key: 'advanced', label: 'Advanced', hint: 'Free weights, higher frequency' },
];

type Row = [name: string, sets: number, reps: string, muscle: string];

function day(splitId: string, name: string, weekdays: number[], rows: Row[]): TemplateDay {
  return {
    name,
    weekdays,
    exercises: rows.map(([exName, sets, reps, muscleGroup], i) => ({
      id: `tpl_${splitId}_${name.replace(/[^a-zA-Z0-9]+/g, '')}_${i}`,
      name: exName,
      sets,
      reps,
      targetLoad: 0,
      actualLoad: 0,
      rpe: 8,
      completed: false,
      restSeconds: sets >= 4 && muscleGroup !== 'biceps' && muscleGroup !== 'triceps' ? 120 : 90,
      muscleGroup,
    })),
  };
}

const MON_WED_FRI = [0, 2, 4];

export const WORKOUT_TEMPLATES: TemplateSplit[] = [
  // ---------- Beginner ----------
  {
    id: 'beg_fullbody',
    level: 'beginner',
    name: 'Full Body 3x',
    description: '3 days/week, the whole body every session. Best way to learn the basics.',
    days: [
      day('beg_fullbody', 'Full Body', MON_WED_FRI, [
        ['Supino reto', 3, '10', 'chest'],
        ['Puxada alta', 3, '10', 'lats'],
        ['Leg press', 3, '12', 'quadriceps'],
        ['Cadeira flexora', 3, '12', 'hamstrings'],
        ['Cadeira extensora', 3, '12', 'quadriceps'],
        ['Rosca direta', 3, '12', 'biceps'],
        ['Tríceps na barra (polia)', 3, '12', 'triceps'],
      ]),
    ],
  },
  {
    id: 'beg_abc',
    level: 'beginner',
    name: 'ABC',
    description: '3 days/week: chest + triceps, back + biceps, legs.',
    days: [
      day('beg_abc', 'A – Chest & Triceps', [0], [
        ['Supino reto', 3, '10', 'chest'],
        ['Desenvolvimento com halteres', 3, '10', 'shoulders'],
        ['Tríceps na barra (polia)', 3, '12', 'triceps'],
      ]),
      day('beg_abc', 'B – Back & Biceps', [2], [
        ['Puxada alta', 3, '10', 'lats'],
        ['Remada baixa', 3, '10', 'middle back'],
        ['Rosca direta', 3, '12', 'biceps'],
      ]),
      day('beg_abc', 'C – Legs', [4], [
        ['Leg press', 3, '12', 'quadriceps'],
        ['Cadeira extensora', 3, '12', 'quadriceps'],
        ['Cadeira flexora', 3, '12', 'hamstrings'],
        ['Panturrilha em pé', 3, '15', 'calves'],
      ]),
    ],
  },

  // ---------- Intermediate ----------
  {
    id: 'int_abc',
    level: 'intermediate',
    name: 'ABC',
    description: '3 days/week with more volume: incline press, rope pushdown, hack squat.',
    days: [
      day('int_abc', 'A – Chest, Shoulders & Triceps', [0], [
        ['Supino reto', 4, '8', 'chest'],
        ['Supino inclinado', 3, '10', 'chest'],
        ['Elevação lateral', 3, '12', 'shoulders'],
        ['Tríceps corda', 3, '12', 'triceps'],
        ['Tríceps testa', 3, '10', 'triceps'],
      ]),
      day('int_abc', 'B – Back & Biceps', [2], [
        ['Puxada alta', 4, '10', 'lats'],
        ['Remada curvada', 3, '10', 'middle back'],
        ['Remada baixa', 3, '10', 'middle back'],
        ['Rosca direta', 3, '10', 'biceps'],
        ['Rosca martelo', 3, '12', 'biceps'],
      ]),
      day('int_abc', 'C – Legs', [4], [
        ['Hack squat', 4, '10', 'quadriceps'],
        ['Leg press', 3, '12', 'quadriceps'],
        ['Cadeira extensora', 3, '12', 'quadriceps'],
        ['Cadeira flexora', 3, '12', 'hamstrings'],
        ['Panturrilha em pé', 4, '15', 'calves'],
      ]),
    ],
  },
  {
    id: 'int_ul',
    level: 'intermediate',
    name: 'Upper / Lower 4x',
    description: '4 days/week: upper body Mon + Thu, lower body Tue + Fri.',
    days: [
      day('int_ul', 'Upper', [0, 3], [
        ['Supino inclinado', 4, '8', 'chest'],
        ['Puxada alta', 4, '10', 'lats'],
        ['Desenvolvimento com halteres', 3, '10', 'shoulders'],
        ['Remada baixa', 3, '10', 'middle back'],
        ['Tríceps corda', 3, '12', 'triceps'],
        ['Rosca direta', 3, '12', 'biceps'],
      ]),
      day('int_ul', 'Lower', [1, 4], [
        ['Hack squat', 4, '10', 'quadriceps'],
        ['Stiff', 3, '10', 'hamstrings'],
        ['Leg press', 3, '12', 'quadriceps'],
        ['Cadeira flexora', 3, '12', 'hamstrings'],
        ['Panturrilha em pé', 4, '15', 'calves'],
        ['Abdominal na máquina', 3, '15', 'abdominals'],
      ]),
    ],
  },
  {
    id: 'int_ppl',
    level: 'intermediate',
    name: 'Push / Pull / Legs 3x',
    description: '3 days/week: push, pull, legs.',
    days: [
      day('int_ppl', 'Push', [0], [
        ['Supino inclinado', 4, '8', 'chest'],
        ['Supino reto', 3, '10', 'chest'],
        ['Desenvolvimento com halteres', 3, '10', 'shoulders'],
        ['Elevação lateral', 3, '12', 'shoulders'],
        ['Tríceps corda', 3, '12', 'triceps'],
      ]),
      day('int_ppl', 'Pull', [2], [
        ['Puxada alta', 4, '10', 'lats'],
        ['Remada baixa', 3, '10', 'middle back'],
        ['Crucifixo inverso', 3, '12', 'shoulders'],
        ['Rosca direta', 3, '10', 'biceps'],
        ['Rosca martelo', 3, '12', 'biceps'],
      ]),
      day('int_ppl', 'Legs', [4], [
        ['Hack squat', 4, '10', 'quadriceps'],
        ['Leg press', 3, '12', 'quadriceps'],
        ['Cadeira extensora', 3, '12', 'quadriceps'],
        ['Cadeira flexora', 3, '12', 'hamstrings'],
        ['Panturrilha em pé', 4, '15', 'calves'],
      ]),
    ],
  },

  // ---------- Advanced ----------
  {
    id: 'adv_ppl6',
    level: 'advanced',
    name: 'Push / Pull / Legs 6x',
    description: '6 days/week: each muscle trained twice, free weights first.',
    days: [
      day('adv_ppl6', 'Push', [0, 3], [
        ['Supino com halteres', 4, '8', 'chest'],
        ['Supino inclinado', 3, '10', 'chest'],
        ['Desenvolvimento militar', 4, '8', 'shoulders'],
        ['Elevação lateral', 4, '12', 'shoulders'],
        ['Tríceps corda', 3, '12', 'triceps'],
        ['Tríceps francês', 3, '10', 'triceps'],
      ]),
      day('adv_ppl6', 'Pull', [1, 4], [
        ['Barra fixa', 4, '8', 'lats'],
        ['Remada curvada', 4, '8', 'middle back'],
        ['Remada baixa', 3, '10', 'middle back'],
        ['Face pull', 3, '15', 'shoulders'],
        ['Rosca inclinada alternada', 3, '10', 'biceps'],
        ['Rosca martelo', 3, '12', 'biceps'],
      ]),
      day('adv_ppl6', 'Legs', [2, 5], [
        ['Agachamento livre', 4, '6', 'quadriceps'],
        ['Stiff', 3, '8', 'hamstrings'],
        ['Hack squat', 3, '10', 'quadriceps'],
        ['Cadeira flexora', 3, '12', 'hamstrings'],
        ['Cadeira extensora', 3, '12', 'quadriceps'],
        ['Panturrilha em pé', 4, '15', 'calves'],
      ]),
    ],
  },
  {
    id: 'adv_ul',
    level: 'advanced',
    name: 'Upper / Lower 4x',
    description: '4 days/week: heavy compound lifts, upper Mon + Thu, lower Tue + Fri.',
    days: [
      day('adv_ul', 'Upper', [0, 3], [
        ['Supino com halteres', 4, '8', 'chest'],
        ['Barra fixa', 4, '8', 'lats'],
        ['Desenvolvimento com halteres', 3, '10', 'shoulders'],
        ['Remada curvada', 3, '8', 'middle back'],
        ['Rosca inclinada alternada', 3, '10', 'biceps'],
        ['Tríceps corda', 3, '12', 'triceps'],
      ]),
      day('adv_ul', 'Lower', [1, 4], [
        ['Agachamento livre', 4, '6', 'quadriceps'],
        ['Levantamento terra romeno', 3, '8', 'hamstrings'],
        ['Leg press', 3, '12', 'quadriceps'],
        ['Cadeira flexora', 3, '12', 'hamstrings'],
        ['Panturrilha em pé', 4, '15', 'calves'],
      ]),
    ],
  },
  {
    id: 'adv_abcde',
    level: 'advanced',
    name: 'ABCDE 5x',
    description: '5 days/week, one muscle group per day (bro split).',
    days: [
      day('adv_abcde', 'A – Chest', [0], [
        ['Supino com halteres', 4, '8', 'chest'],
        ['Supino inclinado', 4, '10', 'chest'],
        ['Crucifixo', 3, '12', 'chest'],
        ['Crossover', 3, '15', 'chest'],
      ]),
      day('adv_abcde', 'B – Back', [1], [
        ['Barra fixa', 4, '8', 'lats'],
        ['Remada curvada', 4, '8', 'middle back'],
        ['Remada baixa', 3, '10', 'middle back'],
        ['Puxada alta', 3, '12', 'lats'],
      ]),
      day('adv_abcde', 'C – Legs', [2], [
        ['Agachamento livre', 4, '6', 'quadriceps'],
        ['Hack squat', 3, '10', 'quadriceps'],
        ['Stiff', 3, '8', 'hamstrings'],
        ['Cadeira flexora', 3, '12', 'hamstrings'],
        ['Panturrilha em pé', 4, '15', 'calves'],
      ]),
      day('adv_abcde', 'D – Shoulders', [3], [
        ['Desenvolvimento militar', 4, '8', 'shoulders'],
        ['Elevação lateral', 4, '12', 'shoulders'],
        ['Crucifixo inverso', 3, '15', 'shoulders'],
        ['Encolhimento com halteres', 3, '12', 'traps'],
      ]),
      day('adv_abcde', 'E – Arms', [4], [
        ['Rosca inclinada alternada', 4, '10', 'biceps'],
        ['Rosca martelo', 3, '12', 'biceps'],
        ['Tríceps francês', 4, '10', 'triceps'],
        ['Tríceps corda', 3, '12', 'triceps'],
      ]),
    ],
  },
];
