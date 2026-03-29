import { useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { ProductTour } from "../product-tour";
import { CategoriesManagement } from "../categories-management";
import { Modal } from "../modal";
import { CloseButton } from "../controls/close-button";
import { BottomSheet } from "../controls/bottom-sheet";
import { CategoriesSheetContent } from "../categories-sheet-content";
import { useNavigation } from "./NavigationContext";

export default function NavigationModals() {
  const {
    isMobile, isMobileNav,
    showManagement, setShowManagement,
    showCategoriesSheet, setShowCategoriesSheet,
    showTour, setShowTour,
    showHelp, setShowHelp,
    showChatHistory, setShowChatHistory,
    chatHistory, expandedChats, toggleChat,
    managementFromSheetRef,
    categories, addCategory, editCategory, deleteCategory,
    reorderCategories, sortCategoriesAlphabetically, getGroupContacts,
    classes, t,
  } = useNavigation();

  const navigate = useNavigate();
  const location = useLocation();

  const handleCategoryToggle = useCallback(() => {
    if (location.pathname !== "/categories") {
      navigate("/categories");
    }
  }, [location.pathname, navigate]);

  const handleCategoriesClose = useCallback(() => {
    setShowCategoriesSheet(false);
    if (location.pathname !== "/categories") {
      navigate("/categories");
    }
  }, [location.pathname, navigate, setShowCategoriesSheet]);

  return (
    <>
      {showManagement && (
        <CategoriesManagement
          categories={categories}
          onClose={() => {
            setShowManagement(false);
            if (managementFromSheetRef.current) setShowCategoriesSheet(true);
            managementFromSheetRef.current = false;
          }}
          onAddCategory={addCategory}
          onEditCategory={editCategory}
          onDeleteCategory={deleteCategory}
          onReorderCategories={reorderCategories}
          onSortAlphabetically={sortCategoriesAlphabetically}
          getGroupContacts={getGroupContacts}
        />
      )}

      {isMobile
        ? showCategoriesSheet && (
            <Modal onClose={handleCategoriesClose} maxWidth="480px">
              <CategoriesSheetContent
                onClose={handleCategoriesClose}
                onManage={() => {
                  setShowCategoriesSheet(false);
                  managementFromSheetRef.current = true;
                  setShowManagement(true);
                }}
                onAfterToggle={handleCategoryToggle}
              />
            </Modal>
          )
        : showCategoriesSheet && (
            <>
              <div className={classes.catPopupOverlay} onClick={handleCategoriesClose} />
              <div className={classes.catPopup}>
                <CategoriesSheetContent
                  onClose={handleCategoriesClose}
                  onManage={() => {
                    setShowCategoriesSheet(false);
                    managementFromSheetRef.current = true;
                    setShowManagement(true);
                  }}
                  onAfterToggle={handleCategoryToggle}
                />
              </div>
            </>
          )}

      <AnimatePresence>
        {showTour && (
          <ProductTour
            onClose={() => {
              setShowTour(false);
              localStorage.setItem("tourCompleted", "true");
            }}
          />
        )}
      </AnimatePresence>

      {isMobileNav ? (
        <BottomSheet open={showHelp} onClose={() => setShowHelp(false)} title={t("sidebarHelp", "title")}>
          <div style={{ padding: "1rem", direction: "rtl", textAlign: "right" }}>
            <p>{t("sidebarHelp", "description")}</p>
          </div>
        </BottomSheet>
      ) : (
        showHelp && (
          <>
            <div
              style={{
                position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                background: "rgba(0,0,0,0.5)", zIndex: 10199,
              }}
              onClick={() => setShowHelp(false)}
            />
            <div
              style={{
                position: "fixed", top: "50%", left: "50%",
                transform: "translate(-50%, -50%)",
                background: "var(--clr-bg-primary)", borderRadius: "14px",
                padding: "1.5rem", width: "95vw", maxWidth: "400px",
                maxHeight: "80vh", overflowY: "auto",
                boxShadow: "0 8px 28px rgba(0,0,0,0.18)",
                zIndex: 10200, direction: "rtl", textAlign: "right",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                <strong style={{ fontSize: "var(--large-font)" }}>{t("sidebarHelp", "title")}</strong>
                <CloseButton onClick={() => setShowHelp(false)} />
              </div>
              <p>{t("sidebarHelp", "description")}</p>
            </div>
          </>
        )
      )}

      {showChatHistory &&
        (isMobile ? (
          <Modal onClose={() => setShowChatHistory(false)} maxWidth="480px">
            <div className={classes.chatHistoryContainer}>
              <div className={classes.chatHistoryHeader}>
                <h2 className={classes.chatHistoryTitle}>{t("nav", "chatLog")}</h2>
                <CloseButton onClick={() => setShowChatHistory(false)} />
              </div>
              {chatHistory.length === 0 ? (
                <p className={classes.chatHistoryEmpty}>{t("nav", "noChatHistory")}</p>
              ) : (
                <div className={classes.chatHistoryBody}>
                  {chatHistory.map((chat) => (
                    <div key={chat.id} className={classes.chatAccordionItem}>
                      <button className={classes.chatHistoryItem} onClick={() => toggleChat(chat.id)}>
                        {chat.question}
                      </button>
                      {expandedChats.has(chat.id) && (
                        <div className={classes.chatAnswer}><p>{chat.answer}</p></div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Modal>
        ) : (
          <>
            <div className={classes.catPopupOverlay} onClick={() => setShowChatHistory(false)} />
            <div className={classes.catPopup} style={{ maxWidth: "520px" }}>
              <div className={classes.catPopupHeader}>
                <span className={classes.catPopupTitle}>{t("nav", "chatLog")}</span>
                <CloseButton
                  className={classes.catPopupClose}
                  onClick={() => setShowChatHistory(false)}
                />
              </div>
              {chatHistory.length === 0 ? (
                <p className={classes.chatHistoryEmpty}>{t("nav", "noChatHistory")}</p>
              ) : (
                <div className={classes.chatHistoryBody}>
                  {chatHistory.map((chat) => (
                    <div key={chat.id} className={classes.chatAccordionItem}>
                      <button className={classes.chatHistoryItem} onClick={() => toggleChat(chat.id)}>
                        {chat.question}
                      </button>
                      {expandedChats.has(chat.id) && (
                        <div className={classes.chatAnswer}><p>{chat.answer}</p></div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ))}
    </>
  );
}
