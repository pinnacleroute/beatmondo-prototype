export const EMAIL_STORAGE_KEY = "beatmondo-email-notifications-v1";
export const SELECTED_EMAIL_KEY = "beatmondo-selected-email-message";
export const SELECTED_TEMPLATE_KEY = "beatmondo-selected-email-template";

export const EMAIL_STATUSES = [
  "Draft",
  "Scheduled",
  "Queued",
  "Processing",
  "Sent",
  "Delivered Simulation",
  "Deferred",
  "Failed",
  "Retry Scheduled",
  "Cancelled",
  "Expired",
  "Suppressed",
  "Duplicate Prevented",
  "Archived",
];
export const EMAIL_PRIORITIES = ["Urgent", "High", "Normal", "Low"];
export const EMAIL_CATEGORIES = [
  "Authentication",
  "Security",
  "Account",
  "Buyer Verification",
  "Membership",
  "Billing",
  "Rights",
  "Catalog",
  "Track Ingestion",
  "Preview",
  "Quote",
  "Contract",
  "Signature",
  "Payment",
  "Licence",
  "Delivery",
  "Temporary Access",
  "Artist Submission",
  "Administration",
  "System",
  "Marketing Preferences",
];

const sender = (id, name, email, use) => ({
  id,
  name,
  email,
  use,
  prototypePlaceholder: true,
  active: true,
});
export const DEFAULT_SENDER_PROFILES = [
  sender(
    "sender-general",
    "beatmondo",
    "notifications@beatmondo.example",
    "General transactional email",
  ),
  sender(
    "sender-licensing",
    "beatmondo Licensing",
    "licensing@beatmondo.example",
    "Quotes, contracts, licences, and delivery",
  ),
  sender(
    "sender-finance",
    "beatmondo Finance",
    "finance@beatmondo.example",
    "Invoices, payments, refunds, and credits",
  ),
  sender(
    "sender-rights",
    "beatmondo Rights",
    "rights@beatmondo.example",
    "Rights review and restrictions",
  ),
  sender(
    "sender-security",
    "beatmondo Security",
    "security@beatmondo.example",
    "Security and protected access",
  ),
];

