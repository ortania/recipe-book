import { useCallback, useRef } from "react";
import { useRecipeBook } from "../context/RecipesBookContext";
import { updateUserProfile } from "../firebase/authService";
import {
  FEATURE_CONFIG,
  GATE_TYPES,
  DEFAULT_USAGE,
  FULL_ACCESS_ROLES,
} from "../config/entitlements";

function getCurrentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function getUsage(user) {
  return { ...DEFAULT_USAGE, ...(user?.usage || {}) };
}

function needsMonthlyReset(usage) {
  const current = getCurrentMonth();
  return usage.lastMonthlyReset !== current;
}

function resetMonthlyCounters(usage) {
  return {
    ...usage,
    generalChatMessages: 0,
    recipeChatMessages: 0,
    nutritionCalcs: 0,
    variationsCreated: 0,
    lastMonthlyReset: getCurrentMonth(),
  };
}

export default function useEntitlements() {
  const { currentUser, setCurrentUser } = useRecipeBook();
  const writingRef = useRef(false);

  const hasFullAccess = useCallback(() => {
    if (!currentUser) return false;
    if (FULL_ACCESS_ROLES.includes(currentUser.accessRole)) return true;
    if (currentUser.isAdmin && !currentUser.accessRole) return true;
    if (
      currentUser.plan === "premium" &&
      currentUser.premiumUntil &&
      new Date(currentUser.premiumUntil) > new Date()
    ) {
      return true;
    }
    return false;
  }, [currentUser]);

  const isPremium = currentUser?.plan === "premium" &&
    currentUser?.premiumUntil &&
    new Date(currentUser.premiumUntil) > new Date();

  const isOverride = FULL_ACCESS_ROLES.includes(currentUser?.accessRole);

  const canUse = useCallback(
    (featureKey) => {
      const config = FEATURE_CONFIG[featureKey];
      if (!config) return { allowed: true, remaining: null, gate: null };

      if (hasFullAccess()) {
        return { allowed: true, remaining: null, gate: null };
      }

      if (config.gate === GATE_TYPES.HARD) {
        return { allowed: false, remaining: 0, gate: GATE_TYPES.HARD };
      }

      let usage = getUsage(currentUser);
      if (needsMonthlyReset(usage)) {
        usage = resetMonthlyCounters(usage);
      }

      const current = usage[config.counter] || 0;
      const remaining = Math.max(0, config.freeLimit - current);

      if (remaining <= 0) {
        return { allowed: false, remaining: 0, gate: config.gate, limit: config.freeLimit };
      }

      return { allowed: true, remaining, gate: config.gate, limit: config.freeLimit };
    },
    [currentUser, hasFullAccess],
  );

  const getRemainingUses = useCallback(
    (featureKey) => {
      const result = canUse(featureKey);
      return result.remaining;
    },
    [canUse],
  );

  const incrementUsage = useCallback(
    async (featureKey) => {
      if (!currentUser?.uid) return;
      if (hasFullAccess()) return;

      const config = FEATURE_CONFIG[featureKey];
      if (!config || config.gate === GATE_TYPES.HARD) return;

      let usage = getUsage(currentUser);
      if (needsMonthlyReset(usage)) {
        usage = resetMonthlyCounters(usage);
      }

      const updated = {
        ...usage,
        [config.counter]: (usage[config.counter] || 0) + 1,
      };

      setCurrentUser((prev) => ({ ...prev, usage: updated }));

      if (!writingRef.current) {
        writingRef.current = true;
        try {
          await updateUserProfile(currentUser.uid, { usage: updated });
        } catch (err) {
          console.error("Failed to persist usage:", err);
        } finally {
          writingRef.current = false;
        }
      }
    },
    [currentUser, hasFullAccess, setCurrentUser],
  );

  return {
    isPremium,
    isOverride,
    hasFullAccess: hasFullAccess(),
    canUse,
    getRemainingUses,
    incrementUsage,
  };
}
