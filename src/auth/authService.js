import {
  AUTH_PENDING_MFA_KEY,
  AUTH_SESSION_KEY,
  AUTH_STORAGE_KEY,
  DEFAULT_AUTH_STATE,
  ROLE_PERMISSIONS,
  defaultDestinationFor,
  roleHasPermission,
} from "./mockAuthData.js";

const clone = (value) => JSON.parse(JSON.stringify(value));
const wait = (ms = 520) =>
  new Promise((resolve) => window.setTimeout(resolve, ms));
const now = () => new Date().toISOString();
const id = (prefix) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function safeParse(raw, fallback) {
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function normalizeState(value) {
  const fallback = clone(DEFAULT_AUTH_STATE);
  if (!value || !Array.isArray(value.users) || !Array.isArray(value.sessions))
    return fallback;

  const mergeDefaultsById = (current = [], defaults = []) => {
    const ids = new Set(current.map((item) => item.id));
    return [...current, ...defaults.filter((item) => !ids.has(item.id))];
  };

  return {
    ...fallback,
    ...value,
    users: mergeDefaultsById(value.users, fallback.users).map((user) => ({
      ...user,
      permissions: [
        ...new Set([
          ...(user.permissions || []),
          ...(ROLE_PERMISSIONS[user.role] || []),
        ]),
      ],
    })),
    organizations: mergeDefaultsById(
      value.organizations,
      fallback.organizations,
    ),
    sessions: mergeDefaultsById(value.sessions, fallback.sessions),
  };
}

export function readAuthState() {
  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
  const state = normalizeState(raw ? safeParse(raw, null) : null);
  if (!raw || !safeParse(raw, null))
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(state));
  return state;
}

export function writeAuthState(state) {
  window.localStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify(normalizeState(state)),
  );
  return state;
}

function updateState(updater) {
  const state = readAuthState();
  const next = updater(clone(state)) || state;
  return writeAuthState(next);
}

function recordEvent(state, userId, type, status, description) {
  state.securityEvents.unshift({
    id: id("event"),
    type,
    userId,
    timestamp: now(),
    device: "MacBook Pro · Codex Browser",
    location: "India · 203.0.113.42",
    status,
    description,
  });
  state.securityEvents = state.securityEvents.slice(0, 100);
}

function addMessage(state, userId, type, title, body, action = "security") {
  state.messages.unshift({
    id: id("message"),
    userId,
    type,
    title,
    body,
    createdAt: now(),
    read: false,
    action,
  });
}

function saveSession(user, rememberMe, trusted = false, existingState = null) {
  const session = {
    id: id("session"),
    userId: user.id,
    createdAt: now(),
    lastActive: now(),
    rememberMe,
    trusted,
    expiresAt: new Date(
      Date.now() + (rememberMe ? 30 : 1) * 24 * 60 * 60 * 1000,
    ).toISOString(),
  };
  window.localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
  const state = existingState || readAuthState();
  state.sessions = state.sessions.map((item) =>
    item.userId === user.id ? { ...item, current: false } : item,
  );
  state.sessions.unshift({
    id: session.id,
    userId: user.id,
    device: "MacBook Pro",
    browser: "Codex Browser",
    location: "India",
    lastActive: "Now",
    current: true,
    trusted,
  });
  const target = state.users.find((item) => item.id === user.id);
  if (target) {
    target.lastLoginAt = now();
    target.failedLoginAttempts = 0;
    target.lockedUntil = null;
  }
  recordEvent(
    state,
    user.id,
    "login.success",
    "success",
    "Login completed and a new session was created.",
  );
  addMessage(
    state,
    user.id,
    "security",
    "New login detected",
    "A new browser session was created for your beatmondo workspace.",
  );
  if (!existingState) writeAuthState(state);
  return session;
}

