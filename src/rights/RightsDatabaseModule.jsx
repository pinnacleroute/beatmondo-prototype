import { useMemo, useState } from "react";
import {
  CheckCircle,
  FileArrowUp,
  Gavel,
  ShieldCheck,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import { useAuth } from "../auth/AuthContext.jsx";
import {
  ELIGIBILITY_STATUSES,
  RIGHTS_CHECKLIST,
  RIGHTS_REVIEWERS,
  RIGHTS_STATUSES,
  RIGHTS_STATUS_CONTENT,
  SELECTED_RIGHTS_KEY,
} from "./rightsData.js";
import {
  calculateCompleteness,
  calculateLicensingEligibility,
  calculateRightsStatus,
  rightsService,
} from "./rightsService.js";

export const RIGHTS_VIEWS = new Set([
  "admin-rights",
  "admin-rights-track",
  "admin-rights-parties",
  "admin-rights-documents",
  "admin-rights-reviews",
  "admin-rights-disputes",
  "admin-rights-expiring",
  "artist-rights",
]);
const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "Not set";
const reviewerName = (id) =>
  RIGHTS_REVIEWERS.find((item) => item.id === id)?.name || "Unassigned";
const safeJson = (value) =>
  typeof value === "string" ? value : JSON.stringify(value, null, 2);
function RightsStatusBadge({ status }) {
  return (
    <span
      className={`rights-status status-${String(status).toLowerCase().replaceAll(" ", "-")}`}
    >
      <span aria-hidden="true" />
      {status}
    </span>
  );
}
function EligibilityBadge({ status }) {
  return (
    <span
      className={`eligibility-badge eligibility-${String(status).toLowerCase().replaceAll(" ", "-")}`}
    >
      <span aria-hidden="true" />
      {status}
    </span>
  );
}
function Field({ label, hint, children }) {
  return (
    <label className="rights-field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}
function RightsEmpty({ title, text, action, onAction }) {
  return (
    <div className="rights-empty">
      <ShieldCheck />
      <h3>{title}</h3>
      <p>{text}</p>
      {action && (
        <button className="gold-button" onClick={onAction}>
          {action}
        </button>
      )}
    </div>
  );
}
function Completeness({ record }) {
  const completeness = calculateCompleteness(record);
  return (
    <div
      className="rights-completeness"
      aria-label={`Rights completeness ${completeness.percentage} percent`}
    >
      <div>
        <strong>{completeness.percentage}%</strong>
        <span>Rights completeness</span>
      </div>
      <div className="completeness-rail">
        <span style={{ width: `${completeness.percentage}%` }} />
      </div>
      {completeness.blockingIssues.length > 0 && (
        <div className="rights-blockers">
          <strong>Blocking</strong>
          {completeness.blockingIssues.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      )}
      {completeness.warnings.length > 0 && (
        <div className="rights-warnings">
          <strong>Warnings</strong>
          {completeness.warnings.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      )}
      <small>
        This score measures supplied workflow information, not legal certainty.
      </small>
    </div>
  );
}

export function RightsDashboard({ navigate, showToast }) {
  const { user, hasPermission } = useAuth();
  const [filters, setFilters] = useState({
    query: "",
    status: "All Statuses",
    eligibility: "All Eligibility",
    master: "All Master States",
    publishing: "All Publishing States",
    sample: "All Sample States",
    completeness: "All Completeness",
    artist: "All Artists",
    sort: "Highest Priority",
  });
  if (!user || !hasPermission("rights.view")) return null;
  const records = rightsService.getQueue(filters);
  const analytics = rightsService.getAnalytics();
  const open = (record) => {
    window.localStorage.setItem(SELECTED_RIGHTS_KEY, record.id);
    navigate("admin-rights-track");
  };
  const report = (type) => {
    const result = rightsService.generateReport(type, user);
    showToast(
      result.ok
        ? `${type} report prepared for print / CSV simulation.`
        : result.message,
    );
  };
  return (
    <section className="rights-page">
      <header className="rights-page-header">
        <div>
          <span className="eyebrow">Rights and clearance operations</span>
          <h2>Rights Database</h2>
          <p>
            Structured human review of master, composition, publishing,
            contributor, sample, territory, contract, and licensing authority
            data.
          </p>
        </div>
        <div className="rights-header-actions">
          <button onClick={() => navigate("admin-rights-parties")}>
            Rights Parties
          </button>
          <button onClick={() => navigate("admin-rights-documents")}>
            Documents
          </button>
          <button onClick={() => navigate("admin-rights-disputes")}>
            Disputes
          </button>
          <button onClick={() => navigate("admin-rights-expiring")}>
            Expiring
          </button>
          {user.role === "super_administrator" && (
            <button
              onClick={() => {
                rightsService.resetRightsDatabaseDemoData();
                setFilters((current) => ({ ...current }));
                showToast("Rights Database demo data has been reset.");
              }}
            >
              Reset rights demo
            </button>
          )}
        </div>
      </header>
      <div className="rights-legal-note">
        <Gavel />
        <div>
          <strong>Human-reviewed prototype data</strong>
          <span>
            No rights status or completeness score confirms legal ownership.
            Confidential evidence and internal rationale remain
            permission-restricted.
          </span>
        </div>
      </div>
      <div className="rights-metrics">
        {[
          ["Total tracks", analytics.total],
          ["Fully verified", analytics.fullyVerified],
          ["Partially verified", analytics.partiallyVerified],
          ["Documents requested", analytics.documentsRequested],
          ["Restricted", analytics.restricted],
          ["Disputed", analytics.disputed],
          ["Review expired", analytics.expiring],
          ["Average completeness", `${analytics.averageCompleteness}%`],
          ["Missing ownership", analytics.missingShares],
          ["Sample cases", analytics.sampleCases],
          ["Manual reviews", analytics.manualReviews],
          ["Verification rate", `${analytics.verificationRate}%`],
        ].map(([label, value]) => (
          <article key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </div>
      <div className="rights-filters">
        <input
          aria-label="Search rights records"
          placeholder="Search track, artist, ISRC, ISWC, writer, publisher, or owner"
          value={filters.query}
          onChange={(e) => setFilters({ ...filters, query: e.target.value })}
        />
        <select
          aria-label="Filter rights status"
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
        >
          <option>All Statuses</option>
          {RIGHTS_STATUSES.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <select
          aria-label="Filter licensing eligibility"
          value={filters.eligibility}
          onChange={(e) =>
            setFilters({ ...filters, eligibility: e.target.value })
          }
        >
          <option>All Eligibility</option>
          {ELIGIBILITY_STATUSES.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <select
          aria-label="Filter sample state"
          value={filters.sample}
          onChange={(e) => setFilters({ ...filters, sample: e.target.value })}
        >
          <option>All Sample States</option>
          <option>Clearance Required</option>
          <option>No Sample Declared</option>
        </select>
        <select
          aria-label="Filter completeness"
          value={filters.completeness}
          onChange={(e) =>
            setFilters({ ...filters, completeness: e.target.value })
          }
        >
          <option>All Completeness</option>
          <option>Below 70%</option>
          <option>70–89%</option>
          <option>90–100%</option>
        </select>
        <select
          aria-label="Sort rights queue"
          value={filters.sort}
          onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
        >
          <option>Highest Priority</option>
          <option>Lowest Completeness</option>
          <option>Oldest Review</option>
          <option>Track Title</option>
        </select>
      </div>
      <div className="rights-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Track</th>
              <th>Rights status</th>
              <th>Master</th>
              <th>Publishing</th>
              <th>Completeness</th>
              <th>Licensing</th>
              <th>Reviewer</th>
              <th>Updated</th>
              <th>Priority</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.id}>
                <td>
                  <strong>{record.trackTitle}</strong>
                  <small>
                    {record.artist} · {record.isrc || "ISRC pending"}
                  </small>
                </td>
                <td>
                  <RightsStatusBadge status={record.status} />
                </td>
                <td>
                  {record.masterRights.status}
                  <small>{record.masterRights.totalOwnership}% recorded</small>
                </td>
                <td>
                  {record.publishingRights.status}
                  <small>
                    {record.compositionRights.writerShareTotal}% writer shares
                  </small>
                </td>
                <td>
                  <strong>{record.completeness.percentage}%</strong>
                  {record.completeness.blockingIssues?.[0] && (
                    <small>{record.completeness.blockingIssues[0]}</small>
                  )}
                </td>
                <td>
                  <EligibilityBadge status={record.licensingEligibility} />
                </td>
                <td>{reviewerName(record.assignedReviewerId)}</td>
                <td>{formatDate(record.updatedAt)}</td>
                <td>{record.priority}</td>
                <td>
                  <button onClick={() => open(record)}>Review</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <section className="rights-report-panel">
        <div>
          <span className="eyebrow">Mock reports</span>
          <h3>Printable rights intelligence</h3>
        </div>
        {[
          "Rights summary",
          "Ownership gaps",
          "Expiring rights",
          "Disputes",
          "Licensing eligibility",
          "Track clearance",
        ].map((type) => (
          <button key={type} onClick={() => report(type)}>
            {type}
          </button>
        ))}
      </section>
    </section>
  );
}

const workspaceTabs = [
  "Summary",
  "Master Rights",
  "Composition",
  "Publishing",
  "Contributors",
  "Samples",
  "Contracts",
  "Territories",
  "Restrictions",
  "Documents",
  "Approvals",
  "Review Checklist",
  "Version History",
  "Internal Notes",
  "Activity",
  "Licensing Impact",
];
export function RightsTrackWorkspace({ navigate, showToast }) {
  const { user, hasPermission } = useAuth();
  const id = window.localStorage.getItem(SELECTED_RIGHTS_KEY) || "rights-1";
  const [record, setRecord] = useState(() => rightsService.getById(id));
  const [tab, setTab] = useState("Summary");
  const [modal, setModal] = useState(null);
  const [error, setError] = useState("");
  if (!user || !hasPermission("rights.view")) return null;
  if (!record)
    return (
      <RightsEmpty
        title="Rights record not found"
        text="The selected record is unavailable."
        action="Rights queue"
        onAction={() => navigate("admin-rights")}
      />
    );
  const reload = (next) => setRecord(next || rightsService.getById(id));
  const result = calculateLicensingEligibility(record);
  const action = (response, success) => {
    if (!response.ok) setError(response.message);
    else {
      setError("");
      reload(response.record);
      showToast(success);
    }
  };
  return (
    <section className="rights-page rights-workspace">
      <button className="plain-button" onClick={() => navigate("admin-rights")}>
        ← Rights queue
      </button>
      <header className="rights-page-header">
        <div>
          <span className="eyebrow">
            {record.id} · Version {record.version}
          </span>
          <h2>{record.trackTitle}</h2>
          <p>
            {record.artist} · {record.isrc || "ISRC pending"} ·{" "}
            {record.scenarioLabel}
          </p>
        </div>
        <div className="rights-header-state">
          <RightsStatusBadge status={record.status} />
          <EligibilityBadge status={record.licensingEligibility} />
        </div>
      </header>
      {error && (
        <div className="rights-error" role="alert">
          <WarningCircle />
          {error}
        </div>
      )}
      <div className="rights-workspace-summary">
        <Completeness record={record} />
        <dl>
          <dt>Master</dt>
          <dd>
            {record.masterRights.status} · {record.masterRights.totalOwnership}%
          </dd>
          <dt>Publishing</dt>
          <dd>
            {record.publishingRights.status} ·{" "}
            {record.publishingRights.publisherShareTotal}%
          </dd>
          <dt>Writers</dt>
          <dd>{record.compositionRights.writerShareTotal}%</dd>
          <dt>Samples</dt>
          <dd>
            {record.samples.length
              ? record.samples.map((item) => item.status).join(", ")
              : "No Sample Declared"}
          </dd>
          <dt>Territory</dt>
          <dd>{record.territories.included.join(", ")}</dd>
          <dt>Reviewer</dt>
          <dd>{reviewerName(record.assignedReviewerId)}</dd>
        </dl>
      </div>
      <nav className="rights-tabs" aria-label="Rights workspace sections">
        {workspaceTabs.map((item) => (
          <button
            key={item}
            aria-current={tab === item ? "page" : undefined}
            onClick={() => setTab(item)}
          >
            {item}
          </button>
        ))}
      </nav>
      {tab === "Summary" && (
        <RightsSummary
          record={record}
          result={result}
          user={user}
          onAssign={() => setModal("assign")}
          onVerify={() => setModal("verify")}
          onReverify={() =>
            action(
              rightsService.triggerReverification(
                record.id,
                user,
                "Scheduled rights reverification",
              ),
              "Reverification started.",
            )
          }
          onDispute={() => setModal("dispute")}
        />
      )}
      {tab === "Master Rights" && (
        <OwnershipEditor
          title="Master ownership"
          items={record.masterRights.owners}
          total={record.masterRights.totalOwnership}
          shareField="ownershipPercentage"
          nameField="partyName"
          canEdit={hasPermission("rights.edit")}
          onSave={(items, reason) =>
            action(
              rightsService.updateMasterOwners(record.id, items, user, reason),
              "Master ownership version saved.",
            )
          }
          onVerify={() =>
            action(
              rightsService.verifyDomain(record.id, "masterRights", user),
              "Master rights verified.",
            )
          }
        />
      )}
      {tab === "Composition" && (
        <OwnershipEditor
          title="Writers and composers"
          items={record.compositionRights.writers}
          total={record.compositionRights.writerShareTotal}
          shareField="writerShare"
          nameField="name"
          canEdit={hasPermission("rights.edit")}
          showIdentifiers
          onSave={(items, reason) =>
            action(
              rightsService.updateWriters(record.id, items, user, reason),
              "Writer-share version saved.",
            )
          }
        />
      )}
      {tab === "Publishing" && (
        <OwnershipEditor
          title="Publishers"
          items={record.publishingRights.publishers}
          total={record.publishingRights.publisherShareTotal}
          shareField="publisherShare"
          nameField="name"
          canEdit={hasPermission("rights.edit")}
          showIdentifiers
          onSave={(items, reason) =>
            action(
              rightsService.updatePublishers(record.id, items, user, reason),
              "Publisher-share version saved.",
            )
          }
          onVerify={() =>
            action(
              rightsService.verifyDomain(record.id, "publishingRights", user),
              "Publishing rights verified.",
            )
          }
        />
      )}
      {tab === "Contributors" && (
        <Contributors
          record={record}
          onAdd={(values) =>
            action(
              rightsService.addContributor(record.id, values, user),
              "Contributor added without treating participation as ownership.",
            )
          }
        />
      )}
      {tab === "Samples" && (
        <Samples
          record={record}
          onAdd={(values) =>
            action(
              rightsService.addSample(record.id, values, user),
              "Sample workflow added and eligibility recalculated.",
            )
          }
          onVerify={() =>
            action(
              rightsService.verifyDomain(record.id, "samples", user),
              "Samples marked cleared.",
            )
          }
        />
      )}
      {tab === "Contracts" && <Contracts record={record} />}
      {tab === "Territories" && (
        <Territories
          record={record}
          onAdd={(territory) =>
            action(
              rightsService.addTerritory(record.id, territory, user),
              "Territory saved; conflicts recalculated.",
            )
          }
        />
      )}
      {tab === "Restrictions" && (
        <Restrictions
          record={record}
          onAdd={(values) =>
            action(
              rightsService.addRestriction(record.id, values, user),
              "Restriction saved and eligibility recalculated.",
            )
          }
        />
      )}
      {tab === "Documents" && (
        <RightsDocuments
          record={record}
          user={user}
          onUpdate={reload}
          onError={setError}
          showToast={showToast}
        />
      )}
      {tab === "Approvals" && <Approvals record={record} />}
      {tab === "Review Checklist" && (
        <ReviewChecklist record={record} user={user} onUpdate={reload} />
      )}
      {tab === "Version History" && <VersionHistory record={record} />}
      {tab === "Internal Notes" && (
        <InternalNotes record={record} user={user} />
      )}
      {tab === "Activity" && <RightsActivity record={record} user={user} />}
      {tab === "Licensing Impact" && <LicensingImpact record={record} />}
      {modal === "assign" && (
        <AssignReviewer
          record={record}
          actor={user}
          onClose={() => setModal(null)}
          onComplete={(response) => {
            setModal(null);
            action(response, "Reviewer assignment updated.");
          }}
        />
      )}
      {modal === "verify" && (
        <FinalVerification
          record={record}
          actor={user}
          onClose={() => setModal(null)}
          onComplete={(response) => {
            setModal(null);
            action(response, "Final verification decision recorded.");
          }}
        />
      )}
      {modal === "dispute" && (
        <OpenDispute
          record={record}
          actor={user}
          onClose={() => setModal(null)}
          onComplete={(response) => {
            setModal(null);
            action(response, "Dispute opened; licensing and delivery blocked.");
          }}
        />
      )}
    </section>
  );
}

function RightsSummary({
  record,
  result,
  user,
  onAssign,
  onVerify,
  onReverify,
  onDispute,
}) {
  return (
    <div className="rights-section-grid">
      <section className="rights-panel">
        <h3>Rights summary</h3>
        <dl>
          <dt>Primary status</dt>
          <dd>{record.status}</dd>
          <dt>Licensing eligibility</dt>
          <dd>{result.eligibility}</dd>
          <dt>Rights version</dt>
          <dd>{record.version}</dd>
          <dt>Master verification</dt>
          <dd>{record.masterRights.status}</dd>
          <dt>Publishing verification</dt>
          <dd>{record.publishingRights.status}</dd>
          <dt>Samples</dt>
          <dd>
            {record.samples.length
              ? record.samples.map((item) => item.status).join(", ")
              : "No Sample Declared"}
          </dd>
          <dt>Last review</dt>
          <dd>{formatDate(record.review.lastReviewedAt)}</dd>
          <dt>Next review</dt>
          <dd>{formatDate(record.review.nextReviewAt)}</dd>
          <dt>Recommended action</dt>
          <dd>{RIGHTS_STATUS_CONTENT[record.status]?.next}</dd>
        </dl>
      </section>
      <section className="rights-panel">
        <h3>Blocking issues and next steps</h3>
        {result.blockingIssues.length ? (
          result.blockingIssues.map((item) => (
            <div className="blocking-item" key={item}>
              <WarningCircle />
              {item}
            </div>
          ))
        ) : (
          <p>No calculated blocking issues.</p>
        )}
        {result.requiredApprovals.map((item) => (
          <div className="approval-item" key={item}>
            <ShieldCheck />
            {item}
          </div>
        ))}
        <div className="rights-actions">
          <button onClick={onAssign}>Assign reviewer</button>
          <button onClick={onReverify}>Trigger reverification</button>
          <button onClick={onDispute}>Escalate dispute</button>
          <button className="gold-button" onClick={onVerify}>
            Final verification
          </button>
        </div>
      </section>
      <section className="rights-panel buyer-safe-preview">
        <span className="eyebrow">Buyer-safe preview</span>
        <h3>{record.publicSummary.status}</h3>
        <p>{record.publicSummary.wording}</p>
        <strong>{record.publicSummary.territory}</strong>
        <small>
          Ownership shares, contacts, contracts, legal evidence, and internal
          rationale are excluded.
        </small>
      </section>
    </div>
  );
}

function OwnershipEditor({
  title,
  items,
  total,
  shareField,
  nameField,
  canEdit,
  showIdentifiers = false,
  onSave,
  onVerify,
}) {
  const [draft, setDraft] = useState(items);
  const [reason, setReason] = useState("");
  const update = (index, key, value) =>
    setDraft(
      draft.map((item, position) =>
        position === index
          ? { ...item, [key]: key === shareField ? Number(value) : value }
          : item,
      ),
    );
  const draftTotal = draft.reduce(
    (sum, item) => sum + (Number(item[shareField]) || 0),
    0,
  );
  return (
    <section className="rights-panel ownership-editor">
      <div className="rights-panel-heading">
        <div>
          <h3>{title}</h3>
          <p>Percentages are never silently normalized.</p>
        </div>
        <div
          className={`ownership-total ${draftTotal === 100 ? "complete" : "invalid"}`}
          role="status"
        >
          <span>Recorded total</span>
          <strong>{draftTotal}%</strong>
        </div>
      </div>
      {draftTotal !== 100 && (
        <div className="rights-error" role="alert">
          <WarningCircle />
          {draftTotal < 100
            ? `${100 - draftTotal}% remains unconfirmed.`
            : `Shares exceed 100% by ${draftTotal - 100}%.`}
        </div>
      )}
      <div className="ownership-list">
        {draft.map((item, index) => (
          <article key={item.partyId || index}>
            <Field label="Party name">
              <input
                disabled={!canEdit}
                value={item[nameField]}
                onChange={(e) => update(index, nameField, e.target.value)}
              />
            </Field>
            <Field
              label="Share percentage"
              hint="Must total exactly 100% for final verification"
            >
              <input
                disabled={!canEdit}
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={item[shareField]}
                onChange={(e) => update(index, shareField, e.target.value)}
              />
            </Field>
            {showIdentifiers && (
              <>
                <Field label="PRO">
                  <input
                    disabled={!canEdit}
                    value={item.pro || ""}
                    onChange={(e) => update(index, "pro", e.target.value)}
                  />
                </Field>
                <Field label="IPI / CAE">
                  <input
                    disabled={!canEdit}
                    value={item.ipiCae || ""}
                    onChange={(e) => update(index, "ipiCae", e.target.value)}
                  />
                </Field>
              </>
            )}
            <Field label="Territory">
              <input
                disabled={!canEdit}
                value={item.territory || "Worldwide"}
                onChange={(e) => update(index, "territory", e.target.value)}
              />
            </Field>
            {canEdit && (
              <button
                onClick={() =>
                  setDraft(draft.filter((_, position) => position !== index))
                }
              >
                Remove
              </button>
            )}
          </article>
        ))}
      </div>
      {canEdit && (
        <div className="ownership-editor-actions">
          <button
            onClick={() =>
              setDraft([
                ...draft,
                {
                  partyId: `party-draft-${Date.now()}`,
                  [nameField]: "",
                  [shareField]: 0,
                  territory: "Worldwide",
                  evidenceDocumentIds: [],
                  pro: "",
                  ipiCae: "",
                },
              ])
            }
          >
            Add party
          </button>
          <input
            aria-label="Change reason"
            placeholder="Reason for this material rights change"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <button
            className="gold-button"
            onClick={() => onSave(draft, reason || `${title} updated`)}
          >
            Save new version
          </button>
          {onVerify && (
            <button className="outline-button" onClick={onVerify}>
              Mark verified
            </button>
          )}
        </div>
      )}
    </section>
  );
}

function Contributors({ record, onAdd }) {
  const [form, setForm] = useState({
    name: "",
    role: "Producer",
    contractStatus: "Pending Review",
    releaseStatus: "Pending Review",
    approvalRequired: false,
    revenueParticipation: "Not recorded",
    territory: "Worldwide",
  });
  return (
    <div className="rights-section-grid">
      <section className="rights-panel">
        <h3>Contributors</h3>
        {record.contributors.length ? (
          record.contributors.map((item) => (
            <article className="evidence-card" key={item.id}>
              <strong>{item.name}</strong>
              <span>
                {item.role} · {item.contractStatus} · Release{" "}
                {item.releaseStatus}
              </span>
              <p>
                {item.approvalRequired
                  ? "Approval required"
                  : "No contributor approval recorded"}{" "}
                · {item.territory}
              </p>
              <small>
                Contributor participation is not automatically ownership.
              </small>
            </article>
          ))
        ) : (
          <p>No contributors recorded.</p>
        )}
      </section>
      <section className="rights-panel">
        <h3>Add contributor</h3>
        <Field label="Name">
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </Field>
        <Field label="Role">
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            <option>Featured Artist</option>
            <option>Producer</option>
            <option>Session Performer</option>
            <option>Vocalist</option>
            <option>Remixer</option>
            <option>Guest Contributor</option>
          </select>
        </Field>
        <label className="rights-check">
          <input
            type="checkbox"
            checked={form.approvalRequired}
            onChange={(e) =>
              setForm({ ...form, approvalRequired: e.target.checked })
            }
          />
          Approval required
        </label>
        <button
          className="gold-button"
          onClick={() => {
            onAdd(form);
            setForm({ ...form, name: "" });
          }}
        >
          Add contributor
        </button>
      </section>
    </div>
  );
}

function Samples({ record, onAdd, onVerify }) {
  const [sourceTrack, setSourceTrack] = useState("");
  return (
    <div className="rights-section-grid">
      <section className="rights-panel">
        <h3>Samples and interpolations</h3>
        {record.samples.length ? (
          record.samples.map((item) => (
            <article className="sample-card" key={item.id}>
              <RightsStatusBadge status={item.status} />
              <strong>{item.sourceTrack}</strong>
              <span>
                {item.type} · {item.portionUsed}
              </span>
              <dl>
                <dt>Master clearance</dt>
                <dd>{item.masterClearance}</dd>
                <dt>Publishing clearance</dt>
                <dd>{item.publishingClearance}</dd>
                <dt>Territory</dt>
                <dd>{item.territory}</dd>
              </dl>
              <p>
                Confidential source owners and negotiation details remain
                restricted.
              </p>
            </article>
          ))
        ) : (
          <p>
            No sample declared. This remains a declaration, not automated
            confirmation.
          </p>
        )}
        <button className="outline-button" onClick={onVerify}>
          Mark samples cleared
        </button>
      </section>
      <section className="rights-panel">
        <h3>Declare a sample</h3>
        <Field label="Source track">
          <input
            value={sourceTrack}
            onChange={(e) => setSourceTrack(e.target.value)}
          />
        </Field>
        <button
          className="gold-button"
          onClick={() => {
            onAdd({ sourceTrack });
            setSourceTrack("");
          }}
        >
          Add sample workflow
        </button>
      </section>
    </div>
  );
}
function Contracts({ record }) {
  return (
    <section className="rights-panel">
      <h3>Contracts and authority</h3>
      {record.contracts.length ? (
        record.contracts.map((item) => (
          <article className="contract-card" key={item.id}>
            <strong>{item.type}</strong>
            <span>{item.parties.join(" ↔ ")}</span>
            <dl>
              <dt>Term</dt>
              <dd>
                {formatDate(item.effectiveDate)} – {formatDate(item.expiryDate)}
              </dd>
              <dt>Territory</dt>
              <dd>{item.territory}</dd>
              <dt>Licensing authority</dt>
              <dd>
                {item.licensingAuthority ? "Recorded" : "Not established"}
              </dd>
              <dt>Sublicensing</dt>
              <dd>
                {item.sublicensingAuthority ? "Recorded" : "Not recorded"}
              </dd>
              <dt>Verification</dt>
              <dd>{item.verificationState}</dd>
            </dl>
            <small>Revenue and contract terms are confidential.</small>
          </article>
        ))
      ) : (
        <p>No contract authority records supplied.</p>
      )}
    </section>
  );
}
function Territories({ record, onAdd }) {
  const [territory, setTerritory] = useState("United Kingdom");
  return (
    <div className="rights-section-grid">
      <section className="rights-panel">
        <h3>Territory control</h3>
        <div className="territory-list">
          {record.territories.included.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
        {record.territories.excluded.length > 0 && (
          <p>Excluded: {record.territories.excluded.join(", ")}</p>
        )}
        {record.territories.conflicts.length > 0 && (
          <div className="rights-error" role="alert">
            {record.territories.conflicts.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        )}
      </section>
      <section className="rights-panel">
        <h3>Add territory control</h3>
        <Field label="Territory">
          <select
            value={territory}
            onChange={(e) => setTerritory(e.target.value)}
          >
            {[
              "Worldwide",
              "United States",
              "Canada",
              "United Kingdom",
              "European Union",
              "Australia and New Zealand",
              "Latin America",
              "Asia-Pacific",
              "Middle East and North Africa",
            ].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </Field>
        <button className="gold-button" onClick={() => onAdd(territory)}>
          Add and check conflicts
        </button>
      </section>
    </div>
  );
}
function Restrictions({ record, onAdd }) {
  const [form, setForm] = useState({
    type: "Territory Restriction",
    description: "",
    publicVisibility: "Buyer Visible",
    buyerWording: "",
  });
  return (
    <div className="rights-section-grid">
      <section className="rights-panel">
        <h3>Structured restrictions</h3>
        {record.restrictions.length ? (
          record.restrictions.map((item) => (
            <article className="restriction-card" key={item.id}>
              <strong>{item.type}</strong>
              <span>
                {item.appliesTo} · {item.territory}
              </span>
              <p>{item.description}</p>
              <small>
                Buyer wording: {item.buyerWording || "Not published"}
              </small>
            </article>
          ))
        ) : (
          <p>No restrictions recorded.</p>
        )}
      </section>
      <section className="rights-panel">
        <h3>Add restriction</h3>
        <Field label="Type">
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          >
            {[
              "Territory Restriction",
              "Media Restriction",
              "Brand Category Restriction",
              "Political Use Restriction",
              "Artist Approval Required",
              "Publisher Approval Required",
              "Master Approval Required",
              "No Trailer Use",
              "No Advertising",
              "Other",
            ].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </Field>
        <Field label="Internal description">
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </Field>
        <Field label="Buyer-facing wording">
          <textarea
            value={form.buyerWording}
            onChange={(e) => setForm({ ...form, buyerWording: e.target.value })}
          />
        </Field>
        <button
          className="gold-button"
          onClick={() =>
            onAdd({
              ...form,
              buyerWording: form.buyerWording || form.description,
            })
          }
        >
          Add restriction
        </button>
      </section>
    </div>
  );
}

function RightsDocuments({ record, user, onUpdate, onError, showToast }) {
  const [fileCategory, setFileCategory] = useState("Split sheet");
  const [confidentiality, setConfidentiality] = useState("Internal");
  const documents = rightsService.getVisibleDocuments(record, user);
  const upload = (file) => {
    const response = rightsService.uploadDocument(
      record.id,
      file,
      fileCategory,
      confidentiality,
      user,
    );
    if (!response.ok) onError(response.message);
    else {
      onUpdate(response.record);
      showToast("Rights document metadata uploaded.");
    }
  };
  const review = (document, status) => {
    const response = rightsService.reviewDocument(
      record.id,
      document.id,
      status,
      `Reviewer changed document to ${status}.`,
      user,
    );
    if (!response.ok) onError(response.message);
    else {
      onUpdate(response.record);
      showToast(`Document ${status.toLowerCase()}.`);
    }
  };
  return (
    <section className="rights-panel">
      <div className="rights-panel-heading">
        <div>
          <h3>Rights documents</h3>
          <p>Confidentiality is enforced by role and document level.</p>
        </div>
        <div className="document-upload-controls">
          <select
            aria-label="Document category"
            value={fileCategory}
            onChange={(e) => setFileCategory(e.target.value)}
          >
            {[
              "Split sheet",
              "Master ownership agreement",
              "Publishing agreement",
              "PRO registration",
              "Contributor release",
              "Producer agreement",
              "Sample clearance",
              "Licensing mandate",
              "Territory schedule",
              "Dispute evidence",
              "Other",
            ].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <select
            aria-label="Confidentiality level"
            value={confidentiality}
            onChange={(e) => setConfidentiality(e.target.value)}
          >
            {[
              "Public Summary",
              "Buyer Visible",
              "Internal",
              "Legal Restricted",
              "Super Admin Only",
            ].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <label className="file-upload-button">
            <FileArrowUp />
            Upload mock file
            <input
              type="file"
              onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
            />
          </label>
        </div>
      </div>
      <div className="rights-document-grid">
        {documents.map((doc) => (
          <article key={doc.id}>
            <FileArrowUp />
            <div>
              <strong>{doc.fileName}</strong>
              <span>
                {doc.category} · {doc.fileSize} · Version {doc.version}
              </span>
              <small>
                {doc.confidentiality} · Uploaded {formatDate(doc.uploadedAt)}
              </small>
            </div>
            <RightsStatusBadge status={doc.reviewStatus} />
            <div className="document-actions">
              <button onClick={() => showToast("Mock file download prepared.")}>
                Download mock
              </button>
              <button onClick={() => review(doc, "Accepted")}>Accept</button>
              <button onClick={() => review(doc, "Rejected")}>Reject</button>
              <button onClick={() => review(doc, "Replacement Requested")}>
                Request replacement
              </button>
            </div>
            {doc.privateNote && <small>Private note: {doc.privateNote}</small>}
          </article>
        ))}
      </div>
    </section>
  );
}
function Approvals({ record }) {
  return (
    <section className="rights-panel">
      <h3>Approval requirements</h3>
      {record.approvalRequirements.length ? (
        record.approvalRequirements.map((item) => (
          <article className="approval-card" key={item.id}>
            <strong>{item.type}</strong>
            <span>
              {item.responseStatus} · {item.territory}
            </span>
            <p>
              {item.triggerConditions} · {item.usageType}
            </p>
            <small>
              Approver identity is internal; buyers receive only the approval
              requirement.
            </small>
          </article>
        ))
      ) : (
        <p>No separate approvals recorded.</p>
      )}
    </section>
  );
}
function ReviewChecklist({ record, user, onUpdate }) {
  return (
    <section className="rights-panel">
      <h3>Rights-review checklist</h3>
      <p>
        Blocking items prevent final verification unless a super-administrator
        records an override reason.
      </p>
      <div className="rights-checklist">
        {RIGHTS_CHECKLIST.map((item) => (
          <label key={item}>
            <input
              type="checkbox"
              checked={Boolean(record.review.checklist[item])}
              onChange={(e) => {
                const response = rightsService.updateChecklist(
                  record.id,
                  item,
                  e.target.checked,
                  user,
                );
                if (response.ok) onUpdate(response.record);
              }}
            />
            {item}
          </label>
        ))}
      </div>
    </section>
  );
}
function VersionHistory({ record }) {
  const [left, setLeft] = useState(record.versions.at(-1)?.version || 1);
  const [right, setRight] = useState(record.versions[0]?.version || 1);
  const comparison = rightsService.compareVersions(record.id, left, right);
  return (
    <div className="rights-section-grid">
      <section className="rights-panel">
        <h3>Immutable-style version history</h3>
        {record.versions.map((version) => (
          <article className="version-card" key={version.version}>
            <strong>
              Version {version.version} {version.current && "· Current"}
            </strong>
            <span>
              {formatDate(version.effectiveDate)} · {version.createdBy}
            </span>
            <p>{version.summary}</p>
            <small>{version.reason}</small>
          </article>
        ))}
      </section>
      <section className="rights-panel">
        <h3>Compare versions</h3>
        <div className="version-selectors">
          <select
            aria-label="Compare from version"
            value={left}
            onChange={(e) => setLeft(Number(e.target.value))}
          >
            {record.versions.map((item) => (
              <option value={item.version} key={item.version}>
                Version {item.version}
              </option>
            ))}
          </select>
          <select
            aria-label="Compare to version"
            value={right}
            onChange={(e) => setRight(Number(e.target.value))}
          >
            {record.versions.map((item) => (
              <option value={item.version} key={item.version}>
                Version {item.version}
              </option>
            ))}
          </select>
        </div>
        {comparison?.changes?.length ? (
          comparison.changes.map((change) => (
            <article className="comparison-card" key={change.label}>
              <strong>{change.label}</strong>
              <div>
                <span>Before</span>
                <pre>{safeJson(change.before)}</pre>
              </div>
              <div>
                <span>After</span>
                <pre>{safeJson(change.after)}</pre>
              </div>
            </article>
          ))
        ) : (
          <p>No material difference between these versions.</p>
        )}
      </section>
    </div>
  );
}
function InternalNotes({ record, user }) {
  const canLegal =
    user.permissions?.includes("*") ||
    user.permissions?.includes("rights.view_legal_notes");
  const canInternal =
    canLegal || user.permissions?.includes("rights.view_internal_notes");
  const notes = record.internalNotes.filter((item) =>
    item.visibility === "Internal" ? canInternal : canLegal,
  );
  return (
    <section className="rights-panel">
      <h3>Internal and legal notes</h3>
      {notes.map((note) => (
        <article className="internal-note" key={note.id}>
          <strong>{note.visibility}</strong>
          <p>{note.content}</p>
          <small>
            {note.author} · {formatDate(note.createdAt)}
          </small>
        </article>
      ))}
      {!notes.length && <p>No notes are visible to this role.</p>}
    </section>
  );
}
function RightsActivity({ record, user }) {
  const canLegal =
    user.permissions?.includes("*") ||
    user.permissions?.includes("rights.view_legal_notes");
  const events = record.activity.filter(
    (item) =>
      !["Legal Restricted", "Super Admin Only"].includes(item.visibility) ||
      canLegal,
  );
  return (
    <section className="rights-panel">
      <h3>Rights activity</h3>
      <div className="rights-activity-list">
        {events.map((event) => (
          <article key={event.id}>
            <span />
            <div>
              <strong>{event.action}</strong>
              <p>{event.description}</p>
              <small>
                {event.actor} · {new Date(event.timestamp).toLocaleString()} ·
                Version {event.version}
              </small>
            </div>
            <RightsStatusBadge status={event.visibility} />
          </article>
        ))}
      </div>
    </section>
  );
}
function LicensingImpact({ record }) {
  const [context, setContext] = useState({
    territory: "United States",
    media: "Advertising",
    usageType: "commercial",
    deliveryAssets: ["Master", "Stems"],
  });
  const result = useMemo(
    () => calculateLicensingEligibility(record, context),
    [record, context],
  );
  return (
    <div className="rights-section-grid">
      <section className="rights-panel">
        <h3>Request-context simulation</h3>
        <Field label="Territory">
          <select
            value={context.territory}
            onChange={(e) =>
              setContext({ ...context, territory: e.target.value })
            }
          >
            <option>United States</option>
            <option>Canada</option>
            <option>United Kingdom</option>
            <option>Worldwide</option>
          </select>
        </Field>
        <Field label="Media">
          <select
            value={context.media}
            onChange={(e) => setContext({ ...context, media: e.target.value })}
          >
            <option>Advertising</option>
            <option>Film</option>
            <option>Trailer</option>
            <option>Television</option>
          </select>
        </Field>
      </section>
      <section className="rights-panel">
        <h3>Calculated licensing impact</h3>
        <EligibilityBadge status={result.eligibility} />
        <dl>
          <dt>Manual review</dt>
          <dd>{result.manualReviewRequired ? "Required" : "Not required"}</dd>
          <dt>Allowed assets</dt>
          <dd>{result.allowedAssets.join(", ")}</dd>
          <dt>Blocked assets</dt>
          <dd>{result.blockedAssets.join(", ")}</dd>
          <dt>Required approvals</dt>
          <dd>{result.requiredApprovals.join(", ") || "None"}</dd>
        </dl>
        {result.blockingIssues.map((item) => (
          <div className="blocking-item" key={item}>
            <WarningCircle />
            {item}
          </div>
        ))}
        {result.restrictions.map((item) => (
          <p key={item}>{item}</p>
        ))}
      </section>
    </div>
  );
}

function AssignReviewer({ record, actor, onClose, onComplete }) {
  const [reviewerId, setReviewerId] = useState(record.assignedReviewerId);
  const [priority, setPriority] = useState(record.priority);
  const [dueDate, setDueDate] = useState(record.review.dueDate || "2026-07-30");
  return (
    <div
      className="rights-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="assign-rights-title"
    >
      <div className="rights-modal">
        <button className="modal-x" onClick={onClose} aria-label="Close">
          <X />
        </button>
        <h3 id="assign-rights-title">Assign rights reviewer</h3>
        <Field label="Reviewer">
          <select
            value={reviewerId}
            onChange={(e) => setReviewerId(e.target.value)}
          >
            {RIGHTS_REVIEWERS.map((item) => (
              <option value={item.id} key={item.id}>
                {item.name} — {item.role}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Priority">
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option>Standard</option>
            <option>High</option>
            <option>Urgent</option>
            <option>Critical</option>
          </select>
        </Field>
        <Field label="Due date">
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </Field>
        <div className="modal-actions">
          <button onClick={onClose}>Cancel</button>
          <button
            className="gold-button"
            onClick={() =>
              onComplete(
                rightsService.assignReviewer(
                  record.id,
                  reviewerId,
                  priority,
                  dueDate,
                  actor,
                ),
              )
            }
          >
            Save assignment
          </button>
        </div>
      </div>
    </div>
  );
}
function FinalVerification({ record, actor, onClose, onComplete }) {
  const [override, setOverride] = useState("");
  const blockers = [
    ...calculateCompleteness(record).blockingIssues,
    ...RIGHTS_CHECKLIST.filter((item) => !record.review.checklist[item]).map(
      (item) => `Checklist: ${item}`,
    ),
  ];
  return (
    <div
      className="rights-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="final-rights-title"
    >
      <div className="rights-modal">
        <button className="modal-x" onClick={onClose} aria-label="Close">
          <X />
        </button>
        <h3 id="final-rights-title">Final rights verification</h3>
        {blockers.length ? (
          <div className="rights-error" role="alert">
            <strong>Verification blockers</strong>
            {blockers.slice(0, 8).map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        ) : (
          <div className="rights-success">
            <CheckCircle />
            All calculated prerequisites are complete.
          </div>
        )}
        <Field
          label="Super-administrator override reason"
          hint="Required to override blockers; every override creates activity and a new version."
        >
          <textarea
            value={override}
            onChange={(e) => setOverride(e.target.value)}
          />
        </Field>
        <div className="modal-actions">
          <button onClick={onClose}>Cancel</button>
          <button
            className="gold-button"
            onClick={() =>
              onComplete(
                rightsService.markFullyVerified(record.id, actor, override),
              )
            }
          >
            Mark Fully Verified
          </button>
        </div>
      </div>
    </div>
  );
}
function OpenDispute({ record, actor, onClose, onComplete }) {
  const [form, setForm] = useState({
    claimant: "",
    claimType: "Master ownership",
    claimedPercentage: 0,
    rightsDomain: "Master",
    legalReviewer: "Preston Repenning",
  });
  return (
    <div
      className="rights-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="open-dispute-title"
    >
      <div className="rights-modal">
        <button className="modal-x" onClick={onClose} aria-label="Close">
          <X />
        </button>
        <h3 id="open-dispute-title">Open rights dispute</h3>
        <p>
          Opening a dispute blocks licensing and secure delivery while
          preserving historical licence records.
        </p>
        <Field label="Claimant">
          <input
            value={form.claimant}
            onChange={(e) => setForm({ ...form, claimant: e.target.value })}
          />
        </Field>
        <Field label="Claim type">
          <input
            value={form.claimType}
            onChange={(e) => setForm({ ...form, claimType: e.target.value })}
          />
        </Field>
        <Field label="Claimed percentage">
          <input
            type="number"
            min="0"
            max="100"
            value={form.claimedPercentage}
            onChange={(e) =>
              setForm({ ...form, claimedPercentage: e.target.value })
            }
          />
        </Field>
        <div className="modal-actions">
          <button onClick={onClose}>Cancel</button>
          <button
            className="red-button"
            onClick={() =>
              onComplete(rightsService.openDispute(record.id, form, actor))
            }
          >
            Open and block track
          </button>
        </div>
      </div>
    </div>
  );
}

export function RightsPartiesPage({ navigate, showToast }) {
  const { user, hasPermission } = useAuth();
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({
    legalName: "",
    partyType: "Individual",
    contactEmail: "",
    country: "",
    pro: "",
    ipiCae: "",
  });
  const [error, setError] = useState("");
  if (!user || !hasPermission("rights.view")) return null;
  const parties = rightsService.getParties({ query });
  const create = () => {
    const response = rightsService.createParty(form, user);
    if (!response.ok) setError(response.message);
    else {
      setAdding(false);
      setForm({ ...form, legalName: "", contactEmail: "", ipiCae: "" });
      showToast("Reusable rights party created.");
    }
  };
  return (
    <section className="rights-page">
      <header className="rights-page-header">
        <div>
          <span className="eyebrow">Reusable rights identities</span>
          <h2>Rights Parties</h2>
          <p>
            Party contacts, identifiers, verification, documents, and private
            notes are restricted to authorized operations roles.
          </p>
        </div>
        <button className="gold-button" onClick={() => setAdding(true)}>
          Create rights party
        </button>
      </header>
      {error && (
        <div className="rights-error" role="alert">
          {error}
        </div>
      )}
      <input
        className="rights-search"
        aria-label="Search rights parties"
        placeholder="Search legal name, party type, PRO, or IPI"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="party-grid">
        {parties.map((party) => (
          <article key={party.id}>
            <strong>{party.displayName}</strong>
            <span>
              {party.legalName} · {party.partyType}
            </span>
            <dl>
              <dt>Country</dt>
              <dd>{party.country || "Not supplied"}</dd>
              <dt>PRO</dt>
              <dd>{party.pro || "Not supplied"}</dd>
              <dt>IPI / CAE</dt>
              <dd>{party.ipiCae || "Not supplied"}</dd>
              <dt>Verification</dt>
              <dd>{party.verificationStatus}</dd>
            </dl>
            <small>Contact and internal notes are not buyer visible.</small>
          </article>
        ))}
      </div>
      <button className="plain-button" onClick={() => navigate("admin-rights")}>
        ← Rights Database
      </button>
      {adding && (
        <div
          className="rights-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="party-title"
        >
          <div className="rights-modal">
            <button
              className="modal-x"
              onClick={() => setAdding(false)}
              aria-label="Close"
            >
              <X />
            </button>
            <h3 id="party-title">Create reusable rights party</h3>
            <Field label="Legal name">
              <input
                value={form.legalName}
                onChange={(e) =>
                  setForm({ ...form, legalName: e.target.value })
                }
              />
            </Field>
            <Field label="Party type">
              <select
                value={form.partyType}
                onChange={(e) =>
                  setForm({ ...form, partyType: e.target.value })
                }
              >
                {[
                  "Individual",
                  "Artist",
                  "Writer",
                  "Composer",
                  "Publisher",
                  "Publishing Administrator",
                  "Master Owner",
                  "Record Label",
                  "Licensing Representative",
                  "Producer",
                  "Performer",
                  "Management Company",
                  "Estate",
                  "Trust",
                  "Other",
                ].map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </Field>
            <Field label="Contact email">
              <input
                type="email"
                value={form.contactEmail}
                onChange={(e) =>
                  setForm({ ...form, contactEmail: e.target.value })
                }
              />
            </Field>
            <Field label="PRO">
              <input
                value={form.pro}
                onChange={(e) => setForm({ ...form, pro: e.target.value })}
              />
            </Field>
            <Field label="IPI / CAE">
              <input
                value={form.ipiCae}
                onChange={(e) => setForm({ ...form, ipiCae: e.target.value })}
              />
            </Field>
            <div className="modal-actions">
              <button onClick={() => setAdding(false)}>Cancel</button>
              <button className="gold-button" onClick={create}>
                Create party
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export function RightsDocumentsPage({ navigate }) {
  const { user, hasPermission } = useAuth();
  const [status, setStatus] = useState("All Statuses");
  if (!user || !hasPermission("rights.view")) return null;
  const documents = rightsService.getDocuments({ status });
  return (
    <section className="rights-page">
      <header className="rights-page-header">
        <div>
          <span className="eyebrow">Evidence and authority</span>
          <h2>Rights Documents</h2>
          <p>
            Mock storage references and confidentiality levels demonstrate
            controlled document operations.
          </p>
        </div>
      </header>
      <select
        aria-label="Filter rights document status"
        value={status}
        onChange={(e) => setStatus(e.target.value)}
      >
        <option>All Statuses</option>
        {[
          "Uploaded",
          "Pending Review",
          "Accepted",
          "Rejected",
          "Replacement Requested",
          "Superseded",
          "Expired",
          "Restricted",
        ].map((item) => (
          <option key={item}>{item}</option>
        ))}
      </select>
      <div className="rights-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Document</th>
              <th>Category</th>
              <th>Track</th>
              <th>Status</th>
              <th>Confidentiality</th>
              <th>Uploaded</th>
              <th>Expiry</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => (
              <tr key={doc.id}>
                <td>
                  <strong>{doc.fileName}</strong>
                  <small>
                    {doc.fileType} · {doc.fileSize}
                  </small>
                </td>
                <td>{doc.category}</td>
                <td>{doc.relatedTrackId}</td>
                <td>
                  <RightsStatusBadge status={doc.reviewStatus} />
                </td>
                <td>{doc.confidentiality}</td>
                <td>{formatDate(doc.uploadedAt)}</td>
                <td>{formatDate(doc.expiryDate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button className="plain-button" onClick={() => navigate("admin-rights")}>
        ← Rights Database
      </button>
    </section>
  );
}

export function RightsDisputesPage({ navigate, showToast }) {
  const { user, hasPermission } = useAuth();
  const [records, setRecords] = useState(() =>
    rightsService.getQueue().filter((item) => item.disputes.length),
  );
  if (!user || !hasPermission("rights.view")) return null;
  const update = (record, dispute, status) => {
    const response = rightsService.updateDispute(
      record.id,
      dispute.id,
      status,
      status === "Resolved"
        ? "Prototype resolution recorded; new rights review required."
        : "Status updated.",
      user,
    );
    if (!response.ok) showToast(response.message);
    else {
      setRecords(
        rightsService.getQueue().filter((item) => item.disputes.length),
      );
      showToast(`Dispute ${status.toLowerCase()}.`);
    }
  };
  return (
    <section className="rights-page">
      <header className="rights-page-header">
        <div>
          <span className="eyebrow">Legal-restricted workflow</span>
          <h2>Rights Disputes</h2>
          <p>
            Active claims block licensing and delivery while preserving existing
            licence history.
          </p>
        </div>
      </header>
      <div className="dispute-grid">
        {records.flatMap((record) =>
          record.disputes.map((dispute) => (
            <article key={dispute.id}>
              <RightsStatusBadge status={dispute.status} />
              <span>{dispute.reference}</span>
              <h3>{record.trackTitle}</h3>
              <p>
                {dispute.claimType} · {dispute.rightsDomain} ·{" "}
                {dispute.claimedPercentage}% claimed
              </p>
              <dl>
                <dt>Date raised</dt>
                <dd>{formatDate(dispute.dateRaised)}</dd>
                <dt>Internal owner</dt>
                <dd>{dispute.internalOwner}</dd>
                <dt>Legal reviewer</dt>
                <dd>{dispute.legalReviewer}</dd>
                <dt>Buyer impact</dt>
                <dd>{dispute.buyerImpact}</dd>
              </dl>
              {hasPermission("rights.manage_disputes") && (
                <div className="rights-actions">
                  <button
                    onClick={() =>
                      update(record, dispute, "Under Legal Review")
                    }
                  >
                    Legal review
                  </button>
                  <button
                    className="gold-button"
                    onClick={() => update(record, dispute, "Resolved")}
                  >
                    Resolve
                  </button>
                </div>
              )}
            </article>
          )),
        )}
      </div>
      <button className="plain-button" onClick={() => navigate("admin-rights")}>
        ← Rights Database
      </button>
    </section>
  );
}

export function RightsExpiringPage({ navigate, showToast }) {
  const { user, hasPermission } = useAuth();
  if (!user || !hasPermission("rights.view")) return null;
  const records = rightsService
    .getQueue()
    .filter(
      (item) => item.status === "Review Expired" || item.review.nextReviewAt,
    );
  return (
    <section className="rights-page">
      <header className="rights-page-header">
        <div>
          <span className="eyebrow">Expiry and reverification</span>
          <h2>Rights Reviews</h2>
          <p>
            Alerts model 90-, 60-, 30-, and 7-day review windows. No background
            jobs run in this prototype.
          </p>
        </div>
      </header>
      <div className="expiry-grid">
        {records.map((record) => (
          <article key={record.id}>
            <RightsStatusBadge status={record.review.expiryStatus} />
            <h3>{record.trackTitle}</h3>
            <span>{record.artist}</span>
            <dl>
              <dt>Last reviewed</dt>
              <dd>{formatDate(record.review.lastReviewedAt)}</dd>
              <dt>Next review</dt>
              <dd>{formatDate(record.review.nextReviewAt)}</dd>
              <dt>Licensing</dt>
              <dd>{record.licensingEligibility}</dd>
            </dl>
            <button
              onClick={() => {
                const response = rightsService.triggerReverification(
                  record.id,
                  user,
                  "Expiry review triggered",
                );
                showToast(
                  response.ok ? "Reverification started." : response.message,
                );
              }}
            >
              Trigger reverification
            </button>
          </article>
        ))}
      </div>
      <button className="plain-button" onClick={() => navigate("admin-rights")}>
        ← Rights Database
      </button>
    </section>
  );
}

export function ArtistRightsPage({ navigate, showToast }) {
  const { user } = useAuth();
  const [records, setRecords] = useState(() =>
    rightsService.getArtistRecords(user),
  );
  const [message, setMessage] = useState("");
  if (!user || user.role !== "artist") return null;
  const submit = (record) => {
    const response = rightsService.submitArtistCorrection(
      record.id,
      {
        message,
        declaration:
          "I confirm this correction is accurate to the best of my knowledge.",
      },
      user,
    );
    if (!response.ok) showToast(response.message);
    else {
      setRecords(rightsService.getArtistRecords(user));
      setMessage("");
      showToast("Rights correction submitted for human review.");
    }
  };
  return (
    <section className="rights-page artist-rights-page">
      <header className="rights-page-header">
        <div>
          <span className="eyebrow">Artist / rightsholder workspace</span>
          <h2>Catalog rights review</h2>
          <p>
            View limited rights status, missing information, requested actions,
            and your own submitted documents. Final verification remains
            internal.
          </p>
        </div>
      </header>
      {records.map((record) => (
        <article className="artist-rights-card" key={record.id}>
          <div>
            <h3>{record.trackTitle}</h3>
            <RightsStatusBadge status={record.status} />
            <EligibilityBadge status={record.licensingEligibility} />
          </div>
          <Completeness record={record} />
          <section>
            <strong>Next action</strong>
            <p>{RIGHTS_STATUS_CONTENT[record.status]?.next}</p>
            <ul>
              {record.completeness.missingSections.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
          <section className="artist-correction">
            <h4>Submit a correction or rights response</h4>
            <textarea
              aria-label={`Correction for ${record.trackTitle}`}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe the correction and evidence you can provide."
            />
            <button
              className="gold-button"
              disabled={!message.trim()}
              onClick={() => submit(record)}
            >
              Submit for review
            </button>
          </section>
          <small>
            You cannot see other parties’ contracts, contact details, buyer
            information, legal notes, risk analysis, or internal approval
            rationale.
          </small>
        </article>
      ))}
    </section>
  );
}

export function BuyerRightsSummary({ trackId, compact = false }) {
  const summary = rightsService.getBuyerSummary(trackId);
  if (!summary)
    return (
      <div className="buyer-rights-summary">
        <strong>Rights review required</strong>
        <span>No approved rights summary is available.</span>
      </div>
    );
  return (
    <section className={`buyer-rights-summary ${compact ? "compact" : ""}`}>
      <div>
        <span className="eyebrow">Buyer-safe rights summary</span>
        <h3>{summary.status}</h3>
        <EligibilityBadge status={summary.eligibility} />
      </div>
      <p>{summary.wording}</p>
      <dl>
        <dt>Master</dt>
        <dd>{summary.master}</dd>
        <dt>Publishing</dt>
        <dd>{summary.publishing}</dd>
        <dt>Territory</dt>
        <dd>{summary.territory}</dd>
        <dt>Approvals</dt>
        <dd>{summary.approvals}</dd>
        <dt>Stems</dt>
        <dd>{summary.stems}</dd>
        <dt>Delivery</dt>
        <dd>{summary.delivery}</dd>
      </dl>
      {summary.restrictions.map((item) => (
        <div className="buyer-rights-restriction" key={item}>
          {item}
        </div>
      ))}
      <small>
        Ownership shares, contracts, contacts, evidence, disputes, and internal
        rationale are confidential.
      </small>
    </section>
  );
}

export function renderRightsView(view, props) {
  if (view === "admin-rights" || view === "admin-rights-reviews")
    return <RightsDashboard {...props} />;
  if (view === "admin-rights-track") return <RightsTrackWorkspace {...props} />;
  if (view === "admin-rights-parties") return <RightsPartiesPage {...props} />;
  if (view === "admin-rights-documents")
    return <RightsDocumentsPage {...props} />;
  if (view === "admin-rights-disputes")
    return <RightsDisputesPage {...props} />;
  if (view === "admin-rights-expiring")
    return <RightsExpiringPage {...props} />;
  if (view === "artist-rights") return <ArtistRightsPage {...props} />;
  return null;
}
