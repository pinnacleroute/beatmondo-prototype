import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Clock,
  Eye,
  Fingerprint,
  Funnel,
  Key,
  LockKey,
  ShieldCheck,
  Siren,
  UserCircle,
  UsersThree,
  WarningCircle,
} from "@phosphor-icons/react";
import { useAuth } from "../auth/AuthContext.jsx";
import { authService } from "../auth/authService.js";
import {
  authorizationService,
  applyFieldLevelRedaction,
  buildAuthorizationContext,
  canPerform,
  checkApprovalAuthority,
} from "./authorizationService.js";
import "./permissions.css";

export const PERMISSIONS_VIEWS = new Set([
  "admin/access",
  "admin/access/users",
  "admin/access/user",
  "admin/access/roles",
  "admin/access/role",
  "admin/access/permissions",
  "admin/access/permission",
  "admin/access/requests",
  "admin/access/temporary",
  "admin/access/delegations",
  "admin/access/impersonation",
  "admin/access/reviews",
  "admin/access/conflicts",
]);
const can = (user, key, resource = {}) =>
  canPerform(key, buildAuthorizationContext(user?.id), resource).allowed;
const date = (value) =>
  value
    ? new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "—";
const Status = ({ value }) => (
  <span
    className={`pm-status pm-${String(value).toLowerCase().replaceAll(" ", "-")}`}
  >
    {value}
  </span>
);
const Header = ({ eyebrow, title, text, actions }) => (
  <header className="pm-header">
    <div>
      <span>{eyebrow}</span>
      <h1>{title}</h1>
      <p>{text}</p>
    </div>
    {actions && <div className="pm-actions">{actions}</div>}
  </header>
);
const Notice = () => (
  <div className="pm-notice">
    <ShieldCheck />
    <span>
      <strong>Browser-persisted authorization simulation.</strong> This
      demonstrates policy decisions, scopes, approvals, and audit behavior;
      production enforcement requires server-side identity and policy
      infrastructure.
    </span>
  </div>
);
const Metric = ({ label, value, tone }) => (
  <article className={`pm-metric ${tone || ""}`}>
    <span>{label}</span>
    <strong>{value}</strong>
  </article>
);
function Nav({ navigate, active }) {
  return (
    <nav className="pm-subnav" aria-label="Access administration sections">
      {[
        ["admin/access", "Overview"],
        ["admin/access/users", "Users"],
        ["admin/access/roles", "Roles"],
        ["admin/access/permissions", "Permissions"],
        ["admin/access/requests", "Requests"],
        ["admin/access/temporary", "Temporary"],
        ["admin/access/delegations", "Delegations"],
        ["admin/access/impersonation", "Impersonation"],
        ["admin/access/reviews", "Reviews"],
        ["admin/access/conflicts", "Conflicts"],
      ].map(([view, label]) => (
        <button
          key={view}
          className={active === view ? "active" : ""}
          onClick={() => navigate(view)}
        >
          {label}
        </button>
      ))}
    </nav>
  );
}
function selectUser(id, navigate) {
  authorizationService.selectUser(id);
  navigate("admin/access/user");
}
function selectRole(id, navigate) {
  authorizationService.selectRole(id);
  navigate("admin/access/role");
}
function selectPermission(id, navigate) {
  authorizationService.selectPermission(id);
  navigate("admin/access/permission");
}

function Dashboard({ navigate }) {
  const { user } = useAuth();
  const data = authorizationService.getAnalytics(user);
  const state = authorizationService.getState();
  return (
    <section className="pm-page">
      <Header
        eyebrow="Central authorization control plane"
        title="Admin permissions"
        text="Explainable roles, scoped assignments, direct grants, explicit denials, approval authority, temporary elevation, separation of duties, impersonation, conflicts, and access reviews."
      />
      <Notice />
      <Nav navigate={navigate} active="admin/access" />
      <div className="pm-metrics">
        <Metric label="Internal users" value={data.internalUsers} />
        <Metric label="Active roles" value={data.activeRoles} />
        <Metric
          label="Pending requests"
          value={data.pendingRequests}
          tone="warning"
        />
        <Metric label="Open conflicts" value={data.conflicts} tone="danger" />
        <Metric label="Temporary grants" value={data.temporary} />
        <Metric label="Explicit denials" value={data.denials} tone="danger" />
        <Metric
          label="Overdue reviews"
          value={data.overdueReviews}
          tone="warning"
        />
        <Metric label="Active impersonations" value={data.impersonations} />
      </div>
      <div className="pm-quick">
        <button onClick={() => navigate("admin/access/users")}>
          <UsersThree /> User access <ArrowRight />
        </button>
        <button onClick={() => navigate("admin/access/roles")}>
          <ShieldCheck /> Role matrix <ArrowRight />
        </button>
        <button onClick={() => navigate("admin/access/requests")}>
          <Key /> Review access <ArrowRight />
        </button>
        <button onClick={() => navigate("admin/access/conflicts")}>
          <WarningCircle /> Resolve conflicts <ArrowRight />
        </button>
      </div>
      <div className="pm-grid">
        <article className="pm-card">
          <h2>Access governance state</h2>
          <dl>
            <dt>Canonical permissions</dt>
            <dd>{state.permissionRegistry.length}</dd>
            <dt>Scoped assignments</dt>
            <dd>{state.assignments.length}</dd>
            <dt>Expiring soon</dt>
            <dd>{data.expiringSoon}</dd>
            <dt>Dormant privileged accounts</dt>
            <dd>{data.dormant} · simulated</dd>
          </dl>
        </article>
        <article className="pm-card">
          <h2>Authorization principles</h2>
          <ul>
            <li>Deny by default</li>
            <li>Explicit denial overrides grants</li>
            <li>Temporary access expires automatically</li>
            <li>Service checks remain distinct from navigation</li>
            <li>Critical actions remain audited</li>
          </ul>
        </article>
      </div>
    </section>
  );
}

