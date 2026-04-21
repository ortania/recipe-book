import { useState } from "react";
import { UserX } from "lucide-react";
import { useBlockedUsers, useLanguage } from "../../../context";
import classes from "./blocked-users-panel.module.css";

/**
 * Inline panel for the Settings page: lists users blocked by the current user
 * and offers an "Unblock" button per row.
 *
 * Success / error toasts are rendered centrally by `BlockedUsersProvider`, so
 * this component only has to call `unblockUser(uid)` and update its "busy"
 * state — no local toast plumbing.
 */
function BlockedUsersPanel() {
  const { t } = useLanguage();
  const { blockedUsersList, loading, unblockUser } = useBlockedUsers();
  const [pendingId, setPendingId] = useState(null);

  const handleUnblock = async (blockedUserId) => {
    if (pendingId) return;
    setPendingId(blockedUserId);
    try {
      await unblockUser(blockedUserId);
    } catch (err) {
      // Toast is shown by BlockedUsersProvider.
    } finally {
      setPendingId(null);
    }
  };

  if (loading && blockedUsersList.length === 0) {
    return (
      <div className={classes.panel}>
        <p className={classes.emptyText}>{t("common", "loading")}…</p>
      </div>
    );
  }

  if (blockedUsersList.length === 0) {
    return (
      <div className={classes.panel}>
        <p className={classes.emptyText}>
          {t("blockedUsers", "emptyMessage")}
        </p>
      </div>
    );
  }

  return (
    <div className={classes.panel}>
      <ul className={classes.list}>
        {blockedUsersList.map((u) => {
          const label =
            u.displayName ||
            u.email ||
            t("blockedUsers", "unknownUser");
          const initial = (label || "?").charAt(0).toUpperCase();
          const busy = pendingId === u.blockedUserId;

          return (
            <li key={u.blockedUserId} className={classes.row}>
              <div className={classes.userInfo}>
                <div className={classes.avatar} aria-hidden>
                  {initial}
                </div>
                <div className={classes.userText}>
                  <span className={classes.userName}>{label}</span>
                  {u.displayName && u.email && (
                    <span className={classes.userSub}>{u.email}</span>
                  )}
                </div>
              </div>
              <button
                type="button"
                className={classes.unblockBtn}
                onClick={() => handleUnblock(u.blockedUserId)}
                disabled={busy}
              >
                <UserX size={16} />
                <span>
                  {busy
                    ? t("blockedUsers", "unblocking")
                    : t("blockedUsers", "unblock")}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default BlockedUsersPanel;