const templateSpecs = [
  ["welcome", "Welcome to beatmondo", "Authentication", "Buyer", true],
  [
    "verify-email",
    "Verify Your Email",
    "Authentication",
    "Any Authenticated User",
    true,
  ],
  [
    "password-reset",
    "Password Reset Requested",
    "Security",
    "Any Authenticated User",
    true,
  ],
  [
    "password-changed",
    "Password Changed",
    "Security",
    "Any Authenticated User",
    true,
  ],
  ["mfa-enabled", "MFA Enabled", "Security", "Any Authenticated User", true],
  [
    "suspicious-login",
    "Suspicious Login Review",
    "Security",
    "Any Authenticated User",
    true,
  ],
  [
    "account-locked",
    "Account Temporarily Locked",
    "Security",
    "Any Authenticated User",
    true,
  ],
  [
    "account-restored",
    "Account Access Restored",
    "Account",
    "Any Authenticated User",
    true,
  ],
  [
    "verification-received",
    "Verification Application Received",
    "Buyer Verification",
    "Buyer",
    true,
  ],
  [
    "verification-info-required",
    "Additional Verification Information Required",
    "Buyer Verification",
    "Buyer",
    true,
  ],
  [
    "verification-approved",
    "Verification Approved",
    "Buyer Verification",
    "Buyer",
    true,
  ],
  [
    "verification-rejected",
    "Verification Rejected",
    "Buyer Verification",
    "Buyer",
    true,
  ],
  [
    "verification-suspended",
    "Verification Suspended",
    "Buyer Verification",
    "Buyer",
    true,
  ],
  [
    "reverification-required",
    "Reverification Required",
    "Buyer Verification",
    "Buyer",
    true,
  ],
  [
    "vip-verification-approved",
    "VIP Verification Approved",
    "Buyer Verification",
    "Buyer",
    true,
  ],
  ["membership-activated", "Membership Activated", "Membership", "Buyer", true],
  ["membership-upgraded", "Membership Upgraded", "Membership", "Buyer", true],
  [
    "membership-downgraded",
    "Membership Downgraded",
    "Membership",
    "Buyer",
    true,
  ],
  [
    "membership-payment-failed",
    "Membership Payment Failed",
    "Billing",
    "Buyer",
    true,
  ],
  ["grace-period-started", "Grace Period Started", "Billing", "Buyer", true],
  ["membership-cancelled", "Membership Cancelled", "Membership", "Buyer", true],
  ["membership-refund", "Membership Refund Issued", "Billing", "Buyer", true],
  [
    "submission-received",
    "Track Submission Received",
    "Artist Submission",
    "Artist",
    true,
  ],
  [
    "processing-failed",
    "Track Processing Failed",
    "Track Ingestion",
    "Artist",
    true,
  ],
  [
    "metadata-incomplete",
    "Metadata Incomplete",
    "Track Ingestion",
    "Artist",
    true,
  ],
  [
    "revision-requested",
    "Revision Requested",
    "Artist Submission",
    "Artist",
    true,
  ],
  [
    "resubmission-received",
    "Resubmission Received",
    "Artist Submission",
    "Artist",
    true,
  ],
  ["track-approved", "Track Approved", "Catalog", "Artist", true],
  ["track-published", "Track Published", "Catalog", "Artist", true],
  [
    "submission-rejected",
    "Submission Rejected",
    "Artist Submission",
    "Artist",
    true,
  ],
  ["quote-info-required", "Quote Information Required", "Quote", "Buyer", true],
  ["quote-available", "Quote Available", "Quote", "Buyer", true],
  ["quote-revised", "Quote Revised", "Quote", "Buyer", true],
  ["quote-expiring", "Quote Expiring", "Quote", "Buyer", false],
  ["quote-accepted", "Quote Accepted Confirmation", "Quote", "Buyer", true],
  ["quote-withdrawn", "Quote Withdrawn", "Quote", "Buyer", true],
  ["contract-ready", "Contract Ready for Review", "Contract", "Buyer", true],
  ["contract-revised", "Contract Revised", "Contract", "Buyer", true],
  ["signature-requested", "Signature Requested", "Signature", "Buyer", true],
  ["signature-reminder", "Signature Reminder", "Signature", "Buyer", false],
  ["signature-expiring", "Signature Expiring", "Signature", "Buyer", true],
  ["signature-completed", "Signature Completed", "Signature", "Buyer", true],
  ["contract-effective", "Contract Effective", "Contract", "Buyer", true],
  ["contract-cancelled", "Contract Cancelled", "Contract", "Buyer", true],
  [
    "invoice-available",
    "Licensing Invoice Available",
    "Payment",
    "Buyer",
    true,
  ],
  ["payment-succeeded", "Payment Succeeded", "Payment", "Buyer", true],
  ["payment-failed", "Payment Failed", "Payment", "Buyer", true],
  [
    "payment-auth-required",
    "Payment Authentication Required",
    "Payment",
    "Buyer",
    true,
  ],
  [
    "bank-transfer-review",
    "Bank Transfer Under Review",
    "Payment",
    "Buyer",
    true,
  ],
  [
    "bank-transfer-confirmed",
    "Bank Transfer Confirmed",
    "Payment",
    "Buyer",
    true,
  ],
  ["refund-issued", "Refund Issued", "Payment", "Buyer", true],
  ["account-credit", "Account Credit Available", "Payment", "Buyer", true],
  ["payment-past-due", "Payment Past Due", "Payment", "Buyer", true],
  ["licence-issued", "Licence Issued", "Licence", "Buyer", true],
  ["licence-active", "Licence Active", "Licence", "Buyer", true],
  ["delivery-ready", "Delivery Package Ready", "Delivery", "Buyer", true],
  ["asset-preparation", "Asset Preparation Pending", "Delivery", "Buyer", true],
  ["replacement-ready", "Replacement Asset Ready", "Delivery", "Buyer", true],
  ["delivery-expiring", "Delivery Expiring", "Delivery", "Buyer", false],
  ["download-limit", "Download Limit Reached", "Delivery", "Buyer", true],
  ["delivery-suspended", "Delivery Suspended", "Delivery", "Buyer", true],
  ["delivery-restored", "Delivery Restored", "Delivery", "Buyer", true],
  ["delivery-revoked", "Delivery Revoked", "Delivery", "Buyer", true],
  ["licence-expiring", "Licence Expiring", "Licence", "Buyer", false],
  ["renewal-available", "Renewal Available", "Licence", "Buyer", false],
  [
    "rights-review-required",
    "Rights Review Required",
    "Rights",
    "Internal Rights",
    true,
  ],
  [
    "quote-approval-required",
    "Quote Approval Required",
    "Quote",
    "Internal Licensing",
    true,
  ],
  [
    "contract-approval-required",
    "Contract Approval Required",
    "Contract",
    "Internal Legal",
    true,
  ],
  [
    "refund-approval-required",
    "Refund Approval Required",
    "Payment",
    "Internal Finance",
    true,
  ],
  [
    "delivery-approval-required",
    "Delivery Approval Required",
    "Delivery",
    "Internal Licensing",
    true,
  ],
  [
    "security-review-required",
    "Security Review Required",
    "Security",
    "Internal Security",
    true,
  ],
  [
    "high-audit-event",
    "High-Severity Audit Event",
    "Administration",
    "Administrator",
    true,
  ],
  [
    "bulk-revocation-complete",
    "Temporary Access Bulk Revocation Completed",
    "Temporary Access",
    "Internal Security",
    true,
  ],
  [
    "notification-failure",
    "System Notification Failure",
    "System",
    "Administrator",
    true,
  ],
];