function Users({ navigate }) {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("All");
  const state = authorizationService.getState();
  const assignments = state.assignments;
  const users = authService
    .getState()
    .users.filter(
      (item) =>
        (type === "All" || item.userType === type) &&
        [item.name, item.email, item.organization, item.roleLabel]
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase()),
    );
  return (
    <section className="pm-page">
      <Header
        eyebrow="User access lifecycle"
        title="Users & effective access"
        text="Review account state, active role assignments, scope, temporary elevation, critical access, last activity, and access-review status."
      />
      <Notice />
      <Nav navigate={navigate} active="admin/access/users" />
      <div className="pm-toolbar">
        <label>
          <Funnel />
          <input
            aria-label="Search access users"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name, email, organization or role"
          />
        </label>
        <select
          aria-label="Filter account type"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option>All</option>
          <option>internal</option>
          <option>buyer</option>
          <option>artist</option>
        </select>
      </div>
      <div className="pm-table-wrap">
        <table className="pm-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Account</th>
              <th>Roles</th>
              <th>Scope</th>
              <th>Temporary</th>
              <th>Last active</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {users.map((item) => {
              const assigned = assignments.filter(
                (entry) =>
                  entry.userId === item.id && entry.status === "Active",
              );
              const roleNames = assigned
                .map(
                  (entry) =>
                    state.roles.find((role) => role.id === entry.roleId)?.name,
                )
                .filter(Boolean);
              return (
                <tr key={item.id}>
                  <td>
                    <strong>{item.name}</strong>
                    <span>
                      {item.email} · {item.organization}
                    </span>
                  </td>
                  <td>
                    <Status
                      value={
                        item.accountStatus === "active"
                          ? "Active"
                          : item.accountStatus
                      }
                    />
                    <span>{item.userType}</span>
                  </td>
                  <td>
                    <strong>{roleNames.join(", ") || item.roleLabel}</strong>
                    <span>{assigned.length} structured assignment(s)</span>
                  </td>
                  <td>
                    {assigned
                      .map(
                        (entry) =>
                          `${entry.scope.type}: ${entry.scope.ids.join(", ")}`,
                      )
                      .join(" · ") || "Legacy self scope"}
                  </td>
                  <td>
                    {
                      state.temporaryElevations.filter(
                        (entry) =>
                          entry.userId === item.id && entry.status === "Active",
                      ).length
                    }
                  </td>
                  <td>{date(item.lastLoginAt)}</td>
                  <td>
                    <button
                      className="text-action"
                      onClick={() => selectUser(item.id, navigate)}
                    >
                      Inspect <ArrowRight />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function UserDetail({ navigate, showToast }) {
  const { user: actor } = useAuth();
  const [refresh, setRefresh] = useState(0);
  const user = useMemo(() => authorizationService.getSelectedUser(), [refresh]);
  if (!user)
    return (
      <section className="pm-page">
        <Header
          eyebrow="User access"
          title="User unavailable"
          text="Select a user from the access table."
        />
      </section>
    );
  const state = authorizationService.getState();
  const effective = authorizationService.calculateEffectivePermissions(user.id);
  const assignments = state.assignments.filter(
    (item) => item.userId === user.id,
  );
  const grants = state.directGrants.filter((item) => item.userId === user.id);
  const denials = state.explicitDenials.filter(
    (item) => item.userId === user.id,
  );
  const temporary = state.temporaryElevations.filter(
    (item) => item.userId === user.id,
  );
  const [form, setForm] = useState({
    permissionKey: "audit.events.review",
    effect: "Allow",
    scopeType: "Global",
    scopeId: "standard",
    reason: "Scoped operational access",
  });
  const [roleForm, setRoleForm] = useState({
    roleId: "role-catalog-manager",
    scopeType: "Global",
    scopeId: "standard",
    reason: "Approved operational responsibility",
  });
  const apply = () => {
    try {
      authorizationService.createGrant(
        {
          userId: user.id,
          permissionKey: form.permissionKey,
          scope: {
            type: form.scopeType,
            ids: [form.scopeId],
            includeChildren: false,
          },
          reason: form.reason,
        },
        form.effect,
        actor,
      );
      setRefresh((v) => v + 1);
      showToast?.(
        `${form.effect} decision applied and authorization cache invalidated.`,
      );
    } catch (error) {
      showToast?.(error.message);
    }
  };
  const assignRole = () => {
    try {
      authorizationService.assignRole(
        {
          userId: user.id,
          roleId: roleForm.roleId,
          scope: {
            type: roleForm.scopeType,
            ids: [roleForm.scopeId],
            includeChildren: false,
          },
          reason: roleForm.reason,
        },
        actor,
      );
      setRefresh((value) => value + 1);
      showToast?.("Role assignment evaluated for conflicts and approval.");
    } catch (error) {
      showToast?.(error.message);
    }
  };
  const fieldExample = applyFieldLevelRedaction(
    {
      publicStatus: "Approved",
      internalRiskNotes: "Restricted risk assessment",
      ownershipEvidence: "Protected document record",
    },
    {
      internalRiskNotes: "verification.documents.view",
      ownershipEvidence: "rights.documents.view",
    },
    effective.context,
    { userId: user.id },
  );
  return (
    <section className="pm-page">
      <Header
        eyebrow={user.email}
        title={user.name}
        text={`${user.roleLabel} · ${user.organization}`}
        actions={
          <button
            className="btn secondary"
            onClick={() => navigate("admin/access/users")}
          >
            <ArrowLeft /> Users
          </button>
        }
      />
      <Notice />
      <div className="pm-detail-grid">
        <article className="pm-card pm-summary">
          <div>
            <span>Account</span>
            <Status
              value={
                user.accountStatus === "active" ? "Active" : user.accountStatus
              }
            />
          </div>
          <div>
            <span>Effective roles</span>
            <strong>{effective.context.activeRoles.length}</strong>
          </div>
          <div>
            <span>Allowed permissions</span>
            <strong>{effective.allowed.length}</strong>
          </div>
          <div>
            <span>Explicit denials</span>
            <strong>{denials.length}</strong>
          </div>
        </article>
        <article className="pm-card">
          <h2>Role assignments</h2>
          {assignments.map((item) => (
            <div className="pm-record" key={item.id}>
              <div>
                <strong>
                  {state.roles.find((role) => role.id === item.roleId)?.name}
                </strong>
                <small>
                  {item.scope.type}: {item.scope.ids.join(", ")} · v
                  {item.roleVersion}
                </small>
              </div>
              <Status value={item.status} />
              {item.status === "Pending Approval" &&
                can(actor, "access.roles.assign") && (
                  <button
                    className="text-action"
                    onClick={() => {
                      try {
                        authorizationService.approveRoleAssignment(
                          item.id,
                          actor,
                        );
                        setRefresh((value) => value + 1);
                      } catch (error) {
                        showToast?.(error.message);
                      }
                    }}
                  >
                    Approve
                  </button>
                )}
              {item.status === "Active" &&
                can(actor, "access.roles.assign") && (
                  <button
                    className="text-action"
                    onClick={() => {
                      try {
                        authorizationService.revokeAssignment(
                          item.id,
                          "Access no longer required.",
                          actor,
                        );
                        setRefresh((v) => v + 1);
                      } catch (error) {
                        showToast?.(error.message);
                      }
                    }}
                  >
                    Revoke
                  </button>
                )}
            </div>
          ))}
        </article>
        <article className="pm-card">
          <h2>Direct grants & denials</h2>
          {[...grants, ...denials].map((item) => (
            <div className="pm-record" key={item.id}>
              <div>
                <strong>{item.permissionKey}</strong>
                <small>
                  {item.scope.type}: {item.scope.ids.join(", ")} · {item.reason}
                </small>
              </div>
              <Status value={item.effect} />
            </div>
          ))}
          {!grants.length && !denials.length && <p>No direct decisions.</p>}
        </article>
        <article className="pm-card">
          <h2>Temporary elevations</h2>
          {temporary.map((item) => (
            <div className="pm-record" key={item.id}>
              <div>
                <strong>{item.permissionKey || item.roleId}</strong>
                <small>
                  {item.reference} · expires {date(item.expiresAt)}
                </small>
              </div>
              <Status value={item.status} />
            </div>
          ))}
        </article>
        <article className="pm-card">
          <h2>Approval limits</h2>
          {Object.entries(effective.context.approvalLimits).map(
            ([key, value]) => (
              <div className="pm-limit" key={key}>
                <span>{key}</span>
                <strong>
                  {typeof value === "number" && value > 100
                    ? `$${value.toLocaleString()}`
                    : value}
                </strong>
              </div>
            ),
          )}
        </article>
      </div>
      {can(actor, "access.grants.create") && (
        <article className="pm-card pm-form">
          <div>
            <UsersThree />
            <div>
              <h2>Assign role</h2>
              <p>Critical roles enter secondary approval.</p>
            </div>
          </div>
          <label>
            Role
            <select
              value={roleForm.roleId}
              onChange={(event) =>
                setRoleForm((value) => ({
                  ...value,
                  roleId: event.target.value,
                }))
              }
            >
              {state.roles
                .filter((item) => item.status === "Active")
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
            </select>
          </label>
          <label>
            Scope
            <select
              value={roleForm.scopeType}
              onChange={(event) =>
                setRoleForm((value) => ({
                  ...value,
                  scopeType: event.target.value,
                }))
              }
            >
              {["Global", "Organization", "Artist", "Project", "Record"].map(
                (item) => (
                  <option key={item}>{item}</option>
                ),
              )}
            </select>
          </label>
          <label>
            Scope ID
            <input
              value={roleForm.scopeId}
              onChange={(event) =>
                setRoleForm((value) => ({
                  ...value,
                  scopeId: event.target.value,
                }))
              }
            />
          </label>
          <label>
            Reason
            <input
              value={roleForm.reason}
              onChange={(event) =>
                setRoleForm((value) => ({
                  ...value,
                  reason: event.target.value,
                }))
              }
            />
          </label>
          <button className="btn primary" onClick={assignRole}>
            Assign role
          </button>
        </article>
      )}
      {can(actor, "access.grants.create") && (
        <article className="pm-card pm-form">
          <div>
            <Key />
            <div>
              <h2>Direct access decision</h2>
              <p>
                Explicit denial overrides every role, inheritance path, direct
                allow, and temporary elevation.
              </p>
            </div>
          </div>
          <label>
            Permission
            <select
              value={form.permissionKey}
              onChange={(e) =>
                setForm((v) => ({ ...v, permissionKey: e.target.value }))
              }
            >
              {state.permissionRegistry.map((item) => (
                <option key={item.id} value={item.key}>
                  {item.key}
                </option>
              ))}
            </select>
          </label>
          <label>
            Effect
            <select
              value={form.effect}
              onChange={(e) =>
                setForm((v) => ({ ...v, effect: e.target.value }))
              }
            >
              <option>Allow</option>
              <option>Deny</option>
            </select>
          </label>
          <label>
            Scope
            <select
              value={form.scopeType}
              onChange={(e) =>
                setForm((v) => ({ ...v, scopeType: e.target.value }))
              }
            >
              {[
                "Global",
                "Organization",
                "Artist",
                "Track",
                "Project",
                "Catalog",
                "Territory",
                "Record",
                "Self",
              ].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            Scope ID
            <input
              value={form.scopeId}
              onChange={(e) =>
                setForm((v) => ({ ...v, scopeId: e.target.value }))
              }
            />
          </label>
          <label>
            Reason
            <input
              value={form.reason}
              onChange={(e) =>
                setForm((v) => ({ ...v, reason: e.target.value }))
              }
            />
          </label>
          <button className="btn primary" onClick={apply}>
            Apply decision
          </button>
        </article>
      )}
      <article className="pm-card">
        <h2>Effective access explanation</h2>
        <div className="pm-decision-list">
          {effective.allowed.slice(0, 16).map((item) => (
            <div key={item.permissionKey}>
              <CheckCircle />
              <span>
                <strong>{item.permissionKey}</strong>
                <small>
                  {item.reason}{" "}
                  {item.expiresAt ? `Expires ${date(item.expiresAt)}` : ""}
                </small>
              </span>
            </div>
          ))}
        </div>
      </article>
      <article className="pm-card">
        <h2>Field-level redaction example</h2>
        <dl>
          {Object.entries(fieldExample).map(([key, value]) => (
            <>
              <dt key={`${key}-dt`}>{key}</dt>
              <dd key={`${key}-dd`}>{value}</dd>
            </>
          ))}
        </dl>
      </article>
    </section>
  );
}

function Roles({ navigate }) {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [module, setModule] = useState("All");
  const [customName, setCustomName] = useState("Catalog Quality Reviewer");
  const [refresh, setRefresh] = useState(0);
  const state = authorizationService.getState();
  void refresh;
  const roles = state.roles.filter((item) =>
    [item.name, item.key, item.description]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  const permissions = state.permissionRegistry
    .filter((item) => module === "All" || item.module === module)
    .slice(0, 30);
  return (
    <section className="pm-page">
      <Header
        eyebrow="Versioned inheritance and authority"
        title="Roles & permission matrix"
        text="Compare granted and inherited permissions, critical access, default scopes, approval limits, assignment rules, conflicts, and affected users."
      />
      <Notice />
      <Nav navigate={navigate} active="admin/access/roles" />
      {can(user, "access.roles.create") && (
        <article className="pm-card pm-create-role">
          <div>
            <ShieldCheck />
            <div>
              <h2>Create custom role</h2>
              <p>Critical permissions force draft status and review.</p>
            </div>
          </div>
          <label>
            Name
            <input
              value={customName}
              onChange={(event) => setCustomName(event.target.value)}
            />
          </label>
          <button
            className="btn primary"
            onClick={() => {
              try {
                const role = authorizationService.createRole(
                  {
                    name: customName,
                    description: "Scoped custom catalog-quality review role.",
                    permissionKeys: [
                      "catalog.tracks.view",
                      "ingestion.submissions.view",
                    ],
                    inheritedRoleIds: [],
                    defaultScopes: [
                      {
                        type: "Catalog",
                        ids: ["quality-review"],
                        includeChildren: false,
                      },
                    ],
                  },
                  user,
                );
                setRefresh((value) => value + 1);
                selectRole(role.id, navigate);
              } catch {
                /* surfaced by guarded administration in detail */
              }
            }}
          >
            Create role
          </button>
        </article>
      )}
      <div className="pm-toolbar">
        <label>
          <Funnel />
          <input
            aria-label="Search roles"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Role name, key or purpose"
          />
        </label>
        <select
          aria-label="Filter matrix module"
          value={module}
          onChange={(e) => setModule(e.target.value)}
        >
          <option>All</option>
          {[...new Set(state.permissionRegistry.map((item) => item.module))]
            .sort()
            .map((item) => (
              <option key={item}>{item}</option>
            ))}
        </select>
      </div>
      <div className="pm-role-grid">
        {roles.map((role) => {
          const resolved = authorizationService.resolveRolePermissions(role.id);
          return (
            <article className="pm-card" key={role.id}>
              <span>
                {role.type} · v{role.version}
              </span>
              <h2>{role.name}</h2>
              <p>{role.description}</p>
              <div>
                <Status value={role.status} />
                <Status value={`${resolved.length} permissions`} />
              </div>
              <small>
                {role.inheritedRoleIds.length} inherited role(s) ·{" "}
                {Object.keys(role.approvalLimits).length} limits
              </small>
              <button
                className="text-action"
                onClick={() => selectRole(role.id, navigate)}
              >
                Inspect role <ArrowRight />
              </button>
            </article>
          );
        })}
      </div>
      <div className="pm-table-wrap">
        <table className="pm-table pm-matrix">
          <thead>
            <tr>
              <th>Permission</th>
              {roles.slice(0, 7).map((role) => (
                <th key={role.id}>{role.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {permissions.map((permission) => (
              <tr key={permission.id}>
                <td>
                  <strong>{permission.key}</strong>
                  <span>{permission.riskLevel}</span>
                </td>
                {roles.slice(0, 7).map((role) => {
                  const direct = role.permissionKeys.includes(permission.key);
                  const inherited =
                    !direct &&
                    authorizationService
                      .resolveRolePermissions(role.id)
                      .includes(permission.key);
                  return (
                    <td key={role.id}>
                      <Status
                        value={
                          direct
                            ? "Granted"
                            : inherited
                              ? "Inherited"
                              : "Not granted"
                        }
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function RoleDetail({ navigate, showToast }) {
  const { user } = useAuth();
  const [refresh, setRefresh] = useState(0);
  const role = useMemo(() => authorizationService.getSelectedRole(), [refresh]);
  if (!role) return null;
  const state = authorizationService.getState();
  const resolved = authorizationService.resolveRolePermissions(role.id);
  const users = state.assignments.filter((item) => item.roleId === role.id);
  const inherited = role.inheritedRoleIds
    .map((id) => state.roles.find((item) => item.id === id))
    .filter(Boolean);
  const conflicts = authorizationService.detectRoleConflicts([role.id]);
  const version = () => {
    try {
      authorizationService.createRoleVersion(
        role.id,
        { description: `${role.description} Reviewed.` },
        "Routine role-description review",
        user,
      );
      setRefresh((v) => v + 1);
      showToast?.(
        "New role version created and authorization caches invalidated.",
      );
    } catch (error) {
      showToast?.(error.message);
    }
  };
  return (
    <section className="pm-page">
      <Header
        eyebrow={`${role.type} role · version ${role.version}`}
        title={role.name}
        text={role.description}
        actions={
          <button
            className="btn secondary"
            onClick={() => navigate("admin/access/roles")}
          >
            <ArrowLeft /> Roles
          </button>
        }
      />
      <Notice />
      <div className="pm-detail-grid">
        <article className="pm-card">
          <h2>Role summary</h2>
          <dl>
            <dt>Status</dt>
            <dd>
              <Status value={role.status} />
            </dd>
            <dt>Type</dt>
            <dd>{role.type}</dd>
            <dt>System role</dt>
            <dd>{role.systemRole ? "Yes" : "No"}</dd>
            <dt>Secondary approval</dt>
            <dd>
              {role.requiresApprovalToAssign
                ? "Required"
                : "Standard assignment"}
            </dd>
          </dl>
        </article>
        <article className="pm-card">
          <h2>Assigned users</h2>
          <strong>{users.length}</strong>
          <p>
            {users
              .map(
                (item) =>
                  authService
                    .getState()
                    .users.find((user) => user.id === item.userId)?.name,
              )
              .filter(Boolean)
              .join(", ") || "No assignments"}
          </p>
        </article>
        <article className="pm-card">
          <h2>Inheritance</h2>
          <p>
            {inherited.map((item) => item.name).join(", ") ||
              "No inherited roles"}
          </p>
          <small>
            {resolved.length - role.permissionKeys.length} inherited
            permission(s)
          </small>
        </article>
        <article className="pm-card">
          <h2>Approval limits</h2>
          {Object.entries(role.approvalLimits).map(([key, value]) => (
            <div className="pm-limit" key={key}>
              <span>{key}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </article>
      </div>
      <article className="pm-card">
        <h2>Effective permissions ({resolved.length})</h2>
        <div className="pm-chip-grid">
          {resolved.map((key) => (
            <button key={key} onClick={() => selectPermission(key, navigate)}>
              {key}
              <Status
                value={
                  role.permissionKeys.includes(key) ? "Granted" : "Inherited"
                }
              />
            </button>
          ))}
        </div>
      </article>
      {!!conflicts.length && (
        <div className="pm-critical">
          <WarningCircle />
          <div>
            <strong>Incompatible permissions detected</strong>
            <span>
              {conflicts.map((item) => item.permissions.join(" + ")).join("; ")}
            </span>
          </div>
        </div>
      )}
      {can(user, "access.roles.edit") && (
        <button className="btn primary" onClick={version}>
          Create reviewed version
        </button>
      )}
    </section>
  );
}

function Permissions({ navigate }) {
  const [search, setSearch] = useState("");
  const [module, setModule] = useState("All");
  const state = authorizationService.getState();
  const items = state.permissionRegistry.filter(
    (item) =>
      (module === "All" || item.module === module) &&
      [item.key, item.description, item.resource, item.action]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <section className="pm-page">
      <Header
        eyebrow="Canonical policy registry"
        title="Permissions"
        text="Consistent module.resource.action keys with risk, confidentiality, scope support, temporary-grant eligibility, incompatible duties, and approval-threshold metadata."
      />
      <Notice />
      <Nav navigate={navigate} active="admin/access/permissions" />
      <div className="pm-toolbar">
        <label>
          <Funnel />
          <input
            aria-label="Search permissions"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Permission key, resource or action"
          />
        </label>
        <select
          aria-label="Filter permission module"
          value={module}
          onChange={(e) => setModule(e.target.value)}
        >
          <option>All</option>
          {[...new Set(state.permissionRegistry.map((item) => item.module))]
            .sort()
            .map((item) => (
              <option key={item}>{item}</option>
            ))}
        </select>
      </div>
      <div className="pm-table-wrap">
        <table className="pm-table">
          <thead>
            <tr>
              <th>Permission</th>
              <th>Resource / action</th>
              <th>Category</th>
              <th>Risk</th>
              <th>Scope</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>
                  <strong>{item.key}</strong>
                  <span>{item.description}</span>
                </td>
                <td>
                  {item.resource} · {item.action}
                </td>
                <td>{item.category}</td>
                <td>
                  <Status value={item.riskLevel} />
                </td>
                <td>{item.supportsScope ? "Scoped" : "Global only"}</td>
                <td>
                  <button
                    className="text-action"
                    onClick={() => selectPermission(item.id, navigate)}
                  >
                    Inspect <ArrowRight />
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

function PermissionDetail({ navigate }) {
  const item = authorizationService.getSelectedPermission();
  if (!item) return null;
  const state = authorizationService.getState();
  const roles = state.roles.filter((role) =>
    authorizationService.resolveRolePermissions(role.id).includes(item.key),
  );
  const grants = state.directGrants.filter(
    (entry) => entry.permissionKey === item.key,
  );
  const denials = state.explicitDenials.filter(
    (entry) => entry.permissionKey === item.key,
  );
  return (
    <section className="pm-page">
      <Header
        eyebrow={`${item.module} · ${item.resource}`}
        title={item.key}
        text={item.description}
        actions={
          <button
            className="btn secondary"
            onClick={() => navigate("admin/access/permissions")}
          >
            <ArrowLeft /> Permissions
          </button>
        }
      />
      <Notice />
      <div className="pm-detail-grid">
        <article className="pm-card">
          <h2>Policy definition</h2>
          <dl>
            <dt>Action</dt>
            <dd>{item.action}</dd>
            <dt>Category</dt>
            <dd>{item.category}</dd>
            <dt>Risk</dt>
            <dd>
              <Status value={item.riskLevel} />
            </dd>
            <dt>Confidentiality</dt>
            <dd>{item.confidentiality}</dd>
          </dl>
        </article>
        <article className="pm-card">
          <h2>Distribution</h2>
          <dl>
            <dt>Roles</dt>
            <dd>{roles.map((role) => role.name).join(", ") || "None"}</dd>
            <dt>Direct grants</dt>
            <dd>{grants.length}</dd>
            <dt>Explicit denials</dt>
            <dd>{denials.length}</dd>
            <dt>Temporary eligible</dt>
            <dd>{item.supportsTemporaryGrant ? "Yes" : "No"}</dd>
          </dl>
        </article>
      </div>
      <article className="pm-card">
        <h2>Incompatible permissions</h2>
        <p>
          {item.incompatiblePermissions.join(", ") ||
            "No registered incompatibilities."}
        </p>
      </article>
    </section>
  );
}

function Requests({ navigate, showToast }) {
  const { user } = useAuth();
  const [refresh, setRefresh] = useState(0);
  const state = useMemo(() => authorizationService.getState(), [refresh]);
  const [form, setForm] = useState({
    permissionKey: "audit.events.review",
    scopeType: "Global",
    scopeId: "standard",
    reason: "Operational access needed",
    durationHours: 24,
  });
  const submit = () => {
    try {
      authorizationService.requestPermission(
        {
          ...form,
          scope: {
            type: form.scopeType,
            ids: [form.scopeId],
            includeChildren: false,
          },
        },
        user,
      );
      setRefresh((v) => v + 1);
      showToast?.("Permission request submitted for risk-based review.");
    } catch (error) {
      showToast?.(error.message);
    }
  };
  const decide = (item, decision) => {
    try {
      authorizationService.decideRequest(
        item.id,
        decision,
        `${decision} after scope, risk, and separation-of-duties review.`,
        user,
      );
      setRefresh((v) => v + 1);
    } catch (error) {
      showToast?.(error.message);
    }
  };
  return (
    <section className="pm-page">
      <Header
        eyebrow="Risk-routed access workflow"
        title="Permission requests"
        text="Request scoped, time-bound access; low, moderate, high, and critical risk follow different approval requirements."
      />
      <Notice />
      <Nav navigate={navigate} active="admin/access/requests" />
      <article className="pm-card pm-request">
        <div>
          <Key />
          <div>
            <h2>Request permission</h2>
            <p>Scope and duration are evaluated before activation.</p>
          </div>
        </div>
        <label>
          Permission
          <select
            value={form.permissionKey}
            onChange={(e) =>
              setForm((v) => ({ ...v, permissionKey: e.target.value }))
            }
          >
            {state.permissionRegistry
              .filter((item) => item.supportsTemporaryGrant)
              .map((item) => (
                <option key={item.id} value={item.key}>
                  {item.key}
                </option>
              ))}
          </select>
        </label>
        <label>
          Scope
          <select
            value={form.scopeType}
            onChange={(e) =>
              setForm((v) => ({ ...v, scopeType: e.target.value }))
            }
          >
            {[
              "Global",
              "Organization",
              "Artist",
              "Track",
              "Project",
              "Catalog",
              "Record",
            ].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label>
          Scope ID
          <input
            value={form.scopeId}
            onChange={(e) =>
              setForm((v) => ({ ...v, scopeId: e.target.value }))
            }
          />
        </label>
        <label>
          Hours
          <input
            type="number"
            value={form.durationHours}
            onChange={(e) =>
              setForm((v) => ({ ...v, durationHours: Number(e.target.value) }))
            }
          />
        </label>
        <label>
          Reason
          <input
            value={form.reason}
            onChange={(e) => setForm((v) => ({ ...v, reason: e.target.value }))}
          />
        </label>
        <button className="btn primary" onClick={submit}>
          Submit request
        </button>
      </article>
      <div className="pm-table-wrap">
        <table className="pm-table">
          <thead>
            <tr>
              <th>Request</th>
              <th>Requester</th>
              <th>Access / scope</th>
              <th>Risk</th>
              <th>Status</th>
              <th>Conflicts</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {state.accessRequests.map((item) => (
              <tr key={item.id}>
                <td>
                  <strong>{item.reference}</strong>
                  <span>{date(item.submittedAt)}</span>
                </td>
                <td>
                  {
                    authService
                      .getState()
                      .users.find((entry) => entry.id === item.requesterId)
                      ?.name
                  }
                </td>
                <td>
                  <strong>
                    {item.permissionKey ||
                      state.roles.find((role) => role.id === item.roleId)?.name}
                  </strong>
                  <span>
                    {item.scope.type}: {item.scope.ids.join(", ")} ·{" "}
                    {item.durationHours}h
                  </span>
                </td>
                <td>
                  <Status value={item.risk} />
                </td>
                <td>
                  <Status value={item.status} />
                </td>
                <td>{item.conflicts.length || 0}</td>
                <td>
                  {item.status === "Under Review" &&
                    can(user, "access.requests.review") && (
                      <div className="pm-actions">
                        <button
                          className="text-action"
                          onClick={() => decide(item, "Approved")}
                        >
                          Approve
                        </button>
                        <button
                          className="text-action"
                          onClick={() => decide(item, "Rejected")}
                        >
                          Reject
                        </button>
                      </div>
                    )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Temporary({ navigate, showToast }) {
  const { user } = useAuth();
  const [refresh, setRefresh] = useState(0);
  const state = useMemo(() => authorizationService.getState(), [refresh]);
  const [form, setForm] = useState({
    permissionKey: "temporary_access.records.revoke",
    scopeType: "Record",
    scopeId: "incident-resource",
    durationHours: 1,
    reason: "Critical incident response",
    ticket: "BM-CASE-EMERGENCY",
  });
  const request = (emergency = false) => {
    try {
      authorizationService.requestElevation(
        {
          ...form,
          userId: user.id,
          scope: {
            type: form.scopeType,
            ids: [form.scopeId],
            includeChildren: false,
          },
          emergency,
        },
        user,
      );
      setRefresh((v) => v + 1);
      showToast?.(
        emergency
          ? "Emergency prototype access activated for one hour."
          : "Temporary elevation requested.",
      );
    } catch (error) {
      showToast?.(error.message);
    }
  };
  return (
    <section className="pm-page">
      <Header
        eyebrow="Time-bound privileged access"
        title="Temporary & emergency access"
        text="Temporary grants are scoped, approved, expiring, notified, and audited. Emergency access is limited to 60 minutes and requires post-access review."
      />
      <Notice />
      <Nav navigate={navigate} active="admin/access/temporary" />
      <article className="pm-card pm-request">
        <div>
          <Clock />
          <div>
            <h2>Request elevation</h2>
            <p>
              Expired grants remain historical but stop contributing
              immediately.
            </p>
          </div>
        </div>
        <label>
          Permission
          <select
            value={form.permissionKey}
            onChange={(e) =>
              setForm((v) => ({ ...v, permissionKey: e.target.value }))
            }
          >
            {state.permissionRegistry
              .filter((item) => item.supportsTemporaryGrant)
              .map((item) => (
                <option key={item.id} value={item.key}>
                  {item.key}
                </option>
              ))}
          </select>
        </label>
        <label>
          Scope
          <select
            value={form.scopeType}
            onChange={(e) =>
              setForm((v) => ({ ...v, scopeType: e.target.value }))
            }
          >
            {["Global", "Organization", "Project", "Record"].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label>
          Scope ID
          <input
            value={form.scopeId}
            onChange={(e) =>
              setForm((v) => ({ ...v, scopeId: e.target.value }))
            }
          />
        </label>
        <label>
          Hours
          <input
            type="number"
            min="1"
            value={form.durationHours}
            onChange={(e) =>
              setForm((v) => ({ ...v, durationHours: Number(e.target.value) }))
            }
          />
        </label>
        <label>
          Mandatory reason
          <input
            value={form.reason}
            onChange={(e) => setForm((v) => ({ ...v, reason: e.target.value }))}
          />
        </label>
        <div className="pm-actions">
          <button className="btn secondary" onClick={() => request(false)}>
            Request access
          </button>
          {can(user, "access.emergency.activate") && (
            <button className="btn critical" onClick={() => request(true)}>
              <Siren /> Emergency access
            </button>
          )}
        </div>
      </article>
      <div className="pm-list">
        {state.temporaryElevations.map((item) => (
          <article className="pm-card" key={item.id}>
            <div>
              <strong>{item.reference}</strong>
              <Status value={item.status} />
            </div>
            <h2>{item.permissionKey || item.roleId}</h2>
            <p>{item.reason}</p>
            <small>
              {item.scope.type}: {item.scope.ids.join(", ")} · expires{" "}
              {date(item.expiresAt)}
            </small>
            {item.emergency && (
              <div className="pm-critical">
                <Siren /> Emergency prototype access · post-access review{" "}
                {item.postAccessReview}
              </div>
            )}
            {item.status === "Pending Approval" &&
              can(user, "access.temporary.manage") && (
                <button
                  className="btn primary"
                  onClick={() => {
                    try {
                      authorizationService.approveElevation(item.id, user);
                      setRefresh((v) => v + 1);
                    } catch (error) {
                      showToast?.(error.message);
                    }
                  }}
                >
                  Approve elevation
                </button>
              )}
          </article>
        ))}
      </div>
    </section>
  );
}

function Delegations({ navigate, showToast }) {
  const { user } = useAuth();
  const [refresh, setRefresh] = useState(0);
  const state = useMemo(() => authorizationService.getState(), [refresh]);
  const [form, setForm] = useState({
    delegateId: "user-preston",
    approvalType: "Quote",
    limit: 1000,
    end: "2026-07-25T18:00",
    reason: "Short-term approval coverage",
  });
  const create = () => {
    try {
      authorizationService.createDelegation(
        {
          ...form,
          delegatorId: user.id,
          scope: { type: "Global", ids: ["standard"], includeChildren: false },
        },
        user,
      );
      setRefresh((v) => v + 1);
    } catch (error) {
      showToast?.(error.message);
    }
  };
  return (
    <section className="pm-page">
      <Header
        eyebrow="Non-recursive approval coverage"
        title="Delegations"
        text="Delegations cannot exceed original authority, increase limits, chain recursively, or cover super-admin, emergency, or unsupported restricted-export approval."
      />
      <Notice />
      <Nav navigate={navigate} active="admin/access/delegations" />
      <article className="pm-card pm-request">
        <div>
          <UsersThree />
          <div>
            <h2>Create delegation</h2>
            <p>Further delegation remains disabled.</p>
          </div>
        </div>
        <label>
          Delegate
          <select
            value={form.delegateId}
            onChange={(e) =>
              setForm((v) => ({ ...v, delegateId: e.target.value }))
            }
          >
            {authService
              .getState()
              .users.filter(
                (item) => item.userType === "internal" && item.id !== user.id,
              )
              .map((item) => (
                <option value={item.id} key={item.id}>
                  {item.name}
                </option>
              ))}
          </select>
        </label>
        <label>
          Approval type
          <select
            value={form.approvalType}
            onChange={(e) =>
              setForm((v) => ({ ...v, approvalType: e.target.value }))
            }
          >
            {["Quote", "Refund", "Delivery", "Rights Exception"].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label>
          Limit
          <input
            type="number"
            value={form.limit}
            onChange={(e) =>
              setForm((v) => ({ ...v, limit: Number(e.target.value) }))
            }
          />
        </label>
        <label>
          End
          <input
            type="datetime-local"
            value={form.end}
            onChange={(e) => setForm((v) => ({ ...v, end: e.target.value }))}
          />
        </label>
        <label>
          Reason
          <input
            value={form.reason}
            onChange={(e) => setForm((v) => ({ ...v, reason: e.target.value }))}
          />
        </label>
        <button className="btn primary" onClick={create}>
          Create delegation
        </button>
      </article>
      <div className="pm-list">
        {state.delegations.map((item) => (
          <article className="pm-card" key={item.id}>
            <div>
              <strong>{item.reference}</strong>
              <Status value={item.status} />
            </div>
            <h2>
              {item.approvalType} · limit {item.limit}
            </h2>
            <p>{item.reason}</p>
            <small>
              {
                authService
                  .getState()
                  .users.find((entry) => entry.id === item.delegatorId)?.name
              }{" "}
              →{" "}
              {
                authService
                  .getState()
                  .users.find((entry) => entry.id === item.delegateId)?.name
              }{" "}
              · ends {date(item.end)}
            </small>
          </article>
        ))}
      </div>
    </section>
  );
}

function Impersonation({ navigate, showToast }) {
  const { user } = useAuth();
  const [refresh, setRefresh] = useState(0);
  const state = useMemo(() => authorizationService.getState(), [refresh]);
  const [targetUserId, setTarget] = useState("user-olivia");
  const request = () => {
    try {
      authorizationService.requestImpersonation(
        { targetUserId, reason: "Reproduce buyer-visible workspace issue" },
        user,
      );
      setRefresh((v) => v + 1);
    } catch (error) {
      showToast?.(error.message);
    }
  };
  return (
    <section className="pm-page">
      <Header
        eyebrow="Audited view-only support"
        title="Impersonation"
        text="Approved buyer or artist support sessions preserve the true actor and block signing, payments, master or stem downloads, verification changes, and legal acknowledgments."
      />
      <Notice />
      <Nav navigate={navigate} active="admin/access/impersonation" />
      {can(user, "access.impersonation.request") && (
        <article className="pm-card pm-request">
          <div>
            <Eye />
            <div>
              <h2>Request view-only support session</h2>
              <p>Routine internal-account impersonation is prohibited.</p>
            </div>
          </div>
          <label>
            External user
            <select
              value={targetUserId}
              onChange={(e) => setTarget(e.target.value)}
            >
              {authService
                .getState()
                .users.filter((item) => item.userType !== "internal")
                .map((item) => (
                  <option value={item.id} key={item.id}>
                    {item.name} · {item.organization}
                  </option>
                ))}
            </select>
          </label>
          <button className="btn primary" onClick={request}>
            Request impersonation
          </button>
        </article>
      )}
      <div className="pm-table-wrap">
        <table className="pm-table">
          <thead>
            <tr>
              <th>Session</th>
              <th>Administrator</th>
              <th>Target</th>
              <th>Scope / reason</th>
              <th>Status</th>
              <th>Expiry</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {state.impersonations.map((item) => (
              <tr key={item.id}>
                <td>{item.reference}</td>
                <td>
                  {
                    authService
                      .getState()
                      .users.find((entry) => entry.id === item.administratorId)
                      ?.name
                  }
                </td>
                <td>
                  {
                    authService
                      .getState()
                      .users.find((entry) => entry.id === item.targetUserId)
                      ?.name
                  }
                </td>
                <td>
                  <strong>{item.scope}</strong>
                  <span>{item.reason}</span>
                </td>
                <td>
                  <Status value={item.status} />
                </td>
                <td>{date(item.expiresAt)}</td>
                <td>
                  {item.status === "Pending Approval" &&
                    can(user, "access.impersonation.approve") && (
                      <button
                        className="text-action"
                        onClick={() => {
                          try {
                            authorizationService.approveImpersonation(
                              item.id,
                              user,
                            );
                            setRefresh((v) => v + 1);
                          } catch (error) {
                            showToast?.(error.message);
                          }
                        }}
                      >
                        Approve
                      </button>
                    )}
                  {item.status === "Approved" &&
                    item.administratorId === user.id &&
                    can(user, "access.impersonation.start") && (
                      <button
                        className="text-action"
                        onClick={() => {
                          try {
                            authorizationService.startImpersonation(
                              item.id,
                              user,
                            );
                            setRefresh((v) => v + 1);
                          } catch (error) {
                            showToast?.(error.message);
                          }
                        }}
                      >
                        Start
                      </button>
                    )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Reviews({ navigate, showToast }) {
  const { user } = useAuth();
  const [refresh, setRefresh] = useState(0);
  const state = useMemo(() => authorizationService.getState(), [refresh]);
  const decide = (item, decision) => {
    try {
      authorizationService.decideReview(
        item.id,
        decision,
        decision === "Needs Investigation"
          ? "Review scoped critical access and dormant usage."
          : "Reviewer confirmed current business need.",
        user,
      );
      setRefresh((v) => v + 1);
    } catch (error) {
      showToast?.(error.message);
    }
  };
  return (
    <section className="pm-page">
      <Header
        eyebrow="Periodic privileged-access certification"
        title="Access reviews"
        text="Confirm role need, temporary grants, direct decisions, dormant access, conflicts, and critical permissions while preserving review history."
      />
      <Notice />
      <Nav navigate={navigate} active="admin/access/reviews" />
      <div className="pm-list">
        {state.accessReviews.map((item) => (
          <article className="pm-card" key={item.id}>
            <div>
              <strong>{item.reference}</strong>
              <Status value={item.status} />
            </div>
            <h2>{item.name}</h2>
            <p>
              {item.scope} · {item.userIds.length} users · due{" "}
              {date(item.dueAt)}
            </p>
            <small>{item.findings.join(" · ") || "No findings recorded"}</small>
            {can(user, "access.reviews.manage") &&
              !["Completed", "Cancelled"].includes(item.status) && (
                <footer>
                  <button
                    className="btn secondary"
                    onClick={() => decide(item, "Needs Investigation")}
                  >
                    Needs investigation
                  </button>
                  <button
                    className="btn primary"
                    onClick={() => decide(item, "Complete Review")}
                  >
                    Complete review
                  </button>
                </footer>
              )}
          </article>
        ))}
      </div>
    </section>
  );
}

function Conflicts({ navigate, showToast }) {
  const { user } = useAuth();
  const [refresh, setRefresh] = useState(0);
  const state = useMemo(() => authorizationService.getState(), [refresh]);
  return (
    <section className="pm-page">
      <Header
        eyebrow="Separation-of-duties safeguards"
        title="Access conflicts"
        text="Detect incompatible request and final-approval authority, self-approval risks, critical inheritance, and role combinations requiring mitigation."
      />
      <Notice />
      <Nav navigate={navigate} active="admin/access/conflicts" />
      <div className="pm-list">
        {state.conflicts.map((item) => (
          <article className="pm-card pm-conflict" key={item.id}>
            <div>
              <WarningCircle />
              <div>
                <Status value={item.severity} />
                <h2>
                  {
                    authService
                      .getState()
                      .users.find((entry) => entry.id === item.userId)?.name
                  }
                </h2>
              </div>
              <Status value={item.status} />
            </div>
            <p>{item.permissionKeys.join(" + ")}</p>
            <strong>{item.relatedWorkflow}</strong>
            <small>{item.recommendation}</small>
            {item.status === "Open" && can(user, "access.conflicts.manage") && (
              <button
                className="btn primary"
                onClick={() => {
                  try {
                    authorizationService.resolveConflict(
                      item.id,
                      "Mitigated",
                      "Independent senior approval required above threshold.",
                      user,
                    );
                    setRefresh((v) => v + 1);
                  } catch (error) {
                    showToast?.(error.message);
                  }
                }}
              >
                Apply mitigation
              </button>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

export function ImpersonationBanner() {
  const { user } = useAuth();
  const [refresh, setRefresh] = useState(0);
  const context = useMemo(
    () => buildAuthorizationContext(user?.id),
    [user, refresh],
  );
  const session = context.impersonation;
  if (!session) return null;
  const target = authService
    .getState()
    .users.find((item) => item.id === session.targetUserId);
  const remaining = Math.max(
    0,
    Math.ceil((new Date(session.expiresAt) - Date.now()) / 60000),
  );
  return (
    <div className="pm-impersonation" role="status">
      <Fingerprint />
      <span>
        <strong>You are viewing beatmondo as {target?.name}.</strong>
        <small>
          Actions remain attributed to {user.name}. View-only support ·{" "}
          {remaining} minutes remaining · {session.reason}
        </small>
      </span>
      <button
        onClick={() => {
          authorizationService.endImpersonation(session.id, user);
          setRefresh((v) => v + 1);
        }}
      >
        End impersonation
      </button>
    </div>
  );
}

export function renderPermissionsView(view, props) {
  if (view === "admin/access") return <Dashboard {...props} />;
  if (view === "admin/access/users") return <Users {...props} />;
  if (view === "admin/access/user") return <UserDetail {...props} />;
  if (view === "admin/access/roles") return <Roles {...props} />;
  if (view === "admin/access/role") return <RoleDetail {...props} />;
  if (view === "admin/access/permissions") return <Permissions {...props} />;
  if (view === "admin/access/permission")
    return <PermissionDetail {...props} />;
  if (view === "admin/access/requests") return <Requests {...props} />;
  if (view === "admin/access/temporary") return <Temporary {...props} />;
  if (view === "admin/access/delegations") return <Delegations {...props} />;
  if (view === "admin/access/impersonation")
    return <Impersonation {...props} />;
  if (view === "admin/access/reviews") return <Reviews {...props} />;
  if (view === "admin/access/conflicts") return <Conflicts {...props} />;
  return null;
}
