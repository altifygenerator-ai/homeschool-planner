import { createId } from "@/lib/utils";
import { getFeatureAccess, type SoftWeekAccess, type SoftWeekPlanTier } from "@/lib/featureAccess";
import { getSupabaseClient, getSupabaseSession, isSupabaseConfigured } from "@/lib/supabaseClient";

export type LocalAccountRole = "parent" | "child";

export type LocalAccountPermissions = {
  canPlan: boolean;
  canManageChildren: boolean;
  canSaveWeeks: boolean;
  canEditCategories: boolean;
  canUpdateStatus: boolean;
  canAddNotes: boolean;
};

export type LocalFamily = {
  id: string;
  name: string;
  ownerAccountId: string;
  createdAt: string;
  plan: SoftWeekPlanTier;
  subscriptionStatus?: string;
  premiumFeaturesEnabled?: boolean;
};

export type LocalAccount = {
  id: string;
  familyId: string;
  name: string;
  email: string;
  loginName: string;
  role: LocalAccountRole;
  childId?: string;
  createdAt: string;
  authProvider: "supabase" | "guest" | "child-invite";
  permissions: LocalAccountPermissions;
  isAdmin?: boolean;
};

export type LocalSession = {
  accountId: string;
  familyId: string;
  role: LocalAccountRole;
  childId?: string;
  isGuest: boolean;
  startedAt: string;
};

export type AccountContext = {
  session: LocalSession;
  account: LocalAccount;
  family: LocalFamily;
  isParent: boolean;
  isChild: boolean;
  isGuest: boolean;
  access: SoftWeekAccess;
};

export type AuthResult = {
  ok: boolean;
  message?: string;
  needsEmailConfirm?: boolean;
};

const SESSION_KEY = "softweek_beta_session";

export const GUEST_FAMILY_ID = "guest-family";
export const GUEST_ACCOUNT_ID = "guest-parent";

export const parentPermissions: LocalAccountPermissions = {
  canPlan: true,
  canManageChildren: true,
  canSaveWeeks: true,
  canEditCategories: true,
  canUpdateStatus: true,
  canAddNotes: true,
};

export const childPermissions: LocalAccountPermissions = {
  canPlan: false,
  canManageChildren: false,
  canSaveWeeks: false,
  canEditCategories: false,
  canUpdateStatus: true,
  canAddNotes: true,
};

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function cleanPassword(value: string) {
  return value.trim();
}

function guestFamily(): LocalFamily {
  return {
    id: GUEST_FAMILY_ID,
    name: "Guest family",
    ownerAccountId: GUEST_ACCOUNT_ID,
    createdAt: new Date().toISOString(),
    plan: "guest",
    subscriptionStatus: "guest",
    premiumFeaturesEnabled: true,
  };
}

function guestAccount(): LocalAccount {
  return {
    id: GUEST_ACCOUNT_ID,
    familyId: GUEST_FAMILY_ID,
    name: "Guest",
    email: "guest@softweek.local",
    loginName: "guest",
    role: "parent",
    createdAt: new Date().toISOString(),
    authProvider: "guest",
    permissions: parentPermissions,
  };
}

function getGuestSession(): LocalSession | null {
  if (typeof window === "undefined") return null;

  try {
    const parsed = JSON.parse(window.localStorage.getItem(SESSION_KEY) || "null") as LocalSession | null;
    return parsed?.isGuest ? parsed : null;
  } catch {
    return null;
  }
}

function saveGuestSession(session: LocalSession) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event("softweek-session-changed"));
}

function clearGuestSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_KEY);
}

function mapProfileToAccount(profile: Record<string, unknown>, email = "") {
  const role = profile.role === "child" ? "child" : "parent";
  const isAdmin = Boolean(profile.is_admin);
  const familyId = String(profile.family_id ?? "");

  return {
    id: String(profile.id),
    familyId,
    name: String(profile.display_name ?? (role === "child" ? "Child" : "Parent")),
    email: String(profile.email ?? email),
    loginName: String(profile.email ?? email),
    role,
    childId: profile.child_id ? String(profile.child_id) : undefined,
    createdAt: String(profile.created_at ?? new Date().toISOString()),
    authProvider: "supabase" as const,
    permissions: role === "child" ? childPermissions : parentPermissions,
    isAdmin,
  } satisfies LocalAccount;
}

function mapFamily(row: Record<string, unknown>, ownerId = "") {
  return {
    id: String(row.id),
    name: String(row.name ?? "SoftWeek family"),
    ownerAccountId: String(row.owner_user_id ?? ownerId),
    createdAt: String(row.created_at ?? new Date().toISOString()),
    plan: String(row.plan_tier ?? "beta_free") as SoftWeekPlanTier,
    subscriptionStatus: String(row.subscription_status ?? "beta"),
    premiumFeaturesEnabled: Boolean(row.premium_features_enabled ?? true),
  } satisfies LocalFamily;
}

async function createParentWorkspace({
  displayName,
  familyName,
}: {
  displayName?: string;
  familyName?: string;
}) {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  const { error } = await supabase.rpc("create_parent_workspace", {
    p_display_name: displayName?.trim() || "Parent",
    p_family_name: familyName?.trim() || null,
  });

  if (error) throw error;
}

