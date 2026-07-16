import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Clock,
  DownloadSimple,
  FileText,
  Funnel,
  Package,
  Plus,
  ShieldCheck,
  TrendUp,
  WarningCircle,
  XCircle,
} from "@phosphor-icons/react";
import { useAuth } from "../auth/AuthContext.jsx";
import { formatPaymentMoney } from "../payments/paymentService.js";
import { DELIVERY_STATUSES } from "./secureDeliveryData.js";
import {
  calculateSecureDeliveryReadiness,
  canDownloadDeliveryAsset,
  secureDeliveryService,
} from "./secureDeliveryService.js";
import { expiringAccessService } from "../expiring-access/expiringAccessService.js";
import "./secureDelivery.css";

export const SECURE_DELIVERY_VIEWS = new Set([
  "admin-deliveries",
  "admin-deliveries-new",
  "admin-delivery-detail",
  "admin-delivery-access",
  "admin-delivery-replacements",
  "admin-delivery-analytics",
  "buyer-deliveries",
  "buyer-delivery",
  "buyer-delivery-room",
]);
const can = (user, permission) =>
  user?.permissions?.includes("*") || user?.permissions?.includes(permission);
const date = (value, withTime = false) =>
  value
    ? new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        ...(withTime ? { timeStyle: "short" } : {}),
      }).format(new Date(value))
    : "—";
const bytes = (value) => {
  if (!value) return "—";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(3, Math.floor(Math.log(value) / Math.log(1024)));
  return `${(value / 1024 ** index).toFixed(index > 1 ? 1 : 0)} ${units[index]}`;
};
const Status = ({ value }) => (
  <span
    className={`sd-status sd-${String(value).toLowerCase().replaceAll(" ", "-")}`}
  >
    {DELIVERY_STATUSES[value]?.buyerLabel || value}
  </span>
);
const Notice = () => (
  <div className="sd-notice">
    <ShieldCheck />
    <span>
      <strong>Simulated secure delivery.</strong> This prototype creates
      controlled records, short-lived mock tokens, and transfer events. It does
      not provide real encrypted storage, signed URLs, CDN delivery, DRM, or
      production-secure file transfer.
    </span>
  </div>
);
const Header = ({ eyebrow, title, text, actions }) => (
  <header className="sd-header">
    <div>
      <span>{eyebrow}</span>
      <h1>{title}</h1>
      <p>{text}</p>
    </div>
    {actions && <div className="sd-actions">{actions}</div>}
  </header>
);
function selectDelivery(id, navigate, target = "admin-delivery-detail") {
  secureDeliveryService.select(id);
  navigate(target);
}

function Metrics({ data }) {
  return (
    <div className="sd-metrics">
      <article>
        <span>Packages</span>
        <strong>{data.packages}</strong>
      </article>
      <article>
        <span>Active delivery</span>
        <strong>{data.active}</strong>
      </article>
      <article>
        <span>Pending controls</span>
        <strong>{data.pending}</strong>
      </article>
      <article>
        <span>Completed downloads</span>
        <strong>{data.downloads}</strong>
      </article>
      <article>
        <span>Success rate</span>
        <strong>{data.successRate}%</strong>
      </article>
      <article>
        <span>Replacements</span>
        <strong>{data.replacements}</strong>
      </article>
    </div>
  );
}

