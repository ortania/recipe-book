import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lightbulb, Info, BookOpen, ChevronLeft, Plus, Loader2, Heart, Dumbbell, Zap, Baby, Leaf, WheatOff, Copy, Crown } from "lucide-react";
import { useChatWindow } from "./ChatWindowContext";
import { getFollowUpActions, getRecipeResultActions, filterRedundantActions } from "../../utils/chatIntents";
import { FEATURES } from "../../config/entitlements";
import useEntitlements from "../../hooks/useEntitlements";

const IDEA_CHIPS = [
  "ideaChip1", "ideaChip2", "ideaChip3", "ideaChip4",
  "ideaChip5", "ideaChip6", "ideaChip7", "ideaChip8",
];

function buildRecipeChips(recipe, recipeContext, t) {
  if (!recipeContext) return [];
  const chips = [];
  const name = recipeContext.name || "";
  const ings = recipeContext.ingredients || [];

  const pick = (arr) => arr.length > 0 ? arr[Math.floor(arr.length / 2)] : null;
  const randomIng = pick(ings.filter((x) => typeof x === "string" && x.trim()));

  if (randomIng) {
    const clean = randomIng.replace(/^[\d\s½¼¾⅓⅔.,/\-–]+/, "").trim();
    if (clean) chips.push(t("recipeChat", "suggestSubstituteFor").replace("{ing}", clean));
  }
  if (!chips.length) chips.push(t("recipeChat", "suggestSubstitute"));

  chips.push(t("recipeChat", "suggestHealthier"));

  if (name) {
    chips.push(t("recipeChat", "suggestTips").replace("{name}", name));
  } else {
    chips.push(t("recipeChat", "suggestDouble"));
  }

  return chips;
}

