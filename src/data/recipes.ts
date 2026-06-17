import Database from "@tauri-apps/plugin-sql";

const DATABASE_URL = "sqlite:recipe_keeper.db";

type RecipeRow = {
  id: number;
  title: string;
  photo_path: string | null;
  ingredients: string;
  steps: string;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  servings: string | null;
  tags: string;
  cuisine: string | null;
  difficulty: string | null;
  notes: string | null;
  nutrition: string | null;
  source_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Recipe = {
  id: number;
  title: string;
  photoPath: string;
  ingredients: string[];
  steps: string[];
  prepTimeMinutes: number | null;
  cookTimeMinutes: number | null;
  servings: string;
  tags: string[];
  cuisine: string;
  difficulty: string;
  notes: string;
  nutrition: string;
  sourceUrl: string;
  createdAt: string;
  updatedAt: string;
};

export type RecipeDraft = Omit<Recipe, "id" | "createdAt" | "updatedAt">;

let databasePromise: Promise<Database> | null = null;

function getDatabase() {
  databasePromise ??= Database.load(DATABASE_URL);
  return databasePromise;
}

function parseJsonList(value: string) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function toRecipe(row: RecipeRow): Recipe {
  return {
    id: row.id,
    title: row.title,
    photoPath: row.photo_path ?? "",
    ingredients: parseJsonList(row.ingredients),
    steps: parseJsonList(row.steps),
    prepTimeMinutes: row.prep_time_minutes,
    cookTimeMinutes: row.cook_time_minutes,
    servings: row.servings ?? "",
    tags: parseJsonList(row.tags),
    cuisine: row.cuisine ?? "",
    difficulty: row.difficulty ?? "",
    notes: row.notes ?? "",
    nutrition: row.nutrition ?? "",
    sourceUrl: row.source_url ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizeDraft(draft: RecipeDraft) {
  return {
    ...draft,
    title: draft.title.trim(),
    photoPath: draft.photoPath.trim(),
    ingredients: draft.ingredients.map((item) => item.trim()).filter(Boolean),
    steps: draft.steps.map((item) => item.trim()).filter(Boolean),
    servings: draft.servings.trim(),
    tags: draft.tags.map((item) => item.trim()).filter(Boolean),
    cuisine: draft.cuisine.trim(),
    difficulty: draft.difficulty.trim(),
    notes: draft.notes.trim(),
    nutrition: draft.nutrition.trim(),
    sourceUrl: draft.sourceUrl.trim(),
  };
}

export const emptyRecipeDraft: RecipeDraft = {
  title: "",
  photoPath: "",
  ingredients: [""],
  steps: [""],
  prepTimeMinutes: null,
  cookTimeMinutes: null,
  servings: "",
  tags: [],
  cuisine: "",
  difficulty: "",
  notes: "",
  nutrition: "",
  sourceUrl: "",
};

export async function listRecipes(searchTerm = "") {
  const db = await getDatabase();
  const trimmedSearch = searchTerm.trim();
  const rows = trimmedSearch
    ? await db.select<RecipeRow[]>(
        `SELECT * FROM recipes
         WHERE title LIKE $1 OR tags LIKE $1
         ORDER BY updated_at DESC`,
        [`%${trimmedSearch}%`],
      )
    : await db.select<RecipeRow[]>(
        "SELECT * FROM recipes ORDER BY updated_at DESC",
      );

  return rows.map(toRecipe);
}

export async function createRecipe(draft: RecipeDraft) {
  const db = await getDatabase();
  const recipe = normalizeDraft(draft);
  const now = new Date().toISOString();

  const result = await db.execute(
    `INSERT INTO recipes (
      title,
      photo_path,
      ingredients,
      steps,
      prep_time_minutes,
      cook_time_minutes,
      servings,
      tags,
      cuisine,
      difficulty,
      notes,
      nutrition,
      source_url,
      created_at,
      updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
    [
      recipe.title,
      recipe.photoPath || null,
      JSON.stringify(recipe.ingredients),
      JSON.stringify(recipe.steps),
      recipe.prepTimeMinutes,
      recipe.cookTimeMinutes,
      recipe.servings || null,
      JSON.stringify(recipe.tags),
      recipe.cuisine || null,
      recipe.difficulty || null,
      recipe.notes || null,
      recipe.nutrition || null,
      recipe.sourceUrl || null,
      now,
      now,
    ],
  );

  return Number(result.lastInsertId);
}

export async function updateRecipe(id: number, draft: RecipeDraft) {
  const db = await getDatabase();
  const recipe = normalizeDraft(draft);
  const now = new Date().toISOString();

  await db.execute(
    `UPDATE recipes SET
      title = $1,
      photo_path = $2,
      ingredients = $3,
      steps = $4,
      prep_time_minutes = $5,
      cook_time_minutes = $6,
      servings = $7,
      tags = $8,
      cuisine = $9,
      difficulty = $10,
      notes = $11,
      nutrition = $12,
      source_url = $13,
      updated_at = $14
    WHERE id = $15`,
    [
      recipe.title,
      recipe.photoPath || null,
      JSON.stringify(recipe.ingredients),
      JSON.stringify(recipe.steps),
      recipe.prepTimeMinutes,
      recipe.cookTimeMinutes,
      recipe.servings || null,
      JSON.stringify(recipe.tags),
      recipe.cuisine || null,
      recipe.difficulty || null,
      recipe.notes || null,
      recipe.nutrition || null,
      recipe.sourceUrl || null,
      now,
      id,
    ],
  );
}

export async function deleteRecipe(id: number) {
  const db = await getDatabase();
  await db.execute("DELETE FROM recipes WHERE id = $1", [id]);
}
