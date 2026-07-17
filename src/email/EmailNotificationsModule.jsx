import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  CheckCircle,
  Clock,
  Envelope,
  Eye,
  FileText,
  Funnel,
  GearSix,
  PaperPlaneTilt,
  Pause,
  Play,
  ShieldCheck,
  TrendUp,
  WarningCircle,
} from "@phosphor-icons/react";
import { useAuth } from "../auth/AuthContext.jsx";
import { authService } from "../auth/authService.js";
import {
  EMAIL_CATEGORIES,
  EMAIL_PRIORITIES,
  EMAIL_STATUSES,
} from "./emailData.js";
import { emailService } from "./emailService.js";
import { AccountSettingsNav } from "../ui/AccountSettingsNav.jsx";
import "./email.css";

export const EMAIL_VIEWS = new Set([
  "notifications",
  "email/message",
  "settings/notifications",
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
]);
const can = (user, permission) =>
  user?.permissions?.includes("*") || user?.permissions?.includes(permission);
const date = (value) =>
  value
    ? new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "—";
const Status = ({ value }) => (
  <span
    className={`em-status em-${String(value).toLowerCase().replaceAll(" ", "-")}`}
  >
    {value}
  </span>
);
const Header = ({ eyebrow, title, text, actions }) => (
  <header className="em-header">
    <div>
      <span>{eyebrow}</span>
      <h1>{title}</h1>
      <p>{text}</p>
    </div>
    {actions && <div className="em-actions">{actions}</div>}
  </header>
);
const Notice = () => (
  <div className="em-notice">
    <Envelope />
    <span>
      <strong>Simulated transactional email.</strong> No message is sent to a
      real provider or mailbox. Sending domains, delivery, engagement, bounce
      handling, and secure action exchange require production infrastructure.
    </span>
  </div>
);
const Metric = ({ label, value, tone }) => (
  <article className={`em-metric ${tone || ""}`}>
    <span>{label}</span>
    <strong>{value}</strong>
  </article>
);

