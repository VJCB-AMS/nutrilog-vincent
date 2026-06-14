import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pkg from 'pg';
import Anthropic from '@anthropic-ai/sdk';

const { Pool } = pkg;
dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);
console.log(`[startup] process.env.PORT=${process.env.PORT} → listening on ${PORT}`);

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function buildPoolConfig() {
  const url = process.env.DATABASE_URL;
  const pgHost = process.env.PGHOST;

  // Prefer DATABASE_URL if it points somewhere non-local
  if (url && !url.includes('localhost') && !url.includes('127.0.0.1')) {
    const masked = url.replace(/:([^:@]+)@/, ':****@');
    console.log(`[db] Using DATABASE_URL: ${masked}`);
    return { connectionString: url, ssl: { rejectUnauthorized: false } };
  }

  // Fall back to individual PG vars (Railway also injects these)
  if (pgHost && pgHost !== 'localhost' && pgHost !== '127.0.0.1') {
    console.log(`[db] Using PG vars — host=${pgHost} port=${process.env.PGPORT} db=${process.env.PGDATABASE}`);
    return {
      host: pgHost,
      port: parseInt(process.env.PGPORT || '5432', 10),
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      database: process.env.PGDATABASE,
      ssl: { rejectUnauthorized: false },
    };
  }

  console.log('[db] No remote DB found — using local PostgreSQL');
  return { connectionString: url || 'postgresql://localhost:5432/nutrilog' };
}

