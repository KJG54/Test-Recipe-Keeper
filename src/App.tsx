import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  createRecipe,
  deleteRecipe,
  emptyRecipeDraft,
  listRecipes,
  Recipe,
  RecipeDraft,
  updateRecipe,
} from "./data/recipes";
import "./App.css";

type EditorMode = "view" | "edit";

function createEmptyDraft(): RecipeDraft {
  return {
    ...emptyRecipeDraft,
    ingredients: [""],
    steps: [""],
    tags: [],
  };
}

function draftFromRecipe(recipe: Recipe): RecipeDraft {
  return {
    title: recipe.title,
    photoPath: recipe.photoPath,
    ingredients: recipe.ingredients.length ? recipe.ingredients : [""],
    steps: recipe.steps.length ? recipe.steps : [""],
    prepTimeMinutes: recipe.prepTimeMinutes,
    cookTimeMinutes: recipe.cookTimeMinutes,
    servings: recipe.servings,
    tags: recipe.tags,
    cuisine: recipe.cuisine,
    difficulty: recipe.difficulty,
    notes: recipe.notes,
    nutrition: recipe.nutrition,
    sourceUrl: recipe.sourceUrl,
  };
}

function listToText(items: string[]) {
  return items.join("\n");
}

function textToList(value: string) {
  return value.split("\n");
}

function tagsToText(tags: string[]) {
  return tags.join(",");
}

function textToTags(value: string) {
  return value.split(",");
}

