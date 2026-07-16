import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Bell,
  CheckCircle,
  Clock,
  DownloadSimple,
  FileText,
  Fingerprint,
  GearSix,
  LockKey,
  ShieldCheck,
  Sliders,
  UserCircle,
  UsersThree,
  WarningCircle,
} from "@phosphor-icons/react";
import { useAuth } from "../auth/AuthContext.jsx";
import {
  buildAuthorizationContext,
  canPerform,
} from "../permissions/authorizationService.js";
import { privacyService } from "./privacyService.js";
import "./privacy.css";

export const PRIVACY_VIEWS = new Set([
  "settings/privacy",
  "privacy/request",
  "privacy/request/detail",
  "admin/privacy",
  "admin/privacy/requests",
  "admin/privacy/request",
  "admin/privacy/inventory",
  "admin/privacy/purposes",
  "admin/privacy/notices",
  "admin/privacy/consents",
  "admin/privacy/retention",
  "admin/privacy/legal-holds",
  "admin/privacy/vendors",
  "admin/privacy/incidents",
  "admin/privacy/assessments",
  "admin/privacy/exports",
]);

const adminSections = [
  ["admin/privacy", "Overview"],
  ["admin/privacy/requests", "Requests"],
  ["admin/privacy/inventory", "Inventory"],
  ["admin/privacy/purposes", "Purposes"],
  ["admin/privacy/notices", "Notices"],
  ["admin/privacy/consents", "Consents"],
  ["admin/privacy/retention", "Retention"],
  ["admin/privacy/legal-holds", "Legal holds"],
  ["admin/privacy/vendors", "Vendors"],
  ["admin/privacy/incidents", "Incidents"],
  ["admin/privacy/assessments", "Assessments"],
  ["admin/privacy/exports", "Exports"],
];
const requestTypes = [
  "Access Request",
  "Data Export",
  "Correction Request",
  "Deletion Request",
  "Restriction Request",
  "Objection Request",
  "Consent Withdrawal",
  "Portability Request",
  "Account Closure",
  "Marketing Opt-Out",
  "Automated Decision Information Request",
  "Privacy Complaint",
];

function Status({ children, tone = "" }) {
  return <span className={`pr-status ${tone}`}>{children}</span>;
}
function Notice({ warning = false, children }) {
  return (
    <div className={`pr-notice ${warning ? "is-warning" : ""}`}>
      <ShieldCheck />
      <div>{children}</div>
    </div>
  );
}
function AdminNav({ view, navigate }) {
  const { user } = useAuth();
  const context = buildAuthorizationContext(user.id);
  const routePermissions = {
    "admin/privacy": "privacy.dashboard.view",
    "admin/privacy/requests": "privacy.requests.view",
    "admin/privacy/inventory": "privacy.inventory.view",
    "admin/privacy/purposes": "privacy.purposes.view",
    "admin/privacy/notices": "privacy.notices.view",
    "admin/privacy/consents": "privacy.consents.view",
    "admin/privacy/retention": "privacy.retention.view",
    "admin/privacy/legal-holds": "privacy.legal_holds.view",
    "admin/privacy/vendors": "privacy.vendors.view",
    "admin/privacy/incidents": "privacy.incidents.view",
    "admin/privacy/assessments": "privacy.assessments.view",
    "admin/privacy/exports": "privacy.requests.view",
  };
  return (
    <nav className="pr-tabs" aria-label="Privacy administration sections">
      {adminSections
        .filter(
          ([route]) => canPerform(routePermissions[route], context).allowed,
        )
        .map(([route, label]) => (
          <button
            key={route}
            className={view === route ? "active" : ""}
            onClick={() => navigate(route)}
          >
            {label}
          </button>
        ))}
    </nav>
  );
}

function PrivacyHeader({ kicker, title, description, action }) {
  return (
    <header className="pr-hero">
      <div>
        <span>{kicker}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </header>
  );
}