const senderFor = (category) =>
  category === "Payment" || category === "Billing"
    ? "sender-finance"
    : category === "Rights"
      ? "sender-rights"
      : category === "Security" || category === "Authentication"
        ? "sender-security"
        : ["Quote", "Contract", "Signature", "Licence", "Delivery"].includes(
              category,
            )
          ? "sender-licensing"
          : "sender-general";
const variablesFor = (key) => {
  const variables = [
    "USER_FIRST_NAME",
    "ACTION_LABEL",
    "ACTION_URL",
    "CURRENT_YEAR",
  ];
  if (key.includes("quote")) variables.push("QUOTE_REFERENCE");
  if (key.includes("contract") || key.includes("signature"))
    variables.push("CONTRACT_REFERENCE");
  if (
    key.includes("payment") ||
    key.includes("invoice") ||
    key.includes("refund")
  )
    variables.push("INVOICE_REFERENCE");
  if (key.includes("licence") || key.includes("renewal"))
    variables.push("LICENCE_REFERENCE");
  if (
    key.includes("delivery") ||
    key.includes("download") ||
    key.includes("replacement") ||
    key.includes("asset-preparation")
  )
    variables.push("DELIVERY_REFERENCE");
  if (
    key.includes("track") ||
    key.includes("submission") ||
    key.includes("revision") ||
    key.includes("metadata") ||
    key.includes("processing")
  )
    variables.push("TRACK_TITLE");
  return [...new Set(variables)];
};
export const DEFAULT_EMAIL_TEMPLATES = templateSpecs.map(
  ([key, name, category, audience, transactional], index) => ({
    id: `email-template-${index + 1}`,
    key,
    name,
    category,
    description: `${name} transactional communication for the ${audience.toLowerCase()} workflow.`,
    status: "Active",
    version: 1,
    language: "en-US",
    audience: [audience],
    transactional,
    subjectTemplate: `${name}{{#REFERENCE}} · {{REFERENCE}}{{/REFERENCE}}`,
    preheaderTemplate: `${name} in your private beatmondo workspace.`,
    htmlTemplate: `<table role="presentation" width="100%"><tr><td><h1>${name}</h1><p>Hello {{USER_FIRST_NAME}},</p><p>Your beatmondo workflow has an update. Open the authenticated workspace for protected details.</p><p><a href="{{ACTION_URL}}">{{ACTION_LABEL}}</a></p><p>© {{CURRENT_YEAR}} beatmondo</p></td></tr></table>`,
    textTemplate: `${name}\n\nHello {{USER_FIRST_NAME}},\n\nYour beatmondo workflow has an update. Open the authenticated workspace for protected details.\n\n{{ACTION_LABEL}}: {{ACTION_URL}}\n\n© {{CURRENT_YEAR}} beatmondo`,
    requiredVariables: variablesFor(key),
    optionalVariables: [
      "ORGANIZATION_NAME",
      "PROJECT_NAME",
      "REFERENCE",
      "SUPPORT_CONTACT",
    ],
    defaultSenderProfileId: senderFor(category),
    replyToProfileId: senderFor(category),
    supportedTriggers: [key.replaceAll("-", ".")],
    confidentiality: ["Security", "Rights"].includes(category)
      ? "Restricted"
      : [
            "Payment",
            "Contract",
            "Signature",
            "Licence",
            "Delivery",
            "Quote",
          ].includes(category)
        ? "Confidential"
        : "Standard",
    approvals: [
      { type: "Operations", status: "Approved" },
      ...(["Contract", "Licence", "Rights"].includes(category)
        ? [{ type: "Legal", status: "Approved" }]
        : []),
      ...(["Security", "Authentication"].includes(category)
        ? [{ type: "Security", status: "Approved" }]
        : []),
      ...(["Payment", "Billing"].includes(category)
        ? [{ type: "Finance", status: "Approved" }]
        : []),
    ],
    createdAt: "2026-07-12T10:00:00.000Z",
    createdBy: "Preston Repenning",
    updatedAt: "2026-07-16T10:00:00.000Z",
    updatedBy: "Preston Repenning",
  }),
);