function AdminDashboard({ navigate }) {
  const state = secureDeliveryService.getState();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const deliveries = useMemo(
    () =>
      state.packages.filter(
        (item) =>
          (status === "All" || item.status === status) &&
          [
            item.reference,
            item.licenceReference,
            item.buyer,
            item.organization,
            item.project,
            item.trackTitle,
            ...item.assetEntries.map((asset) => asset.displayName),
          ]
            .join(" ")
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [state, query, status],
  );
  return (
    <section className="sd-page">
      <Header
        eyebrow="Protected asset operations"
        title="Secure delivery"
        text="Prepare, approve, activate, monitor, expire, replace, suspend, and audit licensed delivery packages without exposing private storage."
        actions={
          <button
            className="primary"
            onClick={() => navigate("admin-deliveries-new")}
          >
            <Plus /> Create package
          </button>
        }
      />
      <Notice />
      <Metrics data={secureDeliveryService.getDeliveryAnalytics()} />
      <div className="sd-quick">
        <button onClick={() => navigate("admin-delivery-access")}>
          Access requests <ArrowRight />
        </button>
        <button onClick={() => navigate("admin-delivery-replacements")}>
          Replacements <ArrowRight />
        </button>
        <button onClick={() => navigate("admin-delivery-analytics")}>
          Delivery analytics <ArrowRight />
        </button>
      </div>
      <div className="sd-toolbar">
        <label>
          <Funnel />
          <input
            aria-label="Search deliveries"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search delivery, licence, buyer, project, track or asset"
          />
        </label>
        <select
          aria-label="Filter delivery status"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option>All</option>
          {[...new Set(state.packages.map((item) => item.status))].map(
            (item) => (
              <option key={item}>{item}</option>
            ),
          )}
        </select>
      </div>
      <div className="sd-table-wrap">
        <table className="sd-table">
          <thead>
            <tr>
              <th>Delivery</th>
              <th>Buyer / project</th>
              <th>Licence</th>
              <th>Status</th>
              <th>Assets</th>
              <th>Downloads</th>
              <th>Expiry</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {deliveries.map((item) => (
              <tr key={item.id}>
                <td>
                  <strong>{item.reference || "Draft package"}</strong>
                  <span>
                    v{item.version} · {item.packageType}
                  </span>
                </td>
                <td>
                  <strong>{item.organization}</strong>
                  <span>
                    {item.project} · {item.trackTitle}
                  </span>
                </td>
                <td>{item.licenceReference}</td>
                <td>
                  <Status value={item.status} />
                </td>
                <td>{item.assetEntries.length}</td>
                <td>
                  {item.assetEntries.reduce(
                    (sum, asset) => sum + asset.downloadCount,
                    0,
                  )}{" "}
                  / {item.access.maxTotalDownloads}
                </td>
                <td>{date(item.expiresAt)}</td>
                <td>
                  <button
                    className="text-action"
                    onClick={() => selectDelivery(item.id, navigate)}
                  >
                    Review <ArrowRight />
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

function ReadinessPanel({ result }) {
  const labels = {
    licence: "Licence",
    contract: "Contract",
    payment: "Payment",
    rights: "Rights",
    buyerVerification: "Buyer verification",
    membership: "Membership",
    authorization: "Delivery authorization",
    assets: "Asset readiness",
    expiry: "Package expiry",
    downloadLimits: "Download limits",
    namedAccess: "Named access",
  };
  return (
    <section className={`sd-readiness ${result.ready ? "ready" : "blocked"}`}>
      <header>
        <div>
          <span>Delivery readiness</span>
          <strong>
            {result.percentage}% · {result.status}
          </strong>
        </div>
        <div
          className="sd-ring"
          style={{ "--progress": `${result.percentage * 3.6}deg` }}
        >
          {result.percentage}%
        </div>
      </header>
      <div className="sd-dependencies">
        {Object.entries(result.dependencies).map(([key, value]) => (
          <div key={key}>
            <span>
              {["Complete", "Not Applicable"].includes(value) ? (
                <CheckCircle />
              ) : value === "Warning" ? (
                <WarningCircle />
              ) : (
                <XCircle />
              )}
              {labels[key]}
            </span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      {result.blockers.length > 0 && (
        <p>
          <strong>Blockers:</strong> {result.blockers.join(" · ")}
        </p>
      )}
      {result.warnings.length > 0 && (
        <p className="warning">
          <strong>Warnings:</strong> {result.warnings.join(" · ")}
        </p>
      )}
    </section>
  );
}

function NewDelivery({ navigate, showToast }) {
  const { user } = useAuth();
  const candidates = secureDeliveryService.getEligibleAuthorizations();
  const [authorizationId, setAuthorizationId] = useState(
    candidates.find((item) => item.authorization.status === "Approved")
      ?.authorization.id || candidates[0]?.authorization.id,
  );
  const current = candidates.find(
    (item) => item.authorization.id === authorizationId,
  );
  const [expiryDays, setExpiryDays] = useState(14);
  const [limit, setLimit] = useState(3);
  const [overrideReason, setOverrideReason] = useState("");
  const create = () => {
    try {
      const delivery = secureDeliveryService.createDeliveryPackage(
        {
          authorizationId,
          assetIds: current.authorization.approvedAssetIds,
          namedUserIds: current.authorization.namedUserIds,
          maxDownloadsPerAsset: limit,
          maxTotalDownloads:
            limit * current.authorization.approvedAssetIds.length,
          expiresAt: new Date(Date.now() + expiryDays * 86400000).toISOString(),
          overrideReason,
          buyerNote:
            "Your approved protected assets will appear here after final activation.",
        },
        user,
      );
      showToast("Secure-delivery draft created with locked asset selections.");
      selectDelivery(delivery.id, navigate);
    } catch (error) {
      showToast(error.message);
    }
  };
  return (
    <section className="sd-page">
      <Header
        eyebrow="Controlled package creation"
        title="Create secure delivery"
        text="Start from a current delivery authorization and narrow access to exact users, assets, versions, limits, and expiry."
        actions={
          <button
            className="outline"
            onClick={() => navigate("admin-deliveries")}
          >
            <ArrowLeft /> Dashboard
          </button>
        }
      />
      <Notice />
      <div className="sd-stepper">
        {[
          "Authorization",
          "Buyer",
          "Licence",
          "Assets",
          "Versions",
          "Documents",
          "Access",
          "Expiry",
          "Limits",
          "Notes",
          "Readiness",
          "Approval",
          "Activation",
          "Notify",
        ].map((step, index) => (
          <span className={index === 0 ? "active" : ""} key={step}>
            {index + 1}. {step}
          </span>
        ))}
      </div>
      <div className="sd-grid">
        <section className="sd-card">
          <h2>Delivery authorization</h2>
          <div className="sd-choice-list">
            {candidates.map(({ authorization, licence, packages }) => (
              <button
                key={authorization.id}
                className={
                  authorizationId === authorization.id ? "selected" : ""
                }
                onClick={() => setAuthorizationId(authorization.id)}
              >
                <span>
                  <strong>{authorization.id}</strong>
                  <small>
                    {licence?.reference || authorization.licenceId} ·{" "}
                    {authorization.approvedAssetTypes.join(", ")}
                  </small>
                </span>
                <span>
                  <Status value={authorization.status} />
                  <small>
                    {packages.length} package{packages.length === 1 ? "" : "s"}
                  </small>
                </span>
              </button>
            ))}
          </div>
        </section>
        {current && (
          <section className="sd-card">
            <h2>Access and package policy</h2>
            <dl className="sd-definition">
              <div>
                <dt>Licence</dt>
                <dd>
                  {current.licence?.reference ||
                    current.authorization.licenceId}{" "}
                  · v{current.authorization.licenceVersion}
                </dd>
              </div>
              <div>
                <dt>Organization</dt>
                <dd>
                  {current.licence?.organization ||
                    current.authorization.organizationId}
                </dd>
              </div>
              <div>
                <dt>Named users</dt>
                <dd>{current.authorization.namedUserIds.join(", ")}</dd>
              </div>
              <div>
                <dt>Approved assets</dt>
                <dd>{current.authorization.approvedAssetTypes.join(", ")}</dd>
              </div>
            </dl>
            <label className="sd-field">
              Expiry policy
              <select
                value={expiryDays}
                onChange={(event) => setExpiryDays(Number(event.target.value))}
              >
                <option value={1}>24 hours</option>
                <option value={3}>3 days</option>
                <option value={7}>7 days</option>
                <option value={14}>14 days — VIP</option>
                <option value={30}>30 days — enterprise</option>
              </select>
            </label>
            <label className="sd-field">
              Downloads per asset
              <input
                type="number"
                min="1"
                max="5"
                value={limit}
                onChange={(event) => setLimit(Number(event.target.value))}
              />
            </label>
            {current.packages.length > 0 && (
              <label className="sd-field">
                Controlled duplicate reason
                <input
                  value={overrideReason}
                  onChange={(event) => setOverrideReason(event.target.value)}
                  placeholder="Required because a package already exists"
                />
              </label>
            )}
            <button
              className="primary full"
              disabled={current.authorization.status !== "Approved"}
              onClick={create}
            >
              Create controlled draft <ArrowRight />
            </button>
          </section>
        )}
      </div>
    </section>
  );
}

function ApprovalPanel({ delivery, user, refresh, showToast }) {
  const permission = (type) =>
    type === "Media"
      ? "deliveries.manage_assets"
      : type === "Rights"
        ? "deliveries.suspend"
        : type === "Finance"
          ? "deliveries.confirm_payment"
          : "deliveries.approve";
  return (
    <section className="sd-card">
      <h2>Internal approvals</h2>
      <div className="sd-approvals">
        {delivery.approvals.map((item) => (
          <article key={item.id}>
            <div>
              <strong>{item.type}</strong>
              <span className={`sd-review-${item.status.toLowerCase()}`}>
                {item.status}
              </span>
            </div>
            <p>{item.approver || "Awaiting assigned reviewer"}</p>
            {item.status !== "Approved" && can(user, permission(item.type)) && (
              <button
                className="outline small"
                onClick={() => {
                  try {
                    secureDeliveryService.approve(delivery.id, item.type, user);
                    showToast(`${item.type} approval recorded.`);
                    refresh();
                  } catch (error) {
                    showToast(error.message);
                  }
                }}
              >
                Approve
              </button>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

function DownloadCard({ delivery, asset, user, refresh, showToast }) {
  const [progress, setProgress] = useState(null);
  const [temporaryAccess, setTemporaryAccess] = useState(null);
  const access = canDownloadDeliveryAsset(asset, user, delivery);
  const remaining = Math.max(0, asset.downloadLimit - asset.downloadCount);
  const prepare = () => {
    try {
      const generated = expiringAccessService.generateExpiringAccess(
        {
          resourceType: asset.assetType.toLowerCase().includes("stem")
            ? "Secure delivery stems"
            : "Secure delivery asset",
          resourceLabel: asset.displayName,
          resourceId: asset.id,
          relatedAssetId: asset.assetId,
          relatedDeliveryId: delivery.id,
          relatedLicenceId: delivery.licenceId,
          action: "DOWNLOAD",
        },
        user,
        {
          action: "DOWNLOAD",
          userId: user.id,
          organizationId: user.organizationId,
          deviceBinding: "Current browser session",
          maxUses: 1,
          notificationAction: "buyer-delivery",
        },
      );
      setTemporaryAccess(generated);
      setProgress(null);
      showToast(
        "Short-lived download access prepared. The protected file location remains hidden.",
      );
    } catch (error) {
      showToast(error.message);
    }
  };
  const simulate = async (fail = false) => {
    try {
      if (!temporaryAccess)
        throw new Error("Prepare a fresh temporary download access first.");
      const exchange = expiringAccessService.exchangeExpiringAccess(
        temporaryAccess.token,
        { user, action: "DOWNLOAD", deviceBinding: "Current browser session" },
      );
      const session = exchange.session;
      setProgress({ status: "Preparing", value: 10, sessionId: session.id });
      await new Promise((resolve) => setTimeout(resolve, 180));
      setProgress({ status: "Authorized", value: 30, sessionId: session.id });
      await new Promise((resolve) => setTimeout(resolve, 180));
      setProgress({ status: "Downloading", value: 72, sessionId: session.id });
      await new Promise((resolve) => setTimeout(resolve, 240));
      if (fail) {
        secureDeliveryService.failDownloadSession(
          session.id,
          "NETWORK_INTERRUPTED",
          user,
        );
        setProgress({ status: "Failed", value: 72, sessionId: session.id });
        setTemporaryAccess(null);
        showToast(
          "Transfer interrupted; no entitlement count was consumed. Prepare a new link to retry.",
        );
      } else {
        secureDeliveryService.completeDownloadSession(session.id, user);
        setProgress({ status: "Completed", value: 100, sessionId: session.id });
        setTemporaryAccess(null);
        showToast(
          "Simulated delivery completed. No real master file was transferred.",
        );
      }
      refresh();
    } catch (error) {
      setProgress({ status: "Failed", value: 0 });
      setTemporaryAccess(null);
      showToast(error.message);
      refresh();
    }
  };
  return (
    <article className="sd-asset">
      <header>
        <div className="sd-file-icon">{asset.format}</div>
        <div>
          <span>{asset.assetType}</span>
          <h3>{asset.displayName}</h3>
          <p>
            {bytes(asset.sizeBytes)} · Version {asset.assetVersion} ·{" "}
            {asset.status}
          </p>
        </div>
      </header>
      <div className="sd-asset-meta">
        <span>
          <small>Downloads remaining</small>
          <strong>
            {remaining} of {asset.downloadLimit}
          </strong>
        </span>
        <span>
          <small>Package access expiry</small>
          <strong>{date(asset.expiresAt)}</strong>
        </span>
        <span>
          <small>Locked version</small>
          <strong>v{asset.assetVersion}</strong>
        </span>
      </div>
      {temporaryAccess && (
        <div className="sd-temp-access" role="status">
          <ShieldCheck />
          <span>
            <strong>Temporary download access ready</strong>
            {temporaryAccess.reference} · expires{" "}
            {date(temporaryAccess.expiresAt, true)} · single use
          </span>
        </div>
      )}
      {progress && (
        <div
          className={`sd-progress ${progress.status.toLowerCase()}`}
          role="status"
          aria-live="polite"
        >
          <div>
            <span>{progress.status}</span>
            <strong>{progress.value}%</strong>
          </div>
          <progress max="100" value={progress.value}>
            {progress.value}%
          </progress>
          {progress.status === "Failed" && (
            <button className="text-action" onClick={prepare}>
              Prepare new download link
            </button>
          )}
        </div>
      )}
      <div className="sd-asset-actions">
        {temporaryAccess ? (
          <>
            <button
              className="primary"
              aria-label={`Start temporary download for ${asset.displayName}, ${asset.format}`}
              onClick={() => simulate(false)}
            >
              <DownloadSimple /> Start {asset.format} download
            </button>
            <button className="text-action" onClick={() => simulate(true)}>
              Simulate failure
            </button>
          </>
        ) : (
          <button
            className="primary"
            disabled={!access.allowed || progress?.status === "Downloading"}
            aria-label={`Prepare download for ${asset.displayName}, ${asset.format}`}
            onClick={prepare}
          >
            <DownloadSimple /> Prepare Download
          </button>
        )}
      </div>
      {!access.allowed && (
        <p className="sd-denial">
          <WarningCircle /> {access.reason}
        </p>
      )}
    </article>
  );
}

function DeliveryDetail({ navigate, showToast, buyer = false }) {
  const { user } = useAuth();
  const [, setTick] = useState(0);
  const refresh = () => setTick((value) => value + 1);
  const id = secureDeliveryService.selected();
  const delivery =
    secureDeliveryService.getDelivery(id) ||
    (buyer
      ? secureDeliveryService.getBuyerDeliveries(user)[0]
      : secureDeliveryService.getDeliveryQueue()[0]);
  if (
    !delivery ||
    (buyer &&
      delivery.buyerId !== user.id &&
      delivery.organizationId !== user.organizationId)
  )
    return (
      <section className="sd-page">
        <Header
          eyebrow="Secure delivery"
          title="Delivery unavailable"
          text="This package is not available to your organization."
        />
      </section>
    );
  const state = secureDeliveryService.getState();
  const readiness = calculateSecureDeliveryReadiness(delivery);
  const sessions = state.sessions.filter(
    (item) => item.deliveryPackageId === delivery.id,
  );
  const entitlements = state.entitlements.filter(
    (item) => item.deliveryPackageId === delivery.id,
  );
  const action = (fn, message) => {
    try {
      fn();
      showToast(message);
      refresh();
    } catch (error) {
      showToast(error.message);
    }
  };
  const openManifest = () => {
    try {
      const generated = expiringAccessService.generateExpiringAccess(
        {
          resourceType: "Delivery manifest",
          resourceLabel: `${delivery.reference} delivery manifest`,
          resourceId: delivery.manifest.id,
          relatedDeliveryId: delivery.id,
          relatedLicenceId: delivery.licenceId,
          action: "VIEW",
        },
        user,
        {
          action: "VIEW",
          userId: buyer ? user.id : null,
          organizationId: delivery.organizationId,
          allowedMethods: ["VIEW", "DOWNLOAD"],
          maxUses: 3,
          policyId: "policy-delivery-manifest",
        },
      );
      window.location.hash = `access/${generated.token}`;
    } catch (error) {
      showToast(error.message);
    }
  };
  return (
    <section className={`sd-page ${buyer ? "sd-buyer" : ""}`}>
      <Header
        eyebrow={
          buyer ? "Private project delivery room" : "Delivery control record"
        }
        title={delivery.reference || `${delivery.project} package`}
        text={`${delivery.organization} · ${delivery.trackTitle} by ${delivery.artist}`}
        actions={
          <>
            <button
              className="outline"
              onClick={() =>
                navigate(buyer ? "buyer-deliveries" : "admin-deliveries")
              }
            >
              <ArrowLeft /> Back
            </button>
            {buyer && (
              <button
                className="outline"
                onClick={() => navigate("buyer-delivery-room")}
              >
                <Package /> Delivery room
              </button>
            )}
          </>
        }
      />
      <Notice />
      <div className="sd-summary">
        <div>
          <span>Status</span>
          <Status value={delivery.status} />
        </div>
        <div>
          <span>Licence</span>
          <strong>{delivery.licenceReference}</strong>
        </div>
        <div>
          <span>Package version</span>
          <strong>v{delivery.version}</strong>
        </div>
        <div>
          <span>Expires</span>
          <strong>{date(delivery.expiresAt)}</strong>
        </div>
        <div>
          <span>Total allowance</span>
          <strong>{delivery.access.maxTotalDownloads} downloads</strong>
        </div>
      </div>
      {!buyer && <ReadinessPanel result={readiness} />}
      <div className="sd-grid">
        <section className="sd-card">
          <h2>Buyer, project and licence</h2>
          <dl className="sd-definition">
            <div>
              <dt>Buyer</dt>
              <dd>{delivery.buyer}</dd>
            </div>
            <div>
              <dt>Organization</dt>
              <dd>{delivery.organization}</dd>
            </div>
            <div>
              <dt>Project</dt>
              <dd>{delivery.project}</dd>
            </div>
            <div>
              <dt>Recording</dt>
              <dd>
                {delivery.trackTitle} · {delivery.artist}
              </dd>
            </div>
            <div>
              <dt>Licence</dt>
              <dd>
                {delivery.licenceReference} · v{delivery.licenceVersion}
              </dd>
            </div>
            <div>
              <dt>Authorization</dt>
              <dd>{delivery.authorizationId}</dd>
            </div>
          </dl>
        </section>
        <section className="sd-card">
          <h2>Access rules</h2>
          <dl className="sd-definition">
            <div>
              <dt>Access scope</dt>
              <dd>
                {delivery.access.organizationWide
                  ? "Approved organization users"
                  : "Named users only"}
              </dd>
            </div>
            <div>
              <dt>Named users</dt>
              <dd>{delivery.access.namedUserIds.join(", ") || "None"}</dd>
            </div>
            <div>
              <dt>Devices</dt>
              <dd>{delivery.access.maxDevices} maximum</dd>
            </div>
            <div>
              <dt>Sessions</dt>
              <dd>{delivery.access.maxActiveSessions} active</dd>
            </div>
            <div>
              <dt>Per asset</dt>
              <dd>{delivery.access.maxDownloadsPerAsset} downloads</dd>
            </div>
          </dl>
          <h3>Buyer-visible delivery note</h3>
          <p>{delivery.deliveryNotes.buyer}</p>
          {!buyer && (
            <>
              <h3>Internal note</h3>
              <p>{delivery.deliveryNotes.internal || "No internal note."}</p>
            </>
          )}
        </section>
      </div>
      <section className="sd-section">
        <div className="sd-section-head">
          <div>
            <span>Locked package contents</span>
            <h2>Approved delivery assets</h2>
          </div>
          <p>
            {delivery.assetEntries.length} exact asset version
            {delivery.assetEntries.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="sd-assets">
          {delivery.assetEntries.map((asset) =>
            buyer ? (
              <DownloadCard
                key={asset.id}
                delivery={delivery}
                asset={asset}
                user={user}
                refresh={refresh}
                showToast={showToast}
              />
            ) : (
              <article className="sd-asset sd-admin-asset" key={asset.id}>
                <header>
                  <div className="sd-file-icon">{asset.format}</div>
                  <div>
                    <span>{asset.assetType}</span>
                    <h3>{asset.displayName}</h3>
                    <p>
                      {asset.fileName} · {bytes(asset.sizeBytes)}
                    </p>
                  </div>
                  <Status value={asset.status} />
                </header>
                <div className="sd-version-lock">
                  <ShieldCheck />
                  <span>
                    <strong>Version locked</strong>Asset version{" "}
                    {asset.assetVersion} · checksum placeholder{" "}
                    {asset.checksumPlaceholder}
                  </span>
                </div>
                <div className="sd-asset-meta">
                  <span>
                    <small>Required</small>
                    <strong>{asset.required ? "Yes" : "Optional"}</strong>
                  </span>
                  <span>
                    <small>Downloads</small>
                    <strong>
                      {asset.downloadCount} / {asset.downloadLimit}
                    </strong>
                  </span>
                  <span>
                    <small>Expires</small>
                    <strong>{date(asset.expiresAt)}</strong>
                  </span>
                </div>
              </article>
            ),
          )}
        </div>
      </section>
      {delivery.documentEntries.length > 0 && (
        <section className="sd-card">
          <h2>Commercial documents</h2>
          <div className="sd-documents">
            {delivery.documentEntries.map((doc) => (
              <article key={doc.id}>
                <FileText />
                <span>
                  <strong>{doc.displayName}</strong>
                  {doc.type} · v{doc.version}
                </span>
              </article>
            ))}
          </div>
        </section>
      )}
      {delivery.manifest && (
        <section className="sd-manifest">
          <header>
            <div>
              <span>Buyer-safe manifest</span>
              <h2>{delivery.manifest.reference}</h2>
            </div>
            <button className="outline" onClick={openManifest}>
              <DownloadSimple /> Open manifest
            </button>
          </header>
          <p>
            Records the delivery reference, licence, package version, buyer,
            approved assets, locked versions, checksum placeholders, expiry,
            download limits, restrictions, and support contact.
          </p>
        </section>
      )}
      {!buyer && (
        <ApprovalPanel
          delivery={delivery}
          user={user}
          refresh={refresh}
          showToast={showToast}
        />
      )}
      {!buyer && (
        <section className="sd-actions-bar">
          <div>
            <strong>Controlled delivery actions</strong>
            <span>
              Every status change preserves prior sessions, events, and package
              versions.
            </span>
          </div>
          {delivery.status === "Draft" && (
            <button
              className="outline"
              onClick={() =>
                action(
                  () =>
                    secureDeliveryService.requestApproval(delivery.id, user),
                  "Approval workflow started.",
                )
              }
            >
              Request approval
            </button>
          )}
          {!delivery.manifest && can(user, "manifests.generate") && (
            <button
              className="outline"
              onClick={() =>
                action(
                  () =>
                    secureDeliveryService.generateDeliveryManifest(
                      delivery.id,
                      user,
                    ),
                  "Buyer-safe manifest generated.",
                )
              }
            >
              Generate manifest
            </button>
          )}
          {delivery.status === "Ready to Activate" && (
            <button
              className="primary"
              onClick={() =>
                action(
                  () =>
                    secureDeliveryService.activateDelivery(delivery.id, user),
                  "Secure-delivery package activated.",
                )
              }
            >
              Activate delivery
            </button>
          )}
          {activePackageStatuses.includes(delivery.status) &&
            can(user, "deliveries.suspend") && (
              <button
                className="warning-button"
                onClick={() =>
                  action(
                    () =>
                      secureDeliveryService.changeStatus(
                        delivery.id,
                        "Suspended",
                        "Temporary rights and licensing review",
                        user,
                      ),
                    "Delivery suspended; active sessions were revoked.",
                  )
                }
              >
                Suspend
              </button>
            )}
          {delivery.status === "Suspended" &&
            can(user, "deliveries.restore") && (
              <button
                className="outline"
                onClick={() =>
                  action(
                    () =>
                      secureDeliveryService.changeStatus(
                        delivery.id,
                        "Active",
                        "Dependencies revalidated",
                        user,
                      ),
                    "Delivery access restored.",
                  )
                }
              >
                Restore
              </button>
            )}
          {!["Revoked", "Superseded"].includes(delivery.status) &&
            can(user, "deliveries.revoke") && (
              <button
                className="danger"
                onClick={() =>
                  action(
                    () =>
                      secureDeliveryService.changeStatus(
                        delivery.id,
                        "Revoked",
                        "Manual secure-delivery revocation",
                        user,
                      ),
                    "Delivery revoked; historical events preserved.",
                  )
                }
              >
                Revoke
              </button>
            )}
          {can(user, "deliveries.manage_expiry") && (
            <button
              className="outline"
              onClick={() =>
                action(
                  () => secureDeliveryService.expireDelivery(delivery.id, user),
                  "Package expiry simulated.",
                )
              }
            >
              Simulate expiry
            </button>
          )}
        </section>
      )}
      {buyer && (
        <ExtensionPanel delivery={delivery} user={user} showToast={showToast} />
      )}
      {!buyer && (
        <History
          sessions={sessions}
          entitlements={entitlements}
          state={state}
          delivery={delivery}
        />
      )}
    </section>
  );
}

const activePackageStatuses = [
  "Active",
  "Partially Downloaded",
  "Completed",
  "Expiring Soon",
  "Replacement Ready",
];
function ExtensionPanel({ delivery, user, showToast }) {
  const [type, setType] = useState("More time");
  const [reason, setReason] = useState("");
  return (
    <section className="sd-card sd-extension">
      <h2>Request delivery support</h2>
      <p>
        Requests do not silently renew access or add unlicensed assets.
        Licensing will revalidate the licence, rights, payment, and access
        policy.
      </p>
      <div>
        <label>
          Request type
          <select
            value={type}
            onChange={(event) => setType(event.target.value)}
          >
            <option>More time</option>
            <option>Additional download</option>
            <option>New user access</option>
            <option>Replacement asset</option>
            <option>Additional approved asset</option>
          </select>
        </label>
        <label>
          Reason
          <input
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Explain the production need"
          />
        </label>
        <button
          className="outline"
          disabled={!reason.trim()}
          onClick={() => {
            try {
              secureDeliveryService.requestDeliveryExtension(
                delivery.id,
                { requestType: type, reason },
                user,
              );
              setReason("");
              showToast("Delivery request submitted for controlled review.");
            } catch (error) {
              showToast(error.message);
            }
          }}
        >
          Submit request
        </button>
      </div>
    </section>
  );
}

function History({ sessions, entitlements, state, delivery }) {
  const events = state.activity.filter(
    (item) =>
      item.delivery === delivery.reference ||
      (item.delivery === null && item.project === delivery.project),
  );
  return (
    <div className="sd-grid">
      <section className="sd-card">
        <h2>Download entitlements</h2>
        <div className="sd-list">
          {entitlements.map((item) => (
            <article key={item.id}>
              <span>
                <strong>
                  {
                    delivery.assetEntries.find(
                      (asset) => asset.id === item.assetEntryId,
                    )?.displayName
                  }
                </strong>
                {item.userId} · expires {date(item.expiresAt)}
              </span>
              <span>
                {item.downloadCount} / {item.downloadLimit}
                <small>{item.status}</small>
              </span>
            </article>
          ))}
        </div>
        {!entitlements.length && (
          <p className="muted">
            Entitlements are created only when the package activates.
          </p>
        )}
      </section>
      <section className="sd-card">
        <h2>Download sessions</h2>
        <div className="sd-list">
          {sessions.map((session) => (
            <article key={session.id}>
              <span>
                <strong>{session.id}</strong>
                {session.device} · {session.approximateLocation}
              </span>
              <span>
                {session.status}
                <small>{bytes(session.bytesTransferred)}</small>
              </span>
            </article>
          ))}
        </div>
        {!sessions.length && (
          <p className="muted">No sessions have been created.</p>
        )}
      </section>
      <section className="sd-card full-grid">
        <h2>Audit activity</h2>
        <div className="sd-timeline">
          {events.slice(0, 10).map((event) => (
            <article key={event.id}>
              <i />
              <div>
                <strong>{event.action}</strong>
                <p>{event.description}</p>
                <span>
                  {event.actor} · {date(event.timestamp, true)} ·{" "}
                  {event.visibility}
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function BuyerList({ navigate }) {
  const { user } = useAuth();
  const [filter, setFilter] = useState("All");
  const items = secureDeliveryService
    .getBuyerDeliveries(user)
    .filter((item) => filter === "All" || item.status === filter);
  return (
    <section className="sd-page sd-buyer">
      <Header
        eyebrow="Protected project access"
        title="Secure deliveries"
        text="Open approved project delivery rooms, review exact licence scope, and access only the asset versions authorized for your organization."
      />
      <Notice />
      <div className="sd-separation">
        <div>
          <strong>Protected preview</strong>
          <span>Stream-only discovery excerpt</span>
        </div>
        <ArrowRight />
        <div>
          <strong>Issued licence</strong>
          <span>Legal commercial scope</span>
        </div>
        <ArrowRight />
        <div>
          <strong>Secure delivery</strong>
          <span>Temporary asset-specific entitlement</span>
        </div>
      </div>
      <div className="sd-toolbar">
        <select
          aria-label="Filter my deliveries"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
        >
          <option>All</option>
          {[...new Set(items.map((item) => item.status))].map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </div>
      <div className="sd-buyer-list">
        {items.map((item) => (
          <article key={item.id}>
            <div className="sd-buyer-card-head">
              <div>
                <span>{item.reference || "Package in preparation"}</span>
                <h2>{item.project}</h2>
                <p>
                  {item.trackTitle} · {item.artist}
                </p>
              </div>
              <Status value={item.status} />
            </div>
            <div className="sd-buyer-package">
              <span>
                <small>Licence</small>
                {item.licenceReference}
              </span>
              <span>
                <small>Approved assets</small>
                {item.assetEntries.length}
              </span>
              <span>
                <small>Access expires</small>
                {date(item.expiresAt)}
              </span>
              <span>
                <small>Downloads used</small>
                {item.assetEntries.reduce(
                  (sum, asset) => sum + asset.downloadCount,
                  0,
                )}{" "}
                / {item.access.maxTotalDownloads}
              </span>
            </div>
            <p>{item.deliveryNotes.buyer}</p>
            <button
              className="text-action"
              onClick={() =>
                selectDelivery(item.id, navigate, "buyer-delivery")
              }
            >
              Open secure delivery <ArrowRight />
            </button>
          </article>
        ))}
      </div>
      {!items.length && (
        <div className="sd-empty">
          <Package />
          <h2>No delivery packages</h2>
          <p>Approved packages for your organization will appear here.</p>
        </div>
      )}
    </section>
  );
}

function BuyerRoom(props) {
  return <DeliveryDetail {...props} buyer />;
}

function AccessRequests({ navigate, showToast }) {
  const { user } = useAuth();
  const [, setTick] = useState(0);
  const state = secureDeliveryService.getState();
  const decide = (request, decision) => {
    try {
      secureDeliveryService.decideExtension(
        request.id,
        decision,
        {
          reason: "Reviewed against current licence and delivery policy.",
          extraDownloads:
            decision === "Approved" &&
            request.requestType === "Additional download"
              ? 1
              : 0,
          expiresAt:
            decision === "Approved" && request.requestType === "More time"
              ? new Date(Date.now() + 7 * 86400000).toISOString()
              : null,
          buyerMessage: `Your ${request.requestType.toLowerCase()} request was ${decision.toLowerCase()} after current eligibility review.`,
        },
        user,
      );
      showToast(`Request ${decision.toLowerCase()}.`);
      setTick((value) => value + 1);
    } catch (error) {
      showToast(error.message);
    }
  };
  return (
    <section className="sd-page">
      <Header
        eyebrow="Access governance"
        title="Delivery access requests"
        text="Review time, download, user, replacement, and approved-asset requests without erasing prior events or silently expanding licence scope."
        actions={
          <button
            className="outline"
            onClick={() => navigate("admin-deliveries")}
          >
            <ArrowLeft /> Dashboard
          </button>
        }
      />
      <Notice />
      <div className="sd-request-list">
        {state.extensionRequests.map((request) => {
          const delivery = state.packages.find(
            (item) => item.id === request.deliveryPackageId,
          );
          return (
            <article key={request.id}>
              <div>
                <span>{delivery?.reference || delivery?.project}</span>
                <h2>{request.requestType}</h2>
                <p>{request.reason}</p>
                <small>
                  {delivery?.organization} · {date(request.createdAt, true)}
                </small>
              </div>
              <div>
                <Status value={request.status} />
                {request.status === "Pending Review" && (
                  <>
                    <button
                      className="outline small"
                      onClick={() => decide(request, "Rejected")}
                    >
                      Reject
                    </button>
                    <button
                      className="primary small"
                      onClick={() => decide(request, "Approved")}
                    >
                      Approve
                    </button>
                  </>
                )}
              </div>
            </article>
          );
        })}
      </div>
      {!state.extensionRequests.length && (
        <div className="sd-empty">
          <CheckCircle />
          <h2>No open access requests</h2>
          <p>The review queue is clear.</p>
        </div>
      )}
    </section>
  );
}

function Replacements({ navigate, showToast }) {
  const { user } = useAuth();
  const state = secureDeliveryService.getState();
  return (
    <section className="sd-page">
      <Header
        eyebrow="Immutable package versioning"
        title="Replacement deliveries"
        text="Correct assets through a new locked package version while preserving original package, entitlement, session, and download history."
        actions={
          <button
            className="outline"
            onClick={() => navigate("admin-deliveries")}
          >
            <ArrowLeft /> Dashboard
          </button>
        }
      />
      <Notice />
      <div className="sd-request-list">
        {state.replacementRecords.map((record) => {
          const original = state.packages.find(
            (item) => item.id === record.packageId,
          );
          const replacement = state.packages.find(
            (item) => item.id === record.replacementPackageId,
          );
          return (
            <article key={record.id}>
              <div>
                <span>
                  {original?.reference} → {replacement?.reference}
                </span>
                <h2>{replacement?.project}</h2>
                <p>{record.reason} · original history preserved</p>
              </div>
              <button
                className="text-action"
                onClick={() => selectDelivery(replacement.id, navigate)}
              >
                Review V{replacement?.version} <ArrowRight />
              </button>
            </article>
          );
        })}
      </div>
      <section className="sd-card">
        <h2>Create a replacement demo</h2>
        <p>
          Select an active package’s first asset from its detail view in
          production. This prototype demonstrates the controlled operation using
          the active VIP package.
        </p>
        <button
          className="outline"
          onClick={() => {
            try {
              const original = state.packages.find(
                (item) => item.id === "delivery-package-16",
              );
              const pkg = secureDeliveryService.createReplacementPackage(
                original.id,
                original.assetEntries[1].id,
                {
                  assetId: `asset-instrumental-demo-v${Date.now()}`,
                  assetVersion: 3,
                  displayName: "Afterglow Drive — Instrumental V3",
                  fileName: "afterglow-drive-instrumental-v3.wav",
                  reason: "Buyer-confirmed audio defect",
                },
                user,
              );
              showToast(
                "Replacement package version created; original history preserved.",
              );
              selectDelivery(pkg.id, navigate);
            } catch (error) {
              showToast(error.message);
            }
          }}
        >
          Create controlled replacement
        </button>
      </section>
    </section>
  );
}

function Analytics({ navigate }) {
  const data = secureDeliveryService.getDeliveryAnalytics();
  const rows = [
    ["Active packages", data.active],
    ["Pending controls", data.pending],
    ["Expired packages", data.expired],
    ["Suspended packages", data.suspended],
    ["Revoked packages", data.revoked],
    ["Replacement versions", data.replacements],
  ];
  return (
    <section className="sd-page">
      <Header
        eyebrow="Delivery intelligence"
        title="Secure-delivery analytics"
        text="Operational mock metrics across package creation, asset delivery, download outcomes, extensions, lifecycle, and replacements."
        actions={
          <button
            className="outline"
            onClick={() => navigate("admin-deliveries")}
          >
            <ArrowLeft /> Dashboard
          </button>
        }
      />
      <Notice />
      <Metrics data={data} />
      <div className="sd-grid">
        <section className="sd-card">
          <h2>Lifecycle distribution</h2>
          <div className="sd-chart">
            {rows.map(([label, value]) => (
              <div key={label}>
                <span>{label}</span>
                <div>
                  <i
                    style={{
                      width: `${Math.max(3, (value / Math.max(1, data.packages)) * 100)}%`,
                    }}
                  />
                </div>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        </section>
        <section className="sd-card">
          <h2>Assets delivered by type</h2>
          <div className="sd-type-stats">
            <article>
              <span>Masters</span>
              <strong>{data.masters}</strong>
            </article>
            <article>
              <span>Instrumentals</span>
              <strong>{data.instrumentals}</strong>
            </article>
            <article>
              <span>Stem packages</span>
              <strong>{data.stems}</strong>
            </article>
            <article>
              <span>Failed sessions</span>
              <strong>{data.failures}</strong>
            </article>
          </div>
        </section>
      </div>
    </section>
  );
}

export function renderSecureDeliveryView(view, props) {
  if (view === "admin-deliveries") return <AdminDashboard {...props} />;
  if (view === "admin-deliveries-new") return <NewDelivery {...props} />;
  if (view === "admin-delivery-detail") return <DeliveryDetail {...props} />;
  if (view === "admin-delivery-access") return <AccessRequests {...props} />;
  if (view === "admin-delivery-replacements")
    return <Replacements {...props} />;
  if (view === "admin-delivery-analytics") return <Analytics {...props} />;
  if (view === "buyer-deliveries") return <BuyerList {...props} />;
  if (["buyer-delivery", "buyer-delivery-room"].includes(view))
    return <BuyerRoom {...props} />;
  return null;
}
