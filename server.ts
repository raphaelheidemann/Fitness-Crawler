import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

const EXERCISE_DB_JSON_URL =
  'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';
const EXERCISE_DB_IMG_BASE =
  'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises';

interface NormalizedExercise {
  id: string;
  name: string;
  muscleGroup: string;
  secondaryMuscles: string[];
  equipment: string;
  level: string;
  category: string;
  images: string[];
  instructions: string[];
}

let cachedExercises: NormalizedExercise[] | null = null;
let cachedAt = 0;
const CACHE_TTL_MS = 1000 * 60 * 60 * 12;

async function loadExerciseCatalog(): Promise<NormalizedExercise[]> {
  if (cachedExercises && Date.now() - cachedAt < CACHE_TTL_MS) {
    return cachedExercises;
  }

  const res = await fetch(EXERCISE_DB_JSON_URL);
  if (!res.ok) {
    throw new Error(`Exercise database fetch failed with HTTP ${res.status}`);
  }
  const raw = (await res.json()) as Array<{
    id?: string;
    name?: string;
    primaryMuscles?: string[];
    secondaryMuscles?: string[];
    equipment?: string | null;
    level?: string;
    category?: string;
    images?: string[];
    instructions?: string[];
  }>;

  const normalized: NormalizedExercise[] = raw
    .filter((item) => item && item.name && Array.isArray(item.primaryMuscles) && item.primaryMuscles.length > 0)
    .map((item) => ({
      id: String(item.id || item.name),
      name: String(item.name),
      muscleGroup: String(item.primaryMuscles![0] || 'other').toLowerCase(),
      secondaryMuscles: Array.isArray(item.secondaryMuscles)
        ? item.secondaryMuscles.map((m) => String(m).toLowerCase())
        : [],
      equipment: item.equipment ? String(item.equipment) : 'body only',
      level: item.level ? String(item.level) : 'intermediate',
      category: item.category ? String(item.category) : 'strength',
      images: Array.isArray(item.images)
        ? item.images.map((rel) => `${EXERCISE_DB_IMG_BASE}/${String(rel).replace(/^\/+/, '')}`)
        : [],
      instructions: Array.isArray(item.instructions)
        ? item.instructions.slice(0, 8).map((s) => String(s))
        : [],
    }));

  cachedExercises = normalized;
  cachedAt = Date.now();
  return normalized;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/exercises', async (req, res) => {
    try {
      const catalog = await loadExerciseCatalog();
      const muscleFilter = typeof req.query.muscle === 'string' ? req.query.muscle.trim().toLowerCase() : '';
      const searchQ = typeof req.query.q === 'string' ? req.query.q.trim().toLowerCase() : '';

      const muscles = Array.from(new Set(catalog.map((e) => e.muscleGroup))).sort();
      let filtered = catalog;
      if (muscleFilter && muscleFilter !== 'all') {
        filtered = filtered.filter(
          (e) =>
            e.muscleGroup === muscleFilter ||
            e.secondaryMuscles.includes(muscleFilter)
        );
      }
      if (searchQ) {
        filtered = filtered.filter(
          (e) =>
            e.name.toLowerCase().includes(searchQ) ||
            e.equipment.toLowerCase().includes(searchQ) ||
            e.muscleGroup.toLowerCase().includes(searchQ)
        );
      }

      res.json({
        total: filtered.length,
        muscles,
        exercises: filtered,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to load exercise database.';
      res.status(502).json({ error: msg });
    }
  });

  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'API endpoint not found.' });
  });

  app.use(
    (
      err: unknown,
      req: express.Request,
      res: express.Response,
      next: express.NextFunction
    ) => {
      if (req.path.startsWith('/api')) {
        const message = err instanceof Error ? err.message : 'Unexpected server error.';
        res.status(500).json({ error: message });
        return;
      }
      next(err);
    }
  );

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      const indexFile = path.join(distDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build output not found.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

void startServer();
