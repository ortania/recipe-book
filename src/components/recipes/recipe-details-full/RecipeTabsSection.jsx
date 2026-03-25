import { List, ListOrdered, Lightbulb, MessageCircle, Video } from "lucide-react";
import ChatWindow from "../../chat/ChatWindow";
import { CommentsSection } from "../../comments-section";
import { useRecipeDetails } from "../RecipeDetailsContext";
import { isGroupHeader, getGroupName } from "../../../utils/ingredientUtils";

export default function RecipeTabsSection() {
  const {
    activeTab, setActiveTab, recipe, touchRef, handleTabSwipe,
    ingredientsArray, scale, checkedIngredients, toggleIngredient,
    instructionsArray, checkedInstructions, toggleInstruction,
    chatMessages, setChatMessages, chatAppliedFields, setChatAppliedFields,
    onSaveRecipe, originalRecipe, servings,
    tabsRef,
    classes, buttonClasses, t,
  } = useRecipeDetails();

  return (
    <>
      <div ref={tabsRef} className={classes.tabs}>
        <button
          className={`${classes.tab} ${activeTab === "ingredients" ? classes.activeTab : ""}`}
          onClick={() => setActiveTab("ingredients")}
        >
          <List className={classes.tabIcon} size={18} />
          {t("recipes", "ingredients")}
        </button>
        <button
          className={`${classes.tab} ${activeTab === "instructions" ? classes.activeTab : ""}`}
          onClick={() => setActiveTab("instructions")}
        >
          <ListOrdered className={classes.tabIcon} size={18} />
          {t("recipes", "instructions")}
        </button>
        {recipe.notes && (
          <button
            className={`${classes.tab} ${activeTab === "tips" ? classes.activeTab : ""}`}
            onClick={() => setActiveTab("tips")}
          >
            <Lightbulb className={classes.tabIcon} size={18} />
            {t("recipes", "notes")}
          </button>
        )}
        <button
          className={`${classes.tab} ${activeTab === "chat" ? classes.activeTab : ""}`}
          onClick={() => setActiveTab("chat")}
        >
          <MessageCircle className={classes.tabIcon} size={18} />
          {t("recipeChat", "tabLabel")}
        </button>
      </div>

      <div
        className={classes.tabContent}
        onTouchStart={(e) => {
          touchRef.current.startX = e.touches[0].clientX;
          touchRef.current.startY = e.touches[0].clientY;
        }}
        onTouchEnd={handleTabSwipe}
      >
        {activeTab === "ingredients" && (
          <ul className={classes.ingredientsList}>
            {ingredientsArray.length > 0 ? (
              ingredientsArray.map((ingredient, index) =>
                isGroupHeader(ingredient) ? (
                  <li key={index} className={classes.ingredientGroupHeader}>
                    {getGroupName(ingredient)}
                  </li>
                ) : (
                  <li key={index} className={classes.ingredientItem}>
                    <label className={classes.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={checkedIngredients[index] || false}
                        onChange={() => toggleIngredient(index)}
                        className={
                          classes.checkbox + " " + buttonClasses.checkBox
                        }
                      />
                      <span
                        className={
                          checkedIngredients[index] ? classes.checkedText : ""
                        }
                      >
                        {scale(ingredient)}
                      </span>
                    </label>
                  </li>
                ),
              )
            ) : (
              <p>{t("recipes", "noIngredientsListed")}</p>
            )}
          </ul>
        )}

        {activeTab === "instructions" && (
          <>
            <ol className={classes.instructionsList}>
              {instructionsArray.length > 0 ? (
                instructionsArray.map((instruction, index) => (
                  <li key={index} className={classes.instructionItem}>
                    <label className={classes.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={checkedInstructions[index] || false}
                        onChange={() => toggleInstruction(index)}
                        className={
                          classes.checkbox + " " + buttonClasses.checkBox
                        }
                      />
                      <span
                        className={
                          checkedInstructions[index] ? classes.checkedText : ""
                        }
                      >
                        {instruction}
                      </span>
                    </label>
                  </li>
                ))
              ) : (
                <p>{t("recipes", "noInstructionsListed")}</p>
              )}
            </ol>
            {recipe.videoUrl && (
              <a
                href={recipe.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={classes.videoLink}
              >
                <Video size={18} />
                {t("recipes", "watchVideo")}
              </a>
            )}
          </>
        )}

        {activeTab === "tips" && recipe.notes && (
          <div className={classes.notesContent}>
            <p className={classes.notesText}>{recipe.notes}</p>
          </div>
        )}

        {activeTab === "chat" && (
          <ChatWindow
            recipe={recipe}
            servings={servings}
            messages={chatMessages}
            onMessagesChange={setChatMessages}
            appliedFields={chatAppliedFields}
            onAppliedFieldsChange={setChatAppliedFields}
            onUpdateRecipe={
              onSaveRecipe
                ? (changes) => {
                    const base = originalRecipe || recipe;
                    const updated = { ...base, ...changes };
                    onSaveRecipe(updated);
                  }
                : undefined
            }
          />
        )}
      </div>

      {activeTab !== "chat" && <CommentsSection recipeId={recipe.id} />}
    </>
  );
}
