export type SoftWeekPlanTier = "guest" | "beta_free" | "free" | "premium" | "admin";

export type SoftWeekAccess = {
  planTier: SoftWeekPlanTier;
  label: string;
  premiumFeaturesEnabled: boolean;
  maxChildren: number | null;
  maxSavedWeeks: number | null;
  canCreateChildLogins: boolean;
  canUseMonthlyYearlyOverviews: boolean;
  canExportRecords: boolean;
  isAdmin: boolean;
  dataSafetyNote: string;
};

export const betaAccess: SoftWeekAccess = {
  planTier: "beta_free",
  label: "Beta access",
  premiumFeaturesEnabled: true,
  maxChildren: null,
  maxSavedWeeks: null,
  canCreateChildLogins: true,
  canUseMonthlyYearlyOverviews: true,
  canExportRecords: true,
  isAdmin: false,
  dataSafetyNote:
    "Beta families can test the larger family and record tools free while SoftWeek is being shaped.",
};

export function getFeatureAccess({
  planTier,
  premiumFeaturesEnabled,
  isAdmin,
}: {
  planTier?: string | null;
  premiumFeaturesEnabled?: boolean | null;
  isAdmin?: boolean | null;
}): SoftWeekAccess {
  if (isAdmin || planTier === "admin") {
    return {
      ...betaAccess,
      planTier: "admin",
      label: "Admin access",
      isAdmin: true,
      premiumFeaturesEnabled: true,
      dataSafetyNote:
        "Admin access keeps all current and future SoftWeek features open for testing.",
    };
  }

  if (planTier === "premium" || premiumFeaturesEnabled) {
    return {
      ...betaAccess,
      planTier: planTier === "premium" ? "premium" : "beta_free",
      label: planTier === "premium" ? "Premium" : "Beta access",
      premiumFeaturesEnabled: true,
    };
  }

  if (planTier === "free") {
    return {
      planTier: "free",
      label: "Free plan",
      premiumFeaturesEnabled: false,
      maxChildren: 1,
      maxSavedWeeks: 8,
      canCreateChildLogins: false,
      canUseMonthlyYearlyOverviews: false,
      canExportRecords: false,
      isAdmin: false,
      dataSafetyNote:
        "Existing children and saved records stay available if a family moves to the free plan later. Free limits only control adding new premium records or profiles after the limit is reached.",
    };
  }

  if (planTier === "guest") {
    return {
      planTier: "guest",
      label: "Guest",
      premiumFeaturesEnabled: true,
      maxChildren: null,
      maxSavedWeeks: null,
      canCreateChildLogins: false,
      canUseMonthlyYearlyOverviews: true,
      canExportRecords: false,
      isAdmin: false,
      dataSafetyNote:
        "Guest mode is for trying the planner. Create an account when you want records saved to your family workspace.",
    };
  }

  return betaAccess;
}

export function isOverFreeLimit({
  access,
  childCount,
  savedWeekCount,
}: {
  access: SoftWeekAccess;
  childCount: number;
  savedWeekCount: number;
}) {
  return {
    children:
      access.maxChildren !== null && childCount >= access.maxChildren,
    savedWeeks:
      access.maxSavedWeeks !== null && savedWeekCount >= access.maxSavedWeeks,
  };
}