function PrivacySettings({ navigate, showToast }) {
  const { user } = useAuth();
  const [revision, setRevision] = useState(0);
  const state = privacyService.getState();
  const notices = privacyService
    .getPrivacyNotices(user)
    .filter((item) => item.status === "Active");
  const consents = privacyService.getUserConsents(user.id, user);
  const prefs = privacyService.getCookiePreferences(user);
  const requests = privacyService.getRequests(user);
  const purposes = privacyService
    .getProcessingPurposes(user)
    .filter((item) => item.consentRequired);
  const latestConsent = (purposeId) =>
    consents.find(
      (item) =>
        item.purposeId === purposeId && !["Superseded"].includes(item.status),
    );
  const changeConsent = (purposeId, enabled) => {
    try {
      privacyService.setConsent(purposeId, enabled, user);
      setRevision(revision + 1);
      showToast(`Optional preference ${enabled ? "enabled" : "withdrawn"}.`);
    } catch (error) {
      showToast(error.message);
    }
  };
  const changeCookie = (key, value) => {
    privacyService.updateCookiePreferences({ [key]: value }, user);
    setRevision(revision + 1);
    showToast("Privacy preferences updated.");
  };
  return (
    <section className="pr-page">
      <PrivacyHeader
        kicker="Your privacy controls"
        title="Privacy & personal data"
        description="Review plain-language notices, manage optional preferences, see what the prototype holds, and submit a privacy request."
        action={
          <button
            className="pr-primary"
            onClick={() => navigate("privacy/request")}
          >
            <FileText /> Start a data request
          </button>
        }
      />
      <Notice>
        <strong>Browser-persisted privacy simulation</strong>
        <span>
          This workspace does not claim automatic GDPR, CCPA, UK GDPR, Indian
          privacy-law, or other legal compliance. Actual rights and deadlines
          vary.
        </span>
      </Notice>
      <div className="pr-user-grid">
        <article className="pr-panel">
          <header>
            <div>
              <span>Required and optional processing</span>
              <h2>Consent preferences</h2>
            </div>
            <Sliders />
          </header>
          <p>
            Optional choices start off unless explicitly enabled. Contract,
            payment, security, verification, rights, and audit processing are
            not treated as marketing consent.
          </p>
          <div className="pr-toggle-list">
            {purposes.map((purpose) => {
              const record = latestConsent(purpose.id);
              const enabled = record?.status === "Granted";
              return (
                <label key={purpose.id}>
                  <span>
                    <strong>{purpose.name}</strong>
                    <small>{purpose.description}</small>
                  </span>
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(event) =>
                      changeConsent(purpose.id, event.target.checked)
                    }
                  />
                </label>
              );
            })}
          </div>
          <div className="pr-essential">
            <LockKey />
            <span>
              <strong>Essential processing remains active</strong>
              <small>
                Authentication, contracts, payments, security, rights, licence
                delivery, and audit history.
              </small>
            </span>
          </div>
        </article>
        <article className="pr-panel">
          <header>
            <div>
              <span>Tracking placeholders</span>
              <h2>Cookie preferences</h2>
            </div>
            <GearSix />
          </header>
          <p>This is a preference simulation, not a cookie scanner.</p>
          <div className="pr-toggle-list">
            {[
              "essential",
              "functional",
              "analytics",
              "personalization",
              "marketing",
            ].map((key) => (
              <label key={key}>
                <span>
                  <strong>{key[0].toUpperCase() + key.slice(1)}</strong>
                  <small>
                    {key === "essential"
                      ? "Required for sign-in and security"
                      : "Optional prototype preference"}
                  </small>
                </span>
                <input
                  type="checkbox"
                  disabled={key === "essential"}
                  checked={Boolean(prefs[key])}
                  onChange={(event) => changeCookie(key, event.target.checked)}
                />
              </label>
            ))}
          </div>
        </article>
      </div>
      <div className="pr-user-grid">
        <article className="pr-panel">
          <header>
            <div>
              <span>Active versions only</span>
              <h2>Privacy notices</h2>
            </div>
            <FileText />
          </header>
          {notices.slice(0, 6).map((notice) => (
            <div className="pr-record" key={notice.id}>
              <div>
                <strong>{notice.name}</strong>
                <span>
                  Version {notice.version} · {notice.summary}
                </span>
              </div>
              <button
                onClick={() => {
                  try {
                    privacyService.acknowledgePrivacyNotice(notice.id, user);
                    setRevision(revision + 1);
                    showToast(`${notice.name} acknowledged.`);
                  } catch (error) {
                    showToast(error.message);
                  }
                }}
              >
                Acknowledge
              </button>
            </div>
          ))}
        </article>
        <article className="pr-panel">
          <header>
            <div>
              <span>Safe personal-data summary</span>
              <h2>Your data footprint</h2>
            </div>
            <UserCircle />
          </header>
          {[
            { label: "Account details", text: `${user.name} · ${user.email}` },
            { label: "Organization", text: user.organization },
            {
              label: "Commercial activity",
              text: "Projects, quotes, contracts, licences, and deliveries where authorized",
            },
            {
              label: "Activity",
              text: "Own search, protected-preview, and access history",
            },
            {
              label: "Excluded",
              text: "Internal legal advice, security investigations, other users, and raw credentials",
            },
          ].map((item) => (
            <div className="pr-summary" key={item.label}>
              <strong>{item.label}</strong>
              <span>{item.text}</span>
            </div>
          ))}
        </article>
      </div>
      <article className="pr-panel">
        <header>
          <div>
            <span>Privacy activity</span>
            <h2>Your requests</h2>
          </div>
          <Clock />
        </header>
        {requests.length ? (
          <div className="pr-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th>Due target</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {requests.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.reference}</strong>
                    </td>
                    <td>{item.requestType}</td>
                    <td>
                      <Status>{item.status}</Status>
                    </td>
                    <td>{new Date(item.submittedAt).toLocaleDateString()}</td>
                    <td>{new Date(item.dueAt).toLocaleDateString()}</td>
                    <td>
                      <button
                        onClick={() => {
                          privacyService.selectRequest(item.id);
                          navigate("privacy/request/detail");
                        }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="pr-empty">
            <FileText />
            <h3>No privacy requests yet</h3>
            <p>
              Start a request when you need access, correction, export,
              restriction, or another supported prototype workflow.
            </p>
          </div>
        )}
      </article>
    </section>
  );
}

