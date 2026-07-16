import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { authService } from "./authService.js";
import { defaultDestinationFor, roleHasPermission } from "./mockAuthData.js";
import { buyerVerificationService } from "../verification/buyerVerificationService.js";
import {
  calculateEffectiveAccess,
  membershipService,
} from "../membership/membershipService.js";
import {
  buildAuthorizationContext,
  canAccessRoute,
  canPerform,
} from "../permissions/authorizationService.js";

const AuthContext = createContext(null);

export const PUBLIC_VIEWS = new Set([
  "home",
  "login",
  "register",
  "signup",
  "forgot",
  "forgot-password",
  "reset-password",
  "verify-email",
  "verification-success",
  "mfa",
  "account-locked",
  "account-suspended",
  "session-expired",
  "access-denied",
  "catalog",
  "search",
  "search-results",
  "search-saved",
  "search-recent",
  "search-collections",
  "usecases",
  "track",
  "artist",
  "legacy",
  "licensing",
  "content",
  "stories",
  "media",
  "contact",
  "membership-plans",
  "access",
]);

const BUYER_ROLES = ["discovery_buyer", "professional_buyer", "vip_buyer"];
const INTERNAL_ROLES = [
  "licensing_manager",
  "catalog_manager",
  "media_operations",
  "finance_manager",
  "legal_reviewer",
  "security_administrator",
  "privacy_administrator",
  "support_administrator",
  "senior_approver",
  "administrator",
  "super_administrator",
];