const triggerSpecs = [
  [
    "buyer.verification.submitted",
    "verification-received",
    "Buyer Verification",
    "Email and In-App",
    "primaryBuyer",
    "Normal",
  ],
  [
    "buyer.verification.information_required",
    "verification-info-required",
    "Buyer Verification",
    "Email and In-App",
    "primaryBuyer",
    "High",
  ],
  [
    "buyer.verification.approved",
    "verification-approved",
    "Buyer Verification",
    "Email and In-App",
    "primaryBuyer",
    "High",
  ],
  [
    "membership.payment_failed",
    "membership-payment-failed",
    "Membership Billing",
    "Email and In-App",
    "primaryBuyer",
    "Urgent",
  ],
  [
    "ingestion.submitted",
    "submission-received",
    "Track Ingestion",
    "Email and In-App",
    "artistOwner",
    "Normal",
  ],
  [
    "ingestion.revision_requested",
    "revision-requested",
    "Track Ingestion",
    "Email and In-App",
    "artistOwner",
    "High",
  ],
  [
    "quote.sent",
    "quote-available",
    "Quote Calculation",
    "Email and In-App",
    "primaryBuyer",
    "High",
  ],
  [
    "quote.expiring",
    "quote-expiring",
    "Quote Calculation",
    "Email and In-App",
    "primaryBuyer",
    "Normal",
  ],
  [
    "contract.signature_requested",
    "signature-requested",
    "Contracts and E-Signature",
    "Email and In-App",
    "requiredSigner",
    "Urgent",
  ],
  [
    "contract.signature_expiring",
    "signature-expiring",
    "Contracts and E-Signature",
    "Email and In-App",
    "requiredSigner",
    "Urgent",
  ],
  [
    "payment.succeeded",
    "payment-succeeded",
    "Payments",
    "Email and In-App",
    "primaryBuyer",
    "High",
  ],
  [
    "payment.failed",
    "payment-failed",
    "Payments",
    "Email and In-App",
    "primaryBuyer",
    "Urgent",
  ],
  [
    "licence.issued",
    "licence-issued",
    "Licence Generation",
    "Email and In-App",
    "primaryBuyer",
    "High",
  ],
  [
    "licence.expiring",
    "licence-expiring",
    "Licence Generation",
    "Email and In-App",
    "primaryBuyer",
    "Normal",
  ],
  [
    "delivery.activated",
    "delivery-ready",
    "Secure Delivery",
    "Email and In-App",
    "deliveryNamedUsers",
    "High",
  ],
  [
    "delivery.expiring",
    "delivery-expiring",
    "Secure Delivery",
    "Email and In-App",
    "deliveryNamedUsers",
    "Normal",
  ],
  [
    "delivery.revoked",
    "delivery-revoked",
    "Secure Delivery",
    "Email and In-App",
    "deliveryNamedUsers",
    "Urgent",
  ],
  [
    "access.security_review_required",
    "security-review-required",
    "Temporary Access",
    "Internal Email",
    "securityAdministrators",
    "Urgent",
  ],
  [
    "audit.high_severity_event",
    "high-audit-event",
    "Audit Logging",
    "Internal Email",
    "securityAdministrators",
    "Urgent",
  ],
];
export const DEFAULT_EMAIL_TRIGGERS = triggerSpecs.map(
  (
    [key, templateKey, module, channel, recipientResolver, priority],
    index,
  ) => ({
    id: `email-trigger-${index + 1}`,
    key,
    module,
    eventType: key,
    templateKey,
    channel,
    enabled: true,
    recipientResolver,
    delayMinutes: 0,
    scheduleRule: null,
    priority,
    deduplicationWindowMinutes: 1440,
    cancellationRules: [],
    conditions: [],
    version: 1,
    updatedAt: "2026-07-16T10:00:00.000Z",
    updatedBy: "Preston Repenning",
  }),
);