function PrivacyRequestForm({ navigate, showToast }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    requestType: "Access Request",
    requestedDetails: "",
    organizationWide: false,
  });
  const [created, setCreated] = useState(null);
  const submit = async () => {
    try {
      const item = await privacyService.createPrivacyRequest(form, user);
      setCreated(item);
      showToast(`${item.reference} submitted.`);
    } catch (error) {
      showToast(error.message);
    }
  };
  if (created)
    return (
      <section className="pr-page">
        <div className="pr-success">
          <CheckCircle />
          <span>Request received</span>
          <h1>{created.reference}</h1>
          <p>
            Status: {created.status}. Prototype target:{" "}
            {new Date(created.dueAt).toLocaleDateString()}.
          </p>
          {created.identityVerificationStatus === "Required" && (
            <p>
              High-risk requests require the privacy verification code before
              review.
            </p>
          )}
          <button
            className="pr-primary"
            onClick={() => {
              privacyService.selectRequest(created.id);
              navigate("privacy/request/detail");
            }}
          >
            Continue <ArrowRight />
          </button>
        </div>
      </section>
    );
  return (
    <section className="pr-page">
      <PrivacyHeader
        kicker="User-rights workflow"
        title="Start a privacy request"
        description="These labels model intake workflows and do not determine legal rights or deadlines."
        action={
          <button onClick={() => navigate("settings/privacy")}>
            Back to privacy
          </button>
        }
      />
      <Notice warning>
        <strong>Expected limitations</strong>
        <span>
          Identity verification may be required. Contractual, financial, rights,
          security, licence, and audit records may need retention or
          anonymization instead of deletion.
        </span>
      </Notice>
      <article className="pr-form-panel">
        <label>
          Request type
          <select
            value={form.requestType}
            onChange={(event) =>
              setForm({ ...form, requestType: event.target.value })
            }
          >
            {requestTypes.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label>
          Describe the request
          <textarea
            value={form.requestedDetails}
            onChange={(event) =>
              setForm({ ...form, requestedDetails: event.target.value })
            }
            placeholder="Tell the privacy team what information or change you need."
          />
        </label>
        {user.role === "vip_buyer" && (
          <label className="pr-check">
            <input
              type="checkbox"
              checked={form.organizationWide}
              onChange={(event) =>
                setForm({ ...form, organizationWide: event.target.checked })
              }
            />{" "}
            Include the organization scope I administer
          </label>
        )}
        <div className="pr-form-summary">
          <strong>Requester</strong>
          <span>
            {user.name} · {user.email}
          </span>
          <strong>Service target</strong>
          <span>
            {form.requestType === "Marketing Opt-Out"
              ? "Immediate simulation"
              : ["Restriction Request", "Privacy Complaint"].includes(
                    form.requestType,
                  )
                ? "14 days"
                : "30 days"}
          </span>
        </div>
        <button className="pr-primary" onClick={submit}>
          Submit privacy request
        </button>
      </article>
      <p className="pr-disclaimer">
        Prototype response targets only. Actual legal deadlines vary by
        jurisdiction and circumstance.
      </p>
    </section>
  );
}