export function getRouteDecision(view, user, ready = true) {
  if (!ready || PUBLIC_VIEWS.has(view)) return { allowed: true };
  if (!user)
    return {
      allowed: false,
      redirect: "login",
      reason: "Sign in to open this private workspace.",
    };
  if (user.accountStatus === "suspended")
    return {
      allowed: false,
      redirect: "account-suspended",
      reason: "This account is suspended.",
    };
  if (user.accountStatus !== "active")
    return {
      allowed: false,
      redirect: "access-denied",
      reason: "This account is not active.",
    };
  if (!user.emailVerified)
    return {
      allowed: false,
      redirect: "verify-email",
      reason: "Verify your email before entering the workspace.",
    };
  if (
    view.startsWith("admin/access") ||
    view.startsWith("admin/analytics") ||
    view.startsWith("admin/reports") ||
    view.startsWith("admin/privacy") ||
    view === "settings/privacy" ||
    view.startsWith("privacy/request") ||
    view === "buyer/analytics" ||
    view === "artist/analytics"
  ) {
    const decision = canAccessRoute(view, buildAuthorizationContext(user.id));
    if (!decision.allowed)
      return {
        allowed: false,
        redirect: "access-denied",
        reason:
          decision.reason || "Administrative access permission is required.",
      };
  }
  if (
    [
      "buyer",
      "buyer-quotes",
      "buyer-quote",
      "buyer-contracts",
      "buyer-contract",
      "signature",
      "signature-complete",
      "signature-declined",
      "signature-expired",
      "buyer-payments",
      "buyer-payment",
      "buyer-pay",
      "buyer-payment-success",
      "buyer-payment-failed",
      "buyer-payment-authentication",
      "buyer-payment-methods",
      "project",
      "membership",
      "membership-checkout",
      "membership-confirmation",
      "billing",
      "billing-payment-methods",
      "billing-subscription",
      "billing-cancel",
      "billing-reactivate",
      "billing-payment-failed",
    ].includes(view) &&
    !BUYER_ROLES.includes(user.role)
  )
    return {
      allowed: false,
      redirect: "access-denied",
      reason: "A buyer account is required for this workspace.",
    };
  if (
    [
      "admin-quotes",
      "admin-quotes-new",
      "admin-quote",
      "admin-quotes-analytics",
      "admin-pricing-rules",
    ].includes(view) &&
    (!INTERNAL_ROLES.includes(user.role) ||
      !roleHasPermission(user, "quotes.view"))
  )
    return {
      allowed: false,
      redirect: "access-denied",
      reason: "Internal quote operations permission is required.",
    };
  if (view === "admin-quotes-new" && !roleHasPermission(user, "quotes.create"))
    return {
      allowed: false,
      redirect: "access-denied",
      reason: "Quote creation permission is required.",
    };
  if (
    view === "admin-quotes-analytics" &&
    !roleHasPermission(user, "quotes.analytics")
  )
    return {
      allowed: false,
      redirect: "access-denied",
      reason: "Quote analytics permission is required.",
    };
  if (
    view === "admin-pricing-rules" &&
    !roleHasPermission(user, "quotes.manage_pricing")
  )
    return {
      allowed: false,
      redirect: "access-denied",
      reason: "Pricing-model permission is required.",
    };
  if (
    [
      "admin-contracts",
      "admin-contract-new",
      "admin-contract-detail",
      "admin-contract-templates",
      "admin-contract-clauses",
      "admin-contract-analytics",
    ].includes(view) &&
    (!INTERNAL_ROLES.includes(user.role) ||
      !roleHasPermission(user, "contracts.view"))
  )
    return {
      allowed: false,
      redirect: "access-denied",
      reason: "Internal contract-operations permission is required.",
    };
  if (
    view === "admin-contract-new" &&
    !roleHasPermission(user, "contracts.create")
  )
    return {
      allowed: false,
      redirect: "access-denied",
      reason: "Contract-generation permission is required.",
    };
  if (
    ["admin-contract-templates", "admin-contract-clauses"].includes(view) &&
    !roleHasPermission(
      user,
      view === "admin-contract-templates"
        ? "contracts.manage_templates"
        : "contracts.manage_clauses",
    )
  )
    return {
      allowed: false,
      redirect: "access-denied",
      reason: "Contract template or clause-management permission is required.",
    };
  if (
    view === "admin-contract-analytics" &&
    !roleHasPermission(user, "contracts.view_analytics")
  )
    return {
      allowed: false,
      redirect: "access-denied",
      reason: "Contract analytics permission is required.",
    };
  if (
    [
      "admin-payments",
      "admin-payment-detail",
      "admin-payment-reconciliation",
      "admin-refunds",
      "admin-credits",
      "admin-payment-analytics",
    ].includes(view) &&
    (!INTERNAL_ROLES.includes(user.role) ||
      !roleHasPermission(user, "payments.view"))
  )
    return {
      allowed: false,
      redirect: "access-denied",
      reason: "Internal licensing-payment permission is required.",
    };
  if (
    view === "admin-payment-reconciliation" &&
    !roleHasPermission(user, "payments.reconcile")
  )
    return {
      allowed: false,
      redirect: "access-denied",
      reason: "Payment-reconciliation permission is required.",
    };
  if (
    ["admin-refunds", "admin-credits"].includes(view) &&
    !roleHasPermission(
      user,
      view === "admin-refunds"
        ? "payments.request_refund"
        : "payments.manage_credits",
    )
  )
    return {
      allowed: false,
      redirect: "access-denied",
      reason: "Finance refund or credit-management permission is required.",
    };
  if (
    view === "admin-payment-analytics" &&
    !roleHasPermission(user, "payments.view_analytics")
  )
    return {
      allowed: false,
      redirect: "access-denied",
      reason: "Payment analytics permission is required.",
    };
  if (
    [
      "admin-licences",
      "admin-licence-new",
      "admin-licence-detail",
      "admin-licence-expiring",
      "admin-licence-amendments",
      "admin-licence-renewals",
      "admin-licence-analytics",
    ].includes(view) &&
    (!INTERNAL_ROLES.includes(user.role) ||
      !roleHasPermission(user, "licences.view"))
  )
    return {
      allowed: false,
      redirect: "access-denied",
      reason: "Internal licence-operations permission is required.",
    };
  if (
    ["buyer-licences", "buyer-licence", "licence-print"].includes(view) &&
    !roleHasPermission(user, "licences.view_own") &&
    !roleHasPermission(user, "licences.view")
  )
    return {
      allowed: false,
      redirect: "access-denied",
      reason: "Licence workspace access is required.",
    };
  if (
    [
      "admin-deliveries",
      "admin-deliveries-new",
      "admin-delivery-detail",
      "admin-delivery-access",
      "admin-delivery-replacements",
      "admin-delivery-analytics",
    ].includes(view) &&
    (!INTERNAL_ROLES.includes(user.role) ||
      !roleHasPermission(user, "deliveries.view"))
  )
    return {
      allowed: false,
      redirect: "access-denied",
      reason: "Internal secure-delivery permission is required.",
    };
  if (
    ["buyer-deliveries", "buyer-delivery", "buyer-delivery-room"].includes(
      view,
    ) &&
    !roleHasPermission(user, "deliveries.view_own") &&
    !roleHasPermission(user, "deliveries.view")
  )
    return {
      allowed: false,
      redirect: "access-denied",
      reason: "Secure-delivery workspace access is required.",
    };
  if (
    [
      "admin-expiring-access",
      "admin-expiring-access-detail",
      "admin-expiring-access-policies",
      "admin-expiring-access-security",
      "admin-expiring-access-analytics",
    ].includes(view) &&
    (!INTERNAL_ROLES.includes(user.role) ||
      !roleHasPermission(user, "expiring_access.view"))
  )
    return {
      allowed: false,
      redirect: "access-denied",
      reason: "Internal temporary-access permission is required.",
    };
  if (
    [
      "admin-audit",
      "admin-audit-event",
      "admin-audit-security",
      "admin-audit-exports",
      "admin-audit-settings",
      "admin-audit-analytics",
    ].includes(view) &&
    (!INTERNAL_ROLES.includes(user.role) ||
      !roleHasPermission(user, "audit.view"))
  )
    return {
      allowed: false,
      redirect: "access-denied",
      reason: "Internal audit-evidence permission is required.",
    };
  if (
    [
      "admin/email",
      "admin/email/queue",
      "admin/email/messages",
      "admin/email/message",
      "admin/email/templates",
      "admin/email/template",
      "admin/email/triggers",
      "admin/email/preferences",
      "admin/email/failures",
      "admin/email/analytics",
    ].includes(view) &&
    (!INTERNAL_ROLES.includes(user.role) ||
      !roleHasPermission(user, "email.view"))
  )
    return {
      allowed: false,
      redirect: "access-denied",
      reason: "Internal email-notification permission is required.",
    };
  if (
    ["billing-invoices", "billing-invoice"].includes(view) &&
    !BUYER_ROLES.includes(user.role) &&
    !roleHasPermission(user, "billing.view_invoices")
  )
    return {
      allowed: false,
      redirect: "access-denied",
      reason: "Billing invoice access is required.",
    };
  if (view === "buyer-verification" && !BUYER_ROLES.includes(user.role))
    return {
      allowed: false,
      redirect: "access-denied",
      reason:
        "Buyer verification is available only to authenticated buyer accounts.",
    };
  if (view === "project") {
    const verification = buyerVerificationService.getByUser(user.id);
    const membership = membershipService.getCurrentMembership(user.id);
    const access = user.permissions?.includes("*")
      ? { has: () => true }
      : calculateEffectiveAccess(user, verification, membership);
    if (!access.has("projects.create"))
      return {
        allowed: false,
        redirect: "access-denied",
        reason:
          "An active eligible Professional Buyer or VIP membership and approved verification are required to open projects.",
      };
  }
  if (
    view === "artist-dashboard" &&
    user.role !== "artist" &&
    user.role !== "super_administrator"
  )
    return {
      allowed: false,
      redirect: "access-denied",
      reason: "This workspace is limited to artists and rightsholders.",
    };
  if (view === "admin" && !INTERNAL_ROLES.includes(user.role))
    return {
      allowed: false,
      redirect: "access-denied",
      reason: "An internal beatmondo role is required.",
    };
  if (view === "admin-users" && !roleHasPermission(user, "users.manage"))
    return {
      allowed: false,
      redirect: "access-denied",
      reason: "Super-administrator permission is required.",
    };
  if (
    ["admin-verifications", "admin-verification-detail"].includes(view) &&
    !roleHasPermission(user, "buyers.view")
  )
    return {
      allowed: false,
      redirect: "access-denied",
      reason: "Buyer verification review permission is required.",
    };
  if (
    ["admin-memberships", "admin-membership-detail"].includes(view) &&
    !roleHasPermission(user, "memberships.view")
  )
    return {
      allowed: false,
      redirect: "access-denied",
      reason: "Membership operations permission is required.",
    };
  if (
    [
      "admin-rights",
      "admin-rights-track",
      "admin-rights-parties",
      "admin-rights-documents",
      "admin-rights-reviews",
      "admin-rights-disputes",
      "admin-rights-expiring",
    ].includes(view) &&
    !roleHasPermission(user, "rights.view")
  )
    return {
      allowed: false,
      redirect: "access-denied",
      reason: "Rights Database permission is required.",
    };
  if (view === "artist-rights" && user.role !== "artist")
    return {
      allowed: false,
      redirect: "access-denied",
      reason:
        "This rights view is limited to the authenticated artist or rightsholder catalog.",
    };
  if (
    [
      "admin-previews",
      "admin-previews-queue",
      "admin-previews-preview",
    ].includes(view) &&
    !roleHasPermission(user, "previews.view")
  )
    return {
      allowed: false,
      redirect: "access-denied",
      reason: "Watermarked Preview review permission is required.",
    };
  if (
    view === "admin-previews-new" &&
    !roleHasPermission(user, "previews.create")
  )
    return {
      allowed: false,
      redirect: "access-denied",
      reason: "Watermarked Preview creation permission is required.",
    };
  if (
    view === "admin-previews-generation" &&
    !roleHasPermission(user, "previews.generate")
  )
    return {
      allowed: false,
      redirect: "access-denied",
      reason: "Preview-generation permission is required.",
    };
  if (
    view === "admin-previews-policies" &&
    !roleHasPermission(user, "previews.manage_policies")
  )
    return {
      allowed: false,
      redirect: "access-denied",
      reason: "Preview-policy management permission is required.",
    };
  if (
    view === "admin-previews-access" &&
    !roleHasPermission(user, "previews.view_analytics")
  )
    return {
      allowed: false,
      redirect: "access-denied",
      reason: "Preview analytics permission is required.",
    };
  if (view === "artist-previews" && user.role !== "artist")
    return {
      allowed: false,
      redirect: "access-denied",
      reason:
        "This preview review is limited to the authenticated artist organization.",
    };
  if (
    view === "buyer-private-previews" &&
    !roleHasPermission(user, "previews.private.view")
  )
    return {
      allowed: false,
      redirect: "access-denied",
      reason: "VIP private-preview access is required.",
    };
  if (
    [
      "admin-storage",
      "admin-storage-assets",
      "admin-storage-asset",
      "admin-storage-usage",
      "admin-storage-access",
      "admin-storage-processing",
    ].includes(view) &&
    !roleHasPermission(user, "storage.view")
  )
    return {
      allowed: false,
      redirect: "access-denied",
      reason: "File Storage and Streaming permission is required.",
    };
  if (view === "artist-files" && user.role !== "artist")
    return {
      allowed: false,
      redirect: "access-denied",
      reason:
        "This file view is limited to the authenticated artist organization.",
    };
  if (view === "buyer-media-access" && !BUYER_ROLES.includes(user.role))
    return {
      allowed: false,
      redirect: "access-denied",
      reason: "A buyer account is required for playback and delivery access.",
    };
  if (
    [
      "admin-ingestion",
      "admin-ingestion-new",
      "admin-ingestion-detail",
    ].includes(view) &&
    !roleHasPermission(user, "ingestion.view")
  )
    return {
      allowed: false,
      redirect: "access-denied",
      reason: "Track Ingestion permission is required.",
    };
  if (
    [
      "artist-submissions",
      "artist-submission-new",
      "artist-submission-detail",
    ].includes(view) &&
    user.role !== "artist" &&
    user.role !== "super_administrator"
  )
    return {
      allowed: false,
      redirect: "access-denied",
      reason:
        "This submission workspace is limited to the authenticated artist or rightsholder.",
    };
  if (
    ["admin-search", "admin-search-index"].includes(view) &&
    !roleHasPermission(user, "search.index.manage")
  )
    return {
      allowed: false,
      redirect: "access-denied",
      reason: "Search Infrastructure administration permission is required.",
    };
  if (
    ["investor", "system"].includes(view) &&
    user.role !== "super_administrator"
  )
    return {
      allowed: false,
      redirect: "access-denied",
      reason: "This internal prototype view is restricted.",
    };
  return { allowed: true };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [intendedView, setIntendedView] = useState(null);
  const [revision, setRevision] = useState(0);

  const refresh = useCallback(() => {
    const session = authService.getCurrentSession();
    if (session?.expired) {
      setUser(null);
      setSessionExpired(true);
    } else {
      setUser(authService.getCurrentUser());
      setSessionExpired(false);
    }
    setRevision((value) => value + 1);
  }, []);

  useEffect(() => {
    refresh();
    setReady(true);
  }, [refresh]);

  const login = useCallback(
    async (credentials) => {
      const result = await authService.login({
        ...credentials,
        intendedView: intendedView || credentials.intendedView,
      });
      if (result.ok && !result.requiresMfa) {
        setUser(result.user);
        setIntendedView(null);
        setSessionExpired(false);
      }
      setRevision((value) => value + 1);
      return result;
    },
    [intendedView],
  );

  const verifyMfa = useCallback(async (code, trustDevice) => {
    const result = await authService.verifyMfa(code, trustDevice);
    if (result.ok) {
      setUser(result.user);
      setIntendedView(null);
      setSessionExpired(false);
    }
    setRevision((value) => value + 1);
    return result;
  }, []);

  const logout = useCallback((allDevices = false) => {
    authService.logout(allDevices);
    setUser(null);
    setIntendedView(null);
    setRevision((value) => value + 1);
  }, []);
  const hasPermission = useCallback(
    (permission) =>
      roleHasPermission(user, permission) ||
      canPerform(permission, buildAuthorizationContext(user?.id), {}).allowed,
    [user],
  );
  const hasAnyPermission = useCallback(
    (permissions) =>
      permissions.some(
        (permission) =>
          roleHasPermission(user, permission) ||
          canPerform(permission, buildAuthorizationContext(user?.id), {})
            .allowed,
      ),
    [user],
  );

  const value = useMemo(
    () => ({
      user,
      ready,
      revision,
      sessionExpired,
      intendedView,
      setIntendedView,
      login,
      verifyMfa,
      logout,
      refresh,
      hasPermission,
      hasAnyPermission,
      defaultDestination: defaultDestinationFor(user),
      authService,
    }),
    [
      user,
      ready,
      revision,
      sessionExpired,
      intendedView,
      login,
      verifyMfa,
      logout,
      refresh,
      hasPermission,
      hasAnyPermission,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