async function acceptChildInvite({
  displayName,
  inviteCode,
}: {
  displayName?: string;
  inviteCode?: string;
}) {
  if (!inviteCode?.trim()) return;

  const supabase = getSupabaseClient();
  if (!supabase) return;

  const { error } = await supabase.rpc("accept_child_invite", {
    p_display_name: displayName?.trim() || "Student",
    p_invite_code: inviteCode.trim(),
  });

  if (error) throw error;
}

export async function ensureCurrentProfile(options?: {
  displayName?: string;
  familyName?: string;
  inviteCode?: string;
}) {
  const supabase = getSupabaseClient();
  const session = await getSupabaseSession();
  if (!supabase || !session?.user) return null;

  const { data: existing, error: existingError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", session.user.id)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existing) return existing;

  const metadata = session.user.user_metadata ?? {};
  const role = metadata.role === "child" ? "child" : "parent";
  const inviteCode = options?.inviteCode || String(metadata.invite_code || "");
  const displayName = options?.displayName || String(metadata.display_name || "");
  const familyName = options?.familyName || String(metadata.family_name || "");

  if (role === "child" && inviteCode) {
    await acceptChildInvite({ displayName, inviteCode });
  } else {
    await createParentWorkspace({ displayName, familyName });
  }

  const { data: created, error: createdError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", session.user.id)
    .maybeSingle();

  if (createdError) throw createdError;
  return created;
}

export async function getActiveSession(): Promise<LocalSession | null> {
  const guest = getGuestSession();
  if (guest) return guest;

  const session = await getSupabaseSession();
  if (!session?.user) return null;

  const profile = await ensureCurrentProfile();
  if (!profile) return null;

  const role = profile.role === "child" ? "child" : "parent";

  return {
    accountId: session.user.id,
    familyId: String(profile.family_id),
    role,
    childId: profile.child_id ? String(profile.child_id) : undefined,
    isGuest: false,
    startedAt: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : new Date().toISOString(),
  };
}

export async function getActiveAccountContext(): Promise<AccountContext | null> {
  const guest = getGuestSession();

  if (guest) {
    const family = guestFamily();
    const account = guestAccount();

    return {
      session: guest,
      account,
      family,
      isParent: true,
      isChild: false,
      isGuest: true,
      access: getFeatureAccess({ planTier: "guest", premiumFeaturesEnabled: true }),
    };
  }

  const supabase = getSupabaseClient();
  const session = await getSupabaseSession();
  if (!supabase || !session?.user) return null;

  const profile = await ensureCurrentProfile();
  if (!profile) return null;

  const { data: familyRow, error: familyError } = await supabase
    .from("families")
    .select("*")
    .eq("id", profile.family_id)
    .maybeSingle();

  if (familyError) throw familyError;
  if (!familyRow) return null;

  const account = mapProfileToAccount(profile, session.user.email ?? "");
  const family = mapFamily(familyRow, session.user.id);
  const accountSession: LocalSession = {
    accountId: account.id,
    familyId: family.id,
    role: account.role,
    childId: account.childId,
    isGuest: false,
    startedAt: new Date().toISOString(),
  };

  return {
    session: accountSession,
    account,
    family,
    isParent: account.role === "parent",
    isChild: account.role === "child",
    isGuest: false,
    access: getFeatureAccess({
      planTier: family.plan,
      premiumFeaturesEnabled: family.premiumFeaturesEnabled,
      isAdmin: account.isAdmin,
    }),
  };
}

export async function signOutLocalAccount() {
  clearGuestSession();
  const supabase = getSupabaseClient();
  if (supabase) await supabase.auth.signOut();

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("softweek-session-changed"));
  }
}

export function startGuestSession() {
  const now = new Date().toISOString();
  const session: LocalSession = {
    accountId: GUEST_ACCOUNT_ID,
    familyId: GUEST_FAMILY_ID,
    role: "parent",
    isGuest: true,
    startedAt: now,
  };

  saveGuestSession(session);
  return session;
}

export async function createParentLocalAccount({
  name,
  email,
  password,
  familyName,
}: {
  name: string;
  email: string;
  password: string;
  familyName?: string;
}): Promise<AuthResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, message: "Supabase is not configured yet. Add your environment variables first." };
  }

  const supabase = getSupabaseClient();
  if (!supabase) return { ok: false, message: "Supabase is not available." };

  const cleanEmail = normalizeEmail(email);
  const cleanPasswordValue = cleanPassword(password);

  if (!cleanEmail || cleanPasswordValue.length < 6) {
    return { ok: false, message: "Add an email and a password with at least 6 characters." };
  }

  clearGuestSession();

  const { data, error } = await supabase.auth.signUp({
    email: cleanEmail,
    password: cleanPasswordValue,
    options: {
      data: {
        role: "parent",
        display_name: name.trim() || "Parent",
        family_name: familyName?.trim() || null,
      },
    },
  });

  if (error) return { ok: false, message: error.message };

  if (!data.session) {
    return {
      ok: true,
      needsEmailConfirm: true,
      message: "Check your email to confirm the account, then log in.",
    };
  }

  try {
    await createParentWorkspace({ displayName: name, familyName });
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Account was created, but the family workspace did not finish setting up.",
    };
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("softweek-session-changed"));
  }

  return { ok: true };
}

