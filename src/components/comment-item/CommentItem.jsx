import { useState } from "react";
import { Heart, Trash2 } from "lucide-react";
import classes from "./comment-item.module.css";
import { ConfirmDialog } from "../forms/confirm-dialog";
import { useLanguage } from "../../context";

function CommentItem({ comment, currentUserId, onLike, onUnlike, onDelete }) {
  const { t } = useLanguage();
  const [animating, setAnimating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const isOwner = currentUserId && comment.userId === currentUserId;
  const hasLiked = currentUserId && comment.likes?.includes(currentUserId);
  const likeCount = comment.likes?.length || 0;

  const createdAt = comment.createdAt?.toDate
    ? comment.createdAt.toDate()
    : comment.createdAt?.seconds
      ? new Date(comment.createdAt.seconds * 1000)
      : null;

  const timeAgo = createdAt ? formatTimeAgo(createdAt) : "";

  const handleLike = () => {
    if (!currentUserId) return;
    setAnimating(true);
    setTimeout(() => setAnimating(false), 300);
    if (hasLiked) {
      onUnlike?.(comment.id);
    } else {
      onLike?.(comment.id);
    }
  };

  return (
    <div className={classes.comment}>
      <div className={classes.avatar}>
        {comment.userPhoto ? (
          <img
            src={comment.userPhoto}
            alt=""
            className={classes.avatarImage}
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className={classes.avatarLetter}>
            {(comment.userName || "?")[0].toUpperCase()}
          </span>
        )}
      </div>
      <div className={classes.body}>
        <div className={classes.header}>
          <span className={classes.userName}>{comment.userName}</span>
          {timeAgo && <span className={classes.time}>{timeAgo}</span>}
        </div>
        <p className={classes.text}>{comment.text}</p>
        <div className={classes.actions}>
          <button
            type="button"
            className={`${classes.likeBtn} ${hasLiked ? classes.likeBtnActive : ""} ${animating ? classes.likeBtnAnimate : ""}`}
            onClick={handleLike}
            disabled={!currentUserId}
          >
            <Heart
              size={14}
              fill={hasLiked ? "currentColor" : "none"}
            />
            {likeCount > 0 && (
              <span className={classes.likeCount}>{likeCount}</span>
            )}
          </button>
          {isOwner && (
            <button
              type="button"
              className={classes.deleteBtn}
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
      {showDeleteConfirm && (
        <ConfirmDialog
          title={t("confirm", "deleteComment")}
          message={t("confirm", "deleteCommentMsg")}
          onConfirm={() => {
            setShowDeleteConfirm(false);
            onDelete?.(comment.id);
          }}
          onCancel={() => setShowDeleteConfirm(false)}
          confirmText={t("confirm", "yesDelete")}
        />
      )}
    </div>
  );
}

function formatTimeAgo(date) {
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return "עכשיו";
  if (diff < 3600) return `${Math.floor(diff / 60)} דק'`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} שע'`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)} ימים`;
  return date.toLocaleDateString("he-IL");
}

export default CommentItem;