function RequestDetail({ navigate, showToast, admin = false }) {
  const { user } = useAuth();
  const [revision, setRevision] = useState(0);
  const request = privacyService.getSelectedRequest(user);
  const [code, setCode] = useState("");
  const authorizationContext = buildAuthorizationContext(user.id);
  const canGenerateExport = canPerform(
    "privacy.exports.generate",
    authorizationContext,
  ).allowed;
  const canPlanDeletion = canPerform(
    "privacy.deletion.plan",
    authorizationContext,
  ).allowed;
  if (!request)
    return (
      <section className="pr-page">
        <div className="pr-empty">
          <FileText />
          <h2>Request not selected</h2>
          <button
            onClick={() =>
              navigate(admin ? "admin/privacy/requests" : "settings/privacy")
            }
          >
            Return
          </button>
        </div>
      </section>
    );
  const discovery =
    admin && request.identityVerificationStatus === "Verified"
      ? privacyService.discoverSubjectData(
          request.subjectUserId,
          "Request scope",
          buildAuthorizationContext(user.id),
        )
      : [];
  const eligibility =
    request.requestType.includes("Deletion") ||
    request.requestType === "Account Closure"
      ? privacyService.calculateDeletionEligibility(
          request.subjectUserId,
          buildAuthorizationContext(user.id),
        )
      : null;
  const verify = async () => {
    try {
      await privacyService.verifyPrivacyRequestIdentity(request.id, code, user);
      setRevision(revision + 1);
      showToast("Identity verified.");
    } catch (error) {
      showToast(error.message);
    }
  };
  const generateExport = () => {
    try {
      const item = privacyService.generatePrivacyExport(
        request.id,
        "ZIP package simulation",
        user,
      );
      setRevision(revision + 1);
      showToast(`${item.reference} prepared for independent approval.`);
    } catch (error) {
      showToast(error.message);
    }
  };
  const createDeletionPlan = () => {
    try {
      privacyService.createDeletionPlan(request.id, user);
      setRevision(revision + 1);
      showToast(
        "Deletion and retention plan prepared for independent approval.",
      );
    } catch (error) {
      showToast(error.message);
    }
  };
  return (
    <section className="pr-page">
      <PrivacyHeader
        kicker={request.reference}
        title={request.requestType}
        description={request.requestedDetails}
        action={
          <button
            onClick={() =>
              navigate(admin ? "admin/privacy/requests" : "settings/privacy")
            }
          >
            Back
          </button>
        }
      />
      <div className="pr-detail-grid">
        <article className="pr-panel">
          <h2>Request summary</h2>
          <dl>
            <dt>Status</dt>
            <dd>
              <Status>{request.status}</Status>
            </dd>
            <dt>Submitted</dt>
            <dd>{new Date(request.submittedAt).toLocaleString()}</dd>
            <dt>Prototype due target</dt>
            <dd>{new Date(request.dueAt).toLocaleString()}</dd>
            <dt>Assigned team</dt>
            <dd>{request.assignedTo}</dd>
            <dt>Scope</dt>
            <dd>{request.scope.join(", ")}</dd>
          </dl>
        </article>
        <article className="pr-panel">
          <h2>Identity verification</h2>
          <Status>{request.identityVerificationStatus}</Status>
          {request.identityVerificationStatus === "Required" && (
            <>
              <p>
                Enter the six-digit privacy verification code for this
                prototype.
              </p>
              <label>
                Verification code
                <input
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  inputMode="numeric"
                  maxLength={6}
                />
              </label>
              <button className="pr-primary" onClick={verify}>
                Verify identity
              </button>
            </>
          )}
        </article>
      </div>
      {request.blockers.length > 0 && (
        <Notice warning>
          <strong>Current blockers</strong>
          <span>{request.blockers.join(" · ")}</span>
        </Notice>
      )}
      {admin && discovery.length > 0 && (
        <article className="pr-panel">
          <header>
            <div>
              <span>Visible records before aggregation</span>
              <h2>Data discovery</h2>
            </div>
            <Fingerprint />
          </header>
          <div className="pr-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Module</th>
                  <th>Records</th>
                  <th>Categories</th>
                  <th>Sensitivity</th>
                  <th>Deletion behavior</th>
                  <th>Hold</th>
                </tr>
              </thead>
              <tbody>
                {discovery.map((item) => (
                  <tr key={item.module}>
                    <td>
                      <strong>{item.module}</strong>
                    </td>
                    <td>{item.recordCount}</td>
                    <td>{item.dataCategories.join(", ")}</td>
                    <td>
                      <Status>{item.sensitivity}</Status>
                    </td>
                    <td>{item.deletionBehavior}</td>
                    <td>{item.legalHold ? "Legal hold" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      )}
      {eligibility && (
        <article className="pr-panel">
          <header>
            <div>
              <span>Deletion is reviewed, never one-click</span>
              <h2>Deletion eligibility</h2>
            </div>
            <WarningCircle />
          </header>
          <div className="pr-eligibility">
            <div>
              <strong>Deletable</strong>
              <p>{eligibility.deletableCategories.join(", ")}</p>
            </div>
            <div>
              <strong>Anonymizable</strong>
              <p>{eligibility.anonymizableCategories.join(", ")}</p>
            </div>
            <div>
              <strong>Retained</strong>
              <p>{eligibility.retainedCategories.join(", ")}</p>
            </div>
            <div>
              <strong>Blockers</strong>
              <p>{eligibility.blockers.join(", ")}</p>
            </div>
          </div>
        </article>
      )}
      {admin && (
        <div className="pr-action-row">
          {request.requestType === "Data Export" &&
            !request.exportId &&
            canGenerateExport && (
              <button className="pr-primary" onClick={generateExport}>
                <DownloadSimple /> Prepare redacted export
              </button>
            )}
          {(request.requestType === "Deletion Request" ||
            request.requestType === "Account Closure") &&
            !request.deletionPlanId &&
            canPlanDeletion && (
              <button className="pr-primary" onClick={createDeletionPlan}>
                <FileText /> Prepare deletion plan
              </button>
            )}
        </div>
      )}
    </section>
  );
}

function AdminDashboard({ view, navigate }) {
  const { user } = useAuth();
  const metrics = privacyService.getPrivacyAnalytics(user);
  const reports = privacyService.getState().privacyReports;
  const cards = [
    ["Open data requests", metrics.openRequests],
    ["Approaching due", metrics.approachingDue],
    ["Completed requests", metrics.completed],
    ["Deletion requests", metrics.deletions],
    ["Export requests", metrics.exports],
    ["Active restrictions", metrics.restrictions],
    ["Active legal holds", metrics.legalHolds],
    ["Retention reviews due", metrics.retentionDue],
    ["Open incidents", metrics.openIncidents],
    ["High-risk assessments", metrics.highRiskAssessments],
    ["Vendor reviews due", metrics.vendorsDue],
    ["Withdrawn consents", metrics.withdrawnConsents],
    ["Exports awaiting download", metrics.exportsReady],
  ];
  return (
    <section className="pr-page">
      <AdminNav view={view} navigate={navigate} />
      <PrivacyHeader
        kicker="Compliance operations"
        title="Privacy governance"
        description="Requests, consent, inventory, retention, legal holds, vendors, incidents, and assessments in a legally cautious prototype."
        action={
          <button
            className="pr-primary"
            onClick={() => navigate("admin/privacy/requests")}
          >
            <UsersThree /> Review requests
          </button>
        }
      />
      <Notice>
        <strong>Prototype governance only</strong>
        <span>
          Legal-basis labels, retention periods, transfer fields, deadlines, and
          notification decisions require qualified jurisdiction-specific review.
        </span>
      </Notice>
      <div className="pr-metrics">
        {cards.map(([label, value]) => (
          <article key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </div>
      <div className="pr-admin-grid">
        <button onClick={() => navigate("admin/privacy/requests")}>
          <FileText />
          <strong>Request queue</strong>
          <span>
            Identity, discovery, exports, correction, deletion, and restrictions
          </span>
        </button>
        <button onClick={() => navigate("admin/privacy/retention")}>
          <Clock />
          <strong>Retention & holds</strong>
          <span>
            Review eligibility without silently deleting preserved records
          </span>
        </button>
        <button onClick={() => navigate("admin/privacy/incidents")}>
          <WarningCircle />
          <strong>Incident response</strong>
          <span>Restricted containment, evidence, and review workflows</span>
        </button>
        <button onClick={() => navigate("admin/privacy/inventory")}>
          <Fingerprint />
          <strong>Data governance</strong>
          <span>
            Classifications, purposes, vendors, and inventory coverage
          </span>
        </button>
      </div>
      <section
        className="pr-panel pr-reports"
        aria-labelledby="privacy-reports-title"
      >
        <header>
          <div>
            <span className="pr-kicker">Permission-aware reporting</span>
            <h2 id="privacy-reports-title">Predefined privacy reports</h2>
          </div>
          <span>{reports.length} active reports</span>
        </header>
        <div className="pr-report-list">
          {reports.map((report) => (
            <article key={report.id}>
              <div>
                <strong>{report.name}</strong>
                <p>{report.description}</p>
              </div>
              <Status>{report.confidentiality}</Status>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}

function RequestQueue({ view, navigate }) {
  const { user } = useAuth();
  const requests = privacyService.getRequests(user);
  return (
    <section className="pr-page">
      <AdminNav view={view} navigate={navigate} />
      <PrivacyHeader
        kicker="Privacy operations queue"
        title="Data requests"
        description="Identity verification, scope, due targets, blockers, and specialist review remain distinct."
      />
      <div className="pr-table-wrap pr-panel">
        <table>
          <thead>
            <tr>
              <th>Reference</th>
              <th>Requester</th>
              <th>Type</th>
              <th>Status</th>
              <th>Submitted</th>
              <th>Due</th>
              <th>Identity</th>
              <th>Team</th>
              <th>Blockers</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {requests.map((item) => (
              <tr key={item.id}>
                <td>
                  <strong>{item.reference}</strong>
                </td>
                <td>
                  {item.requesterUserId}
                  <small>{item.requesterOrganizationId}</small>
                </td>
                <td>{item.requestType}</td>
                <td>
                  <Status>{item.status}</Status>
                </td>
                <td>{new Date(item.submittedAt).toLocaleDateString()}</td>
                <td>{new Date(item.dueAt).toLocaleDateString()}</td>
                <td>{item.identityVerificationStatus}</td>
                <td>{item.assignedTo}</td>
                <td>{item.blockers.length}</td>
                <td>
                  <button
                    onClick={() => {
                      privacyService.selectRequest(item.id);
                      navigate("admin/privacy/request");
                    }}
                  >
                    Inspect
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function InventoryPage({ view, navigate }) {
  const { user } = useAuth();
  const rows = privacyService.getDataInventory(user);
  return (
    <section className="pr-page">
      <AdminNav view={view} navigate={navigate} />
      <PrivacyHeader
        kicker="Central data map"
        title="Personal-data inventory"
        description="Field-level categories, purposes, sensitivity, export, correction, deletion, retention, and vendor mappings."
      />
      <div className="pr-table-wrap pr-panel">
        <table>
          <thead>
            <tr>
              <th>Field</th>
              <th>Category</th>
              <th>Source</th>
              <th>Sensitivity</th>
              <th>Export</th>
              <th>Correct</th>
              <th>Deletion behavior</th>
              <th>Retention</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr key={item.id}>
                <td>
                  <strong>{item.displayName}</strong>
                  <small>{item.fieldKey}</small>
                </td>
                <td>{item.dataCategory}</td>
                <td>{item.sourceModule}</td>
                <td>
                  <Status>{item.sensitivity}</Status>
                </td>
                <td>{item.exportable ? "Yes" : "Restricted"}</td>
                <td>{item.correctable ? "Yes" : "Review"}</td>
                <td>{item.deletionBehavior}</td>
                <td>{item.retentionRuleId}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function PurposesPage({ view, navigate }) {
  const { user } = useAuth();
  const rows = privacyService.getProcessingPurposes(user);
  return (
    <section className="pr-page">
      <AdminNav view={view} navigate={navigate} />
      <PrivacyHeader
        kicker="Purpose limitation"
        title="Processing purposes"
        description="Legal-basis labels are prototype configuration fields and require qualified legal review."
      />
      <div className="pr-card-grid">
        {rows.map((item) => (
          <article className="pr-panel" key={item.id}>
            <span>
              {item.category} · v{item.version}
            </span>
            <h2>{item.name}</h2>
            <p>{item.description}</p>
            <dl>
              <dt>Required</dt>
              <dd>{item.required ? "Yes" : "Optional"}</dd>
              <dt>Consent</dt>
              <dd>
                {item.consentRequired ? "Required" : "Not optional consent"}
              </dd>
              <dt>Legal basis</dt>
              <dd>{item.legalBasis}</dd>
              <dt>Status</dt>
              <dd>{item.status}</dd>
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}

function NoticesPage({ view, navigate }) {
  const { user } = useAuth();
  const rows = privacyService.getPrivacyNotices(user);
  return (
    <section className="pr-page">
      <AdminNav view={view} navigate={navigate} />
      <PrivacyHeader
        kicker="Versioned user communication"
        title="Privacy notices"
        description="Only active notice versions are used for new acknowledgments; historical versions remain preserved."
      />
      <div className="pr-card-grid">
        {rows.map((item) => (
          <article className="pr-panel" key={item.id}>
            <span>
              {item.audience} · Version {item.version}
            </span>
            <h2>{item.name}</h2>
            <p>{item.summary}</p>
            <Status>{item.status}</Status>
            <details>
              <summary>Plain-language content</summary>
              <p>{item.content}</p>
            </details>
          </article>
        ))}
      </div>
    </section>
  );
}

function ConsentsPage({ view, navigate }) {
  const state = privacyService.getState();
  return (
    <section className="pr-page">
      <AdminNav view={view} navigate={navigate} />
      <PrivacyHeader
        kicker="Evidence and history"
        title="Consent records"
        description="Optional consent is specific, versioned, withdrawable, and separate from essential contractual or security processing."
      />
      <div className="pr-table-wrap pr-panel">
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Purpose</th>
              <th>Type</th>
              <th>Status</th>
              <th>Granted</th>
              <th>Withdrawn</th>
              <th>Evidence</th>
            </tr>
          </thead>
          <tbody>
            {state.consents.map((item) => (
              <tr key={item.id}>
                <td>{item.userId}</td>
                <td>{item.purposeId}</td>
                <td>{item.consentType}</td>
                <td>
                  <Status>{item.status}</Status>
                </td>
                <td>
                  {item.grantedAt
                    ? new Date(item.grantedAt).toLocaleDateString()
                    : "—"}
                </td>
                <td>
                  {item.withdrawnAt
                    ? new Date(item.withdrawnAt).toLocaleDateString()
                    : "—"}
                </td>
                <td>{item.evidence.method}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function RetentionPage({ view, navigate, showToast }) {
  const { user } = useAuth();
  const [revision, setRevision] = useState(0);
  const state = privacyService.getState();
  const context = buildAuthorizationContext(user.id);
  const canRun = canPerform("privacy.retention.execute", context).allowed;
  return (
    <section className="pr-page">
      <AdminNav view={view} navigate={navigate} />
      <PrivacyHeader
        kicker="Lifecycle governance"
        title="Retention review"
        description="Prototype rules recommend review, archive, anonymization, deletion, or hold; they never silently destroy protected source records."
        action={
          canRun ? (
            <button
              className="pr-primary"
              onClick={() => {
                try {
                  privacyService.runRetentionReview(user);
                  setRevision(revision + 1);
                  showToast(
                    "Retention review evaluated; no raw data automatically deleted.",
                  );
                } catch (error) {
                  showToast(error.message);
                }
              }}
            >
              Run review simulation
            </button>
          ) : null
        }
      />
      <Notice warning>
        <strong>Jurisdiction-specific review required</strong>
        <span>
          Every duration and action is a prototype placeholder. Legal hold
          overrides routine deletion and anonymization.
        </span>
      </Notice>
      <div className="pr-card-grid">
        {state.retentionRules.map((item) => (
          <article className="pr-panel" key={item.id}>
            <span>
              {item.status} · v{item.version}
            </span>
            <h2>{item.name}</h2>
            <p>{item.description}</p>
            <dl>
              <dt>Trigger</dt>
              <dd>{item.triggerEvent}</dd>
              <dt>Duration</dt>
              <dd>
                {item.duration} {item.durationUnit}
              </dd>
              <dt>At expiry</dt>
              <dd>{item.actionAtExpiry}</dd>
            </dl>
            <small>{item.disclaimer}</small>
          </article>
        ))}
      </div>
      <div className="pr-table-wrap pr-panel">
        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th>Module</th>
              <th>Subject</th>
              <th>Eligible</th>
              <th>Hold</th>
              <th>Recommendation</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {state.retentionReviews.map((item) => (
              <tr key={item.id}>
                <td>{item.category}</td>
                <td>{item.module}</td>
                <td>{item.subject}</td>
                <td>{item.eligibleDate}</td>
                <td>{item.legalHold ? "Yes" : "No"}</td>
                <td>{item.recommendedAction}</td>
                <td>{item.evaluation || item.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function LegalHoldsPage({ view, navigate }) {
  const rows = privacyService.getState().legalHolds;
  return (
    <section className="pr-page">
      <AdminNav view={view} navigate={navigate} />
      <PrivacyHeader
        kicker="Restricted preservation"
        title="Legal holds"
        description="Active holds block routine deletion, anonymization, cleanup, and archive actions until independently reviewed."
      />
      <div className="pr-card-grid">
        {rows.map((item) => (
          <article className="pr-panel is-restricted" key={item.id}>
            <span>{item.reference}</span>
            <h2>{item.name}</h2>
            <p>{item.reason}</p>
            <Status>{item.status}</Status>
            <dl>
              <dt>Case</dt>
              <dd>{item.relatedCaseReference}</dd>
              <dt>Categories</dt>
              <dd>{item.dataCategories.join(", ")}</dd>
              <dt>Review</dt>
              <dd>{item.reviewDate}</dd>
              <dt>Created by</dt>
              <dd>{item.createdBy}</dd>
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}

function VendorsPage({ view, navigate }) {
  const { user } = useAuth();
  const rows = privacyService.getPrivacyVendors(user);
  return (
    <section className="pr-page">
      <AdminNav view={view} navigate={navigate} />
      <PrivacyHeader
        kicker="Simulated due diligence"
        title="Vendors & subprocessors"
        description="Provider names, regions, reviews, and transfer mechanisms are placeholders—not claims about real vendors or legal transfer mechanisms."
      />
      <div className="pr-table-wrap pr-panel">
        <table>
          <thead>
            <tr>
              <th>Vendor</th>
              <th>Category</th>
              <th>Status</th>
              <th>Regions</th>
              <th>Contract</th>
              <th>Security</th>
              <th>Privacy</th>
              <th>Transfer</th>
              <th>Review date</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr key={item.id}>
                <td>
                  <strong>{item.name}</strong>
                </td>
                <td>{item.category}</td>
                <td>
                  <Status>{item.status}</Status>
                </td>
                <td>{item.regions.join(", ")}</td>
                <td>{item.contractStatus}</td>
                <td>{item.securityReviewStatus}</td>
                <td>{item.privacyReviewStatus}</td>
                <td>{item.transferMechanismPlaceholder}</td>
                <td>{item.reviewDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function IncidentsPage({ view, navigate, showToast }) {
  const { user } = useAuth();
  const [revision, setRevision] = useState(0);
  const rows = privacyService.getIncidents(user);
  const contain = (item) => {
    try {
      privacyService.containPrivacyIncident(
        item.id,
        ["Revoke affected prototype sessions", "Preserve audit evidence"],
        user,
      );
      setRevision(revision + 1);
      showToast(`${item.reference} contained.`);
    } catch (error) {
      showToast(error.message);
    }
  };
  return (
    <section className="pr-page">
      <AdminNav view={view} navigate={navigate} />
      <PrivacyHeader
        kicker="Restricted response workspace"
        title="Privacy incidents"
        description="Containment, evidence, notification-review placeholders, remediation, and independent closure."
      />
      <div className="pr-card-grid">
        {rows.map((item) => (
          <article
            className={`pr-panel severity-${item.severity.toLowerCase()}`}
            key={item.id}
          >
            <span>
              {item.reference} · {item.severity}
            </span>
            <h2>{item.title}</h2>
            <p>{item.description}</p>
            <Status>{item.status}</Status>
            <dl>
              <dt>Affected modules</dt>
              <dd>{item.affectedModules.join(", ")}</dd>
              <dt>Approx. records</dt>
              <dd>{item.approximateRecordCount}</dd>
              <dt>Owner</dt>
              <dd>{item.owner}</dd>
              <dt>Notification</dt>
              <dd>{item.notificationsRequiredPlaceholder}</dd>
            </dl>
            {["Reported", "Triage", "Investigating"].includes(item.status) && (
              <button onClick={() => contain(item)}>Contain incident</button>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

function AssessmentsPage({ view, navigate }) {
  const rows = privacyService.getState().assessments;
  return (
    <section className="pr-page">
      <AdminNav view={view} navigate={navigate} />
      <PrivacyHeader
        kicker="Privacy engineering review"
        title="Risk assessments"
        description="Risk labels support review and mitigation; they do not make an automated legal judgment."
      />
      <div className="pr-card-grid">
        {rows.map((item) => (
          <article className="pr-panel" key={item.id}>
            <span>
              {item.reference} · {item.assessmentType}
            </span>
            <h2>{item.title}</h2>
            <Status>{item.status}</Status>
            <dl>
              <dt>Subjects</dt>
              <dd>{item.subjects.join(", ")}</dd>
              <dt>Categories</dt>
              <dd>{item.dataCategories.join(", ")}</dd>
              <dt>Risks</dt>
              <dd>{item.risks.join(", ")}</dd>
              <dt>Mitigations</dt>
              <dd>{item.mitigations.join(", ")}</dd>
              <dt>Residual risk</dt>
              <dd>{item.residualRisk}</dd>
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}

function ExportsPage({ view, navigate, showToast }) {
  const { user } = useAuth();
  const [revision, setRevision] = useState(0);
  const state = privacyService.getState();
  const context = buildAuthorizationContext(user.id);
  const canApprove = canPerform("privacy.exports.approve", context).allowed;
  const approve = (id) => {
    try {
      privacyService.approvePrivacyExport(id, user);
      setRevision(revision + 1);
      showToast("Privacy export independently approved with expiring access.");
    } catch (error) {
      showToast(error.message);
    }
  };
  return (
    <section className="pr-page">
      <AdminNav view={view} navigate={navigate} />
      <PrivacyHeader
        kicker="Redacted data packages"
        title="Privacy exports"
        description="Exports include manifests, scoped modules, exclusions, redactions, prototype notices, and expiring protected access."
        action={
          <button
            onClick={() => {
              privacyService.resetCompliancePrivacyDemoData();
              setRevision(revision + 1);
              showToast("Compliance and privacy demo data reset.");
            }}
          >
            Reset privacy demo
          </button>
        }
      />
      <div className="pr-card-grid">
        {state.exports.map((item) => (
          <article className="pr-panel" key={item.id}>
            <span>
              {item.reference} · {item.format}
            </span>
            <h2>{item.status}</h2>
            <p>
              {item.recordCount} records across{" "}
              {item.includedModules.join(", ")}.
            </p>
            <dl>
              <dt>Excluded</dt>
              <dd>{item.excludedModules.join(", ")}</dd>
              <dt>Redactions</dt>
              <dd>{item.redactions.join(", ")}</dd>
              <dt>Expires</dt>
              <dd>{new Date(item.expiresAt).toLocaleString()}</dd>
              <dt>Access</dt>
              <dd>{item.accessReference || "Created after approval"}</dd>
            </dl>
            {canApprove &&
              item.status === "Review Required" &&
              item.preparedBy !== user.id && (
                <button className="pr-primary" onClick={() => approve(item.id)}>
                  Approve restricted export
                </button>
              )}
          </article>
        ))}
      </div>
    </section>
  );
}

export function CompliancePrivacyModule({ view, navigate, showToast }) {
  if (view === "settings/privacy")
    return <PrivacySettings navigate={navigate} showToast={showToast} />;
  if (view === "privacy/request")
    return <PrivacyRequestForm navigate={navigate} showToast={showToast} />;
  if (view === "privacy/request/detail")
    return <RequestDetail navigate={navigate} showToast={showToast} />;
  if (view === "admin/privacy")
    return <AdminDashboard view={view} navigate={navigate} />;
  if (view === "admin/privacy/requests")
    return <RequestQueue view={view} navigate={navigate} />;
  if (view === "admin/privacy/request")
    return <RequestDetail navigate={navigate} showToast={showToast} admin />;
  if (view === "admin/privacy/inventory")
    return <InventoryPage view={view} navigate={navigate} />;
  if (view === "admin/privacy/purposes")
    return <PurposesPage view={view} navigate={navigate} />;
  if (view === "admin/privacy/notices")
    return <NoticesPage view={view} navigate={navigate} />;
  if (view === "admin/privacy/consents")
    return <ConsentsPage view={view} navigate={navigate} />;
  if (view === "admin/privacy/retention")
    return (
      <RetentionPage view={view} navigate={navigate} showToast={showToast} />
    );
  if (view === "admin/privacy/legal-holds")
    return <LegalHoldsPage view={view} navigate={navigate} />;
  if (view === "admin/privacy/vendors")
    return <VendorsPage view={view} navigate={navigate} />;
  if (view === "admin/privacy/incidents")
    return (
      <IncidentsPage view={view} navigate={navigate} showToast={showToast} />
    );
  if (view === "admin/privacy/assessments")
    return <AssessmentsPage view={view} navigate={navigate} />;
  if (view === "admin/privacy/exports")
    return (
      <ExportsPage view={view} navigate={navigate} showToast={showToast} />
    );
  return null;
}
export function renderPrivacyView(view, props) {
  return <CompliancePrivacyModule view={view} {...props} />;
}
