import {
  authService,
  readAuthState,
  writeAuthState,
} from "../auth/authService.js";
import { recordAuditEvent } from "../audit/auditService.js";
import {
  DEFAULT_EMAIL_STATE,
  EMAIL_STORAGE_KEY,
  SELECTED_EMAIL_KEY,
  SELECTED_TEMPLATE_KEY,
} from "./emailData.js";

const clone = (value) => JSON.parse(JSON.stringify(value));
const now = () => new Date().toISOString();
const uid = (prefix) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const can = (user, permission) =>
  user?.permissions?.includes("*") || user?.permissions?.includes(permission);
const parse = (raw) => {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};
const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
const priorityRank = { Urgent: 0, High: 1, Normal: 2, Low: 3 };
const retryMinutes = [0, 5, 30, 120];
const EMAIL_TRANSITIONS = {
  Draft: ["Scheduled", "Queued", "Cancelled", "Suppressed", "Expired"],
  Scheduled: ["Queued", "Cancelled", "Suppressed", "Expired"],
  Queued: ["Processing", "Cancelled", "Suppressed", "Expired"],
  Processing: ["Sent", "Deferred", "Failed", "Expired"],
  Sent: ["Delivered Simulation", "Failed", "Archived"],
  Deferred: ["Retry Scheduled", "Cancelled", "Expired"],
  Failed: ["Retry Scheduled", "Archived"],
  "Retry Scheduled": ["Queued", "Cancelled", "Expired"],
};
export function canTransitionEmailStatus(currentStatus, nextStatus) {
  if (nextStatus === "Archived") return currentStatus !== "Archived";
  return EMAIL_TRANSITIONS[currentStatus]?.includes(nextStatus) || false;
}

function normalize(value) {
  const base = clone(DEFAULT_EMAIL_STATE);
  if (!value || !Array.isArray(value.messages)) return base;
  return {
    ...base,
    ...value,
    templates: value.templates || base.templates,
    templateVersions: value.templateVersions || [],
    senderProfiles: value.senderProfiles || base.senderProfiles,
    triggers: value.triggers || base.triggers,
    triggerVersions: value.triggerVersions || [],
    messages: value.messages,
    attempts: value.attempts || [],
    retryJobs: value.retryJobs || [],
    deliverySimulations: value.deliverySimulations || [],
    cancellations: value.cancellations || [],
    deduplicationRecords: value.deduplicationRecords || [],
    preferences: value.preferences || base.preferences,
    analyticsEvents: value.analyticsEvents || [],
    failureAlerts: value.failureAlerts || [],
    sourceMessageKeys: value.sourceMessageKeys || [],
    queueSettings: { ...base.queueSettings, ...(value.queueSettings || {}) },
  };
}
export function writeEmailState(state) {
  const next = normalize(state);
  localStorage.setItem(EMAIL_STORAGE_KEY, JSON.stringify(next));
  return next;
}

function recipientFromUser(user, required = true) {
  if (!user?.email || !/^\S+@\S+\.\S+$/.test(user.email)) return null;
  return {
    recipientType:
      user.userType === "internal"
        ? "Internal User"
        : user.userType === "artist"
          ? "Artist"
          : "Buyer",
    userId: user.id,
    organizationId: user.organizationId,
    email: user.email,
    displayName: user.name,
    role: user.roleLabel,
    deliveryPreference: "Email and In-App",
    locale: "en-US",
    timezone: "America/New_York",
    required,
    cc: false,
    bcc: false,
  };
}

function syncExistingMessages(state) {
  const auth = readAuthState();
  let changed = false;
  auth.messages.forEach((item) => {
    const key = `auth:${item.id}`;
    if (item.emailMessageId || state.sourceMessageKeys.includes(key)) return;
    const user = auth.users.find((entry) => entry.id === item.userId);
    const recipient = recipientFromUser(user);
    if (!recipient) return;
    const safeBody =
      item.type === "security"
        ? String(item.body).replace(
            /\b\d{6}\b/g,
            "[Security code redacted after use]",
          )
        : item.body;
    state.sequence += 1;
    state.messages.unshift({
      id: uid("email-import"),
      reference: `BM-EMAIL-${new Date().getUTCFullYear()}-${String(state.sequence).padStart(6, "0")}`,
      templateId: null,
      templateKey: `legacy-${item.type || "notification"}`,
      templateVersion: 1,
      category:
        item.type === "security"
          ? "Security"
          : item.type === "verification"
            ? "Buyer Verification"
            : "Account",
      triggerEvent: `legacy.${item.type || "notification"}`,
      correlationId: item.correlationId || uid("email-correlation"),
      relatedEntityType: "In-App Notification",
      relatedEntityId: item.id,
      relatedReferences: [],
      senderProfileId:
        item.type === "security" ? "sender-security" : "sender-general",
      recipients: [recipient],
      subject: item.title,
      preheader: safeBody,
      htmlBody: `<table role="presentation" width="100%"><tr><td><h1>${escapeHtml(item.title)}</h1><p>${escapeHtml(safeBody)}</p></td></tr></table>`,
      textBody: `${item.title}\n\n${safeBody}`,
      status: "Delivered Simulation",
      priority: item.type === "security" ? "High" : "Normal",
      scheduledFor: null,
      queuedAt: item.createdAt,
      processingStartedAt: item.createdAt,
      sentAt: item.createdAt,
      deliveredAt: item.createdAt,
      failedAt: null,
      cancelledAt: null,
      retryCount: 0,
      maxRetries: 4,
      failureCode: null,
      failureMessage: null,
      deduplicationKey: key,
      preferenceDecision: "Historical in-app message imported",
      confidentiality: item.type === "security" ? "Restricted" : "Standard",
      expiresAt: null,
      metadata: {
        simulation: true,
        importedFromInApp: true,
        actionUrl: `#${item.action || "notifications"}`,
        actionLabel: "Open related workspace",
      },
      createdAt: item.createdAt,
      createdBy: "Existing prototype workflow",
      openedAt: null,
      openCount: 0,
      clickedAt: null,
      clickCount: 0,
      actionCompletedAt: null,
    });
    state.sourceMessageKeys.push(key);
    changed = true;
  });
  return changed;
}