function AdminNav({ navigate, active }) {
  return (
    <nav className="em-subnav" aria-label="Email administration sections">
      {[
        ["admin/email", "Overview"],
        ["admin/email/queue", "Queue"],
        ["admin/email/messages", "Messages"],
        ["admin/email/templates", "Templates"],
        ["admin/email/triggers", "Triggers"],
        ["admin/email/preferences", "Preferences"],
        ["admin/email/failures", "Failures"],
        ["admin/email/analytics", "Analytics"],
      ].map(([view, label]) => (
        <button
          key={view}
          className={view === active ? "active" : ""}
          onClick={() => navigate(view)}
        >
          {label}
        </button>
      ))}
    </nav>
  );
}
function MessageTable({
  messages,
  navigate,
  empty = "No visible messages match this view.",
}) {
  const inspect = (item) => {
    emailService.selectMessage(item.id);
    navigate("admin/email/message");
  };
  return (
    <div className="em-table-wrap">
      <table className="em-table">
        <thead>
          <tr>
            <th>Message</th>
            <th>Recipient</th>
            <th>Workflow</th>
            <th>Status</th>
            <th>Priority</th>
            <th>Created</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {messages.map((item) => (
            <tr key={item.id}>
              <td>
                <strong>{item.subject}</strong>
                <span>
                  {item.reference} · v{item.templateVersion}
                </span>
              </td>
              <td>
                <strong>{item.recipients[0]?.displayName}</strong>
                <span>{item.recipients.length} recipient(s)</span>
              </td>
              <td>
                <strong>{item.category}</strong>
                <span>
                  {item.relatedReferences.join(" · ") || item.triggerEvent}
                </span>
              </td>
              <td>
                <Status value={item.status} />
              </td>
              <td>
                <Status value={item.priority} />
              </td>
              <td>{date(item.createdAt)}</td>
              <td>
                <button className="text-action" onClick={() => inspect(item)}>
                  Inspect <ArrowRight />
                </button>
              </td>
            </tr>
          ))}
          {!messages.length && (
            <tr>
              <td colSpan="7" className="em-empty">
                {empty}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function UnifiedMessageCentre({ navigate }) {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const result = emailService.query({ search, category }, user);
  const open = (item) => {
    emailService.selectMessage(item.id);
    navigate(
      user?.userType === "internal" ? "admin/email/message" : "email/message",
    );
  };
  return (
    <section className="em-page em-centre">
      <Header
        eyebrow="Email and in-app communication"
        title="Message centre"
        text="Transactional updates, optional reminders, and protected workflow actions for your account and organization."
        actions={
          <button
            className="btn secondary"
            onClick={() => navigate("settings/notifications")}
          >
            <GearSix /> Notification preferences
          </button>
        }
      />
      <Notice />
      <div className="em-toolbar">
        <label>
          <Funnel />
          <input
            aria-label="Search messages"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Subject, reference, project or record"
          />
        </label>
        <select
          aria-label="Filter message category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option>All</option>
          {EMAIL_CATEGORIES.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </div>
      <div className="em-message-list">
        {result.messages.map((item) => (
          <button key={item.id} onClick={() => open(item)}>
            <span className="em-message-icon">
              <Envelope />
            </span>
            <span>
              <small>
                {item.category} · {item.reference}
              </small>
              <strong>{item.subject}</strong>
              <span>{item.preheader}</span>
              <time>{date(item.deliveredAt || item.createdAt)}</time>
            </span>
            <span>
              <Status value={item.status} />
              {item.metadata?.actionUrl && (
                <em>
                  Open related record <ArrowRight />
                </em>
              )}
            </span>
          </button>
        ))}
        {!result.total && (
          <div className="em-empty-card">
            <Envelope />
            <h2>No messages</h2>
            <p>Messages for this account will appear here.</p>
          </div>
        )}
      </div>
    </section>
  );
}

function Preferences({ navigate, admin = false, showToast }) {
  const { user } = useAuth();
  const users = readUsersForPreferences(user, admin);
  const [selectedUserId, setSelectedUserId] = useState(
    user?.id || users[0]?.id,
  );
  const [refresh, setRefresh] = useState(0);
  const pref = useMemo(
    () => emailService.getPreferences(selectedUserId),
    [selectedUserId, refresh],
  );
  const update = (key, value) => {
    try {
      emailService.updatePreferences(selectedUserId, { [key]: value }, user);
      setRefresh((v) => v + 1);
      showToast?.("Email preferences updated.");
    } catch (error) {
      showToast?.(error.message);
    }
  };
  if (!pref) return null;
  return (
    <section className="em-page">
      {!admin && (
        <AccountSettingsNav
          navigate={navigate}
          active="settings/notifications"
        />
      )}
      <Header
        eyebrow="Communication controls"
        title={admin ? "Email preferences" : "Notification preferences"}
        text="Optional reminders and summaries can be configured. Essential security, payment, signature, verification, licence, and delivery notices remain transactional."
      />
      {admin ? (
        <AdminNav navigate={navigate} active="admin/email/preferences" />
      ) : (
        <Notice />
      )}
      {admin && (
        <label className="em-user-select">
          User
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
          >
            {users.map((item) => (
              <option value={item.id} key={item.id}>
                {item.name} · {item.roleLabel}
              </option>
            ))}
          </select>
        </label>
      )}
      <div className="em-preference-grid">
        {[
          [
            "emailEnabled",
            "Email delivery",
            "Receive permitted transactional and optional email simulations.",
          ],
          [
            "inAppEnabled",
            "In-app notifications",
            "Mirror supported workflow events in Demo Messages.",
          ],
          [
            "optionalReminders",
            "Optional account reminders",
            "Helpful non-essential operational reminders.",
          ],
          [
            "quoteReminders",
            "Quote-expiry reminders",
            "72-hour and 24-hour quote reminders.",
          ],
          [
            "contractReminders",
            "Contract reminders",
            "Signature deadline and review reminders.",
          ],
          [
            "paymentReminders",
            "Payment reminders",
            "Upcoming and past-due payment reminders.",
          ],
          [
            "licenceRenewalReminders",
            "Licence-renewal reminders",
            "90, 60, 30, and 14-day reminders.",
          ],
          [
            "deliveryReminders",
            "Delivery-expiry reminders",
            "72-hour and 24-hour reminders.",
          ],
          [
            "savedSearchUpdates",
            "Saved-search updates",
            "Optional catalog discovery updates.",
          ],
          [
            "weeklyDigest",
            "Weekly activity summary",
            "A non-essential account summary.",
          ],
          [
            "marketingEnabled",
            "Promotional messages",
            "Basic consent scaffolding only; no campaigns are sent.",
          ],
        ].map(([key, label, text]) => (
          <label className="em-preference" key={key}>
            <span>
              <strong>{label}</strong>
              <small>{text}</small>
            </span>
            <input
              type="checkbox"
              checked={!!pref[key]}
              onChange={(e) => update(key, e.target.checked)}
            />
          </label>
        ))}
      </div>
      <article className="em-card em-quiet">
        <div>
          <Clock />
          <div>
            <h2>Quiet hours</h2>
            <p>
              Non-urgent optional messages wait until quiet hours end. Urgent
              transactional email is never delayed.
            </p>
          </div>
        </div>
        <label>
          Enabled
          <input
            type="checkbox"
            checked={pref.quietHours.enabled}
            onChange={(e) =>
              update("quietHours", {
                ...pref.quietHours,
                enabled: e.target.checked,
              })
            }
          />
        </label>
        <label>
          Start
          <input
            type="time"
            value={pref.quietHours.start}
            onChange={(e) =>
              update("quietHours", {
                ...pref.quietHours,
                start: e.target.value,
              })
            }
          />
        </label>
        <label>
          End
          <input
            type="time"
            value={pref.quietHours.end}
            onChange={(e) =>
              update("quietHours", { ...pref.quietHours, end: e.target.value })
            }
          />
        </label>
        <label>
          Timezone
          <select
            value={pref.timezone}
            onChange={(e) => update("timezone", e.target.value)}
          >
            <option>America/New_York</option>
            <option>America/Los_Angeles</option>
            <option>Europe/London</option>
            <option>Asia/Kolkata</option>
          </select>
        </label>
      </article>
      {!admin && (
        <button
          className="btn secondary"
          onClick={() => navigate("notifications")}
        >
          <ArrowLeft /> Back to message centre
        </button>
      )}
    </section>
  );
}
function readUsersForPreferences(user, admin) {
  const state = authState();
  return admin && can(user, "email.manage_preferences")
    ? state.users
    : state.users.filter((item) => item.id === user?.id);
}
function authState() {
  return authService.getState();
}

function Dashboard({ navigate }) {
  const { user } = useAuth();
  const data = emailService.analytics(user);
  const state = emailService.read();
  return (
    <section className="em-page">
      <Header
        eyebrow="Transactional communication infrastructure"
        title="Email notifications"
        text="Centralized templates, recipients, preferences, queue processing, simulated delivery, retries, failures, deduplication, and workflow-linked communication."
      />
      <Notice />
      <AdminNav navigate={navigate} active="admin/email" />
      <div className="em-metrics">
        <Metric label="Visible messages" value={data.total} />
        <Metric label="Queued / scheduled" value={data.queued} tone="warning" />
        <Metric
          label="Delivered simulations"
          value={data.delivered}
          tone="success"
        />
        <Metric label="Failures" value={data.failed} tone="danger" />
      </div>
      <div className="em-quick">
        <button onClick={() => navigate("admin/email/queue")}>
          <PaperPlaneTilt /> Process queue <ArrowRight />
        </button>
        <button onClick={() => navigate("admin/email/templates")}>
          <FileText /> {state.templates.length} templates <ArrowRight />
        </button>
        <button onClick={() => navigate("admin/email/triggers")}>
          <GearSix /> {state.triggers.length} triggers <ArrowRight />
        </button>
        <button onClick={() => navigate("admin/email/failures")}>
          <WarningCircle /> Failure review <ArrowRight />
        </button>
      </div>
      <MessageTable
        messages={emailService.query({ limit: 10 }, user).messages}
        navigate={navigate}
      />
    </section>
  );
}

function Messages({ navigate, showToast }) {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [category, setCategory] = useState("All");
  const [priority, setPriority] = useState("All");
  const [manual, setManual] = useState({
    templateKey: "quote-info-required",
    userId: "user-olivia",
    reference: "BM-OPS-DEMO-0001",
    relatedEntityId: "operational-demo-1",
    reason: "Additional project clarification requested.",
  });
  const [refresh, setRefresh] = useState(0);
  const result = emailService.query(
    { search, status, category, priority },
    user,
  );
  void refresh;
  const createManual = () => {
    try {
      emailService.createManualMessage(manual, user);
      setRefresh((value) => value + 1);
      showToast?.(
        "Controlled operational email queued with an in-app notification.",
      );
    } catch (error) {
      showToast?.(error.message);
    }
  };
  return (
    <section className="em-page">
      <Header
        eyebrow="Rendered communication evidence"
        title="Email messages"
        text="Permission-filtered message history with stable references, preserved template versions, recipients, business links, and simulation results."
      />
      <Notice />
      <AdminNav navigate={navigate} active="admin/email/messages" />
      {can(user, "email.create_manual") && (
        <article className="em-card em-manual">
          <div>
            <PaperPlaneTilt />
            <div>
              <h2>Controlled manual message</h2>
              <p>
                Uses an approved template and validated recipient; freeform
                external HTML is not permitted.
              </p>
            </div>
          </div>
          <label>
            Template
            <select
              value={manual.templateKey}
              onChange={(event) =>
                setManual((value) => ({
                  ...value,
                  templateKey: event.target.value,
                }))
              }
            >
              {emailService
                .getTemplates()
                .filter((item) => item.status === "Active")
                .map((item) => (
                  <option key={item.id} value={item.key}>
                    {item.name}
                  </option>
                ))}
            </select>
          </label>
          <label>
            Recipient
            <select
              value={manual.userId}
              onChange={(event) =>
                setManual((value) => ({ ...value, userId: event.target.value }))
              }
            >
              {authService.getState().users.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} · {item.roleLabel}
                </option>
              ))}
            </select>
          </label>
          <label>
            Reference
            <input
              value={manual.reference}
              onChange={(event) =>
                setManual((value) => ({
                  ...value,
                  reference: event.target.value,
                }))
              }
            />
          </label>
          <label>
            Internal reason
            <input
              value={manual.reason}
              onChange={(event) =>
                setManual((value) => ({ ...value, reason: event.target.value }))
              }
            />
          </label>
          <button className="btn primary" onClick={createManual}>
            Create queued message
          </button>
        </article>
      )}
      <div className="em-toolbar em-four">
        <label>
          <Funnel />
          <input
            aria-label="Search email messages"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Reference, subject, recipient or business record"
          />
        </label>
        <select
          aria-label="Filter email status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option>All</option>
          {EMAIL_STATUSES.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <select
          aria-label="Filter email category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option>All</option>
          {EMAIL_CATEGORIES.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <select
          aria-label="Filter email priority"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
        >
          <option>All</option>
          {EMAIL_PRIORITIES.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </div>
      <div className="em-count">
        {result.total} messages visible to {user?.roleLabel}. Unauthorized
        messages are excluded from lists, counts, and analytics.
      </div>
      <MessageTable messages={result.messages} navigate={navigate} />
    </section>
  );
}

function Queue({ navigate, showToast }) {
  const { user } = useAuth();
  const [refresh, setRefresh] = useState(0);
  const state = useMemo(() => emailService.read(), [refresh]);
  const messages = emailService
    .query({}, user)
    .all.filter((item) =>
      [
        "Queued",
        "Scheduled",
        "Retry Scheduled",
        "Deferred",
        "Processing",
      ].includes(item.status),
    );
  const run = (all = false) => {
    try {
      const result = emailService.processQueue(
        { all, includeScheduled: true },
        user,
      );
      setRefresh((v) => v + 1);
      showToast?.(`${result.length} email job(s) processed as simulations.`);
    } catch (error) {
      showToast?.(error.message);
    }
  };
  const pause = () => {
    try {
      emailService.setQueuePaused(!state.queuePaused, user);
      setRefresh((v) => v + 1);
      showToast?.(`Queue ${state.queuePaused ? "resumed" : "paused"}.`);
    } catch (error) {
      showToast?.(error.message);
    }
  };
  return (
    <section className="em-page">
      <Header
        eyebrow="Priority-ordered delivery simulation"
        title="Email queue"
        text="Urgent jobs process first, followed by high, normal, and low priority. Scheduled jobs revalidate recipients, preferences, relevance, expiry, and duplicate state before delivery."
        actions={
          <div className="em-actions">
            <button className="btn secondary" onClick={pause}>
              {state.queuePaused ? <Play /> : <Pause />}
              {state.queuePaused ? "Resume queue" : "Pause queue"}
            </button>
            <button
              className="btn secondary"
              onClick={() => {
                emailService.setFailNext(true, user);
                setRefresh((v) => v + 1);
                showToast?.(
                  "The next eligible message will receive a simulated provider failure.",
                );
              }}
            >
              Fail next
            </button>
            <button className="btn secondary" onClick={() => run(false)}>
              Process next
            </button>
            <button
              className="btn secondary"
              onClick={() => {
                try {
                  emailService.generateReminderJobs(user);
                  setRefresh((value) => value + 1);
                  showToast?.(
                    "Reminder generation completed with deduplication checks.",
                  );
                } catch (error) {
                  showToast?.(error.message);
                }
              }}
            >
              Generate reminders
            </button>
            <button className="btn primary" onClick={() => run(true)}>
              Process all eligible
            </button>
          </div>
        }
      />
      <Notice />
      <AdminNav navigate={navigate} active="admin/email/queue" />
      {state.queuePaused && (
        <div className="em-warning">
          <Pause /> Queue paused. Business workflows continue; email jobs remain
          safely queued.
        </div>
      )}
      <MessageTable
        messages={messages}
        navigate={navigate}
        empty="No eligible queue jobs are visible."
      />
    </section>
  );
}

function MessageDetail({ navigate, showToast }) {
  const { user } = useAuth();
  const [refresh, setRefresh] = useState(0);
  const [mode, setMode] = useState("html");
  const item = useMemo(
    () => emailService.getSelectedMessage(user),
    [user, refresh],
  );
  if (!item)
    return (
      <section className="em-page">
        <Header
          eyebrow="Message access"
          title="Message unavailable"
          text="The message does not exist or exceeds this role's recipient, organization, category, or confidentiality permissions."
        />
      </section>
    );
  const state = emailService.read();
  const template = state.templates.find(
    (entry) => entry.id === item.templateId,
  );
  const sender = state.senderProfiles.find(
    (entry) => entry.id === item.senderProfileId,
  );
  const attempts = state.attempts.filter(
    (entry) => entry.messageId === item.id,
  );
  const internal = user.userType === "internal";
  const retry = () => {
    try {
      emailService.retryMessage(item.id, user);
      setRefresh((v) => v + 1);
      showToast?.("Retry scheduled under the prototype retry policy.");
    } catch (error) {
      showToast?.(error.message);
    }
  };
  const cancel = () => {
    try {
      emailService.cancelMessage(
        item.id,
        "Cancelled during internal email review.",
        user,
      );
      setRefresh((v) => v + 1);
      showToast?.("Message cancelled.");
    } catch (error) {
      showToast?.(error.message);
    }
  };
  return (
    <section className="em-page">
      <Header
        eyebrow={item.reference}
        title={item.subject}
        text={item.preheader}
        actions={
          <button
            className="btn secondary"
            onClick={() =>
              navigate(
                user.userType === "internal"
                  ? "admin/email/messages"
                  : "notifications",
              )
            }
          >
            <ArrowLeft /> Back
          </button>
        }
      />
      <Notice />
      <div className="em-detail-grid">
        <article className="em-card em-summary">
          <div>
            <span>Status</span>
            <Status value={item.status} />
          </div>
          <div>
            <span>Priority</span>
            <Status value={item.priority} />
          </div>
          <div>
            <span>Created</span>
            <strong>{date(item.createdAt)}</strong>
          </div>
          <div>
            <span>Confidentiality</span>
            <strong>{item.confidentiality}</strong>
          </div>
        </article>
        {internal && (
          <article className="em-card">
            <h2>Template & trigger</h2>
            <dl>
              <dt>Template</dt>
              <dd>
                {template?.name || item.templateKey} · v{item.templateVersion}
              </dd>
              <dt>Trigger</dt>
              <dd>{item.triggerEvent}</dd>
              <dt>Correlation</dt>
              <dd>{item.correlationId}</dd>
              <dt>Deduplication</dt>
              <dd>{item.deduplicationKey}</dd>
            </dl>
          </article>
        )}
        <article className="em-card">
          <h2>Sender & recipients</h2>
          <dl>
            <dt>Sender</dt>
            <dd>
              {sender?.name || "beatmondo"} · {sender?.email}
            </dd>
            <dt>Recipient</dt>
            <dd>
              {item.recipients
                .map((entry) => `${entry.displayName} <${entry.email}>`)
                .join(", ")}
            </dd>
            {internal && (
              <>
                <dt>Preference</dt>
                <dd>{item.preferenceDecision}</dd>
                <dt>Routing</dt>
                <dd>
                  {item.recipients.some((entry) => entry.bcc) &&
                  can(user, "email.view_internal")
                    ? "Includes protected internal BCC"
                    : "Direct recipients only"}
                </dd>
              </>
            )}
          </dl>
        </article>
        <article className="em-card">
          <h2>Business record</h2>
          <dl>
            <dt>Entity</dt>
            <dd>{item.relatedEntityType}</dd>
            <dt>ID</dt>
            <dd>{item.relatedEntityId || "—"}</dd>
            <dt>References</dt>
            <dd>{item.relatedReferences.join(", ") || "—"}</dd>
            <dt>Expires</dt>
            <dd>{date(item.expiresAt)}</dd>
          </dl>
        </article>
        <article className="em-card">
          <h2>Delivery result</h2>
          <dl>
            <dt>Sent</dt>
            <dd>{date(item.sentAt)}</dd>
            <dt>Delivered</dt>
            <dd>{date(item.deliveredAt)}</dd>
            {internal && (
              <>
                <dt>Failure</dt>
                <dd>{item.failureCode || "—"}</dd>
                <dt>Retries</dt>
                <dd>
                  {item.retryCount} of {item.maxRetries}
                </dd>
              </>
            )}
          </dl>
        </article>
      </div>
      <article className="em-card">
        <div className="em-card-heading">
          <div>
            <h2>Rendered content</h2>
            <p>
              Historical content remains tied to template version{" "}
              {item.templateVersion}.
            </p>
          </div>
          <div className="em-toggle">
            <button
              className={mode === "html" ? "active" : ""}
              onClick={() => setMode("html")}
            >
              Email preview
            </button>
            <button
              className={mode === "text" ? "active" : ""}
              onClick={() => setMode("text")}
            >
              Plain text
            </button>
          </div>
        </div>
        {mode === "html" ? (
          <div
            className="em-preview"
            dangerouslySetInnerHTML={{ __html: item.htmlBody }}
          />
        ) : (
          <pre className="em-plain">{item.textBody}</pre>
        )}
      </article>
      {internal && (
        <article className="em-card">
          <h2>Queue and attempts</h2>
          <div className="em-attempts">
            {attempts.map((attempt) => (
              <div key={attempt.id}>
                <strong>Attempt {attempt.attempt}</strong>
                <span>
                  {attempt.result} · {date(attempt.completedAt)}
                </span>
                <small>
                  {attempt.failureCode || "No simulated provider failure"}
                </small>
              </div>
            ))}
            {!attempts.length && <p>No delivery attempt has been processed.</p>}
          </div>
        </article>
      )}
      <div className="em-actions">
        {["Failed", "Deferred"].includes(item.status) &&
          can(user, "email.retry") && (
            <button className="btn primary" onClick={retry}>
              Retry message
            </button>
          )}
        {[
          "Draft",
          "Scheduled",
          "Queued",
          "Retry Scheduled",
          "Deferred",
        ].includes(item.status) &&
          can(user, "email.cancel") && (
            <button className="btn secondary" onClick={cancel}>
              Cancel message
            </button>
          )}
        {internal &&
          item.status === "Delivered Simulation" &&
          item.metadata?.engagementTrackingAllowed && (
            <>
              <button
                className="btn secondary"
                onClick={() => {
                  emailService.simulateEngagement(item.id, "open", user);
                  setRefresh((v) => v + 1);
                }}
              >
                Simulate open
              </button>
              <button
                className="btn secondary"
                onClick={() => {
                  emailService.simulateEngagement(item.id, "click", user);
                  setRefresh((v) => v + 1);
                }}
              >
                Simulate action click
              </button>
            </>
          )}
      </div>
      {internal && (
        <div className="em-engagement">
          Engagement activity simulated · Opens {item.openCount} · Action clicks{" "}
          {item.clickCount}
        </div>
      )}
    </section>
  );
}

function Templates({ navigate, showToast }) {
  const { user } = useAuth();
  const [refresh, setRefresh] = useState(0);
  const [search, setSearch] = useState("");
  const templates = useMemo(
    () =>
      emailService
        .getTemplates()
        .filter((item) =>
          [item.name, item.key, item.category]
            .join(" ")
            .toLowerCase()
            .includes(search.toLowerCase()),
        ),
    [search, refresh],
  );
  const open = (item) => {
    emailService.selectTemplate(item.id);
    navigate("admin/email/template");
  };
  const draft = (item) => {
    try {
      const created = emailService.createTemplateDraft(item.id, user);
      emailService.selectTemplate(created.id);
      navigate("admin/email/template");
    } catch (error) {
      showToast?.(error.message);
    }
  };
  return (
    <section className="em-page">
      <Header
        eyebrow="Versioned transactional content"
        title="Email templates"
        text="Active versions are immutable. Material edits create a new draft version with audience, sender, variables, approvals, confidentiality, and plain-text content preserved."
      />
      <Notice />
      <AdminNav navigate={navigate} active="admin/email/templates" />
      <div className="em-toolbar">
        <label>
          <Funnel />
          <input
            aria-label="Search email templates"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Template name, key or category"
          />
        </label>
        <div className="em-count">{templates.length} templates</div>
      </div>
      <div className="em-template-grid">
        {templates.map((item) => (
          <article className="em-card" key={item.id}>
            <span>
              {item.category} · v{item.version}
            </span>
            <h2>{item.name}</h2>
            <p>{item.description}</p>
            <div>
              <Status value={item.status} />
              <Status
                value={item.transactional ? "Transactional" : "Optional"}
              />
            </div>
            <small>
              {item.audience.join(", ")} · {item.confidentiality}
            </small>
            <footer>
              <button className="text-action" onClick={() => open(item)}>
                Preview <Eye />
              </button>
              {item.status === "Active" &&
                can(user, "email.manage_templates") && (
                  <button className="text-action" onClick={() => draft(item)}>
                    New draft version <ArrowRight />
                  </button>
                )}
            </footer>
          </article>
        ))}
      </div>
    </section>
  );
}

function TemplateDetail({ navigate, showToast }) {
  const { user } = useAuth();
  const [refresh, setRefresh] = useState(0);
  const [device, setDevice] = useState("desktop");
  const [mode, setMode] = useState("html");
  const template = useMemo(() => emailService.getSelectedTemplate(), [refresh]);
  if (!template) return null;
  const rendered = emailService.render(
    template,
    {
      USER_FIRST_NAME: "Olivia",
      USER_FULL_NAME: "Olivia Bennett",
      ORGANIZATION_NAME: "Northstar Pictures",
      ACTION_LABEL: "Open private workspace",
      ACTION_URL: "#notifications",
      REFERENCE: "BM-DEMO-2026-0041",
      QUOTE_REFERENCE: "BM-Q-2026-0041",
      CONTRACT_REFERENCE: "BM-C-2026-0021",
      INVOICE_REFERENCE: "BM-INV-2026-0061",
      LICENCE_REFERENCE: "BM-LIC-2026-0018",
      DELIVERY_REFERENCE: "BM-DEL-2026-0016",
      TRACK_TITLE: "The End of Jason Todd",
      CURRENT_YEAR: 2026,
    },
    { preview: true },
  );
  const transition = (status) => {
    try {
      emailService.transitionTemplate(template.id, status, user);
      setRefresh((v) => v + 1);
      showToast?.(`Template moved to ${status}.`);
    } catch (error) {
      showToast?.(error.message);
    }
  };
  return (
    <section className="em-page">
      <Header
        eyebrow={`${template.key} · version ${template.version}`}
        title={template.name}
        text="Preview only — no real email will be sent."
        actions={
          <button
            className="btn secondary"
            onClick={() => navigate("admin/email/templates")}
          >
            <ArrowLeft /> Templates
          </button>
        }
      />
      <Notice />
      <div className="em-detail-grid">
        <article className="em-card">
          <h2>Template definition</h2>
          <dl>
            <dt>Status</dt>
            <dd>
              <Status value={template.status} />
            </dd>
            <dt>Audience</dt>
            <dd>{template.audience.join(", ")}</dd>
            <dt>Classification</dt>
            <dd>
              {template.transactional
                ? "Transactional"
                : "Optional operational"}
            </dd>
            <dt>Confidentiality</dt>
            <dd>{template.confidentiality}</dd>
          </dl>
        </article>
        <article className="em-card">
          <h2>Variables</h2>
          <p>
            <strong>Required:</strong> {template.requiredVariables.join(", ")}
          </p>
          <p>
            <strong>Optional:</strong> {template.optionalVariables.join(", ")}
          </p>
          {rendered.unresolvedVariables.length ? (
            <div className="em-warning">
              Unresolved: {rendered.unresolvedVariables.join(", ")}
            </div>
          ) : (
            <div className="em-success">
              <CheckCircle /> All required variables resolved
            </div>
          )}
        </article>
      </div>
      <article className="em-card">
        <div className="em-card-heading">
          <div>
            <h2>Rendered preview</h2>
            <p>{rendered.subject}</p>
          </div>
          <div className="em-toggle">
            <button
              className={device === "desktop" ? "active" : ""}
              onClick={() => setDevice("desktop")}
            >
              Desktop
            </button>
            <button
              className={device === "mobile" ? "active" : ""}
              onClick={() => setDevice("mobile")}
            >
              Mobile
            </button>
            <button
              className={mode === "text" ? "active" : ""}
              onClick={() => setMode(mode === "text" ? "html" : "text")}
            >
              Plain text
            </button>
          </div>
        </div>
        {mode === "text" ? (
          <pre className="em-plain">{rendered.textBody}</pre>
        ) : (
          <div
            className={`em-preview ${device}`}
            dangerouslySetInnerHTML={{ __html: rendered.htmlBody }}
          />
        )}
      </article>
      {template.status === "Draft" && (
        <div className="em-actions">
          <button
            className="btn secondary"
            onClick={() => transition("Under Review")}
          >
            Submit for review
          </button>
        </div>
      )}
      {template.status === "Under Review" &&
        can(user, "email.approve_templates") && (
          <div className="em-actions">
            <button
              className="btn primary"
              onClick={() => transition("Active")}
            >
              Approve and activate
            </button>
            <button
              className="btn secondary"
              onClick={() => transition("Draft")}
            >
              Return to draft
            </button>
          </div>
        )}
    </section>
  );
}

function Triggers({ navigate, showToast }) {
  const { user } = useAuth();
  const [refresh, setRefresh] = useState(0);
  const triggers = useMemo(() => emailService.getTriggers(), [refresh]);
  const update = (item, changes) => {
    try {
      emailService.updateTrigger(item.id, changes, user);
      setRefresh((v) => v + 1);
      showToast?.("Trigger version updated.");
    } catch (error) {
      showToast?.(error.message);
    }
  };
  const test = (item) => {
    const result = emailService.createNotificationFromEvent(
      { type: item.key },
      {
        userId:
          item.recipientResolver === "artistOwner"
            ? "user-marcus"
            : item.recipientResolver === "securityAdministrators"
              ? "user-preston"
              : "user-olivia",
        reference: "BM-TRIGGER-TEST",
        relatedEntityId: `trigger-test-${item.id}`,
        triggerOccurrence: uidForTest(),
        actionUrl: "#notifications",
        createdBy: user.name,
        user,
        recursionDepth: 0,
      },
    );
    showToast?.(
      result.error ||
        (result.created.length
          ? "Trigger test generated a Demo Message simulation."
          : result.reason),
    );
  };
  return (
    <section className="em-page">
      <Header
        eyebrow="Event-to-communication rules"
        title="Email triggers"
        text="Map business events to active templates, channels, recipient resolvers, delay, priority, deduplication, and cancellation behavior."
      />
      <Notice />
      <AdminNav navigate={navigate} active="admin/email/triggers" />
      <div className="em-table-wrap">
        <table className="em-table">
          <thead>
            <tr>
              <th>Trigger</th>
              <th>Template</th>
              <th>Channel</th>
              <th>Recipients</th>
              <th>Priority</th>
              <th>Version</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {triggers.map((item) => (
              <tr key={item.id}>
                <td>
                  <strong>{item.key}</strong>
                  <span>{item.module}</span>
                </td>
                <td>{item.templateKey}</td>
                <td>
                  <select
                    aria-label={`Channel for ${item.key}`}
                    value={item.channel}
                    onChange={(e) => update(item, { channel: e.target.value })}
                  >
                    <option>Email</option>
                    <option>In-App</option>
                    <option>Email and In-App</option>
                    <option>Internal Email</option>
                    <option>Internal In-App</option>
                  </select>
                </td>
                <td>{item.recipientResolver}</td>
                <td>
                  <select
                    aria-label={`Priority for ${item.key}`}
                    value={item.priority}
                    onChange={(e) => update(item, { priority: e.target.value })}
                  >
                    {EMAIL_PRIORITIES.map((value) => (
                      <option key={value}>{value}</option>
                    ))}
                  </select>
                </td>
                <td>
                  v{item.version} ·{" "}
                  <Status value={item.enabled ? "Active" : "Inactive"} />
                </td>
                <td>
                  <button className="text-action" onClick={() => test(item)}>
                    Test trigger <Play />
                  </button>
                  <button
                    className="text-action"
                    onClick={() => update(item, { enabled: !item.enabled })}
                  >
                    {item.enabled ? "Disable" : "Enable"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="em-warning">
        <ShieldCheck /> Trigger test — no real email is sent. Recipient,
        preference, render, and deduplication decisions still run.
      </div>
    </section>
  );
}
const uidForTest = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

function Failures({ navigate, showToast }) {
  const { user } = useAuth();
  const [refresh, setRefresh] = useState(0);
  const messages = emailService
    .query({}, user)
    .all.filter((item) =>
      ["Failed", "Retry Scheduled", "Deferred"].includes(item.status),
    );
  const retry = (item) => {
    try {
      emailService.retryMessage(item.id, user);
      setRefresh((v) => v + 1);
      showToast?.("Retry scheduled.");
    } catch (error) {
      showToast?.(error.message);
    }
  };
  return (
    <section className="em-page">
      <Header
        eyebrow="Operational notification recovery"
        title="Email failures"
        text="Review retryable provider simulations, terminal recipient failures, escalation alerts, retry history, and affected business records."
      />
      <Notice />
      <AdminNav navigate={navigate} active="admin/email/failures" />
      <div className="em-failure-grid">
        {messages.map((item) => (
          <article className="em-card" key={item.id}>
            <div>
              <WarningCircle />
              <div>
                <Status value={item.status} />
                <h2>{item.subject}</h2>
              </div>
            </div>
            <p>
              {item.failureCode || "RATE_LIMITED"} ·{" "}
              {item.failureMessage ||
                "Delivery was deferred by the simulation."}
            </p>
            <small>
              {item.reference} · {item.recipients[0]?.displayName} · retry{" "}
              {item.retryCount}/{item.maxRetries}
            </small>
            <footer>
              <button
                className="text-action"
                onClick={() => {
                  emailService.selectMessage(item.id);
                  navigate("admin/email/message");
                }}
              >
                Inspect evidence <ArrowRight />
              </button>
              {!["INVALID_EMAIL", "MESSAGE_EXPIRED"].includes(
                item.failureCode,
              ) &&
                can(user, "email.retry") && (
                  <button className="btn secondary" onClick={() => retry(item)}>
                    Schedule retry
                  </button>
                )}
            </footer>
          </article>
        ))}
      </div>
    </section>
  );
}

function Analytics({ navigate }) {
  const { user } = useAuth();
  const data = emailService.analytics(user);
  const max = Math.max(1, ...Object.values(data.categories));
  return (
    <section className="em-page">
      <Header
        eyebrow="Visibility-aware communication signals"
        title="Email analytics"
        text="Counts are calculated after recipient, organization, category, confidentiality, and role checks. Engagement and delivery are explicitly simulated."
      />
      <Notice />
      <AdminNav navigate={navigate} active="admin/email/analytics" />
      <div className="em-metrics">
        <Metric label="Visible messages" value={data.total} />
        <Metric
          label="Delivered simulations"
          value={data.delivered}
          tone="success"
        />
        <Metric
          label="Retry rate"
          value={`${data.retryRate}%`}
          tone="warning"
        />
        <Metric label="Failures" value={data.failed} tone="danger" />
      </div>
      <div className="em-analytics-grid">
        <article className="em-card">
          <h2>Messages by category</h2>
          <div className="em-bars">
            {Object.entries(data.categories)
              .sort((a, b) => b[1] - a[1])
              .map(([label, value]) => (
                <div key={label}>
                  <span>{label}</span>
                  <div>
                    <i style={{ width: `${(value / max) * 100}%` }} />
                  </div>
                  <strong>{value}</strong>
                </div>
              ))}
          </div>
        </article>
        <article className="em-card">
          <h2>Simulation outcomes</h2>
          <dl>
            <dt>Queued / scheduled</dt>
            <dd>{data.queued}</dd>
            <dt>Duplicate prevented</dt>
            <dd>{data.duplicates}</dd>
            <dt>Preference suppressed</dt>
            <dd>{data.suppressed}</dd>
            <dt>Opened simulation</dt>
            <dd>{data.openRate}%</dd>
            <dt>Action-click simulation</dt>
            <dd>{data.clickRate}%</dd>
          </dl>
          <p>
            Actions are associated as “completed after message”; the prototype
            does not claim causation.
          </p>
        </article>
      </div>
    </section>
  );
}

export function renderEmailView(view, props) {
  if (view === "notifications") return <UnifiedMessageCentre {...props} />;
  if (view === "email/message") return <MessageDetail {...props} />;
  if (view === "settings/notifications") return <Preferences {...props} />;
  if (view === "admin/email") return <Dashboard {...props} />;
  if (view === "admin/email/queue") return <Queue {...props} />;
  if (view === "admin/email/messages") return <Messages {...props} />;
  if (view === "admin/email/message") return <MessageDetail {...props} />;
  if (view === "admin/email/templates") return <Templates {...props} />;
  if (view === "admin/email/template") return <TemplateDetail {...props} />;
  if (view === "admin/email/triggers") return <Triggers {...props} />;
  if (view === "admin/email/preferences")
    return <Preferences {...props} admin />;
  if (view === "admin/email/failures") return <Failures {...props} />;
  if (view === "admin/email/analytics") return <Analytics {...props} />;
  return null;
}