export const authService = {
  resetDemoData() {
    window.localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify(clone(DEFAULT_AUTH_STATE)),
    );
    window.localStorage.removeItem(AUTH_SESSION_KEY);
    window.localStorage.removeItem(AUTH_PENDING_MFA_KEY);
    window.localStorage.removeItem("beatmondo-buyer-verification-v1");
    window.localStorage.removeItem("beatmondo-membership-billing-v1");
    window.localStorage.removeItem("beatmondo-membership-checkout-v1");
    window.localStorage.removeItem("beatmondo-last-membership-confirmation");
    window.localStorage.removeItem("beatmondo-rights-database-v1");
    window.localStorage.removeItem("beatmondo-search-infrastructure-v1");
    window.localStorage.removeItem("beatmondo-track-ingestion-v1");
    window.localStorage.removeItem("beatmondo-active-ingestion-draft");
    window.localStorage.removeItem("beatmondo-file-storage-streaming-v1");
    window.localStorage.removeItem("beatmondo-watermarked-previews-v1");
    window.localStorage.removeItem("beatmondo-quote-calculation-v1");
    window.localStorage.removeItem("beatmondo-selected-quote");
    window.localStorage.removeItem("beatmondo-contracts-esignature-v1");
    window.localStorage.removeItem("beatmondo-selected-contract");
    window.localStorage.removeItem("beatmondo-licensing-payments-v1");
    window.localStorage.removeItem("beatmondo-selected-licensing-invoice");
    window.localStorage.removeItem("beatmondo-selected-licensing-payment");
    window.localStorage.removeItem("beatmondo-licensing-checkout");
    window.localStorage.removeItem("beatmondo-licence-generation-v1");
    window.localStorage.removeItem("beatmondo-selected-licence");
    window.localStorage.removeItem("beatmondo-secure-delivery-v1");
    window.localStorage.removeItem("beatmondo-selected-secure-delivery");
    window.localStorage.removeItem("beatmondo-expiring-access-v1");
    window.localStorage.removeItem("beatmondo-selected-expiring-access");
    window.localStorage.removeItem("beatmondo-audit-logging-v1");
    window.localStorage.removeItem("beatmondo-selected-audit-event");
    window.localStorage.removeItem("beatmondo-email-notifications-v1");
    window.localStorage.removeItem("beatmondo-selected-email-message");
    window.localStorage.removeItem("beatmondo-selected-email-template");
    window.localStorage.removeItem("beatmondo-admin-permissions-v1");
    window.localStorage.removeItem("beatmondo-selected-access-user");
    window.localStorage.removeItem("beatmondo-selected-role");
    window.localStorage.removeItem("beatmondo-selected-permission");
    window.localStorage.removeItem("beatmondo-analytics-reporting-v1");
    window.localStorage.removeItem("beatmondo-selected-report");
    window.localStorage.removeItem("beatmondo-compliance-privacy-v1");
    window.localStorage.removeItem("beatmondo-selected-privacy-request");
    Object.keys(window.sessionStorage)
      .filter((key) => key.startsWith("beatmondo-active-temp-token:"))
      .forEach((key) => window.sessionStorage.removeItem(key));
    return clone(DEFAULT_AUTH_STATE);
  },

  getState: readAuthState,

  getCurrentSession() {
    const session = safeParse(
      window.localStorage.getItem(AUTH_SESSION_KEY),
      null,
    );
    if (!session) return null;
    if (new Date(session.expiresAt).getTime() <= Date.now()) {
      window.localStorage.removeItem(AUTH_SESSION_KEY);
      return { expired: true, ...session };
    }
    return session;
  },

  getCurrentUser() {
    const session = this.getCurrentSession();
    if (!session || session.expired) return null;
    return (
      readAuthState().users.find((user) => user.id === session.userId) || null
    );
  },

  async login({ email, password, rememberMe = true, intendedView = null }) {
    await wait();
    const normalizedEmail = String(email || "")
      .trim()
      .toLowerCase();
    let result = {
      ok: false,
      code: "INVALID_CREDENTIALS",
      message: "The email address or password is incorrect.",
    };
    updateState((state) => {
      const user = state.users.find(
        (item) => item.email.toLowerCase() === normalizedEmail,
      );
      if (!user || user.password !== password) {
        if (user) {
          user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
          recordEvent(
            state,
            user.id,
            "login.failed",
            "failed",
            "A login attempt failed because the credentials did not match.",
          );
          if (user.failedLoginAttempts >= 5) {
            user.lockedUntil = new Date(
              Date.now() + 15 * 60 * 1000,
            ).toISOString();
            recordEvent(
              state,
              user.id,
              "account.locked",
              "warning",
              "The demo account was temporarily locked after repeated failed logins.",
            );
            addMessage(
              state,
              user.id,
              "security",
              "Account temporarily locked",
              "Five unsuccessful login attempts were detected.",
              "account-locked",
            );
            result = {
              ok: false,
              code: "ACCOUNT_LOCKED",
              message:
                "This account is temporarily locked after repeated unsuccessful attempts.",
            };
          }
        }
        return state;
      }
      if (user.accountStatus === "suspended") {
        recordEvent(
          state,
          user.id,
          "login.blocked",
          "blocked",
          "Login was blocked because the account is suspended.",
        );
        result = {
          ok: false,
          code: "ACCOUNT_SUSPENDED",
          message:
            "This account is currently unavailable. Please contact beatmondo support for an access review.",
        };
        return state;
      }
      if (user.accountStatus !== "active") {
        result = {
          ok: false,
          code: "ACCOUNT_INACTIVE",
          message:
            "This account is not currently active. Please contact beatmondo support.",
        };
        return state;
      }
      if (
        user.lockedUntil &&
        new Date(user.lockedUntil).getTime() > Date.now()
      ) {
        result = {
          ok: false,
          code: "ACCOUNT_LOCKED",
          message:
            "This account is temporarily locked after repeated unsuccessful attempts.",
        };
        return state;
      }
      if (!user.emailVerified) {
        result = {
          ok: false,
          code: "EMAIL_UNVERIFIED",
          userId: user.id,
          message: "Please verify your email before entering the workspace.",
        };
        return state;
      }
      const trusted = user.trustedDevices?.includes("demo-browser");
      if (user.mfaEnabled && !trusted) {
        const challenge = {
          id: id("mfa"),
          userId: user.id,
          rememberMe,
          intendedView,
          attempts: 0,
          createdAt: now(),
        };
        window.localStorage.setItem(
          AUTH_PENDING_MFA_KEY,
          JSON.stringify(challenge),
        );
        addMessage(
          state,
          user.id,
          "security",
          "Your beatmondo verification code",
          "Demo MFA code: 246810",
          "mfa",
        );
        result = {
          ok: true,
          requiresMfa: true,
          challengeId: challenge.id,
          destination: "mfa",
        };
        return state;
      }
      result = {
        ok: true,
        user: clone(user),
        session: saveSession(user, rememberMe, trusted, state),
        destination: intendedView || defaultDestinationFor(user),
      };
      return state;
    });
    return result;
  },

  async verifyMfa(code, trustDevice = false) {
    await wait(420);
    const challenge = safeParse(
      window.localStorage.getItem(AUTH_PENDING_MFA_KEY),
      null,
    );
    if (!challenge)
      return {
        ok: false,
        code: "MFA_EXPIRED",
        message:
          "This verification challenge has expired. Please sign in again.",
      };
    let result;
    updateState((state) => {
      const user = state.users.find((item) => item.id === challenge.userId);
      if (!user) {
        result = {
          ok: false,
          code: "MFA_EXPIRED",
          message: "This verification challenge has expired.",
        };
        return state;
      }
      if (String(code) !== "246810") {
        challenge.attempts = (challenge.attempts || 0) + 1;
        recordEvent(
          state,
          user.id,
          "mfa.failed",
          "failed",
          "The MFA challenge code was incorrect.",
        );
        window.localStorage.setItem(
          AUTH_PENDING_MFA_KEY,
          JSON.stringify(challenge),
        );
        result =
          challenge.attempts >= 5
            ? {
                ok: false,
                code: "MFA_LOCKED",
                message:
                  "Too many incorrect codes. Return to login to start again.",
              }
            : {
                ok: false,
                code: "MFA_INVALID",
                message: "That six-digit code is incorrect.",
              };
        return state;
      }
      if (trustDevice)
        user.trustedDevices = [
          ...new Set([...(user.trustedDevices || []), "demo-browser"]),
        ];
      recordEvent(
        state,
        user.id,
        "mfa.passed",
        "success",
        "The MFA challenge was completed successfully.",
      );
      result = {
        ok: true,
        user: clone(user),
        session: saveSession(user, challenge.rememberMe, trustDevice, state),
        destination: challenge.intendedView || defaultDestinationFor(user),
      };
      return state;
    });
    if (result?.ok) window.localStorage.removeItem(AUTH_PENDING_MFA_KEY);
    return result;
  },

  cancelMfa() {
    window.localStorage.removeItem(AUTH_PENDING_MFA_KEY);
  },
  getPendingMfa() {
    return safeParse(window.localStorage.getItem(AUTH_PENDING_MFA_KEY), null);
  },

  async register(payload) {
    await wait(650);
    let result;
    updateState((state) => {
      if (
        state.users.some(
          (user) => user.email.toLowerCase() === payload.email.toLowerCase(),
        )
      ) {
        result = {
          ok: false,
          code: "ACCOUNT_EXISTS",
          message:
            "An account request already exists for this email. Try signing in or resetting the password.",
        };
        return state;
      }
      const userId = id("user");
      const role =
        payload.accountType === "artist" ? "artist" : "discovery_buyer";
      const user = {
        id: userId,
        name: payload.name,
        email: payload.email.toLowerCase(),
        password: payload.password,
        avatar: payload.name
          .split(/\s+/)
          .map((part) => part[0])
          .join("")
          .slice(0, 2)
          .toUpperCase(),
        organizationId: id("org"),
        organization:
          payload.organization || payload.artistName || "Independent",
        jobTitle: payload.jobTitle || payload.professionalRole || "",
        phone: payload.phone || "",
        country: payload.country || "",
        website: payload.website || "",
        bio: "",
        userType: role === "artist" ? "artist" : "buyer",
        role,
        roleLabel:
          role === "artist" ? "Artist / Rightsholder" : "Discovery Buyer",
        permissions: ROLE_PERMISSIONS[role],
        accountStatus: "active",
        emailVerified: false,
        verificationStatus: "pending",
        membershipTier:
          role === "artist" ? "Artist Application" : "Discovery Access",
        mfaEnabled: false,
        profileCompletion: 60,
        preApprovedTerms: false,
        submissionAccess: false,
        notificationPreferences: {
          security: true,
          licensing: true,
          editorial: false,
        },
        failedLoginAttempts: 0,
        lockedUntil: null,
        trustedDevices: [],
        securityFlags: [],
        createdAt: now(),
        lastLoginAt: null,
      };
      const token = {
        id: id("verify"),
        userId,
        token: id("token"),
        status: "active",
        attempts: 0,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      };
      state.users.push(user);
      state.verificationTokens.push(token);
      addMessage(
        state,
        userId,
        "verification",
        "Verify your beatmondo email",
        "Open the demo verification action to complete your account.",
        "verify-email",
      );
      recordEvent(
        state,
        userId,
        "registration.created",
        "success",
        "A new account request was created and is awaiting email verification.",
      );
      result = { ok: true, user: clone(user), token: token.token };
      return state;
    });
    return result;
  },

  async verifyEmail(userId) {
    await wait(420);
    let result;
    updateState((state) => {
      const user = state.users.find((item) => item.id === userId);
      if (!user) {
        result = {
          ok: false,
          code: "TOKEN_EXPIRED",
          message: "This verification link is no longer valid.",
        };
        return state;
      }
      if (user.emailVerified) {
        result = { ok: true, alreadyVerified: true, user: clone(user) };
        return state;
      }
      user.emailVerified = true;
      const token = state.verificationTokens.find(
        (item) => item.userId === userId && item.status === "active",
      );
      if (token) token.status = "used";
      recordEvent(
        state,
        user.id,
        "email.verified",
        "success",
        "The account email address was verified.",
      );
      result = { ok: true, user: clone(user) };
      return state;
    });
    return result;
  },

  async resendVerification(userId) {
    await wait(350);
    let result;
    updateState((state) => {
      const user = state.users.find((item) => item.id === userId);
      if (!user) {
        result = {
          ok: false,
          message: "Unable to resend this verification message.",
        };
        return state;
      }
      const recent = state.verificationTokens.filter(
        (item) => item.userId === userId && item.status === "active",
      );
      if (recent.length >= 4) {
        result = {
          ok: false,
          code: "TOO_MANY_RESENDS",
          message:
            "Too many verification messages were requested. Please try again later.",
        };
        return state;
      }
      const token = {
        id: id("verify"),
        userId,
        token: id("token"),
        status: "active",
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      };
      state.verificationTokens.push(token);
      addMessage(
        state,
        userId,
        "verification",
        "New email verification link",
        "A fresh demo verification action is ready.",
        "verify-email",
      );
      result = { ok: true, token: token.token };
      return state;
    });
    return result;
  },

  async requestPasswordReset(email) {
    await wait(480);
    let demoToken = null;
    updateState((state) => {
      const user = state.users.find(
        (item) => item.email.toLowerCase() === String(email).toLowerCase(),
      );
      if (user) {
        const token = {
          id: id("reset"),
          userId: user.id,
          token: id("reset-token"),
          status: "active",
          expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        };
        state.resetTokens.push(token);
        demoToken = token.token;
        recordEvent(
          state,
          user.id,
          "password.reset.requested",
          "success",
          "Password-reset instructions were requested.",
        );
        addMessage(
          state,
          user.id,
          "security",
          "Password reset requested",
          "Open the demo reset action to choose a new password.",
          "reset-password",
        );
      }
      return state;
    });
    return {
      ok: true,
      token: demoToken,
      message:
        "If an account exists for this email address, password-reset instructions have been sent.",
    };
  },

  async resetPassword(tokenValue, password) {
    await wait(520);
    let result;
    updateState((state) => {
      const token = state.resetTokens.find((item) => item.token === tokenValue);
      if (
        !token ||
        token.status !== "active" ||
        new Date(token.expiresAt).getTime() <= Date.now()
      ) {
        result = {
          ok: false,
          code: "TOKEN_EXPIRED",
          message:
            "This password-reset link is expired or has already been used.",
        };
        return state;
      }
      const user = state.users.find((item) => item.id === token.userId);
      if (!user) {
        result = {
          ok: false,
          message: "This password-reset link is no longer valid.",
        };
        return state;
      }
      user.password = password;
      user.failedLoginAttempts = 0;
      user.lockedUntil = null;
      token.status = "used";
      recordEvent(
        state,
        user.id,
        "password.changed",
        "success",
        "The account password was reset using a recovery link.",
      );
      addMessage(
        state,
        user.id,
        "security",
        "Password changed",
        "Your beatmondo account password was updated.",
      );
      result = { ok: true };
      return state;
    });
    return result;
  },

  logout(allDevices = false) {
    const session = this.getCurrentSession();
    if (session && !session.expired)
      updateState((state) => {
        state.sessions = allDevices
          ? state.sessions.filter((item) => item.userId !== session.userId)
          : state.sessions.filter((item) => item.id !== session.id);
        recordEvent(
          state,
          session.userId,
          allDevices ? "sessions.revoked_all" : "logout",
          "success",
          allDevices
            ? "All account sessions were revoked."
            : "The current browser session was signed out.",
        );
        return state;
      });
    window.localStorage.removeItem(AUTH_SESSION_KEY);
  },

  expireSession() {
    const session = this.getCurrentSession();
    if (!session || session.expired) return;
    session.expiresAt = new Date(Date.now() - 1000).toISOString();
    window.localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
  },

  updateProfile(userId, updates) {
    let result;
    updateState((state) => {
      const user = state.users.find((item) => item.id === userId);
      if (!user) {
        result = { ok: false, message: "The profile could not be loaded." };
        return state;
      }
      Object.assign(user, updates);
      user.profileCompletion = Math.min(
        100,
        Math.max(user.profileCompletion || 0, 85),
      );
      result = { ok: true, user: clone(user) };
      return state;
    });
    return result;
  },

  async changePassword(userId, currentPassword, newPassword) {
    await wait(450);
    let result;
    updateState((state) => {
      const user = state.users.find((item) => item.id === userId);
      if (!user || user.password !== currentPassword) {
        result = { ok: false, message: "The current password is incorrect." };
        return state;
      }
      user.password = newPassword;
      recordEvent(
        state,
        user.id,
        "password.changed",
        "success",
        "The account password was changed from Security settings.",
      );
      addMessage(
        state,
        user.id,
        "security",
        "Password changed",
        "Your beatmondo account password was updated.",
      );
      result = { ok: true };
      return state;
    });
    return result;
  },

  setMfa(userId, enabled) {
    let result;
    updateState((state) => {
      const user = state.users.find((item) => item.id === userId);
      if (!user) return state;
      user.mfaEnabled = enabled;
      if (!enabled) user.trustedDevices = [];
      recordEvent(
        state,
        user.id,
        enabled ? "mfa.enabled" : "mfa.disabled",
        "success",
        `Multi-factor authentication was ${enabled ? "enabled" : "disabled"}.`,
      );
      result = {
        ok: true,
        user: clone(user),
        recoveryCodes: enabled
          ? ["BM-7K2Q-91XP", "BM-4G8N-22LD", "BM-9P3A-80VT"]
          : [],
      };
      return state;
    });
    return result;
  },

  getSessions(userId) {
    const state = readAuthState();
    let sessions = state.sessions.filter((item) => item.userId === userId);
    const user = state.users.find((item) => item.id === userId);
    if (
      sessions.length < 2 &&
      user &&
      !user.securityFlags?.includes("demo-sessions-seeded")
    ) {
      state.sessions.push(
        {
          id: `${userId}-windows-demo`,
          userId,
          device: "Windows workstation",
          browser: "Chrome",
          location: "New York",
          lastActive: "2 days ago",
          current: false,
          trusted: false,
        },
        {
          id: `${userId}-iphone-demo`,
          userId,
          device: "iPhone",
          browser: "Safari",
          location: "Los Angeles",
          lastActive: "6 days ago",
          current: false,
          trusted: true,
        },
      );
      user.securityFlags = [
        ...(user.securityFlags || []),
        "demo-sessions-seeded",
      ];
      writeAuthState(state);
      sessions = state.sessions.filter((item) => item.userId === userId);
    }
    return sessions;
  },
  getLoginHistory(userId) {
    return readAuthState()
      .securityEvents.filter(
        (item) => item.userId === userId && item.type.startsWith("login"),
      )
      .slice(0, 12);
  },
  getSecurityEvents(userId) {
    return readAuthState()
      .securityEvents.filter((item) => item.userId === userId)
      .slice(0, 20);
  },
  getMessages(userId) {
    return readAuthState().messages.filter((item) => item.userId === userId);
  },
  addDemoMessage(userId, type, title, body, action = "notifications") {
    updateState((state) => {
      addMessage(state, userId, type, title, body, action);
      return state;
    });
    return { ok: true };
  },
  removeDemoMessagesByType(type) {
    updateState((state) => {
      state.messages = state.messages.filter((item) => item.type !== type);
      return state;
    });
    return { ok: true };
  },

  revokeSession(userId, sessionId) {
    updateState((state) => {
      state.sessions = state.sessions.filter((item) => item.id !== sessionId);
      recordEvent(
        state,
        userId,
        "session.revoked",
        "success",
        "A browser session was revoked.",
      );
      return state;
    });
  },
  revokeOtherSessions(userId) {
    updateState((state) => {
      state.sessions = state.sessions.filter(
        (item) => item.userId !== userId || item.current,
      );
      recordEvent(
        state,
        userId,
        "sessions.revoked_other",
        "success",
        "All other browser sessions were revoked.",
      );
      return state;
    });
  },
  markMessageRead(messageId) {
    updateState((state) => {
      const message = state.messages.find((item) => item.id === messageId);
      if (message) message.read = true;
      return state;
    });
  },

  unlockAccount(userId) {
    updateState((state) => {
      const user = state.users.find((item) => item.id === userId);
      if (user) {
        user.failedLoginAttempts = 0;
        user.lockedUntil = null;
        recordEvent(
          state,
          user.id,
          "account.unlocked",
          "success",
          "The demo account was unlocked.",
        );
      }
      return state;
    });
  },

  adminUpdateUser(actorId, userId, updates, description) {
    let result;
    updateState((state) => {
      const actor = state.users.find((item) => item.id === actorId);
      const user = state.users.find((item) => item.id === userId);
      if (!actor || !roleHasPermission(actor, "users.manage") || !user) {
        result = {
          ok: false,
          message: "You do not have permission to manage this account.",
        };
        return state;
      }
      Object.assign(user, updates);
      if (updates.role) {
        user.permissions = ROLE_PERMISSIONS[updates.role] || [];
        user.roleLabel = updates.role
          .split("_")
          .map((part) => part[0].toUpperCase() + part.slice(1))
          .join(" ");
      }
      recordEvent(
        state,
        user.id,
        "user.admin_updated",
        "success",
        description || "An administrator updated this account.",
      );
      recordEvent(
        state,
        actor.id,
        "admin.user_updated",
        "success",
        `Updated ${user.email}: ${description || "account settings changed"}.`,
      );
      result = { ok: true, user: clone(user) };
      return state;
    });
    return result;
  },
};
