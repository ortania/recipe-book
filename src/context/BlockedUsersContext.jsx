import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { UserX, AlertCircle } from "lucide-react";
import { useRecipeBook } from "./RecipesBookContext";
import { useLanguage } from "./LanguageContext";
import {
  blockUser as blockUserSvc,
  fetchBlockedUsers as fetchBlockedUsersSvc,
  unblockUser as unblockUserSvc,
} from "../firebase/blockUserService";
import { Toast } from "../components/controls";

/**
 * Lightweight app-wide context exposing the current user's blocked-user list.
 *
 * Owns the block/unblock success + error toasts so they stay visible even
 * after the triggering UI (e.g. a community recipe card) is filtered out of
 * the DOM. Callers just `await blockUser(uid)` / `unblockUser(uid)` and don't
 * need to manage their own toast state for these actions.
 *
 * Not intended for any broader refactor — it only covers the Block feature.
 */
const BlockedUsersContext = createContext({
  blockedUserIds: new Set(),
  blockedUsersList: [],
  loading: false,
  blockUser: async () => {},
  unblockUser: async () => {},
  refresh: async () => {},
});

export function BlockedUsersProvider({ children }) {
  const { currentUser } = useRecipeBook();
  const { t } = useLanguage();
  const uid = currentUser?.uid || null;

  const [blockedUsersList, setBlockedUsersList] = useState([]);
  const [loading, setLoading] = useState(false);

  const [blockToastOpen, setBlockToastOpen] = useState(false);
  const [unblockToastOpen, setUnblockToastOpen] = useState(false);
  const [errorToastOpen, setErrorToastOpen] = useState(false);

  const refresh = useCallback(async () => {
    if (!uid) {
      setBlockedUsersList([]);
      return;
    }
    setLoading(true);
    try {
      const list = await fetchBlockedUsersSvc(uid);
      setBlockedUsersList(list);
    } catch (err) {
      console.error("Failed to load blocked users:", err);
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const blockUser = useCallback(
    async (blockedUserId) => {
      if (!uid) throw new Error("Not signed in");
      try {
        await blockUserSvc(uid, blockedUserId);
        setBlockToastOpen(true);
        await refresh();
      } catch (err) {
        console.error("Block failed:", err);
        setErrorToastOpen(true);
        throw err;
      }
    },
    [uid, refresh],
  );

  const unblockUser = useCallback(
    async (blockedUserId) => {
      if (!uid) throw new Error("Not signed in");
      try {
        await unblockUserSvc(uid, blockedUserId);
        setUnblockToastOpen(true);
        await refresh();
      } catch (err) {
        console.error("Unblock failed:", err);
        setErrorToastOpen(true);
        throw err;
      }
    },
    [uid, refresh],
  );

  const blockedUserIds = useMemo(
    () => new Set(blockedUsersList.map((b) => b.blockedUserId)),
    [blockedUsersList],
  );

  const value = useMemo(
    () => ({
      blockedUserIds,
      blockedUsersList,
      loading,
      blockUser,
      unblockUser,
      refresh,
    }),
    [blockedUserIds, blockedUsersList, loading, blockUser, unblockUser, refresh],
  );

  return (
    <BlockedUsersContext.Provider value={value}>
      {children}

      <Toast
        open={blockToastOpen}
        onClose={() => setBlockToastOpen(false)}
        variant="success"
      >
        <UserX size={18} aria-hidden />
        <span>{t("blockedUsers", "userBlocked")}</span>
      </Toast>

      <Toast
        open={unblockToastOpen}
        onClose={() => setUnblockToastOpen(false)}
        variant="success"
      >
        <UserX size={18} aria-hidden />
        <span>{t("blockedUsers", "userUnblocked")}</span>
      </Toast>

      <Toast
        open={errorToastOpen}
        onClose={() => setErrorToastOpen(false)}
        variant="error"
      >
        <AlertCircle size={18} aria-hidden />
        <span>{t("blockedUsers", "genericError")}</span>
      </Toast>
    </BlockedUsersContext.Provider>
  );
}

export function useBlockedUsers() {
  return useContext(BlockedUsersContext);
}
