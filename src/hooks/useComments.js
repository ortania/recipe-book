import { useState, useEffect } from "react";
import { subscribeToComments } from "../firebase/commentService";

export function useComments(recipeId) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!recipeId) {
      setComments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToComments(recipeId, (data) => {
      setComments(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [recipeId]);

  return { comments, loading, commentCount: comments.length };
}