function readMinutes(value: string) {
  if (!value.trim()) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function formatUpdatedAt(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function RecipeDetail({ recipe }: { recipe: Recipe }) {
  const quickFacts = [
    recipe.prepTimeMinutes ? `${recipe.prepTimeMinutes} min prep` : "",
    recipe.cookTimeMinutes ? `${recipe.cookTimeMinutes} min cook` : "",
    recipe.servings ? `${recipe.servings} servings` : "",
    recipe.difficulty,
    recipe.cuisine,
  ].filter(Boolean);

  return (
    <article className="recipe-detail">
      <header className="detail-title-block">
        <p className="eyebrow">Saved recipe</p>
        <h2>{recipe.title}</h2>
        <p className="muted">Updated {formatUpdatedAt(recipe.updatedAt)}</p>
      </header>

      {quickFacts.length ? (
        <div className="chip-row" aria-label="Recipe details">
          {quickFacts.map((fact) => (
            <span className="chip" key={fact}>
              {fact}
            </span>
          ))}
        </div>
      ) : null}

      {recipe.tags.length ? (
        <div className="chip-row" aria-label="Recipe tags">
          {recipe.tags.map((tag) => (
            <span className="chip quiet-chip" key={tag}>
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      {recipe.photoPath ? (
        <section className="detail-section">
          <h3>Photo</h3>
          <p>{recipe.photoPath}</p>
        </section>
      ) : null}

      <div className="detail-columns">
        <section className="detail-section">
          <h3>Ingredients</h3>
          {recipe.ingredients.length ? (
            <ul className="ingredient-list">
              {recipe.ingredients.map((ingredient, index) => (
                <li key={`${ingredient}-${index}`}>{ingredient}</li>
              ))}
            </ul>
          ) : (
            <p className="muted">No ingredients added yet.</p>
          )}
        </section>

        <section className="detail-section">
          <h3>Steps</h3>
          {recipe.steps.length ? (
            <ol className="step-list">
              {recipe.steps.map((step, index) => (
                <li key={`${step}-${index}`}>{step}</li>
              ))}
            </ol>
          ) : (
            <p className="muted">No steps added yet.</p>
          )}
        </section>
      </div>

      {recipe.notes ? (
        <section className="detail-section">
          <h3>Notes</h3>
          <p>{recipe.notes}</p>
        </section>
      ) : null}

      {recipe.nutrition ? (
        <section className="detail-section">
          <h3>Nutrition</h3>
          <p>{recipe.nutrition}</p>
        </section>
      ) : null}

      {recipe.sourceUrl ? (
        <section className="detail-section">
          <h3>Source</h3>
          <a href={recipe.sourceUrl}>{recipe.sourceUrl}</a>
        </section>
      ) : null}
    </article>
  );
}

function App() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [draft, setDraft] = useState<RecipeDraft>(() => createEmptyDraft());
  const [editorMode, setEditorMode] = useState<EditorMode>("edit");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selectedRecipe = useMemo(
    () => recipes.find((recipe) => recipe.id === selectedId) ?? null,
    [recipes, selectedId],
  );

  const refreshRecipes = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const nextRecipes = await listRecipes(searchTerm);
      setRecipes(nextRecipes);
      setSelectedId((currentId) => {
        if (currentId && nextRecipes.some((recipe) => recipe.id === currentId)) {
          return currentId;
        }

        return nextRecipes[0]?.id ?? null;
      });
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Recipe storage could not be loaded.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    void refreshRecipes();
  }, [refreshRecipes]);

  useEffect(() => {
    if (selectedRecipe) {
      setDraft(draftFromRecipe(selectedRecipe));
      return;
    }

    if (!isLoading) {
      setDraft(createEmptyDraft());
    }
  }, [isLoading, selectedRecipe]);

  function updateDraft(changes: Partial<RecipeDraft>) {
    setDraft((currentDraft) => ({ ...currentDraft, ...changes }));
  }

  function handleNewRecipe() {
    setSelectedId(null);
    setDraft(createEmptyDraft());
    setEditorMode("edit");
    setMessage("");
    setError("");
  }

  function handleSelectRecipe(id: number) {
    setSelectedId(id);
    setEditorMode("view");
    setMessage("");
    setError("");
  }

  function handleEditRecipe() {
    if (selectedRecipe) {
      setDraft(draftFromRecipe(selectedRecipe));
    }

    setEditorMode("edit");
    setMessage("");
    setError("");
  }

  function handleCancelEdit() {
    if (selectedRecipe) {
      setDraft(draftFromRecipe(selectedRecipe));
      setEditorMode("view");
      setError("");
      return;
    }

    handleNewRecipe();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!draft.title.trim()) {
      setError("Add a recipe title before saving.");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      if (selectedRecipe) {
        await updateRecipe(selectedRecipe.id, draft);
        setMessage("Recipe updated.");
      } else {
        const newRecipeId = await createRecipe(draft);
        setSelectedId(newRecipeId);
        setMessage("Recipe saved.");
      }

      await refreshRecipes();
      setEditorMode("view");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "The recipe could not be saved.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!selectedRecipe) {
      return;
    }

    const shouldDelete = window.confirm(`Delete "${selectedRecipe.title}"?`);
    if (!shouldDelete) {
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      await deleteRecipe(selectedRecipe.id);
      setMessage("Recipe deleted.");
      await refreshRecipes();
      setEditorMode("view");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "The recipe could not be deleted.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="Recipe library">
        <div className="brand-block">
          <p className="eyebrow">Local recipes</p>
          <h1>Recipe Keeper</h1>
        </div>

        <label className="search-field">
          <span>Search</span>
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Title or tag"
            type="search"
          />
        </label>

        <button
          type="button"
          className="primary-action"
          onClick={handleNewRecipe}
        >
          New recipe
        </button>

        <section className="recipe-list" aria-label="Saved recipes">
          {isLoading ? (
            <p className="muted">Loading recipes...</p>
          ) : recipes.length ? (
            recipes.map((recipe) => (
              <button
                type="button"
                className={
                  recipe.id === selectedId
                    ? "recipe-list-item active"
                    : "recipe-list-item"
                }
                key={recipe.id}
                onClick={() => handleSelectRecipe(recipe.id)}
              >
                <span>{recipe.title}</span>
                <small>
                  {recipe.tags.length ? recipe.tags.slice(0, 3).join(", ") : "No tags"}
                </small>
              </button>
            ))
          ) : (
            <div className="empty-list">
              <strong>No recipes yet</strong>
              <p>Add your first recipe and it will stay local on this computer.</p>
            </div>
          )}
        </section>
      </aside>

      <section className="workspace" aria-label="Recipe workspace">
        {selectedRecipe && editorMode === "view" ? (
          <div className="recipe-reader">
            <header className="editor-header">
              <div />
              <div className="editor-actions">
                <button
                  className="secondary-action danger-action"
                  disabled={isSaving}
                  onClick={handleDelete}
                  type="button"
                >
                  Delete
                </button>
                <button
                  className="primary-action compact"
                  onClick={handleEditRecipe}
                  type="button"
                >
                  Edit
                </button>
              </div>
            </header>

            {message ? <p className="status-message">{message}</p> : null}
            {error ? <p className="error-message">{error}</p> : null}

            <RecipeDetail recipe={selectedRecipe} />
          </div>
        ) : (
          <form className="recipe-editor" onSubmit={handleSubmit}>
          <header className="editor-header">
            <div>
              <p className="eyebrow">
                {selectedRecipe ? "Editing recipe" : "New recipe"}
              </p>
              <h2>{draft.title || "Untitled recipe"}</h2>
              {selectedRecipe ? (
                <p className="muted">
                  Updated {formatUpdatedAt(selectedRecipe.updatedAt)}
                </p>
              ) : null}
            </div>

            <div className="editor-actions">
              {selectedRecipe ? (
                <button
                  className="secondary-action danger-action"
                  disabled={isSaving}
                  onClick={handleDelete}
                  type="button"
                >
                  Delete
                </button>
              ) : null}
              <button className="primary-action compact" disabled={isSaving} type="submit">
                {isSaving ? "Saving..." : "Save"}
              </button>
              <button
                className="secondary-action"
                disabled={isSaving}
                onClick={handleCancelEdit}
                type="button"
              >
                Cancel
              </button>
            </div>
          </header>

          {message ? <p className="status-message">{message}</p> : null}
          {error ? <p className="error-message">{error}</p> : null}

          <div className="field-grid">
            <label className="field full-width">
              <span>Title</span>
              <input
                value={draft.title}
                onChange={(event) => updateDraft({ title: event.target.value })}
                placeholder="Sunday tomato sauce"
              />
            </label>

            <label className="field">
              <span>Prep time</span>
              <input
                min="0"
                onChange={(event) =>
                  updateDraft({ prepTimeMinutes: readMinutes(event.target.value) })
                }
                placeholder="15"
                type="number"
                value={draft.prepTimeMinutes ?? ""}
              />
            </label>

            <label className="field">
              <span>Cook time</span>
              <input
                min="0"
                onChange={(event) =>
                  updateDraft({ cookTimeMinutes: readMinutes(event.target.value) })
                }
                placeholder="45"
                type="number"
                value={draft.cookTimeMinutes ?? ""}
              />
            </label>

            <label className="field">
              <span>Servings</span>
              <input
                value={draft.servings}
                onChange={(event) => updateDraft({ servings: event.target.value })}
                placeholder="4"
              />
            </label>

            <label className="field">
              <span>Difficulty</span>
              <select
                value={draft.difficulty}
                onChange={(event) => updateDraft({ difficulty: event.target.value })}
              >
                <option value="">Not set</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </label>

            <label className="field">
              <span>Cuisine</span>
              <input
                value={draft.cuisine}
                onChange={(event) => updateDraft({ cuisine: event.target.value })}
                placeholder="Italian"
              />
            </label>

            <label className="field">
              <span>Tags</span>
              <input
                value={tagsToText(draft.tags)}
                onChange={(event) => updateDraft({ tags: textToTags(event.target.value) })}
                placeholder="dinner, cozy, make-ahead"
              />
            </label>

            <label className="field full-width">
              <span>Photo path or note</span>
              <input
                value={draft.photoPath}
                onChange={(event) => updateDraft({ photoPath: event.target.value })}
                placeholder="Optional local file path or reminder"
              />
            </label>

            <label className="field full-width">
              <span>Ingredients</span>
              <textarea
                rows={8}
                value={listToText(draft.ingredients)}
                onChange={(event) =>
                  updateDraft({ ingredients: textToList(event.target.value) })
                }
                placeholder={"1 cup flour\n2 eggs\nPinch of salt"}
              />
            </label>

            <label className="field full-width">
              <span>Steps</span>
              <textarea
                rows={8}
                value={listToText(draft.steps)}
                onChange={(event) => updateDraft({ steps: textToList(event.target.value) })}
                placeholder={"Mix ingredients\nBake until golden\nLet cool before serving"}
              />
            </label>

            <label className="field full-width">
              <span>Notes</span>
              <textarea
                rows={4}
                value={draft.notes}
                onChange={(event) => updateDraft({ notes: event.target.value })}
                placeholder="Tweaks, substitutions, family notes, or timing reminders"
              />
            </label>

            <label className="field full-width">
              <span>Nutrition</span>
              <textarea
                rows={3}
                value={draft.nutrition}
                onChange={(event) => updateDraft({ nutrition: event.target.value })}
                placeholder="Optional manual nutrition notes"
              />
            </label>

            <label className="field full-width">
              <span>Source URL</span>
              <input
                value={draft.sourceUrl}
                onChange={(event) => updateDraft({ sourceUrl: event.target.value })}
                placeholder="https://example.com/recipe"
                type="url"
              />
            </label>
          </div>
        </form>
        )}
      </section>
    </main>
  );
}

export default App;