const seededMessages = [
  [
    "licence-issued",
    "user-olivia",
    "org-northstar",
    "Licence",
    "licence-18",
    "BM-LIC-2026-0018",
    "Delivered Simulation",
    "High",
  ],
  [
    "delivery-ready",
    "user-olivia",
    "org-northstar",
    "Delivery",
    "delivery-package-16",
    "BM-DEL-2026-0016",
    "Delivered Simulation",
    "High",
  ],
  [
    "verification-approved",
    "user-olivia",
    "org-northstar",
    "Buyer Verification",
    "verification-olivia",
    "Northstar verification",
    "Delivered Simulation",
    "High",
  ],
  [
    "payment-succeeded",
    "user-olivia",
    "org-northstar",
    "Payment",
    "payment-61",
    "BM-PAY-2026-0061",
    "Delivered Simulation",
    "High",
  ],
  [
    "quote-expiring",
    "user-olivia",
    "org-northstar",
    "Quote",
    "quote-41",
    "BM-Q-2026-0041",
    "Scheduled",
    "Normal",
  ],
  [
    "delivery-expiring",
    "user-olivia",
    "org-northstar",
    "Delivery",
    "delivery-package-16",
    "BM-DEL-2026-0016",
    "Scheduled",
    "Normal",
  ],
  [
    "licence-expiring",
    "user-olivia",
    "org-northstar",
    "Licence",
    "licence-18",
    "BM-LIC-2026-0018",
    "Scheduled",
    "Normal",
  ],
  [
    "notification-failure",
    "user-jordan",
    "org-beatmondo",
    "System",
    "notification-provider",
    "Email simulation provider",
    "Failed",
    "High",
  ],
  [
    "payment-failed",
    "user-sofia",
    "org-lighthouse",
    "Payment",
    "payment-failed-demo",
    "Licensing payment",
    "Retry Scheduled",
    "Urgent",
  ],
  [
    "invoice-available",
    "user-sofia",
    "org-lighthouse",
    "Payment",
    "invoice-paid-demo",
    "Paid invoice",
    "Cancelled",
    "Normal",
  ],
  [
    "quote-available",
    "user-olivia",
    "org-northstar",
    "Quote",
    "quote-41",
    "BM-Q-2026-0041",
    "Duplicate Prevented",
    "Normal",
  ],
  [
    "weekly-digest",
    "user-olivia",
    "org-northstar",
    "Marketing Preferences",
    "digest-week-28",
    "Weekly activity",
    "Suppressed",
    "Low",
  ],
  [
    "signature-requested",
    "user-olivia",
    "org-northstar",
    "Signature",
    "signature-21-buyer",
    "BM-C-2026-0021",
    "Delivered Simulation",
    "Urgent",
  ],
  [
    "contract-effective",
    "user-olivia",
    "org-northstar",
    "Contract",
    "contract-21",
    "BM-C-2026-0021",
    "Delivered Simulation",
    "High",
  ],
  [
    "submission-received",
    "user-marcus",
    "org-smyrk",
    "Artist Submission",
    "ingestion-smyrk-1",
    "The End of Jason Todd",
    "Delivered Simulation",
    "Normal",
  ],
  [
    "revision-requested",
    "user-marcus",
    "org-smyrk",
    "Artist Submission",
    "ingestion-smyrk-1",
    "The End of Jason Todd",
    "Queued",
    "High",
  ],
  [
    "track-published",
    "user-marcus",
    "org-smyrk",
    "Catalog",
    "track-15",
    "The End of Jason Todd",
    "Delivered Simulation",
    "Normal",
  ],
  [
    "rights-review-required",
    "user-amelia",
    "org-beatmondo",
    "Rights",
    "rights-8",
    "The Long Arrival",
    "Queued",
    "High",
  ],
  [
    "refund-approval-required",
    "user-finance",
    "org-beatmondo",
    "Payment",
    "refund-demo",
    "Refund review",
    "Queued",
    "High",
  ],
  [
    "security-review-required",
    "user-preston",
    "org-beatmondo",
    "Security",
    "access-112",
    "Temporary access review",
    "Queued",
    "Urgent",
  ],
  [
    "processing-failed",
    "user-marcus",
    "org-smyrk",
    "Track Ingestion",
    "ingestion-smyrk-2",
    "Processing job",
    "Failed",
    "High",
  ],
  [
    "metadata-incomplete",
    "user-marcus",
    "org-smyrk",
    "Track Ingestion",
    "ingestion-smyrk-3",
    "Incomplete draft",
    "Scheduled",
    "Low",
  ],
  [
    "verification-info-required",
    "user-ethan",
    "org-brightframe",
    "Buyer Verification",
    "verification-ethan",
    "BrightFrame verification",
    "Delivered Simulation",
    "High",
  ],
  [
    "membership-payment-failed",
    "user-sofia",
    "org-lighthouse",
    "Billing",
    "membership-sofia",
    "Professional Buyer",
    "Delivered Simulation",
    "Urgent",
  ],
  [
    "quote-revised",
    "user-olivia",
    "org-northstar",
    "Quote",
    "quote-51",
    "BM-Q-2026-0051",
    "Delivered Simulation",
    "High",
  ],
  [
    "payment-auth-required",
    "user-sofia",
    "org-lighthouse",
    "Payment",
    "invoice-sofia",
    "Licensing invoice",
    "Expired",
    "Urgent",
  ],
  [
    "bank-transfer-review",
    "user-sofia",
    "org-lighthouse",
    "Payment",
    "payment-bank-demo",
    "Bank transfer",
    "Deferred",
    "High",
  ],
  [
    "replacement-ready",
    "user-olivia",
    "org-northstar",
    "Delivery",
    "delivery-package-16",
    "Replacement WAV master",
    "Delivered Simulation",
    "High",
  ],
  [
    "delivery-revoked",
    "user-olivia",
    "org-northstar",
    "Delivery",
    "delivery-revoked-demo",
    "Revoked delivery",
    "Delivered Simulation",
    "Urgent",
  ],
  [
    "bulk-revocation-complete",
    "user-preston",
    "org-beatmondo",
    "Temporary Access",
    "delivery-package-16",
    "Bulk URL revocation",
    "Delivered Simulation",
    "High",
  ],
];