export default function ChatWindowMessages() {
  const {
    messages, isLoading, error, isRecipeMode,
    applyingIdx, customUpdateIdx, setCustomUpdateIdx,
    customUpdateText, setCustomUpdateText,
    appliedFields, userInitial,
    handleApplyUpdate, handleCreateVariation, handleChipClick,
    handleCreateRecipeFromName, loadingRecipeName,
    handleRecipeVariation, allRecipes,
    messagesEndRef, messagesAreaRef,
    recipe, recipeContext,
    classes, t,
  } = useChatWindow();
  const navigate = useNavigate();
  const { canUse } = useEntitlements();
  const [applyGateIdx, setApplyGateIdx] = useState(null);

  const handleGatedApply = (content, index, instruction) => {
    const check = canUse(FEATURES.APPLY_AI_SUGGESTION);
    if (!check.allowed) {
      setApplyGateIdx(index);
      return;
    }
    handleApplyUpdate(content, index, instruction);
  };

  const recipeChips = useMemo(
    () => (isRecipeMode ? buildRecipeChips(recipe, recipeContext, t) : []),
    [isRecipeMode, recipe, recipeContext, t],
  );

  return (
    <div className={classes.messagesArea} ref={messagesAreaRef}>
      {messages.length === 0 && (
        <div className={classes.ideasSection}>
          <h3 className={classes.ideasTitle}>
            {isRecipeMode ? (
              t("recipeChat", "emptyMessage")
            ) : (
              <>
                <Lightbulb size={18} style={{ verticalAlign: "middle", marginInlineEnd: "0.3rem" }} />
                {t("chat", "ideaTitle")}
              </>
            )}
          </h3>
          <p className={classes.ideasSubtitle}>
            {isRecipeMode ? (
              <>
                <Lightbulb size={18} style={{ verticalAlign: "middle", marginInlineEnd: "0.3rem" }} />
                {t("recipeChat", "updateHint")}
              </>
            ) : (
              t("chat", "ideaSubtitle")
            )}
          </p>
          <div className={classes.ideaChips}>
            {isRecipeMode
              ? recipeChips.map((text, i) => (
                  <button
                    key={i}
                    className={classes.ideaChip}
                    onClick={() => handleChipClick(text)}
                    disabled={isLoading}
                  >
                    {text}
                  </button>
                ))
              : IDEA_CHIPS.map((chipKey) => (
                  <button
                    key={chipKey}
                    className={classes.ideaChip}
                    onClick={() => handleChipClick(t("chat", chipKey))}
                    disabled={isLoading}
                  >
                    {t("chat", chipKey)}
                  </button>
                ))}
          </div>
        </div>
      )}

      {messages.map((message, index) => (
        <div
          key={index}
          className={`${classes.message} ${
            message.role === "user" ? classes.userMessage : classes.assistantMessage
          }`}
        >
          {message.role === "assistant" ? (
            <div className={classes.assistantBubbleGroup}>
              <div className={classes.bubble}>
                {message.image && (
                  <img src={message.image} alt="Uploaded food" className={classes.chatImage} />
                )}
                {message.content}

                {handleApplyUpdate && (
                  <div className={classes.applySection}>
                    {appliedFields[index] ? (
                      <div className={classes.updateSummary}>
                        {appliedFields[index]}
                        <div className={classes.autoUpdateNote}>
                          <Info size={14} />
                          {t("recipeChat", "autoUpdateNote")}
                        </div>
                      </div>
                    ) : (
                      <div className={classes.applyActions}>
                        {customUpdateIdx === index && (
                          <div className={classes.customUpdateWrap}>
                            <input
                              className={classes.customUpdateInput}
                              value={customUpdateText}
                              onChange={(e) => setCustomUpdateText(e.target.value)}
                              placeholder={t("recipeChat", "customUpdatePlaceholder")}
                              disabled={applyingIdx !== null}
                            />
                            <button
                              className={classes.customCancelBtn}
                              onClick={() => { setCustomUpdateIdx(null); setCustomUpdateText(""); }}
                            >
                              ✕
                            </button>
                          </div>
                        )}
                        <div className={classes.applyBtnRow}>
                          <button
                            className={classes.applyBtn}
                            onClick={() => handleGatedApply(
                              message.content, index,
                              customUpdateIdx === index && customUpdateText.trim() ? customUpdateText.trim() : undefined
                            )}
                            disabled={applyingIdx !== null || (customUpdateIdx === index && !customUpdateText.trim())}
                          >
                            {applyingIdx === index
                              ? t("recipeChat", "updating")
                              : t("recipeChat", "applyToRecipe")}
                          </button>
                          {handleCreateVariation && (
                            <button
                              className={classes.variationBtn}
                              onClick={() => handleCreateVariation(
                                message.content, index,
                                customUpdateIdx === index && customUpdateText.trim() ? customUpdateText.trim() : undefined
                              )}
                              disabled={applyingIdx !== null || (customUpdateIdx === index && !customUpdateText.trim())}
                            >
                              <Copy size={14} />
                              {applyingIdx === index
                                ? t("recipeChat", "updating")
                                : t("recipeChat", "createVariation")}
                            </button>
                          )}
                          {customUpdateIdx !== index && (
                            <button
                              className={classes.customChooseBtn}
                              onClick={() => { setCustomUpdateIdx(index); setCustomUpdateText(""); }}
                              disabled={applyingIdx !== null}
                            >
                              {t("recipeChat", "customUpdate")}
                            </button>
                          )}
                        </div>
                        {applyGateIdx === index && (
                          <div className={classes.applyGateHint}>
                            <Crown size={14} />
                            <span>{t("premium", "premiumOnly")}</span>
                            <button
                              className={classes.applyGateDismiss}
                              onClick={() => setApplyGateIdx(null)}
                            >
                              ✕
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
              {!isRecipeMode && (() => {
                const hasChooser = message.offerCreate && !message._singleRecipe && handleCreateRecipeFromName;
                const hasResults = message.matchedRecipes && message.matchedRecipes.length > 0;
                if (!hasChooser && !hasResults) return null;

                const chooserNames = hasChooser
                  ? (message.recipeNames?.length
                      ? message.recipeNames
                      : (() => {
                          const fl = message.content.split("\n").find(l => l.trim().length >= 3);
                          const n = fl ? fl.replace(/^[\d.)\-*•]+\s*/, "").replace(/\*+/g, "").trim().slice(0, 50) : "";
                          return n ? [n] : [];
                        })())
                  : [];

                if (hasChooser && chooserNames.length === 0) {
                  if (!hasResults) return null;
                }

                const showChooser = chooserNames.length > 0;
                return (
                  <>
                    <div className={classes.sectionDivider} />
                    <div className={classes.assistantFollowUp}>
                      {showChooser && (
                        <>
                          <div className={classes.recipeChooserHeading}>
                            <span className={classes.recipeChooserTitle}>
                              <Plus size={14} />
                              {t("chat", "chooseRecipeToCreate")}
                            </span>
                            <span className={classes.recipeChooserSubtitle}>
                              {t("chat", "chooseRecipeHint")}
                            </span>
                          </div>
                          {chooserNames.map((name) => (
                            <button
                              key={name}
                              className={classes.recipeChooserOption}
                              onClick={() => handleCreateRecipeFromName(name)}
                              disabled={isLoading}
                            >
                              {name}
                              {loadingRecipeName === name && (
                                <Loader2 size={14} className={classes.spinnerIcon} />
                              )}
                            </button>
                          ))}
                        </>
                      )}
                      {showChooser && hasResults && (
                        <div className={classes.sectionDivider} />
                      )}
                      {hasResults && (
                        <>
                          <span className={classes.recipeResultsLabel}>
                            <BookOpen size={15} />
                            {t("chat", "matchingRecipes")}
                          </span>
                          {message.matchedRecipes.map((r) => (
                            <div key={r.id} className={classes.recipeResultItem}>
                              <span className={classes.recipeResultInfo}>
                                <span className={classes.recipeResultName}>{r.name}</span>
                                {r.hint && (
                                  <span className={classes.recipeResultHint}>
                                    {t("chat", r.hint)}
                                  </span>
                                )}
                              </span>
                              <div className={classes.recipeResultActions}>
                                <button
                                  className={classes.recipeResultActionBtn}
                                  onClick={() => navigate(`/recipe/${r.id}`)}
                                >
                                  <ChevronLeft size={13} />
                                  {t("chat", "openRecipe")}
                                </button>
                                {handleRecipeVariation && filterRedundantActions(
                                  getRecipeResultActions(
                                    (messages[index - 1]?.role === "user" && messages[index - 1]?.content) || ""
                                  ),
                                  allRecipes?.find((full) => full.id === r.id)
                                ).map((action) => (
                                  <button
                                    key={action.key}
                                    className={classes.recipeResultChip}
                                    onClick={() => handleRecipeVariation(r.id, action.key)}
                                    disabled={isLoading}
                                  >
                                    {action.icon === "Heart" && <Heart size={12} />}
                                    {action.icon === "Dumbbell" && <Dumbbell size={12} />}
                                    {action.icon === "Zap" && <Zap size={12} />}
                                    {action.icon === "Baby" && <Baby size={12} />}
                                    {action.icon === "Leaf" && <Leaf size={12} />}
                                    {action.icon === "WheatOff" && <WheatOff size={12} />}
                                    {t("chat", action.labelKey)}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          ) : (
            <div className={classes.bubble}>
              {message.image && (
                <img src={message.image} alt="Uploaded food" className={classes.chatImage} />
              )}
              {message.content}
            </div>
          )}
          {message.role === "assistant" &&
            !isRecipeMode &&
            message.intent &&
            getFollowUpActions(message.intent).length > 0 && (
              <div className={classes.followUpChips}>
                {getFollowUpActions(message.intent).map((action) => (
                  <button
                    key={action.labelKey}
                    className={classes.followUpChip}
                    onClick={() => handleChipClick(t("chat", action.promptKey))}
                    disabled={isLoading}
                  >
                    {t("chat", action.labelKey)}
                  </button>
                ))}
              </div>
            )}
          {message.role === "user" && <div className={classes.avatar}>{userInitial}</div>}
        </div>
      ))}

      {isLoading && (
        <div className={`${classes.message} ${classes.assistantMessage}`}>
          <div className={classes.bubble}>
            <div className={classes.typing}>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      )}
      {error && <div className={classes.errorMessage}>{error}</div>}
      <div ref={messagesEndRef} />
    </div>
  );
}