const pool = new Pool(buildPoolConfig());

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS entries (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      name TEXT NOT NULL,
      calories REAL NOT NULL DEFAULT 0,
      protein REAL NOT NULL DEFAULT 0,
      carbs REAL NOT NULL DEFAULT 0,
      fat REAL NOT NULL DEFAULT 0,
      amount TEXT NOT NULL DEFAULT '1 serving',
      meal_type TEXT NOT NULL DEFAULT 'lunch',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

function mapRow(row) {
  return {
    id: row.id,
    date: row.date,
    name: row.name,
    calories: row.calories,
    protein: row.protein,
    carbs: row.carbs,
    fat: row.fat,
    amount: row.amount,
    mealType: row.meal_type,
    createdAt: row.created_at,
  };
}

// FRONTEND_URL can be a single URL or comma-separated list (e.g. Vercel prod + preview)
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map(s => s.trim())
  : null;
console.log('[cors] allowed origins:', allowedOrigins ?? '*');

app.use(cors({
  origin: allowedOrigins
    ? (origin, cb) => {
        if (!origin || allowedOrigins.some(o => origin === o || origin.endsWith('.vercel.app'))) {
          cb(null, true);
        } else {
          cb(new Error(`CORS: origin ${origin} not allowed`));
        }
      }
    : '*',
}));
app.use(express.json({ limit: '20mb' }));

app.get('/', (_req, res) => res.json({ status: 'ok' }));
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// GET entries for a date
app.get('/api/entries/:date', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM entries WHERE date = $1 ORDER BY created_at ASC',
      [req.params.date]
    );
    res.json(result.rows.map(mapRow));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// GET weekly entries (last 7 days)
app.get('/api/entries/week/:date', async (req, res) => {
  try {
    const end = req.params.date;
    const start = new Date(end);
    start.setDate(start.getDate() - 6);
    const startStr = start.toISOString().slice(0, 10);
    const result = await pool.query(
      'SELECT * FROM entries WHERE date >= $1 AND date <= $2 ORDER BY date ASC, created_at ASC',
      [startStr, end]
    );
    res.json(result.rows.map(mapRow));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// POST new entry
app.post('/api/entries', async (req, res) => {
  try {
    const { date, name, calories, protein, carbs, fat, amount, mealType } = req.body;
    const id = Date.now().toString();
    const result = await pool.query(
      `INSERT INTO entries (id, date, name, calories, protein, carbs, fat, amount, meal_type)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [id, date, name, calories, protein, carbs, fat, amount, mealType]
    );
    res.json(mapRow(result.rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// PUT update entry
app.put('/api/entries/:id', async (req, res) => {
  try {
    const { name, calories, protein, carbs, fat, amount, mealType, date } = req.body;
    const result = await pool.query(
      `UPDATE entries SET name=$1, calories=$2, protein=$3, carbs=$4, fat=$5,
       amount=$6, meal_type=$7, date=$8 WHERE id=$9 RETURNING *`,
      [name, calories, protein, carbs, fat, amount, mealType, date, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(mapRow(result.rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// DELETE entry
app.delete('/api/entries/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM entries WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// AI: parse text food log
app.post('/api/ai/parse-food', async (req, res) => {
  const { text, mealType } = req.body;
  console.log(`[parse-food] received: "${text}" (default meal: ${mealType})`);
  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: `You are a precise nutritional analysis assistant for a Dutch user based in the Netherlands/Europe.

Parse this food description and return a JSON array of individual food items with accurate nutritional data.

Food description: "${text}"
Default meal type (fallback if not specified): ${mealType}

## REFERENCE DATABASE PRIORITY
Use this priority order for nutritional values:
1. NEVO (Dutch/EU nutritional database) — primary source for whole foods, dairy, meat, vegetables, Dutch products
2. Open Food Facts — for branded/packaged products
3. USDA FoodData Central — fallback for American products or travel situations
When unsure, use the most commonly cited value across sources and flag with medium/low confidence.

## EUROPEAN & DUTCH FOOD KNOWLEDGE
Apply EU-standard portions and compositions:
- Dutch dairy: whole milk = 3.5% fat, kwark (low-fat quark) ≈ 67 kcal/100g (11g protein, 4g carbs, 0.2g fat), skyr ≈ 65 kcal/100g (11g protein, 4g carbs, 0g fat)
- Filet américain (raw beef spread) ≈ 190 kcal/100g, 14g protein, 2g carbs, 14g fat
- Stroopwafel (one wafel, 25g) ≈ 110 kcal, 1g protein, 16g carbs, 4g fat
- Hagelslag (chocolate sprinkles, 1 tbsp/10g) ≈ 50 kcal, 0.5g protein, 7g carbs, 2g fat
- Rookworst (smoked sausage, 100g) ≈ 285 kcal, 14g protein, 2g carbs, 25g fat
- Canelé (one, 60g) ≈ 200 kcal, 4g protein, 32g carbs, 7g fat
- Baguette (100g) ≈ 270 kcal, 9g protein, 54g carbs, 2g fat
- Croque monsieur ≈ 430 kcal, 24g protein, 35g carbs, 20g fat
- EU pasta portions: 80g dry per serving (not 100g as in US)
- EU bread slice: typically 35g (not 25–28g as in US)

## PORTION SIZING
- Slightly overestimate rather than underestimate (real portions tend to be larger than listed)
- Restaurant/dining out: portions are typically 20–30% larger than home portions; note this in the name
- Home-cooked default unless restaurant context is mentioned

## MEAL ASSIGNMENT
Detect meal from text context:
- "Breakfast:" / morning / AM → "breakfast"
- "Lunch:" / midday / noon → "lunch"
- "Dinner:" / evening / supper → "dinner"
- "Snack:" / tussendoor → "snacks"
- No context → use default: "${mealType}"

## TRAVEL / RESTAURANT FLAG
If the text mentions a restaurant, dining out, a foreign country, or unfamiliar cuisine — add " (restaurant est.)" to the item name.

Return ONLY a valid JSON array (no markdown, no explanation):
[
  {
    "name": "food name",
    "calories": number,
    "protein": number,
    "carbs": number,
    "fat": number,
    "amount": "serving description with weight where possible (e.g. '200g', '1 slice (35g)')",
    "mealType": "breakfast|lunch|dinner|snacks",
    "confidence": "high|medium|low"
  }
]

Confidence guide: high = exact NEVO/branded match; medium = close match or common food; low = unfamiliar/regional/estimated.`
        }
      ]
    });

    const textContent = message.content.find(b => b.type === 'text');
    const jsonText = textContent?.text?.trim() || '[]';
    const cleaned = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);
    const result = Array.isArray(parsed) ? parsed : [parsed];
    console.log(`[parse-food] returning ${result.length} item(s)`);
    res.json(result);
  } catch (err) {
    console.error('[parse-food] error:', err.message);
    res.status(500).json({ error: 'Failed to parse food', detail: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`NutriLog backend running on 0.0.0.0:${PORT}`);
  initDB()
    .then(() => console.log('[db] Table ready'))
    .catch(err => console.error('[db] Init failed:', err.message));
});