const users = {
  "user-olivia": ["Olivia Bennett", "olivia@northstarpictures.com"],
  "user-marcus": ["Marcus Hale", "marcus@thesmyrk.com"],
  "user-jordan": ["Jordan Lee", "jordan@beatmondo.com"],
  "user-amelia": ["Amelia Grant", "amelia@beatmondo.com"],
  "user-finance": ["Nadia Foster", "finance@beatmondo.com"],
  "user-preston": ["Preston Repenning", "admin@beatmondo.com"],
  "user-sofia": ["Sofia Ramirez", "sofia@lighthousecreative.co"],
  "user-ethan": ["Ethan Brooks", "ethan@brightframeagency.com"],
};
export const DEFAULT_EMAIL_MESSAGES = seededMessages.map(
  (
    [
      templateKey,
      userId,
      organizationId,
      category,
      entityId,
      entityReference,
      status,
      priority,
    ],
    index,
  ) => {
    const template = DEFAULT_EMAIL_TEMPLATES.find(
      (item) => item.key === templateKey,
    ) || {
      id: "controlled-operational",
      key: templateKey,
      name: "Weekly Activity Summary",
      version: 1,
      defaultSenderProfileId: "sender-general",
      confidentiality: "Standard",
      transactional: false,
    };
    const [displayName, email] = users[userId];
    const createdAt = new Date(
      Date.UTC(2026, 6, 10 + Math.floor(index / 6), 9 + (index % 6)),
    ).toISOString();
    return {
      id: `email-message-${index + 1}`,
      reference: `BM-EMAIL-2026-${String(101 + index).padStart(6, "0")}`,
      templateId: template.id,
      templateKey,
      templateVersion: template.version,
      category,
      triggerEvent: templateKey.replaceAll("-", "."),
      correlationId: `BM-EMAIL-CORR-2026-${String(Math.floor(index / 3) + 1).padStart(4, "0")}`,
      relatedEntityType: category,
      relatedEntityId: entityId,
      relatedReferences: [entityReference],
      senderProfileId: template.defaultSenderProfileId,
      recipients: [
        {
          recipientType:
            organizationId === "org-beatmondo"
              ? "Internal User"
              : userId === "user-marcus"
                ? "Artist"
                : "Buyer",
          userId,
          organizationId,
          email,
          displayName,
          role: null,
          deliveryPreference: "Email and In-App",
          locale: "en-US",
          timezone: "America/New_York",
          required: template.transactional !== false,
          cc: false,
          bcc: false,
        },
      ],
      subject: `${template.name} · ${entityReference}`,
      preheader: `${template.name} in your private beatmondo workspace.`,
      htmlBody: `<table role="presentation" width="100%"><tr><td><h1>${template.name}</h1><p>Hello ${displayName.split(" ")[0]},</p><p>This is a safe prototype update for ${entityReference}. Protected details remain in the authenticated workspace.</p><p><a href="#notifications">Open beatmondo</a></p></td></tr></table>`,
      textBody: `${template.name}\n\nHello ${displayName.split(" ")[0]},\n\nThis is a safe prototype update for ${entityReference}. Protected details remain in the authenticated workspace.`,
      status,
      priority,
      scheduledFor: ["Scheduled", "Retry Scheduled", "Deferred"].includes(
        status,
      )
        ? new Date(Date.UTC(2026, 6, 20 + (index % 4), 14)).toISOString()
        : null,
      queuedAt: ["Queued", "Processing"].includes(status) ? createdAt : null,
      processingStartedAt: null,
      sentAt: ["Sent", "Delivered Simulation"].includes(status)
        ? createdAt
        : null,
      deliveredAt: status === "Delivered Simulation" ? createdAt : null,
      failedAt: status === "Failed" ? createdAt : null,
      cancelledAt: status === "Cancelled" ? createdAt : null,
      retryCount: status === "Retry Scheduled" ? 1 : 0,
      maxRetries: 4,
      failureCode:
        status === "Failed"
          ? index % 2
            ? "INVALID_EMAIL"
            : "PROVIDER_ERROR_SIMULATION"
          : status === "Deferred"
            ? "RATE_LIMITED"
            : null,
      failureMessage:
        status === "Failed"
          ? "Simulated delivery failure; no real provider was contacted."
          : null,
      deduplicationKey: `${templateKey}:${userId}:${entityId}:seed`,
      preferenceDecision:
        status === "Suppressed"
          ? "Optional communication disabled"
          : template.transactional === false
            ? "Optional preference allowed"
            : "Required transactional",
      confidentiality: template.confidentiality,
      expiresAt: ["Expired", "Scheduled"].includes(status)
        ? new Date(Date.UTC(2026, 7, 15)).toISOString()
        : null,
      metadata: {
        simulation: true,
        actionUrl: "#notifications",
        actionLabel: "Open beatmondo",
        engagementTrackingAllowed: !["Security", "Authentication"].includes(
          category,
        ),
      },
      createdAt,
      createdBy: "Beatmondo Demo Automation",
      openedAt:
        index % 4 === 0 && status === "Delivered Simulation" ? createdAt : null,
      openCount: index % 4 === 0 ? 1 : 0,
      clickedAt:
        index % 7 === 0 && status === "Delivered Simulation" ? createdAt : null,
      clickCount: index % 7 === 0 ? 1 : 0,
      actionCompletedAt: index % 9 === 0 ? createdAt : null,
      cancellationReason:
        status === "Cancelled" ? "Underlying invoice was paid." : null,
    };
  },
);

