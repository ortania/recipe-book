import { useState } from "react";
import { MessageSquare, ChevronDown, ChevronUp } from "lucide-react";
import { useLanguage, useRecipeBook } from "../../context";
import { useComments } from "../../hooks/useComments";
import {
  addComment,
  deleteComment,
  likeComment,
  unlikeComment,
} from "../../firebase/commentService";
import { CommentItem } from "../comment-item";
import { CommentForm } from "../comment-form";
import { VerifyEmailHint } from "../banners/verify-email-hint";
import classes from "./comments-section.module.css";

function CommentsSection({ recipeId }) {
  const { t } = useLanguage();
  const { currentUser } = useRecipeBook();
  const { comments, loading, commentCount } = useComments(recipeId);
  const [expanded, setExpanded] = useState(true);

  const handleAddComment = async (text) => {
    if (!currentUser) return;
    await addComment(recipeId, {
      userId: currentUser.uid,
      userName:
        currentUser.displayName ||
        currentUser.email?.split("@")[0] ||
        "Anonymous",
      userPhoto: currentUser.photoURL || "",
      text,
    });
  };

  const handleDelete = async (commentId) => {
    await deleteComment(recipeId, commentId);
  };

  const handleLike = async (commentId) => {
    if (!currentUser) return;
    await likeComment(recipeId, commentId, currentUser.uid);
  };

  const handleUnlike = async (commentId) => {
    if (!currentUser) return;
    await unlikeComment(recipeId, commentId, currentUser.uid);
  };

  return (
    <div className={classes.section}>
      <button
        type="button"
        className={classes.toggle}
        onClick={() => setExpanded((prev) => !prev)}
      >
        <div className={classes.toggleTitle}>
          <MessageSquare size={16} className={classes.toggleIcon} />
          <span>{t("comments", "title")}</span>
          {commentCount > 0 && (
            <span className={classes.badge}>{commentCount}</span>
          )}
        </div>
        <span className={classes.expandIcon}>
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </span>
      </button>

      {expanded && (
        <div className={classes.content}>
          {currentUser && currentUser.emailVerified === false && (
            <VerifyEmailHint message={t("auth", "verifyCommentsBlocked")} />
          )}
          <CommentForm
            onSubmit={handleAddComment}
            currentUser={currentUser}
            disabled={currentUser ? currentUser.emailVerified === false : false}
          />

          {!loading && comments.length === 0 && (
            <p className={classes.emptyText}>{t("comments", "empty")}</p>
          )}

          {comments.length > 0 && (
            <div className={classes.list}>
              {comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  currentUserId={currentUser?.uid}
                  onLike={handleLike}
                  onUnlike={handleUnlike}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CommentsSection;
