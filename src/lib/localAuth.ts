import { createId } from "@/lib/utils";

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
  plan: "guest" | "free" | "beta";
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
  authProvider: "local-beta";
  permissions: LocalAccountPermissions;
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
};

const ACCOUNTS_KEY = "softweek_beta_accounts";
const FAMILIES_KEY = "softweek_beta_families";
const SESSION_KEY = "softweek_beta_session";

export const GUEST_FAMILY_ID = "guest-family";
export const GUEST_ACCOUNT_ID = "guest-parent";

const parentPermissions: LocalAccountPermissions = {
  canPlan: true,
  canManageChildren: true,
  canSaveWeeks: true,
  canEditCategories: true,
  canUpdateStatus: true,
  canAddNotes: true,
};

const childPermissions: LocalAccountPermissions = {
  canPlan: false,
  canManageChildren: false,
  canSaveWeeks: false,
  canEditCategories: false,
  canUpdateStatus: true,
  canAddNotes: true,
};

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function normalizeLogin(value: string) {
  return value.trim().toLowerCase();
}

function makeChildLoginName(childName: string, familyId: string) {
  const base = childName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 32);

  return `${base || "child"}-${familyId.slice(-5)}`;
}

function guestFamily(): LocalFamily {
  return {
    id: GUEST_FAMILY_ID,
    name: "Guest family",
    ownerAccountId: GUEST_ACCOUNT_ID,
    createdAt: new Date().toISOString(),
    plan: "guest",
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
    authProvider: "local-beta",
    permissions: parentPermissions,
  };
}

export function getLocalAccounts(): LocalAccount[] {
  if (typeof window === "undefined") return [];
  return safeParse<LocalAccount[]>(window.localStorage.getItem(ACCOUNTS_KEY), []);
}

export function saveLocalAccounts(accounts: LocalAccount[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

export function getLocalFamilies(): LocalFamily[] {
  if (typeof window === "undefined") return [];
  return safeParse<LocalFamily[]>(window.localStorage.getItem(FAMILIES_KEY), []);
}

export function saveLocalFamilies(families: LocalFamily[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(FAMILIES_KEY, JSON.stringify(families));
}

export function getActiveSession(): LocalSession | null {
  if (typeof window === "undefined") return null;
  return safeParse<LocalSession | null>(window.localStorage.getItem(SESSION_KEY), null);
}

export function saveActiveSession(session: LocalSession) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event("softweek-session-changed"));
}

export function signOutLocalAccount() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event("softweek-session-changed"));
}

export function startGuestSession() {
  const account = guestAccount();
  const family = guestFamily();

  const accounts = getLocalAccounts();
  const families = getLocalFamilies();

  if (!accounts.some((item) => item.id === account.id)) {
    saveLocalAccounts([...accounts, account]);
  }

  if (!families.some((item) => item.id === family.id)) {
    saveLocalFamilies([...families, family]);
  }

  const session: LocalSession = {
    accountId: account.id,
    familyId: family.id,
    role: "parent",
    isGuest: true,
    startedAt: new Date().toISOString(),
  };

  saveActiveSession(session);
  return session;
}

export function createParentLocalAccount({
  name,
  email,
  familyName,
}: {
  name: string;
  email: string;
  familyName?: string;
}) {
  const cleanName = name.trim() || "Parent";
  const cleanEmail = normalizeLogin(email);
  const accounts = getLocalAccounts();
  const existing = accounts.find((account) => account.email === cleanEmail);

  if (existing) {
    const session: LocalSession = {
      accountId: existing.id,
      familyId: existing.familyId,
      role: existing.role,
      childId: existing.childId,
      isGuest: false,
      startedAt: new Date().toISOString(),
    };

    saveActiveSession(session);
    return { account: existing, session, existed: true };
  }

  const familyId = createId("family");
  const accountId = createId("account");
  const now = new Date().toISOString();

  const account: LocalAccount = {
    id: accountId,
    familyId,
    name: cleanName,
    email: cleanEmail,
    loginName: cleanEmail,
    role: "parent",
    createdAt: now,
    authProvider: "local-beta",
    permissions: parentPermissions,
  };

  const family: LocalFamily = {
    id: familyId,
    name: familyName?.trim() || `${cleanName}'s family`,
    ownerAccountId: accountId,
    createdAt: now,
    plan: "beta",
  };

  saveLocalAccounts([...accounts, account]);
  saveLocalFamilies([...getLocalFamilies(), family]);

  const session: LocalSession = {
    accountId,
    familyId,
    role: "parent",
    isGuest: false,
    startedAt: now,
  };

  saveActiveSession(session);
  return { account, session, existed: false };
}

export function loginLocalAccount(login: string) {
  const normalized = normalizeLogin(login);
  const account = getLocalAccounts().find(
    (item) => item.email === normalized || item.loginName === normalized
  );

  if (!account) return null;

  const session: LocalSession = {
    accountId: account.id,
    familyId: account.familyId,
    role: account.role,
    childId: account.childId,
    isGuest: false,
    startedAt: new Date().toISOString(),
  };

  saveActiveSession(session);
  return { account, session };
}

export function createChildLocalAccount(childId: string, childName: string) {
  const context = getActiveAccountContext();
  if (!context || !context.isParent) return null;

  const accounts = getLocalAccounts();
  const existing = accounts.find(
    (account) => account.familyId === context.family.id && account.childId === childId
  );

  if (existing) return existing;

  const loginName = makeChildLoginName(childName, context.family.id);
  const now = new Date().toISOString();
  const account: LocalAccount = {
    id: createId("child-account"),
    familyId: context.family.id,
    childId,
    name: childName,
    email: `${loginName}@softweek.local`,
    loginName,
    role: "child",
    createdAt: now,
    authProvider: "local-beta",
    permissions: childPermissions,
  };

  saveLocalAccounts([...accounts, account]);
  return account;
}

export function getChildAccount(childId: string) {
  const context = getActiveAccountContext();
  if (!context) return null;

  return (
    getLocalAccounts().find(
      (account) => account.familyId === context.family.id && account.childId === childId
    ) ?? null
  );
}

export function getAccountsForActiveFamily() {
  const context = getActiveAccountContext();
  if (!context) return [];

  return getLocalAccounts().filter((account) => account.familyId === context.family.id);
}

export function getActiveAccountContext(): AccountContext | null {
  const session = getActiveSession();
  if (!session) return null;

  const account =
    getLocalAccounts().find((item) => item.id === session.accountId) ??
    (session.isGuest ? guestAccount() : null);

  const family =
    getLocalFamilies().find((item) => item.id === session.familyId) ??
    (session.isGuest ? guestFamily() : null);

  if (!account || !family) return null;

  return {
    session,
    account,
    family,
    isParent: account.role === "parent",
    isChild: account.role === "child",
    isGuest: session.isGuest,
  };
}

export function getActiveFamilyId() {
  return getActiveAccountContext()?.family.id ?? GUEST_FAMILY_ID;
}