export const DEFAULT_EMAIL_PREFERENCES = Object.keys(users).map((userId) => ({
  userId,
  emailEnabled: true,
  inAppEnabled: true,
  optionalReminders: true,
  weeklyDigest: userId !== "user-olivia",
  quoteReminders: true,
  contractReminders: true,
  paymentReminders: true,
  licenceRenewalReminders: true,
  deliveryReminders: true,
  savedSearchUpdates: false,
  marketingEnabled: false,
  preferredLanguage: "en-US",
  timezone:
    userId.startsWith("user-") &&
    ["user-jordan", "user-amelia", "user-finance", "user-preston"].includes(
      userId,
    )
      ? "Asia/Kolkata"
      : "America/New_York",
  quietHours: {
    enabled: true,
    start: "21:00",
    end: "08:00",
    weekdays: [1, 2, 3, 4, 5, 6, 0],
    allowUrgentTransactional: true,
  },
  updatedAt: "2026-07-16T10:00:00.000Z",
}));

export const DEFAULT_EMAIL_STATE = {
  version: 1,
  templates: DEFAULT_EMAIL_TEMPLATES,
  templateVersions: [],
  senderProfiles: DEFAULT_SENDER_PROFILES,
  triggers: DEFAULT_EMAIL_TRIGGERS,
  triggerVersions: [],
  messages: DEFAULT_EMAIL_MESSAGES,
  queuePaused: false,
  attempts: DEFAULT_EMAIL_MESSAGES.filter((item) =>
    ["Delivered Simulation", "Failed", "Retry Scheduled", "Deferred"].includes(
      item.status,
    ),
  ).map((item, index) => ({
    id: `email-attempt-${index + 1}`,
    messageId: item.id,
    attempt: Math.max(1, item.retryCount + 1),
    scheduledAt: item.scheduledFor || item.createdAt,
    startedAt: item.sentAt || item.failedAt || item.createdAt,
    completedAt: item.deliveredAt || item.failedAt || item.createdAt,
    result: item.status,
    failureCode: item.failureCode,
    failureReason: item.failureMessage,
    retryable: !["INVALID_EMAIL"].includes(item.failureCode),
    simulation: true,
  })),
  retryJobs: [],
  deliverySimulations: [],
  cancellations: [],
  deduplicationRecords: DEFAULT_EMAIL_MESSAGES.filter(
    (item) => item.status === "Duplicate Prevented",
  ).map((item) => ({
    id: `dedupe-${item.id}`,
    messageId: item.id,
    key: item.deduplicationKey,
    status: "Prevented",
    createdAt: item.createdAt,
  })),
  preferences: DEFAULT_EMAIL_PREFERENCES,
  analyticsEvents: [],
  failureAlerts: [],
  sourceMessageKeys: [],
  sequence: 100 + DEFAULT_EMAIL_MESSAGES.length,
  templateSequence: DEFAULT_EMAIL_TEMPLATES.length,
  queueSettings: { failNext: false, batchSize: 25 },
  lastResetAt: null,
};