export function readEmailState() {
  const raw = localStorage.getItem(EMAIL_STORAGE_KEY);
  const state = normalize(raw ? parse(raw) : null);
  const changed = syncExistingMessages(state);
  if (!raw || !parse(raw) || changed) writeEmailState(state);
  return state;
}
function mutate(fn) {
  const state = readEmailState();
  const result = fn(state);
  writeEmailState(state);
  return result;
}

function audit(
  action,
  result,
  user,
  subject,
  description,
  severity = "Informational",
  visibility = "Internal",
) {
  recordAuditEvent({
    module: "Email Notifications",
    category: "Notification",
    action,
    result,
    severity,
    user,
    entityType: subject?.type || "Email Message",
    entityId: subject?.id,
    subjectName: subject?.reference || subject?.name || action,
    description,
    visibility,
    confidentiality: visibility.includes("Restricted")
      ? "Restricted"
      : "Standard",
    metadata: { notificationLoopExcluded: true },
  });
}

function replaceVariables(input, variables, unresolved) {
  return String(input || "")
    .replace(/{{#([A-Z0-9_]+)}}([\s\S]*?){{\/\1}}/g, (_, key, content) =>
      variables[key]
        ? content.replaceAll(`{{${key}}}`, escapeHtml(variables[key]))
        : "",
    )
    .replace(/{{([A-Z0-9_]+)}}/g, (_, key) => {
      if (
        variables[key] === undefined ||
        variables[key] === null ||
        variables[key] === ""
      ) {
        unresolved.add(key);
        return `[${key}]`;
      }
      return escapeHtml(variables[key]);
    })
    .replace(/<script[\s\S]*?<\/script>/gi, "");
}

export function renderEmailTemplate(template, variables = {}, context = {}) {
  const unresolved = new Set();
  const safe = {
    SUPPORT_CONTACT: "support@beatmondo.example",
    CURRENT_YEAR: new Date().getUTCFullYear(),
    ACTION_LABEL: "Open beatmondo",
    ACTION_URL: "#notifications",
    ...variables,
  };
  const result = {
    subject: replaceVariables(template.subjectTemplate, safe, unresolved),
    preheader: replaceVariables(template.preheaderTemplate, safe, unresolved),
    htmlBody: replaceVariables(template.htmlTemplate, safe, unresolved),
    textBody: replaceVariables(template.textTemplate, safe, unresolved),
    unresolvedVariables: [...unresolved],
    warnings: [],
  };
  const missingRequired = template.requiredVariables.filter(
    (key) => !safe[key],
  );
  result.unresolvedVariables = [
    ...new Set([...result.unresolvedVariables, ...missingRequired]),
  ];
  if (result.unresolvedVariables.length)
    result.warnings.push(
      "Required variables remain unresolved; sending is blocked.",
    );
  if (context.preview)
    result.warnings.push("Preview only — no real email will be sent.");
  return result;
}

function preferenceKey(template) {
  if (template.key.includes("quote")) return "quoteReminders";
  if (template.key.includes("signature") || template.key.includes("contract"))
    return "contractReminders";
  if (template.category === "Payment") return "paymentReminders";
  if (template.key.includes("licence") || template.key.includes("renewal"))
    return "licenceRenewalReminders";
  if (template.key.includes("delivery")) return "deliveryReminders";
  return "optionalReminders";
}
function preferenceDecision(state, template, recipient, priority) {
  const pref = state.preferences.find(
    (item) => item.userId === recipient.userId,
  );
  if (template.transactional)
    return { allowed: true, reason: "Required transactional message" };
  if (!pref?.emailEnabled || pref?.[preferenceKey(template)] === false)
    return { allowed: false, reason: "Optional communication disabled" };
  if (priority !== "Urgent" && pref.quietHours?.enabled) {
    const hour = new Date().getHours();
    const start = Number(pref.quietHours.start.split(":")[0]);
    const end = Number(pref.quietHours.end.split(":")[0]);
    if (hour >= start || hour < end)
      return {
        allowed: true,
        deferred: true,
        reason: "Deferred for recipient quiet hours",
      };
  }
  return { allowed: true, reason: "Optional preference allowed" };
}

function resolveUsers(resolver, context = {}) {
  const auth = readAuthState();
  const byId = (id) => auth.users.find((item) => item.id === id);
  const target = context.userId && byId(context.userId);
  if (["primaryBuyer", "requiredSigner"].includes(resolver))
    return [target || byId("user-olivia")].filter(Boolean);
  if (resolver === "artistOwner")
    return [target || byId("user-marcus")].filter(Boolean);
  if (resolver === "deliveryNamedUsers")
    return [target || byId("user-olivia")].filter(Boolean);
  if (resolver === "rightsReviewers")
    return [byId("user-amelia")].filter(Boolean);
  if (resolver === "financeReviewers")
    return [byId("user-finance")].filter(Boolean);
  if (resolver === "mediaOperations")
    return [byId("user-noah")].filter(Boolean);
  if (resolver === "securityAdministrators")
    return [byId("user-preston")].filter(Boolean);
  return [target || byId("user-jordan")].filter(Boolean);
}

function syncInApp(message) {
  const auth = readAuthState();
  message.recipients
    .filter((item) => !item.bcc && item.userId)
    .forEach((recipient) => {
      const exists = auth.messages.some(
        (item) => item.emailMessageId === message.id,
      );
      if (!exists)
        auth.messages.unshift({
          id: uid("message"),
          userId: recipient.userId,
          type: message.category.toLowerCase().replaceAll(" ", "-"),
          title: message.subject,
          body: message.preheader,
          createdAt: message.createdAt,
          read: false,
          action:
            message.metadata?.actionUrl?.replace(/^#/, "") || "notifications",
          emailMessageId: message.id,
          correlationId: message.correlationId,
        });
    });
  writeAuthState(auth);
}

function messageVisibilityCategory(user) {
  if (can(user, "*")) return null;
  if (user?.role === "finance_manager") return ["Payment", "Billing"];
  if (user?.role === "licensing_manager")
    return [
      "Buyer Verification",
      "Rights",
      "Quote",
      "Contract",
      "Signature",
      "Licence",
      "Delivery",
      "Temporary Access",
    ];
  if (user?.role === "catalog_manager")
    return [
      "Catalog",
      "Track Ingestion",
      "Preview",
      "Quote",
      "Contract",
      "Signature",
      "Licence",
      "Delivery",
      "Artist Submission",
      "System",
    ];
  if (user?.role === "media_operations")
    return [
      "Catalog",
      "Track Ingestion",
      "Preview",
      "Delivery",
      "Artist Submission",
      "System",
    ];
  return [];
}

export function canViewEmailMessage(
  message,
  user = authService.getCurrentUser(),
) {
  if (!user) return false;
  if (
    user.userType !== "internal" &&
    ["Suppressed", "Duplicate Prevented", "Cancelled"].includes(message.status)
  )
    return false;
  if (message.recipients.some((item) => item.userId === user.id)) return true;
  if (user.userType !== "internal")
    return (
      can(user, "email.view_organization") &&
      message.recipients.some(
        (item) => item.organizationId === user.organizationId,
      )
    );
  if (!can(user, "email.view") && !can(user, "email.view_internal"))
    return false;
  if (
    ["Highly Confidential", "Restricted"].includes(message.confidentiality) &&
    !can(user, "email.view_confidential")
  )
    return false;
  const allowed = messageVisibilityCategory(user);
  return allowed === null || allowed.includes(message.category);
}

function buildMessage(
  state,
  template,
  trigger,
  recipients,
  variables,
  context,
  rendered,
  decision,
) {
  state.sequence += 1;
  const createdAt = now();
  const status = !decision.allowed
    ? "Suppressed"
    : decision.deferred
      ? "Scheduled"
      : trigger.delayMinutes || context.scheduledFor
        ? "Scheduled"
        : "Queued";
  return {
    id: uid("email-message"),
    reference: `BM-EMAIL-${new Date().getUTCFullYear()}-${String(state.sequence).padStart(6, "0")}`,
    templateId: template.id,
    templateKey: template.key,
    templateVersion: template.version,
    category: template.category,
    triggerEvent: trigger.key,
    correlationId: context.correlationId || uid("email-correlation"),
    relatedEntityType: context.relatedEntityType || template.category,
    relatedEntityId: context.relatedEntityId || null,
    relatedReferences: context.relatedReferences || [],
    senderProfileId: template.defaultSenderProfileId,
    recipients,
    ...rendered,
    status,
    priority: context.priority || trigger.priority,
    scheduledFor:
      status === "Scheduled"
        ? context.scheduledFor ||
          new Date(
            Date.now() + (trigger.delayMinutes || 60) * 60000,
          ).toISOString()
        : null,
    queuedAt: status === "Queued" ? createdAt : null,
    processingStartedAt: null,
    sentAt: null,
    deliveredAt: null,
    failedAt: null,
    cancelledAt: null,
    retryCount: 0,
    maxRetries: 4,
    failureCode: status === "Suppressed" ? "PREFERENCE_SUPPRESSED" : null,
    failureMessage: null,
    deduplicationKey:
      context.deduplicationKey ||
      `${template.key}:${recipients.map((item) => item.userId).join(",")}:${context.relatedEntityId || "general"}:${context.triggerOccurrence || "current"}`,
    preferenceDecision: decision.reason,
    confidentiality: template.confidentiality,
    expiresAt: context.expiresAt || null,
    metadata: {
      simulation: true,
      actionUrl: variables.ACTION_URL || "#notifications",
      actionLabel: variables.ACTION_LABEL || "Open beatmondo",
      recursionDepth: context.recursionDepth || 0,
    },
    createdAt,
    createdBy: context.createdBy || "Beatmondo Demo Automation",
    openedAt: null,
    openCount: 0,
    clickedAt: null,
    clickCount: 0,
    actionCompletedAt: null,
  };
}

export const emailService = {
  read: readEmailState,
  canView: canViewEmailMessage,
  render: renderEmailTemplate,
  getTemplates() {
    return readEmailState().templates;
  },
  getTemplate(id) {
    return (
      readEmailState().templates.find(
        (item) => item.id === id || item.key === id,
      ) || null
    );
  },
  getTriggers() {
    return readEmailState().triggers;
  },
  getSenderProfiles() {
    return readEmailState().senderProfiles;
  },
  resolveRecipients(resolver, context) {
    return resolveUsers(resolver, context)
      .map((user) => recipientFromUser(user))
      .filter(Boolean);
  },
  createNotificationFromEvent(event, context = {}) {
    if (context.recursionDepth > 1 || event.module === "Email Notifications")
      return { created: [], excluded: true };
    return mutate((state) => {
      const trigger = state.triggers.find(
        (item) => item.enabled && item.key === event.type,
      );
      if (!trigger)
        return { created: [], reason: "No enabled email trigger matched." };
      const template = state.templates.find(
        (item) => item.key === trigger.templateKey && item.status === "Active",
      );
      if (!template)
        return { created: [], error: "Active email template not found." };
      const recipients = this.resolveRecipients(trigger.recipientResolver, {
        ...context,
        userId: context.userId || event.userId,
      });
      if (!recipients.length)
        return {
          created: [],
          error: "No valid authorized recipient was resolved.",
        };
      const variables = {
        USER_FIRST_NAME: recipients[0].displayName.split(" ")[0],
        USER_FULL_NAME: recipients[0].displayName,
        ORGANIZATION_NAME: context.organizationName || "your organization",
        ACTION_LABEL: context.actionLabel || "Open related workspace",
        ACTION_URL: context.actionUrl || "#notifications",
        REFERENCE: context.reference || "",
        QUOTE_REFERENCE: context.reference || "Quote",
        CONTRACT_REFERENCE: context.reference || "Contract",
        INVOICE_REFERENCE: context.reference || "Invoice",
        LICENCE_REFERENCE: context.reference || "Licence",
        DELIVERY_REFERENCE: context.reference || "Delivery",
        TRACK_TITLE: context.trackTitle || context.reference || "Track",
        CURRENT_YEAR: new Date().getUTCFullYear(),
        ...(context.variables || {}),
      };
      const rendered = renderEmailTemplate(template, variables);
      if (rendered.unresolvedVariables.length)
        return {
          created: [],
          error: `Missing variables: ${rendered.unresolvedVariables.join(", ")}`,
        };
      const dedupeKey =
        context.deduplicationKey ||
        `${template.key}:${recipients.map((item) => item.userId).join(",")}:${context.relatedEntityId || "general"}:${context.triggerOccurrence || "current"}`;
      const duplicate = state.messages.find(
        (item) =>
          item.deduplicationKey === dedupeKey && item.status !== "Cancelled",
      );
      if (duplicate) {
        const record = buildMessage(
          state,
          template,
          trigger,
          recipients,
          variables,
          { ...context, deduplicationKey: dedupeKey },
          rendered,
          { allowed: true, reason: "Duplicate prevented" },
        );
        record.status = "Duplicate Prevented";
        record.failureCode = "DUPLICATE_PREVENTED";
        state.messages.unshift(record);
        state.deduplicationRecords.unshift({
          id: uid("dedupe"),
          messageId: record.id,
          key: dedupeKey,
          status: "Prevented",
          matchedMessageId: duplicate.id,
          createdAt: now(),
        });
        audit(
          "Email duplicate prevented",
          "Duplicate Prevented",
          context.user,
          record,
          `Duplicate of ${duplicate.reference} was not delivered.`,
        );
        return { created: [record], duplicate: true };
      }
      const decision = preferenceDecision(
        state,
        template,
        recipients[0],
        context.priority || trigger.priority,
      );
      const message = buildMessage(
        state,
        template,
        trigger,
        recipients,
        variables,
        { ...context, deduplicationKey: dedupeKey },
        rendered,
        decision,
      );
      state.messages.unshift(message);
      if (trigger.channel.includes("In-App") && decision.allowed)
        syncInApp(message);
      audit(
        "Email created",
        message.status,
        context.user,
        message,
        `${message.reference} created from ${trigger.key}; delivery remains simulated.`,
      );
      return { created: [message], preferenceDecision: decision };
    });
  },
  createManualMessage(payload, user = authService.getCurrentUser()) {
    if (!can(user, "email.create_manual"))
      throw new Error("Controlled manual-message permission is required.");
    return mutate((state) => {
      const template = state.templates.find(
        (item) => item.key === payload.templateKey && item.status === "Active",
      );
      const recipientUser = readAuthState().users.find(
        (item) => item.id === payload.userId,
      );
      const recipient = recipientFromUser(recipientUser);
      if (!template || !recipient)
        throw new Error("Select an active template and a valid recipient.");
      const audience =
        recipientUser.userType === "internal"
          ? "Internal"
          : recipientUser.userType === "artist"
            ? "Artist"
            : "Buyer";
      if (
        !template.audience.some(
          (item) =>
            item === "Any Authenticated User" || item.includes(audience),
        )
      )
        throw new Error(
          "The selected recipient is outside this template audience.",
        );
      if (
        ["Security", "Authentication"].includes(template.category) &&
        !can(user, "email.override")
      )
        throw new Error(
          "Security templates require administrator override permission.",
        );
      const variables = {
        USER_FIRST_NAME: recipient.displayName.split(" ")[0],
        USER_FULL_NAME: recipient.displayName,
        ORGANIZATION_NAME: recipientUser.organization,
        ACTION_LABEL: "Open related workspace",
        ACTION_URL: payload.actionUrl || "#notifications",
        REFERENCE: payload.reference,
        QUOTE_REFERENCE: payload.reference,
        CONTRACT_REFERENCE: payload.reference,
        INVOICE_REFERENCE: payload.reference,
        LICENCE_REFERENCE: payload.reference,
        DELIVERY_REFERENCE: payload.reference,
        TRACK_TITLE: payload.reference,
        CURRENT_YEAR: new Date().getUTCFullYear(),
      };
      const rendered = renderEmailTemplate(template, variables);
      if (rendered.unresolvedVariables.length)
        throw new Error(
          `Missing variables: ${rendered.unresolvedVariables.join(", ")}`,
        );
      const trigger = {
        key: "manual.controlled",
        priority: payload.priority || "Normal",
        delayMinutes: 0,
      };
      const decision = preferenceDecision(
        state,
        template,
        recipient,
        trigger.priority,
      );
      const message = buildMessage(
        state,
        template,
        trigger,
        [recipient],
        variables,
        {
          relatedEntityType: payload.relatedEntityType || "Operational Record",
          relatedEntityId: payload.relatedEntityId,
          relatedReferences: [payload.reference],
          scheduledFor: payload.scheduledFor || null,
          createdBy: user.name,
          user,
          deduplicationKey: `manual:${template.key}:${recipient.userId}:${payload.relatedEntityId}:${payload.reference}`,
        },
        rendered,
        decision,
      );
      state.messages.unshift(message);
      syncInApp(message);
      audit(
        "Manual email created",
        message.status,
        user,
        message,
        payload.reason ||
          "Controlled operational message created from an approved template.",
        "Medium",
      );
      return message;
    });
  },
  generateReminderJobs(user = authService.getCurrentUser()) {
    if (!can(user, "email.process_queue"))
      throw new Error("Queue-processing permission is required.");
    const occurrence = "reminder-window-2026-07-16";
    return [
      ["quote.expiring", "quote-41", "BM-Q-2026-0041", "#buyer-quote"],
      [
        "delivery.expiring",
        "delivery-package-16",
        "BM-DEL-2026-0016",
        "#buyer-delivery",
      ],
      ["licence.expiring", "licence-18", "BM-LIC-2026-0018", "#buyer-licence"],
    ].map(([type, relatedEntityId, reference, actionUrl]) =>
      this.createNotificationFromEvent(
        { type },
        {
          userId: "user-olivia",
          relatedEntityId,
          reference,
          actionUrl,
          scheduledFor: new Date(Date.now() + 60 * 60000).toISOString(),
          triggerOccurrence: occurrence,
          createdBy: user.name,
          user,
        },
      ),
    );
  },
  query(filters = {}, user = authService.getCurrentUser()) {
    const search = String(filters.search || "").toLowerCase();
    const all = readEmailState()
      .messages.filter((item) => canViewEmailMessage(item, user))
      .filter(
        (item) =>
          (!search ||
            [
              item.reference,
              item.subject,
              item.templateKey,
              item.recipients
                .map((recipient) => recipient.displayName)
                .join(" "),
              item.relatedReferences.join(" "),
            ]
              .join(" ")
              .toLowerCase()
              .includes(search)) &&
          (!filters.status ||
            filters.status === "All" ||
            item.status === filters.status) &&
          (!filters.category ||
            filters.category === "All" ||
            item.category === filters.category) &&
          (!filters.priority ||
            filters.priority === "All" ||
            item.priority === filters.priority),
      )
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return {
      all,
      total: all.length,
      messages: all.slice(0, filters.limit || 100),
    };
  },
  selectMessage(id) {
    localStorage.setItem(SELECTED_EMAIL_KEY, id);
  },
  getSelectedMessage(user) {
    const item = readEmailState().messages.find(
      (entry) => entry.id === localStorage.getItem(SELECTED_EMAIL_KEY),
    );
    return item && canViewEmailMessage(item, user) ? item : null;
  },
  selectTemplate(id) {
    localStorage.setItem(SELECTED_TEMPLATE_KEY, id);
  },
  getSelectedTemplate() {
    return this.getTemplate(localStorage.getItem(SELECTED_TEMPLATE_KEY));
  },
  getPreferences(userId) {
    return (
      readEmailState().preferences.find((item) => item.userId === userId) ||
      null
    );
  },
  updatePreferences(userId, changes, user = authService.getCurrentUser()) {
    if (user?.id !== userId && !can(user, "email.manage_preferences"))
      throw new Error("You cannot change these communication preferences.");
    return mutate((state) => {
      let pref = state.preferences.find((item) => item.userId === userId);
      if (!pref) {
        pref = { ...clone(DEFAULT_EMAIL_STATE.preferences[0]), userId };
        state.preferences.push(pref);
      }
      Object.assign(pref, clone(changes), { updatedAt: now() });
      audit(
        "Email preference changed",
        "Success",
        user,
        { id: userId, reference: userId },
        "Optional communication and quiet-hour preferences updated.",
      );
      return clone(pref);
    });
  },
  processQueue(options = {}, user = authService.getCurrentUser()) {
    if (!can(user, "email.process_queue"))
      throw new Error("Queue-processing permission is required.");
    return mutate((state) => {
      if (state.queuePaused) throw new Error("The email queue is paused.");
      const eligible = state.messages
        .filter(
          (item) =>
            ["Queued", "Retry Scheduled", "Scheduled", "Deferred"].includes(
              item.status,
            ) &&
            (!item.scheduledFor ||
              new Date(item.scheduledFor) <= new Date() ||
              options.includeScheduled),
        )
        .sort(
          (a, b) =>
            priorityRank[a.priority] - priorityRank[b.priority] ||
            new Date(a.createdAt) - new Date(b.createdAt),
        );
      const selected = eligible.slice(
        0,
        options.all ? state.queueSettings.batchSize : 1,
      );
      selected.forEach((message, index) => {
        message.status = "Processing";
        message.processingStartedAt = now();
        const fail = state.queueSettings.failNext && index === 0;
        const invalid = message.recipients.some(
          (item) => !/^\S+@\S+\.\S+$/.test(item.email),
        );
        const expired =
          message.expiresAt && new Date(message.expiresAt) <= new Date();
        const attempt = {
          id: uid("email-attempt"),
          messageId: message.id,
          attempt: message.retryCount + 1,
          scheduledAt: message.scheduledFor || now(),
          startedAt: now(),
          completedAt: now(),
          result: null,
          failureCode: null,
          failureReason: null,
          retryable: true,
          simulation: true,
        };
        if (expired) {
          message.status = "Expired";
          message.failureCode = "MESSAGE_EXPIRED";
          attempt.result = "Expired";
          attempt.retryable = false;
        } else if (invalid) {
          message.status = "Failed";
          message.failureCode = "INVALID_EMAIL";
          message.failureMessage = "Recipient email is invalid.";
          message.failedAt = now();
          attempt.result = "Invalid Recipient";
          attempt.failureCode = message.failureCode;
          attempt.retryable = false;
        } else if (fail) {
          message.status = "Failed";
          message.failureCode = "PROVIDER_ERROR_SIMULATION";
          message.failureMessage =
            "Simulated provider error; no real provider was contacted.";
          message.failedAt = now();
          attempt.result = "Provider Error";
          attempt.failureCode = message.failureCode;
          attempt.failureReason = message.failureMessage;
          state.queueSettings.failNext = false;
        } else {
          message.status = "Delivered Simulation";
          message.sentAt = now();
          message.deliveredAt = now();
          message.failureCode = null;
          message.failureMessage = null;
          attempt.result = "Delivered";
          state.deliverySimulations.unshift({
            id: uid("delivery-simulation"),
            messageId: message.id,
            outcome: "Delivered",
            provider: "Prototype simulation",
            createdAt: now(),
          });
        }
        state.attempts.unshift(attempt);
        if (
          message.status === "Failed" &&
          [
            "signature-requested",
            "payment-failed",
            "licence-issued",
            "delivery-ready",
            "verification-approved",
            "suspicious-login",
          ].includes(message.templateKey)
        )
          state.failureAlerts.unshift({
            id: uid("email-alert"),
            messageId: message.id,
            severity: "High",
            status: "Open",
            assignedTo: null,
            createdAt: now(),
          });
        audit(
          "Email processed",
          message.status,
          user,
          message,
          `${message.reference} processing ended as ${message.status}; no real email was sent.`,
          message.status === "Failed" ? "High" : "Informational",
        );
      });
      return selected;
    });
  },
  setFailNext(value, user = authService.getCurrentUser()) {
    if (!can(user, "email.process_queue"))
      throw new Error("Queue permission is required.");
    return mutate((state) => {
      state.queueSettings.failNext = value;
      return value;
    });
  },
  setQueuePaused(value, user = authService.getCurrentUser()) {
    if (!can(user, "email.pause_queue"))
      throw new Error("Queue permission is required.");
    return mutate((state) => {
      state.queuePaused = value;
      audit(
        value ? "Email queue paused" : "Email queue resumed",
        "Success",
        user,
        { id: "email-queue", reference: "Email queue" },
        `Email queue ${value ? "paused" : "resumed"}.`,
      );
      return value;
    });
  },
  retryMessage(id, user = authService.getCurrentUser()) {
    if (!can(user, "email.retry"))
      throw new Error("Email retry permission is required.");
    return mutate((state) => {
      const item = state.messages.find((message) => message.id === id);
      if (!item) throw new Error("Message not found.");
      if (
        [
          "INVALID_EMAIL",
          "RECIPIENT_UNAUTHORIZED",
          "MESSAGE_EXPIRED",
          "UNDERLYING_EVENT_CANCELLED",
        ].includes(item.failureCode)
      )
        throw new Error("This failure is not retryable.");
      if (item.retryCount >= item.maxRetries)
        throw new Error("The retry policy is exhausted.");
      item.retryCount += 1;
      item.status = "Retry Scheduled";
      item.scheduledFor = new Date(
        Date.now() +
          retryMinutes[Math.min(item.retryCount, retryMinutes.length - 1)] *
            60000,
      ).toISOString();
      state.retryJobs.unshift({
        id: uid("email-retry"),
        originalMessageId: item.id,
        attempt: item.retryCount + 1,
        scheduledAt: item.scheduledFor,
        failureReason: item.failureMessage,
        previousAttempt: item.retryCount,
        final: item.retryCount >= item.maxRetries,
        result: "Scheduled",
      });
      audit(
        "Email retry scheduled",
        "Retry Scheduled",
        user,
        item,
        `${item.reference} retry ${item.retryCount} scheduled.`,
      );
      return item;
    });
  },
  cancelMessage(id, reason, user = authService.getCurrentUser()) {
    if (!can(user, "email.cancel"))
      throw new Error("Email cancellation permission is required.");
    return mutate((state) => {
      const item = state.messages.find((message) => message.id === id);
      if (
        !item ||
        ![
          "Draft",
          "Scheduled",
          "Queued",
          "Retry Scheduled",
          "Deferred",
        ].includes(item.status)
      )
        throw new Error("This message can no longer be cancelled.");
      item.status = "Cancelled";
      item.cancelledAt = now();
      item.cancellationReason = reason;
      state.cancellations.unshift({
        id: uid("email-cancel"),
        messageId: id,
        reason,
        actor: user.name,
        createdAt: now(),
      });
      audit("Email cancelled", "Cancelled", user, item, reason, "Medium");
      return item;
    });
  },
  simulateEngagement(id, type, user = authService.getCurrentUser()) {
    return mutate((state) => {
      const item = state.messages.find((message) => message.id === id);
      if (!item || !canViewEmailMessage(item, user))
        throw new Error("Message unavailable.");
      if (["Security", "Authentication"].includes(item.category))
        throw new Error(
          "Engagement tracking is disabled for this sensitive message.",
        );
      if (type === "open") {
        item.openedAt = now();
        item.openCount += 1;
      } else {
        item.clickedAt = now();
        item.clickCount += 1;
      }
      return item;
    });
  },
  createTemplateDraft(sourceId, user = authService.getCurrentUser()) {
    if (!can(user, "email.manage_templates"))
      throw new Error("Template-management permission is required.");
    return mutate((state) => {
      const source = state.templates.find((item) => item.id === sourceId);
      if (!source) throw new Error("Template not found.");
      source.status = source.status === "Active" ? "Active" : source.status;
      const draft = {
        ...clone(source),
        id: uid("email-template"),
        status: "Draft",
        version: source.version + 1,
        createdAt: now(),
        createdBy: user.name,
        updatedAt: now(),
        updatedBy: user.name,
        previousTemplateId: source.id,
      };
      state.templates.unshift(draft);
      state.templateVersions.unshift({
        id: uid("template-version"),
        templateKey: draft.key,
        version: draft.version,
        sourceTemplateId: source.id,
        createdAt: now(),
        createdBy: user.name,
      });
      audit(
        "Email template draft created",
        "Success",
        user,
        draft,
        `${draft.name} v${draft.version} created from an immutable active version.`,
      );
      return draft;
    });
  },
  updateTemplate(id, changes, user = authService.getCurrentUser()) {
    if (!can(user, "email.manage_templates"))
      throw new Error("Template-management permission is required.");
    return mutate((state) => {
      const item = state.templates.find((template) => template.id === id);
      if (!item || item.status !== "Draft")
        throw new Error("Only draft templates may be edited.");
      Object.assign(item, clone(changes), {
        updatedAt: now(),
        updatedBy: user.name,
      });
      return item;
    });
  },
  transitionTemplate(id, status, user = authService.getCurrentUser()) {
    if (
      !["Under Review"].includes(status) &&
      !can(user, "email.approve_templates")
    )
      throw new Error("Template-approval permission is required.");
    return mutate((state) => {
      const item = state.templates.find((template) => template.id === id);
      item.status = status;
      item.updatedAt = now();
      item.updatedBy = user.name;
      audit(
        "Email template changed",
        "Success",
        user,
        item,
        `${item.name} v${item.version} moved to ${status}.`,
      );
      return item;
    });
  },
  updateTrigger(id, changes, user = authService.getCurrentUser()) {
    if (!can(user, "email.manage_triggers"))
      throw new Error("Trigger-management permission is required.");
    return mutate((state) => {
      const item = state.triggers.find((trigger) => trigger.id === id);
      state.triggerVersions.unshift({
        id: uid("trigger-version"),
        triggerId: id,
        version: item.version,
        snapshot: clone(item),
        createdAt: now(),
        createdBy: user.name,
      });
      Object.assign(item, clone(changes), {
        version: item.version + 1,
        updatedAt: now(),
        updatedBy: user.name,
      });
      audit(
        "Email trigger changed",
        "Success",
        user,
        item,
        `${item.key} updated to version ${item.version}.`,
      );
      return item;
    });
  },
  analytics(user = authService.getCurrentUser()) {
    const messages = this.query({}, user).all;
    const count = (key) =>
      messages.reduce(
        (map, item) => ({ ...map, [item[key]]: (map[item[key]] || 0) + 1 }),
        {},
      );
    const delivered = messages.filter(
      (item) => item.status === "Delivered Simulation",
    );
    return {
      total: messages.length,
      statuses: count("status"),
      categories: count("category"),
      priorities: count("priority"),
      delivered: delivered.length,
      failed: messages.filter((item) => item.status === "Failed").length,
      queued: messages.filter((item) =>
        ["Queued", "Scheduled", "Retry Scheduled", "Deferred"].includes(
          item.status,
        ),
      ).length,
      duplicates: messages.filter(
        (item) => item.status === "Duplicate Prevented",
      ).length,
      suppressed: messages.filter((item) => item.status === "Suppressed")
        .length,
      retryRate: messages.length
        ? Math.round(
            (messages.filter((item) => item.retryCount > 0).length /
              messages.length) *
              100,
          )
        : 0,
      openRate: delivered.length
        ? Math.round(
            (delivered.filter((item) => item.openedAt).length /
              delivered.length) *
              100,
          )
        : 0,
      clickRate: delivered.length
        ? Math.round(
            (delivered.filter((item) => item.clickedAt).length /
              delivered.length) *
              100,
          )
        : 0,
    };
  },
  reset() {
    localStorage.setItem(
      EMAIL_STORAGE_KEY,
      JSON.stringify(clone(DEFAULT_EMAIL_STATE)),
    );
    localStorage.removeItem(SELECTED_EMAIL_KEY);
    localStorage.removeItem(SELECTED_TEMPLATE_KEY);
    return readEmailState();
  },
};

export const createNotificationFromEvent = (event, context) =>
  emailService.createNotificationFromEvent(event, context);
export const resetEmailNotificationsDemoData = () => emailService.reset();
