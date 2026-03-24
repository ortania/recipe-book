import { Lightbulb, Info } from "lucide-react";
import { useChatWindow } from "./ChatWindowContext";

const IDEA_CHIPS = ["ideaChip1", "ideaChip2", "ideaChip3", "ideaChip4", "ideaChip5", "ideaChip6"];

export default function ChatWindowMessages() {
  const {
    messages, isLoading, error, isRecipeMode,
    applyingIdx, customUpdateIdx, setCustomUpdateIdx,
    customUpdateText, setCustomUpdateText,
    appliedFields, userInitial,
    handleApplyUpdate, handleChipClick,
    messagesEndRef, messagesAreaRef,
    classes, t,
  } = useChatWindow();

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
              ? [
                  t("recipeChat", "suggestSubstitute"),
                  t("recipeChat", "suggestHealthier"),
                  t("recipeChat", "suggestDouble"),
                ].map((text, i) => (
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
          <div className={classes.bubble}>
            {message.image && (
              <img src={message.image} alt="Uploaded food" className={classes.chatImage} />
            )}
            {message.content}

            {message.role === "assistant" && handleApplyUpdate && (
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
                    {customUpdateIdx !== index && (
                      <button
                        className={classes.applyBtn}
                        onClick={() => handleApplyUpdate(message.content, index)}
                        disabled={applyingIdx !== null}
                      >
                        {applyingIdx === index
                          ? t("recipeChat", "updating")
                          : t("recipeChat", "applyToRecipe")}
                      </button>
                    )}
                    {customUpdateIdx === index ? (
                      <div className={classes.customUpdateWrap}>
                        <input
                          className={classes.customUpdateInput}
                          value={customUpdateText}
                          onChange={(e) => setCustomUpdateText(e.target.value)}
                          placeholder={t("recipeChat", "customUpdatePlaceholder")}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && customUpdateText.trim()) {
                              handleApplyUpdate(message.content, index, customUpdateText.trim());
                            }
                          }}
                          disabled={applyingIdx !== null}
                        />
                        <button
                          className={classes.customUpdateBtn}
                          onClick={() => handleApplyUpdate(message.content, index, customUpdateText.trim())}
                          disabled={applyingIdx !== null || !customUpdateText.trim()}
                        >
                          {t("recipeChat", "applyCustom")}
                        </button>
                        <button
                          className={classes.customCancelBtn}
                          onClick={() => { setCustomUpdateIdx(null); setCustomUpdateText(""); }}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        className={classes.customChooseBtn}
                        onClick={() => { setCustomUpdateIdx(index); setCustomUpdateText(""); }}
                        disabled={applyingIdx !== null}
                      >
                        {t("recipeChat", "customUpdate")}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
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