export async function createChildSupabaseAccount({
  name,
  email,
  password,
  inviteCode,
}: {
  name: string;
  email: string;
  password: string;
  inviteCode: string;
}): Promise<AuthResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, message: "Supabase is not configured yet. Add your environment variables first." };
  }

  const supabase = getSupabaseClient();
  if (!supabase) return { ok: false, message: "Supabase is not available." };

  const cleanEmail = normalizeEmail(email);
  const cleanPasswordValue = cleanPassword(password);
  const cleanInviteCode = inviteCode.trim();

  if (!cleanEmail || cleanPasswordValue.length < 6 || !cleanInviteCode) {
    return { ok: false, message: "Add the child email, password, and invite code." };
  }

  clearGuestSession();

  const { data, error } = await supabase.auth.signUp({
    email: cleanEmail,
    password: cleanPasswordValue,
    options: {
      data: {
        role: "child",
        display_name: name.trim() || "Student",
        invite_code: cleanInviteCode,
      },
    },
  });

  if (error) return { ok: false, message: error.message };

  if (!data.session) {
    return {
      ok: true,
      needsEmailConfirm: true,
      message: "Check the email to confirm the account, then log in with the invite code.",
    };
  }

  try {
    await acceptChildInvite({ displayName: name, inviteCode: cleanInviteCode });
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Child account was created, but the invite could not be linked.",
    };
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("softweek-session-changed"));
  }

  return { ok: true };
}

export async function loginLocalAccount(login: string, password: string, inviteCode?: string): Promise<AuthResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, message: "Supabase is not configured yet. Add your environment variables first." };
  }

  const supabase = getSupabaseClient();
  if (!supabase) return { ok: false, message: "Supabase is not available." };

  const cleanEmail = normalizeEmail(login);
  const cleanPasswordValue = cleanPassword(password);

  if (!cleanEmail || !cleanPasswordValue) {
    return { ok: false, message: "Add your email and password." };
  }

  clearGuestSession();

  const { error } = await supabase.auth.signInWithPassword({
    email: cleanEmail,
    password: cleanPasswordValue,
  });

  if (error) return { ok: false, message: error.message };

  try {
    await ensureCurrentProfile({ inviteCode });
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Logged in, but the SoftWeek profile could not load.",
    };
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("softweek-session-changed"));
  }

  return { ok: true };
}

export async function createChildLocalAccount(childId: string, childName: string) {
  const context = await getActiveAccountContext();
  if (!context || !context.isParent) return null;

  if (context.isGuest) {
    return {
      id: createId("child-invite"),
      familyId: context.family.id,
      childId,
      name: childName,
      email: "guest-child@softweek.local",
      loginName: "Create a parent account first",
      role: "child" as const,
      createdAt: new Date().toISOString(),
      authProvider: "child-invite" as const,
      permissions: childPermissions,
    } satisfies LocalAccount;
  }

  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase.rpc("create_child_account_invite", {
    p_child_id: childId,
    p_child_name: childName,
  });

  if (error) throw error;

  const row = Array.isArray(data) ? data[0] : data;
  const inviteCode = String(row?.invite_code ?? "");

  return {
    id: String(row?.id ?? createId("child-invite")),
    familyId: context.family.id,
    childId,
    name: childName,
    email: "",
    loginName: inviteCode,
    role: "child" as const,
    createdAt: new Date().toISOString(),
    authProvider: "child-invite" as const,
    permissions: childPermissions,
  } satisfies LocalAccount;
}

export async function getChildAccount(childId: string) {
  const context = await getActiveAccountContext();
  if (!context || context.isGuest) return null;

  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("family_id", context.family.id)
    .eq("child_id", childId)
    .eq("role", "child")
    .maybeSingle();

  if (profile) return mapProfileToAccount(profile);

  const { data: invite } = await supabase
    .from("child_account_invites")
    .select("*")
    .eq("family_id", context.family.id)
    .eq("child_id", childId)
    .is("accepted_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!invite) return null;

  return {
    id: String(invite.id),
    familyId: context.family.id,
    childId,
    name: String(invite.child_name ?? "Student"),
    email: "",
    loginName: String(invite.invite_code ?? "Invite created"),
    role: "child" as const,
    createdAt: String(invite.created_at ?? new Date().toISOString()),
    authProvider: "child-invite" as const,
    permissions: childPermissions,
  } satisfies LocalAccount;
}

export async function getAccountsForActiveFamily() {
  const context = await getActiveAccountContext();
  if (!context) return [];

  if (context.isGuest) return [guestAccount()];

  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("family_id", context.family.id)
    .order("created_at", { ascending: true });

  if (error) return [];
  return (data ?? []).map((profile) => mapProfileToAccount(profile));
}

export async function getActiveFamilyId() {
  return (await getActiveAccountContext())?.family.id ?? GUEST_FAMILY_ID;
}
