import { useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Lightbulb,
  Info,
  Plus,
  Loader2,
  Heart,
  Dumbbell,
  Zap,
  Baby,
  Leaf,
  WheatOff,
  Copy,
  Crown,
  Eye,
  PenLine,
} from "lucide-react";
import { useChatWindow } from "./ChatWindowContext";
import {
  getFollowUpActions,
  getRecipeResultActions,
  filterRedundantActions,
  buildRecipeDraftFromChat,
} from "../../utils/chatIntents";
import { FEATURES } from "../../config/entitlements";
import useEntitlements from "../../hooks/useEntitlements";
import { BottomSheet } from "../../components/controls/bottom-sheet";

const IDEA_CHIPS = [
  "ideaChip1",
  "ideaChip2",
  "ideaChip3",
  "ideaChip4",
  "ideaChip5",
  "ideaChip6",
  "ideaChip7",
  "ideaChip8",
];

function buildRecipeChips(recipe, recipeContext, t) {
  if (!recipeContext) return [];
  const chips = [];
  const name = recipeContext.name || "";
  const ings = recipeContext.ingredients || [];

  const pick = (arr) =>
    arr.length > 0 ? arr[Math.floor(arr.length / 2)] : null;
  const randomIng = pick(ings.filter((x) => typeof x === "string" && x.trim()));

  if (randomIng) {
    const clean = randomIng.replace(/^[\d\s½¼¾⅓⅔.,/\-–]+/, "").trim();
    if (clean)
      chips.push(
        t("recipeChat", "suggestSubstituteFor").replace("{ing}", clean),
      );
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
    messages,
    isLoading,
    error,
    isRecipeMode,
    applyingIdx,
    customUpdateIdx,
    setCustomUpdateIdx,
    customUpdateText,
    setCustomUpdateText,
    appliedFields,
    userInitial,
    handleApplyUpdate,
    handleCreateVariation,
    handleChipClick,
    handleCreateRecipeFromName,
    loadingRecipeName,
    handleRecipeVariation,
    allRecipes,
    openWizardWithDraft,
    messagesEndRef,
    messagesAreaRef,
    recipe,
    recipeContext,
    classes,
    t,
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

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewName, setPreviewName] = useState("");
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const handlePreviewRecipe = useCallback(async (name) => {
    setPreviewName(name);
    setPreviewData(null);
    setPreviewOpen(true);
    setPreviewLoading(true);
    try {
      const { callOpenAI } = await import("../../services/openai");
      const response = await callOpenAI({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a recipe assistant. Write a complete recipe in Hebrew.\nFormat:\nFirst line: recipe name\nThen a section titled מרכיבים: with one ingredient per line (use - prefix).\nThen a section titled אופן הכנה: with numbered steps.",
          },
          {
            role: "user",
            content: `כתוב לי מתכון מלא ל${name} עם רשימת מרכיבים מדויקת ואופן הכנה צעד אחר צעד`,
          },
        ],
        temperature: 0.7,
        max_tokens: 800,
      });
      const draft = buildRecipeDraftFromChat(response);
      setPreviewData({ raw: response, draft });
    } catch {
      setPreviewData({ raw: "", draft: null, error: true });
    } finally {
      setPreviewLoading(false);
    }
  }, []);

  const handleCreateFromPreview = useCallback(() => {
    if (!previewData?.draft?.name || !openWizardWithDraft) return;
    setPreviewOpen(false);
    openWizardWithDraft(previewData.draft);
  }, [previewData, openWizardWithDraft]);

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
                <Lightbulb
                  size={18}
                  style={{ verticalAlign: "middle", marginInlineEnd: "0.3rem" }}
                />
                {t("chat", "ideaTitle")}
              </>
            )}
          </h3>
          <p className={classes.ideasSubtitle}>
            {isRecipeMode ? (
              <>
                <Lightbulb
                  size={18}
                  style={{ verticalAlign: "middle", marginInlineEnd: "0.3rem" }}
                />
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
            message.role === "user"
              ? classes.userMessage
              : classes.assistantMessage
          }`}
        >
          {message.role === "assistant" ? (
            <div className={classes.assistantBubbleGroup}>
              {(() => {
                let bubbleText = message.content;
                if (message.recipeNames?.length > 0) {
                  bubbleText = message.content
                    .split("\n")
                    .filter((l) => !/^\s*(?:\d+[.)]\s*|-\s+|•\s+)/.test(l))
                    .join("\n")
                    .trim();
                }
                if (!bubbleText && !message.image) return null;
                return (
                <div className={classes.bubble}>
                  {message.image && (
                    <img
                      src={message.image}
                      alt="Uploaded food"
                      className={classes.chatImage}
                    />
                  )}
                  {bubbleText}

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
                                onChange={(e) =>
                                  setCustomUpdateText(e.target.value)
                                }
                                placeholder={t(
                                  "recipeChat",
                                  "customUpdatePlaceholder",
                                )}
                                disabled={applyingIdx !== null}
                              />
                              <button
                                className={classes.customCancelBtn}
                                onClick={() => {
                                  setCustomUpdateIdx(null);
                                  setCustomUpdateText("");
                                }}
                              >
                                ✕
                              </button>
                            </div>
                          )}
                          <div className={classes.applyBtnRow}>
                            <button
                              className={classes.applyBtn}
                              onClick={() =>
                                handleGatedApply(
                                  message.content,
                                  index,
                                  customUpdateIdx === index &&
                                    customUpdateText.trim()
                                    ? customUpdateText.trim()
                                    : undefined,
                                )
                              }
                              disabled={
                                applyingIdx !== null ||
                                (customUpdateIdx === index &&
                                  !customUpdateText.trim())
                              }
                            >
                              {applyingIdx === index
                                ? t("recipeChat", "updating")
                                : t("recipeChat", "applyToRecipe")}
                            </button>
                            {handleCreateVariation && (
                              <button
                                className={classes.variationBtn}
                                onClick={() =>
                                  handleCreateVariation(
                                    message.content,
                                    index,
                                    customUpdateIdx === index &&
                                      customUpdateText.trim()
                                      ? customUpdateText.trim()
                                      : undefined,
                                  )
                                }
                                disabled={
                                  applyingIdx !== null ||
                                  (customUpdateIdx === index &&
                                    !customUpdateText.trim())
                                }
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
                                onClick={() => {
                                  setCustomUpdateIdx(index);
                                  setCustomUpdateText("");
                                }}
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
              );})()}
              {!isRecipeMode &&
                (() => {
                  const hasChooser =
                    message.offerCreate &&
                    !message._singleRecipe &&
                    handleCreateRecipeFromName;
                  const hasResults =
                    message.matchedRecipes && message.matchedRecipes.length > 0;
                  if (!hasChooser && !hasResults) return null;

                  const chooserNames = hasChooser && message.recipeNames?.length
                    ? message.recipeNames
                    : [];

                  if (hasChooser && chooserNames.length === 0 && !hasResults)
                    return null;

                  const showChooser = chooserNames.length > 0;
                  return (
                    <div className={classes.assistantFollowUp}>
                      {showChooser && (
                        <div className={classes.recipeChooserCompact}>
                          {chooserNames.map((name) => (
                            <button
                              key={name}
                              className={classes.recipeChooserOption}
                              onClick={() => handlePreviewRecipe(name)}
                              disabled={isLoading}
                            >
                              <Eye size={14} />
                              {name}
                            </button>
                          ))}
                        </div>
                      )}
                      {hasResults && (
                        <>
                          <span className={classes.matchedRecipesLabel}>
                            {t("chat", "matchingRecipes") ||
                              "נמצא בספר המתכונים שלך"}
                          </span>
                          <div className={classes.recipeChooserCompact}>
                            {message.matchedRecipes.map((r) => (
                              <button
                                key={r.id}
                                className={`${classes.recipeChooserOption} ${classes.matchedOption}`}
                                onClick={() => navigate(`/recipe/${r.id}`)}
                              >
                                <Eye size={14} />
                                {r.name}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })()}
            </div>
          ) : (
            <div className={classes.bubble}>
              {message.image && (
                <img
                  src={message.image}
                  alt="Uploaded food"
                  className={classes.chatImage}
                />
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
          {message.role === "user" && (
            <div className={classes.avatar}>{userInitial}</div>
          )}
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

      <BottomSheet
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={previewName}
        fullHeight
      >
        {previewLoading ? (
          <div className={classes.previewLoading}>
            <Loader2 size={24} className={classes.spinnerIcon} />
            <span>טוען מתכון...</span>
          </div>
        ) : previewData?.error ? (
          <div className={classes.previewError}>
            {t("chat", "analyzeImageError")}
          </div>
        ) : previewData?.draft ? (
          <div className={classes.previewContent}>
            {previewData.draft.ingredients?.length > 0 && (
              <div className={classes.previewSection}>
                <h4 className={classes.previewSectionTitle}>מרכיבים</h4>
                <ul className={classes.previewList}>
                  {previewData.draft.ingredients.map((ing, i) => (
                    <li key={i}>{ing}</li>
                  ))}
                </ul>
              </div>
            )}
            {previewData.draft.instructions?.length > 0 && (
              <div className={classes.previewSection}>
                <h4 className={classes.previewSectionTitle}>אופן הכנה</h4>
                <ol className={classes.previewSteps}>
                  {previewData.draft.instructions.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              </div>
            )}
            <div className={classes.previewActions}>
              <button
                className={classes.previewCreateBtn}
                onClick={handleCreateFromPreview}
              >
                <PenLine size={16} />
                צור מתכון
              </button>
            </div>
          </div>
        ) : null}
      </BottomSheet>
    </div>
  );
}
